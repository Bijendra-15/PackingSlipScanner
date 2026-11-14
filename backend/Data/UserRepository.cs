using System.Collections.Concurrent;
using System.Security.Cryptography;
using backend.Models;

namespace backend.Data;

public interface IUserRepository
{
    Task<User?> ValidateCredentialsAsync(string userName, string password, CancellationToken ct = default);
    Task<User?> GetByUserNameAsync(string userName, CancellationToken ct = default);
    Task<User> CreateAsync(User user, string password, CancellationToken ct = default);
    Task<bool> UpdateLastLoginAsync(int userId, CancellationToken ct = default);
}

public sealed class InMemoryUserRepository : IUserRepository
{
    private readonly ConcurrentDictionary<int, User> _users = new();
    private readonly ConcurrentDictionary<string, int> _userNameIndex = new();
    private int _nextId = 1;
    private readonly object _lock = new();

    public InMemoryUserRepository()
    {
        // Seed a default admin account so the app is usable out of the box.
        // Password: "admin123"
        SeedUser(new User
        {
            UserId = 1,
            UserName = "admin",
            PasswordHash = PasswordHasher.Hash("admin123"),
            RoleId = UserRoles.Admin,
            AppName = "DispatchGenerator",
            CreatedAt = DateTime.UtcNow
        });
    }

    private void SeedUser(User user)
    {
        _users[user.UserId] = user;
        _userNameIndex[user.UserName] = user.UserId;
    }

    public Task<User?> ValidateCredentialsAsync(string userName, string password, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(userName) || string.IsNullOrEmpty(password))
            return Task.FromResult<User?>(null);

        var normalized = userName.Trim();
        if (!_userNameIndex.TryGetValue(normalized, out var userId))
            return Task.FromResult<User?>(null);

        if (!_users.TryGetValue(userId, out var user) || !user.IsActive)
            return Task.FromResult<User?>(null);

        if (!PasswordHasher.Verify(password, user.PasswordHash))
            return Task.FromResult<User?>(null);

        return Task.FromResult<User?>(user);
    }

    public Task<User?> GetByUserNameAsync(string userName, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(userName))
            return Task.FromResult<User?>(null);

        var normalized = userName.Trim();
        if (!_userNameIndex.TryGetValue(normalized, out var userId))
            return Task.FromResult<User?>(null);

        _users.TryGetValue(userId, out var user);
        return Task.FromResult(user);
    }

    public Task<User> CreateAsync(User user, string password, CancellationToken ct = default)
    {
        if (string.IsNullOrEmpty(password))
            throw new ArgumentException("Password is required.", nameof(password));

        user.PasswordHash = PasswordHasher.Hash(password);
        user.UserName = (user.UserName ?? string.Empty).Trim();

        lock (_lock)
        {
            user.UserId = _nextId++;
            _users[user.UserId] = user;
            _userNameIndex[user.UserName] = user.UserId;
        }

        return Task.FromResult(user);
    }

    public Task<bool> UpdateLastLoginAsync(int userId, CancellationToken ct = default)
    {
        if (_users.TryGetValue(userId, out var user))
        {
            user.LastLoginAt = DateTime.UtcNow;
            return Task.FromResult(true);
        }
        return Task.FromResult(false);
    }
}

public static class PasswordHasher
{
    /// <summary>
    /// Hashes a password using PBKDF2-SHA256 with a random salt.
    /// Format: base64(salt:hash)
    /// </summary>
    public static string Hash(string password)
    {
        var salt = RandomNumberGenerator.GetBytes(SaltSize);
        var hash = Rfc2898DeriveBytes.Pbkdf2(
            password,
            salt,
            Iterations,
            HashAlgorithmName.SHA256,
            HashSize);

        return Convert.ToBase64String(salt.Concat(hash).ToArray());
    }

    public static bool Verify(string password, string passwordHash)
    {
        if (string.IsNullOrEmpty(passwordHash))
            return false;

        byte[] hashBytes;
        try
        {
            hashBytes = Convert.FromBase64String(passwordHash);
        }
        catch
        {
            return false;
        }

        if (hashBytes.Length < SaltSize + HashSize)
            return false;

        var salt = hashBytes[..SaltSize];
        var storedHash = hashBytes[SaltSize..(SaltSize + HashSize)];

        var computed = Rfc2898DeriveBytes.Pbkdf2(
            password,
            salt,
            Iterations,
            HashAlgorithmName.SHA256,
            HashSize);

        return CryptographicOperations.FixedTimeEquals(computed, storedHash);
    }

    private const int SaltSize = 16;
    private const int HashSize = 32;
    private const int Iterations = 100_000;
}
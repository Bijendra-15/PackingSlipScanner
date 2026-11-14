namespace backend.Models;

public enum UserRole
{
    Admin = 15,      // Dispatch generator role -> home
    FinYear = 23,    // Financial year role -> finyear page
    FinYearAlt = 24  // Alternate financial year role -> finyear page
}

public sealed class User
{
    public int UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public int RoleId { get; set; }
    public string? AppName { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LastLoginAt { get; set; }
}

public static class UserRoles
{
    public const int Admin = (int)UserRole.Admin;
    public const int FinYear = (int)UserRole.FinYear;
    public const int FinYearAlt = (int)UserRole.FinYearAlt;

    public static bool IsFinYearRole(int roleId) =>
        roleId == FinYear || roleId == FinYearAlt;
}
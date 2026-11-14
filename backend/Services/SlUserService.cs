using backend.Models;
using Microsoft.Extensions.Configuration;
using Oracle.ManagedDataAccess.Client;

namespace backend.Services;

public class SlUserService(IConfiguration config)
{
    private readonly string _connectionString = config.GetConnectionString("DBOracle")
        ?? throw new InvalidOperationException("Oracle connection string not configured.");

    public async Task<User?> GetUserByUserNameAndPasswordAsync(string userName, string password)
    {
        const string sql = @"SELECT USER_ID, USER_NAME, ROLE_ID, DISPLAY_NAME, STATUS
                             FROM SL_USERS
                             WHERE USER_NAME = :userName AND PASSWORD = :password AND NVL(DELETED,0) = 0";

        using var conn = new OracleConnection(_connectionString);
        await conn.OpenAsync();
        using var cmd = new OracleCommand(sql, conn) { BindByName = true };
        cmd.Parameters.Add("userName", userName);
        cmd.Parameters.Add("password", password);
        using var reader = await cmd.ExecuteReaderAsync();
        if (await reader.ReadAsync())
        {
            return new User
            {
                UserId = Convert.ToInt32(reader["USER_ID"]),
                UserName = reader["USER_NAME"]?.ToString() ?? string.Empty,
                RoleId = Convert.ToInt32(reader["ROLE_ID"]),
                AppName = reader["DISPLAY_NAME"]?.ToString()
            };
        }
        return null;
    }

    public async Task<int> ChangePasswordAsync(int userId, string password)
    {
        const string sql = "UPDATE SL_USERS SET PASSWORD = :password WHERE USER_ID = :userId";

        using var conn = new OracleConnection(_connectionString);
        await conn.OpenAsync();
        using var cmd = new OracleCommand(sql, conn) { BindByName = true };
        cmd.Parameters.Add("password", password);
        cmd.Parameters.Add("userId", userId);
        return await cmd.ExecuteNonQueryAsync();
    }
}

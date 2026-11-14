using Microsoft.Extensions.Configuration;
using Oracle.ManagedDataAccess.Client;

namespace backend.Services;

public class SlConfigService(IConfiguration config)
{
    private readonly string _connectionString = config.GetConnectionString("DBOracle")
        ?? throw new InvalidOperationException("Oracle connection string not configured.");

    public async Task<string?> GetValueByKeyAsync(string key)
    {
        const string sql = @"SELECT VALUE FROM SL_CONFIG WHERE KEY = :key";
        using var conn = new OracleConnection(_connectionString);
        await conn.OpenAsync();
        using var cmd = new OracleCommand(sql, conn) { BindByName = true };
        cmd.Parameters.Add("key", key);
        var result = await cmd.ExecuteScalarAsync();
        return result == null || result == DBNull.Value ? null : result.ToString();
    }
}

public class SlAppLoggingService(IConfiguration config)
{
    private readonly string _connectionString = config.GetConnectionString("DBOracle")
        ?? throw new InvalidOperationException("Oracle connection string not configured.");

    public async Task LogAsync(int userId, string userName, string actionResult, string? deviceSignature = null)
    {
        const string sql = @"INSERT INTO SL_APP_LOGGING (USER_ID, USER_NAME, ACTION_RESULT, DEVICE_SIGNATURE)
                             VALUES (:userId, :userName, :actionResult, :deviceSignature)";
        using var conn = new OracleConnection(_connectionString);
        await conn.OpenAsync();
        using var cmd = new OracleCommand(sql, conn) { BindByName = true };
        cmd.Parameters.Add("userId", userId);
        cmd.Parameters.Add("userName", userName);
        cmd.Parameters.Add("actionResult", actionResult);
        cmd.Parameters.Add("deviceSignature", deviceSignature ?? string.Empty);
        await cmd.ExecuteNonQueryAsync();
    }
}

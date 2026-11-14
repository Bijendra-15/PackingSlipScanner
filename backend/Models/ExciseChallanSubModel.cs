using Microsoft.Extensions.Configuration;
using Oracle.ManagedDataAccess.Client;
using System.Collections.Generic;
using System.Data;

namespace backend.Models;

public sealed class OpenChallan
{
    public string? Value { get; set; }
    public string? Text { get; set; }
}

public sealed class ExciseChallanSubModel
{
    private readonly string _connectionString;

    public ExciseChallanSubModel(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("DBOracle")
            ?? throw new InvalidOperationException("Oracle connection string not configured.");
    }

    public async Task<IEnumerable<OpenChallan>> GetAllChallansAsync(CancellationToken ct = default)
    {
        var list = new List<OpenChallan>();
        using var conn = new OracleConnection(_connectionString);
        await conn.OpenAsync(ct);

        using var cmd = new OracleCommand("PKG_DATA_FETCH.sp_getExcChallan", conn)
        {
            CommandType = CommandType.StoredProcedure,
            CommandTimeout = 30,
            BindByName = false
        };
        var pCursor = cmd.Parameters.Add("cur_ref", OracleDbType.RefCursor);
        pCursor.Direction = ParameterDirection.Output;

        using var reader = await cmd.ExecuteReaderAsync(ct);
        while (await reader.ReadAsync(ct))
        {
            list.Add(new OpenChallan
            {
                Value = GetString(reader, "Text"),
                Text = GetString(reader, "Value")
            });
        }
        return list;
    }

    private static string? GetString(OracleDataReader reader, string column)
    {
        var ordinal = reader.GetOrdinal(column);
        return reader.IsDBNull(ordinal) ? null : reader.GetString(ordinal);
    }
}

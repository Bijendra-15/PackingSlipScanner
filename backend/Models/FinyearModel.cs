using Microsoft.Extensions.Configuration;
using Oracle.ManagedDataAccess.Client;
using System.Collections.Generic;
using System.Data;

namespace backend.Models;

public sealed class FinYear
{
    public string? FinYearName { get; set; }
    public int Seq { get; set; }
    public DateTime? FinStDate { get; set; }
    public DateTime? FinEndDate { get; set; }
    public string? FinYearCode { get; set; }
}

public sealed class FinyearModel
{
    private readonly string _connectionString;

    public FinyearModel(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("DBOracle")
            ?? throw new InvalidOperationException("Oracle connection string not configured.");
    }

    public async Task<IEnumerable<FinYear>> GetAllAsync(CancellationToken ct = default)
    {
        var list = new List<FinYear>();
        using var conn = new OracleConnection(_connectionString);
        await conn.OpenAsync(ct);

        using var cmd = new OracleCommand("PKG_DATA_FETCH.sp_getallfinYears", conn)
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
            list.Add(new FinYear
            {
                FinYearName = GetString(reader, "FIN_YEAR"),
                Seq = GetInt32(reader, "SEQ"),
                FinStDate = GetDateTime(reader, "Fin_St_Date"),
                FinEndDate = GetDateTime(reader, "Fin_End_Date"),
                FinYearCode = GetString(reader, "Fin_Year_Code")
            });
        }
        return list;
    }

    private static string? GetString(OracleDataReader reader, string column)
    {
        var ordinal = GetOrdinal(reader, column);
        return ordinal < 0 || reader.IsDBNull(ordinal) ? null : reader.GetString(ordinal).Trim();
    }

    private static int GetInt32(OracleDataReader reader, string column)
    {
        var ordinal = GetOrdinal(reader, column);
        if (ordinal < 0 || reader.IsDBNull(ordinal)) return 0;
        return Convert.ToInt32(reader.GetValue(ordinal));
    }

    private static DateTime? GetDateTime(OracleDataReader reader, string column)
    {
        var ordinal = GetOrdinal(reader, column);
        return ordinal < 0 || reader.IsDBNull(ordinal) ? null : reader.GetDateTime(ordinal);
    }

    private static int GetOrdinal(OracleDataReader reader, string column)
    {
        for (int i = 0; i < reader.FieldCount; i++)
        {
            if (string.Equals(reader.GetName(i), column, StringComparison.OrdinalIgnoreCase))
                return i;
        }
        return -1;
    }
}

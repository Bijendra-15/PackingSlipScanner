using Microsoft.Extensions.Configuration;
using Oracle.ManagedDataAccess.Client;
using System.Data;

namespace backend.Models;

public sealed class ExciseChallanDetailSubModel
{
    public int ChallanNo { get; set; }
    public string? FinYear { get; set; }
    public int? Total_Cartons { get; set; }
    public int? Total_Rcv_Cartons { get; set; }
    public int? Total_Bal_Cartons { get; set; }
    public int? Total_Sort_Cartons { get; set; }
    public int? Total_Exc_Cartons { get; set; }
}

public sealed class ExciseChallanDetailSubModelDataService
{
    private readonly string _connectionString;

    public ExciseChallanDetailSubModelDataService(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("DBOracle")
            ?? throw new InvalidOperationException("Oracle connection string not configured.");
    }

    public async Task<ExciseChallanDetailSubModel?> GetAllByChallanNoAndFinYearAsync(int challanNo, string finYear, CancellationToken ct = default)
    {
        using var conn = new OracleConnection(_connectionString);
        await conn.OpenAsync(ct);

        using var cmd = new OracleCommand("PKG_DATA_FETCH.sp_getChllnDtlByChNoFinYear", conn)
        {
            CommandType = CommandType.StoredProcedure,
            CommandTimeout = 30,
            BindByName = true
        };
        cmd.Parameters.Add("pChallanNo", OracleDbType.Int32).Value = challanNo;
        cmd.Parameters.Add("pfin_year", OracleDbType.Varchar2).Value = finYear;
        var pCursor = cmd.Parameters.Add("cur_ref", OracleDbType.RefCursor);
        pCursor.Direction = ParameterDirection.Output;

        using var reader = await cmd.ExecuteReaderAsync(ct);
        if (await reader.ReadAsync(ct))
        {
            var model = new ExciseChallanDetailSubModel
            {
                ChallanNo = GetInt32(reader, "CHALLAN_NO"),
                FinYear = GetString(reader, "FIN_YEAR"),
                Total_Cartons = GetInt32(reader, "TOTAL_CARTONS"),
                Total_Rcv_Cartons = GetInt32(reader, "TOTAL_RCV_CARTONS"),
                Total_Bal_Cartons = GetInt32(reader, "TOTAL_BAL_CARTONS"),
                Total_Sort_Cartons = GetInt32(reader, "TOTAL_SORT_CARTONS"),
                Total_Exc_Cartons = GetInt32(reader, "TOTAL_EXC_CARTONS"),
            };
            if (model.ChallanNo <= 0) model.ChallanNo = challanNo;
            if (string.IsNullOrWhiteSpace(model.FinYear)) model.FinYear = finYear;
            return model;
        }
        return null;
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
        var val = reader.GetValue(ordinal);
        return Convert.ToInt32(val);
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

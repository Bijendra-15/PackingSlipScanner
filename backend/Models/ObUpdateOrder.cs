using Microsoft.Extensions.Configuration;
using Oracle.ManagedDataAccess.Client;
using System.Collections.Generic;
using System.Data;
using System.Threading;
using System.Threading.Tasks;

namespace backend.Models;

public sealed class ObUpdateOrder
{
    public int OrderId { get; set; }
    public string? Yr { get; set; }
    public string? OrderDate { get; set; }
    public string? OrderDateStr { get; set; }
    public string? Customer { get; set; }
    public string? Title { get; set; }
    public string? Qty { get; set; }
    public string? Scnqty { get; set; }
    public string? Balqty { get; set; }
    public string? OrdYrTotQty { get; set; }
    public string? OrdYrBkCnt { get; set; }
}

public sealed class ObUpdateOrderDataService
{
    private readonly string _connectionString;

    public ObUpdateOrderDataService(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("DBOracle")
            ?? throw new InvalidOperationException("Oracle connection string not configured.");
    }

    public async Task<List<ObUpdateOrder>> GetOrdDtlByOrdNoFinYrAsync(int pOrderNo, string pFinYear, CancellationToken ct = default)
    {
        var list = new List<ObUpdateOrder>();
        using var conn = new OracleConnection(_connectionString);
        await conn.OpenAsync(ct);

        using var cmd = new OracleCommand("PKG_DATA_FETCH.sp_getOrdDtlByOrdNoFinYr", conn)
        {
            CommandType = CommandType.StoredProcedure,
            CommandTimeout = 30,
            BindByName = true
        };
        cmd.Parameters.Add("pOrderId", OracleDbType.Int32).Value = pOrderNo;
        cmd.Parameters.Add("pfin_year", OracleDbType.Varchar2).Value = pFinYear;
        var pCursor = cmd.Parameters.Add("cur_ref", OracleDbType.RefCursor);
        pCursor.Direction = ParameterDirection.Output;

        using var reader = await cmd.ExecuteReaderAsync(ct);
        while (await reader.ReadAsync(ct))
        {
            var model = new ObUpdateOrder
            {
                OrderId = GetInt32(reader, "ORDER_ID"),
                Yr = GetString(reader, "YR"),
                OrderDate = GetString(reader, "ORDER_DATE"),
                OrderDateStr = GetString(reader, "ORDER_DATE_STR"),
                Customer = GetString(reader, "CUSTOMER"),
                Title = GetString(reader, "TITLE"),
                Qty = GetString(reader, "QTY"),
                Scnqty = GetString(reader, "SCNQTY"),
                Balqty = GetString(reader, "BALQTY"),
                OrdYrTotQty = GetString(reader, "ORDYRTOTQTY"),
                OrdYrBkCnt = GetString(reader, "ORDYRBKCNT"),
            };
            list.Add(model);
        }
        return list;
    }

    private static string? GetString(OracleDataReader reader, string column)
    {
        var ordinal = reader.GetOrdinal(column);
        return reader.IsDBNull(ordinal) ? null : reader.GetString(ordinal).Trim();
    }

    private static int GetInt32(OracleDataReader reader, string column)
    {
        var ordinal = reader.GetOrdinal(column);
        if (reader.IsDBNull(ordinal)) return 0;
        var val = reader.GetValue(ordinal);
        return Convert.ToInt32(val);
    }
}
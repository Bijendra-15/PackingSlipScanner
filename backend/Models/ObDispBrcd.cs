using Microsoft.Extensions.Configuration;
using Oracle.ManagedDataAccess.Client;
using System.Collections.Generic;
using System.Data;
using System.Threading;
using System.Threading.Tasks;

namespace backend.Models;

public sealed class ObDispBrcd
{
    public string? Status { get; set; }
    public string? Msg { get; set; }
}

public sealed class ObDispBrcdDataService
{
    private readonly string _connectionString;

    public ObDispBrcdDataService(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("DBOracle")
            ?? throw new InvalidOperationException("Oracle connection string not configured.");
    }

    public async Task<List<ObDispBrcd>> SaveAsync(int orderNo, string finYear, string barcodeNo, string barcodeType, int qty, string userNm, CancellationToken ct = default)
    {
        var list = new List<ObDispBrcd>();
        using var conn = new OracleConnection(_connectionString);
        await conn.OpenAsync(ct);

        using var cmd = new OracleCommand("PKG_CRUD.sp_saveobdspbrcd", conn)
        {
            CommandType = CommandType.StoredProcedure,
            CommandTimeout = 30,
            BindByName = true
        };
        cmd.Parameters.Add("pOrderNo", OracleDbType.Int32).Value = orderNo;
        cmd.Parameters.Add("pFinYear", OracleDbType.Varchar2).Value = finYear;
        cmd.Parameters.Add("pBarcodeNo", OracleDbType.Varchar2).Value = barcodeNo;
        cmd.Parameters.Add("pBarcodeType", OracleDbType.Varchar2).Value = barcodeType;
        cmd.Parameters.Add("pQty", OracleDbType.Int32).Value = qty;
        cmd.Parameters.Add("pUserNm", OracleDbType.Varchar2).Value = userNm;
        var pCursor = cmd.Parameters.Add("cur_ref", OracleDbType.RefCursor);
        pCursor.Direction = ParameterDirection.Output;

        using var reader = await cmd.ExecuteReaderAsync(ct);
        while (await reader.ReadAsync(ct))
        {
            var model = new ObDispBrcd
            {
                Status = GetString(reader, "STATUS"),
                Msg = GetString(reader, "MSG"),
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
}
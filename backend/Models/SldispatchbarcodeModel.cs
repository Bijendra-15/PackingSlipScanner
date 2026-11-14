using Microsoft.Extensions.Configuration;
using Oracle.ManagedDataAccess.Client;
using backend.Services;
using System.Collections.Generic;
using System.Data;
using System.Threading;
using System.Threading.Tasks;

namespace backend.Models;

public sealed class SldispatchbarcodeSubModel
{
    public int Orderid { get; set; }
    public string? FinYear { get; set; }
    public int? Total_Cartons { get; set; }
    public int? Total_Rcv_Cartons { get; set; }
    public int? Total_Bal_Cartons { get; set; }
}

public sealed class SldispatchbarcodeSubModelDataService
{
    private readonly string _connectionString;

    public SldispatchbarcodeSubModelDataService(IConfiguration configuration)
    {
        var encrypted = configuration.GetConnectionString("DISPDB")
            ?? throw new InvalidOperationException("Oracle connection string not configured.");
        _connectionString = StringCryptoService.DecryptString(encrypted);
    }

    public async Task<SldispatchbarcodeSubModel?> SpGetDispDtlByFinYearOrdId(int pOrderId, string pfinyear, CancellationToken ct = default)
    {
        using var conn = new OracleConnection(_connectionString);
        await conn.OpenAsync(ct);

        using var cmd = new OracleCommand("PKG_DATA_FETCH.sp_getDispDtlByFinYearOrdId", conn)
        {
            CommandType = CommandType.StoredProcedure,
            CommandTimeout = 30,
            BindByName = true
        };
        cmd.Parameters.Add("pOrderId", OracleDbType.Int32).Value = pOrderId;
        cmd.Parameters.Add("pfinyear", OracleDbType.Varchar2).Value = pfinyear;
        var pCursor = cmd.Parameters.Add("cur_ref", OracleDbType.RefCursor);
        pCursor.Direction = ParameterDirection.Output;

        using var reader = await cmd.ExecuteReaderAsync(ct);
        if (await reader.ReadAsync(ct))
        {
            return new SldispatchbarcodeSubModel
            {
                Orderid = GetInt32(reader, "ORDER_ID"),
                FinYear = GetString(reader, "FIN_YEAR"),
                Total_Cartons = GetInt32OrNull(reader, "Total_Cartons"),
                Total_Rcv_Cartons = GetInt32OrNull(reader, "Total_Rcv_Cartons"),
                Total_Bal_Cartons = GetInt32OrNull(reader, "Total_Bal_Cartons")
            };
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
        return Convert.ToInt32(reader.GetValue(ordinal));
    }

    private static int? GetInt32OrNull(OracleDataReader reader, string column)
    {
        var ordinal = GetOrdinal(reader, column);
        if (ordinal < 0 || reader.IsDBNull(ordinal)) return null;
        return Convert.ToInt32(reader.GetValue(ordinal));
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

public sealed class SldispatchbarcodeModel
{
    public int OrderId { get; set; }
    public string? OrderFinYear { get; set; }
    public DateTime? DispatchDate { get; set; }
    public DateTime? DocTrDate { get; set; }
    public int? SlNo { get; set; }
    public string? NotebookId { get; set; }
    public string? NotebookCode { get; set; }
    public int? Qty { get; set; }
    public string? Carton { get; set; }
    public string? CartonTyp { get; set; }
    public string? Barcode { get; set; }
    public int? PageNo { get; set; }
    public string? Deleted { get; set; }
    public string? DeviceUser { get; set; }
    public string? Docstatus { get; set; }
}

public sealed class SldispatchbarcodeModelDataService
{
    private readonly string _connectionString;

    public SldispatchbarcodeModelDataService(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("DBOracle")
            ?? throw new InvalidOperationException("Oracle connection string not configured.");
    }

    public async Task<List<SldispatchbarcodeModel>> SpGetAllDispDtlByFinYearOrdId(int pOrderId, string pfinyear, CancellationToken ct = default)
    {
        var list = new List<SldispatchbarcodeModel>();
        using var conn = new OracleConnection(_connectionString);
        await conn.OpenAsync(ct);

        using var cmd = new OracleCommand("PKG_DATA_FETCH.sp_getAllDispDtlByFinYearOrdId", conn)
        {
            CommandType = CommandType.StoredProcedure,
            CommandTimeout = 30,
            BindByName = true
        };
        cmd.Parameters.Add("pfinyear", OracleDbType.Varchar2).Value = pfinyear;
        cmd.Parameters.Add("pOrderId", OracleDbType.Int32).Value = pOrderId;
        var pCursor = cmd.Parameters.Add("cur_ref", OracleDbType.RefCursor);
        pCursor.Direction = ParameterDirection.Output;

        using var reader = await cmd.ExecuteReaderAsync(ct);
        while (await reader.ReadAsync(ct))
        {
            list.Add(new SldispatchbarcodeModel
            {
                DispatchDate = GetDateTimeOrNull(reader, "DISPATCH_DATE"),
                OrderId = GetInt32(reader, "ORDER_ID"),
                OrderFinYear = GetString(reader, "ORDER_FIN_YEAR"),
                SlNo = GetInt32OrNull(reader, "SL_NO"),
                NotebookId = GetString(reader, "NOTEBOOK_ID"),
                NotebookCode = GetString(reader, "NOTEBOOK_CODE"),
                Qty = GetInt32OrNull(reader, "QTY"),
                Carton = GetString(reader, "CARTON"),
                CartonTyp = GetString(reader, "CARTON_TYP"),
                Barcode = GetString(reader, "BARCODE"),
                PageNo = GetInt32OrNull(reader, "PAGE_NO"),
                Deleted = GetString(reader, "DELETED"),
                DeviceUser = GetString(reader, "DEVICEUSER"),
                Docstatus = GetString(reader, "DOC_STATUS"),
                DocTrDate = GetDateTimeOrNull(reader, "DOC_TR_DATE")
            });
        }
        return list;
    }

    public async Task<string> SaveDispatchBarCodeAsync(string? finYear, int orderId, string? barcode, string? crBy, string? docStatus, CancellationToken ct = default)
    {
        using var conn = new OracleConnection(_connectionString);
        await conn.OpenAsync(ct);

        using var cmd = new OracleCommand("PKG_CRUD.sp_save_DispatchBarCode", conn)
        {
            CommandType = CommandType.StoredProcedure,
            CommandTimeout = 30,
            BindByName = true
        };
        cmd.Parameters.Add("pfinyear", OracleDbType.Varchar2).Value = finYear ?? string.Empty;
        cmd.Parameters.Add("pOrderId", OracleDbType.Int32).Value = orderId;
        cmd.Parameters.Add("pBARCODE", OracleDbType.Varchar2).Value = (object?)barcode ?? DBNull.Value;
        cmd.Parameters.Add("pCRBY", OracleDbType.Varchar2).Value = (object?)crBy ?? DBNull.Value;
        cmd.Parameters.Add("pDOCSTATUS", OracleDbType.Varchar2).Value = (object?)docStatus ?? DBNull.Value;
        var pResult = cmd.Parameters.Add("presult", OracleDbType.Varchar2, 4000);
        pResult.Direction = ParameterDirection.Output;

        await cmd.ExecuteNonQueryAsync(ct);
        return pResult.Value?.ToString() ?? string.Empty;
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

    private static int? GetInt32OrNull(OracleDataReader reader, string column)
    {
        var ordinal = GetOrdinal(reader, column);
        if (ordinal < 0 || reader.IsDBNull(ordinal)) return null;
        return Convert.ToInt32(reader.GetValue(ordinal));
    }

    private static DateTime? GetDateTimeOrNull(OracleDataReader reader, string column)
    {
        var ordinal = GetOrdinal(reader, column);
        if (ordinal < 0 || reader.IsDBNull(ordinal)) return null;
        return reader.GetDateTime(ordinal);
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
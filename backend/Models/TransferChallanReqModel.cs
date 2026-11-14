using backend.Services;
using Microsoft.Extensions.Configuration;
using Oracle.ManagedDataAccess.Client;
using System.Collections.Generic;
using System.Data;

namespace backend.Models;

public sealed class TransferChallanReqSubModel
{
    public int TrChlnReqId { get; set; }
    public string? FinYear { get; set; }
    public int? Total_Cartons { get; set; }
    public int? Total_Rcv_Cartons { get; set; }
    public int? Total_Bal_Cartons { get; set; }
}

public sealed class TransferChallanReqSubModelDataService
{
    private readonly string _connectionString;

    public TransferChallanReqSubModelDataService(IConfiguration configuration)
    {
        var encrypted = configuration.GetConnectionString("DISPDB")
            ?? throw new InvalidOperationException("Oracle connection string not configured.");
        _connectionString = StringCryptoService.DecryptString(encrypted);
    }

    public async Task<TransferChallanReqSubModel?> SpGetTrChalnDtlByFinYearId(int pId, string pfinyear, CancellationToken ct = default)
    {
        using var conn = new OracleConnection(_connectionString);
        await conn.OpenAsync(ct);

        using var cmd = new OracleCommand("PKG_DATA_FETCH.sp_getTrChalnDtlByFinYearId", conn)
        {
            CommandType = CommandType.StoredProcedure,
            CommandTimeout = 30,
            BindByName = true
        };
        cmd.Parameters.Add("pfinyear", OracleDbType.Varchar2).Value = pfinyear;
        cmd.Parameters.Add("pId", OracleDbType.Int32).Value = pId;
        var pCursor = cmd.Parameters.Add("cur_ref", OracleDbType.RefCursor);
        pCursor.Direction = ParameterDirection.Output;

        using var reader = await cmd.ExecuteReaderAsync(ct);
        if (await reader.ReadAsync(ct))
        {
            return new TransferChallanReqSubModel
            {
                Total_Cartons = GetInt32OrNull(reader, "Total_Cartons"),
                Total_Rcv_Cartons = GetInt32OrNull(reader, "Total_Rcv_Cartons"),
                Total_Bal_Cartons = GetInt32OrNull(reader, "Total_Bal_Cartons"),
                TrChlnReqId = GetInt32(reader, "Tr_Chln_Req_id"),
                FinYear = GetString(reader, "FIN_YEAR")
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

public sealed class slTrChallanReqBarcodeModel
{
    public DateTime? TrChlanDate { get; set; }
    public int? TrChlnReqId { get; set; }
    public string? FinYear { get; set; }
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
    public DateTime? DocTrDate { get; set; }
    public string? VehicleNo { get; set; }
    public DateTime? DateTime { get; set; }
}

public sealed class slTrChallanReqBarcodeModelDataService
{
    private readonly string _connectionString;

    public slTrChallanReqBarcodeModelDataService(IConfiguration configuration)
    {
        var encrypted = configuration.GetConnectionString("DISPDB")
            ?? throw new InvalidOperationException("Oracle connection string not configured.");
        _connectionString = StringCryptoService.DecryptString(encrypted);
    }

    public async Task<List<slTrChallanReqBarcodeModel>> SpGetAllTrChlnNoBrcdDtlByFinYearId(int pId, string pfinyear, CancellationToken ct = default)
    {
        var list = new List<slTrChallanReqBarcodeModel>();
        using var conn = new OracleConnection(_connectionString);
        await conn.OpenAsync(ct);

        using var cmd = new OracleCommand("PKG_DATA_FETCH.sp_getAllTrChlnBrcdDtlFinYrId", conn)
        {
            CommandType = CommandType.StoredProcedure,
            CommandTimeout = 30,
            BindByName = true
        };
        cmd.Parameters.Add("pfinyear", OracleDbType.Varchar2).Value = pfinyear;
        cmd.Parameters.Add("pId", OracleDbType.Int32).Value = pId;
        var pCursor = cmd.Parameters.Add("cur_ref", OracleDbType.RefCursor);
        pCursor.Direction = ParameterDirection.Output;

        using var reader = await cmd.ExecuteReaderAsync(ct);
        while (await reader.ReadAsync(ct))
        {
            list.Add(MapRow(reader));
        }
        return list;
    }

    public async Task<List<slTrChallanReqBarcodeModel>> SpGetAllOpnTrChlnDtl(CancellationToken ct = default)
    {
        var list = new List<slTrChallanReqBarcodeModel>();
        using var conn = new OracleConnection(_connectionString);
        await conn.OpenAsync(ct);

        using var cmd = new OracleCommand("PKG_DATA_FETCH.sp_getAllOpnTrChlnDtl", conn)
        {
            CommandType = CommandType.StoredProcedure,
            CommandTimeout = 30,
            BindByName = true
        };
        var pCursor = cmd.Parameters.Add("cur_ref", OracleDbType.RefCursor);
        pCursor.Direction = ParameterDirection.Output;

        using var reader = await cmd.ExecuteReaderAsync(ct);
        while (await reader.ReadAsync(ct))
        {
            list.Add(MapRow(reader));
        }
        return list;
    }

    private static slTrChallanReqBarcodeModel MapRow(OracleDataReader reader)
    {
        return new slTrChallanReqBarcodeModel
        {
            TrChlanDate = GetDateTimeOrNull(reader, "Tr_Chlan_DATE"),
            TrChlnReqId = GetInt32OrNull(reader, "Tr_Chln_Req_id"),
            FinYear = GetString(reader, "FIN_YEAR"),
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
            DocTrDate = GetDateTimeOrNull(reader, "DOC_TR_DATE"),
            VehicleNo = GetString(reader, "Vehicle_No"),
            DateTime = GetDateTimeOrNull(reader, "Date_Time")
        };
    }

    private static string? GetString(OracleDataReader reader, string column)
    {
        var ordinal = GetOrdinal(reader, column);
        return ordinal < 0 || reader.IsDBNull(ordinal) ? null : reader.GetString(ordinal).Trim();
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
using Microsoft.Extensions.Configuration;
using Oracle.ManagedDataAccess.Client;
using System.Collections.Generic;
using System.Data;

namespace backend.Models;

public sealed class DrReceiveModel
{
    public int ChallanNo { get; set; }
    public string? Recvstatus { get; set; }
    public string? FinYear { get; set; }
    public string? Challanfinyr { get; set; }
    public int Recvchallanno { get; set; }
    public string? Barcode { get; set; }
    public string? Crby { get; set; }
    public string? Notebookcode { get; set; }
    public int? Notebookqty { get; set; }
    public int? RecvId { get; set; }
    public DateTime? RecvDate { get; set; }
    public int? RecvSrNo { get; set; }
    public int? SlNo { get; set; }
    public int? PageNo { get; set; }
    public decimal? Mrp { get; set; }
    public decimal? Amount { get; set; }
    public int? RequiredQty { get; set; }
    public string? BarcodeStatus { get; set; }
    public string? RcvTyp { get; set; }
}

public sealed class DrReceiveModelDataService
{
    private readonly string _connectionString;

    public DrReceiveModelDataService(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("DBOracle")
            ?? throw new InvalidOperationException("Oracle connection string not configured.");
    }

    public async Task<List<DrReceiveModel>> GetAllByChlnNoFinYearAsync(int challanNo, string finYear, CancellationToken ct = default)
    {
        var list = new List<DrReceiveModel>();
        using var conn = new OracleConnection(_connectionString);
        await conn.OpenAsync(ct);

        using var cmd = new OracleCommand("PKG_DATA_FETCH.sp_getRcvChllnDtlByChNoFYr", conn)
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
        while (await reader.ReadAsync(ct))
        {
            var model = new DrReceiveModel
            {
                ChallanNo = GetInt32(reader, "CHALLAN_NO") == 0 ? challanNo : GetInt32(reader, "CHALLAN_NO"),
                Recvstatus = GetString(reader, "RECV_STATUS") ?? GetString(reader, "RECVSTATUS"),
                FinYear = GetString(reader, "CHALLAN_FIN_YR") ?? finYear,
                Barcode = GetString(reader, "BARCODE"),
                Notebookcode = GetString(reader, "NOTEBOOK_CODE"),
                Notebookqty = GetInt32OrNull(reader, "NOTEBOOK_QTY"),
                RecvId = GetInt32OrNull(reader, "RECV_ID"),
                RecvDate = GetDateTimeOrNull(reader, "RECV_DATE"),
                Recvchallanno = GetInt32(reader, "RECV_CHALLAN_NO") == 0 ? challanNo : GetInt32(reader, "RECV_CHALLAN_NO"),
                RecvSrNo = GetInt32OrNull(reader, "RECV_SR_NO"),
                SlNo = GetInt32OrNull(reader, "SL_NO"),
                PageNo = GetInt32OrNull(reader, "PAGE_NO"),
                Mrp = GetDecimalOrNull(reader, "MRP"),
                Amount = GetDecimalOrNull(reader, "AMOUNT"),
                RequiredQty = GetInt32OrNull(reader, "REQUIRED_QTY"),
                Crby = GetString(reader, "CR_BY"),
                BarcodeStatus = GetString(reader, "BARCODE_STATUS"),
                RcvTyp = GetString(reader, "RCV_TYP")
            };
            if (model.ChallanNo <= 0) model.ChallanNo = challanNo;
            if (string.IsNullOrWhiteSpace(model.FinYear)) model.FinYear = finYear;
            list.Add(model);
        }
        return list;
    }

    public string SaveRcvCartons(string challanFinYr, int recvChallanNo, string barcode, string crBy, string recvStatus)
    {
        using var conn = new OracleConnection(_connectionString);
        conn.Open();

        using var cmd = new OracleCommand("PKG_CRUD.sp_save_RcvCartons", conn)
        {
            CommandType = CommandType.StoredProcedure,
            CommandTimeout = 30,
            BindByName = true
        };
        cmd.Parameters.Add("pCHALLANFINYR", OracleDbType.Varchar2).Value = challanFinYr;
        cmd.Parameters.Add("pRECVCHALLANNO", OracleDbType.Int32).Value = recvChallanNo;
        cmd.Parameters.Add("pBARCODE", OracleDbType.Varchar2).Value = barcode;
        cmd.Parameters.Add("pCRBY", OracleDbType.Varchar2).Value = crBy;
        cmd.Parameters.Add("pRECVSTATUS", OracleDbType.Varchar2).Value = recvStatus;
        var pResult = cmd.Parameters.Add("presult", OracleDbType.Varchar2, 4000);
        pResult.Direction = ParameterDirection.Output;

        cmd.ExecuteNonQuery();
        return pResult.Value?.ToString() ?? string.Empty;
    }

    public async Task<string> SaveRcvCartonsAsync(string challanFinYr, int recvChallanNo, string barcode, string crBy, string recvStatus, CancellationToken ct = default)
    {
        using var conn = new OracleConnection(_connectionString);
        await conn.OpenAsync(ct);

        using var cmd = new OracleCommand("PKG_CRUD.sp_save_RcvCartons", conn)
        {
            CommandType = CommandType.StoredProcedure,
            CommandTimeout = 30,
            BindByName = true
        };
        cmd.Parameters.Add("pCHALLANFINYR", OracleDbType.Varchar2).Value = challanFinYr;
        cmd.Parameters.Add("pRECVCHALLANNO", OracleDbType.Int32).Value = recvChallanNo;
        cmd.Parameters.Add("pBARCODE", OracleDbType.Varchar2).Value = barcode;
        cmd.Parameters.Add("pCRBY", OracleDbType.Varchar2).Value = crBy;
        cmd.Parameters.Add("pRECVSTATUS", OracleDbType.Varchar2).Value = recvStatus;
        var pResult = cmd.Parameters.Add("presult", OracleDbType.Varchar2, 4000);
        pResult.Direction = ParameterDirection.Output;

        await cmd.ExecuteNonQueryAsync(ct);
        return pResult.Value?.ToString() ?? string.Empty;
    }

    public async Task<string> ScanCartonCloseFinalAsync(string challanFinYr, string barcode, int recvChallanNo, CancellationToken ct = default)
    {
        using var conn = new OracleConnection(_connectionString);
        await conn.OpenAsync(ct);

        using var cmd = new OracleCommand("PKG_CRUD.sp_ScanCartonCloseFinal", conn)
        {
            CommandType = CommandType.StoredProcedure,
            CommandTimeout = 30,
            BindByName = true
        };
        cmd.Parameters.Add("pCHALLANFINYR", OracleDbType.Varchar2).Value = challanFinYr;
        cmd.Parameters.Add("pBarcode", OracleDbType.Varchar2).Value = barcode;
        cmd.Parameters.Add("pRECVCHALLANNO", OracleDbType.Int32).Value = recvChallanNo;
        var pResult = cmd.Parameters.Add("presult", OracleDbType.Varchar2, 4000);
        pResult.Direction = ParameterDirection.Output;

        await cmd.ExecuteNonQueryAsync(ct);
        return pResult.Value?.ToString() ?? string.Empty;
    }

    public async Task<string> SaveStockInputAsync(string? finYear, string? barcode, string? crBy, CancellationToken ct = default)
    {
        using var conn = new OracleConnection(_connectionString);
        await conn.OpenAsync(ct);

        using var cmd = new OracleCommand("PKG_CRUD.sp_save_StockInput", conn)
        {
            CommandType = CommandType.StoredProcedure,
            CommandTimeout = 30,
            BindByName = true
        };
        cmd.Parameters.Add("pfinyear", OracleDbType.Varchar2).Value = finYear ?? string.Empty;
        cmd.Parameters.Add("pBARCODE", OracleDbType.Varchar2).Value = barcode ?? string.Empty;
        cmd.Parameters.Add("pCRBY", OracleDbType.Varchar2).Value = crBy ?? string.Empty;
        var pResult = cmd.Parameters.Add("presult", OracleDbType.Varchar2, 4000);
        pResult.Direction = ParameterDirection.Output;

        await cmd.ExecuteNonQueryAsync(ct);
        return pResult.Value?.ToString() ?? string.Empty;
    }

    public async Task<string> SaveStkInputAsync(string? finYear, string? barcode, string? crBy, CancellationToken ct = default)
    {
        using var conn = new OracleConnection(_connectionString);
        await conn.OpenAsync(ct);

        using var cmd = new OracleCommand("PKG_CRUD.sp_save_StkInput", conn)
        {
            CommandType = CommandType.StoredProcedure,
            CommandTimeout = 30,
            BindByName = true
        };
        cmd.Parameters.Add("pfinyear", OracleDbType.Varchar2).Value = finYear ?? string.Empty;
        cmd.Parameters.Add("pBARCODE", OracleDbType.Varchar2).Value = barcode ?? string.Empty;
        cmd.Parameters.Add("pCRBY", OracleDbType.Varchar2).Value = crBy ?? string.Empty;
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
        var val = reader.GetValue(ordinal);
        return Convert.ToInt32(val);
    }

    private static int? GetInt32OrNull(OracleDataReader reader, string column)
    {
        var ordinal = GetOrdinal(reader, column);
        if (ordinal < 0 || reader.IsDBNull(ordinal)) return null;
        var val = reader.GetValue(ordinal);
        return Convert.ToInt32(val);
    }

    private static DateTime? GetDateTimeOrNull(OracleDataReader reader, string column)
    {
        var ordinal = GetOrdinal(reader, column);
        if (ordinal < 0 || reader.IsDBNull(ordinal)) return null;
        return reader.GetDateTime(ordinal);
    }

    private static decimal? GetDecimalOrNull(OracleDataReader reader, string column)
    {
        var ordinal = GetOrdinal(reader, column);
        if (ordinal < 0 || reader.IsDBNull(ordinal)) return null;
        var val = reader.GetValue(ordinal);
        return Convert.ToDecimal(val);
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

using backend.Data;
using backend.Dtos;
using backend.Models;
using backend.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Oracle.ManagedDataAccess.Client;
using System.Collections.Generic;
using System.Data;
using System.Linq;

namespace backend.Controllers;

[ApiController]
[Produces("application/json")]
public class PackingSlipScanningController : ControllerBase
{
    private readonly SlUserService _slUsers;
    private readonly SlConfigService _config;
    private readonly SlAppLoggingService _logging;
    private readonly IConfiguration _configuration;

    public PackingSlipScanningController(SlUserService slUsers, SlConfigService config, SlAppLoggingService logging, IConfiguration configuration)
    {
        _slUsers = slUsers;
        _config = config;
        _logging = logging;
        _configuration = configuration;
    }
    // GET: api/PackingSlipScanning
    [HttpGet("api/PackingSlipScanning")]
    [ProducesResponseType(typeof(IEnumerable<string>), StatusCodes.Status200OK)]
    public ActionResult<IEnumerable<string>> Get()
    {
        return Ok(new[] { "value1", "value2" });
    }

    [HttpGet("api/GetAllFinYear")]
    [ProducesResponseType(typeof(Result), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Error), StatusCodes.Status200OK)]
    public async Task<ActionResult> GetAllFinYear()
    {
        try
        {
            var finyearModel = new FinyearModel(_configuration);
            var result = new Result
            {
                Status = " GetAllFinYear-Api-Success ",
                Data = (await finyearModel.GetAllAsync()).OrderByDescending(x => x.Seq).Take(2)
            };
            return Ok(result);
        }
        catch (Exception ex)
        {
            var error = new Error
            {
                Status = " GetAllFinYear-Api-Failed ",
                _Error = ex.Message
            };
            return Ok(error);
        }
    }

    [HttpGet("api/GetAllOpenChallans")]
    [ProducesResponseType(typeof(Result), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Error), StatusCodes.Status200OK)]
    public async Task<ActionResult> GetAllOpenChallans()
    {
        try
        {
            var exciseChallanSubModel = new ExciseChallanSubModel(_configuration);
            var result = new Result
            {
                Status = "GetAllChallans-Api-Success ",
                Data = await exciseChallanSubModel.GetAllChallansAsync()
            };
            return Ok(result);
        }
        catch (Exception ex)
        {
            var error = new Error
            {
                Status = " GetAllFinYear-Api-Failed ",
                _Error = ex.Message
            };
            return Ok(error);
        }
    }

    [HttpPost("api/Login")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public async Task<ActionResult> Login([FromBody] LoginRequest? userModel)
    {
        if (userModel is null || string.IsNullOrWhiteSpace(userModel.UserName) || string.IsNullOrEmpty(userModel.Password))
            return Ok(new { Data = (object?)null });

        try
        {
            var user = await _slUsers.GetUserByUserNameAndPasswordAsync(userModel.UserName, userModel.Password);
            if (user is null)
                return Ok(new { Data = (object?)null });

            var keyVal = await _config.GetValueByKeyAsync("APPUSER_ROLEID") ?? string.Empty;
            var appName = await _config.GetValueByKeyAsync("APP_NAME") ?? user.AppName;

            var allowedRoles = keyVal.Split(',', StringSplitOptions.RemoveEmptyEntries);
            var isAllowed = allowedRoles.Length == 0 || allowedRoles.Contains(user.RoleId.ToString());

            if (isAllowed)
            {
                await _logging.LogAsync(user.UserId, user.UserName, "L", string.Empty);
            }

            return Ok(new
            {
                Data = isAllowed ? new
                {
                    user.UserId,
                    user.RoleId,
                    user.UserName,
                    user.AppName
                } : null,
                AppName = appName
            });
        }
        catch
        {
            return Ok(new { Data = (object?)null });
        }
    }

    [HttpPost("api/ChangePassword")]
    [ProducesResponseType(typeof(Result), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Error), StatusCodes.Status200OK)]
    public async Task<ActionResult> ChangePassword([FromBody] ChangePasswordRequest? userModel)
    {
        try
        {
            if (userModel is null || userModel.UserId <= 0 || string.IsNullOrEmpty(userModel.Password))
            {
                var error = new Error
                {
                    Status = " ChangePassword-Api-Failed ",
                    _Error = "User id and password are required."
                };
                return Ok(error);
            }

            var rows = await _slUsers.ChangePasswordAsync(userModel.UserId, userModel.Password);

            var result = new Result
            {
                Status = rows > 0 ? " ChangePassword-Api-Success " : " ChangePassword-Api-Failed ",
                Data = rows > 0 ? "Password Changed Successfully." : "Failed to change password."
            };
            return Ok(result);
        }
        catch (Exception ex)
        {
            var error = new Error
            {
                Status = " ChangePassword-Api-Failed ",
                _Error = ex.Message
            };
            return Ok(error);
        }
    }

    [HttpPost("api/Logout")]
    [ProducesResponseType(typeof(Result), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Error), StatusCodes.Status200OK)]
    public ActionResult Logout([FromBody] object? userModel) => NotConfigured("Logout", "UserModel/apploggingModel/SLNP data service is not configured.");

    [HttpGet("api/ChkVehicleNoExistOrNot/{pVehicleNo}")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Error), StatusCodes.Status200OK)]
    public async Task<ActionResult> ChkVehicleNoExistOrNot(string pVehicleNo)
    {
        try
        {
            using var conn = new OracleConnection(_configuration.GetConnectionString("DBOracle"));
            await conn.OpenAsync();

            const string sql = @"SELECT COUNT(*) FROM BARCODE_SCAN_QUEUE WHERE VEHICLE_NO = :pVehicleNo";
            using var cmd = new OracleCommand(sql, conn) { CommandTimeout = 30, BindByName = true };
            cmd.Parameters.Add("pVehicleNo", OracleDbType.Varchar2).Value = pVehicleNo;
            var count = Convert.ToDecimal(await cmd.ExecuteScalarAsync());

            return Ok(new { Status = "success", Data = count });
        }
        catch (Exception ex)
        {
            return Ok(new { Status = "failed", Data = 0, _Error = ex.Message });
        }
    }

    [HttpPost("api/ValidateBarCodeAndSave")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Error), StatusCodes.Status200OK)]
    public async Task<ActionResult> ValidateBarCodeAndSave([FromBody] ValidateBarcodeRequest? model)
    {
        string presult = string.Empty;
        try
        {
            if (model is null || string.IsNullOrWhiteSpace(model.BARCODE))
                return Ok(new
                {
                    Status = " ValidateBarCode-Api-Failed ",
                    Data = new { Status = "0", NoteBookNm = string.Empty, qty = "0", TotCartScanned = presult },
                    _Error = "Barcode is required."
                });

            string barcode = model.BARCODE.PadRight(15, ' ');
            string vehicleNo = model.VEHICLE_NO ?? string.Empty;
            string crBy = model.CR_BY ?? string.Empty;
            string deviceId = model.DEVICE_ID ?? "1";
            int barcodeId = 0;
            string noteBookNm = string.Empty;
            decimal cartonQty = 0;

            using var conn = new OracleConnection(_configuration.GetConnectionString("DBOracle"));
            await conn.OpenAsync();

            using var getCmd = new OracleCommand("PKG_DATA_FETCH.sp_getDtlByBarcode", conn)
            {
                CommandType = CommandType.StoredProcedure,
                CommandTimeout = 30,
                BindByName = false
            };
            getCmd.Parameters.Add("PBarcode", OracleDbType.Varchar2).Value = barcode;
            getCmd.Parameters.Add("pNOTEBOOK_CODE", OracleDbType.Decimal).Value = 0;
            var pCursor = getCmd.Parameters.Add("cur_ref", OracleDbType.RefCursor);
            pCursor.Direction = ParameterDirection.Output;

            using (var reader = await getCmd.ExecuteReaderAsync())
            {
                if (await reader.ReadAsync())
                {
                    for (int i = 0; i < reader.FieldCount; i++)
                    {
                        var colName = reader.GetName(i);
                        if (string.Equals(colName, "BARCODE_ID", StringComparison.OrdinalIgnoreCase) && !reader.IsDBNull(i))
                            barcodeId = Convert.ToInt32(reader.GetValue(i));
                        else if (string.Equals(colName, "notebookname", StringComparison.OrdinalIgnoreCase) && !reader.IsDBNull(i))
                            noteBookNm = reader.GetString(i).Trim();
                        else if (string.Equals(colName, "carton_qty", StringComparison.OrdinalIgnoreCase) && !reader.IsDBNull(i))
                            cartonQty = Convert.ToDecimal(reader.GetValue(i));
                    }
                }
            }

            string msg;
            if (barcodeId > 0)
            {
                using var saveCmd = new OracleCommand("PKG_CRUD.sp_save_sl_barcode_scan_queue", conn)
                {
                    CommandType = CommandType.StoredProcedure,
                    CommandTimeout = 30,
                    BindByName = false
                };
                saveCmd.Parameters.Add("pID", OracleDbType.Decimal).Value = 0;
                saveCmd.Parameters.Add("pBarcode", OracleDbType.Varchar2).Value = NVL(model.BARCODE);
                saveCmd.Parameters.Add("pBARCODE_ID", OracleDbType.Decimal).Value = barcodeId;
                saveCmd.Parameters.Add("pVEHICLE_NO", OracleDbType.Varchar2).Value = NVL(vehicleNo);
                saveCmd.Parameters.Add("pCr_date", OracleDbType.Date).Value = DateTime.Now;
                saveCmd.Parameters.Add("pCR_BY", OracleDbType.Varchar2).Value = NVL(crBy);
                saveCmd.Parameters.Add("pDEVICE_ID", OracleDbType.Varchar2).Value = NVL(deviceId);
                saveCmd.Parameters.Add("pSCAN_STATUS", OracleDbType.Varchar2).Value = NVL("OPEN");
                saveCmd.Parameters.Add("pDate_Time", OracleDbType.Varchar2).Value = NVL(DateTime.Now.ToString("hh:mm tt"));
                var pResult = saveCmd.Parameters.Add("presult", OracleDbType.Varchar2, 4000);
                pResult.Direction = ParameterDirection.Output;

                await saveCmd.ExecuteNonQueryAsync();
                presult = pResult.Value?.ToString() ?? string.Empty;

                if (Convert.ToDecimal(presult) == -1)
                    msg = "-2";
                else if (Convert.ToDecimal(presult) == 0)
                    msg = "-1";
                else
                    msg = "1";
            }
            else
            {
                msg = "0";
            }

            return Ok(new
            {
                Status = " ValidateBarCode-Api-Success ",
                Data = new
                {
                    Status = msg,
                    NoteBookNm = barcodeId > 0 && cartonQty > 1 ? " Mixed Barcode " : noteBookNm,
                    qty = barcodeId > 0 ? cartonQty.ToString() : "0",
                    TotCartScanned = presult
                }
            });
        }
        catch (Exception ex)
        {
            return Ok(new
            {
                Status = " ValidateBarCode-Api-Failed ",
                Data = new { Status = "0", NoteBookNm = string.Empty, qty = "0", TotCartScanned = presult },
                _Error = ex.Message
            });
        }
    }

    [HttpPost("api/ScanChallanNo")]
    [ProducesResponseType(typeof(Result), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Error), StatusCodes.Status200OK)]
    public async Task<ActionResult> ScanChallanNo([FromBody] ReqData? reqData)
    {
        try
        {
            if (reqData is null)
            {
                var error = new Error
                {
                    Status = " ValidateBarCode-Api-Failed ",
                    _Error = "Request data is required."
                };
                return Ok(error);
            }

            var drReceiveService = new DrReceiveModelDataService(_configuration);
            var drList = await drReceiveService.GetAllByChlnNoFinYearAsync(reqData.ChallanNo, reqData.FinYear ?? string.Empty);

            if (drList != null && drList.Count > 0 && drList.Count(x => string.Equals(x.Recvstatus?.Trim(), "Open", StringComparison.OrdinalIgnoreCase)) > 0)
            {
                var result = new Result
                {
                    Status = "-20001",
                    Data = $"Challan No {reqData.ChallanNo} Is Closed."
                };
                return Ok(result);
            }

            var exciseService = new ExciseChallanDetailSubModelDataService(_configuration);
            var exciseModel = await exciseService.GetAllByChallanNoAndFinYearAsync(reqData.ChallanNo, reqData.FinYear ?? string.Empty);

            if (exciseModel != null)
            {
                if (exciseModel.ChallanNo <= 0) exciseModel.ChallanNo = reqData.ChallanNo;
                var result = new Result
                {
                    Status = "1",
                    Data = exciseModel
                };
                return Ok(result);
            }

            var emptyResult = new Result
            {
                Status = "0",
                Data = null
            };
            return Ok(emptyResult);
        }
        catch (Exception ex)
        {
            var error = new Error
            {
                Status = " ValidateBarCode-Api-Failed ",
                _Error = ex.Message
            };
            return Ok(error);
        }
    }

    [HttpPost("api/GetByChallanNoFinYr")]
    [ProducesResponseType(typeof(Result), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Error), StatusCodes.Status200OK)]
    public async Task<ActionResult> GetByChallanNoFinYr([FromBody] ReqData? reqData)
    {
        try
        {
            if (reqData is null)
            {
                var error = new Error
                {
                    Status = " ValidateBarCode-Api-Failed ",
                    _Error = "Request data is required."
                };
                return Ok(error);
            }

            var exciseService = new ExciseChallanDetailSubModelDataService(_configuration);
            var model = await exciseService.GetAllByChallanNoAndFinYearAsync(reqData.ChallanNo, reqData.FinYear ?? string.Empty);

            var result = new Result();
            if (model != null)
            {
                result.Status = "1";
                result.Data = model;
            }
            else
            {
                result.Status = "0";
                result.Data = null;
            }
            return Ok(result);
        }
        catch (Exception ex)
        {
            var error = new Error
            {
                Status = " ValidateBarCode-Api-Failed ",
                _Error = ex.Message
            };
            return Ok(error);
        }
    }

    [HttpPost("api/GetAllByChallanNoFinYr")]
    [ProducesResponseType(typeof(Result), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Error), StatusCodes.Status200OK)]
    public async Task<ActionResult> GetAllByChallanNoFinYr([FromBody] ReqData? reqData)
    {
        try
        {
            if (reqData is null)
            {
                var error = new Error
                {
                    Status = " ValidateBarCode-Api-Failed ",
                    _Error = "Request data is required."
                };
                return Ok(error);
            }

            var drReceiveService = new DrReceiveModelDataService(_configuration);
            var list = await drReceiveService.GetAllByChlnNoFinYearAsync(reqData.ChallanNo, reqData.FinYear ?? string.Empty);

            var result = new Result();
            if (list.Count > 0)
            {
                result.Status = "1";
                result.Data = list;
            }
            else
            {
                result.Status = "0";
                result.Data = null;
            }
            return Ok(result);
        }
        catch (Exception ex)
        {
            var error = new Error
            {
                Status = " ValidateBarCode-Api-Failed ",
                _Error = ex.Message
            };
            return Ok(error);
        }
    }

    [HttpPost("api/ScanCarton")]
    [ProducesResponseType(typeof(Result), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Error), StatusCodes.Status200OK)]
    public async Task<ActionResult> ScanCarton([FromBody] ReqData? reqData)
    {
        try
        {
            if (reqData is null)
            {
                var error = new Error
                {
                    Status = " ValidateBarCode-Api-Failed ",
                    _Error = "Request data is required."
                };
                return Ok(error);
            }

            var drReceiveService = new DrReceiveModelDataService(_configuration);
            var presult = await drReceiveService.SaveRcvCartonsAsync(reqData.FinYear ?? string.Empty, reqData.ChallanNo, reqData.BarcodeNo ?? string.Empty, reqData.UserNm ?? string.Empty, "Draft");

            var parts = presult.Split('^');
            var result = new Result
            {
                Status = parts.Length > 0 ? parts[0] : presult,
                Data = parts.Length > 1 ? parts[1] : string.Empty
            };
            return Ok(result);
        }
        catch (Exception ex)
        {
            var error = new Error
            {
                Status = " ValidateBarCode-Api-Failed ",
                _Error = ex.Message
            };
            return Ok(error);
        }
    }

    [HttpPost("api/ScanCartonCloseFinal")]
    [ProducesResponseType(typeof(Result), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Error), StatusCodes.Status200OK)]
    public async Task<ActionResult> ScanCartonCloseFinal([FromBody] ReqData? reqData)
    {
        try
        {
            if (reqData is null)
            {
                var error = new Error
                {
                    Status = " ValidateBarCode-Api-Failed ",
                    _Error = "Request data is required."
                };
                return Ok(error);
            }

            var drReceiveService = new DrReceiveModelDataService(_configuration);
            var presult = await drReceiveService.ScanCartonCloseFinalAsync(reqData.FinYear ?? string.Empty, reqData.BarcodeNo ?? string.Empty, reqData.ChallanNo);

            var parts = presult.Split('^');
            var result = new Result
            {
                Status = parts.Length > 0 ? parts[0] : presult,
                Data = parts.Length > 1 ? parts[1] : string.Empty
            };

            if (decimal.TryParse(result.Status, out var statusVal) && statusVal == 1)
            {
                presult = await drReceiveService.SaveRcvCartonsAsync(reqData.FinYear ?? string.Empty, reqData.ChallanNo, reqData.BarcodeNo ?? string.Empty, reqData.UserNm ?? string.Empty, "Open");
                parts = presult.Split('^');
                result.Status = parts.Length > 0 ? parts[0] : presult;
                result.Data = parts.Length > 1 ? parts[1] : string.Empty;
            }

            return Ok(result);
        }
        catch (Exception ex)
        {
            var error = new Error
            {
                Status = " ValidateBarCode-Api-Failed ",
                _Error = ex.Message
            };
            return Ok(error);
        }
    }

    [HttpPost("api/MissingScanCartons")]
    [ProducesResponseType(typeof(Result), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Error), StatusCodes.Status200OK)]
    public ActionResult MissingScanCartons([FromBody] ReqData? reqData) => NotConfigured("ValidateBarCode", "DrReceiveModel/SLNP data service is not configured.");

    [HttpPost("api/ExcessScanCartons")]
    [ProducesResponseType(typeof(Result), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Error), StatusCodes.Status200OK)]
    public ActionResult ExcessScanCartons([FromBody] ReqData? reqData) => NotConfigured("ValidateBarCode", "DrReceiveModel/SLNP data service is not configured.");

    [HttpGet("api/GetAllVehiForOpen")]
    [ProducesResponseType(typeof(Result), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Error), StatusCodes.Status200OK)]
    public ActionResult GetAllVehiForOpen() => NotConfigured("GetAllVehiForOpen", "BarcodeSacanQueueModel/SLNP data service is not configured.");

    [HttpGet("api/GetVehiForOpen/{pVehicleNo}")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Error), StatusCodes.Status200OK)]
    public async Task<ActionResult> GetVehiForOpen(string pVehicleNo)
    {
        try
        {
            var barcodeList = new List<(string BARCODE, string NOTEBOOK_NM, decimal CARTON_QTY)>();
            decimal pageNo = 0;

            using var conn = new OracleConnection(_configuration.GetConnectionString("DBOracle"));
            await conn.OpenAsync();

            // Get vehicles for open
            using var vehicleCmd = new OracleCommand("PKG_DATA_FETCH.sp_GetVehicleNoForOpen", conn)
            {
                CommandType = CommandType.StoredProcedure,
                CommandTimeout = 30,
                BindByName = false
            };
            vehicleCmd.Parameters.Add("PVehicleNo", OracleDbType.Varchar2).Value = pVehicleNo;
            var vehicleCursor = vehicleCmd.Parameters.Add("cur_ref", OracleDbType.RefCursor);
            vehicleCursor.Direction = ParameterDirection.Output;

            var distinctBarcodes = new List<string>();
            using (var vehicleReader = await vehicleCmd.ExecuteReaderAsync())
            {
                while (await vehicleReader.ReadAsync())
                {
                    for (int i = 0; i < vehicleReader.FieldCount; i++)
                    {
                        var colName = vehicleReader.GetName(i);
                        if (string.Equals(colName, "BARCODE", StringComparison.OrdinalIgnoreCase) && !vehicleReader.IsDBNull(i))
                        {
                            var bc = vehicleReader.GetString(i).Trim();
                            if (!string.IsNullOrEmpty(bc) && !distinctBarcodes.Contains(bc))
                                distinctBarcodes.Add(bc);
                        }
                    }
                }
            }

            // Get total carton qty
            using var totalCmd = new OracleCommand("PKG_DATA_FETCH.sp_GetPackingCrtnQty", conn)
            {
                CommandType = CommandType.StoredProcedure,
                CommandTimeout = 30,
                BindByName = false
            };
            totalCmd.Parameters.Add("PVehicleNo", OracleDbType.Varchar2).Value = pVehicleNo;
            var totalCursor = totalCmd.Parameters.Add("cur_ref", OracleDbType.RefCursor);
            totalCursor.Direction = ParameterDirection.Output;

            using (var totalReader = await totalCmd.ExecuteReaderAsync())
            {
                if (await totalReader.ReadAsync())
                {
                    for (int i = 0; i < totalReader.FieldCount; i++)
                    {
                        var colName = totalReader.GetName(i);
                        if (string.Equals(colName, "ID", StringComparison.OrdinalIgnoreCase) && !totalReader.IsDBNull(i))
                            pageNo = Convert.ToDecimal(totalReader.GetValue(i));
                    }
                }
            }

            // Get barcode details for each distinct barcode
            foreach (var barcode in distinctBarcodes)
            {
                using var detailCmd = new OracleCommand("PKG_DATA_FETCH.sp_getDtlByBarcode", conn)
                {
                    CommandType = CommandType.StoredProcedure,
                    CommandTimeout = 30,
                    BindByName = false
                };
                detailCmd.Parameters.Add("PBarcode", OracleDbType.Varchar2).Value = barcode.PadRight(15, ' ');
                detailCmd.Parameters.Add("pNOTEBOOK_CODE", OracleDbType.Decimal).Value = 0;
                var detailCursor = detailCmd.Parameters.Add("cur_ref", OracleDbType.RefCursor);
                detailCursor.Direction = ParameterDirection.Output;

                using (var detailReader = await detailCmd.ExecuteReaderAsync())
                {
                    while (await detailReader.ReadAsync())
                    {
                        string noteBookNm = string.Empty;
                        decimal cartonQty = 0;
                        for (int i = 0; i < detailReader.FieldCount; i++)
                        {
                            var colName = detailReader.GetName(i);
                            if (string.Equals(colName, "notebookname", StringComparison.OrdinalIgnoreCase) && !detailReader.IsDBNull(i))
                                noteBookNm = detailReader.GetString(i).Trim();
                            else if (string.Equals(colName, "carton_qty", StringComparison.OrdinalIgnoreCase) && !detailReader.IsDBNull(i))
                                cartonQty = Convert.ToDecimal(detailReader.GetValue(i));
                        }
                        barcodeList.Add((barcode, noteBookNm, cartonQty));
                    }
                }
            }

            decimal totalCartons = barcodeList.Sum(x => x.CARTON_QTY);
            var resultList = new List<object>();
            foreach (var item in barcodeList)
            {
                resultList.Add(new
                {
                    BARCODE = item.BARCODE,
                    CARTON_QTY = item.CARTON_QTY,
                    NOTEBOOK_NM = item.NOTEBOOK_NM,
                    PageNo = pageNo
                });
            }
            resultList.Add(new
            {
                BARCODE = "TOTAL",
                CARTON_QTY = totalCartons,
                NOTEBOOK_NM = "TOTAL",
                PageNo = pageNo
            });

            return Ok(resultList);
        }
        catch (Exception ex)
        {
            return Ok(new
            {
                Status = "GetAllVehiForOpen-Api-Failed",
                _Error = ex.Message
            });
        }
    }

    [HttpGet("api/GetAllDistVehiForOpen")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Error), StatusCodes.Status200OK)]
    public async Task<ActionResult> GetAllDistVehiForOpen()
    {
        try
        {
            var vehicles = new List<object>();
            using var conn = new OracleConnection(_configuration.GetConnectionString("DBOracle"));
            await conn.OpenAsync();

            using var cmd = new OracleCommand("PKG_DATA_FETCH.sp_GetAllDistVehicleNoForOpen", conn)
            {
                CommandType = CommandType.StoredProcedure,
                CommandTimeout = 30,
                BindByName = false
            };
            var pCursor = cmd.Parameters.Add("cur_ref", OracleDbType.RefCursor);
            pCursor.Direction = ParameterDirection.Output;

            using var reader = await cmd.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                for (int i = 0; i < reader.FieldCount; i++)
                {
                    var colName = reader.GetName(i);
                    if (string.Equals(colName, "VEHICLE_NO", StringComparison.OrdinalIgnoreCase))
                    {
                        var vehicleNo = reader.IsDBNull(i) ? string.Empty : reader.GetString(i).Trim();
                        if (!string.IsNullOrEmpty(vehicleNo))
                        {
                            vehicles.Add(new { VEHICLE_NO = vehicleNo });
                        }
                    }
                }
            }

            return Ok(new { Status = "success", Data = vehicles });
        }
        catch (Exception ex)
        {
            return Ok(new { Status = "failed", Data = new List<object>(), _Error = ex.Message });
        }
    }

    [HttpPost("api/SaveScanBarcode/{crby}")]
    [ProducesResponseType(typeof(Result), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Error), StatusCodes.Status200OK)]
    public ActionResult Post([FromBody] object? barcodeSacanQueueModel, string crby) => NotConfigured("SaveScanBarcode", "BarcodeSacanQueueModel/SLNP data service is not configured.");

    [HttpPost("api/UpdateVehicle/{pVehicle}")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Error), StatusCodes.Status200OK)]
    public async Task<ActionResult> UpdateVehicle(string pVehicle)
    {
        try
        {
            string presult = string.Empty;
            using var conn = new OracleConnection(_configuration.GetConnectionString("DBOracle"));
            await conn.OpenAsync();

            using var cmd = new OracleCommand("PKG_CRUD.sp_save_sl_barcode_scan_queue", conn)
            {
                CommandType = CommandType.StoredProcedure,
                CommandTimeout = 30,
                BindByName = false
            };
            cmd.Parameters.Add("pID", OracleDbType.Decimal).Value = 1;
            cmd.Parameters.Add("pBarcode", OracleDbType.Varchar2).Value = null;
            cmd.Parameters.Add("pBARCODE_ID", OracleDbType.Decimal).Value = 0;
            cmd.Parameters.Add("pVEHICLE_NO", OracleDbType.Varchar2).Value = pVehicle;
            cmd.Parameters.Add("pCr_date", OracleDbType.Date).Value = null;
            cmd.Parameters.Add("pCR_BY", OracleDbType.Varchar2).Value = string.Empty;
            cmd.Parameters.Add("pDEVICE_ID", OracleDbType.Varchar2).Value = string.Empty;
            cmd.Parameters.Add("pSCAN_STATUS", OracleDbType.Varchar2).Value = string.Empty;
            cmd.Parameters.Add("pDate_Time", OracleDbType.Varchar2).Value = DateTime.Now.ToString("hh:mm tt");
            var pResult = cmd.Parameters.Add("presult", OracleDbType.Varchar2, 4000);
            pResult.Direction = ParameterDirection.Output;

            await cmd.ExecuteNonQueryAsync();
            presult = pResult.Value?.ToString() ?? string.Empty;

            return Ok(new
            {
                Status = " UpdateVehicle-Api-Success ",
                Data = "Vehicle Closed! "
            });
        }
        catch (Exception ex)
        {
            return Ok(new
            {
                Status = " UpdateVehicle-Api-Failed ",
                _Error = ex.Message
            });
        }
    }

    [HttpGet("api/VwGetDifferences/{pFinYear}")]
    [ProducesResponseType(typeof(Result), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Error), StatusCodes.Status200OK)]
    public ActionResult VwGetDifferences(string pFinYear) => NotConfigured("VwGetDifferences", "ViewDifferencesModel/SLNP data service is not configured.");

    [HttpPost("api/SaveReconciled/{pBarcode}")]
    [ProducesResponseType(typeof(Result), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Error), StatusCodes.Status200OK)]
    public ActionResult SaveReconciled(string pBarcode) => NotConfigured("SaveReconciled", "DrReceiveMissingModel/SLNP data service is not configured.");

    [HttpPost("api/ScanOrderNo")]
    [ProducesResponseType(typeof(Result), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Error), StatusCodes.Status200OK)]
    public async Task<ActionResult> ScanOrderNo([FromBody] ReqData? reqData)
    {
        try
        {
            if (reqData is null)
            {
                var error = new Error
                {
                    Status = " ScanOrderNo-Api-Failed ",
                    _Error = "Request data is required."
                };
                return Ok(error);
            }

            var subService = new SldispatchbarcodeSubModelDataService(_configuration);
            var subModel = await subService.SpGetDispDtlByFinYearOrdId(reqData.OrderNo, reqData.FinYear ?? string.Empty);

            var listService = new SldispatchbarcodeModelDataService(_configuration);
            var list = await listService.SpGetAllDispDtlByFinYearOrdId(reqData.OrderNo, reqData.FinYear ?? string.Empty);

            var result = new Result();
            if (subModel != null && subModel.Orderid > 0 && (list.Count == 0 || list[0].Docstatus != "Closed"))
            {
                result.Status = "1";
                result.Data = subModel;
            }
            else if (subModel != null && subModel.Orderid > 0 && list.Count > 0 && list[0].Docstatus == "Closed")
            {
                result.Status = "-1";
                result.Data = null;
            }
            else
            {
                result.Status = "0";
                result.Data = null;
            }
            return Ok(result);
        }
        catch (Exception ex)
        {
            var error = new Error
            {
                Status = " ScanOrderNo-Api-Failed ",
                _Error = ex.Message
            };
            return Ok(error);
        }
    }

    [HttpPost("api/ScanDispatchCarton")]
    [ProducesResponseType(typeof(Result), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Error), StatusCodes.Status200OK)]
    public async Task<ActionResult> ScanDispatchCarton([FromBody] ReqData? reqData)
    {
        try
        {
            if (reqData is null)
            {
                var error = new Error
                {
                    Status = " ValidateBarCode-Api-Failed ",
                    _Error = "Request data is required."
                };
                return Ok(error);
            }

            var service = new SldispatchbarcodeModelDataService(_configuration);
            var presult = await service.SaveDispatchBarCodeAsync(reqData.FinYear, reqData.OrderNo, reqData.BarcodeNo, reqData.UserNm, "Draft");

            var result = new Result();
            var parts = presult.Split('^');
            result.Status = parts.Length > 0 ? parts[0] : string.Empty;
            result.Data = parts.Length > 1 ? parts[1] : string.Empty;
            return Ok(result);
        }
        catch (Exception ex)
        {
            var error = new Error
            {
                Status = " ValidateBarCode-Api-Failed ",
                _Error = ex.Message
            };
            return Ok(error);
        }
    }

    [HttpPost("api/CloseDispatch")]
    [ProducesResponseType(typeof(Result), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Error), StatusCodes.Status200OK)]
    public async Task<ActionResult> CloseDispatch([FromBody] ReqData? reqData)
    {
        try
        {
            if (reqData is null)
            {
                var error = new Error
                {
                    Status = " ValidateBarCode-Api-Failed ",
                    _Error = "Request data is required."
                };
                return Ok(error);
            }

            var service = new SldispatchbarcodeModelDataService(_configuration);
            var presult = await service.SaveDispatchBarCodeAsync(reqData.FinYear, reqData.OrderNo, null, reqData.UserNm, "Closed");

            var result = new Result();
            var parts = presult.Split('^');
            result.Status = parts.Length > 0 ? parts[0] : string.Empty;
            result.Data = parts.Length > 1 ? parts[1] : string.Empty;
            return Ok(result);
        }
        catch (Exception ex)
        {
            var error = new Error
            {
                Status = " ValidateBarCode-Api-Failed ",
                _Error = ex.Message
            };
            return Ok(error);
        }
    }

    [HttpPost("api/SpGetAllDispDtlByFinYearOrdId")]
    [ProducesResponseType(typeof(Result), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Error), StatusCodes.Status200OK)]
    public async Task<ActionResult> SpGetAllDispDtlByFinYearOrdId([FromBody] ReqData? reqData)
    {
        try
        {
            if (reqData is null)
            {
                var error = new Error
                {
                    Status = " SpGetAllDispDtlByFinYearOrdId-Api-Failed ",
                    _Error = "Request data is required."
                };
                return Ok(error);
            }

            var listService = new SldispatchbarcodeModelDataService(_configuration);
            var list = await listService.SpGetAllDispDtlByFinYearOrdId(reqData.OrderNo, reqData.FinYear ?? string.Empty);

            var result = new Result
            {
                Status = "1",
                Data = list
            };
            return Ok(result);
        }
        catch (Exception ex)
        {
            var error = new Error
            {
                Status = " SpGetAllDispDtlByFinYearOrdId-Api-Failed ",
                _Error = ex.Message
            };
            return Ok(error);
        }
    }

    [HttpGet("api/ReviewDispatch")]
    [ProducesResponseType(typeof(Result), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Error), StatusCodes.Status200OK)]
    public ActionResult ReviewDispatch() => NotConfigured("ReviewDispatch", "sldispatchbarcodeModel/SLNP data service is not configured.");

    [HttpPost("api/VerifyCarton")]
    [ProducesResponseType(typeof(Result), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Error), StatusCodes.Status200OK)]
    public async Task<ActionResult> VerifyCarton([FromBody] ReqData? reqData)
    {
        try
        {
            if (reqData is null)
            {
                var error = new Error
                {
                    Status = " ValidateBarCode-Api-Failed ",
                    _Error = "Request data is required."
                };
                return Ok(error);
            }

            var service = new DrReceiveModelDataService(_configuration);
            var presult = await service.SaveStockInputAsync(reqData.FinYear, reqData.BarcodeNo, reqData.UserNm);

            var result = new Result();
            var parts = presult.Split('^');
            result.Status = parts.Length > 0 ? parts[0] : string.Empty;
            result.Data = parts.Length > 1 ? parts[1] : string.Empty;
            return Ok(result);
        }
        catch (Exception ex)
        {
            var error = new Error
            {
                Status = " ValidateBarCode-Api-Failed ",
                _Error = ex.Message
            };
            return Ok(error);
        }
    }

    [HttpPost("api/StkInput")]
    [ProducesResponseType(typeof(Result), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Error), StatusCodes.Status200OK)]
    public async Task<ActionResult> StkInput([FromBody] ReqData? reqData)
    {
        try
        {
            if (reqData is null)
            {
                var error = new Error
                {
                    Status = " ValidateBarCode-Api-Failed ",
                    _Error = "Request data is required."
                };
                return Ok(error);
            }

            var service = new DrReceiveModelDataService(_configuration);
            var presult = await service.SaveStkInputAsync(reqData.FinYear, reqData.BarcodeNo, reqData.UserNm);

            var result = new Result();
            var parts = presult.Split('^');
            result.Status = parts.Length > 0 ? parts[0] : string.Empty;
            result.Data = parts.Length > 1 ? parts[1] : string.Empty;
            return Ok(result);
        }
        catch (Exception ex)
        {
            var error = new Error
            {
                Status = " ValidateBarCode-Api-Failed ",
                _Error = ex.Message
            };
            return Ok(error);
        }
    }

    // GET: api/PackingSlipScanning/5
    [HttpGet("api/PackingSlipScanning/{id:int}")]
    [ProducesResponseType(typeof(string), StatusCodes.Status200OK)]
    public ActionResult<string> Get(int id)
    {
        return Ok("value");
    }

    // POST: api/PackingSlipScanning
    [HttpPost("api/PackingSlipScanning")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public IActionResult Post([FromBody] string? value)
    {
        return Ok();
    }

    // PUT: api/PackingSlipScanning/5
    [HttpPut("api/PackingSlipScanning/{id:int}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public IActionResult Put(int id, [FromBody] string? value)
    {
        return Ok();
    }

    // DELETE: api/PackingSlipScanning/5
    [HttpDelete("api/PackingSlipScanning/{id:int}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public IActionResult Delete(int id)
    {
        return Ok();
    }

    [HttpPost("api/ScanTrChallanNo")]
    [ProducesResponseType(typeof(Result), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Error), StatusCodes.Status200OK)]
    public async Task<ActionResult> ScanTrChallanNo([FromBody] ReqData? reqData)
    {
        try
        {
            if (reqData is null)
            {
                var error = new Error
                {
                    Status = " ScanTrChallanNo-Api-Failed ",
                    _Error = "Request data is required."
                };
                return Ok(error);
            }

            var subService = new TransferChallanReqSubModelDataService(_configuration);
            var subModel = await subService.SpGetTrChalnDtlByFinYearId(reqData.ChallanNo, reqData.FinYear ?? string.Empty);

            var listService = new slTrChallanReqBarcodeModelDataService(_configuration);
            var list = await listService.SpGetAllTrChlnNoBrcdDtlByFinYearId(reqData.ChallanNo, reqData.FinYear ?? string.Empty);

            var result = new Result();
            if (list.Count > 0 && (list[0].VehicleNo?.Trim() ?? string.Empty) != (reqData.VehicleNo?.Trim() ?? string.Empty))
            {
                result.Status = "-2";
                result.Data = null;
                return Ok(result);
            }

            if (subModel != null && subModel.TrChlnReqId > 0 && (list.Count == 0 || list[0].Docstatus != "Closed"))
            {
                result.Status = "1";
                result.Data = subModel;
            }
            else if (subModel != null && subModel.TrChlnReqId > 0 && list[0].Docstatus == "Closed")
            {
                result.Status = "-1";
                result.Data = null;
            }
            else
            {
                result.Status = "0";
                result.Data = null;
            }
            return Ok(result);
        }
        catch (Exception ex)
        {
            var error = new Error
            {
                Status = " ScanTrChallanNo-Api-Failed ",
                _Error = ex.Message
            };
            return Ok(error);
        }
    }

    [HttpPost("api/ScanTrChlnCarton")]
    [ProducesResponseType(typeof(Result), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Error), StatusCodes.Status200OK)]
    public ActionResult ScanTrChlnCarton([FromBody] ReqData? reqData) => NotConfigured("ScanTrChlnCarton", "slTrChallanReqBarcodeModel/SLNP data service is not configured.");

    [HttpPost("api/CloseTrChallanNo")]
    [ProducesResponseType(typeof(Result), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Error), StatusCodes.Status200OK)]
    public ActionResult CloseTrChallanNo([FromBody] ReqData? reqData) => NotConfigured("CloseTrChallanNo", "slTrChallanReqBarcodeModel/SLNP data service is not configured.");

    [HttpPost("api/SpGetAllTrChlnNoDtlByFinYearOrdId")]
    [ProducesResponseType(typeof(Result), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Error), StatusCodes.Status200OK)]
    public ActionResult SpGetAllTrChlnNoDtlByFinYearOrdId([FromBody] ReqData? reqData) => NotConfigured("SpGetAllTrChlnNoDtlByFinYearOrdId", "slTrChallanReqBarcodeModel/SLNP data service is not configured.");

    [HttpGet("api/ReviewTrChlnReq")]
    [ProducesResponseType(typeof(Result), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Error), StatusCodes.Status200OK)]
    public async Task<ActionResult> ReviewTrChlnReq()
    {
        try
        {
            var service = new slTrChallanReqBarcodeModelDataService(_configuration);
            var list = await service.SpGetAllOpnTrChlnDtl();

            var result = new Result
            {
                Status = "ReviewDispatch-Api-Success ",
                Data = list
            };
            return Ok(result);
        }
        catch (Exception ex)
        {
            var error = new Error
            {
                Status = " ReviewTrChlnReq-Api-Failed ",
                _Error = ex.Message
            };
            return Ok(error);
        }
    }

    private ObjectResult NotConfigured(string operation, string message)
    {
        return StatusCode(StatusCodes.Status501NotImplemented, new Error
        {
            Status = $"{operation}-Api-Failed",
            Source = nameof(PackingSlipScanningController),
            _Error = $"{message} Port the SLNP model/data-service layer into this backend to enable this endpoint."
        });
    }

    public sealed class ValidateBarcodeRequest
    {
        public string BARCODE { get; set; } = string.Empty;
        public string VEHICLE_NO { get; set; } = string.Empty;
        public string CR_BY { get; set; } = string.Empty;
        public string DEVICE_ID { get; set; } = string.Empty;
    }

    private static object NVL(string? value) => string.IsNullOrEmpty(value) ? (object)DBNull.Value : value!;
}

public sealed class LoginRequest
{
    public string UserName { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

using backend.Dtos;
using backend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace backend.Controllers;

[ApiController]
[Produces("application/json")]
public class BookController : ControllerBase
{
    private readonly IConfiguration _configuration;
    private readonly ObUpdateOrderDataService _obUpdateOrderService;
    private readonly ObDispBrcdDataService _obDispBrcdService;

    public BookController(IConfiguration configuration)
    {
        _configuration = configuration;
        _obUpdateOrderService = new ObUpdateOrderDataService(configuration);
        _obDispBrcdService = new ObDispBrcdDataService(configuration);
    }

    [HttpGet("api/GetOrdDtlByOrdNoFinYr/{pOrderNo}/{pFinYear}")]
    [ProducesResponseType(typeof(Result), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Error), StatusCodes.Status200OK)]
    public async Task<ActionResult> GetOrdDtlByOrdNoFinYr(int pOrderNo, string pFinYear)
    {
        try
        {
            var result = new Result();
            var lst = await _obUpdateOrderService.GetOrdDtlByOrdNoFinYrAsync(pOrderNo, pFinYear);

            if (lst.Count == 0)
            {
                result.Status = "404";
                result.Data = "No Data For This Order No.";
                return Ok(result);
            }
            else
            {
                result.Status = "1";
                result.Data = lst;
                return Ok(result);
            }
        }
        catch (System.Exception ex)
        {
            var error = new Error
            {
                Status = "0",
                Source = "GetOrdDtlByOrdNoFinYr-Api-Failed",
                _Error = ex.Message
            };
            return Ok(error);
        }
    }

    [HttpPost("api/ScanBrcd")]
    [ProducesResponseType(typeof(Result), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Error), StatusCodes.Status200OK)]
    public async Task<ActionResult> ScanBrcd([FromBody] ReqData reqData)
    {
        try
        {
            var result = new Result();
            var lst = await _obDispBrcdService.SaveAsync(
                reqData.OrderNo,
                reqData.FinYear ?? string.Empty,
                reqData.BarcodeNo ?? string.Empty,
                reqData.BarcodeType ?? string.Empty,
                reqData.Qty,
                reqData.UserNm ?? string.Empty
            );

            if (lst.Count > 0)
            {
                result.Status = lst[0].Status ?? "0";
                result.Data = lst;
            }
            else
            {
                result.Status = "0";
                result.Data = "No response from database";
            }

            return Ok(result);
        }
        catch (System.Exception ex)
        {
            var error = new Error
            {
                Status = "0",
                Source = "ValidateBarCode-Api-Failed",
                _Error = ex.Message
            };
            return Ok(error);
        }
    }
}
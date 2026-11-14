using System.Security.Claims;
using System.Security.Cryptography;
using backend.Dtos;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class AccountController : ControllerBase
{
    private const string LocalLoginProvider = "Local";

    // GET api/Account/UserInfo
    [HttpGet("UserInfo")]
    [ProducesResponseType(typeof(UserInfoViewModel), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public ActionResult<UserInfoViewModel> GetUserInfo()
    {
        var identity = User.Identity as ClaimsIdentity;
        var externalLogin = ExternalLoginData.FromIdentity(identity);

        return Ok(new UserInfoViewModel
        {
            Email = User.Identity?.Name ?? identity?.FindFirst(ClaimTypes.Email)?.Value,
            HasRegistered = externalLogin is null,
            LoginProvider = externalLogin?.LoginProvider
        });
    }

    // POST api/Account/Logout
    [HttpPost("Logout")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> Logout()
    {
        await HttpContext.SignOutAsync();
        return Ok();
    }

    // GET api/Account/ManageInfo?returnUrl=%2F&generateState=true
    [HttpGet("ManageInfo")]
    [ProducesResponseType(typeof(ManageInfoViewModel), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public ActionResult<ManageInfoViewModel?> GetManageInfo(string? returnUrl, bool generateState = false)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var userName = User.Identity?.Name ?? User.FindFirstValue(ClaimTypes.Email);
        if (string.IsNullOrWhiteSpace(userId) && string.IsNullOrWhiteSpace(userName))
        {
            return NotFound();
        }

        var logins = new List<UserLoginInfoViewModel>();
        if (!string.IsNullOrWhiteSpace(userName))
        {
            logins.Add(new UserLoginInfoViewModel
            {
                LoginProvider = LocalLoginProvider,
                ProviderKey = userName
            });
        }

        return Ok(new ManageInfoViewModel
        {
            LocalLoginProvider = LocalLoginProvider,
            Email = userName,
            Logins = logins,
            ExternalLoginProviders = GetExternalLoginsInternal(returnUrl, generateState)
        });
    }

    // POST api/Account/ChangePassword
    [HttpPost("ChangePassword")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status501NotImplemented)]
    public IActionResult ChangePassword([FromBody] ChangePasswordBindingModel model)
    {
        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        return NotImplementedError("ChangePassword requires ASP.NET Core Identity configuration.");
    }

    // POST api/Account/SetPassword
    [HttpPost("SetPassword")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status501NotImplemented)]
    public IActionResult SetPassword([FromBody] SetPasswordBindingModel model)
    {
        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        return NotImplementedError("SetPassword requires ASP.NET Core Identity configuration.");
    }

    // POST api/Account/AddExternalLogin
    [HttpPost("AddExternalLogin")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status501NotImplemented)]
    public IActionResult AddExternalLogin([FromBody] AddExternalLoginBindingModel model)
    {
        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        return NotImplementedError("AddExternalLogin requires external authentication/Identity configuration.");
    }

    // POST api/Account/RemoveLogin
    [HttpPost("RemoveLogin")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status501NotImplemented)]
    public IActionResult RemoveLogin([FromBody] RemoveLoginBindingModel model)
    {
        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        return NotImplementedError("RemoveLogin requires ASP.NET Core Identity configuration.");
    }

    // GET api/Account/ExternalLogin
    [AllowAnonymous]
    [HttpGet("ExternalLogin", Name = "ExternalLogin")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status302Found)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status501NotImplemented)]
    public async Task<IActionResult> GetExternalLogin(string provider, string? error = null)
    {
        if (!string.IsNullOrWhiteSpace(error))
        {
            var target = Url.Content("~/") + "#error=" + Uri.EscapeDataString(error);
            return Redirect(target);
        }

        if (string.IsNullOrWhiteSpace(provider))
        {
            return BadRequest(new ErrorResponse
            {
                Message = "Provider is required.",
                Status = StatusCodes.Status400BadRequest,
                Code = "provider_required"
            });
        }

        var schemes = await HttpContext.RequestServices
            .GetRequiredService<IAuthenticationSchemeProvider>()
            .GetAllSchemesAsync();
        if (schemes.Any(s => string.Equals(s.Name, provider, StringComparison.OrdinalIgnoreCase)))
        {
            if (User.Identity?.IsAuthenticated != true)
            {
                return Challenge(new AuthenticationProperties { RedirectUri = Url.RouteUrl("ExternalLogin", new { provider }) }, provider);
            }

            return Ok();
        }

        return NotImplementedError($"External provider '{provider}' is not configured.");
    }

    // GET api/Account/ExternalLogins?returnUrl=%2F&generateState=true
    [AllowAnonymous]
    [HttpGet("ExternalLogins")]
    [ProducesResponseType(typeof(IEnumerable<ExternalLoginViewModel>), StatusCodes.Status200OK)]
    public ActionResult<IEnumerable<ExternalLoginViewModel>> GetExternalLogins(string? returnUrl, bool generateState = false)
    {
        return Ok(GetExternalLoginsInternal(returnUrl, generateState));
    }

    // POST api/Account/Register
    [AllowAnonymous]
    [HttpPost("Register")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status501NotImplemented)]
    public IActionResult Register([FromBody] RegisterBindingModel model)
    {
        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        if (!string.IsNullOrWhiteSpace(model.ConfirmPassword) &&
            !string.Equals(model.Password, model.ConfirmPassword, StringComparison.Ordinal))
        {
            ModelState.AddModelError(nameof(model.ConfirmPassword), "The password and confirmation password do not match.");
            return ValidationProblem(ModelState);
        }

        return NotImplementedError("Register requires ASP.NET Core Identity configuration.");
    }

    // POST api/Account/RegisterExternal
    [AllowAnonymous]
    [HttpPost("RegisterExternal")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status501NotImplemented)]
    public IActionResult RegisterExternal([FromBody] RegisterExternalBindingModel model)
    {
        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        return NotImplementedError("RegisterExternal requires external authentication/Identity configuration.");
    }

    private ObjectResult NotImplementedError(string message)
    {
        return StatusCode(StatusCodes.Status501NotImplemented, new ErrorResponse
        {
            Message = message,
            Status = StatusCodes.Status501NotImplemented,
            Code = "identity_not_configured"
        });
    }

    private IEnumerable<ExternalLoginViewModel> GetExternalLoginsInternal(string? returnUrl, bool generateState)
    {
        var state = generateState ? RandomOAuthStateGenerator.Generate(256) : null;
        var redirect = new Uri(Request.Scheme + "://" + Request.Host + (returnUrl ?? "/")).AbsoluteUri;
        var schemes = HttpContext.RequestServices
            .GetRequiredService<IAuthenticationSchemeProvider>()
            .GetAllSchemesAsync()
            .GetAwaiter()
            .GetResult();

        foreach (var scheme in schemes.Where(s => !string.IsNullOrWhiteSpace(s.DisplayName) || s.HandlerType?.Name.Contains("OAuth", StringComparison.OrdinalIgnoreCase) == true))
        {
            yield return new ExternalLoginViewModel
            {
                Name = scheme.DisplayName ?? scheme.Name,
                Url = Url.RouteUrl("ExternalLogin", new
                {
                    provider = scheme.Name,
                    response_type = "token",
                    redirect_uri = redirect,
                    state
                }) ?? string.Empty,
                State = state
            };
        }
    }

    private sealed class ExternalLoginData
    {
        public string LoginProvider { get; init; } = string.Empty;
        public string ProviderKey { get; init; } = string.Empty;
        public string? UserName { get; init; }

        public static ExternalLoginData? FromIdentity(ClaimsIdentity? identity)
        {
            if (identity is null)
            {
                return null;
            }

            var providerKeyClaim = identity.FindFirst(ClaimTypes.NameIdentifier);
            if (providerKeyClaim is null ||
                string.IsNullOrWhiteSpace(providerKeyClaim.Issuer) ||
                string.IsNullOrWhiteSpace(providerKeyClaim.Value))
            {
                return null;
            }

            if (string.Equals(providerKeyClaim.Issuer, ClaimsIdentity.DefaultIssuer, StringComparison.Ordinal))
            {
                return null;
            }

            return new ExternalLoginData
            {
                LoginProvider = providerKeyClaim.Issuer,
                ProviderKey = providerKeyClaim.Value,
                UserName = identity.FindFirst(ClaimTypes.Name)?.Value
            };
        }
    }

    private static class RandomOAuthStateGenerator
    {
        public static string Generate(int strengthInBits)
        {
            const int bitsPerByte = 8;
            if (strengthInBits % bitsPerByte != 0)
            {
                throw new ArgumentException("strengthInBits must be evenly divisible by 8.", nameof(strengthInBits));
            }

            var data = RandomNumberGenerator.GetBytes(strengthInBits / bitsPerByte);
            return Convert.ToBase64String(data).TrimEnd('=').Replace('+', '-').Replace('/', '_');
        }
    }
}

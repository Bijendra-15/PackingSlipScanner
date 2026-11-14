namespace backend.Dtos;

public sealed class UserInfoViewModel
{
    public string? Email { get; set; }
    public bool HasRegistered { get; set; }
    public string? LoginProvider { get; set; }
}

public sealed class ManageInfoViewModel
{
    public string LocalLoginProvider { get; set; } = string.Empty;
    public string? Email { get; set; }
    public List<UserLoginInfoViewModel> Logins { get; set; } = new();
    public IEnumerable<ExternalLoginViewModel> ExternalLoginProviders { get; set; } = [];
}

public sealed class UserLoginInfoViewModel
{
    public string LoginProvider { get; set; } = string.Empty;
    public string ProviderKey { get; set; } = string.Empty;
}

public sealed class ExternalLoginViewModel
{
    public string Name { get; set; } = string.Empty;
    public string Url { get; set; } = string.Empty;
    public string? State { get; set; }
}

public sealed class ChangePasswordBindingModel
{
    public string OldPassword { get; set; } = string.Empty;
    public string NewPassword { get; set; } = string.Empty;
}

public sealed class SetPasswordBindingModel
{
    public string NewPassword { get; set; } = string.Empty;
}

public sealed class AddExternalLoginBindingModel
{
    public string ExternalAccessToken { get; set; } = string.Empty;
}

public sealed class RemoveLoginBindingModel
{
    public string LoginProvider { get; set; } = string.Empty;
    public string ProviderKey { get; set; } = string.Empty;
}

public sealed class RegisterBindingModel
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string? ConfirmPassword { get; set; }
}

public sealed class RegisterExternalBindingModel
{
    public string Email { get; set; } = string.Empty;
}

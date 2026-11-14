namespace backend.Dtos;

public sealed class Result
{
    public string? Status { get; set; }
    public string? AppName { get; set; }
    public object? Data { get; set; }
}

public sealed class Error
{
    public string? Status { get; set; }
    public string? Source { get; set; }
    public string? _Error { get; set; }
}

public sealed class BarcodeScanned
{
    public string? Status { get; set; }
    public string? NoteBookNm { get; set; }
    public string? qty { get; set; }
    public string? TotCartScanned { get; set; }
}

public sealed class ReqData
{
    public int UserId { get; set; }
    public string? UserNm { get; set; }
    public int ChallanNo { get; set; }
    public int OrderNo { get; set; }
    public string? BarcodeNo { get; set; }
    public string? BarcodeType { get; set; }
    public string? FinYear { get; set; }
    public string? Carton { get; set; }
    public string? VehicleNo { get; set; }
    public int Qty { get; set; }
}

public sealed class ChangePasswordRequest
{
    public int UserId { get; set; }
    public string Password { get; set; } = string.Empty;
}

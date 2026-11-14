namespace backend.Models;

public sealed class PackSlipItem
{
    public string Sku { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public string? Location { get; set; }
}

public sealed class PackSlip
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string SlipNumber { get; set; } = string.Empty;
    public string CustomerName { get; set; } = string.Empty;
    public string? OrderNumber { get; set; }
    public string Status { get; set; } = "pending";
    public List<PackSlipItem> Items { get; set; } = new();
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public static class PackSlipStatuses
{
    public const string Pending = "pending";
    public const string Picked = "picked";
    public const string Packed = "packed";
    public const string Shipped = "shipped";
    public const string Cancelled = "cancelled";

    public static readonly IReadOnlyList<string> All =
        [Pending, Picked, Packed, Shipped, Cancelled];
}

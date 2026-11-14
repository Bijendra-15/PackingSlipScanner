using backend.Models;

namespace backend.Dtos;

public sealed class CreatePackSlipDto
{
    public string SlipNumber { get; set; } = string.Empty;
    public string CustomerName { get; set; } = string.Empty;
    public string? OrderNumber { get; set; }
    public string Status { get; set; } = PackSlipStatuses.Pending;
    public List<CreatePackSlipItemDto> Items { get; set; } = new();
}

public sealed class CreatePackSlipItemDto
{
    public string Sku { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public string? Location { get; set; }
}

public sealed class UpdatePackSlipDto
{
    public string? CustomerName { get; set; }
    public string? OrderNumber { get; set; }
    public string? Status { get; set; }
    public List<UpdatePackSlipItemDto>? Items { get; set; }
}

public sealed class UpdatePackSlipItemDto
{
    public string Sku { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public string? Location { get; set; }
}

public sealed class PackSlipDto
{
    public string Id { get; set; } = string.Empty;
    public string SlipNumber { get; set; } = string.Empty;
    public string CustomerName { get; set; } = string.Empty;
    public string? OrderNumber { get; set; }
    public string Status { get; set; } = string.Empty;
    public List<PackSlipItemDto> Items { get; set; } = new();
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public sealed class PackSlipItemDto
{
    public string Sku { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public string? Location { get; set; }
}

public sealed class ScanRequestDto
{
    public string SlipNumber { get; set; } = string.Empty;
    public string? Location { get; set; }
}

public sealed class ScanResponseDto
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public PackSlipDto? Slip { get; set; }
}

public sealed class PaginatedResponseDto<T>
{
    public List<T> Data { get; set; } = new();
    public int Total { get; set; }
    public int Page { get; set; }
    public int Limit { get; set; }
    public bool HasNext { get; set; }
}

public sealed class ErrorResponse
{
    public string Message { get; set; } = string.Empty;
    public int? Status { get; set; }
    public string? Code { get; set; }
}

using backend.Models;
using backend.Dtos;

namespace backend.Data;

public static class PackSlipExtensions
{
    public static PackSlip Clone(this PackSlip source)
    {
        return new PackSlip
        {
            Id = source.Id,
            SlipNumber = source.SlipNumber,
            CustomerName = source.CustomerName,
            OrderNumber = source.OrderNumber,
            Status = source.Status,
            Items = source.Items.Select(i => new PackSlipItem
            {
                Sku = i.Sku,
                Name = i.Name,
                Quantity = i.Quantity,
                Location = i.Location
            }).ToList(),
            CreatedAt = source.CreatedAt,
            UpdatedAt = source.UpdatedAt
        };
    }

    public static PackSlipDto ToDto(this PackSlip source)
    {
        return new PackSlipDto
        {
            Id = source.Id,
            SlipNumber = source.SlipNumber,
            CustomerName = source.CustomerName,
            OrderNumber = source.OrderNumber,
            Status = source.Status,
            Items = source.Items.Select(i => new PackSlipItemDto
            {
                Sku = i.Sku,
                Name = i.Name,
                Quantity = i.Quantity,
                Location = i.Location
            }).ToList(),
            CreatedAt = source.CreatedAt,
            UpdatedAt = source.UpdatedAt
        };
    }
}

using backend.Data;
using backend.Dtos;
using backend.Models;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class PackSlipsController : ControllerBase
{
    private readonly IPackSlipRepository _repository;

    public PackSlipsController(IPackSlipRepository repository)
    {
        _repository = repository;
    }

    /// <summary>
    /// Get a paginated list of pack slips.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(PaginatedResponseDto<PackSlipDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<PaginatedResponseDto<PackSlipDto>>> GetPackSlips(
        [FromQuery] string? status,
        [FromQuery] int page = 1,
        [FromQuery] int limit = 20,
        CancellationToken ct = default)
    {
        if (page < 1) page = 1;
        if (limit < 1) limit = 20;
        if (limit > 100) limit = 100;

        if (status is not null && !PackSlipStatuses.All.Contains(status, StringComparer.OrdinalIgnoreCase))
        {
            return BadRequest(new ErrorResponse
            {
                Message = $"Invalid status '{status}'. Allowed values: {string.Join(", ", PackSlipStatuses.All)}.",
                Status = StatusCodes.Status400BadRequest,
                Code = "invalid_status"
            });
        }

        var items = await _repository.GetAllAsync(status, page, limit, ct);
        var total = await _repository.CountAsync(status, ct);

        return Ok(new PaginatedResponseDto<PackSlipDto>
        {
            Data = items.Select(s => s.ToDto()).ToList(),
            Total = total,
            Page = page,
            Limit = limit,
            HasNext = page * limit < total
        });
    }

    /// <summary>
    /// Get a pack slip by its slip number.
    /// </summary>
    [HttpGet("{slipNumber}")]
    [ProducesResponseType(typeof(PackSlipDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<PackSlipDto>> GetPackSlipByNumber(string slipNumber, CancellationToken ct = default)
    {
        var slip = await _repository.GetBySlipNumberAsync(slipNumber, ct);
        if (slip is null)
        {
            return NotFound(new ErrorResponse
            {
                Message = $"Pack slip '{slipNumber}' not found.",
                Status = StatusCodes.Status404NotFound,
                Code = "not_found"
            });
        }

        return Ok(slip.ToDto());
    }

    /// <summary>
    /// Create a new pack slip.
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(PackSlipDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<PackSlipDto>> CreatePackSlip(
        [FromBody] CreatePackSlipDto dto,
        CancellationToken ct = default)
    {
        if (await _repository.GetBySlipNumberAsync(dto.SlipNumber, ct) is not null)
        {
            return Conflict(new ErrorResponse
            {
                Message = $"Pack slip '{dto.SlipNumber}' already exists.",
                Status = StatusCodes.Status409Conflict,
                Code = "duplicate_slip_number"
            });
        }

        var slip = new PackSlip
        {
            SlipNumber = dto.SlipNumber,
            CustomerName = dto.CustomerName,
            OrderNumber = dto.OrderNumber,
            Status = PackSlipStatuses.All.Contains(dto.Status, StringComparer.OrdinalIgnoreCase)
                ? dto.Status
                : PackSlipStatuses.Pending,
            Items = dto.Items.Select(i => new PackSlipItem
            {
                Sku = i.Sku,
                Name = i.Name,
                Quantity = i.Quantity,
                Location = i.Location
            }).ToList()
        };

        var created = await _repository.CreateAsync(slip, ct);
        return CreatedAtAction(nameof(GetPackSlipByNumber), new { slipNumber = created.SlipNumber }, created.ToDto());
    }

    /// <summary>
    /// Update an existing pack slip by ID.
    /// </summary>
    [HttpPut("{id}")]
    [ProducesResponseType(typeof(PackSlipDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<PackSlipDto>> UpdatePackSlip(
        string id,
        [FromBody] UpdatePackSlipDto dto,
        CancellationToken ct = default)
    {
        if (dto.Status is not null && !PackSlipStatuses.All.Contains(dto.Status, StringComparer.OrdinalIgnoreCase))
        {
            return BadRequest(new ErrorResponse
            {
                Message = $"Invalid status '{dto.Status}'.",
                Status = StatusCodes.Status400BadRequest,
                Code = "invalid_status"
            });
        }

        var updated = await _repository.UpdateAsync(id, slip =>
        {
            if (dto.CustomerName is not null) slip.CustomerName = dto.CustomerName;
            if (dto.OrderNumber is not null) slip.OrderNumber = dto.OrderNumber;
            if (dto.Status is not null) slip.Status = dto.Status;
            if (dto.Items is not null)
            {
                slip.Items = dto.Items.Select(i => new PackSlipItem
                {
                    Sku = i.Sku,
                    Name = i.Name,
                    Quantity = i.Quantity,
                    Location = i.Location
                }).ToList();
            }
        }, ct);

        if (updated is null)
        {
            return NotFound(new ErrorResponse
            {
                Message = $"Pack slip with id '{id}' not found.",
                Status = StatusCodes.Status404NotFound,
                Code = "not_found"
            });
        }

        return Ok(updated.ToDto());
    }

    /// <summary>
    /// Delete a pack slip by ID.
    /// </summary>
    [HttpDelete("{id}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeletePackSlip(string id, CancellationToken ct = default)
    {
        var deleted = await _repository.DeleteAsync(id, ct);
        if (!deleted)
        {
            return NotFound(new ErrorResponse
            {
                Message = $"Pack slip with id '{id}' not found.",
                Status = StatusCodes.Status404NotFound,
                Code = "not_found"
            });
        }

        return NoContent();
    }

    /// <summary>
    /// Scan a pack slip by slip number, optionally setting a location.
    /// </summary>
    [HttpPost("scan")]
    [ProducesResponseType(typeof(ScanResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ScanResponseDto>> ScanPackSlip(
        [FromBody] ScanRequestDto dto,
        CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(dto.SlipNumber))
        {
            return BadRequest(new ErrorResponse
            {
                Message = "Slip number is required.",
                Status = StatusCodes.Status400BadRequest,
                Code = "slip_number_required"
            });
        }

        var result = await _repository.ScanAsync(dto.SlipNumber, dto.Location, ct);

        if (!result.Success)
        {
            return NotFound(new ErrorResponse
            {
                Message = result.Message,
                Status = StatusCodes.Status404NotFound,
                Code = "not_found"
            });
        }

        return Ok(result);
    }

    /// <summary>
    /// Health check endpoint.
    /// </summary>
    [HttpGet("health")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public IActionResult Health()
    {
        return Ok(new { status = "healthy", service = "backend", timestamp = DateTime.UtcNow });
    }
}

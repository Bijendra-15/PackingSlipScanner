using System.Collections.Concurrent;
using backend.Models;
using backend.Dtos;

namespace backend.Data;

public interface IPackSlipRepository
{
    Task<List<PackSlip>> GetAllAsync(string? status, int page, int limit, CancellationToken ct = default);
    Task<int> CountAsync(string? status, CancellationToken ct = default);
    Task<PackSlip?> GetByIdAsync(string id, CancellationToken ct = default);
    Task<PackSlip?> GetBySlipNumberAsync(string slipNumber, CancellationToken ct = default);
    Task<PackSlip> CreateAsync(PackSlip slip, CancellationToken ct = default);
    Task<PackSlip?> UpdateAsync(string id, Action<PackSlip> update, CancellationToken ct = default);
    Task<bool> DeleteAsync(string id, CancellationToken ct = default);
    Task<ScanResponseDto> ScanAsync(string slipNumber, string? location, CancellationToken ct = default);
}

public sealed class InMemoryPackSlipRepository : IPackSlipRepository
{
    private readonly ConcurrentDictionary<string, PackSlip> _slips = new();

    public Task<List<PackSlip>> GetAllAsync(string? status, int page, int limit, CancellationToken ct = default)
    {
        var query = _slips.Values.AsEnumerable();

        if (!string.IsNullOrWhiteSpace(status))
        {
            query = query.Where(s => string.Equals(s.Status, status, StringComparison.OrdinalIgnoreCase));
        }

        var ordered = query.OrderByDescending(s => s.UpdatedAt).ToList();
        var total = ordered.Count;
        var pageData = ordered.Skip((page - 1) * limit).Take(limit).ToList();

        return Task.FromResult(pageData);
    }

    public Task<int> CountAsync(string? status, CancellationToken ct = default)
    {
        var query = _slips.Values.AsEnumerable();
        if (!string.IsNullOrWhiteSpace(status))
        {
            query = query.Where(s => string.Equals(s.Status, status, StringComparison.OrdinalIgnoreCase));
        }
        return Task.FromResult(query.Count());
    }

    public Task<PackSlip?> GetByIdAsync(string id, CancellationToken ct = default)
    {
        _slips.TryGetValue(id, out var slip);
        return Task.FromResult(slip);
    }

    public Task<PackSlip?> GetBySlipNumberAsync(string slipNumber, CancellationToken ct = default)
    {
        var slip = _slips.Values.FirstOrDefault(s =>
            string.Equals(s.SlipNumber, slipNumber, StringComparison.OrdinalIgnoreCase));
        return Task.FromResult(slip);
    }

    public Task<PackSlip> CreateAsync(PackSlip slip, CancellationToken ct = default)
    {
        slip.Id = Guid.NewGuid().ToString();
        slip.CreatedAt = DateTime.UtcNow;
        slip.UpdatedAt = DateTime.UtcNow;
        _slips[slip.Id] = slip;
        return Task.FromResult(slip);
    }

    public Task<PackSlip?> UpdateAsync(string id, Action<PackSlip> update, CancellationToken ct = default)
    {
        if (!_slips.TryGetValue(id, out var existing))
        {
            return Task.FromResult<PackSlip?>(null);
        }

        var clone = existing.Clone();
        update(clone);
        clone.UpdatedAt = DateTime.UtcNow;
        _slips[id] = clone;
        return Task.FromResult<PackSlip?>(clone);
    }

    public Task<bool> DeleteAsync(string id, CancellationToken ct = default)
    {
        return Task.FromResult(_slips.TryRemove(id, out _));
    }

    public Task<ScanResponseDto> ScanAsync(string slipNumber, string? location, CancellationToken ct = default)
    {
        var slip = _slips.Values.FirstOrDefault(s =>
            string.Equals(s.SlipNumber, slipNumber, StringComparison.OrdinalIgnoreCase));

        if (slip is null)
        {
            return Task.FromResult(new ScanResponseDto
            {
                Success = false,
                Message = $"Pack slip '{slipNumber}' not found.",
                Slip = null
            });
        }

        if (!string.IsNullOrWhiteSpace(location))
        {
            slip.Status = PackSlipStatuses.Packed;
            slip.UpdatedAt = DateTime.UtcNow;
            _slips[slip.Id] = slip;
        }

        return Task.FromResult(new ScanResponseDto
        {
            Success = true,
            Message = $"Pack slip '{slipNumber}' scanned successfully.",
            Slip = slip.ToDto()
        });
    }
}

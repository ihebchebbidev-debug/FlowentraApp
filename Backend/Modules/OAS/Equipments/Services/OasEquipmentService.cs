using Microsoft.EntityFrameworkCore;
using MyApi.Modules.OAS.Common;
using MyApi.Modules.OAS.Equipments.DTOs;
using MyApi.Modules.OAS.Equipments.Models;

namespace MyApi.Modules.OAS.Equipments.Services;

public interface IOasEquipmentService
{
    Task<IReadOnlyList<OasEquipmentDto>> GetAllAsync(int tenantId, Guid? postId);
    Task<(bool success, string? error, OasEquipmentDto? dto)> CreateAsync(int tenantId, OasEquipmentRequestDto request);
    Task<bool> UpdateAsync(int tenantId, Guid id, OasEquipmentRequestDto request);
    Task<bool> DeleteAsync(int tenantId, Guid id);
}

public class OasEquipmentService : IOasEquipmentService
{
    private readonly OasDbContext _db;
    public OasEquipmentService(OasDbContext db) => _db = db;

    public async Task<IReadOnlyList<OasEquipmentDto>> GetAllAsync(int tenantId, Guid? postId)
    {
        var q = _db.Set<OasEquipment>().AsQueryable();
        if (postId is not null) q = q.Where(e => e.PostId == postId);
        var rows = await q.OrderBy(e => e.Name).ToListAsync();
        return rows.Select(ToDto).ToList();
    }

    public async Task<(bool success, string? error, OasEquipmentDto? dto)> CreateAsync(int tenantId, OasEquipmentRequestDto request)
    {
        // oas_equipments has a unique (tenant_id, code) index. IgnoreQueryFilters is required
        // because the soft-delete filter hides archived rows from this pre-check while the
        // unique index still sees them — recreating an archived code would otherwise 500.
        var existing = await _db.Set<OasEquipment>().IgnoreQueryFilters()
            .FirstOrDefaultAsync(e => e.TenantId == tenantId && e.Code == request.Code);
        if (existing is not null && !existing.IsDeleted) return (false, "duplicate_code", null);

        var criticality = Enum.Parse<OasCriticality>(request.Criticality, ignoreCase: true);

        if (existing is not null)
        {
            existing.IsDeleted = false; existing.ArchivedAt = null;
            existing.PostId = request.PostId; existing.Name = request.Name;
            existing.SerialNumber = request.SerialNumber; existing.Manufacturer = request.Manufacturer;
            existing.CommissionedAt = request.CommissionedAt; existing.Criticality = criticality;
            await _db.SaveChangesAsync();
            return (true, null, ToDto(existing));
        }

        var eq = new OasEquipment
        {
            TenantId = tenantId, PostId = request.PostId, Code = request.Code, Name = request.Name,
            SerialNumber = request.SerialNumber, Manufacturer = request.Manufacturer, CommissionedAt = request.CommissionedAt,
            Criticality = criticality,
        };
        _db.Set<OasEquipment>().Add(eq);
        await _db.SaveChangesAsync();
        return (true, null, ToDto(eq));
    }

    public async Task<bool> UpdateAsync(int tenantId, Guid id, OasEquipmentRequestDto request)
    {
        var eq = await _db.Set<OasEquipment>().FindAsync(id);
        if (eq is null) return false;
        eq.PostId = request.PostId; eq.Code = request.Code; eq.Name = request.Name;
        eq.SerialNumber = request.SerialNumber; eq.Manufacturer = request.Manufacturer; eq.CommissionedAt = request.CommissionedAt;
        eq.Criticality = Enum.Parse<OasCriticality>(request.Criticality, ignoreCase: true);
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteAsync(int tenantId, Guid id)
    {
        var eq = await _db.Set<OasEquipment>().FindAsync(id);
        if (eq is null) return false;
        eq.IsDeleted = true;
        eq.ArchivedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync();
        return true;
    }

    private static OasEquipmentDto ToDto(OasEquipment e) => new()
    {
        Id = e.Id, PostId = e.PostId, Code = e.Code, Name = e.Name,
        SerialNumber = e.SerialNumber, Manufacturer = e.Manufacturer, CommissionedAt = e.CommissionedAt,
        Criticality = e.Criticality.ToString(),
    };
}

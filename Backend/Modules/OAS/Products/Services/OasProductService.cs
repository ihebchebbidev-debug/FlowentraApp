using Microsoft.EntityFrameworkCore;
using MyApi.Modules.OAS.Common;
using MyApi.Modules.OAS.Products.DTOs;
using MyApi.Modules.OAS.Products.Models;

namespace MyApi.Modules.OAS.Products.Services;

public interface IOasProductService
{
    Task<IReadOnlyList<OasProductDto>> GetProductsAsync(int tenantId);
    Task<(bool success, string? error, OasProductDto? dto)> CreateProductAsync(int tenantId, OasProductRequestDto request);
    Task<bool> UpdateProductAsync(int tenantId, Guid id, OasProductRequestDto request);
    Task<bool> DeleteProductAsync(int tenantId, Guid id);

    Task<IReadOnlyList<OasProductionOrderDto>> GetOrdersAsync(int tenantId);
    Task<(bool success, string? error, OasProductionOrderDto? dto)> CreateOrderAsync(int tenantId, OasProductionOrderRequestDto request);
    Task<(bool success, string? error)> SetOrderStatusAsync(int tenantId, Guid id, string status);
}

public class OasProductService : IOasProductService
{
    private readonly OasDbContext _db;
    public OasProductService(OasDbContext db) => _db = db;

    public async Task<IReadOnlyList<OasProductDto>> GetProductsAsync(int tenantId)
    {
        var rows = await _db.Set<OasProduct>().OrderBy(p => p.Reference).ToListAsync();
        return rows.Select(p => new OasProductDto { Id = p.Id, Reference = p.Reference, Name = p.Name, Customer = p.Customer, Unit = p.Unit }).ToList();
    }

    public async Task<(bool success, string? error, OasProductDto? dto)> CreateProductAsync(int tenantId, OasProductRequestDto request)
    {
        // oas_products has a real unique (tenant_id, reference) index (ProductConfigurations.cs) —
        // without this pre-check a duplicate reference fell through to the DB, threw a raw
        // DbUpdateException, and surfaced as an unhelpful 500 via the generic exception middleware.
        // IgnoreQueryFilters is essential: the soft-delete filter hides archived rows from the
        // pre-check, but the unique index still sees them, so recreating a deleted reference
        // used to 500. A soft-deleted match is revived in place instead.
        var existing = await _db.Set<OasProduct>().IgnoreQueryFilters()
            .FirstOrDefaultAsync(p => p.TenantId == tenantId && p.Reference == request.Reference);
        if (existing is not null && !existing.IsDeleted) return (false, "duplicate_code", null);

        if (existing is not null)
        {
            existing.IsDeleted = false;
            existing.ArchivedAt = null;
            existing.Name = request.Name;
            existing.Customer = request.Customer;
            existing.Unit = request.Unit;
            await _db.SaveChangesAsync();
            return (true, null, new OasProductDto { Id = existing.Id, Reference = existing.Reference, Name = existing.Name, Customer = existing.Customer, Unit = existing.Unit });
        }

        var product = new OasProduct { TenantId = tenantId, Reference = request.Reference, Name = request.Name, Customer = request.Customer, Unit = request.Unit };
        _db.Set<OasProduct>().Add(product);
        await _db.SaveChangesAsync();
        return (true, null, new OasProductDto { Id = product.Id, Reference = product.Reference, Name = product.Name, Customer = product.Customer, Unit = product.Unit });
    }

    public async Task<bool> UpdateProductAsync(int tenantId, Guid id, OasProductRequestDto request)
    {
        var product = await _db.Set<OasProduct>().FindAsync(id);
        if (product is null) return false;
        product.Reference = request.Reference; product.Name = request.Name; product.Customer = request.Customer; product.Unit = request.Unit;
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteProductAsync(int tenantId, Guid id)
    {
        var product = await _db.Set<OasProduct>().FindAsync(id);
        if (product is null) return false;
        product.IsDeleted = true;
        product.ArchivedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<IReadOnlyList<OasProductionOrderDto>> GetOrdersAsync(int tenantId)
    {
        var rows = await _db.Set<OasProductionOrder>().OrderByDescending(o => o.Priority).ToListAsync();
        return rows.Select(ToOrderDto).ToList();
    }

    public async Task<(bool success, string? error, OasProductionOrderDto? dto)> CreateOrderAsync(int tenantId, OasProductionOrderRequestDto request)
    {
        // oas_production_orders has a unique (tenant_id, order_number) index — without this
        // pre-check a duplicate order number surfaced as a raw 500 instead of a 409.
        var duplicate = await _db.Set<OasProductionOrder>().AnyAsync(o => o.OrderNumber == request.OrderNumber);
        if (duplicate) return (false, "duplicate_code", null);

        var order = new OasProductionOrder
        {
            TenantId = tenantId, OrderNumber = request.OrderNumber, ProductId = request.ProductId, LineId = request.LineId,
            QuantityPlanned = request.QuantityPlanned, DueDate = request.DueDate, Priority = request.Priority,
        };
        _db.Set<OasProductionOrder>().Add(order);
        await _db.SaveChangesAsync();
        return (true, null, ToOrderDto(order));
    }

    public async Task<(bool success, string? error)> SetOrderStatusAsync(int tenantId, Guid id, string status)
    {
        if (!Enum.TryParse<OasOrderStatus>(status, ignoreCase: true, out var parsed)) return (false, "invalid_status");
        var order = await _db.Set<OasProductionOrder>().FindAsync(id);
        if (order is null) return (false, "not_found");
        order.Status = parsed;
        await _db.SaveChangesAsync();
        return (true, null);
    }

    private static OasProductionOrderDto ToOrderDto(OasProductionOrder o) => new()
    {
        Id = o.Id, OrderNumber = o.OrderNumber, ProductId = o.ProductId, LineId = o.LineId,
        QuantityPlanned = o.QuantityPlanned, QuantityProduced = o.QuantityProduced, QuantityScrapped = o.QuantityScrapped,
        DueDate = o.DueDate, Status = o.Status.ToString(), Priority = o.Priority,
    };
}

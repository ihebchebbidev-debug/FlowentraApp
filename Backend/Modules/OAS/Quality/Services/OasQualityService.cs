using Microsoft.EntityFrameworkCore;
using MyApi.Modules.OAS.Common;
using MyApi.Modules.OAS.Quality.DTOs;
using MyApi.Modules.OAS.Quality.Models;

namespace MyApi.Modules.OAS.Quality.Services;

public interface IOasQualityService
{
    Task<(bool success, string? error, OasQualityCheckDto? dto)> CreateCheckAsync(int tenantId, Guid inspectorId, OasQualityCheckRequestDto request);
    Task<IReadOnlyList<OasQualityCheckDto>> GetChecksAsync(int tenantId, Guid? postId);

    Task<IReadOnlyList<OasQualityCheckTemplateDto>> GetTemplatesAsync(int tenantId, bool includeInactive = false);
    Task<(bool success, string? error, OasQualityCheckTemplateDto? dto)> CreateTemplateAsync(int tenantId, OasQualityCheckTemplateRequestDto request);
    Task<(bool success, string? error)> UpdateTemplateAsync(int tenantId, Guid id, OasQualityCheckTemplateRequestDto request);
    Task<(bool success, string? error)> SetTemplateActiveAsync(int tenantId, Guid id, bool isActive);
    Task<bool> DeleteTemplateAsync(int tenantId, Guid id);

    Task<IReadOnlyList<OasQualityCheckTemplateItemDto>> GetTemplateItemsAsync(int tenantId, Guid templateId);
    Task PutTemplateItemsAsync(int tenantId, Guid templateId, IReadOnlyList<OasQualityCheckTemplateItemRequestDto> items);
}

public class OasQualityService : IOasQualityService
{
    private readonly OasDbContext _db;
    private readonly MyApi.Modules.OAS.Common.Scope.IOasPostScopeResolver _scope;
    public OasQualityService(OasDbContext db, MyApi.Modules.OAS.Common.Scope.IOasPostScopeResolver scope)
    {
        _db = db;
        _scope = scope;
    }

    public async Task<(bool success, string? error, OasQualityCheckDto? dto)> CreateCheckAsync(int tenantId, Guid inspectorId, OasQualityCheckRequestDto request)
    {
        var existing = await _db.Set<OasQualityCheck>().FirstOrDefaultAsync(c => c.ClientEventId == request.ClientEventId);
        if (existing is not null) return (true, null, ToDto(existing));

        // BL-012 perimeter — this module had no scope enforcement at all, so a
        // line-scoped operator could record (and list) checks on any post.
        if (!await _scope.IsPostInScopeAsync(request.PostId))
        {
            return (false, "post_out_of_scope", null);
        }

        if (request.QuantityChecked < 0) return (false, "quantity_checked_negative", null);
        if (request.QuantityRejected < 0) return (false, "quantity_rejected_negative", null);

        if (!Enum.TryParse<OasCheckResult>(request.Result, true, out var result)) return (false, "invalid_result", null);

        // The mobile app already blocks submitting a rework/scrap result without a
        // cause client-side — this closes the same gap server-side so a direct API
        // call can't bypass that rule and record an un-attributed reject.
        if ((result == OasCheckResult.rework || result == OasCheckResult.scrap) && request.CauseId is null)
        {
            return (false, "cause_required_for_reject", null);
        }

        var check = new OasQualityCheck
        {
            TenantId = tenantId, ClientEventId = request.ClientEventId, PostId = request.PostId,
            ProductionOrderId = request.ProductionOrderId, ProductId = request.ProductId, ChangeoverId = request.ChangeoverId,
            TemplateId = request.TemplateId, CheckType = Enum.Parse<OasCheckType>(request.CheckType, true),
            Result = result, QuantityChecked = request.QuantityChecked,
            QuantityRejected = request.QuantityRejected, CauseId = request.CauseId, Note = request.Note,
            OccurredAt = request.OccurredAt, InspectorId = inspectorId,
        };
        _db.Set<OasQualityCheck>().Add(check);
        await _db.SaveChangesAsync();
        return (true, null, ToDto(check));
    }

    public async Task<IReadOnlyList<OasQualityCheckDto>> GetChecksAsync(int tenantId, Guid? postId)
    {
        var q = _db.Set<OasQualityCheck>().AsQueryable();
        var scopedPostIds = await _scope.ScopedPostIdsAsync();
        if (scopedPostIds is not null) q = q.Where(c => scopedPostIds.Contains(c.PostId));
        if (postId is not null) q = q.Where(c => c.PostId == postId);
        var rows = await q.OrderByDescending(c => c.OccurredAt).ToListAsync();
        return rows.Select(ToDto).ToList();
    }

    public async Task<IReadOnlyList<OasQualityCheckTemplateDto>> GetTemplatesAsync(int tenantId, bool includeInactive = false)
    {
        // Default stays exactly as before (active only, e.g. the mobile check picker).
        // includeInactive=true is for admin callers who need to see — and reactivate —
        // a template that DeleteTemplateAsync soft-deactivated; without this it was
        // invisible everywhere, including the admin list, with no way back.
        var q = _db.Set<OasQualityCheckTemplate>().AsQueryable();
        if (!includeInactive) q = q.Where(t => t.IsActive);
        var rows = await q.OrderBy(t => t.Name).ToListAsync();
        return rows.Select(ToTemplateDto).ToList();
    }

    public async Task<(bool success, string? error, OasQualityCheckTemplateDto? dto)> CreateTemplateAsync(int tenantId, OasQualityCheckTemplateRequestDto request)
    {
        var template = new OasQualityCheckTemplate
        {
            TenantId = tenantId, Code = request.Code, Name = request.Name, CheckType = Enum.Parse<OasCheckType>(request.CheckType, true),
        };
        _db.Set<OasQualityCheckTemplate>().Add(template);
        try
        {
            await _db.SaveChangesAsync();
        }
        catch (DbUpdateException ex) when (IsUniqueViolation(ex))
        {
            // (TenantId, Code) unique constraint — used to surface as an
            // uncaught 500 instead of a real conflict, same class of gap
            // already closed on Events/other referentials this session.
            return (false, "code_already_exists", null);
        }
        return (true, null, ToTemplateDto(template));
    }

    public async Task<(bool success, string? error)> UpdateTemplateAsync(int tenantId, Guid id, OasQualityCheckTemplateRequestDto request)
    {
        var template = await _db.Set<OasQualityCheckTemplate>().FindAsync(id);
        if (template is null) return (false, "not_found");
        template.Code = request.Code; template.Name = request.Name; template.CheckType = Enum.Parse<OasCheckType>(request.CheckType, true);
        try
        {
            await _db.SaveChangesAsync();
        }
        catch (DbUpdateException ex) when (IsUniqueViolation(ex))
        {
            return (false, "code_already_exists");
        }
        return (true, null);
    }

    private static bool IsUniqueViolation(DbUpdateException ex) =>
        ex.InnerException is Npgsql.PostgresException { SqlState: "23505" };

    public async Task<bool> DeleteTemplateAsync(int tenantId, Guid id)
    {
        var template = await _db.Set<OasQualityCheckTemplate>().FindAsync(id);
        if (template is null) return false;
        template.IsActive = false;
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<(bool success, string? error)> SetTemplateActiveAsync(int tenantId, Guid id, bool isActive)
    {
        var template = await _db.Set<OasQualityCheckTemplate>().FindAsync(id);
        if (template is null) return (false, "not_found");
        template.IsActive = isActive;
        await _db.SaveChangesAsync();
        return (true, null);
    }

    public async Task<IReadOnlyList<OasQualityCheckTemplateItemDto>> GetTemplateItemsAsync(int tenantId, Guid templateId)
    {
        var rows = await _db.Set<OasQualityCheckTemplateItem>().Where(i => i.TemplateId == templateId).OrderBy(i => i.SortOrder).ToListAsync();
        return rows.Select(ToItemDto).ToList();
    }

    public async Task PutTemplateItemsAsync(int tenantId, Guid templateId, IReadOnlyList<OasQualityCheckTemplateItemRequestDto> items)
    {
        var existing = await _db.Set<OasQualityCheckTemplateItem>().Where(i => i.TemplateId == templateId).ToListAsync();
        _db.Set<OasQualityCheckTemplateItem>().RemoveRange(existing);

        foreach (var item in items)
        {
            _db.Set<OasQualityCheckTemplateItem>().Add(new OasQualityCheckTemplateItem
            {
                TenantId = tenantId, TemplateId = templateId, Label = item.Label, ValueType = item.ValueType,
                MinValue = item.MinValue, MaxValue = item.MaxValue, IsRequired = item.IsRequired, SortOrder = item.SortOrder,
            });
        }
        await _db.SaveChangesAsync();
    }

    private static OasQualityCheckDto ToDto(OasQualityCheck c) => new()
    {
        Id = c.Id, PostId = c.PostId, CheckType = c.CheckType.ToString(), Result = c.Result.ToString(),
        QuantityChecked = c.QuantityChecked, QuantityRejected = c.QuantityRejected, OccurredAt = c.OccurredAt,
    };

    private static OasQualityCheckTemplateDto ToTemplateDto(OasQualityCheckTemplate t) => new()
    {
        Id = t.Id, Code = t.Code, Name = t.Name, CheckType = t.CheckType.ToString(), IsActive = t.IsActive,
    };

    private static OasQualityCheckTemplateItemDto ToItemDto(OasQualityCheckTemplateItem i) => new()
    {
        Id = i.Id, Label = i.Label, ValueType = i.ValueType, MinValue = i.MinValue, MaxValue = i.MaxValue,
        IsRequired = i.IsRequired, SortOrder = i.SortOrder,
    };
}

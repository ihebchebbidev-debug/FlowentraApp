using Microsoft.EntityFrameworkCore;
using MyApi.Modules.OAS.Assignments.DTOs;
using MyApi.Modules.OAS.Assignments.Models;
using MyApi.Modules.OAS.Common;
using MyApi.Modules.OAS.Hierarchy.Models;
using MyApi.Modules.OAS.ShopFloorAuth.Models;

namespace MyApi.Modules.OAS.Assignments.Services;

public interface IOasAssignmentService
{
    Task<IReadOnlyList<OasAssignmentDto>> GetAsync(int tenantId, Guid shiftTemplateId, DateOnly workDate, bool onlyPublished);
    Task<OasAssignmentDto> UpsertAsync(int tenantId, Guid actorId, Guid postId, OasAssignmentRequestDto request);
    Task<bool> DeleteAsync(int tenantId, Guid postId, Guid shiftTemplateId, DateOnly workDate);
    Task<int> AutoFillAsync(int tenantId, Guid actorId, Guid shiftTemplateId, DateOnly workDate);
    Task<int> ClearAllAsync(int tenantId, Guid shiftTemplateId, DateOnly workDate);
    Task<int> PublishAsync(int tenantId, Guid shiftTemplateId, DateOnly workDate, Guid? postId);
    Task<OasAssignmentCountsDto> GetCountsAsync(int tenantId, Guid shiftTemplateId, DateOnly workDate);
    Task<IReadOnlyList<OasRosterEntryDto>> GetRosterAsync(int tenantId);

    Task<bool> SetPresenceAsync(int tenantId, Guid userId, OasPresenceRequestDto request);
    Task<bool> ConfirmPresenceAsync(int tenantId, Guid userId, OasPresenceConfirmRequestDto request);
    Task<IReadOnlyList<OasPresenceDto>> GetPresenceAsync(int tenantId, Guid shiftTemplateId, DateOnly workDate);
}

/// <summary>v12/v15: assignments and presence are keyed by oas_users.Id (uuid), never by display-name string — the old client matched operators by name, which collides and doesn't survive a rename.</summary>
public class OasAssignmentService : IOasAssignmentService
{
    private readonly OasDbContext _db;
    private readonly System.Security.Claims.ClaimsPrincipal? _user;

    public OasAssignmentService(OasDbContext db, Microsoft.AspNetCore.Http.IHttpContextAccessor httpContextAccessor)
    {
        _db = db;
        _user = httpContextAccessor.HttpContext?.User;
    }

    private Guid? CallerScopeClaim(string type)
    {
        var claim = _user?.FindFirst(type)?.Value;
        return Guid.TryParse(claim, out var id) ? id : null;
    }

    /// <summary>Same BL-012 perimeter pattern as OasDeclarationService.ScopedPostIdsAsync: null means unrestricted, otherwise the post ids the caller may touch.</summary>
    private async Task<Guid[]?> ScopedPostIdsAsync()
    {
        var siteId = CallerScopeClaim("oas_scope_site_id");
        var zoneId = CallerScopeClaim("oas_scope_zone_id");
        var lineId = CallerScopeClaim("oas_scope_line_id");
        if (siteId is null && zoneId is null && lineId is null) return null; // unrestricted

        if (lineId is not null)
            return await _db.Set<OasPost>().Where(p => p.LineId == lineId).Select(p => p.Id).ToArrayAsync();

        var lines = _db.Set<OasLine>().AsQueryable();
        if (zoneId is not null) lines = lines.Where(l => l.ZoneId == zoneId);
        else if (siteId is not null)
        {
            var zoneIds = await _db.Set<OasZone>().Where(z => z.SiteId == siteId).Select(z => z.Id).ToArrayAsync();
            lines = lines.Where(l => zoneIds.Contains(l.ZoneId));
        }
        var lineIds = await lines.Select(l => l.Id).ToArrayAsync();
        return await _db.Set<OasPost>().Where(p => lineIds.Contains(p.LineId)).Select(p => p.Id).ToArrayAsync();
    }

    public async Task<IReadOnlyList<OasAssignmentDto>> GetAsync(int tenantId, Guid shiftTemplateId, DateOnly workDate, bool onlyPublished)
    {
        var q = _db.Set<OasAssignment>().Where(a => a.ShiftTemplateId == shiftTemplateId && a.WorkDate == workDate);
        if (onlyPublished) q = q.Where(a => a.PublishedAt != null);
        var rows = await q.ToListAsync();

        var userIds = rows.Select(r => r.UserId).Distinct().ToList();
        var names = await _db.Set<OasUser>().Where(u => userIds.Contains(u.Id)).ToDictionaryAsync(u => u.Id, u => u.DisplayName);

        return rows.Select(a => ToDto(a, names.GetValueOrDefault(a.UserId))).ToList();
    }

    public async Task<OasAssignmentDto> UpsertAsync(int tenantId, Guid actorId, Guid postId, OasAssignmentRequestDto request)
    {
        var existing = await _db.Set<OasAssignment>().FirstOrDefaultAsync(a =>
            a.PostId == postId && a.ShiftTemplateId == request.ShiftTemplateId && a.WorkDate == request.WorkDate);

        if (existing is null)
        {
            existing = new OasAssignment
            {
                TenantId = tenantId, PostId = postId, ShiftTemplateId = request.ShiftTemplateId, WorkDate = request.WorkDate,
                UserId = request.UserId, ProductionOrderId = request.ProductionOrderId, Note = request.Note, AssignedBy = actorId,
            };
            _db.Set<OasAssignment>().Add(existing);
        }
        else
        {
            existing.UserId = request.UserId;
            existing.ProductionOrderId = request.ProductionOrderId;
            existing.Note = request.Note;
            existing.AssignedBy = actorId;
            // v15: editing THIS post un-publishes only THIS post's row, never the whole board.
            existing.PublishedAt = null;
        }

        await _db.SaveChangesAsync();
        var name = await _db.Set<OasUser>().Where(u => u.Id == existing.UserId).Select(u => u.DisplayName).FirstOrDefaultAsync();
        return ToDto(existing, name);
    }

    public async Task<bool> DeleteAsync(int tenantId, Guid postId, Guid shiftTemplateId, DateOnly workDate)
    {
        var assignment = await _db.Set<OasAssignment>().FirstOrDefaultAsync(a => a.PostId == postId && a.ShiftTemplateId == shiftTemplateId && a.WorkDate == workDate);
        if (assignment is null) return false;
        _db.Set<OasAssignment>().Remove(assignment);
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<int> AutoFillAsync(int tenantId, Guid actorId, Guid shiftTemplateId, DateOnly workDate)
    {
        var scopedPostIds = await ScopedPostIdsAsync();

        var assignedPostIds = await _db.Set<OasAssignment>()
            .Where(a => a.ShiftTemplateId == shiftTemplateId && a.WorkDate == workDate)
            .Select(a => a.PostId).ToListAsync();
        var emptyPostsQuery = _db.Set<OasPost>().Where(p => p.IsActive && !assignedPostIds.Contains(p.Id));
        if (scopedPostIds is not null) emptyPostsQuery = emptyPostsQuery.Where(p => scopedPostIds.Contains(p.Id));
        var emptyPosts = await emptyPostsQuery.OrderBy(p => p.SortOrder).ToListAsync();

        var alreadyAssignedUserIds = await _db.Set<OasAssignment>()
            .Where(a => a.ShiftTemplateId == shiftTemplateId && a.WorkDate == workDate)
            .Select(a => a.UserId).ToListAsync();
        var operatorsQuery = _db.Set<OasUser>()
            .Where(u => u.IsActive && u.Role == OasAppRole.@operator && !alreadyAssignedUserIds.Contains(u.Id));

        // Same perimeter as the caller's own scope claims, applied to the
        // OPERATOR's own Scope*Id fields — an operator scoped to a
        // different site/zone/line than the caller is not eligible for
        // auto-fill by this caller. An operator with no scope set at all
        // remains eligible everywhere, matching how ScopedPostIdsAsync
        // treats an unscoped caller as unrestricted.
        var siteId = CallerScopeClaim("oas_scope_site_id");
        var zoneId = CallerScopeClaim("oas_scope_zone_id");
        var lineId = CallerScopeClaim("oas_scope_line_id");
        if (lineId is not null)
            operatorsQuery = operatorsQuery.Where(u => u.ScopeLineId == lineId || (u.ScopeSiteId == null && u.ScopeZoneId == null && u.ScopeLineId == null));
        else if (zoneId is not null)
            operatorsQuery = operatorsQuery.Where(u => u.ScopeZoneId == zoneId || (u.ScopeSiteId == null && u.ScopeZoneId == null && u.ScopeLineId == null));
        else if (siteId is not null)
            operatorsQuery = operatorsQuery.Where(u => u.ScopeSiteId == siteId || (u.ScopeSiteId == null && u.ScopeZoneId == null && u.ScopeLineId == null));

        var availableOperators = await operatorsQuery.OrderBy(u => u.DisplayName).ToListAsync();

        var filled = 0;
        foreach (var (post, operatorUser) in emptyPosts.Zip(availableOperators))
        {
            _db.Set<OasAssignment>().Add(new OasAssignment
            {
                TenantId = tenantId, PostId = post.Id, UserId = operatorUser.Id, ShiftTemplateId = shiftTemplateId, WorkDate = workDate, AssignedBy = actorId,
            });
            filled++;
        }

        await _db.SaveChangesAsync();
        return filled;
    }

    public async Task<int> ClearAllAsync(int tenantId, Guid shiftTemplateId, DateOnly workDate)
    {
        var scopedPostIds = await ScopedPostIdsAsync();
        var q = _db.Set<OasAssignment>().Where(a => a.ShiftTemplateId == shiftTemplateId && a.WorkDate == workDate);
        if (scopedPostIds is not null) q = q.Where(a => scopedPostIds.Contains(a.PostId));
        var rows = await q.ToListAsync();
        _db.Set<OasAssignment>().RemoveRange(rows);
        await _db.SaveChangesAsync();
        return rows.Count;
    }

    public async Task<int> PublishAsync(int tenantId, Guid shiftTemplateId, DateOnly workDate, Guid? postId)
    {
        var scopedPostIds = await ScopedPostIdsAsync();
        var q = _db.Set<OasAssignment>().Where(a => a.ShiftTemplateId == shiftTemplateId && a.WorkDate == workDate);
        if (scopedPostIds is not null) q = q.Where(a => scopedPostIds.Contains(a.PostId));
        if (postId is not null) q = q.Where(a => a.PostId == postId);
        var rows = await q.ToListAsync();
        var now = DateTimeOffset.UtcNow;
        foreach (var row in rows) row.PublishedAt = now;
        await _db.SaveChangesAsync();
        return rows.Count;
    }

    public async Task<OasAssignmentCountsDto> GetCountsAsync(int tenantId, Guid shiftTemplateId, DateOnly workDate)
    {
        var scopedPostIds = await ScopedPostIdsAsync();

        var postsQuery = _db.Set<OasPost>().Where(p => p.IsActive);
        if (scopedPostIds is not null) postsQuery = postsQuery.Where(p => scopedPostIds.Contains(p.Id));
        var totalPosts = await postsQuery.CountAsync();

        var rowsQuery = _db.Set<OasAssignment>().Where(a => a.ShiftTemplateId == shiftTemplateId && a.WorkDate == workDate);
        if (scopedPostIds is not null) rowsQuery = rowsQuery.Where(a => scopedPostIds.Contains(a.PostId));
        var rows = await rowsQuery.ToListAsync();

        return new OasAssignmentCountsDto { TotalPosts = totalPosts, Assigned = rows.Count, Published = rows.Count(r => r.PublishedAt != null) };
    }

    public async Task<IReadOnlyList<OasRosterEntryDto>> GetRosterAsync(int tenantId)
    {
        var rows = await _db.Set<OasUser>().Where(u => u.Role == OasAppRole.@operator).OrderBy(u => u.DisplayName).ToListAsync();
        return rows.Select(u => new OasRosterEntryDto { UserId = u.Id, DisplayName = u.DisplayName, IsActive = u.IsActive }).ToList();
    }

    /// <summary>`oas_presence_entries.status` has a check constraint — an unknown value used to surface as a 500 from the DB instead of a 400 from validation.</summary>
    private static readonly string[] AllowedPresenceStatuses = { "expected", "confirmed", "absent" };

    public async Task<bool> SetPresenceAsync(int tenantId, Guid userId, OasPresenceRequestDto request)
    {
        if (!AllowedPresenceStatuses.Contains(request.Status))
        {
            throw new ArgumentException($"invalid_presence_status:{request.Status}", nameof(request));
        }
        var entry = await _db.Set<OasPresenceEntry>().FirstOrDefaultAsync(p => p.UserId == userId && p.WorkDate == request.WorkDate && p.ShiftTemplateId == request.ShiftTemplateId);
        if (entry is null)
        {
            entry = new OasPresenceEntry { TenantId = tenantId, UserId = userId, WorkDate = request.WorkDate, ShiftTemplateId = request.ShiftTemplateId };
            _db.Set<OasPresenceEntry>().Add(entry);
        }
        entry.Status = request.Status;
        entry.Reason = request.Reason;
        await _db.SaveChangesAsync();
        return true;
    }

    /// <summary>v10 confirmed fact: only mobile calls this (self-confirm), distinct from the console's PUT /presence/{operatorId}.</summary>
    public async Task<bool> ConfirmPresenceAsync(int tenantId, Guid userId, OasPresenceConfirmRequestDto request)
    {
        var entry = await _db.Set<OasPresenceEntry>().FirstOrDefaultAsync(p => p.UserId == userId && p.WorkDate == request.WorkDate && p.ShiftTemplateId == request.ShiftTemplateId);
        if (entry is null)
        {
            entry = new OasPresenceEntry { TenantId = tenantId, UserId = userId, WorkDate = request.WorkDate, ShiftTemplateId = request.ShiftTemplateId };
            _db.Set<OasPresenceEntry>().Add(entry);
        }
        entry.Status = "confirmed";
        entry.ConfirmedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<IReadOnlyList<OasPresenceDto>> GetPresenceAsync(int tenantId, Guid shiftTemplateId, DateOnly workDate)
    {
        var rows = await _db.Set<OasPresenceEntry>().Where(p => p.ShiftTemplateId == shiftTemplateId && p.WorkDate == workDate).ToListAsync();
        return rows.Select(p => new OasPresenceDto
        {
            UserId = p.UserId, WorkDate = p.WorkDate, ShiftTemplateId = p.ShiftTemplateId,
            Status = p.Status, ConfirmedAt = p.ConfirmedAt, Reason = p.Reason,
        }).ToList();
    }

    private static OasAssignmentDto ToDto(OasAssignment a, string? userName) => new()
    {
        PostId = a.PostId, UserId = a.UserId, UserDisplayName = userName, ShiftTemplateId = a.ShiftTemplateId,
        WorkDate = a.WorkDate, ProductionOrderId = a.ProductionOrderId, Note = a.Note, Published = a.PublishedAt != null,
    };
}

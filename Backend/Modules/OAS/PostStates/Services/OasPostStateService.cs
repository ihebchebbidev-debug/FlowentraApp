using Microsoft.EntityFrameworkCore;
using MyApi.Modules.OAS.Common;
using MyApi.Modules.OAS.Hierarchy.Models;
using MyApi.Modules.OAS.PostStates.DTOs;
using MyApi.Modules.OAS.PostStates.Models;

namespace MyApi.Modules.OAS.PostStates.Services;

public interface IOasPostStateService
{
    Task<IReadOnlyList<OasPostStateDto>> GetLiveAsync(int tenantId);
    Task<IReadOnlyList<OasPostStateHistoryDto>> GetHistoryAsync(int tenantId, Guid postId);
}

public class OasPostStateService : IOasPostStateService
{
    private readonly OasDbContext _db;
    private readonly System.Security.Claims.ClaimsPrincipal? _user;

    public OasPostStateService(OasDbContext db, Microsoft.AspNetCore.Http.IHttpContextAccessor httpContextAccessor)
    {
        _db = db;
        _user = httpContextAccessor.HttpContext?.User;
    }

    private Guid? CallerScopeClaim(string type)
    {
        var claim = _user?.FindFirst(type)?.Value;
        return Guid.TryParse(claim, out var id) ? id : null;
    }

    /// <summary>Same BL-012 site/zone/line perimeter as OasDeclarationService.ScopedPostIdsAsync — this module had NO scoping at all before this fix.</summary>
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

    public async Task<IReadOnlyList<OasPostStateDto>> GetLiveAsync(int tenantId)
    {
        var scopedPostIds = await ScopedPostIdsAsync();
        var q = _db.Set<OasPostState>().AsQueryable();
        if (scopedPostIds is not null) q = q.Where(s => scopedPostIds.Contains(s.PostId));

        var rows = await q.ToListAsync();
        return rows.Select(s => new OasPostStateDto
        {
            PostId = s.PostId, State = s.State.ToString(), Since = s.Since,
            ActiveEventId = s.ActiveEventId, CurrentUserId = s.CurrentUserId, CurrentProductId = s.CurrentProductId,
        }).ToList();
    }

    public async Task<IReadOnlyList<OasPostStateHistoryDto>> GetHistoryAsync(int tenantId, Guid postId)
    {
        var scopedPostIds = await ScopedPostIdsAsync();
        if (scopedPostIds is not null && !scopedPostIds.Contains(postId))
        {
            // Out-of-scope post: no error channel on this read-only method
            // (mirrors how OasEventService.ApplyScope silently filters lists
            // rather than 403ing), so an out-of-scope postId just yields no
            // history instead of leaking another perimeter's data.
            return Array.Empty<OasPostStateHistoryDto>();
        }

        var rows = await _db.Set<OasPostStateHistory>().Where(h => h.PostId == postId).OrderByDescending(h => h.StartedAt).ToListAsync();
        return rows.Select(h => new OasPostStateHistoryDto { State = h.State.ToString(), StartedAt = h.StartedAt, EndedAt = h.EndedAt, DurationSec = h.DurationSec }).ToList();
    }
}

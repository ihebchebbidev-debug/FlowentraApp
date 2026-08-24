using Microsoft.EntityFrameworkCore;
using MyApi.Modules.OAS.Hierarchy.Models;

namespace MyApi.Modules.OAS.Common.Scope;

/// <summary>
/// Single shared implementation of the BL-012 site/zone/line perimeter,
/// resolved to the concrete set of post ids the caller may touch. The same
/// helper had been copy-pasted into Declarations/Changeovers/PostSessions/
/// PostStates; sub-modules that never had it (Quality, Interventions) were
/// silently unscoped, so it now lives here and is injected.
///
/// Returns null when the caller carries no scope_* claim at all
/// (admin/supervisor: unrestricted within the tenant).
/// </summary>
public interface IOasPostScopeResolver
{
    Task<Guid[]?> ScopedPostIdsAsync();
    Task<bool> IsPostInScopeAsync(Guid postId);
}

public class OasPostScopeResolver : IOasPostScopeResolver
{
    private readonly OasDbContext _db;
    private readonly System.Security.Claims.ClaimsPrincipal? _user;
    private Guid[]? _cached;
    private bool _resolved;

    public OasPostScopeResolver(OasDbContext db, Microsoft.AspNetCore.Http.IHttpContextAccessor httpContextAccessor)
    {
        _db = db;
        _user = httpContextAccessor.HttpContext?.User;
    }

    private Guid? Claim(string type)
    {
        var value = _user?.FindFirst(type)?.Value;
        return Guid.TryParse(value, out var id) ? id : null;
    }

    public async Task<Guid[]?> ScopedPostIdsAsync()
    {
        if (_resolved) return _cached;

        var siteId = Claim("oas_scope_site_id");
        var zoneId = Claim("oas_scope_zone_id");
        var lineId = Claim("oas_scope_line_id");

        if (siteId is null && zoneId is null && lineId is null)
        {
            _resolved = true;
            return _cached = null; // unrestricted
        }

        if (lineId is not null)
        {
            _cached = await _db.Set<OasPost>().Where(p => p.LineId == lineId).Select(p => p.Id).ToArrayAsync();
            _resolved = true;
            return _cached;
        }

        var lines = _db.Set<OasLine>().AsQueryable();
        if (zoneId is not null) lines = lines.Where(l => l.ZoneId == zoneId);
        else if (siteId is not null)
        {
            var zoneIds = await _db.Set<OasZone>().Where(z => z.SiteId == siteId).Select(z => z.Id).ToArrayAsync();
            lines = lines.Where(l => zoneIds.Contains(l.ZoneId));
        }
        var lineIds = await lines.Select(l => l.Id).ToArrayAsync();
        _cached = await _db.Set<OasPost>().Where(p => lineIds.Contains(p.LineId)).Select(p => p.Id).ToArrayAsync();
        _resolved = true;
        return _cached;
    }

    public async Task<bool> IsPostInScopeAsync(Guid postId)
    {
        var scoped = await ScopedPostIdsAsync();
        return scoped is null || scoped.Contains(postId);
    }
}

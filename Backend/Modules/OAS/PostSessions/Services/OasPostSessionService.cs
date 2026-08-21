using Microsoft.EntityFrameworkCore;
using MyApi.Modules.OAS.Common;
using MyApi.Modules.OAS.Hierarchy.Models;
using MyApi.Modules.OAS.PostSessions.DTOs;
using MyApi.Modules.OAS.PostSessions.Models;

namespace MyApi.Modules.OAS.PostSessions.Services;

public interface IOasPostSessionService
{
    Task<(bool success, string? error, OasPostSessionDto? dto)> OpenAsync(int tenantId, Guid userId, OasOpenSessionRequestDto request);
    Task<(bool success, string? error, OasPostSessionDto? dto)> RelayAsync(int tenantId, Guid sessionId, OasRelaySessionRequestDto request);
    Task<(bool success, string? error, OasPostSessionDto? dto)> CloseAsync(int tenantId, Guid sessionId, OasCloseSessionRequestDto request);
    Task<OasPostSessionDto?> GetActiveAsync(int tenantId, Guid userId);
    Task<OasScanResultDto> ScanAsync(int tenantId, OasScanRequestDto request);
}

/// <summary>
/// v15 critical fix: the frontend's `openSession()` silently overwrote an
/// active session with pending unsynced data (`session.ts:194-229`,
/// `ScanPage.tsx` had no active-session guard unlike every other mobile
/// screen). The server is the only real enforcement point — `OpenAsync`
/// refuses (409) a new session while one is already active for this user
/// or post, unless `ForceRelay` is explicitly set, in which case the old
/// session is closed (not silently discarded) before the new one opens.
/// </summary>
public class OasPostSessionService : IOasPostSessionService
{
    private readonly OasDbContext _db;
    private readonly System.Security.Claims.ClaimsPrincipal? _user;

    public OasPostSessionService(OasDbContext db, Microsoft.AspNetCore.Http.IHttpContextAccessor httpContextAccessor)
    {
        _db = db;
        _user = httpContextAccessor.HttpContext?.User;
    }

    private Guid? CallerScopeClaim(string type)
    {
        var claim = _user?.FindFirst(type)?.Value;
        return Guid.TryParse(claim, out var id) ? id : null;
    }

    /// <summary>Same BL-012 site/zone/line perimeter as OasDeclarationService.ScopedPostIdsAsync — mirrored here rather than shared because OasDbContext-scoped services don't share a common base for this helper.</summary>
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

    public async Task<(bool success, string? error, OasPostSessionDto? dto)> OpenAsync(int tenantId, Guid userId, OasOpenSessionRequestDto request)
    {
        var existingByClientId = await _db.Set<OasPostSession>().FirstOrDefaultAsync(s => s.ClientEventId == request.ClientEventId);
        if (existingByClientId is not null) return (true, null, ToDto(existingByClientId)); // idempotent replay

        var scopedPostIds = await ScopedPostIdsAsync();
        if (scopedPostIds is not null && !scopedPostIds.Contains(request.PostId))
        {
            return (false, "post_out_of_scope", null);
        }

        var activeForUser = await _db.Set<OasPostSession>().FirstOrDefaultAsync(s => s.UserId == userId && s.EndedAt == null);
        var activeForPost = await _db.Set<OasPostSession>().FirstOrDefaultAsync(s => s.PostId == request.PostId && s.EndedAt == null && s.UserId != userId);

        if (activeForPost is not null && !request.ForceRelay)
        {
            return (false, "post_already_has_active_session", null);
        }

        if (activeForUser is not null)
        {
            if (!request.ForceRelay) return (false, "user_already_has_active_session", null);
            activeForUser.EndedAt = DateTimeOffset.UtcNow;
        }

        if (activeForPost is not null && request.ForceRelay)
        {
            activeForPost.EndedAt = DateTimeOffset.UtcNow;
        }

        var session = new OasPostSession
        {
            TenantId = tenantId, ClientEventId = request.ClientEventId, PostId = request.PostId, UserId = userId,
            AssignmentId = request.AssignmentId, ProductionOrderId = request.ProductionOrderId, ShiftTemplateId = request.ShiftTemplateId,
            StartedAt = DateTimeOffset.UtcNow, StartedVia = request.StartedVia,
        };
        _db.Set<OasPostSession>().Add(session);
        try
        {
            await _db.SaveChangesAsync();
        }
        catch (DbUpdateException ex) when (IsUniqueViolation(ex))
        {
            // ux_oas_post_sessions_active_post (partial unique index on
            // post_id where ended_at IS NULL, OasPostSessionConfiguration):
            // the pre-check above is only optimistic — two near-simultaneous
            // opens for the same post can both pass it. The DB is the real
            // guard; on conflict, detach our losing insert and hand back
            // whichever session actually won the race instead of a raw 500
            // or a silent duplicate.
            _db.Entry(session).State = EntityState.Detached;
            var winner = await _db.Set<OasPostSession>().FirstOrDefaultAsync(s => s.PostId == request.PostId && s.EndedAt == null);
            if (winner is not null) return (true, null, ToDto(winner));
            return (false, "post_already_has_active_session", null);
        }

        return (true, null, ToDto(session));
    }

    private static bool IsUniqueViolation(DbUpdateException ex) =>
        ex.InnerException is Npgsql.PostgresException { SqlState: "23505" };

    public async Task<(bool success, string? error, OasPostSessionDto? dto)> RelayAsync(int tenantId, Guid sessionId, OasRelaySessionRequestDto request)
    {
        var session = await _db.Set<OasPostSession>().FindAsync(sessionId);
        if (session is null) return (false, "not_found", null);
        if (session.EndedAt is not null) return (false, "session_already_closed", null);

        // Relay keeps the SAME session row (and therefore its post,
        // production order, and any declarations already tied to it) —
        // only the operator changes. This is what actually preserves
        // in-flight work across a handover, unlike close+reopen.
        session.UserId = request.NewUserId;
        await _db.SaveChangesAsync();
        return (true, null, ToDto(session));
    }

    public async Task<(bool success, string? error, OasPostSessionDto? dto)> CloseAsync(int tenantId, Guid sessionId, OasCloseSessionRequestDto request)
    {
        var session = await _db.Set<OasPostSession>().FindAsync(sessionId);
        if (session is null) return (false, "not_found", null);

        if (session.EndedAt is not null) return (true, null, ToDto(session)); // idempotent

        session.EndedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync();
        return (true, null, ToDto(session));
    }

    public async Task<OasPostSessionDto?> GetActiveAsync(int tenantId, Guid userId)
    {
        var session = await _db.Set<OasPostSession>().FirstOrDefaultAsync(s => s.UserId == userId && s.EndedAt == null);
        return session is null ? null : ToDto(session);
    }

    public async Task<OasScanResultDto> ScanAsync(int tenantId, OasScanRequestDto request)
    {
        var extracted = ExtractPostCode(request.Code);
        if (extracted is null) return new OasScanResultDto { Resolved = false };

        // The printed/mobile-scanned QR badge encodes the post's rotating
        // QrToken (oas://post/<QrToken> — see Admin.tsx's QR generation),
        // never the human-typed Code. Try QrToken first; fall back to Code
        // so manual code entry (the app's own documented fallback) still
        // works. Matching only Code — the previous behavior — meant a
        // scanned QR badge could never resolve.
        var post = await _db.Set<OasPost>().FirstOrDefaultAsync(p => p.QrToken == extracted)
            ?? await _db.Set<OasPost>().FirstOrDefaultAsync(p => p.Code == extracted);
        return post is null
            ? new OasScanResultDto { Resolved = false }
            : new OasScanResultDto { Resolved = true, PostId = post.Id, PostCode = post.Code };
    }

    /// <summary>Mirrors the 4 formats `parsePostCode` (session.ts:141) accepts: raw value, `oas://post/&lt;value&gt;`, a URL with `?post=`/`?code=`, or the value embedded as the last path segment. The extracted value may be either a QrToken (scanned badge) or a Code (manual entry) — the caller tries both.</summary>
    private static string? ExtractPostCode(string raw)
    {
        var trimmed = raw.Trim();
        if (trimmed.Length == 0) return null;

        if (trimmed.StartsWith("oas://post/", StringComparison.OrdinalIgnoreCase))
        {
            return trimmed["oas://post/".Length..].Trim('/');
        }

        if (Uri.TryCreate(trimmed, UriKind.Absolute, out var uri))
        {
            var query = System.Web.HttpUtility.ParseQueryString(uri.Query);
            var fromQuery = query["post"] ?? query["code"];
            if (!string.IsNullOrEmpty(fromQuery)) return fromQuery;

            var segments = uri.AbsolutePath.Trim('/').Split('/');
            if (segments.Length > 0 && !string.IsNullOrEmpty(segments[^1])) return segments[^1];
        }

        return trimmed;
    }

    private static OasPostSessionDto ToDto(OasPostSession s) => new()
    {
        Id = s.Id, PostId = s.PostId, UserId = s.UserId, AssignmentId = s.AssignmentId,
        ProductionOrderId = s.ProductionOrderId, ShiftTemplateId = s.ShiftTemplateId,
        StartedAt = s.StartedAt, EndedAt = s.EndedAt,
    };
}

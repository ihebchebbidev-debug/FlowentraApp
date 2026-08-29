using Microsoft.EntityFrameworkCore;
using MyApi.Modules.OAS.Common;
using MyApi.Modules.OAS.Hierarchy.Models;
using MyApi.Modules.OAS.PostSessions.DTOs;
using MyApi.Modules.OAS.PostSessions.Models;

namespace MyApi.Modules.OAS.PostSessions.Services;

public interface IOasPostSessionService
{
    Task<(bool success, string? error, OasPostSessionDto? dto)> OpenAsync(int tenantId, Guid userId, OasOpenSessionRequestDto request);
    Task<(bool success, string? error, OasPostSessionDto? dto)> RelayAsync(int tenantId, Guid actorId, string actorRole, Guid sessionId, OasRelaySessionRequestDto request);
    Task<(bool success, string? error, OasPostSessionDto? dto)> CloseAsync(int tenantId, Guid actorId, string actorRole, Guid sessionId, OasCloseSessionRequestDto request);
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
    private readonly MyApi.Modules.OAS.Common.Scope.IOasPostScopeResolver _scope;

    public OasPostSessionService(OasDbContext db, MyApi.Modules.OAS.Common.Scope.IOasPostScopeResolver scope)
    {
        _db = db;
        _scope = scope;
    }

    /// <summary>BL-012 perimeter — shared implementation in Common/Scope/OasPostScopeResolver.</summary>
    private Task<Guid[]?> ScopedPostIdsAsync() => _scope.ScopedPostIdsAsync();


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

        // Reconnect / app-reload resume: the operator already holds an open
        // session on THIS post but lost their local copy, so they arrive with a
        // fresh ClientEventId and the idempotent replay above cannot match. That
        // is not a conflict — hand their own running session back instead of
        // 409'ing them out of production they are still doing.
        if (activeForUser is not null && activeForUser.PostId == request.PostId)
        {
            return (true, null, ToDto(activeForUser));
        }

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

    /// <summary>
    /// Mutating a session by id used to require only a valid token: any
    /// authenticated operator could relay a colleague's session to themselves
    /// (stealing in-flight production) or close someone else's session by
    /// guessing/observing its id. A caller may act on a session only when it
    /// is their own, or when they are admin/supervisor — and in every case the
    /// session's post must sit inside their BL-012 perimeter.
    /// </summary>
    private async Task<string?> AuthorizeSessionAsync(OasPostSession session, Guid actorId, string actorRole)
    {
        var scopedPostIds = await ScopedPostIdsAsync();
        if (scopedPostIds is not null && !scopedPostIds.Contains(session.PostId)) return "post_out_of_scope";

        var isPrivileged = actorRole is "admin" or "supervisor";
        if (!isPrivileged && session.UserId != actorId) return "not_your_session";
        return null;
    }

    public async Task<(bool success, string? error, OasPostSessionDto? dto)> RelayAsync(int tenantId, Guid actorId, string actorRole, Guid sessionId, OasRelaySessionRequestDto request)
    {
        var session = await _db.Set<OasPostSession>().FindAsync(sessionId);
        if (session is null) return (false, "not_found", null);
        if (session.EndedAt is not null) return (false, "session_already_closed", null);

        var authError = await AuthorizeSessionAsync(session, actorId, actorRole);
        if (authError is not null) return (false, authError, null);

        // The incoming operator must exist in this tenant and be free —
        // relaying onto a user who already holds another open session would
        // put them on two posts at once and break ux_oas_post_sessions_active.
        var incoming = await _db.Set<MyApi.Modules.OAS.ShopFloorAuth.Models.OasUser>()
            .FirstOrDefaultAsync(u => u.Id == request.NewUserId && u.IsActive);
        if (incoming is null) return (false, "new_user_not_found", null);

        var incomingActive = await _db.Set<OasPostSession>()
            .FirstOrDefaultAsync(s => s.UserId == request.NewUserId && s.EndedAt == null && s.Id != sessionId);
        if (incomingActive is not null) return (false, "new_user_already_has_active_session", null);

        // Relay keeps the SAME session row (and therefore its post,
        // production order, and any declarations already tied to it) —
        // only the operator changes. This is what actually preserves
        // in-flight work across a handover, unlike close+reopen.
        session.UserId = request.NewUserId;
        await _db.SaveChangesAsync();
        return (true, null, ToDto(session));
    }

    public async Task<(bool success, string? error, OasPostSessionDto? dto)> CloseAsync(int tenantId, Guid actorId, string actorRole, Guid sessionId, OasCloseSessionRequestDto request)
    {
        var session = await _db.Set<OasPostSession>().FindAsync(sessionId);
        if (session is null) return (false, "not_found", null);

        var authError = await AuthorizeSessionAsync(session, actorId, actorRole);
        if (authError is not null) return (false, authError, null);

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
        if (post is null) return new OasScanResultDto { Resolved = false };

        // Scan is the pre-step to opening a session, so it must answer with
        // the same perimeter OpenAsync enforces — otherwise it doubles as a
        // post-code oracle for the whole tenant and the operator only
        // discovers the refusal after scanning.
        if (!await _scope.IsPostInScopeAsync(post.Id)) return new OasScanResultDto { Resolved = false };

        return new OasScanResultDto { Resolved = true, PostId = post.Id, PostCode = post.Code };
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

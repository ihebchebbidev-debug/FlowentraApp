using Microsoft.EntityFrameworkCore;
using MyApi.Modules.OAS.Common;
using MyApi.Modules.OAS.Declarations.DTOs;
using MyApi.Modules.OAS.Declarations.Models;
using MyApi.Modules.OAS.Hierarchy.Models;
using MyApi.Modules.OAS.PostSessions.Models;

namespace MyApi.Modules.OAS.Declarations.Services;

public interface IOasDeclarationService
{
    Task<(bool success, string? error, OasDeclarationDto? dto)> CreateProductionAsync(int tenantId, Guid userId, OasProductionDeclarationRequestDto request);
    Task<(bool success, string? error, OasDeclarationDto? dto)> CreateScrapAsync(int tenantId, Guid userId, OasScrapDeclarationRequestDto request);
    Task<(bool success, string? error, OasDeclarationDto? dto)> CorrectAsync(int tenantId, Guid actorId, string actorRole, Guid id, OasCorrectDeclarationRequestDto request);
    Task<IReadOnlyList<OasDeclarationDto>> GetAsync(int tenantId, Guid? postId, Guid? sessionId, DateTimeOffset? from, DateTimeOffset? to);
    Task<OasDeclarationDto?> GetOneAsync(int tenantId, Guid id);
}

/// <summary>
/// v12 decision (BL-045): correction window is 10 minutes from the
/// ORIGINAL declaration's OccurredAt — not 24h (an earlier draft of the
/// spec had this wrong; the shipped frontend, its own code comment, and
/// all 3 locale files agree on 10 min). v15: ownership is enforced from
/// the server's own record of who created the declaration
/// (CreatedBy), never a client-supplied field — a relayed-in operator
/// cannot correct the outgoing operator's entries just because the
/// session continued.
/// </summary>
public class OasDeclarationService : IOasDeclarationService
{
    private static readonly TimeSpan CorrectionWindow = TimeSpan.FromMinutes(10);

    private readonly OasDbContext _db;
    private readonly MyApi.Modules.OAS.Common.Scope.IOasPostScopeResolver _scope;
    public OasDeclarationService(OasDbContext db, MyApi.Modules.OAS.Common.Scope.IOasPostScopeResolver scope)
    {
        _db = db;
        _scope = scope;
    }

    /// <summary>
    /// BL-012 perimeter, resolved via Post→Line→Zone since OasDeclaration
    /// only carries PostId directly. Shared implementation now lives in
    /// Common/Scope/OasPostScopeResolver so every sub-module enforces the
    /// exact same perimeter (it used to be copy-pasted per service, and
    /// missing entirely in Quality/Interventions).
    /// </summary>
    private Task<Guid[]?> ScopedPostIdsAsync() => _scope.ScopedPostIdsAsync();

    private Task<bool> IsPostInScopeAsync(Guid postId) => _scope.IsPostInScopeAsync(postId);


    /// <summary>
    /// Clock-drift / tampering guard on the client-asserted OccurredAt: the
    /// correction window and every KPI bucket are keyed off it, so a
    /// backdated (or future-dated) timestamp could widen the operator's own
    /// correction window and misattribute production to another shift/day.
    /// A tablet that was genuinely offline may legitimately be hours late,
    /// hence the generous past bound; the future bound is tight.
    /// </summary>
    private static readonly TimeSpan MaxOccurredAtPast = TimeSpan.FromHours(24);
    private static readonly TimeSpan MaxOccurredAtFuture = TimeSpan.FromMinutes(5);

    private static string? ValidateOccurredAt(DateTimeOffset occurredAt)
    {
        var now = DateTimeOffset.UtcNow;
        if (occurredAt > now.Add(MaxOccurredAtFuture)) return "occurred_at_in_future";
        if (occurredAt < now.Subtract(MaxOccurredAtPast)) return "occurred_at_too_old";
        return null;
    }

    public async Task<(bool success, string? error, OasDeclarationDto? dto)> CreateProductionAsync(int tenantId, Guid userId, OasProductionDeclarationRequestDto request)
    {
        var existing = await _db.Set<OasDeclaration>().FirstOrDefaultAsync(d => d.ClientEventId == request.ClientEventId);
        if (existing is not null) return (true, null, ToDto(existing));

        if (request.QuantityOk < 0 || request.QuantityNok < 0) return (false, "invalid_quantity", null);

        var timeError = ValidateOccurredAt(request.OccurredAt);
        if (timeError is not null) return (false, timeError, null);

        // BL-012 perimeter on the WRITE path too — reads were already scoped
        // (GetAsync/GetOneAsync) but a line-scoped operator could still
        // declare against any post in the tenant.
        if (!await IsPostInScopeAsync(request.PostId)) return (false, "post_out_of_scope", null);

        var sessionError = await ValidateSessionAsync(request.PostSessionId, request.PostId);
        if (sessionError is not null) return (false, sessionError, null);

        var declaration = new OasDeclaration
        {
            TenantId = tenantId, ClientEventId = request.ClientEventId, Kind = OasDeclarationKind.production,
            PostSessionId = request.PostSessionId, PostId = request.PostId, UserId = userId,
            ProductionOrderId = request.ProductionOrderId, ProductId = request.ProductId,
            QuantityOk = request.QuantityOk, QuantityNok = request.QuantityNok, Note = request.Note,
            OccurredAt = request.OccurredAt, CreatedBy = userId,
        };
        _db.Set<OasDeclaration>().Add(declaration);
        await _db.SaveChangesAsync();
        return (true, null, ToDto(declaration));
    }

    public async Task<(bool success, string? error, OasDeclarationDto? dto)> CreateScrapAsync(int tenantId, Guid userId, OasScrapDeclarationRequestDto request)
    {
        var existing = await _db.Set<OasDeclaration>().FirstOrDefaultAsync(d => d.ClientEventId == request.ClientEventId);
        if (existing is not null) return (true, null, ToDto(existing));

        if (request.QuantityNok < 0) return (false, "invalid_quantity", null);
        // Server-side enforcement of what was previously a client-only rule
        // (OasScrapDeclarationRequestDto.ScrapCauseId is nullable): a scrap
        // quantity posted with no cause used to be silently accepted.
        if (request.QuantityNok > 0 && request.ScrapCauseId is null) return (false, "scrap_cause_required", null);

        var timeError = ValidateOccurredAt(request.OccurredAt);
        if (timeError is not null) return (false, timeError, null);

        if (!await IsPostInScopeAsync(request.PostId)) return (false, "post_out_of_scope", null);

        var sessionError = await ValidateSessionAsync(request.PostSessionId, request.PostId);
        if (sessionError is not null) return (false, sessionError, null);

        var declaration = new OasDeclaration
        {
            TenantId = tenantId, ClientEventId = request.ClientEventId, Kind = OasDeclarationKind.scrap,
            PostSessionId = request.PostSessionId, PostId = request.PostId, UserId = userId,
            ProductionOrderId = request.ProductionOrderId, ProductId = request.ProductId,
            QuantityNok = request.QuantityNok, ScrapCauseId = request.ScrapCauseId, Note = request.Note,
            OccurredAt = request.OccurredAt, CreatedBy = userId,
        };
        _db.Set<OasDeclaration>().Add(declaration);
        await _db.SaveChangesAsync();
        return (true, null, ToDto(declaration));
    }

    /// <summary>
    /// Closing-lock check (BL gap fix): a declaration must land in a still-open
    /// session that belongs to the SAME post. A missing session row used to be
    /// left to the FK, which surfaced as a raw 500 for a corrupted offline queue
    /// item; it now returns a clean domain error the tablet can drop instead of
    /// retrying forever.
    /// </summary>
    private async Task<string?> ValidateSessionAsync(Guid? postSessionId, Guid postId)
    {
        if (postSessionId is null) return "post_session_required";
        var session = await _db.Set<OasPostSession>().FindAsync(postSessionId.Value);
        if (session is null) return "post_session_not_found";
        if (session.EndedAt is not null) return "session_already_closed";
        if (session.PostId != postId) return "post_session_post_mismatch";
        return null;
    }

    public async Task<(bool success, string? error, OasDeclarationDto? dto)> CorrectAsync(int tenantId, Guid actorId, string actorRole, Guid id, OasCorrectDeclarationRequestDto request)
    {
        var existingCorrection = await _db.Set<OasDeclaration>().FirstOrDefaultAsync(d => d.ClientEventId == request.ClientEventId);
        if (existingCorrection is not null) return (true, null, ToDto(existingCorrection));

        var original = await _db.Set<OasDeclaration>().FindAsync(id);
        if (original is null) return (false, "not_found", null);

        if (!await IsPostInScopeAsync(original.PostId)) return (false, "post_out_of_scope", null);

        var isPrivileged = actorRole is "admin" or "supervisor";
        if (!isPrivileged && original.CreatedBy != actorId)
        {
            return (false, "not_your_declaration", null);
        }

        if (DateTimeOffset.UtcNow - original.OccurredAt > CorrectionWindow)
        {
            return (false, "correction_window_expired", null);
        }


        // Append-only (spec §5.1 trigger): a correction is a NEW row, the
        // original's QuantityOk/QuantityNok/OccurredAt are never touched —
        // trg_oas_decl_correction marks original.IsCorrected via AFTER INSERT.
        var correction = new OasDeclaration
        {
            TenantId = tenantId, ClientEventId = request.ClientEventId, Kind = original.Kind,
            PostSessionId = original.PostSessionId, PostId = original.PostId, LineId = original.LineId,
            UserId = original.UserId, ProductionOrderId = original.ProductionOrderId, ProductId = original.ProductId,
            QuantityOk = request.QuantityOk ?? original.QuantityOk, QuantityNok = request.QuantityNok ?? original.QuantityNok,
            ScrapCauseId = original.ScrapCauseId, OccurredAt = original.OccurredAt,
            CorrectsId = original.Id, CorrectionReason = request.Reason, CreatedBy = actorId,
        };
        _db.Set<OasDeclaration>().Add(correction);
        await _db.SaveChangesAsync();

        return (true, null, ToDto(correction));
    }

    public async Task<IReadOnlyList<OasDeclarationDto>> GetAsync(int tenantId, Guid? postId, Guid? sessionId, DateTimeOffset? from, DateTimeOffset? to)
    {
        var q = _db.Set<OasDeclaration>().AsQueryable();
        var scopedPostIds = await ScopedPostIdsAsync();
        if (scopedPostIds is not null) q = q.Where(d => scopedPostIds.Contains(d.PostId));
        if (postId is not null) q = q.Where(d => d.PostId == postId);
        if (sessionId is not null) q = q.Where(d => d.PostSessionId == sessionId);
        if (from is not null) q = q.Where(d => d.OccurredAt >= from);
        if (to is not null) q = q.Where(d => d.OccurredAt <= to);

        var rows = await q.OrderByDescending(d => d.OccurredAt).ToListAsync();
        return rows.Select(ToDto).ToList();
    }

    public async Task<OasDeclarationDto?> GetOneAsync(int tenantId, Guid id)
    {
        var d = await _db.Set<OasDeclaration>().FindAsync(id);
        if (d is null) return null;

        // BL-012 perimeter: FindAsync bypasses the IQueryable filtering
        // GetAsync applies via ScopedPostIdsAsync — a scoped caller must not
        // be able to fetch another site/zone/line's declaration by id.
        var scopedPostIds = await ScopedPostIdsAsync();
        if (scopedPostIds is not null && !scopedPostIds.Contains(d.PostId)) return null;

        return ToDto(d);
    }

    private static OasDeclarationDto ToDto(OasDeclaration d) => new()
    {
        Id = d.Id, Kind = d.Kind.ToString(), PostSessionId = d.PostSessionId, PostId = d.PostId, UserId = d.UserId,
        ProductionOrderId = d.ProductionOrderId, ProductId = d.ProductId, QuantityOk = d.QuantityOk, QuantityNok = d.QuantityNok,
        ScrapCauseId = d.ScrapCauseId, Note = d.Note, OccurredAt = d.OccurredAt, CorrectsId = d.CorrectsId, IsCorrected = d.IsCorrected,
        CorrectionReason = d.CorrectionReason, CreatedBy = d.CreatedBy,
    };
}

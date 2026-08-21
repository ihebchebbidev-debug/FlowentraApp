using Microsoft.EntityFrameworkCore;
using MyApi.Modules.OAS.Changeovers.DTOs;
using MyApi.Modules.OAS.Changeovers.Models;
using MyApi.Modules.OAS.Common;
using MyApi.Modules.OAS.Hierarchy.Models;
using System.Text.Json;

namespace MyApi.Modules.OAS.Changeovers.Services;

public interface IOasChangeoverService
{
    Task<(bool success, string? error, OasChangeoverDto? dto)> CreateOrUpdateAsync(int tenantId, Guid userId, OasChangeoverRequestDto request);
    Task<(bool success, string? error, OasChangeoverDto? dto)> FinishAsync(int tenantId, Guid actorId, Guid id);
    Task<IReadOnlyList<OasChangeoverDto>> GetAsync(int tenantId, Guid? postId, string? status);
}

/// <summary>
/// Default 5-step checklist mirrors ChangeoverPage.tsx's fixed sequence.
/// v12/v15 decision: `FinishAsync` refuses (409) unless every step is
/// done — closes the "resume production" bypass that let an operator
/// close an abandoned changeover without completing it.
/// </summary>
public class OasChangeoverService : IOasChangeoverService
{
    private static readonly (string Id, string Label)[] DefaultSteps =
    {
        ("clear", "Clear previous product/tooling"),
        ("setup", "Install new tooling/fixtures"),
        ("adjust", "Adjust parameters"),
        ("first_part", "Produce & validate first part"),
        ("cleanup", "Clean up work area"),
    };

    private readonly OasDbContext _db;
    private readonly System.Security.Claims.ClaimsPrincipal? _user;

    public OasChangeoverService(OasDbContext db, Microsoft.AspNetCore.Http.IHttpContextAccessor httpContextAccessor)
    {
        _db = db;
        _user = httpContextAccessor.HttpContext?.User;
    }

    private Guid? CallerScopeClaim(string type)
    {
        var claim = _user?.FindFirst(type)?.Value;
        return Guid.TryParse(claim, out var id) ? id : null;
    }

    /// <summary>Same BL-012 site/zone/line perimeter as OasDeclarationService.ScopedPostIdsAsync — this module had NO scope filtering at all before this fix (unlike Declarations/Events).</summary>
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

    public async Task<(bool success, string? error, OasChangeoverDto? dto)> CreateOrUpdateAsync(int tenantId, Guid userId, OasChangeoverRequestDto request)
    {
        var existing = await _db.Set<OasChangeover>().FirstOrDefaultAsync(c => c.ClientEventId == request.ClientEventId);
        if (existing is not null)
        {
            if (existing.EndedAt is not null) return (true, null, ToDto(existing)); // already finished — idempotent no-op
            if (request.Steps is not null) existing.Steps = JsonSerializer.Serialize(request.Steps);
            await _db.SaveChangesAsync();
            return (true, null, ToDto(existing));
        }

        var scopedPostIds = await ScopedPostIdsAsync();
        if (scopedPostIds is not null && !scopedPostIds.Contains(request.PostId))
        {
            return (false, "post_out_of_scope", null);
        }

        var alreadyOpenForPost = await _db.Set<OasChangeover>().AnyAsync(c => c.PostId == request.PostId && c.EndedAt == null);
        if (alreadyOpenForPost) return (false, "post_already_has_open_changeover", null);

        var steps = request.Steps ?? DefaultSteps.Select(s => new OasChangeoverStepDto { Id = s.Id, Label = s.Label, Done = false }).ToList();

        var changeover = new OasChangeover
        {
            TenantId = tenantId, ClientEventId = request.ClientEventId, PostId = request.PostId,
            FromProductId = request.FromProductId, ToProductId = request.ToProductId, ProductionOrderId = request.ProductionOrderId,
            StartedAt = DateTimeOffset.UtcNow, TargetMin = request.TargetMin, Steps = JsonSerializer.Serialize(steps), StartedBy = userId,
        };
        _db.Set<OasChangeover>().Add(changeover);
        try
        {
            await _db.SaveChangesAsync();
        }
        catch (DbUpdateException ex) when (IsUniqueViolation(ex))
        {
            // ux_oas_changeovers_open_post (partial unique index on post_id
            // where ended_at IS NULL, OasChangeoverConfiguration): mirrors
            // OasPostSessionService.OpenAsync's race guard — the pre-check
            // above is only optimistic. On conflict, detach our losing
            // insert and hand back whichever changeover actually won.
            _db.Entry(changeover).State = EntityState.Detached;
            var winner = await _db.Set<OasChangeover>().FirstOrDefaultAsync(c => c.PostId == request.PostId && c.EndedAt == null);
            if (winner is not null) return (true, null, ToDto(winner));
            return (false, "post_already_has_open_changeover", null);
        }
        return (true, null, ToDto(changeover));
    }

    private static bool IsUniqueViolation(DbUpdateException ex) =>
        ex.InnerException is Npgsql.PostgresException { SqlState: "23505" };

    public async Task<(bool success, string? error, OasChangeoverDto? dto)> FinishAsync(int tenantId, Guid actorId, Guid id)
    {
        var changeover = await _db.Set<OasChangeover>().FindAsync(id);
        if (changeover is null) return (false, "not_found", null);

        var scopedPostIds = await ScopedPostIdsAsync();
        if (scopedPostIds is not null && !scopedPostIds.Contains(changeover.PostId))
        {
            return (false, "post_out_of_scope", null);
        }

        if (changeover.EndedAt is not null) return (true, null, ToDto(changeover)); // idempotent

        var steps = JsonSerializer.Deserialize<List<OasChangeoverStepDto>>(changeover.Steps) ?? new();
        if (steps.Count == 0 || steps.Any(s => !s.Done))
        {
            return (false, "checklist_incomplete", null);
        }

        changeover.EndedAt = DateTimeOffset.UtcNow;
        changeover.DurationSec = (int)(changeover.EndedAt.Value - changeover.StartedAt).TotalSeconds;
        changeover.ValidatedBy = actorId;
        await _db.SaveChangesAsync();
        return (true, null, ToDto(changeover));
    }

    public async Task<IReadOnlyList<OasChangeoverDto>> GetAsync(int tenantId, Guid? postId, string? status)
    {
        var q = _db.Set<OasChangeover>().AsQueryable();
        var scopedPostIds = await ScopedPostIdsAsync();
        if (scopedPostIds is not null) q = q.Where(c => scopedPostIds.Contains(c.PostId));
        if (postId is not null) q = q.Where(c => c.PostId == postId);
        if (string.Equals(status, "open", StringComparison.OrdinalIgnoreCase)) q = q.Where(c => c.EndedAt == null);
        else if (string.Equals(status, "closed", StringComparison.OrdinalIgnoreCase)) q = q.Where(c => c.EndedAt != null);

        var rows = await q.OrderByDescending(c => c.StartedAt).ToListAsync();
        return rows.Select(ToDto).ToList();
    }

    private static OasChangeoverDto ToDto(OasChangeover c) => new()
    {
        Id = c.Id, PostId = c.PostId, FromProductId = c.FromProductId, ToProductId = c.ToProductId,
        StartedAt = c.StartedAt, EndedAt = c.EndedAt,
        Steps = JsonSerializer.Deserialize<List<OasChangeoverStepDto>>(c.Steps) ?? new(),
    };
}

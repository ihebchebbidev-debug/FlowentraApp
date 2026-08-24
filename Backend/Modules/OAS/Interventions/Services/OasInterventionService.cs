using Microsoft.EntityFrameworkCore;
using MyApi.Modules.OAS.Common;
using MyApi.Modules.OAS.Events.DTOs;
using MyApi.Modules.OAS.Events.Services;
using MyApi.Modules.OAS.Interventions.DTOs;
using MyApi.Modules.OAS.Interventions.Models;

namespace MyApi.Modules.OAS.Interventions.Services;

public interface IOasInterventionService
{
    Task<IReadOnlyList<OasInterventionDto>> GetAllAsync(int tenantId);
    Task<IReadOnlyList<OasInterventionDto>> GetInboxAsync(int tenantId, Guid assigneeId);
    Task<(bool success, string? error, OasInterventionDto? dto)> CreateAsync(int tenantId, OasCreateInterventionRequestDto request);
    Task<(bool success, string? error)> AssignAsync(int tenantId, Guid actorId, Guid id);
    Task<(bool success, string? error)> StartAsync(int tenantId, Guid id);
    Task<(bool success, string? error)> CloseAsync(int tenantId, Guid actorId, Guid id);
}

/// <summary>
/// §13 point 8: oas_interventions is a lightweight PROJECTION over
/// oas_events — assign/start/close are documented aliases onto
/// events.take/arrive/close so the state machine is never duplicated.
/// This service keeps the projection row in sync as a convenience for
/// the inbox view, but oas_events remains the source of truth.
/// </summary>
public class OasInterventionService : IOasInterventionService
{
    private readonly OasDbContext _db;
    private readonly IOasEventService _events;
    private readonly MyApi.Modules.OAS.Common.Scope.IOasPostScopeResolver _scope;
    public OasInterventionService(OasDbContext db, IOasEventService events, MyApi.Modules.OAS.Common.Scope.IOasPostScopeResolver scope)
    {
        _db = db;
        _events = events;
        _scope = scope;
    }

    /// <summary>
    /// BL-012 perimeter for the projection: an intervention has no PostId of
    /// its own, so it inherits the one on its source oas_event. This module had
    /// no scope enforcement at all — the maintenance inbox and every
    /// assign/start/close listed and mutated interventions across the whole
    /// tenant, i.e. other sites' breakdowns.
    /// </summary>
    private async Task<bool> IsInterventionInScopeAsync(OasIntervention intervention)
    {
        var scoped = await _scope.ScopedPostIdsAsync();
        if (scoped is null) return true;
        var postId = await _db.Set<MyApi.Modules.OAS.Events.Models.OasEvent>()
            .Where(e => e.Id == intervention.EventId).Select(e => (Guid?)e.PostId).FirstOrDefaultAsync();
        return postId is not null && scoped.Contains(postId.Value);
    }

    private async Task<IQueryable<OasIntervention>> ScopedQueryAsync()
    {
        var q = _db.Set<OasIntervention>().AsQueryable();
        var scoped = await _scope.ScopedPostIdsAsync();
        if (scoped is null) return q;

        var eventIds = _db.Set<MyApi.Modules.OAS.Events.Models.OasEvent>()
            .Where(e => scoped.Contains(e.PostId)).Select(e => e.Id);
        return q.Where(i => eventIds.Contains(i.EventId));
    }

    public async Task<IReadOnlyList<OasInterventionDto>> GetAllAsync(int tenantId)
    {
        var q = await ScopedQueryAsync();
        var rows = await q.OrderByDescending(i => i.CreatedAt).ToListAsync();
        return rows.Select(ToDto).ToList();
    }

    public async Task<IReadOnlyList<OasInterventionDto>> GetInboxAsync(int tenantId, Guid assigneeId)
    {
        var q = await ScopedQueryAsync();
        var rows = await q.Where(i => i.AssigneeId == assigneeId && i.Status != "closed").OrderByDescending(i => i.CreatedAt).ToListAsync();
        return rows.Select(ToDto).ToList();
    }

    public async Task<(bool success, string? error, OasInterventionDto? dto)> CreateAsync(int tenantId, OasCreateInterventionRequestDto request)
    {
        // The referenced event must exist in THIS tenant (the global query
        // filter covers that) and inside the caller's perimeter; otherwise a
        // caller could mint a projection row pointing at a foreign event.
        var sourceEvent = await _db.Set<MyApi.Modules.OAS.Events.Models.OasEvent>()
            .FirstOrDefaultAsync(e => e.Id == request.EventId);
        if (sourceEvent is null) return (false, "event_not_found", null);
        if (!await _scope.IsPostInScopeAsync(sourceEvent.PostId)) return (false, "post_out_of_scope", null);

        // Idempotent per source event: the projection is 1:1 with the event, and
        // a retried create used to silently produce duplicate inbox rows.
        var existing = await _db.Set<OasIntervention>().FirstOrDefaultAsync(i => i.EventId == request.EventId);
        if (existing is not null) return (true, null, ToDto(existing));

        var intervention = new OasIntervention { TenantId = tenantId, EventId = request.EventId, Status = "open" };
        _db.Set<OasIntervention>().Add(intervention);
        await _db.SaveChangesAsync();
        return (true, null, ToDto(intervention));
    }

    public async Task<(bool success, string? error)> AssignAsync(int tenantId, Guid actorId, Guid id)
    {
        var intervention = await _db.Set<OasIntervention>().FindAsync(id);
        if (intervention is null) return (false, "not_found");
        if (!await IsInterventionInScopeAsync(intervention)) return (false, "post_out_of_scope");

        var (success, error, _) = await _events.TakeAsync(tenantId, actorId, intervention.EventId);
        if (!success) return (false, error);

        intervention.AssigneeId = actorId;
        intervention.AssignedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync();
        return (true, null);
    }

    public async Task<(bool success, string? error)> StartAsync(int tenantId, Guid id)
    {
        var intervention = await _db.Set<OasIntervention>().FindAsync(id);
        if (intervention is null) return (false, "not_found");
        if (!await IsInterventionInScopeAsync(intervention)) return (false, "post_out_of_scope");

        var (success, error, _) = await _events.ArriveAsync(tenantId, intervention.EventId);
        if (!success) return (false, error);

        intervention.Status = "in_progress";
        intervention.StartedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync();
        return (true, null);
    }

    public async Task<(bool success, string? error)> CloseAsync(int tenantId, Guid actorId, Guid id)
    {
        var intervention = await _db.Set<OasIntervention>().FindAsync(id);
        if (intervention is null) return (false, "not_found");
        if (!await IsInterventionInScopeAsync(intervention)) return (false, "post_out_of_scope");

        var (success, error, _) = await _events.CloseAsync(tenantId, actorId, intervention.EventId, new OasCloseEventRequestDto { ClosureType = "resolved" });
        if (!success) return (false, error);

        intervention.Status = "closed";
        intervention.ClosedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync();
        return (true, null);
    }

    private static OasInterventionDto ToDto(OasIntervention i) => new() { Id = i.Id, EventId = i.EventId, AssigneeId = i.AssigneeId, Status = i.Status };
}

using Microsoft.EntityFrameworkCore;
using MyApi.Modules.OAS.Causes.DTOs;
using MyApi.Modules.OAS.Causes.Models;
using MyApi.Modules.OAS.Common;
using MyApi.Modules.OAS.Declarations.Models;
using MyApi.Modules.OAS.Equipments.Models;
using MyApi.Modules.OAS.Events.Models;

namespace MyApi.Modules.OAS.Causes.Services;

public interface IOasCauseService
{
    Task<IReadOnlyList<OasCauseDto>> GetTreeAsync(int tenantId);
    Task<(bool success, string? error, OasCauseDto? cause)> CreateAsync(int tenantId, OasCauseRequestDto request);
    Task<bool> UpdateAsync(int tenantId, Guid id, OasCauseRequestDto request);
    Task<bool> SetKindAsync(int tenantId, Guid id, string eventType);
    Task<bool> SetCriticalityAsync(int tenantId, Guid id, string criticality);
    Task<bool> SetActiveAsync(int tenantId, Guid id, bool isActive);
    Task<(bool success, string? error, OasCauseDto? child)> AddChildAsync(int tenantId, Guid parentId, OasCauseRequestDto request);
    Task<(bool success, string? error)> RemoveChildAsync(int tenantId, Guid parentId, Guid childId);
    Task<(bool success, string? error)> DeleteAsync(int tenantId, Guid id);
    Task<IReadOnlyList<OasCauseUsageDto>> GetUsageAsync(int tenantId);

    Task<IReadOnlyList<OasCauseProposalDto>> GetProposalsAsync(int tenantId);
    Task<OasCauseProposalDto> CreateProposalAsync(int tenantId, Guid proposedBy, OasCauseProposalRequestDto request);
    Task<(bool success, string? error)> ReviewProposalAsync(int tenantId, Guid id, Guid reviewedBy, OasCauseProposalReviewRequestDto request);
}

public class OasCauseService : IOasCauseService
{
    private readonly OasDbContext _db;
    public OasCauseService(OasDbContext db) => _db = db;

    public async Task<IReadOnlyList<OasCauseDto>> GetTreeAsync(int tenantId)
    {
        var all = await _db.Set<OasCause>().OrderBy(c => c.SortOrder).ToListAsync();
        var byParent = all.ToLookup(c => c.ParentId);

        OasCauseDto Build(OasCause c) => new()
        {
            Id = c.Id, ParentId = c.ParentId, Domain = c.Domain.ToString(), Code = c.Code,
            LabelFr = c.LabelFr, LabelAr = c.LabelAr, EventType = c.EventType?.ToString(),
            DefaultCriticality = c.DefaultCriticality.ToString(), IsActive = c.IsActive,
            Children = byParent[c.Id].Select(Build).ToList(),
        };

        return byParent[null].Select(Build).ToList();
    }

    public async Task<(bool success, string? error, OasCauseDto? cause)> CreateAsync(int tenantId, OasCauseRequestDto request)
    {
        if (!TryBuildCause(tenantId, request, out var cause, out var error)) return (false, error, null);
        _db.Set<OasCause>().Add(cause!);
        await _db.SaveChangesAsync();
        return (true, null, ToDto(cause!));
    }

    public async Task<bool> UpdateAsync(int tenantId, Guid id, OasCauseRequestDto request)
    {
        var cause = await _db.Set<OasCause>().FindAsync(id);
        if (cause is null) return false;
        cause.LabelFr = request.LabelFr; cause.LabelAr = request.LabelAr; cause.Code = request.Code;
        // Unknown enum values used to throw out of Enum.Parse and surface as a 500;
        // ArgumentException is mapped to a readable 400 by the global middleware.
        if (!string.IsNullOrEmpty(request.EventType)) cause.EventType = ParseEventType(request.EventType);
        cause.DefaultCriticality = ParseCriticality(request.DefaultCriticality);
        await _db.SaveChangesAsync();
        return true;
    }

    private static OasEventType ParseEventType(string value)
        => Enum.TryParse<OasEventType>(value, true, out var parsed) ? parsed : throw new ArgumentException($"invalid_event_type:{value}", nameof(value));

    private static OasCriticality ParseCriticality(string value)
        => Enum.TryParse<OasCriticality>(value, true, out var parsed) ? parsed : throw new ArgumentException($"invalid_criticality:{value}", nameof(value));

    public async Task<bool> SetKindAsync(int tenantId, Guid id, string eventType)
    {
        var cause = await _db.Set<OasCause>().FindAsync(id);
        if (cause is null) return false;
        cause.EventType = string.IsNullOrEmpty(eventType) ? null : ParseEventType(eventType);
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<bool> SetCriticalityAsync(int tenantId, Guid id, string criticality)
    {
        var cause = await _db.Set<OasCause>().FindAsync(id);
        if (cause is null) return false;
        cause.DefaultCriticality = ParseCriticality(criticality);
        await _db.SaveChangesAsync();
        return true;
    }


    public async Task<bool> SetActiveAsync(int tenantId, Guid id, bool isActive)
    {
        var cause = await _db.Set<OasCause>().FindAsync(id);
        if (cause is null) return false;
        cause.IsActive = isActive;
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<(bool success, string? error, OasCauseDto? child)> AddChildAsync(int tenantId, Guid parentId, OasCauseRequestDto request)
    {
        var parent = await _db.Set<OasCause>().FindAsync(parentId);
        if (parent is null) return (false, "parent_not_found", null);

        request.ParentId = parentId;
        if (!TryBuildCause(tenantId, request, out var child, out var error)) return (false, error, null);
        _db.Set<OasCause>().Add(child!);
        await _db.SaveChangesAsync();
        return (true, null, ToDto(child!));
    }

    public async Task<(bool success, string? error)> RemoveChildAsync(int tenantId, Guid parentId, Guid childId)
    {
        var child = await _db.Set<OasCause>().FirstOrDefaultAsync(c => c.Id == childId && c.ParentId == parentId);
        if (child is null) return (false, "not_found");
        if (await IsCauseInUseAsync(childId)) return (false, "cause_in_use");
        _db.Set<OasCause>().Remove(child);
        try
        {
            await _db.SaveChangesAsync();
        }
        catch (DbUpdateException)
        {
            // A foreign key IsCauseInUseAsync doesn't know about (quality
            // checks, interventions, proposals…) still references this cause.
            _db.Entry(child).State = EntityState.Unchanged;
            return (false, "cause_in_use");
        }
        return (true, null);
    }

    public async Task<(bool success, string? error)> DeleteAsync(int tenantId, Guid id)
    {
        var cause = await _db.Set<OasCause>().FindAsync(id);
        if (cause is null) return (false, "not_found");
        if (await IsCauseInUseAsync(id)) return (false, "cause_in_use");
        // Orphan children rather than cascade-delete a whole branch silently.
        await _db.Set<OasCause>().Where(c => c.ParentId == id).ExecuteUpdateAsync(s => s.SetProperty(c => c.ParentId, (Guid?)null));
        _db.Set<OasCause>().Remove(cause);
        try
        {
            await _db.SaveChangesAsync();
        }
        catch (DbUpdateException)
        {
            _db.Entry(cause).State = EntityState.Unchanged;
            return (false, "cause_in_use");
        }
        return (true, null);
    }


    /// <summary>
    /// Guards delete/remove-child against orphaning references: a cause is
    /// "in use" if any declaration recorded it as ScrapCauseId, or any
    /// event recorded it as CauseId (spec §6.1 "Usage des causes" — the
    /// same two source tables GetUsageAsync's raw SQL counts).
    /// </summary>
    private async Task<bool> IsCauseInUseAsync(Guid id)
    {
        if (await _db.Set<OasDeclaration>().AnyAsync(d => d.ScrapCauseId == id)) return true;
        return await _db.Set<OasEvent>().AnyAsync(e => e.CauseId == id);
    }

    public async Task<IReadOnlyList<OasCauseUsageDto>> GetUsageAsync(int tenantId)
    {
        // Derived from oas_declarations.scrap_cause_id + oas_events.cause_id
        // (spec §6.1 "Usage des causes" — never incremented client-side).
        return await _db.Database.SqlQueryRaw<OasCauseUsageDto>(
            """
            select cause_id as "CauseId", count(*)::int as "Count" from (
              select scrap_cause_id as cause_id from oas_declarations where scrap_cause_id is not null
              union all
              select cause_id from oas_events where cause_id is not null
            ) u
            group by cause_id
            """).ToListAsync();
    }

    public async Task<IReadOnlyList<OasCauseProposalDto>> GetProposalsAsync(int tenantId)
    {
        var rows = await _db.Set<OasCauseProposal>().OrderByDescending(p => p.CreatedAt).ToListAsync();
        return rows.Select(ToProposalDto).ToList();
    }

    public async Task<OasCauseProposalDto> CreateProposalAsync(int tenantId, Guid proposedBy, OasCauseProposalRequestDto request)
    {
        var proposal = new OasCauseProposal
        {
            TenantId = tenantId, Domain = Enum.Parse<OasCauseDomain>(request.Domain, true),
            LabelFr = request.LabelFr, LabelAr = request.LabelAr, ProposedBy = proposedBy, Status = "pending",
        };
        _db.Set<OasCauseProposal>().Add(proposal);
        await _db.SaveChangesAsync();
        return ToProposalDto(proposal);
    }

    public async Task<(bool success, string? error)> ReviewProposalAsync(int tenantId, Guid id, Guid reviewedBy, OasCauseProposalReviewRequestDto request)
    {
        var proposal = await _db.Set<OasCauseProposal>().FindAsync(id);
        if (proposal is null) return (false, "not_found");
        if (proposal.Status != "pending") return (false, "already_reviewed");

        if (string.Equals(request.Decision, "accept", StringComparison.OrdinalIgnoreCase))
        {
            if (string.IsNullOrWhiteSpace(request.Code)) return (false, "code_required_to_accept");
            var cause = new OasCause
            {
                TenantId = tenantId, ParentId = request.ParentId, Domain = proposal.Domain,
                Code = request.Code, LabelFr = proposal.LabelFr, LabelAr = proposal.LabelAr ?? proposal.LabelFr,
            };
            _db.Set<OasCause>().Add(cause);
            // oas_cause_proposals.resulting_cause_id is a real FK to
            // oas_causes(id), but ResultingCauseId is a bare Guid? with no
            // navigation property, so EF cannot order the proposal UPDATE
            // after the cause INSERT — it emitted the UPDATE first and the
            // FK rejected it (every accept returned 500). Persist the cause
            // in its own round-trip before pointing the proposal at it.
            await _db.SaveChangesAsync();

            proposal.ResultingCauseId = cause.Id;
            proposal.Status = "accepted";
        }
        else
        {
            proposal.Status = "rejected";
        }

        proposal.ReviewedBy = reviewedBy;
        proposal.ReviewedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync();
        return (true, null);

    }

    private bool TryBuildCause(int tenantId, OasCauseRequestDto request, out OasCause? cause, out string? error)
    {
        cause = null;
        if (!Enum.TryParse<OasCauseDomain>(request.Domain, true, out var domain)) { error = "invalid_domain"; return false; }
        // Enum.Parse here used to throw on an unknown eventType/criticality, so a
        // typo'd value surfaced as a raw 500 instead of a readable 400.
        OasEventType? eventType = null;
        if (!string.IsNullOrEmpty(request.EventType))
        {
            if (!Enum.TryParse<OasEventType>(request.EventType, true, out var parsedType)) { error = "invalid_event_type"; return false; }
            eventType = parsedType;
        }
        if (!Enum.TryParse<OasCriticality>(request.DefaultCriticality, true, out var criticality)) { error = "invalid_criticality"; return false; }

        cause = new OasCause
        {
            TenantId = tenantId, ParentId = request.ParentId, Domain = domain, Code = request.Code,
            LabelFr = request.LabelFr, LabelAr = request.LabelAr,
            EventType = eventType,
            DefaultCriticality = criticality,
        };
        error = null;
        return true;
    }


    private static OasCauseDto ToDto(OasCause c) => new()
    {
        Id = c.Id, ParentId = c.ParentId, Domain = c.Domain.ToString(), Code = c.Code,
        LabelFr = c.LabelFr, LabelAr = c.LabelAr, EventType = c.EventType?.ToString(),
        DefaultCriticality = c.DefaultCriticality.ToString(), IsActive = c.IsActive,
    };

    private static OasCauseProposalDto ToProposalDto(OasCauseProposal p) => new()
    {
        Id = p.Id, Domain = p.Domain.ToString(), LabelFr = p.LabelFr, LabelAr = p.LabelAr,
        ProposedBy = p.ProposedBy, Status = p.Status, CreatedAt = p.CreatedAt,
    };
}

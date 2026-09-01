using Microsoft.EntityFrameworkCore;
using MyApi.Modules.OAS.Common;
using MyApi.Modules.OAS.Teams.DTOs;
using MyApi.Modules.OAS.Teams.Models;

namespace MyApi.Modules.OAS.Teams.Services;

public interface IOasTeamService
{
    Task<IReadOnlyList<OasTeamDto>> GetAllAsync(int tenantId);
    Task<OasTeamDto> CreateAsync(int tenantId, OasTeamRequestDto request);
    Task<bool> SetMembersAsync(int tenantId, Guid teamId, OasTeamMembersRequestDto request);
    Task<bool> DeleteAsync(int tenantId, Guid teamId);
}

public class OasTeamService : IOasTeamService
{
    private readonly OasDbContext _db;
    public OasTeamService(OasDbContext db) => _db = db;

    public async Task<IReadOnlyList<OasTeamDto>> GetAllAsync(int tenantId)
    {
        var teams = await _db.Set<OasTeam>().OrderBy(t => t.Name).ToListAsync();
        var members = await _db.Set<OasTeamMember>().Where(m => m.ValidTo == null).ToListAsync();
        return teams.Select(t => ToDto(t, members.Where(m => m.TeamId == t.Id).Select(m => m.UserId).ToList())).ToList();
    }

    public async Task<OasTeamDto> CreateAsync(int tenantId, OasTeamRequestDto request)
    {
        // (tenant_id, site_id, code) is unique in oas_teams; without this
        // pre-check a duplicate code surfaced as a raw 500 instead of a
        // conflict the console can show ("code already used on this site").
        // site_id is NOT NULL in oas_teams; an omitted siteId used to reach the
        // database and surface as a raw 500 instead of a readable validation error.
        if (request.SiteId == Guid.Empty) throw new ArgumentException("site_required");

        var duplicate = await _db.Set<OasTeam>().AnyAsync(t => t.SiteId == request.SiteId && t.Code == request.Code);
        if (duplicate) throw new InvalidOperationException("team_code_already_exists");

        var team = new OasTeam { TenantId = tenantId, SiteId = request.SiteId, Code = request.Code, Name = request.Name, LeadUserId = request.LeadUserId };
        _db.Set<OasTeam>().Add(team);
        await _db.SaveChangesAsync();
        return ToDto(team, new List<Guid>());
    }


    public async Task<bool> SetMembersAsync(int tenantId, Guid teamId, OasTeamMembersRequestDto request)
    {
        var team = await _db.Set<OasTeam>().FindAsync(teamId);
        if (team is null) return false;

        var currentMembers = await _db.Set<OasTeamMember>().Where(m => m.TeamId == teamId && m.ValidTo == null).ToListAsync();
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        foreach (var member in currentMembers.Where(m => !request.MemberIds.Contains(m.UserId)))
        {
            member.ValidTo = today;
        }

        var existingUserIds = currentMembers.Select(m => m.UserId).ToHashSet();
        foreach (var userId in request.MemberIds.Where(id => !existingUserIds.Contains(id)))
        {
            _db.Set<OasTeamMember>().Add(new OasTeamMember { TenantId = tenantId, TeamId = teamId, UserId = userId, ValidFrom = today });
        }

        await _db.SaveChangesAsync();
        return true;
    }

    /// <summary>Removes a team and its membership rows. Memberships are child records with no history value once the team is gone, so they are hard-deleted in the same transaction rather than left orphaned.</summary>
    public async Task<bool> DeleteAsync(int tenantId, Guid teamId)
    {
        var team = await _db.Set<OasTeam>().FindAsync(teamId);
        if (team is null) return false;

        var members = await _db.Set<OasTeamMember>().Where(m => m.TeamId == teamId).ToListAsync();
        if (members.Count > 0) _db.Set<OasTeamMember>().RemoveRange(members);
        _db.Set<OasTeam>().Remove(team);
        await _db.SaveChangesAsync();
        return true;
    }

    private static OasTeamDto ToDto(OasTeam t, List<Guid> memberIds) => new()
    {
        Id = t.Id, SiteId = t.SiteId, Code = t.Code, Name = t.Name, LeadUserId = t.LeadUserId, MemberIds = memberIds,
    };
}

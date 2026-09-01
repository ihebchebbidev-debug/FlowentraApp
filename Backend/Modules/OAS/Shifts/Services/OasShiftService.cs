using Microsoft.EntityFrameworkCore;
using MyApi.Modules.OAS.Common;
using MyApi.Modules.OAS.Shifts.DTOs;
using MyApi.Modules.OAS.Shifts.Models;

namespace MyApi.Modules.OAS.Shifts.Services;

public interface IOasShiftService
{
    Task<IReadOnlyList<OasShiftTemplateDto>> GetTemplatesAsync(int tenantId);
    Task<(bool success, string? error, OasShiftTemplateDto? dto)> CreateTemplateAsync(int tenantId, OasShiftTemplateRequestDto request);
    Task<(bool success, string? error)> UpdateTemplateAsync(int tenantId, Guid id, OasShiftTemplateRequestDto request);
    Task<(bool success, string? error)> SetTemplateActiveAsync(int tenantId, Guid id, bool isActive);
    Task<(bool Ok, string? Error)> DeleteTemplateAsync(int tenantId, Guid id);

    Task<IReadOnlyList<OasShiftCalendarEntryDto>> GetCalendarAsync(int tenantId, DateOnly from, DateOnly to);
    Task PutCalendarAsync(int tenantId, Guid siteId, IReadOnlyList<OasShiftCalendarEntryDto> entries);

    Task<OasShiftSignoffDto> CreateSignoffAsync(int tenantId, Guid signedBy, OasShiftSignoffRequestDto request);
    Task<IReadOnlyList<OasShiftSignoffDto>> GetSignoffsAsync(int tenantId, Guid? shiftTemplateId, DateOnly? date);
}

public class OasShiftService : IOasShiftService
{
    private readonly OasDbContext _db;
    public OasShiftService(OasDbContext db) => _db = db;

    public async Task<IReadOnlyList<OasShiftTemplateDto>> GetTemplatesAsync(int tenantId)
    {
        var rows = await _db.Set<OasShiftTemplate>().OrderBy(s => s.StartTime).ToListAsync();
        return rows.Select(ToDto).ToList();
    }

    public async Task<(bool success, string? error, OasShiftTemplateDto? dto)> CreateTemplateAsync(int tenantId, OasShiftTemplateRequestDto request)
    {
        // v15: a zero-length shift (start == end) must be rejected outright,
        // not silently treated as a 24h shift by the midnight-wraparound
        // math downstream (Kpi module's opening-minutes formula).
        if (request.StartTime == request.EndTime) return (false, "start_and_end_must_differ", null);
        if (!Enum.TryParse<OasShiftCode>(request.Code, true, out var code)) code = OasShiftCode.custom;

        // A duplicate (site, code) hits the unique index and surfaced as a raw
        // 500; it is a plain user-facing conflict, so detect it up front.
        var duplicate = await _db.Set<OasShiftTemplate>()
            .AnyAsync(s => s.SiteId == request.SiteId && s.Code == code && s.Name == request.Name);
        if (duplicate) return (false, "code_already_exists", null);

        var template = new OasShiftTemplate
        {
            TenantId = tenantId, SiteId = request.SiteId, Code = code, Name = request.Name,
            StartTime = request.StartTime, EndTime = request.EndTime,
            CrossesMidnight = request.EndTime < request.StartTime,
            BreakMinutes = request.BreakMinutes, IsActive = request.IsActive,
        };
        _db.Set<OasShiftTemplate>().Add(template);
        await _db.SaveChangesAsync();
        return (true, null, ToDto(template));
    }

    public async Task<(bool success, string? error)> UpdateTemplateAsync(int tenantId, Guid id, OasShiftTemplateRequestDto request)
    {
        if (request.StartTime == request.EndTime) return (false, "start_and_end_must_differ");
        var template = await _db.Set<OasShiftTemplate>().FindAsync(id);
        if (template is null) return (false, "not_found");

        var clash = await _db.Set<OasShiftTemplate>()
            .AnyAsync(s => s.Id != id && s.SiteId == request.SiteId && s.Code == template.Code && s.Name == request.Name);
        if (clash) return (false, "code_already_exists");

        template.SiteId = request.SiteId; template.Name = request.Name;
        template.StartTime = request.StartTime; template.EndTime = request.EndTime;
        template.CrossesMidnight = request.EndTime < request.StartTime;
        template.BreakMinutes = request.BreakMinutes; template.IsActive = request.IsActive;
        await _db.SaveChangesAsync();
        return (true, null);
    }

    public async Task<(bool success, string? error)> SetTemplateActiveAsync(int tenantId, Guid id, bool isActive)
    {
        var template = await _db.Set<OasShiftTemplate>().FindAsync(id);
        if (template is null) return (false, "not_found");
        template.IsActive = isActive;
        await _db.SaveChangesAsync();
        return (true, null);
    }

    /// <summary>
    /// Deleting a template that is still referenced (assignments, calendar
    /// entries, sessions…) used to bubble the raw Postgres FK violation up
    /// as a 500. It is a legitimate user-facing conflict, so translate it
    /// into "in_use" and let the controller answer 409.
    /// </summary>
    public async Task<(bool Ok, string? Error)> DeleteTemplateAsync(int tenantId, Guid id)
    {
        var template = await _db.Set<OasShiftTemplate>().FindAsync(id);
        if (template is null) return (false, "not_found");
        _db.Set<OasShiftTemplate>().Remove(template);
        try
        {
            await _db.SaveChangesAsync();
        }
        catch (DbUpdateException)
        {
            _db.Entry(template).State = EntityState.Unchanged;
            return (false, "in_use");
        }
        return (true, null);
    }

    public async Task<IReadOnlyList<OasShiftCalendarEntryDto>> GetCalendarAsync(int tenantId, DateOnly from, DateOnly to)
    {
        var rows = await _db.Set<OasShiftCalendarEntry>()
            .Where(e => e.WorkDate >= from && e.WorkDate <= to)
            .OrderBy(e => e.WorkDate)
            .ToListAsync();
        return rows.Select(e => new OasShiftCalendarEntryDto { ShiftTemplateId = e.ShiftTemplateId, WorkDate = e.WorkDate, IsWorkingDay = e.IsWorkingDay }).ToList();
    }

    public async Task PutCalendarAsync(int tenantId, Guid siteId, IReadOnlyList<OasShiftCalendarEntryDto> entries)
    {
        foreach (var entry in entries)
        {
            var existing = await _db.Set<OasShiftCalendarEntry>()
                .FirstOrDefaultAsync(e => e.SiteId == siteId && e.ShiftTemplateId == entry.ShiftTemplateId && e.WorkDate == entry.WorkDate);
            if (existing is null)
            {
                _db.Set<OasShiftCalendarEntry>().Add(new OasShiftCalendarEntry
                {
                    TenantId = tenantId, SiteId = siteId, ShiftTemplateId = entry.ShiftTemplateId,
                    WorkDate = entry.WorkDate, IsWorkingDay = entry.IsWorkingDay,
                });
            }
            else
            {
                existing.IsWorkingDay = entry.IsWorkingDay;
            }
        }
        await _db.SaveChangesAsync();
    }

    /// <summary>
    /// Idempotent by design: the unique index (tenant, template, work_date,
    /// signed_by) means the same supervisor signing off the same shift/day
    /// twice used to blow up as a DbUpdateException → HTTP 500. Re-signing is
    /// a normal user action (double click, offline retry, second visit to the
    /// shift report), so the existing sign-off is returned instead — with the
    /// note refreshed when a new one is supplied.
    /// </summary>
    public async Task<OasShiftSignoffDto> CreateSignoffAsync(int tenantId, Guid signedBy, OasShiftSignoffRequestDto request)
    {
        var existing = await _db.Set<OasShiftSignoff>().FirstOrDefaultAsync(s =>
            s.ShiftTemplateId == request.ShiftTemplateId && s.WorkDate == request.WorkDate && s.SignedBy == signedBy);
        if (existing is not null)
        {
            if (!string.IsNullOrWhiteSpace(request.Note) && request.Note != existing.Note)
            {
                existing.Note = request.Note;
                await _db.SaveChangesAsync();
            }
            return ToSignoffDto(existing);
        }

        var signoff = new OasShiftSignoff
        {
            TenantId = tenantId, ShiftTemplateId = request.ShiftTemplateId, WorkDate = request.WorkDate,
            SignedBy = signedBy, Note = request.Note,
        };
        _db.Set<OasShiftSignoff>().Add(signoff);
        await _db.SaveChangesAsync();
        return ToSignoffDto(signoff);
    }


    public async Task<IReadOnlyList<OasShiftSignoffDto>> GetSignoffsAsync(int tenantId, Guid? shiftTemplateId, DateOnly? date)
    {
        var q = _db.Set<OasShiftSignoff>().AsQueryable();
        if (shiftTemplateId is not null) q = q.Where(s => s.ShiftTemplateId == shiftTemplateId);
        if (date is not null) q = q.Where(s => s.WorkDate == date);
        var rows = await q.OrderByDescending(s => s.SignedAt).ToListAsync();
        return rows.Select(ToSignoffDto).ToList();
    }

    private static OasShiftTemplateDto ToDto(OasShiftTemplate s)
    {
        var span = (s.EndTime.ToTimeSpan() - s.StartTime.ToTimeSpan());
        if (span < TimeSpan.Zero) span += TimeSpan.FromHours(24);
        var openingMin = (int)span.TotalMinutes - s.BreakMinutes;

        return new OasShiftTemplateDto
        {
            Id = s.Id, SiteId = s.SiteId, Code = s.Code.ToString(), Name = s.Name,
            StartTime = s.StartTime, EndTime = s.EndTime, CrossesMidnight = s.CrossesMidnight,
            BreakMinutes = s.BreakMinutes, IsActive = s.IsActive, OpeningMinutes = Math.Max(0, openingMin),
        };
    }

    private static OasShiftSignoffDto ToSignoffDto(OasShiftSignoff s) => new()
    {
        Id = s.Id, ShiftTemplateId = s.ShiftTemplateId, WorkDate = s.WorkDate, SignedBy = s.SignedBy, Note = s.Note, SignedAt = s.SignedAt,
    };
}

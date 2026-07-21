using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using MyApi.Data;
using MyApi.Modules.Dispatches.DTOs;
using MyApi.Modules.Dispatches.Models;
using MyApi.Modules.Dispatches.Mapping;
using MyApi.Modules.WorkflowEngine.Services;
using MyApi.Modules.Articles.Services;
using MyApi.Modules.Articles.DTOs;

namespace MyApi.Modules.Dispatches.Services
{
    public class DispatchService : IDispatchService
    {
        private readonly ApplicationDbContext _db;
        private readonly ILogger<DispatchService> _logger;
        private readonly IWorkflowTriggerService? _workflowTriggerService;
        private readonly MyApi.Modules.Numbering.Services.INumberingService? _numberingService;
        private readonly MyApi.Modules.Planning.Services.IPlannedLineEntryService? _plannedEntries;
        private readonly IStockTransactionService? _stockTransactionService;
        private readonly MyApi.Modules.Shared.Services.IActivityLogger? _activityLogger;

        public DispatchService(
            ApplicationDbContext db,
            ILogger<DispatchService> logger,
            IWorkflowTriggerService? workflowTriggerService = null,
            MyApi.Modules.Numbering.Services.INumberingService? numberingService = null,
            MyApi.Modules.Planning.Services.IPlannedLineEntryService? plannedEntries = null,
            IStockTransactionService? stockTransactionService = null,
            MyApi.Modules.Shared.Services.IActivityLogger? activityLogger = null)
        {
            _db = db;
            _logger = logger;
            _workflowTriggerService = workflowTriggerService;
            _numberingService = numberingService;
            _plannedEntries = plannedEntries;
            _stockTransactionService = stockTransactionService;
            _activityLogger = activityLogger;
        }

        // Helper to build a map of technicianId -> display name for a dispatch
        private async Task<System.Collections.Generic.Dictionary<int, string>> GetTechnicianNameMapForDispatchAsync(int dispatchId)
        {
            var techIds = await _db.Set<DispatchTechnician>()
                .Where(dt => dt.DispatchId == dispatchId)
                .Select(dt => dt.TechnicianId)
                .Distinct()
                .ToListAsync();

            if (techIds.Count == 0) return new System.Collections.Generic.Dictionary<int, string>();

            var users = await _db.Users
                .Where(u => techIds.Contains(u.Id))
                .Select(u => new { u.Id, u.FirstName, u.LastName, u.Email })
                .ToListAsync();

            var map = new System.Collections.Generic.Dictionary<int, string>();
            foreach (var u in users)
            {
                var name = (!string.IsNullOrWhiteSpace(u.FirstName) || !string.IsNullOrWhiteSpace(u.LastName))
                    ? $"{u.FirstName} {u.LastName}".Trim()
                    : u.Email;
                map[u.Id] = name ?? string.Empty;
            }
            return map;
        }

        public async Task<DispatchDto> CreateFromJobAsync(int jobId, CreateDispatchFromJobDto dto, string userId)
        {
            _logger.LogInformation("CreateFromJobAsync called by {UserId} for Job {JobId} (AutoCreate technicians: {HasTech})", userId, jobId, dto.AssignedTechnicianIds?.Count ?? 0);
            // Get the job to find the related ServiceOrder and Contact
            var job = await _db.ServiceOrderJobs
                .Include(j => j.ServiceOrder)
                .FirstOrDefaultAsync(j => j.Id == jobId);
            
            if (job == null)
                throw new KeyNotFoundException($"Job {jobId} not found");
            
            // Get ContactId from the ServiceOrder
            var contactId = dto.ContactId ?? job.ServiceOrder?.ContactId ?? 0;
            var serviceOrderId = dto.ServiceOrderId ?? job.ServiceOrderId;
            
            // If still no contact, try to get any valid contact
            if (contactId == 0)
            {
                var anyContact = await _db.Contacts.FirstOrDefaultAsync(c => !c.IsDeleted);
                if (anyContact != null)
                    contactId = anyContact.Id;
            }
            
            // Determine status based on whether technicians are assigned
            var hasTechnicians = dto.AssignedTechnicianIds != null && dto.AssignedTechnicianIds.Count > 0;
            var status = hasTechnicians ? "assigned" : "planned";

            // Prevent duplicate dispatches for the same job: if a non-deleted dispatch
            // already exists for this job, return it instead of creating a new one.
            var existingDispatch = await _db.Dispatches
                .Include(d => d.AssignedTechnicians)
                .FirstOrDefaultAsync(d => d.JobId == jobId.ToString() && !d.IsDeleted);

            if (existingDispatch != null)
            {
                _logger.LogWarning("CreateFromJobAsync: dispatch already exists for job {JobId} -> dispatchId {DispatchId}", jobId, existingDispatch.Id);
                var existingNameMap = await GetTechnicianNameMapForDispatchAsync(existingDispatch.Id);
                return DispatchMapping.ToDto(existingDispatch, existingNameMap);
            }
            
            string dispatchNumber;
            try
            {
                dispatchNumber = _numberingService != null
                    ? await _numberingService.GetNextAsync("Dispatch")
                    : MyApi.Modules.Numbering.Services.NumberingFallback.Generate("Dispatch");
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Numbering service failed for Dispatch, using GUID fallback");
                dispatchNumber = MyApi.Modules.Numbering.Services.NumberingFallback.Generate("Dispatch");
            }

            var dispatch = new Dispatch
            {
                DispatchNumber = dispatchNumber,
                JobId = jobId.ToString(),
                ContactId = contactId,
                ServiceOrderId = serviceOrderId,
                ProjectId = job.ServiceOrder?.ProjectId,
                Status = status,
                Priority = dto.Priority ?? job.Priority ?? "medium",
                ScheduledDate = dto.ScheduledDate,
                ScheduledStartTime = dto.ScheduledStartTime,
                ScheduledEndTime = dto.ScheduledEndTime,
                SiteAddress = dto.SiteAddress ?? string.Empty,
                Description = job.JobDescription ?? job.Description,
                CreatedDate = DateTime.UtcNow,
                CreatedBy = userId,
                DispatchedBy = userId,
                DispatchedAt = DateTime.UtcNow
            };

            // Wrap in execution strategy to be compatible with EnableRetryOnFailure
            var strategy = _db.Database.CreateExecutionStrategy();
            await strategy.ExecuteAsync(async () =>
            {
                await using var tx = await _db.Database.BeginTransactionAsync();
                try
                {
                    _db.Dispatches.Add(dispatch);
                    await _db.SaveChangesAsync();

                    // Always insert a DispatchJob row so GetPlanVsActualAsync (which queries
                    // through the join table) can aggregate actual time/expenses for this job.
                    _db.Set<DispatchJob>().Add(new DispatchJob
                    {
                        DispatchId = dispatch.Id,
                        JobId = jobId,
                        CreatedDate = DateTime.UtcNow
                    });

                    // Add assigned technicians to the DispatchTechnicians table
                    if (hasTechnicians)
                    {
                        foreach (var techIdStr in dto.AssignedTechnicianIds!)
                        {
                            if (int.TryParse(techIdStr, out var techId))
                            {
                                _db.Set<DispatchTechnician>().Add(new DispatchTechnician
                                {
                                    DispatchId = dispatch.Id,
                                    TechnicianId = techId,
                                    AssignedDate = DateTime.UtcNow,
                                    Role = "technician"
                                });
                            }
                        }
                        job.Status = "dispatched";
                    }

                    await _db.SaveChangesAsync();
                    await tx.CommitAsync();
                }
                catch
                {
                    await tx.RollbackAsync();
                    throw;
                }
            });

            _logger.LogInformation("Dispatch created from job {JobId} with ID {DispatchId}, Status: {Status}, Technicians: {TechCount}",
                jobId, dispatch.Id, status, dto.AssignedTechnicianIds?.Count ?? 0);

            // Reload dispatch with technicians for the DTO mapping
            var createdDispatch = await _db.Dispatches
                .Include(d => d.AssignedTechnicians)
                .FirstAsync(d => d.Id == dispatch.Id);

            var nameMap = await GetTechnicianNameMapForDispatchAsync(createdDispatch.Id);
            return DispatchMapping.ToDto(createdDispatch, nameMap);
        }

        public async Task<DispatchDto> CreateFromInstallationAsync(CreateDispatchFromInstallationDto dto, string userId)
        {
            _logger.LogInformation("CreateFromInstallationAsync called by {UserId} for Installation {InstallationId} with {JobCount} jobs",
                userId, dto.InstallationId, dto.JobIds.Count);

            // Validate all jobs exist
            var jobs = await _db.ServiceOrderJobs
                .Include(j => j.ServiceOrder)
                .Where(j => dto.JobIds.Contains(j.Id))
                .ToListAsync();

            if (dto.JobIds.Count == 0)
                throw new ArgumentException("At least one job is required to create an installation dispatch");

            if (jobs.Count != dto.JobIds.Count)
            {
                var foundIds = jobs.Select(j => j.Id).ToHashSet();
                var missingIds = dto.JobIds.Where(id => !foundIds.Contains(id)).ToList();
                throw new KeyNotFoundException($"Jobs not found: {string.Join(", ", missingIds)}");
            }

            // Check no job already has an active dispatch via DispatchJobs
            var existingDispatchJobIds = await _db.Set<DispatchJob>()
                .Where(dj => dto.JobIds.Contains(dj.JobId))
                .Join(_db.Dispatches.Where(d => !d.IsDeleted),
                    dj => dj.DispatchId, d => d.Id,
                    (dj, d) => dj.JobId)
                .ToListAsync();

            if (existingDispatchJobIds.Any())
            {
                throw new InvalidOperationException($"Jobs already dispatched: {string.Join(", ", existingDispatchJobIds)}");
            }

            // Also check legacy single-job dispatches
            var jobIdStrings = dto.JobIds.Select(id => id.ToString()).ToList();
            var legacyConflicts = await _db.Dispatches
                .Where(d => !d.IsDeleted && d.JobId != null && jobIdStrings.Contains(d.JobId))
                .Select(d => d.JobId)
                .ToListAsync();

            if (legacyConflicts.Any())
            {
                throw new InvalidOperationException($"Jobs already dispatched (legacy): {string.Join(", ", legacyConflicts)}");
            }

            // Get contact from DTO or from first job's service order
            var contactId = dto.ContactId ?? jobs.First().ServiceOrder?.ContactId ?? 0;
            var serviceOrderId = dto.ServiceOrderId ?? jobs.First().ServiceOrderId;

            if (contactId == 0)
            {
                var anyContact = await _db.Contacts.FirstOrDefaultAsync(c => !c.IsDeleted);
                if (anyContact != null) contactId = anyContact.Id;
            }

            var hasTechnicians = dto.AssignedTechnicianIds != null && dto.AssignedTechnicianIds.Count > 0;
            var status = hasTechnicians ? "assigned" : "planned";

            string dispatchNumber;
            try
            {
                dispatchNumber = _numberingService != null
                    ? await _numberingService.GetNextAsync("Dispatch")
                    : MyApi.Modules.Numbering.Services.NumberingFallback.Generate("Dispatch");
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Numbering service failed for Dispatch, using GUID fallback");
                dispatchNumber = MyApi.Modules.Numbering.Services.NumberingFallback.Generate("Dispatch");
            }

            var dispatch = new Dispatch
            {
                DispatchNumber = dispatchNumber,
                // Installation dispatches are multi-job; the canonical job list lives in DispatchJobs.
                // Leave legacy JobId NULL so single-job lookups don't accidentally match this dispatch.
                JobId = null,
                ContactId = contactId,
                ServiceOrderId = serviceOrderId,
                ProjectId = jobs.FirstOrDefault()?.ServiceOrder?.ProjectId,
                // installationId <= 0 means this is a whole-service-order dispatch, not an installation.
                InstallationId = dto.InstallationId > 0 ? dto.InstallationId : (int?)null,
                InstallationName = string.IsNullOrWhiteSpace(dto.InstallationName) ? null : dto.InstallationName,
                Status = status,
                Priority = dto.Priority ?? "medium",
                ScheduledDate = dto.ScheduledDate,
                ScheduledStartTime = dto.ScheduledStartTime,
                ScheduledEndTime = dto.ScheduledEndTime,
                SiteAddress = dto.SiteAddress ?? string.Empty,
                Description = dto.Notes ?? (dto.InstallationId > 0
                    ? $"Installation: {dto.InstallationName} ({dto.JobIds.Count} jobs)"
                    : $"Service order dispatch ({dto.JobIds.Count} jobs)"),
                CreatedDate = DateTime.UtcNow,
                CreatedBy = userId,
                DispatchedBy = userId,
                DispatchedAt = DateTime.UtcNow
            };

            var strategy = _db.Database.CreateExecutionStrategy();
            await strategy.ExecuteAsync(async () =>
            {
                using var tx = await _db.Database.BeginTransactionAsync();
                try
                {
                    _db.Dispatches.Add(dispatch);
                    await _db.SaveChangesAsync();

                    // Insert all jobs into DispatchJobs join table
                    foreach (var jobId in dto.JobIds)
                    {
                        _db.Set<DispatchJob>().Add(new DispatchJob
                        {
                            DispatchId = dispatch.Id,
                            JobId = jobId,
                            CreatedDate = DateTime.UtcNow
                        });
                    }
                    await _db.SaveChangesAsync();

                    // Add assigned technicians
                    if (hasTechnicians)
                    {
                        foreach (var techIdStr in dto.AssignedTechnicianIds!)
                        {
                            if (int.TryParse(techIdStr, out var techId))
                            {
                                _db.Set<DispatchTechnician>().Add(new DispatchTechnician
                                {
                                    DispatchId = dispatch.Id,
                                    TechnicianId = techId,
                                    AssignedDate = DateTime.UtcNow,
                                    Role = "technician"
                                });
                            }
                        }
                        await _db.SaveChangesAsync();

                        // Update all jobs' status to dispatched
                        foreach (var job in jobs)
                        {
                            job.Status = "dispatched";
                        }
                        await _db.SaveChangesAsync();
                    }

                    await tx.CommitAsync();
                }
                catch
                {
                    await tx.RollbackAsync();
                    throw;
                }
            });

            _logger.LogInformation(
                "Dispatch created from installation {InstallationId} with ID {DispatchId}, {JobCount} jobs, Status: {Status}",
                dto.InstallationId, dispatch.Id, dto.JobIds.Count, status);

            var createdDispatch = await _db.Dispatches
                .Include(d => d.AssignedTechnicians)
                .Include(d => d.DispatchJobs)
                .FirstAsync(d => d.Id == dispatch.Id);

            var nameMap = await GetTechnicianNameMapForDispatchAsync(createdDispatch.Id);
            return DispatchMapping.ToDto(createdDispatch, nameMap);
        }

        public async Task<DispatchDto> CreateFromServiceOrderAsync(CreateDispatchFromServiceOrderDto dto, string userId)
        {
            _logger.LogInformation("CreateFromServiceOrderAsync called by {UserId} for ServiceOrder {ServiceOrderId}",
                userId, dto.ServiceOrderId);

            // Resolve job ids: explicit list, or every non-deleted job on the service order.
            var jobIds = dto.JobIds != null && dto.JobIds.Count > 0
                ? dto.JobIds
                : await _db.ServiceOrderJobs
                    .Where(j => j.ServiceOrderId == dto.ServiceOrderId)
                    .Select(j => j.Id)
                    .ToListAsync();

            if (jobIds.Count == 0)
                throw new ArgumentException($"Service order {dto.ServiceOrderId} has no jobs to dispatch");

            // Reuse the multi-job creation path. InstallationId is left at 0 so the
            // dispatch is stored with InstallationId = NULL (a service-order dispatch).
            var installationDto = new CreateDispatchFromInstallationDto
            {
                InstallationId = 0,
                InstallationName = string.Empty,
                JobIds = jobIds,
                AssignedTechnicianIds = dto.AssignedTechnicianIds ?? new(),
                ScheduledDate = dto.ScheduledDate,
                ScheduledStartTime = dto.ScheduledStartTime,
                ScheduledEndTime = dto.ScheduledEndTime,
                Priority = dto.Priority,
                Notes = dto.Notes,
                SiteAddress = dto.SiteAddress,
                ContactId = dto.ContactId,
                ServiceOrderId = dto.ServiceOrderId
            };

            return await CreateFromInstallationAsync(installationDto, userId);
        }

        public async Task<DispatchDto> AddJobsToInstallationDispatchAsync(
            int installationId,
            string installationName,
            List<int> jobIds,
            List<string> technicianIds,
            DateTime scheduledDate,
            TimeSpan? scheduledStartTime,
            TimeSpan? scheduledEndTime,
            string priority,
            string? notes,
            string? siteAddress,
            int? contactId,
            int? serviceOrderId,
            string userId)
        {
            if (jobIds == null || jobIds.Count == 0)
                throw new ArgumentException("At least one job id is required", nameof(jobIds));

            // Parse technician ids once
            var techIdInts = (technicianIds ?? new List<string>())
                .Select(s => int.TryParse(s, out var n) ? n : (int?)null)
                .Where(n => n.HasValue)
                .Select(n => n!.Value)
                .ToList();

            // ── Concurrency guard ────────────────────────────────────────────
            // Two simultaneous merge calls for the same (installation, date) could both
            // miss the candidate query and create duplicate dispatches. Acquire a
            // transaction-scoped Postgres advisory lock so they serialize. The lock is
            // released automatically on COMMIT/ROLLBACK. Key = (installationId << 32) | dayNumber.
            // Wrap in execution strategy to be compatible with EnableRetryOnFailure
            var strategy = _db.Database.CreateExecutionStrategy();
            return await strategy.ExecuteAsync(async () =>
            {
                await using var tx = await _db.Database.BeginTransactionAsync();
                long lockKey = ((long)installationId << 32)
                             | (uint)(scheduledDate.Date - new DateTime(1970, 1, 1)).Days;
                await _db.Database.ExecuteSqlRawAsync("SELECT pg_advisory_xact_lock({0})", lockKey);

                // Look for an existing non-deleted dispatch on the same date for this installation
                // whose technician set matches the requested set (when technicians are provided).
                var openStatuses = new[] { "planned", "assigned", "scheduled" };

                var candidates = await _db.Dispatches
                    .Include(d => d.AssignedTechnicians)
                    .Include(d => d.DispatchJobs)
                    .Where(d => !d.IsDeleted
                        && d.InstallationId == installationId
                        && d.ScheduledDate.Date == scheduledDate.Date
                        && openStatuses.Contains(d.Status))
                    .ToListAsync();

                Dispatch? existing = null;
                if (techIdInts.Count == 0)
                {
                    existing = candidates.FirstOrDefault();
                }
                else
                {
                    existing = candidates.FirstOrDefault(d =>
                    {
                        var ids = d.AssignedTechnicians.Select(at => at.TechnicianId).ToHashSet();
                        return techIdInts.All(id => ids.Contains(id));
                    });
                }

                if (existing != null)
                {
                    // Skip jobs already attached to this dispatch
                    var alreadyAttached = existing.DispatchJobs.Select(dj => dj.JobId).ToHashSet();
                    var newJobIds = jobIds.Where(id => !alreadyAttached.Contains(id)).ToList();

                    if (newJobIds.Count > 0)
                    {
                        // Make sure these jobs are not attached to ANOTHER non-deleted dispatch
                        var conflicts = await _db.Set<DispatchJob>()
                            .Where(dj => newJobIds.Contains(dj.JobId) && dj.DispatchId != existing.Id)
                            .Join(_db.Dispatches.Where(d => !d.IsDeleted), dj => dj.DispatchId, d => d.Id, (dj, d) => dj.JobId)
                            .ToListAsync();

                        if (conflicts.Any())
                            throw new InvalidOperationException($"Jobs already dispatched: {string.Join(", ", conflicts)}");

                        var legacyConflicts = await _db.Dispatches
                            .Where(d => !d.IsDeleted
                                && d.Id != existing.Id
                                && d.JobId != null
                                && newJobIds.Select(i => i.ToString()).Contains(d.JobId))
                            .Select(d => d.JobId)
                            .ToListAsync();
                        if (legacyConflicts.Any())
                            throw new InvalidOperationException($"Jobs already dispatched (legacy): {string.Join(", ", legacyConflicts)}");

                        foreach (var jid in newJobIds)
                        {
                            _db.Set<DispatchJob>().Add(new DispatchJob
                            {
                                DispatchId = existing.Id,
                                JobId = jid,
                                CreatedDate = DateTime.UtcNow
                            });
                        }

                        // Mark jobs dispatched
                        var jobsToUpdate = await _db.ServiceOrderJobs.Where(j => newJobIds.Contains(j.Id)).ToListAsync();
                        foreach (var job in jobsToUpdate) job.Status = "dispatched";

                        existing.ModifiedBy = userId;
                        existing.ModifiedDate = DateTime.UtcNow;
                        await _db.SaveChangesAsync();

                        _logger.LogInformation(
                            "Appended {Count} job(s) to existing installation dispatch {DispatchId} (installation {InstallationId})",
                            newJobIds.Count, existing.Id, installationId);
                    }

                    var reloaded = await _db.Dispatches
                        .Include(d => d.AssignedTechnicians)
                        .Include(d => d.DispatchJobs)
                        .FirstAsync(d => d.Id == existing.Id);
                    var nameMap = await GetTechnicianNameMapForDispatchAsync(reloaded.Id);
                    await tx.CommitAsync();
                    return DispatchMapping.ToDto(reloaded, nameMap);
                }

                // No existing dispatch — create a new one via the canonical path.
                var createDto = new CreateDispatchFromInstallationDto
                {
                    InstallationId = installationId,
                    InstallationName = installationName,
                    JobIds = jobIds,
                    AssignedTechnicianIds = technicianIds ?? new List<string>(),
                    ScheduledDate = scheduledDate,
                    ScheduledStartTime = scheduledStartTime,
                    ScheduledEndTime = scheduledEndTime,
                    Priority = priority ?? "medium",
                    Notes = notes,
                    SiteAddress = siteAddress,
                    ContactId = contactId,
                    ServiceOrderId = serviceOrderId,
                };
                // CreateFromInstallationAsync uses the same DbContext / connection and will
                // enlist in this transaction so its writes are covered by the advisory lock too.
                var created = await CreateFromInstallationAsync(createDto, userId);
                await tx.CommitAsync();
                return created;
            });
        }

        public async Task<PagedResult<DispatchListItemDto>> GetAllAsync(DispatchQueryParams query)
        {
            var q = _db.Dispatches.AsNoTracking().AsQueryable().Where(d => !d.IsDeleted);

            if (!string.IsNullOrEmpty(query.Status)) q = q.Where(d => d.Status == query.Status);
            if (!string.IsNullOrEmpty(query.Priority)) q = q.Where(d => d.Priority == query.Priority);
            if (query.ServiceOrderId.HasValue) q = q.Where(d => d.ServiceOrderId == query.ServiceOrderId);
            if (query.DateFrom.HasValue) q = q.Where(d => d.ScheduledDate >= query.DateFrom.Value);
            if (query.DateTo.HasValue) q = q.Where(d => d.ScheduledDate <= query.DateTo.Value);

            var total = await q.CountAsync();
            var pageNumber = Math.Max(1, query.PageNumber);
            var pageSize = Math.Min(100, Math.Max(1, query.PageSize));

            var dispatches = await q
                .OrderByDescending(d => d.CreatedDate)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .Include(d => d.AssignedTechnicians)
                .Include(d => d.Contact)
                .Include(d => d.DispatchJobs)
                .AsSingleQuery()
                .ToListAsync();

            // Get all technician IDs to fetch user names
            var allTechnicianIds = dispatches
                .SelectMany(d => d.AssignedTechnicians.Select(at => at.TechnicianId))
                .Distinct()
                .ToList();

            // Fetch user names for all technicians in one query
            var technicianUsers = await _db.Users
                .Where(u => allTechnicianIds.Contains(u.Id))
                .Select(u => new { u.Id, u.FirstName, u.LastName, u.Email })
                .ToDictionaryAsync(u => u.Id);

            var items = dispatches.Select(d => new DispatchListItemDto
            {
                Id = d.Id,
                DispatchNumber = d.DispatchNumber,
                JobId = int.TryParse(d.JobId, out var jid) ? jid : null,
                ServiceOrderId = d.ServiceOrderId,
                ProjectId = d.ProjectId,
                ContactId = d.ContactId,
                ContactName = d.Contact != null 
                    ? (!string.IsNullOrEmpty(d.Contact.FirstName) || !string.IsNullOrEmpty(d.Contact.LastName)
                        ? $"{d.Contact.FirstName} {d.Contact.LastName}".Trim()
                        : d.Contact.Company)
                    : null,
                SiteAddress = d.SiteAddress,
                Status = d.Status,
                Priority = d.Priority,
                AssignedTechnicians = d.AssignedTechnicians.Select(at => {
                    var user = technicianUsers.GetValueOrDefault(at.TechnicianId);
                    return new UserLightDto 
                    { 
                        Id = at.TechnicianId,
                        Name = user != null ? $"{user.FirstName} {user.LastName}".Trim() : null,
                        Email = user?.Email
                    };
                }).ToList(),
                Scheduling = new SchedulingDto
                {
                    ScheduledDate = d.ScheduledDate,
                    ScheduledStartTime = d.ScheduledStartTime,
                    ScheduledEndTime = d.ScheduledEndTime,
                    EstimatedDuration = d.ScheduledStartTime.HasValue && d.ScheduledEndTime.HasValue
                        ? (int)(d.ScheduledEndTime.Value - d.ScheduledStartTime.Value).TotalMinutes
                        : d.ActualDuration
                },
                ScheduledDate = d.ScheduledDate,
                ScheduledStartTime = d.ScheduledStartTime?.ToString(@"hh\:mm"),
                ScheduledEndTime = d.ScheduledEndTime?.ToString(@"hh\:mm"),
                Notes = d.Description,
                DispatchedBy = d.DispatchedBy,
                CreatedDate = d.CreatedDate,
                ModifiedDate = d.ModifiedDate,
                InstallationId = d.InstallationId,
                InstallationName = d.InstallationName,
                JobIds = d.DispatchJobs?.Select(dj => dj.JobId).ToList() ?? new()
            }).ToList();

            // Enrich multi-job dispatches with job summaries (one extra query) so the
            // planning board can show a single card per dispatch and reveal its jobs on hover.
            var allJobIds = items.SelectMany(i => i.JobIds).Distinct().ToList();
            if (allJobIds.Count > 0)
            {
                var jobSummaries = await _db.ServiceOrderJobs
                    .AsNoTracking()
                    .Where(j => allJobIds.Contains(j.Id))
                    .Select(j => new DispatchJobSummaryDto
                    {
                        Id = j.Id,
                        Title = j.Title ?? j.JobDescription,
                        Status = j.Status,
                        EstimatedDuration = j.EstimatedDuration,
                        Priority = j.Priority
                    })
                    .ToDictionaryAsync(j => j.Id);

                foreach (var item in items)
                {
                    item.Jobs = item.JobIds
                        .Where(jobSummaries.ContainsKey)
                        .Select(id => jobSummaries[id])
                        .ToList();
                }
            }

            return new PagedResult<DispatchListItemDto>
            {
                Data = items,
                PageNumber = pageNumber,
                PageSize = pageSize,
                TotalItems = total,
                TotalPages = (int)Math.Ceiling(total / (double)pageSize)
            };
        }

        public async Task<DispatchDto> GetByIdAsync(int dispatchId)
        {
            var d = await _db.Dispatches
                .AsNoTracking()
                .Include(x => x.TimeEntries)
                .Include(x => x.Expenses)
                .Include(x => x.MaterialsUsed)
                .Include(x => x.Attachments)
                .Include(x => x.Notes)
                .Include(x => x.AssignedTechnicians)
                .Include(x => x.DispatchJobs)
                .FirstOrDefaultAsync(x => x.Id == dispatchId && !x.IsDeleted);

            if (d == null) throw new KeyNotFoundException($"Dispatch {dispatchId} not found");
            var nameMap = await GetTechnicianNameMapForDispatchAsync(d.Id);
            var dto = DispatchMapping.ToDto(d, nameMap);

            // Attach job summaries so the UI can list the dispatch's jobs.
            if (dto.JobIds.Count > 0)
            {
                dto.Jobs = await _db.ServiceOrderJobs
                    .AsNoTracking()
                    .Where(j => dto.JobIds.Contains(j.Id))
                    .Select(j => new DispatchJobSummaryDto
                    {
                        Id = j.Id,
                        Title = j.Title ?? j.JobDescription,
                        Status = j.Status,
                        EstimatedDuration = j.EstimatedDuration,
                        Priority = j.Priority
                    })
                    .ToListAsync();
            }

            return dto;
        }

        public async Task<DispatchDto> UpdateAsync(int dispatchId, UpdateDispatchDto dto, string userId)
        {
            var d = await _db.Dispatches.Include(x => x.AssignedTechnicians).FirstOrDefaultAsync(x => x.Id == dispatchId && !x.IsDeleted);
            if (d == null) throw new KeyNotFoundException($"Dispatch {dispatchId} not found");

            if (dto.ScheduledDate.HasValue) d.ScheduledDate = dto.ScheduledDate.Value;
            if (dto.ScheduledStartTime.HasValue) d.ScheduledStartTime = dto.ScheduledStartTime.Value;
            if (dto.ScheduledEndTime.HasValue) d.ScheduledEndTime = dto.ScheduledEndTime.Value;
            if (!string.IsNullOrEmpty(dto.Priority)) d.Priority = dto.Priority;

            d.ModifiedDate = DateTime.UtcNow;
            d.ModifiedBy = userId;
            await _db.SaveChangesAsync();
            var nameMap = await GetTechnicianNameMapForDispatchAsync(d.Id);
            return DispatchMapping.ToDto(d, nameMap);
        }

        public async Task<DispatchDto> UpdateStatusAsync(int dispatchId, UpdateDispatchStatusDto dto, string userId)
        {
            var d = await _db.Dispatches.FirstOrDefaultAsync(x => x.Id == dispatchId && !x.IsDeleted);
            if (d == null) throw new KeyNotFoundException($"Dispatch {dispatchId} not found");

            var oldStatus = d.Status;
            d.Status = dto.Status;
            d.ModifiedDate = DateTime.UtcNow;
            d.ModifiedBy = userId;
            if (dto.Status == "in_progress") d.ActualStartTime = DateTime.UtcNow;
            if (dto.Status == "technically_completed" || dto.Status == "completed") d.ActualEndTime = DateTime.UtcNow;

            await _db.SaveChangesAsync();

            // Upward propagation: Log activity to parent Sale (and Offer)
            if (oldStatus != dto.Status && d.ServiceOrderId.HasValue)
            {
                await PropagateDispatchStatusToSaleAsync(d, oldStatus, dto.Status, userId);
            }

            // Trigger workflow automation for status change
            // The workflow engine is the SINGLE SOURCE OF TRUTH for all status cascading logic
            // Users configure triggers in the Workflow module (from status -> to status)
            // The engine dynamically evaluates conditions and executes actions
            if (oldStatus != dto.Status && _workflowTriggerService != null)
            {
                try
                {
                    _logger.LogInformation(
                        "[DISPATCH-STATUS] Dispatch #{DispatchId} status changing: '{OldStatus}' -> '{NewStatus}'. " +
                        "ServiceOrderId: {ServiceOrderId}. Triggering workflow...",
                        dispatchId, oldStatus ?? "NULL", dto.Status, d.ServiceOrderId);
                    
                    await _workflowTriggerService.TriggerStatusChangeAsync(
                        "dispatch",
                        dispatchId,
                        oldStatus ?? "",
                        dto.Status,
                        userId,
                        new { 
                            dispatchId, 
                            dispatchNumber = d.DispatchNumber, 
                            jobId = d.JobId,
                            serviceOrderId = d.ServiceOrderId 
                        }
                    );
                    _logger.LogInformation(
                        "[DISPATCH-STATUS] Workflow trigger completed for dispatch {DispatchId}",
                        dispatchId);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, 
                        "[DISPATCH-STATUS] Failed to trigger workflow for dispatch {DispatchId} status change: {OldStatus} -> {NewStatus}",
                        dispatchId, oldStatus, dto.Status);
                }
            }
            else if (oldStatus != dto.Status)
            {
                _logger.LogWarning(
                    "[DISPATCH-STATUS] No workflow trigger service available for dispatch {DispatchId} status change: {OldStatus} -> {NewStatus}. " +
                    "Ensure workflow engine is properly configured.",
                    dispatchId, oldStatus, dto.Status);
            }

            var nameMap = await GetTechnicianNameMapForDispatchAsync(d.Id);
            return DispatchMapping.ToDto(d, nameMap);
        }

        /// <summary>
        /// Propagate dispatch status changes to parent Sale and Offer activities
        /// </summary>
        private async Task PropagateDispatchStatusToSaleAsync(Dispatch dispatch, string? oldStatus, string newStatus, string userId)
        {
            try
            {
                var serviceOrder = await _db.ServiceOrders.FindAsync(dispatch.ServiceOrderId);
                if (serviceOrder == null || string.IsNullOrEmpty(serviceOrder.SaleId)) return;

                if (!int.TryParse(serviceOrder.SaleId, out int saleId)) return;

                var sale = await _db.Sales.FindAsync(saleId);
                if (sale == null) return;

                // Create SaleActivity for dispatch status change
                var saleActivity = new MyApi.Modules.Sales.Models.SaleActivity
                {
                    SaleId = saleId,
                    Type = "dispatch_status_changed",
                    Description = $"Dispatch #{dispatch.DispatchNumber} status: {oldStatus} → {newStatus}",
                    CreatedAt = DateTime.UtcNow,
                    CreatedByName = sale.AssignedToName ?? "System"
                };
                _db.SaleActivities.Add(saleActivity);

                // Propagate to Offer if sale came from an offer
                if (!string.IsNullOrEmpty(sale.OfferId) && int.TryParse(sale.OfferId, out int offerId))
                {
                    var offerActivity = new MyApi.Modules.Offers.Models.OfferActivity
                    {
                        OfferId = offerId,
                        Type = "dispatch_status_changed",
                        Description = $"Dispatch #{dispatch.DispatchNumber} status: {oldStatus} → {newStatus} (Sale #{saleId})",
                        CreatedAt = DateTime.UtcNow,
                        CreatedByName = sale.AssignedToName ?? "System"
                    };
                    _db.OfferActivities.Add(offerActivity);
                }

                await _db.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to propagate dispatch status to sale activities for dispatch {DispatchId}", dispatch.Id);
            }
        }

        /// <summary>
        /// Propagate time entry additions to parent Sale and Offer activities
        /// </summary>
        private async Task PropagateTimeEntryToSaleAsync(Dispatch dispatch, TimeEntry timeEntry, string userId)
        {
            try
            {
                if (!dispatch.ServiceOrderId.HasValue) return;

                var serviceOrder = await _db.ServiceOrders.FindAsync(dispatch.ServiceOrderId);
                if (serviceOrder == null || string.IsNullOrEmpty(serviceOrder.SaleId)) return;

                if (!int.TryParse(serviceOrder.SaleId, out int saleId)) return;

                var sale = await _db.Sales.FindAsync(saleId);
                if (sale == null) return;

                var durationHours = (timeEntry.Duration ?? 0) / 60m;
                var description = $"Time entry added: {timeEntry.WorkType} ({durationHours:F1}h) on Dispatch #{dispatch.DispatchNumber}";

                var saleActivity = new MyApi.Modules.Sales.Models.SaleActivity
                {
                    SaleId = saleId,
                    Type = "time_entry_added",
                    Description = description,
                    CreatedAt = DateTime.UtcNow,
                    CreatedByName = sale.AssignedToName ?? "System"
                };
                _db.SaleActivities.Add(saleActivity);

                // Propagate to Offer if sale came from an offer
                if (!string.IsNullOrEmpty(sale.OfferId) && int.TryParse(sale.OfferId, out int offerId))
                {
                    var offerActivity = new MyApi.Modules.Offers.Models.OfferActivity
                    {
                        OfferId = offerId,
                        Type = "time_entry_added",
                        Description = $"{description} (Sale #{saleId})",
                        CreatedAt = DateTime.UtcNow,
                        CreatedByName = sale.AssignedToName ?? "System"
                    };
                    _db.OfferActivities.Add(offerActivity);
                }

                await _db.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to propagate time entry to sale activities for dispatch {DispatchId}", dispatch.Id);
            }
        }

        /// <summary>
        /// Propagate expense additions to parent Sale and Offer activities
        /// </summary>
        private async Task PropagateExpenseToSaleAsync(Dispatch dispatch, Expense expense, string userId)
        {
            try
            {
                if (!dispatch.ServiceOrderId.HasValue) return;

                var serviceOrder = await _db.ServiceOrders.FindAsync(dispatch.ServiceOrderId);
                if (serviceOrder == null || string.IsNullOrEmpty(serviceOrder.SaleId)) return;

                if (!int.TryParse(serviceOrder.SaleId, out int saleId)) return;

                var sale = await _db.Sales.FindAsync(saleId);
                if (sale == null) return;

                var description = $"Expense added: {expense.ExpenseType} ({expense.Amount:C}) on Dispatch #{dispatch.DispatchNumber}";

                var saleActivity = new MyApi.Modules.Sales.Models.SaleActivity
                {
                    SaleId = saleId,
                    Type = "expense_added",
                    Description = description,
                    CreatedAt = DateTime.UtcNow,
                    CreatedByName = sale.AssignedToName ?? "System"
                };
                _db.SaleActivities.Add(saleActivity);

                // Propagate to Offer if sale came from an offer
                if (!string.IsNullOrEmpty(sale.OfferId) && int.TryParse(sale.OfferId, out int offerId))
                {
                    var offerActivity = new MyApi.Modules.Offers.Models.OfferActivity
                    {
                        OfferId = offerId,
                        Type = "expense_added",
                        Description = $"{description} (Sale #{saleId})",
                        CreatedAt = DateTime.UtcNow,
                        CreatedByName = sale.AssignedToName ?? "System"
                    };
                    _db.OfferActivities.Add(offerActivity);
                }

                await _db.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to propagate expense to sale activities for dispatch {DispatchId}", dispatch.Id);
            }
        }

        /// <summary>
        /// Propagate material usage to parent Sale and Offer activities
        /// </summary>
        private async Task PropagateMaterialToSaleAsync(Dispatch dispatch, MaterialUsage material, string userId)
        {
            try
            {
                if (!dispatch.ServiceOrderId.HasValue) return;

                var serviceOrder = await _db.ServiceOrders.FindAsync(dispatch.ServiceOrderId);
                if (serviceOrder == null || string.IsNullOrEmpty(serviceOrder.SaleId)) return;

                if (!int.TryParse(serviceOrder.SaleId, out int saleId)) return;

                var sale = await _db.Sales.FindAsync(saleId);
                if (sale == null) return;

                var description = $"Material used: {material.Description} (Qty: {material.Quantity}, Total: {material.TotalPrice:C}) on Dispatch #{dispatch.DispatchNumber}";

                var saleActivity = new MyApi.Modules.Sales.Models.SaleActivity
                {
                    SaleId = saleId,
                    Type = "material_used",
                    Description = description,
                    CreatedAt = DateTime.UtcNow,
                    CreatedByName = sale.AssignedToName ?? "System"
                };
                _db.SaleActivities.Add(saleActivity);

                // Propagate to Offer if sale came from an offer
                if (!string.IsNullOrEmpty(sale.OfferId) && int.TryParse(sale.OfferId, out int offerId))
                {
                    var offerActivity = new MyApi.Modules.Offers.Models.OfferActivity
                    {
                        OfferId = offerId,
                        Type = "material_used",
                        Description = $"{description} (Sale #{saleId})",
                        CreatedAt = DateTime.UtcNow,
                        CreatedByName = sale.AssignedToName ?? "System"
                    };
                    _db.OfferActivities.Add(offerActivity);
                }

                await _db.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to propagate material usage to sale activities for dispatch {DispatchId}", dispatch.Id);
            }
        }

        /// <summary>
        /// Cross-service idempotency probe used by <see cref="AddMaterialUsageAsync"/>.
        /// Returns true when the parent Sale of the dispatch (resolved via
        /// Dispatch → ServiceOrder → Sale) has already recorded a
        /// <c>sale_deduction</c> stock transaction for the given article. In that
        /// case the physical goods have already been taken out of inventory and
        /// the dispatch-side deduction must be skipped to avoid double-counting.
        /// </summary>
        private async Task<bool> IsArticleAlreadyDeductedForParentSaleAsync(Dispatch dispatch, int articleId)
        {
            try
            {
                if (!dispatch.ServiceOrderId.HasValue) return false;
                var serviceOrder = await _db.ServiceOrders.FindAsync(dispatch.ServiceOrderId);
                if (serviceOrder == null || string.IsNullOrEmpty(serviceOrder.SaleId)) return false;

                var saleRefId = serviceOrder.SaleId;
                return await _db.StockTransactions.AnyAsync(t =>
                    t.ArticleId == articleId
                    && t.TransactionType == "sale_deduction"
                    && t.ReferenceType == "sale"
                    && t.ReferenceId == saleRefId);
            }
            catch (Exception ex)
            {
                // Fail open: if we cannot determine sale coverage, allow the
                // dispatch deduction so stock isn't silently skipped. The DB-level
                // partial unique index remains as last-line defence.
                _logger.LogWarning(ex, "Failed to resolve parent sale for dispatch {DispatchId} while checking stock idempotency", dispatch.Id);
                return false;
            }
        }

        public async Task<DispatchDto> StartDispatchAsync(int dispatchId, StartDispatchDto dto, string userId)
        {
            var d = await _db.Dispatches.FirstOrDefaultAsync(x => x.Id == dispatchId && !x.IsDeleted);
            if (d == null) throw new KeyNotFoundException($"Dispatch {dispatchId} not found");

            var oldStatus = d.Status;
            d.Status = "in_progress";
            d.ActualStartTime = dto.ActualStartTime;
            d.ModifiedDate = DateTime.UtcNow;
            d.ModifiedBy = userId;
            await _db.SaveChangesAsync();

            // Trigger workflow automation for status change to in_progress
            if (oldStatus != "in_progress" && _workflowTriggerService != null)
            {
                try
                {
                    await _workflowTriggerService.TriggerStatusChangeAsync(
                        "dispatch",
                        dispatchId,
                        oldStatus ?? "",
                        "in_progress",
                        userId,
                        new { dispatchId, dispatchNumber = d.DispatchNumber, jobId = d.JobId }
                    );
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to trigger workflow for dispatch {DispatchId} start", dispatchId);
                }
            }

            var nameMap = await GetTechnicianNameMapForDispatchAsync(d.Id);
            return DispatchMapping.ToDto(d, nameMap);
        }

        public async Task<DispatchDto> CompleteDispatchAsync(int dispatchId, CompleteDispatchDto dto, string userId)
        {
            var d = await _db.Dispatches.FirstOrDefaultAsync(x => x.Id == dispatchId && !x.IsDeleted);
            if (d == null) throw new KeyNotFoundException($"Dispatch {dispatchId} not found");

            var oldStatus = d.Status;
            d.Status = "completed";
            d.ActualEndTime = dto.ActualEndTime;
            d.CompletionPercentage = dto.CompletionPercentage;
            d.ModifiedDate = DateTime.UtcNow;
            d.ModifiedBy = userId;
            await _db.SaveChangesAsync();

            // Trigger workflow automation for completion
            // Track workflow trigger result (used for logging)
            if (oldStatus != "completed" && _workflowTriggerService != null)
            {
                try
                {
                    await _workflowTriggerService.TriggerStatusChangeAsync(
                        "dispatch",
                        dispatchId,
                        oldStatus ?? "",
                        "completed",
                        userId,
                        new { dispatchId, dispatchNumber = d.DispatchNumber, jobId = d.JobId }
                    );
                    _logger.LogInformation("Workflow triggered for dispatch {DispatchId} completion", dispatchId);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to trigger workflow for dispatch {DispatchId} completion", dispatchId);
                }
            }

            // NOTE: Service order status updates are now handled entirely by the Workflow Engine
            // No hardcoded fallback - status transitions must be configured via workflow triggers

            var nameMap = await GetTechnicianNameMapForDispatchAsync(d.Id);
            return DispatchMapping.ToDto(d, nameMap);
        }

        public async Task DeleteAsync(int dispatchId, string userId)
        {
            var dispatch = await _db.Dispatches
                .Include(d => d.AssignedTechnicians)
                .Include(d => d.TimeEntries)
                .Include(d => d.Expenses)
                .Include(d => d.MaterialsUsed)
                .Include(d => d.Attachments)
                .Include(d => d.Notes)
                .Include(d => d.DispatchJobs)
                .FirstOrDefaultAsync(x => x.Id == dispatchId);

            if (dispatch == null) return;

            // Capture references before deletion
            var jobIdStr = dispatch.JobId;
            var serviceOrderId = dispatch.ServiceOrderId;

            // Collect ALL linked job IDs (from DispatchJobs join table + legacy JobId)
            var allJobIds = new HashSet<int>();
            if (dispatch.DispatchJobs != null && dispatch.DispatchJobs.Any())
            {
                foreach (var dj in dispatch.DispatchJobs)
                    allJobIds.Add(dj.JobId);
            }
            if (!string.IsNullOrEmpty(jobIdStr) && int.TryParse(jobIdStr, out int legacyJobId))
            {
                allJobIds.Add(legacyJobId);
            }

            // Soft delete all child records first
            if (dispatch.DispatchJobs != null && dispatch.DispatchJobs.Any())
            {
                foreach (var dj in dispatch.DispatchJobs) dj.IsDeleted = true;
            }
            if (dispatch.AssignedTechnicians.Any())
            {
                foreach (var dt in dispatch.AssignedTechnicians) dt.IsDeleted = true;
            }

            // Soft delete the dispatch itself
            dispatch.IsDeleted = true;
            dispatch.DeletedAt = DateTime.UtcNow;
            dispatch.DeletedBy = userId;
            
            await _db.SaveChangesAsync();

            _logger.LogInformation(
                "[DISPATCH-DELETE] Soft deleted dispatch {DispatchId} (JobId: {JobId}, SO: {ServiceOrderId}, LinkedJobs: {JobCount}) by user {UserId}",
                dispatchId, jobIdStr, serviceOrderId, allJobIds.Count, userId);

            // Reset ALL associated jobs back to 'unscheduled'
            if (allJobIds.Any())
            {
                var jobs = await _db.ServiceOrderJobs
                    .Where(j => allJobIds.Contains(j.Id))
                    .ToListAsync();

                foreach (var job in jobs)
                {
                    job.Status = "unscheduled";
                    job.CompletionPercentage = 0;
                    job.ActualDuration = null;
                    job.ActualCost = 0;
                    job.CompletedDate = null;
                    job.UpdatedAt = DateTime.UtcNow;
                }
                await _db.SaveChangesAsync();

                _logger.LogInformation(
                    "[DISPATCH-DELETE] Reset {JobCount} jobs to 'unscheduled' after dispatch deletion: {JobIds}",
                    jobs.Count, string.Join(", ", allJobIds));
            }

            // Recalculate the Service Order status based on remaining dispatches
            if (serviceOrderId.HasValue)
            {
                await RecalculateServiceOrderStatusAsync(serviceOrderId.Value, userId);
            }
        }

        /// <summary>
        /// Recalculate the parent Service Order status based on remaining active dispatches.
        /// - No dispatches left → 'ready_for_planning'
        /// - All completed → 'technically_completed'
        /// - Any in_progress → 'in_progress'
        /// - Otherwise → 'scheduled'
        /// </summary>
        private async Task RecalculateServiceOrderStatusAsync(int serviceOrderId, string userId)
        {
            var serviceOrder = await _db.ServiceOrders.FindAsync(serviceOrderId);
            if (serviceOrder == null) return;

            // Don't recalculate if SO is in a final state
            var finalStatuses = new[] { "closed", "invoiced", "cancelled", "completed" };
            if (finalStatuses.Contains(serviceOrder.Status))
            {
                _logger.LogInformation(
                    "[DISPATCH-DELETE] SO {ServiceOrderId} is in final status '{Status}', skipping recalculation",
                    serviceOrderId, serviceOrder.Status);
                return;
            }

            // Get remaining active (non-deleted) dispatches for this SO
            var remainingDispatches = await _db.Dispatches
                .Where(d => d.ServiceOrderId == serviceOrderId && !d.IsDeleted)
                .ToListAsync();

            var oldStatus = serviceOrder.Status;
            string newStatus;

            if (remainingDispatches.Count == 0)
            {
                // No dispatches left → back to ready for planning
                newStatus = "ready_for_planning";
            }
            else
            {
                var allCompleted = remainingDispatches.All(d => d.Status == "completed" || d.Status == "technically_completed");
                var anyInProgress = remainingDispatches.Any(d => d.Status == "in_progress");
                var someCompleted = remainingDispatches.Any(d => d.Status == "completed" || d.Status == "technically_completed");

                if (allCompleted)
                {
                    newStatus = "technically_completed";
                }
                else if (anyInProgress)
                {
                    newStatus = "in_progress";
                }
                else if (someCompleted)
                {
                    // Some completed, some not → partially in progress
                    newStatus = "in_progress";
                }
                else
                {
                    // All dispatches are pending/assigned/scheduled
                    newStatus = "scheduled";
                }
            }

            if (oldStatus != newStatus)
            {
                serviceOrder.Status = newStatus;
                serviceOrder.ModifiedDate = DateTime.UtcNow;
                serviceOrder.ModifiedBy = userId;

                // Update CompletedDispatchCount
                serviceOrder.CompletedDispatchCount = remainingDispatches
                    .Count(d => d.Status == "completed" || d.Status == "technically_completed");

                await _db.SaveChangesAsync();

                _logger.LogInformation(
                    "[DISPATCH-DELETE] SO {ServiceOrderId} status recalculated: '{OldStatus}' → '{NewStatus}' (remaining dispatches: {Count})",
                    serviceOrderId, oldStatus, newStatus, remainingDispatches.Count);

                // Trigger workflow for SO status change
                if (_workflowTriggerService != null)
                {
                    try
                    {
                        await _workflowTriggerService.TriggerStatusChangeAsync(
                            "service_order",
                            serviceOrderId,
                            oldStatus,
                            newStatus,
                            userId,
                            new { serviceOrderId, orderNumber = serviceOrder.OrderNumber }
                        );
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex,
                            "[DISPATCH-DELETE] Failed to trigger workflow for SO {ServiceOrderId} status change",
                            serviceOrderId);
                    }
                }
            }
        }

        // Ensure a job id (when provided) actually belongs to this dispatch so per-job
        // attribution of time/expenses/materials can't point at an unrelated job.
        private async Task ValidateJobBelongsToDispatchAsync(int dispatchId, int? serviceOrderJobId)
        {
            if (serviceOrderJobId is null) return;

            var belongs = await _db.Set<DispatchJob>()
                .AnyAsync(dj => dj.DispatchId == dispatchId && dj.JobId == serviceOrderJobId.Value && !dj.IsDeleted);
            if (belongs) return;

            // Legacy single-job dispatches store the job id on Dispatch.JobId (CSV-capable).
            var legacy = await _db.Dispatches
                .Where(x => x.Id == dispatchId)
                .Select(x => x.JobId)
                .FirstOrDefaultAsync();
            var legacyMatch = !string.IsNullOrWhiteSpace(legacy)
                && legacy.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                         .Any(p => int.TryParse(p, out var jid) && jid == serviceOrderJobId.Value);
            if (!legacyMatch)
                throw new InvalidOperationException($"Job {serviceOrderJobId} does not belong to dispatch {dispatchId}.");
        }

        public async Task<TimeEntryDto> AddTimeEntryAsync(int dispatchId, CreateTimeEntryDto dto, string userId)
        {
            var d = await _db.Dispatches.FirstOrDefaultAsync(x => x.Id == dispatchId && !x.IsDeleted);
            if (d == null) throw new KeyNotFoundException($"Dispatch {dispatchId} not found");
            await ValidateJobBelongsToDispatchAsync(dispatchId, dto.ServiceOrderJobId);

            var newMinutes = (decimal)(dto.EndTime - dto.StartTime).TotalMinutes;
            if (newMinutes < 0) newMinutes = 0;

            // Denormalize InstallationId so per-installation roll-ups don't need to
            // traverse Dispatch -> Job. Prefer the dispatch's installation (installation-
            // scoped dispatch); fall back to the specific job's installation.
            int? resolvedInstallationId = d.InstallationId;
            if (resolvedInstallationId == null && dto.ServiceOrderJobId.HasValue)
            {
                resolvedInstallationId = await _db.ServiceOrderJobs
                    .Where(j => j.Id == dto.ServiceOrderJobId.Value)
                    .Select(j => j.InstallationId)
                    .FirstOrDefaultAsync();
            }

            TimeEntry te = null!;
            // Serializable tx closes the TOCTOU window between the overrun read and the insert.
            // Wrap in execution strategy to be compatible with EnableRetryOnFailure.
            var strategy = _db.Database.CreateExecutionStrategy();
            await strategy.ExecuteAsync(async () =>
            {
                using (var tx = await _db.Database.BeginTransactionAsync(System.Data.IsolationLevel.Serializable))
                {
                    var (plannedMin, actualMin) = await GetPlannedAndActualMinutesAsync(dispatchId, dto.ServiceOrderJobId);
                    bool willOverrun = plannedMin > 0 && (actualMin + newMinutes) > plannedMin;
                    if (willOverrun && string.IsNullOrWhiteSpace(dto.OverrunReason))
                    {
                        throw new InvalidOperationException(
                            $"Logging {newMinutes} min would exceed planned budget ({actualMin}/{plannedMin} min already logged). " +
                            "Provide 'overrunReason' to confirm.");
                    }

                    te = new TimeEntry
                    {
                        DispatchId = dispatchId,
                        ServiceOrderJobId = dto.ServiceOrderJobId,
                        InstallationId = resolvedInstallationId,
                        TechnicianId = int.TryParse(dto.TechnicianId, out var tid) ? tid : 0,
                        WorkType = dto.WorkType,
                        StartTime = dto.StartTime,
                        EndTime = dto.EndTime,
                        Duration = newMinutes,
                        Description = dto.Description,
                        CreatedDate = DateTime.UtcNow,
                        OverrunFlag = willOverrun,
                        OverrunReason = willOverrun ? dto.OverrunReason : null,
                    };
                    _db.TimeEntries.Add(te);
                    await _db.SaveChangesAsync();
                    await tx.CommitAsync();
                }
            });

            // Auto-rollup the parent ServiceOrderJob (ActualHours / ActualDuration / ActualCost / CompletionPercentage).
            await RecalculateServiceOrderJobRollupAsync(dto.ServiceOrderJobId);

            // Propagate time entry to parent Sale/Offer activities
            await PropagateTimeEntryToSaleAsync(d, te, userId);

            return new TimeEntryDto 
            { 
                Id = te.Id,
                DispatchId = te.DispatchId,
                ServiceOrderJobId = te.ServiceOrderJobId,
                TechnicianId = te.TechnicianId.ToString(),
                WorkType = te.WorkType, 
                StartTime = te.StartTime,
                EndTime = te.EndTime,
                Duration = (int)(te.Duration ?? 0), 
                Description = te.Description,
                CreatedAt = te.CreatedDate,
                OverrunFlag = te.OverrunFlag,
                OverrunReason = te.OverrunReason,
            };
        }

        /// <summary>
        /// Recompute ServiceOrderJob.ActualHours / ActualDuration / ActualCost /
        /// CompletionPercentage from live TimeEntries + Expenses + Materials whose parent
        /// Dispatch is NOT soft-deleted. Called after every add/delete of a child record so
        /// plan-vs-actual UI stays truthful without a background job.
        /// </summary>
        private async Task RecalculateServiceOrderJobRollupAsync(int? serviceOrderJobId)
        {
            if (!serviceOrderJobId.HasValue) return;
            var jobId = serviceOrderJobId.Value;
            var job = await _db.ServiceOrderJobs.FirstOrDefaultAsync(j => j.Id == jobId);
            if (job == null) return;

            var totalMinutes = await (from te in _db.TimeEntries
                                      join dp in _db.Dispatches on te.DispatchId equals dp.Id
                                      where te.ServiceOrderJobId == jobId && !dp.IsDeleted
                                      select (te.Duration ?? 0m)).SumAsync();

            var totalExp = await (from e in _db.DispatchExpenses
                                  join dp in _db.Dispatches on e.DispatchId equals dp.Id
                                  where e.ServiceOrderJobId == jobId && !dp.IsDeleted
                                  select e.Amount).SumAsync();

            var totalMat = await (from m in _db.DispatchMaterials
                                  join dp in _db.Dispatches on m.DispatchId equals dp.Id
                                  where m.ServiceOrderJobId == jobId && !dp.IsDeleted
                                  select m.TotalPrice).SumAsync();

            job.ActualHours = Math.Round(totalMinutes / 60m, 2);
            job.ActualDuration = (int)totalMinutes;
            job.ActualCost = totalExp + totalMat;

            // CompletionPercentage: derive from planned minutes when known, cap at 100.
            // Don't override a manual 100% completion set through the status flow.
            if (job.EstimatedDuration.HasValue && job.EstimatedDuration.Value > 0 && job.Status != "completed")
            {
                var pct = (int)Math.Min(100m, Math.Round((totalMinutes / job.EstimatedDuration.Value) * 100m));
                job.CompletionPercentage = pct;
            }
            job.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
        }

        /// <summary>
        /// Planned vs already-logged actual minutes for the soft-cap overrun check.
        /// When <paramref name="serviceOrderJobId"/> is supplied (multi-job dispatch),
        /// the budget and actuals are scoped to THAT job, so each job is capped against
        /// its own plan. Otherwise the whole dispatch (all its jobs) is summed.
        /// </summary>
        private async Task<(decimal plannedMinutes, decimal actualMinutes)> GetPlannedAndActualMinutesAsync(int dispatchId, int? serviceOrderJobId = null)
        {
            List<int> jobIds;
            if (serviceOrderJobId.HasValue)
            {
                jobIds = new List<int> { serviceOrderJobId.Value };
            }
            else
            {
                jobIds = await _db.Set<DispatchJob>()
                    .Where(dj => dj.DispatchId == dispatchId && !dj.IsDeleted)
                    .Select(dj => dj.JobId)
                    .Distinct()
                    .ToListAsync();

                // G5 fallback: legacy dispatches have no DispatchJob rows — parse Dispatch.JobId (CSV-capable string).
                if (jobIds.Count == 0)
                {
                    var legacy = await _db.Dispatches
                        .Where(x => x.Id == dispatchId)
                        .Select(x => x.JobId)
                        .FirstOrDefaultAsync();
                    if (!string.IsNullOrWhiteSpace(legacy))
                    {
                        foreach (var part in legacy.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
                            if (int.TryParse(part, out var jid)) jobIds.Add(jid);
                    }
                    if (jobIds.Count == 0) return (0, 0);
                }
            }

            var planned = await _db.Set<MyApi.Modules.Planning.Models.PlannedLineEntry>()
                .Where(p => p.ParentType == "service_order_job" && jobIds.Contains(p.ParentId) && p.Kind == "time")
                .Select(p => new { p.PlannedMinutes, p.TechnicianCount })
                .ToListAsync();
            decimal plannedTotal = planned.Sum(p => (decimal)((p.PlannedMinutes ?? 0) * (p.TechnicianCount ?? 1)));

            decimal actualTotal = await _db.TimeEntries
                .Where(t => t.DispatchId == dispatchId && t.Duration != null
                    && (serviceOrderJobId == null || t.ServiceOrderJobId == serviceOrderJobId))
                .SumAsync(t => (decimal?)t.Duration ?? 0m);
            return (plannedTotal, actualTotal);
        }

        /// <summary>
        /// Planned vs actual amount for an expense type, for the soft-cap overrun check.
        /// When <paramref name="serviceOrderJobId"/> is supplied (multi-job dispatch) the
        /// budget and actuals are scoped to THAT job; otherwise the whole dispatch is summed.
        /// </summary>
        private async Task<(decimal plannedAmount, decimal actualAmount)> GetPlannedAndActualExpenseAsync(int dispatchId, string expenseType, int? serviceOrderJobId = null)
        {
            List<int> jobIds;
            if (serviceOrderJobId.HasValue)
            {
                jobIds = new List<int> { serviceOrderJobId.Value };
            }
            else
            {
                jobIds = await _db.Set<DispatchJob>()
                    .Where(dj => dj.DispatchId == dispatchId && !dj.IsDeleted)
                    .Select(dj => dj.JobId)
                    .Distinct()
                    .ToListAsync();
                if (jobIds.Count == 0) return (0, 0);
            }

            var et = (expenseType ?? "").ToLower();
            decimal plannedTotal = await _db.Set<MyApi.Modules.Planning.Models.PlannedLineEntry>()
                .Where(p => p.ParentType == "service_order_job"
                    && jobIds.Contains(p.ParentId)
                    && p.Kind == "expense"
                    && p.ExpenseType != null
                    && p.ExpenseType.ToLower() == et)
                .SumAsync(p => (decimal?)p.PlannedAmount ?? 0m);

            decimal actualTotal = await _db.DispatchExpenses
                .Where(e => e.DispatchId == dispatchId && e.ExpenseType.ToLower() == et
                    && (serviceOrderJobId == null || e.ServiceOrderJobId == serviceOrderJobId))
                .SumAsync(e => (decimal?)e.Amount ?? 0m);
            return (plannedTotal, actualTotal);
        }

        public async Task<IEnumerable<TimeEntryDto>> GetTimeEntriesAsync(int dispatchId)
        {
            var items = await _db.TimeEntries.AsNoTracking().Where(t => t.DispatchId == dispatchId).ToListAsync();
            return items.Select(t => new TimeEntryDto 
            { 
                Id = t.Id,
                DispatchId = t.DispatchId,
                ServiceOrderJobId = t.ServiceOrderJobId,
                TechnicianId = t.TechnicianId.ToString(),
                WorkType = t.WorkType, 
                StartTime = t.StartTime,
                EndTime = t.EndTime,
                Duration = (int)(t.Duration ?? 0), 
                Description = t.Description,
                CreatedAt = t.CreatedDate,
                OverrunFlag = t.OverrunFlag,
                OverrunReason = t.OverrunReason,
            }).ToList();
        }

        public async Task ApproveTimeEntryAsync(int dispatchId, int timeEntryId, ApproveTimeEntryDto dto, string userId)
        {
            var te = await _db.TimeEntries.FirstOrDefaultAsync(t => t.Id == timeEntryId && t.DispatchId == dispatchId);
            if (te == null) throw new KeyNotFoundException("Time entry not found");
            // Status column doesn't exist in database - approval is tracked elsewhere or not needed
            await _db.SaveChangesAsync();
        }

        public async Task<TimeEntryDto> UpdateTimeEntryAsync(int dispatchId, int timeEntryId, UpdateTimeEntryDto dto, string userId)
        {
            var te = await _db.TimeEntries.FirstOrDefaultAsync(t => t.Id == timeEntryId && t.DispatchId == dispatchId);
            if (te == null) throw new KeyNotFoundException("Time entry not found");

            if (dto.WorkType != null) te.WorkType = dto.WorkType;
            if (dto.StartTime.HasValue) te.StartTime = dto.StartTime.Value;
            if (dto.EndTime.HasValue) te.EndTime = dto.EndTime.Value;
            if (dto.Description != null) te.Description = dto.Description;
            
            // Recalculate duration if times changed
            if (te.EndTime.HasValue)
            {
                te.Duration = (decimal)(te.EndTime.Value - te.StartTime).TotalMinutes;
            }

            await _db.SaveChangesAsync();

            return new TimeEntryDto 
            { 
                Id = te.Id,
                DispatchId = te.DispatchId,
                ServiceOrderJobId = te.ServiceOrderJobId,
                TechnicianId = te.TechnicianId.ToString(),
                WorkType = te.WorkType, 
                StartTime = te.StartTime,
                EndTime = te.EndTime,
                Duration = (int)(te.Duration ?? 0), 
                Description = te.Description,
                CreatedAt = te.CreatedDate 
            };
        }

        public async Task DeleteTimeEntryAsync(int dispatchId, int timeEntryId, string userId)
        {
            var te = await _db.TimeEntries.FirstOrDefaultAsync(t => t.Id == timeEntryId && t.DispatchId == dispatchId);
            if (te == null) throw new KeyNotFoundException("Time entry not found");

            var jobIdForRollup = te.ServiceOrderJobId;
            _db.TimeEntries.Remove(te);
            await _db.SaveChangesAsync();

            await RecalculateServiceOrderJobRollupAsync(jobIdForRollup);
        }

        public async Task<ExpenseDto> AddExpenseAsync(int dispatchId, CreateExpenseDto dto, string userId)
        {
            var d = await _db.Dispatches.FirstOrDefaultAsync(x => x.Id == dispatchId && !x.IsDeleted);
            if (d == null) throw new KeyNotFoundException($"Dispatch {dispatchId} not found");
            await ValidateJobBelongsToDispatchAsync(dispatchId, dto.ServiceOrderJobId);

            int? expInstallationId = d.InstallationId;
            if (expInstallationId == null && dto.ServiceOrderJobId.HasValue)
            {
                expInstallationId = await _db.ServiceOrderJobs
                    .Where(j => j.Id == dto.ServiceOrderJobId.Value)
                    .Select(j => j.InstallationId)
                    .FirstOrDefaultAsync();
            }

            Expense exp = null!;
            // Wrap in execution strategy to be compatible with EnableRetryOnFailure.
            var expStrategy = _db.Database.CreateExecutionStrategy();
            await expStrategy.ExecuteAsync(async () =>
            {
                using (var tx = await _db.Database.BeginTransactionAsync(System.Data.IsolationLevel.Serializable))
                {
                    var (plannedAmt, actualAmt) = await GetPlannedAndActualExpenseAsync(dispatchId, dto.Type, dto.ServiceOrderJobId);
                    bool willOverrun = plannedAmt > 0 && (actualAmt + dto.Amount) > plannedAmt;
                    if (willOverrun && string.IsNullOrWhiteSpace(dto.OverrunReason))
                    {
                        throw new InvalidOperationException(
                            $"Expense of {dto.Amount} would exceed planned '{dto.Type}' budget ({actualAmt}/{plannedAmt}). " +
                            "Provide 'overrunReason' to confirm.");
                    }

                    exp = new Expense
                    {
                        DispatchId = dispatchId,
                        ServiceOrderJobId = dto.ServiceOrderJobId,
                        InstallationId = expInstallationId,
                        ExpenseType = dto.Type,
                        TechnicianId = dto.TechnicianId,
                        Amount = dto.Amount,
                        // Persist the declared currency so downstream invoice validation
                        // can reject cross-currency lines. Falls back to null (interpreted
                        // as the sale's currency) when the caller omits it.
                        Currency = string.IsNullOrWhiteSpace(dto.Currency) ? null : dto.Currency.Trim().ToUpperInvariant(),
                        Description = dto.Description,
                        ExpenseDate = dto.Date ?? DateTime.UtcNow,
                        RecordedBy = userId,
                        CreatedDate = DateTime.UtcNow,
                        OverrunFlag = willOverrun,
                        OverrunReason = willOverrun ? dto.OverrunReason : null,
                    };
                    _db.DispatchExpenses.Add(exp);
                    await _db.SaveChangesAsync();
                    await tx.CommitAsync();
                }
            });

            await RecalculateServiceOrderJobRollupAsync(dto.ServiceOrderJobId);

            // Propagate expense to parent Sale/Offer activities
            await PropagateExpenseToSaleAsync(d, exp, userId);

            return new ExpenseDto 
            { 
                Id = exp.Id, 
                DispatchId = exp.DispatchId,
                ServiceOrderJobId = exp.ServiceOrderJobId,
                TechnicianId = exp.TechnicianId ?? dto.TechnicianId ?? userId,
                Type = exp.ExpenseType, 
                Amount = exp.Amount,
                // Round-trip the persisted currency so the client sees exactly what was stored.
                Currency = exp.Currency,
                Description = exp.Description,
                Date = exp.ExpenseDate,
                Status = "pending", 
                CreatedAt = exp.CreatedDate,
                OverrunFlag = exp.OverrunFlag,
                OverrunReason = exp.OverrunReason,
            };
        }

        public async Task<IEnumerable<ExpenseDto>> GetExpensesAsync(int dispatchId)
        {
            var items = await _db.DispatchExpenses.AsNoTracking().Where(e => e.DispatchId == dispatchId).ToListAsync();
            return items.Select(e => new ExpenseDto 
            { 
                Id = e.Id, 
                DispatchId = e.DispatchId,
                ServiceOrderJobId = e.ServiceOrderJobId,
                TechnicianId = e.TechnicianId ?? e.RecordedBy,
                Type = e.ExpenseType, 
                Amount = e.Amount,
                Currency = e.Currency,
                Description = e.Description,
                Date = e.ExpenseDate,
                Status = "pending", 
                CreatedAt = e.CreatedDate,
                OverrunFlag = e.OverrunFlag,
                OverrunReason = e.OverrunReason,
            }).ToList();
        }

        public async Task ApproveExpenseAsync(int dispatchId, int expenseId, ApproveExpenseDto dto, string userId)
        {
            var exp = await _db.DispatchExpenses.FirstOrDefaultAsync(e => e.Id == expenseId && e.DispatchId == dispatchId);
            if (exp == null) throw new KeyNotFoundException("Expense not found");
            await _db.SaveChangesAsync();
        }

        public async Task<ExpenseDto> UpdateExpenseAsync(int dispatchId, int expenseId, UpdateExpenseDto dto, string userId)
        {
            var exp = await _db.DispatchExpenses.FirstOrDefaultAsync(e => e.Id == expenseId && e.DispatchId == dispatchId);
            if (exp == null) throw new KeyNotFoundException("Expense not found");

            if (dto.Type != null) exp.ExpenseType = dto.Type;
            if (dto.TechnicianId != null) exp.TechnicianId = dto.TechnicianId;
            if (dto.Amount.HasValue) exp.Amount = dto.Amount.Value;
            if (dto.Description != null) exp.Description = dto.Description;
            if (dto.Date.HasValue) exp.ExpenseDate = dto.Date.Value;
            if (!string.IsNullOrWhiteSpace(dto.Currency))
                exp.Currency = dto.Currency.Trim().ToUpperInvariant();

            await _db.SaveChangesAsync();

            return new ExpenseDto 
            { 
                Id = exp.Id,
                DispatchId = exp.DispatchId,
                ServiceOrderJobId = exp.ServiceOrderJobId,
                TechnicianId = exp.RecordedBy,
                Type = exp.ExpenseType, 
                Amount = exp.Amount,
                Currency = exp.Currency,
                Description = exp.Description,
                Date = exp.ExpenseDate,
                Status = "pending", 
                CreatedAt = exp.CreatedDate 
            };
        }

        public async Task DeleteExpenseAsync(int dispatchId, int expenseId, string userId)
        {
            var exp = await _db.DispatchExpenses.FirstOrDefaultAsync(e => e.Id == expenseId && e.DispatchId == dispatchId);
            if (exp == null) throw new KeyNotFoundException("Expense not found");

            var jobIdForRollup = exp.ServiceOrderJobId;
            _db.DispatchExpenses.Remove(exp);
            await _db.SaveChangesAsync();

            await RecalculateServiceOrderJobRollupAsync(jobIdForRollup);
        }

        public async Task<MaterialDto> AddMaterialUsageAsync(int dispatchId, CreateMaterialUsageDto dto, string userId)
        {
            var d = await _db.Dispatches.FirstOrDefaultAsync(x => x.Id == dispatchId && !x.IsDeleted);
            if (d == null) throw new KeyNotFoundException($"Dispatch {dispatchId} not found");
            await ValidateJobBelongsToDispatchAsync(dispatchId, dto.ServiceOrderJobId);

            // Get a valid article ID if not provided or invalid
            int? articleId = null;
            if (!string.IsNullOrEmpty(dto.ArticleId) && int.TryParse(dto.ArticleId, out var aid))
            {
                var articleExists = await _db.Articles.AnyAsync(a => a.Id == aid);
                if (articleExists)
                    articleId = aid;
            }
            
            // If no valid article, try to find any article
            if (articleId == null)
            {
                var anyArticle = await _db.Articles.FirstOrDefaultAsync();
                articleId = anyArticle?.Id;
            }

            // Determine unit from article or DTO
            var unitValue = dto.Unit ?? "piece";
            if (string.IsNullOrEmpty(dto.Unit) && articleId.HasValue)
            {
                var articleForUnit = await _db.Articles.FirstOrDefaultAsync(a => a.Id == articleId.Value);
                if (articleForUnit != null && !string.IsNullOrEmpty(articleForUnit.Unit))
                    unitValue = articleForUnit.Unit;
            }

            int? matInstallationId = d.InstallationId;
            if (matInstallationId == null && dto.ServiceOrderJobId.HasValue)
            {
                matInstallationId = await _db.ServiceOrderJobs
                    .Where(j => j.Id == dto.ServiceOrderJobId.Value)
                    .Select(j => j.InstallationId)
                    .FirstOrDefaultAsync();
            }

            var lineTotal = dto.Quantity * (dto.UnitPrice ?? 0);
            MaterialUsage mat = null!;
            // Wrap in execution strategy to be compatible with EnableRetryOnFailure.
            var matStrategy = _db.Database.CreateExecutionStrategy();
            await matStrategy.ExecuteAsync(async () =>
            {
                using (var tx = await _db.Database.BeginTransactionAsync(System.Data.IsolationLevel.Serializable))
                {
                    // Soft-cap overrun: mirror TimeEntry/Expense. Compares against planned material
                    // total on the job (Kind="material"). NULL / zero planned = no cap.
                    var (plannedMatAmt, actualMatAmt) = await GetPlannedAndActualMaterialAsync(dispatchId, dto.ServiceOrderJobId);
                    bool willOverrun = plannedMatAmt > 0 && (actualMatAmt + lineTotal) > plannedMatAmt;
                    if (willOverrun && string.IsNullOrWhiteSpace(dto.OverrunReason))
                    {
                        throw new InvalidOperationException(
                            $"Material of {lineTotal:0.##} would exceed planned material budget ({actualMatAmt:0.##}/{plannedMatAmt:0.##}). " +
                            "Provide 'overrunReason' to confirm.");
                    }

                    mat = new MaterialUsage
                    {
                        DispatchId = dispatchId,
                        ServiceOrderJobId = dto.ServiceOrderJobId,
                        InstallationId = matInstallationId,
                        ArticleId = articleId,
                        Quantity = dto.Quantity,
                        Description = dto.Description ?? string.Empty,
                        UnitPrice = dto.UnitPrice ?? 0,
                        TotalPrice = lineTotal,
                        RecordedBy = userId,
                        UsedDate = DateTime.UtcNow,
                        Unit = unitValue,
                        OverrunFlag = willOverrun,
                        OverrunReason = willOverrun ? dto.OverrunReason : null,
                        ApprovalStatus = "pending",
                    };
                    _db.DispatchMaterials.Add(mat);
                    await _db.SaveChangesAsync();
                    await tx.CommitAsync();
                }
            });

            // --- Task 2: deduct stock when the line references a real article ---
            // Free-text materials (no ArticleId) skip inventory. The stock service
            // manages its own transaction (execution strategy) so it must run AFTER
            // the material tx commits. On failure we compensate by deleting the
            // material row so caller sees an atomic error.
            if (articleId.HasValue && dto.Quantity > 0 && _stockTransactionService != null)
            {
                // Cross-service idempotency: if the parent Sale of this dispatch
                // has already deducted stock for this exact article at sale close,
                // do not deduct again here — that would double-count the same
                // physical goods. Sale-level deduction wins because it covers the
                // full sold quantity up front; any additional (unplanned) material
                // on top of the sale would use a different article or a free-text
                // line and therefore fall through to the deduction below.
                bool coveredBySale = await IsArticleAlreadyDeductedForParentSaleAsync(d, articleId.Value);
                if (coveredBySale)
                {
                    _logger.LogInformation(
                        "Skipping dispatch stock deduction for material {MaterialId} article {ArticleId}: already deducted by parent Sale of dispatch {DispatchId}",
                        mat.Id, articleId.Value, dispatchId);
                }
                else
                {
                try
                {
                    await _stockTransactionService.CreateTransactionAsync(new CreateStockTransactionDto
                    {
                        ArticleId = articleId.Value,
                        TransactionType = "remove",
                        Quantity = dto.Quantity,
                        Reason = "Material used on dispatch",
                        ReferenceType = "dispatch_material",
                        ReferenceId = mat.Id.ToString(),
                        ReferenceNumber = d.DispatchNumber,
                        Notes = dto.Description,
                    }, userId);
                }
                catch (Exception ex)
                {
                    // Compensate: remove the material row so the API call is atomic.
                    try
                    {
                        _db.DispatchMaterials.Remove(mat);
                        await _db.SaveChangesAsync();
                    }
                    catch (Exception rollbackEx)
                    {
                        _logger.LogError(rollbackEx, "Failed to compensate MaterialUsage {MaterialId} after stock deduction error", mat.Id);
                    }

                    if (ex is InvalidOperationException iox && ex.Message.Contains("Insufficient stock", StringComparison.OrdinalIgnoreCase))
                    {
                        throw new InvalidOperationException($"dispatches.material.insufficientStock: {ex.Message}", ex);
                    }
                    throw;
                }
                }
            }

            await RecalculateServiceOrderJobRollupAsync(dto.ServiceOrderJobId);

            // Propagate material usage to parent Sale/Offer activities
            await PropagateMaterialToSaleAsync(d, mat, userId);

            // Also record on the Dispatch's own audit stream (SystemLog) so the
            // dispatch drawer's Activity tab shows the material line, matching
            // the requirement that "every action" be logged.
            if (_activityLogger != null)
            {
                await _activityLogger.LogAsync(new MyApi.Modules.Shared.Services.ActivityLogEntry
                {
                    Module = "Dispatches",
                    Action = "material_added",
                    EntityType = "MaterialUsage",
                    EntityId = mat.Id.ToString(),
                    ParentEntityType = null,
                    ParentEntityId = null,
                    UserId = userId,
                    Message = $"Material added to dispatch {d.DispatchNumber}: {mat.Description ?? mat.ArticleId?.ToString()} (qty {mat.Quantity})",
                    Details = System.Text.Json.JsonSerializer.Serialize(new { dispatchId, mat.Id, mat.ArticleId, mat.Quantity, mat.UnitPrice, mat.TotalPrice }),
                });
            }


            return new MaterialDto
            {
                Id = mat.Id,
                DispatchId = mat.DispatchId,
                ServiceOrderJobId = mat.ServiceOrderJobId,
                TechnicianId = dto.UsedBy ?? userId,
                ArticleId = mat.ArticleId?.ToString(),
                Description = mat.Description,
                Quantity = (int)mat.Quantity,
                UnitPrice = mat.UnitPrice,
                TotalPrice = mat.TotalPrice,
                Status = mat.ApprovalStatus,
                CreatedAt = mat.UsedDate,
                Unit = mat.Unit,
                OverrunFlag = mat.OverrunFlag,
                OverrunReason = mat.OverrunReason,
                ApprovalStatus = mat.ApprovalStatus,
                ApprovedBy = mat.ApprovedBy,
                ApprovedAt = mat.ApprovedAt,
                RejectionReason = mat.RejectionReason,
            };
        }

        /// <summary>
        /// Planned vs actual material spend for the soft-cap overrun check. Mirrors
        /// <see cref="GetPlannedAndActualExpenseAsync"/> but for PlannedLineEntry.Kind = "material".
        /// </summary>
        private async Task<(decimal plannedAmount, decimal actualAmount)> GetPlannedAndActualMaterialAsync(int dispatchId, int? serviceOrderJobId = null)
        {
            List<int> jobIds;
            if (serviceOrderJobId.HasValue)
            {
                jobIds = new List<int> { serviceOrderJobId.Value };
            }
            else
            {
                jobIds = await _db.Set<DispatchJob>()
                    .Where(dj => dj.DispatchId == dispatchId && !dj.IsDeleted)
                    .Select(dj => dj.JobId)
                    .Distinct()
                    .ToListAsync();
                if (jobIds.Count == 0) return (0, 0);
            }

            decimal plannedTotal = await _db.Set<MyApi.Modules.Planning.Models.PlannedLineEntry>()
                .Where(p => p.ParentType == "service_order_job"
                    && jobIds.Contains(p.ParentId)
                    && p.Kind == "material")
                .SumAsync(p => (decimal?)p.PlannedAmount ?? 0m);

            decimal actualTotal = await _db.DispatchMaterials
                .Where(m => m.DispatchId == dispatchId
                    && (serviceOrderJobId == null || m.ServiceOrderJobId == serviceOrderJobId))
                .SumAsync(m => (decimal?)m.TotalPrice ?? 0m);
            return (plannedTotal, actualTotal);
        }

        public async Task<IEnumerable<MaterialDto>> GetMaterialsAsync(int dispatchId)
        {
            var items = await _db.DispatchMaterials.Where(m => m.DispatchId == dispatchId).ToListAsync();
            return items.Select(m => new MaterialDto
            {
                Id = m.Id,
                DispatchId = m.DispatchId,
                ServiceOrderJobId = m.ServiceOrderJobId,
                TechnicianId = m.RecordedBy,
                ArticleId = m.ArticleId?.ToString(),
                Description = m.Description,
                Quantity = (int)m.Quantity,
                UnitPrice = m.UnitPrice,
                TotalPrice = m.TotalPrice,
                Status = m.ApprovalStatus,
                CreatedAt = m.UsedDate,
                Unit = m.Unit,
                OverrunFlag = m.OverrunFlag,
                OverrunReason = m.OverrunReason,
                ApprovalStatus = m.ApprovalStatus,
                ApprovedBy = m.ApprovedBy,
                ApprovedAt = m.ApprovedAt,
                RejectionReason = m.RejectionReason,
            }).ToList();
        }

        public async Task ApproveMaterialAsync(int dispatchId, int materialId, ApproveMaterialDto dto, string userId)
        {
            var m = await _db.DispatchMaterials.FirstOrDefaultAsync(x => x.Id == materialId && x.DispatchId == dispatchId);
            if (m == null) throw new KeyNotFoundException("Material not found");

            if (dto.Approved)
            {
                m.ApprovalStatus = "approved";
                m.ApprovedBy = userId;
                m.ApprovedAt = DateTime.UtcNow;
                m.RejectionReason = null;
            }
            else
            {
                if (string.IsNullOrWhiteSpace(dto.RejectionReason))
                    throw new ArgumentException("RejectionReason is required when rejecting a material line");

                m.ApprovalStatus = "rejected";
                m.RejectionReason = dto.RejectionReason?.Trim();
                m.ApprovedBy = null;
                m.ApprovedAt = null;
            }

            await _db.SaveChangesAsync();
            _logger.LogInformation(
                "Material {MaterialId} on Dispatch {DispatchId} set to {Status} by {UserId}",
                materialId, dispatchId, m.ApprovalStatus, userId);

            if (_activityLogger != null)
            {
                await _activityLogger.LogAsync(new MyApi.Modules.Shared.Services.ActivityLogEntry
                {
                    Module = "Dispatches",
                    Action = dto.Approved ? "material_approved" : "material_rejected",
                    EntityType = "MaterialUsage",
                    EntityId = materialId.ToString(),
                    ParentEntityType = null,
                    ParentEntityId = null,
                    UserId = userId,
                    Message = dto.Approved
                        ? $"Material line #{materialId} approved on dispatch {dispatchId}"
                        : $"Material line #{materialId} rejected on dispatch {dispatchId}: {dto.RejectionReason}",
                    Details = dto.RejectionReason,
                });
            }
        }

        public async Task<AttachmentUploadResponseDto> UploadAttachmentAsync(int dispatchId, Microsoft.AspNetCore.Http.IFormFile file, string category, string? description, double? latitude, double? longitude, string userId)
        {
            var d = await _db.Dispatches.FirstOrDefaultAsync(x => x.Id == dispatchId && !x.IsDeleted);
            if (d == null) throw new KeyNotFoundException($"Dispatch {dispatchId} not found");

            var att = new Attachment
            {
                DispatchId = dispatchId,
                FileName = file.FileName,
                FilePath = $"/uploads/{dispatchId}/{file.FileName}",
                FileSize = file.Length,
                ContentType = file.ContentType,
                Category = category,
                UploadedBy = userId,
                UploadedDate = DateTime.UtcNow
            };
            _db.DispatchAttachments.Add(att);
            await _db.SaveChangesAsync();

            if (_activityLogger != null)
            {
                await _activityLogger.LogAsync(new MyApi.Modules.Shared.Services.ActivityLogEntry
                {
                    Module = "Dispatches",
                    Action = "attachment_uploaded",
                    EntityType = "DispatchAttachment",
                    EntityId = att.Id.ToString(),
                    ParentEntityType = null,
                    ParentEntityId = null,
                    UserId = userId,
                    Message = $"Attachment uploaded to dispatch {d.DispatchNumber}: {att.FileName} ({att.FileSize} bytes)",
                    Details = category,
                });
            }

            return new AttachmentUploadResponseDto { Id = att.Id, FileName = att.FileName, Category = att.Category };
        }

        public async Task<NoteDto> AddNoteAsync(int dispatchId, CreateNoteDto dto, string userId)
        {
            _logger.LogInformation("AddNoteAsync called by {UserId} for Dispatch {DispatchId}: {NotePreview}", userId, dispatchId, dto.Content?.Length > 200 ? dto.Content.Substring(0,200) + "..." : dto.Content);
            var d = await _db.Dispatches.FirstOrDefaultAsync(x => x.Id == dispatchId && !x.IsDeleted);
            if (d == null) throw new KeyNotFoundException($"Dispatch {dispatchId} not found");

            var note = new Note
            {
                DispatchId = dispatchId,
                Content = dto.Content ?? string.Empty,
                NoteType = dto.Category ?? "general",
                CreatedBy = userId,
                CreatedDate = DateTime.UtcNow
            };
            _db.DispatchNotes.Add(note);
            await _db.SaveChangesAsync();

            return new NoteDto { Id = note.Id, DispatchId = note.DispatchId, Content = note.Content ?? string.Empty, Category = note.NoteType ?? "general", CreatedBy = note.CreatedBy ?? string.Empty, CreatedAt = note.CreatedDate };
        }

        public async Task<List<NoteDto>> GetNotesAsync(int dispatchId)
        {
            var notes = await _db.DispatchNotes
                .Where(n => n.DispatchId == dispatchId)
                .OrderByDescending(n => n.CreatedDate)
                .ToListAsync();

            return notes.Select(n => new NoteDto
            {
                Id = n.Id,
                DispatchId = n.DispatchId,
                Content = n.Content ?? string.Empty,
                Category = n.NoteType ?? "general",
                CreatedBy = n.CreatedBy ?? string.Empty,
                CreatedAt = n.CreatedDate
            }).ToList();
        }

        public async Task<DispatchStatisticsDto> GetStatisticsAsync(StatisticsQueryParams query)
        {
            var q = _db.Dispatches.Where(d => !d.IsDeleted);
            if (query.DateFrom.HasValue) q = q.Where(d => d.ScheduledDate >= query.DateFrom.Value);
            if (query.DateTo.HasValue) q = q.Where(d => d.ScheduledDate <= query.DateTo.Value);

            var dispatches = await q.ToListAsync();
            return new DispatchStatisticsDto
            {
                TotalDispatches = dispatches.Count,
                CompletedDispatches = dispatches.Count(d => d.Status == "completed"),
                PendingDispatches = dispatches.Count(d => d.Status == "pending"),
                InProgressDispatches = dispatches.Count(d => d.Status == "in_progress"),
                CancelledDispatches = dispatches.Count(d => d.Status == "cancelled"),
                HighPriorityCount = dispatches.Count(d => d.Priority == "high"),
                MediumPriorityCount = dispatches.Count(d => d.Priority == "medium"),
                LowPriorityCount = dispatches.Count(d => d.Priority == "low"),
                ByStatus = dispatches.GroupBy(d => d.Status).ToDictionary(g => g.Key, g => g.Count()),
                ByPriority = dispatches.GroupBy(d => d.Priority).ToDictionary(g => g.Key, g => g.Count()),
                GeneratedAt = DateTime.UtcNow
            };
        }
    }
}

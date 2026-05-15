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

namespace MyApi.Modules.Dispatches.Services
{
    public class DispatchService : IDispatchService
    {
        private readonly ApplicationDbContext _db;
        private readonly ILogger<DispatchService> _logger;
        private readonly IWorkflowTriggerService? _workflowTriggerService;
        private readonly MyApi.Modules.Numbering.Services.INumberingService? _numberingService;

        public DispatchService(
            ApplicationDbContext db, 
            ILogger<DispatchService> logger,
            IWorkflowTriggerService? workflowTriggerService = null,
            MyApi.Modules.Numbering.Services.INumberingService? numberingService = null)
        {
            _db = db;
            _logger = logger;
            _workflowTriggerService = workflowTriggerService;
            _numberingService = numberingService;
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
                dispatchNumber = _numberingService != null ? await _numberingService.GetNextAsync("Dispatch") : $"DISP-{DateTime.UtcNow:yyyyMMddHHmmss}-{Guid.NewGuid().ToString()[..4].ToUpper()}";
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Numbering service failed for Dispatch, using GUID fallback");
                dispatchNumber = $"DISP-{DateTime.UtcNow:yyyyMMddHHmmss}-{Guid.NewGuid().ToString()[..4].ToUpper()}";
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

            _db.Dispatches.Add(dispatch);
            await _db.SaveChangesAsync();
            
            // Add assigned technicians to the DispatchTechnicians table
            if (hasTechnicians)
            {
                foreach (var techIdStr in dto.AssignedTechnicianIds!)
                {
                    if (int.TryParse(techIdStr, out var techId))
                    {
                        var dispatchTechnician = new DispatchTechnician
                        {
                            DispatchId = dispatch.Id,
                            TechnicianId = techId,
                            AssignedDate = DateTime.UtcNow,
                            Role = "technician"
                        };
                        _db.Set<DispatchTechnician>().Add(dispatchTechnician);
                    }
                }
                await _db.SaveChangesAsync();
                
                // Update job status to dispatched
                job.Status = "dispatched";
                await _db.SaveChangesAsync();
            }
            
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
                    : $"DISP-{DateTime.UtcNow:yyyyMMddHHmmss}-{Guid.NewGuid().ToString()[..4].ToUpper()}";
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Numbering service failed for Dispatch, using GUID fallback");
                dispatchNumber = $"DISP-{DateTime.UtcNow:yyyyMMddHHmmss}-{Guid.NewGuid().ToString()[..4].ToUpper()}";
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
                InstallationId = dto.InstallationId,
                InstallationName = dto.InstallationName,
                Status = status,
                Priority = dto.Priority ?? "medium",
                ScheduledDate = dto.ScheduledDate,
                ScheduledStartTime = dto.ScheduledStartTime,
                ScheduledEndTime = dto.ScheduledEndTime,
                SiteAddress = dto.SiteAddress ?? string.Empty,
                Description = dto.Notes ?? $"Installation: {dto.InstallationName} ({dto.JobIds.Count} jobs)",
                CreatedDate = DateTime.UtcNow,
                CreatedBy = userId,
                DispatchedBy = userId,
                DispatchedAt = DateTime.UtcNow
            };

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
            return await CreateFromInstallationAsync(createDto, userId);
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
            return DispatchMapping.ToDto(d, nameMap);
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
                            "serviceOrder",
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

        public async Task<TimeEntryDto> AddTimeEntryAsync(int dispatchId, CreateTimeEntryDto dto, string userId)
        {
            var d = await _db.Dispatches.FirstOrDefaultAsync(x => x.Id == dispatchId && !x.IsDeleted);
            if (d == null) throw new KeyNotFoundException($"Dispatch {dispatchId} not found");

            var te = new TimeEntry
            {
                DispatchId = dispatchId,
                TechnicianId = int.TryParse(dto.TechnicianId, out var tid) ? tid : 0,
                WorkType = dto.WorkType,
                StartTime = dto.StartTime,
                EndTime = dto.EndTime,
                Duration = (decimal)(dto.EndTime - dto.StartTime).TotalMinutes,
                Description = dto.Description,
                CreatedDate = DateTime.UtcNow
            };
            _db.TimeEntries.Add(te);
            await _db.SaveChangesAsync();

            // Propagate time entry to parent Sale/Offer activities
            await PropagateTimeEntryToSaleAsync(d, te, userId);

            return new TimeEntryDto 
            { 
                Id = te.Id, 
                DispatchId = te.DispatchId, 
                TechnicianId = te.TechnicianId.ToString(), 
                WorkType = te.WorkType, 
                StartTime = te.StartTime,
                EndTime = te.EndTime,
                Duration = (int)(te.Duration ?? 0), 
                Description = te.Description,
                CreatedAt = te.CreatedDate 
            };
        }

        public async Task<IEnumerable<TimeEntryDto>> GetTimeEntriesAsync(int dispatchId)
        {
            var items = await _db.TimeEntries.AsNoTracking().Where(t => t.DispatchId == dispatchId).ToListAsync();
            return items.Select(t => new TimeEntryDto 
            { 
                Id = t.Id, 
                DispatchId = t.DispatchId, 
                TechnicianId = t.TechnicianId.ToString(), 
                WorkType = t.WorkType, 
                StartTime = t.StartTime,
                EndTime = t.EndTime,
                Duration = (int)(t.Duration ?? 0), 
                Description = t.Description,
                CreatedAt = t.CreatedDate 
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

            _db.TimeEntries.Remove(te);
            await _db.SaveChangesAsync();
        }

        public async Task<ExpenseDto> AddExpenseAsync(int dispatchId, CreateExpenseDto dto, string userId)
        {
            var d = await _db.Dispatches.FirstOrDefaultAsync(x => x.Id == dispatchId && !x.IsDeleted);
            if (d == null) throw new KeyNotFoundException($"Dispatch {dispatchId} not found");

            var exp = new Expense
            {
                DispatchId = dispatchId,
                ExpenseType = dto.Type,
                Amount = dto.Amount,
                Description = dto.Description,
                ExpenseDate = dto.Date ?? DateTime.UtcNow,
                RecordedBy = userId,
                CreatedDate = DateTime.UtcNow
            };
            _db.DispatchExpenses.Add(exp);
            await _db.SaveChangesAsync();

            // Propagate expense to parent Sale/Offer activities
            await PropagateExpenseToSaleAsync(d, exp, userId);

            return new ExpenseDto 
            { 
                Id = exp.Id, 
                DispatchId = exp.DispatchId, 
                TechnicianId = dto.TechnicianId ?? userId, 
                Type = exp.ExpenseType, 
                Amount = exp.Amount,
                Currency = dto.Currency,
                Description = exp.Description,
                Date = exp.ExpenseDate,
                Status = "pending", 
                CreatedAt = exp.CreatedDate 
            };
        }

        public async Task<IEnumerable<ExpenseDto>> GetExpensesAsync(int dispatchId)
        {
            var items = await _db.DispatchExpenses.AsNoTracking().Where(e => e.DispatchId == dispatchId).ToListAsync();
            return items.Select(e => new ExpenseDto 
            { 
                Id = e.Id, 
                DispatchId = e.DispatchId, 
                TechnicianId = e.RecordedBy, 
                Type = e.ExpenseType, 
                Amount = e.Amount,
                Description = e.Description,
                Date = e.ExpenseDate,
                Status = "pending", 
                CreatedAt = e.CreatedDate 
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
            if (dto.Amount.HasValue) exp.Amount = dto.Amount.Value;
            if (dto.Description != null) exp.Description = dto.Description;
            if (dto.Date.HasValue) exp.ExpenseDate = dto.Date.Value;

            await _db.SaveChangesAsync();

            return new ExpenseDto 
            { 
                Id = exp.Id, 
                DispatchId = exp.DispatchId, 
                TechnicianId = exp.RecordedBy, 
                Type = exp.ExpenseType, 
                Amount = exp.Amount,
                Currency = dto.Currency,
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

            _db.DispatchExpenses.Remove(exp);
            await _db.SaveChangesAsync();
        }

        public async Task<MaterialDto> AddMaterialUsageAsync(int dispatchId, CreateMaterialUsageDto dto, string userId)
        {
            var d = await _db.Dispatches.FirstOrDefaultAsync(x => x.Id == dispatchId && !x.IsDeleted);
            if (d == null) throw new KeyNotFoundException($"Dispatch {dispatchId} not found");

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

            var mat = new MaterialUsage
            {
                DispatchId = dispatchId,
                ArticleId = articleId,
                Quantity = dto.Quantity,
                Description = dto.Description ?? string.Empty,
                UnitPrice = dto.UnitPrice ?? 0,
                TotalPrice = dto.Quantity * (dto.UnitPrice ?? 0),
                RecordedBy = userId,
                UsedDate = DateTime.UtcNow,
                Unit = unitValue
            };
            _db.DispatchMaterials.Add(mat);
            await _db.SaveChangesAsync();

            // Propagate material usage to parent Sale/Offer activities
            await PropagateMaterialToSaleAsync(d, mat, userId);

            return new MaterialDto 
            { 
                Id = mat.Id, 
                DispatchId = mat.DispatchId, 
                TechnicianId = dto.UsedBy ?? userId,
                ArticleId = mat.ArticleId?.ToString(),
                Description = mat.Description,
                Quantity = (int)mat.Quantity,
                UnitPrice = mat.UnitPrice,
                TotalPrice = mat.TotalPrice,
                Status = "pending", 
                CreatedAt = mat.UsedDate,
                Unit = mat.Unit
            };
        }

        public async Task<IEnumerable<MaterialDto>> GetMaterialsAsync(int dispatchId)
        {
            var items = await _db.DispatchMaterials.Where(m => m.DispatchId == dispatchId).ToListAsync();
            return items.Select(m => new MaterialDto 
            { 
                Id = m.Id, 
                DispatchId = m.DispatchId, 
                TechnicianId = m.RecordedBy,
                ArticleId = m.ArticleId?.ToString(),
                Description = m.Description,
                Quantity = (int)m.Quantity,
                UnitPrice = m.UnitPrice,
                TotalPrice = m.TotalPrice,
                Status = "pending", 
                CreatedAt = m.UsedDate,
                Unit = m.Unit
            }).ToList();
        }

        public async Task ApproveMaterialAsync(int dispatchId, int materialId, ApproveMaterialDto dto, string userId)
        {
            var m = await _db.DispatchMaterials.FirstOrDefaultAsync(x => x.Id == materialId && x.DispatchId == dispatchId);
            if (m == null) throw new KeyNotFoundException("Material not found");
            await _db.SaveChangesAsync();
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

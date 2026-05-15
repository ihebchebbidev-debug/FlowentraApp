using MyApi.Data;
using MyApi.Modules.Projects.DTOs;
using MyApi.Modules.Projects.Models;
using MyApi.Modules.Contacts.Models;
using MyApi.Modules.Offers.Models;
using MyApi.Modules.Sales.Models;
using MyApi.Modules.ServiceOrders.Models;
using MyApi.Modules.Dispatches.Models;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace MyApi.Modules.Projects.Services
{
    public class ProjectService : IProjectService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<ProjectService> _logger;
        private readonly IProjectColumnService _columnService;

        public ProjectService(ApplicationDbContext context, ILogger<ProjectService> logger, IProjectColumnService columnService)
        {
            _context = context;
            _logger = logger;
            _columnService = columnService;
        }

        public async Task<ProjectListResponseDto> GetAllProjectsAsync(ProjectSearchRequestDto? searchRequest = null)
        {
            try
            {
                // ✅ OPTIMIZATION: Remove eager loading for list view (3-5x faster)
                var query = _context.Projects
                    .AsNoTracking()
                    // Removed: .Include(p => p.Columns) - only needed for detail view
                    // Removed: .Include(p => p.Contact) - only needed for detail view
                    .AsQueryable();

                // Apply filters
                if (searchRequest != null)
                {
                    if (!string.IsNullOrEmpty(searchRequest.SearchTerm))
                    {
                        var searchTerm = searchRequest.SearchTerm.ToLower();
                        query = query.Where(p => p.Name.ToLower().Contains(searchTerm) ||
                                               (p.Description != null && p.Description.ToLower().Contains(searchTerm)));
                    }

                    if (!string.IsNullOrEmpty(searchRequest.Status))
                        query = query.Where(p => p.Status == searchRequest.Status);

                    if (!string.IsNullOrEmpty(searchRequest.Priority))
                        query = query.Where(p => p.Priority == searchRequest.Priority);

                    if (searchRequest.ContactId.HasValue)
                        query = query.Where(p => p.ContactId == searchRequest.ContactId.Value);

                    // Date range filters
                    if (searchRequest.StartDateFrom.HasValue)
                        query = query.Where(p => p.StartDate >= searchRequest.StartDateFrom.Value);

                    if (searchRequest.StartDateTo.HasValue)
                        query = query.Where(p => p.StartDate <= searchRequest.StartDateTo.Value);

                    if (searchRequest.EndDateFrom.HasValue)
                        query = query.Where(p => p.EndDate >= searchRequest.EndDateFrom.Value);

                    if (searchRequest.EndDateTo.HasValue)
                        query = query.Where(p => p.EndDate <= searchRequest.EndDateTo.Value);

                    // Apply sorting
                    if (!string.IsNullOrEmpty(searchRequest.SortBy))
                    {
                        var isDescending = searchRequest.SortDirection?.ToLower() == "desc";
                        
                        query = searchRequest.SortBy.ToLower() switch
                        {
                            "name" => isDescending ? query.OrderByDescending(p => p.Name) : query.OrderBy(p => p.Name),
                            "status" => isDescending ? query.OrderByDescending(p => p.Status) : query.OrderBy(p => p.Status),
                            "priority" => isDescending ? query.OrderByDescending(p => p.Priority) : query.OrderBy(p => p.Priority),
                            "startdate" => isDescending ? query.OrderByDescending(p => p.StartDate) : query.OrderBy(p => p.StartDate),
                            "enddate" => isDescending ? query.OrderByDescending(p => p.EndDate) : query.OrderBy(p => p.EndDate),
                            _ => query.OrderByDescending(p => p.CreatedDate)
                        };
                    }
                    else
                    {
                        query = query.OrderByDescending(p => p.CreatedDate);
                    }
                }
                else
                {
                    query = query.OrderByDescending(p => p.CreatedDate);
                }

                // Get total count
                var totalCount = await query.CountAsync();

                // Apply pagination
                var pageNumber = searchRequest?.PageNumber ?? 1;
                var pageSize = searchRequest?.PageSize ?? 20;
                var skip = (pageNumber - 1) * pageSize;

                var projects = await query
                    .Skip(skip)
                    .Take(pageSize)
                    .ToListAsync();

                var projectDtos = projects.Select(MapToProjectDto).ToList();

                return new ProjectListResponseDto
                {
                    Projects = projectDtos,
                    TotalCount = totalCount,
                    PageSize = pageSize,
                    PageNumber = pageNumber,
                    HasNextPage = skip + pageSize < totalCount,
                    HasPreviousPage = pageNumber > 1
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting all projects");
                throw;
            }
        }

        public async Task<ProjectResponseDto?> GetProjectByIdAsync(int id)
        {
            try
            {
                var project = await _context.Projects
                    .Include(p => p.Contact)
                    .Where(p => p.Id == id)
                    .FirstOrDefaultAsync();

                if (project == null) return null;
                var dto = MapToProjectDto(project);
                dto.Settings = await GetProjectSettingsAsync();
                return dto;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting project by id {ProjectId}", id);
                throw;
            }
        }

        public async Task<ProjectResponseDto> CreateProjectAsync(CreateProjectRequestDto createDto, string createdByUser)
        {
            try
            {
                var project = new Project
                {
                    Name = createDto.Name,
                    Description = createDto.Description,
                    ContactId = createDto.ContactId,
                    TeamMembers = SerializeTeamMembers(createDto.TeamMembers),
                    Status = createDto.Status ?? "active",
                    Priority = createDto.Priority ?? "medium",
                    StartDate = createDto.StartDate,
                    EndDate = createDto.EndDate,
                    CreatedDate = DateTime.UtcNow,
                    CreatedBy = createdByUser
                };

                _context.Projects.Add(project);
                await _context.SaveChangesAsync();

                await SetProjectIdForLinkedEntitiesAsync(project.Id, createDto.LinkOfferId, createDto.LinkSaleId, createDto.LinkServiceOrderId, createDto.LinkDispatchId);

                // Create default columns if needed
                if (createDto.CreateDefaultColumns)
                {
                    await _columnService.CreateDefaultColumnsAsync(project.Id, createdByUser);
                }

                // Reload with includes
                var createdProject = await GetProjectByIdAsync(project.Id);
                _logger.LogInformation("Project created successfully with ID {ProjectId}", project.Id);

                return createdProject!;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating project");
                throw;
            }
        }

        public async Task<ProjectResponseDto?> UpdateProjectAsync(int id, UpdateProjectRequestDto updateDto, string modifiedByUser)
        {
            try
            {
                var project = await _context.Projects
                    .Where(p => p.Id == id)
                    .FirstOrDefaultAsync();

                if (project == null)
                    return null;

                // Update fields
                if (!string.IsNullOrEmpty(updateDto.Name))
                    project.Name = updateDto.Name;

                if (updateDto.Description != null)
                    project.Description = updateDto.Description;

                if (updateDto.ContactId.HasValue)
                    project.ContactId = updateDto.ContactId;

                if (updateDto.TeamMembers != null)
                    project.TeamMembers = SerializeTeamMembers(updateDto.TeamMembers);

                if (!string.IsNullOrEmpty(updateDto.Status))
                    project.Status = updateDto.Status;

                if (!string.IsNullOrEmpty(updateDto.Priority))
                    project.Priority = updateDto.Priority;

                if (updateDto.StartDate.HasValue)
                    project.StartDate = updateDto.StartDate;

                if (updateDto.EndDate.HasValue)
                    project.EndDate = updateDto.EndDate;

                project.ModifiedBy = modifiedByUser;
                project.ModifiedDate = DateTime.UtcNow;

                await _context.SaveChangesAsync();
                await SetProjectIdForLinkedEntitiesAsync(id, updateDto.LinkOfferId, updateDto.LinkSaleId, updateDto.LinkServiceOrderId, updateDto.LinkDispatchId);

                var updatedProject = await GetProjectByIdAsync(id);
                _logger.LogInformation("Project updated successfully with ID {ProjectId}", id);

                return updatedProject;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating project with ID {ProjectId}", id);
                throw;
            }
        }

        public async Task<bool> DeleteProjectAsync(int id, string deletedByUser)
        {
            try
            {
                var project = await _context.Projects
                    .Where(p => p.Id == id)
                    .FirstOrDefaultAsync();

                if (project == null)
                    return false;

                _context.Projects.Remove(project);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Project deleted successfully with ID {ProjectId}", id);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting project with ID {ProjectId}", id);
                throw;
            }
        }

        public async Task<ProjectStatisticsDto> GetStatisticsAsync()
        {
            try
            {
                var projects = await _context.Projects.ToListAsync();

                var statistics = new ProjectStatisticsDto
                {
                    TotalProjects = projects.Count,
                    ActiveProjects = projects.Count(p => p.Status == "active"),
                    CompletedProjects = projects.Count(p => p.Status == "completed"),
                    OnHoldProjects = projects.Count(p => p.Status == "on-hold"),
                    HighPriorityCount = projects.Count(p => p.Priority == "high"),
                    MediumPriorityCount = projects.Count(p => p.Priority == "medium"),
                    LowPriorityCount = projects.Count(p => p.Priority == "low")
                };

                return statistics;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting project statistics");
                throw;
            }
        }

        public async Task<List<ProjectResponseDto>> SearchProjectsAsync(string searchTerm)
        {
            try
            {
                var searchLower = searchTerm.ToLower();
                var projects = await _context.Projects
                    .Include(p => p.Contact)
                    .Where(p => p.Name.ToLower().Contains(searchLower) ||
                               (p.Description != null && p.Description.ToLower().Contains(searchLower)))
                    .Take(50)
                    .ToListAsync();

                return projects.Select(MapToProjectDto).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error searching projects");
                throw;
            }
        }

        private static string SerializeTeamMembers(List<int>? teamMembers)
        {
            // Stored as JSON in Projects.TeamMembers (varchar)
            return JsonSerializer.Serialize(teamMembers ?? new List<int>());
        }

        private static List<int> DeserializeTeamMembers(string? teamMembersJson)
        {
            if (string.IsNullOrWhiteSpace(teamMembersJson))
                return new List<int>();

            try
            {
                return JsonSerializer.Deserialize<List<int>>(teamMembersJson) ?? new List<int>();
            }
            catch
            {
                // If column contains invalid JSON for any reason, fail safely.
                return new List<int>();
            }
        }

        public async Task<List<ProjectNoteDto>> GetProjectNotesAsync(int projectId)
        {
            try
            {
                var notes = await _context.Set<ProjectNote>()
                    .Where(n => n.ProjectId == projectId)
                    .OrderByDescending(n => n.CreatedDate)
                    .AsNoTracking()
                    .ToListAsync();

                return notes.Select(n => new ProjectNoteDto
                {
                    Id = n.Id,
                    ProjectId = n.ProjectId,
                    Content = n.Content,
                    CreatedDate = n.CreatedDate,
                    CreatedBy = n.CreatedBy,
                    ModifiedDate = n.ModifiedDate,
                    ModifiedBy = n.ModifiedBy
                }).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving project notes for project {ProjectId}", projectId);
                throw;
            }
        }

        public async Task<ProjectNoteDto> CreateProjectNoteAsync(int projectId, CreateProjectNoteRequestDto createDto, string createdByUser)
        {
            try
            {
                // Verify project exists
                var project = await _context.Projects.FindAsync(projectId);
                if (project == null)
                    throw new InvalidOperationException($"Project with ID {projectId} not found");

                var note = new ProjectNote
                {
                    ProjectId = projectId,
                    Content = createDto.Content,
                    CreatedDate = DateTime.UtcNow,
                    CreatedBy = createdByUser
                };

                _context.Set<ProjectNote>().Add(note);
                await _context.SaveChangesAsync();

                return new ProjectNoteDto
                {
                    Id = note.Id,
                    ProjectId = note.ProjectId,
                    Content = note.Content,
                    CreatedDate = note.CreatedDate,
                    CreatedBy = note.CreatedBy,
                    ModifiedDate = note.ModifiedDate,
                    ModifiedBy = note.ModifiedBy
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating project note for project {ProjectId}", projectId);
                throw;
            }
        }

        public async Task<bool> DeleteProjectNoteAsync(int noteId, string deletedByUser)
        {
            try
            {
                var note = await _context.Set<ProjectNote>().FindAsync(noteId);
                if (note == null)
                    return false;

                _context.Set<ProjectNote>().Remove(note);
                await _context.SaveChangesAsync();
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting project note {NoteId}", noteId);
                throw;
            }
        }

        public async Task<List<ProjectActivityDto>> GetProjectActivityAsync(int projectId)
        {
            try
            {
                var activities = await _context.Set<ProjectActivity>()
                    .Where(a => a.ProjectId == projectId)
                    .OrderByDescending(a => a.CreatedDate)
                    .AsNoTracking()
                    .ToListAsync();

                return activities.Select(a => new ProjectActivityDto
                {
                    Id = a.Id,
                    ProjectId = a.ProjectId,
                    ActionType = a.ActionType,
                    Description = a.Description,
                    Details = a.Details,
                    CreatedDate = a.CreatedDate,
                    CreatedBy = a.CreatedBy,
                    RelatedEntityId = a.RelatedEntityId,
                    RelatedEntityType = a.RelatedEntityType
                }).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving project activity for project {ProjectId}", projectId);
                throw;
            }
        }

        public async Task<ProjectLinksDto> GetProjectLinksAsync(int projectId)
        {
            var project = await _context.Projects.FirstOrDefaultAsync(p => p.Id == projectId);
            if (project == null) throw new KeyNotFoundException($"Project with ID {projectId} not found");

            var offers = await _context.Offers
                .Where(o => !o.IsDeleted && o.ProjectId == projectId)
                .OrderByDescending(o => o.CreatedDate)
                .Take(100)
                .ToListAsync();
            var sales = await _context.Sales
                .Where(s => !s.IsDeleted && s.ProjectId == projectId)
                .OrderByDescending(s => s.CreatedDate)
                .Take(100)
                .ToListAsync();
            var serviceOrders = await _context.ServiceOrders
                .Where(s => !s.IsDeleted && s.ProjectId == projectId)
                .OrderByDescending(s => s.CreatedDate)
                .Take(100)
                .ToListAsync();
            var dispatches = await _context.Dispatches
                .Where(d => !d.IsDeleted && d.ProjectId == projectId)
                .OrderByDescending(d => d.CreatedDate)
                .Take(100)
                .ToListAsync();

            return new ProjectLinksDto
            {
                ProjectId = projectId,
                Offers = offers.Select(o => new ProjectLinkedEntityDto
                {
                    EntityType = "offer",
                    EntityId = o.Id,
                    Number = o.OfferNumber ?? $"OFR-{o.Id}",
                    Title = o.Title ?? "Offer",
                    Status = o.Status,
                    Date = o.CreatedDate
                }).ToList(),
                Sales = sales.Select(s => new ProjectLinkedEntityDto
                {
                    EntityType = "sale",
                    EntityId = s.Id,
                    Number = s.SaleNumber ?? $"SAL-{s.Id}",
                    Title = s.Title ?? "Sale",
                    Status = s.Status,
                    Date = s.CreatedDate
                }).ToList(),
                ServiceOrders = serviceOrders.Select(s => new ProjectLinkedEntityDto
                {
                    EntityType = "service_order",
                    EntityId = s.Id,
                    Number = s.OrderNumber ?? $"SO-{s.Id}",
                    Title = s.Description ?? "Service Order",
                    Status = s.Status,
                    Date = s.CreatedDate
                }).ToList(),
                Dispatches = dispatches.Select(d => new ProjectLinkedEntityDto
                {
                    EntityType = "dispatch",
                    EntityId = d.Id,
                    Number = d.DispatchNumber ?? $"DSP-{d.Id}",
                    Title = d.Description ?? "Dispatch",
                    Status = d.Status,
                    Date = d.CreatedDate
                }).ToList()
            };
        }

        public async Task<ProjectLinksDto> LinkEntityToProjectAsync(int projectId, LinkProjectEntityRequestDto dto, string userId)
        {
            var project = await _context.Projects.FirstOrDefaultAsync(p => p.Id == projectId);
            if (project == null) throw new KeyNotFoundException($"Project with ID {projectId} not found");

            await SetEntityProjectAsync(dto.EntityType, dto.EntityId, projectId, userId);
            await _context.Set<ProjectActivity>().AddAsync(new ProjectActivity
            {
                ProjectId = projectId,
                ActionType = "linked_entity",
                Description = $"Linked {dto.EntityType} #{dto.EntityId} to project",
                CreatedDate = DateTime.UtcNow,
                CreatedBy = userId,
                RelatedEntityId = dto.EntityId,
                RelatedEntityType = dto.EntityType
            });
            await _context.SaveChangesAsync();

            return await GetProjectLinksAsync(projectId);
        }

        public async Task<ProjectLinksDto> UnlinkEntityFromProjectAsync(int projectId, string entityType, int entityId, string userId)
        {
            var project = await _context.Projects.FirstOrDefaultAsync(p => p.Id == projectId);
            if (project == null) throw new KeyNotFoundException($"Project with ID {projectId} not found");

            await SetEntityProjectAsync(entityType, entityId, null, userId);
            await _context.Set<ProjectActivity>().AddAsync(new ProjectActivity
            {
                ProjectId = projectId,
                ActionType = "unlinked_entity",
                Description = $"Unlinked {entityType} #{entityId} from project",
                CreatedDate = DateTime.UtcNow,
                CreatedBy = userId,
                RelatedEntityId = entityId,
                RelatedEntityType = entityType
            });
            await _context.SaveChangesAsync();

            return await GetProjectLinksAsync(projectId);
        }

        public async Task<ProjectSettingsDto> GetProjectSettingsAsync()
        {
            var settings = await _context.Set<ProjectSettings>().FirstOrDefaultAsync();
            if (settings == null)
            {
                return new ProjectSettingsDto();
            }
            try
            {
                return JsonSerializer.Deserialize<ProjectSettingsDto>(settings.SettingsJson) ?? new ProjectSettingsDto();
            }
            catch
            {
                return new ProjectSettingsDto();
            }
        }

        public async Task<ProjectSettingsDto> UpdateProjectSettingsAsync(ProjectSettingsDto dto, string userId)
        {
            var settings = await _context.Set<ProjectSettings>().FirstOrDefaultAsync();
            if (settings == null)
            {
                settings = new ProjectSettings();
                _context.Set<ProjectSettings>().Add(settings);
            }

            settings.SettingsJson = JsonSerializer.Serialize(dto);
            settings.UpdatedAt = DateTime.UtcNow;
            settings.UpdatedBy = userId;
            await _context.SaveChangesAsync();

            return dto;
        }

        private ProjectResponseDto MapToProjectDto(Project project)
        {
            return new ProjectResponseDto
            {
                Id = project.Id,
                Name = project.Name,
                Description = project.Description,
                ContactId = project.ContactId,
                ContactName = project.Contact != null 
                    ? $"{project.Contact.FirstName} {project.Contact.LastName}".Trim() 
                    : null,
                Status = project.Status,
                Priority = project.Priority,
                StartDate = project.StartDate,
                EndDate = project.EndDate,
                TeamMembers = DeserializeTeamMembers(project.TeamMembers),
                CreatedDate = project.CreatedDate,
                CreatedBy = project.CreatedBy,
                ModifiedDate = project.ModifiedDate,
                ModifiedBy = project.ModifiedBy,
                Columns = new List<ProjectColumnDto>()
            };
        }

        private async Task SetProjectIdForLinkedEntitiesAsync(int projectId, int? offerId, int? saleId, int? serviceOrderId, int? dispatchId)
        {
            if (offerId.HasValue)
            {
                var offer = await _context.Offers.FirstOrDefaultAsync(o => o.Id == offerId.Value && !o.IsDeleted);
                if (offer != null) offer.ProjectId = projectId;
            }
            if (saleId.HasValue)
            {
                var sale = await _context.Sales.FirstOrDefaultAsync(s => s.Id == saleId.Value && !s.IsDeleted);
                if (sale != null) sale.ProjectId = projectId;
            }
            if (serviceOrderId.HasValue)
            {
                var serviceOrder = await _context.ServiceOrders.FirstOrDefaultAsync(s => s.Id == serviceOrderId.Value && !s.IsDeleted);
                if (serviceOrder != null) serviceOrder.ProjectId = projectId;
            }
            if (dispatchId.HasValue)
            {
                var dispatch = await _context.Dispatches.FirstOrDefaultAsync(d => d.Id == dispatchId.Value && !d.IsDeleted);
                if (dispatch != null) dispatch.ProjectId = projectId;
            }
            await _context.SaveChangesAsync();
        }

        private async Task SetEntityProjectAsync(string entityType, int entityId, int? projectId, string userId)
        {
            switch (entityType.Trim().ToLowerInvariant())
            {
                case "offer":
                case "offers":
                    var offer = await _context.Offers.FirstOrDefaultAsync(o => o.Id == entityId && !o.IsDeleted);
                    if (offer == null) throw new KeyNotFoundException($"Offer {entityId} not found");
                    offer.ProjectId = projectId;
                    offer.ModifiedBy = userId;
                    offer.ModifiedDate = DateTime.UtcNow;
                    offer.UpdatedAt = DateTime.UtcNow;
                    break;
                case "sale":
                case "sales":
                    var sale = await _context.Sales.FirstOrDefaultAsync(s => s.Id == entityId && !s.IsDeleted);
                    if (sale == null) throw new KeyNotFoundException($"Sale {entityId} not found");
                    sale.ProjectId = projectId;
                    sale.ModifiedBy = userId;
                    sale.ModifiedDate = DateTime.UtcNow;
                    sale.UpdatedAt = DateTime.UtcNow;
                    break;
                case "service_order":
                case "serviceorder":
                case "service-orders":
                    var so = await _context.ServiceOrders.FirstOrDefaultAsync(s => s.Id == entityId && !s.IsDeleted);
                    if (so == null) throw new KeyNotFoundException($"Service Order {entityId} not found");
                    so.ProjectId = projectId;
                    so.ModifiedBy = userId;
                    so.ModifiedDate = DateTime.UtcNow;
                    break;
                case "dispatch":
                case "dispatches":
                    var dispatch = await _context.Dispatches.FirstOrDefaultAsync(d => d.Id == entityId && !d.IsDeleted);
                    if (dispatch == null) throw new KeyNotFoundException($"Dispatch {entityId} not found");
                    dispatch.ProjectId = projectId;
                    dispatch.ModifiedBy = userId;
                    dispatch.ModifiedDate = DateTime.UtcNow;
                    break;
                default:
                    throw new InvalidOperationException($"Unsupported entityType '{entityType}'");
            }
        }
    }
}

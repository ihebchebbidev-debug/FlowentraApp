using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using MyApi.Data;
using MyApi.Modules.DynamicForms.DTOs;
using MyApi.Modules.DynamicForms.Models;
using MyApi.Modules.Notifications.DTOs;
using MyApi.Modules.Notifications.Services;

namespace MyApi.Modules.DynamicForms.Services
{
    /// <summary>
    /// Service implementation for Dynamic Forms operations
    /// </summary>
    public class DynamicFormService : IDynamicFormService
    {
        private readonly ApplicationDbContext _context;
        private readonly INotificationService _notificationService;
        private readonly JsonSerializerOptions _jsonOptions;

        public DynamicFormService(ApplicationDbContext context, INotificationService notificationService)
        {
            _context = context;
            _notificationService = notificationService;
            _jsonOptions = new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                PropertyNameCaseInsensitive = true
            };
        }

        public async Task<IEnumerable<DynamicFormDto>> GetAllAsync(DynamicFormQueryParams? queryParams = null)
        {
            var query = _context.Set<DynamicForm>()
                .Where(f => !f.IsDeleted)
                .AsQueryable();

            // Apply filters
            if (queryParams != null)
            {
                if (!string.IsNullOrEmpty(queryParams.Status))
                {
                    if (Enum.TryParse<FormStatus>(queryParams.Status, true, out var status))
                    {
                        query = query.Where(f => f.Status == status);
                    }
                }

                if (!string.IsNullOrEmpty(queryParams.Category))
                {
                    query = query.Where(f => f.Category == queryParams.Category);
                }

                if (!string.IsNullOrEmpty(queryParams.Search))
                {
                    var search = queryParams.Search.ToLower();
                    query = query.Where(f =>
                        f.NameEn.ToLower().Contains(search) ||
                        f.NameFr.ToLower().Contains(search) ||
                        (f.DescriptionEn != null && f.DescriptionEn.ToLower().Contains(search)) ||
                        (f.DescriptionFr != null && f.DescriptionFr.ToLower().Contains(search))
                    );
                }

                // Sorting
                query = queryParams.SortDesc
                    ? query.OrderByDescending(f => f.UpdatedAt ?? f.CreatedAt)
                    : query.OrderBy(f => f.UpdatedAt ?? f.CreatedAt);

                // Pagination
                query = query
                    .Skip((queryParams.Page - 1) * queryParams.PageSize)
                    .Take(queryParams.PageSize);
            }
            else
            {
                query = query.OrderByDescending(f => f.UpdatedAt ?? f.CreatedAt);
            }

            var forms = await query.ToListAsync();
            return forms.Select(MapToDto);
        }

        public async Task<DynamicFormDto?> GetByIdAsync(int id)
        {
            var form = await _context.Set<DynamicForm>()
                .Where(f => f.Id == id && !f.IsDeleted)
                .FirstOrDefaultAsync();

            return form != null ? MapToDto(form) : null;
        }

        public async Task<DynamicFormDto> CreateAsync(CreateDynamicFormDto dto, string userId)
        {
            var form = new DynamicForm
            {
                NameEn = dto.NameEn,
                NameFr = dto.NameFr,
                DescriptionEn = dto.DescriptionEn,
                DescriptionFr = dto.DescriptionFr,
                Category = dto.Category,
                Status = FormStatus.Draft,
                Version = 1,
                Fields = JsonSerializer.Serialize(dto.Fields, _jsonOptions),
                CreatedUser = userId,
                CreatedAt = DateTime.UtcNow,
                IsActive = true,
                IsDeleted = false
            };

            _context.Set<DynamicForm>().Add(form);
            await _context.SaveChangesAsync();

            return MapToDto(form);
        }

        public async Task<DynamicFormDto> UpdateAsync(int id, UpdateDynamicFormDto dto, string userId)
        {
            var form = await _context.Set<DynamicForm>()
                .Where(f => f.Id == id && !f.IsDeleted)
                .FirstOrDefaultAsync();

            if (form == null)
            {
                throw new KeyNotFoundException($"Form with ID {id} not found");
            }

            // If form is released and fields are changing, increment version
            var shouldIncrementVersion = form.Status == FormStatus.Released && dto.Fields != null;

            if (!string.IsNullOrEmpty(dto.NameEn)) form.NameEn = dto.NameEn;
            if (!string.IsNullOrEmpty(dto.NameFr)) form.NameFr = dto.NameFr;
            if (dto.DescriptionEn != null) form.DescriptionEn = dto.DescriptionEn;
            if (dto.DescriptionFr != null) form.DescriptionFr = dto.DescriptionFr;
            if (!string.IsNullOrEmpty(dto.Category)) form.Category = dto.Category;
            if (dto.Fields != null) form.Fields = JsonSerializer.Serialize(dto.Fields, _jsonOptions);

            // Handle public sharing settings
            if (dto.IsPublic.HasValue)
            {
                form.IsPublic = dto.IsPublic.Value;
                // Generate slug if enabling public access and no slug exists
                if (dto.IsPublic.Value && string.IsNullOrEmpty(form.PublicSlug))
                {
                    form.PublicSlug = await GenerateUniqueSlugAsync(form.NameEn);
                }
            }
            if (!string.IsNullOrEmpty(dto.PublicSlug))
            {
                form.PublicSlug = dto.PublicSlug;
            }

            if (!string.IsNullOrEmpty(dto.Status) && Enum.TryParse<FormStatus>(dto.Status, true, out var status))
            {
                form.Status = status;
            }

            if (shouldIncrementVersion)
            {
                form.Version++;
            }

            form.ModifyUser = userId;
            form.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return MapToDto(form);
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var form = await _context.Set<DynamicForm>()
                .Where(f => f.Id == id)
                .FirstOrDefaultAsync();

            if (form == null) return false;

            form.IsDeleted = true;
            form.DeletedAt = DateTime.UtcNow;
            // Clear public sharing to allow slug reuse
            form.IsPublic = false;
            form.PublicSlug = null;
            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<DynamicFormDto> DuplicateAsync(int id, string userId)
        {
            var original = await _context.Set<DynamicForm>()
                .Where(f => f.Id == id && !f.IsDeleted)
                .FirstOrDefaultAsync();

            if (original == null)
            {
                throw new KeyNotFoundException($"Form with ID {id} not found");
            }

            var duplicate = new DynamicForm
            {
                NameEn = $"{original.NameEn} (Copy)",
                NameFr = $"{original.NameFr} (Copie)",
                DescriptionEn = original.DescriptionEn,
                DescriptionFr = original.DescriptionFr,
                Category = original.Category,
                Status = FormStatus.Draft,
                Version = 1,
                Fields = original.Fields,
                CreatedUser = userId,
                CreatedAt = DateTime.UtcNow,
                IsActive = true,
                IsDeleted = false
            };

            _context.Set<DynamicForm>().Add(duplicate);
            await _context.SaveChangesAsync();

            return MapToDto(duplicate);
        }

        public async Task<DynamicFormDto> ChangeStatusAsync(int id, string status, string userId)
        {
            var form = await _context.Set<DynamicForm>()
                .Where(f => f.Id == id && !f.IsDeleted)
                .FirstOrDefaultAsync();

            if (form == null)
            {
                throw new KeyNotFoundException($"Form with ID {id} not found");
            }

            if (Enum.TryParse<FormStatus>(status, true, out var newStatus))
            {
                form.Status = newStatus;
                form.ModifyUser = userId;
                form.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
            }

            return MapToDto(form);
        }

        public async Task<IEnumerable<DynamicFormResponseDto>> GetResponsesAsync(int formId)
        {
            var responses = await _context.Set<DynamicFormResponse>()
                .Where(r => r.FormId == formId)
                .OrderByDescending(r => r.SubmittedAt)
                .ToListAsync();

            return responses.Select(MapResponseToDto);
        }

        public async Task<DynamicFormResponseDto> SubmitResponseAsync(SubmitFormResponseDto dto, string userId)
        {
            var form = await _context.Set<DynamicForm>()
                .Where(f => f.Id == dto.FormId && !f.IsDeleted)
                .FirstOrDefaultAsync();

            if (form == null)
            {
                throw new KeyNotFoundException($"Form with ID {dto.FormId} not found");
            }

            var response = new DynamicFormResponse
            {
                FormId = dto.FormId,
                FormVersion = form.Version,
                EntityType = dto.EntityType,
                EntityId = dto.EntityId,
                Responses = JsonSerializer.Serialize(dto.Responses, _jsonOptions),
                Notes = dto.Notes,
                SubmittedBy = userId,
                SubmittedAt = DateTime.UtcNow
            };

            _context.Set<DynamicFormResponse>().Add(response);
            await _context.SaveChangesAsync();

            return MapResponseToDto(response);
        }

        public async Task<int> GetResponseCountAsync(int formId)
        {
            return await _context.Set<DynamicFormResponse>()
                .CountAsync(r => r.FormId == formId);
        }

        // Public form operations
        public async Task<DynamicFormDto?> GetBySlugAsync(string slug)
        {
            var form = await _context.Set<DynamicForm>()
                .Where(f => f.PublicSlug == slug && f.IsPublic && !f.IsDeleted && f.Status == FormStatus.Released)
                .FirstOrDefaultAsync();

            return form != null ? MapToDto(form) : null;
        }

        public async Task<DynamicFormResponseDto> SubmitPublicResponseAsync(string slug, PublicSubmitFormResponseDto dto)
        {
            var form = await _context.Set<DynamicForm>()
                .Where(f => f.PublicSlug == slug && f.IsPublic && !f.IsDeleted && f.Status == FormStatus.Released)
                .FirstOrDefaultAsync();

            if (form == null)
            {
                throw new KeyNotFoundException($"Public form with slug '{slug}' not found");
            }

            var response = new DynamicFormResponse
            {
                FormId = form.Id,
                FormVersion = form.Version,
                Responses = JsonSerializer.Serialize(dto.Responses, _jsonOptions),
                Notes = dto.Notes,
                SubmitterName = dto.SubmitterName,
                SubmitterEmail = dto.SubmitterEmail,
                IsPublicSubmission = true,
                SubmittedBy = dto.SubmitterEmail ?? dto.SubmitterName ?? "anonymous",
                SubmittedAt = DateTime.UtcNow
            };

            _context.Set<DynamicFormResponse>().Add(response);
            await _context.SaveChangesAsync();

            // Send notification to form creator
            if (!string.IsNullOrEmpty(form.CreatedUser) && int.TryParse(form.CreatedUser, out var creatorUserId))
            {
                await _notificationService.CreateNotificationAsync(new CreateNotificationDto
                {
                    UserId = creatorUserId,
                    Title = "New Form Response",
                    Description = $"New response received for '{form.NameEn}'" + 
                        (!string.IsNullOrEmpty(dto.SubmitterName) ? $" from {dto.SubmitterName}" : ""),
                    Type = "info",
                    Category = "forms",
                    Link = $"/dashboard/settings/dynamic-forms/{form.Id}/responses",
                    RelatedEntityId = form.Id,
                    RelatedEntityType = "DynamicForm"
                });
            }

            return MapResponseToDto(response);
        }

        public async Task<string> GenerateUniqueSlugAsync(string baseName)
        {
            // Convert name to URL-friendly slug
            var slug = Regex.Replace(baseName.ToLower(), @"[^a-z0-9\s-]", "");
            slug = Regex.Replace(slug, @"\s+", "-");
            slug = Regex.Replace(slug, @"-+", "-");
            slug = slug.Trim('-');

            if (string.IsNullOrEmpty(slug))
            {
                slug = "form";
            }

            // Check for uniqueness against non-deleted forms only
            var originalSlug = slug;
            var counter = 1;
            while (await _context.Set<DynamicForm>().AnyAsync(f => f.PublicSlug == slug && !f.IsDeleted))
            {
                slug = $"{originalSlug}-{counter}";
                counter++;
            }

            return slug;
        }

        private DynamicFormDto MapToDto(DynamicForm form)
        {
            var fields = new List<FormFieldDto>();
            try
            {
                fields = JsonSerializer.Deserialize<List<FormFieldDto>>(form.Fields, _jsonOptions) ?? new List<FormFieldDto>();
            }
            catch { }

            return new DynamicFormDto
            {
                Id = form.Id,
                NameEn = form.NameEn,
                NameFr = form.NameFr,
                DescriptionEn = form.DescriptionEn,
                DescriptionFr = form.DescriptionFr,
                Status = form.Status.ToString().ToLower(),
                Version = form.Version,
                Category = form.Category,
                IsPublic = form.IsPublic,
                PublicSlug = form.PublicSlug,
                PublicUrl = form.IsPublic && !string.IsNullOrEmpty(form.PublicSlug) 
                    ? $"/public/forms/{form.PublicSlug}" 
                    : null,
                Fields = fields,
                CreatedBy = form.CreatedUser,
                ModifiedBy = form.ModifyUser,
                CreatedAt = form.CreatedAt,
                UpdatedAt = form.UpdatedAt
            };
        }

        private DynamicFormResponseDto MapResponseToDto(DynamicFormResponse response)
        {
            var responses = new Dictionary<string, object>();
            try
            {
                responses = JsonSerializer.Deserialize<Dictionary<string, object>>(response.Responses, _jsonOptions) ?? new Dictionary<string, object>();
            }
            catch { }

            return new DynamicFormResponseDto
            {
                Id = response.Id,
                FormId = response.FormId,
                FormVersion = response.FormVersion,
                EntityType = response.EntityType,
                EntityId = response.EntityId,
                Responses = responses,
                Notes = response.Notes,
                SubmitterName = response.SubmitterName,
                SubmitterEmail = response.SubmitterEmail,
                IsPublicSubmission = response.IsPublicSubmission,
                SubmittedBy = response.SubmittedBy,
                SubmittedAt = response.SubmittedAt
            };
        }
    }
}

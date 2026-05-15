using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using MyApi.Data;
using MyApi.Modules.DynamicForms.Models;
using MyApi.Modules.Shared.DTOs;
using MyApi.Modules.Shared.Models;

namespace MyApi.Modules.Shared.Services
{
    /// <summary>
    /// Service implementation for Entity Form Document operations
    /// </summary>
    public class EntityFormDocumentService : IEntityFormDocumentService
    {
        private readonly ApplicationDbContext _context;
        private readonly JsonSerializerOptions _jsonOptions;

        public EntityFormDocumentService(ApplicationDbContext context)
        {
            _context = context;
            _jsonOptions = new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                PropertyNameCaseInsensitive = true
            };
        }

        public async Task<IEnumerable<EntityFormDocumentDto>> GetByEntityAsync(string entityType, int entityId)
        {
            var documents = await _context.Set<EntityFormDocument>()
                .Include(d => d.Form)
                .Where(d => !d.IsDeleted && 
                            d.EntityType.ToLower() == entityType.ToLower() && 
                            d.EntityId == entityId)
                .OrderByDescending(d => d.CreatedAt)
                .ToListAsync();

            return documents.Select(MapToDto);
        }

        public async Task<EntityFormDocumentDto?> GetByIdAsync(int id)
        {
            var document = await _context.Set<EntityFormDocument>()
                .Include(d => d.Form)
                .Where(d => d.Id == id && !d.IsDeleted)
                .FirstOrDefaultAsync();

            return document != null ? MapToDto(document) : null;
        }

        public async Task<EntityFormDocumentDto> CreateAsync(CreateEntityFormDocumentDto dto, string userId)
        {
            // Validate entity type
            var validEntityTypes = new[] { "offer", "sale", "serviceorder", "dispatch" };
            if (!validEntityTypes.Contains(dto.EntityType.ToLower()))
            {
                throw new ArgumentException($"Invalid entity type: {dto.EntityType}. Must be 'offer', 'sale', 'serviceorder', or 'dispatch'.");
            }

            // Get the form to capture current version
            var form = await _context.Set<DynamicForm>()
                .Where(f => f.Id == dto.FormId && !f.IsDeleted)
                .FirstOrDefaultAsync();

            if (form == null)
            {
                throw new KeyNotFoundException($"Form with ID {dto.FormId} not found");
            }

            // Only allow released forms
            if (form.Status != FormStatus.Released)
            {
                throw new InvalidOperationException("Only released forms can be used as documents");
            }

            // Parse status from DTO, default to Draft
            var status = FormDocumentStatus.Draft;
            if (!string.IsNullOrEmpty(dto.Status) && Enum.TryParse<FormDocumentStatus>(dto.Status, true, out var parsedStatus))
            {
                status = parsedStatus;
            }

            var document = new EntityFormDocument
            {
                EntityType = dto.EntityType.ToLower(),
                EntityId = dto.EntityId,
                FormId = dto.FormId,
                FormVersion = form.Version,
                Title = dto.Title,
                Status = status,
                Responses = dto.Responses != null 
                    ? JsonSerializer.Serialize(dto.Responses, _jsonOptions) 
                    : "{}",
                CreatedBy = userId,
                CreatedAt = DateTime.UtcNow,
                IsDeleted = false
            };

            _context.Set<EntityFormDocument>().Add(document);
            await _context.SaveChangesAsync();

            // Reload with form data
            await _context.Entry(document).Reference(d => d.Form).LoadAsync();

            return MapToDto(document);
        }

        public async Task<EntityFormDocumentDto> UpdateAsync(int id, UpdateEntityFormDocumentDto dto, string userId)
        {
            var document = await _context.Set<EntityFormDocument>()
                .Include(d => d.Form)
                .Where(d => d.Id == id && !d.IsDeleted)
                .FirstOrDefaultAsync();

            if (document == null)
            {
                throw new KeyNotFoundException($"Form document with ID {id} not found");
            }

            // Don't allow editing completed documents (except status change)
            if (document.Status == FormDocumentStatus.Completed && dto.Responses != null)
            {
                throw new InvalidOperationException("Cannot modify responses of a completed document");
            }

            // Update fields
            if (dto.Title != null)
            {
                document.Title = dto.Title;
            }

            if (dto.Responses != null)
            {
                document.Responses = JsonSerializer.Serialize(dto.Responses, _jsonOptions);
            }

            if (!string.IsNullOrEmpty(dto.Status))
            {
                if (Enum.TryParse<FormDocumentStatus>(dto.Status, true, out var newStatus))
                {
                    document.Status = newStatus;
                }
            }

            document.ModifiedBy = userId;
            document.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return MapToDto(document);
        }

        public async Task<bool> DeleteAsync(int id, string userId)
        {
            var document = await _context.Set<EntityFormDocument>()
                .Where(d => d.Id == id && !d.IsDeleted)
                .FirstOrDefaultAsync();

            if (document == null)
            {
                return false;
            }

            document.IsDeleted = true;
            document.DeletedAt = DateTime.UtcNow;
            document.DeletedBy = userId;

            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<int> CopyDocumentsToEntityAsync(string sourceEntityType, int sourceEntityId, string targetEntityType, int targetEntityId, string userId)
        {
            // Validate target entity type
            var validEntityTypes = new[] { "offer", "sale", "serviceorder", "dispatch" };
            if (!validEntityTypes.Contains(targetEntityType.ToLower()))
            {
                throw new ArgumentException($"Invalid target entity type: {targetEntityType}. Must be 'offer', 'sale', 'serviceorder', or 'dispatch'.");
            }

            // Get all documents from the source entity
            var sourceDocuments = await _context.Set<EntityFormDocument>()
                .Include(d => d.Form)
                .Where(d => !d.IsDeleted && 
                            d.EntityType.ToLower() == sourceEntityType.ToLower() && 
                            d.EntityId == sourceEntityId)
                .ToListAsync();

            if (!sourceDocuments.Any())
            {
                return 0;
            }

            var copiedCount = 0;
            foreach (var sourceDoc in sourceDocuments)
            {
                var newDocument = new EntityFormDocument
                {
                    EntityType = targetEntityType.ToLower(),
                    EntityId = targetEntityId,
                    FormId = sourceDoc.FormId,
                    FormVersion = sourceDoc.FormVersion,
                    Title = sourceDoc.Title,
                    Status = sourceDoc.Status,
                    Responses = sourceDoc.Responses,
                    CreatedBy = userId,
                    CreatedAt = DateTime.UtcNow,
                    IsDeleted = false
                };

                _context.Set<EntityFormDocument>().Add(newDocument);
                copiedCount++;
            }

            await _context.SaveChangesAsync();

            return copiedCount;
        }

        private EntityFormDocumentDto MapToDto(EntityFormDocument document)
        {
            var responses = new Dictionary<string, object>();
            try
            {
                responses = JsonSerializer.Deserialize<Dictionary<string, object>>(
                    document.Responses, _jsonOptions) ?? new Dictionary<string, object>();
            }
            catch { }

            return new EntityFormDocumentDto
            {
                Id = document.Id,
                EntityType = document.EntityType,
                EntityId = document.EntityId,
                FormId = document.FormId,
                FormVersion = document.FormVersion,
                FormNameEn = document.Form?.NameEn ?? string.Empty,
                FormNameFr = document.Form?.NameFr ?? string.Empty,
                Title = document.Title,
                Status = document.Status.ToString().ToLower(),
                Responses = responses,
                CreatedBy = document.CreatedBy,
                CreatedAt = document.CreatedAt,
                UpdatedAt = document.UpdatedAt
            };
        }
    }
}

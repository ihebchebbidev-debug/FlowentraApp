using MyApi.Data;
using MyApi.Modules.WebsiteBuilder.DTOs;
using MyApi.Modules.WebsiteBuilder.Models;
using Microsoft.EntityFrameworkCore;

namespace MyApi.Modules.WebsiteBuilder.Services
{
    public class WBPageService : IWBPageService
    {
        private readonly ApplicationDbContext _context;
        private readonly IWBActivityLogService _activityLog;
        private readonly ILogger<WBPageService> _logger;

        public WBPageService(ApplicationDbContext context, IWBActivityLogService activityLog, ILogger<WBPageService> logger)
        {
            _context = context;
            _activityLog = activityLog;
            _logger = logger;
        }

        public async Task<List<WBPageResponseDto>> GetPagesBySiteIdAsync(int siteId)
        {
            var pages = await _context.WBPages
                .AsNoTracking()
                .Where(p => p.SiteId == siteId && !p.IsDeleted)
                .OrderBy(p => p.SortOrder)
                .ToListAsync();

            return pages.Select(MapToPageDto).ToList();
        }

        public async Task<WBPageResponseDto?> GetPageByIdAsync(int id)
        {
            var page = await _context.WBPages
                .AsNoTracking()
                .Where(p => p.Id == id && !p.IsDeleted)
                .FirstOrDefaultAsync();

            return page != null ? MapToPageDto(page) : null;
        }

        public async Task<WBPageResponseDto> CreatePageAsync(CreateWBPageRequestDto createDto, string createdByUser)
        {
            try
            {
                var maxOrder = await _context.WBPages
                    .Where(p => p.SiteId == createDto.SiteId && !p.IsDeleted)
                    .MaxAsync(p => (int?)p.SortOrder) ?? -1;

                var page = new WBPage
                {
                    SiteId = createDto.SiteId,
                    Title = createDto.Title,
                    Slug = createDto.Slug ?? GenerateSlug(createDto.Title),
                    ComponentsJson = createDto.ComponentsJson ?? "[]",
                    SeoJson = createDto.SeoJson ?? $"{{\"title\":\"{createDto.Title}\"}}",
                    IsHomePage = createDto.IsHomePage,
                    SortOrder = createDto.SortOrder > 0 ? createDto.SortOrder : maxOrder + 1,
                    CreatedBy = createdByUser,
                    CreatedAt = DateTime.UtcNow
                };

                _context.WBPages.Add(page);
                await _context.SaveChangesAsync();

                // Update site's UpdatedAt
                var site = await _context.WBSites.FindAsync(createDto.SiteId);
                if (site != null)
                {
                    site.UpdatedAt = DateTime.UtcNow;
                    site.ModifiedBy = createdByUser;
                    await _context.SaveChangesAsync();
                }

                await _activityLog.LogActivityAsync(createDto.SiteId, page.Id, "create", "page", $"Page '{page.Title}' created", createdByUser);

                _logger.LogInformation("WB Page created with ID {PageId} for site {SiteId}", page.Id, createDto.SiteId);
                return MapToPageDto(page);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating WB page for site {SiteId}", createDto.SiteId);
                throw;
            }
        }

        public async Task<WBPageResponseDto?> UpdatePageAsync(int id, UpdateWBPageRequestDto updateDto, string modifiedByUser)
        {
            try
            {
                var page = await _context.WBPages
                    .Where(p => p.Id == id && !p.IsDeleted)
                    .FirstOrDefaultAsync();

                if (page == null) return null;

                if (!string.IsNullOrEmpty(updateDto.Title)) page.Title = updateDto.Title;
                if (updateDto.Slug != null) page.Slug = updateDto.Slug;
                if (updateDto.ComponentsJson != null) page.ComponentsJson = updateDto.ComponentsJson;
                if (updateDto.SeoJson != null) page.SeoJson = updateDto.SeoJson;
                if (updateDto.TranslationsJson != null) page.TranslationsJson = updateDto.TranslationsJson;
                if (updateDto.IsHomePage.HasValue) page.IsHomePage = updateDto.IsHomePage.Value;
                if (updateDto.SortOrder.HasValue) page.SortOrder = updateDto.SortOrder.Value;

                page.ModifiedBy = modifiedByUser;
                page.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                await _activityLog.LogActivityAsync(page.SiteId, page.Id, "update", "page", $"Page '{page.Title}' updated", modifiedByUser);

                return MapToPageDto(page);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating WB page {PageId}", id);
                throw;
            }
        }

        public async Task<bool> UpdatePageComponentsAsync(int id, UpdateWBPageComponentsRequestDto updateDto, string modifiedByUser)
        {
            try
            {
                var page = await _context.WBPages
                    .Where(p => p.Id == id && !p.IsDeleted)
                    .FirstOrDefaultAsync();

                if (page == null) return false;

                if (!string.IsNullOrEmpty(updateDto.Language))
                {
                    // Merge language-specific components into the existing TranslationsJson
                    var translations = new Dictionary<string, object>();
                    if (!string.IsNullOrEmpty(page.TranslationsJson))
                    {
                        try
                        {
                            translations = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, object>>(page.TranslationsJson)
                                ?? new Dictionary<string, object>();
                        }
                        catch
                        {
                            translations = new Dictionary<string, object>();
                        }
                    }

                    // Parse the incoming components and wrap them in a translation object
                    var langData = System.Text.Json.JsonSerializer.Deserialize<object>(
                        $"{{\"components\":{updateDto.ComponentsJson}}}");
                    translations[updateDto.Language] = langData!;

                    page.TranslationsJson = System.Text.Json.JsonSerializer.Serialize(translations);
                }
                else
                {
                    page.ComponentsJson = updateDto.ComponentsJson;
                }

                page.ModifiedBy = modifiedByUser;
                page.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                _logger.LogInformation("WB Page {PageId} components updated (language: {Lang})", id, updateDto.Language ?? "base");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating WB page components {PageId}", id);
                throw;
            }
        }

        public async Task<bool> DeletePageAsync(int id, string deletedByUser)
        {
            try
            {
                var page = await _context.WBPages
                    .Where(p => p.Id == id && !p.IsDeleted)
                    .FirstOrDefaultAsync();

                if (page == null) return false;

                page.IsDeleted = true;
                page.DeletedAt = DateTime.UtcNow;
                page.DeletedBy = deletedByUser;

                await _context.SaveChangesAsync();

                await _activityLog.LogActivityAsync(page.SiteId, page.Id, "delete", "page", $"Page '{page.Title}' deleted", deletedByUser);

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting WB page {PageId}", id);
                throw;
            }
        }

        public async Task<bool> ReorderPagesAsync(ReorderWBPagesRequestDto reorderDto, string modifiedByUser)
        {
            try
            {
                var pages = await _context.WBPages
                    .Where(p => p.SiteId == reorderDto.SiteId && !p.IsDeleted)
                    .ToListAsync();

                for (int i = 0; i < reorderDto.PageIds.Count; i++)
                {
                    var page = pages.FirstOrDefault(p => p.Id == reorderDto.PageIds[i]);
                    if (page != null)
                    {
                        page.SortOrder = i;
                        page.ModifiedBy = modifiedByUser;
                        page.UpdatedAt = DateTime.UtcNow;
                    }
                }

                await _context.SaveChangesAsync();
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error reordering WB pages for site {SiteId}", reorderDto.SiteId);
                throw;
            }
        }

        // ── Versioning ──

        public async Task<List<WBPageVersionResponseDto>> GetPageVersionsAsync(int pageId)
        {
            var versions = await _context.WBPageVersions
                .AsNoTracking()
                .Where(v => v.PageId == pageId)
                .OrderByDescending(v => v.VersionNumber)
                .Take(50)
                .ToListAsync();

            return versions.Select(v => new WBPageVersionResponseDto
            {
                Id = v.Id,
                PageId = v.PageId,
                SiteId = v.SiteId,
                VersionNumber = v.VersionNumber,
                ComponentsJson = v.ComponentsJson,
                ChangeMessage = v.ChangeMessage,
                CreatedAt = v.CreatedAt,
                CreatedBy = v.CreatedBy
            }).ToList();
        }

        public async Task<WBPageVersionResponseDto> SavePageVersionAsync(int pageId, CreateWBPageVersionRequestDto createDto, string createdByUser)
        {
            var page = await _context.WBPages
                .Where(p => p.Id == pageId && !p.IsDeleted)
                .FirstOrDefaultAsync();

            if (page == null) throw new InvalidOperationException("Page not found");

            var maxVersion = await _context.WBPageVersions
                .Where(v => v.PageId == pageId)
                .MaxAsync(v => (int?)v.VersionNumber) ?? 0;

            var version = new WBPageVersion
            {
                PageId = pageId,
                SiteId = page.SiteId,
                VersionNumber = maxVersion + 1,
                ComponentsJson = page.ComponentsJson,
                ChangeMessage = createDto.ChangeMessage,
                CreatedBy = createdByUser,
                CreatedAt = DateTime.UtcNow
            };

            _context.WBPageVersions.Add(version);
            await _context.SaveChangesAsync();

            // Keep only last 50 versions per page
            var oldVersions = await _context.WBPageVersions
                .Where(v => v.PageId == pageId)
                .OrderByDescending(v => v.VersionNumber)
                .Skip(50)
                .ToListAsync();

            if (oldVersions.Any())
            {
                _context.WBPageVersions.RemoveRange(oldVersions);
                await _context.SaveChangesAsync();
            }

            return new WBPageVersionResponseDto
            {
                Id = version.Id,
                PageId = version.PageId,
                SiteId = version.SiteId,
                VersionNumber = version.VersionNumber,
                ComponentsJson = version.ComponentsJson,
                ChangeMessage = version.ChangeMessage,
                CreatedAt = version.CreatedAt,
                CreatedBy = version.CreatedBy
            };
        }

        public async Task<bool> RestorePageVersionAsync(int pageId, int versionId, string modifiedByUser)
        {
            var version = await _context.WBPageVersions
                .Where(v => v.Id == versionId && v.PageId == pageId)
                .FirstOrDefaultAsync();

            if (version == null) return false;

            var page = await _context.WBPages
                .Where(p => p.Id == pageId && !p.IsDeleted)
                .FirstOrDefaultAsync();

            if (page == null) return false;

            // Save current state as a new version before restoring
            await SavePageVersionAsync(pageId, new CreateWBPageVersionRequestDto
            {
                ChangeMessage = $"Auto-save before restoring to version {version.VersionNumber}"
            }, modifiedByUser);

            page.ComponentsJson = version.ComponentsJson;
            page.ModifiedBy = modifiedByUser;
            page.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            await _activityLog.LogActivityAsync(page.SiteId, page.Id, "restore", "page",
                $"Page '{page.Title}' restored to version {version.VersionNumber}", modifiedByUser);

            return true;
        }

        // ── Helpers ──

        private static WBPageResponseDto MapToPageDto(WBPage page)
        {
            return new WBPageResponseDto
            {
                Id = page.Id,
                SiteId = page.SiteId,
                Title = page.Title,
                Slug = page.Slug,
                ComponentsJson = page.ComponentsJson,
                SeoJson = page.SeoJson,
                TranslationsJson = page.TranslationsJson,
                IsHomePage = page.IsHomePage,
                SortOrder = page.SortOrder,
                CreatedAt = page.CreatedAt,
                UpdatedAt = page.UpdatedAt,
                CreatedBy = page.CreatedBy,
            };
        }

        private static string GenerateSlug(string text)
        {
            return System.Text.RegularExpressions.Regex
                .Replace(text.ToLower(), @"[^a-z0-9]+", "-")
                .Trim('-');
        }
    }
}

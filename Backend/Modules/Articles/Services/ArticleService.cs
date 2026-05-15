using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using MyApi.Modules.Articles.Models;
using MyApi.Modules.Articles.DTOs;
using MyApi.Data;
using Microsoft.EntityFrameworkCore;

// Models: Article, ArticleCategory, InventoryTransaction, Location

namespace MyApi.Modules.Articles.Services
{
    public class ArticleService : IArticleService
    {
        private readonly ApplicationDbContext _context;

        public ArticleService(ApplicationDbContext context)
        {
            _context = context;
        }

        // =====================================================
        // Article CRUD Operations
        // =====================================================

        public async Task<ArticleListDto> GetAllArticlesAsync(
            string? type = null,
            string? category = null,
            string? status = null,
            string? location = null,
            string? search = null,
            int page = 1,
            int limit = 20,
            string? sortBy = null,
            string? sortOrder = "asc")
        {
            var query = _context.Set<Article>().AsNoTracking().Where(a => !a.IsDeleted).AsQueryable();

            // Apply filters
            if (!string.IsNullOrEmpty(category))
            {
                if (int.TryParse(category, out int categoryId))
                    query = query.Where(a => a.CategoryId == categoryId);
            }

            if (!string.IsNullOrEmpty(status))
            {
                bool isActive = status.ToLower() == "active" || status.ToLower() == "true";
                query = query.Where(a => a.IsActive == isActive);
            }

            if (!string.IsNullOrEmpty(location))
            {
                if (int.TryParse(location, out int locationId))
                    query = query.Where(a => a.LocationId == locationId);
            }

            if (!string.IsNullOrEmpty(search))
            {
                var searchLower = search.ToLower();
                query = query.Where(a =>
                    a.Name.ToLower().Contains(searchLower) ||
                    a.ArticleNumber.ToLower().Contains(searchLower) ||
                    (a.Description != null && a.Description.ToLower().Contains(searchLower)));
            }

            // Count total before pagination
            var total = await query.CountAsync();

            // Apply sorting
            query = ApplySorting(query, sortBy, sortOrder);

            // Apply pagination
            var articles = await query
                .Skip((page - 1) * limit)
                .Take(limit)
                .ToListAsync();

            return new ArticleListDto
            {
                Data = articles.Select(MapArticleToDto).ToList(),
                Pagination = new PaginationDto
                {
                    Total = total,
                    Page = page,
                    Limit = limit,
                    Pages = (int)Math.Ceiling(total / (double)limit)
                }
            };
        }

        public async Task<ArticleDto?> GetArticleByIdAsync(string id)
        {
            if (!int.TryParse(id, out int articleId))
                return null;

            var article = await _context.Set<Article>()
                .AsNoTracking()
                .FirstOrDefaultAsync(a => a.Id == articleId && !a.IsDeleted);

            return article != null ? MapArticleToDto(article) : null;
        }

        public async Task<ArticleDto> CreateArticleAsync(CreateArticleDto dto, string userId)
        {
            // Generate article number if not provided
            var articleNumber = dto.ArticleNumber;
            if (string.IsNullOrEmpty(articleNumber))
            {
                var lastArticle = await _context.Set<Article>()
                    .OrderByDescending(a => a.Id)
                    .FirstOrDefaultAsync();
                var nextNumber = (lastArticle?.Id ?? 0) + 1;
                articleNumber = $"ART-{nextNumber:D6}";
            }
            
            var article = new Article
            {
                ArticleNumber = articleNumber,
                Name = dto.Name,
                Description = dto.Description,
                CategoryId = dto.CategoryId,
                Unit = dto.Unit ?? "piece",
                PurchasePrice = dto.PurchasePrice,
                SalesPrice = dto.SalesPrice,
                StockQuantity = dto.StockQuantity,
                MinStockLevel = dto.MinStockLevel,
                LocationId = dto.LocationId,
                GroupId = dto.GroupId,
                Supplier = dto.Supplier,
                Type = dto.Type ?? "material",
                Duration = dto.Duration,  // Map duration for services
                TvaRate = dto.TvaRate,
                IsActive = dto.IsActive,
                CreatedDate = DateTime.UtcNow,
                CreatedBy = userId,
                ModifiedBy = userId
            };

            _context.Set<Article>().Add(article);
            await _context.SaveChangesAsync();

            return MapArticleToDto(article);
        }

        public async Task<ArticleDto?> UpdateArticleAsync(string id, UpdateArticleDto dto, string userId)
        {
            if (!int.TryParse(id, out int articleId))
                return null;

            var article = await _context.Set<Article>()
                .FirstOrDefaultAsync(a => a.Id == articleId && !a.IsDeleted);

            if (article == null)
                return null;

            // Update only provided fields
            if (dto.Name != null) article.Name = dto.Name;
            if (dto.ArticleNumber != null) article.ArticleNumber = dto.ArticleNumber;
            if (dto.Description != null) article.Description = dto.Description;
            if (dto.CategoryId.HasValue) article.CategoryId = dto.CategoryId;
            if (dto.Unit != null) article.Unit = dto.Unit;
            if (dto.PurchasePrice.HasValue) article.PurchasePrice = dto.PurchasePrice.Value;
            if (dto.SalesPrice.HasValue) article.SalesPrice = dto.SalesPrice.Value;
            if (dto.StockQuantity.HasValue) article.StockQuantity = dto.StockQuantity.Value;
            if (dto.MinStockLevel.HasValue) article.MinStockLevel = dto.MinStockLevel;
            if (dto.LocationId.HasValue) article.LocationId = dto.LocationId;
            if (dto.GroupId.HasValue) article.GroupId = dto.GroupId;
            if (dto.Supplier != null) article.Supplier = dto.Supplier;
            if (!string.IsNullOrEmpty(dto.Type)) article.Type = dto.Type;
            if (dto.Duration.HasValue) article.Duration = dto.Duration;  // Map duration for services
            if (dto.TvaRate.HasValue) article.TvaRate = dto.TvaRate.Value;
            if (dto.IsActive.HasValue) article.IsActive = dto.IsActive.Value;

            article.ModifiedDate = DateTime.UtcNow;
            article.ModifiedBy = userId;

            await _context.SaveChangesAsync();

            return MapArticleToDto(article);
        }

        public async Task<bool> DeleteArticleAsync(string id, string userId)
        {
            if (!int.TryParse(id, out int articleId))
                return false;

            var article = await _context.Set<Article>()
                .FirstOrDefaultAsync(a => a.Id == articleId);

            if (article == null || article.IsDeleted)
                return false;

            article.IsDeleted = true;
            article.DeletedAt = DateTime.UtcNow;
            article.DeletedBy = userId;
            
            await _context.SaveChangesAsync();

            return true;
        }

        // =====================================================
        // Inventory Transaction Operations
        // =====================================================

        public async Task<InventoryTransactionDto> CreateTransactionAsync(CreateInventoryTransactionDto dto, string userId)
        {
            var transaction = new InventoryTransaction
            {
                ArticleId = dto.ArticleId,
                TransactionType = dto.TransactionType,
                Quantity = dto.Quantity,
                TransactionDate = DateTime.UtcNow,
                Reference = dto.Reference,
                Notes = dto.Notes,
                CreatedBy = userId
            };

            _context.Set<InventoryTransaction>().Add(transaction);
            await _context.SaveChangesAsync();

            return MapTransactionToDto(transaction);
        }

        public async Task<List<InventoryTransactionDto>> GetArticleTransactionsAsync(string articleId)
        {
            if (!int.TryParse(articleId, out int artId))
                return new List<InventoryTransactionDto>();

            var transactions = await _context.Set<InventoryTransaction>()
                .Where(t => t.ArticleId == artId)
                .OrderByDescending(t => t.TransactionDate)
                .ToListAsync();

            return transactions.Select(MapTransactionToDto).ToList();
        }

        public async Task<BatchOperationResultDto> BatchUpdateStockAsync(BatchUpdateStockDto dto, string userId)
        {
            var result = new BatchOperationResultDto { Success = true };

            foreach (var item in dto.Items)
            {
                try
                {
                    var article = await _context.Set<Article>()
                        .FirstOrDefaultAsync(a => a.Id == item.Id);

                    if (article != null)
                    {
                        article.StockQuantity = item.StockQuantity;
                        article.ModifiedDate = DateTime.UtcNow;
                        result.Updated++;
                    }
                    else
                    {
                        result.Failed++;
                        result.Errors.Add($"Article {item.Id} not found");
                    }
                }
                catch (Exception ex)
                {
                    result.Failed++;
                    result.Errors.Add($"Error updating article {item.Id}: {ex.Message}");
                }
            }

            await _context.SaveChangesAsync();
            return result;
        }

        // =====================================================
        // Category Operations
        // =====================================================

        public async Task<List<ArticleCategoryDto>> GetAllCategoriesAsync()
        {
            var categories = await _context.Set<ArticleCategory>()
                .Where(c => c.IsActive)
                .ToListAsync();

            return categories.Select(c => new ArticleCategoryDto
            {
                Id = c.Id,
                Name = c.Name,
                Description = c.Description,
                ParentCategoryId = c.ParentCategoryId,
                IsActive = c.IsActive,
                CreatedDate = c.CreatedDate
            }).ToList();
        }

        public async Task<ArticleCategoryDto> CreateCategoryAsync(CreateArticleCategoryDto dto)
        {
            var category = new ArticleCategory
            {
                Name = dto.Name,
                Description = dto.Description,
                ParentCategoryId = dto.ParentCategoryId,
                IsActive = true,
                CreatedDate = DateTime.UtcNow
            };

            _context.Set<ArticleCategory>().Add(category);
            await _context.SaveChangesAsync();

            return new ArticleCategoryDto
            {
                Id = category.Id,
                Name = category.Name,
                Description = category.Description,
                ParentCategoryId = category.ParentCategoryId,
                IsActive = category.IsActive,
                CreatedDate = category.CreatedDate
            };
        }

        // =====================================================
        // Location Operations
        // =====================================================

        public async Task<List<LocationDto>> GetAllLocationsAsync()
        {
            var locations = await _context.Set<Location>()
                .Where(l => l.IsActive)
                .ToListAsync();

            return locations.Select(l => new LocationDto
            {
                Id = l.Id,
                Name = l.Name,
                Description = l.Description,
                IsActive = l.IsActive,
                CreatedDate = l.CreatedDate
            }).ToList();
        }

        public async Task<LocationDto> CreateLocationAsync(CreateLocationDto dto)
        {
            var location = new Location
            {
                Name = dto.Name,
                Description = dto.Description,
                IsActive = true,
                CreatedDate = DateTime.UtcNow
            };

            _context.Set<Location>().Add(location);
            await _context.SaveChangesAsync();

            return new LocationDto
            {
                Id = location.Id,
                Name = location.Name,
                Description = location.Description,
                IsActive = location.IsActive,
                CreatedDate = location.CreatedDate
            };
        }

        // =====================================================
        // Helper Methods
        // =====================================================

        private InventoryTransactionDto MapTransactionToDto(InventoryTransaction t)
        {
            return new InventoryTransactionDto
            {
                Id = t.Id,
                ArticleId = t.ArticleId,
                TransactionType = t.TransactionType,
                Quantity = t.Quantity,
                TransactionDate = t.TransactionDate,
                Reference = t.Reference,
                Notes = t.Notes,
                CreatedBy = t.CreatedBy
            };
        }

        private IQueryable<Article> ApplySorting(IQueryable<Article> query, string? sortBy, string? sortOrder)
        {
            var isDescending = sortOrder?.ToLower() == "desc";

            return sortBy?.ToLower() switch
            {
                "name" => isDescending ? query.OrderByDescending(a => a.Name) : query.OrderBy(a => a.Name),
                "articlenumber" => isDescending ? query.OrderByDescending(a => a.ArticleNumber) : query.OrderBy(a => a.ArticleNumber),
                "stockquantity" => isDescending ? query.OrderByDescending(a => a.StockQuantity) : query.OrderBy(a => a.StockQuantity),
                "salesprice" => isDescending ? query.OrderByDescending(a => a.SalesPrice) : query.OrderBy(a => a.SalesPrice),
                "createddate" => isDescending ? query.OrderByDescending(a => a.CreatedDate) : query.OrderBy(a => a.CreatedDate),
                _ => query.OrderByDescending(a => a.CreatedDate)
            };
        }

        private ArticleDto MapArticleToDto(Article article)
        {
            return new ArticleDto
            {
                Id = article.Id,
                ArticleNumber = article.ArticleNumber,
                Name = article.Name,
                Description = article.Description,
                CategoryId = article.CategoryId,
                Unit = article.Unit,
                PurchasePrice = article.PurchasePrice,
                SalesPrice = article.SalesPrice,
                StockQuantity = article.StockQuantity,
                MinStockLevel = article.MinStockLevel,
                LocationId = article.LocationId,
                GroupId = article.GroupId,
                Supplier = article.Supplier,
                Type = article.Type ?? "material",
                Duration = article.Duration,  // Map duration for services
                TvaRate = article.TvaRate,
                IsActive = article.IsActive,
                CreatedDate = article.CreatedDate,
                ModifiedDate = article.ModifiedDate,
                CreatedBy = article.CreatedBy,
                ModifiedBy = article.ModifiedBy
            };
        }

        // =====================================================
        // Bulk Import - Supports up to 10,000+ records
        // =====================================================

        /// <summary>
        /// High-performance bulk import with batch processing.
        /// Uses AddRange for optimal database performance.
        /// </summary>
        public async Task<BulkImportArticleResultDto> BulkImportArticlesAsync(BulkImportArticleRequestDto importRequest, string userId)
        {
            const int BATCH_SIZE = 100;

            var result = new BulkImportArticleResultDto
            {
                TotalProcessed = importRequest.Articles.Count
            };

            try
            {
                // Pre-fetch existing article numbers for duplicate detection
                var articleNumbersToCheck = importRequest.Articles
                    .Where(a => !string.IsNullOrEmpty(a.ArticleNumber))
                    .Select(a => a.ArticleNumber!.ToLower())
                    .Distinct()
                    .ToList();

                var existingArticleNumbers = await _context.Set<Article>()
                    .AsNoTracking()
                    .Where(a => articleNumbersToCheck.Contains(a.ArticleNumber.ToLower()))
                    .Select(a => new { a.Id, ArticleNumber = a.ArticleNumber.ToLower() })
                    .ToDictionaryAsync(a => a.ArticleNumber, a => a.Id);

                // Get next article number
                var lastArticle = await _context.Set<Article>()
                    .OrderByDescending(a => a.Id)
                    .FirstOrDefaultAsync();
                var nextNumber = (lastArticle?.Id ?? 0) + 1;

                // Process in batches
                var batches = importRequest.Articles
                    .Select((article, index) => new { article, index })
                    .GroupBy(x => x.index / BATCH_SIZE)
                    .Select(g => g.Select(x => x.article).ToList())
                    .ToList();

                foreach (var batch in batches)
                {
                    var newArticles = new List<Article>();
                    var articlesToUpdate = new List<(Article existing, CreateArticleRequestDto dto)>();

                    foreach (var dto in batch)
                    {
                        try
                        {
                            var articleNumber = dto.ArticleNumber?.ToLower();
                            int? existingId = null;

                            if (!string.IsNullOrEmpty(articleNumber) && existingArticleNumbers.TryGetValue(articleNumber, out var id))
                            {
                                existingId = id;
                            }

                            if (existingId.HasValue)
                            {
                                if (importRequest.SkipDuplicates)
                                {
                                    result.SkippedCount++;
                                    continue;
                                }
                                else if (importRequest.UpdateExisting)
                                {
                                    var existing = await _context.Set<Article>().FindAsync(existingId.Value);
                                    if (existing != null)
                                    {
                                        articlesToUpdate.Add((existing, dto));
                                    }
                                }
                                else
                                {
                                    result.FailedCount++;
                                    result.Errors.Add($"Duplicate article number: {dto.ArticleNumber}");
                                }
                            }
                            else
                            {
                                // Normalize type to only allow 'material' or 'service'
                                var normalizedType = dto.Type?.ToLower()?.Trim();
                                var type = (normalizedType == "service") ? "service" : "material";

                                // Support both ArticleNumber and SKU from frontend
                                var generatedNumber = !string.IsNullOrEmpty(dto.ArticleNumber) ? dto.ArticleNumber : dto.SKU;
                                if (string.IsNullOrEmpty(generatedNumber?.Trim()))
                                {
                                    generatedNumber = $"ART-{nextNumber:D6}";
                                    nextNumber++;
                                }

                                // Validate numeric fields - ensure non-negative values
                                var purchasePrice = dto.PurchasePrice ?? dto.CostPrice ?? 0;
                                var salesPrice = dto.SalesPrice ?? dto.SellPrice ?? dto.BasePrice ?? 0;
                                var stockQty = type == "service" ? 0 : (dto.StockQuantity ?? dto.Stock ?? 0);
                                var minStockLevel = dto.MinStockLevel ?? dto.MinStock;

                                if (purchasePrice < 0) purchasePrice = 0;
                                if (salesPrice < 0) salesPrice = 0;
                                if (stockQty < 0) stockQty = 0;

                                var article = new Article
                                {
                                    ArticleNumber = generatedNumber,
                                    Name = dto.Name,
                                    Description = dto.Description,
                                    CategoryId = dto.CategoryId,
                                    Unit = dto.Unit ?? "piece",
                                    PurchasePrice = purchasePrice,
                                    SalesPrice = salesPrice,
                                    StockQuantity = stockQty,
                                    MinStockLevel = minStockLevel,
                                    LocationId = dto.LocationId,
                                    Supplier = dto.Supplier,
                                    Type = type,
                                    Duration = dto.Duration,
                                    TvaRate = dto.TvaRate ?? 19.00m,
                                    IsActive = dto.IsActive ?? true,
                                    CreatedDate = DateTime.UtcNow,
                                    CreatedBy = userId
                                };

                                newArticles.Add(article);

                                if (!string.IsNullOrEmpty(generatedNumber))
                                {
                                    existingArticleNumbers[generatedNumber.ToLower()] = 0;
                                }
                            }
                        }
                        catch (Exception ex)
                        {
                            result.FailedCount++;
                            result.Errors.Add($"Failed to process article {dto.Name}: {ex.Message}");
                        }
                    }

                    // Batch insert new articles
                    if (newArticles.Any())
                    {
                        await _context.Set<Article>().AddRangeAsync(newArticles);
                        await _context.SaveChangesAsync();
                        result.SuccessCount += newArticles.Count;

                        foreach (var article in newArticles)
                        {
                            result.ImportedArticles.Add(new ArticleResponseDto
                            {
                                Id = Guid.Empty, // Convert int to display
                                Name = article.Name,
                                Type = article.Type,
                                Status = article.IsActive ? "active" : "inactive"
                            });
                        }
                    }

                    // Batch update existing articles
                    foreach (var (existing, dto) in articlesToUpdate)
                    {
                        try
                        {
                            if (!string.IsNullOrEmpty(dto.Name)) existing.Name = dto.Name;
                            if (dto.Description != null) existing.Description = dto.Description;
                            if (dto.CategoryId.HasValue) existing.CategoryId = dto.CategoryId;
                            if (!string.IsNullOrEmpty(dto.Unit)) existing.Unit = dto.Unit;
                            if (dto.PurchasePrice.HasValue) existing.PurchasePrice = dto.PurchasePrice.Value;
                            if (dto.SalesPrice.HasValue) existing.SalesPrice = dto.SalesPrice.Value;
                            if (dto.StockQuantity.HasValue) existing.StockQuantity = dto.StockQuantity.Value;
                            if (dto.MinStockLevel.HasValue) existing.MinStockLevel = dto.MinStockLevel;
                            if (dto.LocationId.HasValue) existing.LocationId = dto.LocationId;
                            if (dto.Supplier != null) existing.Supplier = dto.Supplier;
                            
                            var normalizedType = dto.Type?.ToLower()?.Trim();
                            existing.Type = (normalizedType == "service") ? "service" : "material";
                            
                            if (dto.Duration.HasValue) existing.Duration = dto.Duration;
                            existing.ModifiedDate = DateTime.UtcNow;
                            existing.ModifiedBy = userId;

                            result.SuccessCount++;
                        }
                        catch (Exception ex)
                        {
                            result.FailedCount++;
                            result.Errors.Add($"Failed to update article: {dto.ArticleNumber} - {ex.Message}");
                        }
                    }

                    if (articlesToUpdate.Any())
                    {
                        await _context.SaveChangesAsync();
                    }
                }

                return result;
            }
            catch (Exception ex)
            {
                result.Errors.Add($"Bulk import failed: {ex.Message}");
                throw;
            }
        }
    }
}

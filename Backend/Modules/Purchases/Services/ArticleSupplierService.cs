using Microsoft.EntityFrameworkCore;
using MyApi.Data;
using MyApi.Modules.Purchases.DTOs;
using MyApi.Modules.Purchases.Models;

namespace MyApi.Modules.Purchases.Services
{
    public class ArticleSupplierService : IArticleSupplierService
    {
        private readonly ApplicationDbContext _context;

        public ArticleSupplierService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<List<ArticleSupplierDto>> GetByArticleAsync(int articleId)
        {
            return await _context.ArticleSuppliers.AsNoTracking()
                .Where(a => a.ArticleId == articleId && a.IsActive && !a.IsDeleted)
                .Include(a => a.Supplier).Include(a => a.Article).Include(a => a.PriceHistory)
                .Select(a => MapToDto(a)).ToListAsync();
        }

        public async Task<List<ArticleSupplierDto>> GetBySupplierAsync(int supplierId)
        {
            return await _context.ArticleSuppliers.AsNoTracking()
                .Where(a => a.SupplierId == supplierId && a.IsActive && !a.IsDeleted)
                .Include(a => a.Article).Include(a => a.PriceHistory)
                .Select(a => MapToDto(a)).ToListAsync();
        }

        public async Task<ArticleSupplierDto?> GetByIdAsync(int id)
        {
            var entity = await _context.ArticleSuppliers.AsNoTracking()
                .Include(a => a.Article).Include(a => a.Supplier).Include(a => a.PriceHistory)
                .FirstOrDefaultAsync(a => a.Id == id && !a.IsDeleted);
            return entity == null ? null : MapToDto(entity);
        }

        public async Task<ArticleSupplierDto> CreateAsync(CreateArticleSupplierDto dto, string userId)
        {
            var entity = new ArticleSupplier
            {
                ArticleId = dto.ArticleId, SupplierId = dto.SupplierId,
                SupplierRef = dto.SupplierRef, PurchasePrice = dto.PurchasePrice,
                Currency = dto.Currency, MinOrderQty = dto.MinOrderQty,
                LeadTimeDays = dto.LeadTimeDays, IsPreferred = dto.IsPreferred,
                Notes = dto.Notes, IsActive = true, CreatedBy = userId, CreatedDate = DateTime.UtcNow
            };
            _context.ArticleSuppliers.Add(entity);
            await _context.SaveChangesAsync();
            return (await GetByIdAsync(entity.Id))!;
        }

        public async Task<ArticleSupplierDto> UpdateAsync(int id, UpdateArticleSupplierDto dto, string userId)
        {
            var entity = await _context.ArticleSuppliers.FirstOrDefaultAsync(a => a.Id == id && !a.IsDeleted)
                ?? throw new KeyNotFoundException($"ArticleSupplier {id} not found");

            // Track price change
            if (dto.PurchasePrice.HasValue && dto.PurchasePrice.Value != entity.PurchasePrice)
            {
                _context.ArticleSupplierPriceHistory.Add(new ArticleSupplierPriceHistory
                {
                    ArticleSupplierId = id, OldPrice = entity.PurchasePrice,
                    NewPrice = dto.PurchasePrice.Value, Currency = entity.Currency,
                    ChangedBy = userId, ChangedAt = DateTime.UtcNow, Reason = dto.PriceChangeReason
                });
                entity.PurchasePrice = dto.PurchasePrice.Value;
            }

            if (dto.SupplierRef != null) entity.SupplierRef = dto.SupplierRef;
            if (dto.Currency != null) entity.Currency = dto.Currency;
            if (dto.MinOrderQty.HasValue) entity.MinOrderQty = dto.MinOrderQty.Value;
            if (dto.LeadTimeDays.HasValue) entity.LeadTimeDays = dto.LeadTimeDays.Value;
            if (dto.IsPreferred.HasValue) entity.IsPreferred = dto.IsPreferred.Value;
            if (dto.IsActive.HasValue) entity.IsActive = dto.IsActive.Value;
            if (dto.Notes != null) entity.Notes = dto.Notes;
            entity.ModifiedDate = DateTime.UtcNow;
            entity.ModifiedBy = userId;

            await _context.SaveChangesAsync();
            return (await GetByIdAsync(id))!;
        }

        public async Task<bool> DeleteAsync(int id, string userId)
        {
            // Soft-delete only. Hard-deleting an ArticleSupplier would either drop
            // the row outright or fall foul of the (now Restrict) FK on
            // ArticleSupplierPriceHistory. Tombstoning the row preserves the full
            // price-change audit trail referenced by ArticleSupplierId.
            var entity = await _context.ArticleSuppliers.FirstOrDefaultAsync(a => a.Id == id && !a.IsDeleted);
            if (entity == null) return false;
            entity.IsDeleted = true;
            entity.IsActive = false; // hide from "active" lookups for any callers that still filter only on IsActive
            entity.DeletedAt = DateTime.UtcNow;
            entity.DeletedBy = userId;
            entity.ModifiedDate = DateTime.UtcNow;
            entity.ModifiedBy = userId;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<List<ArticleSupplierPriceHistoryDto>> GetPriceHistoryAsync(int articleSupplierId)
        {
            return await _context.ArticleSupplierPriceHistory.AsNoTracking()
                .Where(h => h.ArticleSupplierId == articleSupplierId)
                .OrderByDescending(h => h.ChangedAt)
                .Select(h => new ArticleSupplierPriceHistoryDto
                {
                    Id = h.Id, ArticleSupplierId = h.ArticleSupplierId,
                    OldPrice = h.OldPrice, NewPrice = h.NewPrice, Currency = h.Currency,
                    ChangedAt = h.ChangedAt, ChangedBy = h.ChangedBy, Reason = h.Reason
                }).ToListAsync();
        }

        private static ArticleSupplierDto MapToDto(ArticleSupplier a) => new()
        {
            Id = a.Id, ArticleId = a.ArticleId, ArticleName = a.Article?.Name,
            ArticleNumber = a.Article?.ArticleNumber, SupplierId = a.SupplierId,
            SupplierName = a.Supplier?.Name, SupplierRef = a.SupplierRef,
            PurchasePrice = a.PurchasePrice, Currency = a.Currency, MinOrderQty = a.MinOrderQty,
            LeadTimeDays = a.LeadTimeDays, IsPreferred = a.IsPreferred, IsActive = a.IsActive,
            Notes = a.Notes,
            PriceHistory = a.PriceHistory?.OrderByDescending(h => h.ChangedAt).Select(h => new ArticleSupplierPriceHistoryDto
            {
                Id = h.Id, ArticleSupplierId = h.ArticleSupplierId,
                OldPrice = h.OldPrice, NewPrice = h.NewPrice, Currency = h.Currency,
                ChangedAt = h.ChangedAt, ChangedBy = h.ChangedBy, Reason = h.Reason
            }).ToList(),
            CreatedDate = a.CreatedDate, CreatedBy = a.CreatedBy, ModifiedDate = a.ModifiedDate, ModifiedBy = a.ModifiedBy
        };
    }
}

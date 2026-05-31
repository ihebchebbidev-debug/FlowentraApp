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
            if (await _context.ArticleSuppliers.AnyAsync(a => a.ArticleId == dto.ArticleId && a.SupplierId == dto.SupplierId && !a.IsDeleted))
                throw new InvalidOperationException("This supplier is already linked to the article");

            await using var tx = await _context.Database.BeginTransactionAsync();
            try
            {
                if (dto.IsPreferred)
                {
                    var others = await _context.ArticleSuppliers
                        .Where(a => a.ArticleId == dto.ArticleId && a.IsPreferred && !a.IsDeleted)
                        .ToListAsync();
                    foreach (var other in others) other.IsPreferred = false;
                }

                var entity = new ArticleSupplier
                {
                    ArticleId = dto.ArticleId, SupplierId = dto.SupplierId,
                    SupplierRef = dto.SupplierRef, PurchasePrice = dto.PurchasePrice,
                    Currency = dto.Currency, MinOrderQty = dto.MinOrderQty,
                    LeadTimeDays = dto.LeadTimeDays, IsPreferred = dto.IsPreferred,
                    Notes = dto.Notes, IsActive = true, CreatedBy = userId, CreatedDate = DateTime.UtcNow
                };
                _context.ArticleSuppliers.Add(entity);
                try
                {
                    await _context.SaveChangesAsync();
                }
                catch (DbUpdateException ex) when (ex.InnerException?.Message.Contains("ux_article_suppliers_tenant_article_supplier") == true)
                {
                    // Race: another concurrent request created the same (Article, Supplier)
                    // link between our pre-check and SaveChanges. The partial unique index
                    // (see migration 20260524_Purchases_QA_Hardening.sql) caught it.
                    throw new InvalidOperationException("This supplier is already linked to the article");
                }
                await tx.CommitAsync();
                return (await GetByIdAsync(entity.Id))!;
            }
            catch
            {
                await tx.RollbackAsync();
                throw;
            }
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
            if (dto.IsPreferred.HasValue)
            {
                if (dto.IsPreferred.Value)
                {
                    await using var tx = await _context.Database.BeginTransactionAsync();
                    try
                    {
                        var others = await _context.ArticleSuppliers
                            .Where(a => a.ArticleId == entity.ArticleId && a.Id != id && a.IsPreferred && !a.IsDeleted)
                            .ToListAsync();
                        foreach (var other in others) other.IsPreferred = false;
                        entity.IsPreferred = true;
                        if (dto.IsActive.HasValue) entity.IsActive = dto.IsActive.Value;
                        if (dto.Notes != null) entity.Notes = dto.Notes;
                        entity.ModifiedDate = DateTime.UtcNow;
                        entity.ModifiedBy = userId;
                        await _context.SaveChangesAsync();
                        await tx.CommitAsync();
                    }
                    catch
                    {
                        await tx.RollbackAsync();
                        throw;
                    }
                    return (await GetByIdAsync(id))!;
                }
                entity.IsPreferred = dto.IsPreferred.Value;
            }
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

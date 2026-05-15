using Microsoft.EntityFrameworkCore;
using MyApi.Data;
using MyApi.Modules.Articles.Services;
using MyApi.Modules.Purchases.DTOs;
using MyApi.Modules.Purchases.Models;

namespace MyApi.Modules.Purchases.Services
{
    public class GoodsReceiptService : IGoodsReceiptService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<GoodsReceiptService> _logger;
        private readonly MyApi.Modules.Numbering.Services.INumberingService? _numberingService;
        private readonly IStockTransactionService? _stockService;

        public GoodsReceiptService(ApplicationDbContext context, ILogger<GoodsReceiptService> logger,
            MyApi.Modules.Numbering.Services.INumberingService? numberingService = null,
            IStockTransactionService? stockService = null)
        {
            _context = context;
            _logger = logger;
            _numberingService = numberingService;
            _stockService = stockService;
        }

        public async Task<PaginatedGoodsReceiptResponse> GetReceiptsAsync(
            int? purchaseOrderId, string? supplierId, string? status,
            DateTime? dateFrom, DateTime? dateTo, string? search,
            int page, int limit, string sortBy, string sortOrder)
        {
            var query = _context.GoodsReceipts.AsNoTracking().Where(r => !r.IsDeleted).AsQueryable();
            if (purchaseOrderId.HasValue) query = query.Where(r => r.PurchaseOrderId == purchaseOrderId.Value);
            if (!string.IsNullOrEmpty(supplierId) && int.TryParse(supplierId, out int sid))
                query = query.Where(r => r.SupplierId == sid);
            if (!string.IsNullOrEmpty(status)) query = query.Where(r => r.Status == status);
            if (dateFrom.HasValue) query = query.Where(r => r.ReceiptDate >= dateFrom.Value);
            if (dateTo.HasValue) query = query.Where(r => r.ReceiptDate <= dateTo.Value);
            if (!string.IsNullOrEmpty(search))
            {
                var s = search.ToLower();
                query = query.Where(r => (r.ReceiptNumber != null && r.ReceiptNumber.ToLower().Contains(s)) ||
                    (r.SupplierName != null && r.SupplierName.ToLower().Contains(s)));
            }
            var total = await query.CountAsync();
            query = sortOrder == "asc" ? query.OrderBy(r => r.CreatedDate) : query.OrderByDescending(r => r.CreatedDate);
            var receipts = await query.Skip((page - 1) * limit).Take(limit).Include(r => r.Items).ToListAsync();

            var poIds = receipts.Select(r => r.PurchaseOrderId).Distinct().ToList();
            var poNumbers = await _context.PurchaseOrders.AsNoTracking().Where(p => poIds.Contains(p.Id))
                .ToDictionaryAsync(p => p.Id, p => p.OrderNumber);

            return new PaginatedGoodsReceiptResponse
            {
                Receipts = receipts.Select(r => MapToDto(r, poNumbers.GetValueOrDefault(r.PurchaseOrderId))).ToList(),
                Pagination = new PurchasePaginationInfo { Page = page, Limit = limit, Total = total, TotalPages = (int)Math.Ceiling((double)total / limit) }
            };
        }

        public async Task<GoodsReceiptDto?> GetReceiptByIdAsync(int id)
        {
            var receipt = await _context.GoodsReceipts.AsNoTracking().Include(r => r.Items).FirstOrDefaultAsync(r => r.Id == id && !r.IsDeleted);
            if (receipt == null) return null;
            var poNumber = await _context.PurchaseOrders.AsNoTracking().Where(p => p.Id == receipt.PurchaseOrderId).Select(p => p.OrderNumber).FirstOrDefaultAsync();
            return MapToDto(receipt, poNumber);
        }

        public async Task<GoodsReceiptDto> CreateReceiptAsync(CreateGoodsReceiptDto dto, string userId, string? userName = null)
        {
            // Serializable isolation prevents two concurrent receipts for the same PO
            // from both passing the over-receipt check on stale ReceivedQty values.
            // EnableRetryOnFailure is on, so the user-initiated transaction has to
            // run inside the configured execution strategy or it throws on the first POST.
            int receiptId = 0;
            var strategy = _context.Database.CreateExecutionStrategy();
            await strategy.ExecuteAsync(async () =>
            {
                using var tx = await _context.Database.BeginTransactionAsync(System.Data.IsolationLevel.Serializable);
                try
                {
                    var po = await _context.PurchaseOrders.Include(p => p.Items)
                        .FirstOrDefaultAsync(p => p.Id == dto.PurchaseOrderId && !p.IsDeleted)
                        ?? throw new KeyNotFoundException($"PurchaseOrder {dto.PurchaseOrderId} not found");

                    // Status guard: only "ordered" or "partially_received" POs can receive goods.
                    if (po.Status != "ordered" && po.Status != "partially_received")
                        throw new InvalidOperationException($"Cannot receive goods on a PO in status '{po.Status}'");

                    // Over-receipt guard: every requested qty must fit within remaining ordered qty.
                    if (dto.Items?.Any() == true)
                    {
                        foreach (var itemDto in dto.Items)
                        {
                            var poItem = po.Items?.FirstOrDefault(i => i.Id == itemDto.PurchaseOrderItemId);
                            if (poItem == null)
                                throw new InvalidOperationException($"PurchaseOrderItem {itemDto.PurchaseOrderItemId} does not belong to PO {po.Id}");
                            var remaining = poItem.Quantity - poItem.ReceivedQty;
                            if (itemDto.QuantityReceived < 0)
                                throw new InvalidOperationException("QuantityReceived cannot be negative");
                            if (itemDto.QuantityReceived > remaining)
                                throw new InvalidOperationException($"Over-receipt for item {poItem.Id}: requested {itemDto.QuantityReceived}, remaining {remaining}");
                        }
                    }

                    string receiptNumber;
                    try { receiptNumber = _numberingService != null ? await _numberingService.GetNextAsync("GoodsReceipt") : $"GR-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString()[..5].ToUpper()}"; }
                    catch { receiptNumber = $"GR-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString()[..5].ToUpper()}"; }

                    var receipt = new GoodsReceipt
                    {
                        ReceiptNumber = receiptNumber,
                        PurchaseOrderId = po.Id,
                        SupplierId = po.SupplierId,
                        SupplierName = po.SupplierName,
                        ReceiptDate = dto.ReceiptDate ?? DateTime.UtcNow,
                        Status = "partial",
                        DeliveryNoteRef = dto.DeliveryNoteRef,
                        Notes = dto.Notes,
                        ReceivedBy = userId,
                        CreatedBy = userId,
                        CreatedDate = DateTime.UtcNow
                    };

                    _context.GoodsReceipts.Add(receipt);
                    await _context.SaveChangesAsync();

                    var stockUpdates = new List<(int articleId, decimal qty)>();

                    if (dto.Items?.Any() == true)
                    {
                        foreach (var itemDto in dto.Items)
                        {
                            var poItem = po.Items!.First(i => i.Id == itemDto.PurchaseOrderItemId);
                            var grItem = new GoodsReceiptItem
                            {
                                GoodsReceiptId = receipt.Id,
                                PurchaseOrderItemId = itemDto.PurchaseOrderItemId,
                                ArticleId = poItem.ArticleId,
                                ArticleName = poItem.ArticleName,
                                ArticleNumber = poItem.ArticleNumber,
                                OrderedQty = poItem.Quantity,
                                QuantityReceived = itemDto.QuantityReceived,
                                QuantityRejected = itemDto.QuantityRejected,
                                RejectionReason = itemDto.RejectionReason,
                                LocationId = itemDto.LocationId,
                                Notes = itemDto.Notes
                            };
                            _context.GoodsReceiptItems.Add(grItem);
                            poItem.ReceivedQty += itemDto.QuantityReceived;

                            if (poItem.ArticleId.HasValue && itemDto.QuantityReceived > 0)
                                stockUpdates.Add((poItem.ArticleId.Value, itemDto.QuantityReceived));
                        }
                        await _context.SaveChangesAsync();
                    }

                    var allFullyReceived = po.Items?.All(i => i.ReceivedQty >= i.Quantity) ?? false;
                    var anyReceived = po.Items?.Any(i => i.ReceivedQty > 0) ?? false;
                    if (allFullyReceived)
                    {
                        po.Status = "received";
                        po.ActualDelivery = DateTime.UtcNow;
                        receipt.Status = "complete";

                        // Mark all prior non-deleted receipts for this PO as complete too.
                        // Without this, earlier "partial" receipts stay partial forever even
                        // though the PO is now fully satisfied by the cumulative receipts.
                        var priorReceipts = await _context.GoodsReceipts
                            .Where(r => r.PurchaseOrderId == po.Id
                                        && r.Id != receipt.Id
                                        && !r.IsDeleted
                                        && r.Status != "complete")
                            .ToListAsync();
                        foreach (var pr in priorReceipts)
                        {
                            pr.Status = "complete";
                            pr.ModifiedDate = DateTime.UtcNow;
                            pr.ModifiedBy = userId;
                        }
                    }
                    else if (anyReceived)
                    {
                        po.Status = "partially_received";
                    }

                    _context.PurchaseActivities.Add(new PurchaseActivity
                    {
                        EntityType = "goods_receipt", EntityId = receipt.Id, ActivityType = "created",
                        Description = $"Goods receipt {receiptNumber} created for PO {po.OrderNumber}",
                        PerformedBy = userId, PerformedByName = userName, PerformedAt = DateTime.UtcNow
                    });
                    await _context.SaveChangesAsync();

                    // Increment stock for received articles. Done inside the same transaction
                    // so a stock-write failure rolls back the receipt and PO updates.
                    if (_stockService != null)
                    {
                        foreach (var (articleId, qty) in stockUpdates)
                        {
                            await _stockService.AddStockAsync(
                                articleId, qty,
                                reason: "goods_receipt",
                                userId: userId,
                                notes: $"Goods receipt {receiptNumber} (PO {po.OrderNumber})");
                        }
                    }

                    await tx.CommitAsync();
                    receiptId = receipt.Id;
                }
                catch
                {
                    await tx.RollbackAsync();
                    throw;
                }
            });

            return (await GetReceiptByIdAsync(receiptId))!;
        }

        // Editable receipts. Each item line is reconciled by DELTA against the
        // PO's ReceivedQty and the article stock so the cumulative invariant
        //   Σ receipt.QuantityReceived (live) == poItem.ReceivedQty
        // is preserved across create / update / delete. The whole flow runs under
        // Serializable isolation + the EF execution strategy, mirroring create,
        // because two concurrent edits on the same receipt would otherwise both
        // base their delta on a stale snapshot and double-apply stock movements.
        public async Task<GoodsReceiptDto> UpdateReceiptAsync(int id, UpdateGoodsReceiptDto dto, string userId, string? userName = null)
        {
            // Linked-invoice check is also re-asserted INSIDE the transaction below
            // (TOCTOU): an invoice could be created against this receipt between the
            // pre-check and the lock acquisition. We keep the cheap pre-check to fail
            // fast on the common case without paying for a serializable transaction.
            var linkedInvoiceExists = await _context.SupplierInvoices
                .AnyAsync(i => i.GoodsReceiptId == id && !i.IsDeleted);
            if (linkedInvoiceExists)
                throw new InvalidOperationException($"Cannot edit goods receipt: it is referenced by one or more supplier invoices");

            var strategy = _context.Database.CreateExecutionStrategy();
            await strategy.ExecuteAsync(async () =>
            {
                using var tx = await _context.Database.BeginTransactionAsync(System.Data.IsolationLevel.Serializable);
                try
                {
                    var receipt = await _context.GoodsReceipts.Include(r => r.Items)
                        .FirstOrDefaultAsync(r => r.Id == id && !r.IsDeleted)
                        ?? throw new KeyNotFoundException($"GoodsReceipt {id} not found");

                    // Re-assert linked-invoice block under serializable isolation so a
                    // concurrent invoice creation can't slip in between the pre-check
                    // and our stock/qty mutations.
                    var linkedInvoiceUnderLock = await _context.SupplierInvoices
                        .AnyAsync(i => i.GoodsReceiptId == id && !i.IsDeleted);
                    if (linkedInvoiceUnderLock)
                        throw new InvalidOperationException($"Cannot edit goods receipt: it is referenced by one or more supplier invoices");

                    var po = await _context.PurchaseOrders.Include(p => p.Items)
                        .FirstOrDefaultAsync(p => p.Id == receipt.PurchaseOrderId && !p.IsDeleted)
                        ?? throw new KeyNotFoundException($"PurchaseOrder {receipt.PurchaseOrderId} not found");

                    // Header fields (no PO/Supplier mutation — those are receipt identity).
                    if (dto.ReceiptDate.HasValue) receipt.ReceiptDate = dto.ReceiptDate.Value;
                    if (dto.DeliveryNoteRef != null) receipt.DeliveryNoteRef = dto.DeliveryNoteRef;
                    if (dto.Notes != null) receipt.Notes = dto.Notes;

                    // ── Item reconciliation ──
                    // Net stock delta per article: positive = add to stock, negative = remove.
                    var stockDeltas = new Dictionary<int, decimal>();
                    void AddDelta(int articleId, decimal qty)
                    {
                        if (qty == 0) return;
                        stockDeltas[articleId] = stockDeltas.GetValueOrDefault(articleId) + qty;
                    }

                    if (dto.Items != null)
                    {
                        var existingById = receipt.Items?.ToDictionary(i => i.Id) ?? new Dictionary<int, GoodsReceiptItem>();
                        var keptIds = new HashSet<int>();

                        foreach (var line in dto.Items)
                        {
                            if (line.QuantityReceived < 0)
                                throw new InvalidOperationException("QuantityReceived cannot be negative");

                            var poItem = po.Items?.FirstOrDefault(i => i.Id == line.PurchaseOrderItemId)
                                ?? throw new InvalidOperationException($"PurchaseOrderItem {line.PurchaseOrderItemId} does not belong to PO {po.Id}");

                            if (line.Id.HasValue && line.Id.Value > 0 && existingById.TryGetValue(line.Id.Value, out var existing))
                            {
                                // UPDATE existing line — apply delta to PO.ReceivedQty + stock.
                                if (existing.PurchaseOrderItemId != line.PurchaseOrderItemId)
                                    throw new InvalidOperationException($"Cannot change PurchaseOrderItemId on existing receipt item {existing.Id}");

                                var oldQty = existing.QuantityReceived;
                                var newQty = line.QuantityReceived;
                                var delta = newQty - oldQty;

                                // Over-receipt guard against the PO line: remaining capacity
                                // is poItem.Quantity - (poItem.ReceivedQty - oldQty + newQty)
                                // ⇒ remainingAfter = poItem.Quantity - poItem.ReceivedQty - delta
                                if (poItem.Quantity - poItem.ReceivedQty - delta < 0)
                                    throw new InvalidOperationException(
                                        $"Over-receipt for PO item {poItem.Id}: new qty {newQty} would exceed remaining capacity");

                                poItem.ReceivedQty += delta;
                                existing.QuantityReceived = newQty;
                                existing.QuantityRejected = line.QuantityRejected;
                                existing.RejectionReason = line.RejectionReason;
                                existing.LocationId = line.LocationId;
                                existing.Notes = line.Notes;
                                keptIds.Add(existing.Id);

                                if (poItem.ArticleId.HasValue && delta != 0)
                                    AddDelta(poItem.ArticleId.Value, delta);
                            }
                            else
                            {
                                // NEW line — full over-receipt check, full stock add.
                                var remaining = poItem.Quantity - poItem.ReceivedQty;
                                if (line.QuantityReceived > remaining)
                                    throw new InvalidOperationException(
                                        $"Over-receipt for PO item {poItem.Id}: requested {line.QuantityReceived}, remaining {remaining}");

                                var grItem = new GoodsReceiptItem
                                {
                                    GoodsReceiptId = receipt.Id,
                                    PurchaseOrderItemId = line.PurchaseOrderItemId,
                                    ArticleId = poItem.ArticleId,
                                    ArticleName = poItem.ArticleName,
                                    ArticleNumber = poItem.ArticleNumber,
                                    OrderedQty = poItem.Quantity,
                                    QuantityReceived = line.QuantityReceived,
                                    QuantityRejected = line.QuantityRejected,
                                    RejectionReason = line.RejectionReason,
                                    LocationId = line.LocationId,
                                    Notes = line.Notes
                                };
                                _context.GoodsReceiptItems.Add(grItem);
                                poItem.ReceivedQty += line.QuantityReceived;

                                if (poItem.ArticleId.HasValue && line.QuantityReceived > 0)
                                    AddDelta(poItem.ArticleId.Value, line.QuantityReceived);
                            }
                        }

                        // REMOVED items: anything in the original receipt not present in the
                        // payload is treated as deleted — reverse PO.ReceivedQty and stock.
                        if (receipt.Items != null)
                        {
                            var toRemove = receipt.Items.Where(i => !keptIds.Contains(i.Id)).ToList();
                            foreach (var rm in toRemove)
                            {
                                var poItem = po.Items?.FirstOrDefault(i => i.Id == rm.PurchaseOrderItemId);
                                if (poItem != null)
                                    poItem.ReceivedQty = Math.Max(0, poItem.ReceivedQty - rm.QuantityReceived);
                                if (rm.ArticleId.HasValue && rm.QuantityReceived > 0)
                                    AddDelta(rm.ArticleId.Value, -rm.QuantityReceived);
                                _context.GoodsReceiptItems.Remove(rm);
                            }
                        }
                    }

                    // Re-derive PO + sibling receipt statuses from the fresh ReceivedQty totals.
                    var allFullyReceived = po.Items?.All(i => i.ReceivedQty >= i.Quantity) ?? false;
                    var anyReceived = po.Items?.Any(i => i.ReceivedQty > 0) ?? false;
                    if (allFullyReceived)
                    {
                        po.Status = "received";
                        po.ActualDelivery ??= DateTime.UtcNow;
                        receipt.Status = "complete";

                        var siblings = await _context.GoodsReceipts
                            .Where(r => r.PurchaseOrderId == po.Id && r.Id != receipt.Id
                                        && !r.IsDeleted && r.Status != "complete")
                            .ToListAsync();
                        foreach (var s in siblings)
                        {
                            s.Status = "complete";
                            s.ModifiedDate = DateTime.UtcNow;
                            s.ModifiedBy = userId;
                        }
                    }
                    else
                    {
                        po.Status = anyReceived ? "partially_received" : "ordered";
                        if (!anyReceived) po.ActualDelivery = null;
                        // Demote sibling receipts that were promoted to "complete" while the
                        // PO was fully received but no longer is, keeping receipt status
                        // consistent with the cumulative-receipt rule.
                        var siblings = await _context.GoodsReceipts
                            .Where(r => r.PurchaseOrderId == po.Id && r.Id != receipt.Id
                                        && !r.IsDeleted && r.Status == "complete")
                            .ToListAsync();
                        foreach (var s in siblings)
                        {
                            s.Status = "partial";
                            s.ModifiedDate = DateTime.UtcNow;
                            s.ModifiedBy = userId;
                        }
                        if (receipt.Status == "complete") receipt.Status = "partial";
                    }

                    receipt.ModifiedDate = DateTime.UtcNow;
                    receipt.ModifiedBy = userId;

                    _context.PurchaseActivities.Add(new PurchaseActivity
                    {
                        EntityType = "goods_receipt", EntityId = receipt.Id, ActivityType = "updated",
                        Description = $"Goods receipt {receipt.ReceiptNumber} updated (items reconciled)",
                        PerformedBy = userId, PerformedByName = userName, PerformedAt = DateTime.UtcNow
                    });

                    await _context.SaveChangesAsync();

                    // Apply net stock movements last so a failure rolls back receipt + PO.
                    if (_stockService != null)
                    {
                        foreach (var (articleId, delta) in stockDeltas)
                        {
                            if (delta > 0)
                                await _stockService.AddStockAsync(articleId, delta,
                                    reason: "goods_receipt_update",
                                    userId: userId,
                                    notes: $"Receipt {receipt.ReceiptNumber} edited (+{delta})");
                            else if (delta < 0)
                                await _stockService.RemoveStockAsync(articleId, -delta,
                                    reason: "goods_receipt_update",
                                    userId: userId,
                                    notes: $"Receipt {receipt.ReceiptNumber} edited ({delta})");
                        }
                    }

                    await tx.CommitAsync();
                }
                catch
                {
                    await tx.RollbackAsync();
                    throw;
                }
            });

            return (await GetReceiptByIdAsync(id))!;
        }

        public async Task<bool> DeleteReceiptAsync(int id, string userId, string? userName = null)
        {
            var receipt = await _context.GoodsReceipts.Include(r => r.Items).FirstOrDefaultAsync(r => r.Id == id && !r.IsDeleted);
            if (receipt == null) return false;

            // Block deletion if any non-deleted SupplierInvoice references this receipt.
            // Otherwise we'd leave a dangling SupplierInvoice.GoodsReceiptId and the
            // stock reversal below would create a phantom decrement against goods that
            // were already invoiced (and likely paid).
            var linkedInvoiceExists = await _context.SupplierInvoices
                .AnyAsync(i => i.GoodsReceiptId == id && !i.IsDeleted);
            if (linkedInvoiceExists)
                throw new InvalidOperationException($"Cannot delete goods receipt {receipt.ReceiptNumber}: it is referenced by one or more supplier invoices");

            // Wrap the user-initiated transaction in the configured execution strategy
            // — required because EnableRetryOnFailure is on for the Npgsql provider.
            // Serializable isolation + a re-check of the linked-invoice block inside
            // the tx prevents a TOCTOU where an invoice gets created against this
            // receipt between the pre-check and the stock reversal below.
            var strategy = _context.Database.CreateExecutionStrategy();
            await strategy.ExecuteAsync(async () =>
            {
                using var tx = await _context.Database.BeginTransactionAsync(System.Data.IsolationLevel.Serializable);
                try
                {
                    var linkedInvoiceUnderLock = await _context.SupplierInvoices
                        .AnyAsync(i => i.GoodsReceiptId == id && !i.IsDeleted);
                    if (linkedInvoiceUnderLock)
                        throw new InvalidOperationException($"Cannot delete goods receipt {receipt.ReceiptNumber}: it is referenced by one or more supplier invoices");

                    var po = await _context.PurchaseOrders.Include(p => p.Items)
                        .FirstOrDefaultAsync(p => p.Id == receipt.PurchaseOrderId && !p.IsDeleted);

                    var stockReversals = new List<(int articleId, decimal qty)>();

                    if (po != null && receipt.Items != null)
                    {
                        foreach (var grItem in receipt.Items)
                        {
                            var poItem = po.Items?.FirstOrDefault(i => i.Id == grItem.PurchaseOrderItemId);
                            if (poItem != null)
                            {
                                poItem.ReceivedQty = Math.Max(0, poItem.ReceivedQty - grItem.QuantityReceived);
                            }
                            if (grItem.ArticleId.HasValue && grItem.QuantityReceived > 0)
                                stockReversals.Add((grItem.ArticleId.Value, grItem.QuantityReceived));
                        }

                        var allFullyReceived = po.Items?.All(i => i.ReceivedQty >= i.Quantity) ?? false;
                        var anyReceived = po.Items?.Any(i => i.ReceivedQty > 0) ?? false;
                        if (allFullyReceived) po.Status = "received";
                        else if (anyReceived) po.Status = "partially_received";
                        else { po.Status = "ordered"; po.ActualDelivery = null; }

                        // If the PO is no longer fully received after this deletion,
                        // sibling receipts that were auto-promoted to "complete" must
                        // revert to "partial" so receipt status stays consistent with
                        // the cumulative-receipt rule.
                        if (!allFullyReceived)
                        {
                            var siblings = await _context.GoodsReceipts
                                .Where(r => r.PurchaseOrderId == po.Id
                                            && r.Id != receipt.Id
                                            && !r.IsDeleted
                                            && r.Status == "complete")
                                .ToListAsync();
                            foreach (var s in siblings)
                            {
                                s.Status = "partial";
                                s.ModifiedDate = DateTime.UtcNow;
                                s.ModifiedBy = userId;
                            }
                        }
                    }

                    // SOFT-DELETE: preserve receipt + items rows for audit. The receipt
                    // disappears from list/detail queries (filtered by !IsDeleted) but
                    // remains queryable for historical reports, stock-transaction
                    // traceability, and supplier-invoice reconciliation.
                    receipt.IsDeleted = true;
                    receipt.DeletedAt = DateTime.UtcNow;
                    receipt.DeletedBy = userId;
                    receipt.ModifiedDate = DateTime.UtcNow;
                    receipt.ModifiedBy = userId;

                    _context.PurchaseActivities.Add(new PurchaseActivity
                    {
                        EntityType = "goods_receipt", EntityId = id, ActivityType = "deleted",
                        Description = $"Goods receipt {receipt.ReceiptNumber} soft-deleted, received quantities reversed",
                        PerformedBy = userId, PerformedByName = userName, PerformedAt = DateTime.UtcNow
                    });

                    await _context.SaveChangesAsync();

                    // Reverse stock movements that the receipt had created.
                    if (_stockService != null)
                    {
                        foreach (var (articleId, qty) in stockReversals)
                        {
                            try
                            {
                                await _stockService.RemoveStockAsync(
                                    articleId, qty,
                                    reason: "goods_receipt_reversal",
                                    userId: userId,
                                    notes: $"Reversal of receipt {receipt.ReceiptNumber}");
                            }
                            catch (Exception ex)
                            {
                                _logger.LogWarning(ex, "Stock reversal failed for article {ArticleId} qty {Qty} on receipt {ReceiptId}", articleId, qty, id);
                                throw;
                            }
                        }
                    }

                    await tx.CommitAsync();
                }
                catch
                {
                    await tx.RollbackAsync();
                    throw;
                }
            });

            return true;
        }

        private static GoodsReceiptDto MapToDto(GoodsReceipt r, string? poNumber) => new()
        {
            Id = r.Id, ReceiptNumber = r.ReceiptNumber, PurchaseOrderId = r.PurchaseOrderId,
            PurchaseOrderNumber = poNumber, SupplierId = r.SupplierId, SupplierName = r.SupplierName,
            ReceiptDate = r.ReceiptDate, Status = r.Status, DeliveryNoteRef = r.DeliveryNoteRef,
            Notes = r.Notes, ReceivedBy = r.ReceivedBy, ReceivedByName = r.ReceivedByName,
            Items = r.Items?.Select(i => new GoodsReceiptItemDto
            {
                Id = i.Id, GoodsReceiptId = i.GoodsReceiptId, PurchaseOrderItemId = i.PurchaseOrderItemId,
                ArticleId = i.ArticleId, ArticleName = i.ArticleName, ArticleNumber = i.ArticleNumber,
                OrderedQty = i.OrderedQty, QuantityReceived = i.QuantityReceived, QuantityRejected = i.QuantityRejected,
                RejectionReason = i.RejectionReason, LocationId = i.LocationId, Notes = i.Notes
            }).ToList(),
            CreatedDate = r.CreatedDate, CreatedBy = r.CreatedBy, ModifiedDate = r.ModifiedDate, ModifiedBy = r.ModifiedBy
        };
    }
}

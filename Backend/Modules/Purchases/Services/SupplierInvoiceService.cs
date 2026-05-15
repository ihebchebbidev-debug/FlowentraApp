using Microsoft.EntityFrameworkCore;
using MyApi.Data;
using MyApi.Modules.Purchases.DTOs;
using MyApi.Modules.Purchases.Models;

namespace MyApi.Modules.Purchases.Services
{
    public class SupplierInvoiceService : ISupplierInvoiceService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<SupplierInvoiceService> _logger;
        private readonly MyApi.Modules.Numbering.Services.INumberingService? _numberingService;

        public SupplierInvoiceService(ApplicationDbContext context, ILogger<SupplierInvoiceService> logger,
            MyApi.Modules.Numbering.Services.INumberingService? numberingService = null)
        {
            _context = context;
            _logger = logger;
            _numberingService = numberingService;
        }

        public async Task<PaginatedSupplierInvoiceResponse> GetInvoicesAsync(
            string? status, string? supplierId, bool? rsApplicable,
            DateTime? dateFrom, DateTime? dateTo, string? search,
            int page, int limit, string sortBy, string sortOrder)
        {
            var query = _context.SupplierInvoices.AsNoTracking().Where(i => !i.IsDeleted).AsQueryable();
            if (!string.IsNullOrEmpty(status)) query = query.Where(i => i.Status == status);
            if (!string.IsNullOrEmpty(supplierId) && int.TryParse(supplierId, out int sid))
                query = query.Where(i => i.SupplierId == sid);
            if (rsApplicable.HasValue) query = query.Where(i => i.RsApplicable == rsApplicable.Value);
            if (dateFrom.HasValue) query = query.Where(i => i.InvoiceDate >= dateFrom.Value);
            if (dateTo.HasValue) query = query.Where(i => i.InvoiceDate <= dateTo.Value);
            if (!string.IsNullOrEmpty(search))
            {
                var s = search.ToLower();
                query = query.Where(i => (i.InvoiceNumber != null && i.InvoiceNumber.ToLower().Contains(s)) ||
                    (i.SupplierName != null && i.SupplierName.ToLower().Contains(s)));
            }
            var total = await query.CountAsync();
            query = sortOrder == "asc" ? query.OrderBy(i => i.CreatedDate) : query.OrderByDescending(i => i.CreatedDate);
            var invoices = await query.Skip((page - 1) * limit).Take(limit).Include(i => i.Items).ToListAsync();

            var poIds = invoices.Where(i => i.PurchaseOrderId.HasValue).Select(i => i.PurchaseOrderId!.Value).Distinct().ToList();
            var poNumbers = await _context.PurchaseOrders.AsNoTracking().Where(p => poIds.Contains(p.Id))
                .ToDictionaryAsync(p => p.Id, p => p.OrderNumber);

            return new PaginatedSupplierInvoiceResponse
            {
                Invoices = invoices.Select(i => MapToDto(i, i.PurchaseOrderId.HasValue ? poNumbers.GetValueOrDefault(i.PurchaseOrderId.Value) : null)).ToList(),
                Pagination = new PurchasePaginationInfo { Page = page, Limit = limit, Total = total, TotalPages = (int)Math.Ceiling((double)total / limit) }
            };
        }

        public async Task<SupplierInvoiceDto?> GetInvoiceByIdAsync(int id)
        {
            var inv = await _context.SupplierInvoices.AsNoTracking().Include(i => i.Items).FirstOrDefaultAsync(i => i.Id == id && !i.IsDeleted);
            if (inv == null) return null;
            var poNumber = inv.PurchaseOrderId.HasValue
                ? await _context.PurchaseOrders.AsNoTracking().Where(p => p.Id == inv.PurchaseOrderId.Value).Select(p => p.OrderNumber).FirstOrDefaultAsync()
                : null;
            return MapToDto(inv, poNumber);
        }

        public async Task<SupplierInvoiceDto> CreateInvoiceAsync(CreateSupplierInvoiceDto dto, string userId, string? userName = null)
        {
            var supplier = await _context.Contacts.FindAsync(dto.SupplierId)
                ?? throw new KeyNotFoundException($"Supplier {dto.SupplierId} not found");

            // Cross-entity integrity: linked PO and GR must belong to the same supplier
            // as the invoice. Otherwise an invoice for Supplier A could reference
            // Supplier B's PO/items, breaking reporting and the items integrity below.
            if (dto.PurchaseOrderId.HasValue)
            {
                var po = await _context.PurchaseOrders.AsNoTracking()
                    .FirstOrDefaultAsync(p => p.Id == dto.PurchaseOrderId.Value && !p.IsDeleted)
                    ?? throw new KeyNotFoundException($"PurchaseOrder {dto.PurchaseOrderId} not found");
                if (po.SupplierId != dto.SupplierId)
                    throw new InvalidOperationException($"PurchaseOrder {po.Id} belongs to a different supplier");
            }
            if (dto.GoodsReceiptId.HasValue)
            {
                var gr = await _context.GoodsReceipts.AsNoTracking()
                    .FirstOrDefaultAsync(g => g.Id == dto.GoodsReceiptId.Value)
                    ?? throw new KeyNotFoundException($"GoodsReceipt {dto.GoodsReceiptId} not found");
                if (gr.SupplierId != dto.SupplierId)
                    throw new InvalidOperationException($"GoodsReceipt {gr.Id} belongs to a different supplier");
                if (dto.PurchaseOrderId.HasValue && gr.PurchaseOrderId != dto.PurchaseOrderId.Value)
                    throw new InvalidOperationException($"GoodsReceipt {gr.Id} does not belong to PO {dto.PurchaseOrderId}");
            }

            string invoiceNumber;
            try { invoiceNumber = _numberingService != null ? await _numberingService.GetNextAsync("SupplierInvoice") : $"SI-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString()[..5].ToUpper()}"; }
            catch { invoiceNumber = $"SI-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString()[..5].ToUpper()}"; }

            var invoice = new SupplierInvoice
            {
                InvoiceNumber = invoiceNumber,
                SupplierInvoiceRef = dto.SupplierInvoiceRef,
                SupplierId = dto.SupplierId,
                SupplierName = supplier.Name ?? string.Empty,
                PurchaseOrderId = dto.PurchaseOrderId,
                GoodsReceiptId = dto.GoodsReceiptId,
                InvoiceDate = dto.InvoiceDate,
                DueDate = dto.DueDate,
                Status = "draft",
                Currency = dto.Currency,
                Discount = dto.Discount,
                DiscountType = dto.DiscountType,
                FiscalStamp = dto.FiscalStamp,
                Notes = dto.Notes,
                RsApplicable = dto.RsApplicable,
                RsTypeCode = dto.RsTypeCode,
                CreatedBy = userId,
                CreatedDate = DateTime.UtcNow
            };

            // Validate PO-item linkage BEFORE inserting anything so a bad batch doesn't
            // leave an orphan invoice header. Was: header was saved, items validated,
            // throw → empty invoice persisted forever.
            if (dto.Items?.Any() == true)
            {
                var linkedPoItemIds = dto.Items.Where(i => i.PurchaseOrderItemId.HasValue)
                                               .Select(i => i.PurchaseOrderItemId!.Value)
                                               .Distinct().ToList();
                if (linkedPoItemIds.Count > 0)
                {
                    if (!dto.PurchaseOrderId.HasValue)
                        throw new InvalidOperationException("Cannot link PO items to an invoice that has no PurchaseOrderId");
                    var validIds = await _context.PurchaseOrderItems
                        .Where(p => linkedPoItemIds.Contains(p.Id) && p.PurchaseOrderId == dto.PurchaseOrderId.Value)
                        .Select(p => p.Id).ToListAsync();
                    var orphans = linkedPoItemIds.Except(validIds).ToList();
                    if (orphans.Count > 0)
                        throw new InvalidOperationException($"PurchaseOrderItem(s) [{string.Join(",", orphans)}] do not belong to PO {dto.PurchaseOrderId}");
                }
            }

            // EnableRetryOnFailure requires user-initiated transactions to go through
            // an execution strategy (same fix as PurchaseOrderService.CreateOrderAsync).
            var strategy = _context.Database.CreateExecutionStrategy();
            await strategy.ExecuteAsync(async () =>
            {
                using var tx = await _context.Database.BeginTransactionAsync();
                try
                {
                    _context.SupplierInvoices.Add(invoice);
                    await _context.SaveChangesAsync();

                    if (dto.Items?.Any() == true)
                    {
                        var items = dto.Items.Select((item, idx) => new SupplierInvoiceItem
                        {
                            SupplierInvoiceId = invoice.Id,
                            PurchaseOrderItemId = item.PurchaseOrderItemId,
                            ArticleId = item.ArticleId,
                            ArticleName = item.ArticleName,
                            Description = item.Description,
                            Quantity = item.Quantity,
                            UnitPrice = item.UnitPrice,
                            TaxRate = item.TaxRate,
                            // LineTotal is tax-EXCLUSIVE so Sum(LineTotal) reconciles to SubTotal.
                            LineTotal = item.Quantity * item.UnitPrice,
                            DisplayOrder = idx
                        }).ToList();
                        _context.SupplierInvoiceItems.AddRange(items);
                        await _context.SaveChangesAsync();

                        // Single source of truth for totals.
                        await RecalculateInvoiceTotalsAsync(invoice.Id);
                    }

                    _context.PurchaseActivities.Add(new PurchaseActivity
                    {
                        EntityType = "supplier_invoice", EntityId = invoice.Id, ActivityType = "created",
                        Description = $"Supplier invoice {invoiceNumber} created",
                        PerformedBy = userId, PerformedByName = userName, PerformedAt = DateTime.UtcNow
                    });
                    await _context.SaveChangesAsync();

                    // Keep PO.PaymentStatus derived from the sum of its non-deleted,
                    // non-cancelled invoices (totalPaid vs totalDue).
                    if (invoice.PurchaseOrderId.HasValue)
                        await SyncPurchaseOrderPaymentStatusAsync(invoice.PurchaseOrderId.Value);

                    await tx.CommitAsync();
                }
                catch
                {
                    await tx.RollbackAsync();
                    throw;
                }
            });

            return (await GetInvoiceByIdAsync(invoice.Id))!;
        }

        public async Task<SupplierInvoiceDto> UpdateInvoiceAsync(int id, UpdateSupplierInvoiceDto dto, string userId, string? userName = null)
        {
            // Wrap the entire mutation in a transaction with a SELECT...FOR UPDATE lock
            // on the invoice row. Without this, two concurrent PATCHes that both set
            // AmountPaid (e.g., two payment recordings posted from different tabs)
            // each read a stale snapshot, compute "paid" status against the same
            // pre-payment AmountPaid, and the second SaveChangesAsync overwrites the
            // first — silently losing a payment and producing wrong status.
            //
            // Recalc lives inside the same transaction so GrandTotal-driven status
            // derivation also sees a consistent base.
            var strategy = _context.Database.CreateExecutionStrategy();
            await strategy.ExecuteAsync(async () =>
            {
                using var tx = await _context.Database.BeginTransactionAsync();
                try
                {
                    // Postgres row-level lock; serializes any concurrent UpdateInvoiceAsync
                    // for the same invoice id. Other invoices remain unblocked.
                    var invoice = await _context.SupplierInvoices
                        .FromSqlInterpolated($"SELECT * FROM \"SupplierInvoices\" WHERE \"Id\" = {id} AND \"IsDeleted\" = false FOR UPDATE")
                        .FirstOrDefaultAsync()
                        ?? throw new KeyNotFoundException($"SupplierInvoice {id} not found");

                    var oldStatus = invoice.Status;
                    if (dto.SupplierInvoiceRef != null) invoice.SupplierInvoiceRef = dto.SupplierInvoiceRef;
                    if (dto.Status != null)
                    {
                        if (oldStatus == "cancelled" && dto.Status != "cancelled")
                            throw new InvalidOperationException("Cancelled invoices cannot change status");
                        if (oldStatus == "paid" && dto.Status != "paid" && dto.Status != "cancelled")
                            throw new InvalidOperationException($"Paid invoices cannot transition to '{dto.Status}'");
                        invoice.Status = dto.Status;
                    }
                    if (dto.DueDate.HasValue) invoice.DueDate = dto.DueDate.Value;
                    if (dto.Discount.HasValue) invoice.Discount = dto.Discount.Value;
                    if (dto.DiscountType != null) invoice.DiscountType = dto.DiscountType;
                    if (dto.FiscalStamp.HasValue) invoice.FiscalStamp = dto.FiscalStamp.Value;
                    if (dto.PaymentMethod != null) invoice.PaymentMethod = dto.PaymentMethod;

                    // Recalc totals BEFORE validating AmountPaid / deriving payment-status.
                    // Otherwise a single PATCH that changes Discount AND AmountPaid would:
                    //   1. validate AmountPaid against the OLD GrandTotal
                    //   2. derive "paid"/"partially_paid" from the OLD GrandTotal
                    //   3. recalc totals at the end → status/overpayment guard now stale
                    // Persist the field changes first so RecalculateInvoiceTotalsAsync sees them.
                    var totalsAffected = dto.Discount.HasValue || dto.DiscountType != null
                        || dto.FiscalStamp.HasValue
                        || dto.RsApplicable.HasValue || dto.RsTypeCode != null;
                    if (totalsAffected)
                    {
                        // Apply RS fields here too so recalc has the right inputs.
                        if (dto.RsApplicable.HasValue) invoice.RsApplicable = dto.RsApplicable.Value;
                        if (dto.RsTypeCode != null) invoice.RsTypeCode = dto.RsTypeCode;
                        await _context.SaveChangesAsync();
                        await RecalculateInvoiceTotalsAsync(id);
                        // Refresh in-memory aggregate from the DB so the AmountPaid block below
                        // and the status-derivation see the fresh GrandTotal.
                        await _context.Entry(invoice).ReloadAsync();
                    }

                    if (dto.AmountPaid.HasValue)
                    {
                        if (dto.AmountPaid.Value < 0)
                            throw new InvalidOperationException("AmountPaid cannot be negative");
                        // Guard: prevent overpayment when a concurrent payment already
                        // settled the invoice. The locked read above guarantees we see
                        // the latest persisted AmountPaid here.
                        if (invoice.GrandTotal > 0 && dto.AmountPaid.Value > invoice.GrandTotal)
                            throw new InvalidOperationException(
                                $"AmountPaid ({dto.AmountPaid.Value}) exceeds GrandTotal ({invoice.GrandTotal}); a concurrent payment may have settled this invoice");

                        invoice.AmountPaid = dto.AmountPaid.Value;
                        if (dto.Status == null && oldStatus != "cancelled")
                        {
                            if (invoice.AmountPaid >= invoice.GrandTotal && invoice.GrandTotal > 0)
                            {
                                invoice.Status = "paid";
                                invoice.PaymentDate ??= DateTime.UtcNow;
                            }
                            else if (invoice.AmountPaid > 0)
                            {
                                invoice.Status = "partially_paid";
                            }
                            else
                            {
                                invoice.Status = "pending";
                                invoice.PaymentDate = null;
                            }
                        }
                    }
                    if (dto.PaymentDate.HasValue) invoice.PaymentDate = dto.PaymentDate;
                    if (dto.Notes != null) invoice.Notes = dto.Notes;
                    // RsApplicable/RsTypeCode already applied above when totalsAffected;
                    // apply here for the case where they weren't passed alongside other
                    // total-affecting fields (defensive — same branch wouldn't fire twice
                    // because totalsAffected is true iff one of these is set).
                    if (!totalsAffected)
                    {
                        if (dto.RsApplicable.HasValue) invoice.RsApplicable = dto.RsApplicable.Value;
                        if (dto.RsTypeCode != null) invoice.RsTypeCode = dto.RsTypeCode;
                    }
                    if (dto.TejSynced.HasValue) invoice.TejSynced = dto.TejSynced.Value;
                    if (dto.TejSyncDate.HasValue) invoice.TejSyncDate = dto.TejSyncDate;
                    if (dto.TejSyncStatus != null) invoice.TejSyncStatus = dto.TejSyncStatus;
                    if (dto.TejErrorMessage != null) invoice.TejErrorMessage = dto.TejErrorMessage;
                    if (dto.FactureEnLigneId != null) invoice.FactureEnLigneId = dto.FactureEnLigneId;
                    if (dto.FactureEnLigneStatus != null) invoice.FactureEnLigneStatus = dto.FactureEnLigneStatus;
                    if (dto.FactureEnLigneSentAt.HasValue) invoice.FactureEnLigneSentAt = dto.FactureEnLigneSentAt;
                    invoice.ModifiedDate = DateTime.UtcNow;
                    invoice.ModifiedBy = userId;

                    if (dto.Status != null && dto.Status != oldStatus)
                    {
                        _context.PurchaseActivities.Add(new PurchaseActivity
                        {
                            EntityType = "supplier_invoice", EntityId = id, ActivityType = "status_changed",
                            Description = $"Status changed from {oldStatus} to {dto.Status}",
                            OldValue = oldStatus, NewValue = dto.Status,
                            PerformedBy = userId, PerformedByName = userName, PerformedAt = DateTime.UtcNow
                        });
                    }
                    await _context.SaveChangesAsync();

                    // Re-derive PO.PaymentStatus whenever AmountPaid, Status, or
                    // GrandTotal-driving fields change. Skipping this would let the PO
                    // claim "pending" while invoices for it are fully paid.
                    if (invoice.PurchaseOrderId.HasValue &&
                        (dto.AmountPaid.HasValue || dto.Status != null
                         || dto.Discount.HasValue || dto.DiscountType != null
                         || dto.FiscalStamp.HasValue
                         || dto.RsApplicable.HasValue || dto.RsTypeCode != null))
                    {
                        await SyncPurchaseOrderPaymentStatusAsync(invoice.PurchaseOrderId.Value);
                    }

                    await tx.CommitAsync();
                }
                catch
                {
                    await tx.RollbackAsync();
                    throw;
                }
            });

            return (await GetInvoiceByIdAsync(id))!;
        }

        public async Task<bool> DeleteInvoiceAsync(int id, string userId, string? userName = null)
        {
            var invoice = await _context.SupplierInvoices.AsNoTracking()
                .FirstOrDefaultAsync(i => i.Id == id && !i.IsDeleted);
            if (invoice == null) return false;

            // Wrap soft-delete + activity-log + PO sync in a single transaction so a
            // failure in the cascading PO.PaymentStatus sync rolls back the soft-delete.
            // Without this, the invoice could disappear from the ledger while the PO
            // still claims "paid" against the now-missing invoice.
            // EnableRetryOnFailure on Npgsql requires the execution-strategy wrapper.
            var strategy = _context.Database.CreateExecutionStrategy();
            await strategy.ExecuteAsync(async () =>
            {
                using var tx = await _context.Database.BeginTransactionAsync();
                try
                {
                    var tracked = await _context.SupplierInvoices
                        .FirstOrDefaultAsync(i => i.Id == id && !i.IsDeleted);
                    if (tracked == null) return; // raced with another delete

                    tracked.IsDeleted = true;
                    tracked.DeletedAt = DateTime.UtcNow;
                    tracked.DeletedBy = userId;
                    _context.PurchaseActivities.Add(new PurchaseActivity
                    {
                        EntityType = "supplier_invoice", EntityId = id, ActivityType = "deleted",
                        Description = $"Supplier invoice {tracked.InvoiceNumber} deleted",
                        PerformedBy = userId, PerformedByName = userName, PerformedAt = DateTime.UtcNow
                    });
                    await _context.SaveChangesAsync();

                    if (tracked.PurchaseOrderId.HasValue)
                        await SyncPurchaseOrderPaymentStatusAsync(tracked.PurchaseOrderId.Value);

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

        // Recompute PurchaseOrder.PaymentStatus from all live, non-cancelled supplier
        // invoices linked to the PO. Single source of truth: the cumulative invoice
        // ledger drives the PO's payment state, not manual updates.
        //   paid     → totalDue > 0 AND totalPaid >= totalDue
        //   partial  → totalPaid > 0 (but not enough to settle)
        //   pending  → no paid amount recorded (or no live invoices)
        private async Task SyncPurchaseOrderPaymentStatusAsync(int purchaseOrderId)
        {
            var po = await _context.PurchaseOrders.FirstOrDefaultAsync(p => p.Id == purchaseOrderId && !p.IsDeleted);
            if (po == null) return;

            var liveInvoices = await _context.SupplierInvoices.AsNoTracking()
                .Where(i => i.PurchaseOrderId == purchaseOrderId && !i.IsDeleted && i.Status != "cancelled")
                .Select(i => new { i.GrandTotal, i.AmountPaid })
                .ToListAsync();

            var totalDue = liveInvoices.Sum(i => i.GrandTotal);
            var totalPaid = liveInvoices.Sum(i => i.AmountPaid);

            string newStatus;
            if (totalDue > 0 && totalPaid >= totalDue) newStatus = "paid";
            else if (totalPaid > 0) newStatus = "partial";
            else newStatus = "pending";

            if (po.PaymentStatus != newStatus)
            {
                po.PaymentStatus = newStatus;
                po.ModifiedDate = DateTime.UtcNow;
                await _context.SaveChangesAsync();
            }
        }

        // ── Items ──
        public async Task<SupplierInvoiceItemDto> AddItemAsync(int invoiceId, CreateSupplierInvoiceItemDto dto)
        {
            var invoice = await _context.SupplierInvoices.Include(i => i.Items).FirstOrDefaultAsync(i => i.Id == invoiceId && !i.IsDeleted)
                ?? throw new KeyNotFoundException($"SupplierInvoice {invoiceId} not found");
            if (invoice.Status != "draft")
                throw new InvalidOperationException("Items can only be modified on draft invoices");

            // If the line is linked to a PO, the PO item must belong to THIS invoice's PO.
            if (dto.PurchaseOrderItemId.HasValue)
            {
                if (!invoice.PurchaseOrderId.HasValue)
                    throw new InvalidOperationException("Cannot link a PO item to an invoice that has no PurchaseOrderId");
                var poItemExists = await _context.PurchaseOrderItems.AnyAsync(p =>
                    p.Id == dto.PurchaseOrderItemId.Value && p.PurchaseOrderId == invoice.PurchaseOrderId.Value);
                if (!poItemExists)
                    throw new InvalidOperationException($"PurchaseOrderItem {dto.PurchaseOrderItemId} does not belong to PO {invoice.PurchaseOrderId}");
            }

            var item = new SupplierInvoiceItem
            {
                SupplierInvoiceId = invoiceId,
                PurchaseOrderItemId = dto.PurchaseOrderItemId,
                ArticleId = dto.ArticleId,
                ArticleName = dto.ArticleName,
                Description = dto.Description,
                Quantity = dto.Quantity,
                UnitPrice = dto.UnitPrice,
                TaxRate = dto.TaxRate,
                LineTotal = dto.Quantity * dto.UnitPrice,
                DisplayOrder = invoice.Items?.Count ?? 0
            };
            _context.SupplierInvoiceItems.Add(item);
            await _context.SaveChangesAsync();

            await RecalculateInvoiceTotalsAsync(invoiceId);
            return MapItemToDto(item);
        }

        public async Task<SupplierInvoiceItemDto> UpdateItemAsync(int invoiceId, int itemId, CreateSupplierInvoiceItemDto dto)
        {
            var invoice = await _context.SupplierInvoices.Include(i => i.Items).FirstOrDefaultAsync(i => i.Id == invoiceId && !i.IsDeleted)
                ?? throw new KeyNotFoundException($"SupplierInvoice {invoiceId} not found");
            if (invoice.Status != "draft")
                throw new InvalidOperationException("Items can only be modified on draft invoices");

            var item = invoice.Items?.FirstOrDefault(i => i.Id == itemId)
                ?? throw new KeyNotFoundException($"Item {itemId} not found");

            item.ArticleId = dto.ArticleId;
            item.ArticleName = dto.ArticleName;
            item.Description = dto.Description;
            item.Quantity = dto.Quantity;
            item.UnitPrice = dto.UnitPrice;
            item.TaxRate = dto.TaxRate;
            item.LineTotal = dto.Quantity * dto.UnitPrice;
            await _context.SaveChangesAsync();

            await RecalculateInvoiceTotalsAsync(invoiceId);
            return MapItemToDto(item);
        }

        public async Task<bool> DeleteItemAsync(int invoiceId, int itemId)
        {
            var invoice = await _context.SupplierInvoices.Include(i => i.Items).FirstOrDefaultAsync(i => i.Id == invoiceId && !i.IsDeleted)
                ?? throw new KeyNotFoundException($"SupplierInvoice {invoiceId} not found");
            if (invoice.Status != "draft")
                throw new InvalidOperationException("Items can only be modified on draft invoices");

            var item = invoice.Items?.FirstOrDefault(i => i.Id == itemId);
            if (item == null) return false;
            _context.SupplierInvoiceItems.Remove(item);
            await _context.SaveChangesAsync();

            await RecalculateInvoiceTotalsAsync(invoiceId);
            return true;
        }

        private async Task RecalculateInvoiceTotalsAsync(int invoiceId)
        {
            var invoice = await _context.SupplierInvoices.Include(i => i.Items).FirstOrDefaultAsync(i => i.Id == invoiceId);
            if (invoice == null) return;
            var items = invoice.Items?.ToList() ?? new List<SupplierInvoiceItem>();
            invoice.SubTotal = items.Sum(i => i.Quantity * i.UnitPrice);
            var discAmt = invoice.DiscountType == "percentage" ? invoice.SubTotal * invoice.Discount / 100 : invoice.Discount;
            var afterDiscount = invoice.SubTotal - discAmt;

            // Tax must be computed on the DISCOUNTED base so the invoice reconciles
            // with the originating PO (which applies discount before tax). Previously
            // we taxed the gross sum, over-reporting VAT whenever a header discount existed.
            // We pro-rate the header discount by line subtotal so per-line tax rates are preserved.
            var subTotal = invoice.SubTotal;
            invoice.TaxAmount = subTotal > 0
                ? items.Sum(i =>
                {
                    var lineSub = i.Quantity * i.UnitPrice;
                    var lineShare = lineSub / subTotal;       // proportion of header discount that applies to this line
                    var lineAfterDisc = lineSub - (discAmt * lineShare);
                    return lineAfterDisc * i.TaxRate / 100;
                })
                : 0m;

            // RS (retenue à la source). Always reset first so toggling RsApplicable off
            // (or clearing RsTypeCode) actually removes a previously-applied retention.
            invoice.RsAmount = 0m;
            if (invoice.RsApplicable && !string.IsNullOrEmpty(invoice.RsTypeCode))
            {
                var rsRate = invoice.RsTypeCode switch
                {
                    "P1" => 1.5m, "P2" => 5m, "P3" => 10m, "P4" => 15m, "P5" => 25m, _ => 0m
                };
                invoice.RsAmount = afterDiscount * rsRate / 100;
            }
            // Floor non-negative: a header discount larger than SubTotal (or an RS that
            // exceeds the discounted base) would otherwise produce a negative GrandTotal,
            // breaking the AmountPaid > GrandTotal overpayment guard and the
            // PO.PaymentStatus sync (totalDue<=0 → "paid" without any cash recorded).
            invoice.GrandTotal = Math.Max(0, afterDiscount + invoice.TaxAmount + invoice.FiscalStamp - invoice.RsAmount);
            await _context.SaveChangesAsync();
        }

        private static SupplierInvoiceItemDto MapItemToDto(SupplierInvoiceItem i) => new()
        {
            Id = i.Id, SupplierInvoiceId = i.SupplierInvoiceId, PurchaseOrderItemId = i.PurchaseOrderItemId,
            ArticleId = i.ArticleId, ArticleName = i.ArticleName, Description = i.Description,
            Quantity = i.Quantity, UnitPrice = i.UnitPrice, TaxRate = i.TaxRate,
            LineTotal = i.LineTotal, DisplayOrder = i.DisplayOrder
        };

        private static SupplierInvoiceDto MapToDto(SupplierInvoice inv, string? poNumber) => new()
        {
            Id = inv.Id, InvoiceNumber = inv.InvoiceNumber, SupplierInvoiceRef = inv.SupplierInvoiceRef,
            SupplierId = inv.SupplierId, SupplierName = inv.SupplierName,
            SupplierMatriculeFiscale = inv.SupplierMatriculeFiscale,
            PurchaseOrderId = inv.PurchaseOrderId, PurchaseOrderNumber = poNumber,
            GoodsReceiptId = inv.GoodsReceiptId, InvoiceDate = inv.InvoiceDate, DueDate = inv.DueDate,
            Status = inv.Status, Currency = inv.Currency, SubTotal = inv.SubTotal,
            Discount = inv.Discount, DiscountType = inv.DiscountType, TaxAmount = inv.TaxAmount,
            FiscalStamp = inv.FiscalStamp, GrandTotal = inv.GrandTotal, AmountPaid = inv.AmountPaid,
            PaymentMethod = inv.PaymentMethod, PaymentDate = inv.PaymentDate, Notes = inv.Notes,
            RsApplicable = inv.RsApplicable, RsTypeCode = inv.RsTypeCode, RsAmount = inv.RsAmount,
            RsRecordId = inv.RsRecordId,
            FactureEnLigneId = inv.FactureEnLigneId, FactureEnLigneStatus = inv.FactureEnLigneStatus,
            FactureEnLigneSentAt = inv.FactureEnLigneSentAt,
            TejSynced = inv.TejSynced, TejSyncDate = inv.TejSyncDate, TejSyncStatus = inv.TejSyncStatus,
            TejErrorMessage = inv.TejErrorMessage,
            Items = inv.Items?.Select(i => new SupplierInvoiceItemDto
            {
                Id = i.Id, SupplierInvoiceId = i.SupplierInvoiceId, PurchaseOrderItemId = i.PurchaseOrderItemId,
                ArticleId = i.ArticleId, ArticleName = i.ArticleName, Description = i.Description,
                Quantity = i.Quantity, UnitPrice = i.UnitPrice, TaxRate = i.TaxRate,
                LineTotal = i.LineTotal, DisplayOrder = i.DisplayOrder
            }).ToList(),
            CreatedDate = inv.CreatedDate, CreatedBy = inv.CreatedBy, ModifiedDate = inv.ModifiedDate, ModifiedBy = inv.ModifiedBy
        };
    }
}

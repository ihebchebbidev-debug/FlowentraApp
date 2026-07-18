using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using MyApi.Data;
using MyApi.Modules.Invoices.DTOs;
using MyApi.Modules.Invoices.Models;
using MyApi.Modules.Numbering.Services;

namespace MyApi.Modules.Invoices.Services
{
    /// <summary>
    /// Phase B customer invoice ledger. Single-entry: header + lines.
    /// Numbering is assigned only on Post — drafts have no number, which lets
    /// them be edited/deleted without leaving gaps in the invoice sequence.
    /// </summary>
    public class InvoiceService : IInvoiceService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<InvoiceService> _logger;
        private readonly INumberingService? _numbering;

        public InvoiceService(
            ApplicationDbContext context,
            ILogger<InvoiceService> logger,
            INumberingService? numbering = null)
        {
            _context = context;
            _logger = logger;
            _numbering = numbering;
        }

        public async Task<PagedInvoiceResponse> GetInvoicesAsync(InvoiceQueryParams q)
        {
            var query = _context.Set<Invoice>().Include(i => i.Lines).AsQueryable();

            if (!string.IsNullOrEmpty(q.Status)) query = query.Where(i => i.Status == q.Status);
            if (q.ContactId.HasValue) query = query.Where(i => i.ContactId == q.ContactId.Value);
            if (q.SaleId.HasValue) query = query.Where(i => i.SaleId == q.SaleId.Value);
            if (q.ServiceOrderId.HasValue) query = query.Where(i => i.ServiceOrderId == q.ServiceOrderId.Value);
            if (q.DateFrom.HasValue) query = query.Where(i => i.CreatedAt >= q.DateFrom.Value);
            if (q.DateTo.HasValue) query = query.Where(i => i.CreatedAt <= q.DateTo.Value);
            if (!string.IsNullOrEmpty(q.Search))
            {
                var s = q.Search.ToLower();
                query = query.Where(i =>
                    (i.InvoiceNumber != null && i.InvoiceNumber.ToLower().Contains(s)) ||
                    (i.Title != null && i.Title.ToLower().Contains(s)));
            }

            var total = await query.CountAsync();
            var desc = string.Equals(q.SortOrder, "desc", StringComparison.OrdinalIgnoreCase);
            query = q.SortBy.ToLower() switch
            {
                "invoice_number" => desc ? query.OrderByDescending(i => i.InvoiceNumber) : query.OrderBy(i => i.InvoiceNumber),
                "grand_total"    => desc ? query.OrderByDescending(i => i.GrandTotal)    : query.OrderBy(i => i.GrandTotal),
                "issue_date"     => desc ? query.OrderByDescending(i => i.IssueDate)     : query.OrderBy(i => i.IssueDate),
                _                => desc ? query.OrderByDescending(i => i.CreatedAt)     : query.OrderBy(i => i.CreatedAt),
            };

            var page = Math.Max(1, q.Page);
            var limit = Math.Clamp(q.Limit, 1, 200);
            var rows = await query.Skip((page - 1) * limit).Take(limit).ToListAsync();

            return new PagedInvoiceResponse
            {
                Data = rows.Select(MapToDto).ToList(),
                PageNumber = page,
                PageSize = limit,
                TotalItems = total,
                TotalPages = (int)Math.Ceiling(total / (double)limit),
            };
        }

        public async Task<InvoiceDto?> GetInvoiceByIdAsync(int id)
        {
            var invoice = await _context.Set<Invoice>()
                .Include(i => i.Lines)
                .FirstOrDefaultAsync(i => i.Id == id);
            return invoice == null ? null : MapToDto(invoice);
        }

        public async Task<InvoiceDto> CreateDraftAsync(CreateInvoiceDto dto, string userId)
        {
            if (dto.ContactId <= 0) throw new ArgumentException("ContactId is required");

            var invoice = new Invoice
            {
                ContactId = dto.ContactId,
                SaleId = dto.SaleId,
                ServiceOrderId = dto.ServiceOrderId,
                Title = dto.Title,
                Notes = dto.Notes,
                Currency = string.IsNullOrEmpty(dto.Currency) ? "TND" : dto.Currency!,
                Status = "draft",
                IssueDate = dto.IssueDate,
                DueDate = dto.DueDate,
                CreatedBy = userId,
                CreatedAt = DateTime.UtcNow,
                Lines = dto.Lines.Select((l, idx) => BuildLine(l, idx)).ToList(),
            };
            RecalculateTotals(invoice);

            _context.Add(invoice);
            await _context.SaveChangesAsync();
            _logger.LogInformation("Invoice draft {Id} created for contact {ContactId}", invoice.Id, invoice.ContactId);
            return MapToDto(invoice);
        }

        public async Task<InvoiceDto> CreateDraftFromSaleAsync(int saleId, string userId, int? serviceOrderId = null)
        {
            var sale = await _context.Sales
                .Include(s => s.Items)
                .FirstOrDefaultAsync(s => s.Id == saleId && !s.IsDeleted);
            if (sale == null) throw new KeyNotFoundException($"Sale {saleId} not found");

            var lines = (sale.Items ?? new List<Sales.Models.SaleItem>())
                .OrderBy(i => i.DisplayOrder)
                .Select((i, idx) => new InvoiceLine
                {
                    SourceType = "sale_item",
                    SourceId = i.Id.ToString(),
                    ItemName = i.ItemName ?? "Item",
                    Description = i.Description,
                    Quantity = i.Quantity,
                    Unit = null,
                    UnitPrice = i.UnitPrice,
                    TaxRate = 0m,
                    LineTotal = i.LineTotal,
                    TaxAmount = 0m,
                    DisplayOrder = idx,
                    CreatedAt = DateTime.UtcNow,
                })
                .ToList();

            var invoice = new Invoice
            {
                ContactId = sale.ContactId,
                SaleId = sale.Id,
                ServiceOrderId = serviceOrderId,
                Title = sale.Title,
                Currency = string.IsNullOrEmpty(sale.Currency) ? "TND" : sale.Currency,
                Status = "draft",
                CreatedBy = userId,
                CreatedAt = DateTime.UtcNow,
                Lines = lines,
            };
            RecalculateTotals(invoice);

            _context.Add(invoice);
            await _context.SaveChangesAsync();
            _logger.LogInformation("Invoice draft {Id} created from sale {SaleId} ({LineCount} lines)",
                invoice.Id, sale.Id, lines.Count);
            return MapToDto(invoice);
        }

        public async Task<InvoiceDto> UpdateDraftAsync(int id, UpdateInvoiceDto dto, string userId)
        {
            var invoice = await _context.Set<Invoice>()
                .Include(i => i.Lines)
                .FirstOrDefaultAsync(i => i.Id == id);
            if (invoice == null) throw new KeyNotFoundException($"Invoice {id} not found");
            if (invoice.Status != "draft")
                throw new InvalidOperationException($"Invoice {id} is '{invoice.Status}'; only drafts are editable.");

            invoice.Title = dto.Title ?? invoice.Title;
            invoice.Notes = dto.Notes ?? invoice.Notes;
            if (!string.IsNullOrEmpty(dto.Currency)) invoice.Currency = dto.Currency!;
            invoice.IssueDate = dto.IssueDate ?? invoice.IssueDate;
            invoice.DueDate = dto.DueDate ?? invoice.DueDate;

            if (dto.Lines != null)
            {
                _context.RemoveRange(invoice.Lines);
                invoice.Lines = dto.Lines.Select((l, idx) => BuildLine(l, idx)).ToList();
            }

            RecalculateTotals(invoice);
            invoice.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return MapToDto(invoice);
        }

        public async Task<InvoiceDto> PostAsync(int id, PostInvoiceDto dto, string userId)
        {
            var invoice = await _context.Set<Invoice>()
                .Include(i => i.Lines)
                .FirstOrDefaultAsync(i => i.Id == id);
            if (invoice == null) throw new KeyNotFoundException($"Invoice {id} not found");
            if (invoice.Status != "draft")
                throw new InvalidOperationException($"Invoice {id} is '{invoice.Status}', cannot post.");
            if (!invoice.Lines.Any())
                throw new InvalidOperationException("Cannot post an invoice with no lines.");

            RecalculateTotals(invoice);

            if (string.IsNullOrEmpty(invoice.InvoiceNumber))
            {
                string? number = null;
                if (_numbering != null)
                {
                    try { number = await _numbering.GetNextAsync("Invoice"); }
                    catch (Exception ex) { _logger.LogWarning(ex, "Numbering failed for Invoice {Id}, falling back", id); }
                }
                invoice.InvoiceNumber = number ?? $"INV-{DateTime.UtcNow:yyyyMMdd}-{id:D5}";
            }

            invoice.Status = "posted";
            invoice.IssueDate = dto.IssueDate ?? invoice.IssueDate ?? DateTime.UtcNow.Date;
            invoice.DueDate = dto.DueDate ?? invoice.DueDate;
            invoice.PostedAt = DateTime.UtcNow;
            invoice.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            _logger.LogInformation("Invoice {Id} posted as {Number}", invoice.Id, invoice.InvoiceNumber);
            await RecalculatePaymentStateAsync(invoice.Id);
            return MapToDto(invoice);
        }

        public async Task<InvoiceDto> VoidAsync(int id, VoidInvoiceDto dto, string userId)
        {
            var invoice = await _context.Set<Invoice>()
                .Include(i => i.Lines)
                .FirstOrDefaultAsync(i => i.Id == id);
            if (invoice == null) throw new KeyNotFoundException($"Invoice {id} not found");
            if (invoice.Status == "void") return MapToDto(invoice);
            if (invoice.Status == "draft")
                throw new InvalidOperationException("Delete drafts instead of voiding them.");

            invoice.Status = "void";
            invoice.VoidedAt = DateTime.UtcNow;
            invoice.VoidReason = dto.Reason;
            invoice.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            _logger.LogInformation("Invoice {Id} voided by {User}", invoice.Id, userId);
            return MapToDto(invoice);
        }

        public async Task<bool> DeleteDraftAsync(int id, string userId)
        {
            var invoice = await _context.Set<Invoice>().FirstOrDefaultAsync(i => i.Id == id);
            if (invoice == null) return false;
            if (invoice.Status != "draft")
                throw new InvalidOperationException($"Invoice {id} is '{invoice.Status}'; only drafts can be deleted.");
            invoice.IsDeleted = true;
            invoice.DeletedAt = DateTime.UtcNow;
            invoice.DeletedBy = userId;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task RecalculatePaymentStateAsync(int invoiceId)
        {
            var invoice = await _context.Set<Invoice>().FirstOrDefaultAsync(i => i.Id == invoiceId);
            if (invoice == null) return;

            // Sum completed payments recorded against this invoice via the Payments module.
            // EntityId is stored as string in Payments; match by string form.
            var idStr = invoice.Id.ToString();
            var paid = await _context.Set<MyApi.Modules.Payments.Models.Payment>()
                .Where(p => p.EntityType == "invoice" && p.EntityId == idStr && p.Status == "completed")
                .SumAsync(p => (decimal?)p.Amount) ?? 0m;

            invoice.AmountPaid = paid;

            if (invoice.Status == "posted" && paid >= invoice.GrandTotal && invoice.GrandTotal > 0m)
                invoice.Status = "paid";
            else if (invoice.Status == "paid" && paid < invoice.GrandTotal)
                invoice.Status = "posted";

            invoice.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }

        // ── helpers ───────────────────────────────────────────
        private static InvoiceLine BuildLine(CreateInvoiceLineDto dto, int idx)
        {
            var lineTotal = dto.Quantity * dto.UnitPrice;
            var tax = Math.Round(lineTotal * (dto.TaxRate / 100m), 2, MidpointRounding.AwayFromZero);
            return new InvoiceLine
            {
                SourceType = dto.SourceType,
                SourceId = dto.SourceId,
                ItemName = dto.ItemName,
                Description = dto.Description,
                Quantity = dto.Quantity,
                Unit = dto.Unit,
                UnitPrice = dto.UnitPrice,
                TaxRate = dto.TaxRate,
                LineTotal = lineTotal,
                TaxAmount = tax,
                DisplayOrder = dto.DisplayOrder == 0 ? idx : dto.DisplayOrder,
                CreatedAt = DateTime.UtcNow,
            };
        }

        private static void RecalculateTotals(Invoice invoice)
        {
            invoice.Subtotal = invoice.Lines.Sum(l => l.LineTotal);
            invoice.TaxAmount = invoice.Lines.Sum(l => l.TaxAmount);
            invoice.GrandTotal = invoice.Subtotal + invoice.TaxAmount;
        }

        private static InvoiceDto MapToDto(Invoice i) => new()
        {
            Id = i.Id,
            InvoiceNumber = i.InvoiceNumber,
            Status = i.Status,
            ContactId = i.ContactId,
            SaleId = i.SaleId,
            ServiceOrderId = i.ServiceOrderId,
            Title = i.Title,
            Notes = i.Notes,
            Currency = i.Currency,
            Subtotal = i.Subtotal,
            TaxAmount = i.TaxAmount,
            GrandTotal = i.GrandTotal,
            AmountPaid = i.AmountPaid,
            IssueDate = i.IssueDate,
            DueDate = i.DueDate,
            PostedAt = i.PostedAt,
            VoidedAt = i.VoidedAt,
            VoidReason = i.VoidReason,
            CreatedBy = i.CreatedBy,
            CreatedAt = i.CreatedAt,
            UpdatedAt = i.UpdatedAt,
            Lines = (i.Lines ?? new List<InvoiceLine>())
                .OrderBy(l => l.DisplayOrder)
                .Select(l => new InvoiceLineDto
                {
                    Id = l.Id,
                    InvoiceId = l.InvoiceId,
                    SourceType = l.SourceType,
                    SourceId = l.SourceId,
                    ItemName = l.ItemName,
                    Description = l.Description,
                    Quantity = l.Quantity,
                    Unit = l.Unit,
                    UnitPrice = l.UnitPrice,
                    TaxRate = l.TaxRate,
                    LineTotal = l.LineTotal,
                    TaxAmount = l.TaxAmount,
                    DisplayOrder = l.DisplayOrder,
                }).ToList(),
        };
    }
}
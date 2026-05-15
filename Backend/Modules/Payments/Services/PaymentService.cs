using Microsoft.EntityFrameworkCore;
using MyApi.Data;
using MyApi.Modules.Payments.DTOs;
using MyApi.Modules.Payments.Models;

namespace MyApi.Modules.Payments.Services
{
    public class PaymentService : IPaymentService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<PaymentService> _logger;

        public PaymentService(ApplicationDbContext context, ILogger<PaymentService> logger)
        {
            _context = context;
            _logger = logger;
        }

        // ── Payments ──────────────────────────────────
        public async Task<List<PaymentDto>> GetPaymentsAsync(string entityType, string entityId)
        {
            var payments = await _context.Payments
                .Include(p => p.ItemAllocations)
                .Where(p => p.EntityType == entityType && p.EntityId == entityId)
                .OrderByDescending(p => p.PaymentDate)
                .ToListAsync();

            return payments.Select(MapToDto).ToList();
        }

        public async Task<PaymentDto> CreatePaymentAsync(string entityType, string entityId, CreatePaymentDto dto, string userId, string userName)
        {
            // Generate receipt number
            var count = await _context.Payments
                .CountAsync(p => p.EntityType == entityType && p.EntityId == entityId);
            var receiptNumber = $"REC-{entityType.ToUpper().Substring(0, 3)}-{entityId}-{(count + 1):D3}";

            var payment = new Payment
            {
                Id = Guid.NewGuid().ToString(),
                EntityType = entityType,
                EntityId = entityId,
                Amount = dto.Amount,
                Currency = dto.Currency,
                PaymentMethod = dto.PaymentMethod,
                PaymentReference = dto.PaymentReference,
                PaymentDate = dto.PaymentDate ?? DateTime.UtcNow,
                Status = "completed",
                Notes = dto.Notes,
                ReceiptNumber = receiptNumber,
                InstallmentId = dto.InstallmentId,
                CreatedBy = userId,
                CreatedByName = userName,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
            };

            // Link to plan if installment is specified
            if (!string.IsNullOrEmpty(dto.InstallmentId))
            {
                var installment = await _context.PaymentPlanInstallments
                    .Include(i => i.Plan)
                    .FirstOrDefaultAsync(i => i.Id == dto.InstallmentId);
                if (installment != null)
                {
                    payment.PlanId = installment.PlanId;
                    // Update installment paid amount
                    installment.PaidAmount += dto.Amount;
                    if (installment.PaidAmount >= installment.Amount)
                    {
                        installment.Status = "paid";
                        installment.PaidAt = DateTime.UtcNow;
                    }
                    else
                    {
                        installment.Status = "partially_paid";
                    }

                    // Check if all installments are paid → mark plan completed
                    var plan = installment.Plan;
                    if (plan != null)
                    {
                        var allInstallments = await _context.PaymentPlanInstallments
                            .Where(i => i.PlanId == plan.Id)
                            .ToListAsync();
                        if (allInstallments.All(i => i.Status == "paid"))
                        {
                            plan.Status = "completed";
                            plan.UpdatedAt = DateTime.UtcNow;
                        }
                    }
                }
            }

            _context.Payments.Add(payment);

            // Add item allocations
            if (dto.ItemAllocations != null)
            {
                foreach (var alloc in dto.ItemAllocations)
                {
                    _context.PaymentItemAllocations.Add(new PaymentItemAllocation
                    {
                        Id = Guid.NewGuid().ToString(),
                        PaymentId = payment.Id,
                        ItemId = alloc.ItemId,
                        ItemName = alloc.ItemName,
                        AllocatedAmount = alloc.AllocatedAmount,
                        ItemTotal = alloc.ItemTotal,
                        CreatedAt = DateTime.UtcNow,
                    });
                }
            }

            // Update parent entity paid_amount and payment_status
            await UpdateEntityPaymentStatusAsync(entityType, entityId);

            await _context.SaveChangesAsync();

            return MapToDto(payment);
        }

        public async Task<bool> DeletePaymentAsync(string entityType, string entityId, string paymentId)
        {
            var payment = await _context.Payments
                .Include(p => p.ItemAllocations)
                .FirstOrDefaultAsync(p => p.Id == paymentId && p.EntityType == entityType && p.EntityId == entityId);
            if (payment == null) return false;

            // Reverse installment tracking if linked
            if (!string.IsNullOrEmpty(payment.InstallmentId))
            {
                var installment = await _context.PaymentPlanInstallments.FindAsync(payment.InstallmentId);
                if (installment != null)
                {
                    installment.PaidAmount -= payment.Amount;
                    if (installment.PaidAmount <= 0)
                    {
                        installment.PaidAmount = 0;
                        installment.Status = "pending";
                        installment.PaidAt = null;
                    }
                    else
                    {
                        installment.Status = "partially_paid";
                    }
                }
            }

            _context.PaymentItemAllocations.RemoveRange(payment.ItemAllocations);
            _context.Payments.Remove(payment);
            await _context.SaveChangesAsync();

            await UpdateEntityPaymentStatusAsync(entityType, entityId);
            await _context.SaveChangesAsync();

            return true;
        }

        // ── Summary ───────────────────────────────────
        public async Task<PaymentSummaryDto> GetPaymentSummaryAsync(string entityType, string entityId)
        {
            var payments = await _context.Payments
                .Where(p => p.EntityType == entityType && p.EntityId == entityId && p.Status == "completed")
                .ToListAsync();

            var totalAmount = await GetEntityTotalAmountAsync(entityType, entityId);
            var paidAmount = payments.Sum(p => p.Amount);
            var remaining = totalAmount - paidAmount;

            string paymentStatus = "unpaid";
            if (paidAmount >= totalAmount && totalAmount > 0) paymentStatus = "fully_paid";
            else if (paidAmount > 0) paymentStatus = "partially_paid";

            return new PaymentSummaryDto
            {
                TotalAmount = totalAmount,
                PaidAmount = paidAmount,
                RemainingAmount = Math.Max(0, remaining),
                PaymentStatus = paymentStatus,
                PaymentCount = payments.Count,
                LastPaymentDate = payments.OrderByDescending(p => p.PaymentDate).FirstOrDefault()?.PaymentDate,
                Currency = payments.FirstOrDefault()?.Currency ?? "TND",
            };
        }

        // ── Payment Plans ─────────────────────────────
        public async Task<List<PaymentPlanDto>> GetPaymentPlansAsync(string entityType, string entityId)
        {
            var plans = await _context.PaymentPlans
                .Include(p => p.Installments.OrderBy(i => i.InstallmentNumber))
                .Where(p => p.EntityType == entityType && p.EntityId == entityId)
                .OrderByDescending(p => p.CreatedAt)
                .ToListAsync();

            return plans.Select(MapPlanToDto).ToList();
        }

        public async Task<PaymentPlanDto> CreatePaymentPlanAsync(string entityType, string entityId, CreatePaymentPlanDto dto, string userId)
        {
            var plan = new PaymentPlan
            {
                Id = Guid.NewGuid().ToString(),
                EntityType = entityType,
                EntityId = entityId,
                Name = dto.Name,
                Description = dto.Description,
                TotalAmount = dto.TotalAmount,
                Currency = dto.Currency,
                InstallmentCount = dto.Installments.Count,
                Status = "active",
                CreatedBy = userId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
            };

            _context.PaymentPlans.Add(plan);

            for (int i = 0; i < dto.Installments.Count; i++)
            {
                var inst = dto.Installments[i];
                _context.PaymentPlanInstallments.Add(new PaymentPlanInstallment
                {
                    Id = Guid.NewGuid().ToString(),
                    PlanId = plan.Id,
                    InstallmentNumber = i + 1,
                    Amount = inst.Amount,
                    DueDate = inst.DueDate,
                    Status = "pending",
                    PaidAmount = 0,
                    CreatedAt = DateTime.UtcNow,
                });
            }

            await _context.SaveChangesAsync();

            return MapPlanToDto(plan);
        }

        public async Task<bool> DeletePaymentPlanAsync(string entityType, string entityId, string planId)
        {
            var plan = await _context.PaymentPlans
                .Include(p => p.Installments)
                .FirstOrDefaultAsync(p => p.Id == planId && p.EntityType == entityType && p.EntityId == entityId);
            if (plan == null) return false;

            _context.PaymentPlanInstallments.RemoveRange(plan.Installments);
            _context.PaymentPlans.Remove(plan);
            await _context.SaveChangesAsync();
            return true;
        }

        // ── Statement ─────────────────────────────────
        public async Task<PaymentStatementDto> GetPaymentStatementAsync(string entityType, string entityId)
        {
            var payments = await GetPaymentsAsync(entityType, entityId);
            var plans = await GetPaymentPlansAsync(entityType, entityId);
            var summary = await GetPaymentSummaryAsync(entityType, entityId);

            var (entityTitle, contactName) = await GetEntityInfoAsync(entityType, entityId);

            // Build item breakdown from allocations
            var itemMap = new Dictionary<string, ItemPaymentBreakdownDto>();
            foreach (var p in payments)
            {
                foreach (var a in p.ItemAllocations)
                {
                    if (!itemMap.ContainsKey(a.ItemId))
                    {
                        itemMap[a.ItemId] = new ItemPaymentBreakdownDto
                        {
                            Id = a.ItemId,
                            Name = a.ItemName,
                            TotalPrice = a.ItemTotal,
                            PaidAmount = 0,
                        };
                    }
                    itemMap[a.ItemId].PaidAmount += a.AllocatedAmount;
                }
            }
            foreach (var item in itemMap.Values)
            {
                item.RemainingAmount = Math.Max(0, item.TotalPrice - item.PaidAmount);
            }

            return new PaymentStatementDto
            {
                EntityType = entityType,
                EntityId = entityId,
                EntityTitle = entityTitle,
                ContactName = contactName,
                TotalAmount = summary.TotalAmount,
                PaidAmount = summary.PaidAmount,
                RemainingAmount = summary.RemainingAmount,
                Currency = summary.Currency,
                Payments = payments,
                Plan = plans.FirstOrDefault(p => p.Status == "active"),
                Items = itemMap.Values.ToList(),
                GeneratedAt = DateTime.UtcNow,
            };
        }

        // ── Upcoming Installments (for reminders) ─────
        public async Task<List<InstallmentReminderInfo>> GetUpcomingInstallmentsAsync(int daysAhead = 3)
        {
            var cutoff = DateTime.UtcNow.AddDays(daysAhead);
            var now = DateTime.UtcNow;

            var installments = await _context.PaymentPlanInstallments
                .Include(i => i.Plan)
                .Where(i => i.Status == "pending" && i.DueDate <= cutoff && i.DueDate >= now)
                .OrderBy(i => i.DueDate)
                .ToListAsync();

            var results = new List<InstallmentReminderInfo>();
            foreach (var inst in installments)
            {
                if (inst.Plan == null) continue;
                var (entityTitle, contactName) = await GetEntityInfoAsync(inst.Plan.EntityType, inst.Plan.EntityId);
                var contactEmail = await GetContactEmailAsync(inst.Plan.EntityType, inst.Plan.EntityId);

                results.Add(new InstallmentReminderInfo
                {
                    PlanId = inst.PlanId,
                    PlanName = inst.Plan.Name,
                    InstallmentId = inst.Id,
                    InstallmentNumber = inst.InstallmentNumber,
                    Amount = inst.Amount,
                    Currency = inst.Plan.Currency,
                    DueDate = inst.DueDate,
                    EntityType = inst.Plan.EntityType,
                    EntityId = inst.Plan.EntityId,
                    EntityTitle = entityTitle,
                    ContactName = contactName,
                    ContactEmail = contactEmail,
                });
            }

            return results;
        }

        // ── Private helpers ───────────────────────────
        private async Task<decimal> GetEntityTotalAmountAsync(string entityType, string entityId)
        {
            if (entityType == "sale")
            {
                var sale = await _context.Sales.FirstOrDefaultAsync(s => s.Id.ToString() == entityId);
                return sale?.TotalAmount ?? 0;
            }
            else
            {
                var offer = await _context.Offers.FirstOrDefaultAsync(o => o.Id.ToString() == entityId);
                return offer?.TotalAmount ?? 0;
            }
        }

        private async Task<(string title, string contactName)> GetEntityInfoAsync(string entityType, string entityId)
        {
            if (entityType == "sale")
            {
                var sale = await _context.Sales.FirstOrDefaultAsync(s => s.Id.ToString() == entityId);
                if (sale != null)
                {
                    var contact = await _context.Contacts.FirstOrDefaultAsync(c => c.Id == sale.ContactId);
                    return (sale.Title ?? $"Sale #{sale.SaleNumber}", contact?.Name ?? "");
                }
            }
            else
            {
                var offer = await _context.Offers.FirstOrDefaultAsync(o => o.Id.ToString() == entityId);
                if (offer != null)
                {
                    var contact = await _context.Contacts.FirstOrDefaultAsync(c => c.Id == offer.ContactId);
                    return (offer.Title ?? $"Offer #{offer.Id}", contact?.Name ?? "");
                }
            }
            return ("", "");
        }

        private async Task<string?> GetContactEmailAsync(string entityType, string entityId)
        {
            int? contactId = null;
            if (entityType == "sale")
            {
                var sale = await _context.Sales.FirstOrDefaultAsync(s => s.Id.ToString() == entityId);
                contactId = sale?.ContactId;
            }
            else
            {
                var offer = await _context.Offers.FirstOrDefaultAsync(o => o.Id.ToString() == entityId);
                contactId = offer?.ContactId;
            }
            if (contactId == null) return null;
            var contact = await _context.Contacts.FirstOrDefaultAsync(c => c.Id == contactId.Value);
            return contact?.Email;
        }

        private async Task UpdateEntityPaymentStatusAsync(string entityType, string entityId)
        {
            var summary = await GetPaymentSummaryAsync(entityType, entityId);
            // This would update the paid_amount and payment_status columns
            // on the sales/offers table once those columns exist
            // For now, the summary is computed on-the-fly
        }

        // ── Mappers ───────────────────────────────────
        private PaymentDto MapToDto(Payment p) => new()
        {
            Id = p.Id,
            EntityType = p.EntityType,
            EntityId = p.EntityId,
            PlanId = p.PlanId,
            InstallmentId = p.InstallmentId,
            Amount = p.Amount,
            Currency = p.Currency,
            PaymentMethod = p.PaymentMethod,
            PaymentReference = p.PaymentReference,
            PaymentDate = p.PaymentDate,
            Status = p.Status,
            Notes = p.Notes,
            ReceiptNumber = p.ReceiptNumber,
            ItemAllocations = (p.ItemAllocations ?? new List<PaymentItemAllocation>()).Select(a => new PaymentItemAllocationDto
            {
                Id = a.Id,
                PaymentId = a.PaymentId,
                ItemId = a.ItemId,
                ItemName = a.ItemName,
                AllocatedAmount = a.AllocatedAmount,
                ItemTotal = a.ItemTotal,
                CreatedAt = a.CreatedAt,
            }).ToList(),
            CreatedBy = p.CreatedBy,
            CreatedByName = p.CreatedByName,
            CreatedAt = p.CreatedAt,
            UpdatedAt = p.UpdatedAt,
        };

        private PaymentPlanDto MapPlanToDto(PaymentPlan p) => new()
        {
            Id = p.Id,
            EntityType = p.EntityType,
            EntityId = p.EntityId,
            Name = p.Name,
            Description = p.Description,
            TotalAmount = p.TotalAmount,
            Currency = p.Currency,
            InstallmentCount = p.InstallmentCount,
            Status = p.Status,
            Installments = (p.Installments ?? new List<PaymentPlanInstallment>()).Select(i => new PaymentPlanInstallmentDto
            {
                Id = i.Id,
                PlanId = i.PlanId,
                InstallmentNumber = i.InstallmentNumber,
                Amount = i.Amount,
                DueDate = i.DueDate,
                Status = i.Status,
                PaidAmount = i.PaidAmount,
                PaidAt = i.PaidAt,
                Notes = i.Notes,
                CreatedAt = i.CreatedAt,
            }).ToList(),
            CreatedBy = p.CreatedBy,
            CreatedAt = p.CreatedAt,
            UpdatedAt = p.UpdatedAt,
        };
    }
}

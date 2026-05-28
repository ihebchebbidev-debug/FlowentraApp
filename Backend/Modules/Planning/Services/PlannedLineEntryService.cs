using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using MyApi.Data;
using MyApi.Modules.Planning.DTOs;
using MyApi.Modules.Planning.Models;

namespace MyApi.Modules.Planning.Services
{
    public class PlannedLineEntryService : IPlannedLineEntryService
    {
        private readonly ApplicationDbContext _db;
        private static readonly HashSet<string> ValidParents = new(StringComparer.OrdinalIgnoreCase)
            { "offer_item", "sale_item", "service_order_job" };
        private static readonly HashSet<string> ValidKinds = new(StringComparer.OrdinalIgnoreCase)
            { "time", "expense" };
        private static readonly HashSet<string> ValidExpenseTypes = new(StringComparer.OrdinalIgnoreCase)
            { "travel", "per_diem", "materials", "subcontractor" };

        public PlannedLineEntryService(ApplicationDbContext db) { _db = db; }

        public async Task<List<PlannedLineEntryDto>> GetForParentAsync(string parentType, int parentId)
        {
            ValidateParent(parentType);
            return await _db.Set<PlannedLineEntry>()
                .Where(p => p.ParentType == parentType.ToLower() && p.ParentId == parentId)
                .OrderBy(p => p.Id)
                .Select(p => Map(p))
                .ToListAsync();
        }

        public async Task<PlannedLineEntryDto> CreateAsync(string parentType, int parentId, CreatePlannedLineEntryDto dto, string userId)
        {
            ValidateParent(parentType);
            ValidateKind(dto);

            int? origin = await ResolveOriginAsync(parentType, parentId);


            var entity = new PlannedLineEntry
            {
                ParentType = parentType.ToLower(),
                ParentId = parentId,
                OriginOfferItemId = origin,
                Kind = dto.Kind.ToLower(),
                PlannedMinutes = dto.PlannedMinutes,
                TechnicianCount = dto.TechnicianCount,
                HourlyRate = dto.HourlyRate,
                ExpenseType = dto.ExpenseType?.ToLower(),
                PlannedAmount = dto.PlannedAmount,
                Currency = dto.Currency,
                Description = dto.Description,
                CreatedBy = userId,
                CreatedAt = DateTime.UtcNow,
            };
            _db.Set<PlannedLineEntry>().Add(entity);
            await _db.SaveChangesAsync();
            return Map(entity);
        }

        public async Task<PlannedLineEntryDto> UpdateAsync(int id, UpdatePlannedLineEntryDto dto, string userId)
        {
            var entity = await _db.Set<PlannedLineEntry>().FirstOrDefaultAsync(p => p.Id == id)
                ?? throw new KeyNotFoundException($"PlannedLineEntry {id} not found");
            ValidateKind(dto);
            entity.Kind = dto.Kind.ToLower();
            entity.PlannedMinutes = dto.PlannedMinutes;
            entity.TechnicianCount = dto.TechnicianCount;
            entity.HourlyRate = dto.HourlyRate;
            entity.ExpenseType = dto.ExpenseType?.ToLower();
            entity.PlannedAmount = dto.PlannedAmount;
            entity.Currency = dto.Currency;
            entity.Description = dto.Description;
            entity.ModifiedBy = userId;
            entity.ModifiedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            return Map(entity);
        }

        public async Task DeleteAsync(int id, string userId)
        {
            var entity = await _db.Set<PlannedLineEntry>().FirstOrDefaultAsync(p => p.Id == id);
            if (entity == null) return;
            _db.Set<PlannedLineEntry>().Remove(entity);
            await _db.SaveChangesAsync();
        }

        public async Task CopyAsync(string sourceParentType, int sourceParentId, string targetParentType, int targetParentId, string userId)
        {
            ValidateParent(sourceParentType);
            ValidateParent(targetParentType);
            var src = await _db.Set<PlannedLineEntry>()
                .Where(p => p.ParentType == sourceParentType.ToLower() && p.ParentId == sourceParentId)
                .ToListAsync();
            if (src.Count == 0) return;

            foreach (var s in src)
            {
                _db.Set<PlannedLineEntry>().Add(new PlannedLineEntry
                {
                    ParentType = targetParentType.ToLower(),
                    ParentId = targetParentId,
                    OriginOfferItemId = s.OriginOfferItemId ?? (sourceParentType.Equals("offer_item", StringComparison.OrdinalIgnoreCase) ? s.ParentId : null),
                    Kind = s.Kind,
                    PlannedMinutes = s.PlannedMinutes,
                    TechnicianCount = s.TechnicianCount,
                    HourlyRate = s.HourlyRate,
                    ExpenseType = s.ExpenseType,
                    PlannedAmount = s.PlannedAmount,
                    Currency = s.Currency,
                    Description = s.Description,
                    CreatedBy = userId,
                    CreatedAt = DateTime.UtcNow,
                });
            }
            await _db.SaveChangesAsync();
        }

        public async Task<PlanVsActualLineDto> GetPlanVsActualAsync(int serviceOrderJobId)
        {
            var planned = await _db.Set<PlannedLineEntry>()
                .Where(p => p.ParentType == "service_order_job" && p.ParentId == serviceOrderJobId)
                .ToListAsync();

            int plannedMinutes = planned.Where(p => p.Kind == "time")
                .Sum(p => (p.PlannedMinutes ?? 0) * (p.TechnicianCount ?? 1));

            var plannedExpenseByType = planned
                .Where(p => p.Kind == "expense" && !string.IsNullOrEmpty(p.ExpenseType))
                .GroupBy(p => p.ExpenseType!)
                .ToDictionary(g => g.Key, g => g.Sum(x => x.PlannedAmount ?? 0));

            // Actuals come from dispatch TimeEntries/Expenses on dispatches linked to this job.
            // Best-effort: aggregate via DispatchJobs that reference this ServiceOrderJob.
            var dispatchIds = await _db.Set<MyApi.Modules.Dispatches.Models.DispatchJob>()
                .Where(dj => dj.JobId == serviceOrderJobId && !dj.IsDeleted)
                .Select(dj => dj.DispatchId)
                .Distinct()
                .ToListAsync();

            int actualMinutes = 0;
            var actualExpenseByType = new Dictionary<string, decimal>(StringComparer.OrdinalIgnoreCase);
            if (dispatchIds.Count > 0)
            {
                actualMinutes = (int)await _db.Set<MyApi.Modules.Dispatches.Models.TimeEntry>()
                    .Where(t => dispatchIds.Contains(t.DispatchId) && t.Duration != null)
                    .SumAsync(t => (decimal?)t.Duration ?? 0m);

                var expenses = await _db.Set<MyApi.Modules.Dispatches.Models.Expense>()
                    .Where(e => dispatchIds.Contains(e.DispatchId))
                    .ToListAsync();
                foreach (var e in expenses)
                {
                    var key = (e.ExpenseType ?? "other").ToLower();
                    actualExpenseByType.TryGetValue(key, out var cur);
                    actualExpenseByType[key] = cur + e.Amount;
                }
            }

            // G6: also include SO-direct time/expenses (logged against the parent ServiceOrder, not a dispatch).
            var serviceOrderId = await _db.Set<MyApi.Modules.ServiceOrders.Models.ServiceOrderJob>()
                .Where(j => j.Id == serviceOrderJobId)
                .Select(j => (int?)j.ServiceOrderId)
                .FirstOrDefaultAsync();
            if (serviceOrderId.HasValue)
            {
                // Only attribute SO-direct actuals to this job when it's the only job on the SO
                // (otherwise we'd double-count the same totals across every sibling job).
                var jobCount = await _db.Set<MyApi.Modules.ServiceOrders.Models.ServiceOrderJob>()
                    .CountAsync(j => j.ServiceOrderId == serviceOrderId.Value);
                if (jobCount == 1)
                {
                    actualMinutes += (int)await _db.Set<MyApi.Modules.ServiceOrders.Models.ServiceOrderTimeEntry>()
                        .Where(t => t.ServiceOrderId == serviceOrderId.Value)
                        .SumAsync(t => (int?)t.Duration ?? 0);

                    var soExpenses = await _db.Set<MyApi.Modules.ServiceOrders.Models.ServiceOrderExpense>()
                        .Where(e => e.ServiceOrderId == serviceOrderId.Value)
                        .ToListAsync();
                    foreach (var e in soExpenses)
                    {
                        var key = (e.Type ?? "other").ToLower();
                        actualExpenseByType.TryGetValue(key, out var cur);
                        actualExpenseByType[key] = cur + e.Amount;
                    }
                }
            }

            var allTypes = plannedExpenseByType.Keys.Union(actualExpenseByType.Keys, StringComparer.OrdinalIgnoreCase).ToList();
            var buckets = allTypes.Select(t => new PlanVsActualExpenseBucket
            {
                ExpenseType = t,
                Planned = plannedExpenseByType.TryGetValue(t, out var p) ? p : 0,
                Actual = actualExpenseByType.TryGetValue(t, out var a) ? a : 0,
            }).ToList();

            return new PlanVsActualLineDto
            {
                JobId = serviceOrderJobId,
                PlannedMinutes = plannedMinutes,
                ActualMinutes = actualMinutes,
                PlannedExpenseTotal = buckets.Sum(b => b.Planned),
                ActualExpenseTotal = buckets.Sum(b => b.Actual),
                ExpenseBuckets = buckets,
            };
        }

        private static void ValidateParent(string parentType)
        {
            if (!ValidParents.Contains(parentType))
                throw new ArgumentException($"Invalid parentType '{parentType}'. Allowed: offer_item, sale_item, service_order_job");
        }

        /// <summary>
        /// Resolve OriginOfferItemId for a new direct-create entry by walking the lineage:
        /// offer_item → self; otherwise inherit from any sibling entry already linked to its origin,
        /// or for service_order_job fall back to siblings of its source sale_item.
        /// </summary>
        private async Task<int?> ResolveOriginAsync(string parentType, int parentId)
        {
            if (parentType.Equals("offer_item", StringComparison.OrdinalIgnoreCase))
                return parentId;

            var pt = parentType.ToLower();
            var siblingOrigin = await _db.Set<PlannedLineEntry>()
                .Where(p => p.ParentType == pt && p.ParentId == parentId && p.OriginOfferItemId != null)
                .Select(p => p.OriginOfferItemId)
                .FirstOrDefaultAsync();
            if (siblingOrigin != null) return siblingOrigin;

            if (parentType.Equals("service_order_job", StringComparison.OrdinalIgnoreCase))
            {
                var job = await _db.ServiceOrderJobs.FirstOrDefaultAsync(j => j.Id == parentId);
                if (job != null && !string.IsNullOrEmpty(job.SaleItemId) && int.TryParse(job.SaleItemId, out var sid))
                {
                    var saleOrigin = await _db.Set<PlannedLineEntry>()
                        .Where(p => p.ParentType == "sale_item" && p.ParentId == sid && p.OriginOfferItemId != null)
                        .Select(p => p.OriginOfferItemId)
                        .FirstOrDefaultAsync();
                    if (saleOrigin != null) return saleOrigin;
                }
            }

            return null;
        }

        private static void ValidateKind(CreatePlannedLineEntryDto dto)
        {
            if (!ValidKinds.Contains(dto.Kind))
                throw new ArgumentException($"Invalid kind '{dto.Kind}'. Allowed: time, expense");
            if (string.Equals(dto.Kind, "time", StringComparison.OrdinalIgnoreCase))
            {
                if ((dto.PlannedMinutes ?? 0) <= 0)
                    throw new ArgumentException("PlannedMinutes is required and must be > 0 for time entries");
            }
            else
            {
                if (string.IsNullOrWhiteSpace(dto.ExpenseType) || !ValidExpenseTypes.Contains(dto.ExpenseType))
                    throw new ArgumentException("ExpenseType is required (travel|per_diem|materials|subcontractor)");
                if ((dto.PlannedAmount ?? 0) <= 0)
                    throw new ArgumentException("PlannedAmount is required and must be > 0 for expense entries");
            }
        }

        private static PlannedLineEntryDto Map(PlannedLineEntry p) => new()
        {
            Id = p.Id,
            ParentType = p.ParentType,
            ParentId = p.ParentId,
            OriginOfferItemId = p.OriginOfferItemId,
            Kind = p.Kind,
            PlannedMinutes = p.PlannedMinutes,
            TechnicianCount = p.TechnicianCount,
            HourlyRate = p.HourlyRate,
            ExpenseType = p.ExpenseType,
            PlannedAmount = p.PlannedAmount,
            Currency = p.Currency,
            Description = p.Description,
        };
    }
}

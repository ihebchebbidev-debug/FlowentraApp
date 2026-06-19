using Microsoft.EntityFrameworkCore;
using MyApi.Data;
using MyApi.Modules.Deals.DTOs;
using MyApi.Modules.Deals.Models;
using MyApi.Modules.Sales.DTOs;
using MyApi.Modules.Sales.Services;
using MyApi.Modules.Projects.DTOs;
using MyApi.Modules.Projects.Services;
using MyApi.Modules.Offers.DTOs;
using MyApi.Modules.Offers.Services;

namespace MyApi.Modules.Deals.Services
{
    public class DealService : IDealService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<DealService> _logger;
        private readonly ISaleService _saleService;
        private readonly IProjectService _projectService;
        private readonly IOfferService _offerService;

        // Stages considered "open" (still in the pipeline)
        private static readonly string[] OpenStages = { "lead", "qualified", "proposal", "negotiation" };

        public DealService(
            ApplicationDbContext context,
            ILogger<DealService> logger,
            ISaleService saleService,
            IProjectService projectService,
            IOfferService offerService)
        {
            _context = context;
            _logger = logger;
            _saleService = saleService;
            _projectService = projectService;
            _offerService = offerService;
        }

        // ── Queries ──

        public async Task<PaginatedDealResponse> GetDealsAsync(
            string? stage = null, string? category = null, string? source = null,
            string? contactId = null, string? projectId = null, string? search = null,
            int page = 1, int limit = 20, string sortBy = "updated_at", string sortOrder = "desc")
        {
            // Guard against bad input: page 0/negative → negative Skip (EF throws),
            // limit 0 → divide-by-zero when computing TotalPages.
            if (page < 1) page = 1;
            if (limit < 1) limit = 20;
            if (limit > 200) limit = 200;

            var query = _context.Deals.AsNoTracking().Where(d => !d.IsDeleted).AsQueryable();

            if (!string.IsNullOrEmpty(stage))
                query = query.Where(d => d.Stage == stage);
            if (!string.IsNullOrEmpty(category))
                query = query.Where(d => d.Category == category);
            if (!string.IsNullOrEmpty(source))
                query = query.Where(d => d.Source == source);
            if (!string.IsNullOrEmpty(contactId) && int.TryParse(contactId, out int cId))
                query = query.Where(d => d.ContactId == cId);
            if (!string.IsNullOrEmpty(projectId) && int.TryParse(projectId, out int pId))
                query = query.Where(d => d.ProjectId == pId);
            if (!string.IsNullOrEmpty(search))
            {
                var s = search.ToLower();
                query = query.Where(d =>
                    (d.Title != null && d.Title.ToLower().Contains(s)) ||
                    (d.Description != null && d.Description.ToLower().Contains(s)));
            }

            var total = await query.CountAsync();

            bool asc = sortOrder.ToLower() == "asc";
            query = sortBy.ToLower() switch
            {
                "created_at" => asc ? query.OrderBy(d => d.CreatedDate) : query.OrderByDescending(d => d.CreatedDate),
                "title" => asc ? query.OrderBy(d => d.Title) : query.OrderByDescending(d => d.Title),
                "value" => asc ? query.OrderBy(d => d.EstimatedValue) : query.OrderByDescending(d => d.EstimatedValue),
                "stage" => asc ? query.OrderBy(d => d.Stage) : query.OrderByDescending(d => d.Stage),
                _ => asc ? query.OrderBy(d => d.ModifiedDate ?? d.CreatedDate) : query.OrderByDescending(d => d.ModifiedDate ?? d.CreatedDate)
            };

            var deals = await query
                .Skip((page - 1) * limit)
                .Take(limit)
                .Include(d => d.Items)
                .ToListAsync();

            var contacts = await LoadContactsAsync(deals.Select(d => d.ContactId));

            return new PaginatedDealResponse
            {
                Deals = deals.Select(d => MapToDto(d, contacts)).ToList(),
                Pagination = new PaginationInfoDto
                {
                    Page = page,
                    Limit = limit,
                    Total = total,
                    TotalPages = (int)Math.Ceiling(total / (double)limit)
                }
            };
        }

        public async Task<DealDto?> GetDealByIdAsync(int id)
        {
            var deal = await _context.Deals.AsNoTracking()
                .Include(d => d.Items)
                .FirstOrDefaultAsync(d => d.Id == id && !d.IsDeleted);
            if (deal == null) return null;
            var contacts = await LoadContactsAsync(new[] { deal.ContactId });
            return MapToDto(deal, contacts);
        }

        // ── Mutations ──

        public async Task<DealDto> CreateDealAsync(CreateDealDto dto, string userId, string? userName = null)
        {
            var deal = new Deal
            {
                Title = dto.Title,
                Description = dto.Description,
                ContactId = dto.ContactId,
                ProjectId = dto.ProjectId,
                Stage = string.IsNullOrWhiteSpace(dto.Stage) ? "lead" : dto.Stage,
                Probability = dto.Probability,
                EstimatedValue = dto.EstimatedValue,
                Currency = string.IsNullOrWhiteSpace(dto.Currency) ? "TND" : dto.Currency,
                ExpectedCloseDate = dto.ExpectedCloseDate,
                NextActionDate = dto.NextActionDate,
                NextAction = dto.NextAction,
                Category = dto.Category,
                Source = dto.Source,
                Notes = dto.Notes,
                Tags = dto.Tags,
                AssignedTo = dto.AssignedTo,
                AssignedToName = dto.AssignedToName,
                CreatedDate = DateTime.UtcNow,
                CreatedBy = userId,
                CreatedByName = userName,
                LastActivity = DateTime.UtcNow,
            };

            if (dto.Items != null && dto.Items.Any())
            {
                deal.Items = dto.Items.Select((it, idx) => BuildItem(it, idx)).ToList();
            }

            _context.Deals.Add(deal);
            await _context.SaveChangesAsync();

            deal.DealNumber ??= $"DEAL-{deal.Id:D5}";
            deal.EstimatedValue = RecomputeValue(deal);
            await _context.SaveChangesAsync();

            await AddActivityInternalAsync(deal.Id, "created", "Deal created", null, userId, userName);

            var contacts = await LoadContactsAsync(new[] { deal.ContactId });
            return MapToDto(deal, contacts);
        }

        public async Task<DealDto?> UpdateDealAsync(int id, UpdateDealDto dto, string userId, string? userName = null)
        {
            var deal = await _context.Deals.Include(d => d.Items).FirstOrDefaultAsync(d => d.Id == id && !d.IsDeleted);
            if (deal == null) return null;

            var oldStage = deal.Stage;

            if (dto.Title != null) deal.Title = dto.Title;
            if (dto.Description != null) deal.Description = dto.Description;
            if (dto.ContactId.HasValue) deal.ContactId = dto.ContactId.Value;
            if (dto.ProjectId.HasValue) deal.ProjectId = dto.ProjectId.Value;
            if (dto.Stage != null) deal.Stage = dto.Stage;
            if (dto.Probability.HasValue) deal.Probability = dto.Probability.Value;
            if (dto.EstimatedValue.HasValue) deal.EstimatedValue = dto.EstimatedValue.Value;
            if (dto.Currency != null) deal.Currency = dto.Currency;
            if (dto.ExpectedCloseDate.HasValue) deal.ExpectedCloseDate = dto.ExpectedCloseDate;
            if (dto.ActualCloseDate.HasValue) deal.ActualCloseDate = dto.ActualCloseDate;
            if (dto.NextActionDate.HasValue) deal.NextActionDate = dto.NextActionDate;
            if (dto.NextAction != null) deal.NextAction = dto.NextAction;
            if (dto.LostReason != null) deal.LostReason = dto.LostReason;
            if (dto.Category != null) deal.Category = dto.Category;
            if (dto.Source != null) deal.Source = dto.Source;
            if (dto.Notes != null) deal.Notes = dto.Notes;
            if (dto.Tags != null) deal.Tags = dto.Tags;
            if (dto.AssignedTo != null) deal.AssignedTo = dto.AssignedTo;
            if (dto.AssignedToName != null) deal.AssignedToName = dto.AssignedToName;

            // Auto-stamp close date when entering a terminal stage
            if (dto.Stage != null && (dto.Stage == "won" || dto.Stage == "lost") && deal.ActualCloseDate == null)
                deal.ActualCloseDate = DateTime.UtcNow;

            // Replace line items atomically when the caller manages them. Doing it here
            // (rather than via a chatty delete-then-add loop from the client) keeps the
            // whole edit in one transaction and recomputes the value consistently.
            if (dto.Items != null)
            {
                if (deal.Items != null && deal.Items.Any())
                    _context.DealItems.RemoveRange(deal.Items);
                deal.Items = dto.Items.Select((it, idx) => BuildItem(it, idx)).ToList();
                // An explicit item set drives the value; an empty set means 0 (no stale total).
                deal.EstimatedValue = deal.Items.Any()
                    ? Math.Round(deal.Items.Sum(i => i.LineTotal), 2)
                    : (dto.EstimatedValue ?? 0m);
            }

            deal.ModifiedDate = DateTime.UtcNow;
            deal.ModifiedBy = userId;
            deal.LastActivity = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            if (dto.Stage != null && dto.Stage != oldStage)
                await AddActivityInternalAsync(deal.Id, "status_change", $"Stage changed to {dto.Stage}", oldStage, userId, userName, dto.Stage);

            var contacts = await LoadContactsAsync(new[] { deal.ContactId });
            return MapToDto(deal, contacts);
        }

        public async Task<bool> DeleteDealAsync(int id, string userId = "system")
        {
            var deal = await _context.Deals.FirstOrDefaultAsync(d => d.Id == id && !d.IsDeleted);
            if (deal == null) return false;
            deal.IsDeleted = true;
            deal.DeletedAt = DateTime.UtcNow;
            deal.DeletedBy = userId;
            await _context.SaveChangesAsync();
            return true;
        }

        // ── Stats ──

        public async Task<DealStatsDto> GetDealStatsAsync(DateTime? dateFrom = null, DateTime? dateTo = null)
        {
            var query = _context.Deals.AsNoTracking().Where(d => !d.IsDeleted);
            if (dateFrom.HasValue) query = query.Where(d => d.CreatedDate >= dateFrom.Value);
            if (dateTo.HasValue) query = query.Where(d => d.CreatedDate <= dateTo.Value);

            var deals = await query.Select(d => new { d.Stage, d.EstimatedValue }).ToListAsync();

            long total = deals.Count;
            var open = deals.Where(d => OpenStages.Contains(d.Stage)).ToList();
            var won = deals.Where(d => d.Stage == "won").ToList();
            var lost = deals.Where(d => d.Stage == "lost").ToList();
            long decided = won.Count + lost.Count;

            return new DealStatsDto
            {
                TotalDeals = total,
                OpenDeals = open.Count,
                WonDeals = won.Count,
                LostDeals = lost.Count,
                TotalValue = deals.Sum(d => d.EstimatedValue),
                OpenValue = open.Sum(d => d.EstimatedValue),
                WonValue = won.Sum(d => d.EstimatedValue),
                AverageValue = total > 0 ? deals.Sum(d => d.EstimatedValue) / total : 0,
                WinRate = decided > 0 ? Math.Round(won.Count * 100m / decided, 1) : 0
            };
        }

        // ── Conversion ──

        public async Task<ConvertDealResultDto> ConvertDealAsync(int id, ConvertDealDto dto, string userId, string? userName = null)
        {
            if (!dto.ConvertToSale && !dto.ConvertToProject && !dto.ConvertToOffer)
                throw new InvalidOperationException("Select at least one target (sale, project or offer) to convert into.");

            var result = new ConvertDealResultDto();
            // Captured for the (non-fatal) back-link pass that runs after the commit.
            int? saleBackId = null, offerBackId = null, projectBackId = null;

            // The whole conversion is one unit of work: a Sale/Project/Offer must never
            // be committed without the deal's matching ConvertedTo* flag, otherwise a
            // partial failure would orphan records AND defeat the idempotency guards
            // (allowing duplicate conversions). EnableRetryOnFailure forces us to open
            // the transaction inside an execution strategy.
            var strategy = _context.Database.CreateExecutionStrategy();
            await strategy.ExecuteAsync(async () =>
            {
                // On a strategy retry the previous (rolled-back) attempt may have left
                // entities tracked as Added — clear them so we never double-insert.
                _context.ChangeTracker.Clear();
                await using var tx = await _context.Database.BeginTransactionAsync();

                // Reset accumulators so a strategy retry starts from a clean slate.
                result.SaleId = null; result.ProjectId = null; result.OfferId = null;
                saleBackId = offerBackId = projectBackId = null;

                var deal = await _context.Deals.Include(d => d.Items)
                    .FirstOrDefaultAsync(d => d.Id == id && !d.IsDeleted);
                if (deal == null) throw new KeyNotFoundException($"Deal {id} not found");

                // ── Deal → Project (FIRST, so a Sale/Offer in the same call links to it) ──
                if (dto.ConvertToProject)
                {
                    if (!string.IsNullOrEmpty(deal.ConvertedToProjectId))
                        throw new InvalidOperationException($"Deal {id} has already been converted to Project {deal.ConvertedToProjectId}");

                    var projectDto = new CreateProjectRequestDto
                    {
                        Name = deal.Title,
                        Description = deal.Description,
                        ContactId = deal.ContactId,
                        Status = "active",
                        ProjectKind = "client",
                        Priority = "medium",
                        CreateDefaultColumns = true,
                    };
                    var project = await _projectService.CreateProjectAsync(projectDto, userId);
                    result.ProjectId = project.Id;
                    projectBackId = project.Id;
                    deal.ConvertedToProjectId = project.Id.ToString();
                    // The deal now belongs to the project it spawned.
                    deal.ProjectId = project.Id;
                }

                // New project (if just created) wins; otherwise keep any existing link.
                var effectiveProjectId = deal.ProjectId;

                // ── Deal → Sale ──
                if (dto.ConvertToSale)
                {
                    if (!string.IsNullOrEmpty(deal.ConvertedToSaleId))
                        throw new InvalidOperationException($"Deal {id} has already been converted to Sale {deal.ConvertedToSaleId}");

                    var saleDto = new CreateSaleDto
                    {
                        Title = deal.Title,
                        Description = deal.Description,
                        ContactId = deal.ContactId,
                        ProjectId = effectiveProjectId,
                        Status = "created",
                        Currency = deal.Currency,
                        Category = deal.Category,
                        Source = deal.Source,
                        Items = (deal.Items ?? new List<DealItem>()).Select(it => new CreateSaleItemDto
                        {
                            Type = it.Type,
                            ArticleId = it.ArticleId,
                            ItemName = it.ItemName,
                            ItemCode = it.ItemCode,
                            Description = it.Description,
                            Quantity = it.Quantity,
                            UnitPrice = it.UnitPrice,
                            Discount = it.Discount,
                            DiscountType = it.DiscountType,
                            InstallationId = it.InstallationId,
                            InstallationName = it.InstallationName,
                        }).ToList()
                    };
                    var sale = await _saleService.CreateSaleAsync(saleDto, userId);
                    result.SaleId = sale.Id;
                    saleBackId = sale.Id;
                    deal.ConvertedToSaleId = sale.Id.ToString();
                }

                // ── Deal → Offer ──
                if (dto.ConvertToOffer)
                {
                    if (!string.IsNullOrEmpty(deal.ConvertedToOfferId))
                        throw new InvalidOperationException($"Deal {id} has already been converted to Offer {deal.ConvertedToOfferId}");

                    var offerDto = new CreateOfferDto
                    {
                        Title = deal.Title,
                        Description = deal.Description,
                        ContactId = deal.ContactId,
                        ProjectId = effectiveProjectId,
                        Status = "draft",
                        Currency = deal.Currency,
                        Category = deal.Category,
                        Source = deal.Source,
                        Notes = deal.Notes,
                        Items = (deal.Items ?? new List<DealItem>()).Select(it => new CreateOfferItemDto
                        {
                            Type = it.Type,
                            ArticleId = it.ArticleId,
                            ItemName = it.ItemName,
                            ItemCode = it.ItemCode,
                            Description = it.Description,
                            Quantity = it.Quantity,
                            UnitPrice = it.UnitPrice,
                            Discount = it.Discount,
                            DiscountType = it.DiscountType,
                            InstallationId = it.InstallationId,
                            InstallationName = it.InstallationName,
                        }).ToList()
                    };
                    var offer = await _offerService.CreateOfferAsync(offerDto, userId);
                    result.OfferId = offer.Id;
                    offerBackId = offer.Id;
                    deal.ConvertedToOfferId = offer.Id.ToString();
                }

                deal.ConvertedAt = DateTime.UtcNow;
                // A converted deal is won (unless only an offer was drafted).
                if (dto.ConvertToSale || dto.ConvertToProject)
                {
                    deal.Stage = "won";
                    deal.ActualCloseDate ??= DateTime.UtcNow;
                }
                deal.ModifiedDate = DateTime.UtcNow;
                deal.ModifiedBy = userId;
                deal.LastActivity = DateTime.UtcNow;

                var targets = new List<string>();
                if (result.SaleId.HasValue) targets.Add($"Sale #{result.SaleId}");
                if (result.ProjectId.HasValue) targets.Add($"Project #{result.ProjectId}");
                if (result.OfferId.HasValue) targets.Add($"Offer #{result.OfferId}");
                _context.DealActivities.Add(new DealActivity
                {
                    DealId = deal.Id,
                    Type = "converted",
                    Description = $"Converted to {string.Join(", ", targets)}",
                    CreatedAt = DateTime.UtcNow,
                    CreatedBy = userId,
                    CreatedByName = userName,
                });

                await _context.SaveChangesAsync();
                await tx.CommitAsync();
            });

            // ── Forward back-links (best-effort, outside the transaction) ──────────
            // These columns trace a Sale/Offer/Project back to the deal it came from.
            // They're supplementary metadata and may predate the deals migration on a
            // given DB, so a failure here must NOT roll back a successful conversion.
            await TrySetBackLinkAsync("Sales", "DealId", id, saleBackId);
            await TrySetBackLinkAsync("Offers", "DealId", id, offerBackId);
            await TrySetBackLinkAsync("Projects", "ConvertedFromDealId", id, projectBackId);

            return result;
        }

        /// <summary>Stamps a forward back-link column on a spawned record. Non-fatal: logs and
        /// continues if the column doesn't exist yet (table/column names are trusted literals).</summary>
        private async Task TrySetBackLinkAsync(string table, string column, int dealId, int? targetId)
        {
            if (targetId == null) return;
            try
            {
                await _context.Database.ExecuteSqlRawAsync(
                    $"UPDATE \"{table}\" SET \"{column}\" = {{0}} WHERE \"Id\" = {{1}}",
                    dealId, targetId.Value);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex,
                    "Could not set {Table}.{Column} back-link for deal {DealId} (run the deals migration to add it)",
                    table, column, dealId);
            }
        }

        // ── Items ──

        public async Task<DealItemDto?> AddDealItemAsync(int dealId, CreateDealItemDto dto)
        {
            var deal = await _context.Deals.Include(d => d.Items).FirstOrDefaultAsync(d => d.Id == dealId && !d.IsDeleted);
            if (deal == null) return null;
            var order = (deal.Items?.Count ?? 0);
            var item = BuildItem(dto, order);
            item.DealId = dealId;
            _context.DealItems.Add(item);
            await _context.SaveChangesAsync();
            deal.EstimatedValue = RecomputeValue(await ReloadWithItems(dealId));
            deal.ModifiedDate = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return MapItem(item);
        }

        public async Task<DealItemDto?> UpdateDealItemAsync(int dealId, int itemId, CreateDealItemDto dto)
        {
            var item = await _context.DealItems.FirstOrDefaultAsync(i => i.Id == itemId && i.DealId == dealId);
            if (item == null) return null;
            item.ArticleId = dto.ArticleId;
            item.Type = dto.Type;
            item.ItemName = dto.ItemName;
            item.ItemCode = dto.ItemCode;
            item.Description = dto.Description;
            item.Quantity = dto.Quantity;
            item.UnitPrice = dto.UnitPrice;
            item.Discount = dto.Discount;
            item.DiscountType = dto.DiscountType;
            item.InstallationId = dto.InstallationId;
            item.InstallationName = dto.InstallationName;
            item.LineTotal = ComputeLineTotal(dto.Quantity, dto.UnitPrice, dto.Discount, dto.DiscountType);
            await _context.SaveChangesAsync();
            var deal = await ReloadWithItems(dealId);
            if (deal != null) { deal.EstimatedValue = RecomputeValue(deal); deal.ModifiedDate = DateTime.UtcNow; await _context.SaveChangesAsync(); }
            return MapItem(item);
        }

        public async Task<bool> DeleteDealItemAsync(int dealId, int itemId)
        {
            var item = await _context.DealItems.FirstOrDefaultAsync(i => i.Id == itemId && i.DealId == dealId);
            if (item == null) return false;
            _context.DealItems.Remove(item);
            await _context.SaveChangesAsync();
            var deal = await ReloadWithItems(dealId);
            if (deal != null)
            {
                // Removing the last item zeroes the value rather than keeping the stale total.
                deal.EstimatedValue = (deal.Items != null && deal.Items.Any())
                    ? Math.Round(deal.Items.Sum(i => i.LineTotal), 2)
                    : 0m;
                deal.ModifiedDate = DateTime.UtcNow;
                await _context.SaveChangesAsync();
            }
            return true;
        }

        // ── Activities ──

        public async Task<List<DealActivityDto>> GetDealActivitiesAsync(int dealId, string? type = null, int page = 1, int limit = 20)
        {
            var query = _context.DealActivities.AsNoTracking().Where(a => a.DealId == dealId);
            if (!string.IsNullOrEmpty(type)) query = query.Where(a => a.Type == type);
            var list = await query
                .OrderByDescending(a => a.CreatedAt)
                .Skip((page - 1) * limit).Take(limit)
                .ToListAsync();
            return list.Select(MapActivity).ToList();
        }

        public async Task<DealActivityDto?> AddDealActivityAsync(int dealId, CreateDealActivityDto dto, string userId, string? userName = null)
        {
            var deal = await _context.Deals.FirstOrDefaultAsync(d => d.Id == dealId && !d.IsDeleted);
            if (deal == null) return null;
            var activity = await AddActivityInternalAsync(dealId, dto.Type, dto.Description, null, userId, userName, null, dto.Details);
            deal.LastActivity = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return MapActivity(activity);
        }

        public async Task<bool> DeleteDealActivityAsync(int dealId, int activityId)
        {
            var activity = await _context.DealActivities.FirstOrDefaultAsync(a => a.Id == activityId && a.DealId == dealId);
            if (activity == null) return false;
            _context.DealActivities.Remove(activity);
            await _context.SaveChangesAsync();
            return true;
        }

        // ── Helpers ──

        private async Task<DealActivity> AddActivityInternalAsync(int dealId, string type, string description, string? oldValue, string userId, string? userName, string? newValue = null, string? details = null)
        {
            var activity = new DealActivity
            {
                DealId = dealId,
                Type = type,
                Description = description,
                Details = details,
                OldValue = oldValue,
                NewValue = newValue,
                CreatedAt = DateTime.UtcNow,
                CreatedBy = userId,
                CreatedByName = userName,
            };
            _context.DealActivities.Add(activity);
            await _context.SaveChangesAsync();
            return activity;
        }

        private async Task<Deal?> ReloadWithItems(int dealId)
            => await _context.Deals.Include(d => d.Items).FirstOrDefaultAsync(d => d.Id == dealId);

        private static DealItem BuildItem(CreateDealItemDto dto, int order) => new DealItem
        {
            ArticleId = dto.ArticleId,
            Type = string.IsNullOrWhiteSpace(dto.Type) ? "article" : dto.Type,
            ItemName = dto.ItemName,
            ItemCode = dto.ItemCode,
            Description = dto.Description,
            Quantity = dto.Quantity,
            UnitPrice = dto.UnitPrice,
            Discount = dto.Discount,
            DiscountType = dto.DiscountType,
            LineTotal = ComputeLineTotal(dto.Quantity, dto.UnitPrice, dto.Discount, dto.DiscountType),
            DisplayOrder = order,
            InstallationId = dto.InstallationId,
            InstallationName = dto.InstallationName,
        };

        private static decimal ComputeLineTotal(decimal qty, decimal unitPrice, decimal discount, string discountType)
        {
            var gross = qty * unitPrice;
            // Round to 2 dp to match the decimal(18,2) columns (no compute-vs-stored drift).
            if (discount <= 0) return Math.Round(gross, 2);
            var net = discountType == "fixed" ? gross - discount : gross * (1 - discount / 100m);
            return Math.Round(Math.Max(net, 0), 2);
        }

        /// <summary>If a deal has line items, its value is the sum of them; otherwise keep the manual estimate.</summary>
        private static decimal RecomputeValue(Deal? deal)
        {
            if (deal == null) return 0;
            if (deal.Items != null && deal.Items.Any())
                return Math.Round(deal.Items.Sum(i => i.LineTotal), 2);
            return deal.EstimatedValue;
        }

        private async Task<Dictionary<int, MyApi.Modules.Contacts.Models.Contact>> LoadContactsAsync(IEnumerable<int> ids)
        {
            var idList = ids.Distinct().ToList();
            if (!idList.Any()) return new();
            return await _context.Contacts.AsNoTracking()
                .Where(c => idList.Contains(c.Id))
                .ToDictionaryAsync(c => c.Id);
        }

        private static DealDto MapToDto(Deal d, Dictionary<int, MyApi.Modules.Contacts.Models.Contact> contacts)
        {
            contacts.TryGetValue(d.ContactId, out var contact);
            var contactName = contact != null ? $"{contact.FirstName} {contact.LastName}".Trim() : null;
            return new DealDto
            {
                Id = d.Id,
                DealNumber = d.DealNumber,
                Title = d.Title,
                Description = d.Description,
                ContactId = d.ContactId,
                ContactName = contactName,
                Contact = contact == null ? null : new DealContactSummaryDto
                {
                    Id = contact.Id,
                    Name = contactName,
                    Company = contact.Company,
                    Email = contact.Email,
                    Phone = contact.Phone,
                    Address = contact.Address,
                    City = contact.City,
                },
                ProjectId = d.ProjectId,
                Stage = d.Stage,
                Probability = d.Probability,
                EstimatedValue = d.EstimatedValue,
                Currency = d.Currency,
                ExpectedCloseDate = d.ExpectedCloseDate,
                ActualCloseDate = d.ActualCloseDate,
                NextActionDate = d.NextActionDate,
                NextAction = d.NextAction,
                LostReason = d.LostReason,
                Category = d.Category,
                Source = d.Source,
                Notes = d.Notes,
                Tags = d.Tags,
                AssignedTo = d.AssignedTo,
                AssignedToName = d.AssignedToName,
                ConvertedToOfferId = d.ConvertedToOfferId,
                ConvertedToSaleId = d.ConvertedToSaleId,
                ConvertedToProjectId = d.ConvertedToProjectId,
                ConvertedAt = d.ConvertedAt,
                CreatedAt = d.CreatedDate,
                UpdatedAt = d.ModifiedDate,
                CreatedBy = d.CreatedBy,
                CreatedByName = d.CreatedByName,
                LastActivity = d.LastActivity,
                Items = (d.Items ?? new List<DealItem>()).OrderBy(i => i.DisplayOrder).Select(MapItem).ToList(),
            };
        }

        private static DealItemDto MapItem(DealItem i) => new DealItemDto
        {
            Id = i.Id,
            DealId = i.DealId,
            ArticleId = i.ArticleId,
            Type = i.Type,
            ItemName = i.ItemName,
            ItemCode = i.ItemCode,
            Description = i.Description,
            Quantity = i.Quantity,
            UnitPrice = i.UnitPrice,
            Discount = i.Discount,
            DiscountType = i.DiscountType,
            LineTotal = i.LineTotal,
            DisplayOrder = i.DisplayOrder,
            InstallationId = i.InstallationId,
            InstallationName = i.InstallationName,
        };

        private static DealActivityDto MapActivity(DealActivity a) => new DealActivityDto
        {
            Id = a.Id,
            DealId = a.DealId,
            Type = a.Type,
            Description = a.Description,
            Details = a.Details,
            OldValue = a.OldValue,
            NewValue = a.NewValue,
            CreatedAt = a.CreatedAt,
            CreatedBy = a.CreatedBy,
            CreatedByName = a.CreatedByName,
        };
    }
}

using Microsoft.EntityFrameworkCore;
using MyApi.Data;
using MyApi.Modules.Sales.DTOs;
using MyApi.Modules.Sales.Models;
using MyApi.Modules.Contacts.Models;
using MyApi.Modules.Articles.Services;
using MyApi.Modules.WorkflowEngine.Services;

namespace MyApi.Modules.Sales.Services
{
    public class SaleService : ISaleService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<SaleService> _logger;
        private readonly IStockTransactionService? _stockTransactionService;
        private readonly IWorkflowTriggerService? _workflowTriggerService;
        private readonly MyApi.Modules.Numbering.Services.INumberingService? _numberingService;

        public SaleService(
            ApplicationDbContext context, 
            ILogger<SaleService> logger,
            IStockTransactionService? stockTransactionService = null,
            IWorkflowTriggerService? workflowTriggerService = null,
            MyApi.Modules.Numbering.Services.INumberingService? numberingService = null)
        {
            _context = context;
            _logger = logger;
            _stockTransactionService = stockTransactionService;
            _workflowTriggerService = workflowTriggerService;
            _numberingService = numberingService;
        }

        public async Task<PaginatedSaleResponse> GetSalesAsync(
            string? status = null,
            string? stage = null,
            string? priority = null,
            string? contactId = null,
            DateTime? dateFrom = null,
            DateTime? dateTo = null,
            string? search = null,
            int page = 1,
            int limit = 20,
            string sortBy = "updated_at",
            string sortOrder = "desc"
        )
        {
            var query = _context.Sales.AsNoTracking().Where(s => !s.IsDeleted).AsQueryable();

            if (!string.IsNullOrEmpty(status))
                query = query.Where(s => s.Status == status);

            if (!string.IsNullOrEmpty(stage))
                query = query.Where(s => s.Stage == stage);

            if (!string.IsNullOrEmpty(priority))
                query = query.Where(s => s.Priority == priority);

            if (!string.IsNullOrEmpty(contactId) && int.TryParse(contactId, out int contactIdInt))
                query = query.Where(s => s.ContactId == contactIdInt);

            if (dateFrom.HasValue)
                query = query.Where(s => s.CreatedDate >= dateFrom.Value);

            if (dateTo.HasValue)
                query = query.Where(s => s.CreatedDate <= dateTo.Value);

            if (!string.IsNullOrEmpty(search))
            {
                var searchLower = search.ToLower();
                query = query.Where(s =>
                    (s.Title != null && s.Title.ToLower().Contains(searchLower)) ||
                    (s.Description != null && s.Description.ToLower().Contains(searchLower))
                );
            }

            var total = await query.CountAsync();

            query = sortBy.ToLower() switch
            {
                "created_at" => sortOrder.ToLower() == "asc" ? query.OrderBy(s => s.CreatedDate) : query.OrderByDescending(s => s.CreatedDate),
                "title" => sortOrder.ToLower() == "asc" ? query.OrderBy(s => s.Title) : query.OrderByDescending(s => s.Title),
                "amount" => sortOrder.ToLower() == "asc" ? query.OrderBy(s => s.TotalAmount) : query.OrderByDescending(s => s.TotalAmount),
                _ => sortOrder.ToLower() == "asc" ? query.OrderBy(s => s.UpdatedAt) : query.OrderByDescending(s => s.UpdatedAt)
            };

            var sales = await query
                .Skip((page - 1) * limit)
                .Take(limit)
                .Include(s => s.Items)
                .ToListAsync();
                
            var contactIds = sales.Select(s => s.ContactId).Distinct().ToList();
            var contacts = await _context.Contacts
                .AsNoTracking()
                .Where(c => contactIds.Contains(c.Id))
                .ToDictionaryAsync(c => c.Id);

            var saleDtos = sales.Select(s => MapToDto(s, contacts.GetValueOrDefault(s.ContactId))).ToList();

            return new PaginatedSaleResponse
            {
                Sales = saleDtos,
                Pagination = new PaginationInfo
                {
                    Page = page,
                    Limit = limit,
                    Total = total,
                    TotalPages = (int)Math.Ceiling((double)total / limit)
                }
            };
        }

        public async Task<SaleDto?> GetSaleByIdAsync(int id)
        {
            var sale = await _context.Sales
                .AsNoTracking()
                .Include(s => s.Items)
                .FirstOrDefaultAsync(s => s.Id == id && !s.IsDeleted);

            if (sale == null) return null;
            
            var contact = await _context.Contacts.FindAsync(sale.ContactId);
            return MapToDto(sale, contact);
        }

        public async Task<SaleDto> CreateSaleAsync(CreateSaleDto createDto, string userId)
        {
            // Verify contact exists
            var contact = await _context.Contacts.FindAsync(createDto.ContactId);
            if (contact == null)
                throw new KeyNotFoundException($"Contact with ID {createDto.ContactId} not found");

            string saleNumber;
            try
            {
                saleNumber = _numberingService != null ? await _numberingService.GetNextAsync("Sale") : $"SALE-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString().Substring(0, 5).ToUpper()}";
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Numbering service failed for Sale, using GUID fallback");
                saleNumber = $"SALE-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString().Substring(0, 5).ToUpper()}";
            }

            var sale = new Sale
            {
                SaleNumber = saleNumber,
                Title = createDto.Title,
                Description = createDto.Description,
                ContactId = createDto.ContactId,
                ProjectId = createDto.ProjectId,
                Status = createDto.Status ?? "won",
                Stage = createDto.Stage ?? "closed",
                Priority = createDto.Priority,
                Currency = createDto.Currency ?? "TND",
                EstimatedCloseDate = createDto.EstimatedCloseDate,
                ActualCloseDate = createDto.ActualCloseDate,
                BillingAddress = createDto.BillingAddress,
                BillingPostalCode = createDto.BillingPostalCode,
                BillingCountry = createDto.BillingCountry,
                DeliveryAddress = createDto.DeliveryAddress,
                DeliveryPostalCode = createDto.DeliveryPostalCode,
                DeliveryCountry = createDto.DeliveryCountry,
                Taxes = createDto.Taxes ?? 0,
                TaxType = createDto.TaxType ?? "percentage",
                Discount = createDto.Discount ?? 0,
                FiscalStamp = createDto.FiscalStamp ?? 1.000m,
                TotalAmount = 0,
                OfferId = createDto.OfferId,
                CreatedBy = userId,
                CreatedDate = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                Tags = new string[] { },
                // Copy contact geolocation
                ContactLatitude = contact.Latitude,
                ContactLongitude = contact.Longitude,
                ContactHasLocation = contact.HasLocation
            };

            _context.Sales.Add(sale);
            await _context.SaveChangesAsync();

            // Add items if provided
            if (createDto.Items != null && createDto.Items.Any())
            {
                var items = createDto.Items.Select(itemDto => new SaleItem
                {
                    // Id is auto-generated
                    SaleId = sale.Id,
                    Type = itemDto.Type ?? "article",
                    ArticleId = itemDto.ArticleId,
                    ItemName = itemDto.ItemName,
                    ItemCode = itemDto.ItemCode,
                    Description = itemDto.Description ?? itemDto.ItemName ?? string.Empty,
                    Quantity = itemDto.Quantity,
                    UnitPrice = itemDto.UnitPrice,
                    Discount = itemDto.Discount,
                    DiscountType = itemDto.DiscountType ?? "percentage",
                    InstallationId = itemDto.InstallationId,
                    InstallationName = itemDto.InstallationName,
                    RequiresServiceOrder = itemDto.RequiresServiceOrder
                }).ToList();

                _context.SaleItems.AddRange(items);
                await _context.SaveChangesAsync();
            }

            var createdSale = await GetSaleByIdAsync(sale.Id);
            return createdSale!;
        }

        public async Task<SaleDto> CreateSaleFromOfferAsync(int offerId, string userId)
        {
            var offer = await _context.Offers
                .Include(o => o.Items)
                .FirstOrDefaultAsync(o => o.Id == offerId);

            if (offer == null)
                throw new KeyNotFoundException($"Offer with ID {offerId} not found");

            // Get user name for sale and activity
            string createdByName = userId;
            var adminUser = await _context.MainAdminUsers.FirstOrDefaultAsync(u => u.Id.ToString() == userId);
            if (adminUser != null)
            {
                createdByName = $"{adminUser.FirstName} {adminUser.LastName}".Trim();
            }
            else
            {
                var regularUser = await _context.Users.FirstOrDefaultAsync(u => u.Id.ToString() == userId);
                if (regularUser != null)
                {
                    createdByName = $"{regularUser.FirstName} {regularUser.LastName}".Trim();
                }
            }

            // Get contact for geolocation data
            var contact = await _context.Contacts.FindAsync(offer.ContactId);

            string saleNumber2;
            try
            {
                saleNumber2 = _numberingService != null ? await _numberingService.GetNextAsync("Sale") : $"SALE-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString().Substring(0, 5).ToUpper()}";
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Numbering service failed for Sale (from offer), using GUID fallback");
                saleNumber2 = $"SALE-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString().Substring(0, 5).ToUpper()}";
            }

            var sale = new Sale
            {
                SaleNumber = saleNumber2,
                Title = offer.Title,
                Description = offer.Description,
                ContactId = offer.ContactId,
                ProjectId = offer.ProjectId,
                Status = "created",  // Start with 'created' status instead of 'won'
                Stage = "offer",     // Start at 'offer' stage
                Priority = "medium",
                Currency = offer.Currency ?? "TND",
                BillingAddress = offer.BillingAddress,
                BillingPostalCode = offer.BillingPostalCode,
                BillingCountry = offer.BillingCountry,
                DeliveryAddress = offer.DeliveryAddress,
                DeliveryPostalCode = offer.DeliveryPostalCode,
                DeliveryCountry = offer.DeliveryCountry,
                Taxes = offer.Taxes ?? 0,
                TaxType = offer.TaxType ?? "percentage",
                Discount = offer.Discount ?? 0,
                FiscalStamp = offer.FiscalStamp ?? 1.000m,
                TotalAmount = offer.TotalAmount,
                AssignedTo = offer.AssignedTo,
                AssignedToName = offer.AssignedToName,
                Tags = offer.Tags != null ? offer.Tags.Concat(new[] { "Converted" }).ToArray() : new[] { "Converted" },
                OfferId = offerId.ToString(),
                ConvertedFromOfferAt = DateTime.UtcNow,
                CreatedBy = userId,
                CreatedByName = createdByName,
                CreatedDate = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                // Copy contact geolocation
                ContactLatitude = contact?.Latitude ?? offer.ContactLatitude,
                ContactLongitude = contact?.Longitude ?? offer.ContactLongitude,
                ContactHasLocation = contact?.HasLocation ?? offer.ContactHasLocation
            };

            _context.Sales.Add(sale);
            await _context.SaveChangesAsync();

            // Copy items
            if (offer.Items != null && offer.Items.Any())
            {
                var saleItems = offer.Items.Select(offerItem => new SaleItem
                {
                    SaleId = sale.Id,
                    Type = offerItem.Type,
                    ArticleId = offerItem.ArticleId,
                    ItemName = offerItem.ItemName,
                    ItemCode = offerItem.ItemCode,
                    Description = offerItem.Description ?? offerItem.ItemName ?? "Item",
                    Quantity = offerItem.Quantity,
                    UnitPrice = offerItem.UnitPrice,
                    Discount = offerItem.Discount,
                    DiscountType = offerItem.DiscountType ?? "percentage",
                    InstallationId = offerItem.InstallationId,
                    InstallationName = offerItem.InstallationName,
                    RequiresServiceOrder = offerItem.Type == "service",
                    FulfillmentStatus = "pending",
                    TaxRate = 0
                }).ToList();

                _context.SaleItems.AddRange(saleItems);
            }

            // Update offer status
            offer.Status = "accepted";
            offer.ConvertedToSaleId = sale.Id.ToString();
            offer.ConvertedAt = DateTime.UtcNow;
            offer.UpdatedAt = DateTime.UtcNow;

            // Log sale creation activity
            var creationActivity = new SaleActivity
            {
                SaleId = sale.Id,
                Type = "created",
                Description = $"Sale order created from Offer #{offer.OfferNumber}",
                CreatedAt = DateTime.UtcNow,
                CreatedByName = createdByName
            };
            _context.SaleActivities.Add(creationActivity);

            await _context.SaveChangesAsync();

            var createdSale = await GetSaleByIdAsync(sale.Id);
            return createdSale!;
        }

        public async Task<SaleDto> UpdateSaleAsync(int id, UpdateSaleDto updateDto, string userId)
        {
            var sale = await _context.Sales
                .Include(s => s.Items)
                .FirstOrDefaultAsync(s => s.Id == id);
            if (sale == null)
                throw new KeyNotFoundException($"Sale with ID {id} not found");

            // Track if status is changing to closed/won for stock deduction
            var previousStatus = sale.Status;
            var isClosing = updateDto.Status != null && 
                           (updateDto.Status == "closed" || updateDto.Status == "won" || updateDto.Status == "completed") &&
                           previousStatus != "closed" && previousStatus != "won" && previousStatus != "completed";

            // Track if status is changing from closed to something else (reopening)
            var isReopening = updateDto.Status != null &&
                             updateDto.Status != "closed" && updateDto.Status != "won" && updateDto.Status != "completed" &&
                             (previousStatus == "closed" || previousStatus == "won" || previousStatus == "completed");

            // Status guard: once a sale is finalized (closed/won/completed/cancelled/lost),
            // financial & scope fields are locked. Tags, addresses, description, fulfillment
            // tracking, status transitions, and close dates can still be edited.
            var finalizedSaleStatuses = new[] { "closed", "won", "completed", "cancelled", "lost" };
            var isSaleFinalized = !string.IsNullOrEmpty(previousStatus) &&
                                  finalizedSaleStatuses.Contains(previousStatus);

            bool TriedToEditSaleFinancials() =>
                updateDto.Amount.HasValue ||
                updateDto.Taxes.HasValue ||
                updateDto.TaxType != null ||
                updateDto.Discount.HasValue ||
                updateDto.FiscalStamp.HasValue;

            if (isSaleFinalized && TriedToEditSaleFinancials())
            {
                throw new InvalidOperationException(
                    $"Cannot modify financial fields on a {previousStatus} sale. " +
                    "Reopen the sale first (change status) or create a new sale.");
            }

            if (updateDto.Title != null) sale.Title = updateDto.Title;
            if (updateDto.ProjectId.HasValue) sale.ProjectId = updateDto.ProjectId.Value;
            if (updateDto.Description != null) sale.Description = updateDto.Description;
            if (updateDto.Status != null) sale.Status = updateDto.Status;
            if (updateDto.Stage != null) sale.Stage = updateDto.Stage;
            if (updateDto.Priority != null) sale.Priority = updateDto.Priority;
            if (!isSaleFinalized && updateDto.Amount.HasValue) sale.TotalAmount = updateDto.Amount.Value;
            if (!isSaleFinalized && updateDto.Taxes.HasValue) sale.Taxes = updateDto.Taxes.Value;
            if (!isSaleFinalized && updateDto.TaxType != null) sale.TaxType = updateDto.TaxType;
            if (!isSaleFinalized && updateDto.Discount.HasValue) sale.Discount = updateDto.Discount.Value;
            if (!isSaleFinalized && updateDto.FiscalStamp.HasValue) sale.FiscalStamp = updateDto.FiscalStamp.Value;
            if (updateDto.EstimatedCloseDate.HasValue) sale.EstimatedCloseDate = updateDto.EstimatedCloseDate;
            if (updateDto.ActualCloseDate.HasValue) sale.ActualCloseDate = updateDto.ActualCloseDate;
            if (updateDto.BillingAddress != null) sale.BillingAddress = updateDto.BillingAddress;
            if (updateDto.BillingPostalCode != null) sale.BillingPostalCode = updateDto.BillingPostalCode;
            if (updateDto.BillingCountry != null) sale.BillingCountry = updateDto.BillingCountry;
            if (updateDto.DeliveryAddress != null) sale.DeliveryAddress = updateDto.DeliveryAddress;
            if (updateDto.DeliveryPostalCode != null) sale.DeliveryPostalCode = updateDto.DeliveryPostalCode;
            if (updateDto.DeliveryCountry != null) sale.DeliveryCountry = updateDto.DeliveryCountry;
            if (updateDto.LostReason != null) sale.LostReason = updateDto.LostReason;
            if (updateDto.MaterialsFulfillment != null) sale.MaterialsFulfillment = updateDto.MaterialsFulfillment;
            if (updateDto.ServiceOrdersStatus != null) sale.ServiceOrdersStatus = updateDto.ServiceOrdersStatus;
            if (updateDto.Tags != null) sale.Tags = updateDto.Tags;

            // Auto-set ActualCloseDate when closing, clear when reopening
            if (isClosing && !sale.ActualCloseDate.HasValue)
            {
                sale.ActualCloseDate = DateTime.UtcNow;
            }
            if (isReopening)
            {
                sale.ActualCloseDate = null;
            }

            sale.UpdatedAt = DateTime.UtcNow;
            sale.ModifiedBy = userId;

            await _context.SaveChangesAsync();

            // Get user name for stock transaction logging
            string userName = await ResolveUserNameAsync(userId);

            // Deduct stock from materials when sale is closed
            if (isClosing && _stockTransactionService != null)
            {
                try
                {
                    _logger.LogInformation("Sale {SaleId} closed, deducting stock for material items", id);
                    var result = await _stockTransactionService.DeductStockFromSaleAsync(id, userId, userName);
                    
                    if (!result.Success)
                    {
                        _logger.LogWarning("Some stock deductions failed for sale {SaleId}: {Errors}", 
                            id, string.Join(", ", result.Errors));
                    }
                    else
                    {
                        _logger.LogInformation("Successfully deducted stock for {Count} items from sale {SaleId}", 
                            result.ItemsDeducted, id);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error deducting stock for sale {SaleId}", id);
                    // Don't fail the sale update, just log the error
                }
            }

            // Restore stock when sale is reopened/cancelled
            if (isReopening && _stockTransactionService != null)
            {
                try
                {
                    _logger.LogInformation("Sale {SaleId} reopened, restoring stock for material items", id);
                    var result = await _stockTransactionService.RestoreStockFromSaleAsync(id, userId, userName);
                    
                    if (!result.Success)
                    {
                        _logger.LogWarning("Some stock restorations failed for sale {SaleId}: {Errors}", 
                            id, string.Join(", ", result.Errors));
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error restoring stock for sale {SaleId}", id);
                }
            }

            // Trigger workflow automation for status change
            if (updateDto.Status != null && previousStatus != updateDto.Status && _workflowTriggerService != null)
            {
                try
                {
                    // Include service order config in the context if provided
                    var contextData = new Dictionary<string, object>
                    {
                        { "saleId", id },
                        { "saleNumber", sale.SaleNumber ?? "" },
                        { "title", sale.Title ?? "" }
                    };
                    
                    if (updateDto.ServiceOrderConfig != null)
                    {
                        contextData["serviceOrderConfig"] = updateDto.ServiceOrderConfig;
                    }
                    
                    await _workflowTriggerService.TriggerStatusChangeAsync(
                        "sale",
                        id,
                        previousStatus ?? "",
                        updateDto.Status,
                        userId,
                        contextData
                    );
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to trigger workflow for sale {SaleId} status change", id);
                }
            }

            var updatedSale = await GetSaleByIdAsync(id);
            return updatedSale!;
        }

        public async Task<bool> DeleteSaleAsync(int id, string userId = "system")
        {
            // Wrap in execution strategy to be compatible with EnableRetryOnFailure
            var strategy = _context.Database.CreateExecutionStrategy();
            return await strategy.ExecuteAsync(async () =>
            {
                using var transaction = await _context.Database.BeginTransactionAsync();
                try
                {
                    var sale = await _context.Sales
                        .Include(s => s.Items)
                        .FirstOrDefaultAsync(s => s.Id == id);

                    if (sale == null || sale.IsDeleted)
                        return false;

                    // Get user name for activity logging
                    string deletedByName = userId;
                    var adminUser = await _context.MainAdminUsers.FirstOrDefaultAsync(u => u.Id.ToString() == userId);
                    if (adminUser != null)
                    {
                        deletedByName = $"{adminUser.FirstName} {adminUser.LastName}".Trim();
                    }
                    else
                    {
                        var regularUser = await _context.Users.FirstOrDefaultAsync(u => u.Id.ToString() == userId);
                        if (regularUser != null)
                        {
                            deletedByName = $"{regularUser.FirstName} {regularUser.LastName}".Trim();
                        }
                    }

                    // Get sale item IDs before deletion
                    var saleItemIds = sale.Items?.Select(i => i.Id).ToList() ?? new List<int>();

                    // Nullify SaleItemId references in ServiceOrderJobs
                    if (saleItemIds.Any())
                    {
                        // Parameterized update for each sale item ID to prevent SQL injection
                        foreach (var saleItemId in saleItemIds)
                        {
                            await _context.Database.ExecuteSqlAsync(
                                $@"UPDATE ""ServiceOrderJobs"" SET ""SaleItemId"" = NULL WHERE ""SaleItemId"" = {saleItemId.ToString()}");
                        }
                    }

                    // Nullify SaleId reference in ServiceOrders (cast int to string for VARCHAR column)
                    await _context.Database.ExecuteSqlRawAsync(
                        @"UPDATE ""ServiceOrders"" SET ""SaleId"" = NULL WHERE ""SaleId"" = @p0 AND ""TenantId"" = @p1",
                        id.ToString(), _context.GetTenantId());

                    // If sale was converted from an offer, reset the offer and log activity
                    if (!string.IsNullOrEmpty(sale.OfferId) && int.TryParse(sale.OfferId, out int offerId))
                    {
                        var offer = await _context.Offers.FindAsync(offerId);
                        if (offer != null)
                        {
                            // Reset offer so it can be converted again
                            offer.ConvertedToSaleId = null;
                            offer.ConvertedAt = null;
                            offer.Status = "sent"; // Reset to sent status
                            offer.UpdatedAt = DateTime.UtcNow;

                            // Create activity on the offer
                            var offerActivity = new MyApi.Modules.Offers.Models.OfferActivity
                            {
                                OfferId = offerId,
                                Type = "sale_deleted",
                                Description = $"Sale #{sale.SaleNumber} was deleted by {deletedByName}. The offer can now be converted to a new sale.",
                                CreatedAt = DateTime.UtcNow,
                                CreatedByName = deletedByName
                            };
                            _context.OfferActivities.Add(offerActivity);
                        }
                    }

                    sale.IsDeleted = true;
                    sale.DeletedAt = DateTime.UtcNow;
                    sale.DeletedBy = userId;
                    await _context.SaveChangesAsync();
                    await transaction.CommitAsync();
                    return true;
                }
                catch (Exception ex)
                {
                    await transaction.RollbackAsync();
                    _logger.LogError(ex, "Error deleting sale {SaleId}", id);
                    throw;
                }
            });
        }

        public async Task<SaleStatsDto> GetSaleStatsAsync(DateTime? dateFrom = null, DateTime? dateTo = null)
        {
            var query = _context.Sales.AsQueryable();

            if (dateFrom.HasValue)
                query = query.Where(s => s.CreatedDate >= dateFrom.Value);

            if (dateTo.HasValue)
                query = query.Where(s => s.CreatedDate <= dateTo.Value);

            var sales = await query.ToListAsync();

            var totalSales = sales.Count;
            var activeSales = sales.Count(s => new[] { "new_offer", "draft", "sent", "accepted" }.Contains(s.Status));
            var wonSales = sales.Count(s => new[] { "won", "completed" }.Contains(s.Status));
            var lostSales = sales.Count(s => new[] { "lost", "cancelled" }.Contains(s.Status));
            var totalValue = sales.Sum(s => s.GrandTotal > 0 ? s.GrandTotal : s.TotalAmount);
            var averageValue = totalSales > 0 ? totalValue / totalSales : 0;
            var conversionRate = totalSales > 0 ? (decimal)wonSales / totalSales * 100 : 0;

            return new SaleStatsDto
            {
                TotalSales = totalSales,
                ActiveSales = activeSales,
                WonSales = wonSales,
                LostSales = lostSales,
                TotalValue = totalValue,
                AverageValue = averageValue,
                WinRate = Math.Round(conversionRate, 2),
                ConversionRate = Math.Round(conversionRate, 2),
                MonthlyGrowth = 15.2m
            };
        }

        public async Task<SaleItemDto> AddSaleItemAsync(int saleId, CreateSaleItemDto itemDto)
        {
            var sale = await _context.Sales.FindAsync(saleId);
            if (sale == null)
                throw new KeyNotFoundException($"Sale with ID {saleId} not found");

            var item = new SaleItem
            {
                SaleId = saleId,
                Type = itemDto.Type,
                ArticleId = itemDto.ArticleId,
                ItemName = itemDto.ItemName,
                ItemCode = itemDto.ItemCode,
                Description = itemDto.Description ?? string.Empty,
                Quantity = itemDto.Quantity,
                UnitPrice = itemDto.UnitPrice,
                Discount = itemDto.Discount,
                DiscountType = itemDto.DiscountType,
                InstallationId = itemDto.InstallationId,
                InstallationName = itemDto.InstallationName,
                RequiresServiceOrder = itemDto.RequiresServiceOrder
            };

            _context.SaleItems.Add(item);
            await _context.SaveChangesAsync();

            var addedItem = await _context.SaleItems.FindAsync(item.Id);
            return MapItemToDto(addedItem!);
        }

        public async Task<SaleItemDto> UpdateSaleItemAsync(int saleId, int itemId, CreateSaleItemDto itemDto)
        {
            var item = await _context.SaleItems
                .FirstOrDefaultAsync(i => i.Id == itemId && i.SaleId == saleId);

            if (item == null)
                throw new KeyNotFoundException($"Item with ID {itemId} not found in sale {saleId}");

            item.Type = itemDto.Type;
            item.ArticleId = itemDto.ArticleId;
            item.ItemName = itemDto.ItemName;
            item.ItemCode = itemDto.ItemCode;
            item.Description = itemDto.Description ?? string.Empty;
            item.Quantity = itemDto.Quantity;
            item.UnitPrice = itemDto.UnitPrice;
            item.Discount = itemDto.Discount;
            item.DiscountType = itemDto.DiscountType;
            item.InstallationId = itemDto.InstallationId;
            item.InstallationName = itemDto.InstallationName;
            item.RequiresServiceOrder = itemDto.RequiresServiceOrder;

            await _context.SaveChangesAsync();

            var updatedItem = await _context.SaleItems.FindAsync(itemId);
            return MapItemToDto(updatedItem!);
        }

        public async Task<bool> DeleteSaleItemAsync(int saleId, int itemId)
        {
            var item = await _context.SaleItems
                .FirstOrDefaultAsync(i => i.Id == itemId && i.SaleId == saleId);

            if (item == null)
                return false;

            _context.SaleItems.Remove(item);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<List<SaleActivityDto>> GetSaleActivitiesAsync(int saleId, string? type = null, int page = 1, int limit = 20)
        {
            var query = _context.SaleActivities.Where(a => a.SaleId == saleId);

            if (!string.IsNullOrEmpty(type))
                query = query.Where(a => a.Type == type);

            var activities = await query
                .OrderByDescending(a => a.CreatedAt)
                .Skip((page - 1) * limit)
                .Take(limit)
                .ToListAsync();

            return activities.Select(a => new SaleActivityDto
            {
                Id = a.Id,
                SaleId = a.SaleId,
                Type = a.Type ?? "",
                Description = a.Description ?? "",
                OldValue = null,
                NewValue = null,
                CreatedAt = a.CreatedAt,
                CreatedBy = a.CreatedByName ?? ""
            }).ToList();
        }

        private SaleDto MapToDto(Sale sale, Contact? contact)
        {
            return new SaleDto
            {
                Id = sale.Id,
                SaleNumber = sale.SaleNumber,
                Title = sale.Title ?? "",
                Description = sale.Description,
                ContactId = sale.ContactId,
                ProjectId = sale.ProjectId,
                Contact = contact != null ? new ContactSummaryDto
                {
                    Id = contact.Id,
                    Name = $"{contact.FirstName} {contact.LastName}".Trim(),
                    Company = contact.Company,
                    Email = contact.Email,
                    Phone = contact.Phone,
                    Address = contact.Address,
                    City = contact.City,
                    Latitude = contact.Latitude,
                    Longitude = contact.Longitude,
                    HasLocation = contact.HasLocation
                } : null,
                Amount = sale.TotalAmount,
                Currency = sale.Currency ?? "TND",
                Taxes = sale.Taxes,
                TaxType = sale.TaxType,
                Discount = sale.Discount,
                FiscalStamp = sale.FiscalStamp,
                TotalAmount = sale.GrandTotal > 0 ? sale.GrandTotal : sale.TotalAmount,
                Status = sale.Status,
                Stage = sale.Stage,
                Priority = sale.Priority,
                BillingAddress = sale.BillingAddress,
                BillingPostalCode = sale.BillingPostalCode,
                BillingCountry = sale.BillingCountry,
                DeliveryAddress = sale.DeliveryAddress,
                DeliveryPostalCode = sale.DeliveryPostalCode,
                DeliveryCountry = sale.DeliveryCountry,
                EstimatedCloseDate = sale.EstimatedCloseDate,
                ActualCloseDate = sale.ActualCloseDate,
                ValidUntil = sale.ValidUntil,
                AssignedTo = sale.AssignedTo,
                AssignedToName = sale.AssignedToName,
                Tags = sale.Tags,
                CreatedAt = sale.CreatedDate,
                UpdatedAt = sale.UpdatedAt ?? sale.CreatedDate,
                CreatedBy = sale.CreatedBy,
                CreatedByName = sale.CreatedByName,
                LastActivity = sale.LastActivity,
                OfferId = sale.OfferId,
                ConvertedFromOfferAt = sale.ConvertedFromOfferAt,
                LostReason = sale.LostReason,
                MaterialsFulfillment = sale.MaterialsFulfillment,
                ServiceOrdersStatus = sale.ServiceOrdersStatus,
                Notes = sale.Notes,
                // Get the first service order ID from items that have been converted
                ConvertedToServiceOrderId = sale.Items?.FirstOrDefault(i => !string.IsNullOrEmpty(i.ServiceOrderId))?.ServiceOrderId,
                Items = sale.Items?.Select(MapItemToDto).ToList() ?? new List<SaleItemDto>()
            };
        }

        private SaleItemDto MapItemToDto(SaleItem item)
        {
            return new SaleItemDto
            {
                Id = item.Id,
                SaleId = item.SaleId,
                Type = item.Type ?? "",
                ArticleId = item.ArticleId,
                ItemName = item.ItemName ?? "",
                ItemCode = item.ItemCode,
                Description = item.Description,
                Quantity = item.Quantity,
                UnitPrice = item.UnitPrice,
                Discount = item.Discount ?? 0,
                DiscountType = item.DiscountType ?? "percentage",
                TotalPrice = item.LineTotal,
                InstallationId = item.InstallationId,
                InstallationName = item.InstallationName,
                RequiresServiceOrder = item.RequiresServiceOrder,
                ServiceOrderGenerated = item.ServiceOrderGenerated,
                ServiceOrderId = item.ServiceOrderId,
                FulfillmentStatus = item.FulfillmentStatus
            };
        }

        private async Task<string> ResolveUserNameAsync(string userId)
        {
            // Try admin users first
            var adminUser = await _context.MainAdminUsers.FirstOrDefaultAsync(u => u.Id.ToString() == userId);
            if (adminUser != null)
                return $"{adminUser.FirstName} {adminUser.LastName}".Trim();

            // Try regular users
            var regularUser = await _context.Users.FirstOrDefaultAsync(u => u.Id.ToString() == userId);
            if (regularUser != null)
                return $"{regularUser.FirstName} {regularUser.LastName}".Trim();

            return userId;
        }
    }
}

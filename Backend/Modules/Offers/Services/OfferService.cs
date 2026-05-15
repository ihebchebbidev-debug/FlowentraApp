using Microsoft.EntityFrameworkCore;
using MyApi.Data;
using MyApi.Modules.Offers.DTOs;
using MyApi.Modules.Offers.Models;
using MyApi.Modules.Contacts.Models;
using MyApi.Modules.Shared.Services;
using MyApi.Modules.Articles.Services;
using MyApi.Modules.WorkflowEngine.Services;

namespace MyApi.Modules.Offers.Services
{
    public class OfferService : IOfferService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<OfferService> _logger;
        private readonly IEntityFormDocumentService _formDocumentService;
        private readonly IStockTransactionService? _stockTransactionService;
        private readonly IWorkflowTriggerService? _workflowTriggerService;
        private readonly MyApi.Modules.Numbering.Services.INumberingService? _numberingService;

        public OfferService(
            ApplicationDbContext context, 
            ILogger<OfferService> logger,
            IEntityFormDocumentService formDocumentService,
            IStockTransactionService? stockTransactionService = null,
            IWorkflowTriggerService? workflowTriggerService = null,
            MyApi.Modules.Numbering.Services.INumberingService? numberingService = null)
        {
            _context = context;
            _logger = logger;
            _formDocumentService = formDocumentService;
            _stockTransactionService = stockTransactionService;
            _workflowTriggerService = workflowTriggerService;
            _numberingService = numberingService;
        }

        public async Task<PaginatedOfferResponse> GetOffersAsync(
            string? status = null,
            string? category = null,
            string? source = null,
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
            var query = _context.Offers.AsNoTracking().Where(o => !o.IsDeleted).AsQueryable();

            if (!string.IsNullOrEmpty(status))
                query = query.Where(o => o.Status == status);

            if (!string.IsNullOrEmpty(category))
                query = query.Where(o => o.Category == category);

            if (!string.IsNullOrEmpty(source))
                query = query.Where(o => o.Source == source);

            if (!string.IsNullOrEmpty(contactId) && int.TryParse(contactId, out int contactIdInt))
                query = query.Where(o => o.ContactId == contactIdInt);

            if (dateFrom.HasValue)
                query = query.Where(o => o.CreatedDate >= dateFrom.Value);

            if (dateTo.HasValue)
                query = query.Where(o => o.CreatedDate <= dateTo.Value);

            if (!string.IsNullOrEmpty(search))
            {
                var searchLower = search.ToLower();
                query = query.Where(o =>
                    (o.Title != null && o.Title.ToLower().Contains(searchLower)) ||
                    (o.Description != null && o.Description.ToLower().Contains(searchLower))
                );
            }

            var total = await query.CountAsync();

            query = sortBy.ToLower() switch
            {
                "created_at" => sortOrder.ToLower() == "asc" ? query.OrderBy(o => o.CreatedDate) : query.OrderByDescending(o => o.CreatedDate),
                "title" => sortOrder.ToLower() == "asc" ? query.OrderBy(o => o.Title) : query.OrderByDescending(o => o.Title),
                "amount" => sortOrder.ToLower() == "asc" ? query.OrderBy(o => o.TotalAmount) : query.OrderByDescending(o => o.TotalAmount),
                _ => sortOrder.ToLower() == "asc" ? query.OrderBy(o => o.UpdatedAt) : query.OrderByDescending(o => o.UpdatedAt)
            };

            var offers = await query
                .Skip((page - 1) * limit)
                .Take(limit)
                .Include(o => o.Items)
                .ToListAsync();
            var contactIds = offers.Select(o => o.ContactId).Distinct().ToList();
            var contacts = await _context.Contacts
                .AsNoTracking()
                .Where(c => contactIds.Contains(c.Id))
                .ToDictionaryAsync(c => c.Id);

            // Get user names for CreatedBy field
            var createdByIds = offers.Select(o => o.CreatedBy).Where(id => !string.IsNullOrEmpty(id)).Distinct().ToList();
            var userNames = new Dictionary<string, string>();
            
            // Try to get names from MainAdminUsers table
            var adminUsers = await _context.MainAdminUsers
                .AsNoTracking()
                .Where(u => createdByIds.Contains(u.Id.ToString()))
                .ToDictionaryAsync(u => u.Id.ToString(), u => $"{u.FirstName} {u.LastName}".Trim());
            foreach (var kvp in adminUsers) userNames[kvp.Key] = kvp.Value;

            // Also try Users table for any remaining
            var remainingIds = createdByIds.Where(id => !userNames.ContainsKey(id)).ToList();
            if (remainingIds.Any())
            {
                var regularUsers = await _context.Users
                    .AsNoTracking()
                    .Where(u => remainingIds.Contains(u.Id.ToString()))
                    .ToDictionaryAsync(u => u.Id.ToString(), u => $"{u.FirstName} {u.LastName}".Trim());
                foreach (var kvp in regularUsers) userNames[kvp.Key] = kvp.Value;
            }

            var offerDtos = offers.Select(o => MapToDto(o, contacts.GetValueOrDefault(o.ContactId), userNames.GetValueOrDefault(o.CreatedBy ?? ""))).ToList();

            return new PaginatedOfferResponse
            {
                Offers = offerDtos,
                Pagination = new PaginationInfo
                {
                    Page = page,
                    Limit = limit,
                    Total = total,
                    TotalPages = (int)Math.Ceiling((double)total / limit)
                }
            };
        }

        public async Task<OfferDto?> GetOfferByIdAsync(int id)
        {
            var offer = await _context.Offers
                .AsNoTracking()
                .Include(o => o.Items)
                .FirstOrDefaultAsync(o => o.Id == id && !o.IsDeleted);

            if (offer == null) return null;
            
            var contact = await _context.Contacts.FindAsync(offer.ContactId);
            
            // Get creator name
            string? createdByName = null;
            if (!string.IsNullOrEmpty(offer.CreatedBy))
            {
                var adminUser = await _context.MainAdminUsers.FirstOrDefaultAsync(u => u.Id.ToString() == offer.CreatedBy);
                if (adminUser != null)
                {
                    createdByName = $"{adminUser.FirstName} {adminUser.LastName}".Trim();
                }
                else
                {
                    var regularUser = await _context.Users.FirstOrDefaultAsync(u => u.Id.ToString() == offer.CreatedBy);
                    if (regularUser != null)
                    {
                        createdByName = $"{regularUser.FirstName} {regularUser.LastName}".Trim();
                    }
                }
            }
            
            return MapToDto(offer, contact, createdByName);
        }

        public async Task<OfferDto> CreateOfferAsync(CreateOfferDto createDto, string userId)
        {
            // Verify contact exists if provided
            Contact? contact = null;
            if (createDto.ContactId.HasValue)
            {
                contact = await _context.Contacts.FindAsync(createDto.ContactId.Value);
                if (contact == null)
                    throw new KeyNotFoundException($"Contact with ID {createDto.ContactId} not found");
            }

            // Generate unique offer number
            var offerNumber = await GenerateOfferNumberAsync();

            var offer = new Offer
            {
                OfferNumber = offerNumber,
                Title = createDto.Title ?? "Untitled Offer",
                Description = createDto.Description,
                ContactId = createDto.ContactId ?? 0,
                ProjectId = createDto.ProjectId,
                Status = createDto.Status ?? "draft",
                Category = createDto.Category,
                Source = createDto.Source,
                Currency = createDto.Currency ?? "USD",
                ValidUntil = createDto.ValidUntil,
                BillingAddress = createDto.BillingAddress,
                BillingPostalCode = createDto.BillingPostalCode,
                BillingCountry = createDto.BillingCountry,
                DeliveryAddress = createDto.DeliveryAddress,
                DeliveryPostalCode = createDto.DeliveryPostalCode,
                DeliveryCountry = createDto.DeliveryCountry,
                Taxes = createDto.Taxes ?? 0,
                TaxType = createDto.TaxType ?? "percentage",
                Discount = createDto.Discount ?? 0,
                DiscountType = createDto.DiscountType ?? "percentage",
                FiscalStamp = createDto.FiscalStamp ?? 1.000m,
                TotalAmount = 0,
                CreatedBy = userId,
                CreatedDate = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                Tags = new string[] { },
                // Copy contact geolocation
                ContactLatitude = contact?.Latitude,
                ContactLongitude = contact?.Longitude,
                ContactHasLocation = contact?.HasLocation ?? 0
            };

            _context.Offers.Add(offer);
            await _context.SaveChangesAsync();

            // Add items if provided
            if (createDto.Items != null && createDto.Items.Any())
            {
                var items = createDto.Items.Select(itemDto => new OfferItem
                {
                    OfferId = offer.Id,
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
                    InstallationName = itemDto.InstallationName
                }).ToList();

                _context.OfferItems.AddRange(items);
                await _context.SaveChangesAsync();
            }

            // Log offer creation activity
            var creationActivity = new OfferActivity
            {
                OfferId = offer.Id,
                Type = "created",
                Description = $"Offer '{offer.Title}' was created",
                CreatedAt = DateTime.UtcNow,
                CreatedByName = userId
            };
            _context.OfferActivities.Add(creationActivity);

            // Add internal note as activity if provided
            if (!string.IsNullOrWhiteSpace(createDto.Notes))
            {
                var noteActivity = new OfferActivity
                {
                    OfferId = offer.Id,
                    Type = "note",
                    Description = createDto.Notes,
                    CreatedAt = DateTime.UtcNow,
                    CreatedByName = userId
                };
                _context.OfferActivities.Add(noteActivity);
            }

            await _context.SaveChangesAsync();

            var createdOffer = await GetOfferByIdAsync(offer.Id);
            return createdOffer!;
        }

        public async Task<OfferDto> UpdateOfferAsync(int id, UpdateOfferDto updateDto, string userId)
        {
            var offer = await _context.Offers.FindAsync(id);
            if (offer == null)
                throw new KeyNotFoundException($"Offer with ID {id} not found");

            var oldStatus = offer.Status;

            // Status guard: once an offer is finalized (accepted/won/cancelled),
            // financial & scope fields are locked. Tags, addresses, description,
            // status transitions, and validity can still be edited.
            var finalizedStatuses = new[] { "accepted", "won", "cancelled" };
            var isFinalized = !string.IsNullOrEmpty(offer.Status) &&
                              finalizedStatuses.Contains(offer.Status);

            bool TriedToEditFinancials() =>
                updateDto.Amount.HasValue ||
                updateDto.TotalAmount.HasValue ||
                updateDto.Taxes.HasValue ||
                updateDto.TaxType != null ||
                updateDto.Discount.HasValue ||
                updateDto.DiscountType != null ||
                updateDto.FiscalStamp.HasValue ||
                updateDto.Currency != null ||
                updateDto.ContactId.HasValue;

            if (isFinalized && TriedToEditFinancials())
            {
                throw new InvalidOperationException(
                    $"Cannot modify financial fields on a {offer.Status} offer. " +
                    "Revert status first or duplicate the offer.");
            }

            if (updateDto.Title != null) offer.Title = updateDto.Title;
            if (updateDto.Description != null) offer.Description = updateDto.Description;
            if (!isFinalized && updateDto.ContactId.HasValue) offer.ContactId = updateDto.ContactId.Value;
            if (updateDto.ProjectId.HasValue) offer.ProjectId = updateDto.ProjectId.Value;
            if (updateDto.Status != null) offer.Status = updateDto.Status;
            if (updateDto.Category != null) offer.Category = updateDto.Category;
            if (updateDto.Source != null) offer.Source = updateDto.Source;
            if (!isFinalized && updateDto.Currency != null) offer.Currency = updateDto.Currency;
            if (!isFinalized && updateDto.Amount.HasValue) offer.TotalAmount = updateDto.Amount.Value;
            if (!isFinalized && updateDto.TotalAmount.HasValue) offer.TotalAmount = updateDto.TotalAmount.Value;
            if (!isFinalized && updateDto.Taxes.HasValue) offer.Taxes = updateDto.Taxes.Value;
            if (!isFinalized && updateDto.TaxType != null) offer.TaxType = updateDto.TaxType;
            if (!isFinalized && updateDto.Discount.HasValue) offer.Discount = updateDto.Discount.Value;
            if (!isFinalized && updateDto.DiscountType != null) offer.DiscountType = updateDto.DiscountType;
            if (!isFinalized && updateDto.FiscalStamp.HasValue) offer.FiscalStamp = updateDto.FiscalStamp.Value;
            if (updateDto.ValidUntil.HasValue) offer.ValidUntil = updateDto.ValidUntil;
            if (updateDto.BillingAddress != null) offer.BillingAddress = updateDto.BillingAddress;
            if (updateDto.BillingPostalCode != null) offer.BillingPostalCode = updateDto.BillingPostalCode;
            if (updateDto.BillingCountry != null) offer.BillingCountry = updateDto.BillingCountry;
            if (updateDto.DeliveryAddress != null) offer.DeliveryAddress = updateDto.DeliveryAddress;
            if (updateDto.DeliveryPostalCode != null) offer.DeliveryPostalCode = updateDto.DeliveryPostalCode;
            if (updateDto.DeliveryCountry != null) offer.DeliveryCountry = updateDto.DeliveryCountry;
            if (updateDto.Tags != null) offer.Tags = updateDto.Tags;

            offer.UpdatedAt = DateTime.UtcNow;
            offer.ModifiedBy = userId;
            offer.ModifiedDate = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            // Log status change activity if status was modified
            if (updateDto.Status != null && oldStatus != updateDto.Status)
            {
                var statusActivity = new OfferActivity
                {
                    OfferId = id,
                    Type = "status_changed",
                    Description = $"Status changed from '{oldStatus}' to '{updateDto.Status}'",
                    CreatedAt = DateTime.UtcNow,
                    CreatedByName = userId
                };
                _context.OfferActivities.Add(statusActivity);
                await _context.SaveChangesAsync();

                // Trigger workflow automation for status change
                if (_workflowTriggerService != null)
                {
                    try
                    {
                        await _workflowTriggerService.TriggerStatusChangeAsync(
                            "offer",
                            id,
                            oldStatus ?? "",
                            updateDto.Status,
                            userId,
                            new { offerId = id, offerNumber = offer.OfferNumber, title = offer.Title }
                        );
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Failed to trigger workflow for offer {OfferId} status change", id);
                    }
                }
            }
            else
            {
                // Log general update activity
                var updateActivity = new OfferActivity
                {
                    OfferId = id,
                    Type = "updated",
                    Description = "Offer details were updated",
                    CreatedAt = DateTime.UtcNow,
                    CreatedByName = userId
                };
                _context.OfferActivities.Add(updateActivity);
                await _context.SaveChangesAsync();
            }

            // ── Sync changes to linked Sale if offer was converted ──
            if (!string.IsNullOrEmpty(offer.ConvertedToSaleId) && int.TryParse(offer.ConvertedToSaleId, out int linkedSaleId))
            {
                try
                {
                    var sale = await _context.Sales.Include(s => s.Items).FirstOrDefaultAsync(s => s.Id == linkedSaleId);
                    if (sale != null)
                    {
                        // Sync core fields
                        sale.Title = offer.Title;
                        sale.Description = offer.Description;
                        sale.ContactId = offer.ContactId;
                        sale.Currency = offer.Currency ?? sale.Currency;
                        sale.TotalAmount = offer.TotalAmount;
                        sale.Taxes = offer.Taxes ?? sale.Taxes;
                        sale.TaxType = offer.TaxType ?? sale.TaxType;
                        sale.Discount = offer.Discount ?? sale.Discount;
                        sale.FiscalStamp = offer.FiscalStamp ?? sale.FiscalStamp;
                        sale.BillingAddress = offer.BillingAddress;
                        sale.BillingPostalCode = offer.BillingPostalCode;
                        sale.BillingCountry = offer.BillingCountry;
                        sale.DeliveryAddress = offer.DeliveryAddress;
                        sale.DeliveryPostalCode = offer.DeliveryPostalCode;
                        sale.DeliveryCountry = offer.DeliveryCountry;
                        sale.UpdatedAt = DateTime.UtcNow;
                        sale.ModifiedBy = userId;

                        // Sync items: remove old sale items and re-create from offer
                        var offerItems = await _context.OfferItems.Where(oi => oi.OfferId == id).ToListAsync();
                        if (sale.Items != null && sale.Items.Any())
                        {
                            _context.SaleItems.RemoveRange(sale.Items);
                        }
                        if (offerItems.Any())
                        {
                            var newSaleItems = offerItems.Select(oi => new MyApi.Modules.Sales.Models.SaleItem
                            {
                                SaleId = sale.Id,
                                Type = oi.Type,
                                ArticleId = oi.ArticleId,
                                ItemName = oi.ItemName,
                                ItemCode = oi.ItemCode,
                                Description = oi.Description ?? oi.ItemName ?? "Item",
                                Quantity = oi.Quantity,
                                UnitPrice = oi.UnitPrice,
                                Discount = oi.Discount,
                                DiscountType = oi.DiscountType ?? "percentage",
                                InstallationId = oi.InstallationId,
                                InstallationName = oi.InstallationName,
                                RequiresServiceOrder = oi.Type == "service",
                                FulfillmentStatus = "pending",
                                TaxRate = 0
                            }).ToList();
                            _context.SaleItems.AddRange(newSaleItems);
                        }

                        // Log sync activity on the sale
                        _context.SaleActivities.Add(new MyApi.Modules.Sales.Models.SaleActivity
                        {
                            SaleId = sale.Id,
                            Type = "updated",
                            Description = $"Sale synced from updated Offer #{offer.OfferNumber}",
                            CreatedAt = DateTime.UtcNow,
                            CreatedByName = userId
                        });

                        await _context.SaveChangesAsync();
                        _logger.LogInformation("Synced offer {OfferId} changes to linked sale {SaleId}", id, linkedSaleId);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to sync offer {OfferId} changes to linked sale {SaleId}", id, linkedSaleId);
                    // Don't fail the offer update if sale sync fails
                }
            }

            var updatedOffer = await GetOfferByIdAsync(id);
            return updatedOffer!;
        }

        public async Task<bool> DeleteOfferAsync(int id, string userId)
        {
            var offer = await _context.Offers.FindAsync(id);
            if (offer == null || offer.IsDeleted)
                return false;

            offer.IsDeleted = true;
            offer.DeletedAt = DateTime.UtcNow;
            offer.DeletedBy = userId;
            
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<OfferDto> RenewOfferAsync(int id, string userId)
        {
            var originalOffer = await _context.Offers
                .Include(o => o.Items)
                .FirstOrDefaultAsync(o => o.Id == id);

            if (originalOffer == null)
                throw new KeyNotFoundException($"Offer with ID {id} not found");

            // Generate new offer number for renewed offer
            var offerNumber = await GenerateOfferNumberAsync();

            var renewedOffer = new Offer
            {
                OfferNumber = offerNumber,
                Title = originalOffer.Title,
                Description = originalOffer.Description,
                ContactId = originalOffer.ContactId,
                Status = "draft",
                Category = originalOffer.Category,
                Source = originalOffer.Source,
                Currency = originalOffer.Currency,
                BillingAddress = originalOffer.BillingAddress,
                BillingPostalCode = originalOffer.BillingPostalCode,
                BillingCountry = originalOffer.BillingCountry,
                DeliveryAddress = originalOffer.DeliveryAddress,
                DeliveryPostalCode = originalOffer.DeliveryPostalCode,
                DeliveryCountry = originalOffer.DeliveryCountry,
                Taxes = originalOffer.Taxes,
                TaxType = originalOffer.TaxType,
                Discount = originalOffer.Discount,
                DiscountType = originalOffer.DiscountType ?? "percentage",
                FiscalStamp = originalOffer.FiscalStamp,
                TotalAmount = 0,
                ValidUntil = DateTime.UtcNow.AddDays(30),
                CreatedBy = userId,
                CreatedDate = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                Tags = originalOffer.Tags
                ,
                ProjectId = originalOffer.ProjectId
            };

            _context.Offers.Add(renewedOffer);
            await _context.SaveChangesAsync();

            // Copy items
            if (originalOffer.Items != null)
            {
                var renewedItems = originalOffer.Items.Select(item => new OfferItem
                {
                    OfferId = renewedOffer.Id,
                    Type = item.Type,
                    ArticleId = item.ArticleId,
                    ItemName = item.ItemName,
                    ItemCode = item.ItemCode,
                    Description = item.Description,
                    Quantity = item.Quantity,
                    UnitPrice = item.UnitPrice,
                    Discount = item.Discount,
                    DiscountType = item.DiscountType,
                    InstallationId = item.InstallationId,
                    InstallationName = item.InstallationName
                }).ToList();

                _context.OfferItems.AddRange(renewedItems);
                await _context.SaveChangesAsync();
            }

            var result = await GetOfferByIdAsync(renewedOffer.Id);
            return result!;
        }

        public async Task<object> ConvertOfferAsync(int id, ConvertOfferDto convertDto, string userId)
        {
            var offer = await _context.Offers
                .Include(o => o.Items)
                .FirstOrDefaultAsync(o => o.Id == id);
            if (offer == null)
                throw new KeyNotFoundException($"Offer with ID {id} not found");

            // Prevent duplicate conversions
            if (!string.IsNullOrEmpty(offer.ConvertedToSaleId))
                throw new InvalidOperationException($"Offer {id} has already been converted to Sale {offer.ConvertedToSaleId}");

            // Resolve user name
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
                    createdByName = $"{regularUser.FirstName} {regularUser.LastName}".Trim();
            }

            // Get contact for geolocation data
            var contact = await _context.Contacts.FindAsync(offer.ContactId);

            int? saleId = null;
            int? serviceOrderId = null;
            int formDocumentsCopied = 0;

            // ── Create Sale if requested ──
            if (convertDto.ConvertToSale)
            {
                string saleNum;
                try
                {
                    saleNum = _numberingService != null ? await _numberingService.GetNextAsync("Sale") : $"SALE-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString().Substring(0, 5).ToUpper()}";
                }
                catch
                {
                    saleNum = $"SALE-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString().Substring(0, 5).ToUpper()}";
                }

                var sale = new MyApi.Modules.Sales.Models.Sale
                {
                    SaleNumber = saleNum,
                    Title = offer.Title,
                    Description = offer.Description,
                    ContactId = offer.ContactId,
                    Status = "created",
                    Stage = "offer",
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
                    OfferId = id.ToString(),
                    ProjectId = offer.ProjectId,
                    ConvertedFromOfferAt = DateTime.UtcNow,
                    CreatedBy = userId,
                    CreatedByName = createdByName,
                    CreatedDate = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                    ContactLatitude = contact?.Latitude ?? offer.ContactLatitude,
                    ContactLongitude = contact?.Longitude ?? offer.ContactLongitude,
                    ContactHasLocation = contact?.HasLocation ?? offer.ContactHasLocation
                };

                _context.Sales.Add(sale);
                await _context.SaveChangesAsync();
                saleId = sale.Id;

                // Copy offer items → sale items
                if (offer.Items != null && offer.Items.Any())
                {
                    var saleItems = offer.Items.Select(oi => new MyApi.Modules.Sales.Models.SaleItem
                    {
                        SaleId = sale.Id,
                        Type = oi.Type,
                        ArticleId = oi.ArticleId,
                        ItemName = oi.ItemName,
                        ItemCode = oi.ItemCode,
                        Description = oi.Description ?? oi.ItemName ?? "Item",
                        Quantity = oi.Quantity,
                        UnitPrice = oi.UnitPrice,
                        Discount = oi.Discount,
                        DiscountType = oi.DiscountType ?? "percentage",
                        InstallationId = oi.InstallationId,
                        InstallationName = oi.InstallationName,
                        RequiresServiceOrder = oi.Type == "service",
                        FulfillmentStatus = "pending",
                        TaxRate = 0
                    }).ToList();
                    _context.SaleItems.AddRange(saleItems);
                }

                // Log sale creation activity
                _context.SaleActivities.Add(new MyApi.Modules.Sales.Models.SaleActivity
                {
                    SaleId = sale.Id,
                    Type = "created",
                    Description = $"Sale order created from Offer #{offer.OfferNumber}",
                    CreatedAt = DateTime.UtcNow,
                    CreatedByName = createdByName
                });

                await _context.SaveChangesAsync();

                // Copy form documents from offer to sale
                try
                {
                    formDocumentsCopied = await _formDocumentService.CopyDocumentsToEntityAsync(
                        "offer", id, "sale", sale.Id, userId);
                    _logger.LogInformation(
                        "Copied {Count} form documents from Offer {OfferId} to Sale {SaleId}",
                        formDocumentsCopied, id, sale.Id);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex,
                        "Failed to copy form documents from Offer {OfferId} to Sale {SaleId}",
                        id, sale.Id);
                }

                // Trigger workflow for the new sale (use status change: "" → "created")
                if (_workflowTriggerService != null)
                {
                    try
                    {
                        await _workflowTriggerService.TriggerStatusChangeAsync(
                            "sale", sale.Id, "", "created", userId,
                            new { saleId = sale.Id, saleNumber = sale.SaleNumber, title = sale.Title, fromOfferId = id });
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Failed to trigger workflow for sale {SaleId} created from offer {OfferId}", sale.Id, id);
                    }
                }
            }

            // ── Update offer status and conversion tracking ──
            offer.Status = "accepted";
            offer.ConvertedToSaleId = saleId?.ToString();
            offer.ConvertedAt = DateTime.UtcNow;
            offer.UpdatedAt = DateTime.UtcNow;

            // Log conversion activity on the offer
            _context.OfferActivities.Add(new OfferActivity
            {
                OfferId = id,
                Type = "status_changed",
                Description = $"Offer converted to Sale #{saleId}",
                CreatedAt = DateTime.UtcNow,
                CreatedByName = createdByName
            });

            await _context.SaveChangesAsync();

            // Trigger workflow for the offer status change
            if (_workflowTriggerService != null)
            {
                try
                {
                    await _workflowTriggerService.TriggerStatusChangeAsync(
                        "offer", id, offer.Status, "accepted", userId,
                        new { offerId = id, offerNumber = offer.OfferNumber, title = offer.Title, convertedToSaleId = saleId });
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to trigger workflow for offer {OfferId} conversion", id);
                }
            }

            var updatedOffer = await GetOfferByIdAsync(id);

            return new
            {
                SaleId = saleId,
                ServiceOrderId = serviceOrderId,
                FormDocumentsCopied = formDocumentsCopied,
                Offer = updatedOffer
            };
        }

        public async Task<OfferStatsDto> GetOfferStatsAsync(DateTime? dateFrom = null, DateTime? dateTo = null)
        {
            var query = _context.Offers.AsQueryable();

            if (dateFrom.HasValue)
                query = query.Where(o => o.CreatedDate >= dateFrom.Value);

            if (dateTo.HasValue)
                query = query.Where(o => o.CreatedDate <= dateTo.Value);

            var offers = await query.ToListAsync();

            var totalOffers = offers.Count;
            var activeOffers = offers.Count(o => o.Status == "draft" || o.Status == "sent");
            var acceptedOffers = offers.Count(o => o.Status == "accepted");
            var declinedOffers = offers.Count(o => o.Status == "declined" || o.Status == "cancelled");
            var totalValue = offers.Sum(o => o.TotalAmount);
            var averageValue = totalOffers > 0 ? totalValue / totalOffers : 0;
            var conversionRate = totalOffers > 0 ? (decimal)acceptedOffers / totalOffers * 100 : 0;

            return new OfferStatsDto
            {
                TotalOffers = totalOffers,
                ActiveOffers = activeOffers,
                AcceptedOffers = acceptedOffers,
                DeclinedOffers = declinedOffers,
                TotalValue = totalValue,
                AverageValue = averageValue,
                ConversionRate = Math.Round(conversionRate, 2),
                MonthlyGrowth = 12.8m
            };
        }

        public async Task<OfferDto> MarkOfferAsSentAsync(int id, string userId)
        {
            var offer = await _context.Offers.FindAsync(id);
            if (offer == null)
                throw new KeyNotFoundException($"Offer with ID {id} not found");

            var oldStatus = offer.Status;

            offer.SentCount++;
            
            if (offer.Status == "draft")
            {
                offer.Status = "sent";
            }

            offer.UpdatedAt = DateTime.UtcNow;
            offer.ModifiedBy = userId;
            offer.ModifiedDate = DateTime.UtcNow;

            // Log activity
            var activity = new OfferActivity
            {
                OfferId = id,
                Type = "sent",
                Description = $"Offer marked as sent (Count: {offer.SentCount})",
                CreatedAt = DateTime.UtcNow,
                CreatedByName = userId
            };
            _context.OfferActivities.Add(activity);

            await _context.SaveChangesAsync();

            // Trigger workflow automation for status change if applicable
            if (_workflowTriggerService != null && oldStatus != offer.Status)
            {
                try
                {
                    await _workflowTriggerService.TriggerStatusChangeAsync(
                        "offer",
                        id,
                        oldStatus,
                        offer.Status,
                        userId,
                        new { offerId = id, offerNumber = offer.OfferNumber, title = offer.Title }
                    );
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to trigger workflow for offer {OfferId} status change", id);
                }
            }

            var updatedOffer = await GetOfferByIdAsync(id);
            return updatedOffer!;
        }

        public async Task<OfferItemDto> AddOfferItemAsync(int offerId, CreateOfferItemDto itemDto)
        {
            var offer = await _context.Offers.FindAsync(offerId);
            if (offer == null)
                throw new KeyNotFoundException($"Offer with ID {offerId} not found");

            var item = new OfferItem
            {
                OfferId = offerId,
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
                InstallationName = itemDto.InstallationName
            };

            _context.OfferItems.Add(item);
            await _context.SaveChangesAsync();

            // Log stock transaction for material items added to offer (tracking only, no stock change)
            if (_stockTransactionService != null && 
                itemDto.ArticleId.HasValue && 
                (itemDto.Type == "material" || itemDto.Type == "article"))
            {
                try
                {
                    await _stockTransactionService.LogOfferItemAddedAsync(
                        itemDto.ArticleId.Value,
                        itemDto.Quantity,
                        offerId,
                        offer.OfferNumber ?? $"OFFER-{offerId}",
                        offer.CreatedBy ?? "system",
                        offer.CreatedByName
                    );
                    _logger.LogInformation(
                        "Logged stock transaction for article {ArticleId} added to offer {OfferId}", 
                        itemDto.ArticleId, offerId);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, 
                        "Failed to log stock transaction for article {ArticleId} added to offer {OfferId}", 
                        itemDto.ArticleId, offerId);
                    // Don't fail the item addition if logging fails
                }
            }

            var addedItem = await _context.OfferItems.FindAsync(item.Id);
            return MapItemToDto(addedItem!);
        }

        public async Task<OfferItemDto> UpdateOfferItemAsync(int offerId, int itemId, CreateOfferItemDto itemDto)
        {
            var item = await _context.OfferItems
                .FirstOrDefaultAsync(i => i.Id == itemId && i.OfferId == offerId);

            if (item == null)
                throw new KeyNotFoundException($"Item with ID {itemId} not found in offer {offerId}");

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

            await _context.SaveChangesAsync();

            var updatedItem = await _context.OfferItems.FindAsync(itemId);
            return MapItemToDto(updatedItem!);
        }

        public async Task<bool> DeleteOfferItemAsync(int offerId, int itemId)
        {
            var item = await _context.OfferItems
                .FirstOrDefaultAsync(i => i.Id == itemId && i.OfferId == offerId);

            if (item == null)
                return false;

            _context.OfferItems.Remove(item);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<List<OfferActivityDto>> GetOfferActivitiesAsync(int offerId, string? type = null, int page = 1, int limit = 20)
        {
            var query = _context.OfferActivities.Where(a => a.OfferId == offerId);

            if (!string.IsNullOrEmpty(type))
                query = query.Where(a => a.Type == type);

            var activities = await query
                .OrderByDescending(a => a.CreatedAt)
                .Skip((page - 1) * limit)
                .Take(limit)
                .ToListAsync();

            return activities.Select(a => new OfferActivityDto
            {
                Id = a.Id,
                OfferId = a.OfferId,
                Type = a.Type ?? "",
                Description = a.Description ?? "",
                OldValue = null,
                NewValue = null,
                CreatedAt = a.CreatedAt,
                CreatedBy = a.CreatedByName
            }).ToList();
        }

        public async Task<OfferActivityDto> AddOfferActivityAsync(int offerId, CreateOfferActivityDto activityDto, string userId)
        {
            var offer = await _context.Offers.FindAsync(offerId);
            if (offer == null)
                throw new KeyNotFoundException($"Offer with ID {offerId} not found");

            var activity = new OfferActivity
            {
                OfferId = offerId,
                Type = activityDto.Type,
                Description = activityDto.Description,
                CreatedAt = DateTime.UtcNow,
                CreatedByName = userId
            };

            _context.OfferActivities.Add(activity);
            await _context.SaveChangesAsync();

            return new OfferActivityDto
            {
                Id = activity.Id,
                OfferId = activity.OfferId,
                Type = activity.Type,
                Description = activity.Description ?? "",
                CreatedAt = activity.CreatedAt,
                CreatedBy = activity.CreatedByName
            };
        }

        public async Task<bool> DeleteOfferActivityAsync(int offerId, int activityId)
        {
            var activity = await _context.OfferActivities
                .FirstOrDefaultAsync(a => a.Id == activityId && a.OfferId == offerId);
            
            if (activity == null)
                return false;

            _context.OfferActivities.Remove(activity);
            await _context.SaveChangesAsync();
            return true;
        }

        private OfferDto MapToDto(Offer offer, Contact? contact, string? createdByName = null)
        {
            return new OfferDto
            {
                Id = offer.Id,
                OfferNumber = offer.OfferNumber,
                Title = offer.Title ?? "",
                Description = offer.Description,
                ContactId = offer.ContactId,
                ProjectId = offer.ProjectId,
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
                Status = offer.Status ?? "draft",
                Category = offer.Category,
                Source = offer.Source,
                Currency = offer.Currency ?? "TND",
                Amount = offer.TotalAmount,
                Taxes = offer.Taxes,
                TaxType = offer.TaxType,
                Discount = offer.Discount,
                DiscountType = offer.DiscountType ?? "percentage",
                FiscalStamp = offer.FiscalStamp,
                TotalAmount = offer.GrandTotal > 0 ? offer.GrandTotal : offer.TotalAmount,
                ValidUntil = offer.ValidUntil,
                BillingAddress = offer.BillingAddress,
                BillingPostalCode = offer.BillingPostalCode,
                BillingCountry = offer.BillingCountry,
                DeliveryAddress = offer.DeliveryAddress,
                DeliveryPostalCode = offer.DeliveryPostalCode,
                DeliveryCountry = offer.DeliveryCountry,
                ConvertedToSaleId = offer.ConvertedToSaleId,
                ConvertedToServiceOrderId = offer.ConvertedToServiceOrderId,
                ConvertedAt = offer.ConvertedAt,
                AssignedTo = offer.AssignedTo,
                AssignedToName = offer.AssignedToName,
                Tags = offer.Tags,
                CreatedAt = offer.CreatedDate,
                CreatedBy = offer.CreatedBy,
                CreatedByName = createdByName,
                UpdatedAt = offer.UpdatedAt ?? offer.CreatedDate,
                Items = offer.Items?.Select(MapItemToDto).ToList() ?? new List<OfferItemDto>()
            };
        }

        private OfferItemDto MapItemToDto(OfferItem item)
        {
            return new OfferItemDto
            {
                Id = item.Id,
                OfferId = item.OfferId,
                Type = item.Type,
                ArticleId = item.ArticleId,
                ItemName = item.ItemName ?? "",
                ItemCode = item.ItemCode,
                Description = item.Description,
                Quantity = item.Quantity,
                UnitPrice = item.UnitPrice,
                Discount = item.Discount ?? 0,
                DiscountType = item.DiscountType,
                TotalPrice = item.LineTotal,
                InstallationId = item.InstallationId,
                InstallationName = item.InstallationName
            };
        }

        private async Task<string> GenerateOfferNumberAsync()
        {
            // Use configurable numbering service if available and enabled
            if (_numberingService != null)
            {
                try
                {
                    return await _numberingService.GetNextAsync("Offer");
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Numbering service failed for Offer, falling back to legacy logic");
                }
            }

            // Legacy fallback — queries DB for the highest existing number to avoid duplicates
            const int maxRetries = 5;
            for (int attempt = 0; attempt < maxRetries; attempt++)
            {
                var year = DateTime.UtcNow.Year;
                var prefix = $"OFR-{year}-";
                
                var lastOffer = await _context.Offers
                    .Where(o => o.OfferNumber != null && o.OfferNumber.StartsWith(prefix))
                    .OrderByDescending(o => o.OfferNumber)
                    .FirstOrDefaultAsync();

                int nextNumber = 1;
                if (lastOffer != null && !string.IsNullOrEmpty(lastOffer.OfferNumber))
                {
                    var lastNumberStr = lastOffer.OfferNumber.Replace(prefix, "");
                    if (int.TryParse(lastNumberStr, out int lastNumber))
                    {
                        nextNumber = lastNumber + 1;
                    }
                }

                // Add attempt offset to avoid collision on concurrent retries
                nextNumber += attempt;

                var candidate = $"{prefix}{nextNumber:D6}";

                // Verify uniqueness before returning
                var exists = await _context.Offers.AnyAsync(o => o.OfferNumber == candidate);
                if (!exists)
                    return candidate;

                _logger.LogWarning("Offer number {Number} already exists, retrying (attempt {Attempt})", candidate, attempt + 1);
            }

            // Final fallback: append GUID fragment for guaranteed uniqueness
            var fallback = $"OFR-{DateTime.UtcNow.Year}-{Guid.NewGuid().ToString()[..8].ToUpper()}";
            _logger.LogWarning("All offer number retries exhausted, using GUID fallback: {Number}", fallback);
            return fallback;
        }

        // =====================================================
        // Bulk Import - Supports up to 10,000+ records
        // =====================================================

        /// <summary>
        /// High-performance bulk import with batch processing.
        /// Uses AddRange for optimal database performance.
        /// </summary>
        public async Task<BulkImportOfferResultDto> BulkImportOffersAsync(BulkImportOfferRequestDto importRequest, string userId)
        {
            const int BATCH_SIZE = 50; // Smaller batch for offers due to complexity (items)

            var result = new BulkImportOfferResultDto
            {
                TotalProcessed = importRequest.Offers.Count
            };

            try
            {
                // Validate contact IDs exist
                var contactIds = importRequest.Offers
                    .Where(o => o.ContactId.HasValue && o.ContactId.Value > 0)
                    .Select(o => o.ContactId!.Value)
                    .Distinct()
                    .ToList();

                var validContacts = await _context.Contacts
                    .AsNoTracking()
                    .Where(c => contactIds.Contains(c.Id) && c.IsActive)
                    .ToDictionaryAsync(c => c.Id, c => c);

                // Get base offer number
                var year = DateTime.UtcNow.Year;
                var prefix = $"OFR-{year}-";
                var lastOffer = await _context.Offers
                    .Where(o => o.OfferNumber != null && o.OfferNumber.StartsWith(prefix))
                    .OrderByDescending(o => o.OfferNumber)
                    .FirstOrDefaultAsync();

                int nextNumber = 1;
                if (lastOffer != null && !string.IsNullOrEmpty(lastOffer.OfferNumber))
                {
                    var lastNumberStr = lastOffer.OfferNumber.Replace(prefix, "");
                    if (int.TryParse(lastNumberStr, out int lastNum))
                    {
                        nextNumber = lastNum + 1;
                    }
                }

                // Process in batches
                var batches = importRequest.Offers
                    .Select((offer, index) => new { offer, index })
                    .GroupBy(x => x.index / BATCH_SIZE)
                    .Select(g => g.Select(x => x.offer).ToList())
                    .ToList();

                foreach (var batch in batches)
                {
                    var newOffers = new List<Offer>();
                    var offerItemsToAdd = new Dictionary<Offer, List<OfferItem>>();

                    foreach (var dto in batch)
                    {
                        try
                        {
                            // Validate contact if provided
                            Contact? contact = null;
                            if (dto.ContactId.HasValue && dto.ContactId.Value > 0)
                            {
                                if (!validContacts.TryGetValue(dto.ContactId.Value, out contact))
                                {
                                    result.FailedCount++;
                                    result.Errors.Add($"Contact ID {dto.ContactId} not found for offer {dto.Title}");
                                    continue;
                                }
                            }

                            // Normalize status
                            var status = dto.Status?.ToLower()?.Trim();
                            var validStatuses = new[] { "draft", "sent", "pending", "negotiation", "accepted", "won", "declined", "lost", "expired", "cancelled" };
                            if (string.IsNullOrEmpty(status) || !validStatuses.Contains(status))
                            {
                                status = "draft";
                            }

                            // Validate taxes and discount
                            var taxes = dto.Taxes ?? 0;
                            var discount = dto.Discount ?? 0;
                            if (taxes < 0 || taxes > 100) taxes = 0;
                            if (discount < 0 || discount > 100) discount = 0;

                            // Validate currency
                            var currency = dto.Currency?.ToUpper()?.Trim();
                            if (string.IsNullOrEmpty(currency) || currency.Length != 3)
                            {
                                currency = "TND";
                            }

                            var offerNumber = $"{prefix}{nextNumber:D6}";
                            nextNumber++;

                            var offer = new Offer
                            {
                                OfferNumber = offerNumber,
                                Title = dto.Title ?? "Untitled Offer",
                                Description = dto.Description,
                                ContactId = dto.ContactId ?? 0,
                                Status = status,
                                Category = dto.Category,
                                Source = dto.Source,
                                Currency = currency,
                                ValidUntil = dto.ValidUntil,
                                BillingAddress = dto.BillingAddress,
                                BillingPostalCode = dto.BillingPostalCode,
                                BillingCountry = dto.BillingCountry,
                                DeliveryAddress = dto.DeliveryAddress,
                                DeliveryPostalCode = dto.DeliveryPostalCode,
                                DeliveryCountry = dto.DeliveryCountry,
                                Taxes = taxes,
                                TaxType = dto.TaxType ?? "percentage",
                                Discount = discount,
                                FiscalStamp = dto.FiscalStamp ?? 1.000m,
                                TotalAmount = 0,
                                CreatedBy = userId,
                                CreatedDate = DateTime.UtcNow,
                                UpdatedAt = DateTime.UtcNow,
                                Tags = new string[] { },
                                ContactLatitude = contact?.Latitude,
                                ContactLongitude = contact?.Longitude,
                                ContactHasLocation = contact?.HasLocation ?? 0
                            };

                            newOffers.Add(offer);

                            // Prepare items for this offer
                            if (dto.Items != null && dto.Items.Any())
                            {
                                var items = dto.Items.Select(itemDto => new OfferItem
                                {
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
                                    InstallationName = itemDto.InstallationName
                                }).ToList();

                                offerItemsToAdd[offer] = items;
                            }
                        }
                        catch (Exception ex)
                        {
                            result.FailedCount++;
                            result.Errors.Add($"Failed to process offer {dto.Title}: {ex.Message}");
                        }
                    }

                    // Batch insert new offers
                    if (newOffers.Any())
                    {
                        await _context.Offers.AddRangeAsync(newOffers);
                        await _context.SaveChangesAsync();

                        // Now add items with correct OfferIds
                        var allItems = new List<OfferItem>();
                        foreach (var offer in newOffers)
                        {
                            if (offerItemsToAdd.TryGetValue(offer, out var items))
                            {
                                foreach (var item in items)
                                {
                                    item.OfferId = offer.Id;
                                }
                                allItems.AddRange(items);
                            }
                        }

                        if (allItems.Any())
                        {
                            await _context.OfferItems.AddRangeAsync(allItems);
                            await _context.SaveChangesAsync();
                        }

                        result.SuccessCount += newOffers.Count;

                        foreach (var offer in newOffers)
                        {
                            result.ImportedOffers.Add(new OfferDto
                            {
                                Id = offer.Id,
                                OfferNumber = offer.OfferNumber,
                                Title = offer.Title ?? string.Empty,
                                Status = offer.Status,
                                Currency = offer.Currency
                            });
                        }
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

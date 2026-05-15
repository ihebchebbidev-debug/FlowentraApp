using Microsoft.EntityFrameworkCore;
using MyApi.Data;
using MyApi.Modules.ServiceOrders.DTOs;
using MyApi.Modules.ServiceOrders.Models;
using MyApi.Modules.Contacts.Models;
using MyApi.Modules.Dispatches.DTOs;
using MyApi.Modules.Dispatches.Models;
using MyApi.Modules.Sales.Models;
using MyApi.Modules.WorkflowEngine.Services;
using MyApi.Modules.Settings.Services;

namespace MyApi.Modules.ServiceOrders.Services
{
    public class ServiceOrderService : IServiceOrderService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<ServiceOrderService> _logger;
        private readonly IWorkflowTriggerService? _workflowTriggerService;
        private readonly MyApi.Modules.Numbering.Services.INumberingService? _numberingService;
        private readonly IAppSettingsService? _appSettingsService;

        public ServiceOrderService(
            ApplicationDbContext context, 
            ILogger<ServiceOrderService> logger,
            IWorkflowTriggerService? workflowTriggerService = null,
            MyApi.Modules.Numbering.Services.INumberingService? numberingService = null,
            IAppSettingsService? appSettingsService = null)
        {
            _context = context;
            _logger = logger;
            _workflowTriggerService = workflowTriggerService;
            _numberingService = numberingService;
            _appSettingsService = appSettingsService;
        }

        public async Task<ServiceOrderDto> CreateFromSaleAsync(int saleId, CreateServiceOrderDto createDto, string userId)
        {
            try
            {
            // Verify sale exists with its items
                var sale = await _context.Sales
                    .Include(s => s.Items)
                    .FirstOrDefaultAsync(s => s.Id == saleId);
                if (sale == null)
                    throw new KeyNotFoundException($"Sale with ID {saleId} not found");

                // Check if service order already exists for this sale
                var saleIdStr = saleId.ToString();
                var existingOrder = await _context.ServiceOrders.FirstOrDefaultAsync(s => s.SaleId == saleIdStr);
                if (existingOrder != null)
                    throw new InvalidOperationException($"Service order already exists for sale {saleId}");

                // Get service-type items from the sale (these become jobs)
                var serviceItems = sale.Items?.Where(i => i.Type?.ToLower() == "service").ToList() ?? new List<Sales.Models.SaleItem>();

                // Get contact for geolocation data
                var contact = await _context.Contacts.FindAsync(sale.ContactId);

                string orderNumber;
                try
                {
                    orderNumber = _numberingService != null ? await _numberingService.GetNextAsync("ServiceOrder") : $"SO-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString().Substring(0, 5).ToUpper()}";
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Numbering service failed for ServiceOrder, using GUID fallback");
                    orderNumber = $"SO-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString().Substring(0, 6).ToUpper()}";
                }

                var serviceOrder = new ServiceOrder
                {
                    OrderNumber = orderNumber,
                    SaleId = saleId.ToString(),
                    OfferId = sale.OfferId,
                    ProjectId = createDto.ProjectId ?? sale.ProjectId,
                    ContactId = sale.ContactId,
                    ServiceType = serviceItems.FirstOrDefault()?.ItemName ?? "maintenance",
                    Status = "pending",  // Initial status after creation - workflow: pending → ready_for_planning → scheduled → in_progress...
                    Priority = createDto.Priority ?? "medium",
                    Description = sale.Description,
                    Notes = createDto.Notes ?? sale.Description,
                    StartDate = createDto.StartDate.HasValue ? DateTime.SpecifyKind(createDto.StartDate.Value, DateTimeKind.Utc) : null,
                    TargetCompletionDate = createDto.TargetCompletionDate.HasValue ? DateTime.SpecifyKind(createDto.TargetCompletionDate.Value, DateTimeKind.Utc) : null,
                    EstimatedDuration = createDto.StartDate.HasValue && createDto.TargetCompletionDate.HasValue
                        ? (int)(createDto.TargetCompletionDate.Value - createDto.StartDate.Value).TotalHours
                        : null,
                    EstimatedCost = sale.TotalAmount,
                    ActualCost = 0,
                    Discount = 0,
                    DiscountPercentage = 0,
                    Tax = 0,
                    TotalAmount = sale.TotalAmount,
                    PaymentStatus = "pending",
                    PaymentTerms = "net30",
                    CompletionPercentage = 0,
                    RequiresApproval = createDto.RequiresApproval,
                    Tags = createDto.Tags,
                    CustomFields = createDto.CustomFields != null ? System.Text.Json.JsonSerializer.Serialize(createDto.CustomFields) : null,
                    CreatedBy = userId,
                    CreatedDate = DateTime.UtcNow,
                    ModifiedDate = DateTime.UtcNow,
                    // Copy contact geolocation
                    ContactLatitude = contact?.Latitude ?? sale.ContactLatitude,
                    ContactLongitude = contact?.Longitude ?? sale.ContactLongitude,
                    ContactHasLocation = contact?.HasLocation ?? sale.ContactHasLocation
                };

                // Set ServiceCount from the number of service-type sale items
                serviceOrder.ServiceCount = serviceItems.Count;

                _context.ServiceOrders.Add(serviceOrder);
                await _context.SaveChangesAsync();

                // Determine job conversion mode: DTO override > AppSettings > default "installation"
                var jobConversionMode = createDto.JobConversionMode;
                if (string.IsNullOrEmpty(jobConversionMode) && _appSettingsService != null)
                {
                    jobConversionMode = await _appSettingsService.GetSettingAsync("JobConversionMode");
                }
                jobConversionMode ??= "installation";

                // Create jobs from service-type sale items
                if (serviceItems.Any())
                {
                    var jobs = new List<ServiceOrderJob>();

                    if (jobConversionMode == "installation")
                    {
                        // INSTALLATION-BASED: Group service items by InstallationId
                        var groupedByInstallation = serviceItems
                            .Where(i => !string.IsNullOrEmpty(i.InstallationId))
                            .GroupBy(i => i.InstallationId!)
                            .ToList();

                        // Items without installation fall back to service-based
                        var orphanItems = serviceItems
                            .Where(i => string.IsNullOrEmpty(i.InstallationId))
                            .ToList();

                        foreach (var group in groupedByInstallation)
                        {
                            var items = group.ToList();
                            var installationName = items.First().InstallationName ?? $"Installation #{group.Key}";
                            var serviceNames = items.Select(i => i.ItemName ?? "Service").ToList();
                            var totalCost = items.Sum(i => i.LineTotal > 0 ? i.LineTotal : (i.UnitPrice * i.Quantity));

                            jobs.Add(new ServiceOrderJob
                            {
                                ServiceOrderId = serviceOrder.Id,
                                SaleItemId = string.Join(",", items.Select(i => i.Id)),
                                Title = installationName,
                                JobDescription = "Services: " + string.Join(", ", serviceNames),
                                Description = string.Join("\n", items.Select(i => 
                                    $"- {i.ItemName}: {i.Quantity} x {i.UnitPrice:F2} = {(i.LineTotal > 0 ? i.LineTotal : i.UnitPrice * i.Quantity):F2}")),
                                Status = "unscheduled",
                                Priority = createDto.Priority ?? "medium",
                                InstallationId = group.Key,
                                InstallationName = installationName,
                                WorkType = DetermineWorkType(items.First().ItemName),
                                EstimatedDuration = createDto.StartDate.HasValue && createDto.TargetCompletionDate.HasValue
                                    ? (int)(createDto.TargetCompletionDate.Value - createDto.StartDate.Value).TotalHours / Math.Max(groupedByInstallation.Count() + orphanItems.Count(), 1)
                                    : null,
                                EstimatedCost = totalCost,
                                CompletionPercentage = 0,
                                AssignedTechnicianIds = createDto.AssignedTechnicianIds?.Select(id => id.ToString()).ToArray(),
                                Notes = System.Text.Json.JsonSerializer.Serialize(items.Select(i => new { 
                                    itemName = i.ItemName, 
                                    quantity = i.Quantity, 
                                    unitPrice = i.UnitPrice,
                                    lineTotal = i.LineTotal > 0 ? i.LineTotal : i.UnitPrice * i.Quantity
                                })),
                                UpdatedAt = DateTime.UtcNow
                            });
                        }

                        // Orphan items: each becomes its own job (service-based fallback)
                        foreach (var item in orphanItems)
                        {
                            jobs.Add(new ServiceOrderJob
                            {
                                ServiceOrderId = serviceOrder.Id,
                                SaleItemId = item.Id.ToString(),
                                Title = item.ItemName ?? "Service Job",
                                JobDescription = item.Description ?? item.ItemName ?? "Service job",
                                Description = item.Description,
                                Status = "unscheduled",
                                Priority = createDto.Priority ?? "medium",
                                InstallationId = null,
                                InstallationName = null,
                                WorkType = DetermineWorkType(item.ItemName),
                                EstimatedDuration = createDto.StartDate.HasValue && createDto.TargetCompletionDate.HasValue
                                    ? (int)(createDto.TargetCompletionDate.Value - createDto.StartDate.Value).TotalHours / Math.Max(serviceItems.Count, 1)
                                    : null,
                                EstimatedCost = item.LineTotal > 0 ? item.LineTotal : (item.UnitPrice * item.Quantity),
                                CompletionPercentage = 0,
                                AssignedTechnicianIds = createDto.AssignedTechnicianIds?.Select(id => id.ToString()).ToArray(),
                                UpdatedAt = DateTime.UtcNow
                            });
                        }
                    }
                    else
                    {
                        // SERVICE-BASED (current/legacy behavior): Each service item becomes its own job
                        jobs = serviceItems.Select(item => new ServiceOrderJob
                        {
                            ServiceOrderId = serviceOrder.Id,
                            SaleItemId = item.Id.ToString(),
                            Title = item.ItemName ?? "Service Job",
                            JobDescription = item.Description ?? item.ItemName ?? "Service job",
                            Description = item.Description,
                            Status = "unscheduled",
                            Priority = createDto.Priority ?? "medium",
                            InstallationId = item.InstallationId,
                            InstallationName = item.InstallationName,
                            WorkType = DetermineWorkType(item.ItemName),
                            EstimatedDuration = createDto.StartDate.HasValue && createDto.TargetCompletionDate.HasValue
                                ? (int)(createDto.TargetCompletionDate.Value - createDto.StartDate.Value).TotalHours / (serviceItems.Count > 0 ? serviceItems.Count : 1)
                                : null,
                            EstimatedCost = item.LineTotal > 0 ? item.LineTotal : (item.UnitPrice * item.Quantity),
                            CompletionPercentage = 0,
                            AssignedTechnicianIds = createDto.AssignedTechnicianIds?.Select(id => id.ToString()).ToArray(),
                            UpdatedAt = DateTime.UtcNow
                        }).ToList();
                    }

                    _context.ServiceOrderJobs.AddRange(jobs);
                    await _context.SaveChangesAsync();

                    // Update sale items with service order information
                    foreach (var item in serviceItems)
                    {
                        item.ServiceOrderGenerated = true;
                        item.ServiceOrderId = serviceOrder.Id.ToString();
                    }
                    await _context.SaveChangesAsync();
                }

                // Create materials from material/article-type sale items (not services)
                // Note: Frontend uses "article" for materials, backend may receive "material" or "article"
                var materialItems = sale.Items?.Where(i => 
                    i.Type?.ToLower() == "material" || i.Type?.ToLower() == "article"
                ).ToList() ?? new List<Sales.Models.SaleItem>();
                if (materialItems.Any())
                {
                    var materials = materialItems.Select(item => new ServiceOrderMaterial
                    {
                        ServiceOrderId = serviceOrder.Id,
                        SaleItemId = item.Id,
                        ArticleId = item.ArticleId,
                        Name = item.ItemName ?? "Material",
                        Sku = item.ItemCode,
                        Description = item.Description,
                        Quantity = item.Quantity,
                        UnitPrice = item.UnitPrice,
                        TotalPrice = item.LineTotal > 0 ? item.LineTotal : (item.UnitPrice * item.Quantity),
                        Status = "pending",
                        Source = "sale_conversion",
                        InstallationId = item.InstallationId,
                        InstallationName = item.InstallationName,
                        CreatedBy = userId,
                        CreatedAt = DateTime.UtcNow
                    }).ToList();

                    _context.ServiceOrderMaterials.AddRange(materials);
                    await _context.SaveChangesAsync();

                    _logger.LogInformation("Created {Count} materials for service order {ServiceOrderId}", materials.Count, serviceOrder.Id);
                }

                // Update the sale's ServiceOrdersStatus to track the conversion
                sale.ServiceOrdersStatus = "created";
                sale.LastActivity = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                var result = await GetServiceOrderByIdAsync(serviceOrder.Id);
                return result!;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating service order from sale {SaleId}: {Message}", saleId, ex.Message);
                throw;
            }
        }

        public async Task<PaginatedServiceOrderResponse> GetServiceOrdersAsync(
            string? status = null,
            string? priority = null,
            int? contactId = null,
            int? saleId = null,
            DateTime? startDate = null,
            DateTime? endDate = null,
            string? paymentStatus = null,
            string? search = null,
            int page = 1,
            int limit = 20,
            string sortBy = "created_at",
            string sortOrder = "desc"
        )
        {
            var query = _context.ServiceOrders.AsNoTracking().Where(s => !s.IsDeleted).AsQueryable();

            if (!string.IsNullOrEmpty(status))
                query = query.Where(s => s.Status == status);

            if (!string.IsNullOrEmpty(priority))
                query = query.Where(s => s.Priority == priority);

            if (contactId.HasValue)
                query = query.Where(s => s.ContactId == contactId.Value);

            if (saleId.HasValue)
            {
                var saleIdStr = saleId.Value.ToString();
                query = query.Where(s => s.SaleId == saleIdStr);
            }

            if (startDate.HasValue)
                query = query.Where(s => s.StartDate >= startDate.Value);

            if (endDate.HasValue)
                query = query.Where(s => s.StartDate <= endDate.Value);

            if (!string.IsNullOrEmpty(paymentStatus))
                query = query.Where(s => s.PaymentStatus == paymentStatus);

            if (!string.IsNullOrEmpty(search))
            {
                var searchLower = search.ToLower();
                query = query.Where(s =>
                    s.OrderNumber.ToLower().Contains(searchLower) ||
                    (s.Description != null && s.Description.ToLower().Contains(searchLower)) ||
                    (s.Notes != null && s.Notes.ToLower().Contains(searchLower))
                );
            }

            var total = await query.CountAsync();

            query = sortBy.ToLower() switch
            {
                "order_number" => sortOrder.ToLower() == "asc" ? query.OrderBy(s => s.OrderNumber) : query.OrderByDescending(s => s.OrderNumber),
                "start_date" => sortOrder.ToLower() == "asc" ? query.OrderBy(s => s.StartDate) : query.OrderByDescending(s => s.StartDate),
                "priority" => sortOrder.ToLower() == "asc" ? query.OrderBy(s => s.Priority) : query.OrderByDescending(s => s.Priority),
                "status" => sortOrder.ToLower() == "asc" ? query.OrderBy(s => s.Status) : query.OrderByDescending(s => s.Status),
                _ => sortOrder.ToLower() == "asc" ? query.OrderBy(s => s.CreatedDate) : query.OrderByDescending(s => s.CreatedDate)
            };

            var serviceOrders = await query
                .Skip((page - 1) * limit)
                .Take(limit)
                .Include(s => s.Jobs)
                .Include(s => s.Materials)
                .ToListAsync();

            var contactIds = serviceOrders.Select(s => s.ContactId).Distinct().ToList();
            var contacts = await _context.Contacts
                .Where(c => contactIds.Contains(c.Id))
                .ToDictionaryAsync(c => c.Id);

            // Fetch sale numbers for service orders that have a saleId
            var saleIds = serviceOrders
                .Where(s => !string.IsNullOrEmpty(s.SaleId) && int.TryParse(s.SaleId, out _))
                .Select(s => int.Parse(s.SaleId!))
                .Distinct()
                .ToList();
            var saleNumbers = saleIds.Any() 
                ? await _context.Sales
                    .Where(s => saleIds.Contains(s.Id))
                    .ToDictionaryAsync(s => s.Id.ToString(), s => s.SaleNumber)
                : new Dictionary<string, string>();

            // Fetch user names for createdBy - resolve from MainAdminUsers (ID 1) or Users table
            var creatorUserIds = serviceOrders
                .Where(s => !string.IsNullOrEmpty(s.CreatedBy) && int.TryParse(s.CreatedBy, out _))
                .Select(s => int.Parse(s.CreatedBy!))
                .Distinct()
                .ToList();
            
            var userNames = new Dictionary<string, string>();
            
            // Check MainAdminUsers for ID 1
            if (creatorUserIds.Contains(1))
            {
                var adminUser = await _context.MainAdminUsers.FirstOrDefaultAsync();
                if (adminUser != null)
                    userNames["1"] = $"{adminUser.FirstName} {adminUser.LastName}".Trim();
            }
            
            // Check Users table for other IDs
            var regularUserIds = creatorUserIds.Where(id => id != 1).ToList();
            if (regularUserIds.Any())
            {
                var users = await _context.Users
                    .Where(u => regularUserIds.Contains(u.Id))
                    .ToListAsync();
                foreach (var user in users)
                {
                    userNames[user.Id.ToString()] = $"{user.FirstName} {user.LastName}".Trim();
                }
            }

            // Fetch user names for technicians assigned to jobs
            var jobTechnicianIds = serviceOrders
                .SelectMany(s => s.Jobs ?? Enumerable.Empty<MyApi.Modules.ServiceOrders.Models.ServiceOrderJob>())
                .Where(j => j.AssignedTechnicianIds != null)
                .SelectMany(j => j.AssignedTechnicianIds!)
                .Where(id => int.TryParse(id, out _))
                .Select(id => int.Parse(id))
                .Distinct()
                .ToList();

            if (jobTechnicianIds.Any())
            {
                var techUsers = await _context.Users
                    .Where(u => jobTechnicianIds.Contains(u.Id))
                    .ToListAsync();
                foreach (var user in techUsers)
                {
                    userNames[user.Id.ToString()] = $"{user.FirstName} {user.LastName}".Trim();
                }
            }

            var dtos = serviceOrders.Select(s => MapToDto(
                s, 
                contacts.GetValueOrDefault(s.ContactId), 
                saleNumbers.GetValueOrDefault(s.SaleId ?? ""),
                userNames.GetValueOrDefault(s.CreatedBy ?? ""),
                userNames
            )).ToList();

            return new PaginatedServiceOrderResponse
            {
                ServiceOrders = dtos,
                Pagination = new PaginationInfo
                {
                    Page = page,
                    Limit = limit,
                    Total = total,
                    TotalPages = (int)Math.Ceiling((double)total / limit)
                }
            };
        }

        public async Task<ServiceOrderDto?> GetServiceOrderByIdAsync(int id, bool includeJobs = true)
        {
            var query = _context.ServiceOrders.AsNoTracking().Where(s => !s.IsDeleted).AsQueryable();
            if (includeJobs)
                query = query.Include(s => s.Jobs).Include(s => s.Materials);

            var serviceOrder = await query.FirstOrDefaultAsync(s => s.Id == id);
            if (serviceOrder == null)
                return null;

            var contact = await _context.Contacts.FindAsync(serviceOrder.ContactId);
            
            // Fetch sale number and backfill estimated cost if needed
            string? saleNumber = null;
            if (!string.IsNullOrEmpty(serviceOrder.SaleId) && int.TryParse(serviceOrder.SaleId, out int parsedSaleId))
            {
                var sale = await _context.Sales.FindAsync(parsedSaleId);
                saleNumber = sale?.SaleNumber;
                
                // Backfill estimated cost from sale if it's 0 (legacy data)
                if ((serviceOrder.EstimatedCost == null || serviceOrder.EstimatedCost == 0) && sale != null)
                {
                    var saleCost = sale.GrandTotal > 0 ? sale.GrandTotal : sale.TotalAmount;
                    if (saleCost > 0)
                    {
                        serviceOrder.EstimatedCost = saleCost;
                        // Also persist the fix so it doesn't need to be recalculated
                        var tracked = await _context.ServiceOrders.FindAsync(serviceOrder.Id);
                        if (tracked != null)
                        {
                            tracked.EstimatedCost = saleCost;
                            await _context.SaveChangesAsync();
                        }
                    }
                }
            }
            
            // Resolve createdByName - check MainAdminUsers first (ID 1), then Users table
            string? createdByName = null;
            if (!string.IsNullOrEmpty(serviceOrder.CreatedBy) && int.TryParse(serviceOrder.CreatedBy, out int createdByUserId))
            {
                if (createdByUserId == 1)
                {
                    var adminUser = await _context.MainAdminUsers.FirstOrDefaultAsync();
                    createdByName = adminUser != null ? $"{adminUser.FirstName} {adminUser.LastName}".Trim() : null;
                }
                else
                {
                    var user = await _context.Users.FindAsync(createdByUserId);
                    createdByName = user != null ? $"{user.FirstName} {user.LastName}".Trim() : null;
                }
            }
            
            // Resolving technician names for jobs
            var userNames = new Dictionary<string, string>();
            if (createdByName != null && serviceOrder.CreatedBy != null)
            {
                userNames[serviceOrder.CreatedBy] = createdByName;
            }

            var jobTechnicianIds = serviceOrder.Jobs?
                .Where(j => j.AssignedTechnicianIds != null)
                .SelectMany(j => j.AssignedTechnicianIds!)
                .Where(id => int.TryParse(id, out _))
                .Select(id => int.Parse(id))
                .Distinct()
                .ToList() ?? new List<int>();

            if (jobTechnicianIds.Any())
            {
                var techUsers = await _context.Users
                    .Where(u => jobTechnicianIds.Contains(u.Id))
                    .ToListAsync();
                foreach (var user in techUsers)
                {
                    userNames[user.Id.ToString()] = $"{user.FirstName} {user.LastName}".Trim();
                }
            }

            return MapToDto(serviceOrder, contact, saleNumber, createdByName, userNames);
        }

        public async Task<ServiceOrderDto> UpdateServiceOrderAsync(int id, UpdateServiceOrderDto updateDto, string userId)
        {
            var serviceOrder = await _context.ServiceOrders.FindAsync(id);
            if (serviceOrder == null)
                throw new KeyNotFoundException($"Service order with ID {id} not found");

            if (updateDto.Status != null) serviceOrder.Status = updateDto.Status;
            if (updateDto.ProjectId.HasValue) serviceOrder.ProjectId = updateDto.ProjectId.Value;
            if (updateDto.Priority != null) serviceOrder.Priority = updateDto.Priority;
            if (updateDto.Description != null) serviceOrder.Description = updateDto.Description;
            if (updateDto.Notes != null) serviceOrder.Notes = updateDto.Notes;
            if (updateDto.StartDate.HasValue) serviceOrder.StartDate = DateTime.SpecifyKind(updateDto.StartDate.Value, DateTimeKind.Utc);
            if (updateDto.TargetCompletionDate.HasValue) serviceOrder.TargetCompletionDate = DateTime.SpecifyKind(updateDto.TargetCompletionDate.Value, DateTimeKind.Utc);
            if (updateDto.EstimatedDuration.HasValue) serviceOrder.EstimatedDuration = updateDto.EstimatedDuration;
            if (updateDto.Discount.HasValue) serviceOrder.Discount = updateDto.Discount;
            if (updateDto.DiscountPercentage.HasValue) serviceOrder.DiscountPercentage = updateDto.DiscountPercentage;
            if (updateDto.PaymentTerms != null) serviceOrder.PaymentTerms = updateDto.PaymentTerms;
            if (updateDto.RequiresApproval.HasValue) serviceOrder.RequiresApproval = updateDto.RequiresApproval.Value;
            if (updateDto.Tags != null) serviceOrder.Tags = updateDto.Tags;
            if (updateDto.CustomFields != null) serviceOrder.CustomFields = System.Text.Json.JsonSerializer.Serialize(updateDto.CustomFields);

            serviceOrder.ModifiedBy = userId;
            serviceOrder.ModifiedDate = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            var result = await GetServiceOrderByIdAsync(id);
            return result!;
        }

        public async Task<ServiceOrderDto> PatchServiceOrderAsync(int id, UpdateServiceOrderDto updateDto, string userId)
        {
            return await UpdateServiceOrderAsync(id, updateDto, userId);
        }

        public async Task<ServiceOrderDto> UpdateStatusAsync(int id, UpdateServiceOrderStatusDto statusDto, string userId)
        {
            var serviceOrder = await _context.ServiceOrders.FindAsync(id);
            if (serviceOrder == null)
                throw new KeyNotFoundException($"Service order with ID {id} not found");

            // Validate status transition
            var validTransitions = GetValidStatusTransitions(serviceOrder.Status);
            if (!validTransitions.Contains(statusDto.Status))
                throw new InvalidOperationException($"Cannot transition from '{serviceOrder.Status}' to '{statusDto.Status}'");

            var oldStatus = serviceOrder.Status;
            serviceOrder.Status = statusDto.Status;
            if (statusDto.Status == "in_progress" && !serviceOrder.ActualStartDate.HasValue)
                serviceOrder.ActualStartDate = DateTime.UtcNow;

            serviceOrder.ModifiedBy = userId;
            serviceOrder.ModifiedDate = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            // Upward propagation: Log activity to parent Sale (and Offer)
            if (oldStatus != statusDto.Status)
            {
                await PropagateServiceOrderStatusToSaleAsync(serviceOrder, oldStatus, statusDto.Status, userId);
            }

            // Trigger workflow automation for status change
            if (oldStatus != statusDto.Status && _workflowTriggerService != null)
            {
                try
                {
                    await _workflowTriggerService.TriggerStatusChangeAsync(
                        "service_order",
                        id,
                        oldStatus ?? "",
                        statusDto.Status,
                        userId,
                        new { serviceOrderId = id, orderNumber = serviceOrder.OrderNumber }
                    );
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to trigger workflow for service order {ServiceOrderId} status change", id);
                }
            }

            var result = await GetServiceOrderByIdAsync(id);
            return result!;
        }

        /// <summary>
        /// Propagate service order status changes to parent Sale and Offer activities
        /// </summary>
        private async Task PropagateServiceOrderStatusToSaleAsync(ServiceOrder serviceOrder, string? oldStatus, string newStatus, string userId)
        {
            try
            {
                if (string.IsNullOrEmpty(serviceOrder.SaleId)) return;
                if (!int.TryParse(serviceOrder.SaleId, out int saleId)) return;

                var sale = await _context.Sales.FindAsync(saleId);
                if (sale == null) return;

                // Create SaleActivity for service order status change
                var saleActivity = new SaleActivity
                {
                    SaleId = saleId,
                    Type = "service_order_status_changed",
                    Description = $"Service order #{serviceOrder.OrderNumber} status: {oldStatus} → {newStatus}",
                    CreatedAt = DateTime.UtcNow,
                    CreatedByName = sale.AssignedToName ?? "System"
                };
                _context.SaleActivities.Add(saleActivity);

                // Propagate to Offer if sale came from an offer
                if (!string.IsNullOrEmpty(sale.OfferId) && int.TryParse(sale.OfferId, out int offerId))
                {
                    var offerActivity = new MyApi.Modules.Offers.Models.OfferActivity
                    {
                        OfferId = offerId,
                        Type = "service_order_status_changed",
                        Description = $"Service order #{serviceOrder.OrderNumber} status: {oldStatus} → {newStatus} (Sale #{saleId})",
                        CreatedAt = DateTime.UtcNow,
                        CreatedByName = sale.AssignedToName ?? "System"
                    };
                    _context.OfferActivities.Add(offerActivity);
                }

                await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to propagate service order status to sale activities for service order {ServiceOrderId}", serviceOrder.Id);
            }
        }

        public async Task<ServiceOrderDto> ApproveAsync(int id, ApproveServiceOrderDto approveDto, string userId)
        {
            var serviceOrder = await _context.ServiceOrders.FindAsync(id);
            if (serviceOrder == null)
                throw new KeyNotFoundException($"Service order with ID {id} not found");

            if (!serviceOrder.RequiresApproval)
                throw new InvalidOperationException("Service order does not require approval");

            serviceOrder.ApprovedBy = userId;
            serviceOrder.ApprovalDate = approveDto.ApprovalDate ?? DateTime.UtcNow;
            serviceOrder.Status = "completed";
            serviceOrder.ActualCompletionDate = DateTime.UtcNow;
            serviceOrder.CompletionPercentage = 100;
            serviceOrder.ModifiedBy = userId;
            serviceOrder.ModifiedDate = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            var result = await GetServiceOrderByIdAsync(id);
            return result!;
        }

        public async Task<ServiceOrderDto> CompleteAsync(int id, CompleteServiceOrderDto completeDto, string userId)
        {
            var serviceOrder = await _context.ServiceOrders.Include(s => s.Jobs).FirstOrDefaultAsync(s => s.Id == id);
            if (serviceOrder == null)
                throw new KeyNotFoundException($"Service order with ID {id} not found");

            // Check if all jobs are completed
            if (serviceOrder.Jobs != null && serviceOrder.Jobs.Any(j => j.Status != "completed"))
                throw new InvalidOperationException("Not all jobs are completed");

            serviceOrder.Status = "completed";
            serviceOrder.ActualCompletionDate = DateTime.UtcNow;
            serviceOrder.TechnicallyCompletedAt = DateTime.UtcNow;
            serviceOrder.CompletionPercentage = 100;
            serviceOrder.PaymentStatus = "pending";

            // Update CompletedDispatchCount from actual dispatch data
            var jobIds = serviceOrder.Jobs?.Select(j => j.Id.ToString()).ToList() ?? new List<string>();
            if (jobIds.Any())
            {
                serviceOrder.CompletedDispatchCount = await _context.Dispatches
                    .CountAsync(d => d.JobId != null && jobIds.Contains(d.JobId) && d.Status == "completed");
            }

            if (completeDto.GenerateInvoice)
            {
                serviceOrder.InvoiceNumber = $"INV-{DateTime.UtcNow:yyyy-MM-dd}-{Guid.NewGuid().ToString().Substring(0, 5).ToUpper()}";
                serviceOrder.InvoiceDate = DateTime.UtcNow;
            }

            serviceOrder.ModifiedBy = userId;
            serviceOrder.ModifiedDate = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            var result = await GetServiceOrderByIdAsync(id);
            return result!;
        }

        public async Task<ServiceOrderDto> CancelAsync(int id, CancelServiceOrderDto cancelDto, string userId)
        {
            var serviceOrder = await _context.ServiceOrders.FindAsync(id);
            if (serviceOrder == null)
                throw new KeyNotFoundException($"Service order with ID {id} not found");

            serviceOrder.Status = "cancelled";
            serviceOrder.CancellationReason = cancelDto.CancellationReason;
            serviceOrder.CancellationNotes = cancelDto.CancellationNotes;
            serviceOrder.ModifiedBy = userId;
            serviceOrder.ModifiedDate = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            var result = await GetServiceOrderByIdAsync(id);
            return result!;
        }

        public async Task<bool> DeleteAsync(int id, string userId)
        {
            var serviceOrder = await _context.ServiceOrders.FindAsync(id);
            if (serviceOrder == null || serviceOrder.IsDeleted)
                return false;

            // Store sale ID before deletion for resetting
            var saleId = serviceOrder.SaleId;

            serviceOrder.IsDeleted = true;
            serviceOrder.DeletedAt = DateTime.UtcNow;
            serviceOrder.DeletedBy = userId;
            await _context.SaveChangesAsync();

            // Reset the sale's serviceOrdersStatus if linked
            if (!string.IsNullOrEmpty(saleId) && int.TryParse(saleId, out int parsedSaleId))
            {
                var sale = await _context.Sales.FindAsync(parsedSaleId);
                if (sale != null)
                {
                    sale.ServiceOrdersStatus = null;
                    sale.ModifiedDate = DateTime.UtcNow;
                    
                    // Also reset service items that were marked as converted
                    var saleItems = await _context.SaleItems
                        .Where(si => si.SaleId == parsedSaleId && si.ServiceOrderId == id.ToString())
                        .ToListAsync();
                    
                    foreach (var item in saleItems)
                    {
                        item.ServiceOrderGenerated = false;
                        item.ServiceOrderId = null;
                    }
                    
                    await _context.SaveChangesAsync();

                    // Add activity to the sale
                    var saleActivity = new SaleActivity
                    {
                        SaleId = parsedSaleId,
                        Type = "service_order_deleted",
                        Description = $"Service Order #{serviceOrder.OrderNumber} was deleted. The sale can now be converted to a new service order.",
                        CreatedAt = DateTime.UtcNow,
                        CreatedByName = "System"
                    };
                    _context.SaleActivities.Add(saleActivity);
                    await _context.SaveChangesAsync();
                }
            }

            return true;
        }

        public async Task<ServiceOrderStatsDto> GetStatisticsAsync(DateTime? startDate = null, DateTime? endDate = null, string? status = null, int? contactId = null)
        {
            var query = _context.ServiceOrders.AsQueryable();

            if (startDate.HasValue)
                query = query.Where(s => s.CreatedDate >= startDate.Value);

            if (endDate.HasValue)
                query = query.Where(s => s.CreatedDate <= endDate.Value);

            if (!string.IsNullOrEmpty(status))
                query = query.Where(s => s.Status == status);

            if (contactId.HasValue)
                query = query.Where(s => s.ContactId == contactId.Value);

            var serviceOrders = await query.ToListAsync();

            var stats = new ServiceOrderStatsDto
            {
                TotalServiceOrders = serviceOrders.Count,
                ByStatus = new Dictionary<string, int>
                {
                    { "draft", serviceOrders.Count(s => s.Status == "draft") },
                    { "scheduled", serviceOrders.Count(s => s.Status == "scheduled") },
                    { "in_progress", serviceOrders.Count(s => s.Status == "in_progress") },
                    { "on_hold", serviceOrders.Count(s => s.Status == "on_hold") },
                    { "completed", serviceOrders.Count(s => s.Status == "completed") },
                    { "cancelled", serviceOrders.Count(s => s.Status == "cancelled") }
                },
                ByPriority = new Dictionary<string, int>
                {
                    { "low", serviceOrders.Count(s => s.Priority == "low") },
                    { "medium", serviceOrders.Count(s => s.Priority == "medium") },
                    { "high", serviceOrders.Count(s => s.Priority == "high") },
                    { "urgent", serviceOrders.Count(s => s.Priority == "urgent") }
                },
                Financials = new FinancialStatsDto
                {
                    TotalEstimatedCost = serviceOrders.Sum(s => s.EstimatedCost ?? 0),
                    TotalActualCost = serviceOrders.Sum(s => s.ActualCost ?? 0),
                    TotalDiscount = serviceOrders.Sum(s => s.Discount ?? 0),
                    TotalTax = serviceOrders.Sum(s => s.Tax ?? 0),
                    TotalBilled = serviceOrders.Sum(s => s.TotalAmount ?? 0),
                    TotalPaid = serviceOrders.Where(s => s.PaymentStatus == "paid").Sum(s => s.TotalAmount ?? 0),
                    TotalPending = serviceOrders.Where(s => s.PaymentStatus == "pending").Sum(s => s.TotalAmount ?? 0)
                }
            };

            // Calculate completion metrics
            var completedOrders = serviceOrders.Where(s => s.Status == "completed").ToList();
            if (completedOrders.Any())
            {
                var completionTimes = completedOrders
                    .Where(s => s.ActualStartDate.HasValue && s.ActualCompletionDate.HasValue)
                    .Select(s => (s.ActualCompletionDate!.Value - s.ActualStartDate!.Value).TotalHours)
                    .ToList();

                stats.AverageCompletionTime = completionTimes.Any() ? completionTimes.Average() : 0;
                stats.CompletionRate = (double)completedOrders.Count / serviceOrders.Count * 100;

                var onTimeCompleted = completedOrders.Count(s =>
                    s.ActualCompletionDate.HasValue &&
                    s.TargetCompletionDate.HasValue &&
                    s.ActualCompletionDate <= s.TargetCompletionDate);
                stats.OnTimeCompletionRate = (double)onTimeCompleted / completedOrders.Count * 100;
            }

            return stats;
        }

        private ServiceOrderDto MapToDto(ServiceOrder serviceOrder, Contact? contact, string? saleNumber = null, string? createdByName = null, Dictionary<string, string>? userNames = null)
        {
            return new ServiceOrderDto
            {
                Id = serviceOrder.Id,
                OrderNumber = serviceOrder.OrderNumber,
                SaleId = serviceOrder.SaleId,
                SaleNumber = saleNumber,
                OfferId = serviceOrder.OfferId,
                ProjectId = serviceOrder.ProjectId,
                ContactId = serviceOrder.ContactId,
                Status = serviceOrder.Status,
                Priority = serviceOrder.Priority,
                Description = serviceOrder.Description,
                Notes = serviceOrder.Notes,
                StartDate = serviceOrder.StartDate,
                TargetCompletionDate = serviceOrder.TargetCompletionDate,
                ActualStartDate = serviceOrder.ActualStartDate,
                ActualCompletionDate = serviceOrder.ActualCompletionDate,
                EstimatedDuration = serviceOrder.EstimatedDuration,
                ActualDuration = serviceOrder.ActualDuration,
                EstimatedCost = serviceOrder.EstimatedCost,
                ActualCost = serviceOrder.ActualCost,
                Discount = serviceOrder.Discount,
                DiscountPercentage = serviceOrder.DiscountPercentage,
                Tax = serviceOrder.Tax,
                TotalAmount = serviceOrder.TotalAmount,
                PaymentStatus = serviceOrder.PaymentStatus,
                PaymentTerms = serviceOrder.PaymentTerms,
                InvoiceNumber = serviceOrder.InvoiceNumber,
                InvoiceDate = serviceOrder.InvoiceDate,
                CompletionPercentage = serviceOrder.CompletionPercentage,
                RequiresApproval = serviceOrder.RequiresApproval,
                ApprovedBy = serviceOrder.ApprovedBy,
                ApprovalDate = serviceOrder.ApprovalDate,
                Tags = serviceOrder.Tags,
                CustomFields = serviceOrder.CustomFields != null
                    ? System.Text.Json.JsonSerializer.Deserialize<object>(serviceOrder.CustomFields)
                    : null,
                CreatedBy = serviceOrder.CreatedBy,
                CreatedByName = createdByName,
                CreatedAt = serviceOrder.CreatedDate,
                UpdatedBy = serviceOrder.ModifiedBy,
                UpdatedAt = serviceOrder.ModifiedDate ?? serviceOrder.CreatedDate,
                Jobs = serviceOrder.Jobs?.Select(j => new ServiceOrderJobDto
                {
                    Id = j.Id,
                    ServiceOrderId = j.ServiceOrderId,
                    Title = j.Title ?? string.Empty,
                    Description = j.Description,
                    Status = j.Status,
                    InstallationId = j.InstallationId,
                    WorkType = j.WorkType,
                    EstimatedDuration = j.EstimatedDuration,
                    EstimatedCost = j.EstimatedCost,
                    CompletionPercentage = j.CompletionPercentage,
                    AssignedTechnicianIds = j.AssignedTechnicianIds,
                    AssignedTechnicians = j.AssignedTechnicianIds?.Select(id => {
                        return new UserLightDto 
                        {
                            Id = int.TryParse(id, out var parsedId) ? parsedId : 0,
                            Name = userNames?.GetValueOrDefault(id) ?? id,
                            Email = null
                        };
                    }).ToList()
                }).ToList(),
                Materials = serviceOrder.Materials?.Select(m => new ServiceOrderMaterialDto
                {
                    Id = m.Id,
                    ServiceOrderId = m.ServiceOrderId,
                    SaleItemId = m.SaleItemId,
                    ArticleId = m.ArticleId,
                    Name = m.Name,
                    Sku = m.Sku,
                    Description = m.Description,
                    Quantity = m.Quantity,
                    UnitPrice = m.UnitPrice,
                    TotalPrice = m.TotalPrice,
                    Status = m.Status,
                    Source = m.Source,
                    InternalComment = m.InternalComment,
                    ExternalComment = m.ExternalComment,
                    Replacing = m.Replacing,
                    OldArticleModel = m.OldArticleModel,
                    OldArticleStatus = m.OldArticleStatus,
                    InstallationId = m.InstallationId,
                    InstallationName = m.InstallationName,
                    CreatedBy = m.CreatedBy,
                    CreatedAt = m.CreatedAt
                }).ToList(),
                TechnicallyCompletedAt = serviceOrder.TechnicallyCompletedAt,
                ServiceCount = serviceOrder.ServiceCount,
                CompletedDispatchCount = serviceOrder.CompletedDispatchCount,
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
                } : null
            };
        }

        private List<string> GetValidStatusTransitions(string currentStatus)
        {
            return currentStatus switch
            {
                "draft" => new List<string> { "pending", "planned", "ready_for_planning", "scheduled", "cancelled" },
                "pending" => new List<string> { "planned", "ready_for_planning", "scheduled", "in_progress", "on_hold", "cancelled" },
                "planned" => new List<string> { "pending", "scheduled", "in_progress", "on_hold", "cancelled" },
                "ready_for_planning" => new List<string> { "pending", "planned", "scheduled", "in_progress", "on_hold", "cancelled" },
                "scheduled" => new List<string> { "pending", "planned", "ready_for_planning", "in_progress", "on_hold", "cancelled" },
                "in_progress" => new List<string> { "on_hold", "technically_completed", "completed", "cancelled" },
                "on_hold" => new List<string> { "pending", "planned", "ready_for_planning", "in_progress", "cancelled" },
                "technically_completed" => new List<string> { "in_progress", "ready_for_invoice", "completed", "cancelled" },
                "ready_for_invoice" => new List<string> { "technically_completed", "invoiced", "cancelled" },
                "completed" => new List<string> { "ready_for_invoice", "invoiced", "closed" },
                "invoiced" => new List<string> { "closed" },
                "closed" => new List<string>(),
                "cancelled" => new List<string> { "pending", "planned", "ready_for_planning" },
                _ => new List<string>()
            };
        }

        private string DetermineWorkType(string? itemName)
        {
            if (string.IsNullOrEmpty(itemName)) return "maintenance";
            
            var name = itemName.ToLower();
            if (name.Contains("repair")) return "repair";
            if (name.Contains("install")) return "installation";
            if (name.Contains("inspect")) return "inspection";
            if (name.Contains("upgrade")) return "upgrade";
            return "maintenance";
        }

        // ============== AGGREGATION METHODS ==============

        public async Task<List<DispatchDto>> GetDispatchesForServiceOrderAsync(int serviceOrderId)
        {
            var serviceOrder = await _context.ServiceOrders
                .Include(so => so.Jobs)
                .FirstOrDefaultAsync(so => so.Id == serviceOrderId);
            
            if (serviceOrder == null)
                throw new KeyNotFoundException($"Service order with ID {serviceOrderId} not found");

            var jobIdStrings = serviceOrder.Jobs?.Select(j => j.Id.ToString()).ToList() ?? new List<string>();
            
            // Include AssignedTechnicians to properly populate technician data
            var dispatches = await _context.Dispatches
                .Where(d => d.JobId != null && jobIdStrings.Contains(d.JobId))
                .Include(d => d.AssignedTechnicians)
                .AsSingleQuery()
                .ToListAsync();

            // Get all technician IDs to fetch user names
            var allTechnicianIds = dispatches
                .SelectMany(d => d.AssignedTechnicians.Select(at => at.TechnicianId))
                .Distinct()
                .ToList();

            // Fetch user names for all technicians in one query
            var technicianUsers = await _context.Users
                .Where(u => allTechnicianIds.Contains(u.Id))
                .Select(u => new { u.Id, u.FirstName, u.LastName, u.Email })
                .ToDictionaryAsync(u => u.Id);

            return dispatches.Select(d => new DispatchDto
            {
                Id = d.Id,
                DispatchNumber = d.DispatchNumber,
                JobId = int.TryParse(d.JobId, out var jid) ? jid : 0,
                ServiceOrderId = d.ServiceOrderId,
                ProjectId = d.ProjectId,
                Status = d.Status ?? "pending",
                Priority = d.Priority ?? "medium",
                AssignedTechnicians = d.AssignedTechnicians.Select(at => {
                    var user = technicianUsers.GetValueOrDefault(at.TechnicianId);
                    return new UserLightDto 
                    { 
                        Id = at.TechnicianId,
                        Name = user != null ? $"{user.FirstName} {user.LastName}".Trim() : null,
                        Email = user?.Email
                    };
                }).ToList(),
                Scheduling = new SchedulingDto
                {
                    ScheduledDate = d.ScheduledDate,
                    EstimatedDuration = d.ActualDuration ?? 0
                },
                ScheduledDate = d.ScheduledDate,
                Notes = new System.Collections.Generic.List<object> { (object?)d.Description ?? string.Empty },
                DispatchedBy = d.DispatchedBy,
                DispatchedAt = d.DispatchedAt,
                CreatedAt = d.CreatedDate,
                UpdatedAt = d.ModifiedDate ?? d.CreatedDate
            }).ToList();
        }

        public async Task<List<TimeEntryDto>> GetTimeEntriesForServiceOrderAsync(int serviceOrderId)
        {
            var serviceOrder = await _context.ServiceOrders
                .Include(so => so.Jobs)
                .FirstOrDefaultAsync(so => so.Id == serviceOrderId);
            
            if (serviceOrder == null)
                throw new KeyNotFoundException($"Service order with ID {serviceOrderId} not found");

            var allTimeEntries = new List<TimeEntryDto>();

            // 1. Get time entries directly on the service order (ServiceOrderTimeEntries table)
            var soTimeEntries = await _context.ServiceOrderTimeEntries
                .Where(t => t.ServiceOrderId == serviceOrderId)
                .ToListAsync();

            allTimeEntries.AddRange(soTimeEntries.Select(te => new TimeEntryDto
            {
                Id = te.Id,
                DispatchId = 0,
                TechnicianId = te.TechnicianId ?? "",
                WorkType = te.WorkType ?? "general",
                StartTime = te.StartTime,
                EndTime = te.EndTime,
                Duration = te.Duration,
                Description = te.Description,
                TotalCost = te.TotalCost ?? 0,
                Billable = te.Billable,
                HourlyRate = te.HourlyRate,
                CreatedAt = te.CreatedAt,
                InvoiceStatus = te.InvoiceStatus,
                SourceTable = "service_order"
            }));

            // 2. Get time entries from dispatches
            var jobIdStrings = serviceOrder.Jobs?.Select(j => j.Id.ToString()).ToList() ?? new List<string>();
            
            var dispatchIds = await _context.Dispatches
                .Where(d => d.JobId != null && jobIdStrings.Contains(d.JobId))
                .Select(d => d.Id)
                .ToListAsync();

            var timeEntries = await _context.TimeEntries
                .Where(te => dispatchIds.Contains(te.DispatchId))
                .ToListAsync();

            allTimeEntries.AddRange(timeEntries.Select(te => new TimeEntryDto
            {
                Id = te.Id,
                DispatchId = te.DispatchId,
                TechnicianId = te.TechnicianId.ToString(),
                WorkType = te.WorkType ?? "general",
                StartTime = te.StartTime,
                EndTime = te.EndTime,
                Duration = (int)(te.Duration ?? 0),
                Description = te.Description,
                TotalCost = 0,
                Billable = true, // Dispatch time entries don't have billable field - default true
                CreatedAt = te.CreatedDate,
                InvoiceStatus = null, // Dispatch TimeEntries don't have InvoiceStatus
                SourceTable = "dispatch"
            }));

            return allTimeEntries;
        }

        public async Task<List<ExpenseDto>> GetExpensesForServiceOrderAsync(int serviceOrderId)
        {
            var serviceOrder = await _context.ServiceOrders
                .Include(so => so.Jobs)
                .FirstOrDefaultAsync(so => so.Id == serviceOrderId);
            
            if (serviceOrder == null)
                throw new KeyNotFoundException($"Service order with ID {serviceOrderId} not found");

            var allExpenses = new List<ExpenseDto>();

            // 1. Get expenses directly on the service order (ServiceOrderExpenses table)
            var soExpenses = await _context.ServiceOrderExpenses
                .Where(e => e.ServiceOrderId == serviceOrderId)
                .ToListAsync();

            allExpenses.AddRange(soExpenses.Select(e => new ExpenseDto
            {
                Id = e.Id,
                DispatchId = 0,
                TechnicianId = e.TechnicianId ?? "",
                Type = e.Type ?? "other",
                Amount = e.Amount,
                Currency = e.Currency ?? "TND",
                Description = e.Description,
                Status = e.Status ?? "pending",
                Date = e.Date ?? e.CreatedAt,
                CreatedAt = e.CreatedAt,
                InvoiceStatus = e.InvoiceStatus,
                SourceTable = "service_order"
            }));

            // 2. Get expenses from dispatches
            var jobIdStrings = serviceOrder.Jobs?.Select(j => j.Id.ToString()).ToList() ?? new List<string>();
            
            var dispatchIds = await _context.Dispatches
                .Where(d => d.JobId != null && jobIdStrings.Contains(d.JobId))
                .Select(d => d.Id)
                .ToListAsync();

            var expenses = await _context.DispatchExpenses
                .Where(e => dispatchIds.Contains(e.DispatchId))
                .ToListAsync();

            allExpenses.AddRange(expenses.Select(e => new ExpenseDto
            {
                Id = e.Id,
                DispatchId = e.DispatchId,
                TechnicianId = e.RecordedBy ?? "",
                Type = e.ExpenseType ?? "other",
                Amount = e.Amount,
                Currency = "TND",
                Description = e.Description,
                Status = "pending",
                Date = e.ExpenseDate,
                CreatedAt = e.CreatedDate,
                InvoiceStatus = null, // Dispatch Expenses don't have InvoiceStatus
                SourceTable = "dispatch"
            }));

            return allExpenses;
        }

        public async Task<List<MaterialDto>> GetMaterialsForServiceOrderAsync(int serviceOrderId)
        {
            var serviceOrder = await _context.ServiceOrders
                .Include(so => so.Jobs)
                .FirstOrDefaultAsync(so => so.Id == serviceOrderId);
            
            if (serviceOrder == null)
                throw new KeyNotFoundException($"Service order with ID {serviceOrderId} not found");

            var allMaterials = new List<MaterialDto>();

            // 1. Get materials directly linked to the service order (from sale conversion or manual)
            var directMaterials = await _context.ServiceOrderMaterials
                .Where(m => m.ServiceOrderId == serviceOrderId)
                .ToListAsync();

            allMaterials.AddRange(directMaterials.Select(m => new MaterialDto
            {
                Id = m.Id,
                ServiceOrderId = m.ServiceOrderId,
                ArticleId = m.ArticleId?.ToString(),
                ArticleName = m.Name,
                Sku = m.Sku,
                Description = m.Description ?? m.Name,
                Quantity = (int)m.Quantity,
                UnitPrice = m.UnitPrice,
                TotalPrice = m.TotalPrice,
                Status = m.Status,
                Source = m.Source,
                InternalComment = m.InternalComment,
                ExternalComment = m.ExternalComment,
                Replacing = m.Replacing,
                OldArticleModel = m.OldArticleModel,
                OldArticleStatus = m.OldArticleStatus,
                InstallationId = m.InstallationId,
                InstallationName = m.InstallationName,
                CreatedBy = m.CreatedBy,
                CreatedAt = m.CreatedAt,
                InvoiceStatus = m.InvoiceStatus,
                SourceTable = "service_order"
            }));

            // 2. Get materials from dispatches (used during work execution)
            var jobIdStrings = serviceOrder.Jobs?.Select(j => j.Id.ToString()).ToList() ?? new List<string>();
            
            var dispatchIds = await _context.Dispatches
                .Where(d => d.JobId != null && jobIdStrings.Contains(d.JobId))
                .Select(d => d.Id)
                .ToListAsync();

            var dispatchMaterials = await _context.DispatchMaterials
                .Where(m => dispatchIds.Contains(m.DispatchId))
                .ToListAsync();

            allMaterials.AddRange(dispatchMaterials.Select(m => new MaterialDto
            {
                Id = m.Id, // Use real ID - SourceTable differentiates
                DispatchId = m.DispatchId,
                TechnicianId = m.RecordedBy,
                ArticleId = m.ArticleId?.ToString(),
                ArticleName = m.Description,
                Description = m.Description,
                Quantity = (int)m.Quantity,
                UnitPrice = m.UnitPrice,
                TotalPrice = m.TotalPrice,
                Status = "used",
                Source = "dispatch",
                CreatedBy = m.RecordedBy,
                CreatedAt = m.UsedDate,
                InvoiceStatus = null, // Dispatch materials don't have InvoiceStatus
                SourceTable = "dispatch"
            }));

            return allMaterials;
        }

        public async Task<List<NoteDto>> GetNotesForServiceOrderAsync(int serviceOrderId)
        {
            var serviceOrder = await _context.ServiceOrders
                .Include(so => so.Jobs)
                .FirstOrDefaultAsync(so => so.Id == serviceOrderId);
            
            if (serviceOrder == null)
                throw new KeyNotFoundException($"Service order with ID {serviceOrderId} not found");

            var allNotes = new List<NoteDto>();

            // Get notes directly on the service order from ServiceOrderNotes table
            var serviceOrderNotes = await _context.ServiceOrderNotes
                .Where(n => n.ServiceOrderId == serviceOrderId)
                .OrderByDescending(n => n.CreatedAt)
                .ToListAsync();

            allNotes.AddRange(serviceOrderNotes.Select(n => new NoteDto
            {
                Id = n.Id,
                DispatchId = 0, // No dispatch ID for service order notes
                Content = n.Content ?? "",
                Category = n.Type,
                CreatedBy = n.CreatedByName ?? n.CreatedBy,
                CreatedAt = n.CreatedAt
            }));

            // Also get notes from dispatches (existing behavior)
            var jobIdStrings = serviceOrder.Jobs?.Select(j => j.Id.ToString()).ToList() ?? new List<string>();
            
            var dispatchIds = await _context.Dispatches
                .Where(d => d.JobId != null && jobIdStrings.Contains(d.JobId))
                .Select(d => d.Id)
                .ToListAsync();

            var dispatchNotes = await _context.DispatchNotes
                .Where(n => dispatchIds.Contains(n.DispatchId))
                .ToListAsync();

            allNotes.AddRange(dispatchNotes.Select(n => new NoteDto
            {
                Id = n.Id,
                DispatchId = n.DispatchId,
                Content = n.Content ?? "",
                Category = n.NoteType,
                CreatedBy = n.CreatedBy,
                CreatedAt = n.CreatedDate
            }));

            // Return sorted by date, newest first
            return allNotes.OrderByDescending(n => n.CreatedAt).ToList();
        }

        public async Task<ServiceOrderFullSummaryDto> GetFullSummaryAsync(int serviceOrderId)
        {
            var serviceOrder = await _context.ServiceOrders
                .Include(so => so.Jobs)
                .FirstOrDefaultAsync(so => so.Id == serviceOrderId);
            
            if (serviceOrder == null)
                throw new KeyNotFoundException($"Service order with ID {serviceOrderId} not found");

            // Get contact
            Contact? contact = null;
            if (serviceOrder.ContactId > 0)
            {
                contact = await _context.Contacts.FindAsync(serviceOrder.ContactId);
            }

            var jobIdStrings = serviceOrder.Jobs?.Select(j => j.Id.ToString()).ToList() ?? new List<string>();
            
            // Get all dispatches for this service order's jobs
            var dispatches = await _context.Dispatches
                .Where(d => d.JobId != null && jobIdStrings.Contains(d.JobId))
                .ToListAsync();

            var dispatchIds = dispatches.Select(d => d.Id).ToList();

            // Get all aggregated data
            var timeEntries = await _context.TimeEntries
                .Where(te => dispatchIds.Contains(te.DispatchId))
                .ToListAsync();

            var expenses = await _context.DispatchExpenses
                .Where(e => dispatchIds.Contains(e.DispatchId))
                .ToListAsync();

            var materials = await _context.DispatchMaterials
                .Where(m => dispatchIds.Contains(m.DispatchId))
                .ToListAsync();

            var notes = await _context.DispatchNotes
                .Where(n => dispatchIds.Contains(n.DispatchId))
                .ToListAsync();

            // Build dispatch summaries
            var dispatchSummaries = dispatches.Select(d => new DispatchSummaryDto
            {
                Id = d.Id,
                JobId = int.TryParse(d.JobId, out var jid) ? jid : 0,
                TechnicianId = d.AssignedTechnicians?.FirstOrDefault()?.TechnicianId.ToString(),
                Status = d.Status ?? "pending",
                ScheduledDate = d.ScheduledDate,
                TimeEntryCount = timeEntries.Count(te => te.DispatchId == d.Id),
                ExpenseCount = expenses.Count(e => e.DispatchId == d.Id),
                MaterialCount = materials.Count(m => m.DispatchId == d.Id)
            }).ToList();

            // Calculate totals
            var totalDuration = timeEntries.Sum(te => te.Duration ?? 0);
            var totalLaborCost = 0m; // No TotalCost in TimeEntry model
            var totalExpenses = expenses.Sum(e => e.Amount);
            var totalMaterialCost = materials.Sum(m => m.TotalPrice);

            return new ServiceOrderFullSummaryDto
            {
                ServiceOrderId = serviceOrder.Id,
                OrderNumber = serviceOrder.OrderNumber ?? "",
                Status = serviceOrder.Status ?? "",
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
                JobCount = serviceOrder.Jobs?.Count() ?? 0,
                Jobs = serviceOrder.Jobs?.Select(j => new ServiceOrderJobDto
                {
                    Id = j.Id,
                    ServiceOrderId = j.ServiceOrderId,
                    Title = j.Title ?? "",
                    Description = j.Description,
                    Status = j.Status ?? "unscheduled",
                    InstallationId = j.InstallationId?.ToString(),
                    WorkType = j.WorkType,
                    EstimatedDuration = j.EstimatedDuration,
                    EstimatedCost = j.EstimatedCost,
                    CompletionPercentage = j.CompletionPercentage,
                    AssignedTechnicianIds = j.AssignedTechnicianIds
                }).ToList() ?? new List<ServiceOrderJobDto>(),
                DispatchCount = dispatches.Count(),
                Dispatches = dispatchSummaries,
                TotalTimeEntries = timeEntries.Count(),
                TotalDuration = (int)totalDuration,
                TotalLaborCost = totalLaborCost,
                TotalExpenseCount = expenses.Count(),
                TotalExpenses = totalExpenses,
                TotalMaterialCount = materials.Count(),
                TotalMaterialCost = totalMaterialCost,
                TotalNoteCount = notes.Count(),
                GrandTotal = totalLaborCost + totalExpenses + totalMaterialCost
            };
        }

        public async Task<ServiceOrderMaterialDto> AddMaterialAsync(int serviceOrderId, CreateServiceOrderMaterialDto dto, string userId)
        {
            var serviceOrder = await _context.ServiceOrders.FindAsync(serviceOrderId);
            if (serviceOrder == null)
                throw new KeyNotFoundException($"Service order with ID {serviceOrderId} not found");

            // Determine unit from article or DTO
            var unitValue = dto.Unit ?? "piece";
            if (string.IsNullOrEmpty(dto.Unit) && dto.ArticleId.HasValue)
            {
                var articleForUnit = await _context.Articles.FirstOrDefaultAsync(a => a.Id == dto.ArticleId.Value);
                if (articleForUnit != null && !string.IsNullOrEmpty(articleForUnit.Unit))
                    unitValue = articleForUnit.Unit;
            }

            var material = new ServiceOrderMaterial
            {
                ServiceOrderId = serviceOrderId,
                ArticleId = dto.ArticleId,
                Name = dto.Name,
                Sku = dto.Sku,
                Description = dto.Description,
                Quantity = dto.Quantity,
                UnitPrice = dto.UnitPrice,
                TotalPrice = dto.Quantity * dto.UnitPrice,
                Status = "pending",
                Source = "manual",
                InternalComment = dto.InternalComment,
                ExternalComment = dto.ExternalComment,
                Replacing = dto.Replacing,
                OldArticleModel = dto.OldArticleModel,
                OldArticleStatus = dto.OldArticleStatus,
                CreatedBy = userId,
                CreatedAt = DateTime.UtcNow,
                Unit = unitValue
            };

            _context.ServiceOrderMaterials.Add(material);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Added material {MaterialId} to service order {ServiceOrderId}", material.Id, serviceOrderId);

            return new ServiceOrderMaterialDto
            {
                Id = material.Id,
                ServiceOrderId = material.ServiceOrderId,
                SaleItemId = material.SaleItemId,
                ArticleId = material.ArticleId,
                Name = material.Name,
                Sku = material.Sku,
                Description = material.Description,
                Quantity = material.Quantity,
                UnitPrice = material.UnitPrice,
                TotalPrice = material.TotalPrice,
                Status = material.Status,
                Source = material.Source,
                InternalComment = material.InternalComment,
                ExternalComment = material.ExternalComment,
                Replacing = material.Replacing,
                OldArticleModel = material.OldArticleModel,
                OldArticleStatus = material.OldArticleStatus,
                InstallationId = material.InstallationId,
                InstallationName = material.InstallationName,
                CreatedBy = material.CreatedBy,
                CreatedAt = material.CreatedAt,
                Unit = material.Unit
            };
        }

        public async Task<ServiceOrderMaterialDto?> UpdateMaterialAsync(int serviceOrderId, int materialId, UpdateServiceOrderMaterialDto dto, string userId)
        {
            var material = await _context.ServiceOrderMaterials
                .FirstOrDefaultAsync(m => m.Id == materialId && m.ServiceOrderId == serviceOrderId);
            
            if (material == null)
                return null;

            if (dto.Name != null) material.Name = dto.Name;
            if (dto.Sku != null) material.Sku = dto.Sku;
            if (dto.Description != null) material.Description = dto.Description;
            if (dto.Quantity.HasValue) material.Quantity = dto.Quantity.Value;
            if (dto.UnitPrice.HasValue) material.UnitPrice = dto.UnitPrice.Value;
            if (dto.Quantity.HasValue || dto.UnitPrice.HasValue)
                material.TotalPrice = material.Quantity * material.UnitPrice;
            if (dto.InternalComment != null) material.InternalComment = dto.InternalComment;
            if (dto.ExternalComment != null) material.ExternalComment = dto.ExternalComment;
            if (dto.Replacing.HasValue) material.Replacing = dto.Replacing.Value;
            if (dto.OldArticleModel != null) material.OldArticleModel = dto.OldArticleModel;
            if (dto.OldArticleStatus != null) material.OldArticleStatus = dto.OldArticleStatus;
            if (dto.Status != null) material.Status = dto.Status;
            material.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            _logger.LogInformation("Updated material {MaterialId} for service order {ServiceOrderId}", materialId, serviceOrderId);

            return new ServiceOrderMaterialDto
            {
                Id = material.Id,
                ServiceOrderId = material.ServiceOrderId,
                SaleItemId = material.SaleItemId,
                ArticleId = material.ArticleId,
                Name = material.Name,
                Sku = material.Sku,
                Description = material.Description,
                Quantity = material.Quantity,
                UnitPrice = material.UnitPrice,
                TotalPrice = material.TotalPrice,
                Status = material.Status,
                Source = material.Source,
                InternalComment = material.InternalComment,
                ExternalComment = material.ExternalComment,
                Replacing = material.Replacing,
                OldArticleModel = material.OldArticleModel,
                OldArticleStatus = material.OldArticleStatus,
                InstallationId = material.InstallationId,
                InstallationName = material.InstallationName,
                CreatedBy = material.CreatedBy,
                CreatedAt = material.CreatedAt
            };
        }

        public async Task<bool> DeleteMaterialAsync(int serviceOrderId, int materialId, string userId)
        {
            var material = await _context.ServiceOrderMaterials
                .FirstOrDefaultAsync(m => m.Id == materialId && m.ServiceOrderId == serviceOrderId);
            
            if (material == null)
                return false;

            _context.ServiceOrderMaterials.Remove(material);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Deleted material {MaterialId} from service order {ServiceOrderId}", materialId, serviceOrderId);

            return true;
        }

        // ========== TIME ENTRY MANAGEMENT ==========

        public async Task<ServiceOrderTimeEntryDto> AddTimeEntryAsync(int serviceOrderId, CreateServiceOrderTimeEntryDto dto, string userId)
        {
            var serviceOrder = await _context.ServiceOrders.FindAsync(serviceOrderId);
            if (serviceOrder == null)
                throw new KeyNotFoundException($"Service order with ID {serviceOrderId} not found");

            var duration = (int)(dto.EndTime - dto.StartTime).TotalMinutes;
            var totalCost = dto.Billable && dto.HourlyRate.HasValue 
                ? (dto.HourlyRate.Value * duration / 60) 
                : (decimal?)null;

            var timeEntry = new ServiceOrderTimeEntry
            {
                ServiceOrderId = serviceOrderId,
                TechnicianId = dto.TechnicianId ?? userId,
                WorkType = dto.WorkType,
                StartTime = dto.StartTime,
                EndTime = dto.EndTime,
                Duration = duration,
                Description = dto.Description,
                Billable = dto.Billable,
                HourlyRate = dto.HourlyRate,
                TotalCost = totalCost,
                Status = "pending",
                CreatedBy = userId,
                CreatedAt = DateTime.UtcNow
            };

            _context.ServiceOrderTimeEntries.Add(timeEntry);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Added time entry {TimeEntryId} to service order {ServiceOrderId}", timeEntry.Id, serviceOrderId);

            return new ServiceOrderTimeEntryDto
            {
                Id = timeEntry.Id,
                ServiceOrderId = timeEntry.ServiceOrderId,
                TechnicianId = timeEntry.TechnicianId,
                WorkType = timeEntry.WorkType,
                StartTime = timeEntry.StartTime,
                EndTime = timeEntry.EndTime,
                Duration = timeEntry.Duration,
                Description = timeEntry.Description,
                Billable = timeEntry.Billable,
                HourlyRate = timeEntry.HourlyRate,
                TotalCost = timeEntry.TotalCost,
                Status = timeEntry.Status,
                Source = "service_order",
                CreatedAt = timeEntry.CreatedAt
            };
        }

        public async Task<bool> DeleteTimeEntryAsync(int serviceOrderId, int timeEntryId, string userId)
        {
            var timeEntry = await _context.ServiceOrderTimeEntries
                .FirstOrDefaultAsync(t => t.Id == timeEntryId && t.ServiceOrderId == serviceOrderId);
            
            if (timeEntry == null)
                return false;

            _context.ServiceOrderTimeEntries.Remove(timeEntry);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Deleted time entry {TimeEntryId} from service order {ServiceOrderId}", timeEntryId, serviceOrderId);

            return true;
        }

        // ========== EXPENSE MANAGEMENT ==========

        public async Task<ServiceOrderExpenseDto> AddExpenseAsync(int serviceOrderId, CreateServiceOrderExpenseDto dto, string userId)
        {
            var serviceOrder = await _context.ServiceOrders.FindAsync(serviceOrderId);
            if (serviceOrder == null)
                throw new KeyNotFoundException($"Service order with ID {serviceOrderId} not found");

            var expense = new ServiceOrderExpense
            {
                ServiceOrderId = serviceOrderId,
                TechnicianId = dto.TechnicianId ?? userId,
                Type = dto.Type,
                Amount = dto.Amount,
                Currency = dto.Currency,
                Description = dto.Description,
                Date = dto.Date ?? DateTime.UtcNow,
                Status = "pending",
                CreatedBy = userId,
                CreatedAt = DateTime.UtcNow
            };

            _context.ServiceOrderExpenses.Add(expense);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Added expense {ExpenseId} to service order {ServiceOrderId}", expense.Id, serviceOrderId);

            return new ServiceOrderExpenseDto
            {
                Id = expense.Id,
                ServiceOrderId = expense.ServiceOrderId,
                TechnicianId = expense.TechnicianId,
                Type = expense.Type,
                Amount = expense.Amount,
                Currency = expense.Currency,
                Description = expense.Description,
                Date = expense.Date,
                Status = expense.Status,
                Source = "service_order",
                CreatedAt = expense.CreatedAt
            };
        }

        public async Task<bool> DeleteExpenseAsync(int serviceOrderId, int expenseId, string userId)
        {
            var expense = await _context.ServiceOrderExpenses
                .FirstOrDefaultAsync(e => e.Id == expenseId && e.ServiceOrderId == serviceOrderId);
            
            if (expense == null)
                return false;

            _context.ServiceOrderExpenses.Remove(expense);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Deleted expense {ExpenseId} from service order {ServiceOrderId}", expenseId, serviceOrderId);

            return true;
        }

        // ========== SERVICE ORDER JOBS (routes: GET/PATCH .../jobs/{jobId}/status, PUT .../jobs/{jobId}) ==========

        public async Task<ServiceOrderJobDto?> GetServiceOrderJobAsync(int serviceOrderId, int jobId)
        {
            var job = await _context.ServiceOrderJobs
                .AsNoTracking()
                .FirstOrDefaultAsync(j => j.Id == jobId && j.ServiceOrderId == serviceOrderId);
            return job == null ? null : MapServiceOrderJobToDto(job, null);
        }

        public async Task<ServiceOrderJobDto> PatchServiceOrderJobStatusAsync(int serviceOrderId, int jobId, UpdateServiceOrderJobStatusDto dto, string userId)
        {
            var job = await _context.ServiceOrderJobs.FirstOrDefaultAsync(j => j.Id == jobId && j.ServiceOrderId == serviceOrderId);
            if (job == null)
                throw new KeyNotFoundException($"Job {jobId} not found for service order {serviceOrderId}");
            job.Status = dto.Status;
            job.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            _logger.LogInformation("Job {JobId} status set to {Status} on service order {ServiceOrderId} by {UserId}", jobId, dto.Status, serviceOrderId, userId);
            return MapServiceOrderJobToDto(job, null);
        }

        public async Task<ServiceOrderJobDto> UpdateServiceOrderJobAsync(int serviceOrderId, int jobId, UpdateServiceOrderJobDto dto, string userId)
        {
            var job = await _context.ServiceOrderJobs.FirstOrDefaultAsync(j => j.Id == jobId && j.ServiceOrderId == serviceOrderId);
            if (job == null)
                throw new KeyNotFoundException($"Job {jobId} not found for service order {serviceOrderId}");
            if (dto.Status != null) job.Status = dto.Status;
            if (dto.Title != null) job.Title = dto.Title;
            if (dto.Description != null) job.Description = dto.Description;
            if (dto.WorkType != null) job.WorkType = dto.WorkType;
            if (dto.EstimatedDuration.HasValue) job.EstimatedDuration = dto.EstimatedDuration;
            if (dto.EstimatedCost.HasValue) job.EstimatedCost = dto.EstimatedCost;
            if (dto.CompletionPercentage.HasValue) job.CompletionPercentage = dto.CompletionPercentage;
            if (dto.AssignedTechnicianIds != null) job.AssignedTechnicianIds = dto.AssignedTechnicianIds;
            job.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            _logger.LogInformation("Job {JobId} updated on service order {ServiceOrderId} by {UserId}", jobId, serviceOrderId, userId);
            return MapServiceOrderJobToDto(job, null);
        }

        private static ServiceOrderJobDto MapServiceOrderJobToDto(ServiceOrderJob j, Dictionary<string, string>? userNames)
        {
            return new ServiceOrderJobDto
            {
                Id = j.Id,
                ServiceOrderId = j.ServiceOrderId,
                Title = j.Title ?? string.Empty,
                Description = j.Description,
                Status = j.Status,
                InstallationId = j.InstallationId,
                WorkType = j.WorkType,
                EstimatedDuration = j.EstimatedDuration,
                EstimatedCost = j.EstimatedCost,
                CompletionPercentage = j.CompletionPercentage,
                AssignedTechnicianIds = j.AssignedTechnicianIds,
                AssignedTechnicians = j.AssignedTechnicianIds?.Select(id => new UserLightDto
                {
                    Id = int.TryParse(id, out var parsedId) ? parsedId : 0,
                    Name = userNames?.GetValueOrDefault(id) ?? id,
                    Email = null
                }).ToList()
            };
        }

        // ========== INVOICE PREPARATION ==========

        public async Task<ServiceOrderDto> PrepareForInvoiceAsync(int id, PrepareInvoiceDto dto, string userId)
        {
            var serviceOrder = await _context.ServiceOrders
                .Include(so => so.Jobs)
                .FirstOrDefaultAsync(so => so.Id == id);
            if (serviceOrder == null)
                throw new KeyNotFoundException($"Service order with ID {id} not found");

            // Allow both technically_completed and ready_for_invoice (retry scenario)
            if (serviceOrder.Status != "technically_completed" && serviceOrder.Status != "ready_for_invoice")
                throw new InvalidOperationException("Service order must be in 'technically_completed' or 'ready_for_invoice' status to prepare for invoice");

            if (string.IsNullOrEmpty(serviceOrder.SaleId) || !int.TryParse(serviceOrder.SaleId, out int saleId))
                throw new InvalidOperationException("Service order must be linked to a sale to prepare for invoice");

            var sale = await _context.Sales.Include(s => s.Items).FirstOrDefaultAsync(s => s.Id == saleId);
            if (sale == null)
                throw new KeyNotFoundException($"Linked sale with ID {saleId} not found");

            _logger.LogInformation("PrepareForInvoice: SO={Id}, SaleId={SaleId}, current sale items={Count}", id, saleId, sale.Items?.Count ?? 0);

            // Pre-compute linked dispatch IDs for dispatch table lookups
            var jobIdStrings = serviceOrder.Jobs?.Select(j => j.Id.ToString()).ToList() ?? new List<string>();
            var linkedDispatchIds = await _context.Dispatches
                .Where(d => d.JobId != null && jobIdStrings.Contains(d.JobId))
                .Select(d => d.Id)
                .ToListAsync();

            var newSaleItems = new List<Sales.Models.SaleItem>();
            var currentDisplayOrder = (sale.Items?.Count ?? 0);

            // Track source entities to update InvoiceStatus AFTER successful save
            var soMaterialsToMark = new List<ServiceOrderMaterial>();
            var soExpensesToMark = new List<ServiceOrderExpense>();
            var soTimeEntriesToMark = new List<ServiceOrderTimeEntry>();

            // ===== MATERIALS FROM ServiceOrderMaterials =====
            if (dto.MaterialIds != null && dto.MaterialIds.Any())
            {
                var materials = await _context.ServiceOrderMaterials
                    .Where(m => dto.MaterialIds.Contains(m.Id) && m.ServiceOrderId == id 
                        && (m.InvoiceStatus == null || m.InvoiceStatus == "selected_for_invoice"))
                    .ToListAsync();

                _logger.LogInformation("PrepareForInvoice: Found {Count} SO materials (requested: {Requested})", materials.Count, dto.MaterialIds.Count);

                foreach (var mat in materials)
                {
                    currentDisplayOrder++;
                    newSaleItems.Add(new Sales.Models.SaleItem
                    {
                        SaleId = saleId,
                        Type = "article",
                        ItemName = mat.Name,
                        ItemCode = mat.Sku,
                        Description = mat.Description ?? mat.Name,
                        Quantity = mat.Quantity,
                        UnitPrice = mat.UnitPrice,
                        LineTotal = mat.TotalPrice,
                        ArticleId = mat.ArticleId,
                        InstallationId = mat.InstallationId,
                        InstallationName = mat.InstallationName,
                        ServiceOrderId = id.ToString(),
                        DisplayOrder = currentDisplayOrder
                    });
                    soMaterialsToMark.Add(mat);
                }
            }

            // ===== MATERIALS FROM DispatchMaterials =====
            if (dto.DispatchMaterialIds != null && dto.DispatchMaterialIds.Any())
            {
                var dispatchMats = await _context.DispatchMaterials
                    .Where(m => dto.DispatchMaterialIds.Contains(m.Id) && linkedDispatchIds.Contains(m.DispatchId))
                    .ToListAsync();

                _logger.LogInformation("PrepareForInvoice: Found {Count} dispatch materials (requested: {Requested})", dispatchMats.Count, dto.DispatchMaterialIds.Count);

                foreach (var mat in dispatchMats)
                {
                    currentDisplayOrder++;
                    newSaleItems.Add(new Sales.Models.SaleItem
                    {
                        SaleId = saleId,
                        Type = "article",
                        ItemName = mat.Description ?? $"Material #{mat.Id}",
                        Description = mat.Description ?? $"Material from dispatch",
                        Quantity = mat.Quantity,
                        UnitPrice = mat.UnitPrice,
                        LineTotal = mat.TotalPrice,
                        ArticleId = mat.ArticleId,
                        ServiceOrderId = id.ToString(),
                        DisplayOrder = currentDisplayOrder
                    });
                }
            }

            // ===== EXPENSES FROM ServiceOrderExpenses =====
            if (dto.ExpenseIds != null && dto.ExpenseIds.Any())
            {
                var soExpenses = await _context.ServiceOrderExpenses
                    .Where(e => dto.ExpenseIds.Contains(e.Id) && e.ServiceOrderId == id
                        && (e.InvoiceStatus == null || e.InvoiceStatus == "selected_for_invoice"))
                    .ToListAsync();

                _logger.LogInformation("PrepareForInvoice: Found {Count} SO expenses (requested: {Requested})", soExpenses.Count, dto.ExpenseIds.Count);

                foreach (var exp in soExpenses)
                {
                    currentDisplayOrder++;
                    newSaleItems.Add(new Sales.Models.SaleItem
                    {
                        SaleId = saleId,
                        Type = "service",
                        ItemName = $"Expense: {exp.Type}",
                        Description = exp.Description ?? $"Expense - {exp.Type}",
                        Quantity = 1,
                        UnitPrice = exp.Amount,
                        LineTotal = exp.Amount,
                        ServiceOrderId = id.ToString(),
                        DisplayOrder = currentDisplayOrder
                    });
                    soExpensesToMark.Add(exp);
                }
            }

            // ===== EXPENSES FROM DispatchExpenses =====
            if (dto.DispatchExpenseIds != null && dto.DispatchExpenseIds.Any())
            {
                var dispatchExpenses = await _context.DispatchExpenses
                    .Where(e => dto.DispatchExpenseIds.Contains(e.Id) && linkedDispatchIds.Contains(e.DispatchId))
                    .ToListAsync();

                _logger.LogInformation("PrepareForInvoice: Found {Count} dispatch expenses (requested: {Requested})", dispatchExpenses.Count, dto.DispatchExpenseIds.Count);

                foreach (var dExp in dispatchExpenses)
                {
                    currentDisplayOrder++;
                    newSaleItems.Add(new Sales.Models.SaleItem
                    {
                        SaleId = saleId,
                        Type = "service",
                        ItemName = $"Expense: {dExp.ExpenseType}",
                        Description = dExp.Description ?? $"Expense - {dExp.ExpenseType}",
                        Quantity = 1,
                        UnitPrice = dExp.Amount,
                        LineTotal = dExp.Amount,
                        ServiceOrderId = id.ToString(),
                        DisplayOrder = currentDisplayOrder
                    });
                }
            }

            // ===== TIME ENTRIES FROM ServiceOrderTimeEntries =====
            if (dto.TimeEntryIds != null && dto.TimeEntryIds.Any())
            {
                var timeEntries = await _context.ServiceOrderTimeEntries
                    .Where(t => dto.TimeEntryIds.Contains(t.Id) && t.ServiceOrderId == id && t.Billable 
                        && (t.InvoiceStatus == null || t.InvoiceStatus == "selected_for_invoice"))
                    .ToListAsync();

                _logger.LogInformation("PrepareForInvoice: Found {Count} SO time entries (requested: {Requested})", timeEntries.Count, dto.TimeEntryIds.Count);

                foreach (var te in timeEntries)
                {
                    currentDisplayOrder++;
                    var hours = te.Duration / 60.0m;
                    var rate = te.HourlyRate ?? 0;
                    var total = te.TotalCost ?? (hours * rate);

                    newSaleItems.Add(new Sales.Models.SaleItem
                    {
                        SaleId = saleId,
                        Type = "service",
                        ItemName = $"Labor: {te.WorkType}",
                        Description = te.Description ?? $"Time entry - {te.WorkType} ({te.Duration} min)",
                        Quantity = 1,
                        UnitPrice = total,
                        LineTotal = total,
                        ServiceOrderId = id.ToString(),
                        DisplayOrder = currentDisplayOrder
                    });
                    soTimeEntriesToMark.Add(te);
                }
            }

            // ===== TIME ENTRIES FROM Dispatch TimeEntries =====
            if (dto.DispatchTimeEntryIds != null && dto.DispatchTimeEntryIds.Any())
            {
                var dispatchTimeEntries = await _context.TimeEntries
                    .Where(t => dto.DispatchTimeEntryIds.Contains(t.Id) && linkedDispatchIds.Contains(t.DispatchId))
                    .ToListAsync();

                _logger.LogInformation("PrepareForInvoice: Found {Count} dispatch time entries (requested: {Requested})", dispatchTimeEntries.Count, dto.DispatchTimeEntryIds.Count);

                foreach (var te in dispatchTimeEntries)
                {
                    currentDisplayOrder++;
                    var duration = te.Duration ?? 0;
                    var hours = duration / 60.0m;
                    // Dispatch TimeEntries don't have HourlyRate/TotalCost - use 0
                    var total = hours * 0; // No rate info available

                    newSaleItems.Add(new Sales.Models.SaleItem
                    {
                        SaleId = saleId,
                        Type = "service",
                        ItemName = $"Labor: {te.WorkType ?? "work"}",
                        Description = te.Description ?? $"Time entry - {te.WorkType ?? "work"} ({duration} min)",
                        Quantity = 1,
                        UnitPrice = total,
                        LineTotal = total,
                        ServiceOrderId = id.ToString(),
                        DisplayOrder = currentDisplayOrder
                    });
                }
            }

            _logger.LogInformation("PrepareForInvoice: Total new sale items to add: {Count}", newSaleItems.Count);

            // Check that at least something was found if IDs were requested
            var hasRequestedIds = (dto.MaterialIds?.Any() == true) || (dto.ExpenseIds?.Any() == true) || (dto.TimeEntryIds?.Any() == true)
                || (dto.DispatchMaterialIds?.Any() == true) || (dto.DispatchExpenseIds?.Any() == true) || (dto.DispatchTimeEntryIds?.Any() == true);

            if (hasRequestedIds && !newSaleItems.Any())
            {
                throw new InvalidOperationException("Items were requested for transfer but none could be found or matched. Check that the IDs exist and belong to this service order.");
            }

            // Use execution strategy to support retrying transactions with Npgsql
            var strategy = _context.Database.CreateExecutionStrategy();
            await strategy.ExecuteAsync(async () =>
            {
                using var transaction = await _context.Database.BeginTransactionAsync();
                try
                {
                    if (newSaleItems.Any())
                    {
                        _logger.LogInformation("PrepareForInvoice: Adding {Count} new sale items to sale {SaleId}. Items: [{Items}]", 
                            newSaleItems.Count, saleId, 
                            string.Join(", ", newSaleItems.Select(i => $"{i.ItemName}({i.UnitPrice})")));

                        _context.SaleItems.AddRange(newSaleItems);
                        await _context.SaveChangesAsync();

                        // Mark SO source entities as transferred (dispatch entities don't have InvoiceStatus)
                        foreach (var mat in soMaterialsToMark) mat.InvoiceStatus = "selected_for_invoice";
                        foreach (var exp in soExpensesToMark) exp.InvoiceStatus = "selected_for_invoice";
                        foreach (var te in soTimeEntriesToMark) te.InvoiceStatus = "selected_for_invoice";
                        await _context.SaveChangesAsync();
                    }

                    // Update service order status
                    serviceOrder.Status = "ready_for_invoice";
                    serviceOrder.ModifiedDate = DateTime.UtcNow;
                    await _context.SaveChangesAsync();

                    // Recalculate sale totals
                    var updatedSale = await _context.Sales.Include(s => s.Items).FirstOrDefaultAsync(s => s.Id == saleId);
                    if (updatedSale != null)
                    {
                        updatedSale.TotalAmount = updatedSale.Items?.Sum(i => i.LineTotal) ?? 0;
                        updatedSale.GrandTotal = updatedSale.TotalAmount;
                        updatedSale.LastActivity = DateTime.UtcNow;
                        await _context.SaveChangesAsync();
                        
                        _logger.LogInformation("PrepareForInvoice: Sale {SaleId} now has {ItemCount} items, total: {Total}", 
                            saleId, updatedSale.Items?.Count ?? 0, updatedSale.TotalAmount);
                    }

                    await transaction.CommitAsync();
                    _logger.LogInformation("PrepareForInvoice: Transaction committed. Transferred {ItemCount} items to sale {SaleId}", newSaleItems.Count, saleId);
                }
                catch (Exception ex)
                {
                    await transaction.RollbackAsync();
                    _logger.LogError(ex, "PrepareForInvoice: Transaction ROLLED BACK for SO {Id}. Error: {Error}. InnerException: {Inner}", 
                        id, ex.Message, ex.InnerException?.Message ?? "none");
                    throw new InvalidOperationException($"Failed to transfer items to sale: {ex.InnerException?.Message ?? ex.Message}");
                }
            });

            return (await GetServiceOrderByIdAsync(id))!;
        }
    }
}

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
        private readonly MyApi.Modules.Planning.Services.IPlannedLineEntryService? _plannedEntries;
        private readonly MyApi.Modules.Shared.Services.IEntityFormDocumentService? _formDocuments;
        private readonly MyApi.Modules.Invoices.Services.IInvoiceService? _invoiceService;
        private readonly MyApi.Modules.Contacts.Services.IContactActivityService? _contactActivity;

        public ServiceOrderService(
            ApplicationDbContext context,
            ILogger<ServiceOrderService> logger,
            IWorkflowTriggerService? workflowTriggerService = null,
            MyApi.Modules.Numbering.Services.INumberingService? numberingService = null,
            IAppSettingsService? appSettingsService = null,
            MyApi.Modules.Planning.Services.IPlannedLineEntryService? plannedEntries = null,
            MyApi.Modules.Shared.Services.IEntityFormDocumentService? formDocuments = null,
            MyApi.Modules.Invoices.Services.IInvoiceService? invoiceService = null,
            MyApi.Modules.Contacts.Services.IContactActivityService? contactActivity = null)
        {
            _context = context;
            _logger = logger;
            _workflowTriggerService = workflowTriggerService;
            _numberingService = numberingService;
            _appSettingsService = appSettingsService;
            _plannedEntries = plannedEntries;
            _formDocuments = formDocuments;
            _invoiceService = invoiceService;
            _contactActivity = contactActivity;
        }

        // Phase A (A6): single formula for per-job estimated duration.
        // Denominator = number of jobs actually created (never a mix of items + orphans).
        private static int? AverageDurationPerJob(DateTime? start, DateTime? end, int jobCount)
        {
            if (!start.HasValue || !end.HasValue || jobCount <= 0) return null;
            return (int)(end.Value - start.Value).TotalHours / jobCount;
        }

        // =====================================================================
        // DIRECT CREATION (no Offer / Sale parent)
        // =====================================================================

        public async Task<ServiceOrderDto> CreateDirectAsync(CreateDirectServiceOrderDto createDto, string userId)
        {
            // --- validation -------------------------------------------------
            if (createDto == null)
                throw new ArgumentNullException(nameof(createDto));
            if (createDto.ContactId <= 0)
                throw new ArgumentException("ContactId is required", nameof(createDto));

            var contact = await _context.Contacts.FindAsync(createDto.ContactId);
            if (contact == null)
                throw new KeyNotFoundException($"Contact with ID {createDto.ContactId} not found");

            // --- number -----------------------------------------------------
            string orderNumber;
            try
            {
                orderNumber = _numberingService != null
                    ? await _numberingService.GetNextAsync("ServiceOrder")
                    : MyApi.Modules.Numbering.Services.NumberingFallback.Generate("ServiceOrder");
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Numbering service failed for direct ServiceOrder, using GUID fallback");
                orderNumber = MyApi.Modules.Numbering.Services.NumberingFallback.Generate("ServiceOrder");
            }

            // --- materials (optional) --------------------------------------
            var materials = createDto.Materials ?? new List<CreateDirectServiceOrderLineDto>();
            var materialTotal = materials.Sum(m => m.Quantity * m.UnitPrice);

            // --- status decision -------------------------------------------
            // Customer-only       -> draft
            // Any work detail set -> ready_for_planning (so it can be dispatched)
            var hasWorkDetail = createDto.StartDate.HasValue
                                || createDto.TargetCompletionDate.HasValue
                                || (createDto.AssignedTechnicianIds?.Length ?? 0) > 0
                                || (createDto.InstallationIds?.Length ?? 0) > 0
                                || materials.Any();
            var status = hasWorkDetail ? "ready_for_planning" : "draft";

            // --- order ------------------------------------------------------
            var serviceOrder = new ServiceOrder
            {
                OrderNumber = orderNumber,
                Origin = "direct",
                SaleId = null,
                OfferId = null,
                AutoGeneratedSaleId = null,
                ProjectId = createDto.ProjectId,
                ContactId = createDto.ContactId,
                ServiceType = string.IsNullOrWhiteSpace(createDto.ServiceType) ? "maintenance" : createDto.ServiceType,
                Status = status,
                Priority = createDto.Priority ?? "medium",
                Description = createDto.Description,
                Notes = createDto.Notes,
                StartDate = createDto.StartDate.HasValue
                    ? DateTime.SpecifyKind(createDto.StartDate.Value, DateTimeKind.Utc) : null,
                TargetCompletionDate = createDto.TargetCompletionDate.HasValue
                    ? DateTime.SpecifyKind(createDto.TargetCompletionDate.Value, DateTimeKind.Utc) : null,
                EstimatedDuration = createDto.EstimatedDuration
                    ?? (createDto.StartDate.HasValue && createDto.TargetCompletionDate.HasValue
                        ? (int)(createDto.TargetCompletionDate.Value - createDto.StartDate.Value).TotalHours
                        : (int?)null),
                EstimatedCost = createDto.EstimatedCost ?? materialTotal,
                ActualCost = 0,
                Discount = 0,
                DiscountPercentage = 0,
                Tax = 0,
                TotalAmount = createDto.EstimatedCost ?? materialTotal,
                PaymentStatus = "pending",
                PaymentTerms = "net30",
                CompletionPercentage = 0,
                RequiresApproval = createDto.RequiresApproval,
                Tags = createDto.Tags,
                PreferredSkills = createDto.PreferredSkills != null && createDto.PreferredSkills.Length > 0
                    ? createDto.PreferredSkills
                        .Where(s => !string.IsNullOrWhiteSpace(s))
                        .Distinct(StringComparer.OrdinalIgnoreCase)
                        .ToArray()
                    : null,
                CustomFields = createDto.CustomFields != null
                    ? System.Text.Json.JsonSerializer.Serialize(createDto.CustomFields) : null,
                CreatedBy = userId,
                CreatedDate = DateTime.UtcNow,
                ModifiedDate = DateTime.UtcNow,
                ContactLatitude = contact.Latitude,
                ContactLongitude = contact.Longitude,
                ContactHasLocation = contact.HasLocation,
                ServiceCount = materials.Count
            };

            _context.ServiceOrders.Add(serviceOrder);
            await _context.SaveChangesAsync();

            // --- optional default job (if work detail provided) ------------
            if (hasWorkDetail)
            {
                var defaultJob = new ServiceOrderJob
                {
                    ServiceOrderId = serviceOrder.Id,
                    Title = string.IsNullOrWhiteSpace(createDto.Description) ? "Service work" : createDto.Description!,
                    JobDescription = createDto.Description,
                    Description = createDto.Notes,
                    Status = "unscheduled",
                    Priority = createDto.Priority ?? "medium",
                    EstimatedDuration = createDto.EstimatedDuration,
                    EstimatedCost = materialTotal > 0 ? materialTotal : (createDto.EstimatedCost ?? 0),
                    AssignedTechnicianIds = createDto.AssignedTechnicianIds,
                    InstallationId = (createDto.InstallationIds != null && createDto.InstallationIds.Length > 0
                                        && int.TryParse(createDto.InstallationIds[0], out var _defIid))
                        ? _defIid : (int?)null
                };
                _context.ServiceOrderJobs.Add(defaultJob);
                await _context.SaveChangesAsync();
            }

            // --- optional materials ----------------------------------------
            if (materials.Any())
            {
                var rows = materials.Select(m => new ServiceOrderMaterial
                {
                    ServiceOrderId = serviceOrder.Id,
                    ArticleId = m.ArticleId,
                    Name = m.Name,
                    Sku = m.Sku,
                    Description = m.Description,
                    Quantity = m.Quantity,
                    EstimatedQuantity = m.EstimatedQuantity ?? m.Quantity,
                    UnitPrice = m.UnitPrice,
                    TotalPrice = m.Quantity * m.UnitPrice,
                    Status = "pending",
                    Source = "direct",
                    InternalComment = m.InternalComment,
                    ExternalComment = m.ExternalComment,
                    Unit = string.IsNullOrWhiteSpace(m.Unit) ? "piece" : m.Unit!,
                    CreatedBy = userId,
                    CreatedAt = DateTime.UtcNow
                }).ToList();
                _context.ServiceOrderMaterials.AddRange(rows);
                await _context.SaveChangesAsync();
            }

            _logger.LogInformation("Direct service order {OrderNumber} (Id {Id}) created for contact {ContactId} by {UserId}",
                serviceOrder.OrderNumber, serviceOrder.Id, serviceOrder.ContactId, userId);

            if (_contactActivity != null && serviceOrder.ContactId > 0)
            {
                await _contactActivity.LogAsync(
                    contactId: serviceOrder.ContactId,
                    type: MyApi.Modules.Contacts.Models.ContactActivityTypes.ServiceOrderCreated,
                    relatedEntityType: MyApi.Modules.Contacts.Models.ContactActivityEntityTypes.ServiceOrder,
                    relatedEntityId: serviceOrder.Id,
                    description: $"Service order {serviceOrder.OrderNumber} was created",
                    metadata: new { number = serviceOrder.OrderNumber, status = serviceOrder.Status, serviceType = serviceOrder.ServiceType, priority = serviceOrder.Priority },
                    createdBy: userId);
            }

            var result = await GetServiceOrderByIdAsync(serviceOrder.Id);
            return result!;
        }

        // =====================================================================
        // SHADOW SALE GENERATOR
        // Produces a Sale from a completed direct ServiceOrder so that all
        // downstream invoicing / accounting / reporting flows continue to work.
        // Idempotent: returns the existing Sale Id if AutoGeneratedSaleId is
        // already set on the order.
        // =====================================================================
        private async Task<int> EnsureShadowSaleAsync(ServiceOrder order, string userId)
        {
            if (order.AutoGeneratedSaleId.HasValue)
                return order.AutoGeneratedSaleId.Value;

            var contact = await _context.Contacts.FindAsync(order.ContactId);

            // Load materials to mirror as SaleItems
            var materials = await _context.ServiceOrderMaterials
                .Where(m => m.ServiceOrderId == order.Id)
                .ToListAsync();

            decimal totalAmount = materials.Sum(m => m.TotalPrice);
            if (totalAmount == 0)
                totalAmount = order.ActualCost ?? order.TotalAmount ?? order.EstimatedCost ?? 0;

            string saleNumber;
            try
            {
                saleNumber = _numberingService != null
                    ? await _numberingService.GetNextAsync("Sale")
                    : MyApi.Modules.Numbering.Services.NumberingFallback.Generate("Sale");
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Numbering service failed for shadow Sale, using GUID fallback");
                saleNumber = MyApi.Modules.Numbering.Services.NumberingFallback.Generate("Sale");
            }

            var sale = new Sale
            {
                TenantId = order.TenantId,
                SaleNumber = saleNumber,
                Title = $"Service Order {order.OrderNumber}",
                Description = order.Description,
                ContactId = order.ContactId,
                ProjectId = order.ProjectId,
                Status = "won",
                Stage = "closed",
                Priority = order.Priority,
                Currency = "TND",
                TotalAmount = totalAmount,
                GrandTotal = totalAmount,
                ActualCloseDate = DateTime.UtcNow,
                IsAutoGenerated = true,
                SourceServiceOrderId = order.Id,
                CreatedBy = userId,
                CreatedDate = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                Tags = new string[] { "auto-generated", "from-service-order" },
                ContactLatitude = contact?.Latitude ?? order.ContactLatitude,
                ContactLongitude = contact?.Longitude ?? order.ContactLongitude,
                ContactHasLocation = contact?.HasLocation ?? order.ContactHasLocation
            };

            _context.Sales.Add(sale);
            await _context.SaveChangesAsync();

            // Mirror materials as SaleItems
            if (materials.Any())
            {
                var items = materials.Select(m => new SaleItem
                {
                    TenantId = order.TenantId,
                    SaleId = sale.Id,
                    Type = m.ArticleId.HasValue ? "article" : "service",
                    ArticleId = m.ArticleId,
                    ItemName = m.Name,
                    ItemCode = m.Sku,
                    Description = m.Description ?? m.Name,
                    Quantity = m.Quantity,
                    UnitPrice = m.UnitPrice,
                    LineTotal = m.TotalPrice,
                    Discount = 0,
                    DiscountType = "percentage",
                    ServiceOrderGenerated = true,
                    ServiceOrderId = order.Id.ToString(),
                    FulfillmentStatus = "fulfilled",
                    Currency = sale.Currency
                }).ToList();
                _context.SaleItems.AddRange(items);
                await _context.SaveChangesAsync();
            }

            // Back-link the order to the new sale
            order.AutoGeneratedSaleId = sale.Id;
            order.SaleId = sale.Id.ToString();
            await _context.SaveChangesAsync();

            _logger.LogInformation("Shadow Sale {SaleNumber} (Id {SaleId}) generated for direct ServiceOrder {OrderId}",
                sale.SaleNumber, sale.Id, order.Id);

            return sale.Id;
        }

        public async Task<ServiceOrderDto> CreateFromSaleAsync(int saleId, CreateServiceOrderDto createDto, string userId)
        {
            // --- Task 3: idempotent creation. Fast pre-check (outside the retry loop) so
            // repeated clicks return the existing SO instead of throwing. A concurrent race
            // is caught below via DbUpdateException on the unique index.
            var preCheckSaleIdStr = saleId.ToString();
            var preExisting = await _context.ServiceOrders
                .AsNoTracking()
                .FirstOrDefaultAsync(s => s.SaleId == preCheckSaleIdStr && !s.IsDeleted);
            if (preExisting != null)
            {
                _logger.LogInformation("CreateFromSaleAsync: returning existing ServiceOrder {Id} for Sale {SaleId} (idempotent)", preExisting.Id, saleId);
                var existingDto = await GetServiceOrderByIdAsync(preExisting.Id);
                return existingDto!;
            }

            try
            {
            // Atomic creation: ServiceOrder + jobs + planned entries + materials + sale flags
            // must all succeed together. A mid-flow failure would otherwise leave a SO
            // with jobs but no planned budget, or sale items wrongly marked as converted.
            int createdServiceOrderId = 0;
            // Wrap in execution strategy to be compatible with EnableRetryOnFailure
            var strategy = _context.Database.CreateExecutionStrategy();
            await strategy.ExecuteAsync(async () =>
            {
                // Phase A (A7): retry-safe. On a strategy retry, EF may still hold
                // tracked entities from the failed attempt — clear them so we never
                // double-insert or update detached rows.
                _context.ChangeTracker.Clear();
                createdServiceOrderId = 0;
                await using var tx = await _context.Database.BeginTransactionAsync(System.Data.IsolationLevel.Serializable);
            // Verify sale exists with its items
                var sale = await _context.Sales
                    .Include(s => s.Items)
                    .FirstOrDefaultAsync(s => s.Id == saleId);
                if (sale == null)
                    throw new KeyNotFoundException($"Sale with ID {saleId} not found");

                // Re-check inside the serializable transaction (race guard). The DB-level
                // partial unique index (ux_serviceorders_tenant_saleid) is the hard fence.
                var saleIdStr = saleId.ToString();
                var existingOrder = await _context.ServiceOrders.FirstOrDefaultAsync(s => s.SaleId == saleIdStr && !s.IsDeleted);
                if (existingOrder != null)
                {
                    createdServiceOrderId = existingOrder.Id;
                    await tx.CommitAsync();
                    return;
                }

                // Get service-type items from the sale (these become jobs)
                var serviceItems = sale.Items?.Where(i => i.Type?.ToLower() == "service").ToList() ?? new List<Sales.Models.SaleItem>();

                // Get contact for geolocation data
                var contact = await _context.Contacts.FindAsync(sale.ContactId);

                string orderNumber;
                try
                {
                    orderNumber = _numberingService != null
                        ? await _numberingService.GetNextAsync("ServiceOrder")
                        : MyApi.Modules.Numbering.Services.NumberingFallback.Generate("ServiceOrder");
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Numbering service failed for ServiceOrder, using GUID fallback");
                    orderNumber = MyApi.Modules.Numbering.Services.NumberingFallback.Generate("ServiceOrder");
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
                        ? (createDto.TargetCompletionDate.Value < createDto.StartDate.Value
                            ? throw new ArgumentException("TargetCompletionDate must be on or after StartDate.")
                            : (int)(createDto.TargetCompletionDate.Value - createDto.StartDate.Value).TotalHours)
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

                    // Pre-fetch required skills from each service article so they propagate
                    // to the jobs — the dispatcher uses this for technician matching.
                    var serviceArticleIds = serviceItems
                        .Where(i => i.ArticleId.HasValue)
                        .Select(i => i.ArticleId!.Value)
                        .Distinct()
                        .ToList();
                    var articleSkillsById = new Dictionary<int, string[]>();
                    if (serviceArticleIds.Count > 0)
                    {
                        var articleRows = await _context.Articles
                            .Where(a => serviceArticleIds.Contains(a.Id) && !a.IsDeleted)
                            .Select(a => new { a.Id, a.SkillsRequired })
                            .ToListAsync();
                        foreach (var row in articleRows)
                        {
                            if (string.IsNullOrEmpty(row.SkillsRequired)) continue;
                            try
                            {
                                var parsed = System.Text.Json.JsonSerializer.Deserialize<string[]>(row.SkillsRequired);
                                if (parsed?.Length > 0) articleSkillsById[row.Id] = parsed;
                            }
                            catch { /* skip malformed JSON */ }
                        }
                    }

                    // Seed PreferredSkills on the ServiceOrder from the union of every
                    // service-article's SkillsRequired. Explicit DTO value wins if provided.
                    var seededSkills = articleSkillsById.Values
                        .SelectMany(s => s)
                        .Where(s => !string.IsNullOrWhiteSpace(s))
                        .Distinct(StringComparer.OrdinalIgnoreCase)
                        .ToArray();
                    var explicitSkills = createDto.PreferredSkills?
                        .Where(s => !string.IsNullOrWhiteSpace(s))
                        .Distinct(StringComparer.OrdinalIgnoreCase)
                        .ToArray();
                    var finalSkills = (explicitSkills?.Length > 0 ? explicitSkills : seededSkills);
                    if (finalSkills.Length > 0)
                    {
                        serviceOrder.PreferredSkills = finalSkills;
                        await _context.SaveChangesAsync();
                    }

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
                                InstallationId = int.TryParse(group.Key, out var _grpIid) ? _grpIid : (int?)null,
                                InstallationName = installationName,
                                WorkType = DetermineWorkType(items.First().ItemName),
                                EstimatedDuration = AverageDurationPerJob(
                                    createDto.StartDate, createDto.TargetCompletionDate,
                                    groupedByInstallation.Count() + orphanItems.Count()),
                                EstimatedCost = totalCost,
                                CompletionPercentage = 0,
                                AssignedTechnicianIds = createDto.AssignedTechnicianIds?.Select(id => id.ToString()).ToArray(),
                                RequiredSkills = items
                                    .Where(i => i.ArticleId.HasValue && articleSkillsById.ContainsKey(i.ArticleId.Value))
                                    .SelectMany(i => articleSkillsById[i.ArticleId!.Value])
                                    .Distinct()
                                    .ToArray() is { Length: > 0 } gs ? gs : null,
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
                                EstimatedDuration = AverageDurationPerJob(
                                    createDto.StartDate, createDto.TargetCompletionDate,
                                    groupedByInstallation.Count() + orphanItems.Count()),
                                EstimatedCost = item.LineTotal > 0 ? item.LineTotal : (item.UnitPrice * item.Quantity),
                                CompletionPercentage = 0,
                                AssignedTechnicianIds = createDto.AssignedTechnicianIds?.Select(id => id.ToString()).ToArray(),
                                RequiredSkills = item.ArticleId.HasValue && articleSkillsById.TryGetValue(item.ArticleId.Value, out var ors) ? ors : null,
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
                            InstallationId = int.TryParse(item.InstallationId, out var _sbJobIid) ? _sbJobIid : (int?)null,
                            InstallationName = item.InstallationName,
                            WorkType = DetermineWorkType(item.ItemName),
                            EstimatedDuration = AverageDurationPerJob(
                                createDto.StartDate, createDto.TargetCompletionDate, serviceItems.Count),
                            EstimatedCost = item.LineTotal > 0 ? item.LineTotal : (item.UnitPrice * item.Quantity),
                            CompletionPercentage = 0,
                            AssignedTechnicianIds = createDto.AssignedTechnicianIds?.Select(id => id.ToString()).ToArray(),
                            RequiredSkills = item.ArticleId.HasValue && articleSkillsById.TryGetValue(item.ArticleId.Value, out var sbs) ? sbs : null,
                            UpdatedAt = DateTime.UtcNow
                        }).ToList();
                    }

                    _context.ServiceOrderJobs.AddRange(jobs);
                    await _context.SaveChangesAsync();

                    // Carry planned time/expenses from sale items → service order jobs (Stage 2).
                    // A job may aggregate multiple sale items (installation-grouped); SaleItemId stores "1,2,3".
                    // Phase A (A1): copy planned entries from EVERY source sale item in the group.
                    // Previously only the first item's plans were carried through, which silently
                    // dropped 30–80% of planned budget on installation-grouped sales.
                    // CopyAsync is idempotent (see PlannedLineEntryService), so a strategy retry
                    // does not stack duplicates.
                    if (_plannedEntries == null)
                    {
                        _logger.LogError("PlannedLineEntryService is not registered — planned time/expenses will NOT propagate from sale items to service order jobs. Fix DI registration.");
                    }
                    if (_plannedEntries != null || _formDocuments != null)
                    {
                        foreach (var j in jobs)
                        {
                            if (string.IsNullOrWhiteSpace(j.SaleItemId)) continue;
                            var saleItemIds = j.SaleItemId
                                .Split(',', StringSplitOptions.RemoveEmptyEntries)
                                .Select(p => p.Trim())
                                .Select(p => int.TryParse(p, out var n) ? (int?)n : null)
                                .Where(n => n.HasValue)
                                .Select(n => n!.Value)
                                .ToList();
                            if (saleItemIds.Count == 0) continue;

                            if (_plannedEntries != null)
                            {
                                foreach (var sid in saleItemIds)
                                    await _plannedEntries.CopyAsync("sale_item", sid, "service_order_job", j.Id, userId);
                            }

                            // Checklists: copy from EVERY sale item the job aggregates, so each service
                            // article's checklist lands on the job (idempotent — only seeds an empty job).
                            if (_formDocuments != null)
                            {
                                foreach (var saleItemId in saleItemIds)
                                {
                                    await _formDocuments.CopyItemDocumentsAsync("sale_item", saleItemId, "service_order_job", j.Id, userId);
                                }
                            }
                        }
                    }

                    // Phase A: derive per-job EstimatedDuration from planned time budget
                    // (PlannedLineEntry.PlannedMinutes × TechnicianCount) instead of the
                    // start/end span ÷ job count. Fall back to AverageDurationPerJob only
                    // when the job has no planned time entries at all.
                    if (_plannedEntries != null && jobs.Count > 0)
                    {
                        var jobIds = jobs.Select(j => j.Id).ToList();
                        var plannedByJob = await _context.Set<MyApi.Modules.Planning.Models.PlannedLineEntry>()
                            .Where(p => p.ParentType == "service_order_job"
                                     && jobIds.Contains(p.ParentId)
                                     && p.Kind == "time")
                            .GroupBy(p => p.ParentId)
                            .Select(g => new { JobId = g.Key, Minutes = g.Sum(x => (x.PlannedMinutes ?? 0) * (x.TechnicianCount ?? 1)) })
                            .ToListAsync();
                        var minutesByJob = plannedByJob.ToDictionary(x => x.JobId, x => x.Minutes);
                        foreach (var j in jobs)
                        {
                            if (minutesByJob.TryGetValue(j.Id, out var m) && m > 0)
                            {
                                // EstimatedDuration is stored in hours (see AverageDurationPerJob).
                                j.EstimatedDuration = Math.Max(1, m / 60);
                            }
                        }
                        await _context.SaveChangesAsync();
                    }




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
                        EstimatedQuantity = item.Quantity,
                        UnitPrice = item.UnitPrice,
                        TotalPrice = item.LineTotal > 0 ? item.LineTotal : (item.UnitPrice * item.Quantity),
                        Status = "pending",
                        Source = "sale_conversion",
                        InstallationId = int.TryParse(item.InstallationId, out var _matIid) ? _matIid : (int?)null,
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

                await tx.CommitAsync();
                createdServiceOrderId = serviceOrder.Id;
            });

                var result = await GetServiceOrderByIdAsync(createdServiceOrderId);

                // Log to contact activity feed (best-effort; won't throw)
                if (_contactActivity != null && result != null && result.ContactId > 0)
                {
                    await _contactActivity.LogAsync(
                        contactId: result.ContactId,
                        type: MyApi.Modules.Contacts.Models.ContactActivityTypes.ServiceOrderCreated,
                        relatedEntityType: MyApi.Modules.Contacts.Models.ContactActivityEntityTypes.ServiceOrder,
                        relatedEntityId: result.Id,
                        description: $"Service order {result.OrderNumber} was created from sale #{saleId}",
                        metadata: new { number = result.OrderNumber, status = result.Status, fromSale = saleId },
                        createdBy: userId);
                }

                return result!;
            }
            catch (DbUpdateException dupEx) when (IsUniqueSaleIdViolation(dupEx))
            {
                // Concurrent race: another request already created the SO. Return it.
                _logger.LogWarning(dupEx, "Duplicate ServiceOrder creation for Sale {SaleId} caught by unique index; returning existing", saleId);
                var saleIdStr = saleId.ToString();
                var existing = await _context.ServiceOrders.AsNoTracking()
                    .FirstOrDefaultAsync(s => s.SaleId == saleIdStr && !s.IsDeleted);
                if (existing != null)
                    return (await GetServiceOrderByIdAsync(existing.Id))!;
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating service order from sale {SaleId}: {Message}", saleId, ex.Message);
                throw;
            }
        }

        private static bool IsUniqueSaleIdViolation(DbUpdateException ex)
        {
            // Npgsql throws PostgresException with SqlState 23505 for unique_violation.
            var inner = ex.InnerException;
            while (inner != null)
            {
                var sqlState = inner.GetType().GetProperty("SqlState")?.GetValue(inner) as string;
                if (sqlState == "23505")
                {
                    var msg = inner.Message ?? string.Empty;
                    if (msg.Contains("ux_serviceorders_tenant_saleid", StringComparison.OrdinalIgnoreCase)
                        || msg.Contains("SaleId", StringComparison.OrdinalIgnoreCase))
                        return true;
                }
                inner = inner.InnerException;
            }
            return false;
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
            if (updateDto.PreferredSkills != null) serviceOrder.PreferredSkills = updateDto.PreferredSkills;
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

        /// <summary>
        /// Server-side reconciliation of a service order's status from its dispatches'
        /// statuses (replaces the old client-side cascade). System-driven: it sets the
        /// status directly (no user-transition validation) and never overrides a
        /// terminal/billing status (closed/invoiced/cancelled).
        /// </summary>
        public async Task<ServiceOrderDto> RecalculateStatusFromDispatchesAsync(int id, string userId)
        {
            var serviceOrder = await _context.ServiceOrders.FindAsync(id);
            if (serviceOrder == null)
                throw new KeyNotFoundException($"Service order with ID {id} not found");

            var finalStatuses = new[] { "closed", "invoiced", "cancelled" };
            if (!finalStatuses.Contains(serviceOrder.Status))
            {
                var allDispatchStatuses = await _context.Dispatches
                    .Where(d => d.ServiceOrderId == id && !d.IsDeleted)
                    .Select(d => d.Status)
                    .ToListAsync();
                var activeDispatchStatuses = allDispatchStatuses
                    .Where(s => s != "cancelled")
                    .ToList();

                string newStatus;
                // If the SO has dispatches and every single one is cancelled, cascade
                // the cancellation up to the service order itself.
                if (allDispatchStatuses.Count > 0 && activeDispatchStatuses.Count == 0)
                    newStatus = "cancelled";
                else if (activeDispatchStatuses.Count == 0)
                    newStatus = "ready_for_planning";
                else if (activeDispatchStatuses.All(s => s == "completed"))
                    newStatus = "technically_completed";
                else if (activeDispatchStatuses.Any(s => s == "in_progress"))
                    newStatus = "in_progress";
                else
                    newStatus = "scheduled";

                if (newStatus != serviceOrder.Status)
                {
                    serviceOrder.Status = newStatus;
                    serviceOrder.ModifiedBy = userId;
                    serviceOrder.ModifiedDate = DateTime.UtcNow;
                    if (newStatus == "in_progress" && !serviceOrder.ActualStartDate.HasValue)
                        serviceOrder.ActualStartDate = DateTime.UtcNow;
                    await _context.SaveChangesAsync();
                }
            }

            var result = await GetServiceOrderByIdAsync(id);
            return result!;
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

            // Log status change to the contact activity feed
            if (_contactActivity != null && serviceOrder.ContactId > 0 && oldStatus != statusDto.Status)
            {
                await _contactActivity.LogAsync(
                    contactId: serviceOrder.ContactId,
                    type: MyApi.Modules.Contacts.Models.ContactActivityTypes.ServiceOrderStatusChanged,
                    relatedEntityType: MyApi.Modules.Contacts.Models.ContactActivityEntityTypes.ServiceOrder,
                    relatedEntityId: serviceOrder.Id,
                    description: $"Service order {serviceOrder.OrderNumber} status: {oldStatus} → {statusDto.Status}",
                    metadata: new { number = serviceOrder.OrderNumber, oldStatus, status = statusDto.Status },
                    createdBy: userId);
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
                serviceOrder.InvoiceNumber = MyApi.Modules.Numbering.Services.NumberingFallback.Generate("Invoice");
                serviceOrder.InvoiceDate = DateTime.UtcNow;
            }

            serviceOrder.ModifiedBy = userId;
            serviceOrder.ModifiedDate = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            // Shadow Sale: when a "direct" order completes and has no parent
            // Sale yet, generate one so downstream invoicing / reporting work
            // unchanged. Idempotent — no-op if already linked.
            if (string.Equals(serviceOrder.Origin, "direct", StringComparison.OrdinalIgnoreCase)
                && !serviceOrder.AutoGeneratedSaleId.HasValue)
            {
                try
                {
                    await EnsureShadowSaleAsync(serviceOrder, userId);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to generate shadow Sale for direct ServiceOrder {Id}; order is marked completed but no Sale exists yet", serviceOrder.Id);
                    // Do not fail the completion — the order is still completed.
                    // A retry endpoint or manual repair can recover.
                }
            }

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
                PreferredSkills = serviceOrder.PreferredSkills,
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
                    InstallationId = j.InstallationId?.ToString(),
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
                    EstimatedQuantity = m.EstimatedQuantity ?? m.Quantity,
                    UnitPrice = m.UnitPrice,
                    TotalPrice = m.TotalPrice,
                    Status = m.Status,
                    Source = m.Source,
                    InternalComment = m.InternalComment,
                    ExternalComment = m.ExternalComment,
                    Replacing = m.Replacing,
                    OldArticleModel = m.OldArticleModel,
                    OldArticleStatus = m.OldArticleStatus,
                    InstallationId = m.InstallationId?.ToString(),
                    InstallationName = m.InstallationName,
                    CreatedBy = m.CreatedBy,
                    CreatedAt = m.CreatedAt
                }).ToList(),
                TechnicallyCompletedAt = serviceOrder.TechnicallyCompletedAt,
                ServiceCount = serviceOrder.ServiceCount,
                CompletedDispatchCount = serviceOrder.CompletedDispatchCount,
                Origin = string.IsNullOrEmpty(serviceOrder.Origin) ? "from_sale" : serviceOrder.Origin,
                AutoGeneratedSaleId = serviceOrder.AutoGeneratedSaleId,
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

        /// <summary>
        /// Resolve every dispatch attributable to a service order through the same THREE paths used by the
        /// invoice summary, so downstream reads (materials, expenses, time, notes, dispatches list) and the
        /// invoice transfer all agree on the same set of dispatches:
        ///   (a) Dispatch.ServiceOrderId points at us (installation / whole-SO dispatches).
        ///   (b) DispatchJobs join table links to one of our jobs (multi-job dispatches).
        ///   (c) Legacy: Dispatch.JobId string equals one of our job ids (old single-job dispatches).
        ///   (d) Dispatch.InstallationId matches an installation on our jobs.
        /// Soft-deleted dispatches (and soft-deleted join rows) are always excluded.
        /// </summary>
        private async Task<List<int>> ResolveLinkedDispatchIdsAsync(ServiceOrder serviceOrder)
        {
            var jobIds = serviceOrder.Jobs?.Select(j => j.Id).ToList() ?? new List<int>();
            var installationIds = serviceOrder.Jobs?
                .Where(j => j.InstallationId.HasValue)
                .Select(j => j.InstallationId!.Value)
                .Distinct()
                .ToList() ?? new List<int>();
            var jobIdStrings = jobIds.Select(j => j.ToString()).ToList();

            var dispatchIdsViaJoin = await _context.Set<DispatchJob>()
                .Where(dj => !dj.IsDeleted && jobIds.Contains(dj.JobId))
                .Select(dj => dj.DispatchId)
                .Distinct()
                .ToListAsync();

            return await _context.Dispatches
                .Where(d => !d.IsDeleted && (
                       d.ServiceOrderId == serviceOrder.Id
                    || dispatchIdsViaJoin.Contains(d.Id)
                    || (d.JobId != null && jobIdStrings.Contains(d.JobId))
                    || (d.InstallationId.HasValue && installationIds.Contains(d.InstallationId.Value))
                ))
                .Select(d => d.Id)
                .Distinct()
                .ToListAsync();
        }

        // ============== AGGREGATION METHODS ==============

        public async Task<List<DispatchDto>> GetDispatchesForServiceOrderAsync(int serviceOrderId)
        {
            var serviceOrder = await _context.ServiceOrders
                .Include(so => so.Jobs)
                .FirstOrDefaultAsync(so => so.Id == serviceOrderId);
            
            if (serviceOrder == null)
                throw new KeyNotFoundException($"Service order with ID {serviceOrderId} not found");

            var linkedDispatchIds = await ResolveLinkedDispatchIdsAsync(serviceOrder);

            // Include AssignedTechnicians to properly populate technician data
            var dispatches = await _context.Dispatches
                .Where(d => linkedDispatchIds.Contains(d.Id))
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

            // 2. Get time entries from dispatches (installation / multi-job / legacy paths)
            var dispatchIds = await ResolveLinkedDispatchIdsAsync(serviceOrder);

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

            // 2. Get expenses from dispatches (installation / multi-job / legacy paths)
            var dispatchIds = await ResolveLinkedDispatchIdsAsync(serviceOrder);

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
                // Expose the real persisted currency (nullable). Callers that need to
                // compare against sale.Currency should treat null as "sale currency".
                Currency = e.Currency,
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
                EstimatedQuantity = m.EstimatedQuantity ?? m.Quantity,
                UnitPrice = m.UnitPrice,
                TotalPrice = m.TotalPrice,
                Status = m.Status,
                Source = m.Source,
                InternalComment = m.InternalComment,
                ExternalComment = m.ExternalComment,
                Replacing = m.Replacing,
                OldArticleModel = m.OldArticleModel,
                OldArticleStatus = m.OldArticleStatus,
                InstallationId = m.InstallationId?.ToString(),
                InstallationName = m.InstallationName,
                CreatedBy = m.CreatedBy,
                CreatedAt = m.CreatedAt,
                InvoiceStatus = m.InvoiceStatus,
                SourceTable = "service_order"
            }));

            // 2. Get materials from dispatches (installation / multi-job / legacy paths)
            var dispatchIds = await ResolveLinkedDispatchIdsAsync(serviceOrder);

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

            // Also get notes from dispatches (installation / multi-job / legacy paths, soft-delete aware)
            var dispatchIds = await ResolveLinkedDispatchIdsAsync(serviceOrder);

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

            var jobIds = serviceOrder.Jobs?.Select(j => j.Id).ToList() ?? new List<int>();
            var installationIds = serviceOrder.Jobs?
                .Where(j => j.InstallationId.HasValue)
                .Select(j => j.InstallationId!.Value)
                .Distinct()
                .ToList() ?? new List<int>();

            // Resolve dispatches attributable to this SO through THREE paths (any one match):
            //   (a) Dispatch.ServiceOrderId points at us (installation / whole-SO dispatches).
            //   (b) DispatchJobs join table links to one of our jobs (multi-job dispatches).
            //   (c) Legacy: Dispatch.JobId string equals one of our job ids (old single-job dispatches).
            // Always exclude soft-deleted dispatches so rollups don't double-count.
            var jobIdStrings = jobIds.Select(j => j.ToString()).ToList();
            var dispatchIdsViaJoin = await _context.Set<DispatchJob>()
                .Where(dj => !dj.IsDeleted && jobIds.Contains(dj.JobId))
                .Select(dj => dj.DispatchId)
                .Distinct()
                .ToListAsync();

            var dispatches = await _context.Dispatches
                .Where(d => !d.IsDeleted && (
                       d.ServiceOrderId == serviceOrderId
                    || dispatchIdsViaJoin.Contains(d.Id)
                    || (d.JobId != null && jobIdStrings.Contains(d.JobId))
                    || (d.InstallationId.HasValue && installationIds.Contains(d.InstallationId.Value))
                ))
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

            // Build dispatch summaries. JobId can come from legacy string, DispatchJobs join, or 0 for whole-SO/installation dispatches.
            var dispatchJobLinks = await _context.Set<DispatchJob>()
                .Where(dj => !dj.IsDeleted && dispatchIds.Contains(dj.DispatchId))
                .Select(dj => new { dj.DispatchId, dj.JobId })
                .ToListAsync();
            var jobLinkByDispatch = dispatchJobLinks
                .GroupBy(x => x.DispatchId)
                .ToDictionary(g => g.Key, g => g.Select(x => x.JobId).FirstOrDefault());

            var dispatchSummaries = dispatches.Select(d => new DispatchSummaryDto
            {
                Id = d.Id,
                JobId = int.TryParse(d.JobId, out var jid) ? jid : jobLinkByDispatch.GetValueOrDefault(d.Id, 0),
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
                EstimatedQuantity = dto.EstimatedQuantity ?? dto.Quantity,
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
                EstimatedQuantity = material.EstimatedQuantity ?? material.Quantity,
                UnitPrice = material.UnitPrice,
                TotalPrice = material.TotalPrice,
                Status = material.Status,
                Source = material.Source,
                InternalComment = material.InternalComment,
                ExternalComment = material.ExternalComment,
                Replacing = material.Replacing,
                OldArticleModel = material.OldArticleModel,
                OldArticleStatus = material.OldArticleStatus,
                InstallationId = material.InstallationId?.ToString(),
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
            if (dto.EstimatedQuantity.HasValue) material.EstimatedQuantity = dto.EstimatedQuantity.Value;
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
                EstimatedQuantity = material.EstimatedQuantity ?? material.Quantity,
                UnitPrice = material.UnitPrice,
                TotalPrice = material.TotalPrice,
                Status = material.Status,
                Source = material.Source,
                InternalComment = material.InternalComment,
                ExternalComment = material.ExternalComment,
                Replacing = material.Replacing,
                OldArticleModel = material.OldArticleModel,
                OldArticleStatus = material.OldArticleStatus,
                InstallationId = material.InstallationId?.ToString(),
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

        public async Task<ServiceOrderJobDto> CreateServiceOrderJobAsync(int serviceOrderId, CreateServiceOrderJobDto dto, string userId)
        {
            if (dto == null) throw new ArgumentNullException(nameof(dto));
            if (string.IsNullOrWhiteSpace(dto.Title))
                throw new ArgumentException("Title is required", nameof(dto));

            var serviceOrder = await _context.ServiceOrders.FirstOrDefaultAsync(so => so.Id == serviceOrderId);
            if (serviceOrder == null)
                throw new KeyNotFoundException($"Service order with ID {serviceOrderId} not found");

            var job = new ServiceOrderJob
            {
                ServiceOrderId = serviceOrderId,
                Title = dto.Title.Trim(),
                Description = dto.Description,
                JobDescription = dto.JobDescription,
                Status = string.IsNullOrWhiteSpace(dto.Status) ? "unscheduled" : dto.Status,
                Priority = dto.Priority ?? "medium",
                WorkType = dto.WorkType,
                EstimatedDuration = dto.EstimatedDuration,
                EstimatedCost = dto.EstimatedCost ?? 0,
                InstallationId = dto.InstallationId,
                InstallationName = dto.InstallationName,
                Notes = dto.Notes,
                AssignedTechnicianIds = dto.AssignedTechnicianIds,
                RequiredSkills = dto.RequiredSkills,
                CompletionPercentage = 0,
                ActualCost = 0,
                UpdatedAt = DateTime.UtcNow,
            };

            _context.ServiceOrderJobs.Add(job);
            await _context.SaveChangesAsync();

            _logger.LogInformation(
                "[SO-JOB-CREATE] Job {JobId} added to service order {ServiceOrderId} by {UserId}",
                job.Id, serviceOrderId, userId);

            return MapServiceOrderJobToDto(job, null);
        }

        public async Task<ServiceOrderJobDto> PatchServiceOrderJobStatusAsync(int serviceOrderId, int jobId, UpdateServiceOrderJobStatusDto dto, string userId)
        {
            var job = await _context.ServiceOrderJobs.FirstOrDefaultAsync(j => j.Id == jobId && j.ServiceOrderId == serviceOrderId);
            if (job == null)
                throw new KeyNotFoundException($"Job {jobId} not found for service order {serviceOrderId}");
            var oldStatus = job.Status;
            job.Status = dto.Status;
            job.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            _logger.LogInformation("Job {JobId} status set to {Status} on service order {ServiceOrderId} by {UserId}", jobId, dto.Status, serviceOrderId, userId);

            // Fire workflow trigger for job status change
            if (_workflowTriggerService != null && oldStatus != job.Status)
            {
                try
                {
                    await _workflowTriggerService.TriggerStatusChangeAsync(
                        "job",
                        jobId,
                        oldStatus,
                        job.Status,
                        userId,
                        new { jobId, serviceOrderId, title = job.Title });
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to fire job workflow trigger for job {JobId}", jobId);
                }
            }
            return MapServiceOrderJobToDto(job, null);
        }

        public async Task<ServiceOrderJobDto> UpdateServiceOrderJobAsync(int serviceOrderId, int jobId, UpdateServiceOrderJobDto dto, string userId)
        {
            var job = await _context.ServiceOrderJobs.FirstOrDefaultAsync(j => j.Id == jobId && j.ServiceOrderId == serviceOrderId);
            if (job == null)
                throw new KeyNotFoundException($"Job {jobId} not found for service order {serviceOrderId}");
            var oldStatus = job.Status;
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

            if (_workflowTriggerService != null && dto.Status != null && oldStatus != job.Status)
            {
                try
                {
                    await _workflowTriggerService.TriggerStatusChangeAsync(
                        "job",
                        jobId,
                        oldStatus,
                        job.Status,
                        userId,
                        new { jobId, serviceOrderId, title = job.Title });
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to fire job workflow trigger for job {JobId}", jobId);
                }
            }
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
                InstallationId = j.InstallationId?.ToString(),
                WorkType = j.WorkType,
                EstimatedDuration = j.EstimatedDuration,
                EstimatedCost = j.EstimatedCost,
                CompletionPercentage = j.CompletionPercentage,
                AssignedTechnicianIds = j.AssignedTechnicianIds,
                RequiredSkills = j.RequiredSkills,
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

            // Accept every status that means "field work is done, billing can start":
            //  - technically_completed : all dispatches completed (BusinessWorkflowService)
            //  - partially_completed   : some dispatches completed (BusinessWorkflowService, line 836)
            //  - completed             : ApproveAsync / CompleteAsync final-completion paths
            //  - ready_for_invoice     : retry / add-more-items after a previous transfer
            // The FE normalizes partially_completed and completed to "ready_for_invoice"
            // for display, so refusing them here surfaced a confusing error on the exact
            // click the UI was inviting.
            var invoiceableStatuses = new[] { "technically_completed", "partially_completed", "completed", "ready_for_invoice" };
            if (!invoiceableStatuses.Contains(serviceOrder.Status))
                throw new InvalidOperationException(
                    $"Service order status '{serviceOrder.Status}' is not eligible for invoice preparation. " +
                    "Expected one of: technically_completed, partially_completed, completed, ready_for_invoice.");

            if (string.IsNullOrEmpty(serviceOrder.SaleId) || !int.TryParse(serviceOrder.SaleId, out int saleId))
                throw new InvalidOperationException("Service order must be linked to a sale to prepare for invoice");

            var sale = await _context.Sales.Include(s => s.Items).FirstOrDefaultAsync(s => s.Id == saleId);
            if (sale == null)
                throw new KeyNotFoundException($"Linked sale with ID {saleId} not found");

            _logger.LogInformation("PrepareForInvoice: SO={Id}, SaleId={SaleId}, current sale items={Count}", id, saleId, sale.Items?.Count ?? 0);

            // Resolve linked dispatches through installation / multi-job / legacy paths, soft-delete aware.
            // Using the same helper as GetInvoiceSummary keeps the two views strictly in sync.
            var linkedDispatchIds = await ResolveLinkedDispatchIdsAsync(serviceOrder);

            // Idempotency for dispatch-sourced lines: DispatchMaterials / DispatchExpenses / dispatch TimeEntries
            // do NOT carry an InvoiceStatus column, so we can't flip a per-row flag like we do for
            // SO-sourced entities. Instead we build a signature set from existing SaleItems already
            // tagged with this ServiceOrderId and silently skip any incoming dispatch row that would
            // produce the same signature. This lets the user re-open "Prepare for invoice" freely
            // to push newly-added dispatch items to the sale without being blocked, and without
            // double-billing rows that were transferred in a previous run.
            var existingSoSaleItems = (sale.Items ?? new List<Sales.Models.SaleItem>())
                .Where(si => si.ServiceOrderId == id.ToString())
                .ToList();

            static string BuildSaleItemSignature(string? type, string? itemName, string? description, decimal unitPrice, decimal quantity)
                => string.Join("|",
                    (type ?? "").Trim().ToLowerInvariant(),
                    (itemName ?? "").Trim().ToLowerInvariant(),
                    (description ?? "").Trim().ToLowerInvariant(),
                    Math.Round(unitPrice, 4).ToString(System.Globalization.CultureInfo.InvariantCulture),
                    Math.Round(quantity, 4).ToString(System.Globalization.CultureInfo.InvariantCulture));

            var existingSignatures = new HashSet<string>(
                existingSoSaleItems.Select(si => BuildSaleItemSignature(si.Type, si.ItemName, si.Description, si.UnitPrice, si.Quantity)));

            var previouslyTransferred = existingSoSaleItems.Any();


            // Currency guard: every SaleItem inherits `Sale.Currency` at write time (see below),
            // so we refuse to transfer any currency-carrying source row whose declared currency
            // differs from the sale to avoid silently billing e.g. a USD expense as if it were TND.
            // Rows with a null/empty Currency are trusted as "sale currency" (legacy + rows on
            // models that don't carry a currency column, like materials/time entries).
            var saleCurrency = (sale.Currency ?? "").Trim().ToUpperInvariant();
            var mismatches = new List<string>();

            if (dto.ExpenseIds?.Any() == true)
            {
                var soMismatched = await _context.ServiceOrderExpenses
                    .Where(e => dto.ExpenseIds.Contains(e.Id) && e.ServiceOrderId == id
                        && e.InvoiceStatus == null
                        && e.Currency != null && e.Currency != ""
                        && e.Currency.ToUpper() != saleCurrency)
                    .Select(e => new { e.Id, e.Currency })
                    .ToListAsync();
                mismatches.AddRange(soMismatched.Select(m => $"SO expense #{m.Id} ({m.Currency})"));
            }

            if (dto.DispatchExpenseIds?.Any() == true)
            {
                // Dispatch expenses may carry an explicit Currency now (post-migration). Legacy
                // rows without a currency default to null → treated as sale currency (no mismatch).
                var dispatchMismatched = await _context.DispatchExpenses
                    .Where(e => dto.DispatchExpenseIds.Contains(e.Id)
                        && linkedDispatchIds.Contains(e.DispatchId)
                        && e.Currency != null && e.Currency != ""
                        && e.Currency!.ToUpper() != saleCurrency)
                    .Select(e => new { e.Id, e.Currency })
                    .ToListAsync();
                mismatches.AddRange(dispatchMismatched.Select(m => $"Dispatch expense #{m.Id} ({m.Currency})"));
            }

            if (mismatches.Any())
            {
                throw new InvalidOperationException(
                    $"Currency mismatch: {mismatches.Count} line(s) are not in the sale's currency ({sale.Currency}). " +
                    $"Convert them before transferring. Offending items: {string.Join(", ", mismatches)}.");
            }

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
                        // Idempotency: only pick up rows that have NEVER been transferred.
                        // A row marked "selected_for_invoice" is already on the sale.
                        && m.InvoiceStatus == null)
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
                        InstallationId = mat.InstallationId?.ToString(),
                        InstallationName = mat.InstallationName,
                        ServiceOrderId = id.ToString(),
                        DisplayOrder = currentDisplayOrder,
                        Currency = sale.Currency
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
                    var name = mat.Description ?? $"Material #{mat.Id}";
                    var desc = mat.Description ?? "Material from dispatch";
                    var signature = BuildSaleItemSignature("article", name, desc, mat.UnitPrice, mat.Quantity);
                    if (!existingSignatures.Add(signature))
                    {
                        _logger.LogInformation("PrepareForInvoice: Skipping duplicate dispatch material #{Id} (already on sale)", mat.Id);
                        continue;
                    }

                    currentDisplayOrder++;
                    newSaleItems.Add(new Sales.Models.SaleItem
                    {
                        SaleId = saleId,
                        Type = "article",
                        ItemName = name,
                        Description = desc,
                        Quantity = mat.Quantity,
                        UnitPrice = mat.UnitPrice,
                        LineTotal = mat.TotalPrice,
                        ArticleId = mat.ArticleId,
                        ServiceOrderId = id.ToString(),
                        DisplayOrder = currentDisplayOrder,
                        Currency = sale.Currency
                    });
                }
            }


            // ===== EXPENSES FROM ServiceOrderExpenses =====
            if (dto.ExpenseIds != null && dto.ExpenseIds.Any())
            {
                var soExpenses = await _context.ServiceOrderExpenses
                    .Where(e => dto.ExpenseIds.Contains(e.Id) && e.ServiceOrderId == id
                        && e.InvoiceStatus == null)
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
                        DisplayOrder = currentDisplayOrder,
                        Currency = sale.Currency
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
                    var name = $"Expense: {dExp.ExpenseType}";
                    var desc = dExp.Description ?? $"Expense - {dExp.ExpenseType}";
                    var signature = BuildSaleItemSignature("service", name, desc, dExp.Amount, 1m);
                    if (!existingSignatures.Add(signature))
                    {
                        _logger.LogInformation("PrepareForInvoice: Skipping duplicate dispatch expense #{Id} (already on sale)", dExp.Id);
                        continue;
                    }

                    currentDisplayOrder++;
                    newSaleItems.Add(new Sales.Models.SaleItem
                    {
                        SaleId = saleId,
                        Type = "service",
                        ItemName = name,
                        Description = desc,
                        Quantity = 1,
                        UnitPrice = dExp.Amount,
                        LineTotal = dExp.Amount,
                        ServiceOrderId = id.ToString(),
                        DisplayOrder = currentDisplayOrder,
                        Currency = sale.Currency
                    });
                }
            }


            // ===== TIME ENTRIES FROM ServiceOrderTimeEntries =====
            if (dto.TimeEntryIds != null && dto.TimeEntryIds.Any())
            {
                var timeEntries = await _context.ServiceOrderTimeEntries
                    .Where(t => dto.TimeEntryIds.Contains(t.Id) && t.ServiceOrderId == id && t.Billable
                        && t.InvoiceStatus == null)
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
                        DisplayOrder = currentDisplayOrder,
                        Currency = sale.Currency
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

                // Dispatch TimeEntries have no HourlyRate column. To avoid billing labor at $0 whenever a
                // technician logs time through the field app, fall back to the most recent HourlyRate the
                // same technician used on ServiceOrderTimeEntries. If none exists, we still record the line
                // (so the user sees the work) but flag it in the description for manual pricing.
                var technicianIdStrings = dispatchTimeEntries
                    .Select(t => t.TechnicianId.ToString())
                    .Distinct()
                    .ToList();
                var fallbackRates = await _context.ServiceOrderTimeEntries
                    .Where(t => t.TechnicianId != null && technicianIdStrings.Contains(t.TechnicianId) && t.HourlyRate != null)
                    .GroupBy(t => t.TechnicianId!)
                    .Select(g => new { TechnicianId = g.Key, Rate = g.OrderByDescending(x => x.CreatedAt).First().HourlyRate })
                    .ToDictionaryAsync(x => x.TechnicianId, x => x.Rate ?? 0m);

                foreach (var te in dispatchTimeEntries)
                {
                    var duration = te.Duration ?? 0;
                    var hours = duration / 60.0m;
                    var rate = fallbackRates.TryGetValue(te.TechnicianId.ToString(), out var r) ? r : 0m;
                    var total = hours * rate;
                    var needsPricing = rate == 0m && duration > 0;

                    var description = te.Description ?? $"Time entry - {te.WorkType ?? "work"} ({duration} min)";
                    if (needsPricing)
                    {
                        description += " [rate not set - edit before invoicing]";
                        _logger.LogWarning(
                            "PrepareForInvoice: Dispatch time entry {TeId} for technician {Tech} has no available hourly rate; line added at 0.",
                            te.Id, te.TechnicianId);
                    }

                    var name = $"Labor: {te.WorkType ?? "work"}";
                    var signature = BuildSaleItemSignature("service", name, description, total, 1m);
                    if (!existingSignatures.Add(signature))
                    {
                        _logger.LogInformation("PrepareForInvoice: Skipping duplicate dispatch time entry #{Id} (already on sale)", te.Id);
                        continue;
                    }

                    currentDisplayOrder++;
                    newSaleItems.Add(new Sales.Models.SaleItem
                    {
                        SaleId = saleId,
                        Type = "service",
                        ItemName = name,
                        Description = description,
                        Quantity = 1,
                        UnitPrice = total,
                        LineTotal = total,
                        ServiceOrderId = id.ToString(),
                        DisplayOrder = currentDisplayOrder,
                        Currency = sale.Currency
                    });
                }
            }


            _logger.LogInformation("PrepareForInvoice: Total new sale items to add: {Count}", newSaleItems.Count);

            // Check that at least something was found if IDs were requested
            var hasRequestedIds = (dto.MaterialIds?.Any() == true) || (dto.ExpenseIds?.Any() == true) || (dto.TimeEntryIds?.Any() == true)
                || (dto.DispatchMaterialIds?.Any() == true) || (dto.DispatchExpenseIds?.Any() == true) || (dto.DispatchTimeEntryIds?.Any() == true);

            if (hasRequestedIds && !newSaleItems.Any())
            {
                // Nothing new to add. If a prior run already transferred everything the caller re-selected,
                // treat this as a successful no-op (the SO status is still (re)promoted below) so the UI
                // is never blocked when the user re-opens "Prepare for invoice" without adding new items.
                if (previouslyTransferred)
                {
                    _logger.LogInformation(
                        "PrepareForInvoice: SO {Id} - all requested items were already on sale {SaleId}; no-op, status will still be advanced.",
                        id, saleId);
                }
                else
                {
                    throw new InvalidOperationException(
                        "Items were requested for transfer but none could be found or matched. " +
                        "Check that the IDs exist and belong to this service order.");
                }
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

            // Phase B: snapshot the sale into a draft invoice on the ledger.
            // Best-effort — a failure here must not undo the transfer above.
            if (_invoiceService != null)
            {
                try
                {
                    await _invoiceService.CreateDraftFromSaleAsync(saleId, userId, id);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "PrepareForInvoice: draft invoice creation failed for SO {Id} / Sale {SaleId}", id, saleId);
                }
            }

            return (await GetServiceOrderByIdAsync(id))!;
        }
    }
}

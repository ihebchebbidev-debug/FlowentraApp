using MyApi.Modules.Dispatches.DTOs;

namespace MyApi.Modules.ServiceOrders.DTOs
{
    public class ServiceOrderDto
    {
        public int Id { get; set; }
        public string OrderNumber { get; set; } = string.Empty;
        public string? SaleId { get; set; }
        public string? SaleNumber { get; set; }
        public string? OfferId { get; set; }
        public int? ProjectId { get; set; }
        public int ContactId { get; set; }
        public string Status { get; set; } = "draft";
        public string? Priority { get; set; }
        public string? Description { get; set; }
        public string? Notes { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? TargetCompletionDate { get; set; }
        public DateTime? ActualStartDate { get; set; }
        public DateTime? ActualCompletionDate { get; set; }
        public int? EstimatedDuration { get; set; }
        public int? ActualDuration { get; set; }
        public decimal? EstimatedCost { get; set; }
        public decimal? ActualCost { get; set; }
        public decimal? Discount { get; set; }
        public decimal? DiscountPercentage { get; set; }
        public decimal? Tax { get; set; }
        public decimal? TotalAmount { get; set; }
        public string? PaymentStatus { get; set; }
        public string? PaymentTerms { get; set; }
        public string? InvoiceNumber { get; set; }
        public DateTime? InvoiceDate { get; set; }
        public int? CompletionPercentage { get; set; }
        public bool RequiresApproval { get; set; }
        public string? ApprovedBy { get; set; }
        public DateTime? ApprovalDate { get; set; }
        public string[]? Tags { get; set; }
        public object? CustomFields { get; set; }
        public string CreatedBy { get; set; } = string.Empty;
        public string? CreatedByName { get; set; }
        public DateTime CreatedAt { get; set; }
        public string? UpdatedBy { get; set; }
        public DateTime UpdatedAt { get; set; }
        public List<ServiceOrderJobDto>? Jobs { get; set; }
        public List<ServiceOrderMaterialDto>? Materials { get; set; }
        public ContactSummaryDto? Contact { get; set; }
        
        // Helper columns for workflow/dispatch tracking
        public DateTime? TechnicallyCompletedAt { get; set; }
        public int ServiceCount { get; set; }
        public int CompletedDispatchCount { get; set; }
    }

    public class ServiceOrderMaterialDto
    {
        public int Id { get; set; }
        public int ServiceOrderId { get; set; }
        public int? SaleItemId { get; set; }
        public int? ArticleId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Sku { get; set; }
        public string? Description { get; set; }
        public decimal Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal TotalPrice { get; set; }
        public string Status { get; set; } = "pending";
        public string Source { get; set; } = "sale_conversion";
        public string? InternalComment { get; set; }
        public string? ExternalComment { get; set; }
        public bool Replacing { get; set; }
        public string? OldArticleModel { get; set; }
        public string? OldArticleStatus { get; set; }
        public string? InstallationId { get; set; }
        public string? InstallationName { get; set; }
        public string? CreatedBy { get; set; }
        public DateTime CreatedAt { get; set; }
        public string? InvoiceStatus { get; set; }
        public string? Unit { get; set; }
    }

    public class CreateServiceOrderMaterialDto
    {
        public int? ArticleId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Sku { get; set; }
        public string? Description { get; set; }
        public decimal Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public string? InternalComment { get; set; }
        public string? ExternalComment { get; set; }
        public bool Replacing { get; set; }
        public string? OldArticleModel { get; set; }
        public string? OldArticleStatus { get; set; }
        public string? Unit { get; set; }
    }

    public class UpdateServiceOrderMaterialDto
    {
        public string? Name { get; set; }
        public string? Sku { get; set; }
        public string? Description { get; set; }
        public decimal? Quantity { get; set; }
        public decimal? UnitPrice { get; set; }
        public string? InternalComment { get; set; }
        public string? ExternalComment { get; set; }
        public bool? Replacing { get; set; }
        public string? OldArticleModel { get; set; }
        public string? OldArticleStatus { get; set; }
        public string? Status { get; set; }
        public string? Unit { get; set; }
    }

    public class ServiceOrderTimeEntryDto
    {
        public int Id { get; set; }
        public int ServiceOrderId { get; set; }
        public string? TechnicianId { get; set; }
        public string WorkType { get; set; } = "work";
        public DateTime StartTime { get; set; }
        public DateTime? EndTime { get; set; }
        public int Duration { get; set; }
        public string? Description { get; set; }
        public bool Billable { get; set; }
        public decimal? HourlyRate { get; set; }
        public decimal? TotalCost { get; set; }
        public string Status { get; set; } = "pending";
        public string Source { get; set; } = "service_order";
        public DateTime CreatedAt { get; set; }
        public string? InvoiceStatus { get; set; }
    }

    public class CreateServiceOrderTimeEntryDto
    {
        public string? TechnicianId { get; set; }
        public string WorkType { get; set; } = "work";
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
        public string? Description { get; set; }
        public bool Billable { get; set; } = true;
        public decimal? HourlyRate { get; set; }
    }

    public class ServiceOrderExpenseDto
    {
        public int Id { get; set; }
        public int ServiceOrderId { get; set; }
        public string? TechnicianId { get; set; }
        public string Type { get; set; } = "other";
        public decimal Amount { get; set; }
        public string Currency { get; set; } = "TND";
        public string? Description { get; set; }
        public DateTime? Date { get; set; }
        public string Status { get; set; } = "pending";
        public string Source { get; set; } = "service_order";
        public DateTime CreatedAt { get; set; }
        public string? InvoiceStatus { get; set; }
    }

    public class CreateServiceOrderExpenseDto
    {
        public string? TechnicianId { get; set; }
        public string Type { get; set; } = "other";
        public decimal Amount { get; set; }
        public string Currency { get; set; } = "TND";
        public string? Description { get; set; }
        public DateTime? Date { get; set; }
    }

    public class ServiceOrderJobDto
    {
        public int Id { get; set; }
        public int ServiceOrderId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string Status { get; set; } = "unscheduled";
        public string? InstallationId { get; set; }
        public string? WorkType { get; set; }
        public int? EstimatedDuration { get; set; }
        public decimal? EstimatedCost { get; set; }
        public int? CompletionPercentage { get; set; }
        public string[]? AssignedTechnicianIds { get; set; }
        public List<UserLightDto>? AssignedTechnicians { get; set; }
    }

    /// <summary>Body for PATCH /api/service-orders/{soId}/jobs/{jobId}/status</summary>
    public class UpdateServiceOrderJobStatusDto
    {
        public string Status { get; set; } = string.Empty;
    }

    /// <summary>Body for PUT /api/service-orders/{soId}/jobs/{jobId}</summary>
    public class UpdateServiceOrderJobDto
    {
        public string? Status { get; set; }
        public string? Title { get; set; }
        public string? Description { get; set; }
        public string? WorkType { get; set; }
        public int? EstimatedDuration { get; set; }
        public decimal? EstimatedCost { get; set; }
        public int? CompletionPercentage { get; set; }
        public string[]? AssignedTechnicianIds { get; set; }
    }

    public class CreateServiceOrderDto
    {
        public int? ProjectId { get; set; }
        public int[]? InstallationIds { get; set; }
        public int[]? AssignedTechnicianIds { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? TargetCompletionDate { get; set; }
        public string? Priority { get; set; }
        public string? Notes { get; set; }
        public bool RequiresApproval { get; set; }
        public string[]? Tags { get; set; }
        public object? CustomFields { get; set; }

        /// <summary>
        /// Optional override for job conversion mode: "installation" or "service".
        /// If null, the system setting from AppSettings table is used.
        /// </summary>
        public string? JobConversionMode { get; set; }
    }

    public class UpdateServiceOrderDto
    {
        public int? ProjectId { get; set; }
        public string? Status { get; set; }
        public string? Priority { get; set; }
        public string? Description { get; set; }
        public string? Notes { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? TargetCompletionDate { get; set; }
        public int? EstimatedDuration { get; set; }
        public decimal? Discount { get; set; }
        public decimal? DiscountPercentage { get; set; }
        public string? PaymentTerms { get; set; }
        public bool? RequiresApproval { get; set; }
        public string[]? Tags { get; set; }
        public object? CustomFields { get; set; }
    }

    public class UpdateServiceOrderStatusDto
    {
        public string Status { get; set; } = string.Empty;
        public string? Reason { get; set; }
    }

    public class ApproveServiceOrderDto
    {
        public string? ApprovalNotes { get; set; }
        public DateTime? ApprovalDate { get; set; }
    }

    public class CompleteServiceOrderDto
    {
        public string? CompletionNotes { get; set; }
        public bool GenerateInvoice { get; set; }
        public string? InvoiceNotes { get; set; }
    }

    public class CancelServiceOrderDto
    {
        public string? CancellationReason { get; set; }
        public string? CancellationNotes { get; set; }
    }

    public class ServiceOrderStatsDto
    {
        public int TotalServiceOrders { get; set; }
        public Dictionary<string, int> ByStatus { get; set; } = new();
        public Dictionary<string, int> ByPriority { get; set; } = new();
        public FinancialStatsDto Financials { get; set; } = new();
        public double AverageCompletionTime { get; set; }
        public double CompletionRate { get; set; }
        public double OnTimeCompletionRate { get; set; }
    }

    public class FinancialStatsDto
    {
        public decimal TotalEstimatedCost { get; set; }
        public decimal TotalActualCost { get; set; }
        public decimal TotalDiscount { get; set; }
        public decimal TotalTax { get; set; }
        public decimal TotalBilled { get; set; }
        public decimal TotalPaid { get; set; }
        public decimal TotalPending { get; set; }
    }

    public class PaginatedServiceOrderResponse
    {
        public List<ServiceOrderDto> ServiceOrders { get; set; } = new();
        public PaginationInfo Pagination { get; set; } = new();
    }

    public class PaginationInfo
    {
        public int Page { get; set; }
        public int Limit { get; set; }
        public int Total { get; set; }
        public int TotalPages { get; set; }
    }

    public class ContactSummaryDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Company { get; set; }
        public string? Email { get; set; }
        public string? Phone { get; set; }
        public string? Address { get; set; }
        public string? City { get; set; }
        
        // Geolocation fields
        public decimal? Latitude { get; set; }
        public decimal? Longitude { get; set; }
        public int HasLocation { get; set; } = 0;
    }

    public class ServiceOrderFullSummaryDto
    {
        public int ServiceOrderId { get; set; }
        public string OrderNumber { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public ContactSummaryDto? Contact { get; set; }
        
        // Jobs
        public int JobCount { get; set; }
        public List<ServiceOrderJobDto> Jobs { get; set; } = new();
        
        // Dispatches
        public int DispatchCount { get; set; }
        public List<DispatchSummaryDto> Dispatches { get; set; } = new();
        
        // Aggregated Time Entries
        public int TotalTimeEntries { get; set; }
        public int TotalDuration { get; set; } // in minutes
        public decimal TotalLaborCost { get; set; }
        
        // Aggregated Expenses
        public int TotalExpenseCount { get; set; }
        public decimal TotalExpenses { get; set; }
        
        // Aggregated Materials
        public int TotalMaterialCount { get; set; }
        public decimal TotalMaterialCost { get; set; }
        
        // Aggregated Notes
        public int TotalNoteCount { get; set; }
        
        // Grand Totals
        public decimal GrandTotal { get; set; }
    }

    public class DispatchSummaryDto
    {
        public int Id { get; set; }
        public int JobId { get; set; }
        public string? TechnicianId { get; set; }
        public string? TechnicianName { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime? ScheduledDate { get; set; }
        public int TimeEntryCount { get; set; }
        public int ExpenseCount { get; set; }
        public int MaterialCount { get; set; }
    }

    // ========== NOTE DTOs ==========
    
    public class ServiceOrderNoteDto
    {
        public int Id { get; set; }
        public int ServiceOrderId { get; set; }
        public string Content { get; set; } = string.Empty;
        public string Type { get; set; } = "internal";
        public string CreatedBy { get; set; } = string.Empty;
        public string? CreatedByName { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class CreateServiceOrderNoteDto
    {
        [System.ComponentModel.DataAnnotations.Required]
        public string Content { get; set; } = null!;
        public string Type { get; set; } = "internal"; // "internal", "external", "creation"
    }

    public class PrepareInvoiceDto
    {
        public List<int>? MaterialIds { get; set; }
        public List<int>? ExpenseIds { get; set; }
        public List<int>? TimeEntryIds { get; set; }
        // IDs from dispatch tables (different from SO tables)
        public List<int>? DispatchMaterialIds { get; set; }
        public List<int>? DispatchExpenseIds { get; set; }
        public List<int>? DispatchTimeEntryIds { get; set; }
        public string? Notes { get; set; }
    }
}

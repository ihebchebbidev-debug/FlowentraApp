using System;
using System.ComponentModel.DataAnnotations;

namespace MyApi.Modules.Dispatches.DTOs
{
    public class CreateMaterialUsageDto
    {
        [Required]
        public string ArticleId { get; set; } = null!;
        [Required]
        public decimal Quantity { get; set; }
        public string? UsedBy { get; set; }
        public string? InternalComment { get; set; }
        public bool? Replacing { get; set; }
        public string? OldArticleModel { get; set; }
        public string? Description { get; set; }
        public decimal? UnitPrice { get; set; }
        public string? Unit { get; set; }
    }

    public class MaterialDto
    {
        public int Id { get; set; }
        public int DispatchId { get; set; }
        public int? ServiceOrderId { get; set; }
        public string? TechnicianId { get; set; }
        public string? ArticleId { get; set; }
        public string? ArticleName { get; set; }
        public string? Sku { get; set; }
        public string? Description { get; set; }
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal TotalPrice { get; set; }
        public string Status { get; set; } = null!;
        public string? Source { get; set; } // sale_conversion, manual, dispatch
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
        public string? SourceTable { get; set; } // "service_order" or "dispatch"
        public string? Unit { get; set; }
    }

    public class ApproveMaterialDto
    {
        public string ApprovedBy { get; set; } = null!;
    }
}

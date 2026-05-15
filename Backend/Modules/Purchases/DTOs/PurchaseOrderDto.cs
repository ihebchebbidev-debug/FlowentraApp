namespace MyApi.Modules.Purchases.DTOs
{
    // ─── Purchase Order ───

    public class PurchaseOrderDto
    {
        public int Id { get; set; }
        public string OrderNumber { get; set; } = string.Empty;
        public string? Title { get; set; }
        public string? Description { get; set; }
        public int SupplierId { get; set; }
        public string SupplierName { get; set; } = string.Empty;
        public string? SupplierEmail { get; set; }
        public string? SupplierPhone { get; set; }
        public string? SupplierAddress { get; set; }
        public string? SupplierMatriculeFiscale { get; set; }
        public string Status { get; set; } = "draft";
        public DateTime OrderDate { get; set; }
        public DateTime? ExpectedDelivery { get; set; }
        public DateTime? ActualDelivery { get; set; }
        public string Currency { get; set; } = "TND";
        public decimal SubTotal { get; set; }
        public decimal Discount { get; set; }
        public string DiscountType { get; set; } = "percentage";
        public decimal TaxAmount { get; set; }
        public decimal FiscalStamp { get; set; }
        public decimal GrandTotal { get; set; }
        public string PaymentTerms { get; set; } = "net30";
        public string PaymentStatus { get; set; } = "pending";
        public string? Notes { get; set; }
        public string[]? Tags { get; set; }
        public string? BillingAddress { get; set; }
        public string? DeliveryAddress { get; set; }
        public string? ServiceOrderId { get; set; }
        public string? SaleId { get; set; }
        public string? ApprovedBy { get; set; }
        public DateTime? ApprovalDate { get; set; }
        public DateTime? SentToSupplierAt { get; set; }
        public List<PurchaseOrderItemDto>? Items { get; set; }
        public DateTime CreatedDate { get; set; }
        public string CreatedBy { get; set; } = string.Empty;
        public string? CreatedByName { get; set; }
        public DateTime? ModifiedDate { get; set; }
        public string? ModifiedBy { get; set; }
    }

    public class PurchaseOrderItemDto
    {
        public int Id { get; set; }
        public int PurchaseOrderId { get; set; }
        public int? ArticleId { get; set; }
        public string? ArticleName { get; set; }
        public string? ArticleNumber { get; set; }
        public string? SupplierRef { get; set; }
        public string Description { get; set; } = string.Empty;
        public decimal Quantity { get; set; }
        public decimal ReceivedQty { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal TaxRate { get; set; }
        public decimal Discount { get; set; }
        public string DiscountType { get; set; } = "percentage";
        public decimal LineTotal { get; set; }
        public string Unit { get; set; } = "piece";
        public int DisplayOrder { get; set; }
    }

    public class CreatePurchaseOrderDto
    {
        public string? Title { get; set; }
        public string? Description { get; set; }
        public int SupplierId { get; set; }
        public string Currency { get; set; } = "TND";
        public DateTime? ExpectedDelivery { get; set; }
        public decimal Discount { get; set; }
        public string DiscountType { get; set; } = "percentage";
        public decimal FiscalStamp { get; set; } = 1.000m;
        public string PaymentTerms { get; set; } = "net30";
        public string? Notes { get; set; }
        public string[]? Tags { get; set; }
        public string? BillingAddress { get; set; }
        public string? DeliveryAddress { get; set; }
        public string? ServiceOrderId { get; set; }
        public string? SaleId { get; set; }
        public List<CreatePurchaseOrderItemDto>? Items { get; set; }
    }

    public class CreatePurchaseOrderItemDto
    {
        public int? ArticleId { get; set; }
        public string? ArticleName { get; set; }
        public string? ArticleNumber { get; set; }
        public string? SupplierRef { get; set; }
        public string Description { get; set; } = string.Empty;
        public decimal Quantity { get; set; } = 1;
        public decimal UnitPrice { get; set; }
        public decimal TaxRate { get; set; } = 19;
        public decimal Discount { get; set; }
        public string DiscountType { get; set; } = "percentage";
        public string Unit { get; set; } = "piece";
    }

    public class UpdatePurchaseOrderDto
    {
        public string? Title { get; set; }
        public string? Description { get; set; }
        public string? Status { get; set; }
        public DateTime? ExpectedDelivery { get; set; }
        public decimal? Discount { get; set; }
        public string? DiscountType { get; set; }
        public decimal? FiscalStamp { get; set; }
        public string? PaymentTerms { get; set; }
        public string? PaymentStatus { get; set; }
        public string? Notes { get; set; }
        public string[]? Tags { get; set; }
        public string? BillingAddress { get; set; }
        public string? DeliveryAddress { get; set; }
    }

    public class PurchaseOrderStatsDto
    {
        public long TotalOrders { get; set; }
        public long DraftOrders { get; set; }
        public long OrderedOrders { get; set; }
        public long ReceivedOrders { get; set; }
        public long CancelledOrders { get; set; }
        public decimal TotalSpend { get; set; }
        public decimal MonthlySpend { get; set; }
        public decimal AvgLeadTime { get; set; }
        public long PendingReceipts { get; set; }
        public long OverdueInvoices { get; set; }
    }

    public class PaginatedPurchaseOrderResponse
    {
        public List<PurchaseOrderDto> Orders { get; set; } = new();
        public PurchasePaginationInfo Pagination { get; set; } = new();
    }

    public class PurchasePaginationInfo
    {
        public int Page { get; set; }
        public int Limit { get; set; }
        public int Total { get; set; }
        public int TotalPages { get; set; }
    }
}

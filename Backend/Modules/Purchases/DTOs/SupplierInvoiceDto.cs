namespace MyApi.Modules.Purchases.DTOs
{
    public class SupplierInvoiceDto
    {
        public int Id { get; set; }
        public string InvoiceNumber { get; set; } = string.Empty;
        public string? SupplierInvoiceRef { get; set; }
        public int SupplierId { get; set; }
        public string SupplierName { get; set; } = string.Empty;
        public string? SupplierMatriculeFiscale { get; set; }
        public int? PurchaseOrderId { get; set; }
        public string? PurchaseOrderNumber { get; set; }
        public int? GoodsReceiptId { get; set; }
        public DateTime InvoiceDate { get; set; }
        public DateTime DueDate { get; set; }
        public string Status { get; set; } = "draft";
        public string Currency { get; set; } = "TND";
        public decimal SubTotal { get; set; }
        public decimal Discount { get; set; }
        public string DiscountType { get; set; } = "percentage";
        public decimal TaxAmount { get; set; }
        public decimal FiscalStamp { get; set; }
        public decimal GrandTotal { get; set; }
        public decimal AmountPaid { get; set; }
        public string? PaymentMethod { get; set; }
        public DateTime? PaymentDate { get; set; }
        public string? Notes { get; set; }
        // Retenue à la source
        public bool RsApplicable { get; set; }
        public string? RsTypeCode { get; set; }
        public decimal RsAmount { get; set; }
        public int? RsRecordId { get; set; }
        // Facture en ligne
        public string? FactureEnLigneId { get; set; }
        public string? FactureEnLigneStatus { get; set; }
        public DateTime? FactureEnLigneSentAt { get; set; }
        // TEJ
        public bool TejSynced { get; set; }
        public DateTime? TejSyncDate { get; set; }
        public string? TejSyncStatus { get; set; }
        public string? TejErrorMessage { get; set; }
        public List<SupplierInvoiceItemDto>? Items { get; set; }
        public DateTime CreatedDate { get; set; }
        public string CreatedBy { get; set; } = string.Empty;
        public DateTime? ModifiedDate { get; set; }
        public string? ModifiedBy { get; set; }
    }

    public class SupplierInvoiceItemDto
    {
        public int Id { get; set; }
        public int SupplierInvoiceId { get; set; }
        public int? PurchaseOrderItemId { get; set; }
        public int? ArticleId { get; set; }
        public string? ArticleName { get; set; }
        public string Description { get; set; } = string.Empty;
        public decimal Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal TaxRate { get; set; }
        public decimal LineTotal { get; set; }
        public int DisplayOrder { get; set; }
    }

    public class CreateSupplierInvoiceDto
    {
        public string? SupplierInvoiceRef { get; set; }
        public int SupplierId { get; set; }
        public int? PurchaseOrderId { get; set; }
        public int? GoodsReceiptId { get; set; }
        public DateTime InvoiceDate { get; set; }
        public DateTime DueDate { get; set; }
        public string Currency { get; set; } = "TND";
        public decimal Discount { get; set; }
        public string DiscountType { get; set; } = "percentage";
        public decimal FiscalStamp { get; set; } = 1.000m;
        public string? PaymentMethod { get; set; }
        public string? Notes { get; set; }
        public bool RsApplicable { get; set; }
        public string? RsTypeCode { get; set; }
        public List<CreateSupplierInvoiceItemDto>? Items { get; set; }
    }

    public class CreateSupplierInvoiceItemDto
    {
        public int? PurchaseOrderItemId { get; set; }
        public int? ArticleId { get; set; }
        public string? ArticleName { get; set; }
        public string Description { get; set; } = string.Empty;
        public decimal Quantity { get; set; } = 1;
        public decimal UnitPrice { get; set; }
        public decimal TaxRate { get; set; } = 19;
    }

    public class UpdateSupplierInvoiceDto
    {
        public string? SupplierInvoiceRef { get; set; }
        public string? Status { get; set; }
        public DateTime? DueDate { get; set; }
        public decimal? Discount { get; set; }
        public string? DiscountType { get; set; }
        public decimal? FiscalStamp { get; set; }
        public string? PaymentMethod { get; set; }
        public decimal? AmountPaid { get; set; }
        public DateTime? PaymentDate { get; set; }
        public string? Notes { get; set; }
        public bool? RsApplicable { get; set; }
        public string? RsTypeCode { get; set; }
        // TEJ sync (Tunisian e-tax journal)
        public bool? TejSynced { get; set; }
        public DateTime? TejSyncDate { get; set; }
        public string? TejSyncStatus { get; set; }
        public string? TejErrorMessage { get; set; }
        // Facture en ligne
        public string? FactureEnLigneId { get; set; }
        public string? FactureEnLigneStatus { get; set; }
        public DateTime? FactureEnLigneSentAt { get; set; }
    }

    public class PaginatedSupplierInvoiceResponse
    {
        public List<SupplierInvoiceDto> Invoices { get; set; } = new();
        public PurchasePaginationInfo Pagination { get; set; } = new();
    }
}

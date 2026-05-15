namespace MyApi.Modules.Purchases.DTOs
{
    public class GoodsReceiptDto
    {
        public int Id { get; set; }
        public string ReceiptNumber { get; set; } = string.Empty;
        public int PurchaseOrderId { get; set; }
        public string? PurchaseOrderNumber { get; set; }
        public int SupplierId { get; set; }
        public string SupplierName { get; set; } = string.Empty;
        public DateTime ReceiptDate { get; set; }
        public string Status { get; set; } = "partial";
        public string? DeliveryNoteRef { get; set; }
        public string? Notes { get; set; }
        public string ReceivedBy { get; set; } = string.Empty;
        public string? ReceivedByName { get; set; }
        public List<GoodsReceiptItemDto>? Items { get; set; }
        public DateTime CreatedDate { get; set; }
        public string CreatedBy { get; set; } = string.Empty;
        public DateTime? ModifiedDate { get; set; }
        public string? ModifiedBy { get; set; }
    }

    public class GoodsReceiptItemDto
    {
        public int Id { get; set; }
        public int GoodsReceiptId { get; set; }
        public int PurchaseOrderItemId { get; set; }
        public int? ArticleId { get; set; }
        public string? ArticleName { get; set; }
        public string? ArticleNumber { get; set; }
        public decimal OrderedQty { get; set; }
        public decimal QuantityReceived { get; set; }
        public decimal QuantityRejected { get; set; }
        public string? RejectionReason { get; set; }
        public int? LocationId { get; set; }
        public string? Notes { get; set; }
    }

    public class CreateGoodsReceiptDto
    {
        public int PurchaseOrderId { get; set; }
        public DateTime? ReceiptDate { get; set; }
        public string? DeliveryNoteRef { get; set; }
        public string? Notes { get; set; }
        public List<CreateGoodsReceiptItemDto>? Items { get; set; }
    }

    public class CreateGoodsReceiptItemDto
    {
        public int PurchaseOrderItemId { get; set; }
        public decimal QuantityReceived { get; set; }
        public decimal QuantityRejected { get; set; }
        public string? RejectionReason { get; set; }
        public int? LocationId { get; set; }
        public string? Notes { get; set; }
    }

    // Update payload. Items with Id → UPDATE (qty delta re-reconciles PO.ReceivedQty
    // and stock). Items with no Id → APPEND. Existing items absent from the list →
    // REMOVED (their previously received qty is reversed against PO + stock).
    public class UpdateGoodsReceiptDto
    {
        public DateTime? ReceiptDate { get; set; }
        public string? DeliveryNoteRef { get; set; }
        public string? Notes { get; set; }
        public List<UpdateGoodsReceiptItemDto>? Items { get; set; }
    }

    public class UpdateGoodsReceiptItemDto
    {
        public int? Id { get; set; }                       // null/0 → new item
        public int PurchaseOrderItemId { get; set; }
        public decimal QuantityReceived { get; set; }
        public decimal QuantityRejected { get; set; }
        public string? RejectionReason { get; set; }
        public int? LocationId { get; set; }
        public string? Notes { get; set; }
    }

    public class PaginatedGoodsReceiptResponse
    {
        public List<GoodsReceiptDto> Receipts { get; set; } = new();
        public PurchasePaginationInfo Pagination { get; set; } = new();
    }
}

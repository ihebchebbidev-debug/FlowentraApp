// Purchase Module Types

// ─── Article-Supplier Relationship ───

export interface ArticleSupplier {
  id: string;
  articleId: string;
  articleName?: string;
  articleNumber?: string;
  supplierId: string;
  supplierName?: string;
  supplierRef: string;
  purchasePrice: number;
  currency: string;
  minOrderQty: number;
  leadTimeDays: number;
  isPreferred: boolean;
  isActive: boolean;
  notes?: string;
  createdDate: string;
  createdBy: string;
  modifiedDate?: string;
  modifiedBy?: string;
}

export interface ArticleSupplierPriceHistory {
  id: string;
  articleSupplierId: string;
  oldPrice: number;
  newPrice: number;
  currency: string;
  changedAt: string;
  changedBy: string;
  reason?: string;
}

// ─── Purchase Order ───

export type PurchaseOrderStatus = 'draft' | 'validated' | 'ordered' | 'partially_received' | 'received' | 'closed' | 'cancelled';
export type PaymentStatus = 'pending' | 'partial' | 'paid';

export interface PurchaseOrder {
  id: string;
  orderNumber: string;
  supplierId: string;
  supplierName: string;
  supplierEmail?: string;
  supplierPhone?: string;
  supplierAddress?: string;
  supplierMatriculeFiscale?: string;
  title?: string;
  description?: string;
  status: PurchaseOrderStatus;
  orderDate: string;
  expectedDelivery?: string;
  actualDelivery?: string;
  currency: string;
  subTotal: number;
  discount: number;
  discountType: 'percentage' | 'fixed';
  taxAmount: number;
  fiscalStamp: number;
  grandTotal: number;
  paymentTerms: string;
  paymentStatus: PaymentStatus;
  notes?: string;
  tags: string[];
  billingAddress?: string;
  deliveryAddress?: string;
  serviceOrderId?: string;
  saleId?: string;
  approvedBy?: string;
  approvalDate?: string;
  sentToSupplierAt?: string;
  items: PurchaseOrderItem[];
  createdDate: string;
  createdBy: string;
  createdByName?: string;
  modifiedDate?: string;
  modifiedBy?: string;
}

export interface PurchaseOrderItem {
  id: string;
  purchaseOrderId: string;
  articleId: string;
  articleName?: string;
  articleNumber?: string;
  supplierRef?: string;
  description: string;
  quantity: number;
  receivedQty: number;
  unitPrice: number;
  taxRate: number;
  discount: number;
  discountType: 'percentage' | 'fixed';
  lineTotal: number;
  unit: string;
  displayOrder: number;
}

// ─── Goods Receipt ───

export type GoodsReceiptStatus = 'partial' | 'complete' | 'rejected';

export interface GoodsReceipt {
  id: string;
  receiptNumber: string;
  purchaseOrderId: string;
  purchaseOrderNumber?: string;
  supplierId: string;
  supplierName: string;
  receiptDate: string;
  status: GoodsReceiptStatus;
  deliveryNoteRef?: string;
  notes?: string;
  receivedBy: string;
  receivedByName?: string;
  items: GoodsReceiptItem[];
  createdDate: string;
  createdBy: string;
  modifiedDate?: string;
  modifiedBy?: string;
  // Soft-delete fields (backend filters these out of list/detail responses,
  // but kept on the type so detail screens can defensively render a banner
  // if a deleted record is ever returned — e.g. via direct ID navigation).
  isDeleted?: boolean;
  deletedAt?: string | null;
  deletedBy?: string | null;
}

export interface GoodsReceiptItem {
  id: string;
  goodsReceiptId: string;
  purchaseOrderItemId: string;
  articleId: string;
  articleName?: string;
  articleNumber?: string;
  orderedQty: number;
  quantityReceived: number;
  quantityRejected: number;
  rejectionReason?: string;
  locationId?: string;
  notes?: string;
}

// ─── Supplier Invoice ───

// 'pending' is what the backend sets when AmountPaid drops to 0 (refund/correction)
// after a partial payment — surface it so the badge renders correctly.
export type SupplierInvoiceStatus = 'draft' | 'validated' | 'pending' | 'partially_paid' | 'paid' | 'cancelled';
export type FactureEnLigneStatus = 'pending' | 'sent' | 'validated' | 'rejected';
export type TEJSyncStatus = 'pending' | 'synced' | 'error';

export interface SupplierInvoice {
  id: string;
  invoiceNumber: string;
  supplierInvoiceRef?: string;
  supplierId: string;
  supplierName: string;
  supplierMatriculeFiscale?: string;
  purchaseOrderId?: string;
  purchaseOrderNumber?: string;
  goodsReceiptId?: string;
  invoiceDate: string;
  dueDate: string;
  status: SupplierInvoiceStatus;
  currency: string;
  subTotal: number;
  discount: number;
  discountType: 'percentage' | 'fixed';
  taxAmount: number;
  fiscalStamp: number;
  grandTotal: number;
  amountPaid: number;
  paymentMethod?: string;
  paymentDate?: string;
  notes?: string;
  // Tunisian compliance
  rsApplicable: boolean;
  rsTypeCode?: string;
  rsOperationCode?: string;       // TEJ IdTypeOperation (RSn_NNNNNN)
  rsAmount: number;
  rsTvaAmount?: number;
  rsRecordId?: string;
  factureEnLigneId?: string;
  factureEnLigneStatus?: FactureEnLigneStatus;
  factureEnLigneSentAt?: string;
  tejSynced: boolean;
  tejSyncDate?: string;
  tejSyncStatus?: TEJSyncStatus;
  tejErrorMessage?: string;
  items: SupplierInvoiceItem[];
  createdDate: string;
  createdBy: string;
  modifiedDate?: string;
  modifiedBy?: string;
}

export interface SupplierInvoiceItem {
  id: string;
  supplierInvoiceId: string;
  purchaseOrderItemId?: string;
  articleId?: string;
  articleName?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  lineTotal: number;
  displayOrder: number;
}

// ─── Purchase Activity (Audit) ───

export interface PurchaseActivity {
  id: string;
  entityType: 'purchase_order' | 'goods_receipt' | 'supplier_invoice';
  entityId: string;
  /**
   * Wire field name — the backend serializes PurchaseActivityDto.ActivityType
   * as `activityType`. Was previously typed as `action`, which is a key the API
   * never sends, so every consumer read `undefined` and rendered a blank badge.
   */
  activityType: string;
  description: string;
  oldValue?: string;
  newValue?: string;
  performedBy: string;
  performedByName: string;
  performedAt: string;
}

export interface PaginatedPurchaseActivities {
  activities: PurchaseActivity[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

// ─── Stats ───

export interface PurchaseStats {
  totalOrders: number;
  pendingReceipts: number;
  openInvoices: number;
  monthlySpend: number;
  totalSpendThisYear: number;
  avgLeadTime: number;
  overdueInvoices: number;
  rsTotal: number;
}

// ─── Filters ───

export interface PurchaseOrderFilters {
  status?: PurchaseOrderStatus;
  supplierId?: string;
  paymentStatus?: PaymentStatus;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export interface SupplierInvoiceFilters {
  status?: SupplierInvoiceStatus;
  supplierId?: string;
  purchaseOrderId?: string;
  rsApplicable?: boolean;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

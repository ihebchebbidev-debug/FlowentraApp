export type InvoiceStatus = 'draft' | 'posted' | 'paid' | 'void';

export interface InvoiceLine {
  id: number;
  invoiceId: number;
  sourceType?: string;
  sourceId?: string;
  itemName: string;
  description?: string;
  quantity: number;
  unit?: string;
  unitPrice: number;
  taxRate: number;
  lineTotal: number;
  taxAmount: number;
  displayOrder: number;
}

export interface Invoice {
  id: number;
  invoiceNumber?: string;
  status: InvoiceStatus;
  contactId: number;
  contactName?: string;
  saleId?: number;
  saleNumber?: string;
  serviceOrderId?: number;
  title?: string;
  notes?: string;
  currency: string;
  subtotal: number;
  taxAmount: number;
  grandTotal: number;
  amountPaid: number;
  amountDue: number;
  issueDate?: string;
  dueDate?: string;
  postedAt?: string;
  voidedAt?: string;
  voidReason?: string;
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
  lines: InvoiceLine[];
}

export interface InvoiceQueryParams {
  contactId?: number;
  saleId?: number;
  serviceOrderId?: number;
  status?: InvoiceStatus | 'all' | 'overdue';
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PagedInvoiceResponse {
  data: Invoice[];
  pageNumber: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export type InvoiceActivityType =
  | 'created'
  | 'created_from_sale'
  | 'updated'
  | 'posted'
  | 'voided'
  | 'deleted'
  | 'auto_marked_paid'
  | 'auto_reopened'
  | 'manual_marked_paid'
  | 'manual_reopened'
  | string;

export interface InvoiceActivity {
  id: number;
  invoiceId: number;
  type: InvoiceActivityType;
  description?: string;
  oldValue?: string;
  newValue?: string;
  createdAt: string;
  createdBy: string;
}

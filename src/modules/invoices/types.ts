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
  saleId?: number;
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
  status?: InvoiceStatus | 'all';
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

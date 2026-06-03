import { apiFetch } from '@/services/api/apiClient';
import type {
  PurchaseOrder, GoodsReceipt, SupplierInvoice,
  ArticleSupplier, ArticleSupplierPriceHistory, PurchaseActivity, PurchaseStats,
  PurchaseOrderFilters, SupplierInvoiceFilters
} from '../types';

// apiFetch returns { data, status, error } where `data` is the parsed JSON body.
// Backend wraps successful responses as { success: true, data: <payload> }.
// So the actual payload is at result.data.data — we must peel BOTH layers.
const extract = async <T>(promise: Promise<any>, msg: string): Promise<T> => {
  const result = await promise;
  if (result.error) throw new Error(result.error || msg);
  const body = result.data;
  // If body is wrapped { success, data }, return inner; otherwise return body.
  if (body && typeof body === 'object' && 'success' in body && 'data' in body) {
    return body.data as T;
  }
  return body as T;
};

// DELETE helper: apiFetch resolves on HTTP errors with `{ error }` instead of throwing.
// Without this wrapper, callers' try/catch and Promise.allSettled never see backend
// failures (4xx/5xx) — optimistic UI removes rows that the server still has.
const deleteRequest = async (endpoint: string, msg = 'Failed to delete'): Promise<void> => {
  const result = await apiFetch(endpoint, { method: 'DELETE' });
  if (result.error || (result.status >= 400 && result.status !== 0)) {
    throw new Error(result.error || msg);
  }
};

/**
 * Download a binary TEJ/RiTEJ XML file from a backend endpoint. Triggers a browser
 * download on success. On a 400 the thrown error carries `.missing: string[]` so the
 * caller can tell the user exactly what to fill. Used by both the invoice and PO paths.
 */
const downloadTejXmlFile = async (endpoint: string, fallbackName: string): Promise<void> => {
  const { API_URL } = await import('@/config/api');
  const { getAuthHeaders } = await import('@/utils/apiHeaders');
  const res = await fetch(`${API_URL}${endpoint}`, {
    method: 'GET',
    headers: getAuthHeaders() as Record<string, string>,
  });
  if (!res.ok) {
    let message = 'Failed to generate the TEJ XML';
    let missing: string[] = [];
    try {
      const body = await res.json();
      message = body?.error?.message || message;
      missing = body?.error?.missing || [];
    } catch { /* non-JSON error */ }
    const err = new Error(message) as Error & { missing?: string[] };
    err.missing = missing;
    throw err;
  }
  const blob = await res.blob();
  const cd = res.headers.get('content-disposition') || '';
  const fileName = cd.match(/filename="?([^"]+)"?/)?.[1] || fallbackName;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

// Coerce string/number to integer (or undefined). Used for IDs and FK fields
// because backend DTOs declare these as `int` and ASP.NET will reject strings with 400.
const toInt = (v: any): number | undefined => {
  if (v === undefined || v === null || v === '') return undefined;
  const n = typeof v === 'number' ? v : parseInt(String(v), 10);
  return Number.isFinite(n) ? n : undefined;
};

// Helper to build query string. Optionally rename camelCase keys to snake_case
// so they match the [FromQuery] binding on the backend controllers.
const CAMEL_TO_SNAKE_KEYS: Record<string, string> = {
  dateFrom: 'date_from',
  dateTo: 'date_to',
  supplierId: 'supplier_id',
  paymentStatus: 'payment_status',
  rsApplicable: 'rs_applicable',
  purchaseOrderId: 'purchase_order_id',
  goodsReceiptId: 'goods_receipt_id',
  sortBy: 'sort_by',
  sortOrder: 'sort_order',
};

const qs = (params?: Record<string, any>): string => {
  if (!params) return '';
  const qp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '') return;
    const key = CAMEL_TO_SNAKE_KEYS[k] || k;
    qp.append(key, String(v));
  });
  const s = qp.toString();
  return s ? `?${s}` : '';
};

// ─── Article-Supplier ────────────────────────────────────────────────────────

export const articleSupplierService = {
  getByArticle: (articleId: string) =>
    extract<ArticleSupplier[]>(apiFetch(`/api/article-suppliers/by-article/${articleId}`), 'Failed to fetch'),

  getBySupplier: (supplierId: string) =>
    extract<ArticleSupplier[]>(apiFetch(`/api/article-suppliers/by-supplier/${supplierId}`), 'Failed to fetch'),

  getById: (id: string) =>
    extract<ArticleSupplier>(apiFetch(`/api/article-suppliers/${id}`), 'Failed to fetch'),

  create: (data: Partial<ArticleSupplier>) => {
    const payload: any = {
      ...data,
      articleId: toInt(data.articleId),
      supplierId: toInt(data.supplierId),
    };
    return extract<ArticleSupplier>(
      apiFetch('/api/article-suppliers', { method: 'POST', body: JSON.stringify(payload) }),
      'Failed to create'
    );
  },

  update: (id: string, data: Partial<ArticleSupplier>) =>
    extract<ArticleSupplier>(apiFetch(`/api/article-suppliers/${id}`, { method: 'PATCH', body: JSON.stringify(data) }), 'Failed to update'),

  delete: (id: string) =>
    deleteRequest(`/api/article-suppliers/${id}`, 'Failed to delete article-supplier'),

  getPriceHistory: (articleSupplierId: string) =>
    extract<ArticleSupplierPriceHistory[]>(apiFetch(`/api/article-suppliers/${articleSupplierId}/price-history`), 'Failed to fetch'),
};

// ─── Purchase Orders ─────────────────────────────────────────────────────────

export const purchaseOrderService = {
  getAll: (filters?: PurchaseOrderFilters & { page?: number; limit?: number }) =>
    extract<{ orders: PurchaseOrder[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>(
      apiFetch(`/api/purchase-orders${qs(filters)}`), 'Failed to fetch orders'),

  getById: (id: string) =>
    extract<PurchaseOrder>(apiFetch(`/api/purchase-orders/${id}`), 'Failed to fetch order'),

  /** Download the TEJ/RiTEJ XML aggregated from this order's RS-applicable invoices. */
  downloadTejXml: (id: string): Promise<void> =>
    downloadTejXmlFile(`/api/purchase-orders/${id}/tej-xml`, `RS-PO-${id}.xml`),

  getStats: (dateFrom?: string, dateTo?: string) =>
    extract<PurchaseStats>(apiFetch(`/api/purchase-orders/stats${qs({ dateFrom, dateTo })}`), 'Failed to fetch stats'),

  create: (data: Partial<PurchaseOrder> & { items?: any[] }) => {
    // Coerce supplierId to int; sanitize items (drop client-only ids, coerce articleId)
    const payload: any = {
      ...data,
      supplierId: toInt(data.supplierId),
      items: (data.items || []).map((it: any, idx: number) => ({
        ...it,
        id: undefined,
        purchaseOrderId: undefined,
        articleId: toInt(it.articleId),
        displayOrder: it.displayOrder ?? idx,
      })),
    };
    return extract<PurchaseOrder>(
      apiFetch('/api/purchase-orders', { method: 'POST', body: JSON.stringify(payload) }),
      'Failed to create'
    );
  },

  update: (id: string, data: Partial<PurchaseOrder>) =>
    extract<PurchaseOrder>(apiFetch(`/api/purchase-orders/${id}`, { method: 'PATCH', body: JSON.stringify(data) }), 'Failed to update'),

  delete: (id: string) =>
    deleteRequest(`/api/purchase-orders/${id}`, 'Failed to delete purchase order'),

  validate: (id: string) =>
    extract<PurchaseOrder>(apiFetch(`/api/purchase-orders/${id}`, { method: 'PATCH', body: JSON.stringify({ status: 'validated' }) }), 'Failed'),

  sendToSupplier: (id: string) =>
    extract<PurchaseOrder>(apiFetch(`/api/purchase-orders/${id}`, { method: 'PATCH', body: JSON.stringify({ status: 'ordered' }) }), 'Failed'),

  cancel: (id: string) =>
    extract<PurchaseOrder>(apiFetch(`/api/purchase-orders/${id}`, { method: 'PATCH', body: JSON.stringify({ status: 'cancelled' }) }), 'Failed'),

  addItem: (orderId: string, data: Record<string, unknown>) => {
    const payload: any = { ...data, articleId: toInt((data as any).articleId) };
    return extract<any>(apiFetch(`/api/purchase-orders/${orderId}/items`, { method: 'POST', body: JSON.stringify(payload) }), 'Failed');
  },

  updateItem: (orderId: string, itemId: string, data: Record<string, unknown>) =>
    extract<any>(apiFetch(`/api/purchase-orders/${orderId}/items/${itemId}`, { method: 'PATCH', body: JSON.stringify(data) }), 'Failed'),

  deleteItem: (orderId: string, itemId: string) =>
    deleteRequest(`/api/purchase-orders/${orderId}/items/${itemId}`, 'Failed to delete item'),

  getActivities: (orderId: string, page = 1, limit = 20) =>
    extract<PurchaseActivity[]>(apiFetch(`/api/purchase-orders/${orderId}/activities${qs({ page, limit })}`), 'Failed'),
};

// ─── Goods Receipts ──────────────────────────────────────────────────────────

export const goodsReceiptService = {
  getAll: (params?: { purchaseOrderId?: string; supplierId?: string; status?: string; search?: string; page?: number; limit?: number; purchase_order_id?: string; supplier_id?: string }) =>
    extract<{ receipts: GoodsReceipt[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>(
      apiFetch(`/api/goods-receipts${qs(params)}`), 'Failed to fetch receipts'),

  getById: (id: string) =>
    extract<GoodsReceipt>(apiFetch(`/api/goods-receipts/${id}`), 'Failed to fetch receipt'),

  create: (data: Partial<GoodsReceipt> & { items?: any[] }) => {
    const payload: any = {
      ...data,
      purchaseOrderId: toInt(data.purchaseOrderId),
      items: (data.items || []).map((it: any) => ({
        ...it,
        purchaseOrderItemId: toInt(it.purchaseOrderItemId),
      })),
    };
    return extract<GoodsReceipt>(
      apiFetch('/api/goods-receipts', { method: 'POST', body: JSON.stringify(payload) }),
      'Failed to create'
    );
  },

  // Editable receipts. Items with `id` → backend UPDATEs (qty delta reconciled
  // against PO.ReceivedQty + stock). Items without `id` → APPENDED. Existing
  // items omitted from the array → backend REMOVES (and reverses stock).
  // Backend validates linked-invoice block, over-receipt, and PO-item ownership;
  // any of those throw with the backend message preserved (extract → result.error).
  update: (id: string, data: {
    receiptDate?: string;
    deliveryNoteRef?: string;
    notes?: string;
    items?: Array<{
      id?: string | number;
      purchaseOrderItemId: string | number;
      quantityReceived: number;
      quantityRejected: number;
      rejectionReason?: string;
      locationId?: number;
      notes?: string;
    }>;
  }) => {
    const payload: any = {
      ...data,
      items: (data.items || []).map((it) => ({
        ...it,
        // Server expects nullable int Id and an int PurchaseOrderItemId; coerce
        // string ids coming from the existing GoodsReceiptItem (string by type).
        id: it.id != null && it.id !== '' ? toInt(it.id as any) : null,
        purchaseOrderItemId: toInt(it.purchaseOrderItemId as any),
      })),
    };
    return extract<GoodsReceipt>(
      apiFetch(`/api/goods-receipts/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
      'Failed to update receipt'
    );
  },

  delete: (id: string) =>
    deleteRequest(`/api/goods-receipts/${id}`, 'Failed to delete receipt'),
};

// ─── Supplier Invoices ───────────────────────────────────────────────────────

export const supplierInvoiceService = {
  getAll: (filters?: SupplierInvoiceFilters & { page?: number; limit?: number }) =>
    extract<{ invoices: SupplierInvoice[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>(
      apiFetch(`/api/supplier-invoices${qs(filters)}`), 'Failed to fetch invoices'),

  getById: (id: string) =>
    extract<SupplierInvoice>(apiFetch(`/api/supplier-invoices/${id}`), 'Failed to fetch invoice'),

  create: (data: Partial<SupplierInvoice> & { items?: any[] }) => {
    const payload: any = {
      ...data,
      supplierId: toInt(data.supplierId),
      purchaseOrderId: toInt(data.purchaseOrderId),
      goodsReceiptId: toInt(data.goodsReceiptId),
      items: (data.items || []).map((it: any) => ({
        ...it,
        articleId: toInt(it.articleId),
        purchaseOrderItemId: toInt(it.purchaseOrderItemId),
      })),
    };
    return extract<SupplierInvoice>(
      apiFetch('/api/supplier-invoices', { method: 'POST', body: JSON.stringify(payload) }),
      'Failed to create'
    );
  },

  update: (id: string, data: Partial<SupplierInvoice>) =>
    extract<SupplierInvoice>(apiFetch(`/api/supplier-invoices/${id}`, { method: 'PATCH', body: JSON.stringify(data) }), 'Failed to update'),

  delete: (id: string) =>
    deleteRequest(`/api/supplier-invoices/${id}`, 'Failed to delete invoice'),

  validate: (id: string) =>
    extract<SupplierInvoice>(apiFetch(`/api/supplier-invoices/${id}`, { method: 'PATCH', body: JSON.stringify({ status: 'validated' }) }), 'Failed'),

  recordPayment: (id: string, data: { amountPaid: number; paymentMethod: string; paymentDate: string }) =>
    extract<SupplierInvoice>(apiFetch(`/api/supplier-invoices/${id}`, { method: 'PATCH', body: JSON.stringify(data) }), 'Failed'),

  // TEJ + Facture-en-ligne use dedicated sub-endpoints (added on backend) so
  // those fields actually persist instead of being silently dropped by
  // UpdateSupplierInvoiceDto, which doesn't include them.
  syncTej: (id: string) =>
    extract<SupplierInvoice>(apiFetch(`/api/supplier-invoices/${id}/tej-sync`, { method: 'POST' }), 'Failed'),

  /** Download the TEJ/RiTEJ XML for a single invoice on demand. */
  downloadTejXml: (id: string): Promise<void> =>
    downloadTejXmlFile(`/api/supplier-invoices/${id}/tej-xml`, `RS-invoice-${id}.xml`),

  sendFactureEnLigne: (id: string) =>
    extract<SupplierInvoice>(apiFetch(`/api/supplier-invoices/${id}/facture-en-ligne`, { method: 'POST' }), 'Failed'),

  // Items (only when invoice.status === 'draft')
  addItem: (invoiceId: string, data: Record<string, unknown>) => {
    const payload: any = { ...data, articleId: toInt((data as any).articleId), purchaseOrderItemId: toInt((data as any).purchaseOrderItemId) };
    return extract<any>(apiFetch(`/api/supplier-invoices/${invoiceId}/items`, { method: 'POST', body: JSON.stringify(payload) }), 'Failed to add item');
  },

  updateItem: (invoiceId: string, itemId: string, data: Record<string, unknown>) =>
    extract<any>(apiFetch(`/api/supplier-invoices/${invoiceId}/items/${itemId}`, { method: 'PATCH', body: JSON.stringify(data) }), 'Failed to update item'),

  deleteItem: (invoiceId: string, itemId: string) =>
    deleteRequest(`/api/supplier-invoices/${invoiceId}/items/${itemId}`, 'Failed to delete item'),
};

// ─── Activities & Stats ──────────────────────────────────────────────────────

export const purchaseActivityService = {
  getByOrder: (orderId: string, page = 1, limit = 20) =>
    extract<PurchaseActivity[]>(apiFetch(`/api/purchase-orders/${orderId}/activities${qs({ page, limit })}`), 'Failed'),
};

export const purchaseStatsService = {
  getDashboardStats: (dateFrom?: string, dateTo?: string) =>
    extract<PurchaseStats>(apiFetch(`/api/purchase-orders/stats${qs({ dateFrom, dateTo })}`), 'Failed'),
};

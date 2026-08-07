// API service for Customer Invoices (contact-facing invoices)
import { apiFetch } from './apiClient';
import {
  ensureContactVisibilityLoaded,
  filterByContactVisibility,
  filterPageByContactVisibility,
} from '@/services/contactVisibility';
import type { Invoice, InvoiceActivity, InvoiceQueryParams, PagedInvoiceResponse } from '@/modules/invoices/types';

const BASE = '/api/invoices';

function qs(params: Record<string, unknown>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '' || v === 'all') return;
    search.append(k, String(v));
  });
  const s = search.toString();
  return s ? `?${s}` : '';
}

function unwrap<T>(result: { data: T | null; status: number; error?: string }, fallbackMsg: string): T {
  if (result.error || result.data === null) {
    throw new Error(result.error || fallbackMsg);
  }
  return result.data;
}

export const customerInvoicesApi = {
  async list(params: InvoiceQueryParams = {}): Promise<PagedInvoiceResponse> {
    const result = await apiFetch<PagedInvoiceResponse>(`${BASE}${qs(params as Record<string, unknown>)}`);
    const paged = unwrap(result, 'Failed to fetch invoices');
    await ensureContactVisibilityLoaded();
    const filtered = filterPageByContactVisibility(paged?.data ?? [], {
      total: (paged as any)?.total ?? (paged as any)?.totalCount,
      pageSize: (paged as any)?.pageSize ?? (params as any)?.pageSize,
    });
    return {
      ...paged,
      data: filtered.rows,
      ...((paged as any)?.total !== undefined ? { total: filtered.total } : {}),
      ...((paged as any)?.totalCount !== undefined ? { totalCount: filtered.total } : {}),
      ...((paged as any)?.totalPages !== undefined ? { totalPages: filtered.totalPages } : {}),
    } as PagedInvoiceResponse;
  },

  async getById(id: number): Promise<Invoice> {
    const result = await apiFetch<Invoice>(`${BASE}/${id}`);
    return unwrap(result, 'Failed to fetch invoice');
  },

  async createFromSale(saleId: number, serviceOrderId?: number): Promise<Invoice> {
    const result = await apiFetch<Invoice>(
      `${BASE}/from-sale/${saleId}${serviceOrderId ? `?serviceOrderId=${serviceOrderId}` : ''}`,
      { method: 'POST' }
    );
    return unwrap(result, 'Failed to create invoice');
  },

  async post(id: number, body: { issueDate?: string; dueDate?: string } = {}): Promise<Invoice> {
    const result = await apiFetch<Invoice>(`${BASE}/${id}/post`, { method: 'POST', body: JSON.stringify(body) });
    return unwrap(result, 'Failed to post invoice');
  },

  async void(id: number, body: { reason: string }): Promise<Invoice> {
    const result = await apiFetch<Invoice>(`${BASE}/${id}/void`, { method: 'POST', body: JSON.stringify(body) });
    return unwrap(result, 'Failed to void invoice');
  },

  async markPaid(id: number, body: { memo: string }): Promise<Invoice> {
    const result = await apiFetch<Invoice>(`${BASE}/${id}/mark-paid`, { method: 'POST', body: JSON.stringify(body) });
    return unwrap(result, 'Failed to mark invoice as paid');
  },

  async reopen(id: number, body: { memo: string }): Promise<Invoice> {
    const result = await apiFetch<Invoice>(`${BASE}/${id}/reopen`, { method: 'POST', body: JSON.stringify(body) });
    return unwrap(result, 'Failed to reopen invoice');
  },

  async remove(id: number): Promise<void> {
    const result = await apiFetch<void>(`${BASE}/${id}`, { method: 'DELETE' });
    if (result.error) throw new Error(result.error);
  },

  async getActivities(id: number): Promise<InvoiceActivity[]> {
    const result = await apiFetch<InvoiceActivity[]>(`${BASE}/${id}/activities`);
    return unwrap(result, 'Failed to fetch invoice activities');
  },
};

export default customerInvoicesApi;

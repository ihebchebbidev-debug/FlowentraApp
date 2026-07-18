// API service for Customer Invoices (contact-facing invoices)
import { apiFetch } from './apiClient';
import type { Invoice, InvoiceQueryParams, PagedInvoiceResponse } from '@/modules/invoices/types';

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
    return unwrap(result, 'Failed to fetch invoices');
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

  async void(id: number, body: { reason?: string } = {}): Promise<Invoice> {
    const result = await apiFetch<Invoice>(`${BASE}/${id}/void`, { method: 'POST', body: JSON.stringify(body) });
    return unwrap(result, 'Failed to void invoice');
  },

  async remove(id: number): Promise<void> {
    const result = await apiFetch<void>(`${BASE}/${id}`, { method: 'DELETE' });
    if (result.error) throw new Error(result.error);
  },
};

export default customerInvoicesApi;

// Payments API service — shared for Offers & Sales
import type {
  EntityType,
  Payment,
  PaymentPlan,
  CreatePaymentData,
  CreatePaymentProofData,
  PaymentProofDocument,
  CreatePaymentPlanData,
  PaymentSummary,
} from '@/modules/payments/types';
import { getAuthHeaders, getMutationHeaders, getMutationHeadersNoContentType } from '@/utils/apiHeaders';

import { API_URL } from '@/config/api';
import { isOfflineNoCache503, parseOfflineNoCacheBody } from '@/services/offline/offlineHttpRead';

const mapProof = (raw: any): PaymentProofDocument => ({
  id: String(raw.id),
  paymentId: String(raw.paymentId ?? ''),
  documentId: raw.documentId != null ? String(raw.documentId) : undefined,
  documentName: raw.documentName ?? undefined,
  documentUrl: raw.documentUrl ?? undefined,
  createdBy: raw.createdBy ?? undefined,
  createdAt: new Date(raw.createdAt),
  updatedAt: new Date(raw.updatedAt ?? raw.createdAt),
});

// ── Helpers ────────────────────────────────────────────
const mapPayment = (raw: any): Payment => ({
  id: String(raw.id),
  entityType: raw.entityType,
  entityId: String(raw.entityId),
  planId: raw.planId ? String(raw.planId) : undefined,
  installmentId: raw.installmentId ? String(raw.installmentId) : undefined,
  amount: raw.amount ?? 0,
  currency: raw.currency ?? 'TND',
  paymentMethod: raw.paymentMethod ?? 'cash',
  paymentReference: raw.paymentReference,
  paymentDate: new Date(raw.paymentDate),
  status: raw.status ?? 'completed',
  notes: raw.notes,
  receiptNumber: raw.receiptNumber,
  proofDocumentId: raw.proofDocumentId != null ? String(raw.proofDocumentId) : undefined,
  proofDocumentName: raw.proofDocumentName ?? undefined,
  proofDocumentUrl: raw.proofDocumentUrl ?? undefined,
  proofDocuments: (raw.proofDocuments ?? []).map(mapProof),

  itemAllocations: (raw.itemAllocations ?? []).map((a: any) => ({
    id: String(a.id),
    paymentId: String(a.paymentId),
    itemId: String(a.itemId),
    itemName: a.itemName,
    allocatedAmount: a.allocatedAmount ?? 0,
    itemTotal: a.itemTotal ?? 0,
    createdAt: new Date(a.createdAt),
  })),
  createdBy: raw.createdBy ?? '',
  createdByName: raw.createdByName,
  createdAt: new Date(raw.createdAt),
  updatedAt: new Date(raw.updatedAt ?? raw.createdAt),
});

const mapPlan = (raw: any): PaymentPlan => ({
  id: String(raw.id),
  entityType: raw.entityType,
  entityId: String(raw.entityId),
  name: raw.name,
  description: raw.description,
  totalAmount: raw.totalAmount ?? 0,
  currency: raw.currency ?? 'TND',
  installmentCount: raw.installmentCount ?? 0,
  status: raw.status ?? 'active',
  installments: (raw.installments ?? []).map((i: any) => ({
    id: String(i.id),
    planId: String(i.planId),
    installmentNumber: i.installmentNumber,
    amount: i.amount ?? 0,
    dueDate: new Date(i.dueDate),
    status: i.status ?? 'pending',
    paidAmount: i.paidAmount ?? 0,
    paidAt: i.paidAt ? new Date(i.paidAt) : undefined,
    notes: i.notes,
    createdAt: new Date(i.createdAt),
  })),
  createdBy: raw.createdBy ?? '',
  createdAt: new Date(raw.createdAt),
  updatedAt: new Date(raw.updatedAt ?? raw.createdAt),
});

// ── API ────────────────────────────────────────────────
export const paymentsApi = {
  // ── Payments ──
  async getPayments(entityType: EntityType, entityId: string): Promise<Payment[]> {
    const response = await fetch(
      `${API_URL}/api/${entityType}s/${entityId}/payments`,
      { method: 'GET', headers: getAuthHeaders() },
    );
    const offline = await parseOfflineNoCacheBody(response);
    if (isOfflineNoCache503(offline)) {
      return [];
    }
    if (!response.ok) {
      if (response.status === 503) {
        const err: any = new Error(offline?.message || 'Failed to fetch payments');
        err.status = 503;
        throw err;
      }
      const err: any = new Error(`Failed to fetch payments`);
      err.status = response.status;
      throw err;
    }
    const result = await response.json();
    const list = result.data?.payments ?? result.payments ?? result.data ?? (Array.isArray(result) ? result : []);
    return list.map(mapPayment);
  },

  async createPayment(data: CreatePaymentData): Promise<Payment> {
    const response = await fetch(
      `${API_URL}/api/${data.entityType}s/${data.entityId}/payments`,
      {
        method: 'POST',
        headers: getMutationHeaders(),
        body: JSON.stringify({
          amount: data.amount,
          currency: data.currency,
          paymentMethod: data.paymentMethod,
          paymentReference: data.paymentReference,
          paymentDate: data.paymentDate.toISOString(),
          notes: data.notes,
          installmentId: data.installmentId,
          proofDocumentId: data.proofDocumentId ? Number(data.proofDocumentId) : undefined,
          proofDocumentName: data.proofDocumentName,
          proofDocumentUrl: data.proofDocumentUrl,
          proofDocuments: data.proofDocuments?.length
            ? data.proofDocuments.map((p) => ({
                documentId: Number(p.documentId),
                documentName: p.documentName,
                documentUrl: p.documentUrl,
              }))
            : undefined,
          itemAllocations: data.itemAllocations,

        }),
      },
    );
    if (!response.ok) {
      const error: any = await response.json().catch(() => ({}));
      const msg = error?.error?.message || error?.message || 'Failed to create payment';
      const err: any = new Error(msg);

      err.status = response.status;
      throw err;
    }
    const result = await response.json();
    return mapPayment(result.data ?? result);
  },

  async deletePayment(entityType: EntityType, entityId: string, paymentId: string): Promise<void> {
    const response = await fetch(
      `${API_URL}/api/${entityType}s/${entityId}/payments/${paymentId}`,
      { method: 'DELETE', headers: getMutationHeaders() },
    );
    if (!response.ok) {
      const err: any = new Error('Failed to delete payment');
      err.status = response.status;
      throw err;
    }
  },

  // ── Proof documents (multiple per payment) ──
  async getProofs(entityType: EntityType, entityId: string, paymentId: string): Promise<PaymentProofDocument[]> {
    const response = await fetch(
      `${API_URL}/api/${entityType}s/${entityId}/payments/${paymentId}/proofs`,
      { method: 'GET', headers: getAuthHeaders() },
    );
    if (!response.ok) return [];
    const result = await response.json().catch(() => null);
    const proofs = result?.data?.proofs ?? result?.proofs ?? [];
    return proofs.map(mapProof);
  },

  async addProofs(
    entityType: EntityType,
    entityId: string,
    paymentId: string,
    proofs: CreatePaymentProofData[],
  ): Promise<PaymentProofDocument[]> {
    const response = await fetch(
      `${API_URL}/api/${entityType}s/${entityId}/payments/${paymentId}/proofs`,
      {
        method: 'POST',
        headers: getMutationHeaders(),
        body: JSON.stringify(
          proofs.map((p) => ({
            documentId: Number(p.documentId),
            documentName: p.documentName,
            documentUrl: p.documentUrl,
          })),
        ),
      },
    );
    if (!response.ok) {
      const error: any = await response.json().catch(() => ({}));
      const err: any = new Error(error?.error?.message || 'Failed to add proof documents');
      err.status = response.status;
      throw err;
    }
    const result = await response.json();
    return (result?.data?.proofs ?? []).map(mapProof);
  },

  async renameProof(
    entityType: EntityType,
    entityId: string,
    paymentId: string,
    proofId: string,
    documentName: string,
  ): Promise<PaymentProofDocument | null> {
    const response = await fetch(
      `${API_URL}/api/${entityType}s/${entityId}/payments/${paymentId}/proofs/${proofId}`,
      { method: 'PUT', headers: getMutationHeaders(), body: JSON.stringify({ documentName }) },
    );
    if (!response.ok) {
      const error: any = await response.json().catch(() => ({}));
      const err: any = new Error(error?.error?.message || 'Failed to rename proof document');
      err.status = response.status;
      throw err;
    }
    const result = await response.json();
    const proof = result?.data?.proof ?? result?.data;
    return proof ? mapProof(proof) : null;
  },

  async deleteProof(
    entityType: EntityType,
    entityId: string,
    paymentId: string,
    proofId: string,
  ): Promise<void> {
    const response = await fetch(
      `${API_URL}/api/${entityType}s/${entityId}/payments/${paymentId}/proofs/${proofId}`,
      { method: 'DELETE', headers: getMutationHeaders() },
    );
    if (!response.ok) {
      const err: any = new Error('Failed to delete proof document');
      err.status = response.status;
      throw err;
    }
  },


  // ── Summary ──
  async getSummary(entityType: EntityType, entityId: string): Promise<PaymentSummary> {
    const response = await fetch(
      `${API_URL}/api/${entityType}s/${entityId}/payments/summary`,
      { method: 'GET', headers: getAuthHeaders() },
    );
    const offline = await parseOfflineNoCacheBody(response);
    if (isOfflineNoCache503(offline)) {
      return {
        totalAmount: 0,
        paidAmount: 0,
        remainingAmount: 0,
        paymentStatus: 'unpaid',
        paymentCount: 0,
        lastPaymentDate: undefined,
        currency: 'TND',
      };
    }
    if (!response.ok) {
      if (response.status === 503) {
        const err: any = new Error(offline?.message || 'Failed to fetch payment summary');
        err.status = 503;
        throw err;
      }
      const err: any = new Error('Failed to fetch payment summary');
      err.status = response.status;
      throw err;
    }
    const result = await response.json();
    const d = result.data ?? result;
    return {
      totalAmount: d.totalAmount ?? 0,
      paidAmount: d.paidAmount ?? 0,
      remainingAmount: d.remainingAmount ?? 0,
      paymentStatus: d.paymentStatus ?? 'unpaid',
      paymentCount: d.paymentCount ?? 0,
      lastPaymentDate: d.lastPaymentDate ? new Date(d.lastPaymentDate) : undefined,
      currency: d.currency ?? 'TND',
    };
  },

  // ── Payment Plans ──
  async getPlans(entityType: EntityType, entityId: string): Promise<PaymentPlan[]> {
    const response = await fetch(
      `${API_URL}/api/${entityType}s/${entityId}/payment-plans`,
      { method: 'GET', headers: getAuthHeaders() },
    );
    const offline = await parseOfflineNoCacheBody(response);
    if (isOfflineNoCache503(offline)) {
      return [];
    }
    if (!response.ok) {
      if (response.status === 503) {
        const err: any = new Error(offline?.message || 'Failed to fetch payment plans');
        err.status = 503;
        throw err;
      }
      const err: any = new Error('Failed to fetch payment plans');
      err.status = response.status;
      throw err;
    }
    const result = await response.json();
    const list = result.data?.plans ?? result.plans ?? result.data ?? (Array.isArray(result) ? result : []);
    return list.map(mapPlan);
  },

  async createPlan(data: CreatePaymentPlanData): Promise<PaymentPlan> {
    const response = await fetch(
      `${API_URL}/api/${data.entityType}s/${data.entityId}/payment-plans`,
      {
        method: 'POST',
        headers: getMutationHeaders(),
        body: JSON.stringify({
          name: data.name,
          description: data.description,
          totalAmount: data.totalAmount,
          currency: data.currency,
          installments: data.installments.map((i) => ({
            amount: i.amount,
            dueDate: i.dueDate.toISOString(),
          })),
        }),
      },
    );
    if (!response.ok) {
      const error: any = await response.json().catch(() => ({}));
      const msg = error?.error?.message || error?.message || 'Failed to create plan';
      const err: any = new Error(msg);

      err.status = response.status;
      throw err;
    }
    const result = await response.json();
    return mapPlan(result.data ?? result);
  },

  async deletePlan(entityType: EntityType, entityId: string, planId: string): Promise<void> {
    const response = await fetch(
      `${API_URL}/api/${entityType}s/${entityId}/payment-plans/${planId}`,
      { method: 'DELETE', headers: getMutationHeaders() },
    );
    if (!response.ok) {
      const err: any = new Error('Failed to delete payment plan');
      err.status = response.status;
      throw err;
    }
  },

  // ── Statement (detailed report) ──
  async getStatement(entityType: EntityType, entityId: string): Promise<any> {
    const response = await fetch(
      `${API_URL}/api/${entityType}s/${entityId}/payments/statement`,
      { method: 'GET', headers: getAuthHeaders() },
    );
    const offline = await parseOfflineNoCacheBody(response);
    if (isOfflineNoCache503(offline)) {
      return { lines: [], payments: [], totals: {} };
    }
    if (!response.ok) {
      if (response.status === 503) {
        throw new Error(offline?.message || 'Failed to fetch statement');
      }
      throw new Error('Failed to fetch statement');
    }
    const result = await response.json();
    return result.data ?? result;
  },

  // ── Email Reminders ──
  async sendInstallmentReminder(entityType: EntityType, entityId: string, installmentId: string): Promise<{ success: boolean; emailSent: boolean; notificationCreated: boolean; error?: string }> {
    const response = await fetch(
      `${API_URL}/api/${entityType}s/email/send-reminder`,
      {
        method: 'POST',
        headers: getMutationHeaders(),
        body: JSON.stringify({ entityId, installmentId }),
      },
    );
    if (!response.ok) throw new Error('Failed to send reminder');
    return response.json();
  },

  // ── Payment Confirmation Email ──
  async sendPaymentConfirmation(entityType: EntityType, entityId: string, paymentId: string): Promise<{ success: boolean; emailSent: boolean; error?: string }> {
    const response = await fetch(
      `${API_URL}/api/${entityType}s/email/send-confirmation`,
      {
        method: 'POST',
        headers: getMutationHeaders(),
        body: JSON.stringify({ entityId, paymentId }),
      },
    );
    if (!response.ok) throw new Error('Failed to send confirmation');
    return response.json();
  },
};

export default paymentsApi;

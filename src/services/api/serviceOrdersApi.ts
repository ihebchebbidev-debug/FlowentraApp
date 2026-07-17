// Real API service for Service Orders management
// Migrated to use centralized apiFetch for automatic 401 retry, dedup, and logging
import { apiFetch } from '@/services/api/apiClient';
import { serviceOrderJobPaths } from '@/services/api/serviceOrderJobPaths';

// Types
export interface ServiceOrderJob {
  id: number;
  serviceOrderId: number;
  title: string;
  jobDescription: string;
  workType?: string;
  priority?: string;
  status: 'pending' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  installationId?: number;
  installationName?: string;
  saleItemId?: number;
  estimatedDuration?: number;
  estimatedCost?: number;
  actualDuration?: number;
  actualCost?: number;
  scheduledDate?: string;
  completionPercentage?: number;
  notes?: string;
}

export interface ServiceOrder {
  id: number;
  orderNumber: string;
  title?: string;
  saleId?: number;
  saleNumber?: string;
  offerId?: number;
  contactId: number;
  contactName?: string;
  status: 'draft' | 'ready_for_planning' | 'scheduled' | 'in_progress' | 'completed' | 'invoiced' | 'closed' | 'cancelled' | 'on_hold';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  serviceType?: string;
  notes?: string;
  tags?: string[];
  startDate?: string;
  targetCompletionDate?: string;
  actualCompletionDate?: string;
  estimatedCost?: number;
  actualCost?: number;
  requiresApproval?: boolean;
  approvedBy?: string;
  approvedAt?: string;
  jobs?: ServiceOrderJob[];
  createdDate?: string;
  modifiedDate?: string;
  technicallyCompletedAt?: string;
  serviceCount?: number;
  completedDispatchCount?: number;
}

/**
 * Body for POST /api/service-orders/direct — create a Service Order without
 * a parent Offer or Sale. Only contactId is required.
 */
export interface CreateDirectServiceOrderRequest {
  contactId: number;
  projectId?: number;
  serviceType?: string;
  priority?: string;
  description?: string;
  notes?: string;
  startDate?: string;
  targetCompletionDate?: string;
  estimatedDuration?: number;
  estimatedCost?: number;
  requiresApproval?: boolean;
  tags?: string[];
  customFields?: Record<string, unknown>;
  assignedTechnicianIds?: string[];
  installationIds?: string[];
  materials?: Array<{
    articleId?: number;
    name: string;
    sku?: string;
    description?: string;
    quantity: number;
    unitPrice: number;
    unit?: string;
    internalComment?: string;
    externalComment?: string;
  }>;
}

export interface UpdateServiceOrderRequest {
  orderNumber?: string;
  priority?: string;
  notes?: string;
  tags?: string[];
  targetCompletionDate?: string;
}

export interface ServiceOrderListResponse {
  success: boolean;
  data: {
    serviceOrders: ServiceOrder[];
    pagination: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    };
  };
}

export interface ServiceOrderSearchParams {
  page?: number;
  pageSize?: number;
  status?: string;
  priority?: string;
  contactId?: number;
  search?: string;
}

export interface ServiceOrderStats {
  totalServiceOrders: number;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
}

export interface PrepareInvoiceRequest {
  materialIds?: number[];
  expenseIds?: number[];
  timeEntryIds?: number[];
  dispatchMaterialIds?: number[];
  dispatchExpenseIds?: number[];
  dispatchTimeEntryIds?: number[];
  notes?: string;
}

function unwrap<T>(result: { data: T | null; status: number; error?: string }, fallbackMsg: string): T {
  if (result.error || result.data === null) {
    throw new Error(result.error || fallbackMsg);
  }
  return result.data;
}

export const serviceOrdersApi = {
  async getAll(params?: ServiceOrderSearchParams): Promise<ServiceOrderListResponse> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.pageSize) queryParams.append('pageSize', params.pageSize.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.priority) queryParams.append('priority', params.priority);
    if (params?.contactId) queryParams.append('contact_id', params.contactId.toString());
    if (params?.search) queryParams.append('search', params.search);

    const result = await apiFetch<any>(`/api/service-orders?${queryParams.toString()}`);
    const data = unwrap(result, 'Failed to fetch service orders');
    const wrapper = data?.data || data;
    return {
      success: true,
      data: {
        serviceOrders: wrapper?.serviceOrders || wrapper?.items || (Array.isArray(wrapper) ? wrapper : []),
        pagination: wrapper?.pagination || { page: 1, pageSize: 20, total: 0, totalPages: 0 },
      },
    };
  },

  async getById(id: number, includeJobs: boolean = true): Promise<ServiceOrder> {
    const result = await apiFetch<any>(`/api/service-orders/${id}?includeJobs=${includeJobs}`);
    const data = unwrap(result, 'Failed to fetch service order');
    return data.data || data;
  },

  async getJobById(serviceOrderId: number, jobId: number): Promise<ServiceOrderJob | null> {
    try {
      const result = await apiFetch<any>(serviceOrderJobPaths(serviceOrderId, jobId).base);
      if (result.data) {
        const inner = result.data as any;
        return inner.data || inner;
      }
      // Fallback: fetch service order with jobs and find the specific job
      const serviceOrder = await this.getById(serviceOrderId, true);
      if (serviceOrder.jobs && serviceOrder.jobs.length > 0) {
        return serviceOrder.jobs.find(j => j.id === jobId) || null;
      }
      return null;
    } catch (error) {
      console.warn('Failed to fetch job:', error);
      return null;
    }
  },

  // NOTE: Service-order creation from a sale is owned by `salesApi.createServiceOrder`
  // (the single live path used by the convert dialog, sales service and workflow).
  // A duplicate `createFromSale` here was dead code and has been removed.

  /**
   * Create a Service Order directly, without an originating Offer or Sale.
   * A shadow Sale is auto-generated when the order is later completed.
   */
  async createDirect(request: CreateDirectServiceOrderRequest): Promise<ServiceOrder> {
    const result = await apiFetch<any>(`/api/service-orders/direct`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
    const data = unwrap(result, 'Failed to create service order');
    return data.data || data;
  },

  async update(id: number, request: UpdateServiceOrderRequest): Promise<ServiceOrder> {
    const result = await apiFetch<any>(`/api/service-orders/${id}`, { method: 'PUT', body: JSON.stringify(request) });
    const data = unwrap(result, 'Failed to update service order');
    return data.data || data;
  },

  async updateStatus(id: number, status: string): Promise<ServiceOrder> {
    const result = await apiFetch<any>(`/api/service-orders/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) });
    const data = unwrap(result, 'Failed to update status');
    return data.data || data;
  },

  async approve(id: number): Promise<ServiceOrder> {
    const result = await apiFetch<any>(`/api/service-orders/${id}/approve`, { method: 'POST' });
    const data = unwrap(result, 'Failed to approve service order');
    return data.data || data;
  },

  async complete(id: number, actualCost?: number): Promise<ServiceOrder> {
    const result = await apiFetch<any>(`/api/service-orders/${id}/complete`, { method: 'POST', body: JSON.stringify({ actualCost }) });
    const data = unwrap(result, 'Failed to complete service order');
    return data.data || data;
  },

  async cancel(id: number, reason?: string): Promise<ServiceOrder> {
    const result = await apiFetch<any>(`/api/service-orders/${id}/cancel`, { method: 'POST', body: JSON.stringify({ reason }) });
    const data = unwrap(result, 'Failed to cancel service order');
    return data.data || data;
  },

  async delete(id: number): Promise<void> {
    const result = await apiFetch<any>(`/api/service-orders/${id}`, { method: 'DELETE' });
    if (result.error) throw new Error(result.error);
  },

  async getStatistics(): Promise<ServiceOrderStats> {
    const result = await apiFetch<any>(`/api/service-orders/statistics`);
    const data = unwrap(result, 'Failed to fetch statistics');
    return data.data || data;
  },

  // Aggregation endpoints
  async getDispatches(id: number): Promise<any[]> {
    const result = await apiFetch<any>(`/api/service-orders/${id}/dispatches`);
    if (result.error) return [];
    const data = result.data as any;
    return data?.data || data || [];
  },

  async getTimeEntries(id: number): Promise<any[]> {
    const result = await apiFetch<any>(`/api/service-orders/${id}/time-entries`);
    if (result.error) return [];
    const data = result.data as any;
    return data?.data || data || [];
  },

  async getExpenses(id: number): Promise<any[]> {
    const result = await apiFetch<any>(`/api/service-orders/${id}/expenses`);
    if (result.error) return [];
    const data = result.data as any;
    return data?.data || data || [];
  },

  async getMaterials(id: number): Promise<any[]> {
    const result = await apiFetch<any>(`/api/service-orders/${id}/materials`);
    if (result.error) return [];
    const data = result.data as any;
    return data?.data || data || [];
  },

  async getNotes(id: number): Promise<any[]> {
    const result = await apiFetch<any>(`/api/service-orders/${id}/notes`);
    if (result.error) return [];
    const data = result.data as any;
    return data?.data || data || [];
  },

  async getFullSummary(id: number): Promise<any> {
    const result = await apiFetch<any>(`/api/service-orders/${id}/full-summary`);
    const data = unwrap(result, 'Failed to fetch full summary');
    return data.data || data;
  },

  // ========== CREATE METHODS FOR SUB-ENTITIES ==========
  
  async addNote(id: number, note: { content: string; type?: string }): Promise<any> {
    const result = await apiFetch<any>(`/api/service-orders/${id}/notes`, { method: 'POST', body: JSON.stringify(note) });
    const data = unwrap(result, 'Failed to add note');
    return data.data || data;
  },

  async addTimeEntry(id: number, entry: {
    workType: string;
    startTime: string;
    endTime?: string;
    duration?: number;
    description?: string;
    billable?: boolean;
    hourlyRate?: number;
  }): Promise<any> {
    const result = await apiFetch<any>(`/api/service-orders/${id}/time-entries`, { method: 'POST', body: JSON.stringify(entry) });
    const data = unwrap(result, 'Failed to add time entry');
    return data.data || data;
  },

  async addExpense(id: number, expense: {
    type: string;
    amount: number;
    currency: string;
    description?: string;
    date: string;
  }): Promise<any> {
    const result = await apiFetch<any>(`/api/service-orders/${id}/expenses`, { method: 'POST', body: JSON.stringify(expense) });
    const data = unwrap(result, 'Failed to add expense');
    return data.data || data;
  },

  async addMaterial(id: number, material: {
    articleId?: number | string;
    articleName?: string;
    name?: string;
    sku?: string;
    description?: string;
    quantity: number;
    unitPrice: number;
    internalComment?: string;
    externalComment?: string;
    replacing?: boolean;
    oldArticleModel?: string;
    oldArticleStatus?: string;
    unit?: string;
  }): Promise<any> {
    const payload = {
      articleId: material.articleId ? parseInt(String(material.articleId)) : null,
      name: material.name || material.articleName || 'Material',
      sku: material.sku || null,
      description: material.description || null,
      quantity: material.quantity,
      unitPrice: material.unitPrice,
      internalComment: material.internalComment || null,
      externalComment: material.externalComment || null,
      replacing: material.replacing || false,
      oldArticleModel: material.oldArticleModel || null,
      oldArticleStatus: material.oldArticleStatus || null,
      unit: material.unit || null,
    };

    const result = await apiFetch<any>(`/api/service-orders/${id}/materials`, { method: 'POST', body: JSON.stringify(payload) });
    const data = unwrap(result, 'Failed to add material');
    return data.data || data;
  },

  async deleteTimeEntry(serviceOrderId: number, entryId: number): Promise<void> {
    const result = await apiFetch<any>(`/api/service-orders/${serviceOrderId}/time-entries/${entryId}`, { method: 'DELETE' });
    if (result.error) throw new Error(result.error);
  },

  async deleteExpense(serviceOrderId: number, expenseId: number): Promise<void> {
    const result = await apiFetch<any>(`/api/service-orders/${serviceOrderId}/expenses/${expenseId}`, { method: 'DELETE' });
    if (result.error) throw new Error(result.error);
  },

  async deleteMaterial(serviceOrderId: number, materialId: number): Promise<void> {
    const result = await apiFetch<any>(`/api/service-orders/${serviceOrderId}/materials/${materialId}`, { method: 'DELETE' });
    if (result.error) throw new Error(result.error);
  },

  async deleteNote(serviceOrderId: number, noteId: number): Promise<void> {
    const result = await apiFetch<any>(`/api/service-orders/${serviceOrderId}/notes/${noteId}`, { method: 'DELETE' });
    if (result.error) throw new Error(result.error);
  },

  // ========== INVOICE PREPARATION ==========

  async prepareForInvoice(id: number, invoiceData: PrepareInvoiceRequest): Promise<ServiceOrder> {
    const result = await apiFetch<any>(`/api/service-orders/${id}/prepare-invoice`, { method: 'POST', body: JSON.stringify(invoiceData) });
    const data = unwrap(result, 'Failed to prepare invoice');
    return data.data || data;
  },

  // ========== UPDATE METHODS FOR SUB-ENTITIES ==========

  async updateTimeEntry(serviceOrderId: number, entryId: number, entry: {
    workType?: string;
    startTime?: string;
    endTime?: string;
    duration?: number;
    description?: string;
    billable?: boolean;
    hourlyRate?: number;
  }): Promise<any> {
    const result = await apiFetch<any>(`/api/service-orders/${serviceOrderId}/time-entries/${entryId}`, { method: 'PUT', body: JSON.stringify(entry) });
    const data = unwrap(result, 'Failed to update time entry');
    return data.data || data;
  },

  async updateExpense(serviceOrderId: number, expenseId: number, expense: {
    type?: string;
    amount?: number;
    currency?: string;
    description?: string;
    date?: string;
  }): Promise<any> {
    const result = await apiFetch<any>(`/api/service-orders/${serviceOrderId}/expenses/${expenseId}`, { method: 'PUT', body: JSON.stringify(expense) });
    const data = unwrap(result, 'Failed to update expense');
    return data.data || data;
  },

  async updateMaterial(serviceOrderId: number, materialId: number, material: {
    name?: string;
    sku?: string;
    description?: string;
    quantity?: number;
    unitPrice?: number;
    internalComment?: string;
    externalComment?: string;
    replacing?: boolean;
    oldArticleModel?: string;
    oldArticleStatus?: string;
    status?: string;
    unit?: string;
  }): Promise<any> {
    const result = await apiFetch<any>(`/api/service-orders/${serviceOrderId}/materials/${materialId}`, { method: 'PUT', body: JSON.stringify(material) });
    const data = unwrap(result, 'Failed to update material');
    return data.data || data;
  },

  // ========== JOB STATUS MANAGEMENT ==========

  async updateJobStatus(serviceOrderId: number, jobId: number, status: string): Promise<any> {
    const paths = serviceOrderJobPaths(serviceOrderId, jobId);
    const result = await apiFetch<any>(paths.status, { method: 'PATCH', body: JSON.stringify({ status }) });
    
    if (result.error) {
      // Fallback: try PUT on the job itself
      const fallback = await apiFetch<any>(paths.base, { method: 'PUT', body: JSON.stringify({ status }) });
      const data = unwrap(fallback, 'Failed to update job status');
      return data.data || data;
    }

    const data = result.data as any;
    return data?.data || data;
  },

  // ========== JOB CRUD ==========
  // Assumes backend exposes standard REST routes:
  //   POST /api/service-orders/:soId/jobs
  //   PUT  /api/service-orders/:soId/jobs/:jobId
  // If the backend uses different verbs/paths, adjust here.
  async createJob(serviceOrderId: number, job: Partial<ServiceOrderJob> & { title: string }): Promise<ServiceOrderJob> {
    const result = await apiFetch<any>(`/api/service-orders/${serviceOrderId}/jobs`, {
      method: 'POST',
      body: JSON.stringify(job),
    });
    const data = unwrap(result, 'Failed to create job');
    return data.data || data;
  },

  async updateJob(serviceOrderId: number, jobId: number, job: Partial<ServiceOrderJob>): Promise<ServiceOrderJob> {
    const paths = serviceOrderJobPaths(serviceOrderId, jobId);
    const result = await apiFetch<any>(paths.base, {
      method: 'PUT',
      body: JSON.stringify(job),
    });
    const data = unwrap(result, 'Failed to update job');
    return data.data || data;
  },

  // Reconcile the service order's status from its dispatches. The cascade logic
  // now lives on the server (single source of truth); this just triggers it.
  async recalculateStatus(serviceOrderId: number): Promise<ServiceOrder> {
    try {
      // Best-effort background reconciliation — suppress the global error toast so a
      // missing endpoint (e.g. frontend deployed before backend) stays silent.
      const result = await apiFetch<any>(`/api/service-orders/${serviceOrderId}/recalculate-status`, {
        method: 'POST',
        headers: { 'X-Suppress-Error-Toast': 'true' },
      });
      const data = unwrap(result, 'Failed to recalculate service order status');
      return data.data || data;
    } catch (error) {
      console.warn('Failed to recalculate service order status:', error);
      return await this.getById(serviceOrderId, false);
    }
  },
};

export default serviceOrdersApi;

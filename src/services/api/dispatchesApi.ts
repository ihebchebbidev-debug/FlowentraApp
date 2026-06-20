// Real API service for Dispatches management
// Migrated to use centralized apiFetch for automatic 401 retry, dedup, and logging
import { apiFetch } from '@/services/api/apiClient';
import { API_URL } from '@/config/api';
import { getAuthHeaders } from '@/utils/apiHeaders';

// Get current user info for activity logging
const getCurrentUserName = (): string => {
  try {
    const userData = localStorage.getItem('user_data');
    if (userData) {
      const parsed = JSON.parse(userData);
      return `${parsed.firstName || ''} ${parsed.lastName || ''}`.trim() || parsed.email || 'Unknown';
    }
  } catch (error) {
    if (import.meta.env.DEV) console.error('Error parsing user data:', error);
  }
  return 'Unknown';
};

// Add activity log entry (fire and forget - don't block main operation)
const logActivity = async (
  dispatchId: number | string,
  action: string,
  oldValue?: string,
  newValue?: string
): Promise<void> => {
  try {
    await apiFetch(`/api/dispatches/${dispatchId}/history`, {
      method: 'POST',
      body: JSON.stringify({
        action,
        oldValue: oldValue || null,
        newValue: newValue || null,
        changedBy: getCurrentUserName(),
        changedAt: new Date().toISOString(),
      }),
    });
  } catch (error) {
    console.warn('Failed to log activity:', error);
  }
};

// Types
export interface TimeEntry {
  id: number;
  dispatchId: number;
  serviceOrderJobId?: number;
  technicianId: string;
  technicianName?: string;
  workType: string;
  startTime: string;
  endTime: string;
  duration?: number;
  description?: string;
  isApproved?: boolean;
  approvedBy?: string;
  approvedAt?: string;
}

export interface Expense {
  id: number;
  dispatchId: number;
  serviceOrderJobId?: number;
  technicianId: string;
  technicianName?: string;
  type: string;
  amount: number;
  currency: string;
  description?: string;
  date: string;
  isApproved?: boolean;
  approvedBy?: string;
}

export interface MaterialUsage {
  id: number;
  dispatchId: number;
  serviceOrderJobId?: number;
  articleId: string;
  articleName?: string;
  quantity: number;
  unitCost?: number;
  unitPrice?: number;
  totalPrice?: number;
  usedBy?: string;
  technicianId?: string;
  notes?: string;
  isApproved?: boolean;
  createdAt?: string;
  createdBy?: string;
  unit?: string;
}

export interface DispatchNote {
  id: number;
  dispatchId: number;
  note: string;
  createdBy: string;
  createdDate: string;
}

export interface DispatchJobSummary {
  id: number;
  title?: string;
  status?: string;
  estimatedDuration?: number;
  priority?: string;
}

export interface Dispatch {
  id: number;
  dispatchNumber: string;
  jobId: number;
  serviceOrderId?: number;
  contactId: number;
  contactName?: string;
  status: 'pending' | 'planned' | 'assigned' | 'confirmed' | 'rejected' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  scheduledDate?: string;
  scheduledStartTime?: string;
  scheduledEndTime?: string;
  actualStartTime?: string;
  actualEndTime?: string;
  siteAddress?: string;
  notes?: string;
  assignedTechnicianIds?: string[];
  assignedTechnicians?: any[];
  technicianName?: string;
  timeEntries?: TimeEntry[];
  expenses?: Expense[];
  materialsUsed?: MaterialUsage[];
  dispatchNotes?: DispatchNote[];
  dispatchedBy?: string;
  dispatchedAt?: string;
  createdDate?: string;
  createdBy?: string;
  modifiedDate?: string;
  modifiedBy?: string;
  // Multi-job / installation dispatch fields
  installationId?: number;
  installationName?: string;
  jobIds?: number[];
  jobs?: DispatchJobSummary[];
  scheduling?: {
    scheduledDate?: string;
    scheduledStartTime?: string;
    scheduledEndTime?: string;
    estimatedDuration?: number;
    travelTime?: number;
    travelDistance?: number;
  };
}

export interface CreateDispatchFromJobRequest {
  assignedTechnicianIds: string[];
  scheduledDate: string;
  scheduledStartTime?: string;  // TimeSpan format: "HH:mm:ss"
  scheduledEndTime?: string;    // TimeSpan format: "HH:mm:ss"
  priority?: string;
  notes?: string;
  siteAddress?: string;
}

export interface CreateDispatchFromInstallationRequest {
  installationId: number;
  installationName: string;
  jobIds: number[];
  assignedTechnicianIds: string[];
  scheduledDate: string;
  scheduledStartTime?: string;  // TimeSpan format: "HH:mm:ss"
  scheduledEndTime?: string;    // TimeSpan format: "HH:mm:ss"
  priority?: string;
  notes?: string;
  siteAddress?: string;
  contactId?: number;
  serviceOrderId?: number;
}

export interface CreateDispatchFromServiceOrderRequest {
  serviceOrderId: number;
  jobIds?: number[];            // optional: omit/empty = all jobs on the service order
  assignedTechnicianIds: string[];
  scheduledDate: string;
  scheduledStartTime?: string;  // TimeSpan format: "HH:mm:ss"
  scheduledEndTime?: string;    // TimeSpan format: "HH:mm:ss"
  priority?: string;
  notes?: string;
  siteAddress?: string;
  contactId?: number;
}

export interface UpdateDispatchRequest {
  dispatchNumber?: string;
  priority?: string;
  scheduledDate?: string;
  scheduledStartTime?: string;  // TimeSpan format: "HH:mm:ss"
  scheduledEndTime?: string;    // TimeSpan format: "HH:mm:ss"
  notes?: string;
  siteAddress?: string;
  estimatedDuration?: number;
  status?: string;
}

export interface DispatchListResponse {
  success: boolean;
  data: Dispatch[];
  totalItems?: number;
  pageNumber?: number;
  pageSize?: number;
}

export interface DispatchSearchParams {
  pageNumber?: number;
  pageSize?: number;
  status?: string;
  priority?: string;
  technicianId?: string;
  dateFrom?: string;
  dateTo?: string;
  startDate?: string;
  endDate?: string;
}

export interface DispatchStats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  cancelled: number;
}

function unwrap<T>(result: { data: T | null; status: number; error?: string }, fallbackMsg: string): T {
  if (result.error || result.data === null) {
    throw new Error(result.error || fallbackMsg);
  }
  return result.data;
}

// Helper to get user name from localStorage
const getUserName = () => {
  try {
    const userData = localStorage.getItem('user_data');
    if (userData) {
      const parsed = JSON.parse(userData);
      return `${parsed.firstName || ''} ${parsed.lastName || ''}`.trim() || 'Unknown';
    }
  } catch (error) {
    if (import.meta.env.DEV) console.error('Error parsing user data:', error);
  }
  return 'Unknown';
};

export const dispatchesApi = {
  async getAll(params?: DispatchSearchParams): Promise<DispatchListResponse> {
    const queryParams = new URLSearchParams();
    if (params?.pageNumber) queryParams.append('pageNumber', params.pageNumber.toString());
    if (params?.pageSize) queryParams.append('pageSize', params.pageSize.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.priority) queryParams.append('priority', params.priority);
    if (params?.technicianId) queryParams.append('technicianId', params.technicianId);

    const dateFrom = params?.dateFrom || params?.startDate;
    const dateTo = params?.dateTo || params?.endDate;
    if (dateFrom) queryParams.append('dateFrom', dateFrom);
    if (dateTo) queryParams.append('dateTo', dateTo);

    const result = await apiFetch<any>(`/api/dispatches?${queryParams.toString()}`);
    const data = unwrap(result, 'Failed to fetch dispatches');
    const dispatches = data?.data || data?.items || (Array.isArray(data) ? data : []);
    return {
      success: true,
      data: dispatches,
      totalItems: data?.totalItems || dispatches.length,
      pageNumber: data?.pageNumber || 1,
      pageSize: data?.pageSize || 50,
    };
  },

  async getById(id: number): Promise<Dispatch> {
    const result = await apiFetch<any>(`/api/dispatches/${id}`);
    const data = unwrap(result, 'Failed to fetch dispatch');
    return data.data || data;
  },

  async createFromJob(jobId: number, request: CreateDispatchFromJobRequest): Promise<Dispatch> {
    const result = await apiFetch<any>(`/api/dispatches/from-job/${jobId}`, { method: 'POST', body: JSON.stringify(request) });
    const data = unwrap(result, 'Failed to create dispatch');
    return data.data || data;
  },

  async createFromInstallation(request: CreateDispatchFromInstallationRequest): Promise<Dispatch> {
    const result = await apiFetch<any>('/api/dispatches/from-installation', {
      method: 'POST',
      body: JSON.stringify(request)
    });
    const data = unwrap(result, 'Failed to create dispatch from installation');
    return data.data || data;
  },

  async createFromServiceOrder(request: CreateDispatchFromServiceOrderRequest): Promise<Dispatch> {
    const result = await apiFetch<any>('/api/dispatches/from-service-order', {
      method: 'POST',
      body: JSON.stringify(request)
    });
    const data = unwrap(result, 'Failed to create dispatch from service order');
    return data.data || data;
  },

  async update(id: number, request: UpdateDispatchRequest): Promise<Dispatch> {
    const result = await apiFetch<any>(`/api/dispatches/${id}`, { method: 'PUT', body: JSON.stringify(request) });
    const data = unwrap(result, 'Failed to update dispatch');
    return data.data || data;
  },

  async updateStatus(id: number, status: string, oldStatus?: string): Promise<Dispatch> {
    const result = await apiFetch<any>(`/api/dispatches/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
    const data = unwrap(result, 'Failed to update status');
    const dispatch = data.data || data;
    logActivity(id, 'status_changed', oldStatus, status);
    return dispatch;
  },

  async start(id: number, actualStartTime?: string): Promise<Dispatch> {
    const result = await apiFetch<any>(`/api/dispatches/${id}/start`, {
      method: 'POST',
      body: JSON.stringify({ actualStartTime: actualStartTime || new Date().toISOString() }),
    });
    const data = unwrap(result, 'Failed to start dispatch');
    const dispatch = data.data || data;
    logActivity(id, 'started', undefined, 'in_progress');
    return dispatch;
  },

  async complete(id: number, actualEndTime?: string, notes?: string, completionPercentage = 100): Promise<Dispatch> {
    const result = await apiFetch<any>(`/api/dispatches/${id}/complete`, {
      method: 'POST',
      body: JSON.stringify({
        actualEndTime: actualEndTime || new Date().toISOString(),
        completionPercentage,
        completionNotes: notes,
      }),
    });
    const data = unwrap(result, 'Failed to complete dispatch');
    const dispatch = data.data || data;
    logActivity(id, 'completed', 'in_progress', 'completed');
    return dispatch;
  },

  async delete(id: number): Promise<void> {
    const result = await apiFetch<any>(`/api/dispatches/${id}`, { method: 'DELETE' });
    if (result.error) throw new Error(result.error);
  },

  async getStatistics(): Promise<DispatchStats> {
    const result = await apiFetch<any>(`/api/dispatches/statistics`);
    const data = unwrap(result, 'Failed to fetch statistics');
    return data.data || data;
  },

  // Time Entries
  async addTimeEntry(dispatchId: number, entry: {
    technicianId: string;
    technicianName?: string;
    serviceOrderJobId?: number;
    workType: string;
    startTime: string;
    endTime: string;
    description?: string;
    billable?: boolean;
    hourlyRate?: number;
    overrunReason?: string;
  }): Promise<TimeEntry> {
    const payload = {
      technicianId: entry.technicianId,
      technicianName: entry.technicianName || getUserName(),
      serviceOrderJobId: entry.serviceOrderJobId ?? null,
      workType: entry.workType,
      startTime: entry.startTime,
      endTime: entry.endTime,
      description: entry.description || null,
      billable: entry.billable ?? true,
      hourlyRate: entry.hourlyRate ?? null,
      overrunReason: entry.overrunReason || null,
    };

    const result = await apiFetch<any>(`/api/dispatches/${dispatchId}/time-entries`, { method: 'POST', body: JSON.stringify(payload) });
    const data = unwrap(result, 'Failed to add time entry');
    const timeEntry = data.data || data;

    const duration = entry.startTime && entry.endTime
      ? `${entry.workType} - ${entry.description || 'Time logged'}`
      : entry.workType;
    logActivity(dispatchId, 'time_entry_added', undefined, duration);

    return timeEntry;
  },

  async getTimeEntries(dispatchId: number): Promise<TimeEntry[]> {
    const result = await apiFetch<any>(`/api/dispatches/${dispatchId}/time-entries`);
    if (result.error) return [];
    const data = result.data as any;
    return Array.isArray(data) ? data : (data?.data || []);
  },

  async approveTimeEntry(dispatchId: number, timeEntryId: number): Promise<void> {
    const result = await apiFetch<any>(`/api/dispatches/${dispatchId}/time-entries/${timeEntryId}/approve`, {
      method: 'POST',
      body: JSON.stringify({ approvedBy: getUserName() }),
    });
    if (result.error) throw new Error(result.error || 'Failed to approve time entry');
  },

  async updateTimeEntry(dispatchId: number, timeEntryId: number, entry: {
    technicianId?: string;
    technicianName?: string;
    workType?: string;
    startTime?: string;
    endTime?: string;
    description?: string;
    billable?: boolean;
  }): Promise<TimeEntry> {
    const result = await apiFetch<any>(`/api/dispatches/${dispatchId}/time-entries/${timeEntryId}`, { method: 'PUT', body: JSON.stringify(entry) });
    const data = unwrap(result, 'Failed to update time entry');
    return data.data || data;
  },

  async deleteTimeEntry(dispatchId: number, timeEntryId: number): Promise<void> {
    const result = await apiFetch<any>(`/api/dispatches/${dispatchId}/time-entries/${timeEntryId}`, { method: 'DELETE' });
    if (result.error) throw new Error(result.error || 'Failed to delete time entry');
  },

  // Expenses
  async addExpense(dispatchId: number, expense: {
    technicianId: string;
    technicianName?: string;
    serviceOrderJobId?: number;
    type: string;
    amount: number;
    currency: string;
    description?: string;
    date: string;
    overrunReason?: string;
  }): Promise<Expense> {
    const payload = {
      technicianId: expense.technicianId,
      technicianName: expense.technicianName || getUserName(),
      serviceOrderJobId: expense.serviceOrderJobId ?? null,
      type: expense.type,
      amount: expense.amount,
      currency: expense.currency || 'USD',
      description: expense.description || null,
      date: expense.date,
      overrunReason: expense.overrunReason || null,
    };

    const result = await apiFetch<any>(`/api/dispatches/${dispatchId}/expenses`, { method: 'POST', body: JSON.stringify(payload) });
    const data = unwrap(result, 'Failed to add expense');
    const expenseResult = data.data || data;

    const expenseDetails = `${expense.type} - ${expense.amount} ${expense.currency}`;
    logActivity(dispatchId, 'expense_added', undefined, expenseDetails);

    return expenseResult;
  },

  async getExpenses(dispatchId: number): Promise<Expense[]> {
    const result = await apiFetch<any>(`/api/dispatches/${dispatchId}/expenses`);
    if (result.error) return [];
    const data = result.data as any;
    return Array.isArray(data) ? data : (data?.data || []);
  },

  async approveExpense(dispatchId: number, expenseId: number): Promise<void> {
    const result = await apiFetch<any>(`/api/dispatches/${dispatchId}/expenses/${expenseId}/approve`, {
      method: 'POST',
      body: JSON.stringify({ approvedBy: getUserName() }),
    });
    if (result.error) throw new Error(result.error || 'Failed to approve expense');
  },

  async updateExpense(dispatchId: number, expenseId: number, expense: {
    technicianId?: string;
    technicianName?: string;
    type?: string;
    amount?: number;
    currency?: string;
    description?: string;
    date?: string;
  }): Promise<Expense> {
    const result = await apiFetch<any>(`/api/dispatches/${dispatchId}/expenses/${expenseId}`, { method: 'PUT', body: JSON.stringify(expense) });
    const data = unwrap(result, 'Failed to update expense');
    return data.data || data;
  },

  async deleteExpense(dispatchId: number, expenseId: number): Promise<void> {
    const result = await apiFetch<any>(`/api/dispatches/${dispatchId}/expenses/${expenseId}`, { method: 'DELETE' });
    if (result.error) throw new Error(result.error || 'Failed to delete expense');
  },

  // Materials
  async addMaterial(dispatchId: number, material: {
    articleId: string;
    articleName?: string;
    serviceOrderJobId?: number;
    quantity: number;
    unitPrice?: number;
    usedBy: string;
    notes?: string;
    internalComment?: string;
    replacing?: boolean;
    oldArticleModel?: string;
    description?: string;
    unit?: string;
  }): Promise<MaterialUsage> {
    const result = await apiFetch<any>(`/api/dispatches/${dispatchId}/materials`, { method: 'POST', body: JSON.stringify(material) });
    const data = unwrap(result, 'Failed to add material');
    const materialResult = data.data || data;

    const materialDetails = material.articleName
      ? `${material.articleName} x${material.quantity}`
      : `Material x${material.quantity}`;
    logActivity(dispatchId, 'material_added', undefined, materialDetails);

    return materialResult;
  },

  async getMaterials(dispatchId: number): Promise<MaterialUsage[]> {
    const result = await apiFetch<any>(`/api/dispatches/${dispatchId}/materials`);
    if (result.error) return [];
    const data = result.data as any;
    return Array.isArray(data) ? data : (data?.data || []);
  },

  async approveMaterial(dispatchId: number, materialId: number): Promise<void> {
    const result = await apiFetch<any>(`/api/dispatches/${dispatchId}/materials/${materialId}/approve`, {
      method: 'POST',
      body: JSON.stringify({ approvedBy: getUserName() }),
    });
    if (result.error) throw new Error(result.error || 'Failed to approve material');
  },

  async updateMaterial(dispatchId: number, materialId: number, material: {
    articleId?: string;
    quantity?: number;
    unitPrice?: number;
    description?: string;
    internalComment?: string;
    replacing?: boolean;
    oldArticleModel?: string;
    unit?: string;
  }): Promise<MaterialUsage> {
    const result = await apiFetch<any>(`/api/dispatches/${dispatchId}/materials/${materialId}`, { method: 'PUT', body: JSON.stringify(material) });
    const data = unwrap(result, 'Failed to update material');
    return data.data || data;
  },

  async deleteMaterial(dispatchId: number, materialId: number): Promise<void> {
    const result = await apiFetch<any>(`/api/dispatches/${dispatchId}/materials/${materialId}`, { method: 'DELETE' });
    if (result.error) throw new Error(result.error || 'Failed to delete material');
  },

  // Notes
  async getNotes(dispatchId: number): Promise<DispatchNote[]> {
    const result = await apiFetch<any>(`/api/dispatches/${dispatchId}/notes`);
    if (result.error) return [];
    const data = result.data as any;
    return Array.isArray(data) ? data : (data?.data || []);
  },

  async addNote(dispatchId: number, note: string, category?: string): Promise<DispatchNote> {
    const result = await apiFetch<any>(`/api/dispatches/${dispatchId}/notes`, {
      method: 'POST',
      body: JSON.stringify({ content: note, category: category || 'general' }),
    });
    const data = unwrap(result, 'Failed to add note');
    return data.data || data;
  },

  // Get dispatch activity/history log
  async getActivityLog(dispatchId: number): Promise<DispatchActivityLog[]> {
    const result = await apiFetch<any>(`/api/dispatches/${dispatchId}/history`);
    if (result.error) return [];
    const data = result.data as any;
    return Array.isArray(data) ? data : (data?.data || []);
  },

  // Get dispatch history (all dispatches including deleted/cancelled)
  async getHistory(params?: { includeDeleted?: boolean; jobId?: number; serviceOrderId?: number }): Promise<Dispatch[]> {
    const queryParams = new URLSearchParams();
    queryParams.append('pageSize', '500');
    if (params?.includeDeleted) queryParams.append('includeDeleted', 'true');
    if (params?.jobId) queryParams.append('jobId', params.jobId.toString());
    if (params?.serviceOrderId) queryParams.append('serviceOrderId', params.serviceOrderId.toString());

    const result = await apiFetch<any>(`/api/dispatches?${queryParams.toString()}`);
    if (result.error) return [];
    const data = result.data as any;
    return data?.data || data?.items || (Array.isArray(data) ? data : []);
  },
};

// Activity log type
export interface DispatchActivityLog {
  id: number;
  dispatchId: number;
  action: string;
  oldValue?: string;
  newValue?: string;
  changedBy?: string;
  changedAt: string;
  metadata?: string;
}

export default dispatchesApi;

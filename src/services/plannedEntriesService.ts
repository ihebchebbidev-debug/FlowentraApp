// Planned line entries — predefined time & expenses authored on offer/sale lines
// that flow through to service order jobs and gate dispatch overruns.
import { apiFetch } from './api/apiClient';

export type PlannedEntryKind = 'time' | 'expense';
export type PlannedExpenseType = 'travel' | 'per_diem' | 'materials' | 'subcontractor';
export type PlannedParentType = 'offer_item' | 'sale_item' | 'service_order_job';

export interface PlannedLineEntry {
  id: number;
  parentType: PlannedParentType;
  parentId: number;
  originOfferItemId?: number | null;
  kind: PlannedEntryKind;
  plannedMinutes?: number | null;
  technicianCount?: number | null;
  hourlyRate?: number | null;
  expenseType?: PlannedExpenseType | null;
  plannedAmount?: number | null;
  currency?: string | null;
  description?: string | null;
}

export interface CreatePlannedLineEntry {
  kind: PlannedEntryKind;
  plannedMinutes?: number | null;
  technicianCount?: number | null;
  hourlyRate?: number | null;
  expenseType?: PlannedExpenseType | null;
  plannedAmount?: number | null;
  currency?: string | null;
  description?: string | null;
}

export interface PlanVsActualBucket {
  expenseType: string;
  planned: number;
  actual: number;
}

export interface PlanVsActual {
  jobId: number;
  plannedMinutes: number;
  actualMinutes: number;
  plannedExpenseTotal: number;
  actualExpenseTotal: number;
  expenseBuckets: PlanVsActualBucket[];
}

const BASE = '/api/planned-entries';

export const plannedEntriesApi = {
  async list(parentType: PlannedParentType, parentId: number | string): Promise<PlannedLineEntry[]> {
    const res = await apiFetch<PlannedLineEntry[]>(`${BASE}?parentType=${parentType}&parentId=${parentId}`);
    return res.data ?? [];
  },

  async create(parentType: PlannedParentType, parentId: number | string, dto: CreatePlannedLineEntry): Promise<PlannedLineEntry> {
    const res = await apiFetch<PlannedLineEntry>(
      `${BASE}?parentType=${parentType}&parentId=${parentId}`,
      { method: 'POST', body: JSON.stringify(dto) }
    );
    if (!res.data) throw new Error(res.error || 'Failed to create planned entry');
    return res.data;
  },

  async update(id: number, dto: CreatePlannedLineEntry): Promise<PlannedLineEntry> {
    const res = await apiFetch<PlannedLineEntry>(`${BASE}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(dto),
    });
    if (!res.data) throw new Error(res.error || 'Failed to update planned entry');
    return res.data;
  },

  async remove(id: number): Promise<void> {
    await apiFetch<void>(`${BASE}/${id}`, { method: 'DELETE' });
  },

  async planVsActual(serviceOrderJobId: number | string): Promise<PlanVsActual | null> {
    const res = await apiFetch<PlanVsActual>(`${BASE}/plan-vs-actual/${serviceOrderJobId}`);
    return res.data;
  },
};

// Helpers
export const formatPlannedMinutes = (mins: number): string => {
  if (!mins || mins <= 0) return '0h';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, '0')}`;
};

export const sumPlannedMinutes = (entries: PlannedLineEntry[]): number =>
  entries
    .filter(e => e.kind === 'time')
    .reduce((s, e) => s + (e.plannedMinutes ?? 0) * (e.technicianCount ?? 1), 0);

export const sumPlannedExpenses = (entries: PlannedLineEntry[]): number =>
  entries
    .filter(e => e.kind === 'expense')
    .reduce((s, e) => s + (e.plannedAmount ?? 0), 0);

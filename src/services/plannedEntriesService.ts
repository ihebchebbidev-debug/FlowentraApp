// Planned line entries — predefined time & expenses authored on offer/sale lines
// that flow through to service order jobs and gate dispatch overruns.
import { apiFetch } from './api/apiClient';
import { toast } from 'sonner';
import i18n from '@/lib/i18n';

export type PlannedEntryKind = 'time' | 'expense' | 'material';
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
  plannedDate?: string | null;
  expenseType?: PlannedExpenseType | null;
  plannedAmount?: number | null;
  currency?: string | null;
  description?: string | null;
  articleId?: number | null;
  articleName?: string | null;
  quantity?: number | null;
  unitPrice?: number | null;
  unit?: string | null;
  /**
   * Backend-reported reason when the primary write succeeded but the
   * bidirectional propagation to linked offer / sale / service-order-job
   * planned entries failed. Surfaced to the user via a toast.
   */
  syncWarning?: string | null;
}

export interface CreatePlannedLineEntry {
  kind: PlannedEntryKind;
  plannedMinutes?: number | null;
  technicianCount?: number | null;
  hourlyRate?: number | null;
  plannedDate?: string | null;
  expenseType?: PlannedExpenseType | null;
  plannedAmount?: number | null;
  currency?: string | null;
  description?: string | null;
  articleId?: number | null;
  articleName?: string | null;
  quantity?: number | null;
  unitPrice?: number | null;
  unit?: string | null;
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
  plannedMaterialTotal: number;
  actualMaterialTotal: number;
  expenseBuckets: PlanVsActualBucket[];
}

const BASE = '/api/planned-entries';

/**
 * Surface a bilingual (EN/FR via i18n) toast including the exact backend
 * reason when planning propagation between offer / sale / service-order-job
 * fails. The primary write itself already succeeded — this is a
 * consistency warning, not a hard failure.
 */
export function notifyPlanningSyncWarning(reason?: string | null): void {
  if (!reason) return;
  const title = i18n.t('planning.syncFailedToast', {
    defaultValue: 'Planning sync failed — related views may be out of date',
  });
  toast.error(title, { description: reason, duration: 8000 });
}

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
    notifyPlanningSyncWarning(res.data.syncWarning);
    return res.data;
  },

  async update(id: number, dto: CreatePlannedLineEntry): Promise<PlannedLineEntry> {
    const res = await apiFetch<PlannedLineEntry>(`${BASE}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(dto),
    });
    if (!res.data) throw new Error(res.error || 'Failed to update planned entry');
    notifyPlanningSyncWarning(res.data.syncWarning);
    return res.data;
  },

  async remove(id: number): Promise<void> {
    const res = await apiFetch<{ syncWarning?: string | null }>(`${BASE}/${id}`, { method: 'DELETE' });
    notifyPlanningSyncWarning(res.data?.syncWarning);
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

export const sumPlannedMaterials = (entries: PlannedLineEntry[]): number =>
  entries
    .filter(e => e.kind === 'material')
    .reduce((s, e) => s + (e.quantity ?? 0) * (e.unitPrice ?? 0), 0);

import type { DealStage } from '@/services/api/dealsApi';

/** Ordered pipeline stages with their badge colors (used by list, kanban, detail). */
export const DEAL_STAGES: { id: DealStage; color: string; badge: string }[] = [
  { id: 'lead',        color: '#64748b', badge: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
  { id: 'qualified',   color: '#0ea5e9', badge: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300' },
  { id: 'proposal',    color: '#a855f7', badge: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' },
  { id: 'negotiation', color: '#f59e0b', badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
  { id: 'won',         color: '#16a34a', badge: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' },
  { id: 'lost',        color: '#ef4444', badge: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' },
];

export const OPEN_STAGES: DealStage[] = ['lead', 'qualified', 'proposal', 'negotiation'];

export function stageBadgeClass(stage: string): string {
  return DEAL_STAGES.find(s => s.id === stage)?.badge ?? DEAL_STAGES[0].badge;
}

export function stageColor(stage: string): string {
  return DEAL_STAGES.find(s => s.id === stage)?.color ?? DEAL_STAGES[0].color;
}

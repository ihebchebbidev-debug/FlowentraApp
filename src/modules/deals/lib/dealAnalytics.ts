import type { Deal } from '@/services/api/dealsApi';
import { OPEN_STAGES } from './dealStages';

/** A deal is "at risk" while still open if its follow-up or expected close is past,
 *  or it has gone quiet (no activity for STALE_DAYS). */
export const STALE_DAYS = 14;

const daysSince = (iso?: string | null): number | null => {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  return Math.floor((Date.now() - t) / 86_400_000);
};

export const isOpenDeal = (d: Deal) => OPEN_STAGES.includes(d.stage);

/** Overdue next-action (follow-up date in the past) on an open deal. */
export const isFollowUpOverdue = (d: Deal): boolean => {
  if (!isOpenDeal(d) || !d.nextActionDate) return false;
  const days = daysSince(d.nextActionDate);
  return days !== null && days > 0;
};

/** No logged activity for STALE_DAYS (falls back to created date). */
export const isStale = (d: Deal): boolean => {
  if (!isOpenDeal(d)) return false;
  const days = daysSince(d.lastActivity || d.updatedAt || d.createdAt);
  return days !== null && days >= STALE_DAYS;
};

/** Past its expected close date but still open. */
export const isPastClose = (d: Deal): boolean => {
  if (!isOpenDeal(d) || !d.expectedCloseDate) return false;
  const days = daysSince(d.expectedCloseDate);
  return days !== null && days > 0;
};

export const isAtRisk = (d: Deal): boolean => isFollowUpOverdue(d) || isStale(d) || isPastClose(d);

export interface DealForecast {
  /** Σ value for open deals. */
  openValue: number;
  /** Σ (value × probability) for open deals — the realistic forecast. */
  weightedValue: number;
  /** Per open-stage breakdown for the funnel. */
  funnel: { stage: string; count: number; value: number }[];
  /** Count of open deals that need attention. */
  atRisk: number;
  /** Count of open deals with an overdue follow-up. */
  overdueFollowUps: number;
  /** Average age (days) of open deals. */
  avgAgeDays: number;
  openCount: number;
}

export function computeForecast(deals: Deal[]): DealForecast {
  const open = deals.filter(isOpenDeal);
  const openValue = open.reduce((s, d) => s + (d.estimatedValue || 0), 0);
  const weightedValue = open.reduce((s, d) => s + (d.estimatedValue || 0) * ((d.probability || 0) / 100), 0);

  const funnel = OPEN_STAGES.map(stage => {
    const inStage = open.filter(d => d.stage === stage);
    return {
      stage,
      count: inStage.length,
      value: inStage.reduce((s, d) => s + (d.estimatedValue || 0), 0),
    };
  });

  const ages = open.map(d => daysSince(d.createdAt)).filter((n): n is number => n !== null);
  const avgAgeDays = ages.length ? Math.round(ages.reduce((s, n) => s + n, 0) / ages.length) : 0;

  return {
    openValue,
    weightedValue: Math.round(weightedValue),
    funnel,
    atRisk: open.filter(isAtRisk).length,
    overdueFollowUps: open.filter(isFollowUpOverdue).length,
    avgAgeDays,
    openCount: open.length,
  };
}

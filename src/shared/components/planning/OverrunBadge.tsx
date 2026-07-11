import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle2, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  formatPlannedMinutes,
  sumPlannedMinutes,
  sumPlannedExpenses,
  sumPlannedMaterials,
  type PlannedParentType,
} from '@/services/plannedEntriesService';
import { usePlannedEntries } from './usePlannedEntries';

/**
 * Visual overrun indicator for Plan vs Actual comparisons.
 *
 * - Green  → actual ≤ planned (on plan)
 * - Amber  → 100% < actual ≤ 110% (near / over limit)
 * - Red    → actual > 110% (clearly over budget)
 *
 * Renders nothing when no plan is set (planned <= 0) so pages that
 * don't use planning stay clean.
 */
interface OverrunBadgeProps {
  planned: number;
  actual: number;
  variant?: 'time' | 'money';
  currency?: string;
  className?: string;
}

export function OverrunBadge({
  planned,
  actual,
  variant = 'money',
  currency = 'TND',
  className,
}: OverrunBadgeProps) {
  const { t } = useTranslation();

  if (planned <= 0) return null;

  const fmt = (n: number) =>
    variant === 'time'
      ? formatPlannedMinutes(Math.max(0, Math.round(n)))
      : `${(n || 0).toFixed(2)} ${currency}`;

  const ratio = actual / planned;
  const pct = Math.round(ratio * 100);
  const delta = actual - planned;

  let tone: 'ok' | 'warn' | 'over' = 'ok';
  if (ratio > 1.1) tone = 'over';
  else if (ratio > 1) tone = 'warn';

  const toneClasses: Record<typeof tone, string> = {
    ok: 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300',
    warn: 'border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300',
    over: 'border-red-300 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300',
  };
  const Icon = tone === 'ok' ? CheckCircle2 : tone === 'warn' ? TrendingUp : AlertTriangle;

  const label =
    tone === 'ok'
      ? t('planning.overrun.onPlan', 'On plan')
      : tone === 'warn'
        ? t('planning.overrun.nearLimit', 'Near limit')
        : t('planning.overrun.overBudget', 'Over budget');

  return (
    <Badge
      variant="outline"
      title={label}
      className={cn('gap-1 whitespace-nowrap font-medium', toneClasses[tone], className)}
    >
      <Icon className="h-3 w-3" />
      <span>
        {fmt(actual)} / {fmt(planned)}
      </span>
      <span className="opacity-70">({pct}%)</span>
      {tone === 'over' && (
        <span className="opacity-80">
          {t('planning.overrun.over', 'over by')} {fmt(delta)}
        </span>
      )}
    </Badge>
  );
}

/**
 * Convenience wrapper: fetches planned entries for the given parents and
 * renders an OverrunBadge for the chosen kind. Use in tab headers so the
 * indicator sits right next to "Time Tracking" / "Expenses" / "Materials".
 */
interface PlannedTotalsBadgeProps {
  parentType: PlannedParentType;
  parentIds: Array<number | string | null | undefined>;
  kind: 'time' | 'expense' | 'material';
  actual: number;
  currency?: string;
  className?: string;
}

export function PlannedTotalsBadge({
  parentType,
  parentIds,
  kind,
  actual,
  currency,
  className,
}: PlannedTotalsBadgeProps) {
  const { entries } = usePlannedEntries(parentType, parentIds);
  const planned =
    kind === 'time'
      ? sumPlannedMinutes(entries)
      : kind === 'expense'
        ? sumPlannedExpenses(entries)
        : sumPlannedMaterials(entries);

  return (
    <OverrunBadge
      planned={planned}
      actual={actual}
      variant={kind === 'time' ? 'time' : 'money'}
      currency={currency}
      className={className}
    />
  );
}

export default OverrunBadge;
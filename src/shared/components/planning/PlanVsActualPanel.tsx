import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Clock, Wallet, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { plannedEntriesApi, type PlanVsActual, formatPlannedMinutes } from '@/services/plannedEntriesService';

interface Props {
  serviceOrderJobId: number | string;
  currency?: string;
}

const colorFor = (pct: number) =>
  pct < 80 ? 'bg-emerald-500' : pct <= 100 ? 'bg-amber-500' : 'bg-destructive';

export function PlanVsActualPanel({ serviceOrderJobId, currency = 'TND' }: Props) {
  const { t } = useTranslation();
  const [data, setData] = useState<PlanVsActual | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    plannedEntriesApi.planVsActual(serviceOrderJobId)
      .then(d => { if (!cancelled) setData(d); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [serviceOrderJobId]);

  if (loading) return <Card><CardContent className="p-4 text-sm text-muted-foreground">{t('loading', 'Loading…')}</CardContent></Card>;
  if (!data || (data.plannedMinutes === 0 && data.plannedExpenseTotal === 0 && data.actualMinutes === 0 && data.actualExpenseTotal === 0)) {
    return null;
  }

  const timePct = data.plannedMinutes > 0 ? (data.actualMinutes / data.plannedMinutes) * 100 : 0;
  const expPct = data.plannedExpenseTotal > 0 ? (data.actualExpenseTotal / data.plannedExpenseTotal) * 100 : 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          {t('planning.planVsActual', 'Plan vs Actual')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Time */}
        <div>
          <div className="flex items-center justify-between mb-1.5 text-sm">
            <div className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              <span>{t('planning.time', 'Time')}</span>
            </div>
            <span className="font-medium tabular-nums">
              {formatPlannedMinutes(data.actualMinutes)} / {formatPlannedMinutes(data.plannedMinutes)}
              {data.plannedMinutes > 0 && (
                <Badge variant={timePct > 100 ? 'destructive' : 'secondary'} className="ml-2">
                  {timePct.toFixed(0)}%
                </Badge>
              )}
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className={`h-full ${colorFor(timePct)}`} style={{ width: `${Math.min(timePct, 100)}%` }} />
          </div>
        </div>

        {/* Expenses total */}
        <div>
          <div className="flex items-center justify-between mb-1.5 text-sm">
            <div className="flex items-center gap-2">
              <Wallet className="h-3.5 w-3.5 text-muted-foreground" />
              <span>{t('planning.expenses', 'Expenses')}</span>
            </div>
            <span className="font-medium tabular-nums">
              {data.actualExpenseTotal.toFixed(2)} / {data.plannedExpenseTotal.toFixed(2)} {currency}
              {data.plannedExpenseTotal > 0 && (
                <Badge variant={expPct > 100 ? 'destructive' : 'secondary'} className="ml-2">
                  {expPct.toFixed(0)}%
                </Badge>
              )}
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className={`h-full ${colorFor(expPct)}`} style={{ width: `${Math.min(expPct, 100)}%` }} />
          </div>
        </div>

        {/* Per-bucket breakdown */}
        {data.expenseBuckets.length > 0 && (
          <div className="pt-2 border-t space-y-1.5">
            {data.expenseBuckets.map(b => {
              const pct = b.planned > 0 ? (b.actual / b.planned) * 100 : 0;
              return (
                <div key={b.expenseType} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{t(`planning.expenseTypes.${b.expenseType}`, b.expenseType)}</span>
                  <span className={pct > 100 ? 'text-destructive font-medium' : ''}>
                    {b.actual.toFixed(2)} / {b.planned.toFixed(2)} {currency}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default PlanVsActualPanel;

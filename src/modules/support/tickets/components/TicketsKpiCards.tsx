import React from 'react';
import { Card } from '@/components/ui/card';
import { useTranslation } from 'react-i18next';
import type { TicketKpis } from '../hooks/useTicketsData';
import { AlertTriangle, Clock, CheckCircle2, XCircle, TicketCheck, Flame, TrendingUp, TrendingDown, Users, Timer } from 'lucide-react';

interface Props {
  kpis: TicketKpis;
  scope: 'user' | 'admin';
}

interface KpiCardProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  hint?: React.ReactNode;
  accent?: 'primary' | 'success' | 'warning' | 'destructive' | 'muted';
}

const accentBg: Record<NonNullable<KpiCardProps['accent']>, string> = {
  primary: 'bg-primary/10 text-primary',
  success: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  destructive: 'bg-red-500/10 text-red-600 dark:text-red-400',
  muted: 'bg-muted text-muted-foreground',
};

function KpiCard({ icon: Icon, label, value, hint, accent = 'primary' }: KpiCardProps) {
  return (
    <Card className="p-4 bg-card border-border">
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${accentBg[accent]}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs text-muted-foreground uppercase tracking-wide">{label}</div>
          <div className="text-2xl font-semibold text-foreground mt-1">{value}</div>
          {hint !== undefined && <div className="text-xs text-muted-foreground mt-1 truncate">{hint}</div>}
        </div>
      </div>
    </Card>
  );
}

export default function TicketsKpiCards({ kpis, scope }: Props) {
  const { t } = useTranslation('support');

  const delta = kpis.weekOverWeekDelta;
  const deltaIcon = delta >= 0 ? TrendingUp : TrendingDown;
  const deltaText = `${delta >= 0 ? '+' : ''}${delta}%`;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
      <KpiCard
        icon={TicketCheck}
        label={t('dashboard.kpi.total', 'Total')}
        value={kpis.total}
        accent="primary"
      />
      <KpiCard
        icon={AlertTriangle}
        label={t('dashboard.kpi.open', 'Open')}
        value={kpis.open}
        accent="primary"
      />
      <KpiCard
        icon={Clock}
        label={t('dashboard.kpi.inProgress', 'In progress')}
        value={kpis.inProgress}
        accent="warning"
      />
      <KpiCard
        icon={CheckCircle2}
        label={t('dashboard.kpi.resolved', 'Resolved')}
        value={kpis.resolved}
        accent="success"
      />
      <KpiCard
        icon={XCircle}
        label={t('dashboard.kpi.closed', 'Closed')}
        value={kpis.closed}
        accent="muted"
      />
      <KpiCard
        icon={Flame}
        label={t('dashboard.kpi.criticalOpen', 'Critical open')}
        value={kpis.criticalOpen}
        accent="destructive"
      />
      <KpiCard
        icon={Timer}
        label={t('dashboard.kpi.avgAgeDays', 'Avg age (d)')}
        value={kpis.avgAgeDays}
        accent="muted"
      />
      <KpiCard
        icon={deltaIcon}
        label={t('dashboard.kpi.createdThisWeek', 'This week')}
        value={kpis.createdThisWeek}
        hint={
          <span className={delta >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}>
            {deltaText} {t('dashboard.kpi.weekOverWeek', 'vs last week')}
          </span>
        }
        accent={delta >= 0 ? 'success' : 'destructive'}
      />
      {scope === 'admin' && (
        <>
          <KpiCard
            icon={Users}
            label={t('dashboard.kpi.unassigned', 'Unassigned')}
            value={kpis.unassigned}
            accent="warning"
          />
          <KpiCard
            icon={AlertTriangle}
            label={t('dashboard.kpi.oldestOpen', 'Oldest open')}
            value={kpis.oldestOpenId ? `#${kpis.oldestOpenId}` : '—'}
            accent="muted"
          />
        </>
      )}
    </div>
  );
}

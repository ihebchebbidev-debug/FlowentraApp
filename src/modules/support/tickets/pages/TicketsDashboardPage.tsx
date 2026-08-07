import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  LifeBuoy, TicketCheck, AlertTriangle, Clock, CheckCircle2, XCircle,
  Flame, Timer, TrendingUp, Users, Plus, Ticket, Inbox,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ReportShell } from '@/modules/reporting/components/ReportShell';
import { KpiCard } from '@/modules/reporting/components/KpiCard';
import { ChartCard } from '@/modules/reporting/components/ChartCard';
import { DashboardSkeleton } from '@/modules/reporting/components/DashboardSkeleton';
import { FilterBar } from '@/modules/reporting/components/FilterBar';
import { CHART_COLORS, AXIS_TICK, GRID_STROKE, tooltipStyle } from '@/modules/reporting/components/chartTheme';
import { useTicketsData } from '../hooks/useTicketsData';
import { TicketStatusBadge, TicketUrgencyBadge } from '../components/TicketStatusBadge';

interface Props {
  scope: 'user' | 'admin';
}

const STATUS_TONE: Record<string, string> = {
  open: 'hsl(var(--chart-1))',
  in_progress: 'hsl(var(--chart-2))',
  resolved: 'hsl(var(--rag-green))',
  closed: 'hsl(var(--rag-neutral))',
};

const URGENCY_TONE: Record<string, string> = {
  low: 'hsl(var(--rag-green))',
  medium: 'hsl(var(--rag-yellow))',
  high: 'hsl(var(--rag-orange))',
  critical: 'hsl(var(--rag-red))',
};

const STATUS_LABEL: Record<string, string> = {
  open: 'Open',
  in_progress: 'In progress',
  resolved: 'Resolved',
  closed: 'Closed',
};

const URGENCY_LABEL: Record<string, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
};

export default function TicketsDashboardPage({ scope }: Props) {
  const { t } = useTranslation('support');
  const navigate = useNavigate();
  const { kpis, series, recent, list, loading, refresh } = useTicketsData({ scope });

  const [period, setPeriod] = useState<'30d' | '12m' | 'ytd'>('30d');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filters = [
    {
      key: 'period',
      label: t('filters.period', 'Period'),
      options: [
        { value: '30d', label: t('filters.last30', 'Last 30 days') },
        { value: '12m', label: t('filters.last12', 'Last 12 months') },
        { value: 'ytd', label: t('filters.ytd', 'This year') },
      ],
    },
    {
      key: 'status',
      label: t('admin.colStatus', 'Status'),
      options: [
        { value: 'all', label: t('admin.allStatuses', 'All') },
        { value: 'open', label: STATUS_LABEL.open },
        { value: 'in_progress', label: STATUS_LABEL.in_progress },
        { value: 'resolved', label: STATUS_LABEL.resolved },
        { value: 'closed', label: STATUS_LABEL.closed },
      ],
    },
  ];

  const statusData = useMemo(
    () =>
      series.byStatus
        .filter((d) => statusFilter === 'all' || d.key === statusFilter)
        .map((d) => ({ name: STATUS_LABEL[d.key] || d.label, value: d.value, key: d.key })),
    [series.byStatus, statusFilter],
  );

  const urgencyData = useMemo(
    () => series.byUrgency.map((d) => ({ name: URGENCY_LABEL[d.key] || d.label, value: d.value, key: d.key })),
    [series.byUrgency],
  );

  const trendData = useMemo(
    () => series.trend30d.map((p) => ({ name: p.date.slice(5), value: p.count })),
    [series.trend30d],
  );

  const categoryData = useMemo(
    () => series.byCategory.map((d) => ({ name: d.label, value: d.value })),
    [series.byCategory],
  );

  const moduleData = useMemo(
    () => series.byModule.map((d) => ({ name: d.label, value: d.value })),
    [series.byModule],
  );

  const title = scope === 'admin'
    ? t('dashboard.adminTitle', 'Tickets — Global dashboard')
    : t('dashboard.title', 'My tickets — Dashboard');

  const subtitle = scope === 'admin'
    ? t('dashboard.adminSubtitle', 'Overview of all support activity')
    : t('dashboard.subtitle', 'Overview of your requests');

  const actions = (
    <>
      {scope === 'user' ? (
        <>
          <Button size="sm" variant="outline" className="h-8" onClick={() => navigate('/support/tickets')}>
            <Ticket className="mr-1.5 h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t('dashboard.actions.viewMyTickets', 'My tickets')}</span>
          </Button>
          <Button size="sm" className="h-8" onClick={() => navigate('/support/tickets/new')}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t('dashboard.actions.newTicket', 'New ticket')}</span>
          </Button>
        </>
      ) : (
        <Button size="sm" variant="outline" className="h-8" onClick={() => navigate('/dashboard/ticketsadmin')}>
          <Inbox className="mr-1.5 h-3.5 w-3.5" />
          <span className="hidden sm:inline">{t('dashboard.actions.viewQueue', 'Queue')}</span>
        </Button>
      )}
    </>
  );

  const delta = kpis.weekOverWeekDelta;
  const deltaTrendDir: 'up' | 'down' | 'neutral' =
    delta > 0 ? 'up' : delta < 0 ? 'down' : 'neutral';

  const SOURCE = 'Service' as const;
  const KEY_PREFIX = scope === 'admin' ? 'TicketsAdmin' : 'Tickets';

  return (
    <ReportShell
      icon={LifeBuoy}
      tone="info"
      title={title}
      subtitle={subtitle}
      onRefresh={refresh}
      isRefreshing={loading}
      actions={actions}
    >
      <FilterBar
        filters={filters}
        initialValues={{ period, status: statusFilter }}
        onApply={(v) => {
          setPeriod((v.period as any) ?? '30d');
          setStatusFilter(v.status ?? 'all');
        }}
      />

      {loading && list.length === 0 ? (
        <DashboardSkeleton kpis={5} rows={[2, 2, 1]} />
      ) : (
        <>
          {/* KPI grid */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
            <KpiCard
              favorite={{ id: `${KEY_PREFIX}-total`, title: 'Total tickets', source: SOURCE }}
              icon={TicketCheck}
              tone="primary"
              tag="LIVE"
              value={kpis.total}
              label={t('dashboard.kpi.total', 'Total tickets')}
            />
            <KpiCard
              favorite={{ id: `${KEY_PREFIX}-open`, title: 'Open', source: SOURCE }}
              icon={AlertTriangle}
              tone="info"
              value={kpis.open}
              label={t('dashboard.kpi.open', 'Open')}
              rag={kpis.open === 0 ? 'green' : kpis.open > 10 ? 'red' : 'yellow'}
            />
            <KpiCard
              favorite={{ id: `${KEY_PREFIX}-inprogress`, title: 'In progress', source: SOURCE }}
              icon={Clock}
              tone="warning"
              value={kpis.inProgress}
              label={t('dashboard.kpi.inProgress', 'In progress')}
            />
            <KpiCard
              favorite={{ id: `${KEY_PREFIX}-resolved`, title: 'Resolved', source: SOURCE }}
              icon={CheckCircle2}
              tone="success"
              value={kpis.resolved}
              label={t('dashboard.kpi.resolved', 'Resolved')}
            />
            <KpiCard
              favorite={{ id: `${KEY_PREFIX}-critical`, title: 'Critical open', source: SOURCE }}
              icon={Flame}
              tone="destructive"
              value={kpis.criticalOpen}
              label={t('dashboard.kpi.criticalOpen', 'Critical open')}
              rag={kpis.criticalOpen === 0 ? 'green' : 'red'}
            />
            <KpiCard
              favorite={{ id: `${KEY_PREFIX}-age`, title: 'Avg age (days)', source: SOURCE }}
              icon={Timer}
              tone="accent"
              value={kpis.avgAgeDays}
              suffix={t('dashboard.kpi.days', 'days')}
              label={t('dashboard.kpi.avgAgeDays', 'Avg age of open')}
              rag={kpis.avgAgeDays <= 2 ? 'green' : kpis.avgAgeDays <= 7 ? 'yellow' : 'red'}
            />
            <KpiCard
              favorite={{ id: `${KEY_PREFIX}-week`, title: 'This week', source: SOURCE }}
              icon={TrendingUp}
              tone="purple"
              tag="WoW"
              value={kpis.createdThisWeek}
              label={t('dashboard.kpi.createdThisWeek', 'Created this week')}
              trend={`${delta >= 0 ? '+' : ''}${delta}% ${t('dashboard.kpi.weekOverWeek', 'vs last week')}`}
              trendDirection={deltaTrendDir}
            />
            <KpiCard
              favorite={{ id: `${KEY_PREFIX}-closed`, title: 'Closed', source: SOURCE }}
              icon={XCircle}
              tone="primary"
              value={kpis.closed}
              label={t('dashboard.kpi.closed', 'Closed')}
            />
            {scope === 'admin' && (
              <>
                <KpiCard
                  favorite={{ id: `${KEY_PREFIX}-unassigned`, title: 'Unassigned', source: SOURCE }}
                  icon={Users}
                  tone="warning"
                  value={kpis.unassigned}
                  label={t('dashboard.kpi.unassigned', 'Unassigned')}
                  rag={kpis.unassigned === 0 ? 'green' : 'yellow'}
                />
                <KpiCard
                  favorite={{ id: `${KEY_PREFIX}-oldest`, title: 'Oldest open', source: SOURCE }}
                  icon={AlertTriangle}
                  tone="destructive"
                  value={kpis.oldestOpenId ? `#${kpis.oldestOpenId}` : '—'}
                  label={t('dashboard.kpi.oldestOpen', 'Oldest open')}
                />
              </>
            )}
          </div>

          {/* Trend + Status */}
          <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-3">
            <ChartCard
              title={t('dashboard.charts.trend30Days', 'Created — last 30 days')}
              favorite={{ id: `${KEY_PREFIX}-trend`, title: 'Creation trend', source: SOURCE }}
              className="lg:col-span-2"
              empty={!trendData.some((p) => p.value > 0)}
            >
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="ticketsTrendFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--chart-1))" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={GRID_STROKE} />
                  <XAxis dataKey="name" tick={AXIS_TICK} tickLine={false} axisLine={false} />
                  <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip {...tooltipStyle} />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="hsl(var(--chart-1))"
                    strokeWidth={2}
                    fill="url(#ticketsTrendFill)"
                    name={t('dashboard.charts.trendLabel', 'Tickets') as string}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard
              title={t('dashboard.charts.byStatus', 'By status')}
              favorite={{ id: `${KEY_PREFIX}-bystatus`, title: 'By status', source: SOURCE }}
              empty={!statusData.length}
            >
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                    nameKey="name"
                  >
                    {statusData.map((entry) => (
                      <Cell key={entry.key} fill={STATUS_TONE[entry.key] || CHART_COLORS[0]} />
                    ))}
                  </Pie>
                  <Tooltip {...tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          {/* Urgency + Category + Module */}
          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            <ChartCard
              title={t('dashboard.charts.byUrgency', 'By urgency')}
              favorite={{ id: `${KEY_PREFIX}-byurgency`, title: 'By urgency', source: SOURCE }}
              empty={!urgencyData.length}
            >
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={urgencyData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                    nameKey="name"
                  >
                    {urgencyData.map((entry) => (
                      <Cell key={entry.key} fill={URGENCY_TONE[entry.key] || CHART_COLORS[1]} />
                    ))}
                  </Pie>
                  <Tooltip {...tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard
              title={t('dashboard.charts.byCategory', 'By category')}
              favorite={{ id: `${KEY_PREFIX}-bycategory`, title: 'By category', source: SOURCE }}
              empty={!categoryData.length}
            >
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={categoryData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={GRID_STROKE} />
                  <XAxis type="number" tick={AXIS_TICK} tickLine={false} axisLine={false} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" tick={AXIS_TICK} tickLine={false} axisLine={false} width={90} />
                  <Tooltip {...tooltipStyle} />
                  <Bar dataKey="value" fill="hsl(var(--chart-4))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard
              title={t('dashboard.charts.byModule', 'By module')}
              favorite={{ id: `${KEY_PREFIX}-bymodule`, title: 'By module', source: SOURCE }}
              empty={!moduleData.length}
            >
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={moduleData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={GRID_STROKE} />
                  <XAxis dataKey="name" tick={AXIS_TICK} tickLine={false} axisLine={false} interval={0} angle={-20} textAnchor="end" height={50} />
                  <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip {...tooltipStyle} />
                  <Bar dataKey="value" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          {/* Recent tickets */}
          <div className="mt-3">
            <ChartCard
              title={t('dashboard.recent.title', 'Recent tickets')}
              favorite={{ id: `${KEY_PREFIX}-recent`, title: 'Recent tickets', source: SOURCE }}
              bodyClassName="p-0"
              empty={!recent.length}
              emptyLabel={t('dashboard.recent.empty', 'No tickets yet.') as string}
            >
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-muted/50 text-px-11 uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="whitespace-nowrap px-3 py-2 text-left">#</th>
                      <th className="whitespace-nowrap px-3 py-2 text-left">{t('admin.colTitle', 'Title')}</th>
                      <th className="whitespace-nowrap px-3 py-2 text-left">{t('admin.colUrgency', 'Urgency')}</th>
                      <th className="whitespace-nowrap px-3 py-2 text-left">{t('admin.colStatus', 'Status')}</th>
                      <th className="whitespace-nowrap px-3 py-2 text-left">{t('admin.colCreated', 'Created')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recent.map((tk) => (
                      <tr
                        key={tk.id}
                        className="cursor-pointer border-t hover:bg-muted/30"
                        onClick={() =>
                          navigate(scope === 'admin' ? `/dashboard/ticketsadmin` : `/support/tickets/${tk.id}`)
                        }
                      >
                        <td className="whitespace-nowrap px-3 py-2 font-mono text-muted-foreground">#{tk.id}</td>
                        <td className="max-w-[420px] truncate px-3 py-2 font-medium text-foreground">{tk.title}</td>
                        <td className="whitespace-nowrap px-3 py-2"><TicketUrgencyBadge urgency={tk.urgency} /></td>
                        <td className="whitespace-nowrap px-3 py-2"><TicketStatusBadge status={tk.status} /></td>
                        <td className="whitespace-nowrap px-3 py-2 text-muted-foreground">
                          {new Date(tk.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </ChartCard>
          </div>
        </>
      )}
    </ReportShell>
  );
}

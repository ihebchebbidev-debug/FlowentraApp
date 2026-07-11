import { useState } from 'react';
import { useReportFilters } from '../store/useReportFiltersStore';
import { filterByStatusName, sliceByPeriod } from '../utils/applyFilters';
import { useTranslation } from 'react-i18next';
import { Wrench, ClipboardList, Truck, Timer, List } from 'lucide-react';
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, ComposedChart, ReferenceLine,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { ReportShell } from '../components/ReportShell';
import { FilterBar } from '../components/FilterBar';
import { KpiCard } from '../components/KpiCard';
import { ChartCard } from '../components/ChartCard';
import { RagBadge } from '../components/RagDot';
import { CHART_COLORS, AXIS_TICK, GRID_STROKE, tooltipStyle } from '../components/chartTheme';
import { DashboardSkeleton } from '../components/DashboardSkeleton';
import { useReportingService } from '../hooks/useReporting';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const SOURCE = 'Service' as const;

const translateStatusName = (t: (k: string, opts?: any) => string, name: string): string => {
  if (!name) return '—';
  const key = name.toLowerCase().replace(/\s+/g, '_');
  return t(`statuses.${key}`, { ns: 'serviceOrders', defaultValue: name });
};

export const ServiceDashboard = () => {
  const { t } = useTranslation(['reporting', 'serviceOrders']);
  const { values: appliedFilters, setValues: setAppliedFilters } = useReportFilters('service');
  const { data, isLoading, refetch, isFetching, error } = useReportingService(appliedFilters);
  const [typesOpen, setTypesOpen] = useState(false);
  const [statusesOpen, setStatusesOpen] = useState(false);

  const filters = [
    { key: 'period', label: t('filters.period', 'Period'), options: [
      { value: '12m', label: t('filters.last12', 'Last 12 Months') },
      { value: 'ytd', label: t('filters.ytd', 'This Year') },
    ]},
    { key: 'status', label: t('service.orderStatus', 'Order Status'), options: [
      { value: 'all', label: t('filters.all', 'All') },
      { value: 'open', label: 'Open' }, { value: 'progress', label: 'In Progress' },
      { value: 'completed', label: 'Completed' },
    ]},
    { key: 'type', label: t('service.orderType', 'Order Type'), options: [
      { value: 'all', label: t('filters.all', 'All Types') },
      { value: 'preventive', label: 'Preventive' }, { value: 'corrective', label: 'Corrective' },
    ]},
  ];

  const period = appliedFilters.period;
  const status = appliedFilters.status;
  const type = appliedFilters.type;
  const completion = sliceByPeriod(data?.completionByMonth ?? [], period);
  const byStatusRaw = filterByStatusName(data?.workOrdersByStatus ?? [], status);
  const byTypeRaw = filterByStatusName(data?.workOrdersByType ?? [], type);
  const byStatusAll = byStatusRaw.map((d) => ({ ...d, name: translateStatusName(t, d.name) }));
  const byTypeAll = byTypeRaw.map((d) => ({ ...d, name: translateStatusName(t, d.name) }));
  const byStatusTop5 = [...byStatusAll].sort((a, b) => Number(b.value) - Number(a.value)).slice(0, 5);
  const byTypeTop5 = [...byTypeAll].sort((a, b) => Number(b.value) - Number(a.value)).slice(0, 5);
  const dispatches = data?.dispatchesPerTech ?? [];
  const techs = data?.technicianTable ?? [];
  const currentYear = new Date().getFullYear();
  const avgCompletion = completion.length ? completion.reduce((s, c) => s + Number(c.value ?? 0), 0) / completion.length : 0;

  const renderFullList = (rows: { name: string; value: number }[]) => (
    <div className="max-h-[60vh] overflow-y-auto">
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-muted/60 text-xs uppercase text-muted-foreground">
          <tr><th className="px-3 py-2 text-left">{t('reporting:service.orderStatus', 'Status')}</th><th className="px-3 py-2 text-right">#</th></tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t"><td className="px-3 py-2">{r.name}</td><td className="px-3 py-2 text-right font-medium">{r.value}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <ReportShell
      icon={Wrench}
      tone="accent"
      title={t('service.title', 'Service Dashboard')}
      subtitle={t('service.subtitle', 'Completion, planning & technician profitability')}
      onRefresh={() => refetch()}
      isRefreshing={isFetching}
      error={error}
    >
      <FilterBar filters={filters} onApply={setAppliedFilters} />
      {isLoading ? (
        <DashboardSkeleton kpis={4} rows={[3,2,1]} />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard icon={ClipboardList} tone="accent" tag="YTD" value={`${avgCompletion.toFixed(0)}%`} suffix="/ target 90%" label={t('service.kpi.completion', 'Completion Rate vs Target')} trend={avgCompletion >= 90 ? 'on target' : `${(90 - avgCompletion).toFixed(1)} pts below`} trendDirection={avgCompletion >= 90 ? 'up' : 'down'} rag={avgCompletion >= 90 ? 'green' : avgCompletion >= 75 ? 'yellow' : 'red'} />
            <KpiCard icon={ClipboardList} tone="info" tag="LIVE" value={byStatusAll.reduce((s, o) => s + Number(o.value ?? 0), 0)} label={t('service.kpi.openWos', 'Work Orders')} trendDirection="down" />
            <KpiCard icon={Truck} tone="warning" tag="LIVE" value={techs.length || '—'} label={t('service.kpi.dispatches', 'Active Technicians')} trendDirection="neutral" />
            <KpiCard icon={Timer} tone="success" tag="YTD" value="94%" label={t('service.kpi.efficiency', 'Time Efficiency')} trend={t('service.kpi.vsPriorYear', 'vs prior year')} trendDirection="up" />
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-3">
            <ChartCard title={t('service.completionTarget', 'Completion Rate vs Target — by Month')} favorite={{ id: 'sv-comp', title: 'Completion vs Target', source: SOURCE }} className="lg:col-span-2" empty={!completion.length}>
              <ResponsiveContainer width="100%" height={220}>
                <ComposedChart data={completion}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={GRID_STROKE} />
                  <XAxis dataKey="name" tick={AXIS_TICK} tickLine={false} axisLine={false} />
                  <YAxis domain={[0, 100]} tick={AXIS_TICK} tickLine={false} axisLine={false} />
                  <Tooltip {...tooltipStyle} />
                  <Bar dataKey="value" fill="hsl(var(--chart-2))" radius={[6, 6, 0, 0]} name="Completion %" />
                  <ReferenceLine y={90} stroke="hsl(var(--rag-red))" strokeDasharray="4 4" label={{ value: 'Target 90%', fill: 'hsl(var(--rag-red))', fontSize: 10 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </ChartCard>
            <ChartCard
              title={t('service.byStatus', 'Work Orders by Status')}
              favorite={{ id: 'sv-status', title: 'WO by Status', source: SOURCE }}
              empty={!byStatusTop5.length}
              actions={byStatusAll.length > 5 ? (
                <Dialog open={statusesOpen} onOpenChange={setStatusesOpen}>
                  <DialogTrigger asChild>
                    <button type="button" className="flex h-7 items-center gap-1 rounded px-2 text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground" title={t('reporting:general.noData', 'See all') as string}>
                      <List className="h-3.5 w-3.5" /> {t('reporting:my.open', 'See all')} ({byStatusAll.length})
                    </button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>{t('service.byStatus', 'Work Orders by Status')}</DialogTitle></DialogHeader>
                    {renderFullList(byStatusAll)}
                  </DialogContent>
                </Dialog>
              ) : undefined}
            >
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={byStatusTop5} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value" nameKey="name">
                    {byStatusTop5.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip {...tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            <ChartCard
              title={t('service.byType', 'Work Orders by Type')}
              favorite={{ id: 'sv-type', title: 'WO by Type', source: SOURCE }}
              empty={!byTypeTop5.length}
              actions={byTypeAll.length > 5 ? (
                <Dialog open={typesOpen} onOpenChange={setTypesOpen}>
                  <DialogTrigger asChild>
                    <button type="button" className="flex h-7 items-center gap-1 rounded px-2 text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground">
                      <List className="h-3.5 w-3.5" /> {t('reporting:my.open', 'See all')} ({byTypeAll.length})
                    </button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>{t('service.byType', 'Work Orders by Type')}</DialogTitle></DialogHeader>
                    {renderFullList(byTypeAll)}
                  </DialogContent>
                </Dialog>
              ) : undefined}
            >
              <ResponsiveContainer width="100%" height={190}>
                <BarChart data={byTypeTop5} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={GRID_STROKE} />
                  <XAxis type="number" tick={AXIS_TICK} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="name" tick={AXIS_TICK} tickLine={false} axisLine={false} width={90} />
                  <Tooltip {...tooltipStyle} />
                  <Bar dataKey="value" fill="hsl(var(--chart-4))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
            <ChartCard title={t('service.dispatchesTech', 'Dispatches per Technician — Year')} favorite={{ id: 'sv-disp', title: 'Dispatches by Technician', source: SOURCE }} empty={!dispatches.length}>
              <ResponsiveContainer width="100%" height={190}>
                <BarChart data={dispatches}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={GRID_STROKE} />
                  <XAxis dataKey="name" tick={AXIS_TICK} tickLine={false} axisLine={false} interval={0} angle={-20} textAnchor="end" height={50} />
                  <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} />
                  <Tooltip {...tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="series1" name={String(currentYear - 2)} fill="hsl(var(--chart-5))" />
                  <Bar dataKey="series2" name={String(currentYear - 1)} fill="hsl(var(--chart-2))" />
                  <Bar dataKey="series3" name={String(currentYear)} fill="hsl(var(--chart-1))" />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
            <ChartCard title={t('service.hours', 'Consumed vs Planned Hours')} favorite={{ id: 'sv-hours', title: 'Consumed vs Planned Hours', source: SOURCE }}>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-2">
                {[
                  { v: '94%', l: 'Avg Efficiency', tone: 'text-accent' },
                  { v: '1,455h', l: 'Planned', tone: 'text-foreground' },
                  { v: '1,368h', l: 'Consumed', tone: 'text-foreground' },
                  { v: '87h', l: 'Hours Saved', tone: 'text-success' },
                ].map((s) => (
                  <div key={s.l} className="rounded-md bg-muted p-2 text-center">
                    <div className={`text-base font-bold ${s.tone}`}>{s.v}</div>
                    <div className="text-[10px] text-muted-foreground">{s.l}</div>
                  </div>
                ))}
              </div>
            </ChartCard>
          </div>

          <div className="mt-3">
            <ChartCard title={t('service.techTable', 'Technician Performance Detail')} favorite={{ id: 'sv-techs', title: 'Technician Performance', source: SOURCE }} bodyClassName="p-0" empty={!techs.length} emptyLabel={t('service.techEmpty', 'Technician table not yet populated')}>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-muted/50 text-[11px] uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="whitespace-nowrap px-3 py-2 text-left">{t('service.tech', 'Technician')}</th>
                      <th className="whitespace-nowrap px-3 py-2 text-right">{t('service.completed', 'Completion %')}</th>
                      <th className="whitespace-nowrap px-3 py-2 text-right">{t('service.efficiency', 'Efficiency')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {techs.map((r) => (
                      <tr key={r.id} className="border-t hover:bg-muted/30">
                        <td className="whitespace-nowrap px-3 py-2 font-medium">{r.title}</td>
                        <td className="whitespace-nowrap px-3 py-2 text-right">{r.subtitle}</td>
                        <td className="whitespace-nowrap px-3 py-2 text-right">
                          <RagBadge status={(r.ragDot as any) || 'green'}>{r.status || '—'}</RagBadge>
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
};

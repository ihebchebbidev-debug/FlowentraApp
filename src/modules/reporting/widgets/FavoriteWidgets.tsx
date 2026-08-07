import { useTranslation } from 'react-i18next';
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, ComposedChart, ReferenceLine,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import {
  FileText, Repeat, Receipt, Building2, ClipboardList, Truck, Timer,
  Wallet, TrendingUp, TrendingDown, Users, Briefcase, Award, UserPlus,
  ShoppingCart, Package, DollarSign, LucideIcon,
} from 'lucide-react';
import { KpiCard, KpiTone } from '../components/KpiCard';
import { ChartCard } from '../components/ChartCard';
import { RagBadge } from '../components/RagDot';
import { CHART_COLORS, AXIS_TICK, GRID_STROKE, tooltipStyle, RAG_COLORS } from '../components/chartTheme';
import {
  useReportingSales, useReportingService, useReportingFinance,
  useReportingHr, useReportingPurchase,
} from '../hooks/useReporting';
import { useReportFilters } from '../store/useReportFiltersStore';
import { filterByStatusName, filterTableByStatus, sliceByPeriod } from '../utils/applyFilters';
import { useCurrency } from '@/shared/hooks/useCurrency';
import { FavoriteWidget } from '../store/useFavoritesStore';
import { useStatusLabel } from '../utils/statusLabel';

/** Layout size for each widget so the My Dashboard grid mirrors the source layout. */
export type WidgetSize = 'kpi' | 'chart' | 'wide';

export const WIDGET_SIZE: Record<string, WidgetSize> = {
  // Sales
  's-kpi-offers': 'kpi', 's-kpi-conv': 'kpi', 's-kpi-orders': 'kpi', 's-kpi-topcust': 'kpi',
  's-offers': 'chart', 's-orders': 'chart', 's-conv': 'chart', 's-yoy': 'wide', 's-types': 'chart', 's-topcust': 'wide',
  // Service
  'sv-kpi-comp': 'kpi', 'sv-kpi-wo': 'kpi', 'sv-kpi-techs': 'kpi', 'sv-kpi-eff': 'kpi',
  'sv-comp': 'wide', 'sv-status': 'chart', 'sv-type': 'chart', 'sv-disp': 'chart', 'sv-hours': 'chart', 'sv-techs': 'wide',
  // Finance
  'f-kpi-0': 'kpi', 'f-kpi-1': 'kpi', 'f-kpi-2': 'kpi', 'f-kpi-3': 'kpi',
  'f-donut': 'chart', 'f-exp': 'chart', 'f-inv': 'wide',
  // HR
  'h-kpi-head': 'kpi', 'h-kpi-sal': 'kpi', 'h-kpi-perf': 'kpi', 'h-kpi-hires': 'kpi',
  'h-head': 'chart', 'h-sal': 'chart', 'h-perf': 'chart', 'h-hire': 'chart', 'h-emp': 'wide',
  // Purchase
  'p-kpi-spend': 'kpi', 'p-kpi-pos': 'kpi', 'p-kpi-sup': 'kpi', 'p-kpi-rec': 'kpi',
  'p-sup': 'wide', 'p-cat': 'chart', 'p-rec': 'chart', 'p-trend': 'wide', 'p-po': 'wide',
};

export const getWidgetSize = (id: string): WidgetSize => WIDGET_SIZE[id] ?? 'chart';

/** A small placeholder shown while a source report is loading. */
const WidgetSkeleton = ({ size }: { size: WidgetSize }) => (
  <div
    className={
      'animate-pulse rounded-lg border bg-card shadow-sm ' +
      (size === 'kpi' ? 'h-[112px] p-4' : 'h-[260px] p-4')
    }
  >
    <div className="h-3 w-1/3 rounded bg-muted" />
    <div className="mt-4 h-[70%] w-full rounded bg-muted/60" />
  </div>
);

/* ------------------------------------------------------------------ */
/* Sales                                                               */
/* ------------------------------------------------------------------ */
const SalesWidget = ({ fav }: { fav: FavoriteWidget }) => {
  const { t } = useTranslation('reporting');
  const { current: currency } = useCurrency();
  const { values: applied } = useReportFilters('sales');
  const { data, isLoading } = useReportingSales(applied);
  const translateStatus = useStatusLabel();

  const status = applied.status;
  const period = applied.period;
  const offersByStatus = filterByStatusName(data?.offersByStatus ?? [], status).map((d) => ({ ...d, name: translateStatus(d.name) }));
  const salesByStatus = filterByStatusName(data?.salesByStatus ?? [], status).map((d) => ({ ...d, name: translateStatus(d.name) }));
  const conversion = sliceByPeriod(data?.conversionTrend ?? [], period);
  const yoy = data?.yoyComparison ?? [];
  const topCustomers = filterTableByStatus(data?.topCustomers ?? [], status);
  const currentYear = new Date().getFullYear();

  if (isLoading) return <WidgetSkeleton size={getWidgetSize(fav.id)} />;

  switch (fav.id) {
    case 's-kpi-offers':
      return <KpiCard favorite={fav} icon={FileText} tone="primary" tag="YTD" value={offersByStatus.reduce((s, o) => s + Number(o.value ?? 0), 0)} label={t('sales.kpi.totalOffers', 'Total Offers')} trend={t('sales.kpi.vsPriorYear', 'vs prior year')} trendDirection="up" />;
    case 's-kpi-conv':
      return <KpiCard favorite={fav} icon={Repeat} tone="accent" tag="AVG" value={`${(conversion.reduce((s, c) => s + Number(c.value ?? 0), 0) / Math.max(conversion.length, 1)).toFixed(0)}%`} label={t('sales.kpi.conversion', 'Offer Conversion Rate')} trend={t('sales.kpi.target', 'target 50%')} trendDirection="up" />;
    case 's-kpi-orders':
      return <KpiCard favorite={fav} icon={Receipt} tone="info" tag="LIVE" value={salesByStatus.reduce((s, o) => s + Number(o.value ?? 0), 0)} label={t('sales.kpi.openOrders', 'Sales Orders')} trendDirection="up" trend={t('sales.kpi.thisPeriod', 'this period')} />;
    case 's-kpi-topcust':
      return <KpiCard favorite={fav} icon={Building2} tone="success" tag="TOP" value={topCustomers.length} label={t('sales.kpi.topCustomers', 'Top Customers')} />;
    case 's-offers':
      return (
        <ChartCard title={t('sales.offersByStatus', 'Offers by Status')} favorite={fav} empty={!offersByStatus.length}>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={offersByStatus} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value" nameKey="name">
                {offersByStatus.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Pie>
              <Tooltip {...tooltipStyle} /><Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      );
    case 's-orders':
      return (
        <ChartCard title={t('sales.salesByStatus', 'Sales Orders by Status')} favorite={fav} empty={!salesByStatus.length}>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={salesByStatus}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={GRID_STROKE} />
              <XAxis dataKey="name" tick={AXIS_TICK} tickLine={false} axisLine={false} />
              <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} />
              <Tooltip {...tooltipStyle} />
              <Bar dataKey="value" fill="hsl(var(--chart-1))" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      );
    case 's-conv':
      return (
        <ChartCard title={t('sales.conversionTrend', 'Offer Conversion Trend')} favorite={fav} empty={!conversion.length}>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={conversion}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={GRID_STROKE} />
              <XAxis dataKey="name" tick={AXIS_TICK} tickLine={false} axisLine={false} />
              <YAxis domain={[0, 100]} tick={AXIS_TICK} tickLine={false} axisLine={false} />
              <Tooltip {...tooltipStyle} />
              <Line type="monotone" dataKey="value" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={{ r: 3 }} name="%" />
              <Line type="step" dataKey="target" stroke="hsl(var(--rag-red))" strokeDasharray="4 4" strokeWidth={1.5} dot={false} name="Target" />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      );
    case 's-yoy':
      return (
        <ChartCard title={t('sales.yoyComparison', 'Sales Orders — Year Comparison')} favorite={fav} empty={!yoy.length}>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={yoy}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={GRID_STROKE} />
              <XAxis dataKey="name" tick={AXIS_TICK} tickLine={false} axisLine={false} />
              <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} />
              <Tooltip {...tooltipStyle} /><Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="series1" name={String(currentYear - 2)} fill="hsl(var(--chart-5))" radius={[3, 3, 0, 0]} />
              <Bar dataKey="series2" name={String(currentYear - 1)} fill="hsl(var(--chart-2))" radius={[3, 3, 0, 0]} />
              <Bar dataKey="series3" name={String(currentYear)} fill="hsl(var(--chart-1))" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      );
    case 's-types': {
      const rows = (data?.ordersByType ?? []).slice(0, 5);
      const maxVal = Math.max(1, ...rows.map((r) => Number(r.value ?? 0)));
      const tones = ['primary', 'accent', 'info', 'warning', 'purple'] as const;
      return (
        <ChartCard title={t('sales.ordersByType', 'Orders & Offers by Type')} favorite={fav} empty={!rows.length}>
          <ProgressList rows={rows.map((r, i) => ({
            label: r.name,
            value: Math.round((Number(r.value ?? 0) / maxVal) * 100),
            tone: tones[i % tones.length],
          }))} />
        </ChartCard>
      );
    }
    case 's-topcust':
      return (
        <ChartCard title={t('sales.topCustomers', 'Top Customers — Offers & Orders')} favorite={fav} bodyClassName="p-0" empty={!topCustomers.length}>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-muted/50 text-px-11 uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="whitespace-nowrap px-3 py-2 text-left">{t('sales.customer', 'Customer')}</th>
                  <th className="whitespace-nowrap px-3 py-2 text-right">{t('sales.revenue', 'Revenue')}</th>
                  <th className="whitespace-nowrap px-3 py-2 text-left">{t('sales.status', 'Status')}</th>
                </tr>
              </thead>
              <tbody>
                {topCustomers.map((c) => (
                  <tr key={c.id} className="border-t hover:bg-muted/30">
                    <td className="whitespace-nowrap px-3 py-2 font-medium text-foreground">{c.title}</td>
                    <td className="whitespace-nowrap px-3 py-2 text-right font-semibold">{money(currency.code, c.amount)}</td>
                    <td className="whitespace-nowrap px-3 py-2"><RagBadge status={(c.ragDot as any) || 'green'}>{c.status ? translateStatus(c.status) : t('sales.active', 'Active')}</RagBadge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ChartCard>
      );
    default:
      return null;
  }
};

/* ------------------------------------------------------------------ */
/* Service                                                             */
/* ------------------------------------------------------------------ */
const ServiceWidget = ({ fav }: { fav: FavoriteWidget }) => {
  const { t } = useTranslation(['reporting', 'serviceOrders']);
  const { values: applied } = useReportFilters('service');
  const { data, isLoading } = useReportingService(applied);
  const translateStatus = useStatusLabel();

  const period = applied.period;
  const status = applied.status;
  const type = applied.type;
  const completion = sliceByPeriod(data?.completionByMonth ?? [], period);
  const byStatusAll = filterByStatusName(data?.workOrdersByStatus ?? [], status).map((d) => ({ ...d, name: translateStatus(d.name) }));
  const byTypeAll = filterByStatusName(data?.workOrdersByType ?? [], type).map((d) => ({ ...d, name: translateStatus(d.name) }));
  const byStatusTop5 = [...byStatusAll].sort((a, b) => Number(b.value) - Number(a.value)).slice(0, 5);
  const byTypeTop5 = [...byTypeAll].sort((a, b) => Number(b.value) - Number(a.value)).slice(0, 5);
  const dispatches = data?.dispatchesPerTech ?? [];
  const techs = data?.technicianTable ?? [];
  const currentYear = new Date().getFullYear();
  const avgCompletion = completion.length ? completion.reduce((s, c) => s + Number(c.value ?? 0), 0) / completion.length : 0;

  if (isLoading) return <WidgetSkeleton size={getWidgetSize(fav.id)} />;

  switch (fav.id) {
    case 'sv-kpi-comp':
      return <KpiCard favorite={fav} icon={ClipboardList} tone="accent" tag="YTD" value={`${avgCompletion.toFixed(0)}%`} suffix="/ target 90%" label={t('service.kpi.completion', 'Completion Rate vs Target')} trend={avgCompletion >= 90 ? 'on target' : `${(90 - avgCompletion).toFixed(1)} pts below`} trendDirection={avgCompletion >= 90 ? 'up' : 'down'} rag={avgCompletion >= 90 ? 'green' : avgCompletion >= 75 ? 'yellow' : 'red'} />;
    case 'sv-kpi-wo':
      return <KpiCard favorite={fav} icon={ClipboardList} tone="info" tag="LIVE" value={byStatusAll.reduce((s, o) => s + Number(o.value ?? 0), 0)} label={t('service.kpi.openWos', 'Work Orders')} trendDirection="down" />;
    case 'sv-kpi-techs':
      return <KpiCard favorite={fav} icon={Truck} tone="warning" tag="LIVE" value={techs.length || '—'} label={t('service.kpi.dispatches', 'Active Technicians')} trendDirection="neutral" />;
    case 'sv-kpi-eff': {
      const eff = Number(data?.consumedVsPlanned?.find((p) => p.name === 'Efficiency')?.value ?? 0);
      return <KpiCard favorite={fav} icon={Timer} tone="success" tag="YTD" value={eff > 0 ? `${eff.toFixed(0)}%` : '—'} label={t('service.kpi.efficiency', 'Time Efficiency')} trend={t('service.kpi.vsPriorYear', 'vs prior year')} trendDirection={eff >= 100 ? 'up' : 'down'} rag={eff >= 100 ? 'green' : eff >= 85 ? 'yellow' : eff > 0 ? 'red' : 'neutral'} />;
    }
    case 'sv-comp':
      return (
        <ChartCard title={t('service.completionTarget', 'Completion Rate vs Target — by Month')} favorite={fav} empty={!completion.length}>
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
      );
    case 'sv-status':
      return (
        <ChartCard title={t('service.byStatus', 'Work Orders by Status')} favorite={fav} empty={!byStatusTop5.length}>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={byStatusTop5} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value" nameKey="name">
                {byStatusTop5.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Pie>
              <Tooltip {...tooltipStyle} /><Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      );
    case 'sv-type':
      return (
        <ChartCard title={t('service.byType', 'Work Orders by Type')} favorite={fav} empty={!byTypeTop5.length}>
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
      );
    case 'sv-disp':
      return (
        <ChartCard title={t('service.dispatchesTech', 'Dispatches per Technician — Year')} favorite={fav} empty={!dispatches.length}>
          <ResponsiveContainer width="100%" height={190}>
            <BarChart data={dispatches}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={GRID_STROKE} />
              <XAxis dataKey="name" tick={AXIS_TICK} tickLine={false} axisLine={false} interval={0} angle={-20} textAnchor="end" height={50} />
              <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} />
              <Tooltip {...tooltipStyle} /><Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="series1" name={String(currentYear - 2)} fill="hsl(var(--chart-5))" />
              <Bar dataKey="series2" name={String(currentYear - 1)} fill="hsl(var(--chart-2))" />
              <Bar dataKey="series3" name={String(currentYear)} fill="hsl(var(--chart-1))" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      );
    case 'sv-hours': {
      const cvp = data?.consumedVsPlanned ?? [];
      const findVal = (n: string) => Number(cvp.find((p) => p.name === n)?.value ?? 0);
      const eff = findVal('Efficiency');
      const planned = findVal('Planned');
      const consumed = findVal('Consumed');
      const saved = findVal('HoursSaved');
      const isEmpty = !planned && !consumed && !saved && !eff;
      return (
        <ChartCard title={t('service.hours', 'Consumed vs Planned Hours')} favorite={fav} empty={isEmpty} emptyLabel={t('service.hoursEmpty', 'No planned/actual hours logged yet')}>
          <div className="grid grid-cols-2 gap-2">
            {[
              { v: eff > 0 ? `${eff.toFixed(0)}%` : '—', l: t('service.avgEfficiency', 'Avg Efficiency'), tone: 'text-accent' },
              { v: `${planned.toLocaleString()}h`, l: t('service.planned', 'Planned'), tone: 'text-foreground' },
              { v: `${consumed.toLocaleString()}h`, l: t('service.consumed', 'Consumed'), tone: 'text-foreground' },
              { v: `${saved.toLocaleString()}h`, l: t('service.hoursSaved', 'Hours Saved'), tone: 'text-success' },
            ].map((s) => (
              <div key={s.l} className="rounded-md bg-muted p-2 text-center">
                <div className={`text-base font-bold ${s.tone}`}>{s.v}</div>
                <div className="text-px-10 text-muted-foreground">{s.l}</div>
              </div>
            ))}
          </div>
        </ChartCard>
      );
    }
    case 'sv-techs':
      return (
        <ChartCard title={t('service.techTable', 'Technician Performance Detail')} favorite={fav} bodyClassName="p-0" empty={!techs.length} emptyLabel={t('service.techEmpty', 'Technician table not yet populated')}>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-muted/50 text-px-11 uppercase tracking-wide text-muted-foreground">
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
                    <td className="whitespace-nowrap px-3 py-2 text-right"><RagBadge status={(r.ragDot as any) || 'green'}>{translateStatus(r.status)}</RagBadge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ChartCard>
      );
    default:
      return null;
  }
};

/* ------------------------------------------------------------------ */
/* Finance                                                            */
/* ------------------------------------------------------------------ */
const financeIconByIdx = [Wallet, Receipt, TrendingUp, TrendingDown];
const FinanceWidget = ({ fav }: { fav: FavoriteWidget }) => {
  const { t } = useTranslation('reporting');
  const { current: currency } = useCurrency();
  const { values: applied } = useReportFilters('finance');
  const { data, isLoading } = useReportingFinance(applied);
  const translateStatus = useStatusLabel();

  const status = applied.status;
  const kpis = data?.kpis ?? [];
  const donut = filterByStatusName(data?.invoiceStatusDonut ?? [], status).map((d) => ({ ...d, name: translateStatus(d.name) }));
  const expenses = data?.expensesByCategory ?? [];
  const invoices = filterTableByStatus(data?.invoiceTable ?? [], status);
  const donutColors = ['green', 'yellow', 'red', 'neutral'] as const;

  if (isLoading) return <WidgetSkeleton size={getWidgetSize(fav.id)} />;

  if (fav.id.startsWith('f-kpi-')) {
    const i = Number(fav.id.replace('f-kpi-', '')) || 0;
    const fallback = [
      { title: t('finance.kpi.revenue', 'Total Revenue'), formattedValue: '—', ragStatus: 'neutral' as const, trend: '' },
      { title: t('finance.kpi.pending', 'Pending Collection'), formattedValue: '—', ragStatus: 'neutral' as const, trend: '' },
      { title: t('finance.kpi.overdue', 'Overdue'), formattedValue: '—', ragStatus: 'neutral' as const, trend: '' },
      { title: t('finance.kpi.cash', 'Cash Position'), formattedValue: '—', ragStatus: 'neutral' as const, trend: '' },
    ];
    const list = kpis.length ? kpis : fallback;
    const k = list[i];
    if (!k) return null;
    const Icon = financeIconByIdx[i] || Wallet;
    const tone: KpiTone = k.ragStatus === 'green' ? 'success' : k.ragStatus === 'yellow' ? 'warning' : k.ragStatus === 'red' ? 'destructive' : 'info';
    return <KpiCard favorite={fav} icon={Icon} tone={tone} value={k.formattedValue} label={k.title} trend={k.trend} rag={k.ragStatus as any} trendDirection={!k.trend ? 'neutral' : k.trend.startsWith('-') ? 'down' : 'up'} />;
  }

  switch (fav.id) {
    case 'f-donut':
      return (
        <ChartCard title={t('finance.invoiceStatus', 'Invoice Status')} favorite={fav} empty={!donut.length}>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={donut} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value" nameKey="name">
                {donut.map((_, i) => <Cell key={i} fill={RAG_COLORS[donutColors[i % donutColors.length]]} />)}
              </Pie>
              <Tooltip {...tooltipStyle} /><Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      );
    case 'f-exp':
      return (
        <ChartCard title={t('finance.expenses', 'Expenses by Category')} favorite={fav} empty={!expenses.length} emptyLabel={t('finance.expensesEmpty', 'Expense categories not yet available')}>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={expenses}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={GRID_STROKE} />
              <XAxis dataKey="name" tick={AXIS_TICK} tickLine={false} axisLine={false} />
              <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} />
              <Tooltip {...tooltipStyle} />
              <Bar dataKey="value" fill="hsl(var(--chart-orange))" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      );
    case 'f-inv':
      return (
        <ChartCard title={t('finance.invoiceTable', 'Recent Invoices')} favorite={fav} bodyClassName="p-0" empty={!invoices.length} emptyLabel={t('finance.invoiceEmpty', 'Invoice detail rows not yet populated')}>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-muted/50 text-px-11 uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="w-8 px-3 py-2"></th>
                  <th className="whitespace-nowrap px-3 py-2 text-left">{t('finance.invoiceNumber', 'Invoice')}</th>
                  <th className="whitespace-nowrap px-3 py-2 text-left">{t('finance.customer', 'Customer')}</th>
                  <th className="whitespace-nowrap px-3 py-2 text-left">{t('finance.status', 'Status')}</th>
                  <th className="whitespace-nowrap px-3 py-2 text-right">{t('finance.amount', 'Amount')}</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id} className={`border-t hover:bg-muted/30 ${inv.ragDot === 'red' ? 'bg-destructive/5' : ''}`}>
                    <td className="px-3 py-2"><span className={`inline-block h-2.5 w-2.5 rounded-full ${inv.ragDot === 'green' ? 'bg-success' : inv.ragDot === 'yellow' ? 'bg-warning' : inv.ragDot === 'red' ? 'bg-destructive' : 'bg-muted-foreground'}`} /></td>
                    <td className="whitespace-nowrap px-3 py-2 font-medium">{inv.title}</td>
                    <td className="whitespace-nowrap px-3 py-2">{inv.subtitle}</td>
                    <td className="whitespace-nowrap px-3 py-2"><RagBadge status={(inv.ragDot as any) || 'neutral'}>{translateStatus(inv.status)}</RagBadge></td>
                    <td className="whitespace-nowrap px-3 py-2 text-right font-semibold">{money(currency.code, inv.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ChartCard>
      );
    default:
      return null;
  }
};

/* ------------------------------------------------------------------ */
/* HR                                                                 */
/* ------------------------------------------------------------------ */
const HrWidget = ({ fav }: { fav: FavoriteWidget }) => {
  const { t } = useTranslation('reporting');
  const { current: currency } = useCurrency();
  const { values: applied } = useReportFilters('hr');
  const { data, isLoading } = useReportingHr(applied);
  const translateStatus = useStatusLabel();

  const period = applied.period;
  const dept = applied.dept;
  const headcount = filterByStatusName(data?.headcountByDepartment ?? [], dept);
  const salary = filterByStatusName(data?.salaryByDepartment ?? [], dept);
  const performance = data?.performanceDistribution ?? [];
  const hiring = sliceByPeriod(data?.hiringVsTurnover ?? [], period);
  const employees = data?.employeeTable ?? [];
  const totalHeadcount = headcount.reduce((s, x) => s + Number(x.value ?? 0), 0);
  const totalHires = hiring.reduce((s, x) => s + Number(x.series1 ?? 0), 0);

  if (isLoading) return <WidgetSkeleton size={getWidgetSize(fav.id)} />;

  switch (fav.id) {
    case 'h-kpi-head':
      return <KpiCard favorite={fav} icon={Users} tone="purple" tag="LIVE" value={totalHeadcount || '—'} label={t('hr.kpi.headcount', 'Total Headcount')} />;
    case 'h-kpi-sal':
      return <KpiCard favorite={fav} icon={Briefcase} tone="info" tag="MONTH" value={money(currency.code, salary.reduce((s, x) => s + Number(x.value ?? 0), 0))} label={t('hr.kpi.salary', 'Monthly Salary Cost')} />;
    case 'h-kpi-perf':
      return <KpiCard favorite={fav} icon={Award} tone="success" tag="AVG" value="B+" label={t('hr.kpi.performance', 'Avg Performance Grade')} />;
    case 'h-kpi-hires':
      return <KpiCard favorite={fav} icon={UserPlus} tone="accent" tag="YTD" value={totalHires || '—'} label={t('hr.kpi.hires', 'New Hires')} />;
    case 'h-head':
      return (
        <ChartCard title={t('hr.headcount', 'Headcount by Department')} favorite={fav} empty={!headcount.length} emptyLabel={t('hr.empty', 'HR data will appear once populated')}>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={headcount}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={GRID_STROKE} />
              <XAxis dataKey="name" tick={AXIS_TICK} tickLine={false} axisLine={false} />
              <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} />
              <Tooltip {...tooltipStyle} />
              <Bar dataKey="value" fill="hsl(var(--chart-6))" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      );
    case 'h-sal':
      return (
        <ChartCard title={t('hr.salary', 'Salary Cost by Department')} favorite={fav} empty={!salary.length} emptyLabel={t('hr.empty', 'HR data will appear once populated')}>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={salary}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={GRID_STROKE} />
              <XAxis dataKey="name" tick={AXIS_TICK} tickLine={false} axisLine={false} />
              <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} />
              <Tooltip {...tooltipStyle} />
              <Bar dataKey="value" fill="hsl(var(--chart-2))" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      );
    case 'h-perf':
      return (
        <ChartCard title={t('hr.performance', 'Performance Distribution')} favorite={fav} empty={!performance.length} emptyLabel={t('hr.empty', 'HR data will appear once populated')}>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={performance} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value" nameKey="name">
                {performance.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Pie>
              <Tooltip {...tooltipStyle} /><Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      );
    case 'h-hire':
      return (
        <ChartCard title={t('hr.hiring', 'Hiring vs Turnover')} favorite={fav} empty={!hiring.length} emptyLabel={t('hr.empty', 'HR data will appear once populated')}>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={hiring}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={GRID_STROKE} />
              <XAxis dataKey="name" tick={AXIS_TICK} tickLine={false} axisLine={false} />
              <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} />
              <Tooltip {...tooltipStyle} /><Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="series1" name={t('hr.hires', 'Hires')} stroke="hsl(var(--chart-3))" strokeWidth={2} />
              <Line type="monotone" dataKey="series2" name={t('hr.leavers', 'Leavers')} stroke="hsl(var(--rag-red))" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      );
    case 'h-emp':
      return (
        <ChartCard title={t('hr.employeeTable', 'Employee Detail')} favorite={fav} bodyClassName="p-0" empty={!employees.length} emptyLabel={t('hr.empty', 'Employee table not yet populated')}>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-muted/50 text-px-11 uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="whitespace-nowrap px-3 py-2 text-left">{t('hr.employee', 'Employee')}</th>
                  <th className="whitespace-nowrap px-3 py-2 text-left">{t('hr.department', 'Department')}</th>
                  <th className="whitespace-nowrap px-3 py-2 text-left">{t('hr.grade', 'Grade')}</th>
                  <th className="whitespace-nowrap px-3 py-2 text-right">{t('hr.salaryCol', 'Salary')}</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((e) => (
                  <tr key={e.id} className="border-t hover:bg-muted/30">
                    <td className="whitespace-nowrap px-3 py-2 font-medium">{e.title}</td>
                    <td className="whitespace-nowrap px-3 py-2">{e.subtitle}</td>
                    <td className="whitespace-nowrap px-3 py-2"><RagBadge status={(e.ragDot as any) || 'neutral'}>{translateStatus(e.status)}</RagBadge></td>
                    <td className="whitespace-nowrap px-3 py-2 text-right font-semibold">{money(currency.code, e.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ChartCard>
      );
    default:
      return null;
  }
};

/* ------------------------------------------------------------------ */
/* Purchase                                                           */
/* ------------------------------------------------------------------ */
const PurchaseWidget = ({ fav }: { fav: FavoriteWidget }) => {
  const { t } = useTranslation('reporting');
  const { current: currency } = useCurrency();
  const { values: applied } = useReportFilters('purchase');
  const { data, isLoading } = useReportingPurchase(applied);
  const translateStatus = useStatusLabel();

  const period = applied.period;
  const supplier = applied.supplier;
  const bySupplier = filterByStatusName(data?.spendBySupplier ?? [], supplier);
  const byCategory = data?.spendByCategory ?? [];
  const receiptStatus = data?.receiptStatus ?? [];
  const trend = sliceByPeriod(data?.poSpendTrend ?? [], period);
  const pos = data?.poTable ?? [];
  const totalSpend = bySupplier.reduce((s, x) => s + Number(x.value ?? 0), 0);
  const receiptColors = ['green', 'yellow', 'red', 'neutral'] as const;

  if (isLoading) return <WidgetSkeleton size={getWidgetSize(fav.id)} />;

  switch (fav.id) {
    case 'p-kpi-spend':
      return <KpiCard favorite={fav} icon={DollarSign} tone="warning" tag="YTD" value={new Intl.NumberFormat(undefined, { style: 'currency', currency: currency.code, maximumFractionDigits: 0, notation: 'compact' }).format(totalSpend)} label={t('purchase.kpi.spend', 'Total Spend')} />;
    case 'p-kpi-pos':
      return <KpiCard favorite={fav} icon={ShoppingCart} tone="primary" tag="LIVE" value={pos.length || '—'} label={t('purchase.kpi.pos', 'Purchase Orders')} />;
    case 'p-kpi-sup':
      return <KpiCard favorite={fav} icon={Package} tone="info" tag="AVG" value={bySupplier.length || '—'} label={t('purchase.kpi.suppliers', 'Active Suppliers')} />;
    case 'p-kpi-rec':
      return <KpiCard favorite={fav} icon={Truck} tone="accent" tag="AVG" value={receiptStatus.length ? `${((receiptStatus.find(r => r.name?.toLowerCase() === 'received')?.value ?? 0) as number / Math.max(receiptStatus.reduce((s, x) => s + Number(x.value ?? 0), 0), 1) * 100).toFixed(0)}%` : '—'} label={t('purchase.kpi.receipt', 'Receipt Rate')} />;
    case 'p-sup':
      return (
        <ChartCard title={t('purchase.spendSupplier', 'Spend by Supplier — Top 8')} favorite={fav} empty={!bySupplier.length} emptyLabel={t('purchase.empty', 'Purchase data will appear once populated')}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={bySupplier.slice(0, 8)} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={GRID_STROKE} />
              <XAxis type="number" tick={AXIS_TICK} tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey="name" tick={AXIS_TICK} tickLine={false} axisLine={false} width={100} />
              <Tooltip {...tooltipStyle} />
              <Bar dataKey="value" fill="hsl(var(--chart-4))" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      );
    case 'p-cat':
      return (
        <ChartCard title={t('purchase.spendCategory', 'Spend by Category')} favorite={fav} empty={!byCategory.length} emptyLabel={t('purchase.empty', 'Purchase data will appear once populated')}>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={byCategory} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value" nameKey="name">
                {byCategory.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Pie>
              <Tooltip {...tooltipStyle} /><Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      );
    case 'p-rec':
      return (
        <ChartCard title={t('purchase.receiptStatus', 'Receipt Status')} favorite={fav} empty={!receiptStatus.length} emptyLabel={t('purchase.empty', 'Purchase data will appear once populated')}>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={receiptStatus} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value" nameKey="name">
                {receiptStatus.map((_, i) => <Cell key={i} fill={RAG_COLORS[receiptColors[i % receiptColors.length]]} />)}
              </Pie>
              <Tooltip {...tooltipStyle} /><Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      );
    case 'p-trend':
      return (
        <ChartCard title={t('purchase.trend', 'PO Spend Trend')} favorite={fav} empty={!trend.length} emptyLabel={t('purchase.empty', 'Purchase data will appear once populated')}>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={GRID_STROKE} />
              <XAxis dataKey="name" tick={AXIS_TICK} tickLine={false} axisLine={false} />
              <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} />
              <Tooltip {...tooltipStyle} />
              <Line type="monotone" dataKey="value" stroke="hsl(var(--chart-4))" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      );
    case 'p-po':
      return (
        <ChartCard title={t('purchase.poTable', 'Purchase Order Detail')} favorite={fav} bodyClassName="p-0" empty={!pos.length} emptyLabel={t('purchase.empty', 'PO detail table not yet populated')}>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-muted/50 text-px-11 uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="whitespace-nowrap px-3 py-2 text-left">{t('purchase.poNumber', 'PO')}</th>
                  <th className="whitespace-nowrap px-3 py-2 text-left">{t('purchase.supplier', 'Supplier')}</th>
                  <th className="whitespace-nowrap px-3 py-2 text-left">{t('purchase.status', 'Status')}</th>
                  <th className="whitespace-nowrap px-3 py-2 text-right">{t('purchase.amount', 'Amount')}</th>
                </tr>
              </thead>
              <tbody>
                {pos.map((p) => (
                  <tr key={p.id} className={`border-t hover:bg-muted/30 ${p.ragDot === 'red' ? 'bg-destructive/5' : ''}`}>
                    <td className="whitespace-nowrap px-3 py-2 font-medium">{p.title}</td>
                    <td className="whitespace-nowrap px-3 py-2">{p.subtitle}</td>
                    <td className="whitespace-nowrap px-3 py-2"><RagBadge status={(p.ragDot as any) || 'neutral'}>{translateStatus(p.status)}</RagBadge></td>
                    <td className="whitespace-nowrap px-3 py-2 text-right font-semibold">{money(currency.code, p.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ChartCard>
      );
    default:
      return null;
  }
};

/* ------------------------------------------------------------------ */
/* Shared helpers                                                     */
/* ------------------------------------------------------------------ */
const money = (code: string, amount?: number) =>
  new Intl.NumberFormat(undefined, { style: 'currency', currency: code, maximumFractionDigits: 0 }).format(Number(amount ?? 0));

const progressTone: Record<string, string> = {
  primary: 'bg-primary', accent: 'bg-accent', info: 'bg-info',
  warning: 'bg-warning', purple: 'bg-[hsl(var(--chart-6))]',
};
const ProgressList = ({ rows }: { rows: { label: string; value: number; tone: string }[] }) => (
  <div className="space-y-2.5">
    {rows.map((r) => (
      <div key={r.label}>
        <div className="mb-1 flex items-center justify-between text-xs">
          <span className="text-muted-foreground">{r.label}</span>
          <span className="font-medium text-foreground">{r.value}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div className={`h-full rounded-full ${progressTone[r.tone] ?? 'bg-primary'}`} style={{ width: `${r.value}%` }} />
        </div>
      </div>
    ))}
  </div>
);

/**
 * Renders a single pinned widget with its full, live data — identical to how it
 * appears on its source dashboard. Returns null for unknown widget ids.
 */
export const FavoriteWidgetCard = ({ fav }: { fav: FavoriteWidget }) => {
  switch (fav.source) {
    case 'Sales': return <SalesWidget fav={fav} />;
    case 'Service': return <ServiceWidget fav={fav} />;
    case 'Finance': return <FinanceWidget fav={fav} />;
    case 'HR': return <HrWidget fav={fav} />;
    case 'Purchase': return <PurchaseWidget fav={fav} />;
    default: return null;
  }
};

import { useTranslation } from 'react-i18next';
import { TrendingUp, FileText, Repeat, Receipt, Building2 } from 'lucide-react';
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { ReportShell } from '../components/ReportShell';
import { FilterBar } from '../components/FilterBar';
import { KpiCard } from '../components/KpiCard';
import { ChartCard } from '../components/ChartCard';
import { ProgressRow } from '../components/ProgressRow';
import { RagBadge } from '../components/RagDot';
import { DashboardSkeleton } from '../components/DashboardSkeleton';
import { CHART_COLORS, AXIS_TICK, GRID_STROKE, tooltipStyle } from '../components/chartTheme';
import { useReportingSales } from '../hooks/useReporting';
import { useCurrency } from '@/shared/hooks/useCurrency';
import { useReportFilters } from '../store/useReportFiltersStore';
import { filterByStatusName, filterTableByStatus, sliceByPeriod } from '../utils/applyFilters';
import { exportSingleReport } from '../utils/exportReport';
import { useXlsxI18n } from '../hooks/useXlsxI18n';
import { useStatusLabel } from '../utils/statusLabel';

const SOURCE = 'Sales' as const;

export const SalesDashboard = () => {
  const { t } = useTranslation('reporting');
  const xlsxI18n = useXlsxI18n();
  const { current: currency } = useCurrency();
  const { values: appliedFilters, setValues: setAppliedFilters } = useReportFilters('sales');
  const { data, isLoading, refetch, isFetching, error } = useReportingSales(appliedFilters);

  const filters = [
    { key: 'period', label: t('filters.period', 'Period'), options: [
      { value: '12m', label: t('filters.last12', 'Last 12 Months') },
      { value: 'ytd', label: t('filters.ytd', 'This Year') },
      { value: 'q', label: t('filters.lastQuarter', 'Last Quarter') },
    ]},
    { key: 'status', label: t('sales.orderStatus', 'Order Status'), options: [
      { value: 'all', label: t('filters.all', 'All') },
      { value: 'draft', label: t('statuses.draft', { ns: 'translation', defaultValue: 'Draft' }) }, { value: 'confirmed', label: t('statuses.confirmed', { ns: 'translation', defaultValue: 'Confirmed' }) },
      { value: 'shipped', label: t('statuses.shipped', { ns: 'translation', defaultValue: 'Shipped' }) }, { value: 'invoiced', label: t('statuses.invoiced', { ns: 'translation', defaultValue: 'Invoiced' }) },
    ]},
  ];

  const period = appliedFilters.period;
  const status = appliedFilters.status;
  const translateStatus = useStatusLabel();
  const offersByStatusRaw = filterByStatusName(data?.offersByStatus ?? [], status);
  const salesByStatusRaw = filterByStatusName(data?.salesByStatus ?? [], status);
  const offersByStatus = offersByStatusRaw.map((d) => ({ ...d, name: translateStatus(d.name) }));
  const salesByStatus = salesByStatusRaw.map((d) => ({ ...d, name: translateStatus(d.name) }));
  const conversion = sliceByPeriod(data?.conversionTrend ?? [], period);
  const yoy = data?.yoyComparison ?? [];
  const topCustomers = filterTableByStatus(data?.topCustomers ?? [], status);
  const ordersByType = (data?.ordersByType ?? []).slice(0, 5);
  const maxOrdersByType = Math.max(1, ...ordersByType.map((r) => Number(r.value ?? 0)));
  const currentYear = new Date().getFullYear();

  return (
    <ReportShell
      icon={TrendingUp}
      tone="primary"
      title={t('sales.title', 'Sales Dashboard')}
      subtitle={t('sales.subtitle', 'Commercial pipeline: offers, orders, conversion, customers')}
      explain="All figures come live from your offers and sales orders. Counts group records by their status field, the conversion trend covers the last 6 months, the year comparison the last 3 years, and Top Customers ranks contacts by total sales amount. The period and status filters are applied on the loaded data."
      onRefresh={() => refetch()}
      onExport={() => data && exportSingleReport('sales', data, 'xlsx', xlsxI18n)}
      isRefreshing={isFetching}
      error={error}
    >
      <FilterBar filters={filters} initialValues={appliedFilters} onApply={setAppliedFilters} />

      {isLoading ? (
        <DashboardSkeleton kpis={4} rows={[3, 2, 1]} />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard explain="Sum of all offer counts grouped by status (every offer in the company, no date limit)." favorite={{ id: 's-kpi-offers', title: 'Total Offers', source: SOURCE }} icon={FileText} tone="primary" tag="YTD" value={offersByStatus.reduce((s, o) => s + Number(o.value ?? 0), 0)} label={t('sales.kpi.totalOffers', 'Total Offers')} trend={t('sales.kpi.vsPriorYear', 'vs prior year')} trendDirection="up" />
            <KpiCard explain="Average of the monthly conversion rates of the last 6 months. Monthly rate = offers with status accepted/won divided by all offers created that month, x100. Target line = 50%." favorite={{ id: 's-kpi-conv', title: 'Offer Conversion Rate', source: SOURCE }} icon={Repeat} tone="accent" tag="AVG" value={`${(conversion.reduce((s, c) => s + Number(c.value ?? 0), 0) / Math.max(conversion.length, 1)).toFixed(0)}%`} label={t('sales.kpi.conversion', 'Offer Conversion Rate')} trend={t('sales.kpi.target', 'target 50%')} trendDirection="up" />
            <KpiCard explain="Sum of all sales-order counts grouped by status (all sales orders)." favorite={{ id: 's-kpi-orders', title: 'Sales Orders', source: SOURCE }} icon={Receipt} tone="info" tag="LIVE" value={salesByStatus.reduce((s, o) => s + Number(o.value ?? 0), 0)} label={t('sales.kpi.openOrders', 'Sales Orders')} trendDirection="up" trend={t('sales.kpi.thisPeriod', 'this period')} />
            <KpiCard explain="Number of customers shown in the Top Customers table (top 5 contacts by total sales revenue)." favorite={{ id: 's-kpi-topcust', title: 'Top Customers', source: SOURCE }} icon={Building2} tone="success" tag="TOP" value={topCustomers.length} label={t('sales.kpi.topCustomers', 'Top Customers')} />
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-3">
            <ChartCard title={t('sales.offersByStatus', 'Offers by Status')} explain="Count of offers grouped by their Status field. Client filters (period/status) are applied on top of this list." favorite={{ id: 's-offers', title: 'Offers by Status', source: SOURCE }} empty={!offersByStatus.length}>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={offersByStatus} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value" nameKey="name">
                    {offersByStatus.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip {...tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
            <ChartCard title={t('sales.salesByStatus', 'Sales Orders by Status')} explain="Count of sales orders grouped by their Status field." favorite={{ id: 's-orders', title: 'Sales Orders by Status', source: SOURCE }} empty={!salesByStatus.length}>
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
            <ChartCard title={t('sales.conversionTrend', 'Offer Conversion Trend')} explain="Per month over the last 6 months: accepted or won offers / all offers created that month x100, rounded to 1 decimal. Target = 50%." favorite={{ id: 's-conv', title: 'Conversion Trend', source: SOURCE }} empty={!conversion.length}>
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
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-3">
            <ChartCard title={t('sales.yoyComparison', 'Sales Orders — Year Comparison')} explain="Sales orders created per month, split into three series: 2 years ago, last year and the current year (counted by creation date)." favorite={{ id: 's-yoy', title: 'Year Comparison', source: SOURCE }} className="lg:col-span-2" empty={!yoy.length}>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={yoy}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={GRID_STROKE} />
                  <XAxis dataKey="name" tick={AXIS_TICK} tickLine={false} axisLine={false} />
                  <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} />
                  <Tooltip {...tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="series1" name={String(currentYear - 2)} fill="hsl(var(--chart-5))" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="series2" name={String(currentYear - 1)} fill="hsl(var(--chart-2))" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="series3" name={String(currentYear)} fill="hsl(var(--chart-1))" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
            <ChartCard title={t('sales.ordersByType', 'Orders & Offers by Type')} explain="Line items of offers and sales orders grouped by item Type (article, service, ...). Counts of both are summed; top 8 types shown." favorite={{ id: 's-types', title: 'Orders by Type', source: SOURCE }} empty={!ordersByType.length}>
              {(['primary', 'accent', 'info', 'warning', 'purple'] as const).map((tone, i) => {
                const row = ordersByType[i];
                if (!row) return null;
                return <ProgressRow key={row.name} label={row.name} value={Math.round((Number(row.value ?? 0) / maxOrdersByType) * 100)} tone={tone} />;
              })}
            </ChartCard>
          </div>

          <div className="mt-3">
            <ChartCard title={t('sales.topCustomers', 'Top Customers — Offers & Orders')} explain="Sales grouped by contact; revenue = sum of the sale Total Amount. Top 5 contacts by revenue." favorite={{ id: 's-topcust', title: 'Top Customers', source: SOURCE }} bodyClassName="p-0" empty={!topCustomers.length}>
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
                        <td className="whitespace-nowrap px-3 py-2 text-right font-semibold">
                          {new Intl.NumberFormat(undefined, { style: 'currency', currency: currency.code, maximumFractionDigits: 0 }).format(Number(c.amount ?? 0))}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2">
                          <RagBadge status={(c.ragDot as any) || 'green'}>{translateStatus(c.status) || t('sales.active', 'Active')}</RagBadge>
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

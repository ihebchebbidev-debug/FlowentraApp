import { useReportFilters } from '../store/useReportFiltersStore';
import { filterByStatusName, filterTableByStatus } from '../utils/applyFilters';
import { exportSingleReport } from '../utils/exportReport';
import { useXlsxI18n } from '../hooks/useXlsxI18n';
import { useTranslation } from 'react-i18next';
import { Landmark, Receipt, Wallet, TrendingDown, TrendingUp } from 'lucide-react';
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { ReportShell } from '../components/ReportShell';
import { FilterBar } from '../components/FilterBar';
import { KpiCard } from '../components/KpiCard';
import { ChartCard } from '../components/ChartCard';
import { RagBadge } from '../components/RagDot';
import { CHART_COLORS, AXIS_TICK, GRID_STROKE, tooltipStyle, RAG_COLORS } from '../components/chartTheme';
import { DashboardSkeleton } from '../components/DashboardSkeleton';
import { useReportingFinance } from '../hooks/useReporting';
import { useStatusLabel } from '../utils/statusLabel';
import { useCurrency } from '@/shared/hooks/useCurrency';

const SOURCE = 'Finance' as const;
const iconByIdx = [Wallet, Receipt, TrendingUp, TrendingDown];

export const FinanceDashboard = () => {
  const { t } = useTranslation('reporting');
  const xlsxI18n = useXlsxI18n();
  const { current: currency } = useCurrency();
  const { values: appliedFilters, setValues: setAppliedFilters } = useReportFilters('finance');
  const { data, isLoading, refetch, isFetching, error } = useReportingFinance(appliedFilters);

  const filters = [
    { key: 'period', label: t('filters.period', 'Period'), options: [
      { value: '12m', label: t('filters.last12', 'Last 12 Months') },
      { value: 'ytd', label: t('filters.ytd', 'This Year') },
    ]},
    { key: 'status', label: t('finance.invoiceStatus', 'Invoice Status'), options: [
      { value: 'all', label: t('filters.all', 'All') },
      { value: 'paid', label: t('statuses.paid', { ns: 'translation', defaultValue: 'Paid' }) }, { value: 'pending', label: t('statuses.pending', { ns: 'translation', defaultValue: 'Pending' }) },
      { value: 'overdue', label: t('statuses.overdue', { ns: 'translation', defaultValue: 'Overdue' }) },
    ]},
  ];

  const status = appliedFilters.status;
  const kpis = data?.kpis ?? [];
  const translateStatus = useStatusLabel();
  const donutRaw = filterByStatusName(data?.invoiceStatusDonut ?? [], status);
  const donut = donutRaw.map((d) => ({ ...d, name: translateStatus(d.name) }));
  const expenses = data?.expensesByCategory ?? [];
  const invoices = filterTableByStatus(data?.invoiceTable ?? [], status);
  const donutColors = ['green', 'yellow', 'red', 'neutral'] as const;

  return (
    <ReportShell
      icon={Landmark}
      tone="info"
      title={t('finance.title', 'Finance Dashboard')}
      subtitle={t('finance.subtitle', 'Invoices, payments & expenses with RAG flags')}
      explain="All figures come from your sales (used as invoices) and dispatch expenses. Revenue is the sum of sale totals, outstanding is everything not marked paid, and the table lists the 10 largest sales."
      onRefresh={() => refetch()}
      onExport={() => data && exportSingleReport('finance', data, 'xlsx', xlsxI18n)}
      isRefreshing={isFetching}
      error={error}
    >
      <FilterBar filters={filters} onApply={setAppliedFilters} />
      {isLoading ? (
        <DashboardSkeleton kpis={4} rows={[2,1]} />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {(kpis.length ? kpis : [
              { title: t('finance.kpi.revenue', 'Total Revenue'), formattedValue: '—', ragStatus: 'neutral' as const, trend: '' },
              { title: t('finance.kpi.pending', 'Pending Collection'), formattedValue: '—', ragStatus: 'neutral' as const, trend: '' },
              { title: t('finance.kpi.overdue', 'Overdue'), formattedValue: '—', ragStatus: 'neutral' as const, trend: '' },
              { title: t('finance.kpi.cash', 'Cash Position'), formattedValue: '—', ragStatus: 'neutral' as const, trend: '' },
            ]).slice(0, 4).map((k, i) => {
              const Icon = iconByIdx[i] || Wallet;
              const tone = k.ragStatus === 'green' ? 'success' : k.ragStatus === 'yellow' ? 'warning' : k.ragStatus === 'red' ? 'destructive' : 'info';
              // TEMPORARY calculation notes, indexed like the backend KPI list.
              const explain = [
                'Sum of the Total Amount of every non-deleted sale (all periods).',
                'Sum of the Total Amount of the sales whose payment status is not paid.',
                'Number of non-deleted sales (each sale counts as one invoice line).',
                'Number of sales whose payment status is overdue. Green when 0.',
              ][i];
              return (
                <KpiCard explain={explain} favorite={{ id: `f-kpi-${i}`, title: k.title, source: SOURCE }} key={i} icon={Icon} tone={tone as any} value={k.formattedValue} label={k.title} trend={k.trend} rag={k.ragStatus as any} trendDirection={!k.trend ? 'neutral' : k.trend.startsWith('-') ? 'down' : 'up'} />
              );
            })}
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
            <ChartCard title={t('finance.invoiceStatus', 'Invoice Status')} explain="All non-deleted sales counted by payment status: Paid, Pending (empty/pending/unpaid/open), Partial (partial/partially_paid) and Overdue. Statuses with 0 rows are hidden." favorite={{ id: 'f-donut', title: 'Invoice Status', source: SOURCE }} empty={!donut.length}>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={donut} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value" nameKey="name">
                    {donut.map((_, i) => <Cell key={i} fill={RAG_COLORS[donutColors[i % donutColors.length]]} />)}
                  </Pie>
                  <Tooltip {...tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
            <ChartCard title={t('finance.expenses', 'Expenses by Category')} explain="Dispatch expenses grouped by expense type, summing the amount of each expense. Sorted from highest to lowest." favorite={{ id: 'f-exp', title: 'Expenses by Category', source: SOURCE }} empty={!expenses.length} emptyLabel={t('finance.expensesEmpty', 'Expense categories not yet available')}>
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
          </div>

          <div className="mt-3">
            <ChartCard title={t('finance.invoiceTable', 'Recent Invoices')} explain="The 10 sales with the highest total amount. Colour dot: green = paid, red = overdue, yellow = partial, grey = other." favorite={{ id: 'f-inv', title: 'Recent Invoices', source: SOURCE }} bodyClassName="p-0" empty={!invoices.length} emptyLabel={t('finance.invoiceEmpty', 'Invoice detail rows not yet populated')}>
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
                        <td className="whitespace-nowrap px-3 py-2 text-right font-semibold">
                          {new Intl.NumberFormat(undefined, { style: 'currency', currency: currency.code, maximumFractionDigits: 0 }).format(Number(inv.amount ?? 0))}
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

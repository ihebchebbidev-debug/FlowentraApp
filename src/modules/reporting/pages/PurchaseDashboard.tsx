import { useReportFilters } from '../store/useReportFiltersStore';
import { filterByStatusName, sliceByPeriod } from '../utils/applyFilters';
import { useTranslation } from 'react-i18next';
import { ShoppingCart, Package, Truck, DollarSign } from 'lucide-react';
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
import { useReportingPurchase } from '../hooks/useReporting';

const SOURCE = 'Purchase' as const;

export const PurchaseDashboard = () => {
  const { t } = useTranslation('reporting');
  const { values: appliedFilters, setValues: setAppliedFilters } = useReportFilters('purchase');
  const { data, isLoading, refetch, isFetching, error } = useReportingPurchase(appliedFilters);

  const filters = [
    { key: 'period', label: t('filters.period', 'Period'), options: [
      { value: '12m', label: t('filters.last12', 'Last 12 Months') },
      { value: 'ytd', label: t('filters.ytd', 'This Year') },
    ]},
    { key: 'supplier', label: t('purchase.supplier', 'Supplier'), options: [
      { value: 'all', label: t('filters.all', 'All Suppliers') },
    ]},
  ];

  const period = appliedFilters.period;
  const supplier = appliedFilters.supplier;
  const bySupplier = filterByStatusName(data?.spendBySupplier ?? [], supplier);
  const byCategory = data?.spendByCategory ?? [];
  const receiptStatus = data?.receiptStatus ?? [];
  const trend = sliceByPeriod(data?.poSpendTrend ?? [], period);
  const pos = data?.poTable ?? [];
  const totalSpend = bySupplier.reduce((s, x) => s + Number(x.value ?? 0), 0);
  const receiptColors = ['green', 'yellow', 'red', 'neutral'] as const;

  return (
    <ReportShell
      icon={ShoppingCart}
      tone="warning"
      title={t('purchase.title', 'Purchase Dashboard')}
      subtitle={t('purchase.subtitle', 'Suppliers, spend, articles & receipts')}
      onRefresh={() => refetch()}
      isRefreshing={isFetching}
      error={error}
    >
      <FilterBar filters={filters} onApply={setAppliedFilters} />
      {isLoading ? (
        <DashboardSkeleton kpis={4} rows={[3,1,1]} />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard icon={DollarSign} tone="warning" tag="YTD" value={new Intl.NumberFormat(undefined, { style: 'currency', currency: 'TND', maximumFractionDigits: 0, notation: 'compact' }).format(totalSpend)} label={t('purchase.kpi.spend', 'Total Spend')} />
            <KpiCard icon={ShoppingCart} tone="primary" tag="LIVE" value={pos.length || '—'} label={t('purchase.kpi.pos', 'Purchase Orders')} />
            <KpiCard icon={Package} tone="info" tag="AVG" value={bySupplier.length || '—'} label={t('purchase.kpi.suppliers', 'Active Suppliers')} />
            <KpiCard icon={Truck} tone="accent" tag="AVG" value={receiptStatus.length ? `${((receiptStatus.find(r => r.name?.toLowerCase() === 'received')?.value ?? 0) as number / Math.max(receiptStatus.reduce((s, x) => s + Number(x.value ?? 0), 0), 1) * 100).toFixed(0)}%` : '—'} label={t('purchase.kpi.receipt', 'Receipt Rate')} />
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-3">
            <ChartCard title={t('purchase.spendSupplier', 'Spend by Supplier — Top 8')} favorite={{ id: 'p-sup', title: 'Spend by Supplier', source: SOURCE }} className="lg:col-span-2" empty={!bySupplier.length} emptyLabel={t('purchase.empty', 'Purchase data will appear once populated')}>
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
            <div className="grid grid-cols-1 gap-3">
              <ChartCard title={t('purchase.spendCategory', 'Spend by Category')} favorite={{ id: 'p-cat', title: 'Spend by Category', source: SOURCE }} empty={!byCategory.length} emptyLabel={t('purchase.empty', 'Purchase data will appear once populated')}>
                <ResponsiveContainer width="100%" height={110}>
                  <PieChart>
                    <Pie data={byCategory} cx="50%" cy="50%" innerRadius={30} outerRadius={50} dataKey="value" nameKey="name">
                      {byCategory.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Pie>
                    <Tooltip {...tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartCard>
              <ChartCard title={t('purchase.receiptStatus', 'Receipt Status')} favorite={{ id: 'p-rec', title: 'Receipt Status', source: SOURCE }} empty={!receiptStatus.length} emptyLabel={t('purchase.empty', 'Purchase data will appear once populated')}>
                <ResponsiveContainer width="100%" height={110}>
                  <PieChart>
                    <Pie data={receiptStatus} cx="50%" cy="50%" innerRadius={30} outerRadius={50} dataKey="value" nameKey="name">
                      {receiptStatus.map((_, i) => <Cell key={i} fill={RAG_COLORS[receiptColors[i % receiptColors.length]]} />)}
                    </Pie>
                    <Tooltip {...tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>
          </div>

          <div className="mt-3">
            <ChartCard title={t('purchase.trend', 'PO Spend Trend')} favorite={{ id: 'p-trend', title: 'PO Spend Trend', source: SOURCE }} empty={!trend.length} emptyLabel={t('purchase.empty', 'Purchase data will appear once populated')}>
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
          </div>

          <div className="mt-3">
            <ChartCard title={t('purchase.poTable', 'Purchase Order Detail')} favorite={{ id: 'p-po', title: 'Purchase Orders', source: SOURCE }} bodyClassName="p-0" empty={!pos.length} emptyLabel={t('purchase.empty', 'PO detail table not yet populated')}>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-muted/50 text-[11px] uppercase tracking-wide text-muted-foreground">
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
                        <td className="whitespace-nowrap px-3 py-2"><RagBadge status={(p.ragDot as any) || 'neutral'}>{p.status}</RagBadge></td>
                        <td className="whitespace-nowrap px-3 py-2 text-right font-semibold">
                          {new Intl.NumberFormat(undefined, { style: 'currency', currency: 'TND', maximumFractionDigits: 0 }).format(Number(p.amount ?? 0))}
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

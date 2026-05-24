import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCurrency } from '@/shared/hooks/useCurrency';
import { useDashboardData } from '../hooks/useDashboardData';
import { ThemedBarChart } from '@/components/charts/ThemedBarChart';
import { DonutChartComponent } from '@/components/charts/DonutChartComponent';
import { AnalyticsChart } from '@/components/charts/AnalyticsChart';
import { LazyListItem } from '@/shared/components/LazyComponents';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import dayjs from 'dayjs';
import {
  Users,
  FileText,
  ShoppingCart,
  Package,
  TrendingUp,
  CheckCircle,
  ArrowUpRight,
  LayoutDashboard,
  Wrench,
  Truck,
  ListTodo,
  Activity,
  Pencil,
  Check,
  GripVertical,
  EyeOff,
  Maximize2,
  RotateCcw,
  Eye,
} from 'lucide-react';

// ───────────────────────────────────────────────────────────────
// Editable Overview — keeps the original look as default,
// but lets the user reorder / resize / hide tiles in edit mode.
// Layout is persisted in localStorage.
// ───────────────────────────────────────────────────────────────

type TileSpan = 1 | 2 | 3 | 4 | 6;

interface TileMeta {
  id: string;
  /** human label used in the "hidden tiles" menu */
  label: string;
  defaultSpan: TileSpan;
  /** allowed sizes for the resize cycle */
  sizes: TileSpan[];
}

interface OverviewLayout {
  order: string[];
  hidden: string[];
  spans: Record<string, TileSpan>;
}

const STORAGE_KEY = 'dashboard.overview.layout.v1';

const SPAN_CLASS: Record<TileSpan, string> = {
  1: 'lg:col-span-1',
  2: 'lg:col-span-2',
  3: 'lg:col-span-3',
  4: 'lg:col-span-4',
  6: 'lg:col-span-6',
};

function readLayout(): Partial<OverviewLayout> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function writeLayout(layout: OverviewLayout) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
  } catch {
    /* noop */
  }
}

export default function DashboardOverview() {
  const { format } = useCurrency();
  const { t } = useTranslation('dashboard');
  const navigate = useNavigate();

  const {
    sales,
    closedSalesRevenue,
    offers,
    totalContacts,
    totalArticles,
    lowStockArticles,
    overdueTasks,
    pendingTasks,
    serviceOrders,
    dispatches,
    isLoading,
  } = useDashboardData();

  // ── derived chart data (unchanged business logic) ──
  const revenueTrend = React.useMemo(() => {
    const months = Array.from({ length: 6 }, (_, i) => dayjs().subtract(5 - i, 'month'));
    return months.map(m => {
      const monthSales = sales.filter(s => {
        const d = dayjs(s.createdAt);
        return d.year() === m.year() && d.month() === m.month();
      });
      const revenue = monthSales
        .filter(s => s.status === 'closed' || s.status === 'invoiced' || s.status === 'partially_invoiced')
        .reduce((sum, s) => sum + (s.totalAmount || s.amount || 0), 0);
      const offered = offers
        .filter(o => {
          const d = dayjs(o.createdAt);
          return d.year() === m.year() && d.month() === m.month();
        })
        .reduce((sum, o) => sum + (o.totalAmount || o.amount || 0), 0);
      return { name: m.format('MMM'), revenue: Math.round(revenue), offered: Math.round(offered) };
    });
  }, [sales, offers]);

  const activityMix = React.useMemo(() => ([
    { name: t('overview.sales', 'Sales'), value: sales.length, color: 'hsl(var(--primary))' },
    { name: t('overview.offers', 'Offers'), value: offers.length, color: 'hsl(var(--chart-2, var(--primary)) / 0.75)' },
    { name: t('overview.serviceOrders', 'Service Orders'), value: serviceOrders.length, color: 'hsl(var(--chart-3, var(--primary)) / 0.6)' },
    { name: t('overview.dispatches', 'Dispatches'), value: dispatches.length, color: 'hsl(var(--chart-4, var(--primary)) / 0.45)' },
  ].filter(d => d.value > 0)), [sales, offers, serviceOrders, dispatches, t]);

  const serviceOrderStatus = React.useMemo(() => {
    const counts: Record<string, number> = {};
    serviceOrders.forEach(so => {
      const k = (so.status || 'unknown').toString();
      counts[k] = (counts[k] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [serviceOrders]);

  const salesBarData = React.useMemo(() => {
    const inProgressCount = sales.filter(s => s.status === 'in_progress' || s.status === 'created').length;
    const closedCount = sales.filter(s => s.status === 'closed' || s.status === 'invoiced' || s.status === 'partially_invoiced').length;
    const cancelledCount = sales.filter(s => s.status === 'cancelled').length;
    return [
      { name: t('overview.inProgress', 'In Progress'), value: inProgressCount },
      { name: t('overview.closed', 'Closed'), value: closedCount },
      { name: t('overview.cancelled', 'Cancelled'), value: cancelledCount },
    ];
  }, [sales, t]);

  const offersBarData = React.useMemo(() => {
    const statusCounts = { draft: 0, sent: 0, accepted: 0, declined: 0, modified: 0, cancelled: 0 };
    offers.forEach(offer => {
      const status = offer.status?.toLowerCase() || '';
      if (status === 'draft' || status === 'created') statusCounts.draft++;
      else if (status === 'sent' || status === 'pending' || status === 'negotiation') statusCounts.sent++;
      else if (status === 'accepted' || status === 'won') statusCounts.accepted++;
      else if (status === 'declined' || status === 'rejected' || status === 'expired' || status === 'lost') statusCounts.declined++;
      else if (status === 'modified') statusCounts.modified++;
      else if (status === 'cancelled') statusCounts.cancelled++;
    });
    return [
      { name: t('overview.draft'), value: statusCounts.draft },
      { name: t('overview.sent'), value: statusCounts.sent },
      { name: t('overview.accepted'), value: statusCounts.accepted },
      { name: t('overview.declined', 'Declined'), value: statusCounts.declined },
      { name: t('overview.modified', 'Modified'), value: statusCounts.modified },
      { name: t('overview.cancelled', 'Cancelled'), value: statusCounts.cancelled },
    ];
  }, [offers, t]);

  // ── tile registry ──
  const tiles: Array<TileMeta & { render: () => React.ReactNode }> = React.useMemo(() => [
    {
      id: 'kpi-revenue',
      label: t('overview.closedSalesRevenue'),
      defaultSpan: 2, sizes: [1, 2, 3, 4, 6],
      render: () => (
        <LazyListItem placeholder={<div className="h-[72px] rounded-xl bg-primary/5 animate-pulse" />}>
          <Card className="cursor-pointer group relative overflow-hidden border-0 bg-gradient-to-br from-primary/5 to-primary/10 hover:from-primary/10 hover:to-primary/20 transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 h-[72px]" onClick={() => navigate('/dashboard/sales')}>
            <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <CardContent className="p-4 relative h-full flex items-center">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-primary/20 group-hover:bg-primary/30 transition-colors shadow-sm">
                    <TrendingUp className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <span className="text-xs font-medium text-muted-foreground">{t('overview.closedSalesRevenue')}</span>
                    <p className="text-xl font-bold text-foreground">{format(Math.round(closedSalesRevenue))}</p>
                  </div>
                </div>
                <ArrowUpRight className="h-5 w-5 text-primary opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </div>
            </CardContent>
          </Card>
        </LazyListItem>
      ),
    },
    {
      id: 'kpi-contacts',
      label: t('overview.totalContacts'),
      defaultSpan: 1, sizes: [1, 2, 3],
      render: () => (
        <LazyListItem placeholder={<div className="h-[72px] rounded-xl bg-primary/5 animate-pulse" />}>
          <Card className="cursor-pointer group relative overflow-hidden border-0 bg-gradient-to-br from-primary/5 to-primary/10 hover:from-primary/10 hover:to-primary/20 transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 h-[72px]" onClick={() => navigate('/dashboard/contacts')}>
            <div className="absolute top-0 right-0 w-16 h-16 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <CardContent className="p-3 relative h-full flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-1">
                <div className="p-1.5 rounded-lg bg-primary/20 group-hover:bg-primary/30 transition-colors shadow-sm">
                  <Users className="h-4 w-4 text-primary" />
                </div>
                <span className="text-xs font-medium text-muted-foreground">{t('overview.totalContacts')}</span>
              </div>
              <p className="text-lg font-bold text-foreground">{totalContacts || '-'}</p>
            </CardContent>
          </Card>
        </LazyListItem>
      ),
    },
    {
      id: 'kpi-offers',
      label: t('overview.totalOffers'),
      defaultSpan: 1, sizes: [1, 2, 3],
      render: () => (
        <LazyListItem placeholder={<div className="h-[72px] rounded-xl bg-primary/5 animate-pulse" />}>
          <Card className="cursor-pointer group relative overflow-hidden border-0 bg-gradient-to-br from-primary/5 to-primary/10 hover:from-primary/10 hover:to-primary/20 transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 h-[72px]" onClick={() => navigate('/dashboard/offers')}>
            <div className="absolute top-0 right-0 w-16 h-16 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <CardContent className="p-3 relative h-full flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-1">
                <div className="p-1.5 rounded-lg bg-primary/20 group-hover:bg-primary/30 transition-colors shadow-sm">
                  <FileText className="h-4 w-4 text-primary" />
                </div>
                <span className="text-xs font-medium text-muted-foreground">{t('overview.totalOffers')}</span>
              </div>
              <p className="text-lg font-bold text-foreground">{offers.length || '-'}</p>
            </CardContent>
          </Card>
        </LazyListItem>
      ),
    },
    {
      id: 'kpi-sales',
      label: t('overview.totalSales'),
      defaultSpan: 1, sizes: [1, 2, 3],
      render: () => (
        <LazyListItem placeholder={<div className="h-[72px] rounded-xl bg-primary/5 animate-pulse" />}>
          <Card className="cursor-pointer group relative overflow-hidden border-0 bg-gradient-to-br from-primary/5 to-primary/10 hover:from-primary/10 hover:to-primary/20 transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 h-[72px]" onClick={() => navigate('/dashboard/sales')}>
            <div className="absolute top-0 right-0 w-16 h-16 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <CardContent className="p-3 relative h-full flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-1">
                <div className="p-1.5 rounded-lg bg-primary/20 group-hover:bg-primary/30 transition-colors shadow-sm">
                  <CheckCircle className="h-4 w-4 text-primary" />
                </div>
                <span className="text-xs font-medium text-muted-foreground">{t('overview.totalSales')}</span>
              </div>
              <p className="text-lg font-bold text-foreground">{sales.length || '-'}</p>
            </CardContent>
          </Card>
        </LazyListItem>
      ),
    },
    {
      id: 'kpi-articles',
      label: t('overview.articles'),
      defaultSpan: 1, sizes: [1, 2, 3],
      render: () => (
        <LazyListItem placeholder={<div className="h-[72px] rounded-xl bg-primary/5 animate-pulse" />}>
          <Card className={`cursor-pointer group relative overflow-hidden border-0 transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 h-[72px] ${lowStockArticles > 0 ? 'bg-gradient-to-br from-destructive/5 to-destructive/10 hover:from-destructive/10 hover:to-destructive/20' : 'bg-gradient-to-br from-primary/5 to-primary/10 hover:from-primary/10 hover:to-primary/20'}`} onClick={() => navigate('/dashboard/articles')}>
            <div className={`absolute top-0 right-0 w-16 h-16 rounded-full -translate-y-1/2 translate-x-1/2 ${lowStockArticles > 0 ? 'bg-destructive/5' : 'bg-primary/5'}`} />
            <CardContent className="p-3 relative h-full flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-1">
                <div className={`p-1.5 rounded-lg shadow-sm transition-colors ${lowStockArticles > 0 ? 'bg-destructive/20 group-hover:bg-destructive/30' : 'bg-primary/20 group-hover:bg-primary/30'}`}>
                  <Package className={`h-4 w-4 ${lowStockArticles > 0 ? 'text-destructive' : 'text-primary'}`} />
                </div>
                <span className="text-xs font-medium text-muted-foreground">{t('overview.articles')}</span>
              </div>
              <p className="text-lg font-bold text-foreground">{totalArticles || '-'}</p>
            </CardContent>
          </Card>
        </LazyListItem>
      ),
    },
    {
      id: 'chart-sales',
      label: t('overview.salesStatus', 'Sales Status'),
      defaultSpan: 3, sizes: [3, 4, 6],
      render: () => (
        <Card className="flex flex-col min-h-[320px] border-0 bg-gradient-to-br from-card to-muted/20 shadow-lg hover:shadow-xl transition-shadow duration-300 h-full">
          <CardHeader className="py-3 sm:py-4 px-4 sm:px-5 border-b border-border/50">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 rounded-xl bg-primary/10">
                  <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-sm sm:text-base font-semibold">{t('overview.salesStatus', 'Sales Status')}</CardTitle>
                  <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 hidden sm:block">{t('overview.salesStatusDesc', 'Distribution of sales by status')}</p>
                </div>
              </div>
              <button onClick={() => navigate('/dashboard/sales')} className="text-xs text-primary hover:text-primary/80 font-medium flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-primary/5 hover:bg-primary/10 transition-colors self-end sm:self-auto">
                {t('overview.viewAll')}<ArrowUpRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-3 sm:p-5 min-h-0 flex flex-col">
            {salesBarData.every(d => d.value === 0) ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <TrendingUp className="h-12 w-12 mb-3 opacity-20" />
                <p className="text-sm font-medium">{t('overview.noSalesData')}</p>
                <p className="text-xs mt-1">{t('overview.noSalesDataDesc')}</p>
              </div>
            ) : (
              <div className="flex-1 min-h-0"><ThemedBarChart data={salesBarData} height="100%" usePrimaryGradient /></div>
            )}
          </CardContent>
        </Card>
      ),
    },
    {
      id: 'chart-offers',
      label: t('overview.offersPipeline'),
      defaultSpan: 3, sizes: [3, 4, 6],
      render: () => (
        <Card className="flex flex-col min-h-[320px] border-0 bg-gradient-to-br from-card to-muted/20 shadow-lg hover:shadow-xl transition-shadow duration-300 h-full">
          <CardHeader className="py-3 sm:py-4 px-4 sm:px-5 border-b border-border/50">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 rounded-xl bg-primary/10">
                  <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-sm sm:text-base font-semibold">{t('overview.offersPipeline')}</CardTitle>
                  <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 hidden sm:block">{t('overview.offersPipelineDesc')}</p>
                </div>
              </div>
              <button onClick={() => navigate('/dashboard/offers')} className="text-xs text-primary hover:text-primary/80 font-medium flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-primary/5 hover:bg-primary/10 transition-colors self-end sm:self-auto">
                {t('overview.viewAll')}<ArrowUpRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-3 sm:p-5 min-h-0 flex flex-col">
            {offersBarData.every(d => d.value === 0) ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <ShoppingCart className="h-10 w-10 sm:h-12 sm:w-12 mb-3 opacity-20" />
                <p className="text-sm font-medium">{t('overview.noOffersData')}</p>
                <p className="text-xs mt-1">{t('overview.noOffersDataDesc')}</p>
              </div>
            ) : (
              <div className="flex-1 min-h-0"><ThemedBarChart data={offersBarData} height="100%" usePrimaryGradient /></div>
            )}
          </CardContent>
        </Card>
      ),
    },
    {
      id: 'chart-revenue-trend',
      label: t('overview.revenueTrend', 'Revenue & Offers Trend'),
      defaultSpan: 4, sizes: [3, 4, 6],
      render: () => (
        <Card className="border-0 bg-gradient-to-br from-card to-muted/20 shadow-lg h-full">
          <CardHeader className="py-3 sm:py-4 px-4 sm:px-5 border-b border-border/50">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10"><TrendingUp className="h-5 w-5 text-primary" /></div>
              <div>
                <CardTitle className="text-sm sm:text-base font-semibold">{t('overview.revenueTrend', 'Revenue & Offers Trend')}</CardTitle>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">{t('overview.revenueTrendDesc', 'Last 6 months — closed revenue vs offered value')}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-3 sm:p-5">
            <AnalyticsChart
              data={revenueTrend}
              height={260}
              series={[
                { key: 'revenue', name: t('overview.closedRevenue', 'Closed Revenue'), color: 'hsl(var(--primary))' },
                { key: 'offered', name: t('overview.offeredValue', 'Offered Value'), color: 'hsl(var(--primary) / 0.5)', dashed: true },
              ]}
            />
          </CardContent>
        </Card>
      ),
    },
    {
      id: 'chart-activity-mix',
      label: t('overview.activityMix', 'Activity Mix'),
      defaultSpan: 2, sizes: [2, 3, 4],
      render: () => (
        <Card className="border-0 bg-gradient-to-br from-card to-muted/20 shadow-lg h-full">
          <CardHeader className="py-3 sm:py-4 px-4 sm:px-5 border-b border-border/50">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10"><Activity className="h-5 w-5 text-primary" /></div>
              <div>
                <CardTitle className="text-sm sm:text-base font-semibold">{t('overview.activityMix', 'Activity Mix')}</CardTitle>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">{t('overview.activityMixDesc', 'Volume across modules')}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-3 sm:p-5 flex items-center justify-center min-h-[260px]">
            {activityMix.length === 0 ? (
              <div className="text-center text-muted-foreground">
                <Activity className="h-10 w-10 mx-auto mb-2 opacity-20" />
                <p className="text-sm">{t('overview.noActivity', 'No activity yet')}</p>
              </div>
            ) : (
              <DonutChartComponent
                data={activityMix}
                height={240}
                innerRadius={55}
                outerRadius={85}
                showLegend
                centerLabel={t('overview.total', 'Total')}
                centerValue={activityMix.reduce((s, d) => s + d.value, 0)}
              />
            )}
          </CardContent>
        </Card>
      ),
    },
    {
      id: 'op-service-orders',
      label: t('overview.serviceOrders', 'Service Orders'),
      defaultSpan: 2, sizes: [1, 2, 3],
      render: () => (
        <Card className="cursor-pointer border-0 bg-gradient-to-br from-primary/5 to-primary/10 hover:from-primary/10 hover:to-primary/20 transition-all shadow-md hover:shadow-xl h-full" onClick={() => navigate('/dashboard/field')}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/20"><Wrench className="h-5 w-5 text-primary" /></div>
            <div className="flex-1">
              <p className="text-xs font-medium text-muted-foreground">{t('overview.serviceOrders', 'Service Orders')}</p>
              <p className="text-2xl font-bold text-foreground">{serviceOrders.length}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {serviceOrderStatus.slice(0, 2).map(s => `${s.name}: ${s.value}`).join(' · ') || t('overview.allClear', 'All clear')}
              </p>
            </div>
            <ArrowUpRight className="h-4 w-4 text-primary" />
          </CardContent>
        </Card>
      ),
    },
    {
      id: 'op-dispatches',
      label: t('overview.dispatches', 'Dispatches'),
      defaultSpan: 2, sizes: [1, 2, 3],
      render: () => (
        <Card className="cursor-pointer border-0 bg-gradient-to-br from-primary/5 to-primary/10 hover:from-primary/10 hover:to-primary/20 transition-all shadow-md hover:shadow-xl h-full" onClick={() => navigate('/dashboard/field/dispatcher/interface')}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/20"><Truck className="h-5 w-5 text-primary" /></div>
            <div className="flex-1">
              <p className="text-xs font-medium text-muted-foreground">{t('overview.dispatches', 'Dispatches')}</p>
              <p className="text-2xl font-bold text-foreground">{dispatches.length}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {t('overview.activeToday', 'Active today')}: {dispatches.filter((d: any) => dayjs(d.scheduledAt || d.startDate).isSame(dayjs(), 'day')).length}
              </p>
            </div>
            <ArrowUpRight className="h-4 w-4 text-primary" />
          </CardContent>
        </Card>
      ),
    },
    {
      id: 'op-tasks',
      label: t('overview.tasks', 'Tasks'),
      defaultSpan: 2, sizes: [1, 2, 3],
      render: () => (
        <Card className={`cursor-pointer border-0 transition-all shadow-md hover:shadow-xl h-full ${overdueTasks.length > 0 ? 'bg-gradient-to-br from-destructive/5 to-destructive/10 hover:from-destructive/10 hover:to-destructive/20' : 'bg-gradient-to-br from-primary/5 to-primary/10 hover:from-primary/10 hover:to-primary/20'}`} onClick={() => navigate('/dashboard/tasks')}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${overdueTasks.length > 0 ? 'bg-destructive/20' : 'bg-primary/20'}`}>
              <ListTodo className={`h-5 w-5 ${overdueTasks.length > 0 ? 'text-destructive' : 'text-primary'}`} />
            </div>
            <div className="flex-1">
              <p className="text-xs font-medium text-muted-foreground">{t('overview.tasks', 'Tasks')}</p>
              <p className="text-2xl font-bold text-foreground">{pendingTasks}</p>
              <p className={`text-[11px] mt-0.5 ${overdueTasks.length > 0 ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
                {overdueTasks.length > 0
                  ? `${overdueTasks.length} ${t('overview.overdue', 'overdue')}`
                  : t('overview.onTrack', 'All on track')}
              </p>
            </div>
            <ArrowUpRight className={`h-4 w-4 ${overdueTasks.length > 0 ? 'text-destructive' : 'text-primary'}`} />
          </CardContent>
        </Card>
      ),
    },
  ], [t, navigate, format, closedSalesRevenue, totalContacts, offers, sales, lowStockArticles, totalArticles, salesBarData, offersBarData, revenueTrend, activityMix, serviceOrders, serviceOrderStatus, dispatches, overdueTasks, pendingTasks]);

  const defaultOrder = React.useMemo(() => tiles.map(t => t.id), [tiles]);
  const defaultSpans = React.useMemo(() => Object.fromEntries(tiles.map(t => [t.id, t.defaultSpan])) as Record<string, TileSpan>, [tiles]);

  // ── layout state ──
  const [editMode, setEditMode] = React.useState(false);
  const [layout, setLayout] = React.useState<OverviewLayout>(() => {
    const saved = readLayout();
    return {
      order: Array.isArray(saved.order) && saved.order.length ? saved.order : defaultOrder,
      hidden: Array.isArray(saved.hidden) ? saved.hidden : [],
      spans: { ...defaultSpans, ...(saved.spans || {}) },
    };
  });

  React.useEffect(() => {
    writeLayout(layout);
  }, [layout]);

  // Make sure newly-registered tiles also appear (append to order, default span)
  React.useEffect(() => {
    setLayout(prev => {
      const known = new Set(prev.order);
      const missing = defaultOrder.filter(id => !known.has(id));
      const stale = prev.order.filter(id => defaultOrder.includes(id));
      if (missing.length === 0 && stale.length === prev.order.length) return prev;
      return {
        order: [...stale, ...missing],
        hidden: prev.hidden.filter(id => defaultOrder.includes(id)),
        spans: { ...defaultSpans, ...prev.spans },
      };
    });
  }, [defaultOrder, defaultSpans]);

  const tileById = React.useMemo(() => Object.fromEntries(tiles.map(t => [t.id, t])), [tiles]);
  const visibleOrder = layout.order.filter(id => tileById[id] && !layout.hidden.includes(id));
  const hiddenTiles = layout.order.filter(id => layout.hidden.includes(id) && tileById[id]);

  // ── handlers ──
  const dragId = React.useRef<string | null>(null);
  const onDragStart = (id: string) => (e: React.DragEvent) => {
    dragId.current = id;
    e.dataTransfer.effectAllowed = 'move';
  };
  const onDragOver = (e: React.DragEvent) => {
    if (!editMode) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };
  const onDrop = (targetId: string) => (e: React.DragEvent) => {
    e.preventDefault();
    const src = dragId.current;
    dragId.current = null;
    if (!src || src === targetId) return;
    setLayout(prev => {
      const next = [...prev.order];
      const from = next.indexOf(src);
      const to = next.indexOf(targetId);
      if (from < 0 || to < 0) return prev;
      next.splice(from, 1);
      next.splice(to, 0, src);
      return { ...prev, order: next };
    });
  };

  const cycleSize = (id: string) => {
    setLayout(prev => {
      const meta = tileById[id];
      if (!meta) return prev;
      const current = prev.spans[id] ?? meta.defaultSpan;
      const idx = meta.sizes.indexOf(current);
      const nextSize = meta.sizes[(idx + 1) % meta.sizes.length];
      return { ...prev, spans: { ...prev.spans, [id]: nextSize } };
    });
  };

  const hideTile = (id: string) => setLayout(prev => ({ ...prev, hidden: [...new Set([...prev.hidden, id])] }));
  const showTile = (id: string) => setLayout(prev => ({ ...prev, hidden: prev.hidden.filter(x => x !== id) }));
  const resetLayout = () => setLayout({ order: defaultOrder, hidden: [], spans: { ...defaultSpans } });

  if (isLoading) {
    return (
      <div className="p-3 sm:p-5 h-[calc(100vh-80px)] flex flex-col gap-3 sm:gap-5 overflow-hidden">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-card rounded-xl border border-border p-4 space-y-3">
              <div className="h-4 w-24 rounded bg-muted/60 animate-shimmer bg-[length:200%_100%] bg-gradient-to-r from-muted/60 via-muted/30 to-muted/60" />
              <div className="h-8 w-16 rounded bg-muted/60 animate-shimmer bg-[length:200%_100%] bg-gradient-to-r from-muted/60 via-muted/30 to-muted/60" />
              <div className="h-3 w-32 rounded bg-muted/60 animate-shimmer bg-[length:200%_100%] bg-gradient-to-r from-muted/40 via-muted/20 to-muted/40" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 flex-1">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="bg-card rounded-xl border border-border p-4 space-y-3">
              <div className="h-5 w-32 rounded bg-muted/60 animate-shimmer bg-[length:200%_100%] bg-gradient-to-r from-muted/60 via-muted/30 to-muted/60" />
              <div className="h-40 rounded bg-muted/60 animate-shimmer bg-[length:200%_100%] bg-gradient-to-r from-muted/60 via-muted/30 to-muted/60" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-5 flex flex-col gap-3 sm:gap-5 overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10">
            <Activity className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-foreground leading-tight">
              {t('overview.title', 'Overview')}
            </h1>
            <p className="text-xs text-muted-foreground">
              {editMode
                ? t('overview.editHint', 'Drag tiles to reorder · resize · hide · then click Done')
                : t('overview.subtitle', 'A live snapshot of your entire business')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {editMode && hiddenTiles.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Eye className="h-4 w-4" />
                  {t('overview.hiddenTiles', 'Hidden')} ({hiddenTiles.length})
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>{t('overview.showAgain', 'Show again')}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {hiddenTiles.map(id => (
                  <DropdownMenuCheckboxItem
                    key={id}
                    checked={false}
                    onCheckedChange={() => showTile(id)}
                  >
                    {tileById[id]?.label}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          {editMode && (
            <Button variant="ghost" size="sm" className="gap-2" onClick={resetLayout}>
              <RotateCcw className="h-4 w-4" />
              {t('overview.reset', 'Reset')}
            </Button>
          )}
          <Button
            variant={editMode ? 'default' : 'outline'}
            size="sm"
            className="gap-2"
            onClick={() => setEditMode(v => !v)}
          >
            {editMode ? <Check className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
            {editMode ? t('overview.done', 'Done') : t('overview.edit', 'Edit')}
          </Button>
          {!editMode && (
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => navigate('/dashboard/dashboards')}
            >
              <LayoutDashboard className="h-4 w-4" />
              {t('overview.switchToCustom', 'Custom Dashboards')}
            </Button>
          )}
        </div>
      </div>

      {/* Unified 6-col grid for all tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-5 auto-rows-min">
        {visibleOrder.map(id => {
          const meta = tileById[id];
          if (!meta) return null;
          const span = layout.spans[id] ?? meta.defaultSpan;
          const spanCls = SPAN_CLASS[span];
          return (
            <div
              key={id}
              className={`relative col-span-2 sm:col-span-3 ${spanCls} ${editMode ? 'ring-2 ring-primary/30 rounded-xl' : ''}`}
              draggable={editMode}
              onDragStart={onDragStart(id)}
              onDragOver={onDragOver}
              onDrop={onDrop(id)}
            >
              {editMode && (
                <div className="absolute -top-2 -right-2 z-10 flex items-center gap-1 bg-background border border-border rounded-full shadow-md px-1 py-0.5">
                  <button
                    type="button"
                    className="p-1 rounded-full hover:bg-muted cursor-grab active:cursor-grabbing"
                    title={t('overview.dragTile', 'Drag to reorder')}
                  >
                    <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                  <button
                    type="button"
                    onClick={() => cycleSize(id)}
                    className="p-1 rounded-full hover:bg-muted"
                    title={t('overview.resizeTile', 'Resize')}
                  >
                    <Maximize2 className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="sr-only">size {span}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => hideTile(id)}
                    className="p-1 rounded-full hover:bg-destructive/10 text-destructive"
                    title={t('overview.hideTile', 'Hide')}
                  >
                    <EyeOff className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
              <div className={editMode ? 'pointer-events-none select-none' : ''}>
                {meta.render()}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

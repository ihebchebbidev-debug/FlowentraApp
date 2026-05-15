import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { dashboardShareApi } from '../services/dashboardShareApi';
import { DashboardGrid } from '../components/DashboardGrid';
import { DashboardFilterProvider } from '../context/DashboardFilterContext';
import { DashboardSnapshotProvider } from '@/modules/dashboard/context/DashboardSnapshotContext';
import type { DashboardData } from '@/modules/dashboard/hooks/useDashboardData';
import { DEFAULT_GRID_SETTINGS } from '../components/GridSettingsPopover';
import { AlertCircle, LayoutDashboard } from 'lucide-react';
import { PublicDashboardSkeleton } from '../components/widgets/WidgetSkeleton';

import i18n from 'i18next';
import en from '@/modules/dashboard/locale/en.json';
import fr from '@/modules/dashboard/locale/fr.json';
if (!i18n.hasResourceBundle('en', 'dashboard')) {
  i18n.addResourceBundle('en', 'dashboard', en, true, true);
  i18n.addResourceBundle('fr', 'dashboard', fr, true, true);
}

/** Build a DashboardData object from a serialized snapshot */
function buildSnapshotData(raw: Record<string, any>): DashboardData {
  return {
    sales: raw.sales || [],
    salesStats: raw.salesStats || { totalSales: 0, activeSales: 0, wonSales: 0, lostSales: 0, totalValue: 0, averageValue: 0, conversionRate: 0, monthlyGrowth: 0 },
    wonSales: raw.wonSales ?? 0,
    lostSales: raw.lostSales ?? 0,
    closedSales: raw.closedSales ?? 0,
    cancelledSales: raw.cancelledSales ?? 0,
    activeSales: raw.activeSales ?? 0,
    totalRevenue: raw.totalRevenue ?? 0,
    monthlyRevenue: raw.monthlyRevenue ?? 0,
    closedSalesRevenue: raw.closedSalesRevenue ?? 0,
    offers: raw.offers || [],
    offersStats: raw.offersStats || { totalOffers: 0, draftOffers: 0, activeOffers: 0, acceptedOffers: 0, declinedOffers: 0, totalValue: 0, averageValue: 0, conversionRate: 0, monthlyGrowth: 0 },
    acceptedOffers: raw.acceptedOffers ?? 0,
    pendingOffers: raw.pendingOffers ?? 0,
    contacts: raw.contacts || [],
    totalContacts: raw.totalContacts ?? 0,
    activeContacts: raw.activeContacts ?? 0,
    tasks: raw.tasks || [],
    overdueTasks: raw.overdueTasks || [],
    pendingTasks: raw.pendingTasks ?? 0,
    articles: raw.articles || [],
    totalArticles: raw.totalArticles ?? 0,
    lowStockArticles: raw.lowStockArticles ?? 0,
    serviceOrders: raw.serviceOrders || [],
    dispatches: raw.dispatches || [],
    isLoading: false,
    salesLoading: false,
    offersLoading: false,
    tasksLoading: false,
    articlesLoading: false,
    contactsLoading: false,
    serviceOrdersLoading: false,
    dispatchesLoading: false,
  };
}

export default function PublicDashboardPage() {
  const { token } = useParams<{ token: string }>();
  const { t } = useTranslation('dashboard');

  const { data: dashboard, isLoading, error } = useQuery({
    queryKey: ['public-dashboard', token],
    queryFn: () => dashboardShareApi.getByShareToken(token!),
    enabled: !!token,
    retry: 1,
    staleTime: 60_000,
  });

  const snapshotData = useMemo<DashboardData | null>(() => {
    if (!dashboard?.dataSnapshot) return null;
    return buildSnapshotData(dashboard.dataSnapshot);
  }, [dashboard]);

  if (isLoading) return <PublicDashboardSkeleton />;

  if (error || !dashboard) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="max-w-md w-full text-center bg-card border border-border rounded-xl p-8">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-foreground mb-2">{t('dashboardBuilder.publicUnavailable', 'Dashboard Unavailable')}</h2>
          <p className="text-sm text-muted-foreground">
            {(error as Error)?.message || t('dashboardBuilder.publicExpired', 'This link may have expired or the dashboard is no longer shared.')}
          </p>
        </div>
      </div>
    );
  }

  if (!snapshotData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="max-w-md w-full text-center bg-card border border-border rounded-xl p-8">
          <AlertCircle className="h-12 w-12 text-warning mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-foreground mb-2">{t('dashboardBuilder.publicNoData', 'No Data Available')}</h2>
          <p className="text-sm text-muted-foreground">
            {t('dashboardBuilder.publicNoDataDesc', 'This dashboard was shared before data snapshots were enabled. The owner needs to re-share it.')}
          </p>
        </div>
      </div>
    );
  }

  const gridSettings = dashboard.gridSettings
    ? { ...DEFAULT_GRID_SETTINGS, ...dashboard.gridSettings }
    : DEFAULT_GRID_SETTINGS;

  return (
    <DashboardSnapshotProvider snapshot={snapshotData}>
      <DashboardFilterProvider onRefresh={() => {}}>
        <div className="min-h-screen bg-muted/20 flex flex-col">
          {/* Header */}
          <div className="border-b border-border bg-card px-4 sm:px-6 py-3 flex items-center gap-3">
            <LayoutDashboard className="h-5 w-5 text-primary" />
            <div className="min-w-0 flex-1">
              <h1 className="text-sm font-semibold text-foreground truncate">{dashboard.name}</h1>
              {dashboard.description && (
                <p className="text-xs text-muted-foreground truncate">{dashboard.description}</p>
              )}
            </div>
            {dashboard.snapshotAt && (
              <span className="text-[10px] text-muted-foreground shrink-0">
                {t('dashboardBuilder.publicSnapshotAt', 'Data from')}: {new Date(dashboard.snapshotAt).toLocaleDateString()}
              </span>
            )}
          </div>

          {/* Grid */}
          <div className="flex-1 p-3 sm:p-4">
            <DashboardGrid
              widgets={dashboard.widgets}
              isEditing={false}
              gridSettings={gridSettings}
              onLayoutChange={() => {}}
              onRemoveWidget={() => {}}
              onEditWidget={() => {}}
            />
          </div>

          {/* Footer */}
          <div className="border-t border-border bg-card px-4 py-2 text-center">
            <p className="text-[10px] text-muted-foreground">
              {t('dashboardBuilder.publicFooter', 'Shared dashboard • Read-only view')}
            </p>
          </div>
        </div>
      </DashboardFilterProvider>
    </DashboardSnapshotProvider>
  );
}

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ShoppingCart, Package, FileText, TrendingDown, Plus, ArrowRight, Clock, AlertTriangle, CheckCircle, DollarSign, Play } from "lucide-react";
import { purchaseOrderService, purchaseStatsService } from "../services/purchaseService";
import { PurchasePageHeader } from "../components/PurchasePageHeader";
import { PurchaseErrorBoundary, PurchaseErrorFallback } from "../components/PurchaseErrorBoundary";
import { DashboardSkeleton } from "../components/PurchaseSkeletons";
import type { PurchaseOrder, PurchaseStats } from "../types";
import { CreateActionButton } from '@/components/CreateActionButton';
import { cn } from "@/lib/utils";
import { PurchaseAutopilotDemo } from "../components/onboarding/PurchaseAutopilotDemo";

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  validated: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  ordered: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  partially_received: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  received: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

function PurchaseDashboardContent() {
  const { t } = useTranslation('purchases');
  const navigate = useNavigate();
  const [stats, setStats] = useState<PurchaseStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<PurchaseOrder[]>([]);
  const [pendingOrders, setPendingOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [demoOpen, setDemoOpen] = useState(false);

  const load = async () => {
    setError(null);
    setLoading(true);
    try {
      // Pending orders are fetched separately so the panel reflects ALL pending POs
      // (not just whatever happens to be in the latest 5). We fetch each "pending"
      // status independently because the backend filter is single-valued.
      const [statsData, ordersData, orderedData, partialData] = await Promise.all([
        purchaseStatsService.getDashboardStats(),
        purchaseOrderService.getAll({ limit: 5 }),
        purchaseOrderService.getAll({ status: 'ordered', limit: 10 }).catch(() => ({ orders: [] as PurchaseOrder[] })),
        purchaseOrderService.getAll({ status: 'partially_received', limit: 10 }).catch(() => ({ orders: [] as PurchaseOrder[] })),
      ]);
      setStats(statsData);
      setRecentOrders(ordersData.orders || []);
      // Combine and dedupe by id, then sort by expectedDelivery (soonest first).
      const combined = [...(orderedData.orders || []), ...(partialData.orders || [])];
      const dedup = Array.from(new Map(combined.map(o => [o.id, o])).values());
      dedup.sort((a, b) => (a.expectedDelivery || '9999').localeCompare(b.expectedDelivery || '9999'));
      setPendingOrders(dedup.slice(0, 10));
    } catch (e: any) {
      setError(e?.message || t('common.loadError', 'Failed to load dashboard'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const fmt = (n: number) => n.toLocaleString('fr-TN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  return (
    <div className="flex flex-col">
      <PurchasePageHeader
        title={t('dashboard.title')}
        subtitle={t('dashboard.subtitle')}
        icon={ShoppingCart}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setDemoOpen(true)} className="gap-1.5">
              <Play className="h-3.5 w-3.5" /> Watch Demo
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate('/dashboard/purchases/orders')}>
              <ShoppingCart className="h-4 w-4 mr-1" /> {t('dashboard.viewOrders')}
            </Button>
            <CreateActionButton size="sm" onClick={() => navigate('/dashboard/purchases/orders/add')}>
              <Plus className="h-4 w-4 mr-1" /> {t('dashboard.newOrder')}
            </CreateActionButton>
          </div>
        }
      />

      {loading && <DashboardSkeleton />}

      {!loading && error && (
        <PurchaseErrorFallback error={error} onRetry={load} />
      )}

      {!loading && !error && (
        <div className="p-4 md:p-6 space-y-6 animate-in fade-in duration-300">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {[
              {
                label: t('dashboard.totalOrders'),
                value: stats?.totalOrders ?? 0,
                icon: ShoppingCart,
                color: 'text-chart-1',
                bg: 'bg-chart-1/10',
                onClick: () => navigate('/dashboard/purchases/orders'),
              },
              {
                label: t('dashboard.pendingReceipts'),
                value: stats?.pendingReceipts ?? 0,
                icon: Package,
                color: 'text-chart-2',
                bg: 'bg-chart-2/10',
                onClick: () => navigate('/dashboard/purchases/receipts'),
              },
              {
                label: t('dashboard.openInvoices'),
                value: stats?.openInvoices ?? 0,
                icon: FileText,
                color: 'text-chart-3',
                bg: 'bg-chart-3/10',
                onClick: () => navigate('/dashboard/purchases/invoices'),
              },
              {
                label: t('dashboard.monthlySpend'),
                value: `${fmt(stats?.monthlySpend ?? 0)} TND`,
                icon: DollarSign,
                color: 'text-chart-4',
                bg: 'bg-chart-4/10',
              },
            ].map((s, idx) => (
              <Card
                key={idx}
                className={cn(
                  'shadow-sm border border-border transition-all',
                  s.onClick && 'cursor-pointer hover:shadow-md hover:-translate-y-0.5',
                )}
                onClick={s.onClick}
              >
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center gap-3">
                    <div className={cn('p-2 rounded-lg shrink-0', s.bg)}>
                      <s.icon className={cn('h-4 w-4 sm:h-5 sm:w-5', s.color)} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[11px] text-muted-foreground truncate">{s.label}</div>
                      <div className="text-base sm:text-xl font-semibold text-foreground truncate">{s.value}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Recent Tables */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium">{t('dashboard.recentOrders')}</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/purchases/orders')}>
                  {t('dashboard.viewAll')} <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">{t('fields.orderNumber')}</TableHead>
                      <TableHead className="text-xs">{t('fields.supplier')}</TableHead>
                      <TableHead className="text-xs">{t('fields.status')}</TableHead>
                      <TableHead className="text-xs text-right">{t('fields.total')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentOrders.slice(0, 5).map(po => (
                      <TableRow key={po.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/dashboard/purchases/orders/${po.id}`)}>
                        <TableCell className="text-xs font-medium">{po.orderNumber}</TableCell>
                        <TableCell className="text-xs">{po.supplierName}</TableCell>
                        <TableCell><Badge variant="secondary" className={`text-[10px] ${STATUS_COLORS[po.status] || ''}`}>{t(`status.${po.status}`)}</Badge></TableCell>
                        <TableCell className="text-xs text-right font-medium">{fmt(po.grandTotal)}</TableCell>
                      </TableRow>
                    ))}
                    {recentOrders.length === 0 && (
                      <TableRow><TableCell colSpan={4} className="text-center text-xs text-muted-foreground py-6">{t('orders.empty')}</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium">{t('dashboard.pendingReceiptsTitle')}</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/purchases/receipts')}>
                  {t('dashboard.viewAll')} <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">{t('fields.orderNumber')}</TableHead>
                      <TableHead className="text-xs">{t('fields.supplier')}</TableHead>
                      <TableHead className="text-xs">{t('fields.expectedDelivery')}</TableHead>
                      <TableHead className="text-xs">{t('fields.status')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingOrders.map(po => (
                      <TableRow key={po.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/dashboard/purchases/orders/${po.id}`)}>
                        <TableCell className="text-xs font-medium">{po.orderNumber}</TableCell>
                        <TableCell className="text-xs">{po.supplierName}</TableCell>
                        <TableCell className="text-xs">{po.expectedDelivery || '-'}</TableCell>
                        <TableCell><Badge variant="secondary" className={`text-[10px] ${STATUS_COLORS[po.status] || ''}`}>{t(`status.${po.status}`)}</Badge></TableCell>
                      </TableRow>
                    ))}
                    {pendingOrders.length === 0 && (
                      <TableRow><TableCell colSpan={4} className="text-center text-xs text-muted-foreground py-6">{t('dashboard.noReceipts')}</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          {/* Quick Links */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button variant="outline" className="h-auto py-3 flex flex-col items-center gap-1" onClick={() => navigate('/dashboard/purchases/compliance')}>
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <span className="text-xs">{t('dashboard.compliance')}</span>
            </Button>
            <Button variant="outline" className="h-auto py-3 flex flex-col items-center gap-1" onClick={() => navigate('/dashboard/purchases/reports')}>
              <TrendingDown className="h-5 w-5 text-blue-500" />
              <span className="text-xs">{t('dashboard.reports')}</span>
            </Button>
            <Button variant="outline" className="h-auto py-3 flex flex-col items-center gap-1" onClick={() => navigate('/dashboard/purchases/audit-log')}>
              <Clock className="h-5 w-5 text-purple-500" />
              <span className="text-xs">{t('dashboard.auditLog')}</span>
            </Button>
            <Button variant="outline" className="h-auto py-3 flex flex-col items-center gap-1" onClick={() => navigate('/dashboard/suppliers')}>
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-xs">{t('dashboard.suppliers')}</span>
            </Button>
          </div>
        </div>
      )}

      <PurchaseAutopilotDemo open={demoOpen} onClose={() => setDemoOpen(false)} />
    </div>
  );
}

export default function PurchaseDashboard() {
  return (
    <PurchaseErrorBoundary backTo="/dashboard">
      <PurchaseDashboardContent />
    </PurchaseErrorBoundary>
  );
}

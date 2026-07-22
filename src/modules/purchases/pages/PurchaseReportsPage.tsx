import { useCurrency } from '@/shared/hooks/useCurrency';
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, LineChart as LineIcon, Clock, ArrowRight } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { purchaseOrderService } from "../services/purchaseService";
import { PurchasePageHeader } from "../components/PurchasePageHeader";
import { PurchaseErrorBoundary, PurchaseErrorFallback } from "../components/PurchaseErrorBoundary";
import { ChartSkeleton } from "../components/PurchaseSkeletons";
import type { PurchaseOrder } from "../types";

const COLORS = ['hsl(217 91% 60%)', 'hsl(142 71% 45%)', 'hsl(38 92% 50%)', 'hsl(271 91% 65%)', 'hsl(0 84% 60%)'];

function PurchaseReportsContent() {
  const { t } = useTranslation('purchases');
  const { current: currency } = useCurrency();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setError(null);
    setLoading(true);
    try {
      const pageSize = 200;
      let page = 1;
      const all: PurchaseOrder[] = [];
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const result: any = await purchaseOrderService.getAll({ page, limit: pageSize });
        const batch: PurchaseOrder[] = result?.orders || [];
        all.push(...batch);
        const totalPages = result?.pagination?.totalPages ?? 1;
        if (page >= totalPages || batch.length === 0) break;
        page += 1;
        if (page > 50) break; // safety cap: 10k orders
      }
      setOrders(all);
    } catch (e: any) {
      setError(e?.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) return <><PurchasePageHeader title={t('reports.title')} subtitle={t('reports.subtitle')} icon={BarChart3} backTo={{ to: '/dashboard/purchases', label: t('dashboard.title') }} /><ChartSkeleton /></>;
  if (error) return <><PurchasePageHeader title={t('reports.title')} subtitle={t('reports.subtitle')} icon={BarChart3} backTo={{ to: '/dashboard/purchases', label: t('dashboard.title') }} /><PurchaseErrorFallback error={error} onRetry={fetchData} backTo="/dashboard/purchases" /></>;

  const supplierSpend = orders.reduce((acc, po) => {
    if (po.status !== 'cancelled') {
      acc[po.supplierName] = (acc[po.supplierName] || 0) + po.grandTotal;
    }
    return acc;
  }, {} as Record<string, number>);
  const supplierData = Object.entries(supplierSpend).map(([name, amount]) => ({ name: name.length > 15 ? name.slice(0, 15) + '...' : name, amount: Math.round(amount) }));

  // Group by month
  const monthlySpend = orders.reduce((acc, po) => {
    if (po.status === 'cancelled' || po.status === 'draft') return acc;
    const month = po.orderDate?.slice(0, 7);
    if (month) acc[month] = (acc[month] || 0) + po.grandTotal;
    return acc;
  }, {} as Record<string, number>);
  const monthlyData = Object.entries(monthlySpend).sort().map(([month, amount]) => ({ month, amount: Math.round(amount) }));

  const tooltipStyle = { background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))' };

  return (
    <div className="flex flex-col">
      <PurchasePageHeader
        title={t('reports.title')}
        subtitle={t('reports.subtitle')}
        icon={BarChart3}
        backTo={{ to: '/dashboard/purchases', label: t('dashboard.title') }}
      />

      <div className="p-4 md:p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { to: '/dashboard/purchases/reports/supplier-performance', icon: TrendingUp, title: t('reports.supplierPerformance.title', 'Supplier Performance'), subtitle: t('reports.supplierPerformance.subtitle', 'On-time delivery, lead time and spend per supplier') },
            { to: '/dashboard/purchases/reports/price-evolution', icon: LineIcon, title: t('reports.priceEvolution.title', 'Price Evolution'), subtitle: t('reports.priceEvolution.subtitle', 'Track purchase price changes per supplier over time') },
            { to: '/dashboard/purchases/reports/aging', icon: Clock, title: t('reports.aging.title', 'Supplier Invoice Aging'), subtitle: t('reports.aging.subtitle', 'Outstanding amounts grouped by overdue age') },
          ].map(card => (
            <Card key={card.to} onClick={() => navigate(card.to)} className="cursor-pointer hover:border-primary/40 hover:shadow-sm transition-colors">
              <CardContent className="p-4 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/10"><card.icon className="h-4 w-4 text-primary" /></div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate">{card.title}</div>
                  <div className="text-xs text-muted-foreground line-clamp-2">{card.subtitle}</div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">{t('reports.monthlySpending')}</CardTitle></CardHeader>
            <CardContent>
              {monthlyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="month" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                    <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">{t('reports.noData', 'No data available')}</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">{t('reports.spendingBySupplier')}</CardTitle></CardHeader>
            <CardContent className="flex items-center justify-center">
              {supplierData.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={supplierData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={2}
                      dataKey="amount"
                      nameKey="name"
                    >
                      {supplierData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(v: number) => [`${v.toLocaleString()} ${currency.code}`, '']}
                    />
                    <Legend
                      verticalAlign="bottom"
                      align="center"
                      iconType="circle"
                      wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">{t('reports.noData', 'No data available')}</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function PurchaseReportsPage() {
  return (
    <PurchaseErrorBoundary backTo="/dashboard/purchases">
      <PurchaseReportsContent />
    </PurchaseErrorBoundary>
  );
}

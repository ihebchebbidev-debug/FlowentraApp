import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useCurrency } from '@/shared/hooks/useCurrency';
import { useAuth } from '@/contexts/AuthContext';
import { useDashboardData } from '../hooks/useDashboardData';
import { ThemedBarChart } from '@/components/charts/ThemedBarChart';
import { DonutChartComponent } from '@/components/charts/DonutChartComponent';
import dayjs from 'dayjs';
import {
  Users,
  FileText,
  ShoppingCart,
  Package,
  TrendingUp,
  ArrowUpRight,
  Wrench,
  Clock,
  Receipt,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Boxes,
  Wallet,
  ArrowUp,
  ArrowDown,
  Plus,
  LayoutDashboard,
} from 'lucide-react';

// ───────────────────────────────────────────────────────────────
// Structured overview — three focused sections:
//   1. Overall KPIs   2. Team / technicians   3. Inventory / stock
// All data is derived from the existing dashboard snapshot.
// ───────────────────────────────────────────────────────────────

const fmtHours = (minutes: number) => {
  const h = minutes / 60;
  return h >= 10 ? `${Math.round(h)}h` : `${Math.round(h * 10) / 10}h`;
};

const DONUT_PALETTE = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#a855f7', '#ec4899', '#14b8a6'];

const PANEL = 'rounded-xl border border-border/60 bg-card shadow-[0_1px_2px_rgba(0,0,0,0.04)]';

const TONE: Record<string, { chip: string; bar: string }> = {
  primary: { chip: 'bg-primary/10 text-primary', bar: 'bg-primary' },
  success: { chip: 'bg-emerald-500/10 text-emerald-600', bar: 'bg-emerald-500' },
  warning: { chip: 'bg-amber-500/10 text-amber-600', bar: 'bg-amber-500' },
  danger: { chip: 'bg-red-500/10 text-red-600', bar: 'bg-red-500' },
  info: { chip: 'bg-sky-500/10 text-sky-600', bar: 'bg-sky-500' },
};

function SectionHeader({
  icon: Icon,
  title,
  subtitle,
  onViewAll,
  viewAllLabel,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle?: string;
  onViewAll?: () => void;
  viewAllLabel?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 mb-3">
      <div className="flex items-center gap-2.5 min-w-0">
        <span className="grid place-items-center h-8 w-8 rounded-lg bg-primary/10 text-primary shrink-0">
          <Icon className="h-[18px] w-[18px]" />
        </span>
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold leading-tight tracking-tight truncate">{title}</h2>
          {subtitle && <p className="text-xs text-muted-foreground truncate">{subtitle}</p>}
        </div>
      </div>
      {onViewAll && (
        <Button variant="ghost" size="sm" className="gap-1 text-xs text-muted-foreground hover:text-foreground shrink-0" onClick={onViewAll}>
          {viewAllLabel} <ArrowUpRight className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  tone = 'primary',
  trend,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
  sub?: string;
  tone?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
  /** Month-over-month % change; renders an up/down badge. */
  trend?: number;
  onClick?: () => void;
}) {
  return (
    <div
      className={`${PANEL} p-4 transition-all ${onClick ? 'cursor-pointer hover:border-primary/40 hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)]' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13px] font-medium text-muted-foreground leading-snug">{label}</p>
        <span className={`grid place-items-center h-9 w-9 rounded-lg shrink-0 ${TONE[tone].chip}`}>
          <Icon className="h-[18px] w-[18px]" />
        </span>
      </div>
      <div className="mt-2.5 flex items-end gap-2 flex-wrap">
        <span className="text-[26px] font-bold tracking-tight tabular-nums leading-none text-foreground">{value}</span>
        {trend !== undefined && Number.isFinite(trend) && (
          <span className={`inline-flex items-center gap-0.5 text-[11px] font-semibold rounded-full px-1.5 py-0.5 mb-0.5 ${trend >= 0 ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'}`}>
            {trend >= 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      {sub && <p className="mt-1.5 text-xs text-muted-foreground truncate">{sub}</p>}
    </div>
  );
}

function Panel({ title, action, children, className = '' }: { title?: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <div className={`${PANEL} ${className}`}>
      {title && (
        <div className="flex items-center justify-between gap-2 px-4 pt-4 pb-2">
          <p className="text-sm font-semibold tracking-tight">{title}</p>
          {action}
        </div>
      )}
      <div className={title ? 'px-4 pb-4' : 'p-4'}>{children}</div>
    </div>
  );
}

const SkeletonGrid = ({ n }: { n: number }) => (
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
    {Array.from({ length: n }).map((_, i) => (
      <div key={i} className="h-[104px] rounded-xl border border-border/60 bg-muted/30 animate-pulse" />
    ))}
  </div>
);

export default function DashboardOverview() {
  const { format } = useCurrency();
  const { t } = useTranslation('dashboard');
  const navigate = useNavigate();
  const { user } = useAuth();

  const greeting = React.useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return t('overview.greetingMorning', { defaultValue: 'Good morning' });
    if (h < 18) return t('overview.greetingAfternoon', { defaultValue: 'Good afternoon' });
    return t('overview.greetingEvening', { defaultValue: 'Good evening' });
  }, [t]);

  const quickActions = [
    { label: t('overview.newSale', { defaultValue: 'New sale' }), to: '/dashboard/sales/add' },
    { label: t('overview.newOffer', { defaultValue: 'New offer' }), to: '/dashboard/offers/add' },
    { label: t('overview.newServiceOrder', { defaultValue: 'New service order' }), to: '/dashboard/field/service-orders/create' },
  ];

  const {
    sales,
    closedSalesRevenue,
    offers,
    totalContacts,
    serviceOrders,
    dispatches,
    articles,
    isLoading,
  } = useDashboardData();

  // ── Section 1: Overall ───────────────────────────────────────
  const activeSales = React.useMemo(
    () => sales.filter(s => !['closed', 'cancelled', 'invoiced', 'completed'].includes((s.status || '').toLowerCase())).length,
    [sales],
  );
  const openOffers = React.useMemo(
    () => offers.filter(o => ['draft', 'sent', 'pending', 'negotiation'].includes((o.status || '').toLowerCase())).length,
    [offers],
  );
  const activeServiceOrders = React.useMemo(
    () => serviceOrders.filter(so => !['completed', 'closed', 'invoiced', 'cancelled'].includes((so.status || '').toLowerCase())).length,
    [serviceOrders],
  );

  // This-month revenue + month-over-month delta for the headline KPI.
  const revenueMoM = React.useMemo(() => {
    const sum = (offset: number) => {
      const m = dayjs().subtract(offset, 'month');
      return sales
        .filter(s => { const d = dayjs(s.createdAt); return d.month() === m.month() && d.year() === m.year(); })
        .reduce((acc, s) => acc + (Number((s as any).totalAmount ?? (s as any).amount ?? 0) || 0), 0);
    };
    const thisMonth = sum(0);
    const lastMonth = sum(1);
    const delta = lastMonth > 0 ? Math.round(((thisMonth - lastMonth) / lastMonth) * 100) : (thisMonth > 0 ? 100 : undefined);
    return { thisMonth, lastMonth, delta };
  }, [sales]);

  const revenueTrend = React.useMemo(() => {
    const months = Array.from({ length: 6 }, (_, i) => dayjs().subtract(5 - i, 'month'));
    return months.map(m => {
      const revenue = sales
        .filter(s => {
          const d = dayjs(s.createdAt);
          return d.month() === m.month() && d.year() === m.year();
        })
        .reduce((sum, s) => sum + (Number((s as any).totalAmount ?? (s as any).amount ?? 0) || 0), 0);
      return { name: m.format('MMM'), value: Math.round(revenue) };
    });
  }, [sales]);

  const serviceOrderStatus = React.useMemo(() => {
    const counts: Record<string, number> = {};
    serviceOrders.forEach(so => {
      const k = (so.status || 'unknown').toString().replace(/_/g, ' ');
      counts[k] = (counts[k] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value], i) => ({ name, value, color: DONUT_PALETTE[i % DONUT_PALETTE.length] }));
  }, [serviceOrders]);

  // ── Section 2: Team / technicians ────────────────────────────
  const techStats = React.useMemo(() => {
    const map = new Map<string, { id: string; name: string; minutes: number; expenses: number; jobs: number; completed: number }>();
    for (const d of dispatches as any[]) {
      const id = String(d.technicianId ?? '');
      if (!id || id === 'undefined' || id === 'null') continue;
      const name = d.technicianName || t('overview.technician', { defaultValue: 'Technician' });
      const e = map.get(id) || { id, name, minutes: 0, expenses: 0, jobs: 0, completed: 0 };
      e.minutes += Number(d.duration ?? 0) || 0;
      e.expenses += (Array.isArray(d.expenses) ? d.expenses : []).reduce((s: number, x: any) => s + (Number(x.amount ?? 0) || 0), 0);
      e.jobs += 1;
      if ((d.status || '').toLowerCase() === 'completed') e.completed += 1;
      map.set(id, e);
    }
    return Array.from(map.values()).sort((a, b) => b.minutes - a.minutes);
  }, [dispatches, t]);

  const teamTotals = React.useMemo(() => {
    const minutes = techStats.reduce((s, x) => s + x.minutes, 0);
    const expenses = techStats.reduce((s, x) => s + x.expenses, 0);
    const completed = techStats.reduce((s, x) => s + x.completed, 0);
    return { minutes, expenses, completed, active: techStats.length };
  }, [techStats]);

  const maxTechMinutes = Math.max(1, ...techStats.map(t => t.minutes));

  // ── Section 3: Inventory / stock ─────────────────────────────
  const stockStats = React.useMemo(() => {
    let value = 0, low = 0, out = 0;
    for (const a of articles as any[]) {
      value += (Number(a.stock ?? 0) || 0) * (Number(a.price ?? a.costPrice ?? 0) || 0);
      const st = (a.status || '').toLowerCase();
      if (st === 'out_of_stock') out++;
      else if (st === 'low_stock') low++;
    }
    return { value, low, out, total: articles.length, available: articles.length - low - out };
  }, [articles]);

  const stockDonut = React.useMemo(() => ([
    { name: t('overview.available', { defaultValue: 'Available' }), value: stockStats.available, color: '#10b981' },
    { name: t('overview.lowStock', { defaultValue: 'Low stock' }), value: stockStats.low, color: '#f59e0b' },
    { name: t('overview.outOfStock', { defaultValue: 'Out of stock' }), value: stockStats.out, color: '#ef4444' },
  ].filter(d => d.value > 0)), [stockStats, t]);

  const lowStockItems = React.useMemo(
    () => (articles as any[])
      .filter(a => ['low_stock', 'out_of_stock'].includes((a.status || '').toLowerCase()))
      .sort((a, b) => (a.stock ?? 0) - (b.stock ?? 0))
      .slice(0, 8),
    [articles],
  );

  return (
    <div className="space-y-6 p-3 sm:p-5 max-w-[1600px] mx-auto">
      {/* ══ Header · greeting + quick actions ══ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-[22px] font-bold leading-tight tracking-tight truncate">
            {greeting}{user?.firstName ? `, ${user.firstName}` : ''} 👋
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {dayjs().format('dddd, D MMMM YYYY')} · {t('overview.welcomeMessage', { defaultValue: "Here's an overview of your business" })}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {quickActions.map(a => (
            <Button key={a.to} variant="outline" size="sm" className="gap-1.5" onClick={() => navigate(a.to)}>
              <Plus className="h-3.5 w-3.5" /> {a.label}
            </Button>
          ))}
          <Button size="sm" className="gap-1.5" onClick={() => navigate('/dashboard/dashboards')}>
            <LayoutDashboard className="h-3.5 w-3.5" /> {t('overview.newDashboard', { defaultValue: 'New dashboard' })}
          </Button>
        </div>
      </div>

      {/* ══ Section 1 · Overall ══ */}
      <section>
        <SectionHeader
          icon={TrendingUp}
          title={t('overview.section.overall', { defaultValue: 'Business overview' })}
          subtitle={t('overview.section.overallSub', { defaultValue: 'Your key performance indicators at a glance' })}
        />
        {isLoading ? (
          <SkeletonGrid n={5} />
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <StatCard
              icon={TrendingUp}
              tone="primary"
              label={t('overview.revenueThisMonth', { defaultValue: 'Revenue (this month)' })}
              value={format(Math.round(revenueMoM.thisMonth))}
              sub={`${t('overview.allTimeClosed', { defaultValue: 'All-time' })}: ${format(Math.round(closedSalesRevenue))}`}
              trend={revenueMoM.delta}
              onClick={() => navigate('/dashboard/sales')}
            />
            <StatCard icon={ShoppingCart} tone="success" label={t('overview.activeSales', { defaultValue: 'Active sales' })} value={activeSales} onClick={() => navigate('/dashboard/sales')} />
            <StatCard icon={FileText} tone="info" label={t('overview.openOffers', { defaultValue: 'Open offers' })} value={openOffers} onClick={() => navigate('/dashboard/offers')} />
            <StatCard icon={Wrench} tone="warning" label={t('overview.activeServiceOrders', { defaultValue: 'Active service orders' })} value={activeServiceOrders} onClick={() => navigate('/dashboard/field/service-orders/list')} />
            <StatCard icon={Users} tone="primary" label={t('overview.totalContacts', { defaultValue: 'Contacts' })} value={totalContacts || '-'} onClick={() => navigate('/dashboard/contacts')} />
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-3 mt-3">
          <Panel className="lg:col-span-2" title={t('overview.revenueTrend', { defaultValue: 'Revenue — last 6 months' })}>
            <ThemedBarChart data={revenueTrend} height={210} />
          </Panel>
          <Panel title={t('overview.serviceOrderStatus', { defaultValue: 'Service orders by status' })}>
            {serviceOrderStatus.length > 0
              ? <DonutChartComponent data={serviceOrderStatus} height={210} />
              : <div className="h-[210px] flex items-center justify-center text-sm text-muted-foreground">{t('overview.noData', { defaultValue: 'No data yet' })}</div>}
          </Panel>
        </div>
      </section>

      {/* ══ Section 2 · Team / technicians ══ */}
      <section>
        <SectionHeader
          icon={UserCheck}
          title={t('overview.section.team', { defaultValue: 'Team performance' })}
          subtitle={t('overview.section.teamSub', { defaultValue: 'Hours worked, expenses and jobs per technician' })}
          onViewAll={() => navigate('/dashboard/dispatcher')}
          viewAllLabel={t('overview.openPlanner', { defaultValue: 'Planner' })}
        />
        {isLoading ? (
          <SkeletonGrid n={4} />
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <StatCard icon={Clock} tone="info" label={t('overview.hoursWorked', { defaultValue: 'Hours worked' })} value={fmtHours(teamTotals.minutes)} />
              <StatCard icon={Receipt} tone="warning" label={t('overview.teamExpenses', { defaultValue: 'Expenses' })} value={format(Math.round(teamTotals.expenses))} />
              <StatCard icon={UserCheck} tone="primary" label={t('overview.activeTechnicians', { defaultValue: 'Active technicians' })} value={teamTotals.active} />
              <StatCard icon={CheckCircle2} tone="success" label={t('overview.jobsCompleted', { defaultValue: 'Jobs completed' })} value={teamTotals.completed} />
            </div>

            <div className={`${PANEL} mt-3 overflow-hidden`}>
                {techStats.length === 0 ? (
                  <div className="h-32 flex flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
                    <UserCheck className="h-7 w-7 opacity-30" />
                    {t('overview.noTechnicianData', { defaultValue: 'No technician activity yet' })}
                  </div>
                ) : (
                  <div className="divide-y divide-border/60">
                    <div className="grid grid-cols-12 gap-2 px-4 py-2 text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                      <span className="col-span-5">{t('overview.technician', { defaultValue: 'Technician' })}</span>
                      <span className="col-span-3 text-right">{t('overview.hours', { defaultValue: 'Hours' })}</span>
                      <span className="col-span-2 text-right">{t('overview.expenses', { defaultValue: 'Expenses' })}</span>
                      <span className="col-span-2 text-right">{t('overview.jobs', { defaultValue: 'Jobs' })}</span>
                    </div>
                    {techStats.slice(0, 8).map(tech => (
                      <div key={tech.id} className="grid grid-cols-12 gap-2 px-4 py-2.5 items-center hover:bg-muted/30 transition-colors">
                        <div className="col-span-5 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="h-7 w-7 rounded-full bg-primary/10 text-primary text-[10px] font-bold inline-flex items-center justify-center shrink-0">
                              {tech.name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2)}
                            </span>
                            <span className="text-sm font-medium truncate">{tech.name}</span>
                          </div>
                          <div className="mt-1 h-1 rounded-full bg-muted overflow-hidden">
                            <div className="h-full bg-primary/70" style={{ width: `${(tech.minutes / maxTechMinutes) * 100}%` }} />
                          </div>
                        </div>
                        <span className="col-span-3 text-right text-sm font-semibold">{fmtHours(tech.minutes)}</span>
                        <span className="col-span-2 text-right text-xs text-muted-foreground">{format(Math.round(tech.expenses))}</span>
                        <span className="col-span-2 text-right text-xs">
                          <span className="font-medium">{tech.completed}</span>
                          <span className="text-muted-foreground">/{tech.jobs}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                )}
            </div>
          </>
        )}
      </section>

      {/* ══ Section 3 · Inventory / stock ══ */}
      <section>
        <SectionHeader
          icon={Boxes}
          title={t('overview.section.stock', { defaultValue: 'Inventory & stock' })}
          subtitle={t('overview.section.stockSub', { defaultValue: 'Stock value and items needing attention' })}
          onViewAll={() => navigate('/dashboard/inventory-services')}
          viewAllLabel={t('overview.openInventory', { defaultValue: 'Inventory' })}
        />
        {isLoading ? (
          <SkeletonGrid n={4} />
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <StatCard icon={Package} tone="primary" label={t('overview.totalArticles', { defaultValue: 'Total articles' })} value={stockStats.total} onClick={() => navigate('/dashboard/inventory-services')} />
              <StatCard icon={Wallet} tone="success" label={t('overview.stockValue', { defaultValue: 'Stock value' })} value={format(Math.round(stockStats.value))} />
              <StatCard icon={AlertTriangle} tone="warning" label={t('overview.lowStock', { defaultValue: 'Low stock' })} value={stockStats.low} onClick={() => navigate('/dashboard/inventory-services')} />
              <StatCard icon={XCircle} tone="danger" label={t('overview.outOfStock', { defaultValue: 'Out of stock' })} value={stockStats.out} onClick={() => navigate('/dashboard/inventory-services')} />
            </div>

            <div className="grid lg:grid-cols-3 gap-3 mt-3">
              <Panel title={t('overview.stockBreakdown', { defaultValue: 'Stock status' })}>
                {stockDonut.length > 0
                  ? <DonutChartComponent data={stockDonut} height={210} />
                  : <div className="h-[210px] flex items-center justify-center text-sm text-muted-foreground">{t('overview.noData', { defaultValue: 'No data yet' })}</div>}
              </Panel>
              <Panel className="lg:col-span-2" title={t('overview.needsRestock', { defaultValue: 'Needs restocking' })}>
                {lowStockItems.length === 0 ? (
                  <div className="h-32 flex flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-7 w-7 opacity-30" />
                    {t('overview.allStocked', { defaultValue: 'Everything is well stocked ✓' })}
                  </div>
                ) : (
                  <div className="divide-y divide-border/60 -my-1">
                    {lowStockItems.map((a: any) => (
                      <div key={a.id} className="flex items-center justify-between gap-3 py-2.5">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className={`h-2 w-2 rounded-full shrink-0 ${(a.status || '').toLowerCase() === 'out_of_stock' ? 'bg-red-500' : 'bg-amber-500'}`} />
                          <span className="text-sm truncate">{a.name || a.title || `#${a.id}`}</span>
                        </div>
                        <div className="text-right shrink-0 tabular-nums">
                          <span className={`text-sm font-semibold ${(a.status || '').toLowerCase() === 'out_of_stock' ? 'text-red-600' : 'text-amber-600'}`}>{a.stock ?? 0}</span>
                          <span className="text-xs text-muted-foreground"> / {t('overview.min', { defaultValue: 'min' })} {a.minStock ?? 0}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Panel>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

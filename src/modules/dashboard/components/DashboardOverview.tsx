import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useCurrency } from '@/shared/hooks/useCurrency';
import { useAuth } from '@/contexts/AuthContext';
import { useDashboardData } from '../hooks/useDashboardData';
import { ThemedBarChart } from '@/components/charts/ThemedBarChart';
import { DonutChartComponent } from '@/components/charts/DonutChartComponent';
import dayjs from 'dayjs';
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useDashboardLayout } from '../store/useDashboardLayoutStore';
import { useFavoritesStore } from '@/modules/reporting/store/useFavoritesStore';
import { FavoriteWidgetCard, getWidgetSize } from '@/modules/reporting/widgets/FavoriteWidgets';
import { DashboardCustomizeSheet, type CustomizeRow } from './DashboardCustomizeSheet';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
  ExternalLink,
  Settings2,
  RotateCcw,
} from 'lucide-react';

// ───────────────────────────────────────────────────────────────
// Structured overview — three focused sections:
//   1. Overall KPIs   2. Team / technicians   3. Inventory / stock
// Every KPI card is the same shape (label · value · ring) so a row
// reads as one clean band; the ring turns each card into a small
// circle-graph instead of a number floating in whitespace.
// ───────────────────────────────────────────────────────────────

const fmtHours = (minutes: number) => {
  const h = minutes / 60;
  return h >= 10 ? `${Math.round(h)}h` : `${Math.round(h * 10) / 10}h`;
};

const DONUT_PALETTE = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#a855f7', '#ec4899', '#14b8a6'];

const PANEL = 'rounded-xl border border-border/60 bg-card shadow-[0_1px_2px_rgba(0,0,0,0.04)]';

type Tone = 'primary' | 'success' | 'warning' | 'danger' | 'info';
const TONE: Record<Tone, { chip: string; text: string; bar: string; hex: string }> = {
  primary: { chip: 'bg-primary/10 text-primary', text: 'text-primary', bar: 'bg-primary', hex: '#6366f1' },
  success: { chip: 'bg-emerald-500/10 text-emerald-600', text: 'text-emerald-600', bar: 'bg-emerald-500', hex: '#10b981' },
  warning: { chip: 'bg-amber-500/10 text-amber-600', text: 'text-amber-600', bar: 'bg-amber-500', hex: '#f59e0b' },
  danger: { chip: 'bg-red-500/10 text-red-600', text: 'text-red-600', bar: 'bg-red-500', hex: '#ef4444' },
  info: { chip: 'bg-sky-500/10 text-sky-600', text: 'text-sky-600', bar: 'bg-sky-500', hex: '#0ea5e9' },
};

// Clean, uniform KPI card — no decorative rings, the visual weight lives in the
// two charts so the page reads as an overview, not a wall of widgets.
function KpiCard({
  icon: Icon,
  label,
  value,
  tone = 'primary',
  trend,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
  tone?: Tone;
  /** Month-over-month % change; renders an up/down pill next to the value. */
  trend?: number;
  onClick?: () => void;
}) {
  return (
    <div
      className={`${PANEL} p-4 h-full transition-all ${
        onClick ? 'cursor-pointer hover:border-primary/40 hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)]' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-px-12 font-medium text-muted-foreground truncate">{label}</p>
        <span className={`grid place-items-center h-8 w-8 rounded-lg shrink-0 ${TONE[tone].chip}`}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <div className="mt-2.5 flex items-end gap-2 flex-wrap">
        <span className="text-px-24 font-bold tracking-tight tabular-nums leading-none text-foreground">{value}</span>
        {trend !== undefined && Number.isFinite(trend) && (
          <span
            className={`inline-flex items-center gap-0.5 text-px-10 font-semibold rounded-full px-1.5 py-0.5 mb-0.5 ${
              trend >= 0 ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'
            }`}
          >
            {trend >= 0 ? <ArrowUp className="h-2.5 w-2.5" /> : <ArrowDown className="h-2.5 w-2.5" />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
    </div>
  );
}

// Compact inline figure used in the team/stock summary strips.
function Stat({ icon: Icon, label, value, tone = 'primary' }: { icon: React.ComponentType<{ className?: string }>; label: string; value: React.ReactNode; tone?: Tone }) {
  return (
    <div className="flex items-center gap-2.5 min-w-0">
      <span className={`grid place-items-center h-9 w-9 rounded-lg shrink-0 ${TONE[tone].chip}`}>
        <Icon className="h-[18px] w-[18px]" />
      </span>
      <div className="min-w-0">
        <p className="text-px-11 text-muted-foreground truncate">{label}</p>
        <p className="text-base font-bold tabular-nums leading-tight truncate">{value}</p>
      </div>
    </div>
  );
}

function PanelHead({ icon: Icon, title, onViewAll, viewAllLabel }: { icon: React.ComponentType<{ className?: string }>; title: string; onViewAll?: () => void; viewAllLabel?: string }) {
  return (
    <div className="flex items-center justify-between gap-2 px-4 pt-4 pb-3">
      <div className="flex items-center gap-2 min-w-0">
        <span className="grid place-items-center h-7 w-7 rounded-lg bg-primary/10 text-primary shrink-0">
          <Icon className="h-4 w-4" />
        </span>
        <h2 className="text-sm font-semibold tracking-tight truncate">{title}</h2>
      </div>
      {onViewAll && (
        <Button variant="ghost" size="sm" className="gap-1 text-xs text-muted-foreground hover:text-foreground shrink-0" onClick={onViewAll}>
          {viewAllLabel} <ArrowUpRight className="h-3.5 w-3.5" />
        </Button>
      )}
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
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
    {Array.from({ length: n }).map((_, i) => (
      <div key={i} className="h-[92px] rounded-xl border border-border/60 bg-muted/30 animate-pulse" />
    ))}
  </div>
);

// ── Customizable-grid plumbing ───────────────────────────────
// Card sizes map to column spans in a 4-col grid (2-col on small screens).
type CardSize = 'kpi' | 'half' | 'wide';
const SPAN: Record<CardSize, string> = {
  kpi: 'col-span-1',
  half: 'col-span-1 sm:col-span-2 lg:col-span-2',
  wide: 'col-span-1 sm:col-span-2 lg:col-span-4',
};
// Reporting widget sizes → dashboard card sizes.
const reportingSizeToCard = (id: string): CardSize => {
  const s = getWidgetSize(id);
  return s === 'kpi' ? 'kpi' : s === 'chart' ? 'half' : 'wide';
};

interface DashboardCard {
  id: string;
  size: CardSize;
  node: React.ReactNode;
  /** True for pinned reporting widgets (removed by un-pinning, not hiding). */
  reporting?: boolean;
}

function SortableCard({
  card,
  onOpen,
}: {
  card: DashboardCard;
  onOpen?: () => void;
}) {
  const { t } = useTranslation('dashboard');
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 20 : undefined,
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        SPAN[card.size],
        'group relative min-w-0',
        isDragging && 'opacity-80 shadow-lg ring-2 ring-primary/40 rounded-xl'
      )}
      {...attributes}
      {...listeners}
    >
      {card.reporting && onOpen && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpen();
          }}
          onPointerDown={(e) => e.stopPropagation()}
          aria-label={t('overview.openSourceReport', { defaultValue: 'Open source report' })}
          className="absolute right-2 top-2 z-20 hidden items-center gap-1 rounded-full border bg-card px-2 py-0.5 text-px-10 font-medium text-muted-foreground shadow-sm transition hover:text-foreground group-hover:flex"
        >
          <ExternalLink className="h-3 w-3" />
        </button>
      )}
      <div className="h-full">{card.node}</div>
    </div>
  );
}

export default function DashboardOverview() {
  const { format } = useCurrency();
  const { t } = useTranslation('dashboard');
  const navigate = useNavigate();
  const { user } = useAuth();

  // Per-user customizable dashboard layout (synced to account) + pinned widgets.
  // NOTE: `order`/`hidden` in the layout store contain DEFAULT card ids only —
  // pinned reporting widget ordering is owned by the favorites store and
  // always renders at the TOP of the dashboard.
  const { order, hidden, setOrder, hide, unhide, reset } = useDashboardLayout();
  const { widgets: pinnedWidgets, remove: unpinWidget, reorder: reorderFavorites } = useFavoritesStore();
  const [customizeOpen, setCustomizeOpen] = React.useState(false);
  const [confirmResetOpen, setConfirmResetOpen] = React.useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const greeting = React.useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return t('overview.greetingMorning', { defaultValue: 'Good morning' });
    if (h < 18) return t('overview.greetingAfternoon', { defaultValue: 'Good afternoon' });
    return t('overview.greetingEvening', { defaultValue: 'Good evening' });
  }, [t]);



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
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value], i) => ({ name, value, color: DONUT_PALETTE[i % DONUT_PALETTE.length] }));
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
    const jobs = techStats.reduce((s, x) => s + x.jobs, 0);
    return { minutes, expenses, completed, jobs, active: techStats.length };
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

  // ── Default cards (individually removable / reorderable) ─────
  const defaultCards: DashboardCard[] = [
    {
      id: 'kpi-revenue', size: 'kpi', node: (
        <KpiCard
          icon={TrendingUp}
          tone={(revenueMoM.delta ?? 0) >= 0 ? 'success' : 'danger'}
          label={t('overview.revenueThisMonth', { defaultValue: 'Revenue (this month)' })}
          value={format(Math.round(revenueMoM.thisMonth))}
          trend={revenueMoM.delta}
          onClick={() => navigate('/dashboard/sales')}
        />
      ),
    },
    { id: 'kpi-active-sales', size: 'kpi', node: <KpiCard icon={ShoppingCart} tone="success" label={t('overview.activeSales', { defaultValue: 'Active sales' })} value={activeSales} onClick={() => navigate('/dashboard/sales')} /> },
    { id: 'kpi-open-offers', size: 'kpi', node: <KpiCard icon={FileText} tone="info" label={t('overview.openOffers', { defaultValue: 'Open offers' })} value={openOffers} onClick={() => navigate('/dashboard/offers')} /> },
    { id: 'kpi-active-so', size: 'kpi', node: <KpiCard icon={Wrench} tone="warning" label={t('overview.activeServiceOrders', { defaultValue: 'Active service orders' })} value={activeServiceOrders} onClick={() => navigate('/dashboard/field/service-orders/list')} /> },
    { id: 'kpi-contacts', size: 'kpi', node: <KpiCard icon={Users} tone="primary" label={t('overview.totalContacts', { defaultValue: 'Contacts' })} value={totalContacts || '-'} onClick={() => navigate('/dashboard/contacts')} /> },
    {
      id: 'chart-revenue-trend', size: 'wide', node: (
        <Panel className="h-full" title={t('overview.revenueTrend', { defaultValue: 'Revenue — last 6 months' })}>
          <ThemedBarChart data={revenueTrend} height={240} />
        </Panel>
      ),
    },
    {
      id: 'chart-service-status', size: 'half', node: (
        <Panel className="h-full" title={t('overview.serviceOrderStatus', { defaultValue: 'Service orders by status' })}>
          {serviceOrderStatus.length > 0
            ? <DonutChartComponent data={serviceOrderStatus} height={240} innerRadius={58} outerRadius={92} centerValue={serviceOrders.length} centerLabel={t('overview.total', { defaultValue: 'Total' })} />
            : <div className="h-[240px] flex items-center justify-center text-sm text-muted-foreground">{t('overview.noData', { defaultValue: 'No data yet' })}</div>}
        </Panel>
      ),
    },
    {
      id: 'panel-team', size: 'wide', node: (
        <div className={`${PANEL} h-full overflow-hidden`}>
          <PanelHead
            icon={UserCheck}
            title={t('overview.section.team', { defaultValue: 'Team performance' })}
            onViewAll={() => navigate('/dashboard/dispatcher')}
            viewAllLabel={t('overview.openPlanner', { defaultValue: 'Planner' })}
          />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 px-4 pb-4">
            <Stat icon={Clock} tone="info" label={t('overview.hoursWorked', { defaultValue: 'Hours worked' })} value={fmtHours(teamTotals.minutes)} />
            <Stat icon={Receipt} tone="warning" label={t('overview.teamExpenses', { defaultValue: 'Expenses' })} value={teamTotals.expenses > 0 ? format(Math.round(teamTotals.expenses)) : '—'} />
            <Stat icon={UserCheck} tone="primary" label={t('overview.activeTechnicians', { defaultValue: 'Active technicians' })} value={teamTotals.active} />
            <Stat icon={CheckCircle2} tone="success" label={t('overview.jobsCompleted', { defaultValue: 'Jobs completed' })} value={teamTotals.completed} />
          </div>
          {techStats.length === 0 ? (
            <div className="h-24 flex flex-col items-center justify-center gap-2 text-sm text-muted-foreground border-t border-border/60">
              <UserCheck className="h-6 w-6 opacity-30" />
              {t('overview.noTechnicianData', { defaultValue: 'No technician activity yet' })}
            </div>
          ) : (
            <div className="border-t border-border/60 divide-y divide-border/60">
              {techStats.slice(0, 6).map(tech => (
                <div key={tech.id} className="grid grid-cols-12 gap-2 px-4 py-2.5 items-center hover:bg-muted/30 transition-colors">
                  <div className="col-span-5 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="h-7 w-7 rounded-full bg-primary/10 text-primary text-px-10 font-bold inline-flex items-center justify-center shrink-0">
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
      ),
    },
    {
      id: 'chart-stock-status', size: 'half', node: (
        <Panel className="h-full" title={t('overview.stockBreakdown', { defaultValue: 'Stock status' })}>
          {stockDonut.length > 0
            ? <DonutChartComponent data={stockDonut} height={220} innerRadius={56} outerRadius={90} centerValue={stockStats.total} centerLabel={t('overview.totalArticles', { defaultValue: 'Total articles' })} />
            : <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">{t('overview.noData', { defaultValue: 'No data yet' })}</div>}
        </Panel>
      ),
    },
    {
      id: 'panel-stock', size: 'wide', node: (
        <div className={`${PANEL} h-full overflow-hidden`}>
          <PanelHead
            icon={Boxes}
            title={t('overview.section.stock', { defaultValue: 'Inventory & stock' })}
            onViewAll={() => navigate('/dashboard/inventory-services')}
            viewAllLabel={t('overview.openInventory', { defaultValue: 'Inventory' })}
          />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 px-4 pb-4">
            <Stat icon={Package} tone="primary" label={t('overview.totalArticles', { defaultValue: 'Total articles' })} value={stockStats.total} />
            <Stat icon={Wallet} tone="success" label={t('overview.stockValue', { defaultValue: 'Stock value' })} value={stockStats.value > 0 ? format(Math.round(stockStats.value)) : '—'} />
            <Stat icon={AlertTriangle} tone="warning" label={t('overview.lowStock', { defaultValue: 'Low stock' })} value={stockStats.low} />
            <Stat icon={XCircle} tone="danger" label={t('overview.outOfStock', { defaultValue: 'Out of stock' })} value={stockStats.out} />
          </div>
          <div className="border-t border-border/60 px-4 py-3">
            <p className="text-px-11 font-medium text-muted-foreground uppercase tracking-wide mb-1.5">{t('overview.needsRestock', { defaultValue: 'Needs restocking' })}</p>
            {lowStockItems.length === 0 ? (
              <div className="py-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                {t('overview.allStocked', { defaultValue: 'Everything is well stocked ✓' })}
              </div>
            ) : (
              <div className="divide-y divide-border/60">
                {lowStockItems.slice(0, 5).map((a: any) => (
                  <div key={a.id} className="flex items-center justify-between gap-3 py-2">
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
          </div>
        </div>
      ),
    },
  ];

  const reportingRoute: Record<string, string> = {
    Sales: '/dashboard/reporting/sales',
    Service: '/dashboard/reporting/service',
    Finance: '/dashboard/reporting/finance',
    HR: '/dashboard/reporting/hr',
    Purchase: '/dashboard/reporting/purchase',
  };

  // Pinned reporting widgets become individual cards, fully interleaved.
  const reportingCards: DashboardCard[] = React.useMemo(
    () => pinnedWidgets.map((w) => ({
      id: w.id,
      size: reportingSizeToCard(w.id),
      reporting: true,
      node: <FavoriteWidgetCard fav={w} />,
    })),
    [pinnedWidgets],
  );

  const cardById = React.useMemo(
    () => new Map([...reportingCards, ...defaultCards].map((c) => [c.id, c])),
    [reportingCards, defaultCards],
  );
  const hiddenSet = React.useMemo(() => new Set(hidden), [hidden]);
  const defaultIdSet = React.useMemo(
    () => new Set(defaultCards.map((c) => c.id)),
    [defaultCards],
  );

  // Pinned reporting widgets ALWAYS render at the top of the dashboard —
  // their order is owned solely by the reporting favorites store (single
  // source of truth). Default cards follow, ordered by the dashboard layout
  // store (which stores default-card ids only — no widget ids).
  const pinnedIds = React.useMemo(
    () => reportingCards.map((c) => c.id).filter((id) => !hiddenSet.has(id)),
    [reportingCards, hiddenSet],
  );
  const defaultVisibleIds = React.useMemo(() => {
    // Defensive: `order` may still contain legacy widget ids from before we
    // split the two stores — filter them out here so ordering is stable.
    const known = order.filter((id) => defaultIdSet.has(id) && !hiddenSet.has(id));
    const appended = defaultCards
      .map((c) => c.id)
      .filter((id) => !order.includes(id) && !hiddenSet.has(id));
    return [...known, ...appended];
  }, [order, defaultIdSet, defaultCards, hiddenSet]);

  const orderedIds = React.useMemo(
    () => [...pinnedIds, ...defaultVisibleIds],
    [pinnedIds, defaultVisibleIds],
  );
  const visibleCards = React.useMemo(
    () => orderedIds.map((id) => cardById.get(id)).filter((c): c is DashboardCard => Boolean(c)),
    [orderedIds, cardById],
  );
  const hiddenDefaults = React.useMemo(
    () => defaultCards.filter((c) => hiddenSet.has(c.id)),
    [defaultCards, hiddenSet],
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const activeId = String(active.id);
    const overId = String(over.id);
    const activeInPinned = pinnedIds.includes(activeId);
    const overInPinned = pinnedIds.includes(overId);
    // Block cross-group drag — pinned widgets always stay above defaults.
    if (activeInPinned !== overInPinned) return;

    if (activeInPinned) {
      const oldIndex = pinnedIds.indexOf(activeId);
      const newIndex = pinnedIds.indexOf(overId);
      if (oldIndex < 0 || newIndex < 0) return;
      reorderFavorites(arrayMove(pinnedIds, oldIndex, newIndex));
    } else {
      const oldIndex = defaultVisibleIds.indexOf(activeId);
      const newIndex = defaultVisibleIds.indexOf(overId);
      if (oldIndex < 0 || newIndex < 0) return;
      // Preserve any currently-hidden default ids that live in `order` so
      // toggling them back on doesn't lose their original slot.
      const next = arrayMove(defaultVisibleIds, oldIndex, newIndex);
      const preservedHidden = order.filter(
        (id) => defaultIdSet.has(id) && !next.includes(id),
      );
      setOrder([...next, ...preservedHidden]);
    }
  };

  // ── Customize sheet plumbing ─────────────────────────────────
  // Human-readable labels for default cards so the settings panel doesn't
  // show raw ids. Keep in sync with `defaultCards` above.
  const defaultLabels: Record<string, string> = {
    'kpi-revenue': t('overview.revenueThisMonth', { defaultValue: 'Revenue (this month)' }),
    'kpi-active-sales': t('overview.activeSales', { defaultValue: 'Active sales' }),
    'kpi-open-offers': t('overview.openOffers', { defaultValue: 'Open offers' }),
    'kpi-active-so': t('overview.activeServiceOrders', { defaultValue: 'Active service orders' }),
    'kpi-contacts': t('overview.totalContacts', { defaultValue: 'Contacts' }),
    'chart-revenue-trend': t('overview.revenueTrend', { defaultValue: 'Revenue — last 6 months' }),
    'chart-service-status': t('overview.serviceOrderStatus', { defaultValue: 'Service orders by status' }),
    'panel-team': t('overview.section.team', { defaultValue: 'Team performance' }),
    'chart-stock-status': t('overview.stockBreakdown', { defaultValue: 'Stock status' }),
    'panel-stock': t('overview.section.stock', { defaultValue: 'Inventory & stock' }),
  };

  const defaultRows: CustomizeRow[] = defaultCards.map((c) => ({
    id: c.id,
    label: defaultLabels[c.id] ?? c.id,
  }));
  const pinnedRows: CustomizeRow[] = pinnedWidgets.map((w) => ({
    id: w.id,
    label: w.title,
    caption: w.source,
  }));

  // Sheet needs visible + hidden ids together per group so hidden rows still
  // appear and can be toggled back on.
  const pinnedOrderForSheet = React.useMemo(
    () => reportingCards.map((c) => c.id),
    [reportingCards],
  );
  const defaultOrderForSheet = React.useMemo(() => {
    const known = order.filter((id) => defaultIdSet.has(id));
    const appended = defaultCards.map((c) => c.id).filter((id) => !order.includes(id));
    return [...known, ...appended];
  }, [order, defaultIdSet, defaultCards]);


  return (
    <div className="space-y-5 p-3 sm:p-5 max-w-[1600px] mx-auto">
      <DashboardCustomizeSheet
        open={customizeOpen}
        onOpenChange={setCustomizeOpen}
        pinnedRows={pinnedRows}
        pinnedOrder={pinnedOrderForSheet}
        hiddenSet={hiddenSet}
        onReorderPinned={(ids) => reorderFavorites(ids)}
        onHidePinned={(id) => hide(id)}
        onShowPinned={(id) => unhide(id)}
        onUnpin={(id) => unpinWidget(id)}
        defaultRows={defaultRows}
        defaultOrder={defaultOrderForSheet}
        onReorderDefault={(ids) => setOrder(ids)}
        onHideDefault={(id) => hide(id)}
        onShowDefault={(id) => unhide(id)}
        onResetAll={() => setConfirmResetOpen(true)}
      />

      {/* ══ Header · greeting + customize button ══ */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-px-22 font-bold leading-tight tracking-tight truncate">
            {greeting}{user?.firstName ? `, ${user.firstName}` : ''} 👋
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {dayjs().format('dddd, D MMMM YYYY')} · {t('overview.welcomeMessage', { defaultValue: "Here's an overview of your business" })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-xs"
            onClick={() => setCustomizeOpen(true)}
          >
            <Settings2 className="h-3.5 w-3.5" />
            {t('overview.customize', { defaultValue: 'Customize' })}
            {(hiddenDefaults.length > 0 || pinnedWidgets.length > 0) && (
              <span className="ml-1 rounded-full bg-primary/15 px-1.5 py-0.5 text-px-10 font-semibold text-primary">
                {pinnedWidgets.length + hiddenDefaults.length}
              </span>
            )}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <SkeletonGrid n={5} />
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={orderedIds} strategy={rectSortingStrategy}>
            <div data-tour="dashboard-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {visibleCards.map((card) => (
                <SortableCard
                  key={card.id}
                  card={card}
                  onOpen={
                    card.reporting
                      ? () => {
                          const w = pinnedWidgets.find((x) => x.id === card.id);
                          if (w) navigate(reportingRoute[w.source]);
                        }
                      : undefined
                  }
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {visibleCards.length === 0 && !isLoading && (
        <div className="rounded-lg border border-dashed bg-muted/30 p-8 text-center">
          <p className="text-sm text-muted-foreground">{t('overview.emptyLayout', { defaultValue: 'You’ve removed all cards.' })}</p>
          <Button variant="outline" size="sm" className="mt-3 gap-1.5" onClick={reset}>
            <RotateCcw className="h-3.5 w-3.5" />
            {t('overview.resetLayout', { defaultValue: 'Reset to default' })}
          </Button>
        </div>
      )}

      <AlertDialog open={confirmResetOpen} onOpenChange={setConfirmResetOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('overview.confirmResetTitle', { defaultValue: 'Reset your dashboard?' })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('overview.confirmResetDesc', {
                defaultValue:
                  'This restores the default layout and shows all hidden cards. Your pinned reporting widgets are kept.',
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {t('common.cancel', { defaultValue: 'Cancel' })}
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => reset()}>
              {t('overview.resetLayout', { defaultValue: 'Reset to default' })}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}



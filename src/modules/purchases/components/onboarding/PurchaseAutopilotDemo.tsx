import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { resolveCurrencyCode } from '@/lib/currencies';
import { useTranslation } from 'react-i18next';
import {
  X, Play, Pause, RotateCcw, Volume2, VolumeX, Languages,
  ShoppingCart, Package, FileText, DollarSign, Plus, ArrowRight,
  Clock, AlertTriangle, CheckCircle, BarChart3, Shield, BookOpen,
  Search, Filter, Download, Eye, Edit, Trash2, FileDown, Send,
  CheckCircle2, TrendingUp, Award, Truck, Wallet, ChevronRight,
  Star, Code2, Banknote, Activity, AlertCircle,
} from 'lucide-react';
import { DemoCursor } from '@/modules/external/components/onboarding/DemoCursor';
import { pickBestVoice, splitForSpeech, languageTagFor, configureUtteranceForFemaleVoice } from '@/modules/external/components/onboarding/narrationVoice';
import {
  PO_STEPS, PO_CHAPTERS, initialPurchaseDemoState,
  type PurchaseDemoState,
} from './purchaseDemoScript';
import { pickLang, getCaption, getChapterTitle } from './purchaseDemoTranslations';

interface Props {
  open: boolean;
  onClose: () => void;
}

// ─── Demo data ────────────────────────────────────────────────────────────────

const DEMO_ORDERS = [
  { id: 'po-001', num: 'PO-2025-001', supplier: 'Fournisseur Alpha SARL', date: '2025-01-15', delivery: '2025-01-25', status: 'received',           payment: 'paid',           total: 15200 },
  { id: 'po-042', num: 'PO-2025-042', supplier: 'Tech Solutions SA',       date: '2025-05-10', delivery: '2025-05-30', status: 'ordered',            payment: 'unpaid',         total: 8750  },
  { id: 'po-043', num: 'PO-2025-043', supplier: 'Office Supplies Co.',     date: '2025-06-01', delivery: '2025-06-15', status: 'draft',              payment: 'unpaid',         total: 1340  },
  { id: 'po-044', num: 'PO-2025-044', supplier: 'Machinery Parts Ltd',     date: '2025-04-20', delivery: '2025-05-10', status: 'partially_received', payment: 'partially_paid', total: 32500 },
  { id: 'po-045', num: 'PO-2025-045', supplier: 'IT Equipment SARL',       date: '2025-06-05', delivery: '2025-06-20', status: 'validated',          payment: 'unpaid',         total: 4200  },
];

const DEMO_RECEIPTS = [
  { id: 'gr-001', num: 'GR-2025-001', poNum: 'PO-2025-001', supplier: 'Fournisseur Alpha SARL', date: '2025-01-20', status: 'complete' },
  { id: 'gr-002', num: 'GR-2025-002', poNum: 'PO-2025-044', supplier: 'Machinery Parts Ltd',    date: '2025-05-05', status: 'partial'  },
  { id: 'gr-003', num: 'GR-2025-003', poNum: 'PO-2025-042', supplier: 'Tech Solutions SA',      date: '2025-05-25', status: 'partial'  },
];

const DEMO_INVOICES = [
  { id: 'si-001', num: 'INV-F-2025-001', poNum: 'PO-2025-001', supplier: 'Fournisseur Alpha SARL', date: '2025-01-25', status: 'paid',           total: 15200, rs: 760,  fel: 'registered', tej: 'synced'  },
  { id: 'si-002', num: 'INV-F-2025-002', poNum: 'PO-2025-044', supplier: 'Machinery Parts Ltd',    date: '2025-05-10', status: 'partially_paid', total: 32500, rs: 1625, fel: 'pending',    tej: 'pending' },
  { id: 'si-003', num: 'INV-F-2025-003', poNum: 'PO-2025-042', supplier: 'Tech Solutions SA',      date: '2025-05-12', status: 'pending',        total: 8750,  rs: null,  fel: null,         tej: null      },
];

const DEMO_ACTIVITIES = [
  { id: 'a1', date: '2025-06-05', time: '09:14', user: 'Ahmed B.', action: 'Created',   doc: 'PO-2025-045', detail: 'Purchase Order created as Draft — IT Equipment SARL'            },
  { id: 'a2', date: '2025-06-01', time: '14:32', user: 'Sara M.',  action: 'Created',   doc: 'PO-2025-043', detail: 'Purchase Order created as Draft — Office Supplies Co.'           },
  { id: 'a3', date: '2025-05-25', time: '11:05', user: 'Ahmed B.', action: 'Received',  doc: 'GR-2025-003', detail: 'Goods Receipt created — Partial delivery (3 of 5 items)'        },
  { id: 'a4', date: '2025-05-10', time: '08:47', user: 'Sara M.',  action: 'Ordered',   doc: 'PO-2025-042', detail: 'Status advanced: Validated → Ordered — Tech Solutions SA'       },
  { id: 'a5', date: '2025-05-05', time: '16:22', user: 'Ahmed B.', action: 'Received',  doc: 'GR-2025-002', detail: 'Goods Receipt created — Partial delivery (12 of 20 units)'      },
  { id: 'a6', date: '2025-04-20', time: '10:30', user: 'Sara M.',  action: 'Validated', doc: 'PO-2025-044', detail: 'Status advanced: Draft → Validated — Machinery Parts Ltd'       },
];

const DEMO_PERF = [
  { name: 'Fournisseur Alpha SARL', pos: 3,  spend: 45600, onTime: 95,  lead: 8,  grade: 'A', gradeColor: 'text-green-700 bg-green-100'    },
  { name: 'Office Supplies Co.',    pos: 5,  spend: 6700,  onTime: 100, lead: 5,  grade: 'A', gradeColor: 'text-green-700 bg-green-100'    },
  { name: 'Tech Solutions SA',      pos: 2,  spend: 17500, onTime: 85,  lead: 12, grade: 'B', gradeColor: 'text-blue-700 bg-blue-100'      },
  { name: 'Machinery Parts Ltd',    pos: 1,  spend: 32500, onTime: 70,  lead: 18, grade: 'B', gradeColor: 'text-blue-700 bg-blue-100'      },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  n.toLocaleString('fr-TN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const PO_STATUS_CLS: Record<string, string> = {
  draft:              'bg-muted text-muted-foreground',
  validated:          'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  ordered:            'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  partially_received: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  received:           'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  cancelled:          'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  paid:               'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  pending:            'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400',
  partially_paid:     'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  unpaid:             'bg-muted text-muted-foreground',
  complete:           'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  partial:            'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  rejected:           'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

const PO_STATUS_LABEL: Record<string, string> = {
  draft: 'Draft', validated: 'Validated', ordered: 'Ordered',
  partially_received: 'Partial Rcv.', received: 'Received', cancelled: 'Cancelled',
  paid: 'Paid', pending: 'Pending', partially_paid: 'Partial', unpaid: 'Unpaid',
  complete: 'Complete', partial: 'Partial', rejected: 'Rejected',
};

function StatusBadge({ status, small }: { status: string; small?: boolean }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 font-medium ${small ? 'text-px-10' : 'text-xs'} ${PO_STATUS_CLS[status] ?? 'bg-muted text-muted-foreground'}`}>
      {PO_STATUS_LABEL[status] ?? status}
    </span>
  );
}

function StatCard({ id, icon, label, value, highlight }: { id: string; icon: React.ReactNode; label: string; value: string | number; highlight?: boolean }) {
  return (
    <div id={id} className={`bg-card border rounded-lg p-3 sm:p-4 transition-all ${highlight ? 'border-primary shadow-md ring-1 ring-primary/30' : 'border-border'}`}>
      <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium mb-1">{icon}{label}</div>
      <p className="text-xl font-bold text-foreground">{value}</p>
    </div>
  );
}

// ─── Sub-navigation pill row ───────────────────────────────────────────────────

const NAV_ITEMS = [
  { page: 'dashboard',           label: 'Dashboard',         icon: ShoppingCart  },
  { page: 'orders-list',         label: 'Purchase Orders',   icon: ShoppingCart  },
  { page: 'receipts-list',       label: 'Goods Receipts',    icon: Package       },
  { page: 'invoices-list',       label: 'Invoices',          icon: FileText      },
  { page: 'compliance',          label: 'Compliance',        icon: Shield        },
  { page: 'reports',             label: 'Reports',           icon: BarChart3     },
  { page: 'audit-log',           label: 'Audit Log',         icon: BookOpen      },
] as const;

type NavPage = typeof NAV_ITEMS[number]['page'];

function DemoSubNav({ current }: { current: string }) {
  const rootPage: NavPage =
    current === 'order-create' || current === 'order-detail' || current === 'order-pdf-preview' || current === 'order-tej-xml' || current === 'article-suppliers' ? 'orders-list'  :
    current === 'receipt-create' || current === 'receipt-detail' ? 'receipts-list' :
    current === 'invoice-create' || current === 'invoice-detail' || current === 'invoice-payment' || current === 'invoice-tej-xml' ? 'invoices-list' :
    current === 'rs-catalogue' ? 'compliance' :
    current === 'supplier-performance' || current === 'price-evolution' || current === 'invoice-aging' ? 'reports' :
    (NAV_ITEMS.some(n => n.page === current) ? current as NavPage : 'dashboard');

  return (
    <div className="shrink-0 border-b border-border/60 bg-card/50 px-4 overflow-x-auto">
      <div className="flex gap-1 -mb-px min-w-max">
        {NAV_ITEMS.map(item => {
          const active = rootPage === item.page;
          const id = item.page === 'orders-list'   ? 'po-demo-nav-orders'     :
                     item.page === 'receipts-list'  ? 'po-demo-nav-receipts'   :
                     item.page === 'invoices-list'  ? 'po-demo-nav-invoices'   :
                     item.page === 'compliance'     ? 'po-demo-nav-compliance' :
                     item.page === 'reports'        ? 'po-demo-nav-reports'    :
                     item.page === 'audit-log'      ? 'po-demo-nav-audit'      : undefined;
          return (
            <div
              key={item.page}
              id={id}
              className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors whitespace-nowrap cursor-default
                ${active ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground'}`}
            >
              <item.icon className="h-3.5 w-3.5" />
              {item.label}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Page renderers ───────────────────────────────────────────────────────────

function PageDashboard({ state }: { state: PurchaseDemoState }) {
  return (
    <div className="p-4 md:p-6 space-y-5 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 id="po-demo-title" className="text-2xl font-bold text-foreground">Purchases</h1>
          <p className="text-sm text-muted-foreground mt-1">Overview of your procurement activity</p>
        </div>
        <div className="flex gap-2">
          <div className="h-8 px-3 rounded-md border border-border flex items-center gap-1.5 text-xs text-muted-foreground">
            <ShoppingCart className="h-3.5 w-3.5" /> View Orders
          </div>
          <div className="h-8 px-3 rounded-md bg-primary flex items-center gap-1.5 text-xs text-primary-foreground font-medium">
            <Plus className="h-3.5 w-3.5" /> New Order
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard id="po-demo-stat-orders"   icon={<ShoppingCart className="h-3.5 w-3.5 text-chart-1" />} label="Total Orders"       value={5}          />
        <StatCard id="po-demo-stat-receipts" icon={<Package className="h-3.5 w-3.5 text-chart-2" />}     label="Pending Receipts"  value={2}          />
        <StatCard id="po-demo-stat-invoices" icon={<FileText className="h-3.5 w-3.5 text-chart-3" />}    label="Open Invoices"     value={3}          />
        <StatCard id="po-demo-stat-spend"    icon={<DollarSign className="h-3.5 w-3.5 text-chart-4" />}  label="Monthly Spend"     value={`14,290 ${resolveCurrencyCode()}`} />
      </div>

      {/* Tables */}
      <div className="grid md:grid-cols-2 gap-5">
        {/* Recent Orders */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div id="po-demo-recent-orders" className="flex items-center justify-between px-4 py-3 border-b border-border">
            <span className="text-sm font-medium">Recent Orders</span>
            <span className="text-xs text-muted-foreground flex items-center gap-1">View all <ArrowRight className="h-3 w-3" /></span>
          </div>
          <table className="w-full text-xs">
            <thead><tr className="border-b border-border/60">
              <th className="text-left px-4 py-2 text-muted-foreground font-medium">Order #</th>
              <th className="text-left px-4 py-2 text-muted-foreground font-medium">Supplier</th>
              <th className="text-left px-4 py-2 text-muted-foreground font-medium">Status</th>
              <th className="text-right px-4 py-2 text-muted-foreground font-medium">Total</th>
            </tr></thead>
            <tbody>
              {DEMO_ORDERS.map(po => (
                <tr key={po.id} className="border-b border-border/40 last:border-0">
                  <td className="px-4 py-2 font-medium text-primary">{po.num}</td>
                  <td className="px-4 py-2 text-foreground truncate max-w-[110px]">{po.supplier.split(' ')[0]}</td>
                  <td className="px-4 py-2"><StatusBadge status={po.status} small /></td>
                  <td className="px-4 py-2 text-right font-medium">{fmt(po.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pending Receipts */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div id="po-demo-pending-receipts" className="flex items-center justify-between px-4 py-3 border-b border-border">
            <span className="text-sm font-medium">Pending Receipts</span>
            <span className="text-xs text-muted-foreground flex items-center gap-1">View all <ArrowRight className="h-3 w-3" /></span>
          </div>
          <table className="w-full text-xs">
            <thead><tr className="border-b border-border/60">
              <th className="text-left px-4 py-2 text-muted-foreground font-medium">Order #</th>
              <th className="text-left px-4 py-2 text-muted-foreground font-medium">Supplier</th>
              <th className="text-left px-4 py-2 text-muted-foreground font-medium">Delivery</th>
              <th className="text-left px-4 py-2 text-muted-foreground font-medium">Status</th>
            </tr></thead>
            <tbody>
              {DEMO_ORDERS.filter(o => o.status === 'ordered' || o.status === 'partially_received').map(po => (
                <tr key={po.id} className="border-b border-border/40 last:border-0">
                  <td className="px-4 py-2 font-medium text-primary">{po.num}</td>
                  <td className="px-4 py-2 truncate max-w-[100px]">{po.supplier.split(' ')[0]}</td>
                  <td className="px-4 py-2 text-muted-foreground">{po.delivery}</td>
                  <td className="px-4 py-2"><StatusBadge status={po.status} small /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick links */}
      <div id="po-demo-quick-links" className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: AlertTriangle, label: 'Compliance',       color: 'text-amber-500' },
          { icon: BarChart3,     label: 'Reports',          color: 'text-blue-500'  },
          { icon: Clock,         label: 'Audit Log',        color: 'text-purple-500'},
          { icon: CheckCircle,   label: 'Supplier Perf.',   color: 'text-green-500' },
        ].map(q => (
          <div key={q.label} className="border border-border rounded-lg py-3 flex flex-col items-center gap-1.5 bg-card hover:bg-muted/40 cursor-default">
            <q.icon className={`h-5 w-5 ${q.color}`} />
            <span className="text-xs font-medium text-foreground">{q.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PageOrdersList({ state }: { state: PurchaseDemoState }) {
  const displayed = state.statusFilter === 'open'
    ? DEMO_ORDERS.filter(o => ['draft','validated','ordered','partially_received'].includes(o.status))
    : DEMO_ORDERS;

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border/60">
        <div>
          <h1 className="text-lg font-semibold">Purchase Orders</h1>
          <p className="text-xs text-muted-foreground">{DEMO_ORDERS.length} orders total</p>
        </div>
        <div className="flex gap-2">
          <div id="po-demo-export-btn" className="h-8 px-3 rounded-md border border-border flex items-center gap-1.5 text-xs text-muted-foreground cursor-default">
            <Download className="h-3.5 w-3.5" /> Export
          </div>
          <div id="po-demo-new-btn" className="h-8 px-3 rounded-md bg-primary flex items-center gap-1.5 text-xs text-primary-foreground font-medium cursor-default">
            <Plus className="h-3.5 w-3.5" /> New Order
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2 px-4 py-3 border-b border-border/60">
        {[
          { key: 'all',      label: 'Total',       value: DEMO_ORDERS.length, icon: <ShoppingCart className="h-3.5 w-3.5" /> },
          { key: 'open',     label: 'Open',        value: 4, icon: <Clock className="h-3.5 w-3.5 text-amber-500" /> },
          { key: 'received', label: 'Received',    value: 1, icon: <CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> },
          { key: 'value',    label: 'Total Value', value: `61,990 ${resolveCurrencyCode()}`, icon: <DollarSign className="h-3.5 w-3.5 text-blue-500" /> },
        ].map(s => (
          <div
            key={s.key}
            id={s.key === 'open' ? 'po-demo-stat-open' : undefined}
            className={`bg-card border rounded-lg p-2.5 cursor-default transition-all
              ${state.highlightedStatKey === s.key ? 'border-primary ring-1 ring-primary/30 shadow-md' : 'border-border'}`}
          >
            <div className="flex items-center gap-1.5 text-muted-foreground text-px-10 font-medium">{s.icon}{s.label}</div>
            <p className="text-sm font-bold text-foreground mt-0.5">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Search + filters bar */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border/60">
        <div id="po-demo-search" className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <div className="h-8 pl-8 pr-3 rounded-md border border-border bg-background text-xs text-muted-foreground flex items-center">Search orders…</div>
        </div>
        <div id="po-demo-filter-btn" className={`h-8 px-3 rounded-md border text-xs flex items-center gap-1.5 cursor-default ${state.showFilters ? 'border-primary text-primary bg-primary/5' : 'border-border text-muted-foreground'}`}>
          <Filter className="h-3.5 w-3.5" /> Filters {state.showFilters && <span className="h-4 w-4 rounded-full bg-primary text-primary-foreground text-px-10 flex items-center justify-center">2</span>}
        </div>
        <div className="ml-auto flex items-center gap-1 border border-border rounded-md overflow-hidden" id="po-demo-view-toggle">
          {(['table','list'] as const).map(m => (
            <div key={m} className={`h-8 px-2.5 flex items-center text-xs cursor-default transition-colors ${state.viewMode === m ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted/50'}`}>
              {m === 'table' ? '⊞' : '☰'}
            </div>
          ))}
        </div>
      </div>

      {/* Smart filters + saved views bar */}
      <div className="flex flex-wrap items-center gap-1.5 px-4 py-2 border-b border-border/60 bg-muted/20">
        <span id="po-demo-smart-filters" className="inline-flex items-center gap-1 text-px-10 text-muted-foreground font-medium pr-1">
          <TrendingUp className="h-3 w-3" /> Smart filters
        </span>
        {[
          { label: 'Awaiting receipt > 7 days', active: true },
          { label: 'Unpaid past due', active: false },
          { label: 'Drafts', active: false },
          { label: 'High value (top 10%)', active: false },
        ].map(sf => (
          <span key={sf.label} className={`h-6 px-2 rounded-full text-px-10 font-medium border cursor-default ${sf.active ? 'bg-primary text-primary-foreground border-primary shadow-sm' : 'bg-card border-border text-foreground'}`}>
            {sf.label}
          </span>
        ))}
        <span className="h-4 w-px bg-border mx-1" aria-hidden />
        <span id="po-demo-saved-views" className="inline-flex items-center gap-1 text-px-10 text-muted-foreground font-medium pr-1">
          <Star className="h-3 w-3" /> Saved views
        </span>
        <span className="inline-flex items-center gap-1 h-6 pl-2 pr-1 rounded-full text-px-10 font-medium border bg-card border-border text-foreground cursor-default">
          Awaiting GR — Acme <X className="h-2.5 w-2.5 opacity-50" />
        </span>
        <span className="ml-auto inline-flex items-center gap-1 h-6 px-2 rounded-md border border-border text-px-10 text-muted-foreground cursor-default">
          <Plus className="h-3 w-3" /> Save view
        </span>
      </div>

      {/* Filter panel */}
      {state.showFilters && (
        <div className="flex gap-3 px-4 py-2 bg-muted/30 border-b border-border/60">
          <div className="flex flex-col gap-1">
            <span className="text-px-10 text-muted-foreground font-medium">Status</span>
            <div className="h-7 px-2.5 rounded-md border border-border bg-background text-xs text-foreground flex items-center gap-2 min-w-[120px]">Ordered <ChevronRight className="h-3 w-3 ml-auto rotate-90 text-muted-foreground" /></div>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-px-10 text-muted-foreground font-medium">Payment</span>
            <div className="h-7 px-2.5 rounded-md border border-border bg-background text-xs text-foreground flex items-center gap-2 min-w-[120px]">Unpaid <ChevronRight className="h-3 w-3 ml-auto rotate-90 text-muted-foreground" /></div>
          </div>
        </div>
      )}

      {/* Bulk bar */}
      {state.selectedRowIds.length > 0 && (
        <div id="po-demo-bulk-actions" className="flex flex-wrap items-center gap-2 px-4 py-2 bg-primary/5 border-b border-primary/20">
          <span className="text-xs font-medium text-primary">{state.selectedRowIds.length} selected</span>
          <div className="h-7 px-2.5 rounded-md border border-border text-xs flex items-center gap-1.5 cursor-default">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Approve
          </div>
          <div className="h-7 px-2.5 rounded-md border border-border text-xs flex items-center gap-1.5 cursor-default">
            <Send className="h-3.5 w-3.5 text-purple-600" /> Send to supplier
          </div>
          <div className="h-7 px-2.5 rounded-md border border-border text-xs flex items-center gap-1.5 cursor-default">
            <CheckCircle className="h-3.5 w-3.5 text-slate-600" /> Close
          </div>
          <div className="h-7 px-2.5 rounded-md border border-border text-xs flex items-center gap-1.5 cursor-default">
            <Download className="h-3.5 w-3.5" /> Export
          </div>
          <div className="h-7 px-2.5 rounded-md border border-destructive/30 text-destructive text-xs flex items-center gap-1.5 cursor-default">
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </div>
          <span className="text-xs text-muted-foreground ml-auto">Clear</span>
        </div>
      )}

      {/* Table */}
      <div className="px-4 py-3">
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full text-xs">
            <thead><tr className="border-b border-border/60 bg-muted/30">
              <th className="w-8 px-3 py-2">
                <div id="po-demo-row-check" className="h-3.5 w-3.5 rounded border border-border bg-background" />
              </th>
              <th className="text-left px-3 py-2 text-muted-foreground font-medium">Order #</th>
              <th className="text-left px-3 py-2 text-muted-foreground font-medium">Supplier</th>
              <th className="text-left px-3 py-2 text-muted-foreground font-medium">Date</th>
              <th className="text-left px-3 py-2 text-muted-foreground font-medium">Status</th>
              <th className="text-left px-3 py-2 text-muted-foreground font-medium">Payment</th>
              <th className="text-right px-3 py-2 text-muted-foreground font-medium">Total</th>
              <th className="w-16 px-3 py-2 text-muted-foreground font-medium text-right">Actions</th>
            </tr></thead>
            <tbody>
              {displayed.map(po => {
                const selected = state.selectedRowIds.includes(po.id);
                return (
                  <tr key={po.id} className={`border-b border-border/40 last:border-0 transition-colors ${selected ? 'bg-primary/5' : 'hover:bg-muted/30'}`}>
                    <td className="px-3 py-2.5">
                      <div className={`h-3.5 w-3.5 rounded border flex items-center justify-center ${selected ? 'bg-primary border-primary' : 'border-border bg-background'}`}>
                        {selected && <div className="h-2 w-2 rounded-sm bg-primary-foreground" />}
                      </div>
                    </td>
                    <td className="px-3 py-2.5 font-medium text-primary">{po.num}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-px-9 font-bold text-muted-foreground shrink-0">
                          {po.supplier.slice(0,2).toUpperCase()}
                        </div>
                        <span className="truncate max-w-[120px]">{po.supplier}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-muted-foreground">{po.date}</td>
                    <td className="px-3 py-2.5"><StatusBadge status={po.status} small /></td>
                    <td className="px-3 py-2.5"><StatusBadge status={po.payment} small /></td>
                    <td className="px-3 py-2.5 text-right font-medium">{fmt(po.total)} {resolveCurrencyCode()}</td>
                    <td className="px-3 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <div className="h-6 w-6 rounded border border-border flex items-center justify-center text-muted-foreground cursor-default hover:bg-muted/50">
                          <Eye className="h-3 w-3" />
                        </div>
                        <div className="h-6 w-6 rounded border border-border flex items-center justify-center text-muted-foreground cursor-default hover:bg-muted/50">
                          <Trash2 className="h-3 w-3" />
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function PageOrderCreate({ state }: { state: PurchaseDemoState }) {
  const step = state.createFormStep;
  return (
    <div className="p-4 md:p-6 space-y-5 max-w-3xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded border border-border flex items-center justify-center text-muted-foreground cursor-default text-xs">←</div>
        <h1 className="text-lg font-semibold">New Purchase Order</h1>
      </div>

      <div className="bg-card border border-border rounded-lg p-5 space-y-5">
        {/* Supplier */}
        <div id="po-demo-create-supplier">
          <label className="block text-xs font-medium text-foreground mb-1.5">Supplier *</label>
          <div className={`h-9 px-3 rounded-md border text-sm flex items-center justify-between transition-all
            ${step >= 0 ? 'border-primary bg-primary/5 text-foreground' : 'border-border text-muted-foreground'}`}>
            {step >= 0 ? 'Machinery Parts Ltd' : 'Select supplier…'}
            <ChevronRight className="h-4 w-4 rotate-90 text-muted-foreground" />
          </div>
        </div>

        {/* Dates row */}
        <div id="po-demo-create-dates" className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">Order Date *</label>
            <div className={`h-9 px-3 rounded-md border text-sm flex items-center transition-all ${step >= 1 ? 'border-border text-foreground' : 'border-border text-muted-foreground'}`}>
              {step >= 1 ? '2025-06-06' : 'YYYY-MM-DD'}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">Expected Delivery</label>
            <div className={`h-9 px-3 rounded-md border text-sm flex items-center transition-all ${step >= 1 ? 'border-border text-foreground' : 'border-border text-muted-foreground'}`}>
              {step >= 1 ? '2025-06-25' : 'YYYY-MM-DD'}
            </div>
          </div>
        </div>

        {/* Line items */}
        <div id="po-demo-create-items">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-foreground">Line Items</span>
            <div className="flex items-center gap-2">
              <span id="po-demo-shortcuts" className="text-px-10 text-muted-foreground">Alt+N add line · Enter next · Ctrl+S save</span>
              <div className="h-6 px-2 rounded border border-border text-px-10 text-muted-foreground flex items-center gap-1 cursor-default">
                <Plus className="h-3 w-3" /> Add Article
              </div>
            </div>
          </div>
          <div className="border border-border rounded-md overflow-hidden">
            <table className="w-full text-xs">
              <thead><tr className="bg-muted/40 border-b border-border">
                <th className="text-left px-3 py-2 text-muted-foreground font-medium">Description</th>
                <th className="text-right px-3 py-2 text-muted-foreground font-medium">Qty</th>
                <th className="text-right px-3 py-2 text-muted-foreground font-medium">Unit Price</th>
                <th className="text-right px-3 py-2 text-muted-foreground font-medium">Tax %</th>
                <th className="text-right px-3 py-2 text-muted-foreground font-medium">Total</th>
              </tr></thead>
              <tbody>
                {step >= 2 ? (
                  <>
                    <tr className="border-b border-border/50">
                      <td className="px-3 py-2 font-medium">Hydraulic Cylinder HY-200</td>
                      <td className="px-3 py-2 text-right">10</td>
                      <td className="px-3 py-2 text-right">
                        1,200 {resolveCurrencyCode()}
                        <div id="po-demo-last-price" className="text-px-10 text-amber-600">Last: 1,150 {resolveCurrencyCode()}</div>
                      </td>
                      <td className="px-3 py-2 text-right">19%</td>
                      <td className="px-3 py-2 text-right font-medium">14,280 {resolveCurrencyCode()}</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 font-medium">Mounting Bracket MB-45</td>
                      <td className="px-3 py-2 text-right">20</td>
                      <td className="px-3 py-2 text-right">450 {resolveCurrencyCode()}</td>
                      <td className="px-3 py-2 text-right">19%</td>
                      <td className="px-3 py-2 text-right font-medium">10,710 {resolveCurrencyCode()}</td>
                    </tr>
                  </>
                ) : (
                  <tr><td colSpan={5} className="px-3 py-4 text-center text-muted-foreground">No items yet — click Add Article</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totals */}
        <div id="po-demo-create-totals" className={`transition-all ${step < 2 ? 'opacity-40' : ''}`}>
          <div className="bg-muted/40 rounded-lg p-4 space-y-1.5 text-sm">
            <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>{step >= 2 ? `21,000 ${resolveCurrencyCode()}` : '—'}</span></div>
            <div className="flex justify-between text-muted-foreground"><span>Tax (19%)</span><span>{step >= 2 ? `3,990 ${resolveCurrencyCode()}` : '—'}</span></div>
            <div className="flex justify-between font-semibold text-foreground pt-1 border-t border-border mt-1"><span>Grand Total</span><span>{step >= 2 ? `24,990 ${resolveCurrencyCode()}` : '—'}</span></div>
          </div>
          {step >= 3 && (
            <div className="mt-3">
              <label className="block text-xs font-medium text-foreground mb-1.5">Internal Notes</label>
              <div className="h-16 px-3 py-2 rounded-md border border-border text-xs text-muted-foreground">Urgent — needed for production line restart in week 26.</div>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div id="po-demo-create-save" className="flex justify-end gap-2">
        <div className="h-9 px-4 rounded-md border border-border text-sm flex items-center text-muted-foreground cursor-default">Save as Draft</div>
        <div className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium flex items-center cursor-default">Validate Order</div>
      </div>
    </div>
  );
}

function PageOrderDetail({ state }: { state: PurchaseDemoState }) {
  const PO = DEMO_ORDERS[3]; // Machinery Parts Ltd — partially received
  const stages = ['draft','validated','ordered','partially_received','received','closed'];
  const currentStageIdx = 3; // partially_received

  return (
    <div className="flex flex-col max-w-5xl mx-auto w-full">
      {/* Header */}
      <div id="po-demo-detail-header" className="flex items-start justify-between gap-4 px-4 py-4 border-b border-border/60">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-8 w-8 rounded border border-border flex items-center justify-center text-muted-foreground text-xs cursor-default">←</div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-semibold">{PO.num}</h1>
              <StatusBadge status={PO.status} />
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{PO.supplier} · {PO.date} · Expected {PO.delivery}</p>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <div id="po-demo-btn-pdf" className="h-8 px-3 rounded-md border border-border flex items-center gap-1.5 text-xs text-muted-foreground cursor-default">
            <FileDown className="h-3.5 w-3.5" /> PDF
          </div>
          <div id="po-demo-btn-tej" className="h-8 px-3 rounded-md border border-border flex items-center gap-1.5 text-xs text-muted-foreground cursor-default">
            <Download className="h-3.5 w-3.5" /> TEJ XML
          </div>
        </div>
      </div>

      {/* Status flow */}
      <div id="po-demo-status-flow" className="px-4 py-3 border-b border-border/60 bg-muted/20">
        <div className="flex items-center gap-0 overflow-x-auto">
          {stages.map((s, i) => (
            <div key={s} className="flex items-center gap-0">
              <div className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-md text-px-10 font-medium whitespace-nowrap cursor-default transition-colors
                ${i < currentStageIdx ? 'text-green-700 bg-green-50 dark:text-green-400 dark:bg-green-950/20' :
                  i === currentStageIdx ? 'text-primary bg-primary/10 ring-1 ring-primary/30' :
                  'text-muted-foreground'}`}>
                {i < currentStageIdx && <CheckCircle2 className="h-3 w-3" />}
                {s.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </div>
              {i < stages.length - 1 && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />}
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border/60 px-4">
        <div className="flex gap-1 -mb-px">
          {[
            { key: 'overview',  label: 'Overview'  },
            { key: 'receipts',  label: 'Receipts', count: 1 },
            { key: 'invoices',  label: 'Invoices', count: 1 },
            { key: 'activity',  label: 'Activity', count: 4 },
          ].map(tab => (
            <button
              key={tab.key}
              id={tab.key !== 'overview' ? `po-demo-tab-${tab.key}` : undefined}
              className={`inline-flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 transition-colors cursor-default
                ${state.activeTab === tab.key ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground'}`}
            >
              {tab.label}
              {tab.count && (
                <span className="text-px-10 bg-muted text-muted-foreground rounded-full px-1.5 py-0.5">{tab.count}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="p-4 space-y-4">
        {state.activeTab === 'overview' && (
          <>
            <div id="po-demo-detail-items" className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border/60">
                <span className="text-sm font-medium">Line Items</span>
              </div>
              <table className="w-full text-xs">
                <thead><tr className="bg-muted/30 border-b border-border/60">
                  <th className="text-left px-4 py-2 text-muted-foreground font-medium">Description</th>
                  <th className="text-right px-4 py-2 text-muted-foreground font-medium">Ordered</th>
                  <th className="text-right px-4 py-2 text-muted-foreground font-medium">Received</th>
                  <th className="text-right px-4 py-2 text-muted-foreground font-medium">Unit Price</th>
                  <th className="text-right px-4 py-2 text-muted-foreground font-medium">Total</th>
                </tr></thead>
                <tbody>
                  <tr className="border-b border-border/40">
                    <td className="px-4 py-2.5 font-medium">Hydraulic Cylinder HY-200</td>
                    <td className="px-4 py-2.5 text-right">20</td>
                    <td className="px-4 py-2.5 text-right text-amber-600 font-medium">12</td>
                    <td className="px-4 py-2.5 text-right">1,200 {resolveCurrencyCode()}</td>
                    <td className="px-4 py-2.5 text-right font-medium">24,000 {resolveCurrencyCode()}</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 font-medium">Mounting Bracket MB-45</td>
                    <td className="px-4 py-2.5 text-right">50</td>
                    <td className="px-4 py-2.5 text-right text-green-600 font-medium">50</td>
                    <td className="px-4 py-2.5 text-right">170 {resolveCurrencyCode()}</td>
                    <td className="px-4 py-2.5 text-right font-medium">8,500 {resolveCurrencyCode()}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div id="po-demo-detail-financial" className="grid md:grid-cols-2 gap-4">
              <div className="bg-muted/40 rounded-lg p-4 space-y-2 text-sm">
                <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>27,310 {resolveCurrencyCode()}</span></div>
                <div className="flex justify-between text-muted-foreground"><span>Tax (19%)</span><span>5,190 {resolveCurrencyCode()}</span></div>
                <div className="flex justify-between font-semibold text-foreground border-t border-border pt-2"><span>Grand Total</span><span>32,500 {resolveCurrencyCode()}</span></div>
              </div>
              <div className="bg-card border border-border rounded-lg p-4 space-y-1.5 text-xs">
                <p className="text-xs font-semibold text-foreground mb-2">Supplier Info</p>
                <p className="text-muted-foreground">Machinery Parts Ltd</p>
                <p className="text-muted-foreground">14, Rue de l'Industrie, Sfax</p>
                <p className="text-muted-foreground">contact@machineryparts.tn</p>
                <p className="text-muted-foreground">Payment: Net 30 days</p>
              </div>
            </div>

            {/* Inline activity timeline — same history as the Activity tab, surfaced on Overview */}
            <div id="po-demo-inline-timeline" className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium flex items-center gap-2"><Activity className="h-4 w-4 text-muted-foreground" /> Activity</span>
                <span className="text-px-10 rounded-full border border-border px-1.5 py-0.5 text-muted-foreground">4</span>
              </div>
              <div className="space-y-3">
                {DEMO_ACTIVITIES.slice(0, 3).map((a, i, arr) => (
                  <div key={a.id} className="flex gap-3">
                    <div className="flex flex-col items-center shrink-0">
                      <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center">
                        <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                      </div>
                      {i < arr.length - 1 && <div className="w-px flex-1 bg-border mt-1" />}
                    </div>
                    <div className="min-w-0 pb-1">
                      <p className="text-xs font-medium">{a.detail}</p>
                      <p className="text-px-10 text-muted-foreground mt-0.5">{a.date} at {a.time} · {a.user}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {state.activeTab === 'receipts' && (
          <div id="po-demo-tab-receipts-content" className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-border/60">
              <span className="text-sm font-medium">Linked Goods Receipts</span>
            </div>
            <table className="w-full text-xs">
              <thead><tr className="bg-muted/30 border-b border-border">
                <th className="text-left px-4 py-2 text-muted-foreground font-medium">Receipt #</th>
                <th className="text-left px-4 py-2 text-muted-foreground font-medium">Date</th>
                <th className="text-left px-4 py-2 text-muted-foreground font-medium">Status</th>
                <th className="text-left px-4 py-2 text-muted-foreground font-medium">Items Received</th>
              </tr></thead>
              <tbody>
                <tr>
                  <td className="px-4 py-2.5 font-medium text-primary">GR-2025-002</td>
                  <td className="px-4 py-2.5 text-muted-foreground">2025-05-05</td>
                  <td className="px-4 py-2.5"><StatusBadge status="partial" small /></td>
                  <td className="px-4 py-2.5">Hydraulic Cylinder: 12/20 · Bracket: 50/50</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {state.activeTab === 'invoices' && (
          <div id="po-demo-tab-invoices-content" className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-border/60">
              <span className="text-sm font-medium">Linked Supplier Invoices</span>
            </div>
            <table className="w-full text-xs">
              <thead><tr className="bg-muted/30 border-b border-border">
                <th className="text-left px-4 py-2 text-muted-foreground font-medium">Invoice #</th>
                <th className="text-left px-4 py-2 text-muted-foreground font-medium">Date</th>
                <th className="text-left px-4 py-2 text-muted-foreground font-medium">Status</th>
                <th className="text-right px-4 py-2 text-muted-foreground font-medium">Total</th>
                <th className="text-right px-4 py-2 text-muted-foreground font-medium">RS</th>
              </tr></thead>
              <tbody>
                <tr>
                  <td className="px-4 py-2.5 font-medium text-primary">INV-F-2025-002</td>
                  <td className="px-4 py-2.5 text-muted-foreground">2025-05-10</td>
                  <td className="px-4 py-2.5"><StatusBadge status="partially_paid" small /></td>
                  <td className="px-4 py-2.5 text-right font-medium">32,500 {resolveCurrencyCode()}</td>
                  <td className="px-4 py-2.5 text-right text-amber-600 font-medium">1,625 {resolveCurrencyCode()}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {state.activeTab === 'activity' && (
          <div id="po-demo-tab-activity-content" className="space-y-2">
            {DEMO_ACTIVITIES.slice(0, 4).map(a => (
              <div key={a.id} className="flex items-start gap-3 p-3 bg-card border border-border rounded-lg">
                <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-px-10 font-bold text-primary">{a.user.slice(0,2)}</span>
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-foreground">{a.user} <span className="font-normal text-muted-foreground">{a.action.toLowerCase()}</span> <span className="font-medium text-primary">{a.doc}</span></p>
                  <p className="text-px-11 text-muted-foreground mt-0.5">{a.detail}</p>
                  <p className="text-px-10 text-muted-foreground/60 mt-0.5">{a.date} at {a.time}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PageReceiptsList({ state: _ }: { state: PurchaseDemoState }) {
  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border/60">
        <div>
          <h1 className="text-lg font-semibold">Goods Receipts</h1>
          <p className="text-xs text-muted-foreground">{DEMO_RECEIPTS.length} receipts</p>
        </div>
        <div id="po-demo-gr-create" className="h-8 px-3 rounded-md bg-primary flex items-center gap-1.5 text-xs text-primary-foreground font-medium cursor-default">
          <Plus className="h-3.5 w-3.5" /> New Receipt
        </div>
      </div>

      <div className="px-4 py-3">
        <div id="po-demo-gr-status-badges" className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full text-xs">
            <thead><tr className="bg-muted/30 border-b border-border/60">
              <th className="text-left px-4 py-2 text-muted-foreground font-medium">Receipt #</th>
              <th className="text-left px-4 py-2 text-muted-foreground font-medium">Linked PO</th>
              <th className="text-left px-4 py-2 text-muted-foreground font-medium">Supplier</th>
              <th className="text-left px-4 py-2 text-muted-foreground font-medium">Date</th>
              <th className="text-left px-4 py-2 text-muted-foreground font-medium">Status</th>
              <th className="text-right px-4 py-2 text-muted-foreground font-medium">Actions</th>
            </tr></thead>
            <tbody>
              {DEMO_RECEIPTS.map(gr => (
                <tr key={gr.id} className="border-b border-border/40 last:border-0 hover:bg-muted/20">
                  <td className="px-4 py-2.5 font-medium text-primary">{gr.num}</td>
                  <td className="px-4 py-2.5 text-blue-600">{gr.poNum}</td>
                  <td className="px-4 py-2.5">{gr.supplier}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{gr.date}</td>
                  <td className="px-4 py-2.5"><StatusBadge status={gr.status} small /></td>
                  <td className="px-4 py-2.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <div className="h-6 w-6 rounded border border-border flex items-center justify-center text-muted-foreground cursor-default"><Eye className="h-3 w-3" /></div>
                      <div className="h-6 w-6 rounded border border-border flex items-center justify-center text-muted-foreground cursor-default"><Edit className="h-3 w-3" /></div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function PageReceiptCreate() {
  return (
    <div className="p-4 md:p-6 space-y-5 max-w-3xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded border border-border flex items-center justify-center text-muted-foreground text-xs cursor-default">←</div>
        <h1 className="text-lg font-semibold">New Goods Receipt</h1>
      </div>

      <div id="po-demo-gr-create" className="bg-card border border-border rounded-lg p-5 space-y-5">
        <div>
          <label className="block text-xs font-medium text-foreground mb-1.5">Linked Purchase Order *</label>
          <div className="h-9 px-3 rounded-md border border-primary bg-primary/5 text-sm flex items-center justify-between text-foreground">
            PO-2025-044 — Machinery Parts Ltd
            <ChevronRight className="h-4 w-4 rotate-90 text-muted-foreground" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">Receipt Date *</label>
            <div className="h-9 px-3 rounded-md border border-border text-sm flex items-center text-foreground">2025-06-06</div>
          </div>
          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">Warehouse</label>
            <div className="h-9 px-3 rounded-md border border-border text-sm flex items-center justify-between text-foreground">
              Sfax Main Warehouse <ChevronRight className="h-4 w-4 rotate-90 text-muted-foreground" />
            </div>
          </div>
        </div>

        <div>
          <p className="text-xs font-medium text-foreground mb-2">Received Quantities</p>
          <div className="border border-border rounded-md overflow-hidden">
            <table className="w-full text-xs">
              <thead><tr className="bg-muted/30 border-b border-border">
                <th className="text-left px-4 py-2 text-muted-foreground font-medium">Article</th>
                <th className="text-right px-4 py-2 text-muted-foreground font-medium">Ordered</th>
                <th className="text-right px-4 py-2 text-muted-foreground font-medium">Previously Received</th>
                <th className="text-right px-4 py-2 text-muted-foreground font-medium">Receiving Now</th>
              </tr></thead>
              <tbody>
                <tr className="border-b border-border/40">
                  <td className="px-4 py-2.5">Hydraulic Cylinder HY-200</td>
                  <td className="px-4 py-2.5 text-right">20</td>
                  <td className="px-4 py-2.5 text-right text-amber-600">12</td>
                  <td className="px-4 py-2.5 text-right">
                    <div className="inline-flex h-7 w-16 rounded border border-primary bg-primary/5 items-center justify-center font-medium text-primary">8</div>
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5">Mounting Bracket MB-45</td>
                  <td className="px-4 py-2.5 text-right">50</td>
                  <td className="px-4 py-2.5 text-right text-green-600">50</td>
                  <td className="px-4 py-2.5 text-right">
                    <div className="inline-flex h-7 w-16 rounded border border-border bg-muted items-center justify-center text-muted-foreground">0</div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <div className="h-9 px-4 rounded-md border border-border text-sm flex items-center text-muted-foreground cursor-default">Cancel</div>
        <div className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium flex items-center cursor-default">Confirm Receipt</div>
      </div>
    </div>
  );
}

function PageReceiptDetail() {
  const GR = DEMO_RECEIPTS[1];
  return (
    <div className="p-4 md:p-6 space-y-5 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded border border-border flex items-center justify-center text-muted-foreground text-xs cursor-default">←</div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold" id="po-demo-gr-detail">{GR.num}</h1>
            <StatusBadge status={GR.status} />
          </div>
          <p className="text-xs text-muted-foreground">{GR.supplier} · {GR.date}</p>
        </div>
        <div id="po-demo-gr-edit" className="ml-auto h-8 px-3 rounded-md border border-border flex items-center gap-1.5 text-xs text-muted-foreground cursor-default">
          <Edit className="h-3.5 w-3.5" /> Edit
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-lg p-4 space-y-2 text-xs">
          <p className="text-xs font-semibold mb-2">Receipt Details</p>
          <div className="flex justify-between"><span className="text-muted-foreground">Linked PO</span><span className="font-medium text-primary">{GR.poNum}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span>{GR.date}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Warehouse</span><span>Sfax Main Warehouse</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Confirmed by</span><span>Ahmed B.</span></div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4 space-y-2 text-xs">
          <p className="text-xs font-semibold mb-2">Supplier</p>
          <p className="text-foreground font-medium">{GR.supplier}</p>
          <p className="text-muted-foreground">14, Rue de l'Industrie, Sfax</p>
          <p className="text-muted-foreground">contact@machineryparts.tn</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-border/60"><span className="text-sm font-medium">Received Items</span></div>
        <table className="w-full text-xs">
          <thead><tr className="bg-muted/30 border-b border-border">
            <th className="text-left px-4 py-2 text-muted-foreground font-medium">Article</th>
            <th className="text-right px-4 py-2 text-muted-foreground font-medium">Ordered</th>
            <th className="text-right px-4 py-2 text-muted-foreground font-medium">Received</th>
            <th className="text-right px-4 py-2 text-muted-foreground font-medium">Remaining</th>
          </tr></thead>
          <tbody>
            <tr className="border-b border-border/40">
              <td className="px-4 py-2.5">Hydraulic Cylinder HY-200</td>
              <td className="px-4 py-2.5 text-right">20</td>
              <td className="px-4 py-2.5 text-right text-amber-600 font-medium">12</td>
              <td className="px-4 py-2.5 text-right text-amber-600">8</td>
            </tr>
            <tr>
              <td className="px-4 py-2.5">Mounting Bracket MB-45</td>
              <td className="px-4 py-2.5 text-right">50</td>
              <td className="px-4 py-2.5 text-right text-green-600 font-medium">50</td>
              <td className="px-4 py-2.5 text-right text-green-600">0</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PageInvoicesList({ state: _ }: { state: PurchaseDemoState }) {
  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border/60">
        <div>
          <h1 className="text-lg font-semibold">Supplier Invoices</h1>
          <p className="text-xs text-muted-foreground">{DEMO_INVOICES.length} invoices</p>
        </div>
        <div id="po-demo-si-create" className="h-8 px-3 rounded-md bg-primary flex items-center gap-1.5 text-xs text-primary-foreground font-medium cursor-default">
          <Plus className="h-3.5 w-3.5" /> New Invoice
        </div>
      </div>

      <div className="px-4 py-3">
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full text-xs">
            <thead><tr className="bg-muted/30 border-b border-border/60">
              <th className="text-left px-4 py-2 text-muted-foreground font-medium">Invoice #</th>
              <th className="text-left px-4 py-2 text-muted-foreground font-medium">Linked PO</th>
              <th className="text-left px-4 py-2 text-muted-foreground font-medium">Supplier</th>
              <th className="text-left px-4 py-2 text-muted-foreground font-medium" id="po-demo-si-status-badges">Status</th>
              <th className="text-right px-4 py-2 text-muted-foreground font-medium">Total</th>
              <th className="text-right px-4 py-2 text-muted-foreground font-medium" id="po-demo-si-rs-col">RS</th>
              <th className="text-left px-4 py-2 text-muted-foreground font-medium">FEL</th>
              <th className="text-left px-4 py-2 text-muted-foreground font-medium">TEJ</th>
            </tr></thead>
            <tbody>
              {DEMO_INVOICES.map(si => (
                <tr key={si.id} className="border-b border-border/40 last:border-0 hover:bg-muted/20">
                  <td className="px-4 py-2.5 font-medium text-primary">{si.num}</td>
                  <td className="px-4 py-2.5 text-blue-600">{si.poNum}</td>
                  <td className="px-4 py-2.5 truncate max-w-[120px]">{si.supplier}</td>
                  <td className="px-4 py-2.5"><StatusBadge status={si.status} small /></td>
                  <td className="px-4 py-2.5 text-right font-medium">{fmt(si.total)} {resolveCurrencyCode()}</td>
                  <td className="px-4 py-2.5 text-right">
                    {si.rs ? <span className="text-amber-600 font-medium">{fmt(si.rs)} {resolveCurrencyCode()}</span> : <span className="text-muted-foreground">—</span>}
                  </td>
                  <td className="px-4 py-2.5">
                    {si.fel === 'registered' && <span className="text-px-10 text-green-700 bg-green-100 px-1.5 py-0.5 rounded-full font-medium">Registered</span>}
                    {si.fel === 'pending'    && <span className="text-px-10 text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-full font-medium">Pending</span>}
                    {!si.fel               && <span className="text-muted-foreground">—</span>}
                  </td>
                  <td className="px-4 py-2.5">
                    {si.tej === 'synced'  && <span className="text-px-10 text-green-700 bg-green-100 px-1.5 py-0.5 rounded-full font-medium">Synced</span>}
                    {si.tej === 'pending' && <span className="text-px-10 text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-full font-medium">Pending</span>}
                    {!si.tej             && <span className="text-muted-foreground">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function PageInvoiceCreate() {
  return (
    <div className="p-4 md:p-6 space-y-5 max-w-3xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded border border-border flex items-center justify-center text-muted-foreground text-xs cursor-default">←</div>
        <h1 className="text-lg font-semibold">New Supplier Invoice</h1>
      </div>

      <div id="po-demo-si-create" className="bg-card border border-border rounded-lg p-5 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">Invoice Number *</label>
            <div className="h-9 px-3 rounded-md border border-primary bg-primary/5 text-sm flex items-center text-foreground">INV-F-2025-004</div>
          </div>
          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">Invoice Date *</label>
            <div className="h-9 px-3 rounded-md border border-border text-sm flex items-center text-foreground">2025-06-06</div>
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-foreground mb-1.5">Linked Purchase Order</label>
          <div className="h-9 px-3 rounded-md border border-border text-sm flex items-center justify-between text-foreground">
            PO-2025-042 — Tech Solutions SA
            <ChevronRight className="h-4 w-4 rotate-90 text-muted-foreground" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">Amount (excl. tax) *</label>
            <div className="h-9 px-3 rounded-md border border-border text-sm flex items-center text-foreground">7,353 {resolveCurrencyCode()}</div>
          </div>
          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">Tax Amount</label>
            <div className="h-9 px-3 rounded-md border border-border text-sm flex items-center text-foreground">1,397 {resolveCurrencyCode()}</div>
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-foreground mb-1.5">RS Transaction Type</label>
          <div className="h-9 px-3 rounded-md border border-border text-sm flex items-center justify-between text-muted-foreground">
            Not applicable (no withholding tax)
            <ChevronRight className="h-4 w-4 rotate-90 text-muted-foreground" />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <div className="h-9 px-4 rounded-md border border-border text-sm flex items-center text-muted-foreground cursor-default">Cancel</div>
        <div className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium flex items-center cursor-default">Save Invoice</div>
      </div>
    </div>
  );
}

function PageInvoiceDetail() {
  const INV = DEMO_INVOICES[1]; // partially paid
  return (
    <div className="p-4 md:p-6 space-y-5 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded border border-border flex items-center justify-center text-muted-foreground text-xs cursor-default">←</div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold">{INV.num}</h1>
            <StatusBadge status={INV.status} />
          </div>
          <p className="text-xs text-muted-foreground">{INV.supplier} · {INV.date}</p>
        </div>
        <div className="h-8 px-3 rounded-md border border-border flex items-center gap-1.5 text-xs text-muted-foreground cursor-default">
          <FileDown className="h-3.5 w-3.5" /> PDF
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-lg p-4 space-y-2.5 text-xs">
          <p className="text-xs font-semibold mb-1">Invoice Summary</p>
          <div className="flex justify-between"><span className="text-muted-foreground">Amount (excl. tax)</span><span>{fmt(27310)} {resolveCurrencyCode()}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Tax (19%)</span><span>5,190 {resolveCurrencyCode()}</span></div>
          <div className="flex justify-between font-semibold border-t border-border pt-2"><span>Grand Total</span><span>{fmt(INV.total)} {resolveCurrencyCode()}</span></div>
          <div className="flex justify-between text-amber-600 font-medium"><span>RS Deduction (5%)</span><span>— {fmt(INV.rs!)} {resolveCurrencyCode()}</span></div>
          <div className="flex justify-between font-bold text-foreground border-t border-border pt-2"><span>Net to Pay</span><span>{fmt(INV.total - INV.rs!)} {resolveCurrencyCode()}</span></div>
        </div>

        <div className="space-y-3">
          <div id="po-demo-si-detail-fel" className="bg-card border border-border rounded-lg p-4 space-y-2 text-xs">
            <p className="text-xs font-semibold flex items-center gap-1.5"><FileText className="h-3.5 w-3.5 text-blue-500" /> Facture en Ligne</p>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Registration status</span>
              <span className="text-px-10 text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full font-medium">Pending</span>
            </div>
            <p className="text-muted-foreground">This invoice has not yet been registered on the official e-invoicing platform.</p>
          </div>

          <div id="po-demo-si-tej-sync" className="bg-card border border-border rounded-lg p-4 space-y-2 text-xs">
            <p className="text-xs font-semibold flex items-center gap-1.5"><Download className="h-3.5 w-3.5 text-amber-500" /> TEJ Sync</p>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Export status</span>
              <span className="text-px-10 text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full font-medium">Pending</span>
            </div>
            <div className="h-7 px-3 rounded-md border border-border text-px-11 text-muted-foreground flex items-center gap-1.5 cursor-default w-fit">
              <Download className="h-3 w-3" /> Download TEJ XML
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PageCompliance() {
  return (
    <div className="p-4 md:p-6 space-y-5 max-w-5xl mx-auto">
      <div className="flex items-center gap-3">
        <Shield className="h-5 w-5 text-amber-500" />
        <div>
          <h1 className="text-lg font-semibold">Compliance Dashboard</h1>
          <p className="text-xs text-muted-foreground">Tunisian fiscal obligations — RS, Facture en Ligne, and TEJ</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {/* RS Card */}
        <div id="po-demo-compliance-rs" className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border/60">
            <Shield className="h-4 w-4 text-amber-500" />
            <span className="text-sm font-medium">Retenue à la Source</span>
          </div>
          <div className="p-4 space-y-3">
            <div>
              <p className="text-2xl font-bold text-foreground">2,385 <span className="text-sm font-normal text-muted-foreground">{resolveCurrencyCode()}</span></p>
              <p className="text-xs text-muted-foreground">Total RS liability this year</p>
            </div>
            {DEMO_INVOICES.filter(i => i.rs).map(inv => (
              <div key={inv.id} className="flex items-center justify-between p-2 rounded bg-muted/40 text-xs">
                <div>
                  <p className="font-medium">{inv.num}</p>
                  <p className="text-muted-foreground">{inv.supplier.split(' ')[0]}</p>
                </div>
                <span className="font-medium text-amber-600">{fmt(inv.rs!)} {resolveCurrencyCode()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Facture en Ligne */}
        <div id="po-demo-compliance-fel" className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border/60">
            <FileText className="h-4 w-4 text-blue-500" />
            <span className="text-sm font-medium">Facture en Ligne</span>
          </div>
          <div className="p-4 space-y-3">
            {DEMO_INVOICES.map(inv => (
              <div key={inv.id} className="flex items-center justify-between p-2 rounded bg-muted/40 text-xs">
                <div>
                  <p className="font-medium">{inv.num}</p>
                  <p className="text-muted-foreground">{inv.supplier.split(' ')[0]}</p>
                </div>
                {inv.fel === 'registered' && <span className="text-px-10 text-green-700 bg-green-100 px-1.5 py-0.5 rounded-full font-medium">Registered</span>}
                {inv.fel === 'pending'    && <span className="text-px-10 text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-full font-medium">Pending</span>}
                {!inv.fel               && <span className="text-muted-foreground text-px-10">Not started</span>}
              </div>
            ))}
          </div>
        </div>

        {/* TEJ Sync */}
        <div id="po-demo-compliance-tej" className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border/60">
            <Download className="h-4 w-4 text-purple-500" />
            <span className="text-sm font-medium">TEJ Sync Status</span>
          </div>
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Synced</span>
              <span className="font-semibold text-green-600">1</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Pending</span>
              <span className="font-semibold text-amber-600">1</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Not applicable</span>
              <span className="font-semibold text-muted-foreground">1</span>
            </div>
            <div className="h-1 rounded-full bg-muted overflow-hidden mt-2">
              <div className="h-full bg-green-500" style={{ width: '33%' }} />
            </div>
            {DEMO_INVOICES.filter(i => i.tej === 'pending').map(inv => (
              <div key={inv.id} className="flex items-center justify-between p-2 rounded bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 text-xs">
                <div>
                  <p className="font-medium">{inv.num}</p>
                  <p className="text-muted-foreground">{inv.supplier.split(' ')[0]}</p>
                </div>
                <div className="h-6 px-2 rounded border border-border bg-background text-px-10 flex items-center gap-1 cursor-default">
                  <Download className="h-2.5 w-2.5" /> Export
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function PageReports() {
  const supplierBars = [
    { name: 'Alpha SARL', value: 45600, pct: 100 },
    { name: 'Machinery', value: 32500, pct: 71  },
    { name: 'Tech Sol.', value: 17500, pct: 38  },
    { name: 'Office Co.', value: 6700,  pct: 15  },
  ];
  const monthlyBars = [
    { month: 'Jan', value: 15200, pct: 100 },
    { month: 'Feb', value: 0,     pct: 0   },
    { month: 'Mar', value: 0,     pct: 0   },
    { month: 'Apr', value: 32500, pct: 100 },
    { month: 'May', value: 8750,  pct: 27  },
    { month: 'Jun', value: 5540,  pct: 17  },
  ];

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-5xl mx-auto">
      <div className="flex items-center gap-3">
        <BarChart3 className="h-5 w-5 text-blue-500" />
        <div>
          <h1 className="text-lg font-semibold">Reports</h1>
          <p className="text-xs text-muted-foreground">Purchasing analytics and supplier insights</p>
        </div>
      </div>

      {/* Sub-report cards */}
      <div id="po-demo-report-cards" className="grid grid-cols-3 gap-3">
        {[
          { id: 'po-demo-report-nav-perf', icon: TrendingUp, title: 'Supplier Performance', sub: 'On-time rate, lead time and spend per vendor' },
          { id: undefined, icon: Award, title: 'Price Evolution', sub: 'Track purchase price changes per supplier' },
          { id: undefined, icon: Clock, title: 'Invoice Aging', sub: 'Outstanding amounts grouped by overdue age' },
        ].map(c => (
          <div key={c.title} id={c.id} className="bg-card border border-border rounded-lg p-3 flex items-start gap-2 cursor-default hover:border-primary/40 transition-colors">
            <div className="p-1.5 rounded bg-primary/10 shrink-0"><c.icon className="h-3.5 w-3.5 text-primary" /></div>
            <div>
              <p className="text-xs font-semibold">{c.title}</p>
              <p className="text-px-10 text-muted-foreground mt-0.5">{c.sub}</p>
            </div>
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground ml-auto mt-0.5 shrink-0" />
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-5">
        {/* Spend by supplier */}
        <div className="bg-card border border-border rounded-lg p-4">
          <p id="po-demo-report-supplier-chart" className="text-sm font-semibold mb-3">Spend by Supplier</p>
          <div className="space-y-2">
            {supplierBars.map(b => (
              <div key={b.name} className="flex items-center gap-2 text-xs">
                <span className="w-20 truncate text-right text-muted-foreground shrink-0">{b.name}</span>
                <div className="flex-1 h-5 bg-muted rounded overflow-hidden">
                  <div className="h-full bg-primary/70 rounded transition-all" style={{ width: `${b.pct}%` }} />
                </div>
                <span className="w-20 text-right font-medium text-foreground shrink-0">{fmt(b.value)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly spend */}
        <div className="bg-card border border-border rounded-lg p-4">
          <p id="po-demo-report-monthly-chart" className="text-sm font-semibold mb-3">Monthly Spend</p>
          <div className="flex items-end gap-2 h-24">
            {monthlyBars.map(b => (
              <div key={b.month} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full rounded-t bg-primary/70 transition-all" style={{ height: `${Math.max(b.pct * 0.8, b.value > 0 ? 4 : 0)}%` }} />
                <span className="text-px-9 text-muted-foreground">{b.month}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function PageSupplierPerformance() {
  return (
    <div className="p-4 md:p-6 space-y-5 max-w-5xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded border border-border flex items-center justify-center text-muted-foreground text-xs cursor-default">←</div>
        <div>
          <h1 className="text-lg font-semibold">Supplier Performance</h1>
          <p className="text-xs text-muted-foreground">Grade A–D based on on-time delivery, lead time, and payment history</p>
        </div>
      </div>

      {/* Scorecard */}
      <div id="po-demo-perf-scorecard" className="bg-card border border-border rounded-lg overflow-hidden">
        <table className="w-full text-xs">
          <thead><tr className="bg-muted/30 border-b border-border/60">
            <th className="text-left px-4 py-2.5 text-muted-foreground font-medium">Supplier</th>
            <th className="text-right px-4 py-2.5 text-muted-foreground font-medium">POs</th>
            <th className="text-right px-4 py-2.5 text-muted-foreground font-medium">Spend ({resolveCurrencyCode()})</th>
            <th className="text-right px-4 py-2.5 text-muted-foreground font-medium">On-Time</th>
            <th className="text-right px-4 py-2.5 text-muted-foreground font-medium">Avg Lead</th>
            <th className="text-center px-4 py-2.5 text-muted-foreground font-medium">Grade</th>
          </tr></thead>
          <tbody>
            {DEMO_PERF.map(s => (
              <tr key={s.name} className="border-b border-border/40 last:border-0 hover:bg-muted/20 cursor-default">
                <td className="px-4 py-3 font-medium">{s.name}</td>
                <td className="px-4 py-3 text-right">{s.pos}</td>
                <td className="px-4 py-3 text-right">{fmt(s.spend)}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-green-500 rounded-full" style={{ width: `${s.onTime}%` }} />
                    </div>
                    <span className={s.onTime >= 90 ? 'text-green-600 font-medium' : s.onTime >= 75 ? 'text-amber-600 font-medium' : 'text-red-600 font-medium'}>{s.onTime}%</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-right text-muted-foreground">{s.lead}d</td>
                <td className="px-4 py-3 text-center">
                  <span className={`inline-flex items-center justify-center h-6 w-6 rounded-full text-xs font-bold ${s.gradeColor}`}>{s.grade}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Performance chart */}
      <div id="po-demo-perf-chart" className="bg-card border border-border rounded-lg p-4">
        <p className="text-sm font-semibold mb-3">On-Time Delivery Comparison</p>
        <div className="space-y-2">
          {DEMO_PERF.map(s => (
            <div key={s.name} className="flex items-center gap-2 text-xs">
              <span className="w-32 truncate text-right text-muted-foreground shrink-0">{s.name.split(' ')[0]}</span>
              <div className="flex-1 h-6 bg-muted rounded overflow-hidden flex items-center">
                <div
                  className={`h-full rounded flex items-center justify-end pr-2 text-px-10 font-medium text-white transition-all ${s.onTime >= 90 ? 'bg-green-500' : s.onTime >= 75 ? 'bg-amber-500' : 'bg-red-500'}`}
                  style={{ width: `${s.onTime}%` }}
                >
                  {s.onTime}%
                </div>
              </div>
              <span className={`w-8 text-right font-bold shrink-0 ${s.gradeColor.replace('bg-', 'text-').split(' ')[0]}`}>{s.grade}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PageAuditLog() {
  return (
    <div className="p-4 md:p-6 space-y-5 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <BookOpen className="h-5 w-5 text-purple-500" />
        <div>
          <h1 className="text-lg font-semibold">Audit Log</h1>
          <p className="text-xs text-muted-foreground">Immutable record of every action in the Purchases module</p>
        </div>
      </div>

      {/* Filters */}
      <div id="po-demo-audit-filter" className="flex items-center gap-2">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <div className="h-8 pl-8 pr-3 rounded-md border border-border bg-background text-xs text-muted-foreground flex items-center">Search events…</div>
        </div>
        <div className="h-8 px-3 rounded-md border border-border text-xs flex items-center gap-1.5 text-muted-foreground cursor-default">
          All document types <ChevronRight className="h-3 w-3 rotate-90" />
        </div>
        <div className="h-8 px-3 rounded-md border border-border text-xs flex items-center gap-1.5 text-muted-foreground cursor-default">
          All actions <ChevronRight className="h-3 w-3 rotate-90" />
        </div>
      </div>

      {/* Entries */}
      <div id="po-demo-audit-entries" className="space-y-2">
        {DEMO_ACTIVITIES.map(a => (
          <div key={a.id} className="bg-card border border-border rounded-lg p-3 flex items-start gap-3">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <span className="text-px-11 font-bold text-primary">{a.user.slice(0,2)}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-foreground">{a.user}</span>
                <span className={`text-px-10 px-1.5 py-0.5 rounded-full font-medium
                  ${a.action === 'Created'   ? 'bg-blue-100 text-blue-700'    :
                    a.action === 'Validated' ? 'bg-purple-100 text-purple-700' :
                    a.action === 'Ordered'   ? 'bg-indigo-100 text-indigo-700' :
                    a.action === 'Received'  ? 'bg-green-100 text-green-700'   :
                    'bg-muted text-muted-foreground'}`}>
                  {a.action}
                </span>
                <span className="text-xs font-medium text-primary">{a.doc}</span>
              </div>
              <p className="text-px-11 text-muted-foreground mt-0.5">{a.detail}</p>
              <p className="text-px-10 text-muted-foreground/60 mt-0.5">{a.date} at {a.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── NEW: PO PDF preview ──────────────────────────────────────────────────────

function PageOrderPdfPreview() {
  return (
    <div className="p-4 md:p-8 bg-muted/30 min-h-full">
      <div id="po-demo-pdf-doc" className="max-w-2xl mx-auto bg-white text-black shadow-lg rounded-md overflow-hidden">
        {/* Letterhead */}
        <div className="flex items-start justify-between p-6 border-b-2 border-primary">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
              <ShoppingCart className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-lg font-bold text-slate-900">Flowentra Demo SARL</p>
              <p className="text-px-10 text-slate-500">12, Av. Habib Bourguiba · Tunis 1000 · MF 1234567A</p>
              <p className="text-px-10 text-slate-500">contact@flowentra.tn · +216 71 000 000</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xl font-bold text-primary">BON DE COMMANDE</p>
            <p className="text-xs text-slate-600 mt-1">N° <span className="font-semibold">PO-2025-044</span></p>
            <p className="text-xs text-slate-600">Date: <span className="font-semibold">2025-04-20</span></p>
          </div>
        </div>

        {/* Parties */}
        <div className="grid grid-cols-2 gap-4 p-6 text-xs">
          <div className="border border-slate-200 rounded p-3">
            <p className="text-px-10 font-bold text-slate-500 uppercase mb-1">Fournisseur</p>
            <p className="font-semibold text-slate-900">Machinery Parts Ltd</p>
            <p className="text-slate-700">14, Rue de l'Industrie</p>
            <p className="text-slate-700">3000 Sfax · Tunisie</p>
            <p className="text-slate-500 mt-1">MF: 7891011B · contact@machineryparts.tn</p>
          </div>
          <div className="border border-slate-200 rounded p-3">
            <p className="text-px-10 font-bold text-slate-500 uppercase mb-1">Livraison</p>
            <p className="font-semibold text-slate-900">Entrepôt Sfax</p>
            <p className="text-slate-700">Zone Industrielle Sidi Abid</p>
            <p className="text-slate-500 mt-1">Livraison prévue: <span className="font-semibold text-slate-700">2025-05-10</span></p>
            <p className="text-slate-500">Conditions: Net 30 jours</p>
          </div>
        </div>

        {/* Items */}
        <div id="po-demo-pdf-items" className="px-6 pb-3">
          <table className="w-full text-xs border border-slate-200">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200">
                <th className="text-left px-2 py-1.5 font-semibold text-slate-700">Réf.</th>
                <th className="text-left px-2 py-1.5 font-semibold text-slate-700">Désignation</th>
                <th className="text-right px-2 py-1.5 font-semibold text-slate-700">Qté</th>
                <th className="text-right px-2 py-1.5 font-semibold text-slate-700">PU HT</th>
                <th className="text-right px-2 py-1.5 font-semibold text-slate-700">TVA</th>
                <th className="text-right px-2 py-1.5 font-semibold text-slate-700">Total HT</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-200">
                <td className="px-2 py-1.5 text-slate-600">HY-200</td>
                <td className="px-2 py-1.5">Hydraulic Cylinder HY-200</td>
                <td className="px-2 py-1.5 text-right">20</td>
                <td className="px-2 py-1.5 text-right">1,200</td>
                <td className="px-2 py-1.5 text-right">19%</td>
                <td className="px-2 py-1.5 text-right font-medium">24,000</td>
              </tr>
              <tr>
                <td className="px-2 py-1.5 text-slate-600">MB-45</td>
                <td className="px-2 py-1.5">Mounting Bracket MB-45</td>
                <td className="px-2 py-1.5 text-right">50</td>
                <td className="px-2 py-1.5 text-right">170</td>
                <td className="px-2 py-1.5 text-right">19%</td>
                <td className="px-2 py-1.5 text-right font-medium">8,500</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div id="po-demo-pdf-totals" className="flex justify-end px-6 pb-6">
          <div className="w-64 text-xs space-y-1">
            <div className="flex justify-between text-slate-600"><span>Sous-total HT</span><span>27,310.000</span></div>
            <div className="flex justify-between text-slate-600"><span>Remise</span><span>0.000</span></div>
            <div className="flex justify-between text-slate-600"><span>TVA (19%)</span><span>5,189.900</span></div>
            <div className="flex justify-between text-slate-600"><span>Timbre fiscal</span><span>1.000</span></div>
            <div className="flex justify-between font-bold text-base text-slate-900 border-t-2 border-slate-300 pt-1.5 mt-1"><span>Total TTC</span><span>32,500.900 {resolveCurrencyCode()}</span></div>
            <p className="text-px-10 text-slate-500 italic mt-2">Arrêté la présente commande à la somme de trente-deux mille cinq cents dinars et neuf cents millimes.</p>
          </div>
        </div>

        <div className="border-t border-slate-200 px-6 py-3 flex items-center justify-between text-px-10 text-slate-500">
          <span>Document généré par Flowentra · {new Date().toLocaleDateString('fr-TN')}</span>
          <span>Page 1 / 1</span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto mt-3 flex justify-end gap-2">
        <div className="h-8 px-3 rounded-md border border-border bg-card text-xs text-foreground flex items-center gap-1.5 cursor-default">
          <FileDown className="h-3.5 w-3.5" /> Download PDF
        </div>
        <div className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-xs font-medium flex items-center gap-1.5 cursor-default">
          <Send className="h-3.5 w-3.5" /> Email to Supplier
        </div>
      </div>
    </div>
  );
}

// ─── NEW: TEJ XML preview (PO + Invoice variants) ────────────────────────────

// Real DGI TEJ Schema v1.0 XML — UTF-8, no BOM, monetary fields in millimes.
const TEJ_PO_XML = `<?xml version="1.0" encoding="UTF-8"?>
<DeclarationsRS VersionSchema="1.0">
  <Declarant>
    <TypeIdentifiant>1</TypeIdentifiant>
    <MatriculeFiscal>1234567A</MatriculeFiscal>
    <CategorieContribuable>PM</CategorieContribuable>
    <NometprenonOuRaisonsociale>Flowentra Demo SARL</NometprenonOuRaisonsociale>
    <InfosContact>
      <Adresse>12, Av. Habib Bourguiba, Tunis 1000</Adresse>
      <Email>contact@flowentra.tn</Email>
      <Telephone>+21671000000</Telephone>
    </InfosContact>
  </Declarant>
  <ReferenceDeclaration>
    <ActeDepot>0</ActeDepot>
    <AnneeDepot>2025</AnneeDepot>
    <MoisDepot>05</MoisDepot>
  </ReferenceDeclaration>
  <AjouterCertificats>
    <Certificat>
      <RefCertifChezDeclarant>CRT-2025-002</RefCertifChezDeclarant>
      <AnneeFacturation>2025</AnneeFacturation>
      <IdTypeOperation>RS1_500000</IdTypeOperation>
      <Beneficiaire>
        <TypeIdentifiant>1</TypeIdentifiant>
        <MatriculeFiscal>7891011B</MatriculeFiscal>
        <CategorieContribuable>PM</CategorieContribuable>
        <Resident>1</Resident>
        <NometprenonOuRaisonsociale>Machinery Parts Ltd</NometprenonOuRaisonsociale>
        <Pays>TN</Pays>
      </Beneficiaire>
      <Facture>
        <NumeroFacture>INV-F-2025-002</NumeroFacture>
        <DateFacture>10/05/2025</DateFacture>
        <DatePayement>15/05/2025</DatePayement>
        <MontantHT>27310000</MontantHT>
        <MontantTVA>5189900</MontantTVA>
        <TauxRS>500</TauxRS>
        <MontantRS>1625000</MontantRS>
        <MontantNetServi>30875900</MontantNetServi>
        <PriseEnCharge>0</PriseEnCharge>
      </Facture>
    </Certificat>
    <TotalMontantHT>27310000</TotalMontantHT>
    <TotalMontantTVA>5189900</TotalMontantTVA>
    <TotalMontantRS>1625000</TotalMontantRS>
    <TotalMontantNetServi>30875900</TotalMontantNetServi>
  </AjouterCertificats>
</DeclarationsRS>
`;

const TEJ_INVOICE_XML = `<?xml version="1.0" encoding="UTF-8"?>
<DeclarationsRS VersionSchema="1.0">
  <Declarant>
    <TypeIdentifiant>1</TypeIdentifiant>
    <MatriculeFiscal>1234567A</MatriculeFiscal>
    <CategorieContribuable>PM</CategorieContribuable>
    <NometprenonOuRaisonsociale>Flowentra Demo SARL</NometprenonOuRaisonsociale>
    <InfosContact>
      <Adresse>12, Av. Habib Bourguiba, Tunis 1000</Adresse>
      <Email>contact@flowentra.tn</Email>
      <Telephone>+21671000000</Telephone>
    </InfosContact>
  </Declarant>
  <ReferenceDeclaration>
    <ActeDepot>0</ActeDepot>
    <AnneeDepot>2025</AnneeDepot>
    <MoisDepot>05</MoisDepot>
  </ReferenceDeclaration>
  <AjouterCertificats>
    <Certificat>
      <RefCertifChezDeclarant>CRT-2025-002</RefCertifChezDeclarant>
      <AnneeFacturation>2025</AnneeFacturation>
      <IdTypeOperation>RS1_500000</IdTypeOperation>
      <Cnpc>C-002-MPL-2025</Cnpc>
      <Beneficiaire>
        <TypeIdentifiant>1</TypeIdentifiant>
        <MatriculeFiscal>7891011B</MatriculeFiscal>
        <CategorieContribuable>PM</CategorieContribuable>
        <Resident>1</Resident>
        <NometprenonOuRaisonsociale>Machinery Parts Ltd</NometprenonOuRaisonsociale>
        <Pays>TN</Pays>
        <InfosContact>
          <Adresse>14, Rue de l'Industrie, Sfax</Adresse>
        </InfosContact>
      </Beneficiaire>
      <Facture>
        <NumeroFacture>INV-F-2025-002</NumeroFacture>
        <DateFacture>10/05/2025</DateFacture>
        <DatePayement>15/05/2025</DatePayement>
        <MontantHT>27310000</MontantHT>
        <MontantTVA>5189900</MontantTVA>
        <TauxRS>500</TauxRS>
        <MontantRS>1625000</MontantRS>
        <MontantNetServi>30875900</MontantNetServi>
        <PriseEnCharge>0</PriseEnCharge>
      </Facture>
    </Certificat>
    <TotalMontantHT>27310000</TotalMontantHT>
    <TotalMontantRS>1625000</TotalMontantRS>
    <TotalMontantNetServi>30875900</TotalMontantNetServi>
  </AjouterCertificats>
</DeclarationsRS>
`;

function TejXmlActions({ id, filename, xml }: { id?: string; filename: string; xml: string }) {
  const [copied, setCopied] = useState(false);
  const onCopy = async () => {
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(xml);
      else {
        const ta = document.createElement('textarea');
        ta.value = xml; document.body.appendChild(ta); ta.select();
        document.execCommand('copy'); document.body.removeChild(ta);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch { /* ignore */ }
  };
  const onDownload = () => {
    try {
      const blob = new Blob([xml], { type: 'application/xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = filename;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1500);
    } catch { /* ignore */ }
  };
  return (
    <div className="flex items-center gap-2 pointer-events-auto">
      <button
        onClick={onCopy}
        className="h-8 px-3 rounded-md border border-border bg-card hover:bg-muted text-xs font-medium flex items-center gap-1.5 cursor-pointer"
        title="Copy XML to clipboard"
      >
        {copied ? <CheckCircle2 className="h-3.5 w-3.5 text-green-600" /> : <FileText className="h-3.5 w-3.5" />}
        {copied ? 'Copied' : 'Copy XML'}
      </button>
      <button
        id={id}
        onClick={onDownload}
        className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-xs font-medium flex items-center gap-1.5 cursor-pointer hover:opacity-90"
        title={`Download ${filename}`}
      >
        <Download className="h-3.5 w-3.5" /> Download {filename}
      </button>
    </div>
  );
}


function XmlLine({ n, indent, content, highlight }: { n: number; indent: number; content: React.ReactNode; highlight?: boolean }) {
  return (
    <div className={`grid grid-cols-[2.5rem_1fr] gap-2 transition-colors ${highlight ? 'bg-amber-100/60 dark:bg-amber-500/15' : ''}`}>
      <span className="text-right text-px-10 text-muted-foreground/60 select-none pr-2 border-r border-border/40 py-[1px]">{n}</span>
      <span className="whitespace-pre py-[1px]" style={{ paddingLeft: `${indent * 0.75}rem` }}>{content}</span>
    </div>
  );
}

const T = ({ name }: { name: string }) => <span className="text-blue-600 dark:text-blue-400">{name}</span>;
const A = ({ name, value }: { name: string; value: string }) => (
  <><span className="text-purple-600 dark:text-purple-400">{` ${name}`}</span><span className="text-slate-500">=</span><span className="text-green-700 dark:text-green-400">{`"${value}"`}</span></>
);
const V = ({ children }: { children: React.ReactNode }) => <span className="text-foreground">{children}</span>;
const P = ({ children }: { children: React.ReactNode }) => <span className="text-slate-500">{children}</span>;

function XmlTag({ name, attrs, selfClose, close }: { name: string; attrs?: React.ReactNode; selfClose?: boolean; close?: boolean }) {
  return (
    <>
      <span className="text-slate-500">&lt;{close ? '/' : ''}</span>
      <T name={name} />
      {attrs}
      <span className="text-slate-500">{selfClose ? ' /' : ''}&gt;</span>
    </>
  );
}

function XmlElem({ name, value, indent, n, highlight }: { name: string; value: string; indent: number; n: number; highlight?: boolean }) {
  return (
    <XmlLine n={n} indent={indent} highlight={highlight} content={
      <>
        <XmlTag name={name} />
        <V>{value}</V>
        <XmlTag name={name} close />
      </>
    } />
  );
}

function PageOrderTejXml({ state }: { state: PurchaseDemoState }) {
  const h = state.xmlHighlightLine;
  // Aggregated TEJ XML for PO-2025-044 → two RS-applicable invoices
  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-4">
      <div id="po-demo-tej-xml-header" className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Code2 className="h-5 w-5 text-purple-500" />
          <div>
            <h1 className="text-lg font-semibold">TEJ XML — Purchase Order PO-2025-044</h1>
            <p className="text-xs text-muted-foreground">Aggregated RS certificates for all linked supplier invoices · Schema v1.0 · UTF-8 (no BOM)</p>
          </div>
        </div>
        <TejXmlActions id="po-demo-tej-xml-download" filename="tej-PO-2025-044.xml" xml={TEJ_PO_XML} />
      </div>

      <div className="bg-slate-50 dark:bg-slate-900/40 border border-border rounded-lg overflow-x-auto font-mono text-px-11 leading-relaxed py-3">
        <XmlLine n={1}  indent={0} content={<P>{'<?xml version="1.0" encoding="UTF-8"?>'}</P>} />
        <XmlLine n={2}  indent={0} highlight={h===4} content={<><XmlTag name="DeclarationsRS" attrs={<A name="VersionSchema" value="1.0" />} /></>} />
        <XmlLine n={3}  indent={1} highlight={h===4} content={<XmlTag name="Declarant" />} />
        <XmlLine n={4}  indent={2} highlight={h===4} content={<XmlTag name="TypeIdentifiant" />} />
        <XmlLine n={5}  indent={3} highlight={h===4} content={<V>1</V>} />
        <XmlLine n={6}  indent={2} highlight={h===4} content={<XmlTag name="TypeIdentifiant" close />} />
        <XmlElem n={7}  indent={2} name="MatriculeFiscal" value="1234567A" highlight={h===4} />
        <XmlElem n={8}  indent={2} name="CategorieContribuable" value="PM" highlight={h===4} />
        <XmlElem n={9}  indent={2} name="NometprenonOuRaisonsociale" value="Flowentra Demo SARL" highlight={h===4} />
        <XmlLine n={10} indent={2} highlight={h===4} content={<XmlTag name="InfosContact" />} />
        <XmlElem n={11} indent={3} name="Adresse" value="12, Av. Habib Bourguiba, Tunis 1000" highlight={h===4} />
        <XmlElem n={12} indent={3} name="Email" value="contact@flowentra.tn" highlight={h===4} />
        <XmlElem n={13} indent={3} name="Telephone" value="+21671000000" highlight={h===4} />
        <XmlLine n={14} indent={2} highlight={h===4} content={<XmlTag name="InfosContact" close />} />
        <XmlLine n={15} indent={1} highlight={h===4} content={<XmlTag name="Declarant" close />} />
        <XmlLine n={16} indent={1} highlight={h===16} content={<span id="po-demo-tej-xml-refdecl"><XmlTag name="ReferenceDeclaration" /></span>} />
        <XmlElem n={17} indent={2} name="ActeDepot" value="0" highlight={h===16} />
        <XmlElem n={18} indent={2} name="AnneeDepot" value="2025" highlight={h===16} />
        <XmlElem n={19} indent={2} name="MoisDepot" value="05" highlight={h===16} />
        <XmlLine n={20} indent={1} highlight={h===16} content={<XmlTag name="ReferenceDeclaration" close />} />
        <XmlLine n={21} indent={1} highlight={h===15} content={<XmlTag name="AjouterCertificats" />} />
        <XmlLine n={22} indent={2} highlight={h===15} content={<span id="po-demo-tej-xml-cert"><XmlTag name="Certificat" /></span>} />
        <XmlElem n={23} indent={3} name="RefCertifChezDeclarant" value="CRT-2025-002" highlight={h===15} />
        <XmlElem n={24} indent={3} name="AnneeFacturation" value="2025" highlight={h===15} />
        <XmlElem n={25} indent={3} name="IdTypeOperation" value="RS1_500000" highlight={h===15} />
        <XmlLine n={26} indent={3} highlight={h===15} content={<XmlTag name="Beneficiaire" />} />
        <XmlElem n={27} indent={4} name="MatriculeFiscal" value="7891011B" highlight={h===15} />
        <XmlElem n={28} indent={4} name="CategorieContribuable" value="PM" highlight={h===15} />
        <XmlElem n={29} indent={4} name="Resident" value="1" highlight={h===15} />
        <XmlElem n={30} indent={4} name="NometprenonOuRaisonsociale" value="Machinery Parts Ltd" highlight={h===15} />
        <XmlElem n={31} indent={4} name="Pays" value="TN" highlight={h===15} />
        <XmlLine n={32} indent={3} content={<XmlTag name="Beneficiaire" close />} />
        <XmlLine n={33} indent={3} highlight={h===33} content={<span id="po-demo-tej-xml-facture"><XmlTag name="Facture" /></span>} />
        <XmlElem n={34} indent={4} name="NumeroFacture" value="INV-F-2025-002" highlight={h===33} />
        <XmlElem n={35} indent={4} name="DateFacture" value="10/05/2025" highlight={h===33} />
        <XmlElem n={36} indent={4} name="DatePayement" value="15/05/2025" highlight={h===33} />
        <XmlElem n={37} indent={4} name="MontantHT" value="27310000" highlight={h===33} />
        <XmlElem n={38} indent={4} name="MontantTVA" value="5189900" highlight={h===33} />
        <XmlElem n={39} indent={4} name="TauxRS" value="500" highlight={h===33} />
        <XmlElem n={40} indent={4} name="MontantRS" value="1625000" highlight={h===33} />
        <XmlElem n={41} indent={4} name="MontantNetServi" value="30875900" highlight={h===33} />
        <XmlElem n={42} indent={4} name="PriseEnCharge" value="0" highlight={h===33} />
        <XmlLine n={43} indent={3} highlight={h===33} content={<XmlTag name="Facture" close />} />
        <XmlLine n={44} indent={2} content={<XmlTag name="Certificat" close />} />
        <XmlElem n={45} indent={2} name="TotalMontantHT" value="27310000" highlight={h===45} />
        <XmlElem n={46} indent={2} name="TotalMontantTVA" value="5189900" highlight={h===45} />
        <XmlElem n={47} indent={2} name="TotalMontantRS" value="1625000" highlight={h===45} />
        <XmlElem n={48} indent={2} name="TotalMontantNetServi" value="30875900" highlight={h===45} />
        <XmlLine n={49} indent={1} content={<span id="po-demo-tej-xml-totals"><XmlTag name="AjouterCertificats" close /></span>} />
        <XmlLine n={50} indent={0} content={<XmlTag name="DeclarationsRS" close />} />
      </div>

      <div className="grid grid-cols-3 gap-3 text-xs">
        <div className="bg-card border border-border rounded-lg p-3">
          <p className="text-px-10 text-muted-foreground font-medium uppercase">Total HT</p>
          <p className="text-base font-bold text-foreground mt-0.5">27,310.000 {resolveCurrencyCode()}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-3">
          <p className="text-px-10 text-muted-foreground font-medium uppercase">Total RS</p>
          <p className="text-base font-bold text-amber-600 mt-0.5">1,625.000 {resolveCurrencyCode()}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-3">
          <p className="text-px-10 text-muted-foreground font-medium uppercase">Net Servi</p>
          <p className="text-base font-bold text-green-600 mt-0.5">30,875.900 {resolveCurrencyCode()}</p>
        </div>
      </div>
    </div>
  );
}

function PageInvoiceTejXml({ state }: { state: PurchaseDemoState }) {
  const h = state.xmlHighlightLine;
  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Code2 className="h-5 w-5 text-purple-500" />
          <div>
            <h1 className="text-lg font-semibold">TEJ XML — Invoice INV-F-2025-002</h1>
            <p className="text-xs text-muted-foreground">RS Honoraires P2 · 5% · Single certificat · Acte=AjouterCertificats</p>
          </div>
        </div>
        <TejXmlActions filename="tej-INV-F-2025-002.xml" xml={TEJ_INVOICE_XML} />
      </div>

      <div className="bg-slate-50 dark:bg-slate-900/40 border border-border rounded-lg overflow-x-auto font-mono text-px-11 leading-relaxed py-3">
        <XmlLine n={1}  indent={0} content={<P>{'<?xml version="1.0" encoding="UTF-8"?>'}</P>} />
        <XmlLine n={2}  indent={0} content={<XmlTag name="DeclarationsRS" attrs={<A name="VersionSchema" value="1.0" />} />} />
        <XmlLine n={3}  indent={1} content={<span id="po-demo-itej-declarant"><XmlTag name="Declarant" /></span>} />
        <XmlLine n={4}  indent={2} highlight={h===4} content={<><XmlTag name="TypeIdentifiant" /><V>1</V><XmlTag name="TypeIdentifiant" close /></>} />
        <XmlElem n={5}  indent={2} name="MatriculeFiscal" value="1234567A" highlight={h===4} />
        <XmlElem n={6}  indent={2} name="CategorieContribuable" value="PM" highlight={h===4} />
        <XmlElem n={7}  indent={2} name="NometprenonOuRaisonsociale" value="Flowentra Demo SARL" highlight={h===4} />
        <XmlLine n={8}  indent={2} highlight={h===4} content={<XmlTag name="InfosContact" />} />
        <XmlElem n={9}  indent={3} name="Adresse" value="12, Av. Habib Bourguiba, Tunis 1000" highlight={h===4} />
        <XmlElem n={10} indent={3} name="Email" value="contact@flowentra.tn" highlight={h===4} />
        <XmlElem n={11} indent={3} name="Telephone" value="+21671000000" highlight={h===4} />
        <XmlLine n={12} indent={2} highlight={h===4} content={<XmlTag name="InfosContact" close />} />
        <XmlLine n={13} indent={1} highlight={h===4} content={<XmlTag name="Declarant" close />} />
        <XmlLine n={14} indent={1} highlight={h===14} content={<span id="po-demo-itej-refdecl"><XmlTag name="ReferenceDeclaration" /></span>} />
        <XmlElem n={15} indent={2} name="ActeDepot" value="0" highlight={h===14} />
        <XmlElem n={16} indent={2} name="AnneeDepot" value="2025" highlight={h===14} />
        <XmlElem n={17} indent={2} name="MoisDepot" value="05" highlight={h===14} />
        <XmlLine n={18} indent={1} highlight={h===14} content={<XmlTag name="ReferenceDeclaration" close />} />
        <XmlLine n={19} indent={1} content={<XmlTag name="AjouterCertificats" />} />
        <XmlLine n={20} indent={2} highlight={h===18} content={<span id="po-demo-itej-cert"><XmlTag name="Certificat" /></span>} />
        <XmlElem n={21} indent={3} name="RefCertifChezDeclarant" value="CRT-2025-002" highlight={h===18} />
        <XmlElem n={22} indent={3} name="AnneeFacturation" value="2025" highlight={h===18} />
        <XmlElem n={23} indent={3} name="IdTypeOperation" value="RS1_500000" highlight={h===18} />
        <XmlElem n={24} indent={3} name="Cnpc" value="C-002-MPL-2025" highlight={h===18} />
        <XmlLine n={25} indent={3} highlight={h===18} content={<XmlTag name="Beneficiaire" />} />
        <XmlLine n={26} indent={4} highlight={h===18} content={<><XmlTag name="TypeIdentifiant" /><V>1</V><XmlTag name="TypeIdentifiant" close /></>} />
        <XmlElem n={27} indent={4} name="MatriculeFiscal" value="7891011B" highlight={h===18} />
        <XmlElem n={28} indent={4} name="CategorieContribuable" value="PM" highlight={h===18} />
        <XmlElem n={29} indent={4} name="Resident" value="1" highlight={h===18} />
        <XmlElem n={30} indent={4} name="NometprenonOuRaisonsociale" value="Machinery Parts Ltd" highlight={h===18} />
        <XmlElem n={31} indent={4} name="Pays" value="TN" highlight={h===18} />
        <XmlLine n={32} indent={4} highlight={h===18} content={<XmlTag name="InfosContact" />} />
        <XmlElem n={33} indent={5} name="Adresse" value="14, Rue de l'Industrie, Sfax" highlight={h===18} />
        <XmlLine n={34} indent={4} highlight={h===18} content={<XmlTag name="InfosContact" close />} />
        <XmlLine n={35} indent={3} content={<XmlTag name="Beneficiaire" close />} />
        <XmlLine n={36} indent={3} highlight={h===32} content={<XmlTag name="Facture" />} />
        <XmlElem n={37} indent={4} name="NumeroFacture" value="INV-F-2025-002" highlight={h===32} />
        <XmlElem n={38} indent={4} name="DateFacture" value="10/05/2025" highlight={h===32} />
        <XmlElem n={39} indent={4} name="DatePayement" value="15/05/2025" highlight={h===32} />
        <XmlElem n={40} indent={4} name="MontantHT" value="27310000" highlight={h===32} />
        <XmlElem n={41} indent={4} name="MontantTVA" value="5189900" highlight={h===32} />
        <XmlElem n={42} indent={4} name="TauxRS" value="500" highlight={h===32} />
        <XmlElem n={43} indent={4} name="MontantRS" value="1625000" highlight={h===32} />
        <XmlElem n={44} indent={4} name="MontantNetServi" value="30875900" highlight={h===32} />
        <XmlElem n={45} indent={4} name="PriseEnCharge" value="0" highlight={h===32} />
        <XmlLine n={46} indent={3} highlight={h===32} content={<XmlTag name="Facture" close />} />
        <XmlLine n={47} indent={2} content={<XmlTag name="Certificat" close />} />
        <XmlElem n={48} indent={2} name="TotalMontantHT" value="27310000" highlight={h===48} />
        <XmlElem n={49} indent={2} name="TotalMontantRS" value="1625000" highlight={h===48} />
        <XmlElem n={50} indent={2} name="TotalMontantNetServi" value="30875900" highlight={h===48} />
        <XmlLine n={51} indent={1} content={<span id="po-demo-itej-totals"><XmlTag name="AjouterCertificats" close /></span>} />
        <XmlLine n={52} indent={0} content={<XmlTag name="DeclarationsRS" close />} />
      </div>

      <div id="po-demo-itej-facture" className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-xs flex items-start gap-2">
        <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
        <div>
          <p className="font-semibold text-amber-900 dark:text-amber-200">Amounts are encoded in millimes.</p>
          <p className="text-amber-800 dark:text-amber-300/80 mt-0.5">27,310.000 TND becomes <code className="font-mono">27310000</code> — the TEJ schema mandates integer millimes for every monetary field. Flowentra handles the conversion automatically.</p>
        </div>
      </div>
    </div>
  );
}

// ─── NEW: Article-Suppliers ───────────────────────────────────────────────────

const DEMO_ARTICLE_SUPPLIERS = [
  { id: 'sup-1', name: 'Machinery Parts Ltd', ref: 'MPL-HY-200', price: 1200, currency: 'TND', moq: 5, lead: 18, preferred: false, lastChange: '2025-04-12' },
  { id: 'sup-2', name: 'Hydraulics Tunis SA', ref: 'HT-CYL-200', price: 1150, currency: 'TND', moq: 10, lead: 8,  preferred: true,  lastChange: '2025-05-22' },
  { id: 'sup-3', name: 'EuroParts Import',    ref: 'EU-HY200',   price: 1320, currency: 'TND', moq: 1, lead: 25, preferred: false, lastChange: '2025-02-01' },
];

const DEMO_PRICE_HISTORY = [
  { date: '2024-09-15', supplier: 'Hydraulics Tunis SA', old: 980,  next: 1050, reason: 'Annual review' },
  { date: '2024-11-02', supplier: 'Machinery Parts Ltd', old: 1100, next: 1150, reason: 'Index TND/EUR' },
  { date: '2025-02-01', supplier: 'EuroParts Import',    old: 1280, next: 1320, reason: 'Customs duty change' },
  { date: '2025-04-12', supplier: 'Machinery Parts Ltd', old: 1150, next: 1200, reason: 'Steel price hike' },
  { date: '2025-05-22', supplier: 'Hydraulics Tunis SA', old: 1050, next: 1150, reason: 'Negotiated bulk' },
];

function PageArticleSuppliers({ state }: { state: PurchaseDemoState }) {
  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-5">
      <div id="po-demo-as-title" className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold flex items-center gap-2"><Package className="h-5 w-5 text-primary" /> Hydraulic Cylinder HY-200</h1>
          <p className="text-xs text-muted-foreground">Article <span className="font-mono">ART-HY-200</span> · sourced from 3 suppliers</p>
        </div>
        <div className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-xs font-medium flex items-center gap-1.5 cursor-default">
          <Plus className="h-3.5 w-3.5" /> Link Supplier
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <table className="w-full text-xs">
          <thead><tr className="bg-muted/30 border-b border-border/60">
            <th className="text-left px-3 py-2 text-muted-foreground font-medium">Supplier</th>
            <th className="text-left px-3 py-2 text-muted-foreground font-medium">Supplier Ref</th>
            <th className="text-right px-3 py-2 text-muted-foreground font-medium">Price ({resolveCurrencyCode()})</th>
            <th className="text-right px-3 py-2 text-muted-foreground font-medium">MOQ</th>
            <th className="text-right px-3 py-2 text-muted-foreground font-medium">Lead time</th>
            <th className="text-center px-3 py-2 text-muted-foreground font-medium" id="po-demo-as-preferred">Preferred</th>
            <th className="text-right px-3 py-2 text-muted-foreground font-medium" id="po-demo-as-quick-po">Actions</th>
          </tr></thead>
          <tbody>
            {DEMO_ARTICLE_SUPPLIERS.map(s => {
              const active = state.highlightedSupplierId === s.id;
              const isPreferred = active ? s.id === 'sup-2' : s.preferred;
              return (
                <tr key={s.id} className={`border-b border-border/40 last:border-0 transition-colors ${active ? 'bg-primary/5' : 'hover:bg-muted/20'}`}>
                  <td className="px-3 py-2.5 font-medium">{s.name}</td>
                  <td className="px-3 py-2.5 text-muted-foreground font-mono">{s.ref}</td>
                  <td className="px-3 py-2.5 text-right font-semibold">{fmt(s.price)}</td>
                  <td className="px-3 py-2.5 text-right">{s.moq}</td>
                  <td className="px-3 py-2.5 text-right text-muted-foreground">{s.lead} d</td>
                  <td className="px-3 py-2.5 text-center">
                    {isPreferred
                      ? <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500 inline" />
                      : <Star className="h-3.5 w-3.5 text-muted-foreground/30 inline" />}
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <div className="inline-flex items-center gap-1">
                      <div className="h-6 px-2 rounded border border-border text-px-10 text-muted-foreground flex items-center gap-1 cursor-default">
                        <Plus className="h-2.5 w-2.5" /> PO
                      </div>
                      <div className="h-6 w-6 rounded border border-border flex items-center justify-center text-muted-foreground cursor-default">
                        <Edit className="h-3 w-3" />
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div id="po-demo-as-price-history" className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/60">
          <span className="text-sm font-medium flex items-center gap-1.5"><Activity className="h-3.5 w-3.5 text-primary" /> Price History</span>
          <span className="text-px-10 text-muted-foreground">{DEMO_PRICE_HISTORY.length} changes recorded</span>
        </div>

        {/* Mini chart */}
        <div className="px-4 py-3 bg-muted/20 border-b border-border/60">
          <div className="flex items-end gap-1 h-16">
            {DEMO_PRICE_HISTORY.map((h, i) => {
              const pct = ((h.next - 950) / (1320 - 950)) * 100;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full rounded-t bg-primary/70" style={{ height: `${Math.max(pct, 8)}%` }} />
                </div>
              );
            })}
          </div>
        </div>

        <table className="w-full text-xs">
          <thead><tr className="bg-muted/30 border-b border-border/60">
            <th className="text-left px-3 py-2 text-muted-foreground font-medium">Date</th>
            <th className="text-left px-3 py-2 text-muted-foreground font-medium">Supplier</th>
            <th className="text-right px-3 py-2 text-muted-foreground font-medium">Old</th>
            <th className="text-right px-3 py-2 text-muted-foreground font-medium">New</th>
            <th className="text-right px-3 py-2 text-muted-foreground font-medium">Δ</th>
            <th className="text-left px-3 py-2 text-muted-foreground font-medium">Reason</th>
          </tr></thead>
          <tbody>
            {DEMO_PRICE_HISTORY.map((h, i) => {
              const delta = ((h.next - h.old) / h.old) * 100;
              return (
                <tr key={i} className="border-b border-border/40 last:border-0">
                  <td className="px-3 py-2 text-muted-foreground">{h.date}</td>
                  <td className="px-3 py-2">{h.supplier}</td>
                  <td className="px-3 py-2 text-right text-muted-foreground">{fmt(h.old)}</td>
                  <td className="px-3 py-2 text-right font-medium">{fmt(h.next)}</td>
                  <td className={`px-3 py-2 text-right font-medium ${delta > 0 ? 'text-red-600' : 'text-green-600'}`}>{delta > 0 ? '+' : ''}{delta.toFixed(1)}%</td>
                  <td className="px-3 py-2 text-muted-foreground">{h.reason}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── NEW: Payment + FEL workflow overlay on invoice detail ────────────────────

function PageInvoicePayment({ state }: { state: PurchaseDemoState }) {
  const INV = DEMO_INVOICES[1];
  const paid = state.paymentStep === 2 ? INV.total : 12000;
  const remaining = INV.total - paid;

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-4xl mx-auto relative">
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded border border-border flex items-center justify-center text-muted-foreground text-xs cursor-default">←</div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold">{INV.num}</h1>
            <StatusBadge status={state.paymentStep === 2 ? 'paid' : 'partially_paid'} />
          </div>
          <p className="text-xs text-muted-foreground">{INV.supplier} · {INV.date}</p>
        </div>
        <div id="po-demo-si-record-payment" className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-xs font-medium flex items-center gap-1.5 cursor-default">
          <Banknote className="h-3.5 w-3.5" /> Record Payment
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-lg p-4 space-y-2 text-xs">
          <p className="text-xs font-semibold mb-1">Payment Status</p>
          <div className="flex justify-between"><span className="text-muted-foreground">Grand Total</span><span className="font-medium">{fmt(INV.total)} {resolveCurrencyCode()}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Amount Paid</span><span className="text-green-600 font-medium">{fmt(paid)} {resolveCurrencyCode()}</span></div>
          <div className="flex justify-between border-t border-border pt-2"><span className="text-muted-foreground">Remaining</span><span className={remaining > 0 ? 'text-amber-600 font-semibold' : 'text-green-600 font-semibold'}>{fmt(remaining)} {resolveCurrencyCode()}</span></div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden mt-1">
            <div className="h-full bg-green-500 transition-all" style={{ width: `${(paid / INV.total) * 100}%` }} />
          </div>
        </div>

        <div id="po-demo-si-fel-send" className="bg-card border border-border rounded-lg p-4 space-y-2.5 text-xs">
          <p className="text-xs font-semibold flex items-center gap-1.5"><FileText className="h-3.5 w-3.5 text-blue-500" /> Facture en Ligne</p>
          {state.felSent ? (
            <>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Status</span>
                <span className="text-px-10 text-green-700 bg-green-100 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded-full font-medium inline-flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Sent
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">TTN reference</span>
                <span className="font-mono text-foreground">TTN-0488213</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Sent at</span>
                <span className="text-foreground">2025-06-06 14:32</span>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Status</span>
                <span className="text-px-10 text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full font-medium">Pending</span>
              </div>
              <div className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-xs font-medium flex items-center gap-1.5 cursor-default w-fit">
                <Send className="h-3.5 w-3.5" /> Record F.E.L
              </div>

            </>
          )}
        </div>
      </div>

      <div id="po-demo-si-tej-xml-btn" className="bg-card border border-border rounded-lg p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Code2 className="h-4 w-4 text-purple-500" />
          <div>
            <p className="text-sm font-medium">TEJ XML Export</p>
            <p className="text-xs text-muted-foreground">Generate the official withholding-tax certificate XML for DGI submission.</p>
          </div>
        </div>
        <div className="h-8 px-3 rounded-md border border-border text-xs flex items-center gap-1.5 cursor-default">
          <Download className="h-3.5 w-3.5" /> Download TEJ XML
        </div>
      </div>

      {/* Payment dialog overlay */}
      {state.paymentStep >= 1 && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/70 backdrop-blur-[1px]">
          <div id="po-demo-si-payment-dialog" className="bg-card border border-border rounded-xl shadow-2xl w-[26rem] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Record Payment</h3>
              <X className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-px-10 font-medium text-muted-foreground mb-1">Payment Date</label>
                <div className="h-8 px-2.5 rounded-md border border-border text-foreground flex items-center">2025-06-06</div>
              </div>
              <div>
                <label className="block text-px-10 font-medium text-muted-foreground mb-1">Method</label>
                <div className="h-8 px-2.5 rounded-md border border-border text-foreground flex items-center justify-between">Bank Transfer <ChevronRight className="h-3 w-3 rotate-90 text-muted-foreground" /></div>
              </div>
            </div>
            <div>
              <label className="block text-px-10 font-medium text-muted-foreground mb-1">Amount ({resolveCurrencyCode()})</label>
              <div className={`h-9 px-3 rounded-md border text-sm flex items-center justify-between transition-colors ${state.paymentStep === 2 ? 'border-primary bg-primary/5 text-foreground font-semibold' : 'border-border text-foreground'}`}>
                <span>{state.paymentStep === 2 ? fmt(remaining + 0) : '0'}</span>
                <span className="text-px-10 text-muted-foreground">Max: {fmt(INV.total - 12000)}</span>
              </div>
              <p className="text-px-10 text-muted-foreground mt-1 flex items-center gap-1">
                <AlertCircle className="h-2.5 w-2.5" /> The amount can never exceed the remaining balance.
              </p>

            </div>
            <div className="bg-muted/40 rounded p-2.5 text-px-11 space-y-1">
              <div className="flex justify-between"><span className="text-muted-foreground">After this payment</span><span className="font-medium">{fmt(state.paymentStep === 2 ? INV.total : 12000)} / {fmt(INV.total)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">New status</span>
                <StatusBadge status={state.paymentStep === 2 ? 'paid' : 'partially_paid'} small />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <div className="h-8 px-3 rounded-md border border-border text-xs text-muted-foreground flex items-center cursor-default">Cancel</div>
              <div className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-xs font-medium flex items-center gap-1.5 cursor-default">
                <CheckCircle2 className="h-3.5 w-3.5" /> Confirm
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── NEW: RS rate catalogue ───────────────────────────────────────────────────

const RS_CATALOGUE = [
  { code: 'P1', label: 'Marchés (commandes publiques)',     rate: 1.5,  operation: 'RS1_015000', usage: 'Public-sector contracts and supply orders' },
  { code: 'P2', label: 'Honoraires & commissions',           rate: 5.0,  operation: 'RS1_500000', usage: 'Professional fees, commissions, brokerage' },
  { code: 'P3', label: 'Loyers immobiliers',                 rate: 10.0, operation: 'RS1_100000', usage: 'Real-estate rental paid to residents' },
  { code: 'P4', label: 'Honoraires non-résidents',           rate: 15.0, operation: 'RS1_150000', usage: 'Services from non-resident professionals' },
  { code: 'P5', label: 'Bénéfices non-résidents (sans CDI)', rate: 25.0, operation: 'RS1_250000', usage: 'Non-resident profits without tax treaty' },
];

function PageRsCatalogue() {
  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <Shield className="h-5 w-5 text-amber-500" />
        <div>
          <h1 className="text-lg font-semibold">RS Rate Catalogue</h1>
          <p className="text-xs text-muted-foreground">Tunisian Retenue à la Source — official DGI codes wired into every invoice</p>
        </div>
      </div>

      <div id="po-demo-rs-catalogue-table" className="bg-card border border-border rounded-lg overflow-hidden">
        <table className="w-full text-xs">
          <thead><tr className="bg-muted/30 border-b border-border/60">
            <th id="po-demo-rs-code" className="text-left px-3 py-2 text-muted-foreground font-medium">Code</th>
            <th className="text-left px-3 py-2 text-muted-foreground font-medium">Libellé</th>
            <th id="po-demo-rs-rate" className="text-right px-3 py-2 text-muted-foreground font-medium">Rate</th>
            <th id="po-demo-rs-tej-op" className="text-left px-3 py-2 text-muted-foreground font-medium">TEJ Operation</th>
            <th className="text-left px-3 py-2 text-muted-foreground font-medium">Typical Usage</th>
          </tr></thead>
          <tbody>
            {RS_CATALOGUE.map(r => (
              <tr key={r.code} className="border-b border-border/40 last:border-0 hover:bg-muted/20">
                <td className="px-3 py-2.5"><span className="inline-flex h-6 px-2 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 font-bold text-px-11 items-center">{r.code}</span></td>
                <td className="px-3 py-2.5 font-medium">{r.label}</td>
                <td className="px-3 py-2.5 text-right">
                  <span className="font-mono font-semibold text-foreground">{r.rate.toFixed(1)}%</span>
                </td>
                <td className="px-3 py-2.5 font-mono text-purple-600 dark:text-purple-400 text-px-11">{r.operation}</td>
                <td className="px-3 py-2.5 text-muted-foreground">{r.usage}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div id="po-demo-rs-legacy" className="bg-muted/40 border border-border rounded-lg p-3 text-xs flex items-start gap-2">
        <AlertCircle className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
        <div>
          <p className="font-semibold text-foreground">Legacy codes still accepted.</p>
          <p className="text-muted-foreground mt-0.5">Older numeric codes (10, 05, 03, 20) are mapped automatically to the new P1–P5 catalogue and the matching <span className="font-mono">RS1_xxxxxx</span> operation — your historical invoices keep working.</p>
        </div>
      </div>
    </div>
  );
}

// ─── NEW: Price Evolution ─────────────────────────────────────────────────────

function PagePriceEvolution() {
  // Three series for one article across three suppliers
  const series = [
    { name: 'Machinery Parts Ltd', color: 'bg-blue-500',  points: [1100, 1100, 1150, 1150, 1200, 1200] },
    { name: 'Hydraulics Tunis SA', color: 'bg-green-500', points: [980,  1050, 1050, 1050, 1050, 1150] },
    { name: 'EuroParts Import',    color: 'bg-amber-500', points: [1280, 1280, 1280, 1320, 1320, 1320] },
  ];
  const months = ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'May'];
  const max = 1400, min = 900;

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded border border-border flex items-center justify-center text-muted-foreground text-xs cursor-default">←</div>
        <div>
          <h1 className="text-lg font-semibold flex items-center gap-2"><TrendingUp className="h-5 w-5 text-primary" /> Price Evolution — Hydraulic Cylinder HY-200</h1>
          <p className="text-xs text-muted-foreground">Compare purchase price drift across all linked suppliers</p>
        </div>
      </div>

      {/* Chart */}
      <div id="po-demo-pe-chart" className="bg-card border border-border rounded-lg p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold">Purchase Price ({resolveCurrencyCode()})</p>
          <div className="flex gap-3 text-xs">
            {series.map(s => (
              <div key={s.name} className="flex items-center gap-1.5">
                <span className={`h-2.5 w-2.5 rounded-full ${s.color}`} />
                <span className="text-muted-foreground">{s.name.split(' ')[0]}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="relative h-40 border-l border-b border-border/60 flex items-end">
          {/* Y-axis grid */}
          <div className="absolute inset-0 flex flex-col justify-between py-0 pointer-events-none">
            {[1400, 1200, 1000, 800].map(v => (
              <div key={v} className="flex items-center gap-2 -ml-12 w-12 text-right text-px-9 text-muted-foreground">
                <span className="flex-1">{v}</span>
                <span className="h-px w-1 bg-border" />
              </div>
            ))}
          </div>
          {/* Bars per month, grouped */}
          <div className="flex-1 flex items-end gap-2 h-full pl-1">
            {months.map((m, mi) => (
              <div key={m} className="flex-1 flex flex-col h-full">
                <div className="flex-1 flex items-end justify-center gap-0.5">
                  {series.map(s => {
                    const p = s.points[mi];
                    const pct = ((p - min) / (max - min)) * 100;
                    return <div key={s.name} className={`w-1.5 rounded-t ${s.color}`} style={{ height: `${pct}%` }} />;
                  })}
                </div>
                <span className="text-center text-px-9 text-muted-foreground mt-1">{m}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detail rows */}
      <div id="po-demo-pe-table" className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-border/60 flex items-center justify-between">
          <span className="text-sm font-medium">Recorded Changes</span>
          <span className="text-px-10 text-muted-foreground">5 entries · all-time</span>
        </div>
        <table className="w-full text-xs">
          <thead><tr className="bg-muted/30 border-b border-border/60">
            <th className="text-left px-3 py-2 text-muted-foreground font-medium">Date</th>
            <th className="text-left px-3 py-2 text-muted-foreground font-medium">Supplier</th>
            <th className="text-right px-3 py-2 text-muted-foreground font-medium">Old</th>
            <th className="text-right px-3 py-2 text-muted-foreground font-medium">New</th>
            <th className="text-right px-3 py-2 text-muted-foreground font-medium">Δ</th>
            <th className="text-left px-3 py-2 text-muted-foreground font-medium">Reason</th>
            <th className="text-left px-3 py-2 text-muted-foreground font-medium">By</th>
          </tr></thead>
          <tbody>
            {DEMO_PRICE_HISTORY.map((h, i) => {
              const delta = ((h.next - h.old) / h.old) * 100;
              return (
                <tr key={i} className="border-b border-border/40 last:border-0">
                  <td className="px-3 py-2 text-muted-foreground">{h.date}</td>
                  <td className="px-3 py-2">{h.supplier}</td>
                  <td className="px-3 py-2 text-right text-muted-foreground">{fmt(h.old)}</td>
                  <td className="px-3 py-2 text-right font-medium">{fmt(h.next)}</td>
                  <td className={`px-3 py-2 text-right font-medium ${delta > 0 ? 'text-red-600' : 'text-green-600'}`}>{delta > 0 ? '+' : ''}{delta.toFixed(1)}%</td>
                  <td className="px-3 py-2 text-muted-foreground">{h.reason}</td>
                  <td className="px-3 py-2 text-muted-foreground">Sara M.</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── NEW: Invoice Aging ───────────────────────────────────────────────────────

const AGING_BUCKETS = [
  { name: 'Not due',   count: 4, amount: 38500, color: 'bg-green-500',  text: 'text-green-700' },
  { name: '1–30 d',    count: 3, amount: 24200, color: 'bg-blue-500',   text: 'text-blue-700' },
  { name: '31–60 d',   count: 2, amount: 12800, color: 'bg-amber-500',  text: 'text-amber-700' },
  { name: '61–90 d',   count: 1, amount: 8750,  color: 'bg-orange-500', text: 'text-orange-700' },
  { name: '> 90 d',    count: 1, amount: 5400,  color: 'bg-red-500',    text: 'text-red-700' },
];

const AGING_INVOICES = [
  { num: 'INV-F-2024-118', supplier: 'Office Supplies Co.',  due: '2025-02-28', days: 98, amount: 5400 },
  { num: 'INV-F-2025-002', supplier: 'Machinery Parts Ltd',  due: '2025-04-15', days: 52, amount: 20500 },
  { num: 'INV-F-2025-014', supplier: 'Tech Solutions SA',    due: '2025-04-20', days: 47, amount: 8750 },
  { num: 'INV-F-2025-031', supplier: 'EuroParts Import',     due: '2025-05-22', days: 15, amount: 14200 },
  { num: 'INV-F-2025-040', supplier: 'Fournisseur Alpha SARL', due: '2025-05-30', days: 7, amount: 10000 },
];

function PageInvoiceAging() {
  const total = AGING_BUCKETS.reduce((s, b) => s + b.amount, 0);
  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded border border-border flex items-center justify-center text-muted-foreground text-xs cursor-default">←</div>
        <div>
          <h1 className="text-lg font-semibold flex items-center gap-2"><Clock className="h-5 w-5 text-primary" /> Supplier Invoice Aging</h1>
          <p className="text-xs text-muted-foreground">All open balances bucketed by overdue age</p>
        </div>
      </div>

      <div id="po-demo-aging-buckets" className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {AGING_BUCKETS.map(b => (
          <div key={b.name} className="bg-card border border-border rounded-lg p-3">
            <p className="text-px-10 text-muted-foreground font-medium uppercase">{b.name}</p>
            <p className="text-lg font-bold text-foreground mt-0.5">{fmt(b.amount)}</p>
            <p className="text-px-10 text-muted-foreground">{b.count} invoice{b.count !== 1 ? 's' : ''}</p>
            <div className="h-1 rounded-full bg-muted overflow-hidden mt-2">
              <div className={`h-full ${b.color}`} style={{ width: `${(b.amount / total) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>

      <div className="bg-card border border-border rounded-lg p-4">
        <p className="text-sm font-semibold mb-3">Aging Distribution</p>
        <div className="flex items-end gap-3 h-32">
          {AGING_BUCKETS.map(b => {
            const pct = (b.amount / Math.max(...AGING_BUCKETS.map(x => x.amount))) * 100;
            return (
              <div key={b.name} className="flex-1 flex flex-col items-center gap-1.5">
                <span className={`text-px-10 font-semibold ${b.text}`}>{fmt(b.amount)}</span>
                <div className={`w-full rounded-t ${b.color} transition-all`} style={{ height: `${pct}%` }} />
                <span className="text-px-10 text-muted-foreground">{b.name}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div id="po-demo-aging-table" className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-border/60 flex items-center justify-between">
          <span className="text-sm font-medium">Outstanding Invoices</span>
          <span className="text-px-10 text-muted-foreground">Total {fmt(total)} {resolveCurrencyCode()}</span>
        </div>
        <table className="w-full text-xs">
          <thead><tr className="bg-muted/30 border-b border-border/60">
            <th className="text-left px-3 py-2 text-muted-foreground font-medium">Invoice #</th>
            <th className="text-left px-3 py-2 text-muted-foreground font-medium">Supplier</th>
            <th className="text-left px-3 py-2 text-muted-foreground font-medium">Due Date</th>
            <th className="text-right px-3 py-2 text-muted-foreground font-medium">Days Overdue</th>
            <th className="text-right px-3 py-2 text-muted-foreground font-medium">Outstanding ({resolveCurrencyCode()})</th>
            <th className="text-center px-3 py-2 text-muted-foreground font-medium">Bucket</th>
          </tr></thead>
          <tbody>
            {AGING_INVOICES.map(i => {
              const bucket =
                i.days <= 0  ? AGING_BUCKETS[0] :
                i.days <= 30 ? AGING_BUCKETS[1] :
                i.days <= 60 ? AGING_BUCKETS[2] :
                i.days <= 90 ? AGING_BUCKETS[3] : AGING_BUCKETS[4];
              return (
                <tr key={i.num} className="border-b border-border/40 last:border-0 hover:bg-muted/20">
                  <td className="px-3 py-2.5 font-medium text-primary">{i.num}</td>
                  <td className="px-3 py-2.5">{i.supplier}</td>
                  <td className="px-3 py-2.5 text-muted-foreground">{i.due}</td>
                  <td className={`px-3 py-2.5 text-right font-semibold ${i.days > 60 ? 'text-red-600' : i.days > 30 ? 'text-amber-600' : 'text-muted-foreground'}`}>{i.days}</td>
                  <td className="px-3 py-2.5 text-right font-medium">{fmt(i.amount)}</td>
                  <td className="px-3 py-2.5 text-center">
                    <span className={`inline-block h-2 w-2 rounded-full ${bucket.color}`} />
                    <span className="ml-1.5 text-px-10 text-muted-foreground">{bucket.name}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Main demo component ───────────────────────────────────────────────────────



export function PurchaseAutopilotDemo({ open, onClose }: Props) {
  const { i18n } = useTranslation();
  const [stepIndex, setStepIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(false);
  const [cursor, setCursor] = useState<{ x: number; y: number; clicking: boolean }>({ x: -200, y: -200, clicking: false });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clickRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const finished = stepIndex >= PO_STEPS.length;

  const state: PurchaseDemoState = useMemo(() => {
    let s = initialPurchaseDemoState;
    for (let i = 0; i < Math.min(stepIndex + 1, PO_STEPS.length); i++) s = PO_STEPS[i].apply(s);
    return s;
  }, [stepIndex]);

  const step = PO_STEPS[Math.min(stepIndex, PO_STEPS.length - 1)];
  const demoLang = pickLang(i18n.language);
  const captionText = getCaption(demoLang, Math.min(stepIndex, PO_STEPS.length - 1), step.caption);
  const finishedMsg =
    demoLang === 'fr' ? 'Votre module Achats est prêt — créez votre premier bon de commande.' :
    'Your Purchases module is ready — create your first order.';

  // Reset on open
  useEffect(() => {
    if (open) { setStepIndex(0); setPlaying(true); }
    return () => { if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel(); };
  }, [open]);

  // Warm up voices
  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    const synth = window.speechSynthesis;
    synth.getVoices();
    const onVoices = () => synth.getVoices();
    synth.addEventListener?.('voiceschanged', onVoices);
    return () => synth.removeEventListener?.('voiceschanged', onVoices);
  }, []);

  // Cursor
  useEffect(() => {
    if (!open || finished) return;
    const place = () => {
      const el = document.getElementById(step.target);
      if (!el) return;
      const r = el.getBoundingClientRect();
      setCursor({ x: r.left + Math.min(r.width / 2, 120), y: r.top + Math.min(r.height / 2, 60), clicking: true });
      if (clickRef.current) clearTimeout(clickRef.current);
      clickRef.current = setTimeout(() => setCursor(c => ({ ...c, clicking: false })), 450);
    };
    const t = setTimeout(place, 160);
    return () => clearTimeout(t);
  }, [stepIndex, open, finished, step?.target, state.page, state.activeTab, state.showFilters, state.createFormStep]);

  // Narration + auto-advance
  useEffect(() => {
    if (!open || !playing || finished) return;
    const advance = () => setStepIndex(i => i + 1);
    const caption = captionText;
    const synthSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

    if (!muted && synthSupported && caption) {
      const synth = window.speechSynthesis;
      synth.cancel();
      const { code, bcp47 } = languageTagFor(i18n.language);
      const voice = pickBestVoice(code);
      const chunks = splitForSpeech(caption);

      let advanced = false;
      const doAdvance = () => { if (advanced) return; advanced = true; timerRef.current = setTimeout(advance, 420); };

      chunks.forEach((chunk, idx) => {
        const u = new SpeechSynthesisUtterance(chunk);
        u.lang = bcp47;
        configureUtteranceForFemaleVoice(u, voice);
        if (idx === chunks.length - 1) { u.onend = doAdvance; u.onerror = doAdvance; }
        try { synth.speak(u); } catch { /* safety */ }
      });

      const safetyMs = Math.max(step.duration, caption.length * 110 + 1800);
      const safety = setTimeout(doAdvance, safetyMs);
      const keepAlive = setInterval(() => { if (synth.speaking && !synth.paused) { synth.pause(); synth.resume(); } }, 10000);

      return () => {
        clearTimeout(safety);
        clearInterval(keepAlive);
        if (timerRef.current) clearTimeout(timerRef.current);
        try { synth.cancel(); } catch { /* ignore */ }
      };
    }

    timerRef.current = setTimeout(advance, step.duration);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [stepIndex, open, playing, finished, muted, step, captionText, i18n.language]);

  const restart = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel();
    setStepIndex(0);
    setPlaying(true);
  }, []);
  const togglePlay = useCallback(() => setPlaying(p => !p), []);
  const jumpChapter = useCallback((start: number) => { setStepIndex(start); setPlaying(true); }, []);

  if (!open) return null;

  const activeChapter = PO_CHAPTERS.find(c => stepIndex >= c.start && stepIndex < c.end) || PO_CHAPTERS[PO_CHAPTERS.length - 1];

  return (
    <div className="fixed inset-0 z-[110] bg-background flex flex-col select-none">

      {/* ── Top bar ── */}
      <div className="h-12 shrink-0 border-b border-border/60 bg-card flex items-center px-3 gap-3">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="h-7 w-7 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-sm shrink-0">
            <ShoppingCart className="h-3.5 w-3.5 text-primary-foreground" />
          </span>
          <span className="text-sm font-semibold truncate">Purchases Module — Live Demo</span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={() => setMuted(m => !m)} className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground" title={muted ? 'Unmute' : 'Mute'}>
            {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>
          <button onClick={togglePlay} className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground">
            {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </button>
          <button onClick={restart} className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground" title="Restart">
            <RotateCcw className="h-4 w-4" />
          </button>
          <button onClick={onClose} className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground" title="Close">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ── Sub-nav ── */}
      <DemoSubNav current={state.page} />

      {/* ── Content ── */}
      <div className="flex-1 overflow-y-auto pointer-events-none">
        {state.page === 'dashboard'            && <PageDashboard       state={state} />}
        {state.page === 'orders-list'          && <PageOrdersList      state={state} />}
        {state.page === 'order-create'         && <PageOrderCreate     state={state} />}
        {state.page === 'order-detail'         && <PageOrderDetail     state={state} />}
        {state.page === 'order-pdf-preview'    && <PageOrderPdfPreview />}
        {state.page === 'order-tej-xml'        && <PageOrderTejXml     state={state} />}
        {state.page === 'article-suppliers'    && <PageArticleSuppliers state={state} />}
        {state.page === 'receipts-list'        && <PageReceiptsList    state={state} />}
        {state.page === 'receipt-create'       && <PageReceiptCreate   />}
        {state.page === 'receipt-detail'       && <PageReceiptDetail   />}
        {state.page === 'invoices-list'        && <PageInvoicesList    state={state} />}
        {state.page === 'invoice-create'       && <PageInvoiceCreate   />}
        {state.page === 'invoice-detail'       && <PageInvoiceDetail   />}
        {state.page === 'invoice-payment'      && <PageInvoicePayment  state={state} />}
        {state.page === 'invoice-tej-xml'      && <PageInvoiceTejXml   state={state} />}
        {state.page === 'compliance'           && <PageCompliance      />}
        {state.page === 'rs-catalogue'         && <PageRsCatalogue     />}
        {state.page === 'reports'              && <PageReports         />}
        {state.page === 'supplier-performance' && <PageSupplierPerformance />}
        {state.page === 'price-evolution'      && <PagePriceEvolution  />}
        {state.page === 'invoice-aging'        && <PageInvoiceAging    />}
        {state.page === 'audit-log'            && <PageAuditLog        />}
      </div>

      {/* ── Caption + chapters ── */}
      <div className="shrink-0 border-t border-border/60 bg-card px-4 py-3">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          {PO_CHAPTERS.map(ch => (
            <button
              key={ch.id}
              onClick={() => jumpChapter(ch.start)}
              className={`text-px-10 font-medium px-2 py-0.5 rounded-full transition-colors cursor-pointer
                ${activeChapter.id === ch.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/70'}`}
            >
              {getChapterTitle(demoLang, ch.id, ch.title)}
            </button>
          ))}
          <span className="ml-auto text-px-10 text-muted-foreground">{Math.min(stepIndex + 1, PO_STEPS.length)} / {PO_STEPS.length}</span>
        </div>
        <div className="h-1 rounded-full bg-muted overflow-hidden mb-2">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${(Math.min(stepIndex + 1, PO_STEPS.length) / PO_STEPS.length) * 100}%` }}
          />
        </div>
        <p className="text-sm text-foreground/90 min-h-[20px] flex items-center gap-2">
          <Languages className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
          {finished ? finishedMsg : captionText}
        </p>
      </div>

      {/* ── Virtual cursor ── */}
      {!finished && <DemoCursor x={cursor.x} y={cursor.y} clicking={cursor.clicking} />}

      {/* ── End card ── */}
      {finished && (
        <div className="absolute inset-0 z-[115] flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl shadow-2xl p-6 max-w-sm text-center">
            <div className="h-12 w-12 mx-auto rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center mb-3">
              <ShoppingCart className="h-6 w-6 text-primary-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-1">Full procurement control, out of the box</h3>
            <p className="text-sm text-muted-foreground mb-5">
              Purchase Orders · Goods Receipts · Supplier Invoices · RS, FEL & TEJ compliance · Supplier scorecards — all connected.
            </p>
            <div className="flex flex-col gap-2">
              <button onClick={onClose} className="w-full h-10 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 cursor-pointer">
                Start purchasing
              </button>
              <button onClick={restart} className="w-full h-9 rounded-lg border border-border text-sm font-medium hover:bg-muted/40 inline-flex items-center justify-center gap-1.5 cursor-pointer">
                <RotateCcw className="h-3.5 w-3.5" /> Replay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

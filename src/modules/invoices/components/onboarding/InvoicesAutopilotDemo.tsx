import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  X, Play, Pause, RotateCcw, Volume2, VolumeX, Languages,
  Receipt, Search, Filter, List, Table as TableIcon,
  Plus, CheckCircle2, CircleDollarSign, Wallet, AlertTriangle,
  Building2, FileText, Activity, MoreHorizontal, CalendarIcon,
  ArrowLeft, ExternalLink, Send, Ban, Trash2, RefreshCw, ChevronDown,
} from 'lucide-react';
import { DemoCursor } from '@/modules/external/components/onboarding/DemoCursor';
import { pickBestVoice, splitForSpeech, languageTagFor, configureUtteranceForFemaleVoice } from '@/modules/external/components/onboarding/narrationVoice';
import {
  INV_STEPS, INV_CHAPTERS, initialInvoicesDemoState,
  type InvoicesDemoState,
} from './invoicesDemoScript';
import { pickLang, getCaption, getChapterTitle } from './invoicesDemoTranslations';

interface Props { open: boolean; onClose: () => void; }

const fmt = (n: number) => n.toLocaleString('fr-TN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const DEMO_INVOICES = [
  { id: 1, num: 'INV-2025-018', customer: 'Médina Resorts',  sale: 'SALE-2025-044', total: 18400, due: 0,     status: 'paid'    as const, issue: '02/06/2025', dueDate: '16/06/2025' },
  { id: 2, num: 'INV-2025-017', customer: 'Acme Industries', sale: 'SALE-2025-041', total: 7600,  due: 7600,  status: 'posted'  as const, issue: '28/05/2025', dueDate: '11/06/2025' },
  { id: 3, num: 'INV-2025-016', customer: 'Sahara Foods',    sale: 'SALE-2025-039', total: 9200,  due: 4600,  status: 'posted'  as const, issue: '20/05/2025', dueDate: '03/06/2025' },
  { id: 4, num: '—',            customer: 'Hydro Parts',     sale: 'SALE-2025-046', total: 4200,  due: 4200,  status: 'draft'   as const, issue: '—',          dueDate: '—' },
  { id: 5, num: 'INV-2025-011', customer: 'Coastal Ltd',     sale: 'SALE-2025-030', total: 5100,  due: 5100,  status: 'overdue' as const, issue: '02/05/2025', dueDate: '16/05/2025' },
];

const STATUS_CLS: Record<string, string> = {
  draft:   'bg-muted text-muted-foreground',
  posted:  'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  paid:    'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  void:    'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  overdue: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
};

const STATUS_LABEL: Record<string, string> = {
  draft: 'Draft', posted: 'Posted', paid: 'Paid', void: 'Void', overdue: 'Overdue',
};

function Pill({ s }: { s: string }) {
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-px-10 font-medium ${STATUS_CLS[s] ?? 'bg-muted text-muted-foreground'}`}>
      {STATUS_LABEL[s] ?? s}
    </span>
  );
}

// ─── Stat card (mirrors real Card + gradient-card, icon+label left, value right) ─

function StatCard({
  id, icon, label, value, colorVar, active,
}: { id: string; icon: React.ReactNode; label: string; value: string; colorVar: string; active?: boolean }) {
  return (
    <div
      id={id}
      className={`rounded-xl border-0 shadow-card gradient-card p-3 cursor-default transition-all ${active ? 'ring-2 ring-primary bg-primary/5' : ''}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className={`p-2 rounded-lg flex-shrink-0 ${active ? 'bg-primary/20 text-primary' : `${colorVar}`}`}>
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground font-medium truncate">{label}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold text-foreground">{value}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Page: list ──────────────────────────────────────────────────────────────

function PageList({ state }: { state: InvoicesDemoState }) {
  return (
    <div className="flex flex-col">
      {/* Desktop header — mirrors InvoicesPage */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-card/50 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10"><Receipt className="h-6 w-6 text-primary" /></div>
          <div>
            <h1 id="inv-demo-title" className="text-xl font-semibold text-foreground">Invoices</h1>
            <p className="text-px-11 text-muted-foreground">Track every customer invoice, what is paid, and what is still due.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-8 px-3 rounded-md border border-border text-xs inline-flex items-center gap-1.5 text-muted-foreground">
            <Play className="h-3.5 w-3.5" /> Watch Demo
          </div>
          <div id="inv-demo-new-from-sale" className="h-9 px-3 rounded-md bg-primary text-white text-xs font-medium inline-flex items-center gap-1.5 shadow-medium">
            <Plus className="h-4 w-4" /> New from sale
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="p-4 border-b border-border">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          <StatCard id="inv-demo-stat-invoiced"    icon={<CircleDollarSign className="h-4 w-4 text-chart-1" />} colorVar="bg-chart-1/10" label="Total invoiced" value="184 300 TND" active={state.selectedStat === 'all'} />
          <StatCard id="inv-demo-stat-outstanding" icon={<Wallet className="h-4 w-4 text-chart-2" />}          colorVar="bg-chart-2/10" label="Outstanding"    value="21 500 TND"  active={state.selectedStat === 'posted'} />
          <StatCard id="inv-demo-stat-paid"        icon={<CheckCircle2 className="h-4 w-4 text-chart-3" />}    colorVar="bg-chart-3/10" label="Paid"           value="162 800 TND" active={state.selectedStat === 'paid'} />
          <StatCard id="inv-demo-stat-overdue"     icon={<AlertTriangle className="h-4 w-4 text-chart-4" />}   colorVar="bg-chart-4/10" label="Overdue"        value="2"           active={state.selectedStat === 'overdue'} />
        </div>
      </div>

      {/* Search + view mode */}
      <div className="p-4 border-b border-border bg-card">
        <div className="flex gap-3 items-center">
          <div id="inv-demo-search" className={`relative flex-1 ${state.searchActive ? 'ring-2 ring-primary rounded-md' : ''}`}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <div className="h-9 pl-9 pr-3 rounded-md border border-border bg-background text-sm text-muted-foreground flex items-center">
              {state.searchActive ? 'médina' : 'Search by number, title or notes…'}
            </div>
          </div>
          <div id="inv-demo-filters" className={`h-9 px-3 rounded-md border text-sm inline-flex items-center gap-2 cursor-default ${state.showFilters ? 'border-primary text-primary bg-primary/5' : 'border-border text-foreground'}`}>
            <Filter className="h-4 w-4" /> Filters
            {state.showFilters && <span className="ml-1 h-4 px-1 rounded-full bg-secondary text-secondary-foreground text-px-10">2</span>}
          </div>
          <div id="inv-demo-views" className="flex items-center gap-2 shrink-0">
            <div className={`h-9 w-9 rounded-md border inline-flex items-center justify-center cursor-default ${state.listView === 'list' ? 'bg-primary text-white border-primary' : 'border-border text-foreground'}`}>
              <List className="h-4 w-4" />
            </div>
            <div className={`h-9 w-9 rounded-md border inline-flex items-center justify-center cursor-default ${state.listView === 'table' ? 'bg-primary text-white border-primary' : 'border-border text-foreground'}`}>
              <TableIcon className="h-4 w-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Filter panel (grid with Status Select + date pickers + Clear) */}
      {state.showFilters && (
        <div className="p-4 border-b border-border bg-card">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Status</label>
              <div className="h-9 rounded-md border border-border bg-background px-3 text-sm flex items-center justify-between text-foreground">
                Posted <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">From date</label>
              <div className="h-9 rounded-md border border-border bg-background px-3 text-sm flex items-center gap-2 text-foreground">
                <CalendarIcon className="h-4 w-4 text-muted-foreground" /> May 01, 2025
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">To date</label>
              <div className="h-9 rounded-md border border-border bg-background px-3 text-sm flex items-center gap-2 text-foreground">
                <CalendarIcon className="h-4 w-4 text-muted-foreground" /> Jun 30, 2025
              </div>
            </div>
            <div className="flex items-end">
              <div className="h-9 px-2 text-sm text-muted-foreground inline-flex items-center gap-1">
                <X className="h-4 w-4" /> Clear filters
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        <div className="border-0 shadow-card rounded-xl bg-card overflow-hidden">
          {state.listView === 'table' ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs min-w-[720px]">
                <thead>
                  <tr className="border-b border-border/60 bg-muted/30">
                    <th className="text-left px-3 py-2 text-muted-foreground font-medium">Number</th>
                    <th className="text-left px-3 py-2 text-muted-foreground font-medium">Contact</th>
                    <th className="text-left px-3 py-2 text-muted-foreground font-medium">Sale</th>
                    <th className="text-left px-3 py-2 text-muted-foreground font-medium">Issue date</th>
                    <th className="text-left px-3 py-2 text-muted-foreground font-medium">Due date</th>
                    <th className="text-right px-3 py-2 text-muted-foreground font-medium">Total</th>
                    <th className="text-right px-3 py-2 text-muted-foreground font-medium">Due</th>
                    <th className="text-left px-3 py-2 text-muted-foreground font-medium">Status</th>
                    <th className="w-10 px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {DEMO_INVOICES.map((inv) => (
                    <tr key={inv.id} className="border-b border-border/40 last:border-0 hover:bg-muted/50">
                      <td className="px-3 py-2.5">
                        <span className="inline-flex items-center gap-2 font-medium">
                          <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                          {inv.num}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">{inv.customer}</td>
                      <td className="px-3 py-2.5 text-primary">{inv.sale}</td>
                      <td className="px-3 py-2.5">{inv.issue}</td>
                      <td className="px-3 py-2.5">{inv.dueDate}</td>
                      <td className="px-3 py-2.5 text-right">{fmt(inv.total)} TND</td>
                      <td className="px-3 py-2.5 text-right">{inv.due > 0 ? `${fmt(inv.due)} TND` : '—'}</td>
                      <td className="px-3 py-2.5"><Pill s={inv.status} /></td>
                      <td className="px-3 py-2.5">
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground"><MoreHorizontal className="h-3.5 w-3.5" /></span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {DEMO_INVOICES.map((inv) => (
                <div key={inv.id} className="p-3">
                  <div className="flex items-start gap-3 mb-2">
                    <div className="h-8 w-8 rounded-md bg-primary/10 text-primary inline-flex items-center justify-center mt-0.5 shrink-0">
                      <Receipt className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold flex-1">{inv.num}</p>
                        <Pill s={inv.status} />
                      </div>
                      <p className="text-xs text-muted-foreground">{inv.customer} · Sale {inv.sale}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pl-[44px] mb-2 text-px-11 text-muted-foreground">
                    <div className="inline-flex items-center gap-1"><CalendarIcon className="h-3 w-3" />{inv.issue}</div>
                    <div><span>Due date:</span> {inv.dueDate}</div>
                  </div>
                  <div className="flex items-center justify-between pl-[44px]">
                    <span className="text-sm font-semibold">{fmt(inv.total)} TND{inv.due > 0 && <span className="ml-2 text-xs text-muted-foreground font-normal">· Due: {fmt(inv.due)} TND</span>}</span>
                    <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Create-from-sale dialog overlay ─────────────────────────────────────────

function CreateDialog({ state }: { state: InvoicesDemoState }) {
  if (!state.createStep) return null;
  const sales = [
    { id: 44, num: 'SALE-2025-046', title: 'AC installation — showroom',    c: 'Hydro Parts' },
    { id: 45, num: 'SALE-2025-047', title: 'Bulk order — dry season',       c: 'Médina Resorts' },
    { id: 46, num: 'SALE-2025-048', title: 'Consulting hours — audit Q2',   c: 'Sahara Foods' },
  ];
  return (
    <div className="absolute inset-0 z-[6] flex items-center justify-center bg-background/60">
      <div className="w-[520px] bg-card border border-border rounded-lg shadow-2xl p-6">
        <p className="text-lg font-semibold mb-4">Create invoice from sale</p>
        <div className="relative mb-3">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <div className="h-9 pl-9 pr-3 rounded-md border border-border bg-background text-sm text-muted-foreground flex items-center">
            Search sales by number, title or contact…
          </div>
        </div>
        <p className="text-sm font-medium mb-2">Pick a sale</p>
        <div id="inv-demo-pick-sale" className="space-y-2 max-h-80 overflow-y-auto">
          {sales.map((s, i) => {
            const picked = state.createStep >= 2 && i === 0;
            return (
              <div key={s.id} className={`flex items-center space-x-2 border rounded-md p-2 ${picked ? 'border-primary bg-primary/5' : 'border-border'}`}>
                <span className={`h-4 w-4 rounded-full border-2 inline-flex items-center justify-center shrink-0 ${picked ? 'border-primary' : 'border-border'}`}>
                  {picked && <span className="h-2 w-2 rounded-full bg-primary" />}
                </span>
                <div className="flex-1 min-w-0 text-sm">
                  <div className="font-medium">{s.num} — {s.title}</div>
                  <div className="text-xs text-muted-foreground inline-flex items-center gap-1"><Building2 className="h-3 w-3" />{s.c}</div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <div className="h-9 px-4 rounded-md border border-border text-sm flex items-center text-foreground">Cancel</div>
          <div id="inv-demo-confirm-create" className={`h-9 px-4 rounded-md text-sm font-medium inline-flex items-center ${state.createStep >= 2 ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
            Create draft
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Page: detail ────────────────────────────────────────────────────────────

function PageDetail({ state }: { state: InvoicesDemoState }) {
  const I = DEMO_INVOICES[0];
  const currentStatus = state.statusStage === 2 ? 'paid' : state.statusStage === 1 ? 'posted' : 'draft';
  const numberLabel = state.statusStage === 0 ? 'Draft (no number yet)' : I.num;

  return (
    <div className="flex flex-col">
      {/* Header — mirrors InvoiceDetailPage */}
      <div id="inv-demo-detail-header" className="flex items-center justify-between gap-2 p-4 border-b border-border bg-card/50 backdrop-blur">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="h-8 px-2 rounded-md text-muted-foreground inline-flex items-center gap-1 text-xs">
            <ArrowLeft className="h-4 w-4" /> Back to invoices
          </div>
          <div className="p-2 rounded-lg bg-primary/10 shrink-0">
            <Receipt className="h-6 w-6 text-primary" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <h1 className="text-xl font-semibold truncate">{numberLabel}</h1>
              <span id="inv-demo-status-badge"><Pill s={currentStatus} /></span>
            </div>
            <p className="text-px-11 text-muted-foreground truncate">AC installation — Médina Resorts summer refit</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2 shrink-0">
          <div id="inv-demo-pdf" className="h-8 px-3 rounded-md border border-border text-xs inline-flex items-center gap-1.5 text-foreground">
            <FileText className="h-4 w-4" /> Download PDF
          </div>
          {state.statusStage === 0 && (
            <div id="inv-demo-action-post" className="h-8 px-3 rounded-md bg-primary text-white text-xs font-medium inline-flex items-center gap-1.5 shadow-medium">
              <Send className="h-4 w-4" /> Post
            </div>
          )}
          {(state.statusStage === 1 || state.statusStage === 2) && (
            <div className="h-8 px-3 rounded-md border border-border text-xs inline-flex items-center gap-1.5 text-destructive">
              <Ban className="h-4 w-4" /> Void
            </div>
          )}
          {state.statusStage === 0 && (
            <div className="h-8 px-3 rounded-md border border-border text-xs inline-flex items-center gap-1.5 text-destructive">
              <Trash2 className="h-4 w-4" /> Delete
            </div>
          )}
          <div className="h-8 px-3 rounded-md border border-border text-xs inline-flex items-center gap-1.5 text-foreground">
            <ExternalLink className="h-4 w-4" /> Open sale
          </div>
        </div>
      </div>

      <div className="p-4 md:p-6 space-y-4">
        {/* Main grid: lines/details (2 cols) + summary (1 col) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bg-card rounded-xl shadow-card border-0 p-6 space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div><div className="text-muted-foreground">Issue date</div><div>{state.statusStage === 0 ? '—' : '02/06/2025'}</div></div>
              <div><div className="text-muted-foreground">Due date</div><div>{state.statusStage === 0 ? '—' : '16/06/2025'}</div></div>
              <div><div className="text-muted-foreground">Contact</div><div>{I.customer}</div></div>
              <div><div className="text-muted-foreground">Sale</div><div className="text-primary">{I.sale}</div></div>
            </div>
            <div className="border-t border-border" />
            <div id="inv-demo-lines">
              <h4 className="text-sm font-medium mb-2">Lines</h4>
              <div className="overflow-x-auto border border-border rounded-md">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/30 border-b border-border/60">
                      <th className="text-left px-3 py-2 text-muted-foreground font-medium">Item</th>
                      <th className="text-right px-3 py-2 text-muted-foreground font-medium">Qty</th>
                      <th className="text-right px-3 py-2 text-muted-foreground font-medium">Unit price</th>
                      <th className="text-right px-3 py-2 text-muted-foreground font-medium">Line total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['Split AC unit 24000 BTU', '6', '2,100', '12,600'],
                      ['On-site installation',    '1', '3,400', '3,400'],
                    ].map(r => (
                      <tr key={r[0]} className="border-b border-border/40 last:border-0">
                        <td className="px-3 py-2">{r[0]}</td>
                        <td className="px-3 py-2 text-right">{r[1]}</td>
                        <td className="px-3 py-2 text-right">{r[2]} TND</td>
                        <td className="px-3 py-2 text-right font-medium">{r[3]} TND</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div id="inv-demo-summary" className="bg-card rounded-xl shadow-card border-0 p-6 space-y-2 text-sm h-fit">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>16,000 TND</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Tax</span><span>2,400 TND</span></div>
            <div className="border-t border-border" />
            <div className="flex justify-between font-semibold text-base"><span>Total</span><span>18,400 TND</span></div>
            <div className="flex justify-between text-green-700 dark:text-green-400"><span>Paid</span><span>{state.statusStage === 2 ? '18,400 TND' : '0 TND'}</span></div>
            <div className="flex justify-between text-amber-700 dark:text-amber-400"><span>Due</span><span>{state.statusStage === 2 ? '0 TND' : '18,400 TND'}</span></div>
          </div>
        </div>

        {/* Tabs card: Payments / Activity (mirrors real detail) */}
        <div className="bg-card rounded-xl shadow-card border-0 p-6">
          <div className="inline-flex items-center gap-1 rounded-md bg-muted p-1 mb-4">
            <div id="inv-demo-tab-payments" className={`px-3 py-1.5 text-sm font-medium rounded ${state.activeTab === 'payments' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'}`}>Payments</div>
            <div id="inv-demo-tab-activity" className={`px-3 py-1.5 text-sm font-medium rounded ${state.activeTab === 'activity' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'}`}>Activity</div>
          </div>

          {(state.activeTab === 'payments' || state.activeTab === 'lines') && (
            <div className="space-y-3">
              {state.statusStage >= 1 && (
                <div className="flex flex-wrap gap-2 justify-end">
                  {state.statusStage === 1 && (
                    <div className="h-8 px-3 rounded-md border border-border text-xs inline-flex items-center gap-1.5 text-foreground">
                      <CheckCircle2 className="h-4 w-4" /> Mark as paid
                    </div>
                  )}
                  {state.statusStage === 2 && (
                    <div className="h-8 px-3 rounded-md border border-border text-xs inline-flex items-center gap-1.5 text-foreground">
                      <RefreshCw className="h-4 w-4" /> Reopen
                    </div>
                  )}
                  <div className="h-8 px-3 rounded-md border border-border text-xs inline-flex items-center gap-1.5 text-destructive">
                    <Ban className="h-4 w-4" /> Void
                  </div>
                </div>
              )}
              <div className="border border-dashed border-border rounded-md p-6 text-center text-sm text-muted-foreground">
                {state.statusStage === 2 ? (
                  <div className="flex items-center justify-between text-left">
                    <div className="inline-flex items-center gap-2 text-foreground">
                      <Wallet className="h-4 w-4 text-primary" />
                      <div>
                        <div>Bank transfer · TRX-88213</div>
                        <div className="text-xs text-muted-foreground">15/06/2025</div>
                      </div>
                    </div>
                    <span className="font-semibold text-emerald-600">18,400 TND</span>
                  </div>
                ) : (
                  'No payment recorded yet. Paid and Due update automatically as payments come in.'
                )}
              </div>
            </div>
          )}

          {state.activeTab === 'activity' && (
            <div className="space-y-3">
              {[
                state.statusStage === 2 && { type: 'manual_marked_paid', label: 'Marked as paid (manual)', when: 'Jun 15, 2025, 09:12', who: 'Ahmed B.', desc: 'Cash received in full at counter.', cls: 'text-green-600 bg-green-100 dark:bg-green-900/40', Icon: CheckCircle2 },
                state.statusStage >= 1 && { type: 'posted', label: 'Posted', when: 'Jun 02, 2025, 14:22', who: 'Ahmed B.', desc: 'Number assigned INV-2025-018 · totals frozen', cls: 'text-indigo-600 bg-indigo-100 dark:bg-indigo-900/40', Icon: Send },
                { type: 'created_from_sale', label: 'Created from sale', when: 'Jun 02, 2025, 14:20', who: 'Ahmed B.', desc: 'Draft snapshotted from SALE-2025-044', cls: 'text-blue-600 bg-blue-100 dark:bg-blue-900/40', Icon: Plus },
              ].filter(Boolean).map((a: any, i) => (
                <div key={i} className="bg-card border-0 shadow-card rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 ${a.cls}`}>
                      <a.Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center rounded-md bg-secondary text-secondary-foreground text-xs font-medium px-2 py-0.5">{a.label}</span>
                        <span className="text-xs text-muted-foreground">{a.when}</span>
                        <span className="text-xs text-muted-foreground">· by {a.who}</span>
                      </div>
                      <p className="text-sm mt-1 text-foreground">{a.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Memo dialog (mark-paid / void / reopen) ─────────────────────────────────

function MemoDialog({ state }: { state: InvoicesDemoState }) {
  if (!state.memoOpen) return null;
  const kind = state.memoOpen;
  const meta =
    kind === 'mark-paid' ? { title: 'Mark this invoice as paid?', body: 'Use this only when full settlement was received outside the payments module. A memo is required.', label: 'Memo', confirm: 'Mark as paid' } :
    kind === 'void'      ? { title: 'Void this invoice?',         body: 'This cannot be undone. A reason is required and will be saved to the audit trail.',                label: 'Reason', confirm: 'Void' } :
                           { title: 'Reopen this invoice?',       body: 'The invoice will move back to Posted status. A memo is required.',                                  label: 'Memo', confirm: 'Reopen' };
  return (
    <div className="absolute inset-0 z-[6] flex items-center justify-center bg-background/60">
      <div id="inv-demo-memo" className="w-[460px] bg-card border border-border rounded-lg shadow-2xl p-6">
        <p className="text-lg font-semibold mb-1">{meta.title}</p>
        <p className="text-sm text-muted-foreground mb-4">{meta.body}</p>
        <label className="block text-sm font-medium mb-1.5">{meta.label} <span className="text-destructive">*</span></label>
        <div className="min-h-[80px] rounded-md border border-input bg-background text-sm p-3 text-foreground">{state.memoText || '…'}</div>
        <p className="text-px-11 text-muted-foreground mt-2 inline-flex items-center gap-1"><Activity className="h-3 w-3" /> Persisted to the audit trail.</p>
        <div className="flex justify-end gap-2 mt-4">
          <div className="h-9 px-4 rounded-md border border-border text-sm flex items-center text-foreground">Cancel</div>
          <div id="inv-demo-memo-confirm" className={`h-9 px-4 rounded-md text-sm font-medium inline-flex items-center ${kind === 'void' ? 'bg-destructive text-destructive-foreground' : 'bg-primary text-white'}`}>
            {meta.confirm}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── PDF preview overlay ─────────────────────────────────────────────────────

function PdfPreview({ state }: { state: InvoicesDemoState }) {
  if (!state.pdfOpen) return null;
  return (
    <div className="absolute inset-0 z-[6] flex items-center justify-center bg-background/70 p-6">
      <div id="inv-demo-pdf-download" className="w-80 bg-white text-black rounded-lg shadow-2xl border border-border overflow-hidden">
        <div className="bg-primary/90 text-white p-3">
          <div className="text-sm font-bold">INVOICE · INV-2025-018</div>
          <div className="text-px-9 opacity-90">Flowentra SARL · MF 0000000/A/M/000</div>
        </div>
        <div className="p-3 text-px-9 space-y-2">
          <div className="flex justify-between">
            <div>
              <div className="font-semibold">Customer Information</div>
              <div>Médina Resorts</div>
              <div>MF 1234567/A/M/000</div>
            </div>
            <div className="text-right">
              <div className="font-semibold">Invoice Details</div>
              <div>Issue 02/06/2025</div>
              <div>Due 16/06/2025</div>
              <div>Sale ref SALE-2025-044</div>
            </div>
          </div>
          <table className="w-full">
            <thead><tr className="border-b border-gray-300"><th className="text-left py-0.5">Description</th><th className="text-right">Total</th></tr></thead>
            <tbody>
              <tr><td className="py-0.5">Split AC unit ×6</td><td className="text-right">12,600</td></tr>
              <tr><td className="py-0.5">Installation</td><td className="text-right">3,400</td></tr>
            </tbody>
          </table>
          <div className="text-right space-y-0.5 border-t border-gray-300 pt-1">
            <div>Subtotal 16,000 · Tax 19% 2,400</div>
            <div className="font-bold text-px-11">Total 18,400 TND</div>
          </div>
          <div className="rounded border border-gray-300 p-1.5 mt-1">
            <div className="font-semibold text-px-10 mb-0.5">Payment Summary</div>
            <div className="flex justify-between"><span>Paid</span><span className="text-emerald-700 font-semibold">18,400 TND</span></div>
            <div className="flex justify-between"><span>Amount due</span><span className="font-semibold">0 TND</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main shell ──────────────────────────────────────────────────────────────

export function InvoicesAutopilotDemo({ open, onClose }: Props) {
  const { i18n } = useTranslation();
  const [stepIndex, setStepIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(false);
  const [cursor, setCursor] = useState<{ x: number; y: number; clicking: boolean }>({ x: -200, y: -200, clicking: false });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clickRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const finished = stepIndex >= INV_STEPS.length;
  const state: InvoicesDemoState = useMemo(() => {
    let s = initialInvoicesDemoState;
    for (let i = 0; i < Math.min(stepIndex + 1, INV_STEPS.length); i++) s = INV_STEPS[i].apply(s);
    return s;
  }, [stepIndex]);

  const step = INV_STEPS[Math.min(stepIndex, INV_STEPS.length - 1)];
  const demoLang = pickLang(i18n.language);
  const captionText = getCaption(demoLang, Math.min(stepIndex, INV_STEPS.length - 1), step.caption);
  const finishedMsg =
    demoLang === 'fr' ? 'Votre module Factures est prêt — facturez votre première vente.' :
    'Your Invoices module is ready — invoice your first sale.';

  useEffect(() => {
    if (open) { setStepIndex(0); setPlaying(true); }
    return () => { if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel(); };
  }, [open]);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    const synth = window.speechSynthesis; synth.getVoices();
    const onVoices = () => synth.getVoices(); synth.addEventListener?.('voiceschanged', onVoices);
    return () => synth.removeEventListener?.('voiceschanged', onVoices);
  }, []);

  useEffect(() => {
    if (!open || finished) return;
    const place = () => {
      const el = document.getElementById(step.target);
      if (!el) return;
      const r = el.getBoundingClientRect();
      setCursor({ x: r.left + Math.min(r.width / 2, 120), y: r.top + Math.min(r.height / 2, 40), clicking: true });
      if (clickRef.current) clearTimeout(clickRef.current);
      clickRef.current = setTimeout(() => setCursor(c => ({ ...c, clicking: false })), 450);
    };
    const t = setTimeout(place, 160); return () => clearTimeout(t);
  }, [stepIndex, open, finished, step?.target, state.page, state.activeTab, state.listView, state.showFilters, state.createStep, state.memoOpen, state.pdfOpen, state.statusStage]);

  useEffect(() => {
    if (!open || !playing || finished) return;
    const advance = () => setStepIndex(i => i + 1);
    const caption = captionText;
    const synthSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;
    if (!muted && synthSupported && caption) {
      const synth = window.speechSynthesis; synth.cancel();
      const { bcp47 } = languageTagFor(i18n.language);
      const voice = pickBestVoice(demoLang);
      const chunks = splitForSpeech(caption);
      let advanced = false;
      const doAdvance = () => { if (advanced) return; advanced = true; timerRef.current = setTimeout(advance, 420); };
      chunks.forEach((chunk, idx) => {
        const u = new SpeechSynthesisUtterance(chunk);
        u.lang = bcp47;
        configureUtteranceForFemaleVoice(u, voice);
        if (idx === chunks.length - 1) { u.onend = doAdvance; u.onerror = doAdvance; }
        try { synth.speak(u); } catch { /* */ }
      });
      const safetyMs = Math.max(step.duration, caption.length * 110 + 1800);
      const safety = setTimeout(doAdvance, safetyMs);
      const keepAlive = setInterval(() => { if (synth.speaking && !synth.paused) { synth.pause(); synth.resume(); } }, 10000);
      return () => { clearTimeout(safety); clearInterval(keepAlive); if (timerRef.current) clearTimeout(timerRef.current); try { synth.cancel(); } catch { /* */ } };
    }
    timerRef.current = setTimeout(advance, step.duration);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [stepIndex, open, playing, finished, muted, step, captionText, i18n.language, demoLang]);

  const restart = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel();
    setStepIndex(0); setPlaying(true);
  }, []);
  const togglePlay = useCallback(() => setPlaying(p => !p), []);
  const jumpChapter = useCallback((start: number) => { setStepIndex(start); setPlaying(true); }, []);

  if (!open) return null;
  const activeChapter = INV_CHAPTERS.find(c => stepIndex >= c.start && stepIndex < c.end) || INV_CHAPTERS[INV_CHAPTERS.length - 1];

  return (
    <div className="fixed inset-0 z-[110] bg-background flex flex-col select-none">
      {/* Toolbar */}
      <div className="h-12 shrink-0 border-b border-border/60 bg-card flex items-center px-3 gap-3">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="h-7 w-7 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-sm shrink-0">
            <Receipt className="h-3.5 w-3.5 text-primary-foreground" />
          </span>
          <span className="text-sm font-semibold truncate">Invoices — Live Demo</span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={() => setMuted(m => !m)} className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground" title={muted ? 'Unmute' : 'Mute'}>{muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}</button>
          <button onClick={togglePlay} className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground">{playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}</button>
          <button onClick={restart} className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground" title="Restart"><RotateCcw className="h-4 w-4" /></button>
          <button onClick={onClose} className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground" title="Close"><X className="h-4 w-4" /></button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto pointer-events-none relative">
        {state.page === 'list'   && <PageList   state={state} />}
        {state.page === 'detail' && <PageDetail state={state} />}
        <CreateDialog state={state} />
        <MemoDialog state={state} />
        <PdfPreview state={state} />
      </div>

      {/* Chapter footer */}
      <div className="shrink-0 border-t border-border/60 bg-card px-4 py-3">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          {INV_CHAPTERS.map(ch => (
            <button
              key={ch.id}
              onClick={() => jumpChapter(ch.start)}
              className={`text-px-10 font-medium px-2 py-0.5 rounded-full transition-colors cursor-pointer ${activeChapter.id === ch.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/70'}`}
            >
              {getChapterTitle(demoLang, ch.id, ch.title)}
            </button>
          ))}
          <span className="ml-auto text-px-10 text-muted-foreground">{Math.min(stepIndex + 1, INV_STEPS.length)} / {INV_STEPS.length}</span>
        </div>
        <div className="h-1 rounded-full bg-muted overflow-hidden mb-2">
          <div className="h-full bg-primary transition-all duration-300" style={{ width: `${(Math.min(stepIndex + 1, INV_STEPS.length) / INV_STEPS.length) * 100}%` }} />
        </div>
        <p className="text-sm text-foreground/90 min-h-[20px] flex items-center gap-2">
          <Languages className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
          {finished ? finishedMsg : captionText}
        </p>
      </div>

      {!finished && <DemoCursor x={cursor.x} y={cursor.y} clicking={cursor.clicking} />}

      {finished && (
        <div className="absolute inset-0 z-[115] flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl shadow-2xl p-6 max-w-sm text-center">
            <div className="h-12 w-12 mx-auto rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center mb-3">
              <Receipt className="h-6 w-6 text-primary-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-1">Invoice, collect, close</h3>
            <p className="text-sm text-muted-foreground mb-5">
              KPI-driven receivables · Draft from any sale · Audited memos on every status change · Branded PDF with payment summary.
            </p>
            <div className="flex gap-2 justify-center">
              <button onClick={restart} className="h-9 px-4 rounded-md border border-border text-sm hover:bg-muted inline-flex items-center gap-1.5"><RotateCcw className="h-3.5 w-3.5" /> Replay</button>
              <button onClick={onClose} className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default InvoicesAutopilotDemo;

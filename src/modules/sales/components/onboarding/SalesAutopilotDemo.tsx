import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  X, Play, Pause, RotateCcw, Volume2, VolumeX, Languages,
  ShoppingCart, Search, Filter, List, Table as TableIcon, Map,
  Plus, Send, DollarSign, TrendingUp, CheckCircle2, Building2, User,
  Calendar, StickyNote, ListChecks, Paperclip, Activity, ChevronRight, ChevronDown,
  Palette, Wrench, Mail, FileText, MoreHorizontal, Eye, Edit, Trash2,
  CreditCard, Banknote, Landmark, Receipt, Ban, MapPin,
} from 'lucide-react';
import { DemoCursor } from '@/modules/external/components/onboarding/DemoCursor';
import { pickBestVoice, splitForSpeech, languageTagFor, configureUtteranceForFemaleVoice } from '@/modules/external/components/onboarding/narrationVoice';
import {
  SA_STEPS, SA_CHAPTERS, initialSalesDemoState,
  type SalesDemoState,
} from './salesDemoScript';
import { pickLang, getCaption, getChapterTitle } from './salesDemoTranslations';

interface Props { open: boolean; onClose: () => void; }

const fmt = (n: number) => n.toLocaleString('fr-TN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const DEMO_SALES = [
  { id: 's1', num: 'INV-2025-044', title: 'AC System — Médina',   customer: 'Médina Resorts',   company: 'Médina Resorts SA',  offer: 'OFF-2025-031', amount: 18400, status: 'invoiced' },
  { id: 's2', num: 'INV-2025-051', title: 'Pump Install',         customer: 'Sami Bouazizi',    company: 'Acme Industries',    offer: 'OFF-2025-036', amount: 7600,  status: 'in_progress' },
  { id: 's3', num: 'INV-2025-052', title: 'Maintenance Q3',       customer: 'Fatma Trabelsi',   company: 'Sahara Foods',       offer: '—',             amount: 9200,  status: 'created' },
  { id: 's4', num: 'INV-2025-040', title: 'Lighting Retrofit',    customer: 'Karim Haddad',     company: 'Hydro Parts',        offer: 'OFF-2025-025', amount: 4200,  status: 'closed' },
  { id: 's5', num: 'INV-2025-038', title: 'Cold Room Upgrade',    customer: 'Médina Resorts',   company: 'Médina Resorts SA',  offer: 'OFF-2025-022', amount: 31500, status: 'partially_invoiced' },
];

const STATUS_CLS: Record<string, string> = {
  created:            'bg-muted text-muted-foreground',
  in_progress:        'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  invoiced:           'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  partially_invoiced: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  closed:             'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  cancelled:          'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};
function Pill({ s }: { s: string }) {
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-px-10 font-medium capitalize ${STATUS_CLS[s] ?? 'bg-muted text-muted-foreground'}`}>{s.replace(/_/g, ' ')}</span>;
}
const initials = (n: string) => n.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);


// ─── Page: list ─────────────────────────────────────────────────────────────

function StatCard({ id, icon, label, value, active }: { id: string; icon: React.ReactNode; label: string; value: string; active?: boolean }) {
  return (
    <div id={id} className={`rounded-lg p-3 border cursor-default transition-all ${active ? 'border-2 border-primary bg-primary/5' : 'border-border bg-card'}`}>
      <div className="flex items-center gap-2.5">
        <span className={`p-2 rounded-lg ${active ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>{icon}</span>
        <div className="min-w-0"><p className="text-px-11 text-muted-foreground font-medium truncate">{label}</p><p className="text-sm font-bold">{value}</p></div>
      </div>
    </div>
  );
}

function PageList({ state }: { state: SalesDemoState }) {
  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-border bg-card/50">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10"><TrendingUp className="h-6 w-6 text-primary" /></div>
          <div><h1 id="sa-demo-title" className="text-xl font-semibold">Sales</h1><p className="text-px-11 text-muted-foreground">Manage sales &amp; offers</p></div>
        </div>
        <div className="flex gap-2">
          <div id="sa-demo-create-open" className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-xs font-medium inline-flex items-center gap-1.5 cursor-default"><Plus className="h-3.5 w-3.5" /> Add Sale</div>
        </div>
      </div>

      {/* KPIs — Total / In-Progress / Closed / Total Value */}
      <div className="p-4 border-b border-border grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard id="sa-demo-stat-total"      icon={<TrendingUp className="h-4 w-4" />}   label="Total Sales"       value="38"          active={state.selectedStat === 'all'} />
        <StatCard id="sa-demo-stat-inprogress" icon={<Activity className="h-4 w-4" />}     label="In Progress Sales" value="9"           active={state.selectedStat === 'in_progress'} />
        <StatCard id="sa-demo-stat-closed"     icon={<CheckCircle2 className="h-4 w-4" />} label="Closed Sales"      value="24"          active={state.selectedStat === 'closed'} />
        <StatCard id="sa-demo-stat-value"      icon={<DollarSign className="h-4 w-4" />}   label="Total Value"       value="312 800 TND" />
      </div>

      {/* Search + filters + views */}
      <div className="p-3 border-b border-border bg-card space-y-3">
        <div className="flex gap-2 items-center">
          <div id="sa-demo-search" className={`relative flex-1 ${state.searchActive ? 'ring-1 ring-primary rounded-md' : ''}`}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <div className="h-9 pl-10 pr-3 rounded-md border border-border bg-background text-sm text-muted-foreground flex items-center">{state.searchActive ? 'médina' : 'Search sales…'}</div>
          </div>
          <div id="sa-demo-filters" className={`h-9 px-3 rounded-md border text-sm flex items-center gap-1.5 cursor-default ${state.showFilters ? 'border-primary text-primary bg-primary/5' : 'border-border text-muted-foreground'}`}><Filter className="h-4 w-4" /> Filters</div>
          <div id="sa-demo-views" className="flex items-center gap-1 border border-border rounded-md overflow-hidden">
            {([['list', List], ['table', TableIcon]] as const).map(([m, Ic]) => (
              <div key={m} className={`h-9 px-2.5 flex items-center cursor-default ${state.listView === m ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}><Ic className="h-4 w-4" /></div>
            ))}
          </div>
          <div id="sa-demo-map" className={`h-9 w-9 rounded-md border flex items-center justify-center cursor-default ${state.showMap ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground'}`}><Map className="h-4 w-4" /></div>
        </div>
        {state.showFilters && (
          <div className="grid grid-cols-4 gap-2 pt-2 border-t border-border">
            {['Status: In progress', 'Priority: Urgent', 'Stage: Proposal', 'Assignee: Sara'].map(f => <div key={f} className="h-8 px-2.5 rounded-md border border-border text-xs flex items-center gap-2 text-foreground bg-background">{f}<ChevronDown className="h-3.5 w-3.5 text-muted-foreground ml-auto" /></div>)}
          </div>
        )}
      </div>

      {/* Bulk action bar */}
      {state.bulkSelected && (
        <div id="sa-demo-bulk" className="mx-4 mt-4 rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 flex items-center gap-3">
          <span className="h-3.5 w-3.5 rounded border bg-primary border-primary inline-flex items-center justify-center"><CheckCircle2 className="h-2.5 w-2.5 text-primary-foreground" /></span>
          <span className="text-xs font-medium text-foreground">2 selected</span>
          <span className="text-px-10 text-muted-foreground">Deselect all</span>
          <span className="ml-auto inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md bg-destructive text-destructive-foreground text-xs font-medium"><Trash2 className="h-3 w-3" /> Delete selected</span>
        </div>
      )}

      {state.showMap ? (
        <div className="p-4"><div className="h-56 rounded-lg border border-border overflow-hidden relative bg-[linear-gradient(135deg,#e8f0e8_0%,#dce9f0_100%)] dark:bg-[linear-gradient(135deg,#1b2a1b_0%,#16242e_100%)]">
          <div className="absolute inset-0 opacity-40" style={{ backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 28px,rgba(120,120,120,.25) 29px),repeating-linear-gradient(90deg,transparent,transparent 28px,rgba(120,120,120,.25) 29px)' }} />
          {[['30%', '42%'], ['58%', '58%'], ['48%', '72%']].map((p, i) => <div key={i} className="absolute -translate-x-1/2 -translate-y-full" style={{ left: p[0], top: p[1] }}><Map className="h-6 w-6 bg-primary text-white rounded-full p-1" /></div>)}
          <div className="absolute bottom-2 left-2 text-px-10 text-muted-foreground bg-background/70 rounded px-2 py-0.5">Sales by customer location</div>
        </div></div>
      ) : (
        <div className="p-4">
          <div id="sa-demo-table" className="border border-border rounded-lg overflow-hidden bg-card">
            <table className="w-full text-xs">
              <thead><tr className="border-b border-border/60 bg-muted/30">
                <th className="w-8 px-3 py-2"></th>
                <th className="text-left px-3 py-2 text-muted-foreground font-medium">Sale</th>
                <th className="text-left px-3 py-2 text-muted-foreground font-medium">Contact</th>
                <th className="text-left px-3 py-2 text-muted-foreground font-medium">Related Offer</th>
                <th className="text-left px-3 py-2 text-muted-foreground font-medium">Amount</th>
                <th className="text-left px-3 py-2 text-muted-foreground font-medium">Status</th>
                <th className="w-10 px-3 py-2"></th>
              </tr></thead>
              <tbody>
                {DEMO_SALES.map((o, i) => {
                  const checked = state.bulkSelected && i < 2;
                  return (
                    <tr key={o.id} className={`border-b border-border/40 last:border-0 ${checked ? 'bg-primary/[0.04]' : ''}`}>
                      <td className="px-3 py-2.5"><span className={`h-3.5 w-3.5 rounded border inline-flex items-center justify-center ${checked ? 'bg-primary border-primary' : 'border-border'}`}>{checked && <CheckCircle2 className="h-2.5 w-2.5 text-primary-foreground" />}</span></td>
                      <td className="px-3 py-2.5"><div className="text-foreground truncate max-w-[180px]">{o.title}</div><div className="text-px-10 text-muted-foreground">{o.num}</div></td>
                      <td className="px-3 py-2.5"><div className="text-primary text-px-11 leading-tight">{o.customer}</div><div className="text-px-10 text-muted-foreground">{o.company}</div></td>
                      <td className="px-3 py-2.5">{o.offer !== '—' ? <span className="text-primary underline underline-offset-2">{o.offer}</span> : <span className="text-muted-foreground">-</span>}</td>
                      <td className="px-3 py-2.5"><span className="text-foreground">{fmt(o.amount)} TND</span><span className="text-px-10 text-muted-foreground ml-1">(incl. TVA)</span></td>
                      <td className="px-3 py-2.5"><Pill s={o.status} /></td>
                      <td className="px-3 py-2.5 relative">
                        <span id={i === 0 ? 'sa-demo-row-actions' : undefined} className={`inline-flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground ${i === 0 && state.rowActionsOpen ? 'bg-muted' : ''}`}><MoreHorizontal className="h-3.5 w-3.5" /></span>
                        {i === 0 && state.rowActionsOpen && (
                          <div className="absolute right-3 top-8 z-[3] w-40 bg-popover border border-border rounded-md shadow-lg py-1 text-px-11">
                            {[[<Eye key="v" className="h-3 w-3" />, 'View sale'], [<FileText key="r" className="h-3 w-3" />, 'Report'], [<Trash2 key="d" className="h-3 w-3 text-red-500" />, 'Delete']].map(([ic, l]) => (
                              <div key={l as string} className="flex items-center gap-2 px-2.5 py-1 hover:bg-muted cursor-default">{ic}<span>{l as string}</span></div>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Page: create ───────────────────────────────────────────────────────────

const Box = ({ children, muted }: { children: React.ReactNode; muted?: boolean }) => (
  <div className={`h-9 px-3 rounded-md border border-border text-sm flex items-center ${muted ? 'text-muted-foreground' : 'text-foreground'}`}>{children}</div>
);
function Field({ id, label, children, active }: { id?: string; label: string; children: React.ReactNode; active?: boolean }) {
  return <div id={id} className={`rounded-md transition-all ${active ? 'ring-1 ring-primary/40 bg-primary/[0.03] p-2 -m-2' : ''}`}><label className="block text-xs font-medium text-foreground mb-1.5">{label}</label>{children}</div>;
}

function PageCreate({ state }: { state: SalesDemoState }) {
  const step = state.createStep;
  return (
    <div className="p-4 md:p-6 space-y-5 max-w-3xl mx-auto">
      <div className="flex items-center gap-3"><div className="h-8 w-8 rounded border border-border flex items-center justify-center text-muted-foreground text-xs">←</div><h1 className="text-lg font-semibold">New Sale</h1></div>
      <div className="bg-card border border-border rounded-lg p-5 space-y-5">
        <div id="sa-demo-create-customer" className={`grid grid-cols-2 gap-4 transition-opacity ${step >= 1 ? '' : 'opacity-40'}`}>
          <Field label="Customer *" active={step === 1}><Box muted={step < 1}>{step >= 1 ? 'Médina Resorts' : 'Select…'}</Box></Field>
          <Field label="Matricule Fiscale"><Box muted={step < 1}>{step >= 1 ? '1234567/A/M/000' : '—'}</Box></Field>
        </div>
        <div id="sa-demo-create-items" className={`transition-opacity ${step >= 2 ? '' : 'opacity-40'}`}>
          <div className="flex items-center justify-between mb-2"><span className="text-xs font-medium">Line items</span><span className="h-6 px-2 rounded border border-border text-px-10 text-muted-foreground inline-flex items-center gap-1"><Plus className="h-3 w-3" /> Add</span></div>
          <div className="border border-border rounded-md overflow-hidden">
            <table className="w-full text-xs">
              <thead><tr className="bg-muted/40 border-b border-border"><th className="text-left px-3 py-1.5 text-muted-foreground">Item</th><th className="text-right px-3 py-1.5 text-muted-foreground">Qty</th><th className="text-right px-3 py-1.5 text-muted-foreground">Price</th><th className="text-right px-3 py-1.5 text-muted-foreground">Total</th></tr></thead>
              <tbody>
                {step >= 2 ? [['Split AC unit 24000 BTU', '6', '2,100', '12,600', 'article'], ['On-site installation', '1', '3,400', '3,400', 'service']].map(r => (
                  <tr key={r[0]} className="border-b border-border/40 last:border-0">
                    <td className="px-3 py-1.5"><span className="inline-flex items-center gap-1.5">{r[4] === 'service' ? <Wrench className="h-3 w-3 text-muted-foreground" /> : <ShoppingCart className="h-3 w-3 text-muted-foreground" />}{r[0]}</span></td>
                    <td className="px-3 py-1.5 text-right">{r[1]}</td><td className="px-3 py-1.5 text-right">{r[2]}</td><td className="px-3 py-1.5 text-right font-medium">{r[3]}</td>
                  </tr>
                )) : <tr><td colSpan={4} className="px-3 py-4 text-center text-muted-foreground">No items yet</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
        <div id="sa-demo-create-totals" className={`flex justify-end transition-opacity ${step >= 3 ? '' : 'opacity-40'}`}>
          <div className="w-64 space-y-1 text-xs">
            <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>{step >= 3 ? '16,000 TND' : '—'}</span></div>
            <div className="flex justify-between text-muted-foreground"><span>TVA 19%</span><span>{step >= 3 ? '3,040 TND' : '—'}</span></div>
            <div className="flex justify-between text-muted-foreground"><span>Shipping</span><span>{step >= 3 ? '120 TND' : '—'}</span></div>
            <div className="flex justify-between text-muted-foreground"><span>Fiscal stamp</span><span>{step >= 3 ? '1 TND' : '—'}</span></div>
            <div className="flex justify-between font-bold text-sm border-t border-border pt-1"><span>Total</span><span>{step >= 3 ? '19,161 TND' : '—'}</span></div>
          </div>
        </div>
        <div id="sa-demo-create-meta" className={`grid grid-cols-2 gap-4 transition-opacity ${step >= 4 ? '' : 'opacity-40'}`}>
          <Field label="Delivery date" active={step === 4}><Box muted={step < 4}>{step >= 4 ? '2025-07-10' : '—'}</Box></Field>
          <Field label="Priority" active={step === 4}><Box muted={step < 4}>{step >= 4 ? 'High' : '—'}</Box></Field>
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <div className="h-9 px-4 rounded-md border border-border text-sm flex items-center text-muted-foreground">Cancel</div>
        <div id="sa-demo-create-save" className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium flex items-center">Save Sale</div>
      </div>
    </div>
  );
}

// ─── Page: detail ───────────────────────────────────────────────────────────

const STEPPER = ['created', 'in_progress', 'invoiced', 'closed'];
function PageDetail({ state }: { state: SalesDemoState }) {
  const O = DEMO_SALES[0];
  const tabs = [
    { k: 'overview',   l: 'Overview',   id: undefined as string | undefined },
    { k: 'items',      l: 'Items',      id: 'sa-demo-tab-items' },
    { k: 'payments',   l: 'Payments',   id: 'sa-demo-tab-payments' },
    { k: 'checklists', l: 'Checklists', id: 'sa-demo-tab-checklists' },
    { k: 'documents',  l: 'Documents',  id: 'sa-demo-tab-documents' },
    { k: 'activity',   l: 'Activity',   id: 'sa-demo-tab-activity' },
  ];
  const curStatus = STEPPER[Math.min(state.statusStage, STEPPER.length - 1)];
  return (
    <div className="flex flex-col max-w-5xl mx-auto w-full relative">
      {/* Compact header card mirroring the real detail: number + amount + 4 icon actions */}
      <div id="sa-demo-detail-header" className="px-4 py-3 border-b border-border/60">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded border border-border flex items-center justify-center text-muted-foreground text-xs">←</div>
          <div className="flex-1 border border-border/50 rounded-lg bg-card px-3 py-2 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-base font-semibold">{O.num}</h1>
                <Pill s={curStatus} />
                <span className="text-px-10 text-muted-foreground">· {O.customer}</span>
              </div>
              <p className="text-px-11 text-muted-foreground truncate">{O.title} · {fmt(O.amount)} TND (incl. TVA)</p>
            </div>
            <div className="flex gap-1 shrink-0">
              <span className="h-8 w-8 rounded-md border border-border inline-flex items-center justify-center text-muted-foreground"><Edit className="h-3.5 w-3.5" /></span>
              <span id="sa-demo-send" className="h-8 w-8 rounded-md border border-border inline-flex items-center justify-center text-muted-foreground"><Send className="h-3.5 w-3.5" /></span>
              <span id="sa-demo-pdf" className="h-8 w-8 rounded-md border border-border inline-flex items-center justify-center text-muted-foreground"><FileText className="h-3.5 w-3.5" /></span>
              <span className="h-8 w-8 rounded-md border border-border inline-flex items-center justify-center text-destructive"><Trash2 className="h-3.5 w-3.5" /></span>
            </div>
          </div>
        </div>
      </div>

      {/* Status pipeline — includes partially_invoiced + cancelled branches */}
      <div id="sa-demo-status" className="px-4 py-3 border-b border-border/60 bg-muted/20">
        <div className="flex items-center gap-0 flex-wrap">
          {STEPPER.map((s, i) => (
            <div key={s} className="flex items-center gap-0">
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-px-11 font-medium capitalize ${i <= state.statusStage ? 'text-primary bg-primary/10' : 'text-muted-foreground'}`}>
                {i < state.statusStage && <CheckCircle2 className="h-3 w-3" />}{s.replace('_', ' ')}
              </div>
              {i < STEPPER.length - 1 && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40" />}
            </div>
          ))}
          <span id="sa-demo-status-branch" className={`ml-3 flex items-center gap-1.5 rounded-md px-2 py-1 text-px-10 transition-all ${state.showBranch ? 'ring-1 ring-primary/40 bg-primary/5' : ''}`}>
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400"><Receipt className="h-2.5 w-2.5" /> Partially invoiced</span>
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"><Ban className="h-2.5 w-2.5" /> Cancelled</span>
          </span>
        </div>
      </div>

      {/* Service-items banner — the real path to Convert to Service Order */}
      <div id="sa-demo-so-banner" className={`mx-4 mt-3 rounded-lg border p-3 flex items-center gap-3 transition-all ${state.convertOpen ? 'border-primary/50 bg-primary/5' : 'border-border bg-card'}`}>
        <span className="p-2 rounded-md bg-primary/10 text-primary"><Wrench className="h-4 w-4" /></span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium">Contains service items</p>
          <p className="text-px-10 text-muted-foreground">This sale has 1 service line — convert it to a Service Order for your field team, or keep it in Sales only.</p>
        </div>
        <span className="h-7 px-2 rounded-md text-px-10 text-muted-foreground inline-flex items-center">Skip</span>
        <span className="h-7 px-2.5 rounded-md bg-primary text-primary-foreground text-px-11 font-medium inline-flex items-center gap-1"><Wrench className="h-3 w-3" /> Convert to Service Order</span>
      </div>

      {/* Tabs — Overview / Items / Payments / Checklists / Documents / Activity */}
      <div className="border-b border-border/60 px-4 overflow-x-auto mt-3">
        <div className="flex gap-1 -mb-px min-w-max">
          {tabs.map(tab => (
            <div key={tab.k} id={tab.id} className={`inline-flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 cursor-default whitespace-nowrap ${state.activeTab === tab.k ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground'}`}>{tab.l}</div>
          ))}
        </div>
      </div>

      <div className="p-4">
        {state.activeTab === 'overview' && (
          <div id="sa-demo-overview" className="grid md:grid-cols-2 gap-4">
            <div className="bg-card border border-border rounded-lg p-4 space-y-2 text-xs">
              <p className="text-sm font-medium mb-1">Customer</p>
              <div className="flex items-center gap-1.5 text-muted-foreground"><Building2 className="h-3 w-3" /> Médina Resorts</div>
              <div className="flex items-center gap-1.5 text-muted-foreground"><User className="h-3 w-3" /> Sami Bouazizi</div>
              <div className="flex items-center gap-1.5 text-muted-foreground"><FileText className="h-3 w-3" /> MF 1234567/A/M/000</div>
              <div className="flex items-center gap-1.5 text-muted-foreground"><Calendar className="h-3 w-3" /> Delivery 10 Jul 2025</div>
              <div className="flex items-center gap-1.5 text-primary"><FileText className="h-3 w-3" /> From offer OFF-2025-031</div>
            </div>
            <div className="bg-card border border-border rounded-lg p-4 space-y-1.5 text-xs">
              <p className="text-sm font-medium mb-1">Financial summary</p>
              <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>16,000 TND</span></div>
              <div className="flex justify-between text-muted-foreground"><span>TVA + shipping + stamp</span><span>2,400 TND</span></div>
              <div className="flex justify-between font-bold text-sm border-t border-border pt-1"><span>Total</span><span>18,400 TND</span></div>
              <div className="flex justify-between text-green-600 font-medium"><span>Paid</span><span>18,400 TND</span></div>
              <div className="flex justify-between text-muted-foreground"><span>Balance</span><span>0 TND</span></div>
            </div>
          </div>
        )}
        {state.activeTab === 'items' && (
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <table className="w-full text-xs">
              <thead><tr className="bg-muted/30 border-b border-border/60"><th className="text-left px-4 py-2 text-muted-foreground">Item</th><th className="text-right px-4 py-2 text-muted-foreground">Qty</th><th className="text-right px-4 py-2 text-muted-foreground">Price</th><th className="text-right px-4 py-2 text-muted-foreground">Total</th></tr></thead>
              <tbody>
                {[['Split AC unit 24000 BTU', '6', '2,100 TND', '12,600 TND'], ['On-site installation', '1', '3,400 TND', '3,400 TND']].map(r => (
                  <tr key={r[0]} className="border-b border-border/40 last:border-0"><td className="px-4 py-2.5 font-medium">{r[0]}</td><td className="px-4 py-2.5 text-right">{r[1]}</td><td className="px-4 py-2.5 text-right">{r[2]}</td><td className="px-4 py-2.5 text-right font-medium">{r[3]}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {state.activeTab === 'payments' && (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="rounded-lg border border-border bg-card p-3"><p className="text-px-10 text-muted-foreground">Total invoiced</p><p className="font-semibold text-sm mt-0.5">18,400 TND</p></div>
              <div className="rounded-lg border border-green-500/30 bg-green-500/5 p-3"><p className="text-px-10 text-green-700 dark:text-green-400">Paid</p><p className="font-semibold text-sm mt-0.5 text-green-700 dark:text-green-400">18,400 TND</p></div>
              <div className="rounded-lg border border-border bg-card p-3"><p className="text-px-10 text-muted-foreground">Balance</p><p className="font-semibold text-sm mt-0.5">0 TND</p></div>
            </div>
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2 border-b border-border">
                <p className="text-xs font-medium inline-flex items-center gap-1.5"><CreditCard className="h-3.5 w-3.5 text-primary" /> Recorded payments</p>
                <span className="h-6 px-2 rounded border border-border text-px-10 text-muted-foreground inline-flex items-center gap-1"><Plus className="h-3 w-3" /> Record payment</span>
              </div>
              <table className="w-full text-xs">
                <thead><tr className="bg-muted/30 border-b border-border/60"><th className="text-left px-3 py-1.5 text-muted-foreground">Date</th><th className="text-left px-3 py-1.5 text-muted-foreground">Method</th><th className="text-left px-3 py-1.5 text-muted-foreground">Reference</th><th className="text-right px-3 py-1.5 text-muted-foreground">Amount</th><th className="text-left px-3 py-1.5 text-muted-foreground">Recorded by</th></tr></thead>
                <tbody>
                  {[
                    ['2025-06-10', 'Bank transfer', <Landmark key="l" className="h-3 w-3" />, 'TRF-88214',  '9,200 TND', 'Sara M.'],
                    ['2025-06-18', 'Cheque',        <Receipt key="r" className="h-3 w-3" />,  'CHQ-004512', '5,000 TND', 'Ahmed B.'],
                    ['2025-06-24', 'Cash',          <Banknote key="b" className="h-3 w-3" />, '—',           '4,200 TND', 'Ahmed B.'],
                  ].map((r, i) => (
                    <tr key={i} className="border-b border-border/40 last:border-0">
                      <td className="px-3 py-1.5">{r[0]}</td>
                      <td className="px-3 py-1.5"><span className="inline-flex items-center gap-1.5 text-muted-foreground">{r[2]}{r[1]}</span></td>
                      <td className="px-3 py-1.5 text-muted-foreground">{r[3]}</td>
                      <td className="px-3 py-1.5 text-right font-medium">{r[4]}</td>
                      <td className="px-3 py-1.5 text-muted-foreground">{r[5]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {state.activeTab === 'checklists' && (
          <div className="space-y-3">
            <div className="bg-card border border-border rounded-lg p-4 space-y-2">
              <p className="text-sm font-medium mb-1 inline-flex items-center gap-2"><ListChecks className="h-4 w-4 text-primary" /> Fulfilment checklist <span className="text-px-10 font-normal text-muted-foreground">· sale-level</span></p>
              {[['Stock confirmed available', true], ['Delivery scheduled', true], ['Signed delivery note collected', false]].map(c => (
                <div key={c[0] as string} className="flex items-center gap-2 text-xs"><span className={`h-4 w-4 rounded border inline-flex items-center justify-center ${c[1] ? 'bg-primary border-primary' : 'border-border'}`}>{c[1] && <CheckCircle2 className="h-3 w-3 text-primary-foreground" />}</span><span className={c[1] ? 'line-through text-muted-foreground' : ''}>{c[0]}</span></div>
              ))}
            </div>
            <div className="bg-card border border-primary/30 ring-1 ring-primary/15 rounded-lg p-4 space-y-2">
              <p className="text-sm font-medium mb-1 inline-flex items-center gap-2"><ListChecks className="h-4 w-4 text-primary" /> Service line: Annual Maintenance Plan <span className="text-px-10 font-normal text-primary">· follows to the job →</span></p>
              {[['Inspect & clean unit', false], ['Replace filters', false], ['Performance test & report', false]].map(c => (
                <div key={c[0] as string} className="flex items-center gap-2 text-xs"><span className="h-4 w-4 rounded border border-border inline-flex items-center justify-center" /><span>{c[0]}</span></div>
              ))}
              <p className="text-px-10 text-muted-foreground pt-1">Carried from the offer; flows to the service-order job and the dispatch.</p>
            </div>
          </div>
        )}
        {state.activeTab === 'documents' && (
          <div className="grid grid-cols-2 gap-3">
            {[['Signed-quote.pdf'], ['Delivery-note.pdf'], ['Payment-receipt.pdf']].map(d => (
              <div key={d[0]} className="flex items-center gap-2.5 p-3 bg-card border border-border rounded-lg"><Paperclip className="h-4 w-4 text-muted-foreground" /><span className="text-xs">{d[0]}</span></div>
            ))}
          </div>
        )}
        {state.activeTab === 'activity' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-medium inline-flex items-center gap-2"><Activity className="h-3.5 w-3.5 text-primary" /> Notes &amp; activity</p>
              <span className="h-6 px-2 rounded border border-border text-px-10 text-muted-foreground inline-flex items-center gap-1"><Plus className="h-3 w-3" /> Add note</span>
            </div>
            {[
              ['Sale created from offer OFF-2025-031', 'System',   '2025-06-08'],
              ['Status changed to In Progress',         'Ahmed B.', '2025-06-09'],
              ['Invoice sent to contact@medina.tn',     'Ahmed B.', '2025-06-09'],
              ['Payment received — 9,200 TND',          'Sara M.',  '2025-06-10'],
              ['Converted to service order SO-2025-044','Ahmed B.', '2025-06-11'],
            ].map((a, i, arr) => (
              <div key={a[0]} className="flex gap-3">
                <div className="flex flex-col items-center shrink-0"><span className="h-6 w-6 rounded-full bg-primary/10 text-primary inline-flex items-center justify-center"><Activity className="h-3 w-3" /></span>{i < arr.length - 1 && <div className="w-px flex-1 bg-border mt-1" />}</div>
                <div className="pb-1"><p className="text-xs font-medium">{a[0]}</p><p className="text-px-10 text-muted-foreground">{a[2]} · {a[1]}</p></div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Send invoice modal */}
      {state.sendOpen && (
        <div className="absolute inset-0 z-[6] flex items-start justify-center pt-10 bg-background/40">
          <div className="w-[440px] bg-card border border-border rounded-xl shadow-2xl p-4">
            <p className="text-sm font-semibold mb-3 inline-flex items-center gap-2"><Mail className="h-4 w-4" /> Send Invoice</p>
            <div className="space-y-2 text-xs">
              <Box>contact@medina.tn</Box>
              <div className="h-20 rounded-md border border-border p-2 text-muted-foreground">Please find attached invoice INV-2025-044. Payment due within 30 days.</div>
              <div className="flex items-center gap-1.5 text-muted-foreground"><Paperclip className="h-3 w-3" /> INV-2025-044.pdf attached</div>
            </div>
            <div className="flex justify-end gap-2 mt-3"><div className="h-8 px-3 rounded-md border border-border text-xs flex items-center text-muted-foreground">Cancel</div><div className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-xs font-medium inline-flex items-center gap-1.5"><Send className="h-3.5 w-3.5" /> Send</div></div>
          </div>
        </div>
      )}

      {/* PDF preview + studio */}
      {state.pdfOpen && (
        <div className="absolute inset-0 z-[6] flex items-center justify-center bg-background/50 p-6">
          <div className="flex gap-3 h-full max-h-[80%]">
            <div id="sa-demo-pdf-download" className="w-72 bg-white text-black rounded-lg shadow-2xl border border-border overflow-hidden flex flex-col">
              <div className="bg-primary/90 text-white p-3"><div className="text-sm font-bold">INVOICE · INV-2025-044</div><div className="text-px-9 opacity-90">Flowentra SARL · MF 0000000/A/M/000</div></div>
              <div className="p-3 text-px-9 space-y-2 flex-1">
                <div className="flex justify-between"><div><div className="font-semibold">Bill to</div><div>Médina Resorts</div><div>MF 1234567/A/M/000</div></div><div className="text-right"><div>Date 09/06/2025</div><div>Due 09/07/2025</div></div></div>
                <table className="w-full"><thead><tr className="border-b border-gray-300"><th className="text-left py-0.5">Item</th><th className="text-right">Total</th></tr></thead><tbody>
                  <tr><td className="py-0.5">Split AC unit ×6</td><td className="text-right">12,600</td></tr>
                  <tr><td className="py-0.5">Installation</td><td className="text-right">3,400</td></tr>
                </tbody></table>
                <div className="text-right space-y-0.5 border-t border-gray-300 pt-1"><div>TVA 19% · stamp 1</div><div className="font-bold text-px-11">Total due 18,400 TND</div></div>
              </div>
            </div>
            {state.pdfSettings && (
              <div id="sa-demo-pdf-settings" className="w-56 bg-card border border-border rounded-lg shadow-2xl p-3">
                <p className="text-xs font-semibold mb-2 inline-flex items-center gap-1.5"><Palette className="h-3.5 w-3.5 text-primary" /> PDF Studio</p>
                <div className="flex gap-1 mb-3 border-b border-border pb-2 flex-wrap">{['Colors', 'Typography', 'Layout', 'Data', 'Advanced'].map((t, i) => <span key={t} className={`text-px-10 px-1.5 py-0.5 rounded ${i === 0 ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>{t}</span>)}</div>
                <div className="space-y-2">
                  <div><div className="text-px-10 text-muted-foreground mb-1">Accent colour</div><div className="flex gap-1">{['bg-primary', 'bg-blue-500', 'bg-emerald-500', 'bg-rose-500', 'bg-amber-500'].map((c, i) => <span key={c} className={`h-5 w-5 rounded ${c} ${i === 0 ? 'ring-2 ring-offset-1 ring-foreground' : ''}`} />)}</div></div>
                  <div><div className="text-px-10 text-muted-foreground mb-1">Font</div><div className="h-7 rounded border border-border text-px-11 flex items-center px-2">Inter</div></div>
                  <div className="flex items-center justify-between"><span className="text-px-11">Show fiscal stamp</span><span className="h-4 w-7 rounded-full bg-primary relative"><span className="absolute top-0.5 left-3.5 h-3 w-3 rounded-full bg-white" /></span></div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Convert to Service Order — real dialog fields: notes, priority, start, target + per-item install */}
      {state.convertOpen && (
        <div className="absolute inset-0 z-[6] flex items-center justify-center bg-background/40 p-4">
          <div id="sa-demo-convert-options" className="w-[560px] max-w-full bg-card border border-border rounded-xl shadow-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="h-8 w-8 rounded-md bg-primary/10 text-primary inline-flex items-center justify-center"><Wrench className="h-4 w-4" /></span>
              <div><p className="text-sm font-semibold">Convert to Service Order</p><p className="text-px-10 text-muted-foreground">INV-2025-044 · Médina Resorts · 1 service line</p></div>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-px-11 font-medium mb-1">Notes for the field team</label>
                <div className="min-h-[52px] rounded-md border border-border p-2 text-px-11 text-muted-foreground">Bring 4 kg R410A. Site access via rear gate — Sami will meet on arrival.</div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Field label="Priority"><Box>High</Box></Field>
                <Field label="Planned start"><Box>2025-07-08</Box></Field>
                <Field label="Target date"><Box>2025-07-10</Box></Field>
              </div>

              <div id="sa-demo-per-item-install" className={`rounded-lg border p-3 transition-all ${state.convertItemInstall ? 'border-primary/50 bg-primary/5' : 'border-border'}`}>
                <p className="text-px-11 font-medium mb-2 inline-flex items-center gap-1.5"><MapPin className="h-3 w-3 text-primary" /> Assign each service line to an installation</p>
                <div className="space-y-1.5">
                  {[
                    ['On-site installation',     'Médina Resorts — Lobby split unit'],
                    ['Annual maintenance visit', 'Médina Resorts — Cold Room 3'],
                  ].map(r => (
                    <div key={r[0]} className="flex items-center gap-2 text-px-11">
                      <Wrench className="h-3 w-3 text-muted-foreground shrink-0" />
                      <span className="flex-1 truncate">{r[0]}</span>
                      <ChevronRight className="h-3 w-3 text-muted-foreground" />
                      <span className="h-6 px-2 rounded border border-border bg-background inline-flex items-center gap-1 text-muted-foreground"><Building2 className="h-3 w-3" /> {r[1]}</span>
                    </div>
                  ))}
                </div>
                <p className="text-px-10 text-muted-foreground mt-2">Each line becomes a dispatchable job at its installation. Required skills carry over from the offer — nothing typed twice.</p>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-3">
              <div className="h-8 px-3 rounded-md border border-border text-xs flex items-center text-muted-foreground">Cancel</div>
              <div className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-xs font-medium inline-flex items-center gap-1.5"><Wrench className="h-3.5 w-3.5" /> Create service order</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main shell ─────────────────────────────────────────────────────────────

export function SalesAutopilotDemo({ open, onClose }: Props) {
  const { i18n } = useTranslation();
  const [stepIndex, setStepIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(false);
  const [cursor, setCursor] = useState<{ x: number; y: number; clicking: boolean }>({ x: -200, y: -200, clicking: false });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clickRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const finished = stepIndex >= SA_STEPS.length;
  const state: SalesDemoState = useMemo(() => {
    let s = initialSalesDemoState;
    for (let i = 0; i < Math.min(stepIndex + 1, SA_STEPS.length); i++) s = SA_STEPS[i].apply(s);
    return s;
  }, [stepIndex]);

  const step = SA_STEPS[Math.min(stepIndex, SA_STEPS.length - 1)];
  const demoLang = pickLang(i18n.language);
  const captionText = getCaption(demoLang, Math.min(stepIndex, SA_STEPS.length - 1), step.caption);
  const finishedMsg =
    demoLang === 'fr' ? 'Votre module Ventes est prêt — enregistrez votre première vente.' :
    'Your Sales module is ready — record your first sale.';

  useEffect(() => { if (open) { setStepIndex(0); setPlaying(true); } return () => { if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel(); }; }, [open]);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    const synth = window.speechSynthesis; synth.getVoices();
    const onVoices = () => synth.getVoices(); synth.addEventListener?.('voiceschanged', onVoices);
    return () => synth.removeEventListener?.('voiceschanged', onVoices);
  }, []);
  useEffect(() => {
    if (!open || finished) return;
    const place = () => { const el = document.getElementById(step.target); if (!el) return; const r = el.getBoundingClientRect(); setCursor({ x: r.left + Math.min(r.width / 2, 120), y: r.top + Math.min(r.height / 2, 40), clicking: true }); if (clickRef.current) clearTimeout(clickRef.current); clickRef.current = setTimeout(() => setCursor(c => ({ ...c, clicking: false })), 450); };
    const t = setTimeout(place, 160); return () => clearTimeout(t);
  }, [stepIndex, open, finished, step?.target, state.page, state.activeTab, state.listView, state.showFilters, state.showMap, state.bulkSelected, state.rowActionsOpen, state.createStep, state.sendOpen, state.pdfOpen, state.pdfSettings, state.convertOpen, state.convertItemInstall, state.showBranch, state.statusStage]);
  useEffect(() => {
    if (!open || !playing || finished) return;
    const advance = () => setStepIndex(i => i + 1);
    const caption = captionText;
    const synthSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;
    if (!muted && synthSupported && caption) {
      const synth = window.speechSynthesis; synth.cancel();
      const { code, bcp47 } = languageTagFor(i18n.language);
      const voice = pickBestVoice(code); const chunks = splitForSpeech(caption);
      let advanced = false; const doAdvance = () => { if (advanced) return; advanced = true; timerRef.current = setTimeout(advance, 420); };
      chunks.forEach((chunk, idx) => { const u = new SpeechSynthesisUtterance(chunk); u.lang = bcp47; configureUtteranceForFemaleVoice(u, voice); if (idx === chunks.length - 1) { u.onend = doAdvance; u.onerror = doAdvance; } try { synth.speak(u); } catch { /* */ } });
      const safetyMs = Math.max(step.duration, caption.length * 110 + 1800);
      const safety = setTimeout(doAdvance, safetyMs);
      const keepAlive = setInterval(() => { if (synth.speaking && !synth.paused) { synth.pause(); synth.resume(); } }, 10000);
      return () => { clearTimeout(safety); clearInterval(keepAlive); if (timerRef.current) clearTimeout(timerRef.current); try { synth.cancel(); } catch { /* */ } };
    }
    timerRef.current = setTimeout(advance, step.duration);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [stepIndex, open, playing, finished, muted, step, captionText, i18n.language]);

  const restart = useCallback(() => { if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel(); setStepIndex(0); setPlaying(true); }, []);
  const togglePlay = useCallback(() => setPlaying(p => !p), []);
  const jumpChapter = useCallback((start: number) => { setStepIndex(start); setPlaying(true); }, []);

  if (!open) return null;
  const activeChapter = SA_CHAPTERS.find(c => stepIndex >= c.start && stepIndex < c.end) || SA_CHAPTERS[SA_CHAPTERS.length - 1];

  return (
    <div className="fixed inset-0 z-[110] bg-background flex flex-col select-none">
      <div className="h-12 shrink-0 border-b border-border/60 bg-card flex items-center px-3 gap-3">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="h-7 w-7 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-sm shrink-0"><TrendingUp className="h-3.5 w-3.5 text-primary-foreground" /></span>
          <span className="text-sm font-semibold truncate">Sales — Live Demo</span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={() => setMuted(m => !m)} className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground" title={muted ? 'Unmute' : 'Mute'}>{muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}</button>
          <button onClick={togglePlay} className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground">{playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}</button>
          <button onClick={restart} className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground" title="Restart"><RotateCcw className="h-4 w-4" /></button>
          <button onClick={onClose} className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground" title="Close"><X className="h-4 w-4" /></button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pointer-events-none">
        {state.page === 'list'   && <PageList   state={state} />}
        {state.page === 'create' && <PageCreate state={state} />}
        {state.page === 'detail' && <PageDetail state={state} />}
      </div>

      <div className="shrink-0 border-t border-border/60 bg-card px-4 py-3">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          {SA_CHAPTERS.map(ch => (
            <button key={ch.id} onClick={() => jumpChapter(ch.start)} className={`text-px-10 font-medium px-2 py-0.5 rounded-full transition-colors cursor-pointer ${activeChapter.id === ch.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/70'}`}>{getChapterTitle(demoLang, ch.id, ch.title)}</button>
          ))}
          <span className="ml-auto text-px-10 text-muted-foreground">{Math.min(stepIndex + 1, SA_STEPS.length)} / {SA_STEPS.length}</span>
        </div>
        <div className="h-1 rounded-full bg-muted overflow-hidden mb-2"><div className="h-full bg-primary transition-all duration-300" style={{ width: `${(Math.min(stepIndex + 1, SA_STEPS.length) / SA_STEPS.length) * 100}%` }} /></div>
        <p className="text-sm text-foreground/90 min-h-[20px] flex items-center gap-2"><Languages className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />{finished ? finishedMsg : captionText}</p>
      </div>

      {!finished && <DemoCursor x={cursor.x} y={cursor.y} clicking={cursor.clicking} />}

      {finished && (
        <div className="absolute inset-0 z-[115] flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl shadow-2xl p-6 max-w-sm text-center">
            <div className="h-12 w-12 mx-auto rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center mb-3"><TrendingUp className="h-6 w-6 text-primary-foreground" /></div>
            <h3 className="text-lg font-semibold mb-1">From quote to cash</h3>
            <p className="text-sm text-muted-foreground mb-5">KPI-driven pipeline · Compliant invoices · Payments &amp; reconciliation · Branded PDFs · One-click bridge to Service Orders.</p>
            <div className="flex flex-col gap-2">
              <button onClick={onClose} className="w-full h-10 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 cursor-pointer">Record your first sale</button>
              <button onClick={restart} className="w-full h-9 rounded-lg border border-border text-sm font-medium hover:bg-muted/40 inline-flex items-center justify-center gap-1.5 cursor-pointer"><RotateCcw className="h-3.5 w-3.5" /> Replay</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

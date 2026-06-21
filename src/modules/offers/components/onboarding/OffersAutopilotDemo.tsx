import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  X, Play, Pause, RotateCcw, Volume2, VolumeX, Languages,
  FileText, Search, Filter, List, Table as TableIcon, LayoutGrid, Map, Download,
  Plus, Send, GitBranch, DollarSign, Target, CheckCircle2, Building2, User,
  Calendar, StickyNote, ListChecks, Paperclip, Activity, ChevronRight, ChevronDown,
  Palette, ShoppingCart, Wrench, Mail,
} from 'lucide-react';
import { DemoCursor } from '@/modules/external/components/onboarding/DemoCursor';
import { pickBestVoice, splitForSpeech, languageTagFor } from '@/modules/external/components/onboarding/narrationVoice';
import {
  OF_STEPS, OF_CHAPTERS, initialOffersDemoState,
  type OffersDemoState,
} from './offersDemoScript';
import { pickLang, getCaption, getChapterTitle } from './offersDemoTranslations';

interface Props { open: boolean; onClose: () => void; }

const fmt = (n: number) => n.toLocaleString('fr-TN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const DEMO_OFFERS = [
  { id: 'o1', num: 'OFF-2025-031', title: 'AC System — Médina Resorts', customer: 'Médina Resorts',  amount: 18400, status: 'sent',        valid: '30 Jun' },
  { id: 'o2', num: 'OFF-2025-030', title: 'Pump Install — Acme',        customer: 'Acme Industries',  amount: 7600,  status: 'negotiation', valid: '24 Jun' },
  { id: 'o3', num: 'OFF-2025-028', title: 'Annual Maintenance',         customer: 'Sahara Foods',     amount: 9200,  status: 'accepted',    valid: '—' },
  { id: 'o4', num: 'OFF-2025-027', title: 'Lighting Retrofit',          customer: 'Hydro Parts',      amount: 4200,  status: 'draft',       valid: '15 Jul' },
  { id: 'o5', num: 'OFF-2025-022', title: 'Cold Room Upgrade',          customer: 'Médina Resorts',   amount: 31500, status: 'lost',        valid: '—' },
];

const STATUS_CLS: Record<string, string> = {
  draft:       'bg-muted text-muted-foreground',
  sent:        'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  negotiation: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  accepted:    'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  lost:        'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};
function Pill({ s }: { s: string }) {
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${STATUS_CLS[s] ?? 'bg-muted text-muted-foreground'}`}>{s}</span>;
}
const initials = (n: string) => n.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);


// ─── Page: list ─────────────────────────────────────────────────────────────

function StatCard({ id, icon, label, value, active }: { id: string; icon: React.ReactNode; label: string; value: string; active?: boolean }) {
  return (
    <div id={id} className={`rounded-lg p-3 border cursor-default transition-all ${active ? 'border-2 border-primary bg-primary/5' : 'border-border bg-card'}`}>
      <div className="flex items-center gap-2.5">
        <span className={`p-2 rounded-lg ${active ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>{icon}</span>
        <div className="min-w-0"><p className="text-[11px] text-muted-foreground font-medium truncate">{label}</p><p className="text-sm font-bold">{value}</p></div>
      </div>
    </div>
  );
}

function PageList({ state }: { state: OffersDemoState }) {
  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-border bg-card/50">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10"><FileText className="h-6 w-6 text-primary" /></div>
          <div><h1 id="of-demo-title" className="text-xl font-semibold">Offers</h1><p className="text-[11px] text-muted-foreground">Quotes &amp; sales pipeline</p></div>
        </div>
        <div className="flex gap-2">
          <div id="of-demo-export" className={`h-8 px-3 rounded-md border text-xs inline-flex items-center gap-1.5 cursor-default ${state.showExport ? 'border-primary text-primary bg-primary/5' : 'border-border text-muted-foreground'}`}><Download className="h-3.5 w-3.5" /> Export</div>
          <div id="of-demo-create-open" className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-xs font-medium inline-flex items-center gap-1.5 cursor-default"><Plus className="h-3.5 w-3.5" /> New Offer</div>
        </div>
      </div>

      {/* KPIs */}
      <div className="p-4 border-b border-border grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard id="of-demo-stat-total"    icon={<FileText className="h-4 w-4" />}     label="Total Offers" value="24"          active={state.selectedStat === 'all'} />
        <StatCard id="of-demo-stat-pipeline" icon={<Target className="h-4 w-4" />}       label="In Pipeline"  value="9"           active={state.selectedStat === 'pipeline'} />
        <StatCard id="of-demo-stat-accepted" icon={<CheckCircle2 className="h-4 w-4" />} label="Accepted"     value="7"           active={state.selectedStat === 'accepted'} />
        <StatCard id="of-demo-stat-value"    icon={<DollarSign className="h-4 w-4" />}   label="Total Value"  value="184 200 TND" />
      </div>

      {/* Search + filters + views */}
      <div className="p-3 border-b border-border bg-card space-y-3">
        <div className="flex gap-2 items-center">
          <div id="of-demo-search" className={`relative flex-1 ${state.searchActive ? 'ring-1 ring-primary rounded-md' : ''}`}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <div className="h-9 pl-10 pr-3 rounded-md border border-border bg-background text-sm text-muted-foreground flex items-center">{state.searchActive ? 'médina' : 'Search offers…'}</div>
          </div>
          <div id="of-demo-filters" className={`h-9 px-3 rounded-md border text-sm flex items-center gap-1.5 cursor-default ${state.showFilters ? 'border-primary text-primary bg-primary/5' : 'border-border text-muted-foreground'}`}><Filter className="h-4 w-4" /> Filters</div>
          <div id="of-demo-views" className="flex items-center gap-1 border border-border rounded-md overflow-hidden">
            {([['list', List], ['table', TableIcon]] as const).map(([m, Ic]) => (
              <div key={m} className={`h-9 px-2.5 flex items-center cursor-default ${state.listView === m ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}><Ic className="h-4 w-4" /></div>
            ))}
          </div>
          <div id="of-demo-map" className={`h-9 w-9 rounded-md border flex items-center justify-center cursor-default ${state.showMap ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground'}`}><Map className="h-4 w-4" /></div>
        </div>
        {state.showFilters && (
          <div className="flex gap-2 pt-2 border-t border-border">
            {['Status: Sent', 'Assigned: Me', 'Date: This month'].map(f => <div key={f} className="h-8 px-2.5 rounded-md border border-border text-xs flex items-center gap-2 text-foreground">{f}<ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /></div>)}
          </div>
        )}
      </div>

      {state.showMap ? (
        <div className="p-4"><div className="h-56 rounded-lg border border-border overflow-hidden relative bg-[linear-gradient(135deg,#e8f0e8_0%,#dce9f0_100%)] dark:bg-[linear-gradient(135deg,#1b2a1b_0%,#16242e_100%)]">
          <div className="absolute inset-0 opacity-40" style={{ backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 28px,rgba(120,120,120,.25) 29px),repeating-linear-gradient(90deg,transparent,transparent 28px,rgba(120,120,120,.25) 29px)' }} />
          {[['28%', '40%'], ['62%', '55%'], ['46%', '70%']].map((p, i) => <div key={i} className="absolute -translate-x-1/2 -translate-y-full" style={{ left: p[0], top: p[1] }}><Map className="h-6 w-6 bg-primary text-white rounded-full p-1" /></div>)}
          <div className="absolute bottom-2 left-2 text-[10px] text-muted-foreground bg-background/70 rounded px-2 py-0.5">Offers by customer location</div>
        </div></div>
      ) : (
        <div className="p-4">
          <div id="of-demo-table" className="border border-border rounded-lg overflow-hidden bg-card">
            <table className="w-full text-xs">
              <thead><tr className="border-b border-border/60 bg-muted/30">
                <th className="text-left px-3 py-2 text-muted-foreground font-medium">Offer</th>
                <th className="text-left px-3 py-2 text-muted-foreground font-medium">Customer</th>
                <th className="text-right px-3 py-2 text-muted-foreground font-medium">Amount</th>
                <th className="text-left px-3 py-2 text-muted-foreground font-medium">Status</th>
                <th className="text-left px-3 py-2 text-muted-foreground font-medium">Valid until</th>
              </tr></thead>
              <tbody>
                {DEMO_OFFERS.map(o => (
                  <tr key={o.id} className="border-b border-border/40 last:border-0">
                    <td className="px-3 py-2.5"><div className="font-medium text-primary">{o.num}</div><div className="text-[10px] text-muted-foreground truncate max-w-[180px]">{o.title}</div></td>
                    <td className="px-3 py-2.5"><span className="inline-flex items-center gap-1.5"><span className="h-5 w-5 rounded-full bg-primary/10 text-primary text-[9px] font-bold inline-flex items-center justify-center">{initials(o.customer)}</span>{o.customer}</span></td>
                    <td className="px-3 py-2.5 text-right font-semibold">{fmt(o.amount)} TND</td>
                    <td className="px-3 py-2.5"><Pill s={o.status} /></td>
                    <td className="px-3 py-2.5 text-muted-foreground">{o.valid}</td>
                  </tr>
                ))}
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

function PageCreate({ state }: { state: OffersDemoState }) {
  const step = state.createStep;
  return (
    <div className="p-4 md:p-6 space-y-5 max-w-3xl mx-auto">
      <div className="flex items-center gap-3"><div className="h-8 w-8 rounded border border-border flex items-center justify-center text-muted-foreground text-xs">←</div><h1 className="text-lg font-semibold">New Offer</h1></div>
      <div className="bg-card border border-border rounded-lg p-5 space-y-5">
        <div id="of-demo-create-contact" className={`grid grid-cols-2 gap-4 transition-opacity ${step >= 1 ? '' : 'opacity-40'}`}>
          <Field label="Customer *" active={step === 1}><Box muted={step < 1}>{step >= 1 ? 'Médina Resorts' : 'Select…'}</Box></Field>
          <Field label="Matricule Fiscale"><Box muted={step < 1}>{step >= 1 ? '1234567/A/M/000' : '—'}</Box></Field>
        </div>
        {/* Items */}
        <div id="of-demo-create-items" className={`transition-opacity ${step >= 2 ? '' : 'opacity-40'}`}>
          <div className="flex items-center justify-between mb-2"><span className="text-xs font-medium">Line items</span><span className="h-6 px-2 rounded border border-border text-[10px] text-muted-foreground inline-flex items-center gap-1"><Plus className="h-3 w-3" /> Add</span></div>
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
        {/* Totals */}
        <div id="of-demo-create-totals" className={`flex justify-end transition-opacity ${step >= 3 ? '' : 'opacity-40'}`}>
          <div className="w-64 space-y-1 text-xs">
            <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>{step >= 3 ? '16,000 TND' : '—'}</span></div>
            <div className="flex justify-between text-muted-foreground"><span>Discount −5%</span><span>{step >= 3 ? '−800 TND' : '—'}</span></div>
            <div className="flex justify-between text-muted-foreground"><span>TVA 19%</span><span>{step >= 3 ? '2,888 TND' : '—'}</span></div>
            <div className="flex justify-between text-muted-foreground"><span>Fiscal stamp</span><span>{step >= 3 ? '1 TND' : '—'}</span></div>
            <div className="flex justify-between font-bold text-sm border-t border-border pt-1"><span>Total</span><span>{step >= 3 ? '18,089 TND' : '—'}</span></div>
          </div>
        </div>
        {/* Meta */}
        <div id="of-demo-create-meta" className={`grid grid-cols-3 gap-4 transition-opacity ${step >= 4 ? '' : 'opacity-40'}`}>
          <Field label="Category" active={step === 4}><Box muted={step < 4}>{step >= 4 ? 'Big project' : '—'}</Box></Field>
          <Field label="Source" active={step === 4}><Box muted={step < 4}>{step >= 4 ? 'Referral' : '—'}</Box></Field>
          <Field label="Valid until" active={step === 4}><Box muted={step < 4}>{step >= 4 ? '2025-07-15' : '—'}</Box></Field>
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <div className="h-9 px-4 rounded-md border border-border text-sm flex items-center text-muted-foreground">Cancel</div>
        <div id="of-demo-create-save" className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium flex items-center">Save Offer</div>
      </div>
    </div>
  );
}

// ─── Page: detail ───────────────────────────────────────────────────────────

const STEPPER = ['draft', 'sent', 'accepted'];
function PageDetail({ state }: { state: OffersDemoState }) {
  const O = DEMO_OFFERS[0];
  const tabs = [
    { k: 'overview', l: 'Overview', id: undefined as string | undefined },
    { k: 'items', l: 'Items', id: 'of-demo-tab-items' },
    { k: 'notes', l: 'Notes', id: 'of-demo-tab-notes' },
    { k: 'checklists', l: 'Checklists', id: 'of-demo-tab-checklists' },
    { k: 'documents', l: 'Documents', id: 'of-demo-tab-documents' },
    { k: 'activity', l: 'Activity', id: 'of-demo-tab-activity' },
  ];
  return (
    <div className="flex flex-col max-w-5xl mx-auto w-full relative">
      <div id="of-demo-detail-header" className="flex items-center justify-between gap-4 px-4 py-3 border-b border-border/60">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-8 w-8 rounded border border-border flex items-center justify-center text-muted-foreground text-xs">←</div>
          <div><div className="flex items-center gap-2"><h1 className="text-lg font-semibold">{O.num}</h1><Pill s={state.statusStage >= 2 ? 'accepted' : state.statusStage === 1 ? 'sent' : 'draft'} /></div><p className="text-xs text-muted-foreground">{O.title} · {O.customer} · {fmt(O.amount)} TND</p></div>
        </div>
        <div className="flex gap-2 shrink-0">
          <div id="of-demo-send" className="h-8 px-3 rounded-md border border-border text-xs inline-flex items-center gap-1.5 text-muted-foreground"><Send className="h-3.5 w-3.5" /> Send</div>
          <div id="of-demo-pdf" className="h-8 px-3 rounded-md border border-border text-xs inline-flex items-center gap-1.5 text-muted-foreground"><FileText className="h-3.5 w-3.5" /> PDF</div>
          <div id="of-demo-convert" className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-xs font-medium inline-flex items-center gap-1.5"><GitBranch className="h-3.5 w-3.5" /> Convert</div>
        </div>
      </div>

      {/* Status stepper */}
      <div id="of-demo-status" className="px-4 py-3 border-b border-border/60 bg-muted/20">
        <div className="flex items-center gap-0">
          {STEPPER.map((s, i) => (
            <div key={s} className="flex items-center gap-0">
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium capitalize ${i <= state.statusStage ? 'text-primary bg-primary/10' : 'text-muted-foreground'}`}>
                {i < state.statusStage && <CheckCircle2 className="h-3 w-3" />}{s}
              </div>
              {i < STEPPER.length - 1 && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40" />}
            </div>
          ))}
          <div className="ml-auto flex gap-1.5">
            <span className="px-2 py-1 rounded text-[10px] border border-red-300 text-red-600">Decline</span>
            <span className="px-2 py-1 rounded text-[10px] border border-border text-muted-foreground">Cancel</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border/60 px-4 overflow-x-auto">
        <div className="flex gap-1 -mb-px min-w-max">
          {tabs.map(tab => (
            <div key={tab.k} id={tab.id} className={`inline-flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 cursor-default whitespace-nowrap ${state.activeTab === tab.k ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground'}`}>{tab.l}</div>
          ))}
        </div>
      </div>

      <div className="p-4">
        {state.activeTab === 'overview' && (
          <div id="of-demo-overview" className="grid md:grid-cols-2 gap-4">
            <div className="bg-card border border-border rounded-lg p-4 space-y-2 text-xs">
              <p className="text-sm font-medium mb-1">Customer</p>
              <div className="flex items-center gap-1.5 text-muted-foreground"><Building2 className="h-3 w-3" /> Médina Resorts</div>
              <div className="flex items-center gap-1.5 text-muted-foreground"><User className="h-3 w-3" /> Sami Bouazizi · Facilities Mgr</div>
              <div className="flex items-center gap-1.5 text-muted-foreground"><FileText className="h-3 w-3" /> MF 1234567/A/M/000</div>
              <div className="flex items-center gap-1.5 text-muted-foreground"><Calendar className="h-3 w-3" /> Valid until 30 Jun 2025</div>
            </div>
            <div className="bg-card border border-border rounded-lg p-4 space-y-1.5 text-xs">
              <p className="text-sm font-medium mb-1">Financial summary</p>
              <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>16,000 TND</span></div>
              <div className="flex justify-between text-muted-foreground"><span>TVA + stamp</span><span>2,400 TND</span></div>
              <div className="flex justify-between font-bold text-sm border-t border-border pt-1"><span>Total</span><span>18,400 TND</span></div>
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
        {state.activeTab === 'notes' && (
          <div className="space-y-2">
            {[['Called Sami — wants delivery before July.', 'Ahmed B.', '2025-06-09'], ['Sent revised pricing with 5% discount.', 'Sara M.', '2025-06-05']].map(n => (
              <div key={n[0]} className="flex gap-3 p-3 bg-card border border-border rounded-lg"><span className="h-7 w-7 rounded-full bg-primary/10 text-primary inline-flex items-center justify-center shrink-0"><StickyNote className="h-3.5 w-3.5" /></span><div><p className="text-xs">{n[0]}</p><p className="text-[10px] text-muted-foreground mt-0.5">{n[2]} · {n[1]}</p></div></div>
            ))}
          </div>
        )}
        {state.activeTab === 'checklists' && (
          <div className="space-y-3">
            <div className="bg-card border border-border rounded-lg p-4 space-y-2">
              <p className="text-sm font-medium mb-1 inline-flex items-center gap-2"><ListChecks className="h-4 w-4 text-primary" /> Pre-send checklist <span className="text-[10px] font-normal text-muted-foreground">· offer-level</span></p>
              {[['Site survey completed', true], ['Pricing approved by manager', true], ['Lead time confirmed with supplier', false]].map(c => (
                <div key={c[0] as string} className="flex items-center gap-2 text-xs"><span className={`h-4 w-4 rounded border inline-flex items-center justify-center ${c[1] ? 'bg-primary border-primary' : 'border-border'}`}>{c[1] && <CheckCircle2 className="h-3 w-3 text-primary-foreground" />}</span><span className={c[1] ? 'line-through text-muted-foreground' : ''}>{c[0]}</span></div>
              ))}
            </div>
            {/* Item-level checklist on a service line — follows to the job/dispatch. */}
            <div id="of-demo-item-checklist" className="bg-card border border-primary/30 ring-1 ring-primary/15 rounded-lg p-4 space-y-2">
              <p className="text-sm font-medium mb-1 inline-flex items-center gap-2"><ListChecks className="h-4 w-4 text-primary" /> Service line: Annual Maintenance Plan <span className="text-[10px] font-normal text-primary">· follows to the job →</span></p>
              {[['Inspect & clean unit', false], ['Replace filters', false], ['Performance test & report', false]].map(c => (
                <div key={c[0]} className="flex items-center gap-2 text-xs"><span className="h-4 w-4 rounded border border-border inline-flex items-center justify-center" /><span>{c[0]}</span></div>
              ))}
              <p className="text-[10px] text-muted-foreground pt-1">Carried offer → sale → service-order job → dispatch.</p>
            </div>
          </div>
        )}
        {state.activeTab === 'documents' && (
          <div className="grid grid-cols-2 gap-3">
            {[['Site-survey.pdf', 'Paperclip'], ['Floor-plan.dwg', 'Paperclip'], ['Approval-signed.pdf', 'Paperclip']].map(d => (
              <div key={d[0]} className="flex items-center gap-2.5 p-3 bg-card border border-border rounded-lg"><Paperclip className="h-4 w-4 text-muted-foreground" /><span className="text-xs">{d[0]}</span></div>
            ))}
          </div>
        )}
        {state.activeTab === 'activity' && (
          <div className="space-y-2">
            {[['Offer created', 'Ahmed B.', '2025-06-01'], ['Sent to customer', 'Ahmed B.', '2025-06-02'], ['Opened by customer', '', '2025-06-03'], ['Moved to Negotiation', 'Sara M.', '2025-06-05']].map((a, i, arr) => (
              <div key={a[0]} className="flex gap-3"><div className="flex flex-col items-center shrink-0"><span className="h-6 w-6 rounded-full bg-primary/10 text-primary inline-flex items-center justify-center"><Activity className="h-3 w-3" /></span>{i < arr.length - 1 && <div className="w-px flex-1 bg-border mt-1" />}</div><div className="pb-1"><p className="text-xs font-medium">{a[0]}</p><p className="text-[10px] text-muted-foreground">{a[2]}{a[1] ? ` · ${a[1]}` : ''}</p></div></div>
            ))}
          </div>
        )}
      </div>

      {/* Send dialog */}
      {state.sendOpen && (
        <div className="absolute inset-0 z-[6] flex items-start justify-center pt-10 bg-background/40">
          <div className="w-[440px] bg-card border border-border rounded-xl shadow-2xl p-4">
            <p className="text-sm font-semibold mb-3 inline-flex items-center gap-2"><Mail className="h-4 w-4" /> Send Offer</p>
            <div className="space-y-2 text-xs">
              <Box>sami.b@medina.tn</Box>
              <div className="h-20 rounded-md border border-border p-2 text-muted-foreground">Please find attached our quote OFF-2025-031. Valid until 30 June.</div>
              <div className="flex items-center gap-1.5 text-muted-foreground"><Paperclip className="h-3 w-3" /> OFF-2025-031.pdf attached · sent 2 times</div>
            </div>
            <div className="flex justify-end gap-2 mt-3"><div className="h-8 px-3 rounded-md border border-border text-xs flex items-center text-muted-foreground">Cancel</div><div className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-xs font-medium inline-flex items-center gap-1.5"><Send className="h-3.5 w-3.5" /> Send</div></div>
          </div>
        </div>
      )}

      {/* PDF preview + settings */}
      {state.pdfOpen && (
        <div className="absolute inset-0 z-[6] flex items-center justify-center bg-background/50 p-6">
          <div className="flex gap-3 h-full max-h-[80%]">
            <div id="of-demo-pdf-download" className="w-72 bg-white text-black rounded-lg shadow-2xl border border-border overflow-hidden flex flex-col">
              <div className="bg-primary/90 text-white p-3"><div className="text-sm font-bold">QUOTE · OFF-2025-031</div><div className="text-[9px] opacity-90">Flowentra SARL · MF 0000000/A/M/000</div></div>
              <div className="p-3 text-[9px] space-y-2 flex-1">
                <div className="flex justify-between"><div><div className="font-semibold">Bill to</div><div>Médina Resorts</div><div>MF 1234567/A/M/000</div></div><div className="text-right"><div>Date 02/06/2025</div><div>Valid 30/06/2025</div></div></div>
                <table className="w-full"><thead><tr className="border-b border-gray-300"><th className="text-left py-0.5">Item</th><th className="text-right">Total</th></tr></thead><tbody>
                  <tr><td className="py-0.5">Split AC unit ×6</td><td className="text-right">12,600</td></tr>
                  <tr><td className="py-0.5">Installation</td><td className="text-right">3,400</td></tr>
                </tbody></table>
                <div className="text-right space-y-0.5 border-t border-gray-300 pt-1"><div>TVA 19% · stamp 1</div><div className="font-bold text-[11px]">Total 18,400 TND</div></div>
              </div>
            </div>
            {state.pdfSettings && (
              <div id="of-demo-pdf-settings" className="w-56 bg-card border border-border rounded-lg shadow-2xl p-3">
                <p className="text-xs font-semibold mb-2 inline-flex items-center gap-1.5"><Palette className="h-3.5 w-3.5 text-primary" /> PDF Studio</p>
                <div className="flex gap-1 mb-3 border-b border-border pb-2">{['Colours', 'Type', 'Layout', 'Data'].map((t, i) => <span key={t} className={`text-[10px] px-1.5 py-0.5 rounded ${i === 0 ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>{t}</span>)}</div>
                <div className="space-y-2">
                  <div><div className="text-[10px] text-muted-foreground mb-1">Accent colour</div><div className="flex gap-1">{['bg-primary', 'bg-blue-500', 'bg-emerald-500', 'bg-rose-500', 'bg-amber-500'].map((c, i) => <span key={c} className={`h-5 w-5 rounded ${c} ${i === 0 ? 'ring-2 ring-offset-1 ring-foreground' : ''}`} />)}</div></div>
                  <div><div className="text-[10px] text-muted-foreground mb-1">Font</div><div className="h-7 rounded border border-border text-[11px] flex items-center px-2">Inter</div></div>
                  <div className="flex items-center justify-between"><span className="text-[11px]">Show fiscal stamp</span><span className="h-4 w-7 rounded-full bg-primary relative"><span className="absolute top-0.5 left-3.5 h-3 w-3 rounded-full bg-white" /></span></div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Convert modal */}
      {state.convertOpen && (
        <div className="absolute inset-0 z-[6] flex items-center justify-center bg-background/40">
          <div id="of-demo-convert-options" className="w-[440px] bg-card border border-border rounded-xl shadow-2xl p-4">
            <p className="text-sm font-semibold mb-1 inline-flex items-center gap-2"><GitBranch className="h-4 w-4 text-primary" /> Convert Offer</p>
            <p className="text-xs text-muted-foreground mb-3">OFF-2025-031 · 2 products · 1 service</p>
            <div className="space-y-2">
              <div className="flex items-center gap-2.5 p-2.5 rounded-lg border border-primary bg-primary/5"><span className="h-4 w-4 rounded bg-primary border border-primary inline-flex items-center justify-center"><CheckCircle2 className="h-3 w-3 text-primary-foreground" /></span><ShoppingCart className="h-4 w-4 text-primary" /><div><p className="text-xs font-medium">Convert to Sale</p><p className="text-[10px] text-muted-foreground">Invoice the customer for 18,400 TND</p></div></div>
              <div className="flex items-center gap-2.5 p-2.5 rounded-lg border border-primary bg-primary/5"><span className="h-4 w-4 rounded bg-primary border border-primary inline-flex items-center justify-center"><CheckCircle2 className="h-3 w-3 text-primary-foreground" /></span><Wrench className="h-4 w-4 text-primary" /><div><p className="text-xs font-medium">Convert to Service Order</p><p className="text-[10px] text-muted-foreground">Dispatch the installation work</p></div></div>
            </div>
            <div className="flex justify-end gap-2 mt-3"><div className="h-8 px-3 rounded-md border border-border text-xs flex items-center text-muted-foreground">Cancel</div><div className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-xs font-medium inline-flex items-center gap-1.5"><GitBranch className="h-3.5 w-3.5" /> Convert</div></div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main shell ─────────────────────────────────────────────────────────────

export function OffersAutopilotDemo({ open, onClose }: Props) {
  const { i18n } = useTranslation();
  const [stepIndex, setStepIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(false);
  const [cursor, setCursor] = useState<{ x: number; y: number; clicking: boolean }>({ x: -200, y: -200, clicking: false });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clickRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const finished = stepIndex >= OF_STEPS.length;
  const state: OffersDemoState = useMemo(() => {
    let s = initialOffersDemoState;
    for (let i = 0; i < Math.min(stepIndex + 1, OF_STEPS.length); i++) s = OF_STEPS[i].apply(s);
    return s;
  }, [stepIndex]);

  const step = OF_STEPS[Math.min(stepIndex, OF_STEPS.length - 1)];
  const demoLang = pickLang(i18n.language);
  const captionText = getCaption(demoLang, Math.min(stepIndex, OF_STEPS.length - 1), step.caption);
  const finishedMsg =
    demoLang === 'fr' ? 'Votre module Offres est prêt — créez votre premier devis.' :
    'Your Offers module is ready — create your first quote.';

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
  }, [stepIndex, open, finished, step?.target, state.page, state.activeTab, state.listView, state.showFilters, state.showMap, state.showExport, state.createStep, state.sendOpen, state.pdfOpen, state.pdfSettings, state.convertOpen]);
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
      chunks.forEach((chunk, idx) => { const u = new SpeechSynthesisUtterance(chunk); u.lang = bcp47; if (voice) u.voice = voice; u.rate = 0.86; u.pitch = idx % 2 === 0 ? 1.02 : 0.98; u.volume = 1; if (idx === chunks.length - 1) { u.onend = doAdvance; u.onerror = doAdvance; } try { synth.speak(u); } catch { /* */ } });
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
  const activeChapter = OF_CHAPTERS.find(c => stepIndex >= c.start && stepIndex < c.end) || OF_CHAPTERS[OF_CHAPTERS.length - 1];

  return (
    <div className="fixed inset-0 z-[110] bg-background flex flex-col select-none">
      <div className="h-12 shrink-0 border-b border-border/60 bg-card flex items-center px-3 gap-3">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="h-7 w-7 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-sm shrink-0"><FileText className="h-3.5 w-3.5 text-primary-foreground" /></span>
          <span className="text-sm font-semibold truncate">Offers — Live Demo</span>
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
          {OF_CHAPTERS.map(ch => (
            <button key={ch.id} onClick={() => jumpChapter(ch.start)} className={`text-[10px] font-medium px-2 py-0.5 rounded-full transition-colors cursor-pointer ${activeChapter.id === ch.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/70'}`}>{getChapterTitle(demoLang, ch.id, ch.title)}</button>
          ))}
          <span className="ml-auto text-[10px] text-muted-foreground">{Math.min(stepIndex + 1, OF_STEPS.length)} / {OF_STEPS.length}</span>
        </div>
        <div className="h-1 rounded-full bg-muted overflow-hidden mb-2"><div className="h-full bg-primary transition-all duration-300" style={{ width: `${(Math.min(stepIndex + 1, OF_STEPS.length) / OF_STEPS.length) * 100}%` }} /></div>
        <p className="text-sm text-foreground/90 min-h-[20px] flex items-center gap-2"><Languages className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />{finished ? finishedMsg : captionText}</p>
      </div>

      {!finished && <DemoCursor x={cursor.x} y={cursor.y} clicking={cursor.clicking} />}

      {finished && (
        <div className="absolute inset-0 z-[115] flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl shadow-2xl p-6 max-w-sm text-center">
            <div className="h-12 w-12 mx-auto rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center mb-3"><FileText className="h-6 w-6 text-primary-foreground" /></div>
            <h3 className="text-lg font-semibold mb-1">Quote, win, convert</h3>
            <p className="text-sm text-muted-foreground mb-5">Visual pipeline · Compliant builder · Branded PDFs · Email tracking · One-click conversion to sales.</p>
            <div className="flex flex-col gap-2">
              <button onClick={onClose} className="w-full h-10 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 cursor-pointer">Create your first offer</button>
              <button onClick={restart} className="w-full h-9 rounded-lg border border-border text-sm font-medium hover:bg-muted/40 inline-flex items-center justify-center gap-1.5 cursor-pointer"><RotateCcw className="h-3.5 w-3.5" /> Replay</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

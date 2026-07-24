import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  X, Play, Pause, RotateCcw, Volume2, VolumeX, Languages,
  ClipboardList, Search, Filter, List, Table as TableIcon, LayoutGrid, Map, Download,
  Plus, Wrench, Target, CheckCircle2, DollarSign, Building2, User, MapPin, Clock,
  Calendar, Paperclip, ListChecks, Activity, ChevronRight, ChevronDown, Palette,
  Send, FileText, Package, Truck, GitBranch, UserCheck, Timer,
} from 'lucide-react';
import { DemoCursor } from '@/modules/external/components/onboarding/DemoCursor';
import { pickBestVoice, splitForSpeech, languageTagFor, configureUtteranceForFemaleVoice } from '@/modules/external/components/onboarding/narrationVoice';
import {
  SO_STEPS, SO_CHAPTERS, initialSODemoState,
  type SODemoState,
} from './serviceOrdersDemoScript';
import { pickLang, getCaption, getChapterTitle } from './serviceOrdersDemoTranslations';

interface Props { open: boolean; onClose: () => void; }

const fmt = (n: number) => n.toLocaleString('fr-TN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const DEMO_ORDERS = [
  { id: 'o1', num: 'SO-2025-044', title: 'AC Overhaul',     customer: 'Médina Resorts',  type: 'Repair',      status: 'in_progress', priority: 'high',   date: 'Mon 16 Jun', amount: 18400 },
  { id: 'o2', num: 'SO-2025-051', title: 'Leak Repair',     customer: 'Acme Industries',  type: 'Repair',      status: 'scheduled',   priority: 'urgent', date: 'Tue 17 Jun', amount: 7600 },
  { id: 'o3', num: 'SO-2025-058', title: 'Pump Inspection', customer: 'Hydro Parts',      type: 'Inspection',  status: 'pending',     priority: 'medium', date: '—',          amount: 9200 },
  { id: 'o4', num: 'SO-2025-040', title: 'Annual Service',  customer: 'Sahara Foods',     type: 'Maintenance', status: 'completed',   priority: 'low',    date: 'Wed 11 Jun', amount: 4200 },
];

const STATUS_CLS: Record<string, string> = {
  pending:               'bg-muted text-muted-foreground',
  scheduled:             'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  in_progress:           'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  technically_completed: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  completed:             'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  invoiced:              'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
};
function Pill({ s }: { s: string }) { return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${STATUS_CLS[s] ?? 'bg-muted text-muted-foreground'}`}>{s.replace(/_/g, ' ')}</span>; }
const PRIO_CLS: Record<string, string> = { urgent: 'bg-red-500', high: 'bg-orange-400', medium: 'bg-blue-400', low: 'bg-gray-300' };
const initials = (n: string) => n.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);

const STEPPER = ['pending', 'scheduled', 'in_progress', 'technically_completed', 'invoiced', 'closed'];

function StatCard({ id, icon, label, value, active }: { id: string; icon: React.ReactNode; label: string; value: string; active?: boolean }) {
  return (
    <div id={id} className={`rounded-lg p-3 border cursor-default transition-all ${active ? 'border-2 border-primary bg-primary/5' : 'border-border bg-card'}`}>
      <div className="flex items-center gap-2.5"><span className={`p-2 rounded-lg ${active ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>{icon}</span><div className="min-w-0"><p className="text-[11px] text-muted-foreground font-medium truncate">{label}</p><p className="text-sm font-bold">{value}</p></div></div>
    </div>
  );
}

function PageList({ state }: { state: SODemoState }) {
  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-border bg-card/50">
        <div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-primary/10"><ClipboardList className="h-6 w-6 text-primary" /></div><div><h1 id="so-demo-title" className="text-xl font-semibold">Service Orders</h1><p className="text-[11px] text-muted-foreground">Field work orders</p></div></div>
        <div id="so-demo-create-open" className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-xs font-medium inline-flex items-center gap-1.5 cursor-default"><Plus className="h-3.5 w-3.5" /> New Order</div>
      </div>

      <div className="p-4 border-b border-border grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard id="so-demo-stat-total"     icon={<ClipboardList className="h-4 w-4" />} label="Total Orders" value="42"          active={state.selectedStat === 'all'} />
        <StatCard id="so-demo-stat-active"    icon={<Target className="h-4 w-4" />}        label="Active"       value="15"          active={state.selectedStat === 'active'} />
        <StatCard id="so-demo-stat-completed" icon={<CheckCircle2 className="h-4 w-4" />}  label="Completed"    value="23"          active={state.selectedStat === 'completed'} />
        <StatCard id="so-demo-stat-value"     icon={<DollarSign className="h-4 w-4" />}    label="Total Value"  value="284 600 TND" />
      </div>

      <div className="p-3 border-b border-border bg-card space-y-3">
        <div className="flex gap-2 items-center">
          <div id="so-demo-search" className={`relative flex-1 ${state.searchActive ? 'ring-1 ring-primary rounded-md' : ''}`}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <div className="h-9 pl-10 pr-3 rounded-md border border-border bg-background text-sm text-muted-foreground flex items-center">{state.searchActive ? 'médina' : 'Search orders…'}</div>
          </div>
          <div id="so-demo-filters" className={`h-9 px-3 rounded-md border text-sm flex items-center gap-1.5 cursor-default ${state.showFilters ? 'border-primary text-primary bg-primary/5' : 'border-border text-muted-foreground'}`}><Filter className="h-4 w-4" /> Filters</div>
          <div id="so-demo-views" className="flex items-center gap-1 border border-border rounded-md overflow-hidden">
            {([['table', TableIcon], ['list', List], ['map', Map]] as const).map(([m, Ic]) => (
              <div key={m} className={`h-9 px-2.5 flex items-center cursor-default ${state.listView === m ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}><Ic className="h-4 w-4" /></div>
            ))}
          </div>
        </div>
        {state.showFilters && <div className="flex gap-2 pt-2 border-t border-border">{['Status: Scheduled', 'Priority: Urgent', 'Date: This week'].map(f => <div key={f} className="h-8 px-2.5 rounded-md border border-border text-xs flex items-center gap-2 text-foreground">{f}<ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /></div>)}</div>}
      </div>

      {state.bulkBar && (
        <div id="so-demo-bulk" className="bg-primary/5 border-b border-primary/20 p-3 flex items-center justify-between">
          <div className="flex items-center gap-3"><span className="h-4 w-4 rounded bg-primary border border-primary inline-flex items-center justify-center"><span className="h-2 w-2 bg-primary-foreground rounded-sm" /></span><span className="text-sm font-medium">3 selected</span></div>
          <div className="flex gap-2"><div className="h-8 px-3 rounded-md border border-border text-xs inline-flex items-center gap-1.5 text-muted-foreground"><CheckCircle2 className="h-3.5 w-3.5" /> Update status</div><div className="h-8 px-3 rounded-md border border-border text-xs inline-flex items-center gap-1.5 text-muted-foreground"><Download className="h-3.5 w-3.5" /> Export</div></div>
        </div>
      )}

      {state.listView === 'map' ? (
        <div className="p-4"><div className="h-64 rounded-lg border border-border overflow-hidden relative bg-[linear-gradient(135deg,#e8f0e8_0%,#dce9f0_100%)] dark:bg-[linear-gradient(135deg,#1b2a1b_0%,#16242e_100%)]">
          <div className="absolute inset-0 opacity-40" style={{ backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 30px,rgba(120,120,120,.22) 31px),repeating-linear-gradient(90deg,transparent,transparent 30px,rgba(120,120,120,.22) 31px)' }} />
          {[['28%', '40%', 'bg-amber-500'], ['60%', '55%', 'bg-blue-500'], ['46%', '72%', 'bg-muted-foreground'], ['70%', '32%', 'bg-green-600']].map((p, i) => (
            <div key={i} id={i === 0 ? 'so-demo-map-pin' : undefined} className="absolute -translate-x-1/2 -translate-y-full" style={{ left: p[0], top: p[1] }}><MapPin className={`h-6 w-6 ${p[2]} text-white rounded-full p-0.5`} fill="currentColor" /></div>
          ))}
          <div id="so-demo-map" className="absolute bottom-2 left-2 text-[10px] text-muted-foreground bg-background/70 rounded px-2 py-0.5">4 orders mapped · by status</div>
        </div></div>
      ) : (
        <div className="p-4">
          <div id="so-demo-table" className="border border-border rounded-lg overflow-hidden bg-card">
            <table className="w-full text-xs">
              <thead><tr className="border-b border-border/60 bg-muted/30">
                {state.bulkBar && <th className="w-8 px-3 py-2" />}
                <th className="text-left px-3 py-2 text-muted-foreground font-medium">Order</th>
                <th className="text-left px-3 py-2 text-muted-foreground font-medium">Customer</th>
                <th className="text-left px-3 py-2 text-muted-foreground font-medium">Type</th>
                <th className="text-left px-3 py-2 text-muted-foreground font-medium">Status</th>
                <th className="text-left px-3 py-2 text-muted-foreground font-medium">Priority</th>
                <th className="text-left px-3 py-2 text-muted-foreground font-medium">Scheduled</th>
              </tr></thead>
              <tbody>
                {DEMO_ORDERS.map((o, i) => (
                  <tr key={o.id} className={`border-b border-border/40 last:border-0 ${state.bulkBar && i < 3 ? 'bg-primary/5' : ''}`}>
                    {state.bulkBar && <td className="px-3 py-2.5"><span className={`h-3.5 w-3.5 rounded border inline-block ${i < 3 ? 'bg-primary border-primary' : 'border-border bg-background'}`} /></td>}
                    <td className="px-3 py-2.5"><div className="font-medium text-primary">{o.num}</div><div className="text-[10px] text-muted-foreground">{o.title}</div></td>
                    <td className="px-3 py-2.5"><span className="inline-flex items-center gap-1.5"><span className="h-5 w-5 rounded-full bg-primary/10 text-primary text-[9px] font-bold inline-flex items-center justify-center">{initials(o.customer)}</span>{o.customer}</span></td>
                    <td className="px-3 py-2.5 text-muted-foreground">{o.type}</td>
                    <td className="px-3 py-2.5"><Pill s={o.status} /></td>
                    <td className="px-3 py-2.5"><span className="inline-flex items-center gap-1.5"><span className={`w-2 h-2 rounded-full ${PRIO_CLS[o.priority]}`} /><span className="capitalize">{o.priority}</span></span></td>
                    <td className="px-3 py-2.5 text-muted-foreground">{o.date}</td>
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

const Box = ({ children, muted }: { children: React.ReactNode; muted?: boolean }) => (<div className={`h-9 px-3 rounded-md border border-border text-sm flex items-center ${muted ? 'text-muted-foreground' : 'text-foreground'}`}>{children}</div>);
function Field({ id, label, children, active }: { id?: string; label: string; children: React.ReactNode; active?: boolean }) {
  return <div id={id} className={`rounded-md transition-all ${active ? 'ring-1 ring-primary/40 bg-primary/[0.03] p-2 -m-2' : ''}`}><label className="block text-xs font-medium text-foreground mb-1.5">{label}</label>{children}</div>;
}

function PageCreate({ state }: { state: SODemoState }) {
  const step = state.createStep;
  return (
    <div className="p-4 md:p-6 space-y-5 max-w-3xl mx-auto">
      <div className="flex items-center gap-3"><div className="h-8 w-8 rounded border border-border flex items-center justify-center text-muted-foreground text-xs">←</div><h1 className="text-lg font-semibold">New Service Order</h1></div>
      <div className="bg-card border border-border rounded-lg p-5 space-y-5">
        <div id="so-demo-create-customer" className={`grid grid-cols-2 gap-4 transition-opacity ${step >= 1 ? '' : 'opacity-40'}`}>
          <Field label="Customer *" active={step === 1}><Box muted={step < 1}>{step >= 1 ? 'Médina Resorts' : 'Search…'}</Box></Field>
          <Field label="Site address"><Box muted={step < 1}>{step >= 1 ? 'Sousse, Route Touristique' : '—'}</Box></Field>
        </div>
        <div id="so-demo-create-repair" className={`grid grid-cols-3 gap-4 transition-opacity ${step >= 2 ? '' : 'opacity-40'}`}>
          <Field label="Service type" active={step === 2}><Box muted={step < 2}>{step >= 2 ? 'Repair' : '—'}</Box></Field>
          <Field label="Installation" active={step === 2}><Box muted={step < 2}>{step >= 2 ? 'Cold Room #3' : '—'}</Box></Field>
          <Field label="Priority" active={step === 2}><Box muted={step < 2}>{step >= 2 ? 'High' : '—'}</Box></Field>
        </div>
        <div id="so-demo-create-jobs" className={`transition-opacity ${step >= 3 ? '' : 'opacity-40'}`}>
          <div className="flex items-center justify-between mb-2"><span className="text-xs font-medium">Jobs</span><span className="h-6 px-2 rounded border border-border text-[10px] text-muted-foreground inline-flex items-center gap-1"><Plus className="h-3 w-3" /> Add job</span></div>
          <div className="border border-border rounded-md overflow-hidden">
            <table className="w-full text-xs">
              <thead><tr className="bg-muted/40 border-b border-border"><th className="text-left px-3 py-1.5 text-muted-foreground">Job</th><th className="text-right px-3 py-1.5 text-muted-foreground">Duration</th><th className="text-left px-3 py-1.5 text-muted-foreground">Skills</th></tr></thead>
              <tbody>
                {step >= 3 ? [['Diagnose compressor fault', '90 min', 'HVAC'], ['Replace condenser unit', '120 min', 'HVAC · Welding']].map(r => (
                  <tr key={r[0]} className="border-b border-border/40 last:border-0"><td className="px-3 py-1.5"><span className="inline-flex items-center gap-1.5"><Wrench className="h-3 w-3 text-muted-foreground" />{r[0]}</span></td><td className="px-3 py-1.5 text-right">{r[1]}</td><td className="px-3 py-1.5 text-muted-foreground">{r[2]}</td></tr>
                )) : <tr><td colSpan={3} className="px-3 py-4 text-center text-muted-foreground">No jobs yet</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-2"><div className="h-9 px-4 rounded-md border border-border text-sm flex items-center text-muted-foreground">Cancel</div><div id="so-demo-create-save" className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium flex items-center">Save Order</div></div>
    </div>
  );
}

function PageDetail({ state }: { state: SODemoState }) {
  const O = DEMO_ORDERS[0];
  const tabs = [
    { k: 'overview', l: 'Overview', id: undefined as string | undefined },
    { k: 'jobs', l: 'Jobs', id: 'so-demo-tab-jobs' },
    { k: 'dispatches', l: 'Dispatches', id: 'so-demo-tab-dispatches' },
    { k: 'time_expenses', l: 'Time & Expenses', id: 'so-demo-tab-time' },
    { k: 'materials', l: 'Materials', id: 'so-demo-tab-materials' },
    { k: 'attachments', l: 'Attachments', id: 'so-demo-tab-attachments' },
    { k: 'checklists', l: 'Checklists', id: 'so-demo-tab-checklists' },
    { k: 'activity', l: 'Activity', id: 'so-demo-tab-activity' },
  ];
  const curStatus = STEPPER[Math.min(state.statusStage, STEPPER.length - 1)];
  return (
    <div className="flex flex-col max-w-5xl mx-auto w-full relative">
      <div id="so-demo-detail-header" className="flex items-center justify-between gap-4 px-4 py-3 border-b border-border/60">
        <div className="flex items-center gap-3 min-w-0"><div className="h-8 w-8 rounded border border-border flex items-center justify-center text-muted-foreground text-xs">←</div><div><div className="flex items-center gap-2"><h1 className="text-lg font-semibold">{O.num}</h1><Pill s={curStatus} /></div><p className="text-xs text-muted-foreground">{O.title} · {O.customer} · {O.type}</p></div></div>
        <div className="flex gap-2 shrink-0">
          <div id="so-demo-invoice" className="h-8 px-3 rounded-md border border-border text-xs inline-flex items-center gap-1.5 text-muted-foreground"><FileText className="h-3.5 w-3.5" /> Invoice</div>
          <div id="so-demo-pdf" className="h-8 px-3 rounded-md border border-border text-xs inline-flex items-center gap-1.5 text-muted-foreground"><Download className="h-3.5 w-3.5" /> PDF</div>
          <div id="so-demo-send" className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-xs font-medium inline-flex items-center gap-1.5"><Send className="h-3.5 w-3.5" /> Send</div>
        </div>
      </div>

      <div id="so-demo-status" className="px-4 py-3 border-b border-border/60 bg-muted/20 overflow-x-auto">
        <div className="flex items-center gap-0 min-w-max">
          {STEPPER.map((s, i) => (
            <div key={s} className="flex items-center gap-0">
              <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[10px] font-medium capitalize whitespace-nowrap ${i <= state.statusStage ? 'text-primary bg-primary/10' : 'text-muted-foreground'}`}>{i < state.statusStage && <CheckCircle2 className="h-3 w-3" />}{s.replace(/_/g, ' ')}</div>
              {i < STEPPER.length - 1 && <ChevronRight className="h-3 w-3 text-muted-foreground/40" />}
            </div>
          ))}
        </div>
      </div>

      <div className="border-b border-border/60 px-4 overflow-x-auto"><div className="flex gap-1 -mb-px min-w-max">{tabs.map(tab => (<div key={tab.k} id={tab.id} className={`inline-flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 cursor-default whitespace-nowrap ${state.activeTab === tab.k ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground'}`}>{tab.l}</div>))}</div></div>

      <div className="p-4">
        {state.activeTab === 'overview' && (
          <div id="so-demo-overview" className="grid md:grid-cols-2 gap-4">
            <div className="bg-card border border-border rounded-lg p-4 space-y-2 text-xs">
              <p className="text-sm font-medium mb-1">Customer &amp; site</p>
              <div className="flex items-center gap-1.5 text-muted-foreground"><Building2 className="h-3 w-3" /> Médina Resorts</div>
              <div className="flex items-center gap-1.5 text-muted-foreground"><MapPin className="h-3 w-3" /> Sousse, Route Touristique</div>
              <div className="flex items-center gap-1.5 text-muted-foreground"><Wrench className="h-3 w-3" /> Problem: AC not cooling — Cold Room #3</div>
              <div className="flex items-center gap-1.5 text-muted-foreground"><GitBranch className="h-3 w-3" /> From sale INV-2025-044</div>
            </div>
            <div className="bg-card border border-border rounded-lg p-4 space-y-1.5 text-xs">
              <p className="text-sm font-medium mb-1">Summary</p>
              <div className="flex justify-between text-muted-foreground"><span>Jobs</span><span>2 · 1 done</span></div>
              <div className="flex justify-between text-muted-foreground"><span>Labour</span><span>3.5 h</span></div>
              <div className="flex justify-between text-muted-foreground"><span>Materials</span><span>4 parts</span></div>
              <div className="flex justify-between font-bold text-sm border-t border-border pt-1"><span>Est. value</span><span>18,400 TND</span></div>
              <div id="so-demo-preferred-skills" className={`mt-2 pt-2 border-t border-border/60 transition-all ${state.preferredSkills ? 'ring-1 ring-primary/40 rounded-md p-2 -m-1 bg-primary/[0.04]' : ''}`}>
                <p className="text-[10px] text-muted-foreground mb-1 inline-flex items-center gap-1"><Wrench className="h-2.5 w-2.5" /> Preferred skills · read from sale line</p>
                <div className="flex flex-wrap gap-1">{['HVAC', 'Welding', 'Electrical'].map(s => <span key={s} className="px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-medium">{s}</span>)}</div>
              </div>
            </div>
          </div>
        )}
        {state.activeTab === 'jobs' && (
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <table className="w-full text-xs"><thead><tr className="bg-muted/30 border-b border-border/60"><th className="text-left px-4 py-2 text-muted-foreground">Job</th><th className="text-left px-4 py-2 text-muted-foreground">Status</th><th className="text-right px-4 py-2 text-muted-foreground">Duration</th></tr></thead><tbody>
              {[['Diagnose compressor fault', 'completed', '90 min'], ['Replace condenser unit', 'in_progress', '120 min']].map(r => (<tr key={r[0]} className="border-b border-border/40 last:border-0"><td className="px-4 py-2.5 font-medium"><span className="inline-flex items-center gap-1.5"><Wrench className="h-3 w-3 text-muted-foreground" />{r[0]}</span></td><td className="px-4 py-2.5"><Pill s={r[1]} /></td><td className="px-4 py-2.5 text-right">{r[2]}</td></tr>))}
            </tbody></table>
          </div>
        )}
        {state.activeTab === 'dispatches' && (
          <div className="space-y-2">
            {[['DISP-2025-101', 'Karim T.', 'in_progress', 'Mon 16 Jun · 09:00'], ['DISP-2025-108', 'Leïla M.', 'completed', 'Sun 15 Jun · 14:00']].map(d => (
              <div key={d[0]} className="flex items-center justify-between p-3 bg-card border border-border rounded-lg"><div className="flex items-center gap-2.5"><Truck className="h-4 w-4 text-primary" /><div><p className="text-xs font-medium">{d[0]}</p><p className="text-[10px] text-muted-foreground inline-flex items-center gap-1"><UserCheck className="h-2.5 w-2.5" /> {d[1]} · {d[3]}</p></div></div><Pill s={d[2]} /></div>
            ))}
          </div>
        )}
        {state.activeTab === 'time_expenses' && (
          <div className="space-y-3">
            {state.planVsActual && (
              <div id="so-demo-plan-vs-actual" className="rounded-lg border-2 border-dashed border-primary/40 bg-primary/5 p-3 space-y-2">
                <div className="flex items-center justify-between text-xs flex-wrap gap-2">
                  <p className="font-medium inline-flex items-center gap-1.5 text-primary"><Target className="h-3.5 w-3.5" /> Plan · inherited from Sale item lineage</p>
                  <span id="so-demo-overrun" className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">Actual 3.5 h / Plan 3.0 h · +17%</span>
                </div>
                <div className="grid md:grid-cols-3 gap-2 text-[10px]">
                  <div className="p-2 rounded border border-border bg-card"><div className="text-muted-foreground">Planned labour</div><div className="font-semibold text-xs">3.0 h · 1 tech</div><div className="text-muted-foreground">from offer line OFF-2025-031 · L2</div></div>
                  <div className="p-2 rounded border border-border bg-card"><div className="text-muted-foreground">Planned expenses</div><div className="font-semibold text-xs">45 TND · travel</div><div className="text-muted-foreground">from sale line INV-2025-044 · L2</div></div>
                  <div className="p-2 rounded border border-border bg-card"><div className="text-muted-foreground">Planned materials</div><div className="font-semibold text-xs">1× condenser · 4 kg R410A</div><div className="text-muted-foreground">from sale line INV-2025-044 · L1</div></div>
                </div>
              </div>
            )}
            <div className="grid md:grid-cols-2 gap-3">
              <div className="bg-card border border-border rounded-lg p-3">
                <div className="flex items-center justify-between mb-2"><p className="text-sm font-medium inline-flex items-center gap-1.5"><Clock className="h-4 w-4 text-primary" /> Time{state.planVsActual ? ' · actual' : ''}</p><span className="h-6 px-2 rounded bg-primary/10 text-primary text-[10px] inline-flex items-center gap-1"><Timer className="h-3 w-3" /> Book time</span></div>
                {[['Karim T.', '2.0 h'], ['Leïla M.', '1.5 h']].map(t => <div key={t[0]} className="flex justify-between text-xs py-1 border-b border-border/40 last:border-0"><span>{t[0]}</span><span className="font-medium">{t[1]}</span></div>)}
                <div className="flex justify-between text-xs pt-1 font-semibold"><span>Total</span><span>3.5 h</span></div>
              </div>
              <div className="bg-card border border-border rounded-lg p-3">
                <div className="flex items-center justify-between mb-2"><p className="text-sm font-medium inline-flex items-center gap-1.5"><DollarSign className="h-4 w-4 text-primary" /> Expenses{state.planVsActual ? ' · actual' : ''}</p><span className="h-6 px-2 rounded bg-primary/10 text-primary text-[10px] inline-flex items-center gap-1"><Plus className="h-3 w-3" /> Add expense</span></div>
                {[['Travel', '45 TND'], ['Parking', '8 TND']].map(t => <div key={t[0]} className="flex justify-between text-xs py-1 border-b border-border/40 last:border-0"><span>{t[0]}</span><span className="font-medium">{t[1]}</span></div>)}
                <div className="flex justify-between text-xs pt-1 font-semibold"><span>Total</span><span>53 TND</span></div>
              </div>
            </div>
          </div>
        )}
        {state.activeTab === 'materials' && (
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <table className="w-full text-xs"><thead><tr className="bg-muted/30 border-b border-border/60"><th className="text-left px-4 py-2 text-muted-foreground">Part</th><th className="text-right px-4 py-2 text-muted-foreground">Qty</th><th className="text-right px-4 py-2 text-muted-foreground">From stock</th></tr></thead><tbody>
              {[['Condenser unit CU-12', '1', 'Sfax Main'], ['Refrigerant R410A', '4 kg', 'Van stock'], ['Seal kit SK-12', '2', 'Sfax Main']].map(r => (<tr key={r[0]} className="border-b border-border/40 last:border-0"><td className="px-4 py-2.5 font-medium inline-flex items-center gap-1.5"><Package className="h-3 w-3 text-muted-foreground" />{r[0]}</td><td className="px-4 py-2.5 text-right">{r[1]}</td><td className="px-4 py-2.5 text-right text-muted-foreground">{r[2]}</td></tr>))}
            </tbody></table>
          </div>
        )}
        {state.activeTab === 'attachments' && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">{[['before.jpg'], ['after.jpg'], ['work-report-signed.pdf'], ['delivery-note.pdf']].map(d => <div key={d[0]} className="flex items-center gap-2.5 p-3 bg-card border border-border rounded-lg"><Paperclip className="h-4 w-4 text-muted-foreground" /><span className="text-xs truncate">{d[0]}</span></div>)}</div>
        )}
        {state.activeTab === 'checklists' && (
          <div id="so-demo-job-checklists" className="space-y-3">
            {/* Per-job checklists carried from the sale's service lines. */}
            {[['Replace condenser unit', [['Power isolated before work', true], ['Old unit removed safely', true], ['New unit tested & cooling', false]]], ['Annual Maintenance Plan', [['Inspect & clean unit', false], ['Replace filters', false], ['Performance report', false]]]].map(([job, items]) => (
              <div key={job as string} className="bg-card border border-border rounded-lg p-4 space-y-1.5">
                <p className="text-sm font-medium inline-flex items-center gap-2"><ListChecks className="h-4 w-4 text-primary" /> {job as string} <span className="text-[10px] font-normal text-muted-foreground">· from the sale’s service line</span></p>
                {(items as [string, boolean][]).map(c => (
                  <div key={c[0]} className="flex items-center gap-2 text-xs"><span className={`h-4 w-4 rounded border inline-flex items-center justify-center ${c[1] ? 'bg-primary border-primary' : 'border-border'}`}>{c[1] && <CheckCircle2 className="h-3 w-3 text-primary-foreground" />}</span><span className={c[1] ? 'line-through text-muted-foreground' : ''}>{c[0]}</span></div>
                ))}
              </div>
            ))}
          </div>
        )}
        {state.activeTab === 'activity' && (
          <div className="space-y-2">{[['Order created from sale', 'System', '2025-06-08'], ['Scheduled for 16 Jun', 'Ahmed B.', '2025-06-12'], ['Dispatched to Karim T.', 'Ahmed B.', '2025-06-12'], ['Job 1 completed on site', 'Karim T.', '2025-06-16']].map((a, i, arr) => (<div key={a[0]} className="flex gap-3"><div className="flex flex-col items-center shrink-0"><span className="h-6 w-6 rounded-full bg-primary/10 text-primary inline-flex items-center justify-center"><Activity className="h-3 w-3" /></span>{i < arr.length - 1 && <div className="w-px flex-1 bg-border mt-1" />}</div><div className="pb-1"><p className="text-xs font-medium">{a[0]}</p><p className="text-[10px] text-muted-foreground">{a[2]} · {a[1]}</p></div></div>))}</div>
        )}
      </div>

      {/* Schedule modal */}
      {state.scheduleOpen && (
        <div className="absolute inset-0 z-[6] flex items-start justify-center pt-10 bg-background/40"><div id="so-demo-schedule" className="w-[420px] bg-card border border-border rounded-xl shadow-2xl p-4">
          <p className="text-sm font-semibold mb-3 inline-flex items-center gap-2"><Calendar className="h-4 w-4 text-primary" /> Schedule Job</p>
          <div className="grid grid-cols-2 gap-3"><Field label="Date"><Box>2025-06-16</Box></Field><Field label="Start"><Box>09:00</Box></Field></div>
          <div className="mt-2"><Field label="Or"><div className="h-9 rounded-md border border-primary bg-primary/5 text-primary text-xs flex items-center justify-center gap-1.5"><Truck className="h-3.5 w-3.5" /> Send to Planning board</div></Field></div>
          <div className="flex justify-end gap-2 mt-3"><div className="h-8 px-3 rounded-md border border-border text-xs flex items-center text-muted-foreground">Cancel</div><div className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-xs font-medium flex items-center">Schedule</div></div>
        </div></div>
      )}

      {/* Assign modal */}
      {state.assignOpen && (
        <div className="absolute inset-0 z-[6] flex items-start justify-center pt-10 bg-background/40"><div id="so-demo-assign" className="w-[420px] bg-card border border-border rounded-xl shadow-2xl p-4">
          <p className="text-sm font-semibold mb-1 inline-flex items-center gap-2"><UserCheck className="h-4 w-4 text-primary" /> Assign Technician</p>
          <p className="text-xs text-muted-foreground mb-2">Best fit by skill &amp; availability</p>
          <div className="space-y-1">
            {[['Karim T.', 'HVAC · Welding · available · 3.2 km', 92, true], ['Leïla M.', 'HVAC · available · 8.0 km', 74, false]].map((t, i) => (
              <div key={t[0] as string} id={i === 0 ? 'so-demo-smart-tech' : undefined} className={`flex items-center justify-between px-2.5 py-2 rounded-lg border ${t[3] ? 'border-primary bg-primary/5' : 'border-border'}`}><div><p className="text-xs font-medium">{t[0]}</p><p className="text-[10px] text-muted-foreground">{t[1]}</p></div><span className={`text-[11px] font-bold ${t[3] ? 'text-primary' : 'text-muted-foreground'}`}>{t[2]}</span></div>
            ))}
          </div>
          <div className="flex justify-end gap-2 mt-3"><div className="h-8 px-3 rounded-md border border-border text-xs flex items-center text-muted-foreground">Cancel</div><div className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-xs font-medium inline-flex items-center gap-1.5"><Truck className="h-3.5 w-3.5" /> Assign &amp; dispatch</div></div>
        </div></div>
      )}

      {/* Time booking */}
      {state.timeBookOpen && (
        <div className="absolute inset-0 z-[6] flex items-start justify-center pt-10 bg-background/40"><div id="so-demo-time-book" className="w-[380px] bg-card border border-border rounded-xl shadow-2xl p-4 text-center">
          <p className="text-sm font-semibold mb-3 inline-flex items-center gap-2"><Timer className="h-4 w-4 text-primary" /> Book Time</p>
          <div className="text-3xl font-bold tabular-nums mb-1">00:32:08</div>
          <p className="text-[11px] text-muted-foreground mb-3">Replace condenser unit · Karim T.</p>
          <div className="flex justify-center gap-2"><div className="h-9 px-4 rounded-md border border-border text-xs flex items-center gap-1.5 text-muted-foreground"><Clock className="h-3.5 w-3.5" /> Log hours</div><div className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-xs font-medium flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5" /> Stop &amp; log</div></div>
        </div></div>
      )}
      {/* Expense booking */}
      {state.expenseBookOpen && (
        <div className="absolute inset-0 z-[6] flex items-start justify-center pt-10 bg-background/40"><div id="so-demo-expense-book" className="w-[380px] bg-card border border-border rounded-xl shadow-2xl p-4">
          <p className="text-sm font-semibold mb-3 inline-flex items-center gap-2"><DollarSign className="h-4 w-4 text-primary" /> Add Expense</p>
          <div className="space-y-2 text-xs"><div className="grid grid-cols-2 gap-2"><div><label className="block text-[10px] text-muted-foreground mb-1">Type</label><Box>Travel</Box></div><div><label className="block text-[10px] text-muted-foreground mb-1">Amount</label><Box>45 TND</Box></div></div><div className="h-16 rounded-md border border-dashed border-border flex items-center justify-center gap-1.5 text-muted-foreground"><Paperclip className="h-3.5 w-3.5" /> Attach receipt photo</div></div>
          <div className="flex justify-end gap-2 mt-3"><div className="h-8 px-3 rounded-md border border-border text-xs flex items-center text-muted-foreground">Cancel</div><div className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-xs font-medium flex items-center">Add</div></div>
        </div></div>
      )}

      {/* Invoice prep */}
      {state.invoiceOpen && (
        <div className="absolute inset-0 z-[6] flex items-center justify-center bg-background/40"><div id="so-demo-invoice-modal" className="w-[440px] bg-card border border-border rounded-xl shadow-2xl p-4">
          <p className="text-sm font-semibold mb-1 inline-flex items-center gap-2"><FileText className="h-4 w-4 text-primary" /> Prepare Invoice</p>
          <p className="text-xs text-muted-foreground mb-3">Pulled from work booked on site</p>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between"><span className="text-muted-foreground">Labour · 3.5 h</span><span>1,400 TND</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Materials · 4 parts</span><span>13,200 TND</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Expenses</span><span>53 TND</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">TVA + stamp</span><span>3,747 TND</span></div>
            <div className="flex justify-between font-bold text-sm border-t border-border pt-1"><span>Total</span><span>18,400 TND</span></div>
          </div>
          <div className="flex justify-end gap-2 mt-3"><div className="h-8 px-3 rounded-md border border-border text-xs flex items-center text-muted-foreground">Cancel</div><div className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-xs font-medium inline-flex items-center gap-1.5"><FileText className="h-3.5 w-3.5" /> Create invoice</div></div>
        </div></div>
      )}

      {/* PDF + settings */}
      {state.pdfOpen && (
        <div className="absolute inset-0 z-[6] flex items-center justify-center bg-background/50 p-6"><div className="flex gap-3 h-full max-h-[80%]">
          <div className="w-72 bg-white text-black rounded-lg shadow-2xl border border-border overflow-hidden flex flex-col">
            <div className="bg-primary/90 text-white p-3"><div className="text-sm font-bold">SERVICE ORDER · SO-2025-044</div><div className="text-[9px] opacity-90">Flowentra SARL · MF 0000000/A/M/000</div></div>
            <div className="p-3 text-[9px] space-y-2 flex-1"><div><div className="font-semibold">Site</div><div>Médina Resorts · Sousse</div></div><div className="font-semibold">Jobs performed</div><div>Diagnose compressor · Replace condenser</div><div className="font-semibold pt-1">Materials</div><div>Condenser unit ×1 · Refrigerant 4kg</div><div className="text-right border-t border-gray-300 pt-1 font-bold text-[11px]">Total 18,400 TND</div></div>
          </div>
          {state.pdfSettings && (
            <div id="so-demo-pdf-settings" className="w-56 bg-card border border-border rounded-lg shadow-2xl p-3"><p className="text-xs font-semibold mb-2 inline-flex items-center gap-1.5"><Palette className="h-3.5 w-3.5 text-primary" /> PDF Studio</p><div className="flex gap-1 mb-3 border-b border-border pb-2">{['Colours', 'Type', 'Layout', 'Data'].map((t, i) => <span key={t} className={`text-[10px] px-1.5 py-0.5 rounded ${i === 0 ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>{t}</span>)}</div><div className="space-y-2"><div><div className="text-[10px] text-muted-foreground mb-1">Accent colour</div><div className="flex gap-1">{['bg-primary', 'bg-blue-500', 'bg-emerald-500', 'bg-rose-500'].map((c, i) => <span key={c} className={`h-5 w-5 rounded ${c} ${i === 0 ? 'ring-2 ring-offset-1 ring-foreground' : ''}`} />)}</div></div><div className="flex items-center justify-between"><span className="text-[11px]">Show materials</span><span className="h-4 w-7 rounded-full bg-primary relative"><span className="absolute top-0.5 left-3.5 h-3 w-3 rounded-full bg-white" /></span></div></div></div>
          )}
        </div></div>
      )}

      {/* Send dialog */}
      {state.sendOpen && (
        <div className="absolute inset-0 z-[6] flex items-start justify-center pt-10 bg-background/40"><div className="w-[420px] bg-card border border-border rounded-xl shadow-2xl p-4"><p className="text-sm font-semibold mb-3 inline-flex items-center gap-2"><Send className="h-4 w-4" /> Send Service Order</p><div className="space-y-2 text-xs"><Box>contact@medina.tn</Box><div className="flex items-center gap-1.5 text-muted-foreground"><Paperclip className="h-3 w-3" /> SO-2025-044.pdf attached</div></div><div className="flex justify-end gap-2 mt-3"><div className="h-8 px-3 rounded-md border border-border text-xs flex items-center text-muted-foreground">Cancel</div><div className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-xs font-medium inline-flex items-center gap-1.5"><Send className="h-3.5 w-3.5" /> Send</div></div></div></div>
      )}

      {/* Plan Dispatch modal — multi-job splitter with conflict detection */}
      {state.planDispatchOpen && (
        <div className="absolute inset-0 z-[6] flex items-center justify-center bg-background/50 p-4">
          <div id="so-demo-plan-dispatch" className="w-[560px] max-w-full bg-card border border-border rounded-xl shadow-2xl p-4">
            <p className="text-sm font-semibold mb-1 inline-flex items-center gap-2"><Calendar className="h-4 w-4 text-primary" /> Plan Dispatch</p>
            <p className="text-xs text-muted-foreground mb-3">SO-2025-044 · 2 jobs · Cold Room #3</p>

            <div className="space-y-1.5 mb-3">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Jobs · select what to dispatch</p>
              {[['Diagnose compressor fault', '90 min', 'HVAC'], ['Replace condenser unit', '120 min', 'HVAC · Welding']].map(j => (
                <div key={j[0]} className="flex items-center gap-2 px-2 py-1.5 rounded border border-primary bg-primary/5">
                  <span className="h-3.5 w-3.5 rounded bg-primary border border-primary inline-flex items-center justify-center"><CheckCircle2 className="h-2.5 w-2.5 text-primary-foreground" /></span>
                  <span className="text-xs flex-1">{j[0]}</span>
                  <span className="text-[10px] text-muted-foreground">{j[1]} · {j[2]}</span>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-2 mb-3">
              <div><label className="block text-[10px] text-muted-foreground mb-1">Date</label><Box>2025-06-16</Box></div>
              <div><label className="block text-[10px] text-muted-foreground mb-1">Start</label><Box>09:00</Box></div>
              <div><label className="block text-[10px] text-muted-foreground mb-1">Mode</label><div className="h-9 px-2 rounded-md border border-primary bg-primary/5 text-primary text-[11px] flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3" /> Back-to-back</div></div>
            </div>
            <div className="flex items-center gap-2 mb-3 px-2 py-1.5 rounded border border-border text-[11px]">
              <span className="h-3.5 w-3.5 rounded bg-primary border border-primary inline-flex items-center justify-center"><CheckCircle2 className="h-2.5 w-2.5 text-primary-foreground" /></span>
              <span className="text-muted-foreground">Split by installation · one dispatch per equipment</span>
            </div>

            <div className="space-y-1.5 mb-3">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Technicians · ranked by skill · availability · distance</p>
              <div className="flex items-center justify-between px-2.5 py-2 rounded-lg border border-primary bg-primary/5">
                <div className="flex items-center gap-2"><span className="h-6 w-6 rounded-full bg-primary/10 text-primary text-[9px] font-bold inline-flex items-center justify-center">KT</span><div><p className="text-xs font-medium">Karim T.</p><p className="text-[10px] text-muted-foreground">HVAC · Welding · 3.2 km · free 09:00–14:00</p></div></div>
                <span className="text-[11px] font-bold text-primary">92</span>
              </div>
              <div id="so-demo-plan-conflict" className="flex items-center justify-between px-2.5 py-2 rounded-lg border border-red-300 bg-red-50 dark:bg-red-900/10">
                <div className="flex items-center gap-2"><span className="h-6 w-6 rounded-full bg-red-100 text-red-700 text-[9px] font-bold inline-flex items-center justify-center">SB</span><div><p className="text-xs font-medium">Sami B.</p><p className="text-[10px] text-red-600 dark:text-red-400">Double-booked 09:00–11:00 · DISP-2025-102</p></div></div>
                <span className="text-[11px] font-bold text-red-600">—</span>
              </div>
              <div className="flex items-center justify-between px-2.5 py-2 rounded-lg border border-border">
                <div className="flex items-center gap-2"><span className="h-6 w-6 rounded-full bg-muted text-muted-foreground text-[9px] font-bold inline-flex items-center justify-center">LM</span><div><p className="text-xs font-medium">Leïla M.</p><p className="text-[10px] text-muted-foreground">HVAC · 8.0 km · free after 10:30</p></div></div>
                <span className="text-[11px] font-bold text-muted-foreground">74</span>
              </div>
            </div>

            <div className="flex justify-end gap-2"><div className="h-8 px-3 rounded-md border border-border text-xs flex items-center text-muted-foreground">Cancel</div><div className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-xs font-medium inline-flex items-center gap-1.5"><Truck className="h-3.5 w-3.5" /> Create 2 dispatches</div></div>
          </div>
        </div>
      )}
    </div>
  );
}

export function ServiceOrdersAutopilotDemo({ open, onClose }: Props) {
  const { i18n } = useTranslation();
  const [stepIndex, setStepIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(false);
  const [cursor, setCursor] = useState<{ x: number; y: number; clicking: boolean }>({ x: -200, y: -200, clicking: false });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clickRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const finished = stepIndex >= SO_STEPS.length;
  const state: SODemoState = useMemo(() => { let s = initialSODemoState; for (let i = 0; i < Math.min(stepIndex + 1, SO_STEPS.length); i++) s = SO_STEPS[i].apply(s); return s; }, [stepIndex]);

  const step = SO_STEPS[Math.min(stepIndex, SO_STEPS.length - 1)];
  const demoLang = pickLang(i18n.language);
  const captionText = getCaption(demoLang, Math.min(stepIndex, SO_STEPS.length - 1), step.caption);
  const finishedMsg =
    demoLang === 'fr' ? 'Votre module Ordres de service est prêt — créez votre premier ordre.' :
    'Your Service Orders module is ready — create your first order.';

  useEffect(() => { if (open) { setStepIndex(0); setPlaying(true); } return () => { if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel(); }; }, [open]);
  useEffect(() => { if (typeof window === 'undefined' || !window.speechSynthesis) return; const synth = window.speechSynthesis; synth.getVoices(); const onV = () => synth.getVoices(); synth.addEventListener?.('voiceschanged', onV); return () => synth.removeEventListener?.('voiceschanged', onV); }, []);
  useEffect(() => {
    if (!open || finished) return;
    const place = () => { const el = document.getElementById(step.target); if (!el) return; const r = el.getBoundingClientRect(); setCursor({ x: r.left + Math.min(r.width / 2, 120), y: r.top + Math.min(r.height / 2, 40), clicking: true }); if (clickRef.current) clearTimeout(clickRef.current); clickRef.current = setTimeout(() => setCursor(c => ({ ...c, clicking: false })), 450); };
    const t = setTimeout(place, 160); return () => clearTimeout(t);
  }, [stepIndex, open, finished, step?.target, state.page, state.activeTab, state.listView, state.showFilters, state.bulkBar, state.createStep, state.scheduleOpen, state.assignOpen, state.timeBookOpen, state.expenseBookOpen, state.invoiceOpen, state.pdfOpen, state.pdfSettings, state.sendOpen, state.preferredSkills, state.planDispatchOpen, state.planVsActual]);
  useEffect(() => {
    if (!open || !playing || finished) return;
    const advance = () => setStepIndex(i => i + 1);
    const caption = captionText; const synthSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;
    if (!muted && synthSupported && caption) {
      const synth = window.speechSynthesis; synth.cancel();
      const { code, bcp47 } = languageTagFor(i18n.language); const voice = pickBestVoice(code); const chunks = splitForSpeech(caption);
      let advanced = false; const doAdvance = () => { if (advanced) return; advanced = true; timerRef.current = setTimeout(advance, 420); };
      chunks.forEach((chunk, idx) => { const u = new SpeechSynthesisUtterance(chunk); u.lang = bcp47; configureUtteranceForFemaleVoice(u, voice); if (idx === chunks.length - 1) { u.onend = doAdvance; u.onerror = doAdvance; } try { synth.speak(u); } catch { /* */ } });
      const safety = setTimeout(doAdvance, Math.max(step.duration, caption.length * 110 + 1800));
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
  const activeChapter = SO_CHAPTERS.find(c => stepIndex >= c.start && stepIndex < c.end) || SO_CHAPTERS[SO_CHAPTERS.length - 1];

  return (
    <div className="fixed inset-0 z-[110] bg-background flex flex-col select-none">
      <div className="h-12 shrink-0 border-b border-border/60 bg-card flex items-center px-3 gap-3">
        <div className="flex items-center gap-2 min-w-0 flex-1"><span className="h-7 w-7 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-sm shrink-0"><ClipboardList className="h-3.5 w-3.5 text-primary-foreground" /></span><span className="text-sm font-semibold truncate">Service Orders — Live Demo</span></div>
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
          {SO_CHAPTERS.map(ch => (<button key={ch.id} onClick={() => jumpChapter(ch.start)} className={`text-[10px] font-medium px-2 py-0.5 rounded-full transition-colors cursor-pointer ${activeChapter.id === ch.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/70'}`}>{getChapterTitle(demoLang, ch.id, ch.title)}</button>))}
          <span className="ml-auto text-[10px] text-muted-foreground">{Math.min(stepIndex + 1, SO_STEPS.length)} / {SO_STEPS.length}</span>
        </div>
        <div className="h-1 rounded-full bg-muted overflow-hidden mb-2"><div className="h-full bg-primary transition-all duration-300" style={{ width: `${(Math.min(stepIndex + 1, SO_STEPS.length) / SO_STEPS.length) * 100}%` }} /></div>
        <p className="text-sm text-foreground/90 min-h-[20px] flex items-center gap-2"><Languages className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />{finished ? finishedMsg : captionText}</p>
      </div>

      {!finished && <DemoCursor x={cursor.x} y={cursor.y} clicking={cursor.clicking} />}

      {finished && (
        <div className="absolute inset-0 z-[115] flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl shadow-2xl p-6 max-w-sm text-center">
            <div className="h-12 w-12 mx-auto rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center mb-3"><ClipboardList className="h-6 w-6 text-primary-foreground" /></div>
            <h3 className="text-lg font-semibold mb-1">Field work, fully orchestrated</h3>
            <p className="text-sm text-muted-foreground mb-5">Field map · Jobs &amp; scheduling · Dispatch &amp; execution · Time &amp; materials · One-click invoicing.</p>
            <div className="flex flex-col gap-2">
              <button onClick={onClose} className="w-full h-10 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 cursor-pointer">Create your first order</button>
              <button onClick={restart} className="w-full h-9 rounded-lg border border-border text-sm font-medium hover:bg-muted/40 inline-flex items-center justify-center gap-1.5 cursor-pointer"><RotateCcw className="h-3.5 w-3.5" /> Replay</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

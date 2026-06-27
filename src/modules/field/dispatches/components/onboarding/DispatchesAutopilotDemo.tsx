import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  X, Play, Pause, RotateCcw, Volume2, VolumeX, Languages,
  Truck, Search, Filter, List, Table as TableIcon, Trash2, Circle, CheckCircle2,
  Clock, UserMinus, Building2, User, MapPin, Phone, Calendar, Paperclip, ListChecks,
  Activity, ChevronRight, ChevronDown, Palette, Send, FileText, Package, StickyNote,
  Wrench, PenTool, Navigation, Timer,
} from 'lucide-react';
import { DemoCursor } from '@/modules/external/components/onboarding/DemoCursor';
import { pickBestVoice, splitForSpeech, languageTagFor, configureUtteranceForFemaleVoice } from '@/modules/external/components/onboarding/narrationVoice';
import {
  DP_STEPS, DP_CHAPTERS, initialDPDemoState,
  type DPDemoState,
} from './dispatchesDemoScript';
import { pickLang, getCaption, getChapterTitle } from './dispatchesDemoTranslations';

interface Props { open: boolean; onClose: () => void; }

const DEMO_DISPATCHES = [
  { id: 'd1', num: 'DISP-2025-101', so: 'SO-2025-044', customer: 'Médina Resorts',  tech: 'Karim T.', status: 'in_progress', priority: 'high',   time: 'Mon · 09:00' },
  { id: 'd2', num: 'DISP-2025-102', so: 'SO-2025-051', customer: 'Acme Industries',  tech: 'Sami B.',  status: 'confirmed',   priority: 'urgent', time: 'Mon · 08:30' },
  { id: 'd3', num: 'DISP-2025-103', so: 'SO-2025-058', customer: 'Hydro Parts',      tech: 'Leïla M.', status: 'pending',     priority: 'medium', time: '—' },
  { id: 'd4', num: 'DISP-2025-098', so: 'SO-2025-040', customer: 'Sahara Foods',     tech: 'Karim T.', status: 'completed',   priority: 'low',    time: 'Sun · 14:00' },
];

const STATUS_CLS: Record<string, string> = {
  pending:     'bg-muted text-muted-foreground',
  planned:     'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  confirmed:   'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  in_progress: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  completed:   'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
};
function Pill({ s }: { s: string }) { return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${STATUS_CLS[s] ?? 'bg-muted text-muted-foreground'}`}>{s.replace(/_/g, ' ')}</span>; }
const PRIO_CLS: Record<string, string> = { urgent: 'bg-red-500', high: 'bg-orange-400', medium: 'bg-blue-400', low: 'bg-gray-300' };
const initials = (n: string) => n.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);

const STEPPER = ['pending', 'planned', 'confirmed', 'in_progress', 'completed'];

function StatCard({ id, icon, label, value, active }: { id: string; icon: React.ReactNode; label: string; value: number; active?: boolean }) {
  return (
    <div id={id} className={`rounded-lg p-3 border cursor-default transition-all ${active ? 'border-2 border-primary bg-primary/5' : 'border-border bg-card'}`}>
      <div className="flex items-center justify-between"><div className="flex items-center gap-2.5"><span className={`p-2 rounded-lg ${active ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>{icon}</span><span className="text-xs text-muted-foreground font-medium">{label}</span></div><span className="text-sm font-bold">{value}</span></div>
    </div>
  );
}

function PageList({ state }: { state: DPDemoState }) {
  const c = { all: DEMO_DISPATCHES.length, confirmed: DEMO_DISPATCHES.filter(d => d.status === 'confirmed').length, in_progress: DEMO_DISPATCHES.filter(d => d.status === 'in_progress').length, completed: DEMO_DISPATCHES.filter(d => d.status === 'completed').length };
  return (
    <div className="flex flex-col relative">
      <div className="flex items-center justify-between p-4 border-b border-border bg-card/50">
        <div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-primary/10"><Truck className="h-6 w-6 text-primary" /></div><div><h1 id="dp-demo-title" className="text-xl font-semibold">Dispatches</h1><p className="text-[11px] text-muted-foreground">Field job tickets</p></div></div>
      </div>

      <div className="p-4 border-b border-border grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard id="dp-demo-stat-total"      icon={<Circle className="h-4 w-4" />}        label="Total"       value={c.all}         active={state.selectedStat === 'all'} />
        <StatCard id="dp-demo-stat-confirmed"  icon={<CheckCircle2 className="h-4 w-4" />}  label="Confirmed"   value={c.confirmed}   active={state.selectedStat === 'confirmed'} />
        <StatCard id="dp-demo-stat-inprogress" icon={<Clock className="h-4 w-4" />}         label="In Progress" value={c.in_progress} active={state.selectedStat === 'in_progress'} />
        <StatCard id="dp-demo-stat-completed"  icon={<CheckCircle2 className="h-4 w-4" />}  label="Completed"   value={c.completed}   active={state.selectedStat === 'completed'} />
      </div>

      <div className="p-3 border-b border-border bg-card space-y-3">
        <div className="flex gap-2 items-center">
          <div id="dp-demo-search" className={`relative flex-1 ${state.searchActive ? 'ring-1 ring-primary rounded-md' : ''}`}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <div className="h-9 pl-10 pr-3 rounded-md border border-border bg-background text-sm text-muted-foreground flex items-center">{state.searchActive ? 'karim' : 'Search dispatches…'}</div>
          </div>
          <div id="dp-demo-filters" className={`h-9 px-3 rounded-md border text-sm flex items-center gap-1.5 cursor-default ${state.showFilters ? 'border-primary text-primary bg-primary/5' : 'border-border text-muted-foreground'}`}><Filter className="h-4 w-4" /> Filters</div>
          <div id="dp-demo-views" className="flex items-center gap-1 border border-border rounded-md overflow-hidden">
            {([['list', List], ['table', TableIcon]] as const).map(([m, Ic]) => (<div key={m} className={`h-9 px-2.5 flex items-center cursor-default ${state.listView === m ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}><Ic className="h-4 w-4" /></div>))}
          </div>
        </div>
        {state.showFilters && <div className="flex gap-2 pt-2 border-t border-border">{['Status: Confirmed', 'Priority: Urgent'].map(f => <div key={f} className="h-8 px-2.5 rounded-md border border-border text-xs flex items-center gap-2 text-foreground">{f}<ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /></div>)}</div>}
      </div>

      {state.bulkBar && (
        <div id="dp-demo-bulk" className="bg-destructive/10 border-b border-destructive/20 p-3 flex items-center justify-between">
          <div className="flex items-center gap-3"><span className="h-4 w-4 rounded bg-primary border border-primary inline-flex items-center justify-center"><span className="h-2 w-2 bg-primary-foreground rounded-sm" /></span><span className="text-sm font-medium">2 selected</span></div>
          <div className="h-8 px-3 rounded-md bg-destructive text-destructive-foreground text-xs inline-flex items-center gap-1.5 cursor-default"><Trash2 className="h-3.5 w-3.5" /> Delete selected</div>
        </div>
      )}

      <div className="p-4">
        <div id="dp-demo-table" className="border border-border rounded-lg overflow-hidden bg-card">
          <table className="w-full text-xs">
            <thead><tr className="border-b border-border/60 bg-muted/30">
              {state.bulkBar && <th className="w-8 px-3 py-2" />}
              <th className="text-left px-3 py-2 text-muted-foreground font-medium">Dispatch</th>
              <th className="text-left px-3 py-2 text-muted-foreground font-medium">Service Order</th>
              <th className="text-left px-3 py-2 text-muted-foreground font-medium">Customer</th>
              <th className="text-left px-3 py-2 text-muted-foreground font-medium">Technician</th>
              <th className="text-left px-3 py-2 text-muted-foreground font-medium">Status</th>
              <th className="text-left px-3 py-2 text-muted-foreground font-medium">Priority</th>
              <th className="text-left px-3 py-2 text-muted-foreground font-medium">Schedule</th>
            </tr></thead>
            <tbody>
              {DEMO_DISPATCHES.map((d, i) => (
                <tr key={d.id} className={`border-b border-border/40 last:border-0 ${state.bulkBar && i < 2 ? 'bg-primary/5' : ''}`}>
                  {state.bulkBar && <td className="px-3 py-2.5"><span className={`h-3.5 w-3.5 rounded border inline-block ${i < 2 ? 'bg-primary border-primary' : 'border-border bg-background'}`} /></td>}
                  <td className="px-3 py-2.5 font-medium text-primary">{d.num}</td>
                  <td className="px-3 py-2.5"><span className="inline-flex items-center gap-1.5 text-muted-foreground"><Building2 className="h-3 w-3" />{d.so}</span></td>
                  <td className="px-3 py-2.5">{d.customer}</td>
                  <td className="px-3 py-2.5"><span className="inline-flex items-center gap-1.5"><span className="h-5 w-5 rounded-full bg-primary/10 text-primary text-[9px] font-bold inline-flex items-center justify-center">{initials(d.tech)}</span><span className="text-primary">{d.tech}</span></span></td>
                  <td className="px-3 py-2.5"><Pill s={d.status} /></td>
                  <td className="px-3 py-2.5"><span className="inline-flex items-center gap-1.5"><span className={`w-2 h-2 rounded-full ${PRIO_CLS[d.priority]}`} /><span className="capitalize">{d.priority}</span></span></td>
                  <td className="px-3 py-2.5 text-muted-foreground">{d.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bulk-delete confirmation dialog */}
      {state.bulkConfirm && (
        <div className="absolute inset-0 z-[6] flex items-start justify-center pt-16 bg-background/50">
          <div className="w-[440px] bg-card border border-border rounded-xl shadow-2xl p-4">
            <p className="text-sm font-semibold mb-1 inline-flex items-center gap-2"><Trash2 className="h-4 w-4 text-destructive" /> Delete 2 dispatches?</p>
            <p className="text-xs text-muted-foreground mb-4">This permanently removes the selected dispatch tickets. This action cannot be undone.</p>
            <div className="flex justify-end gap-2"><div className="h-8 px-3 rounded-md border border-border text-xs flex items-center text-muted-foreground cursor-default">Cancel</div><div className="h-8 px-3 rounded-md bg-destructive text-destructive-foreground text-xs font-medium inline-flex items-center gap-1.5 cursor-default"><Trash2 className="h-3.5 w-3.5" /> Delete</div></div>
          </div>
        </div>
      )}
    </div>
  );
}

function PageDetail({ state }: { state: DPDemoState }) {
  const D = DEMO_DISPATCHES[0];
  const tabs = [
    { k: 'overview', l: 'Overview', id: undefined as string | undefined },
    { k: 'jobs', l: 'Jobs', id: 'dp-demo-tab-jobs' },
    { k: 'time_expenses', l: 'Time & Expenses', id: 'dp-demo-tab-time' },
    { k: 'materials', l: 'Materials', id: 'dp-demo-tab-materials' },
    { k: 'attachments', l: 'Attachments', id: 'dp-demo-tab-attachments' },
    { k: 'checklists', l: 'Checklists', id: 'dp-demo-tab-checklists' },
    { k: 'activity', l: 'Activity', id: 'dp-demo-tab-activity' },
  ];
  const curStatus = STEPPER[Math.min(state.statusStage, STEPPER.length - 1)];
  return (
    <div className="flex flex-col max-w-5xl mx-auto w-full relative">
      <div id="dp-demo-detail-header" className="flex items-center justify-between gap-4 px-4 py-3 border-b border-border/60">
        <div className="flex items-center gap-3 min-w-0"><div className="h-8 w-8 rounded border border-border flex items-center justify-center text-muted-foreground text-xs">←</div><div><div className="flex items-center gap-2"><h1 className="text-lg font-semibold">{D.num}</h1><Pill s={curStatus} /></div><p className="text-xs text-muted-foreground">{D.so} · {D.customer}</p></div></div>
        <div className="flex gap-2 shrink-0">
          <div className="h-8 px-3 rounded-md border border-border text-xs inline-flex items-center gap-1.5 text-muted-foreground"><Navigation className="h-3.5 w-3.5" /> Navigate</div>
          <div id="dp-demo-pdf" className="h-8 px-3 rounded-md border border-border text-xs inline-flex items-center gap-1.5 text-muted-foreground"><FileText className="h-3.5 w-3.5" /> Report</div>
          <div id="dp-demo-send" className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-xs font-medium inline-flex items-center gap-1.5"><Send className="h-3.5 w-3.5" /> Send</div>
        </div>
      </div>

      <div id="dp-demo-status" className="px-4 py-3 border-b border-border/60 bg-muted/20 overflow-x-auto">
        <div className="flex items-center gap-0 min-w-max">
          {STEPPER.map((s, i) => (<div key={s} className="flex items-center gap-0"><div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[10px] font-medium capitalize whitespace-nowrap ${i <= state.statusStage ? 'text-primary bg-primary/10' : 'text-muted-foreground'}`}>{i < state.statusStage && <CheckCircle2 className="h-3 w-3" />}{s.replace(/_/g, ' ')}</div>{i < STEPPER.length - 1 && <ChevronRight className="h-3 w-3 text-muted-foreground/40" />}</div>))}
        </div>
      </div>

      {/* Technician card */}
      <div id="dp-demo-tech" className="px-4 py-3 border-b border-border/60">
        <div className="flex items-center gap-3 bg-card border border-border rounded-lg p-3">
          <span className="h-10 w-10 rounded-full bg-primary/10 text-primary text-sm font-bold inline-flex items-center justify-center">KT</span>
          <div className="flex-1 min-w-0"><div className="flex items-center gap-2"><p className="text-sm font-medium">Karim T.</p><span className="inline-flex items-center gap-1 text-[10px] text-green-600"><span className="h-1.5 w-1.5 rounded-full bg-green-500" /> available</span></div><p className="text-[11px] text-muted-foreground">HVAC · Hydraulics · +216 22 334 556</p></div>
          <div className="flex gap-1.5"><span className="h-8 w-8 rounded-md border border-border inline-flex items-center justify-center text-muted-foreground"><Phone className="h-3.5 w-3.5" /></span><span className="h-8 w-8 rounded-md border border-border inline-flex items-center justify-center text-muted-foreground"><MapPin className="h-3.5 w-3.5" /></span></div>
        </div>
      </div>

      <div className="border-b border-border/60 px-4 overflow-x-auto"><div className="flex gap-1 -mb-px min-w-max">{tabs.map(tab => (<div key={tab.k} id={tab.id} className={`inline-flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 cursor-default whitespace-nowrap ${state.activeTab === tab.k ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground'}`}>{tab.l}</div>))}</div></div>

      <div className="p-4">
        {state.activeTab === 'overview' && (
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-card border border-border rounded-lg p-4 space-y-2 text-xs"><p className="text-sm font-medium mb-1">Job</p><div className="flex items-center gap-1.5 text-muted-foreground"><Building2 className="h-3 w-3" /> Médina Resorts · Sousse</div><div className="flex items-center gap-1.5 text-muted-foreground"><Wrench className="h-3 w-3" /> AC Overhaul — Cold Room #3</div><div className="flex items-center gap-1.5 text-muted-foreground"><Clock className="h-3 w-3" /> Est. 3.5 h · 2 jobs</div></div>
            <div className="bg-card border border-border rounded-lg p-4 space-y-1.5 text-xs"><p className="text-sm font-medium mb-1">Booked so far</p><div className="flex justify-between text-muted-foreground"><span>Labour</span><span>2.0 h</span></div><div className="flex justify-between text-muted-foreground"><span>Materials</span><span>3 parts</span></div><div className="flex justify-between text-muted-foreground"><span>Expenses</span><span>53 TND</span></div></div>
          </div>
        )}
        {state.activeTab === 'jobs' && (
          <div className="space-y-2">
            {state.multiJob && (
              <div id="dp-demo-multijob-jobs" className="flex items-center justify-between px-3 py-2 rounded-lg bg-primary/10 border border-primary/30 text-xs">
                <span className="inline-flex items-center gap-1.5 font-medium text-primary"><Wrench className="h-3.5 w-3.5" /> 3 jobs in this dispatch · whole service order</span>
                <span className="text-[10px] text-muted-foreground">SO-2042</span>
              </div>
            )}
            {(state.multiJob
              ? [['Diagnose compressor fault', 'completed', '90 min'], ['Replace condenser unit', 'in_progress', '120 min'], ['Commission & test', 'pending', '45 min']]
              : [['Diagnose compressor fault', 'completed', '90 min'], ['Replace condenser unit', 'in_progress', '120 min']]
            ).map((j, i) => (
              <div key={j[0]} id={i === 0 ? 'dp-demo-job-detail' : undefined} className="p-3 bg-card border border-border rounded-lg"><div className="flex items-center justify-between"><span className="text-xs font-medium inline-flex items-center gap-1.5"><Wrench className="h-3 w-3 text-muted-foreground" />{j[0]}</span><div className="flex items-center gap-1.5">{state.multiJob && (i === 0 ? <span className="px-1.5 py-0.5 rounded bg-primary/15 text-primary text-[9px] font-semibold inline-flex items-center gap-1"><CheckCircle2 className="h-2.5 w-2.5" /> Current</span> : <span className="px-1.5 py-0.5 rounded border border-border text-[9px] text-muted-foreground">Set current</span>)}<Pill s={j[1]} /></div></div><div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground"><span className="inline-flex items-center gap-1"><Clock className="h-2.5 w-2.5" /> {j[2]}</span><span>Skills: HVAC</span></div></div>
            ))}
          </div>
        )}
        {state.activeTab === 'time_expenses' && (
          <div className="grid md:grid-cols-2 gap-3">
            <div className="bg-card border border-border rounded-lg p-3"><div className="flex items-center justify-between mb-2"><p className="text-sm font-medium inline-flex items-center gap-1.5"><Clock className="h-4 w-4 text-primary" /> Time</p><span className="h-6 px-2 rounded bg-primary/10 text-primary text-[10px] inline-flex items-center gap-1"><Timer className="h-3 w-3" /> Start timer</span></div>{[['Diagnose', '1.5 h'], ['Replace', '0.5 h']].map(t => <div key={t[0]} className="flex justify-between text-xs py-1 border-b border-border/40 last:border-0"><span>{t[0]}</span><span className="font-medium">{t[1]}</span></div>)}</div>
            <div className="bg-card border border-border rounded-lg p-3"><p className="text-sm font-medium mb-2 inline-flex items-center gap-1.5"><FileText className="h-4 w-4 text-primary" /> Expenses</p>{[['Travel', '45 TND'], ['Parking', '8 TND']].map(t => <div key={t[0]} className="flex justify-between text-xs py-1 border-b border-border/40 last:border-0"><span>{t[0]}</span><span className="font-medium">{t[1]}</span></div>)}</div>
          </div>
        )}
        {state.activeTab === 'materials' && (
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/60"><span className="text-sm font-medium inline-flex items-center gap-2"><Package className="h-4 w-4 text-primary" /> Materials used</span><span id="dp-demo-articles" className="h-6 px-2 rounded border border-border text-[10px] text-muted-foreground inline-flex items-center gap-1"><Package className="h-3 w-3" /> Add part</span></div>
            <table className="w-full text-xs"><thead><tr className="bg-muted/30 border-b border-border/60"><th className="text-left px-4 py-2 text-muted-foreground">Part</th><th className="text-right px-4 py-2 text-muted-foreground">Qty</th><th className="text-right px-4 py-2 text-muted-foreground">From</th></tr></thead><tbody>
              {[['Condenser unit CU-12', '1', 'Van stock'], ['Refrigerant R410A', '4 kg', 'Van stock'], ['Seal kit SK-12', '2', 'Sfax Main']].map(r => (<tr key={r[0]} className="border-b border-border/40 last:border-0"><td className="px-4 py-2.5 font-medium">{r[0]}</td><td className="px-4 py-2.5 text-right">{r[1]}</td><td className="px-4 py-2.5 text-right text-muted-foreground">{r[2]}</td></tr>))}
            </tbody></table>
          </div>
        )}
        {state.activeTab === 'attachments' && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">{[['before.jpg'], ['after.jpg'], ['nameplate.jpg'], ['delivery-note.pdf']].map(d => <div key={d[0]} className="aspect-video flex flex-col items-center justify-center gap-1 bg-card border border-border rounded-lg text-muted-foreground"><Paperclip className="h-4 w-4" /><span className="text-[10px]">{d[0]}</span></div>)}</div>
        )}
        {state.activeTab === 'checklists' && !state.multiJob && (
          <div className="bg-card border border-border rounded-lg p-4 space-y-2"><p className="text-sm font-medium mb-1 inline-flex items-center gap-2"><ListChecks className="h-4 w-4 text-primary" /> On-site checklist</p>{[['Power isolated & tagged', true], ['Pressure test passed', true], ['Cooling verified', true], ['Customer signature', false]].map(c => (<div key={c[0] as string} className="flex items-center gap-2 text-xs"><span className={`h-4 w-4 rounded border inline-flex items-center justify-center ${c[1] ? 'bg-primary border-primary' : 'border-border'}`}>{c[1] && <CheckCircle2 className="h-3 w-3 text-primary-foreground" />}</span><span className={c[1] ? 'line-through text-muted-foreground' : ''}>{c[0]}</span></div>))}</div>
        )}
        {state.activeTab === 'checklists' && state.multiJob && (
          <div id="dp-demo-multijob-checklists" className="space-y-3">
            {[['Replace condenser unit', [['Power isolated & tagged', true], ['Refrigerant recovered', true], ['New unit pressure-tested', false]]], ['Commission & test', [['Cooling verified', false], ['Customer walkthrough', false]]]].map(([job, items]) => (
              <div key={job as string} className="bg-card border border-border rounded-lg p-3 space-y-1.5">
                <p className="text-xs font-semibold inline-flex items-center gap-1.5"><Wrench className="h-3 w-3 text-primary" /> {job as string} <span className="text-[9px] font-normal text-muted-foreground">· checklist from the service line</span></p>
                {(items as [string, boolean][]).map(c => (
                  <div key={c[0]} className="flex items-center gap-2 text-xs"><span className={`h-4 w-4 rounded border inline-flex items-center justify-center ${c[1] ? 'bg-primary border-primary' : 'border-border'}`}>{c[1] && <CheckCircle2 className="h-3 w-3 text-primary-foreground" />}</span><span className={c[1] ? 'line-through text-muted-foreground' : ''}>{c[0]}</span></div>
                ))}
              </div>
            ))}
          </div>
        )}
        {state.activeTab === 'activity' && (
          <div className="space-y-2">{[['Confirmed by Karim T.', '08:42'], ['En route', '08:55'], ['On site', '09:08'], ['Job 1 completed', '10:30'], ['Customer signed', '12:05']].map((a, i, arr) => (<div key={a[0]} className="flex gap-3"><div className="flex flex-col items-center shrink-0"><span className="h-6 w-6 rounded-full bg-primary/10 text-primary inline-flex items-center justify-center"><Activity className="h-3 w-3" /></span>{i < arr.length - 1 && <div className="w-px flex-1 bg-border mt-1" />}</div><div className="pb-1"><p className="text-xs font-medium">{a[0]}</p><p className="text-[10px] text-muted-foreground">Today · {a[1]}</p></div></div>))}
            <div id="dp-demo-signoff" className="mt-3 p-3 bg-card border border-border rounded-lg">
              <p className="text-xs font-medium mb-2 inline-flex items-center gap-1.5"><PenTool className="h-3.5 w-3.5 text-primary" /> Customer sign-off</p>
              <div className="h-16 rounded-md border border-dashed border-border flex items-center justify-center bg-muted/20">
                <svg viewBox="0 0 200 40" className="h-10 text-primary"><path d="M5 30 Q 20 5, 35 25 T 65 20 Q 80 35, 95 15 T 130 25 Q 150 5, 175 28 L 195 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">Signed by S. Bouazizi · Today 12:05</p>
            </div>
          </div>
        )}
      </div>

      {/* Time booking */}
      {state.timeBookOpen && (
        <div className="absolute inset-0 z-[6] flex items-start justify-center pt-10 bg-background/40"><div id="dp-demo-time-book" className="w-[380px] bg-card border border-border rounded-xl shadow-2xl p-4 text-center">
          <p className="text-sm font-semibold mb-3 inline-flex items-center gap-2"><Timer className="h-4 w-4 text-primary" /> Book Time</p>
          {state.multiJob && (
            <div id="dp-demo-multijob-time" className="mb-3 text-left">
              <label className="block text-[10px] text-muted-foreground mb-1">Job</label>
              <div className="h-8 rounded-md border border-primary/50 ring-2 ring-primary/20 flex items-center justify-between px-2 text-xs"><span className="inline-flex items-center gap-1.5"><Wrench className="h-3 w-3 text-primary" /> Replace condenser unit</span><ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /></div>
            </div>
          )}
          <div className="text-3xl font-bold tabular-nums mb-1">00:38:14</div>
          <p className="text-[11px] text-muted-foreground mb-3">Replace condenser unit · Karim T.</p>
          <div className="flex justify-center gap-2"><div className="h-9 px-4 rounded-md border border-border text-xs flex items-center gap-1.5 text-muted-foreground"><Pause className="h-3.5 w-3.5" /> Pause</div><div className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-xs font-medium flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5" /> Stop &amp; log</div></div>
        </div></div>
      )}

      {/* Expense booking */}
      {state.expenseBookOpen && (
        <div className="absolute inset-0 z-[6] flex items-start justify-center pt-10 bg-background/40"><div id="dp-demo-expense-book" className="w-[380px] bg-card border border-border rounded-xl shadow-2xl p-4">
          <p className="text-sm font-semibold mb-3 inline-flex items-center gap-2"><FileText className="h-4 w-4 text-primary" /> Log Expense</p>
          <div className="space-y-2 text-xs"><div className="grid grid-cols-2 gap-2"><div><label className="block text-[10px] text-muted-foreground mb-1">Type</label><div className="h-8 rounded-md border border-border flex items-center px-2">Travel</div></div><div><label className="block text-[10px] text-muted-foreground mb-1">Amount</label><div className="h-8 rounded-md border border-border flex items-center px-2">45 TND</div></div></div><div className="h-16 rounded-md border border-dashed border-border flex items-center justify-center gap-1.5 text-muted-foreground"><Paperclip className="h-3.5 w-3.5" /> Attach receipt photo</div></div>
          <div className="flex justify-end gap-2 mt-3"><div className="h-8 px-3 rounded-md border border-border text-xs flex items-center text-muted-foreground">Cancel</div><div className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-xs font-medium flex items-center">Add</div></div>
        </div></div>
      )}

      {/* Notes */}
      {state.notesOpen && (
        <div className="absolute inset-0 z-[6] flex items-start justify-center pt-10 bg-background/40"><div id="dp-demo-notes-modal" className="w-[420px] bg-card border border-border rounded-xl shadow-2xl p-4">
          <p className="text-sm font-semibold mb-3 inline-flex items-center gap-2"><StickyNote className="h-4 w-4 text-primary" /> Add Note</p>
          <div className="h-20 rounded-md border border-border p-2 text-xs text-foreground">Customer reports intermittent noise from second unit — recommend follow-up inspection next month.</div>
          <div className="flex justify-end gap-2 mt-3"><div className="h-8 px-3 rounded-md border border-border text-xs flex items-center text-muted-foreground">Cancel</div><div className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-xs font-medium flex items-center">Save note</div></div>
        </div></div>
      )}

      {/* Send */}
      {state.sendOpen && (
        <div className="absolute inset-0 z-[6] flex items-start justify-center pt-10 bg-background/40"><div className="w-[420px] bg-card border border-border rounded-xl shadow-2xl p-4"><p className="text-sm font-semibold mb-3 inline-flex items-center gap-2"><Send className="h-4 w-4" /> Send Work Report</p><div className="space-y-2 text-xs"><div className="h-9 px-3 rounded-md border border-border flex items-center">contact@medina.tn</div><div className="flex items-center gap-1.5 text-muted-foreground"><Paperclip className="h-3 w-3" /> DISP-2025-101-report.pdf (signed)</div></div><div className="flex justify-end gap-2 mt-3"><div className="h-8 px-3 rounded-md border border-border text-xs flex items-center text-muted-foreground">Cancel</div><div className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-xs font-medium inline-flex items-center gap-1.5"><Send className="h-3.5 w-3.5" /> Send</div></div></div></div>
      )}

      {/* PDF + settings */}
      {state.pdfOpen && (
        <div className="absolute inset-0 z-[6] flex items-center justify-center bg-background/50 p-6"><div className="flex gap-3 h-full max-h-[80%]">
          <div id="dp-demo-pdf-download" className="w-72 bg-white text-black rounded-lg shadow-2xl border border-border overflow-hidden flex flex-col">
            <div className="bg-primary/90 text-white p-3"><div className="text-sm font-bold">WORK REPORT · DISP-2025-101</div><div className="text-[9px] opacity-90">Flowentra SARL</div></div>
            <div className="p-3 text-[9px] space-y-2 flex-1"><div><div className="font-semibold">Customer</div><div>Médina Resorts · Sousse</div></div><div className="font-semibold">Jobs performed</div><div>Diagnose compressor · Replace condenser</div><div className="font-semibold pt-1">Time &amp; materials</div><div>Labour 2.0 h · 3 parts · Travel 45 TND</div><div className="font-semibold pt-1">Signature</div><svg viewBox="0 0 200 30" className="h-6 text-black"><path d="M5 22 Q 20 5, 35 18 T 65 15 Q 80 25, 95 10 T 130 18 L 175 20" fill="none" stroke="currentColor" strokeWidth="1.5" /></svg></div>
          </div>
          {state.pdfSettings && (
            <div id="dp-demo-pdf-settings" className="w-56 bg-card border border-border rounded-lg shadow-2xl p-3"><p className="text-xs font-semibold mb-2 inline-flex items-center gap-1.5"><Palette className="h-3.5 w-3.5 text-primary" /> PDF Studio</p><div className="flex gap-1 mb-3 border-b border-border pb-2">{['Colours', 'Type', 'Layout', 'Data'].map((t, i) => <span key={t} className={`text-[10px] px-1.5 py-0.5 rounded ${i === 0 ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>{t}</span>)}</div><div className="space-y-2"><div><div className="text-[10px] text-muted-foreground mb-1">Accent colour</div><div className="flex gap-1">{['bg-primary', 'bg-blue-500', 'bg-emerald-500', 'bg-rose-500'].map((c, i) => <span key={c} className={`h-5 w-5 rounded ${c} ${i === 0 ? 'ring-2 ring-offset-1 ring-foreground' : ''}`} />)}</div></div><div className="flex items-center justify-between"><span className="text-[11px]">Show signature</span><span className="h-4 w-7 rounded-full bg-primary relative"><span className="absolute top-0.5 left-3.5 h-3 w-3 rounded-full bg-white" /></span></div></div></div>
          )}
        </div></div>
      )}
    </div>
  );
}

export function DispatchesAutopilotDemo({ open, onClose }: Props) {
  const { i18n } = useTranslation();
  const [stepIndex, setStepIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(false);
  const [cursor, setCursor] = useState<{ x: number; y: number; clicking: boolean }>({ x: -200, y: -200, clicking: false });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clickRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const finished = stepIndex >= DP_STEPS.length;
  const state: DPDemoState = useMemo(() => { let s = initialDPDemoState; for (let i = 0; i < Math.min(stepIndex + 1, DP_STEPS.length); i++) s = DP_STEPS[i].apply(s); return s; }, [stepIndex]);

  const step = DP_STEPS[Math.min(stepIndex, DP_STEPS.length - 1)];
  const demoLang = pickLang(i18n.language);
  const captionText = getCaption(demoLang, Math.min(stepIndex, DP_STEPS.length - 1), step.caption);
  const finishedMsg =
    demoLang === 'fr' ? 'Votre module Envois est prêt — envoyez votre première équipe.' :
    'Your Dispatches module is ready — send your first crew.';

  useEffect(() => { if (open) { setStepIndex(0); setPlaying(true); } return () => { if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel(); }; }, [open]);
  useEffect(() => { if (typeof window === 'undefined' || !window.speechSynthesis) return; const synth = window.speechSynthesis; synth.getVoices(); const onV = () => synth.getVoices(); synth.addEventListener?.('voiceschanged', onV); return () => synth.removeEventListener?.('voiceschanged', onV); }, []);
  useEffect(() => {
    if (!open || finished) return;
    const place = () => { const el = document.getElementById(step.target); if (!el) return; const r = el.getBoundingClientRect(); setCursor({ x: r.left + Math.min(r.width / 2, 120), y: r.top + Math.min(r.height / 2, 40), clicking: true }); if (clickRef.current) clearTimeout(clickRef.current); clickRef.current = setTimeout(() => setCursor(c => ({ ...c, clicking: false })), 450); };
    const t = setTimeout(place, 160); return () => clearTimeout(t);
  }, [stepIndex, open, finished, step?.target, state.page, state.activeTab, state.listView, state.showFilters, state.bulkBar, state.bulkConfirm, state.timeBookOpen, state.expenseBookOpen, state.notesOpen, state.sendOpen, state.pdfOpen, state.pdfSettings, state.multiJob]);
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
  const activeChapter = DP_CHAPTERS.find(c => stepIndex >= c.start && stepIndex < c.end) || DP_CHAPTERS[DP_CHAPTERS.length - 1];

  return (
    <div className="fixed inset-0 z-[110] bg-background flex flex-col select-none">
      <div className="h-12 shrink-0 border-b border-border/60 bg-card flex items-center px-3 gap-3">
        <div className="flex items-center gap-2 min-w-0 flex-1"><span className="h-7 w-7 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-sm shrink-0"><Truck className="h-3.5 w-3.5 text-primary-foreground" /></span><span className="text-sm font-semibold truncate">Dispatches — Live Demo</span></div>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={() => setMuted(m => !m)} className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground" title={muted ? 'Unmute' : 'Mute'}>{muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}</button>
          <button onClick={togglePlay} className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground">{playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}</button>
          <button onClick={restart} className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground" title="Restart"><RotateCcw className="h-4 w-4" /></button>
          <button onClick={onClose} className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground" title="Close"><X className="h-4 w-4" /></button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pointer-events-none">
        {state.page === 'list'   && <PageList   state={state} />}
        {state.page === 'detail' && <PageDetail state={state} />}
      </div>

      <div className="shrink-0 border-t border-border/60 bg-card px-4 py-3">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          {DP_CHAPTERS.map(ch => (<button key={ch.id} onClick={() => jumpChapter(ch.start)} className={`text-[10px] font-medium px-2 py-0.5 rounded-full transition-colors cursor-pointer ${activeChapter.id === ch.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/70'}`}>{getChapterTitle(demoLang, ch.id, ch.title)}</button>))}
          <span className="ml-auto text-[10px] text-muted-foreground">{Math.min(stepIndex + 1, DP_STEPS.length)} / {DP_STEPS.length}</span>
        </div>
        <div className="h-1 rounded-full bg-muted overflow-hidden mb-2"><div className="h-full bg-primary transition-all duration-300" style={{ width: `${(Math.min(stepIndex + 1, DP_STEPS.length) / DP_STEPS.length) * 100}%` }} /></div>
        <p className="text-sm text-foreground/90 min-h-[20px] flex items-center gap-2"><Languages className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />{finished ? finishedMsg : captionText}</p>
      </div>

      {!finished && <DemoCursor x={cursor.x} y={cursor.y} clicking={cursor.clicking} />}

      {finished && (
        <div className="absolute inset-0 z-[115] flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl shadow-2xl p-6 max-w-sm text-center">
            <div className="h-12 w-12 mx-auto rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center mb-3"><Truck className="h-6 w-6 text-primary-foreground" /></div>
            <h3 className="text-lg font-semibold mb-1">Your field team, in your pocket</h3>
            <p className="text-sm text-muted-foreground mb-5">Real status flow · Time &amp; expense booking · Materials from stock · Photos &amp; checklists · Captured signature · Branded report.</p>
            <div className="flex flex-col gap-2">
              <button onClick={onClose} className="w-full h-10 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 cursor-pointer">Open your dispatches</button>
              <button onClick={restart} className="w-full h-9 rounded-lg border border-border text-sm font-medium hover:bg-muted/40 inline-flex items-center justify-center gap-1.5 cursor-pointer"><RotateCcw className="h-3.5 w-3.5" /> Replay</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

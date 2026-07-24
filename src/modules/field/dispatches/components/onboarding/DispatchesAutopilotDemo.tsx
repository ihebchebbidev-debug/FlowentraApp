import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  X, Play, Pause, RotateCcw, Volume2, VolumeX, Languages,
  Truck, Search, Trash2, Circle, CheckCircle2,
  Clock, Building2, MapPin, Calendar, Paperclip, ListChecks,
  Activity, ChevronRight, ChevronDown, Palette, Send, FileText, Package,
  Wrench, Timer, Map as MapIcon, Download, MoreHorizontal, Eye,
  Pencil, Link2, User, Mail, Home, Plus, Share2,
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
  { id: 'd1', num: 'DISP-2025-101', so: 'SO-2025-044', customer: 'Médina Resorts',  city: 'Sousse', tech: 'Karim T.', status: 'in_progress', priority: 'high',   time: 'Mon · 09:00' },
  { id: 'd2', num: 'DISP-2025-102', so: 'SO-2025-051', customer: 'Acme Industries', city: 'Tunis',  tech: 'Sami B.',  status: 'confirmed',   priority: 'urgent', time: 'Mon · 08:30' },
  { id: 'd3', num: 'DISP-2025-103', so: 'SO-2025-058', customer: 'Hydro Parts',     city: 'Sfax',   tech: 'Leïla M.', status: 'pending',     priority: 'medium', time: '—' },
  { id: 'd4', num: 'DISP-2025-098', so: 'SO-2025-040', customer: 'Sahara Foods',    city: 'Gabès',  tech: 'Karim T.', status: 'completed',   priority: 'low',    time: 'Sun · 14:00' },
];

const STATUS_CLS: Record<string, string> = {
  pending:     'bg-muted text-muted-foreground',
  planned:     'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  assigned:    'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  confirmed:   'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  in_progress: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  completed:   'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  cancelled:   'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};
function Pill({ s }: { s: string }) { return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-px-10 font-medium capitalize ${STATUS_CLS[s] ?? 'bg-muted text-muted-foreground'}`}>{s.replace(/_/g, ' ')}</span>; }
const PRIO_CLS: Record<string, string> = { urgent: 'bg-red-500', high: 'bg-orange-400', medium: 'bg-blue-400', low: 'bg-gray-300' };
const initials = (n: string) => n.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);

const STEPPER = ['pending', 'planned', 'assigned', 'confirmed', 'in_progress', 'completed'];

function PageList({ state }: { state: DPDemoState }) {
  return (
    <div className="flex flex-col relative">
      <div className="flex items-center justify-between p-4 border-b border-border bg-card/50">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10"><Truck className="h-6 w-6 text-primary" /></div>
          <div>
            <h1 id="dp-demo-title" className="text-xl font-semibold">Dispatches</h1>
            <p className="text-px-11 text-muted-foreground">Field job tickets</p>
          </div>
        </div>
        <div className="h-9 px-3 rounded-md bg-primary text-primary-foreground text-xs font-medium inline-flex items-center gap-1.5"><Plus className="h-3.5 w-3.5" /> New dispatch</div>
      </div>

      {/* Toolbar (real: search + status select + map + export — NO KPIs, NO priority filter, NO view toggle) */}
      <div className="p-3 border-b border-border bg-card">
        <div className="flex gap-2 items-center">
          <div id="dp-demo-search" className={`relative flex-1 ${state.searchActive ? 'ring-1 ring-primary rounded-md' : ''}`}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <div className="h-9 pl-10 pr-3 rounded-md border border-border bg-background text-sm text-muted-foreground flex items-center">{state.searchActive ? 'karim' : 'Search dispatches, service orders, technicians…'}</div>
          </div>
          <div id="dp-demo-status-filter" className={`h-9 px-3 rounded-md border text-sm flex items-center gap-1.5 cursor-default ${state.statusFilter === 'confirmed' ? 'border-primary text-primary bg-primary/5' : 'border-border text-muted-foreground'}`}>
            <span className="text-xs">Status:</span>
            <span className="text-xs font-medium capitalize">{state.statusFilter === 'confirmed' ? 'confirmed' : 'All'}</span>
            <ChevronDown className="h-3.5 w-3.5" />
          </div>
          <div id="dp-demo-map-toggle" className={`h-9 px-3 rounded-md border text-xs flex items-center gap-1.5 cursor-default ${state.mapOpen ? 'border-primary text-primary bg-primary/5' : 'border-border text-muted-foreground'}`}><MapIcon className="h-4 w-4" /> Map</div>
          <div id="dp-demo-export" className="h-9 px-3 rounded-md border border-border text-xs flex items-center gap-1.5 cursor-default text-muted-foreground"><Download className="h-4 w-4" /> Export</div>
        </div>
      </div>

      {/* Bulk bar */}
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
              <th className="text-left px-3 py-2 text-muted-foreground font-medium">Job</th>
              <th className="text-left px-3 py-2 text-muted-foreground font-medium">Customer</th>
              <th className="text-left px-3 py-2 text-muted-foreground font-medium">Scheduled</th>
              <th className="text-left px-3 py-2 text-muted-foreground font-medium">Technicians</th>
              <th className="text-left px-3 py-2 text-muted-foreground font-medium">Status</th>
              <th className="text-left px-3 py-2 text-muted-foreground font-medium">Priority</th>
              <th className="w-10 px-3 py-2" />
            </tr></thead>
            <tbody>
              {DEMO_DISPATCHES.map((d, i) => (
                <tr key={d.id} className={`border-b border-border/40 last:border-0 ${state.bulkBar && i < 2 ? 'bg-primary/5' : ''}`}>
                  {state.bulkBar && <td className="px-3 py-2.5"><span className={`h-3.5 w-3.5 rounded border inline-block ${i < 2 ? 'bg-primary border-primary' : 'border-border bg-background'}`} /></td>}
                  <td className="px-3 py-2.5"><div className="font-medium text-primary">{d.num}</div><div className="text-px-10 text-muted-foreground">{d.so}</div></td>
                  <td className="px-3 py-2.5"><div>{d.customer}</div><div className="text-px-10 text-muted-foreground">{d.city}</div></td>
                  <td className="px-3 py-2.5 text-muted-foreground">{d.time}</td>
                  <td className="px-3 py-2.5"><span className="inline-flex items-center gap-1.5"><span className="h-5 w-5 rounded-full bg-primary/10 text-primary text-px-9 font-bold inline-flex items-center justify-center">{initials(d.tech)}</span><span className="text-primary">{d.tech}</span></span></td>
                  <td className="px-3 py-2.5"><Pill s={d.status} /></td>
                  <td className="px-3 py-2.5"><span className="inline-flex items-center gap-1.5"><span className={`w-2 h-2 rounded-full ${PRIO_CLS[d.priority]}`} /><span className="capitalize">{d.priority}</span></span></td>
                  <td className="px-3 py-2.5 relative">
                    <span id={i === 0 ? 'dp-demo-row-actions' : undefined} className="h-7 w-7 rounded-md border border-border inline-flex items-center justify-center text-muted-foreground"><MoreHorizontal className="h-3.5 w-3.5" /></span>
                    {state.rowActionsOpen && i === 0 && (
                      <div className="absolute right-3 top-9 z-[7] w-40 bg-popover border border-border rounded-md shadow-xl py-1 text-xs">
                        <div className="px-3 py-1.5 hover:bg-muted flex items-center gap-2"><Eye className="h-3.5 w-3.5 text-muted-foreground" /> View</div>
                        <div className="px-3 py-1.5 hover:bg-muted flex items-center gap-2"><Pencil className="h-3.5 w-3.5 text-muted-foreground" /> Edit</div>
                        <div className="px-3 py-1.5 hover:bg-muted flex items-center gap-2"><FileText className="h-3.5 w-3.5 text-muted-foreground" /> Report</div>
                        <div className="border-t border-border my-1" />
                        <div className="px-3 py-1.5 hover:bg-destructive/10 flex items-center gap-2 text-destructive"><Trash2 className="h-3.5 w-3.5" /> Delete</div>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Map overlay */}
      {state.mapOpen && (
        <div className="absolute inset-x-0 top-[110px] mx-4 z-[5] rounded-lg border border-border bg-card shadow-xl overflow-hidden">
          <div className="h-56 bg-gradient-to-br from-emerald-100 via-sky-100 to-blue-200 dark:from-emerald-950/40 dark:via-sky-950/40 dark:to-blue-950/40 relative">
            {[
              { x: 24, y: 40, l: 'Sousse' },
              { x: 55, y: 22, l: 'Tunis' },
              { x: 70, y: 60, l: 'Sfax' },
              { x: 82, y: 78, l: 'Gabès' },
            ].map(p => (
              <div key={p.l} style={{ left: `${p.x}%`, top: `${p.y}%` }} className="absolute -translate-x-1/2 -translate-y-full flex flex-col items-center">
                <div className="px-1.5 py-0.5 rounded text-px-9 bg-card border border-border shadow">{p.l}</div>
                <MapPin className="h-5 w-5 text-primary drop-shadow" />
              </div>
            ))}
            <div className="absolute top-2 right-2 px-2 py-1 rounded bg-card/90 text-px-10 border border-border">4 dispatches pinned</div>
          </div>
        </div>
      )}

      {/* Export modal */}
      {state.exportOpen && (
        <div className="absolute inset-0 z-[6] flex items-start justify-center pt-14 bg-background/50">
          <div className="w-[460px] bg-card border border-border rounded-xl shadow-2xl p-4">
            <p className="text-sm font-semibold mb-3 inline-flex items-center gap-2"><Download className="h-4 w-4 text-primary" /> Export dispatches</p>
            <div className="grid grid-cols-2 gap-2 text-xs mb-3">
              {['Dispatch #', 'Service Order', 'Title', 'Status', 'Priority', 'Customer', 'City', 'Scheduled', 'Technicians', 'Created at'].map((c, i) => (
                <label key={c} className="inline-flex items-center gap-2 p-1.5 rounded border border-border">
                  <span className={`h-3.5 w-3.5 rounded border inline-flex items-center justify-center ${i < 8 ? 'bg-primary border-primary' : 'border-border'}`}>{i < 8 && <CheckCircle2 className="h-2.5 w-2.5 text-primary-foreground" />}</span>
                  <span>{c}</span>
                </label>
              ))}
            </div>
            <div className="flex items-center justify-between text-px-11 mb-3">
              <span className="text-muted-foreground">Filename</span>
              <div className="h-8 px-2 rounded border border-border flex items-center">dispatches-2025-07-24.xlsx</div>
            </div>
            <div className="flex justify-end gap-2">
              <div className="h-8 px-3 rounded-md border border-border text-xs flex items-center text-muted-foreground">Cancel</div>
              <div className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-xs font-medium inline-flex items-center gap-1.5"><Download className="h-3.5 w-3.5" /> Export</div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk-delete confirm with progress */}
      {state.bulkConfirm && (
        <div className="absolute inset-0 z-[6] flex items-start justify-center pt-16 bg-background/50">
          <div className="w-[460px] bg-card border border-border rounded-xl shadow-2xl p-4">
            <p className="text-sm font-semibold mb-1 inline-flex items-center gap-2"><Trash2 className="h-4 w-4 text-destructive" /> Delete 2 dispatches?</p>
            <p className="text-xs text-muted-foreground mb-3">This permanently removes the selected dispatch tickets, their time entries, expenses and materials. This action cannot be undone.</p>
            <div className="mb-3">
              <div className="flex items-center justify-between text-px-11 mb-1"><span className="text-muted-foreground">Deleting…</span><span className="font-mono">{state.bulkProgress}%</span></div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden"><div className="h-full bg-destructive transition-all" style={{ width: `${state.bulkProgress}%` }} /></div>
            </div>
            <div className="flex justify-end gap-2">
              <div className="h-8 px-3 rounded-md border border-border text-xs flex items-center text-muted-foreground">Cancel</div>
              <div className="h-8 px-3 rounded-md bg-destructive text-destructive-foreground text-xs font-medium inline-flex items-center gap-1.5"><Trash2 className="h-3.5 w-3.5" /> Delete</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PageDetail({ state }: { state: DPDemoState }) {
  const D = DEMO_DISPATCHES[0];
  const tabs = [
    { k: 'overview',     l: 'Overview',        id: undefined as string | undefined },
    { k: 'jobs',         l: 'Jobs',            id: 'dp-demo-tab-jobs' },
    { k: 'time_expenses',l: 'Time & Expenses', id: 'dp-demo-tab-time' },
    { k: 'materials',    l: 'Materials',       id: 'dp-demo-tab-materials' },
    { k: 'attachments',  l: 'Attachments',     id: 'dp-demo-tab-attachments' },
    { k: 'checklists',   l: 'Checklists',      id: 'dp-demo-tab-checklists' },
    { k: 'activity',     l: 'Activity',        id: 'dp-demo-tab-activity' },
  ];
  const curStatus = STEPPER[Math.min(state.statusStage, STEPPER.length - 1)];
  return (
    <div className="flex flex-col max-w-5xl mx-auto w-full relative">
      {/* Header (real: editable number + Release/Cancel quick + Report/Share/Send) */}
      <div id="dp-demo-detail-header" className="flex items-center justify-between gap-4 px-4 py-3 border-b border-border/60">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-8 w-8 rounded border border-border flex items-center justify-center text-muted-foreground text-xs">←</div>
          <div>
            <div className="flex items-center gap-2">
              <div id="dp-demo-editable-number" className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md ${state.editNumberActive ? 'border border-primary bg-primary/5' : 'border border-transparent'}`}>
                <h1 className="text-lg font-semibold">{D.num}</h1>
                <Pencil className={`h-3.5 w-3.5 ${state.editNumberActive ? 'text-primary' : 'text-muted-foreground/50'}`} />
              </div>
              <Pill s={curStatus} />
            </div>
            <p className="text-xs text-muted-foreground">{D.so} · {D.customer}</p>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          {state.statusStage >= 3 && state.statusStage < 5 && (
            <div className="h-8 px-3 rounded-md border border-primary text-primary text-xs inline-flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5" /> Release</div>
          )}
          <div className="h-8 px-3 rounded-md border border-destructive/50 text-destructive text-xs inline-flex items-center gap-1.5"><X className="h-3.5 w-3.5" /> Cancel</div>
          <div id="dp-demo-pdf" className="h-8 px-3 rounded-md border border-border text-xs inline-flex items-center gap-1.5 text-muted-foreground"><FileText className="h-3.5 w-3.5" /> Report</div>
          <div id="dp-demo-share" className="h-8 px-3 rounded-md border border-border text-xs inline-flex items-center gap-1.5 text-muted-foreground"><Share2 className="h-3.5 w-3.5" /> Share</div>
          <div id="dp-demo-send" className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-xs font-medium inline-flex items-center gap-1.5"><Send className="h-3.5 w-3.5" /> Send</div>
        </div>
      </div>

      <div id="dp-demo-status" className="px-4 py-3 border-b border-border/60 bg-muted/20 overflow-x-auto">
        <div className="flex items-center gap-0 min-w-max">
          {STEPPER.map((s, i) => (
            <div key={s} className="flex items-center gap-0">
              <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-px-10 font-medium capitalize whitespace-nowrap ${i <= state.statusStage ? 'text-primary bg-primary/10' : 'text-muted-foreground'}`}>
                {i < state.statusStage && <CheckCircle2 className="h-3 w-3" />}{s.replace(/_/g, ' ')}
              </div>
              {i < STEPPER.length - 1 && <ChevronRight className="h-3 w-3 text-muted-foreground/40" />}
            </div>
          ))}
        </div>
      </div>

      <div className="border-b border-border/60 px-4 overflow-x-auto"><div className="flex gap-1 -mb-px min-w-max">{tabs.map(tab => (<div key={tab.k} id={tab.id} className={`inline-flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 cursor-default whitespace-nowrap ${state.activeTab === tab.k ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground'}`}>{tab.l}</div>))}</div></div>

      <div className="p-4">
        {state.activeTab === 'overview' && (
          <div id="dp-demo-overview-details" className="grid md:grid-cols-2 gap-4">
            <div className="bg-card border border-border rounded-lg p-4 space-y-2 text-xs">
              <p className="text-sm font-medium mb-2">Dispatch details</p>
              <div className="flex items-center justify-between"><span className="text-muted-foreground inline-flex items-center gap-1.5"><Link2 className="h-3 w-3" /> Service order</span><span className="text-primary">{D.so}</span></div>
              <div className="flex items-center justify-between"><span className="text-muted-foreground inline-flex items-center gap-1.5"><User className="h-3 w-3" /> Affected contact</span><span className="text-primary">S. Bouazizi</span></div>
              <div className="flex items-center justify-between"><span className="text-muted-foreground inline-flex items-center gap-1.5"><Mail className="h-3 w-3" /> Contact email</span><span>s.bouazizi@medina.tn</span></div>
              <div className="flex items-center justify-between"><span className="text-muted-foreground inline-flex items-center gap-1.5"><Home className="h-3 w-3" /> Installation</span><span className="text-primary">Cold Room #3 · Sousse</span></div>
              <div className="flex items-center justify-between"><span className="text-muted-foreground inline-flex items-center gap-1.5"><Calendar className="h-3 w-3" /> Scheduled</span><span>Mon 24 · 09:00 → 12:30</span></div>
              <div className="flex items-center justify-between"><span className="text-muted-foreground">Dispatched by</span><span>N. Fatnassi · Fri 21</span></div>
              <div className="flex items-center justify-between"><span className="text-muted-foreground">Assigned technicians</span><span>Karim T., Sami B.</span></div>
            </div>
            <div id="dp-demo-required-skills" className={`bg-card border rounded-lg p-4 space-y-2 text-xs ${state.skillsEditing ? 'border-primary ring-2 ring-primary/20' : 'border-border'}`}>
              <p className="text-sm font-medium mb-2 inline-flex items-center gap-2"><ListChecks className="h-4 w-4 text-primary" /> Required skills</p>
              <div className="flex flex-wrap gap-1.5">
                {['HVAC', 'Hydraulics', 'Electrical'].map(s => (
                  <span key={s} className="px-2 py-1 rounded-md text-px-11 bg-primary/10 text-primary inline-flex items-center gap-1">{s}{state.skillsEditing && <X className="h-2.5 w-2.5" />}</span>
                ))}
                {state.skillsEditing && (
                  <span className="px-2 py-1 rounded-md text-px-11 border border-dashed border-primary/40 text-primary inline-flex items-center gap-1"><Plus className="h-2.5 w-2.5" /> Add skill from catalog</span>
                )}
              </div>
            </div>
          </div>
        )}

        {state.activeTab === 'jobs' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-primary/5 border border-primary/20 text-xs">
              <span className="inline-flex items-center gap-1.5 font-medium text-primary"><Wrench className="h-3.5 w-3.5" /> 3 jobs · grouped by installation</span>
              <span className="px-1.5 py-0.5 rounded text-px-9 font-semibold bg-primary/15 text-primary">Par installation</span>
            </div>
            {state.jobsFilterOpen && (
              <div className="flex gap-2 items-center bg-card border border-border rounded-lg p-2">
                <div className="h-8 flex-1 px-2 rounded-md border border-border text-xs flex items-center gap-1.5 text-muted-foreground"><Search className="h-3.5 w-3.5" /> Search jobs…</div>
                <div className="h-8 px-2 rounded-md border border-primary text-primary text-xs flex items-center gap-1">Status: dispatched <ChevronDown className="h-3 w-3" /></div>
                <div className="h-8 px-2 rounded-md border border-primary text-primary text-xs flex items-center gap-1">Work type: repair <ChevronDown className="h-3 w-3" /></div>
              </div>
            )}
            {[['Diagnose compressor fault', 'completed', 'inspection'], ['Replace condenser unit', 'in_progress', 'repair'], ['Commission & test', 'pending', 'installation']].map((j, i) => (
              <div key={j[0]} className="p-3 bg-card border border-border rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium inline-flex items-center gap-1.5"><Wrench className="h-3 w-3 text-muted-foreground" />{j[0]}</span>
                  <div className="flex items-center gap-1.5">
                    {state.multiJobCurrent && (i === 1 ? <span id="dp-demo-multijob-current" className="px-1.5 py-0.5 rounded bg-primary/15 text-primary text-px-9 font-semibold inline-flex items-center gap-1"><CheckCircle2 className="h-2.5 w-2.5" /> Current job</span> : <span className="px-1.5 py-0.5 rounded border border-border text-px-9 text-muted-foreground">Set current</span>)}
                    <span className="px-1.5 py-0.5 rounded bg-muted text-px-9 text-muted-foreground capitalize">{j[2]}</span>
                    <Pill s={j[1]} />
                  </div>
                </div>
                <div className="text-px-10 text-muted-foreground mt-1">Installation · Cold Room #3</div>
              </div>
            ))}
          </div>
        )}

        {state.activeTab === 'time_expenses' && (
          <div className="space-y-3">
            <div className="grid md:grid-cols-2 gap-3">
              <div className="bg-card border border-border rounded-lg p-3">
                <div className="flex items-center justify-between mb-2"><p className="text-sm font-medium inline-flex items-center gap-1.5"><Clock className="h-4 w-4 text-primary" /> Time entries</p><span className="h-6 px-2 rounded bg-primary/10 text-primary text-px-10 inline-flex items-center gap-1"><Plus className="h-3 w-3" /> Add time</span></div>
                {[['Travel', '0.5 h', 'Karim T.'], ['Work', '1.5 h', 'Karim T.'], ['Setup', '0.5 h', 'Sami B.']].map(t => <div key={t[0]} className="flex justify-between text-xs py-1 border-b border-border/40 last:border-0"><span className="inline-flex items-center gap-1.5"><span className="px-1.5 py-0.5 rounded bg-muted text-px-9 text-muted-foreground">{t[0]}</span><span className="text-muted-foreground">{t[2]}</span></span><span className="font-medium">{t[1]}</span></div>)}
              </div>
              <div className="bg-card border border-border rounded-lg p-3">
                <div className="flex items-center justify-between mb-2"><p className="text-sm font-medium inline-flex items-center gap-1.5"><FileText className="h-4 w-4 text-primary" /> Expenses</p><span className="h-6 px-2 rounded bg-primary/10 text-primary text-px-10 inline-flex items-center gap-1"><Plus className="h-3 w-3" /> Add expense</span></div>
                {[['Travel', '45 TND'], ['Parking', '8 TND']].map(t => <div key={t[0]} className="flex justify-between text-xs py-1 border-b border-border/40 last:border-0"><span className="inline-flex items-center gap-1.5"><span className="px-1.5 py-0.5 rounded bg-muted text-px-9 text-muted-foreground">{t[0]}</span></span><span className="font-medium">{t[1]}</span></div>)}
              </div>
            </div>
            {state.plannedRollup && (
              <div id="dp-demo-planned-rollup" className="bg-card border border-primary/40 ring-2 ring-primary/10 rounded-lg p-3">
                <p className="text-xs font-semibold mb-2 inline-flex items-center gap-2 text-primary"><CheckCircle2 className="h-3.5 w-3.5" /> Planned vs booked · inline totals</p>
                {[
                  { l: 'Labour', p: '3.0 h', a: '2.5 h', tone: 'emerald' },
                  { l: 'Travel', p: '45 TND', a: '45 TND', tone: 'emerald' },
                  { l: 'Materials', p: '3 lines · 220 TND', a: '3 lines · 240 TND', tone: 'amber' },
                ].map(r => (
                  <div key={r.l} className="grid grid-cols-4 gap-2 items-center p-1.5 text-xs">
                    <span className="font-medium">{r.l}</span>
                    <span className="text-muted-foreground">Plan · {r.p}</span>
                    <span className="font-semibold">Actual · {r.a}</span>
                    <span className={`text-px-10 font-semibold px-2 py-0.5 rounded-full text-center ${r.tone === 'emerald' ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400' : 'bg-amber-500/15 text-amber-700 dark:text-amber-400'}`}>{r.tone === 'emerald' ? 'On plan' : 'Over'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {state.activeTab === 'materials' && (
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/60">
              <span className="text-sm font-medium inline-flex items-center gap-2"><Package className="h-4 w-4 text-primary" /> Materials used</span>
              <span className="h-6 px-2 rounded border border-border text-px-10 text-muted-foreground inline-flex items-center gap-1"><Plus className="h-3 w-3" /> Add material</span>
            </div>
            <table className="w-full text-xs"><thead><tr className="bg-muted/30 border-b border-border/60"><th className="text-left px-4 py-2 text-muted-foreground">Article</th><th className="text-left px-4 py-2 text-muted-foreground">Job</th><th className="text-right px-4 py-2 text-muted-foreground">Qty</th><th className="text-right px-4 py-2 text-muted-foreground">Used by</th></tr></thead><tbody>
              {[['Condenser CU-12', 'Replace condenser', '1', 'Karim T.'], ['Refrigerant R410A', 'Replace condenser', '4 kg', 'Karim T.'], ['Seal kit SK-12', 'Commission & test', '2', 'Sami B.']].map(r => (<tr key={r[0]} className="border-b border-border/40 last:border-0"><td className="px-4 py-2.5 font-medium">{r[0]}</td><td className="px-4 py-2.5 text-muted-foreground">{r[1]}</td><td className="px-4 py-2.5 text-right">{r[2]}</td><td className="px-4 py-2.5 text-right text-muted-foreground">{r[3]}</td></tr>))}
            </tbody></table>
          </div>
        )}

        {state.activeTab === 'attachments' && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">{[['before.jpg', 'Dispatch'], ['after.jpg', 'Dispatch'], ['nameplate.jpg', 'Dispatch'], ['SO-quote.pdf', 'Service order'], ['warranty.pdf', 'Sale'], ['spec-sheet.pdf', 'Offer']].map(d => <div key={d[0]} className="aspect-video flex flex-col items-center justify-center gap-1 bg-card border border-border rounded-lg text-muted-foreground"><Paperclip className="h-4 w-4" /><span className="text-px-10">{d[0]}</span><span className="text-px-9 px-1.5 py-0.5 rounded bg-muted">{d[1]}</span></div>)}</div>
          </div>
        )}

        {state.activeTab === 'checklists' && (
          <div className="space-y-3">
            {[
              ['Dispatch checklist', [['Safety briefing done', true], ['Van stock verified', true]]],
              ['Service order checklist · SO-2025-044', [['Warranty checked', true], ['Site access confirmed', true]]],
              ['Job · Replace condenser', [['Power isolated & tagged', true], ['Refrigerant recovered', true], ['New unit pressure-tested', false]]],
              ['Job · Commission & test', [['Cooling verified', false], ['Customer walkthrough', false]]],
            ].map(([title, items]) => (
              <div key={title as string} className="bg-card border border-border rounded-lg p-3 space-y-1.5">
                <p className="text-xs font-semibold inline-flex items-center gap-1.5"><ListChecks className="h-3.5 w-3.5 text-primary" /> {title as string}</p>
                {(items as [string, boolean][]).map(c => (
                  <div key={c[0]} className="flex items-center gap-2 text-xs"><span className={`h-4 w-4 rounded border inline-flex items-center justify-center ${c[1] ? 'bg-primary border-primary' : 'border-border'}`}>{c[1] && <CheckCircle2 className="h-3 w-3 text-primary-foreground" />}</span><span className={c[1] ? 'line-through text-muted-foreground' : ''}>{c[0]}</span></div>
                ))}
              </div>
            ))}
          </div>
        )}

        {state.activeTab === 'activity' && (
          <div className="space-y-2">
            {[
              { l: 'Status changed to In Progress', t: '09:08', k: 'system' },
              { l: 'Material added · Condenser CU-12', t: '10:12', k: 'system' },
              { l: 'Time booked · 1.5 h Work', t: '11:00', k: 'system' },
              { l: 'Customer reports intermittent noise — recommend follow-up next month.', t: '11:45', k: 'user', by: 'Karim T.' },
            ].map((a, i, arr) => (
              <div key={a.l + i} className="flex gap-3">
                <div className="flex flex-col items-center shrink-0">
                  <span className={`h-6 w-6 rounded-full inline-flex items-center justify-center ${a.k === 'user' ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400' : 'bg-primary/10 text-primary'}`}><Activity className="h-3 w-3" /></span>
                  {i < arr.length - 1 && <div className="w-px flex-1 bg-border mt-1" />}
                </div>
                <div className="pb-1">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-medium">{a.l}</p>
                    <span className={`text-px-9 px-1.5 py-0.5 rounded ${a.k === 'user' ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400' : 'bg-primary/15 text-primary'}`}>{a.k === 'user' ? 'User note' : 'System activity'}</span>
                  </div>
                  <p className="text-px-10 text-muted-foreground">Today · {a.t}{a.by ? ` · ${a.by}` : ''}</p>
                </div>
              </div>
            ))}
            {state.noteComposerOpen && (
              <div id="dp-demo-add-note" className="mt-3 p-3 bg-card border border-primary/40 ring-2 ring-primary/10 rounded-lg">
                <p className="text-xs font-medium mb-2 text-primary">Add a note</p>
                <div className="h-16 rounded-md border border-border p-2 text-xs text-foreground">Second unit stable after adjustment — schedule inspection in 30 days.</div>
                <div className="flex justify-end gap-2 mt-2"><div className="h-7 px-2.5 rounded-md border border-border text-px-11 flex items-center text-muted-foreground">Cancel</div><div className="h-7 px-2.5 rounded-md bg-primary text-primary-foreground text-px-11 font-medium flex items-center">Save note</div></div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Cancel confirmation dialog */}
      {state.cancelConfirmOpen && (
        <div className="absolute inset-0 z-[6] flex items-start justify-center pt-10 bg-background/50">
          <div className="w-[420px] bg-card border border-border rounded-xl shadow-2xl p-4">
            <p className="text-sm font-semibold mb-1 inline-flex items-center gap-2"><X className="h-4 w-4 text-destructive" /> Cancel this dispatch?</p>
            <p className="text-xs text-muted-foreground mb-3">The dispatch will move to Cancelled and a note will be propagated back to its service order, sale and offer.</p>
            <div className="flex justify-end gap-2"><div className="h-8 px-3 rounded-md border border-border text-xs flex items-center text-muted-foreground">Keep</div><div className="h-8 px-3 rounded-md bg-destructive text-destructive-foreground text-xs font-medium">Cancel dispatch</div></div>
          </div>
        </div>
      )}

      {/* Time booking */}
      {state.timeBookOpen && (
        <div className="absolute inset-0 z-[6] flex items-start justify-center pt-10 bg-background/40">
          <div className="w-[420px] bg-card border border-border rounded-xl shadow-2xl p-4">
            <p className="text-sm font-semibold mb-3 inline-flex items-center gap-2"><Timer className="h-4 w-4 text-primary" /> Book time</p>
            <div className="mb-2 text-xs">
              <label className="block text-px-10 text-muted-foreground mb-1">Job</label>
              <div className="h-8 rounded-md border border-primary/50 ring-2 ring-primary/20 flex items-center justify-between px-2"><span className="inline-flex items-center gap-1.5"><Wrench className="h-3 w-3 text-primary" /> Replace condenser</span><ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /></div>
            </div>
            <div className="mb-3">
              <p className="text-px-10 text-muted-foreground mb-1">Work type</p>
              <div className="flex flex-wrap gap-1.5">
                {['Travel', 'Work', 'Setup', 'Documentation', 'Cleanup'].map((w, i) => (
                  <span key={w} className={`px-2 py-1 rounded-md text-px-11 border ${i === 1 ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-muted-foreground border-border'}`}>{w}</span>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-3 text-xs">
              <div><label className="block text-px-10 text-muted-foreground mb-1">Start</label><div className="h-8 px-2 rounded-md border border-border flex items-center">09:15</div></div>
              <div><label className="block text-px-10 text-muted-foreground mb-1">Stop</label><div className="h-8 px-2 rounded-md border border-border flex items-center">11:00</div></div>
              <div><label className="block text-px-10 text-muted-foreground mb-1">Duration</label><div className="h-8 px-2 rounded-md border border-border bg-muted/40 flex items-center font-medium">1 h 45</div></div>
            </div>
            <div className="mb-3 text-xs"><label className="block text-px-10 text-muted-foreground mb-1">Description</label><div className="h-8 px-2 rounded-md border border-border flex items-center text-muted-foreground">Compressor swap and leak test</div></div>
            <div className="flex justify-end gap-2"><div className="h-8 px-3 rounded-md border border-border text-xs flex items-center text-muted-foreground">Cancel</div><div className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-xs font-medium">Save entry</div></div>
          </div>
        </div>
      )}

      {/* Expense booking */}
      {state.expenseBookOpen && (
        <div className="absolute inset-0 z-[6] flex items-start justify-center pt-10 bg-background/40">
          <div className="w-[420px] bg-card border border-border rounded-xl shadow-2xl p-4">
            <p className="text-sm font-semibold mb-3 inline-flex items-center gap-2"><FileText className="h-4 w-4 text-primary" /> Log expense</p>
            <div className="mb-2 text-xs">
              <label className="block text-px-10 text-muted-foreground mb-1">Job</label>
              <div className="h-8 rounded-md border border-primary/50 ring-2 ring-primary/20 flex items-center justify-between px-2"><span className="inline-flex items-center gap-1.5"><Wrench className="h-3 w-3 text-primary" /> Replace condenser</span><ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /></div>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-2 text-xs">
              <div><label className="block text-px-10 text-muted-foreground mb-1">Type</label><div className="h-8 rounded-md border border-border flex items-center justify-between px-2">Travel <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /></div></div>
              <div><label className="block text-px-10 text-muted-foreground mb-1">Amount</label><div className="h-8 rounded-md border border-border flex items-center px-2">45,000 TND</div></div>
            </div>
            <div className="mb-2 text-xs"><label className="block text-px-10 text-muted-foreground mb-1">Description</label><div className="h-8 rounded-md border border-border flex items-center px-2 text-muted-foreground">Sousse → Tunis return</div></div>
            <div className="text-px-10 text-muted-foreground mb-3">Types: travel · meal · parking · supplies · other</div>
            <div className="flex justify-end gap-2"><div className="h-8 px-3 rounded-md border border-border text-xs flex items-center text-muted-foreground">Cancel</div><div className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-xs font-medium">Save expense</div></div>
          </div>
        </div>
      )}

      {/* Material add modal */}
      {state.materialAddOpen && (
        <div className="absolute inset-0 z-[6] flex items-start justify-center pt-10 bg-background/40">
          <div className="w-[460px] bg-card border border-border rounded-xl shadow-2xl p-4">
            <p className="text-sm font-semibold mb-3 inline-flex items-center gap-2"><Package className="h-4 w-4 text-primary" /> Add material</p>
            <div className="space-y-2 text-xs">
              <div><label className="block text-px-10 text-muted-foreground mb-1">Article</label><div className="h-9 rounded-md border border-border flex items-center px-2">Condenser CU-12 · Refrigeration</div></div>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="block text-px-10 text-muted-foreground mb-1">Job</label><div className="h-9 rounded-md border border-primary/50 ring-2 ring-primary/20 flex items-center px-2"><Wrench className="h-3 w-3 text-primary mr-1.5" /> Replace condenser</div></div>
                <div><label className="block text-px-10 text-muted-foreground mb-1">Quantity</label><div className="h-9 rounded-md border border-border flex items-center px-2">1</div></div>
              </div>
              <div><label className="block text-px-10 text-muted-foreground mb-1">Used by</label><div className="h-9 rounded-md border border-border flex items-center px-2">Karim T.</div></div>
            </div>
            <div className="flex justify-end gap-2 mt-3"><div className="h-8 px-3 rounded-md border border-border text-xs flex items-center text-muted-foreground">Cancel</div><div className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-xs font-medium">Save</div></div>
          </div>
        </div>
      )}

      {/* Material detail modal */}
      {state.materialDetailOpen && (
        <div className="absolute inset-0 z-[6] flex items-start justify-center pt-10 bg-background/50">
          <div id="dp-demo-material-detail" className="w-[500px] bg-card border border-border rounded-xl shadow-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold inline-flex items-center gap-2"><Package className="h-4 w-4 text-primary" /> Condenser CU-12</p>
              <Trash2 className="h-4 w-4 text-destructive" />
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
              <div className="text-muted-foreground">SKU</div><div className="font-medium">CU-12-R410</div>
              <div className="text-muted-foreground">Category</div><div>Refrigeration</div>
              <div className="text-muted-foreground">Stock on hand</div><div>7 units</div>
              <div className="text-muted-foreground">Supplier</div><div>ClimaTN SARL</div>
              <div className="text-muted-foreground">Location</div><div>Sfax Main · A-12</div>
              <div className="text-muted-foreground">Unit cost</div><div>145,000 TND</div>
              <div className="text-muted-foreground">Used by</div><div>Karim T.</div>
              <div className="text-muted-foreground">Job</div><div>Replace condenser</div>
            </div>
            <div className="flex justify-end gap-2 mt-3"><div className="h-8 px-3 rounded-md border border-border text-xs flex items-center text-muted-foreground">Close</div><div className="h-8 px-3 rounded-md border border-border text-xs flex items-center gap-1.5"><Pencil className="h-3.5 w-3.5" /> Edit</div></div>
          </div>
        </div>
      )}

      {/* Share modal */}
      {state.shareOpen && (
        <div className="absolute inset-0 z-[6] flex items-start justify-center pt-10 bg-background/50">
          <div className="w-[440px] bg-card border border-border rounded-xl shadow-2xl p-4">
            <p className="text-sm font-semibold mb-3 inline-flex items-center gap-2"><Share2 className="h-4 w-4 text-primary" /> Share work report</p>
            <div className="space-y-2 text-xs">
              <div className="p-2 rounded border border-border bg-muted/40 flex items-center justify-between">
                <span className="text-primary truncate">https://flowentra.app/s/disp-2025-101/abc123</span>
                <span className="text-px-10 px-1.5 py-0.5 rounded bg-primary/10 text-primary">Copy</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded border border-border"><span>Include time & materials</span><span className="h-4 w-7 rounded-full bg-primary relative"><span className="absolute top-0.5 left-3.5 h-3 w-3 rounded-full bg-white" /></span></div>
              <div className="flex items-center justify-between p-2 rounded border border-border"><span>Track when opened</span><span className="h-4 w-7 rounded-full bg-primary relative"><span className="absolute top-0.5 left-3.5 h-3 w-3 rounded-full bg-white" /></span></div>
            </div>
            <div className="flex justify-end gap-2 mt-3"><div className="h-8 px-3 rounded-md border border-border text-xs flex items-center text-muted-foreground">Close</div><div className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-xs font-medium">Share</div></div>
          </div>
        </div>
      )}

      {/* Send modal (EmailComposer wrapper) */}
      {state.sendOpen && (
        <div className="absolute inset-0 z-[6] flex items-start justify-center pt-10 bg-background/40">
          <div className="w-[460px] bg-card border border-border rounded-xl shadow-2xl p-4">
            <p className="text-sm font-semibold mb-3 inline-flex items-center gap-2"><Send className="h-4 w-4" /> Send work report</p>
            <div className="space-y-2 text-xs">
              <div><label className="block text-px-10 text-muted-foreground mb-1">To</label><div className="h-9 px-3 rounded-md border border-border flex items-center">s.bouazizi@medina.tn</div></div>
              <div><label className="block text-px-10 text-muted-foreground mb-1">Subject</label><div className="h-9 px-3 rounded-md border border-border flex items-center">Work report — DISP-2025-101</div></div>
              <div className="h-16 rounded-md border border-border p-2 text-muted-foreground">Please find attached the work report for the intervention on Cold Room #3. Thank you for your trust.</div>
              <div className="flex items-center gap-1.5 text-muted-foreground"><Paperclip className="h-3 w-3" /> DISP-2025-101-report.pdf</div>
            </div>
            <div className="flex justify-end gap-2 mt-3"><div className="h-8 px-3 rounded-md border border-border text-xs flex items-center text-muted-foreground">Cancel</div><div className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-xs font-medium inline-flex items-center gap-1.5"><Send className="h-3.5 w-3.5" /> Send</div></div>
          </div>
        </div>
      )}

      {/* PDF + settings */}
      {state.pdfOpen && (
        <div className="absolute inset-0 z-[6] flex items-center justify-center bg-background/50 p-6">
          <div className="flex gap-3 h-full max-h-[85%]">
            <div className="w-72 bg-white text-black rounded-lg shadow-2xl border border-border overflow-hidden flex flex-col">
              <div className="bg-primary/90 text-white p-3"><div className="text-sm font-bold">WORK REPORT · DISP-2025-101</div><div className="text-px-9 opacity-90">Flowentra SARL</div></div>
              <div className="p-3 text-px-9 space-y-2 flex-1">
                <div><div className="font-semibold">Customer</div><div>Médina Resorts · Sousse</div></div>
                <div className="font-semibold">Jobs performed</div>
                <div>Diagnose compressor · Replace condenser · Commission & test</div>
                <div className="font-semibold pt-1">Time & materials</div>
                <div>Labour 2.5 h · 3 parts · Travel 45 TND</div>
                <div className="font-semibold pt-1">Attachments</div>
                <div>before.jpg · after.jpg · nameplate.jpg</div>
              </div>
              <div className="p-2 border-t border-border/40 flex gap-1 justify-end"><span className="text-px-9 px-2 py-1 rounded bg-primary/10 text-primary inline-flex items-center gap-1"><Download className="h-2.5 w-2.5" /> Download</span></div>
            </div>
            {state.pdfSettingsOpen && (
              <div id="dp-demo-pdf-settings" className="w-72 bg-card border border-border rounded-lg shadow-2xl p-3 flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold inline-flex items-center gap-1.5"><Palette className="h-3.5 w-3.5 text-primary" /> PDF Studio</p>
                  <div className="flex gap-1 text-px-9 text-muted-foreground">
                    <span className="px-1.5 py-0.5 rounded border border-border">Import</span>
                    <span className="px-1.5 py-0.5 rounded border border-border">Export</span>
                    <span className="px-1.5 py-0.5 rounded border border-border">Reset</span>
                  </div>
                </div>
                <div className="flex gap-1 mb-3 border-b border-border pb-2 flex-wrap">
                  {['Data', 'Layout', 'Colors', 'Typography', 'Advanced'].map((t, i) => (
                    <span key={t} className={`text-px-10 px-1.5 py-0.5 rounded ${i === 0 ? 'bg-primary text-primary-foreground' : 'text-muted-foreground border border-border'}`}>{t}</span>
                  ))}
                </div>
                <div className="space-y-2 text-xs flex-1">
                  <p className="text-px-10 text-muted-foreground uppercase tracking-wide">Sections</p>
                  {['Show customer block', 'Show jobs table', 'Show time & materials', 'Show attachments list'].map((l, i) => (
                    <div key={l} className="flex items-center justify-between text-px-11"><span>{l}</span><span className={`h-4 w-7 rounded-full ${i < 3 ? 'bg-primary' : 'bg-muted'} relative`}><span className={`absolute top-0.5 h-3 w-3 rounded-full bg-white ${i < 3 ? 'left-3.5' : 'left-0.5'}`} /></span></div>
                  ))}
                </div>
                <div className="flex justify-end gap-1 mt-3 pt-2 border-t border-border"><span className="text-px-10 px-2 py-1 rounded border border-border text-muted-foreground">Cancel</span><span className="text-px-10 px-2 py-1 rounded bg-primary text-primary-foreground">Save & close</span></div>
              </div>
            )}
          </div>
        </div>
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
  }, [stepIndex, open, finished, step?.target, state]);
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
          {DP_CHAPTERS.map(ch => (<button key={ch.id} onClick={() => jumpChapter(ch.start)} className={`text-px-10 font-medium px-2 py-0.5 rounded-full transition-colors cursor-pointer ${activeChapter.id === ch.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/70'}`}>{getChapterTitle(demoLang, ch.id, ch.title)}</button>))}
          <span className="ml-auto text-px-10 text-muted-foreground">{Math.min(stepIndex + 1, DP_STEPS.length)} / {DP_STEPS.length}</span>
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
            <p className="text-sm text-muted-foreground mb-5">Real status flow · Editable numbers · Required skills · Per-job time, expenses & materials · Unified attachments and checklists · Activity timeline · Share, Send & branded PDF studio.</p>
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

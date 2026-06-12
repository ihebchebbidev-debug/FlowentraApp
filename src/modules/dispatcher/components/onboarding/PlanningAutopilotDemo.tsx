import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  X, Play, Pause, RotateCcw, Volume2, VolumeX, Languages,
  Calendar as CalendarIcon, Map, LayoutGrid, List, Table as TableIcon, Search,
  Filter, Trash2, Sparkles, Wand2, RefreshCcw, Clock, User, Building2, MapPin,
  GripVertical, ChevronDown, ChevronRight, Star, Copy, Plus, CheckCircle2,
  AlertTriangle, Users, Settings2, Eye, Wrench,
} from 'lucide-react';
import { DemoCursor } from '@/modules/external/components/onboarding/DemoCursor';
import { pickBestVoice, splitForSpeech, languageTagFor } from '@/modules/external/components/onboarding/narrationVoice';
import {
  PL_STEPS, PL_CHAPTERS, initialPlanningDemoState,
  type PlanningDemoState,
} from './planningDemoScript';
import { pickLang, getCaption, getChapterTitle } from './planningDemoTranslations';

interface Props {
  open: boolean;
  onClose: () => void;
}

// ─── Demo data ──────────────────────────────────────────────────────────────

const DEMO_DISPATCHES = [
  { id: 'd1', num: 'DISP-2025-101', so: 'SO-2025-044 · AC Overhaul', customer: 'Acme Industries', tech: 'Karim T.', status: 'assigned',    priority: 'high',   time: '09:00 – 11:00', date: 'Mon 16 Jun' },
  { id: 'd2', num: 'DISP-2025-102', so: 'SO-2025-051 · Leak Repair',  customer: 'Médina Resorts', tech: 'Sami B.',  status: 'in_progress', priority: 'urgent', time: '08:30 – 10:00', date: 'Mon 16 Jun' },
  { id: 'd3', num: 'DISP-2025-103', so: 'SO-2025-058 · Inspection',   customer: 'Hydro Parts',    tech: '—',        status: 'pending',     priority: 'medium', time: '—',            date: '—' },
  { id: 'd4', num: 'DISP-2025-104', so: 'SO-2025-060 · Install Pump', customer: 'Acme Industries', tech: 'Leïla M.', status: 'assigned',    priority: 'medium', time: '13:00 – 15:30', date: 'Tue 17 Jun' },
  { id: 'd5', num: 'DISP-2025-105', so: 'SO-2025-061 · Maintenance',  customer: 'Sahara Foods',   tech: '—',        status: 'pending',     priority: 'low',    time: '—',            date: '—' },
];

const TECHS = [
  { id: 't1', name: 'Karim T.',  skills: ['Hydraulics', 'HVAC'],     status: 'available' },
  { id: 't2', name: 'Sami B.',   skills: ['Plumbing', 'Welding'],    status: 'busy' },
  { id: 't3', name: 'Leïla M.',  skills: ['HVAC', 'Electrical'],     status: 'available' },
];

// Calendar blocks per technician column (index aligns with TECHS)
const CAL_BLOCKS: Record<string, { top: number; h: number; label: string; sub: string; cls: string }[]> = {
  t1: [{ top: 8, h: 64, label: 'AC Overhaul', sub: '09:00 · Acme', cls: 'bg-blue-100 border-blue-300 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200' }],
  t2: [{ top: 0, h: 48, label: 'Leak Repair', sub: '08:30 · Médina', cls: 'bg-red-100 border-red-300 text-red-800 dark:bg-red-900/30 dark:text-red-200' },
       { top: 120, h: 40, label: 'On leave', sub: 'PM', cls: 'bg-muted border-border text-muted-foreground striped' }],
  t3: [{ top: 168, h: 80, label: 'Install Pump', sub: '13:00 · Acme', cls: 'bg-amber-100 border-amber-300 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200' }],
};

const SUGGEST = [
  { name: 'Karim T.', score: 92, top: true,  reasons: ['all skills match', 'available', '3.2 km away'] },
  { name: 'Leïla M.', score: 74, top: false, reasons: ['50% skill match', 'available', '8.0 km away'] },
  { name: 'Sami B.',  score: 41, top: false, reasons: ['busy', '1 job already today'] },
];

const PROFILES = [
  { name: 'Full Week', shared: false, active: true },
  { name: 'Emergency only', shared: false, active: false },
  { name: 'Plumbing — North', shared: true, active: false },
];

const SCHEDULE = [
  { day: 'Monday',    start: '08:00', end: '17:00', off: false },
  { day: 'Tuesday',   start: '08:00', end: '17:00', off: false },
  { day: 'Wednesday', start: '08:00', end: '17:00', off: false },
  { day: 'Thursday',  start: '08:00', end: '17:00', off: false },
  { day: 'Friday',    start: '08:00', end: '15:00', off: false },
  { day: 'Saturday',  start: '—',     end: '—',     off: true  },
  { day: 'Sunday',    start: '—',     end: '—',     off: true  },
];

const HOURS = ['08', '09', '10', '11', '12', '13', '14', '15', '16'];

const PRIO_CLS: Record<string, string> = {
  urgent: 'bg-red-500', high: 'bg-orange-400', medium: 'bg-blue-400', low: 'bg-gray-300',
};
const STATUS_CLS: Record<string, string> = {
  assigned:    'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  in_progress: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  pending:     'bg-muted text-muted-foreground',
  completed:   'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
};
function Pill({ s }: { s: string }) {
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${STATUS_CLS[s] ?? 'bg-muted text-muted-foreground'}`}>{s.replace(/_/g, ' ')}</span>;
}

// ─── Page: Dispatch Overview ────────────────────────────────────────────────

function StatCard({ id, icon, label, value, active }: { id: string; icon: React.ReactNode; label: string; value: number; active?: boolean }) {
  return (
    <div id={id} className={`rounded-lg p-3 border cursor-default transition-all ${active ? 'border-2 border-primary bg-primary/5' : 'border-border bg-card'}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className={`p-2 rounded-lg ${active ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>{icon}</span>
          <span className="text-xs text-muted-foreground font-medium">{label}</span>
        </div>
        <span className="text-sm font-bold">{value}</span>
      </div>
    </div>
  );
}

function PageOverview({ state }: { state: PlanningDemoState }) {
  const counts = {
    all: DEMO_DISPATCHES.length,
    assigned: DEMO_DISPATCHES.filter(d => d.status === 'assigned').length,
    in_progress: DEMO_DISPATCHES.filter(d => d.status === 'in_progress').length,
    pending: DEMO_DISPATCHES.filter(d => d.status === 'pending').length,
  };
  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-card/50">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10"><CalendarIcon className="h-6 w-6 text-primary" /></div>
          <div>
            <h1 id="pl-demo-title" className="text-xl font-semibold text-foreground">Planning &amp; Dispatch</h1>
            <p className="text-[11px] text-muted-foreground">Schedule field work across your team</p>
          </div>
        </div>
        <div id="pl-demo-dispatch-jobs" className="h-9 px-3 rounded-md bg-primary text-primary-foreground text-xs font-medium inline-flex items-center gap-1.5 cursor-default">
          <CalendarIcon className="h-3.5 w-3.5" /> Dispatch Jobs
        </div>
      </div>

      {/* KPI cards */}
      <div className="p-4 border-b border-border grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard id="pl-demo-stat-total"      icon={<List className="h-4 w-4" />}        label="Total"       value={counts.all}         active={state.selectedStat === 'all'} />
        <StatCard id="pl-demo-stat-assigned"   icon={<CheckCircle2 className="h-4 w-4" />} label="Assigned"    value={counts.assigned}    active={state.selectedStat === 'assigned'} />
        <StatCard id="pl-demo-stat-inprogress" icon={<Clock className="h-4 w-4" />}       label="In Progress" value={counts.in_progress} active={state.selectedStat === 'in_progress'} />
        <StatCard id="pl-demo-stat-pending"    icon={<AlertTriangle className="h-4 w-4" />} label="Pending"   value={counts.pending}     active={state.selectedStat === 'pending'} />
      </div>

      {/* Search + filters + views */}
      <div className="p-3 border-b border-border bg-card space-y-3">
        <div className="flex gap-2 items-center">
          <div id="pl-demo-search" className={`relative flex-1 ${state.searchActive ? 'ring-1 ring-primary rounded-md' : ''}`}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <div className="h-9 pl-10 pr-3 rounded-md border border-border bg-background text-sm text-muted-foreground flex items-center">{state.searchActive ? 'acme' : 'Search dispatches…'}</div>
          </div>
          <div id="pl-demo-filters" className={`h-9 px-3 rounded-md border text-sm flex items-center gap-1.5 cursor-default ${state.showFilters ? 'border-primary text-primary bg-primary/5' : 'border-border text-muted-foreground'}`}><Filter className="h-4 w-4" /> Filters</div>
          <div id="pl-demo-views" className="flex items-center gap-1 border border-border rounded-md overflow-hidden">
            {([['list', List], ['table', TableIcon], ['kanban', LayoutGrid]] as const).map(([m, Ic]) => (
              <div key={m} className={`h-9 px-2.5 flex items-center cursor-default ${state.overviewView === m ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}><Ic className="h-4 w-4" /></div>
            ))}
          </div>
        </div>
        {state.showFilters && (
          <div className="flex gap-2 pt-2 border-t border-border">
            <div className="h-8 px-2.5 rounded-md border border-border text-xs flex items-center gap-2 text-foreground">Status: Pending <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /></div>
            <div className="h-8 px-2.5 rounded-md border border-border text-xs flex items-center gap-2 text-foreground">Priority: Urgent <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /></div>
          </div>
        )}
      </div>

      {/* Bulk bar */}
      {state.bulkBar && (
        <div id="pl-demo-bulk" className="bg-destructive/10 border-b border-destructive/20 p-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="h-4 w-4 rounded bg-primary border border-primary inline-flex items-center justify-center"><span className="h-2 w-2 bg-primary-foreground rounded-sm" /></span>
            <span className="text-sm font-medium">2 selected</span>
            <span className="text-xs text-muted-foreground">Deselect all</span>
          </div>
          <div className="h-8 px-3 rounded-md bg-destructive text-destructive-foreground text-xs inline-flex items-center gap-1.5 cursor-default"><Trash2 className="h-3.5 w-3.5" /> Delete selected</div>
        </div>
      )}

      {/* Table */}
      <div className="p-4">
        <div id="pl-demo-table" className="border border-border rounded-lg overflow-hidden bg-card">
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
              {DEMO_DISPATCHES.filter(d => state.selectedStat === 'all' || d.status === state.selectedStat).map((d, i) => (
                <tr key={d.id} className={`border-b border-border/40 last:border-0 ${state.bulkBar && i < 2 ? 'bg-primary/5' : ''}`}>
                  {state.bulkBar && <td className="px-3 py-2.5"><span className={`h-3.5 w-3.5 rounded border inline-block ${i < 2 ? 'bg-primary border-primary' : 'border-border bg-background'}`} /></td>}
                  <td className="px-3 py-2.5 font-medium text-primary">{d.num}</td>
                  <td className="px-3 py-2.5"><span className="inline-flex items-center gap-1.5"><Building2 className="h-3 w-3 text-muted-foreground" />{d.so}</span></td>
                  <td className="px-3 py-2.5 text-primary">{d.customer}</td>
                  <td className="px-3 py-2.5 text-muted-foreground">{d.tech}</td>
                  <td className="px-3 py-2.5"><Pill s={d.status} /></td>
                  <td className="px-3 py-2.5"><span className="inline-flex items-center gap-1.5"><span className={`w-2 h-2 rounded-full ${PRIO_CLS[d.priority]}`} /><span className="capitalize">{d.priority}</span></span></td>
                  <td className="px-3 py-2.5 text-muted-foreground">{d.time !== '—' ? <span>{d.date} · {d.time}</span> : <span className="italic">Not scheduled</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Page: Planning board ───────────────────────────────────────────────────

function PageBoard({ state }: { state: PlanningDemoState }) {
  const hi = (k: string) => state.sidebarHi === k ? 'ring-1 ring-primary rounded-md' : '';
  return (
    <div className="flex flex-col h-full relative">
      {/* Header */}
      <div id="pl-demo-board-header" className="flex items-center justify-between p-3 border-b border-border bg-card/50">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-primary/10"><CalendarIcon className="h-5 w-5 text-primary" /></div>
          <div><h1 className="text-sm font-semibold">Planning Board</h1><p className="text-[10px] text-muted-foreground">Drag jobs onto a technician</p></div>
        </div>
        <div className="flex items-center gap-2">
          <div id="pl-demo-view-toggle" className="flex items-center bg-muted rounded-lg p-0.5 text-[11px]">
            <span className={`px-2 py-1 rounded ${state.boardView === 'calendar' ? 'bg-card shadow-sm' : 'text-muted-foreground'}`}>Day</span>
            <span className="px-2 py-1 rounded text-muted-foreground">Week</span>
          </div>
          <div className="flex items-center bg-muted rounded-lg p-0.5">
            <span className={`px-2 py-1 rounded text-[11px] inline-flex items-center gap-1 ${state.boardView === 'calendar' ? 'bg-card shadow-sm' : 'text-muted-foreground'}`}><LayoutGrid className="h-3.5 w-3.5" /> Calendar</span>
            <span id="pl-demo-map-btn" className={`px-2 py-1 rounded text-[11px] inline-flex items-center gap-1 ${state.boardView === 'map' ? 'bg-card shadow-sm' : 'text-muted-foreground'}`}><Map className="h-3.5 w-3.5" /> Map</span>
          </div>
          {/* Smart Planning group */}
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg border border-primary/30 bg-primary/5">
            <span className="hidden md:inline text-[10px] font-medium text-primary uppercase tracking-wide">Smart Planning</span>
            <div id="pl-demo-suggest-btn" className="h-7 px-2 rounded-md bg-primary text-primary-foreground text-[11px] inline-flex items-center gap-1 cursor-default"><Sparkles className="h-3.5 w-3.5" /> Suggest <span className="h-4 px-1 rounded bg-primary-foreground/20 text-[9px]">2</span></div>
            <div id="pl-demo-autofill-btn" className="h-7 px-2 rounded-md bg-primary text-primary-foreground text-[11px] inline-flex items-center gap-1 cursor-default"><Wand2 className="h-3.5 w-3.5" /> Auto-fill day</div>
          </div>
          <div className="h-7 px-2 rounded-md border border-border text-[11px] inline-flex items-center gap-1 text-muted-foreground"><RefreshCcw className="h-3.5 w-3.5" /> Update</div>
        </div>
      </div>

      {state.boardView === 'calendar' ? (
        <div className="flex-1 flex min-h-0">
          {/* Calendar */}
          <div id="pl-demo-calendar" className="flex-1 min-w-0 overflow-hidden p-3">
            <div className="border border-border rounded-lg overflow-hidden h-full flex flex-col bg-card">
              {/* Tech header row */}
              <div className="flex border-b border-border bg-muted/30">
                <div className="w-12 shrink-0 border-r border-border" />
                {TECHS.map(tech => (
                  <div key={tech.id} className="flex-1 px-2 py-1.5 text-center border-r border-border last:border-0">
                    <div className="text-[11px] font-medium">{tech.name}</div>
                    <div className="text-[9px] text-muted-foreground flex items-center justify-center gap-1">
                      <span className={`h-1.5 w-1.5 rounded-full ${tech.status === 'available' ? 'bg-green-500' : 'bg-amber-500'}`} />{tech.status}
                    </div>
                  </div>
                ))}
              </div>
              {/* Grid */}
              <div className="flex-1 flex relative overflow-hidden">
                {/* Hours gutter */}
                <div className="w-12 shrink-0 border-r border-border">
                  {HOURS.map(h => <div key={h} className="h-7 text-[9px] text-muted-foreground text-right pr-1.5 border-b border-border/40">{h}:00</div>)}
                </div>
                {/* Tech columns */}
                {TECHS.map((tech, ti) => (
                  <div key={tech.id} className="flex-1 relative border-r border-border last:border-0">
                    {HOURS.map(h => <div key={h} className="h-7 border-b border-border/40" />)}
                    {(CAL_BLOCKS[tech.id] || []).map((b, bi) => (
                      <div key={bi}
                        id={ti === 0 && bi === 0 ? 'pl-demo-calendar-job' : undefined}
                        className={`absolute left-1 right-1 rounded border px-1.5 py-0.5 overflow-hidden ${b.cls}`}
                        style={{ top: b.top + 'px', height: b.h + 'px' }}>
                        <div className="text-[10px] font-medium leading-tight truncate">{b.label}</div>
                        <div className="text-[9px] opacity-80 truncate">{b.sub}</div>
                      </div>
                    ))}
                    {/* Dropped job (drag&drop demo) on Karim's column */}
                    {state.dropped && ti === 0 && (
                      <div id="pl-demo-drop-slot" className="absolute left-1 right-1 rounded border-2 border-primary bg-primary/15 px-1.5 py-0.5 animate-in fade-in zoom-in" style={{ top: '112px', height: '56px' }}>
                        <div className="text-[10px] font-semibold leading-tight truncate text-primary">Inspection</div>
                        <div className="text-[9px] text-primary/80 truncate">11:30 · Hydro Parts</div>
                      </div>
                    )}
                  </div>
                ))}
                {/* Collision warning */}
                {state.dropped && (
                  <div id="pl-demo-collision" className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-card border border-amber-400/60 rounded-lg shadow-lg px-3 py-1.5 flex items-center gap-2">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                    <span className="text-[11px] text-foreground">No overlap · fits within working hours ✓</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div id="pl-demo-sidebar" className={`w-60 shrink-0 border-l border-border bg-card flex flex-col ${hi('list')}`}>
            <div className="p-2.5 border-b border-border">
              <h3 className="text-xs font-semibold mb-1.5">Service Orders</h3>
              <div id="pl-demo-sidebar-search" className={`space-y-1.5 ${hi('search')}`}>
                <div className="relative"><Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" /><div className="h-7 pl-7 rounded border border-border bg-background text-[11px] text-muted-foreground flex items-center">Search…</div></div>
                <div className="h-7 px-2 rounded border border-border bg-background text-[11px] text-muted-foreground flex items-center justify-between">Priority <ChevronDown className="h-3 w-3" /></div>
              </div>
              <div id="pl-demo-planned" className={`mt-1.5 h-7 rounded text-[11px] flex items-center justify-center gap-1 ${state.sidebarHi === 'planned' ? 'bg-primary text-primary-foreground' : 'border border-border text-muted-foreground'}`}><Eye className="h-3 w-3" /> Show Planned</div>
            </div>
            <div className="flex-1 overflow-hidden p-2 space-y-1.5">
              {/* Service order group */}
              <div id="pl-demo-so" className={`border rounded-lg bg-card/50 overflow-hidden ${state.sidebarHi === 'so' || state.sidebarHi === 'job' ? 'border-primary/60 shadow-sm' : 'border-border'}`}>
                <div className="p-2 border-b bg-muted/30 flex items-center gap-1.5">
                  <GripVertical id="pl-demo-drag-job" className="h-3 w-3 text-primary" />
                  <CalendarIcon className="h-3 w-3 text-primary" />
                  <span className="font-medium text-[11px] flex-1 truncate">SO-2025-058 · Inspection</span>
                  <span className="w-2 h-2 rounded-full bg-blue-400" />
                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
                </div>
                <div className="p-1.5 space-y-1">
                  <div id="pl-demo-job-hover" className={`p-1.5 border rounded bg-card flex items-center gap-1.5 ${state.sidebarHi === 'job' ? 'border-primary ring-1 ring-primary/40' : 'border-border'}`}>
                    <GripVertical className="h-3 w-3 text-muted-foreground opacity-60" />
                    <span className="text-[11px] font-medium flex-1 truncate">Pump inspection</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                  </div>
                  {state.sidebarHi === 'job' && (
                    <div className="rounded-lg border border-border bg-popover shadow-lg p-2.5 space-y-1.5 text-[11px]">
                      <div className="font-semibold">Pump inspection</div>
                      <div className="flex items-center gap-1.5 text-muted-foreground"><User className="h-3 w-3" /> Hydro Parts SARL</div>
                      <div className="flex items-center gap-1.5 text-muted-foreground"><Clock className="h-3 w-3" /> 1h 30m</div>
                      <div className="flex items-center gap-1.5 text-muted-foreground"><MapPin className="h-3 w-3" /> Z.I. Sfax, Route de Gabès</div>
                      <div className="pt-1 border-t border-border/60">
                        <span className="text-[9px] uppercase text-muted-foreground">Required skills</span>
                        <div className="flex gap-1 mt-1">{['Hydraulics', 'Inspection'].map(s => <span key={s} className="px-1.5 rounded-full border border-border text-[9px]">{s}</span>)}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              {/* second SO (collapsed) */}
              <div className="border border-border rounded-lg bg-card/50 p-2 flex items-center gap-1.5">
                <GripVertical className="h-3 w-3 text-primary" />
                <CalendarIcon className="h-3 w-3 text-primary" />
                <span className="font-medium text-[11px] flex-1 truncate">SO-2025-061 · Maintenance</span>
                <span className="w-2 h-2 rounded-full bg-gray-300" />
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              </div>
              {/* Planned divider */}
              {state.sidebarHi === 'planned' && (
                <div className="pt-2">
                  <div className="flex items-center gap-2 mb-1.5"><div className="h-px flex-1 bg-border" /><span className="text-[9px] uppercase text-muted-foreground inline-flex items-center gap-1"><CheckCircle2 className="h-2.5 w-2.5 text-green-600" /> Planned Orders</span><div className="h-px flex-1 bg-border" /></div>
                  <div className="border border-border rounded-lg bg-muted/10 p-2 flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3 text-green-600" /><span className="text-[11px] text-muted-foreground flex-1 truncate">SO-2025-044 · AC Overhaul</span><span className="text-[9px] px-1.5 rounded-full border border-blue-300 text-blue-600">scheduled</span></div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Map view */
        <div className="flex-1 p-3">
          <div id="pl-demo-map" className="h-full rounded-lg border border-border overflow-hidden relative bg-[linear-gradient(135deg,#e8f0e8_0%,#dce9f0_100%)] dark:bg-[linear-gradient(135deg,#1b2a1b_0%,#16242e_100%)]">
            <div className="absolute inset-0 opacity-40" style={{ backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 34px,rgba(120,120,120,.22) 35px),repeating-linear-gradient(90deg,transparent,transparent 34px,rgba(120,120,120,.22) 35px)' }} />
            {/* job pins */}
            {[{ x: '28%', y: '40%', c: 'bg-red-500', t: false }, { x: '60%', y: '55%', c: 'bg-blue-500', t: false }, { x: '44%', y: '70%', c: 'bg-amber-500', t: false }].map((p, i) => (
              <div key={i} className="absolute -translate-x-1/2 -translate-y-full" style={{ left: p.x, top: p.y }}><MapPin className={`h-6 w-6 ${p.c} text-white rounded-full p-0.5`} fill="currentColor" /></div>
            ))}
            {/* technician markers */}
            {[{ x: '34%', y: '46%' }, { x: '66%', y: '38%' }].map((p, i) => (
              <div key={i} className="absolute -translate-x-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center ring-2 ring-background" style={{ left: p.x, top: p.y }}>{['KT', 'LM'][i]}</div>
            ))}
            <div className="absolute bottom-2 left-2 text-[10px] text-muted-foreground bg-background/70 rounded px-2 py-0.5">3 jobs · 2 technicians in range</div>
            {state.mapAssign && (
              <div id="pl-demo-map-assign" className="absolute left-[28%] top-[40%] -translate-x-1/2 mt-1 w-52 bg-card border border-border rounded-lg shadow-2xl p-2.5">
                <div className="text-[11px] font-semibold mb-1.5">Assign — Leak Repair</div>
                <div className="space-y-1">
                  {[['Karim T.', '3.2 km', true], ['Leïla M.', '8.0 km', false]].map(([n, d, top]) => (
                    <div key={n as string} className={`flex items-center justify-between px-2 py-1 rounded text-[11px] ${top ? 'bg-primary/10 text-primary' : 'text-muted-foreground'}`}><span>{n}</span><span>{d}</span></div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Suggest popover */}
      {state.suggestOpen && (
        <div id="pl-demo-suggest-list" className="absolute right-4 top-16 z-[6] w-80 bg-card border border-border rounded-xl shadow-2xl overflow-hidden">
          <div className="px-3 py-2 border-b border-border">
            <div className="text-sm font-semibold">Best-fit technicians</div>
            <div className="text-[11px] text-muted-foreground">For SO-2025-058 · Inspection</div>
          </div>
          <div id="pl-demo-suggest-score" className="divide-y divide-border">
            {SUGGEST.map(s => (
              <div key={s.name} className="p-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium inline-flex items-center gap-1.5">{s.top && <Star className="h-3 w-3 fill-amber-400 text-amber-400" />}{s.name}</span>
                  <span className={`text-[11px] font-bold ${s.top ? 'text-primary' : 'text-muted-foreground'}`}>{s.score}<span className="text-[9px] font-normal">/100</span></span>
                </div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {s.reasons.map(r => <span key={r} className="px-1.5 rounded-full bg-muted text-[9px] text-muted-foreground">{r}</span>)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Auto-fill confirm */}
      {state.autofill === 1 && (
        <div className="absolute inset-0 z-[6] flex items-center justify-center bg-background/40">
          <div id="pl-demo-autofill-confirm" className="w-96 bg-card border border-border rounded-xl shadow-2xl p-4">
            <p className="text-sm font-semibold mb-2 inline-flex items-center gap-2"><Wand2 className="h-4 w-4 text-primary" /> Auto-fill today’s planning?</p>
            <p className="text-xs text-muted-foreground mb-4">This will assign up to <b>2</b> unassigned job(s) to your <b>3</b> visible technician(s), placed back-to-back inside their working hours. Existing assignments are never touched. You can adjust afterwards.</p>
            <div className="flex justify-end gap-2">
              <div className="h-8 px-3 rounded-md border border-border text-xs flex items-center text-muted-foreground cursor-default">Cancel</div>
              <div className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-xs font-medium flex items-center cursor-default">Run auto-fill</div>
            </div>
          </div>
        </div>
      )}
      {/* Auto-fill result */}
      {state.autofill === 2 && (
        <div id="pl-demo-autofill-result" className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[6] bg-card border border-green-400/50 rounded-lg shadow-2xl px-4 py-2.5 flex items-center gap-2.5">
          <span className="h-7 w-7 rounded-full bg-green-100 dark:bg-green-900/30 inline-flex items-center justify-center"><CheckCircle2 className="h-4 w-4 text-green-600" /></span>
          <div><p className="text-xs font-semibold">2 jobs auto-scheduled</p><p className="text-[10px] text-muted-foreground">Placed by priority · no conflicts · within working hours</p></div>
        </div>
      )}
    </div>
  );
}

// ─── Page: Planning Profiles ────────────────────────────────────────────────

function Toggle({ on, label }: { on: boolean; label: string }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-xs text-foreground">{label}</span>
      <span className={`h-4 w-7 rounded-full relative transition-colors ${on ? 'bg-primary' : 'bg-muted-foreground/30'}`}>
        <span className={`absolute top-0.5 h-3 w-3 rounded-full bg-white transition-all ${on ? 'left-3.5' : 'left-0.5'}`} />
      </span>
    </div>
  );
}

function PageProfiles({ state }: { state: PlanningDemoState }) {
  return (
    <div className="p-4 md:p-6 flex justify-center">
      <div className="w-full max-w-3xl bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div id="pl-demo-profiles-open" className="px-4 py-3 border-b border-border flex items-center gap-2">
          <Settings2 className="h-4 w-4 text-primary" /><h1 className="text-sm font-semibold">Planning Profiles</h1>
        </div>
        <div className="flex">
          {/* Profile list */}
          <div id="pl-demo-profile-list" className="w-48 shrink-0 border-r border-border p-2 space-y-2">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground px-1">My profiles</div>
            {PROFILES.filter(p => !p.shared).map(p => (
              <div key={p.name} className={`px-2 py-1.5 rounded-md text-xs flex items-center gap-1.5 cursor-default ${p.active ? 'bg-primary/10 text-primary border border-primary/30' : 'border border-transparent hover:bg-muted'}`}>
                {p.active && <Star className="h-3 w-3 fill-amber-400 text-amber-400" />}<span className="flex-1 truncate">{p.name}</span>
              </div>
            ))}
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground px-1 pt-1">Shared</div>
            {PROFILES.filter(p => p.shared).map(p => (
              <div key={p.name} className="px-2 py-1.5 rounded-md text-xs flex items-center gap-1.5 border border-transparent hover:bg-muted"><Users className="h-3 w-3 text-muted-foreground" /><span className="flex-1 truncate">{p.name}</span></div>
            ))}
            <div className="flex gap-1 pt-1">
              <div className="flex-1 h-7 rounded-md border border-border text-[10px] inline-flex items-center justify-center gap-1 text-muted-foreground"><Plus className="h-3 w-3" /> New</div>
              <div className="h-7 w-7 rounded-md border border-border inline-flex items-center justify-center text-muted-foreground"><Copy className="h-3 w-3" /></div>
            </div>
          </div>

          {/* Settings */}
          <div className="flex-1 min-w-0 p-3">
            {/* Tabs */}
            <div className="flex gap-1 border-b border-border mb-3 -mt-1">
              {([['display', 'Display'], ['users', 'Users & Skills'], ['permissions', 'Permissions']] as const).map(([k, l]) => (
                <div key={k} className={`px-3 py-1.5 text-xs font-medium border-b-2 cursor-default ${state.profileTab === k ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground'}`}>{l}</div>
              ))}
            </div>

            {state.profileTab === 'display' && (
              <div id="pl-demo-profile-display" className="grid grid-cols-2 gap-x-6">
                <div>
                  <div className="text-[10px] uppercase text-muted-foreground mb-1">Board mode</div>
                  <div className="flex gap-1 mb-3">
                    <span className="px-2 py-1 rounded bg-primary text-primary-foreground text-[11px]">Service Orders</span>
                    <span className="px-2 py-1 rounded border border-border text-[11px] text-muted-foreground">Installations</span>
                  </div>
                  <div className="text-[10px] uppercase text-muted-foreground mb-1">Default view</div>
                  <div className="flex gap-1 mb-3">
                    <span className="px-2 py-1 rounded border border-border text-[11px] text-muted-foreground">Day</span>
                    <span className="px-2 py-1 rounded bg-primary text-primary-foreground text-[11px]">Week</span>
                  </div>
                  <Toggle on label="Include weekends" />
                  <Toggle on label="Show duration labels" />
                </div>
                <div>
                  <div className="text-[10px] uppercase text-muted-foreground mb-1">Colour jobs by</div>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {['Status', 'Priority', 'Order', 'Technician'].map((c, i) => (
                      <span key={c} className={`px-2 py-1 rounded text-[11px] ${i === 0 ? 'bg-primary text-primary-foreground' : 'border border-border text-muted-foreground'}`}>{c}</span>
                    ))}
                  </div>
                  <Toggle on={false} label="Compact rows" />
                  <Toggle on={false} label="Display cancelled" />
                  <Toggle on label="Load planned orders" />
                </div>
              </div>
            )}

            {state.profileTab === 'users' && (
              <div id="pl-demo-profile-users" className="grid grid-cols-2 gap-x-6">
                <div>
                  <div className="text-[10px] uppercase text-muted-foreground mb-1.5">Visible technicians</div>
                  <div className="space-y-1">
                    {TECHS.map(t => (
                      <div key={t.id} className="flex items-center gap-2 px-2 py-1 rounded border border-border text-xs">
                        <span className="h-3.5 w-3.5 rounded bg-primary border border-primary inline-flex items-center justify-center"><span className="h-1.5 w-1.5 bg-primary-foreground rounded-sm" /></span>
                        <span className="flex-1">{t.name}</span>
                        <span className={`h-1.5 w-1.5 rounded-full ${t.status === 'available' ? 'bg-green-500' : 'bg-amber-500'}`} />
                      </div>
                    ))}
                  </div>
                  <div className="mt-2"><Toggle on label="Hide users without working hours" /><Toggle on label="Hide users on leave today" /></div>
                </div>
                <div id="pl-demo-profile-skills">
                  <div className="text-[10px] uppercase text-muted-foreground mb-1.5">Required skills</div>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {['HVAC', 'Hydraulics'].map(s => <span key={s} className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[11px]">{s} ✕</span>)}
                    <span className="px-2 py-0.5 rounded-full border border-dashed border-border text-[11px] text-muted-foreground">+ add</span>
                  </div>
                  <div className="text-[10px] uppercase text-muted-foreground mb-1">Match mode</div>
                  <div className="flex gap-1 mb-3">
                    <span className="px-2 py-1 rounded bg-primary text-primary-foreground text-[11px]">Any</span>
                    <span className="px-2 py-1 rounded border border-border text-[11px] text-muted-foreground">All</span>
                  </div>
                  <Toggle on label="Sort technicians by skill match" />
                </div>
              </div>
            )}

            {state.profileTab === 'permissions' && (
              <div id="pl-demo-profile-permissions" className="grid grid-cols-2 gap-x-6">
                <div>
                  <Toggle on label="Allow scheduling jobs" />
                  <Toggle on={false} label="Allow scheduling in the past" />
                  <Toggle on label="Confirm on overlap" />
                </div>
                <div>
                  <Toggle on label="Allow changing dispatches" />
                  <Toggle on label="Allow unassigning dispatches" />
                  <Toggle on={false} label="Auto-collapse completed" />
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-3 mt-3 border-t border-border">
              <div className="h-8 px-3 rounded-md border border-border text-xs flex items-center text-muted-foreground cursor-default">Save</div>
              <div id="pl-demo-profile-apply" className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-xs font-medium inline-flex items-center gap-1.5 cursor-default"><CheckCircle2 className="h-3.5 w-3.5" /> Save &amp; apply</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Page: Scheduler (working hours) ────────────────────────────────────────

function PageScheduler() {
  return (
    <div className="p-4 md:p-6 flex justify-center">
      <div className="w-full max-w-2xl">
        <div id="pl-demo-scheduler-open" className="flex items-center gap-2 mb-4"><Clock className="h-5 w-5 text-primary" /><h1 className="text-lg font-semibold">Working Hours — Karim T.</h1></div>
        <div id="pl-demo-scheduler-grid" className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="bg-muted/30 border-b border-border">
              <th className="text-left px-4 py-2 text-muted-foreground font-medium text-xs">Day</th>
              <th className="text-left px-4 py-2 text-muted-foreground font-medium text-xs">Start</th>
              <th className="text-left px-4 py-2 text-muted-foreground font-medium text-xs">End</th>
              <th className="text-right px-4 py-2 text-muted-foreground font-medium text-xs">Working</th>
            </tr></thead>
            <tbody>
              {SCHEDULE.map((row, i) => (
                <tr key={row.day} id={i === 0 ? 'pl-demo-scheduler-edit' : undefined} className="border-b border-border/40 last:border-0">
                  <td className="px-4 py-2.5 font-medium">{row.day}</td>
                  <td className="px-4 py-2.5"><span className={`px-2 py-1 rounded border text-xs ${row.off ? 'border-border text-muted-foreground' : 'border-border bg-background'}`}>{row.start}</span></td>
                  <td className="px-4 py-2.5"><span className={`px-2 py-1 rounded border text-xs ${row.off ? 'border-border text-muted-foreground' : 'border-border bg-background'}`}>{row.end}</span></td>
                  <td className="px-4 py-2.5 text-right">
                    <span className={`h-4 w-7 rounded-full relative inline-block ${row.off ? 'bg-muted-foreground/30' : 'bg-primary'}`}>
                      <span className={`absolute top-0.5 h-3 w-3 rounded-full bg-white ${row.off ? 'left-0.5' : 'left-3.5'}`} />
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[11px] text-muted-foreground mt-2">These hours bound the calendar, drive Auto-fill, and decide who can take a late job.</p>
      </div>
    </div>
  );
}

// ─── Main demo shell ────────────────────────────────────────────────────────

export function PlanningAutopilotDemo({ open, onClose }: Props) {
  const { i18n } = useTranslation();
  const [stepIndex, setStepIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(false);
  const [cursor, setCursor] = useState<{ x: number; y: number; clicking: boolean }>({ x: -200, y: -200, clicking: false });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clickRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const finished = stepIndex >= PL_STEPS.length;

  const state: PlanningDemoState = useMemo(() => {
    let s = initialPlanningDemoState;
    for (let i = 0; i < Math.min(stepIndex + 1, PL_STEPS.length); i++) s = PL_STEPS[i].apply(s);
    return s;
  }, [stepIndex]);

  const step = PL_STEPS[Math.min(stepIndex, PL_STEPS.length - 1)];
  const demoLang = pickLang(i18n.language);
  const captionText = getCaption(demoLang, Math.min(stepIndex, PL_STEPS.length - 1), step.caption);
  const finishedMsg =
    demoLang === 'fr' ? 'Votre tableau de planification est prêt — envoyez votre première équipe.' :
    'Your planning board is ready — dispatch your first crew.';

  useEffect(() => {
    if (open) { setStepIndex(0); setPlaying(true); }
    return () => { if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel(); };
  }, [open]);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    const synth = window.speechSynthesis;
    synth.getVoices();
    const onVoices = () => synth.getVoices();
    synth.addEventListener?.('voiceschanged', onVoices);
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
    const t = setTimeout(place, 160);
    return () => clearTimeout(t);
  }, [stepIndex, open, finished, step?.target, state.page, state.boardView, state.sidebarHi, state.suggestOpen, state.autofill, state.profileTab, state.showFilters, state.bulkBar, state.dropped, state.mapAssign]);

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
        if (voice) u.voice = voice;
        u.rate = 0.86;
        u.pitch = idx % 2 === 0 ? 1.02 : 0.98;
        u.volume = 1;
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

  const activeChapter = PL_CHAPTERS.find(c => stepIndex >= c.start && stepIndex < c.end) || PL_CHAPTERS[PL_CHAPTERS.length - 1];

  return (
    <div className="fixed inset-0 z-[110] bg-background flex flex-col select-none">
      {/* Top bar */}
      <div className="h-12 shrink-0 border-b border-border/60 bg-card flex items-center px-3 gap-3">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="h-7 w-7 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-sm shrink-0">
            <CalendarIcon className="h-3.5 w-3.5 text-primary-foreground" />
          </span>
          <span className="text-sm font-semibold truncate">Planning &amp; Dispatch — Live Demo</span>
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

      {/* Content */}
      <div className="flex-1 overflow-y-auto pointer-events-none">
        {state.page === 'overview'  && <PageOverview  state={state} />}
        {state.page === 'board'     && <PageBoard     state={state} />}
        {state.page === 'profiles'  && <PageProfiles  state={state} />}
        {state.page === 'scheduler' && <PageScheduler />}
      </div>

      {/* Caption + chapters */}
      <div className="shrink-0 border-t border-border/60 bg-card px-4 py-3">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          {PL_CHAPTERS.map(ch => (
            <button
              key={ch.id}
              onClick={() => jumpChapter(ch.start)}
              className={`text-[10px] font-medium px-2 py-0.5 rounded-full transition-colors cursor-pointer
                ${activeChapter.id === ch.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/70'}`}
            >
              {getChapterTitle(demoLang, ch.id, ch.title)}
            </button>
          ))}
          <span className="ml-auto text-[10px] text-muted-foreground">{Math.min(stepIndex + 1, PL_STEPS.length)} / {PL_STEPS.length}</span>
        </div>
        <div className="h-1 rounded-full bg-muted overflow-hidden mb-2">
          <div className="h-full bg-primary transition-all duration-300" style={{ width: `${(Math.min(stepIndex + 1, PL_STEPS.length) / PL_STEPS.length) * 100}%` }} />
        </div>
        <p className="text-sm text-foreground/90 min-h-[20px] flex items-center gap-2">
          <Languages className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
          {finished ? finishedMsg : captionText}
        </p>
      </div>

      {/* Virtual cursor */}
      {!finished && <DemoCursor x={cursor.x} y={cursor.y} clicking={cursor.clicking} />}

      {/* End card */}
      {finished && (
        <div className="absolute inset-0 z-[115] flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl shadow-2xl p-6 max-w-sm text-center">
            <div className="h-12 w-12 mx-auto rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center mb-3">
              <CalendarIcon className="h-6 w-6 text-primary-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-1">Your whole field team, on one board</h3>
            <p className="text-sm text-muted-foreground mb-5">
              Drag-and-drop calendar · Smart suggestions · Auto-fill · Routing map · Profiles · Working hours — all connected.
            </p>
            <div className="flex flex-col gap-2">
              <button onClick={onClose} className="w-full h-10 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 cursor-pointer">
                Start planning
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

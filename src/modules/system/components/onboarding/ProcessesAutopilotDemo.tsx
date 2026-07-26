import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  X, Play, Pause, RotateCcw, Volume2, VolumeX, Languages,
  Zap, Search, Filter, RefreshCw, Clock, ChevronRight, ChevronDown,
  Activity, CircleDot, AlertTriangle, XCircle, CheckCircle2, StopCircle, Square,
} from 'lucide-react';
import { DemoCursor } from '@/modules/external/components/onboarding/DemoCursor';
import { pickBestVoice, splitForSpeech, languageTagFor, configureUtteranceForFemaleVoice } from '@/modules/external/components/onboarding/narrationVoice';
import {
  PROC_STEPS, PROC_CHAPTERS, initialProcessesDemoState, DEMO_REAL_PROCESSES,
  type ProcessesDemoState,
} from './processesDemoScript';
import { pickLang, getCaption, getChapterTitle } from './processesDemoTranslations';

interface Props { open: boolean; onClose: () => void; }

// ─── Demo data ───────────────────────────────────────────────────────────────

interface DemoRow {
  key: string;
  name: string;
  module: string;
  schedule: string;
  last: string;
  next: string;
  status: 'idle' | 'running' | 'paused' | 'failed' | 'blocked';
  paused?: boolean;
}

// Rotating placeholders so the list feels alive without lying about real runs.
const LAST_HINTS = ['12m ago', '48m ago', '2h ago', '9h ago', '17h ago', '3d ago'];
const NEXT_HINTS = ['in 48m', 'in 11m', 'in 5h',  'in 15h', 'in 22h', 'in 1d'];

const ROWS: DemoRow[] = DEMO_REAL_PROCESSES.map((p, i) => ({
  key: p.key,
  name: p.name,
  module: p.module,
  schedule: p.schedule,
  last: LAST_HINTS[i % LAST_HINTS.length],
  next: NEXT_HINTS[i % NEXT_HINTS.length],
  // Keep exactly one row "running" so the Running KPI on the header reads 1.
  status: p.key === 'admin.retry-failed-emails' ? 'running' : 'idle',
}));

const RUNNING_COUNT = ROWS.filter(r => r.status === 'running').length;

const STATUS_META: Record<DemoRow['status'], { label: string; cls: string; Icon: any }> = {
  idle:    { label: 'Idle',    cls: 'bg-muted text-muted-foreground border-border',                Icon: CircleDot },
  running: { label: 'Running', cls: 'bg-primary/10 text-primary border-primary/30',                Icon: Activity },
  paused:  { label: 'Paused',  cls: 'bg-muted text-muted-foreground border-border',                Icon: Pause },
  failed:  { label: 'Failed',  cls: 'bg-destructive/10 text-destructive border-destructive/30',    Icon: XCircle },
  blocked: { label: 'Blocked', cls: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30', Icon: AlertTriangle },
};

function StatusPill({ s }: { s: DemoRow['status'] }) {
  const m = STATUS_META[s];
  const Icon = m.Icon;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium ${m.cls}`}>
      <Icon className={`h-3 w-3 ${s === 'running' ? 'animate-pulse' : ''}`} />
      {m.label}
    </span>
  );
}

// ─── Metric chip ─────────────────────────────────────────────────────────────

function Metric({
  id, label, value, tone, active,
}: { id: string; label: string; value: number; tone: 'primary' | 'destructive' | 'amber' | 'muted'; active?: boolean }) {
  const toneCls = {
    primary:     'bg-primary/10 text-primary border-primary/30',
    destructive: 'bg-destructive/10 text-destructive border-destructive/30',
    amber:       'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30',
    muted:       'bg-muted text-muted-foreground border-border',
  }[tone];
  return (
    <div id={id} className={`rounded-md border px-2.5 py-1 text-xs font-medium ${toneCls} ${active ? 'ring-2 ring-primary shadow-medium' : ''}`}>
      <span className="opacity-70 mr-1">{label}</span>{value}
    </div>
  );
}

// ─── Page: list ──────────────────────────────────────────────────────────────

function PageList({ state }: { state: ProcessesDemoState }) {
  return (
    <div className="flex flex-col gap-4 p-4 sm:p-6">
      {/* Header card — mirrors ProcessesPage */}
      <div className="border-0 shadow-card bg-card rounded-xl">
        <div className="p-4 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 id="proc-demo-title" className="flex items-center gap-2 text-base font-semibold">
                <Zap className="h-4 w-4 text-primary" />
                Processes
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Schedule, monitor and control every recurring or background job across all workspaces.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Metric id="proc-demo-metric-running" label="Running" value={RUNNING_COUNT} tone="primary"     active={state.highlightMetric === 'running'} />
              <Metric id="proc-demo-metric-failed"  label="Failed"  value={0} tone="destructive" active={state.highlightMetric === 'failed'} />
              <Metric id="proc-demo-metric-blocked" label="Blocked" value={0} tone="amber"       active={state.highlightMetric === 'blocked'} />
              <Metric id="proc-demo-metric-paused"  label="Paused"  value={0} tone="muted"       active={state.highlightMetric === 'paused'} />
              <Metric id="proc-demo-metric-total"   label="Total"   value={ROWS.length} tone="muted" active={state.highlightMetric === 'total'} />
              <div id="proc-demo-refresh" className="h-8 px-3 rounded-md border border-border text-xs inline-flex items-center gap-1.5 text-foreground">
                <RefreshCw className="h-3.5 w-3.5" /> Refresh
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="border-0 shadow-card bg-card rounded-xl">
        <div className="p-3 sm:p-4">
          <div className="flex flex-wrap items-center gap-2">
            <div id="proc-demo-search" className={`relative flex-1 min-w-[200px] ${state.searchActive ? 'ring-2 ring-primary rounded-md' : ''}`}>
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <div className="h-9 pl-8 pr-3 rounded-md border border-border bg-background text-sm text-muted-foreground flex items-center">
                {state.searchActive ? 'invoice' : 'Search processes…'}
              </div>
            </div>
            <div id="proc-demo-workspace-filter" className={`w-[180px] h-9 rounded-md border px-3 text-sm inline-flex items-center gap-2 ${state.workspaceFilterOpen ? 'border-primary text-primary bg-primary/5' : 'border-border text-foreground'}`}>
              <Filter className="h-3.5 w-3.5" />
              <span className="flex-1">{state.workspaceFilterOpen ? 'Admin' : 'All workspaces'}</span>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <div id="proc-demo-status-filter" className={`w-[140px] h-9 rounded-md border px-3 text-sm inline-flex items-center gap-2 ${state.statusFilterOpen ? 'border-primary text-primary bg-primary/5' : 'border-border text-foreground'}`}>
              <span className="flex-1">{state.statusFilterOpen ? 'Running' : 'All status'}</span>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
          </div>
          {state.workspaceFilterOpen && (
            <div className="mt-2 w-[220px] rounded-md border border-border bg-popover shadow-lg p-1 text-sm">
              {['All workspaces', 'Admin', 'Sales', 'Field', 'Communication'].map((w, i) => (
                <div key={w} className={`px-3 py-1.5 rounded ${i === 1 ? 'bg-accent text-accent-foreground' : ''}`}>{w}</div>
              ))}
            </div>
          )}
          {state.statusFilterOpen && (
            <div className="mt-2 w-[180px] rounded-md border border-border bg-popover shadow-lg p-1 text-sm">
              {['All status', 'Running', 'Failed', 'Blocked', 'Paused', 'Idle'].map((w, i) => (
                <div key={w} className={`px-3 py-1.5 rounded ${i === 1 ? 'bg-accent text-accent-foreground' : ''}`}>{w}</div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Grouped list */}
      <div id="proc-demo-group-admin" className="border-0 shadow-card bg-card rounded-xl">
        <div className="p-4 pb-2">
          <div className="flex items-center gap-2">
            <span className="uppercase tracking-wider text-[10px] rounded-md bg-secondary text-secondary-foreground px-2 py-0.5 font-medium">
              Admin
            </span>
            <span className="text-xs text-muted-foreground">{ROWS.length} processes</span>
          </div>
        </div>
        <div className="divide-y">
          {ROWS.map((r, i) => {
            const focus = state.focusRowIndex === i || state.focusProcessKey === r.key;
            return (
              <div
                key={r.key}
                id={`proc-demo-row-key-${r.key}`}
                data-row-index={i}
                className={`grid grid-cols-12 items-center gap-2 px-4 py-3 transition-colors ${focus ? 'bg-primary/5 ring-1 ring-primary/40' : ''}`}
              >
                <div className="col-span-5 min-w-0" id={i === 0 ? 'proc-demo-row-0' : undefined}>
                  <div className="font-medium text-sm truncate">{r.name}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {r.module} · <span className="font-mono opacity-80">{r.key}</span>
                  </div>
                </div>
                <div className="col-span-2 items-center gap-1.5 text-xs text-muted-foreground hidden sm:flex">
                  <Clock className="h-3 w-3" />
                  <span className="truncate">{r.schedule}</span>
                </div>
                <div className="col-span-2 text-xs text-muted-foreground hidden sm:block">
                  <div>Last: {r.last}</div>
                  <div>Next: {r.next}</div>
                </div>
                <div className="col-span-2">
                  <span id={i === 0 ? 'proc-demo-row-status' : undefined}>
                    <StatusPill s={r.status} />
                  </span>
                </div>
                <div className="col-span-1 flex items-center justify-end gap-1">
                  <span
                    id={i === 0 ? 'proc-demo-row-run' : undefined}
                    className={`h-7 w-7 inline-flex items-center justify-center rounded-md ${i === 0 && state.focusRowAction === 'run' ? 'bg-primary/15 text-primary ring-2 ring-primary' : 'text-muted-foreground'}`}
                  >
                    <Play className="h-3.5 w-3.5" />
                  </span>
                  <span
                    id={i === 0 ? 'proc-demo-row-pause' : undefined}
                    className={`h-7 w-7 inline-flex items-center justify-center rounded-md ${i === 0 && state.focusRowAction === 'pause' ? 'bg-primary/15 text-primary ring-2 ring-primary' : 'text-muted-foreground'}`}
                  >
                    <Pause className="h-3.5 w-3.5" />
                  </span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Drawer overlay ──────────────────────────────────────────────────────────

function Drawer({ state }: { state: ProcessesDemoState }) {
  if (!state.drawerOpen) return null;
  const r = ROWS[0];
  const h = state.drawerHighlight;
  const ring = (key: NonNullable<ProcessesDemoState['drawerHighlight']>) =>
    h === key ? 'ring-2 ring-primary rounded-md' : '';

  return (
    <div className="absolute inset-0 z-[6] flex justify-end bg-background/50">
      <div className="w-full sm:max-w-xl h-full bg-card border-l border-border shadow-2xl overflow-y-auto">
        {/* Header */}
        <div id="proc-demo-drawer-header" className={`p-6 pb-3 ${ring('header')}`}>
          <div className="flex items-center gap-2 mb-2">
            <span className="uppercase tracking-wider text-[10px] rounded-md bg-secondary text-secondary-foreground px-2 py-0.5 font-medium">
              Admin
            </span>
            <StatusPill s={r.status} />
          </div>
          <h2 className="text-base font-semibold">{r.name}</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Flip any invoice past its due date into <em>overdue</em> so the KPI is live and the chase list is accurate.
          </p>
          <div className="text-[11px] text-muted-foreground font-mono pt-1">
            {r.module} · anchor: invoices.mark-overdue
          </div>
        </div>

        {/* Action bar */}
        <div id="proc-demo-drawer-actions" className={`px-6 py-3 flex flex-wrap items-center gap-2 ${ring('actions')}`}>
          <div className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-xs font-medium inline-flex items-center gap-1.5 shadow-medium">
            <Play className="h-3.5 w-3.5" /> Run now
          </div>
          <div className="h-8 px-3 rounded-md border border-border text-xs inline-flex items-center gap-1.5 text-foreground">
            <Pause className="h-3.5 w-3.5" /> Pause
          </div>
          <div className="h-8 px-3 rounded-md border border-border text-xs inline-flex items-center gap-1.5 text-muted-foreground opacity-70" title="Stop is advisory">
            <StopCircle className="h-3.5 w-3.5" /> Stop
          </div>
          <div className="h-8 px-3 rounded-md text-xs inline-flex items-center gap-1.5 text-muted-foreground">
            Reset failures
          </div>
          <div id="proc-demo-drawer-enable" className={`ml-auto flex items-center gap-2 text-xs ${ring('enable')}`}>
            <span className="text-muted-foreground">Enabled</span>
            <span className="h-5 w-9 rounded-full bg-primary relative">
              <span className="absolute top-0.5 right-0.5 h-4 w-4 rounded-full bg-white shadow" />
            </span>
          </div>
        </div>

        <div className="h-px bg-border" />

        {/* Tabs */}
        <div className="px-6 pt-4">
          <div className="grid grid-cols-4 h-9 rounded-md bg-muted p-1 text-xs font-medium">
            {(['overview', 'schedule', 'history', 'diagnostics'] as const).map((t) => (
              <div
                key={t}
                id={t !== 'overview' ? `proc-demo-drawer-tab-${t}` : undefined}
                className={`flex items-center justify-center rounded capitalize ${state.drawerTab === t ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'}`}
              >
                {t}
              </div>
            ))}
          </div>

          {/* Overview */}
          {state.drawerTab === 'overview' && (
            <div id="proc-demo-drawer-overview" className={`pt-3 space-y-2 ${ring('overview')}`}>
              {[
                ['Schedule', 'Every 60 min'],
                ['Timezone', 'Africa/Tunis'],
                ['Last run', '12m ago'],
                ['Last duration', '184ms'],
                ['Last items', '3'],
                ['Next run', 'in 48m'],
                ['Success (30 runs)', '100%'],
                ['Consecutive failures', '0'],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-muted-foreground">{k}</span>
                  <span className="font-medium text-right">{v}</span>
                </div>
              ))}
            </div>
          )}

          {/* Schedule */}
          {state.drawerTab === 'schedule' && (
            <div className="pt-3 space-y-3">
              <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">Type</span><span className="font-medium">interval</span></div>
              <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">Interval</span><span className="font-medium">Every 60 min</span></div>
              <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">Timezone</span><span className="font-medium">Africa/Tunis</span></div>

              <div className={`flex items-end gap-2 pt-2 p-2 ${ring('schedule-interval')}`}>
                <div className="flex-1">
                  <label className="text-xs text-muted-foreground">New interval (minutes)</label>
                  <div className="h-9 mt-1 rounded-md border border-input bg-background px-3 text-sm flex items-center">
                    {state.intervalDraft}
                  </div>
                </div>
                <div className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium inline-flex items-center">
                  Save
                </div>
              </div>
            </div>
          )}

          {/* History */}
          {state.drawerTab === 'history' && (
            <div className="pt-3">
              <div className="divide-y text-xs">
                {[
                  state.runJustCompleted && { when: 'just now',  dur: '186ms', items: 4, by: 'manual',    status: 'success' as const, err: '' },
                  { when: '12m ago',  dur: '184ms', items: 3, by: 'scheduler', status: 'success' as const, err: '' },
                  { when: '1h ago',   dur: '191ms', items: 2, by: 'scheduler', status: 'success' as const, err: '' },
                  { when: '2h ago',   dur: '208ms', items: 5, by: 'scheduler', status: 'success' as const, err: '' },
                  { when: '3h ago',   dur: '512ms', items: 0, by: 'scheduler', status: 'failed'  as const, err: 'DB connection reset — retry scheduled.' },
                  { when: '4h ago',   dur: '173ms', items: 1, by: 'scheduler', status: 'success' as const, err: '' },
                ].filter(Boolean).map((row: any, i) => (
                  <div
                    key={i}
                    id={i === 0 ? 'proc-demo-drawer-tab-history-row' : undefined}
                    className={`grid grid-cols-12 gap-2 py-2 ${i === 0 && h === 'history-row' ? ring('history-row') + ' bg-primary/5' : ''}`}
                  >
                    <div className="col-span-4 text-muted-foreground">{row.when}</div>
                    <div className="col-span-2">{row.dur}</div>
                    <div className="col-span-2 tabular-nums">{row.items}</div>
                    <div className="col-span-2 capitalize text-muted-foreground">{row.by}</div>
                    <div className="col-span-2 text-right">
                      {row.status === 'success'
                        ? <span className="inline-flex items-center gap-1 text-primary"><CheckCircle2 className="h-3 w-3" />ok</span>
                        : <span className="inline-flex items-center gap-1 text-destructive"><XCircle className="h-3 w-3" />fail</span>}
                    </div>
                    {row.err && <div className="col-span-12 pl-1 text-destructive/80">↳ {row.err}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Diagnostics */}
          {state.drawerTab === 'diagnostics' && (
            <div className="pt-3 space-y-2">
              <div className="text-xs text-muted-foreground pb-1">
                Automated checks answering <em>why is this process blocked?</em>
              </div>
              {[
                { ok: true,  label: 'Table invoices exists',       detail: 'public.invoices reachable · 12,842 rows' },
                { ok: true,  label: 'Handler registered',           detail: 'MarkOverdueInvoicesHandler v3' },
                { ok: true,  label: 'Scheduler advisory lock free', detail: 'pg_try_advisory_lock returns true' },
                { ok: true,  label: 'Timezone set',                 detail: 'Africa/Tunis' },
              ].map((d, i) => (
                <div
                  key={i}
                  id={i === 0 ? 'proc-demo-drawer-tab-diagnostics-item' : undefined}
                  className={`flex items-start gap-2 rounded-md border p-2 text-sm ${i === 0 && h === 'diagnostic-item' ? ring('diagnostic-item') + ' bg-primary/5' : ''}`}
                >
                  {d.ok
                    ? <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    : <XCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />}
                  <div className="min-w-0">
                    <div className="font-medium">{d.label}</div>
                    <div className="text-xs text-muted-foreground">{d.detail}</div>
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

// The drawer uses aliased target ids (…-tab-history / …-tab-diagnostics) that
// map to the tab buttons themselves for cursor placement.

// ─── Main shell ──────────────────────────────────────────────────────────────

export function ProcessesAutopilotDemo({ open, onClose }: Props) {
  const { i18n } = useTranslation();
  const [stepIndex, setStepIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(false);
  const [cursor, setCursor] = useState<{ x: number; y: number; clicking: boolean }>({ x: -200, y: -200, clicking: false });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clickRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const finished = stepIndex >= PROC_STEPS.length;
  const state: ProcessesDemoState = useMemo(() => {
    let s = initialProcessesDemoState;
    for (let i = 0; i < Math.min(stepIndex + 1, PROC_STEPS.length); i++) s = PROC_STEPS[i].apply(s);
    return s;
  }, [stepIndex]);

  const step = PROC_STEPS[Math.min(stepIndex, PROC_STEPS.length - 1)];
  const demoLang = pickLang(i18n.language);
  const captionText = getCaption(demoLang, Math.min(stepIndex, PROC_STEPS.length - 1), step.caption);
  const finishedMsg =
    demoLang === 'fr' ? 'Votre module Processus est prêt — laissez-le tourner tout seul.' :
    'Your Processes module is ready — let it run itself.';

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
      // Scroll per-process rows into view so the whole tour is visible even
      // when the list is 20 items long.
      if (step.target.startsWith('proc-demo-row-key-')) {
        try { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch { /* noop */ }
      }
      const r = el.getBoundingClientRect();
      setCursor({ x: r.left + Math.min(r.width / 2, 120), y: r.top + Math.min(r.height / 2, 40), clicking: true });
      if (clickRef.current) clearTimeout(clickRef.current);
      clickRef.current = setTimeout(() => setCursor(c => ({ ...c, clicking: false })), 450);
    };
    const t = setTimeout(place, 260); return () => clearTimeout(t);
  }, [stepIndex, open, finished, step?.target, state.drawerOpen, state.drawerTab, state.drawerHighlight, state.workspaceFilterOpen, state.statusFilterOpen, state.focusRowIndex, state.focusRowAction, state.focusProcessKey]);

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
  const activeChapter = PROC_CHAPTERS.find(c => stepIndex >= c.start && stepIndex < c.end) || PROC_CHAPTERS[PROC_CHAPTERS.length - 1];

  return (
    <div className="fixed inset-0 z-[110] bg-background flex flex-col select-none">
      {/* Toolbar */}
      <div className="h-12 shrink-0 border-b border-border/60 bg-card flex items-center px-3 gap-3">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="h-7 w-7 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-sm shrink-0">
            <Zap className="h-3.5 w-3.5 text-primary-foreground" />
          </span>
          <span className="text-sm font-semibold truncate">Processes — Live Demo</span>
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
        <PageList state={state} />
        <Drawer state={state} />
      </div>

      {/* Chapter footer */}
      <div className="shrink-0 border-t border-border/60 bg-card px-4 py-3">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          {PROC_CHAPTERS.map(ch => (
            <button
              key={ch.id}
              onClick={() => jumpChapter(ch.start)}
              className={`text-[10px] font-medium px-2 py-0.5 rounded-full transition-colors cursor-pointer ${activeChapter.id === ch.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/70'}`}
            >
              {getChapterTitle(demoLang, ch.id, ch.title)}
            </button>
          ))}
          <span className="ml-auto text-[10px] text-muted-foreground">{Math.min(stepIndex + 1, PROC_STEPS.length)} / {PROC_STEPS.length}</span>
        </div>
        <div className="h-1 rounded-full bg-muted overflow-hidden mb-2">
          <div className="h-full bg-primary transition-all duration-300" style={{ width: `${(Math.min(stepIndex + 1, PROC_STEPS.length) / PROC_STEPS.length) * 100}%` }} />
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
              <Zap className="h-6 w-6 text-primary-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-1">Set it and forget it</h3>
            <p className="text-sm text-muted-foreground mb-5">
              Lock-safe auto-runs · Live KPIs · Per-row Run &amp; Pause · Deep drawer with schedule, history and self-diagnostics.
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

export default ProcessesAutopilotDemo;

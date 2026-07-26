// Processes module autopilot demo.
// Scripted state transitions, virtual cursor, and EN/FR narration.
// English captions live inline here; translations in processesDemoTranslations.ts
// (must stay PROC_STEPS.length long, same order).

export type ProcessesDemoPage = 'list';

export type DrawerTab = 'overview' | 'schedule' | 'history' | 'diagnostics';

export interface ProcessesDemoState {
  page: ProcessesDemoPage;
  // Header metrics
  highlightMetric: null | 'running' | 'failed' | 'blocked' | 'paused' | 'total';
  // Toolbar
  searchActive: boolean;
  workspaceFilterOpen: boolean;
  statusFilterOpen: boolean;
  // List row focus
  focusRowIndex: number | null; // 0..3
  focusRowAction: null | 'run' | 'pause';
  // Drawer
  drawerOpen: boolean;
  drawerTab: DrawerTab;
  drawerHighlight:
    | null
    | 'header'
    | 'actions'
    | 'enable'
    | 'overview'
    | 'schedule-interval'
    | 'history-row'
    | 'diagnostic-item';
  // Simulated run outcome shown in history
  runJustCompleted: boolean;
  // Interval editor animation
  intervalDraft: number;
}

export const initialProcessesDemoState: ProcessesDemoState = {
  page: 'list',
  highlightMetric: null,
  searchActive: false,
  workspaceFilterOpen: false,
  statusFilterOpen: false,
  focusRowIndex: null,
  focusRowAction: null,
  drawerOpen: false,
  drawerTab: 'overview',
  drawerHighlight: null,
  runJustCompleted: false,
  intervalDraft: 60,
};

export interface ProcessesDemoStep {
  target: string;
  caption: string;
  duration: number;
  apply: (s: ProcessesDemoState) => ProcessesDemoState;
}
export interface ProcessesDemoChapter { id: string; title: string; start: number; end: number; }

const pure =
  (apply: (s: ProcessesDemoState) => Partial<ProcessesDemoState>) =>
  (s: ProcessesDemoState): ProcessesDemoState => ({ ...s, ...apply(s) });

export const PROC_STEPS: ProcessesDemoStep[] = [
  // ── Chapter 1 · Overview & KPIs ─────────────────────────────────────────
  {
    target: 'proc-demo-title',
    caption:
      'This is Processes — the control tower for every recurring or background job that keeps the platform tidy: overdue invoices, expiring offers, log purges, missed dispatches, and more.',
    duration: 6200,
    apply: pure(() => ({
      highlightMetric: null, searchActive: false, workspaceFilterOpen: false,
      statusFilterOpen: false, focusRowIndex: null, focusRowAction: null,
      drawerOpen: false, drawerTab: 'overview', drawerHighlight: null,
    })),
  },
  {
    target: 'proc-demo-metric-running',
    caption:
      'Running counts the jobs firing right now. The scheduler holds an advisory lock while a job runs so the exact same job can never double-fire, even across restarts.',
    duration: 5600,
    apply: pure(() => ({ highlightMetric: 'running' })),
  },
  {
    target: 'proc-demo-metric-failed',
    caption:
      'Failed shows jobs whose last run threw an error. The retry ladder backs them off automatically, and you can clear the counter once you fix the cause.',
    duration: 5200,
    apply: pure(() => ({ highlightMetric: 'failed' })),
  },
  {
    target: 'proc-demo-metric-blocked',
    caption:
      'Blocked means a job cannot run yet — usually a missing table, missing config, or a dependency that has not been set up. The diagnostics tab tells you exactly why.',
    duration: 5400,
    apply: pure(() => ({ highlightMetric: 'blocked' })),
  },
  {
    target: 'proc-demo-metric-paused',
    caption:
      'Paused is the count of schedules you have manually stopped. The rows stay listed so you can resume them the moment they are needed again.',
    duration: 5000,
    apply: pure(() => ({ highlightMetric: 'paused' })),
  },
  {
    target: 'proc-demo-metric-total',
    caption:
      'Total is every process backed by a real, verified handler — the ones we know execute end to end on your servers. Unreliable stubs are hidden by design.',
    duration: 5400,
    apply: pure(() => ({ highlightMetric: 'total' })),
  },

  // ── Chapter 2 · Search & Filters ────────────────────────────────────────
  {
    target: 'proc-demo-search',
    caption:
      'Search matches the name, module and description at once — type "invoice" to jump straight to every job that touches invoicing.',
    duration: 4800,
    apply: pure(() => ({ highlightMetric: null, searchActive: true })),
  },
  {
    target: 'proc-demo-workspace-filter',
    caption:
      'Workspace filter narrows to Sales, Field, Admin, Communication and more — the same workspace groups you already know from the rest of the app.',
    duration: 5000,
    apply: pure(() => ({ searchActive: false, workspaceFilterOpen: true })),
  },
  {
    target: 'proc-demo-status-filter',
    caption:
      'Status filter pins the list to Running, Failed, Blocked, Paused or Idle — perfect when you want a quick sweep of what needs your attention today.',
    duration: 5200,
    apply: pure(() => ({ workspaceFilterOpen: false, statusFilterOpen: true })),
  },

  // ── Chapter 3 · List & Rows ─────────────────────────────────────────────
  {
    target: 'proc-demo-group-admin',
    caption:
      'Processes are grouped by workspace so the ownership is obvious. Each group shows a count of the jobs living inside it.',
    duration: 4600,
    apply: pure(() => ({ statusFilterOpen: false })),
  },
  {
    target: 'proc-demo-row-0',
    caption:
      'Each row tells the whole story at a glance — the job name, the module and process key, the schedule in plain English, the last run, and the next scheduled run.',
    duration: 5800,
    apply: pure(() => ({ focusRowIndex: 0 })),
  },
  {
    target: 'proc-demo-row-status',
    caption:
      'The status pill flips live — Idle when waiting, Running while executing, Failed with the error tooltip, and Blocked with the exact reason so you never guess.',
    duration: 5400,
    apply: pure(() => ({ focusRowIndex: 0 })),
  },

  // ── Chapter 4 · Row actions ─────────────────────────────────────────────
  {
    target: 'proc-demo-row-run',
    caption:
      'Run now fires the job on demand — it bypasses the schedule but respects the advisory lock, so if the scheduler is already running it you get a friendly "already running" toast instead of a duplicate.',
    duration: 6000,
    apply: pure(() => ({ focusRowAction: 'run' })),
  },
  {
    target: 'proc-demo-row-pause',
    caption:
      'Pause stops future runs of this specific job without disabling it. Great for maintenance windows — flip it back on and the schedule picks up right where it left off.',
    duration: 5400,
    apply: pure(() => ({ focusRowAction: 'pause' })),
  },

  // ── Chapter 5 · Drawer deep-dive ────────────────────────────────────────
  {
    target: 'proc-demo-drawer-header',
    caption:
      'Click any row to open the deep-dive drawer — workspace tag, live status, and the human description of what the job actually does under the hood.',
    duration: 5200,
    apply: pure(() => ({
      focusRowAction: null, focusRowIndex: 0,
      drawerOpen: true, drawerTab: 'overview', drawerHighlight: 'header',
    })),
  },
  {
    target: 'proc-demo-drawer-actions',
    caption:
      'The action bar puts Run now, Pause, Stop and Reset failures one click away. Stop is honest — it warns you it is advisory, so we never pretend to kill an in-flight run.',
    duration: 5800,
    apply: pure(() => ({ drawerHighlight: 'actions' })),
  },
  {
    target: 'proc-demo-drawer-enable',
    caption:
      'The Enabled switch is the master power — off means the scheduler will not touch this job at all. Flip it on once and the schedule row is auto-created so the tick loop picks it up.',
    duration: 5600,
    apply: pure(() => ({ drawerHighlight: 'enable' })),
  },
  {
    target: 'proc-demo-drawer-overview',
    caption:
      'Overview gives you the vitals — schedule, timezone, last duration, items processed last run, next scheduled run, 30-run success rate and the consecutive-failure counter.',
    duration: 6000,
    apply: pure(() => ({ drawerTab: 'overview', drawerHighlight: 'overview' })),
  },
  {
    target: 'proc-demo-drawer-tab-schedule',
    caption:
      'Schedule tab lets you change the cadence — interval jobs get a live editor, cron jobs show their expression. Timezone is always spelled out so nothing runs in the wrong window.',
    duration: 5800,
    apply: pure(() => ({ drawerTab: 'schedule', drawerHighlight: 'schedule-interval', intervalDraft: 30 })),
  },
  {
    target: 'proc-demo-drawer-tab-history',
    caption:
      'History is the audit trail — every run with start time, duration, items processed, who triggered it, and success or failure with the exact error message underneath.',
    duration: 5800,
    apply: pure(() => ({ drawerTab: 'history', drawerHighlight: 'history-row', runJustCompleted: true })),
  },
  {
    target: 'proc-demo-drawer-tab-diagnostics',
    caption:
      'Diagnostics answers "why is this blocked?" automatically — table exists, permissions granted, dependencies ready. Green means safe to run, red points at the exact fix.',
    duration: 6000,
    apply: pure(() => ({ drawerTab: 'diagnostics', drawerHighlight: 'diagnostic-item' })),
  },

  // ── Chapter 6 · Wrap-up ─────────────────────────────────────────────────
  {
    target: 'proc-demo-refresh',
    caption:
      'The page polls the backend every fifteen seconds, and Refresh forces an immediate sync. Scheduler-driven runs surface here automatically — no page reload required.',
    duration: 5400,
    apply: pure(() => ({ drawerOpen: false, drawerHighlight: null })),
  },
  {
    target: 'proc-demo-title',
    caption:
      'That is Processes end-to-end — auto-running jobs with lock-safe execution, live KPIs, per-row controls, a deep drawer with schedule editing, real history and self-diagnosing checks. Set it once, and your platform keeps itself clean.',
    duration: 7000,
    apply: pure(() => ({ highlightMetric: null })),
  },
];

export const PROC_CHAPTERS: ProcessesDemoChapter[] = [
  { id: 'overview',   title: 'Overview & KPIs',    start: 0,  end: 6  },
  { id: 'controls',   title: 'Search & Filters',   start: 6,  end: 9  },
  { id: 'list',       title: 'List & Status',      start: 9,  end: 12 },
  { id: 'actions',    title: 'Run & Pause',        start: 12, end: 14 },
  { id: 'drawer',     title: 'Drawer Deep-Dive',   start: 14, end: 21 },
  { id: 'wrap',       title: 'Live Sync & Wrap',   start: 21, end: PROC_STEPS.length },
];

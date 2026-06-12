// Planning & Dispatch module autopilot demo — 11 chapters, 44 steps.
// Mirrors the Purchases / Articles / Contacts demo architecture: a self-contained
// scripted tour with per-step state transitions, a virtual cursor, and FR/AR
// narration. English captions live inline here as the source of truth;
// translations are in planningDemoTranslations.ts keyed by step index.

export type PlanningDemoPage = 'overview' | 'board' | 'profiles' | 'scheduler';

export interface PlanningDemoState {
  page: PlanningDemoPage;
  // ── Overview (dispatch list) ──
  selectedStat: 'all' | 'assigned' | 'in_progress' | 'pending';
  searchActive: boolean;
  showFilters: boolean;
  overviewView: 'list' | 'table';
  bulkBar: boolean;
  // ── Board ──
  boardView: 'calendar' | 'map';
  sidebarHi: 'none' | 'list' | 'search' | 'so' | 'job' | 'planned';
  dropped: boolean;            // a job has just been dropped onto the calendar
  suggestOpen: boolean;        // smart-suggest popover open
  autofill: number;            // 0=closed, 1=confirm dialog, 2=result
  mapAssign: boolean;          // assign-from-map popover
  // ── Profiles ──
  profileTab: 'display' | 'users' | 'permissions';
}

export const initialPlanningDemoState: PlanningDemoState = {
  page: 'overview',
  selectedStat: 'all',
  searchActive: false,
  showFilters: false,
  overviewView: 'table',
  bulkBar: false,
  boardView: 'calendar',
  sidebarHi: 'none',
  dropped: false,
  suggestOpen: false,
  autofill: 0,
  mapAssign: false,
  profileTab: 'display',
};

export interface PlanningDemoStep {
  target: string;
  caption: string;
  duration: number;
  apply: (s: PlanningDemoState) => PlanningDemoState;
}

export interface PlanningDemoChapter {
  id: string;
  title: string;
  start: number;
  end: number;
}

const pure =
  (apply: (s: PlanningDemoState) => Partial<PlanningDemoState>) =>
  (s: PlanningDemoState): PlanningDemoState => ({ ...s, ...apply(s) });

export const PL_STEPS: PlanningDemoStep[] = [
  // ── Chapter 1 · Dispatch Overview ──────────────────────────────────────────
  {
    target: 'pl-demo-title',
    caption:
      'Welcome to Planning & Dispatch — the control tower for your field operations. It turns service orders into scheduled work, matches the right technician to every job, and tracks each dispatch to completion.',
    duration: 5800,
    apply: pure(() => ({
      page: 'overview' as const, selectedStat: 'all' as const, searchActive: false,
      showFilters: false, overviewView: 'table' as const, bulkBar: false,
    })),
  },
  {
    target: 'pl-demo-stat-total',
    caption:
      'Four KPI cards sit at the top, and each is a one-click filter. Total counts every dispatch in flight across your whole team.',
    duration: 4400,
    apply: pure(() => ({ selectedStat: 'all' as const })),
  },
  {
    target: 'pl-demo-stat-assigned',
    caption:
      'Assigned shows the jobs that have a technician but haven’t started yet — your ready-to-go queue for the day.',
    duration: 4400,
    apply: pure(() => ({ selectedStat: 'assigned' as const })),
  },
  {
    target: 'pl-demo-stat-inprogress',
    caption:
      'In Progress is the work happening right now on site — at a glance you know exactly what your field is doing this minute.',
    duration: 4400,
    apply: pure(() => ({ selectedStat: 'in_progress' as const })),
  },
  {
    target: 'pl-demo-stat-pending',
    caption:
      'Pending flags dispatches still waiting on a technician — the queue that needs your attention before the day runs away.',
    duration: 4400,
    apply: pure(() => ({ selectedStat: 'pending' as const })),
  },
  {
    target: 'pl-demo-table',
    caption:
      'The dispatch table lists each one with its service order, customer, status, priority, and scheduled time — click any row to open the full job, or the customer to jump to their CRM profile.',
    duration: 5200,
    apply: pure(() => ({ selectedStat: 'all' as const })),
  },

  // ── Chapter 2 · Search, Filters, Views ─────────────────────────────────────
  {
    target: 'pl-demo-search',
    caption:
      'Search instantly across dispatch numbers, service orders, technicians, and customers — find any job in seconds.',
    duration: 4200,
    apply: pure(() => ({ searchActive: true })),
  },
  {
    target: 'pl-demo-filters',
    caption:
      'Filters narrow by status and priority — combine "Pending" and "Urgent" to surface exactly what must be dispatched first.',
    duration: 4400,
    apply: pure(() => ({ searchActive: false, showFilters: true })),
  },
  {
    target: 'pl-demo-views',
    caption:
      'Switch between a dense Table for scanning and a roomy List for detail — and a Kanban board to drag dispatches across status columns. Your choice is remembered.',
    duration: 5000,
    apply: pure(() => ({ showFilters: false, overviewView: 'list' as const })),
  },
  {
    target: 'pl-demo-bulk',
    caption:
      'Select several dispatches to act on them together — bulk-delete cancelled or duplicate work in one confirmed step, with permissions respected.',
    duration: 4800,
    apply: pure(() => ({ overviewView: 'table' as const, bulkBar: true })),
  },
  {
    target: 'pl-demo-dispatch-jobs',
    caption:
      'But the real magic is the planning board. Click Dispatch Jobs to open the scheduling cockpit where unassigned work meets your team’s calendar.',
    duration: 4800,
    apply: pure(() => ({ bulkBar: false })),
  },

  // ── Chapter 3 · The Planning Board ─────────────────────────────────────────
  {
    target: 'pl-demo-board-header',
    caption:
      'This is the planning board. On the left, your technicians’ calendars; on the right, the jobs still waiting to be scheduled — drag-and-drop turns one into the other.',
    duration: 5200,
    apply: pure(() => ({ page: 'board' as const, boardView: 'calendar' as const, sidebarHi: 'none' as const })),
  },
  {
    target: 'pl-demo-calendar',
    caption:
      'Each technician is a column; the day runs top to bottom in time slots. Working hours, leave, and existing jobs are all laid out so you instantly see who has capacity.',
    duration: 5400,
    apply: pure(() => ({})),
  },
  {
    target: 'pl-demo-calendar-job',
    caption:
      'A scheduled job is a colour-coded block — colour by status, priority, service order, or technician — showing the customer, time, and duration at a glance. Click it to open, or drag it to reschedule.',
    duration: 5400,
    apply: pure(() => ({})),
  },
  {
    target: 'pl-demo-view-toggle',
    caption:
      'Toggle between Day and Week views to plan at the right altitude — a packed single day, or the whole week’s shape across the team.',
    duration: 4600,
    apply: pure(() => ({})),
  },

  // ── Chapter 4 · Unassigned jobs ────────────────────────────────────────────
  {
    target: 'pl-demo-sidebar',
    caption:
      'The right sidebar holds every unassigned job, grouped by its service order so related work stays together. This is your planning inbox.',
    duration: 4800,
    apply: pure(() => ({ sidebarHi: 'list' as const })),
  },
  {
    target: 'pl-demo-sidebar-search',
    caption:
      'Search and a priority filter keep the queue manageable — focus on the urgent jobs first, or find one specific order in a long list.',
    duration: 4600,
    apply: pure(() => ({ sidebarHi: 'search' as const })),
  },
  {
    target: 'pl-demo-so',
    caption:
      'Expand a service order to see its jobs — or, in installation mode, grouped by installation. A coloured priority dot flags how urgent each one is.',
    duration: 5000,
    apply: pure(() => ({ sidebarHi: 'so' as const })),
  },
  {
    target: 'pl-demo-job-hover',
    caption:
      'Hover any job for the full picture — customer, site address, estimated duration, and the exact skills it requires, so you plan with every fact in front of you.',
    duration: 5200,
    apply: pure(() => ({ sidebarHi: 'job' as const })),
  },
  {
    target: 'pl-demo-planned',
    caption:
      'A Show Planned toggle reveals what’s already scheduled alongside the backlog — so nothing gets double-booked and you always see the full workload.',
    duration: 4800,
    apply: pure(() => ({ sidebarHi: 'planned' as const })),
  },

  // ── Chapter 5 · Drag & drop assignment ─────────────────────────────────────
  {
    target: 'pl-demo-drag-job',
    caption:
      'Planning is physical: grab a job, a whole installation, or an entire service order and drag it onto a technician’s calendar.',
    duration: 4600,
    apply: pure(() => ({ sidebarHi: 'so' as const })),
  },
  {
    target: 'pl-demo-drop-slot',
    caption:
      'Drop it on a time slot and the dispatch is created instantly — assigned, scheduled, and visible to the technician in real time.',
    duration: 4800,
    apply: pure(() => ({ dropped: true, sidebarHi: 'none' as const })),
  },
  {
    target: 'pl-demo-collision',
    caption:
      'And it’s safe: if the slot overlaps existing work or falls outside working hours, the board warns you before confirming — no accidental double-bookings.',
    duration: 5000,
    apply: pure(() => ({})),
  },

  // ── Chapter 6 · Smart Suggest ──────────────────────────────────────────────
  {
    target: 'pl-demo-suggest-btn',
    caption:
      'Not sure who fits best? Smart Planning does the thinking. Open Suggest for an instant, ranked shortlist of the best technicians for each unassigned job.',
    duration: 5000,
    apply: pure(() => ({ dropped: false, suggestOpen: true })),
  },
  {
    target: 'pl-demo-suggest-list',
    caption:
      'Every technician is scored out of 100 and ranked — the top pick is highlighted, so a good assignment is one click away even on a busy day.',
    duration: 5000,
    apply: pure(() => ({})),
  },
  {
    target: 'pl-demo-suggest-score',
    caption:
      'The score is transparent: skills matched, current availability, distance from the site, and a load-balancing penalty so the same star tech isn’t buried under every job. Planning you can trust and explain.',
    duration: 5800,
    apply: pure(() => ({})),
  },

  // ── Chapter 7 · Auto-fill day ──────────────────────────────────────────────
  {
    target: 'pl-demo-autofill-btn',
    caption:
      'Need to plan a whole day at once? Auto-fill day schedules every unassigned job for you — picking the best technician and the first free slot inside their working hours.',
    duration: 5200,
    apply: pure(() => ({ suggestOpen: false, autofill: 1 })),
  },
  {
    target: 'pl-demo-autofill-confirm',
    caption:
      'It previews exactly what it will do — how many jobs, across how many technicians — and never touches existing assignments or schedules in the past. You stay in control.',
    duration: 5400,
    apply: pure(() => ({})),
  },
  {
    target: 'pl-demo-autofill-result',
    caption:
      'Run it, and the board fills in seconds — jobs placed back-to-back, conflicts avoided, priorities first. A full day planned in one click, ready for you to fine-tune.',
    duration: 5200,
    apply: pure(() => ({ autofill: 2 })),
  },

  // ── Chapter 8 · Map view ───────────────────────────────────────────────────
  {
    target: 'pl-demo-map-btn',
    caption:
      'Field work is geographic, so the board has a map. Switch to Map view to see every job and technician plotted by location.',
    duration: 4600,
    apply: pure(() => ({ autofill: 0, boardView: 'map' as const })),
  },
  {
    target: 'pl-demo-map',
    caption:
      'Now routing is obvious — cluster nearby jobs, spot the technician already in the area, and cut windscreen time across the whole team.',
    duration: 5000,
    apply: pure(() => ({})),
  },
  {
    target: 'pl-demo-map-assign',
    caption:
      'Assign straight from the map: pick a job pin, choose the closest available technician, and the dispatch is created — geography and scheduling in one move.',
    duration: 5200,
    apply: pure(() => ({ mapAssign: true })),
  },

  // ── Chapter 9 · Planning Profiles ──────────────────────────────────────────
  {
    target: 'pl-demo-profiles-open',
    caption:
      'Every dispatcher works differently, so the whole board is configurable through Planning Profiles — saved setups you switch between in one click.',
    duration: 4800,
    apply: pure(() => ({ page: 'profiles' as const, boardView: 'calendar' as const, mapAssign: false, profileTab: 'display' as const })),
  },
  {
    target: 'pl-demo-profile-list',
    caption:
      'Keep private profiles for yourself or share team-wide ones — "Plumbing — North", "Emergency only", "Full week". Duplicate, star a default, and apply instantly.',
    duration: 5200,
    apply: pure(() => ({})),
  },
  {
    target: 'pl-demo-profile-display',
    caption:
      'Display settings shape the board: service-order or installation mode, day or week, include weekends, and colour jobs by status, priority, order, or technician.',
    duration: 5400,
    apply: pure(() => ({ profileTab: 'display' as const })),
  },
  {
    target: 'pl-demo-profile-users',
    caption:
      'Choose which technicians appear — hide anyone without working hours or on leave today — so the board only shows the team you’re actually planning.',
    duration: 5200,
    apply: pure(() => ({ profileTab: 'users' as const })),
  },
  {
    target: 'pl-demo-profile-skills',
    caption:
      'Filter by required skills — match any or all — and sort technicians by how well they fit, so the right specialists rise to the top automatically.',
    duration: 5200,
    apply: pure(() => ({})),
  },
  {
    target: 'pl-demo-profile-permissions',
    caption:
      'Permissions set the guardrails: allow or block scheduling in the past, confirm on overlap, and control who can change or unassign dispatches — safe planning for every role.',
    duration: 5400,
    apply: pure(() => ({ profileTab: 'permissions' as const })),
  },
  {
    target: 'pl-demo-profile-apply',
    caption:
      'Save and apply, and the whole board reshapes to your profile in an instant — one setup for emergencies, another for routine weeks, switched whenever you need.',
    duration: 5000,
    apply: pure(() => ({})),
  },

  // ── Chapter 10 · Scheduler · Working hours ─────────────────────────────────
  {
    target: 'pl-demo-scheduler-open',
    caption:
      'All of this rests on knowing when your team works. The Scheduler manages every technician’s working hours, day by day.',
    duration: 4800,
    apply: pure(() => ({ page: 'scheduler' as const })),
  },
  {
    target: 'pl-demo-scheduler-grid',
    caption:
      'Set start and end times per weekday, with breaks and days off — these hours bound the calendar, drive auto-fill, and decide who can take a late job.',
    duration: 5400,
    apply: pure(() => ({})),
  },
  {
    target: 'pl-demo-scheduler-edit',
    caption:
      'Edit a technician’s schedule and the whole board respects it immediately — capacity that’s always accurate, so your plans are always realistic.',
    duration: 5000,
    apply: pure(() => ({})),
  },

  // ── Chapter 11 · Wrap-up ───────────────────────────────────────────────────
  {
    target: 'pl-demo-title',
    caption:
      'That is Planning & Dispatch end to end — a dispatch overview, a drag-and-drop calendar, smart suggestions and one-click auto-fill, a routing map, configurable profiles, and team working hours, all connected.',
    duration: 5800,
    apply: pure(() => ({ page: 'overview' as const, selectedStat: 'all' as const })),
  },
  {
    target: 'pl-demo-dispatch-jobs',
    caption:
      'Service orders flow in, the right technician is matched in seconds, and every job is tracked to done. Open the board and plan your day — your whole field team, orchestrated from one screen.',
    duration: 5400,
    apply: pure(() => ({})),
  },
];

export const PL_CHAPTERS: PlanningDemoChapter[] = [
  { id: 'overview',   title: 'Dispatch Overview', start: 0,  end: 6  },
  { id: 'controls',   title: 'Filters & Views',   start: 6,  end: 11 },
  { id: 'calendar',   title: 'Planning Board',    start: 11, end: 15 },
  { id: 'unassigned', title: 'Unassigned Jobs',   start: 15, end: 20 },
  { id: 'dragdrop',   title: 'Drag & Drop',       start: 20, end: 23 },
  { id: 'suggest',    title: 'Smart Suggest',     start: 23, end: 26 },
  { id: 'autofill',   title: 'Auto-fill Day',     start: 26, end: 29 },
  { id: 'map',        title: 'Map View',          start: 29, end: 32 },
  { id: 'profiles',   title: 'Planning Profiles', start: 32, end: 39 },
  { id: 'scheduler',  title: 'Working Hours',     start: 39, end: 42 },
  { id: 'wrapup',     title: 'Wrap-up',           start: 42, end: PL_STEPS.length },
];

// Dispatches module autopilot demo — 10 chapters, 31 steps.
// The technician's job ticket: the field-execution side of a service order.
// English captions live inline here as the source of truth; translations are in
// dispatchesDemoTranslations.ts keyed by step index.

export type DPDemoPage = 'list' | 'detail';

export interface DPDemoState {
  page: DPDemoPage;
  selectedStat: 'all' | 'confirmed' | 'in_progress' | 'completed';
  searchActive: boolean;
  showFilters: boolean;
  listView: 'table' | 'list';
  bulkBar: boolean;
  bulkConfirm: boolean;
  activeTab: 'overview' | 'jobs' | 'time_expenses' | 'materials' | 'attachments' | 'checklists' | 'activity';
  statusStage: number;         // 0=pending..4=completed
  timeBookOpen: boolean;
  expenseBookOpen: boolean;
  notesOpen: boolean;
  sendOpen: boolean;
  pdfOpen: boolean;
  pdfSettings: boolean;
  multiJob: boolean;           // dispatch holds all jobs of a service order (per-job logging)
}

export const initialDPDemoState: DPDemoState = {
  page: 'list',
  selectedStat: 'all',
  searchActive: false,
  showFilters: false,
  listView: 'table',
  bulkBar: false,
  bulkConfirm: false,
  activeTab: 'overview',
  statusStage: 0,
  timeBookOpen: false,
  expenseBookOpen: false,
  notesOpen: false,
  sendOpen: false,
  pdfOpen: false,
  pdfSettings: false,
  multiJob: false,
};

export interface DPDemoStep { target: string; caption: string; duration: number; apply: (s: DPDemoState) => DPDemoState; }
export interface DPDemoChapter { id: string; title: string; start: number; end: number; }

const pure =
  (apply: (s: DPDemoState) => Partial<DPDemoState>) =>
  (s: DPDemoState): DPDemoState => ({ ...s, ...apply(s) });

export const DP_STEPS: DPDemoStep[] = [
  // ── Chapter 1 · Overview ───────────────────────────────────────────────────
  {
    target: 'dp-demo-title',
    caption:
      'Welcome to Dispatches — the technician’s job ticket. When a service order is assigned, it becomes a dispatch: a single field job a technician confirms, drives to, executes, and signs off — with every hour, part, and photo captured on the way.',
    duration: 5800,
    apply: pure(() => ({ page: 'list' as const, selectedStat: 'all' as const, searchActive: false, showFilters: false, listView: 'table' as const, bulkBar: false })),
  },
  { target: 'dp-demo-stat-total', caption: 'Four KPI cards track your field throughput, and each filters the list. Total counts every dispatch across your team.', duration: 4200, apply: pure(() => ({ selectedStat: 'all' as const })) },
  { target: 'dp-demo-stat-confirmed', caption: 'Confirmed shows the jobs technicians have accepted and are ready to start — your committed work for the day.', duration: 4400, apply: pure(() => ({ selectedStat: 'confirmed' as const })) },
  { target: 'dp-demo-stat-inprogress', caption: 'In Progress is the work happening on site right now — at a glance you know exactly who is doing what this minute.', duration: 4400, apply: pure(() => ({ selectedStat: 'in_progress' as const })) },
  { target: 'dp-demo-stat-completed', caption: 'Completed shows finished jobs — signed off and ready to feed billing. The pulse of your field operation.', duration: 4200, apply: pure(() => ({ selectedStat: 'completed' as const })) },
  { target: 'dp-demo-table', caption: 'The dispatch table lists each ticket with its service order, customer, assigned technician, status, priority, and schedule — click a technician to see their profile, or a row to open the job.', duration: 5400, apply: pure(() => ({ selectedStat: 'all' as const })) },

  // ── Chapter 2 · Controls ───────────────────────────────────────────────────
  { target: 'dp-demo-search', caption: 'Search instantly across dispatch numbers, service orders, technicians, and customers — find any job in seconds.', duration: 4000, apply: pure(() => ({ searchActive: true })) },
  { target: 'dp-demo-filters', caption: 'Filters refine by status and priority — surface the urgent jobs and the ones still waiting to be confirmed.', duration: 4200, apply: pure(() => ({ searchActive: false, showFilters: true })) },
  { target: 'dp-demo-views', caption: 'Switch between a dense Table for scanning and a roomy List for detail — your choice is remembered.', duration: 4200, apply: pure(() => ({ showFilters: false, listView: 'list' as const })) },
  { target: 'dp-demo-bulk', caption: 'Select several dispatches to act together — bulk-delete cancelled tickets in one confirmed step, with permissions respected.', duration: 4400, apply: pure(() => ({ listView: 'table' as const, bulkBar: true, bulkConfirm: true })) },

  // ── Chapter 3 · Detail & status ────────────────────────────────────────────
  { target: 'dp-demo-detail-header', caption: 'Open a dispatch to reach the technician’s workspace — the job, its customer, and the actions used in the field: navigate, call, send, and update status.', duration: 5000, apply: pure(() => ({ page: 'detail' as const, activeTab: 'overview' as const, statusStage: 0, bulkBar: false, bulkConfirm: false })) },
  { target: 'dp-demo-status', caption: 'The status flow mirrors a real field day — Pending, Planned, Confirmed, In Progress, Completed — with reject and cancel branches. The technician advances it from their phone as the job unfolds.', duration: 5600, apply: pure(() => ({ statusStage: 2 })) },
  { target: 'dp-demo-tech', caption: 'The technician card shows who’s assigned, their skills, phone, and live status — one tap to call or message them, so the office and the field stay in sync.', duration: 5000, apply: pure(() => ({ statusStage: 3 })) },

  // ── Chapter 4 · Jobs ───────────────────────────────────────────────────────
  { target: 'dp-demo-tab-jobs', caption: 'The Jobs tab lists the tasks this dispatch covers. A single dispatch can carry every job of a service order — so one technician owns the whole order in one visit, each job tickable as it’s done.', duration: 5000, apply: pure(() => ({ activeTab: 'jobs' as const })) },
  { target: 'dp-demo-job-detail', caption: 'Open a job for its full brief — the problem, the equipment, the required skills, and any history — so the technician arrives ready, not guessing.', duration: 5000, apply: pure(() => ({})) },

  // ── Chapter 5 · Time & Expenses booking ────────────────────────────────────
  { target: 'dp-demo-tab-time', caption: 'Time & Expenses is where the job becomes billable. Everything the technician books on site lands here and flows straight to the invoice.', duration: 4800, apply: pure(() => ({ activeTab: 'time_expenses' as const })) },
  { target: 'dp-demo-time-book', caption: 'Book labour with a tap — start and stop a timer, or log hours directly. When the dispatch holds several jobs you pick which job the time is for, so every minute lands on the right job and technician.', duration: 5400, apply: pure(() => ({ timeBookOpen: true })) },
  { target: 'dp-demo-expense-book', caption: 'Log expenses on the spot — travel, parking, consumables — attach the receipt, and on a multi-job dispatch tag the job it belongs to, so every cost is recovered against the right job.', duration: 5400, apply: pure(() => ({ timeBookOpen: false, expenseBookOpen: true })) },

  // ── Chapter 6 · Materials ──────────────────────────────────────────────────
  { target: 'dp-demo-tab-materials', caption: 'The Materials tab records the parts used — pulled from inventory or van stock, so stock decrements automatically. On a multi-job dispatch you choose which job each part is for, keeping cost per job exact and billing accurate.', duration: 5200, apply: pure(() => ({ expenseBookOpen: false, activeTab: 'materials' as const })) },
  { target: 'dp-demo-articles', caption: 'Add a part from the catalog in a tap — quantity and price pre-filled — turning what was fitted into a precise, billable line with no paperwork.', duration: 5000, apply: pure(() => ({})) },

  // ── Chapter 7 · Attachments, Checklists, Notes ─────────────────────────────
  { target: 'dp-demo-tab-attachments', caption: 'Attachments hold the field evidence — before-and-after photos, the equipment nameplate, the delivery note — proof the job was done right.', duration: 4800, apply: pure(() => ({ activeTab: 'attachments' as const })) },
  { target: 'dp-demo-tab-checklists', caption: 'Checklists guide the technician through mandatory steps — safety isolation, test results, completion criteria — so every job meets the same standard.', duration: 4800, apply: pure(() => ({ activeTab: 'checklists' as const })) },
  { target: 'dp-demo-notes-modal', caption: 'Notes capture what the photos can’t — the customer’s comments, a follow-up needed, a tip for the next visit — shared instantly with the office.', duration: 4800, apply: pure(() => ({ notesOpen: true })) },

  // ── Chapter 8 · Activity & sign-off ────────────────────────────────────────
  { target: 'dp-demo-tab-activity', caption: 'The Activity tab is the full timeline — confirmed, en route, on site, completed — each step time-stamped, an immutable record of the field day.', duration: 4800, apply: pure(() => ({ notesOpen: false, activeTab: 'activity' as const })) },
  { target: 'dp-demo-signoff', caption: 'And it ends with the customer’s signature, captured on the device — the moment of completion logged, turning a finished job into proof you can stand behind.', duration: 5000, apply: pure(() => ({})) },

  // ── Chapter 9 · Send & PDF ─────────────────────────────────────────────────
  { target: 'dp-demo-send', caption: 'Send the completed work report to the customer in a click — the signed PDF attached, the send tracked — they’re informed before the technician leaves the site.', duration: 5000, apply: pure(() => ({ activeTab: 'overview' as const, sendOpen: true })) },
  { target: 'dp-demo-pdf', caption: 'The work report is a polished, branded document — the customer and site, the jobs performed, the hours and parts, and the captured signature — a complete record of the visit.', duration: 5200, apply: pure(() => ({ sendOpen: false, pdfOpen: true })) },
  { target: 'dp-demo-pdf-settings', caption: 'And the layout is yours — a studio for colours, typography, layout, and which fields appear, so every report carries your brand.', duration: 4800, apply: pure(() => ({ pdfSettings: true })) },
  { target: 'dp-demo-pdf-download', caption: 'Download it, print it, or email it — the same clean report every time, hours and materials totalled automatically and ready to invoice.', duration: 4600, apply: pure(() => ({ pdfSettings: false })) },

  // ── Chapter 10 · Multi-job dispatch (per-job logging) ──────────────────────
  { target: 'dp-demo-multijob-jobs', caption: 'When you plan a whole service order as one dispatch, every job rides in the same ticket. The Jobs tab shows them all, and the technician marks one as the Current job — one technician, one visit, the full order.', duration: 5400, apply: pure(() => ({ page: 'detail' as const, pdfOpen: false, sendOpen: false, activeTab: 'jobs' as const, multiJob: true })) },
  { target: 'dp-demo-multijob-time', caption: 'Every booking is tagged to a job, and the Current job is preselected — so before logging time, an expense or a part, the right job is already chosen (still changeable). Labour, costs and materials roll up to the exact job, not just the dispatch.', duration: 5800, apply: pure(() => ({ activeTab: 'time_expenses' as const, timeBookOpen: true, multiJob: true })) },
  { target: 'dp-demo-multijob-checklists', caption: 'Checklists ride along too: each job carries the checklist defined on its service line back in the offer or sale — so the technician completes the right steps for every job, grouped by job.', duration: 5400, apply: pure(() => ({ timeBookOpen: false, activeTab: 'checklists' as const, multiJob: true })) },

  // ── Chapter 11 · Wrap-up ───────────────────────────────────────────────────
  { target: 'dp-demo-title', caption: 'That is Dispatches end to end — KPIs across your field team, a technician workspace with a real status flow, time and expense booking, materials from stock, photos, checklists, a captured signature, and a branded work report.', duration: 5800, apply: pure(() => ({ page: 'list' as const, pdfOpen: false, timeBookOpen: false, multiJob: false, selectedStat: 'all' as const })) },
  { target: 'dp-demo-stat-completed', caption: 'Service orders become dispatches, dispatches become signed-off jobs, and every hour and part flows back to billing. This is your field team, in your pocket and on one screen.', duration: 5400, apply: pure(() => ({})) },
];

export const DP_CHAPTERS: DPDemoChapter[] = [
  { id: 'overview',  title: 'Overview',        start: 0,  end: 6  },
  { id: 'controls',  title: 'Filters & Views', start: 6,  end: 10 },
  { id: 'detail',    title: 'Job Ticket',      start: 10, end: 13 },
  { id: 'jobs',      title: 'Jobs',            start: 13, end: 15 },
  { id: 'time',      title: 'Time & Expenses', start: 15, end: 18 },
  { id: 'materials', title: 'Materials',       start: 18, end: 20 },
  { id: 'evidence',  title: 'Evidence',        start: 20, end: 23 },
  { id: 'signoff',   title: 'Sign-off',        start: 23, end: 25 },
  { id: 'report',    title: 'Work Report',     start: 25, end: 29 },
  { id: 'multijob',  title: 'Multi-job dispatch', start: 29, end: 32 },
  { id: 'wrapup',    title: 'Wrap-up',         start: 32, end: DP_STEPS.length },
];

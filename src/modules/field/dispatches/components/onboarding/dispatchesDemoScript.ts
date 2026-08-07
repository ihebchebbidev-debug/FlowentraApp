// Dispatches module autopilot demo — 12 chapters, 28 steps.
// The technician's job ticket: the field-execution side of a service order.
// Mirrors the REAL DispatchesList & DispatchJobDetail 1:1 — no invented KPI
// cards, priority filter, view toggle, e-signature, plan-vs-actual overlay,
// waiting/break work types, billable/rate fields, or replacement-material flow.

export type DPDemoPage = 'list' | 'detail';

export interface DPDemoState {
  page: DPDemoPage;
  // list controls (real)
  searchActive: boolean;
  statusFilter: 'all' | 'confirmed';
  mapOpen: boolean;
  exportOpen: boolean;
  rowActionsOpen: boolean;
  deleteOneOpen: boolean;
  bulkBar: boolean;
  bulkConfirm: boolean;
  bulkProgress: number; // 0..100
  // detail
  activeTab: 'overview' | 'jobs' | 'time_expenses' | 'materials' | 'attachments' | 'checklists' | 'activity';
  statusStage: number; // 0=pending..4=completed
  editNumberActive: boolean;
  cancelConfirmOpen: boolean;
  skillsEditing: boolean;
  jobsFilterOpen: boolean;
  multiJobCurrent: boolean;
  timeBookOpen: boolean;
  expenseBookOpen: boolean;
  plannedRollup: boolean;
  materialAddOpen: boolean;
  materialDetailOpen: boolean;
  noteComposerOpen: boolean;
  shareOpen: boolean;
  sendOpen: boolean;
  pdfOpen: boolean;
  pdfSettingsOpen: boolean;
}

export const initialDPDemoState: DPDemoState = {
  page: 'list',
  searchActive: false,
  statusFilter: 'all',
  mapOpen: false,
  exportOpen: false,
  rowActionsOpen: false,
  deleteOneOpen: false,
  bulkBar: false,
  bulkConfirm: false,
  bulkProgress: 0,
  activeTab: 'overview',
  statusStage: 0,
  editNumberActive: false,
  cancelConfirmOpen: false,
  skillsEditing: false,
  jobsFilterOpen: false,
  multiJobCurrent: false,
  timeBookOpen: false,
  expenseBookOpen: false,
  plannedRollup: false,
  materialAddOpen: false,
  materialDetailOpen: false,
  noteComposerOpen: false,
  shareOpen: false,
  sendOpen: false,
  pdfOpen: false,
  pdfSettingsOpen: false,
};

export interface DPDemoStep { target: string; caption: string; duration: number; apply: (s: DPDemoState) => DPDemoState; }
export interface DPDemoChapter { id: string; title: string; start: number; end: number; }

const pure =
  (apply: (s: DPDemoState) => Partial<DPDemoState>) =>
  (s: DPDemoState): DPDemoState => ({ ...s, ...apply(s) });

export const DP_STEPS: DPDemoStep[] = [
  // ── Chapter 1 · Overview & Toolbar ─────────────────────────────────────────
  {
    target: 'dp-demo-title',
    caption:
      'Welcome to Dispatches — the technician’s job ticket. When a service order is assigned, it becomes a dispatch: a single field job a technician confirms, drives to, executes, and delivers — with every hour, part, and note captured on the way.',
    duration: 5800,
    apply: pure(() => ({ ...initialDPDemoState })),
  },
  { target: 'dp-demo-search', caption: 'The toolbar is simple and fast — search across dispatch numbers, service orders, technicians and customers to find any job in seconds.', duration: 4400, apply: pure(() => ({ searchActive: true })) },
  { target: 'dp-demo-status-filter', caption: 'A single status filter narrows the list to pending, planned, confirmed, in-progress, completed, cancelled or rejected — the same lifecycle the field team lives.', duration: 4600, apply: pure(() => ({ searchActive: false, statusFilter: 'confirmed' })) },

  // ── Chapter 2 · List Views, Export, Row & Bulk actions ────────────────────
  { target: 'dp-demo-map-toggle', caption: 'Toggle the map overlay to see every dispatch pinned on the geography — customer locations, technician routes, the whole day at a glance.', duration: 4600, apply: pure(() => ({ statusFilter: 'all', mapOpen: true })) },
  { target: 'dp-demo-export', caption: 'Export ships the filtered list out — dispatch numbers, service orders, customers, schedules, statuses, technicians — pick the columns you need and download.', duration: 4800, apply: pure(() => ({ mapOpen: false, exportOpen: true })) },
  { target: 'dp-demo-row-actions', caption: 'Every row has its own menu — View to open the ticket, Edit to update it, Report to see the printable work report, and Delete when it was raised in error.', duration: 4800, apply: pure(() => ({ exportOpen: false, rowActionsOpen: true })) },
  { target: 'dp-demo-bulk', caption: 'Select several dispatches to act together. A red bar appears — Delete removes them in one confirmed pass, with a live progress percentage so you always know where you are.', duration: 5200, apply: pure(() => ({ rowActionsOpen: false, bulkBar: true, bulkConfirm: true, bulkProgress: 45 })) },

  // ── Chapter 3 · Detail Header & Status Flow ───────────────────────────────
  { target: 'dp-demo-detail-header', caption: 'Open a dispatch and you land in the technician’s workspace — dispatch number, service order, customer, and the header actions used every day: Report, Share, Send.', duration: 5000, apply: pure(() => ({ page: 'detail', activeTab: 'overview', statusStage: 0, bulkBar: false, bulkConfirm: false })) },
  { target: 'dp-demo-editable-number', caption: 'The dispatch number is editable in place — rename it to match your own numbering scheme, and Flowentra checks it stays unique.', duration: 4400, apply: pure(() => ({ editNumberActive: true })) },
  { target: 'dp-demo-status', caption: 'The status flow mirrors a real field day — Pending, Planned, Assigned, Confirmed (released), In Progress, Completed — with Reject and Cancel branches, and Release and Cancel shortcuts right beside the stepper.', duration: 5800, apply: pure(() => ({ editNumberActive: false, statusStage: 3, cancelConfirmOpen: true })) },

  // ── Chapter 4 · Overview Tab ──────────────────────────────────────────────
  { target: 'dp-demo-overview-details', caption: 'The Overview tab shows the real relationships — the linked service order, the affected contact and email, the installation site, priority, current status, and the assigned technicians.', duration: 5200, apply: pure(() => ({ cancelConfirmOpen: false, activeTab: 'overview' })) },
  { target: 'dp-demo-required-skills', caption: 'Required Skills sit right on the Overview — add or remove skill chips from your catalog, so the right technician is always matched to the job.', duration: 4800, apply: pure(() => ({ skillsEditing: true })) },

  // ── Chapter 5 · Jobs Tab ──────────────────────────────────────────────────
  { target: 'dp-demo-tab-jobs', caption: 'The Jobs tab lists the tasks this dispatch covers, grouped by installation. Filter by status or work type — installation, repair, maintenance, inspection, service — to focus on what matters right now.', duration: 5400, apply: pure(() => ({ skillsEditing: false, activeTab: 'jobs', jobsFilterOpen: true })) },
  { target: 'dp-demo-multijob-current', caption: 'When one dispatch carries all jobs of a service order, the technician sets a Current job. Every booking that follows pre-fills to that job — one visit, one technician, the whole order handled.', duration: 5600, apply: pure(() => ({ jobsFilterOpen: false, multiJobCurrent: true })) },

  // ── Chapter 6 · Time & Expenses ───────────────────────────────────────────
  { target: 'dp-demo-tab-time', caption: 'Time & Expenses is where the job becomes billable. Book labour with a duration or start-and-stop times — work types come from your lookups: travel, work, setup, documentation, cleanup — and every entry ties to the right job.', duration: 5600, apply: pure(() => ({ activeTab: 'time_expenses', timeBookOpen: true })) },
  { target: 'dp-demo-expense-book', caption: 'Log expenses on the spot — travel, meal, parking, supplies, other — amount in TND, a note, the date, and on a multi-job dispatch, the job it belongs to.', duration: 5200, apply: pure(() => ({ timeBookOpen: false, expenseBookOpen: true })) },
  { target: 'dp-demo-planned-rollup', caption: 'Inline planned totals sit right next to the actuals — the labour minutes, expenses and materials that were quoted, so overruns show themselves the moment they appear.', duration: 5000, apply: pure(() => ({ expenseBookOpen: false, plannedRollup: true })) },

  // ── Chapter 7 · Materials ─────────────────────────────────────────────────
  { target: 'dp-demo-tab-materials', caption: 'The Materials tab records the parts used — pulled from inventory or van stock, so stock decrements automatically. On multi-job dispatches, each part is tagged to the job that consumed it.', duration: 5200, apply: pure(() => ({ plannedRollup: false, activeTab: 'materials', materialAddOpen: true })) },
  { target: 'dp-demo-material-detail', caption: 'Open a used part for its full detail — sku, category, stock on hand, supplier, warehouse location, cost and the technician who fitted it — with a confirmation before anything is removed.', duration: 5400, apply: pure(() => ({ materialAddOpen: false, materialDetailOpen: true })) },

  // ── Chapter 8 · Attachments & Checklists ──────────────────────────────────
  { target: 'dp-demo-tab-attachments', caption: 'Attachments unify every relevant document — files uploaded on the dispatch, plus related documents from its service order, sale and offer — all reachable in one place.', duration: 4800, apply: pure(() => ({ materialDetailOpen: false, activeTab: 'attachments' })) },
  { target: 'dp-demo-tab-checklists', caption: 'Checklists ride along too — the dispatch checklist, the linked service order checklist, and the per-job checklist defined on each service line, all completed in the same view.', duration: 4800, apply: pure(() => ({ activeTab: 'checklists' })) },

  // ── Chapter 9 · Activity ──────────────────────────────────────────────────
  { target: 'dp-demo-tab-activity', caption: 'The Activity tab is the full timeline — status changes, materials added, time booked, notes written — everything time-stamped, with System Activity and User Note badges so provenance is always clear.', duration: 5200, apply: pure(() => ({ activeTab: 'activity' })) },
  { target: 'dp-demo-add-note', caption: 'Add a note inline right in the timeline — a customer comment, a follow-up needed, a tip for the next visit — saved and instantly shared with the office.', duration: 4800, apply: pure(() => ({ noteComposerOpen: true })) },

  // ── Chapter 10 · Share, Send, PDF ─────────────────────────────────────────
  { target: 'dp-demo-share', caption: 'Share opens a professional share dialog — a secure link, options to include or hide sections, tracked once it’s opened by the customer.', duration: 4800, apply: pure(() => ({ noteComposerOpen: false, shareOpen: true })) },
  { target: 'dp-demo-send', caption: 'Send composes the work report as an email — the generated PDF attached, subject and body pre-filled, and the send tracked on the dispatch activity.', duration: 4800, apply: pure(() => ({ shareOpen: false, sendOpen: true })) },
  { target: 'dp-demo-pdf', caption: 'The work report itself is a polished, branded document — customer and site, jobs performed, hours and parts totalled, notes and attachments — a complete record of the visit.', duration: 5000, apply: pure(() => ({ sendOpen: false, pdfOpen: true })) },

  // ── Chapter 11 · PDF Settings ─────────────────────────────────────────────
  { target: 'dp-demo-pdf-settings', caption: 'From the PDF preview, the settings studio opens with five tabs — Data, Layout, Colors, Typography, Advanced — plus Import, Export and Reset to defaults, so every report carries your brand exactly the way you want it.', duration: 5600, apply: pure(() => ({ pdfSettingsOpen: true })) },

  // ── Chapter 12 · Wrap-up ──────────────────────────────────────────────────
  { target: 'dp-demo-title', caption: 'That is Dispatches end to end — one clean list with map, export and bulk actions; a technician workspace with editable number, status flow, required skills, per-job time, expenses and materials, unified attachments and checklists, a live activity timeline, and a branded work report. Your field team, in your pocket and on one screen.', duration: 6600, apply: pure(() => ({ pdfSettingsOpen: false, pdfOpen: false, page: 'list', statusFilter: 'all' })) },
];

export const DP_CHAPTERS: DPDemoChapter[] = [
  { id: 'overview',   title: 'Overview',          start: 0,  end: 3  },
  { id: 'controls',   title: 'List Actions',      start: 3,  end: 7  },
  { id: 'detail',     title: 'Job Ticket',        start: 7,  end: 10 },
  { id: 'ov-tab',     title: 'Overview Tab',      start: 10, end: 12 },
  { id: 'jobs',       title: 'Jobs',              start: 12, end: 14 },
  { id: 'time',       title: 'Time & Expenses',   start: 14, end: 17 },
  { id: 'materials',  title: 'Materials',         start: 17, end: 19 },
  { id: 'evidence',   title: 'Attachments & Checklists', start: 19, end: 21 },
  { id: 'activity',   title: 'Activity',          start: 21, end: 23 },
  { id: 'send',       title: 'Share & Send',      start: 23, end: 26 },
  { id: 'pdf',        title: 'PDF Studio',        start: 26, end: 27 },
  { id: 'wrapup',     title: 'Wrap-up',           start: 27, end: DP_STEPS.length },
];

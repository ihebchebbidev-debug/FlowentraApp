// Service Orders module autopilot demo — 10 chapters, 35 steps.
// Same architecture as the other module demos. English captions live inline here
// as the source of truth; translations are in serviceOrdersDemoTranslations.ts.

export type SODemoPage = 'list' | 'create' | 'detail';

export interface SODemoState {
  page: SODemoPage;
  selectedStat: 'all' | 'active' | 'completed';
  searchActive: boolean;
  showFilters: boolean;
  listView: 'table' | 'list' | 'map';
  bulkBar: boolean;
  createStep: number;          // 0..4
  activeTab: 'overview' | 'jobs' | 'dispatches' | 'time_expenses' | 'materials' | 'attachments' | 'checklists' | 'activity';
  statusStage: number;         // 0=pending..5=closed
  scheduleOpen: boolean;
  assignOpen: boolean;
  timeBookOpen: boolean;
  expenseBookOpen: boolean;
  invoiceOpen: boolean;
  pdfOpen: boolean;
  pdfSettings: boolean;
  sendOpen: boolean;
  preferredSkills: boolean;
  planDispatchOpen: boolean;
  planVsActual: boolean;
}

export const initialSODemoState: SODemoState = {
  page: 'list',
  selectedStat: 'all',
  searchActive: false,
  showFilters: false,
  listView: 'table',
  bulkBar: false,
  createStep: 0,
  activeTab: 'overview',
  statusStage: 0,
  scheduleOpen: false,
  assignOpen: false,
  timeBookOpen: false,
  expenseBookOpen: false,
  invoiceOpen: false,
  pdfOpen: false,
  pdfSettings: false,
  sendOpen: false,
  preferredSkills: false,
  planDispatchOpen: false,
  planVsActual: false,
};

export interface SODemoStep { target: string; caption: string; duration: number; apply: (s: SODemoState) => SODemoState; }
export interface SODemoChapter { id: string; title: string; start: number; end: number; }

const pure =
  (apply: (s: SODemoState) => Partial<SODemoState>) =>
  (s: SODemoState): SODemoState => ({ ...s, ...apply(s) });

export const SO_STEPS: SODemoStep[] = [
  // ── Chapter 1 · Overview ───────────────────────────────────────────────────
  {
    target: 'so-demo-title',
    caption:
      'Welcome to Service Orders — the work order at the heart of field service. Every job your team performs on site lives here: who it’s for, what needs doing, who does it, and how it gets invoiced.',
    duration: 5600,
    apply: pure(() => ({ page: 'list' as const, selectedStat: 'all' as const, searchActive: false, showFilters: false, listView: 'table' as const, bulkBar: false })),
  },
  { target: 'so-demo-stat-total', caption: 'Four KPI cards summarise your operation, and each filters the list. Total counts every service order on the books.', duration: 4400, apply: pure(() => ({ selectedStat: 'all' as const })) },
  { target: 'so-demo-stat-active', caption: 'Active is the work in motion — scheduled, in progress, or partially completed. This is what your field team is delivering right now.', duration: 4600, apply: pure(() => ({ selectedStat: 'active' as const })) },
  { target: 'so-demo-stat-completed', caption: 'Completed shows finished work — technically done, ready to be invoiced and closed. The throughput of your operation.', duration: 4600, apply: pure(() => ({ selectedStat: 'completed' as const })) },
  { target: 'so-demo-stat-value', caption: 'And Total Value sums the worth of your orders — the revenue your field operation is carrying.', duration: 4200, apply: pure(() => ({ selectedStat: 'all' as const })) },
  { target: 'so-demo-table', caption: 'The orders table lists each one with its customer, type, status, priority, and scheduled date — colour-coded so you instantly see what’s pending, scheduled, in progress, or done. Click a row to open it.', duration: 5400, apply: pure(() => ({})) },

  // ── Chapter 2 · Controls ───────────────────────────────────────────────────
  { target: 'so-demo-search', caption: 'Search instantly across order numbers, customers, and titles — find any job in seconds.', duration: 4000, apply: pure(() => ({ searchActive: true })) },
  { target: 'so-demo-filters', caption: 'Filters refine by status, priority, and date — surface the urgent jobs that must be scheduled or invoiced today.', duration: 4400, apply: pure(() => ({ searchActive: false, showFilters: true })) },
  { target: 'so-demo-views', caption: 'See your orders three ways — a dense Table, a roomy List, and a Map of every job site.', duration: 4800, apply: pure(() => ({ showFilters: false })) },
  { target: 'so-demo-bulk', caption: 'Select several orders to act together — bulk-update status or export — with permissions respected.', duration: 4400, apply: pure(() => ({ bulkBar: true })) },

  // ── Chapter 3 · Map ────────────────────────────────────────────────────────
  { target: 'so-demo-map', caption: 'The Map view plots every service order by its site — see your whole field workload geographically, cluster nearby jobs, and plan efficient routes.', duration: 5000, apply: pure(() => ({ bulkBar: false, listView: 'map' as const })) },
  { target: 'so-demo-map-pin', caption: 'Each pin is colour-coded by status and clickable — open the order, see the customer and the assigned technician, all without leaving the map.', duration: 5000, apply: pure(() => ({})) },

  // ── Chapter 4 · Create ─────────────────────────────────────────────────────
  { target: 'so-demo-create-open', caption: 'Most orders arrive automatically from an accepted sale — but you can also raise one directly. New Order opens a guided form.', duration: 4600, apply: pure(() => ({ page: 'create' as const, listView: 'table' as const, createStep: 0 })) },
  { target: 'so-demo-create-customer', caption: 'Search and select the customer from your CRM — their site address, contact, and fiscal details flow straight in.', duration: 4800, apply: pure(() => ({ createStep: 1 })) },
  { target: 'so-demo-create-repair', caption: 'Capture the work itself — the type of service, the equipment or installation involved, the reported problem, and the priority.', duration: 5000, apply: pure(() => ({ createStep: 2 })) },
  { target: 'so-demo-create-jobs', caption: 'Break the order into jobs — the individual tasks to perform on site, each with an estimated duration and the skills it needs. This is what gets scheduled and dispatched.', duration: 5400, apply: pure(() => ({ createStep: 3 })) },
  { target: 'so-demo-create-save', caption: 'Save, and the order enters your pipeline as Pending — counted in the KPIs and ready to plan.', duration: 4200, apply: pure(() => ({ createStep: 4 })) },

  // ── Chapter 5 · Detail & status ────────────────────────────────────────────
  { target: 'so-demo-detail-header', caption: 'The service order detail page is the job’s command centre — customer, status, and the actions you use most: schedule, dispatch, invoice, and export.', duration: 5000, apply: pure(() => ({ page: 'detail' as const, activeTab: 'overview' as const, statusStage: 0 })) },
  { target: 'so-demo-status', caption: 'The status flow walks the order through its whole lifecycle — Pending, Scheduled, In Progress, Technically Completed, Ready for Invoice, Invoiced, Closed — each step one click and fully tracked.', duration: 5800, apply: pure(() => ({ statusStage: 1 })) },
  { target: 'so-demo-overview', caption: 'The Overview gathers everything: customer and site, the reported problem and repair details, the linked sale it came from, and a live summary of jobs, materials, and cost.', duration: 5400, apply: pure(() => ({ statusStage: 2 })) },

  // ── Chapter 6 · Jobs & scheduling ──────────────────────────────────────────
  { target: 'so-demo-tab-jobs', caption: 'The Jobs tab lists every task in the order with its status and duration — the granular work that turns an order into action.', duration: 4800, apply: pure(() => ({ activeTab: 'jobs' as const })) },
  { target: 'so-demo-schedule', caption: 'Schedule a job to a date and time in a couple of clicks — or hand the whole order to the Planning board for drag-and-drop assignment across your team.', duration: 5200, apply: pure(() => ({ scheduleOpen: true })) },
  { target: 'so-demo-assign', caption: 'Assign technicians by skill and availability — the system surfaces the best fit, and the moment you confirm, a dispatch is created and the technician is notified.', duration: 5400, apply: pure(() => ({ scheduleOpen: false, assignOpen: true })) },

  // ── Chapter 7 · Execution ──────────────────────────────────────────────────
  { target: 'so-demo-tab-dispatches', caption: 'The Dispatches tab shows the field tickets generated from this order — each technician’s assignment with its own status, tracked from assigned to completed.', duration: 5200, apply: pure(() => ({ assignOpen: false, activeTab: 'dispatches' as const })) },
  { target: 'so-demo-tab-time', caption: 'Time & Expenses captures everything booked against the order on site — labour hours per technician and out-of-pocket expenses — feeding straight into the invoice.', duration: 5000, apply: pure(() => ({ activeTab: 'time_expenses' as const, timeBookOpen: false, expenseBookOpen: false })) },
  { target: 'so-demo-time-book', caption: 'Book labour the way the field actually works — start a timer on arrival and stop it when the job’s done, or log hours directly. Each entry is attributed to the right technician and is instantly billable.', duration: 5400, apply: pure(() => ({ timeBookOpen: true })) },
  { target: 'so-demo-expense-book', caption: 'Log expenses on the spot — travel, parts bought locally, tolls — and attach the receipt photo. Every cost is captured for the invoice instead of lost on a notepad.', duration: 5200, apply: pure(() => ({ timeBookOpen: false, expenseBookOpen: true })) },
  { target: 'so-demo-tab-materials', caption: 'The Materials tab tracks the parts and consumables used — drawn from your inventory so stock is decremented automatically and billed accurately.', duration: 5200, apply: pure(() => ({ expenseBookOpen: false, activeTab: 'materials' as const })) },

  // ── Chapter 8 · More tabs ──────────────────────────────────────────────────
  { target: 'so-demo-tab-attachments', caption: 'Attachments hold the field evidence — before-and-after photos, the signed work report, delivery notes — everything the job produced.', duration: 4800, apply: pure(() => ({ activeTab: 'attachments' as const })) },
  { target: 'so-demo-tab-checklists', caption: 'Checklists turn procedures into guaranteed steps — and each job carries the checklist defined on its service line back in the offer/sale, grouped per job, so every job is done to standard.', duration: 5400, apply: pure(() => ({ activeTab: 'checklists' as const })) },
  { target: 'so-demo-tab-activity', caption: 'And the Activity tab is the full timeline — created, scheduled, dispatched, completed, invoiced — an immutable history of the whole job.', duration: 4800, apply: pure(() => ({ activeTab: 'activity' as const })) },

  // ── Chapter 9 · Invoice & PDF ──────────────────────────────────────────────
  { target: 'so-demo-invoice', caption: 'When the work is technically complete, Prepare Invoice pulls together the labour, materials, and expenses booked on site into a ready-to-bill sale — no re-keying.', duration: 5400, apply: pure(() => ({ activeTab: 'overview' as const, invoiceOpen: true })) },
  { target: 'so-demo-pdf', caption: 'The service order itself prints as a polished, branded document — your logo and fiscal identity, the customer and site, the jobs performed, and the materials used.', duration: 5200, apply: pure(() => ({ invoiceOpen: false, pdfOpen: true })) },
  { target: 'so-demo-pdf-settings', caption: 'And the layout is yours — a studio for colours, typography, layout, and visible fields, so every document matches your brand.', duration: 4800, apply: pure(() => ({ pdfSettings: true })) },
  { target: 'so-demo-send', caption: 'Send it to the customer by email in a click — the PDF attached, the send tracked — closing the loop from work done to customer informed.', duration: 4800, apply: pure(() => ({ pdfSettings: false, pdfOpen: false, sendOpen: true })) },

  // ── Chapter 10 · Smart routing ─────────────────────────────────────────────
  { target: 'so-demo-preferred-skills', caption: 'Every order carries the skills it needs — HVAC, welding, electrical, plumbing. Flowentra reads these preferred skills straight from the sale line, so the system already knows who is qualified before you even open the planner.', duration: 5800, apply: pure(() => ({ page: 'detail' as const, sendOpen: false, activeTab: 'overview' as const, statusStage: 2, preferredSkills: true })) },
  { target: 'so-demo-smart-tech', caption: 'When you assign, the shortlist is ranked by skill match, live availability and travel distance from the site — you pick the best fit in a click, and if nobody scores, the system tells you exactly what skill is missing.', duration: 6200, apply: pure(() => ({ assignOpen: true })) },

  // ── Chapter 11 · Plan Dispatch ─────────────────────────────────────────────
  { target: 'so-demo-plan-dispatch', caption: 'Plan Dispatch is the heart of scheduling. Pick jobs, pick a date and time, pick technicians — and Flowentra creates the dispatch tickets, splits by installation when needed, and sequences jobs back-to-back on the same visit.', duration: 6400, apply: pure(() => ({ assignOpen: false, preferredSkills: false, activeTab: 'jobs' as const, planDispatchOpen: true })) },
  { target: 'so-demo-plan-conflict', caption: 'Overlaps are caught before they happen — a red badge shows a technician already booked at that slot, so you never double-book the field. Confirm and every dispatch, calendar entry and technician notification lands in one atomic step.', duration: 6000, apply: pure(() => ({})) },

  // ── Chapter 12 · Plan vs Actual ────────────────────────────────────────────
  { target: 'so-demo-plan-vs-actual', caption: 'Every job carries its plan — labour minutes, expenses, materials — inherited from the offer and sale where it was quoted. On execution, Flowentra sits the plan next to the actuals, in the same tab.', duration: 6200, apply: pure(() => ({ planDispatchOpen: false, activeTab: 'time_expenses' as const, planVsActual: true })) },
  { target: 'so-demo-overrun', caption: 'A green badge means on-plan, amber warns you at ninety percent, red the moment the actual crosses the plan — so overruns surface the second they happen, and every hour and dinar traces back to the offer line that quoted it.', duration: 5800, apply: pure(() => ({})) },

  // ── Chapter 13 · Wrap-up ───────────────────────────────────────────────────
  { target: 'so-demo-title', caption: 'That is Service Orders end to end — KPIs and a map of your field, a guided builder, smart technician routing, Plan Dispatch with conflict detection, plan-vs-actual on execution, branded documents, and one-click invoicing.', duration: 5800, apply: pure(() => ({ page: 'list' as const, planVsActual: false, selectedStat: 'all' as const })) },
  { target: 'so-demo-stat-value', caption: 'Sales flow into service orders, orders into dispatches, dispatches into invoices — and every hour, part, and signature is tracked. Create your first order and put your field team to work.', duration: 5400, apply: pure(() => ({})) },
];

export const SO_CHAPTERS: SODemoChapter[] = [
  { id: 'overview',  title: 'Overview',        start: 0,  end: 6  },
  { id: 'controls',  title: 'Filters & Views', start: 6,  end: 10 },
  { id: 'map',       title: 'Field Map',       start: 10, end: 12 },
  { id: 'create',    title: 'Raise an Order',  start: 12, end: 17 },
  { id: 'detail',    title: 'Detail & Status', start: 17, end: 20 },
  { id: 'jobs',      title: 'Jobs & Planning', start: 20, end: 23 },
  { id: 'execution', title: 'Time & Materials', start: 23, end: 28 },
  { id: 'tabs',      title: 'Evidence',        start: 28, end: 31 },
  { id: 'invoice',   title: 'Invoice & PDF',   start: 31, end: 35 },
  { id: 'skills',    title: 'Smart Routing',   start: 35, end: 37 },
  { id: 'plan-dispatch',   title: 'Plan Dispatch',   start: 37, end: 39 },
  { id: 'plan-vs-actual',  title: 'Plan vs Actual',  start: 39, end: 41 },
  { id: 'wrapup',    title: 'Wrap-up',         start: 41, end: SO_STEPS.length },
];

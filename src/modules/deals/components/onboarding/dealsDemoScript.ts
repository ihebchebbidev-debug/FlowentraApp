// Deals (pipeline) module autopilot demo — 6 chapters, 26 steps.
// Same architecture as the other module demos. English captions live inline here
// as the source of truth; FR translations are in dealsDemoTranslations.ts by index.
//
// The list/table is the DEFAULT view (like Offers / Sales / Service Orders); the
// kanban board is shown afterwards as the optional visual pipeline.

export type DealsDemoPage = 'list' | 'create' | 'detail';

export interface DealsDemoState {
  page: DealsDemoPage;
  view: 'kanban' | 'list';
  selectedStat: 'all' | 'open' | 'won' | 'rate';
  searchActive: boolean;
  showFilters: boolean;
  highlightStage: string | null;   // which kanban column to spotlight
  createStep: number;              // 0=customer, 1=stage/value, 2=items, 3=ready
  activeTab: 'overview' | 'items' | 'activity' | 'notes';
  convertOpen: boolean;
  convertSale: boolean;
  convertProject: boolean;
}

export const initialDealsDemoState: DealsDemoState = {
  page: 'list',
  view: 'list',
  selectedStat: 'all',
  searchActive: false,
  showFilters: false,
  highlightStage: null,
  createStep: 0,
  activeTab: 'overview',
  convertOpen: false,
  convertSale: false,
  convertProject: false,
};

export interface DealsDemoStep {
  target: string;
  caption: string;
  duration: number;
  apply: (s: DealsDemoState) => DealsDemoState;
}
export interface DealsDemoChapter { id: string; title: string; start: number; end: number; }

const pure =
  (apply: (s: DealsDemoState) => Partial<DealsDemoState>) =>
  (s: DealsDemoState): DealsDemoState => ({ ...s, ...apply(s) });

export const DL_STEPS: DealsDemoStep[] = [
  // ── Chapter 1 · Pipeline (list view, the default) ───────────────────────────
  {
    target: 'dl-demo-title',
    caption:
      'Welcome to Deals — your sales pipeline. A deal is an opportunity: who the customer is, what it is worth, and how close it is to closing. When you win one, you turn it into a sale or a project in a single click.',
    duration: 6000,
    apply: pure(() => ({ page: 'list' as const, view: 'list' as const, selectedStat: 'all' as const, highlightStage: null, searchActive: false, showFilters: false })),
  },
  {
    target: 'dl-demo-stat-total',
    caption:
      'The KPI cards summarise your pipeline at a glance. Total Deals counts every opportunity you are tracking.',
    duration: 4200,
    apply: pure(() => ({ selectedStat: 'all' as const })),
  },
  {
    target: 'dl-demo-stat-open',
    caption:
      'Open Value is the money still in play — the worth of every deal that has not yet been won or lost. This is your live forecast.',
    duration: 4600,
    apply: pure(() => ({ selectedStat: 'open' as const })),
  },
  {
    target: 'dl-demo-stat-won',
    caption:
      'Won Value is what you have already closed — revenue secured, ready to become sales and projects.',
    duration: 4200,
    apply: pure(() => ({ selectedStat: 'won' as const })),
  },
  {
    target: 'dl-demo-stat-rate',
    caption:
      'And the Win Rate tells you how often you close — the share of decided deals that ended in a win.',
    duration: 4200,
    apply: pure(() => ({ selectedStat: 'rate' as const })),
  },
  {
    target: 'dl-demo-forecast',
    caption:
      'Below them sits your live forecast: the weighted pipeline (value × probability), a funnel by stage, and how many deals are at risk — going quiet or past their follow-up date. One glance tells you where to act.',
    duration: 5600,
    apply: pure(() => ({ selectedStat: 'all' as const, view: 'list' as const })),
  },
  {
    target: 'dl-demo-table',
    caption:
      'By default your deals open as a clean, sortable list — every opportunity with its stage, customer, value and probability, side by side. Click any row to open it.',
    duration: 5400,
    apply: pure(() => ({ selectedStat: 'all' as const, view: 'list' as const })),
  },

  // ── Chapter 2 · Board & Views ───────────────────────────────────────────────
  {
    target: 'dl-demo-views',
    caption:
      'Prefer a visual pipeline? One click switches the very same deals to a kanban board.',
    duration: 4400,
    apply: pure(() => ({ view: 'kanban' as const })),
  },
  {
    target: 'dl-demo-kanban',
    caption:
      'The board shows your pipeline stage by stage — Lead, Qualified, Proposal, Negotiation, then Won or Lost. Each column shows its count and total value.',
    duration: 5200,
    apply: pure(() => ({ view: 'kanban' as const })),
  },
  {
    target: 'dl-demo-col-negotiation',
    caption:
      'Just drag a card to move a deal forward. Pull this one into Negotiation and its stage updates instantly — your forecast recalculates with it.',
    duration: 5200,
    apply: pure(() => ({ view: 'kanban' as const, highlightStage: 'negotiation' })),
  },
  {
    target: 'dl-demo-search',
    caption:
      'Back to the list. Search across deal titles, customers and numbers — find any opportunity in seconds.',
    duration: 4200,
    apply: pure(() => ({ view: 'list' as const, highlightStage: null, searchActive: true })),
  },
  {
    target: 'dl-demo-filters',
    caption:
      'And filter by stage to focus on exactly the deals you care about right now.',
    duration: 4000,
    apply: pure(() => ({ searchActive: false, showFilters: true })),
  },

  // ── Chapter 3 · Create a deal ──────────────────────────────────────────────
  {
    target: 'dl-demo-create-open',
    caption:
      'Let’s create a deal. Add Deal opens a full workspace — the same structure as an offer or sale, with a contact, installations and a catalog item picker — yet lighter than a quote, with no fiscal document.',
    duration: 5400,
    apply: pure(() => ({ page: 'create' as const, view: 'list' as const, createStep: 0 })),
  },
  {
    target: 'dl-demo-create-customer',
    caption:
      'Pick the contact — a person or a company — from your CRM, using the very same selector as offers and sales.',
    duration: 4600,
    apply: pure(() => ({ createStep: 1 })),
  },
  {
    target: 'dl-demo-create-stage',
    caption:
      'On the right sits everything that makes it a forecastable deal — stage, probability, currency and expected close. You can also link the customer’s installation.',
    duration: 5200,
    apply: pure(() => ({ createStep: 2 })),
  },
  {
    target: 'dl-demo-create-items',
    caption:
      'Add articles and services straight from your catalog — and link each to an installation — with the exact same item selector used by offers and sales.',
    duration: 5200,
    apply: pure(() => ({ createStep: 3 })),
  },
  {
    target: 'dl-demo-create-save',
    caption:
      'Save, and the deal drops into your pipeline at the Lead stage, ready to move forward.',
    duration: 4000,
    apply: pure(() => ({})),
  },

  // ── Chapter 4 · Detail & tabs ──────────────────────────────────────────────
  {
    target: 'dl-demo-detail-header',
    caption:
      'Open any deal to see its full picture — title, customer, stage, and the actions you use most: edit, and convert.',
    duration: 4800,
    apply: pure(() => ({ page: 'detail' as const, activeTab: 'overview' as const })),
  },
  {
    target: 'dl-demo-metrics',
    caption:
      'The headline metrics sit up top, and the Overview gives the full picture — every detail, the customer’s contact card, the linked installations, and your next follow-up step.',
    duration: 4600,
    apply: pure(() => ({ activeTab: 'overview' as const })),
  },
  {
    target: 'dl-demo-tab-items',
    caption:
      'The Items tab lists what the deal is for — the articles and services, with their quantities and totals.',
    duration: 4400,
    apply: pure(() => ({ activeTab: 'items' as const })),
  },
  {
    target: 'dl-demo-tab-activity',
    caption:
      'Activity is the timeline — created, stage changes, every note — an automatic history of how the deal progressed.',
    duration: 4600,
    apply: pure(() => ({ activeTab: 'activity' as const })),
  },
  {
    target: 'dl-demo-tab-notes',
    caption:
      'And Notes keep the context — what the customer said, the next step, the terms you agreed.',
    duration: 4200,
    apply: pure(() => ({ activeTab: 'notes' as const })),
  },

  // ── Chapter 5 · Convert ────────────────────────────────────────────────────
  {
    target: 'dl-demo-convert',
    caption:
      'Here is the magic. When a deal is won, you don’t re-type anything — you convert it. Convert opens your options.',
    duration: 5000,
    apply: pure(() => ({ activeTab: 'overview' as const, convertOpen: true, convertSale: false, convertProject: false })),
  },
  {
    target: 'dl-demo-convert-sale',
    caption:
      'Convert to a Sale, and a sales order is created with the same customer and line items — straight into invoicing.',
    duration: 5000,
    apply: pure(() => ({ convertSale: true })),
  },
  {
    target: 'dl-demo-convert-project',
    caption:
      'Or convert to a Project to deliver the work — a project is created and linked back to the deal. A deal can even become both at once.',
    duration: 5200,
    apply: pure(() => ({ convertProject: true })),
  },
  {
    target: 'dl-demo-convert-confirm',
    caption:
      'Confirm, and the deal is marked Won and wired to everything it became — no double entry, the whole chain stays connected.',
    duration: 4800,
    apply: pure(() => ({})),
  },

  // ── Chapter 6 · Wrap-up ────────────────────────────────────────────────────
  {
    target: 'dl-demo-title',
    caption:
      'That’s Deals — a sortable list with a live forecast, an optional kanban board, a quick way to capture opportunities, and one-click conversion to sales and projects. Track every opportunity from first lead to closed win.',
    duration: 6000,
    apply: pure(() => ({ page: 'list' as const, view: 'list' as const, convertOpen: false, selectedStat: 'all' as const })),
  },
];

export const DL_CHAPTERS: DealsDemoChapter[] = [
  { id: 'overview', title: 'Pipeline',       start: 0,  end: 7  },
  { id: 'views',    title: 'Board & Views',  start: 7,  end: 12 },
  { id: 'create',   title: 'Create a Deal',  start: 12, end: 17 },
  { id: 'detail',   title: 'Deal Workspace', start: 17, end: 22 },
  { id: 'convert',  title: 'Convert',        start: 22, end: 26 },
  { id: 'wrapup',   title: 'Wrap-up',        start: 26, end: DL_STEPS.length },
];

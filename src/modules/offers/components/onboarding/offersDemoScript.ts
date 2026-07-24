// Offers (Quotes) module autopilot demo.
// Scripted state transitions, virtual cursor, and FR narration.
// English captions live inline here as the source of truth; translations are in
// offersDemoTranslations.ts keyed by step index — keep both arrays aligned.
//
// Every step below maps 1:1 to something the user actually sees in the real
// Offers module today. Kanban view and Tunisian fiscal exports (RS Récap / TEJ)
// were removed from the app — they are intentionally absent from this demo.

export type OffersDemoPage = 'list' | 'create' | 'detail';

export interface OffersDemoState {
  page: OffersDemoPage;
  // List
  selectedStat: 'all' | 'pipeline' | 'accepted';
  searchActive: boolean;
  showFilters: boolean;
  listView: 'list' | 'table';
  showMap: boolean;
  bulkSelected: boolean;
  // Create
  createStep: number;          // 0..4
  // Detail
  activeTab: 'overview' | 'items' | 'checklists' | 'documents' | 'activity';
  statusStage: number;         // 0=draft,1=sent,2=accepted (stepper highlight)
  sendOpen: boolean;
  pdfOpen: boolean;
  pdfSettings: boolean;
  convertOpen: boolean;
  planningOpen: boolean;
  renewFlash: boolean;
}

export const initialOffersDemoState: OffersDemoState = {
  page: 'list',
  selectedStat: 'all',
  searchActive: false,
  showFilters: false,
  listView: 'table',
  showMap: false,
  bulkSelected: false,
  createStep: 0,
  activeTab: 'overview',
  statusStage: 0,
  sendOpen: false,
  pdfOpen: false,
  pdfSettings: false,
  convertOpen: false,
  planningOpen: false,
  renewFlash: false,
};

export interface OffersDemoStep {
  target: string;
  caption: string;
  duration: number;
  apply: (s: OffersDemoState) => OffersDemoState;
}
export interface OffersDemoChapter { id: string; title: string; start: number; end: number; }

const pure =
  (apply: (s: OffersDemoState) => Partial<OffersDemoState>) =>
  (s: OffersDemoState): OffersDemoState => ({ ...s, ...apply(s) });

export const OF_STEPS: OffersDemoStep[] = [
  // ── Chapter 1 · Overview ───────────────────────────────────────────────────
  {
    target: 'of-demo-title',
    caption:
      'This is Offers — where every deal begins. Build a quote, send it, follow it through the pipeline, and convert the winners into sales.',
    duration: 5000,
    apply: pure(() => ({
      page: 'list' as const, selectedStat: 'all' as const, searchActive: false,
      showFilters: false, listView: 'table' as const, showMap: false, bulkSelected: false,
    })),
  },
  {
    target: 'of-demo-stat-total',
    caption:
      'Four KPI cards sit above the list, and each one filters it. Total counts every offer you have.',
    duration: 4200,
    apply: pure(() => ({ selectedStat: 'all' as const })),
  },
  {
    target: 'of-demo-stat-pipeline',
    caption:
      'Pipeline is the live money in motion — offers that are still open and chaseable.',
    duration: 4200,
    apply: pure(() => ({ selectedStat: 'pipeline' as const })),
  },
  {
    target: 'of-demo-stat-accepted',
    caption:
      'Accepted shows the deals you have won — ready to become sales.',
    duration: 4000,
    apply: pure(() => ({ selectedStat: 'accepted' as const })),
  },
  {
    target: 'of-demo-stat-value',
    caption:
      'Total Value adds up your offers in your currency — the headline number for how much business is on the table.',
    duration: 4400,
    apply: pure(() => ({ selectedStat: 'all' as const })),
  },
  {
    target: 'of-demo-table',
    caption:
      'The table shows each quote with its customer, amount, status and validity date, colour-coded by state.',
    duration: 4600,
    apply: pure(() => ({})),
  },
  {
    target: 'of-demo-row-actions',
    caption:
      'Every row has a menu — View, Edit, Send, Convert to Sale, Report, Delete — so you can act without opening the offer.',
    duration: 5000,
    apply: pure(() => ({})),
  },
  {
    target: 'of-demo-bulk',
    caption:
      'Tick several rows and a bulk bar appears — clean up drafts or archive lost deals in one go.',
    duration: 4600,
    apply: pure(() => ({ bulkSelected: true })),
  },

  // ── Chapter 2 · Search, Filters, Views ─────────────────────────────────────
  {
    target: 'of-demo-search',
    caption:
      'Search across titles, customers and offer numbers — find any quote in a couple of keystrokes.',
    duration: 4200,
    apply: pure(() => ({ bulkSelected: false, searchActive: true })),
  },
  {
    target: 'of-demo-filters',
    caption:
      'Filters refine by status, assignee and date range — build the exact view you need.',
    duration: 4600,
    apply: pure(() => ({ searchActive: false, showFilters: true })),
  },
  {
    target: 'of-demo-views',
    caption:
      'Two ways to look at the same data — a dense Table for scanning, or a roomier List for detail.',
    duration: 4400,
    apply: pure(() => ({ showFilters: false })),
  },
  {
    target: 'of-demo-map',
    caption:
      'Offers carry the customer location, so a Map view plots every deal geographically — handy for planning visits.',
    duration: 4600,
    apply: pure(() => ({ showMap: true })),
  },
  {
    target: 'of-demo-import',
    caption:
      'And you can bulk-import an existing quote list from a spreadsheet — your data comes across in one shot.',
    duration: 4400,
    apply: pure(() => ({ showMap: false })),
  },

  // ── Chapter 3 · Create an offer ────────────────────────────────────────────
  {
    target: 'of-demo-create-open',
    caption:
      'Let us build a quote. New Offer opens a guided form — customer, line items, totals, all on one page.',
    duration: 4200,
    apply: pure(() => ({ page: 'create' as const, listView: 'table' as const, createStep: 0 })),
  },
  {
    target: 'of-demo-create-contact',
    caption:
      'Pick the customer from your CRM and their details auto-fill — including CIN and Matricule Fiscale for compliant documents.',
    duration: 5000,
    apply: pure(() => ({ createStep: 1 })),
  },
  {
    target: 'of-demo-create-items',
    caption:
      'Add lines straight from your catalog — materials and services together — each with quantity, price and an optional discount.',
    duration: 5000,
    apply: pure(() => ({ createStep: 2 })),
  },
  {
    target: 'of-demo-create-totals',
    caption:
      'Totals compute live in the right order — subtotal, then discount, then tax on the discounted amount, then the Tunisian fiscal stamp.',
    duration: 5200,
    apply: pure(() => ({ createStep: 3 })),
  },
  {
    target: 'of-demo-create-meta',
    caption:
      'Tag the deal with a category and source, set a validity date, add notes — the context that feeds your reports later.',
    duration: 4800,
    apply: pure(() => ({ createStep: 4 })),
  },
  {
    target: 'of-demo-create-save',
    caption:
      'Save, and the offer joins your pipeline as a draft — counted in the KPIs and ready to send.',
    duration: 4000,
    apply: pure(() => ({})),
  },

  // ── Chapter 4 · Detail & status flow ───────────────────────────────────────
  {
    target: 'of-demo-detail-header',
    caption:
      'The offer detail is the home of the deal — title, customer, amount, and the actions you use the most.',
    duration: 4600,
    apply: pure(() => ({ page: 'detail' as const, activeTab: 'overview' as const, statusStage: 0 })),
  },
  {
    target: 'of-demo-status',
    caption:
      'The status flow walks the offer from Draft to Sent to Accepted, with confirmed branches for Decline and Cancel so nothing closes by accident.',
    duration: 5200,
    apply: pure(() => ({ statusStage: 1 })),
  },
  {
    target: 'of-demo-overview',
    caption:
      'Overview gathers everything — customer and fiscal details, financial summary, validity, and the linked installation if the quote is on site.',
    duration: 5000,
    apply: pure(() => ({ statusStage: 2 })),
  },

  // ── Chapter 5 · Tabs ───────────────────────────────────────────────────────
  {
    target: 'of-demo-tab-items',
    caption:
      'Items lists every line with its totals — edit quantity, price and discount inline while the offer is still a draft.',
    duration: 4400,
    apply: pure(() => ({ activeTab: 'items' as const })),
  },
  {
    target: 'of-demo-tab-checklists',
    caption:
      'Checklists turn a quote into a process. Offer-level ones cover qualification before you send; and a checklist attached to a service line travels with it — offer to sale to service order job to dispatch — so the field team gets the exact steps.',
    duration: 6000,
    apply: pure(() => ({ activeTab: 'checklists' as const })),
  },
  {
    target: 'of-demo-tab-documents',
    caption:
      'Documents keep specs, drawings and signed approvals with the offer — everything the deal needs, in one place.',
    duration: 4400,
    apply: pure(() => ({ activeTab: 'documents' as const })),
  },
  {
    target: 'of-demo-tab-activity',
    caption:
      'Activity is your notes feed on the deal — every call and follow-up stamped with who wrote it and when.',
    duration: 4400,
    apply: pure(() => ({ activeTab: 'activity' as const })),
  },

  // ── Chapter 6 · Send & PDF ─────────────────────────────────────────────────
  {
    target: 'of-demo-send',
    caption:
      'Send the offer by e-mail in a click — the PDF is attached, the send count ticks up, and the status moves to Sent automatically.',
    duration: 5000,
    apply: pure(() => ({ activeTab: 'overview' as const, sendOpen: true })),
  },
  {
    target: 'of-demo-pdf',
    caption:
      'The generated PDF is a polished, branded quote — your logo and fiscal identity, customer block, itemised lines, totals and terms.',
    duration: 5000,
    apply: pure(() => ({ sendOpen: false, pdfOpen: true })),
  },
  {
    target: 'of-demo-pdf-settings',
    caption:
      'And it is fully yours — a studio for colours, typography, layout, data fields and advanced options, so every quote matches your brand.',
    duration: 5000,
    apply: pure(() => ({ pdfSettings: true })),
  },
  {
    target: 'of-demo-pdf-download',
    caption:
      'Download it, print it or share it — the same crisp document every time, with the stamp and totals computed to the millime.',
    duration: 4400,
    apply: pure(() => ({ pdfSettings: false })),
  },

  // ── Chapter 7 · Convert ────────────────────────────────────────────────────
  {
    target: 'of-demo-convert',
    caption:
      'Here is where the offer pays off. Once it is accepted, Convert turns the quote into a sale in one click.',
    duration: 4800,
    apply: pure(() => ({ pdfOpen: false, convertOpen: true })),
  },
  {
    target: 'of-demo-convert-options',
    caption:
      'You confirm the customer, the line count and the total — and the sale is created, linked back to the offer, ready to invoice or to plan as a service order.',
    duration: 5400,
    apply: pure(() => ({})),
  },

  // ── Chapter 8 · Planning lineage on items ─────────────────────────────────
  {
    target: 'of-demo-planning',
    caption:
      'Every offer line can carry its plan — labour minutes, planned expenses like travel, and planned materials. That plan travels with the item as the offer becomes a sale, then a service order.',
    duration: 6200,
    apply: pure(() => ({ convertOpen: false, page: 'detail' as const, activeTab: 'items' as const, planningOpen: true })),
  },
  {
    target: 'of-demo-planning-lineage',
    caption:
      'On the service order the same plan sits next to the actuals — plan versus done, in green, amber or red — so overruns show the moment they happen.',
    duration: 5800,
    apply: pure(() => ({})),
  },

  // ── Chapter 9 · Renew ──────────────────────────────────────────────────────
  {
    target: 'of-demo-renew',
    caption:
      'When a quote expires or is declined, Renew clones it in one click — a fresh offer with the same customer and lines, ready to chase again.',
    duration: 5000,
    apply: pure(() => ({ planningOpen: false, page: 'list' as const, renewFlash: true })),
  },

  // ── Chapter 10 · Wrap-up ──────────────────────────────────────────────────
  {
    target: 'of-demo-title',
    caption:
      'That is Offers end to end — KPI-driven pipeline, a guided builder with compliant totals, planning entries that travel to the field, branded PDFs and one-click conversion.',
    duration: 5400,
    apply: pure(() => ({ page: 'list' as const, renewFlash: false, convertOpen: false, selectedStat: 'all' as const })),
  },
  {
    target: 'of-demo-stat-value',
    caption:
      'Every quote flows into a sale, every sale into delivery — and every step is tracked. Create your first offer and start turning prospects into revenue.',
    duration: 5000,
    apply: pure(() => ({})),
  },
];

export const OF_CHAPTERS: OffersDemoChapter[] = [
  { id: 'overview', title: 'Overview',         start: 0,  end: 8  },
  { id: 'controls', title: 'Search & Views',   start: 8,  end: 13 },
  { id: 'create',   title: 'Build a Quote',    start: 13, end: 19 },
  { id: 'detail',   title: 'Detail & Status',  start: 19, end: 22 },
  { id: 'tabs',     title: 'Deal Workspace',   start: 22, end: 26 },
  { id: 'pdf',      title: 'Send & PDF',       start: 26, end: 30 },
  { id: 'convert',  title: 'Convert to Sale',  start: 30, end: 32 },
  { id: 'planning', title: 'Planning Lineage', start: 32, end: 34 },
  { id: 'renew',    title: 'Renew',            start: 34, end: 35 },
  { id: 'wrapup',   title: 'Wrap-up',          start: 35, end: OF_STEPS.length },
];

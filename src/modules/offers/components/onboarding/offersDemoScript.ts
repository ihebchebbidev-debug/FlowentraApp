// Offers (Quotes) module autopilot demo — 9 chapters, 35 steps.
// Same architecture as the other module demos: scripted state transitions, a
// virtual cursor, and FR/AR narration. English captions live inline here as the
// source of truth; translations are in offersDemoTranslations.ts keyed by index.

export type OffersDemoPage = 'list' | 'create' | 'detail';

export interface OffersDemoState {
  page: OffersDemoPage;
  // List
  selectedStat: 'all' | 'pipeline' | 'accepted';
  searchActive: boolean;
  showFilters: boolean;
  listView: 'list' | 'table' | 'kanban';
  showMap: boolean;
  showExport: boolean;
  // Create
  createStep: number;          // 0..4
  // Detail
  activeTab: 'overview' | 'items' | 'notes' | 'checklists' | 'documents' | 'activity';
  statusStage: number;         // 0=draft,1=sent,2=accepted (stepper highlight)
  sendOpen: boolean;
  pdfOpen: boolean;
  pdfSettings: boolean;
  convertOpen: boolean;
}

export const initialOffersDemoState: OffersDemoState = {
  page: 'list',
  selectedStat: 'all',
  searchActive: false,
  showFilters: false,
  listView: 'table',
  showMap: false,
  showExport: false,
  createStep: 0,
  activeTab: 'overview',
  statusStage: 0,
  sendOpen: false,
  pdfOpen: false,
  pdfSettings: false,
  convertOpen: false,
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
      'Welcome to Offers — where every deal begins. Build professional quotes, send them, track them through your pipeline, and convert the winners into sales in one click.',
    duration: 5400,
    apply: pure(() => ({
      page: 'list' as const, selectedStat: 'all' as const, searchActive: false,
      showFilters: false, listView: 'table' as const, showMap: false,
    })),
  },
  {
    target: 'of-demo-stat-total',
    caption:
      'KPI cards summarise your whole quoting activity at a glance — and each one filters the list. Total counts every offer you’ve created.',
    duration: 4400,
    apply: pure(() => ({ selectedStat: 'all' as const })),
  },
  {
    target: 'of-demo-stat-pipeline',
    caption:
      'Pipeline is the live money in motion — offers that are sent or in negotiation, still open and chaseable. This is your sales team’s heartbeat.',
    duration: 4800,
    apply: pure(() => ({ selectedStat: 'pipeline' as const })),
  },
  {
    target: 'of-demo-stat-accepted',
    caption:
      'Accepted shows the deals you’ve won — ready to become invoices. Paired with the total, it gives you an instant win-rate.',
    duration: 4600,
    apply: pure(() => ({ selectedStat: 'accepted' as const })),
  },
  {
    target: 'of-demo-stat-value',
    caption:
      'And Total Value sums the worth of your offers in your currency — the headline number that tells you how much business is on the table.',
    duration: 4400,
    apply: pure(() => ({ selectedStat: 'all' as const })),
  },
  {
    target: 'of-demo-table',
    caption:
      'The offers table lists each quote with its customer, amount, status, and validity — colour-coded so you instantly see what’s draft, sent, accepted, or lost. Click any row to open it.',
    duration: 5200,
    apply: pure(() => ({})),
  },

  // ── Chapter 2 · Search, Filters, Views ─────────────────────────────────────
  {
    target: 'of-demo-search',
    caption:
      'Search instantly across titles, customers, and offer numbers — find any quote in seconds.',
    duration: 4000,
    apply: pure(() => ({ searchActive: true })),
  },
  {
    target: 'of-demo-filters',
    caption:
      'Filters refine by status, who it’s assigned to, and a date range — build the exact view you need, like "my offers, sent this month, still open".',
    duration: 5000,
    apply: pure(() => ({ searchActive: false, showFilters: true })),
  },
  {
    target: 'of-demo-views',
    caption:
      'See your offers three ways: a dense Table for scanning, a roomy List for detail, and a Kanban board to drag deals through your pipeline.',
    duration: 4800,
    apply: pure(() => ({ showFilters: false })),
  },
  {
    target: 'of-demo-map',
    caption:
      'Offers carry the customer’s location, so a Map view plots every deal geographically — perfect for planning visits and spotting regional opportunities.',
    duration: 4800,
    apply: pure(() => ({ showMap: true })),
  },
  {
    target: 'of-demo-export',
    caption:
      'Export to Excel for reporting, or bulk-import an existing quote list from a spreadsheet — your data moves both ways without friction.',
    duration: 4600,
    apply: pure(() => ({ showMap: false, showExport: true })),
  },

  // ── Chapter 3 · Kanban pipeline ────────────────────────────────────────────
  {
    target: 'of-demo-kanban',
    caption:
      'The Kanban board is your pipeline made visual — columns for Draft, Sent, Negotiation, Accepted, and Lost, each showing its count and total value.',
    duration: 5000,
    apply: pure(() => ({ showExport: false, listView: 'kanban' as const })),
  },
  {
    target: 'of-demo-kanban-drag',
    caption:
      'Drag a card from one column to the next to move the deal forward — the status updates instantly, and the activity log records the change.',
    duration: 5000,
    apply: pure(() => ({})),
  },

  // ── Chapter 4 · Create an offer ────────────────────────────────────────────
  {
    target: 'of-demo-create-open',
    caption:
      'Let’s build a quote. New Offer opens a guided form — customer, line items, and totals, all on one page.',
    duration: 4400,
    apply: pure(() => ({ page: 'create' as const, listView: 'table' as const, createStep: 0 })),
  },
  {
    target: 'of-demo-create-contact',
    caption:
      'Pick the customer from your CRM and their details auto-fill — including the fiscal identity (CIN and Matricule Fiscale) needed for compliant documents.',
    duration: 5000,
    apply: pure(() => ({ createStep: 1 })),
  },
  {
    target: 'of-demo-create-items',
    caption:
      'Add line items straight from your catalog — materials and services together — each with quantity, unit price, and an optional discount. The catalog keeps pricing consistent.',
    duration: 5400,
    apply: pure(() => ({ createStep: 2 })),
  },
  {
    target: 'of-demo-create-totals',
    caption:
      'Totals compute live in the correct order: subtotal, then discount, then tax on the discounted amount, then the Tunisian fiscal stamp — always accurate, always compliant.',
    duration: 5400,
    apply: pure(() => ({ createStep: 3 })),
  },
  {
    target: 'of-demo-create-meta',
    caption:
      'Classify the deal with a category and source for your analytics, set a validity date, and add notes — context that powers your reporting later.',
    duration: 5000,
    apply: pure(() => ({ createStep: 4 })),
  },
  {
    target: 'of-demo-create-save',
    caption:
      'Save, and the offer joins your pipeline as a draft — counted in the KPIs and ready to send.',
    duration: 4200,
    apply: pure(() => ({})),
  },

  // ── Chapter 5 · Detail & status flow ───────────────────────────────────────
  {
    target: 'of-demo-detail-header',
    caption:
      'The offer detail page is the deal’s home — title, customer, amount, and the actions you use most: send, export, and convert.',
    duration: 4800,
    apply: pure(() => ({ page: 'detail' as const, activeTab: 'overview' as const, statusStage: 0 })),
  },
  {
    target: 'of-demo-status',
    caption:
      'The status flow walks the offer from Draft to Sent to Accepted — with one-click branches to Decline or Cancel, each confirmed so a deal is never closed by accident.',
    duration: 5400,
    apply: pure(() => ({ statusStage: 1 })),
  },
  {
    target: 'of-demo-overview',
    caption:
      'The Overview gathers everything: customer and fiscal details, the financial summary, validity, and the linked installation if the quote covers equipment on site.',
    duration: 5200,
    apply: pure(() => ({ statusStage: 2 })),
  },

  // ── Chapter 6 · Tabs ───────────────────────────────────────────────────────
  {
    target: 'of-demo-tab-items',
    caption:
      'The Items tab lists every line with its totals — edit quantities, prices, and discounts inline while the offer is still a draft.',
    duration: 4600,
    apply: pure(() => ({ activeTab: 'items' as const })),
  },
  {
    target: 'of-demo-tab-notes',
    caption:
      'Notes keep the conversation with the customer — every call and follow-up, stamped with who wrote it and when.',
    duration: 4400,
    apply: pure(() => ({ activeTab: 'notes' as const })),
  },
  {
    target: 'of-demo-tab-checklists',
    caption:
      'Checklists turn a quote into a process — qualification steps, approvals, things to confirm before you send — so nothing is missed on a big deal.',
    duration: 4800,
    apply: pure(() => ({ activeTab: 'checklists' as const })),
  },
  {
    target: 'of-demo-tab-documents',
    caption:
      'Documents and attachments live with the offer — specs, drawings, signed approvals — everything the deal needs in one place.',
    duration: 4600,
    apply: pure(() => ({ activeTab: 'documents' as const })),
  },
  {
    target: 'of-demo-tab-activity',
    caption:
      'And the Activity tab is the full timeline — created, sent, opened, accepted — an immutable history of how the deal moved.',
    duration: 4600,
    apply: pure(() => ({ activeTab: 'activity' as const })),
  },

  // ── Chapter 7 · Send & PDF ─────────────────────────────────────────────────
  {
    target: 'of-demo-send',
    caption:
      'Send the offer by email in a click — Flowentra attaches the PDF, tracks how many times it’s been sent, and advances the status to Sent automatically.',
    duration: 5200,
    apply: pure(() => ({ activeTab: 'overview' as const, sendOpen: true })),
  },
  {
    target: 'of-demo-pdf',
    caption:
      'The generated PDF is a polished, branded quote — your logo and fiscal identity, the customer block, itemised lines, totals, and terms, ready to win the deal.',
    duration: 5200,
    apply: pure(() => ({ sendOpen: false, pdfOpen: true })),
  },
  {
    target: 'of-demo-pdf-settings',
    caption:
      'And it’s fully yours to design — a settings studio for colours, typography, layout, and which fields appear, so every quote matches your brand exactly.',
    duration: 5200,
    apply: pure(() => ({ pdfSettings: true })),
  },
  {
    target: 'of-demo-pdf-download',
    caption:
      'Download it, print it, or send it — the same crisp document every time, with your tax stamp and totals computed to the millime.',
    duration: 4600,
    apply: pure(() => ({ pdfSettings: false })),
  },

  // ── Chapter 8 · Convert ────────────────────────────────────────────────────
  {
    target: 'of-demo-convert',
    caption:
      'Here’s where the offer pays off. Once it’s accepted, Convert turns the quote into the next stage of your business — no re-keying, nothing lost.',
    duration: 5000,
    apply: pure(() => ({ pdfOpen: false, convertOpen: true })),
  },
  {
    target: 'of-demo-convert-options',
    caption:
      'Convert it into a Sale to invoice the customer, and — if it includes services — into a Service Order to dispatch the work, in a single step. The whole pipeline, connected end to end.',
    duration: 5600,
    apply: pure(() => ({})),
  },

  // ── Chapter 9 · Wrap-up ────────────────────────────────────────────────────
  {
    target: 'of-demo-title',
    caption:
      'That is Offers end to end — KPIs and a visual pipeline, a guided builder with compliant totals, a 360° detail with notes, checklists and documents, branded PDFs, email tracking, and one-click conversion.',
    duration: 5800,
    apply: pure(() => ({ page: 'list' as const, convertOpen: false, selectedStat: 'all' as const })),
  },
  {
    target: 'of-demo-stat-value',
    caption:
      'Every quote flows into a sale, every sale into delivery, and every step is tracked. Create your first offer and start turning prospects into revenue.',
    duration: 5200,
    apply: pure(() => ({})),
  },
];

export const OF_CHAPTERS: OffersDemoChapter[] = [
  { id: 'overview', title: 'Overview',        start: 0,  end: 6  },
  { id: 'controls', title: 'Filters & Views', start: 6,  end: 11 },
  { id: 'kanban',   title: 'Pipeline',        start: 11, end: 13 },
  { id: 'create',   title: 'Build a Quote',   start: 13, end: 19 },
  { id: 'detail',   title: 'Detail & Status', start: 19, end: 22 },
  { id: 'tabs',     title: 'Deal Workspace',  start: 22, end: 27 },
  { id: 'pdf',      title: 'Send & PDF',      start: 27, end: 31 },
  { id: 'convert',  title: 'Convert',         start: 31, end: 33 },
  { id: 'wrapup',   title: 'Wrap-up',         start: 33, end: OF_STEPS.length },
];

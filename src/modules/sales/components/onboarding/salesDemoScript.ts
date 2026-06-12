// Sales (Invoices) module autopilot demo — 9 chapters, 35 steps.
// Same architecture as the other module demos. English captions live inline here
// as the source of truth; translations are in salesDemoTranslations.ts by index.

export type SalesDemoPage = 'list' | 'create' | 'detail';

export interface SalesDemoState {
  page: SalesDemoPage;
  selectedStat: 'all' | 'active' | 'invoiced';
  searchActive: boolean;
  showFilters: boolean;
  listView: 'list' | 'table';
  showMap: boolean;
  showExport: boolean;
  createStep: number;          // 0..4
  activeTab: 'overview' | 'items' | 'notes' | 'checklists' | 'documents' | 'activity';
  statusStage: number;         // 0=created,1=in_progress,2=invoiced,3=closed
  sendOpen: boolean;
  pdfOpen: boolean;
  pdfSettings: boolean;
  convertOpen: boolean;
}

export const initialSalesDemoState: SalesDemoState = {
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

export interface SalesDemoStep {
  target: string;
  caption: string;
  duration: number;
  apply: (s: SalesDemoState) => SalesDemoState;
}
export interface SalesDemoChapter { id: string; title: string; start: number; end: number; }

const pure =
  (apply: (s: SalesDemoState) => Partial<SalesDemoState>) =>
  (s: SalesDemoState): SalesDemoState => ({ ...s, ...apply(s) });

export const SA_STEPS: SalesDemoStep[] = [
  // ── Chapter 1 · Overview ───────────────────────────────────────────────────
  {
    target: 'sa-demo-title',
    caption:
      'Welcome to Sales — where accepted offers become revenue. Raise invoices, track payment and delivery, and hand finished sales straight to your field team as service orders.',
    duration: 5400,
    apply: pure(() => ({
      page: 'list' as const, selectedStat: 'all' as const, searchActive: false,
      showFilters: false, listView: 'table' as const, showMap: false,
    })),
  },
  {
    target: 'sa-demo-stat-total',
    caption:
      'KPI cards give you the state of the business at a glance, and each filters the list. Total counts every sale you’ve recorded.',
    duration: 4400,
    apply: pure(() => ({ selectedStat: 'all' as const })),
  },
  {
    target: 'sa-demo-stat-active',
    caption:
      'Active is the work in flight — sales created or in progress, on their way to being fulfilled and invoiced.',
    duration: 4400,
    apply: pure(() => ({ selectedStat: 'active' as const })),
  },
  {
    target: 'sa-demo-stat-invoiced',
    caption:
      'Invoiced shows what’s been billed — fully or partially — so you always know how much revenue is booked versus still pending.',
    duration: 4600,
    apply: pure(() => ({ selectedStat: 'invoiced' as const })),
  },
  {
    target: 'sa-demo-stat-value',
    caption:
      'And Total Value is the headline — the worth of your sales in your currency, the number your whole team rallies around.',
    duration: 4400,
    apply: pure(() => ({ selectedStat: 'all' as const })),
  },
  {
    target: 'sa-demo-table',
    caption:
      'The sales table lists each one with its customer, amount, status, and priority — colour-coded so you instantly see what’s created, in progress, invoiced, or closed. Click a row to open it.',
    duration: 5200,
    apply: pure(() => ({})),
  },

  // ── Chapter 2 · Search, Filters, Views ─────────────────────────────────────
  {
    target: 'sa-demo-search',
    caption:
      'Search instantly across titles, customers, and sale numbers — find any deal in seconds.',
    duration: 4000,
    apply: pure(() => ({ searchActive: true })),
  },
  {
    target: 'sa-demo-filters',
    caption:
      'Filters refine by status, priority, and date range — surface the urgent sales that need invoicing today.',
    duration: 4600,
    apply: pure(() => ({ searchActive: false, showFilters: true })),
  },
  {
    target: 'sa-demo-views',
    caption:
      'See your sales two ways — a dense Table for scanning, or a roomy List for detail — pick the view that fits the task.',
    duration: 4600,
    apply: pure(() => ({ showFilters: false })),
  },
  {
    target: 'sa-demo-map',
    caption:
      'Each sale carries the customer’s location, so a Map view plots them geographically — handy for planning deliveries and regional analysis.',
    duration: 4800,
    apply: pure(() => ({ showMap: true })),
  },
  {
    target: 'sa-demo-export',
    caption:
      'Export to Excel for accounting and reporting — your revenue data flows straight into the tools your finance team already uses.',
    duration: 4600,
    apply: pure(() => ({ showMap: false, showExport: true })),
  },


  // ── Chapter 4 · Create a sale ──────────────────────────────────────────────
  {
    target: 'sa-demo-create-open',
    caption:
      'Most sales arrive automatically from an accepted offer — but you can also raise one directly. New Sale opens a guided form.',
    duration: 4600,
    apply: pure(() => ({ page: 'create' as const, listView: 'table' as const, createStep: 0 })),
  },
  {
    target: 'sa-demo-create-customer',
    caption:
      'Pick the customer and their details auto-fill — including the fiscal identity needed for a compliant invoice.',
    duration: 4800,
    apply: pure(() => ({ createStep: 1 })),
  },
  {
    target: 'sa-demo-create-items',
    caption:
      'Add line items from your catalog — products and services together — each with quantity, price, and optional discount, exactly as on the offer.',
    duration: 5200,
    apply: pure(() => ({ createStep: 2 })),
  },
  {
    target: 'sa-demo-create-totals',
    caption:
      'Totals compute live in the compliant order — subtotal, discount, tax on the discounted amount, shipping, and the fiscal stamp — so every invoice is correct to the millime.',
    duration: 5400,
    apply: pure(() => ({ createStep: 3 })),
  },
  {
    target: 'sa-demo-create-meta',
    caption:
      'Set a delivery date and a priority, and flag it recurring for subscriptions or maintenance contracts that should invoice on a schedule.',
    duration: 5200,
    apply: pure(() => ({ createStep: 4 })),
  },
  {
    target: 'sa-demo-create-save',
    caption:
      'Save, and the sale enters your fulfilment pipeline — counted in the KPIs and ready to invoice.',
    duration: 4200,
    apply: pure(() => ({})),
  },

  // ── Chapter 5 · Detail & status flow ───────────────────────────────────────
  {
    target: 'sa-demo-detail-header',
    caption:
      'The sale detail page is its home — title, customer, amount, and the actions you use most: send the invoice, export, and convert to a service order.',
    duration: 5000,
    apply: pure(() => ({ page: 'detail' as const, activeTab: 'overview' as const, statusStage: 0 })),
  },
  {
    target: 'sa-demo-status',
    caption:
      'The status flow walks the sale from Created to In Progress to Invoiced to Closed — including partial invoicing for deals billed in stages. Each step is one click and fully tracked.',
    duration: 5600,
    apply: pure(() => ({ statusStage: 1 })),
  },
  {
    target: 'sa-demo-overview',
    caption:
      'The Overview gathers everything: customer and fiscal details, the financial summary with shipping and stamp, the delivery date, and the originating offer it was converted from.',
    duration: 5400,
    apply: pure(() => ({ statusStage: 2 })),
  },

  // ── Chapter 6 · Tabs ───────────────────────────────────────────────────────
  {
    target: 'sa-demo-tab-items',
    caption:
      'The Items tab lists every line with its totals — adjust quantities and pricing before the sale is invoiced.',
    duration: 4500,
    apply: pure(() => ({ activeTab: 'items' as const })),
  },
  {
    target: 'sa-demo-tab-notes',
    caption:
      'Notes keep the record of every conversation — delivery arrangements, payment promises, special terms — stamped with who and when.',
    duration: 4600,
    apply: pure(() => ({ activeTab: 'notes' as const })),
  },
  {
    target: 'sa-demo-tab-checklists',
    caption:
      'Checklists drive fulfilment — confirm stock, schedule delivery, collect the signed delivery note — so nothing ships incomplete.',
    duration: 4800,
    apply: pure(() => ({ activeTab: 'checklists' as const })),
  },
  {
    target: 'sa-demo-tab-documents',
    caption:
      'Documents and attachments stay with the sale — the signed quote, delivery notes, proof of payment — the full paper trail in one place.',
    duration: 4600,
    apply: pure(() => ({ activeTab: 'documents' as const })),
  },
  {
    target: 'sa-demo-tab-activity',
    caption:
      'And the Activity tab is the complete timeline — created, invoiced, paid, closed — an immutable history of the whole transaction.',
    duration: 4600,
    apply: pure(() => ({ activeTab: 'activity' as const })),
  },

  // ── Chapter 7 · Invoice & PDF ──────────────────────────────────────────────
  {
    target: 'sa-demo-send',
    caption:
      'Send the invoice by email in a click — Flowentra attaches the PDF and advances the status to Invoiced, with the send tracked on the record.',
    duration: 5000,
    apply: pure(() => ({ activeTab: 'overview' as const, sendOpen: true })),
  },
  {
    target: 'sa-demo-pdf',
    caption:
      'The generated invoice is a polished, fiscally-compliant document — your logo and Matricule Fiscale, the customer block, itemised lines, TVA, fiscal stamp, and the amount due.',
    duration: 5400,
    apply: pure(() => ({ sendOpen: false, pdfOpen: true })),
  },
  {
    target: 'sa-demo-pdf-settings',
    caption:
      'And the layout is yours — a studio for colours, typography, layout, and visible fields, so every invoice carries your brand and meets the rules.',
    duration: 5200,
    apply: pure(() => ({ pdfSettings: true })),
  },
  {
    target: 'sa-demo-pdf-download',
    caption:
      'Download, print, or email it — the same compliant invoice every time, with TVA and fiscal stamp computed automatically.',
    duration: 4600,
    apply: pure(() => ({ pdfSettings: false })),
  },

  // ── Chapter 8 · Convert to Service Order ───────────────────────────────────
  {
    target: 'sa-demo-convert',
    caption:
      'When a sale includes work to be done on site, it doesn’t stop at the invoice. Convert turns the sale into a Service Order for your field team.',
    duration: 5000,
    apply: pure(() => ({ pdfOpen: false, convertOpen: true })),
  },
  {
    target: 'sa-demo-convert-options',
    caption:
      'Configure the service order — which line items become jobs, the site, and the priority — and it lands in Planning, ready to dispatch. Sale to scheduled work, with nothing re-typed.',
    duration: 5600,
    apply: pure(() => ({})),
  },

  // ── Chapter 9 · Wrap-up ────────────────────────────────────────────────────
  {
    target: 'sa-demo-title',
    caption:
      'That is Sales end to end — KPIs and a fulfilment pipeline, a guided builder with compliant invoices, a 360° detail with notes, checklists and documents, branded PDFs, and one-click conversion to service orders.',
    duration: 5800,
    apply: pure(() => ({ page: 'list' as const, convertOpen: false, selectedStat: 'all' as const })),
  },
  {
    target: 'sa-demo-stat-value',
    caption:
      'Offers flow into sales, sales into invoices and service orders, and every dinar is tracked. Record your first sale and close the loop from quote to cash to delivery.',
    duration: 5400,
    apply: pure(() => ({})),
  },
];

export const SA_CHAPTERS: SalesDemoChapter[] = [
  { id: 'overview', title: 'Overview',        start: 0,  end: 6  },
  { id: 'controls', title: 'Filters & Views', start: 6,  end: 11 },
  { id: 'create',   title: 'Raise a Sale',    start: 11, end: 17 },
  { id: 'detail',   title: 'Detail & Status', start: 17, end: 20 },
  { id: 'tabs',     title: 'Sale Workspace',  start: 20, end: 25 },
  { id: 'pdf',      title: 'Invoice & PDF',   start: 25, end: 29 },
  { id: 'convert',  title: 'To Service Order', start: 29, end: 31 },
  { id: 'wrapup',   title: 'Wrap-up',         start: 31, end: SA_STEPS.length },
];

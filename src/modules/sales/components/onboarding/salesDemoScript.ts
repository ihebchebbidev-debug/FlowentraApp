// Sales (Invoices) module autopilot demo — 9 chapters, 35 steps.
// Mirrors the real Sales module exactly: KPIs (Total / In-progress / Closed / Value),
// table columns Sale · Contact · Related Offer · Amount · Status with bulk selection
// and View/Report/Delete row actions, tabs Overview / Items / Payments / Checklists /
// Documents / Activity, Convert-to-Service-Order via the service-items banner with
// priority + start/target dates + per-item installation. No stock-guard modal — that
// does not exist in the real app. English captions live inline; FR translations by
// index sit in salesDemoTranslations.ts.

export type SalesDemoPage = 'list' | 'create' | 'detail';

export interface SalesDemoState {
  page: SalesDemoPage;
  selectedStat: 'all' | 'in_progress' | 'closed';
  searchActive: boolean;
  showFilters: boolean;
  listView: 'list' | 'table';
  showMap: boolean;
  bulkSelected: boolean;
  rowActionsOpen: boolean;
  createStep: number;          // 0..4
  activeTab: 'overview' | 'items' | 'payments' | 'checklists' | 'documents' | 'activity';
  statusStage: number;         // 0=created,1=in_progress,2=invoiced,3=closed
  showBranch: boolean;         // highlight partially_invoiced / cancelled branches
  sendOpen: boolean;
  pdfOpen: boolean;
  pdfSettings: boolean;
  convertOpen: boolean;
  convertItemInstall: boolean; // per-item installation section highlighted
}

export const initialSalesDemoState: SalesDemoState = {
  page: 'list',
  selectedStat: 'all',
  searchActive: false,
  showFilters: false,
  listView: 'table',
  showMap: false,
  bulkSelected: false,
  rowActionsOpen: false,
  createStep: 0,
  activeTab: 'overview',
  statusStage: 0,
  showBranch: false,
  sendOpen: false,
  pdfOpen: false,
  pdfSettings: false,
  convertOpen: false,
  convertItemInstall: false,
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
  // ── 1 · Overview ───────────────────────────────────────────────────────────
  {
    target: 'sa-demo-title',
    caption:
      'Welcome to Sales — where accepted offers turn into revenue. Track every deal from creation through invoicing to closed, and hand fieldwork straight to your technicians as a service order.',
    duration: 5400,
    apply: pure(() => ({
      page: 'list', selectedStat: 'all', searchActive: false, showFilters: false,
      listView: 'table', showMap: false, bulkSelected: false, rowActionsOpen: false,
    })),
  },
  {
    target: 'sa-demo-stat-total',
    caption:
      'Four KPI cards give you the state of the business at a glance, and each one filters the list. Total Sales counts every deal you have recorded.',
    duration: 4600,
    apply: pure(() => ({ selectedStat: 'all' })),
  },
  {
    target: 'sa-demo-stat-inprogress',
    caption:
      'In Progress is the work in flight — sales that have been moved past Created and are on their way to being invoiced.',
    duration: 4400,
    apply: pure(() => ({ selectedStat: 'in_progress' })),
  },
  {
    target: 'sa-demo-stat-closed',
    caption:
      'Closed groups everything that has completed the cycle — invoiced, partially invoiced, or fully closed — so you always know what has landed versus what is still open.',
    duration: 4800,
    apply: pure(() => ({ selectedStat: 'closed' })),
  },
  {
    target: 'sa-demo-stat-value',
    caption:
      'And Total Value is the headline — the worth of the currently filtered sales in your currency, updating live as you slice the list.',
    duration: 4600,
    apply: pure(() => ({ selectedStat: 'all' })),
  },
  {
    target: 'sa-demo-table',
    caption:
      'The sales table shows every deal with its title and number, contact and company, related offer, amount including TVA, and status — colour-coded so you instantly see what is created, in progress, invoiced, or closed. Click a row to open it.',
    duration: 5800,
    apply: pure(() => ({})),
  },

  // ── 2 · Filters & Views ────────────────────────────────────────────────────
  {
    target: 'sa-demo-search',
    caption:
      'Search runs across titles, sale numbers, contact names and companies — find any deal in seconds.',
    duration: 4200,
    apply: pure(() => ({ searchActive: true })),
  },
  {
    target: 'sa-demo-filters',
    caption:
      'Filters refine by status, priority, stage and assignee — surface the urgent sales that need invoicing today.',
    duration: 4600,
    apply: pure(() => ({ searchActive: false, showFilters: true })),
  },
  {
    target: 'sa-demo-views',
    caption:
      'See your sales two ways — a dense Table for scanning, or a roomy List for detail — pick the view that fits the task.',
    duration: 4400,
    apply: pure(() => ({ showFilters: false })),
  },
  {
    target: 'sa-demo-map',
    caption:
      'Every sale carries its customer’s location, so a Map view plots them geographically — handy for planning deliveries and regional analysis.',
    duration: 4600,
    apply: pure(() => ({ showMap: true })),
  },

  // ── 3 · Bulk & row actions ─────────────────────────────────────────────────
  {
    target: 'sa-demo-bulk',
    caption:
      'Tick the boxes to select several sales and act on them together — the bulk bar keeps count and lets you delete the whole selection in one confirmed step, with a live progress meter.',
    duration: 5600,
    apply: pure(() => ({ showMap: false, bulkSelected: true })),
  },
  {
    target: 'sa-demo-row-actions',
    caption:
      'Every row has its own quick menu — View the sale, open its printable Report in a new tab, or Delete it. Everything else lives inside the sale.',
    duration: 4800,
    apply: pure(() => ({ bulkSelected: false, rowActionsOpen: true })),
  },

  // ── 4 · Raise a sale ───────────────────────────────────────────────────────
  {
    target: 'sa-demo-create-open',
    caption:
      'Most sales arrive automatically from an accepted offer — but you can also raise one directly. New Sale opens a guided form.',
    duration: 4400,
    apply: pure(() => ({ page: 'create', rowActionsOpen: false, createStep: 0 })),
  },
  {
    target: 'sa-demo-create-customer',
    caption:
      'Pick the customer and their fiscal details auto-fill — including the Matricule Fiscale required for a compliant invoice.',
    duration: 4600,
    apply: pure(() => ({ createStep: 1 })),
  },
  {
    target: 'sa-demo-create-items',
    caption:
      'Add line items from your catalog — products and services together — each with quantity, price and optional discount, exactly as on the offer.',
    duration: 5000,
    apply: pure(() => ({ createStep: 2 })),
  },
  {
    target: 'sa-demo-create-totals',
    caption:
      'Totals compute live in the fiscally compliant order — subtotal, discount, TVA on the discounted amount, shipping and the fiscal stamp — accurate to the millime.',
    duration: 5200,
    apply: pure(() => ({ createStep: 3 })),
  },
  {
    target: 'sa-demo-create-meta',
    caption:
      'Set a delivery date and a priority — high, urgent, medium or low — so your team knows where to focus.',
    duration: 4600,
    apply: pure(() => ({ createStep: 4 })),
  },
  {
    target: 'sa-demo-create-save',
    caption:
      'Save, and the sale enters your fulfilment pipeline — counted in the KPIs and ready to invoice.',
    duration: 4000,
    apply: pure(() => ({})),
  },

  // ── 5 · Detail & status ────────────────────────────────────────────────────
  {
    target: 'sa-demo-detail-header',
    caption:
      'The sale detail is its home — editable number, customer, amount, and the four header actions: Edit, Send invoice, Download PDF and Delete.',
    duration: 5000,
    apply: pure(() => ({ page: 'detail', activeTab: 'overview', statusStage: 0, showBranch: false })),
  },
  {
    target: 'sa-demo-status',
    caption:
      'The status flow walks the sale from Created to In Progress to Invoiced to Closed — one click per step, fully tracked in the activity log.',
    duration: 5200,
    apply: pure(() => ({ statusStage: 2 })),
  },
  {
    target: 'sa-demo-status-branch',
    caption:
      'And there are branches when the deal does not go straight — Partially Invoiced for staged billing, and Cancelled when a sale is called off. The pipeline handles them without breaking the flow.',
    duration: 5400,
    apply: pure(() => ({ showBranch: true })),
  },

  // ── 6 · Sale workspace tabs ────────────────────────────────────────────────
  {
    target: 'sa-demo-tab-items',
    caption:
      'The Items tab lists every line with its totals — adjust quantities and pricing before the sale is invoiced.',
    duration: 4400,
    apply: pure(() => ({ showBranch: false, activeTab: 'items' })),
  },
  {
    target: 'sa-demo-tab-payments',
    caption:
      'Payments live right on the sale — record cash, cheque, bank transfer or card with reference, date and amount. Flowentra rolls up the balance and marks the sale paid, partly paid or overdue, so accounts receivable is always current.',
    duration: 6200,
    apply: pure(() => ({ activeTab: 'payments' })),
  },
  {
    target: 'sa-demo-tab-checklists',
    caption:
      'Checklists drive fulfilment — confirm stock, schedule delivery, collect the signed delivery note. And a checklist on a service line carries over from the offer and follows to the service-order job and the dispatch, so the technician gets the right steps per job.',
    duration: 6200,
    apply: pure(() => ({ activeTab: 'checklists' })),
  },
  {
    target: 'sa-demo-tab-documents',
    caption:
      'Documents and attachments stay with the sale — the signed quote, delivery notes, proof of payment — the full paper trail in one place.',
    duration: 4600,
    apply: pure(() => ({ activeTab: 'documents' })),
  },
  {
    target: 'sa-demo-tab-activity',
    caption:
      'And the Activity tab is the complete timeline — created, status changed, invoice sent, payment received, converted — an immutable history of the whole transaction.',
    duration: 4800,
    apply: pure(() => ({ activeTab: 'activity' })),
  },

  // ── 7 · Invoice & PDF ──────────────────────────────────────────────────────
  {
    target: 'sa-demo-send',
    caption:
      'Send the invoice by email in a click — Flowentra attaches the PDF, records the send, and can advance the status to Invoiced automatically.',
    duration: 4800,
    apply: pure(() => ({ activeTab: 'overview', sendOpen: true })),
  },
  {
    target: 'sa-demo-pdf',
    caption:
      'The generated invoice is a polished, fiscally compliant document — your logo and Matricule Fiscale, the customer block, itemised lines, TVA, fiscal stamp and the amount due.',
    duration: 5200,
    apply: pure(() => ({ sendOpen: false, pdfOpen: true })),
  },
  {
    target: 'sa-demo-pdf-settings',
    caption:
      'And the layout is yours — a studio for colours, typography, layout and the fields shown, so every invoice carries your brand and meets the rules.',
    duration: 5000,
    apply: pure(() => ({ pdfSettings: true })),
  },
  {
    target: 'sa-demo-pdf-download',
    caption:
      'Download, print or email it — the same compliant invoice every time, with TVA and fiscal stamp computed automatically.',
    duration: 4400,
    apply: pure(() => ({ pdfSettings: false })),
  },

  // ── 8 · Convert to Service Order ───────────────────────────────────────────
  {
    target: 'sa-demo-so-banner',
    caption:
      'When a sale includes services, a banner appears on the detail page — with a single click you can convert to a Service Order, or skip and keep the sale in Sales only.',
    duration: 5400,
    apply: pure(() => ({ pdfOpen: false, activeTab: 'overview', convertOpen: true })),
  },
  {
    target: 'sa-demo-convert-options',
    caption:
      'Configure the service order in one step — notes, priority, planned start and target dates. It lands in Planning, ready to dispatch.',
    duration: 5400,
    apply: pure(() => ({})),
  },
  {
    target: 'sa-demo-per-item-install',
    caption:
      'Each service line can target a different installation — one for the compressor in Cold Room 3, another for the split unit in the lobby — so the technician goes to exactly the right place. Nothing typed twice.',
    duration: 5800,
    apply: pure(() => ({ convertItemInstall: true })),
  },

  // ── 9 · Wrap-up ────────────────────────────────────────────────────────────
  {
    target: 'sa-demo-title',
    caption:
      'That is Sales end to end — filterable KPIs, bulk actions, compliant invoices, payments and reconciliation, branded PDFs, and a one-click bridge to your field team.',
    duration: 5400,
    apply: pure(() => ({ page: 'list', convertOpen: false, convertItemInstall: false, selectedStat: 'all' })),
  },
  {
    target: 'sa-demo-stat-value',
    caption:
      'Offers flow into sales, sales into invoices and service orders, and every dinar is tracked. Record your first sale and close the loop from quote to cash to delivery.',
    duration: 5200,
    apply: pure(() => ({})),
  },
];

export const SA_CHAPTERS: SalesDemoChapter[] = [
  { id: 'overview', title: 'Overview',         start: 0,  end: 6  },
  { id: 'controls', title: 'Filters & Views',  start: 6,  end: 10 },
  { id: 'bulk',     title: 'Bulk & Actions',   start: 10, end: 12 },
  { id: 'create',   title: 'Raise a Sale',     start: 12, end: 18 },
  { id: 'detail',   title: 'Detail & Status',  start: 18, end: 21 },
  { id: 'tabs',     title: 'Sale Workspace',   start: 21, end: 26 },
  { id: 'pdf',      title: 'Invoice & PDF',    start: 26, end: 30 },
  { id: 'convert',  title: 'To Service Order', start: 30, end: 33 },
  { id: 'wrapup',   title: 'Wrap-up',          start: 33, end: SA_STEPS.length },
];

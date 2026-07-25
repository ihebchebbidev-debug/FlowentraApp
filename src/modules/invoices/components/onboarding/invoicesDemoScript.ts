// Invoices module autopilot demo.
// Scripted state transitions, virtual cursor, and EN/FR narration.
// English captions live inline here; translations in invoicesDemoTranslations.ts
// (must stay INV_STEPS.length long, same order).

export type InvoicesDemoPage = 'list' | 'create' | 'detail';

export interface InvoicesDemoState {
  page: InvoicesDemoPage;
  // List
  selectedStat: 'all' | 'posted' | 'paid' | 'overdue';
  searchActive: boolean;
  showFilters: boolean;
  listView: 'list' | 'table';
  // Create-from-sale dialog
  createStep: number; // 0=closed, 1=open, 2=sale picked, 3=confirmed
  // Detail
  activeTab: 'lines' | 'payments' | 'activity';
  statusStage: number; // 0=draft, 1=posted, 2=paid
  memoOpen: null | 'post' | 'void' | 'mark-paid' | 'reopen';
  memoText: string;
  pdfOpen: boolean;
}

export const initialInvoicesDemoState: InvoicesDemoState = {
  page: 'list',
  selectedStat: 'all',
  searchActive: false,
  showFilters: false,
  listView: 'table',
  createStep: 0,
  activeTab: 'lines',
  statusStage: 0,
  memoOpen: null,
  memoText: '',
  pdfOpen: false,
};

export interface InvoicesDemoStep {
  target: string;
  caption: string;
  duration: number;
  apply: (s: InvoicesDemoState) => InvoicesDemoState;
}
export interface InvoicesDemoChapter { id: string; title: string; start: number; end: number; }

const pure =
  (apply: (s: InvoicesDemoState) => Partial<InvoicesDemoState>) =>
  (s: InvoicesDemoState): InvoicesDemoState => ({ ...s, ...apply(s) });

export const INV_STEPS: InvoicesDemoStep[] = [
  // ── Chapter 1 · Overview & KPIs ───────────────────────────────────────────
  {
    target: 'inv-demo-title',
    caption:
      'This is Invoices — the money side of every sale. See what is billed, what is paid, and what is still owed, all in one place.',
    duration: 5000,
    apply: pure(() => ({
      page: 'list' as const, selectedStat: 'all' as const, searchActive: false,
      showFilters: false, listView: 'table' as const, createStep: 0, pdfOpen: false, memoOpen: null,
    })),
  },
  {
    target: 'inv-demo-stat-invoiced',
    caption:
      'Total Invoiced is every posted or paid invoice added up — the money you have actually billed your customers.',
    duration: 4600,
    apply: pure(() => ({ selectedStat: 'all' as const })),
  },
  {
    target: 'inv-demo-stat-outstanding',
    caption:
      'Outstanding is what is still owed — posted and overdue invoices minus what has been paid. This is your active receivables number.',
    duration: 5000,
    apply: pure(() => ({ selectedStat: 'posted' as const })),
  },
  {
    target: 'inv-demo-stat-paid',
    caption:
      'Paid shows the settled amount — every invoice fully collected. Click any KPI to filter the list underneath.',
    duration: 4600,
    apply: pure(() => ({ selectedStat: 'paid' as const })),
  },
  {
    target: 'inv-demo-stat-overdue',
    caption:
      'Overdue counts invoices past their due date and still not paid — the ones your team should chase first.',
    duration: 4600,
    apply: pure(() => ({ selectedStat: 'overdue' as const })),
  },

  // ── Chapter 2 · Search, filters, views ────────────────────────────────────
  {
    target: 'inv-demo-search',
    caption:
      'Search by invoice number, title or notes — find any invoice in a couple of keystrokes.',
    duration: 4200,
    apply: pure(() => ({ selectedStat: 'all' as const, searchActive: true })),
  },
  {
    target: 'inv-demo-filters',
    caption:
      'Filters refine by status and date range — build the exact view you need for a chase list or a monthly review.',
    duration: 4400,
    apply: pure(() => ({ searchActive: false, showFilters: true })),
  },
  {
    target: 'inv-demo-views',
    caption:
      'Two ways to look at the same data — a dense Table for scanning, or a roomier List that reads like a feed.',
    duration: 4200,
    apply: pure(() => ({ showFilters: false })),
  },

  // ── Chapter 3 · Create from sale ──────────────────────────────────────────
  {
    target: 'inv-demo-new-from-sale',
    caption:
      'Every invoice is born from a sale — that keeps the audit trail tight. New from sale opens the picker.',
    duration: 4400,
    apply: pure(() => ({ createStep: 1 })),
  },
  {
    target: 'inv-demo-pick-sale',
    caption:
      'Pick any eligible sale and its lines, customer and totals are snapshotted straight into a draft invoice.',
    duration: 4600,
    apply: pure(() => ({ createStep: 2 })),
  },
  {
    target: 'inv-demo-confirm-create',
    caption:
      'Confirm, and the draft is created — same items, same taxes, ready to review before you post.',
    duration: 4200,
    apply: pure(() => ({ createStep: 3 })),
  },

  // ── Chapter 4 · Detail, status, tabs ──────────────────────────────────────
  {
    target: 'inv-demo-detail-header',
    caption:
      'The invoice detail is the home of the document — number, customer, linked sale, and the actions you use most.',
    duration: 4600,
    apply: pure(() => ({ page: 'detail' as const, createStep: 0, activeTab: 'lines' as const, statusStage: 0 })),
  },
  {
    target: 'inv-demo-status-badge',
    caption:
      'The status is one-way — Draft becomes Posted becomes Paid, with Void as a confirmed branch. Nothing changes state by accident.',
    duration: 5000,
    apply: pure(() => ({ statusStage: 1 })),
  },
  {
    target: 'inv-demo-lines',
    caption:
      'The lines table shows exactly what is being billed — quantity, unit price, tax rate and totals for each item.',
    duration: 4200,
    apply: pure(() => ({ activeTab: 'lines' as const })),
  },
  {
    target: 'inv-demo-summary',
    caption:
      'The summary card breaks down subtotal, tax, total, paid and amount due — always current, always in the invoice currency.',
    duration: 4600,
    apply: pure(() => ({})),
  },
  {
    target: 'inv-demo-tab-payments',
    caption:
      'Payments tracks every settlement against the invoice, and updates the Paid and Amount Due totals automatically.',
    duration: 4600,
    apply: pure(() => ({ activeTab: 'payments' as const })),
  },
  {
    target: 'inv-demo-tab-activity',
    caption:
      'Activity is the full audit trail — every post, void, mark-paid and reopen, with who did it, when, and the memo they left.',
    duration: 5000,
    apply: pure(() => ({ activeTab: 'activity' as const })),
  },

  // ── Chapter 5 · Post / mark-paid / void with memo ─────────────────────────
  {
    target: 'inv-demo-action-post',
    caption:
      'Post assigns the official invoice number and freezes the totals — from here on the invoice is a real accounting document.',
    duration: 4600,
    apply: pure(() => ({ activeTab: 'lines' as const, statusStage: 1 })),
  },
  {
    target: 'inv-demo-memo',
    caption:
      'Mark-as-paid, Void and Reopen each require a memo — the reason is persisted to the audit trail so you always know why the status changed.',
    duration: 5400,
    apply: pure(() => ({ activeTab: 'payments' as const, memoOpen: 'mark-paid' as const, memoText: 'Cash received in full at counter.' })),
  },
  {
    target: 'inv-demo-memo-confirm',
    caption:
      'Confirm, and the invoice flips to Paid, a manual-marked-paid entry lands in Activity, and the Paid KPI moves up.',
    duration: 4600,
    apply: pure(() => ({ memoOpen: null, statusStage: 2, activeTab: 'activity' as const })),
  },

  // ── Chapter 6 · PDF & wrap-up ─────────────────────────────────────────────
  {
    target: 'inv-demo-pdf',
    caption:
      'Download PDF exports a branded document — header, customer block, lines, totals and a dedicated payment summary — matching your offers and sales PDFs pixel-for-pixel.',
    duration: 5600,
    apply: pure(() => ({ pdfOpen: true })),
  },
  {
    target: 'inv-demo-pdf-download',
    caption:
      'Send it, print it, share it — the same crisp document every time, with paid and due amounts computed to the millime.',
    duration: 4400,
    apply: pure(() => ({})),
  },
  {
    target: 'inv-demo-title',
    caption:
      'That is Invoices end-to-end — KPI-driven receivables, snapshotted drafts from every sale, a one-way status flow with audited memos, and a branded PDF ready to send. Start invoicing your first sale.',
    duration: 6000,
    apply: pure(() => ({ pdfOpen: false, page: 'list' as const, selectedStat: 'all' as const })),
  },
];

export const INV_CHAPTERS: InvoicesDemoChapter[] = [
  { id: 'overview',  title: 'Overview & KPIs',   start: 0,  end: 5  },
  { id: 'controls',  title: 'Search & Views',    start: 5,  end: 8  },
  { id: 'create',    title: 'Create from Sale',  start: 8,  end: 11 },
  { id: 'detail',    title: 'Detail & Tabs',     start: 11, end: 17 },
  { id: 'actions',   title: 'Post / Paid / Void', start: 17, end: 20 },
  { id: 'pdf',       title: 'PDF & Wrap-up',     start: 20, end: INV_STEPS.length },
];

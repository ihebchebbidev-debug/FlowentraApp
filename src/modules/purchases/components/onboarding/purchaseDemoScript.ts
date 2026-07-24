// Purchases module autopilot demo — 16 chapters, 81 steps.
// Bonus chapters added (Article-Suppliers, PDF preview, TEJ XML preview with real
// XML content, payment + Facture-en-Ligne workflow, Price Evolution, Invoice Aging)
// to bring 100% feature coverage of the live module.

export type PurchaseDemoPage =
  | 'dashboard'
  | 'orders-list'
  | 'order-create'
  | 'order-detail'
  | 'order-pdf-preview'
  | 'order-tej-xml'
  | 'article-suppliers'
  | 'receipts-list'
  | 'receipt-create'
  | 'receipt-detail'
  | 'invoices-list'
  | 'invoice-create'
  | 'invoice-detail'
  | 'invoice-payment'
  | 'invoice-tej-xml'
  | 'compliance'
  | 'rs-catalogue'
  | 'reports'
  | 'supplier-performance'
  | 'price-evolution'
  | 'invoice-aging'
  | 'audit-log';

export interface PurchaseDemoState {
  page: PurchaseDemoPage;
  activeTab: string;
  statusFilter: string;
  paymentFilter: string;
  viewMode: 'table' | 'list';
  showFilters: boolean;
  selectedRowIds: string[];
  createFormStep: number;
  highlightedStatKey: string | null;
  reportSection: string;
  // Sub-state for new chapters
  xmlHighlightLine: number | null;
  paymentStep: number; // 0=closed, 1=open, 2=confirmed
  felSent: boolean;
  highlightedSupplierId: string | null;
}

export const initialPurchaseDemoState: PurchaseDemoState = {
  page: 'dashboard',
  activeTab: 'overview',
  statusFilter: 'all',
  paymentFilter: 'all',
  viewMode: 'table',
  showFilters: false,
  selectedRowIds: [],
  createFormStep: 0,
  highlightedStatKey: null,
  reportSection: 'overview',
  xmlHighlightLine: null,
  paymentStep: 0,
  felSent: false,
  highlightedSupplierId: null,
};

export interface PurchaseDemoStep {
  target: string;
  caption: string;
  duration: number;
  apply: (s: PurchaseDemoState) => PurchaseDemoState;
}

export interface PurchaseDemoChapter {
  id: string;
  title: string;
  start: number;
  end: number;
}

const pure =
  (apply: (s: PurchaseDemoState) => Partial<PurchaseDemoState>) =>
  (s: PurchaseDemoState): PurchaseDemoState => ({ ...s, ...apply(s) });

export const PO_STEPS: PurchaseDemoStep[] = [
  // ── Chapter 1 · Dashboard ─────────────────────────────────────────────────
  {
    target: 'po-demo-title',
    caption:
      'Welcome to the Purchases module — your complete procurement control centre. Manage purchase orders, goods receipts, supplier invoices, compliance, and analytics all in one place.',
    duration: 5500,
    apply: pure(() => ({ page: 'dashboard' as const })),
  },
  {
    target: 'po-demo-stat-orders',
    caption:
      'Four KPI cards sit at the top: Total Purchase Orders, Pending Receipts awaiting warehouse delivery, Open Invoices that still need payment, and your total spend this month.',
    duration: 5000,
    apply: pure(() => ({})),
  },
  {
    target: 'po-demo-recent-orders',
    caption:
      'The Recent Orders table shows your five latest purchase orders — order number, supplier name, colour-coded status badge, and grand total. Click any row to open the full detail page.',
    duration: 4800,
    apply: pure(() => ({})),
  },
  {
    target: 'po-demo-pending-receipts',
    caption:
      'The Pending Receipts panel surfaces every PO in "Ordered" or "Partially Received" status, sorted by expected delivery date so you never miss a warehouse window.',
    duration: 5000,
    apply: pure(() => ({})),
  },
  {
    target: 'po-demo-quick-links',
    caption:
      'Quick-access buttons jump directly to Compliance, Reports, Audit Log, and the Suppliers directory (which lives in the Contacts module) — the four most-visited destinations outside the core document flow.',
    duration: 4000,
    apply: pure(() => ({})),
  },


  // ── Chapter 2 · Purchase Orders list ─────────────────────────────────────
  {
    target: 'po-demo-nav-orders',
    caption:
      'Navigating to Purchase Orders shows every PO in your account with real-time stats, powerful filters, and bulk-action support — all without leaving the page.',
    duration: 4500,
    apply: pure(() => ({
      page: 'orders-list' as const,
      statusFilter: 'all',
      paymentFilter: 'all',
      highlightedStatKey: null,
      showFilters: false,
      selectedRowIds: [],
      viewMode: 'table' as const,
    })),
  },
  {
    target: 'po-demo-stat-open',
    caption:
      'The interactive stat cards act as filters. Clicking "Open" instantly narrows the list to orders still in draft, validated, ordered, or partially-received state.',
    duration: 4800,
    apply: pure(() => ({ highlightedStatKey: 'open', statusFilter: 'open' })),
  },
  {
    target: 'po-demo-search',
    caption:
      'The search bar performs live full-text search across order numbers, supplier names, and notes — results update as you type, debounced to avoid unnecessary API calls.',
    duration: 4200,
    apply: pure(() => ({ statusFilter: 'all', highlightedStatKey: null })),
  },
  {
    target: 'po-demo-filter-btn',
    caption:
      'The Filters panel adds a status dropdown and a payment-status filter. Combine "Ordered" with "Unpaid" to immediately see everything that needs urgent follow-up.',
    duration: 5000,
    apply: pure(() => ({ showFilters: true })),
  },
  {
    target: 'po-demo-view-toggle',
    caption:
      'Toggle between Table view for dense data scanning and List (card) view for a mobile-friendly layout. Your preferred view is saved automatically.',
    duration: 4000,
    apply: pure(() => ({ viewMode: 'list' as const, showFilters: false })),
  },
  {
    target: 'po-demo-row-check',
    caption:
      'Tick individual rows or the header checkbox to select all. The Bulk Action bar appears immediately, letting you delete several draft orders in a single operation with full optimistic rollback.',
    duration: 4800,
    apply: pure(() => ({ viewMode: 'table' as const, selectedRowIds: ['po-042', 'po-043'] })),
  },
  {
    target: 'po-demo-export-btn',
    caption:
      'The Export button opens a modal where you pick exactly which columns to include — order number, supplier, status, totals, notes — and download as CSV or Excel for finance reporting.',
    duration: 4500,
    apply: pure(() => ({ selectedRowIds: [] })),
  },

  // ── Chapter 3 · Create purchase order ────────────────────────────────────
  {
    target: 'po-demo-new-btn',
    caption:
      'Clicking New Order opens the purchase order creation form. A clean, single-page layout guides you from supplier selection through line items to final totals.',
    duration: 4200,
    apply: pure(() => ({ page: 'order-create' as const, createFormStep: 0 })),
  },
  {
    target: 'po-demo-create-supplier',
    caption:
      'Select the supplier from a searchable dropdown backed by your Suppliers directory. Choosing a supplier auto-fills their default currency and payment terms.',
    duration: 4800,
    apply: pure(() => ({ createFormStep: 0 })),
  },
  {
    target: 'po-demo-create-dates',
    caption:
      'Set the Order Date and Expected Delivery Date. These feed the Pending Receipts panel and trigger overdue alerts if the warehouse has not confirmed receipt by the deadline.',
    duration: 4500,
    apply: pure(() => ({ createFormStep: 1 })),
  },
  {
    target: 'po-demo-create-items',
    caption:
      'Add line items by picking from your Article catalog or typing a free-text description. Each line has quantity, unit, unit price, discount, and tax rate — the grand total recalculates instantly.',
    duration: 5000,
    apply: pure(() => ({ createFormStep: 2 })),
  },
  {
    target: 'po-demo-create-totals',
    caption:
      'The financial summary shows subtotal, tax amount, and grand total in the order\'s currency. Add internal notes or a supplier reference before committing.',
    duration: 4500,
    apply: pure(() => ({ createFormStep: 3 })),
  },
  {
    target: 'po-demo-create-save',
    caption:
      'Save as Draft stores the PO without locking it — you can still edit items freely. Click Validate to advance it to "Validated" status and lock the line items for ordering.',
    duration: 4200,
    apply: pure(() => ({})),
  },

  // ── Chapter 4 · Purchase order detail ────────────────────────────────────
  {
    target: 'po-demo-detail-header',
    caption:
      'The Purchase Order detail page displays the order number, supplier name, order date, expected delivery, currency, and a colour-coded status badge — all in the header.',
    duration: 4500,
    apply: pure(() => ({ page: 'order-detail' as const, activeTab: 'overview' })),
  },
  {
    target: 'po-demo-status-flow',
    caption:
      'The status progress bar shows every stage of the lifecycle: Draft → Validated → Ordered → Partially Received → Received → Closed. Click a stage button to advance the PO in one action.',
    duration: 5200,
    apply: pure(() => ({})),
  },
  {
    target: 'po-demo-detail-items',
    caption:
      'The Overview tab lists every line item with article reference, description, quantity, unit price, discount, tax rate, and line total. Draft orders allow inline item editing.',
    duration: 5000,
    apply: pure(() => ({})),
  },
  {
    target: 'po-demo-detail-financial',
    caption:
      'Below the items the financial summary breaks down subtotal, tax, and grand total. The supplier info card shows billing address, contact details, and payment terms.',
    duration: 5000,
    apply: pure(() => ({})),
  },
  {
    target: 'po-demo-tab-receipts',
    caption:
      'The Receipts tab lists all Goods Receipts linked to this PO — delivery date, items received, quantities, and whether the delivery was partial or complete.',
    duration: 5000,
    apply: pure(() => ({ activeTab: 'receipts' })),
  },
  {
    target: 'po-demo-tab-invoices',
    caption:
      'The Invoices tab shows every Supplier Invoice issued against this PO with amounts, payment status, and RS (withholding tax) details — giving you a complete three-way match view.',
    duration: 4800,
    apply: pure(() => ({ activeTab: 'invoices' })),
  },
  {
    target: 'po-demo-tab-activity',
    caption:
      'The Activity tab is a full immutable audit trail: every status change, item edit, and document action is logged with a timestamp and the name of the user who performed it.',
    duration: 4800,
    apply: pure(() => ({ activeTab: 'activity' })),
  },
  {
    target: 'po-demo-btn-pdf',
    caption:
      'The PDF button generates a professional purchase order document. Let me show you the live preview now — your company logo, line items, totals, and supplier block are all auto-composed.',
    duration: 4500,
    apply: pure(() => ({ activeTab: 'overview' })),
  },

  // ── Chapter 5 · PO PDF preview ───────────────────────────────────────────
  {
    target: 'po-demo-pdf-doc',
    caption:
      'Here is a preview of the generated PDF. The header carries your company branding, fiscal identity, and contact block. The supplier "Bill To" panel mirrors it on the right.',
    duration: 5200,
    apply: pure(() => ({ page: 'order-pdf-preview' as const })),
  },
  {
    target: 'po-demo-pdf-items',
    caption:
      'The line-items table shows each article with description, quantity, unit price, discount, tax, and line total — formatted exactly as you would send to the supplier by email.',
    duration: 5000,
    apply: pure(() => ({})),
  },
  {
    target: 'po-demo-pdf-totals',
    caption:
      'The totals block sums subtotal, discount, tax, fiscal stamp, and grand total. Notes and payment terms appear at the bottom. Two clicks: download as PDF or send straight to the supplier.',
    duration: 5200,
    apply: pure(() => ({})),
  },

  // ── Chapter 6 · PO TEJ XML preview ───────────────────────────────────────
  {
    target: 'po-demo-btn-tej',
    caption:
      'Back on the order detail, the TEJ XML button exports the matching withholding-tax certificates in the official Tunisian e-invoicing standard. Let me open the live preview.',
    duration: 4800,
    apply: pure(() => ({ page: 'order-detail' as const, activeTab: 'overview' })),
  },
  {
    target: 'po-demo-tej-xml-header',
    caption:
      'Here is exactly what the downloaded file contains — schema v1.0, UTF-8 without BOM (TEJ rejects BOM). The Declarant block carries your matricule fiscal, raison sociale, and contact info.',
    duration: 6000,
    apply: pure(() => ({ page: 'order-tej-xml' as const, xmlHighlightLine: 4 })),
  },
  {
    target: 'po-demo-tej-xml-refdecl',
    caption:
      'The ReferenceDeclaration block anchors the file to a fiscal period — ActeDepot (0 = initial, 1 = corrective), AnneeDepot and MoisDepot. TEJ groups every certificate under one monthly deposit so you file once per period.',
    duration: 5500,
    apply: pure(() => ({ xmlHighlightLine: 16 })),
  },
  {
    target: 'po-demo-tej-xml-cert',
    caption:
      'Each Certificat carries the operation code (RS1_xxxxxx), the beneficiary supplier with their MF, the invoice reference, payment date, and every amount in millimes — HT, TVA, RS rate, and net servi.',
    duration: 6200,
    apply: pure(() => ({ xmlHighlightLine: 15 })),
  },
  {
    target: 'po-demo-tej-xml-facture',
    caption:
      'Inside every Certificat sits a Facture sub-element — invoice number, invoice date, payment date, MontantHT, MontantTVA, TauxRS (500 = 5.00%), MontantRS and MontantNetServi. Every monetary field is an integer in millimes.',
    duration: 6200,
    apply: pure(() => ({ xmlHighlightLine: 33 })),
  },
  {
    target: 'po-demo-tej-xml-totals',
    caption:
      'The trailing Total* elements — TotalMontantHT, TotalMontantTVA, TotalMontantRS, TotalMontantNetServi — are auto-summed across every Certificat and cross-checked before download so an out-of-balance file never reaches the DGI.',
    duration: 5800,
    apply: pure(() => ({ xmlHighlightLine: 45 })),
  },
  {
    target: 'po-demo-tej-xml-download',
    caption:
      'Before generating, Flowentra validates every mandatory TEJ field. If anything is missing the request returns a structured 400 with the exact field list — no broken submissions reach the DGI portal.',
    duration: 5500,
    apply: pure(() => ({ xmlHighlightLine: null })),
  },

  // ── Chapter 7 · Article-Suppliers (multi-source sourcing) ────────────────
  {
    target: 'po-demo-as-title',
    caption:
      'Every Article can be sourced from multiple suppliers. The Article-Suppliers panel — reached from an Article\'s detail page in the Articles module — lists each vendor with their reference, purchase price, MOQ, lead time, and a "preferred" star. Purchases uses it to power the last-price hint you saw in the PO builder.',
    duration: 5200,
    apply: pure(() => ({ page: 'article-suppliers' as const, highlightedSupplierId: null })),
  },
  {
    target: 'po-demo-as-preferred',
    caption:
      'Marking a supplier as preferred is atomic — Flowentra demotes every other supplier for this article in a single transaction, so you always have exactly one preferred source.',
    duration: 5000,
    apply: pure(() => ({ highlightedSupplierId: 'sup-2' })),
  },
  {
    target: 'po-demo-as-price-history',
    caption:
      'Every price change is captured as an immutable history row — old price, new price, who changed it, when, and an optional reason. The chart visualises drift over time so you spot rising costs early.',
    duration: 5500,
    apply: pure(() => ({})),
  },
  {
    target: 'po-demo-as-quick-po',
    caption:
      'A single click on a supplier launches a new Purchase Order pre-filled with that vendor, their supplier-ref, and the negotiated price — sourcing decisions become procurement actions in seconds.',
    duration: 4800,
    apply: pure(() => ({ highlightedSupplierId: null })),
  },

  // ── Chapter 8 · Goods receipts ────────────────────────────────────────────
  {
    target: 'po-demo-nav-receipts',
    caption:
      'Goods Receipts record what was physically delivered to your warehouse. The list shows every inbound delivery with its linked PO, supplier, date, and delivery status.',
    duration: 4500,
    apply: pure(() => ({ page: 'receipts-list' as const, activeTab: 'overview' })),
  },
  {
    target: 'po-demo-gr-status-badges',
    caption:
      'Receipt statuses: Partial (amber) means only some items arrived, Complete (green) confirms full delivery, and Rejected (red) means the goods were refused on inspection.',
    duration: 5000,
    apply: pure(() => ({})),
  },
  {
    target: 'po-demo-gr-create',
    caption:
      'Creating a Goods Receipt links it to the originating PO. Enter the actual received quantities per line — the system automatically computes partial versus complete status and updates the PO.',
    duration: 5000,
    apply: pure(() => ({ page: 'receipt-create' as const })),
  },
  {
    target: 'po-demo-gr-detail',
    caption:
      'The receipt detail page shows received items, ordered versus received quantities per line, the linked purchase order, warehouse location, and the confirming user.',
    duration: 4800,
    apply: pure(() => ({ page: 'receipt-detail' as const })),
  },
  {
    target: 'po-demo-gr-edit',
    caption:
      'Goods Receipts can be edited after creation — useful for correcting quantity errors before the invoice is matched. Every edit is captured in the audit log and reverses stock movements automatically.',
    duration: 4800,
    apply: pure(() => ({})),
  },

  // ── Chapter 9 · Supplier invoices ─────────────────────────────────────────
  {
    target: 'po-demo-nav-invoices',
    caption:
      'Supplier Invoices track every amount you owe. The list shows invoice number, supplier, linked PO, total, payment status, and Tunisian compliance flags at a glance.',
    duration: 4800,
    apply: pure(() => ({ page: 'invoices-list' as const })),
  },
  {
    target: 'po-demo-si-status-badges',
    caption:
      'Invoice statuses follow the payment lifecycle: Draft → Pending → Partially Paid → Paid. Overdue invoices are highlighted with an alert indicator for immediate attention.',
    duration: 4800,
    apply: pure(() => ({})),
  },
  {
    target: 'po-demo-si-rs-col',
    caption:
      'The RS column shows the Retenue à la Source (withholding tax) amount. When a transaction type requires it, Flowentra displays the applicable rate and the deductible amount net of tax.',
    duration: 5200,
    apply: pure(() => ({})),
  },
  {
    target: 'po-demo-si-create',
    caption:
      'Creating a Supplier Invoice links it to a Purchase Order for three-way matching. Enter the invoice number, date, amount, and select the RS transaction type if withholding tax applies.',
    duration: 5000,
    apply: pure(() => ({ page: 'invoice-create' as const })),
  },
  {
    target: 'po-demo-si-detail-fel',
    caption:
      'The invoice detail tracks a Facture en Ligne status field — Flowentra records whether your team has marked this invoice as submitted to the official Tunisian e-invoicing platform. (Direct DGI API integration is on the roadmap.)',
    duration: 5200,
    apply: pure(() => ({ page: 'invoice-detail' as const, paymentStep: 0, felSent: false })),
  },
  {
    target: 'po-demo-si-tej-sync',
    caption:
      'The TEJ Sync badge shows whether this invoice has had its XML exported. Pending syncs are highlighted in amber so nothing slips through your compliance checklist.',
    duration: 5000,
    apply: pure(() => ({})),
  },


  // ── Chapter 10 · Invoice payment + FEL + TEJ ─────────────────────────────
  {
    target: 'po-demo-si-record-payment',
    caption:
      'Payment progress is driven by the Supplier Invoice status flow — advancing it to Partially Paid or Paid updates the invoice, and the amount paid, payment date and method are captured on the header for full traceability.',
    duration: 5500,
    apply: pure(() => ({ paymentStep: 1 })),
  },
  {
    target: 'po-demo-si-payment-dialog',
    caption:
      'The financial summary shows amount paid vs. remaining balance and the linked Purchase Order\'s payment status stays in sync, so a three-way match between PO, receipt and invoice is always visible at a glance.',
    duration: 5800,
    apply: pure(() => ({ paymentStep: 2 })),
  },
  {
    target: 'po-demo-si-fel-send',
    caption:
      'Once the invoice is settled, use the Send F.E.L. action to mark it as submitted to Facture en Ligne. The status flips with a timestamp and your Compliance dashboard updates in real time so you always know what is still outstanding.',
    duration: 5200,
    apply: pure(() => ({ paymentStep: 0, felSent: true })),
  },

  {
    target: 'po-demo-si-tej-xml-btn',
    caption:
      'Finally, use Download TEJ XML on the invoice detail — it registers the TEJ declaration and downloads the file in one click. Here is a preview of what that file contains.',
    duration: 4500,
    apply: pure(() => ({})),
  },

  // ── Chapter 11 · Invoice TEJ XML preview ─────────────────────────────────
  {
    target: 'po-demo-itej-declarant',
    caption:
      'Here is the generated XML. The Declarant block identifies you with TypeIdentifiant=1 (Matricule Fiscal), your company category, and a full contact block — address, email, phone.',
    duration: 6200,
    apply: pure(() => ({ page: 'invoice-tej-xml' as const, xmlHighlightLine: 4 })),
  },
  {
    target: 'po-demo-itej-refdecl',
    caption:
      'ReferenceDeclaration binds the file to a fiscal period — ActeDepot=0 flags an initial deposit, AnneeDepot and MoisDepot pin the exact month. Corrective re-filings reuse the period with ActeDepot=1.',
    duration: 5500,
    apply: pure(() => ({ xmlHighlightLine: 14 })),
  },
  {
    target: 'po-demo-itej-cert',
    caption:
      'The Certificat carries the IdTypeOperation (here RS1_500000 for Honoraires 5%), the beneficiary supplier with their fiscal identity, residency flag, and address.',
    duration: 6500,
    apply: pure(() => ({ xmlHighlightLine: 18 })),
  },
  {
    target: 'po-demo-itej-facture',
    caption:
      'The Facture sub-element captures invoice number, dates, and every amount in millimes — MontantHT, MontantTVA, TauxRS, MontantRS, MontantNetServi, and PriseEnCharge. The totals are auto-summed and validated before download.',
    duration: 6500,
    apply: pure(() => ({ xmlHighlightLine: 32 })),
  },
  {
    target: 'po-demo-itej-totals',
    caption:
      'The trailing Total* block sums HT, RS and Net Servi across the whole file. Flowentra cross-checks these against every Facture before letting you download — a mismatched file never leaves the app.',
    duration: 5800,
    apply: pure(() => ({ xmlHighlightLine: 48 })),
  },
  {
    target: 'po-demo-itej-facture',
    caption:
      'Reminder on encoding: every monetary field is an integer in millimes. 27,310.000 TND is written as 27310000 and TauxRS uses basis points × 100 (500 = 5.00%). Flowentra handles the conversion for you.',
    duration: 5800,
    apply: pure(() => ({ xmlHighlightLine: null })),
  },

  // ── Chapter 12 · Compliance dashboard ─────────────────────────────────────
  {
    target: 'po-demo-nav-compliance',
    caption:
      'The Compliance Dashboard is a dedicated view for Tunisian fiscal obligations — Retenue à la Source totals, Facture en Ligne registration status, and TEJ sync health, all on one screen.',
    duration: 5500,
    apply: pure(() => ({ page: 'compliance' as const, xmlHighlightLine: null })),
  },
  {
    target: 'po-demo-compliance-rs',
    caption:
      'The RS card shows your total withholding tax liability for the year, broken down per invoice. This figure feeds your annual DGI tax declarations directly.',
    duration: 5200,
    apply: pure(() => ({})),
  },
  {
    target: 'po-demo-compliance-fel',
    caption:
      'The Facture en Ligne card lists invoices that still need platform registration — with their current status (registered, pending, not started) so your team can act immediately.',
    duration: 5000,
    apply: pure(() => ({})),
  },
  {
    target: 'po-demo-compliance-tej',
    caption:
      'The TEJ Sync section lists every invoice with its export status — synced, pending, or errored — so you always know what still needs to be downloaded and submitted.',
    duration: 5000,
    apply: pure(() => ({})),
  },
  {
    target: 'po-demo-rs-catalogue-table',
    caption:
      'Zooming into the RS catalogue itself — the transaction-type picker on the invoice form is powered by this table, the full DGI reference. Five codes, five rates, and one TEJ operation identifier per line.',
    duration: 5500,
    apply: pure(() => ({ page: 'rs-catalogue' as const })),
  },
  {
    target: 'po-demo-rs-code',
    caption:
      'The Code column is the short DGI label — P1, P2, P3, P4, P5. Older invoices carrying legacy numeric codes (10, 05, 03, 20) are auto-mapped on read so nothing in your history breaks.',
    duration: 5500,
    apply: pure(() => ({})),
  },
  {
    target: 'po-demo-rs-rate',
    caption:
      'The Rate column drives every calculation. Pick P2 on a supplier invoice and Flowentra multiplies the HT amount by 5%, exposes MontantRS on the header, and subtracts it from the Net Servi shown to the accountant.',
    duration: 5500,
    apply: pure(() => ({})),
  },
  {
    target: 'po-demo-rs-tej-op',
    caption:
      'The TEJ Operation column is the identifier the DGI expects inside every Certificat — RS1_015000 for P1, RS1_500000 for P2, and so on. When you export the TEJ XML, this value is written verbatim into IdTypeOperation.',
    duration: 5800,
    apply: pure(() => ({})),
  },
  {
    target: 'po-demo-rs-legacy',
    caption:
      'Older invoices you imported still use the historical numeric codes. Flowentra maps them to the modern P1–P5 catalogue on the fly, so your legacy data keeps producing valid TEJ files without any migration work.',
    duration: 5500,
    apply: pure(() => ({})),
  },

  // ── Chapter 13 · Reports ──────────────────────────────────────────────────
  {
    target: 'po-demo-nav-reports',
    caption:
      'The Reports hub provides deep analytics on your purchasing: spend by supplier, monthly trend, and three dedicated sub-reports — Supplier Performance, Price Evolution, and Invoice Aging.',
    duration: 4800,
    apply: pure(() => ({ page: 'reports' as const, reportSection: 'overview' })),
  },
  {
    target: 'po-demo-report-cards',
    caption:
      'The three cards at the top of the Reports hub are your entry points into every sub-report — Supplier Performance, Price Evolution, and Invoice Aging. Each opens a fully-drilled analytics view fed by the same live data.',
    duration: 5200,
    apply: pure(() => ({})),
  },
  {
    target: 'po-demo-report-supplier-chart',
    caption:
      'The Spend by Supplier bar chart ranks every vendor by total purchase value. Hover a bar to see the exact amount — useful for identifying concentration risk in your supply chain.',
    duration: 5000,
    apply: pure(() => ({})),
  },
  {
    target: 'po-demo-report-monthly-chart',
    caption:
      'The Monthly Spend chart shows purchasing volume over time — ideal for spotting seasonal peaks, detecting budget overruns, and planning cash-flow for upcoming quarters.',
    duration: 4800,
    apply: pure(() => ({})),
  },
  {
    target: 'po-demo-report-nav-perf',
    caption:
      'Supplier Performance grades each vendor A through D based on on-time delivery rate, average lead time, and invoice payment history — all computed live from your real data.',
    duration: 5500,
    apply: pure(() => ({ page: 'supplier-performance' as const, reportSection: 'supplier-performance' })),
  },
  {
    target: 'po-demo-perf-scorecard',
    caption:
      'The scorecard table shows PO count, total spend, on-time percentage, average lead time in days, and the composite grade per supplier. Click a row to open the full drilldown sheet.',
    duration: 5500,
    apply: pure(() => ({})),
  },
  {
    target: 'po-demo-perf-chart',
    caption:
      'The performance bar chart lets you compare all suppliers side-by-side on any KPI — spend, on-time delivery, or lead time — turning sourcing decisions into evidence-based choices.',
    duration: 5000,
    apply: pure(() => ({})),
  },
  {
    target: 'po-demo-pe-chart',
    caption:
      'Price Evolution charts the historical purchase price of one article across all its suppliers — a single glance reveals which vendor stayed flat and which kept hiking.',
    duration: 5500,
    apply: pure(() => ({ page: 'price-evolution' as const })),
  },
  {
    target: 'po-demo-pe-table',
    caption:
      'Below the chart, every individual price-change row is listed with the supplier, old price, new price, percentage delta, and the user who recorded it — full traceability for audit.',
    duration: 5200,
    apply: pure(() => ({})),
  },
  {
    target: 'po-demo-aging-buckets',
    caption:
      'Invoice Aging groups every open supplier invoice into buckets: not-due, 1–30, 31–60, 61–90, and over 90 days overdue — exactly what your CFO needs for the cash-flow forecast.',
    duration: 5500,
    apply: pure(() => ({ page: 'invoice-aging' as const })),
  },
  {
    target: 'po-demo-aging-table',
    caption:
      'The detail table shows every overdue invoice with the supplier, due date, days overdue, and outstanding balance — so you can chase the biggest exposures first.',
    duration: 5200,
    apply: pure(() => ({})),
  },

  // ── Chapter 14 · Audit log ────────────────────────────────────────────────
  {
    target: 'po-demo-nav-audit',
    caption:
      'The Audit Log is an immutable record of Purchase Order activity — who created, modified, validated, or deleted an order, and exactly when. Goods Receipt and Invoice activity live on each document\'s own Activity tab.',
    duration: 5000,
    apply: pure(() => ({ page: 'audit-log' as const })),
  },
  {
    target: 'po-demo-audit-entries',
    caption:
      'Each entry shows the action type, the document reference, the user who triggered it, and a human-readable summary of what changed — with old and new values preserved.',
    duration: 5200,
    apply: pure(() => ({})),
  },
  {
    target: 'po-demo-audit-filter',
    caption:
      'A single search box narrows the log by description or user in real time — type a supplier name, an action verb, or a PO number and the list filters as you type.',
    duration: 4800,
    apply: pure(() => ({})),
  },

  // ── Chapter 15 · UX & Productivity ────────────────────────────────────────
  {
    target: 'po-demo-smart-filters',
    caption:
      'Smart filters answer "what needs my attention?" in one click. "Awaiting receipt > 7 days" instantly surfaces every ordered PO the warehouse has not confirmed in over a week — no typing, no remembering filter combinations.',
    duration: 5500,
    apply: pure(() => ({
      page: 'orders-list' as const,
      statusFilter: 'all',
      paymentFilter: 'all',
      highlightedStatKey: null,
      showFilters: false,
      selectedRowIds: [],
      viewMode: 'table' as const,
    })),
  },
  {
    target: 'po-demo-saved-views',
    caption:
      'On the Purchase Orders list, any combination of filters can be saved as a named view — "Awaiting GR — Acme", "My team\'s drafts". They persist locally in your browser, so your daily workflow is one click away every morning.',
    duration: 5200,
    apply: pure(() => ({})),
  },
  {
    target: 'po-demo-bulk-actions',
    caption:
      'Select several orders and the bulk bar gains lifecycle actions: Approve, Send to supplier, Close, and Export — apply one transition to dozens of POs at once, with optimistic UI and automatic retry of any that fail.',
    duration: 5800,
    apply: pure(() => ({ selectedRowIds: ['po-043', 'po-045'] })),
  },
  {
    target: 'po-demo-inline-timeline',
    caption:
      'Every order and invoice now carries an inline activity timeline right on the Overview — who created it, who validated it, when it was received — unified with the audit log so the full story is visible without switching tabs.',
    duration: 5500,
    apply: pure(() => ({ page: 'order-detail' as const, activeTab: 'overview', selectedRowIds: [] })),
  },
  {
    target: 'po-demo-shortcuts',
    caption:
      'The PO builder is keyboard-first: Alt+N adds a line, Enter from the last cell drops a new row, and Ctrl+S (or ⌘S) saves the draft — capture a long order without ever reaching for the mouse.',
    duration: 5200,
    apply: pure(() => ({ page: 'order-create' as const, createFormStep: 2 })),
  },
  {
    target: 'po-demo-last-price',
    caption:
      'As you price each line, Flowentra shows the last negotiated price for that article-supplier right under the field — highlighted in amber when it differs. One click applies it, so creeping costs never slip through unnoticed.',
    duration: 5500,
    apply: pure(() => ({ createFormStep: 2 })),
  },

  // ── Chapter 16 · Wrap-up ──────────────────────────────────────────────────
  {
    target: 'po-demo-title',
    caption:
      'That is the complete Purchases module tour — Purchase Orders, Goods Receipts, Supplier Invoices, Article-Supplier sourcing, full Tunisian fiscal compliance (RS, FEL, TEJ XML), productivity tooling, and live analytics.',
    duration: 5800,
    apply: pure(() => ({ page: 'dashboard' as const })),
  },
  {
    target: 'po-demo-stat-orders',
    caption:
      'Every document is connected: a PO links to its receipts and invoices, giving you a real three-way match and a single source of truth for every procurement transaction.',
    duration: 5200,
    apply: pure(() => ({})),
  },
  {
    target: 'po-demo-quick-links',
    caption:
      'Now it is your turn. Create your first Purchase Order, confirm delivery with a Goods Receipt, register the Supplier Invoice, and watch the reports reflect everything automatically.',
    duration: 5000,
    apply: pure(() => ({})),
  },
];

export const PO_CHAPTERS: PurchaseDemoChapter[] = [
  { id: 'dashboard',   title: 'Dashboard',          start: 0,  end: 5  },
  { id: 'orders',      title: 'Purchase Orders',    start: 5,  end: 12 },
  { id: 'create',      title: 'Create PO',          start: 12, end: 18 },
  { id: 'detail',      title: 'PO Detail',          start: 18, end: 26 },
  { id: 'pdf',         title: 'PO PDF',             start: 26, end: 29 },
  { id: 'po-tej',      title: 'PO · TEJ XML',       start: 29, end: 36 },
  { id: 'as',          title: 'Article-Suppliers',  start: 36, end: 40 },
  { id: 'receipts',    title: 'Goods Receipts',     start: 40, end: 45 },
  { id: 'invoices',    title: 'Supplier Invoices',  start: 45, end: 51 },
  { id: 'inv-flow',    title: 'Payment & FEL',      start: 51, end: 55 },
  { id: 'inv-tej',     title: 'Invoice · TEJ XML',  start: 55, end: 61 },
  { id: 'compliance',  title: 'Compliance',         start: 61, end: 70 },
  { id: 'reports',     title: 'Reports',            start: 70, end: 81 },
  { id: 'audit',       title: 'Audit Log',          start: 81, end: 84 },
  { id: 'ux',          title: 'UX & Productivity',  start: 84, end: 90 },
  { id: 'wrapup',      title: 'Wrap-up',            start: 90, end: PO_STEPS.length },
];

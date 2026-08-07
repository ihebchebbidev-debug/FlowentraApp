// Articles (Inventory & Services) module autopilot demo — 12 chapters, 46 steps.
// Mirrors the Purchases/HR demo architecture: a self-contained scripted tour with
// per-step state transitions, a virtual cursor, and FR/AR narration. English
// captions live inline here as the source of truth; translations are in
// articlesDemoTranslations.ts keyed by step index (kept exactly this length).

export type ArticlesDemoPage = 'list' | 'create' | 'import' | 'detail';

export interface ArticlesDemoState {
  page: ArticlesDemoPage;
  // ── List ──
  typeFilter: 'all' | 'material' | 'service';
  statusFilter: string;          // 'all' | 'low_stock' | …
  searchActive: boolean;
  lowStockHighlight: boolean;    // highlight the low-stock KPI + rows
  // ── Create ──
  createType: 'material' | 'service';
  createStep: number;            // 0..4 progressive reveal
  // ── Import ──
  importStep: number;            // 0=upload, 1=mapping, 2=validation, 3=confirm
  // ── Detail ──
  activeTab: 'overview' | 'inventory' | 'activity' | 'suppliers';
  txDialog: 'none' | 'add' | 'remove' | 'transfer';
  supplierDialogOpen: boolean;
}

export const initialArticlesDemoState: ArticlesDemoState = {
  page: 'list',
  typeFilter: 'all',
  statusFilter: 'all',
  searchActive: false,
  lowStockHighlight: false,
  createType: 'material',
  createStep: 0,
  importStep: 0,
  activeTab: 'overview',
  txDialog: 'none',
  supplierDialogOpen: false,
};

export interface ArticlesDemoStep {
  target: string;
  caption: string;
  duration: number;
  apply: (s: ArticlesDemoState) => ArticlesDemoState;
}

export interface ArticlesDemoChapter {
  id: string;
  title: string;
  start: number;
  end: number;
}

const pure =
  (apply: (s: ArticlesDemoState) => Partial<ArticlesDemoState>) =>
  (s: ArticlesDemoState): ArticlesDemoState => ({ ...s, ...apply(s) });

export const ART_STEPS: ArticlesDemoStep[] = [
  // ── Chapter 1 · Overview ───────────────────────────────────────────────────
  {
    target: 'art-demo-title',
    caption:
      'Welcome to Inventory & Services — your single catalog for everything you buy, stock, and sell. Materials with real-time stock, and services with rates and durations, all in one place.',
    duration: 5500,
    apply: pure(() => ({
      page: 'list' as const, typeFilter: 'all' as const, statusFilter: 'all',
      searchActive: false, lowStockHighlight: false,
    })),
  },
  {
    target: 'art-demo-stat-materials',
    caption:
      'Four KPI cards sit at the top. The first counts your Materials — physical, stock-tracked items like parts, consumables, and equipment.',
    duration: 4600,
    apply: pure(() => ({})),
  },
  {
    target: 'art-demo-stat-services',
    caption:
      'The Services card counts your billable services — installations, maintenance, inspections — each with a base rate and an expected duration rather than stock.',
    duration: 4800,
    apply: pure(() => ({})),
  },
  {
    target: 'art-demo-stat-lowstock',
    caption:
      'The Low Stock card is your early-warning signal: every material whose quantity has fallen to or below its minimum level. It is clickable — one tap filters the list to exactly those items.',
    duration: 5200,
    apply: pure(() => ({})),
  },
  {
    target: 'art-demo-stat-total',
    caption:
      'The Total Items card shows the full size of your catalog across all types and statuses, so you always know the scale of what you manage.',
    duration: 4400,
    apply: pure(() => ({})),
  },
  {
    target: 'art-demo-table',
    caption:
      'The catalog table lists every article: a type icon, name, SKU or category, status badge, live stock with a low-stock warning, price, and location — with inline actions on the right.',
    duration: 5200,
    apply: pure(() => ({})),
  },

  // ── Chapter 2 · Search & Filters ───────────────────────────────────────────
  {
    target: 'art-demo-search',
    caption:
      'The search bar does instant full-text matching across names, SKUs, and categories — results narrow as you type, so finding any item takes seconds even with thousands in stock.',
    duration: 4800,
    apply: pure(() => ({ searchActive: true })),
  },
  {
    target: 'art-demo-type-filter',
    caption:
      'The Type filter splits the catalog into Materials or Services in one click — perfect when you want to price-review every service or do a stock-take of materials only.',
    duration: 4800,
    apply: pure(() => ({ searchActive: false, typeFilter: 'material' as const })),
  },
  {
    target: 'art-demo-status-filter',
    caption:
      'The Status filter targets a single state — Available, Low Stock, Out of Stock, or Discontinued — so you can focus on exactly the items that need attention.',
    duration: 4800,
    apply: pure(() => ({ typeFilter: 'all' as const })),
  },
  {
    target: 'art-demo-stat-lowstock',
    caption:
      'Clicking the Low Stock card filters instantly to items at or below their minimum — the fastest path from "something is running out" to acting on it.',
    duration: 5000,
    apply: pure(() => ({ statusFilter: 'low_stock', lowStockHighlight: true })),
  },

  // ── Chapter 3 · Create a Material ──────────────────────────────────────────
  {
    target: 'art-demo-add-btn',
    caption:
      'Click Add Article to open the creation form. A single, clean form adapts to what you are adding — let us create a material first.',
    duration: 4400,
    apply: pure(() => ({
      page: 'create' as const, createType: 'material' as const, createStep: 0,
      statusFilter: 'all', lowStockHighlight: false,
    })),
  },
  {
    target: 'art-demo-create-type',
    caption:
      'The type toggle decides the whole form. Material unlocks stock, minimum level, cost and sell prices, supplier, and a storage location.',
    duration: 4800,
    apply: pure(() => ({ createType: 'material' as const })),
  },
  {
    target: 'art-demo-create-identity',
    caption:
      'Start with identity: the article name, a unique SKU for scanning and matching, and a category to keep the catalog organised and searchable.',
    duration: 4800,
    apply: pure(() => ({ createStep: 1 })),
  },
  {
    target: 'art-demo-create-stock',
    caption:
      'Set the opening stock and the minimum level. The minimum is the trigger: the moment stock drops to it, the item flips to Low Stock and shows up in your alerts.',
    duration: 5200,
    apply: pure(() => ({ createStep: 2 })),
  },
  {
    target: 'art-demo-create-pricing',
    caption:
      'Enter the cost price you pay and the sell price you charge. Flowentra derives the margin automatically and surfaces it on the article — so pricing decisions are always informed.',
    duration: 5200,
    apply: pure(() => ({ createStep: 3 })),
  },
  {
    target: 'art-demo-create-location',
    caption:
      'Finally pick a default supplier and a storage location. The supplier feeds reordering and purchase orders; the location drives stock transfers between warehouses.',
    duration: 5000,
    apply: pure(() => ({ createStep: 4 })),
  },
  {
    target: 'art-demo-create-save',
    caption:
      'Save, and the material joins your catalog immediately — counted in the KPIs, searchable, and ready to be received, transferred, or sold.',
    duration: 4400,
    apply: pure(() => ({})),
  },

  // ── Chapter 4 · Create a Service ───────────────────────────────────────────
  {
    target: 'art-demo-create-type',
    caption:
      'Switch the toggle to Service and the form transforms: stock and storage disappear, replaced by a base rate and a duration — because a service is time and expertise, not quantity.',
    duration: 5200,
    apply: pure(() => ({ createType: 'service' as const, createStep: 1 })),
  },
  {
    target: 'art-demo-create-service-fields',
    caption:
      'Set the base price and the expected duration, then optionally attach required skills. That lets the scheduler match the right technician and pre-fill quotes and work orders.',
    duration: 5400,
    apply: pure(() => ({ createStep: 2 })),
  },
  {
    target: 'art-demo-create-save',
    caption:
      'Save, and the service is instantly available to drop into offers, sales, and dispatches — priced and ready, with no stock to manage.',
    duration: 4400,
    apply: pure(() => ({})),
  },

  // ── Chapter 5 · Bulk Import ────────────────────────────────────────────────
  {
    target: 'art-demo-import-btn',
    caption:
      'Migrating an existing catalog? The Import button brings in hundreds of articles from a spreadsheet in one pass — no manual re-entry.',
    duration: 4600,
    apply: pure(() => ({ page: 'import' as const, importStep: 0 })),
  },
  {
    target: 'art-demo-import-template',
    caption:
      'Download the ready-made Excel template with every supported column — name, SKU, type, category, stock, min stock, prices, supplier, and location — then paste your data in.',
    duration: 5200,
    apply: pure(() => ({})),
  },
  {
    target: 'art-demo-import-mapping',
    caption:
      'On upload, Flowentra auto-maps your columns and normalises messy values — "matériel", "product", or "mat" all become Material; French decimals and units are parsed cleanly.',
    duration: 5600,
    apply: pure(() => ({ importStep: 1 })),
  },
  {
    target: 'art-demo-import-validation',
    caption:
      'Every row is validated before anything is saved. Hard errors block a row; smart warnings flag things like a service with stock or a minimum above the current quantity.',
    duration: 5400,
    apply: pure(() => ({ importStep: 2 })),
  },
  {
    target: 'art-demo-import-confirm',
    caption:
      'Confirm, and only the valid rows import — duplicates by name and SKU are skipped automatically. Your whole catalog lands in seconds, fully structured.',
    duration: 5000,
    apply: pure(() => ({ importStep: 3 })),
  },

  // ── Chapter 6 · Article Detail · Overview ──────────────────────────────────
  {
    target: 'art-demo-detail-header',
    caption:
      'Open any article to reach its detail workspace. The header carries the name, SKU, status, and the actions you reach for most — adjust stock, transfer, and edit.',
    duration: 5000,
    apply: pure(() => ({ page: 'detail' as const, activeTab: 'overview' as const })),
  },
  {
    target: 'art-demo-status-cards',
    caption:
      'The status cards give an at-a-glance read: current stock against capacity, stock value, the sell price, and a live status that updates as quantities change.',
    duration: 5000,
    apply: pure(() => ({})),
  },
  {
    target: 'art-demo-overview-pricing',
    caption:
      'The pricing panel breaks down cost, sell price, and the resulting margin in both currency and percentage — so you can spot thin margins the moment they appear.',
    duration: 5200,
    apply: pure(() => ({})),
  },
  {
    target: 'art-demo-overview-info',
    caption:
      'Alongside it, the details panel holds category, location, supplier, unit, and notes — the full identity of the item, editable in one click.',
    duration: 4800,
    apply: pure(() => ({})),
  },

  // ── Chapter 7 · Inventory ──────────────────────────────────────────────────
  {
    target: 'art-demo-tab-inventory',
    caption:
      'The Inventory tab is the stock cockpit for this material — levels, reorder maths, and quick stock actions, all in one view.',
    duration: 4600,
    apply: pure(() => ({ activeTab: 'inventory' as const })),
  },
  {
    target: 'art-demo-stock-levels',
    caption:
      'The stock gauge shows current quantity against capacity with a colour that turns to a warning below the minimum — and a clear Low Stock banner when it is time to reorder.',
    duration: 5200,
    apply: pure(() => ({})),
  },
  {
    target: 'art-demo-reorder',
    caption:
      'The reorder panel computes your reorder point and a suggested order quantity to refill to capacity — turning guesswork into a one-click Purchase Order.',
    duration: 5200,
    apply: pure(() => ({})),
  },
  {
    target: 'art-demo-quick-actions',
    caption:
      'Quick Actions keep day-to-day stock moves one click away — add stock, remove stock, or jump straight to editing the item.',
    duration: 4600,
    apply: pure(() => ({})),
  },

  // ── Chapter 8 · Stock movements ────────────────────────────────────────────
  {
    target: 'art-demo-add-stock',
    caption:
      'Add Stock records an inbound movement — a new purchase, a customer return, or an inventory adjustment — with a quantity and a reason, so every increase is traceable.',
    duration: 5200,
    apply: pure(() => ({ txDialog: 'add' as const })),
  },
  {
    target: 'art-demo-remove-stock',
    caption:
      'Remove Stock captures the outbound side — used on a project, damaged, lost, or transferred out — and is capped at the available quantity so stock can never go negative.',
    duration: 5400,
    apply: pure(() => ({ txDialog: 'remove' as const })),
  },
  {
    target: 'art-demo-transfer',
    caption:
      'Transfer moves quantity between locations in a single transaction — picking a from and to warehouse, with full from/to, reason, and reference captured for the audit trail.',
    duration: 5400,
    apply: pure(() => ({ txDialog: 'transfer' as const })),
  },

  // ── Chapter 9 · Suppliers ──────────────────────────────────────────────────
  {
    target: 'art-demo-tab-suppliers',
    caption:
      'The Suppliers tab makes every material multi-source — link several vendors and compare them side by side instead of being locked to one.',
    duration: 4800,
    apply: pure(() => ({ activeTab: 'suppliers' as const, txDialog: 'none' as const })),
  },
  {
    target: 'art-demo-suppliers-table',
    caption:
      'Each linked supplier shows their reference, purchase price, lead time in days, minimum order quantity, and the date of their last delivery — everything sourcing needs to decide.',
    duration: 5400,
    apply: pure(() => ({})),
  },
  {
    target: 'art-demo-supplier-preferred',
    caption:
      'Star one vendor as Preferred and Flowentra uses it first for reordering and purchase orders — and demotes the others atomically, so there is always exactly one default source.',
    duration: 5200,
    apply: pure(() => ({})),
  },
  {
    target: 'art-demo-price-history',
    caption:
      'Every price change is captured as an immutable history row — old price, new price, the percentage move, and when it happened — so creeping supplier costs never slip past you.',
    duration: 5400,
    apply: pure(() => ({})),
  },
  {
    target: 'art-demo-add-supplier',
    caption:
      'Adding a supplier is a quick form: pick the vendor, their reference, purchase price, lead time, and minimum order — and flag it preferred if it is your go-to source.',
    duration: 5200,
    apply: pure(() => ({ supplierDialogOpen: true })),
  },

  // ── Chapter 10 · Activity ──────────────────────────────────────────────────
  {
    target: 'art-demo-tab-activity',
    caption:
      'The Activity tab is the article’s full history — every stock movement, price change, and edit, in order.',
    duration: 4600,
    apply: pure(() => ({ activeTab: 'activity' as const, supplierDialogOpen: false })),
  },
  {
    target: 'art-demo-activity-log',
    caption:
      'Each entry shows what happened, the quantity or value change, who did it, and when — an immutable audit trail that answers "why is the stock this number?" instantly.',
    duration: 5200,
    apply: pure(() => ({})),
  },

  // ── Chapter 11 · Low stock → Purchase Order ────────────────────────────────
  {
    target: 'art-demo-create-po',
    caption:
      'Inventory does not stop at tracking. When a material runs low or out, a Create PO action appears right on its row — pre-filling a Purchase Order with the preferred supplier and a ready line item.',
    duration: 5600,
    apply: pure(() => ({ page: 'list' as const, lowStockHighlight: true, statusFilter: 'all' })),
  },

  // ── Chapter 12 · Wrap-up ───────────────────────────────────────────────────
  {
    target: 'art-demo-title',
    caption:
      'That is Inventory & Services end to end — materials and services in one catalog, live stock with low-stock alerts, bulk import, multi-supplier sourcing with price history, transfers, and a full audit trail.',
    duration: 5800,
    apply: pure(() => ({ page: 'list' as const, lowStockHighlight: false })),
  },
  {
    target: 'art-demo-stat-total',
    caption:
      'Everything connects: low stock flows into purchasing, articles flow into offers and sales, and every movement is logged. Add your first article and watch the catalog come alive.',
    duration: 5200,
    apply: pure(() => ({})),
  },
];

export const ART_CHAPTERS: ArticlesDemoChapter[] = [
  { id: 'overview',  title: 'Overview',        start: 0,  end: 6  },
  { id: 'filters',   title: 'Search & Filter', start: 6,  end: 10 },
  { id: 'material',  title: 'Add Material',    start: 10, end: 17 },
  { id: 'service',   title: 'Add Service',     start: 17, end: 20 },
  { id: 'import',    title: 'Bulk Import',     start: 20, end: 25 },
  { id: 'detail',    title: 'Article Detail',  start: 25, end: 29 },
  { id: 'inventory', title: 'Inventory',       start: 29, end: 33 },
  { id: 'movements', title: 'Stock Moves',     start: 33, end: 36 },
  { id: 'suppliers', title: 'Suppliers',       start: 36, end: 41 },
  { id: 'activity',  title: 'Activity',        start: 41, end: 43 },
  { id: 'reorder',   title: 'Low Stock → PO',  start: 43, end: 44 },
  { id: 'wrapup',    title: 'Wrap-up',         start: 44, end: ART_STEPS.length },
];

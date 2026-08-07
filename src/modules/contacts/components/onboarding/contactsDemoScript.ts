// Contacts (CRM) module autopilot demo — 11 chapters, 44 steps.
// Mirrors the Purchases / Articles demo architecture: a self-contained scripted
// tour with per-step state transitions, a virtual cursor, and FR/AR narration.
// English captions live inline here as the source of truth; translations are in
// contactsDemoTranslations.ts keyed by step index (kept exactly this length).

export type ContactsDemoPage = 'list' | 'create' | 'import' | 'detail';

export interface ContactsDemoState {
  page: ContactsDemoPage;
  // ── List ──
  typeFilter: 'all' | 'individual' | 'company';
  searchActive: boolean;
  showFilters: boolean;
  filterFocus: 'none' | 'status' | 'type' | 'favorites';
  favoriteRow: boolean;        // highlight the favourite-star toggle on a row
  showMap: boolean;
  selectMode: boolean;         // bulk selection active
  bulkBar: boolean;            // bulk action bar shown
  bulkConfirm: boolean;        // bulk-delete confirmation dialog
  // ── Create ──
  createStep: number;          // 0..5 progressive reveal
  // ── Import ──
  importStep: number;          // 0=upload, 1=mapping, 2=duplicates, 3=confirm
  // ── Detail ──
  isSupplier: boolean;         // supplier variant (Articles tab instead of CRM tabs)
  activeTab: string;           // overview | offers | sales | serviceOrders | installations | purchases | notes | articles
  noteDialogOpen: boolean;
}

export const initialContactsDemoState: ContactsDemoState = {
  page: 'list',
  typeFilter: 'all',
  searchActive: false,
  showFilters: false,
  filterFocus: 'none',
  favoriteRow: false,
  showMap: false,
  selectMode: false,
  bulkBar: false,
  bulkConfirm: false,
  createStep: 0,
  importStep: 0,
  isSupplier: false,
  activeTab: 'overview',
  noteDialogOpen: false,
};

export interface ContactsDemoStep {
  target: string;
  caption: string;
  duration: number;
  apply: (s: ContactsDemoState) => ContactsDemoState;
}

export interface ContactsDemoChapter {
  id: string;
  title: string;
  start: number;
  end: number;
}

const pure =
  (apply: (s: ContactsDemoState) => Partial<ContactsDemoState>) =>
  (s: ContactsDemoState): ContactsDemoState => ({ ...s, ...apply(s) });

export const CT_STEPS: ContactsDemoStep[] = [
  // ── Chapter 1 · Overview ───────────────────────────────────────────────────
  {
    target: 'ct-demo-title',
    caption:
      'Welcome to Contacts — your CRM address book. People, companies, and suppliers in one place, each one a hub that links to their offers, sales, service orders, notes, and history.',
    duration: 5500,
    apply: pure(() => ({
      page: 'list' as const, typeFilter: 'all' as const, searchActive: false,
      showFilters: false, showMap: false, selectMode: false, bulkBar: false, bulkConfirm: false, favoriteRow: false,
    })),
  },
  {
    target: 'ct-demo-stat-all',
    caption:
      'Three KPI cards sit at the top, and they are also filters. The first shows your total contacts across every type.',
    duration: 4400,
    apply: pure(() => ({ typeFilter: 'all' as const })),
  },
  {
    target: 'ct-demo-stat-persons',
    caption:
      'Click Persons to instantly narrow the list to individuals — the people you deal with directly: decision-makers, technicians, and leads.',
    duration: 4800,
    apply: pure(() => ({ typeFilter: 'individual' as const })),
  },
  {
    target: 'ct-demo-stat-companies',
    caption:
      'Companies groups your organisations — clients and partners — each able to hold its own people, addresses, and fiscal identity.',
    duration: 4800,
    apply: pure(() => ({ typeFilter: 'company' as const })),
  },
  {
    target: 'ct-demo-table',
    caption:
      'The contacts table shows the name with role, company, email, phone, a type badge, and a status badge. Click any row to open the full 360° profile.',
    duration: 5000,
    apply: pure(() => ({ typeFilter: 'all' as const })),
  },

  // ── Chapter 2 · Search & Filters ───────────────────────────────────────────
  {
    target: 'ct-demo-search',
    caption:
      'The search bar matches instantly across names, companies, emails, and phone numbers — find anyone in seconds, even in a directory of thousands.',
    duration: 4600,
    apply: pure(() => ({ searchActive: true })),
  },
  {
    target: 'ct-demo-filter-btn',
    caption:
      'The Filters panel layers in more precision — combine status, type, and favourites to build any segment you need.',
    duration: 4400,
    apply: pure(() => ({ searchActive: false, showFilters: true })),
  },
  {
    target: 'ct-demo-filter-status',
    caption:
      'Filter by lifecycle status — Lead, Customer, Active, Inactive, or Partner — to focus on exactly the relationships that matter right now.',
    duration: 4800,
    apply: pure(() => ({ filterFocus: 'status' as const })),
  },
  {
    target: 'ct-demo-filter-type',
    caption:
      'Filter by type to separate individuals, companies, and suppliers — useful when you want to act on one audience at a time.',
    duration: 4600,
    apply: pure(() => ({ filterFocus: 'type' as const })),
  },
  {
    target: 'ct-demo-filter-favorites',
    caption:
      'And filter by favourites to surface your key accounts. Mark a contact as a favourite with the star and it floats to the top of your shortlist.',
    duration: 4800,
    apply: pure(() => ({ filterFocus: 'favorites' as const })),
  },
  {
    target: 'ct-demo-favorite-star',
    caption:
      'One click on the star pins a contact as a favourite — highlighted across the list so your most important relationships are always a glance away.',
    duration: 4600,
    apply: pure(() => ({ showFilters: false, filterFocus: 'none' as const, favoriteRow: true })),
  },

  // ── Chapter 3 · Map view ───────────────────────────────────────────────────
  {
    target: 'ct-demo-map-btn',
    caption:
      'Contacts are geo-aware. Toggle the map to see every contact plotted by address — perfect for planning field visits or understanding where your customers cluster.',
    duration: 5000,
    apply: pure(() => ({ favoriteRow: false, showMap: true })),
  },
  {
    target: 'ct-demo-map',
    caption:
      'Pins are colour-coded and clickable — open a contact or start an edit straight from the map, so route planning and CRM live in one view.',
    duration: 5000,
    apply: pure(() => ({})),
  },

  // ── Chapter 4 · Bulk actions ───────────────────────────────────────────────
  {
    target: 'ct-demo-select-all',
    caption:
      'Tick the header checkbox to select every contact on the page, or pick individual rows — the bulk action bar appears the moment something is selected.',
    duration: 4800,
    apply: pure(() => ({ showMap: false, selectMode: true, bulkBar: true })),
  },
  {
    target: 'ct-demo-bulk-bar',
    caption:
      'The bulk bar shows how many are selected and lets you act on the whole set at once — no repetitive one-by-one work.',
    duration: 4400,
    apply: pure(() => ({})),
  },
  {
    target: 'ct-demo-bulk-delete',
    caption:
      'Bulk delete removes many contacts in one confirmed action, with a live progress bar — and it respects permissions, so only authorised users see it.',
    duration: 5000,
    apply: pure(() => ({ bulkConfirm: true })),
  },

  // ── Chapter 5 · Create a contact ───────────────────────────────────────────
  {
    target: 'ct-demo-add-btn',
    caption:
      'Click Add Contact to open the creation form. A single guided form captures everything — identity, contact details, address, and fiscal info.',
    duration: 4400,
    apply: pure(() => ({ page: 'create' as const, createStep: 0, selectMode: false, bulkBar: false, bulkConfirm: false })),
  },
  {
    target: 'ct-demo-create-type',
    caption:
      'Start by choosing the type — Individual, Company, or Supplier. The type decides how this contact behaves across the rest of the app.',
    duration: 4600,
    apply: pure(() => ({ createStep: 0 })),
  },
  {
    target: 'ct-demo-create-identity',
    caption:
      'Enter the identity: full name, the company they belong to, and their role or position — the core of who this contact is.',
    duration: 4800,
    apply: pure(() => ({ createStep: 1 })),
  },
  {
    target: 'ct-demo-create-contactinfo',
    caption:
      'Add the ways to reach them — email and phone. These power one-click mailto and call links, and feed mass-email and reminders.',
    duration: 4800,
    apply: pure(() => ({ createStep: 2 })),
  },
  {
    target: 'ct-demo-create-address',
    caption:
      'Capture the address, city, and country. This is what drives the map view and pre-fills delivery and billing addresses on documents.',
    duration: 4800,
    apply: pure(() => ({ createStep: 3 })),
  },
  {
    target: 'ct-demo-create-fiscal',
    caption:
      'For Tunisian compliance, record the CIN and the Matricule Fiscale. These flow straight onto invoices, withholding-tax certificates, and TEJ exports — entered once, reused everywhere.',
    duration: 5400,
    apply: pure(() => ({ createStep: 4 })),
  },
  {
    target: 'ct-demo-create-status',
    caption:
      'Finally set the lifecycle status, flag it a favourite, and add tags for your own segmentation — then save.',
    duration: 4600,
    apply: pure(() => ({ createStep: 5 })),
  },
  {
    target: 'ct-demo-create-save',
    caption:
      'Save, and the contact is live — counted in the KPIs, searchable, mappable, and ready to be linked to offers, sales, and service orders.',
    duration: 4400,
    apply: pure(() => ({})),
  },

  // ── Chapter 6 · Bulk import ────────────────────────────────────────────────
  {
    target: 'ct-demo-import-btn',
    caption:
      'Have an existing database? The Import button brings in your whole contact list from a spreadsheet in one pass.',
    duration: 4400,
    apply: pure(() => ({ page: 'import' as const, importStep: 0 })),
  },
  {
    target: 'ct-demo-import-template',
    caption:
      'Download the ready-made template with every supported column — name, email, phone, company, type, status, address, CIN, and Matricule Fiscale — then paste your data in.',
    duration: 5400,
    apply: pure(() => ({})),
  },
  {
    target: 'ct-demo-import-mapping',
    caption:
      'On upload, columns are auto-mapped and values normalised — "entreprise" and "société" become Company, "client" becomes Customer, and names split into first and last automatically.',
    duration: 5600,
    apply: pure(() => ({ importStep: 1 })),
  },
  {
    target: 'ct-demo-import-duplicates',
    caption:
      'Before saving, duplicates are detected by name and email — you decide per row whether to skip, update the existing contact, or import as new. Nothing is silently overwritten.',
    duration: 5600,
    apply: pure(() => ({ importStep: 2 })),
  },
  {
    target: 'ct-demo-import-confirm',
    caption:
      'Confirm, and your contacts land in seconds — fully structured, validated, and immediately searchable across the CRM.',
    duration: 4800,
    apply: pure(() => ({ importStep: 3 })),
  },

  // ── Chapter 7 · Contact detail · Overview ──────────────────────────────────
  {
    target: 'ct-demo-detail-header',
    caption:
      'Open a contact to reach its 360° profile. The header carries the avatar, name, role, and company, with the favourite star and edit always at hand.',
    duration: 5000,
    apply: pure(() => ({ page: 'detail' as const, isSupplier: false, activeTab: 'overview' })),
  },
  {
    target: 'ct-demo-overview-info',
    caption:
      'The Overview lays out everything: email, phone, company, position, address, CIN, Matricule Fiscale, last contact, and created date — the complete identity, editable in one click.',
    duration: 5400,
    apply: pure(() => ({})),
  },
  {
    target: 'ct-demo-overview-status',
    caption:
      'Status and type badges sit at the bottom, giving an instant read of where this relationship stands and how it behaves across the app.',
    duration: 4600,
    apply: pure(() => ({})),
  },

  // ── Chapter 8 · CRM 360° relations ─────────────────────────────────────────
  {
    target: 'ct-demo-tab-offers',
    caption:
      'This is where a contact becomes a true CRM hub. The Offers tab lists every quote sent to them — number, status, date, and amount — each linking to the full document.',
    duration: 5400,
    apply: pure(() => ({ activeTab: 'offers' })),
  },
  {
    target: 'ct-demo-rel-offers',
    caption:
      'Won an offer? It flows into Sales automatically. Every related record is one click from the contact, so you never lose the thread of a relationship.',
    duration: 5000,
    apply: pure(() => ({})),
  },
  {
    target: 'ct-demo-tab-sales',
    caption:
      'The Sales tab shows invoices raised for this contact with their payment status and totals — the money side of the relationship at a glance.',
    duration: 5000,
    apply: pure(() => ({ activeTab: 'sales' })),
  },
  {
    target: 'ct-demo-tab-serviceorders',
    caption:
      'Service Orders track the field work delivered to them — scheduled, in progress, or completed — tying the back office to what happens on site.',
    duration: 5000,
    apply: pure(() => ({ activeTab: 'serviceOrders' })),
  },
  {
    target: 'ct-demo-tab-installations',
    caption:
      'And Installations record the equipment deployed at their sites — so the next technician arrives already knowing the full history.',
    duration: 4800,
    apply: pure(() => ({ activeTab: 'installations' })),
  },

  // ── Chapter 9 · Purchases & Notes ──────────────────────────────────────────
  {
    target: 'ct-demo-tab-purchases',
    caption:
      'The Purchases tab aggregates everything this contact has bought — a running purchase history that doubles as a loyalty and lifetime-value view.',
    duration: 5000,
    apply: pure(() => ({ activeTab: 'purchases' })),
  },
  {
    target: 'ct-demo-tab-notes',
    caption:
      'The Notes tab is your shared memory — a timeline of every call, meeting, and decision, stamped with who wrote it and when.',
    duration: 4800,
    apply: pure(() => ({ activeTab: 'notes' })),
  },
  {
    target: 'ct-demo-add-note',
    caption:
      'Add a note in seconds and the whole team sees it — context travels with the contact, so anyone can pick up the relationship without missing a beat.',
    duration: 4800,
    apply: pure(() => ({ noteDialogOpen: true })),
  },

  // ── Chapter 10 · Suppliers ─────────────────────────────────────────────────
  {
    target: 'ct-demo-supplier',
    caption:
      'Suppliers are contacts too. Open one and the profile adapts — the CRM tabs give way to a supplier view focused on what you buy from them.',
    duration: 5000,
    apply: pure(() => ({ page: 'detail' as const, isSupplier: true, activeTab: 'overview', noteDialogOpen: false })),
  },
  {
    target: 'ct-demo-supplier-articles',
    caption:
      'The Articles tab lists every item sourced from this supplier with its reference and price — the same multi-supplier link you saw in Inventory, seen from the supplier’s side.',
    duration: 5200,
    apply: pure(() => ({ activeTab: 'articles' })),
  },

  // ── Chapter 11 · Wrap-up ───────────────────────────────────────────────────
  {
    target: 'ct-demo-title',
    caption:
      'That is Contacts end to end — people, companies, and suppliers in one CRM, with search, filters, a map, bulk tools, import, and a 360° profile that connects offers, sales, service, purchases, and notes.',
    duration: 5800,
    apply: pure(() => ({ page: 'list' as const, isSupplier: false, activeTab: 'overview' })),
  },
  {
    target: 'ct-demo-stat-all',
    caption:
      'Every contact is a hub, and every document links back to it. Add your first contact and watch your whole business wire itself together around your relationships.',
    duration: 5200,
    apply: pure(() => ({})),
  },
];

export const CT_CHAPTERS: ContactsDemoChapter[] = [
  { id: 'overview',  title: 'Overview',        start: 0,  end: 5  },
  { id: 'filters',   title: 'Search & Filter', start: 5,  end: 11 },
  { id: 'map',       title: 'Map View',        start: 11, end: 13 },
  { id: 'bulk',      title: 'Bulk Actions',    start: 13, end: 16 },
  { id: 'create',    title: 'Add Contact',     start: 16, end: 24 },
  { id: 'import',    title: 'Bulk Import',     start: 24, end: 29 },
  { id: 'detail',    title: 'Contact Profile', start: 29, end: 32 },
  { id: 'crm',       title: 'CRM 360°',        start: 32, end: 37 },
  { id: 'engage',    title: 'Purchases & Notes', start: 37, end: 40 },
  { id: 'suppliers', title: 'Suppliers',       start: 40, end: 42 },
  { id: 'wrapup',    title: 'Wrap-up',         start: 42, end: CT_STEPS.length },
];

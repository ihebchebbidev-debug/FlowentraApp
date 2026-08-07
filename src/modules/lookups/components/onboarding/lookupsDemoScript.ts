// Lookups module autopilot demo — 7 chapters, 23 steps.
// English (inline) + French only. Same architecture as the other module demos:
// scripted state transitions, a virtual cursor, and FR narration. Translations
// are in lookupsDemoTranslations.ts keyed by step index.

export interface LookupsDemoState {
  selected: string;            // selected lookup category id
  showAdd: boolean;            // create dialog
  addStep: number;             // 0..2 progressive reveal in create dialog
  showEdit: boolean;           // edit dialog
  showDelete: boolean;         // delete confirmation
  highlightDefault: boolean;   // ring the default star
  newRow: boolean;             // a freshly added row appears
  powersView: boolean;         // "powers dropdowns everywhere" overlay
}

export const initialLookupsDemoState: LookupsDemoState = {
  selected: 'task-statuses',
  showAdd: false,
  addStep: 0,
  showEdit: false,
  showDelete: false,
  highlightDefault: false,
  newRow: false,
  powersView: false,
};

export interface LookupsDemoStep { target: string; caption: string; duration: number; apply: (s: LookupsDemoState) => LookupsDemoState; }
export interface LookupsDemoChapter { id: string; title: string; start: number; end: number; }

const pure =
  (apply: (s: LookupsDemoState) => Partial<LookupsDemoState>) =>
  (s: LookupsDemoState): LookupsDemoState => ({ ...s, ...apply(s) });

export const LK_STEPS: LookupsDemoStep[] = [
  // ── Chapter 1 · Overview ───────────────────────────────────────────────────
  {
    target: 'lk-demo-title',
    caption:
      'Welcome to Lookups — the control panel behind every dropdown in Flowentra. Statuses, categories, priorities, sources, skills, locations: define them once here, and they appear, consistent, everywhere your team works.',
    duration: 5800,
    apply: pure(() => ({ selected: 'task-statuses', showAdd: false, showEdit: false, showDelete: false, newRow: false, powersView: false, highlightDefault: false })),
  },
  {
    target: 'lk-demo-sidebar',
    caption:
      'On the left is the full catalog of lookup types — grouped across CRM, sales, inventory, field service, projects and HR. Each one is a list you own and curate.',
    duration: 5000,
    apply: pure(() => ({})),
  },
  {
    target: 'lk-demo-counts',
    caption:
      'Every type shows how many values it holds, so you always know the shape of your configuration at a glance.',
    duration: 4200,
    apply: pure(() => ({})),
  },
  {
    target: 'lk-demo-table',
    caption:
      'Click a type and its values open on the right. Here are your Task Statuses — the exact options that appear when anyone sets a task’s status across the app.',
    duration: 5200,
    apply: pure(() => ({ selected: 'task-statuses' })),
  },

  // ── Chapter 2 · Anatomy of a value ─────────────────────────────────────────
  {
    target: 'lk-demo-name',
    caption:
      'Each row is one value — its name is exactly what users see in the dropdown. Rename it here and it updates everywhere at once.',
    duration: 4600,
    apply: pure(() => ({})),
  },
  {
    target: 'lk-demo-default',
    caption:
      'The star marks the default — the value pre-selected on new records. One per list, so a new task always starts in the right state without anyone choosing.',
    duration: 5200,
    apply: pure(() => ({})),
  },
  {
    target: 'lk-demo-status',
    caption:
      'And the status toggle retires a value without deleting its history — switch it to inactive and it disappears from new dropdowns while old records keep their label.',
    duration: 5200,
    apply: pure(() => ({})),
  },

  // ── Chapter 3 · Add a value ────────────────────────────────────────────────
  {
    target: 'lk-demo-add-btn',
    caption:
      'Adding a value takes seconds. Click Add Item to open the form — no developer, no deployment, your configuration is yours to change.',
    duration: 4600,
    apply: pure(() => ({ showAdd: true, addStep: 0 })),
  },
  {
    target: 'lk-demo-create-name',
    caption:
      'Give it a name and a sort order — the sort order decides exactly where it sits in the dropdown, so the most-used options come first.',
    duration: 4800,
    apply: pure(() => ({ addStep: 1 })),
  },
  {
    target: 'lk-demo-create-type',
    caption:
      'Some lists carry extra meaning. A Task Status can be flagged as a completed state — so the app knows the task is finished, not just labelled differently. Toggle active to publish it.',
    duration: 5400,
    apply: pure(() => ({ addStep: 2 })),
  },
  {
    target: 'lk-demo-create-save',
    caption:
      'Save, and the new value joins the list instantly — live in every dropdown across the app the moment you confirm.',
    duration: 4600,
    apply: pure(() => ({ showAdd: false, newRow: true })),
  },

  // ── Chapter 4 · Manage values ──────────────────────────────────────────────
  {
    target: 'lk-demo-edit',
    caption:
      'Edit any value to rename it, change its order, flip its flags, or adjust its colour — the same form, opened on an existing row.',
    duration: 4800,
    apply: pure(() => ({ newRow: false, showEdit: true })),
  },
  {
    target: 'lk-demo-set-default',
    caption:
      'Click another value’s star to make it the new default — Flowentra demotes the old one automatically, so there is always exactly one.',
    duration: 5000,
    apply: pure(() => ({ showEdit: false, highlightDefault: true })),
  },
  {
    target: 'lk-demo-delete',
    caption:
      'And remove a value you no longer need — with a confirmation, and safely, since values in use stay protected so nothing breaks downstream.',
    duration: 5000,
    apply: pure(() => ({ highlightDefault: false, showDelete: true })),
  },

  // ── Chapter 5 · Typed lookups ──────────────────────────────────────────────
  {
    target: 'lk-demo-leave',
    caption:
      'Lookups aren’t just labels — many carry data the app reasons about. Leave Types are a perfect example.',
    duration: 4400,
    apply: pure(() => ({ showDelete: false, selected: 'leave-types' })),
  },
  {
    target: 'lk-demo-paid',
    caption:
      'Each leave type is flagged paid or unpaid — and HR uses that flag automatically when it calculates balances and payroll. The lookup isn’t cosmetic; it drives the maths.',
    duration: 5200,
    apply: pure(() => ({})),
  },
  {
    target: 'lk-demo-skills',
    caption:
      'Skills carry a category and feed the dispatch board — the planner matches a job’s required skills to the right technician, all sourced from this one list.',
    duration: 5200,
    apply: pure(() => ({ selected: 'skills' })),
  },
  {
    target: 'lk-demo-locations',
    caption:
      'Locations power inventory and field work — the warehouses and van stocks you transfer parts between, and the sites your technicians visit, all defined right here.',
    duration: 5200,
    apply: pure(() => ({ selected: 'locations' })),
  },

  // ── Chapter 6 · Powers the whole app ───────────────────────────────────────
  {
    target: 'lk-demo-sources',
    caption:
      'Take Offer Sources — referral, website, trade show. A simple list on the surface…',
    duration: 4200,
    apply: pure(() => ({ selected: 'offer-sources' })),
  },
  {
    target: 'lk-demo-powers',
    caption:
      '…but these exact values become the dropdown on every offer and sale — and then the columns in your reports. Curate the list here, and your analytics stay clean and comparable.',
    duration: 5600,
    apply: pure(() => ({ powersView: true })),
  },
  {
    target: 'lk-demo-consistency',
    caption:
      'That’s the power of one source of truth — change a value once, and every form, badge, filter and report across Flowentra updates together. No drift, no duplicates, no mismatched data.',
    duration: 5600,
    apply: pure(() => ({})),
  },

  // ── Chapter 7 · Wrap-up ────────────────────────────────────────────────────
  {
    target: 'lk-demo-title',
    caption:
      'That is Lookups — one place to define every status, category, priority, source, skill and location your business runs on, each editable in seconds and instantly consistent everywhere.',
    duration: 5400,
    apply: pure(() => ({ selected: 'task-statuses', powersView: false })),
  },
  {
    target: 'lk-demo-sidebar',
    caption:
      'Set up your lists once, and the rest of Flowentra speaks your language — your statuses, your categories, your terms. Open Lookups and make the app truly yours.',
    duration: 5200,
    apply: pure(() => ({})),
  },
];

export const LK_CHAPTERS: LookupsDemoChapter[] = [
  { id: 'overview', title: 'Overview',        start: 0,  end: 4  },
  { id: 'anatomy',  title: 'Anatomy',         start: 4,  end: 7  },
  { id: 'add',      title: 'Add a Value',     start: 7,  end: 11 },
  { id: 'manage',   title: 'Manage',          start: 11, end: 14 },
  { id: 'typed',    title: 'Smart Lookups',   start: 14, end: 18 },
  { id: 'powers',   title: 'One Source',      start: 18, end: 21 },
  { id: 'wrapup',   title: 'Wrap-up',         start: 21, end: LK_STEPS.length },
];

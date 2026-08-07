// Dynamic Forms module autopilot demo — 10 chapters, 34 steps.
// English (inline) + French only. Same architecture as the other module demos.
// Translations live in dynamicFormsDemoTranslations.ts keyed by step index.

export type DFDemoPage = 'list' | 'builder' | 'preview' | 'public' | 'responses';

export interface DFDemoState {
  page: DFDemoPage;
  // List
  statusFilter: 'all' | 'draft' | 'released' | 'archived';
  // Builder
  fieldCount: number;          // how many fields are on the canvas (grows as we drag)
  propsTab: 'basic' | 'validation' | 'options' | 'logic' | 'data';
  conditionOn: boolean;        // conditional logic badge on canvas
  dynamicOn: boolean;          // dynamic data binding badge
  cascadeOn: boolean;          // cascading dropdown badge
  multiPage: boolean;          // page break / stepped
  thankYouOpen: boolean;
  shareOpen: boolean;
  publishOpen: boolean;
  // Preview / Public
  step: number;                // stepped-form current page
  submitted: boolean;          // public form thank-you shown
  // Responses
  responseOpen: boolean;
  exportOpen: boolean;
  exportEntity: boolean;
}

export const initialDFDemoState: DFDemoState = {
  page: 'list',
  statusFilter: 'all',
  fieldCount: 2,
  propsTab: 'basic',
  conditionOn: false,
  dynamicOn: false,
  cascadeOn: false,
  multiPage: false,
  thankYouOpen: false,
  shareOpen: false,
  publishOpen: false,
  step: 0,
  submitted: false,
  responseOpen: false,
  exportOpen: false,
  exportEntity: false,
};

export interface DFDemoStep { target: string; caption: string; duration: number; apply: (s: DFDemoState) => DFDemoState; }
export interface DFDemoChapter { id: string; title: string; start: number; end: number; }

const pure =
  (apply: (s: DFDemoState) => Partial<DFDemoState>) =>
  (s: DFDemoState): DFDemoState => ({ ...s, ...apply(s) });

export const DF_STEPS: DFDemoStep[] = [
  // ── Chapter 1 · Overview ───────────────────────────────────────────────────
  {
    target: 'df-demo-title',
    caption:
      'Welcome to Dynamic Forms — your no-code form builder. Drag fields to design any form, add logic and live data, publish a public link, and collect responses straight into Flowentra — without writing a line of code.',
    duration: 5800,
    apply: pure(() => ({ page: 'list' as const, statusFilter: 'all' as const })),
  },
  {
    target: 'df-demo-forms-table',
    caption:
      'Every form you’ve built lives here — its name, status, and how many responses it has collected. Edit, preview, share, duplicate, or open its responses, all from one row.',
    duration: 5200,
    apply: pure(() => ({})),
  },
  {
    target: 'df-demo-status',
    caption:
      'Forms move through a simple lifecycle — Draft while you design, Released once it’s live and shareable, and Archived when it’s retired. Filter by status to focus on what matters.',
    duration: 5200,
    apply: pure(() => ({ statusFilter: 'draft' as const })),
  },
  {
    target: 'df-demo-create',
    caption:
      'Let’s build one from scratch. New Form opens the visual builder — a drag-and-drop studio where the form takes shape in front of you.',
    duration: 4600,
    apply: pure(() => ({ statusFilter: 'all' as const })),
  },

  // ── Chapter 2 · The Builder ────────────────────────────────────────────────
  {
    target: 'df-demo-builder',
    caption:
      'This is the builder — three panes. On the left, a palette of fields; in the centre, your live canvas; on the right, the properties of whatever you select. Build, see, and refine in one place.',
    duration: 5600,
    apply: pure(() => ({ page: 'builder' as const, fieldCount: 2, propsTab: 'basic' as const })),
  },
  {
    target: 'df-demo-palette',
    caption:
      'The palette holds every field type, grouped — Basic inputs, Choice fields, Advanced like signature and rating, and Layout blocks. Grab one and drop it onto the canvas.',
    duration: 5200,
    apply: pure(() => ({})),
  },
  {
    target: 'df-demo-canvas',
    caption:
      'The canvas is your form, exactly as users will see it. Drag fields in, reorder them, and arrange them across the width — it’s WYSIWYG from the first second.',
    duration: 5000,
    apply: pure(() => ({})),
  },
  {
    target: 'df-demo-props',
    caption:
      'Select any field and the properties panel opens its full configuration — labels in English and French, help text, validation, options, logic and data, all tabbed and tidy.',
    duration: 5200,
    apply: pure(() => ({ propsTab: 'basic' as const })),
  },

  // ── Chapter 3 · The field types ────────────────────────────────────────────
  {
    target: 'df-demo-field-basic',
    caption:
      'Start with the basics — text, long text, number, email and phone. Drop in a Full Name and an Email and your form already captures the essentials.',
    duration: 5000,
    apply: pure(() => ({ fieldCount: 3 })),
  },
  {
    target: 'df-demo-field-choice',
    caption:
      'Add choice fields — checkboxes, radio buttons and dropdowns — for structured answers. A Service dropdown turns free text into clean, reportable data.',
    duration: 5200,
    apply: pure(() => ({ fieldCount: 5 })),
  },
  {
    target: 'df-demo-field-advanced',
    caption:
      'Then the advanced fields — a star Rating to score satisfaction, and a Signature pad to capture a real, legally-meaningful sign-off right on the device.',
    duration: 5200,
    apply: pure(() => ({ fieldCount: 7 })),
  },
  {
    target: 'df-demo-field-layout',
    caption:
      'Layout blocks shape the experience — Sections to group fields, rich Content for instructions, and a Page Break to split a long form into friendly steps.',
    duration: 5200,
    apply: pure(() => ({ fieldCount: 8 })),
  },

  // ── Chapter 4 · Configure a field ──────────────────────────────────────────
  {
    target: 'df-demo-props-basic',
    caption:
      'Configure each field down to the detail — its label in both languages, whether it’s required, and its width: full, half or third, so two fields can sit neatly side by side.',
    duration: 5400,
    apply: pure(() => ({ propsTab: 'basic' as const })),
  },
  {
    target: 'df-demo-props-validation',
    caption:
      'Validation keeps answers clean — minimum and maximum length, numeric ranges, and pattern rules — so an email is really an email before the form will submit.',
    duration: 5200,
    apply: pure(() => ({ propsTab: 'validation' as const })),
  },
  {
    target: 'df-demo-props-options',
    caption:
      'For choice fields, manage the options right here — add, rename, reorder, each labelled in English and French — exactly what the user picks from.',
    duration: 5000,
    apply: pure(() => ({ propsTab: 'options' as const })),
  },
  {
    target: 'df-demo-props-hint',
    caption:
      'And little touches matter — placeholder text, hint lines, and field descriptions guide the person filling it in, so your form is as clear as it is capable.',
    duration: 5000,
    apply: pure(() => ({ propsTab: 'basic' as const })),
  },

  // ── Chapter 5 · Smart logic & data ─────────────────────────────────────────
  {
    target: 'df-demo-logic',
    caption:
      'Now the magic — conditional logic. Show or hide a field based on another answer: ask "what went wrong?" only when someone rates you below three stars. The form adapts to each person.',
    duration: 5800,
    apply: pure(() => ({ propsTab: 'logic' as const, conditionOn: true })),
  },
  {
    target: 'df-demo-dynamic',
    caption:
      'Dropdowns can pull live data straight from Flowentra — bind a field to your Contacts, Articles or Locations, and the options stay in sync with your real data, never stale.',
    duration: 5400,
    apply: pure(() => ({ propsTab: 'data' as const, dynamicOn: true })),
  },
  {
    target: 'df-demo-cascade',
    caption:
      'Chain them into cascading dropdowns — pick a customer and the next field shows only that customer’s sites. Dependent, filtered, and effortless for the person filling it in.',
    duration: 5400,
    apply: pure(() => ({ cascadeOn: true })),
  },
  {
    target: 'df-demo-multipage',
    caption:
      'A page break turns a long form into a guided, multi-step flow with a progress bar — far less daunting, and proven to lift completion rates.',
    duration: 5200,
    apply: pure(() => ({ multiPage: true, propsTab: 'basic' as const })),
  },

  // ── Chapter 6 · Finish the form ────────────────────────────────────────────
  {
    target: 'df-demo-thankyou',
    caption:
      'Design what happens after submit — a custom Thank-You page, with conditional messages that change by answer, and an optional redirect to your site after a few seconds.',
    duration: 5400,
    apply: pure(() => ({ thankYouOpen: true })),
  },
  {
    target: 'df-demo-share',
    caption:
      'Sharing is a click — generate a public link anyone can open and submit without logging in, ready to drop into an email, a QR code, or your website.',
    duration: 5200,
    apply: pure(() => ({ thankYouOpen: false, shareOpen: true })),
  },
  {
    target: 'df-demo-publish',
    caption:
      'When it’s ready, Release the form — it flips from Draft to live, the public link goes active, and it starts accepting responses immediately.',
    duration: 5000,
    apply: pure(() => ({ shareOpen: false, publishOpen: true })),
  },

  // ── Chapter 7 · Preview ────────────────────────────────────────────────────
  {
    target: 'df-demo-preview',
    caption:
      'Before you send it out, Preview shows the real, working form — every field, your branding, the multi-step flow — exactly as a visitor will experience it.',
    duration: 5200,
    apply: pure(() => ({ page: 'preview' as const, publishOpen: false, step: 0 })),
  },
  {
    target: 'df-demo-preview-nav',
    caption:
      'Step through it page by page — the progress bar fills, conditional fields appear and disappear, and validation runs live, so you ship a form you’ve actually tested.',
    duration: 5200,
    apply: pure(() => ({ step: 1 })),
  },

  // ── Chapter 8 · The public form ────────────────────────────────────────────
  {
    target: 'df-demo-public',
    caption:
      'Here’s the public form your customers see — clean, on-brand, and mobile-ready, opened from the link with no account and no friction.',
    duration: 5000,
    apply: pure(() => ({ page: 'public' as const, step: 0, submitted: false })),
  },
  {
    target: 'df-demo-public-fill',
    caption:
      'They fill it in as you designed — the rating, the conditional follow-up, the signature — every interaction smooth, guided by your hints and validation.',
    duration: 5200,
    apply: pure(() => ({ step: 1 })),
  },
  {
    target: 'df-demo-public-submit',
    caption:
      'They submit, and your Thank-You page appears — confirming receipt, and redirecting onward if you set it. The response is already on its way into Flowentra.',
    duration: 5200,
    apply: pure(() => ({ submitted: true })),
  },

  // ── Chapter 9 · Responses ──────────────────────────────────────────────────
  {
    target: 'df-demo-responses',
    caption:
      'Every submission lands in the Responses view — who answered, when, and a live count — building a clean dataset from the moment your form goes live.',
    duration: 5000,
    apply: pure(() => ({ page: 'responses' as const, submitted: false, responseOpen: false, exportOpen: false, exportEntity: false })),
  },
  {
    target: 'df-demo-response-view',
    caption:
      'Open any response to see every answer laid out — including the captured signature and rating — a complete, readable record of exactly what was submitted.',
    duration: 5000,
    apply: pure(() => ({ responseOpen: true })),
  },
  {
    target: 'df-demo-export',
    caption:
      'Export the lot in a click — the whole response set to Excel for analysis, or any single response as a branded PDF for your records.',
    duration: 5000,
    apply: pure(() => ({ responseOpen: false, exportOpen: true })),
  },
  {
    target: 'df-demo-export-entity',
    caption:
      'Best of all, push a response straight into Flowentra — turn a submission into a Contact, a Service Order, or a Ticket in one step. The form isn’t a dead end; it feeds your whole operation.',
    duration: 5600,
    apply: pure(() => ({ exportOpen: false, exportEntity: true })),
  },

  // ── Chapter 10 · Wrap-up ───────────────────────────────────────────────────
  {
    target: 'df-demo-title',
    caption:
      'That is Dynamic Forms end to end — a drag-and-drop builder with thirteen field types, conditional logic, live data and cascading dropdowns, multi-step pages, a thank-you flow, public sharing, and responses that flow back into your business.',
    duration: 6000,
    apply: pure(() => ({ page: 'list' as const, exportEntity: false, statusFilter: 'all' as const })),
  },
  {
    target: 'df-demo-forms-table',
    caption:
      'Surveys, intake forms, inspections, sign-offs, lead capture — design it once, share a link, and watch structured data flow in. Build your first form and put it to work.',
    duration: 5400,
    apply: pure(() => ({})),
  },
];

export const DF_CHAPTERS: DFDemoChapter[] = [
  { id: 'overview', title: 'Overview',       start: 0,  end: 4  },
  { id: 'builder',  title: 'The Builder',    start: 4,  end: 8  },
  { id: 'fields',   title: 'Field Types',    start: 8,  end: 12 },
  { id: 'config',   title: 'Configure',      start: 12, end: 16 },
  { id: 'logic',    title: 'Logic & Data',   start: 16, end: 20 },
  { id: 'finish',   title: 'Finish & Share', start: 20, end: 23 },
  { id: 'preview',  title: 'Preview',        start: 23, end: 25 },
  { id: 'public',   title: 'Public Form',    start: 25, end: 28 },
  { id: 'responses',title: 'Responses',      start: 28, end: 32 },
  { id: 'wrapup',   title: 'Wrap-up',        start: 32, end: DF_STEPS.length },
];

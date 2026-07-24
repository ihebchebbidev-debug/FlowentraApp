# Shared Typography System — Deep Plan

Goal: one config file that controls every font family, size, weight, line-height, and mobile scaling across every page, module, and shared shell. Designed so a future settings screen can mutate it live.

## Scope audit (what actually needs to be consistent)

**Modules (43):** ai-assistant, analytics, articles, auth, automation, calendar, communication, contacts, dashboard, dashboard-builder, deals, dispatcher, documents, dynamic-forms, email-calendar, external, field (+ FieldCustomers, InventoryField, dispatches, installations, service-orders, time-expenses), hr, inventory-services, invoices, lookups, notifications, offers, onboarding, payments, preferences, projects, purchases, reporting, sales, scheduling, settings, shared, skills, stock-management, support, system, tasks, users, website-builder, workflow.

**Surfaces:** 75 `*Page.tsx` / `*Layout.tsx` files, 67 shadcn UI primitives in `src/components/ui/`, ~30 top-level shared components, plus module-specific components. **9,297** raw `text-{size}` utilities across **840 files**.

**Fonts declared in `index.html`:** Inter (used), Geist (unused), Poppins (unused).

## Deliverable: one config + a runtime + tokens everything reads

### 1. Config file — `src/config/typography.config.ts`

Single source of truth. Plain TS, no build step, hot-swappable.

```ts
export type TypographyToken =
  | 'display' | 'h1' | 'h2' | 'h3' | 'title' | 'subtitle'
  | 'body' | 'body-sm' | 'caption' | 'label' | 'overline'
  | 'metric' | 'metric-sm' | 'metric-lg'
  | 'button' | 'button-sm' | 'input' | 'code'
  | 'table-header' | 'table-cell' | 'nav' | 'badge' | 'tooltip';

export const typographyConfig = {
  families: {
    display: '"Geist", Inter, system-ui, sans-serif',
    heading: 'Inter, system-ui, sans-serif',
    body:    'Inter, system-ui, sans-serif',
    mono:    'ui-monospace, "SF Mono", Menlo, monospace',
  },
  weights: { regular: 400, medium: 500, semibold: 600, bold: 700 },
  // Fluid mobile→desktop; leaf pages never need md:text-*
  scale: {
    display:       { size: 'clamp(1.75rem, 2vw + 1rem, 2.5rem)',    lh: '1.1',  w: 700, tr: '-0.02em',  fam: 'display' },
    h1:            { size: 'clamp(1.5rem, 1.5vw + 0.8rem, 2rem)',   lh: '1.15', w: 600, tr: '-0.015em', fam: 'heading' },
    h2:            { size: 'clamp(1.25rem, 1vw + 0.7rem, 1.5rem)',  lh: '1.2',  w: 600, tr: '-0.01em',  fam: 'heading' },
    h3:            { size: '1.125rem',   lh: '1.3',  w: 600, tr: '-0.005em', fam: 'heading' },
    title:         { size: '1rem',       lh: '1.4',  w: 600, fam: 'heading' },
    subtitle:      { size: '0.875rem',   lh: '1.4',  w: 500, fam: 'heading' },
    body:          { size: '0.875rem',   lh: '1.5',  w: 400, fam: 'body' },
    'body-sm':     { size: '0.8125rem',  lh: '1.5',  w: 400, fam: 'body' },
    caption:       { size: '0.75rem',    lh: '1.4',  w: 400, fam: 'body' },
    label:         { size: '0.8125rem',  lh: '1.3',  w: 500, fam: 'body' },
    overline:      { size: '0.6875rem',  lh: '1.2',  w: 600, tr: '0.08em', fam: 'body' },
    metric:        { size: 'clamp(1.5rem, 1.5vw + 0.5rem, 2rem)',   lh: '1',    w: 700, fam: 'display' },
    'metric-sm':   { size: '1.125rem',   lh: '1.2',  w: 600, fam: 'display' },
    'metric-lg':   { size: 'clamp(2rem, 3vw + 0.5rem, 3rem)',       lh: '1',    w: 700, fam: 'display' },
    button:        { size: '0.875rem',   lh: '1',    w: 500, fam: 'body' },
    'button-sm':   { size: '0.8125rem',  lh: '1',    w: 500, fam: 'body' },
    input:         { size: '0.875rem',   lh: '1.4',  w: 400, fam: 'body' },
    code:          { size: '0.8125rem',  lh: '1.5',  w: 400, fam: 'mono' },
    'table-header':{ size: '0.75rem',    lh: '1.2',  w: 600, tr: '0.02em', fam: 'body' },
    'table-cell':  { size: '0.8125rem',  lh: '1.4',  w: 400, fam: 'body' },
    nav:           { size: '0.875rem',   lh: '1.2',  w: 500, fam: 'body' },
    badge:         { size: '0.6875rem',  lh: '1',    w: 600, fam: 'body' },
    tooltip:       { size: '0.75rem',    lh: '1.3',  w: 400, fam: 'body' },
  },
  mobile: { breakpoint: '640px', scale: 0.95, denseTables: true },
  print:  { bodyPt: 10, headingPt: 14 }, // used by pdf/print stylesheet
};
```

### 2. Runtime injector — `src/config/typography.runtime.ts`

- On boot, writes CSS custom properties to `:root`:
  `--font-display / --font-heading / --font-body / --font-mono`
  `--text-{token}-size / -lh / -weight / -tracking` for every token.
- Exports `applyTypography(config)` and `updateTypography(partial)` — future settings screen mutates live and persists to localStorage under `typography-overrides`.
- Reads any saved overrides on boot and merges before injection.
- Emits a `typography:changed` `CustomEvent` so any listening chart/pdf module can refresh.

Called once from `src/main.tsx` before render.

### 3. Tailwind wiring — `tailwind.config.ts`

Extend without removing defaults, so nothing breaks:

- `fontFamily.sans` → `var(--font-body)` (rebinds Inter globally through the token)
- New: `fontFamily.display`, `fontFamily.heading`, `fontFamily.mono`
- Add semantic `fontSize` entries for every token above (`text-display`, `text-h1`, `text-body`, `text-metric`, `text-table-header`, `text-nav`, `text-badge`, `text-code`, `text-tooltip`, `text-overline`, etc.), each pointing to the CSS variables with line-height and weight defaults.
- Existing `text-xs/sm/base/lg/xl/2xl/...` remain untouched — the 840 leaf files keep compiling.

### 4. Base CSS — `src/index.css`

- Add a `@layer base` block: `html { font-family: var(--font-body); }`, `h1..h6 { font-family: var(--font-heading); }`, apply token defaults to `body`, `input`, `button`, `table th`, `table td`, `code`, `kbd`, `pre`.
- Print stylesheet using `--text-*` tokens for `@media print`.
- Remove hardcoded `font-weight: 600` in `.compact-table .virtual-table-header` — read from token instead.

### 5. Primitives — `src/shared/components/Typography.tsx`

Expand the existing file (keep old `Heading size=...` / `Text variant=...` API as aliases so nothing breaks). Add:

- `<PageTitle>` (display), `<SectionTitle>` (h1), `<SubsectionTitle>` (h2), `<CardTitle>` (h3), `<Title>` (title), `<Subtitle>`
- `<Body>`, `<BodySmall>`, `<Muted>`, `<Caption>`, `<Label>`, `<Overline>`
- `<Metric>`, `<MetricSmall>`, `<MetricLarge>`
- `<Code>`, `<Kbd>`
- Each accepts `as`, `className`, forwards refs, supports `muted` / `truncate` / `numeric` (tabular-nums for tables/metrics) props.

Also export a `useTypographyToken(token)` hook for one-off cases.

### 6. Shared shell wiring (this is where 840 leaf pages inherit consistency)

Edit only shared/upstream components so pages don't need per-file changes:

- `src/components/ui/card.tsx` → `CardTitle` uses `text-h3`, `CardDescription` uses `text-body-sm text-muted-foreground`.
- `src/components/ui/dialog.tsx`, `sheet.tsx`, `drawer.tsx`, `alert-dialog.tsx` → titles use `text-h2`, descriptions `text-body-sm`.
- `src/components/ui/alert.tsx` → title `text-title`, description `text-body-sm`.
- `src/components/ui/table.tsx` → `TableHead` uses `text-table-header`, `TableCell` uses `text-table-cell tabular-nums` on numeric cells.
- `src/components/ui/button.tsx` → variants use `text-button` / `text-button-sm`.
- `src/components/ui/input.tsx`, `textarea.tsx`, `select.tsx` → `text-input`.
- `src/components/ui/label.tsx` → `text-label`.
- `src/components/ui/badge.tsx` → `text-badge uppercase tracking-wide`.
- `src/components/ui/tooltip.tsx` → `text-tooltip`.
- `src/components/ui/breadcrumb.tsx`, `pagination.tsx`, `menubar.tsx`, `navigation-menu.tsx`, `dropdown-menu.tsx`, `command.tsx`, `context-menu.tsx` → `text-nav`.
- `src/components/ui/tabs.tsx` → `text-subtitle`.
- `src/components/ui/toast.tsx` / `sonner.tsx` → title `text-title`, description `text-body-sm`.
- `src/components/ui/form.tsx` → `FormLabel` = `text-label`, `FormDescription` = `text-caption text-muted-foreground`, `FormMessage` = `text-caption`.
- `src/components/ui/accordion.tsx`, `collapsible.tsx` → trigger `text-title`.
- `src/components/ui/calendar.tsx` → day cells `text-caption`, weekday `text-overline`.
- `src/components/ui/chart.tsx` → tooltip/legend `text-caption tabular-nums`.
- `src/components/ui/pagination.tsx`, `page-skeleton.tsx` → `text-body-sm`.
- Sidebar (`src/components/ui/sidebar.tsx` and mobile sidebar) → group headers `text-overline`, items `text-nav`.
- Global search / command palette → results `text-body-sm`, section headers `text-overline`.

Cross-module shared shells:

- `src/shared/components/SearchAndFilterBar.tsx` → `text-input` for input, `text-caption` for chips.
- `src/shared/components/TableRowActions.tsx` → `text-nav`.
- `src/shared/components/DeleteConfirmationModal.tsx` → uses dialog primitives (already covered).
- `src/shared/components/PDFLongField.tsx` / `PDFInstallationTable.tsx` → use `typographyConfig.print` values.
- `src/shared/components/kanban/*` and `planning/*` → card title `text-title`, meta `text-caption`.
- Notification banners (`EmailVerificationBanner`, `TwoFactorReminderBanner`, `SessionExpiredBanner`, `UpdateAvailableBanner`, `ConnectionStatusBanner`, `SmoothUpdateProgress`, `TopProgressBar`) → alert primitive already covered.

Module-level page shells (one place per module, cascades to every page):

- `src/modules/*/pages/*Page.tsx` common headers — I'll audit for a shared "PageHeader" pattern; if one exists per module (dashboard, contacts, articles, deals, offers, sales, invoices, purchases, projects, tasks, calendar, inventory-services, stock-management, field, hr, users, settings, reporting, analytics, workflow, automation, dynamic-forms, website-builder, ai-assistant, communication, email-calendar, notifications, support, system, onboarding, auth, external, documents, lookups, skills, scheduling, dispatcher, payments, preferences), swap to `<PageTitle>` + `<Muted>`.
- Calendar module has its own `src/modules/calendar/styles.css` — rewrite hardcoded `font-size: 10px` toolbar rules to use `var(--text-caption-size)` / `var(--text-overline-size)`.
- Dashboard builder / workflow / dispatcher CSS files — replace hardcoded font sizes with tokens.
- PDF pipeline (`src/shared/pdf/*`, `@react-pdf/renderer` Font.register) — reads `typographyConfig.print`, so PDFs stay in sync when families change.

### 7. Mobile & density

- Every scale token uses `clamp()` — automatic mobile scaling with no `md:text-*` needed.
- `mobile.denseTables=true` toggles a `.compact-table` variant using `--text-table-cell` at 0.75rem instead of 0.8125rem for phones.
- Sidebar mobile config (`useMobileSidebarConfig`) `fontSize` prop rewired to consume `--text-nav` variants instead of hardcoded `text-xs/sm/base`.

### 8. Dark mode / theming

Font tokens are HSL-independent — dark mode is unaffected. `color` stays driven by existing color tokens. Verified: no font rule uses color.

## Migration philosophy

- **Zero mass-rewrite.** The 9,297 existing `text-*` classes keep working. New pages and any file we touch use primitives.
- Anyone editing a page can `import { PageTitle, Body, Muted } from '@/shared/components/Typography'` and get consistent output automatically.
- A follow-up sweep (out of scope for this plan) can codemod `text-2xl font-semibold` → `<SectionTitle>` module by module.

## File change list

**New (2):**
- `src/config/typography.config.ts`
- `src/config/typography.runtime.ts`

**Edit (core, ~7):**
- `tailwind.config.ts`
- `src/index.css`
- `src/main.tsx`
- `src/shared/components/Typography.tsx`
- `src/modules/calendar/styles.css`
- `src/modules/dashboard-builder/styles/grid.css`
- `src/modules/workflow/styles/workflow.css` + `workflow-execution.css`

**Edit (shadcn primitives, ~20):**
card, dialog, sheet, drawer, alert-dialog, alert, table, button, input, textarea, select, label, badge, tooltip, breadcrumb, pagination, menubar, navigation-menu, dropdown-menu, command, context-menu, tabs, toast, sonner, form, accordion, collapsible, calendar, chart, sidebar, global-search, command-palette, page-skeleton.

**Edit (shared shells, ~6):**
SearchAndFilterBar, TableRowActions, kanban/*, planning/*, EmailVerificationBanner, mobile sidebar config.

**Untouched:** 800+ leaf page files. They inherit through the shells they render.

## What we explicitly don't do

- No business logic changes.
- No color, spacing, or layout changes.
- No codemod of the 9,297 `text-*` utilities.
- No new font vendored — Geist already loaded in `index.html`; if we later want Poppins/Sora, one line in `families` swaps it globally.

## After this ships (config is ready for it)

- Settings > Appearance panel: font family picker, density slider (compact/balanced/spacious), mobile scale slider — all call `updateTypography(...)`.
- Per-tenant overrides via API — merge server overrides on boot before injection.
- PDF font family override lands automatically through `typographyConfig.print`.

## Goal
Upgrade `/db-console` (and `/dashboard/settings/db-console`) with:
1. **SQL autocomplete** — tables, columns, and SQL keywords as you type.
2. **Richer export** — CSV (existing), JSON, SQL `INSERT`s, Excel (.xlsx), plus copy‑to‑clipboard.

Frontend-only change. Backend stays untouched.

## 1. Autocomplete

**Source of truth:** the existing `DB_SCHEMA` from `src/modules/settings/data/dbSchema.generated.ts` (already lists every table, columns, FKs). No extra backend call needed — instant + offline.

**Editor swap:** Replace the plain `<Textarea>` with **CodeMirror 6** + `@codemirror/lang-sql`, which ships built‑in SQL completion driven by a `schema` object `{ TableName: ["col1","col2",...] }`.

- Package: `@uiw/react-codemirror`, `@codemirror/lang-sql`, `@codemirror/theme-one-dark` (light & small, ~80 kB gz combined).
- Build the `schema` map once with `useMemo` from `DB_SCHEMA`.
- Enable: line numbers, bracket matching, `Ctrl/⌘+Enter` to run (keymap), word wrap, theme follows current dark/light mode.
- Keywords (`SELECT`, `FROM`, `WHERE`, `JOIN`, `LIMIT`, `INSERT INTO`, …) come for free from `lang-sql` dialect = `PostgreSQL`.
- Quoted‑identifier support (Postgres `"Contacts"`) is on by default.

**Schema sidebar (bonus, cheap):** collapsible left panel listing tables; click a table inserts `SELECT * FROM "Table" LIMIT 100;`. Filter input on top.

## 2. Export

Add an export menu (DropdownMenu) on the result card, replacing the single CSV button:

| Format | How |
|---|---|
| CSV | existing logic |
| JSON | `JSON.stringify(rows, null, 2)` |
| Excel `.xlsx` | reuse already‑installed `xlsx` (seen in `ExportModal.tsx`) |
| SQL `INSERT`s | generate `INSERT INTO "<table>" (cols…) VALUES (…);` — table name parsed from current SQL via regex `FROM\s+"?(\w+)"?`, fallback prompt |
| Copy to clipboard | TSV (Excel‑paste friendly) via `navigator.clipboard.writeText` |

Filename pattern: `query-YYYYMMDD-HHmmss.<ext>`.

Also add: **"Copy SQL"** button next to Run (copies current editor contents).

## Files

- **edit** `src/modules/settings/pages/DbConsolePage.tsx` — swap textarea for CodeMirror, add schema sidebar, add export dropdown + handlers.
- **add deps** `@uiw/react-codemirror @codemirror/lang-sql @codemirror/theme-one-dark` via `bun add`.
- No backend changes. No new routes.

## Out of scope

- Server‑side schema introspection (current generated schema is already complete).
- Multi‑tab editor / saved snippets (history already exists).
- Query formatter / EXPLAIN view (can be a follow‑up).

## Risks

- Bundle size: ~80 kB gz added — acceptable for a hidden admin page; the route is already lazy‑loaded in `App.tsx`.
- CodeMirror SSR: page is client‑only (lazy + sessionStorage gate), no SSR concern.

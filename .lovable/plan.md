
## Goal
Make the three Autopilot Demos (HR, Purchases, Dynamic Forms) production-quality: every step's target element actually exists in the rendered demo, captions match the visible UI, mock data is internally consistent (totals, dates, statuses), and translations cover every caption.

## Scope (3 modules only)
- `src/modules/hr/components/onboarding/` (HRAutopilotDemo + script + translations)
- `src/modules/purchases/components/onboarding/` (PurchaseAutopilotDemo + script + translations)
- `src/modules/dynamic-forms/components/onboarding/` (DynamicFormsAutopilotDemo + script + translations)

No changes to real modules, services, or backend.

## What "perfect" means here (checklist applied to each demo)

1. **Target coverage** — every `target` string in `*DemoScript.ts` must match a `data-demo-id` (or equivalent id) actually rendered by the matching `*AutopilotDemo.tsx` for the current step's state. Missing targets cause the spotlight to fall back to the viewport — the #1 bug in this class of demo.
2. **State transitions valid** — `apply()` reducers only set states the demo renderer reads. No orphan keys (e.g. setting `payrollStep: 3` when the wizard is closed).
3. **Caption accuracy** — captions must describe what's on screen at that step, not aspirational features. Any mention of CNSS rates, IRPP brackets, TND amounts, three-way match, supplier scorecards, form-builder field types, etc. must match the mock data the component renders.
4. **Mock-data consistency** — totals add up (line items → subtotal → tax → total), statuses and dates are coherent (e.g. an "Approved" PO has an approver and approval date; a "Received" PO has matching GR lines), employees referenced in payroll exist in the employee list, form submissions reference real form ids.
5. **Translations parity** — every English caption has a French translation key in `*DemoTranslations.ts` (and vice-versa); no fallback to English in FR mode.
6. **Chapter index integrity** — `*_CHAPTERS` `start`/`end` indices match real step positions; doc comments ("11 chapters, 54 steps") reflect reality.
7. **Timing** — `duration` (ms) gives readers time to read the caption (~45ms per character, min 3500ms, max 7000ms).
8. **A11y & polish** — spotlight target has stable ref; no layout shift between steps; demo can be paused, skipped per chapter, and replayed without stale state.

## Approach

```text
For each of HR / Purchases / Dynamic Forms:
  1. Read the full script + autopilot component + translations.
  2. Build a target→render map; flag every script target with no matching id.
  3. Cross-check each step's `apply()` against the renderer's state branches.
  4. Audit captions against rendered mock data; rewrite captions OR adjust mock data so they agree.
  5. Recompute mock-data totals & statuses for internal consistency.
  6. Fill missing FR translation keys; tighten EN copy.
  7. Recompute chapter index ranges and the "N chapters, M steps" header comment.
  8. Adjust durations using the 45ms/char rule.
```

## Deliverables per module
- Updated `*DemoScript.ts` (corrected targets, captions, chapter indices, durations)
- Updated `*AutopilotDemo.tsx` (missing `data-demo-id`s added, mock data reconciled, no orphan state branches)
- Updated `*DemoTranslations.ts` (full FR parity)
- Short audit note appended to the chat summarising what was fixed per module

## Out of scope
- Real module UI/business logic
- Backend, migrations, RLS
- New demo chapters or features beyond what already exists
- Other modules (Sales, Dispatches, Projects, etc.)

## Risks / notes
- These three files total ~5,900 lines. Expect 6–10 edit batches per module.
- Where caption ↔ mock data disagree, I will prefer adjusting mock data (cheaper, keeps the narrative intact) unless the caption itself is misleading.
- I will not invent compliance numbers (CNSS %, IRPP brackets, fiscal stamp). If a caption cites a specific rate, I will keep the rate already used elsewhere in the codebase.


# Workflow module — full fix & polish plan

Scope: `src/modules/workflow/**` (frontend) + `Backend/Modules/WorkflowEngine/**` (engine, executors, resolver) + templates. Arabic locale is **out** per your instruction.

## Phase 1 — P0 blockers (silent data loss)

1. **Variable resolver: switch from node-ID to label-slug lookup**
   - Backend `WorkflowNodeExecutor` / `WorkflowGraphExecutor` resolver: accept both `{{node_<id>.field}}` (legacy) and `{{label_slug.field}}` (current UI).
   - Build a `slug → nodeOutput` map at execution start from `node.data.label` (slugified same way as `VariablePicker.tsx:366`).
   - Fallback order: slug → nodeId → context root key. Log a warning when a token resolves to nothing so users see it in the execution log.
   - Add unit test covering rename-safe resolution.

2. **`saveWorkflow` stale closure** (`useWorkflowApi.ts:167`)
   - Add missing deps to `useCallback` (or refactor to `useRef` for the workflows list).
   - Wrap writes in an optimistic update + rollback on error.

3. **Wire up dead node executors** in `WorkflowNodeExecutor`:
   - `human-input-form` → park execution as `waiting_input`, create a `WorkflowApproval`-like input request row (reuse `WorkflowApprovals` with a new `Kind` = `input` column, migration included), resume via existing approvals controller.
   - `wait-for-event` → park as `waiting_event`, add `WaitingEventKey` column + resume endpoint `POST /workflows/executions/{id}/events/{key}`.
   - `create-deal` → call `IDealService.CreateAsync` with mapped context.
   - `update-deal-status` → call `IDealService.UpdateStatusAsync`.
   - Remove the incorrect `ExecuteDelayAsync` fallthrough; default now throws `NotImplementedException` with node type in message so future gaps aren't silent.

## Phase 2 — P1 UX

4. **Undo/redo + autosave** in `WorkflowBuilder`
   - Extract history stack hook `useWorkflowHistory` (max 50 states, debounced push).
   - Autosave every 5s if dirty and workflow has an id; toast on failure only.
   - Keyboard: ⌘Z / ⌘⇧Z.

5. **True palette drag-drop**
   - `NodePalette` items become HTML5 draggable; canvas `onDrop` computes React Flow position via `screenToFlowPosition`.

6. **Wire draft/publish** (`workflowApi.ts:239-263`)
   - Add Draft/Published state badge in `WorkflowVersionBadge`.
   - "Save draft" vs "Publish" buttons; only published workflows are picked up by trigger service (backend filter on `Status = 'published'`, migration adds column with default `published` for existing rows).

7. **Compound condition builder** (AND/OR groups)
   - New `ConditionGroup` type: `{ op: 'AND'|'OR', rules: (Rule|ConditionGroup)[] }`.
   - Refactor `ConditionNode` + `ConditionalConfigModal` to render a nested group editor (max depth 3).
   - Backend evaluator updated with recursive evaluator; unit tests for AND/OR/nested.

8. **Responsive `NodeConfigPanel`**
   - `w-[400px]` → `w-full sm:w-[400px]`, drawer on `<sm`, resizable via `react-resizable-panels` on ≥sm.

9. **Cron validator**
   - Add `cron-parser` dep, live-validate + human-readable next-run preview.

10. **Execution history: parse context**
    - `WorkflowExecutionHistory` renders `context` as a collapsible JSON tree (`react-json-view-lite`), plus per-step input/output.

## Phase 3 — P2 polish

11. Split `WorkflowBuilder.tsx` (2375 LOC) into: `useWorkflowBuilderState`, `WorkflowCanvas`, `WorkflowToolbar`, `WorkflowSidebar`. Target <500 LOC per file. Behavior unchanged.
12. Dry-run / simulation mode: backend endpoint `POST /workflows/{id}/simulate` executes with `dryRun=true`, node executors short-circuit side effects and record what they *would* do. Frontend "Test run" button + result panel.
13. Execution list pagination (offset+limit; backend already supports it, expose in UI).
14. Polling backoff: exponential 5s → 60s cap when no new executions; reset on activity.
15. Remove Arabic — confirm none present (nothing to do).

## Phase 4 — Domain templates (production-ready)

Rewrite `src/modules/workflow/data/workflowTemplates.ts` with the following, each fully wired (trigger → nodes → edges validated against real entity statuses in `src/config/entity-statuses/`):

| # | Template | Trigger | Flow |
|---|----------|---------|------|
| 1 | **Auto-quote follow-up** | Offer status → `sent` | Wait 3d → If not `accepted` → Send follow-up email → Wait 4d → If still not `accepted` → Create task for salesperson |
| 2 | **Won offer → Sale + Project** | Offer → `accepted` | Create Sale from offer → Create Project → Notify PM → Send thank-you email to client |
| 3 | **Sale paid → Dispatch** | Sale → `paid` | Create Service Order → Auto-assign nearest technician → SMS/email confirm to client |
| 4 | **Service completed → Invoice + Review** | Service Order → `completed` | Generate invoice → Email invoice → Wait 2d → Send review request |
| 5 | **Overdue invoice reminders** | Cron daily 9:00 | Query unpaid sales past due → For each: send reminder (escalating tone by days late 7/14/30) → After 30d create collection task |
| 6 | **New lead intake (landing form → deal)** | External endpoint webhook | Create Contact if new → Create Deal (stage: `new`) → Assign round-robin → Notify assignee |
| 7 | **Deal stalled** | Cron daily | Find deals in `negotiation` >7d → Notify owner + manager → If >14d escalate to admin approval |
| 8 | **Low stock → PO draft** | Stock transaction, item qty < min | Create purchase order draft with preferred supplier → Notify purchasing |
| 9 | **New employee onboarding** | HR: employee created | Create onboarding tasks (5 predefined) → Schedule welcome email today + day-3 + day-7 → Create training calendar events |
| 10 | **Support ticket SLA** | Support ticket created | Wait per priority (P1=1h, P2=4h, P3=1d) → If still `open` → Escalate + notify manager |
| 11 | **Contract renewal 60d** | Cron daily | Find contracts expiring in 60/30/7 days → Send renewal email + create task |
| 12 | **Dispatch running late** | Dispatch entry ETA passed & status ≠ `arrived` | SMS client with delay estimate → Notify dispatcher |

Each template ships with: icon, category, description, tags, difficulty (Beginner/Intermediate), estimated setup time, and pre-filled node configs using real field names from `entity-fields.ts`. Templates gallery already exists — enrich `WorkflowTemplatesGallery.tsx` with category filter chips + preview modal showing the graph.

## Technical notes

- Migrations added under `Backend/Neon/`: `32_workflow_input_and_events.sql` (Kind/WaitingEventKey columns), `33_workflow_status_draft.sql` (Status column on `WorkflowDefinitions`). Include GRANTs and indexes.
- No breaking API changes — all new endpoints additive.
- New deps: `cron-parser`, `react-json-view-lite`. No new backend deps.
- Full test pass: `bunx vitest run src/modules/workflow` after each phase; backend has no test harness in repo, so guard with careful diffs + build.

## Delivery order

Ship Phase 1 first as a single commit (safe to deploy on its own — pure bugfix). Then 2, 3, 4 in sequence. Each phase leaves the app in a working state.

## Rough effort

- Phase 1: M (bug-focused, targeted)
- Phase 2: L
- Phase 3: L
- Phase 4: M (mostly data + gallery polish)

Reply **"go"** to start Phase 1, or tell me to reshuffle priorities / drop items.

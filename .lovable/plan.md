# Administration → Processes (per-workspace, grounded in real modules)

Verified against `src/modules/dashboard/components/workspaces.config.ts` and `Backend/Modules/`. Every process below is tied to a workspace the app actually ships (Sales · Purchases · Service · Projects · HR · Reporting · Integrations · Lookups · Service Desk · Administration) and to a service/table that already exists.

## 1. Where the page lives

Route `/dashboard/settings/processes`, added to the **Administration** workspace sidebar (in `workspaces.config.ts`) between `system-config` and `system-logs`. Admin-gated (same guard as `SystemAdminPage`). Also linked from the current "Background services" entry (which today just points to Sync) so both surface the same control center.

## 2. Processes catalogue, mapped to workspaces

Each item includes: **workspace**, **anchor** (existing service/table it wraps), **why it matters**.

### Sales workspace (Offers · Orders · Invoices · Deals · Customers · Articles · Installations · Documents)
1. **Offer expiration** — flip Offers past `ValidUntil` → `expired`, notify owner. *Anchor: `Offers/OfferService`.*
2. **Deal rot watchdog** — deals with no activity > N days → nudge owner. *Anchor: `Deals/DealService`.*
3. **Invoice overdue refresh** — status → `overdue` past due date. *Anchor: `Invoices` module + entity-status config.*
4. **Payment reminders (customers)** — tiered reminders. *Anchor: `Payments/PaymentReminderService` (BackgroundService already running).*
5. **Recurring invoice generator** — from templates. *Anchor: Invoices module.*
6. **Fiscal stamp / RS compliance recompute** — nightly. *Anchor: `08_fiscal_stamp.sql`, `RetenueSource` module.*
7. **Installation warranty reminders** — 30/7-day pings. *Anchor: `Installations/InstallationService`.*

### Purchases workspace (Purchases · Suppliers · Articles · Payments · Documents)
8. **Supplier invoice ↔ goods receipt matching** — flag unmatched. *Anchor: `Purchases/SupplierInvoiceService` + `GoodsReceiptService`.*
9. **Preferred-supplier integrity** — enforce one-preferred-per-article. *Anchor: `20260722_ArticleSuppliers_OnePreferredPerArticle.sql` + `ArticleSupplierService`.*
10. **Low-stock notifications** — reorder alerts. *Anchor: `lowStockNotificationService`.*
11. **Purchase order auto-close** after full receipt. *Anchor: `PurchaseOrderService`.*
12. **Supplier payment reminders** — outgoing side of PaymentReminderService.

### Service workspace (Service orders · Dispatches · Installations · Planning · Articles · Contacts · Documents)
13. **Dispatch SLA watchdog** — flag `Dispatches` past SLA, notify dispatcher. *Anchor: `Dispatches` + `34_dispatch_audit_logs.sql`.*
14. **Auto-close completed service orders** after N idle days. *Anchor: `ServiceOrders` module.*
15. **Planning rollover** — daily technician availability refresh. *Anchor: `Planning/PlanningService` + `PlanningProfileService`.*
16. **Preferred-skill match audit** — service orders unmatched to any qualified tech. *Anchor: `37_service_order_preferred_skills.sql`.*
17. **Incident → ticket auto-creation** — expose existing background job with schedule & metrics. *Anchor: `Incidents/IncidentAutoTicketService`.*

### Projects workspace (Projects · Contacts · Calendar · Documents)
18. **Generate due recurring tasks** — wraps `RecurringTaskService.GenerateDueTasksAsync`.
19. **Escalate overdue tasks** — status → overdue + notify. *Anchor: `tasks` FE + Projects backend.*
20. **Project health / RAG recompute** — nightly. *Anchor: `30_projects_client_success.sql`.*
21. **Calendar sync** — pull/push per connected calendar. *Anchor: `Calendar` backend + `SyncedCalendarEventsTable`.*

### HR workspace (Employees · Payroll · Leaves · Recruitment · Performance · Skills · Documents)
22. **Leave accrual** — monthly. *Anchor: `HrService`.*
23. **Contract expiration reminders** — 30/7-day. *Anchor: `HrService.PerformanceRecruitment`.*
24. **Interview reminders** — 24 h before. *Anchor: `HrInterview` model.*
25. **Birthday / anniversary notifications** — daily 08:00. *Anchor: employee records.*
26. **Payroll cutoff prep** — pre-compute variables the day before payroll. *Anchor: HR payroll page.*

### Reporting workspace
27. **Report cache warmup** — refresh top-N dashboard queries each morning. *Anchor: `Reporting` module + `33_dashboard_layout.sql`.*
28. **Scheduled report export & email** — periodic CSV/PDF delivery. *Anchor: `Reporting/export` page.*
29. **Reporting favorites cleanup** — orphaned favorites. *Anchor: `32_reporting_favorites.sql`.*

### Integrations workspace (Workflow · External APIs · Sync)
30. **Cleanup stuck workflow executions** — wraps `WorkflowExecutionsController.CleanupStuckExecutionsAsync`.
31. **Resume delayed executions** — `WorkflowExecutions` where `Status='waiting_delay' AND ResumeAt<=now`. *Anchor: `WorkflowPollingService` (expose as managed process).*
32. **Expire pending approvals** — `WorkflowApprovals` past `ExpiresAt`.
33. **Workflow reconciliation sweep** — wraps `WorkflowReconciliationController`.
34. **External API webhook retry** — failed outbound calls in `ExternalEndpoints`.
35. **Retry failed sync entries** — `29_sync_history_retry.sql` + `SyncService`.
36. **Sync log rotation** — retention on `SyncLoggingService` output.
37. **Rehydrate offline caches** — `OfflineHydration` module.

### Lookups workspace
38. **Lookup usage audit** — orphan / unused lookup values report. *Anchor: `Lookups` module.*

### Service Desk workspace
39. **Auto-close resolved tickets** after N idle days. *Anchor: `SupportTickets` backend.*
40. **SLA breach watchdog** — pending tickets past first-response / resolution SLA.
41. **Ticket re-open sweeper** — customer replied on closed ticket → re-open.

### Administration workspace (housekeeping & platform)
42. **Purge system logs** — retention. *Anchor: `SystemLogService.CleanupOldLogsAsync`.*
43. **Purge traceability activity** — retention on the activity feed.
44. **Purge notifications** — read + older than N days. *Anchor: `14_add_notifications_table.sql`.*
45. **Purge soft-deleted rows** — sweep `IsDeleted=true` across Offers/Sales/Invoices/Articles/Contacts/Projects/WorkflowDefinitions.
46. **Purge expired email-verification tokens** — `35_email_verification.sql`.
47. **Purge expired 2FA challenges** — `36_two_factor.sql`.
48. **Purge orphan uploads** — attachments with no parent entity. *Anchor: `uploadThingService`.*
49. **Retry unsent notifications** — pending/failed rows.
50. **IMAP inbox pull** — per connected `EmailAccount`; per-account block reason.
51. **Dynamic-forms submission cleanup** — retention on submissions. *Anchor: `15_dynamic_forms.sql`.*
52. **Plugin activation reconciliation** — `15_plugin_activations.sql`.
53. **Yearly numbering reset** — Jan 1. *Anchor: `Numbering/NumberingService` + `24_numbering_system.sql`.*
54. **Tenant storage snapshot** — feeds `SystemAdminPage` / `DatabaseSchemaPage`.

Total: **54 real processes**, each tied to code that exists today, distributed across all 10 shipped workspaces.

## 3. UI (frontend, phase 1)

### Header
"Processes" · description · counters (running / failing / blocked / paused) · buttons: Run selected · Pause selected · Resume selected · Refresh.

### List
- Left rail: workspace filter (All · Sales · Purchases · Service · Projects · HR · Reporting · Integrations · Lookups · Service Desk · Administration).
- Table columns: Name · Workspace badge · Module · Schedule (human) · Last run · Duration · Status pill · Next run · Actions (⋯).
- Status pill: `idle` · `running` · `paused` · `failed` (red, tooltip = last error) · `blocked` (amber, tooltip = block reason).
- Toolbar: search, "Only failing", "Only running", bulk select.

### Detail drawer
- **Overview** — schedule summary, next/last run, success rate (30 runs), avg duration, items processed, workspace + module link.
- **Schedule** — friendly picker (Manual · Every N min/hr · Daily HH:MM · Weekly · Monthly · Custom cron) + timezone.
- **History** — runs table (started, duration, status, items, error/block reason, "View logs" → SystemLogs filtered by process key + run id).
- **Diagnostics** — per-process checklist that answers *"why is this blocked?"*, e.g.
  - IMAP pull → account reachable? credentials valid? quota left?
  - Retry notifications → SMTP / webhook target reachable?
  - Cleanup stuck workflows → threshold set? DB reachable? not paused?
  - Payment reminders → SMTP OK? template present? contacts with valid emails?
- **Settings** — retention days / batch size / dry-run / notify-on-failure recipients.
- Actions: **Run now**, **Pause**, **Resume**, **Stop current run**, **Reset failure counter**, **Disable**.

## 4. Backend (phase 2)

Two tables + hosted scheduler + `IProcess` abstraction.

```
Processes
  Id, TenantId, Key (unique per tenant), Name, Workspace, Module, Category,
  ScheduleType('manual'|'interval'|'cron'), IntervalMinutes, CronExpression, Timezone,
  IsEnabled, IsPaused, MaxRuntimeSeconds, RetryPolicy(jsonb), Settings(jsonb),
  LastStatus, LastStartedAt, LastFinishedAt, LastDurationMs, LastError, BlockReason,
  NextRunAt, ConsecutiveFailures, CreatedAt, UpdatedAt

ProcessRuns
  Id, TenantId, ProcessId, StartedAt, FinishedAt, Status,
  ItemsProcessed, DurationMs, Error, BlockReason, TriggeredBy, LogsRef
```

- `IProcess { Key; Workspace; Run(ct, settings) → ProcessResult; Diagnose() → DiagnosticsReport }`.
- Each catalogued item = thin `IProcess` wrapper around the existing service — nothing reimplemented.
- `ProcessScheduler : BackgroundService` polls every 30 s per tenant; concurrency = 1 per key; runtime > `MaxRuntimeSeconds` → `blocked/timeout`.
- Existing `BackgroundService`s (`WorkflowPollingService`, `PaymentReminderService`, `IncidentAutoTicketService`) become **managed** processes: they read enable/pause flags from `Processes` so the admin page controls them without killing threads.
- Endpoints: `GET/PATCH /admin/processes[/{key}]`, `POST /admin/processes/{key}/run|stop`, `GET /admin/processes/{key}/runs|diagnostics`.

## 5. Phasing

- **Phase 1 (this task, FE-only)** — page + drawer + sidebar entry + role guard. All 54 processes rendered from a local mock (`src/modules/system/services/processesMock.ts`) with realistic schedules, history and diagnostics per workspace. Ships immediately for UX validation with no backend risk.
- **Phase 2** — tables, `IProcess`, scheduler, wire the ~12 processes whose services are already coded (system logs cleanup, recurring tasks, stuck workflows, low-stock, payment reminders, incident auto-ticket, sync retry, IMAP pull, offer expiration, numbering reset, workflow reconciliation, planning rollover).
- **Phase 3** — remaining processes, one workspace at a time; per-process diagnostics panels.

## 6. Questions before I build

1. Tenant-scoped by default (each tenant configures its own) with a small platform-only set (plugin reconciliation, tenant storage snapshot) — OK?
2. Ship Phase 1 with mocked data so you review the UX first?
3. Any process to drop, or workspace-specific ones (GDPR export, cash reconciliation, etc.) to add?

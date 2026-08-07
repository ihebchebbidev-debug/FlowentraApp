import type { ModuleGuideMap } from "../types";

export const FIELD_SERVICE_GUIDES: ModuleGuideMap = {
  dispatcher: {
    key: "dispatcher",
    purpose:
      "The dispatcher module is the operational planning board where dispatchers assign unassigned service-order jobs to technicians on a calendar/kanban board. It resolves time-slot conflicts before committing an assignment and pushes assignments into concrete Dispatch records that field techs execute. It sits visually on top of the Planning and Dispatches backend modules and is gated behind the PL0024DISPATCHER plugin (depends on PL0015FIELD).",
    workflows: [
      {
        name: "Assign a job to a technician via drag/drop",
        steps: [
          "Dispatcher drags an unassigned job onto a technician's row on the calendar/kanban board.",
          "Client-side collision service checks for overlap against the technician's existing jobs and blocked intervals.",
          "If a conflict is found, OverlapConfirmDialog surfaces it; dispatcher can force-assign with AllowOverlap.",
          "AssignmentConfirmationModal (or BatchAssignmentModal for multiple jobs) confirms and calls the /assign or /batch-assign endpoint.",
          "Backend re-validates the assignment (technician role, leave, overlaps) before committing.",
          "On success, job.Status becomes \"scheduled\" and a Dispatch record is optionally auto-created.",
        ],
      },
      {
        name: "Auto-suggest a technician via planning profile",
        steps: [
          "Dispatcher opens PlanningProfilesModal for an unassigned job.",
          "usePlanningProfile/planningAssist rank candidate technicians by skill match and geography.",
          "Dispatcher picks a suggested technician and confirms the assignment as above.",
        ],
      },
      {
        name: "Manage a technician's schedule from the dispatcher board",
        steps: [
          "Dispatcher opens manage-scheduler (permission-gated on service_orders:update).",
          "Selects a technician to open the ScheduleEditorPage from the scheduling module.",
          "Edits are subject to the same collision/overlap checks as normal assignment.",
        ],
      },
    ],
    rules: [
      {
        title: "Client-side overlap detection",
        detail: "checkCollision treats two intervals as overlapping if proposedStart < jobEnd && jobStart < proposedEnd; findNextAvailableSlot linearly scans sorted jobs for the next free gap bounded by workingHoursEnd.",
      },
      {
        title: "Server-side assignment validation",
        detail: "ValidateAssignmentAsync checks the job exists, each technician id parses and belongs to a user with the technician role, the technician is not on approved leave (UserLeave) covering ScheduledDate, and computes time-overlap conflicts against same-day, non-cancelled/non-completed Dispatch rows for that technician (s < end && start < e).",
      },
      {
        title: "AllowOverlap toggles conflicts vs warnings",
        detail: "If AllowOverlap is false, detected overlaps become hard blocking Conflicts; if true, they are downgraded to non-blocking Warnings.",
      },
      {
        title: "Zero/invalid time window is an automatic conflict",
        detail: "An existing dispatch with e <= s (unknown/zero window) is always treated as a conflict during validation.",
      },
      {
        title: "Invalid technicians are validation errors, not exceptions",
        detail: "Unparseable technician ids and non-technician-role users are reported as AssignmentValidationResult conflicts, enabling partial-success batch assignment rather than failing the whole request.",
      },
      {
        title: "Assignment sets job status and creates a dispatch",
        detail: "AssignJobAsync validates, sets job.Status = \"scheduled\" and job.AssignedTechnicianIds, then optionally auto-creates a Dispatch (AutoCreateDispatch flag) routed to either the installation dispatch flow (when the JobConversionMode app-setting is \"installation\" and the job has an InstallationId) or a per-job dispatch otherwise.",
      },
      {
        title: "Blocked intervals combine multiple sources",
        detail: "blockedIntervals.service merges technician leave, working hours, and existing dispatches into unified \"blocked\" calendar intervals so the grid renders unavailable slots.",
      },
      {
        title: "Skill matching feeds technician ranking",
        detail: "RequiredSkills for a job is a case-insensitive union of job-level and service-order-level preferred skills, used by the planning profile suggestion logic in the dispatcher UI.",
      },
    ],
    integrations: [
      "Planning backend module (PlanningController /assign, /batch-assign, /validate, /unassigned-jobs)",
      "Dispatches module — assignment creates or updates Dispatch records",
      "Scheduling module — manage-scheduler screens delegate to SchedulerManager/ScheduleEditorPage",
      "Service Orders — jobs originate from ServiceOrderJob records",
    ],
    gotchas: [
      "Forcing an assignment with AllowOverlap bypasses the blocking conflict but the overlap still shows as a warning — it is not silently ignored.",
      "The dispatcher board is purely the UI/orchestration layer; actual state (job status, dispatch creation) is owned by the Planning/Dispatches backend services.",
    ],
    sources: [
      "src/modules/dispatcher/DispatcherModule.tsx",
      "src/modules/dispatcher/services/collision.service.ts",
      "src/modules/dispatcher/services/blockedIntervals.service.ts",
      "src/modules/dispatcher/utils/planningAssist.ts",
      "Backend/Modules/Planning/Controllers/PlanningController.cs",
      "Backend/Modules/Planning/Services/PlanningService.cs",
    ],
  },

  scheduling: {
    key: "scheduling",
    purpose:
      "Scheduling is a thin sub-module providing the per-technician weekly/day schedule editor used by dispatcher and manager screens to fine-tune a single technician's calendar — drag-resizing time blocks and adjusting working hours — as opposed to the multi-technician dispatcher planning board. It has no top-level routes of its own and is only reachable from the dispatcher module.",
    workflows: [
      {
        name: "Edit a technician's schedule",
        steps: [
          "Dispatcher opens manage-scheduler from the Dispatcher module, listing technicians in SchedulerManager.",
          "Selects a technician to open ScheduleEditorPage / ScheduleEditor.",
          "Drags to resize or move a scheduled block, changing ScheduledStartTime/ScheduledEndTime.",
          "Edit is submitted via PATCH to the dispatches/planned-line-entries endpoints, subject to the same collision/overlap validation as normal assignment.",
        ],
      },
    ],
    rules: [
      {
        title: "No dedicated backend module",
        detail: "Scheduling has no backend module of its own; it consumes the Planning module's PlannedLineEntriesController and the Dispatches module's PUT /api/dispatches/{id} and PATCH /status endpoints.",
      },
      {
        title: "Shares overlap/collision validation with dispatcher",
        detail: "Reschedules made through ScheduleEditor go through the same ValidateAssignmentAsync / collision utilities used by the dispatcher board.",
      },
      {
        title: "Inherits the cancel guard on closed dispatches",
        detail: "Because reschedules reuse UpdateDispatchDto/UpdateStatusAsync directly, they inherit the rule that a dispatch in closed/technically_completed/completed/invoiced status cannot be cancelled.",
      },
      {
        title: "Permission-gated entry point",
        detail: "Access to manage-scheduler and the schedule editor from the dispatcher UI requires the service_orders:update permission.",
      },
    ],
    integrations: [
      "Dispatcher module — is the only entry point into scheduling screens",
      "Planning module — PlannedLineEntriesController backs the schedule blocks",
      "Dispatches module — schedule edits update Dispatch time fields and status",
    ],
    gotchas: [
      "Scheduling has empty routes: [] in its plugin manifest; it cannot be navigated to directly outside the dispatcher module.",
      "Because it shares the dispatch update endpoint, any business rule change to DispatchService.UpdateStatusAsync also silently affects the schedule editor.",
    ],
    sources: [
      "src/modules/scheduling/pages/SchedulerManager.tsx",
      "src/modules/scheduling/pages/ScheduleEditorPage.tsx",
      "src/modules/scheduling/services/scheduling.service.ts",
      "Backend/Modules/Dispatches/Services/DispatchService.cs",
    ],
  },

  field: {
    key: "field",
    purpose:
      "Field is the umbrella \"Field Service\" module (plugin PL0015FIELD) hosting service orders, dispatches, installations, field customers, field inventory, and time/expense tracking — everything a field technician or back-office dispatcher touches for on-site work execution. It owns the Dispatch status machine that drives job execution and invoicing readiness.",
    workflows: [
      {
        name: "Create a dispatch from a job",
        steps: [
          "A service order job is created (status starts unscheduled).",
          "Dispatcher assigns technician(s), creating a Dispatch via CreateFromJobAsync.",
          "Dispatch status is set to \"assigned\" if technicians were provided at creation, otherwise \"planned\".",
          "The parent ServiceOrderJob.Status flips to \"dispatched\" the first time technicians are attached to it (later dispatches on the same job leave job status untouched, since multiple dispatches per job are allowed).",
        ],
      },
      {
        name: "Execute and close out a dispatch",
        steps: [
          "Technician starts the job; StartDispatchAsync forces status to \"in_progress\", stamps ActualStartTime from the client payload, and fires a workflow status-change trigger.",
          "Technician completes the job; CompleteDispatchAsync forces status to \"completed\", sets ActualEndTime and CompletionPercentage, and fires another workflow trigger.",
          "Service-order status propagation from the completed dispatch is handled entirely by the Workflow Engine — there is no hardcoded fallback in DispatchService.",
        ],
      },
      {
        name: "Cancel a dispatch",
        steps: [
          "Dispatcher/manager requests a status change to \"cancelled\" via UpdateStatusAsync.",
          "Request is blocked if current status is closed, technically_completed, completed, or invoiced.",
          "Otherwise, all linked ServiceOrderJobs revert to \"unscheduled\" (except those already completed/cancelled) so they reappear in the dispatcher's unassigned queue.",
          "A DispatchAuditLog row is written capturing old/new status and linked Sale/Offer ids, and a ContactActivity entry is logged.",
        ],
      },
      {
        name: "Group jobs into one installation dispatch",
        steps: [
          "Jobs belonging to the same installation are added via AddJobsToInstallationDispatchAsync (used when JobConversionMode = \"installation\").",
          "A single multi-job Dispatch is created per installation; the legacy JobId field is left null and the canonical job list lives in the DispatchJobs join table.",
        ],
      },
    ],
    rules: [
      {
        title: "Dispatch default status",
        detail: "New Dispatch records default to status \"pending\" (Dispatch.cs).",
      },
      {
        title: "Creation status depends on technician assignment",
        detail: "CreateFromJobAsync sets status to \"assigned\" when AssignedTechnicianIds are supplied at creation, otherwise \"planned\".",
      },
      {
        title: "Schedule window validation on every create path",
        detail: "ValidateScheduleWindow requires the end time to be strictly after the start time, a minimum 1-minute duration, and ScheduledDate no more than 1 day in the past (a grace window for same-day past times).",
      },
      {
        title: "Cancellation is blocked for closed-out dispatches",
        detail: "UpdateStatusAsync refuses a transition to \"cancelled\" if the current status is closed, technically_completed, completed, or invoiced.",
      },
      {
        title: "Timestamps auto-stamp on transition",
        detail: "ActualStartTime is stamped automatically when status becomes in_progress; ActualEndTime is stamped when status becomes technically_completed or completed.",
      },
      {
        title: "Cancellation reverts linked jobs",
        detail: "Cancelling a dispatch reverts all its linked ServiceOrderJobs to \"unscheduled\" (skipping jobs already completed or cancelled), returning them to the dispatcher's unassigned queue.",
      },
      {
        title: "Soft delete cascades",
        detail: "DeleteAsync is a soft delete that cascades IsDeleted=true to DispatchJobs and AssignedTechnicians as well as the dispatch itself, recording DeletedAt/DeletedBy.",
      },
      {
        title: "Skill union for matching",
        detail: "RequiredSkills is a case-insensitive union (MergeSkills) of job-level and service-order-level preferred skills.",
      },
      {
        title: "Dispatch numbering with fallback",
        detail: "Dispatch numbers come from INumberingService.GetNextAsync(\"Dispatch\") with a GUID-based fallback generator if numbering fails.",
      },
      {
        title: "ServiceOrder defaults",
        detail: "ServiceOrder.Status defaults to \"draft\" and is tracked separately from PaymentStatus, which defaults to \"pending\".",
      },
    ],
    statuses: [
      { name: "pending", meaning: "Default status of a new Dispatch before assignment or scheduling is finalized." },
      { name: "planned", meaning: "Dispatch created without technicians assigned yet." },
      { name: "assigned", meaning: "Dispatch created with technician(s) already assigned." },
      { name: "in_progress", meaning: "Technician has started the job; ActualStartTime is stamped." },
      { name: "technically_completed", meaning: "Work finished pending final admin sign-off; ActualEndTime stamped." },
      { name: "completed", meaning: "Dispatch fully completed; ActualEndTime stamped; blocks further cancellation." },
      { name: "invoiced", meaning: "Dispatch has been billed; blocks cancellation." },
      { name: "cancelled", meaning: "Dispatch cancelled; not allowed from closed/technically_completed/completed/invoiced states." },
    ],
    integrations: [
      "Dispatcher module — assignment UI writes into Dispatch/ServiceOrderJob records",
      "Scheduling module — reuses the same dispatch update/status endpoints",
      "Workflow Engine — status changes on start/complete fire TriggerStatusChangeAsync for downstream automation, including service-order status propagation",
      "Installations module — installation-mode dispatches group multiple jobs under one dispatch",
    ],
    gotchas: [
      "History endpoints (audit-logs/history) are currently no-ops returning empty arrays / 204, pending a real DispatchHistory entity.",
      "Contact fallback logic silently grabs \"any non-deleted contact\" if neither the DTO nor the service order supplies one — a data-integrity smell.",
      "InstallationId <= 0 is used as a sentinel meaning \"whole service order, not a real installation\" for installation dispatches.",
      "Attachments and time-entries endpoints require multipart/form-data requests.",
      "Multiple dispatches per job are explicitly allowed; only the first dispatch flips job status to \"dispatched\".",
    ],
    sources: [
      "src/modules/field/FieldModule.tsx",
      "Backend/Modules/Dispatches/Models/Dispatch.cs",
      "Backend/Modules/Dispatches/Services/DispatchService.cs",
      "Backend/Modules/Dispatches/Controllers/DispatchesController.cs",
      "Backend/Modules/ServiceOrders/Models/ServiceOrder.cs",
    ],
  },

  calendar: {
    key: "calendar",
    purpose:
      "Calendar is the generic CRM-wide calendar for user-created events — meetings, reminders, tasks — unrelated to a specific email account. It is distinct from the dispatcher/scheduling calendars (technician job scheduling) and from email-calendar's externally-synced calendar; a unified feed merges native CRM events with externally-synced ones for display.",
    workflows: [
      {
        name: "Create and manage an event",
        steps: [
          "User opens CalendarPage in month/year/list view.",
          "User creates an event via EventDialog, optionally assigning an event type via EventTypeManager.",
          "Event is saved through calendar.service.ts / calendarApi.ts.",
          "User drills into a specific day via DayEventsModal/DayEventsPopover to view or edit events.",
        ],
      },
      {
        name: "View a unified feed of native and synced events",
        steps: [
          "unifiedCalendar.service.ts fetches native CRM CalendarEvents and externally-synced events from email-calendar.",
          "Both sets are merged into a single feed rendered by CalendarPage.",
        ],
      },
    ],
    rules: [
      {
        title: "List endpoints skip eager loading",
        detail: "GetAllEventsAsync/GetEventsByDateRangeAsync/GetEventsByContactAsync deliberately drop Include-based eager loading for performance; only the single-entity detail fetch eager-loads Contact, EventTypeNavigation, EventAttendees, and EventReminders.",
      },
      {
        title: "No pagination on list endpoints",
        detail: "GetAllEventsAsync has no pagination, flagged directly in code comments as needing pagination \"in production\" — a known scale risk.",
      },
    ],
    integrations: [
      "Email-Calendar module — its externally-synced events are merged into the unified calendar feed",
      "Contact module — events can be eager-loaded with a linked Contact",
    ],
    gotchas: [
      "Because list endpoints have no pagination, large event volumes could degrade calendar load performance.",
      "Do not confuse this module with the dispatcher/scheduling calendars, which manage technician job time, not general CRM events.",
    ],
    sources: [
      "src/modules/calendar/plugin.ts",
      "src/modules/calendar/components/CalendarPage.tsx",
      "src/modules/calendar/services/unifiedCalendar.service.ts",
      "Backend/Modules/Calendar/Services/CalendarService.cs",
    ],
  },

  "email-calendar": {
    key: "email-calendar",
    purpose:
      "Email-Calendar connects external email/calendar accounts (Gmail, Outlook/Microsoft, or custom IMAP/SMTP) to the CRM via OAuth or stored credentials, syncing inbound/outbound mail and calendar events, and provides a compose/send UI plus account settings. It supports two-way sync for star/delete actions and can push newly created CRM events onto the connected external calendar.",
    workflows: [
      {
        name: "Connect an OAuth email/calendar account",
        steps: [
          "User starts the connect flow from ConnectedAccountsTab, choosing Google or Microsoft.",
          "GetOAuthConfigAsync returns the provider's client id, scopes, and redirect URI from configuration.",
          "User authorizes on the provider's consent screen and is redirected back to OAuthCallbackPage with code/state query params.",
          "HandleOAuthCallbackAsync exchanges the code for tokens (Google token endpoint, or Microsoft Graph token + user-email lookup).",
          "If a ConnectedEmailAccount already exists for that provider/email, its tokens are updated in place; otherwise a new account row is inserted.",
        ],
      },
      {
        name: "Sync emails and calendar events",
        steps: [
          "SyncEmailsAsync pages through provider messages (Gmail API or Outlook/Graph), extracting headers, MIME parts, and attachments into SyncedEmail/SyncedEmailAttachment.",
          "SyncCalendarAsync walks Google Calendar or Outlook calendar items into SyncedCalendarEvent records, including attendees and attachments.",
          "EmailBlocklistItem entries filter out unwanted senders/domains from ingestion.",
        ],
      },
      {
        name: "Reconnect a broken account",
        steps: [
          "User triggers reconnect from ConnectedAccountsTab when a connection is stale or revoked.",
          "ReconnectAccountAsync re-runs the OAuth exchange to refresh tokens for the existing account.",
        ],
      },
      {
        name: "Connect a custom IMAP/SMTP account",
        steps: [
          "User opens CustomEmailConfigDialog and enters manual server credentials.",
          "Backend stores the account as a CustomEmailAccount and polls it via IMAP/SMTP instead of OAuth.",
        ],
      },
    ],
    rules: [
      {
        title: "Provider-specific OAuth config",
        detail: "GetOAuthConfigAsync returns client id/scopes/redirect URI per provider (\"google\" or \"microsoft\") sourced from OAuth:Google:* / OAuth:Microsoft:* configuration.",
      },
      {
        title: "Existing account is updated, not duplicated",
        detail: "If a ConnectedEmailAccount already exists for the callback's provider/email, HandleOAuthCallbackAsync updates its AccessToken/tokens on that row rather than creating a new one.",
      },
      {
        title: "Reconnect re-runs full OAuth exchange",
        detail: "ReconnectAccountAsync is a dedicated recovery path that repeats the OAuth code exchange for a stale/broken connection.",
      },
      {
        title: "Custom accounts bypass OAuth entirely",
        detail: "CustomEmailAccount records use stored IMAP/SMTP credentials directly, a materially different trust/security model from OAuth-connected accounts.",
      },
      {
        title: "Two-way sync for star/delete",
        detail: "Star/delete actions performed in the CRM are mirrored back to the provider via EmailAccountService_StarDeleteMethods, not kept CRM-local only.",
      },
      {
        title: "CRM can push events to the external calendar",
        detail: "EmailAccountService_CreateCalendarEvent allows creating events on the connected external calendar from within the CRM via CreateExternalCalendarEventDto.",
      },
      {
        title: "Outbound sends are audited",
        detail: "EmailAccountService_SendMethods implements provider-specific send (Gmail/Graph/custom SMTP) and records every send in an OutboundEmailLog audit trail.",
      },
      {
        title: "Blocklist filters ingestion",
        detail: "EmailBlocklistItem entries prevent mail from specified senders/domains from being synced into the CRM.",
      },
    ],
    integrations: [
      "Calendar module — synced external events feed into the unified calendar view",
      "Gmail / Google Calendar API — OAuth token exchange and message/event sync",
      "Microsoft Graph API — OAuth token exchange and mail/calendar sync for Outlook accounts",
      "IMAP/SMTP servers — for custom (non-OAuth) email accounts",
    ],
    gotchas: [
      "Duplicate-account handling relies on matching by provider+account in code, not a visible unique DB constraint.",
      "Custom (IMAP/SMTP) accounts store raw credentials and skip the OAuth trust model — treat them as higher-risk.",
      "Token refresh failure recovery depends on the user manually triggering Reconnect; there is no described automatic retry.",
    ],
    sources: [
      "Backend/Modules/EmailAccounts/Services/EmailAccountService.cs",
      "Backend/Modules/EmailAccounts/Services/EmailAccountService_SyncMethods.cs",
      "Backend/Modules/EmailAccounts/Services/EmailAccountService_CustomSync.cs",
      "Backend/Modules/EmailAccounts/Services/EmailAccountService_SendMethods.cs",
      "Backend/Modules/EmailAccounts/Services/EmailAccountService_StarDeleteMethods.cs",
      "Backend/Modules/EmailAccounts/Services/EmailAccountService_CreateCalendarEvent.cs",
      "src/modules/email-calendar/components/EmailCalendarPage.tsx",
      "src/modules/email-calendar/OAuthCallbackPage.tsx",
    ],
  },

  communication: {
    key: "communication",
    purpose:
      "Communication is a placeholder/aggregator module intended as a future communications hub. The current codebase contains only the plugin manifest, module shell (CommunicationModule.tsx), types, and locale files — no components, services, hooks, or backend controller exist under this module name. Actual messaging capability today lives in the email-calendar module (email) and other modules such as notifications, not here.",
    workflows: [],
    rules: [
      {
        title: "No routes are registered",
        detail: "plugin.ts declares routes: [], so this module has no navigable pages.",
      },
      {
        title: "No backend module exists",
        detail: "There is no corresponding Communication module under Backend/Modules/*; do not assume any server-side messaging logic lives here.",
      },
      {
        title: "Scaffolding only",
        detail: "CommunicationModule.tsx contains only a stub/shell with no implemented business logic beyond type definitions in types.ts.",
      },
    ],
    integrations: [
      "None implemented — messaging today is handled by email-calendar (email) and notifications (in-app alerts)",
    ],
    gotchas: [
      "Do not document or link this module as an active messaging hub — it is scaffolding only, pending future implementation.",
    ],
    sources: [
      "src/modules/communication/plugin.ts",
      "src/modules/communication/CommunicationModule.tsx",
      "src/modules/communication/types.ts",
    ],
  },

  notifications: {
    key: "notifications",
    purpose:
      "Notifications is the in-app notification center — bell icon, unread badge, and notification feed — plus a server-side API used by other modules (sales, offers, service orders, tasks) to push user alerts. It is rendered as a dropdown/panel rather than a routed page.",
    workflows: [
      {
        name: "View and manage notifications",
        steps: [
          "User opens the notification bell/dropdown, which loads GetUserNotificationsAsync with pagination, plus UnreadCount and TotalCount.",
          "User marks one or several notifications as read (MarkAsReadAsync/MarkMultipleAsReadAsync), stamping ReadAt.",
          "User can mark all notifications as read at once, or delete an individual notification.",
        ],
      },
      {
        name: "System generates a notification on a business event",
        steps: [
          "A module (Sales, Offers, Service Orders, Tasks) triggers the corresponding Generate*NotificationAsync method.",
          "If an assignedUserId is provided, the notification targets that user; otherwise it fans out to all admin users via GetAdminUserIdsAsync.",
          "BulkCreateNotificationsAsync batches the inserts for multi-recipient fan-out.",
          "Notification includes a Link to the relevant record (e.g. /dashboard/sales/{id}).",
        ],
      },
    ],
    rules: [
      {
        title: "Fan-out to admins when unassigned",
        detail: "Sale and Offer notifications target the assignedUserId if given, otherwise all admin users (via MainAdminUsers) receive the notification.",
      },
      {
        title: "Task due/overdue notifications are warnings",
        detail: "GenerateTaskDueNotificationAsync and GenerateTaskOverdueNotificationAsync create notifications with type \"warning\".",
      },
      {
        title: "Task-assigned link depends on context",
        detail: "GenerateTaskAssignedNotificationAsync varies its link target depending on whether the task belongs to a project.",
      },
      {
        title: "Read state is timestamped",
        detail: "Marking a notification read (single, multiple, or all) stamps ReadAt on the affected rows rather than only flipping a boolean.",
      },
      {
        title: "No de-duplication / idempotency",
        detail: "There is no idempotency key on notification generation — a retried workflow trigger (e.g. re-running a status change) will create duplicate notifications.",
      },
    ],
    integrations: [
      "Sales module — new Sale triggers a notification linking to /dashboard/sales/{id}",
      "Offers module — new Offer triggers a notification linking to /dashboard/offers/{id}",
      "Field/Service Orders module — new Service Order triggers a notification linking to /dashboard/field/service-orders/{id}",
      "Tasks module — due, overdue, and assignment events all generate notifications",
    ],
    gotchas: [
      "Admin fan-out notifications can create large bulk-insert bursts if many admins exist and no assignedUserId is supplied.",
      "Repeated trigger calls (e.g. a retried workflow) will produce duplicate notifications since there is no idempotency guard.",
    ],
    sources: [
      "Backend/Modules/Notifications/Services/NotificationService.cs",
      "Backend/Modules/Notifications/Controllers/NotificationsController.cs",
      "src/modules/notifications/NotificationsModule.tsx",
    ],
  },

  support: {
    key: "support",
    purpose:
      "Support is the end-user and admin support-ticket system with FAQ browsing, an AI chat assistant (GPT), manual ticket creation, and an admin dashboard with KPIs and charts. It also auto-ingests system errors as tickets (via Source/ErrorFingerprint/SystemLogId fields) for incident tracking, deduplicating repeated errors into a single ticket rather than flooding the queue.",
    workflows: [
      {
        name: "Create and track a support ticket",
        steps: [
          "User opens tickets/new (NewTicketForm) and submits a description, optionally referencing entities like #SO-123 which entityLinkParser renders as clickable chips.",
          "Ticket is created with Status \"open\" and Source \"manual\".",
          "User views their tickets in MyTicketsPage, and opens TicketDetails for comments, attachments, and entity links.",
          "User or agent can chat with the AI assistant (GPTChat) within the ticket for help.",
        ],
      },
      {
        name: "Agent works a ticket with internal notes",
        steps: [
          "Agent opens TicketDetails and adds a SupportTicketComment.",
          "Agent sets IsInternal on comments meant only for other agents, hidden from the customer.",
          "Agent can link related tickets via SupportTicketLink (default LinkType \"related\"), e.g. to mark duplicates.",
        ],
      },
      {
        name: "System auto-generates an incident ticket",
        steps: [
          "A system error occurs and is captured with an ErrorFingerprint, SystemLogId, IncidentType, and Module.",
          "If a ticket with a matching ErrorFingerprint already exists, OccurrenceCount increments and LastOccurredAt updates instead of creating a duplicate ticket.",
          "Otherwise a new ticket is created with Source \"auto\".",
        ],
      },
      {
        name: "External user files a public ticket",
        steps: [
          "An unauthenticated user submits a ticket through the public-facing surface (PublicTicketsController), distinct from the authenticated ticket flow.",
        ],
      },
    ],
    rules: [
      {
        title: "Default ticket status and source",
        detail: "SupportTicket.Status defaults to \"open\"; Source defaults to \"manual\" but can be \"auto\" for system-generated tickets.",
      },
      {
        title: "Auto-generated tickets deduplicate by fingerprint",
        detail: "System-generated tickets carry ErrorFingerprint, SystemLogId, IncidentType, and Module; OccurrenceCount (default 1) and LastOccurredAt track repeats of the same fingerprint on one ticket instead of creating duplicates.",
      },
      {
        title: "Internal vs customer-visible comments",
        detail: "SupportTicketComment.IsInternal separates customer-visible notes from internal/agent-only notes.",
      },
      {
        title: "Ticket linking is self-referencing",
        detail: "SupportTicketLink links SourceTicketId to TargetTicketId on the same table with a LinkType (default \"related\"), used e.g. for duplicate/merge relationships.",
      },
      {
        title: "Public vs authenticated ticket surfaces",
        detail: "PublicTicketsController exposes an unauthenticated ticket-submission surface, kept separate from the authenticated SupportTicketsController.",
      },
      {
        title: "Entity references are parsed from descriptions",
        detail: "entityLinkParser scans ticket descriptions for embedded entity references (e.g. #SO-123) and renders them as clickable EntityLink chips.",
      },
    ],
    statuses: [
      { name: "open", meaning: "Default status of a newly created ticket." },
    ],
    integrations: [
      "System logging / error tracking — auto-generates tickets from system errors via SystemLogId/ErrorFingerprint",
      "GPT-based AI assistant — provides in-ticket chat support (GPTChat)",
      "Any entity referenced in a ticket description (e.g. Service Orders) — rendered as clickable links via entityLinkParser",
    ],
    gotchas: [
      "Fingerprint matching for auto-generated tickets is not reviewed in depth; if too coarse it over-merges unrelated errors, if too strict it floods the queue with near-duplicate tickets.",
      "SupportTicketLink has no visible uniqueness constraint, so the same ticket pair could be linked multiple times with different LinkTypes.",
    ],
    sources: [
      "src/modules/support/SupportModuleRoutes.tsx",
      "src/modules/support/utils/entityLinkParser.ts",
      "src/modules/support/services/supportService.ts",
      "Backend/Modules/SupportTickets/Models/SupportTicket.cs",
      "Backend/Modules/SupportTickets/Controllers/PublicTicketsController.cs",
    ],
  },
};

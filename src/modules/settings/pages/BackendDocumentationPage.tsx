import { useMemo, useState } from "react";
import { ArrowLeft, Search, Server, Database, Shield, Zap, Code2, Cpu, FileCode, Boxes, Table as TableIcon, KeyRound } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { DB_TABLES, type DbTable } from "../data/dbTables";

type BackendModule = {
  key: string;
  name: string;
  category: string;
  description: string;
  controllers: string[];
  /** Top REST endpoints exposed (route prefix + verbs) */
  endpoints: string[];
  /** Main EF Core entities */
  models: string[];
  /** Domain services */
  services: string[];
  /** Cross-cutting concerns and notes */
  notes?: string[];
};

const BACKEND_MODULES: BackendModule[] = [
  {
    key: "auth", name: "Authentication & OAuth", category: "Identity",
    description: "JWT-based auth for MainAdminUsers (id=1) and tenant Users (id≥2). Password hashing (BCrypt), refresh tokens, OAuth (Google, Microsoft) and tenant resolution from JWT claims.",
    controllers: ["AuthController", "OAuthCallbackController"],
    endpoints: [
      "POST /api/auth/login — email + password",
      "POST /api/auth/register — tenant signup",
      "POST /api/auth/refresh — rotate refresh token",
      "POST /api/auth/logout — revoke session",
      "GET  /api/auth/profile — current claims",
      "GET  /api/oauth/{provider}/callback — Google / Microsoft",
    ],
    models: ["RefreshToken"],
    services: ["AuthService"],
    notes: ["Bearer JWT carries TenantId, UserId, UserType, Role", "Refresh tokens rotated on each use"],
  },
  {
    key: "users", name: "Users & MainAdminUsers", category: "Identity",
    description: "Tenant-scoped user directory with role assignment, profile picture, status and last-login tracking. MainAdminUser is the tenant root (id=1) with implicit super-admin permissions.",
    controllers: ["UsersController"],
    endpoints: [
      "GET    /api/users — list (paged, search, role)",
      "POST   /api/users — invite/create",
      "PUT    /api/users/{id} — update profile/role",
      "DELETE /api/users/{id} — soft-delete",
      "POST   /api/users/{id}/reset-password",
      "POST   /api/users/{id}/avatar — upload",
    ],
    models: ["User", "MainAdminUser", "UserSession", "UserPreference"],
    services: ["UsersService", "UserPreferencesService"],
  },
  {
    key: "roles", name: "Roles & Permissions", category: "Identity",
    description: "RBAC with granular permissions per module/action. Permissions broadcast on change so sidebars refresh live across sessions.",
    controllers: ["RolesController", "PermissionsController"],
    endpoints: [
      "GET  /api/roles, POST /api/roles, PUT /api/roles/{id}",
      "GET  /api/permissions — full permission catalog",
      "POST /api/roles/{id}/permissions — bulk-set",
    ],
    models: ["Role", "Permission", "RolePermission"],
    services: ["RolesService", "PermissionsService", "PermissionCatalogService", "PermissionBroadcastService"],
  },
  {
    key: "tenants", name: "Tenants (Multi-tenancy)", category: "Identity",
    description: "Multi-tenant isolation. Every business entity implements ITenantEntity; a global EF query filter scopes reads to the current TenantId from JWT. Tenants resolved by slug or ID with TenantSlugCache.",
    controllers: ["TenantsController"],
    endpoints: [
      "GET  /api/tenants — list (super-admin)",
      "POST /api/tenants — provision new tenant",
      "PUT  /api/tenants/{id} — update branding/limits",
    ],
    models: ["Tenant"],
    services: ["TenantsService"],
    notes: ["TenantDbContextFactory injects tenant filter", "TenantSlugCache reduces DB roundtrips"],
  },
  {
    key: "contacts", name: "Contacts CRM", category: "CRM",
    description: "Persons, Companies and Suppliers with fiscal IDs (CIN, Matricule Fiscale), geolocation (lat/lng), tags, notes and a 360° history join.",
    controllers: ["ContactsController", "ContactNotesController", "ContactTagsController"],
    endpoints: [
      "GET  /api/contacts — paged, search, type/status filters",
      "POST /api/contacts, PUT /api/contacts/{id}, DELETE soft-delete",
      "GET  /api/contacts/{id}/history — offers/sales/SOs/installations",
      "GET/POST /api/contactnotes, /api/contacttags",
      "POST /api/contacts/import — CSV/XLSX bulk import",
    ],
    models: ["Contact", "ContactNote", "ContactTag", "ContactTagAssignment"],
    services: ["ContactsService", "ContactNotesService", "ContactTagsService", "ContactImportService", "ContactGeocodingService", "ContactHistoryService"],
  },
  {
    key: "articles", name: "Articles, Stock & Article Groups", category: "Inventory",
    description: "Materials/products with multi-location stock, min/max thresholds, supplier links, barcodes and a fully-audited stock transaction log (sales, offers, GR, transfers, manual adjustments).",
    controllers: ["ArticlesController", "ArticleGroupsController", "StockTransactionController"],
    endpoints: [
      "GET/POST/PUT/DELETE /api/articles",
      "GET /api/articles/low-stock, /api/articles/{id}/stock-history",
      "POST /api/articles/{id}/adjust — replenish/deduct",
      "GET/POST /api/articlegroups (lookup-backed)",
      "GET /api/stocktransactions — full audit",
    ],
    models: ["Article", "ArticleGroup", "ArticleNote", "StockTransaction", "StockLocation", "ArticleSupplierLink"],
    services: ["ArticlesService", "StockTransactionService", "LowStockNotificationService", "ArticleImportService"],
  },
  {
    key: "offers", name: "Offers / Quotations", category: "Sales",
    description: "Quotation pipeline: Draft → Sent → Accepted/Rejected. PDF generation, public link sharing, conversion to Sale or Service Order, fiscal stamp and Retenue à la Source (RS) compliance.",
    controllers: ["OffersController"],
    endpoints: [
      "GET/POST/PUT/DELETE /api/offers",
      "POST /api/offers/{id}/send — email + sentCount++",
      "POST /api/offers/{id}/convert/sale | /service-order",
      "GET  /api/offers/{id}/pdf, /public/offers/{token}",
    ],
    models: ["Offer", "OfferItem", "OfferAuditLog"],
    services: ["OffersService", "OfferPdfService"],
  },
  {
    key: "sales", name: "Sales & Invoicing", category: "Sales",
    description: "Invoices and sales documents with TVA, fiscal stamp, RS withholding, payment tracking, multi-currency and numbering system integration.",
    controllers: ["SalesController"],
    endpoints: [
      "GET/POST/PUT/DELETE /api/sales",
      "POST /api/sales/{id}/payment — record payment",
      "GET  /api/sales/{id}/pdf, /api/sales/export",
    ],
    models: ["Sale", "SaleItem", "SalePayment"],
    services: ["SalesService", "SalePdfService"],
  },
  {
    key: "purchases", name: "Purchases (PO, GR, Supplier Invoices)", category: "Procurement",
    description: "Full procurement loop: Purchase Order → Goods Receipt → Supplier Invoice. Each GR posts stock movements; supplier invoices tie back to PO lines for 3-way matching.",
    controllers: ["PurchaseOrdersController", "GoodsReceiptsController", "SupplierInvoicesController", "ArticleSuppliersController"],
    endpoints: [
      "GET/POST/PUT/DELETE /api/purchaseorders",
      "POST /api/goodsreceipts (auto-creates StockTransactions)",
      "GET/POST /api/supplierinvoices",
      "GET/POST /api/articlesuppliers — supplier price catalog",
    ],
    models: ["PurchaseOrder", "PurchaseOrderItem", "GoodsReceipt", "GoodsReceiptItem", "SupplierInvoice", "SupplierInvoiceItem", "ArticleSupplier"],
    services: ["PurchaseOrdersService", "GoodsReceiptsService", "SupplierInvoicesService", "ArticleSuppliersService", "PurchasePdfService"],
  },
  {
    key: "projects", name: "Projects & Tasks", category: "Productivity",
    description: "Project management with kanban columns, recurring tasks, checklists, comments, attachments, time entries and per-project settings/notes/activity feed.",
    controllers: [
      "ProjectsController", "TasksController", "ProjectColumnsController",
      "RecurringTasksController", "TaskAttachmentsController", "TaskChecklistsController",
      "TaskCommentsController", "TaskTimeEntriesController",
    ],
    endpoints: [
      "GET/POST/PUT/DELETE /api/projects, /api/tasks",
      "GET/POST /api/projectcolumns — kanban board",
      "POST /api/tasks/{id}/checklists | /comments | /attachments | /time-entries",
      "GET/POST /api/recurringtasks — cron-backed task generation",
    ],
    models: [
      "Project", "ProjectTask", "ProjectColumn", "ProjectSettings", "ProjectNote", "ProjectActivity",
      "RecurringTask", "TaskChecklist", "TaskComment", "TaskAttachment", "TaskTimeEntry",
    ],
    services: ["ProjectsService", "TasksService (+ kanban, recurring, time, checklist, comment, attachment subservices)"],
  },
  {
    key: "calendar", name: "Calendar & Events", category: "Productivity",
    description: "Multi-source calendar: native events + synced Google/Outlook + recurring rules. Event types, all-day support and per-user color coding.",
    controllers: ["CalendarController"],
    endpoints: [
      "GET  /api/calendar?from=&to=",
      "POST /api/calendar/events, PUT, DELETE",
      "GET  /api/calendar/synced — external feeds",
    ],
    models: ["CalendarEvent", "EventType", "SyncedCalendarEvent", "RecurrenceRule"],
    services: ["CalendarService", "RecurrenceExpander"],
  },
  {
    key: "email-accounts", name: "Email Accounts (IMAP/SMTP/Custom)", category: "Communication",
    description: "Connect tenant mailboxes (IMAP, SMTP, OAuth Google/Microsoft, custom relay). Background sync of folders, threads, attachments. Send via per-tenant SMTP or Lovable transactional gateway.",
    controllers: ["EmailAccountsController", "CustomEmailController", "EmailAccountsController_SyncEndpoints"],
    endpoints: [
      "GET/POST /api/emailaccounts",
      "POST /api/emailaccounts/{id}/sync — manual trigger",
      "GET  /api/emailaccounts/{id}/messages?folder=",
      "POST /api/emailaccounts/send",
    ],
    models: ["EmailAccount", "SyncedEmail", "SyncedEmailAttachment", "EmailFolder", "EmailDraft", "EmailTemplate"],
    services: [
      "EmailAccountsService", "ImapSyncService", "SmtpSenderService",
      "GoogleOAuthEmailService", "MicrosoftOAuthEmailService", "AttachmentExtractor",
      "EmailFolderService", "EmailTemplatesService", "CustomEmailRelayService",
    ],
  },
  {
    key: "documents", name: "Documents & File Resources", category: "Productivity",
    description: "Polymorphic document store: linked to any module entity (contacts, sales, projects, tickets…). Files stored in DB or external links; per-document comments and share links (internal/external, view/download, expiry, max-access).",
    controllers: ["DocumentsController"],
    endpoints: [
      "POST /api/documents/upload — multipart",
      "GET  /api/documents?moduleType=&moduleId=",
      "POST /api/documents/{id}/share — generate link",
      "GET  /api/documents/share/{linkId} — public access",
    ],
    models: ["Document", "DocumentComment", "DocumentShareLink", "FileResource"],
    services: [],
    notes: ["UploadController / UploadThingController in Shared handle binary streams"],
  },
  {
    key: "dispatches", name: "Field Dispatch", category: "Field Service",
    description: "Field service work orders dispatched to technicians with scheduled time, materials, signatures and status workflow. Soft-delete and SignalR realtime updates.",
    controllers: ["DispatchesController"],
    endpoints: [
      "GET/POST/PUT/DELETE /api/dispatches",
      "POST /api/dispatches/{id}/assign, /complete, /cancel",
      "POST /api/dispatches/{id}/materials, /signature",
    ],
    models: ["Dispatch", "DispatchItem", "DispatchSignature", "DispatchJob", "DispatchAssignment", "DispatchStatusHistory", "DispatchPhoto", "DispatchNote"],
    services: ["DispatchesService", "DispatchJobsService"],
  },
  {
    key: "service-orders", name: "Service Orders & Installations", category: "Field Service",
    description: "Long-running service jobs and installations linked to a contact + assets. Tracks materials issued, hours, sub-tasks and customer sign-off.",
    controllers: ["ServiceOrdersController", "InstallationsController", "InstallationNotesController"],
    endpoints: [
      "GET/POST/PUT/DELETE /api/serviceorders",
      "POST /api/serviceorders/{id}/materials",
      "GET/POST /api/installations, /api/installationnotes",
    ],
    models: ["ServiceOrder", "ServiceOrderItem", "ServiceOrderMaterial", "ServiceOrderHistory", "Installation", "InstallationNote"],
    services: ["ServiceOrdersService", "InstallationsService"],
  },
  {
    key: "planning", name: "Planning & Scheduling", category: "Field Service",
    description: "Resource planner — assign technicians to jobs across a calendar grid with skill matching and conflict detection.",
    controllers: ["PlanningController"],
    endpoints: [
      "GET  /api/planning?from=&to=&resource=",
      "POST /api/planning/assignments, PUT, DELETE",
    ],
    models: ["PlanningSlot", "PlanningResource", "TechnicianAvailability", "PlanningConflict", "PlanningTemplate"],
    services: ["PlanningService", "ConflictDetectionService"],
  },
  {
    key: "hr", name: "HR (Employees, Leaves, Attendance, Payroll)", category: "HR",
    description: "Full HR suite: employees, contracts, leaves, attendance, payslips, addresses, dependents, training. Includes ContractTracking and Round1/Round2 attendance logic.",
    controllers: ["HrController"],
    endpoints: [
      "GET/POST /api/hr/employees, /contracts, /leaves, /attendance, /payslips, /trainings, /dependents",
      "POST /api/hr/leaves/{id}/approve | /reject",
      "POST /api/hr/attendance/clock-in | /clock-out",
    ],
    models: [
      "Employee", "EmployeeContract", "Leave", "LeaveBalance", "AttendanceRecord", "AttendancePeriod",
      "Payslip", "PayslipLine", "Department", "Position", "Dependent", "Training",
      "TrainingAssignment", "EmployeeAddress", "EmergencyContact", "Document", "Asset",
      "PerformanceReview", "DisciplinaryAction", "ExitInterview",
    ],
    services: ["HrService", "PayrollCalculator", "AttendanceAggregator"],
  },
  {
    key: "skills", name: "Skills Catalog", category: "HR",
    description: "Skills taxonomy used for technician matching in dispatch & planning, and for HR competence tracking.",
    controllers: ["SkillsController"],
    endpoints: ["GET/POST/PUT/DELETE /api/skills"],
    models: ["Skill"],
    services: ["SkillsService", "UserSkillsService"],
  },
  {
    key: "lookups", name: "Lookups (Reference Data)", category: "System",
    description: "Centralized reference data: priorities, statuses, categories, currencies, countries. Editable by admins; consumed across all modules. Includes IsPaid flag for paid statuses.",
    controllers: ["LookupsController", "PreferencesController"],
    endpoints: [
      "GET /api/lookups/{type} — e.g. priorities, project-statuses, currencies",
      "POST/PUT/DELETE /api/lookups/{type}/{id} — admin only",
    ],
    models: ["LookupItem", "LookupCategory", "Currency", "Country"],
    services: ["LookupsService", "LookupSeedService", "CurrencyService", "CountryService"],
  },
  {
    key: "numbering", name: "Document Numbering", category: "System",
    description: "Per-tenant document numbering sequences (offers, sales, POs, GRs, invoices…). Configurable prefix, padding, yearly reset, separator. Atomic counter with row-level locking.",
    controllers: ["NumberingController"],
    endpoints: [
      "GET /api/numbering — list configs",
      "PUT /api/numbering/{entity} — update format",
      "POST /api/numbering/{entity}/next — reserve next number",
    ],
    models: ["NumberingSequence", "NumberingConfig"],
    services: ["NumberingService", "NumberingSeedService"],
  },
  {
    key: "preferences", name: "User & Tenant Preferences", category: "System",
    description: "Per-user UI preferences (theme, sidebar mode, default view, table density) and per-tenant PDF/branding settings (logo, header, footer, color, paper size, signature image).",
    controllers: ["PreferencesController", "PdfSettingsController"],
    endpoints: [
      "GET/PUT /api/preferences/me",
      "GET/PUT /api/preferences/admin",
      "GET/PUT /api/pdfsettings",
    ],
    models: ["UserPreference", "PdfSettings"],
    services: ["PreferencesService", "AdminPreferencesService", "PdfSettingsService", "BrandingService"],
  },
  {
    key: "settings", name: "App Settings (Key-Value)", category: "System",
    description: "Tenant-scoped key/value app settings (feature flags, defaults, integration toggles).",
    controllers: ["AppSettingsController"],
    endpoints: [
      "GET /api/settings/app, GET /api/settings/app/{key}",
      "PUT /api/settings/app/{key} — admin only",
    ],
    models: ["AppSetting"],
    services: ["AppSettingsService", "AppSettingsCache"],
  },
  {
    key: "plugins", name: "Plugins (Module Activation)", category: "System",
    description: "Per-tenant module activation. Server-side enforcement (cannot bypass via URL). Activation events broadcast over SignalR so the sidebar refreshes live.",
    controllers: ["PluginsController"],
    endpoints: [
      "GET /api/plugins — catalog",
      "POST /api/plugins/{code}/activate | /deactivate",
    ],
    models: ["PluginActivation"],
    services: ["PluginsService", "PluginGuard"],
  },
  {
    key: "notifications", name: "Notifications", category: "System",
    description: "In-app notifications with realtime push (SignalR), per-user inbox, read/unread, optional email mirroring.",
    controllers: ["NotificationsController"],
    endpoints: [
      "GET  /api/notifications?unread=",
      "POST /api/notifications/mark-read",
      "Hub:  /hubs/notifications (SignalR)",
    ],
    models: ["Notification"],
    services: ["NotificationsService", "NotificationDispatcher"],
  },
  {
    key: "support", name: "Support Tickets", category: "System",
    description: "Helpdesk tickets with comments, attachments, status workflow, priority and SLA tracking. Public submission link.",
    controllers: ["SupportTicketsController"],
    endpoints: [
      "GET/POST/PUT /api/supporttickets",
      "POST /api/supporttickets/{id}/comment, /attachment, /close",
    ],
    models: ["SupportTicket"],
    services: [],
  },
  {
    key: "dynamic-forms", name: "Dynamic Forms (Form Builder)", category: "Productivity",
    description: "Drag-and-drop form builder with bilingual content, public submission URL, response export to PDF/CSV, and 'Export to Entity' to push answers into another module.",
    controllers: ["DynamicFormsController", "PublicFormsController"],
    endpoints: [
      "GET/POST/PUT/DELETE /api/dynamicforms",
      "POST /api/dynamicforms/{id}/release | /archive",
      "POST /public/forms/{slug} — anonymous submission",
      "GET  /api/dynamicforms/{id}/responses — paged",
    ],
    models: ["DynamicForm"],
    services: ["DynamicFormsService", "FormResponseExporter"],
  },
  {
    key: "signatures", name: "E-Signatures", category: "System",
    description: "Capture signatures on offers, dispatch reports, service orders. Stored as base64 + metadata (signer, IP, timestamp).",
    controllers: ["SignaturesController"],
    endpoints: ["GET/POST /api/signatures", "GET /api/signatures/{entity}/{id}"],
    models: ["Signature"],
    services: ["SignaturesService", "SignatureRenderService"],
  },
  {
    key: "external-endpoints", name: "External Endpoints (Inbound Webhooks)", category: "Integration",
    description: "Tenant-defined inbound webhook endpoints with API-key auth, allowed methods, schema validation, response templates, optional forward URL and retention window. Logs every request and supports converting payloads into CRM entities (contacts/offers).",
    controllers: ["ExternalEndpointsController", "ExternalReceiveController"],
    endpoints: [
      "GET/POST/PUT/DELETE /api/external-endpoints",
      "GET  /api/external-endpoints/{id}/logs",
      "GET  /api/external-endpoints/{id}/logs/{logId}/convert-preview",
      "POST /api/external-endpoints/{id}/logs/{logId}/convert",
      "ANY  /external/{slug}/{tenant} — public ingress (API-key)",
    ],
    models: ["ExternalEndpoint", "ExternalEndpointLog", "WebhookForwardJob"],
    services: ["ExternalEndpointsService", "ExternalReceiveService", "WebhookForwarder", "LogPruningSweep"],
  },
  {
    key: "workflow", name: "Workflow Engine", category: "Operations",
    description: "Visual workflow engine with triggers (entity created/updated, schedule, webhook, event), conditions, and 15+ action node types (HTTP, AI, code, email, dynamic form, data transfer, approval, branch, wait, loop). Includes approvals inbox and reconciliation/replay.",
    controllers: ["WorkflowDefinitionsController", "WorkflowExecutionsController", "WorkflowApprovalsController", "WorkflowReconciliationController"],
    endpoints: [
      "GET/POST/PUT /api/workflows — definitions",
      "POST /api/workflows/{id}/run — manual trigger",
      "GET  /api/workflows/executions — paged history",
      "GET/POST /api/workflows/approvals — pending approvals",
      "POST /api/workflows/reconcile — replay missed",
    ],
    models: ["WorkflowDefinition", "WorkflowExecution", "WorkflowStepLog", "WorkflowApproval", "WorkflowProcessedEntity", "WorkflowSchedule"],
    services: [
      "WorkflowEngine", "TriggerDispatcher", "NodeExecutor (15+ node handlers)",
      "ApprovalsService", "ReconciliationService", "ScheduleService",
      "AiNodeService", "HttpNodeService", "CodeSandboxService", "DataTransferService",
      "EventBus", "ConditionEvaluator", "ExpressionEngine", "RetryPolicy", "DeadLetterQueue",
      "ApprovalNotifier", "ExecutionTracer",
    ],
  },
  {
    key: "ai-chat", name: "AI Chat & Wish Generator", category: "Insights",
    description: "Local LLM (Ollama) and cloud (OpenRouter) chat. Streaming SSE responses, conversation history per user, token accounting and provider fallback.",
    controllers: ["AiChatController", "GenerateWishController"],
    endpoints: [
      "POST /api/aichat — non-streaming",
      "POST /api/aichat/stream — SSE",
      "POST /api/GenerateWish, /api/GenerateWish/stream",
    ],
    models: ["AiChatHistory", "AiChatMessage"],
    services: ["IOllamaService", "OllamaService", "OpenRouterService", "AiHistoryService"],
  },
  {
    key: "user-ai-settings", name: "User AI Settings", category: "Insights",
    description: "Per-user AI provider, model, API key (encrypted), temperature and system prompt overrides.",
    controllers: ["UserAiSettingsController"],
    endpoints: ["GET/PUT /api/user-ai-settings/me", "GET /api/user-ai-settings/models"],
    models: ["UserAiSettings", "AiProviderConfig"],
    services: ["UserAiSettingsService", "ApiKeyEncryptor"],
  },
  {
    key: "dashboards", name: "Dashboards (Builder)", category: "Insights",
    description: "Custom dashboards: layout JSON, widget config, sharing token, public URL. Proxy to external APIs for widget data.",
    controllers: ["DashboardsController", "ExternalApiProxyController"],
    endpoints: [
      "GET/POST/PUT/DELETE /api/Dashboards",
      "POST /api/Dashboards/{id}/duplicate",
      "POST /api/external-api/proxy — fetch external JSON server-side",
    ],
    models: ["Dashboard"],
    services: [],
  },
  {
    key: "website-builder", name: "Website Builder", category: "Marketing",
    description: "Multi-page tenant micro-sites (block-based builder). Public URLs at /public/sites/:slug, custom domains, SEO metadata, asset uploads.",
    controllers: ["WBSitesController", "WBPagesController", "WBSupportControllers", "WBUploadController"],
    endpoints: [
      "GET/POST/PUT/DELETE /api/wb/sites, /api/wb/pages",
      "POST /api/wb/upload — site assets",
      "GET  /public/sites/{slug}[/{pageSlug}]",
    ],
    models: ["WBSite", "WBPage", "WBBlock", "WBNavItem", "WBTheme", "WBAsset", "WBForm", "WBFormSubmission", "WBRedirect", "WBDomain"],
    services: ["WBSitesService", "WBPagesService", "WBPublishService", "WBAssetService"],
  },
  {
    key: "payments", name: "Payments", category: "Finance",
    description: "Record customer payments against sales/invoices. Multi-currency, partial payments, refunds, allocation across invoices.",
    controllers: ["PaymentsController"],
    endpoints: [
      "GET/POST /api/payments",
      "POST /api/payments/{id}/refund",
      "GET  /api/payments/sale/{saleId}",
    ],
    models: ["Payment"],
    services: ["PaymentsService", "PaymentAllocationService", "PaymentExportService", "PaymentReceiptPdf"],
  },
  {
    key: "rs", name: "Retenue à la Source (Tax Withholding)", category: "Finance",
    description: "Tunisian tax withholding compliance (Retenue à la Source): rates per article category, certificates, period reports.",
    controllers: ["RSController"],
    endpoints: [
      "GET/POST/PUT /api/rs/rates",
      "GET /api/rs/certificate/{saleId} — generate PDF",
    ],
    models: ["RSRate", "RSCertificate"],
    services: ["RSService", "RSCertificatePdf"],
  },
  {
    key: "offline-hydration", name: "Offline Hydration Preferences", category: "System",
    description: "Per-user preferences for offline-first PWA: which entities to prefetch, cache size, sync interval.",
    controllers: ["OfflineHydrationPreferencesController"],
    endpoints: ["GET/PUT /api/offline-hydration/me"],
    models: ["OfflineHydrationPreference"],
    services: ["OfflineHydrationService", "HydrationPlanner"],
  },
  {
    key: "sync", name: "Sync (Offline Push/Pull)", category: "System",
    description: "Bidirectional sync for offline clients. Push queued mutations, pull server changes since checkpoint, conflict resolution and per-entity sync history with retry.",
    controllers: ["SyncController"],
    endpoints: [
      "POST /api/sync/push — queued ops batch",
      "GET  /api/sync/pull?since= — server delta",
      "GET  /api/sync/history?entity=",
    ],
    models: ["SyncCheckpoint", "SyncOperation", "SyncHistoryEntry"],
    services: ["SyncService", "SyncConflictResolver", "SyncRetryService"],
  },
  {
    key: "shared", name: "Shared Infrastructure", category: "System",
    description: "Cross-cutting controllers: file upload (multipart + UploadThing), system logs, action logs, dev/health endpoints, generic entity-form documents.",
    controllers: ["UploadController", "UploadThingController", "LogsController", "SystemLogsController", "EntityFormDocumentsController", "DevController"],
    endpoints: [
      "POST /api/upload, /api/uploadthing — binary",
      "GET  /api/logs, /api/system-logs",
      "GET  /api/dev/health, /api/dev/echo",
      "GET/POST /api/entity-form-documents",
    ],
    models: ["SystemLog", "ActionLog", "EntityFormDocument", "UploadedFile"],
    services: [
      "UploadService", "UploadThingService", "LogsService", "SystemLogsService",
      "ActionLogger", "EntityFormDocumentsService", "FilePresignService", "ImageOptimizer", "SecurityHeadersMiddleware",
    ],
  },
];

const ARCHITECTURE_NOTES = [
  {
    title: "Stack",
    icon: Cpu,
    body: [
      "Backend: ASP.NET Core 8 (Web API) — modular monolith under Backend/Modules/{Module}/{Controllers,Services,Models,DTOs}",
      "Database: PostgreSQL (Neon) — EF Core with code-first migrations + raw SQL migrations under Backend/Database/Migrations",
      "Realtime: SignalR hubs (notifications, sidebar/permission broadcasts, dashboard tiles)",
      "Background: Hosted services for IMAP sync, webhook forwarding, log pruning, recurring tasks, low-stock alerts",
      "Frontend: Vite + React 18 + TypeScript, TanStack Query, React Router, shadcn/ui, Tailwind",
    ],
  },
  {
    title: "Multi-tenancy",
    icon: Boxes,
    body: [
      "Every business entity implements ITenantEntity { TenantId }",
      "TenantDbContextFactory installs a global EF query filter so reads are auto-scoped",
      "TenantId resolved from JWT claim on every request; super-admin can target a tenant via X-Target-Tenant header",
      "TenantSlugCache memoizes slug → id lookups",
    ],
  },
  {
    title: "Security",
    icon: Shield,
    body: [
      "JWT Bearer auth with refresh-token rotation",
      "RBAC via Roles + Permissions (granular per module/action) — MainAdminUser (id=1) bypasses",
      "BCrypt password hashing, OAuth (Google, Microsoft) with PKCE",
      "Server-side plugin enforcement — disabled modules return 403 even if URL is guessed",
      "GlobalExceptionMiddleware translates exceptions to clean JSON; SecurityHeadersMiddleware adds HSTS/CSP",
      "Per-tenant API keys for inbound external endpoints with allowed-method + allowed-origin validation",
    ],
  },
  {
    title: "Performance",
    icon: Zap,
    body: [
      "EF Core query splitting + AsNoTracking on read paths",
      "Caching: TenantSlugCache, AppSettingsCache, in-memory lookup caches",
      "Pagination + cursor on heavy lists (sync, logs, executions)",
      "Background sweeps: ExternalEndpoint log pruning, webhook retry, low-stock notifications",
      "PDF generation pipelined with streamed responses",
    ],
  },
  {
    title: "Data model conventions",
    icon: Database,
    body: [
      "ISoftDeletable — DeletedAt + DeletedBy; queries filter where DeletedAt IS NULL",
      "Audit columns — CreatedDate/By, ModifiedDate/By on every entity",
      "JSON columns for flexible payloads (project TeamMembers, dashboard layout, workflow definition, dynamic form schema)",
      "Decimal(10,7) for geolocation; decimal(18,4) for monetary fields",
    ],
  },
  {
    title: "Workflow engine",
    icon: Code2,
    body: [
      "Triggers: entity.created/updated/deleted, schedule (cron), webhook, custom event, manual",
      "Nodes: Condition, Branch, Loop, Wait, WaitForEvent, HTTP, Code (sandboxed JS), AI Email, AI Analyzer, AI Agent, Custom LLM, Dynamic Form, Data Transfer, Approval",
      "Reconciliation replays missed triggers; processed-entity table prevents duplicates",
      "Per-step retry policy + dead-letter queue; full execution trace stored",
    ],
  },
];

export default function BackendDocumentationPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const categories = useMemo(() => Array.from(new Set(BACKEND_MODULES.map((m) => m.category))), []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return BACKEND_MODULES.filter((m) => {
      if (activeCategory !== "all" && m.category !== activeCategory) return false;
      if (!q) return true;
      return (
        m.name.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q) ||
        m.controllers.some((c) => c.toLowerCase().includes(q)) ||
        m.endpoints.some((c) => c.toLowerCase().includes(q)) ||
        m.models.some((c) => c.toLowerCase().includes(q)) ||
        m.services.some((c) => c.toLowerCase().includes(q))
      );
    });
  }, [query, activeCategory]);

  const totalEndpoints = BACKEND_MODULES.reduce((a, m) => a + m.endpoints.length, 0);
  const totalControllers = BACKEND_MODULES.reduce((a, m) => a + m.controllers.length, 0);
  const totalModels = BACKEND_MODULES.reduce((a, m) => a + m.models.length, 0);
  const totalServices = BACKEND_MODULES.reduce((a, m) => a + m.services.length, 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 overflow-x-hidden">
      <div className="sticky top-0 z-20 backdrop-blur-md bg-background/80 border-b">
        <div className="px-3 sm:px-4 lg:px-8 py-4">
          <div className="flex items-center gap-3 mb-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard/settings/documentation")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl lg:text-2xl font-bold flex items-center gap-2">
                <Server className="h-6 w-6 text-primary" />
                Backend & Architecture
              </h1>
              <p className="text-xs lg:text-sm text-muted-foreground">
                ASP.NET Core 8 modules — controllers, endpoints, EF Core entities and services.
              </p>
            </div>
            <div className="hidden md:flex items-center gap-2">
              <Badge variant="secondary">{BACKEND_MODULES.length} modules</Badge>
              <Badge variant="outline">{totalControllers} controllers</Badge>
              <Badge variant="outline">{totalEndpoints} endpoints</Badge>
              <Badge variant="outline">{totalModels} entities</Badge>
              <Badge variant="outline">{totalServices} services</Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="px-3 sm:px-4 lg:px-8 py-6 max-w-[1600px] mx-auto">
        <Tabs defaultValue="modules" className="space-y-6">
          <TabsList>
            <TabsTrigger value="modules"><Boxes className="h-4 w-4 mr-1.5" />Modules</TabsTrigger>
            <TabsTrigger value="database"><TableIcon className="h-4 w-4 mr-1.5" />Database ({DB_TABLES.length})</TabsTrigger>
            <TabsTrigger value="architecture"><Cpu className="h-4 w-4 mr-1.5" />Architecture</TabsTrigger>
          </TabsList>

          <TabsContent value="modules" className="space-y-4">
            <div className="flex flex-col lg:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search modules, endpoints, models, services…"
                  className="pl-9"
                />
              </div>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1">
              <button
                onClick={() => setActiveCategory("all")}
                className={`text-xs px-3 py-1.5 rounded-full border whitespace-nowrap transition-colors ${
                  activeCategory === "all"
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background hover:bg-muted"
                }`}
              >
                All ({BACKEND_MODULES.length})
              </button>
              {categories.map((cat) => {
                const count = BACKEND_MODULES.filter((m) => m.category === cat).length;
                const active = activeCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`text-xs px-3 py-1.5 rounded-full border whitespace-nowrap transition-colors ${
                      active ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted"
                    }`}
                  >
                    {cat} ({count})
                  </button>
                );
              })}
            </div>

            <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
              {filtered.map((m) => (
                <Card key={m.key} className="border-border/60">
                  <CardHeader className="pb-3">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center shrink-0">
                        <FileCode className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <CardTitle className="text-base">{m.name}</CardTitle>
                          <Badge variant="secondary" className="text-[10px]">{m.category}</Badge>
                        </div>
                        <CardDescription className="mt-1">{m.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <Section title="Controllers" items={m.controllers} mono />
                    <Section title="REST endpoints" items={m.endpoints} mono />
                    <Section title="Entities (EF Core)" items={m.models} mono />
                    <Section title="Services" items={m.services} mono />
                    {m.notes && m.notes.length > 0 && (
                      <div>
                        <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Notes</div>
                        <ul className="text-xs text-muted-foreground list-disc pl-4 space-y-0.5">
                          {m.notes.map((n, i) => <li key={i}>{n}</li>)}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {filtered.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground text-sm">
                  No backend modules match "{query}".
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="database" className="space-y-4">
            <DatabaseTab />
          </TabsContent>

          <TabsContent value="architecture" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {ARCHITECTURE_NOTES.map((n) => {
                const Icon = n.icon;
                return (
                  <Card key={n.title}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Icon className="h-4 w-4 text-primary" />
                        {n.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="text-sm text-muted-foreground space-y-1.5 list-disc pl-4">
                        {n.body.map((b, i) => <li key={i}>{b}</li>)}
                      </ul>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Frontend ↔ Backend mapping</CardTitle>
                <CardDescription>How the React modules under <code className="font-mono">src/modules/*</code> talk to the ASP.NET Core API.</CardDescription>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <p className="text-muted-foreground">
                  Each frontend module owns a thin API client under <code className="font-mono">src/services/*Api.ts</code> (e.g.
                  {" "}<code className="font-mono">contactsApi</code>, <code className="font-mono">rolesApi</code>, <code className="font-mono">numberingApi</code>)
                  that wraps <code className="font-mono">axios</code> with the base URL from <code className="font-mono">src/config/api.config.ts</code>.
                  Endpoints are listed in <code className="font-mono">API_ENDPOINTS</code> and map 1:1 to the controllers in <code className="font-mono">Backend/Modules/{`{Module}`}/Controllers</code>.
                </p>
                <p className="text-muted-foreground">
                  Authentication: every request adds a <code className="font-mono">Bearer</code> JWT (see <code className="font-mono">src/utils/apiHeaders.ts</code>);
                  the backend resolves <code className="font-mono">TenantId</code> from claims and applies the global EF query filter.
                </p>
                <p className="text-muted-foreground">
                  Realtime: <code className="font-mono">@microsoft/signalr</code> connects to the Notifications + Permission hubs for live updates
                  (notifications, plugin/permission changes, dashboard refresh).
                </p>
                <p className="text-muted-foreground">
                  Offline-first: queued mutations from <code className="font-mono">src/services/offline/*</code> POST to <code className="font-mono">/api/sync/push</code>
                  and pull deltas from <code className="font-mono">/api/sync/pull?since=</code>.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Database migrations</CardTitle>
                <CardDescription>Where to find schema changes.</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-1.5">
                <p>• <code className="font-mono">Backend/Migrations/*.cs</code> — EF Core code-first migrations</p>
                <p>• <code className="font-mono">Backend/Database/Migrations/*.sql</code> — Raw SQL migrations applied in order</p>
                <p>• <code className="font-mono">Backend/Neon/*.sql</code> — Initial bootstrap scripts for a fresh Neon database</p>
                <p>• <code className="font-mono">Backend/Data/SeedData/*.cs</code> — Seed data (lookups, currencies, numbering defaults)</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">More documentation</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link to="/dashboard/settings/documentation">Frontend modules</Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/dashboard/settings/documentation/settings">Settings index</Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/dashboard/settings/database-full-view">Database tables</Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/dashboard/settings/logs">System logs</Link>
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function Section({ title, items, mono }: { title: string; items: string[]; mono?: boolean }) {
  if (!items || items.length === 0) return null;
  return (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
        {title} <span className="text-muted-foreground/60">({items.length})</span>
      </div>
      <ul className={`text-xs space-y-0.5 ${mono ? "font-mono" : ""}`}>
        {items.map((it, i) => (
          <li key={i} className="text-foreground/80 break-words">{it}</li>
        ))}
      </ul>
    </div>
  );
}

function DatabaseTab() {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [openTables, setOpenTables] = useState<Record<string, boolean>>({});

  const categories = useMemo(
    () => Array.from(new Set(DB_TABLES.map((t) => t.category))).sort(),
    [],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return DB_TABLES.filter((t) => {
      if (activeCategory !== "all" && t.category !== activeCategory) return false;
      if (!q) return true;
      return (
        t.name.toLowerCase().includes(q) ||
        t.cols.some((c) => c.name.toLowerCase().includes(q) || c.def.toLowerCase().includes(q))
      );
    });
  }, [query, activeCategory]);

  const totalCols = DB_TABLES.reduce((a, t) => a + t.cols.length, 0);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Database className="h-4 w-4 text-primary" />
            PostgreSQL schema reference
          </CardTitle>
          <CardDescription>
            {DB_TABLES.length} tables · {totalCols} columns. Each table lists every column with its full SQL type, defaults and constraints. Sourced from <code className="font-mono text-[11px]">Backend/Neon/FULL_DATABASE_SCHEMA.sql</code> and <code className="font-mono text-[11px]">Backend/**/Database/Migrations/*.sql</code>.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tables or columns…"
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setOpenTables(Object.fromEntries(filtered.map((t) => [t.name, true])))}>Expand all</Button>
          <Button variant="outline" size="sm" onClick={() => setOpenTables({})}>Collapse all</Button>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveCategory("all")}
          className={`text-xs px-3 py-1.5 rounded-full border whitespace-nowrap transition-colors ${
            activeCategory === "all" ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted"
          }`}
        >
          All ({DB_TABLES.length})
        </button>
        {categories.map((cat) => {
          const count = DB_TABLES.filter((t) => t.category === cat).length;
          const active = activeCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`text-xs px-3 py-1.5 rounded-full border whitespace-nowrap transition-colors ${
                active ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted"
              }`}
            >
              {cat} ({count})
            </button>
          );
        })}
      </div>

      <div className="grid gap-3">
        {filtered.map((t) => (
          <TableCard
            key={t.name}
            table={t}
            open={!!openTables[t.name]}
            onToggle={() => setOpenTables((s) => ({ ...s, [t.name]: !s[t.name] }))}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground text-sm">
            No tables or columns match "{query}".
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function TableCard({ table, open, onToggle }: { table: DbTable; open: boolean; onToggle: () => void }) {
  const pkCount = table.cols.filter((c) => /PRIMARY KEY/i.test(c.def)).length
    + table.constraints.filter((c) => /^PRIMARY KEY/i.test(c)).length;
  const fkCount = table.cols.filter((c) => /REFERENCES/i.test(c.def)).length
    + table.constraints.filter((c) => /^FOREIGN KEY/i.test(c)).length;
  return (
    <Card className="border-border/60">
      <Collapsible open={open} onOpenChange={onToggle}>
        <CollapsibleTrigger asChild>
          <button className="w-full text-left">
            <CardHeader className="py-3">
              <div className="flex items-center gap-3 flex-wrap">
                <TableIcon className="h-4 w-4 text-primary shrink-0" />
                <CardTitle className="text-sm font-mono">{table.name}</CardTitle>
                <Badge variant="secondary" className="text-[10px]">{table.category}</Badge>
                <Badge variant="outline" className="text-[10px]">{table.cols.length} cols</Badge>
                {pkCount > 0 && <Badge variant="outline" className="text-[10px]"><KeyRound className="h-3 w-3 mr-0.5" />{pkCount} PK</Badge>}
                {fkCount > 0 && <Badge variant="outline" className="text-[10px]">{fkCount} FK</Badge>}
                <span className="ml-auto text-[10px] text-muted-foreground font-mono truncate max-w-[40%]">{table.src}</span>
                <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
              </div>
            </CardHeader>
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0">
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full text-xs">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left px-3 py-2 font-semibold w-1/3">Column</th>
                    <th className="text-left px-3 py-2 font-semibold">Type & constraints</th>
                  </tr>
                </thead>
                <tbody>
                  {table.cols.map((c) => {
                    const isPk = /PRIMARY KEY/i.test(c.def);
                    const isFk = /REFERENCES/i.test(c.def);
                    const isNotNull = /NOT NULL/i.test(c.def);
                    return (
                      <tr key={c.name} className="border-t">
                        <td className="px-3 py-1.5 font-mono align-top">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-foreground">{c.name}</span>
                            {isPk && <Badge variant="outline" className="text-[9px] py-0 px-1">PK</Badge>}
                            {isFk && <Badge variant="outline" className="text-[9px] py-0 px-1">FK</Badge>}
                            {isNotNull && !isPk && <Badge variant="outline" className="text-[9px] py-0 px-1">NN</Badge>}
                          </div>
                        </td>
                        <td className="px-3 py-1.5 font-mono text-muted-foreground break-words">{c.def}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {table.constraints.length > 0 && (
              <div className="mt-3">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Table-level constraints ({table.constraints.length})
                </div>
                <ul className="text-xs font-mono space-y-0.5">
                  {table.constraints.map((c, i) => (
                    <li key={i} className="text-foreground/80 break-words">{c}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

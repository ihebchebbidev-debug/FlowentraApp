import type { ModuleGuideMap } from "../types";

export const INVENTORY_GUIDES: ModuleGuideMap = {
  articles: {
    key: "articles",
    purpose:
      "Articles is the master-data and inventory-transaction module for materials and services that are priced or stocked as line-catalog items. It owns the Article entity (SKU, pricing, stock, category, location) and an audit trail of every stock movement. Sales, Purchases, Dispatches and Stock-Management all read and write through this module. It is a non-core plugin (PL0007ARTICLES, category finance) with no dependencies.",
    workflows: [
      {
        name: "Create an article",
        steps: [
          "Fill in name, category, purchase/sales price, stock quantity and minimum stock level.",
          "Leave article number blank to auto-generate it, or supply an explicit one.",
          "Backend validates that price and stock fields are non-negative.",
          "Backend retries article-number generation up to 5 times if it collides with the unique active-article-number index.",
          "Article is saved and appears in list/grid views with a computed stock status.",
        ],
      },
      {
        name: "Adjust stock manually",
        steps: [
          "Open an article and choose Inventory Transaction (in/out/transfer/adjustment).",
          "Submit through the canonical stock-transaction API, never the article PUT endpoint.",
          "Backend row-locks the article, computes the signed delta and rejects the change if it would drive stock negative.",
          "A StockTransaction audit row is written with previous/new stock values.",
        ],
      },
      {
        name: "Bulk stock correction",
        steps: [
          "Submit a batch of article/quantity pairs.",
          "Backend locks all target rows in one query and rejects any item that would go negative.",
          "An adjustment transaction is written per non-zero delta only, to avoid noise in the audit log.",
        ],
      },
    ],
    rules: [
      { title: "Client-computed stock status", detail: "out_of_stock if stock ≤ 0, else low_stock if stock ≤ minStock, else available (articles.service.ts)." },
      { title: "Non-negative numeric fields", detail: "Purchase price, sales price, stock quantity and min stock level must be ≥ 0 on create/update (ArticleService.cs)." },
      { title: "Article number generation", detail: "Format ART-{lastId+attempt:D6}, retried up to 5 times against the partial unique index UX_Articles_Tenant_ArticleNumber_Active." },
      { title: "Stock cannot be set via generic update", detail: "UpdateArticleAsync intentionally ignores StockQuantity; all stock mutations must go through IStockTransactionService for locking, audit and negative-stock guards." },
      { title: "Legacy transaction stock math", detail: "in/purchase/return/restock → +qty; out/sale/consumption/issue → -qty; adjustment → signed delta; all computed under SELECT ... FOR UPDATE and rejected if the result is negative." },
      { title: "Idempotency guard on canonical transactions", detail: "For (sale_deduction|remove|return) × (sale|dispatch_material) reference pairs, a duplicate (ArticleId, TransactionType, ReferenceType, ReferenceId) is a no-op returning the existing row, enforced by a DB unique index and a Postgres 23505 race handler." },
      { title: "Canonical transaction stock math", detail: "add/transfer_in/return → +qty; remove/sale_deduction/transfer_out/damaged/lost → -qty (blocked if it would go negative); adjustment → sets absolute value (must be ≥ 0); offer_added → tracking only, no stock change." },
      { title: "Soft delete only", detail: "Deletes set IsDeleted/DeletedAt/DeletedBy; all list/get queries filter out deleted rows." },
      { title: "Zero-quantity rejected", detail: "CreateTransactionAsync throws on zero quantity; RemoveStock/AddStock reject quantity ≤ 0 at the controller level." },
      { title: "Frontend list cache", detail: "ArticlesService caches list results client-side for 30 seconds (CACHE_TTL)." },
    ],
    statuses: [
      { name: "available", meaning: "stock > minStock" },
      { name: "low_stock", meaning: "0 < stock ≤ minStock" },
      { name: "out_of_stock", meaning: "stock ≤ 0" },
    ],
    integrations: [
      "Sales, Purchases and Dispatches all read/write Articles and post StockTransaction rows against sale/dispatch references.",
      "Inventory-Services is a pure UI layer over this same Articles API.",
      "Stock-Management builds dashboards on top of Article + StockTransaction data.",
    ],
    gotchas: [
      "TransferModal.tsx is not wired to a real API — submit only console.logs the payload and shows a toast; no backend transfer endpoint is called.",
      "Two parallel schemas coexist: the EF/Postgres tenant model and an older raw-SQL migration schema (VARCHAR ids, CHECK constraints).",
    ],
    sources: [
      "src/modules/articles/services/articles.service.ts",
      "Backend/Modules/Articles/Services/ArticleService.cs",
      "Backend/Modules/Articles/Services/StockTransactionService.cs",
      "src/modules/articles/plugin.ts",
    ],
  },

  "inventory-services": {
    key: "inventory-services",
    purpose:
      "Inventory-Services is a unified UI layer over the same backend Articles API, presenting both material (inventory) and service article types in one catalog with type-specific detail pages. It is a distinct plugin (PL0008INVSERVICES) from Articles and Stock-Management with no declared dependency, even though it fully relies on the Articles API for data and validation.",
    workflows: [
      {
        name: "Add a unified article",
        steps: [
          "Open Add via any of the add-article/add-item/add-service routes (all resolve to the same form).",
          "Choose type: material or service; the form conditionally shows stock/location/min-stock or duration/skills-required fields.",
          "Submit; the same Articles create endpoint validates price non-negativity and required name/category.",
          "Record appears in the unified list, routed to InventoryDetail or ServiceDetail based on type.",
        ],
      },
      {
        name: "Bulk import articles",
        steps: [
          "Open the Article Import modal and upload a CSV/XLSX file.",
          "Data is submitted to the backend /api/articles/import batch endpoint.",
          "Imported items appear as material or service articles per their type column.",
        ],
      },
    ],
    rules: [
      { title: "Legacy route aliases", detail: "add-item and add-service both funnel into the same AddUnifiedArticle form, kept only for backward compatibility." },
      { title: "Type-based field branching", detail: "type: 'material' | 'service' toggles stock/location/min-stock fields vs duration/skills-required fields, mirroring backend nullable columns and DB CHECK constraints (check_material_fields, check_service_fields)." },
      { title: "Shared validation", detail: "AddUnifiedArticle/EditUnifiedArticle merge both types into one form but ultimately call the same Articles create/update endpoints, so Articles' price and required-field rules apply uniformly." },
      { title: "Notes and related records are read-only", detail: "useArticleNotes and useArticleRelatedRecords only aggregate/query data (e.g. which sales/dispatches reference an article); they impose no independent business rules." },
      { title: "No dedicated backend", detail: "Inventory-Services has no backend module of its own; it is purely a frontend presentation/plugin layer over the ArticlesController and ArticleNotesController." },
    ],
    integrations: [
      "Reuses articlesApi (same /api/articles* surface as Articles).",
      "Uses ArticleNotesController for the notes tab.",
    ],
    gotchas: [
      "Legacy route aliases (add-item, add-service) may create divergent expectations if callers relied on type-specific behavior that no longer exists.",
    ],
    sources: [
      "src/modules/inventory-services/plugin.ts",
      "src/modules/inventory-services (AddUnifiedArticle, EditUnifiedArticle, InventoryDetail, ServiceDetail)",
    ],
  },

  "stock-management": {
    key: "stock-management",
    purpose:
      "Stock-Management is a materials-only oversight dashboard built on top of Articles data: health gauges, AI-backed anomaly detection and demand forecasting, and manual replenish/consume actions. Plugin PL0009STOCK explicitly depends on PL0007ARTICLES. It excludes service-type articles entirely and derives all stock health indicators client-side from Article fields.",
    workflows: [
      {
        name: "Replenish stock",
        steps: [
          "Open Replenish for a material and enter an add or remove quantity.",
          "Remove is disabled when stock ≤ 0, and the remove amount is capped at current stock.",
          "Call goes to stockTransactionsApi.addStock/removeStock (the canonical StockTransactionController).",
          "On success, a low-stock or stock-replenished notification fires if the change crosses the minStock threshold.",
          "If the transaction API call fails, the dialog falls back to a direct articlesApi.update call and warns that transaction history is unavailable.",
        ],
      },
      {
        name: "Investigate an anomaly",
        steps: [
          "Open Anomaly Detection for an article; recent transaction history is POSTed to the AI anomaly-detection endpoint.",
          "Results are shown with severity critical/high/medium/low.",
          "Rate-limit or credits errors are pattern-matched and shown as a specific toast.",
        ],
      },
      {
        name: "Forecast demand",
        steps: [
          "Open Demand Forecast for an article; recent transaction history is POSTed to the AI forecast endpoint.",
          "Reorder recommendations are surfaced based on the forecast result.",
        ],
      },
    ],
    rules: [
      { title: "Stock health classification", detail: "critical if stock ≤ 0; low if stock ≤ minStock; excess if maxStock is set and stock ≥ maxStock×1.2; otherwise good (useStockData.ts)." },
      { title: "Display percentage formula", detail: "min(round(stock / effectiveMax * 100), 100), where effectiveMax = maxStock || minStock*3." },
      { title: "Materials only", detail: "Only articles with type === 'material' or no type are included; services are excluded from all stock views." },
      { title: "Field-name fallback chains", detail: "article.stockQuantity ?? article.stock ?? 0 (and similarly for minStock/maxStock/prices) to reconcile EF DTO naming with older camelCase fields." },
      { title: "Audit-trail bypass on API failure", detail: "ReplenishDialog falls back to articlesApi.update(id,{stock:newStock}) if the stock-transaction API call fails — this writes no StockTransaction audit row." },
      { title: "Notification side effects", detail: "Add that crosses stock back above minStock fires a stock-replenished notification; remove that drops stock ≤ minStock fires a low-stock notification." },
      { title: "Remove quantity capped", detail: "Remove is disabled when stock ≤ 0 and the input max is capped at current stock." },
    ],
    statuses: [
      { name: "critical", meaning: "stock ≤ 0" },
      { name: "low", meaning: "stock ≤ minStock" },
      { name: "excess", meaning: "maxStock is set and stock ≥ maxStock×1.2" },
      { name: "good", meaning: "none of the above" },
    ],
    integrations: [
      "Relies entirely on Articles' StockTransactionController and Article/StockTransaction tables — no dedicated backend module.",
      "Anomaly/forecast calls hit AI endpoints outside this module (/api/stock/anomaly-detection, /api/stock/demand-forecast).",
    ],
    gotchas: [
      "Silent audit-trail loss: the replenish fallback path changes stock with no StockTransaction row and only a warning toast.",
      "Stock percentage math is guarded against division by zero but can look odd if maxStock is unset and minStock is 0.",
      "Anomaly/forecast calls degrade gracefully (best-effort) on network/AI errors.",
    ],
    sources: [
      "src/modules/stock-management/hooks/useStockData.ts",
      "src/modules/stock-management (ReplenishDialog.tsx, useAnomalyDetection.ts, useDemandForecast.ts)",
      "src/modules/stock-management/plugin.ts",
    ],
  },

  traceability: {
    key: "traceability",
    purpose:
      "Traceability is a cross-module unified activity/audit feed aggregating events from Sales, Offers, Deals, Invoices, Purchases, Service (Dispatches), HR and Contacts into one timeline with permission-gated visibility and workspace scoping. It has no backend controller or database table of its own — it purely aggregates each source module's existing activity/audit endpoints on the frontend.",
    workflows: [
      {
        name: "Browse the activity feed",
        steps: [
          "Open Traceability; sources are pre-filtered to those the user has permission to view.",
          "Select a source tab (or 'all') to see its normalized activity events.",
          "Filter by bucket (created/status/updated/other), actor, date range (7/30/365 days) or free text.",
          "New events since the last poll are badged per tab; the feed refreshes automatically.",
        ],
      },
    ],
    rules: [
      { title: "Permission gating", detail: "Non-mainAdmin users only see a source if they hold read, read_logs, view_all or view_own on its mapped PermissionModule (sales, offers, deals, sales for invoices, purchases, service_orders, hr, contacts)." },
      { title: "Invoices share Sales permission", detail: "There is no independent invoice-view permission; invoices use the sales module permission." },
      { title: "Workspace scoping", detail: "A ?workspace= query param restricts ALL_SOURCES to WORKSPACE_SOURCES[workspace]; unset or unknown values default to showing all sources." },
      { title: "Bounded adapter fetch", detail: "Each source adapter fetches up to 25 parent entities and up to 15 activities each via Promise.allSettled, tolerating individual failures by returning an empty list." },
      { title: "Event normalization", detail: "Each event gets a level (success/info/warning) from an action→level lookup table and a bucket (created/status/updated/other) via regex pattern-matching on the action string." },
      { title: "Live polling", detail: "The feed polls every 20 seconds (POLL_MS) and tracks new event IDs to badge unseen counts per tab." },
      { title: "Filter pipeline order", detail: "Events are filtered by tab (source) → bucket → actor → date range → free-text search across message/entityLabel/actor.name/actionLabel." },
      { title: "Hardcoded admin actor", detail: "Actor id or name '1' is always displayed as 'MainAdminUser', a hardcoded assumption about the seeded admin user." },
    ],
    integrations: [
      "Calls existing APIs' getActivities/getAuditLog endpoints: salesApi, offersApi, dealsApi, customerInvoicesApi, purchaseOrderService, dispatchesApi, hrApi, contactActivityApi.",
    ],
    gotchas: [
      "If a fetching adapter fails entirely it degrades to an empty list rather than erroring the whole feed.",
      "A user with zero allowed sources sees a no-access empty state.",
      "The selected tab auto-resets to 'all' if it becomes disallowed after a permission or workspace change.",
    ],
    sources: [
      "src/modules/traceability/pages/TraceabilityPage.tsx",
      "src/modules/traceability/permissions.ts",
      "src/modules/traceability/adapters.ts",
    ],
  },

  projects: {
    key: "projects",
    purpose:
      "Projects is largely a backend-heavy module: the frontend package contains only a plugin manifest, with the actual UI delivered through the Tasks module. The backend owns Projects plus Tasks (daily and project), Kanban columns, checklists, comments, attachments, time entries and recurring tasks as one cohesive domain. Global ProjectSettings configure cross-module policy such as auto-linking converted entities and cross-project dispatch permission.",
    workflows: [
      {
        name: "Create and configure a project",
        steps: [
          "Create a project with name, description, contact and dates.",
          "Backend eager-loads the linked Contact, applies global ProjectSettings, and attaches the project's Kanban Columns.",
          "Assign team members; a failed assignment notification never blocks or rolls back the assignment itself.",
          "Link arbitrary entities (offers, sales, etc.) to the project via the generic linkEntity/unlinkEntity API.",
        ],
      },
      {
        name: "Search and report on projects",
        steps: [
          "Search by name/description, filter by status/priority/contact/date range, sort and paginate (page size clamped to 1-200).",
          "View aggregated status counts and completion stats from a server-side /statistics endpoint.",
          "For overdue projects, the frontend must page through all non-archived projects client-side (up to 50×200 rows) since the server has no endDate<now filter, then filters client-side for endDate<now and status != completed.",
        ],
      },
    ],
    rules: [
      { title: "Pagination clamp", detail: "GetAllProjectsAsync clamps pageSize to the range [1, 200]." },
      { title: "Columns are configurable, not hardcoded", detail: "Each project's Kanban structure is a first-class ProjectColumn list injected via IProjectColumnService, not a fixed status enum." },
      { title: "Task-add cascades into project activity", detail: "Creating or updating a task with RelatedEntityType == 'project' writes a ProjectActivity row (e.g. ActionType='task_added')." },
      { title: "Overdue projects require client-side paging", detail: "getOverdueProjects() has no server-side endDate<now filter; it must page through all non-archived projects and filter client-side, capped at 50 pages of 200." },
      { title: "Notification failures don't block assignment", detail: "assignTeamMember's notification is best-effort; a failed notification never rolls back or blocks the assignment." },
      { title: "Mutations rethrow on failure", detail: "removeTeamMember, deleteProject, bulkUpdateStatus and bulkArchive rethrow errors so callers see them, unlike the notification's swallow-on-failure behavior." },
      { title: "Server-aggregated stats", detail: "getProjectStatusCounts and getProjectCompletionStats use a server-side /statistics endpoint rather than client-side reduction, for performance." },
      { title: "Global ProjectSettings gate cross-module behavior", detail: "autoLinkConvertedEntities, requireProjectBeforeConvertingOffer, defaultTaskStatus, allowCrossProjectDispatch, showFinancialDataInProjectTabs and defaultLinkedEntityType control whether Offers/Sales auto-link to projects and whether Dispatches may cross project boundaries." },
      { title: "Polymorphic entity linking", detail: "linkEntity/unlinkEntity associate a project with any entityType/entityId pair generically." },
    ],
    integrations: [
      "Depends on Contacts (PL0004PROJECTS declares dependency on PL0001CONTACTS).",
      "UI is delivered entirely through the Tasks module's /dashboard/tasks/projects routes.",
      "ProjectSettings gate Offers/Sales auto-linking and Dispatch cross-project rules.",
    ],
    gotchas: [
      "No server-side overdue filter forces an expensive client-side workaround capped at 10k rows.",
      "ProjectService and TaskService are very large (823/1001 lines); some business rules (recurring task generation, checklist cascades) may be undocumented.",
      "Notification failures during team assignment are silently logged, not surfaced to the user.",
    ],
    sources: [
      "Backend/Modules/Projects/Services/ProjectService.cs",
      "Backend/Modules/Projects/Services/TaskService.cs",
      "src/modules/tasks/services/projects.service.ts",
      "src/modules/projects/plugin.ts",
    ],
  },

  tasks: {
    key: "tasks",
    purpose:
      "Tasks is the frontend task-management UI covering two families sharing one backend domain: Project Tasks (Kanban board per project, polymorphic RelatedEntityType/RelatedEntityId linkage) and Daily Tasks (personal per-user to-do list). Plugin PL0011TASKS declares no dependencies despite being tightly coupled to Projects and Contacts data. Its core complexity is a status/column normalization layer that bridges the backend's free-text status string with each project's custom Kanban columns.",
    workflows: [
      {
        name: "Move a task on the Kanban board",
        steps: [
          "Drag a task card to a different column.",
          "The column is resolved to a backend status via regex title matching first (done/completed/termin/fini, progress/cours/review/révision, todo/open/faire/backlog/à faire).",
          "If no column title matches, a positional fallback applies: last column=completed, second column=in progress, else open.",
          "The task's Status field is updated on the backend and a ProjectActivity row is logged.",
        ],
      },
      {
        name: "Create a project task",
        steps: [
          "Fill in task details, optionally linking to a related entity.",
          "buildCreateProjectTaskPayload resolves relatedEntityId from relatedEntityId ?? projectId ?? fallbackProjectId.",
          "relatedEntityType defaults to 'project' only if a related entity id is present.",
          "dueDate is coerced from Date or string to an ISO string before submission.",
        ],
      },
      {
        name: "Convert between task and sub-task",
        steps: [
          "Use convertToSubTask(taskId, parentTaskId) to nest an existing task under a parent.",
          "Use convertToStandaloneTask(taskId) to detach it again.",
          "Sub-tasks can be listed via getSubTasks and created directly via createSubTask.",
        ],
      },
    ],
    rules: [
      { title: "Canonical status set", detail: "normalizeTaskStatus maps arbitrary/legacy values to {open, in progress, completed, cancelled}; numeric-only strings and 'todo' both map to open; 'review' collapses into 'in progress' since no distinct review status exists." },
      { title: "Completed vs cancelled both count as done", detail: "isCompletedTaskStatus treats completed OR cancelled as done for filtering, so cancelled tasks disappear from active views." },
      { title: "Column resolution: title match then position", detail: "mapTaskStatusToColumnId/mapColumnIdToTaskStatus first try regex title matching (French/English aware), falling back to positional heuristics if no title matches." },
      { title: "Review and in-progress filters are indistinguishable", detail: "taskMatchesUiFilterStatus maps UI filter chips back through the same column resolution, so 'review' and 'in-progress' both resolve to the 'in progress' backend status." },
      { title: "Task creation payload normalization", detail: "buildCreateProjectTaskPayload resolves relatedEntityId with a fallback chain and coerces dueDate to ISO string." },
      { title: "Sub-task pass-through", detail: "Parent/child hierarchy (getSubTasks, createSubTask, convertToSubTask, convertToStandaloneTask) is not independently modeled in the frontend service beyond pass-through API calls." },
    ],
    statuses: [
      { name: "open", meaning: "Not started; also the target of legacy 'todo' and numeric-only values." },
      { name: "in progress", meaning: "In progress; also absorbs the UI-only 'review' label." },
      { name: "completed", meaning: "Finished; counted as done." },
      { name: "cancelled", meaning: "Cancelled; also counted as done for filtering purposes." },
    ],
    integrations: [
      "Shares its backend domain entirely with Projects (ProjectTask, DailyTask, TaskChecklist, TaskComment, TaskAttachment, TaskTimeEntry, RecurringTask, ProjectColumn).",
      "Task add/update on a project entity cascades into that project's ProjectActivity timeline.",
    ],
    gotchas: [
      "Column-title regex matching only recognizes French/English patterns.",
      "Positional fallback is brittle if a tenant renames or reorders custom Kanban columns.",
      "'Review' has no first-class backend status — it's purely a UI label collapsed into 'in progress'.",
      "Cancelled tasks are treated identically to completed tasks in isCompletedTaskStatus, which can hide cancelled work from reports expecting separate accounting.",
    ],
    sources: [
      "src/modules/tasks/utils/taskStatusMapping.ts",
      "src/modules/tasks/pages/ProjectTasksPage.tsx",
      "src/modules/tasks/plugin.ts",
    ],
  },

  documents: {
    key: "documents",
    purpose:
      "Documents is a generic polymorphic file-attachment and external-link repository usable from any module (Sales, Offers, Deals, Projects, Service/Dispatches, Contacts, general), with automatic on-disk GZip compression, activity logging into the owning entity's timeline where supported, and aggregate storage stats. It is gated behind plugin PL0012DOCUMENTS.",
    workflows: [
      {
        name: "Upload a document",
        steps: [
          "Choose a parent module/entity and upload a file (or provide an external URL for a link-only document).",
          "If the file extension is on the compressible whitelist, the backend GZip-compresses it and deletes the original after success.",
          "A Document row is created with compression metadata (OriginalFileSize, IsCompressed, CompressionRatio).",
          "An activity log entry is posted to the parent entity's timeline if the module supports one, otherwise to SystemLog only.",
        ],
      },
      {
        name: "Download a document",
        steps: [
          "Request the document; if compressed, the backend streams it through a GZipStream wrapper.",
          "The file is decompressed on the fly and never rehydrated to disk.",
        ],
      },
      {
        name: "Review storage stats",
        steps: [
          "Open the stats view to see total files/size, per-module and per-category counts, 7-day recent-activity count, and compression savings summary.",
        ],
      },
    ],
    rules: [
      { title: "Compression whitelist", detail: "ShouldCompress gzips a fixed set of text/office extensions (pdf, docx, xlsx, pptx, odt/ods/odp, txt, csv, json, xml, html, css, js, ts and other source-code extensions, sql, log, md, yml/yaml, ini/conf/config); binary/media types like images, video and zip are never compressed." },
      { title: "Destructive compression", detail: "CompressFileAsync streams source to a GZip target with an 80KB buffer, computes compressionRatio = (original-compressed)/original*100, and deletes the original file after success; on failure only the partial compressed artifact is deleted, not the original." },
      { title: "Streamed decompression only", detail: "DecompressFileForDownload always streams decompressed bytes for download; files are never rehydrated to disk." },
      { title: "Original-size recovery without full decompression", detail: "GetDecompressedSize reads the last 4 bytes of the gzip trailer, with an endianness fix, falling back to raw file size if trailer parsing fails." },
      { title: "Parent-entity activity mapping", detail: "ResolveParentEntityType maps offers/offer→Offer, sales/sale→Sale, deals/deal→Deal, projects/project→Project; all other modules (including ServiceOrders/Dispatches) log only to SystemLog, not a parent timeline." },
      { title: "Upload path resolution", detail: "The uploads root is the backend content root's parent + /uploads, auto-created if missing; stored FilePath is DB-relative (/uploads/...) and resolved back to an absolute path by stripping the uploads/ prefix." },
      { title: "Link-only documents", detail: "CreateDocument accepts ExternalUrl and sets FilePath='', FileSize=0, deriving a filename from Title or the URL's path segment (spaces sanitized to underscores) when no title is given." },
      { title: "Aggregate stats formula", detail: "GetStats computes total files/size, per-module and per-category counts, a 7-day recent-activity count, and a compression summary (compressed vs uncompressed counts, total original size, bytes saved, overall ratio)." },
      { title: "Search/filter fields", detail: "GetDocuments filters by free text across FileName/OriginalName/Description/ModuleName, plus moduleType, fileType (extension suffix), category and uploadedBy, with pagination." },
    ],
    integrations: [
      "Attachable from Sales, Offers, Deals, Projects, Service/Dispatches, Contacts and general records via polymorphic ModuleType/ModuleId/ModuleName.",
      "Posts activity entries into the owning entity's timeline for Offers, Sales, Deals and Projects only.",
    ],
    gotchas: [
      "Compression is one-way and destructive — only the .gz survives; any bug between file-open and delete could cause data loss, though the failure path only deletes the compressed artifact, not the original.",
      "GetDecompressedSize can silently report the wrong (compressed) size if gzip-trailer parsing fails.",
      "ServiceOrders/Dispatches documents have no per-entity timeline, only global SystemLog, making field-service document changes harder to audit from the entity's own history view.",
      "Link-only documents always show as 'uncompressed' in stats (FileSize=0), even though they carry no storage cost.",
    ],
    sources: [
      "Backend/Modules/Documents/DocumentsController.cs",
      "Backend/Modules/Documents (Document model)",
      "src/modules/documents/plugin.ts",
    ],
  },
};

// Platform module guides — dashboard, dashboard-builder, analytics, reporting,
// workflow, automation, dynamic-forms, ai-assistant, website-builder, external, testing.
// Derived from a code audit; see `sources` on each entry.

import type { ModuleGuideMap } from "../types";

export const PLATFORM_GUIDES: ModuleGuideMap = {
  dashboard: {
    key: "dashboard",
    purpose:
      "The always-on landing module that every user sees after login. It renders the main app sidebar and the 'Overview' home page, aggregating KPIs and cards pulled from other modules (sales, offers, tasks, articles, events, services). It also manages the tenant's sidebar navigation configuration and lets users pin favorite reporting widgets onto their home screen.",
    workflows: [
      {
        name: "View the home overview",
        steps: [
          "Log in and land on /dashboard.",
          "DashboardGate waits for plugin/permission checks to resolve before rendering.",
          "DashboardSnapshotContext fetches sales/offers/contacts/tasks/serviceOrders/dispatches/articles in one batch.",
          "Overview cards (KPI, sales summary, leads, tasks, events, articles, services) render from that shared snapshot.",
        ],
      },
      {
        name: "Customize the sidebar",
        steps: [
          "Tenant-level sidebar items are seeded from sidebar-defaults.json.",
          "sidebar.service.ts fetches/persists any tenant customization.",
          "sidebarPluginGating.ts hides items whose module plugin is disabled for the tenant.",
          "The resulting item list renders in WorkspaceSidebar/AppSidebar.",
        ],
      },
      {
        name: "Pin a reporting widget to the dashboard",
        steps: [
          "Favorite a widget inside the reporting module.",
          "PinnedReportingWidgets.tsx reads that favorites list.",
          "The widget renders inline on the dashboard Overview page.",
        ],
      },
    ],
    rules: [
      { title: "Core, always enabled", detail: "isCore: true — the dashboard module cannot be disabled like other plugins." },
      { title: "No dedicated backend", detail: "There is no Dashboard controller; all widget data comes from each domain module's own read APIs, aggregated client-side by useDashboardData." },
      { title: "Gated items are hidden, not disabled", detail: "sidebarPluginGating.ts removes plugin-gated sidebar items entirely rather than showing them greyed out." },
      { title: "Empty/failed sources default to zero", detail: "If a data source fetch fails, its Overview card falls back to zero counts instead of erroring." },
      { title: "Layout customization is local", detail: "useDashboardLayoutStore (Zustand) persists pinned widgets/workspace order client-side, not on the server." },
      { title: "Dropdown normalization", detail: "A missing dropdown field and an empty dropdown: [] both render the sidebar item as a leaf (no submenu)." },
    ],
    integrations: [
      "Pulls read data from sales, offers, contacts, tasks, serviceOrders, dispatches, and articles modules.",
      "Displays pinned favorites from the reporting module.",
    ],
    gotchas: [
      "Widget data freshness depends entirely on other modules' APIs — there's no dashboard-owned cache invalidation.",
      "Sidebar customization API endpoints are generic tenant-settings endpoints, not a dedicated Dashboard backend module.",
    ],
    sources: [
      "src/modules/dashboard/plugin.ts",
      "src/modules/dashboard/pages/Dashboard.tsx",
      "src/modules/dashboard/context/DashboardSnapshotContext.tsx",
      "src/modules/dashboard/hooks/useDashboardData.ts",
      "src/modules/dashboard/utils/sidebarPluginGating.ts",
      "src/modules/dashboard/services/sidebar.service.ts",
      "src/modules/dashboard/data/sidebar-defaults.json",
      "src/modules/dashboard/store/useDashboardLayoutStore.ts",
    ],
  },

  "dashboard-builder": {
    key: "dashboard-builder",
    purpose:
      "A self-service BI dashboard designer where users add and configure widgets (KPI, bar, line, pie, donut, funnel, gauge, heatmap, map, radar, sparkline, stacked-bar, table) on a grid. Dashboards can be AI-generated from a prompt, duplicated, and shared publicly via a token link. It is distinct from reporting: dashboards here are fully user-composable rather than fixed/curated.",
    workflows: [
      {
        name: "Build a dashboard manually",
        steps: [
          "Open Dashboard Builder and create a new dashboard.",
          "Drag a widget from the registry onto the grid.",
          "Pick a data source (sales, offers, contacts, tasks, articles, serviceOrders, dispatches, externalApi) and a metric (count, total, revenue, average, conversionRate, completionRate, statusBreakdown, priorityBreakdown, monthlyTrend, topItems).",
          "useWidgetData computes and renders the widget; statuses are canonicalized before bucketing so aliases don't create duplicate bars.",
          "Save the dashboard (CRUD goes through /api/Dashboards).",
        ],
      },
      {
        name: "Generate a dashboard with AI",
        steps: [
          "Describe the dashboard you want in the AI prompt (French or English).",
          "dashboardAiService calls the shared AI gateway with a fallback chain of models.",
          "The system prompt applies widget-count heuristics (e.g. 'minimal' → 4 KPIs + 2 charts, 'complet' → 10-14 widgets).",
          "The generated widget layout is inserted into the grid for further editing.",
        ],
      },
      {
        name: "Share a dashboard publicly",
        steps: [
          "Generate a share link from the dashboard menu.",
          "The backend issues a shareToken via DashboardsController.GenerateShareLink.",
          "Anyone with the link can view it at /public/{token} with no authentication.",
          "Revoke the link at any time to invalidate the token.",
        ],
      },
    ],
    rules: [
      { title: "Local-storage fallback", detail: "If any /api/Dashboards call fails, the builder automatically switches to a localStorage-backed mode (dashboard-builder-data key) so it keeps working offline." },
      { title: "Status canonicalization before aggregation", detail: "Raw statuses are normalized via entityStatusConfigs/normalizeStatus before being bucketed, avoiding duplicate bars like 'draft' vs 'created'." },
      { title: "External-API widgets are proxied server-side", detail: "ExternalApiProxyController makes the outbound call so stored credentials never reach the browser and CORS is avoided." },
      { title: "External widget failures degrade gracefully", detail: "If an external data source errors, the widget shows a fallback error card instead of crashing the dashboard." },
      { title: "Local-fallback duplicates aren't reconciled", detail: "Dashboards created/duplicated while in local-fallback mode have no ID uniqueness guarantee once the backend comes back online." },
      { title: "AI defaults to French", detail: "When the requested language is ambiguous, AI dashboard generation defaults to French." },
      { title: "Layout stored separately", detail: "DashboardLayoutController persists grid layout independently from widget content." },
    ],
    statuses: [
      { name: "isDefault", meaning: "Marks the tenant's default dashboard." },
      { name: "isShared", meaning: "Dashboard has an active public share token." },
    ],
    integrations: [
      "Reads from sales, offers, contacts, tasks, articles, serviceOrders, dispatches modules.",
      "Pulls externalApi data via the external module's configured connections, proxied server-side.",
      "Uses the same shared AI gateway as ai-assistant/workflow LLM nodes.",
    ],
    gotchas: [
      "Public share pages render with zero authentication — treat share tokens as bearer secrets.",
      "Renaming/duplicating in local-fallback mode is purely client-side and can desync from the server once reconnected.",
    ],
    sources: [
      "src/modules/dashboard-builder/services/dashboardApi.ts",
      "src/modules/dashboard-builder/hooks/useWidgetData.ts",
      "src/modules/dashboard-builder/hooks/useExternalApiData.ts",
      "src/modules/dashboard-builder/services/dashboardAiService.ts",
      "src/modules/dashboard-builder/services/dashboardShareApi.ts",
      "Backend/Modules/Dashboards/Controllers/DashboardsController.cs",
      "Backend/Modules/Dashboards/Controllers/ExternalApiProxyController.cs",
      "Backend/Modules/Dashboards/Controllers/DashboardLayoutController.cs",
      "Backend/Modules/Dashboards/Models/Dashboard.cs",
    ],
  },

  analytics: {
    key: "analytics",
    purpose:
      "A registered plugin slot reserved for future analytics functionality. It is not implemented: the module renders only an empty placeholder div behind a plugin gate. It exists as a stub distinct from the fully implemented reporting module, which already covers BI dashboards.",
    workflows: [
      {
        name: "Open the analytics screen",
        steps: [
          "Enable the analytics plugin for the tenant.",
          "Navigate to the analytics entry (if surfaced in the sidebar).",
          "The screen renders a blank page — there is no functionality behind it.",
        ],
      },
    ],
    rules: [
      { title: "No functional code", detail: "AnalyticsModule.tsx renders only <PluginGate><div className=\"p-6\" /></PluginGate>." },
      { title: "No routes", detail: "The plugin manifest declares routes: [] — nothing is actually mounted." },
      { title: "No services or backend", detail: "There is no service file and no controller behind this module." },
    ],
    gotchas: [
      "If toggled on, users see a blank page — this is a known incomplete placeholder, not a bug to chase.",
      "Do not confuse this with the reporting module, which is the real BI feature.",
    ],
    sources: ["src/modules/analytics/AnalyticsModule.tsx", "src/modules/analytics/plugin.ts"],
  },

  reporting: {
    key: "reporting",
    purpose:
      "Prebuilt, permission-gated executive dashboards for Sales, Service, Finance, HR, and Purchase, plus a personal 'My' dashboard and Excel export. Unlike dashboard-builder, these screens are fixed/curated rather than user-composable. Users can favorite specific KPI/chart widgets and pin them onto the main dashboard overview.",
    workflows: [
      {
        name: "View a domain dashboard",
        steps: [
          "Navigate to /dashboard/reporting/{sales|service|finance|hr|purchase}.",
          "PermissionRoute checks the required permission (e.g. sales:read, service_orders:read, reporting_finance:read, reporting_hr:read, purchases:read).",
          "If unauthorized, the user is silently redirected to /dashboard/reporting/my instead of seeing a 403.",
          "useReporting fetches the payload from GET /api/Reporting/{domain} with optional filters.",
        ],
      },
      {
        name: "Favorite and pin a widget",
        steps: [
          "Open any domain dashboard and mark a KPI/chart as favorite.",
          "useFavoritesStore persists the favorite via ReportingFavoritesController.",
          "The widget appears under FavoriteWidgets.tsx and is pinned onto the main dashboard Overview via PinnedReportingWidgets.",
        ],
      },
      {
        name: "Export a report to Excel",
        steps: [
          "Open Export Reports from the reporting sidebar.",
          "Apply any date-range/entity filters (shared via useReportFiltersStore/applyFilters).",
          "exportReport.ts builds a localized .xlsx file client-side using useXlsxI18n headers.",
          "Download the file.",
        ],
      },
    ],
    rules: [
      { title: "Index redirects to 'my'", detail: "The reporting index route redirects to /dashboard/reporting/my by default." },
      { title: "Per-domain permission gates", detail: "Each domain dashboard requires its own permission: sales:read, service_orders:read, reporting_finance:read, reporting_hr:read, purchases:read." },
      { title: "Unauthorized access is silent", detail: "Users without the right permission are redirected to 'my' rather than shown an explicit access-denied page." },
      { title: "Filters are shared client state", detail: "Date-range/entity filters live in useReportFiltersStore and apply consistently across all domain dashboards." },
      { title: "Export re-derives i18n at export time", detail: "useXlsxI18n recomputes localized headers separately from the live UI language, so exports stay correct even if the UI language changes after load." },
      { title: "Favorites are backend-persisted", detail: "Favoriting a widget is saved server-side via ReportingFavoritesController, not just locally." },
    ],
    integrations: [
      "Feeds pinned favorite widgets into the dashboard module's Overview page.",
      "Shares status-label mapping (RAG dots) with other modules via statusLabel.ts.",
    ],
    gotchas: [
      "A missing permission shows no error message at all — just a silent redirect, which can look like a broken link to users.",
      "Excel export headers are computed independently of the current UI language state.",
    ],
    sources: [
      "src/modules/reporting/ReportingModule.tsx",
      "src/modules/reporting/hooks/useReporting.ts",
      "src/modules/reporting/services/reportingApi.ts",
      "src/modules/reporting/store/useReportFiltersStore.ts",
      "src/modules/reporting/store/useFavoritesStore.ts",
      "src/modules/reporting/utils/exportReport.ts",
      "Backend/Modules/Dashboards/Controllers/ReportingController.cs",
      "Backend/Modules/Reporting/Controllers/ReportingFavoritesController.cs",
    ],
  },

  workflow: {
    key: "workflow",
    purpose:
      "A visual, n8n-style workflow automation builder (React Flow based) for creating entity-status triggers, conditional branching (if/else, switch, loop, parallel, try/catch), entity actions, and monitoring live execution. It powers automated cross-entity behavior such as offer→sale→service-order status cascades and webhook-driven automations.",
    workflows: [
      {
        name: "Build and save a workflow",
        steps: [
          "Open the workflow builder canvas and drag nodes from the palette (entity trigger, entity action, conditionals, HTTP call, database, email/LLM, dispatch).",
          "Configure each node in the config panel.",
          "Connect nodes with edges to define the execution graph.",
          "Save — non-serializable icon references are stripped before the graph is sent to the backend.",
          "If the API call fails, the workflow is cached to localStorage as a fallback.",
        ],
      },
      {
        name: "Trigger on an entity status change",
        steps: [
          "Register a trigger binding a workflow node to an entity type and status transition.",
          "When an entity's status changes, WorkflowTriggerService.TriggerStatusChangeAsync looks up matching active triggers.",
          "If no execution is already in-flight for that entity, a new WorkflowExecution is created and the graph runs.",
          "Watch live progress in the Workflow Debug Console via a SignalR subscription.",
        ],
      },
      {
        name: "Trigger via webhook",
        steps: [
          "Configure a webhook trigger with a path and optional secret token.",
          "An inbound call to that webhook path invokes TriggerWebhookAsync.",
          "The secret token is validated using constant-time comparison before the workflow fires.",
        ],
      },
    ],
    rules: [
      { title: "Duplicate execution prevention", detail: "TriggerStatusChangeAsync skips creating a new execution if one is already in-flight for that entity (dedupe check)." },
      { title: "Webhook triggers reuse the entity-trigger schema", detail: "Webhook triggers store EntityType='webhook', FromStatus=<path>, ToStatus=<optional secret> — a deliberate schema reuse rather than a new table." },
      { title: "Constant-time secret comparison", detail: "Webhook secret tokens are validated with constant-time equality to avoid timing attacks." },
      { title: "Local-only workflow IDs are skipped from API calls", detail: "IDs like 'local-<timestamp>' (non-numeric) are treated as unsaved and never sent to the backend." },
      { title: "Icons stripped before save", detail: "React icon component references are removed from node data before serialization to prevent a previously-seen double-serialization bug." },
      { title: "Built-in cascades run independently of user graphs", detail: "BusinessWorkflowService implements hardcoded cross-entity cascades (e.g. offer→sale→service-order) regardless of any user-authored workflow." },
      { title: "Auth types supported on HTTP nodes", detail: "HTTP/API call nodes support bearer, basic, api_key, and oauth2 authentication." },
      { title: "Idempotency tracking", detail: "WorkflowProcessedEntities table tracks processed entities to prevent duplicate side effects." },
    ],
    statuses: [
      { name: "WorkflowExecution (in-flight)", meaning: "An execution currently running for a given entity; blocks a duplicate trigger from starting another one." },
    ],
    integrations: [
      "Triggers on status changes from offers, sales, and service orders.",
      "Cross-links to DispatchBoard and WorkflowCalendar for scheduling context.",
      "LLM/email nodes use the shared AI gateway also used by dashboard-builder and ai-assistant.",
    ],
    gotchas: [
      "Webhook 'FromStatus'/'ToStatus' fields don't literally mean status — they're overloaded to carry path/secret for webhook triggers.",
      "A workflow saved only to localStorage will silently vanish if the browser storage is cleared before the backend call ever succeeds.",
    ],
    sources: [
      "src/modules/workflow/WorkflowModule.tsx",
      "src/modules/workflow/hooks/useWorkflowApi.ts",
      "src/modules/workflow/hooks/useWorkflowSignalR.ts",
      "Backend/Modules/WorkflowEngine/Services/WorkflowTriggerService.cs",
      "Backend/Modules/WorkflowEngine/Services/WorkflowGraphExecutor.cs",
      "Backend/Modules/WorkflowEngine/Services/WorkflowNodeExecutor.cs",
      "Backend/Modules/WorkflowEngine/Services/BusinessWorkflowService.cs",
      "Backend/Modules/WorkflowEngine/Services/WorkflowApprovalService.cs",
    ],
  },

  automation: {
    key: "automation",
    purpose:
      "A legacy, marketing-style 'Automation' screen showing mock workflow cards, fake stats, and quick-start templates. It has no real business logic and is likely superseded by the fully-implemented workflow module.",
    workflows: [
      {
        name: "Browse the automation screen",
        steps: [
          "Open the Automation page.",
          "View hardcoded workflow cards and static stats (e.g. '45 runs', '94%').",
          "Buttons like Create Workflow, Use Template, pause/play/settings have no click handlers — nothing happens.",
        ],
      },
    ],
    rules: [
      { title: "Entirely static data", detail: "Workflow cards and stats are hardcoded arrays in AutomationModule.tsx, not fetched from any API." },
      { title: "No wired actions", detail: "None of the action buttons call any service or navigate anywhere." },
      { title: "No backend counterpart", detail: "This module has no service files and no backend controller." },
    ],
    gotchas: [
      "Do not mistake this for the real workflow module — this screen is non-functional and should be treated as dead code or a placeholder pending removal.",
    ],
    sources: ["src/modules/automation/AutomationModule.tsx"],
  },

  "dynamic-forms": {
    key: "dynamic-forms",
    purpose:
      "A no-code form builder supporting drag-and-drop fields, conditional show/hide/require logic, cascading dynamic-data fields sourced from live entities, e-signatures, and a rule-based 'thank you' engine after submission. Forms can be shared publicly, collect responses, and be exported to PDF/Excel.",
    workflows: [
      {
        name: "Build and publish a form",
        steps: [
          "Create a new form and drag fields from the palette onto the canvas.",
          "Configure each field's properties, including conditional logic and dynamic-data cascading selects.",
          "Optionally add e-signature or rating fields.",
          "Set thank-you rules (condition + priority) to control the post-submit message/redirect.",
          "Publish the form to make it available at its public slug.",
        ],
      },
      {
        name: "Submit a public form",
        steps: [
          "A respondent opens the public link (/api/public/forms/{slug}).",
          "The backend returns the form only if it's publicly available, otherwise 404.",
          "conditionEvaluator applies show/hide/require rules as fields are filled.",
          "formValidation runs required/min/max/length checks before submit.",
          "The response posts anonymously to /api/public/forms/{slug}/responses.",
          "thankYouEvaluator picks the matching thank-you rule to display.",
        ],
      },
      {
        name: "Review and export responses",
        steps: [
          "Open the form's Responses page.",
          "Browse individual submissions or export them in bulk.",
          "formExportService generates per-response PDFs or Excel exports.",
        ],
      },
    ],
    rules: [
      { title: "Optimistic concurrency on update", detail: "Updating a form sends expected_version, mapped to ExpectedVersion, to detect concurrent edits." },
      { title: "Explicit null-clearing flags", detail: "ClearClosesAt/ClearMaxResponses flags are required to explicitly clear those fields — omitting a value doesn't clear it." },
      { title: "Public access requires explicit publish state", detail: "PublicFormsController only serves a form via slug if it is publicly available; otherwise it returns 404." },
      { title: "Case convention transformation", detail: "dynamicFormsService fully transforms snake_case (frontend) to PascalCase (backend) DTOs, including per-locale EN/FR labels/placeholders/hints." },
      { title: "Cascading fields via Dependency config", detail: "Parent-child cascading selects are modeled through a Dependency field in the DTO, resolved live by dynamicDataService." },
      { title: "Thank-you rules are priority-ordered", detail: "thankYouEvaluator picks the first matching rule by priority, not just the first rule in list order." },
      { title: "Status lifecycle", detail: "Forms move through draft → published → closed; only published+public forms are reachable anonymously." },
    ],
    statuses: [
      { name: "draft", meaning: "Form is being built, not visible publicly." },
      { name: "published", meaning: "Form is live; if is_public is true, reachable at its public slug." },
      { name: "closed", meaning: "Form no longer accepts responses." },
    ],
    integrations: [
      "Dynamic-data fields pull live options from other entity modules (e.g. contacts, articles) via dynamicDataService.",
      "Submissions can link to a CRM entity via entity_type/entity_id on DynamicFormResponse.",
    ],
    gotchas: [
      "closes_at and max_responses can't be cleared just by omitting them from an update payload — the dedicated Clear* flags are required.",
      "A form must be both published and is_public to be reachable at its public URL.",
    ],
    sources: [
      "src/modules/dynamic-forms/DynamicFormsModule.tsx",
      "src/modules/dynamic-forms/services/dynamicFormsService.ts",
      "src/modules/dynamic-forms/services/dynamicDataService.ts",
      "src/modules/dynamic-forms/utils/conditionEvaluator.ts",
      "src/modules/dynamic-forms/utils/thankYouEvaluator.ts",
      "Backend/Modules/DynamicForms/Controllers/DynamicFormsController.cs",
      "Backend/Modules/DynamicForms/Controllers/PublicFormsController.cs",
      "Backend/Modules/DynamicForms/Models/DynamicForm.cs",
    ],
  },

  "ai-assistant": {
    key: "ai-assistant",
    purpose:
      "Registers the AI Assistant as a plugin that gates the global AI chat sidebar. The module folder itself contains only a plugin manifest — the actual chat UI lives outside src/modules under src/components/ai-assistant. It centralizes access to a shared AI gateway used across the platform (dashboard-builder AI generation, workflow LLM/email nodes).",
    workflows: [
      {
        name: "Chat with the AI assistant",
        steps: [
          "Open the AI Assistant sidebar (gated by the ai-assistant plugin).",
          "Send a message; the assistant calls AiChatController which persists AiConversations/AiMessages.",
          "Browse past conversations via the chat history sidebar (paged, with an includeArchived option).",
        ],
      },
      {
        name: "Configure a personal AI key",
        steps: [
          "Open AI settings and add a personal provider API key.",
          "UserAiSettingsController stores it in UserAiKey/UserAiPreference.",
          "aiKeyManager's fallback chain consults these preferences when routing AI calls.",
        ],
      },
    ],
    rules: [
      { title: "UI lives outside the module folder", detail: "All chat UI/UX (message list, streaming, model switch) is implemented under src/components/ai-assistant, not under src/modules/ai-assistant." },
      { title: "Centralized AI gateway", detail: "Other modules call the shared @/services/aiKeyManager (callWithFallback, AI_MODELS) instead of holding their own API keys." },
      { title: "Per-user BYO keys supported", detail: "UserAiSettingsController lets a user provide their own AI provider keys/preferences, consulted by the gateway's fallback chain." },
      { title: "Conversations are paged", detail: "GET conversations supports paging and an includeArchived flag." },
    ],
    integrations: [
      "dashboard-builder's AI dashboard generation uses the same gateway.",
      "workflow's LLM/email nodes use the same gateway.",
    ],
    gotchas: [
      "Don't look for chat feature code in src/modules/ai-assistant — it only contains the plugin manifest.",
    ],
    sources: [
      "src/modules/ai-assistant/plugin.ts",
      "src/components/ai-assistant/AiAssistantSidebar.tsx",
      "src/components/ai-assistant/ChatHistorySidebar.tsx",
      "src/services/aiKeyManager.ts",
      "Backend/Modules/AiChat/Controllers/AiChatController.cs",
      "Backend/Modules/UserAiSettings/Controllers/UserAiSettingsController.cs",
    ],
  },

  "website-builder": {
    key: "website-builder",
    purpose:
      "A full drag-and-drop website/landing-page builder supporting multi-page sites, 60+ content blocks (hero, pricing, FAQ, cart/checkout, forms, embeds), theming, multi-language, brand profiles, and publishing/export. It also includes a mini e-commerce capability (cart/checkout blocks with product catalog sync) and per-site form submission collection.",
    workflows: [
      {
        name: "Create and edit a site",
        steps: [
          "Open Website Builder to see the Site Manager list of sites.",
          "Create or select a site to enter the Site Editor; the app's main sidebar auto-collapses.",
          "Add pages and drag blocks from the component palette onto the canvas.",
          "Configure each block's properties, design, and SEO in the right panel.",
          "Exit the editor to restore the main sidebar.",
        ],
      },
      {
        name: "Publish a site",
        steps: [
          "Open the Publish dialog from the editor toolbar.",
          "Confirm publish; the backend sets Published=true, PublishedAt, and PublishedUrl.",
          "The site becomes reachable at its published URL; content remains stored even if later unpublished.",
        ],
      },
      {
        name: "Collect leads via a contact form block",
        steps: [
          "Add a Contact Form block to a page and configure it in FormSettingsEditor.",
          "A visitor submits the form on the live site.",
          "The submission is stored as a WBFormSubmission.",
          "Review submissions in FormSubmissionsPanel.",
        ],
      },
    ],
    rules: [
      { title: "Editor collapses the main sidebar", detail: "Entering SiteEditor auto-collapses the app's main navigation sidebar and restores it on exit/unmount." },
      { title: "Publish just flips flags", detail: "Publishing sets Published/PublishedAt/PublishedUrl; unpublishing presumably only flips Published back, content is retained." },
      { title: "Language config must be valid JSON", detail: "Multi-language switching depends on LanguagesJson being valid JSON on the site record." },
      { title: "Export is asynchronous", detail: "Export dialogs show multi-step progress, implying export (static HTML/zip) runs as a longer background process." },
      { title: "Global blocks are reusable across pages", detail: "GlobalBlocksPanel manages WBGlobalBlock/WBGlobalBlockUsage records shared across multiple pages of a site." },
      { title: "Page versioning is tracked", detail: "PageVersionsPanel is backed by WBPageVersion, implying page history/rollback support." },
      { title: "Init blocks first paint", detail: "storageProvider.initApiProviders blocks first paint until persistence providers are ready." },
    ],
    integrations: [
      "Contact/checkout blocks can generate leads/orders feeding into contacts/sales-style records.",
      "Catalog sync blocks pull from the articles/inventory catalog.",
    ],
    gotchas: [
      "There is no internal router — the module is a simple state machine toggling between Site Manager and Site Editor.",
      "Unpublishing does not delete content, only flips the Published flag.",
    ],
    sources: [
      "src/modules/website-builder/WebsiteBuilderModule.tsx",
      "src/modules/website-builder/services/storageProvider.ts",
      "src/modules/website-builder/components/renderer/blockRegistry.ts",
      "src/modules/website-builder/components/editor/FormSettingsEditor.tsx",
      "src/modules/website-builder/components/editor/PageVersionsPanel.tsx",
      "Backend/Modules/WebsiteBuilder/Controllers/WBSitesController.cs",
      "Backend/Modules/WebsiteBuilder/Models/WBSite.cs",
    ],
  },

  external: {
    key: "external",
    purpose:
      "An 'Integration Hub' that lets a tenant create inbound webhook receivers with API keys, connect to pre-built ERP/third-party connectors via a wizard, browse inbound request logs, and heuristically convert an inbound payload into a CRM record (Contact/Offer/Sale). It is the platform's main entry point for external system integration.",
    workflows: [
      {
        name: "Create a custom webhook endpoint",
        steps: [
          "Open Integration Hub and choose Create Endpoint.",
          "Configure name, description, and allowed origins.",
          "The backend generates a hashed API key; the raw key is shown once and can only be re-revealed via a dedicated reveal endpoint.",
          "Save; the endpoint is now live at api/external-receive/{slug}.",
        ],
      },
      {
        name: "Connect a pre-built connector",
        steps: [
          "Browse the connector catalog and pick one (e.g. an ERP system).",
          "Follow the connection wizard at connect/:connectorId.",
          "Provide required credentials/config for that connector template.",
          "Save to create the corresponding external connection/endpoint.",
        ],
      },
      {
        name: "Review inbound logs and convert to CRM",
        steps: [
          "Open an endpoint's detail page and browse its request logs.",
          "Mark logs as read, or delete/clear them as needed.",
          "For a promising inbound payload, run convertPreview to get a heuristic Contact+Items mapping.",
          "Review/adjust the preview (convertValidation) before committing it as an Offer or Sale.",
        ],
      },
    ],
    rules: [
      { title: "Route order matters", detail: "connect/:connectorId must be declared before :id in the router to avoid a route clash." },
      { title: "API keys are one-way hashed", detail: "Stored API keys are hashed server-side; they're masked in list/get responses and only revealed on demand via a dedicated reveal endpoint." },
      { title: "No server-side 'test endpoint' call", detail: "TestEndpointModal posts directly to the endpoint's public URL from the browser, since hashed keys can't be replayed by the backend." },
      { title: "Inbound body size capped", detail: "ExternalReceiveController caps inbound request bodies to 1 MiB (MaxBodyBytes)." },
      { title: "Sensitive headers are stripped", detail: "Authorization, Proxy-Authorization, Cookie, Set-Cookie, X-Api-Key, X-Auth-Token, X-Access-Token, X-Csrf-Token are stripped/never persisted from inbound logs." },
      { title: "Per-tenant CORS handled manually", detail: "ExternalReceiveController implements manual CORS preflight per endpoint by resolving the endpoint via slug and echoing its configured AllowedOrigins, since global CORS can't express a per-tenant allowlist." },
      { title: "Conversion is heuristic, not authoritative", detail: "convertPreview produces a best-effort Contact+Items mapping that must be reviewed before being committed as a real record." },
      { title: "Public receive endpoint is unauthenticated", detail: "ExternalReceiveController is [AllowAnonymous] by design — inbound webhook calls are validated purely via the endpoint's API key/slug." },
    ],
    integrations: [
      "convertPreview output feeds into creating Offers/Sales in the sales module.",
      "WebhookForwardJob can forward received payloads onward to workflow's webhook triggers (TriggerWebhookAsync).",
    ],
    gotchas: [
      "Once an API key is generated you cannot re-derive the plaintext from the hash — losing the reveal window means regenerating a new key.",
      "Header stripping is an allow/deny list, not exhaustive — don't assume all sensitive data is scrubbed from logs.",
    ],
    sources: [
      "src/modules/external/ExternalModule.tsx",
      "src/modules/external/services/externalEndpoints.service.ts",
      "src/modules/external/utils/connectorCatalog.ts",
      "src/modules/external/utils/convertValidation.ts",
      "Backend/Modules/External/Controllers/ExternalEndpointsController.cs",
      "Backend/Modules/External/Controllers/ExternalReceiveController.cs",
      "Backend/Modules/External/Models/ExternalEndpoint.cs",
    ],
  },

  testing: {
    key: "testing",
    purpose:
      "An internal developer/QA tool: an in-app API test runner and backend-log viewer. It is not a normal business plugin (no plugin manifest) and is presumably reachable only via a dev/settings route. It runs curated black-box smoke tests against the live backend REST APIs.",
    workflows: [
      {
        name: "Run a test suite",
        steps: [
          "Open the API Tests page.",
          "Select a domain suite (e.g. articlesTests, contactsTests, salesTests, usersTests).",
          "apiTestRunner executes the suite against the live backend and asserts response shape/status.",
          "Results render in the table/test data visualizer.",
        ],
      },
      {
        name: "Correlate results with backend logs",
        steps: [
          "After a test run, open the backend logs panel.",
          "backendLogsService fetches application logs for the same time window.",
          "Cross-reference failed assertions with backend log entries.",
        ],
      },
    ],
    rules: [
      { title: "No plugin manifest", detail: "There is no plugin.ts for this module; it isn't a toggleable business plugin like the rest." },
      { title: "Tests hit real endpoints", detail: "Suites are black-box smoke tests against live domain controllers (Articles, Contacts, Dispatches, Installations, Lookups, Offers, Preferences, Projects, Roles, Sales, ServiceOrders, Skills, Tasks, Upload, Users), not mocked unit tests." },
      { title: "No dedicated backend controller", detail: "The module calls existing domain controllers as a regular API client would; there is no Testing-specific controller." },
      { title: "Results are in-memory only", detail: "testDataStore caches the last run's results/test data in memory — not persisted across reloads." },
    ],
    integrations: [
      "Exercises nearly every domain module's API surface for smoke testing.",
    ],
    gotchas: [
      "Running these suites hits real backend data — treat it as a developer/QA tool, not something to expose to end users.",
      "Because there's no plugin manifest, it won't appear in normal plugin-management UI.",
    ],
    sources: [
      "src/modules/testing/pages/ApiTestsPage.tsx",
      "src/modules/testing/services/apiTestRunner.ts",
      "src/modules/testing/services/backendLogsService.ts",
      "src/modules/testing/stores/testDataStore.ts",
      "src/modules/testing/tests/index.ts",
    ],
  },
};

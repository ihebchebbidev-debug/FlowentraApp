import type { ModuleGuideMap } from "../types";

export const ADMIN_GUIDES: ModuleGuideMap = {
  hr: {
    key: "hr",
    purpose:
      "Full HR back-office covering employee master data, leave, attendance, Tunisian payroll (IRPP/CNSS), performance reviews, recruitment, and departments. It is deeply plugin-gated (PL0013HR, non-core) and permission-gated per sub-feature. All HR data is tenant-scoped and every mutation is audited.",
    workflows: [
      {
        name: "Run and pay payroll",
        steps: [
          "Admin triggers payroll/run for a period.",
          "System calculates salaries using authoritative server-side tax logic in HrService, mirrored client-side for preview by tunisianTaxEngine.ts.",
          "Admin reviews entries, then calls payroll/runs/{id}/confirm to lock the run.",
          "Admin calls the /pay endpoint as a separate final step to disburse.",
        ],
      },
      {
        name: "Employee leave request",
        steps: [
          "Employee submits a leave request via LeaveRequestForm.",
          "Balance is checked against HrLeaveBalance, a ledger separate from the generic UserLeave table.",
          "Manager approves/rejects via LeaveApproval.",
          "Balance is updated through PUT leaves/balances/{userId}.",
        ],
      },
      {
        name: "Recruitment pipeline",
        steps: [
          "Create a job opening (HrJobOpening).",
          "Add applicants and notes (HrApplicant, HrApplicantNote).",
          "Schedule interviews (HrInterview).",
          "Move applicant through pipeline stages under recruitment/* routes.",
        ],
      },
    ],
    rules: [
      {
        title: "Permission-gated actions",
        detail:
          "All HR actions are checked against the hr permission module (create/read/update/delete) via useHrPermissionGuard/HrPermissionButton, backed by PermissionService.AvailablePermissions[\"hr\"].",
      },
      {
        title: "Controller-level authorization",
        detail: "HrController requires [Authorize] at the class level for every endpoint.",
      },
      {
        title: "Tenant scoping",
        detail:
          "HR entities carry TenantId and are filtered automatically by ApplicationDbContext's global query filter — no cross-tenant leakage is possible at the ORM layer.",
      },
      {
        title: "Two-step payroll disbursement",
        detail:
          "A payroll run must be confirmed (confirm) before it can be paid (pay), preventing accidental disbursement in a single step.",
      },
      {
        title: "Versioned CNSS rates",
        detail:
          "CNSS rates are stored as versioned records (HrCnssRate) with an active-rate endpoint, so rate changes never retroactively affect already-calculated past payslips.",
      },
      {
        title: "Separate leave ledger",
        detail: "HrLeaveBalance is a dedicated HR ledger, independent of the generic UserLeave/UserWorkingHours tables used elsewhere in the app.",
      },
      {
        title: "Full audit trail",
        detail: "Every payroll/HR mutation is written to HrAuditLog, retrievable via GET /api/hr/audit.",
      },
      {
        title: "Bulk attendance import",
        detail: "Attendance supports bulk ingestion via POST attendance/import, with grace periods/rounding configured under attendance/settings.",
      },
      {
        title: "Plugin gating",
        detail: "The whole HR module is registered under plugin PL0013HR and is non-core, so it can be fully disabled per tenant subject to dependency checks.",
      },
    ],
    integrations: [
      "Skills module for technician/employee competency matching",
      "Users module for the underlying account (HR employee record is distinct from the User table)",
      "Settings/Plugins for module activation and permission catalog",
      "Preferences/PDF settings for payslip PDF branding (PaySlipPDF.tsx)",
    ],
    gotchas: [
      "Attendance records can be deleted (DELETE attendance/{id}) with no visible guard against periods already covered by a confirmed payroll run — this can desync payslip data.",
      "Client-side tax engine (tunisianTaxEngine.ts) is preview-only; the server calculation in HrService.cs is authoritative and must remain in sync.",
    ],
    sources: [
      "src/modules/hr/HRModule.tsx",
      "src/modules/hr/utils/tunisianTaxEngine.ts",
      "Backend/Modules/HR/Controllers/HrController.cs",
      "Backend/Modules/HR/Services/HrService.cs",
      "Backend/Modules/HR/Services/HrService.PerformanceRecruitment.cs",
      "Backend/Modules/Roles/Services/PermissionService.cs",
    ],
  },

  skills: {
    key: "skills",
    purpose:
      "Central skill taxonomy used for individual user competency tagging and role-based default skill sets. It is used elsewhere in the app, e.g. for dispatcher/service-order technician matching, so skill data doubles as capability metadata for scheduling.",
    workflows: [
      {
        name: "Manage skill catalog",
        steps: [
          "Admin opens SkillsManagement and adds/edits a skill via AddEditSkillModal.",
          "Skill is optionally tagged with a category.",
          "Skills can be filtered by category via GET /category/{category}.",
        ],
      },
      {
        name: "Assign skills to users or roles",
        steps: [
          "Assign a skill directly to a user via POST {skillId}/assign/{userId}.",
          "Or assign a skill to a role via POST role/{roleId}/assign/{skillId}, implying every user with that role should have the skill.",
          "Remove assignments via the corresponding DELETE endpoints.",
          "View a role's expected skill set via GET role/{roleId}.",
        ],
      },
    ],
    rules: [
      { title: "Two assignment axes", detail: "Skills can be assigned to a specific user (UserSkill) or to a role (RoleSkill), each with its own assign/remove endpoints." },
      { title: "Category filtering", detail: "Skills carry a category field, queryable via GET /category/{category}." },
      { title: "No class-level [Authorize]", detail: "SkillsController has no visible [Authorize] attribute at the class level, unlike Users/HR — it relies on global auth middleware rather than local decoration." },
      { title: "Junction tables", detail: "UserSkill and RoleSkill are the backing tables for the two assignment axes, each with their own EF configuration class." },
    ],
    integrations: [
      "HR module (technician/employee competency)",
      "Dispatcher/service-order modules (technician-to-job matching)",
      "Settings' SkillAssignmentModal for role skill assignment",
    ],
    gotchas: [
      "Missing explicit class-level [Authorize] should be verified against global auth filters — potential gap relative to other admin modules.",
      "Duplicate assignment handling (same skill assigned twice) depends on service-layer uniqueness checks, not visible at the controller.",
      "Deleting a skill still referenced by UserSkill/RoleSkill rows could orphan rows unless FK cascade is configured.",
    ],
    sources: [
      "src/modules/skills/SkillsModule.tsx",
      "src/modules/skills/SkillsManagement.tsx",
      "Backend/Modules/Skills/Controllers/SkillsController.cs",
      "Backend/Configurations/UserSkillConfiguration.cs",
      "Backend/Configurations/RoleSkillConfiguration.cs",
    ],
  },

  users: {
    key: "users",
    purpose:
      "Core user directory: CRUD, password lifecycle (forgot/reset/change), profile pictures, role assignment, and multi-tenant boundary enforcement for regular application users. This is distinct from MainAdminUser, the platform super-admin identity used by Settings/Auth.",
    workflows: [
      {
        name: "Create and configure a user",
        steps: [
          "Admin opens CreateUserModal/AddUserModal and enters user details.",
          "Email uniqueness is checked live via GET check-email.",
          "User is created with TenantId stamped automatically by ApplicationDbContext.",
          "Admin assigns roles via RoleAssignmentModal, writing to the UserRole join table.",
        ],
      },
      {
        name: "Password reset",
        steps: [
          "User or admin initiates forgot-password.",
          "OTP is verified via verify-otp.",
          "New password is set via reset-password.",
        ],
      },
    ],
    rules: [
      { title: "Admin-only user management", detail: "UsersController is [Authorize]-guarded at the class level; a code comment states only authenticated MainAdminUsers can access it — user management is not delegated to regular tenant users without separate permission gating." },
      { title: "Tenant scoping via global query filter", detail: "The User entity carries TenantId; ApplicationDbContext stamps it automatically on insert (StampTenantIdOnNewEntities) and applies a global EF query filter, structurally preventing cross-tenant leakage." },
      { title: "Shared vs per-company scoping", detail: "A -1 TenantId sentinel means 'no filter' (platform-level MainAdminUser context); modules can be configured shared or per_company via Settings' Module Scope." },
      { title: "Dual password-reset flow", detail: "Forgot/verify-otp/reset-password endpoints exist on both UsersController (admin-driven reset of another user) and AuthController (self-service reset)." },
      { title: "Live email uniqueness check", detail: "useEmailValidation.ts calls GET check-email before submission, but this is a client-side pre-check only." },
      { title: "Role assignment is separate from HR", detail: "RoleAssignmentModal writes to the UserRole many-to-many join table, independent of the HR employee record." },
    ],
    statuses: [],
    integrations: [
      "Auth module for login/session issuance",
      "HR module (separate employee record, linked but not identical to User)",
      "Settings (UsersAdminPage, RolesAdminPage) for admin-facing user/role management",
    ],
    gotchas: [
      "Email uniqueness check is client-triggered only — a race condition is possible between the check and the actual submit; server should re-validate on POST.",
      "Deleting a user while still referenced by UserRole/HrEmployeeSalaryConfig/assigned tasks is a cross-module integrity concern with no single documented guard.",
      "Automatic TenantId stamping could be bypassed if a manual TenantId override in a DTO isn't stripped server-side.",
    ],
    sources: [
      "src/modules/users/UsersModule.tsx",
      "Backend/Modules/Users/Controllers/UsersController.cs",
      "Backend/Data/ApplicationDbContext.cs",
      "src/modules/users/hooks/useEmailValidation.ts",
    ],
  },

  auth: {
    key: "auth",
    purpose:
      "Authentication for two parallel identity types: MainAdminUser (platform administrator seeded per tenant, used to bootstrap a company) and regular User (tenant employee). Implements JWT session issuance, refresh tokens, Google OAuth, email verification, forgot/reset password, and email-based 2FA for elevated logins.",
    workflows: [
      {
        name: "Admin login",
        steps: [
          "Admin submits credentials to POST /login.",
          "AuthService.LoginAsync validates credentials and determines if 2FA is required.",
          "If required, a ChallengeToken is issued and the OTP is emailed.",
          "TwoFactorController.Verify exchanges the ChallengeToken + OTP for real tokens.",
        ],
      },
      {
        name: "Tenant user login with company switch",
        steps: [
          "User submits credentials to POST /user-login, handled by AuthService.UserLoginAsync.",
          "UserCanSwitchCompanyAsync determines whether the user may switch tenant context.",
          "This capability is embedded as a JWT claim and drives SelectCompany.tsx.",
          "Refresh tokens rotate via POST /refresh, inspecting which table (admin or user) the token belongs to.",
        ],
      },
      {
        name: "Google OAuth sign-in",
        steps: [
          "User clicks GoogleSignIn, redirected through OAuthCallbackController.",
          "AuthService.OAuthLoginAsync(email) links or creates an account by email only, with no password check.",
        ],
      },
    ],
    rules: [
      { title: "Two distinct login endpoints", detail: "POST /login (admin) and POST /user-login (tenant user) map to separate AuthService methods and must always be disambiguated downstream by principal type." },
      { title: "JWT signing key", detail: "JWT signing uses the Jwt:Key config value, with a hardcoded fallback secret in code — a security risk if config is ever missing in production." },
      { title: "Refresh token rotation", detail: "Refresh tokens are persisted on the user/admin row and rotated on POST /refresh." },
      { title: "Company-switch permission", detail: "Switch-company capability is computed at login and tied to RBAC via the settings permission module's switch_company action." },
      { title: "Two-step 2FA challenge", detail: "Login first issues a ChallengeToken; TwoFactorController.Verify then exchanges the token plus emailed OTP for actual session tokens, decoupling credential check from OTP verification." },
      { title: "Email verification is a separate flow", detail: "EmailVerificationController/EmailVerificationService handle email confirmation independently of login." },
      { title: "OAuth trusts email verification upstream", detail: "OAuth login is email-based with no password check, relying entirely on Google-side verification of the email." },
      { title: "Tenant stamping on signup", detail: "AuthService calls _context.GetTenantId() during signup to stamp newly created tenant-scoped rows." },
    ],
    integrations: [
      "Users module (regular User table)",
      "Settings (switch_company permission, RBAC)",
      "Onboarding (signup creates the initial Tenant/MainAdminUser/User rows)",
    ],
    gotchas: [
      "Hardcoded JWT fallback secret is a real production risk if Jwt:Key config is missing.",
      "test-db/test-signup endpoints on AuthController look like diagnostic leftovers that should be removed or gated in production.",
      "Dual admin/user login paths mean every downstream authorization check must disambiguate principal type.",
    ],
    sources: [
      "Backend/Modules/Auth/Controllers/AuthController.cs",
      "Backend/Modules/Auth/Services/AuthService.cs",
      "Backend/Modules/Auth/Controllers/TwoFactorController.cs",
      "Backend/Modules/Roles/Services/PermissionService.cs",
      "src/modules/auth/pages/Login.tsx",
      "src/modules/auth/pages/SelectCompany.tsx",
    ],
  },

  settings: {
    key: "settings",
    purpose:
      "Administrative control-plane module: company/application settings, RBAC (roles & permissions UI), user groups, plugin/module activation, numbering-sequence configuration, module scope (shared vs per-tenant), subscription, integrations, database introspection tooling, and system logs. It is the module that governs how every other module is configured and unlocked.",
    workflows: [
      {
        name: "Manage roles and permissions",
        steps: [
          "Admin opens RolesAdminPage / RoleManagement.",
          "RolePermissionsEditor edits a role's permission grants against the AvailablePermissions catalog.",
          "Changes are saved through RolesController/PermissionsController.",
        ],
      },
      {
        name: "Activate or deactivate a plugin/module",
        steps: [
          "Admin opens PluginsPage / ActivatedModulesSection.",
          "PluginsController calls PluginService.SetActivationAsync.",
          "Core plugins reject deactivation with PluginCoreLockedException.",
          "Disabling a plugin with an enabled dependent throws PluginDependencyConflictException.",
        ],
      },
      {
        name: "Configure a numbering sequence",
        steps: [
          "Admin opens NumberingSettings and defines a template, ResetFrequency and StartValue.",
          "ValidateTemplate checks the template syntax before saving.",
          "PreviewAsync/PreviewFromTemplate lets the admin preview generated numbers without consuming the sequence.",
          "At runtime, NumberingService atomically increments the sequence via an upsert keyed by entity_name + period_key.",
        ],
      },
      {
        name: "Toggle module scope",
        steps: [
          "Admin opens ModuleScopeDialog for a module.",
          "Chooses shared vs per_company scoping.",
          "ModuleScopeController persists the setting, changing how TenantId semantics apply to that module's data going forward.",
        ],
      },
    ],
    rules: [
      { title: "Authoritative permission catalog", detail: "PermissionService.AvailablePermissions is the single source of truth for all permission modules/actions and must be kept as a superset of the frontend permissions.ts catalog — a manual sync risk if not kept aligned." },
      { title: "Core plugins cannot be disabled", detail: "Plugins flagged IsCore=true reject deactivation with PluginCoreLockedException." },
      { title: "Plugin dependency enforcement", detail: "Disabling a plugin fails with PluginDependencyConflictException if any enabled dependent plugin still relies on it, computed one level deep via KnownPlugins.Dependents(code)." },
      { title: "Default-on plugin state", detail: "Plugins with no explicit activation record default to enabled." },
      { title: "Unknown plugin codes allowed", detail: "Unknown plugin codes pass through for forward compatibility; known codes are validated against the KnownPlugins catalog." },
      { title: "Atomic numbering sequence increment", detail: "Sequence state is persisted in NumberSequences keyed by entity_name + period_key, using a Postgres-specific upsert (INSERT ... ON CONFLICT DO UPDATE) for atomic increment." },
      { title: "Numbering preview does not consume the sequence", detail: "PreviewAsync/PreviewFromTemplate generate sample numbers without incrementing the real counter." },
      { title: "Module scope controls tenant siloing", detail: "ModuleScopeSetting toggles whether a module's data is siloed per tenant or globally shared, backing the TenantId=0/shared vs per_company semantics in ApplicationDbContext." },
      { title: "Three core modules cannot be deactivated", detail: "auth, settings, and system are registered isCore:true in their plugin manifests and can never be turned off via the Plugins UI/API." },
    ],
    integrations: [
      "Every module: settings is where permissions, plugin activation, and module scope for all other modules are configured",
      "Users module (RolesAdminPage/UsersAdminPage share this space)",
      "Preferences/PDF settings and Numbering feed document generation across Sales, Offers, HR payroll, etc.",
    ],
    gotchas: [
      "Manual sync requirement between backend AvailablePermissions and frontend PERMISSION_MODULES can silently desync.",
      "Plugin dependency check only looks one level via Dependents() — deep transitive chains could still be inconsistent.",
      "Numbering upsert relies on Postgres-specific ON CONFLICT, tying the module to Postgres.",
      "Toggling module scope live (shared to per_company or back) on a module with existing data could strand or duplicate rows since TenantId semantics change retroactively unless a migration script runs.",
    ],
    sources: [
      "Backend/Modules/Roles/Services/PermissionService.cs",
      "Backend/Modules/Plugins/Services/PluginService.cs",
      "Backend/Modules/Numbering/Services/NumberingService.cs",
      "Backend/Data/ApplicationDbContext.cs",
      "src/modules/settings/pages/PluginsPage.tsx",
      "src/modules/settings/pages/RolesAdminPage.tsx",
      "src/modules/settings/components/NumberingSettings.tsx",
      "src/modules/settings/components/ModuleScopeDialog.tsx",
    ],
  },

  system: {
    key: "system",
    purpose:
      "Background/scheduled process management ('Processes') giving admins visibility and control over recurring maintenance jobs such as log purge and failed-email retry. It runs as a true .NET BackgroundService and exposes admin controls to pause, resume, run-on-demand, and inspect run history.",
    workflows: [
      {
        name: "Inspect and manage a scheduled process",
        steps: [
          "Admin opens ProcessesPage and views schedules via GET schemas / GET schedules.",
          "Admin can pause, enable, or reset-failures on a schedule via schedules/{key}/pause|enable|reset-failures.",
          "Admin can trigger an immediate run via POST run with a RunNowRequest.",
          "Admin can stop a currently running job via schedules/{key}/stop and inspect history via GET runs/{key}.",
        ],
      },
    ],
    rules: [
      { title: "Fixed-interval scheduler", detail: "ProcessSchedulerService ticks on a fixed TickInterval, with a 15-second startup delay before the first tick." },
      { title: "Startup reconciliation", detail: "On startup the scheduler reconciles stale/orphaned runs left 'running' from a prior crash before proceeding." },
      { title: "Built-in schedule seeding", detail: "SeedBuiltInSchedulesAsync seeds schedules from a static BuiltInSchedules array and logs a warning if a registered IProcessHandler has no corresponding built-in schedule entry." },
      { title: "Advisory-lock concurrency safety", detail: "Each schedule execution acquires a Postgres advisory lock so only one instance/replica executes a given schedule at a time." },
      { title: "Handler pattern", detail: "Concrete jobs implement IProcessHandler (e.g. PurgeSystemLogsHandler, RetryFailedEmailsHandler, InvoicesMarkOverdueHandler)." },
      { title: "BlockReason field length", detail: "ProcessSchedule.BlockReason is capped at 500 characters, used to record why a schedule is paused or blocked." },
    ],
    statuses: [
      { name: "Paused", meaning: "Schedule is manually paused and will not tick." },
      { name: "Enabled", meaning: "Schedule is active and will run on its interval." },
      { name: "Running", meaning: "Job is currently executing, tracked in RunningProcessRegistry." },
      { name: "Blocked", meaning: "Schedule has BlockReason set, typically due to repeated failures." },
    ],
    integrations: [
      "Core plugin (isCore:true) — cannot be deactivated via Plugins",
      "Underlies maintenance for logs, email retries, and other cross-module background jobs",
    ],
    gotchas: [
      "Advisory locks require the DB connection to remain open for the lock's duration — connection pooling misconfiguration could release locks early, causing duplicate execution.",
      "reset-failures could be misused to force a broken handler back into rotation without fixing the root cause.",
      "run-now (POST run) may bypass the schedule's own advisory lock unless it also acquires it — a potential double-run race if used while a scheduled tick is in flight.",
    ],
    sources: [
      "Backend/Modules/Processes/Services/ProcessSchedulerService.cs",
      "Backend/Modules/Processes/Controllers/ProcessesController.cs",
      "src/modules/system/pages/ProcessesPage.tsx",
      "src/modules/system/services/processesService.ts",
    ],
  },

  lookups: {
    key: "lookups",
    purpose:
      "Central reference-data/master-data registry (statuses, categories, types, priorities) consumed across almost every other module — articles, offers, sales, service orders, tasks, projects, dispatch, HR leave types, etc. — to keep enumerations tenant-configurable instead of hardcoded.",
    workflows: [
      {
        name: "Manage a lookup category",
        steps: [
          "Admin opens LookupsPage and selects a hub via HubList.",
          "GroupSelector navigates hierarchical group → item structures where applicable.",
          "LookupTable provides a generic CRUD grid for adding/editing/removing items in that category.",
        ],
      },
    ],
    rules: [
      { title: "Per-category dedicated endpoints", detail: "LookupsController exposes 15+ resource families (article-categories, task-statuses, offer-statuses, etc.), each with its own full CRUD route set rather than one generic /lookups/{type} endpoint — adding a new lookup category requires new endpoints." },
      { title: "Mixed generic and dedicated models", detail: "Most simple enumerations use a single generic LookupItem model, but Currency, InstallationCategory, and InstallationType are dedicated tables for stronger relational integrity." },
      { title: "Tenant scoping applies by default", detail: "Lookup types inherit the same global TenantId query filter as other entities unless explicitly configured 'shared' via Settings' Module Scope." },
      { title: "Hierarchical grouping", detail: "Some lookups are organized as group → items (e.g. article-groups containing article-categories) via GroupSelector." },
      { title: "Preferences co-located here", detail: "A second PreferencesController physically lives under the Lookups module folder, separate from the dedicated Preferences module — an organizational quirk, not a functional lookup." },
    ],
    integrations: [
      "Articles, Offers, Sales, Service Orders, Tasks, Projects, Dispatch, HR (leave types) — all consume lookup values for their status/category/type fields",
      "Settings Module Scope controls whether a lookup category is tenant-siloed or shared",
    ],
    gotchas: [
      "Deleting a lookup value still referenced elsewhere (e.g. an offer-status still used by existing offers) has no visible guard at the controller level — relies on FK constraints or soft-delete inside LookupService.",
      "Two PreferencesController classes exist across Lookups and Preferences modules — a maintenance smell worth being aware of when tracing preferences bugs.",
    ],
    sources: [
      "Backend/Modules/Lookups/Controllers/LookupsController.cs",
      "Backend/Modules/Lookups/Models/",
      "src/modules/lookups/LookupsModule.tsx",
      "src/modules/lookups/components/HubList.tsx",
      "src/modules/lookups/components/LookupTable.tsx",
    ],
  },

  preferences: {
    key: "preferences",
    purpose:
      "Per-user application preferences (UI/locale/notification defaults) and company-level PDF-generation/document-branding settings, decoupled from company-wide Settings so each user can override personal display options. The frontend module itself is data-light and mostly a plugin/locale registration shell; its UI is embedded inside Settings and Onboarding.",
    workflows: [
      {
        name: "View or update personal preferences",
        steps: [
          "User opens UserPreferencesTab inside Settings.",
          "GET (current user) loads existing preferences.",
          "PUT saves updated values.",
          "DELETE resets preferences to defaults.",
        ],
      },
      {
        name: "Admin edits another user's preferences",
        steps: [
          "Admin calls GET {userId} / PUT {userId} on PreferencesController.",
          "A permission check is expected inside PreferenceService (not visible at the attribute level).",
        ],
      },
    ],
    rules: [
      { title: "Preferences data is fragmented across three models", detail: "UserPreferences (Users module), UserPreference (dedicated Preferences module), and a second PreferencesController hosted in the Lookups module all represent preference-shaped data with overlapping responsibility." },
      { title: "PDF settings are company-level, not per-user", detail: "PdfSettingsController manages document/PDF branding defaults (used by HR payslips, invoices, offers) despite living in the 'Preferences' module — this is tenant-level, not per-user." },
      { title: "Admin can view/edit another user's preferences", detail: "GET/PUT {userId} variants exist, implying an internal permission check in PreferenceService that isn't visible via controller attributes." },
      { title: "Reset to defaults", detail: "DELETE on PreferencesController resets a user's preferences back to defaults rather than deleting the row outright." },
    ],
    integrations: [
      "HR (PaySlipPDF branding via PdfSettings)",
      "Sales/Offers document generation (PDF branding defaults)",
      "Onboarding's PreferencesStep writes initial preference values",
    ],
    gotchas: [
      "Naming/route collision risk between the two PreferencesController classes (Preferences module vs Lookups module) with different DTOs — must verify they mount under different base routes.",
      "UserPreferences (Users) and UserPreference (Preferences) may map to similarly-named tables — verify no schema drift or duplicate storage of the same conceptual data.",
      "Permission checks for admin-editing-another-user's-preferences are not visible at the controller level and must be verified inside PreferenceService.",
    ],
    sources: [
      "Backend/Modules/Preferences/Controllers/PreferencesController.cs",
      "Backend/Modules/Preferences/Controllers/PdfSettingsController.cs",
      "Backend/Modules/Lookups/Controllers/PreferencesController.cs",
      "Backend/Data/ApplicationDbContext.cs",
      "src/modules/settings/components/UserPreferencesTab.tsx",
    ],
  },

  onboarding: {
    key: "onboarding",
    purpose:
      "First-run wizard for a newly created tenant/admin: captures company info, personal info, work-area/module selection, email & calendar connection, website-builder bootstrap, profile picture, and preference defaults, culminating in a guided setup-loading step. It has no dedicated backend controller of its own — it is a pure frontend orchestration layer calling into other modules' APIs.",
    workflows: [
      {
        name: "Complete the onboarding wizard",
        steps: [
          "CompanyInfoStep and PersonalInfoStep populate the initial Tenant/MainAdminUser/User rows created during signup.",
          "WorkAreaStep selects which modules (e.g. HR, Skills, Lookups) get activated, calling PluginsController.SetActivationAsync.",
          "EmailCalendarStep and WebsiteBuilderStep initiate connections to the EmailAccounts/Calendar and WebsiteBuilder modules.",
          "PreferencesStep writes initial values into one of the preferences tables.",
          "SetupLoadingStep polls provisioning status before redirecting into the app shell.",
        ],
      },
    ],
    rules: [
      { title: "Work-area selection drives plugin activation", detail: "WorkAreaStep maps to module activation via PluginsController.SetActivationAsync, so IsCore/dependency constraints from the Settings/Plugins module apply at onboarding time too." },
      { title: "Signup stamps the first tenant rows", detail: "CompanyInfoStep/PersonalInfoStep feed AuthController.signup, which is where TenantId stamping first occurs for the new Tenant/MainAdminUser/User rows." },
      { title: "No dedicated onboarding backend entity", detail: "There is no onboarding-session table; each step calls directly into Auth, Plugins, Preferences, EmailAccounts, and WebsiteBuilder APIs sequentially." },
      { title: "Duplicate locale directories", detail: "Both locale/ and locales/ directories exist for onboarding i18n — only one is likely wired into the actual i18n loader." },
    ],
    integrations: [
      "Auth (signup creates Tenant/MainAdminUser/User)",
      "Settings/Plugins (module activation for chosen work areas)",
      "Preferences (initial preference values)",
      "EmailAccounts/Calendar and WebsiteBuilder modules for initial connection setup",
    ],
    gotchas: [
      "Multi-step wizard with no dedicated backend session entity means partial completion (e.g. browser closed mid-wizard) can leave an inconsistent tenant state — Tenant/MainAdminUser created but work-area/preferences never persisted — unless each step's API call is independently idempotent and resumable.",
      "Duplicate locale/ vs locales/ directories risk missing-translation bugs if only one is wired into the i18n loader.",
    ],
    sources: [
      "src/modules/onboarding/pages/Onboarding.tsx",
      "src/modules/onboarding/components/WorkAreaStep.tsx",
      "Backend/Modules/Auth/Controllers/AuthController.cs",
      "Backend/Modules/Auth/Services/AuthService.cs",
      "Backend/Modules/Plugins/Services/PluginService.cs",
    ],
  },
};

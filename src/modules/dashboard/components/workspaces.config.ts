/**
 * Workspace-based navigation config.
 * Level 1 = workspaces (use cases). Level 2 = modules relevant to that use case.
 * Icons are lucide-react component names.
 */

export interface WorkspaceModule {
  key: string;
  label: string;
  /** Optional i18n key resolved via t(); when present it overrides `label` for display. */
  labelI18nKey?: string;
  url: string;
  icon: string;
  /** Optional plugin gate. When present and the plugin is disabled, the module is hidden. */
  pluginCode?: string;
  /** Optional nested children; when present the module renders as a collapsible group. */
  children?: WorkspaceModule[];
  /** Optional section header rendered above this module in the panel. */
  sectionLabel?: string;
}

/**
 * Shared prop shape for any sidebar/navigation item that renders a workspace module.
 * `pluginCode` is optional so consumers can pass it through freely without TS mismatches,
 * and `active` is optional (defaults to false) so lightweight consumers can omit it.
 */
export interface SidebarModuleItemProps {
  url: string;
  icon: string;
  label: string;
  labelI18nKey?: string;
  pluginCode?: string;
  active?: boolean;
  onSelect?: () => void;
}

export interface Workspace {
  id: string;
  label: string;
  /** Optional i18n key resolved via t(); when present it overrides `label` for display. */
  labelI18nKey?: string;
  icon: string;
  /** Route the primary tile navigates to when clicked (usually the workspace's dashboard). */
  landingUrl: string;
  modules: WorkspaceModule[];
}

export const WORKSPACES: Workspace[] = [
  {
    id: "explore",
    label: "Dashboard",
    icon: "Compass",
    landingUrl: "/dashboard",
    modules: [
      { key: "overview", label: "Overview", url: "/dashboard", icon: "Home" },
    ],
  },
  {
    id: "sales",
    label: "Sales",
    icon: "TrendingUp",
    landingUrl: "/dashboard/reporting/sales",
    modules: [
      { key: "sales-dash", label: "Orders dashboard", labelI18nKey: "workspace.modules.ordersDashboard", url: "/dashboard/reporting/sales", icon: "BarChart3" },
      { key: "offers", label: "Offers", url: "/dashboard/offers", icon: "FileText", pluginCode: "PL0005OFFERS" },
      { key: "sales", label: "Orders", labelI18nKey: "workspace.modules.orders", url: "/dashboard/sales", icon: "TrendingUp", pluginCode: "PL0002SALES" },
      { key: "invoices", label: "Invoices", labelI18nKey: "workspace.modules.invoices", url: "/dashboard/invoices", icon: "Receipt", pluginCode: "PL0004INVOICES" },
      { key: "deals", label: "Deals", url: "/dashboard/deals", icon: "Handshake", pluginCode: "PL0003DEALS" },
      { key: "contacts", label: "Customers", url: "/dashboard/contacts?type=customer", icon: "Users", pluginCode: "PL0001CONTACTS" },
      { key: "articles", label: "Articles", url: "/dashboard/inventory-services", icon: "Package", pluginCode: "PL0007ARTICLES" },
      { key: "installations", label: "Installations", url: "/dashboard/field/installations/list", icon: "Wrench", pluginCode: "PL0018INSTALLATIONS" },
      { key: "sales-documents", label: "Documents", url: "/dashboard/documents?workspace=sales", icon: "Folder", pluginCode: "PL0012DOCUMENTS" },
      { key: "sales-traceability", label: "Traceability", url: "/dashboard/traceability?workspace=sales", icon: "Activity" },
    ],
  },
  {
    id: "purchases",
    label: "Purchases",
    icon: "ShoppingCart",
    landingUrl: "/dashboard/reporting/purchase",
    modules: [
      { key: "purchase-dash", label: "Purchases dashboard", url: "/dashboard/reporting/purchase", icon: "BarChart3" },
      { key: "purchases", label: "Purchases", url: "/dashboard/purchases", icon: "ShoppingCart", pluginCode: "PL0025PURCHASES" },
      { key: "suppliers", label: "Suppliers", url: "/dashboard/suppliers", icon: "Truck", pluginCode: "PL0001CONTACTS" },
      { key: "articles", label: "Articles", url: "/dashboard/inventory-services", icon: "Package", pluginCode: "PL0007ARTICLES" },
      { key: "payments", label: "Payments", url: "/dashboard/payments", icon: "CreditCard", pluginCode: "PL0026PAYMENTS" },
      { key: "purchases-documents", label: "Documents", url: "/dashboard/documents?workspace=purchases", icon: "Folder", pluginCode: "PL0012DOCUMENTS" },
      { key: "purchases-traceability", label: "Traceability", url: "/dashboard/traceability?workspace=purchases", icon: "Activity" },
    ],
  },
  {
    id: "service",
    label: "Service",
    icon: "Wrench",
    landingUrl: "/dashboard/reporting/service",
    modules: [
      { key: "service-dash", label: "Service dashboard", url: "/dashboard/reporting/service", icon: "BarChart3" },
      { key: "service-orders", label: "Service orders", url: "/dashboard/field/service-orders/list", icon: "ClipboardList", pluginCode: "PL0016SERVICEORDERS" },
      { key: "dispatches", label: "Dispatches", url: "/dashboard/field/dispatcher", icon: "Send", pluginCode: "PL0017DISPATCHES" },
      { key: "installations", label: "Installations", url: "/dashboard/field/installations/list", icon: "Wrench", pluginCode: "PL0018INSTALLATIONS" },
      { key: "planning", label: "Planning board", url: "/dashboard/field/dispatcher/interface", icon: "CalendarDays", pluginCode: "PL0023SCHEDULING" },
      { key: "articles", label: "Articles", url: "/dashboard/inventory-services", icon: "Package", pluginCode: "PL0007ARTICLES" },
      { key: "contacts", label: "Contacts", url: "/dashboard/contacts", icon: "Users", pluginCode: "PL0001CONTACTS" },
      { key: "service-documents", label: "Documents", url: "/dashboard/documents?workspace=service", icon: "Folder", pluginCode: "PL0012DOCUMENTS" },
      { key: "service-traceability", label: "Traceability", url: "/dashboard/traceability?workspace=service", icon: "Activity" },
    ],
  },
  {
    id: "projects",
    label: "Projects",
    icon: "FolderKanban",
    landingUrl: "/dashboard/tasks/projects",
    modules: [
      { key: "projects", label: "Projects", url: "/dashboard/tasks/projects", icon: "FolderKanban", pluginCode: "PL0004PROJECTS" },
      { key: "contacts", label: "Contacts", url: "/dashboard/contacts", icon: "Users", pluginCode: "PL0001CONTACTS" },
      { key: "calendar", label: "Calendar", url: "/dashboard/calendar", icon: "Calendar", pluginCode: "PL0010CALENDAR" },
      { key: "documents", label: "Documents", url: "/dashboard/documents?workspace=projects", icon: "Folder", pluginCode: "PL0012DOCUMENTS" },
      { key: "projects-traceability", label: "Traceability", url: "/dashboard/traceability?workspace=projects", icon: "Activity" },
    ],
  },
  {
    id: "hr",
    label: "HR",
    icon: "UserCog",
    landingUrl: "/dashboard/reporting/hr",
    modules: [
      { key: "hr-dash", label: "HR dashboard", url: "/dashboard/reporting/hr", icon: "BarChart3" },
      { key: "employees", label: "Employees", url: "/dashboard/hr/employees", icon: "Users", pluginCode: "PL0013HR" },
      { key: "payroll", label: "Payroll", url: "/dashboard/hr/payroll", icon: "Wallet", pluginCode: "PL0013HR" },
      { key: "leaves", label: "Leaves", url: "/dashboard/hr/leaves", icon: "CalendarOff", pluginCode: "PL0013HR" },
      { key: "recruitment", label: "Recruitment", url: "/dashboard/hr/recruitment", icon: "UserPlus", pluginCode: "PL0013HR" },
      { key: "performance", label: "Performance", url: "/dashboard/hr/performance", icon: "Target", pluginCode: "PL0013HR" },
      { key: "skills", label: "Skills", url: "/dashboard/hr/employees?tab=skills", icon: "Award", pluginCode: "PL0014SKILLS" },
      { key: "hr-documents", label: "Documents", url: "/dashboard/documents?workspace=hr", icon: "Folder", pluginCode: "PL0012DOCUMENTS" },
      { key: "hr-traceability", label: "Traceability", url: "/dashboard/traceability?workspace=hr", icon: "Activity" },
    ],
  },
  {
    id: "reporting",
    label: "Reporting",
    icon: "BarChart3",
    landingUrl: "/dashboard/reporting/sales",
    modules: [
      { key: "sales-report", label: "Sales", url: "/dashboard/reporting/sales", icon: "TrendingUp" },
      { key: "service-report", label: "Service", url: "/dashboard/reporting/service", icon: "Wrench" },
      { key: "purchase-report", label: "Purchases", url: "/dashboard/reporting/purchase", icon: "ShoppingCart" },
      { key: "finance-report", label: "Finance", url: "/dashboard/reporting/finance", icon: "DollarSign" },
      { key: "hr-report", label: "HR", url: "/dashboard/reporting/hr", icon: "UserCog" },
      { key: "export-report", label: "Export reports", url: "/dashboard/reporting/export", icon: "Download" },
      { key: "traceability", label: "Traceability", url: "/dashboard/traceability", icon: "Activity" },
    ],
  },
  {
    id: "integrations",
    label: "Integrations",
    icon: "Plug",
    landingUrl: "/dashboard/workflow",
    modules: [
      { key: "workflow", label: "Workflow", url: "/dashboard/workflow", icon: "GitBranch", pluginCode: "PL0031WORKFLOW" },
      { key: "external", label: "External APIs", url: "/dashboard/external", icon: "Webhook", pluginCode: "PL0030EXTERNAL" },
      { key: "sync", label: "Sync", url: "/dashboard/settings/sync", icon: "RefreshCw" },
      { key: "integrations-traceability", label: "Traceability", url: "/dashboard/traceability?workspace=integrations", icon: "Activity" },
    ],
  },
  {
    id: "lookups",
    label: "Lookups",
    icon: "Database",
    landingUrl: "/dashboard/lookups",
    modules: [
      { key: "lookups", label: "Lookups", url: "/dashboard/lookups", icon: "Database", pluginCode: "PL0037LOOKUPS" },
      { key: "lookups-traceability", label: "Traceability", url: "/dashboard/traceability?workspace=lookups", icon: "Activity" },
    ],
  },
  {
    id: "service-desk",
    label: "Service Desk",
    icon: "HelpCircle",
    landingUrl: "/dashboard/support/tickets/dashboard",
    modules: [
      { key: "support-dashboard", label: "Dashboard", url: "/dashboard/support/tickets/dashboard", icon: "LayoutDashboard" },
      { key: "support-tickets", label: "My tickets", url: "/dashboard/support/tickets", icon: "Ticket" },
      { key: "support-new-ticket", label: "New ticket", url: "/dashboard/support/tickets/new", icon: "Plus" },
    ],
  },
  {
    id: "settings",
    label: "Administration",
    labelI18nKey: "workspace.workspaces.administration",
    icon: "Shield",
    landingUrl: "/dashboard/settings/users",
    modules: [
      { key: "users", label: "Users", labelI18nKey: "workspace.modules.users", url: "/dashboard/settings/users", icon: "Users", pluginCode: "PL0043USERS" },
      { key: "roles", label: "Roles", labelI18nKey: "workspace.modules.roles", url: "/dashboard/settings/roles", icon: "Shield" },
      { key: "user-groups", label: "User groups", labelI18nKey: "workspace.modules.userGroups", url: "/dashboard/settings/user-groups", icon: "UsersRound" },
      { key: "dynamic-forms", label: "Dynamic forms", labelI18nKey: "workspace.modules.dynamicForms", url: "/dashboard/settings/dynamic-forms", icon: "FormInput", pluginCode: "PL0032DYNAMICFORMS" },
      { key: "background-services", label: "Background services", labelI18nKey: "workspace.modules.backgroundServices", url: "/dashboard/settings/sync", icon: "Activity" },
      { key: "documentation", label: "Documentation", labelI18nKey: "workspace.modules.documentation", url: "/dashboard/settings/documentation", icon: "BookOpen" },
      { key: "system-logs", label: "System logs", labelI18nKey: "workspace.modules.systemLogs", url: "/dashboard/settings/logs", icon: "ScrollText" },
      { key: "system-config", label: "System configuration", labelI18nKey: "workspace.modules.systemConfig", url: "/dashboard/settings/system-config", icon: "Monitor" },
      { key: "processes", label: "Processes", url: "/dashboard/settings/processes", icon: "Zap" },
      { key: "admin-traceability", label: "Traceability", url: "/dashboard/traceability?workspace=administration", icon: "Activity" },
      {
        key: "settings",
        label: "Settings",
        labelI18nKey: "workspace.modules.settings",
        url: "/dashboard/settings",
        icon: "Settings",
      },
    ],
  },
];

const MODULE_URL_ALIASES: Record<string, string[]> = {
  "/dashboard/field/dispatcher": ["/dashboard/field/dispatches"],
};

export function getWorkspaceModuleMatchBases(url: string): string[] {
  const [base] = url.split("?");
  const bases = new Set<string>([base]);

  if (base.endsWith("/list")) {
    bases.add(base.slice(0, -"/list".length));
  }

  MODULE_URL_ALIASES[base]?.forEach((alias) => bases.add(alias));
  return Array.from(bases);
}

export function workspaceModuleMatchesPath(url: string, pathname: string): boolean {
  return getWorkspaceModuleMatchBases(url).some(
    (base) => pathname === base || pathname.startsWith(base + "/")
  );
}

export function findWorkspaceForPath(pathname: string): Workspace | undefined {
  // Best-match by longest module url prefix.
  let best: { ws: Workspace; len: number } | undefined;
  for (const ws of WORKSPACES) {
    for (const m of ws.modules) {
      for (const base of getWorkspaceModuleMatchBases(m.url)) {
        if (pathname === base || pathname.startsWith(base + "/")) {
          if (!best || base.length > best.len) best = { ws, len: base.length };
        }
      }
    }
  }
  return best?.ws;
}

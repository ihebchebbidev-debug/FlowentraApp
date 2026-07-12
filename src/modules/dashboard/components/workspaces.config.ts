/**
 * Workspace-based navigation config.
 * Level 1 = workspaces (use cases). Level 2 = modules relevant to that use case.
 * Icons are lucide-react component names.
 */

export interface WorkspaceModule {
  key: string;
  label: string;
  url: string;
  icon: string;
  /** Optional plugin gate. When present and the plugin is disabled, the module is hidden. */
  pluginCode?: string;
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
  pluginCode?: string;
  active?: boolean;
  onSelect?: () => void;
}

export interface Workspace {
  id: string;
  label: string;
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
      { key: "reporting", label: "Reporting", url: "/dashboard/reporting", icon: "BarChart3" },
    ],
  },
  {
    id: "sales",
    label: "Sales",
    icon: "TrendingUp",
    landingUrl: "/dashboard/reporting/sales",
    modules: [
      { key: "sales-dash", label: "Sales dashboard", url: "/dashboard/reporting/sales", icon: "BarChart3" },
      { key: "sales", label: "Sales", url: "/dashboard/sales", icon: "TrendingUp", pluginCode: "PL0002SALES" },
      { key: "offers", label: "Offers", url: "/dashboard/offers", icon: "FileText", pluginCode: "PL0005OFFERS" },
      { key: "deals", label: "Deals", url: "/dashboard/deals", icon: "Handshake", pluginCode: "PL0003DEALS" },
      { key: "contacts", label: "Customers", url: "/dashboard/contacts?type=customer", icon: "Users", pluginCode: "PL0001CONTACTS" },
      { key: "articles", label: "Articles", url: "/dashboard/inventory-services", icon: "Package", pluginCode: "PL0007ARTICLES" },
      { key: "installations", label: "Installations", url: "/dashboard/field/installations/list", icon: "Wrench", pluginCode: "PL0018INSTALLATIONS" },
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
    ],
  },
  {
    id: "field",
    label: "Field Ops",
    icon: "HardHat",
    landingUrl: "/dashboard/field/service-orders/list",
    modules: [
      { key: "service-orders", label: "Service orders", url: "/dashboard/field/service-orders/list", icon: "ClipboardList", pluginCode: "PL0016SERVICEORDERS" },
      { key: "dispatches", label: "Dispatches", url: "/dashboard/field/dispatcher", icon: "Send", pluginCode: "PL0017DISPATCHES" },
      { key: "planning", label: "Planning board", url: "/dashboard/field/dispatcher/interface", icon: "CalendarDays", pluginCode: "PL0023SCHEDULING" },
      { key: "time-expenses", label: "Time & expenses", url: "/dashboard/field/time-expenses", icon: "Clock", pluginCode: "PL0021TIMEEXPENSES" },
    ],
  },
  {
    id: "projects",
    label: "Projects",
    icon: "FolderKanban",
    landingUrl: "/dashboard/tasks/projects",
    modules: [
      { key: "projects", label: "Projects", url: "/dashboard/tasks/projects", icon: "FolderKanban", pluginCode: "PL0004PROJECTS" },
      { key: "tasks", label: "Tasks", url: "/dashboard/tasks", icon: "CheckSquare", pluginCode: "PL0011TASKS" },
      { key: "calendar", label: "Calendar", url: "/dashboard/calendar", icon: "Calendar", pluginCode: "PL0010CALENDAR" },
      { key: "documents", label: "Documents", url: "/dashboard/documents", icon: "Folder", pluginCode: "PL0012DOCUMENTS" },
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
      { key: "dynamic-forms", label: "Dynamic forms", url: "/dashboard/settings/dynamic-forms", icon: "FormInput", pluginCode: "PL0032DYNAMICFORMS" },
      { key: "sync", label: "Sync", url: "/dashboard/settings/sync", icon: "RefreshCw" },
    ],
  },
  {
    id: "lookups",
    label: "Lookups",
    icon: "Database",
    landingUrl: "/dashboard/lookups",
    modules: [
      { key: "lookups", label: "Lookups", url: "/dashboard/lookups", icon: "Database", pluginCode: "PL0037LOOKUPS" },
    ],
  },
  {
    id: "settings",
    label: "Settings",
    icon: "Settings",
    landingUrl: "/dashboard/settings",
    modules: [
      { key: "settings", label: "General", url: "/dashboard/settings", icon: "Settings" },
      { key: "users", label: "Users & roles", url: "/dashboard/settings?tab=users", icon: "User", pluginCode: "PL0043USERS" },
      { key: "plugins", label: "Plugins", url: "/dashboard/settings?tab=plugins", icon: "Blocks" },
    ],
  },
];

export function findWorkspaceForPath(pathname: string): Workspace | undefined {
  // Best-match by longest module url prefix.
  let best: { ws: Workspace; len: number } | undefined;
  for (const ws of WORKSPACES) {
    for (const m of ws.modules) {
      const base = m.url.split("?")[0];
      if (pathname === base || pathname.startsWith(base + "/")) {
        if (!best || base.length > best.len) best = { ws, len: base.length };
      }
    }
  }
  return best?.ws;
}

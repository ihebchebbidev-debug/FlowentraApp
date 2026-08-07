// Description of every sidebar group/item in the real app, derived from
// src/modules/dashboard/data/sidebar-defaults.json (the tenant sidebar config)
// and the module route reports in /tmp/docs-analysis.

export type NavGroupDoc = {
  group: string;
  items: {
    label: string;
    route: string;
    moduleKey?: string;
    description: string;
  }[];
};

export const NAVIGATION_MAP: NavGroupDoc[] = [
  {
    group: "workspace",
    items: [
      {
        label: "Dashboard",
        route: "/dashboard",
        moduleKey: "dashboard",
        description: "Home overview: KPIs, sales/leads/tasks/events cards aggregated from other modules.",
      },
      {
        label: "Articles",
        route: "/dashboard/inventory-services",
        moduleKey: "articles",
        description: "Product/service catalog management.",
      },
      {
        label: "Emails",
        route: "/dashboard/email-calendar/emails",
        moduleKey: "email-calendar",
        description: "Email inbox and management (inactive by default).",
      },
      {
        label: "Calendar",
        route: "/dashboard/calendar",
        moduleKey: "calendar",
        description: "Shared calendar for events and scheduling.",
      },
      {
        label: "Documents",
        route: "/dashboard/documents",
        moduleKey: "documents",
        description: "Document storage and management.",
      },
      {
        label: "HR",
        route: "/dashboard/hr",
        moduleKey: "hr",
        description: "Human resources hub covering employees, leaves, payroll, and compliance.",
      },
      {
        label: "HR — Employees",
        route: "/dashboard/hr/employees",
        moduleKey: "hr",
        description: "Manage the employee directory.",
      },
      {
        label: "HR — Absences",
        route: "/dashboard/hr/leaves",
        moduleKey: "hr",
        description: "Track and approve employee leave requests.",
      },
      {
        label: "HR — Payroll",
        route: "/dashboard/hr/payroll",
        moduleKey: "hr",
        description: "Run and review payroll.",
      },
      {
        label: "HR — Bonuses & costs",
        route: "/dashboard/hr/bonuses",
        moduleKey: "hr",
        description: "Manage bonuses and associated employee costs.",
      },
      {
        label: "HR — CNSS & compliance",
        route: "/dashboard/hr/cnss",
        moduleKey: "hr",
        description: "Social security (CNSS) declarations and compliance tracking.",
      },
      {
        label: "HR — Goals & reviews",
        route: "/dashboard/hr/performance",
        moduleKey: "hr",
        description: "Employee performance goals and review cycles.",
      },
      {
        label: "HR — Job openings & applicants",
        route: "/dashboard/hr/recruitment",
        moduleKey: "hr",
        description: "Recruitment pipeline: postings and applicants.",
      },
      {
        label: "HR — Reports",
        route: "/dashboard/hr/reports",
        moduleKey: "hr",
        description: "HR reporting and analytics.",
      },
      {
        label: "HR — Settings",
        route: "/dashboard/hr/settings",
        moduleKey: "hr",
        description: "Configure HR module settings.",
      },
      {
        label: "Reporting",
        route: "/dashboard/reporting",
        moduleKey: "reporting",
        description: "Prebuilt executive dashboards; defaults to the personal 'My' dashboard.",
      },
      {
        label: "Reporting — Sales",
        route: "/dashboard/reporting/sales",
        moduleKey: "reporting",
        description: "Sales KPIs dashboard (requires sales:read).",
      },
      {
        label: "Reporting — Service",
        route: "/dashboard/reporting/service",
        moduleKey: "reporting",
        description: "Service operations dashboard (requires service_orders:read).",
      },
      {
        label: "Reporting — Finance",
        route: "/dashboard/reporting/finance",
        moduleKey: "reporting",
        description: "Finance dashboard (requires reporting_finance:read).",
      },
      {
        label: "Reporting — HR",
        route: "/dashboard/reporting/hr",
        moduleKey: "reporting",
        description: "HR dashboard (requires reporting_hr:read).",
      },
      {
        label: "Reporting — Purchase",
        route: "/dashboard/reporting/purchase",
        moduleKey: "reporting",
        description: "Purchasing dashboard (requires purchases:read).",
      },
    ],
  },
  {
    group: "crm",
    items: [
      {
        label: "Contacts",
        route: "/dashboard/contacts",
        moduleKey: "contacts",
        description: "Customer and company database.",
      },
      {
        label: "Contacts — All contacts",
        route: "/dashboard/contacts",
        moduleKey: "contacts",
        description: "Full contacts list, unfiltered.",
      },
      {
        label: "Contacts — Company",
        route: "/dashboard/contacts?type=company",
        moduleKey: "contacts",
        description: "Contacts filtered to companies only.",
      },
      {
        label: "Contacts — Person",
        route: "/dashboard/contacts?type=individual",
        moduleKey: "contacts",
        description: "Contacts filtered to individuals only.",
      },
      {
        label: "Suppliers",
        route: "/dashboard/suppliers",
        moduleKey: "contacts",
        description: "Supplier directory.",
      },
      {
        label: "Purchases",
        route: "/dashboard/purchases",
        moduleKey: "purchases",
        description: "Purchase management hub covering orders, receipts, invoices, and compliance.",
      },
      {
        label: "Purchases — Purchase orders",
        route: "/dashboard/purchases?tab=orders",
        moduleKey: "purchases",
        description: "Create and track purchase orders.",
      },
      {
        label: "Purchases — Goods receipts",
        route: "/dashboard/purchases?tab=receipts",
        moduleKey: "purchases",
        description: "Record receipt of ordered goods.",
      },
      {
        label: "Purchases — Supplier invoices",
        route: "/dashboard/purchases?tab=invoices",
        moduleKey: "purchases",
        description: "Manage supplier invoices.",
      },
      {
        label: "Purchases — Compliance",
        route: "/dashboard/purchases?tab=insights",
        moduleKey: "purchases",
        description: "Fiscal compliance insights for purchasing.",
      },
      {
        label: "Sales & offers",
        route: "/dashboard/offers",
        moduleKey: "sales",
        description: "Quotes/offers, sales pipeline, and customer invoices hub.",
      },
      {
        label: "Sales — Offers",
        route: "/dashboard/offers",
        moduleKey: "sales",
        description: "Client offers/quotes management.",
      },
      {
        label: "Sales — Orders",
        route: "/dashboard/sales",
        moduleKey: "sales",
        description: "Sales pipeline / confirmed orders.",
      },
      {
        label: "Sales — Invoices",
        route: "/dashboard/invoices",
        moduleKey: "sales",
        description: "Customer invoices.",
      },
      {
        label: "Deals",
        route: "/dashboard/deals",
        moduleKey: "deals",
        description: "Sales pipeline / deal-stage tracking board.",
      },
      {
        label: "Todo",
        route: "/dashboard/tasks/projects",
        moduleKey: "tasks",
        description: "Task and project management.",
      },
    ],
  },
  {
    group: "service",
    items: [
      {
        label: "Services",
        route: "/dashboard/field/service-orders/list",
        moduleKey: "field-service",
        description: "Field service management hub: service orders, dispatch, installations.",
      },
      {
        label: "Services — Service orders",
        route: "/dashboard/field/service-orders/list",
        moduleKey: "field-service",
        description: "List and manage service order tickets.",
      },
      {
        label: "Services — Dispatches",
        route: "/dashboard/field/dispatcher",
        moduleKey: "field-service",
        description: "Dispatch management for field technicians.",
      },
      {
        label: "Services — Installations",
        route: "/dashboard/field/installations/list",
        moduleKey: "field-service",
        description: "Track installation jobs.",
      },
      {
        label: "Time & expenses",
        route: "/dashboard/field/time-expenses",
        moduleKey: "field-service",
        description: "Log and review field time and expense entries.",
      },
      {
        label: "Planner",
        route: "/dashboard/field/dispatcher/interface",
        moduleKey: "field-service",
        description: "Visual planning/scheduling interface for dispatch.",
      },
    ],
  },
  {
    group: "system",
    items: [
      {
        label: "Website builder",
        route: "/dashboard/website-builder",
        moduleKey: "website-builder",
        description: "Drag-and-drop website/landing-page builder with publishing and export.",
      },
      {
        label: "Workflow",
        route: "/dashboard/workflow",
        moduleKey: "workflow",
        description: "Visual workflow automation builder: entity triggers, conditionals, and execution monitoring.",
      },
      {
        label: "Dynamic forms",
        route: "/dashboard/settings/dynamic-forms",
        moduleKey: "dynamic-forms",
        description: "No-code form builder with conditional logic, e-signatures, and public sharing.",
      },
      {
        label: "Lookups",
        route: "/dashboard/lookups",
        moduleKey: "lookups",
        description: "Configure shared app lookup/reference lists.",
      },
      {
        label: "Settings",
        route: "/dashboard/settings",
        moduleKey: "settings",
        description: "System preferences and tenant configuration.",
      },
      {
        label: "Sync history",
        route: "/dashboard/settings/sync",
        moduleKey: "settings",
        description: "Sync history and rejected-operations log (inactive by default).",
      },
      {
        label: "External",
        route: "/dashboard/external",
        moduleKey: "external",
        description: "Integration hub: webhook endpoints, connector catalog, and inbound request logs.",
      },
    ],
  },
];

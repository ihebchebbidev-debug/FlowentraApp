import {
  PermissionAction,
  PermissionModule,
  PERMISSION_MODULES,
} from '@/types/permissions';

/**
 * Predefined role templates.
 *
 * Each template maps a module to the list of actions that should be granted.
 * Modules that are absent get no permissions at all.
 *
 * These are starting points: after creating a role from a template the admin
 * can still fine-tune everything in the Role Permissions editor.
 */
export interface RoleTemplate {
  id: string;
  name: string;
  description: string;
  /** Short, human sentences describing what this role can do (shown in the picker). */
  highlights: string[];
  permissions: Partial<Record<PermissionModule, PermissionAction[]>>;
}

const CRUD: PermissionAction[] = ['create', 'read', 'update', 'delete'];
const CRU: PermissionAction[] = ['create', 'read', 'update'];
const RU: PermissionAction[] = ['read', 'update'];
const RC: PermissionAction[] = ['read', 'create'];
const R: PermissionAction[] = ['read'];

export const ROLE_TEMPLATES: RoleTemplate[] = [
  {
    id: 'technician',
    name: 'Technician',
    description: 'Field worker executing service orders and logging time & materials.',
    highlights: [
      'Sees and updates assigned service orders and dispatches',
      'Logs time entries and expenses',
      'Reads customers, articles and installations',
      'Can remove stock when consuming material',
    ],
    permissions: {
      contacts: R,
      articles: R,
      installations: R,
      service_orders: RU,
      dispatches: RU,
      dispatcher: R,
      time_tracking: CRU,
      expenses: RC,
      stock_management: ['read', 'remove_stock'],
      dynamic_forms: R,
      documents: R,
      ai_assistant: R,
    },
  },
  {
    id: 'planner',
    name: 'Planner / Dispatcher',
    description: 'Plans work, assigns technicians and keeps the schedule healthy.',
    highlights: [
      'Full access to the planner, dispatches and service orders',
      'Reads customers, articles, offers and purchases for context',
      'Manages installations and checklists / dynamic forms',
      'Read-only on users so technicians can be assigned',
    ],
    permissions: {
      contacts: R,
      articles: R,
      offers: R,
      sales: R,
      installations: CRU,
      service_orders: CRUD,
      dispatches: CRUD,
      dispatcher: CRUD,
      time_tracking: CRU,
      expenses: R,
      stock_management: R,
      purchases: R,
      dynamic_forms: CRU,
      documents: R,
      ai_assistant: R,
      users: R,
      settings: R,
    },
  },
  {
    id: 'salesperson',
    name: 'Salesperson',
    description: 'Owns the commercial pipeline: contacts, offers, deals and sales.',
    highlights: [
      'Full access to contacts, offers, deals and sales',
      'Reads articles, installations and service orders',
      'Access to sales analytics and reporting',
      'Can log own time and expenses',
    ],
    permissions: {
      contacts: CRUD,
      articles: R,
      offers: CRUD,
      sales: CRUD,
      deals: CRUD,
      installations: R,
      service_orders: R,
      time_tracking: RC,
      expenses: RC,
      dynamic_forms: R,
      documents: R,
      ai_assistant: R,
    },
  },
  {
    id: 'purchaser',
    name: 'Purchaser',
    description: 'Handles procurement: purchase orders, goods receipts and supplier invoices.',
    highlights: [
      'Full access to purchases and the article catalog',
      'Full stock management including add / remove and stock logs',
      'Reads suppliers and contacts',
      'Access to the purchase reporting dashboard',
    ],
    permissions: {
      contacts: R,
      articles: CRUD,
      purchases: CRUD,
      stock_management: ['read', 'add_stock', 'remove_stock', 'read_logs'],
      expenses: R,
      documents: R,
      ai_assistant: R,
    },
  },
  {
    id: 'hr_manager',
    name: 'HR Manager',
    description: 'Manages employees, attendance, leave, payroll and HR reporting.',
    highlights: [
      'Full access to the HR module and HR reporting',
      'Manages time tracking and expense approval data',
      'Reads users and contacts',
      'No access to sales, purchasing or system settings',
    ],
    permissions: {
      contacts: R,
      hr: CRUD,
      reporting_hr: R,
      time_tracking: CRUD,
      expenses: CRUD,
      users: R,
      dynamic_forms: R,
      documents: R,
      ai_assistant: R,
    },
  },
  {
    id: 'manager',
    name: 'Manager',
    description: 'Oversees operations across departments with broad read and edit rights.',
    highlights: [
      'Create and edit across CRM, field service and time & expenses',
      'Access to finance reporting and audit logs',
      'Reads HR, purchases, users, settings and background services',
      'Cannot manage roles or external API endpoints',
    ],
    permissions: {
      contacts: CRU,
      articles: R,
      offers: CRU,
      sales: CRU,
      deals: CRU,
      installations: CRU,
      service_orders: CRU,
      dispatches: R,
      dispatcher: R,
      time_tracking: CRU,
      expenses: CRU,
      stock_management: ['read', 'read_logs'],
      purchases: R,
      hr: R,
      reporting_finance: R,
      dynamic_forms: CRU,
      documents: R,
      ai_assistant: R,
      users: R,
      settings: R,
      audit_logs: R,
      processes: R,
    },
  },
  {
    id: 'admin',
    name: 'Administrator',
    description: 'Full system access including users, roles, settings and integrations.',
    highlights: [
      'Every module with every action available',
      'Manages users, roles and permissions',
      'Configures settings, integrations and background services',
      'Access to all reporting dashboards and audit logs',
    ],
    permissions: PERMISSION_MODULES.reduce((acc, mod) => {
      acc[mod.module] = [...mod.actions];
      return acc;
    }, {} as Partial<Record<PermissionModule, PermissionAction[]>>),
  },
];

/**
 * Permission dependencies.
 *
 * Some screens are gated by a *different* module than the one they belong to
 * (see SIDEBAR_PERMISSION_MAP in AppSidebar). Granting a permission without its
 * dependency produces a role that can technically act on data it can never see.
 *
 * Key   = "module:action" that was granted
 * Value = list of "module:action" that must also be granted
 */
export const PERMISSION_DEPENDENCIES: Record<string, string[]> = {
  // Planner / dispatch screens are gated by service_orders:read
  'dispatcher:read': ['service_orders:read'],
  'dispatcher:create': ['service_orders:read', 'dispatcher:read'],
  'dispatcher:update': ['service_orders:read', 'dispatcher:read'],
  'dispatcher:delete': ['service_orders:read', 'dispatcher:read'],
  'dispatches:read': ['service_orders:read'],
  'dispatches:create': ['service_orders:read', 'dispatches:read'],
  'dispatches:update': ['service_orders:read', 'dispatches:read'],
  'dispatches:delete': ['service_orders:read', 'dispatches:read'],

  // Service orders need customers, sites and the catalog to be usable
  'service_orders:create': ['contacts:read', 'installations:read', 'articles:read'],
  'service_orders:update': ['contacts:read', 'installations:read'],

  // Commercial documents need customers and the article catalog
  'offers:create': ['contacts:read', 'articles:read'],
  'offers:update': ['contacts:read', 'articles:read'],
  'sales:create': ['contacts:read', 'articles:read'],
  'sales:update': ['contacts:read', 'articles:read'],
  'deals:create': ['contacts:read'],
  'deals:update': ['contacts:read'],

  // Purchasing touches suppliers and the catalog
  'purchases:create': ['contacts:read', 'articles:read'],
  'purchases:update': ['contacts:read', 'articles:read'],

  // Stock movements are meaningless without the catalog
  'stock_management:add_stock': ['stock_management:read', 'articles:read'],
  'stock_management:remove_stock': ['stock_management:read', 'articles:read'],
  'stock_management:read_logs': ['stock_management:read'],

  // Installations belong to a customer
  'installations:create': ['contacts:read'],
  'installations:update': ['contacts:read'],

  // Reporting dashboards read the underlying operational module
  'reporting_finance:read': ['sales:read'],

  // Administration
  'roles:update': ['roles:read', 'users:read'],
  'roles:create': ['roles:read', 'users:read'],
  'roles:delete': ['roles:read'],
  'users:create': ['users:read'],
  'users:update': ['users:read'],
  'users:delete': ['users:read'],
  'settings:switch_company': ['settings:read'],
  'processes:manage': ['processes:read'],
  'audit_logs:delete': ['audit_logs:read'],

  // Any write implies being able to read the same module
  ...Object.fromEntries(
    PERMISSION_MODULES.flatMap(mod =>
      mod.actions
        .filter(a => a !== 'read' && mod.actions.includes('read'))
        .map(a => [`${mod.module}:${a}`, [`${mod.module}:read`]])
    )
  ),
};

/** Merge the generic and specific dependency lists for a single key. */
function dependenciesFor(key: string): string[] {
  const generic = PERMISSION_DEPENDENCIES[key] ?? [];
  return Array.from(new Set(generic));
}

/**
 * Given the currently granted "module:action" keys, return the keys that are
 * required by a dependency but are not granted yet.
 */
export function findMissingDependencies(grantedKeys: Iterable<string>): string[] {
  const granted = new Set(grantedKeys);
  const missing = new Set<string>();

  // Iterate until stable: a dependency can itself pull in another one.
  let changed = true;
  while (changed) {
    changed = false;
    for (const key of [...granted, ...missing]) {
      for (const dep of dependenciesFor(key)) {
        if (!granted.has(dep) && !missing.has(dep)) {
          missing.add(dep);
          changed = true;
        }
      }
    }
  }

  return Array.from(missing).sort();
}

/** Expand a template into the flat "module:action" key list. */
export function templateToKeys(template: RoleTemplate): string[] {
  const keys: string[] = [];
  Object.entries(template.permissions).forEach(([module, actions]) => {
    (actions ?? []).forEach(action => keys.push(`${module}:${action}`));
  });
  return Array.from(new Set([...keys, ...findMissingDependencies(keys)]));
}

/**
 * Build the full permission payload for the batch update endpoint.
 * Every module/action pair in the catalog is included, granted true/false.
 */
export function templateToPermissionPayload(
  template: RoleTemplate
): { module: PermissionModule; action: PermissionAction; granted: boolean }[] {
  const granted = new Set(templateToKeys(template));
  const payload: { module: PermissionModule; action: PermissionAction; granted: boolean }[] = [];

  PERMISSION_MODULES.forEach(mod => {
    mod.actions.forEach(action => {
      payload.push({
        module: mod.module,
        action,
        granted: granted.has(`${mod.module}:${action}`),
      });
    });
  });

  return payload;
}

/** Count how many modules a template touches (for the picker badge). */
export function countTemplateModules(template: RoleTemplate): number {
  return Object.keys(template.permissions).length;
}

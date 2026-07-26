// Permission types for Role-Based Access Control (RBAC)

// All available modules/resources in the system
export type PermissionModule =
  | 'contacts'
  | 'articles'
  | 'installations'
  | 'offers'
  | 'sales'
  | 'deals'
  | 'service_orders'
  | 'dispatches'
  | 'dispatcher'
  | 'time_tracking'
  | 'expenses'
  | 'stock_management'
  | 'users'
  | 'roles'
  | 'settings'
  | 'audit_logs'
  | 'documents'
  | 'dynamic_forms'
  | 'ai_assistant'
  | 'hr'
  | 'purchases'
  | 'external_endpoints'
  | 'reporting_finance'
  | 'reporting_hr'
  | 'processes';

// CRUD + special actions
export type PermissionAction = 
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'export'
  | 'import'
  | 'assign'
  | 'approve'
  | 'reject'
  | 'archive'
  | 'restore'
  | 'print'
  | 'send'
  | 'duplicate'
  | 'convert'
  | 'manage'
  | 'configure'
  | 'view_all'
  | 'view_own'
  | 'bulk_edit'
  | 'bulk_delete'
  | 'add_stock'
  | 'remove_stock'
  | 'read_logs'
  | 'switch_company';


// A single permission entry
export interface Permission {
  module: PermissionModule;
  action: PermissionAction;
  granted: boolean;
}

// Role permission configuration
export interface RolePermission {
  id?: number;
  roleId: number;
  module: PermissionModule;
  action: PermissionAction;
  granted: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Grouped permissions by module for UI display
export interface ModulePermissions {
  module: PermissionModule;
  label: string;
  description: string;
  icon?: string;
  actions: {
    action: PermissionAction;
    label: string;
    granted: boolean;
  }[];
}

// Request to update role permissions
export interface UpdateRolePermissionsRequest {
  roleId: number;
  permissions: {
    module: PermissionModule;
    action: PermissionAction;
    granted: boolean;
  }[];
}

// All permission modules with their available actions and labels
// SIMPLIFIED: All modules now use only create, read, update, delete
export const PERMISSION_MODULES: {
  module: PermissionModule;
  label: string;
  description: string;
  actions: PermissionAction[];
  category?: string;
}[] = [
  // === CRM & Sales ===
  {
    module: 'contacts',
    label: 'Contacts',
    description: 'Manage customer and contact information',
    actions: ['create', 'read', 'update', 'delete'],
    category: 'CRM'
  },
  {
    module: 'articles',
    label: 'Articles',
    description: 'Manage products, services and catalog items',
    actions: ['create', 'read', 'update', 'delete'],
    category: 'CRM'
  },
  {
    module: 'offers',
    label: 'Offers',
    description: 'Create and manage quotes and proposals',
    actions: ['create', 'read', 'update', 'delete'],
    category: 'CRM'
  },
  {
    module: 'sales',
    label: 'Sales',
    description: 'Manage sales pipeline and deals',
    actions: ['create', 'read', 'update', 'delete'],
    category: 'CRM'
  },
  {
    module: 'deals',
    label: 'Deals',
    description: 'Manage sales opportunities and deal pipeline',
    actions: ['create', 'read', 'update', 'delete'],
    category: 'CRM'
  },

  // === Field Service ===
  {
    module: 'installations',
    label: 'Installations',
    description: 'Manage installation sites and customer locations',
    actions: ['create', 'read', 'update', 'delete'],
    category: 'Field Service'
  },
  {
    module: 'service_orders',
    label: 'Service Orders',
    description: 'Manage service orders and work orders',
    actions: ['create', 'read', 'update', 'delete'],
    category: 'Field Service'
  },
  {
    module: 'dispatches',
    label: 'Dispatches',
    description: 'View and manage dispatched jobs',
    actions: ['create', 'read', 'update', 'delete'],
    category: 'Field Service'
  },
  {
    module: 'dispatcher',
    label: 'Planner',
    description: 'Access the dispatcher planning and scheduling interface',
    actions: ['create', 'read', 'update', 'delete'],
    category: 'Field Service'
  },

  // === Time & Expenses ===
  {
    module: 'time_tracking',
    label: 'Time Tracking',
    description: 'Manage time entries and timesheets',
    actions: ['create', 'read', 'update', 'delete'],
    category: 'Time & Expenses'
  },
  {
    module: 'expenses',
    label: 'Expenses',
    description: 'Manage expense reports and reimbursements',
    actions: ['create', 'read', 'update', 'delete'],
    category: 'Time & Expenses'
  },

  // === Inventory ===
  {
    module: 'stock_management',
    label: 'Stock Management',
    description: 'View and manage material stock levels',
    actions: ['read', 'add_stock', 'remove_stock', 'read_logs'],
    category: 'Inventory'
  },

  // === Administration ===
  {
    module: 'users',
    label: 'User Management',
    description: 'Manage user accounts, profiles and access',
    actions: ['create', 'read', 'update', 'delete'],
    category: 'Administration'
  },
  {
    module: 'roles',
    label: 'Roles & Permissions',
    description: 'Manage roles and permission assignments',
    actions: ['create', 'read', 'update', 'delete'],
    category: 'Administration'
  },
  {
    module: 'settings',
    label: 'Settings & Preferences',
    description: 'Access and modify system settings and configuration',
    actions: ['create', 'read', 'update', 'delete', 'switch_company'],
    category: 'Administration'
  },

  {
    module: 'audit_logs',
    label: 'Logs',
    description: 'View system audit logs and activity history',
    actions: ['read', 'delete'],
    category: 'Administration'
  },
  {
    module: 'processes',
    label: 'Background Services',
    description: 'View background services; only MainAdmin and roles with manage can run, pause, stop, or reconfigure them',
    actions: ['read', 'manage'],
    category: 'Administration'
  },
  {
    module: 'documents',
    label: 'Documentation',
    description: 'Access API documentation and application guides',
    actions: ['read'],
    category: 'Administration'
  },
  {
    module: 'dynamic_forms',
    label: 'Dynamic Forms',
    description: 'Create and manage custom forms and checklists',
    actions: ['create', 'read', 'update', 'delete'],
    category: 'Administration'
  },
  {
    module: 'ai_assistant',
    label: 'AI Assistant',
    description: 'Access the AI chat assistant for help and automation',
    actions: ['read'],
    category: 'Administration'
  },
  {
    module: 'hr',
    label: 'Human Resources',
    description: 'Manage employees, attendance, leaves and payroll',
    actions: ['create', 'read', 'update', 'delete'],
    category: 'Administration'
  },
  {
    module: 'purchases',
    label: 'Purchases',
    description: 'Manage purchase orders, goods receipts, and supplier invoices',
    actions: ['create', 'read', 'update', 'delete'],
    category: 'CRM'
  },
  {
    module: 'external_endpoints',
    label: 'External APIs',
    description: 'Create and manage custom API endpoints to receive external data',
    actions: ['create', 'read', 'update', 'delete'],
    category: 'Administration'
  },

  // === Reporting (sensitive dashboards) ===
  {
    module: 'reporting_finance',
    label: 'Finance Reporting',
    description: 'Access the Finance reporting dashboard (revenue, invoices, expenses)',
    actions: ['read'],
    category: 'Reporting'
  },
  {
    module: 'reporting_hr',
    label: 'HR Reporting',
    description: 'Access the HR reporting dashboard (employees, salaries, performance)',
    actions: ['read'],
    category: 'Reporting'
  },
];

// Human-readable labels for actions
export const ACTION_LABELS: Record<PermissionAction, string> = {
  create: 'Create',
  read: 'View',
  update: 'Edit',
  delete: 'Delete',
  export: 'Export',
  import: 'Import',
  assign: 'Assign',
  approve: 'Approve',
  reject: 'Reject',
  archive: 'Archive',
  restore: 'Restore',
  print: 'Print',
  send: 'Send',
  duplicate: 'Duplicate',
  convert: 'Convert',
  manage: 'Manage',
  configure: 'Configure',
  view_all: 'View All',
  view_own: 'View Own',
  bulk_edit: 'Bulk Edit',
  bulk_delete: 'Bulk Delete',
  add_stock: 'Add Stock',
  remove_stock: 'Remove Stock',
  read_logs: 'View Logs',
  switch_company: 'Switch Company'
};


// Get modules grouped by category
export function getModulesByCategory(): Record<string, typeof PERMISSION_MODULES> {
  return PERMISSION_MODULES.reduce((acc, module) => {
    const category = module.category || 'Other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(module);
    return acc;
  }, {} as Record<string, typeof PERMISSION_MODULES>);
}

// Helper to check if user has permission (from RolePermission array)
export function hasPermission(
  userPermissions: RolePermission[],
  module: PermissionModule,
  action: PermissionAction
): boolean {
  const permission = userPermissions.find(
    p => p.module === module && p.action === action
  );
  return permission?.granted ?? false;
}

// Helper to check if user has permission (from string array format "module:action")
export function hasPermissionFromStrings(
  permissionStrings: string[],
  module: PermissionModule,
  action: PermissionAction
): boolean {
  return permissionStrings.includes(`${module}:${action}`);
}

// Convert string array to RolePermission array for compatibility
export function stringsToRolePermissions(
  permissionStrings: string[],
  roleId: number = 0
): RolePermission[] {
  return permissionStrings.map((perm, idx) => {
    const [module, action] = perm.split(':') as [PermissionModule, PermissionAction];
    return {
      id: idx,
      roleId,
      module,
      action,
      granted: true,
    };
  });
}

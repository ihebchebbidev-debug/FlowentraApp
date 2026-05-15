// Context Awareness Service - Injects current page context into AI prompts
// Makes the AI assistant aware of what the user is currently viewing and relevant APIs

export interface PageContext {
  route: string;
  pageName: string;
  pageDescription: string;
  relevantData?: string;
  suggestions?: string[];
  relatedApis?: string[];
  entityType?: string;
  entityId?: string;
}

// Comprehensive route to context mapping with API documentation
// Note: suggestions use translation keys that must be translated in the UI
const routeContextMap: Record<string, Omit<PageContext, 'route' | 'relevantData' | 'entityId'>> = {
  // ==================== DASHBOARD ====================
  '/dashboard': {
    pageName: 'Dashboard',
    pageDescription: 'Main dashboard showing KPIs, revenue charts, recent activity, task overview, and business metrics. This is your command center for monitoring business health.',
    suggestions: [
      'contextSuggestions.dashboard.revenueTrends',
      'contextSuggestions.dashboard.overdueTasks',
      'contextSuggestions.dashboard.openOffers',
      'contextSuggestions.dashboard.businessSummary',
      'contextSuggestions.dashboard.topTechnicians'
    ],
    relatedApis: [
      'GET /api/dashboard/summary - Business KPIs and metrics',
      'GET /api/offers?status=draft - Active offers',
      'GET /api/sales - Sales overview',
      'GET /api/dispatches - Today\'s field work'
    ]
  },

  // ==================== CONTACTS ====================
  '/dashboard/contacts': {
    pageName: 'Contacts',
    pageDescription: 'Customer and contact management (CRM). View, create, edit customers, leads, companies. Contacts are the foundation of all business operations - they link to offers, sales, installations, and service history.',
    suggestions: [
      'contextSuggestions.contacts.howToCreate',
      'contextSuggestions.contacts.contactTypes',
      'contextSuggestions.contacts.addTags',
      'contextSuggestions.contacts.importContacts',
      'contextSuggestions.contacts.requiredFields'
    ],
    relatedApis: [
      'GET /api/contacts - List all contacts with pagination',
      'GET /api/contacts/{id} - Get contact details',
      'POST /api/contacts - Create new contact',
      'PUT /api/contacts/{id} - Update contact',
      'GET /api/contacts/{id}/notes - Contact notes',
      'GET /api/contacts/{id}/offers - Related offers',
      'GET /api/contacts/{id}/sales - Related sales',
      'GET /api/contacts/{id}/installations - Related installations'
    ],
    entityType: 'contact'
  },

  // ==================== OFFERS ====================
  '/dashboard/offers': {
    pageName: 'Offers (Quotes)',
    pageDescription: 'Quotes and proposals management. Create offers with line items (articles/services), apply discounts (percentage or fixed), set validity dates, and send to customers. When accepted, offers convert to Sale Orders. Lifecycle: Created → Sent → Negotiation → Accepted/Rejected/Expired.',
    suggestions: [
      'contextSuggestions.offers.howToCreate',
      'contextSuggestions.offers.customerAccepts',
      'contextSuggestions.offers.applyDiscounts',
      'contextSuggestions.offers.lifecycleStages',
      'contextSuggestions.offers.downloadPdf'
    ],
    relatedApis: [
      'GET /api/offers - List offers with filters (status, contactId, search)',
      'GET /api/offers/{id} - Get offer with items',
      'POST /api/offers - Create offer',
      'PUT /api/offers/{id} - Update offer details',
      'POST /api/offers/{id}/items - Add line item',
      'PUT /api/offers/{id}/items/{itemId} - Update line item',
      'DELETE /api/offers/{id}/items/{itemId} - Remove line item',
      'POST /api/offers/{id}/convert-to-sale - Convert accepted offer to sale',
      'POST /api/offers/{id}/renew - Create renewed copy of expired offer',
      'GET /api/offers/{id}/pdf - Download PDF'
    ],
    entityType: 'offer'
  },

  // ==================== SALES ====================
  '/dashboard/sales': {
    pageName: 'Sales Orders',
    pageDescription: 'Confirmed orders from accepted offers or manually created sales. Track order status, fulfillment progress. Sales containing services automatically create Service Orders for field work. Lifecycle: Created → Confirmed → In Progress → Completed/Cancelled.',
    suggestions: [
      'contextSuggestions.sales.createdFromOffers',
      'contextSuggestions.sales.statuses',
      'contextSuggestions.sales.generatePdf',
      'contextSuggestions.sales.createServiceOrder',
      'contextSuggestions.sales.trackPayment'
    ],
    relatedApis: [
      'GET /api/sales - List sales with filters',
      'GET /api/sales/{id} - Get sale with items',
      'POST /api/sales - Create sale',
      'PUT /api/sales/{id} - Update sale',
      'POST /api/sales/{id}/items - Add item',
      'POST /api/sales/{id}/service-order - Generate service order from sale',
      'GET /api/sales/{id}/activities - Sale activity log',
      'GET /api/sales/{id}/pdf - Download PDF'
    ],
    entityType: 'sale'
  },

  // ==================== SERVICE ORDERS ====================
  '/field/service-orders': {
    pageName: 'Service Orders',
    pageDescription: 'Work orders for field operations. Contains jobs (individual tasks), materials needed, customer info, and location details. Created automatically from sales with services, or manually for standalone work. Jobs become Dispatches when scheduled to technicians. Lifecycle: Created → Ready for Planning → Scheduled → In Progress → Completed → Invoiced → Closed.',
    suggestions: [
      'contextSuggestions.serviceOrders.howCreated',
      'contextSuggestions.serviceOrders.statusMeaning',
      'contextSuggestions.serviceOrders.addJobs',
      'contextSuggestions.serviceOrders.lifecycle',
      'contextSuggestions.serviceOrders.howToClose'
    ],
    relatedApis: [
      'GET /api/service-orders - List service orders',
      'GET /api/service-orders/{id} - Get with jobs',
      'GET /api/service-orders/{id}/full-summary - Complete summary with dispatches, time, expenses, materials',
      'PUT /api/service-orders/{id}/status - Update status',
      'POST /api/service-orders/{id}/jobs - Add job',
      'GET /api/service-orders/{id}/dispatches - Related dispatches',
      'GET /api/service-orders/{id}/time-entries - Time logged',
      'GET /api/service-orders/{id}/expenses - Expenses',
      'GET /api/service-orders/{id}/materials - Materials used',
      'POST /api/service-orders/{id}/approve - Approve for work',
      'POST /api/service-orders/{id}/complete - Mark completed'
    ],
    entityType: 'serviceOrder'
  },

  // ==================== DISPATCHER ====================
  '/field/dispatcher': {
    pageName: 'Dispatcher (Planning Board)',
    pageDescription: 'Visual scheduling board for assigning jobs to technicians. Drag jobs from the sidebar to technician timelines. View by day, week, or month. See availability, conflicts, and optimize routes. Jobs scheduled here become Dispatches with assigned technicians and time slots.',
    suggestions: [
      'contextSuggestions.dispatcher.scheduleJob',
      'contextSuggestions.dispatcher.techAvailability',
      'contextSuggestions.dispatcher.reschedule',
      'contextSuggestions.dispatcher.conflicts',
      'contextSuggestions.dispatcher.workingToday'
    ],
    relatedApis: [
      'GET /api/dispatches - All dispatches',
      'GET /api/dispatches?date={date} - Dispatches for specific date',
      'GET /api/dispatches?assignedUserId={id} - Technician\'s dispatches',
      'POST /api/dispatches - Create dispatch (schedule job)',
      'PUT /api/dispatches/{id} - Update dispatch (reschedule)',
      'GET /api/users?role=technician - Available technicians',
      'GET /api/service-orders?status=ready_for_planning - Unscheduled jobs'
    ],
    entityType: 'dispatcher'
  },

  // ==================== DISPATCHES ====================
  '/field/dispatches': {
    pageName: 'Dispatches',
    pageDescription: 'Scheduled job assignments. Each dispatch tracks: assigned technician, date/time, location, job from service order. Technicians log time entries, expenses, materials used, notes, and collect customer signatures. Status: Pending → In Progress → Completed.',
    suggestions: [
      'contextSuggestions.dispatches.statuses',
      'contextSuggestions.dispatches.logTime',
      'contextSuggestions.dispatches.trackProgress',
      'contextSuggestions.dispatches.todaysDispatches',
      'contextSuggestions.dispatches.lifecycle'
    ],
    relatedApis: [
      'GET /api/dispatches - List dispatches',
      'GET /api/dispatches/{id} - Dispatch details',
      'GET /api/dispatches/{id}/time-entries - Time logged on dispatch',
      'GET /api/dispatches/{id}/expenses - Expenses on dispatch',
      'GET /api/dispatches/{id}/materials - Materials used',
      'POST /api/dispatches/{id}/start - Start work',
      'POST /api/dispatches/{id}/complete - Complete work',
      'POST /api/dispatches/{id}/signature - Capture customer signature'
    ],
    entityType: 'dispatch'
  },

  // ==================== INSTALLATIONS ====================
  '/field/installations': {
    pageName: 'Installations',
    pageDescription: 'Equipment, machines, and locations where service is performed. Track warranties, maintenance schedules, service history, and documentation. Each installation links to a customer contact. Used to schedule preventive maintenance and track asset lifecycle.',
    suggestions: [
      'contextSuggestions.installations.howToCreate',
      'contextSuggestions.installations.trackWarranties',
      'contextSuggestions.installations.preventiveMaintenance',
      'contextSuggestions.installations.expiringWarranties',
      'contextSuggestions.installations.serviceHistory'
    ],
    relatedApis: [
      'GET /api/installations - List installations',
      'GET /api/installations/{id} - Installation details',
      'POST /api/installations - Create installation',
      'PUT /api/installations/{id} - Update installation',
      'GET /api/installations/{id}/maintenance-history - Maintenance records',
      'POST /api/installations/{id}/maintenance-history - Add maintenance record',
      'GET /api/installations?contactId={id} - Installations for contact',
      'GET /api/installations?hasWarranty=true - Warranty tracking'
    ],
    entityType: 'installation'
  },

  // ==================== TIME & EXPENSES ====================
  '/field/time-expenses': {
    pageName: 'Time & Expenses',
    pageDescription: 'Time booking and expense tracking for field work. Technicians log work hours by type (regular, overtime, travel, break). Record expenses with receipts (fuel, materials, accommodation). Managers approve submitted entries for payroll and billing.',
    suggestions: [
      'contextSuggestions.timeExpenses.logHours',
      'contextSuggestions.timeExpenses.expenseTypes',
      'contextSuggestions.timeExpenses.approval',
      'contextSuggestions.timeExpenses.attachReceipts',
      'contextSuggestions.timeExpenses.travelTime'
    ],
    relatedApis: [
      'GET /api/time-entries - List time entries',
      'POST /api/time-entries - Create time entry',
      'PUT /api/time-entries/{id} - Update time entry',
      'DELETE /api/time-entries/{id} - Delete time entry',
      'GET /api/expenses - List expenses',
      'POST /api/expenses - Create expense',
      'PUT /api/expenses/{id}/approve - Approve expense',
      'GET /api/time-entries?userId={id}&from={date}&to={date} - Time for period',
      'GET /api/expenses?status=pending - Pending approvals'
    ],
    entityType: 'timeExpense'
  },

  // ==================== INVENTORY & SERVICES ====================
  '/dashboard/inventory-services': {
    pageName: 'Inventory & Services',
    pageDescription: 'Articles management including products (materials) and services. Manage stock levels, pricing, categories, and units of measure. Materials are tracked in inventory with stock alerts; services are sold but don\'t consume stock.',
    suggestions: [
      'contextSuggestions.articles.articleTypes',
      'contextSuggestions.articles.trackInventory',
      'contextSuggestions.articles.setupService',
      'contextSuggestions.articles.createProduct',
      'contextSuggestions.articles.lowStock'
    ],
    relatedApis: [
      'GET /api/articles - List articles (products & services)',
      'GET /api/articles/{id} - Article details',
      'POST /api/articles - Create article',
      'PUT /api/articles/{id} - Update article',
      'GET /api/articles?type=article - Products only',
      'GET /api/articles?type=service - Services only',
      'PUT /api/articles/{id}/stock - Update stock level',
      'GET /api/article-categories - Categories'
    ],
    entityType: 'article'
  },

  // ==================== CALENDAR ====================
  '/dashboard/calendar': {
    pageName: 'Calendar',
    pageDescription: 'Calendar view showing events, dispatches, deadlines, scheduled work, and team appointments. Color-coded by event type for quick visual reference. Sync with external calendars.',
    suggestions: [
      'contextSuggestions.calendar.createEvent',
      'contextSuggestions.calendar.syncExternal',
      'contextSuggestions.calendar.colorMeaning',
      'contextSuggestions.calendar.techSchedules',
      'contextSuggestions.calendar.reschedule'
    ],
    relatedApis: [
      'GET /api/calendar/events - Calendar events',
      'POST /api/calendar/events - Create event',
      'GET /api/dispatches?from={date}&to={date} - Dispatches in range',
      'GET /api/tasks?dueFrom={date}&dueTo={date} - Tasks in range'
    ],
    entityType: 'calendar'
  },

  // ==================== TASKS ====================
  '/dashboard/tasks': {
    pageName: 'Tasks & Projects',
    pageDescription: 'Project-based task management with Kanban boards, list views, time tracking, checklists, recurring tasks, and team collaboration. Organize work with custom columns, priorities, and assignments.',
    suggestions: [
      'contextSuggestions.tasks.planDay',
      'contextSuggestions.tasks.createTasks',
      'contextSuggestions.tasks.pendingTasks',
      'contextSuggestions.tasks.overdueTasks',
      'contextSuggestions.tasks.trackTime',
      'contextSuggestions.tasks.recurringTasks',
      'contextSuggestions.tasks.addChecklists'
    ],
    relatedApis: [
      'GET /api/tasks - List tasks',
      'GET /api/tasks/{id} - Task details with checklists and time entries',
      'POST /api/tasks - Create task',
      'PUT /api/tasks/{id} - Update task',
      'PUT /api/tasks/{id}/status - Update status',
      'GET /api/tasks?assignedTo={userId} - Tasks assigned to user',
      'GET /api/tasks?status=pending - Pending tasks',
      'GET /api/tasks?overdue=true - Overdue tasks',
      'POST /api/tasks/{id}/time-entries - Add time entry',
      'POST /api/tasks/{id}/checklists - Add checklist',
      'POST /api/tasks/{id}/recurring - Set recurring schedule'
    ],
    entityType: 'task'
  },
  '/dashboard/tasks/daily': {
    pageName: 'Daily Tasks',
    pageDescription: 'Personal daily to-do list with date navigation, completed tasks tracking, time tracking, checklists, and recurring task support. Filter by date, view completed items, and manage priorities. Features include live timers, subtask checklists, and automated recurring task generation.',
    suggestions: [
      'contextSuggestions.dailyTasks.planDay',
      'contextSuggestions.dailyTasks.createToday',
      'contextSuggestions.dailyTasks.prioritize',
      'contextSuggestions.dailyTasks.markComplete',
      'contextSuggestions.dailyTasks.urgentTasks',
      'contextSuggestions.dailyTasks.startTimer',
      'contextSuggestions.dailyTasks.addChecklist',
      'contextSuggestions.dailyTasks.repeatWeekly',
      'contextSuggestions.dailyTasks.tomorrow'
    ],
    relatedApis: [
      'GET /api/daily-tasks - Daily tasks with filters',
      'GET /api/daily-tasks?date={date} - Tasks for specific date',
      'POST /api/daily-tasks - Create daily task',
      'PUT /api/daily-tasks/{id}/status - Update status',
      'POST /api/daily-tasks/{id}/complete - Mark complete',
      'POST /api/daily-tasks/{id}/time-entries - Start/stop timer or add entry',
      'GET /api/daily-tasks/{id}/time-entries - Get time entries',
      'POST /api/daily-tasks/{id}/checklists - Add checklist',
      'PUT /api/daily-tasks/{id}/checklists/{checklistId} - Update checklist',
      'POST /api/daily-tasks/{id}/recurring - Configure recurring schedule',
      'DELETE /api/daily-tasks/completed - Clear completed tasks'
    ],
    entityType: 'task'
  },

  // ==================== PROJECTS ====================
  '/dashboard/projects': {
    pageName: 'Projects',
    pageDescription: 'Project management for tracking larger initiatives with tasks, milestones, and team assignments. Group related work and track progress toward completion.',
    suggestions: [
      'contextSuggestions.projects.createProject',
      'contextSuggestions.projects.statuses',
      'contextSuggestions.projects.trackProgress',
      'contextSuggestions.projects.addTasks',
      'contextSuggestions.projects.activeProjects'
    ],
    relatedApis: [
      'GET /api/projects - List projects',
      'GET /api/projects/{id} - Project details',
      'POST /api/projects - Create project',
      'GET /api/projects/{id}/tasks - Project tasks',
      'POST /api/projects/{id}/tasks - Add task to project'
    ],
    entityType: 'project'
  },

  // ==================== SETTINGS ====================
  '/dashboard/settings': {
    pageName: 'Settings',
    pageDescription: 'Application settings including company info, preferences (theme, language, date format), users & roles, integrations, PDF templates, lookup tables, and notification settings.',
    suggestions: [
      'contextSuggestions.settings.changeTheme',
      'contextSuggestions.settings.taxRates',
      'contextSuggestions.settings.manageUsers',
      'contextSuggestions.settings.pdfTemplates',
      'contextSuggestions.settings.lookupTables'
    ],
    relatedApis: [
      'GET /api/settings - Application settings',
      'PUT /api/settings - Update settings',
      'GET /api/users - User management',
      'GET /api/roles - Role management',
      'GET /api/lookups - Lookup tables'
    ],
    entityType: 'settings'
  },

  // ==================== SETTINGS - USERS ====================
  '/dashboard/settings/users': {
    pageName: 'User Management',
    pageDescription: 'Manage system users, their roles, permissions, and access levels. Create new users, assign roles (Admin, Manager, Technician, etc.), and manage account status.',
    suggestions: [
      'contextSuggestions.users.createUser',
      'contextSuggestions.users.roles',
      'contextSuggestions.users.resetPassword',
      'contextSuggestions.users.deactivate',
      'contextSuggestions.users.permissions'
    ],
    relatedApis: [
      'GET /api/users - List all users',
      'GET /api/users/{id} - User details',
      'POST /api/users - Create user',
      'PUT /api/users/{id} - Update user',
      'PUT /api/users/{id}/role - Change role',
      'GET /api/roles - Available roles',
      'GET /api/permissions - Available permissions'
    ],
    entityType: 'user'
  },

  // ==================== SETTINGS - PLANNER ====================
  '/dashboard/settings/planner': {
    pageName: 'Planner Settings',
    pageDescription: 'Configure the dispatcher/planning board settings. Set working hours, time slots, view preferences, technician groups, and scheduling rules.',
    suggestions: [
      'contextSuggestions.planner.workingHours',
      'contextSuggestions.planner.timeSlots',
      'contextSuggestions.planner.groupTechnicians',
      'contextSuggestions.planner.schedulingRules',
      'contextSuggestions.planner.defaultDuration'
    ],
    relatedApis: [
      'GET /api/settings/planner - Planner settings',
      'PUT /api/settings/planner - Update planner settings',
      'GET /api/settings/working-hours - Working hours config',
      'GET /api/users?role=technician - Technicians for scheduling'
    ],
    entityType: 'plannerSettings'
  },

  // ==================== SETTINGS - LOOKUPS ====================
  '/dashboard/settings/lookups': {
    pageName: 'Lookup Tables',
    pageDescription: 'Manage dropdown values and categorizations used throughout the system. Configure contact types, service types, priorities, statuses, expense categories, work types, and more.',
    suggestions: [
      'contextSuggestions.lookups.existing',
      'contextSuggestions.lookups.addContactType',
      'contextSuggestions.lookups.addExpenseCategory',
      'contextSuggestions.lookups.rename',
      'contextSuggestions.lookups.deactivate'
    ],
    relatedApis: [
      'GET /api/lookups - All lookup types',
      'GET /api/lookups/{type} - Values for lookup type',
      'POST /api/lookups/{type} - Add lookup value',
      'PUT /api/lookups/{type}/{id} - Update value',
      'DELETE /api/lookups/{type}/{id} - Remove value'
    ],
    entityType: 'lookup'
  },

  // ==================== NOTIFICATIONS ====================
  '/dashboard/notifications': {
    pageName: 'Notifications',
    pageDescription: 'View all system notifications including alerts, reminders, task updates, and team activity. Configure notification preferences for email and in-app alerts.',
    suggestions: [
      'contextSuggestions.notifications.configure',
      'contextSuggestions.notifications.triggers',
      'contextSuggestions.notifications.markAllRead',
      'contextSuggestions.notifications.emailNotifications'
    ],
    relatedApis: [
      'GET /api/notifications - List notifications',
      'PUT /api/notifications/{id}/read - Mark as read',
      'PUT /api/notifications/read-all - Mark all as read',
      'GET /api/notification-settings - Notification preferences'
    ],
    entityType: 'notification'
  },

  // ==================== REPORTS ====================
  '/dashboard/reports': {
    pageName: 'Reports',
    pageDescription: 'Business reports and analytics. Generate reports for sales, service performance, technician productivity, revenue trends, and custom metrics. Export to PDF or Excel.',
    suggestions: [
      'contextSuggestions.reports.available',
      'contextSuggestions.reports.export',
      'contextSuggestions.reports.revenue',
      'contextSuggestions.reports.custom'
    ],
    relatedApis: [
      'GET /api/reports - Available reports',
      'GET /api/reports/sales - Sales report',
      'GET /api/reports/service-orders - Service performance',
      'GET /api/reports/technicians - Technician productivity',
      'GET /api/reports/export/{type} - Export report'
    ],
    entityType: 'report'
  },

  // ==================== MAP ====================
  '/field/map': {
    pageName: 'Map View',
    pageDescription: 'Geographic view of installations, dispatches, and technician locations. Visualize field operations on a map for route planning and resource optimization.',
    suggestions: [
      'contextSuggestions.map.techLocations',
      'contextSuggestions.map.planRoutes',
      'contextSuggestions.map.filterMarkers',
      'contextSuggestions.map.zoomArea'
    ],
    relatedApis: [
      'GET /api/installations?hasLocation=true - Installations with coordinates',
      'GET /api/dispatches?date=today - Today\'s dispatches',
      'GET /api/users?role=technician - Technician locations'
    ],
    entityType: 'map'
  }
};

// Extract entity ID from route for detail pages
const extractEntityId = (route: string): string | undefined => {
  // Patterns like /dashboard/contacts/123 or /field/service-orders/456
  const patterns = [
    /\/dashboard\/contacts\/(\d+)/,
    /\/dashboard\/offers\/(\d+)/,
    /\/dashboard\/sales\/(\d+)/,
    /\/field\/service-orders\/(\d+)/,
    /\/field\/dispatches\/(\d+)/,
    /\/field\/installations\/(\d+)/,
    /\/dashboard\/projects\/(\d+)/,
    /\/dashboard\/tasks\/(\d+)/,
    /\/dashboard\/inventory-services\/(\d+)/,
    /\/dashboard\/settings\/users\/(\d+)/
  ];

  for (const pattern of patterns) {
    const match = route.match(pattern);
    if (match) {
      return match[1];
    }
  }
  return undefined;
};

// Get context for current route
export const getPageContext = (route: string): PageContext => {
  // Normalize route - remove trailing slash and query params
  const normalizedRoute = route.split('?')[0].replace(/\/$/, '') || '/dashboard';

  // Extract entity ID if viewing a detail page
  const entityId = extractEntityId(normalizedRoute);

  // Try exact match first
  if (routeContextMap[normalizedRoute]) {
    return {
      route: normalizedRoute,
      ...routeContextMap[normalizedRoute],
      entityId
    };
  }

  // Try partial match for detail pages (e.g., /dashboard/contacts/123)
  for (const [baseRoute, context] of Object.entries(routeContextMap)) {
    if (normalizedRoute.startsWith(baseRoute + '/') || normalizedRoute === baseRoute) {
      const isDetailPage = entityId !== undefined;
      return {
        route: normalizedRoute,
        ...context,
        pageDescription: isDetailPage
          ? `${context.pageDescription} (Viewing ${context.entityType || 'item'} #${entityId})`
          : context.pageDescription,
        entityId
      };
    }
  }

  // Default fallback
  return {
    route: normalizedRoute,
    pageName: 'FlowService',
    pageDescription: 'Field Service Management and CRM application.',
    suggestions: [
      'How do I create an offer?',
      'Show me the dashboard',
      'How does the dispatcher work?'
    ]
  };
};

// Build context-aware prompt enhancement
export const buildContextPrompt = (route: string, userData?: Record<string, unknown>): string => {
  const context = getPageContext(route);

  let contextPrompt = `
## CURRENT PAGE CONTEXT
The user is currently viewing: **${context.pageName}** (${context.route})
Page description: ${context.pageDescription}
`;

  // Add entity ID if viewing a specific item
  if (context.entityId) {
    contextPrompt += `
**Currently viewing ${context.entityType || 'item'} ID: ${context.entityId}**
You can reference this specific item when answering questions.
`;
  }

  // Add related APIs for technical context
  if (context.relatedApis && context.relatedApis.length > 0) {
    contextPrompt += `
## RELATED API ENDPOINTS (for technical questions)
${context.relatedApis.map(api => `- ${api}`).join('\n')}
`;
  }

  contextPrompt += `
When answering, prioritize information relevant to this page. If the user asks something general, you can suggest actions available on their current page.
`;

  // Add user data context if available
  if (userData) {
    const userInfo: string[] = [];

    if (userData.userName) {
      userInfo.push(`User name: ${userData.userName}`);
    }
    if (userData.userRole) {
      userInfo.push(`Role: ${userData.userRole}`);
    }
    if (userData.isMainAdmin !== undefined) {
      userInfo.push(`Account type: ${userData.isMainAdmin ? 'Administrator' : 'Staff member'}`);
    }

    if (userInfo.length > 0) {
      contextPrompt += `
## USER CONTEXT
${userInfo.join('\n')}
`;
    }
  }

  return contextPrompt;
};

// Get smart suggestions based on current route
export const getContextualSuggestions = (route: string): string[] => {
  const context = getPageContext(route);
  return context.suggestions || [];
};

// Get entity type from route for data fetching
export const getEntityTypeFromRoute = (route: string): { type: string; id?: string } | null => {
  const context = getPageContext(route);
  if (context.entityType) {
    return {
      type: context.entityType,
      id: context.entityId
    };
  }
  return null;
};

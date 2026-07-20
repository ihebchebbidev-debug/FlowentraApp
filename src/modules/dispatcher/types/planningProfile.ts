// Planning Profile types — see .lovable/plan.md
export type PlanningBoardMode = 'service_orders' | 'installations';
export type PlanningDefaultView = 'day' | 'week';
export type PlanningColorBy = 'status' | 'priority' | 'service_order' | 'technician';

/**
 * Fields that can be composed into a planning card's label or shown on hover.
 * Lets each profile decide what a block/card displays (e.g. just the SO number,
 * or "SO number · contact name", and exactly what the hover tooltip lists).
 */
export type PlanningCardField =
  | 'serviceOrderNumber'
  | 'serviceOrderTitle'
  | 'description'
  | 'contactName'
  | 'customerCompany'
  | 'customerPhone'
  | 'installationName'
  | 'jobTitle'
  | 'status'
  | 'priority'
  | 'duration'
  | 'address'
  | 'technician'
  | 'jobCount';

export interface PlanningProfileSettings {
  // Display
  mode: PlanningBoardMode;
  defaultView: PlanningDefaultView;
  includeWeekends: boolean;
  displayClosedDispatches: boolean;
  displayRejectedDispatches: boolean;
  displayCancelledDispatches: boolean;
  loadClosedServiceOrders: boolean;
  loadPlannedServiceOrders: boolean;
  colorBy: PlanningColorBy;
  showDurationLabels: boolean;
  compactRows: boolean;
  // Card display — what a block/card shows and what the hover tooltip lists.
  cardPrimaryFields: PlanningCardField[];  // composed into the main label, in order
  cardSeparator: string;                   // joins the primary fields, e.g. " · "
  hoverFields: PlanningCardField[];        // shown in the hover tooltip
  showJobsOnHover: boolean;                 // in service-order mode, list the SO's jobs on hover
  expandServiceOrderJobs: boolean;          // allow expanding a SO card to its jobs in the list (default off)
  // Visible users filters
  hideUsersWithoutWorkingHours: boolean;
  hideUsersOnLeaveToday: boolean;
  // Skills filter
  skillFilterMode: 'any' | 'all';  // 'any' = at least one match, 'all' = every required skill
  sortBySkillMatch: boolean;        // technicians with more matching skills appear first
  // Auto-fill behavior
  // When true (default) the auto-planner creates ONE dispatch per service order
  // holding all its jobs; when false it creates one dispatch per job.
  autoFillSingleDispatchPerOrder: boolean;
  // Permissions / behavior
  allowSchedulingJobs: boolean;
  allowSchedulingInPast: boolean;
  allowChangingDispatches: boolean;
  allowUnassigningDispatches: boolean;
  confirmOnOverlap: boolean;
  autoCollapseCompleted: boolean;
  // Drop snap in minutes for drag-drop scheduling (5/10/15/30/60).
  dropSnapMinutes: number;
}

export const DEFAULT_PLANNING_SETTINGS: PlanningProfileSettings = {
  mode: 'service_orders',
  defaultView: 'week',
  includeWeekends: false,
  displayClosedDispatches: false,
  displayRejectedDispatches: false,
  displayCancelledDispatches: false,
  loadClosedServiceOrders: false,
  loadPlannedServiceOrders: true,
  colorBy: 'status',
  showDurationLabels: true,
  compactRows: false,
  cardPrimaryFields: ['serviceOrderNumber'],
  cardSeparator: ' - ',
  hoverFields: ['contactName', 'installationName', 'status', 'duration'],
  showJobsOnHover: true,
  expandServiceOrderJobs: false,
  hideUsersWithoutWorkingHours: false,
  hideUsersOnLeaveToday: false,
  skillFilterMode: 'any',
  sortBySkillMatch: false,
  autoFillSingleDispatchPerOrder: true,
  allowSchedulingJobs: true,
  allowSchedulingInPast: false,
  allowChangingDispatches: true,
  allowUnassigningDispatches: true,
  confirmOnOverlap: true,
  autoCollapseCompleted: false,
  dropSnapMinutes: 15,
};

export interface PlanningProfile {
  id: string;
  tenantId?: number;
  ownerUserId: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  isShared: boolean;
  visibleUserIds: string[];
  requiredSkillIds?: string[];
  settings: PlanningProfileSettings;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePlanningProfileDto {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  isShared?: boolean;
  visibleUserIds: string[];
  requiredSkillIds?: string[];
  settings: PlanningProfileSettings;
}

export type UpdatePlanningProfileDto = Partial<CreatePlanningProfileDto>;

// Planning Profile types — see .lovable/plan.md
export type PlanningBoardMode = 'service_orders' | 'installations';
export type PlanningDefaultView = 'day' | 'week';
export type PlanningColorBy = 'status' | 'priority' | 'service_order' | 'technician';

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
  // Visible users filters
  hideUsersWithoutWorkingHours: boolean;
  hideUsersOnLeaveToday: boolean;
  // Permissions / behavior
  allowSchedulingJobs: boolean;
  allowSchedulingInPast: boolean;
  allowChangingDispatches: boolean;
  allowUnassigningDispatches: boolean;
  confirmOnOverlap: boolean;
  autoCollapseCompleted: boolean;
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
  hideUsersWithoutWorkingHours: false,
  hideUsersOnLeaveToday: false,
  allowSchedulingJobs: true,
  allowSchedulingInPast: false,
  allowChangingDispatches: true,
  allowUnassigningDispatches: true,
  confirmOnOverlap: true,
  autoCollapseCompleted: false,
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

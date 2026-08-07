// Task Time Tracking Types

export interface TaskTimeEntry {
  id: string;
  projectTaskId?: string;
  projectTaskTitle?: string;
  dailyTaskId?: string;
  dailyTaskTitle?: string;
  userId: string;
  userName?: string;
  startTime: Date;
  endTime?: Date;
  duration: number; // in minutes
  description?: string;
  isBillable: boolean;
  hourlyRate?: number;
  totalCost?: number;
  workType: WorkType;
  approvalStatus: ApprovalStatus;
  approvedById?: string;
  approvedByName?: string;
  approvedDate?: Date;
  approvalNotes?: string;
  createdDate: Date;
  createdBy: string;
  modifiedDate?: Date;
  modifiedBy?: string;
}

export type WorkType = 'work' | 'break' | 'meeting' | 'review' | 'travel' | 'other';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface CreateTaskTimeEntryDto {
  projectTaskId?: number;
  dailyTaskId?: number;
  userId?: number;
  startTime: string;
  endTime?: string;
  duration?: number;
  description?: string;
  isBillable?: boolean;
  hourlyRate?: number;
  workType?: WorkType;
}

export interface UpdateTaskTimeEntryDto {
  startTime?: string;
  endTime?: string;
  duration?: number;
  description?: string;
  isBillable?: boolean;
  hourlyRate?: number;
  workType?: WorkType;
}

export interface TaskTimeTrackingSummary {
  taskId: string;
  taskType: 'project' | 'daily';
  taskTitle: string;
  totalLoggedMinutes: number;
  totalLoggedHours: number;
  estimatedHours?: number;
  remainingEstimate?: number;
  totalBillableMinutes?: number;
  totalCost?: number;
  entryCount: number;
  entries: TaskTimeEntry[];
}

export interface TaskTimeEntryQuery {
  projectTaskId?: number;
  dailyTaskId?: number;
  userId?: number;
  projectId?: number;
  fromDate?: string;
  toDate?: string;
  isBillable?: boolean;
  approvalStatus?: ApprovalStatus;
  workType?: WorkType;
  pageNumber?: number;
  pageSize?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

// Helper function to format duration
export function formatDuration(minutes: number): string {
  if (minutes === 0) return '-';
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

// Helper function to calculate duration between two dates
export function calculateDuration(startTime: Date, endTime: Date): number {
  return Math.round((endTime.getTime() - startTime.getTime()) / 60000);
}

// Work type labels for display
export const workTypeLabels: Record<WorkType, { en: string; fr: string }> = {
  work: { en: 'Work', fr: 'Travail' },
  break: { en: 'Break', fr: 'Pause' },
  meeting: { en: 'Meeting', fr: 'Réunion' },
  review: { en: 'Review', fr: 'Révision' },
  travel: { en: 'Travel', fr: 'Déplacement' },
  other: { en: 'Other', fr: 'Autre' },
};

// Approval status labels for display
export const approvalStatusLabels: Record<ApprovalStatus, { en: string; fr: string }> = {
  pending: { en: 'Pending', fr: 'En attente' },
  approved: { en: 'Approved', fr: 'Approuvé' },
  rejected: { en: 'Rejected', fr: 'Rejeté' },
};

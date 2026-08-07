// Task Checklist Types

export interface TaskChecklistItem {
  id: number;
  checklistId: number;
  title: string;
  isCompleted: boolean;
  completedAt?: string;
  completedById?: number;
  completedByName?: string;
  sortOrder: number;
  createdDate: string;
  createdBy: string;
  modifiedDate?: string;
  modifiedBy?: string;
}

export interface TaskChecklist {
  id: number;
  projectTaskId?: number;
  dailyTaskId?: number;
  title: string;
  description?: string;
  isExpanded: boolean;
  sortOrder: number;
  createdDate: string;
  createdBy: string;
  modifiedDate?: string;
  modifiedBy?: string;
  items: TaskChecklistItem[];
  // Computed
  completedCount: number;
  totalCount: number;
  progressPercent: number;
}

// Create DTOs
export interface CreateTaskChecklistDto {
  projectTaskId?: number;
  dailyTaskId?: number;
  title: string;
  description?: string;
}

export interface UpdateTaskChecklistDto {
  title?: string;
  description?: string;
  isExpanded?: boolean;
  sortOrder?: number;
}

export interface CreateChecklistItemDto {
  checklistId: number;
  title: string;
  sortOrder?: number;
}

export interface UpdateChecklistItemDto {
  title?: string;
  isCompleted?: boolean;
  sortOrder?: number;
}

export interface ReorderChecklistItemsDto {
  checklistId: number;
  itemIds: number[];
}

export interface BulkCreateChecklistItemsDto {
  checklistId: number;
  titles: string[];
}

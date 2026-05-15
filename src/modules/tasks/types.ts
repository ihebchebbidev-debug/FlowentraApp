// Enhanced Database Tables/Entities for Tasks Module
// Frontend types (compatible with backend APIs)

// Main Task interface (aligned with backend ProjectTask)
export interface Task {
  id: string;
  title: string;
  description?: string;
  taskType?: string;
  status: string;
  relatedEntityType?: string;
  relatedEntityId?: number | string;
  dueDate?: Date | string;
  assignee?: string;
  assigneeName?: string;
  assigneeId?: string | number;
  createdAt: Date | string;
  createdBy?: string;
  updatedAt?: Date | string;
  modifiedBy?: string;
  projectId?: string;
  projectName?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent' | string;
  columnId?: string;
  columnTitle?: string;
  columnColor?: string;
  completedAt?: Date | string;
  tags?: string[];
  estimatedHours?: number;
  actualHours?: number;
  position?: number;
  lastMoved?: Date;
  startDate?: Date | string;
  contactId?: string;
  contactName?: string;
  parentTaskId?: string;
  parentTaskTitle?: string;
  attachments?: any[];
  subTasks?: Task[];
  commentsCount?: number;
  attachmentsCount?: number;
  [key: string]: any;
}

// Daily Task interface (aligned with backend DailyTask)
export interface DailyTask {
  id: string;
  title: string;
  description?: string;
  taskType?: string;
  status: string;
  relatedEntityType?: string;
  relatedEntityId?: number | string;
  dueDate?: Date | string;
  assignee?: string;
  assigneeId?: string | number;
  createdAt: Date | string;
  createdBy?: string;
  updatedAt?: Date | string;
  modifiedBy?: string;
  isCompleted?: boolean;
  priority?: 'low' | 'medium' | 'high' | 'urgent' | string;
  completedDate?: Date | string;
  completedAt?: Date | string;
  actualHours?: number;
  userId?: string;
  userName?: string;
  position?: number;
  tags?: string[];
  attachments?: any[];
  commentsCount?: number;
  attachmentsCount?: number;
  [key: string]: any;
}

// Task Comment interface (aligned with backend TaskComment)
export interface TaskComment {
  id: string;
  projectTaskId?: string;
  dailyTaskId?: string;
  taskTitle: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: Date;
  updatedAt: Date;
  isEdited: boolean;
}

// Task Attachment interface (aligned with backend TaskAttachment)
export interface TaskAttachment {
  id: string;
  projectTaskId?: string;
  dailyTaskId?: string;
  taskTitle: string;
  fileName: string;
  originalFileName: string;
  fileUrl: string;
  mimeType?: string;
  fileSize: number;
  uploadedBy: string;
  uploadedByName: string;
  uploadedAt: Date;
  caption?: string;
}

// Project interface (aligned with backend Project)
export interface Project {
  id: string;
  name: string;
  description?: string;
  contactId?: string;
  contactName?: string;
  ownerId: string;
  ownerName: string;
  teamMembers: string[]; // Array of user IDs as JSON
  budget?: number;
  currency?: string;
  status: 'active' | 'completed' | 'on-hold' | 'cancelled';
  type: 'service' | 'sales' | 'internal' | 'custom';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  progress?: number; // 0-100
  startDate?: Date;
  endDate?: Date;
  actualStartDate?: Date;
  actualEndDate?: Date;
  tags?: string[];
  isArchived?: boolean;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  createdBy?: string;
  modifiedBy?: string;
  columns: Column[]; // Custom columns for this project
  stats?: ProjectStats;
  parentProjectId?: string; // For sub-projects compatibility
  settings?: {
    autoLinkConvertedEntities?: boolean;
    requireProjectBeforeConvertingOffer?: boolean;
    defaultTaskStatus?: string;
    allowCrossProjectDispatch?: boolean;
    showFinancialDataInProjectTabs?: boolean;
    defaultLinkedEntityType?: string;
  };
}

// Project Column interface (aligned with backend ProjectColumn)
export interface Column {
  id: string;
  title: string;
  color: string;
  position: number;
  projectId?: string; // null for global columns
  isDefault: boolean;
  taskLimit?: number;
  createdAt: Date;
  taskCount?: number;
}

export interface Technician {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  avatar?: string;
}

export interface ProjectStats {
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  activeMembers: number;
  completionPercentage: number;
}

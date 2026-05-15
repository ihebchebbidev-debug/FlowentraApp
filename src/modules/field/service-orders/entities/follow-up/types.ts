export interface FollowUpReminder {
  id: string;
  serviceOrderId: string;
  type: 'maintenance' | 'warranty' | 'inspection' | 'quality_check' | 'customer_satisfaction' | 'payment_follow_up';
  title: string;
  description: string;
  dueDate: Date;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'completed' | 'cancelled' | 'overdue';
  
  // Assignment
  assignedTo?: string;
  assignedBy: string;
  assignedAt: Date;
  
  // Completion
  completedBy?: string;
  completedAt?: Date;
  completionNotes?: string;
  
  // Recurrence
  recurring: boolean;
  recurrencePattern?: RecurrencePattern;
  nextDueDate?: Date;
  
  // Notifications
  notificationSettings: NotificationSettings;
  lastNotifiedAt?: Date;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface RecurrencePattern {
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  interval: number; // every X days/weeks/months/etc
  endDate?: Date;
  maxOccurrences?: number;
  weekDays?: number[]; // for weekly: 0=Sunday, 1=Monday, etc
  monthDay?: number; // for monthly: day of month
}

export interface NotificationSettings {
  enabled: boolean;
  methods: ('email' | 'sms' | 'push' | 'in_app')[];
  reminderTimes: number[]; // days before due date to send reminders
  escalationEnabled: boolean;
  escalationAfterDays?: number;
  escalationUsers?: string[];
}

export interface FollowUpTemplate {
  id: string;
  name: string;
  type: FollowUpReminder['type'];
  title: string;
  description: string;
  defaultDaysAfterCompletion: number;
  priority: FollowUpReminder['priority'];
  recurring: boolean;
  defaultRecurrencePattern?: RecurrencePattern;
  checklist?: FollowUpChecklistItem[];
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface FollowUpChecklistItem {
  id: string;
  description: string;
  required: boolean;
  order: number;
}

export interface WarrantyInfo {
  id: string;
  serviceOrderId: string;
  warrantyType: 'parts' | 'labor' | 'full_service';
  warrantyPeriod: number; // months
  startDate: Date;
  endDate: Date;
  terms: string;
  coverage: string[];
  limitations?: string[];
  providedBy: string;
  contactInfo?: {
    name: string;
    phone: string;
    email: string;
  };
  status: 'active' | 'expired' | 'claimed' | 'voided';
  createdAt: Date;
}

export interface MaintenanceSchedule {
  id: string;
  serviceOrderId: string;
  equipmentId?: string;
  maintenanceType: 'preventive' | 'predictive' | 'corrective';
  frequency: RecurrencePattern;
  nextDueDate: Date;
  estimatedDuration: number; // minutes
  requiredSkills: string[];
  checklist: MaintenanceChecklistItem[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MaintenanceChecklistItem {
  id: string;
  description: string;
  type: 'visual_inspection' | 'measurement' | 'test' | 'replacement' | 'cleaning' | 'calibration';
  required: boolean;
  order: number;
  acceptableCriteria?: string;
  tools?: string[];
  materials?: string[];
}
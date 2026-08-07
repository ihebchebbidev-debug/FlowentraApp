// Recurring Task Types

export type RecurrenceType = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';

export interface RecurringTask {
  id: number;
  projectTaskId?: number;
  dailyTaskId?: number;
  recurrenceType: RecurrenceType;
  daysOfWeek?: string; // comma-separated: "0,1,2" for Sun,Mon,Tue
  dayOfMonth?: number;
  monthOfYear?: number;
  interval: number;
  startDate: string;
  endDate?: string;
  maxOccurrences?: number;
  occurrenceCount: number;
  nextOccurrence?: string;
  lastGeneratedDate?: string;
  isActive: boolean;
  isPaused: boolean;
  createdDate: string;
  createdBy: string;
  recurrenceDescription: string;
  sourceTaskTitle?: string;
}

export interface RecurringTaskLog {
  id: number;
  recurringTaskId: number;
  generatedProjectTaskId?: number;
  generatedDailyTaskId?: number;
  generatedDate: string;
  scheduledFor: string;
  status: 'created' | 'skipped' | 'failed';
  notes?: string;
}

// DTOs
export interface CreateRecurringTaskDto {
  projectTaskId?: number;
  dailyTaskId?: number;
  recurrenceType: RecurrenceType;
  daysOfWeek?: string;
  dayOfMonth?: number;
  monthOfYear?: number;
  interval?: number;
  startDate: string;
  endDate?: string;
  maxOccurrences?: number;
}

export interface UpdateRecurringTaskDto {
  recurrenceType?: RecurrenceType;
  daysOfWeek?: string;
  dayOfMonth?: number;
  monthOfYear?: number;
  interval?: number;
  startDate?: string;
  endDate?: string;
  maxOccurrences?: number;
  isActive?: boolean;
  isPaused?: boolean;
}

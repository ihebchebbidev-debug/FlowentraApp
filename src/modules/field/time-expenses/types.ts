export interface TimeExpenseEntry {
  id: string;
  userId: string;
  userName: string;
  serviceOrderId?: string;
  dispatchId?: string;
  date: Date;
  timeBooked: number; // minutes
  expenses: number; // total cost
  hourlyRate: number;
  description: string;
  type: 'time' | 'expense' | 'both';
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  hourlyRate: number;
  avatar?: string;
}

export interface TimeExpenseSummary {
  userId: string;
  userName: string;
  totalTimeBooked: number; // minutes
  totalExpenses: number;
  totalEarnings: number;
  entriesCount: number;
}

export interface DateRange {
  from: Date;
  to: Date;
}

export interface TimeExpenseFilters {
  dateRange: DateRange;
  users: string[];
  types: ('time' | 'expense' | 'both')[];
  status: ('pending' | 'approved' | 'rejected')[];
}

export interface CalendarViewType {
  type: 'day' | 'week' | 'month';
  date: Date;
}

export interface DayViewData {
  date: Date;
  entries: TimeExpenseEntry[];
  totalTime: number;
  totalExpenses: number;
}

export interface MonthViewData {
  month: number;
  year: number;
  days: DayViewData[];
  totalTime: number;
  totalExpenses: number;
}
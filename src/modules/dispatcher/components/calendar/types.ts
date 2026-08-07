export type ViewType = 'day' | 'week' | 'month';
export type ZoomLevel = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';

export interface CalendarSettings {
  includeWeekends: boolean;
}

export interface ZoomDimensions {
  dateWidth: number;
  hourWidth: number;
  widthMode: string;
  showHourLabels: boolean;
  hourTextSize: string;
}

// Technician availability data for calendar display
export interface TechnicianAvailability {
  technicianId: string;
  status: string; // 'available', 'on_leave', 'busy', etc.
  scheduleNote?: string;
  // Working hours per day of week (0=Sunday, 1=Monday, ... 6=Saturday)
  daySchedules: Record<number, DayScheduleInfo>;
}

export interface DayScheduleInfo {
  enabled: boolean;
  startTime: string; // e.g. "08:00"
  endTime: string;   // e.g. "17:00"
  lunchStart?: string;
  lunchEnd?: string;
  fullDayOff: boolean;
}
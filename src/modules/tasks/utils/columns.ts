import type { Column } from "../types";

// Fixed status columns for Activity Tracker
export const defaultStatusColumns: Column[] = [
  { id: 'open', title: 'Open', color: 'bg-muted-foreground', position: 0, isDefault: true, createdAt: new Date() },
  { id: 'in-progress', title: 'In Progress', color: 'bg-primary', position: 1, isDefault: false, createdAt: new Date() },
  { id: 'completed', title: 'Completed', color: 'bg-success', position: 2, isDefault: false, createdAt: new Date() },
  { id: 'cancelled', title: 'Cancelled', color: 'bg-destructive', position: 3, isDefault: false, createdAt: new Date() },
];

export const buildStatusColumns = (_taskStatuses: any[]): Column[] => {
  // Activity Tracker model uses fixed statuses regardless of project configurations
  return defaultStatusColumns;
};

export const defaultTechnicianColumns: Column[] = [
  { id: 'sarah', title: 'Sarah Wilson', color: 'bg-primary', position: 0, isDefault: false, createdAt: new Date() },
  { id: 'mike', title: 'Mike Chen', color: 'bg-accent', position: 1, isDefault: false, createdAt: new Date() },
  { id: 'lisa', title: 'Lisa Johnson', color: 'bg-success', position: 2, isDefault: false, createdAt: new Date() },
  { id: 'david', title: 'David Park', color: 'bg-warning', position: 3, isDefault: false, createdAt: new Date() },
];

export interface Job {
  id: string;
  serviceOrderId: string;
  serviceOrderTitle?: string; // Service order title for display
  serviceOrderNumber?: string; // Service order number like SO-20260127-6AC26
  title: string;
  description?: string;
  status: 'unassigned' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  estimatedDuration: number; // minutes (can be modified when planning)
  originalDuration?: number; // Original expected duration from article/offer (in minutes)
  requiredSkills: string[];
  assignedTechnicianId?: string;
  assignedTechnicianIds?: string[]; // All technicians assigned to this dispatch (multi-tech)
  isShared?: boolean; // True when this dispatch is rendered under multiple technicians
  scheduledStart?: Date;
  scheduledEnd?: Date;
  isLocked?: boolean;
  installationId?: number;
  installationName?: string;
  location: {
    address: string;
    lat?: number;
    lng?: number;
  };
  // Contact information from the service order
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  customerCompany?: string;
  contactId?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Technician {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  skills: string[];
  status: 'available' | 'busy' | 'offline' | 'on_leave' | 'not_working' | 'over_capacity';
  location?: {
    lat?: number;
    lng?: number;
    address?: string;
  };
  avatar?: string;
  workingHours: {
    start: string; // "09:00"
    end: string;   // "17:00"
  };
}

export interface ServiceOrder {
  id: string;
  title: string;
  customerName: string;
  status: 'pending' | 'ready_for_planning' | 'planned' | 'scheduled' | 'in_progress' | 'technically_completed' | 'ready_for_invoice' | 'completed' | 'invoiced' | 'closed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  jobs: Job[];
  totalEstimatedDuration: number;
  location: {
    address: string;
    lat?: number;
    lng?: number;
  };
  createdAt: Date;
}

export interface CalendarTimeSlot {
  hour: number;
  minute: number;
  date: Date;
}

export interface InstallationGroup {
  installationId: string;
  installationName: string;
  serviceOrderId: string;
  serviceOrderTitle: string;
  jobs: Job[];
}

export interface DragData {
  type: 'job' | 'serviceOrder' | 'installationGroup';
  item: Job | ServiceOrder | InstallationGroup;
  sourceTechnicianId?: string;
}

export interface CalendarViewType {
  type: 'day' | 'week';
  startDate: Date;
  endDate: Date;
}
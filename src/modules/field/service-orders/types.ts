// Re-export core types with better organization
import type { Job } from './entities/jobs/types';
import type { ServiceOrderDispatch } from './entities/dispatches/types';
import type { WorkStep, TimeEntry, WorkAttachment, Checklist } from './entities/work-details/types';
import type { MaterialUsage } from './entities/materials/types';
import type { ServiceOrderFinancials } from './entities/financials/types';
import type { FollowUpReminder } from './entities/follow-up/types';
import type { ChangeLogEntry } from './entities/audit/types';
import type { ServiceOrderCommunication } from './entities/communications/types';

export interface ServiceOrder {
  id: string;
  orderNumber: string;
  offerId?: string; // Link to CRM Offer
  saleId?: string; // Link to Sale Order
  saleNumber?: string; // Sale order number for display
  
  // Customer Information
  customer: {
    id: string;
    company: string;
    contactPerson: string;
    phone: string;
    email: string;
    address: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
      longitude: number;
      latitude: number;
      hasLocation: number;
    };
  };
  
  // Service Order Status
  status: 'draft' | 'pending' | 'planned' | 'ready_for_planning' | 'scheduled' | 'in_progress' | 'on_hold' | 'partially_completed' | 'technically_completed' | 'ready_for_invoice' | 'completed' | 'invoiced' | 'closed' | 'cancelled';
  
  // Repair Details
  repair: {
    description: string;
    location: string;
    urgencyLevel: 'low' | 'medium' | 'high' | 'urgent';
    promisedRepairDate?: Date;
  };
  
  // Priority and Dates
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: Date;
  updatedAt: Date;
  
  // Technicians
  assignedTechnicians: string[];
  
  // Jobs - the work items that need to be done
  jobs: Job[];
  
  // Dispatches - planned/scheduled jobs
  dispatches: ServiceOrderDispatch[];
  
  // Work Details
  workDetails: {
    stepsPerformed: WorkStep[];
    timeTracking: TimeEntry[];
    photos: WorkAttachment[];
    checklists: Checklist[];
  };
  
  // Materials & Resources
  materials: MaterialUsage[];
  
  // Financials
  financials: ServiceOrderFinancials;
  
  // Follow-Up
  followUp: {
    reminders: FollowUpReminder[];
    maintenanceNotes: string;
  };
  
  // Audit & Communication
  changeLog: ChangeLogEntry[];
  communications: ServiceOrderCommunication[];
}

// Legacy type aliases for backward compatibility - prefer using specific entity types
export type { Job, CreateJobData, UpdateJobData, JobFilters } from './entities/jobs/types';
export type { ServiceOrderDispatch } from './entities/dispatches/types';
export type { WorkStep, TimeEntry, WorkAttachment as Attachment, Checklist, ChecklistItem } from './entities/work-details/types';
export type { MaterialUsage as MaterialUsed } from './entities/materials/types';
export type { FollowUpReminder } from './entities/follow-up/types';
export type { ChangeLogEntry } from './entities/audit/types';
export type { ServiceOrderCommunication as CommunicationRecord } from './entities/communications/types';

// Filter and Search Types
export interface ServiceOrderFilters {
  status?: ServiceOrder['status'][];
  priority?: ServiceOrder['priority'][];
  technician?: string[];
  customer?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  searchTerm?: string;
}

export interface CreateServiceOrderData {
  customer: ServiceOrder['customer'];
  repair: ServiceOrder['repair'];
  priority: ServiceOrder['priority'];
  assignedTechnicians?: string[];
  offerId?: string;
  installations: string[]; // mandatory - at least one installation must be selected
}
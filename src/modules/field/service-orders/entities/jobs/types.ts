export interface Job {
  id: string;
  serviceOrderId: string;
  jobNumber: string;
  title: string;
  description: string;
  status: 'unscheduled' | 'ready' | 'dispatched' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  
  // Work Requirements
  requiredSkills: string[];
  estimatedDuration: number; // minutes
  estimatedCost: number;
  
  // Installation/Equipment (mandatory - every job must be linked to an installation)
  installationId: string;
  installationName?: string;
  installation?: {
    id: string;
    name: string;
    model: string;
    location: string;
  };
  
  // Work Details
  workType: 'maintenance' | 'repair' | 'installation' | 'inspection' | 'upgrade';
  workLocation: string;
  specialInstructions?: string;
  
  // Progress Tracking
  completionPercentage: number;
  actualStartTime?: Date;
  actualEndTime?: Date;
  actualDuration?: number;
  actualCost?: number;
  
  // Notes and Issues
  notes: string;
  internalNotes?: string;
  issues: JobIssue[];
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  modifiedBy: string;

  // Technicians
  assignedTechnicianIds?: string[];
  assignedTechnicians?: any[];
}

export interface JobIssue {
  id: string;
  jobId: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  reportedBy: string;
  reportedAt: Date;
  resolvedBy?: string;
  resolvedAt?: Date;
  resolution?: string;
}

export interface JobFilters {
  status?: Job['status'][];
  priority?: Job['priority'][];
  workType?: Job['workType'][];
  assignedTechnician?: string[];
  installation?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  searchTerm?: string;
}

export interface CreateJobData {
  serviceOrderId: string;
  title: string;
  description: string;
  priority: Job['priority'];
  requiredSkills: string[];
  estimatedDuration: number;
  estimatedCost: number;
  workType: Job['workType'];
  workLocation: string;
  installationId: string; // mandatory - job must be linked to an installation
  specialInstructions?: string;
  notes?: string;
}

export interface UpdateJobData {
  title?: string;
  description?: string;
  status?: Job['status'];
  priority?: Job['priority'];
  assignedTechnicians?: string[];
  scheduledDate?: Date;
  scheduledStartTime?: string;
  scheduledEndTime?: string;
  completionPercentage?: number;
  notes?: string;
  internalNotes?: string;
}
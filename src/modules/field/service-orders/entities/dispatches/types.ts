export interface ServiceOrderDispatch {
  id: string;
  serviceOrderId: string;
  jobId: string; // mandatory - dispatch is created from a job (first job for multi-job)
  // Multi-job / installation dispatch fields
  installationId?: number;
  installationName?: string;
  jobIds?: number[];
  dispatchNumber: string;
  assignedTechnicians: string[];
  requiredSkills: string[];
  scheduledDate?: Date;
  scheduledStartTime?: string;
  scheduledEndTime?: string;
  estimatedDuration: number; // minutes
  actualStartTime?: Date;
  actualEndTime?: Date;
  actualDuration?: number;
  status: 'pending' | 'planned' | 'assigned' | 'acknowledged' | 'en_route' | 'on_site' | 'in_progress' | 'technically_completed' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  workloadHours: number;
  travelTime?: number;
  travelDistance?: number;
  notes?: string;
  dispatchedBy: string;
  dispatchedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface DispatchRoute {
  id: string;
  routeName: string;
  technicianId: string;
  date: Date;
  dispatches: ServiceOrderDispatch[];
  optimizedOrder: string[]; // dispatch IDs in optimal order
  totalEstimatedTime: number;
  totalEstimatedDistance: number;
  actualTime?: number;
  actualDistance?: number;
  status: 'planned' | 'in_progress' | 'completed';
  startLocation?: {
    lat: number;
    lng: number;
    address: string;
  };
  endLocation?: {
    lat: number;
    lng: number;
    address: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface DispatchUpdate {
  id: string;
  dispatchId: string;
  updateType: 'status_change' | 'time_update' | 'location_update' | 'note_added';
  oldValue?: string;
  newValue: string;
  updatedBy: string;
  updatedAt: Date;
  notes?: string;
}
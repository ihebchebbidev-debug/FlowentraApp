export interface WorkStep {
  id: string;
  serviceOrderId: string;
  stepNumber: number;
  title: string;
  description: string;
  requiredTools?: string[];
  requiredMaterials?: string[];
  estimatedDuration: number; // minutes
  actualDuration?: number;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  completedBy?: string;
  completedAt?: Date;
  notes?: string;
  photos?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface TimeEntry {
  id: string;
  serviceOrderId: string;
  technicianId: string;
  workType: 'travel' | 'setup' | 'work' | 'cleanup' | 'documentation';
  startTime: Date;
  endTime?: Date;
  duration?: number; // minutes
  description: string;
  billable: boolean;
  hourlyRate?: number;
  totalCost?: number;
  approvedBy?: string;
  approvedAt?: Date;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkAttachment {
  id: string;
  serviceOrderId: string;
  workStepId?: string;
  type: 'photo_before' | 'photo_after' | 'photo_progress' | 'document' | 'video' | 'signature';
  filename: string;
  originalName: string;
  url: string;
  mimeType: string;
  fileSize: number;
  uploadedBy: string;
  uploadedAt: Date;
  caption?: string;
  tags?: string[];
}

export interface Checklist {
  id: string;
  serviceOrderId: string;
  templateId?: string;
  title: string;
  description?: string;
  items: ChecklistItem[];
  completionPercentage: number;
  completedBy?: string;
  completedAt?: Date;
  status: 'not_started' | 'in_progress' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}

export interface ChecklistItem {
  id: string;
  checklistId: string;
  itemNumber: number;
  description: string;
  required: boolean;
  completed: boolean;
  completedBy?: string;
  completedAt?: Date;
  notes?: string;
  photos?: string[];
}
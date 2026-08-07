// Dispatch Job Types
export interface DispatchJob {
  id: string;
  jobNumber: string;
  serviceOrderId: string;
  serviceOrderNumber: string;
  title: string;
  description: string;
  status: "pending" | "assigned" | "acknowledged" | "en_route" | "on_site" | "in_progress" | "completed" | "cancelled";
  priority: "low" | "medium" | "high" | "urgent";

  // Customer Information (from parent Service Order)
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

  // Assignment & Scheduling
  assignedTechnicians: Technician[];
  requiredSkills: string[];
  scheduledDate: Date;
  scheduledStartTime: string;
  scheduledEndTime: string;
  estimatedDuration: number; // minutes
  workLocation: {
    address: string;
    lat?: number;
    lng?: number;
    longitude: number;
    latitude: number;
    hasLocation: number;
  };

  // Time Tracking
  timeEntries: TimeEntry[];
  actualStartTime?: Date;
  actualEndTime?: Date;
  actualDuration?: number;

  // Expenses
  expenses: ExpenseEntry[];

  // Articles/Materials Used
  articlesUsed: ArticleUsage[];

  // Attachments & Photos
  attachments: JobAttachment[];

  // Notes & Issues
  notes: JobNote[];

  // Metadata
  dispatchedBy: string;
  dispatchedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  completionPercentage?: number;
}

export interface Technician {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  skills: string[];
  status: "available" | "busy" | "offline";
}

export interface TimeEntry {
  id: string;
  dispatchId: string;
  technicianId: string;
  technicianName: string;
  workType: "travel" | "work" | "waiting" | "preparation" | "break";
  startTime: Date;
  endTime?: Date;
  duration: number; // minutes
  description: string;
  billable: boolean;
  hourlyRate?: number;
  totalCost?: number;
  status: "active" | "completed" | "approved" | "rejected";
  createdAt: Date;
  updatedAt?: Date;
}

export interface ExpenseEntry {
  id: string;
  dispatchId: string;
  technicianId: string;
  technicianName: string;
  type: "travel" | "meal" | "accommodation" | "materials" | "other";
  amount: number;
  currency: string;
  description: string;
  receipt?: string; // file path/url
  date: Date;
  status: "pending" | "approved" | "rejected";
  createdAt: Date;
  approvedBy?: string;
  approvedAt?: Date;
}

export interface ArticleUsage {
  id: string;
  dispatchId: string;
  articleId: string;
  articleName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  usedBy: string;
  usedAt: Date;
  internalComment?: string;
  externalComment?: string;
  // If the article is replacing an existing one, mark it and optionally store a photo path of the old item
  replacing?: boolean;
  oldPhotoPath?: string;
  // Extra info about the replaced article
  oldArticleModel?: string;
  oldArticleStatus?: 'broken' | 'not_broken' | 'unknown';
}

export interface JobAttachment {
  id: string;
  dispatchId: string;
  fileName: string;
  fileType: string;
  fileSize: number; // MB
  filePath?: string;
  uploadedBy: string;
  uploadedAt: Date;
  category: "photo" | "document" | "diagnostic" | "completion" | "other";
  description?: string;
  location?: {
    lat: number;
    lng: number;
  };
}

export interface JobNote {
  id: string;
  dispatchId: string;
  content: string;
  createdBy: string;
  createdByName: string;
  createdAt: Date;
  updatedAt?: Date;
  category: "general" | "issue" | "work_performed" | "customer_interaction" | "internal";
  priority?: "low" | "medium" | "high";
  attachments?: string[]; // attachment IDs
  resolved?: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
}

// Form Data Types
export interface CreateTimeEntryData {
  dispatchId: string;
  technicianId: string;
  workType: TimeEntry["workType"];
  startTime: Date;
  endTime?: Date;
  duration?: number;
  description: string;
  billable: boolean;
  hourlyRate?: number;
}

export interface CreateExpenseData {
  dispatchId: string;
  technicianId: string;
  type: ExpenseEntry["type"];
  amount: number;
  currency: string;
  description: string;
  receipt?: File;
  date: Date;
}

export interface CreateJobNoteData {
  dispatchId: string;
  content: string;
  category: JobNote["category"];
  priority?: JobNote["priority"];
  attachments?: File[];
}

export interface CreateAttachmentData {
  dispatchId: string;
  file: File;
  category: JobAttachment["category"];
  description?: string;
  location?: {
    lat: number;
    lng: number;
  };
}

// Filter Types
export interface DispatchJobFilters {
  status?: DispatchJob["status"][];
  priority?: DispatchJob["priority"][];
  technician?: string[];
  customer?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  searchTerm?: string;
}
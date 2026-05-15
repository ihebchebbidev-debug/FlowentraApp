export interface WorkflowStep {
  id: string;
  title: string;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  timestamp?: Date;
  actor?: string;
  description?: string;
}

export interface WorkflowContact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  address?: string;
}

export interface WorkflowItem {
  id: string;
  itemCode: string;
  itemName: string;
  type: 'article' | 'service';
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  description?: string;
}

export interface WorkflowOffer {
  id: string;
  title: string;
  contactId: string;
  items: WorkflowItem[];
  amount: number;
  status: 'draft' | 'sent' | 'accepted' | 'declined' | 'expired';
  validUntil?: Date;
  shareLink?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkflowSale {
  id: string;
  title: string;
  contactId: string;
  offerId?: string;
  items: WorkflowItem[];
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'invoiced' | 'paid' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkflowTechnician {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  status: 'available' | 'busy' | 'offline';
  skills: string[];
}

export interface WorkflowDispatch {
  id: string;
  serviceOrderId: string;
  dispatchNumber?: string;
  title: string;
  description?: string;
  status: 'scheduled' | 'en_route' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedTechnician?: WorkflowTechnician;
  startAt?: Date;
  endAt?: Date;
  estimatedDuration: number;
  location: {
    address: string;
    lat?: number;
    lng?: number;
  };
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkflowServiceOrder {
  id: string;
  title: string;
  contactId: string;
  saleId?: string;
  status: 'pending' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dispatches: WorkflowDispatch[];
  completionPercentage: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface KanbanColumn {
  id: string;
  title: string;
  key: string;
  color?: string;
  limit?: number;
}

export interface WorkflowNotification {
  id: string;
  type: 'offer_accepted' | 'offer_declined' | 'dispatch_started' | 'dispatch_completed' | 'sale_created';
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
  relatedId?: string;
  relatedType?: 'offer' | 'sale' | 'serviceOrder' | 'dispatch';
}

export interface QuickCreateWorkflowData {
  contactId: string;
  items: WorkflowItem[];
  pricing: {
    subtotal: number;
    taxes: number;
    discount: number;
    total: number;
  };
  delivery?: {
    address: string;
    scheduledDate?: Date;
    notes?: string;
  };
  notifications: {
    autoCreateSale: boolean;
    notifyCustomer: boolean;
    sendReminders: boolean;
  };
}

export interface WorkflowActivity {
  id: string;
  type: 'offer_created' | 'offer_sent' | 'offer_accepted' | 'sale_created' | 'service_scheduled' | 'dispatch_assigned';
  title: string;
  description: string;
  actor: string;
  timestamp: Date;
  relatedId: string;
  relatedType: 'offer' | 'sale' | 'serviceOrder' | 'dispatch';
}
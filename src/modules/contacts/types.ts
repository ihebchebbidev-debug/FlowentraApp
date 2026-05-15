// Database Tables/Entities for Contacts Module
export interface Contact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  position?: string;
  status: 'active' | 'inactive' | 'prospect' | 'customer';
  type: 'individual' | 'company';
  tags: string[];
  lastContact?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ContactNote {
  id: string;
  contactId: string;
  content: string;
  createdAt: Date;
  createdBy: string;
}

export interface ContactOffer {
  id: string;
  contactId: string;
  title: string;
  amount: number;
  status: 'draft' | 'sent' | 'accepted' | 'rejected';
  validUntil?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ContactTag {
  id: string;
  name: string;
  color: string;
  createdAt: Date;
}

export interface ContactProject {
  id: string;
  contactId: string;
  name: string;
  description?: string;
  status: 'active' | 'completed' | 'on-hold' | 'cancelled';
  type: 'service' | 'sales' | 'internal' | 'custom';
  startDate?: Date;
  endDate?: Date;
  ownerId: string;
  ownerName: string;
  teamMembers: string[];
  columns: ContactProjectColumn[];
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export interface ContactProjectColumn {
  id: string;
  title: string;
  color: string;
  position: number;
  projectId: string;
  isDefault: boolean;
  createdAt: Date;
}

export interface ContactTask {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigneeId?: string;
  assigneeName?: string;
  projectId: string;
  contactId: string;
  parentTaskId?: string;
  dueDate?: Date;
  tags: string[];
  estimatedHours?: number;
  actualHours?: number;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  columnId: string;
  position: number;
}

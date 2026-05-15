// Database Tables/Entities for Deals Module
export interface Deal {
  id: string;
  title: string;
  value: number;
  currency: string;
  stage: 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'closed-won' | 'closed-lost';
  
  contactId?: string;
  companyId?: string;
  ownerId: string;
  source: string;
  expectedCloseDate?: Date;
  actualCloseDate?: Date;
  description?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface DealActivity {
  id: string;
  dealId: string;
  type: 'call' | 'email' | 'meeting' | 'note' | 'task';
  title: string;
  description?: string;
  scheduledAt?: Date;
  completedAt?: Date;
  createdBy: string;
  createdAt: Date;
}

export interface DealStage {
  id: string;
  name: string;
  order: number;
  isActive: boolean;
  createdAt: Date;
}

export interface Pipeline {
  id: string;
  name: string;
  description?: string;
  isDefault: boolean;
  stages: DealStage[];
  createdAt: Date;
  updatedAt: Date;
}

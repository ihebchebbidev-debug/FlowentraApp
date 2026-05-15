// Database Tables/Entities for Communication Module
export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  variables: string[];
  category: string;
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmailCampaign {
  id: string;
  name: string;
  subject: string;
  content: string;
  templateId?: string;
  recipientListId: string;
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'cancelled';
  scheduledAt?: Date;
  sentAt?: Date;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmailMessage {
  id: string;
  campaignId?: string;
  fromAddress: string;
  toAddress: string;
  subject: string;
  content: string;
  status: 'pending' | 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'failed';
  sentAt?: Date;
  deliveredAt?: Date;
  openedAt?: Date;
  clickedAt?: Date;
  metadata?: Record<string, any>;
}

export interface ContactList {
  id: string;
  name: string;
  description?: string;
  contactCount: number;
  tags: string[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ContactListMember {
  id: string;
  listId: string;
  contactId: string;
  status: 'active' | 'unsubscribed' | 'bounced';
  addedAt: Date;
  unsubscribedAt?: Date;
}

export interface SMSMessage {
  id: string;
  campaignId?: string;
  toNumber: string;
  content: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  sentAt?: Date;
  deliveredAt?: Date;
  failureReason?: string;
  cost?: number;
  createdAt: Date;
}

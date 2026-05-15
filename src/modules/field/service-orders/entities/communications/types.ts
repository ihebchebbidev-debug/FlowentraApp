export interface ServiceOrderCommunication {
  id: string;
  serviceOrderId: string;
  type: 'email' | 'phone' | 'sms' | 'in_person' | 'system_notification' | 'internal_note';
  direction: 'inbound' | 'outbound' | 'internal';
  
  // Participants
  fromUserId?: string;
  fromName: string;
  fromEmail?: string;
  fromPhone?: string;
  toUserId?: string;
  toName: string;
  toEmail?: string;
  toPhone?: string;
  ccUsers?: string[];
  
  // Content
  subject?: string;
  content: string;
  summary?: string;
  
  // Attachments
  attachments?: CommunicationAttachment[];
  
  // Metadata
  timestamp: Date;
  readAt?: Date;
  readBy?: string[];
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'draft' | 'sent' | 'delivered' | 'read' | 'replied' | 'failed';
  
  // System
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CommunicationAttachment {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  fileSize: number;
  url: string;
  uploadedAt: Date;
}

export interface CommunicationTemplate {
  id: string;
  name: string;
  type: 'email' | 'sms';
  subject?: string;
  content: string;
  variables: string[];
  category: 'appointment' | 'completion' | 'delay' | 'follow_up' | 'invoice';
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationPreference {
  id: string;
  userId: string;
  serviceOrderEvents: {
    created: boolean;
    assigned: boolean;
    started: boolean;
    completed: boolean;
    cancelled: boolean;
    delayed: boolean;
  };
  channels: {
    email: boolean;
    sms: boolean;
    push: boolean;
    inApp: boolean;
  };
  quietHours: {
    enabled: boolean;
    startTime: string;
    endTime: string;
  };
}
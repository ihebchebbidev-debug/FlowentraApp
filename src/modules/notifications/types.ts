// Database Tables/Entities for Notifications Module
export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'reminder';
  category: 'system' | 'task' | 'deal' | 'contact' | 'calendar' | 'general';
  isRead: boolean;
  actionUrl?: string;
  actionLabel?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  readAt?: Date;
  expiresAt?: Date;
}

export interface NotificationPreference {
  id: string;
  userId: string;
  category: string;
  email: boolean;
  push: boolean;
  inApp: boolean;
  sms: boolean;
  frequency: 'immediate' | 'daily' | 'weekly' | 'never';
  quietHours?: {
    start: string;
    end: string;
    timezone: string;
  };
}

export interface NotificationTemplate {
  id: string;
  name: string;
  type: string;
  subject?: string;
  content: string;
  variables: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationQueue {
  id: string;
  notificationId: string;
  userId: string;
  channel: 'email' | 'push' | 'sms' | 'in_app';
  status: 'pending' | 'sent' | 'failed' | 'cancelled';
  scheduledAt: Date;
  sentAt?: Date;
  failureReason?: string;
  retryCount: number;
}

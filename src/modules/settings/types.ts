// Database Tables/Entities for Settings Module
export interface UserSettings {
  id: string;
  userId: string;
  theme: 'light' | 'dark' | 'system';
  language: string;
  timezone: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
  currency: string;
  notifications: Record<string, boolean>;
  privacy: Record<string, boolean>;
  updatedAt: Date;
}

export interface SystemSettings {
  id: string;
  key: string;
  value: string;
  type: 'string' | 'number' | 'boolean' | 'json';
  category: string;
  description?: string;
  isPublic: boolean;
  updatedBy: string;
  updatedAt: Date;
}

export interface Role {
  id: string;
  name: 'superadmin' | 'admin' | 'technician' | 'customer';
}

export interface Permission {
  id: string;
  name: string;
  resource: string;
  action: 'create' | 'read' | 'update' | 'delete' | 'manage';
  description?: string;
}

export interface UserRole {
  id: string;
  userId: string;
  roleId: string;
  assignedBy: string;
  assignedAt: Date;
  expiresAt?: Date;
}

export interface SystemLog {
  id: string;
  level: 'debug' | 'info' | 'warning' | 'error' | 'critical';
  message: string;
  module: string;
  userId?: string;
  ipAddress: string;
  userAgent?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

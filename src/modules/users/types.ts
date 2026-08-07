// Database Tables/Entities for Users Module
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  username?: string;
  avatar?: string;
  phone?: string;
  dateOfBirth?: Date;
  status: 'active' | 'inactive' | 'suspended' | 'pending';
  emailVerified: boolean;
  phoneVerified: boolean;
  role: 'superadmin' | 'admin' | 'technician' | 'customer';
  skills: string[];
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile {
  id: string;
  userId: string;
  bio?: string;
  website?: string;
  location?: string;
  company?: string;
  position?: string;
  socialLinks?: Record<string, string>;
  preferences: Record<string, any>;
  metadata?: Record<string, any>;
  updatedAt: Date;
}

export interface UserSession {
  id: string;
  userId: string;
  token: string;
  refreshToken?: string;
  deviceInfo: {
    userAgent: string;
    ip: string;
    device: string;
    browser: string;
    os: string;
  };
  isActive: boolean;
  expiresAt: Date;
  createdAt: Date;
  lastAccessedAt: Date;
}

export interface UserActivity {
  id: string;
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  metadata?: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  createdAt: Date;
}
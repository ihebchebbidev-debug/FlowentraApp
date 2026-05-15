export interface ServiceOrderAudit {
  id: string;
  serviceOrderId: string;
  action: AuditAction;
  entityType: 'service_order' | 'dispatch' | 'material' | 'time_entry' | 'work_step' | 'communication';
  entityId?: string;
  userId: string;
  userName: string;
  timestamp: Date;
  
  // Change details
  changes?: AuditChange[];
  
  // Additional context
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  
  // System info
  createdAt: Date;
}

export type AuditAction = 
  | 'created'
  | 'updated' 
  | 'deleted'
  | 'assigned'
  | 'unassigned'
  | 'started'
  | 'completed'
  | 'cancelled'
  | 'dispatched'
  | 'material_added'
  | 'material_removed'
  | 'time_logged'
  | 'status_changed'
  | 'note_added'
  | 'attachment_uploaded'
  | 'communication_sent'
  | 'approval_granted'
  | 'approval_denied';

export interface AuditChange {
  field: string;
  oldValue: any;
  newValue: any;
  changeType: 'created' | 'updated' | 'deleted';
}

export interface ChangeLogEntry {
  id: string;
  serviceOrderId: string;
  timestamp: Date;
  userId: string;
  userName: string;
  action: string;
  details: string;
  oldValue?: string;
  newValue?: string;
  category: 'status' | 'assignment' | 'scheduling' | 'materials' | 'financials' | 'communication' | 'general';
  severity: 'info' | 'warning' | 'error';
}

export interface SystemLog {
  id: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  timestamp: Date;
  component: string;
  serviceOrderId?: string;
  userId?: string;
  context?: Record<string, any>;
  stackTrace?: string;
}
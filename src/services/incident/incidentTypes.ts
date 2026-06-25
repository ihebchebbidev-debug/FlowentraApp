export type IncidentType =
  | 'app_crash'
  | 'react_boundary'
  | 'unhandled_rejection'
  | 'window_error'
  | 'api_error'
  | 'mutation_error'
  | 'query_error'
  | 'network_error'
  | 'console_error'
  | 'chunk_load_error'
  | 'sync_failure'
  | 'logger_error'
  | 'backend_health'
  | 'security_violation';

export type IncidentSeverity = 'critical' | 'high' | 'medium' | 'low';

export interface IncidentReportPayload {
  incidentType: IncidentType;
  message: string;
  severity?: IncidentSeverity;
  module?: string;
  currentPage?: string;
  relatedUrl?: string;
  userEmail?: string;
  userId?: string;
  userName?: string;
  stack?: string;
  componentStack?: string;
  fingerprint?: string;
  httpStatus?: number;
  httpMethod?: string;
  endpoint?: string;
  entityType?: string;
  entityId?: string;
  referenceId?: string;
  systemLogId?: number;
  details?: string;
  userAgent?: string;
  clientOccurrenceCount?: number;
}

export interface AutoIncidentResult {
  ticketId?: number;
  created: boolean;
  skipped: boolean;
  skipReason?: string;
  occurrenceCount: number;
  fingerprint?: string;
}

export interface ReportIssuePrefill {
  title?: string;
  description?: string;
  category?: string;
  urgency?: string;
  currentPage?: string;
  relatedUrl?: string;
  referenceId?: string;
}

export const INCIDENT_SKIP_ENDPOINTS = [
  '/api/Incidents',
  '/api/SystemLogs',
  '/api/logs',
  '/api/Auth/refresh',
];

export const INCIDENT_PREFILL_EVENT = 'incident:prefill-report';

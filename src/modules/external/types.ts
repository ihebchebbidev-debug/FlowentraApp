export interface ExternalEndpoint {
  id: number;
  name: string;
  slug: string;
  description?: string;
  apiKey: string;
  isActive: boolean;
  allowedMethods: string;
  allowedOrigins?: string;
  expectedSchema?: string;
  responseTemplate?: string;
  webhookForwardUrl?: string;
  /** Days to retain inbound logs (0 = forever). Pruned by background sweep. */
  logRetentionDays: number;
  /** Comma-separated accepted content types: "json", "xml", "form", "any". */
  acceptedContentTypes: string;
  createdAt: string;
  updatedAt?: string;
  createdBy: string;
  totalReceived: number;
  receivedToday: number;
  lastReceived?: string;
  totalSent: number;
  sentToday: number;
}

export interface CreateExternalEndpointData {
  name: string;
  slug?: string;
  description?: string;
  isActive: boolean;
  allowedMethods: string;
  allowedOrigins?: string;
  expectedSchema?: string;
  responseTemplate?: string;
  webhookForwardUrl?: string;
  /** Optional. Defaults to 30 server-side. 0 = forever. Clamped 0–3650. */
  logRetentionDays?: number;
  /** Comma-separated accepted content types: "json", "xml", "form", "any". Default "any". */
  acceptedContentTypes?: string;
}

export interface UpdateExternalEndpointData {
  name?: string;
  description?: string;
  isActive?: boolean;
  allowedMethods?: string;
  allowedOrigins?: string;
  expectedSchema?: string;
  responseTemplate?: string;
  webhookForwardUrl?: string;
  logRetentionDays?: number;
  acceptedContentTypes?: string;
}

export interface ExternalEndpointLog {
  id: number;
  endpointId: number;
  method: string;
  headers?: string;
  queryString?: string;
  body?: string;
  sourceIp?: string;
  statusCode: number;
  responseBody?: string;
  receivedAt: string;
  processedAt?: string;
  isRead: boolean;
  /** MIME type of the inbound request (e.g. "application/json", "application/xml"). */
  contentType?: string;
  /** Company / tenant identifier provided by the sender via X-Company-ID header or ?company_id= query. */
  companyId?: string;
}

export interface ExternalEndpointStats {
  totalEndpoints: number;
  activeEndpoints: number;
  totalReceivedToday: number;
  totalReceivedAll: number;
  totalSentToday: number;
  totalSentAll: number;
}

// ─── Integration Hub ─────────────────────────────────────────────────────────

/** Lightweight summary of a connector's contribution to the endpoint list. */
export interface ConnectorGroup {
  connectorId: string;
  connectorName: string;
  logo: string;
  color: string;
  endpoints: ExternalEndpoint[];
}

// ─── Conversion preview ───────────────────────────────────────────────────────
// Conversion preview returned by GET /external-endpoints/{id}/logs/{logId}/convert-preview
// Mirrors the backend's ConvertLogPreviewDto. All fields are optional because the
// parser is heuristic — payloads vary per integration.
export type FieldConfidence = 'exact' | 'inferred' | 'none' | 'edited';

export interface ConvertLogPreviewItem {
  description?: string;
  quantity?: number;
  unitPrice?: number;
  totalPrice?: number;
  confidence?: FieldConfidence;
}

export interface ConvertLogPreview {
  logId: number;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: string;
  items?: ConvertLogPreviewItem[];
  totalAmount?: number;
  currency?: string;
  notes?: string;
  /** Per-field confidence map keyed by field name (contactName, email, ...). */
  confidence?: Partial<Record<string, FieldConfidence>>;
}

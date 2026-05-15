import { apiFetch } from './apiClient';

// ─── Types matching backend DTOs ───

export interface ConnectedEmailAccountDto {
  id: string;
  userId: number;
  handle: string;
  provider: 'google' | 'microsoft';
  syncStatus: 'not_synced' | 'syncing' | 'active' | 'failed';
  lastSyncedAt?: string;
  authFailedAt?: string | null;
  emailVisibility: string;
  calendarVisibility: string;
  contactAutoCreationPolicy: string;
  isEmailSyncEnabled: boolean;
  isCalendarSyncEnabled: boolean;
  excludeGroupEmails: boolean;
  excludeNonProfessionalEmails: boolean;
  isCalendarContactAutoCreationEnabled: boolean;
  createdAt: string;
  blocklistItems: BlocklistItemDto[];
}

export interface BlocklistItemDto {
  id: string;
  handle: string;
  createdAt: string;
}

export interface OAuthConfigDto {
  provider: string;
  authUrl: string;
  clientId: string;
  scopes: string[];
  redirectUri: string;
}

export interface OAuthCallbackDto {
  provider: string;
  code: string;
  redirectUri?: string;
  emailVisibility?: string;
  calendarVisibility?: string;
}

export interface UpdateEmailSettingsDto {
  emailVisibility?: string;
  contactAutoCreationPolicy?: string;
  excludeGroupEmails?: boolean;
  excludeNonProfessionalEmails?: boolean;
  isEmailSyncEnabled?: boolean;
}

export interface UpdateCalendarSettingsDto {
  calendarVisibility?: string;
  isCalendarContactAutoCreationEnabled?: boolean;
  isCalendarSyncEnabled?: boolean;
}

export interface CustomEmailAccountDto {
  id: string;
  userId?: number;
  email: string;
  displayName?: string;
  smtpServer?: string;
  smtpPort?: number;
  smtpSecurity?: string;
  imapServer?: string;
  imapPort?: number;
  imapSecurity?: string;
  pop3Server?: string;
  pop3Port?: number;
  pop3Security?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  connectedAccountId?: string;
}

// ─── Synced Email Types ───

export interface SyncedEmailAttachmentDto {
  id: string;
  externalAttachmentId: string;
  fileName: string;
  contentType: string;
  size: number;
}

export interface AttachmentDownloadDto {
  fileName: string;
  contentType: string;
  size: number;
  contentBase64: string;
}

export interface SyncedEmailDto {
  id: string;
  externalId: string;
  threadId?: string;
  subject: string;
  snippet?: string;
  fromEmail: string;
  fromName?: string;
  toEmails?: string;  // JSON array
  ccEmails?: string;  // JSON array
  bodyPreview?: string;
  isRead: boolean;
  isStarred: boolean;
  hasAttachments: boolean;
  labels?: string;    // JSON array
  receivedAt: string;
  attachments?: SyncedEmailAttachmentDto[];
}

export interface SyncedEmailsPageDto {
  emails: SyncedEmailDto[];
  totalCount: number;
  nextPageToken?: string;
}

export interface SyncResultDto {
  newEmails: number;
  updatedEmails: number;
  syncedAt: string;
}

// ─── Synced Calendar Types ───

export interface SyncedCalendarEventDto {
  id: string;
  externalId: string;
  title: string;
  description?: string;
  location?: string;
  startTime: string;
  endTime: string;
  isAllDay: boolean;
  status: string;
  organizerEmail?: string;
  attendees?: string; // JSON array
}

export interface SyncedCalendarEventsPageDto {
  events: SyncedCalendarEventDto[];
  totalCount: number;
}

export interface CalendarSyncResultDto {
  newEvents: number;
  updatedEvents: number;
  syncedAt: string;
}

// ─── Create External Calendar Event Types ───

export interface CreateExternalCalendarEventDto {
  title: string;
  description?: string;
  location?: string;
  startTime: string; // ISO string
  endTime: string;   // ISO string
  isAllDay?: boolean;
  attendees?: string[]; // email addresses
}

export interface CreateExternalCalendarEventResultDto {
  success: boolean;
  externalId?: string;
  error?: string;
}

// ─── Send Email Types ───

export interface EmailAttachmentDto {
  fileName: string;
  contentType: string;
  contentBase64: string;
}

export interface SendEmailDto {
  to: string[];
  cc: string[];
  bcc: string[];
  subject: string;
  body: string;
  bodyHtml?: string;
  attachments?: EmailAttachmentDto[];
}

export interface SendEmailResultDto {
  success: boolean;
  messageId?: string;
  error?: string;
}

// ─── API Functions ───

const BASE = '/api/email-accounts';
const BASE_CUSTOM = `${BASE}/custom`;

export const emailAccountsApi = {
  /** Get OAuth config for a provider (authenticated — for settings/connected accounts).
   *  Skip logging since this may be called before auth (on login page). */
  getOAuthConfig: (provider: 'google' | 'microsoft') =>
    apiFetch<OAuthConfigDto>(`${BASE}/oauth-config/${provider}`, {
      headers: { 'X-Skip-Logging': 'true' },
    }),

  /**
   * Get OAuth config from a PUBLIC endpoint (no auth required).
   * Used on the login/signup page where the user is not authenticated.
   * Falls back to the authenticated endpoint if the public one doesn't exist.
   */
  getOAuthConfigPublic: async (provider: 'google' | 'microsoft'): Promise<OAuthConfigDto | null> => {
    try {
      // Try public Auth endpoint first (no auth required)
      const { API_URL } = await import('@/config/api');
      const { getCurrentTenant, TENANT_HEADER } = await import('@/utils/tenant');
      const tenant = getCurrentTenant();
      const headers: Record<string, string> = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      };
      if (tenant) headers[TENANT_HEADER] = tenant;

      const res = await fetch(`${API_URL}/api/Auth/oauth-config/${provider}`, {
        method: 'GET',
        headers,
      });

      if (res.ok) {
        const data = await res.json();
        return data?.data || data || null;
      }

      // Fallback: try the authenticated endpoint (will 401 if not logged in)
      const result = await apiFetch<OAuthConfigDto>(`${BASE}/oauth-config/${provider}`, {
        headers: { 'X-Skip-Logging': 'true' },
      });
      return result.data || null;
    } catch {
      return null;
    }
  },

  /** Exchange OAuth authorization code for tokens and create/reconnect account */
  oauthCallback: (dto: OAuthCallbackDto) =>
    apiFetch<ConnectedEmailAccountDto>(`${BASE}/oauth-callback`, {
      method: 'POST',
      body: JSON.stringify(dto),
    }),

  /** Get all connected accounts for current user */
  getAll: () =>
    apiFetch<ConnectedEmailAccountDto[]>(BASE),

  /** Get a specific account by ID */
  getById: (id: string) =>
    apiFetch<ConnectedEmailAccountDto>(`${BASE}/${id}`),

  /** Disconnect (delete) an account */
  disconnect: (id: string) =>
    apiFetch<void>(`${BASE}/${id}`, { method: 'DELETE' }),

  /** Reconnect an existing account */
  reconnect: (id: string, dto: OAuthCallbackDto) =>
    apiFetch<ConnectedEmailAccountDto>(`${BASE}/${id}/reconnect`, {
      method: 'POST',
      body: JSON.stringify(dto),
    }),

  /** Update email sync settings */
  updateEmailSettings: (id: string, dto: UpdateEmailSettingsDto) =>
    apiFetch<ConnectedEmailAccountDto>(`${BASE}/${id}/email-settings`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    }),

  /** Update calendar sync settings */
  updateCalendarSettings: (id: string, dto: UpdateCalendarSettingsDto) =>
    apiFetch<ConnectedEmailAccountDto>(`${BASE}/${id}/calendar-settings`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    }),

  /** Get blocklist for an account */
  getBlocklist: (accountId: string) =>
    apiFetch<BlocklistItemDto[]>(`${BASE}/${accountId}/blocklist`),

  /** Add an email/domain to blocklist */
  addBlocklistItem: (accountId: string, handle: string) =>
    apiFetch<BlocklistItemDto>(`${BASE}/${accountId}/blocklist`, {
      method: 'POST',
      body: JSON.stringify({ handle }),
    }),

  /** Remove a blocklist item */
  removeBlocklistItem: (accountId: string, itemId: string) =>
    apiFetch<void>(`${BASE}/${accountId}/blocklist/${itemId}`, {
      method: 'DELETE',
    }),

  // ─── Email Sync & Fetch ───

  /** Trigger email sync from provider */
  syncEmails: (accountId: string, maxResults = 50) =>
    apiFetch<SyncResultDto>(`${BASE}/${accountId}/sync-emails?maxResults=${maxResults}`, {
      method: 'POST',
    }),

  /** Get synced emails with pagination and search */
  getSyncedEmails: (accountId: string, page = 1, pageSize = 25, search?: string) => {
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (search) params.set('search', search);
    return apiFetch<SyncedEmailsPageDto>(`${BASE}/${accountId}/emails?${params}`);
  },

  // ─── Calendar Sync & Fetch ───

  /** Trigger calendar sync from provider */
  syncCalendar: (accountId: string, maxResults = 50) =>
    apiFetch<CalendarSyncResultDto>(`${BASE}/${accountId}/sync-calendar?maxResults=${maxResults}`, {
      method: 'POST',
    }),

  /** Get synced calendar events with pagination and search */
  getCalendarEvents: (accountId: string, page = 1, pageSize = 25, search?: string) => {
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (search) params.set('search', search);
    return apiFetch<SyncedCalendarEventsPageDto>(`${BASE}/${accountId}/calendar-events?${params}`);
  },

  /** Create a calendar event on the external provider (Google Calendar / Outlook) */
  createCalendarEvent: (accountId: string, dto: CreateExternalCalendarEventDto) =>
    apiFetch<CreateExternalCalendarEventResultDto>(`${BASE}/${accountId}/calendar-events`, {
      method: 'POST',
      body: JSON.stringify(dto),
    }),

  // ─── Send Email ───

  /** Send an email through a connected account */
  sendEmail: (accountId: string, dto: SendEmailDto) =>
    apiFetch<SendEmailResultDto>(`${BASE}/${accountId}/send-email`, {
      method: 'POST',
      body: JSON.stringify(dto),
    }),

  // ─── Star / Read / Delete Email ───

  /** Toggle starred status of an email */
  toggleStarEmail: (accountId: string, emailId: string) =>
    apiFetch<{ success: boolean }>(`${BASE}/${accountId}/emails/${emailId}/star`, {
      method: 'PATCH',
    }),

  /** Toggle read/unread status of an email */
  toggleReadEmail: (accountId: string, emailId: string) =>
    apiFetch<{ success: boolean }>(`${BASE}/${accountId}/emails/${emailId}/read`, {
      method: 'PATCH',
    }),

  /** Delete/trash an email */
  deleteEmail: (accountId: string, emailId: string) =>
    apiFetch<void>(`${BASE}/${accountId}/emails/${emailId}`, {
      method: 'DELETE',
    }),

  // ─── Attachment Download ───

  /** Download an attachment from a synced email (fetches content on-demand from provider) */
  downloadAttachment: (accountId: string, emailId: string, attachmentId: string) =>
    apiFetch<AttachmentDownloadDto>(`${BASE}/${accountId}/emails/${emailId}/attachments/${attachmentId}`),
  // ─── Custom accounts (server-persisted) ───
  getCustomAll: () => apiFetch<CustomEmailAccountDto[]>(BASE_CUSTOM),
  getCustomById: (id: string) => apiFetch<CustomEmailAccountDto>(`${BASE_CUSTOM}/${id}`),
  saveCustom: (dto: any) => apiFetch<CustomEmailAccountDto>(`${BASE_CUSTOM}/save`, { method: 'POST', body: JSON.stringify(dto) }),
  updateCustom: (id: string, dto: any) => apiFetch<CustomEmailAccountDto>(`${BASE_CUSTOM}/${id}`, { method: 'PUT', body: JSON.stringify(dto) }),
  deleteCustom: (id: string) => apiFetch<void>(`${BASE_CUSTOM}/${id}`, { method: 'DELETE' }),

  // Direct server-side test/send/fetch (accepts config in body)
  customTest: (cfg: any) => apiFetch<any>(`${BASE_CUSTOM}/test`, { method: 'POST', body: JSON.stringify(cfg) }),
  customSend: (dto: any) => apiFetch<any>(`${BASE_CUSTOM}/send`, { method: 'POST', body: JSON.stringify(dto) }),
  customFetch: (dto: any) => apiFetch<any>(`${BASE_CUSTOM}/fetch`, { method: 'POST', body: JSON.stringify(dto) }),
  customSync: (id: string, maxResults = 50) => apiFetch<SyncResultDto>(`${BASE_CUSTOM}/${id}/sync?maxResults=${maxResults}`, { method: 'POST' }),
};

import { useState, useCallback, useEffect, useRef } from 'react';
import { getCurrentTenant } from '@/utils/tenant';
import {
  emailAccountsApi,
  type ConnectedEmailAccountDto,
  type BlocklistItemDto,
  type UpdateEmailSettingsDto,
  type UpdateCalendarSettingsDto,
  type SyncedEmailDto,
  type SyncResultDto,
  type SyncedCalendarEventDto,
  type CalendarSyncResultDto,
  type SendEmailDto,
  type SendEmailResultDto,
  type CreateExternalCalendarEventDto,
  type CreateExternalCalendarEventResultDto,
} from '@/services/api/emailAccountsApi';
import { customEmailService } from '../services/customEmailService';
import type {
  ConnectedAccount,
  EmailCalendarProvider,
  EmailVisibility,
  CalendarVisibility,
  ContactAutoCreationPolicy,
  BlocklistItem,
} from '../types';

// ─── Map backend DTO → frontend type ───

function mapAccount(dto: ConnectedEmailAccountDto): ConnectedAccount {
  return {
    id: dto.id,
    handle: dto.handle,
    provider: dto.provider as EmailCalendarProvider,
    syncStatus: dto.syncStatus as ConnectedAccount['syncStatus'],
    lastSyncedAt: dto.lastSyncedAt ? new Date(dto.lastSyncedAt) : undefined,
    authFailedAt: dto.authFailedAt ? new Date(dto.authFailedAt) : null,
    createdAt: new Date(dto.createdAt),
    emailSettings: {
      visibility: dto.emailVisibility as EmailVisibility,
      contactAutoCreationPolicy: dto.contactAutoCreationPolicy as ContactAutoCreationPolicy,
      excludeGroupEmails: dto.excludeGroupEmails,
      excludeNonProfessionalEmails: dto.excludeNonProfessionalEmails,
      isSyncEnabled: dto.isEmailSyncEnabled,
    },
    calendarSettings: {
      visibility: dto.calendarVisibility as CalendarVisibility,
      isContactAutoCreationEnabled: dto.isCalendarContactAutoCreationEnabled,
      isSyncEnabled: dto.isCalendarSyncEnabled,
    },
  };
}

function mapCustomAccount(dto: any): ConnectedAccount {
  return {
    id: `custom-${dto.id}`,
    handle: dto.email,
    provider: 'custom',
    syncStatus: 'active',
    lastSyncedAt: dto.lastSyncedAt ? new Date(dto.lastSyncedAt) : undefined,
    authFailedAt: null,
    createdAt: new Date(dto.createdAt),
    emailSettings: {
      visibility: 'share_everything',
      contactAutoCreationPolicy: 'sent_and_received',
      excludeGroupEmails: false,
      excludeNonProfessionalEmails: false,
      isSyncEnabled: true,
    },
    calendarSettings: {
      visibility: 'share_everything',
      isContactAutoCreationEnabled: true,
      isSyncEnabled: true,
    },
  };
}

function mapBlocklistItem(dto: BlocklistItemDto): BlocklistItem {
  return {
    id: dto.id,
    handle: dto.handle,
    createdAt: new Date(dto.createdAt),
  };
}

// ─── OAuth popup helper ───

function openOAuthPopup(authUrl: string, clientId: string, redirectUri: string, scopes: string[], provider: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const scopeStr = scopes.join(' ');
    const tenant = getCurrentTenant() || '_default';
    const state = `email:${tenant}:${crypto.randomUUID()}`;

    let url: string;
    if (provider === 'google') {
      url = `${authUrl}?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scopeStr)}&access_type=offline&prompt=consent&state=${state}`;
    } else {
      url = `${authUrl}?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scopeStr)}&response_mode=query&state=${state}`;
    }

    const width = 500;
    const height = 600;
    const left = window.screenX + (window.innerWidth - width) / 2;
    const top = window.screenY + (window.innerHeight - height) / 2;

    const popup = window.open(url, 'oauth', `width=${width},height=${height},left=${left},top=${top}`);

    if (!popup) {
      reject(new Error('Popup blocked. Please allow popups for this site.'));
      return;
    }

    let settled = false;

    // Listen for postMessage from the callback page (works cross-origin)
    const onMessage = (event: MessageEvent) => {
      // Accept messages from any origin since the callback may come from the backend domain
      if (event.data?.type !== 'oauth-callback') return;
      settled = true;
      window.removeEventListener('message', onMessage);
      popup.close();

      if (event.data.code) {
        resolve(event.data.code);
      } else {
        reject(new Error(event.data.error || 'No authorization code received'));
      }
    };
    window.addEventListener('message', onMessage);

    // Also poll for popup closed (user manually closed it)
    const interval = setInterval(() => {
      if (popup.closed && !settled) {
        clearInterval(interval);
        window.removeEventListener('message', onMessage);
        reject(new Error('OAuth window was closed'));
      }
    }, 500);

    // Timeout after 5 minutes
    setTimeout(() => {
      if (!settled) {
        clearInterval(interval);
        window.removeEventListener('message', onMessage);
        popup.close();
        reject(new Error('OAuth timed out'));
      }
    }, 300000);
  });
}

// ─── Main hook ───

export function useConnectedAccounts() {
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [blocklist, setBlocklist] = useState<BlocklistItem[]>([]);
  // Email sync state
  const [emails, setEmails] = useState<SyncedEmailDto[]>([]);
  const [emailsTotalCount, setEmailsTotalCount] = useState(0);
  const [emailsLoading, setEmailsLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<SyncResultDto | null>(null);
  const syncIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Calendar sync state
  const [calendarEvents, setCalendarEvents] = useState<SyncedCalendarEventDto[]>([]);
  const [calendarEventsTotalCount, setCalendarEventsTotalCount] = useState(0);
  const [calendarEventsLoading, setCalendarEventsLoading] = useState(false);
  const [calendarSyncing, setCalendarSyncing] = useState(false);
  const [lastCalendarSyncResult, setLastCalendarSyncResult] = useState<CalendarSyncResultDto | null>(null);
  const calendarSyncIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [sendingEmail, setSendingEmail] = useState(false);

  // Ref to always have current accounts in callbacks (avoids stale closure)
  const accountsRef = useRef<ConnectedAccount[]>([]);
  accountsRef.current = accounts;

  // Fetch accounts on mount
  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await emailAccountsApi.getAll();
      const { data: custom } = await emailAccountsApi.getCustomAll();
      const list: ConnectedAccount[] = [];
      if (data) list.push(...data.map(mapAccount));
      if (custom) list.push(...custom.map(mapCustomAccount));
      setAccounts(list);
    } catch (err) {
      console.error('Failed to fetch connected accounts:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts, accounts]);

  // Connect a new account via OAuth
  const connectAccount = useCallback(async (provider: EmailCalendarProvider) => {
    if (provider === 'custom') {
      // Custom accounts are handled separately via CustomEmailConfigDialog
      return undefined;
    }
    try {
      const { data: config } = await emailAccountsApi.getOAuthConfig(provider);
      if (!config) throw new Error('Failed to get OAuth config');

      // Use the redirectUri from the backend config — this is the URI registered
      // in Google/Microsoft OAuth console (e.g. https://api.flowentra.app/oauth/google/callback).
      // Using window.location.origin would cause redirect_uri_mismatch since the preview/tenant
      // domain is NOT registered in the OAuth provider console.
      const redirectUri = config.redirectUri;

      const code = await openOAuthPopup(
        config.authUrl,
        config.clientId,
        redirectUri,
        config.scopes,
        provider
      );

      const { data: account } = await emailAccountsApi.oauthCallback({
        provider,
        code,
        redirectUri,
      });

      if (account) {
        setAccounts(prev => {
          const exists = prev.find(a => a.id === account.id);
          if (exists) {
            return prev.map(a => a.id === account.id ? mapAccount(account) : a);
          }
          return [...prev, mapAccount(account)];
        });
        return mapAccount(account);
      }
    } catch (err) {
      console.error('OAuth connection failed:', err);
      throw err;
    }
  }, [accounts]);

  const disconnectAccount = useCallback(async (id: string) => {
    const { status } = await emailAccountsApi.disconnect(id);
    if (status === 204 || status === 200) {
      setAccounts(prev => prev.filter(a => a.id !== id));
    }
  }, [accounts]);

  const updateEmailSettings = useCallback(async (id: string, settings: Partial<ConnectedAccount['emailSettings']>) => {
    const dto: UpdateEmailSettingsDto = {
      emailVisibility: settings.visibility,
      contactAutoCreationPolicy: settings.contactAutoCreationPolicy,
      excludeGroupEmails: settings.excludeGroupEmails,
      excludeNonProfessionalEmails: settings.excludeNonProfessionalEmails,
      isEmailSyncEnabled: settings.isSyncEnabled,
    };
    const { data } = await emailAccountsApi.updateEmailSettings(id, dto);
    if (data) {
      setAccounts(prev => prev.map(a => a.id === id ? mapAccount(data) : a));
    }
  }, []);

  const updateCalendarSettings = useCallback(async (id: string, settings: Partial<ConnectedAccount['calendarSettings']>) => {
    const dto: UpdateCalendarSettingsDto = {
      calendarVisibility: settings.visibility,
      isCalendarContactAutoCreationEnabled: settings.isContactAutoCreationEnabled,
      isCalendarSyncEnabled: settings.isSyncEnabled,
    };
    const { data } = await emailAccountsApi.updateCalendarSettings(id, dto);
    if (data) {
      setAccounts(prev => prev.map(a => a.id === id ? mapAccount(data) : a));
    }
  }, []);

  const updateEmailVisibility = useCallback(async (id: string, visibility: EmailVisibility) => {
    await updateEmailSettings(id, { visibility });
  }, [updateEmailSettings]);

  const updateCalendarVisibility = useCallback(async (id: string, visibility: CalendarVisibility) => {
    await updateCalendarSettings(id, { visibility });
  }, [updateCalendarSettings]);

  const updateContactAutoCreation = useCallback(async (id: string, policy: ContactAutoCreationPolicy) => {
    await updateEmailSettings(id, { contactAutoCreationPolicy: policy });
  }, [updateEmailSettings]);

  // ─── Blocklist ───

  const fetchBlocklist = useCallback(async (accountId: string) => {
    const { data } = await emailAccountsApi.getBlocklist(accountId);
    if (data) {
      setBlocklist(data.map(mapBlocklistItem));
    }
    return data?.map(mapBlocklistItem) || [];
  }, []);

  const addBlocklistItem = useCallback(async (accountId: string, handle: string) => {
    const { data } = await emailAccountsApi.addBlocklistItem(accountId, handle);
    if (data) {
      const item = mapBlocklistItem(data);
      setBlocklist(prev => [item, ...prev]);
      return item;
    }
    return null;
  }, []);

  const removeBlocklistItem = useCallback(async (accountId: string, itemId: string) => {
    const { status } = await emailAccountsApi.removeBlocklistItem(accountId, itemId);
    if (status === 204 || status === 200) {
      setBlocklist(prev => prev.filter(b => b.id !== itemId));
    }
  }, []);

  // ─── Email Sync & Fetch ───

  const syncEmails = useCallback(async (accountId: string, maxResults = 50) => {
    setSyncing(true);
    try {
      if (accountId.startsWith('custom-')) {
        const customId = accountId.replace('custom-', '');
        const { data } = await emailAccountsApi.customSync(customId, maxResults);
        if (data) {
          setLastSyncResult(data);
          await fetchAccounts();
        }
        return data;
      }
      const { data } = await emailAccountsApi.syncEmails(accountId, maxResults);
      if (data) {
        setLastSyncResult(data);
        await fetchAccounts();
      }
      return data;
    } catch (err) {
      console.error('Email sync failed:', err);
      throw err;
    } finally {
      setSyncing(false);
    }
  }, [fetchAccounts]);

  const fetchSyncedEmails = useCallback(async (accountId: string, page = 1, pageSize = 25, search?: string) => {
    setEmailsLoading(true);
    try {
      if (accountId.startsWith('custom-')) {
        const customId = accountId.replace('custom-', '');
        // Get custom DTO to find connectedAccountId
        const { data: custom } = await emailAccountsApi.getCustomById(customId);
        if (!custom) return null;
        const connId = custom.connectedAccountId;
        if (!connId) return null;
        const { data } = await emailAccountsApi.getSyncedEmails(connId, page, pageSize, search);
        if (data) {
          setEmails(data.emails);
          setEmailsTotalCount(data.totalCount);
        }
        return data;
      }
      const { data } = await emailAccountsApi.getSyncedEmails(accountId, page, pageSize, search);
      if (data) {
        setEmails(data.emails);
        setEmailsTotalCount(data.totalCount);
      }
      return data;
    } catch (err) {
      console.error('Failed to fetch synced emails:', err);
    } finally {
      setEmailsLoading(false);
    }
  }, []);

  const startAutoSync = useCallback((accountId: string) => {
    if (syncIntervalRef.current) clearInterval(syncIntervalRef.current);
    syncIntervalRef.current = setInterval(() => {
      syncEmails(accountId).catch(() => {});
    }, 5 * 60 * 1000);
  }, [syncEmails]);

  const stopAutoSync = useCallback(() => {
    if (syncIntervalRef.current) {
      clearInterval(syncIntervalRef.current);
      syncIntervalRef.current = null;
    }
  }, []);

  // ─── Calendar Sync & Fetch ───

  const syncCalendar = useCallback(async (accountId: string, maxResults = 50) => {
    setCalendarSyncing(true);
    try {
      const { data } = await emailAccountsApi.syncCalendar(accountId, maxResults);
      if (data) {
        setLastCalendarSyncResult(data);
        await fetchAccounts();
      }
      return data;
    } catch (err) {
      console.error('Calendar sync failed:', err);
      throw err;
    } finally {
      setCalendarSyncing(false);
    }
  }, [fetchAccounts]);

  const fetchCalendarEvents = useCallback(async (accountId: string, page = 1, pageSize = 25, search?: string) => {
    setCalendarEventsLoading(true);
    try {
      const { data } = await emailAccountsApi.getCalendarEvents(accountId, page, pageSize, search);
      if (data) {
        setCalendarEvents(data.events);
        setCalendarEventsTotalCount(data.totalCount);
      }
      return data;
    } catch (err) {
      console.error('Failed to fetch calendar events:', err);
    } finally {
      setCalendarEventsLoading(false);
    }
  }, []);

  const startCalendarAutoSync = useCallback((accountId: string) => {
    if (calendarSyncIntervalRef.current) clearInterval(calendarSyncIntervalRef.current);
    calendarSyncIntervalRef.current = setInterval(() => {
      syncCalendar(accountId).catch(() => {});
    }, 5 * 60 * 1000);
  }, [syncCalendar]);

  const stopCalendarAutoSync = useCallback(() => {
    if (calendarSyncIntervalRef.current) {
      clearInterval(calendarSyncIntervalRef.current);
      calendarSyncIntervalRef.current = null;
    }
  }, []);

  // ─── Send Email ───

  const sendEmail = useCallback(async (accountId: string, dto: SendEmailDto): Promise<SendEmailResultDto> => {
    setSendingEmail(true);
    try {
      if (accountId.startsWith('custom-')) {
          // Use accountsRef to avoid stale closure (empty dependency array)
          const currentAccounts = accountsRef.current;
          
          // Try local configs first (when user entered SMTP details in the client)
          const matchedAccount = currentAccounts.find(x => x.id === accountId);
          const local = customEmailService.getAll().find(a => a.handle === matchedAccount?.handle);
          if (local?.customConfig) {
            const cfg = local.customConfig;
            const payload = { config: { email: cfg.email, password: cfg.password, displayName: cfg.displayName, smtpServer: cfg.smtpServer, smtpPort: cfg.smtpPort, smtpSecurity: cfg.smtpSecurity }, to: dto.to, cc: dto.cc || [], bcc: dto.bcc || [], subject: dto.subject, body: dto.body, bodyHtml: dto.bodyHtml, attachments: (dto as any).attachments };
            const { data } = await emailAccountsApi.customSend(payload);
            if (data) return data;
            return { success: false, error: 'No response from server' };
          }

          // No local config — try server-side persisted custom account
          try {
            const customId = accountId.replace('custom-', '');
            const { data: customDto } = await emailAccountsApi.getCustomById(customId);
            if (customDto?.connectedAccountId) {
              // Try the connected account send path first
              try {
                const { data } = await emailAccountsApi.sendEmail(customDto.connectedAccountId, dto);
                if (data?.success) return data;
              } catch (sendErr) {
                console.warn('Connected account send failed, trying direct custom send:', sendErr);
              }
              // Fallback: try direct custom/send endpoint via the custom sync endpoint
              // The server-side send may fail due to userId mismatch — use customSync to trigger send
              try {
                const { data: syncResult } = await emailAccountsApi.customSync(customId);
                // If sync worked, the account is valid — retry send
                const { data: retryData } = await emailAccountsApi.sendEmail(customDto.connectedAccountId, dto);
                if (retryData?.success) return retryData;
              } catch { /* ignore sync fallback */ }
              return { success: false, error: 'Server could not send via this custom account. Please re-add the account or check SMTP settings.' };
            }
            return { success: false, error: 'No local config or server-side SMTP configuration found for custom account' };
          } catch (err) {
            console.error('Failed to send via persisted custom account:', err);
            return { success: false, error: String(err) };
          }
        }
      const { data } = await emailAccountsApi.sendEmail(accountId, dto);
      if (data) return data;
      return { success: false, error: 'No response from server' };
    } catch (err) {
      console.error('Failed to send email:', err);
      return { success: false, error: String(err) };
    } finally {
      setSendingEmail(false);
    }
  }, []);

  // ─── Create Calendar Event on External Provider ───

  const createCalendarEvent = useCallback(async (
    accountId: string,
    dto: CreateExternalCalendarEventDto
  ): Promise<CreateExternalCalendarEventResultDto> => {
    try {
      const { data } = await emailAccountsApi.createCalendarEvent(accountId, dto);
      if (data) return data;
      return { success: false, error: 'No response from server' };
    } catch (err) {
      console.error('Failed to create calendar event:', err);
      return { success: false, error: String(err) };
    }
  }, []);

  // ─── Star / Read / Delete Email ───

  const toggleStarEmail = useCallback(async (accountId: string, emailId: string) => {
    try {
      const { data } = await emailAccountsApi.toggleStarEmail(accountId, emailId);
      if (data?.success) {
        setEmails(prev => prev.map(e =>
          e.id === emailId ? { ...e, isStarred: !e.isStarred } : e
        ));
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to toggle star:', err);
      return false;
    }
  }, []);

  const toggleReadEmail = useCallback(async (accountId: string, emailId: string) => {
    try {
      const { data } = await emailAccountsApi.toggleReadEmail(accountId, emailId);
      if (data?.success) {
        setEmails(prev => prev.map(e =>
          e.id === emailId ? { ...e, isRead: !e.isRead } : e
        ));
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to toggle read:', err);
      return false;
    }
  }, []);

  const deleteEmail = useCallback(async (accountId: string, emailId: string) => {
    try {
      const { status } = await emailAccountsApi.deleteEmail(accountId, emailId);
      if (status === 204 || status === 200) {
        setEmails(prev => prev.filter(e => e.id !== emailId));
        setEmailsTotalCount(prev => prev - 1);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to delete email:', err);
      return false;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAutoSync();
      stopCalendarAutoSync();
    };
  }, [stopAutoSync, stopCalendarAutoSync]);

  return {
    accounts,
    loading,
    connectAccount,
    disconnectAccount,
    updateEmailSettings,
    updateCalendarSettings,
    updateEmailVisibility,
    updateCalendarVisibility,
    updateContactAutoCreation,
    blocklist,
    fetchBlocklist,
    addBlocklistItem,
    removeBlocklistItem,
    // Email sync
    emails,
    emailsTotalCount,
    emailsLoading,
    syncing,
    lastSyncResult,
    syncEmails,
    fetchSyncedEmails,
    startAutoSync,
    stopAutoSync,
    // Star / Read / Delete
    toggleStarEmail,
    toggleReadEmail,
    deleteEmail,
    // Calendar sync
    calendarEvents,
    calendarEventsTotalCount,
    calendarEventsLoading,
    calendarSyncing,
    lastCalendarSyncResult,
    syncCalendar,
    fetchCalendarEvents,
    startCalendarAutoSync,
    stopCalendarAutoSync,
    // Send email
    sendEmail,
    sendingEmail,
    // Create calendar event on provider
    createCalendarEvent,
  };
}

/**
 * Service for managing custom SMTP/IMAP email accounts.
 * Stores account configurations locally and communicates with edge functions for
 * sending/fetching emails.
 */

import type { CustomEmailConfig, ConnectedAccount, SyncStatus } from '../types';
import { DEFAULT_EMAIL_SETTINGS, DEFAULT_CALENDAR_SETTINGS } from '../types';
import { buildApiUrl } from '@/config/api';
import { getAuthHeaders , getMutationHeaders, getMutationHeadersNoContentType} from '@/utils/apiHeaders';

const STORAGE_KEY = 'custom-email-accounts';

// ─── Local Storage Helpers ───

function loadCustomAccounts(): ConnectedAccount[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return parsed.map((a: any) => ({
      ...a,
      lastSyncedAt: a.lastSyncedAt ? new Date(a.lastSyncedAt) : undefined,
      authFailedAt: a.authFailedAt ? new Date(a.authFailedAt) : null,
      createdAt: new Date(a.createdAt),
    }));
  } catch {
    return [];
  }
}

function saveCustomAccounts(accounts: ConnectedAccount[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
}

// ─── Public API ───

export const customEmailService = {
  /** Get all custom email accounts */
  getAll(): ConnectedAccount[] {
    return loadCustomAccounts();
  },

  /** Add a new custom email account */
  async addAccount(config: CustomEmailConfig): Promise<ConnectedAccount> {
    // Test the connection first via edge function
    const testResult = await customEmailService.testConnection(config);
    if (!testResult.success) {
      throw new Error(testResult.error || 'Connection test failed');
    }
    // Persist server-side
    try {
      const payload = { config, displayName: config.displayName };
      const res = await fetch(buildApiUrl('/api/email-accounts/custom/save'), {
        method: 'POST',
        headers: getMutationHeaders(),
        body: JSON.stringify(payload),
      });
      const text = await res.text();
      const data = text ? JSON.parse(text) : null;
      if (!res.ok || !data) throw new Error(data?.error || data?.message || 'Failed to save account');

      // Map server DTO to ConnectedAccount
      const server = data as any;
      const newAccount: ConnectedAccount = {
        id: `custom-${server.id}`,
        handle: server.email,
        provider: 'custom',
        syncStatus: 'active',
        lastSyncedAt: server.lastSyncedAt ? new Date(server.lastSyncedAt) : undefined,
        authFailedAt: null,
        createdAt: new Date(server.createdAt),
        emailSettings: { ...DEFAULT_EMAIL_SETTINGS },
        calendarSettings: { ...DEFAULT_CALENDAR_SETTINGS },
        customConfig: config,
      };

      const accounts = loadCustomAccounts();
      accounts.push(newAccount);
      saveCustomAccounts(accounts);
      return newAccount;
    } catch (err: any) {
      throw new Error(err.message || 'Failed to save custom account');
    }
  },

  /** Remove a custom email account */
  removeAccount(id: string): boolean {
    const accounts = loadCustomAccounts();
    const filtered = accounts.filter(a => a.id !== id);
    if (filtered.length === accounts.length) return false;
    saveCustomAccounts(filtered);
    return true;
  },

  /** Update sync status */
  updateSyncStatus(id: string, status: SyncStatus) {
    const accounts = loadCustomAccounts();
    const account = accounts.find(a => a.id === id);
    if (account) {
      account.syncStatus = status;
      if (status === 'active') {
        account.lastSyncedAt = new Date();
      }
      saveCustomAccounts(accounts);
    }
  },

  /** Test SMTP/IMAP connection via edge function */
  async testConnection(config: CustomEmailConfig): Promise<{ success: boolean; error?: string }> {
    try {
      const payload = {
        email: config.email,
        password: config.password,
        imapServer: config.imapServer,
        imapPort: config.imapPort,
        imapSecurity: config.imapSecurity,
        pop3Server: config.incomingProtocol === 'pop3' ? config.imapServer : undefined,
        pop3Port: config.pop3Port,
        pop3Security: config.pop3Security,
        smtpServer: config.smtpServer,
        smtpPort: config.smtpPort,
        smtpSecurity: config.smtpSecurity,
      };

      const res = await fetch(buildApiUrl('/api/email-accounts/custom/test'), {
        method: 'POST',
        headers: getMutationHeaders(),
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      const data = text ? JSON.parse(text) : { success: res.ok };
      if (!res.ok) return { success: false, error: data?.error || data?.message || 'Connection test failed' };
      return data;
    } catch (err: any) {
      return { success: false, error: err.message || 'Connection test failed' };
    }
  },

  /** Send email via SMTP through edge function */
  async sendEmail(
    config: CustomEmailConfig,
    to: string[],
    subject: string,
    body: string,
    bodyHtml?: string,
    cc?: string[],
    bcc?: string[]
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const payload = {
        config: {
          email: config.email,
          password: config.password,
          displayName: config.displayName,
          smtpServer: config.smtpServer,
          smtpPort: config.smtpPort,
          smtpSecurity: config.smtpSecurity,
        },
        to,
        cc,
        bcc,
        subject,
        body,
        bodyHtml,
      };

      const res = await fetch(buildApiUrl('/api/email-accounts/custom/send'), {
        method: 'POST',
        headers: getMutationHeaders(),
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      const data = text ? JSON.parse(text) : { success: res.ok };
      if (!res.ok) return { success: false, error: data?.error || data?.message || 'Failed to send email' };
      return data;
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to send email' };
    }
  },

  /** Fetch emails via IMAP through edge function */
  async fetchEmails(
    config: CustomEmailConfig,
    folder = 'INBOX',
    limit = 50
  ): Promise<{ success: boolean; emails?: any[]; error?: string }> {
    try {
      const payload = {
        config: {
          email: config.email,
          password: config.password,
          imapServer: config.imapServer,
          imapPort: config.imapPort,
          imapSecurity: config.imapSecurity,
          pop3Server: config.incomingProtocol === 'pop3' ? config.imapServer : undefined,
          pop3Port: config.pop3Port,
          pop3Security: config.pop3Security,
        },
        folder,
        limit,
      };

      const res = await fetch(buildApiUrl('/api/email-accounts/custom/fetch'), {
        method: 'POST',
        headers: getMutationHeaders(),
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      const data = text ? JSON.parse(text) : { success: res.ok };
      if (!res.ok) return { success: false, error: data?.error || data?.message || 'Failed to fetch emails' };
      return data;
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to fetch emails' };
    }
  },
};

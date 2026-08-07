// Email & Calendar Integration Types (inspired by Twenty's account integration patterns)

export type EmailCalendarProvider = 'google' | 'microsoft' | 'custom';

export type SyncStatus = 'not_synced' | 'syncing' | 'active' | 'failed';

export type EmailVisibility = 'share_everything' | 'subject' | 'metadata';

export type CalendarVisibility = 'share_everything' | 'metadata';

export type ContactAutoCreationPolicy = 'sent_and_received' | 'sent' | 'none';

export type SmtpSecurity = 'ssl' | 'tls' | 'none';
export type ImapSecurity = 'ssl' | 'tls' | 'none';

export type IncomingProtocol = 'imap' | 'pop3';

export interface CustomEmailConfig {
  email: string;
  password: string;
  displayName?: string;
  // IMAP (incoming)
  imapServer: string;
  imapPort: number;
  imapSecurity: ImapSecurity;
  // Incoming protocol: 'imap' or 'pop3'
  incomingProtocol?: IncomingProtocol;
  // POP3 (optional) — reused when incomingProtocol === 'pop3'
  pop3Port?: number;
  pop3Security?: ImapSecurity;
  // SMTP (outgoing)
  smtpServer: string;
  smtpPort: number;
  smtpSecurity: SmtpSecurity;
}

export interface ConnectedAccount {
  id: string;
  handle: string; // email address
  provider: EmailCalendarProvider;
  syncStatus: SyncStatus;
  lastSyncedAt?: Date;
  authFailedAt?: Date | null;
  createdAt: Date;
  emailSettings: EmailChannelSettings;
  calendarSettings: CalendarChannelSettings;
  customConfig?: CustomEmailConfig;
}

export interface EmailChannelSettings {
  visibility: EmailVisibility;
  contactAutoCreationPolicy: ContactAutoCreationPolicy;
  excludeGroupEmails: boolean;
  excludeNonProfessionalEmails: boolean;
  isSyncEnabled: boolean;
}

export interface CalendarChannelSettings {
  visibility: CalendarVisibility;
  isContactAutoCreationEnabled: boolean;
  isSyncEnabled: boolean;
}

export interface BlocklistItem {
  id: string;
  handle: string; // email or @domain
  createdAt: Date;
}

// Default settings for new accounts
export const DEFAULT_EMAIL_SETTINGS: EmailChannelSettings = {
  visibility: 'share_everything',
  contactAutoCreationPolicy: 'sent_and_received',
  excludeGroupEmails: false,
  excludeNonProfessionalEmails: false,
  isSyncEnabled: true,
};

export const DEFAULT_CALENDAR_SETTINGS: CalendarChannelSettings = {
  visibility: 'share_everything',
  isContactAutoCreationEnabled: true,
  isSyncEnabled: true,
};

// Common SMTP/IMAP presets for known providers
export const EMAIL_PROVIDER_PRESETS: Record<string, Partial<CustomEmailConfig>> = {
  ovh: {
    imapServer: 'imap.mail.ovh.net',
    imapPort: 993,
    imapSecurity: 'ssl',
    smtpServer: 'smtp.mail.ovh.net',
    smtpPort: 465,
    smtpSecurity: 'ssl',
  },
  ionos: {
    imapServer: 'imap.ionos.com',
    imapPort: 993,
    imapSecurity: 'ssl',
    smtpServer: 'smtp.ionos.com',
    smtpPort: 465,
    smtpSecurity: 'ssl',
  },
  'godaddy-workspace': {
    imapServer: 'imap.secureserver.net',
    imapPort: 993,
    imapSecurity: 'ssl',
    smtpServer: 'smtpout.secureserver.net',
    smtpPort: 465,
    smtpSecurity: 'ssl',
  },
  zoho: {
    imapServer: 'imap.zoho.com',
    imapPort: 993,
    imapSecurity: 'ssl',
    smtpServer: 'smtp.zoho.com',
    smtpPort: 465,
    smtpSecurity: 'ssl',
  },
  yahoo: {
    imapServer: 'imap.mail.yahoo.com',
    imapPort: 993,
    imapSecurity: 'ssl',
    smtpServer: 'smtp.mail.yahoo.com',
    smtpPort: 465,
    smtpSecurity: 'ssl',
  },
  cpanel: {
    imapServer: '',
    imapPort: 993,
    imapSecurity: 'ssl',
    smtpServer: '',
    smtpPort: 465,
    smtpSecurity: 'ssl',
  },
  custom: {
    imapServer: '',
    imapPort: 993,
    imapSecurity: 'ssl',
    smtpServer: '',
    smtpPort: 465,
    smtpSecurity: 'ssl',
  },
};
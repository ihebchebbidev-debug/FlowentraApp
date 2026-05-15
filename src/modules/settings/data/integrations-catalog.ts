/**
 * Integration catalog — extensible registry of all available integrations.
 * Each entry is metadata only; connection logic lives elsewhere.
 * Names and descriptions use i18n keys under settings:integrations.items.<id>
 */

export type IntegrationStatus = 'available' | 'connected' | 'coming_soon';

export interface IntegrationItem {
  id: string;
  /** i18n key suffix — actual display text resolved via t(`integrations.items.${id}.name`) */
  name: string;
  description: string;
  category: IntegrationCategory;
  status: IntegrationStatus;
  /** URL or import path for icon — we use simple emoji/letter fallback in the UI */
  iconUrl?: string;
  /** If true, opens a custom connect flow (OAuth, SMTP dialog, etc.) */
  hasConnectFlow?: boolean;
  /** Tags for search */
  tags?: string[];
}

export type IntegrationCategory = 'email' | 'ai';

/** Category meta uses i18n keys resolved in the component */
export const CATEGORY_META: Record<IntegrationCategory, { labelKey: string; icon: string }> = {
  email: { labelKey: 'integrations.categories.email', icon: '📧' },
  ai: { labelKey: 'integrations.categories.ai', icon: '⚡' },
};

export const INTEGRATIONS_CATALOG: IntegrationItem[] = [
  { id: 'gmail', name: 'Gmail', description: '', category: 'email', status: 'available', hasConnectFlow: true, tags: ['google', 'email', 'oauth'] },
  { id: 'outlook', name: 'Outlook', description: '', category: 'email', status: 'available', hasConnectFlow: true, tags: ['microsoft', 'email', 'oauth'] },
  { id: 'custom-smtp', name: 'Custom Email (SMTP/IMAP)', description: '', category: 'email', status: 'available', hasConnectFlow: true, tags: ['smtp', 'imap', 'ovh', 'ionos', 'godaddy', 'zoho', 'yahoo', 'custom'] },
  { id: 'openrouter', name: 'OpenRouter', description: '', category: 'ai', status: 'available', hasConnectFlow: true, tags: ['ai', 'llm', 'openrouter', 'gpt', 'claude', 'gemini', 'llama'] },
];

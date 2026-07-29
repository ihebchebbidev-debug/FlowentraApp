import { getCurrentTenant, TENANT_HEADER } from '@/utils/tenant';
import { getTargetTenantHeaders } from '@/utils/targetTenant';

/**
 * Global PDF Settings API Service
 * 
 * This service manages PDF settings for all modules (offers, sales, dispatches, service-orders)
 * using a dedicated backend table. Settings are global and apply to all users.
 */

import { apiFetch } from './api/apiClient';
import { isDemoValue } from '@/shared/pdf/resolveCompany';

// Module types for PDF settings
export type PdfSettingsModule = 'offers' | 'sales' | 'dispatches' | 'serviceOrders';

// Local storage keys for fallback/cache
const LOCAL_STORAGE_KEYS: Record<PdfSettingsModule, string> = {
  offers: 'offer-pdf-settings',
  sales: 'pdf-settings',
  dispatches: 'dispatch-pdf-settings',
  serviceOrders: 'service-order-pdf-settings',
};

// API response structure
interface PdfSettingsApiResponse {
  success: boolean;
  message: string;
  data?: {
    id: number;
    module: string;
    settingsJson: any;
    updatedAt: string;
  };
}

interface PdfSettingsListResponse {
  success: boolean;
  message: string;
  data?: Array<{
    id: number;
    module: string;
    settingsJson: any;
    updatedAt: string;
  }>;
}


/**
 * Data hygiene: older saved settings still hold the demo company strings that
 * used to ship as defaults ("PEAK SOLUTIONS", "1234 Service Street", ...).
 * Strip those on load and leave `useOverride` off, so the report falls back to
 * the owning company's own Company Information. Anything the user genuinely
 * typed is preserved and flips the override on.
 */
export function normalizePdfCompanySettings<T>(defaults: T, stored: any): T {
  const merged: any = { ...(defaults as any), ...(stored ?? {}) };
  const defCompany = (defaults as any)?.company;
  if (!defCompany || typeof defCompany !== 'object') return merged as T;

  const storedCompany = (stored?.company && typeof stored.company === 'object') ? stored.company : {};
  const company: any = { ...defCompany, ...storedCompany };

  let hasRealOverride = false;
  Object.keys(company).forEach(key => {
    if (key === 'logo' || key === 'useOverride') return;
    const value = company[key];
    if (typeof value !== 'string') return;
    if (isDemoValue(value)) {
      company[key] = '';
    } else if (value.trim()) {
      hasRealOverride = true;
    }
  });

  company.useOverride = storedCompany.useOverride === true
    ? true
    : (storedCompany.useOverride === false ? false : hasRealOverride);

  merged.company = company;
  return merged as T;
}

class PdfSettingsApiService {
  private API_URL = import.meta.env.VITE_API_URL || import.meta.env.REACT_APP_API_URL || 'https://api.flowentra.app';
  private syncInProgress = false;
  private pendingSyncs: Map<PdfSettingsModule, any> = new Map();
  private cache: Map<PdfSettingsModule, any> = new Map();

  /**
   * Get auth headers
   */
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('access_token');
    const tenant = getCurrentTenant();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
    if (tenant) headers[TENANT_HEADER] = tenant;
    return headers;
  }

  /**
   * Get mutation headers (includes X-Target-Tenant for view-all mode)
   */
  private getMutationHeaders(): HeadersInit {
    return { ...this.getAuthHeaders() as Record<string, string>, ...getTargetTenantHeaders() };
  }

  /**
   * Load settings for a specific module
   * Priority: Cache > Backend > LocalStorage > Defaults
   */
  async loadSettings<T>(module: PdfSettingsModule, defaultSettings: T): Promise<T> {
    // Check cache first
    const cached = this.cache.get(module);
    if (cached) {
      return normalizePdfCompanySettings(defaultSettings, cached);
    }

    try {
      // Try to load from backend
      const { data, status } = await apiFetch<PdfSettingsApiResponse>(
        `/api/PdfSettings/${module}`
      );

      if (status === 200 && data?.success && data.data?.settingsJson) {
        const settings = typeof data.data.settingsJson === 'string' 
          ? JSON.parse(data.data.settingsJson) 
          : data.data.settingsJson;
        
        // Update cache and localStorage
        this.cache.set(module, settings);
        this.saveToLocalStorage(module, settings);
        console.log(`[PdfSettingsApi] Loaded ${module} settings from backend`);
        return normalizePdfCompanySettings(defaultSettings, settings);
      }
    } catch (error) {
      console.warn(`[PdfSettingsApi] Backend load failed for ${module}, using local:`, error);
    }

    // Fallback to localStorage
    return this.loadFromLocalStorage(module, defaultSettings);
  }

  /**
   * Save settings for a specific module (global, applies to all users)
   */
  async saveSettings<T extends object>(module: PdfSettingsModule, settings: T): Promise<void> {
    // Update cache immediately
    this.cache.set(module, settings);
    
    // Save to localStorage for redundancy
    this.saveToLocalStorage(module, settings);
    console.log(`[PdfSettingsApi] Saved ${module} settings to cache/localStorage`);

    // Queue the sync to backend
    this.pendingSyncs.set(module, settings);
    this.debouncedSync();
  }

  /**
   * Debounced sync to backend
   */
  private syncTimeout: number | null = null;
  
  private debouncedSync() {
    if (this.syncTimeout) {
      clearTimeout(this.syncTimeout);
    }
    
    this.syncTimeout = window.setTimeout(() => {
      this.syncToBackend();
    }, 1000);
  }

  /**
   * Sync all pending settings to backend
   */
  private async syncToBackend(): Promise<void> {
    if (this.syncInProgress || this.pendingSyncs.size === 0) {
      return;
    }

    this.syncInProgress = true;

    try {
      // Process all pending syncs
      for (const [module, settings] of this.pendingSyncs) {
        try {
          const response = await fetch(`${this.API_URL}/api/PdfSettings/${module}`, {
            method: 'PUT',
            headers: this.getMutationHeaders(),
            body: JSON.stringify({ settingsJson: settings }),
          });

          if (response.ok) {
            console.log(`[PdfSettingsApi] ${module} settings synced to backend`);
          } else {
            console.warn(`[PdfSettingsApi] Failed to sync ${module}:`, response.status);
          }
        } catch (error) {
          console.error(`[PdfSettingsApi] Error syncing ${module}:`, error);
        }
      }

      this.pendingSyncs.clear();
    } finally {
      this.syncInProgress = false;
      
      if (this.pendingSyncs.size > 0) {
        this.debouncedSync();
      }
    }
  }

  /**
   * Reset settings for a module to defaults
   */
  async resetSettings<T>(module: PdfSettingsModule, defaultSettings: T): Promise<T> {
    // Clear cache
    this.cache.delete(module);
    
    // Remove from localStorage
    localStorage.removeItem(LOCAL_STORAGE_KEYS[module]);
    
    // Save empty/default to backend
    try {
      await fetch(`${this.API_URL}/api/PdfSettings/${module}`, {
        method: 'PUT',
        headers: this.getMutationHeaders(),
        body: JSON.stringify({ settingsJson: {} }),
      });
    } catch (error) {
      console.warn(`[PdfSettingsApi] Failed to reset ${module} on backend:`, error);
    }

    return defaultSettings;
  }

  /**
   * Export settings to a JSON file
   */
  exportSettings<T extends object>(module: PdfSettingsModule, settings: T): void {
    try {
      const dataStr = JSON.stringify(settings, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `${module}-pdf-settings-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('[PdfSettingsApi] Failed to export settings:', error);
      throw new Error('Failed to export settings');
    }
  }

  /**
   * Import settings from a JSON file
   */
  async importSettings<T>(file: File, defaultSettings: T): Promise<T> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          const imported = JSON.parse(content);
          
          if (!imported || typeof imported !== 'object') {
            throw new Error('Invalid settings file format');
          }
          
          const merged = { ...defaultSettings, ...imported };
          resolve(merged);
        } catch (error) {
          reject(new Error('Invalid settings file format'));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read settings file'));
      };
      
      reader.readAsText(file);
    });
  }

  /**
   * Create a file input element for importing
   */
  createFileInput(): HTMLInputElement {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.style.display = 'none';
    return input;
  }

  /**
   * Load from localStorage (fallback)
   */
  private loadFromLocalStorage<T>(module: PdfSettingsModule, defaultSettings: T): T {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEYS[module]);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.cache.set(module, parsed);
        return normalizePdfCompanySettings(defaultSettings, parsed);
      }
    } catch (error) {
      console.warn(`[PdfSettingsApi] Failed to load ${module} from localStorage:`, error);
    }
    return defaultSettings;
  }

  /**
   * Save to localStorage
   */
  private saveToLocalStorage<T>(module: PdfSettingsModule, settings: T): void {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEYS[module], JSON.stringify(settings));
    } catch (error) {
      console.error(`[PdfSettingsApi] Failed to save ${module} to localStorage:`, error);
    }
  }

  /**
   * Load all settings from backend
   */
  async loadAllFromBackend(): Promise<Record<PdfSettingsModule, any> | null> {
    try {
      const { data, status } = await apiFetch<PdfSettingsListResponse>('/api/PdfSettings');

      if (status === 200 && data?.success && data.data) {
        const result: Record<string, any> = {};
        
        for (const item of data.data) {
          const module = item.module as PdfSettingsModule;
          const settings = typeof item.settingsJson === 'string' 
            ? JSON.parse(item.settingsJson) 
            : item.settingsJson;
          
          result[module] = settings;
          this.cache.set(module, settings);
          this.saveToLocalStorage(module, settings);
        }
        
        return result as Record<PdfSettingsModule, any>;
      }
    } catch (error) {
      console.error('[PdfSettingsApi] Error loading all settings:', error);
    }

    return null;
  }

  /**
   * Clear cache (useful on logout or refresh)
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Clear all localStorage PDF settings (forces fresh defaults)
   */
  clearAllLocalStorage(): void {
    Object.values(LOCAL_STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    this.cache.clear();
    console.log('[PdfSettingsApi] Cleared all localStorage PDF settings');
  }
}

export const pdfSettingsApi = new PdfSettingsApiService();

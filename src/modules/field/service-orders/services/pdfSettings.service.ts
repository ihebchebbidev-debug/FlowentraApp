/**
 * Service Orders PDF Settings Service
 * 
 * This service provides PDF settings management with backend sync.
 * Settings are stored per-user in the backend for cross-device consistency.
 */

import { PdfSettings, defaultSettings } from '../utils/pdfSettings.utils';
import { pdfSettingsApi } from '@/services/pdfSettingsApi';

export class PdfSettingsService {
  private static readonly MODULE = 'serviceOrders' as const;
  private static readonly STORAGE_KEY = 'service-order-pdf-settings';
  private static settingsCache: PdfSettings | null = null;
  private static loadPromise: Promise<PdfSettings> | null = null;

  /**
   * Load settings from backend (with localStorage fallback)
   * Uses caching to avoid repeated API calls
   */
  static async loadSettingsAsync(): Promise<PdfSettings> {
    // Return cached if available
    if (this.settingsCache) {
      return this.settingsCache;
    }

    // If already loading, return the existing promise
    if (this.loadPromise) {
      return this.loadPromise;
    }

    this.loadPromise = (async () => {
      try {
        const settings = await pdfSettingsApi.loadSettings(this.MODULE, defaultSettings);
        this.settingsCache = settings;
        return settings;
      } finally {
        this.loadPromise = null;
      }
    })();

    return this.loadPromise;
  }

  /**
   * Synchronous load from localStorage (for immediate UI rendering)
   * Should be followed by async load for backend sync
   */
  static loadSettings(): PdfSettings {
    // Return cache if available
    if (this.settingsCache) {
      return this.settingsCache;
    }

    // Try localStorage for immediate display
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const merged = { ...defaultSettings, ...parsed };
        this.settingsCache = merged;
        return merged;
      }
    } catch (error) {
      console.warn('[ServiceOrdersPdfSettings] Failed to load from localStorage:', error);
    }

    // Start background load from backend
    this.loadSettingsAsync().catch(() => {});

    return defaultSettings;
  }

  /**
   * Save settings to backend and localStorage
   */
  static async saveSettingsAsync(settings: PdfSettings): Promise<void> {
    this.settingsCache = settings;
    await pdfSettingsApi.saveSettings(this.MODULE, settings);
  }

  /**
   * Synchronous save (updates cache and localStorage immediately, syncs to backend in background)
   */
  static saveSettings(settings: PdfSettings): void {
    this.settingsCache = settings;
    // Fire and forget - the API service handles debouncing
    pdfSettingsApi.saveSettings(this.MODULE, settings).catch(error => {
      console.error('[ServiceOrdersPdfSettings] Background save failed:', error);
    });
  }

  /**
   * Reset settings to defaults
   */
  static async resetSettingsAsync(): Promise<PdfSettings> {
    this.settingsCache = null;
    return await pdfSettingsApi.resetSettings(this.MODULE, defaultSettings);
  }

  /**
   * Synchronous reset (for backwards compatibility)
   */
  static resetSettings(): PdfSettings {
    this.settingsCache = null;
    localStorage.removeItem(this.STORAGE_KEY);
    pdfSettingsApi.resetSettings(this.MODULE, defaultSettings).catch(() => {});
    return defaultSettings;
  }

  /**
   * Export settings to JSON file
   */
  static exportSettings(settings: PdfSettings): void {
    pdfSettingsApi.exportSettings(this.MODULE, settings);
  }

  /**
   * Import settings from JSON file
   */
  static async importSettings(file: File): Promise<PdfSettings> {
    const imported = await pdfSettingsApi.importSettings(file, defaultSettings);
    this.settingsCache = imported;
    // Save to backend
    await pdfSettingsApi.saveSettings(this.MODULE, imported);
    return imported;
  }

  /**
   * Create file input for import dialog
   */
  static createFileInput(): HTMLInputElement {
    return pdfSettingsApi.createFileInput();
  }

  /**
   * Clear the settings cache (useful when user logs out)
   */
  static clearCache(): void {
    this.settingsCache = null;
    this.loadPromise = null;
  }

  /**
   * Force refresh from backend
   */
  static async refreshFromBackend(): Promise<PdfSettings> {
    this.settingsCache = null;
    this.loadPromise = null;
    return await this.loadSettingsAsync();
  }
}

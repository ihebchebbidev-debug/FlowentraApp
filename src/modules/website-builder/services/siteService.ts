/**
 * Site Service — CRUD operations for websites.
 * 
 * Delegates to the active IStorageProvider. When switching backends,
 * only the storage provider needs to change — this layer stays the same.
 */
import { WebsiteSite, SitePage, SiteTheme, BuilderComponent } from '../types';
import { getStorageProvider } from './storageProvider';

// ══════════════════════════════════════════════════════════════════
// Types
// ══════════════════════════════════════════════════════════════════

export interface CreateSiteOptions {
  name: string;
  theme?: SiteTheme;
  pages?: SitePage[];
  templateId?: string;
}

export interface UpdateSiteOptions {
  name?: string;
  theme?: SiteTheme;
  published?: boolean;
}

export interface ServiceResult<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

// ══════════════════════════════════════════════════════════════════
// Site CRUD
// ══════════════════════════════════════════════════════════════════

export async function fetchSites(): Promise<ServiceResult<WebsiteSite[]>> {
  return getStorageProvider().listSites();
}

export async function fetchSite(siteId: string): Promise<ServiceResult<WebsiteSite>> {
  return getStorageProvider().getSite(siteId);
}

export async function createSite(options: CreateSiteOptions): Promise<ServiceResult<WebsiteSite>> {
  return getStorageProvider().createSite({
    name: options.name,
    theme: options.theme,
    pages: options.pages,
  });
}

export async function updateSite(site: WebsiteSite): Promise<ServiceResult<WebsiteSite>> {
  return getStorageProvider().updateSite({ id: site.id, ...site });
}

export async function deleteSite(siteId: string): Promise<ServiceResult<void>> {
  return getStorageProvider().deleteSite(siteId);
}

export async function duplicateSite(siteId: string): Promise<ServiceResult<WebsiteSite>> {
  return getStorageProvider().duplicateSite(siteId);
}

// ══════════════════════════════════════════════════════════════════
// Page Operations
// ══════════════════════════════════════════════════════════════════

export async function addPage(siteId: string, title: string): Promise<ServiceResult<SitePage>> {
  return getStorageProvider().addPage(siteId, {
    title,
    slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
    components: [],
    seo: { title },
    order: 0,
  });
}

export async function updatePageComponents(
  siteId: string,
  pageId: string,
  components: BuilderComponent[],
  language?: string
): Promise<ServiceResult<void>> {
  return getStorageProvider().updatePageComponents(siteId, pageId, components, language);
}

// ══════════════════════════════════════════════════════════════════
// Theme Operations
// ══════════════════════════════════════════════════════════════════

export async function updateTheme(siteId: string, theme: SiteTheme): Promise<ServiceResult<void>> {
  const result = await getStorageProvider().updateSite({ id: siteId, theme });
  return { data: null, error: result.error, success: result.success };
}

// ══════════════════════════════════════════════════════════════════
// Publishing
// ══════════════════════════════════════════════════════════════════

export async function publishSite(siteId: string): Promise<ServiceResult<{ url: string }>> {
  const result = await getStorageProvider().publishSite(siteId);
  if (result.success && result.data) {
    return { data: { url: result.data.url }, error: null, success: true };
  }
  return { data: null, error: result.error, success: false };
}

export async function unpublishSite(siteId: string): Promise<ServiceResult<void>> {
  return getStorageProvider().unpublishSite(siteId);
}

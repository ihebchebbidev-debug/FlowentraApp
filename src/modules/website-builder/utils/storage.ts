/**
 * Website Builder Storage — Abstracted interface for backend migration.
 * 
 * Currently uses localStorage. When integrating a backend, replace
 * the implementations below with API calls. The interface stays the same.
 */
import { WebsiteSite, DEFAULT_THEME, SitePage, SiteTheme } from '../types';

const STORAGE_KEY = 'website_builder_sites';

// ── ID & Slug Utilities ──

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

// ── Storage Interface ──
// All functions below form the "storage contract". When migrating to a backend,
// swap these implementations with API calls — no other file needs to change.

export function loadSites(): WebsiteSite[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveSites(sites: WebsiteSite[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sites));
}

export function createSite(name: string, options?: { theme?: SiteTheme; pages?: SitePage[] }): WebsiteSite {
  const homePage: SitePage = {
    id: generateId(),
    title: 'Home',
    slug: '',
    components: [],
    seo: { title: name },
    isHomePage: true,
    order: 0,
  };

  const site: WebsiteSite = {
    id: generateId(),
    name,
    slug: slugify(name),
    theme: options?.theme ? { ...options.theme } : { ...DEFAULT_THEME },
    pages: options?.pages || [homePage],
    published: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const sites = loadSites();
  sites.push(site);
  saveSites(sites);
  return site;
}

export function updateSite(site: WebsiteSite): void {
  const sites = loadSites();
  const idx = sites.findIndex(s => s.id === site.id);
  if (idx >= 0) {
    sites[idx] = { ...site, updatedAt: new Date().toISOString() };
    saveSites(sites);
  }
}

export function deleteSite(siteId: string): void {
  const sites = loadSites().filter(s => s.id !== siteId);
  saveSites(sites);
}

export function getSite(siteId: string): WebsiteSite | undefined {
  return loadSites().find(s => s.id === siteId);
}

export function addPageToSite(siteId: string, title: string): SitePage {
  const site = getSite(siteId);
  if (!site) throw new Error('Site not found');

  const page: SitePage = {
    id: generateId(),
    title,
    slug: slugify(title),
    components: [],
    seo: { title },
    order: site.pages.length,
  };

  site.pages.push(page);
  updateSite(site);
  return page;
}

/**
 * Content Service — Manages site content for backend integration.
 * 
 * This service handles content operations like translations, versioning,
 * and content-specific queries. Designed for future backend integration.
 */
import type { WebsiteSite, SitePage, BuilderComponent, PageTranslation, PageSEO } from '../types';
import { getStorageProvider } from './storageProvider';

// ══════════════════════════════════════════════════════════════════
// Types
// ══════════════════════════════════════════════════════════════════

export interface ContentVersion {
  id: string;
  siteId: string;
  pageId: string;
  version: number;
  components: BuilderComponent[];
  createdAt: string;
  createdBy?: string;
  message?: string;
}

export interface TranslationStatus {
  language: string;
  pageId: string;
  isComplete: boolean;
  lastUpdated: string;
  componentCount: number;
  translatedCount: number;
}

export interface ContentSearchResult {
  siteId: string;
  pageId: string;
  componentId: string;
  componentType: string;
  matchedText: string;
  context: string;
}

export interface ServiceResult<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

// ══════════════════════════════════════════════════════════════════
// Content Service
// ══════════════════════════════════════════════════════════════════

/**
 * Get all translatable text from components
 */
export function extractTranslatableContent(
  components: BuilderComponent[]
): Array<{ componentId: string; key: string; text: string }> {
  const results: Array<{ componentId: string; key: string; text: string }> = [];
  
  const textKeys = [
    'heading', 'subheading', 'text', 'title', 'subtitle', 'description',
    'content', 'label', 'placeholder', 'ctaText', 'buttonText', 'name',
    'question', 'answer', 'bio', 'role', 'tagline',
  ];
  
  function extractFromComponent(comp: BuilderComponent) {
    for (const [key, value] of Object.entries(comp.props)) {
      if (textKeys.includes(key) && typeof value === 'string' && value.trim()) {
        results.push({
          componentId: comp.id,
          key,
          text: value,
        });
      }
      
      // Handle arrays (e.g., features, testimonials)
      if (Array.isArray(value)) {
        value.forEach((item, index) => {
          if (typeof item === 'object' && item !== null) {
            for (const [itemKey, itemValue] of Object.entries(item)) {
              if (textKeys.includes(itemKey) && typeof itemValue === 'string' && (itemValue as string).trim()) {
                results.push({
                  componentId: comp.id,
                  key: `${key}[${index}].${itemKey}`,
                  text: itemValue as string,
                });
              }
            }
          }
        });
      }
    }
    
    // Recurse into children
    if (comp.children) {
      comp.children.forEach(extractFromComponent);
    }
  }
  
  components.forEach(extractFromComponent);
  return results;
}

/**
 * Apply translations to components
 */
export function applyTranslations(
  components: BuilderComponent[],
  translations: Record<string, string> // componentId.key -> translated text
): BuilderComponent[] {
  return components.map(comp => {
    const updatedProps = { ...comp.props };
    
    for (const [key, value] of Object.entries(comp.props)) {
      const translationKey = `${comp.id}.${key}`;
      if (translations[translationKey]) {
        updatedProps[key] = translations[translationKey];
      }
      
      // Handle arrays
      if (Array.isArray(value)) {
        updatedProps[key] = value.map((item, index) => {
          if (typeof item === 'object' && item !== null) {
            const updatedItem = { ...item };
            for (const [itemKey] of Object.entries(item)) {
              const itemTranslationKey = `${comp.id}.${key}[${index}].${itemKey}`;
              if (translations[itemTranslationKey]) {
                updatedItem[itemKey] = translations[itemTranslationKey];
              }
            }
            return updatedItem;
          }
          return item;
        });
      }
    }
    
    return {
      ...comp,
      props: updatedProps,
      children: comp.children ? applyTranslations(comp.children, translations) : undefined,
    };
  });
}

/**
 * Get translation status for all pages
 */
export function getTranslationStatus(
  site: WebsiteSite,
  language: string
): TranslationStatus[] {
  return site.pages.map(page => {
    const baseContent = extractTranslatableContent(page.components);
    const translation = page.translations?.[language];
    
    if (!translation) {
      return {
        language,
        pageId: page.id,
        isComplete: false,
        lastUpdated: '',
        componentCount: baseContent.length,
        translatedCount: 0,
      };
    }
    
    const translatedContent = extractTranslatableContent(translation.components);
    
    return {
      language,
      pageId: page.id,
      isComplete: translatedContent.length >= baseContent.length,
      lastUpdated: new Date().toISOString(), // Would come from backend
      componentCount: baseContent.length,
      translatedCount: translatedContent.length,
    };
  });
}

/**
 * Search content across all sites/pages
 */
export async function searchContent(
  query: string,
  options?: { siteId?: string; pageId?: string; componentType?: string }
): Promise<ServiceResult<ContentSearchResult[]>> {
  try {
    const provider = getStorageProvider();
    const sitesResult = await provider.listSites();
    
    if (!sitesResult.success || !sitesResult.data) {
      return { data: null, error: sitesResult.error, success: false };
    }
    
    const results: ContentSearchResult[] = [];
    const queryLower = query.toLowerCase();
    
    const sites = options?.siteId 
      ? sitesResult.data.filter(s => s.id === options.siteId)
      : sitesResult.data;
    
    for (const site of sites) {
      const pages = options?.pageId
        ? site.pages.filter(p => p.id === options.pageId)
        : site.pages;
      
      for (const page of pages) {
        searchInComponents(
          page.components,
          site.id,
          page.id,
          queryLower,
          options?.componentType,
          results
        );
      }
    }
    
    return { data: results, error: null, success: true };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Search failed',
      success: false,
    };
  }
}

function searchInComponents(
  components: BuilderComponent[],
  siteId: string,
  pageId: string,
  query: string,
  componentType: string | undefined,
  results: ContentSearchResult[]
) {
  for (const comp of components) {
    if (componentType && comp.type !== componentType) continue;
    
    for (const [key, value] of Object.entries(comp.props)) {
      if (typeof value === 'string' && value.toLowerCase().includes(query)) {
        results.push({
          siteId,
          pageId,
          componentId: comp.id,
          componentType: comp.type,
          matchedText: value,
          context: key,
        });
      }
      
      if (Array.isArray(value)) {
        for (const item of value) {
          if (typeof item === 'object' && item !== null) {
            for (const [itemKey, itemValue] of Object.entries(item)) {
              if (typeof itemValue === 'string' && (itemValue as string).toLowerCase().includes(query)) {
                results.push({
                  siteId,
                  pageId,
                  componentId: comp.id,
                  componentType: comp.type,
                  matchedText: itemValue as string,
                  context: `${key}.${itemKey}`,
                });
              }
            }
          }
        }
      }
    }
    
    if (comp.children) {
      searchInComponents(comp.children, siteId, pageId, query, componentType, results);
    }
  }
}

/**
 * Clone page content with new IDs
 */
export function clonePageContent(page: SitePage): SitePage {
  const generateNewId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  
  function cloneComponent(comp: BuilderComponent): BuilderComponent {
    return {
      ...comp,
      id: generateNewId(),
      props: { ...comp.props },
      styles: { ...comp.styles },
      children: comp.children?.map(cloneComponent),
    };
  }
  
  return {
    ...page,
    id: generateNewId(),
    components: page.components.map(cloneComponent),
    translations: page.translations 
      ? Object.fromEntries(
          Object.entries(page.translations).map(([lang, trans]) => [
            lang,
            {
              ...trans,
              components: trans.components.map(cloneComponent),
            },
          ])
        )
      : undefined,
  };
}

/**
 * Merge component updates (for collaborative editing)
 */
export function mergeComponentUpdates(
  base: BuilderComponent[],
  updates: Partial<BuilderComponent>[]
): BuilderComponent[] {
  const updateMap = new Map(updates.map(u => [u.id, u]));
  
  return base.map(comp => {
    const update = updateMap.get(comp.id);
    if (!update) return comp;
    
    return {
      ...comp,
      ...update,
      props: { ...comp.props, ...update.props },
      styles: { ...comp.styles, ...update.styles },
    };
  });
}

/**
 * Get component statistics for a site
 */
export function getComponentStats(site: WebsiteSite): Record<string, number> {
  const stats: Record<string, number> = {};
  
  function countComponents(components: BuilderComponent[]) {
    for (const comp of components) {
      stats[comp.type] = (stats[comp.type] || 0) + 1;
      if (comp.children) {
        countComponents(comp.children);
      }
    }
  }
  
  for (const page of site.pages) {
    countComponents(page.components);
  }
  
  return stats;
}

// Export content service
export const contentService = {
  extractTranslatableContent,
  applyTranslations,
  getTranslationStatus,
  searchContent,
  clonePageContent,
  mergeComponentUpdates,
  getComponentStats,
};

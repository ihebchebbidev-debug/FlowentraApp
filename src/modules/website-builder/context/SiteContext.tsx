/**
 * Site Context Provider
 * 
 * Centralized state management for website builder sites.
 * Provides auto-save, optimistic updates, and real-time sync.
 */
import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import type { WebsiteSite, SitePage, SiteTheme, BuilderComponent, PageSEO } from '../types';
import { getStorageProvider } from '../services/storageProvider';
import { toast } from 'sonner';

// ══════════════════════════════════════════════════════════════════
// Types
// ══════════════════════════════════════════════════════════════════

export interface SiteContextState {
  site: WebsiteSite | null;
  currentPageId: string | null;
  currentPage: SitePage | null;
  activeLanguage: string | null;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  isDirty: boolean;
}

export interface SiteContextActions {
  // Site operations
  loadSite: (siteId: string) => Promise<void>;
  updateSite: (updates: Partial<WebsiteSite>) => void;
  updateTheme: (theme: SiteTheme) => void;
  publishSite: () => Promise<{ url: string } | null>;
  unpublishSite: () => Promise<void>;
  
  // Page operations
  setCurrentPage: (pageId: string) => void;
  addPage: (title: string, slug?: string) => Promise<SitePage | null>;
  updatePage: (pageId: string, updates: Partial<SitePage>) => void;
  deletePage: (pageId: string) => Promise<void>;
  duplicatePage: (pageId: string) => Promise<SitePage | null>;
  reorderPages: (pageIds: string[]) => void;
  
  // Component operations
  updateComponents: (components: BuilderComponent[]) => void;
  updatePageSeo: (seo: PageSEO) => void;
  
  // Language operations
  setActiveLanguage: (language: string | null) => void;
  
  // Utility
  forceSave: () => Promise<void>;
  resetError: () => void;
}

export type SiteContextValue = SiteContextState & SiteContextActions;

// ══════════════════════════════════════════════════════════════════
// Context
// ══════════════════════════════════════════════════════════════════

const SiteContext = createContext<SiteContextValue | null>(null);

// ══════════════════════════════════════════════════════════════════
// Provider
// ══════════════════════════════════════════════════════════════════

interface SiteProviderProps {
  children: React.ReactNode;
  siteId?: string;
  autoSaveDelay?: number;
}

export function SiteProvider({ 
  children, 
  siteId: initialSiteId,
  autoSaveDelay = 1000 
}: SiteProviderProps) {
  const [state, setState] = useState<SiteContextState>({
    site: null,
    currentPageId: null,
    currentPage: null,
    activeLanguage: null,
    isLoading: false,
    isSaving: false,
    error: null,
    isDirty: false,
  });

  // Refs for auto-save
  const siteRef = useRef(state.site);
  siteRef.current = state.site;
  
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSavingRef = useRef(false);

  // ── Auto-save logic ──

  const scheduleSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(async () => {
      const site = siteRef.current;
      if (!site || isSavingRef.current) return;
      
      isSavingRef.current = true;
      setState(s => ({ ...s, isSaving: true }));
      
      try {
        const provider = getStorageProvider();
        await provider.updateSite({ id: site.id, ...site });
        setState(s => ({ ...s, isDirty: false, isSaving: false }));
      } catch (error) {
        console.error('Auto-save failed:', error);
        setState(s => ({ ...s, isSaving: false }));
      } finally {
        isSavingRef.current = false;
      }
    }, autoSaveDelay);
  }, [autoSaveDelay]);

  // ── Site Operations ──

  const loadSite = useCallback(async (siteId: string) => {
    setState(s => ({ ...s, isLoading: true, error: null }));
    
    try {
      const provider = getStorageProvider();
      const result = await provider.getSite(siteId);
      
      if (result.success && result.data) {
        const site = result.data;
        const homePage = site.pages.find(p => p.isHomePage) || site.pages[0];
        
        // Restore persisted language preference
        const savedLang = localStorage.getItem(`wb_lang_${site.id}`);
        const validLang = savedLang && site.languages?.some(l => l.code === savedLang) ? savedLang : null;

        setState(s => ({
          ...s,
          site,
          currentPageId: homePage?.id || null,
          currentPage: homePage || null,
          activeLanguage: validLang,
          isLoading: false,
        }));
      } else {
        setState(s => ({ ...s, error: result.error || 'Failed to load site', isLoading: false }));
      }
    } catch (error) {
      setState(s => ({ ...s, error: 'Failed to load site', isLoading: false }));
    }
  }, []);

  const updateSiteInternal = useCallback((updates: Partial<WebsiteSite>) => {
    setState(s => {
      if (!s.site) return s;
      
      const updatedSite = { ...s.site, ...updates, updatedAt: new Date().toISOString() };
      const currentPage = s.currentPageId 
        ? updatedSite.pages.find(p => p.id === s.currentPageId) || null
        : null;
      
      return {
        ...s,
        site: updatedSite,
        currentPage,
        isDirty: true,
      };
    });
    
    scheduleSave();
  }, [scheduleSave]);

  const updateTheme = useCallback((theme: SiteTheme) => {
    updateSiteInternal({ theme });
  }, [updateSiteInternal]);

  const publishSite = useCallback(async () => {
    if (!state.site) return null;
    
    try {
      const provider = getStorageProvider();
      const result = await provider.publishSite(state.site.id);
      
      if (result.success && result.data) {
        updateSiteInternal({ published: true, publishedAt: result.data.publishedAt });
        toast.success('Site published!');
        return { url: result.data.url };
      } else {
        toast.error(result.error || 'Failed to publish');
        return null;
      }
    } catch (error) {
      toast.error('Failed to publish site');
      return null;
    }
  }, [state.site, updateSiteInternal]);

  const unpublishSite = useCallback(async () => {
    if (!state.site) return;
    
    try {
      const provider = getStorageProvider();
      await provider.unpublishSite(state.site.id);
      updateSiteInternal({ published: false, publishedAt: undefined });
      toast.success('Site unpublished');
    } catch (error) {
      toast.error('Failed to unpublish site');
    }
  }, [state.site, updateSiteInternal]);

  // ── Page Operations ──

  const setCurrentPage = useCallback((pageId: string) => {
    setState(s => {
      if (!s.site) return s;
      const page = s.site.pages.find(p => p.id === pageId) || null;
      return { ...s, currentPageId: pageId, currentPage: page };
    });
  }, []);

  const addPage = useCallback(async (title: string, slug?: string) => {
    if (!state.site) return null;
    
    const newPage: SitePage = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      title,
      slug: slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      components: [],
      seo: { title },
      order: state.site.pages.length,
    };
    
    const updatedPages = [...state.site.pages, newPage];
    updateSiteInternal({ pages: updatedPages });
    setCurrentPage(newPage.id);
    toast.success(`Page "${title}" created`);
    
    return newPage;
  }, [state.site, updateSiteInternal, setCurrentPage]);

  const updatePage = useCallback((pageId: string, updates: Partial<SitePage>) => {
    if (!state.site) return;
    
    const updatedPages = state.site.pages.map(p => 
      p.id === pageId ? { ...p, ...updates } : p
    );
    updateSiteInternal({ pages: updatedPages });
  }, [state.site, updateSiteInternal]);

  const deletePage = useCallback(async (pageId: string) => {
    if (!state.site) return;
    if (state.site.pages.length <= 1) {
      toast.error('Cannot delete the last page');
      return;
    }
    
    const updatedPages = state.site.pages.filter(p => p.id !== pageId);
    updateSiteInternal({ pages: updatedPages });
    
    if (state.currentPageId === pageId) {
      setCurrentPage(updatedPages[0].id);
    }
    toast.success('Page deleted');
  }, [state.site, state.currentPageId, updateSiteInternal, setCurrentPage]);

  const duplicatePage = useCallback(async (pageId: string) => {
    if (!state.site) return null;
    
    const page = state.site.pages.find(p => p.id === pageId);
    if (!page) return null;
    
    const duplicated: SitePage = {
      ...JSON.parse(JSON.stringify(page)),
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      title: `${page.title} (copy)`,
      slug: `${page.slug}-copy`,
      isHomePage: false,
      order: state.site.pages.length,
    };
    
    const updatedPages = [...state.site.pages, duplicated];
    updateSiteInternal({ pages: updatedPages });
    setCurrentPage(duplicated.id);
    toast.success(`Page "${page.title}" duplicated`);
    
    return duplicated;
  }, [state.site, updateSiteInternal, setCurrentPage]);

  const reorderPages = useCallback((pageIds: string[]) => {
    if (!state.site) return;
    
    const reordered: SitePage[] = [];
    pageIds.forEach((id, index) => {
      const page = state.site!.pages.find(p => p.id === id);
      if (page) {
        reordered.push({ ...page, order: index });
      }
    });
    
    updateSiteInternal({ pages: reordered });
  }, [state.site, updateSiteInternal]);

  // ── Component Operations ──

  const updateComponents = useCallback((components: BuilderComponent[]) => {
    if (!state.site || !state.currentPageId) return;
    
    const updatedPages = state.site.pages.map(p => {
      if (p.id !== state.currentPageId) return p;
      
      if (state.activeLanguage && p.translations?.[state.activeLanguage]) {
        return {
          ...p,
          translations: {
            ...p.translations,
            [state.activeLanguage]: {
              ...p.translations[state.activeLanguage],
              components,
            },
          },
        };
      }
      
      return { ...p, components };
    });
    
    updateSiteInternal({ pages: updatedPages });
  }, [state.site, state.currentPageId, state.activeLanguage, updateSiteInternal]);

  const updatePageSeo = useCallback((seo: PageSEO) => {
    if (!state.currentPageId) return;
    updatePage(state.currentPageId, { seo });
  }, [state.currentPageId, updatePage]);

  // ── Language Operations ──

  const setActiveLanguage = useCallback((language: string | null) => {
    setState(s => ({ ...s, activeLanguage: language }));
    // Persist selection per-site so visitors don't have to re-select on reload
    if (state.site) {
      const key = `wb_lang_${state.site.id}`;
      if (language) {
        localStorage.setItem(key, language);
      } else {
        localStorage.removeItem(key);
      }
    }
  }, [state.site]);

  // ── Utility ──

  const forceSave = useCallback(async () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    const site = siteRef.current;
    if (!site) return;
    
    setState(s => ({ ...s, isSaving: true }));
    
    try {
      const provider = getStorageProvider();
      await provider.updateSite({ id: site.id, ...site });
      setState(s => ({ ...s, isDirty: false, isSaving: false }));
    } catch (error) {
      console.error('Save failed:', error);
      setState(s => ({ ...s, isSaving: false }));
      throw error;
    }
  }, []);

  const resetError = useCallback(() => {
    setState(s => ({ ...s, error: null }));
  }, []);

  // ── Load initial site ──

  useEffect(() => {
    if (initialSiteId) {
      loadSite(initialSiteId);
    }
  }, [initialSiteId, loadSite]);

  // ── Cleanup ──

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const value: SiteContextValue = {
    ...state,
    loadSite,
    updateSite: updateSiteInternal,
    updateTheme,
    publishSite,
    unpublishSite,
    setCurrentPage,
    addPage,
    updatePage,
    deletePage,
    duplicatePage,
    reorderPages,
    updateComponents,
    updatePageSeo,
    setActiveLanguage,
    forceSave,
    resetError,
  };

  return (
    <SiteContext.Provider value={value}>
      {children}
    </SiteContext.Provider>
  );
}

// ══════════════════════════════════════════════════════════════════
// Hook
// ══════════════════════════════════════════════════════════════════

export function useSiteContext(): SiteContextValue {
  const context = useContext(SiteContext);
  if (!context) {
    throw new Error('useSiteContext must be used within a SiteProvider');
  }
  return context;
}

// Optional hook that doesn't throw (for optional usage)
export function useSiteContextOptional(): SiteContextValue | null {
  return useContext(SiteContext);
}

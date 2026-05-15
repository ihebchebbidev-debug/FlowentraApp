/**
 * Site-level action handlers extracted from SiteEditor.
 * Manages page CRUD, theme/SEO updates, and language handling.
 *
 * Uses a site ref to avoid stale closure race conditions —
 * rapid successive saves (e.g. theme change + component save)
 * always read the latest site state.
 */
import { useCallback, useRef } from 'react';
import { WebsiteSite, SitePage, BuilderComponent, SiteTheme, PageSEO } from '../types';
import { getStorageProvider } from '../services/storageProvider';
import { toast } from 'sonner';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

interface UseSiteActionsProps {
  site: WebsiteSite;
  currentPageId: string;
  activeLanguage: string | null;
  onSiteUpdate: (site: WebsiteSite) => void;
  setCurrentPageId: (id: string) => void;
}

export function useSiteActions({
  site,
  currentPageId,
  activeLanguage,
  onSiteUpdate,
  setCurrentPageId,
}: UseSiteActionsProps) {
  // Ref always holds the latest site — prevents stale closure bugs
  const siteRef = useRef(site);
  siteRef.current = site;

  const currentPageIdRef = useRef(currentPageId);
  currentPageIdRef.current = currentPageId;

  const activeLanguageRef = useRef(activeLanguage);
  activeLanguageRef.current = activeLanguage;

  const onSiteUpdateRef = useRef(onSiteUpdate);
  onSiteUpdateRef.current = onSiteUpdate;

  const currentPage = site.pages.find(p => p.id === currentPageId);

  const persistSite = useCallback(async (updatedSite: WebsiteSite) => {
    const provider = getStorageProvider();
    await provider.updateSite({ id: updatedSite.id, ...updatedSite });
    onSiteUpdateRef.current(updatedSite);
  }, []);

  // Save components (respects active language for translations)
  const handleSaveComponents = useCallback((components: BuilderComponent[]) => {
    const s = siteRef.current;
    const pageId = currentPageIdRef.current;
    const lang = activeLanguageRef.current;
    const page = s.pages.find(p => p.id === pageId);
    if (!page) return;

    let updatedPages: SitePage[];
    if (lang && page.translations?.[lang]) {
      updatedPages = s.pages.map(p => {
        if (p.id !== pageId) return p;
        return {
          ...p,
          translations: {
            ...p.translations,
            [lang]: {
              ...p.translations![lang],
              components,
            },
          },
        };
      });
    } else {
      updatedPages = s.pages.map(p =>
        p.id === pageId ? { ...p, components } : p
      );
    }

    persistSite({ ...s, pages: updatedPages });
  }, [persistSite]);

  const handleThemeChange = useCallback((newTheme: SiteTheme) => {
    persistSite({ ...siteRef.current, theme: newTheme });
  }, [persistSite]);

  const handleSeoChange = useCallback((seo: PageSEO) => {
    const s = siteRef.current;
    const pageId = currentPageIdRef.current;
    const updatedPages = s.pages.map(p =>
      p.id === pageId ? { ...p, seo } : p
    );
    persistSite({ ...s, pages: updatedPages });
  }, [persistSite]);

  const handleSlugChange = useCallback((slug: string) => {
    const s = siteRef.current;
    const pageId = currentPageIdRef.current;
    const updatedPages = s.pages.map(p =>
      p.id === pageId ? { ...p, slug } : p
    );
    persistSite({ ...s, pages: updatedPages });
  }, [persistSite]);

  const handlePageTitleChange = useCallback((title: string) => {
    const s = siteRef.current;
    const pageId = currentPageIdRef.current;
    const updatedPages = s.pages.map(p =>
      p.id === pageId ? { ...p, title } : p
    );
    persistSite({ ...s, pages: updatedPages });
  }, [persistSite]);

  const handleAddPage = useCallback((newPage: SitePage) => {
    const s = siteRef.current;
    persistSite({ ...s, pages: [...s.pages, newPage] });
    setCurrentPageId(newPage.id);
    toast.success(`Page "${newPage.title}" created`);
  }, [persistSite, setCurrentPageId]);

  const handleDeletePage = useCallback((pageId: string) => {
    const s = siteRef.current;
    if (s.pages.length <= 1) {
      toast.error('Cannot delete the last page');
      return;
    }
    const updatedPages = s.pages.filter(p => p.id !== pageId);
    persistSite({ ...s, pages: updatedPages });
    if (currentPageIdRef.current === pageId) {
      setCurrentPageId(updatedPages[0].id);
    }
    toast.success('Page deleted');
  }, [persistSite, setCurrentPageId]);

  const handleDuplicatePage = useCallback((pageId: string) => {
    const s = siteRef.current;
    const page = s.pages.find(p => p.id === pageId);
    if (!page) return;
    const duplicated: SitePage = {
      ...JSON.parse(JSON.stringify(page)),
      id: generateId(),
      title: `${page.title} (copy)`,
      slug: `${page.slug}-copy`,
      isHomePage: false,
      order: s.pages.length,
    };
    persistSite({ ...s, pages: [...s.pages, duplicated] });
    setCurrentPageId(duplicated.id);
    toast.success(`Page "${page.title}" duplicated`);
  }, [persistSite, setCurrentPageId]);

  const handleSiteUpdateFromLanguageManager = useCallback((updatedSite: WebsiteSite) => {
    persistSite(updatedSite);
  }, [persistSite]);

  return {
    currentPage,
    handleSaveComponents,
    handleThemeChange,
    handleSeoChange,
    handleSlugChange,
    handlePageTitleChange,
    handleAddPage,
    handleDeletePage,
    handleDuplicatePage,
    handleSiteUpdateFromLanguageManager,
  };
}

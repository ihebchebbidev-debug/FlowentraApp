/**
 * Site-level action handlers extracted from SiteEditor.
 * Manages page CRUD, theme/SEO updates, component persistence and language handling.
 *
 * Persistence strategy
 * ────────────────────
 *  - Component edits (the high-frequency path) are saved with a **debounced,
 *    serialized** call to the per-page `updatePageComponents` endpoint, which
 *    carries an optimistic-concurrency token (`expectedUpdatedAt`). The returned
 *    token is folded back into local state so the next save stays in sync.
 *  - Structural changes (add / delete / duplicate page, slug/title/SEO, theme)
 *    use the matching granular endpoint. Newly created pages adopt their real
 *    backend id immediately, so a page is never re-created on the next save.
 *
 * A site ref mirrors the latest props so every async callback reads fresh state
 * without stale-closure races.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { WebsiteSite, SitePage, BuilderComponent, SiteTheme, PageSEO } from '../types';
import { getStorageProvider } from '../services/storageProvider';
import { toast } from 'sonner';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Client-side ids look like "1770636146211-abc1234"; backend ids are plain integers. */
function isClientSideId(id: string): boolean {
  return id.includes('-');
}

const SAVE_DEBOUNCE_MS = 600;

interface UseSiteActionsProps {
  site: WebsiteSite;
  currentPageId: string;
  activeLanguage: string | null;
  onSiteUpdate: (site: WebsiteSite) => void;
  setCurrentPageId: (id: string) => void;
}

interface PendingSave {
  pageId: string;
  language: string | null;
  components: BuilderComponent[];
}

export function useSiteActions({
  site,
  currentPageId,
  activeLanguage,
  onSiteUpdate,
  setCurrentPageId,
}: UseSiteActionsProps) {
  // Refs always hold the latest values — prevents stale-closure bugs.
  const siteRef = useRef(site);
  siteRef.current = site;

  const currentPageIdRef = useRef(currentPageId);
  currentPageIdRef.current = currentPageId;

  const activeLanguageRef = useRef(activeLanguage);
  activeLanguageRef.current = activeLanguage;

  const onSiteUpdateRef = useRef(onSiteUpdate);
  onSiteUpdateRef.current = onSiteUpdate;

  const setCurrentPageIdRef = useRef(setCurrentPageId);
  setCurrentPageIdRef.current = setCurrentPageId;

  const currentPage = site.pages.find(p => p.id === currentPageId);

  // ── Debounced / serialized component persistence ──
  const pendingRef = useRef<Map<string, PendingSave>>(new Map());
  const flushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inflightRef = useRef<Promise<void> | null>(null);
  const flushErrorRef = useRef(false);
  // Guards against late async saves mutating parent routing state after the
  // editor unmounts (which would otherwise re-open the editor).
  const mountedRef = useRef(true);

  const emitSite = useCallback((next: WebsiteSite) => {
    if (mountedRef.current) onSiteUpdateRef.current(next);
  }, []);
  const selectPage = useCallback((id: string) => {
    if (mountedRef.current) setCurrentPageIdRef.current(id);
  }, []);

  // ── Save status (surfaced in the toolbar) ──
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const setStatus = useCallback((s: SaveStatus) => {
    if (mountedRef.current) setSaveStatus(s);
  }, []);
  /**
   * Run a network mutation while reflecting its progress in the toolbar.
   * Provider methods resolve with `{ success }` even on failure, so honour it.
   */
  const runSave = useCallback(async <T,>(op: () => Promise<T>): Promise<T> => {
    setStatus('saving');
    try {
      const result = await op();
      const failed = !!result && typeof result === 'object' && 'success' in result && (result as { success?: boolean }).success === false;
      setStatus(failed ? 'error' : 'saved');
      return result;
    } catch (err) {
      setStatus('error');
      throw err;
    }
  }, [setStatus]);

  /** Patch a single page's concurrency token into local state. */
  const applyPageToken = useCallback((pageId: string, updatedAt?: string) => {
    if (!updatedAt) return;
    const s = siteRef.current;
    const pages = s.pages.map(p => (p.id === pageId ? { ...p, updatedAt } : p));
    emitSite({ ...s, pages });
  }, [emitSite]);

  const flushPending = useCallback(async (): Promise<void> => {
    if (inflightRef.current) return inflightRef.current;
    if (pendingRef.current.size === 0) return;

    const run = (async () => {
      const provider = getStorageProvider();
      flushErrorRef.current = false;
      // Drain the queue snapshot; new edits arriving mid-flush re-queue and
      // are handled by the trailing re-flush below.
      const entries = Array.from(pendingRef.current.values());
      pendingRef.current.clear();

      for (const entry of entries) {
        const s = siteRef.current;
        const page = s.pages.find(p => p.id === entry.pageId);
        if (!page) continue;

        // A page that hasn't been persisted yet has no backend id to target —
        // create it (with its components) and adopt the real id.
        if (isClientSideId(entry.pageId)) {
          const created = await provider.addPage(s.id, {
            title: page.title,
            slug: page.slug,
            components: entry.components,
            seo: page.seo,
            isHomePage: page.isHomePage ?? false,
            order: page.order,
          } as Omit<SitePage, 'id'>);
          if (created.success && created.data) {
            const s2 = siteRef.current;
            const real = created.data;
            emitSite({
              ...s2,
              pages: s2.pages.map(p => (p.id === entry.pageId ? { ...real, translations: page.translations } : p)),
            });
            if (currentPageIdRef.current === entry.pageId) selectPage(real.id);
          } else {
            flushErrorRef.current = true;
          }
          continue;
        }

        const result = await provider.updatePageComponents(
          s.id,
          entry.pageId,
          entry.components,
          entry.language || undefined,
          page.updatedAt,
        );

        if (result.success && result.data) {
          applyPageToken(entry.pageId, result.data.updatedAt);
        } else if (result.error && /modified elsewhere|conflict/i.test(result.error)) {
          // Optimistic-concurrency clash — reload the authoritative version
          // rather than silently overwriting a change made elsewhere.
          const fresh = await provider.getSite(s.id);
          if (fresh.success && fresh.data) emitSite(fresh.data);
          if (mountedRef.current) toast.error('This page changed elsewhere — reloaded the latest version.');
        } else {
          flushErrorRef.current = true;
        }
      }
    })();

    inflightRef.current = run;
    setStatus('saving');
    try {
      await run;
      setStatus(flushErrorRef.current ? 'error' : 'saved');
    } catch {
      setStatus('error');
    } finally {
      inflightRef.current = null;
      // Process any edits that landed while we were saving.
      if (pendingRef.current.size > 0) {
        await flushPending();
      }
    }
  }, [applyPageToken, setStatus, emitSite, selectPage]);

  const scheduleFlush = useCallback(() => {
    if (flushTimerRef.current) clearTimeout(flushTimerRef.current);
    flushTimerRef.current = setTimeout(() => {
      flushTimerRef.current = null;
      void flushPending();
    }, SAVE_DEBOUNCE_MS);
  }, [flushPending]);

  /** Cancel the debounce timer and flush immediately (await in-flight too). */
  const flushNow = useCallback(async () => {
    if (flushTimerRef.current) {
      clearTimeout(flushTimerRef.current);
      flushTimerRef.current = null;
    }
    await flushPending();
  }, [flushPending]);

  // Persist any queued edits when the editor unmounts (navigate away / back).
  // Mark unmounted first so late saves persist to the backend but never push
  // state back into the (now gone) editor.
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (flushTimerRef.current) clearTimeout(flushTimerRef.current);
      void flushPending();
    };
  }, [flushPending]);

  // ── Component persistence (high-frequency path) ──
  const handleSaveComponents = useCallback((components: BuilderComponent[]) => {
    const s = siteRef.current;
    const pageId = currentPageIdRef.current;
    const lang = activeLanguageRef.current;
    const page = s.pages.find(p => p.id === pageId);
    if (!page) return;

    // Only treat as a translation edit when that translation actually exists.
    const effectiveLang = lang && page.translations?.[lang] ? lang : null;

    // Optimistic local update — instant canvas/preview, no network.
    let updatedPages: SitePage[];
    if (effectiveLang) {
      updatedPages = s.pages.map(p => {
        if (p.id !== pageId) return p;
        return {
          ...p,
          translations: {
            ...p.translations,
            [effectiveLang]: { ...p.translations![effectiveLang], components },
          },
        };
      });
    } else {
      updatedPages = s.pages.map(p => (p.id === pageId ? { ...p, components } : p));
    }
    emitSite({ ...s, pages: updatedPages });

    // Queue the debounced network save (latest edit per page+language wins).
    pendingRef.current.set(`${pageId}__${effectiveLang || 'default'}`, {
      pageId,
      language: effectiveLang,
      components,
    });
    setStatus('saving'); // reflect the unsaved edit immediately (before debounce fires)
    scheduleFlush();
  }, [scheduleFlush, emitSite, setStatus]);

  // ── Theme ──
  const handleThemeChange = useCallback(async (newTheme: SiteTheme) => {
    const s = siteRef.current;
    emitSite({ ...s, theme: newTheme });
    await runSave(() => getStorageProvider().updateSite({ id: s.id, theme: newTheme }));
  }, [emitSite, runSave]);

  // ── Per-page metadata (seo / slug / title) ──
  const patchCurrentPage = useCallback(async (updates: Partial<SitePage>) => {
    const s = siteRef.current;
    const pageId = currentPageIdRef.current;
    emitSite({
      ...s,
      pages: s.pages.map(p => (p.id === pageId ? { ...p, ...updates } : p)),
    });
    if (isClientSideId(pageId)) return; // not yet persisted — created lazily on component save
    const result = await runSave(() => getStorageProvider().updatePage(s.id, pageId, updates));
    if (result.success && result.data) applyPageToken(pageId, result.data.updatedAt);
  }, [applyPageToken, emitSite, runSave]);

  const handleSeoChange = useCallback((seo: PageSEO) => { void patchCurrentPage({ seo }); }, [patchCurrentPage]);
  const handleSlugChange = useCallback((slug: string) => { void patchCurrentPage({ slug }); }, [patchCurrentPage]);
  const handlePageTitleChange = useCallback((title: string) => { void patchCurrentPage({ title }); }, [patchCurrentPage]);

  // ── Page CRUD ──
  const handleAddPage = useCallback(async (newPage: SitePage) => {
    const s = siteRef.current;
    const result = await runSave(() => getStorageProvider().addPage(s.id, {
      title: newPage.title,
      slug: newPage.slug,
      components: newPage.components,
      seo: newPage.seo,
      isHomePage: newPage.isHomePage ?? false,
      order: newPage.order,
    } as Omit<SitePage, 'id'>));

    const page = result.success && result.data ? result.data : newPage;
    emitSite({ ...siteRef.current, pages: [...siteRef.current.pages, page] });
    selectPage(page.id);
    toast.success(`Page "${newPage.title}" created`);
  }, [emitSite, selectPage, runSave]);

  const handleDeletePage = useCallback(async (pageId: string) => {
    const s = siteRef.current;
    if (s.pages.length <= 1) {
      toast.error('Cannot delete the last page');
      return;
    }
    const prevPages = s.pages;
    const prevCurrentPageId = currentPageIdRef.current;
    const updatedPages = prevPages.filter(p => p.id !== pageId);
    // Optimistic update
    emitSite({ ...s, pages: updatedPages });
    if (currentPageIdRef.current === pageId) selectPage(updatedPages[0].id);

    if (!isClientSideId(pageId)) {
      const result = await runSave(() => getStorageProvider().deletePage(s.id, pageId));
      if (!result.success) {
        // Revert
        emitSite({ ...siteRef.current, pages: prevPages });
        if (prevCurrentPageId) selectPage(prevCurrentPageId);
        toast.error('Failed to delete page — restored.');
        return;
      }
    }
    toast.success('Page deleted');
  }, [emitSite, selectPage, runSave]);

  const handleDuplicatePage = useCallback(async (pageId: string) => {
    const s = siteRef.current;
    const page = s.pages.find(p => p.id === pageId);
    if (!page) return;

    const provider = getStorageProvider();
    const result = await runSave(() => provider.addPage(s.id, {
      title: `${page.title} (copy)`,
      slug: `${page.slug}-copy`,
      components: JSON.parse(JSON.stringify(page.components)),
      seo: { ...page.seo },
      isHomePage: false,
      order: s.pages.length,
    } as Omit<SitePage, 'id'>));

    let created: SitePage | null = result.success && result.data ? result.data : null;
    // The add endpoint doesn't carry translations — copy them in a follow-up.
    if (created && page.translations && !isClientSideId(created.id)) {
      const withTranslations = await provider.updatePage(s.id, created.id, { translations: page.translations });
      if (withTranslations.success && withTranslations.data) created = withTranslations.data;
    }

    const finalPage: SitePage = created || {
      ...JSON.parse(JSON.stringify(page)),
      id: generateId(),
      title: `${page.title} (copy)`,
      slug: `${page.slug}-copy`,
      isHomePage: false,
      order: s.pages.length,
    };

    emitSite({ ...siteRef.current, pages: [...siteRef.current.pages, finalPage] });
    selectPage(finalPage.id);
    toast.success(`Page "${page.title}" duplicated`);
  }, [emitSite, selectPage, runSave]);

  // ── Language manager (bulk translations + languages) ──
  const handleSiteUpdateFromLanguageManager = useCallback(async (updatedSite: WebsiteSite) => {
    emitSite(updatedSite);
    await flushNow(); // don't let a queued per-page save race the bulk write
    const result = await runSave(() => getStorageProvider().updateSite({ id: updatedSite.id, ...updatedSite }));
    if (result.success && result.data) emitSite(result.data);
  }, [flushNow, emitSite, runSave]);

  return {
    currentPage,
    saveStatus,
    handleSaveComponents,
    handleThemeChange,
    handleSeoChange,
    handleSlugChange,
    handlePageTitleChange,
    handleAddPage,
    handleDeletePage,
    handleDuplicatePage,
    handleSiteUpdateFromLanguageManager,
    flushNow,
  };
}

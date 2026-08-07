import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getStorageProvider } from '../services/storageProvider';
import { ComponentRenderer } from '../components/renderer/ComponentRenderer';
import { DEFAULT_THEME, WebsiteSite } from '../types';
import { useSiteHead } from '../hooks/useSiteHead';

/**
 * Public viewer for published websites.
 * Renders the site's pages at /public/sites/:siteSlug/:pageSlug?
 *
 * Applies the same head tags, language direction, and theme background as
 * the in-editor SitePreview so what users saw in preview is what ships.
 */
export default function PublicWebsitePage() {
  const { siteSlug, pageSlug } = useParams<{ siteSlug: string; pageSlug?: string }>();
  const [site, setSite] = useState<WebsiteSite | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadSite() {
      if (!siteSlug) { setIsLoading(false); return; }
      setIsLoading(true);
      const provider = getStorageProvider();
      const result = await provider.getSiteBySlug(siteSlug);
      if (result.success && result.data && result.data.published) {
        setSite(result.data);
      } else {
        setSite(null);
      }
      setIsLoading(false);
    }
    loadSite();
  }, [siteSlug]);

  const theme = site?.theme || DEFAULT_THEME;

  // Resolve the requested page (or home page)
  const page = useMemo(() => {
    if (!site) return null;
    return pageSlug
      ? site.pages.find((p) => p.slug === pageSlug) || null
      : site.pages.find((p) => p.isHomePage) || site.pages[0] || null;
  }, [site, pageSlug]);

  // Head must always be called (hook rule) — target=null when there's no site yet.
  useSiteHead({
    site: site || null,
    page,
    theme: site ? theme : null,
    language: site?.defaultLanguage || 'en',
    direction: theme.direction || 'ltr',
    noindex: !site, // never index the loading/404 shells
  });

  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: theme.backgroundColor }}
      >
        <div
          className="animate-spin rounded-full h-8 w-8 border-2 border-t-transparent"
          style={{ borderColor: theme.primaryColor, borderTopColor: 'transparent' }}
        />
      </div>
    );
  }

  if (!site) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-6"
        style={{ backgroundColor: theme.backgroundColor, color: theme.textColor, fontFamily: theme.bodyFont }}
      >
        <div className="text-center space-y-4 max-w-md">
          <h1
            className="text-6xl font-bold"
            style={{ color: theme.primaryColor, fontFamily: theme.headingFont }}
          >
            404
          </h1>
          <p style={{ color: theme.secondaryColor }}>
            This website doesn't exist or isn't published yet.
          </p>
        </div>
      </div>
    );
  }

  if (!page) {
    const home = site.pages.find((p) => p.isHomePage) || site.pages[0];
    return (
      <div
        className="min-h-screen flex items-center justify-center px-6"
        style={{ backgroundColor: theme.backgroundColor, color: theme.textColor, fontFamily: theme.bodyFont }}
      >
        <div className="text-center space-y-4 max-w-md">
          <h1
            className="text-6xl font-bold"
            style={{ color: theme.primaryColor, fontFamily: theme.headingFont }}
          >
            404
          </h1>
          <h2 className="text-xl font-semibold" style={{ fontFamily: theme.headingFont }}>
            Page not found
          </h2>
          <p style={{ color: theme.secondaryColor }}>
            The page “{pageSlug}” doesn't exist on this website.
          </p>
          {home && (
            <Link
              to={`/public/sites/${site.slug}`}
              className="inline-flex items-center px-4 py-2 rounded-md font-medium transition-opacity hover:opacity-90"
              style={{
                backgroundColor: theme.primaryColor,
                color: '#fff',
                borderRadius: theme.borderRadius,
              }}
            >
              Back to home
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        backgroundColor: theme.backgroundColor,
        color: theme.textColor,
        fontFamily: theme.bodyFont,
        minHeight: '100vh',
      }}
    >
      {page.components.map((comp) => (
        <ComponentRenderer
          key={comp.id}
          component={comp}
          device="desktop"
          theme={theme}
        />
      ))}

      {/* Simple footer with branding */}
      <div
        className="py-4 text-center border-t"
        style={{ borderColor: theme.secondaryColor + '20' }}
      >
        <p className="text-xs" style={{ color: theme.secondaryColor, fontFamily: theme.bodyFont }}>
          Built with Website Builder
        </p>
      </div>
    </div>
  );
}

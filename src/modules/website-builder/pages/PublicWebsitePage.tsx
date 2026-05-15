import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getStorageProvider } from '../services/storageProvider';
import { ComponentRenderer } from '../components/renderer/ComponentRenderer';
import { DEFAULT_THEME, WebsiteSite } from '../types';

/**
 * Public viewer for published websites.
 * Renders the site's pages at /public/sites/:siteSlug/:pageSlug?
 */
export default function PublicWebsitePage() {
  const { siteSlug, pageSlug } = useParams<{ siteSlug: string; pageSlug?: string }>();
  const [site, setSite] = useState<WebsiteSite | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadSite() {
      if (!siteSlug) { setIsLoading(false); return; }
      const provider = getStorageProvider();
      const result = await provider.getSiteBySlug(siteSlug);
      if (result.success && result.data && result.data.published) {
        setSite(result.data);
      }
      setIsLoading(false);
    }
    loadSite();
  }, [siteSlug]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!site) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-foreground">404</h1>
          <p className="text-muted-foreground">This website doesn't exist or isn't published yet.</p>
        </div>
      </div>
    );
  }

  // Find the requested page (or home page)
  const page = pageSlug
    ? site.pages.find(p => p.slug === pageSlug)
    : site.pages.find(p => p.isHomePage) || site.pages[0];

  if (!page) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-foreground">Page Not Found</h1>
          <p className="text-muted-foreground">This page doesn't exist on this website.</p>
        </div>
      </div>
    );
  }

  const theme = site.theme || DEFAULT_THEME;

  return (
    <div style={{ backgroundColor: theme.backgroundColor, minHeight: '100vh' }}>
      {/* SEO meta */}
      {page.seo?.title && <title>{page.seo.title}</title>}
      
      {/* Render components */}
      {page.components.map(comp => (
        <ComponentRenderer
          key={comp.id}
          component={comp}
          device="desktop"
          theme={theme}
        />
      ))}

      {/* Simple footer with branding */}
      <div className="py-4 text-center border-t" style={{ borderColor: theme.secondaryColor + '20' }}>
        <p className="text-xs" style={{ color: theme.secondaryColor, fontFamily: theme.bodyFont }}>
          Built with Website Builder
        </p>
      </div>
    </div>
  );
}

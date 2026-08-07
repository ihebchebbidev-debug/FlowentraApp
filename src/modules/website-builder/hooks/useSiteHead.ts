/**
 * useSiteHead — writes site/page-level <head> tags into a target Document.
 *
 * Used by both the public renderer (targets `document`) and the in-editor
 * preview iframe (targets the iframe's contentDocument), so what the user
 * sees in preview matches what social crawlers see on the live site.
 */
import { useEffect } from 'react';
import type { PageSEO, SiteTheme, WebsiteSite, SitePage } from '../types';

interface UseSiteHeadOptions {
  site: WebsiteSite | null;
  page: SitePage | null;
  seo?: PageSEO | null;
  theme?: SiteTheme | null;
  language?: string | null;
  direction?: 'ltr' | 'rtl';
  /** Target document — defaults to window.document. Pass iframe.contentDocument for previews. */
  targetDocument?: Document | null;
  /** If true, adds <meta name="robots" content="noindex,nofollow"> — used for draft previews. */
  noindex?: boolean;
}

// Marker attribute so we only remove tags we created (never nuke user's tags).
const MARK_ATTR = 'data-wb-head';

/** Small helper: idempotently upsert a meta tag matching by name/property. */
function upsertMeta(doc: Document, key: 'name' | 'property', keyValue: string, content: string) {
  let el = doc.head.querySelector<HTMLMetaElement>(`meta[${key}="${keyValue}"]`);
  if (!el) {
    el = doc.createElement('meta');
    el.setAttribute(key, keyValue);
    el.setAttribute(MARK_ATTR, '1');
    doc.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertLink(doc: Document, rel: string, href: string, extraAttrs: Record<string, string> = {}) {
  let el = doc.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"][data-wb-head="1"]`);
  if (!el) {
    el = doc.createElement('link');
    el.setAttribute('rel', rel);
    el.setAttribute(MARK_ATTR, '1');
    doc.head.appendChild(el);
  }
  el.setAttribute('href', href);
  Object.entries(extraAttrs).forEach(([k, v]) => el!.setAttribute(k, v));
}

function upsertScript(doc: Document, id: string, json: object) {
  const selector = `script[type="application/ld+json"][data-wb-head-id="${id}"]`;
  let el = doc.head.querySelector<HTMLScriptElement>(selector);
  if (!el) {
    el = doc.createElement('script');
    el.setAttribute('type', 'application/ld+json');
    el.setAttribute(MARK_ATTR, '1');
    el.setAttribute('data-wb-head-id', id);
    doc.head.appendChild(el);
  }
  el.textContent = JSON.stringify(json);
}

/** Extract font-family names from a CSS font-family string (drops fallbacks). */
function extractGoogleFontFamily(fontStack?: string): string | null {
  if (!fontStack) return null;
  const first = fontStack.split(',')[0]?.trim().replace(/["']/g, '');
  if (!first) return null;
  // Skip generic system stacks & obvious system fonts.
  const SYSTEM = /^(system-ui|sans-serif|serif|monospace|-apple-system|BlinkMacSystemFont|Segoe UI|Roboto|Helvetica|Arial|Inter)$/i;
  if (SYSTEM.test(first)) return null;
  return first;
}

function injectGoogleFonts(doc: Document, families: string[]) {
  const unique = Array.from(new Set(families.filter(Boolean)));
  if (unique.length === 0) return;
  const familyParam = unique
    .map((f) => `family=${encodeURIComponent(f).replace(/%20/g, '+')}:wght@400;500;600;700`)
    .join('&');
  const href = `https://fonts.googleapis.com/css2?${familyParam}&display=swap`;
  // Preconnects
  upsertLink(doc, 'preconnect', 'https://fonts.googleapis.com');
  upsertLink(doc, 'preconnect', 'https://fonts.gstatic.com', { crossorigin: '' });
  // Actual stylesheet
  let el = doc.head.querySelector<HTMLLinkElement>('link[data-wb-head-fonts="1"]');
  if (!el) {
    el = doc.createElement('link');
    el.setAttribute('rel', 'stylesheet');
    el.setAttribute(MARK_ATTR, '1');
    el.setAttribute('data-wb-head-fonts', '1');
    doc.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

export function useSiteHead({
  site,
  page,
  seo,
  theme,
  language,
  direction,
  targetDocument,
  noindex = false,
}: UseSiteHeadOptions) {
  useEffect(() => {
    const doc = targetDocument || (typeof document !== 'undefined' ? document : null);
    if (!doc || !site) return;

    const resolvedSeo: PageSEO = { ...(page?.seo || {}), ...(seo || {}) };
    const title = resolvedSeo.title || page?.title || site.name;
    const description = resolvedSeo.description || site.description || '';
    const ogTitle = resolvedSeo.ogTitle || title;
    const ogDescription = resolvedSeo.ogDescription || description;
    const ogImage = resolvedSeo.ogImage || '';
    const lang = language || site.defaultLanguage || 'en';
    const dir = direction || theme?.direction || 'ltr';

    // <html lang dir>
    doc.documentElement.setAttribute('lang', lang);
    doc.documentElement.setAttribute('dir', dir);

    // <title>
    doc.title = title;

    // Meta
    if (description) upsertMeta(doc, 'name', 'description', description);
    upsertMeta(doc, 'name', 'viewport', 'width=device-width, initial-scale=1');
    upsertMeta(doc, 'property', 'og:title', ogTitle);
    if (ogDescription) upsertMeta(doc, 'property', 'og:description', ogDescription);
    upsertMeta(doc, 'property', 'og:type', 'website');
    if (ogImage) upsertMeta(doc, 'property', 'og:image', ogImage);
    upsertMeta(doc, 'name', 'twitter:card', ogImage ? 'summary_large_image' : 'summary');
    upsertMeta(doc, 'name', 'twitter:title', ogTitle);
    if (ogDescription) upsertMeta(doc, 'name', 'twitter:description', ogDescription);
    if (ogImage) upsertMeta(doc, 'name', 'twitter:image', ogImage);
    if (noindex) upsertMeta(doc, 'name', 'robots', 'noindex,nofollow');

    // Favicon
    if (site.favicon) upsertLink(doc, 'icon', site.favicon);

    // Canonical (relative path — works pre-domain)
    const canonicalPath = page?.slug
      ? `/public/sites/${site.slug}/${page.slug}`
      : `/public/sites/${site.slug}`;
    upsertLink(doc, 'canonical', canonicalPath);

    // JSON-LD
    upsertScript(doc, 'website', {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: site.name,
      url: canonicalPath,
    });
    if (page) {
      upsertScript(doc, 'webpage', {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: title,
        description,
        inLanguage: lang,
      });
    }

    // Fonts
    if (theme) {
      const families = [extractGoogleFontFamily(theme.headingFont), extractGoogleFontFamily(theme.bodyFont)]
        .filter((f): f is string => !!f);
      injectGoogleFonts(doc, families);
    }

    // Cleanup on unmount only for the noindex flag (leave core tags in place;
    // they'll be overwritten by the next page). We intentionally do NOT strip
    // everything — that would flash empty <title> during transitions.
    return () => {
      if (noindex) {
        const el = doc.head.querySelector('meta[name="robots"][data-wb-head="1"]');
        el?.remove();
      }
    };
  }, [
    targetDocument, site, page, seo, theme, language, direction, noindex,
  ]);
}

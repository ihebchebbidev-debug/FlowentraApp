/**
 * Shared types for the website export system.
 */
import type { WebsiteSite, SitePage, SiteTheme } from '../../types';
import type { BuilderComponent } from '../../types/component';

/** A single file to be included in the exported ZIP */
export interface ExportedFile {
  path: string;
  content: string | Uint8Array;
}

/** Options for export generation */
export interface ExportOptions {
  /** The full site data */
  site: WebsiteSite;
  /** Selected language code (defaults to site.defaultLanguage) */
  language?: string;
  /** Custom form action URL for contact forms */
  formActionUrl?: string;
  /** Whether to include analytics scripts (GA, FB Pixel) */
  includeAnalytics?: boolean;
}

/** Context passed to every block-to-HTML converter */
export interface BlockHtmlContext {
  theme: SiteTheme;
  pages: SitePage[];
  currentPageSlug: string;
  language?: string;
  formActionUrl?: string;
  isHomePage?: boolean;
}

/** Progress callback for the UI */
export interface ExportProgress {
  phase: 'generating' | 'extracting-images' | 'packaging' | 'complete';
  current: number;
  total: number;
  message: string;
  /** Additional metadata */
  imageCount?: number;
  fileCount?: number;
}

export type ExportProgressCallback = (progress: ExportProgress) => void;

/** Helper to get the relative path prefix from a page to the root */
export function getRelativeRoot(page: SitePage): string {
  return page.isHomePage ? '' : '../';
}

/** Helper to get internal page link */
export function getPageLink(targetSlug: string, currentPage: SitePage, pages: SitePage[]): string {
  const target = pages.find(p => p.slug === targetSlug);
  if (!target) return '#';
  const root = getRelativeRoot(currentPage);
  if (target.isHomePage) return root ? root + 'index.html' : 'index.html';
  return root ? root + target.slug + '/index.html' : target.slug + '/index.html';
}

/** Convert inline styles object to CSS string */
export function stylesToCss(styles: React.CSSProperties | undefined): string {
  if (!styles) return '';
  return Object.entries(styles)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => {
      const cssKey = k.replace(/[A-Z]/g, m => '-' + m.toLowerCase());
      const cssVal = typeof v === 'number' && !cssKey.includes('opacity') && !cssKey.includes('z-index') && !cssKey.includes('flex') && !cssKey.includes('order')
        ? v + 'px'
        : String(v);
      return `${cssKey}: ${cssVal}`;
    })
    .join('; ');
}

/** Convert style object to inline style attribute string */
export function styleAttr(styles: React.CSSProperties | undefined): string {
  const css = stylesToCss(styles);
  return css ? ` style="${css}"` : '';
}

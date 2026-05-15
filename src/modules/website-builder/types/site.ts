/**
 * Site-level types: pages, SEO, theme, and top-level site model.
 */
import type { BuilderComponent } from './component';

/** SEO metadata per page */
export interface PageSEO {
  title?: string;
  description?: string;
  ogImage?: string;
  ogTitle?: string;
  ogDescription?: string;
}

/** Per-language translation for a page */
export interface PageTranslation {
  components: BuilderComponent[];
  seo: PageSEO;
}

/** A single page within a site */
export interface SitePage {
  id: string;
  title: string;
  slug: string;
  components: BuilderComponent[];
  seo: PageSEO;
  isHomePage?: boolean;
  order: number;
  translations?: Record<string, PageTranslation>;
}

/** Global site theme */
export interface SiteTheme {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  headingFont: string;
  bodyFont: string;
  borderRadius: number;
  spacing: number;
  direction?: 'ltr' | 'rtl';
  /** Shadow intensity preset */
  shadowStyle?: 'none' | 'subtle' | 'medium' | 'dramatic';
  /** Button style preset */
  buttonStyle?: 'rounded' | 'pill' | 'square' | 'outlined';
  /** Section vertical padding multiplier (0.5–2) */
  sectionPadding?: number;
  /** Global font size scale (0.85–1.25) */
  fontScale?: number;
  /** Heading letter-spacing in em */
  letterSpacing?: number;
  /** Link underline style */
  linkStyle?: 'underline' | 'none' | 'hover-underline';
  /** Heading text-transform */
  headingTransform?: 'none' | 'uppercase' | 'capitalize';
}

export const DEFAULT_THEME: SiteTheme = {
  primaryColor: '#3b82f6',
  secondaryColor: '#64748b',
  accentColor: '#f59e0b',
  backgroundColor: '#ffffff',
  textColor: '#1e293b',
  headingFont: 'Inter, sans-serif',
  bodyFont: 'Inter, sans-serif',
  borderRadius: 8,
  spacing: 16,
  shadowStyle: 'subtle',
  buttonStyle: 'rounded',
  sectionPadding: 1,
  fontScale: 1,
  letterSpacing: 0,
  linkStyle: 'hover-underline',
  headingTransform: 'none',
};

/** Top-level site model */
export interface WebsiteSite {
  id: string;
  name: string;
  slug: string;
  description?: string;
  favicon?: string;
  theme: SiteTheme;
  pages: SitePage[];
  published: boolean;
  publishedAt?: string;
  publishedUrl?: string;
  createdAt: string;
  updatedAt: string;
  defaultLanguage?: string;
  languages?: SiteLanguage[];
}

/** Supported language descriptor */
export interface SiteLanguage {
  code: string;
  label: string;
  direction: 'ltr' | 'rtl';
}

/**
 * Site Templates — Shared types, images, themes, and helpers.
 * The SITE_TEMPLATES array and getTemplateCategories live in ../siteTemplates.ts.
 */
import { SitePage, SiteTheme, SiteLanguage } from '../../types';

export { IMG, AVATAR } from './images';
export { comp, page, makeNavbar, makeFooter } from './helpers';
export * from './themes';

export interface SiteTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  theme: SiteTheme;
  pageCount: number;
  features: string[];
  previewImage: string;
  pages: () => SitePage[];
  /** Available languages for this template */
  languages?: SiteLanguage[];
  /** Translation content keyed by language code */
  translations?: Record<string, Record<string, any>>;
}

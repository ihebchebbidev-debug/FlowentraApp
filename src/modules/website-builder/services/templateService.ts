/**
 * Template Service — Fetch and apply site templates.
 * 
 * Templates are currently static. When integrating a backend,
 * these can be fetched from an API or CMS.
 */
import { WebsiteSite, SiteTheme, SitePage } from '../types';
import { SITE_TEMPLATES, getTemplateById } from '../utils/siteTemplates';
import { getStorageProvider } from './storageProvider';

// Import themes individually
import {
  AUTO_THEME, RESTAURANT_THEME, PORTFOLIO_THEME, MEDICAL_THEME,
  REALESTATE_THEME, FITNESS_THEME, SALON_THEME,
} from '../utils/templates/themes';

// ══════════════════════════════════════════════════════════════════
// Types
// ══════════════════════════════════════════════════════════════════

export interface TemplateMetadata {
  id: string;
  name: string;
  description?: string;
  thumbnail?: string;
  category: string;
  tags?: string[];
  isPremium?: boolean;
}

export interface ThemeMetadata {
  id: string;
  name: string;
  description?: string;
  thumbnail?: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
}

export interface ServiceResult<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

// Theme presets (structured for service layer)
const THEME_PRESETS = [
  { id: 'auto', name: 'Automotive', theme: AUTO_THEME },
  { id: 'restaurant', name: 'Restaurant', theme: RESTAURANT_THEME },
  { id: 'portfolio', name: 'Portfolio', theme: PORTFOLIO_THEME },
  { id: 'medical', name: 'Medical', theme: MEDICAL_THEME },
  { id: 'realestate', name: 'Real Estate', theme: REALESTATE_THEME },
  { id: 'fitness', name: 'Fitness', theme: FITNESS_THEME },
  { id: 'salon', name: 'Salon', theme: SALON_THEME },
];

// ══════════════════════════════════════════════════════════════════
// Template Operations
// ══════════════════════════════════════════════════════════════════

export async function fetchTemplates(): Promise<ServiceResult<TemplateMetadata[]>> {
  try {
    const templates = SITE_TEMPLATES.map(t => ({
      id: t.id,
      name: t.name,
      description: t.description,
      thumbnail: t.previewImage,
      category: t.category || 'general',
      tags: t.features,
    }));
    return { data: templates, error: null, success: true };
  } catch (error) {
    return { data: null, error: 'Failed to fetch templates', success: false };
  }
}

export async function fetchTemplate(templateId: string): Promise<ServiceResult<typeof SITE_TEMPLATES[0] | undefined>> {
  try {
    const template = getTemplateById(templateId);
    if (!template) {
      return { data: null, error: 'Template not found', success: false };
    }
    return { data: template, error: null, success: true };
  } catch (error) {
    return { data: null, error: 'Failed to fetch template', success: false };
  }
}

export async function createSiteFromTemplate(
  templateId: string,
  siteName: string
): Promise<ServiceResult<WebsiteSite>> {
  try {
    const template = getTemplateById(templateId);
    if (!template) {
      return { data: null, error: 'Template not found', success: false };
    }
    
    // Template pages() now include translations directly
    const pages = template.pages();
    
    const provider = getStorageProvider();
    const result = await provider.createSite({
      name: siteName,
      theme: template.theme,
      pages,
      defaultLanguage: 'en',
      languages: template.languages,
    });
    
    return result;
  } catch (error) {
    return { data: null, error: 'Failed to create site from template', success: false };
  }
}

// ══════════════════════════════════════════════════════════════════
// Theme Operations
// ══════════════════════════════════════════════════════════════════

export async function fetchThemes(): Promise<ServiceResult<ThemeMetadata[]>> {
  try {
    const themes = THEME_PRESETS.map(t => ({
      id: t.id,
      name: t.name,
      description: `${t.name} color scheme`,
      thumbnail: undefined,
      colors: {
        primary: t.theme.primaryColor,
        secondary: t.theme.secondaryColor,
        accent: t.theme.accentColor,
        background: t.theme.backgroundColor,
        text: t.theme.textColor,
      },
    }));
    return { data: themes, error: null, success: true };
  } catch (error) {
    return { data: null, error: 'Failed to fetch themes', success: false };
  }
}

export async function applyThemeToSite(
  siteId: string,
  themeId: string
): Promise<ServiceResult<SiteTheme>> {
  try {
    const themePreset = THEME_PRESETS.find(t => t.id === themeId);
    if (!themePreset) {
      return { data: null, error: 'Theme not found', success: false };
    }
    
    const provider = getStorageProvider();
    const siteResult = await provider.getSite(siteId);
    if (!siteResult.success || !siteResult.data) {
      return { data: null, error: 'Site not found', success: false };
    }
    
    const newTheme = { ...siteResult.data.theme, ...themePreset.theme };
    await provider.updateSite({ id: siteId, theme: newTheme });
    
    return { data: newTheme, error: null, success: true };
  } catch (error) {
    return { data: null, error: 'Failed to apply theme', success: false };
  }
}

// ══════════════════════════════════════════════════════════════════
// Category Operations
// ══════════════════════════════════════════════════════════════════

export async function fetchTemplateCategories(): Promise<ServiceResult<string[]>> {
  try {
    const categories = [...new Set(SITE_TEMPLATES.map(t => t.category || 'general'))] as string[];
    return { data: categories, error: null, success: true };
  } catch (error) {
    return { data: null, error: 'Failed to fetch categories', success: false };
  }
}

export async function fetchTemplatesByCategory(category: string): Promise<ServiceResult<TemplateMetadata[]>> {
  try {
    const templates = SITE_TEMPLATES
      .filter(t => (t.category || 'general') === category)
      .map(t => ({
        id: t.id,
        name: t.name,
        description: t.description,
        thumbnail: t.previewImage,
        category: t.category || 'general',
        tags: t.features,
      }));
    return { data: templates, error: null, success: true };
  } catch (error) {
    return { data: null, error: 'Failed to fetch templates', success: false };
  }
}

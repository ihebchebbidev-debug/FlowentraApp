/**
 * Sharing Utilities
 * 
 * Functions for generating share URLs, embed codes, and social sharing.
 */
import type { WebsiteSite } from '../types';

// ══════════════════════════════════════════════════════════════════
// URL Generation
// ══════════════════════════════════════════════════════════════════

export interface ShareUrls {
  publicUrl: string;
  previewUrl: string;
  embedCode: string;
  embedCodeResponsive: string;
  qrCodeUrl: string;
}

export function generateShareUrls(site: WebsiteSite, baseUrl?: string): ShareUrls {
  const base = baseUrl || window.location.origin;
  const publicUrl = `${base}/public/sites/${site.slug}`;
  const previewUrl = `${base}/website-builder/preview/${site.id}`;
  
  // Standard iframe embed
  const embedCode = `<iframe 
  src="${publicUrl}" 
  width="100%" 
  height="600" 
  frameborder="0" 
  allowfullscreen
  title="${site.name}"
></iframe>`;

  // Responsive embed with aspect ratio
  const embedCodeResponsive = `<div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; max-width: 100%;">
  <iframe 
    src="${publicUrl}" 
    style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0;"
    allowfullscreen
    title="${site.name}"
  ></iframe>
</div>`;

  // QR code URL (using a public API)
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(publicUrl)}`;

  return {
    publicUrl,
    previewUrl,
    embedCode,
    embedCodeResponsive,
    qrCodeUrl,
  };
}

// ══════════════════════════════════════════════════════════════════
// Social Sharing
// ══════════════════════════════════════════════════════════════════

export interface SocialShareLinks {
  facebook: string;
  twitter: string;
  linkedin: string;
  whatsapp: string;
  email: string;
  telegram: string;
  pinterest: string;
}

export function generateSocialShareLinks(
  url: string, 
  title: string, 
  description?: string
): SocialShareLinks {
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const encodedDesc = encodeURIComponent(description || title);

  return {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    whatsapp: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
    email: `mailto:?subject=${encodedTitle}&body=${encodedDesc}%0A%0A${encodedUrl}`,
    telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`,
    pinterest: `https://pinterest.com/pin/create/button/?url=${encodedUrl}&description=${encodedTitle}`,
  };
}

// ══════════════════════════════════════════════════════════════════
// Clipboard Utilities
// ══════════════════════════════════════════════════════════════════

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    // Fallback for older browsers
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    
    try {
      document.execCommand('copy');
      document.body.removeChild(textarea);
      return true;
    } catch {
      document.body.removeChild(textarea);
      return false;
    }
  }
}

// ══════════════════════════════════════════════════════════════════
// Export/Import
// ══════════════════════════════════════════════════════════════════

export interface ExportedSite {
  version: string;
  exportedAt: string;
  site: WebsiteSite;
}

export function exportSiteToJson(site: WebsiteSite): string {
  const exportData: ExportedSite = {
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    site: {
      ...site,
      // Remove sensitive/instance-specific data
      id: '',
      published: false,
      publishedAt: undefined,
      createdAt: '',
      updatedAt: '',
    },
  };
  
  return JSON.stringify(exportData, null, 2);
}

export function downloadSiteAsJson(site: WebsiteSite): void {
  const json = exportSiteToJson(site);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `${site.slug || 'website'}-export.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function validateImportedSite(data: unknown): { valid: boolean; error?: string; site?: Partial<WebsiteSite> } {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Invalid file format' };
  }

  const exportData = data as Partial<ExportedSite>;
  
  if (!exportData.site) {
    return { valid: false, error: 'Missing site data' };
  }

  const site = exportData.site;
  
  if (!site.name || typeof site.name !== 'string') {
    return { valid: false, error: 'Invalid site name' };
  }

  if (!Array.isArray(site.pages) || site.pages.length === 0) {
    return { valid: false, error: 'Site must have at least one page' };
  }

  return { valid: true, site };
}

export async function importSiteFromFile(file: File): Promise<{ success: boolean; site?: Partial<WebsiteSite>; error?: string }> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const data = JSON.parse(text);
        const validation = validateImportedSite(data);
        
        if (validation.valid && validation.site) {
          resolve({ success: true, site: validation.site });
        } else {
          resolve({ success: false, error: validation.error });
        }
      } catch (error) {
        resolve({ success: false, error: 'Failed to parse file' });
      }
    };
    
    reader.onerror = () => {
      resolve({ success: false, error: 'Failed to read file' });
    };
    
    reader.readAsText(file);
  });
}

// ══════════════════════════════════════════════════════════════════
// SEO Meta Generator
// ══════════════════════════════════════════════════════════════════

export interface SeoMeta {
  title: string;
  description: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  ogUrl: string;
  twitterCard: string;
  canonical: string;
}

export function generateSeoMeta(
  site: WebsiteSite, 
  pageSlug?: string,
  baseUrl?: string
): SeoMeta {
  const base = baseUrl || window.location.origin;
  const page = pageSlug 
    ? site.pages.find(p => p.slug === pageSlug)
    : site.pages.find(p => p.isHomePage) || site.pages[0];
  
  const seo = page?.seo || {};
  const url = `${base}/public/sites/${site.slug}${pageSlug ? `/${pageSlug}` : ''}`;

  return {
    title: seo.title || page?.title || site.name,
    description: seo.description || site.description || '',
    ogTitle: seo.ogTitle || seo.title || page?.title || site.name,
    ogDescription: seo.ogDescription || seo.description || site.description || '',
    ogImage: seo.ogImage || site.favicon || '',
    ogUrl: url,
    twitterCard: 'summary_large_image',
    canonical: url,
  };
}

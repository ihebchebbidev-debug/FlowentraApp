/**
 * Shared helper functions for building template components and pages.
 */
import { BuilderComponent, SitePage } from '../../types';

let _idCounter = 0;

export function generateTemplateId(): string {
  _idCounter++;
  return `tmpl-${Date.now()}-${_idCounter}-${Math.random().toString(36).slice(2, 7)}`;
}

/** Create a BuilderComponent with auto-generated ID */
export function comp(type: BuilderComponent['type'], label: string, props: Record<string, any>): BuilderComponent {
  return { id: generateTemplateId(), type, label, props, styles: {} };
}

/** Create a SitePage with auto-generated ID */
export function page(title: string, slug: string, components: BuilderComponent[], isHomePage = false, order = 0): SitePage {
  return { id: generateTemplateId(), title, slug, components, seo: { title, description: `${title} page` }, isHomePage, order };
}

/** Default social links for templates */
const DEFAULT_SOCIAL: Array<{ platform: string; url: string }> = [
  { platform: 'facebook', url: '#' },
  { platform: 'instagram', url: '#' },
  { platform: 'twitter', url: '#' },
  { platform: 'linkedin', url: '#' },
];

/** Factory for a reusable navbar component */
export function makeNavbar(
  logo: string,
  links: { label: string; href: string }[],
  ctaText?: string,
  options?: { 
    socialLinks?: Array<{ platform: string; url: string }>; 
    showSearch?: boolean;
    showLanguageSwitcher?: boolean;
    languageSwitcherVariant?: 'icon' | 'flags' | 'dropdown' | 'pills' | 'text';
    languages?: Array<{ code: string; label: string; direction: 'ltr' | 'rtl' }>;
    currentLanguage?: string;
  },
) {
  // Auto-detect if logo is an image path/URL and route to logoImage
  const isImage = logo && (
    logo.startsWith('/') ||
    logo.startsWith('http://') ||
    logo.startsWith('https://') ||
    logo.startsWith('data:')
  ) && /\.(png|jpe?g|gif|webp|svg|avif)(\?|$)/i.test(logo);

  return () =>
    comp('navbar', 'Header', {
      logo: isImage ? '' : logo,
      logoImage: isImage ? logo : '',
      links,
      sticky: true,
      ctaText,
      ctaLink: '#contact',
      socialLinks: options?.socialLinks || DEFAULT_SOCIAL,
      showSearch: options?.showSearch ?? false,
      showLanguageSwitcher: options?.showLanguageSwitcher ?? false,
      languageSwitcherVariant: options?.languageSwitcherVariant ?? 'icon',
      languages: options?.languages,
      currentLanguage: options?.currentLanguage ?? 'en',
    });
}

/** Factory for a reusable footer component */
export function makeFooter(
  companyName: string,
  tagline: string,
  phone: string,
  email: string,
  options?: {
    socialLinks?: Array<{ platform: string; url: string }>;
    links?: Array<{ label: string; href: string }>;
  },
) {
  return () =>
    comp('footer', 'Footer', {
      companyName,
      tagline,
      description: tagline,
      links: options?.links || [
        { label: 'Home', href: '#' },
        { label: 'Services', href: '#services' },
        { label: 'About', href: '#about' },
        { label: 'Contact', href: '#contact' },
      ],
      socialLinks: options?.socialLinks || DEFAULT_SOCIAL,
      showSocial: true,
      phone,
      email,
    });
}

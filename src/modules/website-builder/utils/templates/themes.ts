/**
 * Theme definitions for all site templates.
 * Each theme defines colors, fonts, spacing, shadows, and styling for a specific industry.
 * Enhanced with shadowStyle, buttonStyle, sectionPadding, fontScale, and more.
 */
import { SiteTheme } from '../../types';

// ════════════════════════════════════════════════════════════════════════════
// AUTOMOTIVE — Bold red with industrial feel
// ════════════════════════════════════════════════════════════════════════════
export const AUTO_THEME: SiteTheme = {
  primaryColor: '#dc2626',
  secondaryColor: '#1e293b',
  accentColor: '#f59e0b',
  backgroundColor: '#ffffff',
  textColor: '#0f172a',
  headingFont: 'Space Grotesk, sans-serif',
  bodyFont: 'Inter, sans-serif',
  borderRadius: 8,
  spacing: 16,
  shadowStyle: 'medium',
  buttonStyle: 'rounded',
  sectionPadding: 1.1,
  fontScale: 1,
  letterSpacing: -0.01,
  linkStyle: 'hover-underline',
  headingTransform: 'none',
};

export const AUTO_THEME_DARK: SiteTheme = {
  ...AUTO_THEME,
  backgroundColor: '#0f0f0f',
  textColor: '#f1f5f9',
  secondaryColor: '#334155',
  shadowStyle: 'dramatic',
};

// ════════════════════════════════════════════════════════════════════════════
// RESTAURANT — Warm, elegant with serif headings
// ════════════════════════════════════════════════════════════════════════════
export const RESTAURANT_THEME: SiteTheme = {
  primaryColor: '#b45309',
  secondaryColor: '#44403c',
  accentColor: '#dc2626',
  backgroundColor: '#fffbf5',
  textColor: '#1c1917',
  headingFont: 'Playfair Display, serif',
  bodyFont: 'Lato, sans-serif',
  borderRadius: 6,
  spacing: 18,
  shadowStyle: 'subtle',
  buttonStyle: 'rounded',
  sectionPadding: 1.2,
  fontScale: 1.02,
  letterSpacing: 0,
  linkStyle: 'hover-underline',
  headingTransform: 'none',
};

export const RESTAURANT_THEME_DARK: SiteTheme = {
  ...RESTAURANT_THEME,
  backgroundColor: '#1c1917',
  textColor: '#faf5f0',
  secondaryColor: '#78716c',
  primaryColor: '#d97706',
  shadowStyle: 'medium',
};

// ════════════════════════════════════════════════════════════════════════════
// PORTFOLIO — Modern dark with vibrant accents
// ════════════════════════════════════════════════════════════════════════════
export const PORTFOLIO_THEME: SiteTheme = {
  primaryColor: '#8b5cf6',
  secondaryColor: '#1e293b',
  accentColor: '#06b6d4',
  backgroundColor: '#0f172a',
  textColor: '#e2e8f0',
  headingFont: 'Space Grotesk, sans-serif',
  bodyFont: 'Inter, sans-serif',
  borderRadius: 16,
  spacing: 24,
  shadowStyle: 'dramatic',
  buttonStyle: 'pill',
  sectionPadding: 1.3,
  fontScale: 1.05,
  letterSpacing: -0.02,
  linkStyle: 'none',
  headingTransform: 'none',
};

export const PORTFOLIO_THEME_LIGHT: SiteTheme = {
  ...PORTFOLIO_THEME,
  backgroundColor: '#fafafa',
  textColor: '#0f172a',
  shadowStyle: 'medium',
};

// ════════════════════════════════════════════════════════════════════════════
// MEDICAL — Clean, trustworthy, professional
// ════════════════════════════════════════════════════════════════════════════
export const MEDICAL_THEME: SiteTheme = {
  primaryColor: '#0891b2',
  secondaryColor: '#475569',
  accentColor: '#10b981',
  backgroundColor: '#ffffff',
  textColor: '#1e293b',
  headingFont: 'DM Sans, sans-serif',
  bodyFont: 'Inter, sans-serif',
  borderRadius: 12,
  spacing: 18,
  shadowStyle: 'subtle',
  buttonStyle: 'rounded',
  sectionPadding: 1.1,
  fontScale: 1,
  letterSpacing: 0,
  linkStyle: 'hover-underline',
  headingTransform: 'none',
};

export const MEDICAL_THEME_DARK: SiteTheme = {
  ...MEDICAL_THEME,
  backgroundColor: '#0f1729',
  textColor: '#e2e8f0',
  primaryColor: '#22d3ee',
  shadowStyle: 'medium',
};

// ════════════════════════════════════════════════════════════════════════════
// REAL ESTATE — Premium, trustworthy blue
// ════════════════════════════════════════════════════════════════════════════
export const REALESTATE_THEME: SiteTheme = {
  primaryColor: '#1d4ed8',
  secondaryColor: '#334155',
  accentColor: '#eab308',
  backgroundColor: '#ffffff',
  textColor: '#0f172a',
  headingFont: 'Montserrat, sans-serif',
  bodyFont: 'Open Sans, sans-serif',
  borderRadius: 10,
  spacing: 18,
  shadowStyle: 'medium',
  buttonStyle: 'rounded',
  sectionPadding: 1.15,
  fontScale: 1,
  letterSpacing: 0,
  linkStyle: 'hover-underline',
  headingTransform: 'none',
};

export const REALESTATE_THEME_DARK: SiteTheme = {
  ...REALESTATE_THEME,
  backgroundColor: '#0c1222',
  textColor: '#f1f5f9',
  primaryColor: '#3b82f6',
  shadowStyle: 'dramatic',
};

// ════════════════════════════════════════════════════════════════════════════
// FITNESS — Bold, energetic, dark by default
// ════════════════════════════════════════════════════════════════════════════
export const FITNESS_THEME: SiteTheme = {
  primaryColor: '#ef4444',
  secondaryColor: '#27272a',
  accentColor: '#facc15',
  backgroundColor: '#0a0a0a',
  textColor: '#fafafa',
  headingFont: 'Bebas Neue, sans-serif',
  bodyFont: 'Inter, sans-serif',
  borderRadius: 4,
  spacing: 18,
  shadowStyle: 'dramatic',
  buttonStyle: 'square',
  sectionPadding: 1.2,
  fontScale: 1.1,
  letterSpacing: 0.02,
  linkStyle: 'none',
  headingTransform: 'uppercase',
};

export const FITNESS_THEME_LIGHT: SiteTheme = {
  ...FITNESS_THEME,
  backgroundColor: '#fafafa',
  textColor: '#18181b',
  secondaryColor: '#e4e4e7',
  shadowStyle: 'medium',
};

// ════════════════════════════════════════════════════════════════════════════
// BEAUTY SALON — Soft, feminine, elegant
// ════════════════════════════════════════════════════════════════════════════
export const SALON_THEME: SiteTheme = {
  primaryColor: '#db2777',
  secondaryColor: '#831843',
  accentColor: '#fda4af',
  backgroundColor: '#fff5f7',
  textColor: '#1c1917',
  headingFont: 'Cormorant Garamond, serif',
  bodyFont: 'Nunito, sans-serif',
  borderRadius: 20,
  spacing: 18,
  shadowStyle: 'subtle',
  buttonStyle: 'pill',
  sectionPadding: 1.2,
  fontScale: 1.02,
  letterSpacing: 0,
  linkStyle: 'hover-underline',
  headingTransform: 'none',
};

export const SALON_THEME_DARK: SiteTheme = {
  ...SALON_THEME,
  backgroundColor: '#1a0a10',
  textColor: '#fdf2f4',
  primaryColor: '#f472b6',
  shadowStyle: 'medium',
};

// ════════════════════════════════════════════════════════════════════════════
// LAW FIRM — Classic, authoritative, professional
// ════════════════════════════════════════════════════════════════════════════
export const LAW_THEME: SiteTheme = {
  primaryColor: '#1e3a5f',
  secondaryColor: '#334155',
  accentColor: '#d4a574',
  backgroundColor: '#ffffff',
  textColor: '#1e293b',
  headingFont: 'Merriweather, serif',
  bodyFont: 'Source Sans Pro, sans-serif',
  borderRadius: 4,
  spacing: 18,
  shadowStyle: 'subtle',
  buttonStyle: 'square',
  sectionPadding: 1.1,
  fontScale: 1,
  letterSpacing: 0,
  linkStyle: 'underline',
  headingTransform: 'none',
};

export const LAW_THEME_DARK: SiteTheme = {
  ...LAW_THEME,
  backgroundColor: '#0c1524',
  textColor: '#e2e8f0',
  primaryColor: '#3b82f6',
  accentColor: '#f5d0a9',
  shadowStyle: 'medium',
};

// ════════════════════════════════════════════════════════════════════════════
// PHOTOGRAPHY — Minimal, gallery-focused, dark
// ════════════════════════════════════════════════════════════════════════════
export const PHOTOGRAPHY_THEME: SiteTheme = {
  primaryColor: '#a3a3a3',
  secondaryColor: '#262626',
  accentColor: '#fbbf24',
  backgroundColor: '#000000',
  textColor: '#fafafa',
  headingFont: 'Cormorant Garamond, serif',
  bodyFont: 'Inter, sans-serif',
  borderRadius: 0,
  spacing: 24,
  shadowStyle: 'none',
  buttonStyle: 'outlined',
  sectionPadding: 1.4,
  fontScale: 1.05,
  letterSpacing: 0.02,
  linkStyle: 'none',
  headingTransform: 'uppercase',
};

export const PHOTOGRAPHY_THEME_LIGHT: SiteTheme = {
  ...PHOTOGRAPHY_THEME,
  backgroundColor: '#ffffff',
  textColor: '#0a0a0a',
  primaryColor: '#525252',
  shadowStyle: 'subtle',
};

// ════════════════════════════════════════════════════════════════════════════
// E-COMMERCE — Vibrant, modern, conversion-focused
// ════════════════════════════════════════════════════════════════════════════
export const ECOMMERCE_THEME: SiteTheme = {
  primaryColor: '#7c3aed',
  secondaryColor: '#4c1d95',
  accentColor: '#f97316',
  backgroundColor: '#ffffff',
  textColor: '#1e1b4b',
  headingFont: 'Plus Jakarta Sans, sans-serif',
  bodyFont: 'Inter, sans-serif',
  borderRadius: 14,
  spacing: 18,
  shadowStyle: 'medium',
  buttonStyle: 'rounded',
  sectionPadding: 1.1,
  fontScale: 1,
  letterSpacing: -0.01,
  linkStyle: 'hover-underline',
  headingTransform: 'none',
};

export const ECOMMERCE_THEME_DARK: SiteTheme = {
  ...ECOMMERCE_THEME,
  backgroundColor: '#0c0a1d',
  textColor: '#e8e6f5',
  primaryColor: '#a78bfa',
  shadowStyle: 'dramatic',
};

// ════════════════════════════════════════════════════════════════════════════
// SAAS / STARTUP — Clean, modern, tech-forward
// ════════════════════════════════════════════════════════════════════════════
export const SAAS_THEME: SiteTheme = {
  primaryColor: '#2563eb',
  secondaryColor: '#475569',
  accentColor: '#06b6d4',
  backgroundColor: '#ffffff',
  textColor: '#0f172a',
  headingFont: 'Inter, sans-serif',
  bodyFont: 'Inter, sans-serif',
  borderRadius: 12,
  spacing: 20,
  shadowStyle: 'subtle',
  buttonStyle: 'rounded',
  sectionPadding: 1.2,
  fontScale: 1,
  letterSpacing: -0.01,
  linkStyle: 'hover-underline',
  headingTransform: 'none',
};

export const SAAS_THEME_DARK: SiteTheme = {
  ...SAAS_THEME,
  backgroundColor: '#020617',
  textColor: '#f1f5f9',
  primaryColor: '#3b82f6',
  accentColor: '#22d3ee',
  shadowStyle: 'medium',
};

// ════════════════════════════════════════════════════════════════════════════
// EDUCATION — Friendly, accessible, green
// ════════════════════════════════════════════════════════════════════════════
export const EDUCATION_THEME: SiteTheme = {
  primaryColor: '#059669',
  secondaryColor: '#475569',
  accentColor: '#fbbf24',
  backgroundColor: '#ffffff',
  textColor: '#1e293b',
  headingFont: 'Poppins, sans-serif',
  bodyFont: 'Open Sans, sans-serif',
  borderRadius: 12,
  spacing: 18,
  shadowStyle: 'subtle',
  buttonStyle: 'rounded',
  sectionPadding: 1.15,
  fontScale: 1,
  letterSpacing: 0,
  linkStyle: 'hover-underline',
  headingTransform: 'none',
};

export const EDUCATION_THEME_DARK: SiteTheme = {
  ...EDUCATION_THEME,
  backgroundColor: '#0f1f1a',
  textColor: '#ecfdf5',
  primaryColor: '#34d399',
  shadowStyle: 'medium',
};

// ════════════════════════════════════════════════════════════════════════════
// CLEANING SERVICE — Fresh, clean, trustworthy
// ════════════════════════════════════════════════════════════════════════════
export const CLEANING_THEME: SiteTheme = {
  primaryColor: '#0ea5e9',
  secondaryColor: '#475569',
  accentColor: '#22c55e',
  backgroundColor: '#f8fafc',
  textColor: '#0c4a6e',
  headingFont: 'DM Sans, sans-serif',
  bodyFont: 'Inter, sans-serif',
  borderRadius: 14,
  spacing: 18,
  shadowStyle: 'subtle',
  buttonStyle: 'pill',
  sectionPadding: 1.1,
  fontScale: 1,
  letterSpacing: 0,
  linkStyle: 'hover-underline',
  headingTransform: 'none',
};

export const CLEANING_THEME_DARK: SiteTheme = {
  ...CLEANING_THEME,
  backgroundColor: '#0c1929',
  textColor: '#e0f2fe',
  primaryColor: '#38bdf8',
  shadowStyle: 'medium',
};

// ════════════════════════════════════════════════════════════════════════════
// WEDDING PLANNER — Romantic, elegant, soft
// ════════════════════════════════════════════════════════════════════════════
export const WEDDING_THEME: SiteTheme = {
  primaryColor: '#a78bfa',
  secondaryColor: '#6d28d9',
  accentColor: '#fbbf24',
  backgroundColor: '#fdfaff',
  textColor: '#1e1b4b',
  headingFont: 'Cormorant Garamond, serif',
  bodyFont: 'Nunito, sans-serif',
  borderRadius: 24,
  spacing: 22,
  shadowStyle: 'subtle',
  buttonStyle: 'pill',
  sectionPadding: 1.3,
  fontScale: 1.02,
  letterSpacing: 0,
  linkStyle: 'hover-underline',
  headingTransform: 'none',
};

export const WEDDING_THEME_DARK: SiteTheme = {
  ...WEDDING_THEME,
  backgroundColor: '#0f0a1a',
  textColor: '#ede9fe',
  primaryColor: '#c4b5fd',
  shadowStyle: 'medium',
};

// ════════════════════════════════════════════════════════════════════════════
// CONSULTING — Professional, teal, modern
// ════════════════════════════════════════════════════════════════════════════
export const CONSULTING_THEME: SiteTheme = {
  primaryColor: '#0f766e',
  secondaryColor: '#475569',
  accentColor: '#f59e0b',
  backgroundColor: '#ffffff',
  textColor: '#1e293b',
  headingFont: 'DM Serif Display, serif',
  bodyFont: 'Inter, sans-serif',
  borderRadius: 10,
  spacing: 18,
  shadowStyle: 'subtle',
  buttonStyle: 'rounded',
  sectionPadding: 1.15,
  fontScale: 1,
  letterSpacing: 0,
  linkStyle: 'hover-underline',
  headingTransform: 'none',
};

export const CONSULTING_THEME_DARK: SiteTheme = {
  ...CONSULTING_THEME,
  backgroundColor: '#0a1a18',
  textColor: '#f0fdfa',
  primaryColor: '#14b8a6',
  shadowStyle: 'medium',
};

// ════════════════════════════════════════════════════════════════════════════
// NONPROFIT — Warm, approachable, orange
// ════════════════════════════════════════════════════════════════════════════
export const NONPROFIT_THEME: SiteTheme = {
  primaryColor: '#ea580c',
  secondaryColor: '#475569',
  accentColor: '#16a34a',
  backgroundColor: '#ffffff',
  textColor: '#1c1917',
  headingFont: 'Outfit, sans-serif',
  bodyFont: 'Inter, sans-serif',
  borderRadius: 14,
  spacing: 18,
  shadowStyle: 'subtle',
  buttonStyle: 'rounded',
  sectionPadding: 1.15,
  fontScale: 1,
  letterSpacing: 0,
  linkStyle: 'hover-underline',
  headingTransform: 'none',
};

export const NONPROFIT_THEME_DARK: SiteTheme = {
  ...NONPROFIT_THEME,
  backgroundColor: '#1a0f0a',
  textColor: '#fff7ed',
  primaryColor: '#fb923c',
  shadowStyle: 'medium',
};

// ════════════════════════════════════════════════════════════════════════════
// CAFÉ / BAKERY — Cozy, warm, artisanal
// ════════════════════════════════════════════════════════════════════════════
export const CAFE_THEME: SiteTheme = {
  primaryColor: '#92400e',
  secondaryColor: '#57534e',
  accentColor: '#d97706',
  backgroundColor: '#fffbf5',
  textColor: '#292524',
  headingFont: 'Playfair Display, serif',
  bodyFont: 'Lato, sans-serif',
  borderRadius: 10,
  spacing: 18,
  shadowStyle: 'subtle',
  buttonStyle: 'rounded',
  sectionPadding: 1.2,
  fontScale: 1.02,
  letterSpacing: 0,
  linkStyle: 'hover-underline',
  headingTransform: 'none',
};

export const CAFE_THEME_DARK: SiteTheme = {
  ...CAFE_THEME,
  backgroundColor: '#1c1410',
  textColor: '#fef3e2',
  primaryColor: '#d97706',
  shadowStyle: 'medium',
};

// ════════════════════════════════════════════════════════════════════════════
// CREATIVE AGENCY — Bold, modern, dark
// ════════════════════════════════════════════════════════════════════════════
export const AGENCY_THEME: SiteTheme = {
  primaryColor: '#e11d48',
  secondaryColor: '#334155',
  accentColor: '#38bdf8',
  backgroundColor: '#020617',
  textColor: '#f8fafc',
  headingFont: 'Space Grotesk, sans-serif',
  bodyFont: 'Inter, sans-serif',
  borderRadius: 16,
  spacing: 22,
  shadowStyle: 'dramatic',
  buttonStyle: 'pill',
  sectionPadding: 1.3,
  fontScale: 1.05,
  letterSpacing: -0.02,
  linkStyle: 'none',
  headingTransform: 'none',
};

export const AGENCY_THEME_LIGHT: SiteTheme = {
  ...AGENCY_THEME,
  backgroundColor: '#fafafa',
  textColor: '#0f172a',
  shadowStyle: 'medium',
};

// ════════════════════════════════════════════════════════════════════════════
// PET CARE — Friendly, playful, green
// ════════════════════════════════════════════════════════════════════════════
export const PETCARE_THEME: SiteTheme = {
  primaryColor: '#16a34a',
  secondaryColor: '#475569',
  accentColor: '#f59e0b',
  backgroundColor: '#fefff5',
  textColor: '#1a2e05',
  headingFont: 'Nunito, sans-serif',
  bodyFont: 'Open Sans, sans-serif',
  borderRadius: 16,
  spacing: 18,
  shadowStyle: 'subtle',
  buttonStyle: 'pill',
  sectionPadding: 1.15,
  fontScale: 1,
  letterSpacing: 0,
  linkStyle: 'hover-underline',
  headingTransform: 'none',
};

export const PETCARE_THEME_DARK: SiteTheme = {
  ...PETCARE_THEME,
  backgroundColor: '#0a1a0a',
  textColor: '#ecfdf5',
  primaryColor: '#4ade80',
  shadowStyle: 'medium',
};

// ════════════════════════════════════════════════════════════════════════════
// TRAVEL AGENCY — Adventurous, inspiring, blue-orange
// ════════════════════════════════════════════════════════════════════════════
export const TRAVEL_THEME: SiteTheme = {
  primaryColor: '#0284c7',
  secondaryColor: '#475569',
  accentColor: '#f97316',
  backgroundColor: '#ffffff',
  textColor: '#0c4a6e',
  headingFont: 'Montserrat, sans-serif',
  bodyFont: 'Lato, sans-serif',
  borderRadius: 12,
  spacing: 18,
  shadowStyle: 'medium',
  buttonStyle: 'rounded',
  sectionPadding: 1.15,
  fontScale: 1,
  letterSpacing: 0,
  linkStyle: 'hover-underline',
  headingTransform: 'none',
};

export const TRAVEL_THEME_DARK: SiteTheme = {
  ...TRAVEL_THEME,
  backgroundColor: '#0a1929',
  textColor: '#e0f2fe',
  primaryColor: '#38bdf8',
  shadowStyle: 'dramatic',
};

// ════════════════════════════════════════════════════════════════════════════
// DENTAL OFFICE — Clean, fresh, teal
// ════════════════════════════════════════════════════════════════════════════
export const DENTAL_THEME: SiteTheme = {
  primaryColor: '#0d9488',
  secondaryColor: '#475569',
  accentColor: '#60a5fa',
  backgroundColor: '#f9fffe',
  textColor: '#134e4a',
  headingFont: 'DM Sans, sans-serif',
  bodyFont: 'Inter, sans-serif',
  borderRadius: 14,
  spacing: 18,
  shadowStyle: 'subtle',
  buttonStyle: 'rounded',
  sectionPadding: 1.1,
  fontScale: 1,
  letterSpacing: 0,
  linkStyle: 'hover-underline',
  headingTransform: 'none',
};

export const DENTAL_THEME_DARK: SiteTheme = {
  ...DENTAL_THEME,
  backgroundColor: '#0a1a1a',
  textColor: '#ccfbf1',
  primaryColor: '#2dd4bf',
  shadowStyle: 'medium',
};

// ════════════════════════════════════════════════════════════════════════════
// CHURCH / MINISTRY — Spiritual, welcoming, purple
// ════════════════════════════════════════════════════════════════════════════
export const CHURCH_THEME: SiteTheme = {
  primaryColor: '#7e22ce',
  secondaryColor: '#6b7280',
  accentColor: '#d97706',
  backgroundColor: '#fdfaff',
  textColor: '#1e1b4b',
  headingFont: 'Playfair Display, serif',
  bodyFont: 'Nunito, sans-serif',
  borderRadius: 10,
  spacing: 18,
  shadowStyle: 'subtle',
  buttonStyle: 'rounded',
  sectionPadding: 1.2,
  fontScale: 1.02,
  letterSpacing: 0,
  linkStyle: 'hover-underline',
  headingTransform: 'none',
};

export const CHURCH_THEME_DARK: SiteTheme = {
  ...CHURCH_THEME,
  backgroundColor: '#0f0a1a',
  textColor: '#f3e8ff',
  primaryColor: '#a855f7',
  shadowStyle: 'medium',
};

// ════════════════════════════════════════════════════════════════════════════
// FASHION BOUTIQUE — Luxury, minimal, editorial
// ════════════════════════════════════════════════════════════════════════════
export const BOUTIQUE_THEME: SiteTheme = {
  primaryColor: '#0f0f0f',
  secondaryColor: '#525252',
  accentColor: '#c9a96e',
  backgroundColor: '#fafaf9',
  textColor: '#1c1917',
  headingFont: 'Cormorant Garamond, serif',
  bodyFont: 'Inter, sans-serif',
  borderRadius: 0,
  spacing: 24,
  shadowStyle: 'none',
  buttonStyle: 'outlined',
  sectionPadding: 1.4,
  fontScale: 1.05,
  letterSpacing: 0.02,
  linkStyle: 'none',
  headingTransform: 'uppercase',
};

export const BOUTIQUE_THEME_DARK: SiteTheme = {
  ...BOUTIQUE_THEME,
  backgroundColor: '#0a0a0a',
  textColor: '#fafafa',
  primaryColor: '#fafafa',
  accentColor: '#d4b896',
  shadowStyle: 'subtle',
};

// ════════════════════════════════════════════════════════════════════════════
// INTERNATIONAL BUSINESS — Global, professional, teal
// ════════════════════════════════════════════════════════════════════════════
export const INTERNATIONAL_THEME: SiteTheme = {
  primaryColor: '#0f766e',
  secondaryColor: '#475569',
  accentColor: '#f59e0b',
  backgroundColor: '#ffffff',
  textColor: '#1e293b',
  headingFont: 'Inter, sans-serif',
  bodyFont: 'Inter, sans-serif',
  borderRadius: 12,
  spacing: 20,
  shadowStyle: 'medium',
  buttonStyle: 'rounded',
  sectionPadding: 1.15,
  fontScale: 1,
  letterSpacing: -0.01,
  linkStyle: 'hover-underline',
  headingTransform: 'none',
};

export const INTERNATIONAL_THEME_DARK: SiteTheme = {
  ...INTERNATIONAL_THEME,
  backgroundColor: '#0a1a18',
  textColor: '#f0fdfa',
  primaryColor: '#14b8a6',
  accentColor: '#fbbf24',
  shadowStyle: 'dramatic',
};

// ════════════════════════════════════════════════════════════════════════════
// PAINT & BODY SHOP — Dark aurora gradient, premium feel
// ════════════════════════════════════════════════════════════════════════════
export const BODY_SHOP_THEME: SiteTheme = {
  primaryColor: '#a78bfa',
  secondaryColor: '#94a3b8',
  accentColor: '#06b6d4',
  backgroundColor: '#0c0c1e',
  textColor: '#f1f5f9',
  headingFont: 'Montserrat, sans-serif',
  bodyFont: 'DM Sans, sans-serif',
  borderRadius: 12,
  spacing: 20,
  shadowStyle: 'dramatic',
  buttonStyle: 'rounded',
  sectionPadding: 1.2,
  fontScale: 1.05,
  letterSpacing: -0.01,
  linkStyle: 'none',
  headingTransform: 'uppercase',
};

// ════════════════════════════════════════════════════════════════════════════
// PREMIUM E-COMMERCE — Luxury, dark with gold accents
// ════════════════════════════════════════════════════════════════════════════
export const PREMIUM_ECOM_THEME: SiteTheme = {
  primaryColor: '#c9a96e',
  secondaryColor: '#94a3b8',
  accentColor: '#e11d48',
  backgroundColor: '#0a0a0f',
  textColor: '#f1f5f9',
  headingFont: 'Cormorant Garamond, serif',
  bodyFont: 'DM Sans, sans-serif',
  borderRadius: 12,
  spacing: 22,
  shadowStyle: 'dramatic',
  buttonStyle: 'rounded',
  sectionPadding: 1.3,
  fontScale: 1.05,
  letterSpacing: -0.01,
  linkStyle: 'none',
  headingTransform: 'none',
};

export const PREMIUM_ECOM_THEME_LIGHT: SiteTheme = {
  ...PREMIUM_ECOM_THEME,
  backgroundColor: '#fafaf8',
  textColor: '#1c1917',
  primaryColor: '#92400e',
  shadowStyle: 'medium',
};

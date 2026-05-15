import { getCompanyLogoRef, getCompanyLogoBase64, getCompanyLogoCachedBase64 } from '@/hooks/companyLogoUtils';
export { getCompanyLogoBase64 };
export const getCompanyLogoUrl = getCompanyLogoRef;

/**
 * Sanitize a logo value for use in @react-pdf/renderer <Image>.
 * Only base64 data URIs are safe cross-origin. Raw URLs to static files
 * will cause CORS errors in the PDF renderer, so we strip them.
 */
export function sanitizeLogoForPdf(logo: string | undefined): string {
  if (!logo) return '';
  if (logo.startsWith('data:image/')) return logo;
  // Any non-base64 value (URL) would cause CORS errors in react-pdf
  return '';
}

export interface PdfSettings {
  // Typography
  fontFamily: string;
  fontSize: {
    header: number;
    title: number;
    body: number;
    small: number;
  };
  
  // Colors
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    text: string;
    background: string;
    border: string;
    gradient?: string;
  };
  
  // Layout
  margins: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  
  // Company Info
  company: {
    name: string;
    tagline: string;
    address: string;
    phone: string;
    email: string;
    website: string;
    logo?: string;
    footerMessage?: string;
  };
  
  // Data Display
  showElements: {
    customerInfo: boolean;
    serviceLocation: boolean;
    itemsTable: boolean;
    summary: boolean;
    footer: boolean;
    logo: boolean;
    companyName: boolean;
    orderDetails: boolean;
    watermark: boolean;
    pageNumbers: boolean;
  };
  
  // Logo settings
  logoSize: number;
  
  // Table Settings
  table: {
    showPositions: boolean;
    showArticleCodes: boolean;
    showQuantity: boolean;
    showUnitPrice: boolean;
    alternateRowColors: boolean;
    borderStyle: string;
    headerStyle: string;
  };
  
  // Advanced Settings
  advanced: {
    compression: number;
    quality: string;
    watermarkText: string;
    watermarkOpacity: number;
    headerHeight: number;
    footerHeight: number;
    lineHeight: number;
  };
  
  // Formatting
  dateFormat: string;
  currencySymbol: string;
  taxRate: number;
  paperSize: string;
  orientation: string;
  
  // Mobile Optimizations
  mobileOptimized: boolean;
  templateStyle: string;
}

export const defaultSettings: PdfSettings = {
  fontFamily: 'Helvetica',
  fontSize: {
    header: 10,
    title: 10,
    body: 10,
    small: 10,
  },
  colors: {
    primary: '#FFFFFF',
    secondary: '#34495E',
    accent: '#3498DB',
    text: '#000000',
    background: '#FFFFFF',
    border: '#E1E5E9',
    gradient: 'linear-gradient(135deg, #2C3E50, #34495E)',
  },
  margins: {
    top: 24,
    bottom: 24,
    left: 24,
    right: 24,
  },
  company: {
    name: 'PEAK SOLUTIONS',
    tagline: 'Mountain Service Excellence',
    address: '1234 Service Street, Tech City, TC 12345',
    phone: '(555) 123-4567',
    email: 'service@peaksolutions.com',
    website: 'www.peaksolutions.com',
    logo: getCompanyLogoCachedBase64() || '',
    footerMessage: 'Thank you for your business. We look forward to serving you again.',
  },
  showElements: {
    customerInfo: true,
    serviceLocation: true,
    itemsTable: true,
    summary: true,
    footer: false,
    logo: true,
    companyName: false,
    orderDetails: true,
    watermark: false,
    pageNumbers: true,
  },
  logoSize: 880,
  table: {
    showPositions: true,
    showArticleCodes: true,
    showQuantity: true,
    showUnitPrice: true,
    alternateRowColors: true,
    borderStyle: 'solid',
    headerStyle: 'filled',
  },
  advanced: {
    compression: 80,
    quality: 'high',
    watermarkText: 'CONFIDENTIAL',
    watermarkOpacity: 10,
    headerHeight: 80,
    footerHeight: 60,
    lineHeight: 1.4,
  },
  dateFormat: 'de-DE',
  currencySymbol: '€',
  taxRate: 19,
  paperSize: 'A4',
  orientation: 'portrait',
  mobileOptimized: true,
  templateStyle: 'professional',
};

// Predefined color themes
export const colorThemes = [
  { name: 'Professional Blue', primary: '#2C3E50', secondary: '#34495E', accent: '#3498DB' },
  { name: 'Corporate Green', primary: '#27AE60', secondary: '#2ECC71', accent: '#16A085' },
  { name: 'Modern Purple', primary: '#8E44AD', secondary: '#9B59B6', accent: '#E74C3C' },
  { name: 'Elegant Gray', primary: '#34495E', secondary: '#7F8C8D', accent: '#E67E22' },
  { name: 'Tech Orange', primary: '#E67E22', secondary: '#F39C12', accent: '#D35400' },
];

export const paperSizes = [
  { value: 'A4', label: 'A4 (210 × 297 mm)' },
  { value: 'LETTER', label: 'Letter (8.5 × 11 in)' },
  { value: 'LEGAL', label: 'Legal (8.5 × 14 in)' },
];

export const templateStyles = [
  { value: 'professional', label: 'Professional' },
  { value: 'modern', label: 'Modern' },
  { value: 'minimal', label: 'Minimal' },
  { value: 'classic', label: 'Classic' },
];

export const formatDisplayName = (key: string): string => {
  return key.replace(/([A-Z])/g, ' $1').trim();
};

export const updateNestedObject = (obj: any, path: string, value: any): any => {
  const keys = path.split('.');
  const updated = { ...obj };
  let current: any = updated;
  
  for (let i = 0; i < keys.length - 1; i++) {
    current[keys[i]] = { ...current[keys[i]] };
    current = current[keys[i]];
  }
  
  current[keys[keys.length - 1]] = value;
  return updated;
};
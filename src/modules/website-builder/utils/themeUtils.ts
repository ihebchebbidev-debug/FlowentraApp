/**
 * Theme Utilities — Helper functions to apply global theme settings
 * (fontScale, letterSpacing, shadowStyle, buttonStyle, sectionPadding)
 * consistently across all block renderers.
 */
import React from 'react';
import { SiteTheme } from '../types';

// ═══════════════════════════════════════
// COLOR UTILITIES
// ═══════════════════════════════════════

/**
 * Determine if a hex color is "dark" by computing relative luminance.
 */
export function isDarkColor(hex: string | undefined): boolean {
  if (!hex || !hex.startsWith('#')) return false;
  let c = hex.slice(1);
  if (c.length === 3) c = c[0]+c[0]+c[1]+c[1]+c[2]+c[2];
  if (c.length === 8) c = c.slice(0, 6);
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance < 0.45;
}

/** Lighten a hex color by `amount` (0-255 per channel). */
function lightenHex(hex: string, amount: number): string {
  let c = hex.replace('#', '');
  if (c.length === 3) c = c[0]+c[0]+c[1]+c[1]+c[2]+c[2];
  if (c.length === 8) c = c.slice(0, 6);
  const r = Math.min(255, parseInt(c.substring(0, 2), 16) + amount);
  const g = Math.min(255, parseInt(c.substring(2, 4), 16) + amount);
  const b = Math.min(255, parseInt(c.substring(4, 6), 16) + amount);
  return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
}

/**
 * Get a theme-aware card background for dark themes.
 * Returns a slightly lighter hex on dark backgrounds, or empty string for light themes.
 */
export function getCardBgColor(theme: SiteTheme, sectionBgColor?: string): string {
  const bg = sectionBgColor || theme.backgroundColor;
  if (isDarkColor(bg)) {
    return lightenHex(bg, 12);
  }
  return '';
}

// ═══════════════════════════════════════
// FONT SCALE
// ═══════════════════════════════════════

/**
 * Get scaled font size based on theme.fontScale (default 1).
 * @param baseSizePx - Base font size in pixels
 * @param theme - SiteTheme object
 * @returns Scaled font size string (e.g., "16px")
 */
export function getScaledFontSize(baseSizePx: number, theme: SiteTheme): string {
  const scale = theme.fontScale ?? 1;
  return `${Math.round(baseSizePx * scale)}px`;
}

/**
 * Get font scale multiplier from theme.
 */
export function getFontScale(theme: SiteTheme): number {
  return theme.fontScale ?? 1;
}

/**
 * Get CSS style object with scaled font size.
 */
export function getScaledFontStyle(baseSizePx: number, theme: SiteTheme): React.CSSProperties {
  return { fontSize: getScaledFontSize(baseSizePx, theme) };
}

// ═══════════════════════════════════════
// LETTER SPACING (for headings)
// ═══════════════════════════════════════

/**
 * Get letter-spacing value for headings.
 * @param theme - SiteTheme object
 * @returns Letter-spacing string (e.g., "0.02em") or undefined
 */
export function getHeadingLetterSpacing(theme: SiteTheme): string | undefined {
  const spacing = theme.letterSpacing;
  if (spacing === undefined || spacing === 0) return undefined;
  return `${spacing}em`;
}

/**
 * Get CSS style object for heading typography including letterSpacing and textTransform.
 */
export function getHeadingStyle(theme: SiteTheme, overrides?: React.CSSProperties): React.CSSProperties {
  const letterSpacing = getHeadingLetterSpacing(theme);
  const textTransform = theme.headingTransform || 'none';
  
  return {
    fontFamily: theme.headingFont,
    letterSpacing: letterSpacing,
    textTransform: textTransform === 'none' ? undefined : textTransform,
    ...overrides,
  };
}

// ═══════════════════════════════════════
// SHADOW STYLE
// ═══════════════════════════════════════

type ShadowPreset = 'none' | 'subtle' | 'medium' | 'dramatic';

const SHADOW_MAP: Record<ShadowPreset, string> = {
  none: 'none',
  subtle: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)',
  medium: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)',
  dramatic: '0 10px 25px -5px rgba(0,0,0,0.15), 0 8px 10px -6px rgba(0,0,0,0.1)',
};

const SHADOW_HOVER_MAP: Record<ShadowPreset, string> = {
  none: 'none',
  subtle: '0 2px 4px rgba(0,0,0,0.1), 0 1px 3px rgba(0,0,0,0.08)',
  medium: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)',
  dramatic: '0 20px 40px -10px rgba(0,0,0,0.2), 0 12px 20px -8px rgba(0,0,0,0.12)',
};

/**
 * Get box-shadow value based on theme.shadowStyle.
 */
export function getThemeShadow(theme: SiteTheme): string {
  const style = theme.shadowStyle ?? 'subtle';
  return SHADOW_MAP[style];
}

/**
 * Get hover box-shadow value based on theme.shadowStyle.
 */
export function getThemeShadowHover(theme: SiteTheme): string {
  const style = theme.shadowStyle ?? 'subtle';
  return SHADOW_HOVER_MAP[style];
}

/**
 * Get CSS class for shadow based on theme.shadowStyle.
 * Returns Tailwind-compatible shadow classes.
 */
export function getThemeShadowClass(theme: SiteTheme): string {
  const style = theme.shadowStyle ?? 'subtle';
  switch (style) {
    case 'none': return '';
    case 'subtle': return 'shadow-sm';
    case 'medium': return 'shadow-md';
    case 'dramatic': return 'shadow-xl';
    default: return 'shadow-sm';
  }
}

// ═══════════════════════════════════════
// BUTTON STYLE
// ═══════════════════════════════════════

type ButtonStylePreset = 'rounded' | 'pill' | 'square' | 'outlined';

/**
 * Get border-radius for buttons based on theme.buttonStyle.
 */
export function getButtonBorderRadius(theme: SiteTheme): string {
  const style = theme.buttonStyle ?? 'rounded';
  switch (style) {
    case 'square': return '0px';
    case 'pill': return '9999px';
    case 'rounded': return `${theme.borderRadius}px`;
    case 'outlined': return `${theme.borderRadius}px`;
    default: return `${theme.borderRadius}px`;
  }
}

/**
 * Get button style object based on theme settings.
 * @param variant - Button variant (primary, secondary, outline, ghost)
 * @param theme - SiteTheme object
 * @param customColor - Optional custom background color
 * @param customTextColor - Optional custom text color
 */
export function getButtonStyle(
  variant: 'primary' | 'secondary' | 'outline' | 'ghost',
  theme: SiteTheme,
  customColor?: string,
  customTextColor?: string
): React.CSSProperties {
  const borderRadius = getButtonBorderRadius(theme);
  const btnColor = customColor || theme.primaryColor;
  const btnTextColor = customTextColor || '#ffffff';
  const isOutlinedTheme = theme.buttonStyle === 'outlined';
  
  // For 'outlined' buttonStyle, all primary buttons become outline style
  if (isOutlinedTheme && variant === 'primary') {
    return {
      borderRadius,
      border: `2px solid ${btnColor}`,
      color: btnColor,
      backgroundColor: 'transparent',
    };
  }
  
  const variantStyles: Record<string, React.CSSProperties> = {
    primary: { backgroundColor: btnColor, color: btnTextColor, borderRadius },
    secondary: { backgroundColor: customColor || theme.secondaryColor, color: btnTextColor, borderRadius },
    outline: { border: `2px solid ${btnColor}`, color: btnColor, backgroundColor: 'transparent', borderRadius },
    ghost: { color: btnColor, backgroundColor: 'transparent', borderRadius },
  };
  
  return variantStyles[variant] || variantStyles.primary;
}

// ═══════════════════════════════════════
// SECTION PADDING
// ═══════════════════════════════════════

/**
 * Get section padding multiplier (default 1).
 */
export function getSectionPaddingMultiplier(theme: SiteTheme): number {
  return theme.sectionPadding ?? 1;
}

/**
 * Get vertical padding for sections in pixels.
 * Base padding is 64px (py-16), multiplied by sectionPadding.
 */
export function getSectionPadding(theme: SiteTheme, basePx: number = 64): number {
  const multiplier = getSectionPaddingMultiplier(theme);
  return Math.round(basePx * multiplier);
}

/**
 * Get section padding CSS style object.
 * @param theme - SiteTheme object
 * @param horizontalPx - Horizontal padding in pixels (default 24)
 */
export function getSectionPaddingStyle(theme: SiteTheme, horizontalPx: number = 24): React.CSSProperties {
  const verticalPx = getSectionPadding(theme);
  return {
    paddingTop: `${verticalPx}px`,
    paddingBottom: `${verticalPx}px`,
    paddingLeft: `${horizontalPx}px`,
    paddingRight: `${horizontalPx}px`,
  };
}

/**
 * Get section padding Tailwind class.
 * Returns approximate Tailwind class based on multiplier.
 */
export function getSectionPaddingClass(theme: SiteTheme): string {
  const multiplier = getSectionPaddingMultiplier(theme);
  if (multiplier <= 0.6) return 'py-8 px-6';
  if (multiplier <= 0.8) return 'py-12 px-6';
  if (multiplier <= 1.2) return 'py-16 px-6';
  if (multiplier <= 1.5) return 'py-20 px-6';
  return 'py-24 px-6';
}

// ═══════════════════════════════════════
// CARD STYLES (combines shadow + border radius)
// ═══════════════════════════════════════

/**
 * Get card style object with theme-aware shadow and border radius.
 */
export function getCardStyle(theme: SiteTheme, overrides?: React.CSSProperties): React.CSSProperties {
  return {
    borderRadius: `${theme.borderRadius}px`,
    boxShadow: getThemeShadow(theme),
    ...overrides,
  };
}

// ═══════════════════════════════════════
// LINK STYLE
// ═══════════════════════════════════════

/**
 * Get text decoration for links based on theme.linkStyle.
 */
export function getLinkStyle(theme: SiteTheme): React.CSSProperties {
  const style = theme.linkStyle ?? 'hover-underline';
  switch (style) {
    case 'underline': return { textDecoration: 'underline' };
    case 'none': return { textDecoration: 'none' };
    case 'hover-underline': return { textDecoration: 'none' };
    default: return { textDecoration: 'none' };
  }
}

/**
 * Get link CSS class for hover behavior.
 */
export function getLinkClass(theme: SiteTheme): string {
  const style = theme.linkStyle ?? 'hover-underline';
  switch (style) {
    case 'underline': return 'underline';
    case 'none': return 'no-underline hover:no-underline';
    case 'hover-underline': return 'no-underline hover:underline';
    default: return 'no-underline hover:underline';
  }
}

// ═══════════════════════════════════════
// COMPOSITE HELPERS
// ═══════════════════════════════════════

/**
 * Get all base section styles (padding, font family).
 */
export function getBaseSectionStyle(theme: SiteTheme, bgColor?: string): React.CSSProperties {
  return {
    ...getSectionPaddingStyle(theme),
    fontFamily: theme.bodyFont,
    backgroundColor: bgColor || 'transparent',
  };
}

/**
 * Get heading element style with all typography settings applied.
 */
export function getFullHeadingStyle(
  theme: SiteTheme,
  baseFontSizePx: number,
  color?: string,
  overrides?: React.CSSProperties
): React.CSSProperties {
  return {
    ...getHeadingStyle(theme),
    fontSize: getScaledFontSize(baseFontSizePx, theme),
    color: color || theme.textColor,
    ...overrides,
  };
}

/**
 * Get body text style with scaled font size.
 */
export function getBodyTextStyle(
  theme: SiteTheme,
  baseFontSizePx: number,
  color?: string,
  overrides?: React.CSSProperties
): React.CSSProperties {
  return {
    fontFamily: theme.bodyFont,
    fontSize: getScaledFontSize(baseFontSizePx, theme),
    color: color || theme.textColor,
    ...overrides,
  };
}

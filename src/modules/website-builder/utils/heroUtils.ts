/**
 * Hero Utilities — Shared helpers for all hero block variants.
 * Extracted to reduce duplication and ensure consistency.
 */
import React from 'react';
import { SiteTheme } from '../types/site';
import { CTAButton } from '../types/shared';
import { getButtonStyle, getThemeShadow, getSectionPaddingMultiplier } from './themeUtils';

// ══════════════════════════════════════════════════════════════════
// Height Calculations
// ══════════════════════════════════════════════════════════════════

export type HeroHeight = 'small' | 'medium' | 'large' | 'fullscreen';

const BASE_HEIGHTS: Record<HeroHeight, number> = {
  small: 300,
  medium: 500,
  large: 700,
  fullscreen: 0, // Uses min-h-screen
};

/**
 * Get the CSS class for hero height, respecting theme's sectionPadding multiplier.
 */
export function getHeroHeightClass(height: HeroHeight = 'medium', theme?: SiteTheme): string {
  if (height === 'fullscreen') return 'min-h-screen';
  
  const base = BASE_HEIGHTS[height] ?? 500;
  const multiplier = theme ? getSectionPaddingMultiplier(theme) : 1;
  const adjusted = Math.round(base * multiplier);
  
  return `min-h-[${adjusted}px]`;
}

/**
 * Get the CSS class for content alignment.
 */
export function getAlignmentClass(alignment: 'left' | 'center' | 'right' = 'center'): string {
  switch (alignment) {
    case 'left': return 'text-left items-start';
    case 'right': return 'text-right items-end';
    default: return 'text-center items-center';
  }
}

/**
 * Get button justify class for alignment.
 */
export function getButtonAlignClass(alignment: 'left' | 'center' | 'right' = 'center'): string {
  switch (alignment) {
    case 'left': return 'justify-start';
    case 'right': return 'justify-end';
    default: return 'justify-center';
  }
}

// ══════════════════════════════════════════════════════════════════
// Button Handling
// ══════════════════════════════════════════════════════════════════

/**
 * Build a unified button list from either the new `buttons` array
 * or legacy `ctaText/ctaLink` props.
 */
export function buildHeroButtonList(
  buttons?: CTAButton[],
  ctaText?: string,
  ctaLink?: string,
  secondaryCtaText?: string,
  secondaryCtaLink?: string,
  defaultColor?: string,
  defaultTextColor?: string
): CTAButton[] {
  if (buttons && buttons.length > 0) {
    return buttons;
  }
  
  const result: CTAButton[] = [];
  
  if (ctaText) {
    result.push({
      text: ctaText,
      link: ctaLink || '#',
      color: defaultColor,
      textColor: defaultTextColor,
      variant: 'primary',
    });
  }
  
  if (secondaryCtaText) {
    result.push({
      text: secondaryCtaText,
      link: secondaryCtaLink || '#',
      variant: 'outline',
    });
  }
  
  return result;
}

/**
 * Get button styles for hero blocks with proper theme application.
 */
export function getHeroButtonStyle(
  button: CTAButton,
  theme: SiteTheme,
  defaultColor: string,
  defaultTextColor: string
): React.CSSProperties {
  const variant = button.variant || 'primary';
  const baseStyles = getButtonStyle(
    variant,
    theme,
    button.color || defaultColor,
    button.textColor || defaultTextColor
  );
  
  // Add shadow for primary/secondary buttons
  const shadow = (variant === 'primary' || variant === 'secondary') && theme.shadowStyle !== 'none'
    ? { boxShadow: getThemeShadow(theme) }
    : {};
  
  return { ...baseStyles, ...shadow };
}

// ══════════════════════════════════════════════════════════════════
// Color Resolution
// ══════════════════════════════════════════════════════════════════

/**
 * Resolve heading color based on background context.
 */
export function resolveHeadingColor(
  customColor?: string,
  hasBackgroundImage?: boolean,
  theme?: SiteTheme
): string {
  if (customColor) return customColor;
  if (hasBackgroundImage) return '#ffffff';
  return theme?.textColor || '#1e293b';
}

/**
 * Resolve subheading color based on background context.
 */
export function resolveSubheadingColor(
  customColor?: string,
  hasBackgroundImage?: boolean,
  theme?: SiteTheme
): string {
  if (customColor) return customColor;
  if (hasBackgroundImage) return '#ffffffcc';
  return theme?.secondaryColor || '#64748b';
}

// ══════════════════════════════════════════════════════════════════
// Background Helpers
// ══════════════════════════════════════════════════════════════════

/**
 * Get overlay style for background images.
 */
export function getOverlayStyle(opacity: number = 40): React.CSSProperties {
  return {
    backgroundColor: `rgba(0,0,0,${opacity / 100})`,
  };
}

/**
 * Get background styles for hero sections.
 */
export function getHeroBackgroundStyle(
  backgroundImage?: string,
  fallbackColor?: string
): React.CSSProperties {
  if (backgroundImage) {
    return {
      backgroundImage: `url(${backgroundImage})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    };
  }
  return {
    backgroundColor: fallbackColor || 'transparent',
  };
}

// ══════════════════════════════════════════════════════════════════
// Transition Helpers (for carousel)
// ══════════════════════════════════════════════════════════════════

export type TransitionType = 'fade' | 'slide' | 'zoom' | 'flip';

/**
 * Get transition styles for carousel slides.
 */
export function getSlideTransitionStyle(
  transition: TransitionType,
  isActive: boolean,
  slideIndex: number,
  currentIndex: number
): React.CSSProperties {
  switch (transition) {
    case 'slide':
      return {
        transform: `translateX(${(slideIndex - currentIndex) * 100}%)`,
        opacity: 1,
      };
    case 'zoom':
      return {
        transform: isActive ? 'scale(1)' : 'scale(1.1)',
        opacity: isActive ? 1 : 0,
      };
    case 'flip':
      return {
        transform: isActive ? 'rotateY(0deg)' : 'rotateY(90deg)',
        opacity: isActive ? 1 : 0,
      };
    case 'fade':
    default:
      return {
        opacity: isActive ? 1 : 0,
      };
  }
}

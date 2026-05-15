/**
 * Component-level types for the website builder.
 */
import React from 'react';
import type { AnimationSettings } from './animation';

export type DeviceView = 'desktop' | 'tablet' | 'mobile';

export type ComponentType =
  // Layout & Structure
  | 'hero' | 'section' | 'columns' | 'spacer' | 'divider' | 'sticky'
  // Navigation
  | 'navbar' | 'footer' | 'breadcrumb' | 'pagination' | 'mega-menu' | 'language-switcher'
  // Text & Content
  | 'heading' | 'paragraph' | 'rich-text' | 'blockquote' | 'code-block' | 'list' | 'callout' | 'icon-text'
  // Media
  | 'image-gallery' | 'gallery-masonry' | 'video-embed' | 'background-video' | 'audio-player' | 'image-text' | 'map'
  | 'lightbox-gallery' | 'before-after'
  // Business & Marketing
  | 'about' | 'features' | 'pricing' | 'testimonials' | 'reviews' | 'comparison-table'
  | 'stats' | 'animated-stats' | 'cta-banner' | 'logo-cloud' | 'team-grid' | 'service-card' | 'trust-badges'
  | 'countdown' | 'banner' | 'announcement-bar' | 'marquee' | 'popup' | 'floating-header'
  // Interactive & Forms
  | 'contact-form' | 'newsletter' | 'button' | 'button-group' | 'social-links'
  | 'tabs' | 'faq' | 'progress' | 'timeline' | 'form' | 'login-form' | 'signup-form' | 'search-bar' | 'rating' | 'avatar'
  // E-Commerce
  | 'product-card' | 'product-detail' | 'product-carousel' | 'quick-view' | 'wishlist-grid' | 'cart'
  | 'product-filter' | 'checkout'
  // Blog & Content
  | 'blog-grid' | 'comments' | 'tags-cloud'
  // User & Account
  | 'user-profile'
  // Advanced
  | 'custom-html' | 'cookie-consent' | 'parallax'
  // Integrations & Widgets
  | 'whatsapp-button' | 'facebook-pixel' | 'google-analytics' | 'loading-screen' | 'floating-cta' | 'scroll-to-top'
  // Legacy
  | 'carousel';

/** Responsive style overrides per breakpoint */
export interface ResponsiveStyles {
  desktop?: React.CSSProperties;
  tablet?: React.CSSProperties;
  mobile?: React.CSSProperties;
}

/** A single building block in the page tree */
export interface BuilderComponent {
  id: string;
  type: ComponentType;
  label: string;
  props: Record<string, any>;
  styles: ResponsiveStyles;
  animation?: AnimationSettings;
  children?: BuilderComponent[];
  hidden?: Partial<Record<DeviceView, boolean>>;
}

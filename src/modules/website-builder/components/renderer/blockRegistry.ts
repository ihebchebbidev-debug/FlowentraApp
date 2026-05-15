/**
 * Block Registry — Lazy-loaded via React.lazy for code-splitting.
 * Each block is loaded on-demand when first rendered.
 *
 * All block files use **named exports**, so each lazy() call re-exports
 * the named export as the default via an inline arrow.
 */
import { type ComponentType } from 'react';
import { lazyBlockWithRetry } from '@/lib/lazyWithRetry';

/* ─── helper: wraps lazyBlockWithRetry for named exports ─── */
type LazyBlock = React.LazyExoticComponent<ComponentType<any>>;

function lazyBlock(
  loader: () => Promise<Record<string, ComponentType<any>>>,
  exportName: string,
): LazyBlock {
  return lazyBlockWithRetry(loader, exportName);
}

/* ═══════════════════════════════════════
   LAYOUT
   ═══════════════════════════════════════ */
const LAYOUT_BLOCKS: Record<string, LazyBlock> = {
  hero:     lazyBlock(() => import('./blocks/HeroBlock'), 'HeroBlock'),
  section:  lazyBlock(() => import('./blocks/SectionBlock'), 'SectionBlock'),
  columns:  lazyBlock(() => import('./blocks/ColumnsBlock'), 'ColumnsBlock'),
  spacer:   lazyBlock(() => import('./blocks/SpacerBlock'), 'SpacerBlock'),
  divider:  lazyBlock(() => import('./blocks/DividerBlock'), 'DividerBlock'),
  sticky:   lazyBlock(() => import('./blocks/StickyBlock'), 'StickyBlock'),
  parallax: lazyBlock(() => import('./blocks/ParallaxBlock'), 'ParallaxBlock'),
};

/* ═══════════════════════════════════════
   NAVIGATION
   ═══════════════════════════════════════ */
const NAVIGATION_BLOCKS: Record<string, LazyBlock> = {
  navbar:              lazyBlock(() => import('./blocks/NavbarBlock'), 'NavbarBlock'),
  footer:              lazyBlock(() => import('./blocks/FooterBlock'), 'FooterBlock'),
  breadcrumb:          lazyBlock(() => import('./blocks/BreadcrumbBlock'), 'BreadcrumbBlock'),
  pagination:          lazyBlock(() => import('./blocks/PaginationBlock'), 'PaginationBlock'),
  'mega-menu':         lazyBlock(() => import('./blocks/MegaMenuBlock'), 'MegaMenuBlock'),
  'language-switcher': lazyBlock(() => import('./blocks/LanguageSwitcherBlock'), 'LanguageSwitcherBlock'),
};

/* ═══════════════════════════════════════
   TEXT & CONTENT
   ═══════════════════════════════════════ */
const TEXT_BLOCKS: Record<string, LazyBlock> = {
  heading:      lazyBlock(() => import('./blocks/HeadingBlock'), 'HeadingBlock'),
  paragraph:    lazyBlock(() => import('./blocks/ParagraphBlock'), 'ParagraphBlock'),
  'rich-text':  lazyBlock(() => import('./blocks/RichTextBlock'), 'RichTextBlock'),
  blockquote:   lazyBlock(() => import('./blocks/BlockquoteBlock'), 'BlockquoteBlock'),
  'code-block': lazyBlock(() => import('./blocks/CodeBlockBlock'), 'CodeBlockBlock'),
  list:         lazyBlock(() => import('./blocks/ListBlock'), 'ListBlock'),
  callout:      lazyBlock(() => import('./blocks/CalloutBlock'), 'CalloutBlock'),
  'icon-text':  lazyBlock(() => import('./blocks/IconTextBlock'), 'IconTextBlock'),
};

/* ═══════════════════════════════════════
   MEDIA
   ═══════════════════════════════════════ */
const MEDIA_BLOCKS: Record<string, LazyBlock> = {
  'image-text':       lazyBlock(() => import('./blocks/ImageTextBlock'), 'ImageTextBlock'),
  'image-gallery':    lazyBlock(() => import('./blocks/ImageGalleryBlock'), 'ImageGalleryBlock'),
  'gallery-masonry':  lazyBlock(() => import('./blocks/GalleryMasonryBlock'), 'GalleryMasonryBlock'),
  'lightbox-gallery': lazyBlock(() => import('./blocks/LightboxGalleryBlock'), 'LightboxGalleryBlock'),
  'before-after':     lazyBlock(() => import('./blocks/BeforeAfterBlock'), 'BeforeAfterBlock'),
  'video-embed':      lazyBlock(() => import('./blocks/VideoEmbedBlock'), 'VideoEmbedBlock'),
  'background-video': lazyBlock(() => import('./blocks/BackgroundVideoBlock'), 'BackgroundVideoBlock'),
  'audio-player':     lazyBlock(() => import('./blocks/AudioPlayerBlock'), 'AudioPlayerBlock'),
  map:                lazyBlock(() => import('./blocks/MapBlock'), 'MapBlock'),
};

/* ═══════════════════════════════════════
   BUSINESS & MARKETING
   ═══════════════════════════════════════ */
const BUSINESS_BLOCKS: Record<string, LazyBlock> = {
  about:              lazyBlock(() => import('./blocks/AboutBlock'), 'AboutBlock'),
  features:           lazyBlock(() => import('./blocks/FeaturesBlock'), 'FeaturesBlock'),
  'service-card':     lazyBlock(() => import('./blocks/ServiceCardBlock'), 'ServiceCardBlock'),
  pricing:            lazyBlock(() => import('./blocks/PricingBlock'), 'PricingBlock'),
  'comparison-table': lazyBlock(() => import('./blocks/ComparisonTableBlock'), 'ComparisonTableBlock'),
  testimonials:       lazyBlock(() => import('./blocks/TestimonialsBlock'), 'TestimonialsBlock'),
  reviews:            lazyBlock(() => import('./blocks/ReviewsBlock'), 'ReviewsBlock'),
  'trust-badges':     lazyBlock(() => import('./blocks/TrustBadgesBlock'), 'TrustBadgesBlock'),
  stats:              lazyBlock(() => import('./blocks/StatsBlock'), 'StatsBlock'),
  'animated-stats':   lazyBlock(() => import('./blocks/AnimatedStatsBlock'), 'AnimatedStatsBlock'),
  'cta-banner':       lazyBlock(() => import('./blocks/CtaBannerBlock'), 'CtaBannerBlock'),
  'logo-cloud':       lazyBlock(() => import('./blocks/LogoCloudBlock'), 'LogoCloudBlock'),
  'team-grid':        lazyBlock(() => import('./blocks/TeamGridBlock'), 'TeamGridBlock'),
  banner:             lazyBlock(() => import('./blocks/BannerBlock'), 'BannerBlock'),
  'announcement-bar': lazyBlock(() => import('./blocks/AnnouncementBarBlock'), 'AnnouncementBarBlock'),
  marquee:            lazyBlock(() => import('./blocks/MarqueeBlock'), 'MarqueeBlock'),
  countdown:          lazyBlock(() => import('./blocks/CountdownBlock'), 'CountdownBlock'),
  popup:              lazyBlock(() => import('./blocks/PopupBlock'), 'PopupBlock'),
  'floating-header':  lazyBlock(() => import('./blocks/FloatingHeaderBlock'), 'FloatingHeaderBlock'),
};

/* ═══════════════════════════════════════
   INTERACTIVE & FORMS
   ═══════════════════════════════════════ */
const INTERACTIVE_BLOCKS: Record<string, LazyBlock> = {
  button:         lazyBlock(() => import('./blocks/ButtonBlock'), 'ButtonBlock'),
  'button-group': lazyBlock(() => import('./blocks/ButtonGroupBlock'), 'ButtonGroupBlock'),
  'contact-form': lazyBlock(() => import('./blocks/ContactFormBlock'), 'ContactFormBlock'),
  form:           lazyBlock(() => import('./blocks/FormBlock'), 'FormBlock'),
  'login-form':   lazyBlock(() => import('./blocks/LoginFormBlock'), 'LoginFormBlock'),
  'signup-form':  lazyBlock(() => import('./blocks/SignupFormBlock'), 'SignupFormBlock'),
  newsletter:     lazyBlock(() => import('./blocks/NewsletterBlock'), 'NewsletterBlock'),
  'search-bar':   lazyBlock(() => import('./blocks/SearchBarBlock'), 'SearchBarBlock'),
  'social-links': lazyBlock(() => import('./blocks/SocialLinksBlock'), 'SocialLinksBlock'),
  tabs:           lazyBlock(() => import('./blocks/TabsBlock'), 'TabsBlock'),
  faq:            lazyBlock(() => import('./blocks/FaqBlock'), 'FaqBlock'),
  progress:       lazyBlock(() => import('./blocks/ProgressBlock'), 'ProgressBlock'),
  timeline:       lazyBlock(() => import('./blocks/TimelineBlock'), 'TimelineBlock'),
  rating:         lazyBlock(() => import('./blocks/RatingBlock'), 'RatingBlock'),
  avatar:         lazyBlock(() => import('./blocks/AvatarBlock'), 'AvatarBlock'),
};

/* ═══════════════════════════════════════
   E-COMMERCE
   ═══════════════════════════════════════ */
const ECOMMERCE_BLOCKS: Record<string, LazyBlock> = {
  'product-card':     lazyBlock(() => import('./blocks/ProductCardBlock'), 'ProductCardBlock'),
  'product-detail':   lazyBlock(() => import('./blocks/ProductDetailBlock'), 'ProductDetailBlock'),
  'product-carousel': lazyBlock(() => import('./blocks/ProductCarouselBlock'), 'ProductCarouselBlock'),
  'quick-view':       lazyBlock(() => import('./blocks/QuickViewBlock'), 'QuickViewBlock'),
  'wishlist-grid':    lazyBlock(() => import('./blocks/WishlistGridBlock'), 'WishlistGridBlock'),
  cart:               lazyBlock(() => import('./blocks/CartBlock'), 'CartBlock'),
  'product-filter':   lazyBlock(() => import('./blocks/ProductFilterBlock'), 'ProductFilterBlock'),
  checkout:           lazyBlock(() => import('./blocks/CheckoutBlock'), 'CheckoutBlock'),
};

/* ═══════════════════════════════════════
   BLOG & CONTENT
   ═══════════════════════════════════════ */
const BLOG_BLOCKS: Record<string, LazyBlock> = {
  'blog-grid':   lazyBlock(() => import('./blocks/BlogGridBlock'), 'BlogGridBlock'),
  comments:      lazyBlock(() => import('./blocks/CommentsBlock'), 'CommentsBlock'),
  'tags-cloud':  lazyBlock(() => import('./blocks/TagsCloudBlock'), 'TagsCloudBlock'),
};

/* ═══════════════════════════════════════
   USER & ACCOUNT
   ═══════════════════════════════════════ */
const USER_BLOCKS: Record<string, LazyBlock> = {
  'user-profile': lazyBlock(() => import('./blocks/UserProfileBlock'), 'UserProfileBlock'),
};

/* ═══════════════════════════════════════
   ADVANCED
   ═══════════════════════════════════════ */
const ADVANCED_BLOCKS: Record<string, LazyBlock> = {
  'custom-html':     lazyBlock(() => import('./blocks/CustomHtmlBlock'), 'CustomHtmlBlock'),
  'cookie-consent':  lazyBlock(() => import('./blocks/CookieConsentBlock'), 'CookieConsentBlock'),
};

/* ═══════════════════════════════════════
   INTEGRATIONS & WIDGETS
   ═══════════════════════════════════════ */
const INTEGRATION_BLOCKS: Record<string, LazyBlock> = {
  'whatsapp-button':   lazyBlock(() => import('./blocks/WhatsAppButtonBlock'), 'WhatsAppButtonBlock'),
  'facebook-pixel':    lazyBlock(() => import('./blocks/FacebookPixelBlock'), 'FacebookPixelBlock'),
  'google-analytics':  lazyBlock(() => import('./blocks/GoogleAnalyticsBlock'), 'GoogleAnalyticsBlock'),
  'loading-screen':    lazyBlock(() => import('./blocks/LoadingScreenBlock'), 'LoadingScreenBlock'),
  'floating-cta':      lazyBlock(() => import('./blocks/FloatingCtaBlock'), 'FloatingCtaBlock'),
  'scroll-to-top':     lazyBlock(() => import('./blocks/ScrollToTopBlock'), 'ScrollToTopBlock'),
};

/* ═══════════════════════════════════════
   COMBINED MAP — add new blocks to the
   appropriate category above.
   ═══════════════════════════════════════ */
export const BLOCK_MAP: Record<string, LazyBlock> = {
  ...LAYOUT_BLOCKS,
  ...NAVIGATION_BLOCKS,
  ...TEXT_BLOCKS,
  ...MEDIA_BLOCKS,
  ...BUSINESS_BLOCKS,
  ...INTERACTIVE_BLOCKS,
  ...ECOMMERCE_BLOCKS,
  ...BLOG_BLOCKS,
  ...USER_BLOCKS,
  ...ADVANCED_BLOCKS,
  ...INTEGRATION_BLOCKS,
  // Legacy alias
  carousel: lazyBlock(() => import('./blocks/HeroBlock'), 'HeroBlock'),
};

/**
 * Website Builder Types — Barrel re-export.
 * All existing imports from '../types' continue to work.
 */

// Component types
export type { DeviceView, ComponentType, ResponsiveStyles, BuilderComponent } from './component';

// Animation types & defaults
export type { EntranceAnimation, HoverEffect, TransitionSpeed, AnimationSettings } from './animation';
export { DEFAULT_ANIMATION } from './animation';

// Site-level types & defaults
export type { PageSEO, PageTranslation, SitePage, SiteTheme, WebsiteSite, SiteLanguage } from './site';
export { DEFAULT_THEME } from './site';

// Editor types
export type { PaletteItem, EditorState } from './editor';

// Shared interfaces (used across blocks)
export type {
  ActionType,
  ComponentAction,
  CTAButton,
  NavLink,
  NavLinkChild,
  SocialLink,
  FooterLinkGroup,
  TestimonialItem,
  FeatureItem,
  PricingPlan,
  FAQItem,
  TeamMember,
  TimelineItem,
  TabItem,
  StatItem,
  ImageItem,
  HeroSlide,
  FormField,
  ProductItem,
  BlogPost,
  LogoItem,
  TrustBadge,
} from './shared';

export { DEFAULT_ACTION } from './shared';

// I18n constants
export { AVAILABLE_LANGUAGES } from './i18n';

// Validation schemas (for runtime validation)
export {
  // Primitive validators
  safeString,
  urlSchema,
  colorSchema,
  emailSchema,
  phoneSchema,
  slugSchema,
  // Action schemas
  actionTypeSchema,
  componentActionSchema,
  // Component schemas
  deviceViewSchema,
  responsiveStylesSchema,
  animationSettingsSchema,
  builderComponentSchema,
  // Shared interface schemas
  ctaButtonSchema,
  navLinkSchema,
  navLinkChildSchema,
  socialLinkSchema,
  testimonialSchema,
  featureItemSchema,
  pricingPlanSchema,
  faqItemSchema,
  teamMemberSchema,
  formFieldSchema,
  // Site-level schemas
  pageSeoSchema,
  siteThemeSchema,
  siteLanguageSchema,
  pageTranslationSchema,
  sitePageSchema,
  websiteSiteSchema,
  // Form schemas
  formSubmissionSchema,
  contactFormDataSchema,
  newsletterSubscriptionSchema,
  // API schemas
  createSiteInputSchema,
  updateSiteInputSchema,
  // Helpers
  validate,
  validateOrThrow,
  sanitizeInput,
  type ValidationError,
} from './validation';

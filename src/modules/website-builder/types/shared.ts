/**
 * Shared interfaces used across multiple blocks and components.
 * Centralizing these prevents duplication and ensures consistency.
 */

/* ═══════════════════════════════════════
   ACTION SYSTEM
   Allows any component to trigger navigation, API calls, etc.
   ═══════════════════════════════════════ */

/** Types of actions that can be triggered */
export type ActionType = 
  | 'none'           // No action
  | 'page'           // Navigate to internal page
  | 'url'            // Navigate to external URL
  | 'section'        // Scroll to section on current page
  | 'email'          // Open email client
  | 'phone'          // Open phone dialer
  | 'download'       // Download a file
  | 'modal'          // Open a modal/popup
  | 'submit'         // Submit form
  | 'custom';        // Custom JavaScript action

/** Action configuration */
export interface ComponentAction {
  type: ActionType;
  /** For 'page' action: page ID or slug */
  pageId?: string;
  /** For 'url' action: external URL */
  url?: string;
  /** For 'section' action: section/component ID */
  sectionId?: string;
  /** For 'email' action: email address */
  email?: string;
  /** For 'phone' action: phone number */
  phone?: string;
  /** For 'download' action: file URL */
  fileUrl?: string;
  /** For 'modal' action: modal component ID */
  modalId?: string;
  /** For 'url' action: open in new tab */
  openInNewTab?: boolean;
  /** For 'custom' action: custom code/handler name */
  customHandler?: string;
}

/** Default empty action */
export const DEFAULT_ACTION: ComponentAction = { type: 'none' };

/** CTA Button configuration — used by Hero, CTA Banner, Button Group, etc. */
export interface CTAButton {
  text: string;
  link: string;
  action?: ComponentAction;
  color?: string;
  textColor?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  icon?: string;
  iconPosition?: 'left' | 'right';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

/** Navigation link with optional dropdown children */
export interface NavLink {
  label: string;
  href: string;
  action?: ComponentAction;
  icon?: string;
  children?: NavLinkChild[];
}

export interface NavLinkChild {
  label: string;
  href: string;
  action?: ComponentAction;
  icon?: string;
  description?: string;
}

/** Social link configuration */
export interface SocialLink {
  platform: string;
  url: string;
  action?: ComponentAction;
}

/** Footer link group for multi-column layouts */
export interface FooterLinkGroup {
  title: string;
  links: Array<{ label: string; href: string; action?: ComponentAction }>;
}

/** Testimonial/Review item */
export interface TestimonialItem {
  text: string;
  author: string;
  role?: string;
  avatar?: string;
  rating?: number;
  company?: string;
}

/** Feature item for features blocks */
export interface FeatureItem {
  icon: string;
  title: string;
  description: string;
  link?: string;
  action?: ComponentAction;
}

/** Pricing plan configuration */
export interface PricingPlan {
  name: string;
  price: string;
  period?: string;
  features: string[];
  highlighted?: boolean;
  badge?: string;
  ctaText?: string;
  ctaLink?: string;
  ctaAction?: ComponentAction;
}

/** FAQ item */
export interface FAQItem {
  question: string;
  answer: string;
}

/** Team member configuration */
export interface TeamMember {
  name: string;
  role: string;
  image?: string;
  bio?: string;
  social?: SocialLink[];
}

/** Timeline item */
export interface TimelineItem {
  title: string;
  description: string;
  date?: string;
  icon?: string;
}

/** Tab configuration for tab blocks */
export interface TabItem {
  label: string;
  content: string;
  icon?: string;
}

/** Stat/counter item */
export interface StatItem {
  value: string;
  label: string;
  icon?: string;
  prefix?: string;
  suffix?: string;
}

/** Image with metadata */
export interface ImageItem {
  src: string;
  alt?: string;
  caption?: string;
  link?: string;
  action?: ComponentAction;
}

/** Hero slide for carousel heroes */
export interface HeroSlide {
  heading: string;
  subheading: string;
  backgroundImage?: string;
  buttons?: CTAButton[];
  overlayOpacity?: number;
  headingColor?: string;
  subheadingColor?: string;
}

/** Form field configuration */
export interface FormField {
  id: string;
  type: 'text' | 'email' | 'tel' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'file' | 'date' | 'number';
  label: string;
  placeholder?: string;
  required?: boolean;
  options?: string[]; // For select/radio
  validation?: {
    pattern?: string;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
  };
}

/** Product configuration for e-commerce blocks */
export interface ProductItem {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  images?: string[];
  description?: string;
  category?: string;
  badge?: string;
  rating?: number;
  inStock?: boolean;
}

/** Blog post configuration */
export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  image?: string;
  author?: string;
  date?: string;
  category?: string;
  tags?: string[];
  slug?: string;
}

/** Logo item for logo clouds */
export interface LogoItem {
  src: string;
  alt: string;
  link?: string;
}

/** Trust badge configuration */
export interface TrustBadge {
  icon: string;
  title: string;
  description?: string;
}

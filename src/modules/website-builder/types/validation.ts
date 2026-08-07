/**
 * Validation Schemas — Zod schemas for all website builder data types.
 * These ensure data integrity and provide runtime validation for backend integration.
 */
import { z } from 'zod';

// ══════════════════════════════════════════════════════════════════
// PRIMITIVE VALIDATORS
// ══════════════════════════════════════════════════════════════════

/** Safe string that strips dangerous characters */
export const safeString = z.string().transform(s => 
  s.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
);

/** URL validator with protocol requirement */
export const urlSchema = z.string().url().or(z.string().startsWith('/'));

/** Color value (hex, rgb, hsl, or CSS variable) */
export const colorSchema = z.string().regex(
  /^(#[0-9a-fA-F]{3,8}|rgb\(|rgba\(|hsl\(|hsla\(|var\(--|transparent|inherit|currentColor)/,
  'Invalid color format'
).or(z.string().length(0));

/** Email with proper format */
export const emailSchema = z.string().email().max(255);

/** Phone number (flexible format) */
export const phoneSchema = z.string().regex(
  /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/,
  'Invalid phone number'
).or(z.string().length(0));

/** Slug for URLs */
export const slugSchema = z.string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase letters, numbers, and hyphens')
  .max(100)
  .or(z.string().length(0)); // Allow empty for home page

// ══════════════════════════════════════════════════════════════════
// ACTION SCHEMAS
// ══════════════════════════════════════════════════════════════════

export const actionTypeSchema = z.enum([
  'none', 'page', 'url', 'section', 'email', 'phone', 'download', 'modal', 'submit', 'custom'
]);

export const componentActionSchema = z.object({
  type: actionTypeSchema,
  pageId: z.string().optional(),
  url: urlSchema.optional(),
  sectionId: z.string().optional(),
  email: emailSchema.optional(),
  phone: phoneSchema.optional(),
  fileUrl: urlSchema.optional(),
  modalId: z.string().optional(),
  openInNewTab: z.boolean().optional(),
  customHandler: z.string().max(100).optional(),
}).strict();

// ══════════════════════════════════════════════════════════════════
// COMPONENT SCHEMAS
// ══════════════════════════════════════════════════════════════════

export const deviceViewSchema = z.enum(['desktop', 'tablet', 'mobile']);

export const responsiveStylesSchema = z.object({
  desktop: z.record(z.any()).optional(),
  tablet: z.record(z.any()).optional(),
  mobile: z.record(z.any()).optional(),
});

export const animationSettingsSchema = z.object({
  entrance: z.enum(['none', 'fade-up', 'fade-down', 'fade-left', 'fade-right', 'zoom-in', 'zoom-out', 'slide-up', 'slide-down', 'bounce']).optional(),
  hover: z.enum(['none', 'lift', 'scale', 'glow', 'shake', 'pulse', 'rotate']).optional(),
  speed: z.enum(['slow', 'normal', 'fast']).optional(),
  delay: z.number().min(0).max(5000).optional(),
});

export const builderComponentSchema = z.object({
  id: z.string().min(1).max(100),
  type: z.string().min(1).max(50),
  label: z.string().min(1).max(100),
  props: z.record(z.any()),
  styles: responsiveStylesSchema,
  animation: animationSettingsSchema.optional(),
  children: z.lazy(() => z.array(builderComponentSchema)).optional(),
  hidden: z.record(z.boolean()).optional(),
});

// ══════════════════════════════════════════════════════════════════
// SHARED INTERFACE SCHEMAS
// ══════════════════════════════════════════════════════════════════

export const ctaButtonSchema = z.object({
  text: z.string().min(1).max(100),
  link: z.string().max(500),
  action: componentActionSchema.optional(),
  color: colorSchema.optional(),
  textColor: colorSchema.optional(),
  variant: z.enum(['primary', 'secondary', 'outline', 'ghost']).optional(),
  icon: z.string().max(50).optional(),
  iconPosition: z.enum(['left', 'right']).optional(),
  size: z.enum(['sm', 'md', 'lg']).optional(),
  fullWidth: z.boolean().optional(),
});

export const navLinkChildSchema = z.object({
  label: z.string().min(1).max(100),
  href: z.string().max(500),
  action: componentActionSchema.optional(),
  icon: z.string().max(50).optional(),
  description: z.string().max(200).optional(),
});

export const navLinkSchema = z.object({
  label: z.string().min(1).max(100),
  href: z.string().max(500),
  action: componentActionSchema.optional(),
  icon: z.string().max(50).optional(),
  children: z.array(navLinkChildSchema).optional(),
});

export const socialLinkSchema = z.object({
  platform: z.string().min(1).max(50),
  url: urlSchema,
  action: componentActionSchema.optional(),
});

export const testimonialSchema = z.object({
  text: z.string().min(1).max(1000),
  author: z.string().min(1).max(100),
  role: z.string().max(100).optional(),
  avatar: z.string().max(2000).optional(),
  rating: z.number().min(0).max(5).optional(),
  company: z.string().max(100).optional(),
});

export const featureItemSchema = z.object({
  icon: z.string().max(100),
  title: z.string().min(1).max(200),
  description: z.string().max(1000),
  link: z.string().max(500).optional(),
  action: componentActionSchema.optional(),
});

export const pricingPlanSchema = z.object({
  name: z.string().min(1).max(100),
  price: z.string().min(1).max(50),
  period: z.string().max(50).optional(),
  features: z.array(z.string().max(200)),
  highlighted: z.boolean().optional(),
  badge: z.string().max(50).optional(),
  ctaText: z.string().max(50).optional(),
  ctaLink: z.string().max(500).optional(),
  ctaAction: componentActionSchema.optional(),
});

export const faqItemSchema = z.object({
  question: z.string().min(1).max(500),
  answer: z.string().min(1).max(2000),
});

export const teamMemberSchema = z.object({
  name: z.string().min(1).max(100),
  role: z.string().min(1).max(100),
  image: z.string().max(2000).optional(),
  bio: z.string().max(500).optional(),
  social: z.array(socialLinkSchema).optional(),
});

export const formFieldSchema = z.object({
  id: z.string().min(1).max(50),
  type: z.enum(['text', 'email', 'tel', 'textarea', 'select', 'checkbox', 'radio', 'file', 'date', 'number']),
  label: z.string().min(1).max(100),
  placeholder: z.string().max(200).optional(),
  required: z.boolean().optional(),
  options: z.array(z.string().max(100)).optional(),
  validation: z.object({
    pattern: z.string().max(200).optional(),
    minLength: z.number().min(0).max(10000).optional(),
    maxLength: z.number().min(0).max(10000).optional(),
    min: z.number().optional(),
    max: z.number().optional(),
  }).optional(),
});

// ══════════════════════════════════════════════════════════════════
// SITE-LEVEL SCHEMAS
// ══════════════════════════════════════════════════════════════════

export const pageSeoSchema = z.object({
  title: z.string().max(100).optional(),
  description: z.string().max(300).optional(),
  ogImage: z.string().max(2000).optional(),
  ogTitle: z.string().max(100).optional(),
  ogDescription: z.string().max(300).optional(),
});

export const siteThemeSchema = z.object({
  primaryColor: colorSchema,
  secondaryColor: colorSchema,
  accentColor: colorSchema,
  backgroundColor: colorSchema,
  textColor: colorSchema,
  headingFont: z.string().max(200),
  bodyFont: z.string().max(200),
  borderRadius: z.number().min(0).max(100),
  spacing: z.number().min(0).max(100),
  direction: z.enum(['ltr', 'rtl']).optional(),
  shadowStyle: z.enum(['none', 'subtle', 'medium', 'dramatic']).optional(),
  buttonStyle: z.enum(['rounded', 'pill', 'square', 'outlined']).optional(),
  sectionPadding: z.number().min(0.5).max(2).optional(),
  fontScale: z.number().min(0.85).max(1.25).optional(),
  letterSpacing: z.number().min(-0.1).max(0.3).optional(),
  linkStyle: z.enum(['underline', 'none', 'hover-underline']).optional(),
  headingTransform: z.enum(['none', 'uppercase', 'capitalize']).optional(),
});

export const siteLanguageSchema = z.object({
  code: z.string().min(2).max(10),
  label: z.string().min(1).max(50),
  direction: z.enum(['ltr', 'rtl']),
});

export const pageTranslationSchema = z.object({
  components: z.array(builderComponentSchema),
  seo: pageSeoSchema,
});

export const sitePageSchema = z.object({
  id: z.string().min(1).max(100),
  title: z.string().min(1).max(200),
  slug: slugSchema,
  components: z.array(builderComponentSchema),
  seo: pageSeoSchema,
  isHomePage: z.boolean().optional(),
  order: z.number().min(0),
  translations: z.record(pageTranslationSchema).optional(),
});

export const websiteSiteSchema = z.object({
  id: z.string().min(1).max(100),
  name: z.string().min(1).max(200),
  slug: slugSchema.or(z.string().min(1).max(100)),
  description: z.string().max(500).optional(),
  favicon: z.string().max(2000).optional(),
  theme: siteThemeSchema,
  pages: z.array(sitePageSchema).min(1),
  published: z.boolean(),
  publishedAt: z.string().datetime().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  defaultLanguage: z.string().max(10).optional(),
  languages: z.array(siteLanguageSchema).optional(),
});

// ══════════════════════════════════════════════════════════════════
// FORM SUBMISSION SCHEMAS
// ══════════════════════════════════════════════════════════════════

export const formSubmissionSchema = z.object({
  id: z.string().min(1).max(100),
  siteId: z.string().max(100),
  formId: z.string().max(100),
  formLabel: z.string().max(200),
  pageTitle: z.string().max(200),
  data: z.record(z.string().max(5000)),
  submittedAt: z.string().datetime(),
  webhookStatus: z.enum(['success', 'failed']).optional(),
  webhookResponse: z.string().max(10000).optional(),
  source: z.enum(['website', 'preview']).optional(),
});

// ══════════════════════════════════════════════════════════════════
// API INPUT SCHEMAS
// ══════════════════════════════════════════════════════════════════

export const createSiteInputSchema = z.object({
  name: z.string().min(1).max(200),
  theme: siteThemeSchema.optional(),
  pages: z.array(sitePageSchema).optional(),
  userId: z.string().max(100).optional(),
});

export const updateSiteInputSchema = z.object({
  id: z.string().min(1).max(100),
  name: z.string().min(1).max(200).optional(),
  slug: slugSchema.optional(),
  description: z.string().max(500).optional(),
  favicon: z.string().max(2000).optional(),
  theme: siteThemeSchema.optional(),
  pages: z.array(sitePageSchema).optional(),
  published: z.boolean().optional(),
  defaultLanguage: z.string().max(10).optional(),
});

// ══════════════════════════════════════════════════════════════════
// VALIDATION HELPERS
// ══════════════════════════════════════════════════════════════════

export type ValidationError = {
  path: (string | number)[];
  message: string;
};

/**
 * Validate data against a schema and return errors
 */
export function validate<T>(schema: z.ZodSchema<T>, data: unknown): {
  success: boolean;
  data?: T;
  errors?: ValidationError[];
} {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  return {
    success: false,
    errors: result.error.errors.map(err => ({
      path: err.path,
      message: err.message,
    })),
  };
}

/**
 * Validate and throw on error
 */
export function validateOrThrow<T>(schema: z.ZodSchema<T>, data: unknown): T {
  return schema.parse(data);
}

/**
 * Sanitize user input for safe storage
 */
export function sanitizeInput(input: string, maxLength = 1000): string {
  return input
    .slice(0, maxLength)
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim();
}

/**
 * Validate contact form data
 */
export const contactFormDataSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  email: emailSchema,
  phone: phoneSchema.optional(),
  message: z.string().min(1, 'Message is required').max(5000, 'Message too long'),
  subject: z.string().max(200).optional(),
}).passthrough(); // Allow additional fields

/**
 * Validate newsletter subscription
 */
export const newsletterSubscriptionSchema = z.object({
  email: emailSchema,
  name: z.string().max(100).optional(),
  consent: z.boolean().refine(val => val === true, 'Consent is required'),
});

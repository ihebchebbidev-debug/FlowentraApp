/**
 * Frontend validation schemas for website builder forms.
 * Uses zod for type-safe validation with user-friendly error messages.
 */
import { z } from 'zod';

// Common validation helpers
const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

// Site validation
export const siteNameSchema = z
  .string()
  .trim()
  .min(1, 'Site name is required')
  .max(100, 'Site name must be less than 100 characters');

export const siteSlugSchema = z
  .string()
  .trim()
  .min(1, 'Site slug is required')
  .max(100, 'Slug must be less than 100 characters')
  .regex(slugRegex, 'Slug can only contain lowercase letters, numbers, and hyphens');

export const siteDescriptionSchema = z
  .string()
  .max(500, 'Description must be less than 500 characters')
  .optional()
  .nullable();

// Page validation
export const pageTitleSchema = z
  .string()
  .trim()
  .min(1, 'Page title is required')
  .max(100, 'Page title must be less than 100 characters');

export const pageSlugSchema = z
  .string()
  .trim()
  .max(100, 'Page slug must be less than 100 characters')
  .refine(
    (val) => val === '' || slugRegex.test(val),
    'Slug can only contain lowercase letters, numbers, and hyphens'
  );

// SEO validation
export const seoTitleSchema = z
  .string()
  .max(60, 'SEO title should be under 60 characters for best results')
  .optional();

export const seoDescriptionSchema = z
  .string()
  .max(160, 'Meta description should be under 160 characters for best results')
  .optional();

export const seoSchema = z.object({
  title: seoTitleSchema,
  description: seoDescriptionSchema,
  ogTitle: z.string().max(100, 'OG title must be less than 100 characters').optional(),
  ogDescription: z.string().max(300, 'OG description must be less than 300 characters').optional(),
  ogImage: z.string().url('Invalid URL format').optional().or(z.literal('')),
});

// Theme validation
export const colorSchema = z
  .string()
  .regex(colorRegex, 'Invalid hex color format (e.g., #3b82f6)');

export const fontSchema = z
  .string()
  .min(1, 'Font is required')
  .max(200, 'Font value too long');

export const themeSchema = z.object({
  primaryColor: colorSchema,
  secondaryColor: colorSchema,
  accentColor: colorSchema,
  backgroundColor: colorSchema,
  textColor: colorSchema,
  headingFont: fontSchema,
  bodyFont: fontSchema,
  borderRadius: z.string().max(20, 'Border radius value too long'),
  fontScale: z.number().min(0.5).max(2).optional(),
  letterSpacing: z.number().min(-0.1).max(0.5).optional(),
  lineHeight: z.number().min(1).max(3).optional(),
  headingTransform: z.enum(['none', 'uppercase', 'capitalize']).optional(),
  headingWeight: z.number().min(100).max(900).optional(),
  containerWidth: z.enum(['narrow', 'default', 'wide', 'full']).optional(),
  sectionSpacing: z.enum(['compact', 'default', 'relaxed']).optional(),
  buttonStyle: z.enum(['rounded', 'pill', 'sharp']).optional(),
  linkStyle: z.enum(['underline', 'color', 'none']).optional(),
});

// Global block validation
export const globalBlockNameSchema = z
  .string()
  .trim()
  .min(1, 'Block name is required')
  .max(100, 'Block name must be less than 100 characters');

export const globalBlockDescriptionSchema = z
  .string()
  .max(300, 'Description must be less than 300 characters')
  .optional();

// URL validation
export const urlSchema = z
  .string()
  .url('Invalid URL format')
  .or(z.literal(''))
  .optional();

// Create site input validation
export const createSiteSchema = z.object({
  name: siteNameSchema,
  templateId: z.string().optional(),
});

// Update site input validation
export const updateSiteSchema = z.object({
  name: siteNameSchema.optional(),
  slug: siteSlugSchema.optional(),
  description: siteDescriptionSchema,
  favicon: urlSchema,
  published: z.boolean().optional(),
  defaultLanguage: z.string().min(2).max(10).optional(),
});

// Create page input validation
export const createPageSchema = z.object({
  title: pageTitleSchema,
  slug: pageSlugSchema,
});

// Validation helper functions
export function validateField<T>(
  schema: z.ZodType<T>,
  value: unknown
): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(value);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error.errors[0]?.message || 'Invalid value' };
}

export function validateForm<T extends z.ZodRawShape>(
  schema: z.ZodObject<T>,
  data: unknown
): { success: true; data: z.infer<z.ZodObject<T>> } | { success: false; errors: Record<string, string> } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  const errors: Record<string, string> = {};
  for (const err of result.error.errors) {
    const path = err.path.join('.');
    if (!errors[path]) {
      errors[path] = err.message;
    }
  }
  return { success: false, errors };
}

// Slugify helper with validation
export function createValidSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100);
}

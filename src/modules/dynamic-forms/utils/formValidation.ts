import { z } from 'zod';
import { FormField } from '../types';

export interface ValidationError {
  fieldId: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  fieldErrors: Record<string, string>;
}

// Stricter email regex — disallow consecutive dots, leading/trailing dots in
// local/domain parts, and require a TLD with 2+ letters.
export const emailRegex = /^(?!\.)(?!.*\.\.)[A-Za-z0-9._%+-]+(?<!\.)@(?!-)[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/;

// Phone validation: 7-20 chars total, digits/space/dash/paren allowed,
// optional single leading '+', and the string must contain at least 6 digits
// so all-punctuation input like "-------" is rejected.
const phoneCharsRegex = /^\+?[\d\s\-()]{7,20}$/;
const phoneDigitCountRegex = /(?:\D*\d){6,}/;
export const isValidPhone = (v: string): boolean =>
  phoneCharsRegex.test(v) && phoneDigitCountRegex.test(v);

/**
 * Sanitize a URL provided by an admin (redirect_url, link_url). Only
 * http(s) and mailto:/tel: are allowed. Anything else (javascript:, data:,
 * vbscript:, file:, etc.) returns null so callers can drop the URL.
 * Relative URLs are allowed and returned unchanged.
 */
export function sanitizeExternalUrl(raw: string | undefined | null): string | null {
  if (!raw) return null;
  const trimmed = String(raw).trim();
  if (!trimmed) return null;

  // Relative paths / anchors / same-origin — allow.
  if (trimmed.startsWith('/') || trimmed.startsWith('#') || trimmed.startsWith('?')) {
    return trimmed;
  }

  // Any scheme-like prefix must be in the allow-list.
  // Match the leading scheme case-insensitively, ignoring whitespace/control
  // chars that browsers strip when parsing URLs (e.g. "java\tscript:").
  const schemeMatch = /^([a-z][a-z0-9+.\-]*):/i.exec(
    trimmed.replace(/[\s\u0000-\u001F]/g, '')
  );
  if (schemeMatch) {
    const scheme = schemeMatch[1].toLowerCase();
    const allowed = new Set(['http', 'https', 'mailto', 'tel']);
    if (!allowed.has(scheme)) return null;
    return trimmed;
  }

  // No scheme, not obviously relative → treat as http(s)-less domain and
  // return as-is (browser will resolve relative to current origin).
  return trimmed;
}

/**
 * Validates a single field value based on field type and configuration
 */
export function validateField(
  field: FormField,
  value: any,
  lang: 'en' | 'fr' = 'en'
): string | null {
  const label = lang === 'en' ? field.label_en : field.label_fr;

  // Skip validation for non-input fields
  if (field.type === 'section' || field.type === 'page_break' || field.type === 'content') {
    return null;
  }

  // Check required fields. For rating fields, treat `0` as "not selected"
  // — required-ness on rating means "value must be >= 1".
  const isEmpty =
    value === undefined ||
    value === null ||
    value === '' ||
    (Array.isArray(value) && value.length === 0) ||
    (field.type === 'rating' && Number(value) === 0);

  if (field.required && isEmpty) {
    return lang === 'en'
      ? `${label} is required`
      : `${label} est obligatoire`;
  }

  // Skip other validations if empty and not required
  if (isEmpty) {
    return null;
  }

  // Type-specific validations
  switch (field.type) {
    case 'email':
      if (!emailRegex.test(String(value).trim())) {
        return lang === 'en'
          ? 'Please enter a valid email address'
          : 'Veuillez entrer une adresse email valide';
      }
      break;

    case 'phone':
      if (!isValidPhone(String(value).trim())) {
        return lang === 'en'
          ? 'Please enter a valid phone number'
          : 'Veuillez entrer un numéro de téléphone valide';
      }
      break;

    case 'number': {
      const numValue = Number(value);
      if (isNaN(numValue)) {
        return lang === 'en'
          ? 'Please enter a valid number'
          : 'Veuillez entrer un nombre valide';
      }
      // Detect misconfigured min > max and surface a distinct message so the
      // admin can spot the config issue.
      if (
        field.min !== undefined &&
        field.max !== undefined &&
        field.min > field.max
      ) {
        return lang === 'en'
          ? `Field is misconfigured: min (${field.min}) is greater than max (${field.max})`
          : `Champ mal configuré: min (${field.min}) est supérieur à max (${field.max})`;
      }
      if (field.min !== undefined && numValue < field.min) {
        return lang === 'en'
          ? `Value must be at least ${field.min}`
          : `La valeur doit être au moins ${field.min}`;
      }
      if (field.max !== undefined && numValue > field.max) {
        return lang === 'en'
          ? `Value must be at most ${field.max}`
          : `La valeur doit être au maximum ${field.max}`;
      }
      break;
    }

    case 'text':
    case 'textarea': {
      const strValue = String(value);
      if (field.minLength !== undefined && strValue.length < field.minLength) {
        return lang === 'en'
          ? `Must be at least ${field.minLength} characters`
          : `Doit contenir au moins ${field.minLength} caractères`;
      }
      if (field.maxLength !== undefined && strValue.length > field.maxLength) {
        return lang === 'en'
          ? `Must be at most ${field.maxLength} characters`
          : `Doit contenir au maximum ${field.maxLength} caractères`;
      }
      break;
    }

    case 'rating': {
      // Only enforce the range check when the value is meaningfully set.
      // A non-required rating with value 0 is considered "empty" above and
      // never reaches this branch.
      const ratingValue = Number(value);
      const maxStars = field.maxStars || 5;
      if (Number.isNaN(ratingValue) || ratingValue < 1 || ratingValue > maxStars) {
        return lang === 'en'
          ? `Please select a rating between 1 and ${maxStars}`
          : `Veuillez sélectionner une évaluation entre 1 et ${maxStars}`;
      }
      break;
    }

    case 'signature':
      // Signature must be a well-formed base64 data URL of an image.
      if (
        typeof value !== 'string' ||
        !/^data:image\/(png|jpeg|jpg|svg\+xml);base64,[A-Za-z0-9+/=]{16,}$/.test(value)
      ) {
        return lang === 'en'
          ? 'Please provide a valid signature'
          : 'Veuillez fournir une signature valide';
      }
      break;
  }

  // Custom regex pattern validation (applies to text-like fields)
  if (field.pattern && ['text', 'textarea', 'email', 'phone'].includes(field.type)) {
    try {
      const re = new RegExp(field.pattern);
      if (!re.test(String(value))) {
        return lang === 'en'
          ? 'Please enter a valid value'
          : 'Veuillez entrer une valeur valide';
      }
    } catch {
      // Invalid regex in the field config — ignore rather than block submission.
    }
  }

  return null;
}

/**
 * Validates all form fields and returns validation result
 */
export function validateFormFields(
  fields: FormField[],
  values: Record<string, any>,
  lang: 'en' | 'fr' = 'en'
): ValidationResult {
  const errors: ValidationError[] = [];
  const fieldErrors: Record<string, string> = {};

  for (const field of fields) {
    const error = validateField(field, values[field.id], lang);
    if (error) {
      errors.push({ fieldId: field.id, message: error });
      fieldErrors[field.id] = error;
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    fieldErrors,
  };
}

/**
 * Validates submitter information
 */
export function validateSubmitterInfo(
  email: string | undefined,
  name: string | undefined,
  lang: 'en' | 'fr' = 'en'
): { emailError?: string; nameError?: string } {
  const result: { emailError?: string; nameError?: string } = {};

  // Validate email format if provided
  if (email && email.trim()) {
    if (!emailRegex.test(email.trim())) {
      result.emailError = lang === 'en'
        ? 'Please enter a valid email address'
        : 'Veuillez entrer une adresse email valide';
    }
    if (email.trim().length > 255) {
      result.emailError = lang === 'en'
        ? 'Email must be less than 255 characters'
        : 'L\'email doit contenir moins de 255 caractères';
    }
  }

  // Validate name length if provided
  if (name && name.trim().length > 200) {
    result.nameError = lang === 'en'
      ? 'Name must be less than 200 characters'
      : 'Le nom doit contenir moins de 200 caractères';
  }

  return result;
}

/**
 * Zod schema for public form submission.
 * The submitter_email validator is derived from the same emailRegex used by
 * validateField, so per-field email inputs and the top-level submitter email
 * agree on what "valid" means.
 */
export const publicSubmissionSchema = z.object({
  responses: z.record(z.any()).refine(
    (val) => Object.keys(val).length > 0,
    { message: 'At least one response is required' }
  ),
  submitter_name: z.string()
    .max(200, 'Name must be less than 200 characters')
    .optional()
    .nullable()
    .transform(val => val?.trim() || undefined),
  submitter_email: z.string()
    .max(255, 'Email must be less than 255 characters')
    .regex(emailRegex, 'Please enter a valid email address')
    .optional()
    .nullable()
    .or(z.literal(''))
    .transform(val => val?.trim() || undefined),
  notes: z.string()
    .max(2000, 'Notes must be less than 2000 characters')
    .optional()
    .nullable()
    .transform(val => val?.trim() || undefined),
});

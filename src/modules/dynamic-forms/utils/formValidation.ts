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

// Email validation regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Phone validation regex (flexible international format)
const phoneRegex = /^[\d\s\-+()]{7,20}$/;

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
  if (field.type === 'section' || field.type === 'page_break') {
    return null;
  }
  
  // Check required fields
  const isEmpty = value === undefined || value === null || value === '' || 
    (Array.isArray(value) && value.length === 0);
  
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
      if (!emailRegex.test(String(value))) {
        return lang === 'en' 
          ? 'Please enter a valid email address' 
          : 'Veuillez entrer une adresse email valide';
      }
      break;
      
    case 'phone':
      if (!phoneRegex.test(String(value))) {
        return lang === 'en' 
          ? 'Please enter a valid phone number' 
          : 'Veuillez entrer un numéro de téléphone valide';
      }
      break;
      
    case 'number':
      const numValue = Number(value);
      if (isNaN(numValue)) {
        return lang === 'en' 
          ? 'Please enter a valid number' 
          : 'Veuillez entrer un nombre valide';
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
      
    case 'text':
    case 'textarea':
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
      
    case 'rating':
      const ratingValue = Number(value);
      if (ratingValue < 1 || ratingValue > (field.maxStars || 5)) {
        return lang === 'en' 
          ? `Please select a rating` 
          : `Veuillez sélectionner une évaluation`;
      }
      break;
      
    case 'signature':
      // Signature should be a base64 data URL
      if (typeof value !== 'string' || !value.startsWith('data:image/')) {
        return lang === 'en' 
          ? 'Please provide a valid signature' 
          : 'Veuillez fournir une signature valide';
      }
      break;
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
 * Zod schema for public form submission
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
    .email('Please enter a valid email address')
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

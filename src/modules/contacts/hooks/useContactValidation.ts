import { useState, useCallback } from 'react';
import { TFunction } from 'i18next';

// ── Regex patterns ──────────────────────────────────────────────────────────

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[\d\s\+\-\(\)\.]+$/;
const NAME_REGEX = /^[^\d]*$/;

export interface FieldError {
  field: string;
  message: string;
}

// ── Validators (i18n-aware) ─────────────────────────────────────────────────

export function validateEmail(email: string, t: TFunction): string | null {
  if (!email.trim()) return null;
  if (!EMAIL_REGEX.test(email.trim())) return t('addPage.validation.email_invalid');
  if (email.trim().length > 255) return t('addPage.validation.email_too_long');
  return null;
}

export function validatePhone(phone: string, t: TFunction): string | null {
  if (!phone.trim()) return null;
  if (!PHONE_REGEX.test(phone.trim())) return t('addPage.validation.phone_invalid_chars');
  if (phone.trim().length < 4) return t('addPage.validation.phone_too_short');
  if (phone.trim().length > 50) return t('addPage.validation.phone_too_long');
  return null;
}

export function validateName(name: string, t: TFunction, label: string): string | null {
  if (!name.trim()) return t('addPage.validation.name_required', { label });
  if (!NAME_REGEX.test(name.trim())) return t('addPage.validation.name_no_numbers', { label });
  if (name.trim().length > 100) return t('addPage.validation.name_too_long', { label });
  return null;
}

export function validateAmount(value: string, t: TFunction): string | null {
  if (!value.trim()) return t('addPage.validation.amount_required');
  const num = Number(value);
  if (isNaN(num)) return t('addPage.validation.amount_must_be_number');
  if (num <= 0) return t('addPage.validation.amount_positive');
  if (num > 999_999_999) return t('addPage.validation.amount_too_large');
  return null;
}

export function validateRequired(value: string, t: TFunction, label: string): string | null {
  if (!value.trim()) return t('addPage.validation.field_required', { label });
  return null;
}

// ── Hook ────────────────────────────────────────────────────────────────────

export function useContactValidation(t: TFunction) {
  const [errors, setErrors] = useState<Record<string, string | null>>({});

  const setFieldError = useCallback((field: string, error: string | null) => {
    setErrors(prev => ({ ...prev, [field]: error }));
  }, []);

  const validateField = useCallback((field: string, value: string, label?: string) => {
    let error: string | null = null;

    switch (field) {
      case 'email':
        error = validateEmail(value, t);
        break;
      case 'phone':
        error = validatePhone(value, t);
        break;
      case 'firstName':
        error = value.trim() ? (NAME_REGEX.test(value.trim()) ? null : t('addPage.validation.name_no_numbers', { label: label || t('addPage.fields.first_name_required_label').replace(' *', '') })) : null;
        break;
      case 'lastName':
        error = value.trim() ? (NAME_REGEX.test(value.trim()) ? null : t('addPage.validation.name_no_numbers', { label: label || t('addPage.fields.last_name_required_label').replace(' *', '') })) : null;
        break;
      case 'name':
        error = value.trim() ? (NAME_REGEX.test(value.trim()) ? null : t('addPage.validation.name_no_numbers', { label: label || t('contacts.form.labels.first_name') })) : null;
        break;
      case 'amount':
        error = validateAmount(value, t);
        break;
    }

    setFieldError(field, error);
    return error;
  }, [setFieldError, t]);

  const getError = useCallback((field: string): string | null => {
    return errors[field] ?? null;
  }, [errors]);

  const hasErrors = useCallback((): boolean => {
    return Object.values(errors).some(e => e !== null);
  }, [errors]);

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  return { errors, validateField, getError, hasErrors, setFieldError, clearErrors };
}

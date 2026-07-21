import { toast } from 'sonner';
import type { TFunction } from 'i18next';
import { ApiError } from '../services/apiError';

/**
 * Structured error → i18n toast bridge.
 *
 * Backend endpoints in the Purchases module return `{ error: { code, message, missing? } }`.
 * `purchaseService` maps that to `ApiError { code, missing, message, status }`.
 * This helper turns that into a translated sonner toast so every page displays
 * a consistent, localized message and — when applicable — a `description`
 * listing the missing fields (e.g. TEJ export).
 *
 * Contract:
 *   - Known codes → `purchases:errors.<CODE>` title.
 *   - `missing[]` present → localized field labels joined into the description.
 *   - Unknown code → fall back to `error.message` or the caller-supplied string.
 *   - HTTP 409 without a code → treat as duplicate submission.
 *
 * Callers should keep the fallback specific to the action ("Failed to create
 * invoice") so users still get a useful message when the server didn't send a
 * structured code (network error, 500, offline queue, etc.).
 */

// Codes we surface today. Any code not in this set falls back to the raw
// backend message — that keeps the helper permissive as the API evolves without
// requiring an i18n change for every new server-side code.
const KNOWN_CODES = new Set([
  'DUPLICATE_SUPPLIER_REF',
  'INVALID_TRANSITION',
  'ITEMS_FROZEN',
  'TEJ_INCOMPLETE',
  'OVER_RECEIPT',
  'LINKED_INVOICE_BLOCK',
  'PO_ITEM_MISMATCH',
  'NEGATIVE_QUANTITY',
  'NEGATIVE_PRICE',
  'SOFT_DELETED_GR',
  'VALIDATION_ERROR',
  'FORBIDDEN',
  'NOT_FOUND',
  'CONFLICT',
]);

interface FormatOpts {
  /** Human message to fall back on when the error has no known code. */
  fallback?: string;
  /** Extra i18n interpolation values (e.g. `{ articleName }`). */
  values?: Record<string, unknown>;
}

export interface FormattedApiError {
  title: string;
  description?: string;
  code: string | null;
  status: number;
}

/**
 * Turn any error thrown by a purchase service call into a `{ title, description }`
 * suitable for a toast. Safe to call with a non-ApiError — it degrades to the
 * error's `message` or the caller's `fallback`.
 */
export function formatApiError(
  err: unknown,
  t: TFunction,
  opts: FormatOpts = {},
): FormattedApiError {
  const fallback = opts.fallback ?? (t('common.error', 'Something went wrong') as string);

  if (err instanceof ApiError) {
    // 409 with no explicit code = idempotency/uniqueness conflict on the server.
    const code =
      err.code ?? (err.status === 409 ? 'CONFLICT' : err.status === 404 ? 'NOT_FOUND' : err.status === 403 ? 'FORBIDDEN' : null);

    let title: string;
    if (code && KNOWN_CODES.has(code)) {
      // The 2nd arg is the default value so a missing key gracefully falls back
      // to the backend message rather than showing `errors.INVALID_TRANSITION`.
      title = t(`errors.${code}`, err.message || fallback, opts.values) as string;
    } else {
      title = err.message || fallback;
    }

    // Missing-field list → readable description. Translate each field key via
    // `errors.fields.<name>` with the raw name as default, so unknown fields
    // still render something meaningful.
    let description: string | undefined;
    if (err.missing.length > 0) {
      const labels = err.missing.map((f) => t(`errors.fields.${f}`, f) as string);
      description = t('errors.missingFieldsList', 'Missing: {{fields}}', {
        fields: labels.join(', '),
      }) as string;
    }
    return { title, description, code, status: err.status };
  }

  // Non-ApiError (network, thrown string, unknown). Best-effort message extract.
  const message =
    (err && typeof err === 'object' && 'message' in err && typeof (err as any).message === 'string'
      ? (err as any).message
      : undefined) ?? fallback;
  return { title: message, code: null, status: 0 };
}

/**
 * Convenience: display the formatted error as a sonner toast. Returns the
 * formatted payload in case the caller also wants to store it in local state
 * (inline banner, form field errors, etc.).
 */
export function toastApiError(
  err: unknown,
  t: TFunction,
  opts: FormatOpts = {},
): FormattedApiError {
  const formatted = formatApiError(err, t, opts);
  toast.error(formatted.title, formatted.description ? { description: formatted.description } : undefined);
  return formatted;
}

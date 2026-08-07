// Unified error-message extractor. Handles:
//  - plain Error thrown by fetch-based API layer (error.message)
//  - axios-shaped errors (error.response.data.message / .error / .title / .errors[])
//  - raw JSON error bodies passed directly (from response.json())
//  - unknown / thrown non-Error values
//
// The second argument may be:
//  - undefined              → returns extracted message, or '' if none
//  - a string fallback      → returned when no message can be extracted
//  - an HTTP status number  → formats fallback as `[HTTP <status>] Request failed`

type ErrorBodyLike = {
  message?: string;
  error?: string;
  title?: string;
  detail?: string;
  errors?: unknown;
  response?: { data?: ErrorBodyLike };
};

function pickString(...vals: unknown[]): string | undefined {
  for (const v of vals) {
    if (typeof v === 'string' && v.trim()) return v;
  }
  return undefined;
}

function normalizeFallback(fallback?: string | number): string {
  if (fallback == null) return '';
  if (typeof fallback === 'number') return `[HTTP ${fallback}] Request failed`;
  return fallback;
}

export function extractApiErrorMessage(
  error: unknown,
  fallback?: string | number,
): string {
  const fb = normalizeFallback(fallback);
  if (error == null) return fb;
  if (typeof error === 'string') return error || fb;

  const body = error as ErrorBodyLike;
  // Nested axios-shape: error.response.data.*
  const nested = body?.response?.data;
  const fromNested = nested
    ? pickString(nested.message, nested.error, nested.title, nested.detail)
    : undefined;
  if (fromNested) return fromNested;

  // Direct body-shape: { message | error | title | detail }
  const direct = pickString(body.message, body.error, body.title, body.detail);
  if (direct) return direct;

  if (error instanceof Error && error.message) return error.message;

  return fb;
}

/**
 * Extract structured per-line error details from an API error body.
 * Supports common shapes:
 *   - { errors: string[] }
 *   - { errors: { <field>: string | string[] } }   (ASP.NET ModelState)
 *   - { errors: [{ message: string }] }
 * Falls back to splitting the top-level message on newlines.
 */
export function extractApiErrorDetails(
  error: unknown,
  fallbackStatus?: number,
): string[] {
  if (error == null) return [];
  const body = error as ErrorBodyLike;
  const source = (body?.response?.data ?? body) as ErrorBodyLike;
  const errs = source?.errors;
  const out: string[] = [];

  if (Array.isArray(errs)) {
    for (const item of errs) {
      if (typeof item === 'string') {
        if (item.trim()) out.push(item.trim());
      } else if (item && typeof item === 'object') {
        const msg = pickString(
          (item as ErrorBodyLike).message,
          (item as ErrorBodyLike).error,
          (item as ErrorBodyLike).title,
          (item as ErrorBodyLike).detail,
        );
        if (msg) out.push(msg);
      }
    }
  } else if (errs && typeof errs === 'object') {
    for (const [field, val] of Object.entries(errs)) {
      if (typeof val === 'string' && val.trim()) {
        out.push(`${field}: ${val.trim()}`);
      } else if (Array.isArray(val)) {
        for (const v of val) {
          if (typeof v === 'string' && v.trim()) out.push(`${field}: ${v.trim()}`);
        }
      }
    }
  }

  if (out.length === 0) {
    const msg = extractApiErrorMessage(error, fallbackStatus);
    if (msg) {
      msg
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean)
        .forEach((l) => out.push(l));
    }
  }

  return out;
}

/** Message from a thrown Error/string/unknown, without axios-body handling. */
export function extractThrownErrorMessage(
  error: unknown,
  fallback = 'An unexpected error occurred',
): string {
  if (error == null) return fallback;
  if (typeof error === 'string') return error || fallback;
  if (error instanceof Error && error.message) return error.message;
  const anyErr = error as { message?: unknown };
  if (typeof anyErr?.message === 'string' && anyErr.message) return anyErr.message;
  return fallback;
}

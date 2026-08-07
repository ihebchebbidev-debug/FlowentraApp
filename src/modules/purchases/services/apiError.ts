// Structured wrapper around an apiFetch failure. Backend responses look like
//   { success: false, error: { code, message, missing?: string[] } }
// so downstream code can branch on `code` (e.g. INVALID_TRANSITION, ITEMS_FROZEN,
// DUPLICATE_SUPPLIER_REF, TEJ_INCOMPLETE) instead of pattern-matching messages.
export class ApiError extends Error {
  readonly status: number;
  readonly code: string | null;
  readonly missing: string[];
  readonly body: unknown;

  constructor(opts: {
    message: string;
    status: number;
    code?: string | null;
    missing?: string[];
    body?: unknown;
  }) {
    super(opts.message);
    this.name = 'ApiError';
    this.status = opts.status;
    this.code = opts.code ?? null;
    this.missing = opts.missing ?? [];
    this.body = opts.body;
  }

}

/**
 * Build an ApiError from an apiFetch result. Accepts the whole result shape
 * so callers don't need to re-destructure.
 *
 * The apiFetch layer prepends `[CODE] ` to `.error` when a code is present in
 * the backend body — we strip that prefix here so the user-facing message
 * stays clean and the code lives on its own field.
 */
export function apiErrorFromResult(
  result: { status: number; error?: string; errorBody?: any },
  fallbackMessage: string,
): ApiError {
  const body = result.errorBody ?? null;
  const bodyErr = (body && typeof body === 'object' ? (body as any).error : undefined) ?? null;
  const code: string | null =
    (bodyErr && typeof bodyErr.code === 'string' ? bodyErr.code : null) ??
    // Some endpoints return `{ code, message }` at the top level.
    (body && typeof body === 'object' && typeof (body as any).code === 'string' ? (body as any).code : null);

  const missingRaw = bodyErr?.missing ?? (body as any)?.missing;
  const missing: string[] = Array.isArray(missingRaw)
    ? missingRaw.filter((x): x is string => typeof x === 'string')
    : [];

  const rawMessage =
    (bodyErr && typeof bodyErr.message === 'string' ? bodyErr.message : undefined) ??
    result.error ??
    fallbackMessage;
  // Strip the `[CODE] ` prefix apiFetch's extractor prepends; `code` is now on its own field.
  const message = rawMessage.replace(/^\[[A-Z0-9_]+\]\s*/, '');

  return new ApiError({
    message,
    status: result.status,
    code,
    missing,
    body,
  });
}

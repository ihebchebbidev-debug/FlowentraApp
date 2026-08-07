/**
 * Standardized filename builder for exported PDFs.
 *
 * Ensures every module uses the same construction rule:
 *   `<prefix>-<identifier>[-<suffix>].pdf`
 *
 * The identifier is sanitized (whitespace collapsed, unsafe filesystem
 * characters stripped) so free-text sources like custom offer numbers or user
 * captions cannot produce broken filenames on Windows / macOS / Linux.
 */

/** Strip characters that are illegal or awkward in filenames. */
export function sanitizeFilenamePart(input: unknown): string {
  if (input === null || input === undefined) return '';
  const raw = String(input).trim();
  if (!raw) return '';
  return raw
    // Replace path separators and control characters
    .replace(/[\\/:*?"<>|\u0000-\u001F]+/g, '-')
    // Collapse whitespace
    .replace(/\s+/g, '-')
    // Collapse repeated dashes
    .replace(/-+/g, '-')
    // Trim leading/trailing dashes and dots (dots at end are stripped on Windows)
    .replace(/^[-.]+|[-.]+$/g, '');
}

export interface PdfFilenameOptions {
  /** Short module prefix e.g. "quote", "dispatch-report". */
  prefix: string;
  /**
   * Preferred human-readable identifier (e.g. offer number).
   * If empty/nullish, `fallbackId` is used instead — never both.
   */
  preferredId?: string | number | null;
  /** Stable fallback identifier (e.g. numeric database id). */
  fallbackId?: string | number | null;
  /** Optional suffix, appended before `.pdf` (e.g. "signed"). */
  suffix?: string | null;
}

export function buildPdfFilename({
  prefix,
  preferredId,
  fallbackId,
  suffix,
}: PdfFilenameOptions): string {
  const safePrefix = sanitizeFilenamePart(prefix) || 'document';
  const preferred = sanitizeFilenamePart(preferredId);
  const fallback = sanitizeFilenamePart(fallbackId);
  // preferred XOR fallback — never mix both so filenames stay predictable.
  const identifier = preferred || fallback || 'export';
  const safeSuffix = sanitizeFilenamePart(suffix);
  return safeSuffix
    ? `${safePrefix}-${identifier}-${safeSuffix}.pdf`
    : `${safePrefix}-${identifier}.pdf`;
}

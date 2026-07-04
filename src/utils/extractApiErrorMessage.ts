/**
 * Normalize backend error JSON into a single human-readable string.
 * Handles flat bodies, nested { error: { message, details } }, and ASP.NET envelopes.
 */
export function extractApiErrorMessage(body: unknown, status?: number): string {
  const withStatus = (message: string) => formatHttpStatusPrefix(message, status);

  if (body == null) {
    return withStatus('Request failed');
  }

  if (typeof body === 'string' && body.trim()) {
    return withStatus(body.trim());
  }

  if (typeof body !== 'object') {
    return withStatus('Request failed');
  }

  const record = body as Record<string, unknown>;

  // ASP.NET model-validation ProblemDetails: { title, errors: { "Field": ["msg"] } }
  const validationLines = extractValidationErrorLines(record);
  if (validationLines.length > 0) {
    const title =
      (typeof record.title === 'string' && record.title.trim()) ||
      (typeof record.message === 'string' && record.message.trim()) ||
      'Validation failed';
    return withStatus(`${title}\n${validationLines.join('\n')}`);
  }

  const nested = record.error;

  if (nested && typeof nested === 'object') {
    const nestedRecord = nested as Record<string, unknown>;
    const parts = [nestedRecord.message, nestedRecord.details]
      .filter((part) => typeof part === 'string' && part.trim())
      .map((part) => (part as string).trim());
    if (nestedRecord.code && typeof nestedRecord.code === 'string') {
      parts.unshift(`[${nestedRecord.code}]`);
    }
    if (parts.length > 0) {
      return withStatus(parts.join(' — '));
    }
  }

  if (typeof record.message === 'string' && record.message.trim()) {
    let message = record.message.trim();
    if (typeof record.error === 'string' && record.error.trim() && record.error !== message) {
      message = `${record.error}: ${message}`;
    }
    return withStatus(message);
  }

  if (typeof record.error === 'string' && record.error.trim()) {
    return withStatus(record.error.trim());
  }

  if (typeof record.title === 'string' && record.title.trim()) {
    const detail = typeof record.detail === 'string' ? record.detail.trim() : '';
    if (detail && detail !== record.title.trim()) {
      return withStatus(`${record.title.trim()}: ${detail}`);
    }
    return withStatus(record.title.trim());
  }

  if (typeof record.detail === 'string' && record.detail.trim()) {
    return withStatus(record.detail.trim());
  }

  try {
    const serialized = JSON.stringify(body);
    if (serialized && serialized !== '{}') {
      return withStatus(serialized);
    }
  } catch {
    /* ignore */
  }

  return withStatus('Request failed');
}

/** Field-level validation messages from ASP.NET ProblemDetails. */
export function extractValidationErrorLines(body: unknown): string[] {
  if (!body || typeof body !== 'object') return [];
  const record = body as Record<string, unknown>;
  const bag = record.errors;
  if (!bag || typeof bag !== 'object' || Array.isArray(bag)) return [];
  return Object.entries(bag as Record<string, unknown>).flatMap(([field, msgs]) => {
    const list = Array.isArray(msgs) ? msgs : [msgs];
    const label = humanizeValidationField(field);
    return list
      .filter((m) => m != null && String(m).trim())
      .map((m) => `${label}: ${String(m).trim()}`);
  });
}

/**
 * Turn ASP.NET paths like `Articles[16].Duration` into readable labels.
 * Array index is 0-based in JSON → Excel row ≈ index + 2 (header row).
 */
function humanizeValidationField(field: string): string {
  const arrayMatch = field.match(/^(\w+)\[(\d+)\]\.(.+)$/);
  if (arrayMatch) {
    const [, collection, index, prop] = arrayMatch;
    const excelRow = Number(index) + 2;
    const friendlyCollection = collection.replace(/([a-z])([A-Z])/g, '$1 $2');
    return `Row ${excelRow} (${friendlyCollection} · ${prop})`;
  }

  const reqMatch = field.match(/^(\w+)\.(\w+)$/);
  if (reqMatch) {
    return `${reqMatch[1]}.${reqMatch[2]}`;
  }

  return field;
}

/** Full detail list for UI display (validation lines + primary message). */
export function extractApiErrorDetails(body: unknown, status?: number): string[] {
  const validation = extractValidationErrorLines(body);
  if (validation.length > 0) return validation;
  const message = extractApiErrorMessage(body, status);
  return message ? [message] : [];
}

function formatHttpStatusPrefix(message: string, status?: number): string {
  if (!status || message.includes(`HTTP ${status}`)) {
    return message;
  }
  return `[HTTP ${status}] ${message}`;
}

/** Best-effort message from a thrown fetch/axios error. */
export function extractThrownErrorMessage(error: unknown, fallback = 'Request failed'): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message.trim();
  }
  if (typeof error === 'string' && error.trim()) {
    return error.trim();
  }
  if (error && typeof error === 'object') {
    const response = (error as { response?: { status?: number; data?: unknown } }).response;
    if (response) {
      return extractApiErrorMessage(response.data, response.status);
    }
  }
  return fallback;
}

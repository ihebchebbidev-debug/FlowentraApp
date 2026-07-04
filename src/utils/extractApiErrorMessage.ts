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
    return withStatus(detail ? `${record.title}: ${detail}` : record.title.trim());
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

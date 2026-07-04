import { extractApiErrorMessage, extractApiErrorDetails, extractThrownErrorMessage } from '@/utils/extractApiErrorMessage';
import type { BulkImportResult } from './types';

/** Thrown when the bulk-import HTTP request itself fails (not per-row validation). */
export class BulkImportRequestError extends Error {
  readonly status?: number;
  readonly details: string[];

  constructor(message: string, opts?: { status?: number; details?: string[] }) {
    super(message);
    this.name = 'BulkImportRequestError';
    this.status = opts?.status;
    this.details = opts?.details ?? (message ? [message] : []);
  }
}

export async function parseBulkImportHttpResponse<TPayload>(
  response: Response,
  itemCount: number,
  pickResult: (data: Record<string, unknown>) => BulkImportResult,
): Promise<BulkImportResult> {
  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }

  if (!response.ok) {
    const message = extractApiErrorMessage(body, response.status);
    const details = extractApiErrorDetails(body, response.status);
    throw new BulkImportRequestError(message, {
      status: response.status,
      details: details.length > 0 ? details : [message],
    });
  }

  const envelope = (body && typeof body === 'object' ? body : {}) as Record<string, unknown>;
  const data = (envelope.data ?? envelope) as Record<string, unknown>;

  // Backend returned 200 but success:false
  if (envelope.success === false) {
    const message = extractApiErrorMessage(envelope, response.status);
    const details = extractApiErrorDetails(envelope, response.status);
    throw new BulkImportRequestError(message, {
      status: response.status,
      details: details.length > 0 ? details : [message],
    });
  }

  const result = pickResult(data);
  result.totalProcessed = result.totalProcessed || itemCount;
  return result;
}

export function bulkImportErrorFromThrown(error: unknown): BulkImportRequestError {
  if (error instanceof BulkImportRequestError) {
    return error;
  }
  const message = extractThrownErrorMessage(error, 'Bulk import failed');
  const statusMatch = message.match(/^\[HTTP (\d{3})\]/);
  const status = statusMatch ? Number(statusMatch[1]) : undefined;
  return new BulkImportRequestError(message, { status, details: [message] });
}

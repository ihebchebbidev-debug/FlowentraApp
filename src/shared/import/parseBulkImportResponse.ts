import {
  extractApiErrorMessage,
  extractApiErrorDetails,
  extractThrownErrorMessage,
} from '@/utils/extractApiErrorMessage';
import type { BulkImportResult } from './types';

/** Thrown when the bulk-import HTTP request itself fails (not per-row validation). */
export class BulkImportRequestError extends Error {
  readonly status?: number;
  readonly details: string[];

  constructor(message: string, opts?: { status?: number; details?: string[] }) {
    super(message);
    this.name = 'BulkImportRequestError';
    this.status = opts?.status;
    this.details = opts?.details?.length
      ? opts.details
      : splitMessageLines(message);
  }
}

export function splitMessageLines(message: string): string[] {
  return message
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

/** Build a rich import error from a raw HTTP status + JSON body. */
export function bulkImportErrorFromHttp(
  status: number,
  body: unknown,
  fallback = 'Bulk import failed',
): BulkImportRequestError {
  const message = extractApiErrorMessage(body, status) || `[HTTP ${status}] ${fallback}`;
  const details = extractApiErrorDetails(body, status);
  return new BulkImportRequestError(message, {
    status,
    details: details.length > 0 ? details : splitMessageLines(message),
  });
}

export async function parseBulkImportHttpResponse(
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
    throw bulkImportErrorFromHttp(response.status, body);
  }

  const envelope = (body && typeof body === 'object' ? body : {}) as Record<string, unknown>;
  const data = (envelope.data ?? envelope) as Record<string, unknown>;

  if (envelope.success === false) {
    throw bulkImportErrorFromHttp(response.status, envelope);
  }

  const result = pickResult(data);
  result.totalProcessed = result.totalProcessed || itemCount;
  return result;
}

/** Axios / fetch rejection with optional `response.data`. */
export function bulkImportErrorFromAxios(
  error: unknown,
  fallback = 'Bulk import failed',
): BulkImportRequestError {
  if (error instanceof BulkImportRequestError) {
    return error;
  }

  const axiosErr = error as { response?: { status?: number; data?: unknown }; message?: string };
  if (axiosErr.response) {
    return bulkImportErrorFromHttp(
      axiosErr.response.status ?? 0,
      axiosErr.response.data,
      fallback,
    );
  }

  return bulkImportErrorFromThrown(error, fallback);
}

export function bulkImportErrorFromThrown(
  error: unknown,
  fallback = 'Bulk import failed',
): BulkImportRequestError {
  if (error instanceof BulkImportRequestError) {
    return error;
  }

  const axiosErr = error as { response?: { status?: number; data?: unknown } };
  if (axiosErr.response?.data !== undefined) {
    return bulkImportErrorFromHttp(
      axiosErr.response.status ?? 0,
      axiosErr.response.data,
      fallback,
    );
  }

  const message = extractThrownErrorMessage(error, fallback);
  const statusMatch = message.match(/^\[HTTP (\d{3})\]/);
  const status = statusMatch ? Number(statusMatch[1]) : undefined;
  const lines = splitMessageLines(message);

  return new BulkImportRequestError(message, {
    status,
    details: lines.length > 0 ? lines : [fallback],
  });
}

/** Normalize any import failure for UI (toast + detail list). */
export function formatImportFailure(error: unknown): { message: string; details: string[]; status?: number } {
  const bulk = bulkImportErrorFromThrown(error);
  return {
    message: bulk.message,
    details: bulk.details,
    status: bulk.status,
  };
}

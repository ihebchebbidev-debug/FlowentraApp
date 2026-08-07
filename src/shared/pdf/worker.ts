/**
 * Self-hosted pdf.js worker.
 *
 * Uses Vite's `?url` import so the worker ships with the app bundle instead of
 * being fetched from a third-party CDN (previously cdnjs.cloudflare.com — a
 * single point of failure that broke every PDF preview if the CDN was blocked
 * or slow).
 */
import * as pdfjsLib from 'pdfjs-dist';
// eslint-disable-next-line import/no-unresolved
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.js?url';

let configured = false;

export function ensurePdfWorker(): void {
  if (configured) return;
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl as unknown as string;
  configured = true;
}

// Auto-configure on import for eager consumers.
ensurePdfWorker();

export { pdfjsLib };

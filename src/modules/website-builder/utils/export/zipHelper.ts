/**
 * ZIP creation utility using fflate for browser-side ZIP generation.
 */
import { zipSync, strToU8 } from 'fflate';
import type { ExportedFile } from './types';

/**
 * Create a ZIP blob from an array of exported files.
 */
export function createZipBlob(files: ExportedFile[]): Blob {
  const zipData: Record<string, Uint8Array> = {};

  for (const file of files) {
    const content = typeof file.content === 'string'
      ? strToU8(file.content)
      : file.content;
    zipData[file.path] = content;
  }

  const zipped = zipSync(zipData, { level: 6 });
  return new Blob([zipped.buffer as ArrayBuffer], { type: 'application/zip' });
}

/**
 * Trigger a browser download for a Blob.
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Create a ZIP from files and trigger download.
 */
export function downloadAsZip(files: ExportedFile[], filename: string): void {
  const blob = createZipBlob(files);
  downloadBlob(blob, filename);
}

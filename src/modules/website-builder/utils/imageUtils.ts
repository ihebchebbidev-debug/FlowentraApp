/**
 * Image utilities for the website builder.
 *
 * Uses base64 data URIs so images persist in localStorage across page reloads.
 * When backend storage is integrated, replace `readFileAsDataUrl` with an
 * upload call that returns a permanent URL.
 */

/** Maximum file size for image uploads (5 MB) */
const MAX_FILE_SIZE = 5 * 1024 * 1024;

/** Allowed MIME types */
const ALLOWED_TYPES = new Set([
  'image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml', 'image/avif',
]);

/**
 * Validate an image file before reading.
 * Throws a descriptive error if the file is invalid.
 */
export function validateImageFile(file: File): void {
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error(`Unsupported image type: ${file.type}. Use PNG, JPG, GIF, WebP, SVG, or AVIF.`);
  }
  if (file.size > MAX_FILE_SIZE) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    throw new Error(`Image too large (${sizeMB} MB). Maximum is 5 MB.`);
  }
}

/**
 * Read a File as a base64 data URI string.
 * Validates the file first, then reads it.
 */
export function readFileAsDataUrl(file: File): Promise<string> {
  validateImageFile(file);
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to read file'));
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/**
 * Check if a string is a data URI (base64 encoded image).
 */
export function isDataUri(value: string): boolean {
  return value.startsWith('data:');
}

/**
 * Check if a string looks like an image source (URL, blob, or data URI).
 */
export function isImageSrc(value: string): boolean {
  if (!value || typeof value !== 'string') return false;
  return (
    value.startsWith('http://') ||
    value.startsWith('https://') ||
    value.startsWith('blob:') ||
    value.startsWith('data:') ||
    value.startsWith('/')
  );
}

/**
 * Get a display-friendly label for an image source.
 * Never shows raw base64 — just a clean label.
 */
export function getImageLabel(value: string): string {
  if (!value) return '';
  if (value.startsWith('data:')) return 'Uploaded image';
  if (value.startsWith('blob:')) return 'Uploaded image';
  try {
    const url = new URL(value);
    const path = url.pathname.split('/').pop() || url.hostname;
    return path.length > 40 ? path.slice(0, 37) + '...' : path;
  } catch {
    return value.length > 40 ? value.slice(0, 37) + '...' : value;
  }
}

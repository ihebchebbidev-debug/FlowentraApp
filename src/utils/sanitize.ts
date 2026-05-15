import DOMPurify from 'dompurify';

/**
 * Sanitize HTML content to prevent XSS attacks.
 * Uses DOMPurify to strip dangerous tags/attributes while keeping safe formatting.
 */
export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [
      'b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span', 'div', 'blockquote',
      'pre', 'code', 'img', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'hr', 'sup', 'sub', 'small', 'mark', 'del', 'ins', 'figure', 'figcaption',
    ],
    ALLOWED_ATTR: [
      'href', 'target', 'rel', 'src', 'alt', 'title', 'class', 'id',
      'width', 'height', 'style', 'colspan', 'rowspan',
    ],
    ALLOW_DATA_ATTR: false,
    ADD_ATTR: ['target'],
  });
}

/**
 * Sanitize HTML for inline/simple content (no block elements).
 */
export function sanitizeInlineHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'span', 'br', 'small', 'mark', 'del', 'ins', 'sup', 'sub'],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'style'],
    ALLOW_DATA_ATTR: false,
  });
}

/**
 * Create a safe dangerouslySetInnerHTML object from untrusted HTML.
 */
export function createSafeHtml(dirty: string): { __html: string } {
  return { __html: sanitizeHtml(dirty) };
}

/**
 * Create a safe dangerouslySetInnerHTML object for inline content.
 */
export function createSafeInlineHtml(dirty: string): { __html: string } {
  return { __html: sanitizeInlineHtml(dirty) };
}

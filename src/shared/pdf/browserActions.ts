import type { ReactElement } from 'react';
import { pdf } from '@react-pdf/renderer';

export async function createPdfBlob(document: ReactElement): Promise<Blob> {
  return pdf(document as any).toBlob();
}

/** Thrown when the browser blocked the print popup, so callers can show a specific hint. */
export class PopupBlockedError extends Error {
  constructor() {
    super('Unable to open print window — the browser blocked the popup.');
    this.name = 'PopupBlockedError';
  }
}

/** Thrown/detected when the user dismisses the native share sheet. Not a failure. */
export function isShareAbort(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}

/**
 * Opens the rendered PDF in a new window and triggers the print dialog.
 *
 * Robustness notes:
 * - The popup is opened synchronously (before the async render) so it is not
 *   treated as a programmatic popup by the browser.
 * - The print trigger is de-duplicated: `onload` and the safety timeout can both
 *   fire, but `.print()` only runs once.
 * - The object URL is revoked as soon as the document has loaded (plus a safety
 *   net), and immediately if the window is closed or the render fails — the old
 *   implementation leaked the blob for 60s on every call, and forever when the
 *   popup was blocked.
 */
export async function openPdfForPrint(document: ReactElement, title: string): Promise<void> {
  const printWindow = window.open('', '_blank', 'width=900,height=700');
  if (!printWindow) {
    throw new PopupBlockedError();
  }

  const safeTitle = String(title).replace(/[<>&"]/g, '');
  printWindow.document.write(
    `<!doctype html><title>${safeTitle}</title><body style="font-family: system-ui, sans-serif; padding: 24px;">Preparing PDF…</body>`
  );
  printWindow.document.close();

  let blob: Blob;
  try {
    blob = await createPdfBlob(document);
  } catch (error) {
    // Don't strand an empty window on the user's screen.
    try { printWindow.close(); } catch { /* noop */ }
    throw error;
  }

  if (printWindow.closed) return;

  const url = URL.createObjectURL(blob);
  let released = false;
  const release = () => {
    if (released) return;
    released = true;
    URL.revokeObjectURL(url);
  };

  let printed = false;
  const triggerPrint = () => {
    if (printed || printWindow.closed) return;
    printed = true;
    try {
      printWindow.focus();
      printWindow.print();
    } catch (error) {
      console.warn('PDF print window could not be focused:', error);
    }
    // The viewer has the bytes at this point; the URL can go.
    window.setTimeout(release, 1_000);
  };

  printWindow.onload = () => window.setTimeout(triggerPrint, 400);
  printWindow.location.href = url;

  // Safety net if `onload` never fires (some PDF viewer plugins don't emit it).
  window.setTimeout(triggerPrint, 1_500);
  window.setTimeout(release, 30_000);
}

/** Downloads a rendered PDF, revoking the object URL only after the browser has picked it up. */
export async function downloadPdfDocument(document: ReactElement, fileName: string): Promise<void> {
  const blob = await createPdfBlob(document);
  const url = URL.createObjectURL(blob);
  const anchor = window.document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.rel = 'noopener';
  window.document.body.appendChild(anchor);
  anchor.click();
  window.document.body.removeChild(anchor);
  // Revoking synchronously after `click()` can cancel the download in Safari/Firefox.
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export async function sharePdfDocument({
  document,
  fileName,
  title,
  text,
}: {
  document: ReactElement;
  fileName: string;
  title: string;
  text: string;
}): Promise<'file' | 'link'> {
  const blob = await createPdfBlob(document);
  const file = new File([blob], fileName, { type: 'application/pdf' });

  if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) {
    await navigator.share({ title, text, files: [file] });
    return 'file';
  }

  if (navigator.share) {
    await navigator.share({ title, text, url: window.location.href });
    return 'link';
  }

  await navigator.clipboard.writeText(window.location.href);
  return 'link';
}

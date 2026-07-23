import type { ReactElement } from 'react';
import { pdf } from '@react-pdf/renderer';

export async function createPdfBlob(document: ReactElement): Promise<Blob> {
  return pdf(document as any).toBlob();
}

export async function openPdfForPrint(document: ReactElement, title: string): Promise<void> {
  const printWindow = window.open('', '_blank', 'width=900,height=700');
  if (!printWindow) {
    throw new Error('Unable to open print window');
  }

  printWindow.document.write(`<!doctype html><title>${title}</title><body style="font-family: system-ui, sans-serif; padding: 24px;">Preparing PDF…</body>`);
  printWindow.document.close();

  const blob = await createPdfBlob(document);
  const url = URL.createObjectURL(blob);

  const triggerPrint = () => {
    try {
      printWindow.focus();
      printWindow.print();
    } catch (error) {
      console.warn('PDF print window could not be focused:', error);
    }
  };

  printWindow.location.href = url;
  printWindow.onload = () => window.setTimeout(triggerPrint, 400);
  window.setTimeout(triggerPrint, 1200);
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
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
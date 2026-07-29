import { useState, useCallback } from 'react';
import type { ReactElement } from 'react';
import { toast } from 'sonner';
import {
  downloadPdfDocument,
  isShareAbort,
  openPdfForPrint,
  PopupBlockedError,
  sharePdfDocument,
} from './browserActions';

/**
 * Shared print / share / download handling for every PDF preview modal.
 *
 * Each module previously kept its own near-identical copy of this hook with
 * hardcoded English toast strings. Modules now pass translated labels so the
 * feedback follows the user's language like the rest of the UI.
 */
export interface PdfActionLabels {
  printStarted: string;
  printFailed: string;
  popupBlocked: string;
  shareSuccess: string;
  shareFailed: string;
  downloadSuccess: string;
  downloadFailed: string;
}

interface UsePdfActionsOptions {
  pdfDocument: ReactElement;
  fileName: string;
  shareTitle: string;
  shareText: string;
  labels: PdfActionLabels;
}

/** Appends the underlying reason so support/debugging isn't guesswork. */
function withReason(message: string, error: unknown): string {
  const reason = error instanceof Error ? error.message : '';
  return reason ? `${message} — ${reason}` : message;
}

export function usePdfActions({
  pdfDocument,
  fileName,
  shareTitle,
  shareText,
  labels,
}: UsePdfActionsOptions) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handlePrint = useCallback(async () => {
    try {
      setIsGenerating(true);
      await openPdfForPrint(pdfDocument, fileName);
      toast.success(labels.printStarted);
    } catch (error) {
      if (error instanceof PopupBlockedError) {
        toast.error(labels.popupBlocked);
      } else {
        toast.error(withReason(labels.printFailed, error));
      }
      console.error('[pdf] Print error:', error);
    } finally {
      setIsGenerating(false);
    }
  }, [pdfDocument, fileName, labels]);

  // `platform` is accepted (and ignored) so callers can pass through their
  // share-menu selection without a signature mismatch.
  const handleShare = useCallback(async (_platform?: string) => {
    try {
      setIsGenerating(true);
      await sharePdfDocument({ document: pdfDocument, fileName, title: shareTitle, text: shareText });
      toast.success(labels.shareSuccess);
    } catch (error) {
      // Dismissing the native share sheet is a user choice, not an error.
      if (!isShareAbort(error)) {
        toast.error(withReason(labels.shareFailed, error));
        console.error('[pdf] Share error:', error);
      }
    } finally {
      setIsGenerating(false);
    }
  }, [pdfDocument, fileName, shareTitle, shareText, labels]);

  const handleDownload = useCallback(async () => {
    try {
      setIsGenerating(true);
      await downloadPdfDocument(pdfDocument, fileName);
      toast.success(labels.downloadSuccess);
    } catch (error) {
      toast.error(withReason(labels.downloadFailed, error));
      console.error('[pdf] Download error:', error);
    } finally {
      setIsGenerating(false);
    }
  }, [pdfDocument, fileName, labels]);

  const handleDownloadSuccess = useCallback(() => {
    toast.success(labels.downloadSuccess);
  }, [labels]);

  const handleDownloadError = useCallback(
    (error?: unknown) => {
      toast.error(withReason(labels.downloadFailed, error));
    },
    [labels]
  );

  return {
    isGenerating,
    handlePrint,
    handleShare,
    handleDownload,
    handleDownloadSuccess,
    handleDownloadError,
  };
}

import { useMemo } from 'react';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { usePdfActions } from '@/shared/pdf/usePdfActions';

interface UsePDFActionsProps {
  offer?: any;
  pdfDocument: ReactElement;
  fileName: string;
  shareTitle: string;
  shareText: string;
}

/** Offers wrapper around the shared PDF actions hook — supplies translated toasts. */
export const usePDFActions = ({ pdfDocument, fileName, shareTitle, shareText }: UsePDFActionsProps) => {
  const { t } = useTranslation('offers');

  const labels = useMemo(
    () => ({
      printStarted: t('pdfActions.printStarted', 'Opening PDF for printing…'),
      printFailed: t('pdfActions.printFailed', 'Failed to print the quote'),
      popupBlocked: t('pdfActions.popupBlocked', 'Your browser blocked the print window. Allow popups and try again.'),
      shareSuccess: t('pdfActions.shareSuccess', 'Quote shared successfully'),
      shareFailed: t('pdfActions.shareFailed', 'Failed to share the quote'),
      downloadSuccess: t('pdfActions.downloadSuccess', 'Quote PDF downloaded successfully'),
      downloadFailed: t('pdfActions.downloadFailed', 'Failed to download the quote PDF'),
    }),
    [t]
  );

  return usePdfActions({ pdfDocument, fileName, shareTitle, shareText, labels });
};

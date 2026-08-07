import { useMemo } from 'react';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { usePdfActions } from '@/shared/pdf/usePdfActions';

interface UsePDFActionsProps {
  sale?: any;
  pdfDocument: ReactElement;
  fileName: string;
  shareTitle: string;
  shareText: string;
}

/** Sales wrapper around the shared PDF actions hook — supplies translated toasts. */
export function usePDFActions({ pdfDocument, fileName, shareTitle, shareText }: UsePDFActionsProps) {
  const { t } = useTranslation('sales');

  const labels = useMemo(
    () => ({
      printStarted: t('pdfActions.printStarted', 'Opening PDF for printing…'),
      printFailed: t('pdfActions.printFailed', 'Failed to prepare the PDF for printing'),
      popupBlocked: t('pdfActions.popupBlocked', 'Your browser blocked the print window. Allow popups and try again.'),
      shareSuccess: t('pdfActions.shareSuccess', 'PDF shared successfully'),
      shareFailed: t('pdfActions.shareFailed', 'Failed to share the PDF'),
      downloadSuccess: t('pdfActions.downloadSuccess', 'Sale order PDF downloaded successfully'),
      downloadFailed: t('pdfActions.downloadFailed', 'Failed to download the PDF'),
    }),
    [t]
  );

  return usePdfActions({ pdfDocument, fileName, shareTitle, shareText, labels });
}

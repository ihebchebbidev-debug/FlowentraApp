import { useMemo } from 'react';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { usePdfActions } from '@/shared/pdf/usePdfActions';

interface UsePDFActionsProps {
  dispatch?: any;
  pdfDocument: ReactElement;
  fileName: string;
  shareTitle: string;
  shareText: string;
}

/** Dispatches wrapper around the shared PDF actions hook — supplies translated toasts. */
export const usePDFActions = ({ pdfDocument, fileName, shareTitle, shareText }: UsePDFActionsProps) => {
  const { t } = useTranslation('dispatches');

  const labels = useMemo(
    () => ({
      printStarted: t('pdfActions.printStarted', 'Print dialog opened'),
      printFailed: t('pdfActions.printFailed', 'Failed to print the dispatch report'),
      popupBlocked: t('pdfActions.popupBlocked', 'Your browser blocked the print window. Allow popups and try again.'),
      shareSuccess: t('pdfActions.shareSuccess', 'Dispatch report shared successfully'),
      shareFailed: t('pdfActions.shareFailed', 'Failed to share the dispatch report'),
      downloadSuccess: t('pdfActions.downloadSuccess', 'Dispatch report PDF downloaded successfully'),
      downloadFailed: t('pdfActions.downloadFailed', 'Failed to download the dispatch report PDF'),
    }),
    [t]
  );

  return usePdfActions({ pdfDocument, fileName, shareTitle, shareText, labels });
};

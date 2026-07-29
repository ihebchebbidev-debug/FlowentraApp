import { useMemo } from 'react';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { usePdfActions } from '@/shared/pdf/usePdfActions';

interface UsePDFActionsProps {
  serviceOrder?: any;
  pdfDocument: ReactElement;
  fileName: string;
  shareTitle: string;
  shareText: string;
}

/** Service-orders wrapper around the shared PDF actions hook — supplies translated toasts. */
export const usePDFActions = ({ pdfDocument, fileName, shareTitle, shareText }: UsePDFActionsProps) => {
  const { t } = useTranslation('service_orders');

  const labels = useMemo(
    () => ({
      printStarted: t('pdfActions.printStarted', 'Print dialog opened'),
      printFailed: t('pdfActions.printFailed', 'Failed to print the service report'),
      popupBlocked: t('pdfActions.popupBlocked', 'Your browser blocked the print window. Allow popups and try again.'),
      shareSuccess: t('pdfActions.shareSuccess', 'Service report shared successfully'),
      shareFailed: t('pdfActions.shareFailed', 'Failed to share the service report'),
      downloadSuccess: t('pdfActions.downloadSuccess', 'Service report PDF downloaded successfully'),
      downloadFailed: t('pdfActions.downloadFailed', 'Failed to download the service report PDF'),
    }),
    [t]
  );

  return usePdfActions({ pdfDocument, fileName, shareTitle, shareText, labels });
};

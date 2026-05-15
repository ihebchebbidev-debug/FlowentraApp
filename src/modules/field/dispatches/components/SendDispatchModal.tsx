import { useMemo, useCallback, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { pdf } from '@react-pdf/renderer';
import { DispatchPDFDocument } from './DispatchPDFDocument';
import { defaultSettings, getCompanyLogoBase64 } from '../utils/pdfSettings.utils';
import { PdfSettingsService } from '../services/pdfSettings.service';
import { useCompanyLogo } from '@/hooks/useCompanyLogo';
import { useCurrency } from '@/shared/hooks/useCurrency';
import { EmailComposer, type EmailComposerDocumentInfo } from '@/shared/components/email/EmailComposer';
import type { ServiceOrderDispatch } from '../../service-orders/entities/dispatches/types';

interface SendDispatchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dispatch: ServiceOrderDispatch;
  onSendSuccess?: () => void;
}

export function SendDispatchModal({ open, onOpenChange, dispatch, onSendSuccess }: SendDispatchModalProps) {
  const { t } = useTranslation('field');
  const companyLogo = useCompanyLogo();
  const { format: formatCurrency } = useCurrency();

  const [pdfSettings, setPdfSettings] = useState(defaultSettings);

  useEffect(() => {
    if (!open) return;
    const load = async () => {
      try {
        const settings = await PdfSettingsService.loadSettingsAsync();
        const logoBase64 = await getCompanyLogoBase64(companyLogo);
        setPdfSettings({ ...settings, company: { ...settings.company, logo: logoBase64 || '' } });
      } catch { setPdfSettings(defaultSettings); }
    };
    load();
  }, [open, companyLogo]);

  const docInfo: EmailComposerDocumentInfo = useMemo(() => ({
    type: 'dispatch',
    documentNumber: dispatch.dispatchNumber,
    customerName: 'Dispatch Team',
    companyName: pdfSettings.company?.name,
    companyLogoUrl: companyLogo || undefined,
    summaryLabel: dispatch.dispatchNumber,
    statusLabel: (dispatch.status || 'pending').replace(/_/g, ' '),
    fileName: `dispatch-${dispatch.dispatchNumber}.pdf`,
  }), [dispatch, pdfSettings, companyLogo]);

  const pdfDocElement = useMemo(() => (
    <DispatchPDFDocument
      dispatch={dispatch}
      customer={{}}
      installation={{}}
      timeData={[]}
      formatCurrency={formatCurrency}
      settings={pdfSettings}
    />
  ), [dispatch, formatCurrency, pdfSettings]);

  const generatePdf = useCallback(async () => {
    return await pdf(pdfDocElement).toBlob();
  }, [pdfDocElement]);

  return (
    <EmailComposer
      open={open}
      onOpenChange={onOpenChange}
      document={docInfo}
      generatePdf={generatePdf}
      pdfDocElement={pdfDocElement}
      onSendSuccess={onSendSuccess}
      title={t('dispatch.sendModal.title', 'Send Dispatch')}
      description={t('dispatch.sendModal.description', 'Send dispatch details and assignment to team members via email')}
      successMessage={t('dispatch.sendModal.deliverySuccess', 'Dispatch Sent Successfully!')}
    />
  );
}

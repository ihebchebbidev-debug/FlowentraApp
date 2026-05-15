import { useMemo, useCallback, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { pdf } from '@react-pdf/renderer';
import { ServiceOrderPDFDocument } from './ServiceOrderPDFDocument';
import { defaultSettings, getCompanyLogoBase64 } from '../utils/pdfSettings.utils';
import { PdfSettingsService } from '../services/pdfSettings.service';
import { useCompanyLogo } from '@/hooks/useCompanyLogo';
import { useCurrency } from '@/shared/hooks/useCurrency';
import { EmailComposer, type EmailComposerDocumentInfo } from '@/shared/components/email/EmailComposer';

interface SendServiceOrderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serviceOrder: any;
  onSendSuccess?: () => void;
}

export function SendServiceOrderModal({ open, onOpenChange, serviceOrder, onSendSuccess }: SendServiceOrderModalProps) {
  const { t } = useTranslation('serviceOrders');
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
    type: 'serviceOrder',
    documentNumber: String(serviceOrder.orderNumber || serviceOrder.id),
    customerName: serviceOrder.customer?.contactPerson || serviceOrder.contactName || 'Client',
    customerEmail: serviceOrder.customer?.email || serviceOrder.contactEmail,
    companyName: pdfSettings.company?.name,
    companyLogoUrl: companyLogo || undefined,
    summaryLabel: serviceOrder.orderNumber || serviceOrder.id,
    statusLabel: (serviceOrder.status || 'draft').replace(/_/g, ' '),
    fileName: `service-order-${serviceOrder.orderNumber || serviceOrder.id}.pdf`,
  }), [serviceOrder, pdfSettings, companyLogo]);

  const pdfDocElement = useMemo(() => (
    <ServiceOrderPDFDocument serviceOrder={serviceOrder} formatCurrency={formatCurrency} settings={pdfSettings} />
  ), [serviceOrder, formatCurrency, pdfSettings]);

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
      title={t('sendModal.title', 'Send Service Order')}
      description={t('sendModal.description', 'Send the service order to the customer via email')}
      successMessage={t('sendModal.deliverySuccess', 'Service Order Sent Successfully!')}
    />
  );
}

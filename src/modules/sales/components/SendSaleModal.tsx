import { useMemo, useCallback, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Sale } from '../types';
import { useCurrency } from '@/shared/hooks/useCurrency';
import { pdf } from '@react-pdf/renderer';
import { SalePDFDocument } from './SalePDFDocument';
import { defaultSettings, getCompanyLogoBase64 } from '../utils/pdfSettings.utils';
import { PdfSettingsService } from '../services/pdfSettings.service';
import { useCompanyLogo } from '@/hooks/useCompanyLogo';
import { EmailComposer, type EmailComposerDocumentInfo } from '@/shared/components/email/EmailComposer';

interface SendSaleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sale: Sale;
  onSendSuccess?: () => void;
}

export function SendSaleModal({ open, onOpenChange, sale, onSendSuccess }: SendSaleModalProps) {
  const { t, i18n } = useTranslation('sales');
  const { format: formatCurrency } = useCurrency();
  const companyLogo = useCompanyLogo();

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
    type: 'sale',
    documentNumber: String(sale.saleNumber || sale.id),
    documentTitle: sale.title,
    customerName: sale.contactName || sale.contactCompany || 'Client',
    customerEmail: sale.contactEmail,
    totalAmount: sale.totalAmount != null ? formatCurrency(sale.totalAmount) : undefined,
    companyName: pdfSettings.company?.name,
    companyLogoUrl: companyLogo || undefined,
    summaryLabel: sale.title || `${t('entity', 'Sale')} #${sale.saleNumber || sale.id}`,
    fileName: `sale-order-${sale.saleNumber || sale.id}.pdf`,
  }), [sale, formatCurrency, pdfSettings, t, companyLogo]);

  const pdfDocElement = useMemo(() => (
    <SalePDFDocument
      sale={sale}
      formatCurrency={formatCurrency}
      settings={pdfSettings}
      language={i18n.language}
      currencyCode={sale?.currency || 'TND'}
    />
  ), [sale, formatCurrency, pdfSettings, i18n.language]);

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
      title={t('sendModal.title', 'Send Sales Order')}
      description={t('sendModal.description', 'Send the sales order to the customer via email')}
      successMessage={t('sendModal.sentSuccess', 'Sales Order Sent Successfully!')}
    />
  );
}

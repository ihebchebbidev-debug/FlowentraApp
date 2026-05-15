import { useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Offer } from '../types';
import { useCurrency } from '@/shared/hooks/useCurrency';
import { pdf } from '@react-pdf/renderer';
import { OfferPDFDocument } from './OfferPDFDocument';
import { defaultSettings, getCompanyLogoBase64 } from '../utils/pdfSettings.utils';
import { PdfSettingsService } from '../services/pdfSettings.service';
import { useCompanyLogo } from '@/hooks/useCompanyLogo';
import { EmailComposer, type EmailComposerDocumentInfo } from '@/shared/components/email/EmailComposer';
import { useState, useEffect } from 'react';

interface SendOfferModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  offer: Offer;
  onSendSuccess?: () => void;
}

export function SendOfferModal({ open, onOpenChange, offer, onSendSuccess }: SendOfferModalProps) {
  const { t, i18n } = useTranslation('offers');
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
    type: 'offer',
    documentNumber: String(offer.offerNumber || offer.id),
    documentTitle: offer.title,
    customerName: offer.contactName || offer.contactCompany || 'Client',
    customerEmail: offer.contactEmail,
    totalAmount: offer.totalAmount != null ? formatCurrency(offer.totalAmount) : undefined,
    companyName: pdfSettings.company?.name,
    companyLogoUrl: companyLogo || undefined,
    summaryLabel: offer.title || `${t('entity', 'Offer')} #${offer.offerNumber || offer.id}`,
    fileName: `quote-${offer.offerNumber || offer.id}.pdf`,
  }), [offer, formatCurrency, pdfSettings, t, companyLogo]);

  const pdfDocElement = useMemo(() => (
    <OfferPDFDocument
      offer={offer}
      formatCurrency={formatCurrency}
      settings={pdfSettings}
      language={i18n.language}
      currencyCode={offer?.currency || 'TND'}
    />
  ), [offer, formatCurrency, pdfSettings, i18n.language]);

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
      title={t('sendModal.title', 'Send Offer')}
      description={t('sendModal.description', 'Send the quotation to the customer via email')}
      successMessage={t('sendModal.sentSuccess', 'Offer Sent Successfully!')}
    />
  );
}

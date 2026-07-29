import { useEffect, useState } from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { useTranslation } from 'react-i18next';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCurrency } from '@/shared/hooks/useCurrency';
import { useCompanyLogo } from '@/hooks/useCompanyLogo';
import { PdfSettingsService } from '@/modules/sales/services/pdfSettings.service';
import { defaultSettings, getCompanyLogoBase64 } from '@/modules/sales/utils/pdfSettings.utils';
import { buildPdfFilename } from '@/shared/pdf/filename';
import type { Invoice } from '../types';
import { InvoicePDFDocument, type InvoicePDFTranslations } from './InvoicePDFDocument';

interface Props {
  invoice: Invoice & Record<string, any>;
}

export function InvoiceDownloadPdfButton({ invoice }: Props) {
  const { t } = useTranslation('invoices');
  const { format } = useCurrency();
  const companyLogo = useCompanyLogo();
  const [settings, setSettings] = useState<any>(defaultSettings);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const loaded = await PdfSettingsService.loadSettingsAsync();
        const logoBase64 = await getCompanyLogoBase64(companyLogo);
        if (!mounted) return;
        setSettings({
          ...loaded,
          company: { ...loaded.company, logo: logoBase64 || '' },
        });
      } catch {
        if (mounted) setSettings(defaultSettings);
      } finally {
        if (mounted) setReady(true);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [companyLogo]);

  const translations: InvoicePDFTranslations = {
    invoice: t('pdf.invoice', 'INVOICE'),
    invoiceNumber: t('pdf.invoice_number', 'Invoice N°'),
    issueDate: t('columns.issue_date'),
    dueDate: t('columns.due_date'),
    status: t('columns.status'),
    customerInformation: t('pdf.customer_information', 'Customer Information'),
    invoiceDetails: t('pdf.invoice_details', 'Invoice Details'),
    name: t('pdf.name', 'Name'),
    email: t('pdf.email', 'Email'),
    phone: t('pdf.phone', 'Phone'),
    address: t('pdf.address', 'Address'),
    saleReference: t('pdf.sale_reference', 'Sale reference'),
    currency: t('detail.currency'),
    items: t('detail.lines'),
    pos: t('pdf.pos', 'Pos'),
    description: t('pdf.description', 'Description'),
    qty: t('detail.qty'),
    unit: t('detail.unit_price'),
    total: t('detail.line_total'),
    subtotal: t('detail.subtotal') + ' (HT)',
    tax: t('detail.tax'),
    discount: t('detail.discount', { defaultValue: 'Discount' }),
    adjustment: t('detail.adjustment', { defaultValue: 'Adjustment' }),
    grandTotal: t('detail.grand_total'),
    paymentSummary: t('pdf.payment_summary', 'Payment Summary'),
    amountPaid: t('detail.amount_paid'),
    amountDue: t('detail.amount_due'),
    notes: t('detail.notes'),
    page: t('pdf.page_label', 'Page'),
    draftNumber: t('pdf.draft_number', 'DRAFT'),
  };

  const fileName = buildPdfFilename({
    prefix: 'invoice',
    preferredId: invoice.invoiceNumber,
    fallbackId: invoice.id,
  });

  const statusLabel = t(`status.${invoice.status}`, invoice.status);

  if (!ready) {
    return (
      <Button size="sm" variant="outline" className="gap-2" disabled>
        <Download className="h-4 w-4" />
        {t('actions.download_pdf', 'Download PDF')}
      </Button>
    );
  }

  return (
    <PDFDownloadLink
      document={
        <InvoicePDFDocument
          invoice={invoice}
          formatCurrency={format}
          settings={settings}
          translations={translations}
          statusLabel={statusLabel}
        />
      }
      fileName={fileName}
      className="inline-flex"
    >
      {({ loading }) => (
        <Button size="sm" variant="outline" className="gap-2" disabled={loading}>
          <Download className="h-4 w-4" />
          {loading
            ? t('pdf.preparing', 'Preparing…')
            : t('actions.download_pdf', 'Download PDF')}
        </Button>
      )}
    </PDFDownloadLink>
  );
}

export default InvoiceDownloadPdfButton;

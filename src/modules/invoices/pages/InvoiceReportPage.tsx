import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { PDFViewer } from '@react-pdf/renderer';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import { customerInvoicesApi } from '@/services/api/customerInvoicesApi';
import { useCurrency } from '@/shared/hooks/useCurrency';
import { useCompanyLogo } from '@/hooks/useCompanyLogo';
import { PdfSettingsService } from '@/modules/sales/services/pdfSettings.service';
import { defaultSettings, getCompanyLogoBase64 } from '@/modules/sales/utils/pdfSettings.utils';
import { InvoicePDFDocument, type InvoicePDFTranslations } from '../components/InvoicePDFDocument';
import { resolveCompanyForPdf, getRecordTenantId } from '@/shared/pdf/resolveCompany';

export default function InvoiceReportPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation('invoices');
  const { format: formatCurrency } = useCurrency();
  const companyLogo = useCompanyLogo();
  const [invoice, setInvoice] = useState<any>(null);
  const [pdfSettings, setPdfSettings] = useState<any>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!id) return;
      try {
        setIsLoading(true);
        const [fetched, settings] = await Promise.all([
          customerInvoicesApi.getById(Number(id)),
          PdfSettingsService.loadSettingsAsync(),
        ]);
        const logoBase64 = await getCompanyLogoBase64(companyLogo);
        if (!mounted) return;
        setInvoice(fetched);
        setPdfSettings({
          ...settings,
          company: await resolveCompanyForPdf(settings.company, logoBase64 || '', getRecordTenantId(fetched)),
        });
      } catch (err) {
        console.error('[InvoiceReportPage] load error:', err);
        if (mounted) setPdfSettings(defaultSettings);
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id, companyLogo]);

  const translations: InvoicePDFTranslations = useMemo(() => {
    const s = (k: string, d?: string) => String(t(k, d ?? ''));
    return {
      invoice: s('pdf.invoice', 'INVOICE'),
      invoiceNumber: s('pdf.invoice_number', 'Invoice N°'),
      issueDate: s('columns.issue_date'),
      dueDate: s('columns.due_date'),
      status: s('columns.status'),
      customerInformation: s('pdf.customer_information', 'Customer Information'),
      invoiceDetails: s('pdf.invoice_details', 'Invoice Details'),
      name: s('pdf.name', 'Name'),
      email: s('pdf.email', 'Email'),
      phone: s('pdf.phone', 'Phone'),
      address: s('pdf.address', 'Address'),
      saleReference: s('pdf.sale_reference', 'Sale reference'),
      currency: s('detail.currency'),
      items: s('detail.lines'),
      pos: s('pdf.pos', 'Pos'),
      description: s('pdf.description', 'Description'),
      qty: s('detail.qty'),
      unit: s('detail.unit_price'),
      total: s('detail.line_total'),
      subtotal: s('detail.subtotal') + ' (HT)',
      tax: s('detail.tax'),
      discount: s('detail.discount', 'Discount'),
      adjustment: s('detail.adjustment', 'Adjustment'),
      grandTotal: s('detail.grand_total'),
      paymentSummary: s('pdf.payment_summary', 'Payment Summary'),
      amountPaid: s('detail.amount_paid'),
      amountDue: s('detail.amount_due'),
      notes: s('detail.notes'),
      page: s('pdf.page_label', 'Page'),
      draftNumber: s('pdf.draft_number', 'DRAFT'),
    };
  }, [t]);

  const statusLabel = invoice ? String(t(`status.${invoice.status}`, invoice.status)) : '';

  if (isLoading || !invoice) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="h-screen w-full">
      <PDFViewer width="100%" height="100%" showToolbar={true}>
        <InvoicePDFDocument
          invoice={invoice}
          formatCurrency={formatCurrency}
          settings={pdfSettings}
          translations={translations}
          statusLabel={statusLabel}
        />
      </PDFViewer>
    </div>
  );
}

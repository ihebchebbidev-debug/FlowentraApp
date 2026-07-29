import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, Printer } from 'lucide-react';
import { downloadPdfDocument, openPdfForPrint, PopupBlockedError } from '@/shared/pdf/browserActions';
import { useTranslation } from 'react-i18next';
import { PDFAnnotationViewer } from '@/components/shared/PDFAnnotationViewer';
import { PdfSettingsService } from '@/modules/sales/services/pdfSettings.service';
import { defaultSettings, getCompanyLogoBase64 } from '@/modules/sales/utils/pdfSettings.utils';
import { useCompanyLogo } from '@/hooks/useCompanyLogo';
import { useIsMobile } from '@/hooks/use-mobile';
import { useToast } from '@/hooks/use-toast';
import { useCurrency } from '@/shared/hooks/useCurrency';
import { buildPdfFilename } from '@/shared/pdf/filename';
import { InvoicePDFDocument, type InvoicePDFTranslations } from './InvoicePDFDocument';
import { resolveCompanyForPdf } from '@/shared/pdf/resolveCompany';

interface InvoicePDFPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: any;
}

export function InvoicePDFPreviewModal({ isOpen, onClose, invoice }: InvoicePDFPreviewModalProps) {
  const { t } = useTranslation('invoices');
  const { format, current: currency } = useCurrency();
  const { toast } = useToast();
  const companyLogo = useCompanyLogo();
  const isMobile = useIsMobile();
  const [pdfSettings, setPdfSettings] = useState<any>(defaultSettings);
  const [pdfKey, setPdfKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const translations: InvoicePDFTranslations = useMemo(() => ({
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
  }), [t]);

  useEffect(() => {
    let isMounted = true;
    const loadSettings = async () => {
      try {
        setIsLoading(true);
        const settings = await PdfSettingsService.loadSettingsAsync();
        const logoBase64 = await getCompanyLogoBase64(companyLogo);
        if (isMounted) {
          setPdfSettings({ ...settings, company: await resolveCompanyForPdf(settings.company, logoBase64 || '') });
        }
      } catch {
        if (isMounted) setPdfSettings(defaultSettings);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    if (isOpen) loadSettings();
    return () => { isMounted = false; };
  }, [isOpen, companyLogo]);

  const settingsJsonRef = useRef('');
  useEffect(() => {
    if (!isLoading) {
      const json = JSON.stringify(pdfSettings);
      if (json !== settingsJsonRef.current) {
        settingsJsonRef.current = json;
        const timer = setTimeout(() => setPdfKey(prev => prev + 1), 100);
        return () => clearTimeout(timer);
      }
    }
  }, [pdfSettings, isLoading]);

  const statusLabel = String(t(`status.${invoice?.status}`, invoice?.status ?? ""));

  const pdfDocElement = useMemo(() => (
    <InvoicePDFDocument
      invoice={invoice}
      formatCurrency={format}
      settings={pdfSettings}
      translations={translations}
      statusLabel={statusLabel}
    />
  ), [invoice, format, pdfSettings, translations, statusLabel]);

  const fileName = useMemo(
    () => buildPdfFilename({ prefix: 'invoice', preferredId: invoice?.invoiceNumber, fallbackId: invoice?.id }),
    [invoice?.invoiceNumber, invoice?.id]
  );

  // Use the shared helpers: they revoke the object URL correctly and surface a
  // specific message when the browser blocks the print popup (this modal used
  // to fail silently and leak the blob on every blocked attempt).
  const handleDownload = useCallback(async () => {
    try {
      await downloadPdfDocument(pdfDocElement, fileName);
      toast({ title: t('pdf.download_complete', 'Download complete') });
    } catch (error) {
      toast({
        title: t('pdf.download_error', 'Download failed'),
        description: error instanceof Error ? error.message : undefined,
        variant: 'destructive',
      });
    }
  }, [pdfDocElement, fileName, toast, t]);

  const handlePrint = useCallback(async () => {
    try {
      await openPdfForPrint(pdfDocElement, fileName);
    } catch (error) {
      toast({
        title:
          error instanceof PopupBlockedError
            ? t('pdf.popup_blocked', 'Your browser blocked the print window. Allow popups and try again.')
            : t('pdf.print_error', 'Print failed'),
        description: error instanceof PopupBlockedError ? undefined : error instanceof Error ? error.message : undefined,
        variant: 'destructive',
      });
    }
  }, [pdfDocElement, fileName, toast, t]);

  if (!invoice) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`${isMobile ? 'max-w-[95vw] h-[95vh]' : 'max-w-7xl h-[90vh]'} flex flex-col`}>
        <DialogHeader className="flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10"><FileText className="h-5 w-5 text-primary" /></div>
            <div>
              <DialogTitle className={isMobile ? 'text-lg' : 'text-xl'}>
                {t('pdf.preview_title', 'Invoice PDF')}
              </DialogTitle>
              <p className="text-sm text-muted-foreground">
                {invoice.invoiceNumber || t('detail.no_number_yet')}
                {!isMobile && invoice.contactName ? ` - ${invoice.contactName}` : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-1" />{!isMobile && t('actions.print', 'Print')}
            </Button>
            <Button size="sm" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-1" />{!isMobile && t('actions.download_pdf', 'Download PDF')}
            </Button>
          </div>
        </DialogHeader>

        <Separator />

        <div className="flex-1 min-h-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-muted-foreground">{t('loading')}</div>
            </div>
          ) : (
            <PDFAnnotationViewer
              key={`view-${pdfKey}`}
              document={pdfDocElement}
              fileName={fileName}
              isSigningMode={false}
              onSigningModeChange={() => {}}
              onAnnotationsChange={() => {}}
              showToolbar={false}
            />
          )}
        </div>

        {!isMobile && (
          <>
            <Separator />
            <div className="flex items-center justify-between py-2 px-1 text-xs text-muted-foreground">
              <span>{new Date().toLocaleDateString()}</span>
              <Badge variant="secondary" className="text-xs">{invoice.currency || currency.code}</Badge>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default InvoicePDFPreviewModal;

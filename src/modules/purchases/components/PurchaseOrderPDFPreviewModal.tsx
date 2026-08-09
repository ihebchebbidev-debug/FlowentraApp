import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, Printer, Maximize2 } from 'lucide-react';
import { pdf } from '@react-pdf/renderer';
import React from 'react';
import { PurchaseOrderPDFDocument } from './PurchaseOrderPDFDocument';
import { defaultSettings, getCompanyLogoBase64 } from '@/modules/offers/utils/pdfSettings.utils';
import { PdfSettingsService } from '@/modules/sales/services/pdfSettings.service';
import { PDFAnnotationViewer } from '@/components/shared/PDFAnnotationViewer';
import { useCompanyLogo } from '@/hooks/useCompanyLogo';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTranslation } from 'react-i18next';
import { useCurrency } from '@/shared/hooks/useCurrency';
import { useToast } from '@/hooks/use-toast';
import { resolveCompanyForPdf, getRecordTenantId } from '@/shared/pdf/resolveCompany';

interface PurchaseOrderPDFPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: any;
  formatCurrency: (amount: number) => string;
}

export function PurchaseOrderPDFPreviewModal({ isOpen, onClose, order, formatCurrency }: PurchaseOrderPDFPreviewModalProps) {
  const { t, i18n } = useTranslation('purchases');
  const { current: currency } = useCurrency();
  const { toast } = useToast();
  const companyLogo = useCompanyLogo();
  const [pdfSettings, setPdfSettings] = useState(defaultSettings);
  const [pdfKey, setPdfKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const isMobile = useIsMobile();

  const pdfTranslations = useMemo(() => ({
    purchaseOrder: t('pdf.purchaseOrder', 'PURCHASE ORDER'),
    orderNumber: t('pdf.orderNumber', 'Order N°'),
    date: t('pdf.date', 'Date'),
    supplierInformation: t('pdf.supplierInformation', 'Supplier Information'),
    orderDetails: t('pdf.orderDetails', 'Order Details'),
    name: t('pdf.name', 'Name'),
    email: t('pdf.email', 'Email'),
    phone: t('pdf.phone', 'Phone'),
    address: t('pdf.address', 'Address'),
    taxId: t('pdf.taxId', 'Tax ID'),
    status: t('pdf.status', 'Status'),
    expectedDelivery: t('pdf.expectedDelivery', 'Expected Delivery'),
    paymentTerms: t('pdf.paymentTerms', 'Payment Terms'),
    description: t('pdf.description', 'Description'),
    pos: t('pdf.pos', 'Pos'),
    qty: t('pdf.qty', 'Qty'),
    unit: t('pdf.unitPrice', 'Unit Price'),
    total: t('pdf.total', 'Total'),
    supplierRef: t('pdf.supplierRef', 'Supplier Ref'),
    subtotal: t('pdf.subtotal', 'Subtotal'),
    tax: t('pdf.tax', 'Tax'),
    tva: t('pdf.tva', 'TVA'),
    discount: t('pdf.discount', 'Discount'),
    fiscalStamp: t('pdf.fiscalStamp', 'Fiscal Stamp'),
    additionalNotes: t('pdf.additionalNotes', 'Additional Notes'),
    amountInWords: t('pdf.amountInWords', 'Amount in Words'),
    page: t('pdf.page', 'Page'),
    statusValue: t(`status.${order?.status || 'draft'}`),
  }), [t, order?.status]);

  useEffect(() => {
    let isMounted = true;
    const loadSettings = async () => {
      try {
        setIsLoading(true);
        const settings = await PdfSettingsService.loadSettingsAsync();
        if (isMounted) {
          const logoBase64 = await getCompanyLogoBase64(companyLogo);
          setPdfSettings({ ...settings, company: await resolveCompanyForPdf(settings.company, logoBase64 || '', getRecordTenantId(order)) } as any);
        }
      } catch { if (isMounted) setPdfSettings(defaultSettings); }
      finally { if (isMounted) setIsLoading(false); }
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

  const pdfDocElement = useMemo(() => (
    <PurchaseOrderPDFDocument
      order={order}
      formatCurrency={formatCurrency}
      settings={pdfSettings}
      translations={pdfTranslations}
      language={i18n.language}
      currencyCode={order?.currency || currency.code}
    />
  ), [order, formatCurrency, pdfSettings, pdfTranslations, i18n.language]);

  const handleDownload = useCallback(async () => {
    try {
      const blob = await pdf(pdfDocElement as any).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `purchase-order-${order.orderNumber || order.id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: t('pdf.downloadComplete', 'Download Complete') });
    } catch {
      toast({ title: t('pdf.downloadError', 'Download Error'), variant: 'destructive' });
    }
  }, [pdfDocElement, order, toast, t]);

  const handlePrint = useCallback(async () => {
    try {
      const blob = await pdf(pdfDocElement as any).toBlob();
      const url = URL.createObjectURL(blob);
      const printWindow = window.open(url);
      if (printWindow) printWindow.onload = () => printWindow.print();
    } catch {
      toast({ title: t('pdf.printError', 'Print Error'), variant: 'destructive' });
    }
  }, [pdfDocElement, toast, t]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`${isMobile ? 'max-w-[95vw] h-[95vh]' : 'max-w-7xl h-[90vh]'} flex flex-col`}>
        <DialogHeader className="flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10"><FileText className="h-5 w-5 text-primary" /></div>
            <div>
              <DialogTitle className={isMobile ? 'text-lg' : 'text-xl'}>{t('pdf.previewTitle', 'Purchase Order PDF')}</DialogTitle>
              <p className="text-sm text-muted-foreground">{order.orderNumber} - {order.supplierName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handlePrint}><Printer className="h-4 w-4 me-1" />{!isMobile && t('actions.print')}</Button>
            <Button size="sm" onClick={handleDownload}><Download className="h-4 w-4 me-1" />{!isMobile && t('pdf.download', 'Download')}</Button>
          </div>
        </DialogHeader>
        <Separator />
        <div className="flex-1 min-h-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-full"><div className="text-muted-foreground">{t('pdf.loading', 'Loading...')}</div></div>
          ) : (
            <PDFAnnotationViewer key={`view-${pdfKey}`} document={pdfDocElement} fileName={`purchase-order-${order.orderNumber || order.id}.pdf`} isSigningMode={false} onSigningModeChange={() => {}} onAnnotationsChange={() => {}} showToolbar={false} />
          )}
        </div>
        {!isMobile && (
          <>
            <Separator />
            <div className="flex items-center justify-between py-2 px-1 text-xs text-muted-foreground">
              <span>{t('pdf.generatedOn', { date: new Date().toLocaleDateString(), defaultValue: `Generated on ${new Date().toLocaleDateString()}` })}</span>
              <Badge variant="secondary" className="text-xs">{order.currency || currency.code}</Badge>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

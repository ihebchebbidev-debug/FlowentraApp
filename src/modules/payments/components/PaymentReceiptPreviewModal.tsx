import { useState, useEffect, useMemo, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Receipt, Download, Printer, Share2, MessageCircle, Mail, PenTool, X } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { PaymentReceiptPDF } from './PaymentReceiptPDF';
import { PdfSettingsService } from '@/modules/offers/services/pdfSettings.service';
import { defaultSettings, getCompanyLogoBase64 } from '@/modules/offers/utils/pdfSettings.utils';
import { PDFAnnotationViewer, AnnotationsMap } from '@/components/shared/PDFAnnotationViewer';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTranslation } from 'react-i18next';
import { useCompanyLogo } from '@/hooks/useCompanyLogo';
import { pdf } from '@react-pdf/renderer';
import { toast } from 'sonner';
import type { Payment } from '@/modules/payments/types';

interface PaymentReceiptPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityData: any;
  payment: Payment;
  payments: Payment[];
  formatCurrency: (amount: number) => string;
  currencyCode: string;
}

export function PaymentReceiptPreviewModal({
  isOpen,
  onClose,
  entityData,
  payment,
  payments,
  formatCurrency,
  currencyCode,
}: PaymentReceiptPreviewModalProps) {
  const { t } = useTranslation('payments');
  const companyLogo = useCompanyLogo();
  const isMobile = useIsMobile();
  const [pdfSettings, setPdfSettings] = useState(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [pdfKey, setPdfKey] = useState(0);
  const [isSigningMode, setIsSigningMode] = useState(false);
  const [hasAnnotations, setHasAnnotations] = useState(false);
  const [annotations, setAnnotations] = useState<AnnotationsMap>(new Map());

  useEffect(() => {
    let isMounted = true;
    const loadSettings = async () => {
      try {
        setIsLoading(true);
        const settings = await PdfSettingsService.loadSettingsAsync();
        if (isMounted) {
          const logoBase64 = await getCompanyLogoBase64(companyLogo);
          setPdfSettings({ ...settings, company: { ...settings.company, logo: logoBase64 || '' } });
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

  // Reset annotations when modal closes
  useEffect(() => {
    if (!isOpen) {
      setAnnotations(new Map());
      setHasAnnotations(false);
      setIsSigningMode(false);
    }
  }, [isOpen]);

  const pdfDocElement = useMemo(() => (
    <PaymentReceiptPDF
      offer={entityData}
      payment={payment}
      payments={payments}
      formatCurrency={formatCurrency}
      settings={pdfSettings}
      currencyCode={currencyCode}
    />
  ), [entityData, payment, payments, formatCurrency, pdfSettings, currencyCode]);

  const fileName = `receipt-${payment.paymentReference || payment.id}${hasAnnotations ? '-signed' : ''}.pdf`;

  const handleSign = useCallback(() => setIsSigningMode(true), []);
  const handleRemoveSignature = useCallback(() => {
    setAnnotations(new Map());
    setHasAnnotations(false);
    setIsSigningMode(false);
  }, []);

  const useAnnotationViewer = isSigningMode || hasAnnotations;

  const handlePrint = async () => {
    try {
      const blob = await pdf(pdfDocElement).toBlob();
      const url = URL.createObjectURL(blob);
      const printWindow = window.open(url, '_blank');
      if (printWindow) {
        printWindow.addEventListener('load', () => printWindow.print());
      }
    } catch { toast.error('Failed to print'); }
  };

  const handleShare = async (platform?: string) => {
    try {
      const blob = await pdf(pdfDocElement).toBlob();
      const file = new File([blob], fileName, { type: 'application/pdf' });
      if (!platform && navigator.share) {
        await navigator.share({ files: [file], title: 'Payment Receipt' });
        return;
      }
      switch (platform) {
        case 'whatsapp': window.open(`https://wa.me/?text=Payment%20Receipt`); break;
        case 'email': window.open(`mailto:?subject=Payment%20Receipt&body=Please%20find%20attached%20the%20payment%20receipt.`); break;
        default: if (navigator.share) await navigator.share({ files: [file] });
      }
    } catch { toast.error('Failed to share'); }
  };

  const entityLabel = entityData?.offerNumber ? 'Offer' : 'Sale';
  const entityNumber = entityData?.offerNumber || entityData?.saleNumber || '';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`${isMobile ? 'max-w-[95vw] h-[95vh]' : 'max-w-7xl h-[90vh]'} flex flex-col`}>
        <DialogHeader className="flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Receipt className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle className={isMobile ? 'text-lg' : 'text-xl'}>
                {t('paymentReceipt', 'Payment Receipt')}
              </DialogTitle>
              <p className="text-sm text-muted-foreground">
                {payment.paymentReference || payment.receiptNumber || payment.id}
                {!isMobile && entityNumber && ` — ${entityLabel} ${entityNumber}`}
              </p>
            </div>
          </div>
        </DialogHeader>

        <Separator />

        {/* Actions bar */}
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-1.5" />
              {!isMobile && 'Print'}
            </Button>

            <PDFDownloadLink document={pdfDocElement} fileName={fileName}>
              {({ loading }) => (
                <Button size="sm" disabled={loading} className="bg-primary hover:bg-primary/90">
                  <Download className="h-4 w-4 mr-1.5" />
                  {loading ? 'Preparing...' : isMobile ? 'Download' : 'Download PDF'}
                </Button>
              )}
            </PDFDownloadLink>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Share2 className="h-4 w-4 mr-1.5" />
                  {!isMobile && 'Share'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={() => handleShare()}>
                  <Share2 className="h-4 w-4 mr-2" />
                  Native Share
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleShare('whatsapp')}>
                  <MessageCircle className="h-4 w-4 mr-2" />
                  WhatsApp
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleShare('email')}>
                  <Mail className="h-4 w-4 mr-2" />
                  Email
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Separator orientation="vertical" className="h-6 mx-1" />

            {/* Sign / Remove Signature */}
            {hasAnnotations ? (
              <Button variant="outline" size="sm" onClick={handleRemoveSignature} className="text-destructive hover:text-destructive">
                <X className="h-4 w-4 mr-1.5" />
                {!isMobile && 'Remove Signature'}
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={handleSign}>
                <PenTool className="h-4 w-4 mr-1.5" />
                {!isMobile && 'Sign'}
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {hasAnnotations && (
              <Badge variant="secondary" className="text-xs">
                Signed
              </Badge>
            )}
            <Badge variant="outline" className="text-xs">
              {pdfSettings.paperSize}
            </Badge>
          </div>
        </div>

        <Separator />

        {/* PDF Preview */}
        <div className="flex-1 min-h-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-muted-foreground">Loading...</div>
            </div>
          ) : useAnnotationViewer ? (
            <PDFAnnotationViewer
              key={`sign-${pdfKey}`}
              document={pdfDocElement}
              fileName={fileName}
              isSigningMode={isSigningMode}
              onSigningModeChange={setIsSigningMode}
              onAnnotationsChange={setHasAnnotations}
              annotations={annotations}
              onAnnotationsUpdate={setAnnotations}
            />
          ) : (
            <PDFAnnotationViewer
              key={`view-${pdfKey}`}
              document={pdfDocElement}
              fileName={fileName}
              isSigningMode={false}
              onSigningModeChange={setIsSigningMode}
              onAnnotationsChange={setHasAnnotations}
              showToolbar={false}
            />
          )}
        </div>

        {/* Footer */}
        {!isMobile && (
          <>
            <Separator />
            <div className="flex items-center justify-between py-2 px-1 text-xs text-muted-foreground">
              <span>Generated on {new Date().toLocaleDateString()}</span>
              <span>Amount: {formatCurrency(payment.amount)}</span>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

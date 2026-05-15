import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Download, Printer, Settings, Share2, Eye, MessageCircle, Mail, PenLine } from 'lucide-react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { OfferPDFDocument, InstallationDetails } from '../OfferPDFDocument';
import { PdfSettings } from '../../utils/pdfSettings.utils';
import { useTranslation } from 'react-i18next';
import { useRef } from 'react';

interface PDFPreviewActionsProps {
  offer: any;
  formatCurrency: (amount: number) => string;
  pdfSettings: PdfSettings;
  isGenerating: boolean;
  viewMode: 'fit' | 'width' | 'zoom';
  onPrint: () => void;
  onShare: (platform?: string) => void;
  onOpenSettings: () => void;
  onViewModeChange: (mode: 'fit' | 'width' | 'zoom') => void;
  onDownloadSuccess: () => void;
  onDownloadError: () => void;
  onSign?: () => void;
  onRemoveSignature?: () => void;
  signatureImage?: string;
  onSendEmail?: () => void;
  printLinkRef?: React.RefObject<HTMLAnchorElement>;
  installationsData?: Record<string, InstallationDetails>;
}

export function PDFPreviewActions({
  offer,
  formatCurrency,
  pdfSettings,
  isGenerating,
  viewMode,
  onPrint,
  onShare,
  onOpenSettings,
  onViewModeChange,
  onDownloadSuccess,
  onDownloadError,
  onSign,
  onRemoveSignature,
  signatureImage,
  onSendEmail,
  printLinkRef,
  installationsData
}: PDFPreviewActionsProps) {
  const { t, i18n } = useTranslation('offers');
  
  // PDF translations object
  const pdfTranslations = {
    offer: t('pdf.offer'),
    offerNumber: t('pdf.offerNumber'),
    date: t('pdf.date'),
    client: t('pdf.client'),
    customerInformation: t('pdf.customerInformation'),
    offerDetails: t('pdf.offerDetails'),
    name: t('pdf.name', 'Name'),
    position: t('pdf.position'),
    email: t('pdf.email'),
    phone: t('pdf.phone'),
    address: t('pdf.address'),
    status: t('pdf.status'),
    created: t('pdf.created'),
    validUntil: t('pdf.validUntil'),
    assignedTo: t('pdf.assignedTo'),
    description: t('pdf.description'),
    offerItems: t('pdf.offerItems'),
    pos: t('pdf.pos'),
    qty: t('pdf.qty'),
    unit: t('pdf.unit'),
    total: t('pdf.total'),
    subtotal: t('pdf.subtotal'),
    tax: t('pdf.tax'),
    tva: t('pdf.tva', 'TVA'),
    discount: t('pdf.discount'),
    additionalNotes: t('pdf.additionalNotes'),
    thankYouMessage: t('pdf.thankYouMessage'),
    page: t('pdf.page', { current: '1', total: '1' }),
    taxId: t('pdf.taxId', 'Tax ID'),
    cin: t('pdf.cin', 'CIN'),
    // Installation info translations
    installationInfo: t('pdf.installationInfo', 'Installation Information'),
    installationName: t('pdf.installationName', 'Name'),
    model: t('pdf.model', 'Model'),
    serialNumber: t('pdf.serialNumber', 'Serial Number'),
    matricule: t('pdf.matricule', 'Matricule'),
    manufacturer: t('pdf.manufacturer', 'Manufacturer'),
    location: t('pdf.location', 'Location'),
    // Fiscal stamp
    fiscalStamp: t('pdf.fiscalStamp', 'Fiscal Stamp'),
    // Amount in words
    amountInWords: t('pdf.amountInWords', 'Amount in Words'),
    statusValue: t(`status.${offer?.status || 'draft'}`, { defaultValue: (offer?.status || 'draft') }),
  };

  return (
    <div className="flex items-center justify-between py-3 px-1">
      <div className="flex items-center gap-3">
        {/* Hidden Print Link - triggered when user clicks Print button */}
        <PDFDownloadLink 
          document={<OfferPDFDocument offer={offer} formatCurrency={formatCurrency} settings={pdfSettings} translations={pdfTranslations} installationsData={installationsData} language={i18n.language} currencyCode={offer?.currency || 'TND'} />} 
          fileName={`quote-${offer.id}.pdf`}
        >
          {({ blob, url, loading, error }) => (
            <a 
              ref={printLinkRef}
              href={url || '#'} 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ display: 'none' }}
              onClick={(e) => {
                if (!url) {
                  e.preventDefault();
                  return;
                }
                // Open PDF in new window
                const printWindow = window.open(url, '_blank', 'width=800,height=600');
                if (printWindow) {
                  // Wait for PDF to load, then print
                  printWindow.onload = () => {
                    setTimeout(() => {
                      printWindow.print();
                    }, 500);
                  };
                  // Fallback: if onload doesn't work, try after a delay
                  setTimeout(() => {
                    if (printWindow && printWindow.document.readyState === 'complete') {
                      printWindow.print();
                    }
                  }, 1000);
                }
              }}
            >
              Print
            </a>
          )}
        </PDFDownloadLink>

        <Button 
          variant="outline" 
          onClick={onPrint} 
          disabled={isGenerating} 
          className="hover:bg-muted"
        >
          <Printer className="h-4 w-4 mr-2" />
          {t('pdfActions.print')}
        </Button>
        
        <PDFDownloadLink 
          document={<OfferPDFDocument offer={offer} formatCurrency={formatCurrency} settings={pdfSettings} translations={pdfTranslations} installationsData={installationsData} language={i18n.language} currencyCode={offer?.currency || 'TND'} />} 
          fileName={`quote-${offer.id}.pdf`} 
          className="inline-flex" 
          onError={onDownloadError}
        >
          {({ loading }) => (
            <Button 
              variant="default" 
              disabled={loading} 
              onClick={onDownloadSuccess} 
              className="bg-primary hover:bg-primary/90"
            >
              <Download className="h-4 w-4 mr-2" />
              {loading ? t('pdfActions.preparing') : t('pdfActions.downloadPdf')}
            </Button>
          )}
        </PDFDownloadLink>

        <Button 
          variant="outline" 
          onClick={onOpenSettings} 
          className="hover:bg-muted"
        >
          <Settings className="h-4 w-4 mr-2" />
          {t('pdfActions.settings')}
        </Button>

        {onSign && (
          <Button
            variant={signatureImage ? 'default' : 'outline'}
            onClick={onSign}
            className="hover:bg-muted"
          >
            <PenLine className="h-4 w-4 mr-2" />
            {signatureImage ? t('pdfActions.signed') : t('pdfActions.sign')}
          </Button>
        )}
        {signatureImage && onRemoveSignature && (
          <Button variant="ghost" size="sm" onClick={onRemoveSignature} className="text-destructive hover:text-destructive">
            ✕ {t('pdfActions.removeSignature')}
          </Button>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              disabled={isGenerating}
              className="hover:bg-muted"
            >
              <Share2 className="h-4 w-4 mr-2" />
              {t('pdfActions.share')}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            {onSendEmail && (
              <DropdownMenuItem onClick={onSendEmail} disabled={isGenerating}>
                <Mail className="h-4 w-4 mr-2" />
                {t('pdfActions.sendViaEmail')}
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => onShare('whatsapp')} disabled={isGenerating}>
              <MessageCircle className="h-4 w-4 mr-2" />
              WhatsApp
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onShare('facebook')} disabled={isGenerating}>
              <Share2 className="h-4 w-4 mr-2" />
              Facebook
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      <div className="flex items-center gap-3">
        <div className="flex rounded-lg border p-1">
          <Button
            variant={viewMode === 'fit' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => onViewModeChange('fit')}
            className="h-7 px-3"
          >
            {t('pdfActions.fitToPage')}
          </Button>
          <Button
            variant={viewMode === 'width' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => onViewModeChange('width')}
            className="h-7 px-3"
          >
            {t('pdfActions.fitWidth')}
          </Button>
        </div>
        <Badge variant="outline" className="text-xs">
          {pdfSettings.paperSize}
        </Badge>
      </div>
    </div>
  );
}
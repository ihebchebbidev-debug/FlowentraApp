import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Download, Settings, MoreVertical, Printer, Share2, MessageCircle, Mail, Eye, PenLine } from 'lucide-react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { OfferPDFDocument, InstallationDetails } from '../OfferPDFDocument';
import { PdfSettingsModal } from '../PdfSettingsModal';
import { PdfSettings } from '../../utils/pdfSettings.utils';
import { useTranslation } from 'react-i18next';

interface PDFMobileActionsProps {
  offer: any;
  formatCurrency: (amount: number) => string;
  pdfSettings: PdfSettings;
  isGenerating: boolean;
  viewMode: 'fit' | 'width' | 'zoom';
  onPrint: () => void;
  onShare: (platform?: string) => void;
  onViewModeChange: (mode: 'fit' | 'width' | 'zoom') => void;
  onSettingsChange: (settings: PdfSettings) => void;
  onDownloadSuccess: () => void;
  onDownloadError: () => void;
  onSign?: () => void;
  onRemoveSignature?: () => void;
  signatureImage?: string;
  onSendEmail?: () => void;
  installationsData?: Record<string, InstallationDetails>;
}

export function PDFMobileActions({
  offer,
  formatCurrency,
  pdfSettings,
  isGenerating,
  viewMode,
  onPrint,
  onShare,
  onViewModeChange,
  onSettingsChange,
  onDownloadSuccess,
  onDownloadError,
  onSign,
  onRemoveSignature,
  signatureImage,
  onSendEmail,
  installationsData
}: PDFMobileActionsProps) {
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
    // Fiscal stamp
    fiscalStamp: t('pdf.fiscalStamp', 'Fiscal Stamp'),
    // Amount in words
    amountInWords: t('pdf.amountInWords', 'Amount in Words'),
    statusValue: t(`status.${offer?.status || 'draft'}`, { defaultValue: (offer?.status || 'draft') }),
  };

  return (
    <div className="flex items-center gap-2">
      <PDFDownloadLink 
        document={<OfferPDFDocument offer={offer} formatCurrency={formatCurrency} settings={pdfSettings} translations={pdfTranslations} installationsData={installationsData} language={i18n.language} currencyCode={offer?.currency || 'TND'} />} 
        fileName={`quote-${offer.id}.pdf`} 
        className="inline-flex" 
        onError={onDownloadError}
      >
        {({ loading }) => (
          <Button 
            size="sm" 
            disabled={loading} 
            onClick={onDownloadSuccess}
            className="flex-1"
          >
            <Download className="h-4 w-4 mr-2" />
            {loading ? t('pdfActions.preparing') : t('pdfActions.download')}
          </Button>
        )}
      </PDFDownloadLink>

      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            {t('pdfActions.settings')}
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-[80vh]">
          <SheetHeader>
            <SheetTitle>{t('pdfActions.pdfSettings')}</SheetTitle>
          </SheetHeader>
          <div className="mt-4">
            <PdfSettingsModal
              isOpen={true}
              onClose={() => {}}
              settings={pdfSettings}
              onSettingsChange={onSettingsChange}
            />
          </div>
        </SheetContent>
      </Sheet>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={onPrint} disabled={isGenerating}>
            <Printer className="h-4 w-4 mr-2" />
            {t('pdfActions.printPdf')}
          </DropdownMenuItem>
          {onSendEmail && (
            <DropdownMenuItem onClick={onSendEmail} disabled={isGenerating}>
              <Mail className="h-4 w-4 mr-2" />
              {t('pdfActions.sendViaEmail')}
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={() => onShare('whatsapp')} disabled={isGenerating}>
            <MessageCircle className="h-4 w-4 mr-2" />
            {t('pdfActions.shareWhatsapp')}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onShare('facebook')} disabled={isGenerating}>
            <Share2 className="h-4 w-4 mr-2" />
            {t('pdfActions.shareFacebook')}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => onViewModeChange(viewMode === 'fit' ? 'width' : 'fit')}>
            <Eye className="h-4 w-4 mr-2" />
            {t('pdfActions.toggleViewMode')}
          </DropdownMenuItem>
          {onSign && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onSign}>
                <PenLine className="h-4 w-4 mr-2" />
                {signatureImage ? t('pdfActions.signed') : t('pdfActions.sign')}
              </DropdownMenuItem>
              {signatureImage && onRemoveSignature && (
                <DropdownMenuItem onClick={onRemoveSignature} className="text-destructive">
                  {t('pdfActions.removeSignature')}
                </DropdownMenuItem>
              )}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
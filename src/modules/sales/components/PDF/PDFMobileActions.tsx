import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Download, Settings, MoreVertical, Printer, Share2, MessageCircle, Mail, Eye, PenLine } from 'lucide-react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { SalePDFDocument, InstallationDetails } from '../SalePDFDocument';
import { PdfSettingsModal } from '../PdfSettingsModal';
import { PdfSettings } from '../../utils/pdfSettings.utils';
import { useTranslation } from 'react-i18next';

interface PDFMobileActionsProps {
  sale: any;
  formatCurrency: (amount: number) => string;
  pdfSettings: PdfSettings;
  pdfTranslations?: any;
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
  sale,
  formatCurrency,
  pdfSettings,
  pdfTranslations,
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
  const { t, i18n } = useTranslation('sales');

  return (
    <div className="flex items-center gap-2">
      <PDFDownloadLink 
        document={<SalePDFDocument sale={sale} formatCurrency={formatCurrency} settings={pdfSettings} translations={pdfTranslations} installationsData={installationsData} language={i18n.language} currencyCode={sale?.currency || 'TND'} />} 
        fileName={`sale-order-${sale.id}.pdf`} 
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
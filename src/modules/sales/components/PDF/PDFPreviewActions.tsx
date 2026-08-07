import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Download, Printer, Settings, Share2, Eye, MessageCircle, Mail, PenLine } from 'lucide-react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { SalePDFDocument, InstallationDetails } from '../SalePDFDocument';
import { PdfSettings } from '../../utils/pdfSettings.utils';
import { useTranslation } from 'react-i18next';

interface PDFPreviewActionsProps {
  sale: any;
  formatCurrency: (amount: number) => string;
  pdfSettings: PdfSettings;
  pdfTranslations?: any;
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
  installationsData?: Record<string, InstallationDetails>;
}

export function PDFPreviewActions({
  sale,
  formatCurrency,
  pdfSettings,
  pdfTranslations,
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
  installationsData
}: PDFPreviewActionsProps) {
  const { t, i18n } = useTranslation('sales');

  return (
    <div className="flex items-center justify-between py-3 px-1">
      <div className="flex items-center gap-3">
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
          document={<SalePDFDocument sale={sale} formatCurrency={formatCurrency} settings={pdfSettings} translations={pdfTranslations} installationsData={installationsData} language={i18n.language} currencyCode={sale?.currency || 'TND'} />} 
          fileName={`sale-order-${sale.id}.pdf`} 
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
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Download, Printer, Settings, Share2, Eye, MessageCircle, Mail } from 'lucide-react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { ServiceOrderPDFDocument, InstallationDetails } from '../ServiceOrderPDFDocument';
import { PdfSettings } from '../../utils/pdfSettings.utils';
import { useTranslation } from 'react-i18next';

interface PDFPreviewActionsProps {
  serviceOrder: any;
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
  onSendEmail?: () => void;
  installationsData?: Record<string, InstallationDetails>;
}

export function PDFPreviewActions({
  serviceOrder,
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
  onSendEmail,
  installationsData
}: PDFPreviewActionsProps) {
  const { t } = useTranslation('service_orders');

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
          Print
        </Button>
        
        <PDFDownloadLink 
          document={<ServiceOrderPDFDocument serviceOrder={serviceOrder} formatCurrency={formatCurrency} settings={pdfSettings} installationsData={installationsData} />} 
          fileName={`service-report-${serviceOrder.orderNumber}.pdf`} 
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
              {loading ? 'Preparing...' : 'Download PDF'}
            </Button>
          )}
        </PDFDownloadLink>

        <Button 
          variant="outline" 
          onClick={onOpenSettings} 
          className="hover:bg-muted"
        >
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              disabled={isGenerating}
              className="hover:bg-muted"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            {onSendEmail && (
              <DropdownMenuItem onClick={onSendEmail} disabled={isGenerating}>
                <Mail className="h-4 w-4 mr-2" />
                Envoyer par Email
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
            Fit to Page
          </Button>
          <Button
            variant={viewMode === 'width' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => onViewModeChange('width')}
            className="h-7 px-3"
          >
            Fit Width
          </Button>
        </div>
        <Badge variant="outline" className="text-xs">
          {pdfSettings.paperSize}
        </Badge>
      </div>
    </div>
  );
}
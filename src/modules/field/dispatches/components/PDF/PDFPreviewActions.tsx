import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Download, Printer, Settings, Share2, MessageCircle, Mail } from 'lucide-react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { DispatchPDFDocument } from '../DispatchPDFDocument';
import { PdfSettings } from '../../utils/pdfSettings.utils';
import { useTranslation } from 'react-i18next';

interface PDFPreviewActionsProps {
  dispatch: any;
  customer: any;
  installation: any;
  timeData: any[];
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
  onSendEmail?: () => void;
}

export function PDFPreviewActions({
  dispatch,
  customer,
  installation,
  timeData,
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
  onSendEmail
}: PDFPreviewActionsProps) {
  const { t } = useTranslation('dispatches');

  return (
    <div className="flex items-center justify-between py-3 px-1">
      <div className="flex items-center gap-3">
        <Button variant="outline" onClick={onPrint} disabled={isGenerating}>
          <Printer className="h-4 w-4 mr-2" />
          Print
        </Button>
        
        <PDFDownloadLink 
          document={<DispatchPDFDocument dispatch={dispatch} customer={customer} installation={installation} timeData={timeData} formatCurrency={formatCurrency} settings={pdfSettings} translations={pdfTranslations} />} 
          fileName={`dispatch-report-${dispatch.dispatchNumber}.pdf`} 
          onError={onDownloadError}
        >
          {({ loading }) => (
            <Button variant="default" disabled={loading} onClick={onDownloadSuccess}>
              <Download className="h-4 w-4 mr-2" />
              {loading ? 'Preparing...' : 'Download PDF'}
            </Button>
          )}
        </PDFDownloadLink>

        <Button variant="outline" onClick={onOpenSettings}>
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" disabled={isGenerating}>
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
            <DropdownMenuItem onClick={() => onShare('whatsapp')}>
              <MessageCircle className="h-4 w-4 mr-2" />
              WhatsApp
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onShare('facebook')}>
              <Share2 className="h-4 w-4 mr-2" />
              Facebook
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      <div className="flex items-center gap-3">
        <Badge variant="outline" className="text-xs">
          {pdfSettings.paperSize}
        </Badge>
      </div>
    </div>
  );
}
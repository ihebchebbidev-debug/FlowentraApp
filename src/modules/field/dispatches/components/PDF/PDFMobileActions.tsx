import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Download, Settings, Share2, Printer, MessageCircle, Mail } from 'lucide-react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { DispatchPDFDocument } from '../DispatchPDFDocument';
import { PdfSettings } from '../../utils/pdfSettings.utils';
import { useTranslation } from 'react-i18next';

interface PDFMobileActionsProps {
  dispatch: any;
  customer: any;
  installation: any;
  timeData: any[];
  formatCurrency: (amount: number) => string;
  pdfSettings: PdfSettings;
  pdfTranslations?: any;
  isGenerating: boolean;
  onPrint: () => void;
  onShare: (platform?: string) => void;
  onDownloadSuccess: () => void;
  onDownloadError: () => void;
  onSendEmail?: () => void;
}

export function PDFMobileActions({
  dispatch,
  customer,
  installation,
  timeData,
  formatCurrency,
  pdfSettings,
  pdfTranslations,
  isGenerating,
  onPrint,
  onShare,
  onDownloadSuccess,
  onDownloadError,
  onSendEmail
}: PDFMobileActionsProps) {
  const { t } = useTranslation('dispatches');

  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-2">
        <PDFDownloadLink 
          document={<DispatchPDFDocument dispatch={dispatch} customer={customer} installation={installation} timeData={timeData} formatCurrency={formatCurrency} settings={pdfSettings} translations={pdfTranslations} />} 
          fileName={`dispatch-report-${dispatch.dispatchNumber}.pdf`}
          onError={onDownloadError}
        >
          {({ loading }) => (
            <Button size="sm" disabled={loading} onClick={onDownloadSuccess}>
              <Download className="h-4 w-4 mr-1" />
              {loading ? 'Preparing...' : 'Download'}
            </Button>
          )}
        </PDFDownloadLink>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onPrint} disabled={isGenerating}>
          <Printer className="h-4 w-4" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" disabled={isGenerating}>
              <Share2 className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {onSendEmail && (
              <DropdownMenuItem onClick={onSendEmail}>
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
    </div>
  );
}
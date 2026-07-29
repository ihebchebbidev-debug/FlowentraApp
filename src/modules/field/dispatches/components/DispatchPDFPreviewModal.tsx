import { useState, useEffect, useMemo, useCallback } from 'react';
import { PDFViewer } from '@react-pdf/renderer';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { FileText, Maximize2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { DispatchPDFDocument } from './DispatchPDFDocument';
import { defaultSettings, getCompanyLogoBase64 } from '../utils/pdfSettings.utils';
import { SendReportEmailDialog } from '@/components/shared/SendReportEmailDialog';
import { ShareLinkDialog } from '@/components/shared/ShareLinkDialog';
import { PdfSettingsService } from '../services/pdfSettings.service';
import { PdfSettingsModal } from './PdfSettingsModal';
import { PDFPreviewActions } from './PDF/PDFPreviewActions';
import { PDFMobileActions } from './PDF/PDFMobileActions';
import { usePDFActions } from '../hooks/usePDFActions';
import { useIsMobile } from '@/hooks/use-mobile';
import { useCompanyLogo } from '@/hooks/useCompanyLogo';
import { buildPdfFilename } from '@/shared/pdf/filename';
import { toast } from 'sonner';
import { resolveCompanyForPdf } from '@/shared/pdf/resolveCompany';

interface DispatchPDFPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  dispatch: any;
  customer: any;
  installation: any;
  timeData: any[];
  formatCurrency: (amount: number) => string;
}

export function DispatchPDFPreviewModal({
  isOpen,
  onClose,
  dispatch,
  customer,
  installation,
  timeData,
  formatCurrency
}: DispatchPDFPreviewModalProps) {
  const companyLogo = useCompanyLogo();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [pdfSettings, setPdfSettings] = useState(defaultSettings);
  const [viewMode, setViewMode] = useState<'fit' | 'width' | 'zoom'>('fit');
  const [pdfKey, setPdfKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSendEmailOpen, setIsSendEmailOpen] = useState(false);
  const [sharePlatform, setSharePlatform] = useState<'whatsapp' | 'facebook' | null>(null);
  const isMobile = useIsMobile();
  const { t } = useTranslation('dispatches');

  const pdfTranslations = useMemo(() => ({
    customerInformation: t('pdf.customerInformation', 'Customer Information'),
    email: t('pdf.email', 'Email:'),
    phone: t('pdf.phone', 'Phone:'),
    address: t('pdf.address', 'Address:'),
    dispatchDetails: t('pdf.dispatchDetails', 'Dispatch Details'),
    serviceOrder: t('pdf.serviceOrder', 'Service Order:'),
    status: t('pdf.status', 'Status:'),
    priority: t('pdf.priority', 'Priority:'),
    scheduled: t('pdf.scheduled', 'Scheduled:'),
    estDuration: t('pdf.estDuration', 'Est. Duration:'),
    actualDuration: t('pdf.actualDuration', 'Actual Duration:'),
    assignmentDetails: t('pdf.assignmentDetails', 'Assignment Details'),
    technicians: t('pdf.technicians', 'Technician(s):'),
    requiredSkills: t('pdf.requiredSkills', 'Required Skills:'),
    installation: t('pdf.installation', 'Installation:'),
    model: t('pdf.model', 'Model:'),
    serialNumber: t('pdf.serialNumber', 'Serial Number:'),
    matricule: t('pdf.matricule', 'Matricule:'),
    manufacturer: t('pdf.manufacturer', 'Manufacturer:'),
    location: t('pdf.location', 'Location:'),
    dispatchedBy: t('pdf.dispatchedBy', 'Dispatched By:'),
    jobDescription: t('pdf.jobDescription', 'Job Description'),
    timeTracking: t('pdf.timeTracking', 'Time Tracking'),
    type: t('pdf.type', 'Type'),
    description: t('pdf.description', 'Description'),
    duration: t('pdf.duration', 'Duration'),
    materialsArticles: t('pdf.materialsArticles', 'Materials / Articles Used'),
    sku: t('pdf.sku', 'SKU'),
    article: t('pdf.article', 'Article'),
    qty: t('pdf.qty', 'Qty'),
    replacing: t('pdf.replacing', 'Replacing:'),
    date: t('pdf.date', 'Date'),
    statusCol: t('pdf.statusCol', 'Status'),
    technicalSummary: t('pdf.technicalSummary', 'Technical Summary'),
    totalTime: t('pdf.totalTime', 'Total Time'),
    estDurationSummary: t('pdf.estDurationSummary', 'Est. Duration'),
    materialsCount: t('pdf.materialsCount', 'Materials Used'),
    notes: t('pdf.notes', 'Notes'),
    page: t('pdf.page', 'Page'),
    thankYouMessage: t('pdf.thankYouMessage', 'Thank you for choosing our services.'),
  }), [t]);

  // Memoize the PDF document element
  const pdfDocElement = useMemo(() => (
    <DispatchPDFDocument 
      dispatch={dispatch}
      customer={customer}
      installation={installation}
      timeData={timeData}
      formatCurrency={formatCurrency}
      settings={pdfSettings}
      translations={pdfTranslations}
    />
  ), [dispatch, customer, installation, timeData, formatCurrency, pdfSettings, pdfTranslations]);

  const pdfFileName = useMemo(
    () => buildPdfFilename({ prefix: 'dispatch-report', preferredId: dispatch.dispatchNumber, fallbackId: dispatch.id }),
    [dispatch.dispatchNumber, dispatch.id]
  );

  const shareText = `Dispatch Report #${dispatch.dispatchNumber}`;

  const {
    isGenerating,
    handlePrint,
    handleShare,
    handleDownloadSuccess,
    handleDownloadError
  } = usePDFActions({
    dispatch,
    pdfDocument: pdfDocElement,
    fileName: pdfFileName,
    shareTitle: `Dispatch Report ${dispatch.dispatchNumber || dispatch.id}`,
    shareText,
  });

  const wrappedHandleShare = useCallback((platform?: string) => {
    if (platform === 'whatsapp' || platform === 'facebook') {
      setSharePlatform(platform);
    } else {
      handleShare(platform);
    }
  }, [handleShare]);

  // Load settings from backend dynamically on mount
  useEffect(() => {
    let isMounted = true;
    
    const loadSettings = async () => {
      try {
        setIsLoading(true);
        const settings = await PdfSettingsService.loadSettingsAsync();
        if (isMounted) {
          // A failing logo fetch must not discard the settings we just loaded.
          let logoBase64 = '';
          try {
            logoBase64 = (await getCompanyLogoBase64(companyLogo)) || '';
          } catch (logoError) {
            console.warn('[DispatchPDF] Company logo could not be resolved:', logoError);
          }
          setPdfSettings({
            ...settings,
            company: await resolveCompanyForPdf(settings.company, logoBase64 || '')
          });
        }
      } catch (error) {
        console.warn('Failed to load PDF settings from backend:', error);
        if (isMounted) {
          setPdfSettings(defaultSettings);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    if (isOpen) {
      loadSettings();
    }

    return () => {
      isMounted = false;
    };
  }, [isOpen, companyLogo]);

  // Save settings and force PDF re-render when settings change
  useEffect(() => {
    if (!isLoading) {
      PdfSettingsService.saveSettings(pdfSettings);
      const timer = setTimeout(() => {
        setPdfKey(prev => prev + 1);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [pdfSettings, isLoading]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`${isMobile ? 'max-w-[95vw] h-[95vh]' : 'max-w-7xl h-[90vh]'} flex flex-col`}>
        <DialogHeader className={`${isMobile ? 'pb-2' : ''} flex flex-row items-center justify-between space-y-0`}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle className={`${isMobile ? 'text-lg' : 'text-xl'}`}>
                PDF Preview
              </DialogTitle>
              <p className="text-sm text-muted-foreground">
                Dispatch Report #{dispatch.dispatchNumber}
              </p>
            </div>
          </div>
        </DialogHeader>

        <Separator />

        {/* Mobile vs Desktop Actions */}
        {isMobile ? (
          <PDFMobileActions
            dispatch={dispatch}
            customer={customer}
            installation={installation}
            timeData={timeData}
            formatCurrency={formatCurrency}
            pdfSettings={pdfSettings}
            pdfTranslations={pdfTranslations}
            isGenerating={isGenerating}
            onPrint={handlePrint}
            onShare={wrappedHandleShare}
            onDownloadSuccess={handleDownloadSuccess}
            onDownloadError={handleDownloadError}
            onSendEmail={() => setIsSendEmailOpen(true)}
          />
        ) : (
          <PDFPreviewActions
            dispatch={dispatch}
            customer={customer}
            installation={installation}
            timeData={timeData}
            formatCurrency={formatCurrency}
            pdfSettings={pdfSettings}
            pdfTranslations={pdfTranslations}
            isGenerating={isGenerating}
            viewMode={viewMode}
            onPrint={handlePrint}
            onShare={wrappedHandleShare}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onViewModeChange={setViewMode}
            onDownloadSuccess={handleDownloadSuccess}
            onDownloadError={handleDownloadError}
            onSendEmail={() => setIsSendEmailOpen(true)}
          />
        )}

        <Separator />

        {/* PDF Preview */}
        <div className="flex-1 min-h-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-muted-foreground">Loading settings...</div>
            </div>
          ) : (
            <PDFViewer 
              key={pdfKey}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                borderRadius: isMobile ? '4px' : '8px',
                backgroundColor: '#f8fafc'
              }} 
              showToolbar={!isMobile}
            >
              {pdfDocElement}
            </PDFViewer>
          )}
        </div>

        <PdfSettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          settings={pdfSettings}
          onSettingsChange={setPdfSettings}
        />

        {/* Send Report via Email Dialog */}
        <SendReportEmailDialog
          open={isSendEmailOpen}
          onOpenChange={setIsSendEmailOpen}
          pdfDocument={pdfDocElement}
          fileName={pdfFileName}
          reportType="offer"
          reportNumber={dispatch.dispatchNumber || dispatch.id}
          reportTitle={`Dispatch ${dispatch.dispatchNumber}`}
          customerName={customer?.company || customer?.name}
          translationNs="dispatches"
        />

        {/* Share Link Dialog for WhatsApp/Facebook */}
        <ShareLinkDialog
          isOpen={sharePlatform !== null}
          onClose={() => setSharePlatform(null)}
          platform={sharePlatform}
          pdfDocument={pdfDocElement}
          fileName={pdfFileName}
          shareText={shareText}
        />
      </DialogContent>
    </Dialog>
  );
}
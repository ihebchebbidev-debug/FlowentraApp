import { useState, useEffect, useMemo, useCallback } from 'react';
import { installationsApi } from '@/services/api/installationsApi';
import { PDFViewer } from '@react-pdf/renderer';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { FileText, Maximize2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ServiceOrderPDFDocument, type InstallationDetails } from './ServiceOrderPDFDocument';
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

interface ServiceOrderPDFPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  serviceOrder: any;
  formatCurrency: (amount: number) => string;
}

export function ServiceOrderPDFPreviewModal({
  isOpen,
  onClose,
  serviceOrder,
  formatCurrency
}: ServiceOrderPDFPreviewModalProps) {
  const companyLogo = useCompanyLogo();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [pdfSettings, setPdfSettings] = useState(defaultSettings);
  const [viewMode, setViewMode] = useState<'fit' | 'width' | 'zoom'>('fit');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [pdfKey, setPdfKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSendEmailOpen, setIsSendEmailOpen] = useState(false);
  const [sharePlatform, setSharePlatform] = useState<'whatsapp' | 'facebook' | null>(null);
  const isMobile = useIsMobile();
  const { t } = useTranslation('service_orders');

  const pdfTranslations = useMemo(() => ({
    customerInformation: t('pdf.customerInformation', 'Customer Information'),
    email: t('pdf.email', 'Email:'),
    phone: t('pdf.phone', 'Phone:'),
    address: t('pdf.address', 'Address:'),
    taxId: t('pdf.taxId', 'Tax ID:'),
    cin: t('pdf.cin', 'CIN:'),
    serviceOrderDetails: t('pdf.serviceOrderDetails', 'Service Order Details'),
    date: t('pdf.date', 'Date:'),
    status: t('pdf.status', 'Status:'),
    priority: t('pdf.priority', 'Priority:'),
    promisedDate: t('pdf.promisedDate', 'Promised Date:'),
    location: t('pdf.location', 'Location:'),
    saleRef: t('pdf.saleRef', 'Sale Ref:'),
    technicians: t('pdf.technicians', 'Technicians:'),
    repairDescription: t('pdf.repairDescription', 'Repair Description'),
    dispatches: t('pdf.dispatches', 'Dispatches'),
    dispatch: t('pdf.dispatch', 'Dispatch'),
    dateCol: t('pdf.dateCol', 'Date'),
    technician: t('pdf.technician', 'Technician'),
    statusCol: t('pdf.statusCol', 'Status'),
    duration: t('pdf.duration', 'Duration'),
    servicesJobs: t('pdf.servicesJobs', 'Services / Jobs'),
    service: t('pdf.service', 'Service'),
    materialsUsed: t('pdf.materialsUsed', 'Materials Used'),
    article: t('pdf.article', 'Article'),
    description: t('pdf.description', 'Description'),
    qty: t('pdf.qty', 'Qty'),
    timeTracking: t('pdf.timeTracking', 'Time Tracking'),
    type: t('pdf.type', 'Type'),
    totalTime: t('pdf.totalTime', 'Total Time'),
    technicalSummary: t('pdf.technicalSummary', 'Technical Summary'),
    totalDispatches: t('pdf.totalDispatches', 'Total Dispatches'),
    totalJobs: t('pdf.totalJobs', 'Total Jobs'),
    materialsCount: t('pdf.materialsCount', 'Materials Used'),
    notes: t('pdf.notes', 'Notes'),
    page: t('pdf.page', 'Page'),
    thankYouMessage: t('pdf.thankYouMessage', 'Thank you for choosing our services.'),
    model: t('pdf.model', 'Model'),
    serialNumber: t('pdf.serialNumber', 'Serial Number'),
    matricule: t('pdf.matricule', 'Matricule'),
    manufacturer: t('pdf.manufacturer', 'Manufacturer'),
    installationName: t('pdf.installationName', 'Installation Name'),
  }), [t]);

  const {
    isGenerating,
    handlePrint,
    handleShare,
    handleDownloadSuccess,
    handleDownloadError
  } = usePDFActions({ serviceOrder, formatCurrency, pdfSettings });

  const wrappedHandleShare = useCallback((platform?: string) => {
    if (platform === 'whatsapp' || platform === 'facebook') {
      setSharePlatform(platform);
    } else {
      handleShare(platform);
    }
  }, [handleShare]);

  // Fetch installation details for jobs grouped by installation
  const [installationsData, setInstallationsData] = useState<Record<string, InstallationDetails>>({});
  useEffect(() => {
    if (!isOpen || !serviceOrder?.jobs) return;
    const jobs = serviceOrder.jobs || [];
    const installationIds = [...new Set(jobs.map((j: any) => j.installationId).filter(Boolean))].map(String);
    if (installationIds.length === 0) return;

    const fetchInstallations = async () => {
      const data: Record<string, InstallationDetails> = {};
      await Promise.all(installationIds.map(async (id) => {
        try {
          const inst = await installationsApi.getById(id);
          data[id] = { 
            name: inst.name, 
            model: inst.model, 
            serialNumber: inst.serialNumber, 
            matricule: inst.matricule, 
            manufacturer: inst.manufacturer,
            siteAddress: inst.siteAddress
          };
        } catch (error) {
          console.warn(`[ServiceOrderPDFPreview] Failed to fetch installation ${id}:`, error);
        }
      }));
      setInstallationsData(data);
    };
    fetchInstallations();
  }, [isOpen, serviceOrder]);

  // Memoize the PDF document element to prevent unnecessary re-renders of PDFAnnotationViewer
  const pdfDocElement = useMemo(() => (
    <ServiceOrderPDFDocument serviceOrder={serviceOrder} formatCurrency={formatCurrency} settings={pdfSettings} translations={pdfTranslations} installationsData={installationsData} />
  ), [serviceOrder, formatCurrency, pdfSettings, pdfTranslations, installationsData]);

  // Load settings from backend dynamically on mount
  useEffect(() => {
    let isMounted = true;
    
    const loadSettings = async () => {
      try {
        setIsLoading(true);
        const settings = await PdfSettingsService.loadSettingsAsync();
        if (isMounted) {
          const logoBase64 = await getCompanyLogoBase64(companyLogo);
          console.log('[ServiceOrderPDF] Logo resolved:', logoBase64 ? `${logoBase64.substring(0, 60)}...` : 'EMPTY');
          setPdfSettings({
            ...settings,
            company: { ...settings.company, logo: logoBase64 || '' }
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
                Service Report #{serviceOrder.orderNumber}
                {!isMobile && ` - ${serviceOrder.customer?.company || 'Service Order'}`}
              </p>
            </div>
          </div>
          {isMobile && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          )}
        </DialogHeader>

        <Separator />

        {/* Mobile vs Desktop Actions */}
        {isMobile ? (
          <PDFMobileActions
            serviceOrder={serviceOrder}
            formatCurrency={formatCurrency}
            pdfSettings={pdfSettings}
            isGenerating={isGenerating}
            viewMode={viewMode}
            onPrint={handlePrint}
            onShare={wrappedHandleShare}
            onViewModeChange={setViewMode}
            onSettingsChange={setPdfSettings}
            onDownloadSuccess={handleDownloadSuccess}
            onDownloadError={handleDownloadError}
            onSendEmail={() => setIsSendEmailOpen(true)}
            installationsData={installationsData}
          />
        ) : (
          <PDFPreviewActions
            serviceOrder={serviceOrder}
            formatCurrency={formatCurrency}
            pdfSettings={pdfSettings}
            isGenerating={isGenerating}
            viewMode={viewMode}
            onPrint={handlePrint}
            onShare={wrappedHandleShare}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onViewModeChange={setViewMode}
            onDownloadSuccess={handleDownloadSuccess}
            onDownloadError={handleDownloadError}
            onSendEmail={() => setIsSendEmailOpen(true)}
            installationsData={installationsData}
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

        {/* Footer Info */}
        {!isMobile && (
          <>
            <Separator />
            <div className="flex items-center justify-between py-2 px-1 text-xs text-muted-foreground">
              <span>Generated on {new Date().toLocaleDateString()}</span>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {Object.values(pdfSettings.showElements).filter(Boolean).length} sections enabled
                </Badge>
              </div>
            </div>
          </>
        )}

        {/* PDF Settings Modal */}
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
          fileName={`service-report-${serviceOrder.orderNumber}.pdf`}
          reportType="offer"
          reportNumber={serviceOrder.orderNumber || serviceOrder.id}
          reportTitle={serviceOrder.customer?.company || 'Service Order'}
          customerName={serviceOrder.customer?.company || serviceOrder.customer?.name}
          translationNs="service_orders"
        />

        {/* Share Link Dialog for WhatsApp/Facebook */}
        <ShareLinkDialog
          isOpen={sharePlatform !== null}
          onClose={() => setSharePlatform(null)}
          platform={sharePlatform}
          pdfDocument={pdfDocElement}
          fileName={`service-report-${serviceOrder.orderNumber}.pdf`}
          shareText={`Service Report #${serviceOrder.orderNumber} - ${serviceOrder.customer?.company || 'Service Order'}`}
        />
      </DialogContent>
    </Dialog>
  );
}
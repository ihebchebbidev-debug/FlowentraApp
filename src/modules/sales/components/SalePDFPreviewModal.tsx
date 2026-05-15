import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { FileText, Maximize2 } from 'lucide-react';
import { SalePDFDocument, InstallationDetails } from './SalePDFDocument';
import { installationsApi } from '@/services/api/installationsApi';
import { defaultSettings, getCompanyLogoBase64 } from '../utils/pdfSettings.utils';
import { SendReportEmailDialog } from '@/components/shared/SendReportEmailDialog';
import { ShareLinkDialog } from '@/components/shared/ShareLinkDialog';
import { PdfSettingsService } from '../services/pdfSettings.service';
import { PdfSettingsModal } from './PdfSettingsModal';
import { PDFPreviewActions } from './PDF/PDFPreviewActions';
import { PDFMobileActions } from './PDF/PDFMobileActions';
import { usePDFActions } from '../hooks/usePDFActions';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTranslation } from 'react-i18next';
import { PDFAnnotationViewer, AnnotationsMap } from '@/components/shared/PDFAnnotationViewer';
import { useCompanyLogo } from '@/hooks/useCompanyLogo';

interface SalePDFPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: any;
  formatCurrency: (amount: number) => string;
}

export function SalePDFPreviewModal({
  isOpen,
  onClose,
  sale,
  formatCurrency
}: SalePDFPreviewModalProps) {
  const { t, i18n } = useTranslation('sales');
  const companyLogo = useCompanyLogo();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [pdfSettings, setPdfSettings] = useState(defaultSettings);
  const [viewMode, setViewMode] = useState<'fit' | 'width' | 'zoom'>('fit');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [pdfKey, setPdfKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSigningMode, setIsSigningMode] = useState(false);
  const [hasAnnotations, setHasAnnotations] = useState(false);
  const [isSendEmailOpen, setIsSendEmailOpen] = useState(false);
  const [sharePlatform, setSharePlatform] = useState<'whatsapp' | 'facebook' | null>(null);
  // Lift annotations state so it persists across signing mode toggles
  const [annotations, setAnnotations] = useState<AnnotationsMap>(new Map());
  const isMobile = useIsMobile();

  // PDF translations object — memoized to avoid re-creating on every render
  const pdfTranslations = useMemo(() => ({
    saleOrder: t('pdf.saleOrder'),
    saleNumber: t('pdf.saleNumber'),
    date: t('pdf.date'),
    client: t('pdf.client'),
    customerInformation: t('pdf.customerInformation'),
    saleDetails: t('pdf.saleDetails'),
    name: t('pdf.name', 'Name'),
    position: t('pdf.position'),
    email: t('pdf.email'),
    phone: t('pdf.phone'),
    address: t('pdf.address'),
    status: t('pdf.status'),
    created: t('pdf.created'),
    deliveryDate: t('pdf.deliveryDate'),
    assignedTo: t('pdf.assignedTo'),
    description: t('pdf.description'),
    saleItems: t('pdf.saleItems'),
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
    installationInfo: t('pdf.installationInfo', 'Installation Information'),
    installationName: t('pdf.installationName', 'Installation Name'),
    model: t('pdf.model', 'Model'),
    serialNumber: t('pdf.serialNumber', 'Serial Number'),
    matricule: t('pdf.matricule', 'Matricule'),
    manufacturer: t('pdf.manufacturer', 'Manufacturer'),
    location: t('pdf.location', 'Location'),
    fiscalStamp: t('pdf.fiscalStamp', 'Fiscal Stamp'),
    amountInWords: t('pdf.amountInWords', 'Amount in Words'),
    statusValue: t(sale?.status || 'created', { defaultValue: (sale?.status || 'created') }),
  }), [t, sale?.status]);

  const {
    isGenerating,
    handlePrint,
    handleShare,
    handleDownloadSuccess,
    handleDownloadError
  } = usePDFActions({ sale, formatCurrency, pdfSettings });

  // Intercept share for whatsapp/facebook to show dialog
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
          const logoBase64 = await getCompanyLogoBase64(companyLogo);
          console.log('[SalePDF] Logo resolved:', logoBase64 ? `${logoBase64.substring(0, 60)}...` : 'EMPTY');
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

  // Reset annotations when modal closes
  useEffect(() => {
    if (!isOpen) {
      setAnnotations(new Map());
      setHasAnnotations(false);
      setIsSigningMode(false);
    }
  }, [isOpen]);

  // Save settings and force PDF re-render when settings change
  // Track previous settings to avoid re-render on annotation-only state changes
  const settingsJsonRef = useRef('');
  useEffect(() => {
    if (!isLoading) {
      const settingsJson = JSON.stringify(pdfSettings);
      // Only save and re-render if settings actually changed
      if (settingsJson !== settingsJsonRef.current) {
        settingsJsonRef.current = settingsJson;
        PdfSettingsService.saveSettings(pdfSettings);
        const timer = setTimeout(() => {
          setPdfKey(prev => prev + 1);
        }, 100);
        return () => clearTimeout(timer);
      }
    }
  }, [pdfSettings, isLoading]);

  const handleRemoveSignature = useCallback(() => {
    setAnnotations(new Map());
    setHasAnnotations(false);
    setIsSigningMode(false);
  }, []);

  // Fetch installation details for items grouped by installation
  const [installationsData, setInstallationsData] = useState<Record<string, InstallationDetails>>({});
  useEffect(() => {
    if (!isOpen || !sale?.items) return;
    const installationIds = [...new Set(
      sale.items
        .filter((item: any) => item.installationId)
        .map((item: any) => String(item.installationId))
    )] as string[];
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
          console.warn(`[SalePDFPreview] Failed to fetch installation ${id}:`, error);
        }
      }));
      setInstallationsData(data);
    };
    fetchInstallations();
  }, [isOpen, sale]);

  // Memoize the PDF document element to prevent unnecessary re-renders of PDFAnnotationViewer
  const pdfDocElement = useMemo(() => (
    <SalePDFDocument
      sale={sale}
      formatCurrency={formatCurrency}
      settings={pdfSettings}
      translations={pdfTranslations}
      installationsData={installationsData}
      language={i18n.language}
      currencyCode={sale?.currency || 'TND'}
    />
  ), [sale, formatCurrency, pdfSettings, pdfTranslations, installationsData, i18n.language]);

  const handleSign = useCallback(() => setIsSigningMode(true), []);

  // Use annotation viewer whenever user has signed OR is signing
  const useAnnotationViewer = isSigningMode || hasAnnotations;

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
                {t('pdfPreview.title')}
              </DialogTitle>
              <p className="text-sm text-muted-foreground">
                {t('pdfPreview.saleNumber', { number: sale.saleNumber || sale.id })}
                {!isMobile && ` - ${sale.title}`}
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
            sale={sale}
            formatCurrency={formatCurrency}
            pdfSettings={pdfSettings}
            pdfTranslations={pdfTranslations}
            isGenerating={isGenerating}
            viewMode={viewMode}
            onPrint={handlePrint}
            onShare={wrappedHandleShare}
            onViewModeChange={setViewMode}
            onSettingsChange={setPdfSettings}
            onDownloadSuccess={handleDownloadSuccess}
            onDownloadError={handleDownloadError}
            onSign={handleSign}
            onRemoveSignature={handleRemoveSignature}
            signatureImage={hasAnnotations ? 'signed' : undefined}
            onSendEmail={() => setIsSendEmailOpen(true)}
            installationsData={installationsData}
          />
        ) : (
          <PDFPreviewActions
            sale={sale}
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
            onSign={handleSign}
            onRemoveSignature={handleRemoveSignature}
            signatureImage={hasAnnotations ? 'signed' : undefined}
            onSendEmail={() => setIsSendEmailOpen(true)}
            installationsData={installationsData}
          />
        )}

        <Separator />

        {/* PDF Preview — annotation viewer stays mounted to preserve signature */}
        <div className="flex-1 min-h-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-muted-foreground">{t('pdfPreview.loadingSettings')}</div>
            </div>
          ) : useAnnotationViewer ? (
            <PDFAnnotationViewer
              key={`sign-${pdfKey}`}
              document={pdfDocElement}
              fileName={`sale-order-${sale.saleNumber || sale.id}-signed.pdf`}
              isSigningMode={isSigningMode}
              onSigningModeChange={setIsSigningMode}
              onAnnotationsChange={setHasAnnotations}
              annotations={annotations}
              onAnnotationsUpdate={setAnnotations}
            />
          ) : (
            <iframe
              key={pdfKey}
              src=""
              style={{ display: 'none' }}
            />
          )}
          {/* Standard PDF viewer when no annotations */}
          {!isLoading && !useAnnotationViewer && (
            <PDFAnnotationViewer
              key={`view-${pdfKey}`}
              document={pdfDocElement}
              fileName={`sale-order-${sale.saleNumber || sale.id}.pdf`}
              isSigningMode={false}
              onSigningModeChange={setIsSigningMode}
              onAnnotationsChange={setHasAnnotations}
              showToolbar={false}
            />
          )}
        </div>

        {/* Footer Info */}
        {!isMobile && (
          <>
            <Separator />
            <div className="flex items-center justify-between py-2 px-1 text-xs text-muted-foreground">
              <span>{t('pdfPreview.generatedOn', { date: new Date().toLocaleDateString() })}</span>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {t('pdfPreview.sectionsEnabled', { count: Object.values(pdfSettings.showElements).filter(Boolean).length })}
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
          fileName={`sale-order-${sale.saleNumber || sale.id}.pdf`}
          reportType="sale"
          reportNumber={sale.saleNumber || sale.id}
          reportTitle={sale.title || ''}
          customerName={sale.customer?.name || sale.customerName}
          totalAmount={sale.total != null ? formatCurrency(sale.total) : undefined}
          translationNs="sales"
        />

        {/* Share Link Dialog for WhatsApp/Facebook */}
        <ShareLinkDialog
          isOpen={sharePlatform !== null}
          onClose={() => setSharePlatform(null)}
          platform={sharePlatform}
          pdfDocument={pdfDocElement}
          fileName={`sale-order-${sale.saleNumber || sale.id}.pdf`}
          shareText={`${sale.title || t('pdf.saleOrder')} - ${sale.saleNumber || sale.id} - ${formatCurrency(sale.total ?? sale.totalAmount ?? sale.amount ?? 0)}`}
        />
      </DialogContent>
    </Dialog>
  );
}
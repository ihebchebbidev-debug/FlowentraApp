import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { PDFViewer } from '@react-pdf/renderer';
import { OfferPDFDocument, InstallationDetails } from '../components/OfferPDFDocument';
import { installationsApi } from '@/services/api/installationsApi';
import { defaultSettings, getCompanyLogoBase64 } from '../utils/pdfSettings.utils';
import { PdfSettingsService } from '../services/pdfSettings.service';
import { OffersService } from '../services/offers.service';
import { useCompanyLogo } from '@/hooks/useCompanyLogo';
import { useTranslation } from 'react-i18next';
import { useCurrency } from '@/shared/hooks/useCurrency';
import { Loader2 } from 'lucide-react';

export default function OfferReportPage() {
  const { id } = useParams<{ id: string }>();
  const { t, i18n } = useTranslation('offers');
  const { format: formatCurrency } = useCurrency();
  const companyLogo = useCompanyLogo();
  const [offer, setOffer] = useState<any>(null);
  const [pdfSettings, setPdfSettings] = useState(defaultSettings);
  const [installationsData, setInstallationsData] = useState<Record<string, InstallationDetails>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        setIsLoading(true);
        const [fetchedOffer, settings] = await Promise.all([
          OffersService.getOfferById(id),
          PdfSettingsService.loadSettingsAsync()
        ]);
        
        setOffer(fetchedOffer);
        const logoBase64 = await getCompanyLogoBase64(companyLogo);
        setPdfSettings({ ...settings, company: { ...settings.company, logo: logoBase64 || '' } });

        // Fetch installations if items have installationIds
        if (fetchedOffer?.items) {
          const installationIds = [...new Set(
            fetchedOffer.items
              .filter((item: any) => item.installationId)
              .map((item: any) => String(item.installationId))
          )] as string[];

          if (installationIds.length > 0) {
            const data: Record<string, InstallationDetails> = {};
            await Promise.all(installationIds.map(async (instId) => {
              try {
                const inst = await installationsApi.getById(instId);
                data[instId] = { 
                  name: inst.name, 
                  model: inst.model, 
                  serialNumber: inst.serialNumber, 
                  matricule: inst.matricule, 
                  manufacturer: inst.manufacturer,
                  siteAddress: inst.siteAddress 
                };
              } catch (error) {
                console.warn(`[OfferReportPage] Failed to fetch installation ${instId}:`, error);
              }
            }));
            setInstallationsData(data);
          }
        }
      } catch (error) {
        console.error("Error loading offer report data:", error);
        setPdfSettings(defaultSettings);
      } finally {
        setIsLoading(false);
      }
    };
    
    load();
  }, [id, companyLogo]);

  const pdfTranslations = useMemo(() => ({
    offer: t('pdf.offer'), offerNumber: t('pdf.offerNumber'), date: t('pdf.date'),
    client: t('pdf.client'), customerInformation: t('pdf.customerInformation'),
    offerDetails: t('pdf.offerDetails'), name: t('pdf.name', 'Name'),
    position: t('pdf.position'), email: t('pdf.email'), phone: t('pdf.phone'),
    address: t('pdf.address'), status: t('pdf.status'), created: t('pdf.created'),
    validUntil: t('pdf.validUntil'), assignedTo: t('pdf.assignedTo'),
    description: t('pdf.description'), offerItems: t('pdf.offerItems'),
    pos: t('pdf.pos'), qty: t('pdf.qty'), unit: t('pdf.unit'), total: t('pdf.total'),
    subtotal: t('pdf.subtotal'), tax: t('pdf.tax'), tva: t('pdf.tva', 'TVA'),
    discount: t('pdf.discount'), additionalNotes: t('pdf.additionalNotes'),
    thankYouMessage: t('pdf.thankYouMessage'),
    page: t('pdf.page', { current: '1', total: '1' }),
    taxId: t('pdf.taxId', 'Tax ID'), cin: t('pdf.cin', 'CIN'),
    installationInfo: t('pdf.installationInfo', 'Installation Information'),
    installationName: t('pdf.installationName', 'Name'),
    model: t('pdf.model', 'Model'), serialNumber: t('pdf.serialNumber', 'Serial Number'),
    matricule: t('pdf.matricule', 'Matricule'), manufacturer: t('pdf.manufacturer', 'Manufacturer'),
    fiscalStamp: t('pdf.fiscalStamp', 'Fiscal Stamp'),
    amountInWords: t('pdf.amountInWords', 'Amount in Words'),
    statusValue: t(`status.${offer?.status || 'draft'}`, { defaultValue: (offer?.status || 'draft') }),
  }), [t, offer?.status]);

  if (isLoading || !offer) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="h-screen w-full">
      <PDFViewer width="100%" height="100%" showToolbar={true}>
        <OfferPDFDocument
          offer={offer}
          formatCurrency={formatCurrency}
          settings={pdfSettings}
          translations={pdfTranslations}
          installationsData={installationsData}
          language={i18n.language}
          currencyCode={offer?.currency || 'TND'}
        />
      </PDFViewer>
    </div>
  );
}

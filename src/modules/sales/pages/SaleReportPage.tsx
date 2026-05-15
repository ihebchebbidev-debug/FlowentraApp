import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { PDFViewer } from '@react-pdf/renderer';
import { SalePDFDocument } from '../components/SalePDFDocument';
import { InstallationDetails } from '@/modules/offers/components/OfferPDFDocument';
import { installationsApi } from '@/services/api/installationsApi';
import { defaultSettings, getCompanyLogoBase64 } from '../utils/pdfSettings.utils';
import { PdfSettingsService } from '../services/pdfSettings.service';
import { SalesService } from '../services/sales.service';
import { useCompanyLogo } from '@/hooks/useCompanyLogo';
import { useTranslation } from 'react-i18next';
import { useCurrency } from '@/shared/hooks/useCurrency';
import { Loader2 } from 'lucide-react';

export default function SaleReportPage() {
  const { id } = useParams<{ id: string }>();
  const { t, i18n } = useTranslation('sales');
  const { format: formatCurrency } = useCurrency();
  const companyLogo = useCompanyLogo();
  const [sale, setSale] = useState<any>(null);
  const [pdfSettings, setPdfSettings] = useState(defaultSettings);
  const [installationsData, setInstallationsData] = useState<Record<string, InstallationDetails>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        setIsLoading(true);
        const [fetchedSale, settings] = await Promise.all([
          SalesService.getSaleById(id),
          PdfSettingsService.loadSettingsAsync()
        ]);
        
        setSale(fetchedSale);
        const logoBase64 = await getCompanyLogoBase64(companyLogo);
        setPdfSettings({ ...settings, company: { ...settings.company, logo: logoBase64 || '' } });

        // Fetch installations if items have installationIds
        if (fetchedSale?.items) {
          const installationIds = [...new Set(
            fetchedSale.items
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
                console.warn(`[SaleReportPage] Failed to fetch installation ${instId}:`, error);
              }
            }));
            setInstallationsData(data);
          }
        }
      } catch (error) {
        console.error("Error loading sale report data:", error);
        setPdfSettings(defaultSettings);
      } finally {
        setIsLoading(false);
      }
    };
    
    load();
  }, [id, companyLogo]);

  const pdfTranslations = useMemo(() => ({
    saleOrder: t('pdf.saleOrder', 'SALE'), saleNumber: t('pdf.saleNumber', 'Sale N°'),
    date: t('pdf.date', 'Date'), client: t('pdf.client', 'CLIENT'),
    customerInformation: t('pdf.customerInformation', 'Customer Information'),
    saleDetails: t('pdf.saleDetails', 'Sale Details'), name: t('pdf.name', 'Name'),
    position: t('pdf.position', 'Position'), email: t('pdf.email', 'Email'),
    phone: t('pdf.phone', 'Phone'), address: t('pdf.address', 'Address'),
    status: t('pdf.status', 'Status'), created: t('pdf.created', 'Created'),
    deliveryDate: t('pdf.deliveryDate', 'Delivery Date'),
    assignedTo: t('pdf.assignedTo', 'Assigned To'), description: t('pdf.description', 'Description'),
    saleItems: t('pdf.saleItems', 'Sale Items'),
    pos: t('pdf.pos', 'Pos'), qty: t('pdf.qty', 'Qty'), unit: t('pdf.unit', 'Unit'),
    total: t('pdf.total', 'Total'), subtotal: t('pdf.subtotal', 'Subtotal'),
    tax: t('pdf.tax', 'Tax'), tva: t('pdf.tva', 'TVA'), discount: t('pdf.discount', 'Discount'),
    additionalNotes: t('pdf.additionalNotes', 'Additional Notes'),
    thankYouMessage: t('pdf.thankYouMessage', 'Thank you for your business.'),
    page: t('pdf.page', { current: '1', total: '1', defaultValue: 'Page 1 / 1' }),
    taxId: t('pdf.taxId', 'Tax ID'), cin: t('pdf.cin', 'CIN'),
    installationInfo: t('pdf.installationInfo', 'Installation Information'),
    installationName: t('pdf.installationName', 'Name'),
    model: t('pdf.model', 'Model'), serialNumber: t('pdf.serialNumber', 'Serial Number'),
    matricule: t('pdf.matricule', 'Matricule'), manufacturer: t('pdf.manufacturer', 'Manufacturer'),
    fiscalStamp: t('pdf.fiscalStamp', 'Fiscal Stamp'),
    amountInWords: t('pdf.amountInWords', 'Amount in Words'),
    statusValue: t(`status.${sale?.status || 'draft'}`, { defaultValue: (sale?.status || 'draft') }),
  }), [t, sale?.status]);

  if (isLoading || !sale) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="h-screen w-full">
      <PDFViewer width="100%" height="100%" showToolbar={true}>
        <SalePDFDocument
          sale={sale}
          formatCurrency={formatCurrency}
          settings={pdfSettings}
          translations={pdfTranslations}
          installationsData={installationsData}
          language={i18n.language}
          currencyCode={sale?.currency || 'TND'}
        />
      </PDFViewer>
    </div>
  );
}

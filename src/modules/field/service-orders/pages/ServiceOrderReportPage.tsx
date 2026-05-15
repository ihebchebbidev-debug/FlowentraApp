import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { PDFViewer } from '@react-pdf/renderer';
import { ServiceOrderPDFDocument } from '../components/ServiceOrderPDFDocument';
import { defaultSettings, getCompanyLogoBase64 } from '../utils/pdfSettings.utils';
import { PdfSettingsService } from '../services/pdfSettings.service';
import { useCompanyLogo } from '@/hooks/useCompanyLogo';
import { useTranslation } from 'react-i18next';
import { useCurrency } from '@/shared/hooks/useCurrency';
import { Loader2 } from 'lucide-react';
import { serviceOrdersApi } from '@/services/api/serviceOrdersApi';

export default function ServiceOrderReportPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation('service_orders');
  const { format: formatCurrency } = useCurrency();
  const companyLogo = useCompanyLogo();
  const [pdfSettings, setPdfSettings] = useState(defaultSettings);
  const [serviceOrder, setServiceOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        const [settings, order] = await Promise.all([
          PdfSettingsService.loadSettingsAsync(),
          serviceOrdersApi.getById(Number(id!)),
        ]);
        const logoBase64 = await getCompanyLogoBase64(companyLogo);
        setPdfSettings({ ...settings, company: { ...settings.company, logo: logoBase64 || '' } });
        setServiceOrder(order);
      } catch {
        setPdfSettings(defaultSettings);
      } finally {
        setIsLoading(false);
      }
    };
    if (id) load();
  }, [id, companyLogo]);

  if (isLoading || !serviceOrder) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="h-screen w-full">
      <PDFViewer width="100%" height="100%" showToolbar={true}>
        <ServiceOrderPDFDocument
          serviceOrder={serviceOrder}
          formatCurrency={formatCurrency}
          settings={pdfSettings}
        />
      </PDFViewer>
    </div>
  );
}

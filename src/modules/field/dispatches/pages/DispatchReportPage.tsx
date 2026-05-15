import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { PDFViewer } from '@react-pdf/renderer';
import { DispatchPDFDocument } from '../components/DispatchPDFDocument';
import { defaultSettings, getCompanyLogoBase64 } from '../utils/pdfSettings.utils';
import { PdfSettingsService } from '../services/pdfSettings.service';
import { useCompanyLogo } from '@/hooks/useCompanyLogo';
import { useTranslation } from 'react-i18next';
import { useCurrency } from '@/shared/hooks/useCurrency';
import { Loader2 } from 'lucide-react';
import { dispatchesApi } from '@/services/api/dispatchesApi';

export default function DispatchReportPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation('dispatches');
  const { format: formatCurrency } = useCurrency();
  const companyLogo = useCompanyLogo();
  const [pdfSettings, setPdfSettings] = useState(defaultSettings);
  const [dispatch, setDispatch] = useState<any>(null);
  const [timeData, setTimeData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        const [settings, dispatchData] = await Promise.all([
          PdfSettingsService.loadSettingsAsync(),
          dispatchesApi.getById(Number(id!)),
        ]);
        const logoBase64 = await getCompanyLogoBase64(companyLogo);
        setPdfSettings({ ...settings, company: { ...settings.company, logo: logoBase64 || '' } });
        setDispatch(dispatchData);

        try {
          const time = await dispatchesApi.getTimeEntries(Number(id!));
          setTimeData(time);
        } catch {}
      } catch {
        setPdfSettings(defaultSettings);
      } finally {
        setIsLoading(false);
      }
    };
    if (id) load();
  }, [id, companyLogo]);

  if (isLoading || !dispatch) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="h-screen w-full">
      <PDFViewer width="100%" height="100%" showToolbar={true}>
        <DispatchPDFDocument
          dispatch={dispatch}
          customer={{}}
          installation={{}}
          timeData={timeData}
          formatCurrency={formatCurrency}
          settings={pdfSettings}
        />
      </PDFViewer>
    </div>
  );
}

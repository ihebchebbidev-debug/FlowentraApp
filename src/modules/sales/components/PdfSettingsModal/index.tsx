import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Settings, Star, Save, RotateCcw, Download, Upload, Type, Palette, FileText, Grid, Layers } from 'lucide-react';
import { usePdfSettings } from '../../hooks/usePdfSettings';
import { PdfSettings } from '../../utils/pdfSettings.utils';
import { TypographyTab } from './TypographyTab';
import { ColorsTab } from './ColorsTab';
import { LayoutTab } from './LayoutTab';
import { DataTab } from './DataTab';
import { AdvancedTab } from './AdvancedTab';
import { useTranslation } from 'react-i18next';

interface PdfSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: PdfSettings;
  onSettingsChange: (settings: PdfSettings) => void;
}

export function PdfSettingsModal({ isOpen, onClose, settings, onSettingsChange }: PdfSettingsModalProps) {
  const [activeTab, setActiveTab] = useState('typography');
  const { t } = useTranslation('sales');
  
  const {
    localSettings,
    setLocalSettings,
    updateSettings,
    handleSave,
    handleReset,
    handleExportSettings,
    handleImportSettings,
    applyColorTheme,
    isLoading,
  } = usePdfSettings(settings, onSettingsChange);

  const [logoSource, setLogoSource] = useState<'onboarding' | 'manual' | null>(null);

  useEffect(() => {
    setLocalSettings({ ...settings });
  }, [settings, setLocalSettings]);

  useEffect(() => {
    try {
      const onboardRaw = localStorage.getItem('user-onboarding-data');
      if (!onboardRaw) {
        setLogoSource(settings?.company?.logo ? 'manual' : null);
        return;
      }
      const onboard = JSON.parse(onboardRaw);
      const candidate = onboard?.companyInfo?.logo;
      if (candidate && typeof candidate === 'string' && settings?.company?.logo === candidate) {
        setLogoSource('onboarding');
      } else if (settings?.company?.logo) {
        setLogoSource('manual');
      } else {
        setLogoSource(null);
      }
    } catch (e) {
      setLogoSource(settings?.company?.logo ? 'manual' : null);
    }
  }, [settings]);

  const handleModalSave = () => {
    if (handleSave()) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Settings className="h-5 w-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-xl font-semibold">{t('pdfSettings.modalTitle', 'PDF Generation Settings')}</DialogTitle>
                <p className="text-sm text-muted-foreground">
                  {t('pdfSettings.modalDescription', 'Customize every aspect of your PDF documents')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="hidden sm:flex">
                <Star className="h-3 w-3 mr-1" />
                {t('pdfSettings.premiumFeatures', 'Premium Features')}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <div className="px-6 pt-4">
              <TabsList className="grid w-full grid-cols-5 h-auto gap-1">
                <TabsTrigger value="typography" className="flex flex-col items-center gap-1 h-16 sm:h-12">
                  <Type className="h-4 w-4" />
                  <span className="text-xs">{t('pdfSettings.tabTypography', 'Typography')}</span>
                </TabsTrigger>
                <TabsTrigger value="colors" className="flex flex-col items-center gap-1 h-16 sm:h-12">
                  <Palette className="h-4 w-4" />
                  <span className="text-xs">{t('pdfSettings.tabColors', 'Colors')}</span>
                </TabsTrigger>
                <TabsTrigger value="layout" className="flex flex-col items-center gap-1 h-16 sm:h-12">
                  <FileText className="h-4 w-4" />
                  <span className="text-xs">{t('pdfSettings.tabLayout', 'Layout')}</span>
                </TabsTrigger>
                <TabsTrigger value="data" className="flex flex-col items-center gap-1 h-16 sm:h-12">
                  <Grid className="h-4 w-4" />
                  <span className="text-xs">{t('pdfSettings.tabData', 'Data')}</span>
                </TabsTrigger>
                <TabsTrigger value="advanced" className="flex flex-col items-center gap-1 h-16 sm:h-12">
                  <Layers className="h-4 w-4" />
                  <span className="text-xs">{t('pdfSettings.tabAdvanced', 'Advanced')}</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <ScrollArea className="flex-1 px-6 max-h-[60vh]">
              <TabsContent value="typography">
                <TypographyTab settings={localSettings} updateSettings={updateSettings} />
              </TabsContent>
              <TabsContent value="colors">
                <ColorsTab settings={localSettings} updateSettings={updateSettings} applyColorTheme={applyColorTheme} />
              </TabsContent>
              <TabsContent value="layout">
                <LayoutTab settings={localSettings} updateSettings={updateSettings} />
              </TabsContent>
              <TabsContent value="data">
                <DataTab settings={localSettings} updateSettings={updateSettings} />
              </TabsContent>
              <TabsContent value="advanced">
                <AdvancedTab settings={localSettings} updateSettings={updateSettings} />
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </div>

        <div className="px-6 py-4 border-t bg-muted/30">
          <div className="flex flex-col sm:flex-row gap-3 justify-between">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleExportSettings} disabled={isLoading} className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                {t('pdfSettings.export', 'Export')}
              </Button>
              <Button variant="outline" size="sm" onClick={handleImportSettings} disabled={isLoading} className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                {t('pdfSettings.import', 'Import')}
              </Button>
              <Button variant="outline" size="sm" onClick={handleReset} disabled={isLoading} className="flex items-center gap-2 text-destructive hover:text-destructive">
                <RotateCcw className="h-4 w-4" />
                {t('pdfSettings.resetToDefaults', 'Reset All')}
              </Button>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose} disabled={isLoading}>
                {t('pdfSettings.cancel', 'Cancel')}
              </Button>
              <Button onClick={handleModalSave} disabled={isLoading} className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                {t('pdfSettings.saveAndClose', 'Save & Close')}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

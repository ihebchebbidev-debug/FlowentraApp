import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { DataTab } from './DataTab';
import { LayoutTab } from './LayoutTab';
import { ColorsTab } from './ColorsTab';
import { TypographyTab } from './TypographyTab';
import { AdvancedTab } from './AdvancedTab';
import { usePdfSettings } from '../../hooks/usePdfSettings';
import { PdfSettings } from '../../utils/pdfSettings.utils';
import { useTranslation } from 'react-i18next';
import { 
  Database, 
  Layout, 
  Palette, 
  Type, 
  Settings,
  RotateCcw,
  Save,
  Upload,
  Download
} from 'lucide-react';

interface PdfSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: PdfSettings;
  onSettingsChange: (settings: PdfSettings) => void;
}

export function PdfSettingsModal({ isOpen, onClose, settings, onSettingsChange }: PdfSettingsModalProps) {
  const [activeTab, setActiveTab] = useState('data');
  const { t } = useTranslation('offers');

  const {
    localSettings,
    updateSettings,
    handleSave,
    handleReset,
    handleExportSettings,
    handleImportSettings,
    applyColorTheme,
    isLoading
  } = usePdfSettings(settings, onSettingsChange);

  const tabs = [
    { id: 'data', label: t('pdfSettings.tabData', 'Data'), icon: Database, component: DataTab },
    { id: 'layout', label: t('pdfSettings.tabLayout', 'Layout'), icon: Layout, component: LayoutTab },
    { id: 'colors', label: t('pdfSettings.tabColors', 'Colors'), icon: Palette, component: ColorsTab },
    { id: 'typography', label: t('pdfSettings.tabTypography', 'Typography'), icon: Type, component: TypographyTab },
    { id: 'advanced', label: t('pdfSettings.tabAdvanced', 'Advanced'), icon: Settings, component: AdvancedTab },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[85vh] flex flex-col">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <DialogTitle className="text-xl font-semibold">{t('pdfSettings.modalTitle', 'PDF Generation Settings')}</DialogTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {t('pdfSettings.modalDescription', 'Customize the appearance and content of your quote PDFs')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleImportSettings}
              disabled={isLoading}
            >
              <Upload className="h-4 w-4 mr-1" />
              {t('pdfSettings.import', 'Import')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportSettings}
              disabled={isLoading}
            >
              <Download className="h-4 w-4 mr-1" />
              {t('pdfSettings.export', 'Export')}
            </Button>
          </div>
        </DialogHeader>

        <Separator />

        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-5 mb-4">
              {tabs.map(({ id, label, icon: Icon }) => (
                <TabsTrigger key={id} value={id} className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{label}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            <div className="flex-1 overflow-y-auto">
              {tabs.map(({ id, component: Component }) => (
                <TabsContent key={id} value={id} className="h-full space-y-6 mt-0">
                  <Component
                    settings={localSettings}
                    onSettingsChange={updateSettings}
                    applyColorTheme={applyColorTheme}
                  />
                </TabsContent>
              ))}
            </div>
          </Tabs>
        </div>

        <Separator />

        <div className="flex items-center justify-between pt-4">
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            {t('pdfSettings.resetToDefaults', 'Reset to Defaults')}
          </Button>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onClose}>
              {t('pdfSettings.cancel', 'Cancel')}
            </Button>
            <Button 
              onClick={() => {
                if (handleSave()) {
                  onClose();
                }
              }}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {t('pdfSettings.saveAndClose', 'Save & Close')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

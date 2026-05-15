import { useState, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { PdfSettings, updateNestedObject, colorThemes } from '../utils/pdfSettings.utils';
import { PdfSettingsService } from '../services/pdfSettings.service';

export const usePdfSettings = (initialSettings: PdfSettings, onSettingsChange: (settings: PdfSettings) => void) => {
  const [localSettings, setLocalSettings] = useState<PdfSettings>(initialSettings);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoadedFromBackend, setHasLoadedFromBackend] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation('sales');

  useEffect(() => {
    if (!hasLoadedFromBackend) {
      setHasLoadedFromBackend(true);
      PdfSettingsService.loadSettingsAsync()
        .then((settings) => {
          setLocalSettings(settings);
          onSettingsChange(settings);
        })
        .catch(() => {});
    }
  }, [hasLoadedFromBackend, onSettingsChange]);

  const updateSettings = useCallback((path: string, value: any) => {
    setLocalSettings(prev => {
      const updated = updateNestedObject(prev, path, value);
      onSettingsChange(updated);
      PdfSettingsService.saveSettings(updated);
      return updated;
    });
  }, [onSettingsChange]);

  const handleSave = useCallback(() => {
    try {
      PdfSettingsService.saveSettings(localSettings);
      toast({ title: t('pdfSettings.saveSuccess', 'Settings Saved'), description: t('pdfSettings.saveSuccess', 'Your PDF preferences have been saved and synced.') });
      return true;
    } catch (error) {
      toast({ title: t('pdfSettings.saveFailed', 'Save Failed'), description: t('pdfSettings.saveFailed', 'Failed to save PDF settings. Please try again.'), variant: "destructive" });
      return false;
    }
  }, [localSettings, toast, t]);

  const handleReset = useCallback(async () => {
    try {
      setIsLoading(true);
      const resetSettings = await PdfSettingsService.resetSettingsAsync();
      setLocalSettings(resetSettings);
      onSettingsChange(resetSettings);
      toast({ title: t('pdfSettings.resetSuccess', 'Settings Reset'), description: t('pdfSettings.resetSuccess', 'All settings have been reset to default values.') });
    } catch (error) {
      toast({ title: t('pdfSettings.resetFailed', 'Reset Failed'), description: t('pdfSettings.resetFailed', 'Failed to reset settings. Please try again.'), variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [onSettingsChange, toast, t]);

  const handleExportSettings = useCallback(() => {
    try {
      PdfSettingsService.exportSettings(localSettings);
      toast({ title: t('pdfSettings.exportSuccess', 'Settings Exported'), description: t('pdfSettings.exportSuccess', 'Settings have been exported successfully.') });
    } catch (error) {
      toast({ title: t('pdfSettings.exportFailed', 'Export Failed'), description: t('pdfSettings.exportFailed', 'Failed to export settings. Please try again.'), variant: "destructive" });
    }
  }, [localSettings, toast, t]);

  const handleImportSettings = useCallback(() => {
    const input = PdfSettingsService.createFileInput();
    input.onchange = async (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (file) {
        try {
          setIsLoading(true);
          const imported = await PdfSettingsService.importSettings(file);
          setLocalSettings(imported);
          onSettingsChange(imported);
          toast({ title: t('pdfSettings.importSuccess', 'Settings Imported'), description: t('pdfSettings.importSuccess', 'Settings have been imported and synced successfully.') });
        } catch (error) {
          toast({ title: t('pdfSettings.importFailed', 'Import Failed'), description: error instanceof Error ? error.message : t('pdfSettings.importFailed', 'Failed to import settings file.'), variant: "destructive" });
        } finally {
          setIsLoading(false);
        }
      }
    };
    document.body.appendChild(input);
    input.click();
    document.body.removeChild(input);
  }, [onSettingsChange, toast, t]);

  const applyColorTheme = useCallback((theme: typeof colorThemes[0]) => {
    const updatedSettings = updateNestedObject(localSettings, 'colors', {
      ...localSettings.colors,
      primary: theme.primary,
      secondary: theme.secondary,
      accent: theme.accent,
    });
    setLocalSettings(updatedSettings);
    onSettingsChange(updatedSettings);
    PdfSettingsService.saveSettings(updatedSettings);
    toast({ title: t('pdfSettings.themeApplied', { name: theme.name, defaultValue: `${theme.name} theme has been applied.` }) });
  }, [localSettings, onSettingsChange, toast, t]);

  const refreshFromBackend = useCallback(async () => {
    try {
      setIsLoading(true);
      const settings = await PdfSettingsService.refreshFromBackend();
      setLocalSettings(settings);
      onSettingsChange(settings);
      toast({ title: t('pdfSettings.refreshSuccess', 'Settings Refreshed'), description: t('pdfSettings.refreshSuccess', 'Settings refreshed from cloud.') });
    } catch (error) {
      toast({ title: t('pdfSettings.refreshFailed', 'Refresh Failed'), description: t('pdfSettings.refreshFailed', 'Failed to refresh settings from cloud.'), variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [onSettingsChange, toast, t]);

  return {
    localSettings,
    setLocalSettings,
    updateSettings,
    handleSave,
    handleReset,
    handleExportSettings,
    handleImportSettings,
    applyColorTheme,
    refreshFromBackend,
    isLoading,
  };
};

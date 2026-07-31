import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { PdfSettings, updateNestedObject, colorThemes } from '../utils/pdfSettings.utils';
import { PdfSettingsService } from '../services/pdfSettings.service';

export const usePdfSettings = (initialSettings: PdfSettings, onSettingsChange: (settings: PdfSettings) => void) => {
  const { t } = useTranslation();
  const [localSettings, setLocalSettings] = useState<PdfSettings>(initialSettings);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoadedFromBackend, setHasLoadedFromBackend] = useState(false);

  // Load settings from backend on mount
  useEffect(() => {
    if (!hasLoadedFromBackend) {
      setHasLoadedFromBackend(true);
      PdfSettingsService.loadSettingsAsync()
        .then((settings) => {
          setLocalSettings(settings);
          onSettingsChange(settings);
        })
        .catch(() => {
          // Keep initial settings on error
        });
    }
  }, [hasLoadedFromBackend, onSettingsChange]);

  const updateSettings = useCallback((path: string, value: any) => {
    setLocalSettings(prev => {
      const updated = updateNestedObject(prev, path, value);
      
      // Immediately update parent component for real-time preview
      onSettingsChange(updated);
      PdfSettingsService.saveSettings(updated);
      
      return updated;
    });
  }, [onSettingsChange, t]);

  const handleSave = useCallback(() => {
    try {
      PdfSettingsService.saveSettings(localSettings);
      toast.success(t('dispatches.pdfSettings.saved'));
      return true;
    } catch (error) {
      toast.error(t('dispatches.pdfSettings.save_error'));
      return false;
    }
  }, [localSettings, t]);

  const handleReset = useCallback(async () => {
    try {
      setIsLoading(true);
      const resetSettings = await PdfSettingsService.resetSettingsAsync();
      setLocalSettings(resetSettings);
      onSettingsChange(resetSettings);
      toast.success(t('dispatches.pdfSettings.reset'));
    } catch (error) {
      toast.error(t('dispatches.pdfSettings.reset_error'));
    } finally {
      setIsLoading(false);
    }
  }, [onSettingsChange, t]);

  const handleExportSettings = useCallback(() => {
    try {
      PdfSettingsService.exportSettings(localSettings);
      toast.success(t('dispatches.pdfSettings.exported'));
    } catch (error) {
      toast.error(t('dispatches.pdfSettings.export_error'));
    }
  }, [localSettings, t]);

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
          toast.success(t('dispatches.pdfSettings.imported'));
        } catch (error) {
          toast.error(error instanceof Error ? error.message : t('dispatches.pdfSettings.import_error'));
        } finally {
          setIsLoading(false);
        }
      }
    };
    
    document.body.appendChild(input);
    input.click();
    document.body.removeChild(input);
  }, [onSettingsChange, t]);

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
    
    toast.success(t('dispatches.pdfSettings.theme_applied', { theme: theme.name }));
  }, [localSettings, onSettingsChange, t]);

  const refreshFromBackend = useCallback(async () => {
    try {
      setIsLoading(true);
      const settings = await PdfSettingsService.refreshFromBackend();
      setLocalSettings(settings);
      onSettingsChange(settings);
      toast.success(t('dispatches.pdfSettings.refreshed'));
    } catch (error) {
      toast.error(t('dispatches.pdfSettings.refresh_error'));
    } finally {
      setIsLoading(false);
    }
  }, [onSettingsChange, t]);

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

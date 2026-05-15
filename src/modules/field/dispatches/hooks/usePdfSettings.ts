import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { PdfSettings, updateNestedObject, colorThemes } from '../utils/pdfSettings.utils';
import { PdfSettingsService } from '../services/pdfSettings.service';

export const usePdfSettings = (initialSettings: PdfSettings, onSettingsChange: (settings: PdfSettings) => void) => {
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
  }, [onSettingsChange]);

  const handleSave = useCallback(() => {
    try {
      PdfSettingsService.saveSettings(localSettings);
      toast.success("PDF settings saved successfully");
      return true;
    } catch (error) {
      toast.error("Failed to save PDF settings. Please try again.");
      return false;
    }
  }, [localSettings]);

  const handleReset = useCallback(async () => {
    try {
      setIsLoading(true);
      const resetSettings = await PdfSettingsService.resetSettingsAsync();
      setLocalSettings(resetSettings);
      onSettingsChange(resetSettings);
      toast.success("All settings have been reset to default values");
    } catch (error) {
      toast.error("Failed to reset settings. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [onSettingsChange]);

  const handleExportSettings = useCallback(() => {
    try {
      PdfSettingsService.exportSettings(localSettings);
      toast.success("Settings have been exported successfully");
    } catch (error) {
      toast.error("Failed to export settings. Please try again.");
    }
  }, [localSettings]);

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
          toast.success("Settings have been imported and synced successfully");
        } catch (error) {
          toast.error(error instanceof Error ? error.message : "Failed to import settings file");
        } finally {
          setIsLoading(false);
        }
      }
    };
    
    document.body.appendChild(input);
    input.click();
    document.body.removeChild(input);
  }, [onSettingsChange]);

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
    
    toast.success(`${theme.name} theme has been applied`);
  }, [localSettings, onSettingsChange]);

  const refreshFromBackend = useCallback(async () => {
    try {
      setIsLoading(true);
      const settings = await PdfSettingsService.refreshFromBackend();
      setLocalSettings(settings);
      onSettingsChange(settings);
      toast.success("Settings refreshed from cloud");
    } catch (error) {
      toast.error("Failed to refresh settings");
    } finally {
      setIsLoading(false);
    }
  }, [onSettingsChange]);

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

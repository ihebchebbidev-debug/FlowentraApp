import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTheme } from "@/hooks/useTheme";
import { usePreferences } from "@/hooks/usePreferences";
import { usePermissions } from "@/hooks/usePermissions";
import { Palette, Sun, Moon, Monitor, Sidebar, Layout, Table, List, Loader2, Check, CheckCircle2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ToastAction } from "@/components/ui/toast";
import { toast } from "@/hooks/use-toast";
import i18n from "@/lib/i18n";
import { Button } from "@/components/ui/button";

const languages = [
  { code: 'en', name: 'English' },
  { code: 'fr', name: 'Français' }
];

const primaryColors = [
  { value: 'blue', name: 'Blue', color: 'bg-blue-500' },
  { value: 'red', name: 'Red', color: 'bg-red-500' },
  { value: 'green', name: 'Green', color: 'bg-green-500' },
  { value: 'purple', name: 'Purple', color: 'bg-purple-500' },
  { value: 'orange', name: 'Orange', color: 'bg-orange-500' },
  { value: 'indigo', name: 'Indigo', color: 'bg-indigo-500' }
];

const layoutModes = [
  { value: 'sidebar', labelKey: 'preferences.layout.sidebar', descKey: 'preferences.layout.sidebarDesc', icon: Sidebar },
  { value: 'topbar', labelKey: 'preferences.layout.topbar', descKey: 'preferences.layout.topbarDesc', icon: Layout }
] as const;

const dataViews = [
  { value: 'table', labelKey: 'preferences.dataView.table', descKey: 'preferences.dataView.tableDesc', icon: Table },
  { value: 'list', labelKey: 'preferences.dataView.list', descKey: 'preferences.dataView.listDesc', icon: List }
] as const;

const themes = [
  { value: 'light', labelKey: 'preferences.theme.light', icon: Sun },
  { value: 'dark', labelKey: 'preferences.theme.dark', icon: Moon },
  { value: 'system', labelKey: 'preferences.theme.system', icon: Monitor }
] as const;

type AutoSaveStatus = 'idle' | 'saving' | 'saved';

export function UserPreferencesTab() {
  const { t } = useTranslation('settings');
  const { preferences, updatePreferences, applyColorTheme } = usePreferences();
  const { setTheme } = useTheme();
  const { hasPermission, isMainAdmin } = usePermissions();

  const canEditSettings = isMainAdmin || hasPermission('settings', 'update');

  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const [formData, setFormData] = useState({
    theme: 'system' as 'light' | 'dark' | 'system',
    language: 'en',
    primaryColor: 'blue',
    layoutMode: 'sidebar' as 'sidebar' | 'topbar',
    dataView: 'table' as 'table' | 'list'
  });

  const [originalData, setOriginalData] = useState(formData);
  const [initialized, setInitialized] = useState(false);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const savedIndicatorTimerRef = useRef<ReturnType<typeof setTimeout>>();

  // Initialize form with current preferences ONLY on first load
  useEffect(() => {
    if (!initialized) {
      const userData = localStorage.getItem('user_data');
      if (userData) {
        try {
          const user = JSON.parse(userData);
          if (user.preferences) {
            const prefs = typeof user.preferences === 'string'
              ? JSON.parse(user.preferences)
              : user.preferences;
            const initialData = {
              theme: prefs.theme || 'system',
              language: prefs.language || 'en',
              primaryColor: prefs.primaryColor || 'blue',
              layoutMode: prefs.layoutMode || 'sidebar',
              dataView: prefs.dataView || 'table'
            };
            setFormData(initialData);
            setOriginalData(initialData);
            setInitialized(true);
            return;
          }
        } catch (error) {
          console.error('Error parsing user preferences from user_data:', error);
        }
      }

      if (preferences && Object.keys(preferences).length > 0) {
        const initialData = {
          theme: (preferences.theme as 'light' | 'dark' | 'system') || 'system',
          language: preferences.language || 'en',
          primaryColor: preferences.primaryColor || 'blue',
          layoutMode: (preferences.layoutMode as 'sidebar' | 'topbar') || 'sidebar',
          dataView: (preferences.dataView as 'table' | 'list') || 'table'
        };
        setFormData(initialData);
        setOriginalData(initialData);
        setInitialized(true);
        return;
      }

      const localPrefs = localStorage.getItem('user-preferences');
      if (localPrefs) {
        try {
          const prefs = JSON.parse(localPrefs);
          const initialData = {
            theme: prefs.theme || 'system',
            language: prefs.language || 'en',
            primaryColor: prefs.primaryColor || 'blue',
            layoutMode: prefs.layoutMode || 'sidebar',
            dataView: prefs.dataView || 'table'
          };
          setFormData(initialData);
          setOriginalData(initialData);
          setInitialized(true);
        } catch (error) {
          console.error('Error parsing local preferences:', error);
        }
      }
    }
  }, [preferences, initialized]);

  const handleSave = async () => {
    if (!canEditSettings) return;
    setIsSaving(true);
    try {
      console.log('[UserPreferencesTab] Saving preferences:', formData);
      await updatePreferences(formData);

      // Apply theme and color
      setTheme(formData.theme);
      applyColorTheme(formData.primaryColor);

      // Apply Language
      if (formData.language && i18n.language !== formData.language) {
        i18n.changeLanguage(formData.language);
        localStorage.setItem('language', formData.language);

        // Ensure language is persisted across reloads by syncing local storage
        try {
          const stored = localStorage.getItem('user-preferences');
          const prefs = stored ? JSON.parse(stored) : {};
          prefs.language = formData.language;
          localStorage.setItem('user-preferences', JSON.stringify(prefs));
        } catch (e) {
          // ignore
        }

        // Also update user_data.preferences if present so reloads that prefer
        // user_data don't overwrite the selected language.
        try {
          const ud = localStorage.getItem('user_data');
          if (ud) {
            const user = JSON.parse(ud);
            const existingPrefs = user.preferences ? (typeof user.preferences === 'string' ? JSON.parse(user.preferences) : user.preferences) : {};
            existingPrefs.language = formData.language;
            user.preferences = JSON.stringify(existingPrefs);
            localStorage.setItem('user_data', JSON.stringify(user));
          }
        } catch (e) {
          // ignore
        }
      }

      setOriginalData(formData);
      setLastSaved(new Date());
      toast({
        title: t('preferences.saved', 'Saved successfully'),
        description: t('preferences.savedDesc', 'Your preferences have been applied.'),
      });
    } catch (error: any) {
      console.error('[UserPreferencesTab] Save error:', error);
      toast({
        title: t('account.preferencesUpdateFailed'),
        description: error.message,
        variant: "destructive",
        action: <ToastAction altText="Try again" onClick={handleSave}>Try again</ToastAction>
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  // Has unsaved changes?
  const hasChanges = JSON.stringify(formData) !== JSON.stringify(originalData);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Appearance Card */}
      <Card className="shadow-card border-0 bg-card">
        <CardHeader className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
                <Palette className="h-4 w-4 text-primary" />
                {t('preferences.appearanceTitle')}
              </CardTitle>
              <CardDescription className="text-xs">
                {t('preferences.appearanceDesc')}
              </CardDescription>
            </div>
            {lastSaved && (
              <span className="text-xs text-muted-foreground mr-4">
                {t('preferences.lastSaved', 'Last saved at')} {lastSaved.toLocaleTimeString()}
              </span>
            )}
            <Button
              onClick={handleSave}
              disabled={!canEditSettings || !hasChanges || isSaving}
              className="gradient-primary"
            >
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('preferences.saveChanges', 'Save Preferences')}
            </Button>
          </div>
        </CardHeader>
        <CardContent className={`p-4 sm:p-6 space-y-6 ${!canEditSettings ? 'opacity-75 pointer-events-none' : ''}`}>
          {/* Theme */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">{t('preferences.themeLabel')}</Label>
            <RadioGroup
              value={formData.theme}
              onValueChange={(value: 'light' | 'dark' | 'system') => handleChange('theme', value)}
              className="grid grid-cols-3 gap-3"
              disabled={!canEditSettings}
            >
              {themes.map(theme => {
                const IconComponent = theme.icon;
                const isSelected = formData.theme === theme.value;
                return (
                  <div key={theme.value} className="relative">
                    <RadioGroupItem value={theme.value} id={`theme-${theme.value}`} className="peer sr-only" disabled={!canEditSettings} />
                    <Label
                      htmlFor={`theme-${theme.value}`}
                      className={`flex flex-col items-center justify-center p-3 border-2 rounded-xl transition-all ${isSelected ? 'border-primary bg-primary/10' : ''} ${!canEditSettings ? 'cursor-not-allowed' : 'cursor-pointer hover:border-primary/50 hover:bg-primary/5'}`}
                    >
                      <IconComponent className={`h-5 w-5 mb-1 ${isSelected ? 'text-primary' : ''}`} />
                      <span className={`text-sm font-medium ${isSelected ? 'text-primary' : ''}`}>{t(theme.labelKey)}</span>
                    </Label>
                    {isSelected && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                        <Check className="h-3 w-3 text-primary-foreground" />
                      </div>
                    )}
                  </div>
                );
              })}
            </RadioGroup>
          </div>

          {/* Primary Color */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">{t('preferences.primaryColorLabel')}</Label>
            <RadioGroup
              value={formData.primaryColor}
              onValueChange={(value: string) => handleChange('primaryColor', value)}
              className="flex flex-wrap gap-3"
              disabled={!canEditSettings}
            >
              {primaryColors.map(color => (
                <div key={color.value}>
                  <RadioGroupItem value={color.value} id={`color-${color.value}`} className="peer sr-only" disabled={!canEditSettings} />
                  <Label
                    htmlFor={`color-${color.value}`}
                    className={`block ${!canEditSettings ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <div className={`w-10 h-10 rounded-full ${color.color} ring-2 ring-offset-2 ring-offset-background transition-all ${formData.primaryColor === color.value ? 'ring-primary scale-110' : 'ring-transparent'} ${canEditSettings ? 'hover:ring-muted-foreground/30' : ''}`} />
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Language */}
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">{t('preferences.languageLabel')}</Label>
              <p className="text-sm text-muted-foreground">
                {t('preferences.languageDesc')}
              </p>
            </div>
            <Select value={formData.language} onValueChange={value => handleChange('language', value)} disabled={!canEditSettings}>
              <SelectTrigger className={`w-[160px] bg-background ${!canEditSettings ? 'cursor-not-allowed' : ''}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover border shadow-lg z-50">
                {languages.map(lang => (
                  <SelectItem key={lang.code} value={lang.code}>{lang.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Layout Card */}
      <Card className="shadow-card border-0 bg-card">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
            <Layout className="h-4 w-4 text-primary" />
            {t('preferences.layoutTitle')}
          </CardTitle>
          <CardDescription className="text-xs">
            {t('preferences.layoutDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent className={`p-4 sm:p-6 space-y-6 ${!canEditSettings ? 'opacity-75 pointer-events-none' : ''}`}>
          {/* Layout Mode */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">{t('preferences.navigationStyleLabel')}</Label>
            <RadioGroup
              value={formData.layoutMode}
              onValueChange={(value: 'sidebar' | 'topbar') => handleChange('layoutMode', value)}
              className="grid grid-cols-2 gap-3"
              disabled={!canEditSettings}
            >
              {layoutModes.map(layout => {
                const IconComponent = layout.icon;
                const isSelected = formData.layoutMode === layout.value;
                return (
                  <div key={layout.value} className="relative">
                    <RadioGroupItem value={layout.value} id={`layout-${layout.value}`} className="peer sr-only" disabled={!canEditSettings} />
                    <Label
                      htmlFor={`layout-${layout.value}`}
                      className={`flex items-center gap-3 p-4 border-2 rounded-xl transition-all ${isSelected ? 'border-primary bg-primary/10' : ''} ${!canEditSettings ? 'cursor-not-allowed' : 'cursor-pointer hover:border-primary/50 hover:bg-primary/5'}`}
                    >
                      <IconComponent className={`h-5 w-5 ${isSelected ? 'text-primary' : ''}`} />
                      <div>
                        <span className={`font-medium block ${isSelected ? 'text-primary' : ''}`}>{t(layout.labelKey)}</span>
                        <span className="text-xs text-muted-foreground">{t(layout.descKey)}</span>
                      </div>
                    </Label>
                    {isSelected && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                        <Check className="h-3 w-3 text-primary-foreground" />
                      </div>
                    )}
                  </div>
                );
              })}
            </RadioGroup>
          </div>

          {/* Data View */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">{t('preferences.dataViewLabel')}</Label>
            <RadioGroup
              value={formData.dataView}
              onValueChange={(value: 'table' | 'list') => handleChange('dataView', value)}
              className="grid grid-cols-2 gap-3"
              disabled={!canEditSettings}
            >
              {dataViews.map(view => {
                const IconComponent = view.icon;
                const isSelected = formData.dataView === view.value;
                return (
                  <div key={view.value} className="relative">
                    <RadioGroupItem value={view.value} id={`view-${view.value}`} className="peer sr-only" disabled={!canEditSettings} />
                    <Label
                      htmlFor={`view-${view.value}`}
                      className={`flex items-center gap-3 p-4 border-2 rounded-xl transition-all ${isSelected ? 'border-primary bg-primary/10' : ''} ${!canEditSettings ? 'cursor-not-allowed' : 'cursor-pointer hover:border-primary/50 hover:bg-primary/5'}`}
                    >
                      <IconComponent className={`h-5 w-5 ${isSelected ? 'text-primary' : ''}`} />
                      <div>
                        <span className={`font-medium block ${isSelected ? 'text-primary' : ''}`}>{t(view.labelKey)}</span>
                        <span className="text-xs text-muted-foreground">{t(view.descKey)}</span>
                      </div>
                    </Label>
                    {isSelected && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                        <Check className="h-3 w-3 text-primary-foreground" />
                      </div>
                    )}
                  </div>
                );
              })}
            </RadioGroup>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

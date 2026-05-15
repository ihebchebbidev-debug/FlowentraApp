
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { LanguageToggle } from "@/components/ui/language-toggle";
import { ColorPicker } from "@/components/ui/color-picker";
import { usePreferences } from "@/hooks/usePreferences";
import { Palette, Bell, Globe } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useToast } from "@/hooks/use-toast";

export function Preferences() {
  const { t } = useTranslation('settings');
  const { preferences, updatePreferences, loading } = usePreferences();
  const { toast } = useToast();

  // Map color names to hex values for the color picker
  const colorToHex = {
    blue: '#3b82f6',
    red: '#ef4444',
    green: '#10b981',
    purple: '#8b5cf6',
    orange: '#f97316',
    indigo: '#6366f1'
  };

  // Map hex values back to color names
  const hexToColor = {
    '#3b82f6': 'blue',
    '#ef4444': 'red',
    '#10b981': 'green',
    '#8b5cf6': 'purple',
    '#f97316': 'orange',
    '#6366f1': 'indigo'
  };

  const handleColorChange = async (hexColor: string) => {
    try {
      // Convert hex to color name if it's a preset, otherwise use hex directly
      const colorName = hexToColor[hexColor as keyof typeof hexToColor] || hexColor;
      
      await updatePreferences({ primaryColor: colorName });
      
      toast({
        title: t('preferences.colorUpdatedTitle'),
        description: t('preferences.colorUpdatedDesc'),
      });
    } catch (error) {
      console.error('Failed to update primary color:', error);
      toast({
        title: t('preferences.colorUpdateFailedTitle'),
        description: t('preferences.colorUpdateFailedDesc'),
        variant: "destructive"
      });
    }
  };

  const handleColorReset = async () => {
    try {
      await updatePreferences({ primaryColor: 'blue' });
      
      toast({
        title: t('preferences.colorResetTitle'),
        description: t('preferences.colorResetDesc'),
      });
    } catch (error) {
      console.error('Failed to reset primary color:', error);
      toast({
        title: t('preferences.colorUpdateFailedTitle'),
        description: t('preferences.colorUpdateFailedDesc'),
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Appearance Settings */}
      <Card className="shadow-card border-0 bg-card">
        <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-lg sm:text-xl font-semibold text-foreground flex items-center gap-2">
            <div className="p-2 rounded-lg bg-chart-6/10">
              <Palette className="h-4 w-4 sm:h-5 sm:w-5 text-chart-6" />
            </div>
            {t('preferences.appearanceTitle')}
          </CardTitle>
          <CardDescription>{t('preferences.appearanceDesc')}</CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">{t('preferences.themeLabel')}</Label>
              <p className="text-sm text-muted-foreground">{t('preferences.themeDesc')}</p>
            </div>
            <ThemeToggle />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">{t('preferences.primaryColorLabel')}</Label>
              <p className="text-sm text-muted-foreground">{t('preferences.primaryColorDesc')}</p>
            </div>
            <ColorPicker
              value={colorToHex[preferences?.primaryColor as keyof typeof colorToHex] || '#6366f1'}
              onChange={handleColorChange}
              onReset={handleColorReset}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">{t('preferences.languageLabel')}</Label>
              <p className="text-sm text-muted-foreground">{t('preferences.languageDesc')}</p>
            </div>
            <LanguageToggle />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">{t('preferences.compactModeLabel')}</Label>
              <p className="text-sm text-muted-foreground">{t('preferences.compactModeDesc')}</p>
            </div>
            <Switch />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">{t('preferences.sidebarCollapseLabel')}</Label>
              <p className="text-sm text-muted-foreground">{t('preferences.sidebarCollapseDesc')}</p>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card className="shadow-card border-0 bg-card">
        <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-lg sm:text-xl font-semibold text-foreground flex items-center gap-2">
            <div className="p-2 rounded-lg bg-chart-1/10">
              <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-chart-1" />
            </div>
            {t('preferences.notificationTitle')}
          </CardTitle>
          <CardDescription>{t('preferences.notificationDesc')}</CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">{t('preferences.emailNotifications')}</Label>
              <p className="text-sm text-muted-foreground">{t('preferences.emailNotificationsDesc')}</p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">{t('preferences.browserNotifications')}</Label>
              <p className="text-sm text-muted-foreground">{t('preferences.browserNotificationsDesc')}</p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">{t('preferences.taskReminders')}</Label>
              <p className="text-sm text-muted-foreground">{t('preferences.taskRemindersDesc')}</p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">{t('preferences.dealUpdates')}</Label>
              <p className="text-sm text-muted-foreground">{t('preferences.dealUpdatesDesc')}</p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">{t('preferences.weeklyReports')}</Label>
              <p className="text-sm text-muted-foreground">{t('preferences.weeklyReportsDesc')}</p>
            </div>
            <Switch />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

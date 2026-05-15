import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Palette, Zap } from 'lucide-react';
import { PdfSettings, colorThemes } from '../../utils/pdfSettings.utils';
import { useTranslation } from 'react-i18next';

interface ColorsTabProps {
  settings: PdfSettings;
  updateSettings: (path: string, value: any) => void;
  applyColorTheme: (theme: typeof colorThemes[0]) => void;
}

export function ColorsTab({ settings, updateSettings, applyColorTheme }: ColorsTabProps) {
  const { t } = useTranslation('sales');

  return (
    <div className="mt-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-4 w-4 text-primary" />
            {t('pdfSettings.colorPalette', 'Color Palette')}
          </CardTitle>
          <CardDescription>{t('pdfSettings.colorPaletteDescription', "Create your brand's visual identity")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(settings.colors).filter(([key]) => key !== 'gradient').map(([key, value]) => (
              <div key={key} className="space-y-2">
                <Label htmlFor={key} className="capitalize flex items-center gap-2">
                  <div className="w-4 h-4 rounded border" style={{ backgroundColor: value }} />
                  {key}
                </Label>
                <Input id={key} type="color" value={value} onChange={(e) => updateSettings(`colors.${key}`, e.target.value)} className="h-10 w-full cursor-pointer" />
              </div>
            ))}
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              <Label className="font-medium">{t('pdfSettings.quickColorThemes', 'Quick Color Themes')}</Label>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {colorThemes.map((theme) => (
                <Button key={theme.name} variant="outline" size="sm" onClick={() => applyColorTheme(theme)} className="flex items-center justify-between p-3 h-auto">
                  <span className="text-sm font-medium">{theme.name}</span>
                  <div className="flex gap-1">
                    <div className="w-3 h-3 rounded-full border" style={{ backgroundColor: theme.primary }} />
                    <div className="w-3 h-3 rounded-full border" style={{ backgroundColor: theme.secondary }} />
                    <div className="w-3 h-3 rounded-full border" style={{ backgroundColor: theme.accent }} />
                  </div>
                </Button>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-lg border bg-muted/50">
            <h4 className="font-medium mb-2">{t('pdfSettings.preview', 'Preview')}</h4>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div className="p-2 rounded text-center text-white" style={{ backgroundColor: settings.colors.primary }}>Primary</div>
              <div className="p-2 rounded text-center text-white" style={{ backgroundColor: settings.colors.secondary }}>Secondary</div>
              <div className="p-2 rounded text-center text-white" style={{ backgroundColor: settings.colors.accent }}>Accent</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

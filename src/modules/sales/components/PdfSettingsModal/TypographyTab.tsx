import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Type } from 'lucide-react';
import { PdfSettings } from '../../utils/pdfSettings.utils';
import { useTranslation } from 'react-i18next';

interface TypographyTabProps {
  settings: PdfSettings;
  updateSettings: (path: string, value: any) => void;
}

export function TypographyTab({ settings, updateSettings }: TypographyTabProps) {
  const { t } = useTranslation('sales');

  return (
    <div className="mt-6 space-y-6 pb-6">
      <Card>
        <CardHeader>
          <CardTitle>{t('pdfSettings.fontConfiguration', 'Font Configuration')}</CardTitle>
          <CardDescription>{t('pdfSettings.fontConfigurationDescription', 'Fine-tune typography for optimal readability')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="fontFamily">{t('pdfSettings.fontFamily', 'Font Family')}</Label>
              <Select value={settings.fontFamily} onValueChange={(value) => updateSettings('fontFamily', value)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Helvetica">Helvetica</SelectItem>
                  <SelectItem value="Times-Roman">Times Roman</SelectItem>
                  <SelectItem value="Courier">Courier</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t('pdfSettings.lineHeight', 'Line Height')}: {settings.advanced.lineHeight}</Label>
              <Slider value={[settings.advanced.lineHeight]} onValueChange={(value) => updateSettings('advanced.lineHeight', value[0])} min={1.0} max={2.0} step={0.1} className="mt-2" />
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h4 className="font-medium flex items-center gap-2">
              <Type className="h-4 w-4" />
              {t('pdfSettings.fontSizes', 'Font Sizes')}
            </h4>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label>{t('pdfSettings.header', 'Header')}: {settings.fontSize.header}px</Label>
                <Slider value={[settings.fontSize.header]} onValueChange={(value) => updateSettings('fontSize.header', value[0])} min={14} max={32} step={1} className="mt-2" />
              </div>
              <div>
                <Label>{t('pdfSettings.title', 'Title')}: {settings.fontSize.title}px</Label>
                <Slider value={[settings.fontSize.title]} onValueChange={(value) => updateSettings('fontSize.title', value[0])} min={8} max={16} step={1} className="mt-2" />
              </div>
              <div>
                <Label>{t('pdfSettings.body', 'Body')}: {settings.fontSize.body}px</Label>
                <Slider value={[settings.fontSize.body]} onValueChange={(value) => updateSettings('fontSize.body', value[0])} min={8} max={14} step={1} className="mt-2" />
              </div>
              <div>
                <Label>{t('pdfSettings.small', 'Small')}: {settings.fontSize.small}px</Label>
                <Slider value={[settings.fontSize.small]} onValueChange={(value) => updateSettings('fontSize.small', value[0])} min={6} max={12} step={1} className="mt-2" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

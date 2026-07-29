import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { formatDisplayName } from '../../utils/pdfSettings.utils';
import { PdfSettings } from '../../utils/pdfSettings.utils';
import { Building2, Upload, X, Image } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { CompanyOverrideSection } from '@/shared/pdf/CompanyOverrideSection';

interface DataTabProps {
  settings: PdfSettings;
  onSettingsChange: (path: string, value: any) => void;
  applyColorTheme?: (theme: any) => void;
}

export function DataTab({ settings, onSettingsChange }: DataTabProps) {
  const { t } = useTranslation('offers');
  const fileInputId = 'pdf-logo-upload-input';

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        onSettingsChange('company.logo', result);
        onSettingsChange('showElements.logo', true);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    onSettingsChange('company.logo', undefined);
    onSettingsChange('showElements.logo', false);
  };

  return (
    <div className="space-y-6">
      {/* Company Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>{t('pdfSettings.companyInformation', 'Company Information')}</CardTitle>
              <CardDescription>{t('pdfSettings.companyDescription', 'Configure your company details that appear on quotes')}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between space-x-2 p-3 bg-muted/50 rounded-lg">
            <div>
              <Label htmlFor="show-company-name" className="text-sm font-medium">
                {t('pdfSettings.showCompanyName', 'Show Company Name')}
              </Label>
              <p className="text-xs text-muted-foreground">
                {t('pdfSettings.showCompanyNameDescription', 'Display company name in PDF header')}
              </p>
            </div>
            <Switch
              id="show-company-name"
              checked={settings.showElements.companyName}
              onCheckedChange={(checked) => onSettingsChange('showElements.companyName', checked)}
            />
          </div>

          <CompanyOverrideSection
            company={settings.company}
            onSettingsChange={onSettingsChange}
            footerEnabled={settings.showElements.footer}
          />

          <Separator />

          {/* Logo Upload */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t('pdfSettings.companyLogo', 'Company Logo')}</Label>
              <p className="text-xs text-muted-foreground">{t('pdfSettings.logoUsedInHeader', 'Used in PDF header')}</p>
            </div>
            
            {settings.company.logo ? (
              <div className="flex items-center gap-4 p-3 border rounded-lg">
                <img 
                  src={settings.company.logo} 
                  alt="Company Logo" 
                  className="w-12 h-12 object-contain bg-muted rounded"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium">{t('pdfSettings.logoUploaded', 'Logo uploaded')}</p>
                  <p className="text-xs text-muted-foreground">{t('pdfSettings.clickRemoveToChange', 'Click remove to change or delete')}</p>
                </div>
                <Button variant="outline" size="sm" onClick={removeLogo}>
                  <X className="h-4 w-4 mr-1" />
                  {t('pdfSettings.remove', 'Remove')}
                </Button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
                <div className="text-center">
                  <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <Label htmlFor={fileInputId} className="cursor-pointer">
                    <Button variant="outline" size="sm" asChild>
                      <span>{t('pdfSettings.uploadLogo', 'Upload Logo')}</span>
                    </Button>
                  </Label>
                  <p className="text-xs text-muted-foreground mt-2">
                    PNG, JPG up to 2MB
                  </p>
                </div>
              </div>
            )}
            
            <input
              id={fileInputId}
              type="file"
              accept="image/png,image/jpeg"
              onChange={handleLogoUpload}
              className="hidden"
            />

            {/* Logo Size Control */}
            {settings.company.logo && settings.showElements.logo && (
              <div className="space-y-3 p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Image className="h-4 w-4 text-muted-foreground" />
                  <Label>{t('pdfSettings.logoSize', 'Logo Size')}</Label>
                  <span className="text-sm text-muted-foreground ml-auto">{settings.logoSize || 48}px</span>
                </div>
                <Slider
                  value={[settings.logoSize || 48]}
                  onValueChange={([value]) => onSettingsChange('logoSize', value)}
                  min={24}
                  max={120}
                  step={4}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  {t('pdfSettings.logoSizeDescription', 'Adjust the logo size in the PDF header (24px - 120px)')}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Content Visibility */}
      <Card>
        <CardHeader>
          <CardTitle>{t('pdfSettings.contentVisibility', 'Content Visibility')}</CardTitle>
          <CardDescription>{t('pdfSettings.contentVisibilityDescription', 'Choose which sections to include in your quote PDFs')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(settings.showElements)
              .filter(([key]) => key !== 'companyName') // Already shown above
              .map(([key, value]) => (
              <div key={key} className="flex items-center justify-between space-x-2">
                <Label htmlFor={`show-${key}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  {t(`pdfSettings.elements.${key}`, formatDisplayName(key))}
                </Label>
                <Switch
                  id={`show-${key}`}
                  checked={value}
                  onCheckedChange={(checked) => onSettingsChange(`showElements.${key}`, checked)}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
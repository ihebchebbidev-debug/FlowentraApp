import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { Image, Eye, EyeOff, Grid } from 'lucide-react';
import { PdfSettings, formatDisplayName } from '../../utils/pdfSettings.utils';
import { useTranslation } from 'react-i18next';
import { CompanyOverrideSection } from '@/shared/pdf/CompanyOverrideSection';

interface DataTabProps {
  settings: PdfSettings;
  updateSettings: (path: string, value: any) => void;
}

export function DataTab({ settings, updateSettings }: DataTabProps) {
  const { t } = useTranslation('sales');
  const fileInputId = 'pdf-logo-upload-input';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert(t('pdfSettings.fileTooLarge', 'File size must be less than 5MB'));
      return;
    }
    if (!file.type.startsWith('image/')) {
      alert(t('pdfSettings.invalidFile', 'Please upload an image file'));
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      updateSettings('company.logo', dataUrl);
      updateSettings('showElements.logo', true);
    };
    reader.readAsDataURL(file);
    (e.target as HTMLInputElement).value = '';
  };

  const applyPlaceholder = () => {
    const url = 'https://i.ibb.co/v4mr5WW1/elementor-placeholder-image.png';
    updateSettings('company.logo', url);
    updateSettings('showElements.logo', true);
  };

  return (
    <div className="mt-4 pb-4">
      <ScrollArea className="h-[55vh] pr-4">
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Image className="h-4 w-4 text-primary" />
                {t('pdfSettings.companyInformation', 'Company Information')}
              </CardTitle>
              <CardDescription className="text-xs">{t('pdfSettings.companyDescription', 'Update your business details')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              {/* Show Company Name Toggle */}
              <div className="flex items-center justify-between py-2 px-3 bg-muted/50 rounded-lg">
                <div>
                  <Label htmlFor="show-company-name" className="text-xs font-medium">
                    {t('pdfSettings.showCompanyName', 'Show Company Name')}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {t('pdfSettings.showCompanyNameDescription', 'Display company name in PDF header')}
                  </p>
                </div>
                <Switch
                  id="show-company-name"
                  checked={settings.showElements.companyName}
                  onCheckedChange={(checked) => updateSettings('showElements.companyName', checked)}
                  className="scale-75"
                />
              </div>

              {/* Logo preview and controls */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {settings.company?.logo ? (
                    <img src={settings.company.logo} alt="logo-preview" className="w-16 h-16 object-cover rounded" />
                  ) : (
                    <div className="w-16 h-16 rounded bg-muted/30 flex items-center justify-center text-xs">{t('pdfSettings.noLogo', 'No logo')}</div>
                  )}
                  <div>
                    <p className="text-sm font-medium">{t('pdfSettings.companyLogo', 'Company Logo')}</p>
                    <p className="text-xs text-muted-foreground">{t('pdfSettings.logoUsedInHeader', 'Used in PDF header')}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <label htmlFor={fileInputId} className="text-xs px-2 py-1 border rounded bg-primary/5 text-primary cursor-pointer">
                        {t('pdfSettings.uploadLogo', 'Upload')}
                      </label>
                      <input id={fileInputId} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                      <Button size="sm" variant="outline" onClick={applyPlaceholder} className="text-xs">{t('pdfSettings.usePlaceholder', 'Use placeholder')}</Button>
                      {settings.company?.logo && (
                        <button
                          type="button"
                          className="text-xs px-2 py-1 border rounded bg-destructive/5 text-destructive"
                          onClick={() => {
                            updateSettings('company.logo', undefined);
                            updateSettings('showElements.logo', false);
                          }}
                        >
                          {t('pdfSettings.remove', 'Remove')}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  {settings.company?.logo ? (
                    <Badge variant="secondary" className="text-xs">{t('pdfSettings.logoEnabled', 'Logo enabled')}</Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">{t('pdfSettings.noLogoSet', 'No logo set')}</span>
                  )}
                </div>
              </div>

              {/* Logo Size Control */}
              {settings.company?.logo && settings.showElements?.logo && (
                <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">{t('pdfSettings.logoSize', 'Logo Size')}</Label>
                    <span className="text-xs text-muted-foreground">{settings.logoSize || 48}px</span>
                  </div>
                  <Slider
                    value={[settings.logoSize || 48]}
                    onValueChange={([value]) => updateSettings('logoSize', value)}
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

              <CompanyOverrideSection
                company={settings.company}
                onSettingsChange={updateSettings}
                footerEnabled={settings.showElements.footer}
              />
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="h-fit">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Eye className="h-4 w-4 text-primary" />
                  {t('pdfSettings.documentSections', 'Document Sections')}
                </CardTitle>
                <CardDescription className="text-xs">{t('pdfSettings.documentSectionsDescription', 'Control which sections appear')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 pt-0">
                {Object.entries(settings.showElements).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-muted/50">
                    <div className="flex items-center gap-2">
                      {value ? <Eye className="h-3 w-3 text-success" /> : <EyeOff className="h-3 w-3 text-muted-foreground" />}
                      <Label htmlFor={key} className="capitalize cursor-pointer text-xs">
                        {t(`pdfSettings.elements.${key}`, formatDisplayName(key))}
                      </Label>
                    </div>
                    <Switch
                      id={key}
                      checked={value}
                      onCheckedChange={(checked) => updateSettings(`showElements.${key}`, checked)}
                      className="scale-75"
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="h-fit">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Grid className="h-4 w-4 text-primary" />
                  {t('pdfSettings.tableConfiguration', 'Table Configuration')}
                </CardTitle>
                <CardDescription className="text-xs">{t('pdfSettings.tableConfigurationDescription', 'Customize table display')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                <div className="space-y-2">
                  {Object.entries(settings.table).filter(([key]) => !['borderStyle', 'headerStyle'].includes(key)).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-muted/50">
                      <Label htmlFor={`table-${key}`} className="capitalize cursor-pointer text-xs">
                        {formatDisplayName(key)}
                      </Label>
                      <Switch
                        id={`table-${key}`}
                        checked={value as boolean}
                        onCheckedChange={(checked) => updateSettings(`table.${key}`, checked)}
                        className="scale-75"
                      />
                    </div>
                  ))}
                </div>
                
                <Separator />
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">{t('pdfSettings.borderStyle', 'Border Style')}</Label>
                    <Select value={settings.table.borderStyle} onValueChange={(value) => updateSettings('table.borderStyle', value)}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="solid">Solid</SelectItem>
                        <SelectItem value="dashed">Dashed</SelectItem>
                        <SelectItem value="none">None</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">{t('pdfSettings.headerStyle', 'Header Style')}</Label>
                    <Select value={settings.table.headerStyle} onValueChange={(value) => updateSettings('table.headerStyle', value)}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="filled">Filled</SelectItem>
                        <SelectItem value="outline">Outline</SelectItem>
                        <SelectItem value="minimal">Minimal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

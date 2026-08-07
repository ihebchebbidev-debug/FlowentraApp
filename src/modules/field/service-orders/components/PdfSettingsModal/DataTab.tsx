import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { formatDisplayName } from '../../utils/pdfSettings.utils';
import { PdfSettings } from '../../utils/pdfSettings.utils';
import { CompanyOverrideSection } from '@/shared/pdf/CompanyOverrideSection';

interface DataTabProps {
  settings: PdfSettings;
  onSettingsChange: (path: string, value: any) => void;
}

export function DataTab({ settings, onSettingsChange }: DataTabProps) {
  return (
    <div className="space-y-6">
      {/* Company Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Company Information</CardTitle>
          <CardDescription>
            Configure your company details that appear on the service report
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <CompanyOverrideSection
            company={settings.company}
            onSettingsChange={onSettingsChange}
            footerEnabled={settings.showElements.footer}
          />
        </CardContent>
      </Card>

      {/* Document Elements */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Document Elements</CardTitle>
          <CardDescription>
            Choose which sections to include in your service report PDF
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(settings.showElements).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between space-x-2">
                <Label 
                  htmlFor={`show-${key}`} 
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {formatDisplayName(key).replace('Service Order', 'Report')}
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

      {/* Table Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Services Table Configuration</CardTitle>
          <CardDescription>
            Customize which columns appear in the services table
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(settings.table).filter(([key]) => typeof settings.table[key as keyof typeof settings.table] === 'boolean').map(([key, value]) => (
              <div key={key} className="flex items-center justify-between space-x-2">
                <Label 
                  htmlFor={`table-${key}`} 
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {formatDisplayName(key).replace('Article Codes', 'Service Codes')}
                </Label>
                <Switch
                  id={`table-${key}`}
                  checked={value as boolean}
                  onCheckedChange={(checked) => onSettingsChange(`table.${key}`, checked)}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
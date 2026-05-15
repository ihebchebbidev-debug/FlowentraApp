import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { formatDisplayName } from '../../utils/pdfSettings.utils';
import { PdfSettings } from '../../utils/pdfSettings.utils';

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
            Configure your company details that appear on the dispatch report
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company-name">Company Name</Label>
              <Input
                id="company-name"
                value={settings.company.name}
                onChange={(e) => onSettingsChange('company.name', e.target.value)}
                placeholder="Your Company Name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company-tagline">Tagline</Label>
              <Input
                id="company-tagline"
                value={settings.company.tagline}
                onChange={(e) => onSettingsChange('company.tagline', e.target.value)}
                placeholder="Professional Field Services"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="company-address">Address</Label>
            <Textarea
              id="company-address"
              value={settings.company.address}
              onChange={(e) => onSettingsChange('company.address', e.target.value)}
              placeholder="1234 Business Street, City, State 12345"
              rows={3}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company-phone">Phone</Label>
              <Input
                id="company-phone"
                value={settings.company.phone}
                onChange={(e) => onSettingsChange('company.phone', e.target.value)}
                placeholder="(555) 123-4567"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company-email">Email</Label>
              <Input
                id="company-email"
                value={settings.company.email}
                onChange={(e) => onSettingsChange('company.email', e.target.value)}
                placeholder="dispatch@yourcompany.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company-website">Website</Label>
              <Input
                id="company-website"
                value={settings.company.website}
                onChange={(e) => onSettingsChange('company.website', e.target.value)}
                placeholder="www.yourcompany.com"
              />
            </div>
          </div>

          {/* Footer Message */}
          <Separator />
          <div className="space-y-2">
            <Label htmlFor="footer-message">Footer Message</Label>
            <Textarea
              id="footer-message"
              value={(settings.company as any).footerMessage || ''}
              onChange={(e) => onSettingsChange('company.footerMessage', e.target.value)}
              placeholder="Thank you for choosing our services."
              rows={2}
            />
            <p className="text-xs text-muted-foreground">
              This message appears at the bottom of all PDF reports
            </p>
          </div>

          {/* Footer Preview */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">Footer Preview</Label>
            <div className={`relative rounded-md border p-4 text-xs ${settings.showElements.footer ? 'bg-background' : 'bg-muted/30 opacity-60'}`}>
              {!settings.showElements.footer && (
                <div className="absolute inset-0 flex items-center justify-center z-10">
                  <span className="bg-destructive/10 text-destructive text-xs font-medium px-2 py-1 rounded">
                    Footer is currently disabled
                  </span>
                </div>
              )}
              <div className="border-t pt-3 space-y-1">
                <p className="text-muted-foreground">
                  {settings.company.name || 'Company Name'} • {settings.company.address || 'Address'}
                </p>
                <p className="text-muted-foreground">
                  {settings.company.phone || 'Phone'} • {settings.company.email || 'Email'} • {settings.company.website || 'Website'}
                </p>
                {(settings.company as any).footerMessage && (
                  <p className="text-muted-foreground italic">{(settings.company as any).footerMessage}</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Document Elements */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Document Elements</CardTitle>
          <CardDescription>
            Choose which sections to include in your dispatch report PDF
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
                  {formatDisplayName(key)}
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
          <CardTitle className="text-base">Time Tracking Table Configuration</CardTitle>
          <CardDescription>
            Customize which columns appear in the time tracking table
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
                  {formatDisplayName(key)}
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
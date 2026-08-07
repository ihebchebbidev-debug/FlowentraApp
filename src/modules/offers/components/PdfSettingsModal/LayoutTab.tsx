import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { PdfSettings, paperSizes, templateStyles } from '../../utils/pdfSettings.utils';
import { Layout, FileText, Settings } from 'lucide-react';

interface LayoutTabProps {
  settings: PdfSettings;
  onSettingsChange: (path: string, value: any) => void;
}

export function LayoutTab({ settings, onSettingsChange }: LayoutTabProps) {
  return (
    <div className="space-y-6">
      {/* Page Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Page Settings</CardTitle>
              <CardDescription>Configure page size, orientation, and margins</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Paper Size</Label>
              <Select
                value={settings.paperSize}
                onValueChange={(value) => onSettingsChange('paperSize', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {paperSizes.map((size) => (
                    <SelectItem key={size.value} value={size.value}>
                      {size.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Orientation</Label>
              <Select
                value={settings.orientation}
                onValueChange={(value) => onSettingsChange('orientation', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="portrait">Portrait</SelectItem>
                  <SelectItem value="landscape">Landscape</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Margins */}
          <div className="space-y-4">
            <Label>Margins (px)</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {(['top', 'bottom', 'left', 'right'] as const).map((side) => (
                <div key={side} className="space-y-2">
                  <Label className="text-sm capitalize">{side}</Label>
                  <div className="space-y-2">
                    <Slider
                      value={[settings.margins[side]]}
                      onValueChange={([value]) => onSettingsChange(`margins.${side}`, value)}
                      max={60}
                      min={0}
                      step={4}
                      className="w-full"
                    />
                    <div className="text-xs text-center text-muted-foreground">
                      {settings.margins[side]}px
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Template Style */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Layout className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Template Style</CardTitle>
              <CardDescription>Choose the overall design approach for your quotes</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Design Template</Label>
            <Select
              value={settings.templateStyle}
              onValueChange={(value) => onSettingsChange('templateStyle', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {templateStyles.map((style) => (
                  <SelectItem key={style.value} value={style.value}>
                    {style.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="mobile-optimized" className="text-sm font-medium leading-none">
              Mobile Optimized Layout
            </Label>
            <Switch
              id="mobile-optimized"
              checked={settings.mobileOptimized}
              onCheckedChange={(checked) => onSettingsChange('mobileOptimized', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Table Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Table Configuration</CardTitle>
              <CardDescription>Customize the items table appearance and content</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(settings.table).filter(([key]) => typeof settings.table[key as keyof typeof settings.table] === 'boolean').map(([key, value]) => (
              <div key={key} className="flex items-center justify-between space-x-2">
                <Label htmlFor={`table-${key}`} className="text-sm font-medium leading-none capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </Label>
                <Switch
                  id={`table-${key}`}
                  checked={value as boolean}
                  onCheckedChange={(checked) => onSettingsChange(`table.${key}`, checked)}
                />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="space-y-2">
              <Label>Border Style</Label>
              <Select
                value={settings.table.borderStyle}
                onValueChange={(value) => onSettingsChange('table.borderStyle', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="solid">Solid</SelectItem>
                  <SelectItem value="dashed">Dashed</SelectItem>
                  <SelectItem value="dotted">Dotted</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Header Style</Label>
              <Select
                value={settings.table.headerStyle}
                onValueChange={(value) => onSettingsChange('table.headerStyle', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="filled">Filled</SelectItem>
                  <SelectItem value="outlined">Outlined</SelectItem>
                  <SelectItem value="minimal">Minimal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
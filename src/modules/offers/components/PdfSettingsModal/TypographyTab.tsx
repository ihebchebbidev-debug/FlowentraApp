import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { PdfSettings } from '../../utils/pdfSettings.utils';
import { Type } from 'lucide-react';

interface TypographyTabProps {
  settings: PdfSettings;
  onSettingsChange: (path: string, value: any) => void;
}

const fontFamilies = [
  { value: 'Helvetica', label: 'Helvetica' },
  { value: 'Times-Roman', label: 'Times Roman' },
  { value: 'Courier', label: 'Courier' },
];

const dateFormats = [
  { value: 'en-US', label: 'US Format (MM/DD/YYYY)' },
  { value: 'en-GB', label: 'UK Format (DD/MM/YYYY)' },
  { value: 'de-DE', label: 'German Format (DD.MM.YYYY)' },
  { value: 'iso', label: 'ISO Format (YYYY-MM-DD)' },
];

const currencies = [
  { value: '$', label: 'US Dollar ($)' },
  { value: '€', label: 'Euro (€)' },
  { value: '£', label: 'British Pound (£)' },
  { value: '¥', label: 'Japanese Yen (¥)' },
  { value: 'TND', label: 'Tunisian Dinar (TND)' },
];

export function TypographyTab({ settings, onSettingsChange }: TypographyTabProps) {
  return (
    <div className="space-y-6">
      {/* Font Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Type className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Typography</CardTitle>
              <CardDescription>Configure fonts and text sizes for your quotes</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Font Family</Label>
            <Select
              value={settings.fontFamily}
              onValueChange={(value) => onSettingsChange('fontFamily', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {fontFamilies.map((font) => (
                  <SelectItem key={font.value} value={font.value}>
                    {font.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Font Sizes */}
          <div className="space-y-4">
            <Label>Font Sizes</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(settings.fontSize).map(([key, value]) => (
                <div key={key} className="space-y-2">
                  <Label className="text-sm capitalize flex items-center justify-between">
                    {key} Text
                    <span className="text-xs text-muted-foreground">{value}pt</span>
                  </Label>
                  <Slider
                    value={[value]}
                    onValueChange={([newValue]) => onSettingsChange(`fontSize.${key}`, newValue)}
                    max={key === 'header' ? 32 : 16}
                    min={key === 'small' ? 6 : 8}
                    step={1}
                    className="w-full"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Line Height */}
          <div className="space-y-2">
            <Label className="flex items-center justify-between">
              Line Height
              <span className="text-xs text-muted-foreground">{settings.advanced.lineHeight}</span>
            </Label>
            <Slider
              value={[settings.advanced.lineHeight]}
              onValueChange={([value]) => onSettingsChange('advanced.lineHeight', value)}
              max={2.0}
              min={1.0}
              step={0.1}
              className="w-full"
            />
          </div>
        </CardContent>
      </Card>

      {/* Formatting */}
      <Card>
        <CardHeader>
          <CardTitle>Formatting Options</CardTitle>
          <CardDescription>Configure how dates, numbers, and currency are displayed</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date Format</Label>
              <Select
                value={settings.dateFormat}
                onValueChange={(value) => onSettingsChange('dateFormat', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {dateFormats.map((format) => (
                    <SelectItem key={format.value} value={format.value}>
                      {format.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Currency</Label>
              <Select
                value={settings.currencySymbol}
                onValueChange={(value) => onSettingsChange('currencySymbol', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((currency) => (
                    <SelectItem key={currency.value} value={currency.value}>
                      {currency.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center justify-between">
              Tax Rate
              <span className="text-xs text-muted-foreground">{settings.taxRate}%</span>
            </Label>
            <Slider
              value={[settings.taxRate]}
              onValueChange={([value]) => onSettingsChange('taxRate', value)}
              max={30}
              min={0}
              step={0.5}
              className="w-full"
            />
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Typography Preview</CardTitle>
          <CardDescription>See how your font settings will look</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 p-4 border rounded-lg bg-muted/50">
            <div style={{ fontSize: `${settings.fontSize.header}pt`, fontFamily: settings.fontFamily }}>
              <strong>Header Text ({settings.fontSize.header}pt)</strong>
            </div>
            <div style={{ fontSize: `${settings.fontSize.title}pt`, fontFamily: settings.fontFamily }}>
              <strong>Title Text ({settings.fontSize.title}pt)</strong>
            </div>
            <div style={{ fontSize: `${settings.fontSize.body}pt`, fontFamily: settings.fontFamily, lineHeight: settings.advanced.lineHeight }}>
              Body text with line height {settings.advanced.lineHeight} ({settings.fontSize.body}pt)
            </div>
            <div style={{ fontSize: `${settings.fontSize.small}pt`, fontFamily: settings.fontFamily }}>
              Small text for footnotes and details ({settings.fontSize.small}pt)
            </div>
            <div className="mt-3 pt-3 border-t">
              <span className="text-sm text-muted-foreground">
                Currency: {settings.currencySymbol}1,234.56 | 
                Date: {new Date().toLocaleDateString(settings.dateFormat === 'iso' ? 'sv-SE' : settings.dateFormat)} |
                Tax: {settings.taxRate}%
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
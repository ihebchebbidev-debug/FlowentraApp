import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { PdfSettings } from '../../utils/pdfSettings.utils';

interface AdvancedTabProps {
  settings: PdfSettings;
  onSettingsChange: (path: string, value: any) => void;
}

export function AdvancedTab({ settings, onSettingsChange }: AdvancedTabProps) {
  return (
    <div className="space-y-6">
      {/* PDF Quality & Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">PDF Quality & Performance</CardTitle>
          <CardDescription>
            Configure PDF generation quality and file size optimization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Compression Level: {settings.advanced.compression}%</Label>
                <Slider
                  value={[settings.advanced.compression]}
                  onValueChange={([value]) => onSettingsChange('advanced.compression', value)}
                  min={0}
                  max={100}
                  step={10}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  Higher compression = smaller file size, lower quality
                </p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Output Quality</Label>
                <Select 
                  value={settings.advanced.quality} 
                  onValueChange={(value) => onSettingsChange('advanced.quality', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low (Faster generation)</SelectItem>
                    <SelectItem value="medium">Medium (Balanced)</SelectItem>
                    <SelectItem value="high">High (Best quality)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Watermark Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Watermark Settings</CardTitle>
          <CardDescription>
            Configure optional watermark text for your service reports
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="enable-watermark">Enable Watermark</Label>
            <Switch
              id="enable-watermark"
              checked={settings.showElements.watermark}
              onCheckedChange={(checked) => onSettingsChange('showElements.watermark', checked)}
            />
          </div>
          
          {settings.showElements.watermark && (
            <>
              <div className="space-y-2">
                <Label htmlFor="watermark-text">Watermark Text</Label>
                <Input
                  id="watermark-text"
                  value={settings.advanced.watermarkText}
                  onChange={(e) => onSettingsChange('advanced.watermarkText', e.target.value)}
                  placeholder="CONFIDENTIAL"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Watermark Opacity: {settings.advanced.watermarkOpacity}%</Label>
                <Slider
                  value={[settings.advanced.watermarkOpacity]}
                  onValueChange={([value]) => onSettingsChange('advanced.watermarkOpacity', value)}
                  min={5}
                  max={50}
                  step={5}
                  className="w-full"
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Table Styling */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Table Styling</CardTitle>
          <CardDescription>
            Configure the appearance of data tables in your service reports
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <SelectItem value="none">None</SelectItem>
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
                  <SelectItem value="filled">Filled Background</SelectItem>
                  <SelectItem value="bordered">Bordered Only</SelectItem>
                  <SelectItem value="minimal">Minimal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mobile Optimization */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Mobile & Accessibility</CardTitle>
          <CardDescription>
            Optimize your PDFs for mobile viewing and accessibility
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="mobile-optimized">Mobile Optimized Layout</Label>
              <p className="text-xs text-muted-foreground">
                Adjusts font sizes and spacing for better mobile viewing
              </p>
            </div>
            <Switch
              id="mobile-optimized"
              checked={settings.mobileOptimized}
              onCheckedChange={(checked) => onSettingsChange('mobileOptimized', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Debug Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Debug Information</CardTitle>
          <CardDescription>
            Current settings overview for troubleshooting
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-muted/50 p-4 rounded-lg">
            <pre className="text-xs overflow-x-auto">
              {JSON.stringify({
                paperSize: settings.paperSize,
                orientation: settings.orientation,
                fontFamily: settings.fontFamily,
                compression: settings.advanced.compression,
                quality: settings.advanced.quality,
                enabledSections: Object.entries(settings.showElements)
                  .filter(([_, enabled]) => enabled)
                  .map(([key]) => key)
              }, null, 2)}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
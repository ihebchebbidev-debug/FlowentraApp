import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { PdfSettings } from '../../utils/pdfSettings.utils';
import { Settings, Zap } from 'lucide-react';

interface AdvancedTabProps {
  settings: PdfSettings;
  onSettingsChange: (path: string, value: any) => void;
}

const qualityOptions = [
  { value: 'low', label: 'Low (Fast generation)' },
  { value: 'medium', label: 'Medium (Balanced)' },
  { value: 'high', label: 'High (Best quality)' },
];

export function AdvancedTab({ settings, onSettingsChange }: AdvancedTabProps) {
  return (
    <div className="space-y-6">
      {/* PDF Generation */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>PDF Generation</CardTitle>
              <CardDescription>Optimize PDF generation and file size</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Quality</Label>
              <Select
                value={settings.advanced.quality}
                onValueChange={(value) => onSettingsChange('advanced.quality', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {qualityOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center justify-between">
                Compression
                <span className="text-xs text-muted-foreground">{settings.advanced.compression}%</span>
              </Label>
              <Slider
                value={[settings.advanced.compression]}
                onValueChange={([value]) => onSettingsChange('advanced.compression', value)}
                max={100}
                min={10}
                step={10}
                className="w-full"
              />
            </div>
          </div>

          {/* Header/Footer Heights */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center justify-between">
                Header Height
                <span className="text-xs text-muted-foreground">{settings.advanced.headerHeight}px</span>
              </Label>
              <Slider
                value={[settings.advanced.headerHeight]}
                onValueChange={([value]) => onSettingsChange('advanced.headerHeight', value)}
                max={120}
                min={40}
                step={10}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center justify-between">
                Footer Height
                <span className="text-xs text-muted-foreground">{settings.advanced.footerHeight}px</span>
              </Label>
              <Slider
                value={[settings.advanced.footerHeight]}
                onValueChange={([value]) => onSettingsChange('advanced.footerHeight', value)}
                max={100}
                min={20}
                step={10}
                className="w-full"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Watermark */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Watermark Settings</CardTitle>
              <CardDescription>Add a watermark to your quote PDFs</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="show-watermark" className="text-sm font-medium leading-none">
              Enable Watermark
            </Label>
            <Switch
              id="show-watermark"
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
                  placeholder="QUOTE"
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center justify-between">
                  Opacity
                  <span className="text-xs text-muted-foreground">{settings.advanced.watermarkOpacity}%</span>
                </Label>
                <Slider
                  value={[settings.advanced.watermarkOpacity]}
                  onValueChange={([value]) => onSettingsChange('advanced.watermarkOpacity', value)}
                  max={50}
                  min={5}
                  step={5}
                  className="w-full"
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Performance Tips */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Tips</CardTitle>
          <CardDescription>Recommendations for optimal PDF generation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 rounded-full bg-success mt-2 flex-shrink-0" />
              <div>
                <p className="font-medium">Fast Generation</p>
                <p className="text-muted-foreground">Use low quality and high compression for quick previews</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
              <div>
                <p className="font-medium">File Size</p>
                <p className="text-muted-foreground">Higher compression reduces file size but may affect quality</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 rounded-full bg-warning mt-2 flex-shrink-0" />
              <div>
                <p className="font-medium">Print Quality</p>
                <p className="text-muted-foreground">Use high quality with low compression for best print results</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
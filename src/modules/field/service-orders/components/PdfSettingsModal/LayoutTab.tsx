import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { PdfSettings, paperSizes, templateStyles } from '../../utils/pdfSettings.utils';

interface LayoutTabProps {
  settings: PdfSettings;
  onSettingsChange: (path: string, value: any) => void;
}

export function LayoutTab({ settings, onSettingsChange }: LayoutTabProps) {
  return (
    <div className="space-y-6">
      {/* Page Setup */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Page Setup</CardTitle>
          <CardDescription>
            Configure the basic layout settings for your service report
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
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
                  {paperSizes.map(size => (
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

          <div className="space-y-2">
            <Label>Template Style</Label>
            <Select 
              value={settings.templateStyle} 
              onValueChange={(value) => onSettingsChange('templateStyle', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {templateStyles.map(style => (
                  <SelectItem key={style.value} value={style.value}>
                    {style.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Margins */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Page Margins</CardTitle>
          <CardDescription>
            Adjust the margins around your document content (in points)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Top Margin: {settings.margins.top}pt</Label>
                <Slider
                  value={[settings.margins.top]}
                  onValueChange={([value]) => onSettingsChange('margins.top', value)}
                  min={12}
                  max={72}
                  step={4}
                  className="w-full"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Bottom Margin: {settings.margins.bottom}pt</Label>
                <Slider
                  value={[settings.margins.bottom]}
                  onValueChange={([value]) => onSettingsChange('margins.bottom', value)}
                  min={12}
                  max={72}
                  step={4}
                  className="w-full"
                />
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Left Margin: {settings.margins.left}pt</Label>
                <Slider
                  value={[settings.margins.left]}
                  onValueChange={([value]) => onSettingsChange('margins.left', value)}
                  min={12}
                  max={72}
                  step={4}
                  className="w-full"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Right Margin: {settings.margins.right}pt</Label>
                <Slider
                  value={[settings.margins.right]}
                  onValueChange={([value]) => onSettingsChange('margins.right', value)}
                  min={12}
                  max={72}
                  step={4}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Layout Components */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Layout Components</CardTitle>
          <CardDescription>
            Configure the height and spacing of various document sections
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Header Height: {settings.advanced.headerHeight}pt</Label>
                <Slider
                  value={[settings.advanced.headerHeight]}
                  onValueChange={([value]) => onSettingsChange('advanced.headerHeight', value)}
                  min={60}
                  max={120}
                  step={5}
                  className="w-full"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Footer Height: {settings.advanced.footerHeight}pt</Label>
                <Slider
                  value={[settings.advanced.footerHeight]}
                  onValueChange={([value]) => onSettingsChange('advanced.footerHeight', value)}
                  min={40}
                  max={100}
                  step={5}
                  className="w-full"
                />
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Line Height: {settings.advanced.lineHeight}</Label>
                <Slider
                  value={[settings.advanced.lineHeight]}
                  onValueChange={([value]) => onSettingsChange('advanced.lineHeight', value)}
                  min={1.0}
                  max={2.0}
                  step={0.1}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Currency & Date Format */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Formatting Options</CardTitle>
          <CardDescription>
            Configure currency symbol and date format preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Currency Symbol</Label>
              <Select 
                value={settings.currencySymbol} 
                onValueChange={(value) => onSettingsChange('currencySymbol', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="$">$ (Dollar)</SelectItem>
                  <SelectItem value="€">€ (Euro)</SelectItem>
                  <SelectItem value="£">£ (Pound)</SelectItem>
                  <SelectItem value="¥">¥ (Yen)</SelectItem>
                  <SelectItem value="₹">₹ (Rupee)</SelectItem>
                  <SelectItem value="TND">TND (Tunisian Dinar)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
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
                  <SelectItem value="en-US">MM/DD/YYYY (US)</SelectItem>
                  <SelectItem value="en-GB">DD/MM/YYYY (UK)</SelectItem>
                  <SelectItem value="de-DE">DD.MM.YYYY (German)</SelectItem>
                  <SelectItem value="iso">YYYY-MM-DD (ISO)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
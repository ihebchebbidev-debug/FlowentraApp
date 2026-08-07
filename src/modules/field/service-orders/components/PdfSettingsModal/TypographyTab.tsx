import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { PdfSettings } from '../../utils/pdfSettings.utils';

interface TypographyTabProps {
  settings: PdfSettings;
  onSettingsChange: (path: string, value: any) => void;
}

export function TypographyTab({ settings, onSettingsChange }: TypographyTabProps) {
  const fontFamilies = [
    { value: 'Helvetica', label: 'Helvetica (Clean, Professional)' },
    { value: 'Times-Roman', label: 'Times Roman (Traditional, Serif)' },
    { value: 'Courier', label: 'Courier (Monospace)' },
  ];

  return (
    <div className="space-y-6">
      {/* Font Family */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Font Family</CardTitle>
          <CardDescription>
            Choose the primary font family for your service report
          </CardDescription>
        </CardHeader>
        <CardContent>
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
                {fontFamilies.map(font => (
                  <SelectItem key={font.value} value={font.value}>
                    {font.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Font Sizes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Font Sizes</CardTitle>
          <CardDescription>
            Adjust the font sizes for different text elements (in points)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Header Text: {settings.fontSize.header}pt</Label>
                <Slider
                  value={[settings.fontSize.header]}
                  onValueChange={([value]) => onSettingsChange('fontSize.header', value)}
                  min={14}
                  max={28}
                  step={1}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">Used for main headings and company name</p>
              </div>
              
              <div className="space-y-2">
                <Label>Title Text: {settings.fontSize.title}pt</Label>
                <Slider
                  value={[settings.fontSize.title]}
                  onValueChange={([value]) => onSettingsChange('fontSize.title', value)}
                  min={9}
                  max={16}
                  step={1}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">Used for section titles and labels</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Body Text: {settings.fontSize.body}pt</Label>
                <Slider
                  value={[settings.fontSize.body]}
                  onValueChange={([value]) => onSettingsChange('fontSize.body', value)}
                  min={8}
                  max={14}
                  step={1}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">Used for main content and table text</p>
              </div>
              
              <div className="space-y-2">
                <Label>Small Text: {settings.fontSize.small}pt</Label>
                <Slider
                  value={[settings.fontSize.small]}
                  onValueChange={([value]) => onSettingsChange('fontSize.small', value)}
                  min={7}
                  max={12}
                  step={1}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">Used for footnotes and fine print</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Typography Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Typography Preview</CardTitle>
          <CardDescription>
            Preview how your font settings will appear in the document
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
            <div 
              className="font-bold"
              style={{ 
                fontFamily: settings.fontFamily === 'Times-Roman' ? 'serif' : 
                           settings.fontFamily === 'Courier' ? 'monospace' : 'sans-serif',
                fontSize: `${Math.round(settings.fontSize.header * 0.75)}px`
              }}
            >
              SERVICE REPORT HEADER ({settings.fontSize.header}pt)
            </div>
            
            <div 
              className="font-semibold text-primary"
              style={{ 
                fontFamily: settings.fontFamily === 'Times-Roman' ? 'serif' : 
                           settings.fontFamily === 'Courier' ? 'monospace' : 'sans-serif',
                fontSize: `${Math.round(settings.fontSize.title * 0.75)}px`
              }}
            >
              Section Title ({settings.fontSize.title}pt)
            </div>
            
            <div 
              style={{ 
                fontFamily: settings.fontFamily === 'Times-Roman' ? 'serif' : 
                           settings.fontFamily === 'Courier' ? 'monospace' : 'sans-serif',
                fontSize: `${Math.round(settings.fontSize.body * 0.75)}px`
              }}
            >
              This is body text that will be used for main content, customer information, service descriptions, and table data. ({settings.fontSize.body}pt)
            </div>
            
            <div 
              className="text-muted-foreground"
              style={{ 
                fontFamily: settings.fontFamily === 'Times-Roman' ? 'serif' : 
                           settings.fontFamily === 'Courier' ? 'monospace' : 'sans-serif',
                fontSize: `${Math.round(settings.fontSize.small * 0.75)}px`
              }}
            >
              Small text for footnotes and fine print ({settings.fontSize.small}pt)
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
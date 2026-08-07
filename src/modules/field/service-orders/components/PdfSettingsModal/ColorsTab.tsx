import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { PdfSettings, colorThemes } from '../../utils/pdfSettings.utils';

interface ColorsTabProps {
  settings: PdfSettings;
  onSettingsChange: (path: string, value: any) => void;
  applyColorTheme: (theme: typeof colorThemes[0]) => void;
}

export function ColorsTab({ settings, onSettingsChange, applyColorTheme }: ColorsTabProps) {
  return (
    <div className="space-y-6">
      {/* Color Themes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick Color Themes</CardTitle>
          <CardDescription>
            Choose from pre-designed color combinations or customize your own
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {colorThemes.map((theme) => (
              <Button
                key={theme.name}
                variant="outline"
                onClick={() => applyColorTheme(theme)}
                className="h-auto p-4 flex flex-col items-start space-y-2 hover:bg-muted/50"
              >
                <div className="flex items-center space-x-2 w-full">
                  <div 
                    className="w-4 h-4 rounded-full border border-border"
                    style={{ backgroundColor: theme.primary }}
                  />
                  <div 
                    className="w-4 h-4 rounded-full border border-border"
                    style={{ backgroundColor: theme.secondary }}
                  />
                  <div 
                    className="w-4 h-4 rounded-full border border-border"
                    style={{ backgroundColor: theme.accent }}
                  />
                  <span className="font-medium text-sm flex-1 text-left">{theme.name}</span>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Custom Colors */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Custom Color Settings</CardTitle>
          <CardDescription>
            Fine-tune individual colors used throughout your service report
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="primary-color">Primary Color</Label>
                <div className="flex space-x-2">
                  <Input
                    id="primary-color"
                    type="color"
                    value={settings.colors.primary}
                    onChange={(e) => onSettingsChange('colors.primary', e.target.value)}
                    className="w-12 h-10 p-1 border rounded"
                  />
                  <Input
                    value={settings.colors.primary}
                    onChange={(e) => onSettingsChange('colors.primary', e.target.value)}
                    placeholder="#3B82F6"
                    className="flex-1"
                  />
                </div>
                <p className="text-xs text-muted-foreground">Used for headers and accent elements</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="secondary-color">Secondary Color</Label>
                <div className="flex space-x-2">
                  <Input
                    id="secondary-color"
                    type="color"
                    value={settings.colors.secondary}
                    onChange={(e) => onSettingsChange('colors.secondary', e.target.value)}
                    className="w-12 h-10 p-1 border rounded"
                  />
                  <Input
                    value={settings.colors.secondary}
                    onChange={(e) => onSettingsChange('colors.secondary', e.target.value)}
                    placeholder="#1E40AF"
                    className="flex-1"
                  />
                </div>
                <p className="text-xs text-muted-foreground">Used for secondary elements</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="accent-color">Accent Color</Label>
                <div className="flex space-x-2">
                  <Input
                    id="accent-color"
                    type="color"
                    value={settings.colors.accent}
                    onChange={(e) => onSettingsChange('colors.accent', e.target.value)}
                    className="w-12 h-10 p-1 border rounded"
                  />
                  <Input
                    value={settings.colors.accent}
                    onChange={(e) => onSettingsChange('colors.accent', e.target.value)}
                    placeholder="#60A5FA"
                    className="flex-1"
                  />
                </div>
                <p className="text-xs text-muted-foreground">Used for highlights and decorative elements</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="text-color">Text Color</Label>
                <div className="flex space-x-2">
                  <Input
                    id="text-color"
                    type="color"
                    value={settings.colors.text}
                    onChange={(e) => onSettingsChange('colors.text', e.target.value)}
                    className="w-12 h-10 p-1 border rounded"
                  />
                  <Input
                    value={settings.colors.text}
                    onChange={(e) => onSettingsChange('colors.text', e.target.value)}
                    placeholder="#1F2937"
                    className="flex-1"
                  />
                </div>
                <p className="text-xs text-muted-foreground">Main text color throughout the document</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="background-color">Background Color</Label>
                <div className="flex space-x-2">
                  <Input
                    id="background-color"
                    type="color"
                    value={settings.colors.background}
                    onChange={(e) => onSettingsChange('colors.background', e.target.value)}
                    className="w-12 h-10 p-1 border rounded"
                  />
                  <Input
                    value={settings.colors.background}
                    onChange={(e) => onSettingsChange('colors.background', e.target.value)}
                    placeholder="#FFFFFF"
                    className="flex-1"
                  />
                </div>
                <p className="text-xs text-muted-foreground">Document background color</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="border-color">Border Color</Label>
                <div className="flex space-x-2">
                  <Input
                    id="border-color"
                    type="color"
                    value={settings.colors.border}
                    onChange={(e) => onSettingsChange('colors.border', e.target.value)}
                    className="w-12 h-10 p-1 border rounded"
                  />
                  <Input
                    value={settings.colors.border}
                    onChange={(e) => onSettingsChange('colors.border', e.target.value)}
                    placeholder="#E5E7EB"
                    className="flex-1"
                  />
                </div>
                <p className="text-xs text-muted-foreground">Used for table borders and separators</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Color Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Color Preview</CardTitle>
          <CardDescription>
            Preview how your selected colors will appear in the document
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <Badge 
                className="text-white border-0" 
                style={{ backgroundColor: settings.colors.primary }}
              >
                Primary Headers
              </Badge>
              <Badge 
                className="text-white border-0" 
                style={{ backgroundColor: settings.colors.secondary }}
              >
                Secondary Elements
              </Badge>
              <Badge 
                className="text-white border-0" 
                style={{ backgroundColor: settings.colors.accent }}
              >
                Accent Details
              </Badge>
            </div>
            
            <div 
              className="p-4 rounded border-2"
              style={{ 
                backgroundColor: settings.colors.background,
                borderColor: settings.colors.border,
                color: settings.colors.text
              }}
            >
              <p className="font-semibold mb-2">Sample Document Content</p>
              <p>This text shows how your content will appear with the selected colors.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
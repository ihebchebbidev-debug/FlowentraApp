import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PdfSettings, colorThemes } from '../../utils/pdfSettings.utils';
import { Palette, Wand2 } from 'lucide-react';

interface ColorsTabProps {
  settings: PdfSettings;
  onSettingsChange: (path: string, value: any) => void;
  applyColorTheme: (theme: typeof colorThemes[0]) => void;
}

export function ColorsTab({ settings, onSettingsChange, applyColorTheme }: ColorsTabProps) {
  const handleColorChange = (colorKey: string, value: string) => {
    onSettingsChange(`colors.${colorKey}`, value);
  };

  return (
    <div className="space-y-6">
      {/* Color Themes */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Quick Themes</CardTitle>
              <CardDescription>Apply pre-designed color schemes with one click</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {colorThemes.map((theme) => (
              <Button
                key={theme.name}
                variant="outline"
                className="h-auto p-4 flex items-center justify-between"
                onClick={() => applyColorTheme(theme)}
              >
                <div className="flex items-center gap-3">
                  <div className="flex gap-1">
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
                  </div>
                  <span className="text-sm font-medium">{theme.name}</span>
                </div>
                {settings.colors.primary === theme.primary && (
                  <Badge variant="secondary" className="text-xs">
                    Active
                  </Badge>
                )}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Custom Colors */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Custom Colors</CardTitle>
              <CardDescription>Fine-tune individual colors for your brand</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(settings.colors).map(([key, value]) => {
              if (key === 'gradient') return null;
              
              return (
                <div key={key} className="space-y-2">
                  <Label htmlFor={`color-${key}`} className="text-sm font-medium capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </Label>
                  <div className="flex items-center gap-2">
                    <input
                      id={`color-${key}`}
                      type="color"
                      value={value as string}
                      onChange={(e) => handleColorChange(key, e.target.value)}
                      className="w-10 h-10 rounded border border-border cursor-pointer"
                    />
                    <div className="flex-1">
                      <input
                        type="text"
                        value={value as string}
                        onChange={(e) => handleColorChange(key, e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="#000000"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Color Preview */}
          <div className="mt-6 p-4 border rounded-lg bg-muted/50">
            <Label className="text-sm font-medium mb-3 block">Preview</Label>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div 
                  className="w-8 h-8 rounded border"
                  style={{ backgroundColor: settings.colors.primary }}
                />
                <span className="text-sm">Primary - Headers and accents</span>
              </div>
              <div className="flex items-center gap-2">
                <div 
                  className="w-8 h-8 rounded border"
                  style={{ backgroundColor: settings.colors.secondary }}
                />
                <span className="text-sm">Secondary - Supporting elements</span>
              </div>
              <div className="flex items-center gap-2">
                <div 
                  className="w-8 h-8 rounded border"
                  style={{ backgroundColor: settings.colors.accent }}
                />
                <span className="text-sm">Accent - Highlights and links</span>
              </div>
              <div className="flex items-center gap-2">
                <div 
                  className="w-8 h-8 rounded border"
                  style={{ backgroundColor: settings.colors.text }}
                />
                <span className="text-sm">Text - Main content</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
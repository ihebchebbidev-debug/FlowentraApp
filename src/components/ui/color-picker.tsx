import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Palette, RotateCcw } from 'lucide-react';

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  onReset: () => void;
}

const PRESET_COLORS = [
  '#6366f1', // Original Purple
  '#3b82f6', // Blue
  '#10b981', // Green
  '#f59e0b', // Orange
  '#ef4444', // Red
  '#8b5cf6', // Violet
  '#06b6d4', // Cyan
  '#84cc16', // Lime
  '#f97316', // Orange-600
  '#ec4899', // Pink
  '#6366f1', // Indigo
  '#14b8a6', // Teal
];

export function ColorPicker({ value, onChange, onReset }: ColorPickerProps) {
  const [customColor, setCustomColor] = useState(value);

  const handleColorChange = (color: string) => {
    setCustomColor(color);
    onChange(color);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="h-10 w-20 p-0 border-border/50">
          <div 
            className="w-full h-full rounded-md border-2 border-border/20"
            style={{ backgroundColor: customColor }}
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-4 shadow-medium border-border/50">
        <div className="space-y-4">
      <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
        <span className="text-sm font-medium">Pick a Color</span>
            </div>
            <Button variant="ghost" size="sm" onClick={onReset}>
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Custom Color Input */}
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Custom Color</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={customColor}
                onChange={(e) => handleColorChange(e.target.value)}
                className="w-28 h-10 rounded-md border border-border/50 cursor-pointer bg-background"
                title={customColor}
              />
              <input
                type="text"
                value={customColor}
                onChange={(e) => handleColorChange(e.target.value)}
                className="flex-1 h-10 px-3 rounded-md border border-border/50 text-sm bg-background text-foreground placeholder:text-muted-foreground"
                placeholder="#000000"
              />
            </div>
            <div className="text-xs text-muted-foreground">Example: #6366f1 or rgb(99,102,241)</div>
          </div>

          {/* Preset Colors */}
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Preset Colors</label>
            <div className="grid grid-cols-6 gap-2">
              {PRESET_COLORS.map((color, index) => (
                <button
                  key={index}
                  onClick={() => handleColorChange(color)}
                  className="w-8 h-8 rounded-md border-2 border-border/20 hover:border-border transition-colors"
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
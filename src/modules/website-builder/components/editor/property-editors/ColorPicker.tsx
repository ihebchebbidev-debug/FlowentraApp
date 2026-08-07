/**
 * Color picker with inline swatch, hex input, and preset palette.
 */
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { ThemeSwatches } from '../ThemeSwatches';

const PRESET_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e',
  '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1',
  '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e', '#000000',
  '#ffffff', '#6b7280', '#1e293b', '#0f172a', '#fafafa', '#f5f5f4',
];

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  description?: string;
  /** Show the site's theme tokens as a first-class swatch row. Default true. */
  showThemeSwatches?: boolean;
}

export function ColorPicker({ label, value, onChange, description, showThemeSwatches = true }: ColorPickerProps) {
  const [showPresets, setShowPresets] = useState(false);

  return (
    <div className="space-y-1.5">
      <Label className="text-px-11 font-medium text-foreground/70">{label}</Label>
      {description && <p className="text-px-10 text-muted-foreground/50">{description}</p>}
      <div className="flex items-center gap-2">
        <div className="relative shrink-0">
          <input
            type="color"
            value={value || '#000000'}
            onChange={(e) => onChange(e.target.value)}
            className="w-8 h-8 rounded-lg border border-border/40 cursor-pointer shrink-0 appearance-none bg-transparent"
            style={{ backgroundColor: value || '#000000' }}
          />
        </div>
        <Input
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 text-xs font-mono flex-1 border-border/40 bg-background"
          placeholder="#000000"
        />
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 text-muted-foreground/50"
          onClick={() => setShowPresets(!showPresets)}
        >
          {showPresets ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        </Button>
      </div>
      {showThemeSwatches && (
        <div className="space-y-1">
          <span className="text-px-9 font-medium uppercase tracking-wider text-muted-foreground/60">Theme</span>
          <ThemeSwatches currentValue={value} onSelect={onChange} />
        </div>
      )}
      {showPresets && (
        <div className="grid grid-cols-8 gap-1 p-2 bg-muted/20 rounded-lg border border-border/20">
          {PRESET_COLORS.map(color => (
            <button
              key={color}
              onClick={() => { onChange(color); setShowPresets(false); }}
              className={`w-5 h-5 rounded-md transition-transform hover:scale-110 ${value === color ? 'ring-2 ring-primary ring-offset-1' : 'border border-border/30'}`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

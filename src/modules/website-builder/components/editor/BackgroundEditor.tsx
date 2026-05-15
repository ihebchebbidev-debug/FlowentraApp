/**
 * Advanced background editor supporting solid colors, gradients, opacity, and transparent.
 * Outputs a CSS-compatible background value stored in the component's `bgColor` prop.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Paintbrush, Droplets, Ban, ChevronDown, ChevronRight } from 'lucide-react';

type BgMode = 'none' | 'solid' | 'gradient';
type GradientType = 'linear' | 'radial';

interface ParsedBg {
  mode: BgMode;
  solidColor: string;
  opacity: number;
  gradientType: GradientType;
  gradientFrom: string;
  gradientTo: string;
  gradientAngle: number;
}

const PRESET_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e', '#06b6d4',
  '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#ec4899', '#f43f5e',
  '#000000', '#1e293b', '#374151', '#6b7280', '#d1d5db', '#f3f4f6',
  '#ffffff', '#fafafa', '#fef3c7', '#dbeafe', '#ede9fe', '#fce7f3',
];

const PRESET_GRADIENTS = [
  { from: '#667eea', to: '#764ba2', label: 'Violet Dusk' },
  { from: '#f093fb', to: '#f5576c', label: 'Pink Flame' },
  { from: '#4facfe', to: '#00f2fe', label: 'Ocean Blue' },
  { from: '#43e97b', to: '#38f9d7', label: 'Mint Fresh' },
  { from: '#fa709a', to: '#fee140', label: 'Sunset' },
  { from: '#a18cd1', to: '#fbc2eb', label: 'Lavender' },
  { from: '#ffecd2', to: '#fcb69f', label: 'Peach' },
  { from: '#0c3483', to: '#a2b6df', label: 'Deep Sea' },
  { from: '#1e3c72', to: '#2a5298', label: 'Royal Blue' },
  { from: '#f12711', to: '#f5af19', label: 'Fire' },
  { from: '#232526', to: '#414345', label: 'Charcoal' },
  { from: '#000000', to: '#434343', label: 'Dark' },
];

/** Convert hex color + opacity to rgba */
function hexToRgba(hex: string, opacity: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity / 100})`;
}

/** Parse a bgColor value into structured data */
function parseBgValue(value: string): ParsedBg {
  const defaults: ParsedBg = {
    mode: 'none',
    solidColor: '#ffffff',
    opacity: 100,
    gradientType: 'linear',
    gradientFrom: '#667eea',
    gradientTo: '#764ba2',
    gradientAngle: 135,
  };

  if (!value || value === 'transparent') return defaults;

  // Check for gradient
  if (value.includes('gradient')) {
    const linearMatch = value.match(/linear-gradient\((\d+)deg,\s*(#[0-9a-fA-F]{6}),\s*(#[0-9a-fA-F]{6})\)/);
    if (linearMatch) {
      return {
        ...defaults,
        mode: 'gradient',
        gradientType: 'linear',
        gradientAngle: parseInt(linearMatch[1]),
        gradientFrom: linearMatch[2],
        gradientTo: linearMatch[3],
      };
    }
    const radialMatch = value.match(/radial-gradient\(circle,\s*(#[0-9a-fA-F]{6}),\s*(#[0-9a-fA-F]{6})\)/);
    if (radialMatch) {
      return {
        ...defaults,
        mode: 'gradient',
        gradientType: 'radial',
        gradientFrom: radialMatch[1],
        gradientTo: radialMatch[2],
      };
    }
    // Fallback: still a gradient we can't fully parse
    return { ...defaults, mode: 'gradient' };
  }

  // Check for rgba
  const rgbaMatch = value.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
  if (rgbaMatch) {
    const r = parseInt(rgbaMatch[1]).toString(16).padStart(2, '0');
    const g = parseInt(rgbaMatch[2]).toString(16).padStart(2, '0');
    const b = parseInt(rgbaMatch[3]).toString(16).padStart(2, '0');
    return {
      ...defaults,
      mode: 'solid',
      solidColor: `#${r}${g}${b}`,
      opacity: Math.round(parseFloat(rgbaMatch[4]) * 100),
    };
  }

  // Hex color
  if (/^#[0-9a-fA-F]{3,8}$/.test(value)) {
    return { ...defaults, mode: 'solid', solidColor: value };
  }

  // Named color or other
  return { ...defaults, mode: 'solid', solidColor: value };
}

/** Build CSS background value from structured data */
function buildBgValue(parsed: ParsedBg): string {
  if (parsed.mode === 'none') return '';
  if (parsed.mode === 'solid') {
    if (parsed.opacity < 100) {
      return hexToRgba(parsed.solidColor, parsed.opacity);
    }
    return parsed.solidColor;
  }
  if (parsed.mode === 'gradient') {
    if (parsed.gradientType === 'radial') {
      return `radial-gradient(circle, ${parsed.gradientFrom}, ${parsed.gradientTo})`;
    }
    return `linear-gradient(${parsed.gradientAngle}deg, ${parsed.gradientFrom}, ${parsed.gradientTo})`;
  }
  return '';
}

interface BackgroundEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export function BackgroundEditor({ value, onChange }: BackgroundEditorProps) {
  const [parsed, setParsed] = useState<ParsedBg>(() => parseBgValue(value));
  const [showPresets, setShowPresets] = useState(false);

  // Sync from external value changes
  useEffect(() => {
    setParsed(parseBgValue(value));
  }, [value]);

  const update = useCallback((partial: Partial<ParsedBg>) => {
    const next = { ...parsed, ...partial };
    setParsed(next);
    onChange(buildBgValue(next));
  }, [parsed, onChange]);

  const modeButtons: { mode: BgMode; icon: React.ReactNode; label: string }[] = [
    { mode: 'none', icon: <Ban className="h-3 w-3" />, label: 'None' },
    { mode: 'solid', icon: <Paintbrush className="h-3 w-3" />, label: 'Solid' },
    { mode: 'gradient', icon: <Droplets className="h-3 w-3" />, label: 'Gradient' },
  ];

  // Preview swatch
  const previewBg = parsed.mode === 'none'
    ? 'repeating-conic-gradient(#e5e7eb 0% 25%, transparent 0% 50%) 0 0 / 12px 12px'
    : buildBgValue(parsed);

  return (
    <div className="space-y-2.5">
      <Label className="text-[11px] font-medium text-foreground/70">Background</Label>

      {/* Mode selector */}
      <div className="flex gap-1 p-0.5 rounded-lg bg-muted/30 border border-border/20">
        {modeButtons.map(({ mode, icon, label }) => (
          <button
            key={mode}
            onClick={() => update({ mode })}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[10px] font-medium transition-all flex-1 justify-center ${
              parsed.mode === mode
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground/60 hover:text-muted-foreground'
            }`}
          >
            {icon} {label}
          </button>
        ))}
      </div>

      {/* Preview */}
      <div className="flex items-center gap-2">
        <div
          className="w-full h-8 rounded-lg border border-border/30 shrink-0"
          style={{ background: previewBg }}
        />
      </div>

      {/* Solid color controls */}
      {parsed.mode === 'solid' && (
        <div className="space-y-2.5">
          <div className="flex items-center gap-2">
            <div className="relative shrink-0">
              <input
                type="color"
                value={parsed.solidColor || '#000000'}
                onChange={(e) => update({ solidColor: e.target.value })}
                className="w-8 h-8 rounded-lg border border-border/40 cursor-pointer appearance-none bg-transparent"
                style={{ backgroundColor: parsed.solidColor }}
              />
            </div>
            <Input
              value={parsed.solidColor || ''}
              onChange={(e) => update({ solidColor: e.target.value })}
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

          {showPresets && (
            <div className="grid grid-cols-8 gap-1 p-2 bg-muted/20 rounded-lg border border-border/20">
              {PRESET_COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => { update({ solidColor: c }); setShowPresets(false); }}
                  className={`w-5 h-5 rounded-md transition-transform hover:scale-110 ${
                    parsed.solidColor === c ? 'ring-2 ring-primary ring-offset-1' : 'border border-border/30'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          )}

          {/* Opacity slider */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-[10px] text-muted-foreground/60">Opacity</Label>
              <span className="text-[10px] text-muted-foreground/50 tabular-nums">{parsed.opacity}%</span>
            </div>
            <Slider
              value={[parsed.opacity]}
              min={0}
              max={100}
              step={5}
              onValueChange={([v]) => update({ opacity: v })}
            />
          </div>
        </div>
      )}

      {/* Gradient controls */}
      {parsed.mode === 'gradient' && (
        <div className="space-y-2.5">
          {/* Gradient type */}
          <div className="space-y-1">
            <Label className="text-[10px] text-muted-foreground/60">Type</Label>
            <Select value={parsed.gradientType} onValueChange={(v) => update({ gradientType: v as GradientType })}>
              <SelectTrigger className="h-7 text-xs border-border/40 bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="linear" className="text-xs">Linear</SelectItem>
                <SelectItem value="radial" className="text-xs">Radial</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* From / To colors */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-[10px] text-muted-foreground/60">From</Label>
              <div className="flex items-center gap-1.5">
                <input
                  type="color"
                  value={parsed.gradientFrom}
                  onChange={(e) => update({ gradientFrom: e.target.value })}
                  className="w-7 h-7 rounded-md border border-border/30 cursor-pointer appearance-none"
                  style={{ backgroundColor: parsed.gradientFrom }}
                />
                <Input
                  value={parsed.gradientFrom}
                  onChange={(e) => update({ gradientFrom: e.target.value })}
                  className="h-7 text-[10px] font-mono border-border/30 bg-background"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] text-muted-foreground/60">To</Label>
              <div className="flex items-center gap-1.5">
                <input
                  type="color"
                  value={parsed.gradientTo}
                  onChange={(e) => update({ gradientTo: e.target.value })}
                  className="w-7 h-7 rounded-md border border-border/30 cursor-pointer appearance-none"
                  style={{ backgroundColor: parsed.gradientTo }}
                />
                <Input
                  value={parsed.gradientTo}
                  onChange={(e) => update({ gradientTo: e.target.value })}
                  className="h-7 text-[10px] font-mono border-border/30 bg-background"
                />
              </div>
            </div>
          </div>

          {/* Angle (linear only) */}
          {parsed.gradientType === 'linear' && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-[10px] text-muted-foreground/60">Angle</Label>
                <span className="text-[10px] text-muted-foreground/50 tabular-nums">{parsed.gradientAngle}°</span>
              </div>
              <Slider
                value={[parsed.gradientAngle]}
                min={0}
                max={360}
                step={15}
                onValueChange={([v]) => update({ gradientAngle: v })}
              />
            </div>
          )}

          {/* Gradient presets */}
          <div className="space-y-1">
            <Label className="text-[10px] text-muted-foreground/60">Presets</Label>
            <div className="grid grid-cols-4 gap-1.5">
              {PRESET_GRADIENTS.map((g) => (
                <button
                  key={g.label}
                  onClick={() => update({ gradientFrom: g.from, gradientTo: g.to })}
                  className={`h-6 rounded-md transition-transform hover:scale-105 border border-border/20 ${
                    parsed.gradientFrom === g.from && parsed.gradientTo === g.to
                      ? 'ring-2 ring-primary ring-offset-1'
                      : ''
                  }`}
                  style={{ background: `linear-gradient(135deg, ${g.from}, ${g.to})` }}
                  title={g.label}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

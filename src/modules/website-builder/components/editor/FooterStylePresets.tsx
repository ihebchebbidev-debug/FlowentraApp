/**
 * FooterStylePresets — quick-apply footer style presets
 * shown in the properties panel when a footer block is selected.
 */
import React from 'react';
import { Label } from '@/components/ui/label';
import { Check } from 'lucide-react';

export interface FooterPreset {
  name: string;
  bgColor: string;
  textColor: string;
  variant: 'default' | 'columns' | 'centered' | 'branded' | 'minimal';
  /** Mini preview colors: [bg, text, accent] */
  preview: [string, string, string];
}

const FOOTER_PRESETS: FooterPreset[] = [
  // Dark footers
  {
    name: 'Dark Classic',
    bgColor: '#0f172a',
    textColor: '#f1f5f9',
    variant: 'default',
    preview: ['#0f172a', '#f1f5f9', '#3b82f6'],
  },
  {
    name: 'Dark Columns',
    bgColor: '#18181b',
    textColor: '#fafafa',
    variant: 'columns',
    preview: ['#18181b', '#fafafa', '#a78bfa'],
  },
  {
    name: 'Midnight',
    bgColor: '#1e1b4b',
    textColor: '#e0e7ff',
    variant: 'default',
    preview: ['#1e1b4b', '#e0e7ff', '#818cf8'],
  },
  // Light footers
  {
    name: 'Light Clean',
    bgColor: '#ffffff',
    textColor: '#1e293b',
    variant: 'default',
    preview: ['#ffffff', '#1e293b', '#3b82f6'],
  },
  {
    name: 'Light Gray',
    bgColor: '#f8fafc',
    textColor: '#334155',
    variant: 'centered',
    preview: ['#f8fafc', '#334155', '#6366f1'],
  },
  {
    name: 'Warm Cream',
    bgColor: '#fefce8',
    textColor: '#78350f',
    variant: 'branded',
    preview: ['#fefce8', '#78350f', '#f59e0b'],
  },
  // Accent color footers
  {
    name: 'Blue Accent',
    bgColor: '#1e40af',
    textColor: '#ffffff',
    variant: 'default',
    preview: ['#1e40af', '#ffffff', '#60a5fa'],
  },
  {
    name: 'Green Fresh',
    bgColor: '#14532d',
    textColor: '#dcfce7',
    variant: 'columns',
    preview: ['#14532d', '#dcfce7', '#22c55e'],
  },
  {
    name: 'Purple Brand',
    bgColor: '#581c87',
    textColor: '#f3e8ff',
    variant: 'branded',
    preview: ['#581c87', '#f3e8ff', '#c084fc'],
  },
  {
    name: 'Teal Modern',
    bgColor: '#134e4a',
    textColor: '#ccfbf1',
    variant: 'minimal',
    preview: ['#134e4a', '#ccfbf1', '#14b8a6'],
  },
  {
    name: 'Rose Soft',
    bgColor: '#881337',
    textColor: '#fce7f3',
    variant: 'centered',
    preview: ['#881337', '#fce7f3', '#fb7185'],
  },
  {
    name: 'Orange Warm',
    bgColor: '#7c2d12',
    textColor: '#ffedd5',
    variant: 'default',
    preview: ['#7c2d12', '#ffedd5', '#f97316'],
  },
];

interface FooterStylePresetsProps {
  currentProps: Record<string, any>;
  onApply: (props: Record<string, any>) => void;
}

export function FooterStylePresets({ currentProps, onApply }: FooterStylePresetsProps) {
  const isActive = (preset: FooterPreset) =>
    currentProps.bgColor === preset.bgColor &&
    currentProps.variant === preset.variant;

  return (
    <div className="space-y-2">
      <Label className="text-[10px] uppercase tracking-wider text-muted-foreground/60">
        Footer Style Presets
      </Label>
      <div className="grid grid-cols-2 gap-1.5">
        {FOOTER_PRESETS.map((preset) => {
          const active = isActive(preset);
          return (
            <button
              key={preset.name}
              onClick={() =>
                onApply({
                  bgColor: preset.bgColor,
                  textColor: preset.textColor,
                  variant: preset.variant,
                })
              }
              className={`relative flex flex-col gap-1.5 p-2 rounded-lg border transition-all text-left ${
                active
                  ? 'border-primary/50 bg-primary/5 ring-1 ring-primary/20'
                  : 'border-border/50 hover:border-primary/30 hover:bg-accent/50'
              }`}
            >
              {active && (
                <div className="absolute top-1.5 right-1.5 w-3.5 h-3.5 rounded-full bg-primary flex items-center justify-center">
                  <Check className="h-2 w-2 text-primary-foreground" />
                </div>
              )}
              {/* Mini footer preview */}
              <div
                className="w-full h-8 rounded flex flex-col justify-end px-1.5 pb-1 border border-black/5"
                style={{ backgroundColor: preset.preview[0] }}
              >
                {/* Links row */}
                <div className="flex items-center justify-between mb-0.5">
                  <div className="flex gap-1">
                    <div
                      className="w-3 h-1 rounded-sm opacity-60"
                      style={{ backgroundColor: preset.preview[1] }}
                    />
                    <div
                      className="w-3 h-1 rounded-sm opacity-60"
                      style={{ backgroundColor: preset.preview[1] }}
                    />
                    <div
                      className="w-3 h-1 rounded-sm opacity-60"
                      style={{ backgroundColor: preset.preview[1] }}
                    />
                  </div>
                  <div className="flex gap-0.5">
                    <div
                      className="w-1.5 h-1.5 rounded-full opacity-50"
                      style={{ backgroundColor: preset.preview[1] }}
                    />
                    <div
                      className="w-1.5 h-1.5 rounded-full opacity-50"
                      style={{ backgroundColor: preset.preview[1] }}
                    />
                  </div>
                </div>
                {/* Copyright line */}
                <div
                  className="w-8 h-0.5 rounded-sm opacity-30 mx-auto"
                  style={{ backgroundColor: preset.preview[1] }}
                />
              </div>
              <span className="text-[9px] font-medium truncate">{preset.name}</span>
            </button>
          );
        })}
      </div>

      {/* Variant selector */}
      <div className="space-y-1.5 pt-1">
        <Label className="text-[10px] uppercase tracking-wider text-muted-foreground/60">
          Layout Variant
        </Label>
        <div className="grid grid-cols-3 gap-1">
          {(['default', 'columns', 'centered', 'branded', 'minimal'] as const).map((v) => (
            <button
              key={v}
              onClick={() => onApply({ variant: v })}
              className={`px-1.5 py-1.5 rounded-md text-[9px] font-medium transition-all capitalize ${
                currentProps.variant === v
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted/50 hover:bg-muted text-muted-foreground'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

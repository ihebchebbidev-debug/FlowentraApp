/**
 * NavbarStylePresets — quick-apply header/navbar style presets
 * shown in the properties panel when a navbar block is selected.
 */
import React from 'react';
import { Label } from '@/components/ui/label';
import { Check } from 'lucide-react';

export interface NavbarPreset {
  name: string;
  bgColor: string;
  textColor: string;
  ctaColor: string;
  ctaTextColor: string;
  transparent: boolean;
  variant: 'default' | 'centered' | 'minimal' | 'bordered';
  /** Mini preview colors: [bg, text, cta] */
  preview: [string, string, string];
}

const NAVBAR_PRESETS: NavbarPreset[] = [
  {
    name: 'Classic Light',
    bgColor: '#ffffff',
    textColor: '#1e293b',
    ctaColor: '#3b82f6',
    ctaTextColor: '#ffffff',
    transparent: false,
    variant: 'default',
    preview: ['#ffffff', '#1e293b', '#3b82f6'],
  },
  {
    name: 'Dark Solid',
    bgColor: '#0f172a',
    textColor: '#f1f5f9',
    ctaColor: '#60a5fa',
    ctaTextColor: '#0f172a',
    transparent: false,
    variant: 'default',
    preview: ['#0f172a', '#f1f5f9', '#60a5fa'],
  },
  {
    name: 'Transparent Hero',
    bgColor: 'transparent',
    textColor: '#ffffff',
    ctaColor: '#ffffff',
    ctaTextColor: '#0f172a',
    transparent: true,
    variant: 'default',
    preview: ['transparent', '#ffffff', '#ffffff'],
  },
  {
    name: 'Warm Cream',
    bgColor: '#fefce8',
    textColor: '#78350f',
    ctaColor: '#f59e0b',
    ctaTextColor: '#ffffff',
    transparent: false,
    variant: 'default',
    preview: ['#fefce8', '#78350f', '#f59e0b'],
  },
  {
    name: 'Ocean Centered',
    bgColor: '#ecfeff',
    textColor: '#164e63',
    ctaColor: '#06b6d4',
    ctaTextColor: '#ffffff',
    transparent: false,
    variant: 'centered',
    preview: ['#ecfeff', '#164e63', '#06b6d4'],
  },
  {
    name: 'Minimal Dark',
    bgColor: '#18181b',
    textColor: '#e4e4e7',
    ctaColor: '#a78bfa',
    ctaTextColor: '#18181b',
    transparent: false,
    variant: 'minimal',
    preview: ['#18181b', '#e4e4e7', '#a78bfa'],
  },
  {
    name: 'Soft Rose',
    bgColor: '#fff1f2',
    textColor: '#9f1239',
    ctaColor: '#fb7185',
    ctaTextColor: '#ffffff',
    transparent: false,
    variant: 'bordered',
    preview: ['#fff1f2', '#9f1239', '#fb7185'],
  },
  {
    name: 'Emerald Fresh',
    bgColor: '#f0fdf4',
    textColor: '#14532d',
    ctaColor: '#22c55e',
    ctaTextColor: '#ffffff',
    transparent: false,
    variant: 'default',
    preview: ['#f0fdf4', '#14532d', '#22c55e'],
  },
  {
    name: 'Midnight Purple',
    bgColor: '#1e1b4b',
    textColor: '#e0e7ff',
    ctaColor: '#818cf8',
    ctaTextColor: '#1e1b4b',
    transparent: false,
    variant: 'default',
    preview: ['#1e1b4b', '#e0e7ff', '#818cf8'],
  },
  {
    name: 'Glass Overlay',
    bgColor: 'rgba(255,255,255,0.8)',
    textColor: '#1e293b',
    ctaColor: '#6366f1',
    ctaTextColor: '#ffffff',
    transparent: true,
    variant: 'default',
    preview: ['#e8e8e8', '#1e293b', '#6366f1'],
  },
];

interface NavbarStylePresetsProps {
  currentProps: Record<string, any>;
  onApply: (props: Record<string, any>) => void;
}

export function NavbarStylePresets({ currentProps, onApply }: NavbarStylePresetsProps) {
  const isActive = (preset: NavbarPreset) =>
    currentProps.bgColor === preset.bgColor &&
    currentProps.variant === preset.variant;

  return (
    <div className="space-y-2">
      <Label className="text-[10px] uppercase tracking-wider text-muted-foreground/60">
        Header Style Presets
      </Label>
      <div className="grid grid-cols-2 gap-1.5">
        {NAVBAR_PRESETS.map((preset) => {
          const active = isActive(preset);
          return (
            <button
              key={preset.name}
              onClick={() =>
                onApply({
                  bgColor: preset.bgColor,
                  textColor: preset.textColor,
                  ctaColor: preset.ctaColor,
                  ctaTextColor: preset.ctaTextColor,
                  transparent: preset.transparent,
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
              {/* Mini nav preview */}
              <div
                className="w-full h-6 rounded flex items-center gap-1 px-1.5 border border-black/5"
                style={{ backgroundColor: preset.preview[0] }}
              >
                <div
                  className="w-4 h-1.5 rounded-sm"
                  style={{ backgroundColor: preset.preview[1] }}
                />
                <div className="flex-1" />
                <div
                  className="w-2 h-1.5 rounded-sm opacity-50"
                  style={{ backgroundColor: preset.preview[1] }}
                />
                <div
                  className="w-2 h-1.5 rounded-sm opacity-50"
                  style={{ backgroundColor: preset.preview[1] }}
                />
                <div
                  className="w-5 h-2.5 rounded-sm"
                  style={{ backgroundColor: preset.preview[2] }}
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
          {(['default', 'centered', 'minimal', 'bordered', 'split', 'stacked'] as const).map((v) => (
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

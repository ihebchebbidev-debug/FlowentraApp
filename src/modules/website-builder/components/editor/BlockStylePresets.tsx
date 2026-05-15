/**
 * Generic Block Style Presets — reusable preset picker UI
 * for testimonials, pricing, FAQ, features, CTA, and more.
 */
import React from 'react';
import { Label } from '@/components/ui/label';
import { Check } from 'lucide-react';

export interface BlockPreset {
  name: string;
  /** Props to apply when this preset is selected */
  props: Record<string, any>;
  /** Mini preview renderer */
  preview: React.ReactNode;
}

interface BlockStylePresetsProps {
  label: string;
  presets: BlockPreset[];
  currentProps: Record<string, any>;
  onApply: (props: Record<string, any>) => void;
  /** Optional variant selector */
  variants?: { value: string; label: string }[];
  currentVariant?: string;
  onVariantChange?: (variant: string) => void;
}

function isActive(preset: BlockPreset, currentProps: Record<string, any>): boolean {
  return Object.entries(preset.props).every(
    ([key, value]) => currentProps[key] === value
  );
}

export function BlockStylePresets({
  label,
  presets,
  currentProps,
  onApply,
  variants,
  currentVariant,
  onVariantChange,
}: BlockStylePresetsProps) {
  return (
    <div className="space-y-3">
      {/* Style presets */}
      <Label className="text-[10px] uppercase tracking-wider text-muted-foreground/60">
        {label}
      </Label>
      <div className="grid grid-cols-2 gap-1.5">
        {presets.map((preset) => {
          const active = isActive(preset, currentProps);
          return (
            <button
              key={preset.name}
              onClick={() => onApply(preset.props)}
              className={`relative flex flex-col gap-1.5 p-2 rounded-lg border transition-all text-left ${
                active
                  ? 'border-primary/50 bg-primary/5 ring-1 ring-primary/20'
                  : 'border-border/50 hover:border-primary/30 hover:bg-accent/50'
              }`}
            >
              {active && (
                <div className="absolute top-1.5 right-1.5 w-3.5 h-3.5 rounded-full bg-primary flex items-center justify-center z-10">
                  <Check className="h-2 w-2 text-primary-foreground" />
                </div>
              )}
              {preset.preview}
              <span className="text-[9px] font-medium truncate w-full">{preset.name}</span>
            </button>
          );
        })}
      </div>

      {/* Variant selector */}
      {variants && variants.length > 0 && onVariantChange && (
        <div className="space-y-1.5 pt-1">
          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground/60">
            Layout Variant
          </Label>
          <div className="grid grid-cols-3 gap-1">
            {variants.map((v) => (
              <button
                key={v.value}
                onClick={() => onVariantChange(v.value)}
                className={`px-1.5 py-1.5 rounded-md text-[9px] font-medium transition-all capitalize ${
                  currentVariant === v.value
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-muted/50 hover:bg-muted text-muted-foreground'
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

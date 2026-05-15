/**
 * Numeric slider with label and current value display.
 */
import React from 'react';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';

interface SliderEditorProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (value: number) => void;
}

export function SliderEditor({ label, value, min, max, step = 1, unit = '', onChange }: SliderEditorProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label className="text-[11px] font-medium text-foreground/70">{label}</Label>
        <span className="text-[10px] text-muted-foreground/60 tabular-nums">{value}{unit}</span>
      </div>
      <Slider value={[value]} min={min} max={max} step={step} onValueChange={([v]) => onChange(v)} />
    </div>
  );
}

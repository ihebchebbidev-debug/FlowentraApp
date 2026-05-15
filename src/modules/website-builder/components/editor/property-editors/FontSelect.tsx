/**
 * Font family selector dropdown.
 */
import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export const FONT_OPTIONS = [
  'Inter, sans-serif',
  'Georgia, serif',
  'Playfair Display, serif',
  'Roboto, sans-serif',
  'Open Sans, sans-serif',
  'Montserrat, sans-serif',
  'Lato, sans-serif',
  'Poppins, sans-serif',
  'Merriweather, serif',
  'Source Sans Pro, sans-serif',
  'Raleway, sans-serif',
  'Nunito, sans-serif',
  'DM Sans, sans-serif',
  'Space Grotesk, sans-serif',
  'Cormorant Garamond, serif',
  'Bebas Neue, sans-serif',
  'Plus Jakarta Sans, sans-serif',
  'Outfit, sans-serif',
  'DM Serif Display, serif',
  'Courier New, monospace',
  'Cairo, sans-serif',
  'Tajawal, sans-serif',
  'Noto Sans Arabic, sans-serif',
  'Noto Sans Hebrew, sans-serif',
];

interface FontSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

export function FontSelect({ label, value, onChange }: FontSelectProps) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[11px] font-medium text-foreground/70">{label}</Label>
      <Select value={value || FONT_OPTIONS[0]} onValueChange={onChange}>
        <SelectTrigger className="h-8 text-xs border-border/40 bg-background">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {FONT_OPTIONS.map(font => (
            <SelectItem key={font} value={font} className="text-xs" style={{ fontFamily: font }}>
              {font.split(',')[0]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

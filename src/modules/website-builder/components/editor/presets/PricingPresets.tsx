/**
 * Style presets for Pricing blocks.
 */
import React from 'react';
import { BlockPreset } from '../BlockStylePresets';

const CardPreview = ({ bg, card, accent, highlight }: { bg: string; card: string; accent: string; highlight: string }) => (
  <div className="w-full h-10 rounded flex items-end gap-0.5 px-1 pb-0.5 pt-0.5" style={{ backgroundColor: bg }}>
    <div className="flex-1 h-7 rounded border" style={{ backgroundColor: card, borderColor: accent + '30' }}>
      <div className="w-full h-1 rounded-t" style={{ backgroundColor: accent + '20' }} />
    </div>
    <div className="flex-1 h-9 rounded border-2" style={{ backgroundColor: card, borderColor: highlight }}>
      <div className="w-full h-1.5 rounded-t" style={{ backgroundColor: highlight }} />
    </div>
    <div className="flex-1 h-7 rounded border" style={{ backgroundColor: card, borderColor: accent + '30' }}>
      <div className="w-full h-1 rounded-t" style={{ backgroundColor: accent + '20' }} />
    </div>
  </div>
);

const CompactPreview = ({ bg, accent }: { bg: string; accent: string }) => (
  <div className="w-full h-10 rounded flex flex-col gap-0.5 px-1 py-0.5" style={{ backgroundColor: bg }}>
    <div className="w-full h-3 rounded" style={{ backgroundColor: accent + '10', border: `1px solid ${accent}20` }} />
    <div className="w-full h-3 rounded" style={{ backgroundColor: accent + '08', border: `1px solid ${accent}15` }} />
    <div className="w-full h-3 rounded" style={{ backgroundColor: accent + '05', border: `1px solid ${accent}10` }} />
  </div>
);

export const PRICING_PRESETS: BlockPreset[] = [
  {
    name: 'Classic',
    props: { variant: 'classic', bgColor: '' },
    preview: <CardPreview bg="#f8fafc" card="#ffffff" accent="#64748b" highlight="#3b82f6" />,
  },
  {
    name: 'Gradient Pop',
    props: { variant: 'gradient', bgColor: '' },
    preview: <CardPreview bg="#ffffff" card="#ffffff" accent="#8b5cf6" highlight="#8b5cf6" />,
  },
  {
    name: 'Compact List',
    props: { variant: 'compact', bgColor: '' },
    preview: <CompactPreview bg="#fafafa" accent="#3b82f6" />,
  },
  {
    name: 'Dark Premium',
    props: { variant: 'classic', bgColor: '#0f172a' },
    preview: <CardPreview bg="#0f172a" card="#1e293b" accent="#475569" highlight="#f59e0b" />,
  },
  {
    name: 'Bordered Clean',
    props: { variant: 'bordered', bgColor: '#ffffff' },
    preview: <CardPreview bg="#ffffff" card="#ffffff" accent="#e2e8f0" highlight="#10b981" />,
  },
  {
    name: 'Soft Pastel',
    props: { variant: 'classic', bgColor: '#faf5ff' },
    preview: <CardPreview bg="#faf5ff" card="#ffffff" accent="#c4b5fd" highlight="#8b5cf6" />,
  },
];

export const PRICING_VARIANTS = [
  { value: 'classic', label: 'Classic' },
  { value: 'gradient', label: 'Gradient' },
  { value: 'compact', label: 'Compact' },
  { value: 'bordered', label: 'Bordered' },
];

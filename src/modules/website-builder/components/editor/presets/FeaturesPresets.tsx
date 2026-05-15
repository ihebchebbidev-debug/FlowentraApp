/**
 * Style presets for Features blocks.
 */
import React from 'react';
import { BlockPreset } from '../BlockStylePresets';

const GridPreview = ({ bg, card, accent, cols }: { bg: string; card: string; accent: string; cols: number }) => (
  <div className="w-full h-10 rounded flex items-center justify-center gap-0.5 px-1" style={{ backgroundColor: bg }}>
    {Array.from({ length: cols }).map((_, i) => (
      <div key={i} className="flex-1 h-7 rounded flex flex-col items-center justify-center gap-0.5" style={{ backgroundColor: card, border: `1px solid ${accent}20` }}>
        <div className="w-2 h-2 rounded" style={{ backgroundColor: accent + '30' }} />
        <div className="w-4 h-0.5 rounded" style={{ backgroundColor: accent + '40' }} />
      </div>
    ))}
  </div>
);

const ListPreview = ({ bg, accent }: { bg: string; accent: string }) => (
  <div className="w-full h-10 rounded flex flex-col gap-0.5 px-1 py-0.5" style={{ backgroundColor: bg }}>
    {[1, 2, 3].map(i => (
      <div key={i} className="flex items-center gap-1">
        <div className="w-2.5 h-2.5 rounded" style={{ backgroundColor: accent + '25' }} />
        <div className="flex-1 h-1.5 rounded" style={{ backgroundColor: accent + '15' }} />
      </div>
    ))}
  </div>
);

export const FEATURES_PRESETS: BlockPreset[] = [
  {
    name: 'Card Grid',
    props: { variant: 'grid', columns: 3, cardBorder: true, cardShadow: false, bgColor: '' },
    preview: <GridPreview bg="#f8fafc" card="#ffffff" accent="#3b82f6" cols={3} />,
  },
  {
    name: 'Shadow Cards',
    props: { variant: 'grid', columns: 3, cardBorder: false, cardShadow: true, bgColor: '' },
    preview: <GridPreview bg="#ffffff" card="#ffffff" accent="#6366f1" cols={3} />,
  },
  {
    name: 'Two Columns',
    props: { variant: 'grid', columns: 2, cardBorder: true, cardShadow: false, bgColor: '' },
    preview: <GridPreview bg="#fafafa" card="#ffffff" accent="#10b981" cols={2} />,
  },
  {
    name: 'Icon List',
    props: { variant: 'list', columns: 1, cardBorder: false, cardShadow: false, bgColor: '' },
    preview: <ListPreview bg="#ffffff" accent="#3b82f6" />,
  },
  {
    name: 'Dark Grid',
    props: { variant: 'grid', columns: 3, cardBorder: true, cardShadow: false, bgColor: '#0f172a' },
    preview: <GridPreview bg="#0f172a" card="#1e293b" accent="#60a5fa" cols={3} />,
  },
  {
    name: 'Minimal 4-col',
    props: { variant: 'grid', columns: 4, cardBorder: false, cardShadow: false, bgColor: '' },
    preview: <GridPreview bg="#ffffff" card="#f8fafc" accent="#94a3b8" cols={4} />,
  },
];

export const FEATURES_VARIANTS = [
  { value: 'grid', label: 'Grid' },
  { value: 'list', label: 'List' },
];

/**
 * Style presets for FAQ blocks.
 */
import React from 'react';
import { BlockPreset } from '../BlockStylePresets';

const AccordionPreview = ({ bg, line, accent }: { bg: string; line: string; accent: string }) => (
  <div className="w-full h-10 rounded flex flex-col gap-0.5 px-1.5 py-1" style={{ backgroundColor: bg }}>
    <div className="flex items-center gap-1">
      <div className="flex-1 h-1.5 rounded" style={{ backgroundColor: line }} />
      <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: accent }} />
    </div>
    <div className="h-2 rounded" style={{ backgroundColor: accent + '10' }} />
    <div className="flex items-center gap-1">
      <div className="flex-1 h-1.5 rounded" style={{ backgroundColor: line }} />
      <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: accent + '50' }} />
    </div>
  </div>
);

const GridPreview = ({ bg, card, accent }: { bg: string; card: string; accent: string }) => (
  <div className="w-full h-10 rounded grid grid-cols-2 gap-0.5 px-1 py-0.5" style={{ backgroundColor: bg }}>
    <div className="rounded" style={{ backgroundColor: card, border: `1px solid ${accent}20` }} />
    <div className="rounded" style={{ backgroundColor: card, border: `1px solid ${accent}20` }} />
    <div className="rounded" style={{ backgroundColor: card, border: `1px solid ${accent}20` }} />
    <div className="rounded" style={{ backgroundColor: card, border: `1px solid ${accent}20` }} />
  </div>
);

const SideBySidePreview = ({ bg, accent }: { bg: string; accent: string }) => (
  <div className="w-full h-10 rounded flex gap-1 px-1 py-1" style={{ backgroundColor: bg }}>
    <div className="flex-1 flex flex-col gap-0.5">
      <div className="h-1.5 w-8 rounded" style={{ backgroundColor: accent + '60' }} />
      <div className="h-1.5 w-6 rounded" style={{ backgroundColor: accent + '40' }} />
    </div>
    <div className="flex-1 flex flex-col gap-0.5">
      <div className="h-1.5 w-full rounded" style={{ backgroundColor: accent + '15' }} />
      <div className="h-1.5 w-3/4 rounded" style={{ backgroundColor: accent + '10' }} />
    </div>
  </div>
);

export const FAQ_PRESETS: BlockPreset[] = [
  {
    name: 'Clean Accordion',
    props: { variant: 'accordion', bgColor: '' },
    preview: <AccordionPreview bg="#ffffff" line="#cbd5e1" accent="#3b82f6" />,
  },
  {
    name: 'Bordered Accordion',
    props: { variant: 'accordion-bordered', bgColor: '' },
    preview: <AccordionPreview bg="#f8fafc" line="#94a3b8" accent="#6366f1" />,
  },
  {
    name: 'Card Grid',
    props: { variant: 'grid', bgColor: '' },
    preview: <GridPreview bg="#fafafa" card="#ffffff" accent="#3b82f6" />,
  },
  {
    name: 'Side by Side',
    props: { variant: 'side-by-side', bgColor: '' },
    preview: <SideBySidePreview bg="#ffffff" accent="#3b82f6" />,
  },
  {
    name: 'Dark Accordion',
    props: { variant: 'accordion', bgColor: '#0f172a' },
    preview: <AccordionPreview bg="#0f172a" line="#334155" accent="#60a5fa" />,
  },
  {
    name: 'Warm Grid',
    props: { variant: 'grid', bgColor: '#fffbeb' },
    preview: <GridPreview bg="#fffbeb" card="#ffffff" accent="#f59e0b" />,
  },
];

export const FAQ_VARIANTS = [
  { value: 'accordion', label: 'Accordion' },
  { value: 'accordion-bordered', label: 'Bordered' },
  { value: 'grid', label: 'Grid' },
  { value: 'side-by-side', label: 'Side by Side' },
];

/**
 * Style presets for Testimonials blocks.
 */
import React from 'react';
import { BlockPreset } from '../BlockStylePresets';

/* ── Mini Preview Components ── */

const GridPreview = ({ bg, card, accent }: { bg: string; card: string; accent: string }) => (
  <div className="w-full h-10 rounded flex items-center justify-center gap-1 px-1" style={{ backgroundColor: bg }}>
    <div className="w-6 h-7 rounded" style={{ backgroundColor: card, border: `1px solid ${accent}30` }} />
    <div className="w-6 h-7 rounded" style={{ backgroundColor: card, border: `1px solid ${accent}30` }} />
    <div className="w-6 h-7 rounded" style={{ backgroundColor: card, border: `1px solid ${accent}30` }} />
  </div>
);

const CarouselPreview = ({ bg, accent }: { bg: string; accent: string }) => (
  <div className="w-full h-10 rounded flex items-center justify-center gap-1 px-2" style={{ backgroundColor: bg }}>
    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: accent + '40' }} />
    <div className="flex-1 h-6 rounded" style={{ backgroundColor: accent + '15', border: `1px solid ${accent}20` }} />
    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: accent + '40' }} />
  </div>
);

const BubblePreview = ({ bg, accent }: { bg: string; accent: string }) => (
  <div className="w-full h-10 rounded flex flex-col items-start justify-center gap-0.5 px-2" style={{ backgroundColor: bg }}>
    <div className="w-10 h-3 rounded-tr-lg rounded-br-lg rounded-bl-lg" style={{ backgroundColor: accent + '18' }} />
    <div className="w-8 h-3 rounded-tr-lg rounded-br-lg rounded-bl-lg self-end" style={{ backgroundColor: accent + '12' }} />
  </div>
);

const MasonryPreview = ({ bg, card, accent }: { bg: string; card: string; accent: string }) => (
  <div className="w-full h-10 rounded flex items-end gap-0.5 px-1 pb-0.5" style={{ backgroundColor: bg }}>
    <div className="w-4 h-8 rounded" style={{ backgroundColor: card, border: `1px solid ${accent}20` }} />
    <div className="w-4 h-5 rounded" style={{ backgroundColor: card, border: `1px solid ${accent}20` }} />
    <div className="w-4 h-7 rounded" style={{ backgroundColor: card, border: `1px solid ${accent}20` }} />
  </div>
);

export const TESTIMONIALS_PRESETS: BlockPreset[] = [
  {
    name: 'Classic Grid',
    props: { variant: 'grid', cardStyle: 'bordered', columns: 2, bgColor: '' },
    preview: <GridPreview bg="#f8fafc" card="#ffffff" accent="#3b82f6" />,
  },
  {
    name: 'Shadow Cards',
    props: { variant: 'grid', cardStyle: 'shadow', columns: 3, bgColor: '' },
    preview: <GridPreview bg="#ffffff" card="#ffffff" accent="#6366f1" />,
  },
  {
    name: 'Carousel',
    props: { variant: 'carousel', cardStyle: 'bordered', columns: 1, bgColor: '' },
    preview: <CarouselPreview bg="#f1f5f9" accent="#3b82f6" />,
  },
  {
    name: 'Chat Bubbles',
    props: { variant: 'bubble', cardStyle: 'minimal', columns: 1, bgColor: '' },
    preview: <BubblePreview bg="#fafafa" accent="#8b5cf6" />,
  },
  {
    name: 'Masonry',
    props: { variant: 'masonry', cardStyle: 'bordered', columns: 3, bgColor: '' },
    preview: <MasonryPreview bg="#fafafa" card="#ffffff" accent="#10b981" />,
  },
  {
    name: 'Dark Spotlight',
    props: { variant: 'spotlight', cardStyle: 'shadow', columns: 2, bgColor: '#0f172a', titleColor: '#f1f5f9' },
    preview: <GridPreview bg="#0f172a" card="#1e293b" accent="#60a5fa" />,
  },
  {
    name: 'Minimal',
    props: { variant: 'grid', cardStyle: 'minimal', columns: 2, bgColor: '' },
    preview: <GridPreview bg="#ffffff" card="#f8fafc" accent="#94a3b8" />,
  },
  {
    name: 'Warm Tones',
    props: { variant: 'grid', cardStyle: 'bordered', columns: 2, bgColor: '#fffbeb', titleColor: '#92400e' },
    preview: <GridPreview bg="#fffbeb" card="#ffffff" accent="#f59e0b" />,
  },
];

export const TESTIMONIALS_VARIANTS = [
  { value: 'grid', label: 'Grid' },
  { value: 'carousel', label: 'Carousel' },
  { value: 'masonry', label: 'Masonry' },
  { value: 'bubble', label: 'Bubbles' },
  { value: 'spotlight', label: 'Spotlight' },
];

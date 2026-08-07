/**
 * Style presets for CTA Banner blocks.
 */
import React from 'react';
import { BlockPreset } from '../BlockStylePresets';

const BannerPreview = ({ bg, text, btn }: { bg: string; text: string; btn: string }) => (
  <div className="w-full h-10 rounded flex items-center justify-center gap-1.5 px-2" style={{ background: bg }}>
    <div className="flex flex-col gap-0.5 flex-1">
      <div className="h-1.5 w-8 rounded" style={{ backgroundColor: text }} />
      <div className="h-1 w-6 rounded opacity-60" style={{ backgroundColor: text }} />
    </div>
    <div className="w-6 h-3.5 rounded" style={{ backgroundColor: btn }} />
  </div>
);

export const CTA_PRESETS: BlockPreset[] = [
  {
    name: 'Blue Gradient',
    props: { gradientFrom: '#3b82f6', gradientTo: '#8b5cf6', ctaColor: '#ffffff', ctaTextColor: '#3b82f6', bgColor: '' },
    preview: <BannerPreview bg="linear-gradient(135deg, #3b82f6, #8b5cf6)" text="#ffffff" btn="#ffffff" />,
  },
  {
    name: 'Sunset',
    props: { gradientFrom: '#f97316', gradientTo: '#ef4444', ctaColor: '#ffffff', ctaTextColor: '#ef4444', bgColor: '' },
    preview: <BannerPreview bg="linear-gradient(135deg, #f97316, #ef4444)" text="#ffffff" btn="#ffffff" />,
  },
  {
    name: 'Emerald Fresh',
    props: { gradientFrom: '#10b981', gradientTo: '#06b6d4', ctaColor: '#ffffff', ctaTextColor: '#10b981', bgColor: '' },
    preview: <BannerPreview bg="linear-gradient(135deg, #10b981, #06b6d4)" text="#ffffff" btn="#ffffff" />,
  },
  {
    name: 'Dark Elegant',
    props: { bgColor: '#0f172a', gradientFrom: '', gradientTo: '', ctaColor: '#f59e0b', ctaTextColor: '#0f172a' },
    preview: <BannerPreview bg="#0f172a" text="#f1f5f9" btn="#f59e0b" />,
  },
  {
    name: 'Rose Soft',
    props: { gradientFrom: '#ec4899', gradientTo: '#f43f5e', ctaColor: '#ffffff', ctaTextColor: '#ec4899', bgColor: '' },
    preview: <BannerPreview bg="linear-gradient(135deg, #ec4899, #f43f5e)" text="#ffffff" btn="#ffffff" />,
  },
  {
    name: 'Ocean Deep',
    props: { gradientFrom: '#1e3a5f', gradientTo: '#0ea5e9', ctaColor: '#ffffff', ctaTextColor: '#1e3a5f', bgColor: '' },
    preview: <BannerPreview bg="linear-gradient(135deg, #1e3a5f, #0ea5e9)" text="#ffffff" btn="#ffffff" />,
  },
];

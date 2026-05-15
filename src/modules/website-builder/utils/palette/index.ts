/**
 * Component Palette — Barrel re-export.
 * Combines all category palettes into one COMPONENT_PALETTE array.
 */
import { PaletteItem } from '../../types';
import { LAYOUT_PALETTE } from './layout';
import { NAVIGATION_PALETTE } from './navigation';
import { TEXT_PALETTE } from './text';
import { MEDIA_PALETTE } from './media';
import { BUSINESS_PALETTE } from './business';
import { INTERACTIVE_PALETTE } from './interactive';
import { ECOMMERCE_PALETTE } from './ecommerce';
import { BLOG_PALETTE } from './blog';
import { ADVANCED_PALETTE } from './advanced';

export const COMPONENT_PALETTE: PaletteItem[] = [
  ...LAYOUT_PALETTE,
  ...NAVIGATION_PALETTE,
  ...TEXT_PALETTE,
  ...MEDIA_PALETTE,
  ...BUSINESS_PALETTE,
  ...ECOMMERCE_PALETTE,
  ...INTERACTIVE_PALETTE,
  ...BLOG_PALETTE,
  ...ADVANCED_PALETTE,
];

// Re-export category arrays for direct access
export {
  LAYOUT_PALETTE,
  NAVIGATION_PALETTE,
  TEXT_PALETTE,
  MEDIA_PALETTE,
  BUSINESS_PALETTE,
  ECOMMERCE_PALETTE,
  INTERACTIVE_PALETTE,
  BLOG_PALETTE,
  ADVANCED_PALETTE,
};

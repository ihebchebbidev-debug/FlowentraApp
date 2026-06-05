/**
 * Website Builder — Autopilot demo script.
 *
 * Drives a self-playing "build a store homepage from scratch" tour. Each step
 * moves the virtual cursor to a target in the faux builder UI, narrates a line,
 * and applies a pure state change. The canvas renders the resulting components
 * with the REAL ComponentRenderer, so the demo shows authentic blocks.
 */
import type { BuilderComponent, DeviceView, SiteTheme } from '../../types';
import { COMPONENT_PALETTE } from '../../utils/palette';
import { DEFAULT_THEME } from '../../types/site';

export type DemoPanel = 'palette' | 'properties' | 'theme';

export interface WBDemoState {
  device: DeviceView;
  /** Highlighted palette category id. */
  category: string;
  /** Palette block type being "picked up". */
  highlightBlock: string | null;
  /** Canvas content — grows as the tour builds the page. */
  components: BuilderComponent[];
  selectedId: string | null;
  panel: DemoPanel;
  theme: SiteTheme;
  /** A property shown being edited in the panel. */
  editing: { label: string; value: string } | null;
}

export interface WBStep {
  caption: string;
  /** DOM id of the faux-UI element to point the cursor at. */
  target: string;
  /** Fallback duration (ms) when narration is muted. */
  duration: number;
  apply: (s: WBDemoState) => WBDemoState;
}

export interface WBChapter {
  id: string;
  title: string;
  start: number;
  end: number;
}

/** Build a real BuilderComponent from the palette defaults (deterministic id). */
function make(type: string, overrides: Record<string, any> = {}): BuilderComponent {
  const item = COMPONENT_PALETTE.find(p => p.type === type);
  return {
    id: `demo-${type}`,
    type: type as BuilderComponent['type'],
    label: item?.label || type,
    props: { ...(item?.defaultProps || {}), ...overrides },
    styles: {},
  };
}

const add = (s: WBDemoState, type: string, overrides?: Record<string, any>): WBDemoState => {
  const comp = make(type, overrides);
  return { ...s, components: [...s.components, comp], selectedId: comp.id, highlightBlock: null, panel: 'palette', editing: null };
};

export const initialDemoState: WBDemoState = {
  device: 'desktop',
  category: 'layout',
  highlightBlock: null,
  components: [],
  selectedId: null,
  panel: 'palette',
  theme: { ...DEFAULT_THEME, primaryColor: '#2563eb', accentColor: '#f59e0b' },
  editing: null,
};

/** Each tuple: caption, target, duration, apply. */
export const WB_STEPS: WBStep[] = [
  { caption: "Welcome! Let's build a complete store homepage from scratch — no code, just blocks.", target: 'demo-canvas', duration: 3200, apply: s => ({ ...s, components: [], selectedId: null, panel: 'palette' }) },

  { caption: 'Every site starts with navigation. We open the Navigation category.', target: 'demo-cat-navigation', duration: 2400, apply: s => ({ ...s, category: 'navigation', panel: 'palette' }) },
  { caption: 'Pick the Navbar block…', target: 'demo-block-navbar', duration: 1800, apply: s => ({ ...s, highlightBlock: 'navbar' }) },
  { caption: '…and drop it on the canvas. Your header is live.', target: 'demo-canvas', duration: 2200, apply: s => add(s, 'navbar') },

  { caption: 'Next, a hero banner to greet visitors. Open the Layout category.', target: 'demo-cat-layout', duration: 2400, apply: s => ({ ...s, category: 'layout' }) },
  { caption: 'Grab the Hero Section…', target: 'demo-block-hero', duration: 1800, apply: s => ({ ...s, highlightBlock: 'hero' }) },
  { caption: '…and place it below the navbar.', target: 'demo-canvas', duration: 2000, apply: s => add(s, 'hero') },

  { caption: 'Edit content directly — change the headline in the Properties panel.', target: 'demo-props', duration: 2600, apply: s => ({ ...s, panel: 'properties', editing: { label: 'Heading', value: 'Summer Collection 2026' } }) },
  { caption: 'The canvas updates instantly as you type.', target: 'demo-canvas', duration: 2400, apply: s => ({
      ...s,
      editing: null,
      components: s.components.map(c => c.id === 'demo-hero' ? { ...c, props: { ...c.props, heading: 'Summer Collection 2026', subheading: 'New arrivals, free shipping over $50' } } : c),
    }) },

  { caption: 'A features row highlights what makes you special.', target: 'demo-cat-business', duration: 2400, apply: s => ({ ...s, category: 'business' }) },
  { caption: 'Add the Features block.', target: 'demo-block-features', duration: 1800, apply: s => ({ ...s, highlightBlock: 'features' }) },
  { caption: 'Done — clean, responsive, on-brand.', target: 'demo-canvas', duration: 2000, apply: s => add(s, 'features') },

  { caption: 'Now the storefront — a product grid wired to your real catalog.', target: 'demo-block-product-card', duration: 2600, apply: s => ({ ...s, category: 'business', highlightBlock: 'product-card' }) },
  { caption: 'Products, prices and badges render automatically.', target: 'demo-canvas', duration: 2400, apply: s => add(s, 'product-card') },

  { caption: 'Social proof matters — add customer testimonials.', target: 'demo-block-testimonials', duration: 2200, apply: s => ({ ...s, highlightBlock: 'testimonials' }) },
  { caption: 'Trust, built in.', target: 'demo-canvas', duration: 1800, apply: s => add(s, 'testimonials') },

  { caption: 'A footer ties everything together.', target: 'demo-cat-layout', duration: 2000, apply: s => ({ ...s, category: 'layout', highlightBlock: 'footer' }) },
  { caption: 'Links, contact, social — all in one block.', target: 'demo-canvas', duration: 2000, apply: s => add(s, 'footer') },

  { caption: 'And the secret sauce — a floating mini-cart, so shoppers check out from any page.', target: 'demo-block-mini-cart', duration: 3000, apply: s => ({ ...s, category: 'business', highlightBlock: 'mini-cart' }) },
  { caption: 'It stays in sync with every "Add to cart" across the site.', target: 'demo-canvas', duration: 2600, apply: s => add(s, 'mini-cart') },

  { caption: 'Rebrand in one click — change the primary color and every block follows.', target: 'demo-panel-theme', duration: 2800, apply: s => ({ ...s, panel: 'theme', theme: { ...s.theme, primaryColor: '#16a34a' } }) },
  { caption: 'One palette, the whole site updates — instantly.', target: 'demo-canvas', duration: 2400, apply: s => s },

  { caption: 'Check it on mobile — full per-device control, just like the desktop.', target: 'demo-device-mobile', duration: 2800, apply: s => ({ ...s, device: 'mobile' }) },
  { caption: 'Everything reflows perfectly for small screens.', target: 'demo-canvas', duration: 2400, apply: s => s },
  { caption: 'Back to desktop.', target: 'demo-device-desktop', duration: 1600, apply: s => ({ ...s, device: 'desktop' }) },

  { caption: 'Preview, then publish — your store is live.', target: 'demo-preview', duration: 2600, apply: s => ({ ...s, panel: 'palette', selectedId: null }) },
  { caption: "That's a complete e-commerce homepage, built from scratch in seconds. Your turn!", target: 'demo-canvas', duration: 3200, apply: s => s },
];

export const WB_CHAPTERS: WBChapter[] = [
  { id: 'structure', title: 'Structure', start: 0, end: 7 },
  { id: 'content', title: 'Content', start: 7, end: 9 },
  { id: 'store', title: 'Storefront', start: 9, end: 20 },
  { id: 'polish', title: 'Brand & Responsive', start: 20, end: WB_STEPS.length },
];

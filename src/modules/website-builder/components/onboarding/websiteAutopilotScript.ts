/**
 * Website Builder — Autopilot demo script.
 *
 * Drives a self-playing "build a store homepage from scratch" tour. Each step
 * moves the virtual cursor to a target in the faux builder UI, narrates a line,
 * and applies a pure state change. The canvas renders the resulting components
 * with the REAL ComponentRenderer, so the demo shows authentic blocks.
 */
import type { BuilderComponent, DeviceView, SiteTheme, PageSEO } from '../../types';
import { COMPONENT_PALETTE } from '../../utils/palette';
import { DEFAULT_THEME } from '../../types/site';

export type DemoPanel = 'palette' | 'properties' | 'theme' | 'seo';
export type DemoPhase = 'gallery' | 'editor';

export interface WBDemoState {
  /** gallery = choosing a template / blank; editor = building the page. */
  phase: DemoPhase;
  /** Highlighted template id in the gallery phase. */
  galleryHighlight: string | null;
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
  /** SEO shown filled in during the SEO step. */
  seo: PageSEO;
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
  phase: 'gallery',
  galleryHighlight: null,
  device: 'desktop',
  category: 'layout',
  highlightBlock: null,
  components: [],
  selectedId: null,
  panel: 'palette',
  theme: { ...DEFAULT_THEME, primaryColor: '#2563eb', accentColor: '#f59e0b' },
  seo: {},
  editing: null,
};

const setHero = (s: WBDemoState): WBDemoState => ({
  ...s,
  components: s.components.map(c => c.id === 'demo-hero'
    ? { ...c, props: { ...c.props, heading: 'Summer Collection 2026', subheading: 'New arrivals — free shipping over $50' } }
    : c),
});

/** Each step: caption (narrated), target DOM id, fallback duration, pure apply. */
export const WB_STEPS: WBStep[] = [
  // ── Chapter: Choose a start ──
  { caption: "Welcome! Let's create a website together — from the very first click to a published store.", target: 'demo-gallery', duration: 3600, apply: s => ({ ...initialDemoState }) },
  { caption: 'You can start from over thirty professionally designed templates — restaurants, agencies, clinics, portfolios, online stores, and more.', target: 'demo-gallery', duration: 4600, apply: s => s },
  { caption: "Hover any template to preview it live. Here's a ready-made e-commerce store.", target: 'demo-template-ecommerce-store', duration: 3600, apply: s => ({ ...s, galleryHighlight: 'ecommerce-store' }) },
  { caption: 'Each template comes with multiple pages, real sections, and a matching theme — fully editable.', target: 'demo-template-ecommerce-store', duration: 3800, apply: s => s },
  { caption: 'Or start from a completely blank canvas for total freedom. That is what we will do today.', target: 'demo-blank', duration: 3600, apply: s => ({ ...s, galleryHighlight: null }) },
  { caption: 'Name the site, then click Create — and the editor opens.', target: 'demo-create', duration: 3000, apply: s => s },

  // ── Chapter: Structure ──
  { caption: 'This is the real builder. On the left, a library of over 150 blocks across eight categories — layout, navigation, media, text, business, and more.', target: 'demo-palette', duration: 4400, apply: s => ({ ...s, phase: 'editor' }) },

  { caption: 'Every site starts with navigation. We drag a Navbar from the palette…', target: 'demo-palette', duration: 2600, apply: s => ({ ...s, category: 'navigation' }) },
  { caption: '…and drop it on the canvas. Your header is live.', target: 'demo-canvas', duration: 2400, apply: s => add(s, 'navbar') },

  { caption: 'Next, a hero banner to greet visitors.', target: 'demo-palette', duration: 2200, apply: s => ({ ...s, category: 'layout' }) },
  { caption: 'Drop the Hero Section right below the navbar.', target: 'demo-canvas', duration: 2200, apply: s => add(s, 'hero') },

  { caption: 'Select any block and the Properties panel opens on the right — edit content, colors, spacing, fonts, animations.', target: 'demo-props', duration: 4000, apply: s => ({ ...s, panel: 'properties', selectedId: 'demo-hero' }) },
  { caption: 'Change the headline, and the canvas updates instantly.', target: 'demo-canvas', duration: 2600, apply: s => setHero(s) },

  { caption: 'A features row highlights what makes you special.', target: 'demo-palette', duration: 2200, apply: s => ({ ...s, category: 'business' }) },
  { caption: 'Clean, responsive, on-brand — automatically.', target: 'demo-canvas', duration: 2200, apply: s => add(s, 'features') },

  { caption: 'Now the storefront — a product grid wired to your real catalog.', target: 'demo-palette', duration: 2600, apply: s => ({ ...s, category: 'business' }) },
  { caption: 'Drop it in — products, prices and badges render automatically.', target: 'demo-canvas', duration: 2400, apply: s => add(s, 'product-card') },
  { caption: 'And the Properties panel can pull real products straight from your inventory with one click.', target: 'demo-props', duration: 3600, apply: s => ({ ...s, panel: 'properties', selectedId: 'demo-product-card' }) },

  { caption: 'Social proof matters — add customer testimonials.', target: 'demo-canvas', duration: 2400, apply: s => add(s, 'testimonials') },
  { caption: 'A footer ties everything together — links, contact, social.', target: 'demo-canvas', duration: 2600, apply: s => add(s, 'footer') },

  { caption: 'And the secret sauce — a floating mini-cart, so shoppers check out from any page.', target: 'demo-palette', duration: 3000, apply: s => ({ ...s, category: 'business' }) },
  { caption: 'It stays in sync with every "Add to cart" across the whole site.', target: 'demo-canvas', duration: 2800, apply: s => add(s, 'mini-cart') },

  // ── Chapter: Connected to your business ──
  { caption: 'Now connect it to the rest of your business. Add a contact form…', target: 'demo-palette', duration: 2600, apply: s => ({ ...s, category: 'interactive' }) },
  { caption: '…and every submission lands straight in your Contacts module as a new lead — no integrations to set up.', target: 'demo-canvas', duration: 4000, apply: s => add(s, 'contact-form') },
  { caption: 'It works across the platform: product blocks pull from your Inventory, bookings create Service Orders, checkouts become Sales.', target: 'demo-canvas', duration: 4600, apply: s => s },

  // ── Chapter: SEO ──
  { caption: "Let's help customers find you. Open the SEO panel.", target: 'demo-props', duration: 2600, apply: s => ({ ...s, panel: 'seo', selectedId: null }) },
  { caption: 'Set the page title and meta description that Google shows in search results.', target: 'demo-props', duration: 3600, apply: s => ({ ...s, panel: 'seo', seo: { title: 'My Store — Summer Collection 2026', description: 'Shop the new summer collection. Free shipping over $50. Fast delivery, easy returns.' } }) },
  { caption: 'Add a social share image, and your links look polished on Facebook, X, and WhatsApp.', target: 'demo-props', duration: 3600, apply: s => ({ ...s, panel: 'seo', seo: { ...s.seo, ogTitle: 'Summer Collection 2026', ogDescription: 'New arrivals — free shipping over $50.' } }) },

  // ── Chapter: Brand & devices ──
  { caption: 'Open the Theme panel to rebrand the entire site — colors, fonts, button styles, and even your store currency.', target: 'demo-panel-theme', duration: 4000, apply: s => ({ ...s, panel: 'theme' }) },
  { caption: 'Change the primary color, and every block follows — instantly.', target: 'demo-canvas', duration: 2800, apply: s => ({ ...s, theme: { ...s.theme, primaryColor: '#16a34a' } }) },

  { caption: 'Full per-device control. Switch to mobile…', target: 'demo-device-mobile', duration: 2600, apply: s => ({ ...s, device: 'mobile' }) },
  { caption: 'Everything reflows perfectly for small screens — and you can hide any block per device.', target: 'demo-canvas', duration: 3000, apply: s => s },
  { caption: 'Back to desktop.', target: 'demo-device-desktop', duration: 1600, apply: s => ({ ...s, device: 'desktop', panel: 'properties' }) },

  // ── Chapter: Pages & publish ──
  { caption: 'A real site has more than one page. Add Shop, About, and Contact pages — each with its own blocks and its own SEO.', target: 'demo-palette', duration: 4400, apply: s => ({ ...s, category: 'layout' }) },
  { caption: 'You can also add languages, version history, and reusable global blocks like a shared header and footer.', target: 'demo-palette', duration: 4200, apply: s => s },

  { caption: 'When you are happy, hit Publish — your site goes live on its own URL, ready to share.', target: 'demo-preview', duration: 3400, apply: s => ({ ...s, selectedId: null, panel: 'properties' }) },
  { caption: "And that's it — from picking a template to a complete, connected store, built from scratch in minutes. Your turn!", target: 'demo-canvas', duration: 4000, apply: s => s },
];

export const WB_CHAPTERS: WBChapter[] = [
  { id: 'start', title: 'Choose a Start', start: 0, end: 6 },
  { id: 'structure', title: 'Structure', start: 6, end: 13 },
  { id: 'store', title: 'Storefront', start: 13, end: 22 },
  { id: 'connect', title: 'Connect & SEO', start: 22, end: 28 },
  { id: 'publish', title: 'Brand & Publish', start: 28, end: WB_STEPS.length },
];

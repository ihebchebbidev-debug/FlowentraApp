import { PaletteItem } from '../../types';

export const LAYOUT_PALETTE: PaletteItem[] = [
  {
    type: 'hero', label: 'Hero Section', icon: 'Layout', category: 'layout',
    description: 'Full-width banner with CTA',
    defaultProps: { heading: 'Welcome to Our Website', subheading: 'Build something amazing today', ctaText: 'Get Started', ctaLink: '#', backgroundImage: '', alignment: 'center', height: 'medium', overlayOpacity: 40, variant: 'standard' },
  },
  {
    type: 'hero', label: 'Hero Carousel', icon: 'GalleryHorizontal', category: 'layout',
    description: 'Sliding hero with auto-scroll',
    defaultProps: {
      heading: '', subheading: '', variant: 'carousel',
      autoPlay: true, autoPlayInterval: 5, transition: 'fade',
      showDots: true, showArrows: true, pauseOnHover: true,
      alignment: 'center', height: 'large',
      slides: [
        { heading: 'Welcome to Our Website', subheading: 'Slide 1 description', backgroundImage: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1920&q=80', overlayOpacity: 40, buttons: [{ text: 'Get Started', link: '#', variant: 'primary' }] },
        { heading: 'Discover Amazing Features', subheading: 'Slide 2 description', backgroundImage: 'https://images.unsplash.com/photo-1497215842964-222b430dc094?w=1920&q=80', overlayOpacity: 40, buttons: [{ text: 'Learn More', link: '#', variant: 'primary' }] },
        { heading: 'Join Us Today', subheading: 'Slide 3 description', backgroundImage: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1920&q=80', overlayOpacity: 40, buttons: [{ text: 'Sign Up', link: '#', variant: 'primary' }] },
      ],
    },
  },
  {
    type: 'hero', label: 'Split Hero', icon: 'PanelLeftClose', category: 'layout',
    description: 'Side-by-side image & content',
    defaultProps: {
      heading: 'Build Something Great', subheading: 'A modern approach to web development with powerful tools.', variant: 'split',
      ctaText: 'Get Started', ctaLink: '#', alignment: 'left', height: 'large',
      splitImage: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=960&q=80', splitPosition: 'right',
    },
  },
  {
    type: 'hero', label: 'Gradient Hero', icon: 'Palette', category: 'layout',
    description: 'Hero with gradient background',
    defaultProps: {
      heading: 'Stunning Gradient Hero', subheading: 'Eye-catching gradients that make your site stand out.', variant: 'gradient',
      ctaText: 'Explore', ctaLink: '#', alignment: 'center', height: 'medium',
      gradientAngle: 135,
    },
  },
  {
    type: 'hero', label: 'Video Hero', icon: 'Play', category: 'layout',
    description: 'Hero with looping video BG',
    defaultProps: {
      heading: 'Cinematic Experience', subheading: 'Engage visitors with a stunning video background.', variant: 'video-bg',
      ctaText: 'Watch More', ctaLink: '#', alignment: 'center', height: 'large',
      videoUrl: '', overlayOpacity: 50,
    },
  },
  // ── Section Variants ──
  {
    type: 'section', label: 'Section', icon: 'Square', category: 'layout',
    description: 'Content container with padding',
    defaultProps: { padding: 'py-16 px-6', background: 'transparent', variant: 'default', maxWidth: 'md' },
  },
  {
    type: 'section', label: 'Glass Section', icon: 'Sparkles', category: 'layout',
    description: 'Glassmorphism frosted container',
    defaultProps: { padding: 'py-16 px-6', variant: 'glass', maxWidth: 'md' },
  },
  {
    type: 'section', label: 'Gradient Section', icon: 'Palette', category: 'layout',
    description: 'Section with gradient background',
    defaultProps: { padding: 'py-16 px-6', variant: 'gradient', maxWidth: 'lg', gradientAngle: 135 },
  },
  {
    type: 'section', label: 'Pattern Section', icon: 'Grid3x3', category: 'layout',
    description: 'Section with subtle pattern overlay',
    defaultProps: { padding: 'py-16 px-6', variant: 'pattern', patternType: 'dots', patternOpacity: 0.05, maxWidth: 'lg' },
  },
  {
    type: 'section', label: 'Wave Section', icon: 'Waves', category: 'layout',
    description: 'Section with decorative wave edges',
    defaultProps: { padding: 'py-20 px-6', variant: 'wave', maxWidth: 'lg' },
  },
  // ── Column Variants ──
  {
    type: 'columns', label: 'Columns', icon: 'Columns3', category: 'layout',
    description: 'Multi-column responsive grid',
    defaultProps: { columns: 2, gap: 24, variant: 'default', layout: 'equal', verticalAlign: 'stretch' },
  },
  {
    type: 'columns', label: 'Card Columns', icon: 'LayoutGrid', category: 'layout',
    description: 'Columns with card styling',
    defaultProps: { columns: 3, gap: 24, variant: 'cards', layout: 'equal', verticalAlign: 'stretch' },
  },
  {
    type: 'columns', label: 'Sidebar Layout', icon: 'PanelLeft', category: 'layout',
    description: '1/3 + 2/3 asymmetric layout',
    defaultProps: { columns: 2, gap: 32, variant: 'default', layout: '1-2', verticalAlign: 'top' },
  },
  {
    type: 'columns', label: 'Highlighted Columns', icon: 'Rows3', category: 'layout',
    description: 'Columns with accent left border',
    defaultProps: { columns: 3, gap: 24, variant: 'highlighted', layout: 'equal', verticalAlign: 'stretch' },
  },
  {
    type: 'spacer', label: 'Spacer', icon: 'ArrowUpDown', category: 'layout',
    description: 'Vertical spacing between blocks',
    defaultProps: { height: 48 },
  },
  {
    type: 'divider', label: 'Divider', icon: 'Minus', category: 'layout',
    description: 'Horizontal line separator',
    defaultProps: { style: 'solid', color: '#e2e8f0', thickness: 1 },
  },
  {
    type: 'sticky', label: 'Sticky Section', icon: 'Pin', category: 'layout',
    description: 'Fixed content while scrolling',
    defaultProps: { content: '📌 This section stays visible while scrolling', position: 'top' },
  },
  {
    type: 'parallax', label: 'Parallax Section', icon: 'Layers', category: 'layout',
    description: 'Parallax scroll background',
    defaultProps: { imageUrl: '', heading: 'Parallax Section', subheading: 'With a beautiful fixed background', height: 'medium', overlayOpacity: 40 },
  },
];

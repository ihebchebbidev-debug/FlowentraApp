/**
 * PropertiesPanel configuration — extracted constants for cleaner component code.
 */

/** Keys that are colors (show color picker) */
export const COLOR_KEYS = new Set([
  'color', 'textColor', 'backgroundColor', 'bgColor', 'buttonColor',
  'buttonTextColor', 'overlayColor', 'borderColor', 'iconColor',
  'headingColor', 'subheadingColor', 'ctaColor', 'ctaTextColor',
  'secondaryCtaColor', 'secondaryCtaTextColor', 'accentColor',
  'badgeColor', 'badgeBgColor', 'gradientFrom', 'gradientTo',
  'titleColor', 'valueColor', 'labelColor',
]);

/** Keys that are fonts */
export const FONT_KEYS = new Set(['font', 'headingFont', 'bodyFont', 'fontFamily']);

/** Keys that are icons (show icon picker) */
export const ICON_KEYS = new Set(['icon', 'iconName', 'leftIcon', 'rightIcon', 'prefixIcon', 'suffixIcon']);

/** Keys that are logo images (show logo uploader) */
export const LOGO_KEYS = new Set(['logoImage', 'brandLogo', 'siteLogo', 'favicon']);

/** Keys that are logo text (handled by combined LogoEditor, not plain text input) */
export const LOGO_TEXT_KEYS = new Set(['logo', 'logoText']);

/** Keys that are image sources (show image uploader, NOT raw text) */
export const IMAGE_KEYS = new Set([
  'backgroundImage', 'imageUrl', 'coverImage', 'heroImage', 'thumbnailUrl',
  'bgImage', 'posterImage', 'bannerImage', 'profileImage',
]);

/** Keys that are URLs (non-image) */
export const URL_KEYS = new Set([
  'link', 'href', 'url', 'ctaLink', 'secondaryCtaLink',
  'videoUrl', 'audioUrl', 'mapUrl',
]);

/** Keys that should render as textareas */
export const TEXTAREA_KEYS = new Set([
  'content', 'description', 'text', 'subheading', 'bio', 'tagline', 'body',
  'answer', 'message', 'summary', 'excerpt', 'caption', 'copyright',
]);

/** Component types that have CTA buttons */
export const CTA_COMPONENTS = new Set(['hero', 'cta-banner', 'banner', 'section']);

/** Component types that have form settings */
export const FORM_COMPONENTS = new Set(['form', 'contact-form', 'newsletter', 'login-form', 'signup-form', 'checkout']);

/** Known select option maps */
export const SELECT_OPTIONS: Record<string, { label: string; value: string }[]> = {
  alignment: [{ label: 'Left', value: 'left' }, { label: 'Center', value: 'center' }, { label: 'Right', value: 'right' }],
  height: [{ label: 'Small', value: 'small' }, { label: 'Medium', value: 'medium' }, { label: 'Large', value: 'large' }, { label: 'Full Screen', value: 'fullscreen' }],
  size: [{ label: 'Small', value: 'sm' }, { label: 'Medium', value: 'md' }, { label: 'Large', value: 'lg' }, { label: 'Extra Large', value: 'xl' }],
  variant: [{ label: 'Primary', value: 'primary' }, { label: 'Secondary', value: 'secondary' }, { label: 'Outline', value: 'outline' }, { label: 'Ghost', value: 'ghost' }],
  level: [{ label: 'H1', value: 'h1' }, { label: 'H2', value: 'h2' }, { label: 'H3', value: 'h3' }, { label: 'H4', value: 'h4' }, { label: 'H5', value: 'h5' }, { label: 'H6', value: 'h6' }],
  layout: [{ label: 'Horizontal', value: 'horizontal' }, { label: 'Vertical', value: 'vertical' }, { label: 'Grid', value: 'grid' }],
  imagePosition: [{ label: 'Left', value: 'left' }, { label: 'Right', value: 'right' }],
  direction: [{ label: 'LTR (Left to Right)', value: 'ltr' }, { label: 'RTL (Right to Left)', value: 'rtl' }],
  columns: [{ label: '1 Column', value: '1' }, { label: '2 Columns', value: '2' }, { label: '3 Columns', value: '3' }, { label: '4 Columns', value: '4' }],
  fontSize: [{ label: 'Small', value: 'sm' }, { label: 'Normal', value: 'base' }, { label: 'Large', value: 'lg' }, { label: 'Extra Large', value: 'xl' }],
  position: [{ label: 'Top', value: 'top' }, { label: 'Bottom', value: 'bottom' }],
  stickyPosition: [{ label: 'Top', value: 'top' }, { label: 'Bottom', value: 'bottom' }],
  displayMode: [{ label: 'Floating', value: 'floating' }, { label: 'Sticky Bar', value: 'sticky-bar' }, { label: 'Inline Button', value: 'inline-button' }, { label: 'Sticky Side', value: 'sticky-side' }],
  iconSize: [{ label: 'Small', value: 'sm' }, { label: 'Medium', value: 'md' }, { label: 'Large', value: 'lg' }],
  cardStyle: [{ label: 'Bordered', value: 'bordered' }, { label: 'Shadow', value: 'shadow' }, { label: 'Minimal', value: 'minimal' }],
  successAction: [{ label: 'Show Message', value: 'message' }, { label: 'Redirect', value: 'redirect' }, { label: 'Reset Form', value: 'reset' }],
  webhookMethod: [{ label: 'POST', value: 'POST' }, { label: 'GET', value: 'GET' }],
  iconType: [{ label: 'Mail', value: 'mail' }, { label: 'Bell', value: 'bell' }, { label: 'Sparkles', value: 'sparkles' }, { label: 'Send', value: 'send' }, { label: 'Inbox', value: 'inbox' }],
  onErrorAction: [{ label: 'Show Message', value: 'show_message' }, { label: 'Retry', value: 'retry' }, { label: 'Redirect', value: 'redirect' }],
  // Map block options
  mapTheme: [
    { label: 'Default', value: 'default' },
    { label: 'Light', value: 'light' },
    { label: 'Dark', value: 'dark' },
    { label: 'Satellite', value: 'satellite' },
    { label: 'Streets', value: 'streets' },
    { label: 'Outdoors', value: 'outdoors' },
    { label: 'Grayscale', value: 'grayscale' },
    { label: 'Watercolor', value: 'watercolor' },
  ],
  mapVariant: [
    { label: 'Map Only', value: 'map-only' },
    { label: 'Map with Info', value: 'map-with-info' },
    { label: 'Split Layout', value: 'split' },
    { label: 'Overlay Card', value: 'overlay' },
  ],
  infoPosition: [
    { label: 'Left', value: 'left' },
    { label: 'Right', value: 'right' },
    { label: 'Top', value: 'top' },
    { label: 'Bottom', value: 'bottom' },
  ],
};

/** Array field definitions for known component types */
export const ARRAY_FIELD_DEFS: Record<string, { key: string; label: string; type?: 'text' | 'textarea' | 'color' | 'number' }[]> = {
  features: [{ key: 'icon', label: 'Icon' }, { key: 'title', label: 'Title' }, { key: 'description', label: 'Description', type: 'textarea' }],
  testimonials: [{ key: 'name', label: 'Name' }, { key: 'role', label: 'Role' }, { key: 'text', label: 'Quote', type: 'textarea' }, { key: 'avatar', label: 'Avatar URL' }, { key: 'rating', label: 'Rating', type: 'number' }],
  plans: [{ key: 'name', label: 'Plan Name' }, { key: 'price', label: 'Price' }, { key: 'highlighted', label: 'Highlighted' }],
  services: [{ key: 'icon', label: 'Icon' }, { key: 'title', label: 'Title' }, { key: 'description', label: 'Description', type: 'textarea' }, { key: 'price', label: 'Price' }],
  links: [{ key: 'label', label: 'Label' }, { key: 'href', label: 'URL' }],
  items: [{ key: 'icon', label: 'Icon' }, { key: 'title', label: 'Title' }, { key: 'description', label: 'Description', type: 'textarea' }, { key: 'date', label: 'Date' }],
  images: [{ key: 'url', label: 'Image URL' }, { key: 'caption', label: 'Caption' }, { key: 'alt', label: 'Alt Text' }],
  stats: [{ key: 'value', label: 'Value' }, { key: 'label', label: 'Label' }, { key: 'prefix', label: 'Prefix' }, { key: 'suffix', label: 'Suffix' }],
  badges: [{ key: 'icon', label: 'Icon' }, { key: 'label', label: 'Label' }],
  reviews: [{ key: 'name', label: 'Name' }, { key: 'rating', label: 'Rating', type: 'number' }, { key: 'text', label: 'Review', type: 'textarea' }, { key: 'date', label: 'Date' }, { key: 'avatar', label: 'Avatar URL' }],
  members: [{ key: 'name', label: 'Name' }, { key: 'role', label: 'Role' }, { key: 'bio', label: 'Bio', type: 'textarea' }, { key: 'avatar', label: 'Avatar URL' }, { key: 'email', label: 'Email' }],
  socialLinks: [{ key: 'platform', label: 'Platform' }, { key: 'url', label: 'URL' }],
  tabs: [{ key: 'label', label: 'Tab Label' }, { key: 'content', label: 'Content', type: 'textarea' }],
  posts: [{ key: 'title', label: 'Title' }, { key: 'excerpt', label: 'Excerpt', type: 'textarea' }, { key: 'category', label: 'Category' }, { key: 'date', label: 'Date' }, { key: 'author', label: 'Author' }],
  products: [{ key: 'name', label: 'Name' }, { key: 'price', label: 'Price' }, { key: 'oldPrice', label: 'Old Price' }, { key: 'description', label: 'Description', type: 'textarea' }, { key: 'badge', label: 'Badge' }],
  comments: [{ key: 'author', label: 'Author' }, { key: 'text', label: 'Comment', type: 'textarea' }, { key: 'date', label: 'Date' }, { key: 'likes', label: 'Likes', type: 'number' }],
  tags: [{ key: 'label', label: 'Tag' }, { key: 'count', label: 'Count', type: 'number' }],
  logos: [{ key: 'url', label: 'Logo URL' }],
  fields: [{ key: 'label', label: 'Label' }, { key: 'type', label: 'Type' }, { key: 'placeholder', label: 'Placeholder' }],
  headers: [{ key: 'value', label: 'Header' }],
  rows: [{ key: 'feature', label: 'Feature' }],
  languages: [{ key: 'code', label: 'Code' }, { key: 'label', label: 'Label' }, { key: 'direction', label: 'Direction' }],
  menus: [{ key: 'label', label: 'Menu Label' }],
};

/** Default values when creating new array items */
export const ARRAY_DEFAULTS: Record<string, Record<string, any>> = {
  features: { icon: '✨', title: 'New Feature', description: 'Description' },
  testimonials: { name: 'Name', role: 'Role', text: 'Quote', avatar: '', rating: 5 },
  plans: { name: 'Plan', price: '$0', features: [], highlighted: false },
  services: { icon: '🔧', title: 'Service', description: 'Description', price: 'From $0' },
  links: { label: 'Link', href: '#' },
  items: { icon: '📌', title: 'Item', description: 'Description', date: '' },
  images: { url: '', caption: 'Image', alt: '' },
  stats: { value: '0', label: 'Stat', prefix: '', suffix: '' },
  badges: { icon: '✓', label: 'Badge' },
  reviews: { name: 'Name', rating: 5, text: 'Review', date: 'Today', avatar: '' },
  members: { name: 'Name', role: 'Role', bio: '', avatar: '', email: '' },
  socialLinks: { platform: 'Website', url: '#' },
  tabs: { label: 'Tab', content: 'Content' },
  posts: { title: 'New Post', excerpt: 'Excerpt...', category: 'General', date: 'Today', author: 'Author' },
  products: { name: 'Product', price: '$0', oldPrice: '', description: 'Description', badge: '' },
  comments: { author: 'Author', text: 'Comment...', date: 'Now', likes: 0 },
  tags: { label: 'Tag', count: 0 },
  logos: { url: '' },
  fields: { label: 'Field', type: 'text', placeholder: '' },
  headers: { value: 'Header' },
  rows: { feature: 'Feature', values: [] },
  languages: { code: 'en', label: 'English', direction: 'ltr' },
  menus: { label: 'Menu', items: [] },
};

/** Format a camelCase key into a human-readable label */
export function formatLabel(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, s => s.toUpperCase())
    .replace('Cta', 'CTA')
    .replace('Url', 'URL')
    .replace('Bg', 'Background')
    .trim();
}

/** Check if a key/value pair represents a color */
export function isColorValue(key: string, value: any): boolean {
  if (COLOR_KEYS.has(key)) return true;
  if (typeof value === 'string' && /^#[0-9a-fA-F]{3,8}$/.test(value)) return true;
  if (typeof value === 'string' && key.toLowerCase().includes('color')) return true;
  return false;
}

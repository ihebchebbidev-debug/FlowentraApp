import { SiteTemplate } from '../index';
import { IMG } from '../images';
import { comp, page, makeNavbar, makeFooter } from '../helpers';

const MINIMAL_THEME = {
  primaryColor: '#18181b',
  secondaryColor: '#71717a',
  accentColor: '#18181b',
  backgroundColor: '#ffffff',
  textColor: '#18181b',
  headingFont: 'Inter, sans-serif',
  bodyFont: 'Inter, sans-serif',
  borderRadius: 4,
  spacing: 24,
  shadowStyle: 'none' as const,
  direction: 'ltr' as const,
  fontScale: 1,
  buttonStyle: 'square' as const,
};

const nav = makeNavbar('Minimal.', [
  { label: 'Work', href: '#' },
  { label: 'About', href: '#' },
  { label: 'Contact', href: '#contact' },
], '');

const foot = makeFooter('Minimal.', 'Less is more.', '', 'hello@minimal.design');

export const contactPageMinimalTemplate: SiteTemplate = {
  id: 'contact-page-minimal',
  name: 'Contact Page - Minimal',
  description: 'Clean, minimalist contact page with subtle map styling and focused user experience.',
  icon: '⬜',
  category: 'Contact Pages',
  theme: MINIMAL_THEME,
  pageCount: 1,
  features: [
    'Grayscale map theme',
    'Minimal contact form',
    'Clean typography',
    'Focus on essentials',
  ],
  previewImage: IMG.portfolioHero,
  pages: () => [
    page('Contact', '', [
      nav(),
      
      // Simple spacer
      comp('spacer', 'Top Spacer', { height: 80 }),
      
      // Centered heading
      comp('heading', 'Contact Title', {
        text: 'Contact',
        level: 'h1',
        alignment: 'center',
      }),
      
      comp('paragraph', 'Contact Subtitle', {
        text: 'Have a project in mind? Let\'s talk.',
        alignment: 'center',
        size: 'lg',
      }),
      
      comp('spacer', 'Spacer', { height: 48 }),
      
      // Simple contact form
      comp('contact-form', 'Contact Form', {
        title: '',
        subtitle: '',
        fields: ['name', 'email', 'message'],
        submitText: 'Send',
        variant: 'minimal',
        showIcon: false,
      }),
      
      comp('spacer', 'Spacer', { height: 64 }),
      
      // Grayscale map - full width
      comp('map', 'Location', {
        address: '100 Main Street, Portland, OR 97201',
        latitude: 45.5152,
        longitude: -122.6784,
        zoom: 14,
        height: 400,
        mapTheme: 'grayscale',
        variant: 'map-only',
        showZoomControl: false,
        showAttribution: false,
        draggable: false,
        scrollWheelZoom: false,
      }),
      
      comp('spacer', 'Spacer', { height: 64 }),
      
      // Simple info grid
      comp('columns', 'Info Grid', {
        columns: 3,
        gap: 48,
      }),
      
      comp('icon-text', 'Email', {
        icon: 'Mail',
        title: 'Email',
        description: 'hello@minimal.design',
        alignment: 'center',
      }),
      
      comp('icon-text', 'Location', {
        icon: 'MapPin',
        title: 'Location',
        description: 'Portland, Oregon',
        alignment: 'center',
      }),
      
      comp('icon-text', 'Hours', {
        icon: 'Clock',
        title: 'Hours',
        description: 'Mon — Fri, 9am — 5pm',
        alignment: 'center',
      }),
      
      comp('spacer', 'Bottom Spacer', { height: 80 }),
      
      foot(),
    ], true, 0),
  ],
};

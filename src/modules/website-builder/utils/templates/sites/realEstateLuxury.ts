import { SiteTemplate } from '../index';
import { IMG, AVATAR } from '../images';
import { comp, page, makeNavbar, makeFooter } from '../helpers';
import { SiteTheme } from '../../../types';

/**
 * Real Estate — Luxury / Boutique variant.
 * Editorial, dark, and gallery-driven. Focused on high-end listings,
 * one lead broker, and neighborhood storytelling. 4 pages.
 */
const LUXE_RE_THEME: SiteTheme = {
  primaryColor: '#c9a96e',
  secondaryColor: '#334155',
  accentColor: '#f8fafc',
  backgroundColor: '#0c0f14',
  textColor: '#f5f5f4',
  headingFont: 'Cormorant Garamond, serif',
  bodyFont: 'Inter, sans-serif',
  borderRadius: 4,
  spacing: 24,
  shadowStyle: 'dramatic',
  buttonStyle: 'outlined',
  sectionPadding: 1.4,
  fontScale: 1.08,
  letterSpacing: 0.02,
  linkStyle: 'none',
  headingTransform: 'uppercase',
};

export const realEstateLuxuryTemplate: SiteTemplate = {
  id: 'real-estate-luxury',
  name: 'Real Estate — Luxury',
  description: 'Editorial dark real estate site for high-end brokers — cinematic hero, featured listings, neighborhood guides and private consultation.',
  icon: '🏛️',
  category: 'Real Estate',
  theme: LUXE_RE_THEME,
  pageCount: 4,
  features: [
    'Cinematic hero', 'Featured properties', 'Neighborhood guides',
    'Broker profile', 'Testimonials', 'Private consultation form', 'Press logos',
  ],
  previewImage: IMG.realEstateHero,
  pages: () => {
    const nav = makeNavbar('MERIDIAN', [
      { label: 'Portfolio', href: '#portfolio' },
      { label: 'Neighborhoods', href: '#neighborhoods' },
      { label: 'About', href: '#about' },
      { label: 'Contact', href: '#contact' },
    ], 'Private Consultation');

    const foot = makeFooter(
      'Meridian Estates',
      'Private brokerage for extraordinary properties.',
      '(555) 202-4488',
      'private@meridian-estates.com',
      {
        links: [
          { label: 'Portfolio', href: '#portfolio' },
          { label: 'Sell With Us', href: '#contact' },
          { label: 'Press', href: '#press' },
          { label: 'Privacy', href: '#' },
        ],
        socialLinks: [
          { platform: 'instagram', url: '#' },
          { platform: 'linkedin', url: '#' },
        ],
      },
    );

    return [
      // ── Home ──
      page('Home', '', [
        nav(),
        comp('hero', 'Hero', {
          heading: 'Homes with a story.',
          subheading: 'A private brokerage representing a small, deliberate portfolio of extraordinary properties across Europe.',
          ctaText: 'View Portfolio',
          ctaLink: '#portfolio',
          secondaryCtaText: 'Schedule Consultation',
          secondaryCtaLink: '#contact',
          alignment: 'left',
          height: 'fullscreen',
          backgroundImage: IMG.realEstateHero,
          overlayOpacity: 55,
        }),
        comp('animated-stats', 'Stats', {
          stats: [
            { value: '380', label: 'Homes placed', prefix: '' },
            { value: '2.1', label: 'Sales volume', prefix: '€', suffix: 'B' },
            { value: '22', label: 'Years' },
            { value: '9', label: 'Cities' },
          ],
          variant: 'minimal',
          columns: 4,
        }),
        comp('image-text', 'Featured 1', {
          title: 'Villa Aurelio · Cascais',
          description: 'A restored 1904 estate above the Atlantic. 720 m², six suites, a terraced garden, and 40 metres of private coastline. Represented exclusively.',
          imageUrl: IMG.houseInterior,
          imagePosition: 'right',
          ctaText: 'Inquire privately',
          ctaLink: '#contact',
        }),
        comp('image-text', 'Featured 2', {
          title: 'Casa das Oliveiras · Alentejo',
          description: 'A working olive estate, sensitively renovated. 14 hectares, a main house, two guest cottages, and a spring-fed pool cut into the hillside.',
          imageUrl: IMG.house1,
          imagePosition: 'left',
          ctaText: 'Inquire privately',
          ctaLink: '#contact',
        }),
        comp('gallery-masonry', 'Portfolio grid', {
          title: 'Selected Portfolio',
          columns: 3,
          images: [
            { url: IMG.house1, caption: 'Cascais · €4.9M' },
            { url: IMG.house2, caption: 'Chiado, Lisbon · €2.3M' },
            { url: IMG.house3, caption: 'Comporta · €6.8M' },
            { url: IMG.houseInterior, caption: 'Sintra · €3.4M' },
            { url: IMG.realEstateHero, caption: 'Estoril · €5.1M' },
            { url: IMG.house2, caption: 'Alentejo · €7.6M' },
          ],
        }),
        comp('logo-cloud', 'Press', {
          title: 'As seen in',
          logos: ['Financial Times', 'Monocle', 'Wallpaper*', 'Architectural Digest', 'The Wall Street Journal'],
        }),
        comp('testimonials', 'Clients', {
          title: 'What our clients say',
          variant: 'carousel',
          testimonials: [
            { name: 'A. & D. Rothstein', role: 'Purchased in Sintra', text: 'Meridian understood exactly what we wanted before we did. Discreet, thoughtful, and relentless in the best way.', rating: 5, avatar: AVATAR.w1 },
            { name: 'Sir Julian W.', role: 'Sold in Estoril', text: 'They found a buyer we would never have reached ourselves. The entire process was quiet and precise.', rating: 5, avatar: AVATAR.m1 },
            { name: 'The Almeida family', role: 'Purchased in Comporta', text: 'Small brokerage, exceptional service. We would not use anyone else.', rating: 5, avatar: AVATAR.w2 },
          ],
        }),
        comp('cta-banner', 'CTA', {
          heading: 'Considering a move?',
          subheading: 'A private, confidential conversation. Always by appointment.',
          ctaText: 'Schedule Consultation',
          ctaLink: '#contact',
        }),
        foot(),
      ], true, 0),

      // ── Portfolio ──
      page('Portfolio', 'portfolio', [
        nav(),
        comp('hero', 'Portfolio Hero', {
          heading: 'Portfolio',
          subheading: 'A curated selection of currently and recently represented properties.',
          alignment: 'center',
          height: 'small',
        }),
        comp('service-card', 'Listings', {
          title: 'Currently listed',
          services: [
            { icon: '🏛️', title: 'Villa Aurelio · Cascais', description: '720 m² · 6 suites · Private coastline · €12.5M', price: '' },
            { icon: '🌿', title: 'Casa das Oliveiras · Alentejo', description: '14 ha · Working olive estate · €7.6M', price: '' },
            { icon: '🏙️', title: 'Penthouse Chiado · Lisbon', description: '320 m² · Duplex · River views · €4.9M', price: '' },
            { icon: '🌊', title: 'Beach House · Comporta', description: '410 m² · Pine forest to ocean · €6.8M', price: '' },
            { icon: '🍇', title: 'Quinta do Vale · Douro', description: '38 ha · Vineyard estate · €9.2M', price: '' },
            { icon: '🏰', title: 'Palácio · Sintra', description: '1,100 m² · 19th c. palace · €14.0M', price: '' },
          ],
        }),
        comp('cta-banner', 'Private list', {
          heading: 'Off-market properties',
          subheading: 'We represent a number of listings that are never publicly advertised. Share your brief privately.',
          ctaText: 'Request Private List',
          ctaLink: '#contact',
        }),
        foot(),
      ], false, 1),

      // ── Neighborhoods ──
      page('Neighborhoods', 'neighborhoods', [
        nav(),
        comp('hero', 'Neighborhoods Hero', {
          heading: 'Neighborhoods',
          subheading: 'The regions we know best — and why our clients choose them.',
          alignment: 'center',
          height: 'small',
        }),
        comp('features', 'Regions', {
          title: 'Where we work',
          columns: 3,
          features: [
            { icon: '🌊', title: 'Cascais & Estoril', description: 'Coastal, cosmopolitan, 25 minutes from Lisbon. Best for families.' },
            { icon: '🏙️', title: 'Lisbon Historic', description: 'Chiado, Príncipe Real, Alfama. City life, walkable, river-facing.' },
            { icon: '🌲', title: 'Sintra', description: 'Forest, palaces, cool microclimate. UNESCO heritage.' },
            { icon: '🏖️', title: 'Comporta', description: 'Pine forests, rice paddies, uncrowded Atlantic beaches.' },
            { icon: '🍇', title: 'Douro Valley', description: 'Terraced vineyards, river estates, working wine country.' },
            { icon: '🌾', title: 'Alentejo', description: 'Cork oak, olive groves, whitewashed hilltop villages.' },
          ],
        }),
        comp('image-text', 'Insight', {
          title: 'Local knowledge that isn\'t on Zillow',
          description: 'The right house in the wrong village is still the wrong purchase. We spend time in every region we represent — we know the mayors, the notaries, the neighbours and the seasons. That is what you are actually hiring us for.',
          imageUrl: IMG.travelMountain,
          imagePosition: 'right',
        }),
        foot(),
      ], false, 2),

      // ── Contact ──
      page('Contact', 'contact', [
        nav(),
        comp('hero', 'Contact Hero', {
          heading: 'Private Consultation',
          subheading: 'By appointment. Everything you share stays with us.',
          alignment: 'center',
          height: 'small',
        }),
        comp('contact-form', 'Form', {
          title: 'Tell us what you are looking for',
          subtitle: 'A senior broker will reply personally within 24 hours.',
          fields: ['name', 'email', 'phone', 'message'],
          submitText: 'Request Consultation',
          variant: 'card',
        }),
        comp('team-grid', 'Broker', {
          title: 'Your broker',
          members: [
            { name: 'Isabel Meireles', role: 'Founder & Principal Broker', bio: 'Twenty-two years placing homes across Portugal, Spain and Italy. Speaks EN, PT, FR, IT.', avatar: AVATAR.w2 },
          ],
        }),
        comp('icon-text', 'Info', {
          items: [
            { icon: '📞', title: 'Telephone', description: '(555) 202-4488' },
            { icon: '✉️', title: 'Email', description: 'private@meridian-estates.com' },
            { icon: '📍', title: 'Office', description: 'Rua Ivens 38, Chiado, Lisbon' },
            { icon: '⏰', title: 'Hours', description: 'Mon–Fri · By appointment only' },
          ],
          layout: 'horizontal',
        }),
        foot(),
      ], false, 3),
    ];
  },
};

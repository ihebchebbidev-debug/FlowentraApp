import { SiteTemplate } from '../index';
import { IMG, AVATAR } from '../images';
import { comp, page, makeNavbar, makeFooter } from '../helpers';
import { SiteTheme } from '../../../types';

/**
 * Eco Brand — sustainable / ethical brand storytelling.
 * For direct-to-consumer eco products, B-corps, or impact organizations.
 * 4 pages: Home, Products, Impact, Contact.
 */
const ECO_THEME: SiteTheme = {
  primaryColor: '#2f6b3a',
  secondaryColor: '#5b6b52',
  accentColor: '#e7c15b',
  backgroundColor: '#f6f2ea',
  textColor: '#1c2b1d',
  headingFont: 'DM Serif Display, serif',
  bodyFont: 'Nunito, sans-serif',
  borderRadius: 14,
  spacing: 20,
  shadowStyle: 'subtle',
  buttonStyle: 'pill',
  sectionPadding: 1.2,
  fontScale: 1.02,
  letterSpacing: 0,
  linkStyle: 'hover-underline',
  headingTransform: 'none',
};

export const ecoBrandTemplate: SiteTemplate = {
  id: 'eco-brand',
  name: 'Eco / Sustainable Brand',
  description: 'Warm, earthy brand site for sustainable products and B-corps — story, product range, impact report and traceability.',
  icon: '🌿',
  category: 'E-commerce',
  theme: ECO_THEME,
  pageCount: 4,
  features: [
    'Storytelling hero', 'Impact stats', 'Product grid',
    'Traceability / supply chain', 'Certifications', 'Journal / stories', 'Newsletter',
  ],
  previewImage: IMG.ecomLifestyle,
  pages: () => {
    const nav = makeNavbar('🌿 Verdant', [
      { label: 'Shop', href: '#products' },
      { label: 'Impact', href: '#impact' },
      { label: 'Journal', href: '#journal' },
      { label: 'About', href: '#about' },
    ], 'Shop All');

    const foot = makeFooter(
      'Verdant Goods Co.',
      'Everyday essentials, honestly made.',
      '(555) 314-7710',
      'hello@verdantgoods.co',
      {
        links: [
          { label: 'Shop', href: '#products' },
          { label: 'Our Impact', href: '#impact' },
          { label: 'Materials', href: '#materials' },
          { label: 'Returns', href: '#' },
        ],
        socialLinks: [
          { platform: 'instagram', url: '#' },
          { platform: 'pinterest', url: '#' },
          { platform: 'tiktok', url: '#' },
        ],
      },
    );

    return [
      // ── Home ──
      page('Home', '', [
        nav(),
        comp('announcement-bar', 'Notice', {
          text: '🌱 Carbon-neutral shipping on every order. Always.',
          variant: 'primary',
        }),
        comp('hero', 'Hero', {
          heading: 'Everyday goods, honestly made.',
          subheading: 'Verdant makes small-batch home essentials from organic and reclaimed materials — traceable from field to shelf.',
          ctaText: 'Shop the range',
          ctaLink: '#products',
          secondaryCtaText: 'Our impact',
          secondaryCtaLink: '#impact',
          alignment: 'left',
          height: 'large',
          backgroundImage: IMG.ecomLifestyle,
          overlayOpacity: 30,
        }),
        comp('animated-stats', 'Impact stats', {
          stats: [
            { value: '84', label: 'Tonnes CO₂ avoided', suffix: 't' },
            { value: '100', label: 'Certified organic', suffix: '%' },
            { value: '12', label: 'Partner farms' },
            { value: '2', label: 'Trees per order', suffix: '×' },
          ],
          variant: 'minimal',
          columns: 4,
        }),
        comp('features', 'Values', {
          title: 'What we stand for',
          subtitle: 'Four commitments we do not compromise on.',
          columns: 4,
          features: [
            { icon: '🌱', title: 'Organic materials', description: 'Every fibre is GOTS-certified organic or reclaimed post-consumer.' },
            { icon: '🤝', title: 'Fair pay', description: 'Living wage across every step, from cotton field to sewing floor.' },
            { icon: '🌍', title: 'Carbon-neutral', description: 'Shipping and operations offset with vetted, verifiable projects.' },
            { icon: '🔄', title: 'Made to last', description: 'Repairs offered for the lifetime of every product we ship.' },
          ],
        }),
        comp('service-card', 'Product preview', {
          title: 'Bestsellers',
          services: [
            { icon: '🧺', title: 'Linen Bath Set', description: 'GOTS organic French linen · 4 pieces', price: '$118' },
            { icon: '🕯️', title: 'Beeswax Candle', description: 'Local beeswax · Cotton wick · 40 hrs', price: '$28' },
            { icon: '🍽️', title: 'Stoneware Plates', description: 'Hand-thrown · Set of 4', price: '$96' },
            { icon: '🧴', title: 'Refillable Soap', description: 'Cold-pressed · Refill pouch included', price: '$18' },
          ],
        }),
        comp('image-text', 'Traceability', {
          title: 'From field to shelf, in six steps.',
          description: 'Scan the QR code on any product and see the exact farm, mill, dyehouse and workshop it came from — with the names of the people who made it. Transparency should not be a feature. It should be the default.',
          imageUrl: IMG.travelMountain,
          imagePosition: 'right',
          ctaText: 'See how it works',
          ctaLink: '#impact',
        }),
        comp('testimonials', 'Reviews', {
          title: 'From our customers',
          variant: 'grid',
          testimonials: [
            { name: 'Elena R.', role: 'Verified buyer', text: 'The linen sheets are the best we\'ve ever slept on. And I love that I can see exactly who made them.', rating: 5, avatar: AVATAR.w1 },
            { name: 'Josh P.', role: 'Verified buyer', text: 'Repaired a pair of trousers 4 years after I bought them. Free. That\'s a brand I trust.', rating: 5, avatar: AVATAR.m1 },
            { name: 'Marta K.', role: 'Verified buyer', text: 'Packaging is compostable, product is beautiful. Rare to get both.', rating: 5, avatar: AVATAR.w2 },
          ],
        }),
        comp('logo-cloud', 'Certifications', {
          title: 'Certified by',
          logos: ['B Corp', 'GOTS', '1% for the Planet', 'Fair Trade', 'Climate Neutral', 'FSC'],
        }),
        comp('newsletter', 'Newsletter', {
          title: 'Slow letters',
          subtitle: 'One thoughtful email a month — new drops, seasonal makers, and the occasional recipe.',
          placeholder: 'you@email.com',
          buttonText: 'Subscribe',
          variant: 'split',
        }),
        foot(),
      ], true, 0),

      // ── Products ──
      page('Shop', 'products', [
        nav(),
        comp('hero', 'Shop Hero', {
          heading: 'Shop the range',
          subheading: 'Small batches. Restocked seasonally.',
          alignment: 'center',
          height: 'small',
        }),
        comp('service-card', 'All products', {
          title: 'Home',
          services: [
            { icon: '🧺', title: 'Linen Bath Set', description: 'GOTS organic French linen · 4 pieces', price: '$118' },
            { icon: '🛏️', title: 'Linen Sheets', description: 'King · Sand or Fog', price: '$220' },
            { icon: '🍽️', title: 'Stoneware Plates', description: 'Set of 4', price: '$96' },
            { icon: '🥣', title: 'Stoneware Bowls', description: 'Set of 4', price: '$88' },
            { icon: '🕯️', title: 'Beeswax Candle', description: '40-hour burn', price: '$28' },
            { icon: '🧴', title: 'Refillable Soap', description: 'Bottle + refill', price: '$18' },
          ],
        }),
        comp('features', 'Materials', {
          title: 'What things are made of',
          columns: 3,
          features: [
            { icon: '🌾', title: 'French linen', description: 'European flax, no irrigation, no defoliants.' },
            { icon: '🐝', title: 'Beeswax', description: 'From small apiaries within 200 km of our workshop.' },
            { icon: '🪵', title: 'FSC oak', description: 'Certified sustainable, kiln-dried locally.' },
            { icon: '♻️', title: 'Recycled glass', description: 'Post-consumer glass, no new mining.' },
            { icon: '🧵', title: 'Organic cotton', description: 'GOTS-certified, dyed with low-impact pigments.' },
            { icon: '🪨', title: 'Stoneware clay', description: 'Locally sourced, fired with renewable energy.' },
          ],
        }),
        foot(),
      ], false, 1),

      // ── Impact ──
      page('Impact', 'impact', [
        nav(),
        comp('hero', 'Impact Hero', {
          heading: 'Our impact, in the open.',
          subheading: 'Published annually. Third-party verified.',
          alignment: 'center',
          height: 'small',
        }),
        comp('animated-stats', 'Impact numbers', {
          stats: [
            { value: '84', label: 'Tonnes CO₂ avoided' },
            { value: '11400', label: 'Trees planted' },
            { value: '92', label: 'Living-wage suppliers', suffix: '%' },
            { value: '2.3', label: 'M litres water saved', prefix: '', suffix: 'M' },
          ],
          variant: 'gradient',
          columns: 4,
        }),
        comp('timeline', 'Journey', {
          title: 'How we got here',
          items: [
            { date: '2019', title: 'Founded', description: 'Two founders, one sewing machine, one product.' },
            { date: '2021', title: 'B Corp certified', description: 'Scored 118 — top 10% of our size worldwide.' },
            { date: '2023', title: 'Climate neutral', description: 'Full Scope 1–3 measured and offset.' },
            { date: '2024', title: 'Repair-for-life', description: 'Free lifetime repairs added to every product.' },
            { date: '2026', title: '84 tonnes avoided', description: 'This year to date. Full report published each January.' },
          ],
        }),
        comp('cta-banner', 'Report', {
          heading: 'Read the full 2025 impact report',
          subheading: '42 pages, third-party verified, uncomfortably honest.',
          ctaText: 'Download the report',
          ctaLink: '#',
        }),
        foot(),
      ], false, 2),

      // ── Contact ──
      page('Contact', 'contact', [
        nav(),
        comp('hero', 'Contact Hero', {
          heading: 'Say hello',
          subheading: 'Wholesale, press, or a question about your order — we read everything.',
          alignment: 'center',
          height: 'small',
        }),
        comp('contact-form', 'Form', {
          title: 'Get in touch',
          fields: ['name', 'email', 'message'],
          submitText: 'Send message',
          variant: 'card',
        }),
        comp('icon-text', 'Info', {
          items: [
            { icon: '✉️', title: 'General', description: 'hello@verdantgoods.co' },
            { icon: '🏬', title: 'Wholesale', description: 'trade@verdantgoods.co' },
            { icon: '📰', title: 'Press', description: 'press@verdantgoods.co' },
            { icon: '📍', title: 'Workshop', description: '18 Riverside Ln, Bristol · By appointment' },
          ],
          layout: 'horizontal',
        }),
        foot(),
      ], false, 3),
    ];
  },
};

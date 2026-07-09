import { SiteTemplate } from '../index';
import { IMG, AVATAR } from '../images';
import { comp, page, makeNavbar, makeFooter } from '../helpers';
import { SiteTheme } from '../../../types';

/**
 * Dark Creative — bold, oversized, brutalist-tinged portfolio/studio site.
 * For creative studios, motion designers, and independent art directors.
 * 4 pages: Home, Work, Studio, Contact.
 */
const DARK_CREATIVE_THEME: SiteTheme = {
  primaryColor: '#d1fe4e',
  secondaryColor: '#27272a',
  accentColor: '#ff3b8c',
  backgroundColor: '#050505',
  textColor: '#fafafa',
  headingFont: 'Space Grotesk, sans-serif',
  bodyFont: 'JetBrains Mono, monospace',
  borderRadius: 0,
  spacing: 26,
  shadowStyle: 'none',
  buttonStyle: 'square',
  sectionPadding: 1.4,
  fontScale: 1.15,
  letterSpacing: -0.03,
  linkStyle: 'underline',
  headingTransform: 'uppercase',
};

export const darkCreativeTemplate: SiteTemplate = {
  id: 'dark-creative',
  name: 'Dark Creative Studio',
  description: 'Brutalist, oversized dark portfolio for creative studios, motion designers and art directors.',
  icon: '⬛',
  category: 'Creative',
  theme: DARK_CREATIVE_THEME,
  pageCount: 4,
  features: [
    'Oversized type hero', 'Marquee text', 'Case study grid', 'Studio manifesto',
    'Client marquee', 'Reel section', 'Awards list', 'Contact form',
  ],
  previewImage: IMG.agencyHero,
  pages: () => {
    const nav = makeNavbar('◼︎ NULLPOINT', [
      { label: 'Work', href: '#work' },
      { label: 'Studio', href: '#studio' },
      { label: 'Contact', href: '#contact' },
    ], 'Start a Project');

    const foot = makeFooter(
      'Nullpoint Studio',
      'An independent design & motion studio.',
      '',
      'hello@nullpoint.studio',
      {
        links: [
          { label: 'Work', href: '#work' },
          { label: 'Studio', href: '#studio' },
          { label: 'Instagram', href: '#' },
          { label: 'Are.na', href: '#' },
        ],
        socialLinks: [
          { platform: 'instagram', url: '#' },
          { platform: 'twitter', url: '#' },
          { platform: 'vimeo', url: '#' },
          { platform: 'dribbble', url: '#' },
        ],
      },
    );

    return [
      // ── Home ──
      page('Home', '', [
        nav(),
        comp('hero', 'Hero', {
          heading: 'We design the parts nobody else notices.',
          subheading: 'Nullpoint is a five-person studio for brands that refuse to look like their category.',
          ctaText: 'See the work',
          ctaLink: '#work',
          secondaryCtaText: 'About the studio',
          secondaryCtaLink: '#studio',
          alignment: 'left',
          height: 'fullscreen',
          overlayOpacity: 0,
        }),
        comp('marquee', 'Marquee', {
          items: ['BRAND', 'MOTION', 'IDENTITY', 'INTERFACE', 'TYPE', 'FILM', 'PRINT', 'WEB'],
          direction: 'left',
          speed: 30,
          variant: 'text-only',
        }),
        comp('gallery-masonry', 'Recent work', {
          title: 'Selected work · 2024–2026',
          columns: 2,
          images: [
            { url: IMG.design1, caption: 'RIOT — Identity & motion' },
            { url: IMG.design2, caption: 'ATLAS — Editorial site' },
            { url: IMG.design3, caption: 'NORTHWIND — Brand system' },
            { url: IMG.design4, caption: 'FABLE — Launch film' },
            { url: IMG.agency1, caption: 'KITE — Wordmark' },
            { url: IMG.agency2, caption: 'LOOP — Product interface' },
          ],
        }),
        comp('animated-stats', 'Stats', {
          stats: [
            { value: '68', label: 'Projects shipped' },
            { value: '14', label: 'Awards' },
            { value: '5', label: 'People' },
            { value: '0', label: 'Bullshit' },
          ],
          variant: 'minimal',
          columns: 4,
        }),
        comp('logo-cloud', 'Clients', {
          title: 'Clients',
          logos: ['A24', 'Aesop', 'MoMA', 'Off-White', 'The Criterion Collection', 'Ableton', 'Are.na', 'Bandcamp'],
        }),
        comp('image-text', 'Manifesto', {
          title: 'Small on purpose.',
          description: 'We turn down more than we take. Five people, one room, three projects at a time. That is the whole model. It is why we can look at every pixel — and why we still like each other on Friday.',
          imageUrl: IMG.agencyHero,
          imagePosition: 'right',
        }),
        comp('cta-banner', 'CTA', {
          heading: 'Have something specific in mind?',
          subheading: 'We answer every serious brief within two working days.',
          ctaText: 'Get in touch',
          ctaLink: '#contact',
        }),
        foot(),
      ], true, 0),

      // ── Work ──
      page('Work', 'work', [
        nav(),
        comp('hero', 'Work Hero', {
          heading: 'Work',
          subheading: 'A partial index. Ask us about the projects that are not shown.',
          alignment: 'left',
          height: 'small',
        }),
        comp('features', 'Case index', {
          title: 'Case studies',
          columns: 2,
          features: [
            { icon: '01', title: 'RIOT · Brand system', description: 'Full identity, motion package and launch site for a Berlin electronic label.' },
            { icon: '02', title: 'ATLAS · Editorial site', description: 'A long-scroll editorial platform for a design-writing magazine. Custom type.' },
            { icon: '03', title: 'NORTHWIND · Wayfinding', description: 'Environmental signage and brand system for a 40k m² cultural venue.' },
            { icon: '04', title: 'FABLE · Launch film', description: '90-second film and identity for the launch of a consumer AI app.' },
            { icon: '05', title: 'KITE · Wordmark', description: 'Custom wordmark and specimen for a legal-tech startup.' },
            { icon: '06', title: 'LOOP · Interface', description: 'Product design and design system for a music-collaboration tool.' },
          ],
        }),
        comp('marquee', 'Awards', {
          items: ['ADC · Gold', 'D&AD · Wood Pencil', 'Awwwards · SOTD ×4', 'Communication Arts', 'Brand New · Noted', 'Type Directors Club'],
          direction: 'right',
          speed: 24,
          variant: 'text-only',
        }),
        foot(),
      ], false, 1),

      // ── Studio ──
      page('Studio', 'studio', [
        nav(),
        comp('hero', 'Studio Hero', {
          heading: 'The Studio',
          subheading: 'Five people. One room. Lisbon.',
          alignment: 'left',
          height: 'small',
        }),
        comp('team-grid', 'People', {
          title: 'People',
          members: [
            { name: 'Iris Marchetti', role: 'Founder / Design Director', bio: 'Ex-Pentagram. Loves specimens and terrible coffee.', avatar: AVATAR.w1 },
            { name: 'Ben Kovač', role: 'Motion Lead', bio: 'Frame-by-frame animator. Talks in easing curves.', avatar: AVATAR.m1 },
            { name: 'Nikita Røstad', role: 'Type & Systems', bio: 'Custom letters, specimens, and typographic sanity.', avatar: AVATAR.w2 },
            { name: 'Ola Bello', role: 'Design Engineer', bio: 'Builds the sites so they look how we drew them.', avatar: AVATAR.m2 },
            { name: 'Yuki Tanaka', role: 'Producer', bio: 'The reason anything ships on time. Ever.', avatar: AVATAR.w3 },
          ],
        }),
        comp('features', 'Principles', {
          title: 'Principles',
          columns: 3,
          features: [
            { icon: '◆', title: 'One idea, well made.', description: 'A single strong idea will always beat five careful ones.' },
            { icon: '◇', title: 'Show your work.', description: 'Process is not for hiding. Every project ships with a case study.' },
            { icon: '◼', title: 'Say no.', description: 'The most valuable word in a studio. We use it early and clearly.' },
          ],
        }),
        foot(),
      ], false, 2),

      // ── Contact ──
      page('Contact', 'contact', [
        nav(),
        comp('hero', 'Contact Hero', {
          heading: 'Say hello.',
          subheading: 'We take on 6 projects a year. The next window opens in Q1.',
          alignment: 'left',
          height: 'small',
        }),
        comp('contact-form', 'Form', {
          title: 'Tell us about your project',
          subtitle: 'Budget, timeline and one honest sentence about what you want. That is enough to start.',
          fields: ['name', 'email', 'message'],
          submitText: 'Send',
          variant: 'card',
        }),
        comp('icon-text', 'Info', {
          items: [
            { icon: '✉︎', title: 'General', description: 'hello@nullpoint.studio' },
            { icon: '◆', title: 'Press', description: 'press@nullpoint.studio' },
            { icon: '◇', title: 'Careers', description: 'work@nullpoint.studio' },
            { icon: '◼', title: 'Studio', description: 'Rua da Boavista 12 · Lisbon' },
          ],
          layout: 'horizontal',
        }),
        foot(),
      ], false, 3),
    ];
  },
};

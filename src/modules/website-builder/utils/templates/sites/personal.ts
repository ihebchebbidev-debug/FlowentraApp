import { SiteTemplate } from '../index';
import { IMG, AVATAR } from '../images';
import { comp, page, makeNavbar, makeFooter } from '../helpers';
import { PORTFOLIO_THEME } from '../themes';

/**
 * Personal / Resume — high-value template for freelancers, job seekers,
 * and independent professionals. 4 pages: Home, Work, About, Contact.
 */
export const personalTemplate: SiteTemplate = {
  id: 'personal-resume',
  name: 'Personal / Resume',
  description: 'Distinctive personal website for freelancers and job seekers — hero, skills, experience timeline, portfolio and contact.',
  icon: '👤',
  category: 'Portfolio',
  theme: PORTFOLIO_THEME,
  pageCount: 4,
  features: [
    'Split hero with photo', 'Skills with progress bars', 'Experience timeline',
    'Selected work grid', 'Testimonials', 'Downloadable CV CTA', 'Contact form',
  ],
  previewImage: IMG.portfolioHero || AVATAR.m1,
  pages: () => {
    const nav = makeNavbar(
      'Alex Rivera',
      [
        { label: 'Home', href: '#' },
        { label: 'Work', href: '#work' },
        { label: 'About', href: '#about' },
        { label: 'Contact', href: '#contact' },
      ],
      'Hire Me',
    );

    const foot = makeFooter(
      'Alex Rivera',
      'Independent product designer & front-end engineer.',
      '(555) 010-2030',
      'hello@alexrivera.co',
      {
        links: [
          { label: 'Home', href: '#' },
          { label: 'Work', href: '#work' },
          { label: 'About', href: '#about' },
          { label: 'Contact', href: '#contact' },
        ],
        socialLinks: [
          { platform: 'twitter', url: '#' },
          { platform: 'linkedin', url: '#' },
          { platform: 'github', url: '#' },
          { platform: 'dribbble', url: '#' },
        ],
      },
    );

    return [
      // ── Home ──
      page('Home', '', [
        nav(),
        comp('hero', 'Hero', {
          heading: 'Hi, I\'m Alex — I design and build products people love.',
          subheading: 'Independent product designer and front-end engineer with 8+ years shipping polished software for startups and Fortune 500 teams.',
          ctaText: 'See My Work',
          ctaLink: '#work',
          secondaryCtaText: 'Download CV',
          secondaryCtaLink: '#cv',
          alignment: 'left',
          height: 'large',
          variant: 'split',
          image: AVATAR.m1,
          backgroundImage: IMG.portfolioHero,
          overlayOpacity: 20,
        }),
        comp('logo-cloud', 'Trusted By', {
          title: 'Trusted by teams at',
          logos: ['Stripe', 'Linear', 'Vercel', 'Figma', 'Notion', 'Shopify'],
        }),
        comp('features', 'What I Do', {
          title: 'What I Do',
          subtitle: 'A focused set of services, done exceptionally well.',
          columns: 3,
          features: [
            { icon: '🎨', title: 'Product Design', description: 'End-to-end product design from research and strategy to polished UI systems.' },
            { icon: '⚡', title: 'Front-End Engineering', description: 'Production-ready React, TypeScript and design systems that scale with your team.' },
            { icon: '🧭', title: 'Design Advisory', description: 'Fractional design leadership for early-stage teams building their first real product.' },
          ],
        }),
        comp('animated-stats', 'Stats', {
          stats: [
            { value: '80', label: 'Shipped Projects', suffix: '+' },
            { value: '8', label: 'Years Experience', suffix: '+' },
            { value: '30', label: 'Happy Clients', suffix: '+' },
            { value: '5', label: 'Awards Won' },
          ],
          variant: 'gradient',
          columns: 4,
          animationStyle: 'count',
        }),
        comp('image-text', 'Featured Case', {
          title: 'Featured: Redesigning Linear\'s onboarding',
          description: 'Led a 6-week engagement to rethink the first-run experience for Linear. New activation funnel lifted day-7 retention by 34% and cut time-to-value from 22 minutes to under 4.',
          imageUrl: IMG.design1 || IMG.saasHero,
          imagePosition: 'right',
          ctaText: 'Read the case study',
          ctaLink: '#work',
        }),
        comp('testimonials', 'Testimonials', {
          title: 'Kind words',
          variant: 'carousel',
          bgColor: '#f8fafc',
          testimonials: [
            { name: 'Priya Shah', role: 'Head of Product, Linear', text: 'Alex ships more polished work in a week than most teams ship in a quarter. Genuinely one of the best I\'ve worked with.', rating: 5, avatar: AVATAR.w1 },
            { name: 'Marcus Lee', role: 'CEO, Fable', text: 'Rare combination of design taste and engineering rigor. Would hire again in a heartbeat.', rating: 5, avatar: AVATAR.m2 },
            { name: 'Sofia Alvarez', role: 'CTO, Northwind', text: 'The design system Alex built is still the backbone of every product we ship. Two years and counting.', rating: 5, avatar: AVATAR.w3 },
          ],
        }),
        comp('cta-banner', 'CTA', {
          heading: 'Have a project in mind?',
          subheading: 'I take on a handful of client engagements each quarter. Let\'s see if we\'re a fit.',
          ctaText: 'Get in Touch',
          ctaLink: '#contact',
        }),
        comp('scroll-to-top', 'Scroll', { position: 'bottom-right' }),
        foot(),
      ], true, 0),

      // ── Work ──
      page('Work', 'work', [
        nav(),
        comp('hero', 'Work Hero', {
          heading: 'Selected Work',
          subheading: 'A snapshot of recent product design and engineering engagements.',
          alignment: 'center',
          height: 'small',
        }),
        comp('gallery-masonry', 'Portfolio', {
          title: 'Case Studies',
          columns: 3,
          images: [
            { url: IMG.design1 || IMG.saasHero, caption: 'Linear — Onboarding Redesign' },
            { url: IMG.design2 || IMG.consultHero, caption: 'Fable — Design System v2' },
            { url: IMG.design3 || IMG.portfolioHero, caption: 'Northwind — Analytics Suite' },
            { url: IMG.design4 || IMG.saasHero, caption: 'Loop — Mobile App Launch' },
            { url: IMG.design1 || IMG.consultHero, caption: 'Kite — Brand & Web' },
            { url: IMG.design2 || IMG.portfolioHero, caption: 'Studio — Marketing Site' },
          ],
        }),
        comp('cta-banner', 'CTA', {
          heading: 'Want the full case study deck?',
          subheading: 'I\'ll send process, artefacts, and outcome metrics for any project.',
          ctaText: 'Request Deck',
          ctaLink: '#contact',
        }),
        foot(),
      ], false, 1),

      // ── About ──
      page('About', 'about', [
        nav(),
        comp('hero', 'About Hero', {
          heading: 'About Me',
          subheading: 'Designer, engineer, and lifelong learner based in Lisbon.',
          alignment: 'center',
          height: 'small',
        }),
        comp('image-text', 'Bio', {
          title: 'A short story',
          description: 'I started as a self-taught front-end developer at 16, fell in love with design somewhere along the way, and have spent the last eight years shipping products that live at the intersection of the two. I care deeply about craft, quiet interfaces, and teams that ship.',
          imageUrl: AVATAR.m1,
          imagePosition: 'left',
        }),
        comp('progress', 'Skills', {
          title: 'Skills',
          subtitle: 'Where I spend most of my time.',
          items: [
            { label: 'Product Design (Figma)', value: 95 },
            { label: 'React / TypeScript', value: 92 },
            { label: 'Design Systems', value: 90 },
            { label: 'User Research', value: 78 },
            { label: 'Motion & Prototyping', value: 82 },
            { label: 'Brand & Identity', value: 70 },
          ],
        }),
        comp('timeline', 'Experience', {
          title: 'Experience',
          items: [
            { date: '2024 — Now', title: 'Independent (self)', description: 'Fractional design & engineering for Series A–C SaaS teams.' },
            { date: '2021 — 2024', title: 'Senior Product Designer, Linear', description: 'Led onboarding, mobile, and design-system tracks. Grew activation 34%.' },
            { date: '2018 — 2021', title: 'Product Designer, Stripe', description: 'Shipped Radar dashboard v2 and the merchant onboarding flow.' },
            { date: '2015 — 2018', title: 'Front-End Engineer, Agency', description: 'Design-engineering hybrid at a boutique studio serving DTC brands.' },
          ],
        }),
        comp('features', 'Values', {
          title: 'What I care about',
          columns: 3,
          features: [
            { icon: '🎯', title: 'Craft over speed', description: 'Ship less, ship better. Details are the whole thing.' },
            { icon: '🤝', title: 'Small teams', description: 'The best work happens in tight groups with real trust.' },
            { icon: '🌱', title: 'Long-term thinking', description: 'Design systems, docs, and decisions that outlast the current sprint.' },
          ],
        }),
        comp('cta-banner', 'Download CV', {
          heading: 'Prefer the PDF version?',
          subheading: 'A one-page CV with everything above, in a tidy printable format.',
          ctaText: 'Download CV (PDF)',
          ctaLink: '#',
        }),
        foot(),
      ], false, 2),

      // ── Contact ──
      page('Contact', 'contact', [
        nav(),
        comp('hero', 'Contact Hero', {
          heading: 'Let\'s work together',
          subheading: 'I reply to every serious inquiry within 24 hours (weekdays).',
          alignment: 'center',
          height: 'small',
        }),
        comp('contact-form', 'Form', {
          title: 'Tell me about your project',
          subtitle: 'The more context you share, the better I can help.',
          fields: ['name', 'email', 'phone', 'message'],
          submitText: 'Send Message',
          variant: 'card',
          showIcon: true,
        }),
        comp('icon-text', 'Info', {
          items: [
            { icon: '📧', title: 'Email', description: 'hello@alexrivera.co' },
            { icon: '📞', title: 'Phone', description: '(555) 010-2030' },
            { icon: '📍', title: 'Based in', description: 'Lisbon, Portugal — working worldwide' },
            { icon: '⏰', title: 'Response time', description: 'Within 24 hours, Mon–Fri' },
          ],
          layout: 'horizontal',
        }),
        comp('social-links', 'Social', {
          title: 'Or find me on',
          links: [
            { platform: 'twitter', url: '#', label: '@alexrivera' },
            { platform: 'linkedin', url: '#', label: 'LinkedIn' },
            { platform: 'github', url: '#', label: 'GitHub' },
            { platform: 'dribbble', url: '#', label: 'Dribbble' },
          ],
          variant: 'cards',
        }),
        foot(),
      ], false, 3),
    ];
  },
};

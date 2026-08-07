import { SiteTemplate } from '../index';
import { IMG, AVATAR } from '../images';
import { comp, page, makeNavbar, makeFooter } from '../helpers';
import { SiteTheme } from '../../../types';

/**
 * Event / Conference — landing site for a multi-day event with
 * speakers, schedule, venue and ticketing. 4 pages.
 */
const EVENT_THEME: SiteTheme = {
  primaryColor: '#f43f5e',
  secondaryColor: '#1e293b',
  accentColor: '#facc15',
  backgroundColor: '#0b0b16',
  textColor: '#f8fafc',
  headingFont: 'Space Grotesk, sans-serif',
  bodyFont: 'Inter, sans-serif',
  borderRadius: 12,
  spacing: 22,
  shadowStyle: 'dramatic',
  buttonStyle: 'pill',
  sectionPadding: 1.25,
  fontScale: 1.05,
  letterSpacing: -0.02,
  linkStyle: 'none',
  headingTransform: 'none',
};

export const eventConferenceTemplate: SiteTemplate = {
  id: 'event-conference',
  name: 'Event / Conference',
  description: 'Cinematic conference site with countdown, speaker grid, multi-track schedule, sponsors and ticket tiers.',
  icon: '🎤',
  category: 'Events',
  theme: EVENT_THEME,
  pageCount: 4,
  features: [
    'Countdown hero', 'Speaker grid', 'Multi-day schedule', 'Ticket tiers',
    'Sponsor logos', 'Venue map', 'Past-year gallery', 'Newsletter',
  ],
  previewImage: IMG.agencyHero,
  pages: () => {
    const nav = makeNavbar('◆ SHIFT/26', [
      { label: 'Speakers', href: '#speakers' },
      { label: 'Schedule', href: '#schedule' },
      { label: 'Tickets', href: '#tickets' },
      { label: 'Venue', href: '#venue' },
    ], 'Get Tickets');

    const foot = makeFooter(
      'SHIFT Conference',
      'The conference for people who ship.',
      '',
      'hello@shiftconf.io',
      {
        links: [
          { label: 'Code of Conduct', href: '#' },
          { label: 'Sponsor', href: '#sponsors' },
          { label: 'Contact', href: '#contact' },
          { label: 'Past Events', href: '#gallery' },
        ],
        socialLinks: [
          { platform: 'twitter', url: '#' },
          { platform: 'instagram', url: '#' },
          { platform: 'youtube', url: '#' },
          { platform: 'linkedin', url: '#' },
        ],
      },
    );

    return [
      // ── Home ──
      page('Home', '', [
        nav(),
        comp('announcement-bar', 'Early bird', {
          text: '🎟️ Early-bird tickets end October 15 — save 40%',
          linkText: 'Get yours →',
          linkUrl: '#tickets',
          variant: 'primary',
        }),
        comp('hero', 'Hero', {
          heading: 'SHIFT / 2026',
          subheading: 'Three days. Two stages. One conference for people who build the internet. Nov 12–14, 2026 · Lisbon.',
          ctaText: 'Get Tickets',
          ctaLink: '#tickets',
          secondaryCtaText: 'View Speakers',
          secondaryCtaLink: '#speakers',
          alignment: 'center',
          height: 'large',
          backgroundImage: IMG.agencyHero,
          overlayOpacity: 65,
        }),
        comp('countdown', 'Countdown', {
          heading: 'Doors open in',
          targetDate: '2026-11-12T09:00:00',
          variant: 'flip',
        }),
        comp('animated-stats', 'Stats', {
          stats: [
            { value: '3', label: 'Days' },
            { value: '48', label: 'Speakers' },
            { value: '2500', label: 'Attendees', suffix: '+' },
            { value: '30', label: 'Countries' },
          ],
          variant: 'gradient',
          columns: 4,
        }),
        comp('features', 'Themes', {
          title: 'Four tracks. Zero filler.',
          columns: 4,
          features: [
            { icon: '🎨', title: 'Design', description: 'Craft, systems, and taste at scale.' },
            { icon: '⚙️', title: 'Engineering', description: 'Architecture, perf, and shipping fast.' },
            { icon: '🧠', title: 'AI', description: 'Building with LLMs — production, not demos.' },
            { icon: '🚀', title: 'Product', description: 'Strategy, growth, and founder stories.' },
          ],
        }),
        comp('logo-cloud', 'Speakers from', {
          title: 'Speakers from',
          logos: ['Stripe', 'Linear', 'Vercel', 'Figma', 'Notion', 'GitHub', 'Anthropic', 'Shopify'],
        }),
        comp('image-text', 'About', {
          title: 'A conference, not a trade show.',
          description: 'SHIFT is small on purpose. 2,500 attendees, curated speakers, hallway conversations you will remember. No booth crawls, no swag maze — just three days of the best talks and the best people in one room.',
          imageUrl: IMG.corporateMeeting,
          imagePosition: 'right',
        }),
        comp('cta-banner', 'Tickets CTA', {
          heading: 'Early-bird ends October 15',
          subheading: 'Save 40% on all ticket tiers. Prices go up automatically at midnight UTC.',
          ctaText: 'Grab a Ticket',
          ctaLink: '#tickets',
        }),
        foot(),
      ], true, 0),

      // ── Speakers ──
      page('Speakers', 'speakers', [
        nav(),
        comp('hero', 'Speakers Hero', {
          heading: 'Speakers',
          subheading: '48 talks across 3 days. Meet the people on stage.',
          alignment: 'center',
          height: 'small',
        }),
        comp('team-grid', 'Keynotes', {
          title: 'Keynotes',
          members: [
            { name: 'Maya Patel', role: 'VP Design, Linear', bio: 'On craft, speed, and the myth of the design system.', avatar: AVATAR.w1 },
            { name: 'Kenji Watanabe', role: 'CTO, Fable', bio: 'Building a globally distributed team at 40 people.', avatar: AVATAR.m1 },
            { name: 'Lucia Ferreira', role: 'Founder, Kite', bio: 'Zero to $10M ARR — the honest playbook.', avatar: AVATAR.w2 },
            { name: 'Ade Adebayo', role: 'Principal Engineer, Stripe', bio: 'Latency, cost, and the invisible parts of scale.', avatar: AVATAR.m2 },
          ],
        }),
        comp('team-grid', 'Track leads', {
          title: 'Track leads',
          members: [
            { name: 'Priya Shah', role: 'Design Track', bio: 'Ex-Airbnb, Notion. Talks: type, taste, and teams.', avatar: AVATAR.w3 },
            { name: 'Marcus Lee', role: 'Engineering Track', bio: 'Distributed systems, chaos engineering, DX.', avatar: AVATAR.m3 },
            { name: 'Sofia Alvarez', role: 'AI Track', bio: 'RAG at production scale. Ex-Anthropic.', avatar: AVATAR.w4 },
            { name: 'Rafael Costa', role: 'Product Track', bio: 'Growth loops, activation, and honest metrics.', avatar: AVATAR.m4 },
          ],
        }),
        comp('cta-banner', 'CFP', {
          heading: 'Want to speak in 2027?',
          subheading: 'CFP opens January. Get notified when it does.',
          ctaText: 'Notify Me',
          ctaLink: '#contact',
        }),
        foot(),
      ], false, 1),

      // ── Schedule ──
      page('Schedule', 'schedule', [
        nav(),
        comp('hero', 'Schedule Hero', {
          heading: 'Schedule',
          subheading: 'Three days across Main Stage and Studio. Sessions are 25 minutes with Q&A.',
          alignment: 'center',
          height: 'small',
        }),
        comp('timeline', 'Day 1', {
          title: 'Day 1 — Wed, Nov 12',
          items: [
            { date: '09:00', title: 'Doors & coffee', description: 'Registration opens. Sponsor lounge.' },
            { date: '10:00', title: 'Opening keynote — Maya Patel', description: 'Craft, speed, and the myth of the design system.' },
            { date: '11:00', title: 'Design track begins', description: 'Four back-to-back sessions on Main Stage.' },
            { date: '13:00', title: 'Lunch', description: 'Catered. Table topics in the atrium.' },
            { date: '14:30', title: 'Engineering track', description: 'Latency, cost, and scaling foundations.' },
            { date: '19:00', title: 'Opening party', description: 'Rooftop at LX Factory. Included with all tickets.' },
          ],
        }),
        comp('timeline', 'Day 2', {
          title: 'Day 2 — Thu, Nov 13',
          items: [
            { date: '09:30', title: 'Keynote — Kenji Watanabe', description: 'Building a globally distributed team.' },
            { date: '10:30', title: 'AI track', description: 'RAG, evals, and production LLM systems.' },
            { date: '14:00', title: 'Product track', description: 'Founder-led sessions on growth and pricing.' },
            { date: '18:00', title: 'Speaker dinner (invite)', description: 'By nomination — nominate a friend on-site.' },
          ],
        }),
        comp('timeline', 'Day 3', {
          title: 'Day 3 — Fri, Nov 14',
          items: [
            { date: '10:00', title: 'Workshops', description: 'Six half-day workshops. Separate ticket.' },
            { date: '15:00', title: 'Closing keynote — Lucia Ferreira', description: 'Zero to $10M ARR, told honestly.' },
            { date: '17:00', title: 'Closing remarks & 2027 announce', description: 'Location for next year revealed live.' },
          ],
        }),
        foot(),
      ], false, 2),

      // ── Tickets ──
      page('Tickets', 'tickets', [
        nav(),
        comp('hero', 'Tickets Hero', {
          heading: 'Tickets',
          subheading: 'Simple pricing. All tickets include every talk, all meals, and both parties.',
          alignment: 'center',
          height: 'small',
        }),
        comp('pricing', 'Tiers', {
          title: 'Choose your tier',
          plans: [
            {
              name: 'Community',
              price: '$299',
              features: ['All 3 days', 'Both stages', 'Meals & parties', 'Recorded talks 30 days after'],
              highlighted: false,
              ctaText: 'Buy Community',
            },
            {
              name: 'Standard',
              price: '$599',
              features: ['Everything in Community', 'Reserved seating', 'Speaker dinner nomination', 'Talks recorded — lifetime access'],
              highlighted: true,
              ctaText: 'Buy Standard',
            },
            {
              name: 'Workshops',
              price: '$899',
              features: ['Everything in Standard', 'One half-day workshop on Day 3', 'Small group (25 people)', 'Workshop materials'],
              highlighted: false,
              ctaText: 'Buy Workshops',
            },
          ],
        }),
        comp('faq', 'FAQ', {
          title: 'Ticket FAQ',
          items: [
            { question: 'Can I get a refund?', answer: 'Full refund until Oct 1, 2026. 50% until Nov 1. No refunds after that, but you can transfer to a colleague.' },
            { question: 'Do you offer diversity scholarships?', answer: 'Yes — 100 fully-funded tickets available. Applications open August 1.' },
            { question: 'Is there a student rate?', answer: 'Students with a valid ID get 60% off Community tier. Email students@shiftconf.io.' },
            { question: 'Where should I stay?', answer: 'We\'ve pre-booked room blocks at three hotels within walking distance. Codes emailed after purchase.' },
          ],
        }),
        comp('map', 'Venue', {
          address: 'Centro de Congressos, Lisbon, Portugal',
          height: 380,
        }),
        comp('newsletter', 'Newsletter', {
          title: 'Not ready to buy?',
          subtitle: 'We\'ll email you when the schedule drops and when early-bird ends.',
          placeholder: 'you@company.com',
          buttonText: 'Notify Me',
          variant: 'split',
        }),
        foot(),
      ], false, 3),
    ];
  },
};

import { SiteTemplate } from '../index';
import { IMG } from '../images';
import { comp, page, makeNavbar, makeFooter } from '../helpers';
import { SAAS_THEME } from '../themes';

/**
 * Digital Downloads Store — courses, ebooks, templates, software.
 *
 * Highlights the new business-rules engine on the Cart block:
 *   • Auto free-shipping isn't relevant — this template ships nothing.
 *   • Coupon codes (WELCOME25, LAUNCH50, VIP) demonstrate percent / fixed / BOGO.
 *   • Spend tiers reward buyers who bundle multiple downloads.
 *   • Tax rate applies to all sales (digital tax varies by region — kept simple).
 */
export const digitalDownloadsTemplate: SiteTemplate = {
  id: 'digital-downloads',
  name: 'Digital Downloads',
  description: 'Sell ebooks, courses, templates, and software with coupon codes, tiered discounts, and instant delivery.',
  icon: '⬇️',
  category: 'E-Commerce',
  theme: SAAS_THEME,
  pageCount: 3,
  isNew: true,
  features: [
    'Coupon codes (WELCOME25, LAUNCH50, VIP-BOGO)',
    'Automatic spend tiers (save 10% at $50, 15% at $100)',
    'Digital tax handling',
    'Product grid with license badges',
    'FAQ + newsletter + testimonials',
  ],
  previewImage: IMG.saasHero,
  pages: () => {
    const nav = makeNavbar('⬇️ Craftbase', [
      { label: 'Home', href: '#' },
      { label: 'Library', href: '#library' },
      { label: 'Pricing', href: '#pricing' },
      { label: 'FAQ', href: '#faq' },
    ], 'Browse Library');

    const foot = makeFooter('Craftbase', 'Digital goods for makers, coded with care.', '', 'hello@craftbase.dev', {
      links: [
        { label: 'Library', href: '#library' },
        { label: 'Licenses', href: '#licenses' },
        { label: 'Refunds', href: '#refunds' },
        { label: 'Contact', href: '#contact' },
      ],
    });

    /** Shared business rules used by the Cart block on this template. */
    const storeRules = {
      coupons: [
        { code: 'WELCOME25', kind: 'percent', value: 25, label: 'Welcome bonus (25% off)' },
        { code: 'LAUNCH50', kind: 'fixed', value: 50, minSubtotal: 150, label: 'Launch week: $50 off $150+' },
        { code: 'VIP-BOGO', kind: 'bogo', value: 1, label: 'Buy one, get one free' },
      ],
      spendTiers: [
        { minSubtotal: 50, discountPercent: 10, label: 'Bundle saver — 10% off orders over $50' },
        { minSubtotal: 100, discountPercent: 15, label: 'Power buyer — 15% off orders over $100' },
      ],
      taxRate: 0.08,
      maxDiscountFraction: 0.9,
    };

    return [
      // ═════════ HOME ═════════
      page('Home', '', [
        nav(),
        comp('announcement-bar', 'Promo', {
          text: '🎁 First order? Use WELCOME25 for 25% off',
          dismissible: true, variant: 'accent',
        }),
        comp('hero', 'Hero', {
          heading: 'Digital tools for people who ship',
          subheading: 'Instant download. Lifetime updates. Zero waiting rooms.',
          alignment: 'center', height: 'medium',
          buttons: [
            { text: 'Browse the library', link: '#library', variant: 'primary' },
            { text: 'How it works', link: '#how', variant: 'ghost' },
          ],
        }),
        comp('trust-badges', 'Trust', {
          title: 'What every purchase includes',
          badges: [
            { icon: '⚡', label: 'Instant download' },
            { icon: '♾️', label: 'Lifetime updates' },
            { icon: '💬', label: 'Community support' },
            { icon: '↩️', label: '14-day refunds' },
          ],
        }),
        comp('product-card', 'Library', {
          title: 'The Library', subtitle: 'Ebooks, templates, and courses — all downloadable', columns: 3, variant: 'default',
          showWishlist: true, showRating: true,
          products: [
            { name: 'Design Systems Handbook', price: '$29', badge: 'Ebook', rating: 5, description: 'A 220-page guide to shipping tokens, components, and docs.' },
            { name: 'Notion PM Template', price: '$19', badge: 'Template', rating: 5, description: 'Roadmap, sprints, retros — a full PM workspace.' },
            { name: 'Figma UI Kit — Neo', price: '$49', badge: 'Kit', rating: 4, description: '400+ components, dark mode, auto-layout everywhere.' },
            { name: 'Shipping Fast Course', price: '$79', badge: 'Course', rating: 5, description: 'Six hours of video on velocity, scope-cutting, and momentum.' },
            { name: 'Icon Pack — Line 2', price: '$15', badge: 'Icons', rating: 4, description: '2,400 pixel-perfect icons in SVG + Figma.' },
            { name: 'Landing Page Toolkit', price: '$39', badge: 'Popular', rating: 5, description: 'Twelve battle-tested landing sections.' },
          ],
        }),
        comp('cta-banner', 'Bundle CTA', {
          heading: 'Bundle two and save 10%. Three and save 15%.',
          subheading: 'Discounts apply automatically at checkout.',
          ctaText: 'Start bundling', ctaLink: '#library',
        }),
        comp('cart', 'Cart', {
          rules: storeRules,
          showCouponInput: true,
        }),
        comp('faq', 'FAQ', {
          title: 'Frequently asked',
          items: [
            { question: 'How do I receive my download?', answer: 'Instantly. A download link appears on the confirmation screen and is emailed to you.' },
            { question: 'What licenses do I get?', answer: 'A perpetual, personal-use license. Team licenses are available at checkout for +50%.' },
            { question: 'Do you offer refunds?', answer: 'Yes — 14 days, no questions asked.' },
            { question: 'Which coupons stack?', answer: 'One coupon code per order. Automatic spend tiers stack with your coupon.' },
          ],
        }),
        comp('reviews', 'Reviews', {
          title: 'Loved by 12,000+ builders', variant: 'grid', showAverage: true,
          reviews: [
            { name: 'Priya S.', rating: 5, text: 'The design systems handbook paid for itself in a single sprint.', verified: true },
            { name: 'Marc D.', rating: 5, text: 'Cleanest Notion template I have ever imported. Zero cleanup.', verified: true },
            { name: 'Aiko T.', rating: 5, text: 'Bundled three items and the discount kicked in automatically. Nice touch.', verified: true },
          ],
        }),
        comp('newsletter', 'Newsletter', {
          title: 'New drops, every other Tuesday',
          subtitle: 'One email, always short. Unsubscribe anytime.',
          placeholder: 'you@work.com', buttonText: 'Subscribe',
        }),
        foot(),
      ], true, 0),

      // ═════════ PRICING ═════════
      page('Pricing', 'pricing', [
        nav(),
        comp('pricing', 'Pricing', {
          title: 'Simple, honest pricing',
          subtitle: 'Pay once per item. No subscriptions. No trials.',
          plans: [
            { name: 'Single', price: '$19–$79', description: 'One digital product, personal license.', features: ['Instant download', 'Lifetime updates', 'Personal license', '14-day refund'], ctaText: 'Browse library', ctaLink: '#library' },
            { name: 'Bundle', price: 'Save 10–15%', description: 'Combine 2+ items and unlock automatic discounts.', features: ['Everything in Single', '10% off at $50', '15% off at $100', 'One coupon per order'], badge: 'Popular', ctaText: 'See discounts', ctaLink: '#library' },
            { name: 'Team', price: '+50% per seat', description: 'Extend any license to your whole team.', features: ['Everything in Single', 'Team license', 'Priority email support', 'Invoice on request'], ctaText: 'Contact us', ctaLink: '#contact' },
          ],
        }),
        comp('cta-banner', 'CTA', {
          heading: 'Try Craftbase risk-free',
          subheading: '14-day refund on every order. No fine print.',
          ctaText: 'Browse the library', ctaLink: '#library',
        }),
        foot(),
      ], false, 1),

      // ═════════ CHECKOUT (stub) ═════════
      page('Checkout', 'checkout', [
        nav(),
        comp('cart', 'Cart', {
          rules: storeRules,
          showCouponInput: true,
        }),
        foot(),
      ], false, 2),
    ];
  },
};

import { SiteTemplate } from '../index';
import { IMG } from '../images';
import { comp, page, makeNavbar, makeFooter } from '../helpers';
import { ECOMMERCE_THEME } from '../themes';

/**
 * Subscription Box — recurring commerce template.
 *
 * Shows off the storeRules engine end-to-end:
 *   • Auto free-shipping over $60 (visible progress hint appears in cart)
 *   • Flat shipping fee for smaller orders
 *   • Tax by region (US-CA at 7.25%, EU at 20% VAT included in price)
 *   • Coupons: percent, fixed, and free-shipping
 *   • Automatic spend tier (10% off at $90)
 */
export const subscriptionBoxTemplate: SiteTemplate = {
  id: 'subscription-box',
  name: 'Subscription Box',
  description: 'Monthly curated box store with recurring plans, free-shipping thresholds, region tax, and coupon codes.',
  icon: '📦',
  category: 'E-Commerce',
  theme: ECOMMERCE_THEME,
  pageCount: 3,
  isNew: true,
  features: [
    'Monthly / quarterly plan pricing',
    'Free shipping over $60 (with progress hint)',
    'Region tax (US-CA + EU VAT-inclusive)',
    'Coupons: FIRSTBOX15, GIFT10, FREESHIP',
    'Automatic 10%-off spend tier',
  ],
  previewImage: IMG.ecomLifestyle,
  pages: () => {
    const nav = makeNavbar('📦 Kindred Box', [
      { label: 'Home', href: '#' },
      { label: 'How it works', href: '#how' },
      { label: 'Plans', href: '#plans' },
      { label: 'Past boxes', href: '#past' },
      { label: 'Gift', href: '#gift' },
    ], 'Start my box');

    const foot = makeFooter('Kindred Box', 'Handpicked artisan goods, delivered monthly.', '', 'hi@kindredbox.co', {
      links: [
        { label: 'How it works', href: '#how' },
        { label: 'FAQ', href: '#faq' },
        { label: 'Shipping', href: '#shipping' },
        { label: 'Cancel anytime', href: '#cancel' },
      ],
      socialLinks: [
        { platform: 'instagram', url: '#' },
        { platform: 'tiktok', url: '#' },
        { platform: 'pinterest', url: '#' },
      ],
    });

    /** Shared business rules used by the Cart block on this template. */
    const storeRules = {
      freeShippingOver: 60,
      flatShipping: 5.99,
      spendTiers: [
        { minSubtotal: 90, discountPercent: 10, label: 'Big box saver — 10% off orders over $90' },
      ],
      coupons: [
        { code: 'FIRSTBOX15', kind: 'percent', value: 15, label: 'First-box discount (15% off)' },
        { code: 'GIFT10', kind: 'fixed', value: 10, minSubtotal: 40, label: '$10 off gift orders over $40' },
        { code: 'FREESHIP', kind: 'shipping', value: 0, label: 'Free shipping applied' },
      ],
      taxes: [
        { region: 'US-CA', rate: 0.0725, label: 'California sales tax' },
        { region: 'EU', rate: 0.20, label: 'VAT (20%)', includedInPrice: true },
      ],
      activeRegion: 'US-CA',
    };

    return [
      // ═════════ HOME ═════════
      page('Home', '', [
        nav(),
        comp('announcement-bar', 'Promo', {
          text: '🎁 First box? Use FIRSTBOX15 for 15% off',
          dismissible: true, variant: 'accent',
        }),
        comp('hero', 'Hero', {
          heading: 'A little kindness, delivered monthly',
          subheading: 'Curated artisan goods from small makers, in a beautiful box on your doorstep.',
          alignment: 'center', height: 'large',
          backgroundImage: IMG.ecomLifestyle, overlayOpacity: 40,
          buttons: [
            { text: 'Start my box', link: '#plans', variant: 'primary' },
            { text: 'How it works', link: '#how', variant: 'ghost' },
          ],
        }),
        comp('trust-badges', 'Trust', {
          title: 'Why Kindred',
          badges: [
            { icon: '🚚', label: 'Free shipping over $60' },
            { icon: '↩️', label: 'Skip or cancel anytime' },
            { icon: '💌', label: 'Handwritten note in every box' },
            { icon: '🌱', label: 'Plastic-free packaging' },
          ],
        }),
        comp('features', 'How it works', {
          title: 'How it works',
          subtitle: 'Three steps between you and your first box.',
          columns: 3,
          items: [
            { icon: '🎯', title: 'Choose your rhythm', description: 'Monthly, quarterly, or gift-once. Pause or cancel anytime.' },
            { icon: '📦', title: 'We curate + pack', description: 'Every box has 5–7 items handpicked by our small team.' },
            { icon: '🏠', title: 'It lands on your door', description: 'Free shipping over $60. Otherwise a flat $5.99.' },
          ],
        }),
        comp('pricing', 'Plans', {
          title: 'Pick your plan',
          subtitle: 'Same beautiful box — different rhythm. Cancel anytime.',
          plans: [
            { name: 'Monthly', price: '$45/mo', description: 'A new box every month.', features: ['5–7 curated items', 'Free shipping', 'Skip anytime', 'Cancel anytime'], ctaText: 'Start monthly', ctaLink: '#checkout' },
            { name: 'Quarterly', price: '$120/qtr', description: 'Bigger box, every 3 months.', features: ['8–10 curated items', 'Free shipping', 'Save $15 vs monthly', 'Cancel anytime'], badge: 'Best value', ctaText: 'Start quarterly', ctaLink: '#checkout' },
            { name: 'Gift', price: '$50 one-time', description: 'A single box, gift-wrapped.', features: ['5–7 curated items', 'Gift-wrapped', 'Personal note', 'No subscription'], ctaText: 'Send a gift', ctaLink: '#checkout' },
          ],
        }),
        comp('image-text', 'Past boxes', {
          title: 'Recent boxes',
          description: 'January: warm winter kitchen. December: cozy nights in. November: gratitude & candles. Every box is a small story — see what past subscribers received.',
          imageUrl: IMG.ecomStore, imagePosition: 'right',
          ctaText: 'Explore past boxes', ctaLink: '#past',
        }),
        comp('reviews', 'Reviews', {
          title: 'What subscribers say', variant: 'grid', showAverage: true, showVerified: true,
          reviews: [
            { name: 'Elena V.', rating: 5, text: 'Every box feels like a small event. The stationery in December made me cry (in a good way).', verified: true },
            { name: 'Rob H.', rating: 5, text: 'I gifted three months to my mother-in-law and she has not stopped talking about it.', verified: true },
            { name: 'Naomi J.', rating: 4, text: 'The quality of the makers they source from is genuinely impressive.', verified: true },
          ],
        }),
        comp('newsletter', 'Newsletter', {
          title: 'Peek inside next month',
          subtitle: 'A sneak preview, first, before boxes ship.',
          placeholder: 'you@email.com', buttonText: 'Send me the preview',
        }),
        foot(),
      ], true, 0),

      // ═════════ CHECKOUT ═════════
      page('Checkout', 'checkout', [
        nav(),
        comp('hero', 'Checkout hero', {
          heading: 'Your box, almost home',
          subheading: 'Apply a promo code below — discounts and shipping update as you go.',
          alignment: 'center', height: 'small',
        }),
        comp('cart', 'Cart', {
          rules: storeRules,
          showCouponInput: true,
        }),
        comp('trust-badges', 'Trust', {
          badges: [
            { icon: '🔒', label: 'Secure checkout' },
            { icon: '↩️', label: 'Skip anytime' },
            { icon: '💬', label: 'Real humans reply within 24h' },
          ],
        }),
        foot(),
      ], false, 1),

      // ═════════ FAQ ═════════
      page('FAQ', 'faq', [
        nav(),
        comp('faq', 'FAQ', {
          title: 'Frequently asked',
          items: [
            { question: 'Can I skip a month?', answer: 'Yes — from your account, one click. Skip as many months as you like.' },
            { question: 'When do you ship?', answer: 'The first week of each month. Tracking is emailed the day it goes out.' },
            { question: 'Do you ship internationally?', answer: 'Currently US, Canada, and the EU. VAT is included in the price for EU orders.' },
            { question: 'How do the discounts work?', answer: 'Free shipping unlocks automatically at $60. Orders over $90 get an extra 10% off, applied on top of any coupon.' },
            { question: 'Which coupons stack?', answer: 'One coupon per order. Automatic spend tiers stack with your coupon and with free-shipping.' },
          ],
        }),
        foot(),
      ], false, 2),
    ];
  },
};

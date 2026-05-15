import { SiteTemplate } from '../index';
import { IMG, AVATAR } from '../images';
import { comp, page, makeNavbar, makeFooter } from '../helpers';
import { BOUTIQUE_THEME } from '../themes';

export const fashionBoutiqueTemplate: SiteTemplate = {
  id: 'fashion-boutique',
  name: 'Fashion Boutique',
  description: 'Luxury fashion boutique with editorial lookbook, product detail, quick view, wishlist, reviews carousel, and a refined dark-accent aesthetic.',
  icon: '👗',
  category: 'E-Commerce',
  theme: BOUTIQUE_THEME,
  pageCount: 7,
  features: [
    'Split hero', 'Lookbook gallery', 'Product detail with variants', 'Quick view',
    'Wishlist grid', 'Reviews carousel', 'Blog grid', 'Countdown', 'Floating CTA',
    'Cookie consent', 'Loading screen',
  ],
  previewImage: IMG.boutiqueHero,
  pages: () => {
    const nav = makeNavbar('MAISON NOIR', [
      { label: 'Home', href: '#' },
      { label: 'Collections', href: '#collections' },
      { label: 'Lookbook', href: '#lookbook' },
      { label: 'Shop', href: '#shop' },
      { label: 'Journal', href: '#journal' },
      { label: 'Contact', href: '#contact' },
    ], 'Shop Now', { showSearch: true });
    const foot = makeFooter('MAISON NOIR', 'Luxury redefined. Ethically crafted.', '', 'concierge@maisonnoir.com', {
      links: [
        { label: 'Collections', href: '#collections' }, { label: 'Shop', href: '#shop' },
        { label: 'Lookbook', href: '#lookbook' }, { label: 'Journal', href: '#journal' },
        { label: 'Contact', href: '#contact' }, { label: 'Size Guide', href: '#faq' },
      ],
      socialLinks: [
        { platform: 'instagram', url: '#' }, { platform: 'pinterest', url: '#' },
        { platform: 'tiktok', url: '#' }, { platform: 'linkedin', url: '#' },
      ],
    });

    return [
      // ═══════════════════════════════════════════════════
      // HOME — Editorial luxury landing
      // ═══════════════════════════════════════════════════
      page('Home', '', [
        nav(),
        comp('loading-screen', 'Loader', {
          variant: 'pulse', logoText: 'MAISON NOIR', backgroundColor: '#0f0f0f',
          accentColor: '#c9a96e', textColor: '#ffffff', duration: 2,
        }),
        comp('marquee', 'Marquee', {
          text: '★ SPRING/SUMMER 2026 — NOW AVAILABLE ★ FREE SHIPPING ON ORDERS OVER $150 ★ SUSTAINABLY CRAFTED ★',
          speed: 20,
        }),
        comp('hero', 'Split Hero', {
          heading: 'Where Luxury Meets Conscience',
          subheading: 'Timeless silhouettes. Sustainable craft. Every piece tells a story.',
          variant: 'split', ctaText: 'Explore Collection', ctaLink: '#collections',
          alignment: 'left', height: 'large',
          splitImage: IMG.boutique1, splitPosition: 'right',
        }),
        comp('animated-stats', 'Stats', {
          stats: [
            { value: '100', label: 'Sustainable', suffix: '%' },
            { value: '12', label: 'Countries' },
            { value: '30', label: 'Customers', suffix: 'K+' },
            { value: '4.9', label: 'Rating', suffix: '★' },
          ],
          variant: 'bar', columns: 4, animationStyle: 'count',
        }),
        comp('product-card', 'Hero Products', {
          title: 'The Edit', subtitle: 'Curated picks from our creative director', columns: 3, variant: 'overlay',
          showWishlist: true, showRating: true,
          products: [
            { name: 'Silk Midi Dress', price: '$320', badge: 'Editor\'s Pick', rating: 5, description: 'Hand-finished Italian silk.' },
            { name: 'Structured Blazer', price: '$480', rating: 5, description: 'Double-breasted, wool-cashmere blend.' },
            { name: 'Leather Tote', price: '$275', badge: 'New', rating: 5, description: 'Full-grain vegetable-tanned leather.' },
          ],
        }),
        comp('image-text', 'Story', {
          title: 'Crafted with Intent',
          description: 'Every Maison Noir piece is designed in Paris and produced in small batches by artisan workshops across Europe. We believe luxury should be responsible — no shortcuts, no compromises.',
          imageUrl: IMG.boutiqueStore, imagePosition: 'left',
        }),
        comp('product-carousel', 'New Season', {
          title: 'Spring / Summer 2026', subtitle: 'The new collection',
          showArrows: true, showDots: true, autoPlay: true, autoPlaySpeed: 4000, cardStyle: 'elevated',
          products: [
            { name: 'Linen Palazzo Pants', price: '$195', badge: 'New', rating: 5, description: 'Relaxed wide-leg, French linen.' },
            { name: 'Cashmere Knit Top', price: '$245', rating: 5, description: 'Ultra-fine Grade A cashmere.' },
            { name: 'Pleated Maxi Skirt', price: '$210', badge: 'New', rating: 4, description: 'Flowing georgette, hand-pleated.' },
            { name: 'Tailored Trousers', price: '$185', rating: 5, description: 'High-waist, Italian virgin wool.' },
            { name: 'Oversized Coat', price: '$650', badge: 'Limited', rating: 5, description: 'Alpaca-wool blend, oversized fit.' },
          ],
        }),
        comp('quick-view', 'Quick View', {
          product: {
            name: 'Silk Midi Dress',
            price: '$320',
            oldPrice: '$420',
            description: 'A stunning midi dress crafted from the finest Italian silk. Features a bias cut for a flattering drape, adjustable spaghetti straps, and a concealed side zipper. Dry clean only.',
            images: [IMG.boutique2, IMG.boutique3],
            badge: 'Editor\'s Pick',
            rating: 5,
            reviewCount: 67,
            inStock: true,
            variants: [
              { label: 'Size', options: ['XS', 'S', 'M', 'L'] },
              { label: 'Color', options: ['Noir', 'Champagne', 'Blush'] },
            ],
          },
        }),
        comp('lightbox-gallery', 'Lookbook', {
          title: 'Lookbook', columns: 2,
          images: [
            { url: IMG.boutique1, caption: 'Editorial — Spring' },
            { url: IMG.boutique2, caption: 'Runway — Paris' },
            { url: IMG.boutique3, caption: 'Street Style' },
            { url: IMG.boutique4, caption: 'Evening Wear' },
          ],
        }),
        comp('reviews', 'Reviews', {
          title: 'Client Voices', variant: 'carousel', showAverage: true, showVerified: true,
          reviews: [
            { name: 'Isabelle L.', rating: 5, text: 'The quality is extraordinary. The silk dress is my most treasured piece.', date: 'Jan 2026', verified: true, title: 'Absolute Perfection' },
            { name: 'Charlotte M.', rating: 5, text: 'Every detail is considered. From the packaging to the fit — flawless.', date: 'Dec 2025', verified: true },
            { name: 'Victoria S.', rating: 5, text: 'Finally, a luxury brand that cares about sustainability without sacrificing beauty.', date: 'Nov 2025', verified: true },
          ],
        }),
        comp('logo-cloud', 'Press', {
          title: 'Featured In', logos: ['Vogue', 'Elle', 'Harper\'s Bazaar', 'W Magazine', 'Town & Country', 'Net-a-Porter'],
        }),
        comp('countdown', 'Pre-Order', {
          title: 'Autumn/Winter Pre-Order Opens In',
          targetDate: new Date(Date.now() + 14 * 86400000).toISOString(),
        }),
        comp('newsletter', 'Newsletter', {
          title: 'The Maison Noir Edit',
          subtitle: 'Receive early access to new collections, exclusive offers, and editorial content.',
          placeholder: 'Your email', buttonText: 'Join',
        }),
        comp('cookie-consent', 'Cookies', {
          text: 'We use cookies to personalize your shopping experience and improve our services.',
          buttonText: 'Accept', learnMoreText: 'Privacy', learnMoreUrl: '#', position: 'bottom',
        }),
        comp('floating-cta', 'Floating', {
          text: 'Shop Spring Collection →', link: '#shop',
          position: 'bottom-center', showAfterScroll: 500, animation: 'slide-up',
          dismissible: true, pill: true,
        }),
        comp('scroll-to-top', 'Scroll', {
          position: 'bottom-right', showAfterScroll: 400, smooth: true,
        }),
        foot(),
      ], true, 0),

      // ═══════════════════════════════════════════════════
      // COLLECTIONS — Category browsing
      // ═══════════════════════════════════════════════════
      page('Collections', 'collections', [
        nav(),
        comp('hero', 'Collections Hero', {
          heading: 'Collections', subheading: 'Explore our curated categories.',
          alignment: 'center', height: 'medium', backgroundImage: IMG.boutique4, overlayOpacity: 55,
        }),
        comp('product-card', 'Categories', {
          title: 'Shop by Collection', columns: 3, variant: 'overlay',
          showWishlist: false, showRating: false,
          products: [
            { name: 'Spring / Summer 2026', price: '28 Pieces', description: 'Light fabrics, bold colors.' },
            { name: 'Essentials', price: '45 Pieces', description: 'Timeless wardrobe staples.' },
            { name: 'Evening Wear', price: '16 Pieces', description: 'For your most elegant moments.' },
          ],
        }),
        comp('product-card', 'All', {
          title: 'All Products', columns: 4, variant: 'compact',
          showWishlist: true, showRating: false,
          products: [
            { name: 'Silk Camisole', price: '$145' },
            { name: 'Wool Trousers', price: '$185', badge: 'New' },
            { name: 'Leather Clutch', price: '$220' },
            { name: 'Cashmere Wrap', price: '$295', oldPrice: '$395' },
          ],
        }),
        foot(),
      ], false, 1),

      // ═══════════════════════════════════════════════════
      // LOOKBOOK — Editorial gallery
      // ═══════════════════════════════════════════════════
      page('Lookbook', 'lookbook', [
        nav(),
        comp('hero', 'Lookbook Hero', {
          heading: 'Spring 2026 Lookbook', subheading: 'Photographed in the South of France.',
          alignment: 'center', height: 'large', backgroundImage: IMG.boutique2, overlayOpacity: 40,
        }),
        comp('lightbox-gallery', 'Editorial', {
          title: 'The Campaign', columns: 2,
          images: [
            { url: IMG.boutique1, caption: 'Look 1 — Morning Light' },
            { url: IMG.boutique2, caption: 'Look 2 — Garden Party' },
            { url: IMG.boutique3, caption: 'Look 3 — Coastal Walk' },
            { url: IMG.boutique4, caption: 'Look 4 — Evening Terrace' },
          ],
        }),
        comp('cta-banner', 'Shop Lookbook', {
          heading: 'Shop the Lookbook',
          subheading: 'Every piece is available to order. Free returns on all orders.',
          ctaText: 'Shop Now', ctaLink: '#shop',
        }),
        foot(),
      ], false, 2),

      // ═══════════════════════════════════════════════════
      // SHOP — Full catalog
      // ═══════════════════════════════════════════════════
      page('Shop', 'shop', [
        nav(),
        comp('hero', 'Shop Hero', {
          heading: 'The Shop', subheading: 'Every piece, made to last.',
          alignment: 'center', height: 'small',
        }),
        comp('product-card', 'All Products', {
          title: 'All Products', columns: 3, variant: 'default',
          showWishlist: true, showRating: true, showQuickView: false,
          products: [
            { name: 'Silk Midi Dress', price: '$320', badge: 'Best Seller', rating: 5, description: 'Italian silk, bias cut.' },
            { name: 'Structured Blazer', price: '$480', rating: 5, description: 'Wool-cashmere blend.' },
            { name: 'Leather Tote', price: '$275', badge: 'New', rating: 5, description: 'Vegetable-tanned leather.' },
            { name: 'Linen Palazzo Pants', price: '$195', rating: 4, description: 'Relaxed French linen.' },
            { name: 'Cashmere Knit Top', price: '$245', badge: 'Limited', rating: 5, description: 'Grade A cashmere.' },
            { name: 'Pleated Maxi Skirt', price: '$210', rating: 5, description: 'Hand-pleated georgette.' },
          ],
        }),
        comp('product-card', 'Horizontal', {
          title: 'Staff Picks', variant: 'horizontal', showWishlist: true, showRating: true,
          products: [
            { name: 'Oversized Coat', price: '$650', badge: 'Editor\'s Pick', rating: 5, description: 'Alpaca-wool blend, oversized fit. Perfect for transitional weather.' },
            { name: 'Gold Chain Necklace', price: '$185', rating: 5, description: '18k gold-plated, adjustable length. Handmade in Paris.' },
          ],
        }),
        foot(),
      ], false, 3),

      // ═══════════════════════════════════════════════════
      // WISHLIST — Saved items
      // ═══════════════════════════════════════════════════
      page('Wishlist', 'wishlist', [
        nav(),
        comp('hero', 'Wishlist Hero', {
          heading: 'Your Wishlist', subheading: 'Pieces you love, saved for later.',
          alignment: 'center', height: 'small',
        }),
        comp('wishlist-grid', 'Wishlist', {
          title: 'Saved Items', columns: 4, showMoveToCart: true,
          items: [
            { name: 'Silk Midi Dress', price: '$320', oldPrice: '$420', inStock: true },
            { name: 'Structured Blazer', price: '$480', inStock: true },
            { name: 'Cashmere Knit Top', price: '$245', inStock: false },
            { name: 'Leather Tote', price: '$275', inStock: true },
          ],
        }),
        comp('product-carousel', 'Recommendations', {
          title: 'You Might Also Love', showArrows: true, cardStyle: 'default',
          products: [
            { name: 'Tailored Trousers', price: '$185', rating: 5 },
            { name: 'Gold Chain Necklace', price: '$185', rating: 5, badge: 'New' },
            { name: 'Pleated Maxi Skirt', price: '$210', rating: 4 },
          ],
        }),
        foot(),
      ], false, 4),

      // ═══════════════════════════════════════════════════
      // JOURNAL — Editorial blog
      // ═══════════════════════════════════════════════════
      page('Journal', 'journal', [
        nav(),
        comp('hero', 'Journal Hero', {
          heading: 'The Journal', subheading: 'Stories, style guides, and behind-the-scenes.',
          alignment: 'center', height: 'medium', backgroundImage: IMG.boutiqueStore, overlayOpacity: 50,
        }),
        comp('blog-grid', 'Posts', {
          title: 'Latest Stories', columns: 3,
          posts: [
            { title: 'The Art of Capsule Wardrobes', excerpt: 'How to build a versatile wardrobe with just 30 pieces.', category: 'Style Guide', date: 'Feb 2026', author: 'Marie D.' },
            { title: 'Behind the Fabric: Italian Silk', excerpt: 'A visit to our silk supplier in Como, Italy.', category: 'Craft', date: 'Jan 2026', author: 'Claire V.' },
            { title: 'Spring Trends to Watch', excerpt: 'The colors, cuts, and fabrics defining Spring 2026.', category: 'Trends', date: 'Jan 2026', author: 'Sophie L.' },
          ],
        }),
        comp('newsletter', 'Journal Subscribe', {
          title: 'Subscribe to Our Journal',
          subtitle: 'Style inspiration delivered to your inbox.',
          placeholder: 'Your email', buttonText: 'Subscribe',
        }),
        foot(),
      ], false, 5),

      // ═══════════════════════════════════════════════════
      // CONTACT — Concierge service
      // ═══════════════════════════════════════════════════
      page('Contact', 'contact', [
        nav(),
        comp('hero', 'Contact Hero', {
          heading: 'Concierge Service', subheading: 'Personal styling advice and order assistance.',
          alignment: 'center', height: 'small',
        }),
        comp('contact-form', 'Form', {
          title: 'Get in Touch',
          subtitle: 'Our concierge team responds within 4 hours during business hours.',
          fields: ['name', 'email', 'phone', 'message'], submitText: 'Send Message',
          variant: 'card', showIcon: true,
          formSettings: { collectSubmissions: true, successMessage: 'Thank you. Our concierge team will respond shortly.' },
        }),
        comp('icon-text', 'Info', {
          items: [
            { icon: '📧', title: 'Email', description: 'concierge@maisonnoir.com' },
            { icon: '📞', title: 'Phone', description: '+33 1 42 60 00 00' },
            { icon: '📍', title: 'Atelier', description: '8 Rue du Faubourg Saint-Honoré, Paris' },
          ],
          layout: 'horizontal',
        }),
        comp('faq', 'FAQ', {
          title: 'Frequently Asked Questions',
          items: [
            { question: 'What is your return policy?', answer: 'We offer a 14-day return window for all unworn items in original packaging. Returns are free for EU customers.' },
            { question: 'Do you offer personal styling?', answer: 'Yes! Our concierge team offers complimentary virtual styling sessions. Book via email or phone.' },
            { question: 'Where are your products made?', answer: 'All pieces are designed in Paris and produced in small-batch workshops across Italy, France, and Portugal.' },
            { question: 'Do you ship internationally?', answer: 'Yes, we ship to 12 countries. Duties and taxes may apply. Express shipping available.' },
          ],
        }),
        comp('map', 'Map', { address: '8 Rue du Faubourg Saint-Honoré, Paris, France', height: 350 }),
        foot(),
      ], false, 6),
    ];
  },
};

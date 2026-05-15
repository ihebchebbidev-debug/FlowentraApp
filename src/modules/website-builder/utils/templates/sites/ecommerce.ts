import { SiteTemplate } from '../index';
import { IMG } from '../images';
import { comp, page, makeNavbar, makeFooter } from '../helpers';
import { ECOMMERCE_THEME } from '../themes';

export const ecommerceTemplate: SiteTemplate = {
  id: 'ecommerce-store',
  name: 'Online Store',
  description: 'Full-featured e-commerce store with product grid, carousel, product detail, cart, wishlist, reviews, popups, countdown, and more.',
  icon: '🛍️',
  category: 'E-Commerce',
  theme: ECOMMERCE_THEME,
  pageCount: 7,
  features: [
    'Hero carousel', 'Product grid', 'Product carousel', 'Product detail page',
    'Shopping cart', 'Wishlist', 'Reviews', 'Countdown timer', 'Popup promo',
    'Newsletter', 'Cookie consent', 'WhatsApp button', 'Floating CTA', 'Scroll to top',
  ],
  previewImage: IMG.ecomHero,
  pages: () => {
    const nav = makeNavbar('🛍️ StyleVault', [
      { label: 'Home', href: '#' },
      { label: 'Shop', href: '#shop' },
      { label: 'New Arrivals', href: '#new' },
      { label: 'Collections', href: '#collections' },
      { label: 'About', href: '#about' },
      { label: 'Contact', href: '#contact' },
    ], 'Shop Now', { showSearch: true });
    const foot = makeFooter('StyleVault', 'Curated fashion for modern living', '', 'support@stylevault.com', {
      links: [
        { label: 'Home', href: '#' }, { label: 'Shop', href: '#shop' },
        { label: 'New Arrivals', href: '#new' }, { label: 'About', href: '#about' },
        { label: 'Contact', href: '#contact' }, { label: 'FAQ', href: '#faq' },
      ],
      socialLinks: [
        { platform: 'instagram', url: '#' }, { platform: 'tiktok', url: '#' },
        { platform: 'pinterest', url: '#' }, { platform: 'facebook', url: '#' },
      ],
    });

    return [
      // ═══════════════════════════════════════════════════
      // HOME PAGE — Full storefront experience
      // ═══════════════════════════════════════════════════
      page('Home', '', [
        nav(),
        comp('announcement-bar', 'Promo', {
          text: '🎁 FREE shipping on orders over $75 — Use code WELCOME20 for 20% off!',
          linkText: 'Shop Now →', linkUrl: '#shop', dismissible: true, variant: 'accent',
        }),
        comp('countdown', 'Sale Timer', {
          title: '⏰ Flash Sale Ends In',
          targetDate: new Date(Date.now() + 3 * 86400000).toISOString(),
        }),
        comp('hero', 'Hero Carousel', {
          variant: 'carousel', autoPlay: true, autoPlayInterval: 5, transition: 'fade',
          showDots: true, showArrows: true, pauseOnHover: true,
          alignment: 'center', height: 'large',
          slides: [
            {
              heading: 'Curated Fashion for Modern Living',
              subheading: 'Discover premium collections handpicked for style-conscious individuals.',
              backgroundImage: IMG.ecomHero, overlayOpacity: 45,
              buttons: [{ text: 'Shop Now', link: '#shop', variant: 'primary' }],
            },
            {
              heading: 'New Season — New Styles',
              subheading: 'The Spring/Summer 2026 collection is here. Fresh cuts, bold colors.',
              backgroundImage: IMG.ecomLifestyle, overlayOpacity: 40,
              buttons: [{ text: 'View Collection', link: '#new', variant: 'primary' }],
            },
            {
              heading: 'Accessories That Define You',
              subheading: 'From minimalist watches to statement bags. Complete your look.',
              backgroundImage: IMG.fashion3, overlayOpacity: 50,
              buttons: [{ text: 'Explore', link: '#shop', variant: 'primary' }],
            },
          ],
        }),
        comp('trust-badges', 'Trust', {
          title: 'Why StyleVault',
          badges: [
            { icon: '🚚', label: 'Free Shipping Over $75' },
            { icon: '↩️', label: '30-Day Returns' },
            { icon: '🔒', label: 'Secure Checkout' },
            { icon: '💎', label: 'Premium Quality' },
          ],
        }),
        comp('product-carousel', 'Best Sellers', {
          title: 'Best Sellers', subtitle: 'Our most loved products',
          showArrows: true, showDots: true, autoPlay: true, autoPlaySpeed: 4000, cardStyle: 'default',
          products: [
            { name: 'Classic Oxford Shirt', price: '$89', badge: 'Best Seller', rating: 5, description: '100% Egyptian cotton, tailored fit.' },
            { name: 'Slim Fit Chinos', price: '$65', oldPrice: '$85', rating: 4, description: 'Premium stretch fabric.' },
            { name: 'Leather Sneakers', price: '$145', badge: 'New', rating: 5, description: 'Handcrafted Italian leather.' },
            { name: 'Wool Blazer', price: '$245', rating: 5, description: 'Tailored fit, 100% merino wool.' },
            { name: 'Canvas Backpack', price: '$55', oldPrice: '$70', badge: 'Sale', rating: 4, description: 'Water-resistant, laptop sleeve.' },
            { name: 'Minimalist Watch', price: '$129', badge: 'Popular', rating: 5, description: 'Swiss movement, sapphire crystal.' },
          ],
        }),
        comp('product-card', 'Featured Grid', {
          title: 'Shop by Category', subtitle: 'Find your perfect style', columns: 3, variant: 'overlay',
          showWishlist: true, showRating: true,
          products: [
            { name: 'Men\'s Collection', price: 'From $39', badge: 'New', rating: 5, description: 'Modern essentials for every occasion.' },
            { name: 'Women\'s Collection', price: 'From $45', rating: 5, description: 'Elegant pieces, timeless style.' },
            { name: 'Accessories', price: 'From $19', badge: 'Trending', rating: 4, description: 'Watches, bags, and more.' },
          ],
        }),
        comp('image-text', 'Brand Story', {
          title: 'Ethically Sourced. Beautifully Made.',
          description: 'Every StyleVault piece is crafted with care from sustainable materials. We partner with artisans worldwide who share our commitment to quality and fair labor.',
          imageUrl: IMG.ecomStore, imagePosition: 'left',
        }),
        comp('product-card', 'New Arrivals', {
          title: 'New Arrivals', subtitle: 'Just dropped this week', columns: 4, variant: 'compact',
          showWishlist: true, showRating: false,
          products: [
            { name: 'Linen Button-Down', price: '$59', badge: 'New' },
            { name: 'Organic Tee', price: '$35', badge: 'Eco' },
            { name: 'Denim Jacket', price: '$120' },
            { name: 'Cashmere Scarf', price: '$75', oldPrice: '$95' },
          ],
        }),
        comp('reviews', 'Reviews', {
          title: 'What Our Customers Say', variant: 'featured', showAverage: true, showVerified: true,
          reviews: [
            { name: 'Jessica M.', rating: 5, text: 'The quality is unmatched at this price point. My Oxford shirt fits perfectly and feels luxurious. Already ordered two more!', date: 'Jan 2026', verified: true, helpful: 24, title: 'Incredible Quality!' },
            { name: 'David R.', rating: 5, text: 'Fast shipping and beautiful packaging. Love the attention to detail.', date: 'Dec 2025', verified: true, helpful: 12 },
            { name: 'Amanda L.', rating: 4, text: 'Great selection. The chinos are now my everyday go-to.', date: 'Nov 2025', verified: true, helpful: 8 },
          ],
        }),
        comp('logo-cloud', 'Featured In', {
          title: 'As Seen In', logos: ['Vogue', 'GQ', 'Elle', 'Esquire', 'Harper\'s Bazaar', 'WWD'],
        }),
        comp('cta-banner', 'CTA', {
          heading: 'Join the StyleVault Community',
          subheading: 'Get 20% off your first order with code WELCOME20',
          ctaText: 'Shop Collection', ctaLink: '#shop',
        }),
        comp('newsletter', 'Newsletter', {
          title: 'Stay in Style',
          subtitle: 'Subscribe for exclusive drops, early access, and 10% off your next order.',
          placeholder: 'Enter your email', buttonText: 'Subscribe',
        }),
        comp('popup', 'Welcome Popup', {
          title: '🎉 Welcome to StyleVault!',
          text: 'Sign up now and get 20% off your first order. Plus free shipping on orders over $75.',
          ctaText: 'Claim My Discount', ctaLink: '#', imageUrl: '',
          trigger: 'delay', triggerDelay: 5, position: 'center', animation: 'scale',
          showOverlay: true, overlayOpacity: 50, dismissible: true,
          buttons: [
            { text: 'Claim 20% Off', variant: 'primary', action: 'link', link: '#shop' },
            { text: 'No Thanks', variant: 'ghost', action: 'close' },
          ],
          formFields: [{ label: 'Email', type: 'email', placeholder: 'your@email.com', required: true }],
        }),
        comp('cookie-consent', 'Cookies', {
          text: 'We use cookies to enhance your shopping experience and analyze site traffic.',
          buttonText: 'Accept All', learnMoreText: 'Privacy Policy', learnMoreUrl: '#', position: 'bottom',
        }),
        comp('whatsapp-button', 'WhatsApp', {
          phoneNumber: '+1234567890', defaultMessage: 'Hi! I have a question about a product.',
          position: 'bottom-right', pulseAnimation: true,
          showGreeting: true, greetingText: 'Hi there! 👋 Need help finding the perfect fit?',
          agentName: 'StyleVault Support',
        }),
        comp('scroll-to-top', 'Scroll Top', {
          position: 'bottom-right', showAfterScroll: 400, smooth: true, rounded: true, shadow: true,
        }),
        foot(),
      ], true, 0),

      // ═══════════════════════════════════════════════════
      // SHOP — Full product catalog
      // ═══════════════════════════════════════════════════
      page('Shop', 'shop', [
        nav(),
        comp('hero', 'Shop Hero', {
          heading: 'All Products', subheading: 'Browse our full collection of premium fashion.',
          alignment: 'center', height: 'small',
        }),
        comp('product-card', 'All Products', {
          title: 'Shop All', subtitle: 'Filter by style, price, or category', columns: 3, variant: 'default',
          showWishlist: true, showQuickView: false, showRating: true,
          products: [
            { name: 'Classic Oxford Shirt', price: '$89', rating: 5, description: '100% Egyptian cotton.', badge: 'Best Seller' },
            { name: 'Slim Fit Chinos', price: '$65', oldPrice: '$85', rating: 4, description: 'Premium stretch fabric.', badge: 'Sale' },
            { name: 'Leather Sneakers', price: '$145', badge: 'New', rating: 5, description: 'Handcrafted Italian leather.' },
            { name: 'Wool Blazer', price: '$245', rating: 5, description: 'Tailored fit, 100% merino wool.' },
            { name: 'Canvas Backpack', price: '$55', oldPrice: '$70', rating: 4, description: 'Water-resistant, laptop sleeve.' },
            { name: 'Minimalist Watch', price: '$129', badge: 'Popular', rating: 5, description: 'Swiss movement, sapphire crystal.' },
          ],
        }),
        foot(),
      ], false, 1),

      // ═══════════════════════════════════════════════════
      // NEW ARRIVALS — Carousel + list view
      // ═══════════════════════════════════════════════════
      page('New Arrivals', 'new', [
        nav(),
        comp('hero', 'New Hero', {
          heading: 'New Arrivals', subheading: 'Fresh drops every week. Be the first to shop.',
          alignment: 'center', height: 'medium', backgroundImage: IMG.ecomLifestyle, overlayOpacity: 50,
        }),
        comp('product-carousel', 'New Carousel', {
          title: 'Just Dropped', autoPlay: true, autoPlaySpeed: 3000, showDots: false, cardStyle: 'elevated',
          products: [
            { name: 'Linen Button-Down', price: '$59', badge: 'New', rating: 5 },
            { name: 'Organic Cotton Tee', price: '$35', badge: 'Eco', rating: 4 },
            { name: 'Denim Jacket', price: '$120', rating: 5 },
            { name: 'Cashmere Scarf', price: '$75', oldPrice: '$95', rating: 4 },
          ],
        }),
        comp('product-card', 'New Grid', {
          title: 'This Season', columns: 3, variant: 'default', showWishlist: true, showRating: true,
          products: [
            { name: 'Relaxed Fit Blazer', price: '$185', badge: 'New', rating: 5, description: 'Unstructured, modern silhouette.' },
            { name: 'Merino Crew Neck', price: '$95', rating: 4, description: 'Ultra-soft merino wool.' },
            { name: 'Leather Belt', price: '$45', badge: 'Popular', rating: 5, description: 'Full-grain Italian leather.' },
          ],
        }),
        foot(),
      ], false, 2),

      // ═══════════════════════════════════════════════════
      // PRODUCT DETAIL — Single product deep-dive
      // ═══════════════════════════════════════════════════
      page('Product', 'product', [
        nav(),
        comp('product-detail', 'Product Page', {
          name: 'Classic Oxford Shirt',
          price: '$89',
          oldPrice: '$119',
          description: 'Crafted from 100% Egyptian cotton, our Classic Oxford Shirt features a modern tailored fit with a spread collar and single-button cuffs. Machine washable and built to last season after season.',
          images: [IMG.fashion1, IMG.fashion2],
          badge: 'Best Seller',
          inStock: true,
          variants: [
            { label: 'Size', options: ['S', 'M', 'L', 'XL', 'XXL'] },
            { label: 'Color', options: ['White', 'Light Blue', 'Pink', 'Navy'] },
          ],
          features: [
            '100% Egyptian cotton', 'Modern tailored fit', 'Spread collar with collar stays',
            'Single-button barrel cuffs', 'Machine washable', 'Imported from Italy',
          ],
        }),
        comp('product-carousel', 'Related', {
          title: 'You Might Also Like', showArrows: true, showDots: false, cardStyle: 'default',
          products: [
            { name: 'Slim Fit Chinos', price: '$65', rating: 4 },
            { name: 'Leather Belt', price: '$45', rating: 5 },
            { name: 'Wool Blazer', price: '$245', rating: 5 },
            { name: 'Canvas Backpack', price: '$55', rating: 4 },
          ],
        }),
        comp('reviews', 'Product Reviews', {
          title: 'Customer Reviews', variant: 'list', showAverage: true, showVerified: true, showHelpful: true,
          reviews: [
            { name: 'Mike T.', rating: 5, text: 'Perfect fit, exceptional quality. Worth every penny.', date: 'Jan 2026', verified: true, helpful: 18, title: 'My New Favorite Shirt' },
            { name: 'Sarah W.', rating: 5, text: 'Ordered in 3 colors. The cotton is incredibly soft.', date: 'Dec 2025', verified: true, helpful: 12 },
            { name: 'James K.', rating: 4, text: 'Great shirt overall. Runs slightly slim in the chest.', date: 'Nov 2025', verified: true, helpful: 6 },
          ],
        }),
        foot(),
      ], false, 3),

      // ═══════════════════════════════════════════════════
      // CART — Shopping cart page
      // ═══════════════════════════════════════════════════
      page('Cart', 'cart', [
        nav(),
        comp('hero', 'Cart Hero', {
          heading: 'Your Cart', subheading: 'Review your items before checkout.',
          alignment: 'center', height: 'small',
        }),
        comp('cart', 'Cart', {
          items: [
            { name: 'Classic Oxford Shirt (White, M)', price: '$89', quantity: 1 },
            { name: 'Slim Fit Chinos (Navy, 32)', price: '$65', quantity: 2 },
            { name: 'Leather Sneakers (White, 10)', price: '$145', quantity: 1 },
          ],
          subtotal: '$364', shipping: 'Free', total: '$364',
        }),
        comp('product-carousel', 'Upsell', {
          title: 'Complete Your Look', showArrows: true, cardStyle: 'default',
          products: [
            { name: 'Leather Belt', price: '$45', rating: 5 },
            { name: 'Minimalist Watch', price: '$129', rating: 5, badge: 'Popular' },
            { name: 'Canvas Backpack', price: '$55', rating: 4 },
          ],
        }),
        foot(),
      ], false, 4),

      // ═══════════════════════════════════════════════════
      // ABOUT — Brand story
      // ═══════════════════════════════════════════════════
      page('About', 'about', [
        nav(),
        comp('hero', 'About Hero', {
          heading: 'Our Story', subheading: 'Fashion with purpose — built on style & sustainability.',
          alignment: 'center', height: 'medium', backgroundImage: IMG.ecomStore, overlayOpacity: 50,
        }),
        comp('image-text', 'Story', {
          title: 'Built on Style & Sustainability',
          description: 'StyleVault was born from a belief that fashion should be both beautiful and responsible. We partner with ethical factories and use sustainable materials to create pieces that look great and feel even better.',
          imageUrl: IMG.fashion1, imagePosition: 'right',
        }),
        comp('animated-stats', 'Impact', {
          stats: [
            { value: '50', label: 'Happy Customers', suffix: 'K+' },
            { value: '100', label: 'Sustainable Materials', suffix: '%' },
            { value: '15', label: 'Countries' },
            { value: '4.9', label: 'Customer Rating', suffix: '★' },
          ],
          variant: 'cards', columns: 4, animationStyle: 'count',
        }),
        comp('timeline', 'Journey', {
          title: 'Our Journey',
          items: [
            { date: '2020', title: 'Founded', description: 'Started as a small online boutique with 12 pieces.' },
            { date: '2022', title: 'Sustainability Pledge', description: '100% sustainable materials across all product lines.' },
            { date: '2024', title: '50K Customers', description: 'Reached our biggest milestone — a community of 50,000.' },
            { date: '2026', title: 'Global Expansion', description: 'Now shipping to 15 countries with local warehouses.' },
          ],
        }),
        comp('lightbox-gallery', 'Gallery', {
          title: 'Behind the Scenes', columns: 3,
          images: [
            { url: IMG.fashion3, caption: 'Design Studio' },
            { url: IMG.fashion4, caption: 'Material Sourcing' },
            { url: IMG.fashion5, caption: 'Quality Control' },
            { url: IMG.fashion6, caption: 'Packaging with Care' },
            { url: IMG.ecomStore, caption: 'Our Flagship' },
            { url: IMG.fashion2, caption: 'Photo Shoot' },
          ],
        }),
        foot(),
      ], false, 5),

      // ═══════════════════════════════════════════════════
      // CONTACT + FAQ
      // ═══════════════════════════════════════════════════
      page('Contact', 'contact', [
        nav(),
        comp('hero', 'Contact Hero', {
          heading: 'Get in Touch', subheading: 'We\'d love to hear from you. Our team responds within 24 hours.',
          alignment: 'center', height: 'small',
        }),
        comp('contact-form', 'Form', {
          title: 'Send Us a Message',
          subtitle: 'For order issues, include your order number.',
          fields: ['name', 'email', 'phone', 'message'], submitText: 'Send Message',
          variant: 'card', showIcon: true,
          formSettings: { collectSubmissions: true, successMessage: 'Thanks! We\'ll get back to you within 24 hours.' },
        }),
        comp('icon-text', 'Info', {
          items: [
            { icon: '📧', title: 'Email', description: 'support@stylevault.com' },
            { icon: '💬', title: 'Live Chat', description: 'Available Mon-Fri 9AM-6PM EST' },
            { icon: '📱', title: 'WhatsApp', description: '+1 (555) 123-4567' },
          ],
          layout: 'horizontal',
        }),
        comp('faq', 'FAQ', {
          title: 'Frequently Asked Questions',
          items: [
            { question: 'What is your return policy?', answer: 'We offer a 30-day hassle-free return policy. Items must be unworn with tags attached. Free return shipping on all orders.' },
            { question: 'How long does shipping take?', answer: 'Standard shipping: 5-7 business days (free on orders $75+). Express: 2-3 business days ($12). Next-day available in select cities ($25).' },
            { question: 'Do you ship internationally?', answer: 'Yes! We ship to 15 countries. International orders typically arrive in 7-14 business days.' },
            { question: 'How do I find my size?', answer: 'Check our Size Guide on each product page. We also offer free exchanges if the fit isn\'t right.' },
            { question: 'Are your products sustainable?', answer: 'Yes — all materials are ethically sourced and we use sustainable production methods. Our packaging is 100% recyclable.' },
          ],
        }),
        comp('social-links', 'Social', {
          title: 'Follow Us',
          links: [
            { platform: 'instagram', url: '#' }, { platform: 'tiktok', url: '#' },
            { platform: 'pinterest', url: '#' }, { platform: 'facebook', url: '#' },
          ],
        }),
        foot(),
      ], false, 6),
    ];
  },
};

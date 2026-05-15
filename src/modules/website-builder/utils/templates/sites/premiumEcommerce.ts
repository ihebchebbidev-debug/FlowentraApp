import { SiteTemplate } from '../index';
import { IMG, AVATAR } from '../images';
import { comp, page, makeNavbar, makeFooter } from '../helpers';
import { PREMIUM_ECOM_THEME } from '../themes';

export const premiumEcommerceTemplate: SiteTemplate = {
  id: 'premium-ecommerce',
  name: 'Premium E-Commerce',
  description: 'Luxury e-commerce store with product grid, detail pages, cart, checkout, wishlist, filters, animated stats, glass sections, parallax, and full EN/FR language support.',
  icon: '👑',
  category: 'E-Commerce',
  theme: PREMIUM_ECOM_THEME,
  pageCount: 11,
  features: [
    'Hero carousel', 'Glass sections', 'Animated stats', 'Product grid',
    'Product carousel', 'Product detail', 'Product filters', 'Quick view',
    'Shopping cart', 'Checkout', 'Wishlist', 'Parallax', 'Countdown',
    'Reviews', 'Popup promo', 'Newsletter', 'Cookie consent', 'WhatsApp',
    'Language switcher EN/FR', 'Marquee', 'Trust badges', 'Tabs',
    'Before/After comparison', 'Size guide popup', 'Loyalty points widget',
  ],
  previewImage: IMG.ecomHero,
  languages: [
    { code: 'en', label: 'English', direction: 'ltr' },
    { code: 'fr', label: 'Français', direction: 'ltr' },
  ],
  translations: {
    fr: {
      'hero.heading': 'Le Luxe Redéfini',
      'hero.subheading': 'Découvrez des collections exclusives sélectionnées pour les amateurs de mode exigeants. Qualité artisanale, design intemporel.',
      'hero.cta': 'Acheter Maintenant',
      'hero.cta2': 'Voir les Collections',
      'hero.slide2.heading': 'Nouvelle Saison — Nouveaux Styles',
      'hero.slide2.subheading': 'La collection Printemps/Été 2026 est arrivée. Coupes modernes, matériaux luxueux.',
      'hero.slide3.heading': 'Accessoires d\'Exception',
      'hero.slide3.subheading': 'Montres artisanales, sacs en cuir, bijoux raffinés. Complétez votre style.',
      'nav.home': 'Accueil',
      'nav.shop': 'Boutique',
      'nav.new': 'Nouveautés',
      'nav.collections': 'Collections',
      'nav.about': 'À Propos',
      'nav.contact': 'Contact',
      'nav.cart': 'Panier',
      'nav.wishlist': 'Favoris',
      'nav.checkout': 'Paiement',
      'promo.text': '✨ LIVRAISON OFFERTE dès 100€ — Code BIENVENUE20 pour -20% !',
      'promo.link': 'Acheter →',
      'sale.title': '⏰ Vente Flash — Fin dans',
      'trust.title': 'L\'Excellence NOIR',
      'trust.shipping': 'Livraison Gratuite dès 100€',
      'trust.returns': 'Retours sous 30 Jours',
      'trust.secure': 'Paiement Sécurisé',
      'trust.quality': 'Qualité Premium',
      'trust.authentic': 'Authenticité Garantie',
      'stats.orders': 'Commandes Livrées',
      'stats.rating': 'Note Client',
      'stats.countries': 'Pays Livrés',
      'stats.brands': 'Marques Exclusives',
      'bestSellers.title': 'Meilleures Ventes',
      'bestSellers.subtitle': 'Nos pièces les plus appréciées',
      'categories.title': 'Acheter par Catégorie',
      'categories.subtitle': 'Trouvez votre style parfait',
      'brand.title': 'Artisanat d\'Exception. Éthiquement Sourcé.',
      'brand.description': 'Chaque pièce NOIR est fabriquée par des artisans experts utilisant des matériaux durables. Nous nous associons à des ateliers du monde entier qui partagent notre engagement pour la qualité et le commerce équitable.',
      'newArrivals.title': 'Nouveautés',
      'newArrivals.subtitle': 'Fraîchement arrivées cette semaine',
      'reviews.title': 'Avis de Nos Clients',
      'featuredIn.title': 'Vu Dans',
      'cta.heading': 'Rejoignez l\'Univers NOIR',
      'cta.subheading': '-20% sur votre première commande avec le code BIENVENUE20',
      'cta.button': 'Acheter la Collection',
      'newsletter.title': 'Restez Connecté',
      'newsletter.subtitle': 'Abonnez-vous pour des avant-premières exclusives, accès anticipé et -10% sur votre prochaine commande.',
      'newsletter.placeholder': 'Votre email',
      'newsletter.button': 'S\'abonner',
      'popup.title': '🎉 Bienvenue chez NOIR !',
      'popup.text': 'Inscrivez-vous et recevez -20% sur votre première commande. Livraison offerte dès 100€.',
      'popup.cta': 'Réclamer ma Réduction',
      'popup.dismiss': 'Non Merci',
      'shop.heading': 'Tous les Produits',
      'shop.subheading': 'Parcourez notre collection complète de mode premium.',
      'shop.title': 'Toute la Boutique',
      'shop.subtitle': 'Filtrer par style, prix ou catégorie',
      'new.heading': 'Nouveautés',
      'new.subheading': 'Nouvelles arrivées chaque semaine. Soyez les premiers.',
      'new.carousel': 'Fraîchement Arrivé',
      'new.grid': 'Cette Saison',
      'product.heading': 'Détail Produit',
      'product.related': 'Vous Aimerez Aussi',
      'product.reviews': 'Avis Clients',
      'cart.heading': 'Votre Panier',
      'cart.subheading': 'Vérifiez vos articles avant le paiement.',
      'cart.upsell': 'Complétez Votre Look',
      'checkout.heading': 'Paiement Sécurisé',
      'checkout.subheading': 'Finalisez votre commande en toute sécurité.',
      'checkout.title': 'Paiement',
      'checkout.button': 'Passer la Commande',
      'wishlist.heading': 'Vos Favoris',
      'wishlist.subheading': 'Les articles que vous avez aimés.',
      'wishlist.title': 'Ma Liste de Souhaits',
      'wishlist.browse': 'Parcourir les Produits',
      'about.heading': 'Notre Histoire',
      'about.subheading': 'Mode avec une mission — construite sur le style et la durabilité.',
      'about.story.title': 'Construit sur le Style et la Durabilité',
      'about.story.description': 'NOIR est né de la conviction que la mode doit être belle et responsable. Nous collaborons avec des ateliers éthiques et utilisons des matériaux durables pour créer des pièces qui sont aussi belles à porter qu\'à admirer.',
      'about.journey': 'Notre Parcours',
      'about.gallery': 'Les Coulisses',
      'contact.heading': 'Nous Contacter',
      'contact.subheading': 'Nous aimerions vous entendre. Notre équipe répond sous 24h.',
      'contact.form.title': 'Envoyez-nous un Message',
      'contact.form.subtitle': 'Pour les problèmes de commande, incluez votre numéro de commande.',
      'contact.form.button': 'Envoyer le Message',
      'contact.faq': 'Questions Fréquentes',
      'contact.social': 'Suivez-Nous',
      'faq.return': 'Quelle est votre politique de retour ?',
      'faq.returnAnswer': 'Nous offrons un retour sans souci sous 30 jours. Les articles doivent être non portés avec étiquettes. Retour gratuit sur toutes les commandes.',
      'faq.shipping': 'Quel est le délai de livraison ?',
      'faq.shippingAnswer': 'Standard : 5-7 jours ouvrés (gratuit dès 100€). Express : 2-3 jours ouvrés (12€). Livraison le lendemain dans certaines villes (25€).',
      'faq.international': 'Livrez-vous à l\'international ?',
      'faq.internationalAnswer': 'Oui ! Nous livrons dans 25 pays. Les commandes internationales arrivent généralement en 7-14 jours ouvrés.',
      'faq.size': 'Comment trouver ma taille ?',
      'faq.sizeAnswer': 'Consultez notre Guide des Tailles sur chaque page produit. Nous offrons aussi des échanges gratuits si la taille ne convient pas.',
      'faq.sustainable': 'Vos produits sont-ils durables ?',
      'faq.sustainableAnswer': 'Oui — tous les matériaux sont sourcés éthiquement et nous utilisons des méthodes de production durables. Nos emballages sont 100% recyclables.',
      'parallax.heading': 'Le Luxe à l\'État Pur',
      'parallax.subheading': 'Chaque pièce raconte une histoire d\'artisanat et d\'élégance',
      'marquee.text': '👑 SOLDES D\'HIVER — Jusqu\'à -50% sur les collections sélectionnées • LIVRAISON GRATUITE DANS LE MONDE ENTIER dès 150€ 👑',
      'filter.title': 'Filtrer les Produits',
      // Before/After
      'beforeAfter.title': 'Comparer les Tissus',
      'beforeAfter.before': 'Standard',
      'beforeAfter.after': 'NOIR Premium',
      // Size Guide
      'sizeGuide.title': '📏 Guide des Tailles',
      'sizeGuide.text': 'Trouvez votre taille parfaite grâce à notre guide détaillé. Mesurez poitrine, taille et hanches pour un ajustement idéal.',
      'sizeGuide.cta': 'Voir le Guide Complet',
      'sizeGuide.dismiss': 'Fermer',
      'sizeGuide.table.size': 'Taille',
      'sizeGuide.table.chest': 'Poitrine (cm)',
      'sizeGuide.table.waist': 'Tour de taille (cm)',
      'sizeGuide.table.hips': 'Hanches (cm)',
      // Loyalty
      'loyalty.title': 'Programme de Fidélité NOIR',
      'loyalty.subtitle': 'Gagnez des points à chaque achat. Débloquez des récompenses exclusives.',
      'loyalty.points': 'Points',
      'loyalty.tier': 'Niveau',
      'loyalty.nextReward': 'Prochaine Récompense',
      'loyalty.perDollar': 'Points par Euro Dépensé',
      'loyalty.members': 'Membres Actifs',
      'loyalty.redeemed': 'Récompenses Échangées',
      'loyalty.saved': 'Économies Membres',
      'loyalty.bronze': 'Bronze',
      'loyalty.silver': 'Argent',
      'loyalty.gold': 'Or',
      'loyalty.platinum': 'Platine',
      'loyalty.bronze.desc': 'Bienvenue — gagnez 1 point par € dépensé',
      'loyalty.silver.desc': '500+ points — 1,5x points, accès anticipé',
      'loyalty.gold.desc': '2 000+ points — 2x points, livraison prioritaire',
      'loyalty.platinum.desc': '5 000+ points — 3x points, styliste personnel',
      'loyalty.page.heading': 'Programme de Fidélité',
      'loyalty.page.subheading': 'Gagnez des récompenses à chaque achat. Montez en niveau.',
      'loyalty.progress.title': 'Progression des Niveaux',
      'loyalty.howItWorks': 'Comment Ça Marche',
      'loyalty.howItWorks.shop': 'Achetez',
      'loyalty.howItWorks.shopDesc': 'Gagnez des points sur chaque achat chez NOIR.',
      'loyalty.howItWorks.earn': 'Accumulez',
      'loyalty.howItWorks.earnDesc': 'Les points s\'accumulent automatiquement sur votre compte.',
      'loyalty.howItWorks.redeem': 'Échangez',
      'loyalty.howItWorks.redeemDesc': 'Utilisez vos points pour des remises, livraison gratuite et plus.',
      'loyalty.howItWorks.vip': 'VIP',
      'loyalty.howItWorks.vipDesc': 'Débloquez des récompenses exclusives en montant de niveau.',
    },
    en: {
      'hero.heading': 'Luxury Redefined',
      'hero.subheading': 'Discover exclusive collections curated for discerning fashion connoisseurs. Artisan craftsmanship, timeless design.',
      'hero.cta': 'Shop Now',
      'hero.cta2': 'View Collections',
      'hero.slide2.heading': 'New Season — New Styles',
      'hero.slide2.subheading': 'The Spring/Summer 2026 collection has arrived. Modern cuts, luxurious materials.',
      'hero.slide3.heading': 'Exceptional Accessories',
      'hero.slide3.subheading': 'Artisan watches, leather bags, refined jewelry. Complete your signature style.',
      'nav.home': 'Home',
      'nav.shop': 'Shop',
      'nav.new': 'New Arrivals',
      'nav.collections': 'Collections',
      'nav.about': 'About',
      'nav.contact': 'Contact',
      'nav.cart': 'Cart',
      'nav.wishlist': 'Wishlist',
      'nav.checkout': 'Checkout',
      'promo.text': '✨ FREE shipping on orders over $100 — Use code WELCOME20 for 20% off!',
      'promo.link': 'Shop Now →',
      'sale.title': '⏰ Flash Sale Ends In',
      'trust.title': 'The NOIR Difference',
      'trust.shipping': 'Free Shipping Over $100',
      'trust.returns': '30-Day Returns',
      'trust.secure': 'Secure Checkout',
      'trust.quality': 'Premium Quality',
      'trust.authentic': 'Authenticity Guaranteed',
    },
  },
  pages: () => {
    const nav = makeNavbar('👑 NOIR', [
      { label: 'Home', href: '#' },
      { label: 'Shop', href: '#shop' },
      { label: 'New Arrivals', href: '#new' },
      { label: 'Collections', href: '#collections' },
      { label: 'Rewards', href: '#rewards' },
      { label: 'About', href: '#about' },
      { label: 'Contact', href: '#contact' },
    ], 'Shop Now', {
      showSearch: true,
      showLanguageSwitcher: true,
      languageSwitcherVariant: 'flags',
      languages: [
        { code: 'en', label: 'English', direction: 'ltr' as const },
        { code: 'fr', label: 'Français', direction: 'ltr' as const },
      ],
      currentLanguage: 'en',
    });

    const foot = makeFooter('NOIR', 'Luxury fashion, ethically crafted', '+1 (555) 900-0000', 'concierge@noir.com', {
      links: [
        { label: 'Home', href: '#' },
        { label: 'Shop', href: '#shop' },
        { label: 'New Arrivals', href: '#new' },
        { label: 'About', href: '#about' },
        { label: 'Contact', href: '#contact' },
        { label: 'FAQ', href: '#faq' },
      ],
      socialLinks: [
        { platform: 'instagram', url: '#' },
        { platform: 'tiktok', url: '#' },
        { platform: 'pinterest', url: '#' },
        { platform: 'facebook', url: '#' },
      ],
    });

    return [
      // ═══════════════════════════════════════════════════
      // HOME — Premium storefront with all premium blocks
      // ═══════════════════════════════════════════════════
      page('Home', '', [
        nav(),
        comp('marquee', 'Marquee', {
          text: '👑 WINTER SALE — Up to 50% off selected collections • FREE WORLDWIDE SHIPPING on orders over $150 👑',
          speed: 20,
        }),
        comp('announcement-bar', 'Promo', {
          text: '✨ FREE shipping on orders over $100 — Use code WELCOME20 for 20% off!',
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
              heading: 'Luxury Redefined',
              subheading: 'Discover exclusive collections curated for discerning fashion connoisseurs. Artisan craftsmanship, timeless design.',
              backgroundImage: IMG.boutiqueHero, overlayOpacity: 55,
              buttons: [
                { text: 'Shop Now', link: '#shop', variant: 'primary' },
                { text: 'View Collections', link: '#collections', variant: 'outline' },
              ],
            },
            {
              heading: 'New Season — New Styles',
              subheading: 'The Spring/Summer 2026 collection has arrived. Modern cuts, luxurious materials.',
              backgroundImage: IMG.ecomLifestyle, overlayOpacity: 45,
              buttons: [{ text: 'Explore Collection', link: '#new', variant: 'primary' }],
            },
            {
              heading: 'Exceptional Accessories',
              subheading: 'Artisan watches, leather bags, refined jewelry. Complete your signature style.',
              backgroundImage: IMG.fashion3, overlayOpacity: 50,
              buttons: [{ text: 'Discover', link: '#shop', variant: 'primary' }],
            },
          ],
        }),
        comp('trust-badges', 'Trust', {
          title: 'The NOIR Difference',
          badges: [
            { icon: '🚚', label: 'Free Shipping Over $100' },
            { icon: '↩️', label: '30-Day Returns' },
            { icon: '🔒', label: 'Secure Checkout' },
            { icon: '💎', label: 'Premium Quality' },
            { icon: '✅', label: 'Authenticity Guaranteed' },
          ],
        }),
        comp('animated-stats', 'Stats', {
          stats: [
            { value: '100', label: 'Orders Delivered', suffix: 'K+' },
            { value: '4.9', label: 'Customer Rating', suffix: '★' },
            { value: '25', label: 'Countries Shipped', suffix: '+' },
            { value: '80', label: 'Exclusive Brands', suffix: '+' },
          ],
          variant: 'gradient', columns: 4, animationStyle: 'count',
        }),
        comp('product-carousel', 'Best Sellers', {
          title: 'Best Sellers', subtitle: 'Our most coveted pieces',
          showArrows: true, showDots: true, autoPlay: true, autoPlaySpeed: 4000, cardStyle: 'elevated',
          products: [
            { name: 'Cashmere Overcoat', price: '$595', badge: 'Best Seller', rating: 5, description: 'Italian cashmere, handcrafted.' },
            { name: 'Silk Evening Gown', price: '$425', oldPrice: '$550', rating: 5, description: 'Pure mulberry silk, flowing silhouette.' },
            { name: 'Artisan Leather Bag', price: '$345', badge: 'Exclusive', rating: 5, description: 'Full-grain vegetable-tanned leather.' },
            { name: 'Swiss Automatic Watch', price: '$890', rating: 5, description: 'Sapphire crystal, exhibition caseback.' },
            { name: 'Merino Wool Suit', price: '$745', badge: 'New', rating: 5, description: 'Bespoke tailoring, Super 130s wool.' },
            { name: 'Crystal Chandelier Earrings', price: '$195', oldPrice: '$250', badge: 'Sale', rating: 5, description: 'Swarovski crystals, 18k gold-plated.' },
          ],
        }),
        comp('product-card', 'Categories', {
          title: 'Shop by Category', subtitle: 'Find your signature style', columns: 3, variant: 'overlay',
          showWishlist: true, showRating: true,
          products: [
            { name: 'Women\'s Collection', price: 'From $89', badge: 'New Season', rating: 5, description: 'Elegant pieces for every occasion.' },
            { name: 'Men\'s Collection', price: 'From $79', rating: 5, description: 'Modern essentials, timeless craftsmanship.' },
            { name: 'Accessories & Jewelry', price: 'From $45', badge: 'Trending', rating: 5, description: 'Watches, bags, scarves, and more.' },
          ],
        }),
        comp('parallax', 'Parallax', {
          imageUrl: IMG.boutique2,
          heading: 'Pure Luxury',
          subheading: 'Every piece tells a story of craftsmanship and elegance',
          height: 'medium', overlayOpacity: 55,
        }),
        comp('image-text', 'Brand Story', {
          title: 'Artisan Craftsmanship. Ethically Sourced.',
          description: 'Every NOIR piece is meticulously crafted by master artisans using sustainably sourced materials. We partner with workshops across Italy, France, and Japan who share our unwavering commitment to quality and fair labor practices.',
          imageUrl: IMG.boutiqueStore, imagePosition: 'left',
        }),
        comp('product-card', 'New Arrivals', {
          title: 'New Arrivals', subtitle: 'Fresh this week', columns: 4, variant: 'compact',
          showWishlist: true, showRating: true, bgColor: '#111118',
          products: [
            { name: 'Velvet Blazer', price: '$385', badge: 'New', rating: 5 },
            { name: 'Organic Silk Blouse', price: '$165', badge: 'Eco', rating: 5 },
            { name: 'Leather Ankle Boots', price: '$295', rating: 5 },
            { name: 'Cashmere Scarf', price: '$145', oldPrice: '$195', rating: 4 },
          ],
        }),
        comp('reviews', 'Reviews', {
          title: 'What Our Clients Say', variant: 'featured', showAverage: true, showVerified: true,
          reviews: [
            { name: 'Isabelle M.', rating: 5, text: 'The quality is simply extraordinary. My cashmere overcoat is the finest garment I\'ve ever owned. The attention to every detail is remarkable.', date: 'Jan 2026', verified: true, helpful: 42, title: 'Unparalleled Quality' },
            { name: 'Alexander R.', rating: 5, text: 'Impeccable service and stunning packaging. Every purchase feels like a gift. NOIR has become my go-to for luxury fashion.', date: 'Dec 2025', verified: true, helpful: 28 },
            { name: 'Sophie L.', rating: 5, text: 'The silk evening gown was breathtaking. Perfectly tailored and the fabric is divine. Worth every cent.', date: 'Nov 2025', verified: true, helpful: 19 },
          ],
        }),
        comp('logo-cloud', 'Featured In', {
          title: 'As Featured In', bgColor: '#0d0d14',
          logos: ['Vogue', 'Harper\'s Bazaar', 'GQ', 'Elle', 'Esquire', 'W Magazine', 'WWD'],
        }),
        // ── Loyalty Points Widget ──
        comp('callout', 'Loyalty Widget', {
          icon: '👑',
          title: 'NOIR Loyalty Program',
          text: 'Earn points on every purchase. Unlock exclusive rewards, priority shipping, and personal styling — join 50K+ members.',
          variant: 'accent',
          ctaText: 'Learn More', ctaLink: '#rewards',
        }),
        comp('cta-banner', 'CTA', {
          heading: 'Join the NOIR Circle',
          subheading: 'Get 20% off your first order with code WELCOME20',
          ctaText: 'Shop Collection', ctaLink: '#shop',
        }),
        comp('newsletter', 'Newsletter', {
          title: 'Stay Connected',
          subtitle: 'Subscribe for exclusive previews, early access, and 10% off your next order.',
          placeholder: 'Enter your email', buttonText: 'Subscribe',
          variant: 'split', showIcon: true, iconType: 'sparkles',
        }),
        comp('popup', 'Welcome Popup', {
          title: '🎉 Welcome to NOIR',
          text: 'Join our exclusive circle and receive 20% off your first order. Plus complimentary shipping on orders over $100.',
          ctaText: 'Claim My Discount', ctaLink: '#', imageUrl: '',
          trigger: 'delay', triggerDelay: 5, position: 'center', animation: 'scale',
          showOverlay: true, overlayOpacity: 60, dismissible: true,
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
          phoneNumber: '+15559000000',
          defaultMessage: 'Hi! I have a question about a product.',
          position: 'bottom-right', pulseAnimation: true,
          showGreeting: true, greetingText: 'Hi there! 👋 Need styling advice?',
          agentName: 'NOIR Concierge',
        }),
        comp('scroll-to-top', 'Scroll Top', {
          position: 'bottom-right', showAfterScroll: 400, smooth: true, rounded: true, shadow: true,
        }),
        foot(),
      ], true, 0),

      // ═══════════════════════════════════════════════════
      // SHOP — Full product catalog with filters
      // ═══════════════════════════════════════════════════
      page('Shop', 'shop', [
        nav(),
        comp('hero', 'Shop Hero', {
          heading: 'All Products',
          subheading: 'Browse our full collection of luxury fashion and accessories.',
          alignment: 'center', height: 'small',
        }),
        comp('product-filter', 'Filters', {
          title: 'Filter Products',
          showSearch: true, showSort: true, showPriceRange: true,
          categories: [
            { label: 'All', value: 'all' },
            { label: 'Women', value: 'women' },
            { label: 'Men', value: 'men' },
            { label: 'Accessories', value: 'accessories' },
            { label: 'Jewelry', value: 'jewelry' },
            { label: 'Shoes', value: 'shoes' },
          ],
          priceRanges: [
            { label: 'Under $100', min: 0, max: 100 },
            { label: '$100 - $300', min: 100, max: 300 },
            { label: '$300 - $500', min: 300, max: 500 },
            { label: '$500+', min: 500, max: 9999 },
          ],
          sortOptions: [
            { label: 'Newest', value: 'newest' },
            { label: 'Price: Low to High', value: 'price-asc' },
            { label: 'Price: High to Low', value: 'price-desc' },
            { label: 'Best Rating', value: 'rating-desc' },
          ],
        }),
        comp('product-card', 'All Products', {
          title: 'Shop All', subtitle: 'Curated luxury for every style', columns: 3, variant: 'default',
          showWishlist: true, showQuickView: true, showRating: true,
          products: [
            { name: 'Cashmere Overcoat', price: '$595', rating: 5, description: 'Italian cashmere, handcrafted.', badge: 'Best Seller' },
            { name: 'Silk Evening Gown', price: '$425', oldPrice: '$550', rating: 5, description: 'Pure mulberry silk.', badge: 'Sale' },
            { name: 'Artisan Leather Bag', price: '$345', badge: 'Exclusive', rating: 5, description: 'Vegetable-tanned leather.' },
            { name: 'Swiss Automatic Watch', price: '$890', rating: 5, description: 'Sapphire crystal, Swiss movement.' },
            { name: 'Merino Wool Suit', price: '$745', badge: 'New', rating: 5, description: 'Super 130s wool, bespoke cut.' },
            { name: 'Crystal Earrings', price: '$195', oldPrice: '$250', rating: 5, description: 'Swarovski, 18k gold-plated.' },
            { name: 'Velvet Blazer', price: '$385', badge: 'New', rating: 5, description: 'Italian velvet, slim fit.' },
            { name: 'Organic Silk Blouse', price: '$165', badge: 'Eco', rating: 5, description: 'Certified organic silk.' },
            { name: 'Leather Ankle Boots', price: '$295', rating: 5, description: 'Handcrafted in Italy.' },
          ],
        }),
        foot(),
      ], false, 1),

      // ═══════════════════════════════════════════════════
      // NEW ARRIVALS
      // ═══════════════════════════════════════════════════
      page('New Arrivals', 'new', [
        nav(),
        comp('hero', 'New Hero', {
          heading: 'New Arrivals',
          subheading: 'Fresh arrivals every week. Be the first to discover.',
          alignment: 'center', height: 'medium',
          backgroundImage: IMG.boutique3, overlayOpacity: 55,
        }),
        comp('product-carousel', 'New Carousel', {
          title: 'Just Arrived', autoPlay: true, autoPlaySpeed: 3000, showDots: true, cardStyle: 'elevated',
          products: [
            { name: 'Velvet Evening Clutch', price: '$225', badge: 'New', rating: 5 },
            { name: 'Cashmere Turtleneck', price: '$275', badge: 'Exclusive', rating: 5 },
            { name: 'Suede Chelsea Boots', price: '$365', rating: 5 },
            { name: 'Pearl Necklace Set', price: '$185', oldPrice: '$245', rating: 5 },
          ],
        }),
        comp('product-card', 'This Season', {
          title: 'This Season', columns: 3, variant: 'default', showWishlist: true, showRating: true,
          products: [
            { name: 'Linen Summer Blazer', price: '$285', badge: 'New', rating: 5, description: 'Unstructured, breathable linen.' },
            { name: 'Silk Pocket Square Set', price: '$95', rating: 5, description: 'Hand-rolled edges, 4-piece set.' },
            { name: 'Artisan Belt', price: '$165', badge: 'Popular', rating: 5, description: 'Full-grain bridle leather.' },
          ],
        }),
        foot(),
      ], false, 2),

      // ═══════════════════════════════════════════════════
      // COLLECTIONS — Tabs-based browsing
      // ═══════════════════════════════════════════════════
      page('Collections', 'collections', [
        nav(),
        comp('hero', 'Collections', {
          heading: 'Our Collections',
          subheading: 'Curated selections for every style and season.',
          alignment: 'center', height: 'medium',
          backgroundImage: IMG.boutique1, overlayOpacity: 55,
        }),
        comp('tabs', 'Collection Tabs', {
          variant: 'pills',
          tabs: [
            { label: 'Spring/Summer 2026', content: '<p>Light fabrics, bold patterns, and effortless elegance. Our SS26 collection embraces Mediterranean influences with modern cuts.</p>' },
            { label: 'Autumn/Winter 2025', content: '<p>Rich textures, deep tones, and layered sophistication. Cashmere, velvet, and fine wool dominate this season.</p>' },
            { label: 'Essentials', content: '<p>Timeless wardrobe staples that never go out of style. Invest in pieces that last a lifetime.</p>' },
            { label: 'Limited Editions', content: '<p>Exclusive collaborations and one-of-a-kind pieces. Once they\'re gone, they\'re gone forever.</p>' },
          ],
        }),
        comp('product-card', 'Collection Grid', {
          title: 'Featured Collection', columns: 3, variant: 'overlay', showWishlist: true, showRating: true,
          products: [
            { name: 'Riviera Linen Set', price: '$445', badge: 'SS26', rating: 5, description: 'Two-piece linen suit, relaxed fit.' },
            { name: 'Amalfi Silk Dress', price: '$385', badge: 'SS26', rating: 5, description: 'Hand-printed silk, midi length.' },
            { name: 'Côte d\'Azur Sandals', price: '$225', badge: 'New', rating: 5, description: 'Artisan leather, hand-stitched.' },
          ],
        }),
        comp('parallax', 'Parallax', {
          imageUrl: IMG.boutique4,
          heading: 'Crafted with Passion',
          subheading: 'Each collection is designed in Paris and crafted by master artisans',
          height: 'small', overlayOpacity: 60,
        }),
        foot(),
      ], false, 3),

      // ═══════════════════════════════════════════════════
      // PRODUCT DETAIL
      // ═══════════════════════════════════════════════════
      page('Product', 'product', [
        nav(),
        comp('product-detail', 'Product Page', {
          name: 'Cashmere Overcoat',
          price: '$595',
          oldPrice: '$795',
          description: 'Exquisitely crafted from 100% Italian cashmere, our signature overcoat features a relaxed silhouette with notch lapels, double-breasted closure, and hand-finished details. Each coat requires over 40 hours of skilled craftsmanship.',
          images: [IMG.boutique1, IMG.boutique2, IMG.boutique3],
          badge: 'Best Seller',
          inStock: true,
          variants: [
            { label: 'Size', options: ['XS', 'S', 'M', 'L', 'XL'] },
            { label: 'Color', options: ['Camel', 'Charcoal', 'Navy', 'Ivory'] },
          ],
          features: [
            '100% Italian cashmere',
            'Double-breasted closure',
            'Hand-finished details',
            'Silk-lined interior',
            'Made in Italy',
            'Dry clean only',
          ],
        }),
        // ── Size Guide Popup ──
        comp('popup', 'Size Guide', {
          title: '📏 Size Guide',
          text: 'Find your perfect fit with our detailed size chart. Measure your chest, waist, and hips for the ideal fit.\n\n| Size | Chest (cm) | Waist (cm) | Hips (cm) |\n|------|-----------|-----------|----------|\n| XS | 82–86 | 66–70 | 90–94 |\n| S | 87–91 | 71–75 | 95–99 |\n| M | 92–96 | 76–80 | 100–104 |\n| L | 97–101 | 81–85 | 105–109 |\n| XL | 102–106 | 86–90 | 110–114 |',
          trigger: 'click', position: 'center', animation: 'scale',
          showOverlay: true, overlayOpacity: 60, dismissible: true,
          buttons: [
            { text: 'View Full Guide', variant: 'primary', action: 'link', link: '#' },
            { text: 'Close', variant: 'ghost', action: 'close' },
          ],
        }),
        // ── Before/After Fabric Comparison ──
        comp('before-after', 'Fabric Comparison', {
          beforeImage: IMG.fashion1,
          afterImage: IMG.boutique1,
          beforeLabel: 'Standard',
          afterLabel: 'NOIR Premium',
          height: 400,
        }),
        comp('product-carousel', 'Related', {
          title: 'You May Also Like', showArrows: true, showDots: false, cardStyle: 'elevated',
          products: [
            { name: 'Merino Wool Suit', price: '$745', rating: 5 },
            { name: 'Cashmere Scarf', price: '$145', rating: 5 },
            { name: 'Artisan Leather Bag', price: '$345', rating: 5 },
            { name: 'Swiss Watch', price: '$890', rating: 5 },
          ],
        }),
        comp('reviews', 'Product Reviews', {
          title: 'Customer Reviews', variant: 'list', showAverage: true, showVerified: true, showHelpful: true,
          reviews: [
            { name: 'Isabelle M.', rating: 5, text: 'The most luxurious coat I\'ve ever owned. Worth every penny — the cashmere is incredibly soft and the construction is impeccable.', date: 'Jan 2026', verified: true, helpful: 42, title: 'Absolute Perfection' },
            { name: 'Alexander R.', rating: 5, text: 'Ordered in Camel, it\'s stunning. Fits beautifully and the packaging was a gorgeous experience.', date: 'Dec 2025', verified: true, helpful: 28 },
            { name: 'Sophie L.', rating: 5, text: 'Treated myself for Christmas. The quality exceeds many designer brands at twice the price.', date: 'Nov 2025', verified: true, helpful: 19 },
          ],
        }),
        foot(),
      ], false, 4),

      // ═══════════════════════════════════════════════════
      // CART
      // ═══════════════════════════════════════════════════
      page('Cart', 'cart', [
        nav(),
        comp('hero', 'Cart Hero', {
          heading: 'Your Cart',
          subheading: 'Review your items before checkout.',
          alignment: 'center', height: 'small',
        }),
        comp('cart', 'Cart', {
          items: [
            { name: 'Cashmere Overcoat (Camel, M)', price: '$595', quantity: 1, imageUrl: IMG.boutique1 },
            { name: 'Silk Evening Gown (Ivory, S)', price: '$425', quantity: 1, imageUrl: IMG.boutique2 },
            { name: 'Crystal Chandelier Earrings', price: '$195', quantity: 2, imageUrl: IMG.boutique3 },
          ],
          subtotal: '$1,410', shipping: 'Free', total: '$1,410',
        }),
        comp('product-carousel', 'Upsell', {
          title: 'Complete Your Look', showArrows: true, cardStyle: 'elevated',
          products: [
            { name: 'Cashmere Scarf', price: '$145', rating: 5 },
            { name: 'Artisan Belt', price: '$165', rating: 5, badge: 'Popular' },
            { name: 'Silk Pocket Square', price: '$65', rating: 5 },
          ],
        }),
        foot(),
      ], false, 5),

      // ═══════════════════════════════════════════════════
      // CHECKOUT
      // ═══════════════════════════════════════════════════
      page('Checkout', 'checkout', [
        nav(),
        comp('hero', 'Checkout Hero', {
          heading: 'Secure Checkout',
          subheading: 'Complete your order securely.',
          alignment: 'center', height: 'small',
        }),
        comp('checkout', 'Checkout', {
          title: 'Checkout',
          variant: 'split',
          items: [
            { name: 'Cashmere Overcoat (Camel, M)', price: '$595', quantity: 1, variant: 'Camel / M', imageUrl: IMG.boutique1 },
            { name: 'Silk Evening Gown (Ivory, S)', price: '$425', quantity: 1, variant: 'Ivory / S', imageUrl: IMG.boutique2 },
            { name: 'Crystal Earrings', price: '$195', quantity: 2, imageUrl: IMG.boutique3 },
          ],
          subtotal: '$1,410',
          shipping: 'Free',
          tax: '$112.80',
          total: '$1,522.80',
          paymentMethods: ['Credit Card', 'PayPal', 'Apple Pay', 'Google Pay'],
          shippingMethods: [
            { label: 'Complimentary Standard', price: 'Free', estimate: '5–7 business days' },
            { label: 'Express Delivery', price: '$14.99', estimate: '2–3 business days' },
            { label: 'Next Day Priority', price: '$29.99', estimate: '1 business day' },
          ],
          buttonText: 'Place Order',
          showTrustBadges: true,
          checkoutSettings: {
            collectSubmissions: true,
            successMessage: 'Thank you for your order! A confirmation email has been sent.',
            showOrderNotes: true,
            showCouponField: true,
            requireTerms: true,
            termsText: 'I agree to the Terms of Service and Privacy Policy',
          },
        }),
        foot(),
      ], false, 6),

      // ═══════════════════════════════════════════════════
      // WISHLIST
      // ═══════════════════════════════════════════════════
      page('Wishlist', 'wishlist', [
        nav(),
        comp('hero', 'Wishlist Hero', {
          heading: 'Your Wishlist',
          subheading: 'Items you\'ve loved.',
          alignment: 'center', height: 'small',
        }),
        comp('wishlist-grid', 'Wishlist', {
          title: 'My Wishlist',
          columns: 4,
          showMoveToCart: true,
          items: [
            { name: 'Swiss Automatic Watch', price: '$890', imageUrl: IMG.fashion2, inStock: true },
            { name: 'Velvet Blazer', price: '$385', oldPrice: '$450', imageUrl: IMG.boutique4, inStock: true },
            { name: 'Pearl Necklace Set', price: '$185', imageUrl: IMG.fashion5, inStock: true },
            { name: 'Suede Chelsea Boots', price: '$365', imageUrl: IMG.fashion4, inStock: false },
          ],
        }),
        comp('product-carousel', 'Recommendations', {
          title: 'You Might Also Love', showArrows: true, cardStyle: 'elevated',
          products: [
            { name: 'Cashmere Overcoat', price: '$595', rating: 5, badge: 'Best Seller' },
            { name: 'Silk Evening Gown', price: '$425', rating: 5 },
            { name: 'Artisan Leather Bag', price: '$345', rating: 5 },
          ],
        }),
        foot(),
      ], false, 7),

      // ═══════════════════════════════════════════════════
      // ABOUT — Brand story
      // ═══════════════════════════════════════════════════
      page('About', 'about', [
        nav(),
        comp('hero', 'About Hero', {
          heading: 'Our Story',
          subheading: 'Fashion with purpose — built on style & sustainability.',
          alignment: 'center', height: 'medium',
          backgroundImage: IMG.boutiqueStore, overlayOpacity: 55,
        }),
        comp('image-text', 'Story', {
          title: 'Built on Style & Sustainability',
          description: 'NOIR was born from a belief that luxury fashion should be both beautiful and responsible. We partner with artisan workshops in Italy, France, and Japan, using sustainably sourced materials to create pieces that look extraordinary and feel even better.',
          imageUrl: IMG.boutique1, imagePosition: 'right',
        }),
        comp('animated-stats', 'Impact', {
          stats: [
            { value: '100', label: 'Happy Clients', suffix: 'K+' },
            { value: '100', label: 'Sustainable Materials', suffix: '%' },
            { value: '25', label: 'Countries', suffix: '+' },
            { value: '4.9', label: 'Customer Rating', suffix: '★' },
          ],
          variant: 'cards', columns: 4, animationStyle: 'count',
        }),
        comp('timeline', 'Journey', {
          title: 'Our Journey',
          items: [
            { date: '2019', title: 'Founded', description: 'NOIR launched as an online luxury boutique with 20 curated pieces.' },
            { date: '2021', title: 'Sustainability Pledge', description: '100% sustainable and ethical sourcing across all product lines.' },
            { date: '2023', title: '100K Customers', description: 'Reached our biggest milestone — a global community of 100,000 connoisseurs.' },
            { date: '2025', title: 'Atelier Partnership', description: 'Exclusive partnerships with 80+ artisan workshops worldwide.' },
            { date: '2026', title: 'Global Expansion', description: 'Now shipping to 25 countries with regional warehouses.' },
          ],
        }),
        comp('team-grid', 'Team', {
          title: 'The NOIR Team',
          members: [
            { name: 'Margaux Dupont', role: 'Creative Director', bio: 'Former Chanel atelier lead. 15 years in luxury fashion.', avatar: AVATAR.w1 },
            { name: 'James Sterling', role: 'CEO & Co-Founder', bio: 'Harvard MBA. Built 3 fashion brands to $100M+.', avatar: AVATAR.m1 },
            { name: 'Yuki Tanaka', role: 'Head of Design', bio: 'Tokyo-trained, Paris-refined. Minimalism meets luxury.', avatar: AVATAR.w3 },
            { name: 'Marco Bellini', role: 'Head of Production', bio: 'Italian artisan heritage. Quality is non-negotiable.', avatar: AVATAR.m3 },
          ],
        }),
        comp('lightbox-gallery', 'Gallery', {
          title: 'Behind the Scenes', columns: 3,
          images: [
            { url: IMG.boutique1, caption: 'Atelier Workshop' },
            { url: IMG.boutique2, caption: 'Material Sourcing' },
            { url: IMG.boutique3, caption: 'Quality Inspection' },
            { url: IMG.boutique4, caption: 'Design Studio' },
            { url: IMG.boutiqueStore, caption: 'Our Flagship' },
            { url: IMG.fashion6, caption: 'Photo Shoot' },
          ],
        }),
        foot(),
      ], false, 8),

      // ═══════════════════════════════════════════════════
      // LOYALTY REWARDS — Points program
      // ═══════════════════════════════════════════════════
      page('Loyalty Rewards', 'rewards', [
        nav(),
        comp('hero', 'Rewards Hero', {
          heading: 'NOIR Loyalty Program',
          subheading: 'Earn rewards on every purchase. Unlock exclusive perks as you level up.',
          alignment: 'center', height: 'medium',
          backgroundImage: IMG.boutiqueStore, overlayOpacity: 65,
        }),
        comp('animated-stats', 'Loyalty Stats', {
          stats: [
            { value: '5', label: 'Points per $ Spent', suffix: 'x' },
            { value: '50', label: 'Active Members', suffix: 'K+' },
            { value: '250', label: 'Rewards Redeemed', suffix: 'K+' },
            { value: '2', label: 'Member Savings', suffix: 'M+', prefix: '$' },
          ],
          variant: 'gradient', columns: 4, animationStyle: 'count',
        }),
        comp('features', 'How It Works', {
          title: 'How It Works', bgColor: '#111118', columns: 4,
          features: [
            { icon: 'ShoppingBag', title: 'Shop', description: 'Earn 5 points for every $1 spent at NOIR.' },
            { icon: 'Coins', title: 'Accumulate', description: 'Points add up automatically in your account.' },
            { icon: 'Gift', title: 'Redeem', description: 'Use points for discounts, free shipping, and more.' },
            { icon: 'Crown', title: 'Level Up', description: 'Unlock exclusive perks as you reach higher tiers.' },
          ],
        }),
        comp('progress', 'Tier Progress', {
          title: 'Tier Progression',
          items: [
            { label: 'Bronze — 0+ points', value: 25 },
            { label: 'Silver — 500+ points', value: 50 },
            { label: 'Gold — 2,000+ points', value: 75 },
            { label: 'Platinum — 5,000+ points', value: 100 },
          ],
        }),
        comp('comparison-table', 'Tiers', {
          title: 'Tier Benefits',
          headers: ['Benefit', 'Bronze', 'Silver', 'Gold', 'Platinum'],
          rows: [
            { feature: 'Points Multiplier', values: ['1x', '1.5x', '2x', '3x'] },
            { feature: 'Birthday Bonus', values: ['50 pts', '100 pts', '200 pts', '500 pts'] },
            { feature: 'Early Access', values: ['false', 'true', 'true', 'true'] },
            { feature: 'Free Express Shipping', values: ['false', 'false', 'true', 'true'] },
            { feature: 'Personal Stylist', values: ['false', 'false', 'false', 'true'] },
            { feature: 'Exclusive Events', values: ['false', 'false', 'true', 'true'] },
            { feature: 'Anniversary Gift', values: ['false', 'false', '$50 credit', '$100 credit'] },
          ],
        }),
        comp('icon-text', 'Rewards', {
          items: [
            { icon: '🎁', title: '500 Points', description: '$25 off your next order' },
            { icon: '🚚', title: '300 Points', description: 'Free express shipping on any order' },
            { icon: '✨', title: '1,000 Points', description: '$60 off + exclusive member gift' },
            { icon: '👑', title: '2,500 Points', description: '$150 credit + personal styling session' },
          ],
          layout: 'horizontal',
        }),
        comp('testimonials', 'Member Stories', {
          title: 'What Members Say', variant: 'carousel', bgColor: '#111118',
          testimonials: [
            { name: 'Isabelle M.', role: 'Gold Member', text: 'The loyalty program is incredible. I\'ve saved over $400 in rewards this year alone. The early access to new collections is my favorite perk.', rating: 5, avatar: AVATAR.w1 },
            { name: 'Alexander R.', role: 'Platinum Member', text: 'The personal styling sessions are worth their weight in gold. My stylist knows exactly what suits me.', rating: 5, avatar: AVATAR.m2 },
            { name: 'Sophie L.', role: 'Silver Member', text: 'I love watching my points grow! Already halfway to Gold tier and can\'t wait for those extra perks.', rating: 5, avatar: AVATAR.w3 },
          ],
        }),
        comp('faq', 'Rewards FAQ', {
          title: 'Rewards FAQ', variant: 'accordion',
          items: [
            { question: 'How do I join?', answer: 'Simply create an account. You\'re automatically enrolled at Bronze tier and start earning points immediately.' },
            { question: 'Do points expire?', answer: 'Points are valid for 12 months from date of earning. Active purchases extend all your points.' },
            { question: 'Can I combine points with promo codes?', answer: 'Yes! Points redemption can be combined with most promotional offers.' },
            { question: 'How do I check my points balance?', answer: 'Log in to your account and visit the Loyalty section. Your balance, tier, and available rewards are all displayed.' },
          ],
        }),
        comp('cta-banner', 'Rewards CTA', {
          heading: 'Start Earning Today',
          subheading: 'Create an account and earn 100 bonus points instantly.',
          ctaText: 'Join Now', ctaLink: '#',
        }),
        foot(),
      ], false, 9),

      // ═══════════════════════════════════════════════════
      // CONTACT + FAQ
      // ═══════════════════════════════════════════════════
      page('Contact', 'contact', [
        nav(),
        comp('hero', 'Contact Hero', {
          heading: 'Get in Touch',
          subheading: 'We\'d love to hear from you. Our concierge team responds within 24 hours.',
          alignment: 'center', height: 'small',
        }),
        comp('contact-form', 'Form', {
          title: 'Send Us a Message',
          subtitle: 'For order issues, include your order number.',
          fields: ['name', 'email', 'phone', 'message'],
          submitText: 'Send Message',
          variant: 'card', showIcon: true,
          formSettings: {
            collectSubmissions: true,
            successMessage: 'Thank you! Our concierge will respond within 24 hours.',
          },
        }),
        comp('icon-text', 'Info', {
          items: [
            { icon: '📧', title: 'Email', description: 'concierge@noir.com' },
            { icon: '💬', title: 'Live Chat', description: 'Available Mon-Fri 9AM-8PM EST' },
            { icon: '📱', title: 'WhatsApp', description: '+1 (555) 900-0000' },
            { icon: '📍', title: 'Flagship', description: '500 Fifth Ave, New York, NY 10036' },
          ],
          layout: 'horizontal',
        }),
        comp('faq', 'FAQ', {
          title: 'Frequently Asked Questions', variant: 'accordion',
          items: [
            { question: 'What is your return policy?', answer: 'We offer a 30-day hassle-free return policy. Items must be unworn with tags attached. Complimentary return shipping on all orders.' },
            { question: 'How long does shipping take?', answer: 'Standard: 5–7 business days (free on orders $100+). Express: 2–3 business days ($14.99). Next-day: 1 business day ($29.99).' },
            { question: 'Do you ship internationally?', answer: 'Yes! We ship to 25 countries. International orders typically arrive in 7–14 business days.' },
            { question: 'How do I find my size?', answer: 'Check our Size Guide on each product page. We also offer complimentary exchanges if the fit isn\'t right.' },
            { question: 'Are your products sustainable?', answer: 'Yes — all materials are ethically sourced and we use sustainable production methods. Our packaging is 100% recyclable.' },
          ],
        }),
        comp('social-links', 'Social', {
          title: 'Follow Us',
          links: [
            { platform: 'instagram', url: '#', label: '@noir' },
            { platform: 'tiktok', url: '#', label: 'TikTok' },
            { platform: 'pinterest', url: '#', label: 'Pinterest' },
            { platform: 'facebook', url: '#', label: 'Facebook' },
          ],
          variant: 'cards',
        }),
        foot(),
      ], false, 10),
    ];
  },
};

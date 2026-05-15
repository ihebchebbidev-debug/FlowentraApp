import { SiteTemplate } from '../index';
import { IMG, AVATAR } from '../images';
import { comp, page, makeNavbar, makeFooter } from '../helpers';
import { RESTAURANT_THEME } from '../themes';

export const restaurantTemplate: SiteTemplate = {
  id: 'restaurant',
  name: 'Restaurant & Bistro',
  description: 'Elegant restaurant website with menu, gallery, reservations, events, chef profiles, location map and multilingual support.',
  icon: '🍽️',
  category: 'Food & Drink',
  theme: RESTAURANT_THEME,
  pageCount: 6,
  features: ['Hero carousel', 'Menu tabs', 'Food gallery', 'Reservation form', 'Events tabs', 'Chef profiles', 'Location map', 'WhatsApp chat', 'Language switcher', 'Trust badges', 'Newsletter', 'Parallax'],
  previewImage: IMG.restaurantHero,
  pages: () => {
    const nav = makeNavbar('🍽️ La Maison', [
      { label: 'Home', href: '#' },
      { label: 'Menu', href: '#menu' },
      { label: 'About', href: '#about' },
      { label: 'Reservations', href: '#reserve' },
      { label: 'Gallery', href: '#gallery' },
      { label: 'Contact', href: '#contact' },
    ], 'Reserve Table', {
      showLanguageSwitcher: true,
      languageSwitcherVariant: 'dropdown',
      languages: [
        { code: 'en', label: 'English', direction: 'ltr' },
        { code: 'fr', label: 'Français', direction: 'ltr' },
        { code: 'es', label: 'Español', direction: 'ltr' },
      ],
      currentLanguage: 'en',
    });
    const foot = makeFooter('La Maison Bistro', 'Fine dining with a modern twist', '(555) 987-6543', 'hello@lamaison.com', {
      links: [{ label: 'Home', href: '#' }, { label: 'Menu', href: '#menu' }, { label: 'Reservations', href: '#reserve' }, { label: 'Gallery', href: '#gallery' }, { label: 'Contact', href: '#contact' }],
      socialLinks: [{ platform: 'instagram', url: '#' }, { platform: 'facebook', url: '#' }, { platform: 'twitter', url: '#' }, { platform: 'yelp', url: '#' }],
    });
    return [
      // ═══════════════════════════════════════════════════
      // HOME
      // ═══════════════════════════════════════════════════
      page('Home', '', [
        nav(),
        comp('announcement-bar', 'Promo', {
          text: '🥂 Valentine\'s Special: 5-Course Tasting Menu for Two — $185',
          linkText: 'Reserve Now →', linkUrl: '#reserve', dismissible: true, variant: 'accent',
        }),
        comp('hero', 'Hero', {
          heading: 'Fine Dining, Modern Twist',
          subheading: 'Experience culinary excellence in a warm, inviting atmosphere. Farm-to-table ingredients, handcrafted cocktails, and an unforgettable dining experience.',
          ctaText: 'Reserve a Table', ctaLink: '#reserve',
          secondaryCtaText: 'View Menu', secondaryCtaLink: '#menu',
          alignment: 'center', height: 'large',
          backgroundImage: IMG.restaurantHero, overlayOpacity: 50,
        }),
        comp('trust-badges', 'Awards', {
          title: 'Awards & Recognition',
          badges: [
            { icon: '⭐', label: 'Michelin Recommended' },
            { icon: '🏆', label: 'Best Bistro 2025' },
            { icon: '🍷', label: 'Wine Spectator Award' },
            { icon: '🌿', label: '100% Farm-to-Table' },
          ],
        }),
        comp('animated-stats', 'Stats', {
          stats: [
            { value: '10', label: 'Years of Excellence', suffix: '+' },
            { value: '4.9', label: 'Google Rating', suffix: '★' },
            { value: '200', label: 'Curated Wines', suffix: '+' },
            { value: '50', label: 'Guests Served', suffix: 'K+' },
          ],
          variant: 'cards', columns: 4, animationStyle: 'count',
        }),
        comp('features', 'Highlights', {
          title: 'The La Maison Experience', bgColor: '#faf5f0',
          features: [
            { icon: 'Leaf', title: 'Farm to Table', description: 'Locally sourced ingredients from partner farms within 50 miles.' },
            { icon: 'Wine', title: 'Wine Selection', description: '200+ curated wines from renowned vineyards around the world.' },
            { icon: 'ChefHat', title: 'Award-Winning Chef', description: 'Chef Antoine brings 20 years of Michelin-starred experience.' },
            { icon: 'Music', title: 'Live Jazz', description: 'Live jazz performances every Friday and Saturday evening.' },
          ],
        }),
        comp('image-text', 'Story', {
          title: 'Our Story',
          description: 'La Maison was founded in 2015 by Chef Antoine Dupont with a simple vision: bring the warmth of French country cooking to the heart of New York City. Every dish is crafted with love, tradition, and the finest seasonal ingredients.',
          imageUrl: IMG.restaurantInterior, imagePosition: 'left',
        }),
        comp('marquee', 'Marquee', {
          text: '★ FARM-TO-TABLE • MICHELIN RECOMMENDED • LIVE JAZZ FRIDAY & SATURDAY • 200+ WINE LIST • PRIVATE DINING AVAILABLE ★',
          speed: 25,
        }),
        comp('lightbox-gallery', 'Food Gallery', {
          title: 'A Taste of La Maison', columns: 3,
          images: [
            { url: IMG.food1, caption: 'Pan-Seared Salmon' },
            { url: IMG.food2, caption: 'Garden Salad' },
            { url: IMG.food3, caption: 'Wood-Fired Pizza' },
            { url: IMG.food4, caption: 'Brunch Special' },
            { url: IMG.food5, caption: 'Chocolate Soufflé' },
            { url: IMG.food6, caption: 'Classic Burger' },
          ],
        }),
        comp('testimonials', 'Reviews', {
          title: 'Guest Reviews', variant: 'carousel',
          testimonials: [
            { name: 'Emily R.', role: 'Food Critic, NY Times', text: 'An unforgettable dining experience. Every dish tells a story of passion and craftsmanship.', rating: 5, avatar: AVATAR.w1 },
            { name: 'Michael S.', role: 'Regular Guest', text: 'The best restaurant in the city. The wine pairing menu is exceptional.', rating: 5, avatar: AVATAR.m1 },
            { name: 'Clara D.', role: 'Anniversary Dinner', text: 'The private dining room was perfect for our celebration. Impeccable service.', rating: 5, avatar: AVATAR.w2 },
            { name: 'James P.', role: 'Yelp Elite', text: 'The tasting menu is worth every penny. Chef Antoine is a true artist.', rating: 5, avatar: AVATAR.m2 },
          ],
        }),
        comp('parallax', 'Parallax', {
          imageUrl: IMG.restaurantInterior,
          heading: 'An Experience You\'ll Never Forget',
          subheading: 'Open Tuesday through Sunday, 5PM to 11PM',
          height: 'small', overlayOpacity: 55,
        }),
        comp('cta-banner', 'CTA', {
          heading: 'Join Us for an Unforgettable Evening',
          subheading: 'Private dining available for parties of 8-40 guests.',
          ctaText: 'Make a Reservation', ctaLink: '#reserve',
        }),
        comp('newsletter', 'Newsletter', {
          title: 'Stay in the Know',
          subtitle: 'Get seasonal menus, event invitations, and exclusive offers.',
          placeholder: 'Your email', buttonText: 'Subscribe',
        }),
        comp('whatsapp-button', 'WhatsApp', {
          phoneNumber: '+15559876543', defaultMessage: 'Hi! I would like to make a reservation.',
          position: 'bottom-right', showGreeting: true,
          greetingText: 'Hello! 👋 Want to make a reservation?', agentName: 'La Maison', pulseAnimation: true,
        }),
        comp('scroll-to-top', 'Scroll', { position: 'bottom-right', offsetX: 24, offsetY: 90 }),
        foot(),
      ], true, 0),

      // ═══════════════════════════════════════════════════
      // MENU
      // ═══════════════════════════════════════════════════
      page('Menu', 'menu', [
        nav(),
        comp('hero', 'Menu Hero', {
          heading: 'Our Menu', subheading: 'Seasonal ingredients, timeless flavors.',
          alignment: 'center', height: 'medium', backgroundImage: IMG.food1, overlayOpacity: 55,
        }),
        comp('tabs', 'Menu Tabs', {
          tabs: [
            { label: 'Starters', content: '<p><strong>Truffle Burrata</strong> — $18<br/>Fresh burrata with truffle honey and arugula</p><p><strong>Tuna Tartare</strong> — $22<br/>Yellowfin tuna with avocado and citrus</p><p><strong>French Onion Soup</strong> — $14<br/>Classic preparation with gruyère crouton</p>' },
            { label: 'Mains', content: '<p><strong>Wagyu Ribeye</strong> — $52<br/>12oz prime wagyu with truffle butter</p><p><strong>Pan-Seared Salmon</strong> — $36<br/>Atlantic salmon with lemon beurre blanc</p><p><strong>Duck Confit</strong> — $42<br/>Crispy duck leg with cherry gastrique</p>' },
            { label: 'Desserts', content: '<p><strong>Crème Brûlée</strong> — $14<br/>Madagascar vanilla bean custard</p><p><strong>Chocolate Fondant</strong> — $16<br/>Molten center with vanilla ice cream</p><p><strong>Tarte Tatin</strong> — $15<br/>Caramelized apple with Calvados cream</p>' },
            { label: 'Cocktails', content: '<p><strong>Maison Negroni</strong> — $16<br/>Our signature twist with orange bitters</p><p><strong>Lavender Collins</strong> — $14<br/>Gin, lavender syrup, lemon</p><p><strong>Espresso Martini</strong> — $15<br/>Double shot, vodka, coffee liqueur</p>' },
          ],
        }),
        comp('pricing', 'Tasting Menus', {
          title: 'Tasting Menus',
          plans: [
            { name: 'Seasonal', price: '$85/pp', features: ['4 courses', 'Amuse-bouche', 'Bread selection', 'Petit fours'], highlighted: false },
            { name: 'Chef\'s Table', price: '$135/pp', features: ['7 courses', 'Wine pairing', 'Kitchen tour', 'Signed menu'], highlighted: true },
            { name: 'Private Dining', price: '$175/pp', features: ['Custom menu', 'Private room', 'Personal sommelier', 'Champagne toast'], highlighted: false },
          ],
        }),
        comp('comparison-table', 'Compare', {
          title: 'Tasting Menu Comparison',
          headers: ['Seasonal', 'Chef\'s Table', 'Private'],
          rows: [
            { feature: 'Courses', values: ['4', '7', 'Custom'] },
            { feature: 'Wine Pairing', values: ['false', 'true', 'true'] },
            { feature: 'Kitchen Tour', values: ['false', 'true', 'true'] },
            { feature: 'Private Room', values: ['false', 'false', 'true'] },
            { feature: 'Sommelier', values: ['false', 'false', 'true'] },
          ],
        }),
        foot(),
      ], false, 1),

      // ═══════════════════════════════════════════════════
      // ABOUT
      // ═══════════════════════════════════════════════════
      page('About', 'about', [
        nav(),
        comp('hero', 'About Hero', {
          heading: 'Our Story', subheading: 'Where tradition meets modern culinary artistry.',
          alignment: 'center', height: 'medium', backgroundImage: IMG.restaurantInterior, overlayOpacity: 50,
        }),
        comp('image-text', 'Chef', {
          title: 'Meet Chef Antoine Dupont',
          description: 'With 20 years of Michelin-starred experience across Paris, London, and New York, Chef Antoine brings a unique blend of French technique and global inspiration. His philosophy is simple: respect the ingredient, surprise the palate.',
          imageUrl: AVATAR.m3, imagePosition: 'right',
        }),
        comp('timeline', 'History', {
          title: 'Our Journey',
          items: [
            { date: '2015', title: 'The Grand Opening', description: 'Chef Antoine opens La Maison in New York\'s West Village.' },
            { date: '2017', title: 'First Recognition', description: 'Named "Best New Restaurant" by New York Magazine.' },
            { date: '2019', title: 'Michelin Recommended', description: 'Earned our first Michelin recommendation.' },
            { date: '2022', title: 'Wine Spectator Award', description: 'Our wine program recognized as one of the city\'s best.' },
            { date: '2025', title: '50,000 Guests', description: 'Celebrating a decade of culinary excellence.' },
          ],
        }),
        comp('team-grid', 'Team', {
          title: 'Our Team',
          members: [
            { name: 'Antoine Dupont', role: 'Executive Chef', bio: '20 years Michelin experience.', avatar: AVATAR.m3 },
            { name: 'Sophie Laurent', role: 'Pastry Chef', bio: 'Le Cordon Bleu Paris graduate.', avatar: AVATAR.w1 },
            { name: 'Marcus Webb', role: 'Head Sommelier', bio: 'Master Sommelier, 200+ wine list curator.', avatar: AVATAR.m1 },
            { name: 'Elena Rossi', role: 'Restaurant Manager', bio: 'Ensuring every guest feels at home.', avatar: AVATAR.w2 },
          ],
        }),
        comp('logo-cloud', 'Press', {
          title: 'Featured In', logos: ['NY Times', 'Eater', 'Bon Appétit', 'Food & Wine', 'Michelin Guide', 'Wine Spectator'],
        }),
        foot(),
      ], false, 2),

      // ═══════════════════════════════════════════════════
      // RESERVATIONS
      // ═══════════════════════════════════════════════════
      page('Reservations', 'reservations', [
        nav(),
        comp('hero', 'Reserve Hero', {
          heading: 'Make a Reservation', subheading: 'Book your table for an unforgettable evening.',
          alignment: 'center', height: 'small',
        }),
        comp('contact-form', 'Form', {
          title: 'Reserve Your Table', fields: ['name', 'email', 'phone', 'message'],
          submitText: 'Reserve Now', variant: 'card',
        }),
        comp('icon-text', 'Hours', {
          items: [
            { icon: '⏰', title: 'Dinner', description: 'Tue-Sun: 5PM – 11PM' },
            { icon: '🥂', title: 'Bar', description: 'Tue-Sun: 4PM – 12AM' },
            { icon: '☀️', title: 'Brunch', description: 'Sat-Sun: 10AM – 3PM' },
          ],
          layout: 'horizontal',
        }),
        comp('faq', 'FAQ', {
          title: 'Reservation FAQ',
          items: [
            { question: 'Do you accept walk-ins?', answer: 'We do accept walk-ins based on availability, but reservations are strongly recommended, especially on weekends.' },
            { question: 'What is the dress code?', answer: 'Smart casual. No athletic wear or flip-flops, please.' },
            { question: 'Can you accommodate allergies?', answer: 'Absolutely. Please note any dietary requirements when booking and our chef will create a customized experience.' },
            { question: 'Is there a corkage fee?', answer: 'Yes, $35 per bottle with a limit of 2 bottles per table.' },
          ],
        }),
        foot(),
      ], false, 3),

      // ═══════════════════════════════════════════════════
      // GALLERY
      // ═══════════════════════════════════════════════════
      page('Gallery', 'gallery', [
        nav(),
        comp('hero', 'Gallery', {
          heading: 'Gallery', subheading: 'A taste of the La Maison experience.',
          alignment: 'center', height: 'small',
        }),
        comp('lightbox-gallery', 'Photos', {
          title: 'Our Restaurant', columns: 3,
          images: [
            { url: IMG.restaurantInterior, caption: 'Main Dining Room' },
            { url: IMG.food1, caption: 'Signature Dishes' },
            { url: IMG.food2, caption: 'Fresh Ingredients' },
            { url: IMG.food3, caption: 'Wood-Fired Favorites' },
            { url: IMG.food4, caption: 'Morning Selections' },
            { url: IMG.food5, caption: 'Handcrafted Desserts' },
            { url: IMG.food6, caption: 'Classic Preparations' },
          ],
        }),
        foot(),
      ], false, 4),

      // ═══════════════════════════════════════════════════
      // CONTACT
      // ═══════════════════════════════════════════════════
      page('Contact', 'contact', [
        nav(),
        comp('hero', 'Contact', {
          heading: 'Visit Us', subheading: 'We\'d love to welcome you.',
          alignment: 'center', height: 'small',
        }),
        comp('map', 'Map', {
          address: '789 Gourmet Ave, New York, NY',
          height: 450, variant: 'split', infoPosition: 'left', mapTheme: 'light',
          showContactCard: true, contactCardTitle: 'Visit La Maison', contactCardStyle: 'elevated',
          contactInfo: {
            address: '789 Gourmet Ave, New York, NY 10012',
            phone: '(555) 987-6543', email: 'hello@lamaison.com',
            hours: 'Tue-Sun: 5PM - 11PM\nBar: 4PM - 12AM\nBrunch (Sat-Sun): 10AM - 3PM',
          },
          showDirectionsButton: true, directionsButtonText: 'Get Directions',
        }),
        comp('social-links', 'Social', {
          title: 'Follow Us',
          links: [{ platform: 'instagram', url: '#' }, { platform: 'facebook', url: '#' }, { platform: 'twitter', url: '#' }, { platform: 'youtube', url: '#' }],
        }),
        foot(),
      ], false, 5),
    ];
  },
};

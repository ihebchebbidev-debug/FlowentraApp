import { SiteTemplate } from '../index';
import { IMG, AVATAR } from '../images';
import { comp, page, makeNavbar, makeFooter } from '../helpers';
import { TRAVEL_THEME } from '../themes';

export const travelAgencyTemplate: SiteTemplate = {
  id: 'travel-agency',
  name: 'Travel Agency',
  description: 'Editorial travel agency site with oversized hero typography, numbered chapter sections, pull-quote traveller stories and booking inquiry.',
  icon: '✈️',
  category: 'Travel',
  theme: TRAVEL_THEME,
  pageCount: 5,
  isNew: true,
  features: [
    'Editorial hero',
    'Numbered "why us" chapters',
    'Destination gallery',
    'Tour packages',
    'Pull-quote reviews',
    'Newsletter',
    'Booking form',
    'Trust badges',
    'WhatsApp',
    'Cookie consent',
  ],
  previewImage: IMG.travelHero,
  pages: () => {
    const nav = makeNavbar(
      '✈️ Wanderlust Travel',
      [
        { label: 'Home', href: '#' },
        { label: 'Destinations', href: '#destinations' },
        { label: 'Tours', href: '#tours' },
        { label: 'About', href: '#about' },
        { label: 'Contact', href: '#contact' },
      ],
      'Plan My Trip',
    );

    const foot = makeFooter(
      'Wanderlust Travel Co.',
      'Adventures that change your perspective',
      '(555) 874-2835',
      'hello@wanderlusttravel.com',
      {
        links: [
          { label: 'Home', href: '#' },
          { label: 'Destinations', href: '#destinations' },
          { label: 'Tours', href: '#tours' },
          { label: 'About', href: '#about' },
          { label: 'Contact', href: '#contact' },
        ],
        socialLinks: [
          { platform: 'instagram', url: '#' },
          { platform: 'youtube', url: '#' },
          { platform: 'facebook', url: '#' },
          { platform: 'tiktok', url: '#' },
        ],
      },
    );

    return [
      page(
        'Home',
        '',
        [
          nav(),

          comp('marquee', 'Promo', {
            text: '🌍 SUMMER SALE — 25% off all Southeast Asia tours • Use code WANDER25 • Limited availability 🌍',
            speed: 25,
          }),

          // Editorial hero — single signature statement, image on the right
          comp('hero', 'Hero', {
            variant: 'editorial',
            heading: 'Adventures<br/>That Stay With You.',
            subheading: 'Small-group tours across 40+ destinations. Local guides, curated stays, and itineraries built around the moments most travellers never see.',
            ctaText: 'Explore Destinations',
            ctaLink: '#destinations',
            secondaryCtaText: 'Plan My Trip',
            secondaryCtaLink: '#contact',
            height: 'large',
            splitImage: IMG.travelHero,
            splitPosition: 'right',
          }),

          comp('trust-badges', 'Trust', {
            title: 'Why Travel With Us',
            badges: [
              { icon: '⭐', label: '4.9★ TripAdvisor' },
              { icon: '🛡️', label: 'ASTA Certified' },
              { icon: '💰', label: 'Best Price Guarantee' },
              { icon: '🌍', label: '40+ Destinations' },
            ],
          }),

          comp('animated-stats', 'Stats', {
            stats: [
              { value: '40', label: 'Destinations', suffix: '+' },
              { value: '10', label: 'Happy Travelers', suffix: 'K+' },
              { value: '8', label: 'Years Experience', suffix: '+' },
              { value: '4.9', label: 'TripAdvisor', suffix: '★' },
            ],
            variant: 'gradient',
            columns: 4,
            animationStyle: 'count',
          }),

          comp('lightbox-gallery', 'Destinations', {
            title: 'Popular Destinations',
            columns: 3,
            images: [
              { url: IMG.travelBeach, caption: 'Bali — From $1,299' },
              { url: IMG.travelMountain, caption: 'Swiss Alps — From $2,499' },
              { url: IMG.travelCity, caption: 'Paris — From $1,899' },
              { url: IMG.travelTemple, caption: 'Bangkok — From $999' },
              { url: IMG.travelSafari, caption: 'Kenya Safari — From $3,299' },
              { url: IMG.travelIsland, caption: 'Maldives — From $2,899' },
            ],
          }),

          // Numbered chapters — replaces the old 4-up "Why us" grid
          comp('features', 'Why Us', {
            variant: 'numbered-chapters',
            title: 'The Wanderlust Difference',
            subtitle: 'Four principles that shape every itinerary we send out the door — and the reason 88% of our travellers book a second trip with us.',
            features: [
              { icon: 'Users', title: 'Small Groups, Bigger Moments', description: 'Maximum 12 travellers per departure. Real conversations with locals, faster transitions, and space for the unplanned.' },
              { icon: 'Map', title: 'Local Guides, Always', description: 'Every itinerary is led by a guide born and based in the region — not a sales rep flown in from abroad.' },
              { icon: 'Hotel', title: 'Hand-Picked Stays', description: 'Boutique hotels, family-run guesthouses and design-led retreats. No anonymous chains; no commission-driven swaps.' },
              { icon: 'Leaf', title: 'Travel That Gives Back', description: 'Carbon-offset on every booking and a partnership with community-based tourism cooperatives in every region we visit.' },
            ],
          }),

          comp('pricing', 'Tours', {
            title: 'Featured Tour Packages',
            plans: [
              { name: 'Explorer', price: '$999', features: ['7 nights', 'Guided tours', 'Airport transfers', 'Breakfast daily', 'Travel insurance'], highlighted: false },
              { name: 'Adventure', price: '$1,899', features: ['10 nights', 'Adventure activities', 'All meals included', 'Private guide', 'Travel insurance', 'Airport lounge'], highlighted: true },
              { name: 'Luxury', price: '$3,499', features: ['14 nights 5-star', 'Private tours', 'All meals + drinks', 'Spa treatments', 'Business class upgrade', 'Concierge service'], highlighted: false },
            ],
          }),

          // Editorial pull-quote testimonials
          comp('testimonials', 'Reviews', {
            variant: 'editorial-quote',
            title: 'Traveller Stories',
            bgColor: '#f0f9ff',
            testimonials: [
              { name: 'Amanda & Chris K.', role: 'Bali Adventure Tour', text: 'The most considered trip we\'ve ever taken. Every detail had been thought about — and the local guide changed how we see Bali forever.', rating: 5, avatar: AVATAR.w1 },
              { name: 'Robert J.', role: 'Kenya Safari', text: 'Saw the Big Five on day one. The camp was extraordinary and the guides knew things no guidebook will ever tell you.', rating: 5, avatar: AVATAR.m1 },
              { name: 'Sophie L.', role: 'Paris City Break', text: 'They showed us a Paris we didn\'t know existed. Tiny galleries, a back-street wine bar, a market the locals queue for. Unforgettable.', rating: 5, avatar: AVATAR.w3 },
            ],
          }),

          comp('cta-banner', 'CTA', {
            heading: 'Ready for Your Next Adventure?',
            subheading: 'Speak with a travel specialist today. Free trip planning consultation.',
            ctaText: 'Plan My Trip',
            ctaLink: '#contact',
          }),

          comp('newsletter', 'Newsletter', {
            title: 'Travel Inspiration',
            subtitle: 'Get exclusive deals, destination guides, and travel tips delivered weekly.',
            placeholder: 'Your email',
            buttonText: 'Subscribe',
            variant: 'split',
            showIcon: true,
            iconType: 'plane',
          }),

          comp('parallax', 'Parallax', {
            imageUrl: IMG.travelMountain,
            heading: 'Your Next Adventure Awaits',
            subheading: '40+ destinations across 6 continents',
            height: 'small',
            overlayOpacity: 45,
          }),

          comp('whatsapp-button', 'WhatsApp', {
            phoneNumber: '+15558742835',
            defaultMessage: 'Hi! I\'d like to plan a trip.',
            position: 'bottom-right',
            showGreeting: true,
            greetingText: 'Hi! ✈️ Where do you want to go?',
            agentName: 'Wanderlust Travel',
            pulseAnimation: true,
          }),

          comp('cookie-consent', 'Cookie', {
            text: 'We use cookies to personalize your travel recommendations.',
            buttonText: 'Accept',
            position: 'bottom',
          }),

          comp('scroll-to-top', 'Scroll', { position: 'bottom-right', offsetY: 90 }),
          foot(),
        ],
        true,
        0,
      ),

      page(
        'Destinations',
        'destinations',
        [
          nav(),
          comp('hero', 'Destinations Hero', {
            variant: 'editorial',
            heading: 'Our Destinations',
            subheading: 'Explore 40+ handpicked destinations across 6 continents — each one with a local guide who actually lives there.',
            height: 'medium',
            splitImage: IMG.travelMountain,
            splitPosition: 'left',
          }),
          comp('lightbox-gallery', 'All Destinations', {
            title: 'Destination Gallery',
            columns: 3,
            images: [
              { url: IMG.travelBeach, caption: 'Tropical Paradise' },
              { url: IMG.travelMountain, caption: 'Alpine Majesty' },
              { url: IMG.travelCity, caption: 'European Charm' },
              { url: IMG.travelTemple, caption: 'Ancient Temples' },
              { url: IMG.travelSafari, caption: 'African Wildlife' },
              { url: IMG.travelIsland, caption: 'Island Escape' },
            ],
          }),
          foot(),
        ],
        false,
        1,
      ),

      page(
        'Tours',
        'tours',
        [
          nav(),
          comp('hero', 'Tours Hero', { heading: 'Tour Packages', subheading: 'From budget-friendly to luxury — find your perfect trip.', alignment: 'center', height: 'small' }),
          comp('service-card', 'Tour Types', {
            title: 'Types of Tours',
            services: [
              { icon: '🏔️', title: 'Adventure Tours', description: 'Hiking, rafting, diving, and wildlife expeditions.', price: 'From $999' },
              { icon: '🍷', title: 'Cultural Tours', description: 'Food, wine, art, history, and local traditions.', price: 'From $1,299' },
              { icon: '💎', title: 'Luxury Escapes', description: '5-star resorts, private jets, exclusive experiences.', price: 'From $2,999' },
              { icon: '👨‍👩‍👧', title: 'Family Trips', description: 'Kid-friendly adventures for the whole family.', price: 'From $1,499' },
            ],
          }),
          comp('faq', 'FAQ', {
            title: 'Travel FAQ',
            items: [
              { question: 'What\'s included in the tour price?', answer: 'All tours include accommodations, guided activities, transfers, and travel insurance. Meals vary by package.' },
              { question: 'Can I customize a tour?', answer: 'Absolutely — contact us for a custom itinerary tailored to your interests and budget.' },
            ],
          }),
          foot(),
        ],
        false,
        2,
      ),

      page(
        'About',
        'about',
        [
          nav(),
          comp('hero', 'About Hero', { heading: 'Our Story', subheading: 'Founded by travellers, for travellers.', alignment: 'center', height: 'small' }),
          comp('image-text', 'Story', {
            title: 'Two Travellers, One Mission',
            description: 'After backpacking through 60+ countries, Sarah and Daniel founded Wanderlust in 2017 with one goal: create travel experiences that go beyond the tourist trail. Today, we\'ve helped 10,000+ travellers discover the world authentically.',
            imageUrl: IMG.travelCity,
            imagePosition: 'right',
          }),
          comp('team-grid', 'Team', {
            title: 'Our Travel Specialists',
            members: [
              { name: 'Sarah Mitchell', role: 'Co-Founder, Asia Specialist', bio: '60+ countries visited. Fluent in 4 languages.', avatar: AVATAR.w2 },
              { name: 'Daniel Brooks', role: 'Co-Founder, Africa Specialist', bio: 'Led 200+ safari expeditions across East Africa.', avatar: AVATAR.m1 },
            ],
          }),
          comp('timeline', 'Journey', {
            title: 'Our Journey',
            items: [
              { date: '2017', title: 'Founded', description: 'Started with 3 destinations and a passion for travel.' },
              { date: '2019', title: '1,000 Travelers', description: 'Reached our first 1,000 happy travellers milestone.' },
              { date: '2022', title: '30 Destinations', description: 'Expanded to 30 destinations across 5 continents.' },
              { date: '2025', title: 'Today', description: '40+ destinations, 10,000+ travellers, 4.9★ rating.' },
            ],
          }),
          foot(),
        ],
        false,
        3,
      ),

      page(
        'Contact',
        'contact',
        [
          nav(),
          comp('hero', 'Contact Hero', {
            heading: 'Start Planning Your Trip',
            subheading: 'Tell us your dream destination and we\'ll create the perfect itinerary.',
            alignment: 'center',
            height: 'small',
          }),
          comp('contact-form', 'Form', {
            title: 'Trip Inquiry',
            subtitle: 'A specialist responds within 24 hours.',
            fields: ['name', 'email', 'phone', 'message'],
            submitText: 'Send Inquiry',
            variant: 'card',
            showIcon: true,
          }),
          comp('icon-text', 'Info', {
            items: [
              { icon: '📞', title: 'Phone', description: '(555) 874-2835' },
              { icon: '📧', title: 'Email', description: 'hello@wanderlusttravel.com' },
              { icon: '📍', title: 'Office', description: 'San Francisco, CA' },
            ],
            layout: 'horizontal',
          }),
          foot(),
        ],
        false,
        4,
      ),
    ];
  },
};

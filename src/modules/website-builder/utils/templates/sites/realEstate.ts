import { SiteTemplate } from '../index';
import { IMG, AVATAR } from '../images';
import { comp, page, makeNavbar, makeFooter } from '../helpers';
import { REALESTATE_THEME } from '../themes';

export const realEstateTemplate: SiteTemplate = {
  id: 'real-estate',
  name: 'Real Estate Agency',
  description: 'Modern real estate website with property listings, agent profiles, and neighborhood guides.',
  icon: '🏠',
  category: 'Real Estate',
  theme: REALESTATE_THEME,
  pageCount: 4,
  features: [
    'Hero with image', 'Property gallery', 'Agent profiles', 'Animated stats',
    'Contact form', 'Map', 'Trust badges', 'Newsletter', 'WhatsApp',
    'Parallax section', 'FAQ',
  ],
  previewImage: IMG.realEstateHero,
  pages: () => {
    const nav = makeNavbar('🏠 Prime Realty', [
      { label: 'Home', href: '#' },
      { label: 'Listings', href: '#listings' },
      { label: 'Agents', href: '#agents' },
      { label: 'Contact', href: '#contact' },
    ], 'List Property');

    const foot = makeFooter('Prime Realty Group', 'Your dream home awaits', '(555) 456-7890', 'info@primerealty.com', {
      links: [
        { label: 'Home', href: '#' },
        { label: 'Listings', href: '#listings' },
        { label: 'Our Agents', href: '#agents' },
        { label: 'Contact', href: '#contact' },
      ],
      socialLinks: [
        { platform: 'facebook', url: '#' },
        { platform: 'instagram', url: '#' },
        { platform: 'linkedin', url: '#' },
        { platform: 'youtube', url: '#' },
      ],
    });

    return [
      // ═══════════════════════════════════════════════════
      // HOME
      // ═══════════════════════════════════════════════════
      page('Home', '', [
        nav(),
        comp('announcement-bar', 'Notice', {
          text: '🏡 New Listing Alert: Luxury waterfront estate just listed — Schedule a tour today!',
          linkText: 'View Listing →', linkUrl: '#listings', variant: 'primary',
        }),
        comp('hero', 'Hero', {
          heading: 'Find Your Dream Home',
          subheading: 'Browse thousands of listings with expert agents ready to guide you every step of the way. Your next chapter starts here.',
          ctaText: 'Browse Listings', ctaLink: '#listings',
          secondaryCtaText: 'Contact an Agent', secondaryCtaLink: '#contact',
          alignment: 'center', height: 'large',
          backgroundImage: IMG.realEstateHero, overlayOpacity: 45,
        }),
        comp('trust-badges', 'Trust', {
          title: 'Why Choose Prime Realty',
          badges: [
            { icon: '🏆', label: '#1 Agency in Miami' },
            { icon: '🔑', label: '2,500+ Homes Sold' },
            { icon: '⭐', label: '98% Satisfaction' },
            { icon: '🏡', label: '3D Virtual Tours' },
          ],
        }),
        comp('animated-stats', 'Stats', {
          stats: [
            { value: '2500', label: 'Properties Sold', suffix: '+' },
            { value: '1.2', label: 'Total Value', suffix: 'B', prefix: '$' },
            { value: '98', label: 'Client Satisfaction', suffix: '%' },
            { value: '15', label: 'Years Experience', suffix: '+' },
          ],
          variant: 'gradient', columns: 4, animationStyle: 'count',
        }),
        comp('lightbox-gallery', 'Properties', {
          title: 'Featured Properties', columns: 3,
          images: [
            { url: IMG.house1, caption: 'Modern Villa — $895,000' },
            { url: IMG.house2, caption: 'Luxury Estate — $1,450,000' },
            { url: IMG.house3, caption: 'Waterfront Home — $725,000' },
          ],
        }),
        comp('features', 'Services', {
          title: 'Why Prime Realty', bgColor: '#f0f4ff',
          features: [
            { icon: '🔍', title: 'Market Expertise', description: 'Deep local knowledge and real-time market analysis for informed decisions.' },
            { icon: '🤝', title: 'Personal Service', description: 'Dedicated agent throughout your entire buying or selling journey.' },
            { icon: '📊', title: 'Data-Driven Pricing', description: 'AI-powered pricing strategies backed by comprehensive market data.' },
            { icon: '🏡', title: '3D Virtual Tours', description: 'Immersive 3D walkthroughs for every listed property.' },
          ],
        }),
        comp('parallax', 'Parallax', {
          imageUrl: IMG.houseInterior,
          heading: 'Your Dream Home Awaits',
          subheading: 'Explore luxury listings across Miami and South Florida',
          height: 'small', overlayOpacity: 50,
        }),
        comp('image-text', 'About', {
          title: 'Miami\'s Most Trusted Agency',
          description: 'Prime Realty has been helping families find their perfect homes since 2009. Our agents combine local expertise with cutting-edge technology to deliver an unmatched real estate experience.',
          imageUrl: IMG.houseInterior, imagePosition: 'right',
        }),
        comp('testimonials', 'Reviews', {
          title: 'Client Stories', variant: 'carousel', bgColor: '#f8fafc',
          testimonials: [
            { name: 'The Johnson Family', role: 'Home Buyers', text: 'Prime Realty found us the perfect home in just 3 weeks! Our agent Rachel was incredible.', rating: 5, avatar: AVATAR.w3 },
            { name: 'Sandra M.', role: 'Home Seller', text: 'Sold our home 15% above asking price in just 5 days. Best decision we made.', rating: 5, avatar: AVATAR.w1 },
            { name: 'Robert K.', role: 'Investor', text: 'Their market analysis helped me build a portfolio of 8 rental properties. Outstanding team.', rating: 5, avatar: AVATAR.m2 },
          ],
        }),
        comp('faq', 'FAQ', {
          title: 'Buyer FAQ', variant: 'accordion',
          items: [
            { question: 'How do I start the home buying process?', answer: 'Schedule a free consultation with one of our agents. We\'ll discuss your budget, preferences, and start matching you with properties.' },
            { question: 'Do you handle rentals too?', answer: 'Yes! We have a dedicated rental division for both short-term and long-term leases.' },
            { question: 'What areas do you cover?', answer: 'We serve all of Miami-Dade, Broward, and Palm Beach counties with specialized local agents in each area.' },
          ],
        }),
        comp('cta-banner', 'CTA', {
          heading: 'Ready to Find Your Home?',
          subheading: 'Free consultation with our expert agents. No obligation.',
          ctaText: 'Contact an Agent', ctaLink: '#contact',
        }),
        comp('newsletter', 'Newsletter', {
          title: 'Market Updates',
          subtitle: 'Get weekly new listings, market insights, and investment tips.',
          placeholder: 'Your email', buttonText: 'Subscribe',
          variant: 'split', showIcon: true, iconType: 'bell',
        }),
        comp('whatsapp-button', 'WhatsApp', {
          phoneNumber: '+15554567890',
          defaultMessage: 'Hi! I\'m interested in a property listing.',
          position: 'bottom-right', showGreeting: true,
          greetingText: 'Hi! 🏡 Looking for a property?',
          agentName: 'Prime Realty', pulseAnimation: true,
        }),
        comp('scroll-to-top', 'Scroll', { position: 'bottom-right', offsetY: 90 }),
        foot(),
      ], true, 0),

      // ═══════════════════════════════════════════════════
      // LISTINGS
      // ═══════════════════════════════════════════════════
      page('Listings', 'listings', [
        nav(),
        comp('hero', 'Listings', {
          heading: 'Property Listings',
          subheading: 'Explore our current listings across Miami and South Florida.',
          alignment: 'center', height: 'small',
        }),
        comp('lightbox-gallery', 'All Properties', {
          title: 'Available Properties', columns: 3,
          images: [
            { url: IMG.house1, caption: 'Modern Villa — $895,000' },
            { url: IMG.house2, caption: 'Luxury Estate — $1,450,000' },
            { url: IMG.house3, caption: 'Waterfront Home — $725,000' },
            { url: IMG.houseInterior, caption: 'Downtown Loft — $525,000' },
          ],
        }),
        comp('cta-banner', 'CTA', {
          heading: 'Don\'t See What You\'re Looking For?',
          subheading: 'Our agents have access to off-market listings and pre-construction deals.',
          ctaText: 'Talk to an Agent', ctaLink: '#contact',
        }),
        foot(),
      ], false, 1),

      // ═══════════════════════════════════════════════════
      // AGENTS
      // ═══════════════════════════════════════════════════
      page('Our Agents', 'agents', [
        nav(),
        comp('hero', 'Agents', {
          heading: 'Our Agents',
          subheading: 'Expert realtors with deep local knowledge.',
          alignment: 'center', height: 'small',
        }),
        comp('team-grid', 'Agents', {
          title: 'Meet the Team',
          members: [
            { name: 'Rachel Kim', role: 'Senior Agent', bio: '$200M+ in career sales. Luxury specialist.', avatar: AVATAR.w3 },
            { name: 'David Martinez', role: 'Luxury Division', bio: 'Top 1% nationally. High-end properties.', avatar: AVATAR.m3 },
            { name: 'Sarah Thompson', role: 'First-Time Buyers', bio: 'Guiding new homeowners with patience and expertise.', avatar: AVATAR.w4 },
            { name: 'Marcus Rivera', role: 'Investment Properties', bio: 'Rental portfolio specialist. 100+ investor clients.', avatar: AVATAR.m4 },
          ],
        }),
        comp('logo-cloud', 'Awards', {
          title: 'Awards & Recognition',
          logos: ['Realtor.com Top Agent', 'Zillow Premier', 'NAR Certified', 'Forbes Real Estate Council'],
        }),
        foot(),
      ], false, 2),

      // ═══════════════════════════════════════════════════
      // CONTACT
      // ═══════════════════════════════════════════════════
      page('Contact', 'contact', [
        nav(),
        comp('hero', 'Contact', {
          heading: 'Contact Us',
          subheading: 'Let\'s find your perfect property.',
          alignment: 'center', height: 'small',
        }),
        comp('contact-form', 'Form', {
          title: 'Get In Touch',
          subtitle: 'An agent will respond within 24 hours.',
          fields: ['name', 'email', 'phone', 'message'],
          submitText: 'Send Inquiry', variant: 'card', showIcon: true,
        }),
        comp('icon-text', 'Info', {
          items: [
            { icon: '📞', title: 'Phone', description: '(555) 456-7890' },
            { icon: '📍', title: 'Office', description: '500 Realty Blvd, Miami, FL 33131' },
            { icon: '📧', title: 'Email', description: 'info@primerealty.com' },
            { icon: '⏰', title: 'Hours', description: 'Mon-Sat 9AM-7PM, Sun 10AM-4PM' },
          ],
          layout: 'horizontal',
        }),
        comp('map', 'Map', { address: '500 Realty Blvd, Miami, FL', height: 350 }),
        foot(),
      ], false, 3),
    ];
  },
};

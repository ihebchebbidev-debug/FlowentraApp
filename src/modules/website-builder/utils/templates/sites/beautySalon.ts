import { SiteTemplate } from '../index';
import { IMG, AVATAR } from '../images';
import { comp, page, makeNavbar, makeFooter } from '../helpers';
import { SALON_THEME } from '../themes';

export const beautySalonTemplate: SiteTemplate = {
  id: 'beauty-salon',
  name: 'Beauty Salon & Spa',
  description: 'Elegant salon website with service menu, pricing packages, photo gallery and client reviews.',
  icon: '💅',
  category: 'Beauty',
  theme: SALON_THEME,
  pageCount: 4,
  features: [
    'Hero with image', 'Service menu', 'Photo gallery', 'Pricing packages',
    'Social links', 'Trust badges', 'Newsletter', 'WhatsApp', 'Animated stats',
    'Parallax section', 'Tabs with variants',
  ],
  previewImage: IMG.salonHero,
  pages: () => {
    const nav = makeNavbar('💅 Blush & Bloom', [
      { label: 'Home', href: '#' },
      { label: 'Services', href: '#services' },
      { label: 'Gallery', href: '#gallery' },
      { label: 'Book', href: '#book' },
    ], 'Book Now');

    const foot = makeFooter('Blush & Bloom Salon', 'Where beauty meets relaxation', '(555) 444-5555', 'hello@blushandbloom.com', {
      links: [
        { label: 'Home', href: '#' },
        { label: 'Services & Pricing', href: '#services' },
        { label: 'Gallery', href: '#gallery' },
        { label: 'Book Now', href: '#book' },
      ],
      socialLinks: [
        { platform: 'instagram', url: '#' },
        { platform: 'pinterest', url: '#' },
        { platform: 'tiktok', url: '#' },
        { platform: 'facebook', url: '#' },
      ],
    });

    return [
      // ═══════════════════════════════════════════════════
      // HOME
      // ═══════════════════════════════════════════════════
      page('Home', '', [
        nav(),
        comp('announcement-bar', 'Promo', {
          text: '💝 Valentine\'s Special — Couples Spa Package 25% off!',
          linkText: 'Book Now →', linkUrl: '#book', variant: 'accent',
        }),
        comp('hero', 'Hero', {
          heading: 'Where Beauty Meets Relaxation',
          subheading: 'Premium hair, nails, skincare & spa services in a luxurious Beverly Hills setting. Your glow-up starts here.',
          ctaText: 'Book Appointment', ctaLink: '#book',
          secondaryCtaText: 'View Services', secondaryCtaLink: '#services',
          alignment: 'center', height: 'large',
          backgroundImage: IMG.salonHero, overlayOpacity: 45,
        }),
        comp('trust-badges', 'Trust', {
          title: 'Why Clients Love Us',
          badges: [
            { icon: '✨', label: 'Luxury Products' },
            { icon: '🏆', label: 'Award-Winning' },
            { icon: '🌿', label: 'Cruelty-Free' },
            { icon: '⭐', label: '5-Star Rated' },
          ],
        }),
        comp('animated-stats', 'Stats', {
          stats: [
            { value: '8000', label: 'Happy Clients', suffix: '+' },
            { value: '12', label: 'Years Experience', suffix: '+' },
            { value: '4.9', label: 'Google Rating', suffix: '★' },
            { value: '50', label: 'Expert Stylists', suffix: '+' },
          ],
          variant: 'cards', columns: 4, animationStyle: 'count',
        }),
        comp('service-card', 'Services', {
          title: 'Our Services', bgColor: '#fff0f3',
          services: [
            { icon: '💇', title: 'Hair Styling', description: 'Cuts, color, balayage, keratin treatments, and extensions.', price: 'From $45' },
            { icon: '💅', title: 'Nail Art', description: 'Classic manicure, gel, acrylics, nail art, and pedicure.', price: 'From $30' },
            { icon: '✨', title: 'Skincare', description: 'Hydrafacials, chemical peels, microdermabrasion, LED therapy.', price: 'From $65' },
            { icon: '💆', title: 'Spa & Massage', description: 'Swedish, deep tissue, hot stone, couples massage.', price: 'From $80' },
          ],
        }),
        comp('lightbox-gallery', 'Gallery', {
          title: 'Our Work', columns: 2,
          images: [
            { url: IMG.salon1, caption: 'Balayage Transformation' },
            { url: IMG.salon2, caption: 'Professional Updo' },
            { url: IMG.salon3, caption: 'Gel Nail Artistry' },
            { url: IMG.salon4, caption: 'Color & Cut' },
          ],
        }),
        comp('parallax', 'Parallax', {
          imageUrl: IMG.salon2,
          heading: 'Luxury You Deserve',
          subheading: 'Award-winning stylists, premium products, unforgettable experience',
          height: 'small', overlayOpacity: 50,
        }),
        comp('image-text', 'About', {
          title: 'Five-Star Luxury, Everyday Beauty',
          description: 'Blush & Bloom was founded by celebrity stylist Aria James with one vision: bring five-star luxury to everyday beauty. Our salon features private suites, premium products, and stylists trained at the world\'s best academies.',
          imageUrl: IMG.salon1, imagePosition: 'right',
        }),
        comp('testimonials', 'Reviews', {
          title: 'Client Love', variant: 'carousel', bgColor: '#fff5f7',
          testimonials: [
            { name: 'Jessica M.', role: 'Regular Client', text: 'The best salon experience I\'ve ever had. The attention to detail is incredible and the results always exceed my expectations.', rating: 5, avatar: AVATAR.w1 },
            { name: 'Amanda L.', role: 'Bride', text: 'My entire bridal party looked absolutely stunning. Aria and her team made our wedding day even more special.', rating: 5, avatar: AVATAR.w3 },
            { name: 'Sophie K.', role: 'Monthly Facial Client', text: 'My skin has never looked better since starting regular facials here. The estheticians are truly experts.', rating: 5, avatar: AVATAR.w4 },
          ],
        }),
        comp('cta-banner', 'CTA', {
          heading: 'Your Glow-Up Awaits',
          subheading: 'New clients get 20% off their first visit. Walk-ins welcome!',
          ctaText: 'Book Appointment', ctaLink: '#book',
        }),
        comp('newsletter', 'Newsletter', {
          title: 'Beauty Tips & Offers',
          subtitle: 'Get exclusive deals, seasonal beauty tips, and early access to new services.',
          placeholder: 'Your email', buttonText: 'Subscribe',
          variant: 'split', showIcon: true, iconType: 'sparkles',
        }),
        comp('whatsapp-button', 'WhatsApp', {
          phoneNumber: '+15554445555',
          defaultMessage: 'Hi! I\'d like to book an appointment.',
          position: 'bottom-right', showGreeting: true,
          greetingText: 'Hi! 💅 Want to book an appointment?',
          agentName: 'Blush & Bloom', pulseAnimation: true,
        }),
        comp('scroll-to-top', 'Scroll', { position: 'bottom-right', offsetY: 90 }),
        foot(),
      ], true, 0),

      // ═══════════════════════════════════════════════════
      // SERVICES & PRICING
      // ═══════════════════════════════════════════════════
      page('Services & Pricing', 'services', [
        nav(),
        comp('hero', 'Services', {
          heading: 'Services & Pricing',
          subheading: 'Full menu of beauty and wellness services.',
          alignment: 'center', height: 'small',
        }),
        comp('tabs', 'Service Tabs', {
          variant: 'pills',
          tabs: [
            { label: 'Hair', content: '<p><strong>Women\'s Cut & Style</strong> — $45-$85<br/><strong>Men\'s Cut</strong> — $35-$55<br/><strong>Color (Full)</strong> — $95-$200<br/><strong>Balayage</strong> — $175-$350<br/><strong>Keratin Treatment</strong> — $250-$400<br/><strong>Extensions</strong> — From $500</p>' },
            { label: 'Nails', content: '<p><strong>Classic Manicure</strong> — $30<br/><strong>Gel Manicure</strong> — $45<br/><strong>Acrylic Full Set</strong> — $65<br/><strong>Nail Art</strong> — $15+<br/><strong>Classic Pedicure</strong> — $45<br/><strong>Luxury Pedicure</strong> — $75</p>' },
            { label: 'Skin & Spa', content: '<p><strong>Express Facial</strong> — $65<br/><strong>Signature Facial</strong> — $120<br/><strong>Chemical Peel</strong> — $150<br/><strong>Swedish Massage (60 min)</strong> — $95<br/><strong>Deep Tissue (60 min)</strong> — $120<br/><strong>Couples Massage</strong> — $220</p>' },
          ],
        }),
        comp('pricing', 'Packages', {
          title: 'Spa Packages', bgColor: '#fff5f7',
          plans: [
            { name: 'Essential', price: '$79', features: ['Haircut & Blowout', 'Express Facial', 'Classic Manicure'], highlighted: false },
            { name: 'Luxe', price: '$149', features: ['Cut & Color', 'Signature Facial', 'Gel Manicure', 'Eyebrow Shaping'], highlighted: true },
            { name: 'VIP', price: '$249', features: ['Everything in Luxe', '60-min Massage', 'Luxury Pedicure', 'Lash Extensions'], highlighted: false },
          ],
        }),
        foot(),
      ], false, 1),

      // ═══════════════════════════════════════════════════
      // GALLERY
      // ═══════════════════════════════════════════════════
      page('Gallery', 'gallery', [
        nav(),
        comp('hero', 'Gallery', {
          heading: 'Our Work',
          subheading: 'Before & after transformations and artistry.',
          alignment: 'center', height: 'small',
        }),
        comp('lightbox-gallery', 'Gallery', {
          title: 'Transformations', columns: 3,
          images: [
            { url: IMG.salon1, caption: 'Balayage Highlight' },
            { url: IMG.salon2, caption: 'Professional Updo' },
            { url: IMG.salon3, caption: 'Gel Nail Art' },
            { url: IMG.salon4, caption: 'Color Correction' },
          ],
        }),
        comp('social-links', 'Social', {
          title: 'Follow Our Work',
          subtitle: 'Daily transformations and behind-the-scenes content.',
          links: [
            { platform: 'instagram', url: '#', label: '@blushandbloom' },
            { platform: 'tiktok', url: '#', label: 'TikTok' },
            { platform: 'pinterest', url: '#', label: 'Inspiration' },
          ],
          variant: 'cards', bgColor: '#fff5f7',
        }),
        foot(),
      ], false, 2),

      // ═══════════════════════════════════════════════════
      // BOOK
      // ═══════════════════════════════════════════════════
      page('Book Now', 'book', [
        nav(),
        comp('hero', 'Book', {
          heading: 'Book Your Appointment',
          subheading: 'Choose your service and preferred time. Walk-ins also welcome!',
          alignment: 'center', height: 'small',
        }),
        comp('contact-form', 'Form', {
          title: 'Appointment Request',
          subtitle: 'We\'ll confirm your booking within 1 hour.',
          fields: ['name', 'email', 'phone', 'message'],
          submitText: 'Book Now', variant: 'card', showIcon: true,
        }),
        comp('icon-text', 'Info', {
          items: [
            { icon: '📍', title: 'Location', description: '321 Beauty Lane, Beverly Hills, CA 90210' },
            { icon: '📞', title: 'Phone', description: '(555) 444-5555' },
            { icon: '⏰', title: 'Hours', description: 'Tue-Sat 9AM-7PM, Sun 10AM-4PM' },
            { icon: '🅿️', title: 'Parking', description: 'Free parking available behind salon' },
          ],
          layout: 'horizontal',
        }),
        comp('map', 'Map', { address: '321 Beauty Lane, Beverly Hills, CA', height: 350 }),
        foot(),
      ], false, 3),
    ];
  },
};

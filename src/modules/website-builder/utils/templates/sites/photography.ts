import { SiteTemplate } from '../index';
import { IMG, AVATAR } from '../images';
import { comp, page, makeNavbar, makeFooter } from '../helpers';
import { PHOTOGRAPHY_THEME } from '../themes';

export const photographyTemplate: SiteTemplate = {
  id: 'photography',
  name: 'Photography Studio',
  description: 'Minimal dark portfolio for photographers with stunning gallery, packages, and booking.',
  icon: '📷',
  category: 'Creative',
  theme: PHOTOGRAPHY_THEME,
  pageCount: 4,
  features: [
    'Hero with image', 'Photo gallery', 'Session packages', 'Social links',
    'Booking form', 'Newsletter', 'Testimonials', 'Animated stats',
    'Parallax section', 'Tabs with variants', 'FAQ',
  ],
  previewImage: IMG.photoHero,
  pages: () => {
    const nav = makeNavbar('📷 Lens & Light', [
      { label: 'Home', href: '#' },
      { label: 'Portfolio', href: '#portfolio' },
      { label: 'Packages', href: '#packages' },
      { label: 'Book', href: '#book' },
    ], 'Book Session');

    const foot = makeFooter('Lens & Light Studio', 'Capturing moments that last forever', '(555) 666-7777', 'hello@lensandlight.com', {
      links: [
        { label: 'Home', href: '#' },
        { label: 'Portfolio', href: '#portfolio' },
        { label: 'Packages', href: '#packages' },
        { label: 'Book', href: '#book' },
      ],
      socialLinks: [
        { platform: 'instagram', url: '#' },
        { platform: 'pinterest', url: '#' },
        { platform: 'youtube', url: '#' },
        { platform: 'tiktok', url: '#' },
      ],
    });

    return [
      // ═══════════════════════════════════════════════════
      // HOME
      // ═══════════════════════════════════════════════════
      page('Home', '', [
        nav(),
        comp('hero', 'Hero', {
          heading: 'Capturing Moments That Last Forever',
          subheading: 'Wedding, portrait, and commercial photography. Based in Los Angeles, available worldwide.',
          ctaText: 'View Portfolio', ctaLink: '#portfolio',
          secondaryCtaText: 'Book a Session', secondaryCtaLink: '#book',
          alignment: 'center', height: 'large',
          backgroundImage: IMG.photoHero, overlayOpacity: 50,
        }),
        comp('animated-stats', 'Stats', {
          stats: [
            { value: '500', label: 'Sessions Shot', suffix: '+' },
            { value: '200', label: 'Weddings', suffix: '+' },
            { value: '15', label: 'Awards' },
            { value: '10', label: 'Years', suffix: '+' },
          ],
          variant: 'bar', columns: 4, animationStyle: 'count',
        }),
        comp('lightbox-gallery', 'Portfolio', {
          title: 'Selected Work', columns: 3,
          images: [
            { url: IMG.photo1, caption: 'Mountain Sunrise — Landscape' },
            { url: IMG.photo2, caption: 'Golden Valley — Nature' },
            { url: IMG.photo3, caption: 'Lakeside Reflection — Travel' },
            { url: IMG.photo4, caption: 'Forest Mist — Fine Art' },
            { url: IMG.photo5, caption: 'Ancient Woods — Editorial' },
            { url: IMG.photo6, caption: 'Countryside — Documentary' },
          ],
        }),
        comp('features', 'Services', {
          title: 'Photography Services', bgColor: '#0a0a0a',
          features: [
            { icon: '💒', title: 'Weddings', description: 'Full-day coverage, engagement sessions, luxury albums, and same-day edits.' },
            { icon: '👤', title: 'Portraits', description: 'Family, headshots, lifestyle, maternity, and editorial sessions.' },
            { icon: '🏢', title: 'Commercial', description: 'Product, food, architecture, branding, and corporate events.' },
            { icon: '🎬', title: 'Cinematography', description: 'Wedding films, brand videos, and cinematic highlight reels.' },
          ],
        }),
        comp('parallax', 'Parallax', {
          imageUrl: IMG.photo3,
          heading: 'Every Picture Tells a Story',
          subheading: 'Let me tell yours',
          height: 'small', overlayOpacity: 60,
        }),
        comp('image-text', 'About', {
          title: 'Behind the Lens',
          description: 'I\'m Alex Rivera, a photographer obsessed with light, emotion, and authentic storytelling. After 10 years and 500+ sessions, I still get chills when I capture a perfect moment. My approach is unposed, cinematic, and deeply personal.',
          imageUrl: IMG.photo1, imagePosition: 'left',
        }),
        comp('testimonials', 'Reviews', {
          title: 'Client Love', variant: 'carousel', bgColor: '#0a0a0a',
          testimonials: [
            { name: 'Amanda & Tom', role: 'Wedding Clients', text: 'Our wedding photos are absolutely stunning. Alex captured moments we didn\'t even know happened. They\'re our most treasured possessions.', rating: 5, avatar: AVATAR.w1 },
            { name: 'Sarah K.', role: 'Portrait Client', text: 'Incredible eye for detail and made us feel so comfortable. The photos exceeded every expectation.', rating: 5, avatar: AVATAR.w2 },
            { name: 'Michael R.', role: 'Brand Shoot', text: 'Alex\'s commercial work elevated our entire brand. The product shots are gallery-worthy.', rating: 5, avatar: AVATAR.m1 },
          ],
        }),
        comp('pricing', 'Quick Pricing', {
          title: 'Packages',
          plans: [
            { name: 'Essential', price: '$499', features: ['2-hour session', '50 edited photos', 'Online gallery', 'Print release'], highlighted: false },
            { name: 'Premium', price: '$999', features: ['4-hour session', '150 edited photos', 'Album design', 'Second shooter', 'Engagement session'], highlighted: true },
            { name: 'Luxury', price: '$2,499', features: ['Full-day coverage', 'Unlimited photos', 'Premium album', 'Canvas prints', 'Video highlights'], highlighted: false },
          ],
        }),
        comp('cta-banner', 'CTA', {
          heading: 'Let\'s Create Something Beautiful',
          subheading: 'Limited availability — book your session today.',
          ctaText: 'Book Now', ctaLink: '#book',
        }),
        comp('newsletter', 'Newsletter', {
          title: 'Behind the Scenes',
          subtitle: 'Get exclusive previews, photography tips, and session availability updates.',
          placeholder: 'Your email', buttonText: 'Subscribe',
          variant: 'minimal',
        }),
        comp('social-links', 'Social', {
          title: 'Follow My Work',
          links: [
            { platform: 'instagram', url: '#', label: '@lensandlight' },
            { platform: 'pinterest', url: '#', label: 'Inspiration' },
            { platform: 'youtube', url: '#', label: 'Films' },
            { platform: 'tiktok', url: '#', label: 'BTS' },
          ],
          variant: 'cards', bgColor: '#0a0a0a',
        }),
        comp('scroll-to-top', 'Scroll', { position: 'bottom-right' }),
        foot(),
      ], true, 0),

      // ═══════════════════════════════════════════════════
      // PORTFOLIO
      // ═══════════════════════════════════════════════════
      page('Portfolio', 'portfolio', [
        nav(),
        comp('hero', 'Portfolio', {
          heading: 'Portfolio',
          subheading: 'A collection of my finest work across weddings, portraits, and commercial.',
          alignment: 'center', height: 'small',
        }),
        comp('tabs', 'Portfolio Tabs', {
          variant: 'underline',
          tabs: [
            { label: 'Weddings', content: '<p>Full-day wedding coverage capturing every emotional moment — from getting ready to the last dance.</p>' },
            { label: 'Portraits', content: '<p>Natural light portraits that reveal personality and authenticity. Families, couples, and individuals.</p>' },
            { label: 'Commercial', content: '<p>Polished product photography and brand campaigns that elevate your visual identity.</p>' },
          ],
        }),
        comp('lightbox-gallery', 'Gallery', {
          title: 'All Work', columns: 3,
          images: [
            { url: IMG.photo1, caption: 'Mountain Sunrise' },
            { url: IMG.photo2, caption: 'Golden Valley' },
            { url: IMG.photo3, caption: 'Lakeside Reflection' },
            { url: IMG.photo4, caption: 'Forest Mist' },
            { url: IMG.photo5, caption: 'Ancient Woods' },
            { url: IMG.photo6, caption: 'Countryside Panorama' },
          ],
        }),
        foot(),
      ], false, 1),

      // ═══════════════════════════════════════════════════
      // PACKAGES
      // ═══════════════════════════════════════════════════
      page('Packages', 'packages', [
        nav(),
        comp('hero', 'Packages', {
          heading: 'Packages & Pricing',
          subheading: 'Choose the perfect package for your needs. Custom packages also available.',
          alignment: 'center', height: 'small',
        }),
        comp('pricing', 'Pricing', {
          title: 'Session Packages',
          plans: [
            { name: 'Essential', price: '$499', features: ['2-hour session', '50 edited photos', 'Online gallery', 'Print release', 'Same-week delivery'], highlighted: false },
            { name: 'Premium', price: '$999', features: ['4-hour session', '150 edited photos', 'Custom album design', 'Second shooter', 'Engagement session', 'Priority delivery'], highlighted: true },
            { name: 'Luxury', price: '$2,499', features: ['Full-day coverage', 'Unlimited photos', 'Premium leather album', 'Canvas wall art', 'Cinematic highlight video', 'Engagement session'], highlighted: false },
          ],
        }),
        comp('faq', 'FAQ', {
          title: 'Common Questions', variant: 'accordion',
          items: [
            { question: 'How far in advance should I book?', answer: 'For weddings, 6-12 months is recommended. Portrait sessions can often be booked 2-4 weeks out.' },
            { question: 'Do you travel?', answer: 'Yes! I\'m based in LA but available worldwide. Travel fees apply for destinations outside Southern California.' },
            { question: 'When will I receive my photos?', answer: 'Portrait sessions: 1-2 weeks. Weddings: 4-6 weeks. Sneak peeks within 48 hours.' },
          ],
        }),
        foot(),
      ], false, 2),

      // ═══════════════════════════════════════════════════
      // BOOK
      // ═══════════════════════════════════════════════════
      page('Book', 'book', [
        nav(),
        comp('hero', 'Book', {
          heading: 'Book a Session',
          subheading: 'Let\'s create something beautiful together. Tell me about your vision.',
          alignment: 'center', height: 'small',
        }),
        comp('contact-form', 'Form', {
          title: 'Booking Inquiry',
          subtitle: 'I respond to all inquiries within 24 hours.',
          fields: ['name', 'email', 'phone', 'message'],
          submitText: 'Send Inquiry', variant: 'card', showIcon: true,
        }),
        comp('icon-text', 'Info', {
          items: [
            { icon: '📧', title: 'Email', description: 'hello@lensandlight.com' },
            { icon: '📞', title: 'Phone', description: '(555) 666-7777' },
            { icon: '📍', title: 'Studio', description: 'Arts District, Los Angeles, CA' },
          ],
          layout: 'horizontal',
        }),
        foot(),
      ], false, 3),
    ];
  },
};

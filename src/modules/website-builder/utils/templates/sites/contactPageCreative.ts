import { SiteTemplate } from '../index';
import { IMG } from '../images';
import { comp, page, makeNavbar, makeFooter } from '../helpers';

const CREATIVE_THEME = {
  primaryColor: '#8b5cf6',
  secondaryColor: '#6b7280',
  accentColor: '#f472b6',
  backgroundColor: '#fafafa',
  textColor: '#1f2937',
  headingFont: 'Space Grotesk, sans-serif',
  bodyFont: 'Inter, sans-serif',
  borderRadius: 16,
  spacing: 20,
  shadowStyle: 'dramatic' as const,
  direction: 'ltr' as const,
  fontScale: 1,
  buttonStyle: 'rounded' as const,
};

const nav = makeNavbar('✨ CreativeStudio', [
  { label: 'Work', href: '#work' },
  { label: 'About', href: '#about' },
  { label: 'Services', href: '#services' },
  { label: 'Contact', href: '#contact' },
], 'Start a Project');

const foot = makeFooter('CreativeStudio', 'Crafting digital experiences that inspire.', '(555) 987-6543', 'hello@creativestudio.co', {
  socialLinks: [
    { platform: 'instagram', url: '#' },
    { platform: 'dribbble', url: '#' },
    { platform: 'behance', url: '#' },
    { platform: 'linkedin', url: '#' },
  ],
});

export const contactPageCreativeTemplate: SiteTemplate = {
  id: 'contact-page-creative',
  name: 'Contact Page - Creative',
  description: 'Bold and creative contact page with artistic map styling, animated elements, and modern layout.',
  icon: '✨',
  category: 'Contact Pages',
  theme: CREATIVE_THEME,
  pageCount: 1,
  features: [
    'Artistic map theme',
    'Animated contact form',
    'Bold typography',
    'Social media links',
    'Testimonial section',
  ],
  previewImage: IMG.agencyHero,
  pages: () => [
    page('Contact', '', [
      nav(),
      
      // Bold hero
      comp('hero', 'Contact Hero', {
        heading: 'Let\'s Create\nSomething Amazing',
        subheading: 'Whether you have a project in mind or just want to chat — we\'re here for it.',
        ctaText: 'Send a Message',
        ctaLink: '#form',
        alignment: 'center',
        height: 'medium',
        backgroundImage: IMG.portfolioHero,
        overlayOpacity: 70,
      }),
      
      // Stats
      comp('animated-stats', 'Stats', {
        stats: [
          { value: '150', label: 'Projects Delivered', suffix: '+' },
          { value: '50', label: 'Happy Clients', suffix: '+' },
          { value: '8', label: 'Years Experience', suffix: '' },
          { value: '24', label: 'Hour Response', suffix: 'h' },
        ],
        variant: 'gradient',
        columns: 4,
      }),
      
      // Contact form with creative styling
      comp('contact-form', 'Get in Touch', {
        title: 'Start a Conversation',
        subtitle: 'Tell us about your vision and let\'s bring it to life together.',
        fields: ['name', 'email', 'project type', 'budget', 'message'],
        submitText: 'Let\'s Talk →',
        variant: 'default',
        showIcon: false,
        bgColor: '#f3e8ff',
      }),
      
      // Artistic map with watercolor theme
      comp('map', 'Find Us', {
        address: '123 Design District, San Francisco, CA 94102',
        latitude: 37.7749,
        longitude: -122.4194,
        zoom: 14,
        height: 500,
        mapTheme: 'watercolor',
        variant: 'overlay',
        showContactCard: true,
        contactCardTitle: 'Visit Our Studio',
        contactInfo: {
          address: '123 Design District\nSan Francisco, CA 94102',
          phone: '+1 (555) 987-6543',
          email: 'hello@creativestudio.co',
          hours: 'Mon - Fri: 10:00 AM - 7:00 PM\nWeekends: By Appointment',
        },
        markerColor: '#8b5cf6',
        showZoomControl: true,
        draggable: true,
      }),
      
      // Social proof
      comp('testimonials', 'Client Love', {
        title: 'What Clients Say',
        testimonials: [
          { name: 'Sarah Chen', role: 'CEO, TechStart', text: 'CreativeStudio transformed our brand completely. Their attention to detail and creative vision exceeded all expectations.', rating: 5 },
          { name: 'Marcus Johnson', role: 'Founder, GrowthLabs', text: 'Working with them was a dream. They understood our vision from day one and delivered something truly special.', rating: 5 },
          { name: 'Elena Rodriguez', role: 'Marketing Director', text: 'The team\'s creativity and professionalism are unmatched. They\'re now our go-to for all design projects.', rating: 5 },
        ],
        bgColor: '#faf5ff',
      }),
      
      // Social links section
      comp('social-links', 'Connect With Us', {
        title: 'Follow Our Journey',
        subtitle: 'Stay updated with our latest work and behind-the-scenes content.',
        links: [
          { platform: 'instagram', url: '#', label: '@creativestudio' },
          { platform: 'dribbble', url: '#', label: 'Our Shots' },
          { platform: 'behance', url: '#', label: 'Portfolio' },
          { platform: 'linkedin', url: '#', label: 'Connect' },
        ],
        variant: 'cards',
        bgColor: '#f8fafc',
      }),
      
      // WhatsApp button for quick contact
      comp('whatsapp-button', 'WhatsApp', {
        phoneNumber: '+15559876543',
        defaultMessage: 'Hi! I\'d like to discuss a creative project.',
        position: 'bottom-right',
        buttonColor: '#8b5cf6',
        pulseAnimation: true,
        showGreeting: true,
        greetingText: 'Have a quick question? Chat with us! 💬',
      }),
      
      foot(),
    ], true, 0),
  ],
};

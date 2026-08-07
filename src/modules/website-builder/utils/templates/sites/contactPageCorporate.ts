import { SiteTemplate } from '../index';
import { IMG } from '../images';
import { comp, page, makeNavbar, makeFooter } from '../helpers';

const CORPORATE_THEME = {
  primaryColor: '#1e40af',
  secondaryColor: '#64748b',
  accentColor: '#3b82f6',
  backgroundColor: '#ffffff',
  textColor: '#1e293b',
  headingFont: 'Inter, sans-serif',
  bodyFont: 'Inter, sans-serif',
  borderRadius: 8,
  spacing: 16,
  shadowStyle: 'subtle' as const,
  direction: 'ltr' as const,
  fontScale: 1,
  buttonStyle: 'rounded' as const,
};

const nav = makeNavbar('🏢 CorporateHub', [
  { label: 'Home', href: '#' },
  { label: 'About', href: '#about' },
  { label: 'Services', href: '#services' },
  { label: 'Contact', href: '#contact' },
], 'Get in Touch');

const foot = makeFooter('CorporateHub Inc.', 'Professional solutions for modern businesses.', '(555) 123-4567', 'info@corporatehub.com', {
  links: [
    { label: 'Home', href: '#' },
    { label: 'Services', href: '#services' },
    { label: 'Contact', href: '#contact' },
    { label: 'Privacy Policy', href: '#' },
  ],
});

export const contactPageCorporateTemplate: SiteTemplate = {
  id: 'contact-page-corporate',
  name: 'Contact Page - Corporate',
  description: 'Professional contact page with map, contact form, office locations, and business hours.',
  icon: '🏢',
  category: 'Contact Pages',
  theme: CORPORATE_THEME,
  pageCount: 1,
  features: [
    'Interactive Leaflet map',
    'Contact form',
    'Office locations',
    'Business hours',
    'Social links',
    'FAQ section',
  ],
  previewImage: IMG.consultHero,
  pages: () => [
    page('Contact', '', [
      nav(),
      // Hero section
      comp('hero', 'Contact Hero', {
        heading: 'Get in Touch',
        subheading: 'We\'d love to hear from you. Reach out to us for inquiries, partnerships, or support.',
        alignment: 'center',
        height: 'small',
        bgColor: '#f1f5f9',
      }),
      
      // Split layout: Form + Info
      comp('columns', 'Contact Section', {
        columns: 2,
        gap: 32,
        children: [],
      }),
      
      // Contact Form
      comp('contact-form', 'Contact Form', {
        title: 'Send Us a Message',
        subtitle: 'Fill out the form below and we\'ll get back to you within 24 hours.',
        fields: ['name', 'email', 'phone', 'company', 'message'],
        submitText: 'Send Message',
        variant: 'card',
        showIcon: true,
      }),
      
      // Leaflet Map with contact info
      comp('map', 'Office Location', {
        address: '350 Fifth Avenue, New York, NY 10118',
        latitude: 40.7484,
        longitude: -73.9857,
        zoom: 15,
        height: 450,
        mapTheme: 'light',
        variant: 'split',
        infoPosition: 'right',
        showContactCard: true,
        contactCardTitle: 'Our Office',
        contactInfo: {
          address: '350 Fifth Avenue, Suite 5000\nNew York, NY 10118',
          phone: '+1 (555) 123-4567',
          email: 'info@corporatehub.com',
          hours: 'Mon - Fri: 9:00 AM - 6:00 PM\nSat: 10:00 AM - 2:00 PM\nSun: Closed',
        },
        showZoomControl: true,
        draggable: true,
        scrollWheelZoom: false,
        showBorder: true,
      }),
      
      // Multiple office locations
      comp('features', 'Office Locations', {
        title: 'Our Offices Worldwide',
        subtitle: 'Visit us at any of our global locations.',
        features: [
          { icon: 'MapPin', title: 'New York HQ', description: '350 Fifth Avenue, Suite 5000\nNew York, NY 10118\n+1 (555) 123-4567' },
          { icon: 'MapPin', title: 'London Office', description: '100 Liverpool Street\nLondon EC2M 2RH, UK\n+44 20 1234 5678' },
          { icon: 'MapPin', title: 'Singapore Office', description: '1 Raffles Place, #20-61\nSingapore 048616\n+65 6123 4567' },
          { icon: 'MapPin', title: 'Sydney Office', description: '200 George Street\nSydney NSW 2000, Australia\n+61 2 1234 5678' },
        ],
        columns: 4,
        bgColor: '#f8fafc',
      }),
      
      // FAQ
      comp('faq', 'Contact FAQ', {
        title: 'Frequently Asked Questions',
        items: [
          { question: 'What are your business hours?', answer: 'Our offices are open Monday through Friday, 9 AM to 6 PM local time. We also have limited Saturday hours from 10 AM to 2 PM.' },
          { question: 'How quickly do you respond to inquiries?', answer: 'We aim to respond to all inquiries within 24 business hours. For urgent matters, please call our direct line.' },
          { question: 'Do you offer virtual consultations?', answer: 'Yes! We offer video consultations via Zoom, Google Meet, or Microsoft Teams. Simply mention your preference in the contact form.' },
          { question: 'Where can I find parking?', answer: 'Visitor parking is available in the building garage. Please check in at the front desk for a parking validation.' },
        ],
      }),
      
      // CTA
      comp('cta-banner', 'Final CTA', {
        heading: 'Ready to Start Your Project?',
        subheading: 'Let\'s discuss how we can help transform your business.',
        ctaText: 'Schedule a Call',
        ctaLink: '#contact',
        secondaryCtaText: 'View Our Services',
        secondaryCtaLink: '#services',
      }),
      
      foot(),
    ], true, 0),
  ],
};

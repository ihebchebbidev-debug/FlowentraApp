import { SiteTemplate } from '../index';
import { IMG, AVATAR } from '../images';
import { comp, page, makeNavbar, makeFooter } from '../helpers';
import { MEDICAL_THEME } from '../themes';

export const medicalClinicTemplate: SiteTemplate = {
  id: 'medical-clinic',
  name: 'Medical Clinic',
  description: 'Professional healthcare website with doctor profiles, services, appointments and patient resources.',
  icon: '🏥',
  category: 'Healthcare',
  theme: MEDICAL_THEME,
  pageCount: 5,
  features: [
    'Hero with image', 'Doctor profiles with photos', 'Services list',
    'Appointment form', 'Comparison table', 'FAQ', 'Animated stats',
    'Parallax section', 'Trust badges', 'Newsletter',
  ],
  previewImage: IMG.medicalHero,
  pages: () => {
    const nav = makeNavbar('🏥 CareFirst Clinic', [
      { label: 'Home', href: '#' },
      { label: 'Services', href: '#services' },
      { label: 'Doctors', href: '#doctors' },
      { label: 'Appointments', href: '#appointments' },
      { label: 'Contact', href: '#contact' },
    ], 'Book Appointment');

    const foot = makeFooter('CareFirst Medical', 'Compassionate care, modern medicine', '(555) 345-6789', 'info@carefirst.com', {
      links: [
        { label: 'Home', href: '#' },
        { label: 'Services', href: '#services' },
        { label: 'Our Doctors', href: '#doctors' },
        { label: 'Appointments', href: '#appointments' },
        { label: 'Contact', href: '#contact' },
      ],
      socialLinks: [
        { platform: 'facebook', url: '#' },
        { platform: 'instagram', url: '#' },
        { platform: 'linkedin', url: '#' },
        { platform: 'google', url: '#' },
      ],
    });

    return [
      // ═══════════════════════════════════════════════════
      // HOME
      // ═══════════════════════════════════════════════════
      page('Home', '', [
        nav(),
        comp('announcement-bar', 'Notice', {
          text: '📋 Now accepting new patients — Same-day appointments available!',
          linkText: 'Book Now', linkUrl: '#appointments', variant: 'primary',
        }),
        comp('hero', 'Hero', {
          heading: 'Your Health, Our Priority',
          subheading: 'Board-certified physicians providing comprehensive healthcare for you and your family. Modern facility, compassionate care.',
          ctaText: 'Book Appointment', ctaLink: '#appointments',
          alignment: 'center', height: 'large',
          backgroundImage: IMG.medicalHero, overlayOpacity: 50,
        }),
        comp('trust-badges', 'Trust', {
          title: 'Why Choose CareFirst',
          badges: [
            { icon: '👨‍⚕️', label: 'Board Certified' },
            { icon: '🏆', label: 'Top Rated' },
            { icon: '⏰', label: 'Same-Day Visits' },
            { icon: '💊', label: 'On-Site Pharmacy' },
          ],
        }),
        comp('animated-stats', 'Stats', {
          stats: [
            { value: '25000', label: 'Patients Served', suffix: '+' },
            { value: '15', label: 'Years Experience', suffix: '+' },
            { value: '4.9', label: 'Patient Rating', suffix: '★' },
            { value: '20', label: 'Physicians', suffix: '+' },
          ],
          variant: 'cards', columns: 4, animationStyle: 'count', bgColor: '#f0fdfa',
        }),
        comp('service-card', 'Services', {
          title: 'Our Services',
          services: [
            { icon: '🩺', title: 'Primary Care', description: 'Annual exams, preventive care, chronic disease management.', price: '' },
            { icon: '👶', title: 'Pediatrics', description: 'Well-child visits, vaccinations, developmental screenings.', price: '' },
            { icon: '❤️', title: 'Cardiology', description: 'Heart health screenings, EKG, stress tests.', price: '' },
            { icon: '🧠', title: 'Mental Health', description: 'Therapy, counseling, medication management.', price: '' },
            { icon: '🦴', title: 'Orthopedics', description: 'Joint, bone, and muscle care.', price: '' },
            { icon: '🧪', title: 'Lab Services', description: 'On-site blood work and diagnostics.', price: '' },
          ],
        }),
        comp('image-text', 'Facility', {
          title: 'State-of-the-Art Facility',
          description: 'Our modern clinic features the latest medical technology, comfortable patient rooms, and a welcoming environment designed to put you at ease.',
          imageUrl: IMG.medicalClinic, imagePosition: 'left',
        }),
        comp('parallax', 'Parallax', {
          imageUrl: IMG.medicalHero,
          heading: 'Compassionate Care, Modern Medicine',
          subheading: 'Serving our community with excellence since 2009',
          height: 'small', overlayOpacity: 55,
        }),
        comp('testimonials', 'Reviews', {
          title: 'Patient Reviews', variant: 'carousel', bgColor: '#f0fdfa',
          testimonials: [
            { name: 'Patricia M.', role: 'Patient', text: 'Dr. Chen is the best doctor I\'ve ever had. Caring, thorough, and always takes the time to listen.', rating: 5 },
            { name: 'Robert K.', role: 'Patient', text: 'The entire staff is wonderful. Wait times are minimal and the care is excellent.', rating: 5 },
            { name: 'Linda S.', role: 'Patient', text: 'So grateful for the telehealth option. Dr. Park was just as attentive on video as in person.', rating: 5 },
          ],
        }),
        comp('faq', 'FAQ', {
          title: 'Patient FAQ', variant: 'accordion',
          items: [
            { question: 'Do you accept my insurance?', answer: 'We accept most major insurance plans. Contact us to verify your coverage.' },
            { question: 'Can I book same-day appointments?', answer: 'Yes! We offer same-day and next-day appointments for urgent needs.' },
            { question: 'Do you offer telehealth?', answer: 'Yes, virtual visits are available for many conditions.' },
            { question: 'What age groups do you serve?', answer: 'We serve patients of all ages — from newborns to seniors.' },
          ],
        }),
        comp('cta-banner', 'CTA', {
          heading: 'Your Health Journey Starts Here',
          subheading: 'Schedule your appointment today — new patients welcome.',
          ctaText: 'Book Appointment', ctaLink: '#appointments',
        }),
        comp('newsletter', 'Newsletter', {
          title: 'Health Tips & News',
          subtitle: 'Get wellness advice, seasonal health tips, and practice updates.',
          placeholder: 'Your email', buttonText: 'Subscribe',
          variant: 'split', showIcon: true, iconType: 'heart',
        }),
        comp('scroll-to-top', 'Scroll', { position: 'bottom-right' }),
        foot(),
      ], true, 0),

      // ═══════════════════════════════════════════════════
      // SERVICES
      // ═══════════════════════════════════════════════════
      page('Services', 'services', [
        nav(),
        comp('hero', 'Services', {
          heading: 'Medical Services',
          subheading: 'Comprehensive healthcare under one roof.',
          alignment: 'center', height: 'medium',
        }),
        comp('tabs', 'Service Tabs', {
          variant: 'pills',
          tabs: [
            { label: 'Primary Care', content: '<p><strong>Annual Wellness Exams</strong><br/>Comprehensive health evaluations.</p><p><strong>Chronic Disease Management</strong><br/>Ongoing care for diabetes, hypertension.</p>' },
            { label: 'Pediatrics', content: '<p><strong>Well-Child Visits</strong><br/>Regular checkups from birth through adolescence.</p><p><strong>Vaccinations</strong><br/>Complete immunization schedules.</p>' },
            { label: 'Specialists', content: '<p><strong>Cardiology</strong><br/>Heart health monitoring.</p><p><strong>Orthopedics</strong><br/>Joint replacement, sports medicine.</p>' },
          ],
        }),
        foot(),
      ], false, 1),

      // ═══════════════════════════════════════════════════
      // DOCTORS
      // ═══════════════════════════════════════════════════
      page('Our Doctors', 'doctors', [
        nav(),
        comp('hero', 'Doctors', {
          heading: 'Our Physicians',
          subheading: 'Meet the experts caring for you.',
          alignment: 'center', height: 'small',
        }),
        comp('team-grid', 'Team', {
          title: 'Medical Team',
          members: [
            { name: 'Dr. Sarah Chen', role: 'Internal Medicine', bio: 'Board certified, 15+ years. Harvard Medical School.', avatar: AVATAR.w1 },
            { name: 'Dr. James Park', role: 'Pediatrics', bio: 'Specializing in child development and wellness.', avatar: AVATAR.m1 },
            { name: 'Dr. Maria Santos', role: 'Cardiology', bio: 'Heart health expert with 20 years experience.', avatar: AVATAR.w2 },
            { name: 'Dr. David Kim', role: 'Orthopedics', bio: 'Sports medicine and joint replacement specialist.', avatar: AVATAR.m2 },
          ],
        }),
        foot(),
      ], false, 2),

      // ═══════════════════════════════════════════════════
      // APPOINTMENTS
      // ═══════════════════════════════════════════════════
      page('Appointments', 'appointments', [
        nav(),
        comp('hero', 'Appointments', {
          heading: 'Book an Appointment',
          subheading: 'Schedule your visit online.',
          alignment: 'center', height: 'small',
        }),
        comp('contact-form', 'Form', {
          title: 'Request Appointment',
          subtitle: 'Our team will confirm within 2 hours.',
          fields: ['name', 'email', 'phone', 'message'],
          submitText: 'Request Appointment', variant: 'card', showIcon: true,
        }),
        foot(),
      ], false, 3),

      // ═══════════════════════════════════════════════════
      // CONTACT
      // ═══════════════════════════════════════════════════
      page('Contact', 'contact', [
        nav(),
        comp('hero', 'Contact', {
          heading: 'Contact Us',
          subheading: 'We\'re here to help.',
          alignment: 'center', height: 'small',
        }),
        comp('icon-text', 'Info', {
          items: [
            { icon: '📞', title: 'Phone', description: '(555) 345-6789' },
            { icon: '📍', title: 'Address', description: '100 Health Way, Chicago, IL 60601' },
            { icon: '📧', title: 'Email', description: 'info@carefirst.com' },
            { icon: '⏰', title: 'Hours', description: 'Mon-Fri 8AM-6PM, Sat 9AM-1PM' },
          ],
          layout: 'horizontal',
        }),
        comp('map', 'Map', { address: '100 Health Way, Chicago, IL', height: 350 }),
        foot(),
      ], false, 4),
    ];
  },
};

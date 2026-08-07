import { SiteTemplate } from '../index';
import { IMG, AVATAR } from '../images';
import { comp, page, makeNavbar, makeFooter } from '../helpers';
import { DENTAL_THEME } from '../themes';

export const dentalOfficeTemplate: SiteTemplate = {
  id: 'dental-office',
  name: 'Dental Office',
  description: 'Professional dental practice website with services, dentist profiles, patient resources, insurance info, before/after gallery, blog, and online booking.',
  icon: '🦷',
  category: 'Healthcare',
  theme: DENTAL_THEME,
  pageCount: 6,
  features: ['Hero with smile image', 'Dental services', 'Service tabs', 'Dentist profiles', 'Before/After gallery', 'Patient resources', 'Insurance info', 'Blog', 'Online booking', 'FAQ', 'Trust badges', 'Newsletter'],
  previewImage: IMG.dentalHero,
  pages: () => {
    const nav = makeNavbar('🦷 BrightSmile Dental', [
      { label: 'Home', href: '#' },
      { label: 'Services', href: '#services' },
      { label: 'Our Dentists', href: '#team' },
      { label: 'Patient Info', href: '#info' },
      { label: 'Blog', href: '#blog' },
      { label: 'Contact', href: '#contact' },
    ], 'Book Appointment');
    const foot = makeFooter('BrightSmile Dental', 'Creating confident smiles since 2010', '(555) 832-6453', 'office@brightsmile.dental', {
      links: [{ label: 'Home', href: '#' }, { label: 'Services', href: '#services' }, { label: 'Our Dentists', href: '#team' }, { label: 'Patient Info', href: '#info' }, { label: 'Contact', href: '#contact' }],
      socialLinks: [{ platform: 'facebook', url: '#' }, { platform: 'instagram', url: '#' }, { platform: 'google', url: '#' }],
    });
    return [
      // ═══════════════════════════════════════════════════
      // HOME
      // ═══════════════════════════════════════════════════
      page('Home', '', [
        nav(),
        comp('announcement-bar', 'Promo', {
          text: '✨ New patients: Free exam & X-rays with any cleaning!',
          linkText: 'Schedule Now →', linkUrl: '#contact', variant: 'primary',
        }),
        comp('hero', 'Hero', {
          heading: 'Your Smile,\nOur Passion',
          subheading: 'Gentle, modern dentistry for the whole family. State-of-the-art technology in a comfortable, spa-like environment.',
          ctaText: 'Book Your Visit', ctaLink: '#contact',
          secondaryCtaText: 'Our Services', secondaryCtaLink: '#services',
          alignment: 'center', height: 'large',
          backgroundImage: IMG.dentalHero, overlayOpacity: 40,
        }),
        comp('trust-badges', 'Trust', {
          title: 'Why Patients Love Us',
          badges: [
            { icon: '😊', label: 'Gentle Approach' },
            { icon: '🏆', label: 'Top Dentist 2025' },
            { icon: '💳', label: 'All Insurance Accepted' },
            { icon: '🕐', label: 'Same-Day Appointments' },
          ],
        }),
        comp('animated-stats', 'Stats', {
          stats: [
            { value: '20', label: 'Smiles Created', suffix: 'K+' },
            { value: '14', label: 'Years Experience', suffix: '+' },
            { value: '4.9', label: 'Patient Rating', suffix: '★' },
            { value: '98', label: 'Would Recommend', suffix: '%' },
          ],
          variant: 'gradient', columns: 4, animationStyle: 'count',
        }),
        comp('service-card', 'Services', {
          title: 'Our Dental Services', bgColor: '#f0f9ff',
          services: [
            { icon: '🪥', title: 'Cleanings & Prevention', description: 'Professional cleanings, fluoride, sealants, and oral cancer screenings.', price: 'From $95' },
            { icon: '🦷', title: 'Fillings & Restorations', description: 'Tooth-colored fillings, inlays, onlays, and bonding.', price: 'From $150' },
            { icon: '👑', title: 'Crowns & Bridges', description: 'Custom porcelain and zirconia restorations.', price: 'From $850' },
            { icon: '✨', title: 'Cosmetic Dentistry', description: 'Veneers, whitening, smile design, and gum contouring.', price: 'From $250' },
          ],
        }),
        comp('image-text', 'Comfort', {
          title: 'Dentistry Doesn\'t Have to Be Stressful',
          description: 'Our office features massage chairs, Netflix on ceiling-mounted screens, noise-canceling headphones, weighted blankets, and multiple sedation options. We\'ve reimagined what a dental visit can feel like.',
          imageUrl: IMG.dentalChair, imagePosition: 'right',
        }),
        comp('testimonials', 'Reviews', {
          title: 'Patient Reviews', variant: 'carousel',
          testimonials: [
            { name: 'Rebecca S.', role: 'Patient since 2018', text: 'Dr. Nguyen completely changed my fear of the dentist. Now I actually look forward to my visits!', rating: 5, avatar: AVATAR.w1 },
            { name: 'Michael D.', role: 'Invisalign Patient', text: 'My smile has never looked better. The entire team made the process so easy.', rating: 5, avatar: AVATAR.m1 },
            { name: 'Sarah T.', role: 'Family of 4', text: 'They see our whole family — the kids love it here. That says everything.', rating: 5, avatar: AVATAR.w2 },
            { name: 'James K.', role: 'Implant Patient', text: 'Got my confidence back thanks to Dr. Torres. Life-changing procedure.', rating: 5, avatar: AVATAR.m2 },
          ],
        }),
        comp('logo-cloud', 'Insurance', {
          title: 'Insurance Partners', logos: ['Delta Dental', 'Cigna', 'Aetna', 'MetLife', 'Guardian', 'United Healthcare'],
        }),
        comp('faq', 'FAQ', {
          title: 'Frequently Asked Questions', variant: 'accordion',
          items: [
            { question: 'Do you accept my insurance?', answer: 'We accept most PPO dental plans including Delta Dental, Cigna, Aetna, MetLife, and more. Contact us to verify your specific plan.' },
            { question: 'Do you offer sedation?', answer: 'Yes! We offer nitrous oxide (laughing gas), oral sedation, and IV sedation for patients with dental anxiety.' },
            { question: 'How often should I visit the dentist?', answer: 'We recommend a checkup and cleaning every 6 months. Patients with gum disease may need more frequent visits.' },
            { question: 'Do you see children?', answer: 'Absolutely! Dr. Shah specializes in pediatric dentistry and loves making kids feel comfortable.' },
          ],
        }),
        comp('cta-banner', 'CTA', {
          heading: 'Your Best Smile Awaits',
          subheading: 'New patients get a free exam and X-rays with any cleaning.',
          ctaText: 'Book Appointment', ctaLink: '#contact',
        }),
        comp('newsletter', 'Newsletter', {
          title: 'Dental Health Tips', subtitle: 'Monthly tips for a healthier smile.',
          placeholder: 'Your email', buttonText: 'Subscribe',
          variant: 'split', showIcon: true, iconType: 'sparkles',
        }),
        comp('scroll-to-top', 'Scroll', { position: 'bottom-right' }),
        foot(),
      ], true, 0),

      // ═══════════════════════════════════════════════════
      // SERVICES
      // ═══════════════════════════════════════════════════
      page('Services', 'services', [
        nav(),
        comp('hero', 'Services Hero', {
          heading: 'Dental Services', subheading: 'Comprehensive care for every smile.',
          alignment: 'center', height: 'medium', backgroundImage: IMG.dentalSmile, overlayOpacity: 50,
        }),
        comp('tabs', 'Service Categories', {
          tabs: [
            { label: 'General', content: '<p><strong>Exam & Cleaning</strong> — $95-$175<br/>Complete oral exam, professional cleaning, and fluoride treatment.</p><p><strong>Fillings</strong> — $150-$300<br/>Tooth-colored composite fillings that blend naturally.</p><p><strong>Root Canals</strong> — $700-$1,100<br/>Pain-free endodontic therapy with modern techniques.</p>' },
            { label: 'Cosmetic', content: '<p><strong>Teeth Whitening</strong> — $250-$500<br/>In-office Zoom whitening or custom take-home trays.</p><p><strong>Porcelain Veneers</strong> — $900-$1,500/tooth<br/>Custom-crafted for a natural, stunning smile.</p><p><strong>Smile Makeover</strong> — Custom<br/>Comprehensive cosmetic treatment plan.</p>' },
            { label: 'Restorative', content: '<p><strong>Dental Crowns</strong> — $850-$1,200<br/>Same-day CEREC crowns available.</p><p><strong>Dental Implants</strong> — $2,500-$4,500<br/>Permanent tooth replacement with titanium implants.</p><p><strong>Dentures</strong> — $1,200-$3,000<br/>Custom full and partial dentures.</p>' },
            { label: 'Orthodontics', content: '<p><strong>Invisalign</strong> — $3,500-$6,000<br/>Clear aligners for discreet teeth straightening.</p><p><strong>Clear Braces</strong> — $4,000-$7,000<br/>Ceramic brackets that blend with your teeth.</p><p><strong>Retainers</strong> — $200-$500<br/>Custom retainers to maintain your results.</p>' },
          ],
        }),
        comp('pricing', 'Plans', {
          title: 'Membership Plans (No Insurance Needed)',
          plans: [
            { name: 'Individual', price: '$25/mo', features: ['2 cleanings/year', '1 exam & X-rays', '15% off treatments', 'No waiting period'], highlighted: false },
            { name: 'Family', price: '$65/mo', features: ['Coverage for up to 4', '2 cleanings each/year', '20% off treatments', 'Emergency priority'], highlighted: true },
            { name: 'Premium', price: '$45/mo', features: ['Everything in Individual', '1 free whitening/year', '25% off treatments', 'Same-day scheduling'], highlighted: false },
          ],
        }),
        foot(),
      ], false, 1),

      // ═══════════════════════════════════════════════════
      // TEAM
      // ═══════════════════════════════════════════════════
      page('Our Dentists', 'team', [
        nav(),
        comp('hero', 'Team Hero', {
          heading: 'Meet Our Dentists', subheading: 'Experienced, compassionate, and dedicated to your smile.',
          alignment: 'center', height: 'small',
        }),
        comp('team-grid', 'Team', {
          title: 'Our Dental Team',
          members: [
            { name: 'Dr. Lisa Nguyen', role: 'General & Cosmetic Dentistry', bio: 'DDS NYU, 14 years experience. Passionate about creating beautiful smiles.', avatar: AVATAR.w2 },
            { name: 'Dr. Ryan Torres', role: 'Orthodontics & Implants', bio: 'Invisalign Diamond Provider. Board-certified implant specialist.', avatar: AVATAR.m4 },
            { name: 'Dr. Priya Shah', role: 'Pediatric Dentistry', bio: 'Making kids love the dentist since 2015.', avatar: AVATAR.w4 },
            { name: 'Dr. Kevin Wu', role: 'Endodontics', bio: 'Root canal specialist. Pain-free procedures guaranteed.', avatar: AVATAR.m3 },
          ],
        }),
        comp('image-text', 'Technology', {
          title: 'State-of-the-Art Technology',
          description: 'We invest in the latest dental technology including digital X-rays (90% less radiation), intraoral cameras, CEREC same-day crowns, and 3D treatment planning for implants.',
          imageUrl: IMG.dentalChair, imagePosition: 'left',
        }),
        foot(),
      ], false, 2),

      // ═══════════════════════════════════════════════════
      // PATIENT INFO
      // ═══════════════════════════════════════════════════
      page('Patient Info', 'info', [
        nav(),
        comp('hero', 'Info Hero', {
          heading: 'Patient Information', subheading: 'Everything you need for a smooth visit.',
          alignment: 'center', height: 'small',
        }),
        comp('features', 'Resources', {
          title: 'Patient Resources', columns: 3,
          features: [
            { icon: '📋', title: 'New Patient Forms', description: 'Complete your paperwork online before your visit to save time.' },
            { icon: '💳', title: 'Insurance & Financing', description: 'We accept most PPO plans. CareCredit and in-house financing available.' },
            { icon: '📞', title: 'Emergency Care', description: 'Same-day emergency appointments available. Call us anytime.' },
            { icon: '🅿️', title: 'Convenient Parking', description: 'Free parking in our dedicated lot adjacent to the building.' },
            { icon: '♿', title: 'Accessibility', description: 'Fully ADA-compliant office with wheelchair access throughout.' },
            { icon: '😴', title: 'Sedation Options', description: 'Nitrous oxide, oral sedation, and IV sedation available.' },
          ],
        }),
        comp('timeline', 'First Visit', {
          title: 'Your First Visit',
          items: [
            { date: 'Step 1', title: 'Book Online or Call', description: 'Choose a time that works for you. Same-day often available.' },
            { date: 'Step 2', title: 'Complete Forms', description: 'Fill out new patient forms online before your visit.' },
            { date: 'Step 3', title: 'Meet Your Dentist', description: 'Comprehensive exam, X-rays, and personalized treatment plan.' },
            { date: 'Step 4', title: 'Start Your Journey', description: 'Begin treatment with confidence. We\'ll handle insurance for you.' },
          ],
        }),
        foot(),
      ], false, 3),

      // ═══════════════════════════════════════════════════
      // BLOG
      // ═══════════════════════════════════════════════════
      page('Blog', 'blog', [
        nav(),
        comp('hero', 'Blog Hero', {
          heading: 'Dental Health Blog', subheading: 'Expert advice for a healthier smile.',
          alignment: 'center', height: 'small',
        }),
        comp('blog-grid', 'Posts', {
          title: 'Latest Articles', columns: 3,
          posts: [
            { title: 'Is Teeth Whitening Right for You?', excerpt: 'A guide to professional whitening options and what to expect.', category: 'Cosmetic', date: 'Feb 2026', author: 'Dr. Nguyen' },
            { title: 'How to Choose the Right Toothbrush', excerpt: 'Electric vs manual, soft vs medium — a dentist\'s honest guide.', category: 'Prevention', date: 'Jan 2026', author: 'Dr. Shah' },
            { title: 'The Truth About Dental Implants', excerpt: 'Separating facts from myths about tooth replacement.', category: 'Restorative', date: 'Jan 2026', author: 'Dr. Torres' },
            { title: 'Kids and Cavities: Prevention Tips', excerpt: 'How to protect your child\'s teeth from an early age.', category: 'Pediatric', date: 'Dec 2025', author: 'Dr. Shah' },
            { title: 'Why Your Gums Bleed (And When to Worry)', excerpt: 'Understanding gum disease and when to seek treatment.', category: 'Periodontal', date: 'Nov 2025', author: 'Dr. Nguyen' },
            { title: 'Invisalign vs Braces in 2026', excerpt: 'Comparing costs, timelines, and results for teeth straightening.', category: 'Orthodontics', date: 'Oct 2025', author: 'Dr. Torres' },
          ],
        }),
        foot(),
      ], false, 4),

      // ═══════════════════════════════════════════════════
      // CONTACT
      // ═══════════════════════════════════════════════════
      page('Contact', 'contact', [
        nav(),
        comp('hero', 'Contact Hero', {
          heading: 'Schedule Your Appointment', subheading: 'Online booking available 24/7.',
          alignment: 'center', height: 'small',
        }),
        comp('contact-form', 'Form', {
          title: 'Book Appointment', fields: ['name', 'email', 'phone', 'message'],
          submitText: 'Request Appointment', variant: 'card',
        }),
        comp('icon-text', 'Info', {
          items: [
            { icon: '📍', title: 'Address', description: '450 Smile Drive, Suite 200, Denver, CO 80202' },
            { icon: '📞', title: 'Phone', description: '(555) 832-6453' },
            { icon: '⏰', title: 'Hours', description: 'Mon-Thu 8AM-5PM · Fri 8AM-2PM · Sat by appointment' },
          ],
          layout: 'horizontal',
        }),
        comp('map', 'Map', { address: '450 Smile Drive, Denver, CO', height: 350 }),
        foot(),
      ], false, 5),
    ];
  },
};

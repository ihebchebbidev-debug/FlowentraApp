import { SiteTemplate } from '../index';
import { IMG, AVATAR } from '../images';
import { comp, page, makeNavbar, makeFooter } from '../helpers';
import { LAW_THEME } from '../themes';

export const lawFirmTemplate: SiteTemplate = {
  id: 'law-firm',
  name: 'Law Firm',
  description: 'Professional law firm website with practice areas, attorney profiles, case results and consultations.',
  icon: '⚖️',
  category: 'Professional',
  theme: LAW_THEME,
  pageCount: 4,
  features: [
    'Hero with image', 'Practice areas', 'Attorney profiles', 'Case results',
    'FAQ', 'Free consultation', 'Trust badges', 'Timeline', 'Newsletter',
    'Animated stats', 'Parallax section',
  ],
  previewImage: IMG.lawHero,
  pages: () => {
    const nav = makeNavbar('⚖️ Sterling & Associates', [
      { label: 'Home', href: '#' },
      { label: 'Practice Areas', href: '#practice' },
      { label: 'Attorneys', href: '#attorneys' },
      { label: 'Contact', href: '#contact' },
    ], 'Free Consultation');

    const foot = makeFooter('Sterling & Associates', 'Justice served with integrity', '(555) 111-2222', 'info@sterlinglaw.com', {
      links: [
        { label: 'Home', href: '#' },
        { label: 'Practice Areas', href: '#practice' },
        { label: 'Attorneys', href: '#attorneys' },
        { label: 'Contact', href: '#contact' },
      ],
      socialLinks: [
        { platform: 'linkedin', url: '#' },
        { platform: 'facebook', url: '#' },
        { platform: 'twitter', url: '#' },
      ],
    });

    return [
      // ═══════════════════════════════════════════════════
      // HOME
      // ═══════════════════════════════════════════════════
      page('Home', '', [
        nav(),
        comp('hero', 'Hero', {
          heading: 'Justice Served with Integrity',
          subheading: 'Over 30 years of legal excellence protecting the rights of individuals and businesses. No fee unless we win.',
          ctaText: 'Free Consultation', ctaLink: '#contact',
          secondaryCtaText: 'Our Practice Areas', secondaryCtaLink: '#practice',
          alignment: 'center', height: 'large',
          backgroundImage: IMG.lawHero, overlayOpacity: 60,
        }),
        comp('trust-badges', 'Trust', {
          title: 'Why Choose Sterling',
          badges: [
            { icon: '🏆', label: 'Super Lawyers 2025' },
            { icon: '⭐', label: 'AV Martindale-Hubbell' },
            { icon: '💪', label: '$500M+ Recovered' },
            { icon: '🤝', label: 'No Fee Unless We Win' },
          ],
        }),
        comp('animated-stats', 'Stats', {
          stats: [
            { value: '30', label: 'Years Experience', suffix: '+' },
            { value: '500', label: 'Recovered', suffix: 'M+', prefix: '$' },
            { value: '5000', label: 'Cases Won', suffix: '+' },
            { value: '99', label: 'Success Rate', suffix: '%' },
          ],
          variant: 'gradient', columns: 4, animationStyle: 'count',
        }),
        comp('service-card', 'Practice', {
          title: 'Practice Areas', bgColor: '#f8fafc',
          services: [
            { icon: '⚖️', title: 'Personal Injury', description: 'Auto accidents, slip & fall, medical malpractice, wrongful death.', price: '' },
            { icon: '👨‍👩‍👧', title: 'Family Law', description: 'Divorce, custody, child support, adoption, prenuptials.', price: '' },
            { icon: '🏢', title: 'Business Law', description: 'Contracts, disputes, formations, mergers, IP protection.', price: '' },
            { icon: '🏠', title: 'Real Estate Law', description: 'Transactions, disputes, landlord-tenant, zoning.', price: '' },
            { icon: '📜', title: 'Estate Planning', description: 'Wills, trusts, probate, power of attorney.', price: '' },
            { icon: '🔨', title: 'Criminal Defense', description: 'DUI, felonies, misdemeanors, expungements.', price: '' },
          ],
        }),
        comp('image-text', 'About', {
          title: 'Fighting for You Since 1994',
          description: 'Founded by Robert Sterling, a former District Attorney, Sterling & Associates has grown into one of New York\'s most respected law firms. We combine aggressive litigation with compassionate client service to deliver results that matter.',
          imageUrl: IMG.lawHero, imagePosition: 'right',
        }),
        comp('parallax', 'Parallax', {
          imageUrl: IMG.lawHero,
          heading: 'Your Rights. Our Fight.',
          subheading: 'Over $500 million recovered for our clients',
          height: 'small', overlayOpacity: 65,
        }),
        comp('testimonials', 'Reviews', {
          title: 'Client Testimonials', variant: 'carousel', bgColor: '#f8fafc',
          testimonials: [
            { name: 'James R.', role: 'Personal Injury Client', text: 'They fought tirelessly for my case and secured a settlement beyond my expectations. I couldn\'t have asked for better representation.', rating: 5, avatar: AVATAR.m1 },
            { name: 'Maria G.', role: 'Family Law Client', text: 'Compassionate and professional throughout a very difficult time. They truly cared about my family\'s well-being.', rating: 5, avatar: AVATAR.w2 },
            { name: 'David K.', role: 'Business Client', text: 'Saved our company from a devastating lawsuit. Their business law expertise is unmatched.', rating: 5, avatar: AVATAR.m3 },
          ],
        }),
        comp('faq', 'FAQ', {
          title: 'Common Questions', variant: 'accordion',
          items: [
            { question: 'What does a free consultation include?', answer: 'A comprehensive 30-minute meeting with a senior attorney to review your case, discuss options, and outline a strategy — no obligation.' },
            { question: 'Do you work on contingency?', answer: 'Yes, for personal injury cases. You pay nothing unless we win your case. We advance all costs.' },
            { question: 'How long does a typical case take?', answer: 'It depends on the complexity. Personal injury cases average 6-18 months. Family law matters vary from weeks to months.' },
            { question: 'Do you handle cases outside New York?', answer: 'We are licensed in New York, New Jersey, and Connecticut. We can also refer you to trusted partners nationwide.' },
          ],
        }),
        comp('cta-banner', 'CTA', {
          heading: 'Don\'t Face Legal Challenges Alone',
          subheading: 'Contact us today for a free, no-obligation consultation. We fight for your rights.',
          ctaText: 'Schedule Consultation', ctaLink: '#contact',
        }),
        comp('newsletter', 'Newsletter', {
          title: 'Legal Insights',
          subtitle: 'Get quarterly updates on legal news, rights, and helpful resources.',
          placeholder: 'Your email', buttonText: 'Subscribe',
          variant: 'split', showIcon: true, iconType: 'book',
        }),
        comp('scroll-to-top', 'Scroll', { position: 'bottom-right' }),
        foot(),
      ], true, 0),

      // ═══════════════════════════════════════════════════
      // PRACTICE AREAS
      // ═══════════════════════════════════════════════════
      page('Practice Areas', 'practice', [
        nav(),
        comp('hero', 'Practice', {
          heading: 'Our Practice Areas',
          subheading: 'Comprehensive legal services for individuals and businesses.',
          alignment: 'center', height: 'medium',
        }),
        comp('service-card', 'Areas', {
          title: 'Areas of Expertise',
          services: [
            { icon: '⚖️', title: 'Personal Injury', description: 'Maximum compensation for accident victims. No fee unless we win.', price: '' },
            { icon: '👨‍👩‍👧', title: 'Family Law', description: 'Protecting families during life\'s most challenging transitions.', price: '' },
            { icon: '🏢', title: 'Corporate Law', description: 'Business formation, contracts, and dispute resolution.', price: '' },
            { icon: '📜', title: 'Estate Planning', description: 'Wills, trusts, and probate administration.', price: '' },
            { icon: '🏠', title: 'Real Estate', description: 'Commercial and residential transactions and disputes.', price: '' },
            { icon: '🔨', title: 'Criminal Defense', description: 'Aggressive defense for all criminal charges.', price: '' },
          ],
        }),
        comp('features', 'Approach', {
          title: 'Our Legal Approach', bgColor: '#f8fafc',
          features: [
            { icon: '🔍', title: 'Thorough Investigation', description: 'We leave no stone unturned in building your case.' },
            { icon: '📊', title: 'Data-Driven Strategy', description: 'Case analytics and precedent research inform every decision.' },
            { icon: '💪', title: 'Aggressive Advocacy', description: 'We fight hard in negotiations and in the courtroom.' },
          ],
        }),
        foot(),
      ], false, 1),

      // ═══════════════════════════════════════════════════
      // ATTORNEYS
      // ═══════════════════════════════════════════════════
      page('Attorneys', 'attorneys', [
        nav(),
        comp('hero', 'Attorneys', {
          heading: 'Our Attorneys',
          subheading: 'Experienced legal professionals dedicated to your case.',
          alignment: 'center', height: 'small',
        }),
        comp('team-grid', 'Team', {
          title: 'Legal Team',
          members: [
            { name: 'Robert Sterling', role: 'Founding Partner', bio: '35 years experience. Former District Attorney. Harvard Law.', avatar: AVATAR.m1 },
            { name: 'Maria Gonzalez', role: 'Senior Partner, Family Law', bio: '20+ years specializing in custody and divorce cases.', avatar: AVATAR.w1 },
            { name: 'David Park', role: 'Partner, Corporate', bio: 'Harvard Law. Complex corporate litigation specialist.', avatar: AVATAR.m2 },
            { name: 'Sarah O\'Brien', role: 'Associate, Personal Injury', bio: 'Top 10 trial lawyers under 40. $100M+ recovered.', avatar: AVATAR.w3 },
          ],
        }),
        comp('timeline', 'History', {
          title: 'Firm History',
          items: [
            { date: '1994', title: 'Founded', description: 'Robert Sterling opens the firm with a focus on personal injury.' },
            { date: '2002', title: 'Expansion', description: 'Added family law, corporate, and estate planning practices.' },
            { date: '2010', title: '$100M Milestone', description: 'Surpassed $100 million in client recoveries.' },
            { date: '2020', title: 'Recognition', description: 'Named Top 50 Law Firms by New York Magazine.' },
            { date: '2025', title: 'Today', description: '$500M+ recovered, 5,000+ cases won.' },
          ],
        }),
        comp('logo-cloud', 'Recognition', {
          title: 'Awards & Recognition',
          logos: ['Super Lawyers', 'Martindale-Hubbell', 'Best Lawyers', 'NY Bar Association', 'Top Trial Lawyers'],
        }),
        foot(),
      ], false, 2),

      // ═══════════════════════════════════════════════════
      // CONTACT
      // ═══════════════════════════════════════════════════
      page('Contact', 'contact', [
        nav(),
        comp('hero', 'Contact', {
          heading: 'Free Consultation',
          subheading: 'Tell us about your case. A senior attorney will review it within 24 hours.',
          alignment: 'center', height: 'small',
        }),
        comp('contact-form', 'Form', {
          title: 'Request Consultation',
          subtitle: 'Your information is confidential and protected by attorney-client privilege.',
          fields: ['name', 'email', 'phone', 'message'],
          submitText: 'Submit Request', variant: 'card', showIcon: true,
        }),
        comp('icon-text', 'Info', {
          items: [
            { icon: '📞', title: 'Phone', description: '(555) 111-2222' },
            { icon: '📍', title: 'Office', description: '200 Legal Plaza, Suite 500, New York, NY 10001' },
            { icon: '📧', title: 'Email', description: 'info@sterlinglaw.com' },
            { icon: '⏰', title: 'Hours', description: 'Mon-Fri 8AM-6PM, Sat by appointment' },
          ],
          layout: 'horizontal',
        }),
        comp('map', 'Map', { address: '200 Legal Plaza, New York, NY', height: 350 }),
        foot(),
      ], false, 3),
    ];
  },
};

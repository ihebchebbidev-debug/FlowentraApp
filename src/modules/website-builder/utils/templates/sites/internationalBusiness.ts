import { SiteTemplate } from '../index';
import { IMG, AVATAR } from '../images';
import { comp, page, makeNavbar, makeFooter } from '../helpers';
import { INTERNATIONAL_THEME } from '../themes';

export const internationalBusinessTemplate: SiteTemplate = {
  id: 'international-business',
  name: 'International Business',
  description: 'Multilingual-ready corporate site with RTL support, language switcher, global offices, team profiles, case studies, blog, and international service showcase.',
  icon: '🌍',
  category: 'Corporate',
  theme: INTERNATIONAL_THEME,
  pageCount: 6,
  features: ['Multilingual support', 'RTL ready', 'Language switcher', 'Global offices map', 'Team grid', 'Timeline', 'Blog', 'Trust badges', 'Pricing', 'Newsletter', 'Cookie consent', 'WhatsApp'],
  previewImage: IMG.corporateHero,
  pages: () => {
    const nav = makeNavbar('🌍 GlobalCorp', [
      { label: 'Home', href: '#' },
      { label: 'About', href: '#about' },
      { label: 'Services', href: '#services' },
      { label: 'Offices', href: '#offices' },
      { label: 'Blog', href: '#blog' },
      { label: 'Contact', href: '#contact' },
    ], 'Get Started', {
      showLanguageSwitcher: true,
      languageSwitcherVariant: 'dropdown',
      languages: [
        { code: 'en', label: 'English', direction: 'ltr' },
        { code: 'fr', label: 'Français', direction: 'ltr' },
        { code: 'de', label: 'Deutsch', direction: 'ltr' },
        { code: 'ar', label: 'العربية', direction: 'rtl' },
        { code: 'zh', label: '中文', direction: 'ltr' },
      ],
      currentLanguage: 'en',
    });
    const foot = makeFooter('GlobalCorp International', 'Connecting businesses worldwide since 1995', '+1 (800) 555-GLOB', 'info@globalcorp.com', {
      links: [{ label: 'Home', href: '#' }, { label: 'About', href: '#about' }, { label: 'Services', href: '#services' }, { label: 'Offices', href: '#offices' }, { label: 'Contact', href: '#contact' }],
      socialLinks: [{ platform: 'linkedin', url: '#' }, { platform: 'twitter', url: '#' }, { platform: 'facebook', url: '#' }, { platform: 'youtube', url: '#' }],
    });
    return [
      // ═══════════════════════════════════════════════════
      // HOME
      // ═══════════════════════════════════════════════════
      page('Home', '', [
        nav(),
        comp('hero', 'Hero', {
          heading: 'Global Reach,\nLocal Expertise',
          subheading: 'We help businesses expand internationally with tailored solutions across 50+ countries. From market entry to operations, we\'re your partner for global success.',
          ctaText: 'Explore Our Services', ctaLink: '#services',
          secondaryCtaText: 'Find an Office', secondaryCtaLink: '#offices',
          alignment: 'center', height: 'large',
          backgroundImage: IMG.corporateHero, overlayOpacity: 55,
        }),
        comp('trust-badges', 'Trust', {
          title: 'Why Global Leaders Choose Us',
          badges: [
            { icon: '🌍', label: '50+ Countries' },
            { icon: '🏢', label: '12 Regional Offices' },
            { icon: '📊', label: '25 Years Experience' },
            { icon: '🤝', label: '500+ Enterprise Clients' },
          ],
        }),
        comp('animated-stats', 'Global Stats', {
          stats: [
            { value: '50', label: 'Countries', suffix: '+' },
            { value: '500', label: 'Global Clients', suffix: '+' },
            { value: '25', label: 'Years Experience' },
            { value: '2', label: 'Revenue Facilitated', suffix: 'B+', prefix: '$' },
          ],
          variant: 'gradient', columns: 4, animationStyle: 'count',
        }),
        comp('features', 'Services Overview', {
          title: 'International Business Solutions', subtitle: 'End-to-end support for your global expansion',
          columns: 4, bgColor: '#f0f4ff',
          features: [
            { icon: 'Globe', title: 'Market Entry', description: 'Research, strategy, and execution for new markets.' },
            { icon: 'Scale', title: 'Legal & Compliance', description: 'Navigate regulations in any jurisdiction.' },
            { icon: 'Users', title: 'Local Teams', description: 'Recruit and manage talent worldwide.' },
            { icon: 'Building', title: 'Operations', description: 'Set up offices, supply chains, and logistics.' },
          ],
        }),
        comp('logo-cloud', 'Clients', {
          title: 'Trusted by Fortune 500 Companies',
          logos: ['Siemens', 'Samsung', 'HSBC', 'Unilever', 'Total', 'Nestlé'],
        }),
        comp('image-text', 'About Preview', {
          title: 'Your Partner for Global Growth',
          description: 'For over 25 years, GlobalCorp has been the partner of choice for companies expanding into new markets. Our network of local experts across 50+ countries ensures you have the knowledge, connections, and infrastructure needed to succeed anywhere in the world.',
          imageUrl: IMG.corporateMeeting, imagePosition: 'right',
        }),
        comp('language-switcher', 'Language Demo', {
          languages: [
            { code: 'en', label: 'English', direction: 'ltr' },
            { code: 'fr', label: 'Français', direction: 'ltr' },
            { code: 'ar', label: 'العربية', direction: 'rtl' },
            { code: 'zh', label: '中文', direction: 'ltr' },
          ],
          currentLanguage: 'en', variant: 'pills', alignment: 'center', showFlags: true,
        }),
        comp('testimonials', 'Client Stories', {
          title: 'What Our Clients Say', variant: 'carousel',
          testimonials: [
            { name: 'Hans Mueller', role: 'CEO, TechVentures GmbH', text: 'GlobalCorp made our expansion into Asia seamless. Their local expertise in Singapore and Tokyo was invaluable.', rating: 5, avatar: AVATAR.m1 },
            { name: 'Fatima Al-Hassan', role: 'COO, MidEast Logistics', text: 'Professional, knowledgeable, and truly global. They understand the nuances of every market we\'ve entered.', rating: 5, avatar: AVATAR.w1 },
            { name: 'Liu Wei', role: 'VP Growth, SinoTech', text: 'From regulatory compliance to talent acquisition — GlobalCorp handled everything for our European expansion.', rating: 5, avatar: AVATAR.m2 },
          ],
        }),
        comp('cta-banner', 'CTA', {
          heading: 'Ready to Go Global?',
          subheading: 'Schedule a free consultation with our international business experts today.',
          ctaText: 'Contact Us', ctaLink: '#contact',
        }),
        comp('newsletter', 'Newsletter', {
          title: 'Global Business Insights', subtitle: 'Monthly analysis of international markets, regulations, and opportunities.',
          placeholder: 'Your email', buttonText: 'Subscribe',
          variant: 'split', showIcon: true, iconType: 'globe',
        }),
        comp('cookie-consent', 'Cookie', {
          text: 'We use cookies to enhance your experience and comply with GDPR, CCPA, and other privacy regulations.',
          buttonText: 'Accept All', learnMoreText: 'Cookie Policy', learnMoreUrl: '#privacy', position: 'bottom',
        }),
        comp('scroll-to-top', 'Scroll', { position: 'bottom-right' }),
        foot(),
      ], true, 0),

      // ═══════════════════════════════════════════════════
      // ABOUT
      // ═══════════════════════════════════════════════════
      page('About', 'about', [
        nav(),
        comp('hero', 'About Hero', {
          heading: 'Our Global Story', subheading: 'From a small consulting firm to a worldwide network of experts.',
          alignment: 'center', height: 'medium',
        }),
        comp('image-text', 'Story', {
          title: 'Built on Trust, Driven by Results',
          description: 'Founded in 1995 in New York, GlobalCorp started as a boutique consulting firm helping US companies enter European markets. Over 25 years, we\'ve grown into a truly global organization with offices on 6 continents and deep expertise in over 50 countries.',
          imageUrl: IMG.corporateMeeting, imagePosition: 'left',
        }),
        comp('timeline', 'History', {
          title: 'Our Journey',
          items: [
            { date: '1995', title: 'Founded in New York', description: 'Started as a boutique consulting firm for US-Europe trade.' },
            { date: '2002', title: 'Asia Pacific Expansion', description: 'Opened offices in Singapore, Tokyo, and Sydney.' },
            { date: '2010', title: 'Middle East & Africa', description: 'Established presence in Dubai, Johannesburg, and Cairo.' },
            { date: '2018', title: 'Digital Transformation', description: 'Launched virtual office solutions and AI-powered market insights.' },
            { date: '2023', title: '50+ Countries', description: 'Now operating across 6 continents with 500+ enterprise clients.' },
          ],
        }),
        comp('team-grid', 'Leadership', {
          title: 'Leadership Team',
          members: [
            { name: 'Sarah Chen', role: 'CEO', bio: 'Harvard MBA. 20 years in international business.', avatar: AVATAR.w1 },
            { name: 'Ahmed Hassan', role: 'COO — EMEA', bio: 'Based in London. Expert in Middle East markets.', avatar: AVATAR.m1 },
            { name: 'Marcus Weber', role: 'CFO', bio: 'Former Deloitte partner. Financial strategist.', avatar: AVATAR.m2 },
            { name: 'Yuki Tanaka', role: 'COO — APAC', bio: 'Based in Singapore. Japan and China specialist.', avatar: AVATAR.w3 },
          ],
        }),
        comp('animated-stats', 'Impact', {
          stats: [
            { value: '350', label: 'Team Members', suffix: '+' },
            { value: '28', label: 'Nationalities' },
            { value: '15', label: 'Languages Spoken' },
            { value: '6', label: 'Continents' },
          ],
          variant: 'cards', columns: 4, animationStyle: 'count',
        }),
        foot(),
      ], false, 1),

      // ═══════════════════════════════════════════════════
      // SERVICES
      // ═══════════════════════════════════════════════════
      page('Services', 'services', [
        nav(),
        comp('hero', 'Services Hero', {
          heading: 'Our Services', subheading: 'Comprehensive solutions for international business.',
          alignment: 'center', height: 'medium',
        }),
        comp('features', 'All Services', {
          title: 'Global Business Solutions', columns: 3,
          features: [
            { icon: 'Globe', title: 'Market Entry Strategy', description: 'Research, feasibility studies, and go-to-market plans for new territories.' },
            { icon: 'Scale', title: 'Legal & Compliance', description: 'Company formation, licensing, regulatory compliance across jurisdictions.' },
            { icon: 'Users', title: 'Talent Acquisition', description: 'Recruit local leadership and teams with our global HR network.' },
            { icon: 'Building', title: 'Office Setup', description: 'Physical and virtual office solutions in 50+ countries.' },
            { icon: 'TrendingUp', title: 'Financial Advisory', description: 'Cross-border tax planning, transfer pricing, and treasury management.' },
            { icon: 'Shield', title: 'Risk Management', description: 'Political, economic, and operational risk assessment and mitigation.' },
          ],
        }),
        comp('pricing', 'Packages', {
          title: 'Engagement Models',
          plans: [
            { name: 'Advisory', price: 'From $5K/mo', features: ['Market research', 'Strategy consulting', 'Monthly reports', 'Email support'], highlighted: false },
            { name: 'Full Service', price: 'From $15K/mo', features: ['Everything in Advisory', 'Legal & compliance', 'Talent acquisition', 'Dedicated account manager'], highlighted: true },
            { name: 'Enterprise', price: 'Custom', features: ['Everything in Full Service', 'Multi-country rollout', 'On-ground team', 'Board-level reporting'], highlighted: false },
          ],
        }),
        comp('comparison-table', 'Compare', {
          title: 'Engagement Comparison',
          headers: ['Advisory', 'Full Service', 'Enterprise'],
          rows: [
            { feature: 'Market Research', values: ['true', 'true', 'true'] },
            { feature: 'Strategy Consulting', values: ['true', 'true', 'true'] },
            { feature: 'Legal & Compliance', values: ['false', 'true', 'true'] },
            { feature: 'Talent Acquisition', values: ['false', 'true', 'true'] },
            { feature: 'On-Ground Team', values: ['false', 'false', 'true'] },
            { feature: 'Multi-Country', values: ['false', 'false', 'true'] },
          ],
        }),
        foot(),
      ], false, 2),

      // ═══════════════════════════════════════════════════
      // OFFICES
      // ═══════════════════════════════════════════════════
      page('Offices', 'offices', [
        nav(),
        comp('hero', 'Offices Hero', {
          heading: 'Our Global Offices', subheading: 'Find a GlobalCorp office near you.',
          alignment: 'center', height: 'small',
        }),
        comp('map', 'HQ Map', {
          address: 'New York, NY, USA', height: 500, variant: 'split',
          infoPosition: 'left', mapTheme: 'light', zoom: 12,
          showContactCard: true, contactCardTitle: 'Americas Headquarters', contactCardStyle: 'elevated',
          contactInfo: {
            address: '350 Fifth Avenue, Suite 4500\nNew York, NY 10118, USA',
            phone: '+1 (212) 555-1000', email: 'americas@globalcorp.com', hours: 'Mon-Fri: 9AM - 6PM EST',
          },
          showDirectionsButton: true,
        }),
        comp('icon-text', 'Other Offices', {
          items: [
            { icon: 'Building', title: 'London, UK', description: 'EMEA Headquarters\n+44 20 7946 0958' },
            { icon: 'Building', title: 'Singapore', description: 'APAC Headquarters\n+65 6123 4567' },
            { icon: 'Building', title: 'Dubai, UAE', description: 'Middle East Hub\n+971 4 123 4567' },
            { icon: 'Building', title: 'São Paulo, Brazil', description: 'LATAM Headquarters\n+55 11 3456 7890' },
            { icon: 'Building', title: 'Tokyo, Japan', description: 'Japan Office\n+81 3 1234 5678' },
            { icon: 'Building', title: 'Sydney, Australia', description: 'Oceania Office\n+61 2 1234 5678' },
          ],
          layout: 'horizontal',
        }),
        foot(),
      ], false, 3),

      // ═══════════════════════════════════════════════════
      // BLOG
      // ═══════════════════════════════════════════════════
      page('Blog', 'blog', [
        nav(),
        comp('hero', 'Blog Hero', {
          heading: 'Global Insights', subheading: 'Analysis and commentary on international business trends.',
          alignment: 'center', height: 'small',
        }),
        comp('blog-grid', 'Posts', {
          title: 'Latest Articles', columns: 3,
          posts: [
            { title: 'Navigating EU Regulations in 2026', excerpt: 'Key regulatory changes European businesses need to know.', category: 'Compliance', date: 'Feb 2026', author: 'Ahmed H.' },
            { title: 'The Rise of Southeast Asian Markets', excerpt: 'Why Vietnam, Indonesia, and Philippines are the new growth hotspots.', category: 'Markets', date: 'Jan 2026', author: 'Yuki T.' },
            { title: 'Cross-Border Tax Strategies', excerpt: 'Optimizing your tax structure across multiple jurisdictions.', category: 'Finance', date: 'Jan 2026', author: 'Marcus W.' },
            { title: 'Remote Workforce Across Borders', excerpt: 'Legal and operational challenges of global remote teams.', category: 'HR', date: 'Dec 2025', author: 'Sarah C.' },
            { title: 'Digital Transformation in MENA', excerpt: 'How Middle East and North Africa are embracing tech innovation.', category: 'Technology', date: 'Nov 2025', author: 'Ahmed H.' },
            { title: 'Supply Chain Resilience Post-2025', excerpt: 'Building robust supply chains in an uncertain world.', category: 'Operations', date: 'Oct 2025', author: 'Marcus W.' },
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
          heading: 'Get in Touch', subheading: 'Our global team is ready to help with your international expansion.',
          alignment: 'center', height: 'small',
        }),
        comp('contact-form', 'Form', {
          title: 'Send Us a Message', subtitle: 'We respond within 24 hours in your preferred language.',
          fields: ['name', 'email', 'phone', 'message'], submitText: 'Submit Inquiry', variant: 'card',
          formSettings: { collectSubmissions: true, successAction: 'message' },
        }),
        comp('icon-text', 'Global Contact', {
          items: [
            { icon: 'Phone', title: 'Americas', description: '+1 (800) 555-GLOB' },
            { icon: 'Phone', title: 'EMEA', description: '+44 20 7946 0958' },
            { icon: 'Phone', title: 'APAC', description: '+65 6123 4567' },
            { icon: 'Mail', title: 'Email', description: 'info@globalcorp.com' },
          ],
          layout: 'horizontal',
        }),
        comp('whatsapp-button', 'WhatsApp', {
          phoneNumber: '+18005554562', defaultMessage: 'Hello, I\'m interested in your international business services.',
          position: 'bottom-right', showGreeting: true,
          greetingText: 'Hi! 👋 How can we help you expand globally?', agentName: 'GlobalCorp Support',
        }),
        foot(),
      ], false, 5),
    ];
  },
};

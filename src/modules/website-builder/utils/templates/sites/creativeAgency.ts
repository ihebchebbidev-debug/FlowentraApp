import { SiteTemplate } from '../index';
import { IMG, AVATAR } from '../images';
import { comp, page, makeNavbar, makeFooter } from '../helpers';
import { AGENCY_THEME } from '../themes';

export const creativeAgencyTemplate: SiteTemplate = {
  id: 'creative-agency',
  name: 'Creative Agency',
  description: 'Bold dark agency website with services, portfolio showcase, team, case studies, pricing, blog, trust badges, and floating CTAs.',
  icon: '🎯',
  category: 'Creative',
  theme: AGENCY_THEME,
  pageCount: 6,
  features: ['Dark theme', 'Portfolio gallery', 'Team grid', 'Client logos', 'Marquee', 'Pricing', 'Comparison table', 'Blog', 'Trust badges', 'Timeline', 'Floating CTA', 'Cookie consent'],
  previewImage: IMG.agencyHero,
  pages: () => {
    const nav = makeNavbar('🎯 Pixel & Code', [
      { label: 'Home', href: '#' },
      { label: 'Services', href: '#services' },
      { label: 'Work', href: '#work' },
      { label: 'About', href: '#about' },
      { label: 'Blog', href: '#blog' },
      { label: 'Contact', href: '#contact' },
    ], 'Let\'s Talk');
    const foot = makeFooter('Pixel & Code Agency', 'Digital experiences that convert', '', 'hello@pixelcode.io', {
      links: [{ label: 'Home', href: '#' }, { label: 'Services', href: '#services' }, { label: 'Work', href: '#work' }, { label: 'About', href: '#about' }, { label: 'Contact', href: '#contact' }],
      socialLinks: [{ platform: 'instagram', url: '#' }, { platform: 'linkedin', url: '#' }, { platform: 'twitter', url: '#' }, { platform: 'github', url: '#' }],
    });
    return [
      // ═══════════════════════════════════════════════════
      // HOME
      // ═══════════════════════════════════════════════════
      page('Home', '', [
        nav(),
        comp('marquee', 'Marquee', {
          text: '★ BRAND STRATEGY • WEB DESIGN • APP DEVELOPMENT • SEO & GROWTH • MOTION GRAPHICS ★',
          speed: 30,
        }),
        comp('hero', 'Hero', {
          heading: 'We Build Digital\nExperiences That Convert',
          subheading: 'Strategy, design, and development for ambitious brands ready to make an impact.',
          ctaText: 'Start a Project', ctaLink: '#contact',
          secondaryCtaText: 'View Our Work', secondaryCtaLink: '#work',
          alignment: 'center', height: 'large',
          backgroundImage: IMG.agencyHero, overlayOpacity: 65,
        }),
        comp('trust-badges', 'Trust', {
          title: 'Why Brands Choose Us',
          badges: [
            { icon: '🏆', label: '12 Awwwards' },
            { icon: '⚡', label: 'Avg 2-Week Delivery' },
            { icon: '📈', label: '150% Avg ROI Increase' },
            { icon: '🤝', label: '98% Client Retention' },
          ],
        }),
        comp('logo-cloud', 'Clients', {
          title: 'Trusted By Leading Brands', logos: ['Nike', 'Spotify', 'Uber', 'Adobe', 'Slack', 'Shopify'],
        }),
        comp('animated-stats', 'Stats', {
          stats: [
            { value: '300', label: 'Projects', suffix: '+' },
            { value: '150', label: 'Happy Clients', suffix: '+' },
            { value: '12', label: 'Awards' },
            { value: '98', label: 'Client Retention', suffix: '%' },
          ],
          variant: 'gradient', columns: 4, animationStyle: 'count',
        }),
        comp('service-card', 'Services', {
          title: 'What We Do',
          services: [
            { icon: '🎨', title: 'Brand Strategy', description: 'Identity, positioning, guidelines, and visual language.', price: '' },
            { icon: '💻', title: 'Web Development', description: 'Custom websites, web apps, and e-commerce platforms.', price: '' },
            { icon: '📱', title: 'Mobile Apps', description: 'Native iOS & Android with seamless user experience.', price: '' },
            { icon: '📈', title: 'Growth Marketing', description: 'SEO, PPC, social media, and conversion optimization.', price: '' },
          ],
        }),
        comp('lightbox-gallery', 'Portfolio', {
          title: 'Selected Work', columns: 3,
          images: [
            { url: IMG.agency1, caption: 'Nike — Brand Campaign' },
            { url: IMG.agency2, caption: 'Shopify — E-Commerce Redesign' },
            { url: IMG.agency3, caption: 'SaaS — Dashboard UI' },
          ],
        }),
        comp('testimonials', 'Reviews', {
          title: 'Client Love', variant: 'carousel',
          testimonials: [
            { name: 'Anna K.', role: 'VP Marketing, TechCorp', text: 'Conversions jumped 150% after our rebrand. The team is exceptional.', rating: 5, avatar: AVATAR.w1 },
            { name: 'Tom M.', role: 'Founder, StartupXYZ', text: 'Best agency we\'ve ever worked with. True partners in every sense.', rating: 5, avatar: AVATAR.m1 },
            { name: 'Jessica W.', role: 'CMO, GrowthCo', text: 'They delivered our complete rebrand in just 3 weeks. Phenomenal speed and quality.', rating: 5, avatar: AVATAR.w2 },
          ],
        }),
        comp('parallax', 'Parallax', {
          imageUrl: IMG.agency1,
          heading: 'Great design is good business.',
          subheading: 'Every project starts with understanding your goals.',
          height: 'small', overlayOpacity: 65,
        }),
        comp('cta-banner', 'CTA', {
          heading: 'Ready to Grow?',
          subheading: 'Let\'s discuss your next project and turn your vision into reality.',
          ctaText: 'Let\'s Talk', ctaLink: '#contact',
        }),
        comp('newsletter', 'Newsletter', {
          title: 'Creative Insights', subtitle: 'Monthly design trends, case studies, and growth tips.',
          placeholder: 'Your email', buttonText: 'Subscribe',
        }),
        comp('floating-cta', 'Floating', {
          text: 'Start Your Project', link: '#contact', icon: 'ArrowRight',
          position: 'bottom-center', showAfterScroll: 500, animation: 'slide-up', pill: true,
        }),
        comp('scroll-to-top', 'Scroll', { position: 'bottom-right', offsetY: 90 }),
        comp('cookie-consent', 'Cookie', {
          text: 'We use cookies for analytics and to improve your experience.',
          buttonText: 'Accept', position: 'bottom',
        }),
        foot(),
      ], true, 0),

      // ═══════════════════════════════════════════════════
      // SERVICES
      // ═══════════════════════════════════════════════════
      page('Services', 'services', [
        nav(),
        comp('hero', 'Services', {
          heading: 'Our Services', subheading: 'End-to-end digital solutions for ambitious brands.',
          alignment: 'center', height: 'medium', backgroundImage: IMG.agency2, overlayOpacity: 65,
        }),
        comp('features', 'Services Grid', {
          title: 'Full-Service Agency', columns: 3,
          features: [
            { icon: 'Palette', title: 'Brand Design', description: 'Logo, identity systems, brand guidelines, and collateral.' },
            { icon: 'Code', title: 'Web Development', description: 'Custom websites, web apps, and headless CMS solutions.' },
            { icon: 'Smartphone', title: 'Mobile Apps', description: 'Native iOS & Android with React Native or Swift/Kotlin.' },
            { icon: 'TrendingUp', title: 'Growth Marketing', description: 'SEO, content strategy, PPC, and social media management.' },
            { icon: 'Film', title: 'Motion & Video', description: 'Animations, explainers, social content, and brand films.' },
            { icon: 'BarChart3', title: 'Analytics & CRO', description: 'Data-driven optimization for higher conversion rates.' },
          ],
        }),
        comp('timeline', 'Process', {
          title: 'Our Process',
          items: [
            { date: 'Week 1', title: 'Discovery & Strategy', description: 'Understanding your goals, audience, and competitive landscape.' },
            { date: 'Week 2-3', title: 'Design & Prototype', description: 'Wireframes, visual design, and interactive prototypes.' },
            { date: 'Week 3-5', title: 'Development', description: 'Pixel-perfect code with performance and accessibility built in.' },
            { date: 'Week 5-6', title: 'Launch & Optimize', description: 'Deployment, monitoring, and continuous improvement.' },
          ],
        }),
        comp('pricing', 'Packages', {
          title: 'Project Packages',
          plans: [
            { name: 'Starter', price: '$5K', features: ['Brand identity', 'Landing page', '2 weeks delivery', '1 revision round'], highlighted: false },
            { name: 'Growth', price: '$15K', features: ['Full branding', 'Custom website', 'SEO setup', '6 weeks delivery', '3 revision rounds'], highlighted: true },
            { name: 'Enterprise', price: 'Custom', features: ['Full digital strategy', 'Web + mobile app', 'Ongoing support', 'Dedicated team'], highlighted: false },
          ],
        }),
        comp('comparison-table', 'Compare', {
          title: 'Package Comparison',
          headers: ['Starter', 'Growth', 'Enterprise'],
          rows: [
            { feature: 'Brand Identity', values: ['true', 'true', 'true'] },
            { feature: 'Custom Website', values: ['Landing only', 'Full site', 'Full site'] },
            { feature: 'Mobile App', values: ['false', 'false', 'true'] },
            { feature: 'SEO Setup', values: ['false', 'true', 'true'] },
            { feature: 'Analytics Dashboard', values: ['false', 'true', 'true'] },
            { feature: 'Ongoing Support', values: ['false', 'false', 'true'] },
          ],
        }),
        foot(),
      ], false, 1),

      // ═══════════════════════════════════════════════════
      // WORK
      // ═══════════════════════════════════════════════════
      page('Work', 'work', [
        nav(),
        comp('hero', 'Work', {
          heading: 'Our Work', subheading: 'See what we\'ve built for amazing brands.',
          alignment: 'center', height: 'medium', backgroundImage: IMG.agency3, overlayOpacity: 60,
        }),
        comp('lightbox-gallery', 'Portfolio', {
          title: 'Case Studies', columns: 3,
          images: [
            { url: IMG.agency1, caption: 'Nike — Brand Campaign (+150% engagement)' },
            { url: IMG.agency2, caption: 'Shopify — E-Commerce Platform (+200% revenue)' },
            { url: IMG.agency3, caption: 'SaaS Dashboard — Enterprise UI' },
          ],
        }),
        comp('animated-stats', 'Results', {
          stats: [
            { value: '150', label: 'Avg. Engagement Lift', suffix: '%' },
            { value: '200', label: 'Revenue Growth', suffix: '%' },
            { value: '40', label: 'Cost Reduction', suffix: '%' },
            { value: '3', label: 'Faster Time to Market', suffix: 'x' },
          ],
          variant: 'gradient', columns: 4, animationStyle: 'count',
        }),
        foot(),
      ], false, 2),

      // ═══════════════════════════════════════════════════
      // ABOUT
      // ═══════════════════════════════════════════════════
      page('About', 'about', [
        nav(),
        comp('hero', 'About Hero', {
          heading: 'About Us', subheading: 'A small team with big ambitions.',
          alignment: 'center', height: 'medium',
        }),
        comp('image-text', 'Story', {
          title: 'Our Story',
          description: 'Pixel & Code was founded in 2018 by a designer and developer who believed great work happens when strategy, creativity, and technology converge. Today we\'re a team of 12 passionate creatives serving clients worldwide.',
          imageUrl: IMG.agency1, imagePosition: 'left',
        }),
        comp('team-grid', 'Team', {
          title: 'Meet the Team',
          members: [
            { name: 'Alex Rivera', role: 'Founder & Creative Director', bio: 'Former Google Design Lead.', avatar: AVATAR.m1 },
            { name: 'Sarah Chen', role: 'Head of Development', bio: 'Full-stack engineer, React expert.', avatar: AVATAR.w1 },
            { name: 'Marcus Johnson', role: 'Lead Designer', bio: '8x Awwwards winner.', avatar: AVATAR.m2 },
            { name: 'Priya Patel', role: 'Growth Strategist', bio: 'Ex-HubSpot, data-driven marketing.', avatar: AVATAR.w3 },
          ],
        }),
        comp('timeline', 'History', {
          title: 'Our Journey',
          items: [
            { date: '2018', title: 'Founded', description: 'Two founders, one shared vision.' },
            { date: '2019', title: 'First Major Client', description: 'Landed our first Fortune 500 project.' },
            { date: '2021', title: 'Team of 8', description: 'Expanded to cover design, dev, and marketing.' },
            { date: '2023', title: '200+ Projects', description: 'Crossed 200 delivered projects with 98% satisfaction.' },
            { date: '2025', title: '12 Team Members', description: 'Still growing, still passionate.' },
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
          heading: 'Creative Blog', subheading: 'Insights on design, development, and digital growth.',
          alignment: 'center', height: 'small',
        }),
        comp('blog-grid', 'Posts', {
          title: 'Latest Articles', columns: 3,
          posts: [
            { title: 'Why Brand Strategy Comes Before Design', excerpt: 'The foundation that makes or breaks your visual identity.', category: 'Strategy', date: 'Feb 2026', author: 'Alex R.' },
            { title: 'The ROI of Great Web Design', excerpt: 'How investing in design drives measurable business results.', category: 'Design', date: 'Jan 2026', author: 'Marcus J.' },
            { title: 'SEO in 2026: What Actually Works', excerpt: 'Cutting through the noise with data-driven SEO strategies.', category: 'Growth', date: 'Jan 2026', author: 'Priya P.' },
            { title: 'Building Accessible Websites', excerpt: 'Why accessibility is good for users and your bottom line.', category: 'Development', date: 'Dec 2025', author: 'Sarah C.' },
            { title: 'From Mockup to Production in 2 Weeks', excerpt: 'Our streamlined process for rapid project delivery.', category: 'Process', date: 'Nov 2025', author: 'Alex R.' },
            { title: 'Animation Done Right', excerpt: 'When motion design enhances UX — and when it hurts.', category: 'Design', date: 'Oct 2025', author: 'Marcus J.' },
          ],
        }),
        foot(),
      ], false, 4),

      // ═══════════════════════════════════════════════════
      // CONTACT
      // ═══════════════════════════════════════════════════
      page('Contact', 'contact', [
        nav(),
        comp('hero', 'Contact', {
          heading: 'Let\'s Build Something Great',
          subheading: 'Tell us about your project and let\'s create something amazing together.',
          alignment: 'center', height: 'small',
        }),
        comp('contact-form', 'Form', {
          title: 'Start a Project', subtitle: 'We typically respond within 24 hours.',
          fields: ['name', 'email', 'phone', 'message'], submitText: 'Send Brief', variant: 'card',
        }),
        comp('icon-text', 'Info', {
          items: [
            { icon: 'Mail', title: 'Email', description: 'hello@pixelcode.io' },
            { icon: 'MapPin', title: 'Location', description: 'San Francisco, CA' },
            { icon: 'Clock', title: 'Response', description: 'Within 24 hours' },
          ],
          layout: 'horizontal',
        }),
        comp('social-links', 'Social', {
          title: 'Follow Us',
          links: [{ platform: 'instagram', url: '#' }, { platform: 'linkedin', url: '#' }, { platform: 'twitter', url: '#' }, { platform: 'dribbble', url: '#' }],
        }),
        foot(),
      ], false, 5),
    ];
  },
};

import { SiteTemplate } from '../index';
import { IMG, AVATAR } from '../images';
import { comp, page, makeNavbar, makeFooter } from '../helpers';
import { SAAS_THEME } from '../themes';

export const saasStartupTemplate: SiteTemplate = {
  id: 'saas-startup',
  name: 'SaaS / Startup',
  description: 'Modern SaaS landing page with features, pricing, comparison table, testimonials, FAQ, blog, team, trust badges, and floating CTAs.',
  icon: '🚀',
  category: 'Technology',
  theme: SAAS_THEME,
  pageCount: 5,
  features: ['Hero with image', 'Feature showcase', 'Pricing tiers', 'Comparison table', 'Testimonials', 'FAQ', 'Trust badges', 'Blog', 'Team', 'Newsletter', 'Floating CTA', 'Scroll to top'],
  previewImage: IMG.saasHero,
  pages: () => {
    const nav = makeNavbar('🚀 LaunchPad', [
      { label: 'Home', href: '#' },
      { label: 'Features', href: '#features' },
      { label: 'Pricing', href: '#pricing' },
      { label: 'About', href: '#about' },
      { label: 'Blog', href: '#blog' },
      { label: 'Contact', href: '#contact' },
    ], 'Start Free');
    const foot = makeFooter('LaunchPad Inc', 'Ship faster, grow smarter', '', 'hello@launchpad.io', {
      links: [{ label: 'Home', href: '#' }, { label: 'Features', href: '#features' }, { label: 'Pricing', href: '#pricing' }, { label: 'About', href: '#about' }, { label: 'Contact', href: '#contact' }],
      socialLinks: [{ platform: 'twitter', url: '#' }, { platform: 'github', url: '#' }, { platform: 'linkedin', url: '#' }, { platform: 'youtube', url: '#' }],
    });
    return [
      // ═══════════════════════════════════════════════════
      // HOME
      // ═══════════════════════════════════════════════════
      page('Home', '', [
        nav(),
        comp('announcement-bar', 'Promo', {
          text: '🎉 LaunchPad 3.0 is here — AI-powered analytics, 50% faster builds!',
          linkText: 'See what\'s new →', linkUrl: '#features', dismissible: true, variant: 'accent',
        }),
        comp('hero', 'Hero', {
          heading: 'Ship Faster,\nGrow Smarter',
          subheading: 'The all-in-one platform that helps startups build, launch, and scale 10x faster.',
          ctaText: 'Start Free Trial', ctaLink: '#pricing',
          secondaryCtaText: 'Watch Demo', secondaryCtaLink: '#demo',
          alignment: 'center', height: 'large',
          backgroundImage: IMG.saasHero, overlayOpacity: 55,
        }),
        comp('trust-badges', 'Trust', {
          title: 'Why 1,000+ Teams Choose LaunchPad',
          badges: [
            { icon: '⚡', label: 'Sub-100ms Response' },
            { icon: '🔒', label: 'SOC2 Compliant' },
            { icon: '🌍', label: '150+ Countries' },
            { icon: '🏆', label: '#1 on Product Hunt' },
          ],
        }),
        comp('logo-cloud', 'Logos', {
          title: 'Trusted by 1,000+ companies',
          logos: ['Stripe', 'Vercel', 'Linear', 'Notion', 'Figma', 'Shopify'],
        }),
        comp('features', 'Features', {
          title: 'Everything You Need', columns: 4, bgColor: '#f0f9ff',
          features: [
            { icon: 'Zap', title: 'Lightning Fast', description: 'Sub-100ms response times with global edge deployment.' },
            { icon: 'Lock', title: 'Enterprise Security', description: 'SOC2, GDPR, HIPAA compliant out of the box.' },
            { icon: 'BarChart3', title: 'Real-Time Analytics', description: 'Track every metric that matters with AI insights.' },
            { icon: 'Plug', title: '200+ Integrations', description: 'Connect with your favorite tools in seconds.' },
          ],
        }),
        comp('animated-stats', 'Stats', {
          stats: [
            { value: '10', label: 'Faster Shipping', suffix: 'x' },
            { value: '99.99', label: 'Uptime SLA', suffix: '%' },
            { value: '1', label: 'API Calls/Day', suffix: 'M+' },
            { value: '150', label: 'Countries', suffix: '+' },
          ],
          variant: 'gradient', columns: 4, animationStyle: 'count',
        }),
        comp('image-text', 'Product', {
          title: 'Built for Modern Teams',
          description: 'LaunchPad combines project management, deployment, analytics, and collaboration in one beautiful dashboard. Stop switching between tools — ship your product faster with everything in one place.',
          imageUrl: IMG.saasHero, imagePosition: 'right',
        }),
        comp('pricing', 'Pricing', {
          title: 'Simple, Transparent Pricing',
          plans: [
            { name: 'Starter', price: '$0/mo', features: ['1 project', '1K API calls', 'Community support'], highlighted: false },
            { name: 'Pro', price: '$49/mo', features: ['Unlimited projects', '100K API calls', 'Priority support', 'Custom domains', 'Team collaboration'], highlighted: true },
            { name: 'Enterprise', price: 'Custom', features: ['Everything in Pro', 'Unlimited API calls', 'SSO & SAML', 'SLA guarantee', 'Dedicated account manager'], highlighted: false },
          ],
        }),
        comp('comparison-table', 'Compare', {
          title: 'Plan Comparison',
          headers: ['Starter', 'Pro', 'Enterprise'],
          rows: [
            { feature: 'Projects', values: ['1', 'Unlimited', 'Unlimited'] },
            { feature: 'API Calls', values: ['1K/mo', '100K/mo', 'Unlimited'] },
            { feature: 'Team Members', values: ['1', '10', 'Unlimited'] },
            { feature: 'Custom Domains', values: ['false', 'true', 'true'] },
            { feature: 'SSO / SAML', values: ['false', 'false', 'true'] },
            { feature: 'SLA Guarantee', values: ['false', 'false', 'true'] },
            { feature: 'Priority Support', values: ['false', 'true', 'true'] },
          ],
        }),
        comp('testimonials', 'Reviews', {
          title: 'Loved by Developers', variant: 'grid', bgColor: '#f0f9ff',
          testimonials: [
            { name: 'Sarah K.', role: 'CTO at TechCorp', text: 'Cut our development time in half. The DX is phenomenal.', rating: 5, avatar: AVATAR.w1 },
            { name: 'Mark J.', role: 'Founder, StartupXYZ', text: 'From zero to production in 15 minutes. Mind-blowing.', rating: 5, avatar: AVATAR.m1 },
            { name: 'Priya R.', role: 'Lead Engineer, ScaleCo', text: 'The best developer experience I\'ve ever used. Period.', rating: 5, avatar: AVATAR.w3 },
            { name: 'Alex T.', role: 'VP Eng, GrowthLab', text: 'Replaced 4 tools with LaunchPad. Our team is 3x more productive.', rating: 5, avatar: AVATAR.m2 },
          ],
        }),
        comp('faq', 'FAQ', {
          title: 'Frequently Asked Questions', variant: 'accordion',
          items: [
            { question: 'Can I cancel anytime?', answer: 'Yes, no lock-in contracts. Cancel with one click.' },
            { question: 'Is there a free trial?', answer: 'Yes, 14-day free trial on Pro. No credit card required.' },
            { question: 'Do you offer refunds?', answer: 'Yes, 30-day money-back guarantee on all paid plans.' },
            { question: 'What languages/frameworks do you support?', answer: 'We support React, Vue, Svelte, Next.js, Nuxt, and more. Any JavaScript framework works.' },
            { question: 'How does pricing scale?', answer: 'You only pay for what you use. No surprise bills — we alert you before you hit limits.' },
          ],
        }),
        comp('newsletter', 'Newsletter', {
          title: 'Stay Updated', subtitle: 'Get product updates and engineering blog posts.',
          buttonText: 'Subscribe', variant: 'split', showIcon: true, iconType: 'bell',
          formSettings: { collectSubmissions: true, successAction: 'message' },
        }),
        comp('floating-cta', 'Floating CTA', {
          text: 'Try Free for 14 Days', link: '#pricing', icon: 'ArrowRight',
          position: 'bottom-center', showAfterScroll: 400, animation: 'slide-up', pill: true,
        }),
        comp('scroll-to-top', 'Scroll', { position: 'bottom-right', showAfterScroll: 300 }),
        foot(),
      ], true, 0),

      // ═══════════════════════════════════════════════════
      // FEATURES
      // ═══════════════════════════════════════════════════
      page('Features', 'features', [
        nav(),
        comp('hero', 'Features', {
          heading: 'All Features', subheading: 'Everything your team needs to ship faster.',
          alignment: 'center', height: 'medium',
        }),
        comp('features', 'All Features', {
          title: 'Platform Features', columns: 3,
          features: [
            { icon: 'Zap', title: 'Performance', description: 'Edge computing, CDN, automatic caching.' },
            { icon: 'Lock', title: 'Security', description: 'Encryption, audit logs, compliance certifications.' },
            { icon: 'Bot', title: 'AI Powered', description: 'Smart suggestions, auto-optimization, anomaly detection.' },
            { icon: 'Smartphone', title: 'Mobile Ready', description: 'Responsive dashboards and mobile SDKs.' },
            { icon: 'Globe', title: 'Global CDN', description: 'Deploy to 100+ edge locations worldwide.' },
            { icon: 'Layers', title: 'Version Control', description: 'Built-in branching, rollbacks, and deploy previews.' },
          ],
        }),
        comp('timeline', 'Roadmap', {
          title: 'Product Roadmap',
          items: [
            { date: 'Q1 2026', title: 'AI Assistant', description: 'Natural language queries for your data and codebase.' },
            { date: 'Q2 2026', title: 'Mobile App', description: 'iOS and Android companion apps for on-the-go monitoring.' },
            { date: 'Q3 2026', title: 'Enterprise SSO', description: 'SAML, OIDC, and directory sync for enterprise teams.' },
            { date: 'Q4 2026', title: 'Marketplace', description: 'Third-party plugins and integrations marketplace.' },
          ],
        }),
        foot(),
      ], false, 1),

      // ═══════════════════════════════════════════════════
      // ABOUT
      // ═══════════════════════════════════════════════════
      page('About', 'about', [
        nav(),
        comp('hero', 'About Hero', {
          heading: 'About LaunchPad', subheading: 'The team behind the platform.',
          alignment: 'center', height: 'medium',
        }),
        comp('image-text', 'Story', {
          title: 'Our Mission',
          description: 'We believe every developer deserves world-class tools. LaunchPad was born from our frustration with fragmented tooling — we set out to build the unified platform we wished existed. Today, over 1,000 teams trust us to ship faster.',
          imageUrl: IMG.saasHero, imagePosition: 'left',
        }),
        comp('team-grid', 'Team', {
          title: 'Leadership Team',
          members: [
            { name: 'Ryan Chen', role: 'Co-Founder & CEO', bio: 'Ex-Stripe, Stanford CS.', avatar: AVATAR.m1 },
            { name: 'Maya Singh', role: 'Co-Founder & CTO', bio: 'Ex-Google, distributed systems expert.', avatar: AVATAR.w1 },
            { name: 'David Park', role: 'VP Engineering', bio: 'Built Vercel\'s deployment pipeline.', avatar: AVATAR.m2 },
            { name: 'Lisa Torres', role: 'VP Product', bio: 'Ex-Linear, obsessed with DX.', avatar: AVATAR.w2 },
          ],
        }),
        comp('animated-stats', 'Company Stats', {
          stats: [
            { value: '45', label: 'Team Members', suffix: '' },
            { value: '25', label: 'Series A', suffix: 'M', prefix: '$' },
            { value: 'SF + NYC', label: 'Offices' },
            { value: '2022', label: 'Founded' },
          ],
          variant: 'cards', columns: 4,
        }),
        foot(),
      ], false, 2),

      // ═══════════════════════════════════════════════════
      // BLOG
      // ═══════════════════════════════════════════════════
      page('Blog', 'blog', [
        nav(),
        comp('hero', 'Blog Hero', {
          heading: 'Engineering Blog', subheading: 'Technical deep-dives, product updates, and startup insights.',
          alignment: 'center', height: 'small',
        }),
        comp('blog-grid', 'Posts', {
          title: 'Latest Posts', columns: 3,
          posts: [
            { title: 'Introducing LaunchPad 3.0', excerpt: 'AI-powered analytics, 50% faster builds, and a redesigned dashboard.', category: 'Product', date: 'Feb 2026', author: 'Maya S.' },
            { title: 'How We Achieved 99.99% Uptime', excerpt: 'The infrastructure decisions that power our reliability.', category: 'Engineering', date: 'Jan 2026', author: 'David P.' },
            { title: 'Edge Computing in 2026', excerpt: 'Why edge deployment is now table stakes for modern apps.', category: 'Technology', date: 'Jan 2026', author: 'Ryan C.' },
            { title: 'Building a Developer-First Culture', excerpt: 'How we ship 10x faster with a lean team.', category: 'Culture', date: 'Dec 2025', author: 'Lisa T.' },
            { title: 'GraphQL vs REST: Our Take', excerpt: 'When to use each and why we support both.', category: 'Engineering', date: 'Nov 2025', author: 'Maya S.' },
            { title: 'Raising Our Series A', excerpt: 'Lessons from fundraising in a tough market.', category: 'Startup', date: 'Oct 2025', author: 'Ryan C.' },
          ],
        }),
        foot(),
      ], false, 3),

      // ═══════════════════════════════════════════════════
      // CONTACT
      // ═══════════════════════════════════════════════════
      page('Contact', 'contact', [
        nav(),
        comp('hero', 'Contact', {
          heading: 'Get in Touch', subheading: 'Our team is here to help.',
          alignment: 'center', height: 'small',
        }),
        comp('contact-form', 'Form', {
          title: 'Contact Us', fields: ['name', 'email', 'message'],
          submitText: 'Send Message', variant: 'card',
        }),
        comp('icon-text', 'Contact Info', {
          items: [
            { icon: 'Mail', title: 'Email', description: 'hello@launchpad.io' },
            { icon: 'MapPin', title: 'HQ', description: 'San Francisco, CA' },
            { icon: 'Clock', title: 'Response', description: 'Within 24 hours' },
          ],
          layout: 'horizontal',
        }),
        foot(),
      ], false, 4),
    ];
  },
};

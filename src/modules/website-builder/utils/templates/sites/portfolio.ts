import { SiteTemplate } from '../index';
import { IMG, AVATAR } from '../images';
import { comp, page, makeNavbar, makeFooter } from '../helpers';
import { PORTFOLIO_THEME } from '../themes';

export const portfolioTemplate: SiteTemplate = {
  id: 'portfolio',
  name: 'Creative Portfolio',
  description: 'Dark-themed portfolio for designers, developers & creatives with project showcase, testimonials, blog, timeline, and advanced interactions.',
  icon: '🎨',
  category: 'Creative',
  theme: PORTFOLIO_THEME,
  pageCount: 5,
  features: ['Dark theme', 'Project gallery', 'Skills progress', 'Timeline', 'Testimonials', 'Blog grid', 'Newsletter', 'Marquee', 'Parallax', 'Floating CTA'],
  previewImage: IMG.portfolioHero,
  pages: () => {
    const nav = makeNavbar('✦ Alex Design', [
      { label: 'Home', href: '#' },
      { label: 'Work', href: '#work' },
      { label: 'About', href: '#about' },
      { label: 'Blog', href: '#blog' },
      { label: 'Contact', href: '#contact' },
    ], undefined, {
      socialLinks: [{ platform: 'github', url: '#' }, { platform: 'linkedin', url: '#' }, { platform: 'twitter', url: '#' }, { platform: 'dribbble', url: '#' }],
    });
    const foot = makeFooter('Alex Design Studio', 'Creating digital experiences', '', 'hello@alexdesign.co', {
      links: [{ label: 'Home', href: '#' }, { label: 'Work', href: '#work' }, { label: 'About', href: '#about' }, { label: 'Blog', href: '#blog' }, { label: 'Contact', href: '#contact' }],
      socialLinks: [{ platform: 'github', url: '#' }, { platform: 'linkedin', url: '#' }, { platform: 'twitter', url: '#' }, { platform: 'dribbble', url: '#' }],
    });
    return [
      // ═══════════════════════════════════════════════════
      // HOME
      // ═══════════════════════════════════════════════════
      page('Home', '', [
        nav(),
        comp('marquee', 'Marquee', {
          text: '★ BRAND DESIGN • UI/UX • MOTION GRAPHICS • FRONT-END DEVELOPMENT • CREATIVE DIRECTION ★',
          speed: 30,
        }),
        comp('hero', 'Hero', {
          heading: 'I Design Digital\nExperiences',
          subheading: 'Product designer & creative director with 10+ years of experience crafting brands, interfaces, and digital products that people love.',
          ctaText: 'View My Work', ctaLink: '#work',
          secondaryCtaText: 'About Me', secondaryCtaLink: '#about',
          alignment: 'left', height: 'large',
          backgroundImage: IMG.portfolioHero, overlayOpacity: 70,
        }),
        comp('animated-stats', 'Stats', {
          stats: [
            { value: '10', label: 'Years Experience', suffix: '+' },
            { value: '150', label: 'Projects Done', suffix: '+' },
            { value: '50', label: 'Happy Clients', suffix: '+' },
            { value: '12', label: 'Awards' },
          ],
          variant: 'gradient', columns: 4, animationStyle: 'count',
        }),
        comp('features', 'Services', {
          title: 'What I Do', columns: 4, bgColor: '#0c1426',
          features: [
            { icon: 'Palette', title: 'Brand Design', description: 'Logo, identity systems, brand guidelines, and visual language.' },
            { icon: 'Smartphone', title: 'UI/UX Design', description: 'Web and mobile app interfaces with user-centered approach.' },
            { icon: 'Film', title: 'Motion Design', description: 'Animations, micro-interactions, and video production.' },
            { icon: 'Code', title: 'Development', description: 'Front-end development with React, Next.js, and Tailwind.' },
          ],
        }),
        comp('lightbox-gallery', 'Work', {
          title: 'Selected Work', columns: 2,
          images: [
            { url: IMG.design1, caption: 'E-Commerce Redesign — Nike' },
            { url: IMG.design2, caption: 'Mobile App — FinTech Startup' },
            { url: IMG.design3, caption: 'Brand Identity — Abstract Co' },
            { url: IMG.design4, caption: 'Dashboard — SaaS Platform' },
          ],
        }),
        comp('logo-cloud', 'Clients', {
          title: 'Trusted By', logos: ['Google', 'Spotify', 'Airbnb', 'Netflix', 'Stripe', 'Uber'],
        }),
        comp('testimonials', 'Testimonials', {
          title: 'What Clients Say', variant: 'carousel',
          testimonials: [
            { name: 'Sarah Chen', role: 'VP Product, Spotify', text: 'Alex transformed our user experience. Conversion rates increased 40% after the redesign.', rating: 5, avatar: AVATAR.w1 },
            { name: 'David Kim', role: 'Founder, TechFlow', text: 'Incredible attention to detail and deep understanding of user psychology. A true partner.', rating: 5, avatar: AVATAR.m1 },
            { name: 'Maria Lopez', role: 'CMO, Airbnb', text: 'The brand identity Alex created perfectly captured our evolution as a company.', rating: 5, avatar: AVATAR.w2 },
          ],
        }),
        comp('parallax', 'Parallax', {
          imageUrl: IMG.design1,
          heading: 'Design is not just what it looks like.\nDesign is how it works.',
          subheading: '— Steve Jobs',
          height: 'small', overlayOpacity: 70,
        }),
        comp('cta-banner', 'CTA', {
          heading: 'Let\'s Create Something Amazing',
          subheading: 'Available for freelance projects and full-time opportunities.',
          ctaText: 'Get In Touch', ctaLink: '#contact',
        }),
        comp('newsletter', 'Newsletter', {
          title: 'Design Insights', subtitle: 'Monthly articles on design trends, tools, and creative process.',
          placeholder: 'Your email', buttonText: 'Subscribe',
        }),
        comp('floating-cta', 'Floating', {
          text: 'Hire Me →', link: '#contact',
          position: 'bottom-center', showAfterScroll: 500, animation: 'slide-up', pill: true,
        }),
        comp('scroll-to-top', 'Scroll', { position: 'bottom-right', offsetY: 90 }),
        foot(),
      ], true, 0),

      // ═══════════════════════════════════════════════════
      // WORK
      // ═══════════════════════════════════════════════════
      page('Work', 'work', [
        nav(),
        comp('hero', 'Work Hero', {
          heading: 'Selected Work', subheading: 'A curated collection of my best projects across branding, UI/UX, and development.',
          alignment: 'center', height: 'medium', backgroundImage: IMG.design3, overlayOpacity: 70,
        }),
        comp('lightbox-gallery', 'Projects', {
          title: 'Portfolio', columns: 2,
          images: [
            { url: IMG.design1, caption: 'Nike E-Commerce Redesign — Increased conversions 35%' },
            { url: IMG.design2, caption: 'FinTech Mobile App — 500K+ downloads' },
            { url: IMG.design3, caption: 'Abstract Brand Identity — Complete rebrand' },
            { url: IMG.design4, caption: 'Analytics Dashboard — Enterprise SaaS' },
          ],
        }),
        comp('animated-stats', 'Impact', {
          stats: [
            { value: '35', label: 'Avg. Conversion Lift', suffix: '%' },
            { value: '500', label: 'App Downloads', suffix: 'K+' },
            { value: '12', label: 'Design Awards' },
            { value: '98', label: 'Client Satisfaction', suffix: '%' },
          ],
          variant: 'cards', columns: 4, animationStyle: 'count',
        }),
        foot(),
      ], false, 1),

      // ═══════════════════════════════════════════════════
      // ABOUT
      // ═══════════════════════════════════════════════════
      page('About', 'about', [
        nav(),
        comp('hero', 'About', {
          heading: 'About Me', subheading: 'Designer, thinker, creator.',
          alignment: 'center', height: 'medium',
        }),
        comp('image-text', 'Bio', {
          title: 'My Story',
          description: 'I\'m a product designer based in San Francisco with over a decade of experience creating digital products for startups and Fortune 500 companies. I believe in simplicity, clarity, and crafting experiences that make people smile.<br/><br/>When I\'m not designing, you\'ll find me hiking, photographing architecture, or mentoring junior designers.',
          imageUrl: AVATAR.m4, imagePosition: 'right',
        }),
        comp('timeline', 'Career', {
          title: 'Career Timeline',
          items: [
            { date: '2014', title: 'Started Freelancing', description: 'Built my first portfolio and landed initial clients in branding.' },
            { date: '2016', title: 'Lead Designer at AKQA', description: 'Lead designer at a top creative agency in NYC.' },
            { date: '2018', title: 'Senior Designer at Google', description: 'Product designer on Google Maps and Material Design.' },
            { date: '2020', title: 'Design Lead at Stripe', description: 'Led the redesign of Stripe Dashboard.' },
            { date: '2022', title: 'Independent Studio', description: 'Launched Alex Design Studio, working with select clients worldwide.' },
          ],
        }),
        comp('progress', 'Skills', {
          title: 'My Skills',
          items: [
            { label: 'UI/UX Design', value: 95 },
            { label: 'Brand Identity', value: 90 },
            { label: 'Front-End Development', value: 80 },
            { label: 'Motion Design', value: 75 },
            { label: 'Design Systems', value: 92 },
          ],
        }),
        comp('features', 'Tools', {
          title: 'Tools & Stack', columns: 4,
          features: [
            { icon: 'Figma', title: 'Figma', description: 'Primary design tool' },
            { icon: 'Code', title: 'React / Next.js', description: 'Frontend development' },
            { icon: 'Palette', title: 'After Effects', description: 'Motion & animation' },
            { icon: 'Layers', title: 'Framer', description: 'Prototyping' },
          ],
        }),
        foot(),
      ], false, 2),

      // ═══════════════════════════════════════════════════
      // BLOG
      // ═══════════════════════════════════════════════════
      page('Blog', 'blog', [
        nav(),
        comp('hero', 'Blog Hero', {
          heading: 'Design Blog', subheading: 'Thoughts on design, creativity, and building great products.',
          alignment: 'center', height: 'small',
        }),
        comp('blog-grid', 'Posts', {
          title: 'Latest Articles', columns: 3,
          posts: [
            { title: 'The Art of Design Systems', excerpt: 'How to build scalable, consistent design systems that teams actually use.', category: 'Design Systems', date: 'Feb 2026', author: 'Alex' },
            { title: 'Why Dark Mode is More Than Aesthetics', excerpt: 'The science behind dark mode and its impact on accessibility and engagement.', category: 'UI/UX', date: 'Jan 2026', author: 'Alex' },
            { title: 'From Designer to Creative Director', excerpt: 'Lessons learned transitioning from hands-on design to creative leadership.', category: 'Career', date: 'Dec 2025', author: 'Alex' },
            { title: 'Motion Design in Modern Interfaces', excerpt: 'How micro-interactions and transitions create delightful user experiences.', category: 'Motion', date: 'Nov 2025', author: 'Alex' },
            { title: 'Building a Personal Brand as a Designer', excerpt: 'Strategies for standing out in a crowded creative market.', category: 'Branding', date: 'Oct 2025', author: 'Alex' },
            { title: 'The Future of AI in Design', excerpt: 'How AI tools are changing creative workflows — and what designers should learn.', category: 'AI', date: 'Sep 2025', author: 'Alex' },
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
          heading: 'Let\'s Work Together', subheading: 'Have a project in mind? Let\'s talk about it.',
          alignment: 'center', height: 'small',
        }),
        comp('contact-form', 'Form', {
          title: 'Get In Touch', subtitle: 'I typically respond within 24 hours.',
          fields: ['name', 'email', 'message'], submitText: 'Send Message', variant: 'card',
        }),
        comp('icon-text', 'Info', {
          items: [
            { icon: 'Mail', title: 'Email', description: 'hello@alexdesign.co' },
            { icon: 'MapPin', title: 'Based In', description: 'San Francisco, CA' },
            { icon: 'Clock', title: 'Availability', description: 'Open to new projects' },
          ],
          layout: 'horizontal',
        }),
        comp('social-links', 'Social', {
          title: 'Find Me Online',
          links: [{ platform: 'github', url: '#' }, { platform: 'linkedin', url: '#' }, { platform: 'dribbble', url: '#' }, { platform: 'twitter', url: '#' }],
        }),
        foot(),
      ], false, 4),
    ];
  },
};

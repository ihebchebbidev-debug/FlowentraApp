import { PaletteItem } from '../../types';

const defaultLinks = [
  { label: 'Home', href: '#', icon: '' },
  { label: 'About', href: '#about', icon: '' },
  { label: 'Services', href: '#services', icon: '', children: [
    { label: 'Web Design', href: '#', icon: 'Palette', description: 'Beautiful modern websites' },
    { label: 'Development', href: '#', icon: 'Code', description: 'Custom web applications' },
    { label: 'Marketing', href: '#', icon: 'TrendingUp', description: 'Grow your audience' },
  ]},
  { label: 'Contact', href: '#contact', icon: '' },
];

const defaultSocialLinks = [{ platform: 'twitter', url: '#' }, { platform: 'instagram', url: '#' }];

export const NAVIGATION_PALETTE: PaletteItem[] = [
  {
    type: 'navbar', label: 'Navbar', icon: 'Menu', category: 'navigation',
    description: 'Nav bar with dropdowns & mobile',
    defaultProps: {
      logo: 'MyBrand', variant: 'default',
      links: defaultLinks,
      sticky: false, transparent: false, showSearch: false,
      socialLinks: defaultSocialLinks,
      ctaText: 'Get Started', ctaLink: '#',
    },
  },
  {
    type: 'navbar', label: 'Split Navbar', icon: 'SplitSquareHorizontal', category: 'navigation',
    description: 'Logo left, links center, CTA right',
    defaultProps: {
      logo: 'MyBrand', variant: 'split',
      links: defaultLinks,
      sticky: false, transparent: false, showSearch: false,
      socialLinks: defaultSocialLinks,
      ctaText: 'Get Started', ctaLink: '#',
    },
  },
  {
    type: 'navbar', label: 'Stacked Navbar', icon: 'Rows3', category: 'navigation',
    description: 'Top bar + main navigation',
    defaultProps: {
      logo: 'MyBrand', variant: 'stacked',
      links: defaultLinks,
      sticky: false, transparent: false, showSearch: false,
      socialLinks: defaultSocialLinks,
      ctaText: 'Get Started', ctaLink: '#',
      topBarText: '🎉 Free shipping on orders over $50',
      topBarLinks: [{ label: 'Support', href: '#' }, { label: 'Track Order', href: '#' }],
    },
  },
  {
    type: 'footer', label: 'Footer', icon: 'PanelBottom', category: 'navigation',
    description: 'Simple footer with links & social',
    defaultProps: { companyName: 'MyCompany', variant: 'default', links: [{ label: 'Privacy', href: '#' }, { label: 'Terms', href: '#' }, { label: 'Contact', href: '#' }], socialLinks: [{ platform: 'facebook', url: '#' }, { platform: 'twitter', url: '#' }, { platform: 'instagram', url: '#' }], showSocial: true, copyright: '' },
  },
  {
    type: 'footer', label: 'Column Footer', icon: 'Columns3', category: 'navigation',
    description: 'Multi-column with link groups',
    defaultProps: {
      companyName: 'MyCompany', variant: 'columns', description: 'Building great experiences since 2020.',
      links: [{ label: 'Home', href: '#' }, { label: 'About', href: '#' }],
      linkGroups: [
        { title: 'Products', links: [{ label: 'Features', href: '#' }, { label: 'Pricing', href: '#' }, { label: 'Integrations', href: '#' }] },
        { title: 'Company', links: [{ label: 'About Us', href: '#' }, { label: 'Careers', href: '#' }, { label: 'Blog', href: '#' }] },
      ],
      socialLinks: [{ platform: 'facebook', url: '#' }, { platform: 'twitter', url: '#' }, { platform: 'linkedin', url: '#' }, { platform: 'google', url: '#' }],
      showSocial: true, phone: '+1 (555) 123-4567', email: 'hello@company.com', address: '123 Main St, City',
    },
  },
  {
    type: 'footer', label: 'Centered Footer', icon: 'AlignCenter', category: 'navigation',
    description: 'Centered with large social icons',
    defaultProps: {
      companyName: 'MyCompany', variant: 'centered', description: 'Making the web better, one site at a time.',
      links: [{ label: 'About', href: '#' }, { label: 'Services', href: '#' }, { label: 'Blog', href: '#' }, { label: 'Contact', href: '#' }],
      socialLinks: [{ platform: 'facebook', url: '#' }, { platform: 'instagram', url: '#' }, { platform: 'twitter', url: '#' }, { platform: 'youtube', url: '#' }, { platform: 'google', url: '#' }],
      showSocial: true,
    },
  },
  {
    type: 'footer', label: 'Branded Footer', icon: 'Award', category: 'navigation',
    description: 'Large logo with contact details',
    defaultProps: {
      companyName: 'MyCompany', variant: 'branded', description: 'Your trusted partner for digital solutions.',
      links: [{ label: 'Privacy Policy', href: '#' }, { label: 'Terms of Service', href: '#' }, { label: 'Sitemap', href: '#' }],
      socialLinks: [{ platform: 'linkedin', url: '#' }, { platform: 'twitter', url: '#' }, { platform: 'google-business', url: '#' }],
      showSocial: true, phone: '+1 (555) 987-6543', email: 'info@mybrand.com',
    },
  },
  {
    type: 'footer', label: 'Minimal Footer', icon: 'Minus', category: 'navigation',
    description: 'Compact single-line footer',
    defaultProps: {
      companyName: 'MyCompany', variant: 'minimal',
      links: [{ label: 'Privacy', href: '#' }, { label: 'Terms', href: '#' }],
      socialLinks: [{ platform: 'twitter', url: '#' }, { platform: 'github', url: '#' }],
      showSocial: true,
    },
  },
  {
    type: 'breadcrumb', label: 'Breadcrumb', icon: 'ChevronRight', category: 'navigation',
    description: 'Page hierarchy navigation',
    defaultProps: { items: [{ label: 'Home', href: '/' }, { label: 'Services', href: '/services' }, { label: 'Current Page' }] },
  },
  {
    type: 'pagination', label: 'Pagination', icon: 'MoreHorizontal', category: 'navigation',
    description: 'Page navigation controls',
    defaultProps: { totalPages: 5, currentPage: 1 },
  },
  {
    type: 'mega-menu', label: 'Mega Menu', icon: 'LayoutList', category: 'navigation',
    description: 'Expandable icon-rich dropdowns',
    defaultProps: {
      logo: 'MyBrand', variant: 'default', showSearch: false,
      menus: [
        { label: 'Products', icon: 'Package', items: [
          { title: 'Analytics', description: 'Track performance metrics', href: '#', icon: 'BarChart3' },
          { title: 'Automation', description: 'Streamline workflows', href: '#', icon: 'Zap' },
          { title: 'Security', description: 'Protect your data', href: '#', icon: 'Shield' },
        ]},
        { label: 'Solutions', icon: 'Lightbulb', items: [
          { title: 'Enterprise', description: 'For large teams', href: '#', icon: 'Building' },
          { title: 'Startups', description: 'Scale fast', href: '#', icon: 'Rocket' },
          { title: 'Agencies', description: 'Client management', href: '#', icon: 'Users' },
        ]},
        { label: 'Resources', icon: 'BookOpen', items: [
          { title: 'Documentation', description: 'Learn the platform', href: '#', icon: 'FileText' },
          { title: 'Blog', description: 'Latest updates', href: '#', icon: 'Newspaper' },
        ]},
      ],
      ctaText: 'Get Started', ctaLink: '#',
    },
  },
  {
    type: 'language-switcher', label: 'Language Switcher', icon: 'Globe', category: 'navigation',
    description: 'Switch between languages',
    defaultProps: { languages: [{ code: 'en', label: 'English', direction: 'ltr' }, { code: 'fr', label: 'Français', direction: 'ltr' }, { code: 'ar', label: 'العربية', direction: 'rtl' }], currentLanguage: 'en', variant: 'dropdown', alignment: 'right', showFlags: true, compact: false },
  },
];

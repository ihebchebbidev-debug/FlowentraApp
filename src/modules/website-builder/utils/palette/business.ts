import { PaletteItem } from '../../types';

export const BUSINESS_PALETTE: PaletteItem[] = [
  {
    type: 'about', label: 'About Section', icon: 'Info', category: 'business',
    description: 'Company or personal about',
    defaultProps: { title: 'About Us', description: 'We are a passionate team dedicated to building great products.', imageUrl: '' },
  },
  {
    type: 'features', label: 'Features Grid', icon: 'Grid3X3', category: 'business',
    description: 'Icon-driven feature cards',
    defaultProps: { title: 'Our Features', features: [{ icon: 'Zap', title: 'Fast', description: 'Lightning-fast performance' }, { icon: 'Lock', title: 'Secure', description: 'Enterprise-grade security' }, { icon: 'Smartphone', title: 'Responsive', description: 'Works on all devices' }] },
  },
  {
    type: 'service-card', label: 'Service Cards (Grid)', icon: 'Briefcase', category: 'business',
    description: 'Card grid with icons & pricing',
    defaultProps: {
      title: 'Our Services', subtitle: 'Everything you need to grow your business',
      variant: 'grid', columns: 3, showPricing: true, showLinks: true,
      services: [
        { icon: 'Palette', title: 'UI/UX Design', description: 'Beautiful interfaces that convert visitors into customers.', price: 'From $499', linkText: 'Learn More', linkUrl: '#' },
        { icon: 'Code', title: 'Web Development', description: 'Fast, scalable web applications built with modern tech.', price: 'From $999', linkText: 'Learn More', linkUrl: '#' },
        { icon: 'TrendingUp', title: 'Digital Marketing', description: 'Data-driven campaigns that deliver real results.', price: 'From $299', linkText: 'Learn More', linkUrl: '#' },
      ],
    },
  },
  {
    type: 'service-card', label: 'Services (Minimal)', icon: 'LayoutGrid', category: 'business',
    description: 'Clean centered, no borders',
    defaultProps: {
      title: 'What We Offer', subtitle: 'Simple solutions for complex problems',
      variant: 'minimal', columns: 3, showPricing: false,
      services: [
        { icon: 'Shield', title: 'Security Audit', description: 'Comprehensive vulnerability assessment and penetration testing for your systems.' },
        { icon: 'Cloud', title: 'Cloud Migration', description: 'Seamless transition of your infrastructure to AWS, Azure, or GCP.' },
        { icon: 'Cpu', title: 'AI Integration', description: 'Implement machine learning models tailored to your business needs.' },
        { icon: 'Database', title: 'Data Engineering', description: 'Build robust data pipelines and warehousing solutions.' },
        { icon: 'Globe', title: 'API Development', description: 'RESTful and GraphQL APIs designed for scale and reliability.' },
        { icon: 'Headphones', title: '24/7 Support', description: 'Round-the-clock expert assistance for all your technical needs.' },
      ],
    },
  },
  {
    type: 'service-card', label: 'Services (Bordered)', icon: 'LayoutList', category: 'business',
    description: 'Accent border with hover lift',
    defaultProps: {
      title: 'Our Expertise', subtitle: 'Trusted by startups and enterprises alike',
      variant: 'bordered', columns: 2, showPricing: true,
      services: [
        { icon: 'Figma', title: 'Brand Identity', description: 'Logo design, color palettes, and visual guidelines that tell your story.', price: '$1,500+' },
        { icon: 'Smartphone', title: 'Mobile Apps', description: 'Native iOS and Android apps with beautiful, intuitive interfaces.', price: '$5,000+' },
        { icon: 'BarChart3', title: 'Analytics Setup', description: 'Custom dashboards and tracking for data-driven decisions.', price: '$800+' },
        { icon: 'Users', title: 'Team Training', description: 'Workshops on design thinking, agile methods, and modern tooling.', price: '$2,000+' },
      ],
    },
  },
  {
    type: 'service-card', label: 'Services (Icon Left)', icon: 'AlignLeft', category: 'business',
    description: 'Horizontal with icon on left',
    defaultProps: {
      title: 'How We Help', subtitle: 'End-to-end solutions from concept to launch',
      variant: 'icon-left', columns: 1, showPricing: true, showLinks: true,
      services: [
        { icon: 'Lightbulb', title: 'Strategy & Consulting', description: 'We help you define your digital strategy, identify opportunities, and create a roadmap for success.', price: 'From $150/hr', linkText: 'Book a Call', linkUrl: '#' },
        { icon: 'PenTool', title: 'Product Design', description: 'From wireframes to pixel-perfect mockups, we design products that users love and businesses trust.', price: 'From $3,000', linkText: 'See Portfolio', linkUrl: '#' },
        { icon: 'Rocket', title: 'Launch & Growth', description: 'We handle deployment, monitoring, optimization, and scaling so you can focus on your business.', price: 'From $500/mo', linkText: 'Get Started', linkUrl: '#' },
      ],
    },
  },
  {
    type: 'service-card', label: 'Services (Numbered)', icon: 'ListOrdered', category: 'business',
    description: 'Step-numbered process layout',
    defaultProps: {
      title: 'Our Process', subtitle: 'A proven 4-step approach to every project',
      variant: 'numbered', columns: 4, showPricing: false,
      services: [
        { icon: 'Search', title: 'Discovery', description: 'We analyze your goals, market, and competitors.' },
        { icon: 'PenTool', title: 'Design', description: 'Wireframes and prototypes that bring ideas to life.' },
        { icon: 'Code', title: 'Development', description: 'Clean, tested code built for performance.' },
        { icon: 'Rocket', title: 'Launch', description: 'Deployment, monitoring, and ongoing support.' },
      ],
    },
  },
  {
    type: 'service-card', label: 'Services (Image Cards)', icon: 'Image', category: 'business',
    description: 'Cards with image & icon badge',
    defaultProps: {
      title: 'Premium Services', subtitle: 'Tailored solutions for ambitious brands',
      variant: 'image', columns: 3, showPricing: true, showLinks: true,
      services: [
        { icon: 'Camera', title: 'Photography', description: 'Professional product and lifestyle photography for your brand.', price: 'From $299', linkText: 'View Gallery', linkUrl: '#' },
        { icon: 'Video', title: 'Video Production', description: 'Cinematic brand videos, ads, and social media content.', price: 'From $999', linkText: 'Watch Reel', linkUrl: '#' },
        { icon: 'Mic', title: 'Podcast Studio', description: 'Full-service podcast recording, editing, and distribution.', price: 'From $199', linkText: 'Start Podcast', linkUrl: '#' },
      ],
    },
  },
  {
    type: 'pricing', label: 'Pricing Table', icon: 'DollarSign', category: 'business',
    description: 'Tiered plans with features',
    defaultProps: { title: 'Pricing Plans', variant: 'classic', plans: [{ name: 'Starter', price: '$9/mo', features: ['Feature 1', 'Feature 2'], highlighted: false }, { name: 'Pro', price: '$29/mo', features: ['Feature 1', 'Feature 2', 'Feature 3'], highlighted: true }, { name: 'Enterprise', price: '$99/mo', features: ['All features', 'Priority support'], highlighted: false }] },
  },
  {
    type: 'comparison-table', label: 'Comparison Table', icon: 'Table2', category: 'business',
    description: 'Side-by-side feature comparison',
    defaultProps: { title: 'Compare Plans', headers: ['Basic', 'Pro', 'Enterprise'], rows: [{ feature: 'Users', values: ['1', '10', 'Unlimited'] }, { feature: 'Storage', values: ['5GB', '50GB', '500GB'] }, { feature: 'API Access', values: ['false', 'true', 'true'] }, { feature: 'Priority Support', values: ['false', 'false', 'true'] }] },
  },
  {
    type: 'testimonials', label: 'Testimonials', icon: 'MessageSquare', category: 'business',
    description: 'Customer quotes with avatars',
    defaultProps: { title: 'What Our Customers Say', variant: 'grid', testimonials: [{ name: 'John Doe', role: 'CEO', text: 'Amazing product!', avatar: '', rating: 5 }, { name: 'Jane Smith', role: 'CTO', text: 'Transformed our workflow.', avatar: '', rating: 5 }] },
  },
  {
    type: 'reviews', label: 'Reviews Grid', icon: 'Star', category: 'business',
    description: 'Star-rated reviews in grid',
    defaultProps: {
      title: 'Customer Reviews', subtitle: 'See what people are saying', variant: 'grid', columns: 2,
      showAverage: true, showVerified: true, showHelpful: true, cardStyle: 'bordered',
      reviews: [
        { name: 'Alex M.', rating: 5, text: 'Absolutely love this product! Best purchase ever.', date: 'Jan 2025', verified: true, helpful: 12 },
        { name: 'Sarah K.', rating: 4, text: 'Great quality and fast shipping. Would recommend.', date: 'Feb 2025', verified: true, helpful: 8 },
        { name: 'David R.', rating: 5, text: 'Exceeded my expectations in every way.', date: 'Mar 2025', verified: true, helpful: 5 },
        { name: 'Emily J.', rating: 5, text: 'Customer support was incredibly helpful.', date: 'Apr 2025', verified: false, helpful: 3 },
      ],
    },
  },
  {
    type: 'reviews', label: 'Reviews Carousel', icon: 'GalleryHorizontal', category: 'business',
    description: 'Swipeable single-review slider',
    defaultProps: {
      title: 'What People Say', variant: 'carousel', showAverage: true, showVerified: true,
      reviews: [
        { name: 'Alex M.', rating: 5, text: 'Absolutely love this product!', date: 'Jan 2025', verified: true, title: 'Best Purchase Ever' },
        { name: 'Sarah K.', rating: 4, text: 'Great quality and fast shipping.', date: 'Feb 2025', verified: true },
        { name: 'David R.', rating: 5, text: 'Exceeded expectations.', date: 'Mar 2025', verified: true },
      ],
    },
  },
  {
    type: 'reviews', label: 'Reviews List', icon: 'List', category: 'business',
    description: 'Stacked reviews with summary',
    defaultProps: {
      title: 'All Reviews', variant: 'list', showAverage: true, showVerified: true, showHelpful: true,
      reviews: [
        { name: 'Alex M.', rating: 5, text: 'Outstanding service and quality product.', date: 'Jan 2025', verified: true, helpful: 15, title: 'Highly Recommend!' },
        { name: 'Sarah K.', rating: 4, text: 'Very good overall. Minor improvement suggestions.', date: 'Feb 2025', verified: true, helpful: 7 },
      ],
    },
  },
  {
    type: 'reviews', label: 'Featured Review', icon: 'Award', category: 'business',
    description: 'Highlighted top review',
    defaultProps: {
      title: 'Top Reviews', variant: 'featured', showAverage: true, showVerified: true,
      reviews: [
        { name: 'Alex M.', rating: 5, text: 'This is hands down the best product I have ever used. The quality is exceptional and the customer support team goes above and beyond.', date: 'Jan 2025', verified: true, helpful: 42, title: 'Life-Changing Product!' },
        { name: 'Sarah K.', rating: 5, text: 'Fast shipping, great quality.', date: 'Feb 2025', verified: true },
        { name: 'David R.', rating: 4, text: 'Very satisfied with my purchase.', date: 'Mar 2025', verified: true },
      ],
    },
  },
  {
    type: 'trust-badges', label: 'Trust Badges', icon: 'Shield', category: 'business',
    description: 'Credibility indicators row',
    defaultProps: { title: 'Why Choose Us', badges: [{ icon: 'Lock', label: 'Secure Checkout' }, { icon: 'Truck', label: 'Free Shipping' }, { icon: 'RotateCcw', label: '30-Day Returns' }, { icon: 'Star', label: '5-Star Rating' }] },
  },
  {
    type: 'stats', label: 'Stats Counter', icon: 'BarChart3', category: 'business',
    description: 'Animated number counters',
    defaultProps: { stats: [{ value: '10K+', label: 'Customers' }, { value: '99%', label: 'Uptime' }, { value: '50+', label: 'Countries' }, { value: '24/7', label: 'Support' }] },
  },
  {
    type: 'cta-banner', label: 'CTA Banner', icon: 'Megaphone', category: 'business',
    description: 'Call-to-action strip',
    defaultProps: { heading: 'Ready to Get Started?', subheading: 'Join thousands of happy customers today.', ctaText: 'Start Free Trial', ctaLink: '#' },
  },
  {
    type: 'logo-cloud', label: 'Logo Cloud', icon: 'Building', category: 'business',
    description: 'Trusted-by company logos',
    defaultProps: { title: 'Trusted by leading companies', logos: [] },
  },
  {
    type: 'team-grid', label: 'Team Grid', icon: 'Users', category: 'business',
    description: 'Team member cards',
    defaultProps: { title: 'Meet Our Team', members: [{ name: 'Alice Johnson', role: 'CEO', avatar: '', bio: '' }, { name: 'Bob Smith', role: 'CTO', avatar: '', bio: '' }, { name: 'Carol Williams', role: 'Designer', avatar: '', bio: '' }] },
  },
  {
    type: 'banner', label: 'Promo Banner', icon: 'Flag', category: 'business',
    description: 'Promotional strip with link',
    defaultProps: { text: '🎉 Special offer: Get 20% off this week!', linkText: 'Learn More', linkUrl: '#', variant: 'promo' },
  },
  {
    type: 'announcement-bar', label: 'Announcement Bar', icon: 'Bell', category: 'business',
    description: 'Dismissible top notice',
    defaultProps: { text: '🔥 New product launch — Order now for early access!', linkText: 'Shop Now', linkUrl: '#', dismissible: true, variant: 'primary' },
  },
  {
    type: 'marquee', label: 'Marquee Ticker', icon: 'MoveHorizontal', category: 'business',
    description: 'Scrolling text animation',
    defaultProps: { text: '🔥 Limited time offer — Get 50% off all plans! Use code SAVE50 at checkout 🔥', speed: 30 },
  },
  {
    type: 'countdown', label: 'Countdown Timer', icon: 'Timer', category: 'business',
    description: 'Countdown to target date',
    defaultProps: { title: 'Launching Soon', targetDate: new Date(Date.now() + 30 * 86400000).toISOString() },
  },
  {
    type: 'popup', label: 'Popup / Modal', icon: 'Layers', category: 'business',
    description: 'Overlay modal with CTA',
    defaultProps: { title: 'Special Offer!', text: 'Sign up now and get 20% off your first order.', ctaText: 'Claim Offer', ctaLink: '#', imageUrl: '' },
  },
];

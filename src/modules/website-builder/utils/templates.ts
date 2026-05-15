import { BuilderComponent } from '../types';
import { generateId } from './storage';

export interface PageTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  components: () => BuilderComponent[];
}

function comp(type: BuilderComponent['type'], label: string, props: Record<string, any>): BuilderComponent {
  return { id: generateId(), type, label, props, styles: {} };
}

export const PAGE_TEMPLATES: PageTemplate[] = [
  { id: 'blank', name: 'Blank Page', description: 'Start from scratch', icon: 'File', components: () => [] },
  {
    id: 'landing', name: 'Landing Page', description: 'Hero, features, testimonials, CTA', icon: 'Rocket',
    components: () => [
      comp('navbar', 'Navbar', { logo: 'MyBrand', links: [{ label: 'Home', href: '#' }, { label: 'Features', href: '#features' }, { label: 'Pricing', href: '#pricing' }, { label: 'Contact', href: '#contact' }], sticky: true }),
      comp('hero', 'Hero', { heading: 'Build Something Amazing', subheading: 'The fastest way to launch your next project with confidence.', ctaText: 'Get Started Free', ctaLink: '#', alignment: 'center', height: 'large' }),
      comp('logo-cloud', 'Trusted By', { title: 'Trusted by 500+ companies worldwide', logos: [] }),
      comp('features', 'Features', { title: 'Why Choose Us', features: [{ icon: '⚡', title: 'Lightning Fast', description: 'Optimized for speed' }, { icon: '🔒', title: 'Secure', description: 'Enterprise-grade security' }, { icon: '📱', title: 'Responsive', description: 'Works on every device' }] }),
      comp('stats', 'Stats', { stats: [{ value: '10K+', label: 'Users' }, { value: '99.9%', label: 'Uptime' }, { value: '50+', label: 'Integrations' }, { value: '24/7', label: 'Support' }] }),
      comp('testimonials', 'Testimonials', { title: 'What Our Customers Say', testimonials: [{ name: 'Sarah Johnson', role: 'CEO, TechCorp', text: 'This product transformed how we work!', rating: 5 }, { name: 'Mike Chen', role: 'Founder', text: 'Best investment we made this year.', rating: 5 }] }),
      comp('cta-banner', 'CTA', { heading: 'Ready to Get Started?', subheading: 'Join thousands of happy customers.', ctaText: 'Start Free Trial', ctaLink: '#' }),
      comp('footer', 'Footer', { companyName: 'MyBrand', links: [{ label: 'Privacy', href: '#' }, { label: 'Terms', href: '#' }] }),
    ],
  },
  {
    id: 'saas', name: 'SaaS Product', description: 'Product page with features & pricing', icon: 'Zap',
    components: () => [
      comp('announcement-bar', 'Promo', { text: '🚀 New: AI-powered features now available!', linkText: 'Learn More', linkUrl: '#', variant: 'primary' }),
      comp('mega-menu', 'Mega Menu', { logo: 'ProductName', menus: [{ label: 'Products', items: [{ title: 'Analytics', description: 'Track performance', href: '#', icon: '📊' }, { title: 'Automation', description: 'Save time', href: '#', icon: '⚡' }] }, { label: 'Solutions', items: [{ title: 'Enterprise', description: 'For large teams', href: '#', icon: '🏢' }, { title: 'Startups', description: 'Scale fast', href: '#', icon: '🚀' }] }], ctaText: 'Try Free', ctaLink: '#' }),
      comp('hero', 'Hero', { heading: 'The All-in-One Platform', subheading: 'Streamline your workflow with powerful tools built for modern teams.', ctaText: 'Start Free Trial', ctaLink: '#', alignment: 'center', height: 'large' }),
      comp('logo-cloud', 'Brands', { title: 'Trusted by 1000+ teams', logos: [] }),
      comp('features', 'Features', { title: 'Powerful Features', features: [{ icon: '🚀', title: 'Blazing Fast', description: 'Sub-second response' }, { icon: '🔄', title: 'Auto Sync', description: 'Real-time collaboration' }, { icon: '📊', title: 'Analytics', description: 'Deep insights' }] }),
      comp('comparison-table', 'Compare', { title: 'Compare Plans', headers: ['Basic', 'Pro', 'Enterprise'], rows: [{ feature: 'Users', values: ['5', '50', 'Unlimited'] }, { feature: 'Storage', values: ['5GB', '100GB', '1TB'] }, { feature: 'API Access', values: ['false', 'true', 'true'] }] }),
      comp('pricing', 'Pricing', { title: 'Simple Pricing', plans: [{ name: 'Free', price: '$0/mo', features: ['5 Users', '1GB'], highlighted: false }, { name: 'Pro', price: '$49/mo', features: ['50 Users', '100GB', 'API'], highlighted: true }, { name: 'Enterprise', price: 'Custom', features: ['Unlimited', 'SSO', 'SLA'], highlighted: false }] }),
      comp('reviews', 'Reviews', { title: 'Loved by Teams', reviews: [{ name: 'Alex T.', rating: 5, text: 'Reduced our deploy time by 80%.', date: 'Jan 2026' }, { name: 'Maria L.', rating: 5, text: 'Best tool we adopted this year.', date: 'Feb 2026' }] }),
      comp('faq', 'FAQ', { title: 'FAQ', items: [{ question: 'Free trial?', answer: 'Yes, 14-day free trial.' }, { question: 'Cancel anytime?', answer: 'Absolutely.' }] }),
      comp('cta-banner', 'CTA', { heading: 'Start Building Today', subheading: 'No credit card required.', ctaText: 'Get Started Free', ctaLink: '#' }),
      comp('footer', 'Footer', { companyName: 'ProductName', links: [{ label: 'Docs', href: '#' }, { label: 'Status', href: '#' }, { label: 'Privacy', href: '#' }] }),
    ],
  },
  {
    id: 'portfolio', name: 'Portfolio', description: 'Showcase work with galleries', icon: 'Image',
    components: () => [
      comp('navbar', 'Navbar', { logo: 'MyStudio', links: [{ label: 'Work', href: '#' }, { label: 'About', href: '#about' }, { label: 'Contact', href: '#contact' }], sticky: true }),
      comp('hero', 'Hero', { heading: 'Creative Portfolio', subheading: 'Crafting digital experiences that inspire.', ctaText: 'View Work', ctaLink: '#work', alignment: 'center', height: 'large' }),
      comp('lightbox-gallery', 'Gallery', { title: 'Selected Work', images: [], columns: 3 }),
      comp('user-profile', 'About Me', { name: 'Jane Designer', bio: 'Award-winning designer with 10+ years of experience creating beautiful digital products.', stats: [{ label: 'Projects', value: '200+' }, { label: 'Clients', value: '50+' }, { label: 'Awards', value: '15' }], socialLinks: [{ platform: 'Dribbble', url: '#' }, { platform: 'Behance', url: '#' }] }),
      comp('testimonials', 'Reviews', { title: 'Client Reviews', testimonials: [{ name: 'Emily R.', role: 'Marketing Director', text: 'Exceptional work!', rating: 5 }] }),
      comp('contact-form', 'Hire Me', { title: 'Start a Project', subtitle: "Let's create something amazing.", fields: ['name', 'email', 'message'], submitText: 'Send Inquiry' }),
      comp('footer', 'Footer', { companyName: 'MyStudio', links: [{ label: 'Privacy', href: '#' }] }),
    ],
  },
  {
    id: 'restaurant', name: 'Restaurant', description: 'Menu, gallery, reservations', icon: 'UtensilsCrossed',
    components: () => [
      comp('navbar', 'Navbar', { logo: 'La Cuisine', links: [{ label: 'Menu', href: '#' }, { label: 'Gallery', href: '#gallery' }, { label: 'Reserve', href: '#reserve' }] }),
      comp('hero', 'Hero', { heading: 'Fine Dining Experience', subheading: 'Exquisite flavors, unforgettable moments.', ctaText: 'Book a Table', ctaLink: '#reserve', alignment: 'center', height: 'large' }),
      comp('features', 'Highlights', { title: 'Why Dine With Us', features: [{ icon: '🍷', title: 'Fine Wines', description: 'Curated collection' }, { icon: '👨‍🍳', title: 'Expert Chefs', description: 'Award-winning team' }, { icon: '🌿', title: 'Farm Fresh', description: 'Local ingredients' }] }),
      comp('lightbox-gallery', 'Gallery', { title: 'Our Ambiance', images: [], columns: 3 }),
      comp('reviews', 'Reviews', { title: 'Guest Reviews', reviews: [{ name: 'James W.', rating: 5, text: 'An extraordinary dining experience.', date: 'Dec 2025' }] }),
      comp('map', 'Location', { address: '123 Main St, New York, NY', height: 300 }),
      comp('contact-form', 'Reservation', { title: 'Make a Reservation', fields: ['name', 'email', 'phone', 'message'], submitText: 'Reserve Now' }),
      comp('footer', 'Footer', { companyName: 'La Cuisine', links: [{ label: 'Menu', href: '#' }] }),
    ],
  },
  {
    id: 'ecommerce', name: 'E-Commerce Store', description: 'Products, cart, and checkout', icon: 'ShoppingBag',
    components: () => [
      comp('announcement-bar', 'Promo', { text: '🛍️ Free shipping on orders over $50!', variant: 'accent', dismissible: true }),
      comp('navbar', 'Navbar', { logo: 'ShopName', links: [{ label: 'Products', href: '#products' }, { label: 'New', href: '#' }, { label: 'Sale', href: '#' }], sticky: true }),
      comp('hero', 'Hero', { heading: 'New Collection', subheading: 'Discover the latest trends this season.', ctaText: 'Shop Now', ctaLink: '#products', alignment: 'center', height: 'large' }),
      comp('product-card', 'Products', { title: 'Featured Products', columns: 3, products: [{ name: 'Premium Headphones', price: '$149', oldPrice: '$199', badge: 'Sale', description: 'Wireless noise-cancelling' }, { name: 'Smart Watch', price: '$299', badge: 'New', description: 'Health tracking' }, { name: 'Laptop Stand', price: '$79', description: 'Ergonomic aluminum' }] }),
      comp('trust-badges', 'Trust', { title: 'Why Shop With Us', badges: [{ icon: '🔒', label: 'Secure Checkout' }, { icon: '🚚', label: 'Free Shipping' }, { icon: '↩️', label: '30-Day Returns' }, { icon: '⭐', label: '5-Star Rating' }] }),
      comp('reviews', 'Reviews', { title: 'Customer Reviews', reviews: [{ name: 'Alex K.', rating: 5, text: 'Best purchase ever!', date: 'Jan 2026' }, { name: 'Taylor M.', rating: 4, text: 'Great quality.', date: 'Feb 2026' }] }),
      comp('newsletter', 'Newsletter', { title: 'Join Our Mailing List', subtitle: 'Exclusive deals and early access.', buttonText: 'Sign Up' }),
      comp('footer', 'Footer', { companyName: 'ShopName', links: [{ label: 'Shipping', href: '#' }, { label: 'Returns', href: '#' }, { label: 'Privacy', href: '#' }] }),
    ],
  },
  {
    id: 'product-detail', name: 'Product Detail', description: 'Single product with variants', icon: 'Package',
    components: () => [
      comp('navbar', 'Navbar', { logo: 'ShopName', links: [{ label: 'Products', href: '#' }, { label: 'Cart', href: '#cart' }], sticky: true }),
      comp('breadcrumb', 'Breadcrumb', { items: [{ label: 'Home', href: '/' }, { label: 'Products', href: '/products' }, { label: 'Premium Headphones' }] }),
      comp('product-detail', 'Product', { name: 'Premium Wireless Headphones', price: '$149.99', oldPrice: '$199.99', description: 'Crystal-clear audio with active noise cancellation, 30-hour battery, and ultra-comfortable ear cushions.', images: [], badge: 'Best Seller', variants: [{ label: 'Color', options: ['Black', 'White', 'Navy'] }], features: ['Active Noise Cancellation', '30-hour battery', 'Bluetooth 5.3', 'Foldable design'], inStock: true }),
      comp('tabs', 'Details', { tabs: [{ label: 'Description', content: '<p>Full product description with specifications.</p>' }, { label: 'Reviews', content: '<p>Customer reviews and ratings.</p>' }, { label: 'Shipping', content: '<p>Free 2-day shipping on all orders.</p>' }] }),
      comp('product-card', 'Related', { title: 'You May Also Like', columns: 3, products: [{ name: 'Earbuds Pro', price: '$89', description: 'True wireless' }, { name: 'Speaker', price: '$199', description: 'Portable Bluetooth' }, { name: 'Cable', price: '$19', description: 'USB-C charging' }] }),
      comp('footer', 'Footer', { companyName: 'ShopName', links: [{ label: 'Help', href: '#' }, { label: 'Privacy', href: '#' }] }),
    ],
  },
  {
    id: 'blog', name: 'Blog', description: 'Articles with categories & tags', icon: 'BookOpen',
    components: () => [
      comp('navbar', 'Navbar', { logo: 'MyBlog', links: [{ label: 'Home', href: '#' }, { label: 'Blog', href: '#' }, { label: 'About', href: '#' }] }),
      comp('hero', 'Header', { heading: 'Our Blog', subheading: 'Insights, tutorials, and updates.', ctaText: '', ctaLink: '', alignment: 'center', height: 'small' }),
      comp('search-bar', 'Search', { placeholder: 'Search articles...', buttonText: 'Search' }),
      comp('blog-grid', 'Posts', { title: 'Latest Articles', columns: 3, posts: [{ title: 'Getting Started with Web Design', excerpt: 'Learn the fundamentals.', category: 'Design', date: 'Jan 2026', author: 'John D.' }, { title: 'Marketing Tips', excerpt: 'Boost your business.', category: 'Marketing', date: 'Feb 2026', author: 'Jane S.' }, { title: 'E-Commerce Trends', excerpt: 'What shapes 2026?', category: 'Business', date: 'Mar 2026', author: 'Alex M.' }] }),
      comp('tags-cloud', 'Tags', { title: 'Popular Tags', tags: [{ label: 'Design', count: 24 }, { label: 'Development', count: 18 }, { label: 'Marketing', count: 12 }, { label: 'Tips', count: 15 }] }),
      comp('newsletter', 'Subscribe', { title: 'Never Miss a Post', subtitle: 'Subscribe for updates.', buttonText: 'Subscribe' }),
      comp('footer', 'Footer', { companyName: 'MyBlog', links: [{ label: 'RSS', href: '#' }, { label: 'Privacy', href: '#' }] }),
    ],
  },
  {
    id: 'blog-post', name: 'Blog Post', description: 'Single article with comments', icon: 'FileText',
    components: () => [
      comp('navbar', 'Navbar', { logo: 'MyBlog', links: [{ label: 'Home', href: '#' }, { label: 'Blog', href: '#' }] }),
      comp('breadcrumb', 'Breadcrumb', { items: [{ label: 'Home', href: '/' }, { label: 'Blog', href: '/blog' }, { label: 'Article' }] }),
      comp('heading', 'Title', { text: 'The Complete Guide to Modern Web Design', level: 'h1', alignment: 'left' }),
      comp('avatar', 'Author', { name: 'John Doe', subtitle: 'Published Jan 15, 2026 · 8 min read', size: 'sm' }),
      comp('rich-text', 'Content', { content: '<p>Your article content goes here. Use the rich text editor to format headings, paragraphs, lists, and more.</p><h2>Introduction</h2><p>Lorem ipsum dolor sit amet...</p>' }),
      comp('tags-cloud', 'Tags', { tags: [{ label: 'Design' }, { label: 'Tutorial' }, { label: 'Web Development' }] }),
      comp('divider', 'Divider', { style: 'solid', color: '#e2e8f0', thickness: 1 }),
      comp('comments', 'Comments', { title: 'Comments', showForm: true, comments: [{ author: 'Alice', text: 'Great article!', date: '2 hours ago', likes: 5 }] }),
      comp('footer', 'Footer', { companyName: 'MyBlog', links: [{ label: 'Privacy', href: '#' }] }),
    ],
  },
  {
    id: 'about', name: 'About Page', description: 'Story, team, and values', icon: 'Info',
    components: () => [
      comp('navbar', 'Navbar', { logo: 'MyBrand', links: [{ label: 'Home', href: '#' }, { label: 'About', href: '#' }, { label: 'Team', href: '#team' }] }),
      comp('hero', 'Hero', { heading: 'About Us', subheading: "We're on a mission to make the web better.", ctaText: 'Our Story', ctaLink: '#story', alignment: 'center' }),
      comp('image-text', 'Story', { title: 'Our Story', description: 'Founded in 2020, we set out to solve a problem affecting millions.', imageUrl: '', imagePosition: 'right' }),
      comp('timeline', 'Journey', { title: 'Our Journey', items: [{ date: '2020', title: 'Founded', description: 'Started with a vision.' }, { date: '2022', title: 'Series A', description: 'Raised $10M.' }, { date: '2024', title: 'Global', description: '30+ countries.' }] }),
      comp('team-grid', 'Team', { title: 'Meet Our Team', members: [{ name: 'Alice', role: 'CEO' }, { name: 'Bob', role: 'CTO' }, { name: 'Carol', role: 'Design Lead' }] }),
      comp('footer', 'Footer', { companyName: 'MyBrand', links: [{ label: 'Home', href: '#' }] }),
    ],
  },
  {
    id: 'contact', name: 'Contact Page', description: 'Form with map & info', icon: 'Mail',
    components: () => [
      comp('navbar', 'Navbar', { logo: 'MyBrand', links: [{ label: 'Home', href: '#' }, { label: 'Contact', href: '#' }] }),
      comp('hero', 'Hero', { heading: 'Get in Touch', subheading: "We'd love to hear from you.", alignment: 'center', height: 'small' }),
      comp('icon-text', 'Info', { items: [{ icon: '📧', title: 'Email', description: 'hello@example.com' }, { icon: '📞', title: 'Phone', description: '+1 (555) 123-4567' }, { icon: '📍', title: 'Address', description: '123 Main St, NYC' }], layout: 'vertical' }),
      comp('contact-form', 'Form', { title: 'Send a Message', fields: ['name', 'email', 'phone', 'message'], submitText: 'Send Message' }),
      comp('map', 'Map', { address: 'New York, NY', height: 350 }),
      comp('footer', 'Footer', { companyName: 'MyBrand', links: [{ label: 'Privacy', href: '#' }] }),
    ],
  },
  {
    id: 'services', name: 'Services', description: 'Offerings with pricing', icon: 'Briefcase',
    components: () => [
      comp('navbar', 'Navbar', { logo: 'MyBrand', links: [{ label: 'Home', href: '#' }, { label: 'Services', href: '#' }, { label: 'Pricing', href: '#pricing' }] }),
      comp('hero', 'Hero', { heading: 'Our Services', subheading: 'Comprehensive solutions for your business.', ctaText: 'View Plans', ctaLink: '#pricing', alignment: 'center' }),
      comp('service-card', 'Services', { title: 'What We Offer', services: [{ icon: '🎨', title: 'Design', description: 'Modern designs', price: 'From $499' }, { icon: '💻', title: 'Development', description: 'Custom apps', price: 'From $999' }, { icon: '📈', title: 'Marketing', description: 'Growth', price: 'From $299' }] }),
      comp('comparison-table', 'Compare', { title: 'Compare Plans', headers: ['Basic', 'Pro', 'Enterprise'], rows: [{ feature: 'Projects', values: ['1', '10', 'Unlimited'] }, { feature: 'Support', values: ['Email', 'Priority', 'Dedicated'] }] }),
      comp('pricing', 'Pricing', { title: 'Pricing', plans: [{ name: 'Starter', price: '$29/mo', features: ['1 Project', 'Basic Support'], highlighted: false }, { name: 'Pro', price: '$79/mo', features: ['10 Projects', 'Priority', 'Analytics'], highlighted: true }, { name: 'Enterprise', price: 'Custom', features: ['Unlimited', 'Dedicated'], highlighted: false }] }),
      comp('faq', 'FAQ', { title: 'FAQ', items: [{ question: 'How do I start?', answer: 'Choose a plan and sign up.' }] }),
      comp('footer', 'Footer', { companyName: 'MyBrand', links: [{ label: 'Privacy', href: '#' }] }),
    ],
  },
  {
    id: 'event', name: 'Event Page', description: 'Countdown, speakers, registration', icon: 'Calendar',
    components: () => [
      comp('banner', 'Alert', { text: '🎟️ Early bird pricing ends soon!', linkText: 'Register', linkUrl: '#register', variant: 'warning' }),
      comp('navbar', 'Navbar', { logo: 'TechConf 2026', links: [{ label: 'Speakers', href: '#speakers' }, { label: 'Register', href: '#register' }] }),
      comp('hero', 'Hero', { heading: 'TechConf 2026', subheading: 'The premier technology conference. March 15-17, San Francisco.', ctaText: 'Register Now', ctaLink: '#register', alignment: 'center', height: 'large' }),
      comp('countdown', 'Countdown', { title: 'Event Starts In', targetDate: new Date(Date.now() + 60 * 86400000).toISOString() }),
      comp('team-grid', 'Speakers', { title: 'Featured Speakers', members: [{ name: 'Dr. Sarah Chen', role: 'AI Researcher' }, { name: 'Mark Rivera', role: 'VP Engineering' }] }),
      comp('pricing', 'Tickets', { title: 'Tickets', plans: [{ name: 'General', price: '$299', features: ['All Sessions', 'Lunch'], highlighted: false }, { name: 'VIP', price: '$599', features: ['VIP Lounge', 'Workshop', 'After Party'], highlighted: true }] }),
      comp('contact-form', 'Register', { title: 'Register', fields: ['name', 'email', 'company'], submitText: 'Register' }),
      comp('footer', 'Footer', { companyName: 'TechConf', links: [{ label: 'Code of Conduct', href: '#' }] }),
    ],
  },
  {
    id: 'personal', name: 'Personal Site', description: 'Bio, skills, and links', icon: 'User',
    components: () => [
      comp('navbar', 'Navbar', { logo: 'John Doe', links: [{ label: 'About', href: '#' }, { label: 'Skills', href: '#skills' }, { label: 'Contact', href: '#contact' }] }),
      comp('hero', 'Hero', { heading: "Hi, I'm John Doe", subheading: 'Full-stack developer and open source enthusiast.', ctaText: 'Get in Touch', ctaLink: '#contact', alignment: 'left', height: 'medium' }),
      comp('user-profile', 'Profile', { name: 'John Doe', bio: 'Passionate developer with 8+ years experience.', stats: [{ label: 'Projects', value: '50+' }, { label: 'Clients', value: '30+' }], socialLinks: [{ platform: 'GitHub', url: '#' }, { platform: 'LinkedIn', url: '#' }] }),
      comp('progress', 'Skills', { title: 'Skills', items: [{ label: 'React', value: 95 }, { label: 'Node.js', value: 88 }, { label: 'Python', value: 80 }] }),
      comp('timeline', 'Experience', { title: 'Experience', items: [{ date: '2022-Present', title: 'Senior Engineer', description: 'Leading frontend at TechCo.' }, { date: '2019-2022', title: 'Full-Stack Dev', description: 'Built SaaS products.' }] }),
      comp('contact-form', 'Contact', { title: 'Say Hello', fields: ['name', 'email', 'message'], submitText: 'Send' }),
      comp('footer', 'Footer', { companyName: 'John Doe', links: [{ label: 'GitHub', href: '#' }] }),
    ],
  },
  {
    id: 'agency', name: 'Agency', description: 'Services, portfolio, team', icon: 'Building',
    components: () => [
      comp('mega-menu', 'Menu', { logo: 'DigitalAgency', menus: [{ label: 'Services', items: [{ title: 'Web Design', description: 'Beautiful websites', href: '#', icon: '🎨' }, { title: 'Development', description: 'Custom solutions', href: '#', icon: '💻' }] }, { label: 'Work', items: [{ title: 'Case Studies', href: '#', icon: '📂' }, { title: 'Portfolio', href: '#', icon: '🖼️' }] }], ctaText: 'Contact Us', ctaLink: '#contact' }),
      comp('hero', 'Hero', { heading: 'We Build Digital Experiences', subheading: 'Award-winning agency specializing in design, development, and marketing.', ctaText: 'Our Work', ctaLink: '#work', alignment: 'center', height: 'large' }),
      comp('stats', 'Stats', { stats: [{ value: '150+', label: 'Projects' }, { value: '50+', label: 'Clients' }, { value: '12', label: 'Awards' }, { value: '8+', label: 'Years' }] }),
      comp('service-card', 'Services', { title: 'What We Do', services: [{ icon: '🎨', title: 'Branding', description: 'Identity design', price: 'From $2,999' }, { icon: '💻', title: 'Web Development', description: 'Custom platforms', price: 'From $4,999' }, { icon: '📈', title: 'Digital Marketing', description: 'Growth campaigns', price: 'From $1,999' }] }),
      comp('lightbox-gallery', 'Portfolio', { title: 'Selected Work', images: [], columns: 3 }),
      comp('team-grid', 'Team', { title: 'Our Team', members: [{ name: 'Sarah', role: 'Creative Director' }, { name: 'Mike', role: 'Lead Developer' }, { name: 'Lisa', role: 'Strategy Lead' }] }),
      comp('testimonials', 'Testimonials', { title: 'Client Feedback', testimonials: [{ name: 'CEO, StartupX', role: '', text: 'They transformed our brand completely.', rating: 5 }] }),
      comp('contact-form', 'Contact', { title: "Let's Talk", fields: ['name', 'email', 'company', 'message'], submitText: 'Start Project' }),
      comp('footer', 'Footer', { companyName: 'DigitalAgency', links: [{ label: 'Careers', href: '#' }, { label: 'Privacy', href: '#' }] }),
    ],
  },
  {
    id: 'nonprofit', name: 'Nonprofit', description: 'Mission, impact, donate', icon: 'Heart',
    components: () => [
      comp('navbar', 'Navbar', { logo: 'GreenEarth', links: [{ label: 'Mission', href: '#mission' }, { label: 'Impact', href: '#impact' }, { label: 'Donate', href: '#donate' }] }),
      comp('hero', 'Hero', { heading: 'Protecting Our Planet', subheading: 'Join us in the fight against climate change.', ctaText: 'Donate Now', ctaLink: '#donate', alignment: 'center', height: 'large' }),
      comp('stats', 'Impact', { stats: [{ value: '1M+', label: 'Trees Planted' }, { value: '50+', label: 'Countries' }, { value: '100K', label: 'Volunteers' }, { value: '$5M', label: 'Raised' }] }),
      comp('image-text', 'Mission', { title: 'Our Mission', description: 'We work to protect natural habitats and promote sustainable practices around the world.', imagePosition: 'left' }),
      comp('icon-text', 'Programs', { items: [{ icon: '🌱', title: 'Reforestation', description: 'Planting trees worldwide' }, { icon: '🌊', title: 'Ocean Cleanup', description: 'Removing plastic from oceans' }, { icon: '🐾', title: 'Wildlife Protection', description: 'Preserving endangered species' }], layout: 'vertical' }),
      comp('testimonials', 'Stories', { title: 'Volunteer Stories', testimonials: [{ name: 'Sarah K.', role: 'Volunteer', text: 'The most rewarding experience of my life.', rating: 5 }] }),
      comp('cta-banner', 'Donate', { heading: 'Make a Difference Today', subheading: 'Every donation counts.', ctaText: 'Donate Now', ctaLink: '#' }),
      comp('footer', 'Footer', { companyName: 'GreenEarth Foundation', links: [{ label: 'About', href: '#' }, { label: 'Privacy', href: '#' }] }),
    ],
  },
  {
    id: 'fitness', name: 'Fitness / Gym', description: 'Classes, trainers, membership', icon: 'Dumbbell',
    components: () => [
      comp('navbar', 'Navbar', { logo: 'FitZone', links: [{ label: 'Classes', href: '#' }, { label: 'Trainers', href: '#trainers' }, { label: 'Pricing', href: '#pricing' }, { label: 'Join', href: '#join' }] }),
      comp('parallax', 'Hero', { imageUrl: '', heading: 'Transform Your Body', subheading: 'Join the most advanced fitness facility in the city.', height: 'large', overlayOpacity: 50 }),
      comp('features', 'Classes', { title: 'Our Classes', features: [{ icon: '🏋️', title: 'Strength', description: 'Build muscle' }, { icon: '🧘', title: 'Yoga', description: 'Find balance' }, { icon: '🏃', title: 'HIIT', description: 'Burn calories' }] }),
      comp('team-grid', 'Trainers', { title: 'Our Trainers', members: [{ name: 'Mike T.', role: 'Strength Coach' }, { name: 'Sarah L.', role: 'Yoga Instructor' }] }),
      comp('pricing', 'Membership', { title: 'Membership Plans', plans: [{ name: 'Basic', price: '$29/mo', features: ['Gym Access', 'Locker'], highlighted: false }, { name: 'Premium', price: '$59/mo', features: ['All Classes', 'Personal Trainer', 'Sauna'], highlighted: true }] }),
      comp('contact-form', 'Join', { title: 'Start Your Journey', fields: ['name', 'email', 'phone'], submitText: 'Join Now' }),
      comp('footer', 'Footer', { companyName: 'FitZone', links: [{ label: 'Hours', href: '#' }, { label: 'Privacy', href: '#' }] }),
    ],
  },
  {
    id: 'real-estate', name: 'Real Estate', description: 'Listings, agents, contact', icon: 'Home',
    components: () => [
      comp('navbar', 'Navbar', { logo: 'LuxuryHomes', links: [{ label: 'Properties', href: '#' }, { label: 'Agents', href: '#agents' }, { label: 'Contact', href: '#contact' }] }),
      comp('hero', 'Hero', { heading: 'Find Your Dream Home', subheading: 'Luxury properties in prime locations.', ctaText: 'Browse Properties', ctaLink: '#properties', alignment: 'center', height: 'large' }),
      comp('search-bar', 'Search', { placeholder: 'Search by location, price, or type...', buttonText: 'Search' }),
      comp('product-card', 'Listings', { title: 'Featured Properties', columns: 3, products: [{ name: 'Modern Villa', price: '$1.2M', badge: 'New', description: '4 bed, 3 bath, 3,200 sqft' }, { name: 'Downtown Penthouse', price: '$2.5M', badge: 'Featured', description: '3 bed, 2 bath, 2,800 sqft' }, { name: 'Suburban Home', price: '$650K', description: '3 bed, 2 bath, 2,000 sqft' }] }),
      comp('stats', 'Stats', { stats: [{ value: '500+', label: 'Properties Sold' }, { value: '$2B+', label: 'Total Sales' }, { value: '98%', label: 'Satisfaction' }] }),
      comp('team-grid', 'Agents', { title: 'Top Agents', members: [{ name: 'Michael R.', role: 'Senior Agent' }, { name: 'Emily S.', role: 'Specialist' }] }),
      comp('contact-form', 'Contact', { title: 'Schedule a Viewing', fields: ['name', 'email', 'phone', 'message'], submitText: 'Request Viewing' }),
      comp('footer', 'Footer', { companyName: 'LuxuryHomes', links: [{ label: 'Privacy', href: '#' }] }),
    ],
  },
  {
    id: 'education', name: 'Education / Course', description: 'Curriculum, instructors, enroll', icon: 'GraduationCap',
    components: () => [
      comp('navbar', 'Navbar', { logo: 'LearnHub', links: [{ label: 'Courses', href: '#' }, { label: 'Instructors', href: '#' }, { label: 'Enroll', href: '#enroll' }] }),
      comp('hero', 'Hero', { heading: 'Learn New Skills Online', subheading: 'Expert-led courses to advance your career.', ctaText: 'Browse Courses', ctaLink: '#courses', alignment: 'center', height: 'medium' }),
      comp('features', 'Why Us', { title: 'Why Learn With Us', features: [{ icon: '🎓', title: 'Expert Instructors', description: 'Learn from the best' }, { icon: '📱', title: 'Mobile-Friendly', description: 'Learn anywhere' }, { icon: '🏆', title: 'Certificates', description: 'Earn credentials' }] }),
      comp('product-card', 'Courses', { title: 'Popular Courses', columns: 3, products: [{ name: 'Web Development', price: '$99', badge: 'Popular', description: '12 weeks, beginner' }, { name: 'Data Science', price: '$149', description: '16 weeks, intermediate' }, { name: 'UX Design', price: '$79', description: '8 weeks, beginner' }] }),
      comp('testimonials', 'Reviews', { title: 'Student Stories', testimonials: [{ name: 'Anna K.', role: 'Graduate', text: 'Changed my career completely!', rating: 5 }] }),
      comp('faq', 'FAQ', { title: 'FAQ', items: [{ question: 'Are courses self-paced?', answer: 'Yes, all courses are self-paced.' }] }),
      comp('signup-form', 'Enroll', { title: 'Create Your Account', fields: ['name', 'email', 'password'] }),
      comp('footer', 'Footer', { companyName: 'LearnHub', links: [{ label: 'Privacy', href: '#' }] }),
    ],
  },
  {
    id: 'photography', name: 'Photography', description: 'Galleries with before/after', icon: 'Camera',
    components: () => [
      comp('navbar', 'Navbar', { logo: 'PixelPerfect', links: [{ label: 'Gallery', href: '#' }, { label: 'Services', href: '#' }, { label: 'Book', href: '#book' }] }),
      comp('hero', 'Hero', { heading: 'Capturing Moments', subheading: 'Professional photography for every occasion.', ctaText: 'Book a Session', ctaLink: '#book', alignment: 'center', height: 'large' }),
      comp('lightbox-gallery', 'Portfolio', { title: 'Recent Work', images: [], columns: 3 }),
      comp('before-after', 'Editing', { beforeImage: '', afterImage: '', beforeLabel: 'Original', afterLabel: 'Edited', height: 400 }),
      comp('pricing', 'Packages', { title: 'Photography Packages', plans: [{ name: 'Portrait', price: '$199', features: ['1 Hour', '20 Photos', 'Digital'], highlighted: false }, { name: 'Wedding', price: '$1,999', features: ['Full Day', '500+ Photos', 'Album'], highlighted: true }] }),
      comp('contact-form', 'Book', { title: 'Book a Session', fields: ['name', 'email', 'message'], submitText: 'Book Now' }),
      comp('footer', 'Footer', { companyName: 'PixelPerfect', links: [{ label: 'Privacy', href: '#' }] }),
    ],
  },
  {
    id: 'login', name: 'Login / Auth', description: 'Login and signup pages', icon: 'LogIn',
    components: () => [
      comp('navbar', 'Navbar', { logo: 'MyApp', links: [{ label: 'Home', href: '#' }] }),
      comp('login-form', 'Login', { title: 'Welcome Back', showSignup: true, showForgot: true }),
      comp('footer', 'Footer', { companyName: 'MyApp', links: [{ label: 'Help', href: '#' }, { label: 'Privacy', href: '#' }] }),
    ],
  },
  {
    id: 'coming-soon', name: 'Coming Soon', description: 'Countdown with signup', icon: 'Clock',
    components: () => [
      comp('hero', 'Hero', { heading: 'Something Amazing is Coming', subheading: 'We are working hard to bring you something incredible. Stay tuned!', ctaText: '', ctaLink: '', alignment: 'center', height: 'large' }),
      comp('countdown', 'Countdown', { title: 'Launching In', targetDate: new Date(Date.now() + 30 * 86400000).toISOString() }),
      comp('newsletter', 'Notify', { title: 'Be the First to Know', subtitle: 'Enter your email to get notified when we launch.', buttonText: 'Notify Me' }),
      comp('social-links', 'Social', { title: 'Follow Us', links: [{ platform: 'Twitter', url: '#' }, { platform: 'Instagram', url: '#' }] }),
    ],
  },
];

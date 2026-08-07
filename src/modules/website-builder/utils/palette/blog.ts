import { PaletteItem } from '../../types';

export const BLOG_PALETTE: PaletteItem[] = [
  {
    type: 'blog-grid', label: 'Blog Post Grid', icon: 'Newspaper', category: 'blog',
    description: 'Grid of blog post cards',
    defaultProps: { title: 'Latest Articles', columns: 3, posts: [{ title: 'Getting Started with Web Design', excerpt: 'Learn the fundamentals of modern web design.', category: 'Design', date: 'Jan 2025', author: 'John D.' }, { title: 'Top 10 Marketing Tips', excerpt: 'Boost your business with these proven strategies.', category: 'Marketing', date: 'Feb 2025', author: 'Jane S.' }, { title: 'The Future of E-Commerce', excerpt: 'What trends will shape online shopping in 2025?', category: 'Business', date: 'Mar 2025', author: 'Alex M.' }] },
  },
  {
    type: 'comments', label: 'Comments', icon: 'MessageCircle', category: 'blog',
    description: 'Comment section with reply form',
    defaultProps: { title: 'Comments', showForm: true, comments: [{ author: 'Alice M.', text: 'Great article! Really helpful insights.', date: '2 hours ago', likes: 5 }, { author: 'Bob K.', text: 'Thanks for sharing this, very informative.', date: '5 hours ago', likes: 2 }] },
  },
  {
    type: 'tags-cloud', label: 'Tags Cloud', icon: 'Tag', category: 'blog',
    description: 'Weighted cloud of tags',
    defaultProps: { title: 'Popular Tags', tags: [{ label: 'Design', count: 24 }, { label: 'Development', count: 18 }, { label: 'Marketing', count: 12 }, { label: 'Business', count: 9 }, { label: 'Tutorial', count: 15 }, { label: 'Tips', count: 7 }] },
  },
  {
    type: 'product-card', label: 'Product Cards', icon: 'ShoppingBag', category: 'blog',
    description: 'Product cards with price & badge',
    defaultProps: { title: 'Our Products', columns: 3, products: [{ name: 'Premium Headphones', price: '$149', oldPrice: '$199', badge: 'Sale', description: 'Wireless noise-cancelling headphones' }, { name: 'Smart Watch', price: '$299', description: 'Health tracking & notifications' }, { name: 'Laptop Stand', price: '$79', description: 'Ergonomic aluminum stand' }] },
  },
  {
    type: 'product-detail', label: 'Product Detail', icon: 'Package', category: 'blog',
    description: 'Full product page with variants',
    defaultProps: { name: 'Premium Wireless Headphones', price: '$149.99', oldPrice: '$199.99', description: 'Experience crystal-clear audio with our premium wireless headphones. Featuring active noise cancellation, 30-hour battery life, and ultra-comfortable ear cushions.', images: [], badge: 'Best Seller', variants: [{ label: 'Color', options: ['Black', 'White', 'Navy'] }, { label: 'Size', options: ['Standard', 'Compact'] }], features: ['Active Noise Cancellation', '30-hour battery life', 'Bluetooth 5.3', 'Premium drivers', 'Foldable design'], inStock: true },
  },
  {
    type: 'cart', label: 'Shopping Cart', icon: 'ShoppingCart', category: 'blog',
    description: 'Cart with items & totals',
    defaultProps: { items: [{ name: 'Premium Headphones', price: '$149', quantity: 1 }, { name: 'Smart Watch', price: '$299', quantity: 1 }], subtotal: '$448', shipping: 'Free', total: '$448' },
  },
  {
    type: 'user-profile', label: 'User Profile', icon: 'UserCircle', category: 'blog',
    description: 'Profile card with stats & social',
    defaultProps: { name: 'Jane Smith', bio: 'Full-stack developer passionate about creating beautiful web experiences. Based in San Francisco.', avatar: '', coverImage: '', stats: [{ label: 'Posts', value: '142' }, { label: 'Followers', value: '3.2K' }, { label: 'Following', value: '256' }], socialLinks: [{ platform: 'twitter', url: '#' }, { platform: 'github', url: '#' }] },
  },
];

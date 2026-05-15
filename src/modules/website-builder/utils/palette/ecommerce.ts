import { PaletteItem } from '../../types';

export const ECOMMERCE_PALETTE: PaletteItem[] = [
  // ── Product Cards ──
  {
    type: 'product-card', label: 'Product Grid', icon: 'ShoppingBag', category: 'business',
    description: 'Product grid with wishlist & cart',
    defaultProps: {
      title: 'Our Products', subtitle: 'Discover our latest collection', columns: 3, variant: 'default',
      showWishlist: true, showQuickView: false, showRating: true,
      products: [
        { name: 'Classic Leather Jacket', price: '$189', oldPrice: '$249', badge: 'Sale', rating: 5, description: 'Premium genuine leather, tailored fit' },
        { name: 'Wireless Headphones', price: '$79', rating: 4, description: 'Noise-cancelling with 40h battery', liked: true },
        { name: 'Minimalist Watch', price: '$129', badge: 'New', rating: 5, description: 'Swiss movement, sapphire crystal' },
        { name: 'Running Sneakers', price: '$95', oldPrice: '$120', rating: 4, description: 'Lightweight & breathable mesh' },
        { name: 'Canvas Backpack', price: '$55', rating: 4, description: 'Water-resistant, laptop sleeve' },
        { name: 'Sunglasses', price: '$45', badge: 'Popular', rating: 5, description: 'UV400 polarized lenses' },
      ],
    },
  },
  {
    type: 'product-card', label: 'Compact Product Grid', icon: 'LayoutGrid', category: 'business',
    description: 'Smaller cards in tight grid',
    defaultProps: {
      title: 'Trending Now', columns: 4, variant: 'compact', showWishlist: true, showRating: false,
      products: [
        { name: 'Organic Face Cream', price: '$32' },
        { name: 'Vitamin C Serum', price: '$28', badge: 'Best Seller' },
        { name: 'Lip Balm Set', price: '$15', oldPrice: '$20' },
        { name: 'Night Repair Oil', price: '$42' },
      ],
    },
  },
  {
    type: 'product-card', label: 'Product List (Horizontal)', icon: 'List', category: 'business',
    description: 'Horizontal cards stacked',
    defaultProps: {
      title: 'Featured Items', variant: 'horizontal', showWishlist: true, showRating: true,
      products: [
        { name: 'Ergonomic Office Chair', price: '$399', oldPrice: '$499', badge: '20% Off', rating: 5, description: 'Lumbar support, adjustable armrests' },
        { name: 'Standing Desk', price: '$599', rating: 4, description: 'Electric height adjustment, memory presets' },
        { name: 'Monitor Light Bar', price: '$49', badge: 'New', rating: 5, description: 'Eye-care LED, auto-dimming' },
      ],
    },
  },
  {
    type: 'product-card', label: 'Product Overlay Cards', icon: 'Layers', category: 'business',
    description: 'Full-image with info overlay',
    defaultProps: {
      title: 'Shop the Collection', columns: 3, variant: 'overlay', showWishlist: true, showRating: true,
      products: [
        { name: 'Summer Dress', price: '$75', badge: 'New', rating: 4 },
        { name: 'Denim Jacket', price: '$120', rating: 5 },
        { name: 'Leather Boots', price: '$195', oldPrice: '$250', badge: 'Sale', rating: 5 },
      ],
    },
  },

  // ── Product Carousel ──
  {
    type: 'product-carousel', label: 'Product Carousel', icon: 'GalleryHorizontal', category: 'business',
    description: 'Scrollable product slider',
    defaultProps: {
      title: 'Best Sellers', subtitle: 'Our most popular products', showArrows: true, showDots: true,
      autoPlay: false, cardStyle: 'default',
      products: [
        { name: 'Wireless Earbuds', price: '$59', oldPrice: '$79', badge: 'Sale', rating: 5, description: 'True wireless, 24h battery' },
        { name: 'Smart Watch', price: '$199', badge: 'New', rating: 4, description: 'Health tracking & GPS' },
        { name: 'Phone Case', price: '$25', rating: 5, description: 'Military-grade protection' },
        { name: 'Charging Pad', price: '$35', rating: 4, description: '15W fast wireless charging' },
        { name: 'USB-C Hub', price: '$45', oldPrice: '$60', rating: 5, description: '7-in-1 adapter' },
        { name: 'Laptop Stand', price: '$55', rating: 4, description: 'Adjustable aluminum stand' },
      ],
    },
  },
  {
    type: 'product-carousel', label: 'Auto-Play Carousel', icon: 'PlayCircle', category: 'business',
    description: 'Auto-scrolling product showcase',
    defaultProps: {
      title: 'New Arrivals', autoPlay: true, autoPlaySpeed: 3000, showDots: false, cardStyle: 'elevated',
      products: [
        { name: 'Silk Scarf', price: '$45', badge: 'New', rating: 5 },
        { name: 'Leather Wallet', price: '$65', rating: 4 },
        { name: 'Gold Necklace', price: '$89', badge: 'Trending', rating: 5 },
        { name: 'Pearl Earrings', price: '$55', oldPrice: '$70', rating: 4 },
      ],
    },
  },

  // ── Quick View / Product Detail ──
  {
    type: 'quick-view', label: 'Quick View Card', icon: 'Eye', category: 'business',
    description: 'Split-view with gallery & variants',
    defaultProps: {
      product: {
        name: 'Premium Wireless Headphones',
        price: '$199',
        oldPrice: '$249',
        description: 'Experience crystal-clear audio with active noise cancellation and 40-hour battery life.',
        images: [],
        badge: 'Best Seller',
        rating: 5,
        reviewCount: 128,
        inStock: true,
        variants: [
          { label: 'Color', options: ['Black', 'White', 'Navy'] },
          { label: 'Storage', options: ['32GB', '64GB'] },
        ],
      },
    },
  },

  // ── Product Detail ──
  {
    type: 'product-detail', label: 'Product Detail Page', icon: 'Package', category: 'business',
    description: 'Full product page with variants',
    defaultProps: {
      name: 'Premium Product',
      price: '$99',
      oldPrice: '$149',
      description: 'High-quality product with exceptional features and modern design.',
      images: [],
      badge: 'New',
      inStock: true,
      variants: [{ label: 'Size', options: ['S', 'M', 'L', 'XL'] }, { label: 'Color', options: ['Black', 'White', 'Blue'] }],
      features: ['Premium materials', 'Handcrafted finish', '1-year warranty', 'Free returns'],
    },
  },

  // ── Cart ──
  {
    type: 'cart', label: 'Shopping Cart', icon: 'ShoppingCart', category: 'business',
    description: 'Cart with items & checkout',
    defaultProps: {
      items: [
        { name: 'Wireless Headphones', price: '$99', quantity: 1 },
        { name: 'Phone Case', price: '$25', quantity: 2 },
        { name: 'USB-C Cable', price: '$12', quantity: 3 },
      ],
      subtotal: '$173', shipping: 'Free', total: '$173',
    },
  },

  // ── Product Filter & Sort ──
  {
    type: 'product-filter', label: 'Product Filter Bar', icon: 'SlidersHorizontal', category: 'business',
    description: 'Horizontal filter with search',
    defaultProps: {
      title: 'Filter Products', variant: 'horizontal',
      showSearch: true, showCategories: true, showPriceRange: true, showRating: true, showSort: true,
      categories: [
        { label: 'All', value: 'all', count: 24 },
        { label: 'Electronics', value: 'electronics', count: 8 },
        { label: 'Clothing', value: 'clothing', count: 6 },
        { label: 'Accessories', value: 'accessories', count: 5 },
        { label: 'Home', value: 'home', count: 5 },
      ],
      priceMin: 0, priceMax: 500, priceCurrency: '$',
      sortOptions: ['price-asc', 'price-desc', 'rating-desc', 'name-asc', 'newest'],
    },
  },
  {
    type: 'product-filter', label: 'Sidebar Filters', icon: 'PanelLeft', category: 'business',
    description: 'Vertical sidebar filter',
    defaultProps: {
      title: 'Filters', variant: 'sidebar',
      showSearch: true, showCategories: true, showPriceRange: true, showRating: true, showSort: true,
      categories: [
        { label: 'All', value: 'all', count: 50 },
        { label: 'Men', value: 'men', count: 18 },
        { label: 'Women', value: 'women', count: 22 },
        { label: 'Kids', value: 'kids', count: 10 },
      ],
      priceMin: 0, priceMax: 300,
    },
  },
  {
    type: 'product-filter', label: 'Minimal Filter Pills', icon: 'ToggleLeft', category: 'business',
    description: 'Compact category pills',
    defaultProps: {
      title: '', variant: 'minimal',
      showSearch: false, showCategories: true, showPriceRange: false, showRating: false, showSort: true,
      categories: [
        { label: 'All', value: 'all' },
        { label: 'New Arrivals', value: 'new' },
        { label: 'Sale', value: 'sale' },
        { label: 'Best Sellers', value: 'best-sellers' },
      ],
    },
  },

  // ── Checkout ──
  {
    type: 'checkout', label: 'Checkout (Full Page)', icon: 'CreditCard', category: 'business',
    description: 'Complete checkout page',
    defaultProps: {
      title: 'Checkout', variant: 'single-page',
      showTrustBadges: true, buttonText: 'Place Order',
      items: [
        { name: 'Premium Headphones', price: '$199', quantity: 1, variant: 'Black' },
        { name: 'Phone Case', price: '$25', quantity: 2, variant: 'Clear' },
      ],
      subtotal: '$249', shipping: 'Free', tax: '$19.92', total: '$268.92',
      paymentMethods: ['Credit Card', 'PayPal', 'Apple Pay'],
      shippingMethods: [
        { label: 'Standard', price: 'Free', estimate: '5–7 days' },
        { label: 'Express', price: '$9.99', estimate: '2–3 days' },
      ],
      checkoutSettings: {
        collectSubmissions: true,
        successMessage: 'Order placed! 🎉',
        successAction: 'message',
        onErrorAction: 'show_message',
        errorMessage: 'Order failed. Please try again.',
        maxRetries: 2,
        requireTerms: true,
        showOrderNotes: true,
        showCouponField: true,
      },
    },
  },
  {
    type: 'checkout', label: 'Step-by-Step Checkout', icon: 'Briefcase', category: 'business',
    description: 'Multi-step checkout flow',
    defaultProps: {
      title: 'Secure Checkout', variant: 'split',
      showTrustBadges: true, buttonText: 'Complete Purchase',
      items: [
        { name: 'Running Sneakers', price: '$95', quantity: 1, variant: 'Size 10' },
        { name: 'Sports Watch', price: '$199', quantity: 1 },
      ],
      subtotal: '$294', shipping: '$9.99', tax: '$24.32', total: '$328.31',
      paymentMethods: ['Credit Card', 'PayPal'],
      shippingMethods: [
        { label: 'Standard', price: '$9.99', estimate: '5–7 days' },
        { label: 'Next Day', price: '$19.99', estimate: '1 day' },
      ],
      checkoutSettings: {
        collectSubmissions: true,
        successAction: 'message',
        onErrorAction: 'retry',
        maxRetries: 3,
        requireTerms: true,
        showCouponField: true,
      },
    },
  },
  {
    type: 'checkout', label: 'Checkout + Webhook', icon: 'ExternalLink', category: 'business',
    description: 'Checkout with API integration',
    defaultProps: {
      title: 'Complete Your Order', variant: 'single-page',
      showTrustBadges: true, buttonText: 'Pay Now',
      items: [
        { name: 'Annual Plan', price: '$299', quantity: 1, variant: 'Business' },
      ],
      subtotal: '$299', shipping: '$0', tax: '$23.92', total: '$322.92',
      paymentMethods: ['Credit Card'],
      checkoutSettings: {
        webhookUrl: '',
        webhookMethod: 'POST',
        collectSubmissions: true,
        successMessage: 'Payment successful!',
        successAction: 'redirect',
        redirectUrl: '/thank-you',
        onErrorAction: 'retry',
        errorMessage: 'Payment failed. Retrying...',
        maxRetries: 3,
        requireTerms: true,
        termsText: 'I agree to the Terms of Service',
        termsUrl: '/terms',
        showOrderNotes: false,
        showCouponField: true,
      },
    },
  },

  // ── Wishlist ──
  {
    type: 'wishlist-grid', label: 'Wishlist Grid', icon: 'Heart', category: 'business',
    description: 'Saved items with cart actions',
    defaultProps: {
      title: 'My Wishlist', columns: 4, showMoveToCart: true,
      items: [
        { name: 'Designer Sunglasses', price: '$120', oldPrice: '$150', inStock: true },
        { name: 'Leather Belt', price: '$45', inStock: true },
        { name: 'Silk Tie', price: '$35', inStock: false },
        { name: 'Cufflinks Set', price: '$65', inStock: true },
      ],
    },
  },
];

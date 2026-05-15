import { PaletteItem } from '../../types';

export const MEDIA_PALETTE: PaletteItem[] = [
  {
    type: 'image-text', label: 'Image + Text', icon: 'PanelLeft', category: 'media',
    description: 'Side-by-side image and text',
    defaultProps: { title: 'Our Mission', description: 'We believe in creating exceptional products that make a real difference.', imageUrl: '', imagePosition: 'left' },
  },
  {
    type: 'image-gallery', label: 'Image Gallery', icon: 'Image', category: 'media',
    description: 'Image grid with columns',
    defaultProps: { images: [], columns: 3, gap: 8 },
  },
  {
    type: 'gallery-masonry', label: 'Masonry Gallery', icon: 'LayoutDashboard', category: 'media',
    description: 'Pinterest-style staggered layout',
    defaultProps: { images: [], columns: 3 },
  },
  {
    type: 'video-embed', label: 'Video Embed', icon: 'Video', category: 'media',
    description: 'YouTube or Vimeo player',
    defaultProps: { url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', aspectRatio: '16/9', variant: 'standard', showTitle: true, shadow: true },
  },
  {
    type: 'video-embed', label: 'Featured Video', icon: 'Play', category: 'media',
    description: 'Large centered video with frame',
    defaultProps: { url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', variant: 'featured', title: 'Watch Our Story', description: 'See how we make a difference.', aspectRatio: '16/9', showTitle: true, shadow: true },
  },
  {
    type: 'video-embed', label: 'Video Grid', icon: 'LayoutGrid', category: 'media',
    description: 'Grid of video thumbnails',
    defaultProps: {
      url: '', variant: 'grid', title: 'Our Videos', columns: 3, aspectRatio: '16/9',
      videos: [
        { url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', title: 'Introduction Video' },
        { url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', title: 'Product Demo' },
        { url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', title: 'Customer Story' },
      ],
    },
  },
  {
    type: 'video-embed', label: 'Video Playlist', icon: 'ListVideo', category: 'media',
    description: 'Main player with sidebar list',
    defaultProps: {
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', variant: 'playlist', title: 'Video Library', aspectRatio: '16/9',
      showTitle: true, shadow: true,
      videos: [
        { url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', title: 'Episode 1: Getting Started', description: 'Learn the basics' },
        { url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', title: 'Episode 2: Deep Dive', description: 'Advanced techniques' },
        { url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', title: 'Episode 3: Best Practices', description: 'Tips from the experts' },
      ],
    },
  },
  {
    type: 'background-video', label: 'Background Video', icon: 'Film', category: 'media',
    description: 'Section with video background',
    defaultProps: { videoUrl: '', heading: 'Video Background', subheading: 'Add a video URL to see it in action', ctaText: 'Learn More', ctaLink: '#', overlayOpacity: 50, height: 'medium' },
  },
  {
    type: 'audio-player', label: 'Audio Player', icon: 'Music', category: 'media',
    description: 'Embedded audio player',
    defaultProps: { src: '', title: 'Audio Track', artist: 'Artist Name' },
  },
  {
    type: 'map', label: 'Map Embed', icon: 'MapPin', category: 'media',
    description: 'Interactive map display',
    defaultProps: { address: 'New York, NY', height: 400, variant: 'map-only', mapTheme: 'default', zoom: 14 },
  },
  {
    type: 'map', label: 'Map + Contact', icon: 'MapPinned', category: 'media',
    description: 'Map with contact info card',
    defaultProps: {
      address: 'New York, NY', height: 400, variant: 'map-with-info', mapTheme: 'default', zoom: 14,
      showContactCard: true, contactCardTitle: 'Contact Us', contactCardStyle: 'default',
      contactInfo: { address: '123 Main Street, New York, NY 10001', phone: '+1 (555) 123-4567', email: 'hello@company.com', hours: 'Mon-Fri: 9am-5pm\nSat: 10am-3pm\nSun: Closed' },
    },
  },
  {
    type: 'map', label: 'Map Split View', icon: 'LayoutPanelLeft', category: 'media',
    description: 'Split layout with map and contact',
    defaultProps: {
      address: 'New York, NY', height: 450, variant: 'split', infoPosition: 'left', mapTheme: 'light', zoom: 14,
      showContactCard: true, contactCardTitle: 'Visit Us', contactCardStyle: 'elevated',
      contactInfo: { address: '456 Business Ave, Suite 100', phone: '+1 (555) 987-6543', email: 'info@business.com', hours: 'Mon-Fri: 8am-6pm' },
    },
  },
  {
    type: 'map', label: 'Map Overlay', icon: 'Layers', category: 'media',
    description: 'Map with floating contact card',
    defaultProps: {
      address: 'San Francisco, CA', height: 500, variant: 'overlay', mapTheme: 'dark', zoom: 15,
      showContactCard: true, contactCardTitle: 'Get in Touch', contactCardStyle: 'glass',
      contactInfo: { address: '789 Tech Blvd, SF 94102', phone: '+1 (415) 555-0123', email: 'contact@tech.com' },
    },
  },
  {
    type: 'lightbox-gallery', label: 'Lightbox Gallery', icon: 'Maximize', category: 'media',
    description: 'Click-to-zoom fullscreen gallery',
    defaultProps: { title: 'Photo Gallery', images: [], columns: 3 },
  },
  {
    type: 'before-after', label: 'Before / After', icon: 'SplitSquareHorizontal', category: 'media',
    description: 'Slider comparison of two images',
    defaultProps: { beforeImage: '', afterImage: '', beforeLabel: 'Before', afterLabel: 'After', height: 400 },
  },
];

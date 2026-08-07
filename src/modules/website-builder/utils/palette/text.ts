import { PaletteItem } from '../../types';

export const TEXT_PALETTE: PaletteItem[] = [
  {
    type: 'heading', label: 'Heading', icon: 'Type', category: 'text',
    description: 'Heading with icon, badge & decoration',
    defaultProps: { text: 'Your Heading Here', level: 'h2', alignment: 'left', icon: '', iconPosition: 'left', subtitle: '', badge: '', decoration: 'none' },
  },
  {
    type: 'paragraph', label: 'Paragraph', icon: 'AlignLeft', category: 'text',
    description: 'Body text with inline editing',
    defaultProps: { text: 'Write your paragraph content here. Click to edit inline.', alignment: 'left' },
  },
  {
    type: 'rich-text', label: 'Rich Text', icon: 'FileText', category: 'text',
    description: 'Formatted HTML with headings & lists',
    defaultProps: { content: '<h2>Your Heading</h2><p>Start typing your content here. Click to edit inline.</p>' },
  },
  {
    type: 'blockquote', label: 'Blockquote', icon: 'Quote', category: 'text',
    description: 'Quote with author attribution',
    defaultProps: { quote: 'The best way to predict the future is to create it.', author: 'Peter Drucker', source: '' },
  },
  {
    type: 'code-block', label: 'Code Block', icon: 'Code', category: 'text',
    description: 'Syntax-highlighted code snippet',
    defaultProps: { code: 'const greeting = "Hello, World!";\nconsole.log(greeting);', language: 'javascript' },
  },
  {
    type: 'list', label: 'List', icon: 'List', category: 'text',
    description: 'Ordered or unordered list',
    defaultProps: { items: ['First item', 'Second item', 'Third item'], ordered: false },
  },
  {
    type: 'callout', label: 'Callout Box', icon: 'AlertCircle', category: 'text',
    description: 'Info/warning/success notice box',
    defaultProps: { title: 'Important Notice', text: 'This is an important message for your visitors.', variant: 'info' },
  },
  {
    type: 'icon-text', label: 'Icon + Text', icon: 'Zap', category: 'text',
    description: 'Icon-labeled feature list',
    defaultProps: { items: [{ icon: 'Rocket', title: 'Fast Delivery', description: 'Get your product in 24 hours' }, { icon: 'Shield', title: 'Secure Payments', description: '256-bit SSL encryption' }, { icon: 'MessageCircle', title: '24/7 Support', description: 'We are always here to help' }], layout: 'vertical' },
  },
];

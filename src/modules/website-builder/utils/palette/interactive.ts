import { PaletteItem } from '../../types';

export const INTERACTIVE_PALETTE: PaletteItem[] = [
  {
    type: 'button', label: 'Button', icon: 'MousePointer', category: 'interactive',
    description: 'Clickable action button',
    defaultProps: { text: 'Click Me', link: '#', variant: 'primary', size: 'md' },
  },
  {
    type: 'button-group', label: 'Button Group', icon: 'ToggleLeft', category: 'interactive',
    description: 'Row of action buttons',
    defaultProps: { buttons: [{ text: 'Primary', link: '#', variant: 'primary' }, { text: 'Secondary', link: '#', variant: 'outline' }], alignment: 'center' },
  },
  {
    type: 'contact-form', label: 'Contact Form', icon: 'Mail', category: 'interactive',
    description: 'Contact form with webhook',
    defaultProps: {
      title: 'Contact Us', subtitle: "We'd love to hear from you",
      fields: ['name', 'email', 'phone', 'message'], submitText: 'Send Message',
      variant: 'default', showIcon: true,
      formSettings: { collectSubmissions: true, successMessage: "Thanks! We'll get back to you soon.", successAction: 'message' },
    },
  },
  {
    type: 'contact-form', label: 'Contact Card', icon: 'MessageSquare', category: 'interactive',
    description: 'Contact form in a card',
    defaultProps: {
      title: 'Get in Touch', subtitle: 'Fill out the form below',
      fields: ['name', 'email', 'message'], submitText: 'Send',
      variant: 'card', showIcon: false,
      formSettings: { collectSubmissions: true, successAction: 'message' },
    },
  },
  {
    type: 'form', label: 'Form Builder', icon: 'ClipboardList', category: 'interactive',
    description: 'Custom configurable form',
    defaultProps: {
      title: 'Registration Form', subtitle: 'Fill in your details below',
      layout: 'vertical', variant: 'default',
      fields: [
        { label: 'Full Name', type: 'text', placeholder: 'John Doe', required: true, width: 'full' },
        { label: 'Email', type: 'email', placeholder: 'john@example.com', required: true, width: 'half' },
        { label: 'Phone', type: 'tel', placeholder: '+1 (555) 000-0000', required: false, width: 'half' },
        { label: 'Message', type: 'textarea', placeholder: 'Your message...', required: false, width: 'full' },
        { label: 'Plan', type: 'select', placeholder: 'Select a plan', options: ['Basic', 'Pro', 'Enterprise'], width: 'full' },
        { label: 'I agree to the terms', type: 'checkbox', required: true, width: 'full' },
      ],
      submitText: 'Submit',
      formSettings: { collectSubmissions: true, successMessage: 'Thank you! Your submission has been received.', successAction: 'message' },
    },
  },
  {
    type: 'form', label: 'Two-Column Form', icon: 'Columns', category: 'interactive',
    description: 'Side-by-side fields layout',
    defaultProps: {
      title: 'Apply Now', layout: 'two-column', variant: 'bordered',
      fields: [
        { label: 'First Name', type: 'text', placeholder: 'John', required: true, width: 'half' },
        { label: 'Last Name', type: 'text', placeholder: 'Doe', required: true, width: 'half' },
        { label: 'Email', type: 'email', placeholder: 'john@example.com', required: true, width: 'half' },
        { label: 'Phone', type: 'tel', placeholder: '+1 (555) 000-0000', width: 'half' },
        { label: 'Company', type: 'text', placeholder: 'Acme Inc.', width: 'half' },
        { label: 'Role', type: 'select', options: ['Developer', 'Designer', 'Manager', 'Other'], width: 'half' },
        { label: 'How can we help?', type: 'textarea', placeholder: 'Tell us about your project...', width: 'full' },
      ],
      submitText: 'Submit Application',
      formSettings: { collectSubmissions: true, successAction: 'message' },
    },
  },
  {
    type: 'form', label: 'Webhook Form', icon: 'Webhook', category: 'interactive',
    description: 'Form with API integration',
    defaultProps: {
      title: 'API Integration Form', subtitle: 'Data is sent to your webhook endpoint',
      variant: 'card',
      fields: [
        { label: 'Name', type: 'text', required: true, width: 'full' },
        { label: 'Email', type: 'email', required: true, width: 'full' },
        { label: 'Feedback', type: 'textarea', width: 'full' },
      ],
      submitText: 'Send',
      formSettings: {
        collectSubmissions: true,
        webhookUrl: '',
        webhookMethod: 'POST',
        successMessage: 'Submitted successfully!',
        successAction: 'reset',
      },
    },
  },
  {
    type: 'login-form', label: 'Login Form', icon: 'LogIn', category: 'interactive',
    description: 'User login with password',
    defaultProps: { title: 'Welcome Back', showSignup: true, showForgot: true },
  },
  {
    type: 'newsletter', label: 'Newsletter Inline', icon: 'Inbox', category: 'interactive',
    description: 'Horizontal email capture',
    defaultProps: {
      title: 'Stay Updated', subtitle: 'Get the latest news and updates delivered to your inbox.',
      buttonText: 'Subscribe', variant: 'inline', showIcon: false,
      formSettings: { collectSubmissions: true, successMessage: 'Thanks for subscribing! 🎉', successAction: 'message' },
    },
  },
  {
    type: 'newsletter', label: 'Newsletter Stacked', icon: 'Mail', category: 'interactive',
    description: 'Vertical newsletter form',
    defaultProps: {
      title: 'Join Our Newsletter', subtitle: 'Be the first to know about new features and updates.',
      buttonText: 'Subscribe Now', variant: 'stacked', showIcon: true, iconType: 'mail',
      formSettings: { collectSubmissions: true, successAction: 'message' },
    },
  },
  {
    type: 'newsletter', label: 'Newsletter Card', icon: 'MessageSquare', category: 'interactive',
    description: 'Newsletter in elevated card',
    defaultProps: {
      title: 'Get Insider Updates', subtitle: 'Weekly tips, exclusive content, and early access.',
      buttonText: 'Join Free', variant: 'card', showIcon: true, iconType: 'sparkles',
      showPrivacy: true, privacyText: 'No spam ever. Unsubscribe anytime.',
      formSettings: { collectSubmissions: true, successAction: 'message' },
    },
  },
  {
    type: 'newsletter', label: 'Newsletter Split', icon: 'Columns', category: 'interactive',
    description: 'Two-column text + form',
    defaultProps: {
      title: 'Subscribe to Our Newsletter', subtitle: 'Stay in the loop with product updates, tips and exclusive offers delivered to your inbox.',
      buttonText: 'Subscribe', variant: 'split', showIcon: true, iconType: 'bell', showName: true,
      showPrivacy: true,
      formSettings: { collectSubmissions: true, successAction: 'message' },
    },
  },
  {
    type: 'newsletter', label: 'Newsletter Banner', icon: 'Megaphone', category: 'interactive',
    description: 'Full-width colored banner',
    defaultProps: {
      title: '🚀 Get early access to new features', subtitle: '',
      buttonText: 'Notify Me', variant: 'banner',
      formSettings: { collectSubmissions: true, successAction: 'reset' },
    },
  },
  {
    type: 'newsletter', label: 'Newsletter Minimal', icon: 'Minus', category: 'interactive',
    description: 'Clean minimal input only',
    defaultProps: {
      title: '', subtitle: '', buttonText: 'Subscribe', variant: 'minimal',
      placeholder: 'your@email.com',
      formSettings: { collectSubmissions: true, successAction: 'reset' },
    },
  },
  {
    type: 'newsletter', label: 'Newsletter + Webhook', icon: 'ExternalLink', category: 'interactive',
    description: 'Newsletter with API webhook',
    defaultProps: {
      title: 'Stay Connected', subtitle: 'We send data to your API endpoint on every signup.',
      buttonText: 'Sign Up', variant: 'card', showIcon: true, iconType: 'send', showName: true,
      showPrivacy: true,
      formSettings: {
        collectSubmissions: true,
        webhookUrl: '',
        webhookMethod: 'POST',
        successMessage: 'Successfully subscribed!',
        successAction: 'message',
      },
    },
  },
  {
    type: 'search-bar', label: 'Search Bar', icon: 'Search', category: 'interactive',
    description: 'Search input with button',
    defaultProps: { placeholder: 'Search...', buttonText: 'Search' },
  },
  {
    type: 'signup-form', label: 'Signup Form', icon: 'UserPlus', category: 'interactive',
    description: 'User registration form',
    defaultProps: { title: 'Create Account', showLogin: true, fields: ['name', 'email', 'password'] },
  },
  {
    type: 'social-links', label: 'Social Links', icon: 'Share2', category: 'interactive',
    description: 'Social media icon row',
    defaultProps: { title: 'Follow Us', links: [{ platform: 'twitter', url: '#' }, { platform: 'instagram', url: '#' }, { platform: 'linkedin', url: '#' }, { platform: 'youtube', url: '#' }] },
  },
  {
    type: 'tabs', label: 'Tabs (Underline)', icon: 'LayoutGrid', category: 'interactive',
    description: 'Classic underline tabs',
    defaultProps: { title: '', variant: 'underline', tabAlignment: 'center', tabs: [{ label: 'Overview', content: '<p>Overview tab content.</p>' }, { label: 'Features', content: '<p>Features here.</p>' }, { label: 'Details', content: '<p>Details go here.</p>' }] },
  },
  {
    type: 'tabs', label: 'Pill Tabs', icon: 'ToggleLeft', category: 'interactive',
    description: 'Rounded pill-style tabs',
    defaultProps: { title: 'Explore', variant: 'pills', tabAlignment: 'center', tabs: [{ label: 'All', content: '<p>All items.</p>' }, { label: 'Popular', content: '<p>Popular items.</p>' }, { label: 'Recent', content: '<p>Recent items.</p>' }] },
  },
  {
    type: 'tabs', label: 'Card Tabs', icon: 'CreditCard', category: 'interactive',
    description: 'Elevated card-style tabs',
    defaultProps: { title: 'Learn More', variant: 'cards', tabAlignment: 'center', tabs: [{ label: 'Basics', content: '<p>Start with the basics.</p>' }, { label: 'Advanced', content: '<p>Advanced techniques.</p>' }, { label: 'Pro Tips', content: '<p>Pro-level tips.</p>' }] },
  },
  {
    type: 'tabs', label: 'Vertical Tabs', icon: 'PanelLeft', category: 'interactive',
    description: 'Side navigation tabs',
    defaultProps: { title: 'Documentation', variant: 'vertical', tabs: [{ label: 'Getting Started', content: '<p>Welcome to the docs.</p>' }, { label: 'API Reference', content: '<p>API documentation.</p>' }, { label: 'Examples', content: '<p>Code examples.</p>' }, { label: 'FAQ', content: '<p>Frequently asked questions.</p>' }] },
  },
  {
    type: 'tabs', label: 'Boxed Tabs', icon: 'Square', category: 'interactive',
    description: 'Bordered box-style tabs',
    defaultProps: { title: '', variant: 'boxed', tabAlignment: 'left', tabs: [{ label: 'Tab 1', content: '<p>Content for tab 1.</p>' }, { label: 'Tab 2', content: '<p>Content for tab 2.</p>' }] },
  },
  {
    type: 'faq', label: 'FAQ Accordion', icon: 'HelpCircle', category: 'interactive',
    description: 'Expandable Q&A list',
    defaultProps: { title: 'Frequently Asked Questions', variant: 'accordion', items: [{ question: 'What is your product?', answer: 'Our product helps you build websites easily.' }, { question: 'How much does it cost?', answer: 'Plans start from $9/month.' }] },
  },
  {
    type: 'progress', label: 'Progress Bars', icon: 'Activity', category: 'interactive',
    description: 'Horizontal progress bars',
    defaultProps: { title: 'Our Skills', items: [{ label: 'Web Design', value: 95 }, { label: 'Development', value: 88 }, { label: 'Marketing', value: 75 }] },
  },
  {
    type: 'timeline', label: 'Timeline', icon: 'GitBranch', category: 'interactive',
    description: 'Vertical event timeline',
    defaultProps: { title: 'Our Journey', items: [{ date: '2020', title: 'Company Founded', description: 'Started with a vision.' }, { date: '2021', title: 'Product Launch', description: 'Released flagship product.' }, { date: '2022', title: 'Series A', description: 'Raised $10M to scale.' }] },
  },
  {
    type: 'rating', label: 'Star Rating', icon: 'Star', category: 'interactive',
    description: 'Star-based rating display',
    defaultProps: { rating: 4, maxRating: 5, label: '4.0 out of 5', size: 'md' },
  },
  {
    type: 'avatar', label: 'Avatar', icon: 'User', category: 'interactive',
    description: 'User avatar with name',
    defaultProps: { name: 'John Doe', imageUrl: '', subtitle: 'Software Engineer', size: 'md' },
  },
];

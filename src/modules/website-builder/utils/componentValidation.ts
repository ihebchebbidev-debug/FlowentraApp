// ============================================================
// Component Self-Validation Engine
// Each component type has rules that detect misconfigurations
// ============================================================

import { BuilderComponent, ComponentType } from '../types';

export type ValidationSeverity = 'error' | 'warning' | 'info';

export interface ValidationIssue {
  severity: ValidationSeverity;
  message: string;
  field?: string;
  suggestion?: string;
}

type Validator = (component: BuilderComponent, context: ValidationContext) => ValidationIssue[];

export interface ValidationContext {
  /** Position index of this component in the page (0-based) */
  index: number;
  /** Total components count on the page */
  total: number;
  /** Types of all components on the page */
  allTypes: ComponentType[];
  /** Whether a navbar exists on the page */
  hasNavbar: boolean;
  /** Whether a footer exists on the page */
  hasFooter: boolean;
}

// ── Helpers ──

function isEmpty(v: any): boolean {
  if (v == null) return true;
  if (typeof v === 'string') return v.trim() === '';
  if (Array.isArray(v)) return v.length === 0;
  return false;
}

function checkRequiredText(props: Record<string, any>, field: string, label: string): ValidationIssue | null {
  if (isEmpty(props[field])) {
    return { severity: 'error', message: `${label} is empty`, field, suggestion: `Add a ${label.toLowerCase()} to make this component effective.` };
  }
  return null;
}

function checkLink(props: Record<string, any>, field: string, label: string): ValidationIssue | null {
  const v = props[field];
  if (v && typeof v === 'string' && v !== '#' && !v.startsWith('/') && !v.startsWith('http') && !v.startsWith('mailto:')) {
    return { severity: 'warning', message: `${label} link looks invalid`, field, suggestion: 'Use a URL starting with / , http, or mailto:' };
  }
  if (v === '#' || isEmpty(v)) {
    return { severity: 'warning', message: `${label} has no link destination`, field, suggestion: 'Set a real URL or page link for better UX.' };
  }
  return null;
}

function checkEmptyArray(props: Record<string, any>, field: string, label: string, minItems = 1): ValidationIssue | null {
  if (!Array.isArray(props[field]) || props[field].length < minItems) {
    return { severity: 'warning', message: `${label} is empty or has too few items`, field, suggestion: `Add at least ${minItems} item(s).` };
  }
  return null;
}

// ── Per-type Validators ──

const VALIDATORS: Partial<Record<ComponentType, Validator>> = {
  hero: (comp, ctx) => {
    const issues: ValidationIssue[] = [];
    const t = checkRequiredText(comp.props, 'heading', 'Heading');
    if (t) issues.push(t);
    if (ctx.index > 1) {
      issues.push({ severity: 'warning', message: 'Hero should be near the top of the page', suggestion: 'Move the Hero to the first or second position for best above-the-fold impact.' });
    }
    if (comp.props.ctaText && (!comp.props.ctaLink || comp.props.ctaLink === '#')) {
      issues.push({ severity: 'warning', message: 'CTA button has no real link', field: 'ctaLink', suggestion: 'Set a destination URL for the call-to-action button.' });
    }
    if (!comp.props.ctaText) {
      issues.push({ severity: 'info', message: 'No CTA button configured', suggestion: 'Adding a call-to-action can improve conversion.' });
    }
    return issues;
  },

  navbar: (comp, ctx) => {
    const issues: ValidationIssue[] = [];
    if (ctx.index > 0) {
      issues.push({ severity: 'warning', message: 'Navbar should be the first component', suggestion: 'Move the Navbar to the top of the page.' });
    }
    if (isEmpty(comp.props.logo)) {
      issues.push({ severity: 'error', message: 'Logo text is empty', field: 'logo', suggestion: 'Add your brand name or logo.' });
    }
    if (checkEmptyArray(comp.props, 'links', 'Navigation links', 2)) {
      issues.push({ severity: 'warning', message: 'Navbar has fewer than 2 links', field: 'links', suggestion: 'Add navigation links for better site navigation.' });
    }
    return issues;
  },

  footer: (comp, ctx) => {
    const issues: ValidationIssue[] = [];
    if (ctx.index < ctx.total - 2) {
      issues.push({ severity: 'warning', message: 'Footer should be at the bottom', suggestion: 'Move the Footer to the last position on the page.' });
    }
    if (isEmpty(comp.props.companyName)) {
      issues.push({ severity: 'warning', message: 'Company name is empty', field: 'companyName', suggestion: 'Add your brand name for consistency.' });
    }
    return issues;
  },

  heading: (comp) => {
    const issues: ValidationIssue[] = [];
    if (isEmpty(comp.props.text)) {
      issues.push({ severity: 'error', message: 'Heading text is empty', field: 'text', suggestion: 'Add heading text.' });
    }
    if (comp.props.text && comp.props.text.length > 80) {
      issues.push({ severity: 'warning', message: 'Heading is very long (80+ chars)', field: 'text', suggestion: 'Keep headings concise for readability.' });
    }
    return issues;
  },

  paragraph: (comp) => {
    const issues: ValidationIssue[] = [];
    if (isEmpty(comp.props.text)) {
      issues.push({ severity: 'error', message: 'Paragraph is empty', field: 'text' });
    }
    return issues;
  },

  button: (comp) => {
    const issues: ValidationIssue[] = [];
    if (isEmpty(comp.props.text)) {
      issues.push({ severity: 'error', message: 'Button text is empty', field: 'text', suggestion: 'Add button text like "Learn More" or "Get Started".' });
    }
    const lk = checkLink(comp.props, 'href', 'Button');
    if (lk) issues.push(lk);
    return issues;
  },

  'cta-banner': (comp) => {
    const issues: ValidationIssue[] = [];
    if (isEmpty(comp.props.heading)) {
      issues.push({ severity: 'error', message: 'CTA heading is empty', field: 'heading' });
    }
    if (comp.props.ctaText && (!comp.props.ctaLink || comp.props.ctaLink === '#')) {
      issues.push({ severity: 'warning', message: 'CTA button has no link', field: 'ctaLink', suggestion: 'Set a destination so users can take action.' });
    }
    return issues;
  },

  pricing: (comp) => {
    const issues: ValidationIssue[] = [];
    const a = checkEmptyArray(comp.props, 'plans', 'Pricing plans', 2);
    if (a) issues.push(a);
    const plans = comp.props.plans;
    if (Array.isArray(plans)) {
      const hasHighlight = plans.some((p: any) => p.highlighted);
      if (!hasHighlight && plans.length > 1) {
        issues.push({ severity: 'info', message: 'No plan is highlighted', suggestion: 'Highlight one plan to guide users toward your preferred option.' });
      }
      plans.forEach((p: any, i: number) => {
        if (isEmpty(p.price)) issues.push({ severity: 'warning', message: `Plan ${i + 1} has no price`, field: 'plans' });
        if (isEmpty(p.features) || (Array.isArray(p.features) && p.features.length === 0)) {
          issues.push({ severity: 'warning', message: `Plan ${i + 1} has no features listed`, field: 'plans' });
        }
      });
    }
    return issues;
  },

  'contact-form': (comp) => {
    const issues: ValidationIssue[] = [];
    if (isEmpty(comp.props.title)) {
      issues.push({ severity: 'info', message: 'Form has no title', field: 'title', suggestion: 'Add a title like "Get in Touch" for clarity.' });
    }
    return issues;
  },

  form: (comp) => {
    const issues: ValidationIssue[] = [];
    const a = checkEmptyArray(comp.props, 'fields', 'Form fields', 1);
    if (a) issues.push(a);
    if (isEmpty(comp.props.submitText)) {
      issues.push({ severity: 'warning', message: 'Submit button text is empty', field: 'submitText' });
    }
    return issues;
  },

  'login-form': (comp) => {
    const issues: ValidationIssue[] = [];
    if (isEmpty(comp.props.title)) {
      issues.push({ severity: 'info', message: 'Login form has no title', field: 'title' });
    }
    return issues;
  },

  'signup-form': (comp) => {
    const issues: ValidationIssue[] = [];
    const fields = comp.props.fields;
    if (Array.isArray(fields) && !fields.includes('email')) {
      issues.push({ severity: 'warning', message: 'Signup form is missing email field', field: 'fields', suggestion: 'An email field is essential for user registration.' });
    }
    if (Array.isArray(fields) && !fields.includes('password')) {
      issues.push({ severity: 'warning', message: 'Signup form is missing password field', field: 'fields' });
    }
    return issues;
  },

  testimonials: (comp) => {
    const issues: ValidationIssue[] = [];
    const a = checkEmptyArray(comp.props, 'testimonials', 'Testimonials', 2);
    if (a) issues.push(a);
    const ts = comp.props.testimonials;
    if (Array.isArray(ts)) {
      ts.forEach((t: any, i: number) => {
        if (isEmpty(t.name)) issues.push({ severity: 'warning', message: `Testimonial ${i + 1} has no author name`, field: 'testimonials' });
        if (isEmpty(t.text)) issues.push({ severity: 'warning', message: `Testimonial ${i + 1} has no text`, field: 'testimonials' });
      });
    }
    return issues;
  },

  features: (comp) => {
    const issues: ValidationIssue[] = [];
    const a = checkEmptyArray(comp.props, 'features', 'Features', 2);
    if (a) issues.push(a);
    return issues;
  },

  'product-card': (comp) => {
    const issues: ValidationIssue[] = [];
    const a = checkEmptyArray(comp.props, 'products', 'Products', 1);
    if (a) issues.push(a);
    const prods = comp.props.products;
    if (Array.isArray(prods)) {
      prods.forEach((p: any, i: number) => {
        if (isEmpty(p.price)) issues.push({ severity: 'warning', message: `Product ${i + 1} has no price`, field: 'products' });
        if (isEmpty(p.name)) issues.push({ severity: 'warning', message: `Product ${i + 1} has no name`, field: 'products' });
      });
    }
    return issues;
  },

  'product-detail': (comp) => {
    const issues: ValidationIssue[] = [];
    if (isEmpty(comp.props.name)) issues.push({ severity: 'error', message: 'Product name is empty', field: 'name' });
    if (isEmpty(comp.props.price)) issues.push({ severity: 'error', message: 'Price is empty', field: 'price' });
    if (isEmpty(comp.props.images) || (Array.isArray(comp.props.images) && comp.props.images.length === 0)) {
      issues.push({ severity: 'warning', message: 'No product images added', field: 'images', suggestion: 'Products with images convert much better.' });
    }
    return issues;
  },

  'image-gallery': (comp) => {
    const issues: ValidationIssue[] = [];
    if (isEmpty(comp.props.images)) {
      issues.push({ severity: 'warning', message: 'Gallery has no images', field: 'images' });
    }
    return issues;
  },

  'lightbox-gallery': (comp) => {
    const issues: ValidationIssue[] = [];
    if (isEmpty(comp.props.images)) {
      issues.push({ severity: 'warning', message: 'Gallery has no images', field: 'images' });
    }
    return issues;
  },

  newsletter: (comp) => {
    const issues: ValidationIssue[] = [];
    if (isEmpty(comp.props.title)) {
      issues.push({ severity: 'info', message: 'Newsletter has no title', field: 'title' });
    }
    return issues;
  },

  faq: (comp) => {
    const issues: ValidationIssue[] = [];
    const a = checkEmptyArray(comp.props, 'items', 'FAQ items', 2);
    if (a) issues.push(a);
    return issues;
  },

  'custom-html': (comp) => {
    const issues: ValidationIssue[] = [];
    if (isEmpty(comp.props.code)) {
      issues.push({ severity: 'warning', message: 'Custom HTML block is empty', field: 'code' });
    }
    if (comp.props.code && /<script/i.test(comp.props.code)) {
      issues.push({ severity: 'info', message: 'Contains <script> tags', suggestion: 'Scripts may not execute in all contexts. Consider testing in preview.' });
    }
    return issues;
  },

  'announcement-bar': (comp) => {
    const issues: ValidationIssue[] = [];
    if (isEmpty(comp.props.text)) {
      issues.push({ severity: 'error', message: 'Announcement text is empty', field: 'text' });
    }
    return issues;
  },

  countdown: (comp) => {
    const issues: ValidationIssue[] = [];
    if (comp.props.targetDate) {
      const target = new Date(comp.props.targetDate);
      if (target < new Date()) {
        issues.push({ severity: 'warning', message: 'Countdown target date is in the past', field: 'targetDate', suggestion: 'Update the target date to a future date.' });
      }
    }
    return issues;
  },
};

// ── Page-level Validators ──

function validatePageStructure(components: BuilderComponent[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const types = components.map(c => c.type);

  if (!types.includes('navbar') && components.length > 2) {
    issues.push({ severity: 'info', message: 'Page has no navigation bar', suggestion: 'Add a Navbar for site-wide navigation.' });
  }
  if (!types.includes('footer') && components.length > 2) {
    issues.push({ severity: 'info', message: 'Page has no footer', suggestion: 'Add a Footer with links and copyright.' });
  }

  const heroCount = types.filter(t => t === 'hero').length;
  if (heroCount > 1) {
    issues.push({ severity: 'warning', message: `Page has ${heroCount} Hero sections`, suggestion: 'Use only one Hero per page for best results.' });
  }

  const navCount = types.filter(t => t === 'navbar' || t === 'mega-menu').length;
  if (navCount > 1) {
    issues.push({ severity: 'warning', message: 'Multiple navigation bars detected', suggestion: 'Use one navbar per page.' });
  }

  return issues;
}

// ── Main API ──

export function validateComponent(component: BuilderComponent, context: ValidationContext): ValidationIssue[] {
  const validator = VALIDATORS[component.type];
  return validator ? validator(component, context) : [];
}

export function validatePage(components: BuilderComponent[]): { componentIssues: Map<string, ValidationIssue[]>; pageIssues: ValidationIssue[] } {
  const allTypes = components.map(c => c.type);
  const hasNavbar = allTypes.includes('navbar') || allTypes.includes('mega-menu');
  const hasFooter = allTypes.includes('footer');

  const componentIssues = new Map<string, ValidationIssue[]>();

  components.forEach((comp, index) => {
    const context: ValidationContext = { index, total: components.length, allTypes, hasNavbar, hasFooter };
    const issues = validateComponent(comp, context);
    if (issues.length > 0) {
      componentIssues.set(comp.id, issues);
    }
  });

  const pageIssues = validatePageStructure(components);

  return { componentIssues, pageIssues };
}

export function getIssueCounts(issues: ValidationIssue[]): { errors: number; warnings: number; infos: number } {
  return {
    errors: issues.filter(i => i.severity === 'error').length,
    warnings: issues.filter(i => i.severity === 'warning').length,
    infos: issues.filter(i => i.severity === 'info').length,
  };
}

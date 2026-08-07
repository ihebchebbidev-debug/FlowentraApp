import { SiteTemplate } from '../index';
import { IMG } from '../images';
import { comp, page, makeFooter } from '../helpers';
import { SAAS_THEME } from '../themes';

/**
 * Coming Soon — single-page launch template.
 * High-demand starting point for every new site: countdown, email capture,
 * social links, and a bold cinematic hero.
 */
export const comingSoonTemplate: SiteTemplate = {
  id: 'coming-soon',
  name: 'Coming Soon / Launch',
  description: 'Elegant single-page launch site with countdown, email waitlist, social links and a cinematic hero.',
  icon: '🚀',
  category: 'Launch',
  theme: SAAS_THEME,
  pageCount: 1,
  features: [
    'Cinematic hero', 'Live countdown', 'Waitlist signup',
    'Social links', 'Announcement bar', 'Scroll to top',
  ],
  previewImage: IMG.saasHero || IMG.consultHero,
  pages: () => {
    const foot = makeFooter(
      'Something Big',
      'Coming very soon.',
      '',
      'hello@example.com',
      {
        links: [
          { label: 'Home', href: '#' },
          { label: 'Notify Me', href: '#notify' },
          { label: 'Contact', href: '#contact' },
        ],
        socialLinks: [
          { platform: 'twitter', url: '#' },
          { platform: 'instagram', url: '#' },
          { platform: 'linkedin', url: '#' },
        ],
      },
    );

    // Launch date defaults to ~30 days out
    const launchDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    return [
      page(
        'Home',
        '',
        [
          comp('announcement-bar', 'Announcement', {
            text: '✨ Something incredible is on the way — be the first to know.',
            linkText: 'Join waitlist →',
            linkUrl: '#notify',
            variant: 'primary',
          }),
          comp('hero', 'Hero', {
            heading: 'The future is almost here.',
            subheading: 'We\'re putting the finishing touches on something we can\'t wait to share with you. Join the waitlist for early access, exclusive perks, and launch day surprises.',
            ctaText: 'Notify Me',
            ctaLink: '#notify',
            secondaryCtaText: 'Follow the Journey',
            secondaryCtaLink: '#social',
            alignment: 'center',
            height: 'large',
            variant: 'gradient',
            backgroundImage: IMG.saasHero || IMG.consultHero,
            overlayOpacity: 65,
          }),
          comp('countdown', 'Countdown', {
            title: 'Launching In',
            targetDate: launchDate,
            variant: 'cards',
            showLabels: true,
            bgColor: 'transparent',
          }),
          comp('features', 'What to Expect', {
            title: 'What to Expect',
            subtitle: 'A quick preview of what we\'ve been building.',
            columns: 3,
            features: [
              { icon: '⚡', title: 'Lightning Fast', description: 'Built for performance from the ground up. Instant everywhere.' },
              { icon: '🎨', title: 'Beautiful by Default', description: 'A design so polished you\'ll want to show it off.' },
              { icon: '🔒', title: 'Private & Secure', description: 'Your data is encrypted, isolated, and always yours to own.' },
            ],
          }),
          comp('newsletter', 'Notify', {
            title: 'Be First in Line',
            subtitle: 'Drop your email below and we\'ll ping you the moment we\'re live. No spam, ever.',
            placeholder: 'you@example.com',
            buttonText: 'Notify Me',
            variant: 'split',
            showIcon: true,
            iconType: 'sparkles',
          }),
          comp('social-links', 'Social', {
            title: 'Follow the Build',
            subtitle: 'We share weekly progress, sneak peeks, and behind-the-scenes stories.',
            links: [
              { platform: 'twitter', url: '#', label: '@building' },
              { platform: 'instagram', url: '#', label: 'Instagram' },
              { platform: 'linkedin', url: '#', label: 'LinkedIn' },
              { platform: 'youtube', url: '#', label: 'YouTube' },
            ],
            variant: 'cards',
          }),
          comp('faq', 'FAQ', {
            title: 'Questions',
            items: [
              { question: 'When does it launch?', answer: 'We\'re targeting the date on the countdown above. Join the waitlist and you\'ll be the first to know if that shifts.' },
              { question: 'Is there a waitlist perk?', answer: 'Yes — everyone on the waitlist gets 30 days of the top tier for free at launch, plus a founding-member badge.' },
              { question: 'How can I get in touch?', answer: 'Email us at hello@example.com or reply to the confirmation you\'ll get after joining the waitlist.' },
            ],
          }),
          comp('cta-banner', 'CTA', {
            heading: 'Don\'t miss the launch.',
            subheading: 'Join thousands of others already on the list.',
            ctaText: 'Join Waitlist',
            ctaLink: '#notify',
          }),
          comp('scroll-to-top', 'Scroll', { position: 'bottom-right' }),
          foot(),
        ],
        true,
        0,
      ),
    ];
  },
};

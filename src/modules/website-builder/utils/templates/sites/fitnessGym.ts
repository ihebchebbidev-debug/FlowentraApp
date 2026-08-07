import { SiteTemplate } from '../index';
import { IMG, AVATAR } from '../images';
import { comp, page, makeNavbar, makeFooter } from '../helpers';
import { FITNESS_THEME } from '../themes';

export const fitnessGymTemplate: SiteTemplate = {
  id: 'fitness-gym',
  name: 'Fitness & Gym',
  description: 'Bold dark-themed gym website with membership plans, class schedules, trainers and transformation stories.',
  icon: '💪',
  category: 'Fitness',
  theme: FITNESS_THEME,
  pageCount: 4,
  features: [
    'Hero with image', 'Animated stats', 'Membership plans', 'Comparison table',
    'Trainer profiles', 'Gallery', 'Marquee', 'Trust badges', 'Newsletter',
    'WhatsApp', 'Parallax section', 'FAQ',
  ],
  previewImage: IMG.fitnessHero,
  pages: () => {
    const nav = makeNavbar('💪 IronForge Gym', [
      { label: 'Home', href: '#' },
      { label: 'Programs', href: '#programs' },
      { label: 'Trainers', href: '#trainers' },
      { label: 'Join', href: '#join' },
    ], 'Start Free Trial');

    const foot = makeFooter('IronForge Gym', 'Forge your strongest self', '(555) 222-3333', 'info@ironforge.com', {
      links: [
        { label: 'Home', href: '#' },
        { label: 'Programs', href: '#programs' },
        { label: 'Trainers', href: '#trainers' },
        { label: 'Join', href: '#join' },
      ],
      socialLinks: [
        { platform: 'instagram', url: '#' },
        { platform: 'facebook', url: '#' },
        { platform: 'youtube', url: '#' },
        { platform: 'tiktok', url: '#' },
      ],
    });

    return [
      // ═══════════════════════════════════════════════════
      // HOME
      // ═══════════════════════════════════════════════════
      page('Home', '', [
        nav(),
        comp('marquee', 'Promo', {
          text: '🔥 NEW YEAR SPECIAL — First month FREE with annual membership • Join today! 🔥',
          speed: 25,
        }),
        comp('hero', 'Hero', {
          heading: 'FORGE YOUR STRONGEST SELF',
          subheading: 'State-of-the-art equipment, expert trainers, 24/7 access. Your transformation starts now.',
          ctaText: 'Start Free Trial', ctaLink: '#join',
          secondaryCtaText: 'View Programs', secondaryCtaLink: '#programs',
          alignment: 'center', height: 'large',
          backgroundImage: IMG.fitnessHero, overlayOpacity: 55,
        }),
        comp('trust-badges', 'Trust', {
          title: 'The IronForge Difference',
          badges: [
            { icon: '🏋️', label: 'Pro Equipment' },
            { icon: '🕐', label: '24/7 Access' },
            { icon: '👨‍🏫', label: 'Expert Trainers' },
            { icon: '🧖', label: 'Sauna & Recovery' },
          ],
        }),
        comp('animated-stats', 'Stats', {
          stats: [
            { value: '5000', label: 'Members', suffix: '+' },
            { value: '50', label: 'Classes/Week', suffix: '+' },
            { value: '20', label: 'Expert Trainers' },
            { value: '24/7', label: 'Access' },
          ],
          variant: 'gradient', columns: 4, animationStyle: 'count',
        }),
        comp('service-card', 'Programs', {
          title: 'Training Programs', bgColor: '#111111',
          services: [
            { icon: '🏋️', title: 'Strength Training', description: 'Build muscle and power with our advanced free weights and machines.', price: '' },
            { icon: '🥊', title: 'Boxing & MMA', description: 'Learn striking, grappling, and self-defense with pro coaches.', price: '' },
            { icon: '🧘', title: 'Yoga & Recovery', description: 'Stretch, recover, and find balance with restorative practices.', price: '' },
            { icon: '🏃', title: 'HIIT Classes', description: 'High-intensity interval training for maximum calorie burn.', price: '' },
            { icon: '🚴', title: 'Spin Studio', description: 'Immersive cycling classes with energizing music and lighting.', price: '' },
            { icon: '💪', title: 'CrossFit', description: 'Functional fitness with Olympic lifts and WODs.', price: '' },
          ],
        }),
        comp('lightbox-gallery', 'Gallery', {
          title: 'Our Facility', columns: 3,
          images: [
            { url: IMG.gym1, caption: 'Modern Equipment' },
            { url: IMG.gym2, caption: 'Training Zone' },
            { url: IMG.gym3, caption: 'Free Weights Area' },
          ],
        }),
        comp('parallax', 'Parallax', {
          imageUrl: IMG.gym2,
          heading: 'No Excuses. No Limits.',
          subheading: 'Open 24/7, 365 days a year',
          height: 'small', overlayOpacity: 65,
        }),
        comp('pricing', 'Plans', {
          title: 'Membership Plans', bgColor: '#111111',
          plans: [
            { name: 'Basic', price: '$29/mo', features: ['Gym access', 'Locker room', 'Free WiFi', 'Water station'], highlighted: false },
            { name: 'Pro', price: '$59/mo', features: ['Everything in Basic', 'All group classes', 'Sauna & steam', '1 PT session/mo', 'Guest passes (2/mo)'], highlighted: true },
            { name: 'Elite', price: '$99/mo', features: ['Everything in Pro', 'Unlimited PT', 'Custom meal plans', 'Recovery suite', 'Priority booking'], highlighted: false },
          ],
        }),
        comp('testimonials', 'Reviews', {
          title: 'Transformation Stories', variant: 'carousel', bgColor: '#0d0d0d',
          testimonials: [
            { name: 'Marcus J.', role: 'Lost 50 lbs', text: 'IronForge changed my life. The trainers kept me accountable and the community keeps me coming back.', rating: 5, avatar: AVATAR.m1 },
            { name: 'Elena V.', role: 'Marathon Runner', text: 'The HIIT and recovery classes prepared me for my first marathon. Best gym I\'ve ever been to.', rating: 5, avatar: AVATAR.w2 },
            { name: 'Jake R.', role: 'Gained 30 lbs muscle', text: 'The strength coaches designed a program that took me from beginner to competition-ready in 8 months.', rating: 5, avatar: AVATAR.m3 },
          ],
        }),
        comp('faq', 'FAQ', {
          title: 'Common Questions', variant: 'accordion',
          items: [
            { question: 'Can I try before committing?', answer: 'Absolutely! We offer a free 7-day trial with full access to all facilities and classes.' },
            { question: 'Are there any contracts?', answer: 'No long-term contracts. All memberships are month-to-month with the option to cancel anytime.' },
            { question: 'Do I need to book classes in advance?', answer: 'We recommend booking 24 hours ahead for popular classes, but walk-ins are welcome when space permits.' },
          ],
        }),
        comp('cta-banner', 'CTA', {
          heading: 'Ready to Transform?',
          subheading: 'Join today and get your first week free. No contracts, cancel anytime.',
          ctaText: 'Claim Free Trial', ctaLink: '#join',
        }),
        comp('newsletter', 'Newsletter', {
          title: 'Fitness Tips & Deals',
          subtitle: 'Get workout plans, nutrition tips, and member-only offers.',
          placeholder: 'Your email', buttonText: 'Subscribe',
          variant: 'split', showIcon: true, iconType: 'zap',
        }),
        comp('whatsapp-button', 'WhatsApp', {
          phoneNumber: '+15552223333',
          defaultMessage: 'Hi! I\'m interested in a gym membership.',
          position: 'bottom-right', showGreeting: true,
          greetingText: 'Ready to start your fitness journey? 💪',
          agentName: 'IronForge', pulseAnimation: true,
        }),
        comp('scroll-to-top', 'Scroll', { position: 'bottom-right', offsetY: 90 }),
        foot(),
      ], true, 0),

      // ═══════════════════════════════════════════════════
      // PROGRAMS
      // ═══════════════════════════════════════════════════
      page('Programs', 'programs', [
        nav(),
        comp('hero', 'Programs', {
          heading: 'Our Programs',
          subheading: 'Something for every fitness level and goal.',
          alignment: 'center', height: 'medium',
          backgroundImage: IMG.gym2, overlayOpacity: 60,
        }),
        comp('service-card', 'All Programs', {
          title: 'All Programs',
          services: [
            { icon: '🏋️', title: 'Powerlifting', description: 'Squat, bench, deadlift coaching with certified strength coaches.', price: '' },
            { icon: '🥊', title: 'Boxing', description: 'Technique, sparring, conditioning with former pro fighters.', price: '' },
            { icon: '🧘', title: 'Yoga', description: 'Vinyasa, hot yoga, meditation, and mindfulness sessions.', price: '' },
            { icon: '🏃', title: 'CrossFit', description: 'WODs, Olympic lifting, gymnastics, and community workouts.', price: '' },
          ],
        }),
        comp('comparison-table', 'Compare', {
          title: 'Membership Comparison',
          headers: ['Feature', 'Basic', 'Pro', 'Elite'],
          rows: [
            { feature: 'Gym Access', values: ['true', 'true', 'true'] },
            { feature: 'Group Classes', values: ['false', 'true', 'true'] },
            { feature: 'Sauna & Steam', values: ['false', 'true', 'true'] },
            { feature: 'Personal Training', values: ['false', '1x/mo', 'Unlimited'] },
            { feature: 'Meal Plans', values: ['false', 'false', 'true'] },
            { feature: 'Recovery Suite', values: ['false', 'false', 'true'] },
          ],
        }),
        foot(),
      ], false, 1),

      // ═══════════════════════════════════════════════════
      // TRAINERS
      // ═══════════════════════════════════════════════════
      page('Trainers', 'trainers', [
        nav(),
        comp('hero', 'Trainers', {
          heading: 'Our Trainers',
          subheading: 'Certified experts ready to guide your transformation.',
          alignment: 'center', height: 'small',
        }),
        comp('team-grid', 'Trainers', {
          title: 'Meet the Team',
          members: [
            { name: 'Marcus Johnson', role: 'Head Coach', bio: 'NSCA certified, 12 years experience. Strength specialist.', avatar: AVATAR.m3 },
            { name: 'Elena Volkov', role: 'Yoga & Recovery', bio: 'RYT-500, mindfulness and mobility expert.', avatar: AVATAR.w2 },
            { name: 'Jake Rodriguez', role: 'Boxing Coach', bio: 'Former professional boxer. 200+ fighters trained.', avatar: AVATAR.m4 },
            { name: 'Aria Patel', role: 'Nutritionist', bio: 'MS in Sports Nutrition. Custom meal plans.', avatar: AVATAR.w4 },
          ],
        }),
        comp('animated-stats', 'Trainer Stats', {
          stats: [
            { value: '50', label: 'Combined Years', suffix: '+' },
            { value: '200', label: 'Certifications', suffix: '+' },
            { value: '10000', label: 'Lives Changed', suffix: '+' },
            { value: '100', label: 'Client Satisfaction', suffix: '%' },
          ],
          variant: 'bar', columns: 4, animationStyle: 'count', bgColor: '#111111',
        }),
        foot(),
      ], false, 2),

      // ═══════════════════════════════════════════════════
      // JOIN
      // ═══════════════════════════════════════════════════
      page('Join', 'join', [
        nav(),
        comp('hero', 'Join', {
          heading: 'Start Your Journey',
          subheading: 'Join today and get your first week free. No contracts.',
          alignment: 'center', height: 'small',
        }),
        comp('pricing', 'Plans', {
          title: 'Choose Your Plan',
          plans: [
            { name: 'Basic', price: '$29/mo', features: ['Gym access', 'Locker room', 'Free WiFi'], highlighted: false },
            { name: 'Pro', price: '$59/mo', features: ['All group classes', 'Sauna access', '1 PT session/mo'], highlighted: true },
            { name: 'Elite', price: '$99/mo', features: ['Unlimited PT', 'Meal plans', 'Recovery suite'], highlighted: false },
          ],
        }),
        comp('contact-form', 'Form', {
          title: 'Sign Up',
          subtitle: 'Fill out the form and we\'ll set up your free trial.',
          fields: ['name', 'email', 'phone', 'message'],
          submitText: 'Start Free Trial', variant: 'card', showIcon: true,
        }),
        foot(),
      ], false, 3),
    ];
  },
};

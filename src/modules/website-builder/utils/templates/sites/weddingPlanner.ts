import { SiteTemplate } from '../index';
import { IMG, AVATAR } from '../images';
import { comp, page, makeNavbar, makeFooter } from '../helpers';
import { WEDDING_THEME } from '../themes';

export const weddingPlannerTemplate: SiteTemplate = {
  id: 'wedding-planner',
  name: 'Wedding Planner',
  description: 'Editorial wedding planning site with oversized typography, pull-quote stories, planning chapters and an inquiry form.',
  icon: '💒',
  category: 'Events',
  theme: WEDDING_THEME,
  pageCount: 4,
  isNew: true,
  features: [
    'Editorial hero',
    'Numbered planning chapters',
    'Pull-quote love stories',
    'Gallery & timeline',
    'Inquiry form',
    'Trust badges',
    'Newsletter',
    'WhatsApp',
    'Social links',
  ],
  previewImage: IMG.weddingHero,
  pages: () => {
    const nav = makeNavbar(
      '💒 Ever After Events',
      [
        { label: 'Home', href: '#' },
        { label: 'Services', href: '#services' },
        { label: 'Gallery', href: '#gallery' },
        { label: 'Contact', href: '#contact' },
      ],
      'Plan My Wedding',
    );

    const foot = makeFooter(
      'Ever After Events',
      'Creating perfect celebrations',
      '(555) 333-4444',
      'hello@everafter.com',
      {
        links: [
          { label: 'Home', href: '#' },
          { label: 'Services', href: '#services' },
          { label: 'Gallery', href: '#gallery' },
          { label: 'Contact', href: '#contact' },
        ],
        socialLinks: [
          { platform: 'instagram', url: '#' },
          { platform: 'pinterest', url: '#' },
          { platform: 'tiktok', url: '#' },
          { platform: 'facebook', url: '#' },
        ],
      },
    );

    return [
      page(
        'Home',
        '',
        [
          nav(),

          // Editorial hero — single statement, large image right
          comp('hero', 'Hero', {
            variant: 'editorial',
            heading: 'A Wedding,<br/>Composed With Care.',
            subheading: 'Full-service planning and creative direction for couples who want the day to feel like them — every flower, light cue and quiet moment in its right place.',
            ctaText: 'Start Planning',
            ctaLink: '#contact',
            secondaryCtaText: 'View Our Work',
            secondaryCtaLink: '#gallery',
            height: 'large',
            splitImage: IMG.weddingHero,
            splitPosition: 'right',
          }),

          comp('trust-badges', 'Trust', {
            title: 'Why Couples Choose Us',
            badges: [
              { icon: '💍', label: '500+ Weddings' },
              { icon: '⭐', label: '5-Star Rated' },
              { icon: '🏆', label: 'Award-Winning' },
              { icon: '🤝', label: '50+ Venue Partners' },
            ],
          }),

          comp('animated-stats', 'Stats', {
            stats: [
              { value: '500', label: 'Weddings Planned', suffix: '+' },
              { value: '8', label: 'Years Experience', suffix: '+' },
              { value: '100', label: 'Happy Couples', suffix: '%' },
              { value: '50', label: 'Venue Partners', suffix: '+' },
            ],
            variant: 'cards',
            columns: 4,
            animationStyle: 'count',
          }),

          // Numbered planning chapters — replaces generic 4-up grid
          comp('features', 'What We Do', {
            variant: 'numbered-chapters',
            title: 'How a Day Becomes Yours',
            subtitle: 'Four chapters, one shared vision. Every wedding starts with listening — then a year of careful, deliberate craft.',
            features: [
              { icon: 'Compass', title: 'Vision & Venue', description: 'We start with a conversation about who you are. From that, the aesthetic, the rhythm, and the right venue follow naturally.' },
              { icon: 'Palette', title: 'Design Direction', description: 'Bespoke floral, lighting and material choices — sourced from a curated network of artisans who care about detail the way we do.' },
              { icon: 'Users', title: 'Vendor Orchestration', description: 'A trusted team of photographers, caterers and musicians, briefed and coordinated so nothing feels accidental on the day.' },
              { icon: 'Sparkles', title: 'The Day Itself', description: 'A senior planner on the ground from sunrise. You greet guests; we handle every cue, transition and quiet save.' },
            ],
          }),

          comp('lightbox-gallery', 'Gallery', {
            title: 'Our Beautiful Weddings',
            columns: 3,
            images: [
              { url: IMG.wedding1, caption: 'Garden Ceremony' },
              { url: IMG.wedding2, caption: 'Reception Magic' },
              { url: IMG.wedding3, caption: 'Floral Design' },
              { url: IMG.wedding4, caption: 'Sunset Vows' },
              { url: IMG.wedding5, caption: 'Bridal Party' },
              { url: IMG.wedding6, caption: 'First Dance' },
            ],
          }),

          comp('pricing', 'Packages', {
            title: 'Planning Packages',
            plans: [
              { name: 'Day-Of', price: '$1,500', features: ['Timeline creation', 'Vendor coordination', 'Ceremony management', 'Reception oversight'], highlighted: false },
              { name: 'Partial Planning', price: '$4,500', features: ['Everything in Day-Of', 'Vendor recommendations', 'Budget management', '3 planning sessions', 'Design direction'], highlighted: true },
              { name: 'Full Planning', price: '$8,500', features: ['Everything in Partial', 'Complete design', 'Unlimited consultations', 'Venue selection', 'Rehearsal coordination'], highlighted: false },
            ],
          }),

          comp('timeline', 'Planning', {
            title: 'Your Planning Journey',
            items: [
              { date: '12 Months', title: 'Vision & Venue', description: 'Define your style, set the budget, and secure the perfect venue.' },
              { date: '9 Months', title: 'Vendor Team', description: 'Book photographer, caterer, florist, and entertainment.' },
              { date: '6 Months', title: 'Design & Details', description: 'Invitations, décor, menu tasting, and attire fittings.' },
              { date: '1 Month', title: 'Final Prep', description: 'Timeline finalization, rehearsal, and last-minute details.' },
            ],
          }),

          // Editorial pull-quote testimonials
          comp('testimonials', 'Reviews', {
            variant: 'editorial-quote',
            title: 'Love Stories',
            bgColor: '#fff5f7',
            testimonials: [
              { name: 'Emily & James', role: 'Married Oct 2025', text: 'Every single detail was perfect. The day moved like a piece of music — and we didn\'t have to think about a single transition.', rating: 5, avatar: AVATAR.w1 },
              { name: 'Sofia & Michael', role: 'Married Jun 2025', text: 'A dream made real. They turned a folder of scraps and Pinterest pins into the most considered, beautiful day of our lives.', rating: 5, avatar: AVATAR.w3 },
              { name: 'Hana & Ryan', role: 'Married Mar 2025', text: 'We trusted them with the people, the place, the timing — everything. They handed us back a day we\'ll remember frame by frame.', rating: 5, avatar: AVATAR.w2 },
            ],
          }),

          comp('parallax', 'Parallax', { imageUrl: IMG.weddingHero, heading: 'Your Perfect Day Awaits', subheading: 'Let us make your wedding dreams a reality', height: 'small', overlayOpacity: 45 }),

          comp('cta-banner', 'CTA', {
            heading: 'Ready to Start Planning?',
            subheading: 'Book a free consultation and let\'s create your perfect day together.',
            ctaText: 'Free Consultation',
            ctaLink: '#contact',
          }),

          comp('newsletter', 'Newsletter', {
            title: 'Wedding Inspiration',
            subtitle: 'Get planning tips, trends, and exclusive venue spotlights.',
            placeholder: 'Your email',
            buttonText: 'Subscribe',
            variant: 'split',
            showIcon: true,
            iconType: 'heart',
          }),

          comp('whatsapp-button', 'WhatsApp', {
            phoneNumber: '+15553334444',
            defaultMessage: 'Hi! I\'m interested in wedding planning services.',
            position: 'bottom-right',
            showGreeting: true,
            greetingText: 'Hi! 💒 Planning a wedding?',
            agentName: 'Ever After Events',
            pulseAnimation: true,
          }),
          comp('scroll-to-top', 'Scroll', { position: 'bottom-right', offsetY: 90 }),
          foot(),
        ],
        true,
        0,
      ),

      page(
        'Services',
        'services',
        [
          nav(),
          comp('hero', 'Services', {
            variant: 'editorial',
            heading: 'Our Services',
            subheading: 'Comprehensive wedding planning for every couple — pick the level of involvement that fits your day.',
            height: 'medium',
            splitImage: IMG.wedding3,
            splitPosition: 'left',
          }),
          comp('features', 'Services', {
            variant: 'numbered-chapters',
            title: 'What We Offer',
            features: [
              { icon: 'ClipboardList', title: 'Full Planning', description: 'Complete management from engagement to honeymoon — venue, design, vendors, the lot.' },
              { icon: 'Palette', title: 'Custom Design', description: 'Bespoke décor, floral and styling services tailored to your colour story and venue.' },
              { icon: 'Handshake', title: 'Day-Of Coordination', description: 'Seamless execution on your wedding day with a senior planner on the ground.' },
              { icon: 'MapPin', title: 'Destination Weddings', description: 'Planning for weddings anywhere in the world, with trusted partners on the ground.' },
            ],
          }),
          comp('faq', 'FAQ', {
            title: 'Common Questions',
            items: [
              { question: 'How far in advance should I book?', answer: '12-18 months for full planning, 6-8 months for partial, 2-3 months for day-of coordination.' },
              { question: 'Do you handle destination weddings?', answer: 'Yes — we plan destination weddings worldwide and have partnerships with venues across the globe.' },
            ],
          }),
          foot(),
        ],
        false,
        1,
      ),

      page(
        'Gallery',
        'gallery',
        [
          nav(),
          comp('hero', 'Gallery', { heading: 'Wedding Gallery', subheading: 'Moments we helped create.', alignment: 'center', height: 'small' }),
          comp('lightbox-gallery', 'Gallery', {
            title: 'Recent Celebrations',
            columns: 3,
            images: [
              { url: IMG.wedding1, caption: 'The Anderson Wedding' },
              { url: IMG.wedding2, caption: 'The Chen Reception' },
              { url: IMG.wedding3, caption: 'Spring Garden Party' },
              { url: IMG.wedding4, caption: 'Beach Sunset Ceremony' },
              { url: IMG.wedding5, caption: 'The Williams Celebration' },
              { url: IMG.wedding6, caption: 'Classic Ballroom' },
            ],
          }),
          comp('social-links', 'Social', {
            title: 'Follow Our Work',
            links: [
              { platform: 'instagram', url: '#', label: '@everafterevents' },
              { platform: 'pinterest', url: '#', label: 'Inspiration' },
              { platform: 'tiktok', url: '#', label: 'Behind the Scenes' },
            ],
            variant: 'cards',
          }),
          foot(),
        ],
        false,
        2,
      ),

      page(
        'Contact',
        'contact',
        [
          nav(),
          comp('hero', 'Contact', { heading: 'Let\'s Plan Your Day', subheading: 'Tell us about your dream wedding and we\'ll make it happen.', alignment: 'center', height: 'small' }),
          comp('contact-form', 'Form', {
            title: 'Wedding Inquiry',
            subtitle: 'We respond within 24 hours.',
            fields: ['name', 'email', 'phone', 'message'],
            submitText: 'Send Inquiry',
            variant: 'card',
            showIcon: true,
          }),
          comp('icon-text', 'Info', {
            items: [
              { icon: '📞', title: 'Phone', description: '(555) 333-4444' },
              { icon: '📧', title: 'Email', description: 'hello@everafter.com' },
              { icon: '📍', title: 'Studio', description: 'Los Angeles, CA' },
            ],
            layout: 'horizontal',
          }),
          foot(),
        ],
        false,
        3,
      ),
    ];
  },
};

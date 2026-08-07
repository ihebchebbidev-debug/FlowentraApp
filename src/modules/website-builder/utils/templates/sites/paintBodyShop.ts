import { SiteTemplate } from '../index';
import { IMG, AVATAR, comp, page } from '../index';
import { BODY_SHOP_THEME } from '../themes';

// ─── Bilingual content ─────────────────────────────────────────
const C = {
  en: {
    nav: [
      { label: 'Home', href: '#' },
      { label: 'Services', href: '#services' },
      { label: 'Gallery', href: '#gallery' },
      { label: 'Reviews', href: '#reviews' },
      { label: 'Contact', href: '#contact' },
    ],
    cta: 'Get a Free Quote',
    heroHeading: 'GETTING YOUR VEHICLE\nBACK ON THE ROAD.',
    heroSub: 'We can restore your car or van to its former glory. From minor dent repairs to a total respray, accident repair or full body restoration, we are your local, friendly vehicle body repair specialists.',
    heroBtn: 'Find out more',
    // 3 value props
    valueProps: [
      { icon: 'MessageCircle', title: 'Enquire for Free', description: 'Ask us about any repair you need and we\'ll give you a full breakdown of cost, time and process so you can make the right choice for your vehicle.' },
      { icon: 'ShieldCheck', title: 'Trusted Repairs', description: 'Our team has decades of combined experience, using the latest tools and techniques. All work is backed by our quality guarantee.' },
      { icon: 'BadgePoundSterling', title: 'Competitive Pricing', description: 'We keep our prices fair and transparent. No hidden fees, no surprises — just honest quotes and outstanding results.' },
    ],
    // Services
    services: [
      { title: 'PAINT REPAIR', description: 'From a small chip or scratch to a full panel respray, our paint repair service will restore your vehicle\'s finish to showroom quality. We use manufacturer-matched paints for a seamless result.', image: IMG.paintRepair },
      { title: 'DENT REPAIR', description: 'Has your car picked up an unsightly dent? Our technicians use PDR (Paintless Dent Removal) and traditional methods to make them disappear so your car looks good as new.', image: IMG.dentRepair },
      { title: 'PANEL REPAIR', description: 'Whether it\'s a crumpled bumper or dented wing, our skilled panel beaters will reshape or replace damaged bodywork. We restore structural integrity and visual perfection.', image: IMG.panelRepair },
      { title: 'SCRATCH REPAIR', description: 'Car park scratches and key marks can be removed with our expert scratch repair service. We blend and polish to ensure no trace remains.', image: IMG.scratchRepair },
      { title: 'INSURANCE REPAIR', description: 'We work with all major insurers to handle your claim from start to finish. Let us take the stress out of accident repair — we manage the process for you.', image: IMG.insuranceRepair },
      { title: 'MOTORCYCLE REPAIR', description: 'From fairings to fuel tanks, our body shop handles motorcycle paint and panel repairs with the same precision and care we give to every vehicle.', image: IMG.motorcycleRepair },
    ],
    happyTitle: '1000\'S OF HAPPY CUSTOMERS.',
    testimonials: [
      { name: 'James Wilson', role: 'BMW Owner', text: 'Incredible work on my bumper repair. You can\'t tell it was ever damaged. Highly recommended!', rating: 5, avatar: AVATAR.m1 },
      { name: 'Sophie Martin', role: 'Audi Owner', text: 'Fast turnaround, fair price, and the paint match is absolutely perfect. Will use again.', rating: 5, avatar: AVATAR.w1 },
      { name: 'Robert Taylor', role: 'Mercedes Owner', text: 'Professional from start to finish. They handled my insurance claim and the repair was flawless.', rating: 5, avatar: AVATAR.m2 },
      { name: 'Emma Davies', role: 'Motorcycle Owner', text: 'Fixed my bike fairing beautifully. These guys know what they\'re doing. 5 stars.', rating: 5, avatar: AVATAR.w2 },
    ],
    testimonialsTitle: 'What Our Customers Say',
    ctaHeading: 'NEED A REPAIR?',
    ctaSub: 'If you are looking for a reliable vehicle body repair specialist, look no further. We are here to help you get your vehicle back on the road in perfect condition.',
    ctaBtn: 'Get your free quote',
    faqTitle: 'HAVE ANOTHER QUESTION?',
    faqItems: [
      { question: 'How long does a typical repair take?', answer: 'Most minor repairs are completed within 1-3 days. Larger jobs like full resprays may take 5-7 working days. We\'ll always give you a clear timeline upfront.' },
      { question: 'Do you offer a courtesy car?', answer: 'Yes, we can arrange a courtesy car for the duration of your repair. Just ask when you book in.' },
      { question: 'Can you match my car\'s exact paint colour?', answer: 'Absolutely. We use computer colour matching technology to ensure a perfect match to your vehicle\'s original paint code.' },
      { question: 'Do you handle insurance claims?', answer: 'Yes, we work with all major insurance companies and can manage the entire claims process on your behalf.' },
      { question: 'What areas do you cover?', answer: 'We serve clients across the local area. Contact us to check if we cover your location — we\'re happy to discuss collection and delivery options.' },
    ],
    galleryTitle: 'Our Work',
    galleryImages: [
      { url: IMG.paintRepair, caption: 'Full Panel Respray' },
      { url: IMG.dentRepair, caption: 'Dent Removal — Before & After' },
      { url: IMG.bodyShopWork, caption: 'Engine Bay Detail' },
      { url: IMG.panelRepair, caption: 'Bumper Restoration' },
      { url: IMG.scratchRepair, caption: 'Interior Refresh' },
      { url: IMG.bodyShopBay, caption: 'Our Workshop' },
    ],
    contactTitle: 'Get in Touch',
    contactSub: 'Drop us a message or give us a call for a free, no-obligation quote.',
    contactInfo: [
      { icon: '📞', title: 'Phone', description: '+44 (0) 123 456 7890' },
      { icon: '📧', title: 'Email', description: 'info@paintnbody.co.uk' },
      { icon: '📍', title: 'Location', description: '123 Industrial Estate, London, UK' },
      { icon: '⏰', title: 'Opening Hours', description: 'Mon–Fri 8AM–6PM · Sat 9AM–1PM' },
    ],
    footerTagline: 'Professional vehicle body repairs — trusted by thousands.',
    statsValues: [
      { value: '15', label: 'Years Experience', suffix: '+' },
      { value: '5000', label: 'Vehicles Repaired', suffix: '+' },
      { value: '4.9', label: 'Google Rating', suffix: '★' },
      { value: '100', label: 'Satisfaction Rate', suffix: '%' },
    ],
  },
  fr: {
    nav: [
      { label: 'Accueil', href: '#' },
      { label: 'Services', href: '#services' },
      { label: 'Galerie', href: '#gallery' },
      { label: 'Avis', href: '#reviews' },
      { label: 'Contact', href: '#contact' },
    ],
    cta: 'Devis Gratuit',
    heroHeading: 'REMETTRE VOTRE VÉHICULE\nSUR LA ROUTE.',
    heroSub: 'Nous pouvons restaurer votre voiture ou utilitaire à son état d\'origine. Des petites réparations de bosses à la peinture complète, réparation d\'accident ou restauration complète de carrosserie.',
    heroBtn: 'En savoir plus',
    valueProps: [
      { icon: 'MessageCircle', title: 'Devis Gratuit', description: 'Demandez-nous pour toute réparation et nous vous fournirons un devis détaillé : coût, délai et processus pour prendre la meilleure décision.' },
      { icon: 'ShieldCheck', title: 'Réparations de Confiance', description: 'Notre équipe cumule des décennies d\'expérience avec les outils et techniques les plus modernes. Tous nos travaux sont garantis.' },
      { icon: 'BadgePoundSterling', title: 'Prix Compétitifs', description: 'Nos prix sont justes et transparents. Pas de frais cachés, pas de surprises — des devis honnêtes et des résultats exceptionnels.' },
    ],
    services: [
      { title: 'RÉPARATION PEINTURE', description: 'D\'un petit éclat à une peinture complète de panneau, notre service restaure la finition de votre véhicule à la qualité d\'exposition. Nous utilisons des peintures assorties au constructeur.', image: IMG.paintRepair },
      { title: 'RÉPARATION DE BOSSES', description: 'Votre voiture a une bosse disgracieuse ? Nos techniciens utilisent le débosselage sans peinture (PDR) et des méthodes traditionnelles pour les faire disparaître.', image: IMG.dentRepair },
      { title: 'RÉPARATION DE PANNEAUX', description: 'Qu\'il s\'agisse d\'un pare-chocs froissé ou d\'une aile cabossée, nos carrossiers qualifiés remettent en forme ou remplacent les éléments endommagés.', image: IMG.panelRepair },
      { title: 'RÉPARATION DE RAYURES', description: 'Les rayures de parking et les marques de clé peuvent être éliminées grâce à notre service expert. Nous fondons et polissons pour ne laisser aucune trace.', image: IMG.scratchRepair },
      { title: 'RÉPARATION ASSURANCE', description: 'Nous travaillons avec toutes les grandes compagnies d\'assurance pour gérer votre sinistre du début à la fin. Laissez-nous gérer le processus pour vous.', image: IMG.insuranceRepair },
      { title: 'RÉPARATION MOTO', description: 'Des carénages aux réservoirs, notre atelier gère les réparations de peinture et de carrosserie de moto avec la même précision et le même soin.', image: IMG.motorcycleRepair },
    ],
    happyTitle: 'DES MILLIERS DE CLIENTS SATISFAITS.',
    testimonials: [
      { name: 'James Wilson', role: 'Propriétaire BMW', text: 'Travail incroyable sur mon pare-chocs. On ne voit plus rien. Très recommandé !', rating: 5, avatar: AVATAR.m1 },
      { name: 'Sophie Martin', role: 'Propriétaire Audi', text: 'Délai rapide, prix juste et la correspondance de peinture est parfaite.', rating: 5, avatar: AVATAR.w1 },
      { name: 'Robert Taylor', role: 'Propriétaire Mercedes', text: 'Professionnels du début à la fin. Ils ont géré mon sinistre et la réparation est impeccable.', rating: 5, avatar: AVATAR.m2 },
      { name: 'Emma Davies', role: 'Propriétaire Moto', text: 'Carénage de moto réparé magnifiquement. Ces gars savent ce qu\'ils font. 5 étoiles.', rating: 5, avatar: AVATAR.w2 },
    ],
    testimonialsTitle: 'Ce que disent nos clients',
    ctaHeading: 'BESOIN D\'UNE RÉPARATION ?',
    ctaSub: 'Si vous cherchez un spécialiste fiable en réparation de carrosserie, ne cherchez plus. Nous sommes là pour remettre votre véhicule sur la route en parfait état.',
    ctaBtn: 'Obtenir un devis gratuit',
    faqTitle: 'UNE AUTRE QUESTION ?',
    faqItems: [
      { question: 'Combien de temps dure une réparation ?', answer: 'La plupart des petites réparations sont terminées en 1-3 jours. Les travaux plus importants peuvent prendre 5-7 jours ouvrables.' },
      { question: 'Proposez-vous un véhicule de courtoisie ?', answer: 'Oui, nous pouvons organiser un véhicule de courtoisie pendant la durée de votre réparation.' },
      { question: 'Pouvez-vous correspondre exactement à la couleur ?', answer: 'Absolument. Nous utilisons la technologie de correspondance de couleur informatisée pour un résultat parfait.' },
      { question: 'Gérez-vous les sinistres d\'assurance ?', answer: 'Oui, nous travaillons avec toutes les compagnies d\'assurance et gérons l\'ensemble du processus.' },
      { question: 'Quelles zones couvrez-vous ?', answer: 'Nous servons les clients de toute la région. Contactez-nous pour vérifier — nous proposons des options de collecte et livraison.' },
    ],
    galleryTitle: 'Nos Réalisations',
    galleryImages: [
      { url: IMG.paintRepair, caption: 'Peinture complète' },
      { url: IMG.dentRepair, caption: 'Débosselage — Avant & Après' },
      { url: IMG.bodyShopWork, caption: 'Détail compartiment moteur' },
      { url: IMG.panelRepair, caption: 'Restauration pare-chocs' },
      { url: IMG.scratchRepair, caption: 'Rénovation intérieur' },
      { url: IMG.bodyShopBay, caption: 'Notre atelier' },
    ],
    contactTitle: 'Contactez-nous',
    contactSub: 'Envoyez-nous un message ou appelez-nous pour un devis gratuit et sans engagement.',
    contactInfo: [
      { icon: '📞', title: 'Téléphone', description: '+44 (0) 123 456 7890' },
      { icon: '📧', title: 'Email', description: 'info@paintnbody.co.uk' },
      { icon: '📍', title: 'Adresse', description: '123 Zone Industrielle, Londres, UK' },
      { icon: '⏰', title: 'Horaires', description: 'Lun–Ven 8h–18h · Sam 9h–13h' },
    ],
    footerTagline: 'Réparations professionnelles de carrosserie — approuvé par des milliers.',
    statsValues: [
      { value: '15', label: 'Années d\'expérience', suffix: '+' },
      { value: '5000', label: 'Véhicules réparés', suffix: '+' },
      { value: '4.9', label: 'Note Google', suffix: '★' },
      { value: '100', label: 'Taux de satisfaction', suffix: '%' },
    ],
  },
};

const SOCIAL = [
  { platform: 'facebook', url: '#' },
  { platform: 'instagram', url: '#' },
  { platform: 'twitter', url: '#' },
];

const LANGUAGES = [
  { code: 'en', label: 'English', direction: 'ltr' as const },
  { code: 'fr', label: 'Français', direction: 'ltr' as const },
];

function makeNav(l: typeof C.en, lang: string) {
  return () =>
    comp('navbar', 'Header', {
      logo: 'PAINT N BODY',
      links: l.nav,
      sticky: true,
      ctaText: l.cta,
      ctaLink: '#contact',
      socialLinks: SOCIAL,
      showLanguageSwitcher: true,
      languageSwitcherVariant: 'flags',
      languages: LANGUAGES,
      currentLanguage: lang,
    });
}

function makeFoot(l: typeof C.en) {
  return () =>
    comp('footer', 'Footer', {
      companyName: 'Paint N Body',
      tagline: l.footerTagline,
      description: l.footerTagline,
      links: l.nav,
      socialLinks: SOCIAL,
      showSocial: true,
      phone: '+44 (0) 123 456 7890',
      email: 'info@paintnbody.co.uk',
    });
}

// ─── Build alternating image-text service sections ─────────────
function buildServiceSections(l: typeof C.en) {
  return l.services.map((svc, i) =>
    comp('image-text', svc.title, {
      title: svc.title,
      description: svc.description,
      imageUrl: svc.image,
      imagePosition: i % 2 === 0 ? 'right' : 'left',
      bgColor: i % 2 === 0 ? '#0c0c1e' : '#151530',
    })
  );
}

function buildHome(l: typeof C.en, navFn: () => any, footFn: () => any) {
  return [
    navFn(),
    // Announcement bar
    comp('announcement-bar', 'Promo Bar', {
      text: l === C.en ? '📞 Call us today for a FREE no-obligation quote!' : '📞 Appelez-nous aujourd\'hui pour un devis GRATUIT !',
      bgColor: '#a78bfa',
      textColor: '#ffffff',
      dismissible: true,
    }),
    // Dark gradient hero
    comp('hero', 'Hero', {
      heading: l.heroHeading,
      subheading: l.heroSub,
      alignment: 'center',
      height: 'large',
      backgroundImage: IMG.bodyShopHero,
      overlayOpacity: 70,
      variant: 'gradient',
      gradientAngle: 135,
      headingColor: '#ffffff',
      subheadingColor: '#cbd5e1',
      buttons: [{ text: l.heroBtn, link: '#services', variant: 'primary' }],
    }),
    // 3 Value proposition cards — dark bg with explicit colors
    comp('features', 'Value Props', {
      title: '',
      subtitle: '',
      features: l.valueProps,
      columns: 3,
      variant: 'grid',
      bgColor: '#0c0c1e',
      titleColor: '#f1f5f9',
      cardBorder: false,
      cardShadow: true,
    }),
    // Stats bar
    comp('animated-stats', 'Stats', {
      stats: l.statsValues,
      variant: 'bar',
      animationStyle: 'count',
      columns: 4,
      bgColor: '#a78bfa',
      textColor: '#ffffff',
    }),
    // Alternating service sections
    ...buildServiceSections(l),
    // Parallax break
    comp('parallax', 'Parallax', {
      imageUrl: IMG.bodyShopWork,
      heading: l.happyTitle,
      subheading: '',
      height: 'small',
      overlayOpacity: 60,
    }),
    // Testimonials
    comp('testimonials', 'Testimonials', {
      title: l.testimonialsTitle,
      testimonials: l.testimonials,
      variant: 'carousel',
      bgColor: '#151530',
    }),
    // Gallery
    comp('lightbox-gallery', 'Gallery', {
      title: l.galleryTitle,
      columns: 3,
      images: l.galleryImages,
      bgColor: '#0c0c1e',
    }),
    // CTA
    comp('cta-banner', 'CTA', {
      heading: l.ctaHeading,
      subheading: l.ctaSub,
      ctaText: l.ctaBtn,
      ctaLink: '#contact',
      bgColor: '#a78bfa',
    }),
    // FAQ
    comp('faq', 'FAQ', {
      title: l.faqTitle,
      items: l.faqItems,
      bgColor: '#151530',
    }),
    // Contact info + form
    comp('icon-text', 'Contact Info', {
      items: l.contactInfo,
      layout: 'horizontal',
      bgColor: '#0c0c1e',
    }),
    comp('contact-form', 'Contact Form', {
      title: l.contactTitle,
      subtitle: l.contactSub,
      fields: ['name', 'email', 'phone', 'message'],
      submitText: l.cta,
      bgColor: '#151530',
    }),
    // Widgets
    comp('whatsapp-button', 'WhatsApp', {
      phoneNumber: '+441234567890',
      defaultMessage: l === C.en ? 'Hi! I need a body repair quote.' : 'Bonjour ! J\'ai besoin d\'un devis de carrosserie.',
      position: 'bottom-right',
      buttonColor: '#25D366',
      iconColor: '#ffffff',
      iconSize: 56,
      pulseAnimation: true,
      showGreeting: true,
      greetingText: l === C.en ? 'Need a repair quote? Chat with us! 👋' : 'Besoin d\'un devis ? Discutez avec nous ! 👋',
      greetingDelay: 4,
      agentName: 'Paint N Body',
    }),
    comp('scroll-to-top', 'Scroll Top', {
      icon: 'ArrowUp',
      position: 'bottom-right',
      backgroundColor: '#a78bfa',
      iconColor: '#ffffff',
      size: 44,
      showAfterScroll: 400,
      smooth: true,
      rounded: true,
      shadow: true,
      offsetY: 90,
    }),
    footFn(),
  ];
}

// ─── Template definition ───────────────────────────────────────
export const paintBodyShopTemplate: SiteTemplate = {
  id: 'paint-body-shop',
  name: 'Paint & Body Shop',
  description: 'Premium auto body repair website with dark aurora theme, alternating service sections, animated stats, testimonials, gallery, FAQ, and full English & French support.',
  icon: '🎨',
  category: 'Automotive',
  theme: BODY_SHOP_THEME,
  pageCount: 1,
  features: [
    'Dark aurora gradient theme',
    'Gradient hero with overlay',
    'Announcement bar',
    'Value proposition cards',
    'Animated statistics bar',
    '6 alternating image-text service sections',
    'Parallax section',
    'Customer testimonials carousel',
    'Lightbox photo gallery',
    'CTA banner',
    'FAQ accordion',
    'Contact form with info cards',
    'WhatsApp button',
    'Scroll to top',
    'English & French',
    'Language switcher',
  ],
  previewImage: IMG.bodyShopHero,
  languages: LANGUAGES,
  translations: C,
  pages: () => {
    const navEn = makeNav(C.en, 'en');
    const navFr = makeNav(C.fr, 'fr');
    const footEn = makeFoot(C.en);
    const footFr = makeFoot(C.fr);

    const homePage = page('Home', '', buildHome(C.en, navEn, footEn), true, 0);
    const frComponents = buildHome(C.fr, navFr, footFr);

    return [
      {
        ...homePage,
        translations: {
          fr: { components: frComponents, seo: { ...homePage.seo } },
        },
      },
    ];
  },
};

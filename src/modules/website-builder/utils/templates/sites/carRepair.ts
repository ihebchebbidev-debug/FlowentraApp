import { SiteTemplate } from '../index';
import { IMG, AVATAR } from '../images';
import { comp, page, makeNavbar, makeFooter } from '../helpers';
import { AUTO_THEME } from '../themes';

const KROSSIER_LOGO = '/assets/krossier-logo.png';

// ─── Full bilingual content ────────────────────────────────────
const CONTENT = {
  en: {
    nav: [
      { label: 'Home', href: '#' },
      { label: 'Services', href: '#services' },
      { label: 'About', href: '#about' },
      { label: 'Gallery', href: '#gallery' },
      { label: 'Reviews', href: '#reviews' },
      { label: 'Contact', href: '#contact' },
    ],
    cta: 'Get a Quote',
    // Hero carousel slides
    heroSlides: [
      {
        heading: 'Expert Auto Repair\nYou Can Trust',
        subheading: 'ASE-certified mechanics · Transparent pricing · Lifetime warranty on parts.',
        backgroundImage: IMG.autoHero,
        overlayOpacity: 55,
        buttons: [{ text: 'Book Service', link: '#contact', variant: 'primary' }, { text: 'Our Services', link: '#services', variant: 'secondary' }],
      },
      {
        heading: 'Same-Day Service\nNo Appointment Needed',
        subheading: 'Oil changes in 30 minutes · Free 21-point inspection · Loaner cars available.',
        backgroundImage: IMG.autoHero2,
        overlayOpacity: 55,
        buttons: [{ text: 'Schedule Now', link: '#contact', variant: 'primary' }, { text: 'Call (555) 123-4567', link: 'tel:+15551234567', variant: 'secondary' }],
      },
      {
        heading: '25,000+ Cars Repaired\n4.9★ Google Rating',
        subheading: 'Trusted by drivers since 2005 — family-owned, community-driven excellence.',
        backgroundImage: IMG.autoHero3,
        overlayOpacity: 55,
        buttons: [{ text: 'Get Free Estimate', link: '#contact', variant: 'primary' }, { text: 'Read Reviews', link: '#reviews', variant: 'secondary' }],
      },
    ],
    stats: [
      { value: '18', label: 'Years in Business', suffix: '+' },
      { value: '25000', label: 'Cars Repaired', suffix: '+' },
      { value: '4.9', label: 'Google Rating', suffix: '★' },
      { value: '100', label: 'Satisfaction Guarantee', suffix: '%' },
    ],
    trustTitle: 'Why 25,000+ Drivers Choose Us',
    trustBadges: [
      { icon: 'Award', label: 'ASE Master Certified' },
      { icon: 'Shield', label: 'Lifetime Parts Warranty' },
      { icon: 'DollarSign', label: 'Upfront Pricing — No Surprises' },
      { icon: 'Clock', label: 'Same-Day Service' },
      { icon: 'ThumbsUp', label: '4.9★ Google Rating' },
    ],
    // Features grid
    whyUsTitle: 'Why Choose AutoPro?',
    whyUsSubtitle: 'We\'re not your average mechanic shop.',
    whyUsFeatures: [
      { icon: 'Wrench', title: 'Master Certified', description: 'ASE Master Certified technicians with decades of experience on all makes and models.' },
      { icon: 'Shield', title: 'Lifetime Warranty', description: 'Every repair comes with a lifetime parts warranty and 24-month labor guarantee.' },
      { icon: 'Truck', title: 'Free Pickup & Delivery', description: 'We\'ll pick up your car and deliver it back — free within a 10-mile radius.' },
      { icon: 'Wifi', title: 'Comfortable Lounge', description: 'Relax in our Wi-Fi-equipped waiting area with complimentary coffee and snacks.' },
      { icon: 'Car', title: 'Loaner Vehicles', description: 'Need your car for more than 4 hours? We provide complimentary loaner vehicles.' },
      { icon: 'Sparkles', title: 'Free Car Wash', description: 'Every vehicle leaves our shop spotless with a complimentary exterior wash.' },
    ],
    servicesTitle: 'Our Core Services',
    servicesSubtitle: 'From routine maintenance to complex repairs — we do it all.',
    services: [
      { icon: 'Wrench', title: 'Engine Diagnostics & Repair', description: 'Computer diagnostics, tune-ups, timing belts, and complete engine overhauls.', price: 'From $89' },
      { icon: 'CircleDot', title: 'Brake Systems', description: 'Pads, rotors, calipers, ABS diagnostics, and brake fluid service.', price: 'From $149' },
      { icon: 'Settings', title: 'Transmission Service', description: 'Fluid changes, clutch repair, rebuild, and full replacement.', price: 'From $199' },
      { icon: 'Snowflake', title: 'A/C & Climate Control', description: 'Recharge, compressor replacement, heater core, and blower motor repair.', price: 'From $99' },
      { icon: 'Battery', title: 'Electrical Systems', description: 'Battery, alternator, starter, wiring harness, and electrical diagnostics.', price: 'From $75' },
      { icon: 'Droplets', title: 'Oil Change & Lube', description: 'Synthetic & conventional oil, filter replacement, and multi-point inspection.', price: 'From $39' },
    ],
    // Marquee
    marqueeText: '🔥 FREE 21-Point Inspection with Every Service · Same-Day Appointments Available · ASE Certified Mechanics · 4.9★ Google Rating · Lifetime Warranty on Parts 🔥',
    aboutPreviewTitle: 'Family-Owned Since 2005',
    aboutPreviewDesc: 'AutoPro Repairs was founded by James Mitchell, a third-generation mechanic with a passion for honest, high-quality automotive care. We treat every customer like family and every vehicle like our own.<br/><br/>Our shop features state-of-the-art diagnostic equipment, a comfortable waiting area with Wi-Fi, and complimentary loaner vehicles for major repairs.',
    beforeAfterTitle: 'See Our Work',
    beforeAfterSubtitle: 'Drag the slider to compare before and after results.',
    testimonials: [
      { name: 'Mike Thompson', role: 'Toyota Camry Owner', text: 'Honest, professional, and half the dealer price. Best mechanic I\'ve ever used — and I\'ve tried them all.', rating: 5, avatar: AVATAR.m1 },
      { name: 'Sarah Williams', role: 'Honda Civic Owner', text: 'Fixed my A/C the same day I called. Great communication, fair pricing, and the waiting area is actually comfortable!', rating: 5, avatar: AVATAR.w1 },
      { name: 'David Rodriguez', role: 'BMW 3 Series Owner', text: 'Finally found a shop I trust with my European car. Quality work, honest advice, and they stand behind everything.', rating: 5, avatar: AVATAR.m2 },
      { name: 'Jennifer Lee', role: 'Jeep Wrangler Owner', text: 'They diagnosed a transmission issue that two other shops missed. Saved me thousands. Can\'t recommend them enough.', rating: 5, avatar: AVATAR.w2 },
    ],
    testimonialsTitle: 'What Our Customers Say',
    // Parallax
    parallaxHeading: 'Precision. Integrity. Excellence.',
    parallaxSubheading: 'Every repair is backed by our commitment to quality and our lifetime warranty.',
    ctaHeading: 'Car Trouble? We\'ve Got You Covered.',
    ctaSubheading: 'Free estimates on all services. No appointment needed for oil changes. Call now or book online.',
    ctaCta: 'Get a Free Estimate',
    ctaSecondary: 'Call (555) 123-4567',
    faqTitle: 'Frequently Asked Questions',
    faqItems: [
      { question: 'Do you work on all car brands?', answer: 'Yes — we service domestic, import, and European vehicles of all makes and models, including BMW, Mercedes, Audi, Toyota, Honda, Ford, and more.' },
      { question: 'What does your warranty cover?', answer: 'We offer a lifetime warranty on parts and a 24-month / 24,000-mile warranty on labor for all repairs.' },
      { question: 'Do you offer loaner vehicles?', answer: 'Yes! Complimentary loaner cars are available for repairs expected to take more than 4 hours. Just ask when you schedule.' },
      { question: 'How long does a typical service take?', answer: 'Oil changes take about 30 minutes. Most repairs are completed same-day. We\'ll always give you a time estimate upfront.' },
      { question: 'Do I need an appointment?', answer: 'Appointments are recommended for major repairs, but walk-ins are welcome for oil changes, tire checks, and quick inspections.' },
      { question: 'Can you pick up and deliver my car?', answer: 'Yes — we offer free pickup and delivery within a 10-mile radius for repairs over $300.' },
    ],
    newsletterTitle: 'Maintenance Tips & Exclusive Offers',
    newsletterSubtitle: 'Join 5,000+ car owners who get our monthly maintenance reminders, seasonal tips, and service discounts.',
    newsletterPlaceholder: 'Your email address',
    newsletterButton: 'Subscribe Free',
    promoBanner: '🛠️ Free 21-Point Inspection with Every Service — Book Today!',
    promoLink: 'Schedule Now →',
    footerTagline: 'Precision auto care — trusted by thousands since 2005.',
    footerDesc: 'AutoPro Repairs provides expert automotive service with ASE Master Certified technicians, transparent pricing, and a lifetime warranty on parts. Family-owned since 2005.',
    // Services page
    servicesHeroTitle: 'Complete Auto Care',
    servicesHeroSubtitle: 'From oil changes to engine rebuilds — certified professionals, honest pricing.',
    serviceTabsTitle: 'Browse by Category',
    serviceTabs: [
      { label: 'Maintenance', content: 'Oil changes, fluid flushes, filter replacements, tire rotations, brake inspections, and multi-point checks. Keep your car running like new.' },
      { label: 'Repair', content: 'Engine repair, transmission rebuilds, suspension work, exhaust systems, and steering components. We fix what others can\'t.' },
      { label: 'Diagnostics', content: 'Check engine light, computer diagnostics, emissions testing, electrical troubleshooting, and A/C system analysis.' },
      { label: 'Specialty', content: 'European vehicles, hybrid & electric cars, classic car restoration, performance upgrades, and custom exhaust work.' },
    ],
    // Process steps
    processTitle: 'How It Works',
    processSubtitle: 'Simple 4-step process from booking to delivery',
    processSteps: [
      { icon: 'Phone', title: 'Book Online or Call', description: 'Schedule your appointment online, by phone, or just walk in for quick services.' },
      { icon: 'Search', title: 'Free Diagnosis', description: 'Our technicians perform a thorough inspection and provide a detailed quote — no surprises.' },
      { icon: 'Wrench', title: 'Expert Repair', description: 'ASE Master Certified mechanics complete the work using genuine OEM parts.' },
      { icon: 'CheckCircle', title: 'Quality Check & Delivery', description: 'Every repair passes our 21-point quality check. We\'ll even wash your car for free.' },
    ],
    pricingTitle: 'Maintenance Plans',
    pricingSubtitle: 'Save money with our prepaid service packages.',
    plans: [
      { name: 'Basic Care', price: '$49/visit', features: ['Synthetic Oil Change', 'Multi-Point Inspection', 'Fluid Top-Off', 'Tire Pressure Check'], highlighted: false },
      { name: 'Full Service', price: '$129/visit', features: ['Everything in Basic', 'Tire Rotation', 'Brake Inspection', 'Cabin Air Filter', 'Battery Test'], highlighted: true },
      { name: 'Premium Pro', price: '$249/visit', features: ['Everything in Full Service', 'A/C Performance Check', 'Full Computer Diagnostics', 'Transmission Fluid Service', 'Fuel System Cleaning'], highlighted: false },
    ],
    comparisonTitle: 'Plan Comparison',
    comparisonHeaders: ['Basic Care', 'Full Service', 'Premium Pro'],
    comparisonRows: [
      { feature: 'Synthetic Oil Change', values: ['true', 'true', 'true'] },
      { feature: 'Multi-Point Inspection', values: ['true', 'true', 'true'] },
      { feature: 'Tire Rotation', values: ['false', 'true', 'true'] },
      { feature: 'Brake Inspection', values: ['false', 'true', 'true'] },
      { feature: 'A/C Performance Check', values: ['false', 'false', 'true'] },
      { feature: 'Computer Diagnostics', values: ['false', 'false', 'true'] },
      { feature: 'Transmission Fluid', values: ['false', 'false', 'true'] },
    ],
    servicesCtaHeading: 'Not Sure What You Need?',
    servicesCtaSubheading: 'Bring your car in for a free diagnostic check. We\'ll tell you exactly what it needs — no obligation.',
    servicesCtaCta: 'Schedule Free Check',
    // About page
    aboutHeroTitle: 'Our Story',
    aboutHeroSubtitle: 'Three generations of automotive excellence — family-owned since 2005.',
    aboutTitle: 'Built on Trust, Driven by Quality',
    aboutDesc: 'AutoPro Repairs started in a two-bay garage with one simple promise: treat every customer honestly and every car with care. Today, we\'re proud to be the top-rated auto shop in the region with a 4.9-star rating and over 25,000 vehicles serviced.<br/><br/>Our team of ASE Master Certified technicians uses the latest diagnostic tools and genuine OEM parts. We believe in transparent pricing — you\'ll always know the cost before we start any work.',
    teamTitle: 'Meet Our Team',
    teamSubtitle: 'Experienced, certified, and passionate about cars.',
    team: [
      { name: 'James Mitchell', role: 'Founder & Master Mechanic', bio: '30+ years experience, ASE Master Certified, specializing in engine diagnostics.', avatar: AVATAR.m1 },
      { name: 'Maria Rodriguez', role: 'Service Manager', bio: '15 years in automotive service management. Ensures every job runs on time.', avatar: AVATAR.w1 },
      { name: 'Tom Chen', role: 'Lead Technician — European Cars', bio: 'BMW, Mercedes & Audi specialist. Factory-trained with 12 years experience.', avatar: AVATAR.m2 },
      { name: 'Lisa Park', role: 'Customer Experience Manager', bio: 'Making sure every visit is smooth, comfortable, and stress-free.', avatar: AVATAR.w2 },
    ],
    timelineTitle: 'Our Journey',
    timeline: [
      { date: '2005', title: 'The Beginning', description: 'James Mitchell opens AutoPro in a small 2-bay garage.' },
      { date: '2010', title: 'Growing Fast', description: 'Expanded to 6 service bays and hired our first specialist technicians.' },
      { date: '2015', title: '10,000 Cars Serviced', description: 'Reached our 10,000th vehicle and earned ASE Blue Seal recognition.' },
      { date: '2020', title: 'State-of-the-Art Upgrade', description: 'Invested in advanced computer diagnostics and a new customer lounge.' },
      { date: '2025', title: 'Community Leader', description: '25,000+ cars serviced, 4.9★ Google rating, and still growing.' },
    ],
    certificationsTitle: 'Trusted Certifications & Partners',
    certifications: [
      { name: 'ASE Certified', url: '#' },
      { name: 'AAA Approved', url: '#' },
      { name: 'BBB A+ Rating', url: '#' },
      { name: 'NAPA AutoCare', url: '#' },
    ],
    // Gallery page
    galleryHeroTitle: 'Our Shop & Work',
    galleryHeroSubtitle: 'Take a look at our facility and the quality repairs we deliver.',
    galleryTitle: 'Photo Gallery',
    galleryImages: [
      { url: IMG.autoShop, caption: 'Service Bay — Clean & Organized' },
      { url: IMG.autoEngine, caption: 'Engine Rebuild — V6 Restoration' },
      { url: IMG.autoBrakes, caption: 'Complete Brake Replacement' },
      { url: IMG.autoGarage, caption: 'State-of-the-Art Diagnostic Center' },
      { url: IMG.autoTools, caption: 'Professional-Grade Tools' },
      { url: IMG.autoTires, caption: 'Tire Service & Alignment' },
      { url: IMG.autoInterior, caption: 'Interior Detailing' },
      { url: IMG.autoDetail, caption: 'Paint Correction & Detailing' },
    ],
    reviewsTitle: 'Customer Reviews',
    reviewsSubtitle: '4.9/5 from 500+ verified Google reviews',
    reviews: [
      { name: 'Mike T.', rating: 5, text: 'Honest, professional, and half the dealer price. Best mechanic in town!', date: 'Jan 2026' },
      { name: 'Sarah W.', rating: 5, text: 'Fixed my A/C same day. Great communication throughout the entire process.', date: 'Dec 2025' },
      { name: 'David R.', rating: 5, text: 'Finally found a shop I trust with my BMW. Excellent work every time.', date: 'Nov 2025' },
      { name: 'Jennifer L.', rating: 5, text: 'Diagnosed a transmission issue two other shops missed. Saved me thousands!', date: 'Oct 2025' },
      { name: 'Carlos M.', rating: 5, text: 'The loaner car program is a game-changer. Professional from start to finish.', date: 'Sep 2025' },
      { name: 'Emily S.', rating: 5, text: 'Took time to explain everything clearly. No pressure, just honest advice.', date: 'Aug 2025' },
    ],
    // Blog page
    blogHeroTitle: 'Auto Care Blog',
    blogHeroSubtitle: 'Tips, tutorials, and industry insights to keep your car running smoothly.',
    blogTitle: 'Latest Articles',
    blogPosts: [
      { title: '5 Signs Your Brakes Need Attention', excerpt: 'Don\'t ignore these warning signs — they could save your life on the road.', image: IMG.autoBrakes, date: 'Feb 2026', category: 'Safety' },
      { title: 'When to Change Your Oil (The Real Answer)', excerpt: 'Forget the 3,000-mile myth. Here\'s what modern cars actually need.', image: IMG.autoEngine, date: 'Jan 2026', category: 'Maintenance' },
      { title: 'Winter Car Care: 10 Essential Tips', excerpt: 'Prepare your vehicle for cold weather with this comprehensive checklist.', image: IMG.autoHero, date: 'Dec 2025', category: 'Seasonal' },
      { title: 'EV vs Hybrid: What You Need to Know', excerpt: 'Thinking about going electric? Here\'s an honest comparison from our techs.', image: IMG.autoShop, date: 'Nov 2025', category: 'Technology' },
      { title: 'DIY vs Professional: When to Call a Mechanic', excerpt: 'Some jobs you can do at home — and some you really shouldn\'t.', image: IMG.autoTools, date: 'Oct 2025', category: 'Tips' },
      { title: 'Understanding Your Dashboard Warning Lights', excerpt: 'A complete guide to every icon on your dashboard and what it means.', image: IMG.autoGarage, date: 'Sep 2025', category: 'Education' },
    ],
    // Specials page
    specialsHeroTitle: 'Current Specials & Promotions',
    specialsHeroSubtitle: 'Limited-time offers to save on auto service.',
    countdownTitle: '🔥 Spring Service Special — Ends Soon!',
    specialsCards: [
      { icon: 'Droplets', title: 'Oil Change + Inspection', description: 'Synthetic oil change with a free 21-point inspection and fluid top-off.', price: '$29.99', linkText: 'Book Now', linkUrl: '#contact' },
      { icon: 'CircleDot', title: 'Brake Service Package', description: 'Front or rear brake pads + rotor inspection + brake fluid check.', price: '$99.99', linkText: 'Book Now', linkUrl: '#contact' },
      { icon: 'Snowflake', title: 'A/C Recharge Special', description: 'Complete A/C system inspection, recharge, and leak test included.', price: '$69.99', linkText: 'Book Now', linkUrl: '#contact' },
      { icon: 'Settings', title: 'Transmission Flush', description: 'Full transmission fluid exchange + filter replacement + road test.', price: '$149.99', linkText: 'Book Now', linkUrl: '#contact' },
    ],
    specialsCtaHeading: 'Don\'t Miss Out on These Deals!',
    specialsCtaSubheading: 'All specials include a complimentary car wash and multi-point inspection.',
    // Contact page
    contactHeroTitle: 'Get in Touch',
    contactHeroSubtitle: 'Free estimates · Walk-ins welcome · Same-day appointments available.',
    contactInfo: [
      { icon: '📍', title: 'Visit Us', description: '456 Main Street, Springfield, IL 62704' },
      { icon: '📞', title: 'Call Us', description: '(555) 123-4567' },
      { icon: '📧', title: 'Email Us', description: 'service@autopro.com' },
      { icon: '⏰', title: 'Business Hours', description: 'Mon–Fri 7 AM – 6 PM · Sat 8 AM – 2 PM · Sun Closed' },
    ],
    appointmentTitle: 'Request an Appointment',
    appointmentSubtitle: 'Fill out the form and we\'ll get back to you within 1 business hour with a free estimate.',
    appointmentSubmit: 'Request Appointment',
    socialTitle: 'Follow Us',
    // Navbar top bar
    topBarText: '📞 (555) 123-4567 · Mon–Fri 7AM–6PM · Sat 8AM–2PM',
    topBarLinks: [{ label: 'Get Directions', href: '#contact' }, { label: 'Book Online', href: '#contact' }],
    // Footer link groups
    footerLinkGroups: [
      { title: 'Services', links: [{ label: 'Engine Repair', href: '#' }, { label: 'Brake Service', href: '#' }, { label: 'Oil Change', href: '#' }, { label: 'Transmission', href: '#' }] },
      { title: 'Company', links: [{ label: 'About Us', href: '#about' }, { label: 'Our Team', href: '#about' }, { label: 'Gallery', href: '#gallery' }, { label: 'Careers', href: '#' }] },
      { title: 'Support', links: [{ label: 'Contact', href: '#contact' }, { label: 'FAQ', href: '#' }, { label: 'Warranty', href: '#' }, { label: 'Loaner Cars', href: '#' }] },
    ],
  },
  fr: {
    nav: [
      { label: 'Accueil', href: '#' },
      { label: 'Services', href: '#services' },
      { label: 'À propos', href: '#about' },
      { label: 'Galerie', href: '#gallery' },
      { label: 'Avis', href: '#reviews' },
      { label: 'Contact', href: '#contact' },
    ],
    cta: 'Obtenir un devis',
    heroSlides: [
      {
        heading: 'Réparation Auto Expert\nEn Qui Vous Pouvez Avoir Confiance',
        subheading: 'Mécaniciens certifiés ASE · Prix transparents · Garantie à vie sur les pièces.',
        backgroundImage: IMG.autoHero,
        overlayOpacity: 55,
        buttons: [{ text: 'Réserver', link: '#contact', variant: 'primary' }, { text: 'Nos services', link: '#services', variant: 'secondary' }],
      },
      {
        heading: 'Service le jour même\nSans rendez-vous',
        subheading: 'Vidanges en 30 minutes · Inspection gratuite en 21 points · Véhicules de courtoisie.',
        backgroundImage: IMG.autoHero2,
        overlayOpacity: 55,
        buttons: [{ text: 'Réserver', link: '#contact', variant: 'primary' }, { text: 'Appeler (555) 123-4567', link: 'tel:+15551234567', variant: 'secondary' }],
      },
      {
        heading: '25 000+ voitures réparées\nNote Google 4.9★',
        subheading: 'Approuvé par les conducteurs depuis 2005 — entreprise familiale, excellence communautaire.',
        backgroundImage: IMG.autoHero3,
        overlayOpacity: 55,
        buttons: [{ text: 'Devis gratuit', link: '#contact', variant: 'primary' }, { text: 'Lire les avis', link: '#reviews', variant: 'secondary' }],
      },
    ],
    stats: [
      { value: '18', label: 'Années d\'expérience', suffix: '+' },
      { value: '25000', label: 'Voitures réparées', suffix: '+' },
      { value: '4.9', label: 'Note Google', suffix: '★' },
      { value: '100', label: 'Garantie satisfaction', suffix: '%' },
    ],
    trustTitle: 'Pourquoi 25 000+ conducteurs nous choisissent',
    trustBadges: [
      { icon: 'Award', label: 'Certifié ASE Master' },
      { icon: 'Shield', label: 'Garantie à vie sur les pièces' },
      { icon: 'DollarSign', label: 'Prix transparents — Sans surprises' },
      { icon: 'Clock', label: 'Service le jour même' },
      { icon: 'ThumbsUp', label: '4.9★ Note Google' },
    ],
    whyUsTitle: 'Pourquoi choisir AutoPro ?',
    whyUsSubtitle: 'Nous ne sommes pas un garage ordinaire.',
    whyUsFeatures: [
      { icon: 'Wrench', title: 'Certifié Master', description: 'Techniciens certifiés ASE Master avec des décennies d\'expérience sur toutes les marques.' },
      { icon: 'Shield', title: 'Garantie à vie', description: 'Chaque réparation inclut une garantie à vie sur les pièces et 24 mois sur la main-d\'œuvre.' },
      { icon: 'Truck', title: 'Ramassage & livraison gratuits', description: 'Nous récupérons et livrons votre voiture gratuitement dans un rayon de 15 km.' },
      { icon: 'Wifi', title: 'Salon confortable', description: 'Détendez-vous dans notre salle d\'attente avec Wi-Fi, café et collations gratuits.' },
      { icon: 'Car', title: 'Véhicules de courtoisie', description: 'Besoin de votre voiture plus de 4 heures ? Nous fournissons des véhicules de courtoisie.' },
      { icon: 'Sparkles', title: 'Lavage gratuit', description: 'Chaque véhicule quitte notre atelier impeccable avec un lavage extérieur gratuit.' },
    ],
    servicesTitle: 'Nos services principaux',
    servicesSubtitle: 'De l\'entretien courant aux réparations complexes — nous faisons tout.',
    services: [
      { icon: 'Wrench', title: 'Diagnostic & Réparation Moteur', description: 'Diagnostic informatique, mise au point, courroies de distribution et révision complète du moteur.', price: 'À partir de 89€' },
      { icon: 'CircleDot', title: 'Systèmes de Freinage', description: 'Plaquettes, disques, étriers, diagnostic ABS et entretien du liquide de frein.', price: 'À partir de 149€' },
      { icon: 'Settings', title: 'Service Transmission', description: 'Vidanges, réparation d\'embrayage, reconstruction et remplacement complet.', price: 'À partir de 199€' },
      { icon: 'Snowflake', title: 'Climatisation', description: 'Recharge, remplacement du compresseur, noyau de chauffage et moteur de ventilation.', price: 'À partir de 99€' },
      { icon: 'Battery', title: 'Systèmes Électriques', description: 'Batterie, alternateur, démarreur, faisceau de câblage et diagnostic électrique.', price: 'À partir de 75€' },
      { icon: 'Droplets', title: 'Vidange & Lubrification', description: 'Huile synthétique et conventionnelle, remplacement de filtre et inspection multi-points.', price: 'À partir de 39€' },
    ],
    marqueeText: '🔥 Inspection GRATUITE en 21 points avec chaque service · Rendez-vous le jour même · Mécaniciens certifiés ASE · Note Google 4.9★ · Garantie à vie 🔥',
    aboutPreviewTitle: 'Entreprise familiale depuis 2005',
    aboutPreviewDesc: 'AutoPro Repairs a été fondé par James Mitchell, un mécanicien de troisième génération passionné par un service automobile honnête et de qualité. Nous traitons chaque client comme un membre de la famille et chaque véhicule comme le nôtre.<br/><br/>Notre atelier est équipé d\'outils de diagnostic de pointe, d\'une salle d\'attente confortable avec Wi-Fi et de véhicules de courtoisie gratuits pour les réparations importantes.',
    beforeAfterTitle: 'Découvrez notre travail',
    beforeAfterSubtitle: 'Faites glisser le curseur pour comparer avant et après.',
    testimonials: [
      { name: 'Mike Thompson', role: 'Propriétaire Toyota Camry', text: 'Honnête, professionnel et deux fois moins cher que le concessionnaire.', rating: 5, avatar: AVATAR.m1 },
      { name: 'Sarah Williams', role: 'Propriétaire Honda Civic', text: 'Climatisation réparée le jour même. Excellente communication et prix justes !', rating: 5, avatar: AVATAR.w1 },
      { name: 'David Rodriguez', role: 'Propriétaire BMW Série 3', text: 'Enfin un garage de confiance pour ma voiture européenne. Travail de qualité.', rating: 5, avatar: AVATAR.m2 },
      { name: 'Jennifer Lee', role: 'Propriétaire Jeep Wrangler', text: 'Ont diagnostiqué un problème que deux autres garages avaient manqué.', rating: 5, avatar: AVATAR.w2 },
    ],
    testimonialsTitle: 'Ce que disent nos clients',
    parallaxHeading: 'Précision. Intégrité. Excellence.',
    parallaxSubheading: 'Chaque réparation est soutenue par notre engagement qualité et notre garantie à vie.',
    ctaHeading: 'Un problème avec votre voiture ? Nous sommes là.',
    ctaSubheading: 'Devis gratuits · Sans rendez-vous pour les vidanges · Appelez ou réservez en ligne.',
    ctaCta: 'Obtenir un devis gratuit',
    ctaSecondary: 'Appeler (555) 123-4567',
    faqTitle: 'Questions fréquemment posées',
    faqItems: [
      { question: 'Travaillez-vous sur toutes les marques ?', answer: 'Oui — nous entretenons tous les véhicules de toutes marques et modèles.' },
      { question: 'Que couvre votre garantie ?', answer: 'Garantie à vie sur les pièces et 24 mois / 40 000 km sur la main-d\'œuvre.' },
      { question: 'Proposez-vous des véhicules de courtoisie ?', answer: 'Oui ! Gratuits pour les réparations de plus de 4 heures.' },
      { question: 'Combien de temps dure un service ?', answer: 'Vidanges ~30 min. La plupart des réparations le jour même.' },
      { question: 'Ai-je besoin d\'un rendez-vous ?', answer: 'Recommandé pour les réparations, sans rendez-vous pour les vidanges.' },
      { question: 'Pouvez-vous venir chercher ma voiture ?', answer: 'Oui — ramassage et livraison gratuits dans un rayon de 15 km pour les réparations de plus de 300€.' },
    ],
    newsletterTitle: 'Conseils d\'entretien & offres exclusives',
    newsletterSubtitle: 'Rejoignez 5 000+ propriétaires de voitures pour nos rappels et réductions.',
    newsletterPlaceholder: 'Votre adresse email',
    newsletterButton: 'S\'abonner',
    promoBanner: '🛠️ Inspection gratuite en 21 points avec chaque service — Réservez !',
    promoLink: 'Réserver →',
    footerTagline: 'Entretien auto de précision — approuvé par des milliers depuis 2005.',
    footerDesc: 'AutoPro Repairs offre un service automobile expert avec des techniciens certifiés ASE Master, des prix transparents et une garantie à vie sur les pièces. Entreprise familiale depuis 2005.',
    // Services page
    servicesHeroTitle: 'Entretien auto complet',
    servicesHeroSubtitle: 'Des vidanges aux reconstructions de moteur — professionnels certifiés, prix honnêtes.',
    serviceTabsTitle: 'Parcourir par catégorie',
    serviceTabs: [
      { label: 'Entretien', content: 'Vidanges, purges de fluides, remplacement de filtres, rotation des pneus et inspections.' },
      { label: 'Réparation', content: 'Réparation moteur, reconstruction de transmission, suspension et direction.' },
      { label: 'Diagnostic', content: 'Voyant moteur, diagnostic informatique, test d\'émissions et analyse de climatisation.' },
      { label: 'Spécialité', content: 'Véhicules européens, hybrides, restauration classique et améliorations de performance.' },
    ],
    processTitle: 'Comment ça marche',
    processSubtitle: 'Un processus simple en 4 étapes',
    processSteps: [
      { icon: 'Phone', title: 'Réserver en ligne ou appeler', description: 'Planifiez en ligne, par téléphone, ou venez directement.' },
      { icon: 'Search', title: 'Diagnostic gratuit', description: 'Inspection complète et devis détaillé — sans surprises.' },
      { icon: 'Wrench', title: 'Réparation experte', description: 'Mécaniciens certifiés ASE avec des pièces d\'origine.' },
      { icon: 'CheckCircle', title: 'Contrôle & livraison', description: 'Vérification en 21 points. Lavage gratuit inclus.' },
    ],
    pricingTitle: 'Forfaits d\'entretien',
    pricingSubtitle: 'Économisez avec nos forfaits prépayés.',
    plans: [
      { name: 'Soin de base', price: '49€/visite', features: ['Vidange synthétique', 'Inspection multi-points', 'Appoint de fluides', 'Pression pneus'], highlighted: false },
      { name: 'Service complet', price: '129€/visite', features: ['Tout le Basic', 'Rotation pneus', 'Inspection freins', 'Filtre habitacle', 'Test batterie'], highlighted: true },
      { name: 'Premium Pro', price: '249€/visite', features: ['Tout le Service complet', 'Vérification climatisation', 'Diagnostic complet', 'Fluide transmission', 'Nettoyage carburant'], highlighted: false },
    ],
    comparisonTitle: 'Comparaison des forfaits',
    comparisonHeaders: ['Soin de base', 'Service complet', 'Premium Pro'],
    comparisonRows: [
      { feature: 'Vidange synthétique', values: ['true', 'true', 'true'] },
      { feature: 'Inspection multi-points', values: ['true', 'true', 'true'] },
      { feature: 'Rotation des pneus', values: ['false', 'true', 'true'] },
      { feature: 'Inspection des freins', values: ['false', 'true', 'true'] },
      { feature: 'Vérification climatisation', values: ['false', 'false', 'true'] },
      { feature: 'Diagnostic informatique', values: ['false', 'false', 'true'] },
      { feature: 'Fluide transmission', values: ['false', 'false', 'true'] },
    ],
    servicesCtaHeading: 'Vous ne savez pas ce dont vous avez besoin ?',
    servicesCtaSubheading: 'Amenez votre voiture pour un diagnostic gratuit — sans engagement.',
    servicesCtaCta: 'Planifier un diagnostic gratuit',
    // About page
    aboutHeroTitle: 'Notre histoire',
    aboutHeroSubtitle: 'Trois générations d\'excellence automobile — entreprise familiale depuis 2005.',
    aboutTitle: 'Bâti sur la confiance, guidé par la qualité',
    aboutDesc: 'AutoPro Repairs a débuté dans un garage de deux baies avec une promesse simple : honnêteté et soin. Aujourd\'hui, nous sommes l\'atelier auto le mieux noté de la région avec 4.9 étoiles et plus de 25 000 véhicules entretenus.<br/><br/>Notre équipe de techniciens certifiés ASE Master utilise les derniers outils de diagnostic et des pièces d\'origine.',
    teamTitle: 'Rencontrez notre équipe',
    teamSubtitle: 'Expérimentés, certifiés et passionnés.',
    team: [
      { name: 'James Mitchell', role: 'Fondateur & Maître Mécanicien', bio: '30+ ans d\'expérience, certifié ASE Master.', avatar: AVATAR.m1 },
      { name: 'Maria Rodriguez', role: 'Responsable Service', bio: '15 ans de gestion de service automobile.', avatar: AVATAR.w1 },
      { name: 'Tom Chen', role: 'Technicien Principal — Européennes', bio: 'Spécialiste BMW, Mercedes & Audi. 12 ans.', avatar: AVATAR.m2 },
      { name: 'Lisa Park', role: 'Responsable Expérience Client', bio: 'Chaque visite fluide, confortable et sans stress.', avatar: AVATAR.w2 },
    ],
    timelineTitle: 'Notre parcours',
    timeline: [
      { date: '2005', title: 'Le début', description: 'James Mitchell ouvre AutoPro.' },
      { date: '2010', title: 'Croissance rapide', description: 'Extension à 6 baies de service.' },
      { date: '2015', title: '10 000 voitures', description: 'Reconnaissance ASE Blue Seal.' },
      { date: '2020', title: 'Mise à niveau', description: 'Diagnostic avancé et nouveau salon.' },
      { date: '2025', title: 'Leader', description: '25 000+ voitures, note 4.9★.' },
    ],
    certificationsTitle: 'Certifications & Partenaires',
    certifications: [
      { name: 'Certifié ASE', url: '#' },
      { name: 'Approuvé AAA', url: '#' },
      { name: 'Note BBB A+', url: '#' },
      { name: 'NAPA AutoCare', url: '#' },
    ],
    // Gallery page
    galleryHeroTitle: 'Notre atelier & nos travaux',
    galleryHeroSubtitle: 'Découvrez nos installations et la qualité de nos réparations.',
    galleryTitle: 'Galerie photos',
    galleryImages: [
      { url: IMG.autoShop, caption: 'Baie de service' },
      { url: IMG.autoEngine, caption: 'Reconstruction moteur' },
      { url: IMG.autoBrakes, caption: 'Remplacement freins' },
      { url: IMG.autoGarage, caption: 'Centre de diagnostic' },
      { url: IMG.autoTools, caption: 'Outils professionnels' },
      { url: IMG.autoTires, caption: 'Service pneus' },
      { url: IMG.autoInterior, caption: 'Détaillage intérieur' },
      { url: IMG.autoDetail, caption: 'Correction peinture' },
    ],
    reviewsTitle: 'Avis clients',
    reviewsSubtitle: '4.9/5 sur 500+ avis Google vérifiés',
    reviews: [
      { name: 'Mike T.', rating: 5, text: 'Honnête et moitié prix du concessionnaire !', date: 'Jan 2026' },
      { name: 'Sarah W.', rating: 5, text: 'Climatisation réparée le jour même.', date: 'Déc 2025' },
      { name: 'David R.', rating: 5, text: 'Enfin un garage de confiance pour ma BMW.', date: 'Nov 2025' },
      { name: 'Jennifer L.', rating: 5, text: 'Diagnostic que deux garages avaient manqué !', date: 'Oct 2025' },
      { name: 'Carlos M.', rating: 5, text: 'Le programme de véhicule de courtoisie est top.', date: 'Sep 2025' },
      { name: 'Emily S.', rating: 5, text: 'Conseils honnêtes, pas de pression.', date: 'Août 2025' },
    ],
    // Blog page
    blogHeroTitle: 'Blog entretien auto',
    blogHeroSubtitle: 'Conseils, tutoriels et infos pour garder votre voiture en forme.',
    blogTitle: 'Derniers articles',
    blogPosts: [
      { title: '5 signes que vos freins ont besoin d\'attention', excerpt: 'Ne les ignorez pas — ils pourraient vous sauver la vie.', image: IMG.autoBrakes, date: 'Fév 2026', category: 'Sécurité' },
      { title: 'Quand changer votre huile (la vraie réponse)', excerpt: 'Oubliez le mythe des 5000 km. Voici ce qu\'il faut réellement.', image: IMG.autoEngine, date: 'Jan 2026', category: 'Entretien' },
      { title: 'Entretien hivernal : 10 conseils essentiels', excerpt: 'Préparez votre véhicule pour le froid avec cette liste complète.', image: IMG.autoHero, date: 'Déc 2025', category: 'Saisonnier' },
      { title: 'VE vs Hybride : ce qu\'il faut savoir', excerpt: 'Vous pensez passer à l\'électrique ? Comparaison honnête.', image: IMG.autoShop, date: 'Nov 2025', category: 'Technologie' },
      { title: 'DIY vs Pro : quand appeler un mécanicien', excerpt: 'Certains travaux sont faisables chez soi — d\'autres non.', image: IMG.autoTools, date: 'Oct 2025', category: 'Conseils' },
      { title: 'Comprendre vos voyants de tableau de bord', excerpt: 'Guide complet de chaque icône et sa signification.', image: IMG.autoGarage, date: 'Sep 2025', category: 'Éducation' },
    ],
    // Specials page
    specialsHeroTitle: 'Promotions en cours',
    specialsHeroSubtitle: 'Offres à durée limitée pour économiser.',
    countdownTitle: '🔥 Spécial printemps — Fin bientôt !',
    specialsCards: [
      { icon: 'Droplets', title: 'Vidange + Inspection', description: 'Vidange synthétique avec inspection gratuite en 21 points.', price: '29,99€', linkText: 'Réserver', linkUrl: '#contact' },
      { icon: 'CircleDot', title: 'Forfait Freins', description: 'Plaquettes avant ou arrière + inspection des disques.', price: '99,99€', linkText: 'Réserver', linkUrl: '#contact' },
      { icon: 'Snowflake', title: 'Recharge Climatisation', description: 'Inspection complète du système A/C, recharge et test.', price: '69,99€', linkText: 'Réserver', linkUrl: '#contact' },
      { icon: 'Settings', title: 'Purge Transmission', description: 'Échange complet de fluide + filtre + test routier.', price: '149,99€', linkText: 'Réserver', linkUrl: '#contact' },
    ],
    specialsCtaHeading: 'Ne manquez pas ces offres !',
    specialsCtaSubheading: 'Toutes les promotions incluent un lavage gratuit et une inspection.',
    // Contact page
    contactHeroTitle: 'Contactez-nous',
    contactHeroSubtitle: 'Devis gratuits · Sans rendez-vous · Rendez-vous le jour même.',
    contactInfo: [
      { icon: '📍', title: 'Nous rendre visite', description: '456 Main Street, Springfield, IL 62704' },
      { icon: '📞', title: 'Appelez-nous', description: '(555) 123-4567' },
      { icon: '📧', title: 'Écrivez-nous', description: 'service@autopro.com' },
      { icon: '⏰', title: 'Horaires', description: 'Lun–Ven 7h–18h · Sam 8h–14h · Dim Fermé' },
    ],
    appointmentTitle: 'Demander un rendez-vous',
    appointmentSubtitle: 'Nous vous répondrons dans l\'heure avec un devis gratuit.',
    appointmentSubmit: 'Demander un rendez-vous',
    socialTitle: 'Suivez-nous',
    topBarText: '📞 (555) 123-4567 · Lun–Ven 7h–18h · Sam 8h–14h',
    topBarLinks: [{ label: 'Itinéraire', href: '#contact' }, { label: 'Réserver', href: '#contact' }],
    footerLinkGroups: [
      { title: 'Services', links: [{ label: 'Réparation moteur', href: '#' }, { label: 'Service freins', href: '#' }, { label: 'Vidange', href: '#' }, { label: 'Transmission', href: '#' }] },
      { title: 'Entreprise', links: [{ label: 'À propos', href: '#about' }, { label: 'Équipe', href: '#about' }, { label: 'Galerie', href: '#gallery' }, { label: 'Carrières', href: '#' }] },
      { title: 'Support', links: [{ label: 'Contact', href: '#contact' }, { label: 'FAQ', href: '#' }, { label: 'Garantie', href: '#' }, { label: 'Courtoisie', href: '#' }] },
    ],
  },
};

const SOCIAL = [
  { platform: 'facebook', url: '#' },
  { platform: 'instagram', url: '#' },
  { platform: 'google', url: '#' },
  { platform: 'twitter', url: '#' },
];

// ─── Shared helpers ────────────────────────────────────────────

const SITE_LANGUAGES = [
  { code: 'en', label: 'English', direction: 'ltr' as const },
  { code: 'fr', label: 'Français', direction: 'ltr' as const },
];

/** Stacked navbar with top bar */
function makeStackedNav(l: typeof CONTENT.en, currentLang: string) {
  return () =>
    comp('navbar', 'Header', {
      logo: '',
      logoImage: KROSSIER_LOGO,
      variant: 'stacked',
      links: l.nav,
      sticky: true,
      ctaText: l.cta,
      ctaLink: '#contact',
      socialLinks: SOCIAL,
      showSearch: false,
      showLanguageSwitcher: true,
      languageSwitcherVariant: 'flags',
      languages: SITE_LANGUAGES,
      currentLanguage: currentLang,
      topBarText: l.topBarText,
      topBarLinks: l.topBarLinks,
    });
}

/** Column footer with link groups */
function makeColumnFooter(l: typeof CONTENT.en) {
  return () =>
    comp('footer', 'Footer', {
      companyName: 'AutoPro Repairs',
      variant: 'columns',
      description: l.footerDesc,
      tagline: l.footerTagline,
      links: [{ label: 'Privacy', href: '#' }, { label: 'Terms', href: '#' }],
      linkGroups: l.footerLinkGroups,
      socialLinks: SOCIAL,
      showSocial: true,
      phone: '(555) 123-4567',
      email: 'service@autopro.com',
      address: '456 Main Street, Springfield, IL 62704',
    });
}

const nav = makeStackedNav(CONTENT.en, 'en');
const navFr = makeStackedNav(CONTENT.fr, 'fr');
const foot = makeColumnFooter(CONTENT.en);
const footFr = makeColumnFooter(CONTENT.fr);

/** Floating widgets shared across all pages */
function floatingWidgets() {
  return [
    comp('whatsapp-button', 'WhatsApp Chat', {
      phoneNumber: '+15551234567',
      defaultMessage: 'Hi! I would like to book a car service appointment.',
      position: 'bottom-right',
      buttonColor: '#25D366',
      iconColor: '#ffffff',
      iconSize: 56,
      pulseAnimation: true,
      showGreeting: true,
      greetingText: 'Hi there! 👋 Need a repair quote or want to book a service? Chat with us!',
      greetingDelay: 4,
      agentName: 'AutoPro Support',
      avatarUrl: '',
      businessHoursEnabled: true,
      businessHoursStart: '07:00',
      businessHoursEnd: '18:00',
      businessDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      offlineMessage: "We're closed right now. Leave a message and we'll reply first thing in the morning!",
      tooltipText: 'Chat on WhatsApp',
      offsetX: 24,
      offsetY: 24,
    }),
    comp('scroll-to-top', 'Scroll to Top', {
      icon: 'ArrowUp',
      position: 'bottom-right',
      backgroundColor: '#dc2626',
      iconColor: '#ffffff',
      size: 44,
      showAfterScroll: 400,
      smooth: true,
      rounded: true,
      shadow: true,
      offsetX: 24,
      offsetY: 90,
      animation: 'fade',
    }),
  ];
}

/** Build page components for a given language */
function buildHomeComponents(l: typeof CONTENT.en, navFn: () => ReturnType<typeof comp>, footFn: () => ReturnType<typeof comp>) {
  return [
    navFn(),
    // Hero Carousel — reduced height
    comp('hero', 'Hero Carousel', {
      heading: '', subheading: '', variant: 'carousel',
      autoPlay: true, autoPlayInterval: 5, transition: 'fade',
      showDots: true, showArrows: true, pauseOnHover: true,
      alignment: 'left', height: 'medium',
      slides: l.heroSlides,
    }),
    // (Floating stats removed — trust badges and features cover this content better)
    // Marquee ticker
    comp('marquee', 'Promo Ticker', { text: l.marqueeText, speed: 35 }),
    // Trust Badges
    comp('trust-badges', 'Trust Badges', { title: l.trustTitle, badges: l.trustBadges, bgColor: '#f8fafc' }),
    // Why Choose Us — Features Grid
    comp('features', 'Why Choose Us', { title: l.whyUsTitle, subtitle: l.whyUsSubtitle, features: l.whyUsFeatures }),
    // Service Cards
    comp('service-card', 'Services', { title: l.servicesTitle, subtitle: l.servicesSubtitle, services: l.services }),
    // Parallax Section
    comp('parallax', 'Parallax', { imageUrl: IMG.autoGarage, heading: l.parallaxHeading, subheading: l.parallaxSubheading, height: 'medium', overlayOpacity: 55 }),
    // About Preview
    comp('image-text', 'About Preview', { title: l.aboutPreviewTitle, description: l.aboutPreviewDesc, imageUrl: IMG.autoShop, imagePosition: 'right' }),
    // Before & After
    comp('before-after', 'Before & After', { title: l.beforeAfterTitle, subtitle: l.beforeAfterSubtitle, beforeImage: IMG.autoEngine, afterImage: IMG.autoGarage, beforeLabel: l === CONTENT.en ? 'Before' : 'Avant', afterLabel: l === CONTENT.en ? 'After' : 'Après', bgColor: '#f8fafc' }),
    // Testimonials
    comp('testimonials', 'Testimonials', { title: l.testimonialsTitle, testimonials: l.testimonials }),
    // CTA Banner
    comp('cta-banner', 'CTA Banner', { heading: l.ctaHeading, subheading: l.ctaSubheading, ctaText: l.ctaCta, ctaLink: '#contact', secondaryCtaText: l.ctaSecondary, secondaryCtaLink: 'tel:+15551234567' }),
    // FAQ
    comp('faq', 'FAQ', { title: l.faqTitle, items: l.faqItems, bgColor: '#f8fafc' }),
    // Newsletter
    comp('newsletter', 'Newsletter', { title: l.newsletterTitle, subtitle: l.newsletterSubtitle, placeholder: l.newsletterPlaceholder, buttonText: l.newsletterButton }),
    ...floatingWidgets(),
    footFn(),
  ];
}

function buildServicesComponents(l: typeof CONTENT.en, navFn: () => ReturnType<typeof comp>, footFn: () => ReturnType<typeof comp>) {
  return [
    navFn(),
    comp('hero', 'Services Hero', { heading: l.servicesHeroTitle, subheading: l.servicesHeroSubtitle, alignment: 'center', height: 'medium', backgroundImage: IMG.autoEngine, overlayOpacity: 65 }),
    // Process steps (numbered)
    comp('service-card', 'How It Works', { title: l.processTitle, subtitle: l.processSubtitle, variant: 'numbered', columns: 4, showPricing: false, services: l.processSteps }),
    comp('divider', 'Divider', { style: 'line', spacing: 'lg' }),
    comp('tabs', 'Service Categories', { title: l.serviceTabsTitle, tabs: l.serviceTabs }),
    comp('service-card', 'All Services', { title: l.servicesTitle, subtitle: l.servicesSubtitle, variant: 'bordered', columns: 3, showPricing: true, services: l.services }),
    comp('pricing', 'Maintenance Plans', { title: l.pricingTitle, subtitle: l.pricingSubtitle, plans: l.plans, bgColor: '#f8fafc' }),
    comp('comparison-table', 'Plan Comparison', { title: l.comparisonTitle, headers: l.comparisonHeaders, rows: l.comparisonRows }),
    comp('cta-banner', 'Services CTA', { heading: l.servicesCtaHeading, subheading: l.servicesCtaSubheading, ctaText: l.servicesCtaCta, ctaLink: '#contact' }),
    ...floatingWidgets(),
    footFn(),
  ];
}

function buildAboutComponents(l: typeof CONTENT.en, navFn: () => ReturnType<typeof comp>, footFn: () => ReturnType<typeof comp>) {
  return [
    navFn(),
    comp('hero', 'About Hero', { heading: l.aboutHeroTitle, subheading: l.aboutHeroSubtitle, alignment: 'center', height: 'medium', backgroundImage: IMG.autoGarage, overlayOpacity: 55 }),
    comp('about', 'About Section', { title: l.aboutTitle, description: l.aboutDesc, imageUrl: IMG.autoShop }),
    comp('animated-stats', 'Company Stats', {
      stats: l.stats, variant: 'cards', animationStyle: 'count', columns: 4, bgColor: '#f8fafc',
    }),
    comp('team-grid', 'Our Team', { title: l.teamTitle, subtitle: l.teamSubtitle, members: l.team, bgColor: '#ffffff' }),
    comp('timeline', 'Our Journey', { title: l.timelineTitle, items: l.timeline }),
    comp('parallax', 'Values Parallax', { imageUrl: IMG.autoShop, heading: l.parallaxHeading, subheading: l.parallaxSubheading, height: 'small', overlayOpacity: 60 }),
    comp('logo-cloud', 'Certifications', { title: l.certificationsTitle, logos: l.certifications, bgColor: '#f8fafc' }),
    ...floatingWidgets(),
    footFn(),
  ];
}

function buildGalleryComponents(l: typeof CONTENT.en, navFn: () => ReturnType<typeof comp>, footFn: () => ReturnType<typeof comp>) {
  return [
    navFn(),
    comp('hero', 'Gallery Hero', { heading: l.galleryHeroTitle, subheading: l.galleryHeroSubtitle, alignment: 'center', height: 'small', backgroundImage: IMG.autoTools, overlayOpacity: 50 }),
    comp('lightbox-gallery', 'Gallery', { title: l.galleryTitle, columns: 4, images: l.galleryImages }),
    comp('divider', 'Divider', { style: 'line', spacing: 'lg' }),
    comp('before-after', 'Before & After', { title: l.beforeAfterTitle, subtitle: l.beforeAfterSubtitle, beforeImage: IMG.autoEngine, afterImage: IMG.autoGarage, beforeLabel: l === CONTENT.en ? 'Before' : 'Avant', afterLabel: l === CONTENT.en ? 'After' : 'Après', bgColor: '#f8fafc' }),
    comp('reviews', 'Customer Reviews', { title: l.reviewsTitle, subtitle: l.reviewsSubtitle, reviews: l.reviews, variant: 'featured', showAverage: true, showVerified: true, bgColor: '#ffffff' }),
    ...floatingWidgets(),
    footFn(),
  ];
}

function buildBlogComponents(l: typeof CONTENT.en, navFn: () => ReturnType<typeof comp>, footFn: () => ReturnType<typeof comp>) {
  return [
    navFn(),
    comp('hero', 'Blog Hero', { heading: l.blogHeroTitle, subheading: l.blogHeroSubtitle, alignment: 'center', height: 'small', backgroundImage: IMG.autoShop, overlayOpacity: 55 }),
    comp('blog-grid', 'Blog Posts', { title: l.blogTitle, posts: l.blogPosts, columns: 3, showDate: true, showCategory: true, showExcerpt: true }),
    comp('divider', 'Divider', { style: 'line', spacing: 'lg' }),
    comp('newsletter', 'Newsletter', { title: l.newsletterTitle, subtitle: l.newsletterSubtitle, placeholder: l.newsletterPlaceholder, buttonText: l.newsletterButton, bgColor: '#f8fafc' }),
    ...floatingWidgets(),
    footFn(),
  ];
}

function buildSpecialsComponents(l: typeof CONTENT.en, navFn: () => ReturnType<typeof comp>, footFn: () => ReturnType<typeof comp>) {
  return [
    navFn(),
    comp('hero', 'Specials Hero', { heading: l.specialsHeroTitle, subheading: l.specialsHeroSubtitle, alignment: 'center', height: 'small', backgroundImage: IMG.autoHero2, overlayOpacity: 60, variant: 'gradient', gradientAngle: 135 }),
    comp('countdown', 'Sale Countdown', { title: l.countdownTitle, targetDate: new Date(Date.now() + 30 * 86400000).toISOString() }),
    comp('service-card', 'Special Offers', { title: l === CONTENT.en ? 'Current Deals' : 'Offres actuelles', subtitle: l === CONTENT.en ? 'Limited-time prices — book now!' : 'Prix à durée limitée — réservez !', variant: 'bordered', columns: 2, showPricing: true, showLinks: true, services: l.specialsCards }),
    comp('marquee', 'Promo Ticker', { text: l.marqueeText, speed: 30 }),
    comp('trust-badges', 'Guarantees', { title: l.trustTitle, badges: l.trustBadges, bgColor: '#f8fafc' }),
    comp('cta-banner', 'Specials CTA', { heading: l.specialsCtaHeading, subheading: l.specialsCtaSubheading, ctaText: l.ctaCta, ctaLink: '#contact' }),
    ...floatingWidgets(),
    footFn(),
  ];
}

function buildContactComponents(l: typeof CONTENT.en, navFn: () => ReturnType<typeof comp>, footFn: () => ReturnType<typeof comp>) {
  return [
    navFn(),
    comp('hero', 'Contact Hero', { heading: l.contactHeroTitle, subheading: l.contactHeroSubtitle, alignment: 'center', height: 'small' }),
    comp('icon-text', 'Contact Info', { items: l.contactInfo, layout: 'horizontal', bgColor: '#f8fafc' }),
    comp('contact-form', 'Appointment Form', { title: l.appointmentTitle, subtitle: l.appointmentSubtitle, fields: ['name', 'email', 'phone', 'message'], submitText: l.appointmentSubmit }),
    comp('map', 'Location Map', { address: '456 Main St, Springfield, IL', height: 450, variant: 'split', infoPosition: 'left', mapTheme: 'light', showContactCard: true, contactCardTitle: l === CONTENT.en ? 'Visit Us' : 'Nous rendre visite', contactCardStyle: 'elevated', contactInfo: { address: '456 Main Street, Springfield, IL 62704', phone: '(555) 123-4567', email: 'service@autopro.com', hours: 'Mon-Fri: 7am-6pm\nSat: 8am-2pm\nSun: Closed' } }),
    comp('social-links', 'Social Links', { title: l.socialTitle, links: SOCIAL }),
    ...floatingWidgets(),
    footFn(),
  ];
}

// ─── Template definition ───────────────────────────────────────

export const carRepairTemplate: SiteTemplate = {
  id: 'car-repair',
  name: 'Car Repair Shop',
  description: 'Premium auto repair website with hero carousel, stacked navbar, 5 pages, parallax sections, process steps, and full English & French support.',
  icon: '🔧',
  category: 'Automotive',
  theme: {
    ...AUTO_THEME,
    primaryColor: '#dc2626',
    secondaryColor: '#475569',
    accentColor: '#f59e0b',
    backgroundColor: '#ffffff',
    textColor: '#0f172a',
    headingFont: 'Bebas Neue, sans-serif',
    bodyFont: 'DM Sans, sans-serif',
    borderRadius: 10,
    spacing: 16,
  },
  pageCount: 5,
  features: [
    'Hero carousel (3 slides)',
    'Stacked navbar with top bar',
    'Announcement marquee ticker',
    'Features grid',
    'Parallax sections',
    'Service cards with pricing',
    'Numbered process steps',
    'Before & after gallery',
    'Trust badges',
    'Animated statistics',
    'Pricing tiers & comparison',
    'Testimonials',
    'Split map with contact card',
    'Column footer',
    'Contact form',
    'Newsletter',
    'WhatsApp button',
    'Scroll to top',
    'English & French',
    'Language switcher',
  ],
  previewImage: IMG.autoHero,
  languages: SITE_LANGUAGES,
  translations: CONTENT,
  pages: () => {
    const lang = CONTENT.en;
    const langFr = CONTENT.fr;

    const rawPages = [
      // HOME
      page('Home', '', buildHomeComponents(lang, nav, foot), true, 0),
      // SERVICES
      page('Services', 'services', buildServicesComponents(lang, nav, foot), false, 1),
      // ABOUT
      page('About', 'about', buildAboutComponents(lang, nav, foot), false, 2),
      // GALLERY & REVIEWS
      page('Gallery', 'gallery', buildGalleryComponents(lang, nav, foot), false, 3),
      // CONTACT
      page('Contact', 'contact', buildContactComponents(lang, nav, foot), false, 4),
    ];

    const frBuilders = [
      () => buildHomeComponents(langFr, navFr, footFr),
      () => buildServicesComponents(langFr, navFr, footFr),
      () => buildAboutComponents(langFr, navFr, footFr),
      () => buildGalleryComponents(langFr, navFr, footFr),
      () => buildContactComponents(langFr, navFr, footFr),
    ];

    return rawPages.map((p, i) => {
      const frComps = frBuilders[i]();
      return { ...p, translations: { fr: { components: frComps, seo: { ...p.seo } } } };
    });
  },
};

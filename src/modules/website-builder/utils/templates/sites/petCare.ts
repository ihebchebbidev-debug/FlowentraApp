import { SiteTemplate } from '../index';
import { IMG, AVATAR } from '../images';
import { comp, page, makeNavbar, makeFooter } from '../helpers';
import { PETCARE_THEME } from '../themes';

export const petCareTemplate: SiteTemplate = {
  id: 'pet-care',
  name: 'Pet Care & Veterinary',
  description: 'Friendly veterinary clinic website with appointment booking, wellness plans, team profiles, patient gallery, blog, and pet care tips.',
  icon: '🐾',
  category: 'Pet Care',
  theme: PETCARE_THEME,
  pageCount: 6,
  features: ['Hero with pet image', 'Service cards', 'Wellness plans', 'Comparison table', 'Vet team profiles', 'Pet gallery', 'Blog', 'FAQ', 'Appointment booking', 'Trust badges', 'Newsletter', 'WhatsApp'],
  previewImage: IMG.petHero,
  pages: () => {
    const nav = makeNavbar('🐾 PawsFirst Vet', [
      { label: 'Home', href: '#' },
      { label: 'Services', href: '#services' },
      { label: 'Our Team', href: '#team' },
      { label: 'Gallery', href: '#gallery' },
      { label: 'Blog', href: '#blog' },
      { label: 'Contact', href: '#contact' },
    ], 'Book Visit');
    const foot = makeFooter('PawsFirst Veterinary Clinic', 'Compassionate care for your furry family', '(555) 729-7387', 'info@pawsfirst.vet', {
      links: [{ label: 'Home', href: '#' }, { label: 'Services', href: '#services' }, { label: 'Our Team', href: '#team' }, { label: 'Gallery', href: '#gallery' }, { label: 'Contact', href: '#contact' }],
      socialLinks: [{ platform: 'facebook', url: '#' }, { platform: 'instagram', url: '#' }, { platform: 'google', url: '#' }, { platform: 'youtube', url: '#' }],
    });
    return [
      // ═══════════════════════════════════════════════════
      // HOME
      // ═══════════════════════════════════════════════════
      page('Home', '', [
        nav(),
        comp('announcement-bar', 'Alert', {
          text: '🐶 New clients get a free wellness exam! Limited time offer.',
          linkText: 'Book Now →', linkUrl: '#contact', variant: 'primary',
        }),
        comp('hero', 'Hero', {
          heading: 'Compassionate Care\nfor Your Best Friend',
          subheading: 'Full-service veterinary clinic with 24/7 emergency services, fear-free approach, and a team that treats your pet like family.',
          ctaText: 'Book Appointment', ctaLink: '#contact',
          secondaryCtaText: 'Our Services', secondaryCtaLink: '#services',
          alignment: 'center', height: 'large',
          backgroundImage: IMG.petHero, overlayOpacity: 40,
        }),
        comp('trust-badges', 'Trust', {
          title: 'Why Pet Parents Choose Us',
          badges: [
            { icon: '🏥', label: 'AAHA Accredited' },
            { icon: '🩺', label: 'Board Certified Vets' },
            { icon: '🌙', label: '24/7 Emergency Care' },
            { icon: '💚', label: 'Fear-Free Certified' },
          ],
        }),
        comp('animated-stats', 'Stats', {
          stats: [
            { value: '15', label: 'Pets Treated', suffix: 'K+' },
            { value: '12', label: 'Years Open', suffix: '+' },
            { value: '4.9', label: 'Google Rating', suffix: '★' },
            { value: '24/7', label: 'Emergency Care' },
          ],
          variant: 'cards', columns: 4, animationStyle: 'count',
        }),
        comp('service-card', 'Services', {
          title: 'Our Services', bgColor: '#f0fdf4',
          services: [
            { icon: '🩺', title: 'Wellness Exams', description: 'Annual checkups, vaccinations, and preventive care plans.', price: 'From $65' },
            { icon: '🦷', title: 'Dental Care', description: 'Professional cleanings, extractions, and oral health.', price: 'From $195' },
            { icon: '🔬', title: 'Diagnostics', description: 'In-house lab, digital X-ray, ultrasound, and bloodwork.', price: 'From $85' },
            { icon: '✂️', title: 'Surgery', description: 'Spay/neuter, soft tissue, and orthopedic procedures.', price: 'From $250' },
          ],
        }),
        comp('image-text', 'About', {
          title: 'A Clinic That Feels Like Home',
          description: 'PawsFirst was founded by Dr. Emily Carter in 2013 with a simple mission: provide compassionate, fear-free veterinary care. Our facility features separate cat and dog waiting areas, calming pheromone diffusers, and treats at every step.',
          imageUrl: IMG.petClinic, imagePosition: 'right',
        }),
        comp('testimonials', 'Reviews', {
          title: 'Pet Parent Reviews', variant: 'carousel',
          testimonials: [
            { name: 'Jessica M.', role: 'Dog Owner', text: 'Dr. Carter is incredible with my anxious rescue. She takes the time to make every visit stress-free.', rating: 5, avatar: AVATAR.w1 },
            { name: 'Mark & Lisa T.', role: 'Cat Owners', text: 'They saved our Whiskers at 2AM on a Sunday. We\'ll never go anywhere else.', rating: 5, avatar: AVATAR.m1 },
            { name: 'Carlos R.', role: 'Multi-pet Household', text: 'Three dogs and two cats — the team knows all of them by name. That\'s special.', rating: 5, avatar: AVATAR.m2 },
            { name: 'Amanda W.', role: 'Puppy Owner', text: 'Their puppy wellness plan saved us so much. Amazing value and care.', rating: 5, avatar: AVATAR.w2 },
          ],
        }),
        comp('parallax', 'Parallax', {
          imageUrl: IMG.petDog,
          heading: 'Every Pet Deserves the Best Care',
          subheading: 'Fear-free, compassionate veterinary medicine since 2013.',
          height: 'small', overlayOpacity: 45,
        }),
        comp('faq', 'FAQ', {
          title: 'Common Questions', variant: 'accordion',
          items: [
            { question: 'Do you see exotic pets?', answer: 'Yes! We treat dogs, cats, rabbits, birds, reptiles, and small mammals.' },
            { question: 'Do you offer payment plans?', answer: 'Yes, we accept CareCredit and offer in-house plans for procedures over $500.' },
            { question: 'What should I bring to a first visit?', answer: 'Bring any medical records, a list of current medications, and a fresh stool sample if possible.' },
            { question: 'Do you offer boarding?', answer: 'We offer medical boarding for pets requiring observation. For regular boarding, we partner with trusted local facilities.' },
          ],
        }),
        comp('cta-banner', 'CTA', {
          heading: 'Your Pet\'s Health Starts Here',
          subheading: 'New clients receive a free wellness exam — book today.',
          ctaText: 'Schedule Visit', ctaLink: '#contact',
        }),
        comp('newsletter', 'Newsletter', {
          title: 'Pet Health Tips', subtitle: 'Monthly tips on nutrition, training, and preventive care.',
          placeholder: 'Your email', buttonText: 'Subscribe',
          variant: 'split', showIcon: true, iconType: 'heart',
        }),
        comp('whatsapp-button', 'WhatsApp', {
          phoneNumber: '+15557297387', defaultMessage: 'Hi! I\'d like to book an appointment for my pet.',
          position: 'bottom-right', pulseAnimation: true, showGreeting: true,
          greetingText: 'Hi there! 🐾 Need to book a visit?', agentName: 'PawsFirst',
        }),
        comp('scroll-to-top', 'Scroll', { position: 'bottom-right', offsetY: 90 }),
        foot(),
      ], true, 0),

      // ═══════════════════════════════════════════════════
      // SERVICES
      // ═══════════════════════════════════════════════════
      page('Services', 'services', [
        nav(),
        comp('hero', 'Services Hero', {
          heading: 'Veterinary Services', subheading: 'Complete care for every stage of your pet\'s life.',
          alignment: 'center', height: 'medium', backgroundImage: IMG.petDog, overlayOpacity: 55,
        }),
        comp('features', 'All Services', {
          title: 'Full-Service Veterinary Care', columns: 3,
          features: [
            { icon: '🩺', title: 'Preventive Care', description: 'Wellness exams, vaccines, parasite prevention.' },
            { icon: '🦷', title: 'Dentistry', description: 'Cleanings, extractions, oral surgery.' },
            { icon: '🔬', title: 'Diagnostics', description: 'Lab, X-ray, ultrasound, endoscopy.' },
            { icon: '✂️', title: 'Surgery', description: 'Spay/neuter, soft tissue, orthopedic.' },
            { icon: '🌙', title: 'Emergency', description: '24/7 emergency and critical care.' },
            { icon: '💊', title: 'Pharmacy', description: 'In-house and online pharmacy services.' },
          ],
        }),
        comp('pricing', 'Plans', {
          title: 'Wellness Plans',
          plans: [
            { name: 'Puppy/Kitten', price: '$39/mo', features: ['All core vaccines', '2 exams/year', 'Parasite prevention', 'Microchip'], highlighted: false },
            { name: 'Adult', price: '$49/mo', features: ['Annual exam + bloodwork', 'Dental cleaning', 'Parasite prevention', '15% off services'], highlighted: true },
            { name: 'Senior', price: '$69/mo', features: ['Bi-annual exams', 'Comprehensive bloodwork', 'Joint supplements', '20% off services'], highlighted: false },
          ],
        }),
        comp('comparison-table', 'Compare', {
          title: 'Plan Comparison',
          headers: ['Puppy/Kitten', 'Adult', 'Senior'],
          rows: [
            { feature: 'Annual Exams', values: ['2', '1', '2'] },
            { feature: 'Core Vaccines', values: ['true', 'true', 'true'] },
            { feature: 'Dental Cleaning', values: ['false', 'true', 'true'] },
            { feature: 'Bloodwork', values: ['false', 'Basic', 'Comprehensive'] },
            { feature: 'Joint Supplements', values: ['false', 'false', 'true'] },
            { feature: 'Service Discount', values: ['10%', '15%', '20%'] },
          ],
        }),
        foot(),
      ], false, 1),

      // ═══════════════════════════════════════════════════
      // TEAM
      // ═══════════════════════════════════════════════════
      page('Our Team', 'team', [
        nav(),
        comp('hero', 'Team Hero', {
          heading: 'Meet Our Team', subheading: 'Dedicated professionals who love what they do.',
          alignment: 'center', height: 'small',
        }),
        comp('team-grid', 'Vets', {
          title: 'Our Veterinarians',
          members: [
            { name: 'Dr. Emily Carter', role: 'Founder & Lead Vet', bio: 'DVM Cornell, 15+ years experience. Fear-Free certified.', avatar: AVATAR.w1 },
            { name: 'Dr. James Park', role: 'Surgeon', bio: 'Board-certified surgical specialist. ACVS diplomate.', avatar: AVATAR.m1 },
            { name: 'Dr. Sofia Ramirez', role: 'Dentistry', bio: 'Veterinary dental specialist. AVDC fellow.', avatar: AVATAR.w3 },
            { name: 'Dr. Michael Chen', role: 'Emergency & Critical Care', bio: 'ACVECC diplomate. Leads our 24/7 ER team.', avatar: AVATAR.m2 },
          ],
        }),
        comp('image-text', 'Culture', {
          title: 'Our Philosophy',
          description: 'We practice Fear-Free veterinary medicine, meaning every interaction is designed to minimize stress for your pet. From calming pheromones to gentle handling techniques, we ensure your pet feels safe and comfortable.',
          imageUrl: IMG.petClinic, imagePosition: 'left',
        }),
        foot(),
      ], false, 2),

      // ═══════════════════════════════════════════════════
      // GALLERY
      // ═══════════════════════════════════════════════════
      page('Gallery', 'gallery', [
        nav(),
        comp('hero', 'Gallery Hero', {
          heading: 'Our Happy Patients', subheading: 'Every tail wag makes our day.',
          alignment: 'center', height: 'small',
        }),
        comp('lightbox-gallery', 'Gallery', {
          title: 'Patient Gallery', columns: 3,
          images: [
            { url: IMG.petDog, caption: 'Max — Annual checkup' },
            { url: IMG.petCat, caption: 'Luna — Dental cleaning' },
            { url: IMG.petGrooming, caption: 'Bella — Spa day' },
            { url: IMG.petPuppy, caption: 'Charlie — Puppy package' },
            { url: IMG.petKitten, caption: 'Milo — First visit' },
            { url: IMG.petClinic, caption: 'Our state-of-the-art facility' },
          ],
        }),
        foot(),
      ], false, 3),

      // ═══════════════════════════════════════════════════
      // BLOG
      // ═══════════════════════════════════════════════════
      page('Blog', 'blog', [
        nav(),
        comp('hero', 'Blog Hero', {
          heading: 'Pet Health Blog', subheading: 'Expert advice to keep your pet happy and healthy.',
          alignment: 'center', height: 'small',
        }),
        comp('blog-grid', 'Posts', {
          title: 'Latest Articles', columns: 3,
          posts: [
            { title: 'Top 5 Signs Your Pet Needs a Dental Cleaning', excerpt: 'Bad breath isn\'t normal — here\'s what to watch for.', category: 'Dental', date: 'Feb 2026', author: 'Dr. Ramirez' },
            { title: 'Puppy Vaccination Schedule 2026', excerpt: 'Everything new puppy parents need to know about vaccines.', category: 'Preventive', date: 'Jan 2026', author: 'Dr. Carter' },
            { title: 'Senior Pet Care: What Changes After Age 7', excerpt: 'How to adapt your pet\'s healthcare as they age.', category: 'Senior Care', date: 'Jan 2026', author: 'Dr. Park' },
            { title: 'Is Your Cat Hiding Pain?', excerpt: 'Cats are masters at hiding discomfort. Look for these subtle signs.', category: 'Cat Care', date: 'Dec 2025', author: 'Dr. Carter' },
            { title: 'Holiday Foods That Are Toxic to Pets', excerpt: 'Keep your pets safe during the festive season.', category: 'Safety', date: 'Nov 2025', author: 'Dr. Chen' },
            { title: 'The Benefits of Pet Insurance', excerpt: 'Is pet insurance worth it? A vet\'s honest perspective.', category: 'Finance', date: 'Oct 2025', author: 'Dr. Carter' },
          ],
        }),
        foot(),
      ], false, 4),

      // ═══════════════════════════════════════════════════
      // CONTACT
      // ═══════════════════════════════════════════════════
      page('Contact', 'contact', [
        nav(),
        comp('hero', 'Contact Hero', {
          heading: 'Book Your Visit', subheading: 'Online scheduling available 24/7.',
          alignment: 'center', height: 'small',
        }),
        comp('contact-form', 'Form', {
          title: 'Request Appointment',
          fields: ['name', 'email', 'phone', 'message'], submitText: 'Book Appointment', variant: 'card',
        }),
        comp('icon-text', 'Info', {
          items: [
            { icon: '📍', title: 'Location', description: '220 Pawprint Lane, Austin, TX 78701' },
            { icon: '📞', title: 'Phone', description: '(555) 729-7387' },
            { icon: '🚨', title: 'Emergency', description: '24/7 — Call (555) 729-7388' },
            { icon: '⏰', title: 'Hours', description: 'Mon-Fri 7AM-8PM · Sat 8AM-5PM · Sun 9AM-3PM' },
          ],
          layout: 'horizontal',
        }),
        comp('map', 'Map', { address: '220 Pawprint Lane, Austin, TX', height: 350 }),
        foot(),
      ], false, 5),
    ];
  },
};

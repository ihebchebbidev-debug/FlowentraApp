import { SiteTemplate } from '../index';
import { IMG, AVATAR } from '../images';
import { comp, page, makeNavbar, makeFooter } from '../helpers';
import { CHURCH_THEME } from '../themes';

export const churchMinistryTemplate: SiteTemplate = {
  id: 'church-ministry',
  name: 'Church & Ministry',
  description: 'Warm church community website with service times, ministries, events, sermons, giving options, blog, and visitor welcome experience.',
  icon: '⛪',
  category: 'Community',
  theme: CHURCH_THEME,
  pageCount: 6,
  features: ['Hero with church image', 'Service times', 'Ministry groups', 'Events tabs', 'Staff profiles', 'Timeline', 'Blog', 'Online giving', 'Visitor welcome', 'FAQ', 'Newsletter', 'Trust badges'],
  previewImage: IMG.churchHero,
  pages: () => {
    const nav = makeNavbar('⛪ Grace Community Church', [
      { label: 'Home', href: '#' },
      { label: 'About', href: '#about' },
      { label: 'Ministries', href: '#ministries' },
      { label: 'Events', href: '#events' },
      { label: 'Blog', href: '#blog' },
      { label: 'Visit Us', href: '#visit' },
    ], 'Plan Your Visit');
    const foot = makeFooter('Grace Community Church', 'A place to belong, believe, and become', '(555) 467-2234', 'info@gracecommunity.church', {
      links: [{ label: 'Home', href: '#' }, { label: 'About', href: '#about' }, { label: 'Ministries', href: '#ministries' }, { label: 'Events', href: '#events' }, { label: 'Visit Us', href: '#visit' }],
      socialLinks: [{ platform: 'youtube', url: '#' }, { platform: 'instagram', url: '#' }, { platform: 'facebook', url: '#' }],
    });
    return [
      // ═══════════════════════════════════════════════════
      // HOME
      // ═══════════════════════════════════════════════════
      page('Home', '', [
        nav(),
        comp('hero', 'Hero', {
          heading: 'A Place to Belong',
          subheading: 'Grace Community Church is a welcoming family where everyone is valued, loved, and empowered to grow.',
          ctaText: 'Plan Your Visit', ctaLink: '#visit',
          secondaryCtaText: 'Watch Live', secondaryCtaLink: '#live',
          alignment: 'center', height: 'large',
          backgroundImage: IMG.churchHero, overlayOpacity: 45,
        }),
        comp('icon-text', 'Service Times', {
          items: [
            { icon: '☀️', title: 'Sunday Morning', description: '9:00 AM — Traditional Service\n11:00 AM — Contemporary Service' },
            { icon: '🌙', title: 'Wednesday Evening', description: '7:00 PM — Midweek Bible Study & Prayer' },
            { icon: '👶', title: 'Kids & Youth', description: 'Programs during all Sunday services for ages 0-18' },
          ],
          layout: 'horizontal',
        }),
        comp('trust-badges', 'Trust', {
          title: 'Grace Community at a Glance',
          badges: [
            { icon: '❤️', label: 'All Are Welcome' },
            { icon: '📖', label: 'Bible-Centered Teaching' },
            { icon: '🎵', label: 'Uplifting Worship' },
            { icon: '👨‍👩‍👧‍👦', label: 'Family Friendly' },
          ],
        }),
        comp('animated-stats', 'Stats', {
          stats: [
            { value: '1200', label: 'Weekly Attendance', suffix: '+' },
            { value: '45', label: 'Small Groups', suffix: '+' },
            { value: '20', label: 'Active Ministries', suffix: '+' },
            { value: '15', label: 'Years Serving' },
          ],
          variant: 'cards', columns: 4, animationStyle: 'count',
        }),
        comp('image-text', 'Welcome', {
          title: 'You\'re Invited',
          description: 'Whether you\'ve been following Jesus for decades or you\'re just curious about faith, Grace Community is where you\'ll be welcomed with open arms. Come as you are — grab a coffee, find a seat, and experience community.',
          imageUrl: IMG.churchCommunity, imagePosition: 'right',
        }),
        comp('features', 'What to Expect', {
          title: 'What to Expect', columns: 4, bgColor: '#faf5ff',
          features: [
            { icon: '🎵', title: 'Uplifting Worship', description: 'A blend of contemporary worship and beloved hymns led by our talented worship team.' },
            { icon: '📖', title: 'Biblical Teaching', description: 'Relevant, verse-by-verse teaching that connects scripture to everyday life.' },
            { icon: '👨‍👩‍👧‍👦', title: 'Family Friendly', description: 'Safe, fun, age-appropriate programs for kids from nursery through high school.' },
            { icon: '☕', title: 'Warm Community', description: 'Free coffee bar, friendly greeters, and plenty of opportunities to connect.' },
          ],
        }),
        comp('service-card', 'Ministries', {
          title: 'Our Ministries',
          services: [
            { icon: '👶', title: 'Children\'s Ministry', description: 'Age-appropriate Bible lessons, worship, and activities for ages 0-5th grade.', price: '' },
            { icon: '🎸', title: 'Youth Group', description: 'Wednesday night gatherings, retreats, mission trips, and mentorship for teens.', price: '' },
            { icon: '📚', title: 'Small Groups', description: '45+ midweek home groups for Bible study, prayer, and authentic community.', price: '' },
            { icon: '🤝', title: 'Community Outreach', description: 'Food pantry, homeless ministry, disaster relief, and local service projects.', price: '' },
          ],
        }),
        comp('testimonials', 'Stories', {
          title: 'Life Change Stories', variant: 'carousel',
          testimonials: [
            { name: 'The Martinez Family', role: 'Members since 2019', text: 'We walked in as strangers and immediately found a family. Our kids love GraceKids.', rating: 5, avatar: AVATAR.m1 },
            { name: 'James W.', role: 'First-time visitor', text: 'I was nervous about stepping into a church for the first time in years. Everyone made me feel so welcome and accepted.', rating: 5, avatar: AVATAR.m2 },
            { name: 'Sarah & Tom K.', role: 'Small group leaders', text: 'Leading a small group has deepened our faith and given us lifelong friendships.', rating: 5, avatar: AVATAR.w1 },
          ],
        }),
        comp('parallax', 'Parallax', {
          imageUrl: IMG.churchInterior,
          heading: 'Belong. Believe. Become.',
          subheading: 'Your journey of faith starts with a single step.',
          height: 'small', overlayOpacity: 50,
        }),
        comp('cta-banner', 'Give', {
          heading: 'Support Our Mission',
          subheading: 'Your generosity fuels our ministries, outreach, and community impact.',
          ctaText: 'Give Online', ctaLink: '#give',
        }),
        comp('newsletter', 'Newsletter', {
          title: 'Stay Connected', subtitle: 'Get weekly sermon notes, event updates, and prayer requests.',
          placeholder: 'Enter your email', buttonText: 'Subscribe',
          variant: 'split', showIcon: true, iconType: 'heart',
        }),
        comp('scroll-to-top', 'Scroll', { position: 'bottom-right' }),
        foot(),
      ], true, 0),

      // ═══════════════════════════════════════════════════
      // ABOUT
      // ═══════════════════════════════════════════════════
      page('About', 'about', [
        nav(),
        comp('hero', 'About Hero', {
          heading: 'Our Story', subheading: 'Rooted in faith, growing in love.',
          alignment: 'center', height: 'medium', backgroundImage: IMG.churchInterior, overlayOpacity: 50,
        }),
        comp('image-text', 'History', {
          title: 'How It Started',
          description: 'Grace Community began in 2011 when Pastor David Thompson invited 15 people to a living room Bible study. What started as a small gathering of seekers has grown into a vibrant community of 1,200+ people united by faith, love, and service.',
          imageUrl: IMG.churchCommunity, imagePosition: 'left',
        }),
        comp('timeline', 'Journey', {
          title: 'Our Journey',
          items: [
            { date: '2011', title: 'Living Room Launch', description: '15 people at the first Bible study in the Thompson living room.' },
            { date: '2013', title: 'First Building', description: 'Moved into a converted warehouse with 200 seats.' },
            { date: '2015', title: 'First Mission Trip', description: 'Sent our first team to Guatemala to build a school.' },
            { date: '2017', title: 'New Campus', description: 'Opened our current 800-seat sanctuary.' },
            { date: '2020', title: 'Online Ministry', description: 'Launched livestream services reaching 2,000+ viewers weekly.' },
            { date: '2026', title: 'Today', description: '1,200+ weekly attendance, 20+ ministries, still growing.' },
          ],
        }),
        comp('team-grid', 'Staff', {
          title: 'Our Staff',
          members: [
            { name: 'Pastor David Thompson', role: 'Lead Pastor', bio: 'MDiv, founded Grace Community in 2011. Passionate about biblical teaching.', avatar: AVATAR.m1 },
            { name: 'Rachel Thompson', role: 'Women\'s Ministry Director', bio: 'Author, speaker, and mom of 3. Leads Bible studies and retreats.', avatar: AVATAR.w1 },
            { name: 'Marcus Johnson', role: 'Worship Pastor', bio: '15 years of music ministry. Singer-songwriter and recording artist.', avatar: AVATAR.m3 },
            { name: 'Jennifer Kim', role: 'Children\'s Ministry Director', bio: '10 years in children\'s ministry. Makes church fun for every kid.', avatar: AVATAR.w3 },
          ],
        }),
        comp('features', 'Beliefs', {
          title: 'What We Believe', columns: 3,
          features: [
            { icon: '📖', title: 'Scripture', description: 'The Bible is the inspired, authoritative Word of God.' },
            { icon: '✝️', title: 'Jesus Christ', description: 'Salvation through faith in Jesus Christ alone.' },
            { icon: '🕊️', title: 'Holy Spirit', description: 'The Holy Spirit empowers believers for life and ministry.' },
          ],
        }),
        foot(),
      ], false, 1),

      // ═══════════════════════════════════════════════════
      // MINISTRIES
      // ═══════════════════════════════════════════════════
      page('Ministries', 'ministries', [
        nav(),
        comp('hero', 'Ministries Hero', {
          heading: 'Ministries', subheading: 'Find your place to connect, grow, and serve.',
          alignment: 'center', height: 'medium',
        }),
        comp('service-card', 'All Ministries', {
          title: 'Ministry Groups',
          services: [
            { icon: '👶', title: 'GraceKids', description: 'Nursery through 5th grade. Fun, safe, Bible-centered.', price: '' },
            { icon: '🎸', title: 'GraceYouth', description: '6th-12th grade. Wednesday nights, retreats, and mission trips.', price: '' },
            { icon: '📚', title: 'Small Groups', description: '45+ home groups across the city for study and community.', price: '' },
            { icon: '👩', title: 'Women\'s Ministry', description: 'Bible studies, conferences, mentorship, and retreats.', price: '' },
            { icon: '👨', title: 'Men\'s Ministry', description: 'Saturday breakfasts, accountability groups, and service.', price: '' },
            { icon: '🌍', title: 'Global Missions', description: 'Supporting missionaries and teams in 12 countries.', price: '' },
            { icon: '🎵', title: 'Worship Arts', description: 'Choir, band, production, and creative arts team.', price: '' },
            { icon: '🤝', title: 'Community Outreach', description: 'Food pantry, tutoring, homeless ministry, and disaster relief.', price: '' },
          ],
        }),
        foot(),
      ], false, 2),

      // ═══════════════════════════════════════════════════
      // EVENTS
      // ═══════════════════════════════════════════════════
      page('Events', 'events', [
        nav(),
        comp('hero', 'Events Hero', {
          heading: 'Upcoming Events', subheading: 'Life is better together — join us!',
          alignment: 'center', height: 'small',
        }),
        comp('tabs', 'Events', {
          tabs: [
            { label: 'This Month', content: '<p><strong>Feb 14 — Valentine\'s Dinner</strong><br/>6:30 PM at the Fellowship Hall. $25/couple. Childcare provided.</p><p><strong>Feb 22 — Men\'s Breakfast</strong><br/>8:00 AM. Pancakes, fellowship, and a message from Pastor David. Free.</p><p><strong>Feb 28 — Family Movie Night</strong><br/>6:00 PM. Popcorn and a kid-friendly movie in the gym. Free.</p>' },
            { label: 'Coming Up', content: '<p><strong>Mar 8 — Women\'s Retreat</strong><br/>Weekend at Mountain Lodge. Speaker: Rachel Thompson. $149.</p><p><strong>Mar 22 — Serve Day</strong><br/>City-wide community service. All ages welcome.</p><p><strong>Apr 20 — Easter Celebration</strong><br/>Special services at 9:00 AM & 11:00 AM. Egg hunt for kids!</p>' },
            { label: 'Recurring', content: '<p><strong>Every Sunday</strong><br/>9:00 AM & 11:00 AM — Worship Services</p><p><strong>Every Wednesday</strong><br/>7:00 PM — Bible Study, Youth Group, & Kids Programs</p><p><strong>First Saturday</strong><br/>8:00 AM — Community Prayer Breakfast</p>' },
          ],
        }),
        comp('cta-banner', 'Events CTA', {
          heading: 'Never Miss an Event',
          subheading: 'Subscribe to our newsletter for weekly updates.',
          ctaText: 'Subscribe', ctaLink: '#newsletter',
        }),
        foot(),
      ], false, 3),

      // ═══════════════════════════════════════════════════
      // BLOG
      // ═══════════════════════════════════════════════════
      page('Blog', 'blog', [
        nav(),
        comp('hero', 'Blog Hero', {
          heading: 'Grace Blog', subheading: 'Devotionals, sermon recaps, and community stories.',
          alignment: 'center', height: 'small',
        }),
        comp('blog-grid', 'Posts', {
          title: 'Latest Posts', columns: 3,
          posts: [
            { title: 'Finding Peace in Uncertain Times', excerpt: 'How faith anchors us when the world feels unstable.', category: 'Devotional', date: 'Feb 2026', author: 'Pastor David' },
            { title: 'Why Community Matters', excerpt: 'God designed us for connection — here\'s why small groups change lives.', category: 'Community', date: 'Jan 2026', author: 'Rachel T.' },
            { title: 'Raising Kids with Faith', excerpt: 'Practical tips for passing on your faith to the next generation.', category: 'Family', date: 'Jan 2026', author: 'Jennifer K.' },
            { title: 'Worship: More Than Music', excerpt: 'What it really means to live a life of worship.', category: 'Worship', date: 'Dec 2025', author: 'Marcus J.' },
            { title: 'Serving Beyond Sunday', excerpt: 'How our outreach programs are making a difference in our city.', category: 'Outreach', date: 'Nov 2025', author: 'Pastor David' },
            { title: 'Guatemala Mission Trip Recap', excerpt: 'Stories and photos from our team\'s trip to build a school.', category: 'Missions', date: 'Oct 2025', author: 'Jennifer K.' },
          ],
        }),
        foot(),
      ], false, 4),

      // ═══════════════════════════════════════════════════
      // VISIT US
      // ═══════════════════════════════════════════════════
      page('Visit Us', 'visit', [
        nav(),
        comp('hero', 'Visit Hero', {
          heading: 'Plan Your Visit', subheading: 'We can\'t wait to meet you!',
          alignment: 'center', height: 'small',
        }),
        comp('features', 'What to Know', {
          title: 'First-Time Visitor Info', columns: 4,
          features: [
            { icon: '🅿️', title: 'Parking', description: 'Free parking in our main lot and overflow lot across the street.' },
            { icon: '☕', title: 'Welcome Center', description: 'Stop by for a free coffee and a welcome gift — we\'d love to meet you.' },
            { icon: '👶', title: 'Kids Check-In', description: 'Secure electronic check-in for all children\'s programs.' },
            { icon: '👔', title: 'Dress Code', description: 'Come as you are! Jeans, shorts, suits — all welcome.' },
          ],
        }),
        comp('faq', 'FAQ', {
          title: 'Visitor FAQ', variant: 'accordion',
          items: [
            { question: 'How long are the services?', answer: 'About 75 minutes — 25 minutes of worship and 40-45 minutes of teaching, plus greeting time.' },
            { question: 'Is there childcare during services?', answer: 'Yes! We have programs for nursery (0-2), preschool (3-5), and elementary (K-5th) during all services.' },
            { question: 'What style of worship do you have?', answer: 'Our 9 AM service is more traditional with hymns. Our 11 AM service is contemporary with a full band.' },
            { question: 'Do I need to register?', answer: 'No registration needed — just show up! But filling out the form below helps us prepare for your visit.' },
          ],
        }),
        comp('contact-form', 'Form', {
          title: 'Let Us Know You\'re Coming', subtitle: 'We\'ll have a welcome gift ready for you!',
          fields: ['name', 'email', 'phone', 'message'], submitText: 'Plan My Visit', variant: 'card',
        }),
        comp('icon-text', 'Details', {
          items: [
            { icon: '📍', title: 'Address', description: '800 Grace Avenue, Nashville, TN 37203' },
            { icon: '⏰', title: 'Sunday Services', description: '9:00 AM (Traditional) · 11:00 AM (Contemporary)' },
            { icon: '📞', title: 'Phone', description: '(555) 467-2234' },
          ],
          layout: 'horizontal',
        }),
        comp('map', 'Map', { address: '800 Grace Avenue, Nashville, TN', height: 350 }),
        foot(),
      ], false, 5),
    ];
  },
};

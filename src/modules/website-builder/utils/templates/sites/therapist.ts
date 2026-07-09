import { SiteTemplate } from '../index';
import { IMG, AVATAR } from '../images';
import { comp, page, makeNavbar, makeFooter } from '../helpers';
import { SiteTheme } from '../../../types';

/**
 * Therapist / Counselor — calming, warm site for private-practice
 * therapists, counselors, coaches. 4 pages: Home, Approach, About, Contact.
 */
const THERAPIST_THEME: SiteTheme = {
  primaryColor: '#7c8e6b',
  secondaryColor: '#5f6b58',
  accentColor: '#d9b382',
  backgroundColor: '#f8f5f0',
  textColor: '#2f2a26',
  headingFont: 'Cormorant Garamond, serif',
  bodyFont: 'Nunito, sans-serif',
  borderRadius: 18,
  spacing: 22,
  shadowStyle: 'subtle',
  buttonStyle: 'pill',
  sectionPadding: 1.25,
  fontScale: 1.03,
  letterSpacing: 0,
  linkStyle: 'hover-underline',
  headingTransform: 'none',
};

export const therapistTemplate: SiteTemplate = {
  id: 'therapist-counselor',
  name: 'Therapist / Counselor',
  description: 'Calm, warm private-practice site for therapists and counselors — approach, specialties, credentials and secure booking.',
  icon: '🌾',
  category: 'Health & Wellness',
  theme: THERAPIST_THEME,
  pageCount: 4,
  features: [
    'Calming hero', 'Specialties & approach', 'Credentials', 'Session pricing',
    'FAQ (fees, insurance, telehealth)', 'Booking CTA', 'Confidential contact form',
  ],
  previewImage: IMG.medicalHero,
  pages: () => {
    const nav = makeNavbar('Clara Bennett, LCSW', [
      { label: 'Home', href: '#' },
      { label: 'Approach', href: '#approach' },
      { label: 'About', href: '#about' },
      { label: 'Contact', href: '#contact' },
    ], 'Book a Consult');

    const foot = makeFooter(
      'Clara Bennett Therapy',
      'Individual and couples therapy · Licensed in NY & CA',
      '(555) 830-2210',
      'hello@clarabennett.co',
      {
        links: [
          { label: 'Home', href: '#' },
          { label: 'Approach', href: '#approach' },
          { label: 'FAQ', href: '#faq' },
          { label: 'Contact', href: '#contact' },
        ],
        socialLinks: [
          { platform: 'instagram', url: '#' },
          { platform: 'linkedin', url: '#' },
        ],
      },
    );

    return [
      // ── Home ──
      page('Home', '', [
        nav(),
        comp('hero', 'Hero', {
          heading: 'A quiet space to think, feel, and move forward.',
          subheading: 'Confidential individual and couples therapy — in-person in Brooklyn, and online across NY and CA.',
          ctaText: 'Book a free consult',
          ctaLink: '#contact',
          secondaryCtaText: 'How I work',
          secondaryCtaLink: '#approach',
          alignment: 'left',
          height: 'large',
          backgroundImage: IMG.medicalHero,
          overlayOpacity: 25,
        }),
        comp('features', 'Specialties', {
          title: 'What I help with',
          subtitle: 'A focused practice, not a supermarket. If we\'re not a fit, I\'ll gladly refer you on.',
          columns: 3,
          features: [
            { icon: '🌿', title: 'Anxiety & burnout', description: 'For high-performing adults whose bodies are telling them to slow down.' },
            { icon: '🤍', title: 'Relationships & couples', description: 'Communication patterns, repair after ruptures, and staying close through change.' },
            { icon: '🌊', title: 'Life transitions', description: 'New parenthood, career pivots, loss, identity shifts — the harder in-between times.' },
            { icon: '🧭', title: 'Trauma-informed', description: 'EMDR-trained; slow, consent-led work with what still lingers from the past.' },
            { icon: '☁️', title: 'Grief & loss', description: 'Space for grief that doesn\'t fit a timeline or a template.' },
            { icon: '🌱', title: 'Self-worth', description: 'The quiet, chronic inner critic — and what it might be trying to protect.' },
          ],
        }),
        comp('image-text', 'Approach', {
          title: 'Warm, direct, and rooted in evidence.',
          description: 'My work draws on relational psychodynamic therapy, EMDR, and IFS — but the theory sits in the background. What you get is a real conversation with someone who is fully present, not taking notes on a laptop.',
          imageUrl: IMG.salon2,
          imagePosition: 'right',
          ctaText: 'Read more about my approach',
          ctaLink: '#approach',
        }),
        comp('testimonials', 'Testimonials', {
          title: 'From clients',
          subtitle: 'Shared anonymously and with permission.',
          variant: 'grid',
          testimonials: [
            { name: 'A. · in her 30s', role: 'Individual therapy', text: 'For the first time I feel like therapy is actually going somewhere. Clara is warm and honest and never lets me off my own hook.', rating: 5 },
            { name: 'J. & M.', role: 'Couples therapy', text: 'We stopped fighting the same fight in circles. Six months in and we\'re speaking to each other again — really speaking.', rating: 5 },
            { name: 'D. · in his 40s', role: 'Individual therapy', text: 'She holds a lot of space without ever feeling passive. It has changed my life quietly, in the best way.', rating: 5 },
          ],
        }),
        comp('pricing', 'Fees', {
          title: 'Fees & sessions',
          plans: [
            {
              name: 'Individual',
              price: '$220 / 50 min',
              features: ['Weekly or biweekly', 'In-person or telehealth', 'Superbills for OON insurance', 'Sliding-scale slots available'],
              highlighted: false,
              ctaText: 'Book a consult',
            },
            {
              name: 'Couples',
              price: '$285 / 60 min',
              features: ['Weekly recommended', 'In-person or telehealth', 'Six-month arc typical', 'Both partners present each session'],
              highlighted: true,
              ctaText: 'Book a consult',
            },
            {
              name: 'Consultation',
              price: 'Free · 20 min',
              features: ['Video call, no obligation', 'Get a feel for the fit', 'Ask anything about how I work', 'Referral if I\'m not a fit'],
              highlighted: false,
              ctaText: 'Book a consult',
            },
          ],
        }),
        comp('cta-banner', 'CTA', {
          heading: 'Not sure if therapy is right for you?',
          subheading: 'A 20-minute video consult is free, and there\'s no pressure to book after it.',
          ctaText: 'Book a free consult',
          ctaLink: '#contact',
        }),
        foot(),
      ], true, 0),

      // ── Approach ──
      page('Approach', 'approach', [
        nav(),
        comp('hero', 'Approach Hero', {
          heading: 'How I work',
          subheading: 'A few honest notes on what to expect.',
          alignment: 'center',
          height: 'small',
        }),
        comp('features', 'Method', {
          title: 'Modalities',
          columns: 3,
          features: [
            { icon: '💬', title: 'Relational psychodynamic', description: 'The relationship is the work. What comes up between us tends to mirror what comes up in your life.' },
            { icon: '👁️', title: 'EMDR', description: 'For stuck memories and patterns that talking hasn\'t moved. Structured, gentle, and evidence-based.' },
            { icon: '🌳', title: 'Internal Family Systems (IFS)', description: 'Working with the different "parts" of you — the critic, the protector, the child — with curiosity, not judgement.' },
          ],
        }),
        comp('timeline', 'Arc', {
          title: 'A typical arc',
          items: [
            { date: 'Weeks 1–4', title: 'Getting to know each other', description: 'History, goals, and finding the shape of the work. Nothing is required of you.' },
            { date: 'Months 2–6', title: 'The deeper work', description: 'Patterns become visible. We move at your pace — never faster.' },
            { date: 'Months 6+', title: 'Integration', description: 'Sessions often space out. Ending well is part of the therapy.' },
          ],
        }),
        comp('faq', 'FAQ', {
          title: 'Common questions',
          items: [
            { question: 'Do you take insurance?', answer: 'I don\'t bill insurance directly, but I provide monthly superbills that most PPO plans reimburse for out-of-network care. I recommend calling your insurer to check your OON mental-health benefits.' },
            { question: 'How long is a typical course of therapy?', answer: 'It varies. Some people come for a specific issue and finish in 3–4 months. Others do deeper long-term work over one to three years. We\'ll talk about it openly.' },
            { question: 'Is telehealth as effective as in-person?', answer: 'For most people and most issues, yes — the research is now clear on that. Some kinds of trauma work do go better in-person; we\'ll discuss.' },
            { question: 'What\'s your cancellation policy?', answer: '24 hours notice, or the full fee is charged. I hold your slot even when you\'re not there.' },
            { question: 'Are you licensed in my state?', answer: 'I\'m licensed in NY and CA. I can also see clients temporarily traveling within PSYPACT states. Ask if you\'re unsure.' },
          ],
        }),
        foot(),
      ], false, 1),

      // ── About ──
      page('About', 'about', [
        nav(),
        comp('hero', 'About Hero', {
          heading: 'About Clara',
          subheading: 'A little about who I am and how I got here.',
          alignment: 'center',
          height: 'small',
        }),
        comp('image-text', 'Bio', {
          title: 'Warm, curious, and a little irreverent.',
          description: 'I trained at NYU, spent five years in a community mental-health clinic in the Bronx, and now work in private practice out of a small office in Brooklyn Heights. I\'m most drawn to clients who have already tried therapy, feel like they know themselves reasonably well, and are stuck on something that they can\'t quite name.',
          imageUrl: AVATAR.w1,
          imagePosition: 'left',
        }),
        comp('features', 'Credentials', {
          title: 'Credentials',
          columns: 2,
          features: [
            { icon: '🎓', title: 'MSW, NYU Silver School of Social Work', description: 'Class of 2014. Focus on clinical practice with adults.' },
            { icon: '🪪', title: 'LCSW · NY #095234 · CA #82740', description: 'Licensed independent clinical social worker in both states.' },
            { icon: '👁️', title: 'EMDR-trained', description: 'EMDRIA-approved basic training, 2019. Ongoing consultation.' },
            { icon: '🌳', title: 'IFS Level 1', description: 'IFS Institute, 2022.' },
          ],
        }),
        comp('cta-banner', 'CTA', {
          heading: 'The next step is a conversation.',
          subheading: 'Twenty minutes on video, free, no obligation.',
          ctaText: 'Book a consult',
          ctaLink: '#contact',
        }),
        foot(),
      ], false, 2),

      // ── Contact ──
      page('Contact', 'contact', [
        nav(),
        comp('hero', 'Contact Hero', {
          heading: 'Get in touch',
          subheading: 'All messages are confidential. I reply within one business day.',
          alignment: 'center',
          height: 'small',
        }),
        comp('contact-form', 'Form', {
          title: 'Send a message',
          subtitle: 'Please don\'t include sensitive clinical details in this form — we\'ll cover that securely once we\'re in touch.',
          fields: ['name', 'email', 'phone', 'message'],
          submitText: 'Send confidentially',
          variant: 'card',
        }),
        comp('icon-text', 'Info', {
          items: [
            { icon: '📞', title: 'Phone', description: '(555) 830-2210 · voicemail is confidential' },
            { icon: '✉️', title: 'Email', description: 'hello@clarabennett.co' },
            { icon: '📍', title: 'Brooklyn office', description: '142 Montague St, Suite 4, Brooklyn Heights' },
            { icon: '💻', title: 'Telehealth', description: 'Available across NY and CA' },
          ],
          layout: 'horizontal',
        }),
        comp('cta-banner', 'Crisis', {
          heading: 'In crisis right now?',
          subheading: 'This site is not for emergencies. If you are in danger, call or text 988 (US Suicide & Crisis Lifeline), or go to your nearest emergency room.',
          ctaText: 'Call 988',
          ctaLink: 'tel:988',
        }),
        foot(),
      ], false, 3),
    ];
  },
};

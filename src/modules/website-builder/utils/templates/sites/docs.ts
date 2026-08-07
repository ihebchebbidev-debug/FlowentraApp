import { SiteTemplate } from '../index';
import { IMG, AVATAR } from '../images';
import { comp, page, makeNavbar, makeFooter } from '../helpers';
import { SiteTheme } from '../../../types';

/**
 * Docs / Knowledge Base — for SaaS documentation, developer docs,
 * product help centers. 4 pages: Home, Getting Started, API Reference, Changelog.
 */
const DOCS_THEME: SiteTheme = {
  primaryColor: '#2563eb',
  secondaryColor: '#475569',
  accentColor: '#8b5cf6',
  backgroundColor: '#ffffff',
  textColor: '#0f172a',
  headingFont: 'Inter, sans-serif',
  bodyFont: 'Inter, sans-serif',
  borderRadius: 8,
  spacing: 16,
  shadowStyle: 'subtle',
  buttonStyle: 'rounded',
  sectionPadding: 1.05,
  fontScale: 0.98,
  letterSpacing: -0.01,
  linkStyle: 'underline',
  headingTransform: 'none',
};

export const docsTemplate: SiteTemplate = {
  id: 'docs-knowledge-base',
  name: 'Docs / Knowledge Base',
  description: 'Developer documentation and product help center — search, quick-start, API reference, guides and changelog.',
  icon: '📚',
  category: 'Technology',
  theme: DOCS_THEME,
  pageCount: 4,
  features: [
    'Docs hero with search', 'Category cards', 'Code snippets', 'API reference',
    'Guides list', 'Changelog timeline', 'FAQ', 'Community CTA',
  ],
  previewImage: IMG.saasHero,
  pages: () => {
    const nav = makeNavbar('📚 Docs', [
      { label: 'Guides', href: '#guides' },
      { label: 'API', href: '#api' },
      { label: 'Changelog', href: '#changelog' },
      { label: 'Community', href: '#community' },
    ], 'Get API Key', { showSearch: true });

    const foot = makeFooter(
      'Acme Docs',
      'Everything you need to ship faster.',
      '',
      'support@acme.dev',
      {
        links: [
          { label: 'Guides', href: '#guides' },
          { label: 'API Reference', href: '#api' },
          { label: 'Changelog', href: '#changelog' },
          { label: 'Status', href: '#' },
        ],
        socialLinks: [
          { platform: 'github', url: '#' },
          { platform: 'twitter', url: '#' },
          { platform: 'youtube', url: '#' },
        ],
      },
    );

    return [
      // ── Home ──
      page('Docs Home', '', [
        nav(),
        comp('hero', 'Hero', {
          heading: 'Build with Acme',
          subheading: 'Guides, API references, and tutorials to help you go from zero to production in minutes.',
          ctaText: 'Quick Start',
          ctaLink: '#guides',
          secondaryCtaText: 'API Reference',
          secondaryCtaLink: '#api',
          alignment: 'center',
          height: 'medium',
        }),
        comp('features', 'Categories', {
          title: 'Explore the docs',
          subtitle: 'Pick a track and start shipping.',
          columns: 3,
          features: [
            { icon: '🚀', title: 'Getting Started', description: 'Install the SDK, authenticate, and make your first request in under 5 minutes.' },
            { icon: '📖', title: 'Guides', description: 'End-to-end walkthroughs for the most common integration patterns.' },
            { icon: '⚙️', title: 'API Reference', description: 'Full REST and SDK reference with runnable examples for every endpoint.' },
            { icon: '🔐', title: 'Authentication', description: 'API keys, OAuth 2.0, scoped tokens and best practices for secrets.' },
            { icon: '🪝', title: 'Webhooks', description: 'Subscribe to real-time events. Retries, signatures, testing tools.' },
            { icon: '🧪', title: 'SDKs', description: 'Official libraries for TypeScript, Python, Go, Ruby and PHP.' },
          ],
        }),
        comp('code-block', 'Quick install', {
          title: 'Install in one line',
          language: 'bash',
          code: 'npm install @acme/sdk\n# or\npnpm add @acme/sdk',
        }),
        comp('code-block', 'First request', {
          title: 'Make your first request',
          language: 'typescript',
          code: `import { Acme } from '@acme/sdk';\n\nconst acme = new Acme({ apiKey: process.env.ACME_KEY });\n\nconst result = await acme.messages.create({\n  to: 'user@example.com',\n  template: 'welcome',\n});\n\nconsole.log(result.id);`,
        }),
        comp('animated-stats', 'Stats', {
          stats: [
            { value: '99.99', label: 'API Uptime', suffix: '%' },
            { value: '80', label: 'ms p95 latency' },
            { value: '12', label: 'Official SDKs' },
            { value: '10000', label: 'Developers', suffix: '+' },
          ],
          variant: 'default',
          columns: 4,
        }),
        comp('cta-banner', 'Community', {
          heading: 'Stuck? Ask the community.',
          subheading: 'Join 8,000+ developers on Discord and Slack. Our team is there too.',
          ctaText: 'Join Discord',
          ctaLink: '#community',
        }),
        foot(),
      ], true, 0),

      // ── Guides ──
      page('Guides', 'guides', [
        nav(),
        comp('hero', 'Guides', {
          heading: 'Guides',
          subheading: 'Step-by-step tutorials for real-world integrations.',
          alignment: 'center',
          height: 'small',
        }),
        comp('features', 'Popular guides', {
          title: 'Most popular',
          columns: 2,
          features: [
            { icon: '📨', title: 'Send your first email', description: '5 min — Configure a domain, create a template, and send.' },
            { icon: '🔔', title: 'Subscribe to webhooks', description: '10 min — Receive delivery, bounce and click events in real time.' },
            { icon: '🧵', title: 'Batch send at scale', description: '15 min — Send 100k messages/hour with proper rate-limiting.' },
            { icon: '🌍', title: 'Multi-region setup', description: '20 min — Route traffic to the nearest region for lowest latency.' },
            { icon: '🧾', title: 'Idempotency & retries', description: 'How to design retry-safe workflows with our SDKs.' },
            { icon: '🧑‍💻', title: 'Local development', description: 'Run the CLI, tunnel webhooks, and test end-to-end offline.' },
          ],
        }),
        comp('code-block', 'Webhook example', {
          title: 'Verify a webhook signature',
          language: 'typescript',
          code: `import { verifyWebhook } from '@acme/sdk';\n\nexport async function POST(req: Request) {\n  const raw = await req.text();\n  const sig = req.headers.get('acme-signature')!;\n  const event = verifyWebhook(raw, sig, process.env.ACME_WEBHOOK_SECRET!);\n\n  switch (event.type) {\n    case 'message.delivered':\n      // ...\n      break;\n  }\n  return new Response('ok');\n}`,
        }),
        comp('faq', 'FAQ', {
          title: 'Common questions',
          items: [
            { question: 'Do you have a free tier?', answer: 'Yes — 100 requests/day forever, no credit card required.' },
            { question: 'Which regions are supported?', answer: 'US East, US West, EU (Frankfurt), Asia (Singapore) and AU (Sydney).' },
            { question: 'How are rate limits enforced?', answer: 'Per-key sliding window. Headers x-ratelimit-* on every response.' },
          ],
        }),
        foot(),
      ], false, 1),

      // ── API Reference ──
      page('API Reference', 'api', [
        nav(),
        comp('hero', 'API', {
          heading: 'API Reference',
          subheading: 'REST endpoints, request/response schemas, and runnable examples.',
          alignment: 'center',
          height: 'small',
        }),
        comp('features', 'Resources', {
          title: 'Resources',
          columns: 3,
          features: [
            { icon: '📬', title: 'Messages', description: 'POST /v1/messages — send transactional messages.' },
            { icon: '📇', title: 'Contacts', description: 'GET/POST /v1/contacts — manage recipients.' },
            { icon: '🏷️', title: 'Templates', description: 'CRUD /v1/templates — versioned message templates.' },
            { icon: '🪝', title: 'Webhooks', description: 'CRUD /v1/webhooks — event subscriptions.' },
            { icon: '📊', title: 'Analytics', description: 'GET /v1/analytics — delivery, opens, clicks.' },
            { icon: '🔑', title: 'Keys', description: 'CRUD /v1/keys — API keys and scopes.' },
          ],
        }),
        comp('code-block', 'POST /v1/messages', {
          title: 'POST /v1/messages',
          language: 'http',
          code: `POST /v1/messages HTTP/1.1\nHost: api.acme.dev\nAuthorization: Bearer sk_live_...\nContent-Type: application/json\n\n{\n  "to": "user@example.com",\n  "template": "welcome",\n  "variables": { "name": "Ada" }\n}`,
        }),
        comp('code-block', 'Response', {
          title: '201 Created',
          language: 'json',
          code: `{\n  "id": "msg_01HZY7...",\n  "status": "queued",\n  "created_at": "2026-07-09T10:12:04Z"\n}`,
        }),
        foot(),
      ], false, 2),

      // ── Changelog ──
      page('Changelog', 'changelog', [
        nav(),
        comp('hero', 'Changelog', {
          heading: 'Changelog',
          subheading: 'Every shipped change, in reverse chronological order.',
          alignment: 'center',
          height: 'small',
        }),
        comp('timeline', 'Releases', {
          title: 'Recent releases',
          items: [
            { date: 'Jul 2026', title: 'v3.4 — Batch API GA', description: 'Send up to 100k messages in a single call. 40% cheaper per message.' },
            { date: 'Jun 2026', title: 'v3.3 — Australia region', description: 'Sydney (ap-southeast-2) now available for low-latency APAC delivery.' },
            { date: 'May 2026', title: 'v3.2 — Go SDK 1.0', description: 'Official Go client with context-aware retries and idempotency.' },
            { date: 'Apr 2026', title: 'v3.1 — Scoped API keys', description: 'Restrict keys per resource, IP range and environment.' },
            { date: 'Mar 2026', title: 'v3.0 — New dashboard', description: 'Rebuilt from scratch. 5x faster, keyboard-first, dark mode.' },
          ],
        }),
        comp('newsletter', 'Subscribe', {
          title: 'Get changelog updates',
          subtitle: 'One email per release, no spam.',
          placeholder: 'you@company.com',
          buttonText: 'Subscribe',
          variant: 'split',
        }),
        foot(),
      ], false, 3),
    ];
  },
};

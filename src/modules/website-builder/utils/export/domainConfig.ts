/**
 * Domain / DNS configuration for exported sites.
 *
 * Given a user-provided custom domain and a target hosting platform, produces:
 *   • the canonical `siteUrl` used for sitemap.xml / robots.txt / <link rel="canonical">
 *   • concrete DNS records (with real provider IPs / CNAME targets)
 *   • extra files to include in the export (CNAME, _redirects, DEPLOYMENT.md)
 *
 * Single source of truth for anything DNS/domain related. `hostingPresets.ts`
 * intentionally does NOT emit CNAME/_redirects so this file owns them without
 * order-dependent overwrites.
 */
import type { ExportedFile } from './types';
import type { HostingPlatform } from './hostingPresets';

// ── Public config the UI collects ──
export interface SiteConfig {
  /** Bare custom domain, e.g. "mywebsite.com" (no scheme, no path). Optional. */
  customDomain?: string;
  /** Which host is primary — the other 301-redirects to it. */
  preferredHost?: 'apex' | 'www';
  /** Emit https:// URLs (default true). Only set false for local/dev exports. */
  useHttps?: boolean;
  /**
   * Provider-specific handle used to fill CNAME targets:
   *   github-pages → github username (or org/repo)
   *   netlify      → netlify site slug (foo → foo.netlify.app)
   *   vercel       → not needed (always cname.vercel-dns.com)
   *   cloudflare   → cloudflare pages project (foo → foo.pages.dev)
   */
  providerHandle?: string;
}

// ── Structured DNS record model ──
export type DnsRecordType = 'A' | 'AAAA' | 'CNAME' | 'ALIAS' | 'TXT';

export interface DnsRecord {
  type: DnsRecordType;
  /** Name at your registrar — `@` = apex, `www` = www subdomain, etc. */
  name: string;
  /** Expected value (IP for A, hostname for CNAME/ALIAS, string for TXT). */
  value: string;
  /** Optional TTL suggestion. */
  ttl?: number;
  /** Human explanation shown next to the row. */
  note?: string;
}

export interface DomainArtifacts {
  /** Fully-qualified canonical site URL, or null if no domain configured. */
  siteUrl: string | null;
  /** Primary + secondary FQDNs (redirect target ↔ source). Null if no domain. */
  primaryHost: string | null;
  secondaryHost: string | null;
  /** DNS records the user must add at their registrar to point apex + www at the host. */
  records: DnsRecord[];
  /** Extra files to write into the export bundle (paths are project-relative). */
  files: ExportedFile[];
  /** Human-readable per-platform DNS-record markdown block (already prefixed with ##). */
  deploymentDocs: string;
}

/** Normalise "https://www.foo.com/" → "foo.com". Returns "" for empty/invalid input. */
export function normalizeDomain(raw?: string): string {
  if (!raw) return '';
  let d = raw.trim().toLowerCase();
  d = d.replace(/^https?:\/\//, '').replace(/\/.*$/, '').replace(/^www\./, '');
  // Basic sanity — at least one dot, valid chars
  if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/.test(d)) return '';
  return d;
}

// ─────────────────────────────────────────────────────────────
// Real per-provider DNS values (documented public defaults).
// Sources:
//   • GitHub Pages   – docs.github.com/en/pages/…/managing-a-custom-domain-for-your-github-pages-site
//   • Netlify        – docs.netlify.com/domains-https/custom-domains
//   • Vercel         – vercel.com/docs/projects/domains
//   • Cloudflare     – developers.cloudflare.com/pages/configuration/custom-domains
// ─────────────────────────────────────────────────────────────

/** IP addresses / CNAME targets a running provider serves from. */
const PROVIDER_TARGETS = {
  'github-pages': {
    apexIps: ['185.199.108.153', '185.199.109.153', '185.199.110.153', '185.199.111.153'],
    cname: (handle: string) => `${handle || '<your-github-user>'}.github.io.`,
    cnameHint: 'GitHub username (or org/repo)',
  },
  netlify: {
    apexIps: ['75.2.60.5'],
    apexAlias: 'apex-loadbalancer.netlify.com.',
    cname: (handle: string) => `${handle || '<your-site>'}.netlify.app.`,
    cnameHint: 'Netlify site slug (foo → foo.netlify.app)',
  },
  vercel: {
    apexIps: ['76.76.21.21'],
    cname: (_handle: string) => 'cname.vercel-dns.com.',
    cnameHint: 'Vercel uses a fixed CNAME target — handle not required',
  },
  cloudflare: {
    // Cloudflare Pages relies on CNAME flattening at the apex.
    apexIps: [] as string[],
    cname: (handle: string) => `${handle || '<your-project>'}.pages.dev.`,
    cnameHint: 'Cloudflare Pages project name (foo → foo.pages.dev)',
  },
  generic: {
    apexIps: [] as string[],
    cname: (_handle: string) => '<your-hosting-cname>',
    cnameHint: 'Whatever CNAME your host provides',
  },
} as const;

/** Build the list of DNS records for a given platform + config. */
export function buildDnsRecords(
  domain: string,
  preferred: 'apex' | 'www',
  platform: HostingPlatform,
  handle: string,
): DnsRecord[] {
  const target = PROVIDER_TARGETS[platform] ?? PROVIDER_TARGETS.generic;
  const records: DnsRecord[] = [];

  if (platform === 'cloudflare') {
    // Cloudflare Pages: CNAME on both apex (flattened) and www.
    records.push({
      type: 'CNAME', name: '@', value: target.cname(handle), ttl: 3600,
      note: 'Apex uses CNAME flattening (Cloudflare-only feature)',
    });
    records.push({
      type: 'CNAME', name: 'www', value: target.cname(handle), ttl: 3600,
      note: preferred === 'www' ? 'Primary www host' : 'www subdomain (redirects to apex)',
    });
    return records;
  }

  // Apex A records (one row per IP)
  for (const ip of target.apexIps) {
    records.push({
      type: 'A', name: '@', value: ip, ttl: 3600,
      note: preferred === 'apex' ? 'Points primary apex to the host' : 'Apex redirects to www',
    });
  }

  // Netlify also documents an ALIAS/ANAME as an alternative to A records
  if (platform === 'netlify') {
    records.push({
      type: 'ALIAS', name: '@', value: (target as any).apexAlias, ttl: 3600,
      note: 'Optional — use ALIAS/ANAME instead of A records if your registrar supports it',
    });
  }

  // www CNAME
  records.push({
    type: 'CNAME', name: 'www', value: target.cname(handle), ttl: 3600,
    note: preferred === 'www' ? 'Primary www host' : 'www subdomain (redirects to apex)',
  });

  return records;
}

/** Public helper — the DomainWorkbench uses this to render the DNS table before export. */
export function previewDnsRecords(
  config: SiteConfig | undefined,
  platform: HostingPlatform | undefined,
): { records: DnsRecord[]; domain: string; primaryHost: string; cnameHint: string } | null {
  const domain = normalizeDomain(config?.customDomain);
  if (!domain) return null;
  const preferred: 'apex' | 'www' = config?.preferredHost === 'www' ? 'www' : 'apex';
  const plat: HostingPlatform = platform ?? 'generic';
  const handle = (config?.providerHandle || '').trim();
  return {
    records: buildDnsRecords(domain, preferred, plat, handle),
    domain,
    primaryHost: preferred === 'www' ? `www.${domain}` : domain,
    cnameHint: (PROVIDER_TARGETS[plat] ?? PROVIDER_TARGETS.generic).cnameHint,
  };
}

/**
 * Build all domain-related artifacts for a given platform + site config.
 * Safe to call with an empty / undefined config — returns siteUrl=null and no extra files.
 */
export function buildDomainArtifacts(
  config: SiteConfig | undefined,
  platform: HostingPlatform | undefined,
  pathPrefix: string, // e.g. "my-site" for the react zip, "" for html export
): DomainArtifacts {
  const domain = normalizeDomain(config?.customDomain);
  const preferred: 'apex' | 'www' = config?.preferredHost === 'www' ? 'www' : 'apex';
  const scheme = config?.useHttps === false ? 'http' : 'https';

  if (!domain) {
    return {
      siteUrl: null, primaryHost: null, secondaryHost: null,
      records: [], files: [], deploymentDocs: '',
    };
  }

  const primaryHost = preferred === 'www' ? `www.${domain}` : domain;
  const secondaryHost = preferred === 'www' ? domain : `www.${domain}`;
  const siteUrl = `${scheme}://${primaryHost}`;
  const files: ExportedFile[] = [];
  const p = pathPrefix ? `${pathPrefix}/` : '';
  const plat: HostingPlatform = platform ?? 'generic';
  const handle = (config?.providerHandle || '').trim();
  const records = buildDnsRecords(domain, preferred, plat, handle);

  // ── Per-platform emissions ──
  switch (plat) {
    case 'github-pages': {
      // GitHub Pages reads /CNAME from the deployment root; must contain a single domain.
      files.push({ path: `${p}public/CNAME`, content: `${primaryHost}\n` });
      break;
    }
    case 'netlify': {
      // Force the non-primary host to redirect to the primary one.
      files.push({
        path: `${p}public/_redirects`,
        content: [
          `# Redirect ${secondaryHost} → ${primaryHost} (301)`,
          `https://${secondaryHost}/*    ${scheme}://${primaryHost}/:splat    301!`,
          ``,
          `# SPA fallback — serve index.html for all routes`,
          `/*    /index.html    200`,
          ``,
        ].join('\n'),
      });
      break;
    }
    case 'cloudflare': {
      // Cloudflare Pages honours _redirects with a wildcard host prefix.
      files.push({
        path: `${p}public/_redirects`,
        content: [
          `# Redirect ${secondaryHost} → ${primaryHost} (301)`,
          `https://${secondaryHost}/*    ${scheme}://${primaryHost}/:splat    301`,
          ``,
          `# SPA fallback`,
          `/*    /index.html    200`,
          ``,
        ].join('\n'),
      });
      break;
    }
    case 'vercel': {
      // Vercel resolves apex↔www at the dashboard level. No file needed — the
      // primary host is enforced in vercel.json via a redirect rule below,
      // but only when the user picks a preferred host, and only if the file
      // does not already exist (added by hostingPresets). We piggy-back a
      // per-domain redirect fragment in DEPLOYMENT.md instead of touching
      // vercel.json to avoid clashing with the preset.
      break;
    }
    default: {
      // Generic — leave DNS setup to the platform-agnostic DEPLOYMENT.md.
      break;
    }
  }

  // ── DEPLOYMENT.md content ──
  const dnsTable = [
    `| Type | Name | Value | TTL | Notes |`,
    `|------|------|-------|-----|-------|`,
    ...records.map(r =>
      `| ${r.type} | \`${r.name}\` | \`${r.value}\` | ${r.ttl ?? 'auto'} | ${r.note ?? ''} |`,
    ),
  ].join('\n');

  const platformHint =
    plat === 'github-pages'
      ? `A **CNAME** file with \`${primaryHost}\` has been added to \`public/\` — GitHub Pages will detect it on deploy.`
      : plat === 'netlify'
      ? `A **_redirects** file with a 301 from \`${secondaryHost}\` → \`${primaryHost}\` has been added to \`public/\`.`
      : plat === 'cloudflare'
      ? `A **_redirects** file with a 301 from \`${secondaryHost}\` → \`${primaryHost}\` has been added to \`public/\`.`
      : plat === 'vercel'
      ? `Add \`${domain}\` and \`www.${domain}\` in **Vercel → Settings → Domains**; Vercel handles the apex↔www redirect automatically.`
      : `Configure the DNS records below at your registrar (Namecheap, Cloudflare, etc.). SSL will be issued by your host after DNS propagates.`;

  const deploymentDocs = [
    ``,
    `## Custom Domain: ${domain}`,
    ``,
    `Primary host: **${primaryHost}** · Redirect from: **${secondaryHost}**`,
    ``,
    platformHint,
    ``,
    `### DNS records to add at your registrar`,
    ``,
    dnsTable,
    ``,
    `> After updating DNS, propagation can take up to 72h.`,
    `> Verify from inside the app (Export → Domain → Verify) or externally at https://dnschecker.org.`,
    ``,
    `Canonical site URL used in \`sitemap.xml\`, \`robots.txt\` and the \`<link rel="canonical">\` tag:`,
    ``,
    `    ${siteUrl}`,
    ``,
  ].join('\n');

  files.push({
    path: `${p}DEPLOYMENT.md`,
    content: `# Deployment${deploymentDocs}`,
  });

  return { siteUrl, primaryHost, secondaryHost, records, files, deploymentDocs };
}

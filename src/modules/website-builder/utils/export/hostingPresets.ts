/**
 * Hosting Platform Presets
 * 
 * Pre-configured export settings optimized for different hosting platforms.
 * Each preset includes the appropriate configuration files and optimizations.
 */
import type { ImageOptimizationOptions } from './imageOptimizer';
import { OPTIMIZATION_PRESETS, DEFAULT_OPTIMIZATION_OPTIONS } from './imageOptimizer';

export type HostingPlatform = 'generic' | 'github-pages' | 'netlify' | 'vercel' | 'cloudflare';

export interface HostingPreset {
  id: HostingPlatform;
  name: string;
  description: string;
  icon: string; // Lucide icon name
  color: string;
  /** Image optimization settings for this platform */
  imageOptimization: Partial<ImageOptimizationOptions>;
  /** Additional config files to include */
  configFiles: Array<{ path: string; content: string }>;
  /** Recommended deploy steps */
  deploySteps: string[];
  /** External documentation link */
  docsUrl?: string;
}

export const HOSTING_PRESETS: HostingPreset[] = [
  {
    id: 'generic',
    name: 'Generic / Any Host',
    description: 'Standard HTML export for any web server or hosting',
    icon: 'Globe',
    color: '#6B7280',
    imageOptimization: OPTIMIZATION_PRESETS.balanced,
    configFiles: [],
    deploySteps: [
      'Unzip the downloaded file',
      'Run `npm install` then `npm run build`',
      'Upload the `dist` folder to your web server',
      'Configure your server to serve index.html for all routes (SPA fallback)',
    ],
  },
  {
    id: 'github-pages',
    name: 'GitHub Pages',
    description: 'Free static hosting from your GitHub repository',
    icon: 'Github',
    color: '#24292F',
    imageOptimization: { ...OPTIMIZATION_PRESETS.balanced, convertToWebP: false },
    configFiles: [
      {
        path: '.nojekyll',
        content: '',
      },
      {
        // SPA fallback — GitHub Pages doesn't support rewrites natively,
        // so we use a custom 404.html that redirects to index.html
        path: 'public/404.html',
        content: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Redirecting…</title>
  <script>
    // SPA redirect for GitHub Pages
    // Converts the path to a query param so index.html can restore it
    var path = window.location.pathname;
    var search = window.location.search;
    var hash = window.location.hash;
    window.location.replace(
      window.location.origin + '/?p=' + encodeURIComponent(path + search + hash)
    );
  </script>
</head>
<body>
  <p>Redirecting…</p>
</body>
</html>`,
      },
    ],
    deploySteps: [
      'Create a new GitHub repository',
      'Run `npm install` then `npm run build`',
      'Push the `dist` folder contents (or use GitHub Actions to build)',
      'Go to Settings → Pages → Select "main" branch',
      'Your site will be live at username.github.io/repo-name',
    ],
    docsUrl: 'https://pages.github.com',
  },
  {
    id: 'netlify',
    name: 'Netlify',
    description: 'Modern web hosting with automatic deploys and CDN',
    icon: 'Zap',
    color: '#00C7B7',
    imageOptimization: OPTIMIZATION_PRESETS.performance,
    configFiles: [
      {
        path: 'netlify.toml',
        content: `# Netlify configuration for Vite + React SPA
[build]
  command = "npm run build"
  publish = "dist"

# SPA fallback — serve index.html for all routes
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

# Security headers
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"

# Cache hashed assets indefinitely
[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
`,
      },
    ],
    deploySteps: [
      'Push your project to a GitHub/GitLab repository',
      'Go to app.netlify.com → "Add new site" → "Import from Git"',
      'Select your repo — build settings auto-detected from netlify.toml',
      'Your site will build and deploy automatically on every push',
      'Optionally connect a custom domain in site settings',
    ],
    docsUrl: 'https://docs.netlify.com',
  },
  {
    id: 'vercel',
    name: 'Vercel',
    description: 'Zero-config deployments with edge network',
    icon: 'Triangle',
    color: '#000000',
    imageOptimization: OPTIMIZATION_PRESETS.performance,
    configFiles: [
      {
        path: 'vercel.json',
        content: JSON.stringify({
          framework: 'vite',
          buildCommand: 'npm run build',
          outputDirectory: 'dist',
          // SPA fallback — rewrite all routes to index.html
          rewrites: [
            { source: '/(.*)', destination: '/index.html' },
          ],
          headers: [
            {
              source: '/assets/(.*)',
              headers: [
                { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
              ],
            },
          ],
        }, null, 2),
      },
    ],
    deploySteps: [
      'Push your project to a GitHub repository',
      'Go to vercel.com/new and import your repo',
      'Vercel auto-detects Vite — just click Deploy',
      'Or use CLI: `npm i -g vercel && vercel`',
      'Your site deploys automatically on every push',
    ],
    docsUrl: 'https://vercel.com/docs',
  },
  {
    id: 'cloudflare',
    name: 'Cloudflare Pages',
    description: 'Global CDN with free SSL and DDoS protection',
    icon: 'Cloud',
    color: '#F38020',
    imageOptimization: OPTIMIZATION_PRESETS.performance,
    configFiles: [
      {
        // Cloudflare Pages uses _redirects in the output dir
        // We put it in public/ so Vite copies it to dist/ on build
        path: 'public/_redirects',
        content: `# SPA fallback — serve index.html for all routes
/*    /index.html   200
`,
      },
      {
        path: 'public/_headers',
        content: `# Cloudflare Pages headers
/assets/*
  Cache-Control: public, max-age=31536000, immutable

/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
`,
      },
    ],
    deploySteps: [
      'Push your project to a GitHub repository',
      'Go to dash.cloudflare.com → Pages → "Create a project"',
      'Connect your repo — set build command: `npm run build`, output: `dist`',
      'Deploy! SPA routing is handled by the _redirects file',
      'Configure your custom domain (optional)',
    ],
    docsUrl: 'https://developers.cloudflare.com/pages',
  },
];

/**
 * Get a hosting preset by ID.
 */
export function getHostingPreset(id: HostingPlatform): HostingPreset {
  return HOSTING_PRESETS.find(p => p.id === id) || HOSTING_PRESETS[0];
}

/**
 * Merge preset image optimization with custom options.
 */
export function mergeOptimizationOptions(
  preset: HostingPreset,
  customOptions?: Partial<ImageOptimizationOptions>
): ImageOptimizationOptions {
  return {
    ...DEFAULT_OPTIMIZATION_OPTIONS,
    ...preset.imageOptimization,
    ...customOptions,
  };
}

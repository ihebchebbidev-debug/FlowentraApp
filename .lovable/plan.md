
# Website Builder — Export & Deployment: Audit + Upgrade Plan

## 1. What we have today (honest assessment)

**Strong**
- Clean split: `htmlExporter` (static HTML) and `reactExporter` (Vite+React+TS) share `blockToHtml`, `imageAssetExtractor`, `imageOptimizer` and the new `domainConfig`.
- `SiteConfig` → `buildDomainArtifacts()` is pure and platform-aware. `siteUrl` correctly flows into `<link rel="canonical">`, `sitemap.xml`, `robots.txt` for both exporters.
- Hosting presets ship real SPA-fallback + cache/security headers per platform (`netlify.toml`, `vercel.json`, Cloudflare `_headers`/`_redirects`, GH Pages `404.html` + `.nojekyll`).
- `normalizeDomain` is strict (regex-validated, strips scheme/www/path). Dedup + optimize on data-URI images.

**Weak / rough**
1. **DNS values are placeholders.** `DEPLOYMENT.md` prints `<your-host-ip>` and generic CNAMEs. Users can't literally copy/paste — the whole point of "linking a domain" fails at the last mile.
2. **No verification loop.** We tell the user to add records then… nothing. No way to confirm from inside the app that DNS is live.
3. **Two independent "deploy guides"** (`DeployGuide.tsx` + `hostingPresets.deploySteps` + `DEPLOYMENT.md`) with drifting copy.
4. **`DeployGuide.tsx` is disconnected** from the selected platform / domain — it shows generic steps regardless of the user's choices.
5. **No actual deployment path.** Everything ends in a ZIP; the user still has to push to git, set up CI, add DNS, wait for SSL. There is no "Deploy Now" button.
6. **Vercel branch is thin** — it writes a `.well-known/domain.txt` hint (which Vercel ignores) and tells the user to configure DNS in the dashboard. That's the same as nothing.
7. **Cloudflare preset already emits `public/_redirects`**; `domainConfig` overwrites it silently when a domain is set. The SPA fallback is preserved but the merge is order-dependent — fragile.
8. **React exporter gaps:** `tsc && vite build` but no `tsconfig.json` shown at a glance (verify); `lint` is aliased to `tsc --noEmit`; no `.gitignore`, no `.env.example`, no `README.md` deploy buttons, no `vercel deploy` badges, no favicon fallback pipeline, no sitemap-generator script — sitemap is written at export time only.
9. **No `og:image` / `twitter:image` in generated `index.html`** — social previews will be blank on the deployed site.
10. **Multi-page routing** in the generated React project: need to confirm React Router `basename` handling for GH Pages sub-path deploys.
11. **`SiteConfig` is not persisted** — user retypes their domain every export.

---

## 2. Product direction: "Link a domain from inside the app"

Truly hosting the user's site from our infra needs backend + SSL provisioning + edge servers — that's out of scope for a frontend module. So we aim for the **next best thing** with three tiers, each independently shippable:

**Tier A — DNS Assistant (no backend, ship first)**
Turn the current one-shot markdown into an interactive DNS workbench that (a) tells the user the exact values to add, and (b) verifies propagation from the browser.

**Tier B — One-click deploy adapters (bring-your-own-token)**
Let users paste a personal access token for Netlify / Vercel / Cloudflare Pages / GitHub and we push the built site directly from the browser via each provider's REST API — no CI setup, no git dance.

**Tier C — Fully-managed publish (needs infra, deferred)**
Only viable when a hosting backend exists. Documented but not built now.

---

## 3. Plan — Tier A: DNS Assistant (this iteration)

### 3.1 Real DNS records per provider

Replace placeholders in `domainConfig.ts` with the actual public values every provider documents:

| Platform          | Apex (A / ALIAS)                                     | www (CNAME)                       |
|-------------------|------------------------------------------------------|-----------------------------------|
| GitHub Pages      | `185.199.108.153` `.109.153` `.110.153` `.111.153`   | `<user>.github.io.`               |
| Netlify           | `75.2.60.5` (or ALIAS `apex-loadbalancer.netlify.com`) | `<site>.netlify.app.`           |
| Vercel            | `76.76.21.21`                                        | `cname.vercel-dns.com.`           |
| Cloudflare Pages  | *CNAME-flattened* → `<project>.pages.dev.` on both apex & www | `<project>.pages.dev.` |
| Generic           | `<host-ip>` + note                                   | `<host-cname>`                    |

Model this as `DNS_PROVIDERS: Record<HostingPlatform, DnsRecordSet>` with typed rows (`type: 'A' | 'AAAA' | 'CNAME' | 'ALIAS' | 'TXT'`, `name`, `value`, `ttl?`, `note?`). Templated tokens like `{site}`, `{user}`, `{project}` get interpolated at build time from an optional `SiteConfig.providerHandle` string ("my-repo", "my-site", "my-project").

### 3.2 Interactive `DomainWorkbench` component

Replace `DeployGuide.tsx` for the domain flow. New `src/modules/website-builder/components/DomainWorkbench.tsx`:

- Reads current `SiteConfig` + `HostingPlatform`.
- Renders the DNS record table with a **copy button per cell** and a per-row **Verify** button.
- Verification hits Cloudflare DNS-over-HTTPS (`https://cloudflare-dns.com/dns-query?type=A&name=...`, `application/dns-json`) — no backend, CORS-safe. Shows the currently resolved value + green/red diff against expected. Cache 30 s.
- Aggregate status pill: `Not configured` → `Propagating` → `Live`.
- Deep-link buttons to registrar helpers (Namecheap advanced DNS, Cloudflare zone dashboard, Route 53).

### 3.3 Wire into `ExportOptionsDialog`

- Move the Domain tab's "Will be added to your export" preview into a shared `DomainSummary` used both in the dialog and the workbench.
- Persist `SiteConfig` (customDomain / preferredHost / useHttps / providerHandle) on the `WebsiteSite` model so users don't retype. Add a nullable `deployConfig` jsonb column via a new migration.
- Add the workbench as a second entry point from `SiteEditor` toolbar ("Domain & DNS") independent of exporting.

### 3.4 Fix the Cloudflare overwrite bug

`domainConfig.ts` currently emits `public/_redirects` for netlify/cloudflare. The `cloudflare` preset already emits one. Right now the preset file is written first and `domainConfig` files are appended — the ZIP writer takes the last file wins (verify in `zipHelper`). Make this explicit:
- Move all `_redirects`/`CNAME`/`_headers` generation into `domainConfig` (single source of truth).
- Strip those paths from `hostingPresets.configFiles` and expose a `preset.headerRules` / `preset.redirectRules` structure that `domainConfig` merges into one file.

---

## 4. Plan — Tier B: One-click deploy adapters (follow-up iteration)

Introduce `src/modules/website-builder/utils/deploy/` with:

```text
deploy/
  types.ts                → DeployAdapter interface
  netlifyAdapter.ts       → POST /api/v1/sites + ZIP deploy
  vercelAdapter.ts        → POST /v13/deployments (files API)
  cloudflareAdapter.ts    → POST /accounts/:id/pages/projects/:proj/deployments
  githubAdapter.ts        → OAuth device flow → create repo → push tree → enable Pages
  index.ts                → getAdapter(platform)
```

`DeployAdapter` shape:

```text
{
  id, label,
  requiredCredentials: [{ key, label, help, link }],
  storeCredentials(token): void         // sessionStorage only, never persisted
  deploy(files, config, onProgress): Promise<{ url, dashboardUrl }>
  attachDomain?(domain, config): Promise<void>   // where the API supports it
}
```

UI: new `PublishDialog` step "Deploy from here" listing supported providers, credential inputs (masked, "How do I get this?" link per field), progress log, final live URL + "Open dashboard" + "Verify DNS" link into the workbench.

Security: tokens live only in `sessionStorage`, cleared on unload. Never sent to our backend. Document this prominently in the UI.

---

## 5. Plan — React exporter polish

Applied in this iteration alongside Tier A:

1. Emit `README.md` with real deploy buttons:
   `[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=...)`, Netlify equivalent, Cloudflare Pages instructions, plus the DNS table from `domainConfig`.
2. Emit `.gitignore` (`node_modules`, `dist`, `.env.local`, `.DS_Store`).
3. Emit `.nvmrc` with `20`.
4. Add `og:image` / `twitter:image` tags to generated `index.html` — use the site's favicon or first hero image as fallback; skip cleanly if absent.
5. Guarantee `tsconfig.json` + `tsconfig.node.json` + `vite.config.ts` with `base: './'` (safe for both root and sub-path deploys) unless a custom domain is set (then `'/'`).
6. Ship a `scripts/generate-sitemap.ts` + `predev`/`prebuild` hook so the sitemap regenerates if the user edits routes locally (mirrors our sitemap-robots knowledge).
7. Add `robots.txt` `Sitemap:` line only when `siteUrl` is set (avoid placeholder URLs).
8. Pin dependency versions (currently `^` — switch to exact for reproducible builds; add a comment).
9. Wrap the whole exporter in a single try/catch that surfaces the failing phase back through `onProgress` — today failures in image extraction are only `console.warn`ed.

---

## 6. File map (Tier A + React polish)

```text
src/modules/website-builder/
  utils/export/
    domainConfig.ts               ← rewrite: DNS_PROVIDERS table, merged redirect/header emitters
    hostingPresets.ts             ← strip redirect/header files, expose structured rules
    reactExporter.ts              ← README, .gitignore, .nvmrc, og:image, sitemap script, base path
    htmlExporter.ts               ← og:image, robots Sitemap gating
    dns/
      dohClient.ts                ← Cloudflare DoH fetcher, 30 s LRU cache
      recordDiff.ts               ← expected vs resolved comparison
  components/
    DomainWorkbench.tsx           ← NEW interactive DNS UI
    DomainSummary.tsx             ← NEW shared preview block
    ExportOptionsDialog.tsx       ← use DomainSummary, wire providerHandle input
    DeployGuide.tsx               ← keep for platform overview only; link to workbench
    SiteEditor.tsx                ← add "Domain & DNS" toolbar button
  types.ts                        ← add SiteConfig persistence on WebsiteSite
Backend/Migrations/
  <date>_WB_DeployConfig.sql      ← ALTER TABLE WB_Sites ADD DeployConfigJson jsonb
```

## 7. What we explicitly won't build now

- Hosting the site on our infra (Tier C).
- Managed SSL / ACME automation.
- Registrar API integration (buying domains from within the app).
- Vercel/Netlify OAuth (Tier B ships with PAT-only first to skip OAuth callback infra).

---

## 8. Order of operations

1. Rewrite `domainConfig.ts` with real DNS provider table + structured record model.
2. Refactor `hostingPresets.ts` to remove overlap (redirects/headers move to `domainConfig`).
3. Add `dns/dohClient.ts` + `recordDiff.ts` (pure, unit-testable).
4. Build `DomainSummary.tsx` + `DomainWorkbench.tsx`, mount from `ExportOptionsDialog` and `SiteEditor`.
5. Persist `SiteConfig` on `WebsiteSite` (migration + service).
6. React exporter polish (README, gitignore, og:image, sitemap script, base path, error surfacing).
7. Retire duplicated copy in `DeployGuide.tsx`; keep it as a "hosting overview" screen.

Deferred to Tier B (separate PR): deploy adapters + `PublishDialog` "Deploy from here" step.

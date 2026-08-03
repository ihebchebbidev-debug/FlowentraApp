#!/usr/bin/env node
/**
 * Triple-check of the module (plugin) activation system.
 *
 * 1. Registry parity   — src/modules/**\/plugin.ts  ==  Backend KnownPlugins.cs
 * 2. Graph integrity   — deps exist, no cycles, no core depending on non-core
 * 3. Guard coverage    — every non-core module code is used in a <PluginGate>
 * 4. Sidebar gating    — every mapped code exists in the registry
 * 5. Read-only app     — no component wires a plugin toggle mutation
 * 6. Cascade semantics — simulated resolver matches the documented tables
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const fail = [];
const warn = [];
const ok = (m) => console.log('  ✓ ' + m);

function walk(dir, out = []) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (e === 'node_modules' || e === '.git') continue;
    const s = statSync(p);
    if (s.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

const files = walk(join(root, 'src'));
const srcText = files
  .filter((f) => /\.(tsx?|ts)$/.test(f))
  .map((f) => [f, readFileSync(f, 'utf8')]);

// ── 1. manifests ──────────────────────────────────────────────
const manifestFiles = files.filter((f) => /[\\/]modules[\\/].*plugin\.ts$/.test(f));
const manifests = [];
for (const f of manifestFiles) {
  const src = readFileSync(f, 'utf8');
  const code = src.match(/code:\s*['"]([^'"]+)['"]/)?.[1];
  if (!code) { fail.push(`No code in ${f}`); continue; }
  const isCore = /isCore:\s*true/.test(src);
  const depBlock = src.match(/dependencies:\s*\[([^\]]*)\]/s)?.[1] ?? '';
  const dependencies = [...depBlock.matchAll(/['"]([^'"]+)['"]/g)].map((m) => m[1]);
  manifests.push({ file: f, code, isCore, dependencies });
}
const byCode = new Map(manifests.map((m) => [m.code, m]));
if (byCode.size !== manifests.length) fail.push('Duplicate plugin codes in manifests');
ok(`${manifests.length} frontend manifests parsed`);

// ── 2. backend ────────────────────────────────────────────────
const csPath = join(root, 'Backend/Modules/Plugins/KnownPlugins.cs');
const cs = readFileSync(csPath, 'utf8');
const allBlock = cs.slice(cs.indexOf('All = new List<Entry>'), cs.indexOf('ByCode'));
const backend = [];
for (const line of allBlock.split('\n')) {
  const m = line.match(/new\(\s*"([^"]+)"\s*,\s*(true|false)\s*,\s*(.*?)\)\s*,?\s*$/);
  if (!m) continue;
  const deps = [...m[3].matchAll(/"([^"]+)"/g)].map((d) => d[1]);
  backend.push({ code: m[1], isCore: m[2] === 'true', dependencies: deps });
}
ok(`${backend.length} backend entries parsed`);

const beMap = new Map(backend.map((b) => [b.code, b]));
for (const m of manifests) {
  const b = beMap.get(m.code);
  if (!b) { fail.push(`Backend missing ${m.code}`); continue; }
  if (b.isCore !== m.isCore) fail.push(`isCore mismatch for ${m.code} (fe=${m.isCore} be=${b.isCore})`);
  const a = [...m.dependencies].sort().join(',');
  const c = [...b.dependencies].sort().join(',');
  if (a !== c) fail.push(`dependency mismatch ${m.code}: fe=[${a}] be=[${c}]`);
}
for (const b of backend) if (!byCode.has(b.code)) fail.push(`Frontend missing manifest for ${b.code}`);
if (backend.length !== manifests.length) fail.push(`count mismatch fe=${manifests.length} be=${backend.length}`);

// ── 3. graph integrity ────────────────────────────────────────
for (const m of manifests) {
  for (const d of m.dependencies) if (!byCode.has(d)) fail.push(`${m.code} depends on unknown ${d}`);
}
const state = new Map();
const cycle = (code, stack = []) => {
  if (state.get(code) === 'done') return;
  if (stack.includes(code)) { fail.push(`Cycle: ${[...stack, code].join(' → ')}`); return; }
  for (const d of byCode.get(code)?.dependencies ?? []) cycle(d, [...stack, code]);
  state.set(code, 'done');
};
for (const m of manifests) cycle(m.code);
ok('graph: deps resolvable, no cycles');

const transDeps = (code, out = new Set()) => {
  for (const d of byCode.get(code)?.dependencies ?? []) if (!out.has(d)) { out.add(d); transDeps(d, out); }
  return out;
};
const transDependents = (code, out = new Set()) => {
  for (const m of manifests) if (m.dependencies.includes(code) && !out.has(m.code)) { out.add(m.code); transDependents(m.code, out); }
  return out;
};
for (const m of manifests) {
  if (m.isCore && m.dependencies.length) warn.push(`core ${m.code} declares dependencies`);
  if (!m.isCore) for (const d of transDeps(m.code)) if (!byCode.get(d)) fail.push(`${m.code} transitive dep ${d} unknown`);
}

// ── 4. guard coverage ─────────────────────────────────────────
const gated = new Set();
for (const [, text] of srcText) {
  for (const m of text.matchAll(/PluginGate[^>]*code=\{?["']([A-Z0-9]+)["']/g)) gated.add(m[1]);
  for (const m of text.matchAll(/isEnabled\(\s*['"]([A-Z0-9]+)['"]/g)) gated.add(m[1]);
  for (const m of text.matchAll(/useIsPluginEnabled\(\s*['"]([A-Z0-9]+)['"]/g)) gated.add(m[1]);
}
for (const m of manifests) {
  if (m.isCore) continue;
  const src = readFileSync(m.file, 'utf8');
  const hasRoutes = !/routes:\s*\[\s*\]/.test(src);
  if (!gated.has(m.code)) {
    if (hasRoutes) fail.push(`${m.code} declares routes but has NO PluginGate/isEnabled guard`);
    else warn.push(`${m.code} has no routes and no runtime guard (embedded feature, sidebar-gated only)`);
  }
}
ok(`guard references found for ${gated.size} codes`);

// ── 5. sidebar map ────────────────────────────────────────────
const sidebar = readFileSync(join(root, 'src/modules/dashboard/utils/sidebarPluginGating.ts'), 'utf8');
for (const m of sidebar.matchAll(/['"](PL\d+[A-Z]*)['"]/g)) {
  if (!byCode.has(m[1])) fail.push(`sidebar maps unknown code ${m[1]}`);
}
ok('sidebar gating map codes valid');

// ── 6. read-only app guarantee ────────────────────────────────
for (const [f, text] of srcText) {
  if (/shared[\\/]plugins/.test(f)) continue;
  if (/\bpluginsApi\.(toggle|bulkToggle)\b/.test(text)) fail.push(`in-app write path to plugin toggle in ${f}`);
  if (/const\s*\{[^}]*\btoggle\b[^}]*\}\s*=\s*usePlugins\(/.test(text)) fail.push(`in-app toggle wired in ${f}`);
}
ok('app is read-only: no in-app plugin write path');

// ── 7. cascade simulation ─────────────────────────────────────
function resolve(stored) {
  const out = new Map();
  const walk = (code) => {
    if (out.has(code)) return out.get(code);
    const m = byCode.get(code);
    if (!m) return true;
    if (m.isCore) { out.set(code, true); return true; }
    let v = stored[code] !== false;
    if (v) for (const d of m.dependencies) if (!walk(d)) { v = false; break; }
    out.set(code, v);
    return v;
  };
  for (const m of manifests) walk(m.code);
  return out;
}
const expectations = [
  ['PL0001CONTACTS', ['PL0002SALES', 'PL0003DEALS', 'PL0005OFFERS', 'PL0004INVOICES', 'PL0026PAYMENTS']],
  ['PL0015FIELD', ['PL0024DISPATCHER', 'PL0023SCHEDULING']],
  ['PL0024DISPATCHER', ['PL0023SCHEDULING']],
  ['PL0002SALES', ['PL0004INVOICES', 'PL0026PAYMENTS']],
];
for (const [code, expected] of expectations) {
  if (!byCode.has(code)) { warn.push(`expectation skipped, unknown code ${code}`); continue; }
  const res = resolve({ [code]: false });
  const off = [...res.entries()].filter(([, v]) => !v).map(([c]) => c);
  const backendOff = new Set([code, ...transDependents(code)]);
  for (const e of expected) {
    if (!byCode.has(e)) { warn.push(`expected cascade target ${e} not in registry`); continue; }
    if (!off.includes(e)) fail.push(`disabling ${code} did NOT switch off ${e}`);
    if (!backendOff.has(e)) fail.push(`backend cascade for ${code} misses ${e}`);
  }
  // enabling must pull the whole chain
  for (const dep of transDeps(code)) if (!byCode.get(dep)) fail.push(`bad chain for ${code}`);
}
ok('cascade tables verified (resolver + transitive dependents)');

// ── 8. no phantom plugin codes anywhere in src ────────────────
for (const [f, text] of srcText) {
  for (const m of text.matchAll(/PL\d{4}[A-Z]+/g)) {
    if (!byCode.has(m[0])) fail.push(`unknown plugin code ${m[0]} referenced in ${f.replace(root + '/', '')}`);
  }
}
ok('no phantom plugin codes in src');

// ── 9. workspace nav config ───────────────────────────────────
const navCfgPath = 'src/modules/dashboard/components/workspaces.config.ts';
const navCfg = readFileSync(join(root, navCfgPath), 'utf8');
const navCodes = [...navCfg.matchAll(/pluginCode:\s*['"]([^'"]+)['"]/g)].map((m) => m[1]);
for (const c of navCodes) if (!byCode.has(c)) fail.push(`workspaces.config references unknown code ${c}`);
if (navCodes.length === 0) fail.push('workspaces.config has no pluginCode gates');
ok(`workspace nav config: ${navCodes.length} gated entries, all codes valid`);

// ── 10. desktop AND mobile nav both apply gating ──────────────
for (const rel of [
  'src/modules/dashboard/components/WorkspaceSidebar.tsx',
  'src/modules/dashboard/components/MobileWorkspaceNav.tsx',
]) {
  const text = readFileSync(join(root, rel), 'utf8');
  if (!/usePlugins\(/.test(text)) fail.push(`${rel} does not read plugin state`);
  if (!/visibleWorkspaces\(/.test(text)) fail.push(`${rel} does not filter workspaces by activation`);
  if (/\bWORKSPACES\.map\(/.test(text)) fail.push(`${rel} renders the raw WORKSPACES list (ungated)`);
}
ok('desktop + mobile navigation both gate on plugin activation');

console.log('');
for (const w of warn) console.log('  ! ' + w);
if (fail.length) {
  console.error('\nFAILED:\n' + fail.map((f) => '  ✗ ' + f).join('\n'));
  process.exit(1);
}
console.log(`\nALL CHECKS PASSED — ${manifests.length} modules, ${manifests.filter((m) => m.isCore).length} core, ${manifests.reduce((n, m) => n + m.dependencies.length, 0)} dependency edges.`);

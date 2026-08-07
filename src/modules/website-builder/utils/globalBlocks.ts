// ============================================================
// Global Blocks & Design Tokens Storage
// Shared components and brand profiles across all sites
// ============================================================

import { BuilderComponent, SiteTheme, DEFAULT_THEME } from '../types';

// ── Global Blocks ──

const GLOBAL_BLOCKS_KEY = 'wb_global_blocks';

export interface GlobalBlock {
  id: string;
  name: string;
  description?: string;
  component: BuilderComponent;
  createdAt: string;
  updatedAt: string;
  usedIn: string[]; // site IDs where this block is used
}

export function loadGlobalBlocks(): GlobalBlock[] {
  try {
    return JSON.parse(localStorage.getItem(GLOBAL_BLOCKS_KEY) || '[]');
  } catch { return []; }
}

export function saveGlobalBlocks(blocks: GlobalBlock[]): void {
  localStorage.setItem(GLOBAL_BLOCKS_KEY, JSON.stringify(blocks));
}

export function createGlobalBlock(name: string, component: BuilderComponent, description?: string): GlobalBlock {
  const block: GlobalBlock = {
    id: `gb-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name,
    description,
    component: { ...component, id: `gb-inst-${Date.now()}` },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    usedIn: [],
  };
  const blocks = loadGlobalBlocks();
  blocks.push(block);
  saveGlobalBlocks(blocks);
  return block;
}

export function updateGlobalBlock(id: string, updates: Partial<Pick<GlobalBlock, 'name' | 'description' | 'component'>>): GlobalBlock | null {
  const blocks = loadGlobalBlocks();
  const idx = blocks.findIndex(b => b.id === id);
  if (idx < 0) return null;
  blocks[idx] = { ...blocks[idx], ...updates, updatedAt: new Date().toISOString() };
  saveGlobalBlocks(blocks);
  return blocks[idx];
}

export function deleteGlobalBlock(id: string): void {
  saveGlobalBlocks(loadGlobalBlocks().filter(b => b.id !== id));
}

export function trackBlockUsage(blockId: string, siteId: string): void {
  const blocks = loadGlobalBlocks();
  const block = blocks.find(b => b.id === blockId);
  if (block && !block.usedIn.includes(siteId)) {
    block.usedIn.push(siteId);
    saveGlobalBlocks(blocks);
  }
}

// ── Design Tokens (Brand Profiles) ──

const DESIGN_TOKENS_KEY = 'wb_design_tokens';

export interface BrandProfile {
  id: string;
  name: string;
  description?: string;
  theme: SiteTheme;
  createdAt: string;
  updatedAt: string;
}

export function loadBrandProfiles(): BrandProfile[] {
  try {
    const data = JSON.parse(localStorage.getItem(DESIGN_TOKENS_KEY) || '[]');
    // Add built-in profiles if empty
    if (data.length === 0) return getBuiltInProfiles();
    return data;
  } catch { return getBuiltInProfiles(); }
}

export function saveBrandProfiles(profiles: BrandProfile[]): void {
  localStorage.setItem(DESIGN_TOKENS_KEY, JSON.stringify(profiles));
}

export function createBrandProfile(name: string, theme: SiteTheme, description?: string): BrandProfile {
  const profile: BrandProfile = {
    id: `bp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name,
    description,
    theme: { ...theme },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const profiles = loadBrandProfiles();
  profiles.push(profile);
  saveBrandProfiles(profiles);
  return profile;
}

export function updateBrandProfile(id: string, updates: Partial<Pick<BrandProfile, 'name' | 'description' | 'theme'>>): BrandProfile | null {
  const profiles = loadBrandProfiles();
  const idx = profiles.findIndex(p => p.id === id);
  if (idx < 0) return null;
  profiles[idx] = { ...profiles[idx], ...updates, updatedAt: new Date().toISOString() };
  saveBrandProfiles(profiles);
  return profiles[idx];
}

export function deleteBrandProfile(id: string): void {
  saveBrandProfiles(loadBrandProfiles().filter(p => p.id !== id));
}

function getBuiltInProfiles(): BrandProfile[] {
  const now = new Date().toISOString();
  return [
    {
      id: 'bp-default', name: 'Default Blue', description: 'Clean and professional',
      theme: { ...DEFAULT_THEME },
      createdAt: now, updatedAt: now,
    },
    {
      id: 'bp-dark', name: 'Dark Mode', description: 'Elegant dark theme',
      theme: { ...DEFAULT_THEME, primaryColor: '#8b5cf6', backgroundColor: '#0f172a', textColor: '#f1f5f9', secondaryColor: '#94a3b8', accentColor: '#f59e0b' },
      createdAt: now, updatedAt: now,
    },
    {
      id: 'bp-coral', name: 'Coral Sunset', description: 'Warm and inviting',
      theme: { ...DEFAULT_THEME, primaryColor: '#ef4444', accentColor: '#f97316', secondaryColor: '#6b7280', headingFont: 'Georgia, serif' },
      createdAt: now, updatedAt: now,
    },
    {
      id: 'bp-forest', name: 'Forest Green', description: 'Natural and earthy',
      theme: { ...DEFAULT_THEME, primaryColor: '#059669', accentColor: '#d97706', secondaryColor: '#4b5563', backgroundColor: '#fafaf9' },
      createdAt: now, updatedAt: now,
    },
    {
      id: 'bp-corporate', name: 'Corporate Navy', description: 'Serious business tone',
      theme: { ...DEFAULT_THEME, primaryColor: '#1e40af', accentColor: '#0891b2', secondaryColor: '#475569', headingFont: 'Georgia, serif', borderRadius: 4 },
      createdAt: now, updatedAt: now,
    },
    {
      id: 'bp-playful', name: 'Playful Pink', description: 'Fun and creative',
      theme: { ...DEFAULT_THEME, primaryColor: '#ec4899', accentColor: '#8b5cf6', secondaryColor: '#6b7280', borderRadius: 16 },
      createdAt: now, updatedAt: now,
    },
    {
      id: 'bp-automotive', name: 'Automotive Red', description: 'Bold auto repair & car shop theme',
      theme: { ...DEFAULT_THEME, primaryColor: '#dc2626', secondaryColor: '#1e293b', accentColor: '#f59e0b', backgroundColor: '#ffffff', textColor: '#0f172a', headingFont: 'Space Grotesk, sans-serif', borderRadius: 8 },
      createdAt: now, updatedAt: now,
    },
  ];
}

/**
 * API Support Services
 *
 * Wraps the backend endpoints for:
 *  - Global Blocks
 *  - Brand Profiles
 *  - Form Submissions
 *  - Page Versions
 *  - Activity Log
 *  - Templates (backend)
 */
import {
  wbApi,
  toBackendId,
  resolveMediaUrl,
  type WBGlobalBlockDto,
  type WBBrandProfileDto,
  type WBFormSubmissionDto,
  type WBFormSubmissionListDto,
  type WBPageVersionDto,
  type WBActivityLogDto,
  type WBTemplateDto,
} from './apiClient';
import type { BuilderComponent, SiteTheme } from '../types';

// ── Result helper ──

interface ServiceResult<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

function ok<T>(data: T): ServiceResult<T> {
  return { data, error: null, success: true };
}

function fail<T>(err: any): ServiceResult<T> {
  const msg = err?.message || String(err);
  return { data: null, error: msg, success: false };
}

// ══════════════════════════════════════════════════════════════════
// Global Blocks
// ══════════════════════════════════════════════════════════════════

export interface ApiGlobalBlock {
  id: string;
  name: string;
  description?: string;
  component: BuilderComponent;
  category?: string;
  tags?: string;
  createdAt: string;
  updatedAt?: string;
  usageCount: number;
}

function mapGlobalBlock(dto: WBGlobalBlockDto): ApiGlobalBlock {
  let component: BuilderComponent;
  try {
    component = JSON.parse(dto.componentJson);
  } catch {
    component = { id: 'err', type: 'section', label: dto.name, props: {}, styles: {} };
  }
  return {
    id: String(dto.id),
    name: dto.name,
    description: dto.description,
    component,
    category: dto.category,
    tags: dto.tags,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
    usageCount: dto.usageCount,
  };
}

export const globalBlocksApi = {
  async list(): Promise<ServiceResult<ApiGlobalBlock[]>> {
    try {
      const { data } = await wbApi.get<WBGlobalBlockDto[]>('/api/WBGlobalBlocks');
      return ok(data.map(mapGlobalBlock));
    } catch (err) { return fail(err); }
  },

  async getById(id: string): Promise<ServiceResult<ApiGlobalBlock>> {
    try {
      const { data } = await wbApi.get<WBGlobalBlockDto>(`/api/WBGlobalBlocks/${toBackendId(id)}`);
      return ok(mapGlobalBlock(data));
    } catch (err) { return fail(err); }
  },

  async create(name: string, component: BuilderComponent, description?: string, category?: string): Promise<ServiceResult<ApiGlobalBlock>> {
    try {
      const { data } = await wbApi.post<WBGlobalBlockDto>('/api/WBGlobalBlocks', {
        name,
        description,
        componentJson: JSON.stringify(component),
        category,
      });
      return ok(mapGlobalBlock(data));
    } catch (err) { return fail(err); }
  },

  async update(id: string, updates: { name?: string; description?: string; component?: BuilderComponent; category?: string; tags?: string }): Promise<ServiceResult<ApiGlobalBlock>> {
    try {
      const body: Record<string, any> = {};
      if (updates.name !== undefined) body.name = updates.name;
      if (updates.description !== undefined) body.description = updates.description;
      if (updates.component !== undefined) body.componentJson = JSON.stringify(updates.component);
      if (updates.category !== undefined) body.category = updates.category;
      if (updates.tags !== undefined) body.tags = updates.tags;

      const { data } = await wbApi.put<WBGlobalBlockDto>(`/api/WBGlobalBlocks/${toBackendId(id)}`, body);
      return ok(mapGlobalBlock(data));
    } catch (err) { return fail(err); }
  },

  async delete(id: string): Promise<ServiceResult<void>> {
    try {
      await wbApi.delete(`/api/WBGlobalBlocks/${toBackendId(id)}`);
      return ok(undefined as any);
    } catch (err) { return fail(err); }
  },

  async trackUsage(blockId: string, siteId: string, pageId?: string): Promise<ServiceResult<void>> {
    try {
      const params: Record<string, number> = { siteId: toBackendId(siteId) };
      if (pageId) params.pageId = toBackendId(pageId);
      await wbApi.post(`/api/WBGlobalBlocks/${toBackendId(blockId)}/usage`, null, { params });
      return ok(undefined as any);
    } catch (err) { return fail(err); }
  },
};

// ══════════════════════════════════════════════════════════════════
// Brand Profiles
// ══════════════════════════════════════════════════════════════════

export interface ApiBrandProfile {
  id: string;
  name: string;
  description?: string;
  theme: SiteTheme;
  isBuiltIn: boolean;
  createdAt: string;
  updatedAt?: string;
}

function mapBrandProfile(dto: WBBrandProfileDto): ApiBrandProfile {
  let theme: SiteTheme;
  try {
    theme = JSON.parse(dto.themeJson);
  } catch {
    theme = {} as SiteTheme;
  }
  return {
    id: String(dto.id),
    name: dto.name,
    description: dto.description,
    theme,
    isBuiltIn: dto.isBuiltIn,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  };
}

export const brandProfilesApi = {
  async list(): Promise<ServiceResult<ApiBrandProfile[]>> {
    try {
      const { data } = await wbApi.get<WBBrandProfileDto[]>('/api/WBBrandProfiles');
      return ok(data.map(mapBrandProfile));
    } catch (err) { return fail(err); }
  },

  async getById(id: string): Promise<ServiceResult<ApiBrandProfile>> {
    try {
      const { data } = await wbApi.get<WBBrandProfileDto>(`/api/WBBrandProfiles/${toBackendId(id)}`);
      return ok(mapBrandProfile(data));
    } catch (err) { return fail(err); }
  },

  async create(name: string, theme: SiteTheme, description?: string): Promise<ServiceResult<ApiBrandProfile>> {
    try {
      const { data } = await wbApi.post<WBBrandProfileDto>('/api/WBBrandProfiles', {
        name,
        description,
        themeJson: JSON.stringify(theme),
      });
      return ok(mapBrandProfile(data));
    } catch (err) { return fail(err); }
  },

  async update(id: string, updates: { name?: string; description?: string; theme?: SiteTheme }): Promise<ServiceResult<ApiBrandProfile>> {
    try {
      const body: Record<string, any> = {};
      if (updates.name !== undefined) body.name = updates.name;
      if (updates.description !== undefined) body.description = updates.description;
      if (updates.theme !== undefined) body.themeJson = JSON.stringify(updates.theme);

      const { data } = await wbApi.put<WBBrandProfileDto>(`/api/WBBrandProfiles/${toBackendId(id)}`, body);
      return ok(mapBrandProfile(data));
    } catch (err) { return fail(err); }
  },

  async delete(id: string): Promise<ServiceResult<void>> {
    try {
      await wbApi.delete(`/api/WBBrandProfiles/${toBackendId(id)}`);
      return ok(undefined as any);
    } catch (err) { return fail(err); }
  },
};

// ══════════════════════════════════════════════════════════════════
// Form Submissions
// ══════════════════════════════════════════════════════════════════

export interface ApiFormSubmission {
  id: string;
  siteId: string;
  pageId?: string;
  formComponentId: string;
  formLabel: string;
  pageTitle: string;
  data: Record<string, any>;
  source?: string;
  webhookStatus?: string;
  submittedAt: string;
}

function mapFormSubmission(dto: WBFormSubmissionDto): ApiFormSubmission {
  let data: Record<string, any>;
  try {
    data = JSON.parse(dto.dataJson);
  } catch {
    data = {};
  }
  return {
    id: String(dto.id),
    siteId: String(dto.siteId),
    pageId: dto.pageId ? String(dto.pageId) : undefined,
    formComponentId: dto.formComponentId,
    formLabel: dto.formLabel,
    pageTitle: dto.pageTitle,
    data,
    source: dto.source,
    webhookStatus: dto.webhookStatus,
    submittedAt: dto.submittedAt,
  };
}

export const formSubmissionsApi = {
  async list(siteId: string, page = 1, pageSize = 50): Promise<ServiceResult<{ submissions: ApiFormSubmission[]; totalCount: number }>> {
    try {
      const { data } = await wbApi.get<WBFormSubmissionListDto>(`/api/WBFormSubmissions/site/${toBackendId(siteId)}`, {
        params: { pageNumber: page, pageSize },
      });
      return ok({
        submissions: data.submissions.map(mapFormSubmission),
        totalCount: data.totalCount,
      });
    } catch (err) { return fail(err); }
  },

  async delete(id: string): Promise<ServiceResult<void>> {
    try {
      await wbApi.delete(`/api/WBFormSubmissions/${toBackendId(id)}`);
      return ok(undefined as any);
    } catch (err) { return fail(err); }
  },

  async clear(siteId: string, formComponentId?: string): Promise<ServiceResult<void>> {
    try {
      const params: Record<string, string> = {};
      if (formComponentId) params.formComponentId = formComponentId;
      await wbApi.delete(`/api/WBFormSubmissions/site/${toBackendId(siteId)}/clear`, { params });
      return ok(undefined as any);
    } catch (err) { return fail(err); }
  },

  /** Submit a form on a public (published) site */
  async submitPublic(siteSlug: string, submission: {
    formComponentId: string;
    formLabel: string;
    pageTitle: string;
    data: Record<string, any>;
    source?: string;
  }): Promise<ServiceResult<ApiFormSubmission>> {
    try {
      const { data } = await wbApi.post<WBFormSubmissionDto>(`/api/public/sites/${siteSlug}/forms`, {
        siteId: 0, // Overridden by backend
        formComponentId: submission.formComponentId,
        formLabel: submission.formLabel,
        pageTitle: submission.pageTitle,
        dataJson: JSON.stringify(submission.data),
        source: submission.source || 'website',
      });
      return ok(mapFormSubmission(data));
    } catch (err) { return fail(err); }
  },
};

// ══════════════════════════════════════════════════════════════════
// Page Versions
// ══════════════════════════════════════════════════════════════════

export interface ApiPageVersion {
  id: string;
  pageId: string;
  siteId: string;
  versionNumber: number;
  components: BuilderComponent[];
  changeMessage?: string;
  createdAt: string;
  createdBy?: string;
}

function mapPageVersion(dto: WBPageVersionDto): ApiPageVersion {
  let components: BuilderComponent[];
  try {
    components = JSON.parse(dto.componentsJson);
  } catch {
    components = [];
  }
  return {
    id: String(dto.id),
    pageId: String(dto.pageId),
    siteId: String(dto.siteId),
    versionNumber: dto.versionNumber,
    components,
    changeMessage: dto.changeMessage,
    createdAt: dto.createdAt,
    createdBy: dto.createdBy,
  };
}

export const pageVersionsApi = {
  async list(pageId: string): Promise<ServiceResult<ApiPageVersion[]>> {
    try {
      const { data } = await wbApi.get<WBPageVersionDto[]>(`/api/WBPages/${toBackendId(pageId)}/versions`);
      return ok(data.map(mapPageVersion));
    } catch (err) { return fail(err); }
  },

  async save(pageId: string, changeMessage?: string): Promise<ServiceResult<ApiPageVersion>> {
    try {
      const { data } = await wbApi.post<WBPageVersionDto>(`/api/WBPages/${toBackendId(pageId)}/versions`, {
        changeMessage,
      });
      return ok(mapPageVersion(data));
    } catch (err) { return fail(err); }
  },

  async restore(pageId: string, versionId: string): Promise<ServiceResult<void>> {
    try {
      await wbApi.post(`/api/WBPages/${toBackendId(pageId)}/versions/${toBackendId(versionId)}/restore`);
      return ok(undefined as any);
    } catch (err) { return fail(err); }
  },
};

// ══════════════════════════════════════════════════════════════════
// Activity Log
// ══════════════════════════════════════════════════════════════════

export interface ApiActivityLog {
  id: string;
  siteId: string;
  pageId?: string;
  action: string;
  entityType: string;
  details?: string;
  createdAt: string;
  createdBy?: string;
}

export const activityLogApi = {
  async list(siteId: string, count = 50): Promise<ServiceResult<ApiActivityLog[]>> {
    try {
      const { data } = await wbApi.get<WBActivityLogDto[]>(`/api/WBActivityLog/site/${toBackendId(siteId)}`, {
        params: { count },
      });
      return ok(data.map(d => ({
        id: String(d.id),
        siteId: String(d.siteId),
        pageId: d.pageId ? String(d.pageId) : undefined,
        action: d.action,
        entityType: d.entityType,
        details: d.details,
        createdAt: d.createdAt,
        createdBy: d.createdBy,
      })));
    } catch (err) { return fail(err); }
  },
};

// ══════════════════════════════════════════════════════════════════
// Backend Templates
// ══════════════════════════════════════════════════════════════════

export interface ApiTemplate {
  id: string;
  name: string;
  description?: string;
  category: string;
  previewImageUrl?: string;
  theme: SiteTheme;
  pages: any[];
  tags?: string;
  isPremium: boolean;
  isBuiltIn: boolean;
  sortOrder: number;
}

function mapTemplate(dto: WBTemplateDto): ApiTemplate {
  let theme: SiteTheme;
  try { theme = JSON.parse(dto.themeJson); } catch { theme = {} as SiteTheme; }
  let pages: any[];
  try { pages = JSON.parse(dto.pagesJson); } catch { pages = []; }
  return {
    id: String(dto.id),
    name: dto.name,
    description: dto.description,
    category: dto.category,
    previewImageUrl: dto.previewImageUrl ? resolveMediaUrl(dto.previewImageUrl) : undefined,
    theme,
    pages,
    tags: dto.tags,
    isPremium: dto.isPremium,
    isBuiltIn: dto.isBuiltIn,
    sortOrder: dto.sortOrder,
  };
}

export const templatesApi = {
  async list(): Promise<ServiceResult<ApiTemplate[]>> {
    try {
      const { data } = await wbApi.get<WBTemplateDto[]>('/api/WBTemplates');
      return ok(data.map(mapTemplate));
    } catch (err) { return fail(err); }
  },

  async getById(id: string): Promise<ServiceResult<ApiTemplate>> {
    try {
      const { data } = await wbApi.get<WBTemplateDto>(`/api/WBTemplates/${toBackendId(id)}`);
      return ok(mapTemplate(data));
    } catch (err) { return fail(err); }
  },

  async categories(): Promise<ServiceResult<string[]>> {
    try {
      const { data } = await wbApi.get<string[]>('/api/WBTemplates/categories');
      return ok(data);
    } catch (err) { return fail(err); }
  },
};

// ══════════════════════════════════════════════════════════════════
// Public Site (for visitor-facing pages, no auth)
// ══════════════════════════════════════════════════════════════════

export const publicSiteApi = {
  async getSiteBySlug(slug: string): Promise<ServiceResult<any>> {
    try {
      const { data } = await wbApi.get(`/api/public/sites/${slug}`);
      return ok(data);
    } catch (err) { return fail(err); }
  },
};

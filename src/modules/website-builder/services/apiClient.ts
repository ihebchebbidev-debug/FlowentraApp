/**
 * Website Builder API Client
 *
 * Centralized axios instance with auth interceptors, error handling,
 * and DTO ↔ frontend type mappers.
 */
import axios, { AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import { API_CONFIG } from '@/config/api.config';
import { getCurrentTenant, TENANT_HEADER } from '@/utils/tenant';
import type {
  WebsiteSite, SitePage, SiteTheme, BuilderComponent,
  PageSEO, PageTranslation, SiteLanguage,
} from '../types';
import { queueHttpOperation, shouldQueueOfflineWrites } from '@/services/offline/syncEngine';

// ══════════════════════════════════════════════════════════════════
// Axios Instance
// ══════════════════════════════════════════════════════════════════

export const wbApi: AxiosInstance = axios.create({
  baseURL: API_CONFIG.baseURL,
  timeout: 30000, // 30s for uploads
  headers: { 'Content-Type': 'application/json' },
});

// Auth interceptor — attach JWT and tenant header from localStorage
wbApi.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('access_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  const tenant = getCurrentTenant();
  if (tenant && config.headers) {
    config.headers[TENANT_HEADER] = tenant;
  }
  const method = (config.method || 'GET').toUpperCase();
  const bypassOfflineQueue = (config.headers as Record<string, string> | undefined)?.['X-Bypass-Offline-Queue'] === 'true';
  if (shouldQueueOfflineWrites() && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) && !bypassOfflineQueue) {
    return queueHttpOperation({
      endpoint: config.url || '',
      method,
      body: config.data,
      headers: config.headers as Record<string, string>,
    }).then(() => {
      window.dispatchEvent(new CustomEvent('offline:queue-updated'));
      return Promise.reject(new ApiError('OFFLINE_QUEUED', 202));
    });
  }
  return config;
});

// Response interceptor — normalize errors and extract validation details
wbApi.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ 
    error?: string; 
    message?: string; 
    title?: string;
    errors?: Record<string, string[]>;
    traceId?: string;
  }>) => {
    const data = error.response?.data;
    const status = error.response?.status;
    
    // Extract validation errors if present (ASP.NET validation format)
    let msg = '';
    if (data?.errors && typeof data.errors === 'object') {
      // Format: { "PropertyName": ["Error message 1", "Error message 2"] }
      const errorMessages: string[] = [];
      for (const [field, messages] of Object.entries(data.errors)) {
        if (Array.isArray(messages)) {
          messages.forEach(m => {
            // Clean up field name for display (e.g., "ThemeJson" -> "Theme")
            const cleanField = field.replace(/Json$/, '').replace(/([A-Z])/g, ' $1').trim();
            errorMessages.push(`${cleanField}: ${m}`);
          });
        }
      }
      msg = errorMessages.length > 0 
        ? errorMessages.join('; ') 
        : data.title || 'Validation failed';
    } else {
      msg = data?.error || data?.message || data?.title || error.message || 'An unexpected error occurred';
    }

    if (status === 401) {
      console.warn('[WB API] Unauthorized — token may be expired');
    }

    if (msg === 'OFFLINE_QUEUED') {
      return Promise.resolve({ data: { queued: true, offline: true }, status: 202 } as any);
    }
    return Promise.reject(new ApiError(msg, status));
  }
);

// ══════════════════════════════════════════════════════════════════
// Error Class
// ══════════════════════════════════════════════════════════════════

export class ApiError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

// ══════════════════════════════════════════════════════════════════
// Backend DTO Types (mirrors WBDTOs.cs)
// ══════════════════════════════════════════════════════════════════

export interface WBSiteDto {
  id: number;
  name: string;
  slug: string;
  description?: string;
  favicon?: string;
  themeJson: string;
  published: boolean;
  publishedAt?: string;
  publishedUrl?: string;
  defaultLanguage?: string;
  languagesJson?: string;
  createdAt: string;
  updatedAt?: string;
  createdBy?: string;
  modifiedBy?: string;
  pages: WBPageDto[];
}

export interface WBSiteListDto {
  sites: WBSiteDto[];
  totalCount: number;
}

export interface WBPageDto {
  id: number;
  siteId: number;
  title: string;
  slug: string;
  componentsJson: string;
  seoJson: string;
  translationsJson?: string;
  isHomePage: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt?: string;
  createdBy?: string;
}

export interface WBPageVersionDto {
  id: number;
  pageId: number;
  siteId: number;
  versionNumber: number;
  componentsJson: string;
  changeMessage?: string;
  createdAt: string;
  createdBy?: string;
}

export interface WBGlobalBlockDto {
  id: number;
  name: string;
  description?: string;
  componentJson: string;
  category?: string;
  tags?: string;
  createdAt: string;
  updatedAt?: string;
  createdBy?: string;
  usageCount: number;
}

export interface WBBrandProfileDto {
  id: number;
  name: string;
  description?: string;
  themeJson: string;
  isBuiltIn: boolean;
  createdAt: string;
  updatedAt?: string;
  createdBy?: string;
}

export interface WBFormSubmissionDto {
  id: number;
  siteId: number;
  pageId?: number;
  formComponentId: string;
  formLabel: string;
  pageTitle: string;
  dataJson: string;
  source?: string;
  webhookStatus?: string;
  submittedAt: string;
}

export interface WBFormSubmissionListDto {
  submissions: WBFormSubmissionDto[];
  totalCount: number;
}

export interface WBMediaDto {
  id: number;
  siteId?: number;
  fileName: string;
  originalName: string;
  fileUrl: string;
  fileSize: number;
  contentType: string;
  width?: number;
  height?: number;
  folder?: string;
  altText?: string;
  uploadedAt: string;
  uploadedBy?: string;
}

export interface WBUploadResponseDto {
  success: boolean;
  media?: WBMediaDto;
  error?: string;
}

export interface WBUploadMultipleResponseDto {
  results: WBUploadResponseDto[];
  successCount: number;
  failedCount: number;
}

export interface WBMediaInternalDto {
  id: number;
  fileName: string;
  originalName: string;
  filePath: string;
  fileUrl: string;
  contentType: string;
}

export interface WBTemplateDto {
  id: number;
  name: string;
  description?: string;
  category: string;
  previewImageUrl?: string;
  themeJson: string;
  pagesJson: string;
  tags?: string;
  isPremium: boolean;
  isBuiltIn: boolean;
  sortOrder: number;
}

export interface WBActivityLogDto {
  id: number;
  siteId: number;
  pageId?: number;
  action: string;
  entityType: string;
  details?: string;
  createdAt: string;
  createdBy?: string;
}

// ══════════════════════════════════════════════════════════════════
// DTO ↔ Frontend Type Mappers
// ══════════════════════════════════════════════════════════════════

function safeParseJson<T>(json: string | undefined | null, fallback: T): T {
  if (!json) return fallback;
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

export function mapSiteDtoToFrontend(dto: WBSiteDto): WebsiteSite {
  return {
    id: String(dto.id),
    name: dto.name,
    slug: dto.slug,
    description: dto.description,
    favicon: dto.favicon,
    theme: safeParseJson<SiteTheme>(dto.themeJson, {} as SiteTheme),
    published: dto.published,
    publishedAt: dto.publishedAt,
    publishedUrl: dto.publishedUrl,
    defaultLanguage: dto.defaultLanguage,
    languages: safeParseJson<SiteLanguage[]>(dto.languagesJson, undefined),
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt || dto.createdAt,
    pages: (dto.pages || []).map(mapPageDtoToFrontend),
  };
}

export function mapPageDtoToFrontend(dto: WBPageDto): SitePage {
  return {
    id: String(dto.id),
    title: dto.title,
    slug: dto.slug,
    components: safeParseJson<BuilderComponent[]>(dto.componentsJson, []),
    seo: safeParseJson<PageSEO>(dto.seoJson, {}),
    translations: safeParseJson<Record<string, PageTranslation>>(dto.translationsJson, undefined),
    isHomePage: dto.isHomePage,
    order: dto.sortOrder,
  };
}

/** Convert frontend site ID (string) to backend ID (number). Returns 0 if invalid. */
export function toBackendId(frontendId: string): number {
  const n = parseInt(frontendId, 10);
  return isNaN(n) ? 0 : n;
}

/** Build the full media URL, prepending the API base if the URL is relative */
export function resolveMediaUrl(fileUrl: string): string {
  if (!fileUrl) return '';
  if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://') || fileUrl.startsWith('data:')) {
    return fileUrl;
  }
  return `${API_CONFIG.baseURL}${fileUrl}`;
}

/**
 * Services Layer — API abstraction for backend integration.
 * 
 * This layer sits between the UI and storage. When migrating to a backend,
 * update these services to call your API endpoints.
 */

// Re-export with explicit names to avoid conflicts
export {
  fetchSites,
  fetchSite,
  createSite,
  updateSite,
  deleteSite,
  duplicateSite,
  addPage,
  updatePageComponents,
  updateTheme,
  publishSite,
  unpublishSite,
  type CreateSiteOptions,
  type UpdateSiteOptions,
} from './siteService';

export {
  fetchTemplates,
  fetchTemplate,
  createSiteFromTemplate,
  fetchThemes,
  applyThemeToSite,
  fetchTemplateCategories,
  fetchTemplatesByCategory,
  type TemplateMetadata,
  type ThemeMetadata,
} from './templateService';

// Storage provider abstraction
export {
  getStorageProvider,
  setStorageProvider,
  initApiProviders,
  LocalStorageProvider,
  storageProvider,
  type IStorageProvider,
  type StorageResult,
  type CreateSiteInput,
  type UpdateSiteInput,
  type ListSitesOptions,
} from './storageProvider';

// API providers (for direct use)
export { ApiStorageProvider } from './apiStorageProvider';
export { ApiImageProvider } from './apiImageProvider';

// API support services
export {
  globalBlocksApi,
  brandProfilesApi,
  formSubmissionsApi,
  pageVersionsApi,
  activityLogApi,
  templatesApi,
  publicSiteApi,
  type ApiGlobalBlock,
  type ApiBrandProfile,
  type ApiFormSubmission,
  type ApiPageVersion,
  type ApiActivityLog,
  type ApiTemplate,
} from './apiSupportServices';

// Image service
export {
  imageService,
  getImageProvider,
  setImageProvider,
  LocalImageProvider,
  type IImageProvider,
  type ImageUploadResult,
  type ImageUploadOptions,
  type ImageTransformOptions,
} from './imageService';

// Content service
export {
  contentService,
  extractTranslatableContent,
  applyTranslations,
  getTranslationStatus,
  searchContent,
  clonePageContent,
  mergeComponentUpdates,
  getComponentStats,
  type ContentVersion,
  type TranslationStatus,
  type ContentSearchResult,
} from './contentService';

// Shared result type
export interface ServiceResult<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

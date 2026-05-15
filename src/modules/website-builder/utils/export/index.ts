/**
 * Export orchestrator — public API for the export system.
 */
export type { ExportedFile, ExportOptions, ExportProgress, ExportProgressCallback, BlockHtmlContext } from './types';
export { generateSiteHtml, generateSiteHtmlWithStats } from './htmlExporter';
export type { HtmlExportResult, HtmlExportOptions } from './htmlExporter';
export { generateReactProject, generateReactProjectWithStats } from './reactExporter';
export type { ReactExportOptions, ReactExportResult } from './reactExporter';
export { createZipBlob, downloadBlob, downloadAsZip } from './zipHelper';
export { extractImageAssets, calculateSizeSavings } from './imageAssetExtractor';
export type { ExtractedAsset, AssetExtractionResult, ImageExtractionOptions } from './imageAssetExtractor';
export { 
  optimizeImage, 
  formatBytes, 
  calculateSavingsPercent,
  DEFAULT_OPTIMIZATION_OPTIONS,
  OPTIMIZATION_PRESETS,
} from './imageOptimizer';
export type { ImageOptimizationOptions } from './imageOptimizer';
export { HOSTING_PRESETS, getHostingPreset, mergeOptimizationOptions } from './hostingPresets';
export type { HostingPlatform, HostingPreset } from './hostingPresets';

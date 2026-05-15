/**
 * Image Asset Extractor
 * 
 * Detects data-URI images in HTML content, extracts them as separate files,
 * and replaces references with relative paths for smaller HTML files.
 * Supports optional image optimization (resize, compress, WebP conversion).
 */
import type { ExportedFile, ExportProgressCallback } from './types';
import { 
  type ImageOptimizationOptions, 
  DEFAULT_OPTIMIZATION_OPTIONS,
  optimizeImage,
  formatBytes,
  calculateSavingsPercent,
} from './imageOptimizer';

export interface ExtractedAsset {
  /** Original data-URI or base64 string */
  originalUri: string;
  /** New relative path (e.g., 'assets/image-1.png') */
  relativePath: string;
  /** Binary content */
  content: Uint8Array;
  /** File extension */
  extension: string;
}

export interface AssetExtractionResult {
  /** Modified HTML files with data-URIs replaced */
  modifiedFiles: ExportedFile[];
  /** Extracted image assets */
  assets: ExportedFile[];
  /** Count of images extracted */
  imageCount: number;
  /** Original total size in bytes */
  originalSize: number;
  /** Optimized total size in bytes */
  optimizedSize: number;
}

export interface ImageExtractionOptions {
  /** Image optimization settings */
  optimization?: ImageOptimizationOptions;
}

/**
 * Regular expression to match data-URI images in HTML content.
 * Matches: data:image/[type];base64,[data]
 */
const DATA_URI_REGEX = /data:image\/(png|jpe?g|gif|webp|svg\+xml|avif);base64,([A-Za-z0-9+/=]+)/g;

/**
 * Convert a base64 string to Uint8Array
 */
function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Get file extension from image MIME type
 */
function getExtensionFromMime(mimeType: string): string {
  const typeMap: Record<string, string> = {
    'png': 'png',
    'jpeg': 'jpg',
    'jpg': 'jpg',
    'gif': 'gif',
    'webp': 'webp',
    'svg+xml': 'svg',
    'avif': 'avif',
  };
  return typeMap[mimeType.toLowerCase()] || 'png';
}

/**
 * Calculate the depth of a file path to determine relative path prefix
 * e.g., 'index.html' → 0, 'about/index.html' → 1, 'en/about/index.html' → 2
 */
function getPathDepth(filePath: string): number {
  const parts = filePath.split('/').filter(p => p && p !== 'index.html');
  return parts.length;
}

/**
 * Get the relative path prefix to assets folder based on file depth
 */
function getRelativePrefix(filePath: string): string {
  const depth = getPathDepth(filePath);
  if (depth === 0) return '';
  return '../'.repeat(depth);
}

/**
 * Extract data-URI images from HTML files and convert to separate asset files.
 * This significantly reduces HTML file sizes for sites with embedded images.
 */
export async function extractImageAssets(
  files: ExportedFile[],
  onProgress?: ExportProgressCallback,
  options?: ImageExtractionOptions
): Promise<AssetExtractionResult> {
  const assets: ExportedFile[] = [];
  const uriToPath = new Map<string, string>();
  let imageIndex = 0;
  let totalImages = 0;
  let totalOriginalSize = 0;
  let totalOptimizedSize = 0;

  const optimizationOptions = options?.optimization || DEFAULT_OPTIMIZATION_OPTIONS;

  // First pass: count total images across all files
  for (const file of files) {
    if (typeof file.content === 'string' && file.path.endsWith('.html')) {
      const matches = file.content.match(DATA_URI_REGEX);
      if (matches) {
        totalImages += matches.length;
      }
    }
  }

  if (totalImages === 0) {
    return {
      modifiedFiles: files,
      assets: [],
      imageCount: 0,
      originalSize: 0,
      optimizedSize: 0,
    };
  }

  const optimizationLabel = optimizationOptions.enabled 
    ? ` (optimizing${optimizationOptions.convertToWebP ? ' + WebP' : ''})` 
    : '';

  onProgress?.({
    phase: 'extracting-images',
    current: 0,
    total: totalImages,
    message: `Extracting ${totalImages} image${totalImages !== 1 ? 's' : ''}${optimizationLabel}...`,
  });

  const modifiedFiles: ExportedFile[] = [];

  for (const file of files) {
    // Only process HTML files with string content
    if (typeof file.content !== 'string' || !file.path.endsWith('.html')) {
      modifiedFiles.push(file);
      continue;
    }

    let modifiedContent = file.content;
    const relativePrefix = getRelativePrefix(file.path);
    
    // Find all data-URI images in this file
    const matches = [...file.content.matchAll(DATA_URI_REGEX)];
    
    for (const match of matches) {
      const fullUri = match[0];
      const mimeType = match[1];
      const base64Data = match[2];
      
      // Check if we've already extracted this exact image
      let assetPath = uriToPath.get(fullUri);
      
      if (!assetPath) {
        // New image - extract and optionally optimize it
        imageIndex++;
        
        try {
          // Optimize the image if enabled
          const optimized = await optimizeImage(base64Data, mimeType, optimizationOptions);
          
          const fileName = `image-${imageIndex}.${optimized.extension}`;
          assetPath = `assets/${fileName}`;
          
          totalOriginalSize += optimized.originalSize;
          totalOptimizedSize += optimized.optimizedSize;
          
          assets.push({
            path: assetPath,
            content: optimized.content,
          });
          uriToPath.set(fullUri, assetPath);
          
          const savingsInfo = optimized.originalSize !== optimized.optimizedSize
            ? ` (${formatBytes(optimized.originalSize)} → ${formatBytes(optimized.optimizedSize)})`
            : '';
          
          onProgress?.({
            phase: 'extracting-images',
            current: imageIndex,
            total: totalImages,
            message: `Processing ${fileName}${savingsInfo}...`,
            imageCount: imageIndex,
          });
        } catch (err) {
          // Skip invalid base64 data, keep original
          console.warn(`Failed to extract image: ${err}`);
          continue;
        }
      }
      
      // Replace the data-URI with relative path
      const relativePath = relativePrefix + assetPath;
      modifiedContent = modifiedContent.replace(fullUri, relativePath);
    }
    
    modifiedFiles.push({
      path: file.path,
      content: modifiedContent,
    });
  }

  const savingsPercent = calculateSavingsPercent(totalOriginalSize, totalOptimizedSize);
  const savingsMessage = savingsPercent > 0 
    ? ` Saved ${savingsPercent}% (${formatBytes(totalOriginalSize - totalOptimizedSize)})` 
    : '';

  onProgress?.({
    phase: 'extracting-images',
    current: totalImages,
    total: totalImages,
    message: `Extracted ${assets.length} image${assets.length !== 1 ? 's' : ''} to assets folder.${savingsMessage}`,
    imageCount: assets.length,
  });

  return {
    modifiedFiles,
    assets,
    imageCount: assets.length,
    originalSize: totalOriginalSize,
    optimizedSize: totalOptimizedSize,
  };
}

/**
 * Calculate the approximate size savings from extracting images
 */
export function calculateSizeSavings(
  originalFiles: ExportedFile[],
  modifiedFiles: ExportedFile[]
): { originalSize: number; newHtmlSize: number; assetSize: number; savingsPercent: number } {
  const getSize = (file: ExportedFile): number => {
    if (typeof file.content === 'string') {
      return new Blob([file.content]).size;
    }
    return file.content.byteLength;
  };

  const originalSize = originalFiles
    .filter(f => f.path.endsWith('.html'))
    .reduce((sum, f) => sum + getSize(f), 0);
    
  const newHtmlSize = modifiedFiles
    .filter(f => f.path.endsWith('.html'))
    .reduce((sum, f) => sum + getSize(f), 0);
    
  const assetSize = modifiedFiles
    .filter(f => f.path.startsWith('assets/'))
    .reduce((sum, f) => sum + getSize(f), 0);

  const totalNewSize = newHtmlSize + assetSize;
  const savingsPercent = originalSize > 0 
    ? Math.round((1 - totalNewSize / originalSize) * 100)
    : 0;

  return {
    originalSize,
    newHtmlSize,
    assetSize,
    savingsPercent: Math.max(0, savingsPercent), // Don't show negative savings
  };
}

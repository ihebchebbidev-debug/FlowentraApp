/**
 * Image Optimizer for Export
 * 
 * Provides image optimization during export: resize, compress, and WebP conversion.
 * Uses Canvas API for browser-side image processing.
 */
import type { ExportProgressCallback } from './types';

export interface ImageOptimizationOptions {
  /** Enable image optimization */
  enabled: boolean;
  /** Maximum width for images (maintains aspect ratio) */
  maxWidth: number;
  /** Maximum height for images (maintains aspect ratio) */
  maxHeight: number;
  /** JPEG/WebP quality (0-1) */
  quality: number;
  /** Convert images to WebP format */
  convertToWebP: boolean;
  /** Skip optimization for images smaller than this size in bytes */
  skipBelowSize: number;
}

export const DEFAULT_OPTIMIZATION_OPTIONS: ImageOptimizationOptions = {
  enabled: false,
  maxWidth: 1920,
  maxHeight: 1080,
  quality: 0.85,
  convertToWebP: false,
  skipBelowSize: 10 * 1024, // 10KB
};

export const OPTIMIZATION_PRESETS: Record<string, Partial<ImageOptimizationOptions>> = {
  none: { enabled: false },
  balanced: {
    enabled: true,
    maxWidth: 1920,
    maxHeight: 1080,
    quality: 0.85,
    convertToWebP: false,
  },
  performance: {
    enabled: true,
    maxWidth: 1280,
    maxHeight: 720,
    quality: 0.75,
    convertToWebP: true,
  },
  quality: {
    enabled: true,
    maxWidth: 2560,
    maxHeight: 1440,
    quality: 0.92,
    convertToWebP: false,
  },
};

interface OptimizedImage {
  content: Uint8Array;
  extension: string;
  originalSize: number;
  optimizedSize: number;
}

/**
 * Optimize a single image from base64 data.
 */
export async function optimizeImage(
  base64Data: string,
  mimeType: string,
  options: ImageOptimizationOptions
): Promise<OptimizedImage> {
  const originalContent = base64ToUint8Array(base64Data);
  const originalSize = originalContent.byteLength;

  // Skip optimization if disabled or image is too small
  if (!options.enabled || originalSize < options.skipBelowSize) {
    return {
      content: originalContent,
      extension: getExtensionFromMime(mimeType),
      originalSize,
      optimizedSize: originalSize,
    };
  }

  // Skip SVGs - they're already optimized vector graphics
  if (mimeType === 'svg+xml') {
    return {
      content: originalContent,
      extension: 'svg',
      originalSize,
      optimizedSize: originalSize,
    };
  }

  try {
    // Create image element
    const img = await loadImage(`data:image/${mimeType};base64,${base64Data}`);
    
    // Calculate new dimensions
    const { width, height } = calculateDimensions(
      img.width,
      img.height,
      options.maxWidth,
      options.maxHeight
    );

    // Create canvas and draw resized image
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }

    // Use high-quality image scaling
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, width, height);

    // Determine output format
    const outputFormat = options.convertToWebP ? 'image/webp' : `image/${mimeType === 'jpg' ? 'jpeg' : mimeType}`;
    const extension = options.convertToWebP ? 'webp' : getExtensionFromMime(mimeType);

    // Export as blob
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => b ? resolve(b) : reject(new Error('Failed to create blob')),
        outputFormat,
        options.quality
      );
    });

    const optimizedContent = new Uint8Array(await blob.arrayBuffer());

    // Only use optimized version if it's actually smaller
    if (optimizedContent.byteLength >= originalSize) {
      return {
        content: originalContent,
        extension: getExtensionFromMime(mimeType),
        originalSize,
        optimizedSize: originalSize,
      };
    }

    return {
      content: optimizedContent,
      extension,
      originalSize,
      optimizedSize: optimizedContent.byteLength,
    };
  } catch (error) {
    console.warn('Image optimization failed, using original:', error);
    return {
      content: originalContent,
      extension: getExtensionFromMime(mimeType),
      originalSize,
      optimizedSize: originalSize,
    };
  }
}

/**
 * Load an image from a data URL.
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Calculate new dimensions maintaining aspect ratio.
 */
function calculateDimensions(
  width: number,
  height: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  if (width <= maxWidth && height <= maxHeight) {
    return { width, height };
  }

  const ratioW = maxWidth / width;
  const ratioH = maxHeight / height;
  const ratio = Math.min(ratioW, ratioH);

  return {
    width: Math.round(width * ratio),
    height: Math.round(height * ratio),
  };
}

/**
 * Convert a base64 string to Uint8Array.
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
 * Get file extension from MIME type.
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
 * Format bytes to human-readable string.
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
 * Calculate savings percentage.
 */
export function calculateSavingsPercent(original: number, optimized: number): number {
  if (original === 0) return 0;
  return Math.round((1 - optimized / original) * 100);
}

/**
 * Image Service — Abstracted image upload and management.
 * 
 * This service provides a clean interface for image operations that can be
 * swapped with a backend implementation (Supabase Storage, S3, Cloudinary, etc.)
 * 
 * Usage:
 *   import { imageService, setImageProvider } from './imageService';
 *   
 *   // Upload an image
 *   const result = await imageService.upload(file, { folder: 'heroes' });
 *   
 *   // Switch to cloud provider
 *   setImageProvider(new CloudImageProvider());
 */
import { validateImageFile, readFileAsDataUrl, isImageSrc } from '../utils/imageUtils';

// ══════════════════════════════════════════════════════════════════
// Types
// ══════════════════════════════════════════════════════════════════

export interface ImageUploadResult {
  url: string;
  publicId?: string;
  width?: number;
  height?: number;
  format?: string;
  size?: number;
}

export interface ImageUploadOptions {
  folder?: string;
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'auto' | 'webp' | 'jpeg' | 'png';
  optimize?: boolean;
}

export interface ImageTransformOptions {
  width?: number;
  height?: number;
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  format?: 'webp' | 'jpeg' | 'png' | 'avif';
  quality?: number;
  blur?: number;
  grayscale?: boolean;
}

export interface ServiceResult<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

export interface IImageProvider {
  /**
   * Upload an image file
   */
  upload(file: File, options?: ImageUploadOptions): Promise<ServiceResult<ImageUploadResult>>;
  
  /**
   * Upload from a data URL or external URL
   */
  uploadFromUrl(url: string, options?: ImageUploadOptions): Promise<ServiceResult<ImageUploadResult>>;
  
  /**
   * Delete an image by its public ID or URL
   */
  delete(publicIdOrUrl: string): Promise<ServiceResult<void>>;
  
  /**
   * Get a transformed URL for an image
   */
  getTransformedUrl(url: string, options: ImageTransformOptions): string;
  
  /**
   * List images in a folder (if supported)
   */
  list(folder?: string): Promise<ServiceResult<ImageUploadResult[]>>;
}

// ══════════════════════════════════════════════════════════════════
// Local Storage Provider (Default)
// ══════════════════════════════════════════════════════════════════

/**
 * Default provider that stores images as base64 data URLs.
 * Suitable for development and small-scale usage.
 * Replace with CloudImageProvider for production.
 */
const IMAGE_STORAGE_KEY = 'website_builder_images';

export class LocalImageProvider implements IImageProvider {
  private images: Map<string, ImageUploadResult>;

  constructor() {
    // Hydrate from localStorage on init for persistence across page reloads
    this.images = new Map();
    try {
      const raw = localStorage.getItem(IMAGE_STORAGE_KEY);
      if (raw) {
        const entries: [string, ImageUploadResult][] = JSON.parse(raw);
        entries.forEach(([k, v]) => this.images.set(k, v));
      }
    } catch { /* ignore corrupt data */ }
  }

  private persist(): void {
    try {
      // Only persist metadata, not the full data URLs (those are in components)
      const entries = Array.from(this.images.entries()).slice(-200); // Keep last 200
      localStorage.setItem(IMAGE_STORAGE_KEY, JSON.stringify(entries));
    } catch { /* localStorage full — fail silently */ }
  }
  
  async upload(file: File, options?: ImageUploadOptions): Promise<ServiceResult<ImageUploadResult>> {
    try {
      validateImageFile(file);
      
      let dataUrl = await readFileAsDataUrl(file);
      
      // Optionally resize/optimize if canvas is available
      if (options?.maxWidth || options?.maxHeight || options?.optimize) {
        dataUrl = await this.optimizeImage(dataUrl, options);
      }
      
      const publicId = `local-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      
      const result: ImageUploadResult = {
        url: dataUrl,
        publicId,
        size: file.size,
        format: file.type.split('/')[1],
      };
      
      // Get dimensions
      const dimensions = await this.getImageDimensions(dataUrl);
      result.width = dimensions.width;
      result.height = dimensions.height;
      
      this.images.set(publicId, result);
      this.persist();
      
      return { data: result, error: null, success: true };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to upload image',
        success: false,
      };
    }
  }
  
  async uploadFromUrl(url: string, options?: ImageUploadOptions): Promise<ServiceResult<ImageUploadResult>> {
    try {
      // If it's already a data URL, store it directly
      if (url.startsWith('data:')) {
        const publicId = `local-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
        const dimensions = await this.getImageDimensions(url);
        
        const result: ImageUploadResult = {
          url,
          publicId,
          width: dimensions.width,
          height: dimensions.height,
        };
        
        this.images.set(publicId, result);
        this.persist();
        return { data: result, error: null, success: true };
      }
      
      // For external URLs, fetch and convert to data URL
      const response = await fetch(url);
      const blob = await response.blob();
      const file = new File([blob], 'image', { type: blob.type });
      
      return this.upload(file, options);
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to upload from URL',
        success: false,
      };
    }
  }
  
  async delete(publicIdOrUrl: string): Promise<ServiceResult<void>> {
    this.images.delete(publicIdOrUrl);
    this.persist();
    return { data: null, error: null, success: true };
  }
  
  getTransformedUrl(url: string, options: ImageTransformOptions): string {
    // Local provider doesn't support transformations
    // In production, this would generate a CDN URL with query params
    return url;
  }
  
  async list(folder?: string): Promise<ServiceResult<ImageUploadResult[]>> {
    return {
      data: Array.from(this.images.values()),
      error: null,
      success: true,
    };
  }
  
  private async getImageDimensions(dataUrl: string): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve({ width: img.width, height: img.height });
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = dataUrl;
    });
  }
  
  private async optimizeImage(dataUrl: string, options: ImageUploadOptions): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        
        // Calculate new dimensions
        const maxW = options.maxWidth || 1920;
        const maxH = options.maxHeight || 1920;
        
        if (width > maxW || height > maxH) {
          const ratio = Math.min(maxW / width, maxH / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(dataUrl);
          return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        
        const format = options.format === 'webp' ? 'image/webp' : 
                       options.format === 'jpeg' ? 'image/jpeg' : 
                       options.format === 'png' ? 'image/png' : 'image/webp';
        const quality = options.quality ?? 0.85;
        
        resolve(canvas.toDataURL(format, quality));
      };
      img.onerror = () => reject(new Error('Failed to optimize image'));
      img.src = dataUrl;
    });
  }
}

// ══════════════════════════════════════════════════════════════════
// Supabase Storage Provider (Example)
// ══════════════════════════════════════════════════════════════════

/**
 * Example provider for Supabase Storage.
 * Uncomment and configure when integrating with backend.
 */
/*
export class SupabaseImageProvider implements IImageProvider {
  private supabase: SupabaseClient;
  private bucket: string;
  
  constructor(supabase: SupabaseClient, bucket = 'website-builder-images') {
    this.supabase = supabase;
    this.bucket = bucket;
  }
  
  async upload(file: File, options?: ImageUploadOptions): Promise<ServiceResult<ImageUploadResult>> {
    const folder = options?.folder || 'uploads';
    const fileName = `${folder}/${Date.now()}-${file.name}`;
    
    const { data, error } = await this.supabase.storage
      .from(this.bucket)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });
    
    if (error) {
      return { data: null, error: error.message, success: false };
    }
    
    const { data: { publicUrl } } = this.supabase.storage
      .from(this.bucket)
      .getPublicUrl(data.path);
    
    return {
      data: {
        url: publicUrl,
        publicId: data.path,
        size: file.size,
        format: file.type.split('/')[1],
      },
      error: null,
      success: true,
    };
  }
  
  // ... implement other methods
}
*/

// ══════════════════════════════════════════════════════════════════
// Provider Singleton
// ══════════════════════════════════════════════════════════════════

let currentProvider: IImageProvider = new LocalImageProvider();

export function getImageProvider(): IImageProvider {
  return currentProvider;
}

export function setImageProvider(provider: IImageProvider): void {
  currentProvider = provider;
}

// ══════════════════════════════════════════════════════════════════
// Convenience Service
// ══════════════════════════════════════════════════════════════════

export const imageService = {
  /**
   * Upload an image file
   */
  upload: (file: File, options?: ImageUploadOptions) => 
    currentProvider.upload(file, options),
  
  /**
   * Upload from URL or data URL
   */
  uploadFromUrl: (url: string, options?: ImageUploadOptions) => 
    currentProvider.uploadFromUrl(url, options),
  
  /**
   * Delete an image
   */
  delete: (publicIdOrUrl: string) => 
    currentProvider.delete(publicIdOrUrl),
  
  /**
   * Get transformed URL (for responsive images)
   */
  getTransformedUrl: (url: string, options: ImageTransformOptions) => 
    currentProvider.getTransformedUrl(url, options),
  
  /**
   * Generate srcset for responsive images
   */
  generateSrcSet: (url: string, widths: number[] = [320, 640, 960, 1280, 1920]): string => {
    if (!isImageSrc(url) || url.startsWith('data:')) {
      return ''; // Can't generate srcset for data URLs
    }
    
    return widths
      .map(w => `${currentProvider.getTransformedUrl(url, { width: w })} ${w}w`)
      .join(', ');
  },
  
  /**
   * List uploaded images
   */
  list: (folder?: string) => currentProvider.list(folder),
};

/**
 * API Image Provider
 *
 * Implements IImageProvider by uploading files to the .NET WBUpload controller
 * and serving them via /api/WBUpload/file/{id}.
 */
import type {
  IImageProvider,
  ImageUploadResult,
  ImageUploadOptions,
  ImageTransformOptions,
  ServiceResult,
} from './imageService';
import { wbApi, resolveMediaUrl, type WBUploadResponseDto, type WBMediaDto } from './apiClient';
import { API_CONFIG } from '@/config/api.config';
import { showApiError } from './apiErrorHandler';

function failWithToast<T>(error: string, context: { operation: string; entityType: 'image' | 'media' }): ServiceResult<T> {
  showApiError({ message: error }, context);
  return { data: null, error, success: false };
}

export class ApiImageProvider implements IImageProvider {
  async upload(file: File, options?: ImageUploadOptions): Promise<ServiceResult<ImageUploadResult>> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const params: Record<string, string> = {};
      if (options?.folder) params.folder = options.folder;

      const { data } = await wbApi.post<WBUploadResponseDto>('/api/WBUpload/file', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        params,
        timeout: 60000, // 60s for large uploads
      });

      if (!data.success || !data.media) {
        return failWithToast(data.error || 'Upload failed', { operation: 'upload', entityType: 'image' });
      }

      const media = data.media;
      return {
        data: {
          url: resolveMediaUrl(media.fileUrl),
          publicId: String(media.id),
          width: media.width ?? undefined,
          height: media.height ?? undefined,
          format: media.contentType?.split('/')[1],
          size: media.fileSize,
        },
        error: null,
        success: true,
      };
    } catch (err: any) {
      return failWithToast(err.message || 'Failed to upload image', { operation: 'upload', entityType: 'image' });
    }
  }

  async uploadFromUrl(url: string, options?: ImageUploadOptions): Promise<ServiceResult<ImageUploadResult>> {
    try {
      // If it's a data URL, convert to File and upload
      if (url.startsWith('data:')) {
        const response = await fetch(url);
        const blob = await response.blob();
        const file = new File([blob], 'image.png', { type: blob.type });
        return this.upload(file, options);
      }

      // For external URLs, fetch and re-upload
      const response = await fetch(url);
      const blob = await response.blob();
      const ext = blob.type.split('/')[1] || 'png';
      const file = new File([blob], `image.${ext}`, { type: blob.type });
      return this.upload(file, options);
    } catch (err: any) {
      return failWithToast(err.message || 'Failed to upload from URL', { operation: 'upload', entityType: 'image' });
    }
  }

  async delete(publicIdOrUrl: string): Promise<ServiceResult<void>> {
    try {
      // publicId is the media ID
      const mediaId = parseInt(publicIdOrUrl, 10);
      if (isNaN(mediaId)) {
        return failWithToast('Invalid media ID', { operation: 'delete', entityType: 'image' });
      }

      await wbApi.delete(`/api/WBUpload/${mediaId}`);
      return { data: null, error: null, success: true };
    } catch (err: any) {
      return failWithToast(err.message || 'Failed to delete image', { operation: 'delete', entityType: 'image' });
    }
  }

  getTransformedUrl(url: string, options: ImageTransformOptions): string {
    // Backend doesn't support on-the-fly transforms — return original URL
    return url;
  }

  async list(folder?: string): Promise<ServiceResult<ImageUploadResult[]>> {
    try {
      const params: Record<string, string> = {};
      if (folder) params.folder = folder;

      const { data } = await wbApi.get<WBMediaDto[]>('/api/WBMedia', { params });

      const results: ImageUploadResult[] = data.map(m => ({
        url: resolveMediaUrl(m.fileUrl),
        publicId: String(m.id),
        width: m.width ?? undefined,
        height: m.height ?? undefined,
        format: m.contentType?.split('/')[1],
        size: m.fileSize,
      }));

      return { data: results, error: null, success: true };
    } catch (err: any) {
      return failWithToast(err.message || 'Failed to list media', { operation: 'load', entityType: 'media' });
    }
  }
}

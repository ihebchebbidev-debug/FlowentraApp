// UploadThing Client Service - Frontend calls Backend which calls UploadThing API
// Flow: Frontend → Backend /api/uploadthing/prepare → UploadThing → S3 presigned URL → Upload
import { getCurrentTenant, TENANT_HEADER } from '@/utils/tenant';
import { API_URL } from '@/config/api';

export interface UploadResult {
  success: boolean;
  fileUrl: string;
  fileKey: string;
  fileName: string;
  fileSize: number;
  contentType: string;
  error?: string;
}

export interface UploadProgress {
  fileName: string;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

export const uploadThingClientService = {
  /**
   * Upload a file using UploadThing v6 via backend
   * Step 1: Call backend to get presigned URL from UploadThing
   * Step 2: Upload file directly to S3 using presigned URL
   */
  async uploadFile(file: File, onProgress?: (progress: number) => void): Promise<UploadResult> {
    try {
      onProgress?.(5);
      
      // Determine the correct content type - use file.type or infer from extension
      const contentType = file.type || this.getContentTypeFromFileName(file.name);
      console.log('Starting upload...', { fileName: file.name, size: file.size, type: contentType });

      // Step 1: Call YOUR backend to prepare the upload (backend calls UploadThing API)
      const token = localStorage.getItem('access_token');
      const tenant = getCurrentTenant();
      const prepareResponse = await fetch(`${API_URL}/api/uploadthing/prepare`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
          ...(tenant && { [TENANT_HEADER]: tenant }),
        },
        body: JSON.stringify({
          fileName: file.name,
          fileSize: file.size,
          // Use the actual file content type for the presigned URL
          fileType: contentType,
        }),
      });

      onProgress?.(20);

      if (!prepareResponse.ok) {
        const errorText = await prepareResponse.text();
        console.error('Backend prepare failed:', prepareResponse.status, errorText);
        throw new Error(`Backend error: ${prepareResponse.status} - ${errorText}`);
      }

      const prepareData = await prepareResponse.json();
      console.log('Backend prepare response:', prepareData);

      // Extract upload data from response (matches PrepareUploadResponse from backend)
      const presignedUrl = prepareData.presignedUrl || prepareData.url;
      const fileKey = prepareData.fileKey || prepareData.key;
      const fileUrl = prepareData.fileUrl || `https://utfs.io/f/${fileKey}`;
      const fields = prepareData.fields || {};

      if (!presignedUrl) {
        throw new Error('No presigned URL returned from backend');
      }

      onProgress?.(30);
      console.log('Got presigned URL, uploading to S3...', { presignedUrl: presignedUrl.substring(0, 60) + '...' });

      // Step 2: Upload file directly to S3 using presigned URL
      let uploadResponse: Response;

      if (Object.keys(fields).length > 0) {
        // S3-style multipart form upload (with fields)
        const formData = new FormData();
        Object.entries(fields).forEach(([key, value]) => {
          formData.append(key, value as string);
        });
        formData.append('file', file);

        uploadResponse = await fetch(presignedUrl, {
          method: 'POST',
          body: formData,
        });
      } else {
        // UploadThing can return an ingest URL. In practice we've seen some ingest deployments
        // reject PUT uploads with a 415 (Fastify unsupported media type). To make this robust,
        // try PUT first, then fall back to multipart/form-data POST.
        uploadResponse = await fetch(presignedUrl, {
          method: 'PUT',
          body: file,
          headers: {
            'Content-Type': contentType,
          },
        });

        if (!uploadResponse.ok && uploadResponse.status === 415) {
          console.warn('PUT upload rejected (415). Retrying as multipart/form-data POST...');
          const formData = new FormData();
          formData.append('file', file, file.name);
          uploadResponse = await fetch(presignedUrl, {
            method: 'POST',
            body: formData,
          });
        }
      }

      onProgress?.(90);

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error('S3 upload failed:', uploadResponse.status, errorText);
        throw new Error(`S3 upload failed: ${uploadResponse.status}`);
      }

      onProgress?.(100);
      console.log('Upload successful!', { fileKey, fileUrl });

      return {
        success: true,
        fileUrl,
        fileKey,
        fileName: file.name,
        fileSize: file.size,
        contentType: file.type || 'application/octet-stream',
      };
    } catch (error) {
      console.error('Upload error:', error);
      return {
        success: false,
        fileUrl: '',
        fileKey: '',
        fileName: file.name,
        fileSize: file.size,
        contentType: file.type || 'application/octet-stream',
        error: error instanceof Error ? error.message : 'Upload failed',
      };
    }
  },

  async uploadFiles(files: File[], onProgress?: (fileName: string, progress: number) => void): Promise<UploadResult[]> {
    const results: UploadResult[] = [];
    for (const file of files) {
      results.push(await this.uploadFile(file, (p) => onProgress?.(file.name, p)));
    }
    return results;
  },

  async deleteFile(fileKey: string): Promise<boolean> {
    try {
      const token = localStorage.getItem('access_token');
      const tenant = getCurrentTenant();
      const response = await fetch(`${API_URL}/api/uploadthing/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
          ...(tenant && { [TENANT_HEADER]: tenant }),
        },
        body: JSON.stringify({ fileKeys: [fileKey] }),
      });
      return response.ok;
    } catch {
      return false;
    }
  },

  getFileUrl(fileKey: string): string {
    return `https://utfs.io/f/${fileKey}`;
  },

  /**
   * Get content type from file name extension
   */
  getContentTypeFromFileName(fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase();
    const mimeTypes: Record<string, string> = {
      // Images
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'svg': 'image/svg+xml',
      'bmp': 'image/bmp',
      'ico': 'image/x-icon',
      // Documents
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'xls': 'application/vnd.ms-excel',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'ppt': 'application/vnd.ms-powerpoint',
      'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      // Text
      'txt': 'text/plain',
      'csv': 'text/csv',
      'json': 'application/json',
      'xml': 'application/xml',
      // Archives
      'zip': 'application/zip',
      'rar': 'application/x-rar-compressed',
      // Audio/Video
      'mp3': 'audio/mpeg',
      'mp4': 'video/mp4',
      'wav': 'audio/wav',
      'avi': 'video/x-msvideo',
    };
    return mimeTypes[ext || ''] || 'application/octet-stream';
  },
};

export default uploadThingClientService;

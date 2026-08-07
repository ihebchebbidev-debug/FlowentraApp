// UploadThing Service - Uploads files via backend to UploadThing
import { getMutationHeadersNoContentType } from '@/utils/apiHeaders';

import { API_URL } from '@/config/api';

export interface UploadResponse {
  success: boolean;
  fileUrl: string;
  fileKey: string;
  fileName: string;
  fileSize: number;
  contentType: string;
  error?: string;
}

export const uploadThingService = {
  /**
   * Upload a single file to UploadThing via backend
   */
  async uploadFile(file: File): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_URL}/api/Upload/file`, {
      method: 'POST',
      headers: getMutationHeadersNoContentType(),
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(errorData.error || 'Failed to upload file');
    }

    return response.json();
  },

  /**
   * Upload multiple files to UploadThing via backend
   */
  async uploadFiles(files: File[]): Promise<UploadResponse[]> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });

    const response = await fetch(`${API_URL}/api/Upload/files`, {
      method: 'POST',
      headers: getMutationHeadersNoContentType(),
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(errorData.error || 'Failed to upload files');
    }

    return response.json();
  },

  /**
   * Delete a file from UploadThing via backend
   */
  async deleteFile(fileKey: string): Promise<boolean> {
    const token = localStorage.getItem('access_token');
    const response = await fetch(`${API_URL}/api/Upload/${fileKey}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    return response.ok;
  },
};

export default uploadThingService;

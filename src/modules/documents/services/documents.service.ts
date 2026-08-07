import { Document, DocumentFilters, DocumentStats, DocumentUploadData } from '../types';
import { getAuthHeaders, getAuthHeadersNoContentType, getAuthToken , getMutationHeaders, getMutationHeadersNoContentType} from '@/utils/apiHeaders';

import { API_URL } from '@/config/api';
import {
  isOfflineNoCache503,
  parseOfflineNoCacheBody,
  throwIfNotOkAfterOfflineCheck,
} from '@/services/offline/offlineHttpRead';

const EMPTY_DOCUMENT_STATS: DocumentStats = {
  totalFiles: 0,
  totalSize: 0,
  crmFiles: 0,
  fieldFiles: 0,
  byModule: { contacts: 0, sales: 0, offers: 0, services: 0, projects: 0, field: 0, deals: 0 },
  recentActivity: 0,
};

const getAuthHeadersRaw = getAuthHeadersNoContentType;

export interface UploadProgressInfo {
  loaded: number;
  total: number;
  percent: number;
  fileName?: string;
}

export class DocumentsService {
  /**
   * Fetch documents from backend with optional filters
   */
  static async getDocuments(filters?: DocumentFilters): Promise<Document[]> {
    const params = new URLSearchParams();

    if (filters?.search) params.append('search', filters.search);
    if (filters?.moduleType) params.append('moduleType', filters.moduleType);
    if (filters?.fileType) params.append('fileType', filters.fileType);
    if (filters?.category) params.append('category', filters.category);
    if (filters?.uploadedBy) params.append('uploadedBy', filters.uploadedBy);

    const queryString = params.toString();
    const url = `${API_URL}/api/Documents${queryString ? `?${queryString}` : ''}`;
    const response = await fetch(url, { headers: getAuthHeaders() });

    const offline = await parseOfflineNoCacheBody(response);
    if (isOfflineNoCache503(offline)) {
      return [];
    }

    await throwIfNotOkAfterOfflineCheck(response, offline, 'Failed to fetch documents');

    const result = await response.json();
    const data = result.data || result || [];

    return Array.isArray(data)
      ? data.map((d: any) => DocumentsService.mapApiDocument(d))
      : [];
  }

  /**
   * Get document statistics
   */
  static async getDocumentStats(): Promise<DocumentStats> {
    const response = await fetch(`${API_URL}/api/Documents/stats`, {
      headers: getAuthHeaders(),
    });

    const offline = await parseOfflineNoCacheBody(response);
    if (isOfflineNoCache503(offline)) {
      return { ...EMPTY_DOCUMENT_STATS };
    }

    await throwIfNotOkAfterOfflineCheck(response, offline, 'Failed to fetch stats');

    return response.json();
  }

  /**
   * Get a single document by ID
   */
  static async getDocumentById(id: string): Promise<Document | null> {
    const response = await fetch(`${API_URL}/api/Documents/${id}`, {
      headers: getAuthHeaders(),
    });

    const offline = await parseOfflineNoCacheBody(response);
    if (isOfflineNoCache503(offline)) {
      return null;
    }

    if (!response.ok) return null;

    const data = await response.json();
    return DocumentsService.mapApiDocument(data);
  }

  /**
   * Upload documents with real XHR progress tracking.
   * Falls back to fetch if XMLHttpRequest is unavailable.
   */
  static async uploadDocuments(
    data: DocumentUploadData,
    onProgress?: (info: UploadProgressInfo) => void,
  ): Promise<Document[]> {
    const formData = new FormData();

    data.files.forEach((file) => {
      formData.append('files', file);
    });

    formData.append('moduleType', data.moduleType || 'offers');
    if (data.moduleId) formData.append('moduleId', data.moduleId);
    if (data.moduleName) formData.append('moduleName', data.moduleName);
    formData.append('category', data.category || 'crm');
    if (data.description) formData.append('description', data.description);
    if (data.tags && data.tags.length > 0) formData.append('tags', data.tags.join(','));
    formData.append('isPublic', String(data.isPublic || false));

    // Use XMLHttpRequest for real progress events
    const result = await new Promise<any>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${API_URL}/api/Documents/upload`);

      // Auth + tenant headers. Never set Content-Type for FormData; the browser
      // must add the multipart boundary. Include mutation target-tenant headers
      // so uploads behave the same as the rest of the app.
      const headers = getMutationHeadersNoContentType();
      Object.entries(headers).forEach(([k, v]) => {
        if (v) xhr.setRequestHeader(k, String(v));
      });

      // Progress
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable && onProgress) {
          onProgress({
            loaded: e.loaded,
            total: e.total,
            percent: Math.round((e.loaded / e.total) * 100),
          });
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            resolve(JSON.parse(xhr.responseText));
          } catch {
            resolve({ documents: [] });
          }
        } else {
          let errorMsg = 'Upload failed';
          try {
            const errBody = JSON.parse(xhr.responseText);
            errorMsg = errBody.error || errorMsg;
          } catch { /* ignore */ }
          reject(new Error(errorMsg));
        }
      });

      xhr.addEventListener('error', () => reject(new Error('Network error during upload')));
      xhr.addEventListener('abort', () => reject(new Error('Upload aborted')));

      xhr.send(formData);
    });

    const docs = result.documents || result.data || [];
    return Array.isArray(docs) ? docs.map((d: any) => DocumentsService.mapApiDocument(d)) : [];
  }

  /**
   * Create a document record that may reference an external link or an existing file resource.
   * If you need to upload file content, use `uploadDocuments` instead.
   */
  static async createDocument(payload: any): Promise<Document> {
    const response = await fetch(`${API_URL}/api/Documents`, {
      method: 'POST',
      headers: getMutationHeaders(),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error('Failed to create document');
    }

    const data = await response.json();
    const doc = data.data || data || data.document || data.documents?.[0];
    return DocumentsService.mapApiDocument(doc);
  }

  /**
   * Quick upload — fires files directly as "general" documents, returns results.
   * Used by the page-level drag-and-drop.
   */
  static async quickUpload(
    files: File[],
    onProgress?: (info: UploadProgressInfo) => void,
  ): Promise<Document[]> {
    return DocumentsService.uploadDocuments(
      {
        files,
        moduleType: 'general',
        category: 'crm',
      },
      onProgress,
    );
  }

  /**
   * Delete a document
   */
  static async deleteDocument(id: string): Promise<void> {
    const response = await fetch(`${API_URL}/api/Documents/${id}`, {
      method: 'DELETE',
      headers: getMutationHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to delete document');
    }
  }

  /**
   * Bulk delete documents by IDs
   */
  static async bulkDeleteDocuments(ids: string[]): Promise<void> {
    const response = await fetch(`${API_URL}/api/Documents/bulk-delete`, {
      method: 'POST',
      headers: getMutationHeaders(),
      body: JSON.stringify({ ids }),
    });

    if (!response.ok) {
      throw new Error('Failed to delete documents');
    }
  }

  /**
   * Download a document
   */
  static async downloadDocument(doc: Document): Promise<void> {
    const response = await fetch(`${API_URL}/api/Documents/download/${doc.id}`, {
      headers: getAuthHeadersRaw(),
    });

    if (!response.ok) {
      throw new Error('Failed to download document');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = doc.originalName || doc.fileName;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }

  /**
   * Check if a document can be previewed in the browser
   */
  static canPreview(doc: Document): boolean {
    const imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'];
    const documentTypes = ['pdf'];
    const textTypes = ['txt', 'csv', 'json', 'xml', 'md', 'log', 'html', 'css', 'js', 'ts'];
    
    return imageTypes.includes(doc.fileType) || 
           documentTypes.includes(doc.fileType) || 
           textTypes.includes(doc.fileType);
  }

  /**
   * Get the preview type category for a document
   */
  static getPreviewType(doc: Document): 'image' | 'pdf' | 'text' | 'unsupported' {
    const imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'];
    const textTypes = ['txt', 'csv', 'json', 'xml', 'md', 'log', 'html', 'css', 'js', 'ts', 'tsx', 'jsx'];
    
    if (imageTypes.includes(doc.fileType)) return 'image';
    if (doc.fileType === 'pdf') return 'pdf';
    if (textTypes.includes(doc.fileType)) return 'text';
    return 'unsupported';
  }

  /**
   * Get preview URL for a document (requires auth header)
   */
  static getPreviewUrl(doc: Document): string | null {
    if (!DocumentsService.canPreview(doc)) return null;
    return `${API_URL}/api/Documents/download/${doc.id}`;
  }

  /**
   * Fetch document content as blob with auth headers (for preview)
   */
  static async fetchDocumentBlob(doc: Document): Promise<Blob> {
    const response = await fetch(`${API_URL}/api/Documents/download/${doc.id}`, {
      headers: getAuthHeadersRaw(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch document');
    }

    return response.blob();
  }

  /**
   * Fetch document content as text (for text file preview)
   */
  static async fetchDocumentText(doc: Document): Promise<string> {
    const response = await fetch(`${API_URL}/api/Documents/download/${doc.id}`, {
      headers: getAuthHeadersRaw(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch document');
    }

    return response.text();
  }

  /**
   * Get a blob URL for preview (handles auth)
   */
  static async getPreviewBlobUrl(doc: Document): Promise<string> {
    const blob = await DocumentsService.fetchDocumentBlob(doc);
    return URL.createObjectURL(blob);
  }

  /**
   * Format file size for display
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Map API response to frontend Document type
   */
  private static mapApiDocument(d: any): Document {
    const fileName = d.fileName || d.FileName || '';
    const ext = fileName.split('.').pop()?.toLowerCase() || 'unknown';

    return {
      id: String(d.id || d.Id),
      fileName,
      originalName: d.originalName || d.OriginalName || fileName,
      fileType: ext,
      fileSize: d.fileSize || d.FileSize || 0,
      filePath: d.filePath || d.FilePath || '',
      mimeType: d.contentType || d.ContentType || 'application/octet-stream',
      moduleType: (d.moduleType || d.ModuleType || 'general') as any,
      moduleId: d.moduleId || d.ModuleId || undefined,
      moduleName: d.moduleName || d.ModuleName || '',
      uploadedBy: d.uploadedBy || d.UploadedBy || '',
      uploadedByName: d.uploadedByName || d.UploadedByName || 'Unknown',
      uploadedAt: new Date(d.uploadedAt || d.UploadedAt),
      updatedAt: new Date(d.updatedAt || d.UpdatedAt || d.uploadedAt || d.UploadedAt),
      description: d.description || d.Description || '',
      tags: d.tags
        ? typeof d.tags === 'string'
          ? d.tags.split(',').map((t: string) => t.trim()).filter(Boolean)
          : d.tags
        : [],
      isPublic: d.isPublic ?? d.IsPublic ?? false,
      category: (d.category || d.Category || 'crm') as 'crm' | 'field',
      comments: [],
      shareLinks: [],
      // Optional external link or file resource reference
      externalUrl: d.externalUrl || d.url || d.link || d.ExternalUrl || ((d.filePath || '').toString().startsWith('http') ? d.filePath : undefined),
      fileResourceId: d.fileResourceId || d.fileResource || d.FileResourceId || undefined,
      storedInDb: (d.storedInDb ?? d.StoredInDb) ?? (!!d.filePath && !(d.filePath || '').toString().startsWith('http')),
      resourceType: (d.externalUrl || d.url || d.link || ((d.filePath || '').toString().startsWith('http'))) ? 'link' : 'file',
    };
  }
}

// Task Attachments Service - Integrated with backend API via UploadThing

import { uploadThingService } from '@/services/uploadThingService';
import { getAuthHeaders , getMutationHeaders, getMutationHeadersNoContentType} from '@/utils/apiHeaders';

import { API_URL } from '@/config/api';

export interface TaskAttachment {
  id: string;
  taskId: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  uploadedBy: string;
  uploadedAt: Date;
  fileKey?: string;
}

const getAttachmentsKey = (taskId: string) => `task-attachments-${taskId}`;

export const TaskAttachmentsService = {
  async getAttachments(taskId: string): Promise<TaskAttachment[]> {
    try {
      const response = await fetch(`${API_URL}/api/TaskAttachments/project-task/${taskId}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });
      
      if (response.ok) {
        const data = await response.json();
        const attachments = data.attachments || data.data || data || [];
        return attachments.map((a: any) => ({
          id: String(a.id),
          taskId: String(a.taskId),
          fileName: a.fileName,
          fileUrl: a.filePath || a.fileUrl,
          fileSize: a.fileSize,
          mimeType: a.contentType || a.mimeType,
          uploadedBy: a.uploadedBy,
          uploadedAt: new Date(a.uploadedDate || a.uploadedAt),
        }));
      }
    } catch (error) {
      console.error('Error fetching attachments:', error);
    }
    
    // Fallback to local storage
    const stored = localStorage.getItem(getAttachmentsKey(taskId));
    if (stored) {
      try {
        return JSON.parse(stored).map((a: any) => ({
          ...a,
          uploadedAt: new Date(a.uploadedAt),
        }));
      } catch {
        return [];
      }
    }
    return [];
  },

  /**
   * Upload attachment using UploadThing via backend, then save metadata to database
   */
  async addAttachment(taskId: string, file: File, uploadedBy: string): Promise<TaskAttachment> {
    try {
      // Step 1: Upload file to UploadThing via backend
      const uploadResult = await uploadThingService.uploadFile(file);
      
      if (!uploadResult.success) {
        throw new Error(uploadResult.error || 'Upload failed');
      }

      // Step 2: Save attachment metadata to backend database
      const attachmentData = {
        taskId: parseInt(taskId, 10),
        fileName: uploadResult.fileName,
        filePath: uploadResult.fileUrl,
        fileSize: uploadResult.fileSize,
        contentType: uploadResult.contentType,
        uploadedBy,
      };

      const response = await fetch(`${API_URL}/api/TaskAttachments`, {
        method: 'POST',
        headers: getMutationHeaders(),
        body: JSON.stringify(attachmentData),
      });

      if (response.ok) {
        const data = await response.json();
        return {
          id: String(data.id),
          taskId: String(data.taskId),
          fileName: data.fileName,
          fileUrl: data.filePath || uploadResult.fileUrl,
          fileSize: data.fileSize,
          mimeType: data.contentType,
          uploadedBy: data.uploadedBy,
          uploadedAt: new Date(data.uploadedDate),
          fileKey: uploadResult.fileKey,
        };
      }

      // If backend save fails, still return the uploaded file info
      return {
        id: `temp-${Date.now()}`,
        taskId,
        fileName: uploadResult.fileName,
        fileUrl: uploadResult.fileUrl,
        fileSize: uploadResult.fileSize,
        mimeType: uploadResult.contentType,
        uploadedBy,
        uploadedAt: new Date(),
        fileKey: uploadResult.fileKey,
      };
    } catch (error) {
      console.error('Error uploading attachment:', error);
      
      // Fallback to local storage with blob URL
      const newAttachment: TaskAttachment = {
        id: `attachment-${Date.now()}`,
        taskId,
        fileName: file.name,
        fileUrl: URL.createObjectURL(file),
        fileSize: file.size,
        mimeType: file.type,
        uploadedBy,
        uploadedAt: new Date(),
      };

      const attachments = await this.getAttachments(taskId);
      attachments.push(newAttachment);
      localStorage.setItem(getAttachmentsKey(taskId), JSON.stringify(attachments));
      return newAttachment;
    }
  },

  async deleteAttachment(taskId: string, attachmentId: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_URL}/api/TaskAttachments/${attachmentId}`, {
        method: 'DELETE',
        headers: getMutationHeaders(),
      });
      
      if (response.ok) return true;
    } catch (error) {
      // Backend endpoint may not be available
    }

    // Fallback to local storage
    const attachments = await this.getAttachments(taskId);
    const filtered = attachments.filter(a => a.id !== attachmentId);
    localStorage.setItem(getAttachmentsKey(taskId), JSON.stringify(filtered));
    return true;
  },
};

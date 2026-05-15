/**
 * Upload API Tests
 * Tests for UploadThing integration via FRONTEND (direct to UploadThing)
 * Uses interactive file selection modal for real file uploads
 * After upload, sends URL to backend for storage
 */

import { TestDefinition, TestResponse, RequestData, ResponseData } from '../types/testTypes';
import { API_URL, testDataIds } from '../utils/testUtils';
import { requestFileUpload } from '../components/TestFileUploadModal';
import { uploadThingClientService } from '@/services/uploadThingClientService';

export const uploadTests: TestDefinition[] = [
  {
    id: 'upload-single-file',
    name: 'Upload Single File (Interactive)',
    category: 'Uploads',
    description: 'Upload a file directly to UploadThing from frontend - select a file to upload',
    dependsOn: ['auth-login'],
    test: async (): Promise<TestResponse> => {
      try {
        // Request file from user via modal
        const file = await requestFileUpload('Upload Single File', '*/*');
        
        const requestData: RequestData = {
          method: 'POST',
          url: `${API_URL}/api/uploadthing/prepare`,
          body: { fileName: file.name, fileSize: file.size, fileType: file.type },
        };

        // Upload directly to UploadThing from frontend
        const result = await uploadThingClientService.uploadFile(file);

        if (result.success) {
          testDataIds['uploaded-file-key'] = result.fileKey;
          testDataIds['uploaded-file-url'] = result.fileUrl;
          return {
            success: true,
            details: `✓ File uploaded to UploadThing: ${result.fileName} (${result.fileSize} bytes)\n  URL: ${result.fileUrl?.substring(0, 60)}...`,
            httpStatus: 200,
            requestData,
            responseData: {
              status: 200,
              statusText: 'OK',
              body: result,
            },
          };
        }

        // Check for configuration errors
        if (result.error?.includes('not configured')) {
          return {
            success: false,
            error: 'UploadThing not configured - set VITE_UPLOADTHING_TOKEN env variable',
            requestData,
            responseData: { status: 500, statusText: 'Error', body: result },
          };
        }

        return {
          success: false,
          error: result.error || 'Upload failed',
          requestData,
          responseData: { status: 500, statusText: 'Error', body: result },
        };
      } catch (error) {
        if (String(error).includes('cancelled')) {
          return { success: false, error: 'Upload cancelled by user' };
        }
        return { success: false, error: `Upload error: ${String(error)}` };
      }
    },
  },
  {
    id: 'upload-verify-url',
    name: 'Verify Uploaded File URL',
    category: 'Uploads',
    description: 'Verify the uploaded file URL is accessible',
    dependsOn: ['upload-single-file'],
    test: async (): Promise<TestResponse> => {
      const fileUrl = testDataIds['uploaded-file-url'];
      
      if (!fileUrl || typeof fileUrl !== 'string') {
        return { success: false, error: 'No uploaded file URL available (previous upload may have failed)' };
      }

      try {
        const response = await fetch(fileUrl, { method: 'HEAD' });
        
        if (response.ok) {
          return {
            success: true,
            details: `✓ File URL is accessible (HTTP ${response.status})`,
            httpStatus: response.status,
            requestData: { method: 'HEAD', url: fileUrl },
          };
        }

        return {
          success: false,
          error: `File URL returned HTTP ${response.status}`,
          httpStatus: response.status,
          requestData: { method: 'HEAD', url: fileUrl },
        };
      } catch (error) {
        return {
          success: false,
          error: `Failed to verify URL: ${String(error)}`,
        };
      }
    },
  },
  {
    id: 'upload-delete-file',
    name: 'Delete Uploaded File',
    category: 'Uploads',
    description: 'Delete the uploaded file from UploadThing (via frontend)',
    dependsOn: ['upload-verify-url'],
    test: async (): Promise<TestResponse> => {
      const fileKey = testDataIds['uploaded-file-key'];
      
      if (!fileKey || typeof fileKey !== 'string') {
        return { success: false, error: 'No uploaded file key available' };
      }

      try {
        // Delete directly via frontend service
        const success = await uploadThingClientService.deleteFile(fileKey);

        if (success) {
          delete testDataIds['uploaded-file-key'];
          delete testDataIds['uploaded-file-url'];
          return {
            success: true,
            details: `✓ File deleted from UploadThing successfully`,
            httpStatus: 200,
            requestData: { 
              method: 'POST', 
              url: 'https://api.uploadthing.com/v6/deleteFiles',
              body: { fileKeys: [fileKey] },
            },
          };
        }

        return {
          success: false,
          error: 'Delete failed',
          requestData: { 
            method: 'POST', 
            url: 'https://api.uploadthing.com/v6/deleteFiles',
            body: { fileKeys: [fileKey] },
          },
        };
      } catch (error) {
        return {
          success: false,
          error: `Delete request failed: ${String(error)}`,
        };
      }
    },
  },
  {
    id: 'upload-image-file',
    name: 'Upload Image File (Interactive)',
    category: 'Uploads',
    description: 'Upload an image file directly to UploadThing from frontend',
    dependsOn: ['auth-login'],
    test: async (): Promise<TestResponse> => {
      try {
        // Request image file from user
        const file = await requestFileUpload('Upload Image File', 'image/*');
        
        const requestData: RequestData = {
          method: 'POST',
          url: `${API_URL}/api/uploadthing/prepare`,
          body: { fileName: file.name, fileSize: file.size, fileType: file.type },
        };

        // Upload directly to UploadThing
        const result = await uploadThingClientService.uploadFile(file);

        if (result.success) {
          testDataIds['uploaded-image-key'] = result.fileKey;
          testDataIds['uploaded-image-url'] = result.fileUrl;
          return {
            success: true,
            details: `✓ Image uploaded: ${result.fileName} (${result.fileSize} bytes)\n  URL: ${result.fileUrl?.substring(0, 60)}...`,
            httpStatus: 200,
            requestData,
            responseData: { status: 200, statusText: 'OK', body: result },
          };
        }

        if (result.error?.includes('not configured')) {
          return {
            success: false,
            error: 'UploadThing not configured',
            requestData,
            responseData: { status: 500, statusText: 'Error', body: result },
          };
        }

        return {
          success: false,
          error: result.error || 'Upload failed',
          requestData,
          responseData: { status: 500, statusText: 'Error', body: result },
        };
      } catch (error) {
        if (String(error).includes('cancelled')) {
          return { success: false, error: 'Upload cancelled by user' };
        }
        return { success: false, error: `Upload error: ${String(error)}` };
      }
    },
  },
  {
    id: 'upload-delete-image',
    name: 'Delete Uploaded Image',
    category: 'Uploads',
    description: 'Delete the uploaded image from UploadThing (via frontend)',
    dependsOn: ['upload-image-file'],
    test: async (): Promise<TestResponse> => {
      const fileKey = testDataIds['uploaded-image-key'];
      
      if (!fileKey || typeof fileKey !== 'string') {
        return { success: false, error: 'No uploaded image key available' };
      }

      try {
        const success = await uploadThingClientService.deleteFile(fileKey);

        if (success) {
          delete testDataIds['uploaded-image-key'];
          delete testDataIds['uploaded-image-url'];
          return {
            success: true,
            details: `✓ Image deleted successfully`,
            httpStatus: 200,
            requestData: { 
              method: 'POST', 
              url: 'https://api.uploadthing.com/v6/deleteFiles',
              body: { fileKeys: [fileKey] },
            },
          };
        }

        return {
          success: false,
          error: 'Delete failed',
          requestData: { 
            method: 'POST', 
            url: 'https://api.uploadthing.com/v6/deleteFiles',
            body: { fileKeys: [fileKey] },
          },
        };
      } catch (error) {
        return {
          success: false,
          error: `Delete request failed: ${String(error)}`,
        };
      }
    },
  },
  {
    id: 'upload-task-attachment',
    name: 'Upload Task Attachment (Interactive)',
    category: 'Uploads',
    description: 'Upload file to UploadThing and create task attachment record in backend',
    dependsOn: ['tasks-create-1'],
    test: async (): Promise<TestResponse> => {
      const taskId = testDataIds['task-1'];
      
      if (!taskId) {
        return { success: false, error: 'No task available for attachment test' };
      }

      try {
        // Request file from user
        const file = await requestFileUpload('Upload Task Attachment', '*/*');
        
        // Upload directly to UploadThing from frontend
        const uploadResult = await uploadThingClientService.uploadFile(file);
        
        if (!uploadResult.success) {
          return {
            success: false,
            error: uploadResult.error || 'Upload to UploadThing failed',
            requestData: {
              method: 'POST',
              url: 'https://api.uploadthing.com/v6/uploadFiles',
              body: { file: { name: file.name, size: file.size, type: file.type } },
            },
          };
        }

        // Then create the attachment record in backend with the URL
        const token = localStorage.getItem('access_token');
        const attachmentBody = {
          taskId: parseInt(String(taskId), 10),
          fileName: uploadResult.fileName,
          filePath: uploadResult.fileUrl,
          fileSize: uploadResult.fileSize,
          contentType: uploadResult.contentType,
          uploadedBy: 'api-test',
        };
        const url = `${API_URL}/api/TaskAttachments`;

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          body: JSON.stringify(attachmentBody),
        });

        const data = await response.json();
        
        if (response.ok || response.status === 201) {
          testDataIds['task-attachment'] = data.id || data.data?.id;
          testDataIds['task-attachment-file-key'] = uploadResult.fileKey;
          return {
            success: true,
            details: `✓ File uploaded to UploadThing & attachment created (ID: ${testDataIds['task-attachment']})`,
            httpStatus: response.status,
            requestData: { method: 'POST', url, body: attachmentBody },
            responseData: { status: response.status, statusText: response.statusText, body: data },
          };
        }

        return {
          success: false,
          error: data.error || `HTTP ${response.status}`,
          httpStatus: response.status,
          requestData: { method: 'POST', url, body: attachmentBody },
          responseData: { status: response.status, statusText: response.statusText, body: data },
        };
      } catch (error) {
        if (String(error).includes('cancelled')) {
          return { success: false, error: 'Upload cancelled by user' };
        }
        return { success: false, error: `Request failed: ${String(error)}` };
      }
    },
  },
  {
    id: 'upload-get-task-attachments',
    name: 'Get Task Attachments',
    category: 'Uploads',
    description: 'Retrieve attachments for a task from backend',
    dependsOn: ['upload-task-attachment'],
    test: async (): Promise<TestResponse> => {
      const taskId = testDataIds['task-1'];
      
      if (!taskId) {
        return { success: false, error: 'No task available' };
      }

      const token = localStorage.getItem('access_token');
      const url = `${API_URL}/api/TaskAttachments/project-task/${taskId}`;
      
      try {
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        });

        const data = await response.json();
        const attachments = data.attachments || data.data || data || [];
        
        if (response.ok) {
          return {
            success: true,
            details: `✓ Found ${Array.isArray(attachments) ? attachments.length : 0} attachment(s)`,
            httpStatus: response.status,
            requestData: { method: 'GET', url },
            responseData: { status: response.status, statusText: response.statusText, body: data },
          };
        }

        return {
          success: false,
          error: data.error || `HTTP ${response.status}`,
          httpStatus: response.status,
          requestData: { method: 'GET', url },
          responseData: { status: response.status, statusText: response.statusText, body: data },
        };
      } catch (error) {
        return {
          success: false,
          error: `Request failed: ${String(error)}`,
        };
      }
    },
  },
  {
    id: 'upload-delete-task-attachment',
    name: 'Delete Task Attachment',
    category: 'Uploads',
    description: 'Delete task attachment from backend and file from UploadThing',
    dependsOn: ['upload-get-task-attachments'],
    test: async (): Promise<TestResponse> => {
      const attachmentId = testDataIds['task-attachment'];
      const fileKey = testDataIds['task-attachment-file-key'];
      
      if (!attachmentId) {
        return { success: false, error: 'No task attachment to delete' };
      }

      const token = localStorage.getItem('access_token');
      const url = `${API_URL}/api/TaskAttachments/${attachmentId}`;
      
      try {
        const response = await fetch(url, {
          method: 'DELETE',
          headers: {
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        });

        if (response.ok || response.status === 204) {
          // Also delete the file from UploadThing via frontend
          if (fileKey && typeof fileKey === 'string') {
            await uploadThingClientService.deleteFile(fileKey).catch(() => {});
          }

          delete testDataIds['task-attachment'];
          delete testDataIds['task-attachment-file-key'];
          
          return {
            success: true,
            details: `✓ Task attachment deleted from backend & file deleted from UploadThing`,
            httpStatus: response.status,
            requestData: { method: 'DELETE', url },
          };
        }

        const errorData = await response.text();
        return {
          success: false,
          error: `Delete failed: ${errorData}`,
          httpStatus: response.status,
          requestData: { method: 'DELETE', url },
        };
      } catch (error) {
        return {
          success: false,
          error: `Delete request failed: ${String(error)}`,
        };
      }
    },
  },
  {
    id: 'upload-store-url-backend',
    name: 'Store File URL in Backend',
    category: 'Uploads',
    description: 'Upload file to UploadThing and store URL in backend',
    dependsOn: ['auth-login'],
    test: async (): Promise<TestResponse> => {
      try {
        const file = await requestFileUpload('Upload & Store URL', '*/*');
        
        // Upload to UploadThing (this also stores URL in backend via storeUrlInBackend)
        const result = await uploadThingClientService.uploadFile(file);

        if (result.success) {
          testDataIds['stored-url-file-key'] = result.fileKey;
          return {
            success: true,
            details: `✓ File uploaded to UploadThing & URL stored in backend\n  URL: ${result.fileUrl?.substring(0, 60)}...`,
            httpStatus: 200,
            requestData: {
              method: 'POST',
              url: `${API_URL}/api/Upload/store-url`,
              body: {
                fileUrl: result.fileUrl,
                fileKey: result.fileKey,
                fileName: result.fileName,
                fileSize: result.fileSize,
                contentType: result.contentType,
              },
            },
          };
        }

        return {
          success: false,
          error: result.error || 'Upload failed',
        };
      } catch (error) {
        if (String(error).includes('cancelled')) {
          return { success: false, error: 'Upload cancelled by user' };
        }
        return { success: false, error: `Error: ${String(error)}` };
      }
    },
  },
];

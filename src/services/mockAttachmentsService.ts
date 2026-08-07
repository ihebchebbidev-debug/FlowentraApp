// Mock Attachments Service - Static data only
export interface BackendTaskAttachmentResponse {
  id: number;
  projectTaskId?: number;
  dailyTaskId?: number;
  taskTitle: string;
  fileName: string;
  originalFileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  uploaderId: number;
  uploaderName: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskAttachmentRequest {
  projectTaskId?: number;
  dailyTaskId?: number;
  fileName: string;
  originalFileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  uploaderId: number;
  uploaderName: string;
}

export interface UpdateTaskAttachmentRequest {
  fileName?: string;
  originalFileName?: string;
}

export interface AttachmentSearchRequest {
  searchTerm?: string;
  mimeType?: string;
  projectTaskId?: number;
  dailyTaskId?: number;
  uploaderId?: number;
  fromDate?: string;
  toDate?: string;
  pageNumber?: number;
  pageSize?: number;
  sortBy?: string;
  sortDirection?: string;
}

// Mock data storage
let mockAttachments: BackendTaskAttachmentResponse[] = [];

export class TaskAttachmentsService {
  static async getTaskAttachments(projectTaskId?: number, dailyTaskId?: number): Promise<BackendTaskAttachmentResponse[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockAttachments.filter(attachment => 
      (projectTaskId && attachment.projectTaskId === projectTaskId) ||
      (dailyTaskId && attachment.dailyTaskId === dailyTaskId)
    );
  }

  static async getTaskAttachmentById(id: number): Promise<BackendTaskAttachmentResponse> {
    await new Promise(resolve => setTimeout(resolve, 200));
    const attachment = mockAttachments.find(a => a.id === id);
    if (!attachment) throw new Error('Attachment not found');
    return attachment;
  }

  static async createTaskAttachment(data: CreateTaskAttachmentRequest): Promise<BackendTaskAttachmentResponse> {
    await new Promise(resolve => setTimeout(resolve, 400));
    const newAttachment: BackendTaskAttachmentResponse = {
      id: Math.max(...mockAttachments.map(a => a.id), 0) + 1,
      ...data,
      taskTitle: "Sample Task",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    mockAttachments.push(newAttachment);
    return newAttachment;
  }

  static async updateTaskAttachment(id: number, data: UpdateTaskAttachmentRequest): Promise<BackendTaskAttachmentResponse> {
    await new Promise(resolve => setTimeout(resolve, 400));
    const attachmentIndex = mockAttachments.findIndex(a => a.id === id);
    if (attachmentIndex === -1) throw new Error('Attachment not found');
    
    const updatedAttachment = {
      ...mockAttachments[attachmentIndex],
      ...data,
      updatedAt: new Date().toISOString()
    };
    mockAttachments[attachmentIndex] = updatedAttachment;
    return updatedAttachment;
  }

  static async deleteTaskAttachment(id: number): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 300));
    const attachmentIndex = mockAttachments.findIndex(a => a.id === id);
    if (attachmentIndex === -1) return false;
    mockAttachments.splice(attachmentIndex, 1);
    return true;
  }

  static async searchAttachments(searchRequest: AttachmentSearchRequest) {
    await new Promise(resolve => setTimeout(resolve, 400));
    let results = [...mockAttachments];
    
    if (searchRequest.searchTerm) {
      results = results.filter(attachment => 
        attachment.fileName.toLowerCase().includes(searchRequest.searchTerm!.toLowerCase()) ||
        attachment.originalFileName.toLowerCase().includes(searchRequest.searchTerm!.toLowerCase())
      );
    }
    
    if (searchRequest.mimeType) {
      results = results.filter(attachment => attachment.mimeType === searchRequest.mimeType);
    }
    
    if (searchRequest.uploaderId) {
      results = results.filter(attachment => attachment.uploaderId === searchRequest.uploaderId);
    }
    
    return {
      success: true,
      data: results,
      totalCount: results.length
    };
  }

  // Additional utility methods
  static async getAttachmentsByUploader(uploaderId: number, pageNumber: number = 1, pageSize: number = 10): Promise<BackendTaskAttachmentResponse[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockAttachments.filter(attachment => attachment.uploaderId === uploaderId);
  }

  static async getAttachmentsByType(mimeType: string, pageNumber: number = 1, pageSize: number = 10): Promise<BackendTaskAttachmentResponse[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockAttachments.filter(attachment => attachment.mimeType === mimeType);
  }

  static async getImageAttachments(projectTaskId?: number, dailyTaskId?: number): Promise<BackendTaskAttachmentResponse[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockAttachments.filter(attachment => 
      attachment.mimeType.startsWith('image/') &&
      ((projectTaskId && attachment.projectTaskId === projectTaskId) ||
       (dailyTaskId && attachment.dailyTaskId === dailyTaskId))
    );
  }

  static async getDocumentAttachments(projectTaskId?: number, dailyTaskId?: number): Promise<BackendTaskAttachmentResponse[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockAttachments.filter(attachment => 
      !attachment.mimeType.startsWith('image/') &&
      ((projectTaskId && attachment.projectTaskId === projectTaskId) ||
       (dailyTaskId && attachment.dailyTaskId === dailyTaskId))
    );
  }

  static async checkAttachmentExists(id: number): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 200));
    return mockAttachments.some(attachment => attachment.id === id);
  }

  static async getTotalSystemSize(): Promise<number> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockAttachments.reduce((total, attachment) => total + attachment.fileSize, 0);
  }
}
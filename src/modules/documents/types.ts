export interface Document {
  id: string;
  fileName: string;
  originalName: string;
  fileType: string;
  fileSize: number;
  filePath: string;
  mimeType: string;
  
  // Module association (optional — general documents have no module)
  moduleType: 'contacts' | 'sales' | 'offers' | 'services' | 'projects' | 'field' | 'general';
  moduleId?: string;
  moduleName?: string;
  
  // Metadata
  uploadedBy: string;
  uploadedByName: string;
  uploadedAt: Date;
  updatedAt: Date;
  
  // Optional fields
  description?: string;
  tags: string[];
  isPublic: boolean;
  // If this document is an external link (not stored as file content)
  externalUrl?: string;
  // Reference to a FileResource entity when applicable
  fileResourceId?: string;
  // Whether the underlying file content is stored in DB/storage or is an external link
  storedInDb?: boolean;
  // Resource kind: 'file' when there's stored file content, 'link' when externalUrl is used
  resourceType?: 'file' | 'link';
  
  // File category
  category: 'crm' | 'field';
  
  // Comments
  comments: DocumentComment[];
  
  // Sharing
  shareLinks: DocumentShareLink[];
}

export interface DocumentComment {
  id: string;
  documentId: string;
  userId: string;
  userName: string;
  comment: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface DocumentShareLink {
  id: string;
  documentId: string;
  linkId: string;
  type: 'internal' | 'external';
  accessLevel: 'view' | 'download';
  expiresAt?: Date;
  createdBy: string;
  createdByName: string;
  createdAt: Date;
  isActive: boolean;
  accessCount: number;
  maxAccess?: number;
}

export interface DocumentFilters {
  search?: string;
  moduleType?: string;
  fileType?: string;
  category?: 'crm' | 'field';
  dateFrom?: Date;
  dateTo?: Date;
  uploadedBy?: string;
  tags?: string[];
}

export interface DocumentStats {
  totalFiles: number;
  totalSize: number;
  crmFiles: number;
  fieldFiles: number;
  byModule: {
    contacts: number;
    sales: number;
    offers: number;
    services: number;
    projects: number;
    field: number;
  };
  recentActivity: number;
}

export interface DocumentUploadData {
  files: File[];
  moduleType?: string;
  moduleId?: string;
  moduleName?: string;
  description?: string;
  tags?: string[];
  category: 'crm' | 'field';
  isPublic?: boolean;
}

export interface DocumentPreviewData {
  document: Document;
  previewUrl?: string;
  canPreview: boolean;
  supportedActions: ('view' | 'download' | 'share' | 'comment' | 'delete')[];
}
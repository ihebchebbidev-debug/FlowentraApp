// Articles Module Types

export type ArticleType = 'material' | 'service';

export type ArticleStatus = 
  | 'available' 
  | 'low_stock' 
  | 'out_of_stock' 
  | 'discontinued' 
  | 'active' 
  | 'inactive';

export type TransactionType = 'in' | 'out' | 'transfer' | 'adjustment';

// =====================================================
// Article Types
// =====================================================

export interface Article {
  id: string;
  type: ArticleType;
  name: string;
  sku?: string;
  description?: string;
  category: string;
  status: ArticleStatus;
  
  // Material-specific
  stock?: number;
  minStock?: number;
  costPrice?: number;
  sellPrice?: number;
  supplier?: string;
  location?: string;
  locationId?: number;
  group?: string;
  groupId?: number;
  subLocation?: string;
  unit?: string;
  
  // Service-specific
  basePrice?: number;
  duration?: number;
  skillsRequired?: string[];
  materialsNeeded?: string[];
  preferredUsers?: string[];
  
  // Usage tracking
  lastUsed?: string;
  lastUsedBy?: string;
  
  // Common
  tags?: string[];
  notes?: string;
  
  // Metadata
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  modifiedBy: string;
}

export interface CreateArticleRequest {
  type: ArticleType;
  name: string;
  sku?: string;
  description?: string;
  category: string;
  status: ArticleStatus;
  
  // Material-specific
  stock?: number;
  minStock?: number;
  costPrice?: number;
  sellPrice?: number;
  supplier?: string;
  location?: string;
  locationId?: number;
  group?: string;
  groupId?: number;
  subLocation?: string;
  unit?: string;
  
  // Service-specific
  basePrice?: number;
  duration?: number;
  skillsRequired?: string[];
  materialsNeeded?: string[];
  preferredUsers?: string[];
  
  // Common
  tags?: string[];
  notes?: string;
}

export interface UpdateArticleRequest {
  name?: string;
  sku?: string;
  description?: string;
  category?: string;
  status?: ArticleStatus;
  
  // Material-specific
  stock?: number;
  minStock?: number;
  costPrice?: number;
  locationId?: number;
  group?: string;
  groupId?: number;
  sellPrice?: number;
  supplier?: string;
  location?: string;
  subLocation?: string;
  unit?: string;
  
  // Service-specific
  basePrice?: number;
  duration?: number;
  skillsRequired?: string[];
  materialsNeeded?: string[];
  preferredUsers?: string[];
  
  // Common
  tags?: string[];
  notes?: string;
}

export interface ArticleSearchParams {
  type?: ArticleType;
  category?: string;
  status?: ArticleStatus;
  location?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  lowStockOnly?: boolean;
}

export interface ArticleListResponse {
  data: Article[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

// =====================================================
// Category Types
// =====================================================

export interface ArticleCategory {
  id: string;
  name: string;
  type: string;
  description?: string;
  parentId?: string;
  order: number;
  isActive: boolean;
  createdAt: string;
}

export interface CreateCategoryRequest {
  name: string;
  type: string;
  description?: string;
  parentId?: string;
  order: number;
}

// =====================================================
// Location Types
// =====================================================

export interface Location {
  id: string;
  name: string;
  type: string;
  address?: string;
  assignedTechnician?: string;
  capacity?: number;
  isActive: boolean;
  createdAt: string;
}

export interface CreateLocationRequest {
  name: string;
  type: string;
  address?: string;
  assignedTechnician?: string;
  capacity?: number;
}

// =====================================================
// Inventory Transaction Types
// =====================================================

export interface InventoryTransaction {
  id: string;
  articleId: string;
  type: TransactionType;
  quantity: number;
  fromLocation?: string;
  toLocation?: string;
  reason: string;
  reference?: string;
  performedBy: string;
  notes?: string;
  createdAt: string;
}

export interface CreateTransactionRequest {
  articleId: string;
  type: TransactionType;
  quantity: number;
  fromLocation?: string;
  toLocation?: string;
  reason: string;
  reference?: string;
  notes?: string;
}

// =====================================================
// Batch Operations Types
// =====================================================

export interface StockUpdateItem {
  id: string;
  stock: number;
}

export interface BatchUpdateStockRequest {
  items: StockUpdateItem[];
}

export interface BatchOperationResult {
  success: boolean;
  updated: number;
  failed: number;
  errors: string[];
}

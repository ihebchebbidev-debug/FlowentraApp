export interface Material {
  id: string;
  name: string;
  sku: string;
  category: string;
  description?: string;
  unit: string;
  standardCost: number;
  currentStock: number;
  minStock: number;
  supplier?: string;
  status: 'active' | 'discontinued' | 'out_of_stock';
  createdAt: Date;
  updatedAt: Date;
}

export interface MaterialUsage {
  id: string;
  serviceOrderId: string;
  materialId: string;
  material: Material;
  quantityUsed: number;
  unitCost: number;
  totalCost: number;
  requestedBy: string;
  approvedBy?: string;
  usedAt: Date;
  notes?: string;
  status: 'requested' | 'approved' | 'used' | 'returned';
}

export interface MaterialRequest {
  id: string;
  serviceOrderId: string;
  materials: MaterialRequestItem[];
  requestedBy: string;
  requestedAt: Date;
  approvedBy?: string;
  approvedAt?: Date;
  status: 'pending' | 'approved' | 'rejected' | 'fulfilled';
  notes?: string;
}

export interface MaterialRequestItem {
  materialId: string;
  quantityRequested: number;
  quantityApproved?: number;
  priority: 'low' | 'medium' | 'high';
  notes?: string;
}
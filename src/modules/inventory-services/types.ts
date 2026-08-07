// Database Tables/Entities for Inventory & Services Module
export interface Article {
  id: string;
  name: string;
  sku?: string; // Only for inventory items
  description?: string;
  category: string;
  type: 'material' | 'service';
  status: 'available' | 'low_stock' | 'out_of_stock' | 'discontinued' | 'active' | 'inactive';
  
  // Inventory specific fields (null for services)
  stock?: number;
  minStock?: number;
  costPrice?: number;
  sellPrice?: number;
  supplier?: string;
  location?: string; // warehouse, technician vehicle, etc.
  subLocation?: string; // sub warehouse (optional)
  unit?: string; // piece, kg, meter, etc.
  
  // Service specific fields (null for inventory)
  basePrice?: number;
  duration?: number; // in hours (decimal allowed, e.g. 0.1)
  skillsRequired?: string[];
  
  materialsNeeded?: string[];
  preferredUsers?: string[]; // List of preferred technician IDs
  
  // Usage tracking
  lastUsed?: Date;
  lastUsedBy?: string;
  
  // Meta
  tags: string[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  modifiedBy: string;
}

// Legacy interfaces for backward compatibility
export interface InventoryItem extends Omit<Article, 'type'> {
  type: 'material';
  stock: number;
  minStock: number;
  location: string;
  costPrice: number;
  sellPrice: number;
}

export interface Service extends Omit<Article, 'type'> {
  type: 'service';
  basePrice: number;
  duration: number; // in hours (decimal allowed)
  skillsRequired: string[];
  materialsNeeded: string[];
}

export interface ItemCategory {
  id: string;
  name: string;
  type: 'material' | 'service';
  description?: string;
  parentId?: string;
  order: number;
  isActive: boolean;
  createdAt: Date;
}

export interface Location {
  id: string;
  name: string;
  type: 'warehouse' | 'vehicle' | 'office' | 'other';
  address?: string;
  assignedTechnician?: string; // For mobile locations like vehicles
  capacity?: number;
  isActive: boolean;
  createdAt: Date;
}

export interface InventoryTransaction {
  id: string;
  itemId: string;
  type: 'in' | 'out' | 'transfer' | 'adjustment';
  quantity: number;
  fromLocation?: string;
  toLocation?: string;
  reason: string;
  reference?: string; // Service order ID, purchase order, etc.
  performedBy: string;
  notes?: string;
  createdAt: Date;
}

export interface ServiceBooking {
  id: string;
  serviceId: string;
  customerId: string;
  technicianId?: string;
  scheduledDate: Date;
  estimatedDuration: number; // in hours
  actualDuration?: number; // in hours
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  price: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

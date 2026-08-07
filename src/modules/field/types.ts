// Database Tables/Entities for Field Module
export interface ServiceOrder {
  id: string;
  orderNumber: string;
  customerId: string;
  technicianId?: string;
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  serviceType: string;
  description: string;
  location: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  scheduledAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  estimatedDuration: number; // minutes
  actualDuration?: number; // minutes
  cost?: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface FieldCustomer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    longitude: number;
    latitude: number;
    hasLocation: number;
  };
  status: 'active' | 'inactive' | 'prospect';
  type: 'residential' | 'commercial' | 'industrial';
  preferredContactMethod: 'phone' | 'email' | 'text';
  serviceHistory: ServiceOrder[];
  notes?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Inventory {
  id: string;
  itemName: string;
  sku: string;
  category: string;
  description?: string;
  quantity: number;
  minQuantity: number;
  maxQuantity?: number;
  unit: string;
  cost: number;
  price: number;
  supplier?: string;
  location: string;
  status: 'active' | 'discontinued' | 'out_of_stock';
  lastRestocked?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface InventoryTransaction {
  id: string;
  inventoryId: string;
  type: 'in' | 'out' | 'adjustment';
  quantity: number;
  reason: string;
  reference?: string; // service order ID, purchase order ID, etc.
  performedBy: string;
  createdAt: Date;
}

export interface MaintenanceLog {
  id: string;
  inventoryId: string;
  type: 'routine' | 'repair' | 'replacement' | 'inspection';
  description: string;
  performedBy: string;
  performedAt: Date;
  cost?: number;
  nextDueDate?: Date;
  notes?: string;
}

export interface Todo {
  id: string;
  customerId?: string;
  serviceOrderId?: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'completed';
  dueDate?: Date;
  assignedTo?: string;
  completedAt?: Date;
  createdAt: Date;
}

export interface DispatchRoute {
  id: string;
  technicianId: string;
  date: Date;
  serviceOrders: string[];
  estimatedDistance: number; // km
  estimatedDuration: number; // minutes
  actualDistance?: number;
  actualDuration?: number;
  status: 'planned' | 'in_progress' | 'completed';
  startedAt?: Date;
  completedAt?: Date;
  notes?: string;
}
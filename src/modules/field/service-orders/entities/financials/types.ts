export interface ServiceOrderFinancials {
  id: string;
  serviceOrderId: string;
  currency: string;
  
  // Cost Breakdown
  estimatedCost: number;
  actualCost: number;
  laborCost: number;
  materialCost: number;
  travelCost: number;
  equipmentCost: number;
  overheadCost: number;
  
  // Pricing
  basePrice: number;
  discounts: ServiceOrderDiscount[];
  taxes: ServiceOrderTax[];
  totalAmount: number;
  
  // Payment
  paymentTerms: string;
  paymentStatus: 'pending' | 'partial' | 'paid' | 'overdue' | 'cancelled';
  paymentMethod?: 'cash' | 'card' | 'bank_transfer' | 'check';
  paidAmount: number;
  remainingAmount: number;
  paymentDate?: Date;
  
  // Invoice
  invoiceNumber?: string;
  invoiceDate?: Date;
  invoiceStatus: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  
  createdAt: Date;
  updatedAt: Date;
}

export interface ServiceOrderDiscount {
  id: string;
  type: 'percentage' | 'fixed_amount';
  value: number;
  reason: string;
  appliedBy: string;
  appliedAt: Date;
}

export interface ServiceOrderTax {
  id: string;
  name: string;
  type: 'percentage' | 'fixed_amount';
  rate: number;
  amount: number;
  taxableAmount: number;
}

export interface PaymentRecord {
  id: string;
  serviceOrderId: string;
  amount: number;
  currency: string;
  paymentMethod: 'cash' | 'card' | 'bank_transfer' | 'check';
  paymentDate: Date;
  reference?: string;
  receivedBy: string;
  notes?: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  createdAt: Date;
}

export interface CostCenter {
  id: string;
  name: string;
  code: string;
  description?: string;
  budgetAmount?: number;
  actualAmount?: number;
  status: 'active' | 'inactive';
}
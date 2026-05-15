// Payment Module Types — shared for Offers & Sales

export type EntityType = 'offer' | 'sale';
export type PaymentStatus = 'unpaid' | 'partially_paid' | 'fully_paid';
export type PaymentMethod = 'cash' | 'bank_transfer' | 'check' | 'card' | 'other';
export type PlanStatus = 'active' | 'completed' | 'cancelled';
export type InstallmentStatus = 'pending' | 'paid' | 'partially_paid' | 'overdue';

export interface PaymentPlan {
  id: string;
  entityType: EntityType;
  entityId: string;
  name: string;
  description?: string;
  totalAmount: number;
  currency: string;
  installmentCount: number;
  status: PlanStatus;
  installments: PaymentPlanInstallment[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentPlanInstallment {
  id: string;
  planId: string;
  installmentNumber: number;
  amount: number;
  dueDate: Date;
  status: InstallmentStatus;
  paidAmount: number;
  paidAt?: Date;
  notes?: string;
  createdAt: Date;
}

export interface Payment {
  id: string;
  entityType: EntityType;
  entityId: string;
  planId?: string;
  installmentId?: string;
  amount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  paymentReference?: string;
  paymentDate: Date;
  status: 'pending' | 'completed' | 'cancelled' | 'refunded';
  notes?: string;
  receiptNumber?: string;
  itemAllocations: PaymentItemAllocation[];
  createdBy: string;
  createdByName?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentItemAllocation {
  id: string;
  paymentId: string;
  itemId: string;
  itemName: string;
  allocatedAmount: number;
  itemTotal: number;
  createdAt: Date;
}

export interface CreatePaymentData {
  entityType: EntityType;
  entityId: string;
  amount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  paymentReference?: string;
  paymentDate: Date;
  notes?: string;
  installmentId?: string;
  itemAllocations?: {
    itemId: string;
    itemName: string;
    allocatedAmount: number;
    itemTotal: number;
  }[];
}

export interface CreatePaymentPlanData {
  entityType: EntityType;
  entityId: string;
  name: string;
  description?: string;
  totalAmount: number;
  currency: string;
  installments: {
    amount: number;
    dueDate: Date;
  }[];
}

export interface PaymentSummary {
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  paymentStatus: PaymentStatus;
  paymentCount: number;
  lastPaymentDate?: Date;
  currency: string;
}

export interface PaymentStatement {
  entityType: EntityType;
  entityId: string;
  entityTitle: string;
  contactName: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  currency: string;
  payments: Payment[];
  plan?: PaymentPlan;
  items: {
    id: string;
    name: string;
    totalPrice: number;
    paidAmount: number;
    remainingAmount: number;
  }[];
  generatedAt: Date;
}

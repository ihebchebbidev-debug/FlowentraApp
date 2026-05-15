// Sales module types for CRM
export interface Sale {
  id: string;
  saleNumber?: string;
  title: string;
  contactId: string;
  contactName: string;
  contactCompany?: string;
  contactEmail?: string;
  contactPhone?: string;
  contactAddress?: string;
  contactPosition?: string;
  // Customer fiscal identification fields
  contactCin?: string;
  contactMatriculeFiscale?: string;
  // Contact geolocation fields
  contactLatitude?: number;
  contactLongitude?: number;
  contactHasLocation?: number;
  amount: number;
  currency: 'USD' | 'EUR' | 'GBP' | 'TND';
  status: 'created' | 'in_progress' | 'invoiced' | 'partially_invoiced' | 'closed' | 'cancelled';
  stage: 'offer' | 'negotiation' | 'closed' | 'converted';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  description?: string;
  notes?: string;
  validUntil?: Date;
  estimatedCloseDate?: Date;
  actualCloseDate?: Date;
  lostReason?: string;
  items: SaleItem[];
  assignedTo?: string;
  assignedToName?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  createdByName?: string;
  lastActivity?: Date;
  // Additional fields for comprehensive sale management
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  customerAddress?: string;
  deliveryDate?: Date;
  taxes?: number;
  taxType?: 'percentage' | 'fixed';
  discount?: number;
  discountType?: 'percentage' | 'fixed';
  shippingCost?: number;
  totalAmount?: number;
  fiscalStamp?: number;
  // Related offer fields (for sales converted from offers)
  offerId?: string;
  offerNumber?: string;
  // Service order conversion tracking
  convertedToServiceOrderId?: string;
  serviceOrdersStatus?: string;
  // Installation info (derived from items with installations)
  linkedInstallation?: {
    id: string;
    name: string;
    model?: string;
    serialNumber?: string;
    matricule?: string;
    manufacturer?: string;
    location?: string;
  };
}

export interface SaleItem {
  id: string;
  saleId: string;
  type: 'article' | 'service';
  itemId: string;
  itemName: string;
  itemCode?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  description?: string;
  discount?: number;
  discountType?: 'percentage' | 'fixed';
  installationId?: string;
  installationName?: string;
  // Duration for service items (in minutes) - from article
  duration?: number;
}

export interface CreateSaleData {
  title: string;
  description: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  status: 'created' | 'in_progress' | 'invoiced' | 'partially_invoiced' | 'closed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  amount: number;
  currency: string;
  deliveryDate: Date | undefined;
  items: SaleItem[];
  notes: string;
  taxes: number;
  taxType?: 'percentage' | 'fixed';
  discount: number;
  discountType?: 'percentage' | 'fixed';
  shippingCost: number;
  isRecurring: boolean;
  recurringInterval: string;
}

export interface SaleActivity {
  id: string;
  saleId: string;
  type: 'note' | 'call' | 'email' | 'meeting' | 'status_change' | 'created';
  description: string;
  details?: string;
  createdAt: Date;
  createdBy: string;
  createdByName: string;
}

export interface SaleStats {
  totalSales: number;
  activeSales: number;
  wonSales: number;
  lostSales: number;
  totalValue: number;
  averageValue: number;
  conversionRate: number;
  monthlyGrowth: number;
}

export interface SaleFilters {
  status?: string;
  priority?: string;
  customerId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
}
// Database Tables/Entities for Offers Module
export interface Offer {
  id: string;
  offerNumber?: string;
  sentCount?: number;
  title: string;
  contactId: string;
  contactName: string;
  contactCompany?: string;
  contactEmail?: string;
  contactPhone?: string;
  contactAddress?: string;
  contactPosition?: string;
  contactCity?: string;
  // Contact geolocation fields
  contactLatitude?: number;
  contactLongitude?: number;
  contactHasLocation?: number;
  // Customer fiscal identification fields
  contactCin?: string;
  contactMatriculeFiscale?: string;
  amount: number;
  currency: 'USD' | 'EUR' | 'GBP' | 'TND';
  status: 'draft' | 'sent' | 'pending' | 'negotiation' | 'accepted' | 'won' | 'lost' | 'cancelled' | 'rejected' | 'expired' | 'declined' | 'modified';
  category: 'potential' | 'big_project' | 'likely_to_close' | 'unlikely_to_close' | 'follow_up_required';
  source: 'direct_customer' | 'social_media' | 'email_marketing' | 'referral' | 'website' | 'trade_show' | 'cold_call' | 'other';
  description?: string;
  notes?: string;
  validUntil?: Date;
  items: OfferItem[];
  assignedTo?: string;
  assignedToName?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  createdByName?: string;
  lastActivity?: Date;
  // Conversion tracking
  convertedToSaleId?: string;
  convertedToServiceOrderId?: string;
  convertedAt?: Date;
  // Additional fields
  taxes?: number;
  taxType?: 'percentage' | 'fixed';
  discount?: number;
  discountType?: 'percentage' | 'fixed';
  totalAmount?: number;
  // Tunisian fiscal requirements
  fiscalStamp?: number;
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

export interface OfferItem {
  id: string;
  offerId: string;
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

export interface CreateOfferData {
  title: string;
  description: string;
  contactId: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  contactAddress: string;
  status: 'draft' | 'sent' | 'created' | 'pending' | 'negotiation' | 'accepted' | 'won' | 'lost' | 'cancelled' | 'rejected' | 'expired' | 'declined' | 'modified';
  category: string; // Dynamic from lookups
  source: string;   // Dynamic from lookups
  amount: number;
  currency: string;
  validUntil: Date | undefined;
  items: OfferItem[];
  notes: string;
  taxes: number;
  taxType: 'percentage' | 'fixed';
  discount: number;
  discountType: 'percentage' | 'fixed';
  fiscalStamp: number;
}

export interface OfferActivity {
  id: string;
  offerId: string;
  type: 'note' | 'call' | 'email' | 'meeting' | 'status_change' | 'created' | 'sent' | 'accepted' | 'declined';
  description: string;
  details?: string;
  createdAt: Date;
  createdBy: string;
  createdByName: string;
}

export interface OfferStats {
  totalOffers: number;
  draftOffers: number;
  activeOffers: number;
  acceptedOffers: number;
  declinedOffers: number;
  totalValue: number;
  averageValue: number;
  conversionRate: number;
  monthlyGrowth: number;
}

export interface OfferFilters {
  status?: string;
  category?: string;
  source?: string;
  contactId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
}

export interface ConvertOfferData {
  offerId: string;
  convertToSale: boolean;
  convertToServiceOrder: boolean;
  salesData?: any;
  serviceOrderData?: any;
}
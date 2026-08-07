// Stock Transaction Types
export interface StockTransaction {
  id: number;
  articleId: number;
  articleName?: string;
  articleNumber?: string;
  transactionType: StockTransactionType;
  quantity: number;
  previousStock: number;
  newStock: number;
  reason?: string;
  referenceType?: StockReferenceType;
  referenceId?: string;
  referenceNumber?: string;
  notes?: string;
  performedBy: string;
  performedByName?: string;
  createdAt: string;
}

export type StockTransactionType = 
  | 'add' 
  | 'remove' 
  | 'sale_deduction' 
  | 'offer_added' 
  | 'adjustment' 
  | 'transfer_in' 
  | 'transfer_out' 
  | 'return' 
  | 'damaged' 
  | 'lost';

export type StockReferenceType = 
  | 'offer' 
  | 'sale' 
  | 'service_order' 
  | 'manual' 
  | 'adjustment';

export interface StockTransactionListResponse {
  data: StockTransaction[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface CreateStockTransactionDto {
  articleId: number;
  transactionType: StockTransactionType;
  quantity: number;
  previousStock?: number;
  newStock?: number;
  reason?: string;
  referenceType?: StockReferenceType;
  referenceId?: string;
  referenceNumber?: string;
  notes?: string;
}

// Real API-based Sales Service
import { salesApi, type Sale as ApiSale, type CreateSaleRequest, type UpdateSaleRequest, type SaleSearchParams } from '@/services/api/salesApi';
import { Sale, CreateSaleData, SaleFilters, SaleStats } from '../types';
import { saleStatusConfig, getActiveStatuses, getPositiveTerminalStatuses, getNegativeStatuses, normalizeStatus } from '@/config/entity-statuses';

// Helper to map API sale to local sale type
const mapApiToLocal = (apiSale: ApiSale & { offer?: { id?: number; offerNumber?: string } }): Sale => {
  // Extract contact info from nested contact object or fallback to contactName
  const contactName = apiSale.contact?.name || apiSale.contactName || '';
  const contactCompany = apiSale.contact?.company || '';
  const contactEmail = apiSale.contact?.email || '';
  const contactPhone = apiSale.contact?.phone || '';
  const contactAddress = apiSale.contact?.address || '';
  // Extract geolocation from contact
  const contactLatitude = apiSale.contact?.latitude;
  const contactLongitude = apiSale.contact?.longitude;
  const contactHasLocation = apiSale.contact?.hasLocation;

  // Get service order ID from items if not directly available
  const convertedToServiceOrderId = apiSale.convertedToServiceOrderId || 
    apiSale.items?.find(item => item.serviceOrderGenerated && item.serviceOrderId)?.serviceOrderId?.toString();

  // Extract offer number - check nested offer object first, then direct field
  const offerNumber = apiSale.offerNumber || apiSale.offer?.offerNumber;
  const offerId = apiSale.offerId ? String(apiSale.offerId) : (apiSale.offer?.id ? String(apiSale.offer.id) : undefined);

  // Helper function to extract installation from items
  const getLinkedInstallationFromItems = (): any => {
    if (!apiSale.items || apiSale.items.length === 0) return undefined;
    
    // Find the first item that has installation data
    for (const item of apiSale.items) {
      const itemDetails = (item as any);
      // Check if item has installation-related fields (directly on item or nested)
      if (itemDetails.installationName || itemDetails.model || itemDetails.serialNumber) {
        return {
          id: itemDetails.installationId ? String(itemDetails.installationId) : '',
          name: itemDetails.installationName || '',
          model: itemDetails.model || '',
          serialNumber: itemDetails.serialNumber || '',
          matricule: itemDetails.matricule || '',
          manufacturer: itemDetails.manufacturer || '',
          location: itemDetails.location || '',
        };
      }
      // Also check if installation is nested
      if (itemDetails.installation && itemDetails.installation.id) {
        return {
          id: String(itemDetails.installation.id),
          name: itemDetails.installation.name,
          model: itemDetails.installation.model,
          serialNumber: itemDetails.installation.serialNumber,
          matricule: itemDetails.installation.matricule,
          manufacturer: itemDetails.installation.manufacturer,
          location: itemDetails.installation.location,
        };
      }
    }
    return undefined;
  };

  return {
    id: String(apiSale.id),
    saleNumber: apiSale.saleNumber,
    title: apiSale.title,
    description: apiSale.description || '',
    contactId: String(apiSale.contactId),
    contactName: contactName,
    contactCompany: contactCompany,
    contactEmail: contactEmail,
    contactLatitude: contactLatitude,
    contactLongitude: contactLongitude,
    contactHasLocation: contactHasLocation,
    amount: apiSale.totalAmount || 0,
    currency: (apiSale.currency || 'TND') as 'USD' | 'EUR' | 'GBP' | 'TND',
    status: normalizeStatus(saleStatusConfig, apiSale.status as any) as any,
    stage: (apiSale.stage || 'offer') as any,
    priority: (apiSale.priority || 'medium') as any,
    notes: apiSale.notes || '',
    items: (apiSale.items || []).map((item: any) => {
      // Prefer explicit totals from the API; fall back to qty*unitPrice when
      // both totalPrice and lineTotal are missing/zero. Using a numeric guard
      // (rather than `||`) preserves intentional zero totals (e.g. comp items).
      const apiTotal = Number(item.totalPrice);
      const apiLineTotal = Number(item.lineTotal);
      const qty = Number(item.quantity) || 0;
      const unit = Number(item.unitPrice) || 0;
      const totalPrice =
        Number.isFinite(apiTotal) && apiTotal > 0
          ? apiTotal
          : Number.isFinite(apiLineTotal) && apiLineTotal > 0
            ? apiLineTotal
            : qty * unit;
      return {
        id: String(item.id || ''),
        saleId: String(apiSale.id),
        itemId: String(item.id || ''),
        itemCode: item.itemCode || '',
        itemName: item.itemName || item.description || `Item #${item.id}`,
        type: item.type === 'service' ? 'service' : 'article',
        quantity: qty,
        unitPrice: unit,
        totalPrice,
        description: item.description,
        discount: item.discount,
        installationId: item.installationId ? String(item.installationId) : undefined,
        installationName: item.installationName,
        requiresServiceOrder: item.requiresServiceOrder,
        serviceOrderGenerated: item.serviceOrderGenerated,
        fulfillmentStatus: item.fulfillmentStatus,
        serviceOrderId: item.serviceOrderId,
      };
    }),
    assignedTo: apiSale.assignedTo ? String(apiSale.assignedTo) : '',
    assignedToName: apiSale.assignedToName || '',
    tags: [],
    createdAt: apiSale.createdDate ? new Date(apiSale.createdDate) : new Date(),
    updatedAt: apiSale.modifiedDate ? new Date(apiSale.modifiedDate) : new Date(),
    createdBy: apiSale.createdBy ? String(apiSale.createdBy) : '',
    createdByName: apiSale.createdByName || undefined,
    customerName: contactName,
    customerEmail: contactEmail,
    customerPhone: contactPhone,
    customerAddress: contactAddress,
    estimatedCloseDate: apiSale.estimatedCloseDate ? new Date(apiSale.estimatedCloseDate) : undefined,
    actualCloseDate: apiSale.actualCloseDate ? new Date(apiSale.actualCloseDate) : undefined,
    lostReason: apiSale.lostReason,
    taxes: apiSale.taxes || 0,
    taxType: ((apiSale as any).taxType || 'fixed') as 'percentage' | 'fixed',
    discount: apiSale.discount || 0,
    discountType: ((apiSale as any).discountType || 'fixed') as 'percentage' | 'fixed',
    shippingCost: 0,
    totalAmount: apiSale.totalAmount || 0,
    fiscalStamp: (apiSale as any).fiscalStamp || 0,
    // Related offer fields - use extracted values
    offerId: offerId,
    offerNumber: offerNumber,
    // Service order conversion tracking
    convertedToServiceOrderId: convertedToServiceOrderId,
    serviceOrdersStatus: apiSale.serviceOrdersStatus,
    linkedInstallation: (apiSale as any).linkedInstallation ? {
      id: String((apiSale as any).linkedInstallation.id),
      name: (apiSale as any).linkedInstallation.name,
      model: (apiSale as any).linkedInstallation.model,
      serialNumber: (apiSale as any).linkedInstallation.serialNumber,
      matricule: (apiSale as any).linkedInstallation.matricule,
      manufacturer: (apiSale as any).linkedInstallation.manufacturer,
      location: (apiSale as any).linkedInstallation.location,
    } : undefined,
  };
};

// Helper to map local data to API request
const mapLocalToApiCreate = (data: CreateSaleData): CreateSaleRequest => {
  // Business rule: Tax applied AFTER discount
  const itemsTotal = (data.items || []).reduce((sum, item) => sum + item.totalPrice, 0);
  const discountAmount = data.discountType === 'percentage'
    ? itemsTotal * ((data.discount || 0) / 100)
    : (data.discount || 0);
  const afterDiscount = itemsTotal - discountAmount;
  const taxAmount = data.taxType === 'percentage' 
    ? afterDiscount * ((data.taxes || 0) / 100)
    : (data.taxes || 0);
  
  return {
    title: data.title,
    description: data.description,
    contactId: parseInt(data.customerId, 10) || 0,
    status: data.status || 'draft',
    priority: data.priority,
    currency: data.currency,
    taxes: data.taxes,
    taxType: data.taxType,
    discount: data.discount,
    discountType: data.discountType,
    items: data.items?.map(item => ({
      type: item.type === 'service' ? 'service' as const : 'article' as const,
      itemName: item.itemName,
      itemCode: item.itemCode,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      discount: item.discount,
      installationId: item.installationId?.toString() || undefined,
      requiresServiceOrder: item.type === 'service',
    })),
  };
};

export function getSales(): Sale[] {
  // Sync version - returns empty, caller should use async SalesService.getSales()
  return [];
}

export class SalesService {
  static async getSales(filters?: SaleFilters): Promise<Sale[]> {
    try {
      // Fetch all sales (high limit) to ensure full list for display
      const params: SaleSearchParams = {
        page: 1,
        limit: 1000,
      };
      
      if (filters?.status) params.status = filters.status;
      if (filters?.search) params.search = filters.search;
      
      const response = await salesApi.getAll(params);
      let sales = response.data.sales.map(mapApiToLocal);
      
      // Apply additional client-side filters if needed
      if (filters?.priority) {
        sales = sales.filter(sale => sale.priority === filters.priority);
      }
      
      return sales.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    } catch (error) {
      console.error('Failed to fetch sales:', error);
      return [];
    }
  }

  // Sales for a single contact — server-side filtered via the contact_id query
  // param (tenant-scoped through salesApi/apiFetch). Used by the contact detail.
  static async getByContact(contactId: string): Promise<Sale[]> {
    const numId = parseInt(contactId, 10);
    if (isNaN(numId)) return [];
    try {
      const response = await salesApi.getAll({ page: 1, limit: 1000, contactId: numId });
      return response.data.sales
        .map(mapApiToLocal)
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    } catch (error) {
      console.error('Failed to fetch sales for contact:', error);
      return [];
    }
  }

  static async getSaleById(id: string): Promise<Sale | null> {
    try {
      const numId = parseInt(id, 10);
      if (isNaN(numId)) return null;
      
      const apiSale = await salesApi.getById(numId);
      return mapApiToLocal(apiSale);
    } catch (error) {
      console.error('Failed to fetch sale:', error);
      return null;
    }
  }

  static async createSale(data: CreateSaleData): Promise<Sale> {
    const request = mapLocalToApiCreate(data);
    const apiSale = await salesApi.create(request);
    const sale = mapApiToLocal(apiSale);
    
    // Log the creation activity
    try {
      const numericId = parseInt(sale.id, 10);
      if (!isNaN(numericId)) {
        await salesApi.addActivity(numericId, {
          type: 'created',
          description: `Sale "${sale.title}" created`,
          details: `New sale created on ${new Date().toLocaleDateString()}`,
        });
      }
    } catch (activityError) {
      console.warn('Failed to log sale creation activity:', activityError);
    }
    
    return sale;
  }

  static async updateSale(id: string, data: Partial<Sale> & { serviceOrderConfig?: any }): Promise<Sale> {
    const numId = parseInt(id, 10);
    if (isNaN(numId)) throw new Error('Invalid sale ID');
    
    const updateRequest: UpdateSaleRequest = {};
    if (data.title !== undefined) updateRequest.title = data.title;
    if (data.description !== undefined) updateRequest.description = data.description;
    if (data.status !== undefined) updateRequest.status = data.status;
    if (data.stage !== undefined) updateRequest.stage = data.stage;
    if (data.priority !== undefined) updateRequest.priority = data.priority;
    if (data.taxes !== undefined) updateRequest.taxes = data.taxes;
    if (data.taxType !== undefined) updateRequest.taxType = data.taxType;
    if (data.discount !== undefined) updateRequest.discount = data.discount;
    if (data.actualCloseDate !== undefined) updateRequest.actualCloseDate = data.actualCloseDate?.toISOString();
    if (data.lostReason !== undefined) updateRequest.lostReason = data.lostReason;
    // Pass service order config for workflow auto-creation
    if (data.serviceOrderConfig !== undefined) updateRequest.serviceOrderConfig = data.serviceOrderConfig;
    
    const apiSale = await salesApi.update(numId, updateRequest);
    return mapApiToLocal(apiSale);
  }

  static async deleteSale(id: string): Promise<void> {
    const numId = parseInt(id, 10);
    if (isNaN(numId)) throw new Error('Invalid sale ID');
    await salesApi.delete(numId);
  }

  static async getSaleStats(): Promise<SaleStats> {
    try {
      const response = await salesApi.getAll({ limit: 1000 });
      // Map API sales to local mapped objects (normalize statuses and fields)
      const mappedSales = response.data.sales.map((s: any) => mapApiToLocal(s));
      
      const totalSales = mappedSales.length;
      const totalValue = mappedSales.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
      const averageValue = totalSales > 0 ? totalValue / totalSales : 0;
      const activeSales = mappedSales.filter(s => getActiveStatuses(saleStatusConfig).includes(s.status)).length;
      const wonSales = mappedSales.filter(s => getPositiveTerminalStatuses(saleStatusConfig).includes(s.status)).length;
      const lostSales = mappedSales.filter(s => getNegativeStatuses(saleStatusConfig).includes(s.status)).length;
      const conversionRate = totalSales > 0 ? (wonSales / totalSales) * 100 : 0;
      
      return {
        totalSales,
        activeSales,
        wonSales,
        lostSales,
        totalValue,
        averageValue,
        conversionRate,
        monthlyGrowth: 0,
      };
    } catch (error) {
      console.error('Failed to fetch sale stats:', error);
      return {
        totalSales: 0,
        activeSales: 0,
        wonSales: 0,
        lostSales: 0,
        totalValue: 0,
        averageValue: 0,
        conversionRate: 0,
        monthlyGrowth: 0,
      };
    }
  }

  static async addItem(saleId: string, item: {
    type: 'article' | 'service';
    itemName: string;
    itemCode?: string;
    description?: string;
    quantity: number;
    unitPrice: number;
    discount?: number;
    installationId?: string;
    installationName?: string;
  }): Promise<void> {
    const numId = parseInt(saleId, 10);
    if (isNaN(numId)) throw new Error('Invalid sale ID');
    
    await salesApi.addItem(numId, item);
  }

  static async createServiceOrder(saleId: string, data: {
    priority?: string;
    notes?: string;
    startDate?: string;
    targetCompletionDate?: string;
    installationIds?: number[];
    tags?: string[];
    jobConversionMode?: string;
  }): Promise<{ serviceOrderId: string }> {
    const numId = parseInt(saleId, 10);
    if (isNaN(numId)) throw new Error('Invalid sale ID');
    
    const result = await salesApi.createServiceOrder(numId, data);
    return { serviceOrderId: String(result.serviceOrderId) };
  }
}

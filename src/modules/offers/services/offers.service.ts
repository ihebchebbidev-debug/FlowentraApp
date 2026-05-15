// Real API-based Offers Service
import { offersApi, type Offer as ApiOffer, type CreateOfferRequest, type UpdateOfferRequest, type OfferSearchParams } from '@/services/api/offersApi';
import { Offer, CreateOfferData, OfferFilters, OfferStats, ConvertOfferData } from '../types';
import { offerStatusConfig, getActiveStatuses, getPositiveTerminalStatuses, getNegativeStatuses } from '@/config/entity-statuses';

// Helper to map API offer to local offer type
const mapApiToLocal = (apiOffer: ApiOffer): Offer => {
  // Extract contact info from nested contact object if available
  const contact = (apiOffer as any).contact;
  const contactName = contact?.name || apiOffer.contactName || '';
  const contactEmail = contact?.email || '';
  const contactPhone = contact?.phone || '';
  const contactAddress = contact?.address || '';
  const contactCompany = contact?.company || '';
  const contactCity = contact?.city || '';
  const contactLatitude = contact?.latitude;
  const contactLongitude = contact?.longitude;
  const contactHasLocation = contact?.hasLocation;

  // Backend DTO uses createdAt/updatedAt and createdBy/createdByName.
  // Some legacy endpoints may still return createdDate/modifiedDate.
  const createdAtRaw = (apiOffer as any).createdAt ?? apiOffer.createdDate;
  const updatedAtRaw = (apiOffer as any).updatedAt ?? apiOffer.modifiedDate;
  const createdByRaw = (apiOffer as any).createdBy ?? '';
  const createdByNameRaw = (apiOffer as any).createdByName;
  const assignedToRaw = (apiOffer as any).assignedTo;
  const assignedToNameRaw = (apiOffer as any).assignedToName;

  // Helper function to extract installation from items
  const getLinkedInstallationFromItems = (): any => {
    if (!apiOffer.items || apiOffer.items.length === 0) return undefined;
    
    // Find the first item that has installation data
    for (const item of apiOffer.items) {
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
    id: String(apiOffer.id),
    offerNumber: apiOffer.offerNumber || (apiOffer as any).OfferNumber || undefined,
    sentCount: apiOffer.sentCount || 0,
    title: apiOffer.title,
    description: apiOffer.description || '',
    contactId: String(apiOffer.contactId),
    contactName: contactName,
    contactCompany: contactCompany,
    contactEmail: contactEmail,
    contactPhone: contactPhone,
    contactAddress: contactAddress,
    contactLatitude: contactLatitude,
    contactLongitude: contactLongitude,
    contactHasLocation: contactHasLocation,
    amount: apiOffer.totalAmount || 0,
    currency: (apiOffer.currency || 'USD') as 'USD' | 'EUR' | 'GBP' | 'TND',
    status: apiOffer.status as Offer['status'],
    category: (apiOffer.category || 'potential') as Offer['category'],
    source: (apiOffer.source || 'direct_customer') as Offer['source'],
    notes: '',
    items: (apiOffer.items || []).map(item => {
      const subtotal = item.quantity * item.unitPrice;
      const discountAmount = item.discountType === 'percentage' 
        ? subtotal * ((item.discount || 0) / 100)
        : (item.discount || 0);
      const totalPrice = subtotal - discountAmount;
      
      return {
        id: String(item.id || ''),
        offerId: String(apiOffer.id),
        itemId: String(item.id || ''),
        itemCode: item.itemCode || '',
        itemName: item.itemName,
        type: item.type === 'service' ? 'service' : 'article',
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: totalPrice,
        description: item.description,
        discount: item.discount,
        discountType: item.discountType,
        installationId: item.installationId ? String(item.installationId) : undefined,
        installationName: item.installationName,
      };
    }),
    tags: (apiOffer as any).tags || [],
    createdAt: createdAtRaw ? new Date(createdAtRaw) : new Date(),
    updatedAt: updatedAtRaw ? new Date(updatedAtRaw) : new Date(),
    createdBy: String(createdByRaw || ''),
    createdByName: createdByNameRaw ? String(createdByNameRaw) : undefined,
    validUntil: apiOffer.validUntil ? new Date(apiOffer.validUntil) : undefined,
    taxes: apiOffer.taxes || 0,
    taxType: ((apiOffer as any).taxType || 'fixed') as 'percentage' | 'fixed',
    discount: apiOffer.discount || 0,
    discountType: ((apiOffer as any).discountType || 'fixed') as 'percentage' | 'fixed',
    totalAmount: apiOffer.totalAmount || 0,
    fiscalStamp: (apiOffer as any).fiscalStamp || 0,
    convertedToSaleId: (apiOffer as any).convertedToSaleId ? String((apiOffer as any).convertedToSaleId) : undefined,
    convertedToServiceOrderId: (apiOffer as any).convertedToServiceOrderId ? String((apiOffer as any).convertedToServiceOrderId) : undefined,
    convertedAt: (apiOffer as any).convertedAt ? new Date((apiOffer as any).convertedAt) : undefined,
    assignedTo: assignedToRaw ? String(assignedToRaw) : undefined,
    assignedToName: assignedToNameRaw ? String(assignedToNameRaw) : undefined,
    linkedInstallation: (apiOffer as any).linkedInstallation ? {
      id: String((apiOffer as any).linkedInstallation.id),
      name: (apiOffer as any).linkedInstallation.name,
      model: (apiOffer as any).linkedInstallation.model,
      serialNumber: (apiOffer as any).linkedInstallation.serialNumber,
      matricule: (apiOffer as any).linkedInstallation.matricule,
      manufacturer: (apiOffer as any).linkedInstallation.manufacturer,
      location: (apiOffer as any).linkedInstallation.location,
    } : undefined,
  };
};

// Helper to map local data to API request
const mapLocalToApiCreate = (data: CreateOfferData): CreateOfferRequest => {
  // Calculate items total
  const itemsTotal = (data.items || []).reduce((sum, item) => {
    const subtotal = item.quantity * item.unitPrice;
    const discountAmount = item.discountType === 'percentage' 
      ? subtotal * ((item.discount || 0) / 100)
      : (item.discount || 0);
    return sum + (subtotal - discountAmount);
  }, 0);
  
  // Business rule: Subtotal → Discount → Tax (on afterDiscount) → Fiscal Stamp
  const discountType = (data as any).discountType || 'fixed';
  const discountAmount = discountType === 'percentage'
    ? itemsTotal * ((data.discount || 0) / 100)
    : (data.discount || 0);
  
  const afterDiscount = itemsTotal - discountAmount;
  
  // Calculate tax amount based on type (applied AFTER discount)
  const taxAmount = data.taxType === 'percentage' 
    ? afterDiscount * ((data.taxes || 0) / 100)
    : (data.taxes || 0);
  
  // Calculate total amount: afterDiscount + taxes + fiscalStamp
  const fiscalStamp = (data as any).fiscalStamp || 0;
  const totalAmount = afterDiscount + taxAmount + fiscalStamp;
  
  return {
    title: data.title,
    description: data.description,
    contactId: parseInt(data.contactId, 10) || 0,
    status: data.status || 'draft',
    category: data.category,
    source: data.source,
    currency: data.currency,
      validUntil: data.validUntil 
      ? (data.validUntil instanceof Date ? data.validUntil.toISOString() : data.validUntil)
      : undefined,
    taxes: data.taxes,
    taxType: data.taxType,
    discount: data.discount,
    discountType: discountType,
    totalAmount: totalAmount,
    fiscalStamp: fiscalStamp,
    notes: data.notes || undefined,
    items: data.items?.map(item => ({
      type: item.type === 'service' ? 'service' as const : 'article' as const,
      itemName: item.itemName,
      itemCode: item.itemCode,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      discount: item.discount,
      discountType: item.discountType,
      installationId: item.installationId ? String(item.installationId) : undefined,
      installationName: item.installationName,
    }))
  };
};

export class OffersService {
  static async getOffers(filters?: OfferFilters): Promise<Offer[]> {
    try {
      // Fetch all offers (high limit) to ensure full list for display
      const params: OfferSearchParams = {
        page: 1,
        limit: 1000,
      };
      
      if (filters?.status) params.status = filters.status;
      if (filters?.contactId) params.contactId = parseInt(filters.contactId, 10);
      if (filters?.search) params.search = filters.search;
      
      const response = await offersApi.getAll(params);
      let offers = response.data.offers.map(mapApiToLocal);
      
      // Apply additional client-side filters if needed
      if (filters?.category) {
        offers = offers.filter(offer => offer.category === filters.category);
      }
      if (filters?.source) {
        offers = offers.filter(offer => offer.source === filters.source);
      }
      
      return offers.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    } catch (error) {
      console.error('Failed to fetch offers:', error);
      return [];
    }
  }

  static async getOfferById(id: string): Promise<Offer | null> {
    try {
      const numId = parseInt(id, 10);
      if (isNaN(numId)) return null;
      
      const apiOffer = await offersApi.getById(numId);
      return mapApiToLocal(apiOffer);
    } catch (error) {
      console.error('Failed to fetch offer:', error);
      return null;
    }
  }

  static async sendOffer(id: string): Promise<Offer> {
    const numId = parseInt(id, 10);
    if (isNaN(numId)) throw new Error('Invalid offer ID');
    
    // Call the new send endpoint which increments sentCount and sets status to sent
    const apiOffer = await offersApi.send(numId);
    return mapApiToLocal(apiOffer);
  }

  static async createOffer(data: CreateOfferData): Promise<Offer> {
    const request = mapLocalToApiCreate(data);
    const apiOffer = await offersApi.create(request);
    const offer = mapApiToLocal(apiOffer);
    
    // Note: The backend already logs the "created" activity, so we don't need to do it here
    
    return offer;
  }

  static async updateOffer(id: string, data: Partial<Offer>, originalItems?: any[]): Promise<Offer> {
    const numId = parseInt(id, 10);
    if (isNaN(numId)) throw new Error('Invalid offer ID');
    
    const updateRequest: UpdateOfferRequest = {};
    if (data.title !== undefined) updateRequest.title = data.title;
    if (data.description !== undefined) updateRequest.description = data.description;
    if (data.contactId !== undefined) updateRequest.contactId = parseInt(data.contactId, 10);
    if (data.status !== undefined) updateRequest.status = data.status;
    if (data.category !== undefined) updateRequest.category = data.category;
    if (data.currency !== undefined) updateRequest.currency = data.currency;
if (data.validUntil !== undefined) {
      // Handle both Date objects and string values
      updateRequest.validUntil = data.validUntil instanceof Date 
        ? data.validUntil.toISOString()
        : (typeof data.validUntil === 'string' ? data.validUntil : undefined);
    }    
    if (data.taxes !== undefined) updateRequest.taxes = data.taxes;
    if (data.taxType !== undefined) updateRequest.taxType = data.taxType;
    if (data.discount !== undefined) updateRequest.discount = data.discount;
    if (data.discountType !== undefined) updateRequest.discountType = data.discountType;
    if (data.totalAmount !== undefined) updateRequest.totalAmount = data.totalAmount;
    if (data.fiscalStamp !== undefined) updateRequest.fiscalStamp = data.fiscalStamp;
    
    // Update offer details first
    const apiOffer = await offersApi.update(numId, updateRequest);
    
    // Delete removed items first (compare with original items)
    if (originalItems && originalItems.length > 0) {
      const currentItemIds = new Set((data.items || []).map(item => item.id).filter(Boolean));
      for (const originalItem of originalItems) {
        // Only delete items that have a valid backend ID (not empty or temporary)
        const isBackendItem = originalItem.id && originalItem.id !== '' && !originalItem.id.startsWith('item-');
        if (isBackendItem && !currentItemIds.has(originalItem.id)) {
          const itemId = parseInt(originalItem.id, 10);
          if (!isNaN(itemId)) {
            await offersApi.deleteItem(numId, itemId);
          }
        }
      }
    }
    
    // If items are provided, handle updates and additions
    if (data.items && data.items.length > 0) {
      for (const item of data.items) {
        const isNewItem = !item.id || item.id === '' || String(item.id).startsWith('item-');
        
        if (isNewItem) {
          // Add new items
          await offersApi.addItem(numId, {
            type: item.type === 'service' ? 'service' : 'article',
            itemName: item.itemName,
            itemCode: item.itemCode,
            description: item.description || item.itemName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discount: item.discount,
            discountType: item.discountType,
            installationId: item.installationId ? String(item.installationId) : undefined,
            installationName: item.installationName,
          })
        } else {
          // Update existing items - find original to check if changed
          const originalItem = originalItems?.find(orig => String(orig.id) === String(item.id));
          if (originalItem) {
            // Check if quantity or other fields changed - ensure numeric comparison
            const currentQty = Number(item.quantity);
            const originalQty = Number(originalItem.quantity);
            const currentPrice = Number(item.unitPrice);
            const originalPrice = Number(originalItem.unitPrice);
            const currentDiscount = Number(item.discount || 0);
            const originalDiscount = Number(originalItem.discount || 0);
            const currentDiscountType = item.discountType || 'percentage';
            const originalDiscountType = originalItem.discountType || 'percentage';
            
            const hasChanges = 
              currentQty !== originalQty ||
              currentPrice !== originalPrice ||
              currentDiscount !== originalDiscount ||
              currentDiscountType !== originalDiscountType ||
              originalItem.description !== item.description;
            
            if (hasChanges) {
              console.log(`[OffersService] Updating item ${item.id}: qty ${originalQty} -> ${currentQty}`);
              const itemId = parseInt(String(item.id), 10);
              if (!isNaN(itemId)) {
                await offersApi.updateItem(numId, itemId, {
                  type: item.type === 'service' ? 'service' : 'article',
                  itemName: item.itemName,
                  itemCode: item.itemCode,
                  description: item.description || item.itemName,
                  quantity: currentQty,
                  unitPrice: currentPrice,
                  discount: currentDiscount,
                  discountType: currentDiscountType,
                  installationId: item.installationId ? String(item.installationId) : undefined,
                  installationName: item.installationName,
                });
              }
            }
          }
        }
      }
    }
    
    // Fetch updated offer with items
    const updatedOffer = await this.getOfferById(id) as Offer;
    
    // ── Sync changes to linked Sale if offer was converted ──
    if (updatedOffer.convertedToSaleId) {
      try {
        const { salesApi } = await import('@/services/api/salesApi');
        const saleNumId = parseInt(updatedOffer.convertedToSaleId, 10);
        if (!isNaN(saleNumId)) {
          // Sync core offer fields to sale
          const saleUpdateRequest: any = {};
          if (data.title !== undefined) saleUpdateRequest.title = data.title;
          if (data.description !== undefined) saleUpdateRequest.description = data.description;
          if (data.taxes !== undefined) saleUpdateRequest.taxes = data.taxes;
          if (data.taxType !== undefined) saleUpdateRequest.taxType = data.taxType;
          if (data.discount !== undefined) saleUpdateRequest.discount = data.discount;
          if (data.totalAmount !== undefined) saleUpdateRequest.amount = data.totalAmount;
          if (data.fiscalStamp !== undefined) saleUpdateRequest.fiscalStamp = data.fiscalStamp;
          
          // Update sale details
          if (Object.keys(saleUpdateRequest).length > 0) {
            await salesApi.update(saleNumId, saleUpdateRequest);
          }
          
          // Sync items: delete all sale items and re-add from offer
          if (data.items && data.items.length > 0) {
            // Fetch current sale to get existing items
            const currentSale = await salesApi.getById(saleNumId);
            const existingSaleItems = currentSale.items || [];
            
            // Delete all existing sale items
            for (const saleItem of existingSaleItems) {
              if (saleItem.id) {
                await salesApi.deleteItem(saleNumId, typeof saleItem.id === 'number' ? saleItem.id : parseInt(String(saleItem.id), 10));
              }
            }
            
            // Re-add items from the updated offer
            for (const item of updatedOffer.items) {
              await salesApi.addItem(saleNumId, {
                type: item.type === 'service' ? 'service' : 'article',
                itemName: item.itemName,
                itemCode: item.itemCode,
                description: item.description || item.itemName,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                discount: item.discount,
                installationId: item.installationId ? String(item.installationId) : undefined,
                installationName: item.installationName,
              });
            }
          }
          
          console.log(`[OffersService] Synced offer ${id} changes to linked sale ${updatedOffer.convertedToSaleId}`);
        }
      } catch (syncError) {
        console.warn(`[OffersService] Failed to sync offer changes to linked sale:`, syncError);
        // Don't fail the offer update if sale sync fails
      }
    }
    
    return updatedOffer;
  }

  static async deleteOffer(id: string): Promise<void> {
    const numId = parseInt(id, 10);
    if (isNaN(numId)) throw new Error('Invalid offer ID');
    await offersApi.delete(numId);
  }

  static async convertOffer(data: ConvertOfferData): Promise<{ saleId?: string; serviceOrderId?: string; alreadyConverted?: boolean }> {
    const numId = parseInt(data.offerId, 10);
    if (isNaN(numId)) throw new Error('Invalid offer ID');

    // First, check if offer is already converted (idempotency protection)
    const existingOffer = await this.getOfferById(data.offerId);
    if (existingOffer?.convertedToSaleId) {
      // Verify that the linked sale actually exists (it might have been deleted)
      try {
        const { salesApi } = await import('@/services/api/salesApi');
        const saleId = parseInt(existingOffer.convertedToSaleId, 10);
        if (!isNaN(saleId)) {
          await salesApi.getById(saleId);
          // Sale exists - return existing sale ID
          return {
            saleId: existingOffer.convertedToSaleId,
            alreadyConverted: true,
          };
        }
      } catch (error) {
        // Sale doesn't exist anymore (was deleted) - proceed with new conversion
        console.info('Previously linked sale was deleted, proceeding with new conversion');
      }
    }

    const result: { saleId?: string; serviceOrderId?: string; alreadyConverted?: boolean } = {};

    if (data.convertToSale) {
      const saleResult = await offersApi.convertToSale(numId);
      if (saleResult.saleId !== null && saleResult.saleId !== undefined) {
        result.saleId = String(saleResult.saleId);
        result.alreadyConverted = false;
      }
    }

    return result;
  }

  static async getOfferStats(): Promise<OfferStats> {
    try {
      const response = await offersApi.getAll({ limit: 1000 });
      const offers = response.data.offers;
      
      const totalOffers = offers.length;
      const totalValue = offers.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
      const averageValue = totalOffers > 0 ? totalValue / totalOffers : 0;
      const draftOffers = offers.filter(o => o.status === 'draft').length;
      const activeOffers = offers.filter(o => getActiveStatuses(offerStatusConfig).includes(o.status)).length;
      const acceptedOffers = offers.filter(o => getPositiveTerminalStatuses(offerStatusConfig).includes(o.status)).length;
      const declinedOffers = offers.filter(o => getNegativeStatuses(offerStatusConfig).includes(o.status)).length;
      const conversionRate = totalOffers > 0 ? (acceptedOffers / totalOffers) * 100 : 0;
      
      return {
        totalOffers,
        draftOffers,
        activeOffers,
        acceptedOffers,
        declinedOffers,
        totalValue,
        averageValue,
        conversionRate,
        monthlyGrowth: 0,
      };
    } catch (error) {
      console.error('Failed to fetch offer stats:', error);
      return {
        totalOffers: 0,
        draftOffers: 0,
        activeOffers: 0,
        acceptedOffers: 0,
        declinedOffers: 0,
        totalValue: 0,
        averageValue: 0,
        conversionRate: 0,
        monthlyGrowth: 0,
      };
    }
  }

  static async renewOffer(id: string): Promise<Offer> {
    const numId = parseInt(id, 10);
    if (isNaN(numId)) throw new Error('Invalid offer ID');
    
    const apiOffer = await offersApi.renew(numId);
    return mapApiToLocal(apiOffer);
  }

  static async addItem(offerId: string, item: {
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
    const numId = parseInt(offerId, 10);
    if (isNaN(numId)) throw new Error('Invalid offer ID');
    
    await offersApi.addItem(numId, item);
  }
}

export function getOffers(): Offer[] {
  // Sync version - returns empty, caller should use async OffersService.getOffers()
  return [];
}

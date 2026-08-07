import { offersApi } from '@/services/api/offersApi';
import { salesApi } from '@/services/api/salesApi';
import { serviceOrdersApi } from '@/services/api/serviceOrdersApi';
import { dispatchesApi } from '@/services/api/dispatchesApi';

export type EntityType = 'offer' | 'sale' | 'service_order' | 'dispatch';

interface DuplicateCheckResult {
  isDuplicate: boolean;
  foundIn?: string;
}

/**
 * Checks if a document number already exists across all entity types.
 * Excludes the current entity from the check.
 */
export async function checkDuplicateDocumentNumber(
  newNumber: string,
  currentEntityType: EntityType,
  _currentEntityId: number | string
): Promise<DuplicateCheckResult> {
  const normalizedNumber = newNumber.trim().toLowerCase();

  try {
    // Fetch all entity lists in parallel
    const currentId = String(_currentEntityId);
    const [offers, sales, serviceOrders, dispatches] = await Promise.all([
      offersApi.getAll({ page: 1, limit: 1000 }).catch(() => ({ data: [] as any[] })),
      salesApi.getAll({ page: 1, limit: 1000 }).catch(() => ({ data: [] as any[] })),
      serviceOrdersApi.getAll({ page: 1, pageSize: 1000 }).catch(() => ({ data: [] as any[] })),
      dispatchesApi.getAll({ pageNumber: 1, pageSize: 1000 }).catch(() => ({ data: [] as any[] })),
    ]);

    const offerItems = (offers as any)?.data || (offers as any)?.items || [];
    const saleItems = (sales as any)?.data || (sales as any)?.items || [];
    const soItems = (serviceOrders as any)?.data || (serviceOrders as any)?.items || [];
    const dispatchItems = (dispatches as any)?.data || (dispatches as any)?.items || [];

    // Check offers
    const duplicateOffer = offerItems.find((item: any) =>
      (item.offerNumber || '').toLowerCase() === normalizedNumber &&
      !(currentEntityType === 'offer' && String(item.id) === String(currentId))
    );
    if (duplicateOffer) return { isDuplicate: true, foundIn: 'Offers' };

    // Check sales
    const duplicateSale = saleItems.find((item: any) =>
      (item.saleNumber || '').toLowerCase() === normalizedNumber &&
      !(currentEntityType === 'sale' && String(item.id) === String(currentId))
    );
    if (duplicateSale) return { isDuplicate: true, foundIn: 'Sales' };

    // Check service orders
    const duplicateSO = soItems.find((item: any) =>
      (item.orderNumber || '').toLowerCase() === normalizedNumber &&
      !(currentEntityType === 'service_order' && String(item.id) === String(currentId))
    );
    if (duplicateSO) return { isDuplicate: true, foundIn: 'Service Orders' };

    // Check dispatches
    const duplicateDispatch = dispatchItems.find((item: any) =>
      (item.dispatchNumber || '').toLowerCase() === normalizedNumber &&
      !(currentEntityType === 'dispatch' && String(item.id) === String(currentId))
    );
    if (duplicateDispatch) return { isDuplicate: true, foundIn: 'Dispatches' };

    return { isDuplicate: false };
  } catch (error) {
    console.error('Failed to check duplicate document number:', error);
    // Don't block the save if validation fails
    return { isDuplicate: false };
  }
}

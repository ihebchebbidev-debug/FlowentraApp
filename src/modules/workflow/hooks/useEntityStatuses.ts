// Hook to fetch entity statuses dynamically from the backend
import { useState, useEffect, useMemo } from 'react';
import { 
  offerStatusesApi, 
  saleStatusesApi, 
  serviceOrderStatusesApi, 
  dispatchStatusesApi 
} from '@/services/api/lookupsApi';
import { 
  EntityType, 
  StatusOption,
  getStatusesByEntityType,
} from '../data/entity-statuses';

interface UseEntityStatusesResult {
  statuses: StatusOption[];
  isLoading: boolean;
  isFromBackend: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

// Cache for statuses to avoid repeated API calls
const statusCache: Record<string, { statuses: StatusOption[]; timestamp: number }> = {};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache TTL

// Config-driven API map — add new entity types here and in entity-statuses config
const entityApiMap: Record<string, typeof offerStatusesApi | null> = {
  offer: offerStatusesApi,
  sale: saleStatusesApi,
  service_order: serviceOrderStatusesApi,
  dispatch: dispatchStatusesApi,
};

export function useEntityStatuses(entityType: EntityType | null): UseEntityStatusesResult {
  const [statuses, setStatuses] = useState<StatusOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFromBackend, setIsFromBackend] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchStatuses = async () => {
    if (!entityType) {
      setStatuses([]);
      return;
    }

    // Check cache first
    const cached = statusCache[entityType];
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      setStatuses(cached.statuses);
      setIsFromBackend(true);
      return;
    }

    // Use centralized config as fallback — no switch statement needed
    const fallback = getStatusesByEntityType(entityType);

    const api = entityApiMap[entityType] ?? null;
    if (!api) {
      setStatuses(fallback);
      setIsFromBackend(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await api.getAll();
      
      // Map backend response to StatusOption format
      const backendStatuses: StatusOption[] = (response.items || []).map((item: any) => ({
        value: item.id || item.value || item.name,
        labelKey: `status.${entityType.replace('_', '')}.${item.id || item.value || item.name}`,
        name: item.name || item.id,
      }));

      if (backendStatuses.length > 0) {
        statusCache[entityType] = {
          statuses: backendStatuses,
          timestamp: Date.now(),
        };
        setStatuses(backendStatuses);
        setIsFromBackend(true);
      } else {
        setStatuses(fallback);
        setIsFromBackend(false);
      }
    } catch (err) {
      console.warn(`Failed to fetch statuses for ${entityType} from backend, using fallback:`, err);
      setError(err instanceof Error ? err : new Error('Failed to fetch statuses'));
      setStatuses(fallback);
      setIsFromBackend(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatuses();
  }, [entityType]);

  const memoizedStatuses = useMemo(() => statuses, [statuses]);

  return {
    statuses: memoizedStatuses,
    isLoading,
    isFromBackend,
    error,
    refetch: fetchStatuses,
  };
}

// Hook to get statuses for multiple entity types at once
export function useAllEntityStatuses(): Record<EntityType, StatusOption[]> {
  const { statuses: offerStatuses } = useEntityStatuses('offer');
  const { statuses: saleStatuses } = useEntityStatuses('sale');
  const { statuses: serviceOrderStatuses } = useEntityStatuses('service_order');
  const { statuses: dispatchStatuses } = useEntityStatuses('dispatch');

  return useMemo(() => ({
    offer: offerStatuses,
    sale: saleStatuses,
    service_order: serviceOrderStatuses,
    dispatch: dispatchStatuses,
  }), [offerStatuses, saleStatuses, serviceOrderStatuses, dispatchStatuses]);
}

// Utility function to invalidate the cache (useful after status updates)
export function invalidateStatusCache(entityType?: EntityType) {
  if (entityType) {
    delete statusCache[entityType];
  } else {
    Object.keys(statusCache).forEach(key => {
      delete statusCache[key];
    });
  }
}

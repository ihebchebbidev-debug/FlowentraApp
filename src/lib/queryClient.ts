// Optimized QueryClient configuration for enterprise scalability
import { QueryClient, QueryClientConfig, dehydrate, hydrate, MutationCache, QueryCache } from '@tanstack/react-query';
import { getCurrentTenant } from '@/utils/tenant';
import { reportIncident, inferModuleFromPath } from '@/services/incident/incidentService';

// Cache time constants (in milliseconds)
export const CACHE_TIMES = {
  // Static data that rarely changes (lookups, roles, skills)
  STATIC: 1000 * 60 * 30, // 30 minutes
  
  // Semi-static data (user preferences, settings)
  SEMI_STATIC: 1000 * 60 * 10, // 10 minutes
  
  // Dynamic data (contacts, offers, sales)
  DYNAMIC: 1000 * 60 * 2, // 2 minutes
  
  // Real-time data (notifications, dispatches)
  REALTIME: 1000 * 30, // 30 seconds
  
  // Never cache (form submissions, mutations)
  NONE: 0,
} as const;

// Stale time constants - when to show cached data while refetching
export const STALE_TIMES = {
  STATIC: 1000 * 60 * 15, // 15 minutes before considered stale
  SEMI_STATIC: 1000 * 60 * 5, // 5 minutes
  DYNAMIC: 1000 * 60, // 1 minute
  REALTIME: 1000 * 10, // 10 seconds
  IMMEDIATE: 0, // Always refetch
} as const;

// Retry configuration
const retryConfig = {
  maxRetries: 3,
  retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
};

function extractQueryErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object') {
    const e = error as Record<string, unknown>;
    if (typeof e.message === 'string') return e.message;
    if (typeof e.error === 'string') return e.error;
  }
  return 'Query failed';
}

function extractQueryErrorStatus(error: unknown): number | undefined {
  if (error && typeof error === 'object') {
    const e = error as Record<string, unknown>;
    if (typeof e.status === 'number') return e.status;
  }
  return undefined;
}

function inferModuleFromQueryKey(queryKey: readonly unknown[]): string {
  const first = queryKey[0];
  return typeof first === 'string' ? first : inferModuleFromPath();
}

const mutationCache = new MutationCache({
  onError: (error, _variables, _context, mutation) => {
    const status = extractQueryErrorStatus(error);
    const message = extractQueryErrorMessage(error);
    if (status && status < 500 && status !== 0) return;
    void reportIncident({
      incidentType: 'mutation_error',
      message,
      httpStatus: status,
      module: inferModuleFromQueryKey(mutation.options.mutationKey ?? []),
      details: JSON.stringify({ mutationKey: mutation.options.mutationKey }),
    });
  },
});

const queryCache = new QueryCache({
  onError: (error, query) => {
    const status = extractQueryErrorStatus(error);
    const message = extractQueryErrorMessage(error);
    if (status && status < 500 && status !== 0) return;
    void reportIncident({
      incidentType: 'query_error',
      message,
      httpStatus: status,
      module: inferModuleFromQueryKey(query.queryKey),
      details: JSON.stringify({ queryKey: query.queryKey }),
    });
  },
});

// Create optimized QueryClient configuration
const queryClientConfig: QueryClientConfig = {
  queryCache,
  mutationCache,
  defaultOptions: {
    queries: {
      // Default stale time - data is fresh for 1 minute
      staleTime: STALE_TIMES.DYNAMIC,
      
      // Default cache time - keep in cache for 5 minutes after becoming inactive
      gcTime: 1000 * 60 * 5,
      
      // Retry failed requests up to 3 times with exponential backoff
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors (client errors)
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        return failureCount < retryConfig.maxRetries;
      },
      retryDelay: retryConfig.retryDelay,
      
      // Refetch behavior
      refetchOnWindowFocus: 'always', // Refetch when user returns to tab
      refetchOnReconnect: true, // Refetch when network reconnects
      refetchOnMount: true, // Refetch when component mounts if data is stale
      
      // Network mode
      networkMode: 'always', // Allow cache/query behavior in offline mode
      
      // Structural sharing for optimal re-renders
      structuralSharing: true,
    },
    mutations: {
      // Retry mutations once on failure
      retry: 1,
      retryDelay: 1000,
      
      // Network mode
      networkMode: 'always',
    },
  },
};

// Create the singleton QueryClient instance
export const queryClient = new QueryClient(queryClientConfig);

const QUERY_CACHE_KEY_PREFIX = 'flowentra-query-cache-v1';
const QUERY_CACHE_MAX_AGE_MS = 1000 * 60 * 60 * 12; // 12h

/** Tenant-scoped cache key so each company has its own persisted cache */
function getQueryCacheKey(): string {
  const tenant = getCurrentTenant();
  return tenant ? `${QUERY_CACHE_KEY_PREFIX}:${tenant}` : QUERY_CACHE_KEY_PREFIX;
}
let persistenceInitialized = false;

export const initializeQueryPersistence = (): void => {
  if (persistenceInitialized || typeof window === 'undefined') return;
  persistenceInitialized = true;

  try {
    const raw = localStorage.getItem(getQueryCacheKey());
    if (raw) {
      const parsed = JSON.parse(raw) as { timestamp?: number; state?: unknown };
      if (parsed?.timestamp && Date.now() - parsed.timestamp < QUERY_CACHE_MAX_AGE_MS && parsed.state) {
        hydrate(queryClient, parsed.state as any);
      }
    }
  } catch {
    // Ignore malformed persisted cache.
  }

  let saveTimer: number | undefined;
  queryClient.getQueryCache().subscribe(() => {
    if (saveTimer) window.clearTimeout(saveTimer);
    saveTimer = window.setTimeout(() => {
      try {
        const state = dehydrate(queryClient, {
          shouldDehydrateQuery: (query) => query.state.status === 'success',
        });
        localStorage.setItem(
            getQueryCacheKey(),
          JSON.stringify({
            timestamp: Date.now(),
            state,
          })
        );
      } catch {
        // Storage can fail in private mode / quota full.
      }
    }, 400);
  });
};

// Query key factories for consistent cache keys
export const queryKeys = {
  // Contacts
  contacts: {
    all: ['contacts'] as const,
    list: (params?: object) => ['contacts', 'list', params] as const,
    detail: (id: number) => ['contacts', 'detail', id] as const,
  },
  
  // Offers
  offers: {
    all: ['offers'] as const,
    list: (params?: object) => ['offers', 'list', params] as const,
    detail: (id: number) => ['offers', 'detail', id] as const,
  },
  
  // Sales
  sales: {
    all: ['sales'] as const,
    list: (params?: object) => ['sales', 'list', params] as const,
    detail: (id: number) => ['sales', 'detail', id] as const,
  },
  
  // Service Orders
  serviceOrders: {
    all: ['serviceOrders'] as const,
    list: (params?: object) => ['serviceOrders', 'list', params] as const,
    detail: (id: number) => ['serviceOrders', 'detail', id] as const,
  },
  
  // Dispatches
  dispatches: {
    all: ['dispatches'] as const,
    list: (params?: object) => ['dispatches', 'list', params] as const,
    detail: (id: number) => ['dispatches', 'detail', id] as const,
    calendar: (range: object) => ['dispatches', 'calendar', range] as const,
  },
  
  // Users & Auth
  users: {
    all: ['users'] as const,
    list: (params?: object) => ['users', 'list', params] as const,
    detail: (id: number) => ['users', 'detail', id] as const,
    current: ['users', 'current'] as const,
  },
  
  // Lookups (static data - long cache)
  lookups: {
    all: ['lookups'] as const,
    type: (type: string) => ['lookups', type] as const,
    currencies: ['lookups', 'currencies'] as const,
    priorities: ['lookups', 'priorities'] as const,
    taskStatuses: ['lookups', 'taskStatuses'] as const,
    eventTypes: ['lookups', 'eventTypes'] as const,
  },
  
  // Articles
  articles: {
    all: ['articles'] as const,
    list: (params?: object) => ['articles', 'list', params] as const,
    detail: (id: number) => ['articles', 'detail', id] as const,
  },
  
  // Notifications
  notifications: {
    all: ['notifications'] as const,
    unread: ['notifications', 'unread'] as const,
    list: (params?: object) => ['notifications', 'list', params] as const,
  },
  
  // AI Chat
  aiChat: {
    all: ['aiChat'] as const,
    conversations: ['aiChat', 'conversations'] as const,
    messages: (conversationId: string) => ['aiChat', 'messages', conversationId] as const,
  },
} as const;

// Type for entities with 'all' key
type EntityWithAll = {
  [K in keyof typeof queryKeys]: typeof queryKeys[K] extends { all: readonly string[] } ? K : never
}[keyof typeof queryKeys];

// Helper to invalidate related queries efficiently
export const invalidateRelatedQueries = async (
  client: QueryClient,
  entity: EntityWithAll
) => {
  const entityQueries = queryKeys[entity];
  if ('all' in entityQueries) {
    await client.invalidateQueries({ queryKey: entityQueries.all });
  }
};

// Prefetch helper for navigation
export const prefetchQuery = async <T>(
  queryKey: readonly unknown[],
  queryFn: () => Promise<T>,
  staleTime: number = STALE_TIMES.DYNAMIC
) => {
  return queryClient.prefetchQuery({
    queryKey,
    queryFn,
    staleTime,
  });
};

export default queryClient;

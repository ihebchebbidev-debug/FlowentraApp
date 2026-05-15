import { useState, useEffect, useCallback } from 'react';
import { useLoading } from '../contexts/LoadingContext';

interface UseDataLoadingOptions {
  autoLoad?: boolean;
  loadingMessage?: string;
  minLoadingTime?: number;
}

export function useDataLoading<T>(
  dataFetcher: () => Promise<T>,
  dependencies: any[] = [],
  options: UseDataLoadingOptions = {}
) {
  const { autoLoad = true, loadingMessage = 'Loading data...', minLoadingTime = 500 } = options;
  const { withLoading } = useLoading();
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const startTime = Date.now();
      
      const result = await withLoading(async () => {
        const data = await dataFetcher();
        
        // Ensure minimum loading time for better UX
        const elapsed = Date.now() - startTime;
        if (elapsed < minLoadingTime) {
          await new Promise(resolve => setTimeout(resolve, minLoadingTime - elapsed));
        }
        
        return data;
      }, loadingMessage);
      
      setData(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [dataFetcher, withLoading, loadingMessage, minLoadingTime]);

  const refreshData = useCallback(() => {
    return loadData();
  }, [loadData]);

  useEffect(() => {
    if (autoLoad) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoLoad, loadData, ...dependencies]);

  return {
    data,
    error,
    isLoading,
    loadData,
    refreshData,
  };
}

// Hook for lazy loading with intersection observer
export function useLazyLoading(threshold = 0.1) {
  const [isVisible, setIsVisible] = useState(false);
  const [hasBeenVisible, setHasBeenVisible] = useState(false);

  const elementRef = useCallback((node: HTMLElement | null) => {
    if (node) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            setHasBeenVisible(true);
          } else {
            setIsVisible(false);
          }
        },
        { threshold }
      );
      
      observer.observe(node);
      
      return () => observer.disconnect();
    }
  }, [threshold]);

  return { isVisible, hasBeenVisible, elementRef };
}

// Hook for paginated data loading
export function usePaginatedLoading<T>(
  dataFetcher: (page: number, limit: number) => Promise<{ data: T[]; total: number; hasMore: boolean }>,
  limit = 20,
  options: UseDataLoadingOptions = {}
) {
  const { loadingMessage = 'Loading more data...' } = options;
  const { withLoading } = useLoading();
  const [data, setData] = useState<T[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const loadInitialData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await withLoading(async () => {
        return await dataFetcher(1, limit);
      }, 'Loading data...');
      
      setData(result.data);
      setTotal(result.total);
      setHasMore(result.hasMore);
      setCurrentPage(1);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [dataFetcher, limit, withLoading]);

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoading) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const nextPage = currentPage + 1;
      const result = await withLoading(async () => {
        return await dataFetcher(nextPage, limit);
      }, loadingMessage);
      
      setData(prev => [...prev, ...result.data]);
      setTotal(result.total);
      setHasMore(result.hasMore);
      setCurrentPage(nextPage);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, hasMore, isLoading, dataFetcher, limit, withLoading, loadingMessage]);

  return {
    data,
    total,
    hasMore,
    isLoading,
    error,
    currentPage,
    loadInitialData,
    loadMore,
    refresh: loadInitialData,
  };
}
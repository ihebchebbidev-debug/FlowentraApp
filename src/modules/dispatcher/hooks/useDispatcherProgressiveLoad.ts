import { useState, useEffect, useCallback, useRef } from 'react';
import { DispatcherService } from '../services/dispatcher.service';
import type { Job, Technician } from '../types';

export type LoadingPhase = 'idle' | 'cached' | 'users' | 'dispatches' | 'serviceOrders' | 'complete';

interface LoadingState {
  phase: LoadingPhase;
  progress: number;
  usersLoaded: boolean;
  dispatchesLoaded: boolean;
  serviceOrdersLoaded: boolean;
}

interface UseDispatcherProgressiveLoadReturn {
  technicians: Technician[];
  jobs: Job[];
  loadingState: LoadingState;
  isFullyLoaded: boolean;
  refresh: () => Promise<void>;
}

export function useDispatcherProgressiveLoad(): UseDispatcherProgressiveLoadReturn {
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loadingState, setLoadingState] = useState<LoadingState>({
    phase: 'idle',
    progress: 0,
    usersLoaded: false,
    dispatchesLoaded: false,
    serviceOrdersLoaded: false,
  });
  
  const isLoadingRef = useRef(false);
  const hasInitializedRef = useRef(false);

  const loadData = useCallback(async (forceRefresh = false) => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;

    try {
      // Clear cache if force refresh
      if (forceRefresh) {
        DispatcherService.clearCache();
      }

      // INSTANT DISPLAY: Check for cached data first
      const cached = DispatcherService.getCachedData();
      if (cached.technicians.length > 0 || cached.jobs.length > 0) {
        // Show cached data immediately
        setTechnicians(cached.technicians);
        setJobs(cached.jobs);
        
        if (cached.hasFreshCache && !forceRefresh) {
          // Cache is fresh, we're done!
          setLoadingState({
            phase: 'complete',
            progress: 100,
            usersLoaded: true,
            dispatchesLoaded: true,
            serviceOrdersLoaded: true,
          });
          return;
        }
        
        // Cache exists but is stale - show it while refreshing in background
        setLoadingState({
          phase: 'cached',
          progress: 50,
          usersLoaded: cached.technicians.length > 0,
          dispatchesLoaded: true,
          serviceOrdersLoaded: cached.jobs.length > 0,
        });
      } else {
        // No cache - start loading
        setLoadingState({
          phase: 'users',
          progress: 10,
          usersLoaded: false,
          dispatchesLoaded: false,
          serviceOrdersLoaded: false,
        });
      }

      // Parallel fetch: technicians, dispatches cache pre-warm, and unassigned jobs all in flight at once.
      // Each phase still updates the UI as it resolves so users see techs/jobs the instant they arrive.
      const techniciansPromise = DispatcherService.fetchTechnicians(forceRefresh).then(fetched => {
        setTechnicians(fetched);
        setLoadingState(prev => ({
          ...prev,
          phase: prev.serviceOrdersLoaded ? 'complete' : 'dispatches',
          progress: Math.max(prev.progress, 40),
          usersLoaded: true,
        }));
        return fetched;
      });

      const dispatchesPromise = DispatcherService.fetchDispatchesCached().then(res => {
        setLoadingState(prev => ({
          ...prev,
          progress: Math.max(prev.progress, 55),
          dispatchesLoaded: true,
        }));
        return res;
      });

      const serviceOrdersPromise = DispatcherService.fetchServiceOrdersWithUnassignedJobs(forceRefresh).then(result => {
        setJobs(result.jobs);
        setLoadingState(prev => ({
          ...prev,
          phase: prev.usersLoaded ? 'complete' : 'serviceOrders',
          progress: Math.max(prev.progress, 80),
          serviceOrdersLoaded: true,
        }));
        return result;
      });

      await Promise.all([techniciansPromise, dispatchesPromise, serviceOrdersPromise]);

      setLoadingState({
        phase: 'complete',
        progress: 100,
        usersLoaded: true,
        dispatchesLoaded: true,
        serviceOrdersLoaded: true,
      });


    } catch (error) {
      console.error('Failed to load dispatcher data:', error);
      // Set to complete even on error to allow UI to show
      setLoadingState(prev => ({
        ...prev,
        phase: 'complete',
        progress: 100,
      }));
    } finally {
      isLoadingRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;
      loadData();
    }
  }, [loadData]);

  const refresh = useCallback(async () => {
    await loadData(true);
  }, [loadData]);

  return {
    technicians,
    jobs,
    loadingState,
    isFullyLoaded: loadingState.phase === 'complete',
    refresh,
  };
}

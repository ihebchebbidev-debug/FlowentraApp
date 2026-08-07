import { useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { pluginsApi } from './pluginsApi';
import {
  getAllPlugins,
  getPluginByCode,
  getDependentsOf,
  getTransitiveDependencies,
  getTransitiveDependents,
} from './registry';
import {
  readCachedActivations,
  writeCachedActivations,
} from './activationsCache';
import { getCurrentTenant } from '@/utils/tenant';
import type { PluginActivation, PluginManifest, PluginRuntimeState } from './types';

/** Activations are per tenant — scope the cache key so switching company refetches. */
const queryKeyFor = (tenant: string | null | undefined) =>
  ['plugins', 'activations', tenant ?? 'default'] as const;

export function usePlugins() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation('settings');

  const manifests = useMemo(() => getAllPlugins(), []);
  const tenant = getCurrentTenant();
  const QUERY_KEY = useMemo(() => queryKeyFor(tenant), [tenant]);

  // Read once per render — cache lookup is cheap, but keep referential
  // stability for the dependency array below.
  const cachedActivations = useMemo(() => readCachedActivations(), []);

  const {
    data: activations,
    isLoading,
    isError: isApiError,
    error: apiError,
  } = useQuery<PluginActivation[]>({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      try {
        const data = await pluginsApi.listStrict();
        // Persist last known good state so offline / cold-start renders have data.
        writeCachedActivations(data);
        return data;
      } catch (err) {
        // API unreachable: never fall back to "everything enabled" — keep the
        // last known tenant snapshot so disabled modules stay hidden.
        const cached = readCachedActivations();
        if (cached) return cached;
        throw err;
      }
    },

    // Near real-time gating: an admin deactivating a module externally must
    // take effect in an open session without asking the user to reload.
    staleTime: 30_000,
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    // pluginsApi.list() never throws — it returns [] on any error — so this
    // retry path only triggers for genuine network failures (no response at all).
    retry: 0,
    // Don't re-fetch on component remount: [] is a valid "no activations" state
    // and we don't want the PluginGate skeleton to flash on every navigation.
    retryOnMount: false,

    // Seed React Query's cache with the persisted snapshot so the very first
    // render already reflects the tenant's last known activations.
    initialData: cachedActivations,
    initialDataUpdatedAt: cachedActivations ? 0 : undefined,
  });

  const isApiAvailable = !isApiError;
  const isUsingCachedFallback = isApiError && !!cachedActivations;

  /**
   * Resolve which activation list to use.
   * - Successful query → server data
   * - Failed query but cache available → cached snapshot (graceful degradation)
   * - Otherwise → empty list (default-on semantics kick in)
   */
  const effectiveActivations: PluginActivation[] = useMemo(() => {
    if (activations && activations.length >= 0 && !isApiError) return activations;
    if (isApiError && cachedActivations) return cachedActivations;
    return activations ?? [];
  }, [activations, isApiError, cachedActivations]);

  /** Raw map of code -> explicit stored value. Default true if no row exists. */
  const storedMap = useMemo(() => {
    const map = new Map<string, boolean>();
    // Seed with default-on for every known manifest
    for (const m of manifests) map.set(m.code, true);
    // Override with explicit values (server or cached)
    for (const a of effectiveActivations) map.set(a.code, a.isEnabled);
    return map;
  }, [manifests, effectiveActivations]);

  /**
   * Effective map — a plugin is only truly on when every plugin in its
   * TRANSITIVE dependency chain is on. Core plugins are always on.
   * This is the single source of truth for gating.
   */
  const enabledMap = useMemo(() => {
    const map = new Map<string, boolean>();
    const resolve = (code: string, seen: Set<string>): boolean => {
      if (map.has(code)) return map.get(code)!;
      const manifest = getPluginByCode(code);
      if (!manifest) return true; // unknown code → allow
      if (manifest.isCore) {
        map.set(code, true);
        return true;
      }
      if (seen.has(code)) return true; // cycle guard (registry validates separately)
      seen.add(code);
      let value = storedMap.get(code) !== false;
      if (value) {
        for (const dep of manifest.dependencies) {
          if (!resolve(dep, seen)) {
            value = false;
            break;
          }
        }
      }
      seen.delete(code);
      map.set(code, value);
      return value;
    };
    for (const m of manifests) resolve(m.code, new Set());
    return map;
  }, [manifests, storedMap]);

  const isEnabled = useCallback(
    (code: string | undefined | null): boolean => {
      if (!code) return true; // No code = ungated route, allow
      const manifest = getPluginByCode(code);
      // Unknown code → allow (avoids accidentally hiding new modules during dev)
      if (!manifest) return true;
      // Core plugins are always on
      if (manifest.isCore) return true;
      return enabledMap.get(code) !== false;
    },
    [enabledMap]
  );

  const runtimeState = useMemo<PluginRuntimeState[]>(() => {
    return manifests.map((manifest) => {
      const explicitlyEnabled = manifest.isCore || storedMap.get(manifest.code) !== false;
      const hasBrokenDependency = getTransitiveDependencies(manifest.code).some(
        (dep) => enabledMap.get(dep) === false
      );
      const enabledDependents = getDependentsOf(manifest.code)
        .filter((d) => enabledMap.get(d.code) !== false)
        .map((d) => d.code);
      return {
        manifest,
        isEnabled: explicitlyEnabled && !hasBrokenDependency,
        hasBrokenDependency,
        enabledDependents,
      };
    });
  }, [manifests, enabledMap, storedMap]);

  const activeCount = useMemo(
    () => runtimeState.filter((s) => s.isEnabled).length,
    [runtimeState]
  );
  const totalCount = manifests.length;

  const toggleMutation = useMutation({
    mutationFn: ({ code, enabled }: { code: string; enabled: boolean }) =>
      pluginsApi.toggle(code, enabled, true),
    onSuccess: (_data, { code, enabled }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast({
        title: enabled ? t('plugins.toggleOnSuccess', 'Plugin enabled') : t('plugins.toggleOffSuccess', 'Plugin disabled'),
        description: code,
      });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err?.message || t('plugins.toggleError', 'Failed to update plugin');
      toast({ title: t('plugins.error', 'Error'), description: msg, variant: 'destructive' });
    },
  });

  const bulkMutation = useMutation({
    mutationFn: ({ codes, enabled }: { codes: string[]; enabled: boolean }) =>
      pluginsApi.bulkToggle(codes, enabled),
    onSuccess: (_data, { enabled }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast({
        title: enabled ? t('plugins.bulkEnableSuccess', 'Plugins enabled') : t('plugins.bulkDisableSuccess', 'Plugins disabled'),
      });
    },
    onError: () => {
      toast({ title: t('plugins.error', 'Error'), description: t('plugins.bulkError', 'Bulk update failed'), variant: 'destructive' });
    },
  });

  const toggle = useCallback(
    (code: string, enabled: boolean) => {
      const manifest = getPluginByCode(code);
      if (!manifest) return;
      if (manifest?.isCore && !enabled) {
        toast({
          title: t('plugins.coreLocked', 'Core plugin'),
          description: t('plugins.coreLockedDesc', 'This plugin cannot be disabled.'),
          variant: 'destructive',
        });
        return;
      }
      toggleMutation.mutate({ code, enabled });
    },
    [toggleMutation, toast, t]
  );

  /**
   * Preview of what a toggle will do, for confirmation dialogs.
   * - enabling → the dependency chain that gets switched ON with it
   * - disabling → the dependents that get switched OFF with it (cascade)
   */
  const previewToggle = useCallback(
    (code: string, enabled: boolean): { alsoEnabled: string[]; alsoDisabled: string[] } => {
      if (enabled) {
        return {
          alsoEnabled: getTransitiveDependencies(code).filter(
            (c) => storedMap.get(c) === false
          ),
          alsoDisabled: [],
        };
      }
      return {
        alsoEnabled: [],
        alsoDisabled: getTransitiveDependents(code).filter(
          (c) => enabledMap.get(c) !== false
        ),
      };
    },
    [storedMap, enabledMap]
  );

  const bulkToggle = useCallback(
    (codes: string[], enabled: boolean) => {
      bulkMutation.mutate({ codes, enabled });
    },
    [bulkMutation]
  );

  return {
    plugins: manifests,
    runtimeState,
    isEnabled,
    activeCount,
    totalCount,
    isLoading,
    isApiAvailable,
    isUsingCachedFallback,
    apiError: apiError as Error | null | undefined,
    toggle,
    bulkToggle,
    previewToggle,
    isToggling: toggleMutation.isPending || bulkMutation.isPending,
  };
}

/** Lightweight gate hook — does not subscribe to mutations. */
export function useIsPluginEnabled(code: string | undefined | null): { isEnabled: boolean; isLoading: boolean } {
  const { isEnabled, isLoading } = usePlugins();
  return { isEnabled: isEnabled(code), isLoading };
}

export type UsePluginsReturn = ReturnType<typeof usePlugins>;
export { getAllPlugins, getPluginByCode } from './registry';
export type { PluginManifest };

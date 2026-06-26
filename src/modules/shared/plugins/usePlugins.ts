import { useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { pluginsApi } from './pluginsApi';
import {
  getAllPlugins,
  getPluginByCode,
  getDependentsOf,
} from './registry';
import {
  readCachedActivations,
  writeCachedActivations,
} from './activationsCache';
import type { PluginActivation, PluginManifest, PluginRuntimeState } from './types';

const QUERY_KEY = ['plugins', 'activations'] as const;

export function usePlugins() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation('settings');

  const manifests = useMemo(() => getAllPlugins(), []);

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
      const data = await pluginsApi.list();
      // Persist last known good state so a future cold start (or transient
      // network outage) can fall back to it instead of default-on.
      writeCachedActivations(data);
      return data;
    },
    staleTime: 5 * 60_000,
    retry: (failCount, error) => {
      // Don't retry on 400/404 — these are server config errors, not transient failures
      const msg = error instanceof Error ? error.message : String(error);
      if (/400|404|unable to resolve|plugin/i.test(msg)) return false;
      return failCount < 1;
    },
    // Seed React Query's cache with the persisted snapshot so the very first
    // render already reflects the tenant's last known activations.
    initialData: cachedActivations,
    initialDataUpdatedAt: cachedActivations ? 0 : undefined,
  });

  const isApiAvailable = !isApiError;
  // True when the query failed but we are still showing a cached snapshot.
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

  /** Map of code -> isEnabled. Default true if no row exists. */
  const enabledMap = useMemo(() => {
    const map = new Map<string, boolean>();
    // Seed with default-on for every known manifest
    for (const m of manifests) map.set(m.code, true);
    // Override with explicit values (server or cached)
    for (const a of effectiveActivations) map.set(a.code, a.isEnabled);
    return map;
  }, [manifests, effectiveActivations]);

  const isEnabled = useCallback(
    (code: string | undefined | null): boolean => {
      if (!code) return true; // No code = ungated route, allow
      const manifest = getPluginByCode(code);
      // Unknown code → allow (avoids accidentally hiding new modules during dev)
      if (!manifest) return true;
      // Core plugins are always on
      if (manifest.isCore) return true;
      const explicit = enabledMap.get(code);
      if (explicit === false) return false;
      // Check dependencies — if any dep is disabled, this plugin is effectively off
      for (const dep of manifest.dependencies) {
        if (enabledMap.get(dep) === false) return false;
      }
      return true;
    },
    [enabledMap]
  );

  const runtimeState = useMemo<PluginRuntimeState[]>(() => {
    return manifests.map((manifest) => {
      const explicitlyEnabled = enabledMap.get(manifest.code) !== false;
      const hasBrokenDependency = manifest.dependencies.some(
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
  }, [manifests, enabledMap]);

  const activeCount = useMemo(
    () => runtimeState.filter((s) => s.isEnabled).length,
    [runtimeState]
  );
  const totalCount = manifests.length;

  const toggleMutation = useMutation({
    mutationFn: ({ code, enabled }: { code: string; enabled: boolean }) =>
      pluginsApi.toggle(code, enabled),
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

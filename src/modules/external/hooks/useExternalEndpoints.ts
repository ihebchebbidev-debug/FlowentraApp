import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { externalEndpointsApi } from '../services/externalEndpoints.service';
import type { ExternalEndpoint, ExternalEndpointStats, CreateExternalEndpointData, UpdateExternalEndpointData } from '../types';

export function useExternalEndpoints() {
  const { t } = useTranslation();
  const [endpoints, setEndpoints] = useState<ExternalEndpoint[]>([]);
  const [stats, setStats] = useState<ExternalEndpointStats>({ totalEndpoints: 0, activeEndpoints: 0, totalReceivedToday: 0, totalReceivedAll: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const fetchEndpoints = useCallback(async () => {
    try {
      setLoading(true);
      const [endpointsData, statsData] = await Promise.all([
        externalEndpointsApi.getAll({ search: search || undefined, status: statusFilter || undefined }),
        externalEndpointsApi.getStats(),
      ]);
      setEndpoints(endpointsData.endpoints || []);
      setStats(statsData);
    } catch {
      toast.error(t('external.toast.error'));
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, t]);

  useEffect(() => { fetchEndpoints(); }, [fetchEndpoints]);

  const createEndpoint = async (data: CreateExternalEndpointData) => {
    try {
      const endpoint = await externalEndpointsApi.create(data);
      toast.success(t('external.toast.created'), { description: t('external.toast.createdDesc') });
      fetchEndpoints();
      return endpoint;
    } catch (e: any) {
      // Show backend validation message (e.g. invalid webhook URL) instead of a generic toast.
      toast.error(t('external.toast.error'), { description: e?.message });
      throw e;
    }
  };

  const updateEndpoint = async (id: number, data: UpdateExternalEndpointData) => {
    try {
      const endpoint = await externalEndpointsApi.update(id, data);
      toast.success(t('external.toast.updated'), { description: t('external.toast.updatedDesc') });
      fetchEndpoints();
      return endpoint;
    } catch (e: any) {
      toast.error(t('external.toast.error'), { description: e?.message });
      throw e;
    }
  };

  const deleteEndpoint = async (id: number) => {
    await externalEndpointsApi.delete(id);
    toast.success(t('external.toast.deleted'), { description: t('external.toast.deletedDesc') });
    fetchEndpoints();
  };

  const regenerateKey = async (id: number) => {
    const endpoint = await externalEndpointsApi.regenerateKey(id);
    toast.success(t('external.toast.keyRegenerated'), { description: t('external.toast.keyRegeneratedDesc') });
    fetchEndpoints();
    return endpoint;
  };

  return {
    endpoints, stats, loading, search, setSearch, statusFilter, setStatusFilter,
    fetchEndpoints, createEndpoint, updateEndpoint, deleteEndpoint, regenerateKey,
  };
}

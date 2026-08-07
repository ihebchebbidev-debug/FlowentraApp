import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { externalEndpointsApi } from '../services/externalEndpoints.service';
import type { ExternalEndpointLog } from '../types';

export function useEndpointLogs(endpointId: number) {
  const { t } = useTranslation();
  const [logs, setLogs] = useState<ExternalEndpointLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const data = await externalEndpointsApi.getLogs(endpointId, page);
      setLogs(data.logs || []);
      setTotal(data.pagination?.total || 0);
    } catch {
      toast.error(t('external.toast.error'));
    } finally {
      setLoading(false);
    }
  }, [endpointId, page, t]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const deleteLog = async (logId: number) => {
    try {
      await externalEndpointsApi.deleteLog(endpointId, logId);
      toast.success(t('external.toast.logDeleted'));
      fetchLogs();
    } catch {
      toast.error(t('external.toast.error'));
    }
  };

  const clearLogs = async () => {
    try {
      await externalEndpointsApi.clearLogs(endpointId);
      toast.success(t('external.toast.logsCleared'));
      fetchLogs();
    } catch {
      toast.error(t('external.toast.error'));
    }
  };

  const markAsRead = async (logId: number) => {
    try {
      await externalEndpointsApi.markLogAsRead(endpointId, logId);
      fetchLogs();
    } catch {
      // Silently fail for mark-as-read — non-critical
    }
  };

  return { logs, loading, page, setPage, total, fetchLogs, deleteLog, clearLogs, markAsRead };
}

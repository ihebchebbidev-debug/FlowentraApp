import { useState, useEffect, useCallback, useRef } from 'react';
import { apiFetch } from '@/services/api/apiClient';
import type { ExternalApiConfig } from '../types';

interface ExternalApiResult {
  value: number | string;
  chartData: Array<{ name: string; value: number; color?: string }>;
  tableData: Array<Record<string, any>>;
  rawData: any;
  isLoading: boolean;
  error: string | null;
}

const CHART_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

/** Resolve a dot-path like "data.items" from an object */
function resolvePath(obj: any, path?: string): any {
  if (!path || !obj) return obj;
  return path.split('.').reduce((acc, key) => {
    if (acc == null) return undefined;
    // Support array index like "items.0.name"
    if (/^\d+$/.test(key)) return acc[parseInt(key)];
    // Support "length" on arrays
    if (key === 'length' && Array.isArray(acc)) return acc.length;
    return acc[key];
  }, obj);
}

export function useExternalApiData(config?: ExternalApiConfig): ExternalApiResult {
  const [result, setResult] = useState<ExternalApiResult>({
    value: 0,
    chartData: [],
    tableData: [],
    rawData: null,
    isLoading: false,
    error: null,
  });
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(async () => {
    if (!config?.url) return;

    setResult(prev => ({ ...prev, isLoading: !prev.rawData, error: null }));

    try {
      let json: any;

      // Try direct fetch first, fall back to proxy for CORS issues
      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          ...(config.headers || {}),
        };

        const res = await fetch(config.url, {
          method: config.method || 'GET',
          headers,
          body: config.method === 'POST' && config.body ? config.body : undefined,
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        json = await res.json();
      } catch (directErr) {
        // Fallback: use backend proxy to avoid CORS
        console.info('Direct fetch failed, using proxy...', directErr);
        const { data, error } = await apiFetch<any>('/api/ExternalApiProxy/fetch', {
          method: 'POST',
          body: JSON.stringify({
            url: config.url,
            method: config.method || 'GET',
            headers: config.headers,
            body: config.body,
          }),
        });
        if (error) throw new Error(error);
        json = data;
      }

      // Extract value
      let value: number | string = 0;
      if (config.valuePath) {
        const v = resolvePath(json, config.valuePath);
        value = typeof v === 'number' ? v : typeof v === 'string' ? v : JSON.stringify(v);
      } else if (typeof json === 'number') {
        value = json;
      } else if (Array.isArray(json)) {
        value = json.length;
      }

      // Extract chart/table data from array
      const dataArray = config.dataPath ? resolvePath(json, config.dataPath) : (Array.isArray(json) ? json : null);
      let chartData: ExternalApiResult['chartData'] = [];
      let tableData: ExternalApiResult['tableData'] = [];

      if (Array.isArray(dataArray)) {
        tableData = dataArray.slice(0, 50);
        
        // Build chart data using labelPath and valuePath
        chartData = dataArray.slice(0, 20).map((item, i) => ({
          name: config.labelPath ? String(resolvePath(item, config.labelPath) ?? `Item ${i + 1}`) : `Item ${i + 1}`,
          value: config.valuePath
            ? (Number(resolvePath(item, config.valuePath)) || 0)
            : (typeof item === 'number' ? item : 1),
          color: CHART_COLORS[i % CHART_COLORS.length],
        }));
      }

      setResult({
        value,
        chartData,
        tableData,
        rawData: json,
        isLoading: false,
        error: null,
      });
    } catch (err: any) {
      setResult(prev => ({
        ...prev,
        isLoading: false,
        error: err.message || 'Failed to fetch external data',
      }));
    }
  }, [config?.url, config?.method, config?.body, config?.headers, config?.valuePath, config?.labelPath, config?.dataPath]);

  useEffect(() => {
    fetchData();

    // Auto-refresh
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (config?.refreshInterval && config.refreshInterval > 0) {
      intervalRef.current = setInterval(fetchData, config.refreshInterval * 1000);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchData, config?.refreshInterval]);

  return result;
}

import { useMemo } from 'react';
import { useQueries, useQuery } from '@tanstack/react-query';
import { salesApi } from '@/services/api/salesApi';
import { customerInvoicesApi } from '@/services/api/customerInvoicesApi';
import { reconcileSaleInvoices, type ReconInvoice, type ReconResult, type ReconSale } from '../utils/reconciliation';

/**
 * Loads everything reconciliation needs for one sale: the sale with its items,
 * every invoice tied to it, and each invoice's lines (the list endpoint is not
 * guaranteed to hydrate lines, and line-level lineage checks need them).
 */
export function useSaleReconciliation(saleId: number | null) {
  const saleQuery = useQuery({
    queryKey: ['sale', 'reconciliation', saleId],
    queryFn: () => salesApi.getById(saleId as number),
    enabled: !!saleId,
  });

  const listQuery = useQuery({
    queryKey: ['customer-invoices', 'reconciliation-list', saleId],
    queryFn: () => customerInvoicesApi.list({ saleId: saleId as number, limit: 200 }),
    enabled: !!saleId,
  });

  const summaries = listQuery.data?.data ?? [];
  const needsLines = summaries.filter((i) => !i.lines || i.lines.length === 0).map((i) => i.id);

  const detailQueries = useQueries({
    queries: needsLines.map((id) => ({
      queryKey: ['customer-invoices', 'detail', id],
      queryFn: () => customerInvoicesApi.getById(id),
      staleTime: 15_000,
    })),
  });

  const detailsById = useMemo(() => {
    const map = new Map<number, ReconInvoice>();
    detailQueries.forEach((q) => {
      if (q.data) map.set(q.data.id, q.data as ReconInvoice);
    });
    return map;
  }, [detailQueries]);

  const result: ReconResult | null = useMemo(() => {
    if (!saleQuery.data) return null;
    const invoices: ReconInvoice[] = summaries.map((s) => detailsById.get(s.id) ?? (s as ReconInvoice));
    return reconcileSaleInvoices({ sale: saleQuery.data as unknown as ReconSale, invoices });
  }, [saleQuery.data, summaries, detailsById]);

  const isLoading =
    saleQuery.isLoading || listQuery.isLoading || detailQueries.some((q) => q.isLoading);

  return {
    result,
    sale: saleQuery.data ?? null,
    isLoading,
    isError: saleQuery.isError || listQuery.isError,
    error: (saleQuery.error || listQuery.error) as Error | null,
    refetch: () => {
      saleQuery.refetch();
      listQuery.refetch();
    },
  };
}

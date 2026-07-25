import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { customerInvoicesApi } from '@/services/api/customerInvoicesApi';
import type { InvoiceQueryParams } from '../types';

const KEY = 'customer-invoices';

export function useCustomerInvoicesList(params: InvoiceQueryParams) {
  return useQuery({
    queryKey: [KEY, 'list', params],
    queryFn: () => customerInvoicesApi.list(params),
    staleTime: 30_000,
  });
}

export function useCustomerInvoice(id: number | null) {
  return useQuery({
    queryKey: [KEY, 'detail', id],
    queryFn: () => customerInvoicesApi.getById(id as number),
    enabled: !!id,
  });
}

export function useInvoiceActivities(id: number | null) {
  return useQuery({
    queryKey: [KEY, 'activities', id],
    queryFn: () => customerInvoicesApi.getActivities(id as number),
    enabled: !!id,
    staleTime: 15_000,
  });
}

export function useInvoiceMutations() {
  const qc = useQueryClient();
  const { t } = useTranslation('invoices');
  const inv = () => {
    qc.invalidateQueries({ queryKey: [KEY] });
    // Invoicing changes a sale's invoiced/partially-invoiced state server-side,
    // so any cached sales list or detail is now stale.
    qc.invalidateQueries({
      predicate: (q) => typeof q.queryKey[0] === 'string' && (q.queryKey[0] as string).startsWith('sale'),
    });
  };
  // Surface the server's explanation (over-invoicing, already invoiced, ...)
  // instead of a generic failure toast.
  const msg = (e: any, fallback: string) => {
    const detail = e?.response?.data?.message || e?.response?.data?.error || e?.message;
    return typeof detail === 'string' && detail.trim() ? detail : fallback;
  };
  return {
    createFromSale: useMutation({
      mutationFn: (v: { saleId: number; serviceOrderId?: number }) =>
        customerInvoicesApi.createFromSale(v.saleId, v.serviceOrderId),
      onSuccess: () => { toast.success(t('toast.created')); inv(); },
      onError: (e: any) => toast.error(msg(e, t('toast.create_failed'))),
    }),
    post: useMutation({
      mutationFn: (id: number) => customerInvoicesApi.post(id),
      onSuccess: () => { toast.success(t('toast.posted')); inv(); },
      onError: (e: any) => toast.error(msg(e, t('toast.post_failed'))),
    }),
    void: useMutation({
      mutationFn: (v: { id: number; reason: string }) => customerInvoicesApi.void(v.id, { reason: v.reason }),
      onSuccess: () => { toast.success(t('toast.voided')); inv(); },
      onError: (e: any) => toast.error(msg(e, t('toast.void_failed'))),
    }),
    markPaid: useMutation({
      mutationFn: (v: { id: number; memo: string }) => customerInvoicesApi.markPaid(v.id, { memo: v.memo }),
      onSuccess: () => { toast.success(t('toast.marked_paid')); inv(); },
      onError: (e: any) => toast.error(msg(e, t('toast.mark_paid_failed'))),
    }),
    reopen: useMutation({
      mutationFn: (v: { id: number; memo: string }) => customerInvoicesApi.reopen(v.id, { memo: v.memo }),
      onSuccess: () => { toast.success(t('toast.reopened')); inv(); },
      onError: (e: any) => toast.error(msg(e, t('toast.reopen_failed'))),
    }),
    remove: useMutation({
      mutationFn: (id: number) => customerInvoicesApi.remove(id),
      onSuccess: () => { toast.success(t('toast.deleted')); inv(); },
      onError: (e: any) => toast.error(msg(e, t('toast.delete_failed'))),
    }),
  };
}


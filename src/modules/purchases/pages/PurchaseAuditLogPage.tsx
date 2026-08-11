import { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Clock } from "lucide-react";
import { purchaseActivityService } from "../services/purchaseService";
import { PurchasePageHeader } from "../components/PurchasePageHeader";
import { PurchaseErrorBoundary, PurchaseErrorFallback } from "../components/PurchaseErrorBoundary";
import { ListTableSkeleton } from "../components/PurchaseSkeletons";
import type { PurchaseActivity } from "../types";
import { SortableHeader } from "@/components/shared/SortableHeader";
import { useTableSort } from "@/hooks/useTableSort";

const ACTION_COLORS: Record<string, string> = {
  created: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  status_changed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  sent: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  paid: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  deleted: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

const PAGE_SIZE = 50;

function PurchaseAuditLogContent() {
  const { t } = useTranslation('purchases');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [activities, setActivities] = useState<PurchaseActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Debounce the search box so typing doesn't hammer the API.
  useEffect(() => {
    const id = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(id);
  }, [search]);

  // Single server-paged call against the dedicated cross-entity audit endpoint.
  // (Previously this page fetched 50 orders and then fanned out 10 per-order
  // activity requests, so it only ever showed a slice of the history.)
  const fetchActivities = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const result = await purchaseActivityService.getAll({
        search: debouncedSearch || undefined,
        page,
        limit: PAGE_SIZE,
      });
      setActivities(result?.activities ?? []);
      setTotal(result?.pagination?.total ?? 0);
      setTotalPages(result?.pagination?.totalPages ?? 0);
    } catch (e: any) {
      setError(e?.message || t('common.loadError', 'Failed to load'));
    } finally {
      setLoading(false);
    }
  }, [t, debouncedSearch, page]);

  useEffect(() => { fetchActivities(); }, [fetchActivities]);

  const { sortKey, sortDirection, toggleSort, sortItems } = useTableSort<PurchaseActivity>({
    dateTime: (a) => a.performedAt,
    user: (a) => a.performedByName,
    entityType: (a) => a.entityType,
    action: (a) => a.activityType,
    description: (a) => a.description,
  });
  const filtered = useMemo(() => sortItems(activities), [activities, sortItems]);



  return (
    <div className="flex flex-col">
      <PurchasePageHeader
        title={t('auditLog.title')}
        subtitle={t('auditLog.subtitle')}
        icon={Clock}
        backTo={{ to: '/dashboard/purchases', label: t('dashboard.title') }}
      />

      <div className="p-4 md:p-6 space-y-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder={t('auditLog.searchPlaceholder')} value={search} onChange={e => setSearch(e.target.value)} className="ps-8 h-8" />
        </div>

        {loading && <ListTableSkeleton columns={5} rows={8} />}

        {!loading && error && (
          <PurchaseErrorFallback error={error} onRetry={fetchActivities} backTo="/dashboard/purchases" />
        )}

        {!loading && !error && (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <SortableHeader columnKey="dateTime" sortKey={sortKey} sortDirection={sortDirection} onSort={toggleSort} className="text-xs">{t('auditLog.dateTime')}</SortableHeader>
                    <SortableHeader columnKey="user" sortKey={sortKey} sortDirection={sortDirection} onSort={toggleSort} className="text-xs">{t('auditLog.user')}</SortableHeader>
                    <SortableHeader columnKey="entityType" sortKey={sortKey} sortDirection={sortDirection} onSort={toggleSort} className="text-xs">{t('auditLog.entityType')}</SortableHeader>
                    <SortableHeader columnKey="action" sortKey={sortKey} sortDirection={sortDirection} onSort={toggleSort} className="text-xs">{t('auditLog.action')}</SortableHeader>
                    <SortableHeader columnKey="description" sortKey={sortKey} sortDirection={sortDirection} onSort={toggleSort} className="text-xs">{t('auditLog.description')}</SortableHeader>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(a => (
                    <TableRow key={a.id}>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{new Date(a.performedAt).toLocaleString()}</TableCell>
                      <TableCell className="text-xs">{a.performedByName}</TableCell>
                      <TableCell><Badge variant="outline" className="text-px-10">{t(`auditLog.entity.${a.entityType}`, a.entityType)}</Badge></TableCell>
                      <TableCell><Badge variant="secondary" className={`text-px-10 ${ACTION_COLORS[a.activityType] || ''}`}>{t(`auditLog.actionLabel.${a.activityType}`, a.activityType?.replace(/_/g, ' ') || '—')}</Badge></TableCell>
                      <TableCell className="text-xs max-w-[300px] truncate">{a.description}</TableCell>
                    </TableRow>
                  ))}
                  {filtered.length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-8 text-sm text-muted-foreground">{t('auditLog.empty')}</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {!loading && !error && totalPages > 1 && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {t('auditLog.pageInfo', 'Page {{page}} of {{totalPages}} — {{total}} entries', { page, totalPages, total })}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
              >
                {t('common.previous', 'Previous')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              >
                {t('common.next', 'Next')}
              </Button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default function PurchaseAuditLogPage() {
  return (
    <PurchaseErrorBoundary backTo="/dashboard/purchases">
      <PurchaseAuditLogContent />
    </PurchaseErrorBoundary>
  );
}

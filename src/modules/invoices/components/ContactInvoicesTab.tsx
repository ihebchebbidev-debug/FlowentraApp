import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { format as formatDate } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { ArrowDown, ArrowUp, ArrowUpDown, CalendarIcon, FileText, PlusCircle, Receipt, Search, X } from 'lucide-react';
import { useCustomerInvoicesList } from '../hooks/useCustomerInvoices';
import type { InvoiceStatus } from '../types';
import { useCurrency } from '@/shared/hooks/useCurrency';
import { InvoiceDetailDrawer } from './InvoiceDetailDrawer';
import { CreateInvoiceFromSaleDialog } from './CreateInvoiceFromSaleDialog';

const STATUS_TABS: Array<InvoiceStatus | 'all'> = ['all', 'draft', 'posted', 'paid', 'void'];

const STATUS_COLOR: Record<InvoiceStatus, string> = {
  draft: 'bg-muted text-muted-foreground',
  posted: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  paid: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  void: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
};

type SortableColumn = 'invoiceNumber' | 'issueDate' | 'grandTotal' | 'amountPaid' | 'amountDue' | 'status';

interface ContactInvoicesTabProps {
  contactId: number;
}

export function ContactInvoicesTab({ contactId }: ContactInvoicesTabProps) {
  const { t } = useTranslation('invoices');
  const { format } = useCurrency();

  const [status, setStatus] = useState<InvoiceStatus | 'all'>('all');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [sortBy, setSortBy] = useState<SortableColumn>('issueDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);

  const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const params = useMemo(
    () => ({
      contactId,
      status,
      search: search || undefined,
      dateFrom: dateFrom ? formatDate(dateFrom, 'yyyy-MM-dd') : undefined,
      dateTo: dateTo ? formatDate(dateTo, 'yyyy-MM-dd') : undefined,
      sortBy,
      sortOrder,
      page,
      limit: 10,
    }),
    [contactId, status, search, dateFrom, dateTo, sortBy, sortOrder, page],
  );

  const { data, isLoading } = useCustomerInvoicesList(params);

  const invoices = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;
  const totalItems = data?.totalItems ?? 0;

  const toggleSort = (col: SortableColumn) => {
    if (sortBy === col) {
      setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(col);
      setSortOrder('desc');
    }
    setPage(1);
  };

  const SortIcon = ({ col }: { col: SortableColumn }) => {
    if (sortBy !== col) return <ArrowUpDown className="ml-1 h-3.5 w-3.5 opacity-50" />;
    return sortOrder === 'asc'
      ? <ArrowUp className="ml-1 h-3.5 w-3.5" />
      : <ArrowDown className="ml-1 h-3.5 w-3.5" />;
  };

  const hasFilters = search || dateFrom || dateTo || status !== 'all';

  const clearFilters = () => {
    setSearchInput('');
    setSearch('');
    setDateFrom(undefined);
    setDateTo(undefined);
    setStatus('all');
    setPage(1);
  };

  return (
    <Card className="shadow-card border-0">
      <CardContent className="pt-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Tabs value={status} onValueChange={(v) => { setStatus(v as InvoiceStatus | 'all'); setPage(1); }}>
            <TabsList>
              {STATUS_TABS.map((s) => (
                <TabsTrigger key={s} value={s}>{t(`status.${s}`)}</TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <Button size="sm" className="gap-2 w-full sm:w-auto" onClick={() => setCreateOpen(true)}>
            <PlusCircle className="h-4 w-4" />
            {t('actions.new_from_sale')}
          </Button>
        </div>

        {/* Filters row */}
        <div className="flex flex-col md:flex-row md:items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={t('search_placeholder')}
              className="pl-9"
            />
          </div>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn('justify-start text-left font-normal gap-2', !dateFrom && 'text-muted-foreground')}
              >
                <CalendarIcon className="h-4 w-4" />
                {dateFrom ? formatDate(dateFrom, 'PP') : t('filters.date_from')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dateFrom}
                onSelect={(d) => { setDateFrom(d ?? undefined); setPage(1); }}
                initialFocus
                className={cn('p-3 pointer-events-auto')}
              />
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn('justify-start text-left font-normal gap-2', !dateTo && 'text-muted-foreground')}
              >
                <CalendarIcon className="h-4 w-4" />
                {dateTo ? formatDate(dateTo, 'PP') : t('filters.date_to')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dateTo}
                onSelect={(d) => { setDateTo(d ?? undefined); setPage(1); }}
                initialFocus
                disabled={(d) => (dateFrom ? d < dateFrom : false)}
                className={cn('p-3 pointer-events-auto')}
              />
            </PopoverContent>
          </Popover>

          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1">
              <X className="h-4 w-4" />
              {t('filters.clear')}
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="py-8 text-center text-sm text-muted-foreground">…</div>
        ) : invoices.length === 0 ? (
          <div className="text-center py-8">
            <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">
              {hasFilters ? t('empty_filtered') : t('empty')}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <button className="inline-flex items-center hover:text-foreground" onClick={() => toggleSort('invoiceNumber')}>
                        {t('columns.number')} <SortIcon col="invoiceNumber" />
                      </button>
                    </TableHead>
                    <TableHead>
                      <button className="inline-flex items-center hover:text-foreground" onClick={() => toggleSort('issueDate')}>
                        {t('columns.issue_date')} <SortIcon col="issueDate" />
                      </button>
                    </TableHead>
                    <TableHead className="text-right">
                      <button className="inline-flex items-center hover:text-foreground" onClick={() => toggleSort('grandTotal')}>
                        {t('columns.total')} <SortIcon col="grandTotal" />
                      </button>
                    </TableHead>
                    <TableHead className="text-right">
                      <button className="inline-flex items-center hover:text-foreground" onClick={() => toggleSort('amountPaid')}>
                        {t('columns.paid')} <SortIcon col="amountPaid" />
                      </button>
                    </TableHead>
                    <TableHead className="text-right">
                      <button className="inline-flex items-center hover:text-foreground" onClick={() => toggleSort('amountDue')}>
                        {t('columns.due')} <SortIcon col="amountDue" />
                      </button>
                    </TableHead>
                    <TableHead>
                      <button className="inline-flex items-center hover:text-foreground" onClick={() => toggleSort('status')}>
                        {t('columns.status')} <SortIcon col="status" />
                      </button>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((inv) => (
                    <TableRow
                      key={inv.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setSelectedInvoiceId(inv.id)}
                    >
                      <TableCell className="font-medium">
                        <span className="inline-flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          {inv.invoiceNumber || t('detail.no_number_yet')}
                        </span>
                      </TableCell>
                      <TableCell>{inv.issueDate ? new Date(inv.issueDate).toLocaleDateString() : '—'}</TableCell>
                      <TableCell className="text-right">{format(inv.grandTotal)} {inv.currency}</TableCell>
                      <TableCell className="text-right">{format(inv.amountPaid)} {inv.currency}</TableCell>
                      <TableCell className="text-right">{format(inv.amountDue)} {inv.currency}</TableCell>
                      <TableCell>
                        <Badge className={STATUS_COLOR[inv.status]} variant="secondary">
                          {t(`status.${inv.status}`)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{t('pagination.summary', { count: invoices.length, total: totalItems })}</span>
              <span>{t('pagination.page_of', { page, total: totalPages })}</span>
            </div>
          </>
        )}

        {totalPages > 1 && (
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className={page <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <PaginationItem key={p}>
                  <PaginationLink isActive={p === page} onClick={() => setPage(p)} className="cursor-pointer">
                    {p}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className={page >= totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </CardContent>

      <InvoiceDetailDrawer
        invoiceId={selectedInvoiceId}
        open={selectedInvoiceId !== null}
        onOpenChange={(open) => { if (!open) setSelectedInvoiceId(null); }}
      />

      <CreateInvoiceFromSaleDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        contactId={contactId}
        onCreated={(id) => { setCreateOpen(false); setSelectedInvoiceId(id); }}
      />
    </Card>
  );
}

export default ContactInvoicesTab;

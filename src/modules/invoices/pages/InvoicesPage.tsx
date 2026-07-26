import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { format as formatDate } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CollapsibleSearch } from '@/components/ui/collapsible-search';
import { SimplePaginationBar } from '@/components/shared/SimplePaginationBar';
import { TableRowActions } from '@/shared/components/TableRowActions';
import { CreateActionButton } from '@/components/CreateActionButton';
import { cn } from '@/lib/utils';
import {
  Receipt, Plus, Search, Filter, List, Table as TableIcon,
  CalendarIcon, X, FileText, Eye, Trash2, ExternalLink,
  CircleDollarSign, CheckCircle2, Wallet, AlertTriangle, Play,
} from 'lucide-react';
import { useCustomerInvoicesList, useInvoiceMutations } from '../hooks/useCustomerInvoices';
import { customerInvoicesApi } from '@/services/api/customerInvoicesApi';
import type { InvoiceStatus } from '../types';
import { useCurrency } from '@/shared/hooks/useCurrency';
import { CreateInvoiceGlobalDialog } from '../components/CreateInvoiceGlobalDialog';
import { InvoicesAutopilotDemo } from '../components/onboarding/InvoicesAutopilotDemo';
import { getInitialViewMode } from '@/hooks/getInitialViewMode';
import { usePermissions } from '@/hooks/usePermissions';

type StatusFilter = InvoiceStatus | 'all' | 'overdue';
const STATUS_TABS: StatusFilter[] = ['all', 'draft', 'posted', 'paid', 'overdue', 'void'];

const STATUS_COLOR: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  posted: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  paid: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  void: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  overdue: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
};

export function InvoicesPage() {
  const { t } = useTranslation('invoices');
  const { format } = useCurrency();
  const navigate = useNavigate();
  const { remove } = useInvoiceMutations();
  const { canCreate, canDelete, isMainAdmin } = usePermissions();
  const canCreateInvoice = isMainAdmin || canCreate('sales');
  const canDeleteInvoice = isMainAdmin || canDelete('sales');

  const [viewMode, setViewMode] = useState<'list' | 'table'>(
    () => getInitialViewMode(['list', 'table'] as const, 'table'),
  );
  const [status, setStatus] = useState<StatusFilter>('all');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [showFilterBar, setShowFilterBar] = useState(false);
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);

  useEffect(() => {
    const h = setTimeout(() => { setSearch(searchInput.trim()); setPage(1); }, 300);
    return () => clearTimeout(h);
  }, [searchInput]);

  const params = useMemo(() => ({
    status,
    search: search || undefined,
    dateFrom: dateFrom ? formatDate(dateFrom, 'yyyy-MM-dd') : undefined,
    dateTo: dateTo ? formatDate(dateTo, 'yyyy-MM-dd') : undefined,
    sortBy: 'issue_date' as const,
    sortOrder: 'desc' as const,
    page,
    limit: 20,
  }), [status, search, dateFrom, dateTo, page]);

  const { data, isLoading } = useCustomerInvoicesList(params);
  const invoices = data?.data ?? [];
  const totalItems = data?.totalItems ?? 0;
  const totalPages = data?.totalPages ?? 1;

  // Aggregated stats (independent of page)
  const [stats, setStats] = useState({ invoiced: 0, outstanding: 0, paid: 0, overdue: 0 });
  useEffect(() => {
    let cancelled = false;
    Promise.all([
      customerInvoicesApi.list({ limit: 200, status: 'posted' }),
      customerInvoicesApi.list({ limit: 200, status: 'paid' }),
      customerInvoicesApi.list({ limit: 200, status: 'overdue' as InvoiceStatus }),
    ]).then(([posted, paid, overdue]) => {
      if (cancelled) return;
      const invoicedSum = [...posted.data, ...paid.data].reduce((s, i) => s + i.grandTotal, 0);
      const outstandingSum = [...posted.data, ...overdue.data].reduce((s, i) => s + (i.amountDue ?? 0), 0);
      const paidSum = paid.data.reduce((s, i) => s + i.amountPaid, 0);
      setStats({
        invoiced: invoicedSum,
        outstanding: outstandingSum,
        paid: paidSum,
        overdue: overdue.totalItems ?? overdue.data.length,
      });
    }).catch(() => { /* ignore */ });
    return () => { cancelled = true; };
  }, [data]);

  const activeFilterCount =
    (status !== 'all' ? 1 : 0) + (dateFrom ? 1 : 0) + (dateTo ? 1 : 0);
  const hasFilters = activeFilterCount > 0 || !!search;
  const clearFilters = () => {
    setSearchInput(''); setSearch(''); setDateFrom(undefined); setDateTo(undefined);
    setStatus('all'); setPage(1);
  };

  const statsData = [
    { label: t('stats.total_invoiced'), value: format(stats.invoiced), icon: CircleDollarSign, color: 'chart-1', filter: 'all' as StatusFilter },
    { label: t('stats.outstanding'),    value: format(stats.outstanding), icon: Wallet,          color: 'chart-2', filter: 'posted' as StatusFilter },
    { label: t('stats.paid'),           value: format(stats.paid),        icon: CheckCircle2,     color: 'chart-3', filter: 'paid' as StatusFilter },
    { label: t('stats.overdue'),        value: String(stats.overdue),     icon: AlertTriangle,    color: 'chart-4', filter: 'overdue' as StatusFilter },
  ];

  const startIndex = totalItems === 0 ? 0 : (page - 1) * 20 + 1;
  const endIndex = Math.min(page * 20, totalItems);

  const rowActions = (inv: any) => [
    { icon: Eye, label: t('actions.view', 'View'), onClick: (e: any) => { e.stopPropagation(); navigate(`/dashboard/invoices/${inv.id}`); } },
    ...(inv.saleId ? [{ icon: ExternalLink, label: t('actions.open_sale'), onClick: (e: any) => { e.stopPropagation(); navigate(`/dashboard/sales/${inv.saleId}`); } }] : []),
    ...(inv.status === 'draft' && canDeleteInvoice ? [{ icon: Trash2, label: t('actions.delete'), variant: 'destructive' as const, onClick: (e: any) => { e.stopPropagation(); remove.mutate(inv.id); } }] : []),
  ];

  return (
    <div className="flex flex-col">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between gap-2 p-3 border-b border-border bg-card/50 backdrop-blur">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
            <Receipt className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base font-semibold text-foreground truncate">{t('title')}</h1>
            <p className="text-px-10 text-muted-foreground truncate">{t('page.subtitle')}</p>
          </div>
        </div>
        {canCreateInvoice && (
          <CreateActionButton
            size="sm"
            className="gradient-primary text-primary-foreground shadow-medium hover-lift flex-shrink-0"
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="h-4 w-4" />
          </CreateActionButton>
        )}
      </div>

      {/* Desktop Header */}
      <div className="hidden md:flex items-center justify-between p-4 border-b border-border bg-card/50 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Receipt className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground">{t('title')}</h1>
            <p className="text-px-11 text-muted-foreground">{t('page.subtitle')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setDemoOpen(true)} className="hidden sm:inline-flex gap-1.5">
            <Play className="h-3.5 w-3.5" /> {t('watchDemo', 'Watch Demo')}
          </Button>
          {canCreateInvoice && (
            <CreateActionButton
              className="bg-primary text-white hover:bg-primary/90 shadow-medium hover-lift"
              onClick={() => setCreateOpen(true)}
            >
              <Plus className="h-4 w-4 text-white mr-2" />
              {t('actions.new_from_sale')}
            </CreateActionButton>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="p-3 sm:p-4 border-b border-border">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {statsData.map((stat, i) => {
            const isSelected = status === stat.filter;
            return (
              <Card
                key={i}
                className={cn(
                  'shadow-card hover-lift gradient-card group cursor-pointer transition-all hover:shadow-lg',
                  isSelected ? 'border-2 border-primary bg-primary/5' : 'border-0',
                )}
                onClick={() => { setStatus(stat.filter); setPage(1); }}
              >
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={cn(
                        'p-2 rounded-lg transition-all flex-shrink-0',
                        isSelected ? 'bg-primary/20' : `bg-${stat.color}/10 group-hover:bg-${stat.color}/20`,
                      )}>
                        <stat.icon className={cn('h-4 w-4', isSelected ? 'text-primary' : `text-${stat.color}`)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground font-medium truncate">{stat.label}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-foreground">{stat.value}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Search + view mode */}
      <div className="p-3 sm:p-4 border-b border-border bg-card">
        <div className="flex flex-col gap-3 sm:flex-row sm:gap-4 sm:items-center sm:justify-between">
          <div className="flex gap-2 sm:gap-3 flex-1 w-full items-center">
            <div className="flex-1">
              <CollapsibleSearch
                placeholder={t('search_placeholder')}
                value={searchInput}
                onChange={setSearchInput}
                className="w-full"
              />
            </div>
            <Button variant="outline" size="sm" className="gap-1 sm:gap-2 px-2 sm:px-3" onClick={() => setShowFilterBar(s => !s)}>
              <Filter className="h-4 w-4" />
              <span className="hidden sm:inline">{t('filters.title', 'Filters')}</span>
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-4 px-1 text-xs">{activeFilterCount}</Badge>
              )}
            </Button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
              className={cn('flex-1 sm:flex-none', viewMode === 'list' && 'bg-primary text-white hover:bg-primary/90')}
            >
              <List className={cn('h-4 w-4', viewMode === 'list' && 'text-white')} />
            </Button>
            <Button
              variant={viewMode === 'table' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('table')}
              className={cn('flex-1 sm:flex-none', viewMode === 'table' && 'bg-primary text-white hover:bg-primary/90')}
            >
              <TableIcon className={cn('h-4 w-4', viewMode === 'table' && 'text-white')} />
            </Button>
          </div>
        </div>
      </div>

      {/* Filter bar */}
      {showFilterBar && (
        <div className="p-3 sm:p-4 border-b border-border bg-card">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">{t('columns.status')}</label>
              <Select value={status} onValueChange={(v) => { setStatus(v as StatusFilter); setPage(1); }}>
                <SelectTrigger className="h-9 bg-background"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-popover border shadow-md z-50">
                  {STATUS_TABS.map(s => (
                    <SelectItem key={s} value={s}>{t(`status.${s}`)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">{t('filters.date_from')}</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className={cn('h-9 justify-start text-left font-normal gap-2', !dateFrom && 'text-muted-foreground')}>
                    <CalendarIcon className="h-4 w-4" />
                    {dateFrom ? formatDate(dateFrom, 'PP') : t('filters.date_from')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={dateFrom} onSelect={(d) => { setDateFrom(d ?? undefined); setPage(1); }} initialFocus className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">{t('filters.date_to')}</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className={cn('h-9 justify-start text-left font-normal gap-2', !dateTo && 'text-muted-foreground')}>
                    <CalendarIcon className="h-4 w-4" />
                    {dateTo ? formatDate(dateTo, 'PP') : t('filters.date_to')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={dateTo} onSelect={(d) => { setDateTo(d ?? undefined); setPage(1); }} initialFocus disabled={(d) => dateFrom ? d < dateFrom : false} className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
            {hasFilters && (
              <div className="flex items-end">
                <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9 text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4 mr-1" />
                  {t('filters.clear')}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      {viewMode === 'list' ? (
        <div className="p-3 sm:p-4 lg:p-6">
          <Card className="shadow-card border-0 bg-card text-rem-85">
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-10 text-center text-sm text-muted-foreground">{t('loading')}</div>
              ) : invoices.length === 0 ? (
                <div className="p-12 text-center">
                  <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">{t('empty_global_title', 'No invoices')}</h3>
                  <p className="text-muted-foreground">{hasFilters ? t('empty_filtered') : t('empty_global')}</p>
                </div>
              ) : (
                <>
                  <SimplePaginationBar
                    startIndex={startIndex} endIndex={endIndex} totalItems={totalItems}
                    currentPage={page} totalPages={totalPages}
                    hasPreviousPage={page > 1} hasNextPage={page < totalPages}
                    onPreviousPage={() => setPage(p => Math.max(1, p - 1))}
                    onNextPage={() => setPage(p => Math.min(totalPages, p + 1))}
                  />
                  <div className="list-editorial">
                    {invoices.map((inv) => (
                      <div key={inv.id} className="list-row-editorial" onClick={() => navigate(`/dashboard/invoices/${inv.id}`)}>
                        <div className="flex items-start gap-3 mb-2.5">
                          <div className="list-row-avatar mt-0.5">
                            <Receipt className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className="list-row-title flex-1">{inv.invoiceNumber || t('detail.no_number_yet')}</p>
                              <Badge className={cn(STATUS_COLOR[inv.status], 'text-px-10 px-2 py-0.5 shrink-0')} variant="secondary">
                                {t(`status.${inv.status}`)}
                              </Badge>
                            </div>
                            <p className="list-row-subtitle">
                              {inv.contactName || `#${inv.contactId}`}
                              {inv.saleNumber && ` · ${t('columns.sale')} ${inv.saleNumber}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pl-[52px] mb-3">
                          {inv.issueDate && (
                            <div className="list-row-meta-item">
                              <CalendarIcon className="h-3.5 w-3.5 shrink-0" />
                              <span>{new Date(inv.issueDate).toLocaleDateString()}</span>
                            </div>
                          )}
                          {inv.dueDate && (
                            <div className="list-row-meta-item">
                              <span className="text-muted-foreground">{t('columns.due_date')}:</span>
                              <span>{new Date(inv.dueDate).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center justify-between pl-[52px]" onClick={e => e.stopPropagation()}>
                          <span className="list-row-amount">
                            {format(inv.grandTotal)} {inv.currency}
                            {inv.amountDue > 0 && (
                              <span className="ml-2 text-xs text-muted-foreground">
                                · {t('columns.due')}: {format(inv.amountDue)} {inv.currency}
                              </span>
                            )}
                          </span>
                          <div className="ml-auto">
                            <TableRowActions actions={rowActions(inv)} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <SimplePaginationBar
                    startIndex={startIndex} endIndex={endIndex} totalItems={totalItems}
                    currentPage={page} totalPages={totalPages}
                    hasPreviousPage={page > 1} hasNextPage={page < totalPages}
                    onPreviousPage={() => setPage(p => Math.max(1, p - 1))}
                    onNextPage={() => setPage(p => Math.min(totalPages, p + 1))}
                  />
                </>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="p-3 sm:p-4 lg:p-6">
          <Card className="shadow-card border-0 bg-card">
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-10 text-center text-sm text-muted-foreground">{t('loading')}</div>
              ) : invoices.length === 0 ? (
                <div className="p-12 text-center">
                  <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">{t('empty_global_title', 'No invoices')}</h3>
                  <p className="text-muted-foreground">{hasFilters ? t('empty_filtered') : t('empty_global')}</p>
                </div>
              ) : (
                <>
                  <SimplePaginationBar
                    startIndex={startIndex} endIndex={endIndex} totalItems={totalItems}
                    currentPage={page} totalPages={totalPages}
                    hasPreviousPage={page > 1} hasNextPage={page < totalPages}
                    onPreviousPage={() => setPage(p => Math.max(1, p - 1))}
                    onNextPage={() => setPage(p => Math.min(totalPages, p + 1))}
                  />
                  <div className="overflow-x-auto w-full" style={{ WebkitOverflowScrolling: 'touch' }}>
                    <Table className="min-w-[720px]">
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[220px]">{t('columns.number')}</TableHead>
                          <TableHead>{t('columns.contact')}</TableHead>
                          <TableHead>{t('columns.sale')}</TableHead>
                          <TableHead>{t('columns.issue_date')}</TableHead>
                          <TableHead>{t('columns.due_date')}</TableHead>
                          <TableHead className="text-right">{t('columns.total')}</TableHead>
                          <TableHead className="text-right">{t('columns.due')}</TableHead>
                          <TableHead>{t('columns.status')}</TableHead>
                          <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {invoices.map((inv) => (
                          <TableRow key={inv.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/dashboard/invoices/${inv.id}`)}>
                            <TableCell className="font-medium">
                              <span className="inline-flex items-center gap-2">
                                <FileText className="h-4 w-4 text-muted-foreground" />
                                {inv.invoiceNumber || t('detail.no_number_yet')}
                              </span>
                            </TableCell>
                            <TableCell className="text-sm">{inv.contactName || `#${inv.contactId}`}</TableCell>
                            <TableCell className="text-sm">
                              {inv.saleId ? (
                                <button className="text-primary hover:underline" onClick={(e) => { e.stopPropagation(); navigate(`/dashboard/sales/${inv.saleId}`); }}>
                                  {inv.saleNumber || `#${inv.saleId}`}
                                </button>
                              ) : '—'}
                            </TableCell>
                            <TableCell>{inv.issueDate ? new Date(inv.issueDate).toLocaleDateString() : '—'}</TableCell>
                            <TableCell>{inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : '—'}</TableCell>
                            <TableCell className="text-right">{format(inv.grandTotal)} {inv.currency}</TableCell>
                            <TableCell className="text-right">{format(inv.amountDue)} {inv.currency}</TableCell>
                            <TableCell>
                              <Badge className={STATUS_COLOR[inv.status]} variant="secondary">{t(`status.${inv.status}`)}</Badge>
                            </TableCell>
                            <TableCell onClick={e => e.stopPropagation()}>
                              <TableRowActions actions={rowActions(inv)} />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <SimplePaginationBar
                    startIndex={startIndex} endIndex={endIndex} totalItems={totalItems}
                    currentPage={page} totalPages={totalPages}
                    hasPreviousPage={page > 1} hasNextPage={page < totalPages}
                    onPreviousPage={() => setPage(p => Math.max(1, p - 1))}
                    onNextPage={() => setPage(p => Math.min(totalPages, p + 1))}
                  />
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <CreateInvoiceGlobalDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={(id) => { setCreateOpen(false); navigate(`/dashboard/invoices/${id}`); }}
      />

      <InvoicesAutopilotDemo open={demoOpen} onClose={() => setDemoOpen(false)} />
    </div>
  );
}

export default InvoicesPage;

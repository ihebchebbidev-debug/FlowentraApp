import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CollapsibleSearch } from '@/components/ui/collapsible-search';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageSizeSelector } from '@/components/shared/PageSizeSelector';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import {
  Ticket,
  Plus,
  Filter,
  X,
  Inbox,
  Loader2,
  LayoutDashboard,
  CalendarDays,
  Paperclip,
  RefreshCw,
} from 'lucide-react';
import { useTicketsData } from '../hooks/useTicketsData';
import { STATUS_CONFIG, TicketStatusBadge, TicketUrgencyBadge } from '../components/TicketStatusBadge';
import { useTableSort } from '@/hooks/useTableSort';
import { SortableHeader } from '@/components/shared/SortableHeader';

export default function MyTicketsPage() {
  const { t } = useTranslation('support');
  const navigate = useNavigate();
  const { list, loading, refresh } = useTicketsData({ scope: 'user' });

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [urgencyFilter, setUrgencyFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showFilterBar, setShowFilterBar] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const categories = useMemo(
    () => Array.from(new Set(list.map((t) => t.category).filter(Boolean))) as string[],
    [list]
  );

  const filtered = useMemo(() => {
    return list
      .filter((tk) => {
        if (statusFilter !== 'all' && tk.status !== statusFilter) return false;
        if (urgencyFilter !== 'all' && tk.urgency !== urgencyFilter) return false;
        if (categoryFilter !== 'all' && tk.category !== categoryFilter) return false;
        if (search) {
          const q = search.toLowerCase();
          return (
            tk.title.toLowerCase().includes(q) ||
            tk.description.toLowerCase().includes(q) ||
            `#${tk.id}`.includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [list, statusFilter, urgencyFilter, categoryFilter, search]);

  const { sortKey, sortDirection, toggleSort, sortItems } = useTableSort<typeof filtered[number]>({
    id: (tk) => tk.id,
    title: (tk) => tk.title,
    category: (tk) => tk.category,
    urgency: (tk) => tk.urgency,
    status: (tk) => tk.status,
  });
  const sortedFiltered = useMemo(() => sortItems(filtered), [filtered, sortItems]);

  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const pageSafe = Math.min(page, totalPages);
  const startIndex = (pageSafe - 1) * pageSize;
  const paginated = sortedFiltered.slice(startIndex, startIndex + pageSize);

  const activeFilterCount =
    (statusFilter !== 'all' ? 1 : 0) +
    (urgencyFilter !== 'all' ? 1 : 0) +
    (categoryFilter !== 'all' ? 1 : 0);

  const clearFilters = () => {
    setStatusFilter('all');
    setUrgencyFilter('all');
    setCategoryFilter('all');
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-4 border-b border-border bg-card/50 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Ticket className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground">
              {t('myTickets.title', 'My tickets')}
            </h1>
            <p className="text-px-11 text-muted-foreground">
              {t('myTickets.subtitle', 'Requests you have submitted')}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {t('admin.refresh', 'Refresh')}
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate('/support/tickets/dashboard')}>
            <LayoutDashboard className="h-4 w-4 mr-2" />
            {t('dashboard.actions.viewDashboard', 'Dashboard')}
          </Button>
          <Button size="sm" onClick={() => navigate('/support/tickets/new')}>
            <Plus className="h-4 w-4 mr-2" />
            {t('myTickets.new', 'New ticket')}
          </Button>
        </div>
      </div>

      {/* Search & filter toggle */}
      <div className="p-3 sm:p-4 border-b border-border bg-card">
        <div className="flex gap-2 sm:gap-3 flex-1 w-full items-center">
          <div className="flex-1">
            <CollapsibleSearch
              placeholder={t('myTickets.searchPlaceholder', 'Search my tickets...')}
              value={search}
              onChange={(v) => { setSearch(v); setPage(1); }}
              className="w-full"
            />
          </div>
          <Button
            variant={showFilterBar ? 'default' : 'outline'}
            size="sm"
            className="gap-1 sm:gap-2 px-2 sm:px-3"
            onClick={() => setShowFilterBar((s) => !s)}
          >
            <Filter className="h-4 w-4" />
            <span className="hidden sm:inline">{t('admin.filters', 'Filters')}</span>
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs rounded-full">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </div>
      </div>

      {/* Filter bar */}
      {showFilterBar && (
        <div className="p-3 sm:p-4 border-b border-border bg-card">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1.5 min-w-[140px]">
              <label className="text-xs font-medium text-muted-foreground">
                {t('admin.colStatus', 'Status')}
              </label>
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
                <SelectTrigger className="h-9 bg-background"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-popover border shadow-md z-50">
                  <SelectItem value="all">{t('admin.allStatuses', 'All Statuses')}</SelectItem>
                  {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                    <SelectItem key={key} value={key}>
                      <span className="flex items-center gap-1.5">
                        <div className={`h-1.5 w-1.5 rounded-full ${cfg.dotColor}`} />
                        {cfg.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5 min-w-[140px]">
              <label className="text-xs font-medium text-muted-foreground">
                {t('admin.colUrgency', 'Urgency')}
              </label>
              <Select value={urgencyFilter} onValueChange={(v) => { setUrgencyFilter(v); setPage(1); }}>
                <SelectTrigger className="h-9 bg-background"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-popover border shadow-md z-50">
                  <SelectItem value="all">{t('admin.allUrgencies', 'All Urgencies')}</SelectItem>
                  <SelectItem value="low">{t('priorities.low', 'Low')}</SelectItem>
                  <SelectItem value="medium">{t('priorities.medium', 'Medium')}</SelectItem>
                  <SelectItem value="high">{t('priorities.high', 'High')}</SelectItem>
                  <SelectItem value="critical">{t('priorities.critical', 'Critical')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {categories.length > 0 && (
              <div className="flex flex-col gap-1.5 min-w-[140px]">
                <label className="text-xs font-medium text-muted-foreground">
                  {t('admin.colCategory', 'Category')}
                </label>
                <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); setPage(1); }}>
                  <SelectTrigger className="h-9 bg-background"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-popover border shadow-md z-50">
                    <SelectItem value="all">{t('admin.allCategories', 'All Categories')}</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        <span className="capitalize">{cat}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {activeFilterCount > 0 && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9 text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4 mr-1" />
                {t('admin.clearFilters', 'Clear')}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {loading && list.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
              <Inbox className="h-6 w-6 text-muted-foreground/50" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">{t('myTickets.empty', 'No tickets yet')}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{t('myTickets.emptyHint', 'Open a ticket if you need help.')}</p>
            </div>
            <Button size="sm" onClick={() => navigate('/support/tickets/new')}>
              <Plus className="h-4 w-4 mr-2" />
              {t('myTickets.new', 'New ticket')}
            </Button>
          </div>
        ) : (
          <Table className="w-full">
            <TableHeader>
              <TableRow className="hover:bg-transparent border-b border-border/40">
                <SortableHeader columnKey="id" sortKey={sortKey} sortDirection={sortDirection} onSort={toggleSort} align="center" className="w-[50px]">#</SortableHeader>
                <SortableHeader columnKey="title" sortKey={sortKey} sortDirection={sortDirection} onSort={toggleSort}>{t('admin.colTicket', 'Ticket')}</SortableHeader>
                <SortableHeader columnKey="category" sortKey={sortKey} sortDirection={sortDirection} onSort={toggleSort} className="hidden md:table-cell">{t('admin.colCategory', 'Category')}</SortableHeader>
                <SortableHeader columnKey="urgency" sortKey={sortKey} sortDirection={sortDirection} onSort={toggleSort}>{t('admin.colUrgency', 'Urgency')}</SortableHeader>
                <SortableHeader columnKey="status" sortKey={sortKey} sortDirection={sortDirection} onSort={toggleSort}>{t('admin.colStatus', 'Status')}</SortableHeader>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map((tk) => (
                <TableRow
                  key={tk.id}
                  className="cursor-pointer group"
                  onClick={() => navigate(`/support/tickets/${tk.id}`)}
                >
                  <TableCell className="text-center font-mono text-xs text-muted-foreground">{tk.id}</TableCell>
                  <TableCell>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate max-w-[320px] group-hover:text-primary transition-colors">
                        {tk.title}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-px-11 text-muted-foreground flex items-center gap-1">
                          <CalendarDays className="h-3 w-3" />
                          {formatDate(tk.createdAt)}
                        </span>
                        {tk.attachments?.length > 0 && (
                          <span className="text-px-11 text-muted-foreground flex items-center gap-1">
                            <Paperclip className="h-3 w-3" />
                            {tk.attachments.length}
                          </span>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {tk.category ? <span className="text-xs text-foreground capitalize">{tk.category}</span> : <span className="text-xs text-muted-foreground/40">—</span>}
                  </TableCell>
                  <TableCell><TicketUrgencyBadge urgency={tk.urgency} /></TableCell>
                  <TableCell><TicketStatusBadge status={tk.status} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Footer pagination */}
      {filtered.length > 0 && (
        <div className="border-t border-border bg-card">
          <PageSizeSelector
            currentPage={pageSafe}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={pageSize}
            startIndex={startIndex}
            endIndex={Math.min(startIndex + pageSize, totalItems)}
            onPageChange={setPage}
            onPageSizeChange={(n) => { setPageSize(n); setPage(1); }}
            hasPreviousPage={pageSafe > 1}
            hasNextPage={pageSafe < totalPages}
          />
        </div>
      )}
    </div>
  );
}

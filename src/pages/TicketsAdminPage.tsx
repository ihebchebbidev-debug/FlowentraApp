import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { supportTicketsApi, SupportTicketResponse } from '@/services/api/supportTicketsApi';
import { API_CONFIG } from '@/config/api.config';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { PageSizeSelector } from '@/components/shared/PageSizeSelector';
import { CollapsibleSearch } from '@/components/ui/collapsible-search';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import CommentThread from '@/components/tickets/CommentThread';
import TicketLinkSelector from '@/components/tickets/TicketLinkSelector';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import {
  RefreshCw,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  Paperclip,
  ExternalLink,
  Mail,
  Globe,
  FolderOpen,
  Eye,
  FileText,
  Image as ImageIcon,
  Download,
  ArrowUpDown,
  TicketCheck,
  CalendarDays,
  Tag,
  Inbox,
  ArrowDown,
  ArrowUp,
  Filter,
  X,
} from 'lucide-react';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType; dotColor: string }> = {
  open: { label: 'Open', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20', icon: AlertTriangle, dotColor: 'bg-blue-500' },
  in_progress: { label: 'In Progress', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20', icon: Clock, dotColor: 'bg-amber-500' },
  resolved: { label: 'Resolved', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20', icon: CheckCircle2, dotColor: 'bg-emerald-500' },
  closed: { label: 'Closed', color: 'bg-muted text-muted-foreground border-border/50', icon: XCircle, dotColor: 'bg-muted-foreground/50' },
};

const URGENCY_CONFIG: Record<string, { label: string; color: string }> = {
  low: { label: 'Low', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' },
  medium: { label: 'Medium', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' },
  high: { label: 'High', color: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20' },
  critical: { label: 'Critical', color: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20' },
};

export default function TicketsAdminPage() {
  const { t } = useTranslation('support');
  const [tickets, setTickets] = useState<SupportTicketResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [urgencyFilter, setUrgencyFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showFilterBar, setShowFilterBar] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicketResponse | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<number | null>(null);
  const [sortField, setSortField] = useState<'createdAt' | 'urgency'>('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const data = await supportTicketsApi.getAll();
      setTickets(data);
    } catch (err) {
      console.error('Failed to fetch tickets:', err);
      toast.error(t('admin.fetchError', 'Failed to load tickets'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  // After offline sync, hydrated GET cache is refreshed; re-fetch so the list shows new tickets immediately.
  useEffect(() => {
    const onSyncDone = (ev: Event) => {
      const types = (ev as CustomEvent<{ entityTypes?: string[] }>).detail?.entityTypes;
      if (!types?.some((t) => t.startsWith('support_ticket'))) return;
      fetchTickets();
    };
    window.addEventListener('offline:sync-completed', onSyncDone);
    return () => window.removeEventListener('offline:sync-completed', onSyncDone);
  }, [fetchTickets]);

  const handleStatusChange = async (ticketId: number, newStatus: string) => {
    setUpdatingStatus(ticketId);
    try {
      const updated = await supportTicketsApi.updateStatus(ticketId, newStatus);
      setTickets((prev) => prev.map((tk) => (tk.id === ticketId ? updated : tk)));
      if (selectedTicket?.id === ticketId) setSelectedTicket(updated);
      toast.success(t('admin.statusUpdated', 'Status updated'));
    } catch (err) {
      console.error('Failed to update status:', err);
      toast.error(t('admin.statusError', 'Failed to update status'));
    } finally {
      setUpdatingStatus(null);
    }
  };

  const urgencyOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
  const statusOrder: Record<string, number> = { open: 0, in_progress: 1, resolved: 2, closed: 3 };

  const filtered = tickets
    .filter((tk) => {
      if (statusFilter !== 'all' && tk.status !== statusFilter) return false;
      if (urgencyFilter !== 'all' && tk.urgency !== urgencyFilter) return false;
      if (categoryFilter !== 'all' && tk.category !== categoryFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          tk.title.toLowerCase().includes(q) ||
          tk.description.toLowerCase().includes(q) ||
          (tk.userEmail || '').toLowerCase().includes(q) ||
          (tk.tenant || '').toLowerCase().includes(q) ||
          `#${tk.id}`.includes(q)
        );
      }
      return true;
    })
    .sort((a, b) => {
      const statusA = statusOrder[a.status] ?? 4;
      const statusB = statusOrder[b.status] ?? 4;
      
      if (statusA !== statusB) {
        return statusA - statusB;
      }
      
      if (sortField === 'urgency') {
        const diff = (urgencyOrder[a.urgency || 'medium'] ?? 2) - (urgencyOrder[b.urgency || 'medium'] ?? 2);
        return sortDir === 'asc' ? diff : -diff;
      }
      const diff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return sortDir === 'asc' ? diff : -diff;
    });

  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (page - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginatedTickets = filtered.slice(startIndex, endIndex);

  const openDetail = (tk: SupportTicketResponse) => {
    setSelectedTicket(tk);
    setDetailOpen(true);
  };

  // Linked tickets state for detail modal
  const [linkedTicketsList, setLinkedTicketsList] = useState<any[]>([]);
  const [showLinkSelector, setShowLinkSelector] = useState(false);

  const fetchLinksFor = async (ticketId: number) => {
    try {
      const links = await supportTicketsApi.getLinks(ticketId);
      setLinkedTicketsList(links || []);
    } catch (err) {
      console.error('Failed to fetch ticket links', err);
    }
  };

  const addLinkFor = async (ticketId: number, payload: any) => {
    try {
      await supportTicketsApi.addLink(ticketId, payload);
      await fetchLinksFor(ticketId);
    } catch (err) {
      console.error('Failed to add link', err);
      toast.error(t('admin.linkError', 'Failed to add link'));
    }
  };

  const removeLinkFor = async (ticketId: number, linkId: number) => {
    try {
      await supportTicketsApi.removeLink(ticketId, linkId);
      await fetchLinksFor(ticketId);
    } catch (err) {
      console.error('Failed to remove link', err);
      toast.error(t('admin.linkError', 'Failed to remove link'));
    }
  };

  const getAttachmentUrl = (filePath?: string) => {
    if (!filePath) return '';
    if (filePath.startsWith('http')) return filePath;
    return `${API_CONFIG.baseURL}${filePath}`;
  };

  const isImage = (contentType?: string) => contentType?.startsWith('image/');
  const isPreviewable = (contentType?: string) => {
    if (!contentType) return false;
    return contentType === 'application/pdf' || 
           contentType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
           contentType === 'application/msword';
  };

  const [previewAttachment, setPreviewAttachment] = useState<{ url: string; fileName: string; contentType: string } | null>(null);

  const toggleSort = (field: 'createdAt' | 'urgency') => {
    if (sortField === field) {
      setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const SortIcon = ({ field }: { field: 'createdAt' | 'urgency' }) => {
    if (sortField !== field) return <ArrowUpDown className="h-3 w-3 opacity-40" />;
    return sortDir === 'desc' ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />;
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatDateTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  // Derived data for filters
  const categories = Array.from(new Set(tickets.map(tk => tk.category).filter(Boolean)));
  const activeFilterCount =
    (statusFilter !== 'all' ? 1 : 0) +
    (urgencyFilter !== 'all' ? 1 : 0) +
    (categoryFilter !== 'all' ? 1 : 0);

  const clearFilters = () => {
    setStatusFilter('all');
    setUrgencyFilter('all');
    setCategoryFilter('all');
  };

  return (
    <div className="flex flex-col h-full">
      {/* Page Header — matches ArticlesList / other modules */}
      <div className="hidden md:flex items-center justify-between p-4 border-b border-border bg-card/50 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <TicketCheck className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground">
              {t('admin.title', 'Support Tickets')}
            </h1>
            <p className="text-[11px] text-muted-foreground">
              {t('admin.subtitle', 'Manage and respond to reported issues')}
            </p>
          </div>
        </div>
        <Button variant="outline" className="shadow-soft hover-lift" onClick={fetchTickets} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          {t('admin.refresh', 'Refresh')}
        </Button>
      </div>

      {/* Mobile header */}
      <div className="md:hidden flex items-center justify-end p-4 border-b border-border bg-card/50 backdrop-blur">
        <Button variant="outline" size="sm" className="shadow-soft hover-lift" onClick={fetchTickets} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Search & Controls — same pattern as ArticlesList */}
      <div className="p-3 sm:p-4 border-b border-border bg-card">
        <div className="flex flex-col gap-3 sm:flex-row sm:gap-4 sm:items-center sm:justify-between">
          <div className="flex gap-2 sm:gap-3 flex-1 w-full items-center">
            <div className="flex-1">
              <CollapsibleSearch
                placeholder={t('admin.searchPlaceholder', 'Search tickets...')}
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
      </div>

      {/* Collapsible Filter Bar */}
      {showFilterBar && (
        <div className="p-3 sm:p-4 border-b border-border bg-card">
          <div className="flex flex-wrap items-end gap-3">
            {/* Status */}
            <div className="flex flex-col gap-1.5 min-w-[140px]">
              <label className="text-xs font-medium text-muted-foreground">
                {t('admin.colStatus', 'Status')}
              </label>
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
                <SelectTrigger className="h-9 bg-background">
                  <SelectValue placeholder={t('admin.allStatuses', 'All Statuses')} />
                </SelectTrigger>
                <SelectContent className="bg-popover border shadow-md z-50">
                  <SelectItem value="all">{t('admin.allStatuses', 'All Statuses')}</SelectItem>
                  {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                    <SelectItem key={key} value={key}>
                      <span className="flex items-center gap-1.5">
                        <div className={`h-1.5 w-1.5 rounded-full ${cfg.dotColor}`} />
                        {t(`admin.status_${key}`, cfg.label)}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Urgency */}
            <div className="flex flex-col gap-1.5 min-w-[140px]">
              <label className="text-xs font-medium text-muted-foreground">
                {t('admin.colUrgency', 'Urgency')}
              </label>
              <Select value={urgencyFilter} onValueChange={(v) => { setUrgencyFilter(v); setPage(1); }}>
                <SelectTrigger className="h-9 bg-background">
                  <SelectValue placeholder={t('admin.allUrgencies', 'All Urgencies')} />
                </SelectTrigger>
                <SelectContent className="bg-popover border shadow-md z-50">
                  <SelectItem value="all">{t('admin.allUrgencies', 'All Urgencies')}</SelectItem>
                  <SelectItem value="low">{t('priorities.low', 'Low')}</SelectItem>
                  <SelectItem value="medium">{t('priorities.medium', 'Medium')}</SelectItem>
                  <SelectItem value="high">{t('priorities.high', 'High')}</SelectItem>
                  <SelectItem value="critical">{t('priorities.critical', 'Critical')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Category */}
            <div className="flex flex-col gap-1.5 min-w-[140px]">
              <label className="text-xs font-medium text-muted-foreground">
                {t('admin.colCategory', 'Category')}
              </label>
              <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); setPage(1); }}>
                <SelectTrigger className="h-9 bg-background">
                  <SelectValue placeholder={t('admin.allCategories', 'All Categories')} />
                </SelectTrigger>
                <SelectContent className="bg-popover border shadow-md z-50">
                  <SelectItem value="all">{t('admin.allCategories', 'All Categories')}</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat!}>
                      <span className="capitalize">{cat}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Clear */}
            {activeFilterCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-9 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4 mr-1" />
                {t('admin.clearFilters', 'Clear')}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
              <Inbox className="h-6 w-6 text-muted-foreground/50" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">
                {t('admin.noTickets', 'No tickets found')}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t('admin.noTicketsHint', 'Try adjusting your filters or search query')}
              </p>
            </div>
          </div>
        ) : (
          <>
            <Table className="w-full">
              <TableHeader>
                <TableRow className="hover:bg-transparent border-b border-border/40">
                  <TableHead className="w-[50px] text-center">#</TableHead>
                  <TableHead>
                    <button
                      className="flex items-center gap-1 hover:text-foreground transition-colors"
                      onClick={() => toggleSort('createdAt')}
                    >
                      {t('admin.colTicket', 'Ticket')} <SortIcon field="createdAt" />
                    </button>
                  </TableHead>
                  <TableHead className="hidden md:table-cell">{t('admin.colEmail', 'Email')}</TableHead>
                  <TableHead className="hidden lg:table-cell">{t('admin.colCategory', 'Category')}</TableHead>
                  <TableHead>
                    <button
                      className="flex items-center gap-1 hover:text-foreground transition-colors"
                      onClick={() => toggleSort('urgency')}
                    >
                      {t('admin.colUrgency', 'Urgency')} <SortIcon field="urgency" />
                    </button>
                  </TableHead>
                  <TableHead>{t('admin.colStatus', 'Status')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedTickets.map((tk) => {
                  const statusCfg = STATUS_CONFIG[tk.status] || STATUS_CONFIG.open;
                  const urgencyCfg = URGENCY_CONFIG[tk.urgency || 'medium'] || URGENCY_CONFIG.medium;

                  return (
                    <TableRow
                      key={tk.id}
                      className="group cursor-pointer"
                      onClick={() => openDetail(tk)}
                    >
                      <TableCell className="text-center font-mono text-xs text-muted-foreground">
                        {tk.id}
                      </TableCell>
                      <TableCell>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate max-w-[280px] group-hover:text-primary transition-colors">
                            {tk.title}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                              <CalendarDays className="h-3 w-3" />
                              {formatDate(tk.createdAt)}
                            </span>
                            {tk.tenant && tk.tenant !== 'unknown' && (
                              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                                <Globe className="h-3 w-3" />
                                {tk.tenant}
                              </span>
                            )}
                            {tk.attachments?.length > 0 && (
                              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                                <Paperclip className="h-3 w-3" />
                                {tk.attachments.length}
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {tk.userEmail ? (
                          <span className="text-xs text-muted-foreground truncate block max-w-[180px]">{tk.userEmail}</span>
                        ) : (
                          <span className="text-xs text-muted-foreground/40">—</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {tk.category ? (
                          <span className="text-xs text-foreground capitalize">{tk.category}</span>
                        ) : (
                          <span className="text-xs text-muted-foreground/40">—</span>
                        )}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        {tk.urgency ? (
                          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-5 capitalize font-medium ${urgencyCfg.color}`}>
                            {t(`priorities.${tk.urgency}`, urgencyCfg.label)}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground/40">—</span>
                        )}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Select
                          value={tk.status}
                          onValueChange={(val) => handleStatusChange(tk.id, val)}
                          disabled={updatingStatus === tk.id}
                        >
                          <SelectTrigger className={`h-6 w-[110px] text-[10px] font-medium border-0 px-2 gap-1 ${statusCfg.color} hover:opacity-80`}>
                            {updatingStatus === tk.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <>
                                <div className={`h-1.5 w-1.5 rounded-full ${statusCfg.dotColor}`} />
                                <SelectValue />
                              </>
                            )}
                          </SelectTrigger>
                          <SelectContent className="bg-popover border shadow-md z-50">
                            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                              <SelectItem key={key} value={key} className="text-xs">
                                <span className="flex items-center gap-1.5">
                                  <div className={`h-1.5 w-1.5 rounded-full ${cfg.dotColor}`} />
                                  {t(`admin.status_${key}`, cfg.label)}
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            {/* Pagination */}
            <div className="px-3 sm:px-4 lg:px-6 border-t border-border/40">
              <PageSizeSelector
                currentPage={page}
                totalPages={totalPages}
                totalItems={totalItems}
                pageSize={pageSize}
                startIndex={startIndex}
                endIndex={endIndex}
                onPageChange={setPage}
                onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
                hasPreviousPage={page > 1}
                hasNextPage={page < totalPages}
                pageSizeOptions={[10, 20, 50, 100]}
              />
            </div>
          </>
        )}
      </div>

      {/* Detail Modal */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-[640px] max-h-[90vh] p-0 gap-0 overflow-hidden">
          {selectedTicket && (() => {
            const statusCfg = STATUS_CONFIG[selectedTicket.status] || STATUS_CONFIG.open;
            const urgencyCfg = URGENCY_CONFIG[selectedTicket.urgency || 'medium'] || URGENCY_CONFIG.medium;
            return (
              <>
                {/* Modal Header */}
                <DialogHeader className="px-6 pt-5 pb-4 bg-muted/30">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[11px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                      #{selectedTicket.id}
                    </span>
                    {selectedTicket.urgency && (
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-5 capitalize font-medium ${urgencyCfg.color}`}>
                        {t(`priorities.${selectedTicket.urgency}`, urgencyCfg.label)}
                      </Badge>
                    )}
                    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-5 gap-1 font-medium ${statusCfg.color}`}>
                      <div className={`h-1.5 w-1.5 rounded-full ${statusCfg.dotColor}`} />
                      {t(`admin.status_${selectedTicket.status}`, statusCfg.label)}
                    </Badge>
                  </div>
                  <DialogTitle className="text-base font-semibold leading-snug">
                    {selectedTicket.title}
                  </DialogTitle>
                  <DialogDescription className="text-xs mt-1.5 flex flex-wrap gap-x-4 gap-y-1">
                    {selectedTicket.userEmail && (
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" /> {selectedTicket.userEmail}
                      </span>
                    )}
                    {selectedTicket.tenant && selectedTicket.tenant !== 'unknown' && (
                      <span className="flex items-center gap-1">
                        <Globe className="h-3 w-3" /> {selectedTicket.tenant}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <CalendarDays className="h-3 w-3" /> {formatDateTime(selectedTicket.createdAt)}
                    </span>
                  </DialogDescription>
                </DialogHeader>

                <Separator />

                <ScrollArea className="max-h-[calc(90vh-260px)]">
                  <div className="px-6 py-5 space-y-5">
                    {/* Description */}
                    <section>
                      <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                        {t('reportIssue.description', 'Description')}
                      </h4>
                      <div className="text-sm text-foreground whitespace-pre-wrap leading-relaxed bg-muted/20 rounded-lg p-4 border border-border/30">
                        {selectedTicket.description}
                      </div>
                    </section>

                    {/* Meta */}
                    {(selectedTicket.category || selectedTicket.currentPage || selectedTicket.relatedUrl) && (
                      <section>
                        <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                          {t('admin.details', 'Details')}
                        </h4>
                        <div className="space-y-2">
                          {selectedTicket.category && (
                            <div className="flex items-center gap-3 text-sm">
                              <Tag className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                              <span className="text-muted-foreground text-xs w-16">{t('reportIssue.category', 'Category')}</span>
                              <span className="text-foreground capitalize">{selectedTicket.category}</span>
                            </div>
                          )}
                          {selectedTicket.currentPage && (
                            <div className="flex items-center gap-3 text-sm">
                              <FolderOpen className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                              <span className="text-muted-foreground text-xs w-16">{t('reportIssue.currentPage', 'Page')}</span>
                              <code className="text-foreground text-xs bg-muted px-1.5 py-0.5 rounded font-mono">{selectedTicket.currentPage}</code>
                            </div>
                          )}
                          {selectedTicket.relatedUrl && (
                            <div className="flex items-center gap-3 text-sm">
                              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                              <span className="text-muted-foreground text-xs w-16">{t('reportIssue.relatedUrl', 'URL')}</span>
                              <a
                                href={selectedTicket.relatedUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-primary hover:underline truncate"
                              >
                                {selectedTicket.relatedUrl}
                              </a>
                            </div>
                          )}
                        </div>
                      </section>
                    )}

                    {/* Attachments */}
                    {selectedTicket.attachments?.length > 0 && (
                      <section>
                        <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <Paperclip className="h-3 w-3" />
                          {t('reportIssue.attachments', 'Attachments')} ({selectedTicket.attachments.length})
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {selectedTicket.attachments.map((att) => {
                            const url = getAttachmentUrl(att.filePath);
                            const img = isImage(att.contentType);
                            return (
                              <div key={att.id} className="rounded-lg border border-border/40 overflow-hidden bg-muted/10">
                                {img && (
                                  <a href={url} target="_blank" rel="noopener noreferrer" className="block">
                                    <img
                                      src={url}
                                      alt={att.fileName}
                                      className="w-full h-28 object-cover hover:opacity-90 transition-opacity"
                                    />
                                  </a>
                                )}
                                <div className="p-2.5 flex items-center gap-2">
                                  {img ? <ImageIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" /> : <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
                                  <div className="min-w-0 flex-1">
                                    <p className="text-xs truncate font-medium">{att.fileName}</p>
                                    <p className="text-[10px] text-muted-foreground">
                                      {att.fileSize < 1024 * 1024
                                        ? `${(att.fileSize / 1024).toFixed(0)} KB`
                                        : `${(att.fileSize / (1024 * 1024)).toFixed(1)} MB`
                                      }
                                    </p>
                                  </div>
                                  <div className="flex gap-0.5 shrink-0">
                                    {(isPreviewable(att.contentType) || img) ? (
                                      <Button variant="ghost" size="icon-sm" onClick={() => setPreviewAttachment({ url, fileName: att.fileName, contentType: att.contentType || '' })} title={t('admin.view', 'View')}>
                                        <Eye className="h-3.5 w-3.5" />
                                      </Button>
                                    ) : (
                                      <Button variant="ghost" size="icon-sm" asChild>
                                        <a href={url} target="_blank" rel="noopener noreferrer" title={t('admin.view', 'View')}><Eye className="h-3.5 w-3.5" /></a>
                                      </Button>
                                    )}
                                    <Button variant="ghost" size="icon-sm" asChild>
                                      <a href={url} download={att.fileName} title={t('admin.download', 'Download')}><Download className="h-3.5 w-3.5" /></a>
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </section>
                    )}

                  {/* Linked Tickets */}
                  <section>
                    <div className="flex items-center justify-between">
                      <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">{t('admin.linkedTickets', 'Linked Tickets')} <span className="text-xs ml-2 text-muted-foreground">{linkedTicketsList.length}</span></h4>
                      <div>
                        <Button size="sm" variant="outline" onClick={() => { setShowLinkSelector((s) => !s); if (selectedTicket) fetchLinksFor(selectedTicket.id); }}>
                          {t('admin.addLink', 'Add Link')}
                        </Button>
                      </div>
                    </div>

                    {showLinkSelector && (
                      <div className="mb-2">
                        <TicketLinkSelector existingLinks={[]} onLinksChange={async (links) => {
                          if (!selectedTicket) return;
                          for (const l of links) {
                            await addLinkFor(selectedTicket.id, { targetTicketId: l.targetTicketId, linkType: l.linkType });
                          }
                          setShowLinkSelector(false);
                          fetchLinksFor(selectedTicket.id);
                        }} ticketId={selectedTicket?.id} />
                      </div>
                    )}

                    <div className="space-y-2">
                      {linkedTicketsList.map((ln: any) => (
                        <div key={ln.id} className="p-2 rounded border border-border/40 flex items-center justify-between">
                          <div>
                            <div className="text-sm font-medium">#{ln.targetTicketId} — {ln.targetTicketTitle}</div>
                            <div className="text-xs text-muted-foreground">{ln.linkType} • {ln.targetTicketStatus}</div>
                          </div>
                          <div className="flex gap-2">
                            <Button size="icon-sm" variant="ghost" onClick={() => { if (selectedTicket) removeLinkFor(selectedTicket.id, ln.id); }}>
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                {/* Conversation / Comments */}
                <section>
                  <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">{t('admin.conversation', 'Conversation')}</h4>
                  {selectedTicket && <CommentThread ticketId={selectedTicket.id} />}
                </section>
                  </div>
                </ScrollArea>

                {/* Footer - Status Controls */}
                <Separator />
                <div className="px-6 py-3.5 bg-muted/20">
                  <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    {t('admin.changeStatus', 'Update Status')}
                  </h4>
                  <div className="flex gap-2 flex-wrap">
                    {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
                      const isActive = selectedTicket.status === key;
                      return (
                        <Button
                          key={key}
                          variant={isActive ? 'default' : 'outline'}
                          size="sm"
                          className={`gap-1.5 text-xs h-7 ${isActive ? '' : 'text-muted-foreground'}`}
                          disabled={isActive || updatingStatus === selectedTicket.id}
                          onClick={() => handleStatusChange(selectedTicket.id, key)}
                        >
                          {updatingStatus === selectedTicket.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <div className={`h-1.5 w-1.5 rounded-full ${isActive ? 'bg-primary-foreground' : cfg.dotColor}`} />
                          )}
                          {t(`admin.status_${key}`, cfg.label)}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* File Preview Modal */}
      <Dialog open={!!previewAttachment} onOpenChange={(open) => { if (!open) setPreviewAttachment(null); }}>
        <DialogContent className="max-w-5xl w-[95vw] h-[90vh] flex flex-col p-0 gap-0">
          <DialogHeader className="px-6 py-4 border-b flex-shrink-0">
            <div className="flex items-center justify-between">
              <DialogTitle className="truncate pr-4">
                {previewAttachment?.fileName}
              </DialogTitle>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button variant="ghost" size="sm" asChild>
                  <a href={previewAttachment?.url} target="_blank" rel="noopener noreferrer" title={t('admin.openNewTab', 'Open in new tab')}>
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <a href={previewAttachment?.url} download={previewAttachment?.fileName} title={t('admin.download', 'Download')}>
                    <Download className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </div>
            <DialogDescription className="sr-only">File preview</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-auto min-h-0">
            {previewAttachment?.contentType === 'application/pdf' && (
              <iframe
                src={`${previewAttachment.url}#toolbar=1`}
                className="w-full h-full border-0"
                title={previewAttachment.fileName}
              />
            )}
            {(previewAttachment?.contentType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
              previewAttachment?.contentType === 'application/msword') && (
              <iframe
                src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(previewAttachment.url)}`}
                className="w-full h-full border-0"
                title={previewAttachment.fileName}
              />
            )}
            {previewAttachment?.contentType?.startsWith('image/') && (
              <div className="flex items-center justify-center h-full p-4 bg-muted/30">
                <img
                  src={previewAttachment.url}
                  alt={previewAttachment.fileName}
                  className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

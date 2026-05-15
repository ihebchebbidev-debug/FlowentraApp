import { useMemo, useState, useEffect } from "react";
import { calculateEntityTotal } from "@/lib/calculateTotal";
import { usePaginatedData } from "@/shared/hooks/usePagination";
import { formatStatValue } from "@/lib/formatters";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  TrendingUp, 
  Plus, 
  FileText,
  Search, 
  Filter, 
  DollarSign, 
  Target, 
  Trophy,
  Edit, 
  Trash2, 
  Eye,
  MoreVertical, 
  Calendar,
  User,
  Building2,
  List, 
  Table as TableIcon,
  LayoutGrid,
  ChevronDown,
  Map, Download,
  ShieldAlert,
  Lock,
  Loader2,
  X
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CollapsibleSearch } from "@/components/ui/collapsible-search";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import TableLayout from '@/components/shared/TableLayout';
import { isViewAllMode } from '@/utils/tenant';
import { CompanyBadge } from '@/components/CompanyBadge';
import { useFilteredByCompany } from '@/components/CompanyFilter';
import { CreateActionButton } from '@/components/CreateActionButton';

// Import types and services
import { Sale } from "../types";
import { useCurrency } from '@/shared/hooks/useCurrency';
import { useSales } from "../hooks/useSales";
import { getPriorityColor, getStatusColor, formatDate } from "../utils/presentation";
import { useLookups } from '@/shared/contexts/LookupsContext';
import { MapOverlay } from "@/components/shared/MapOverlay";
import { mapSalesToMapItems } from "@/components/shared/mappers";
import { ExportModal, ExportConfig } from "@/components/shared/ExportModal";
import { offersApi } from "@/services/api/offersApi";
import { usePermissions } from "@/hooks/usePermissions";
import { SalesKanbanView } from './SalesKanbanView';
import { TableRowActions } from '@/shared/components/TableRowActions';

// Helper to calculate total amount from items including taxes
const calculateItemsTotal = (sale: Sale): number => {
  return calculateEntityTotal(sale).total;
};

// Helper to format large numbers with space separator and no decimals
const formatTotalValue = (value: number): string => {
  return Math.round(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
};

export function SalesList() {
  const { t } = useTranslation('sales');
  const navigate = useNavigate();
  const { canCreate, canRead, canUpdate, canDelete, isLoading: permissionsLoading, isMainAdmin } = usePermissions();
  
  // Use the new useSales hook that fetches from backend
  const { sales, stats, loading, deleteSale, updateSaleStatus, refetch } = useSales();
  
  // Permission checks (disabled in view-all mode)
  const viewAll = isViewAllMode();
  const hasReadAccess = isMainAdmin || canRead('sales');
  const hasCreateAccess = isMainAdmin || canCreate('sales');
  const hasUpdateAccess = isMainAdmin || canUpdate('sales');
  const hasDeleteAccess = isMainAdmin || canDelete('sales');
  
  // Local UI state
  const [viewMode, setViewMode] = useState<'list' | 'table' | 'kanban'>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | string>('all');
  const [filterStage, setFilterStage] = useState<'all' | string>('all');
  const [filterPriority, setFilterPriority] = useState<'all' | string>('all');
  const [filterAssigned, setFilterAssigned] = useState<'all' | string>('all');
  const [selectedStat, setSelectedStat] = useState<string>('all');
  const [showFilterBar, setShowFilterBar] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; sale: Sale | null }>({ open: false, sale: null });
  const [isDeleting, setIsDeleting] = useState(false);
  const [offerNumbersMap, setOfferNumbersMap] = useState<Record<string, string>>({});

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [bulkDeleteProgress, setBulkDeleteProgress] = useState(0);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // Fetch offer numbers for sales that have offerId
  useEffect(() => {
    const fetchOfferNumbers = async () => {
      const offerIds = sales
        .filter(sale => sale.offerId)
        .map(sale => sale.offerId!)
        .filter((id, index, arr) => arr.indexOf(id) === index); // unique IDs
      
      if (offerIds.length === 0) return;
      
      try {
        const response = await offersApi.getAll({ limit: 1000 });
        const offersMap: Record<string, string> = {};
        response.data.offers.forEach(offer => {
          offersMap[String(offer.id)] = offer.offerNumber;
        });
        setOfferNumbersMap(offersMap);
      } catch (error) {
        console.error('Failed to fetch offers for number lookup:', error);
      }
    };
    
    if (sales.length > 0) {
      fetchOfferNumbers();
    }
  }, [sales]);

  // Filtered sales based on search and filters
  const filteredSales = useMemo(() => {
    return sales.filter(sale => {
      const q = searchTerm.trim().toLowerCase();
      const matchesSearch = q === '' ||
        sale.title.toLowerCase().includes(q) ||
        sale.contactName.toLowerCase().includes(q) ||
        (sale.contactCompany || '').toLowerCase().includes(q) ||
        (sale.saleNumber || '').toLowerCase().includes(q) ||
        String(sale.id).toLowerCase().includes(q);

      const matchesStatus = filterStatus === 'all' || sale.status === filterStatus;
      const matchesStage = filterStage === 'all' || sale.stage === filterStage;
      const matchesPriority = filterPriority === 'all' || sale.priority === filterPriority;
      const matchesAssigned = filterAssigned === 'all' || (sale.assignedToName || '').toLowerCase() === (filterAssigned || '').toLowerCase();
      
      // Handle stat filters
      if (selectedStat === 'closed') return matchesSearch && (sale.status === 'closed' || sale.status === 'invoiced');
      if (selectedStat === 'active') return matchesSearch && ['created', 'in_progress'].includes(sale.status);

      return matchesSearch && matchesStatus && matchesStage && matchesPriority && matchesAssigned;
    });
  }, [sales, searchTerm, filterStatus, filterStage, filterPriority, filterAssigned, selectedStat]);

  // Apply the global "Company" filter (header dropdown) on top of local filters.
  const companyScopedSales = useFilteredByCompany(filteredSales);
  const pagination = usePaginatedData(companyScopedSales, 20);

  // Check if all items are selected
  const allSelected = useMemo(() => {
    return filteredSales.length > 0 && filteredSales.every(sale => selectedIds.has(sale.id));
  }, [filteredSales, selectedIds]);

  // Check if some items are selected (for indeterminate state)
  const someSelected = useMemo(() => {
    return selectedIds.size > 0 && !allSelected;
  }, [selectedIds, allSelected]);

  // Toggle all items selection
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(filteredSales.map(sale => sale.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  // Toggle single item selection
  const handleSelectItem = (saleId: string, checked: boolean) => {
    const newSelected = new Set(selectedIds);
    if (checked) {
      newSelected.add(saleId);
    } else {
      newSelected.delete(saleId);
    }
    setSelectedIds(newSelected);
  };

  // Bulk delete - calls delete API for each selected item
  const handleBulkDelete = async () => {
    const idsToDelete = Array.from(selectedIds);
    setIsBulkDeleting(true);
    setBulkDeleteProgress(0);

    for (let i = 0; i < idsToDelete.length; i++) {
      await deleteSale(idsToDelete[i]);
      setBulkDeleteProgress(Math.round(((i + 1) / idsToDelete.length) * 100));
    }

    setIsBulkDeleting(false);
    setShowBulkDeleteDialog(false);
    setSelectedIds(new Set());
    setBulkDeleteProgress(0);
  };

  const handleStatClick = (stat: any) => {
    setSelectedStat(stat.filter);
    if (stat.filter === 'won') {
      setFilterStatus('won');
    } else if (stat.filter === 'active') {
      setFilterStatus('all');
    } else {
      setFilterStatus('all');
    }
    setFilterStage('all');
    setFilterPriority('all');
    setFilterAssigned('all');
  };

  const handleSaleClick = (sale: Sale) => {
    navigate(`/dashboard/sales/${sale.id}`);
  };

  const handleAddSale = () => {
    navigate('/dashboard/sales/add');
  };

  const handleViewSale = (sale: any) => {
    navigate(`/dashboard/sales/${sale.id}`);
  };

  const handleDeleteClick = (sale: Sale) => {
    setDeleteConfirm({ open: true, sale });
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirm.sale) return;
    setIsDeleting(true);
    try {
      await deleteSale(deleteConfirm.sale.id);
      setDeleteConfirm({ open: false, sale: null });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditSale = (sale: any) => {
    navigate(`/dashboard/sales/${sale.id}/edit`);
  };

  const { format: formatCurrency } = useCurrency();
  const { priorities: lookupPriorities } = useLookups();
  
  const assignedOptions = useMemo(() => {
    return Array.from(new Set(sales.map(s => (s.assignedToName || '').trim()).filter(Boolean)));
  }, [sales]);

  const exportConfig: ExportConfig = {
    filename: 'sales-export',
    allDataTransform: (sale: any) => ({
      'ID': sale.id,
      'Title': sale.title,
      'Contact Name': sale.contactName,
      'Contact Company': sale.contactCompany,
      'Contact Email': sale.contactEmail,
      'Status': sale.status,
      'Priority': sale.priority,
      'Stage': sale.stage,
      'Amount': sale.amount,
      'Currency': sale.currency,
      'Assigned To': sale.assignedToName || 'Unassigned',
      'Tags': sale.tags.join(', '),
      'Estimated Close Date': sale.estimatedCloseDate ? new Date(sale.estimatedCloseDate).toLocaleDateString() : 'Not set',
      'Created At': new Date(sale.createdAt).toLocaleDateString(),
      'Updated At': new Date(sale.updatedAt).toLocaleDateString(),
      'Notes': sale.notes || '',
    }),
    availableColumns: [
      { key: 'id', label: 'ID', category: 'Basic' },
      { key: 'title', label: 'Title', category: 'Basic' },
      { key: 'status', label: 'Status', category: 'Basic' },
      { key: 'priority', label: 'Priority', category: 'Basic' },
      { key: 'stage', label: 'Stage', category: 'Basic' },
      { key: 'contactName', label: 'Contact Name', category: 'Contact' },
      { key: 'contactCompany', label: 'Contact Company', category: 'Contact' },
      { key: 'contactEmail', label: 'Contact Email', category: 'Contact' },
      { key: 'amount', label: 'Amount', category: 'Financial' },
      { key: 'currency', label: 'Currency', category: 'Financial' },
      { key: 'assignedToName', label: 'Assigned To', category: 'Assignment' },
      { key: 'tags', label: 'Tags', category: 'Details', transform: (tags: string[]) => Array.isArray(tags) ? tags.join(', ') : '' },
      { key: 'estimatedCloseDate', label: 'Est. Close Date', category: 'Timeline', transform: (date: string) => date ? new Date(date).toLocaleDateString() : 'Not set' },
      { key: 'createdAt', label: 'Created Date', category: 'Timeline', transform: (date: string) => new Date(date).toLocaleDateString() },
      { key: 'updatedAt', label: 'Updated Date', category: 'Timeline', transform: (date: string) => new Date(date).toLocaleDateString() },
      { key: 'notes', label: 'Notes', category: 'Details' },
    ]
  };
  
  // Calculate total value from all sales items
  const calculatedTotalValue = useMemo(() => {
    return sales.reduce((total, sale) => total + calculateItemsTotal(sale), 0);
  }, [sales]);

  // Calculate total value for currently filtered sales (updates on filters/stat selection)
  const filteredTotalValue = useMemo(() => {
    return filteredSales.reduce((total, sale) => total + calculateItemsTotal(sale), 0);
  }, [filteredSales]);
  
  // Use stats from the useSales hook (fetched from backend)
  // Calculate in_progress and closed counts from sales data
  const inProgressCount = sales.filter(s => s.status === 'in_progress').length;
  const closedCount = sales.filter(s => s.status === 'closed' || s.status === 'invoiced' || s.status === 'partially_invoiced').length;
  
  const statsData = [
    {
      label: t("totalSales"),
      value: formatStatValue(stats.totalSales),
      icon: TrendingUp,
      color: "chart-1",
      filter: 'all'
    },
    {
      label: t("inProgressSales"),
      value: formatStatValue(inProgressCount),
      icon: Target,
      color: "chart-2", 
      filter: 'active'
    },
    {
      label: t("closedSales"),
      value: formatStatValue(closedCount),
      icon: Trophy,
      color: "chart-3",
      filter: 'closed'
    }
    ,{
      label: t('totalValue'),
      value: `${formatTotalValue(filteredTotalValue)} ${filteredSales.length > 0 ? (filteredSales[0].currency || 'TND') : 'TND'}`,
      icon: DollarSign,
      color: 'chart-4',
      filter: 'value'
    }
  ];

  if (loading && !sales.length) {
    return (
      <div className="p-6 space-y-4 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="h-7 w-40 bg-muted rounded" />
          <div className="h-9 w-28 bg-muted rounded" />
        </div>
        <div className="h-10 w-full bg-muted/60 rounded" />
        <div className="space-y-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-14 bg-muted/60 rounded w-full" />
          ))}
        </div>
      </div>
    );
  }

  // Access denied view
  if (!permissionsLoading && !hasReadAccess) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center p-8">
        <div className="p-4 rounded-full bg-destructive/10 mb-4">
          <ShieldAlert className="h-12 w-12 text-destructive" />
        </div>
        <h2 className="text-xl font-semibold text-foreground mb-2">{t('accessDenied')}</h2>
        <p className="text-muted-foreground max-w-md">
          {t('accessDeniedDescription')}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-border bg-card/50 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <TrendingUp className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">{t("salesManagement")}</h1>
            <p className="text-[10px] text-muted-foreground">{t("manageSalesAndOffers")}</p>
          </div>
        </div>
        {hasCreateAccess && (
          <CreateActionButton 
            size="sm"
            className="gradient-primary text-primary-foreground shadow-medium hover-lift"
            onClick={() => navigate('/dashboard/sales/new')}
          >
            <Plus className="h-4 w-4" />
          </CreateActionButton>
        )}
      </div>

      {/* Desktop Header */}
      <div className="hidden md:flex items-center justify-between p-4 border-b border-border bg-card/50 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <TrendingUp className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground">{t("salesManagement")}</h1>
            <p className="text-[11px] text-muted-foreground">{t("manageSalesAndOffers")}</p>
          </div>
        </div>
      </div>


      {/* Stats Cards */}
      <div className="p-3 sm:p-4 border-b border-border">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 sm:gap-4">
          {statsData.map((stat, index) => {
            const isSelected = selectedStat === stat.filter;
            const isInteractive = stat.filter !== 'value';
            return (
              <Card 
                key={index} 
                className={`shadow-card hover-lift gradient-card group ${isInteractive ? 'cursor-pointer' : ''} transition-all hover:shadow-lg ${
                  isSelected 
                    ? 'border-2 border-primary bg-primary/5' 
                    : 'border-0'
                }`}
                onClick={() => isInteractive && handleStatClick(stat)}
              >
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={`p-2 rounded-lg transition-all flex-shrink-0 ${
                        isSelected 
                          ? 'bg-primary/20' 
                          : `bg-${stat.color}/10 group-hover:bg-${stat.color}/20`
                      }`}>
                        <stat.icon className={`h-4 w-4 transition-all ${
                          isSelected 
                            ? 'text-primary' 
                            : `text-${stat.color}`
                        }`} />
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

      {/* Search and Controls */}
      <div className="p-3 sm:p-4 border-b border-border bg-card">
        <div className="flex flex-col gap-3 sm:flex-row sm:gap-4 sm:items-center sm:justify-between">
          <div className="flex gap-2 sm:gap-3 flex-1 w-full items-center">
            <div className="flex-1">
              <CollapsibleSearch 
                placeholder={t("searchSales")} 
                value={searchTerm} 
                onChange={setSearchTerm}
                className="w-full"
              />
            </div>
            <div className="relative">
              <Button variant="outline" size="sm" className="gap-1 sm:gap-2 px-2 sm:px-3" onClick={() => setShowFilterBar(s => !s)}>
                <Filter className="h-4 w-4" />
                <span className="hidden sm:inline">{t('filters')}</span>
                {(filterStatus !== 'all' || filterStage !== 'all' || filterPriority !== 'all') && (
                  <Badge variant="secondary" className="ml-2 h-4 px-1 text-xs">
                    {[
                      filterStatus !== 'all' ? 1 : 0,
                      filterStage !== 'all' ? 1 : 0,
                      filterPriority !== 'all' ? 1 : 0
                    ].reduce((a, b) => a + b, 0)}
                  </Badge>
                )}
              </Button>
            </div>
            {/* Export button - commented out for now
            <div className="relative">
              <Button variant="outline" size="sm" className="gap-1 sm:gap-2 px-2 sm:px-3" onClick={() => setShowExportModal(true)}>
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">{t('export', 'Export')}</span>
              </Button>
            </div>
            */}
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button 
              variant={viewMode === 'list' ? 'default' : 'outline'} 
              size="sm" 
              onClick={() => setViewMode('list')} 
              className={`flex-1 sm:flex-none ${viewMode === 'list' ? 'bg-primary text-white hover:bg-primary/90' : ''}`}
            >
              <List className={`h-4 w-4 ${viewMode === 'list' ? 'text-white' : ''}`} />
            </Button>
            <Button 
              variant={viewMode === 'table' ? 'default' : 'outline'} 
              size="sm" 
              onClick={() => setViewMode('table')} 
              className={`flex-1 sm:flex-none ${viewMode === 'table' ? 'bg-primary text-white hover:bg-primary/90' : ''}`}
            >
              <TableIcon className={`h-4 w-4 ${viewMode === 'table' ? 'text-white' : ''}`} />
            </Button>
            {/* Kanban view button - commented out for now
            <Button 
              variant={viewMode === 'kanban' ? 'default' : 'outline'} 
              size="sm" 
              onClick={() => setViewMode('kanban')} 
              className={`flex-1 sm:flex-none ${viewMode === 'kanban' ? 'bg-primary text-white hover:bg-primary/90' : ''}`}
            >
              <LayoutGrid className={`h-4 w-4 ${viewMode === 'kanban' ? 'text-white' : ''}`} />
            </Button>
            */}
            <Button 
              variant={showMap ? 'default' : 'outline'} 
              size="sm" 
              onClick={() => setShowMap(!showMap)} 
              className={`flex-1 sm:flex-none ${showMap ? 'bg-primary text-white hover:bg-primary/90' : ''}`}
            >
              <Map className={`h-4 w-4 ${showMap ? 'text-white' : ''}`} />
            </Button>
          </div>
        </div>
      </div>

      {/* List/Table View */}
      {showFilterBar && (
        <div className="p-3 sm:p-4 border-b border-border bg-card">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1.5 min-w-[140px]">
              <label className="text-xs font-medium text-muted-foreground">{t('allStatus')}</label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="h-9 bg-background">
                  <SelectValue placeholder={t('allStatus')} />
                </SelectTrigger>
                <SelectContent className="bg-popover border shadow-md z-50">
                  <SelectItem value="all">{t('allStatus')}</SelectItem>
                  <SelectItem value="new_offer">{t('new_offer')}</SelectItem>
                  <SelectItem value="won">{t('won')}</SelectItem>
                  <SelectItem value="lost">{t('lost')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5 min-w-[140px]">
              <label className="text-xs font-medium text-muted-foreground">{t('allPriorities')}</label>
              <Select value={filterPriority} onValueChange={setFilterPriority}>
                <SelectTrigger className="h-9 bg-background">
                  <SelectValue placeholder={t('allPriorities')} />
                </SelectTrigger>
                <SelectContent className="bg-popover border shadow-md z-50">
                  <SelectItem value="all">{t('allPriorities')}</SelectItem>
                  {lookupPriorities.map((p:any) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5 min-w-[140px]">
              <label className="text-xs font-medium text-muted-foreground">{t('allStages')}</label>
              <Select value={filterStage} onValueChange={setFilterStage}>
                <SelectTrigger className="h-9 bg-background">
                  <SelectValue placeholder={t('allStages')} />
                </SelectTrigger>
                <SelectContent className="bg-popover border shadow-md z-50">
                  <SelectItem value="all">{t('allStages')}</SelectItem>
                  <SelectItem value="qualification">{t('qualification')}</SelectItem>
                  <SelectItem value="proposal">{t('proposal')}</SelectItem>
                  <SelectItem value="negotiation">{t('negotiation')}</SelectItem>
                  <SelectItem value="closed">{t('closed')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5 min-w-[140px]">
              <label className="text-xs font-medium text-muted-foreground">{t('allAssignees')}</label>
              <Select value={filterAssigned} onValueChange={setFilterAssigned}>
                <SelectTrigger className="h-9 bg-background">
                  <SelectValue placeholder={t('allAssignees')} />
                </SelectTrigger>
                <SelectContent className="bg-popover border shadow-md z-50">
                  <SelectItem value="all">{t('allAssignees')}</SelectItem>
                  {assignedOptions.map((a, i) => (
                    <SelectItem key={i} value={a}>{a}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {(filterStatus !== 'all' || filterPriority !== 'all' || filterStage !== 'all' || filterAssigned !== 'all') && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => { setFilterStatus('all'); setFilterPriority('all'); setFilterStage('all'); setFilterAssigned('all'); }}
                className="h-9 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4 mr-1" />
                {t('clear')}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div className="sticky top-0 z-30 bg-destructive/10 border-b border-destructive/20 p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Checkbox
                checked={allSelected}
                onCheckedChange={handleSelectAll}
              />
              <span className="text-sm font-medium text-foreground">
                {t('bulk.selectedCount', { count: selectedIds.size })}
              </span>
              <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())} className="text-muted-foreground">
                {t('bulk.deselectAll')}
              </Button>
            </div>
            {hasDeleteAccess && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowBulkDeleteDialog(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {t('bulk.deleteSelected')}
              </Button>
            )}
          </div>
        </div>
      )}

      {viewMode === 'kanban' ? (
        <SalesKanbanView 
          sales={filteredSales}
          onSaleClick={handleSaleClick}
          onStatusChange={(saleId, newStatus) => updateSaleStatus(saleId, newStatus)}
          formatCurrency={(val: number) => `${val.toLocaleString()} TND`}
        />
      ) : viewMode === 'list' ? (
        <div className="p-3 sm:p-4 lg:p-6">
          <Card className="shadow-card border-0 bg-card text-[0.85rem]">
            <MapOverlay 
              items={mapSalesToMapItems(filteredSales as any)}
              onViewItem={handleViewSale}
              onEditItem={handleEditSale}
              onClose={() => setShowMap(false)}
              isVisible={showMap}
            />
            <CardContent className="p-0">
              {filteredSales.length === 0 ? (
                <div className="p-12 text-center">
                  <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">{t("noSalesFound")}</h3>
                  <p className="text-muted-foreground">
                    {t("createFirstSaleDescription") || "Get started by creating your first sale"}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {filteredSales.map((sale) => (
                    <div 
                      key={sale.id} 
                      className="p-3 sm:p-4 lg:p-6 hover:bg-muted/50 transition-colors group cursor-pointer" 
                      onClick={() => handleSaleClick(sale)}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                        <div className="flex items-start sm:items-center gap-3 sm:gap-4 flex-1 min-w-0">
                          <Avatar className="h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0">
                            <AvatarFallback className="text-xs sm:text-sm bg-primary/10 text-primary">
                              <Building2 className="h-4 w-4 sm:h-6 sm:w-6" />
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                              <div className="flex items-center gap-2">
                                <h3 className="text-foreground text-xs sm:text-sm break-words line-clamp-2">{sale.title}</h3>
                                <Badge className={`${getStatusColor(sale.status)} text-xs`}>
                                  {t(sale.status)}
                                </Badge>
                              </div>
                              <Badge className={`${getPriorityColor(sale.priority)} text-xs`}>
                                {t(sale.priority)}
                              </Badge>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs sm:text-sm text-muted-foreground mb-2">
                              <span className="break-words line-clamp-1">{sale.contactName} - {sale.contactCompany}</span>
                                <span className="text-foreground">{formatCurrency(calculateItemsTotal(sale))}</span>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <User className="h-3 w-3 flex-shrink-0" />
                                <span className="break-words line-clamp-1">{sale.assignedToName || t('unassigned')}</span>
                              </div>
                              
                              <div className="hidden sm:flex items-center gap-1">
                                <Calendar className="h-3 w-3 flex-shrink-0" />
                                <span>
                                  {sale.estimatedCloseDate ? formatDate(sale.estimatedCloseDate) : t('noDateSet')}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between sm:justify-end gap-2 mt-2 sm:mt-0">
                          <div className="flex gap-1 flex-wrap flex-1 sm:flex-none">
                            {sale.tags.slice(0, 2).map((tag, index) => (
                              <Badge key={index} variant="outline" className="text-xs px-1.5 py-0.5">
                                {tag}
                              </Badge>
                            ))}
                            {sale.tags.length > 2 && (
                              <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                                +{sale.tags.length - 2}
                              </Badge>
                            )}
                          </div>
                          
                          <TableRowActions actions={[
                            { icon: Eye, label: t("viewSale"), onClick: (e) => { e.stopPropagation(); handleSaleClick(sale); } },
                            { icon: FileText, label: t('report', 'Report'), onClick: (e) => { e.stopPropagation(); window.open(`/dashboard/sales/${sale.id}/report`, '_blank'); } },
                            { icon: Trash2, label: t("deleteSale"), onClick: (e) => { e.stopPropagation(); handleDeleteClick(sale); }, variant: 'destructive', show: hasDeleteAccess }
                          ]} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="p-3 sm:p-4 lg:p-6">
          <Card className="shadow-card border-0 bg-card">
            <MapOverlay 
              items={mapSalesToMapItems(filteredSales as any)}
              onViewItem={handleViewSale}
              onEditItem={handleEditSale}
              onClose={() => setShowMap(false)}
              isVisible={showMap}
            />
            <CardContent className="p-0">
              {filteredSales.length === 0 ? (
                <div className="p-12 text-center">
                  <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">{t("noSalesFound")}</h3>
                  <p className="text-muted-foreground mb-4">
                    {t("createFirstSale")}
                  </p>
                </div>
              ) : (
                <>

                  <div className="overflow-x-auto w-full scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent"
                       style={{ WebkitOverflowScrolling: 'touch' }}>
                    <Table className="min-w-[900px]">
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">
                            <Checkbox
                              checked={allSelected}
                              onCheckedChange={handleSelectAll}
                              aria-label={t('bulk.selectAll')}
                              className={someSelected ? "data-[state=checked]:bg-primary" : ""}
                            />
                          </TableHead>
                          <TableHead className="w-[250px]">{t('sale')}</TableHead>
                          {isViewAllMode() && <TableHead>{t('company', 'Company')}</TableHead>}
                          <TableHead>{t('contact')}</TableHead>
                          <TableHead>{t('relatedOffer')}</TableHead>
                          <TableHead>{t('amount')}</TableHead>
                          <TableHead>{t('status')}</TableHead>
                          <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredSales.map((sale) => {
                          const isSelected = selectedIds.has(sale.id);
                          return (
                            <TableRow 
                              key={sale.id} 
                              className={`cursor-pointer hover:bg-muted/50 group ${isSelected ? 'bg-muted/30' : ''}`}
                              onClick={() => handleSaleClick(sale)}
                            >
                              <TableCell onClick={(e) => e.stopPropagation()}>
                                <Checkbox
                                  checked={isSelected}
                                  onCheckedChange={(checked) => handleSelectItem(sale.id, !!checked)}
                                  aria-label={t('bulk.selectItem', { name: sale.title })}
                                />
                              </TableCell>
                              <TableCell>
                                <div className="min-w-0">
                                  <div className="text-sm text-foreground break-words whitespace-normal leading-tight">{sale.title}</div>
                                  <div className="text-sm text-muted-foreground truncate">{sale.saleNumber || `#${sale.id}`}</div>
                                </div>
                              </TableCell>
                              {isViewAllMode() && (
                                <TableCell><CompanyBadge tenantId={(sale as any).tenantId} forceShow /></TableCell>
                              )}
                              <TableCell>
                                <Button
                                  variant="link"
                                  className="p-0 h-auto text-left flex flex-col items-start min-w-0 max-w-[180px]"
                                  onClick={(e: any) => {
                                    e.stopPropagation();
                                    navigate(`/dashboard/contacts/${sale.contactId}`);
                                  }}
                                >
                                  <span className="text-sm text-foreground break-words whitespace-normal leading-tight text-left">{sale.contactName}</span>
                                  <span className="text-sm text-muted-foreground break-words whitespace-normal leading-tight text-left">{sale.contactCompany}</span>
                                </Button>
                              </TableCell>
                              <TableCell>
                                {sale.offerId ? (
                                  <Button
                                    variant="link"
                                    className="p-0 h-auto text-left text-sm text-foreground"
                                    onClick={(e: any) => {
                                      e.stopPropagation();
                                      navigate(`/dashboard/offers/${sale.offerId}`);
                                    }}
                                  >
                                    {sale.offerNumber || offerNumbersMap[sale.offerId] || `OFR-${sale.offerId}`}
                                  </Button>
                                ) : (
                                  <span className="text-sm text-muted-foreground">-</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <span className="text-sm text-foreground">
                                  {Math.floor(calculateItemsTotal(sale)).toLocaleString()} TND
                                  <span className="text-sm text-muted-foreground ml-1">({t('overview.inclTva')})</span>
                                </span>
                              </TableCell>
                              <TableCell>
                                <Badge className={`${getStatusColor(sale.status)} text-xs`}>{t(sale.status)}</Badge>
                              </TableCell>
                              <TableCell onClick={(e) => e.stopPropagation()}>
                                <TableRowActions actions={[
                                  { icon: Eye, label: t('viewSale'), onClick: (e) => { e.stopPropagation(); handleSaleClick(sale); } },
                                  { icon: FileText, label: t('report', 'Report'), onClick: (e) => { e.stopPropagation(); window.open(`/dashboard/sales/${sale.id}/report`, '_blank'); } },
                                  { icon: Trash2, label: t('deleteSale'), onClick: (e) => { e.stopPropagation(); handleDeleteClick(sale); }, variant: 'destructive', show: hasDeleteAccess }
                                ]} />
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Export Modal - commented out for now
      <ExportModal 
        open={showExportModal}
        onOpenChange={setShowExportModal}
        data={filteredSales}
        moduleName="Sales"
        exportConfig={exportConfig}
      />
      */}

      {/* Delete Confirmation Modal */}
      <AlertDialog open={deleteConfirm.open} onOpenChange={(open) => !open && setDeleteConfirm({ open: false, sale: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-destructive/10">
                <Trash2 className="h-5 w-5 text-destructive" />
              </div>
              <AlertDialogTitle>{t('deleteConfirmTitle')}</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-left">
              {t('deleteConfirmDescription', { title: deleteConfirm.sale?.title || '' })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              {t('cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? t('deleting') || 'Deleting...' : t('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={showBulkDeleteDialog} onOpenChange={(open) => !isBulkDeleting && setShowBulkDeleteDialog(open)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('bulk.deleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('bulk.deleteDescription', { count: selectedIds.size })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {isBulkDeleting && (
            <div className="py-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">{t('bulk.deletingProgress')}</span>
                <span className="text-sm font-medium">{bulkDeleteProgress}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-destructive h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${bulkDeleteProgress}%` }}
                />
              </div>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBulkDeleting}>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleBulkDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isBulkDeleting}
            >
              {isBulkDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {isBulkDeleting ? t('bulk.deleting') : t('bulk.deleteSelected')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
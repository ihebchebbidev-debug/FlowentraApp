import { useEffect, useMemo, useState } from "react";
import { usePaginatedData } from "@/shared/hooks/usePagination";
import { getStatusColorClass } from "@/config/entity-statuses";
import { formatStatValue, formatCurrencyValue } from "@/lib/formatters";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { CollapsibleSearch } from "@/components/ui/collapsible-search";
import {
  ClipboardList, Filter, Calendar, User, Building,
  Trash2, Eye, Plus, MapPin, List, Table as TableIcon, LayoutGrid,
  ChevronDown, Map, Download,
  DollarSign, Target, CheckCircle, Clock, AlertTriangle, Loader2, ShieldAlert, Lock, FileText,
  MoreVertical
} from "lucide-react";
import { TableRowActions } from '@/shared/components/TableRowActions';
import { isViewAllMode } from '@/utils/tenant';
import { CompanyBadge } from '@/components/CompanyBadge';
import { useFilteredByCompany } from '@/components/CompanyFilter';
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
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuContent } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLookups } from '@/shared/contexts/LookupsContext';
import serviceOrderStatuses from '@/data/mock/service-order-statuses.json';
import { CreateActionButton } from '@/components/CreateActionButton';

const timeframes = [
  { id: 'any', name: 'Any time' },
  { id: '7', name: 'Last 7 days' },
  { id: '30', name: 'Last 30 days' },
  { id: '365', name: 'Last year' },
];
import { ServiceOrder, ServiceOrderFilters } from "../types";
import { MapOverlay } from "@/components/shared/MapOverlay";
import { mapServiceOrdersToMapItems } from "@/components/shared/mappers";
import { ExportModal } from "../components/ExportModal";
import { serviceOrdersApi } from "@/services/api/serviceOrdersApi";
import { toast } from "sonner";
import { usePermissions } from "@/hooks/usePermissions";
import { useActionLogger } from "@/hooks/useActionLogger";
import { ServiceOrdersKanbanView } from "../components/ServiceOrdersKanbanView";
import { DropdownMenuLabel } from "@radix-ui/react-dropdown-menu";
import { getInitialViewMode } from '../../../../hooks/getInitialViewMode';

export default function ServiceOrdersList() {
  console.log("ServiceOrdersList rendering");
  const { t } = useTranslation('service_orders');
  const navigate = useNavigate();
  const { canCreate, canRead, canUpdate, canDelete, isLoading: permissionsLoading, isMainAdmin } = usePermissions();
  const { logSearch, logFilter, logButtonClick, logExport } = useActionLogger('ServiceOrders');
  const [serviceOrders, setServiceOrders] = useState<ServiceOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<ServiceOrderFilters>({});
  const [viewMode, setViewMode] = useState<'list' | 'table' | 'kanban'>(() => getInitialViewMode(['list','table','kanban'] as const, 'table'));
  const [showMap, setShowMap] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | string>('all');
  const [filterPriority, setFilterPriority] = useState<'all' | string>('all');
  const { priorities: lookupPriorities } = useLookups();
  const [selectedStat, setSelectedStat] = useState<string>('all');
  const [showFilterBar, setShowFilterBar] = useState(false);
  const [filterAssigned, setFilterAssigned] = useState<'all' | string>('all');
  const [filterDateRange, setFilterDateRange] = useState<'any' | '7' | '30' | '365'>('any');
  const [showExportModal, setShowExportModal] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<ServiceOrder | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [bulkDeleteProgress, setBulkDeleteProgress] = useState(0);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // Permission checks (disabled in view-all mode)
  const viewAll = isViewAllMode();
  const hasReadAccess = isMainAdmin || canRead('service_orders');
  const hasCreateAccess = isMainAdmin || canCreate('service_orders');
  const hasUpdateAccess = isMainAdmin || canUpdate('service_orders');
  const hasDeleteAccess = isMainAdmin || canDelete('service_orders');

  // Fetch service orders from API
  const fetchServiceOrders = async () => {
    try {
      setLoading(true);
      const response = await serviceOrdersApi.getAll({ pageSize: 100 });
      const orders = response.data.serviceOrders || [];

      // Map API response to local ServiceOrder type
      const mappedOrders: ServiceOrder[] = orders.map((so: any) => {
        // Calculate total cost from jobs and materials
        const jobsCost = (so.jobs || []).reduce((sum: number, job: any) => sum + (job.estimatedCost || 0), 0);
        const materialsCost = (so.materials || []).reduce((sum: number, mat: any) => sum + (mat.totalPrice || mat.unitPrice * mat.quantity || 0), 0);
        const totalEstimatedCost = so.estimatedCost || jobsCost + materialsCost || 0;

        // Get customer name from various possible sources
        // Backend returns contact as nested object with Name, Company, Email, Phone
        const customerName = so.contact?.name
          || so.contactName
          || (so.contact?.firstName && so.contact?.lastName
            ? `${so.contact.firstName} ${so.contact.lastName}`.trim()
            : so.contact?.firstName || so.contact?.lastName || '')
          || so.contact?.company
          || '';

        return {
          id: String(so.id),
          orderNumber: so.orderNumber || `SO-${so.id}`,
          offerId: so.offerId ? String(so.offerId) : undefined,
          saleId: so.saleId ? String(so.saleId) : undefined,
          saleNumber: so.saleNumber || undefined,
          customer: {
            id: String(so.contactId || so.contact?.id || ''),
            company: customerName || so.contact?.company || 'Unknown Customer',
            contactPerson: customerName || '',
            phone: so.contactPhone || so.contact?.phone || '',
            email: so.contactEmail || so.contact?.email || '',
            address: {
              street: so.address || so.contact?.address || '',
              city: so.city || so.contact?.city || '',
              state: so.state || '',
              zipCode: so.zipCode || '',
              country: so.country || 'Tunisia',
              longitude: so.longitude || 0,
              latitude: so.latitude || 0,
              hasLocation: so.longitude && so.latitude ? 1 : 0
            }
          },
          status: so.status || 'draft',
          repair: {
            description: so.notes || so.title || '',
            location: so.serviceLocation || '',
            urgencyLevel: so.priority || 'medium',
            promisedRepairDate: so.targetCompletionDate ? new Date(so.targetCompletionDate) : undefined
          },
          priority: so.priority || 'medium',
          createdAt: so.createdDate ? new Date(so.createdDate) : new Date(),
          updatedAt: so.modifiedDate ? new Date(so.modifiedDate) : new Date(),
          assignedTechnicians: so.assignedTechnicianIds || [],
          jobs: so.jobs || [],
          dispatches: so.dispatches || [],
          workDetails: {
            stepsPerformed: [],
            timeTracking: [],
            photos: [],
            checklists: []
          },
          materials: so.materials || [],
          financials: {
            id: `fin-${so.id}`,
            serviceOrderId: String(so.id),
            currency: so.currency || 'TND',
            estimatedCost: totalEstimatedCost,
            actualCost: so.actualCost || 0,
            laborCost: so.laborCost || jobsCost,
            materialCost: so.materialCost || materialsCost,
            travelCost: 0,
            equipmentCost: 0,
            overheadCost: 0,
            basePrice: totalEstimatedCost,
            discounts: [],
            taxes: [],
            totalAmount: totalEstimatedCost,
            paymentTerms: 'Net 30',
            paymentStatus: 'pending',
            paidAmount: 0,
            remainingAmount: totalEstimatedCost,
            invoiceStatus: 'draft',
            createdAt: so.createdDate ? new Date(so.createdDate) : new Date(),
            updatedAt: so.modifiedDate ? new Date(so.modifiedDate) : new Date()
          },
          followUp: {
            reminders: [],
            maintenanceNotes: ''
          },
          changeLog: [],
          communications: []
        };
      });

      setServiceOrders(mappedOrders);
    } catch (error) {
      console.error('Failed to fetch service orders:', error);
      toast.error(t('list.failedToLoad'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServiceOrders();
  }, []);


  useEffect(() => {
    document.title = "Service Orders — List";
  }, []);

  const handleServiceOrderClick = (order: ServiceOrder) => {
    navigate(`/dashboard/field/service-orders/${order.id}`);
  };

  const handleDeleteClick = (order: ServiceOrder, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setOrderToDelete(order);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!orderToDelete) return;

    setIsDeleting(true);
    try {
      await serviceOrdersApi.delete(parseInt(orderToDelete.id));
      toast.success(t('delete_modal.success'));
      setDeleteModalOpen(false);
      setOrderToDelete(null);
      // Refresh the list
      fetchServiceOrders();
    } catch (error) {
      console.error('Failed to delete service order:', error);
      toast.error(t('delete_modal.error'));
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusColor = (status: string) => getStatusColorClass('service_order', status);

  const getPriorityColor = (priority: ServiceOrder['priority']) => {
    const colors = {
      low: "status-info",
      medium: "status-info",
      high: "status-warning",
      urgent: "status-destructive"
    };
    return colors[priority];
  };

  const _getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase();

  const filteredServiceOrders = useMemo(() => {
    return serviceOrders.filter(order => {
      const matchesSearch = (order.orderNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(order.id).toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.repair.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
      const matchesPriority = filterPriority === 'all' || order.priority === filterPriority;
      const matchesAssigned = filterAssigned === 'all' || (order.assignedTechnicians || []).some(a => a === filterAssigned);
      const matchesDate = (() => {
        if (filterDateRange === 'any') return true;
        const days = Number(filterDateRange);
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);
        return order.createdAt >= cutoff;
      })();

      // Handle stat filters
      if (selectedStat === 'active') return matchesSearch && ['scheduled', 'in_progress'].includes(order.status);
      if (selectedStat === 'completed') return matchesSearch && order.status === 'completed';
      if (selectedStat === 'urgent') return matchesSearch && order.priority === 'urgent';

      return matchesSearch && matchesStatus && matchesPriority && matchesAssigned && matchesDate;
    });
  }, [serviceOrders, searchTerm, filterStatus, filterPriority, selectedStat, filterAssigned, filterDateRange]);

  const companyScopedServiceOrders = useFilteredByCompany(filteredServiceOrders);
  const pagination = usePaginatedData(companyScopedServiceOrders, 5);

  // Check if all items are selected
  const allSelected = useMemo(() => {
    return pagination.data.length > 0 && pagination.data.every(order => selectedIds.has(order.id));
  }, [pagination.data, selectedIds]);

  // Check if some items are selected (for indeterminate state)
  const someSelected = useMemo(() => {
    return selectedIds.size > 0 && !allSelected;
  }, [selectedIds, allSelected]);

  // Toggle all items selection
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(pagination.data.map(order => order.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  // Toggle single item selection
  const handleSelectItem = (orderId: string, checked: boolean) => {
    const newSelected = new Set(selectedIds);
    if (checked) {
      newSelected.add(orderId);
    } else {
      newSelected.delete(orderId);
    }
    setSelectedIds(newSelected);
  };

  // Bulk delete - calls delete API for each selected item
  const handleBulkDelete = async () => {
    const idsToDelete = Array.from(selectedIds);
    setIsBulkDeleting(true);
    setBulkDeleteProgress(0);

    for (let i = 0; i < idsToDelete.length; i++) {
      await serviceOrdersApi.delete(parseInt(idsToDelete[i]));
      setBulkDeleteProgress(Math.round(((i + 1) / idsToDelete.length) * 100));
    }

    setIsBulkDeleting(false);
    setShowBulkDeleteDialog(false);
    setSelectedIds(new Set());
    setBulkDeleteProgress(0);
    fetchServiceOrders();
    toast.success(t('bulk.deleteSuccess'));
  };

  const assignedOptions = useMemo(() => {
    return Array.from(new Set(serviceOrders.flatMap(o => o.assignedTechnicians || [])));
  }, [serviceOrders]);

  const totalValue = useMemo(() => serviceOrders.reduce((sum, order) => sum + order.financials.estimatedCost, 0), [serviceOrders]);

  const statsData = [
    {
      label: t('list.total_orders'),
      value: formatStatValue(serviceOrders.length),
      icon: ClipboardList,
      color: "chart-1",
      filter: 'all'
    },
    {
      label: t('list.active_orders'),
      value: formatStatValue(serviceOrders.filter(o => ['scheduled', 'in_progress'].includes(o.status)).length),
      icon: Target,
      color: "chart-2",
      filter: 'active'
    },
    {
      label: t('list.completed'),
      value: formatStatValue(serviceOrders.filter(o => o.status === 'completed').length),
      icon: CheckCircle,
      color: "chart-3",
      filter: 'completed'
    },
    {
      label: t('list.total_value'),
      value: formatCurrencyValue(totalValue),
      icon: DollarSign,
      color: "chart-4",
      filter: 'value'
    }
  ];

  const handleStatClick = (stat: any) => {
    setSelectedStat(stat.filter);
    if (stat.filter === 'all') {
      setFilterStatus('all');
      setFilterPriority('all');
    }
  };

  return (
    <div className="flex flex-col">
      {/* Header - Hidden on mobile */}
      <header className="hidden md:flex items-center justify-between p-4 border-b border-border bg-card/50 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <ClipboardList className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground">{t('list.title')}</h1>
            <p className="text-[11px] text-muted-foreground">{t('list.subtitle')}</p>
          </div>
        </div>
        {hasCreateAccess && (
          <div>
            <CreateActionButton
              className="bg-primary text-white hover:bg-primary/90 shadow-medium hover-lift"
              onClick={() => navigate('/dashboard/field/service-orders/create')}
            >
              <Plus className="mr-2 h-4 w-4 text-white" />
              {t('list.create_service_order')}
            </CreateActionButton>
          </div>
        )}
      </header>

      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-border bg-card/50 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <ClipboardList className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">{t('list.title')}</h1>
            <p className="text-[10px] text-muted-foreground">{t('list.subtitle')}</p>
          </div>
        </div>
        {hasCreateAccess && (
          <CreateActionButton
            size="sm"
            className="gradient-primary text-primary-foreground shadow-medium hover-lift"
            onClick={() => navigate('/dashboard/field/service-orders/create')}
          >
            <Plus className="h-4 w-4" />
          </CreateActionButton>
        )}
      </div>

      {/* Stats Cards */}
      <div className="p-3 sm:p-4 border-b border-border">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 sm:gap-4">
          {statsData.map((stat, index) => {
            const isSelected = selectedStat === stat.filter;
            return (
              <Card
                key={index}
                className={`shadow-card hover-lift gradient-card group cursor-pointer transition-all hover:shadow-lg ${isSelected
                  ? 'border-2 border-primary bg-primary/5'
                  : 'border-0'
                  }`}
                onClick={() => handleStatClick(stat)}
              >
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={`p-2 rounded-lg transition-all flex-shrink-0 ${isSelected
                        ? 'bg-primary/20'
                        : `bg-${stat.color}/10 group-hover:bg-${stat.color}/20`
                        }`}>
                        <stat.icon className={`h-4 w-4 transition-all ${isSelected
                          ? 'text-primary'
                          : `text-${stat.color}`
                          }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground font-medium truncate">{stat.label}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-foreground">{formatStatValue(stat.value)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Search and Controls */}
      <section className="p-3 sm:p-4 border-b border-border bg-card">
        <div className="flex flex-col gap-3 sm:flex-row sm:gap-4 sm:items-center sm:justify-between">
          <div className="flex gap-2 sm:gap-3 flex-1 w-full items-center">
            <div className="flex-1">
              <CollapsibleSearch
                placeholder={t('search_placeholder')}
                value={searchTerm}
                onChange={setSearchTerm}
                className="w-full"
              />
            </div>
            <div className="relative">
              <Button variant="outline" size="sm" className="gap-1 sm:gap-2 px-2 sm:px-3" onClick={() => setShowFilterBar(s => !s)}>
                <Filter className="h-4 w-4" />
                <span className="hidden sm:inline">{t('list.filters')}</span>
                {(filterStatus !== 'all' || filterPriority !== 'all' || filterAssigned !== 'all') && (
                  <Badge variant="secondary" className="ml-2 h-4 px-1 text-xs">
                    {[
                      filterStatus !== 'all' ? 1 : 0,
                      filterPriority !== 'all' ? 1 : 0,
                      filterAssigned !== 'all' ? 1 : 0
                    ].reduce((a, b) => a + b, 0)}
                  </Badge>
                )}
              </Button>
            </div>
            {/* Export button commented out
            <div className="relative">
              <Button variant="outline" size="sm" className="gap-1 sm:gap-2 px-2 sm:px-3" onClick={() => setShowExportModal(true)}>
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">{t('list.export')}</span>
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
      </section>

      {showFilterBar && (
        <div className="p-3 sm:p-4 border-b border-border bg-background/50">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-4 gap-2">
              <div className="relative">
                <select className="border rounded px-3 py-2 pr-10 appearance-none bg-background text-foreground w-full text-sm" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                  <option value="all">{t('list.all_statuses')}</option>
                  {serviceOrderStatuses.map((s: any) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
              <div className="relative">
                <select className="border rounded px-3 py-2 pr-10 appearance-none bg-background text-foreground w-full text-sm" value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
                  <option value="all">All Priorities</option>
                  {lookupPriorities.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
              <div className="relative">
                <select className="border rounded px-3 py-2 pr-10 appearance-none bg-background text-foreground w-full text-sm" value={filterAssigned} onChange={e => setFilterAssigned(e.target.value)}>
                  <option value="all">All Technicians</option>
                  {assignedOptions.map((a, i) => <option key={i} value={a}>{a}</option>)}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
              <div className="relative">
                <select className="border rounded px-3 py-2 pr-10 appearance-none bg-background text-foreground w-full text-sm" value={filterDateRange} onChange={e => setFilterDateRange(e.target.value as any)}>
                  {timeframes.map((tf: any) => (
                    <option key={tf.id} value={tf.id}>{tf.name}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="px-3 py-1 rounded-full border border-border text-sm" onClick={() => { setFilterStatus('all'); setFilterPriority('all'); setFilterAssigned('all'); setFilterDateRange('any'); setShowFilterBar(false); }}>{t('clear')}</button>
            </div>
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

      {/* Content Views */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-3 text-muted-foreground">Loading service orders...</span>
        </div>
      ) : viewMode === 'kanban' ? (
        <ServiceOrdersKanbanView
          serviceOrders={filteredServiceOrders}
          onServiceOrderClick={(so) => handleServiceOrderClick(so)}
          onStatusChange={async (soId, newStatus) => {
            try {
              const numId = parseInt(soId, 10);
              if (!isNaN(numId)) {
                await serviceOrdersApi.update(numId, { status: newStatus } as any);
                toast.success(t('status_updated', { defaultValue: 'Status updated' }));
              }
            } catch {
              toast.error(t('status_update_failed', { defaultValue: 'Failed to update status' }));
            }
          }}
          formatCurrency={(val: number) => `${val.toLocaleString()} TND`}
        />
      ) : viewMode === 'list' ? (
        <section className="p-3 sm:p-4 lg:p-6">
          <Card className="shadow-card border-0 bg-card">
            {/* Map Section */}
            {showMap && (
              <MapOverlay
                items={mapServiceOrdersToMapItems(filteredServiceOrders)}
                onViewItem={(item) => handleServiceOrderClick(filteredServiceOrders.find(o => o.id === item.id)!)}
                onClose={() => setShowMap(false)}
                isVisible={showMap}
              />
            )}

            <CardContent className={showMap ? "pt-4 p-0" : "p-0"}>
              {filteredServiceOrders.length === 0 ? (
                <div className="p-12 text-center">
                  <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">{t('no_service_orders')}</h3>
                  <p className="text-muted-foreground">
                    {t('no_service_orders_description')}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {pagination.data.map((order) => (
                    <div
                      key={order.id}
                      className="p-3 sm:p-4 lg:p-6 hover:bg-muted/50 transition-colors group cursor-pointer"
                      onClick={() => handleServiceOrderClick(order)}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                        <div className="flex items-start sm:items-center gap-3 sm:gap-4 flex-1 min-w-0">
                          <Avatar className="h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0">
                            <AvatarFallback className="text-xs sm:text-sm bg-primary/10 text-primary">
                              <ClipboardList className="h-4 w-4 sm:h-6 sm:w-6" />
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                              <div className="flex items-center gap-2">
                                <h3 className="text-foreground text-sm sm:text-base truncate">
                                  {order.orderNumber}
                                </h3>
                              </div>
                              <div className="flex gap-1">
                                <Badge className={`${getStatusColor(order.status)} text-xs`}>
                                  {t(`statuses.${order.status}`)}
                                </Badge>
                              </div>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs sm:text-sm text-muted-foreground mb-2">
                              <Link
                                to={`/dashboard/contacts/${order.customer.id}`}
                                className="flex items-center gap-1 hover:text-primary transition-colors"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Building className="h-3 w-3 flex-shrink-0" />
                                <span className="truncate hover:underline">{order.customer.company}</span>
                              </Link>
                              {order.customer.contactPerson && order.customer.contactPerson !== order.customer.company && (
                                <span className="truncate">{order.customer.contactPerson}</span>
                              )}
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3 flex-shrink-0" />
                                <span className="truncate">{order.repair.location}</span>
                              </div>
                              <div className="hidden sm:flex items-center gap-1">
                                <User className="h-3 w-3 flex-shrink-0" />
                                <span>{order.assignedTechnicians.length} technicians</span>
                              </div>
                              <div className="hidden sm:flex items-center gap-1">
                                <Calendar className="h-3 w-3 flex-shrink-0" />
                                <span>{order.createdAt.toLocaleDateString()}</span>
                              </div>
                              <div className="text-sm text-foreground">
                                {order.financials.estimatedCost.toLocaleString()} TND
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 sm:flex-col sm:items-end">
                          <TableRowActions actions={[
                            { icon: Eye, label: t('list.view_details'), onClick: () => handleServiceOrderClick(order) },
                            { icon: FileText, label: t('list.report', 'Report'), onClick: () => window.open(`/dashboard/field/service-orders/${order.id}/report`, '_blank') },
                            { icon: Trash2, label: t('list.delete_order'), onClick: () => handleDeleteClick(order), variant: 'destructive', show: hasDeleteAccess },
                          ]} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {filteredServiceOrders.length > 5 && (
                <div className="border-t border-border p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-muted-foreground">
                        Showing {pagination.info.startIndex + 1} to {pagination.info.endIndex} of {filteredServiceOrders.length} results
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={pagination.actions.previousPage}
                        disabled={!pagination.info.hasPreviousPage}
                        className="px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted"
                      >
                        Previous
                      </button>
                      <span className="px-3 py-1 text-sm">
                        {pagination.state.currentPage} of {pagination.info.totalPages}
                      </span>
                      <button
                        onClick={pagination.actions.nextPage}
                        disabled={!pagination.info.hasNextPage}
                        className="px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      ) : viewMode === 'table' ? (
        <section className="p-3 sm:p-4 lg:p-6">
          <Card className="shadow-card border-0 bg-card">
            {/* Map Section */}
            {showMap && (
              <MapOverlay
                items={mapServiceOrdersToMapItems(filteredServiceOrders)}
                onViewItem={(item) => handleServiceOrderClick(filteredServiceOrders.find(o => o.id === item.id)!)}
                onClose={() => setShowMap(false)}
                isVisible={showMap}
              />
            )}

            <CardContent className={showMap ? "pt-4 p-0" : "p-0"}>
              {filteredServiceOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center py-16 px-8">
                  <div className="p-4 rounded-full bg-muted mb-4">
                    <ClipboardList className="h-12 w-12 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{t('no_service_orders')}</h3>
                  <p className="text-muted-foreground mb-6 max-w-md">
                    {t('no_service_orders_description')}
                  </p>
                </div>
              ) : (
                <>

                  <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent"
                    style={{ WebkitOverflowScrolling: 'touch' }}>
                    <Table className="min-w-[700px]">
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
                          <TableHead className="w-[150px]">{t('list.table_order')}</TableHead>
                          {isViewAllMode() && <TableHead>{t('list.table_company', 'Company')}</TableHead>}
                          <TableHead>{t('list.table_customer')}</TableHead>
                          <TableHead>{t('list.table_status')}</TableHead>
                          <TableHead>{t('list.table_sale')}</TableHead>
                          <TableHead>{t('list.table_created')}</TableHead>
                          <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pagination.data.map((order) => {
                          const isSelected = selectedIds.has(order.id);
                          return (
                            <TableRow
                              key={order.id}
                              className={`cursor-pointer hover:bg-muted/50 group ${isSelected ? 'bg-muted/30' : ''}`}
                              onClick={() => handleServiceOrderClick(order)}
                            >
                              <TableCell onClick={(e) => e.stopPropagation()}>
                                <Checkbox
                                  checked={isSelected}
                                  onCheckedChange={(checked) => handleSelectItem(order.id, !!checked)}
                                  aria-label={t('bulk.selectItem', { name: order.orderNumber })}
                                />
                              </TableCell>
                              <TableCell className="py-4">
                                <div className="min-w-0">
                                  <p className="text-sm text-foreground truncate">{order.orderNumber}</p>
                                </div>
                              </TableCell>
                              {isViewAllMode() && (
                                <TableCell className="py-4"><CompanyBadge tenantId={(order as any).tenantId} forceShow /></TableCell>
                              )}
                              <TableCell className="py-4">
                                <div>
                                  <Link
                                    to={`/dashboard/contacts/${order.customer.id}`}
                                    className="text-foreground hover:text-primary hover:underline transition-colors"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {order.customer.company}
                                  </Link>
                                  {order.customer.contactPerson && order.customer.contactPerson !== order.customer.company && (
                                    <p className="text-sm text-muted-foreground">{order.customer.contactPerson}</p>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="py-4">
                                <Badge className={`${getStatusColor(order.status)} text-xs`}>
                                  {t(`statuses.${order.status}`)}
                                </Badge>
                              </TableCell>
                              <TableCell className="py-4">
                                {order.saleId ? (
                                  <Link
                                    to={`/dashboard/sales/${order.saleId}`}
                                    className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <ClipboardList className="h-3 w-3" />
                                    <span>{order.saleNumber || `Sale #${order.saleId}`}</span>
                                  </Link>
                                ) : (
                                  <span className="text-sm text-muted-foreground">—</span>
                                )}
                              </TableCell>
                              <TableCell className="py-4">
                                <div className="flex items-center gap-1 text-sm">
                                  <Calendar className="h-3 w-3 text-muted-foreground" />
                                  <span>{order.createdAt.toLocaleDateString()}</span>
                                </div>
                              </TableCell>
                              <TableCell className="py-4" onClick={(e) => e.stopPropagation()}>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                      <span className="sr-only">Open menu</span>
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>{t('list.actions')}</DropdownMenuLabel>
                                    <DropdownMenuItem onClick={() => handleServiceOrderClick(order)}>
                                      <Eye className="mr-2 h-4 w-4" />
                                      {t('list.view_details')}
                                    </DropdownMenuItem>
                                    {hasDeleteAccess && (
                                      <>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem className="text-destructive" onClick={(e) => handleDeleteClick(order, e as any)}>
                                          <Trash2 className="mr-2 h-4 w-4" />
                                          {t('list.delete_order')}
                                        </DropdownMenuItem>
                                      </>
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                    {filteredServiceOrders.length > 5 && (
                      <div className="border-t border-border p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <p className="text-sm text-muted-foreground">
                              {t('list.showing_results', { start: pagination.info.startIndex + 1, end: pagination.info.endIndex, total: filteredServiceOrders.length })}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={pagination.actions.previousPage}
                              disabled={!pagination.info.hasPreviousPage}
                              className="px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted"
                            >
                              {t('list.previous')}
                            </button>
                            <span className="px-3 py-1 text-sm">
                              {pagination.state.currentPage} of {pagination.info.totalPages}
                            </span>
                            <button
                              onClick={pagination.actions.nextPage}
                              disabled={!pagination.info.hasNextPage}
                              className="px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted"
                            >
                              {t('list.next')}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </section>
      ) : (
        <section className="p-3 sm:p-4 lg:p-6">
          <Card className="shadow-card border-0 bg-card">
            {/* Map Section */}
            {showMap && (
              <MapOverlay
                items={mapServiceOrdersToMapItems(filteredServiceOrders)}
                onViewItem={(item) => handleServiceOrderClick(filteredServiceOrders.find(o => o.id === item.id)!)}
                onClose={() => setShowMap(false)}
                isVisible={showMap}
              />
            )}

            <CardContent className={showMap ? "pt-4 p-0" : "p-0"}>
              {filteredServiceOrders.length === 0 ? (
                <div className="p-12 text-center">
                  <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">{t('no_service_orders')}</h3>
                  <p className="text-muted-foreground mb-4">
                    {t('no_service_orders_description')}
                  </p>
                  {hasCreateAccess && (
                    <CreateActionButton onClick={() => navigate('/dashboard/field/service-orders/create')}>
                      <Plus className="h-4 w-4 mr-2" />
                      {t('create_service_order')}
                    </CreateActionButton>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent"
                  style={{ WebkitOverflowScrolling: 'touch' }}>
                  <Table className="min-w-[900px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[150px]">{t('list.table_order')}</TableHead>
                        <TableHead>{t('list.table_customer')}</TableHead>
                        <TableHead>{t('list.table_location')}</TableHead>
                        <TableHead>{t('list.table_status')}</TableHead>
                        <TableHead>{t('list.table_priority')}</TableHead>
                        <TableHead>{t('list.table_cost')}</TableHead>
                        <TableHead>{t('list.table_technicians')}</TableHead>
                        <TableHead>{t('list.table_created')}</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pagination.data.map((order) => (
                        <TableRow
                          key={order.id}
                          className="cursor-pointer hover:bg-muted/50 group"
                          onClick={() => handleServiceOrderClick(order)}
                        >
                          <TableCell className="py-4">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10 flex-shrink-0">
                                <AvatarFallback className="text-sm bg-primary/10 text-primary">
                                  <ClipboardList className="h-5 w-5" />
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <p className="text-foreground truncate">{order.orderNumber}</p>
                                <p className="text-sm text-muted-foreground">#{order.id}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            <div>
                              <p className="text-foreground">{order.customer.company}</p>
                              <p className="text-sm text-muted-foreground">{order.customer.contactPerson}</p>
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="flex items-center gap-2 text-sm">
                              <MapPin className="h-3 w-3 text-muted-foreground" />
                              <span className="truncate">{order.repair.location}</span>
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            <Badge className={`${getStatusColor(order.status)} text-xs`}>
                              {t(`statuses.${order.status}`)}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-4">
                            <Badge className={`${getPriorityColor(order.priority)} text-xs`}>
                              {t(`priorities.${order.priority}`)}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-4">
                            <span className="font-medium">{order.financials.estimatedCost.toLocaleString()} TND</span>
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="flex items-center gap-1 text-sm">
                              <User className="h-3 w-3 text-muted-foreground" />
                              <span>{order.assignedTechnicians.length}</span>
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="flex items-center gap-1 text-sm">
                              <Calendar className="h-3 w-3 text-muted-foreground" />
                              <span>{order.createdAt.toLocaleDateString()}</span>
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            <TableRowActions actions={[
                              { icon: Eye, label: t('list.view_details'), onClick: (e) => { e.stopPropagation(); handleServiceOrderClick(order); } },
                              { icon: Trash2, label: t('list.delete_order'), onClick: (e) => { e.stopPropagation(); handleDeleteClick(order, e as any); }, variant: 'destructive', show: hasDeleteAccess }
                            ]} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {filteredServiceOrders.length > 0 && (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-6 py-4 border-t border-border">
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-muted-foreground">
                      Showing {pagination.info.startIndex + 1} to {pagination.info.endIndex} of {filteredServiceOrders.length} results
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={pagination.actions.previousPage}
                      disabled={!pagination.info.hasPreviousPage}
                      className="px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted"
                    >
                      Previous
                    </button>
                    <span className="px-3 py-1 text-sm">
                      {pagination.state.currentPage} of {pagination.info.totalPages}
                    </span>
                    <button
                      onClick={pagination.actions.nextPage}
                      disabled={!pagination.info.hasNextPage}
                      className="px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      )}

      {/* Export Modal commented out
      <ExportModal 
        open={showExportModal}
        onOpenChange={setShowExportModal}
        data={filteredServiceOrders}
      />
      */}

      {/* Delete Confirmation Modal */}
      <AlertDialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('delete_modal.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('delete_modal.description')}
              <br /><br />
              <span className="text-muted-foreground text-sm">
                {t('delete_modal.warning')}
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              {t('delete_modal.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('delete_modal.deleting')}
                </>
              ) : (
                t('delete_modal.confirm')
              )}
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
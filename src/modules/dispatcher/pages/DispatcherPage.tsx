import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { formatStatValue } from "@/lib/formatters";
import { getStatusColorClass } from "@/config/entity-statuses";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
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
import { 
  CalendarRange, 
  Clock, 
  MapPin, 
  User,
  UserMinus,
  AlertTriangle,
  CheckCircle,
  Circle,
  DollarSign,
  Users,
  List,
  Table as TableIcon,
  LayoutGrid,
  Phone,
  Building2,
  Filter,
  ChevronDown,
  RefreshCcw,
  Loader2,
  Plus,
  ShieldAlert,
  Trash2,
  Play
} from "lucide-react";
import { usePermissions } from "@/hooks/usePermissions";
import { useActionLogger } from "@/hooks/useActionLogger";
import { isViewAllMode } from '@/utils/tenant';
import { TableLayout } from "@/components/shared/TableLayout";
import { SimplePaginationBar } from "@/components/shared/SimplePaginationBar";
import { usePaginatedData } from "@/shared/hooks/usePagination";
import { DispatcherHeader } from "../components/DispatcherHeader";
import { DispatcherSearchControls, type DispatcherFilters } from "../components/DispatcherSearchControls";
import { CollapsibleSearch } from "@/components/ui/collapsible-search";
import { dispatchesApi, type Dispatch } from "@/services/api/dispatchesApi";
import { usersApi } from "@/services/api/usersApi";
import { serviceOrdersApi } from "@/services/api/serviceOrdersApi";
import { TechnicianDetailModal, type TechnicianInfo } from "../components/TechnicianDetailModal";
import { useDispatchDeletion } from "@/modules/field/dispatches/hooks/useDispatchDeletion";
import { DispatchesKanbanView } from "../components/DispatchesKanbanView";
import { getInitialViewMode } from '../../../hooks/getInitialViewMode';
import { PlanningAutopilotDemo } from "../components/onboarding/PlanningAutopilotDemo";

// Extended dispatch type for display
interface DisplayDispatch {
  id: string;
  serviceOrderId: string;
  serviceOrderTitle?: string;
  serviceOrderNumber?: string;
  jobId: string;
  dispatchNumber: string;
  assignedTechnicians: string[];
  assignedTechnicianIds: string[];
  requiredSkills: string[];
  scheduledDate?: Date;
  scheduledStartTime?: string;
  scheduledEndTime?: string;
  estimatedDuration?: number;
  status: string;
  priority: string;
  workloadHours?: number;
  dispatchedBy?: string;
  dispatchedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  siteAddress?: string;
  contactId?: string;
  contactName?: string;
  notes?: string;
}

export function DispatcherPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { hasPermission, isLoading: permissionsLoading, isMainAdmin } = usePermissions();
  
  // Permission checks (disabled in view-all mode)
  const viewAll = isViewAllMode();
  const hasReadAccess = isMainAdmin || hasPermission('service_orders', 'read');
  const hasCreateAccess = isMainAdmin || hasPermission('service_orders', 'create');
  
  const [dispatches, setDispatches] = useState<DisplayDispatch[]>([]);
  const [techniciansMap, setTechniciansMap] = useState<Map<string, TechnicianInfo>>(new Map());
  const [selectedTechnician, setSelectedTechnician] = useState<TechnicianInfo | null>(null);
  const [technicianModalOpen, setTechnicianModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("dispatches");
  const [viewMode, setViewMode] = useState<'list' | 'table' | 'kanban'>(() => getInitialViewMode(['list','table','kanban'] as const, 'table'));
  const [filters, setFilters] = useState<DispatcherFilters>({
    searchTerm: '',
    status: 'all',
    priority: 'all'
  });
  const [selectedStat, setSelectedStat] = useState<string>('all');
  const [showFilterBar, setShowFilterBar] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);

  // Selection state for bulk actions
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const { bulkDeleteDispatches, isDeleting: bulkDeleting } = useDispatchDeletion();

  // Fetch dispatches from backend
  const fetchDispatches = async () => {
    try {
      // Fetch dispatches, users, and service orders in parallel
      const [dispatchResponse, usersResponse] = await Promise.all([
        dispatchesApi.getAll({ pageSize: 200 }),
        usersApi.getAll()
      ]);
      
      const apiDispatches = dispatchResponse.data || [];
      const users = Array.isArray(usersResponse) ? usersResponse : (usersResponse as any).users || [];
      
      // Create a map of user IDs to names
      const userMap = new Map<string, string>();
      const techMap = new Map<string, TechnicianInfo>();
      users.forEach((user: any) => {
        const userId = String(user.id);
        const name = user.firstName && user.lastName 
          ? `${user.firstName} ${user.lastName}` 
          : user.name || user.email || `User ${userId}`;
        userMap.set(userId, name);
        
        // Store full technician info for the modal
        techMap.set(userId, {
          id: userId,
          firstName: user.firstName || user.first_name || '',
          lastName: user.lastName || user.last_name || '',
          email: user.email || '',
          phone: user.phone || user.phoneNumber || '',
          skills: user.skills || [],
          status: user.status || 'available',
          workingHours: {
            start: user.workingHoursStart || '08:00',
            end: user.workingHoursEnd || '17:00',
          },
          avatar: user.avatar || '/placeholder.svg',
        });
      });
      
      setTechniciansMap(techMap);
      
      // Map API dispatches to display format
      const displayDispatches: DisplayDispatch[] = await Promise.all(
        apiDispatches.map(async (d: Dispatch) => {
          // Get assigned technicians array from backend (contains UserLightDto objects with Name)
          const assignedTechs = (d as any).assignedTechnicians || [];
          const technicianNames: string[] = [];
          const technicianIds: string[] = [];
          
          // First priority: Get names directly from assignedTechnicians array (UserLightDto with Name populated)
          if (assignedTechs.length > 0) {
            for (const tech of assignedTechs) {
              const techId = String(tech.id || tech.Id);
              technicianIds.push(techId);
              
              // Try to get name from the backend response first
              const backendName = tech.name || tech.Name;
              if (backendName && backendName.trim()) {
                technicianNames.push(backendName.trim());
              } else {
                // Fallback to userMap lookup
                const mappedName = userMap.get(techId);
                if (mappedName) {
                  technicianNames.push(mappedName);
                }
              }
            }
          }
          
          // Second priority: Use assignedTechnicianIds if no techs from array
          if (technicianIds.length === 0 && d.assignedTechnicianIds?.length) {
            for (const id of d.assignedTechnicianIds) {
              technicianIds.push(String(id));
              const mappedName = userMap.get(String(id));
              if (mappedName) {
                technicianNames.push(mappedName);
              }
            }
          }
          
          // Third priority: Use technicianName field
          if (technicianNames.length === 0 && d.technicianName) {
            technicianNames.push(d.technicianName);
          }
          
          // Try to get service order title and number
          let serviceOrderTitle = `SO-${d.serviceOrderId}`;
          let serviceOrderNumber = `SO-${d.serviceOrderId}`;
          if (d.serviceOrderId) {
            try {
              const so = await serviceOrdersApi.getById(d.serviceOrderId, false);
              serviceOrderTitle = so.title || so.orderNumber || serviceOrderTitle;
              serviceOrderNumber = so.orderNumber || `SO-${d.serviceOrderId}`;
            } catch {
              // Use default title if fetch fails
            }
          }
          
          // Get contact name from response (now enriched from backend)
          const contactName = d.contactName || (d as any).ContactName || null;
          
          // Get scheduled times from various possible formats
          const scheduling = (d as any).scheduling || {};
          const scheduledDate = d.scheduledDate || (d as any).scheduledDate || scheduling.scheduledDate;
          const scheduledStartTime = d.scheduledStartTime || (d as any).scheduledStartTime || scheduling.scheduledStartTime;
          const scheduledEndTime = d.scheduledEndTime || (d as any).scheduledEndTime || scheduling.scheduledEndTime;
          
          // Get contactId from response
          const contactId = d.contactId || (d as any).contactId || (d as any).ContactId;
          
          return {
            id: String(d.id),
            serviceOrderId: String(d.serviceOrderId || ''),
            serviceOrderTitle,
            serviceOrderNumber,
            jobId: String(d.jobId || ''),
            dispatchNumber: d.dispatchNumber || `DISP-${d.id}`,
            assignedTechnicians: technicianNames.length > 0 ? technicianNames : ['Unassigned'],
            assignedTechnicianIds: technicianIds,
            requiredSkills: [],
            scheduledDate: scheduledDate ? new Date(scheduledDate) : undefined,
            scheduledStartTime: scheduledStartTime || undefined,
            scheduledEndTime: scheduledEndTime || undefined,
            estimatedDuration: undefined,
            status: d.status || 'pending',
            priority: d.priority || 'medium',
            workloadHours: undefined,
            dispatchedBy: d.dispatchedBy,
            dispatchedAt: d.dispatchedAt ? new Date(d.dispatchedAt) : undefined,
            createdAt: new Date(d.createdDate || (d as any).createdDate || Date.now()),
            updatedAt: new Date(d.modifiedDate || (d as any).modifiedDate || Date.now()),
            siteAddress: d.siteAddress || (d as any).siteAddress,
            contactId: contactId ? String(contactId) : undefined,
            contactName: contactName,
            notes: d.notes
          };
        })
      );
      
      setDispatches(displayDispatches);
    } catch (error) {
      console.error('Failed to fetch dispatches:', error);
      setDispatches([]);
    }
  };

useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await fetchDispatches();
      setIsLoading(false);
    };
    loadData();
    
    // Prefetch dispatcher interface data in background for faster navigation
    import('@/shared/prefetch').then(({ preloadDispatcherData }) => {
      preloadDispatcherData();
    });
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchDispatches();
    setIsRefreshing(false);
  };

  const filteredDispatches = useMemo(() => {
    return dispatches.filter(dispatch => {
      const matchesSearch = dispatch.dispatchNumber.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        dispatch.serviceOrderId.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        dispatch.assignedTechnicians.some(tech => tech.toLowerCase().includes(filters.searchTerm.toLowerCase())) ||
        (dispatch.contactName?.toLowerCase().includes(filters.searchTerm.toLowerCase()) ?? false);
      const matchesStatus = filters.status === 'all' || dispatch.status === filters.status;
      const matchesPriority = filters.priority === 'all' || dispatch.priority === filters.priority;
      
      // Handle stat filters
      if (selectedStat === 'all') return matchesSearch && matchesStatus && matchesPriority;
      if (selectedStat === 'urgent') return matchesSearch && dispatch.priority === 'urgent';
      if (selectedStat === 'in_progress') return matchesSearch && dispatch.status === 'in_progress';
      if (selectedStat === 'completed') return matchesSearch && dispatch.status === 'completed';
      if (selectedStat === 'assigned') return matchesSearch && dispatch.status === 'assigned';
      
      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [dispatches, filters, selectedStat]);

  // Paginate dispatches — mirrors the Service Orders list (20 per page,
  // pagination bar shown at top and bottom of the list/table).
  const pagination = usePaginatedData(filteredDispatches, 20);

  // Selection helpers (must be after filteredDispatches)
  const toggleSelect = useCallback((id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === filteredDispatches.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredDispatches.map(d => d.id)));
    }
  }, [selectedIds.size, filteredDispatches]);

  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

  const handleBulkDelete = useCallback(async () => {
    const ids = Array.from(selectedIds);
    const successIds = await bulkDeleteDispatches(ids);
    if (successIds.length > 0) {
      setSelectedIds(new Set());
      setShowBulkDeleteConfirm(false);
      await fetchDispatches();
    }
  }, [selectedIds, bulkDeleteDispatches]);

  // Access denied state - after all hooks
  if (!permissionsLoading && !hasReadAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <ShieldAlert className="h-8 w-8 text-destructive" />
          </div>
          <h2 className="text-xl font-semibold text-foreground">{t('common.access_denied', 'Access Denied')}</h2>
          <p className="text-muted-foreground max-w-md">
            {t('common.no_permission_view', 'You do not have permission to view this module. Please contact your administrator.')}
          </p>
        </div>
      </div>
    );
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const handleDispatchJobs = () => {
    navigate('/dashboard/field/dispatcher/interface');
  };

  const handleDispatchClick = (dispatchId: string) => {
    console.log("Clicking dispatch with ID:", dispatchId);
    navigate(`/dashboard/field/dispatcher/job/${dispatchId}`);
  };

  const handleServiceOrderClick = (serviceOrderId: string) => {
    navigate(`/dashboard/field/service-orders/${serviceOrderId}`);
  };

  const handleStatClick = (stat: any) => {
    setSelectedStat(stat.filter);
    if (stat.filter === 'all') {
      setFilters(prev => ({ ...prev, status: 'all', priority: 'all' }));
    }
  };

  // Stats calculation for dispatches
  const statsData = [
    {
      label: t('dispatcher.total', 'Total'),
      value: dispatches.length,
      icon: Circle,
      color: "chart-1",
      filter: 'all'
    },
    {
      label: t('dispatcher.statuses.assigned', 'Assigned'),
      value: dispatches.filter(d => d.status === 'assigned').length,
      icon: CheckCircle,
      color: "chart-5", 
      filter: 'assigned'
    },
    {
      label: t('dispatcher.statuses.in_progress', 'In Progress'),
      value: dispatches.filter(d => d.status === 'in_progress').length,
      icon: Clock,
      color: "chart-3",
      filter: 'in_progress'
    },
    {
      label: t('dispatcher.statuses.completed', 'Completed'),
      value: dispatches.filter(d => d.status === 'completed').length,
      icon: CheckCircle,
      color: "chart-2",
      filter: 'completed'
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <UserMinus className="h-4 w-4" />;
      case 'assigned': return <Clock className="h-4 w-4" />;
      case 'in_progress': return <AlertTriangle className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      default: return <Circle className="h-4 w-4" />;
    }
  };

  const handleTechnicianClick = (techId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const tech = techniciansMap.get(techId);
    if (tech) {
      setSelectedTechnician(tech);
      setTechnicianModalOpen(true);
    }
  };

  const dispatchColumns = [
    {
      key: 'checkbox',
      title: (
        <Checkbox
          checked={filteredDispatches.length > 0 && selectedIds.size === filteredDispatches.length}
          onCheckedChange={toggleSelectAll}
        />
      ),
      width: 'w-[40px]',
      render: (dispatch: DisplayDispatch) => (
        <Checkbox
          checked={selectedIds.has(dispatch.id)}
          onCheckedChange={() => toggleSelect(dispatch.id)}
          onClick={(e: React.MouseEvent) => e.stopPropagation()}
        />
      )
    },
    {
      key: 'dispatchNumber',
      title: t('dispatcher.operation', 'Operation'),
      render: (dispatch: DisplayDispatch) => (
        <div 
          className="cursor-pointer hover:text-primary"
          onClick={() => handleDispatchClick(dispatch.id)}
        >
          <div className="text-sm">{dispatch.dispatchNumber}</div>
        </div>
      )
    },
    {
      key: 'serviceOrder',
      title: t('dispatcher.service_order'),
      render: (dispatch: DisplayDispatch) => (
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <button 
            onClick={() => handleServiceOrderClick(dispatch.serviceOrderId)}
            className="text-primary hover:underline text-left"
          >
            {dispatch.serviceOrderTitle || `SO-${dispatch.serviceOrderId}`}
          </button>
        </div>
      )
    },
    {
      key: 'contact',
      title: 'Customer',
      render: (dispatch: DisplayDispatch) => (
        <div className="text-sm">
          {dispatch.contactId && dispatch.contactName ? (
            <button 
              onClick={() => navigate(`/dashboard/contacts/${dispatch.contactId}`)}
              className="text-primary hover:underline text-left"
            >
              {dispatch.contactName}
            </button>
          ) : (
            <span className="text-muted-foreground">{dispatch.contactName || 'N/A'}</span>
          )}
        </div>
      )
    },
    {
      key: 'status',
      title: t('dispatcher.status'),
      render: (dispatch: DisplayDispatch) => {
        const statusConfig: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string; className?: string }> = {
          'pending': { variant: 'outline', label: t('dispatcher.statuses.pending', 'Pending') },
          'assigned': { variant: 'secondary', label: t('dispatcher.statuses.assigned', 'Assigned') },
          'acknowledged': { variant: 'secondary', label: t('dispatcher.statuses.acknowledged', 'Acknowledged') },
          'en_route': { variant: 'default', label: t('dispatcher.statuses.en_route', 'En Route') },
          'on_site': { variant: 'default', label: t('dispatcher.statuses.on_site', 'On Site') },
          'in_progress': { variant: 'default', label: t('dispatcher.statuses.in_progress', 'In Progress') },
          'technically_completed': { variant: 'destructive', label: t('dispatcher.statuses.technically_completed', 'Technically Completed') },
          'completed': { variant: 'default', label: t('dispatcher.statuses.completed', 'Completed'), className: 'bg-success text-success-foreground hover:bg-success/80' },
          'cancelled': { variant: 'destructive', label: t('dispatcher.statuses.cancelled', 'Cancelled') },
          'not_scheduled': { variant: 'outline', label: t('dispatcher.statuses.not_scheduled', 'Not Scheduled') },
          'scheduled': { variant: 'secondary', label: t('dispatcher.statuses.scheduled', 'Scheduled') }
        };
        const config = statusConfig[dispatch.status?.toLowerCase()] || { variant: 'outline' as const, label: dispatch.status || 'Unknown' };
        return (
          <Badge variant={config.variant} className={config.className}>
            {config.label}
          </Badge>
        );
      }
    },
    {
      key: 'priority',
      title: t('dispatcher.priority'),
      render: (dispatch: DisplayDispatch) => (
        <Badge variant={getPriorityColor(dispatch.priority)}>
          {t(`dispatcher.priority_${dispatch.priority}`)}
        </Badge>
      )
    },
    {
      key: 'schedule',
      title: 'Schedule',
      render: (dispatch: DisplayDispatch) => (
        <div className="text-sm">
          {dispatch.scheduledDate ? (
            <>
              <div>{dispatch.scheduledDate.toLocaleDateString()}</div>
              <div className="text-muted-foreground">
                {dispatch.scheduledStartTime || ''} {dispatch.scheduledStartTime && dispatch.scheduledEndTime ? '-' : ''} {dispatch.scheduledEndTime || ''}
              </div>
            </>
          ) : (
            <span className="text-muted-foreground">{t('dispatcher.not_scheduled')}</span>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="flex flex-col">
      {/* Header - match Service Orders style */}
      <header className="flex items-center justify-between gap-2 p-3 sm:p-4 border-b border-border bg-card/50 backdrop-blur">
        <div className="flex-1 min-w-0">
          <DispatcherHeader onDispatchJobs={handleDispatchJobs} hasCreateAccess={hasCreateAccess} />
        </div>
        <Button variant="outline" size="sm" onClick={() => setDemoOpen(true)} className="hidden sm:inline-flex gap-1.5 shrink-0">
          <Play className="h-3.5 w-3.5" /> {t('dispatcher.watchDemo', 'Watch Demo')}
        </Button>
      </header>

      {/* Stats Cards */}
      <div className="p-3 sm:p-4 border-b border-border">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {statsData.map((stat, index) => {
            const isSelected = selectedStat === stat.filter;
            return (
              <Card 
                key={index} 
                className={`shadow-card hover-lift gradient-card group cursor-pointer transition-all hover:shadow-lg ${
                  isSelected 
                    ? 'border-2 border-primary bg-primary/5' 
                    : 'border-0'
                }`}
                onClick={() => handleStatClick(stat)}
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
                placeholder={t("dispatcher.search_placeholder")}
                value={filters.searchTerm}
                onChange={(value) => setFilters(prev => ({...prev, searchTerm: value}))}
                className="w-full"
              />
            </div>
            <div className="relative">
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-1 sm:gap-2 px-2 sm:px-3" 
                onClick={() => setShowFilterBar(s => !s)}
              >
                <Filter className="h-4 w-4" />
                <span className="hidden sm:inline">{t('dispatcher.filters')}</span>
                {(filters.status !== 'all' || filters.priority !== 'all') && (
                  <Badge variant="secondary" className="ml-2 h-4 px-1 text-xs">
                    {[
                      filters.status !== 'all' ? 1 : 0,
                      filters.priority !== 'all' ? 1 : 0
                    ].reduce((a, b) => a + b, 0)}
                  </Badge>
                )}
              </Button>
            </div>
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
              onClick={() => setViewMode('table')} data-non-list-view="true" 
              className={`flex-1 sm:flex-none ${viewMode === 'table' ? 'bg-primary text-white hover:bg-primary/90' : ''}`}
            >
              <TableIcon className={`h-4 w-4 ${viewMode === 'table' ? 'text-white' : ''}`} />
            </Button>
            {/* Kanban view button - commented out for now
            <Button 
              variant={viewMode === 'kanban' ? 'default' : 'outline'} 
              size="sm" 
              onClick={() => setViewMode('kanban')} data-non-list-view="true" 
              className={`flex-1 sm:flex-none ${viewMode === 'kanban' ? 'bg-primary text-white hover:bg-primary/90' : ''}`}
            >
              <LayoutGrid className={`h-4 w-4 ${viewMode === 'kanban' ? 'text-white' : ''}`} />
            </Button>
            */}
          </div>
        </div>
      </section>

      {showFilterBar && (
        <div className="p-3 sm:p-4 border-b border-border bg-background/50">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="relative">
                <select 
                  className="border rounded px-3 py-2 pr-10 appearance-none bg-background text-foreground w-full text-sm" 
                  value={filters.status} 
                  onChange={e => setFilters(prev => ({...prev, status: e.target.value}))}
                >
                  <option value="all">{t('dispatcher.all_statuses')}</option>
                  <option value="pending">{t('dispatcher.status_pending')}</option>
                  <option value="assigned">{t('dispatcher.status_assigned')}</option>
                  <option value="in_progress">{t('dispatcher.status_in_progress')}</option>
                  <option value="completed">{t('dispatcher.status_completed')}</option>
                  <option value="cancelled">{t('dispatcher.status_cancelled')}</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
              <div className="relative">
                <select 
                  className="border rounded px-3 py-2 pr-10 appearance-none bg-background text-foreground w-full text-sm" 
                  value={filters.priority} 
                  onChange={e => setFilters(prev => ({...prev, priority: e.target.value}))}
                >
                  <option value="all">{t('dispatcher.all_priorities')}</option>
                  <option value="urgent">Urgent</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="sticky top-0 z-30 bg-destructive/10 border-b border-destructive/20 p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Checkbox
                checked={selectedIds.size === filteredDispatches.length}
                onCheckedChange={toggleSelectAll}
              />
              <span className="text-sm font-medium text-foreground">
                {t('dispatcher.selected_count', { count: selectedIds.size })}
              </span>
              <Button variant="ghost" size="sm" onClick={clearSelection} className="text-muted-foreground">
                <span className="hidden sm:inline">{t('dispatcher.deselect_all')}</span>
              </Button>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowBulkDeleteConfirm(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">{t('dispatcher.bulk_delete')}</span>
            </Button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="p-3 sm:p-4">
        <Card className="shadow-card border-0">
          <CardContent className="p-0">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsContent value="dispatches">
                {isLoading ? (
                  <div className="p-4 space-y-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="flex items-center gap-4">
                        <Skeleton className="h-8 w-24" />
                        <Skeleton className="h-8 w-40" />
                        <Skeleton className="h-8 w-32" />
                        <Skeleton className="h-8 w-20" />
                        <Skeleton className="h-8 w-28" />
                      </div>
                    ))}
                  </div>
                ) : viewMode === 'kanban' ? (
                  <DispatchesKanbanView 
                    dispatches={filteredDispatches}
                    onDispatchClick={(id) => handleDispatchClick(id)}
                    onStatusChange={async (dispatchId, newStatus) => {
                      try {
                        await dispatchesApi.updateStatus(Number(dispatchId), newStatus);
                        await fetchDispatches();
                      } catch (err) {
                        console.error('Failed to update dispatch status:', err);
                      }
                    }}
                  />
                ) : viewMode === 'table' ? (
                  <>
                    <SimplePaginationBar
                      startIndex={pagination.info.startIndex}
                      endIndex={pagination.info.endIndex}
                      totalItems={filteredDispatches.length}
                      currentPage={pagination.state.currentPage}
                      totalPages={pagination.info.totalPages}
                      hasPreviousPage={pagination.info.hasPreviousPage}
                      hasNextPage={pagination.info.hasNextPage}
                      onPreviousPage={pagination.actions.previousPage}
                      onNextPage={pagination.actions.nextPage}
                    />
                    <div className="overflow-x-auto w-full scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent"
                         style={{ WebkitOverflowScrolling: 'touch' }}>
                      <TableLayout
                        items={pagination.data}
                        columns={dispatchColumns}
                        rowKey={(d: any) => d.id}
                        tableClassName="min-w-full"
                        onRowClick={(dispatch: DisplayDispatch) => handleDispatchClick(dispatch.id)}
                        emptyState={
                          <div className="text-center py-12 text-muted-foreground">
                            <CalendarRange className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <h3 className="font-medium mb-2">{t('dispatcher.no_dispatches')}</h3>
                            <p>{t('dispatcher.no_dispatches_description')}</p>
                          </div>
                        }
                      />
                    </div>
                    <SimplePaginationBar
                      startIndex={pagination.info.startIndex}
                      endIndex={pagination.info.endIndex}
                      totalItems={filteredDispatches.length}
                      currentPage={pagination.state.currentPage}
                      totalPages={pagination.info.totalPages}
                      hasPreviousPage={pagination.info.hasPreviousPage}
                      hasNextPage={pagination.info.hasNextPage}
                      onPreviousPage={pagination.actions.previousPage}
                      onNextPage={pagination.actions.nextPage}
                      className="border-b-0 border-t"
                    />
                  </>
                ) : (
                  <div className="p-3 sm:p-4">
                    {filteredDispatches.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <CalendarRange className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <h3 className="font-medium mb-2">{t('dispatcher.no_dispatches')}</h3>
                        <p>{t('dispatcher.no_dispatches_description')}</p>
                      </div>
                    ) : (
                      <>
                      <SimplePaginationBar
                        startIndex={pagination.info.startIndex}
                        endIndex={pagination.info.endIndex}
                        totalItems={filteredDispatches.length}
                        currentPage={pagination.state.currentPage}
                        totalPages={pagination.info.totalPages}
                        hasPreviousPage={pagination.info.hasPreviousPage}
                        hasNextPage={pagination.info.hasNextPage}
                        onPreviousPage={pagination.actions.previousPage}
                        onNextPage={pagination.actions.nextPage}
                      />
                      <div className="divide-y divide-border">
                        {pagination.data.map((dispatch) => (
                          <div
                            key={dispatch.id} 
                            className={`p-4 hover:bg-muted/50 transition-colors group cursor-pointer ${selectedIds.has(dispatch.id) ? 'bg-primary/5' : ''}`}
                            onClick={() => handleDispatchClick(dispatch.id)}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                              <div className="flex items-start sm:items-center gap-3 sm:gap-4 flex-1 min-w-0">
                                <Checkbox
                                  checked={selectedIds.has(dispatch.id)}
                                  onCheckedChange={() => toggleSelect(dispatch.id)}
                                  onClick={(e: React.MouseEvent) => e.stopPropagation()}
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2 mb-1">
                                    <div className="min-w-0 flex-1">
                                      <h3 className="list-row-title truncate">{dispatch.dispatchNumber}</h3>
                                      <div className="flex items-center gap-2 flex-wrap mt-1">
                                        <Badge variant={getPriorityColor(dispatch.priority)}>
                                          {t(`dispatcher.priority_${dispatch.priority}`)}
                                        </Badge>
                                        <Badge
                                          variant="outline"
                                          className="text-xs cursor-pointer hover:bg-primary hover:text-white"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleServiceOrderClick(dispatch.serviceOrderId);
                                          }}
                                        >
                                          {dispatch.serviceOrderNumber || `SO-${dispatch.serviceOrderId}`}
                                        </Badge>
                                      </div>
                                    </div>
                                    <Badge className={`${getStatusColorClass('dispatch', dispatch.status)} text-px-10 px-2 py-0.5 shrink-0 capitalize`}>
                                      {t(`dispatcher.statuses.${dispatch.status}`, dispatch.status.replace('_', ' '))}
                                    </Badge>
                                  </div>
                                  <div className="list-row-subtitle mb-2 flex flex-wrap gap-1">
                                    <span>Technicians:</span>
                                    {dispatch.assignedTechnicianIds.length > 0 ? (
                                      dispatch.assignedTechnicianIds.map((techId, idx) => (
                                        <button
                                          key={techId}
                                          onClick={(e) => handleTechnicianClick(techId, e)}
                                          className="text-primary hover:underline"
                                        >
                                          {techniciansMap.get(techId)?.firstName || dispatch.assignedTechnicians[idx] || `Technician ${techId}`}
                                          {idx < dispatch.assignedTechnicianIds.length - 1 ? ',' : ''}
                                        </button>
                                      ))
                                    ) : (
                                      <span>{dispatch.assignedTechnicians.join(', ')}</span>
                                    )}
                                  </div>
                                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-px-10 text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      <span>
                                        {dispatch.scheduledDate?.toLocaleDateString()} 
                                        {dispatch.scheduledStartTime && ` ${dispatch.scheduledStartTime}-${dispatch.scheduledEndTime}`}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <MapPin className="h-3 w-3" />
                                      <span>{dispatch.estimatedDuration} min</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <SimplePaginationBar
                        startIndex={pagination.info.startIndex}
                        endIndex={pagination.info.endIndex}
                        totalItems={filteredDispatches.length}
                        currentPage={pagination.state.currentPage}
                        totalPages={pagination.info.totalPages}
                        hasPreviousPage={pagination.info.hasPreviousPage}
                        hasNextPage={pagination.info.hasNextPage}
                        onPreviousPage={pagination.actions.previousPage}
                        onNextPage={pagination.actions.nextPage}
                        className="border-b-0 border-t"
                      />
                      </>
                    )}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Autopilot product demo */}
      <PlanningAutopilotDemo open={demoOpen} onClose={() => setDemoOpen(false)} />

      {/* Technician Detail Modal */}
      <TechnicianDetailModal
        technician={selectedTechnician}
        open={technicianModalOpen}
        onOpenChange={setTechnicianModalOpen}
      />

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={showBulkDeleteConfirm} onOpenChange={setShowBulkDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-destructive/10">
                <Trash2 className="h-5 w-5 text-destructive" />
              </div>
              <AlertDialogTitle>
                {t('dispatcher.bulk_delete_confirm_title', { count: selectedIds.size })}
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-left">
              {t('dispatcher.bulk_delete_confirm_description', { count: selectedIds.size })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={bulkDeleting}>
              {t('dispatcher.cancel', 'Cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              disabled={bulkDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {bulkDeleting ? t('dispatcher.bulk_deleting', 'Deleting...') : t('dispatcher.confirm_delete', 'Delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
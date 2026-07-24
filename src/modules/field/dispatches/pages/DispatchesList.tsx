import { useState } from "react";
import { Input } from "@/components/ui/input";
import { useTranslation } from "react-i18next";
import { getStatusColorClass } from "@/config/entity-statuses";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { CollapsibleSearch } from "@/components/ui/collapsible-search";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  Users,
  Calendar,
  Clock,
  Eye,
  FileText,
  Edit,
  MapPin,
  Wrench,
  Map,
  Download,
  Plus,
  Trash2,
  MoreVertical,
  Loader2,
  Play,
  ClipboardList,
  SlidersHorizontal,
  Search
} from "lucide-react";
import { mockDispatches } from "../data";
import { DispatchesAutopilotDemo } from "../components/onboarding/DispatchesAutopilotDemo";
import type { DispatchJob } from "../types";
import { isViewAllMode } from '@/utils/tenant';
import { CompanyBadge } from '@/components/CompanyBadge';
import { MapOverlay } from "@/components/shared/MapOverlay";
import { mapDispatchesToMapItems } from "@/components/shared/mappers";
import { ExportModal, ExportConfig } from "@/components/shared/ExportModal";
import { usePermissions } from "@/hooks/usePermissions";
import { useDispatchDeletion } from "../hooks/useDispatchDeletion";
import { useToast } from "@/hooks/use-toast";
import { CreateActionButton } from '@/components/CreateActionButton';
import TableLayout, { Column } from "@/components/shared/TableLayout";
import { TableRowActions } from "@/shared/components/TableRowActions";

export default function DispatchesList() {
  const { t } = useTranslation();
  const { t: tDispatches } = useTranslation('dispatches');
  const navigate = useNavigate();
  const { toast } = useToast();
  const { canCreate, canRead, canUpdate, canDelete, isLoading: permissionsLoading, isMainAdmin } = usePermissions();
  const { deleteDispatch, bulkDeleteDispatches, isDeleting: isDeletingHook } = useDispatchDeletion();
  const [dispatches, setDispatches] = useState<DispatchJob[]>(mockDispatches);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showMap, setShowMap] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);

  // Single delete state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [dispatchToDelete, setDispatchToDelete] = useState<DispatchJob | null>(null);

  const [showMobileFilters, setShowMobileFilters] = useState(false);

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

  const getStatusColor = (status: string) => getStatusColorClass('dispatch', status);

  const getPriorityColor = (priority: DispatchJob["priority"]) => {
    const colors = {
      low: "bg-muted text-muted-foreground",
      medium: "bg-primary/10 text-primary", 
      high: "bg-warning/10 text-warning",
      urgent: "bg-destructive/10 text-destructive"
    };
    return colors[priority] || "bg-muted text-muted-foreground";
  };

  const handleDispatchClick = (dispatch: DispatchJob) => {
    navigate(`/dashboard/field/dispatches/${dispatch.id}`);
  };

  const handleEditDispatch = (dispatch: DispatchJob) => {
    navigate(`/dashboard/field/dispatches/edit/${dispatch.id}`);
  };

  // Single delete handlers
  const handleDeleteClick = (dispatch: DispatchJob) => {
    setDispatchToDelete(dispatch);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!dispatchToDelete) return;
    
    const success = await deleteDispatch(dispatchToDelete.id);
    if (success) {
      setDispatches(prev => prev.filter(d => d.id !== dispatchToDelete.id));
    }
    setDeleteDialogOpen(false);
    setDispatchToDelete(null);
  };

  // Bulk selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(filteredDispatches.map(d => d.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectItem = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedIds);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedIds(newSelected);
  };

  const handleBulkDelete = async () => {
    const idsToDelete = Array.from(selectedIds);
    setIsBulkDeleting(true);
    setBulkDeleteProgress(0);

    const successIds = await bulkDeleteDispatches(idsToDelete, (percent) => {
      setBulkDeleteProgress(percent);
    });

    const successSet = new Set(successIds.map(String));
    setDispatches(prev => prev.filter(d => !successSet.has(d.id)));
    setIsBulkDeleting(false);
    setShowBulkDeleteDialog(false);
    setSelectedIds(new Set());
    setBulkDeleteProgress(0);
  };

  const exportConfig: ExportConfig = {
    filename: 'dispatches-export',
    allDataTransform: (dispatch: any) => ({
      'Job Number': dispatch.jobNumber,
      'Service Order ID': dispatch.serviceOrderId,
      'Service Order Number': dispatch.serviceOrderNumber,
      'Title': dispatch.title,
      'Description': dispatch.description,
      'Status': dispatch.status,
      'Priority': dispatch.priority,
      'Customer Company': dispatch.customer.company,
      'Customer Contact': dispatch.customer.contactPerson,
      'Customer Phone': dispatch.customer.phone,
      'Customer Email': dispatch.customer.email,
      'Scheduled Start': dispatch.scheduledStartTime,
      'Scheduled End': dispatch.scheduledEndTime,
      'Estimated Duration': dispatch.estimatedDuration,
      'Assigned Technicians': dispatch.assignedTechnicians.map((t: any) => t.name).join(', '),
      'Created At': new Date(dispatch.createdAt).toLocaleDateString(),
      'Updated At': dispatch.updatedAt ? new Date(dispatch.updatedAt).toLocaleDateString() : 'N/A',
    }),
    availableColumns: [
      { key: 'jobNumber', label: 'Job Number', category: 'Basic' },
      { key: 'serviceOrderId', label: 'Service Order ID', category: 'Basic' },
      { key: 'serviceOrderNumber', label: 'Service Order Number', category: 'Basic' },
      { key: 'title', label: 'Title', category: 'Basic' },
      { key: 'description', label: 'Description', category: 'Basic' },
      { key: 'status', label: 'Status', category: 'Basic' },
      { key: 'priority', label: 'Priority', category: 'Basic' },
      { key: 'customer.company', label: 'Customer Company', category: 'Customer' },
      { key: 'customer.contactPerson', label: 'Customer Contact', category: 'Customer' },
      { key: 'customer.phone', label: 'Customer Phone', category: 'Customer' },
      { key: 'customer.email', label: 'Customer Email', category: 'Customer' },
      { key: 'scheduledStartTime', label: 'Scheduled Start', category: 'Schedule' },
      { key: 'scheduledEndTime', label: 'Scheduled End', category: 'Schedule' },
      { key: 'estimatedDuration', label: 'Estimated Duration', category: 'Schedule' },
      { key: 'assignedTechnicians', label: 'Assigned Technicians', category: 'Assignment', transform: (techs: any[]) => Array.isArray(techs) ? techs.map(t => t.name).join(', ') : '' },
      { key: 'createdAt', label: 'Created Date', category: 'Timeline', transform: (date: string) => new Date(date).toLocaleDateString() },
      { key: 'updatedAt', label: 'Updated Date', category: 'Timeline', transform: (date: string) => date ? new Date(date).toLocaleDateString() : 'N/A' },
    ]
  };

  const filteredDispatches = dispatches.filter(dispatch => {
    const matchesSearch = searchTerm === "" || 
      dispatch.jobNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dispatch.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dispatch.customer.company.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || dispatch.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const isAllSelected = filteredDispatches.length > 0 && filteredDispatches.every(d => selectedIds.has(d.id));
  const isSomeSelected = filteredDispatches.some(d => selectedIds.has(d.id));

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-gradient-subtle backdrop-blur-sm sticky top-0 z-20 shadow-soft">
        <div className="px-3 sm:px-4 py-3 sm:py-4 md:py-6">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0">
              <div className="p-2 sm:p-3 rounded-lg bg-primary/10 flex-shrink-0">
                <Wrench className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-2xl font-bold text-foreground truncate">{t("dispatches.title")}</h1>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">{t("dispatches.subtitle")}</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0">
              <Button variant="outline" size="sm" onClick={() => setDemoOpen(true)} className="hidden sm:inline-flex gap-1.5">
                <Play className="h-3.5 w-3.5" /> {tDispatches('watchDemo', 'Watch Demo')}
              </Button>
              {hasCreateAccess && (
                <CreateActionButton onClick={() => navigate('/dashboard/field/dispatches/create')}>
                  <Plus className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">{t('dispatches.create_dispatch')}</span>
                </CreateActionButton>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Autopilot product demo */}
      <DispatchesAutopilotDemo open={demoOpen} onClose={() => setDemoOpen(false)} />

      <div className="px-4 py-6">
        {/* Filters */}

        {/* Mobile toolbar */}
        <div className="md:hidden flex items-center gap-2 mb-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9 h-9"
              placeholder={t("dispatches.search_placeholder")}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-9 w-9 p-0 shrink-0 relative"
            onClick={() => setShowMobileFilters(v => !v)}
          >
            <SlidersHorizontal className="h-4 w-4" />
            {statusFilter !== 'all' && (
              <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-primary text-px-9 text-white flex items-center justify-center font-bold">1</span>
            )}
          </Button>
          <Button
            variant={showMap ? 'default' : 'outline'}
            size="sm"
            className={`h-9 w-9 p-0 shrink-0 ${showMap ? 'bg-primary text-white hover:bg-primary/90' : ''}`}
            onClick={() => setShowMap(!showMap)}
          >
            <Map className={`h-4 w-4 ${showMap ? 'text-white' : ''}`} />
          </Button>
          {hasCreateAccess && (
            <CreateActionButton
              size="sm"
              className="h-9 shrink-0"
              onClick={() => navigate('/dashboard/field/dispatches/create')}
            >
              <Plus className="h-4 w-4" />
            </CreateActionButton>
          )}
        </div>

        {/* Mobile collapsible filter panel */}
        {showMobileFilters && (
          <div className="md:hidden mt-2 grid grid-cols-2 gap-2 pb-2 mb-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="col-span-2 px-3 py-2 h-9 border border-border rounded-md bg-background text-foreground w-full text-sm"
            >
              <option value="all">{t("dispatches.all_statuses")}</option>
              <option value="pending">{t("dispatches.statuses.pending")}</option>
              <option value="planned">{t("dispatches.statuses.planned")}</option>
              <option value="confirmed">{t("dispatches.statuses.confirmed")}</option>
              <option value="rejected">{t("dispatches.statuses.rejected")}</option>
              <option value="in_progress">{t("dispatches.statuses.in_progress")}</option>
              <option value="completed">{t("dispatches.statuses.completed")}</option>
              <option value="cancelled">{t("dispatches.statuses.cancelled")}</option>
            </select>
            <Button variant="outline" size="sm" className="h-9 gap-1.5" onClick={() => setShowExportModal(true)}>
              <Download className="h-4 w-4" />
              {t('common.export')}
            </Button>
            {statusFilter !== 'all' && (
              <Button
                variant="ghost"
                size="sm"
                className="h-9 text-muted-foreground hover:text-foreground"
                onClick={() => setStatusFilter('all')}
              >
                Clear filters
              </Button>
            )}
          </div>
        )}

        {/* Desktop toolbar — unchanged */}
        <div className="hidden md:grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="sm:col-span-2 md:col-span-2">
            <CollapsibleSearch
              placeholder={t("dispatches.search_placeholder")}
              value={searchTerm}
              onChange={setSearchTerm}
              className="w-full"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-border rounded-md bg-background text-foreground w-full"
          >
            <option value="all">{t("dispatches.all_statuses")}</option>
            <option value="pending">{t("dispatches.statuses.pending")}</option>
            <option value="planned">{t("dispatches.statuses.planned")}</option>
            <option value="confirmed">{t("dispatches.statuses.confirmed")}</option>
            <option value="rejected">{t("dispatches.statuses.rejected")}</option>
            <option value="in_progress">{t("dispatches.statuses.in_progress")}</option>
            <option value="completed">{t("dispatches.statuses.completed")}</option>
            <option value="cancelled">{t("dispatches.statuses.cancelled")}</option>
          </select>

          <div className="flex flex-wrap items-center gap-2">
            {/* Bulk delete button */}
            {hasDeleteAccess && selectedIds.size > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowBulkDeleteDialog(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">{t('dispatches.bulk.delete_selected')}</span>
                <span>({selectedIds.size})</span>
              </Button>
            )}

            <Button
              variant={showMap ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowMap(!showMap)}
              className={`flex-1 sm:flex-none ${showMap ? 'bg-primary text-white hover:bg-primary/90' : ''}`}
            >
              <Map className={`h-4 w-4 ${showMap ? 'text-white' : ''}`} />
            </Button>
            <Button variant="outline" size="sm" className="gap-1 sm:gap-2 px-2 sm:px-3" onClick={() => setShowExportModal(true)}>
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">{t('common.export')}</span>
            </Button>
          </div>
        </div>

        <Card className="shadow-card border-0 bg-card">
          {/* Map Section */}
          {showMap && (
            <MapOverlay
              items={mapDispatchesToMapItems(filteredDispatches)}
              onViewItem={(item) => handleDispatchClick(filteredDispatches.find(d => d.id === item.id)!)}
              onEditItem={(item) => handleEditDispatch(filteredDispatches.find(d => d.id === item.id)!)}
              onClose={() => setShowMap(false)}
              isVisible={showMap}
            />
          )}
          
          <CardContent className={showMap ? "pt-4 p-0" : "p-0"}>
            {filteredDispatches.length === 0 ? (
              <div className="p-12 text-center">
                <Wrench className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">{t('dispatches.no_dispatches')}</h3>
                <p className="text-muted-foreground mb-4">
                  {t('dispatches.no_dispatches_description')}
                </p>
                {hasCreateAccess && (
                  <CreateActionButton onClick={() => navigate('/dashboard/field/dispatches/create')}>
                    <Plus className="h-4 w-4 mr-2" />
                    {t('dispatches.create_dispatch')}
                  </CreateActionButton>
                )}
              </div>
            ) : (
              <>
                {/* Mobile cards — visible below md breakpoint (matches Service Orders list) */}
                <div className="md:hidden list-editorial">
                  {filteredDispatches.map((dispatch) => (
                    <div
                      key={dispatch.id}
                      className="list-row-editorial"
                      onClick={() => handleDispatchClick(dispatch)}
                    >
                      {/* Header: icon + dispatch/job number + priority + status */}
                      <div className="flex items-start gap-3 mb-2.5">
                        <div className="list-row-avatar mt-0.5">
                          <ClipboardList className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="list-row-title flex-1">{dispatch.jobNumber}</p>
                            <div className="flex items-center gap-1 shrink-0">
                              <Badge className={`${getPriorityColor(dispatch.priority)} text-px-10 px-2 py-0.5 capitalize`}>
                                {t(`dispatches.priorities.${dispatch.priority}`)}
                              </Badge>
                              <Badge className={`${getStatusColor(dispatch.status)} text-px-10 px-2 py-0.5`}>
                                {t(`dispatches.statuses.${dispatch.status}`)}
                              </Badge>
                            </div>
                          </div>
                          <p className="list-row-subtitle">
                            {dispatch.customer.company}
                            {dispatch.title ? ` · ${dispatch.title}` : ''}
                          </p>
                        </div>
                      </div>

                      {/* Details */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pl-[52px] mb-3">
                        {dispatch.customer.address?.city && (
                          <div className="list-row-meta-item">
                            <MapPin className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate max-w-[160px]">{dispatch.customer.address.city}</span>
                          </div>
                        )}
                        {dispatch.assignedTechnicians.length > 0 && (
                          <div className="list-row-meta-item">
                            <Users className="h-3.5 w-3.5 shrink-0" />
                            <span>{dispatch.assignedTechnicians.length} {t('list.technicians', 'technicians')}</span>
                          </div>
                        )}
                        {dispatch.scheduledDate && (
                          <div className="list-row-meta-item">
                            <Calendar className="h-3.5 w-3.5 shrink-0" />
                            <span>{dispatch.scheduledDate.toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>

                      {/* Footer: actions */}
                      <div className="flex items-center justify-end pl-[52px]" onClick={(e) => e.stopPropagation()}>
                        <TableRowActions actions={[
                          { icon: Eye, label: t('common.view'), onClick: (e) => { e.stopPropagation(); handleDispatchClick(dispatch); } },
                          { icon: Edit, label: t('common.edit'), onClick: (e) => { e.stopPropagation(); handleEditDispatch(dispatch); }, show: hasUpdateAccess },
                          { icon: FileText, label: t('common.report', 'Report'), onClick: (e) => { e.stopPropagation(); window.open(`/dashboard/field/dispatches/${dispatch.id}/report`, '_blank'); } },
                          { icon: Trash2, label: t('common.delete'), onClick: (e) => { e.stopPropagation(); handleDeleteClick(dispatch); }, variant: 'destructive', show: hasDeleteAccess },
                        ]} />
                      </div>
                    </div>
                  ))}
                </div>


                {/* Desktop table — hidden on mobile */}
                <div className="hidden md:block overflow-x-auto">
                  <TableLayout
                    items={filteredDispatches}
                    rowKey={(dispatch) => dispatch.id}
                    onRowClick={handleDispatchClick}
                    tableClassName="w-full min-w-[900px]"
                    enableSelection={hasDeleteAccess}
                    selectedIds={selectedIds}
                    onSelectionChange={(ids) => setSelectedIds(ids as Set<string>)}
                    bulkActions={hasDeleteAccess && selectedIds.size > 0 ? (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setShowBulkDeleteDialog(true)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        {t('dispatches.bulk.delete_selected')} ({selectedIds.size})
                      </Button>
                    ) : undefined}
                    emptyTitle={t('dispatches.no_dispatches')}
                    emptyDescription={t('dispatches.no_dispatches_description')}
                    columns={[
                      {
                        key: 'jobNumber',
                        title: t('dispatches.job_number'),
                        render: (dispatch) => (
                          <div>
                            <div>{dispatch.jobNumber}</div>
                            <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                              {dispatch.title}
                            </div>
                          </div>
                        )
                      },
                      ...(isViewAllMode() ? [{
                        key: 'company',
                        title: 'Company',
                        render: (dispatch: DispatchJob) => <CompanyBadge tenantId={(dispatch as any).tenantId} forceShow />,
                      } as Column<DispatchJob>] : []),
                      {
                        key: 'customer',
                        title: t('dispatches.customer'),
                        render: (dispatch) => (
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-primary" />
                            <div>
                              <div>{dispatch.customer.company}</div>
                              <div className="text-sm text-muted-foreground flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {dispatch.customer.address.city}
                              </div>
                            </div>
                          </div>
                        )
                      },
                      {
                        key: 'scheduledDate',
                        title: t('dispatches.scheduled_date'),
                        render: (dispatch) => (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-primary" />
                            <div>
                              <div>{dispatch.scheduledDate?.toLocaleDateString()}</div>
                              <div className="text-sm text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {dispatch.scheduledStartTime} - {dispatch.scheduledEndTime}
                              </div>
                            </div>
                          </div>
                        )
                      },
                      {
                        key: 'technicians',
                        title: t('dispatches.technicians'),
                        render: (dispatch) => (
                          dispatch.assignedTechnicians.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {dispatch.assignedTechnicians.slice(0, 2).map((tech) => (
                                <Badge key={tech.id} variant="secondary" className="text-xs">
                                  {tech.name}
                                </Badge>
                              ))}
                              {dispatch.assignedTechnicians.length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{dispatch.assignedTechnicians.length - 2}
                                </Badge>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">
                              {t('dispatches.overview.none_assigned')}
                            </span>
                          )
                        )
                      },
                      {
                        key: 'status',
                        title: t('dispatches.overview.current_status'),
                        render: (dispatch) => (
                          <Badge className={`${getStatusColor(dispatch.status)} text-xs font-medium`}>
                            {t(`dispatches.statuses.${dispatch.status}`)}
                          </Badge>
                        )
                      },
                      {
                        key: 'priority',
                        title: t('dispatches.job_info.priority'),
                        render: (dispatch) => (
                          <Badge className={`${getPriorityColor(dispatch.priority)} text-xs font-medium`}>
                            {t(`dispatches.priorities.${dispatch.priority}`)}
                          </Badge>
                        )
                      },
                      {
                        key: 'actions',
                        title: t('common.actions'),
                        headerClass: 'text-right whitespace-nowrap',
                        cellClass: 'px-3 py-2 text-right whitespace-nowrap',
                        render: (dispatch) => (
                          <TableRowActions actions={[
                            { icon: Eye, label: t('common.view'), onClick: (e) => { e.stopPropagation(); handleDispatchClick(dispatch); } },
                            { icon: Edit, label: t('common.edit'), onClick: (e) => { e.stopPropagation(); handleEditDispatch(dispatch); }, show: hasUpdateAccess },
                            { icon: FileText, label: t('common.report', 'Report'), onClick: (e) => { e.stopPropagation(); window.open(`/dashboard/field/dispatches/${dispatch.id}/report`, '_blank'); } },
                            { icon: Trash2, label: t('common.delete'), onClick: (e) => { e.stopPropagation(); handleDeleteClick(dispatch); }, variant: 'destructive', show: hasDeleteAccess },
                          ]} className="justify-end" />
                        )
                      }
                    ]}
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Single Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={(open) => !isDeletingHook && setDeleteDialogOpen(open)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">
              {t('dispatches.delete_title')}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>{t('dispatches.delete_description', { jobNumber: dispatchToDelete?.jobNumber })}</p>
                <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                  <li>{t('dispatches.delete_warning_permanent')}</li>
                  <li>{t('dispatches.delete_warning_job_reset')}</li>
                  <li>{t('dispatches.delete_warning_so_recalc')}</li>
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingHook}>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeletingHook}
            >
              {isDeletingHook ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {isDeletingHook ? t('dispatches.deleting') : t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={showBulkDeleteDialog} onOpenChange={(open) => !isBulkDeleting && setShowBulkDeleteDialog(open)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">
              {t('dispatches.bulk.delete_title')}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>{t('dispatches.bulk.delete_description', { count: selectedIds.size })}</p>
                <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                  <li>{t('dispatches.bulk.delete_warning_permanent', { count: selectedIds.size })}</li>
                  <li>{t('dispatches.bulk.delete_warning_jobs_reset', { count: selectedIds.size })}</li>
                  <li>{t('dispatches.bulk.delete_warning_so_recalc')}</li>
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          {isBulkDeleting && (
            <div className="my-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">{t('dispatches.bulk.deleting_progress')}</span>
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
            <AlertDialogCancel disabled={isBulkDeleting}>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleBulkDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isBulkDeleting}
            >
              {isBulkDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {isBulkDeleting ? t('dispatches.bulk.deleting') : t('dispatches.bulk.delete_selected')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Export Modal */}
      <ExportModal 
        open={showExportModal}
        onOpenChange={setShowExportModal}
        data={filteredDispatches}
        moduleName="Dispatches"
        exportConfig={exportConfig}
      />
    </div>
  );
}

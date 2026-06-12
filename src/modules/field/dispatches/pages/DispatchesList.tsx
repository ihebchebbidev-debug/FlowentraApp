import { useState } from "react";
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
  Play
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

export default function DispatchesList() {
  const { t } = useTranslation();
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
        <div className="px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <Wrench className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">{t("dispatches.title")}</h1>
                <p className="text-muted-foreground">{t("dispatches.subtitle")}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setDemoOpen(true)} className="gap-1.5">
                <Play className="h-3.5 w-3.5" /> {t('dispatches.watchDemo', 'Watch Demo')}
              </Button>
              {hasCreateAccess && (
                <CreateActionButton onClick={() => navigate('/dashboard/field/dispatches/create')}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t('dispatches.create_dispatch')}
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
        <div className="flex flex-col sm:flex-row gap-4 mb-6 items-stretch sm:items-center">
          <div className="flex-1">
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
            className="px-3 py-2 border border-border rounded-md bg-background text-foreground"
          >
            <option value="all">{t("dispatches.all_statuses")}</option>
            <option value="pending">{t("dispatches.statuses.pending")}</option>
            <option value="planned">{t("dispatches.statuses.planned")}</option>
            <option value="confirmed">{t("dispatches.statuses.confirmed")}</option>
            <option value="rejected">{t("dispatches.statuses.rejected")}</option>
            <option value="in_progress">{t("dispatches.statuses.in_progress")}</option>
            <option value="completed">{t("dispatches.statuses.completed")}</option>
          </select>
          
          <div className="flex items-center gap-2">
            {/* Bulk delete button */}
            {hasDeleteAccess && selectedIds.size > 0 && (
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={() => setShowBulkDeleteDialog(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {t('dispatches.bulk.delete_selected')} ({selectedIds.size})
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
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {hasDeleteAccess && (
                        <TableHead className="w-12">
                          <Checkbox
                            checked={isAllSelected}
                            onCheckedChange={handleSelectAll}
                            aria-label={t('dispatches.bulk.select_all')}
                          />
                        </TableHead>
                      )}
                      <TableHead>{t('dispatches.job_number')}</TableHead>
                      {isViewAllMode() && <TableHead>Company</TableHead>}
                      <TableHead>{t('dispatches.customer')}</TableHead>
                      <TableHead>{t('dispatches.scheduled_date')}</TableHead>
                      <TableHead>{t('dispatches.technicians')}</TableHead>
                      <TableHead>{t('dispatches.overview.current_status')}</TableHead>
                      <TableHead>{t('dispatches.job_info.priority')}</TableHead>
                      <TableHead className="text-right">{t('common.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDispatches.map((dispatch) => (
                      <TableRow 
                        key={dispatch.id} 
                        className="cursor-pointer hover:bg-muted/50 group"
                      >
                        {hasDeleteAccess && (
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={selectedIds.has(dispatch.id)}
                              onCheckedChange={(checked) => handleSelectItem(dispatch.id, !!checked)}
                              aria-label={t('dispatches.bulk.select_item')}
                            />
                          </TableCell>
                        )}
                        <TableCell onClick={() => handleDispatchClick(dispatch)}>
                          <div>{dispatch.jobNumber}</div>
                          <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                            {dispatch.title}
                          </div>
                        </TableCell>
                        {isViewAllMode() && (
                          <TableCell><CompanyBadge tenantId={(dispatch as any).tenantId} forceShow /></TableCell>
                        )}
                        <TableCell onClick={() => handleDispatchClick(dispatch)}>
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
                        </TableCell>
                        <TableCell onClick={() => handleDispatchClick(dispatch)}>
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
                        </TableCell>
                        <TableCell onClick={() => handleDispatchClick(dispatch)}>
                          {dispatch.assignedTechnicians.length > 0 ? (
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
                          )}
                        </TableCell>
                        <TableCell onClick={() => handleDispatchClick(dispatch)}>
                          <Badge className={`${getStatusColor(dispatch.status)} text-xs font-medium`}>
                            {t(`dispatches.statuses.${dispatch.status}`)}
                          </Badge>
                        </TableCell>
                        <TableCell onClick={() => handleDispatchClick(dispatch)}>
                          <Badge className={`${getPriorityColor(dispatch.priority)} text-xs font-medium`}>
                            {t(`dispatches.priorities.${dispatch.priority}`)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>{t('common.actions')}</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleDispatchClick(dispatch)}>
                                <Eye className="h-4 w-4 mr-2" />
                                {t('common.view')}
                              </DropdownMenuItem>
                              {hasUpdateAccess && (
                                <DropdownMenuItem onClick={() => handleEditDispatch(dispatch)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  {t('common.edit')}
                                </DropdownMenuItem>
                              )}
                              {/* Report action */}
                              <DropdownMenuItem onClick={() => window.open(`/dashboard/field/dispatches/${dispatch.id}/report`, '_blank')}>
                                <FileText className="h-4 w-4 mr-2" />
                                {t('common.report', 'Report')}
                              </DropdownMenuItem>
                              {hasDeleteAccess && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    onClick={() => handleDeleteClick(dispatch)}
                                    className="text-destructive focus:text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    {t('common.delete')}
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
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

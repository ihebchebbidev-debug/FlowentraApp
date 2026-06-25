import { useState, useEffect, useCallback, useMemo } from "react";
import { useUserNameResolver } from "@/hooks/useUserNameResolver";
import { getStatusColorClass } from "@/config/entity-statuses";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ArrowLeft, Clock, MapPin, CheckCircle, AlertCircle, User, MoreVertical, Edit, Trash2, Camera, Building, ExternalLink, Play, ClipboardList, Share2, Phone, Mail, Wrench, Calendar, FileText } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { ProfessionalShareModal } from "@/components/shared/ProfessionalShareModal";
import { SendDispatchModal } from "../components/SendDispatchModal";
import { DispatchPDFPreviewModal } from "../components/DispatchPDFPreviewModal";
import { DispatchTimeExpensesTab } from "../components/DispatchTimeExpensesTab";
import { DispatchMaterialsTab } from "../components/DispatchMaterialsTab";
import { DispatchActivityTab } from "../components/DispatchActivityTab";
import { DispatchJobsTab } from "../components/DispatchJobsTab";
import { DocumentsTab } from "../components/DocumentsTab";
import { ChecklistsSection } from "@/modules/shared/components/documents";
import type { ServiceOrderDispatch } from "../../service-orders/entities/dispatches/types";
import { DispatchStatusFlow, type DispatchStatus } from "../components/DispatchStatusFlow";
import { dispatchesApi, type TimeEntry, type Expense, type MaterialUsage } from "@/services/api/dispatchesApi";
import { contactsApi } from "@/services/api/contactsApi";
import { serviceOrdersApi } from "@/services/api/serviceOrdersApi";
import { workflowExecutionsApi } from "@/services/api/workflowApi";
import { installationsApi } from "@/services/api/installationsApi";
import { notificationsApi } from "@/services/api/notificationsApi";
import { toast } from "sonner";
import { EditableEntityNumber } from "@/components/shared/EditableEntityNumber";
import { TenantSelector } from "@/components/TenantSelector";
import { checkDuplicateDocumentNumber } from "@/services/documentNumberValidator";

interface ServiceOrderData {
  id: number;
  orderNumber: string;
  status: string;
  priority: string;
  description?: string;
  notes?: string;
  startDate?: string;
  targetCompletionDate?: string;
  estimatedDuration?: number;
  estimatedCost?: number;
  createdByName?: string;
  createdAt?: string;
  saleId?: number | string;
  offerId?: number | string;
}
interface ContactData {
  id: number;
  name: string;
  company?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
    longitude?: number;
    latitude?: number;
  };
}
interface InstallationData {
  id?: string;
  name?: string;
  model?: string;
  manufacturer?: string;
  serialNumber?: string;
  location?: string;
  type?: string;
  status?: string;
}
export default function DispatchJobDetail() {
  const {
    t
  } = useTranslation('job-detail');
  const {
    id
  } = useParams();
  const navigate = useNavigate();
  const [dispatch, setDispatch] = useState<ServiceOrderDispatch | null>(null);
  const [contact, setContact] = useState<ContactData | null>(null);
  const [installation, setInstallation] = useState<InstallationData | null>(null);
  const [serviceOrder, setServiceOrder] = useState<ServiceOrderData | null>(null);
  const [jobTitle, setJobTitle] = useState<string | null>(null);
  const [jobInstallationId, setJobInstallationId] = useState<string | null>(null);
  const [serviceOrderMaterials, setServiceOrderMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isStatusUpdating, setIsStatusUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  // The job the technician is currently working on — preselected when logging
  // time / expenses / materials on a multi-job dispatch (still changeable there).
  const [currentJobId, setCurrentJobId] = useState<number | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isPdfPreviewOpen, setIsPdfPreviewOpen] = useState(false);
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const { resolveMultipleUserNames, getUserName } = useUserNameResolver();

  // For PDF export - keep track of time entries
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Fetch dispatch data from API
  const fetchDispatchData = useCallback(async (dispatchId: number) => {
    try {
      setLoading(true);

      // Fetch dispatch details
      const dispatchData = await dispatchesApi.getById(dispatchId);

      // Map API response to component type
      const mappedDispatch: ServiceOrderDispatch = {
        id: String(dispatchData.id),
        serviceOrderId: String(dispatchData.serviceOrderId || ''),
        jobId: String(dispatchData.jobId || ''),
        installationId: dispatchData.installationId,
        installationName: dispatchData.installationName,
        jobIds: dispatchData.jobIds,
        jobs: dispatchData.jobs,
        dispatchNumber: dispatchData.dispatchNumber || `DISP-${dispatchData.id}`,
        assignedTechnicians: (dispatchData.assignedTechnicians || []).map((t: any) => {
          if (typeof t === 'string') return t;
          const name = t?.name || t?.Name;
          if (name) return name;
          const first = t?.firstName || t?.first_name || t?.FirstName;
          const last = t?.lastName || t?.last_name || t?.LastName;
          if (first || last) return `${first || ''} ${last || ''}`.trim();
          const id = t?.id ?? t?.Id ?? t?.ID ?? t?.technicianId ?? t?.TechnicianId;
          if (id) return `__RESOLVE_ID__${id}`;
          return 'Unknown';
        }),
        requiredSkills: [],
        scheduledDate: dispatchData.scheduling?.scheduledDate ? new Date(dispatchData.scheduling.scheduledDate) : dispatchData.scheduledDate ? new Date(dispatchData.scheduledDate) : undefined,
        scheduledStartTime: dispatchData.scheduling?.scheduledStartTime || dispatchData.scheduledStartTime,
        scheduledEndTime: dispatchData.scheduling?.scheduledEndTime || dispatchData.scheduledEndTime,
        estimatedDuration: dispatchData.scheduling?.estimatedDuration || (dispatchData.scheduling?.scheduledDate || dispatchData.scheduledDate ? 60 : 0),
        status: (dispatchData.status || 'pending') as any,
        priority: dispatchData.priority || 'medium',
        workloadHours: dispatchData.scheduling?.estimatedDuration ? dispatchData.scheduling.estimatedDuration / 60 : (dispatchData.scheduling?.scheduledDate || dispatchData.scheduledDate ? 1 : 0),
        dispatchedBy: dispatchData.dispatchedBy,
        dispatchedAt: dispatchData.dispatchedAt ? new Date(dispatchData.dispatchedAt) : undefined,
        createdAt: dispatchData.createdDate ? new Date(dispatchData.createdDate) : new Date(),
        updatedAt: dispatchData.modifiedDate ? new Date(dispatchData.modifiedDate) : new Date(),
        actualStartTime: dispatchData.actualStartTime ? new Date(dispatchData.actualStartTime) : undefined,
        actualEndTime: dispatchData.actualEndTime ? new Date(dispatchData.actualEndTime) : undefined
      };
      setDispatch(mappedDispatch);
      document.title = `Dispatch - ${mappedDispatch.dispatchNumber}`;

      // Resolve technician IDs to names
      const techIdsToResolve = mappedDispatch.assignedTechnicians
        .filter((t: string) => t.startsWith('__RESOLVE_ID__'))
        .map((t: string) => t.replace('__RESOLVE_ID__', ''));
      if (techIdsToResolve.length > 0) {
        resolveMultipleUserNames(techIdsToResolve);
      }

      // Fetch contact data if contactId is available
      if (dispatchData.contactId) {
        try {
          const contactData = await contactsApi.getById(dispatchData.contactId);
          setContact({
            id: contactData.id,
            name: contactData.name || '',
            company: contactData.company,
            contactPerson: contactData.name,
            phone: contactData.phone,
            email: contactData.email,
            address: contactData.address ? {
              street: contactData.address
            } : undefined
          });
        } catch (contactError) {
          console.warn('Failed to fetch contact:', contactError);
          // Use contact info from dispatch if available
          setContact({
            id: dispatchData.contactId,
            name: dispatchData.contactName || 'Unknown Contact',
            company: dispatchData.contactName,
            phone: undefined,
            email: undefined
          });
        }
      }

      // Fetch service order data for additional context
      if (dispatchData.serviceOrderId) {
        try {
          const soData: any = await serviceOrdersApi.getById(dispatchData.serviceOrderId, true);
          setServiceOrder({
            id: soData.id,
            orderNumber: soData.orderNumber,
            status: soData.status,
            priority: soData.priority,
            description: soData.description,
            notes: soData.notes,
            startDate: soData.startDate,
            targetCompletionDate: soData.targetCompletionDate,
            estimatedDuration: soData.estimatedDuration,
            estimatedCost: soData.estimatedCost,
            createdByName: soData.createdByName,
            createdAt: soData.createdAt || soData.createdDate,
            saleId: soData.saleId,
            offerId: soData.offerId
          });

          // If no contact yet, try to get from service order
          if (!dispatchData.contactId && soData.contact) {
            setContact({
              id: soData.contact.id,
              name: soData.contact.name || '',
              company: soData.contact.company,
              contactPerson: soData.contact.name,
              phone: soData.contact.phone,
              email: soData.contact.email,
              address: soData.contact.address ? {
                street: soData.contact.address
              } : undefined
            });
          }

          // Store service order materials for the materials tab
          if (soData.materials && soData.materials.length > 0) {
            setServiceOrderMaterials(soData.materials);
          }

          // Get job title and installation from job data
          if (soData.jobs && soData.jobs.length > 0 && dispatchData.jobId) {
            const job = soData.jobs.find((j: any) => String(j.id) === String(dispatchData.jobId));
            if (job) {
              // Store job title for activity display
              if (job.title) {
                setJobTitle(job.title);
              }
              // Store job's installation ID for materials filtering
              if (job.installationId) {
                setJobInstallationId(String(job.installationId));
                // Fetch installation details
                try {
                  const installationData: any = await installationsApi.getById(String(job.installationId));
                  setInstallation({
                    id: String(installationData.id),
                    name: installationData.name,
                    model: installationData.model,
                    manufacturer: installationData.manufacturer,
                    serialNumber: installationData.serialNumber,
                    location: installationData.address || installationData.location || installationData.siteAddress,
                    type: installationData.type,
                    status: installationData.status
                  });
                } catch (installError) {
                  console.warn('Failed to fetch installation:', installError);
                }
              }
            }
          }
        } catch (soError) {
          console.warn('Failed to fetch service order:', soError);
        }
      }

      // Fetch time entries for PDF export
      const timeData = await dispatchesApi.getTimeEntries(dispatchId);
      setTimeEntries(timeData);

      // Set installation from site address (fallback)
      if (dispatchData.siteAddress && !installation) {
        setInstallation({
          location: dispatchData.siteAddress
        });
      }
    } catch (error) {
      console.error('Failed to fetch dispatch:', error);
      toast.error(t('failedToLoadDispatch'));
      navigate("/dashboard/field/dispatcher");
    } finally {
      setLoading(false);
    }
  }, [navigate]);
  useEffect(() => {
    if (id) {
      const dispatchId = parseInt(id);
      if (!isNaN(dispatchId)) {
        fetchDispatchData(dispatchId);
      } else {
        navigate("/dashboard/field/dispatcher");
      }
    } else {
      navigate("/dashboard/field/dispatcher");
    }
  }, [id, navigate, fetchDispatchData]);

  // Default the "current job" to the first job once the dispatch (with its jobs)
  // loads. Also re-default when the selected job no longer belongs to the loaded
  // dispatch (e.g. after navigating to a different dispatch without remounting).
  useEffect(() => {
    const jobs = dispatch?.jobs;
    if (!jobs || jobs.length === 0) return;
    if (currentJobId == null || !jobs.some(j => j.id === currentJobId)) {
      setCurrentJobId(jobs[0].id);
    }
  }, [dispatch?.jobs, currentJobId]);

  if (loading) {
    return <div className="p-6 space-y-6 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 bg-muted rounded" />
          <div className="h-7 w-48 bg-muted rounded" />
        </div>
        <div className="h-10 w-full bg-muted/60 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-muted/60 rounded-lg" />
          ))}
        </div>
      </div>;
  }
  if (!dispatch) {
    return <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-3" />
          <h3 className="text-sm font-medium mb-2">{t('dispatch_detail.not_found')}</h3>
          <p className="text-sm text-muted-foreground mb-4">{t('dispatch_detail.not_found_message')}</p>
          <Button onClick={() => navigate("/dashboard/field/dispatcher")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('dispatch_detail.back_to_dispatcher')}
          </Button>
        </div>
      </div>;
  }
  const getStatusColor = (status: ServiceOrderDispatch["status"]) => {
    return getStatusColorClass('dispatch', status);
  };
  const getPriorityColor = (priority: ServiceOrderDispatch["priority"]) => {
    const colors = {
      low: "bg-muted/50 text-muted-foreground border-muted transition-colors",
      medium: "bg-primary/10 text-primary border-primary/20 transition-colors",
      high: "bg-warning/10 text-warning border-warning/20 transition-colors",
      urgent: "bg-destructive/10 text-destructive border-destructive/20 transition-colors"
    };
    return colors[priority] || "bg-muted/50 text-muted-foreground border-muted transition-colors";
  };
  const getStatusIcon = (status: ServiceOrderDispatch["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4" />;
      case "in_progress":
      case "on_site":
        return <Clock className="h-4 w-4" />;
      case "cancelled":
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };
  const handleStatusChange = async (newStatus: DispatchStatus) => {
    if (!dispatch || !id) return;
    const oldStatus = dispatch.status;
    setIsStatusUpdating(true);
    try {
      await dispatchesApi.updateStatus(parseInt(id), newStatus, oldStatus);
      setDispatch({
        ...dispatch,
        status: newStatus as ServiceOrderDispatch["status"]
      });
      toast.success(t('statusUpdatedTo', { status: t(`statuses.${newStatus}`, newStatus) }));

      // Recalculate parent service order status based on all dispatches
      if (dispatch.serviceOrderId) {
        try {
          await serviceOrdersApi.recalculateStatus(parseInt(String(dispatch.serviceOrderId)));
          console.log('[DISPATCH] Service order status recalculated after dispatch:', oldStatus, '->', newStatus);
        } catch (recalcError) {
          console.warn('[DISPATCH] Failed to recalculate service order status:', recalcError);
        }
      }

      // Trigger workflow engine to process status change cascading
      try {
        await workflowExecutionsApi.triggerManual(0, 'Dispatch', parseInt(id));
        console.log('[DISPATCH] Workflow triggered for dispatch status change:', oldStatus, '->', newStatus);
      } catch (workflowError) {
        console.warn('[DISPATCH] Failed to trigger workflow (backend may handle it automatically):', workflowError);
      }

      // Log activity to dispatch notes
      try {
        await dispatchesApi.addNote(parseInt(id), `Status changed from "${oldStatus}" to "${newStatus}"`, 'status_changed');
      } catch (noteError) {
        console.warn('Failed to log dispatch note:', noteError);
      }

      // Notify the dispatcher who assigned this job
      try {
        // Get current user to check if we should notify
        const currentUserData = localStorage.getItem('user_data');
        const currentUser = currentUserData ? JSON.parse(currentUserData) : null;
        const currentUserId = currentUser?.id || currentUser?.userId;
        
        // Get dispatcher ID from dispatch (the person who created/assigned it)
        // @ts-ignore - dispatchedBy may be available
        const dispatchedBy = dispatch.dispatchedBy || dispatch.createdBy;
        const dispatcherIdNum = dispatchedBy ? parseInt(String(dispatchedBy), 10) : null;
        
        // Only notify if dispatcher is different from current user (technician updating status)
        if (dispatcherIdNum && !isNaN(dispatcherIdNum) && dispatcherIdNum !== currentUserId) {
          const dispatchIdNum = typeof dispatch.id === 'string' ? parseInt(dispatch.id, 10) : dispatch.id;
          await notificationsApi.create({
            userId: dispatcherIdNum,
            title: `Dispatch Status: ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1).replace('_', ' ')}`,
            description: `Dispatch #${dispatch.dispatchNumber} status changed from "${oldStatus}" to "${newStatus}"`,
            type: newStatus === 'completed' ? 'success' : 'info',
            category: 'service_order',
            link: `/dashboard/field/dispatches/${dispatch.id}`,
            relatedEntityId: dispatchIdNum,
            relatedEntityType: 'dispatch'
          });
          console.log('Notified dispatcher:', dispatcherIdNum, 'about status change');
        }
      } catch (notifError) {
        console.warn('Failed to create notification for dispatcher:', notifError);
      }

      // Propagate to service order notes
      if (serviceOrder?.id) {
        try {
          await serviceOrdersApi.addNote(serviceOrder.id, {
            content: `[From ${dispatch.dispatchNumber}] Dispatch status changed from "${oldStatus}" to "${newStatus}"`,
            type: 'dispatch_status_changed',
          });
        } catch (soError) {
          console.warn('Failed to log service order activity:', soError);
        }

        // Get service order to find sale and offer IDs
        try {
          const soData: any = await serviceOrdersApi.getById(serviceOrder.id, true);
          
          // Propagate to sale notes
          if (soData.saleId) {
            try {
              const { salesApi } = await import('@/services/api/salesApi');
              await salesApi.addActivity(soData.saleId, {
                type: 'dispatch_status_changed',
                description: `[From ${dispatch.dispatchNumber}] Dispatch status changed to "${newStatus}"`,
              });

              // Get sale to find offer ID
              const saleData = await salesApi.getById(soData.saleId);
              if (saleData.offerId) {
                try {
                  const { offersApi } = await import('@/services/api/offersApi');
                  await offersApi.addActivity(saleData.offerId, {
                    type: 'dispatch_status_changed',
                    description: `[From ${dispatch.dispatchNumber}] Dispatch status changed to "${newStatus}"`,
                  });
                } catch (offerError) {
                  console.warn('Failed to log offer activity:', offerError);
                }
              }
            } catch (saleError) {
              console.warn('Failed to log sale activity:', saleError);
            }
          }

          // Also check if service order has direct offer ID (in case no sale)
          if (!soData.saleId && soData.offerId) {
            try {
              const { offersApi } = await import('@/services/api/offersApi');
              await offersApi.addActivity(soData.offerId, {
                type: 'dispatch_status_changed',
                description: `[From ${dispatch.dispatchNumber}] Dispatch status changed to "${newStatus}"`,
              });
            } catch (offerError) {
              console.warn('Failed to log offer activity:', offerError);
            }
          }
        } catch (fetchError) {
          console.warn('Failed to fetch service order for activity propagation:', fetchError);
        }
      }
    } catch (error) {
      console.error('Failed to update status:', error);
      toast.error(t('failedToUpdateStatus'));
    } finally {
      setIsStatusUpdating(false);
    }
  };

  // Map time entries for PDF export
  const mappedTimeEntries = timeEntries.map(entry => ({
    id: String(entry.id),
    serviceOrderId: dispatch.serviceOrderId,
    technicianId: entry.technicianId,
    workType: (entry.workType === 'break' ? 'cleanup' : entry.workType) as 'travel' | 'work' | 'setup' | 'documentation' | 'cleanup',
    startTime: new Date(entry.startTime),
    endTime: new Date(entry.endTime),
    duration: Math.round((new Date(entry.endTime).getTime() - new Date(entry.startTime).getTime()) / (1000 * 60)),
    description: entry.description || '',
    billable: true,
    status: entry.isApproved ? 'approved' as const : 'submitted' as const,
    createdAt: new Date(),
    updatedAt: new Date()
  }));
  const dispatchId = id ? parseInt(id) : 0;
  return <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-20 shadow-sm">
        {/* Mobile Header */}
            <div className="md:hidden">
              {/* Row 1: Back + actions menu */}
              <div className="flex items-center justify-between p-3 border-b border-border/50">
                <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard/field/dispatcher")} className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  {t('dispatch_detail.back_to_dispatcher')}
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52">
                    <DropdownMenuItem onClick={() => setIsPdfPreviewOpen(true)}>
                      <ClipboardList className="h-4 w-4 mr-2" />
                      {t('detail.download_report')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setIsShareModalOpen(true)}>
                      <Share2 className="h-4 w-4 mr-2" />
                      {t('detail.share')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setIsSendModalOpen(true)}>
                      <Mail className="h-4 w-4 mr-2" />
                      {t('detail.send_email', 'Send via Email')}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleStatusChange('completed')}>
                      <CheckCircle className="h-4 w-4 mr-2 text-success" />
                      {t('dispatch_detail.mark_complete', 'Mark Complete')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleStatusChange('cancelled')} className="text-destructive focus:text-destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      {t('dispatch_detail.cancel_dispatch', 'Cancel Dispatch')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              {/* Row 2: Entity number + tenant */}
              <div className="p-3 space-y-2.5">
                <EditableEntityNumber
                  value={dispatch.dispatchNumber}
                  onSave={async (newValue) => {
                    await dispatchesApi.update(Number(dispatch.id), { dispatchNumber: newValue });
                    await fetchDispatchData(Number(dispatch.id));
                  }}
                  validate={async (newValue) => {
                    const result = await checkDuplicateDocumentNumber(newValue, 'dispatch', dispatch.id);
                    return result.isDuplicate ? `This number already exists in ${result.foundIn}` : null;
                  }}
                  className="text-xl font-bold"
                />
                <TenantSelector value={(dispatch as any)?.tenantId} onChange={() => {}} readOnly compact />
                {/* Status flow – full width, scrollable */}
                <div className="overflow-x-auto">
                  <DispatchStatusFlow
                    currentStatus={dispatch.status as DispatchStatus}
                    onStatusChange={handleStatusChange}
                    isUpdating={isStatusUpdating}
                  />
                </div>
              </div>
            </div>

        {/* Desktop Header - Compact Card Style */}
        <div className="hidden md:block p-4 lg:p-6">
          <div className="flex items-center gap-4">
            {/* Back Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="h-9 w-9 shrink-0 hover:bg-background/80"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>

            {/* Dispatch Info Card */}
            <Card className="flex-1 shadow-sm border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-6">
                  {/* Left: Title */}
                  <div className="flex items-center gap-6 min-w-0">
                    <EditableEntityNumber
                      value={dispatch.dispatchNumber}
                      onSave={async (newValue) => {
                        await dispatchesApi.update(Number(dispatch.id), { dispatchNumber: newValue });
                        await fetchDispatchData(Number(dispatch.id));
                      }}
                      validate={async (newValue) => {
                        const result = await checkDuplicateDocumentNumber(newValue, 'dispatch', dispatch.id);
                        return result.isDuplicate ? `This number already exists in ${result.foundIn}` : null;
                      }}
                    />
                    <TenantSelector value={(dispatch as any)?.tenantId} onChange={() => {}} readOnly compact />
                  </div>

                  {/* Right: Status Flow + Actions */}
                  <div className="flex items-center gap-4 shrink-0">
                    <DispatchStatusFlow currentStatus={dispatch.status as DispatchStatus} onStatusChange={handleStatusChange} isUpdating={isStatusUpdating} />
                    
                    <div className="h-8 w-px bg-border/50" />
                    
                    <TooltipProvider delayDuration={300}>
                      <div className="flex items-center gap-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon-sm" onClick={() => setIsPdfPreviewOpen(true)} className="text-muted-foreground hover:text-foreground hover:bg-accent">
                              <ClipboardList className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="bottom">{t('detail.download_report')}</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon-sm" onClick={() => setIsShareModalOpen(true)} className="text-muted-foreground hover:text-foreground hover:bg-accent">
                              <Share2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="bottom">{t('detail.share')}</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon-sm" onClick={() => setIsSendModalOpen(true)} className="text-muted-foreground hover:text-foreground hover:bg-accent">
                              <Mail className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="bottom">{t('detail.send_email', 'Send via Email')}</TooltipContent>
                        </Tooltip>
                      </div>
                    </TooltipProvider>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-3 sm:px-4 py-4 sm:py-6 space-y-6">

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* Enhanced tabs with icons */}
          <div className="w-full mb-6">
            <TabsList className="w-full h-auto p-1 bg-muted/50 rounded-lg lg:grid lg:grid-cols-7 lg:gap-0">
              <div className="flex lg:contents overflow-x-auto mask-fade-right gap-1 lg:gap-0 pb-1 lg:pb-0">
                <TabsTrigger value="overview" className="whitespace-nowrap px-4 py-2.5 min-w-[100px] flex-shrink-0 lg:flex-1 lg:min-w-0 text-sm font-medium">
                  {t('dispatch_detail.overview')}
                 </TabsTrigger>
                <TabsTrigger value="jobs" className="whitespace-nowrap px-4 py-2.5 min-w-[70px] flex-shrink-0 lg:flex-1 lg:min-w-0 text-sm font-medium">
                  {t('tabs.jobs')}
                 </TabsTrigger>
                <TabsTrigger value="time_expenses" className="whitespace-nowrap px-4 py-2.5 min-w-[120px] flex-shrink-0 lg:flex-1 lg:min-w-0 text-sm font-medium">
                  {t('tabs.time_expenses')}
                 </TabsTrigger>
                <TabsTrigger value="materials" className="whitespace-nowrap px-4 py-2.5 min-w-[90px] flex-shrink-0 lg:flex-1 lg:min-w-0 text-sm font-medium">
                  {t('dispatch_detail.materials')}
                 </TabsTrigger>
                <TabsTrigger value="attachments" className="whitespace-nowrap px-4 py-2.5 min-w-[100px] flex-shrink-0 lg:flex-1 lg:min-w-0 text-sm font-medium">
                  {t('tabs.attachments')}
                 </TabsTrigger>
                <TabsTrigger value="checklists" className="whitespace-nowrap px-4 py-2.5 min-w-[100px] flex-shrink-0 lg:flex-1 lg:min-w-0 text-sm font-medium">
                  {t('tabs.checklists')}
                 </TabsTrigger>
                <TabsTrigger value="activity" className="whitespace-nowrap px-4 py-2.5 min-w-[80px] flex-shrink-0 lg:flex-1 lg:min-w-0 text-sm font-medium">
                  {t('tabs.activity')}
                </TabsTrigger>
              </div>
            </TabsList>
          </div>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6 mt-0">
            {/* Dispatch Details Card */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Wrench className="h-4 w-4 text-primary" />
                  {t('dispatch_detail.dispatch_details')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Column */}
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">{t('dispatch_detail.dispatch_id')}</label>
                      <p className="text-foreground font-medium mt-1">{dispatch.dispatchNumber}</p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-muted-foreground">{t('dispatch_detail.related_service_order')}</label>
                      <div className="mt-1">
                        <Button variant="link" className="p-0 h-auto text-left font-semibold text-primary hover:underline inline-flex items-center" onClick={() => navigate(`/dashboard/field/service-orders/${dispatch.serviceOrderId}`)}>
                          <span>{serviceOrder?.orderNumber || `SO-${dispatch.serviceOrderId}` || 'N/A'}</span>
                          <ExternalLink className="ml-2 h-3 w-3 flex-shrink-0" />
                        </Button>
                      </div>
                    </div>


                    <div>
                      <label className="text-sm font-medium text-muted-foreground">{t('dispatch_detail.affected_contact')}</label>
                      <div className="mt-1">
                        {contact ? (
                          <Button variant="link" className="p-0 h-auto text-left font-semibold text-primary hover:underline inline-flex items-center" onClick={() => navigate(`/dashboard/contacts/${contact.id}`)}>
                            <span>{contact.company || contact.name}</span>
                            <ExternalLink className="ml-2 h-3 w-3 flex-shrink-0" />
                          </Button>
                        ) : (
                          <p className="text-muted-foreground">{t('dispatch_detail.not_specified')}</p>
                        )}
                      </div>
                    </div>



                    {contact?.email && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">{t('dispatch_detail.contact_email')}</label>
                        <p className="text-foreground font-medium mt-1">
                          <a href={`mailto:${contact.email}`} className="hover:text-primary">{contact.email}</a>
                        </p>
                      </div>
                    )}

                    {installation?.name && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">{t('dispatch_detail.installation')}</label>
                        <div className="mt-1">
                          <Button variant="link" className="p-0 h-auto text-left font-semibold text-primary hover:underline inline-flex items-center" onClick={() => navigate(`/dashboard/installations/${installation.id}`)}>
                            <span>{installation.name}</span>
                            <ExternalLink className="ml-2 h-3 w-3 flex-shrink-0" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Column */}
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">{t('dispatch_detail.priority_level')}</label>
                      <div className="mt-1">
                        <Badge variant="secondary" className={`${getPriorityColor(dispatch.priority)} font-medium`}>
                          {t(`priorities.${dispatch.priority}`)}
                        </Badge>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-muted-foreground">{t('dispatch_detail.current_status')}</label>
                      <div className="mt-1">
                        <Badge variant="secondary" className={`${getStatusColor(dispatch.status)} font-medium`}>
                          {getStatusIcon(dispatch.status)}
                          <span className="ml-1">{t(`statuses.${dispatch.status}`)}</span>
                        </Badge>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-muted-foreground">{t('dispatch_detail.assigned_technicians')}</label>
                      <p className="text-foreground font-medium mt-1">
                        {dispatch.assignedTechnicians && dispatch.assignedTechnicians.length > 0 
                          ? dispatch.assignedTechnicians.map((tech) => {
                              if (typeof tech === 'string' && tech.startsWith('__RESOLVE_ID__')) {
                                return getUserName(tech.replace('__RESOLVE_ID__', ''));
                              }
                              if (typeof tech === 'object') {
                                return (tech as any).name || (tech as any).email || t('dispatch_detail.unknown');
                              }
                              return tech;
                            }).join(', ')
                          : t('dispatch_detail.none_assigned')}
                      </p>
                    </div>

                    {dispatch.scheduledDate && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">{t('dispatch_detail.scheduled_date')}</label>
                        <p className="text-foreground font-medium mt-1">
                          {format(dispatch.scheduledDate, 'EEEE, MMMM d, yyyy')}
                        </p>
                      </div>
                    )}


                    {dispatch.dispatchedBy && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">{t('dispatch_detail.dispatched_by')}</label>
                        <p className="text-foreground font-medium mt-1">{dispatch.dispatchedBy}</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Jobs Tab */}
          <TabsContent value="jobs" className="mt-0">
            <DispatchJobsTab
              dispatchId={dispatch.id}
              jobId={dispatch.jobId}
              jobIds={dispatch.jobIds}
              installationId={dispatch.installationId}
              installationName={dispatch.installationName}
              serviceOrderId={dispatch.serviceOrderId}
              dispatchStatus={dispatch.status}
              dispatchPriority={dispatch.priority}
              dispatchEstimatedDuration={dispatch.estimatedDuration}
              scheduledStartTime={dispatch.scheduledStartTime}
              scheduledEndTime={dispatch.scheduledEndTime}
              currentJobId={currentJobId}
              onSelectCurrentJob={setCurrentJobId}
            />
          </TabsContent>

          {/* Time & Expenses Tab */}
          <TabsContent value="time_expenses" className="mt-0">
            <DispatchTimeExpensesTab dispatchId={dispatchId} dispatchStatus={dispatch?.status} dispatchJobs={dispatch?.jobs} preselectedJobId={currentJobId} />
          </TabsContent>

          {/* Materials Tab */}
          <TabsContent value="materials" className="mt-0">
            <DispatchMaterialsTab
              dispatchId={dispatchId}
              installationId={jobInstallationId || undefined}
              serviceOrderMaterials={serviceOrderMaterials}
              dispatchJobs={dispatch?.jobs}
              preselectedJobId={currentJobId}
            />
          </TabsContent>

          {/* Attachments Tab (merged Documents and Photos) */}
          <TabsContent value="attachments" className="mt-0">
            <DocumentsTab 
              dispatchId={dispatchId}
              serviceOrderId={dispatch?.serviceOrderId}
              saleId={serviceOrder?.saleId}
              offerId={serviceOrder?.offerId}
            />
          </TabsContent>

          {/* Checklists Tab */}
          <TabsContent value="checklists" className="mt-0 space-y-6">
            {/* Per-job checklists carried from the offer/sale service line. */}
            {(dispatch?.jobs ?? []).map(j => (
              <div key={`job-checklist-${j.id}`} className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">
                  📋 {j.title || `Job #${j.id}`}
                </div>
                <ChecklistsSection entityType="service_order_job" entityId={j.id} />
              </div>
            ))}
            {/* Dispatch-level checklists. */}
            <ChecklistsSection
              entityType="dispatch"
              entityId={dispatchId}
              linkedEntityType="service_order"
              linkedEntityId={dispatch?.serviceOrderId}
            />
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="mt-0">
            <DispatchActivityTab 
              dispatchId={dispatchId} 
              createdAt={dispatch?.createdAt ? (dispatch.createdAt instanceof Date ? dispatch.createdAt.toISOString() : String(dispatch.createdAt)) : undefined}
              dispatchedBy={dispatch?.dispatchedBy}
              jobTitle={jobTitle || undefined}
            />
          </TabsContent>
        </Tabs>
        
        <ProfessionalShareModal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} data={{
        title: dispatch.dispatchNumber,
        orderNumber: dispatch.dispatchNumber,
        customerName: contact?.contactPerson || contact?.name || 'Unknown',
        customerCompany: contact?.company || contact?.name || '',
        amount: dispatch.actualDuration ? `${(dispatch.actualDuration * 75).toFixed(2)} USD` : undefined,
        type: 'dispatch',
        currentUrl: window.location.href
      }} pdfFileName={`dispatch-report-${dispatch.dispatchNumber}.pdf`} />

        <DispatchPDFPreviewModal isOpen={isPdfPreviewOpen} onClose={() => setIsPdfPreviewOpen(false)} dispatch={dispatch} customer={contact ? {
        id: String(contact.id),
        company: contact.company || contact.name || '',
        contactPerson: contact.contactPerson || contact.name || '',
        phone: contact.phone || '',
        email: contact.email || '',
        address: contact.address || {}
       } : undefined} installation={installation} timeData={mappedTimeEntries} formatCurrency={formatCurrency} />

        <SendDispatchModal 
          open={isSendModalOpen} 
          onOpenChange={setIsSendModalOpen} 
          dispatch={dispatch} 
        />

      </div>
    </div>;
}
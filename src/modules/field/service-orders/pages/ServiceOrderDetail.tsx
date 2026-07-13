import { useState, useEffect, useMemo } from "react";
import { DetailPageSkeleton } from "@/components/ui/page-skeleton";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLayoutModeContext } from "@/hooks/useLayoutMode";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Clock, Users, Package, Calendar, CheckCircle, AlertCircle, User, MapPin, Phone, Mail, Settings, MoreVertical, Edit, Trash2, ClipboardList, Building, Wrench, ExternalLink, Filter, ChevronDown, MessageSquare, History, Check, Share2, Plus, Loader2, RefreshCw, Eye, FileText, RefreshCcw, ShoppingCart, LayoutDashboard, Truck, Timer, StickyNote, FolderOpen, Activity } from "lucide-react";
import { CollapsibleSearch } from "@/components/ui/collapsible-search";
import { JobsTable } from "../components/JobsTable";
import { DispatchesTable } from "../components/DispatchesTable";
import { PlanDispatchModal } from "../components/PlanDispatchModal";
import { ServiceOrderStatusFlow, type ServiceOrderStatus } from "../components/ServiceOrderStatusFlow";
import { TimeExpensesTab } from "../components/TimeExpensesTab";
import { MaterialsTab } from "../components/MaterialsTab";
import { ServiceOrderActivityTab } from "../components/ServiceOrderActivityTab";
import { DocumentsTab } from "../components/DocumentsTab";
import { ChecklistsSection } from "@/modules/shared/components/documents";
// Plan-vs-Actual stats panel + separate planned editor were removed —
// planned rows now render inline inside each tab via PlannedInlineList.
import { cn } from "@/lib/utils";
import { CompanyBadge } from "@/components/CompanyBadge";
import { TenantSelector } from "@/components/TenantSelector";
import { ProfessionalShareModal } from "@/components/shared/ProfessionalShareModal";
import { ServiceOrderPDFPreviewModal } from "../components/ServiceOrderPDFPreviewModal";
import { SendServiceOrderModal } from "../components/SendServiceOrderModal";
import { ServiceOrderPDFDocument } from "../components/ServiceOrderPDFDocument";
import { defaultSettings } from "../utils/pdfSettings.utils";
import { AddMaterialModal } from "../../components/AddMaterialModal";
import { InvoicePreparationModal } from "../components/InvoicePreparationModal";
import type { Article } from "@/modules/inventory-services/types";
import { serviceOrdersApi } from "@/services/api/serviceOrdersApi";
import { appSettingsApi } from "@/services/api/appSettingsApi";
import { articlesApi } from "@/services/api/articlesApi";
import { usersApi } from "@/services/api/usersApi";
import { installationsApi } from "@/services/api/installationsApi";
import { salesApi } from "@/services/api/salesApi";
import { offersApi } from "@/services/api/offersApi";
import { notificationsApi } from "@/services/api/notificationsApi";
import { toast } from "sonner";
import { EditableEntityNumber } from "@/components/shared/EditableEntityNumber";
import { checkDuplicateDocumentNumber } from "@/services/documentNumberValidator";

// API Types for dynamic data
interface ApiJob {
  id: number;
  serviceOrderId: number;
  title: string;
  jobDescription: string;
  workType?: string;
  priority?: string;
  status: string;
  installationId?: number;
  installationName?: string;
  saleItemId?: number;
  estimatedDuration?: number;
  estimatedCost?: number;
  actualDuration?: number;
  actualCost?: number;
  scheduledDate?: string;
  completionPercentage?: number;
  notes?: string;
}

interface ApiContact {
  id: number;
  name?: string;
  company?: string;
  email?: string;
  phone?: string;
  address?: string;
}

interface ApiServiceOrder {
  estimatedCost?: number;
  id: number;
  orderNumber: string;
  title?: string;
  saleId?: number | string;
  saleNumber?: string;
  offerId?: number;
  contactId: number;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  companyName?: string;
  contact?: ApiContact; // Nested contact object from API
  status: string;
  priority: string;
  serviceType?: string;
  notes?: string;
  tags?: string[];
  startDate?: string;
  targetCompletionDate?: string;
  actualCompletionDate?: string;
  actualCost?: number;
  jobs?: ApiJob[];
  createdDate?: string;
  createdAt?: string;
  modifiedDate?: string;
  updatedAt?: string;
  createdBy?: string;
  createdByName?: string;
}

interface ApiJob {
  id: number;
  serviceOrderId: number;
  title: string;
  jobDescription: string;
  workType?: string;
  priority?: string;
  status: string;
  installationId?: number;
  installationName?: string;
  saleItemId?: number;
  estimatedDuration?: number;
  estimatedCost?: number;
  actualDuration?: number;
  actualCost?: number;
  scheduledDate?: string;
  completionPercentage?: number;
  notes?: string;
  assignedTechnicianIds?: string[];
  assignedTechnicians?: any[];
}

interface ApiTimeEntry {
  id: number;
  serviceOrderId?: number;
  dispatchId?: number;
  technicianId?: number;
  technicianName?: string;
  workType?: string;
  startTime?: string;
  endTime?: string;
  duration?: number;
  description?: string;
  billable?: boolean;
  hourlyRate?: number;
  totalCost?: number;
  status?: string;
}

interface ApiExpense {
  id: number;
  serviceOrderId?: number;
  dispatchId?: number;
  technicianId?: number;
  technicianName?: string;
  type?: string;
  amount?: number;
  currency?: string;
  description?: string;
  receiptUrl?: string;
  date?: string;
  status?: string;
}

interface ApiMaterial {
  id: number;
  serviceOrderId?: number;
  dispatchId?: number;
  articleId?: number | string;
  articleName?: string;
  name?: string;
  articleSku?: string;
  sku?: string;
  description?: string;
  quantity?: number;
  unitCost?: number;
  totalCost?: number;
  unitPrice?: number;
  totalPrice?: number;
  usedBy?: string;
  usedAt?: string;
  createdBy?: string;
  createdAt?: string;
  notes?: string;
  status?: string;
  source?: string;
  internalComment?: string;
  externalComment?: string;
  replacing?: boolean;
  oldArticleModel?: string;
  oldArticleStatus?: string;
}

interface ApiNote {
  id: number;
  serviceOrderId?: number;
  dispatchId?: number;
  content?: string;
  type?: string;
  createdBy?: string;
  createdAt?: string;
}

export default function ServiceOrderDetail() {
  const { t } = useTranslation('service_orders');
  const { id } = useParams();
  const navigate = useNavigate();
  const { isMobile } = useLayoutModeContext();

  // State for API data
  const [serviceOrder, setServiceOrder] = useState<ApiServiceOrder | null>(null);
  const [timeEntries, setTimeEntries] = useState<ApiTimeEntry[]>([]);
  const [expenses, setExpenses] = useState<ApiExpense[]>([]);
  const [materials, setMaterials] = useState<ApiMaterial[]>([]);
  const [notes, setNotes] = useState<ApiNote[]>([]);
  const [dispatches, setDispatches] = useState<any[]>([]);
  const [userMap, setUserMap] = useState<Map<string, string>>(new Map());
  const [installationMap, setInstallationMap] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [activeTab, setActiveTab] = useState("overview");
  const [activityFilter, setActivityFilter] = useState<'all' | 'history' | 'communications'>('all');
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isPdfPreviewOpen, setIsPdfPreviewOpen] = useState(false);
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<ApiMaterial | null>(null);
  const [isEditingMaterial, setIsEditingMaterial] = useState(false);
  const [editMaterialData, setEditMaterialData] = useState<Partial<ApiMaterial>>({});

  // Materials search and filter states
  const [materialSearchTerm, setMaterialSearchTerm] = useState('');
  const [showMaterialFilterBar, setShowMaterialFilterBar] = useState(false);

  // Note creation state
  const [newNoteContent, setNewNoteContent] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [jobConversionMode, setJobConversionMode] = useState<'installation' | 'service'>('installation');
  const [isPlanDispatchOpen, setIsPlanDispatchOpen] = useState(false);

  // Status flow management - uses actual backend status IDs directly (no mapping needed)
  const [currentStatusFlow, setCurrentStatusFlow] = useState<ServiceOrderStatus>('pending');
  const [isStatusUpdating, setIsStatusUpdating] = useState(false);

  // Fetch service order data
  const fetchServiceOrder = async () => {
    if (!id) return;
    try {
      const data = await serviceOrdersApi.getById(Number(id), true);
      setServiceOrder(data);

      // Normalize legacy/edge-case statuses to valid workflow statuses
      const statusNormalization: Record<string, ServiceOrderStatus> = {
        'draft': 'pending',
        'partially_completed': 'technically_completed',
        'completed': 'ready_for_invoice',
        'on_hold': 'pending',
        'cancelled': 'closed',
      };
      const normalized = statusNormalization[data.status] || data.status;
      setCurrentStatusFlow(normalized as ServiceOrderStatus);
    } catch (error) {
      console.error('Failed to fetch service order:', error);
      toast.error('Failed to load service order');
    }
  };

  // Fetch related data (time entries, expenses, materials, notes, dispatches, users)
  const fetchRelatedData = async () => {
    if (!id) return;
    try {
      const [timeData, expenseData, materialData, noteData, dispatchData, usersResponse] = await Promise.all([
        serviceOrdersApi.getTimeEntries(Number(id)),
        serviceOrdersApi.getExpenses(Number(id)),
        serviceOrdersApi.getMaterials(Number(id)),
        serviceOrdersApi.getNotes(Number(id)),
        serviceOrdersApi.getDispatches(Number(id)),
        usersApi.getAll().catch(() => ({ users: [] }))
      ]);

      // Create user map for resolving technician IDs to names
      const users = Array.isArray(usersResponse) ? usersResponse : (usersResponse as any).users || [];
      const newUserMap = new Map<string, string>();
      users.forEach((user: any) => {
        const userId = String(user.id);
        const name = user.firstName && user.lastName
          ? `${user.firstName} ${user.lastName}`
          : user.name || user.email || `User ${userId}`;
        newUserMap.set(userId, name);
      });
      setUserMap(newUserMap);

      setTimeEntries(Array.isArray(timeData) ? timeData : []);
      setExpenses(Array.isArray(expenseData) ? expenseData : []);
      setMaterials(Array.isArray(materialData) ? materialData : []);
      setNotes(Array.isArray(noteData) ? noteData : []);
      setDispatches(Array.isArray(dispatchData) ? dispatchData : []);
    } catch (error) {
      console.error('Failed to fetch related data:', error);
    }
  };

  // Fetch job conversion mode setting
  useEffect(() => {
    appSettingsApi.getSetting('JobConversionMode').then(mode => {
      if (mode === 'service' || mode === 'installation') {
        setJobConversionMode(mode);
      }
    }).catch(() => { });
  }, []);

  // Initial data fetch
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchServiceOrder();
      await fetchRelatedData();
      setLoading(false);
    };
    loadData();
  }, [id]);

  // Fetch installation names for jobs
  useEffect(() => {
    const fetchInstallationNames = async () => {
      if (!serviceOrder?.jobs) return;

      const installationIds = serviceOrder.jobs
        .filter(job => job.installationId && !job.installationName)
        .map(job => String(job.installationId))
        .filter((id, index, self) => self.indexOf(id) === index); // unique IDs

      if (installationIds.length === 0) return;

      const newInstallationMap = new Map(installationMap);

      for (const installationId of installationIds) {
        if (newInstallationMap.has(installationId)) continue;

        try {
          const installation = await installationsApi.getById(installationId);
          newInstallationMap.set(installationId, installation.name || `Installation #${installationId}`);
        } catch {
          newInstallationMap.set(installationId, `Installation #${installationId}`);
        }
      }

      setInstallationMap(newInstallationMap);
    };

    fetchInstallationNames();
  }, [serviceOrder?.jobs]);

  // Refresh all data
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchServiceOrder();
    await fetchRelatedData();
    setRefreshing(false);
    toast.success('Data refreshed');
  };

  // Add a new note
  const handleAddNote = async () => {
    if (!newNoteContent.trim() || !serviceOrder) return;

    setIsAddingNote(true);
    try {
      await serviceOrdersApi.addNote(serviceOrder.id, {
        content: newNoteContent.trim(),
        type: 'Note'
      });
      toast.success('Note added successfully');
      setNewNoteContent('');
      await fetchRelatedData();
    } catch (error) {
      console.error('Failed to add note:', error);
      toast.error('Failed to add note');
    } finally {
      setIsAddingNote(false);
    }
  };

  // Delete a note
  const handleDeleteNote = async (noteId: number) => {
    if (!serviceOrder) return;

    try {
      await serviceOrdersApi.deleteNote(serviceOrder.id, noteId);
      toast.success('Note deleted');
      await fetchRelatedData();
    } catch (error) {
      console.error('Failed to delete note:', error);
      toast.error('Failed to delete note');
    }
  };

  const handleStatusChange = async (newStatus: ServiceOrderStatus) => {
    if (!serviceOrder) return;

    // Intercept: if transitioning to ready_for_invoice from technically_completed, open invoice modal
    if (newStatus === 'ready_for_invoice' && currentStatusFlow === 'technically_completed') {
      setIsInvoiceModalOpen(true);
      return;
    }

    // Status IDs now match backend directly - no reverse mapping needed
    const oldStatus = currentStatusFlow;
    setIsStatusUpdating(true);

    try {
      await serviceOrdersApi.updateStatus(serviceOrder.id, newStatus);

      // Log the status change as a note/activity on the service order
      try {
        await serviceOrdersApi.addNote(serviceOrder.id, {
          content: `🔄 Status changed from '${oldStatus}' to '${newStatus}'`,
          type: 'status_changed',
        });
      } catch (activityError) {
        console.warn('Failed to log status change activity:', activityError);
      }

      // Log activity to related sale if exists
      if (serviceOrder.saleId) {
        try {
          const saleId = typeof serviceOrder.saleId === 'string'
            ? parseInt(serviceOrder.saleId)
            : serviceOrder.saleId;

          await salesApi.addActivity(saleId, {
            type: 'service_order_status_changed',
            description: `Service Order ${serviceOrder.orderNumber} status changed from '${oldStatus}' to '${newStatus}'`,
          });

          // Also try to log to the related offer if the sale has one
          try {
            const sale = await salesApi.getById(saleId);
            if (sale.offerId) {
              await offersApi.addActivity(sale.offerId, {
                type: 'service_order_status_changed',
                description: `Service Order ${serviceOrder.orderNumber} status changed to '${newStatus}'`,
              });
            }
          } catch (offerError) {
            console.warn('Failed to log activity to related offer:', offerError);
          }
        } catch (saleError) {
          console.warn('Failed to log activity to related sale:', saleError);
        }
      }

      // Notify the creator of the service order about status changes
      try {
        const currentUserData = localStorage.getItem('user_data');
        const currentUser = currentUserData ? JSON.parse(currentUserData) : null;
        const currentUserId = currentUser?.id || currentUser?.userId;

        // Get the creator ID from the service order
        const createdBy = serviceOrder.createdBy;
        const creatorIdNum = createdBy ? parseInt(String(createdBy), 10) : null;

        // Only notify if creator is different from current user
        if (creatorIdNum && !isNaN(creatorIdNum) && creatorIdNum !== currentUserId) {
          await notificationsApi.create({
            userId: creatorIdNum,
            title: `Service Order Status: ${newStatus.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}`,
            description: `Service Order #${serviceOrder.orderNumber} status changed from "${oldStatus}" to "${newStatus}"`,
            type: newStatus === 'closed' || newStatus === 'technically_completed' ? 'success' : 'info',
            category: 'service_order',
            link: `/dashboard/field/service-orders/${serviceOrder.id}`,
            relatedEntityId: serviceOrder.id,
            relatedEntityType: 'service_order'
          });
          console.log('Notified service order creator:', creatorIdNum, 'about status change');
        }
      } catch (notifError) {
        console.warn('Failed to create notification for service order creator:', notifError);
      }

      setCurrentStatusFlow(newStatus);
      await fetchServiceOrder();
      toast.success('Status updated successfully');
    } catch (error) {
      console.error('Failed to update status:', error);
      toast.error('Failed to update status');
    } finally {
      setIsStatusUpdating(false);
    }
  };

  const handleMaterialAdd = async (materialData: any) => {
    if (!serviceOrder) return;

    try {
      await serviceOrdersApi.addMaterial(serviceOrder.id, {
        articleId: materialData.articleId || undefined,
        name: materialData.articleName || materialData.name || 'Unknown Material',
        sku: materialData.sku || materialData.articleSku || undefined,
        description: materialData.description || undefined,
        quantity: materialData.quantity || 1,
        unitPrice: materialData.unitPrice || 0,
        internalComment: materialData.internalComment || undefined,
        externalComment: materialData.externalComment || undefined,
        replacing: materialData.replacing || false,
        oldArticleModel: materialData.oldArticleModel || undefined,
        oldArticleStatus: materialData.oldArticleStatus || undefined,
      });
      setIsMaterialModalOpen(false);
      await fetchRelatedData();
      toast.success('Material added successfully');
    } catch (error) {
      console.error('Failed to add material:', error);
      toast.error('Failed to add material');
    }
  };

  const handleDeleteMaterial = async (materialId: number) => {
    if (!serviceOrder) return;

    try {
      await serviceOrdersApi.deleteMaterial(serviceOrder.id, materialId);
      toast.success('Material deleted');
      await fetchRelatedData();
    } catch (error) {
      console.error('Failed to delete material:', error);
      toast.error('Failed to delete material');
    }
  };

  const handleUpdateMaterial = async (materialId: number, updates: Partial<ApiMaterial>) => {
    if (!serviceOrder) return;

    try {
      await serviceOrdersApi.updateMaterial(serviceOrder.id, materialId, {
        name: updates.name || updates.articleName,
        sku: updates.sku || updates.articleSku,
        description: updates.description,
        quantity: updates.quantity,
        unitPrice: updates.unitPrice || updates.unitCost,
        internalComment: updates.internalComment,
        externalComment: updates.externalComment,
        replacing: updates.replacing,
        oldArticleModel: updates.oldArticleModel,
        oldArticleStatus: updates.oldArticleStatus,
        status: updates.status,
      });
      toast.success('Material updated successfully');
      setSelectedMaterial(null);
      await fetchRelatedData();
    } catch (error) {
      console.error('Failed to update material:', error);
      toast.error('Failed to update material');
    }
  };

  // Calculate materials total
  const materialsTotalCost = useMemo(() => {
    return materials.reduce((sum, material) => {
      return sum + (material.totalPrice || material.totalCost || 0);
    }, 0);
  }, [materials]);

  // Filter materials based on search term
  const filteredMaterials = useMemo(() => {
    return materials.filter(material => {
      if (materialSearchTerm) {
        const searchLower = materialSearchTerm.toLowerCase();
        const matchesSearch =
          (material.articleName?.toLowerCase() || '').includes(searchLower) ||
          (material.usedBy?.toLowerCase() || '').includes(searchLower);
        if (!matchesSearch) return false;
      }
      return true;
    });
  }, [materials, materialSearchTerm]);

  // Map jobs from API format to component format
  const mappedJobs = useMemo(() => {
    if (!serviceOrder?.jobs) return [];
    return serviceOrder.jobs.map(job => {
      const installationId = job.installationId ? String(job.installationId) : '';
      // Use API installationName, or fallback to map, or fallback to ID
      const resolvedInstallationName = job.installationName || installationMap.get(installationId) || '';

      return {
        id: String(job.id),
        serviceOrderId: String(job.serviceOrderId),
        jobNumber: `JOB-${job.id}`,
        title: job.title || job.jobDescription || 'Untitled Job',
        description: job.jobDescription || '',
        status: (job.status || 'unscheduled') as 'unscheduled' | 'ready' | 'dispatched' | 'cancelled',
        priority: (job.priority || 'medium') as 'low' | 'medium' | 'high' | 'urgent',
        requiredSkills: [],
        estimatedDuration: job.estimatedDuration || 60,
        estimatedCost: job.estimatedCost || 0,
        installationId: installationId,
        installationName: resolvedInstallationName,
        installation: resolvedInstallationName ? {
          id: installationId,
          name: resolvedInstallationName,
          model: '',
          location: ''
        } : undefined,
        workType: (job.workType || 'maintenance') as 'maintenance' | 'repair' | 'installation' | 'inspection' | 'upgrade',
        workLocation: '',
        completionPercentage: job.completionPercentage || 0,
        actualDuration: job.actualDuration,
        actualCost: job.actualCost,
        notes: job.notes || '',
        issues: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: '',
        modifiedBy: '',
        assignedTechnicianIds: job.assignedTechnicianIds,
        assignedTechnicians: job.assignedTechnicians
      };
    });
  }, [serviceOrder?.jobs, installationMap]);

  // Build a map of dispatchId -> technicianId from service order notes
  const dispatchTechnicianMap = useMemo(() => {
    const map = new Map<string, string>();
    notes.forEach((note: any) => {
      const content = note?.content || '';
      const dispatchId = note?.dispatchId;
      if (dispatchId && content) {
        const techIdMatch = content.match(/\[TECH_ID:(\d+)\]/);
        if (techIdMatch) {
          map.set(String(dispatchId), techIdMatch[1]);
        }
      }
    });
    return map;
  }, [notes]);

  // Map dispatches from API data, or fall back to jobs-based mock data
  const mappedDispatches = useMemo(() => {
    // If we have actual dispatch data from the API, use it
    if (dispatches.length > 0) {
      // Deduplicate dispatches by ID
      const seenIds = new Set<string | number>();
      const uniqueDispatches = dispatches.filter(dispatch => {
        const dispatchId = String(dispatch.id);
        if (seenIds.has(dispatchId)) return false;
        seenIds.add(dispatchId);
        return true;
      });

      return uniqueDispatches.map(dispatch => {
        const dispatchId = String(dispatch.id);

        // Extract technician names from assignedTechnicians array
        let technicianNames = (dispatch.assignedTechnicians || [])
          .map((tech: any) => {
            // string -> could be name or id
            if (typeof tech === 'string') {
              if (/^\d+$/.test(tech)) return userMap.get(tech) || tech;
              return tech;
            }

            // object -> handle multiple possible key casings/shapes
            const name = tech?.name || tech?.Name;
            if (name && typeof name === 'string') return name;

            const first = tech?.firstName || tech?.first_name || tech?.FirstName;
            const last = tech?.lastName || tech?.last_name || tech?.LastName;
            if (first || last) return `${first || ''} ${last || ''}`.trim();

            const id = tech?.id ?? tech?.Id ?? tech?.ID ?? tech?.technicianId ?? tech?.TechnicianId;
            if (id) return userMap.get(String(id)) || String(id);

            return null;
          })
          .filter((name: string | null) => name && name.trim() !== '');

        // Fallback: Get technician from service order notes (where [TECH_ID:XX] is stored)
        if (technicianNames.length === 0) {
          const techId = dispatchTechnicianMap.get(dispatchId);
          if (techId) {
            const techName = userMap.get(techId);
            if (techName) {
              technicianNames = [techName];
            }
          }
        }

        return {
          id: dispatchId,
          serviceOrderId: String(dispatch.serviceOrderId || id),
          jobId: String(dispatch.jobId || ''),
          dispatchNumber: dispatch.dispatchNumber || `DISP-${dispatch.id}`,
          assignedTechnicians: technicianNames,
          requiredSkills: [],
          scheduledDate: dispatch.scheduledDate ? new Date(dispatch.scheduledDate) : new Date(),
          scheduledStartTime: dispatch.scheduledStartTime || dispatch.scheduling?.scheduledStartTime || '09:00',
          scheduledEndTime: dispatch.scheduledEndTime || dispatch.scheduling?.scheduledEndTime || '17:00',
          estimatedDuration: dispatch.scheduling?.estimatedDuration || 60,
          status: dispatch.status || 'assigned',
          priority: dispatch.priority || 'medium',
          workloadHours: (dispatch.scheduling?.estimatedDuration || 60) / 60,
          travelTime: dispatch.scheduling?.travelTime || 30,
          travelDistance: dispatch.scheduling?.travelDistance || 10,
          notes: dispatch.notes || '',
          dispatchedBy: dispatch.dispatchedBy || '',
          dispatchedAt: dispatch.dispatchedAt ? new Date(dispatch.dispatchedAt) : new Date(),
          createdAt: dispatch.createdDate ? new Date(dispatch.createdDate) : new Date(),
          updatedAt: dispatch.modifiedDate ? new Date(dispatch.modifiedDate) : new Date()
        };
      });
    }

    // Fall back to jobs-based mock data if no dispatch data is available
    return mappedJobs
      .filter(job => job.status === 'dispatched')
      .map(job => ({
        id: `dispatch-${job.id}`,
        serviceOrderId: job.serviceOrderId,
        jobId: job.id,
        dispatchNumber: `DISP-${job.id}`,
        assignedTechnicians: job.assignedTechnicians ? job.assignedTechnicians.map((t: any) => t.name || t.Name) : [],
        requiredSkills: job.requiredSkills,
        scheduledDate: new Date(),
        scheduledStartTime: '09:00',
        scheduledEndTime: '17:00',
        estimatedDuration: job.estimatedDuration,
        status: 'assigned' as const,
        priority: job.priority,
        workloadHours: job.estimatedDuration / 60,
        travelTime: 30,
        travelDistance: 10,
        notes: job.notes,
        dispatchedBy: '',
        dispatchedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      }));
  }, [dispatches, mappedJobs, id, userMap, dispatchTechnicianMap]);

  // Map time entries for the TimeExpensesTab
  const mappedTimeEntries = useMemo(() => {
    return timeEntries.map(entry => ({
      id: String(entry.id),
      serviceOrderId: String(entry.serviceOrderId || id),
      technicianId: String(entry.technicianId || ''),
      workType: (entry.workType || 'work') as 'travel' | 'setup' | 'work' | 'cleanup' | 'documentation',
      startTime: entry.startTime ? new Date(entry.startTime) : new Date(),
      endTime: entry.endTime ? new Date(entry.endTime) : undefined,
      duration: entry.duration || 0,
      description: entry.description || '',
      billable: entry.billable ?? true,
      technicianName: entry.technicianName || 'Unknown',
      hourlyRate: entry.hourlyRate || 85,
      totalCost: entry.totalCost || 0,
      status: (entry.status === 'pending' ? 'draft' : entry.status || 'draft') as 'draft' | 'submitted' | 'approved' | 'rejected',
      createdAt: new Date(),
      updatedAt: new Date()
    }));
  }, [timeEntries, id]);

  // Create a service order object compatible with components
  const serviceOrderForComponents = useMemo(() => {
    if (!serviceOrder) return null;

    // Extract contact data from nested contact object or fallback to top-level fields
    const contactName = serviceOrder.contact?.name || serviceOrder.contactName || '';
    const contactEmail = serviceOrder.contact?.email || serviceOrder.contactEmail || '';
    const contactPhone = serviceOrder.contact?.phone || serviceOrder.contactPhone || '';
    const companyName = serviceOrder.contact?.company || serviceOrder.companyName || '';

    return {
      id: String(serviceOrder.id),
      orderNumber: serviceOrder.orderNumber || `SO-${serviceOrder.id}`,
      offerId: serviceOrder.offerId ? String(serviceOrder.offerId) : undefined,
      customer: {
        id: String(serviceOrder.contactId),
        company: companyName || contactName || 'Unknown Company',
        contactPerson: contactName || 'Unknown Contact',
        phone: contactPhone,
        email: contactEmail,
        address: {
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: '',
          longitude: 0,
          latitude: 0,
          hasLocation: 0
        }
      },
      status: serviceOrder.status as any,
      repair: {
        description: serviceOrder.notes || '',
        location: '',
        urgencyLevel: serviceOrder.priority as any,
        promisedRepairDate: serviceOrder.targetCompletionDate ? new Date(serviceOrder.targetCompletionDate) : undefined
      },
      priority: serviceOrder.priority as any,
      createdAt: serviceOrder.createdDate ? new Date(serviceOrder.createdDate) : new Date(),
      updatedAt: serviceOrder.modifiedDate ? new Date(serviceOrder.modifiedDate) : new Date(),
      assignedTechnicians: [],
      jobs: mappedJobs,
      dispatches: mappedDispatches,
      workDetails: {
        stepsPerformed: [],
        timeTracking: mappedTimeEntries,
        photos: [],
        checklists: []
      },
      materials: materials.map(m => ({
        id: String(m.id),
        serviceOrderId: String(m.serviceOrderId || id),
        materialId: String(m.articleId || ''),
        material: {
          id: String(m.articleId || ''),
          name: m.articleName || 'Unknown Material',
          sku: m.articleSku || '',
          category: '',
          unit: 'piece',
          standardCost: m.unitCost || 0,
          currentStock: 0,
          minStock: 0,
          status: 'active' as const,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        quantityUsed: m.quantity || 0,
        unitCost: m.unitCost || 0,
        totalCost: m.totalCost || 0,
        requestedBy: m.usedBy || 'Unknown',
        usedAt: m.usedAt ? new Date(m.usedAt) : new Date(),
        status: 'used' as const
      })),
      financials: {
        id: 'fin-001',
        serviceOrderId: String(serviceOrder.id),
        currency: 'TND',
        estimatedCost: serviceOrder.estimatedCost || 0,
        actualCost: serviceOrder.actualCost || 0,
        laborCost: timeEntries.reduce((sum, t) => sum + (t.totalCost || 0), 0),
        materialCost: materials.reduce((sum, m) => sum + (m.totalCost || 0), 0),
        travelCost: expenses.filter(e => e.type === 'travel').reduce((sum, e) => sum + (e.amount || 0), 0),
        equipmentCost: 0,
        overheadCost: 0,
        basePrice: serviceOrder.estimatedCost || 0,
        discounts: [],
        taxes: [],
        totalAmount: serviceOrder.actualCost || serviceOrder.estimatedCost || 0,
        paymentTerms: 'Net 30',
        paymentStatus: 'pending' as const,
        paidAmount: 0,
        remainingAmount: serviceOrder.actualCost || serviceOrder.estimatedCost || 0,
        invoiceStatus: 'draft' as const,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      followUp: {
        reminders: [],
        maintenanceNotes: ''
      },
      changeLog: notes.map(note => ({
        id: String(note.id),
        serviceOrderId: String(note.serviceOrderId || id),
        timestamp: note.createdAt ? new Date(note.createdAt) : new Date(),
        userId: '',
        userName: note.createdBy || 'System',
        action: note.type || 'Note',
        details: note.content || '',
        oldValue: '',
        newValue: '',
        category: 'general' as const,
        severity: 'info' as const
      })),
      communications: []
    };
  }, [serviceOrder, mappedJobs, mappedDispatches, mappedTimeEntries, materials, notes, expenses, id]);

  // Dynamic materials from database (only type = 'material')
  const [availableMaterials, setAvailableMaterials] = useState<Article[]>([]);
  const [loadingMaterials, setLoadingMaterials] = useState(false);

  // Fetch materials from API when modal opens
  useEffect(() => {
    const fetchMaterials = async () => {
      if (!isMaterialModalOpen) return;

      setLoadingMaterials(true);
      try {
        const response = await articlesApi.getAll({ type: 'material', limit: 500 });
        const apiMaterials = response.data || [];
        // Map API response to component Article type (convert string dates to Date objects)
        const mappedMaterials: Article[] = (Array.isArray(apiMaterials) ? apiMaterials : []).map((m: any) => ({
          id: String(m.id),
          name: m.name || '',
          sku: m.sku,
          description: m.description,
          category: m.category || '',
          type: m.type as 'material' | 'service',
          status: m.status || 'available',
          stock: m.stock,
          minStock: m.minStock,
          costPrice: m.costPrice || m.purchasePrice,
          sellPrice: m.sellPrice || m.salesPrice,
          supplier: m.supplier,
          location: m.location,
          subLocation: m.subLocation,
          basePrice: m.basePrice,
          duration: m.duration,
          skillsRequired: m.skillsRequired,
          materialsNeeded: m.materialsNeeded,
          preferredUsers: m.preferredUsers,
          lastUsed: m.lastUsed ? new Date(m.lastUsed) : undefined,
          lastUsedBy: m.lastUsedBy,
          tags: m.tags || [],
          notes: m.notes,
          createdAt: m.createdAt ? new Date(m.createdAt) : new Date(),
          updatedAt: m.updatedAt ? new Date(m.updatedAt) : new Date(),
          createdBy: m.createdBy || 'system',
          modifiedBy: m.modifiedBy || 'system',
        }));
        setAvailableMaterials(mappedMaterials);
      } catch (error) {
        console.error('Failed to fetch materials:', error);
        toast.error('Failed to load materials');
      } finally {
        setLoadingMaterials(false);
      }
    };
    fetchMaterials();
  }, [isMaterialModalOpen]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'TND',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  useEffect(() => {
    if (serviceOrder) {
      document.title = `${t('service_order_details')} - ${serviceOrder.orderNumber || `SO-${serviceOrder.id}`}`;
    }
  }, [t, serviceOrder]);

  // Loading state
  if (loading) {
    return <DetailPageSkeleton className="min-h-screen" />;
  }

  // Not found state
  if (!serviceOrder || !serviceOrderForComponents) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Service Order Not Found</h2>
          <p className="text-muted-foreground mb-4">The service order you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/dashboard/field/service-orders')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Service Orders
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Modern Header */}
      <div className="border-b border-border bg-gradient-subtle backdrop-blur-sm sticky top-0 z-20 shadow-soft">
        {/* Mobile Header */}
        <div className="md:hidden">
          <div className="flex items-center justify-between p-3 border-b border-border/50">
            <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard/field/service-orders")} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              {t('detail.back')}
            </Button>
            <div className="flex items-center gap-1.5">
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={handleRefresh} disabled={refreshing}>
                <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
              </Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setIsPdfPreviewOpen(true)}>
                <ClipboardList className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="p-3 space-y-2.5">
            <div className="min-w-0">
              <EditableEntityNumber
                value={serviceOrderForComponents.orderNumber}
                onSave={async (newValue) => {
                  await serviceOrdersApi.update(serviceOrder!.id, { orderNumber: newValue });
                  await fetchServiceOrder();
                }}
                validate={async (newValue) => {
                  const result = await checkDuplicateDocumentNumber(newValue, 'service_order', serviceOrder!.id);
                  return result.isDuplicate ? `This number already exists in ${result.foundIn}` : null;
                }}
                className="text-xl font-bold"
              />
              <div className="flex items-center gap-2 flex-wrap mt-1.5">
                <CompanyBadge tenantId={(serviceOrder as any)?.tenantId} />
                {serviceOrder.saleId && (
                  <Button
                    variant="link"
                    size="sm"
                    className="text-primary h-auto p-0 text-xs"
                    onClick={() => navigate(`/dashboard/sales/${serviceOrder.saleId}`)}
                  >
                    #{serviceOrder.saleNumber || serviceOrder.saleId}
                  </Button>
                )}
              </div>
            </div>
            {/* Status flow – full width on mobile */}
            <div className="overflow-x-auto">
              <ServiceOrderStatusFlow
                currentStatus={currentStatusFlow}
                onStatusChange={handleStatusChange}
                isUpdating={isStatusUpdating}
              />
            </div>
          </div>
        </div>

        {/* Desktop Header - Compact Card Style */}
        <div className="hidden md:block p-4 lg:p-6 space-y-3">
          <div className="flex items-center gap-4">
            {/* Back Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/dashboard/field/service-orders")}
              className="h-9 w-9 shrink-0 hover:bg-background/80"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>

            {/* Service Order Info Card */}
            <Card className="flex-1 shadow-sm border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-6">
                  {/* Left: Title */}
                  <div className="flex items-center gap-6 min-w-0">
                    <EditableEntityNumber
                      value={serviceOrderForComponents.orderNumber}
                      onSave={async (newValue) => {
                        await serviceOrdersApi.update(serviceOrder!.id, { orderNumber: newValue });
                        await fetchServiceOrder();
                      }}
                      validate={async (newValue) => {
                        const result = await checkDuplicateDocumentNumber(newValue, 'service_order', serviceOrder!.id);
                        return result.isDuplicate ? `This number already exists in ${result.foundIn}` : null;
                      }}
                    />
                    <TenantSelector value={(serviceOrder as any)?.tenantId} onChange={() => {}} readOnly compact />
                    <CompanyBadge tenantId={(serviceOrder as any)?.tenantId} />
                  </div>

                  {/* Right: Actions only – status pipeline moved below */}
                  <div className="flex items-center gap-4 shrink-0">


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
                            <Button variant="ghost" size="icon-sm" onClick={() => setIsSendModalOpen(true)} className="text-muted-foreground hover:text-foreground hover:bg-accent">
                              <Mail className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="bottom">{t('detail.send_email', 'Send via Email')}</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon-sm" onClick={() => setIsShareModalOpen(true)} className="text-muted-foreground hover:text-foreground hover:bg-accent">
                              <Share2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="bottom">Share</TooltipContent>
                        </Tooltip>

                        {/* Create Purchase Order from this Service Order — fulfils
                            UC3 entry point "Service Orders → trigger purchase needs".
                            Navigates to the Create PO page with serviceOrderId
                            prefilled so the new PO is linked back via PurchaseOrder.ServiceOrderId. */}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => navigate(`/dashboard/purchases/orders/add?serviceOrderId=${encodeURIComponent(String(serviceOrder?.id ?? ''))}`)}
                              className="text-muted-foreground hover:text-foreground hover:bg-accent"
                              disabled={!serviceOrder?.id}
                            >
                              <ShoppingCart className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="bottom">{t('detail.create_purchase_order', 'Create Purchase Order')}</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon-sm" onClick={handleRefresh} className="text-muted-foreground hover:text-foreground hover:bg-accent">
                              <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="bottom">Refresh</TooltipContent>
                        </Tooltip>
                      </div>
                    </TooltipProvider>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Status pipeline – own full-width row */}
          <div className="pl-13">
            <ServiceOrderStatusFlow
              currentStatus={currentStatusFlow}
              onStatusChange={handleStatusChange}
              isUpdating={isStatusUpdating}
            />
          </div>
        </div>

      </div>

      {/* Main Content */}
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* Mobile: Dropdown Select */}
          {isMobile ? (
            (() => {
              const TABS = [
                { value: 'overview',      icon: LayoutDashboard, label: t('tabs.overview') },
                { value: 'jobs',          icon: Wrench,           label: t('tabs.jobs') },
                { value: 'dispatches',    icon: Truck,            label: t('tabs.dispatches') },
                { value: 'time_expenses', icon: Timer,            label: t('tabs.time_expenses') },
                { value: 'materials',     icon: Package,          label: t('tabs.materials') },
                { value: 'attachments',   icon: FolderOpen,       label: t('tabs.attachments') },
                { value: 'checklists',    icon: CheckCircle,      label: t('tabs.checklists') },
                { value: 'activity',      icon: Activity,         label: t('tabs.activity') },
              ];
              const current = TABS.find(tab => tab.value === activeTab);
              return (
                <Select value={activeTab} onValueChange={setActiveTab}>
                  <SelectTrigger className="w-full h-11 rounded-xl border-primary/20 bg-primary/5 text-foreground font-medium shadow-sm focus:ring-primary/30">
                    <SelectValue>
                      {current && (
                        <span className="flex items-center gap-2">
                          <current.icon className="h-4 w-4 text-primary flex-shrink-0" />
                          {current.label}
                        </span>
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-card rounded-xl shadow-lg border-border/60">
                    {TABS.map(({ value, icon: Icon, label }) => (
                      <SelectItem key={value} value={value} className="rounded-lg cursor-pointer py-2.5">
                        <span className="flex items-center gap-2.5">
                          <span className={`p-1 rounded-md ${activeTab === value ? 'bg-primary/10' : 'bg-muted'}`}>
                            <Icon className={`h-3.5 w-3.5 ${activeTab === value ? 'text-primary' : 'text-muted-foreground'}`} />
                          </span>
                          <span className={activeTab === value ? 'text-primary font-medium' : ''}>{label}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              );
            })()
          ) : (
            <TabsList className="grid grid-cols-4 md:grid-cols-8 gap-1 h-auto p-1">
              <TabsTrigger value="overview" className="text-xs md:text-sm">{t('tabs.overview')}</TabsTrigger>
              <TabsTrigger value="jobs" className="text-xs md:text-sm">{t('tabs.jobs')}</TabsTrigger>
              <TabsTrigger value="dispatches" className="text-xs md:text-sm">{t('tabs.dispatches')}</TabsTrigger>
              <TabsTrigger value="time_expenses" className="text-xs md:text-sm">{t('tabs.time_expenses')}</TabsTrigger>
              <TabsTrigger value="materials" className="text-xs md:text-sm">{t('tabs.materials')}</TabsTrigger>
              <TabsTrigger value="attachments" className="text-xs md:text-sm">{t('tabs.attachments')}</TabsTrigger>
              <TabsTrigger value="checklists" className="text-xs md:text-sm">{t('tabs.checklists')}</TabsTrigger>
              <TabsTrigger value="activity" className="text-xs md:text-sm">{t('tabs.activity')}</TabsTrigger>
            </TabsList>
          )}

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="space-y-6">
              {/* Service Order Details - Consolidated like Sales/Offers */}
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Wrench className="h-4 w-4 text-primary" />
                    {t('detail.service_order_details')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left Column */}
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">{t('detail.order_id')}</label>
                        <p className="text-foreground font-medium mt-1">{serviceOrder.orderNumber}</p>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-muted-foreground">{t('detail.description')}</label>
                        <p className="text-foreground font-medium mt-1">{serviceOrder.notes || t('detail.no_description')}</p>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-muted-foreground">{t('detail.affected_contact')}</label>
                        <div className="mt-1">
                          <Button
                            variant="link"
                            className="p-0 h-auto text-left font-semibold text-primary hover:underline inline-flex items-center md:max-w-none max-w-[200px] truncate"
                            onClick={() => navigate(`/dashboard/contacts/${serviceOrder.contactId}`)}
                          >
                            <span className="truncate">{serviceOrder.contact?.name || serviceOrder.contactName || serviceOrder.contact?.company || serviceOrder.companyName || t('detail.view_contact')}</span>
                            <ExternalLink className="ml-2 h-3 w-3 flex-shrink-0" />
                          </Button>
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-muted-foreground">{t('detail.contact_email')}</label>
                        <p className="text-foreground font-medium mt-1">
                          {serviceOrder.contact?.email || serviceOrder.contactEmail || t('detail.not_specified')}
                        </p>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-muted-foreground">{t('detail.contact_phone')}</label>
                        <p className="text-foreground font-medium mt-1">
                          {serviceOrder.contact?.phone || serviceOrder.contactPhone || t('detail.not_specified')}
                        </p>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-muted-foreground">{t('detail.target_completion_date')}</label>
                        <p className="text-foreground font-medium mt-1">
                          {serviceOrder.targetCompletionDate
                            ? new Date(serviceOrder.targetCompletionDate).toLocaleDateString()
                            : t('detail.not_specified')}
                        </p>
                      </div>

                    </div>

                    {/* Right Column */}
                    <div className="space-y-4">
                      {/* Related Sale */}
                      {serviceOrder.saleId && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">{t('detail.related_sale')}</label>
                          <div className="mt-1">
                            <Button
                              variant="link"
                              className="p-0 h-auto text-left font-semibold text-primary hover:underline inline-flex items-center"
                              onClick={() => navigate(`/dashboard/sales/${serviceOrder.saleId}`)}
                            >
                              <span>{serviceOrder.saleNumber || `Sale #${serviceOrder.saleId}`}</span>
                              <ExternalLink className="ml-2 h-3 w-3 flex-shrink-0" />
                            </Button>
                          </div>
                        </div>
                      )}

                      <div>
                        <label className="text-sm font-medium text-muted-foreground">{t('detail.priority_level')}</label>
                        <div className="mt-1">
                          <Badge
                            variant="secondary"
                            className={`font-medium ${serviceOrder.priority === 'urgent' ? 'bg-destructive/10 text-destructive' :
                                serviceOrder.priority === 'high' ? 'bg-warning/10 text-warning' :
                                  serviceOrder.priority === 'medium' ? 'bg-primary/10 text-primary' :
                                    'bg-success/10 text-success'
                              }`}
                          >
                            {t(`priorities.${serviceOrder.priority || 'medium'}`).toUpperCase()}
                          </Badge>
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-muted-foreground">{t('detail.service_type')}</label>
                        <p className="text-foreground font-medium mt-1 capitalize">{serviceOrder.serviceType || t('detail.service_type_general')}</p>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-muted-foreground">{t('detail.estimated_cost')}</label>
                        <p className="text-foreground font-medium mt-1">
                          {formatCurrency(
                            serviceOrder.estimatedCost ||
                            serviceOrder.jobs?.reduce((sum, job) => sum + (job.estimatedCost || 0), 0) ||
                            0
                          )}
                        </p>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-muted-foreground">{t('detail.created_date')}</label>
                        <p className="text-foreground font-medium mt-1">
                          {(serviceOrder.createdAt || serviceOrder.createdDate) ? format(new Date(serviceOrder.createdAt || serviceOrder.createdDate!), 'dd/MM/yyyy HH:mm') : t('detail.na')}
                        </p>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-muted-foreground">{t('detail.created_by')}</label>
                        <p className="text-foreground font-medium mt-1">
                          {serviceOrder.createdByName || (serviceOrder.createdBy ? userMap.get(serviceOrder.createdBy) || `User #${serviceOrder.createdBy}` : t('detail.na'))}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

            </div>
          </TabsContent>

          {/* Jobs Tab */}
          <TabsContent value="jobs">
            <Card>
              <CardContent>
                <JobsTable
                  jobs={mappedJobs}
                  onJobUpdate={handleRefresh}
                  viewMode={jobConversionMode}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Dispatches Tab */}
          <TabsContent value="dispatches">
            <Card>
              <CardContent>
                <div className="flex items-center justify-end pt-4">
                  <Button
                    size="sm"
                    onClick={() => setIsPlanDispatchOpen(true)}
                    disabled={!serviceOrder || mappedJobs.length === 0}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    {t('plan_dispatch.button')}
                  </Button>
                </div>
                <DispatchesTable
                  dispatches={mappedDispatches}
                  onDispatchUpdate={handleRefresh}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Time & Expenses Tab */}
          <TabsContent value="time_expenses">
            <div className="space-y-4">
              <Card>
                <CardContent className="pt-6">
                  <TimeExpensesTab
                    serviceOrder={serviceOrderForComponents}
                    timeEntries={timeEntries}
                    expenses={expenses}
                    onUpdate={fetchRelatedData}
                    jobIds={mappedJobs.map(j => Number(j.id))}
                    jobLabels={Object.fromEntries(mappedJobs.map(j => [Number(j.id), j.title || `Job #${j.id}`]))}
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>


          {/* Materials Tab */}
          <TabsContent value="materials">
            <MaterialsTab
              serviceOrder={serviceOrderForComponents}
              onUpdate={fetchRelatedData}
              jobIds={mappedJobs.map(j => Number(j.id))}
              jobLabels={Object.fromEntries(mappedJobs.map(j => [Number(j.id), j.title || `Job #${j.id}`]))}
            />
          </TabsContent>

          {/* Attachments/Documents Tab */}
          <TabsContent value="attachments">
            <DocumentsTab
              serviceOrderId={Number(id)}
              saleId={serviceOrder?.saleId}
              offerId={serviceOrder?.offerId}
              onRefresh={fetchRelatedData}
            />
          </TabsContent>

          {/* Checklists Tab */}
          <TabsContent value="checklists">
            <ChecklistsSection
              entityType="service_order"
              entityId={Number(id)}
              linkedEntityType={serviceOrder?.saleId ? "sale" : undefined}
              linkedEntityId={serviceOrder?.saleId ? (typeof serviceOrder.saleId === 'string' ? parseInt(serviceOrder.saleId) : serviceOrder.saleId) : undefined}
            />
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity">
            <ServiceOrderActivityTab
              serviceOrderId={Number(id)}
              initialNotes={notes}
              onDataChange={fetchRelatedData}
            />
          </TabsContent>
        </Tabs>

        {serviceOrder && (
          <PlanDispatchModal
            open={isPlanDispatchOpen}
            onOpenChange={setIsPlanDispatchOpen}
            serviceOrder={{
              id: serviceOrder.id,
              siteAddress: (serviceOrder as any).siteAddress,
              contactId: (serviceOrder as any).contactId,
            }}
            jobs={mappedJobs.map(j => ({
              id: j.id,
              title: j.title,
              status: j.status,
              installationId: j.installationId || undefined,
              installationName: j.installationName || undefined,
              estimatedDuration: j.estimatedDuration,
            }))}
            jobConversionMode={jobConversionMode}
            onCreated={handleRefresh}
          />
        )}


        <ProfessionalShareModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          data={{
            title: serviceOrderForComponents.orderNumber,
            orderNumber: serviceOrderForComponents.orderNumber,
            customerName: serviceOrderForComponents.customer.contactPerson,
            customerCompany: serviceOrderForComponents.customer.company,
            amount: serviceOrderForComponents.financials ? `${serviceOrderForComponents.financials.totalAmount.toFixed(2)} TND` : undefined,
            type: 'service_order',
            currentUrl: window.location.href
          }}
          pdfComponent={<ServiceOrderPDFDocument serviceOrder={serviceOrderForComponents} formatCurrency={formatCurrency} settings={defaultSettings} />}
          pdfFileName={`service-report-${serviceOrderForComponents.orderNumber}.pdf`}
        />

        <ServiceOrderPDFPreviewModal
          isOpen={isPdfPreviewOpen}
          onClose={() => setIsPdfPreviewOpen(false)}
          serviceOrder={serviceOrderForComponents}
          formatCurrency={formatCurrency}
        />

        <SendServiceOrderModal
          open={isSendModalOpen}
          onOpenChange={setIsSendModalOpen}
          serviceOrder={serviceOrderForComponents}
          onSendSuccess={() => {
            toast.success('Service order sent successfully');
            fetchServiceOrder();
          }}
        />

        <AddMaterialModal
          isOpen={isMaterialModalOpen}
          onClose={() => setIsMaterialModalOpen(false)}
          onSubmit={handleMaterialAdd}
          availableMaterials={availableMaterials}
          availableJobs={mappedJobs}
          context="service_order"
        />

        {/* Material Detail Modal */}
        <Dialog
          open={!!selectedMaterial}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedMaterial(null);
              setIsEditingMaterial(false);
              setEditMaterialData({});
            }
          }}
        >
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                {isEditingMaterial ? 'Edit Material' : 'Material Details'}
              </DialogTitle>
            </DialogHeader>

            {selectedMaterial && !isEditingMaterial && (
              <div className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Material Name</p>
                    <p className="font-medium">{selectedMaterial.articleName || selectedMaterial.name || 'Unknown'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">SKU</p>
                    <p className="font-medium">{selectedMaterial.sku || selectedMaterial.articleSku || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Quantity</p>
                    <p className="font-medium">{selectedMaterial.quantity || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Unit Price</p>
                    <p className="font-medium">{(selectedMaterial.unitPrice || selectedMaterial.unitCost || 0).toFixed(2)} TND</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Price</p>
                    <p className="font-semibold text-primary">{(selectedMaterial.totalPrice || selectedMaterial.totalCost || 0).toFixed(2)} TND</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge variant="outline" className="capitalize">{selectedMaterial.status || 'pending'}</Badge>
                  </div>
                </div>

                <Separator />

                {/* Added Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Added By</p>
                    <p className="font-medium">{selectedMaterial.createdBy || selectedMaterial.usedBy || 'System'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Added At</p>
                    <p className="font-medium">
                      {(selectedMaterial.createdAt || selectedMaterial.usedAt)
                        ? format(new Date(selectedMaterial.createdAt || selectedMaterial.usedAt!), 'dd/MM/yyyy HH:mm')
                        : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Source</p>
                    <Badge variant="secondary" className="capitalize">{selectedMaterial.source || 'manual'}</Badge>
                  </div>
                </div>

                {/* Description */}
                {selectedMaterial.description && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Description</p>
                      <p className="text-sm">{selectedMaterial.description}</p>
                    </div>
                  </>
                )}

                {/* Comments */}
                {(selectedMaterial.internalComment || selectedMaterial.externalComment) && (
                  <>
                    <Separator />
                    <div className="space-y-4">
                      <h4 className="font-medium flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        {t('material_form.comments')}
                      </h4>

                      {selectedMaterial.internalComment && (
                        <div className="bg-muted/50 rounded-lg p-3">
                          <p className="text-xs text-muted-foreground mb-1 font-medium">{t('material_form.internal_comment_staff')}</p>
                          <p className="text-sm">{selectedMaterial.internalComment}</p>
                        </div>
                      )}

                      {selectedMaterial.externalComment && (
                        <div className="bg-accent/30 rounded-lg p-3 border border-accent">
                          <p className="text-xs text-accent-foreground mb-1 font-medium">{t('material_form.external_comment_customer')}</p>
                          <p className="text-sm">{selectedMaterial.externalComment}</p>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* Replacement Info */}
                {selectedMaterial.replacing && (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      <h4 className="font-medium flex items-center gap-2">
                        <RefreshCcw className="h-4 w-4" />
                        Replacement Information
                      </h4>
                      <div className="bg-muted rounded-lg p-3 border">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Old Article Model</p>
                            <p className="text-sm font-medium">{selectedMaterial.oldArticleModel || 'Not specified'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Old Article Status</p>
                            <Badge
                              variant="outline"
                              className={cn(
                                "capitalize",
                                selectedMaterial.oldArticleStatus === 'broken' && "border-destructive text-destructive",
                                selectedMaterial.oldArticleStatus === 'not_broken' && "border-success text-success"
                              )}
                            >
                              {selectedMaterial.oldArticleStatus?.replace('_', ' ') || 'Unknown'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Actions */}
                <Separator />
                <div className="flex justify-between">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsEditingMaterial(true);
                      setEditMaterialData({
                        quantity: selectedMaterial.quantity,
                        unitPrice: selectedMaterial.unitPrice || selectedMaterial.unitCost,
                        internalComment: selectedMaterial.internalComment,
                        externalComment: selectedMaterial.externalComment,
                        description: selectedMaterial.description,
                        replacing: selectedMaterial.replacing,
                        oldArticleModel: selectedMaterial.oldArticleModel,
                        oldArticleStatus: selectedMaterial.oldArticleStatus,
                        status: selectedMaterial.status,
                      });
                    }}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Material
                  </Button>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setSelectedMaterial(null)}>
                      Close
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        handleDeleteMaterial(selectedMaterial.id);
                        setSelectedMaterial(null);
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Edit Mode */}
            {selectedMaterial && isEditingMaterial && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Material Name</Label>
                    <Input
                      value={selectedMaterial.articleName || selectedMaterial.name || ''}
                      disabled
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground">Cannot change material</p>
                  </div>
                  <div className="space-y-2">
                    <Label>SKU</Label>
                    <Input
                      value={selectedMaterial.sku || selectedMaterial.articleSku || ''}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Quantity *</Label>
                    <Input
                      type="number"
                      min={1}
                      value={editMaterialData.quantity || ''}
                      onChange={(e) => setEditMaterialData(prev => ({ ...prev, quantity: Number(e.target.value) }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Unit Price (TND) *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min={0}
                      value={editMaterialData.unitPrice || ''}
                      onChange={(e) => setEditMaterialData(prev => ({ ...prev, unitPrice: Number(e.target.value) }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    placeholder="Material description..."
                    value={editMaterialData.description || ''}
                    onChange={(e) => setEditMaterialData(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-medium">{t('material_form.comments')}</h4>
                  <div className="space-y-2">
                    <Label>{t('material_form.internal_comment_staff')}</Label>
                    <Textarea
                      placeholder={t('material_form.internal_notes_placeholder')}
                      value={editMaterialData.internalComment || ''}
                      onChange={(e) => setEditMaterialData(prev => ({ ...prev, internalComment: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('material_form.external_comment_customer')}</Label>
                    <Textarea
                      placeholder={t('material_form.external_notes_placeholder')}
                      value={editMaterialData.externalComment || ''}
                      onChange={(e) => setEditMaterialData(prev => ({ ...prev, externalComment: e.target.value }))}
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="replacing"
                      checked={editMaterialData.replacing || false}
                      onCheckedChange={(checked) => setEditMaterialData(prev => ({ ...prev, replacing: !!checked }))}
                    />
                    <Label htmlFor="replacing" className="cursor-pointer">This material is replacing an old part</Label>
                  </div>

                  {editMaterialData.replacing && (
                    <div className="grid grid-cols-2 gap-4 pl-6">
                      <div className="space-y-2">
                        <Label>Old Article Model</Label>
                        <Input
                          placeholder="Model of the replaced part..."
                          value={editMaterialData.oldArticleModel || ''}
                          onChange={(e) => setEditMaterialData(prev => ({ ...prev, oldArticleModel: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Old Article Status</Label>
                        <select
                          className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                          value={editMaterialData.oldArticleStatus || 'unknown'}
                          onChange={(e) => setEditMaterialData(prev => ({ ...prev, oldArticleStatus: e.target.value }))}
                        >
                          <option value="unknown">Unknown</option>
                          <option value="broken">Broken</option>
                          <option value="not_broken">Not Broken</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                {/* Edit Actions */}
                <Separator />
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsEditingMaterial(false);
                      setEditMaterialData({});
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      handleUpdateMaterial(selectedMaterial.id, editMaterialData);
                    }}
                  >
                    Save Changes
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Invoice Preparation Modal */}
      <InvoicePreparationModal
        open={isInvoiceModalOpen}
        onOpenChange={setIsInvoiceModalOpen}
        serviceOrderId={serviceOrder?.id || 0}
        saleId={serviceOrder?.saleId}
        onSuccess={async () => {
          setCurrentStatusFlow('ready_for_invoice');
          await fetchServiceOrder();
          await fetchRelatedData();
          // Navigate to the related sale after successful transfer
          if (serviceOrder?.saleId) {
            navigate(`/dashboard/sales/${serviceOrder.saleId}`);
          }
        }}
      />
    </div>
  );
}

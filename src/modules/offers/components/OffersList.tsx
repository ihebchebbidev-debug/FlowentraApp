import { useState, useMemo } from "react";
import { calculateEntityTotal } from "@/lib/calculateTotal";
import { usePaginatedData } from "@/shared/hooks/usePagination";
import { getStatusColorClass, getStatusTranslationKey } from "@/config/entity-statuses";
import { formatStatValue, formatCurrencyValue } from "@/lib/formatters";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import TableLayout, { Column } from "@/components/shared/TableLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import {
  FileText,
  Plus,
  Search,
  Filter,
  DollarSign,
  Target,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  Eye,
  MoreVertical,
  Calendar,
  User,
  Building2,
  MapPin,
  List,
  Table as TableIcon,
  LayoutGrid,
  Send,
  RefreshCw,
  GitBranch,
  Map, Download, Upload,
  ShieldAlert,
  Lock,
  Loader2,
  Play
} from "lucide-react";
import { CollapsibleSearch } from "@/components/ui/collapsible-search";
import { ChevronDown } from "lucide-react";
import { Offer } from "../types";
import { useOffers } from "../hooks/useOffers";
import { useLookups } from '@/shared/contexts/LookupsContext';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { format } from "date-fns";
import { MapOverlay } from "@/components/shared/MapOverlay";
import { mapOffersToMapItems } from "@/components/shared/mappers";
import { ExportModal, ExportConfig } from "@/components/shared/ExportModal";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { usePermissions } from "@/hooks/usePermissions";
import { GenericImportModal, type ImportConfig } from "@/shared/import";
import { offersBulkImportApi } from "@/services/api/offersApi";
import { OffersKanbanView } from './OffersKanbanView';
import { OffersService } from '../services/offers.service';
import { toast } from 'sonner';
import { TableRowActions } from '@/shared/components/TableRowActions';
import { isViewAllMode } from '@/utils/tenant';
import { CompanyBadge } from '@/components/CompanyBadge';
import { useFilteredByCompany } from '@/components/CompanyFilter';
import { CreateActionButton } from '@/components/CreateActionButton';
import { getInitialViewMode, useEnforceListOnMobile } from '../../../hooks/getInitialViewMode';
import { OffersAutopilotDemo } from './onboarding/OffersAutopilotDemo';

// Helper to calculate total amount from items including taxes
// Business rule: Subtotal → Discount → Tax (on afterDiscount) → Fiscal Stamp
const calculateItemsTotal = (offer: Offer): number => {
  return calculateEntityTotal(offer).total;
};

// Helper to format large numbers with space separator and no decimals
const formatTotalValue = (value: number): string => {
  return Math.round(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
};

export function OffersList() {
  const { t } = useTranslation('offers');
  const navigate = useNavigate();
  const { canCreate, canRead, canUpdate, canDelete, isLoading: permissionsLoading, isMainAdmin } = usePermissions();
  const [viewMode, setViewMode] = useState<'list' | 'table' | 'kanban'>(() => getInitialViewMode(['list','table','kanban'] as const, 'table'));
  useEnforceListOnMobile(viewMode, setViewMode, ['list','table','kanban'] as const);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | string>('all');
  const [showFilterBar, setShowFilterBar] = useState(false);
  const [filterAssigned, setFilterAssigned] = useState<'all' | string>('all');
  const [filterDateRange, setFilterDateRange] = useState<'any' | '7' | '30' | '365'>('any');
  const [selectedStat, setSelectedStat] = useState<string>('all');
  const [showMap, setShowMap] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [offerToDelete, setOfferToDelete] = useState<string | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [bulkDeleteProgress, setBulkDeleteProgress] = useState(0);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // Offer import configuration
  const offerImportConfig: ImportConfig<any> = {
    entityName: 'Offers',
    templateFilename: 'offers-template.xlsx',
    templateSheetName: 'Offers Template',
    requiredFields: ['title'],
    duplicateCheckFields: ['title'],
    fields: [
      {
        key: 'title',
        label: t('bulkImport.fields.title', 'Title'),
        required: true,
        validate: (value: string) => {
          if (!value || !value.trim()) {
            return t('bulkImport.validation.titleRequired', 'Offer title is required');
          }
          if (value.length > 200) {
            return t('bulkImport.validation.titleTooLong', 'Title must be less than 200 characters');
          }
          return null;
        }
      },
      {
        key: 'contactId',
        label: t('bulkImport.fields.contactId', 'Contact ID'),
        required: false,
        type: 'number',
        validate: (value: any) => {
          if (value === undefined || value === '') return null;
          const num = Number(value);
          if (isNaN(num) || num <= 0 || !Number.isInteger(num)) {
            return t('bulkImport.validation.invalidContactId', 'Contact ID must be a valid positive integer');
          }
          return null;
        }
      },
      {
        key: 'description',
        label: t('bulkImport.fields.description', 'Description'),
        required: false,
        validate: (value: string) => {
          if (!value) return null;
          if (value.length > 2000) {
            return t('bulkImport.validation.descriptionTooLong', 'Description must be less than 2000 characters');
          }
          return null;
        }
      },
      {
        key: 'status',
        label: t('bulkImport.fields.status', 'Status'),
        required: false,
        validate: (value: string) => {
          if (!value) return null;
          const validStatuses = ['draft', 'sent', 'accepted', 'rejected', 'expired', 'pending'];
          if (!validStatuses.includes(value.toLowerCase().trim())) {
            return t('bulkImport.validation.invalidStatus', 'Invalid status. Allowed: draft, sent, accepted, rejected, expired, pending');
          }
          return null;
        }
      },
      {
        key: 'category',
        label: t('bulkImport.fields.category', 'Category'),
        required: false,
        validate: (value: string) => {
          if (!value) return null;
          if (value.length > 100) {
            return t('bulkImport.validation.categoryTooLong', 'Category must be less than 100 characters');
          }
          return null;
        }
      },
      {
        key: 'source',
        label: t('bulkImport.fields.source', 'Source'),
        required: false,
        validate: (value: string) => {
          if (!value) return null;
          if (value.length > 100) {
            return t('bulkImport.validation.sourceTooLong', 'Source must be less than 100 characters');
          }
          return null;
        }
      },
      {
        key: 'currency',
        label: t('bulkImport.fields.currency', 'Currency'),
        required: false,
        validate: (value: string) => {
          if (!value) return null;
          const validCurrencies = ['TND', 'EUR', 'USD', 'GBP'];
          if (!validCurrencies.includes(value.toUpperCase().trim())) {
            return t('bulkImport.validation.invalidCurrency', 'Invalid currency. Allowed: TND, EUR, USD, GBP');
          }
          return null;
        }
      },
      {
        key: 'validUntil',
        label: t('bulkImport.fields.validUntil', 'Valid Until'),
        required: false,
        type: 'date'
      },
      {
        key: 'taxes',
        label: t('bulkImport.fields.taxes', 'Taxes'),
        required: false,
        type: 'number',
        validate: (value: any) => {
          if (value === undefined || value === '') return null;
          const num = Number(value);
          if (isNaN(num) || num < 0) {
            return t('bulkImport.validation.invalidTaxes', 'Taxes must be a positive number');
          }
          if (num > 100) {
            return t('bulkImport.validation.taxesTooHigh', 'Taxes percentage cannot exceed 100%');
          }
          return null;
        }
      },
      {
        key: 'discount',
        label: t('bulkImport.fields.discount', 'Discount'),
        required: false,
        type: 'number',
        validate: (value: any) => {
          if (value === undefined || value === '') return null;
          const num = Number(value);
          if (isNaN(num) || num < 0) {
            return t('bulkImport.validation.invalidDiscount', 'Discount must be a positive number');
          }
          if (num > 100) {
            return t('bulkImport.validation.discountTooHigh', 'Discount percentage cannot exceed 100%');
          }
          return null;
        }
      },
      {
        key: 'notes',
        label: t('bulkImport.fields.notes', 'Notes'),
        required: false
      },
    ],
    transformRow: (data) => ({
      title: data.title || '',
      contactId: data.contactId ? Number(data.contactId) : undefined,
      description: data.description,
      status: data.status || 'draft',
      category: data.category,
      source: data.source,
      currency: data.currency || 'TND',
      validUntil: data.validUntil,
      taxes: data.taxes ? Number(data.taxes) : undefined,
      discount: data.discount ? Number(data.discount) : undefined,
      notes: data.notes,
    }),
    validateRow: (data) => {
      const errors: string[] = [];
      const warnings: string[] = [];

      // Offers with status 'sent' or 'accepted' should have a contact
      if (['sent', 'accepted'].includes(data.status) && !data.contactId) {
        warnings.push(t('bulkImport.validation.sentOfferNeedsContact', 'Sent/accepted offers should have a contact assigned'));
      }

      // Valid until date should be in the future for draft offers
      if (data.validUntil && data.status === 'draft') {
        const validDate = new Date(data.validUntil);
        if (validDate < new Date()) {
          warnings.push(t('bulkImport.validation.expiredValidUntil', 'Valid until date is in the past'));
        }
      }

      // High discount warning
      if (data.discount && data.discount > 50) {
        warnings.push(t('bulkImport.validation.highDiscount', 'Discount is unusually high (>50%)'));
      }

      return { errors, warnings };
    },
  };

  // Permission checks (disabled in view-all mode)
  const viewAll = isViewAllMode();
  const hasReadAccess = isMainAdmin || canRead('offers');
  const hasCreateAccess = isMainAdmin || canCreate('offers');
  const hasUpdateAccess = isMainAdmin || canUpdate('offers');
  const hasDeleteAccess = isMainAdmin || canDelete('offers');

  const {
    offers,
    stats,
    loading,
    sendOffer,
    acceptOffer,
    declineOffer,
    deleteOffer,
    renewOffer,
    convertOffer
  } = useOffers();

  const { priorities: lookupPriorities } = useLookups();

  const filteredOffers = useMemo(() => {
    return offers.filter(offer => {
      const matchesSearch = offer.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        offer.contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (offer.offerNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(offer.id).toLowerCase().includes(searchTerm.toLowerCase()) ||
        offer.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'all' || offer.status === filterStatus;
      const matchesAssigned = filterAssigned === 'all' || (offer.assignedToName || '').toLowerCase() === filterAssigned.toLowerCase();
      // simple date range filter on createdAt
      const matchesDate = (() => {
        if (filterDateRange === 'any') return true;
        const days = Number(filterDateRange);
        if (!offer.createdAt) return true;
        const created = new Date(offer.createdAt);
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);
        return created >= cutoff;
      })();

      // Handle stat filters
      if (selectedStat === 'active') return matchesSearch && ['draft', 'sent'].includes(offer.status);
      if (selectedStat === 'accepted') return matchesSearch && offer.status === 'accepted';
      if (selectedStat === 'declined') return matchesSearch && ['declined', 'cancelled'].includes(offer.status);

      return matchesSearch && matchesStatus && matchesAssigned && matchesDate;
    });
  }, [offers, searchTerm, filterStatus, selectedStat, filterAssigned, filterDateRange]);

  const companyScopedOffers = useFilteredByCompany(filteredOffers);
  const pagination = usePaginatedData(companyScopedOffers, 20);

  // Check if all items are selected
  const allSelected = useMemo(() => {
    return pagination.data.length > 0 && pagination.data.every(offer => selectedIds.has(offer.id));
  }, [pagination.data, selectedIds]);

  // Check if some items are selected (for indeterminate state)
  const someSelected = useMemo(() => {
    return selectedIds.size > 0 && !allSelected;
  }, [selectedIds, allSelected]);

  // Toggle all items selection
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(pagination.data.map(offer => offer.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  // Toggle single item selection
  const handleSelectItem = (offerId: string, checked: boolean) => {
    const newSelected = new Set(selectedIds);
    if (checked) {
      newSelected.add(offerId);
    } else {
      newSelected.delete(offerId);
    }
    setSelectedIds(newSelected);
  };

  // Bulk delete - calls delete API for each selected item
  const handleBulkDelete = async () => {
    const idsToDelete = Array.from(selectedIds);
    setIsBulkDeleting(true);
    setBulkDeleteProgress(0);

    for (let i = 0; i < idsToDelete.length; i++) {
      await deleteOffer(idsToDelete[i]);
      setBulkDeleteProgress(Math.round(((i + 1) / idsToDelete.length) * 100));
    }

    setIsBulkDeleting(false);
    setShowBulkDeleteDialog(false);
    setSelectedIds(new Set());
    setBulkDeleteProgress(0);
  };

  const assignedOptions = useMemo(() => {
    return Array.from(new Set(offers.map(o => (o.assignedToName || '').trim()).filter(Boolean)));
  }, [offers]);

  const handleOfferClick = (offer: Offer) => {
    navigate(`/dashboard/offers/${offer.id}`);
  };

  const handleAddOffer = () => {
    navigate('/dashboard/offers/add');
  };

  const handleViewOffer = (offer: any) => {
    navigate(`/dashboard/offers/${offer.id}`);
  };

  const handleEditOffer = (offer: any) => {
    navigate(`/dashboard/offers/${offer.id}/edit`);
  };

  const handleDeleteClick = (offerId: string) => {
    setOfferToDelete(offerId);
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!offerToDelete) return;
    await deleteOffer(offerToDelete);
    setShowDeleteDialog(false);
    setOfferToDelete(null);
  };

  // Use stats from the hook which fetches all offers for accurate counts

  const exportConfig: ExportConfig = {
    filename: 'offers-export',
    allDataTransform: (offer: any) => ({
      [t('exportLabels.id')]: offer.id,
      [t('exportLabels.title')]: offer.title,
      [t('exportLabels.contactName')]: offer.contactName,
      [t('exportLabels.contactCompany')]: offer.contactCompany,
      [t('exportLabels.contactEmail')]: offer.contactEmail || t('notApplicable'),
      [t('exportLabels.status')]: offer.status,
      [t('exportLabels.priority')]: offer.priority || t('notSet'),
      [t('exportLabels.totalAmount')]: calculateItemsTotal(offer),
      [t('exportLabels.currency')]: offer.currency || 'TND',
      [t('exportLabels.tva')]: offer.taxes || 0,
      [t('exportLabels.taxType')]: offer.taxType === 'percentage' ? '%' : (offer.currency || 'TND'),
      [t('exportLabels.discount')]: offer.discount || 0,
      [t('exportLabels.validUntil')]: offer.validUntil ? new Date(offer.validUntil).toLocaleDateString() : t('notSet'),
      [t('exportLabels.assignedTo')]: offer.assignedToName || t('notSet'),
      [t('exportLabels.createdDate')]: offer.createdAt ? new Date(offer.createdAt).toLocaleDateString() : t('notApplicable'),
      [t('exportLabels.updatedDate')]: offer.updatedAt ? new Date(offer.updatedAt).toLocaleDateString() : t('notApplicable'),
      [t('exportLabels.description')]: offer.description || '',
      [t('exportLabels.notes')]: offer.notes || '',
      [t('exportLabels.itemsCount')]: offer.items?.length || 0,
    }),
    availableColumns: [
      { key: 'id', label: t('exportLabels.id'), category: t('exportCategories.basic') },
      { key: 'title', label: t('exportLabels.title'), category: t('exportCategories.basic') },
      { key: 'status', label: t('exportLabels.status'), category: t('exportCategories.basic') },
      { key: 'priority', label: t('exportLabels.priority'), category: t('exportCategories.basic') },
      { key: 'contactName', label: t('exportLabels.contactName'), category: t('exportCategories.contact') },
      { key: 'contactCompany', label: t('exportLabels.contactCompany'), category: t('exportCategories.contact') },
      { key: 'contactEmail', label: t('exportLabels.contactEmail'), category: t('exportCategories.contact') },
      { key: 'totalAmount', label: t('exportLabels.totalAmount'), category: t('exportCategories.financial'), transform: (_: any, offer: any) => calculateItemsTotal(offer) },
      { key: 'amount', label: t('exportLabels.amount'), category: t('exportCategories.financial') },
      { key: 'currency', label: t('exportLabels.currency'), category: t('exportCategories.financial') },
      { key: 'taxes', label: t('exportLabels.tva'), category: t('exportCategories.financial') },
      { key: 'taxType', label: t('exportLabels.taxType'), category: t('exportCategories.financial'), transform: (val: string, offer: any) => val === 'percentage' ? '%' : (offer.currency || 'TND') },
      { key: 'discount', label: t('exportLabels.discount'), category: t('exportCategories.financial') },
      { key: 'validUntil', label: t('exportLabels.validUntil'), category: t('exportCategories.timeline'), transform: (date: string) => date ? new Date(date).toLocaleDateString() : t('notSet') },
      { key: 'assignedToName', label: t('exportLabels.assignedTo'), category: t('exportCategories.assignment') },
      { key: 'createdAt', label: t('exportLabels.createdDate'), category: t('exportCategories.timeline'), transform: (date: string) => date ? new Date(date).toLocaleDateString() : t('notApplicable') },
      { key: 'updatedAt', label: t('exportLabels.updatedDate'), category: t('exportCategories.timeline'), transform: (date: string) => date ? new Date(date).toLocaleDateString() : t('notApplicable') },
      { key: 'description', label: t('exportLabels.description'), category: t('exportCategories.details') },
      { key: 'notes', label: t('exportLabels.notes'), category: t('exportCategories.details') },
    ]
  };

  // Use stats from backend (fetched via useOffers hook) for accurate dynamic counts
  // Calculate total value from all offers items
  const calculatedTotalValue = useMemo(() => {
    return offers.reduce((total, offer) => total + calculateItemsTotal(offer), 0);
  }, [offers]);

  // Calculate total value for currently filtered offers (updates on filters/stat selection)
  const filteredTotalValue = useMemo(() => {
    return filteredOffers.reduce((total, offer) => total + calculateItemsTotal(offer), 0);
  }, [filteredOffers]);

  const statsData = [
    {
      label: t("total_offers"),
      value: stats.totalOffers,
      icon: FileText,
      color: "chart-1",
      filter: 'all'
    },
    {
      label: t("active_offers"),
      value: stats.activeOffers,
      icon: Target,
      color: "chart-2",
      filter: 'active'
    },
    {
      label: t("accepted_offers"),
      value: stats.acceptedOffers,
      icon: CheckCircle,
      color: "chart-3",
      filter: 'accepted'
    },
    {
      label: t("totalValue"),
      value: `${formatTotalValue(filteredTotalValue)} ${filteredOffers.length > 0 ? (filteredOffers[0].currency || 'TND') : 'TND'}`,
      icon: DollarSign,
      color: "chart-4",
      filter: 'value'
    }
  ];

  const handleStatClick = (stat: any) => {
    setSelectedStat(stat.filter);
    if (stat.filter === 'all') {
      setFilterStatus('all');
    }
  };

  const getStatusColor = (status: string) => getStatusColorClass('offer', status);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-destructive/10 text-destructive';
      case 'high': return 'bg-warning/10 text-warning';
      case 'medium': return 'bg-primary/10 text-primary';
      case 'low': return 'bg-success/10 text-success';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const formatDate = (date: Date | string) => {
    return format(new Date(date), 'MMM dd, yyyy');
  };

  if (loading && !offers.length) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">{t('loading_offers')}</p>
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
      {/* Header (workflow style) - Hidden on mobile */}
      <div className="hidden md:flex items-center justify-between p-4 border-b border-border bg-card/50 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <FileText className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground">{t('title', 'Offers')}</h1>
            <p className="text-[11px] text-muted-foreground">{t('subtitle', 'Manage quotes and proposals')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setDemoOpen(true)} className="hidden sm:inline-flex gap-1.5">
            <Play className="h-3.5 w-3.5" /> {t('watchDemo', 'Watch Demo')}
          </Button>
          {hasCreateAccess && (
            <CreateActionButton className="bg-primary text-white hover:bg-primary/90 shadow-medium hover-lift" onClick={handleAddOffer}>
              <Plus className="h-4 w-4 text-white mr-2" />
              {t("add_offer")}
            </CreateActionButton>
          )}
        </div>
      </div>

      {/* Autopilot product demo */}
      <OffersAutopilotDemo open={demoOpen} onClose={() => setDemoOpen(false)} />

      {/* Mobile Header with Title */}
      <div className="md:hidden flex items-center justify-between gap-2 p-3 border-b border-border bg-card/50 backdrop-blur">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base font-semibold text-foreground truncate">{t('title', 'Offers')}</h1>
            <p className="text-[10px] text-muted-foreground truncate">{t('subtitle', 'Manage quotes and proposals')}</p>
          </div>
        </div>
        {hasCreateAccess && (
          <div className="flex gap-1.5 flex-shrink-0">
            <Button variant="outline" size="sm" onClick={() => setShowImportModal(true)}>
              <Upload className="h-4 w-4" />
            </Button>
            <CreateActionButton size="sm" className="bg-primary text-white hover:bg-primary/90 shadow-medium hover-lift" onClick={handleAddOffer}>
              <Plus className="h-4 w-4 text-white" />
            </CreateActionButton>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="p-3 sm:p-4 border-b border-border">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {statsData.map((stat, index) => {
            const isSelected = selectedStat === stat.filter;
            const isInteractive = stat.filter !== 'value';
            return (
              <Card
                key={index}
                className={`shadow-card hover-lift gradient-card group ${isInteractive ? 'cursor-pointer' : ''} transition-all hover:shadow-lg ${isSelected
                  ? 'border-2 border-primary bg-primary/5'
                  : 'border-0'
                  }`}
                onClick={() => isInteractive && handleStatClick(stat)}
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
      <div className="p-3 sm:p-4 border-b border-border bg-card">
        <div className="flex flex-col gap-3 sm:flex-row sm:gap-4 sm:items-center sm:justify-between">
          <div className="flex gap-2 sm:gap-3 flex-1 w-full items-center">
            <div className="flex-1">
              <CollapsibleSearch
                placeholder={t("searchOffers")}
                value={searchTerm}
                onChange={setSearchTerm}
                className="w-full"
              />
            </div>
            {/* Filter dropdown replaced by slide-down filter bar (see below) */}
            <div className="relative">
              <Button variant="outline" size="sm" className="gap-1 sm:gap-2 px-2 sm:px-3" onClick={() => setShowFilterBar(s => !s)}>
                <Filter className="h-4 w-4" />
                <span className="hidden sm:inline">{t('filters.filters')}</span>
                {filterStatus !== 'all' && (
                  <Badge variant="secondary" className="ml-2 h-4 px-1 text-xs">
                    1
                  </Badge>
                )}
              </Button>
            </div>
            {/* Export button - commented out for now
            <div className="relative">
              <Button variant="outline" size="sm" className="gap-1 sm:gap-2 px-2 sm:px-3" onClick={() => setShowExportModal(true)}>
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">{t('filters.export')}</span>
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
        <div className="p-3 sm:p-4 border-b border-border bg-background/50">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-4 gap-2">
              <div className="relative">
                <select className="border rounded px-3 py-2 pr-10 appearance-none bg-background text-foreground w-full text-sm" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                  <option value="all">{t('filters.allStatuses')}</option>
                  <option value="draft">{t('filters.draft')}</option>
                  <option value="sent">{t('filters.sent')}</option>
                  <option value="accepted">{t('filters.accepted')}</option>
                  <option value="declined">{t('filters.declined')}</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
              <div className="relative">
                <select className="border rounded px-3 py-2 pr-10 appearance-none bg-background text-foreground w-full text-sm" value={filterAssigned} onChange={e => setFilterAssigned(e.target.value)}>
                  <option value="all">{t('filters.allAssignees')}</option>
                  {assignedOptions.map((a, i) => (
                    <option key={i} value={a}>{a}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
              <div className="relative">
                <select className="border rounded px-3 py-2 pr-10 appearance-none bg-background text-foreground w-full text-sm" value={filterDateRange} onChange={e => setFilterDateRange(e.target.value as any)}>
                  <option value="any">{t('filters.anyTime')}</option>
                  <option value="7">{t('filters.last7Days')}</option>
                  <option value="30">{t('filters.last30Days')}</option>
                  <option value="365">{t('filters.lastYear')}</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="px-3 py-1 rounded-full border border-border text-sm" onClick={() => { setFilterStatus('all'); setFilterAssigned('all'); setFilterDateRange('any'); setShowFilterBar(false); }}>{t('clear')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div className="sticky top-0 z-30 bg-destructive/10 border-b border-destructive/20 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <Checkbox
                checked={allSelected}
                onCheckedChange={handleSelectAll}
              />
              <span className="text-sm font-medium text-foreground">
                {t('bulk.selectedCount', { count: selectedIds.size })}
              </span>
              <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())} className="text-muted-foreground">
                <span className="hidden sm:inline">{t('bulk.deselectAll')}</span>
              </Button>
            </div>
            {hasDeleteAccess && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowBulkDeleteDialog(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">{t('bulk.deleteSelected')}</span>
              </Button>
            )}
          </div>
        </div>
      )}

      {viewMode === 'kanban' ? (
        <OffersKanbanView
          offers={filteredOffers}
          onOfferClick={handleOfferClick}
          onStatusChange={async (offerId, newStatus) => {
            try {
              await OffersService.updateOffer(offerId, { status: newStatus as any });
              toast.success(t('status_updated', { defaultValue: 'Status updated' }));
            } catch {
              toast.error(t('status_update_failed', { defaultValue: 'Failed to update status' }));
            }
          }}
          formatCurrency={(val: number) => `${val.toLocaleString()} TND`}
        />
      ) : viewMode === 'list' ? (
        <div className="p-2 sm:p-3 lg:p-4">
          <Card className="shadow-card border-0 bg-card text-[0.85rem]">
            <MapOverlay
              items={mapOffersToMapItems(filteredOffers)}
              onViewItem={handleViewOffer}
              onEditItem={handleEditOffer}
              onClose={() => setShowMap(false)}
              isVisible={showMap}
            />
            <CardContent className="p-0">
              {filteredOffers.length === 0 ? (
                <div className="p-12 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">{t("no_offers_found")}</h3>
                  <p className="text-muted-foreground">
                    {t("listView.noOffersDescription") || "Get started by creating your first offer"}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {pagination.data.map((offer) => (
                    <div
                      key={offer.id}
                      className="p-3 sm:p-4 lg:p-6 hover:bg-muted/50 transition-colors group cursor-pointer"
                      onClick={() => handleOfferClick(offer)}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                        <div className="flex items-start sm:items-center gap-3 sm:gap-4 flex-1 min-w-0">
                          <Avatar className="h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0">
                            <AvatarFallback className="text-xs sm:text-sm bg-primary/10 text-primary">
                              <FileText className="h-4 w-4 sm:h-6 sm:w-6" />
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <h3 className="text-foreground text-sm sm:text-base break-words line-clamp-2">{offer.title}</h3>
                              <Badge className={`${getStatusColor(offer.status)} text-xs`}>
                                {t(getStatusTranslationKey('offer', offer.status))}
                              </Badge>
                              {(offer.sentCount !== undefined && offer.sentCount > 0) && (
                                <Badge variant="outline" className="text-xs gap-1 opacity-80">
                                  <Send className="w-3 h-3 text-primary" />
                                  {offer.sentCount}
                                </Badge>
                              )}
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs sm:text-sm text-muted-foreground mb-2">
                              <span className="truncate flex items-center gap-1">
                                {offer.contactName} - {offer.contactCompany}
                                {offer.contactHasLocation === 1 && (
                                  <MapPin className="h-3 w-3 text-primary flex-shrink-0" />
                                )}
                              </span>
                              <span className="text-foreground">
                                {calculateItemsTotal(offer).toLocaleString()} {offer.currency}
                              </span>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <User className="h-3 w-3 flex-shrink-0" />
                                <span className="truncate">{offer.assignedToName || t('unassigned')}</span>
                              </div>

                              <div className="hidden sm:flex items-center gap-1">
                                <Calendar className="h-3 w-3 flex-shrink-0" />
                                <span>
                                  {offer.validUntil ? formatDate(offer.validUntil) : t('noExpiryDate')}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-2 mt-2 sm:mt-0">
                          <div className="flex gap-1 flex-wrap flex-1 sm:flex-none">
                            {offer.tags.slice(0, 2).map((tag, index) => (
                              <Badge key={index} variant="outline" className="text-xs px-1.5 py-0.5">
                                {tag}
                              </Badge>
                            ))}
                            {offer.tags.length > 2 && (
                              <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                                +{offer.tags.length - 2}
                              </Badge>
                            )}
                          </div>

                          <TableRowActions actions={[
                            { icon: Eye, label: t('listView.viewDetails'), onClick: (e) => { e.stopPropagation(); handleOfferClick(offer); } },
                            { icon: Edit, label: t('listView.editOffer'), onClick: (e) => { e.stopPropagation(); navigate(`/dashboard/offers/${offer.id}/edit`); }, show: hasUpdateAccess },
                            { icon: Send, label: t('send_offer'), onClick: (e) => { e.stopPropagation(); sendOffer(offer.id); }, show: hasUpdateAccess && ['draft', 'modified'].includes(offer.status) },
                            { icon: GitBranch, label: t('listView.convertToSale'), onClick: (e) => { e.stopPropagation(); convertOffer(offer.id, { convertToSale: true, convertToServiceOrder: false }); }, show: hasCreateAccess && offer.status === 'accepted' },
                            { icon: FileText, label: t('report', 'Report'), onClick: (e) => { e.stopPropagation(); window.open(`/dashboard/offers/${offer.id}/report`, '_blank'); } },
                            { icon: Trash2, label: t('deleteConfirm.confirm'), onClick: (e) => { e.stopPropagation(); handleDeleteClick(offer.id); }, variant: 'destructive', show: hasDeleteAccess }
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
        <div className="p-3 sm:p-4 lg:p-6 w-full">
          <Card className="shadow-card border-0 bg-card w-full">
            <MapOverlay
              items={mapOffersToMapItems(filteredOffers)}
              onViewItem={handleViewOffer}
              onEditItem={handleEditOffer}
              onClose={() => setShowMap(false)}
              isVisible={showMap}
            />
            <CardContent className="p-0">
              {filteredOffers.length === 0 ? (
                <div className="p-12 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">{t("no_offers_found")}</h3>
                  <p className="text-muted-foreground mb-4">
                    {t("listView.noOffersDescription") || "Get started by creating your first offer"}
                  </p>
                </div>
              ) : (
                <>

                  <div className="overflow-x-auto w-full scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent"
                    style={{ WebkitOverflowScrolling: 'touch' }}>
                    <TableLayout
                      items={pagination.data}
                      rowKey={(offer: Offer) => offer.id}
                      onRowClick={handleOfferClick}
                      tableClassName="w-full table-fixed min-w-[900px]"
                      enableSelection={true}
                      selectedIds={selectedIds as unknown as Set<string | number>}
                      onSelectionChange={(ids) => setSelectedIds(ids as Set<string>)}
                      emptyTitle={t("no_offers_found")}
                      emptyDescription={t("listView.noOffersDescription") || "Get started by creating your first offer"}
                      columns={[
                        {
                          key: 'offer',
                          title: t('table.offer'),
                          width: 'w-[200px]',
                          render: (offer: Offer) => (
                            <div className="min-w-0">
                              <div className="text-sm text-foreground break-words line-clamp-2">{offer.title}</div>
                              <div className="text-sm text-muted-foreground">{offer.offerNumber}</div>
                            </div>
                          )
                        },
                        ...(isViewAllMode() ? [{
                          key: 'company',
                          title: t('table.company', 'Company'),
                          render: (offer: Offer) => <CompanyBadge tenantId={(offer as any).tenantId} forceShow />,
                        } as Column<Offer>] : []),
                        {
                          key: 'contact',
                          title: t('table.contact'),
                          render: (offer: Offer) => (
                            <div>
                              <div className="text-sm text-foreground">
                                {offer.contactName}
                              </div>
                              <div className="text-sm text-muted-foreground">{offer.contactCompany}</div>
                            </div>
                          )
                        },
                        {
                          key: 'amount',
                          title: t('table.amount'),
                          render: (offer: Offer) => (
                            <div className="text-sm text-foreground">
                              {Math.floor(calculateItemsTotal(offer)).toLocaleString()} {offer.currency}
                              <span className="text-sm text-muted-foreground ml-1">({t('inclTva')})</span>
                            </div>
                          )
                        },
                        {
                          key: 'status',
                          title: t('table.status'),
                          render: (offer: Offer) => (
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge className={getStatusColor(offer.status)}>
                                {t(getStatusTranslationKey('offer', offer.status))}
                              </Badge>
                            </div>
                          )
                        },
                        {
                          key: 'validUntil',
                          title: t('table.validUntil'),
                          render: (offer: Offer) => (
                            <div className="text-sm text-muted-foreground">
                              {offer.validUntil ? formatDate(offer.validUntil) : t('noExpiryDate')}
                            </div>
                          )
                        },
                        {
                          key: 'actions',
                          title: '',
                          width: 'w-[50px]',
                          resizable: false,
                          render: (offer: Offer) => (
                            <TableRowActions actions={[
                              { icon: Eye, label: t('table.viewDetails'), onClick: (e) => { e.stopPropagation(); handleOfferClick(offer); } },
                              { icon: Edit, label: t('table.editOffer'), onClick: (e) => { e.stopPropagation(); navigate(`/dashboard/offers/${offer.id}/edit`); }, show: hasUpdateAccess },
                              { icon: FileText, label: t('report', 'Report'), onClick: (e) => { e.stopPropagation(); window.open(`/dashboard/offers/${offer.id}/report`, '_blank'); } },
                              { icon: Trash2, label: t('deleteConfirm.confirm'), onClick: (e) => { e.stopPropagation(); handleDeleteClick(offer.id); }, variant: 'destructive', show: hasDeleteAccess }
                            ]} />
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
      )}

      {/* Export Modal - commented out for now
      <ExportModal 
        open={showExportModal}
        onOpenChange={setShowExportModal}
        data={filteredOffers}
        moduleName="Offers"
        moduleNameTranslated={t('offers')}
        exportConfig={exportConfig}
      />
      */}

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('deleteConfirm.title')}</DialogTitle>
            <DialogDescription>
              {t('deleteConfirm.description')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              {t('deleteConfirm.cancel')}
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete} className="gap-2">
              <Trash2 className="h-4 w-4" />
              {t('deleteConfirm.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Modal */}
      <GenericImportModal
        open={showImportModal}
        onOpenChange={setShowImportModal}
        config={offerImportConfig}
        onImport={(items) => offersBulkImportApi.bulkImport({ offers: items })}
        translationNamespace="offers"
      />

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
            <AlertDialogCancel disabled={isBulkDeleting}>{t('deleteConfirm.cancel')}</AlertDialogCancel>
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
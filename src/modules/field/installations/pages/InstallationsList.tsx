import { useEffect, useMemo, useState } from "react";
import { usePaginatedData } from "@/shared/hooks/usePagination";
import { SimplePaginationBar } from "@/components/shared/SimplePaginationBar";
import { formatStatValue } from "@/lib/formatters";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import TableLayout from "@/components/shared/TableLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { CollapsibleSearch } from "@/components/ui/collapsible-search";
import {
  Package, Filter, Edit, Trash2, Eye, MoreVertical, Plus, MapPin, List, Table as TableIcon,
  ChevronDown, Shield, Wrench, Download, Building, Building2, ExternalLink, ShieldAlert, Lock, Upload, Loader2, X, Calendar,
  SlidersHorizontal, Search
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { InstallationDto } from "../types";
import { ExportModal, ExportConfig } from "@/components/shared/ExportModal";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { installationsApi } from "@/services/api/installationsApi";
import { contactsApi } from "@/services/api/contactsApi";
import { useToast } from "@/hooks/use-toast";
import { usePreferences } from "@/hooks/usePreferences";
import { usePermissions } from "@/hooks/usePermissions";
import { useActionLogger } from "@/hooks/useActionLogger";
import { GenericImportModal, type ImportConfig } from "@/shared/import";
import { TableRowActions } from '@/shared/components/TableRowActions';
import { isViewAllMode } from '@/utils/tenant';
import { CompanyBadge } from '@/components/CompanyBadge';
import { useFilteredByCompany } from '@/components/CompanyFilter';
import { CreateActionButton } from '@/components/CreateActionButton';
import { getInitialViewMode, useEnforceListOnMobile } from '../../../../hooks/getInitialViewMode';

export default function InstallationsList() {
  const { t, i18n } = useTranslation('installations');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { preferences } = usePreferences();
  const { canCreate, canRead, canUpdate, canDelete, isLoading: permissionsLoading, isMainAdmin } = usePermissions();
  const { logSearch, logFilter, logExport, logButtonClick } = useActionLogger('Installations');
  const isFrench = i18n.language === 'fr';
  
  // Permission checks (disabled in view-all mode)
  const viewAll = isViewAllMode();
  const hasReadAccess = isMainAdmin || canRead('installations');
  const hasCreateAccess = isMainAdmin || canCreate('installations');
  const hasUpdateAccess = isMainAdmin || canUpdate('installations');
  const hasDeleteAccess = isMainAdmin || canDelete('installations');
  
  // Table view is always the default for Installations list
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | string>('all');
  const [filterManufacturer, setFilterManufacturer] = useState<'all' | string>('all');
  const [filterWarranty, setFilterWarranty] = useState<'all' | 'with' | 'without'>('all');
  const [viewMode, setViewMode] = useState<'list' | 'table'>(() => getInitialViewMode(['list','table'] as const, 'table'));
  useEnforceListOnMobile(viewMode, setViewMode, ['list','table'] as const);
  const [selectedStat, setSelectedStat] = useState<string>('all');
  const [showFilterBar, setShowFilterBar] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [installationToDelete, setInstallationToDelete] = useState<InstallationDto | null>(null);
  const [page, setPage] = useState(1);
  const [showImportModal, setShowImportModal] = useState(false);

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [bulkDeleteProgress, setBulkDeleteProgress] = useState(0);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // Example data for template download (10 rows)
  const installationExampleData = isFrench ? [
    { name: 'Climatiseur Bureau Principal', contactId: 1, model: 'AC-2500', manufacturer: 'Daikin', serialNumber: 'DAI-2024-001', category: 'Climatisation', type: 'Split', status: 'active', siteAddress: '123 Avenue des Affaires, Tunis', installationType: 'Mural', notes: 'Entretien annuel requis' },
    { name: 'Chaudière Gaz Industrielle', contactId: 2, model: 'GH-5000', manufacturer: 'Viessmann', serialNumber: 'VIE-2024-002', category: 'Chauffage', type: 'Gaz', status: 'active', siteAddress: '456 Zone Industrielle, Sfax', installationType: 'Sol', notes: 'Contrat maintenance inclus' },
    { name: 'Pompe à Chaleur Piscine', contactId: 3, model: 'HP-POOL-300', manufacturer: 'Zodiac', serialNumber: 'ZOD-2024-003', category: 'Piscine', type: 'Air-Eau', status: 'active', siteAddress: '789 Rue du Lac, Sousse', installationType: 'Extérieur', notes: 'Mise en service saisonnière' },
    { name: 'VMC Double Flux', contactId: 4, model: 'DF-200', manufacturer: 'Aldes', serialNumber: 'ALD-2024-004', category: 'Ventilation', type: 'Double Flux', status: 'active', siteAddress: '321 Boulevard Central, Tunis', installationType: 'Plafond', notes: 'Filtres à changer tous les 6 mois' },
    { name: 'Groupe Électrogène', contactId: 5, model: 'GE-150KVA', manufacturer: 'Caterpillar', serialNumber: 'CAT-2024-005', category: 'Électricité', type: 'Diesel', status: 'active', siteAddress: '654 Parc d\'Activités, Bizerte', installationType: 'Abri Extérieur', notes: 'Test mensuel obligatoire' },
    { name: 'Panneau Solaire Installation', contactId: 6, model: 'PV-500W', manufacturer: 'SunPower', serialNumber: 'SUN-2024-006', category: 'Solaire', type: 'Photovoltaïque', status: 'active', siteAddress: '987 Route de la Mer, Monastir', installationType: 'Toiture', notes: 'Nettoyage trimestriel' },
    { name: 'Compresseur Air Comprimé', contactId: 7, model: 'AC-500L', manufacturer: 'Atlas Copco', serialNumber: 'ATL-2024-007', category: 'Industrie', type: 'Vis', status: 'active', siteAddress: '147 Zone Franche, Gabès', installationType: 'Local Technique', notes: 'Vidange huile annuelle' },
    { name: 'Système Alarme Incendie', contactId: 8, model: 'FAS-PRO', manufacturer: 'Siemens', serialNumber: 'SIE-2024-008', category: 'Sécurité', type: 'Détection', status: 'active', siteAddress: '258 Centre Commercial, Tunis', installationType: 'Bâtiment', notes: 'Test hebdomadaire' },
    { name: 'Ascenseur Passagers', contactId: 9, model: 'ELV-8P', manufacturer: 'Otis', serialNumber: 'OTI-2024-009', category: 'Transport', type: 'Électrique', status: 'maintenance', siteAddress: '369 Tour Bureaux, Sfax', installationType: 'Gaine', notes: 'Révision en cours' },
    { name: 'Centrale Traitement Air', contactId: 10, model: 'CTA-3000', manufacturer: 'Carrier', serialNumber: 'CAR-2024-010', category: 'Climatisation', type: 'Centrale', status: 'active', siteAddress: '741 Hôpital Régional, Sousse', installationType: 'Local Technique', notes: 'Filtres HEPA' },
  ] : [
    { name: 'Main Office Air Conditioner', contactId: 1, model: 'AC-2500', manufacturer: 'Daikin', serialNumber: 'DAI-2024-001', category: 'HVAC', type: 'Split', status: 'active', siteAddress: '123 Business Avenue, Tunis', installationType: 'Wall Mount', notes: 'Annual maintenance required' },
    { name: 'Industrial Gas Boiler', contactId: 2, model: 'GH-5000', manufacturer: 'Viessmann', serialNumber: 'VIE-2024-002', category: 'Heating', type: 'Gas', status: 'active', siteAddress: '456 Industrial Zone, Sfax', installationType: 'Floor', notes: 'Maintenance contract included' },
    { name: 'Pool Heat Pump', contactId: 3, model: 'HP-POOL-300', manufacturer: 'Zodiac', serialNumber: 'ZOD-2024-003', category: 'Pool', type: 'Air-Water', status: 'active', siteAddress: '789 Lake Street, Sousse', installationType: 'Outdoor', notes: 'Seasonal commissioning' },
    { name: 'Dual Flow Ventilation', contactId: 4, model: 'DF-200', manufacturer: 'Aldes', serialNumber: 'ALD-2024-004', category: 'Ventilation', type: 'Dual Flow', status: 'active', siteAddress: '321 Central Boulevard, Tunis', installationType: 'Ceiling', notes: 'Change filters every 6 months' },
    { name: 'Generator Set', contactId: 5, model: 'GE-150KVA', manufacturer: 'Caterpillar', serialNumber: 'CAT-2024-005', category: 'Electrical', type: 'Diesel', status: 'active', siteAddress: '654 Business Park, Bizerte', installationType: 'Outdoor Shelter', notes: 'Monthly test required' },
    { name: 'Solar Panel Installation', contactId: 6, model: 'PV-500W', manufacturer: 'SunPower', serialNumber: 'SUN-2024-006', category: 'Solar', type: 'Photovoltaic', status: 'active', siteAddress: '987 Seaside Road, Monastir', installationType: 'Rooftop', notes: 'Quarterly cleaning' },
    { name: 'Air Compressor', contactId: 7, model: 'AC-500L', manufacturer: 'Atlas Copco', serialNumber: 'ATL-2024-007', category: 'Industrial', type: 'Screw', status: 'active', siteAddress: '147 Free Zone, Gabes', installationType: 'Technical Room', notes: 'Annual oil change' },
    { name: 'Fire Alarm System', contactId: 8, model: 'FAS-PRO', manufacturer: 'Siemens', serialNumber: 'SIE-2024-008', category: 'Security', type: 'Detection', status: 'active', siteAddress: '258 Shopping Center, Tunis', installationType: 'Building', notes: 'Weekly test' },
    { name: 'Passenger Elevator', contactId: 9, model: 'ELV-8P', manufacturer: 'Otis', serialNumber: 'OTI-2024-009', category: 'Transport', type: 'Electric', status: 'maintenance', siteAddress: '369 Office Tower, Sfax', installationType: 'Shaft', notes: 'Under revision' },
    { name: 'Air Handling Unit', contactId: 10, model: 'AHU-3000', manufacturer: 'Carrier', serialNumber: 'CAR-2024-010', category: 'HVAC', type: 'Central', status: 'active', siteAddress: '741 Regional Hospital, Sousse', installationType: 'Technical Room', notes: 'HEPA filters' },
  ];

  // Log search when search term changes (with debounce effect)
  useEffect(() => {
    if (searchTerm.length > 2) {
      const timer = setTimeout(() => {
        logSearch(searchTerm, filteredInstallations?.length || 0, { entityType: 'Installation' });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [searchTerm]);

  // Log filter changes
  useEffect(() => {
    if (filterType !== 'all') {
      logFilter('Type', filterType, { entityType: 'Installation' });
    }
  }, [filterType]);

  useEffect(() => {
    if (filterWarranty !== 'all') {
      logFilter('Warranty', filterWarranty, { entityType: 'Installation' });
    }
  }, [filterWarranty]);

  useEffect(() => {
    if (selectedStat !== 'all') {
      logFilter('Stat', selectedStat, { entityType: 'Installation' });
    }
  }, [selectedStat]);

  // viewMode defaults to 'table' and is not synced from preferences for this page

  const { data: installationsResponse, isLoading } = useQuery({
    queryKey: ['installations', { page, search: searchTerm }],
    queryFn: () => installationsApi.getAll({ 
      page, 
      pageSize: 50,
      search: searchTerm,
      sortBy: 'created_at',
      sortOrder: 'desc'
    }),
  });

  // Fetch all contacts to map contactId to customer name
  const { data: contactsResponse } = useQuery({
    queryKey: ['contacts-for-installations'],
    queryFn: () => contactsApi.getAll({ pageSize: 500 }),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Create a map of contactId to contact for quick lookup
  const contactsMap = useMemo(() => {
    const map = new Map<number, { id: number; name: string; email?: string }>();
    if (contactsResponse?.contacts) {
      contactsResponse.contacts.forEach(contact => {
        map.set(contact.id, { id: contact.id, name: contact.name, email: contact.email });
      });
    }
    return map;
  }, [contactsResponse]);

  // Installation import configuration - uses contactsMap to validate contactIds
  const installationImportConfig: ImportConfig<any> = useMemo(() => ({
    entityName: isFrench ? 'Installations' : 'Installations',
    templateFilename: isFrench ? 'modele-installations.xlsx' : 'installations-template.xlsx',
    templateSheetName: isFrench ? 'Modèle Installations' : 'Installations Template',
    requiredFields: ['name'],
    duplicateCheckFields: ['serialNumber', 'name'],
    exampleData: installationExampleData,
    fields: [
      { 
        key: 'name', 
        label: t('bulkImport.fields.name', 'Name'), 
        required: true,
        validate: (value: string) => {
          if (!value || !value.trim()) return t('validation.nameRequired', 'Installation name is required');
          if (value.length > 255) return t('validation.nameTooLong', 'Name must be less than 255 characters');
          return null;
        }
      },
      { 
        key: 'contactId', 
        label: t('bulkImport.fields.contactId', 'Contact ID'), 
        required: false, 
        type: 'number',
        validate: (value: any) => {
          if (value === undefined || value === '' || value === null) return null;
          const str = String(value).replace(/\s/g, '').replace(',', '.');
          const num = Number(str);
          if (isNaN(num) || num < 0 || !Number.isInteger(num)) {
            return t('validation.invalidContactId', 'Contact ID must be a valid positive integer');
          }
          return null;
        }
      },
      { 
        key: 'model', 
        label: t('bulkImport.fields.model', 'Model'), 
        required: false,
        validate: (value: string) => {
          if (!value) return null;
          if (value.length > 100) return t('validation.modelTooLong', 'Model must be less than 100 characters');
          return null;
        }
      },
      { 
        key: 'manufacturer', 
        label: t('bulkImport.fields.manufacturer', 'Manufacturer'), 
        required: false,
        validate: (value: string) => {
          if (!value) return null;
          if (value.length > 100) return t('validation.manufacturerTooLong', 'Manufacturer must be less than 100 characters');
          return null;
        }
      },
      { 
        key: 'serialNumber', 
        label: t('bulkImport.fields.serialNumber', 'Serial Number'), 
        required: false,
        validate: (value: string) => {
          if (!value) return null;
          if (value.length > 100) return t('validation.serialNumberTooLong', 'Serial number must be less than 100 characters');
          if (!/^[a-zA-Z0-9\-_]+$/.test(value.trim())) {
            return t('validation.invalidSerialNumber', 'Serial number can only contain letters, numbers, dashes and underscores');
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
          if (value.length > 100) return t('validation.categoryTooLong', 'Category must be less than 100 characters');
          return null;
        }
      },
      { 
        key: 'type', 
        label: t('bulkImport.fields.type', 'Type'), 
        required: false,
        validate: (value: string) => {
          if (!value) return null;
          if (value.length > 50) return t('validation.typeTooLong', 'Type must be less than 50 characters');
          return null;
        }
      },
      { 
        key: 'status', 
        label: t('bulkImport.fields.status', 'Status'), 
        required: false,
        validate: (value: string) => {
          // Permissive - accept all, normalize in transformRow
          return null;
        }
      },
      { 
        key: 'siteAddress', 
        label: t('bulkImport.fields.siteAddress', 'Site Address'), 
        required: false,
        validate: (value: string) => {
          if (!value) return null;
          if (value.length > 500) return t('validation.siteAddressTooLong', 'Site address must be less than 500 characters');
          return null;
        }
      },
      { 
        key: 'installationType', 
        label: t('bulkImport.fields.installationType', 'Installation Type'), 
        required: false,
        validate: (value: string) => {
          if (!value) return null;
          if (value.length > 50) return t('validation.installationTypeTooLong', 'Installation type must be less than 50 characters');
          return null;
        }
      },
      { 
        key: 'notes', 
        label: t('bulkImport.fields.notes', 'Notes'), 
        required: false 
      },
      { 
        key: 'matricule', 
        label: t('bulkImport.fields.matricule', 'Matricule / Licence Plate'), 
        required: false,
        validate: (value: string) => {
          if (!value) return null;
          if (value.length > 100) return 'Matricule must be less than 100 characters';
          return null;
        }
      },
    ],
    transformRow: (data) => {
      const providedContactId = data.contactId ? Number(String(data.contactId).replace(/\s/g, '').replace(',', '.')) : 0;
      const contactExists = providedContactId > 0 && contactsMap.has(providedContactId);
      
      // Normalize status: accept many variations
      const rawStatus = (data.status || '').toLowerCase().trim();
      const statusMap: Record<string, string> = {
        'active': 'active', 'actif': 'active',
        'inactive': 'inactive', 'inactif': 'inactive',
        'maintenance': 'maintenance', 'en_maintenance': 'maintenance', 'en maintenance': 'maintenance',
        'decommissioned': 'decommissioned', 'hors_service': 'decommissioned', 'hors service': 'decommissioned', 'décommissionné': 'decommissioned',
      };
      const normalizedStatus = statusMap[rawStatus] || (rawStatus ? 'active' : 'active');

      return {
        name: data.name || '',
        contactId: contactExists ? providedContactId : 0,
        model: data.model,
        manufacturer: data.manufacturer,
        serialNumber: data.serialNumber,
        matricule: data.matricule,
        category: data.category,
        type: data.type,
        status: normalizedStatus,
        siteAddress: data.siteAddress,
        installationType: data.installationType,
        notes: data.notes,
      };
    },
    validateRow: (data) => {
      const errors: string[] = [];
      const warnings: string[] = [];
      
      if (!data.serialNumber) {
        warnings.push(t('validation.missingSerialNumber', 'Serial number is recommended for tracking'));
      }
      
      if (data.status === 'decommissioned' && !data.manufacturer) {
        warnings.push(t('validation.decommissionedNeedsManufacturer', 'Decommissioned installations should have manufacturer info'));
      }
      
      return { errors, warnings };
    },
  }), [isFrench, installationExampleData, contactsMap]);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => installationsApi.delete(id),
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: ['installations'] });
      // Log successful deletion
      logButtonClick('Delete Installation', { 
        entityType: 'Installation', 
        entityId: deletedId,
        details: `Deleted installation with ID: ${deletedId}`
      });
      toast({
        title: "Installation deleted",
        description: "The installation has been successfully deleted.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error deleting installation",
        description: error.response?.data?.error?.message || "An error occurred",
        variant: "destructive"
      });
    }
  });

  const installations = installationsResponse?.installations || [];

  useEffect(() => {
    document.title = "Installations — List";
  }, []);

  const handleInstallationClick = (installation: InstallationDto) => {
    navigate(`/dashboard/field/installations/${installation.id}`);
  };

  const openDeleteDialog = (installation: InstallationDto) => {
    setInstallationToDelete(installation);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (installationToDelete?.id) {
      deleteMutation.mutate(String(installationToDelete.id));
    }
    setDeleteDialogOpen(false);
    setInstallationToDelete(null);
  };

  const getInitials = (name?: string) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatLocation = (location?: { city?: string; state?: string; country?: string }) => {
    if (!location) return 'N/A';
    const parts = [location.city, location.state, location.country].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : 'N/A';
  };

  const getTypeColor = (type: string | undefined) => {
    if (type === 'internal') return "status-success";
    if (type === 'external') return "status-info";
    return "status-secondary";
  };

  const getWarrantyStatus = (warranty?: {hasWarranty: boolean; warrantyTo?: string}) => {
    if (!warranty?.hasWarranty) return { status: 'none', color: 'status-secondary', text: t('no_warranty') };
    
    if (warranty.warrantyTo) {
      const now = new Date();
      const warrantyEnd = new Date(warranty.warrantyTo);
      const daysUntilExpiry = Math.ceil((warrantyEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysUntilExpiry < 0) return { status: 'expired', color: 'status-destructive', text: t('warranty_expired') };
      if (daysUntilExpiry < 30) return { status: 'expiring', color: 'status-warning', text: `${daysUntilExpiry}d` };
      return { status: 'active', color: 'status-success', text: t('warranty_active') };
    }
    
    return { status: 'active', color: 'status-success', text: t('warranty_active') };
  };

  const filteredInstallations = useMemo(() => {
    return installations.filter(installation => {
      // Handle search - match on any available field, or show all if no search term
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm || 
        installation.name?.toLowerCase().includes(searchLower) ||
        installation.model?.toLowerCase().includes(searchLower) ||
        installation.manufacturer?.toLowerCase().includes(searchLower) ||
        installation.installationNumber?.toLowerCase().includes(searchLower) ||
        installation.siteAddress?.toLowerCase().includes(searchLower);
      
      // Use type field, fallback to installationType
      const installationType = installation.type || installation.installationType;
      const matchesType = filterType === 'all' || installationType === filterType;
      const matchesManufacturer = filterManufacturer === 'all' || installation.manufacturer === filterManufacturer;
      const matchesWarranty = filterWarranty === 'all' || 
        (filterWarranty === 'with' && installation.warranty?.hasWarranty) ||
        (filterWarranty === 'without' && !installation.warranty?.hasWarranty);
      
      // Handle stat filters - internal = no customer, external = has customer
      const isInternal = !installation.contactId || installation.contactId === 0;
      if (selectedStat === 'internal') return matchesSearch && isInternal;
      if (selectedStat === 'external') return matchesSearch && !isInternal;
      if (selectedStat === 'warranty') return matchesSearch && installation.warranty?.hasWarranty;
      
      return matchesSearch && matchesType && matchesManufacturer && matchesWarranty;
    });
  }, [installations, searchTerm, filterType, filterManufacturer, filterWarranty, selectedStat]);

  const [installPageSize, setInstallPageSize] = useState(50);
  const companyScopedInstallations = useFilteredByCompany(filteredInstallations);
  const pagination = usePaginatedData(companyScopedInstallations, installPageSize);

  const manufacturerOptions = useMemo(() => {
    return Array.from(new Set(installations.map(i => i.manufacturer).filter(Boolean)));
  }, [installations]);

  // Bulk selection helpers
  const allSelected = useMemo(() => {
    return pagination.data.length > 0 && pagination.data.every(inst => selectedIds.has(inst.id!));
  }, [pagination.data, selectedIds]);

  const someSelected = useMemo(() => {
    return selectedIds.size > 0 && !allSelected;
  }, [selectedIds, allSelected]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(pagination.data.map(inst => inst.id!)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectItem = (id: number, checked: boolean) => {
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

    for (let i = 0; i < idsToDelete.length; i++) {
      try {
        await installationsApi.delete(String(idsToDelete[i]));
      } catch (err) {
        console.error(`Failed to delete installation ${idsToDelete[i]}`, err);
      }
      setBulkDeleteProgress(Math.round(((i + 1) / idsToDelete.length) * 100));
    }

    setIsBulkDeleting(false);
    setShowBulkDeleteDialog(false);
    setSelectedIds(new Set());
    setBulkDeleteProgress(0);
    queryClient.invalidateQueries({ queryKey: ['installations'] });
    toast({ title: t('bulk.deleteSuccess') });
  };

  const statsData = [
    {
      label: t('list.total_installations'),
      value: formatStatValue(installations.length),
      icon: Package,
      color: "chart-1",
      filter: 'all'
    },
    {
      label: t('list.internal'),
      value: formatStatValue(installations.filter(i => !i.contactId || i.contactId === 0).length),
      icon: Wrench,
      color: "chart-2", 
      filter: 'internal'
    },
    {
      label: t('list.external'),
      value: formatStatValue(installations.filter(i => i.contactId && i.contactId !== 0).length),
      icon: Package,
      color: "chart-3",
      filter: 'external'
    },
    {
      label: t('list.under_warranty'),
      value: formatStatValue(installations.filter(i => i.warranty?.hasWarranty).length),
      icon: Shield,
      color: "chart-4",
      filter: 'warranty'
    }
  ];

  const handleStatClick = (stat: any) => {
    setSelectedStat(stat.filter);
    if (stat.filter === 'all') {
      setFilterType('all');
      setFilterManufacturer('all');
      setFilterWarranty('all');
    }
  };

  const handleExport = () => {
    logExport('Installations', filteredInstallations.length, { entityType: 'Installation' });
    setShowExportModal(true);
  };

  const exportConfig: ExportConfig = {
    filename: 'installations-export',
    allDataTransform: (installation: any) => ({
      'ID': installation.id,
      'Name': installation.name,
      'Model': installation.model,
      'Type': installation.type,
      'Manufacturer': installation.manufacturer,
      'Category': installation.category,
      'Serial Number': installation.serialNumber || '',
      'Matricule': installation.matricule || '',
      'Status': installation.status,
      'Has Warranty': installation.warranty?.hasWarranty ? 'Yes' : 'No',
      'Warranty From': installation.warranty?.warrantyFrom ? new Date(installation.warranty.warrantyFrom).toLocaleDateString() : 'N/A',
      'Warranty To': installation.warranty?.warrantyTo ? new Date(installation.warranty.warrantyTo).toLocaleDateString() : 'N/A',
      'Created At': installation.createdAt ? new Date(installation.createdAt).toLocaleDateString() : 'N/A',
    }),
    availableColumns: [
      { key: 'id', label: 'ID', category: 'Basic' },
      { key: 'name', label: 'Name', category: 'Basic' },
      { key: 'model', label: 'Model', category: 'Basic' },
      { key: 'type', label: 'Type', category: 'Basic' },
      { key: 'manufacturer', label: 'Manufacturer', category: 'Basic' },
      { key: 'category', label: 'Category', category: 'Basic' },
      { key: 'serialNumber', label: 'Serial Number', category: 'Basic' },
      { key: 'matricule', label: 'Matricule', category: 'Basic' },
      { key: 'status', label: 'Status', category: 'Basic' },
      { key: 'warranty.hasWarranty', label: 'Has Warranty', category: 'Warranty', transform: (value: boolean) => value ? 'Yes' : 'No' },
      { key: 'warranty.warrantyFrom', label: 'Warranty From', category: 'Warranty', transform: (date: string) => date ? new Date(date).toLocaleDateString() : 'N/A' },
      { key: 'warranty.warrantyTo', label: 'Warranty To', category: 'Warranty', transform: (date: string) => date ? new Date(date).toLocaleDateString() : 'N/A' },
      { key: 'createdAt', label: 'Created Date', category: 'Timeline', transform: (date: string) => date ? new Date(date).toLocaleDateString() : 'N/A' },
    ]
  };

  // Access denied view
  if (!permissionsLoading && !hasReadAccess) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center p-8">
        <div className="p-4 rounded-full bg-destructive/10 mb-4">
          <ShieldAlert className="h-12 w-12 text-destructive" />
        </div>
        <h2 className="text-xl font-semibold text-foreground mb-2">{t('list.accessDenied')}</h2>
        <p className="text-muted-foreground max-w-md">
          {t('list.accessDeniedDescription')}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Header - Hidden on mobile */}
      <header className="hidden md:flex items-center justify-between p-4 border-b border-border bg-card/50 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Package className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground">{t('list.title')}</h1>
            <p className="text-px-11 text-muted-foreground">{t('list.subtitle')}</p>
          </div>
        </div>
        <div>
          {hasCreateAccess && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowImportModal(true)}>
                <Upload className="mr-2 h-4 w-4" />
                {t('bulkImport.title', 'Import')}
              </Button>
              <CreateActionButton className="bg-primary text-white hover:bg-primary/90 shadow-medium hover-lift" onClick={() => navigate('/dashboard/field/installations/create')}>
                <Plus className="mr-2 h-4 w-4 text-white" />
                {t('list.add_installation')}
              </CreateActionButton>
            </div>
          )}
        </div>
      </header>

      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-border bg-card/50 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Package className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">{t('list.title')}</h1>
            <p className="text-px-10 text-muted-foreground">{t('list.subtitle')}</p>
          </div>
        </div>
        {hasCreateAccess && (
          <CreateActionButton 
            size="sm"
            className="gradient-primary text-primary-foreground shadow-medium hover-lift"
            onClick={() => navigate('/dashboard/field/installations/create')}
          >
            <Plus className="h-4 w-4" />
          </CreateActionButton>
        )}
      </div>

      {/* Stats Cards */}
      <div className="p-3 sm:p-4 border-b border-border">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
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
      <section className="p-3 sm:p-4 border-b border-border bg-card">
        {/* Mobile toolbar */}
        <div className="md:hidden flex items-center gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9 h-9"
              placeholder={t('list.search_placeholder')}
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
            {(filterType !== 'all' || filterManufacturer !== 'all' || filterWarranty !== 'all') && (
              <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-primary text-px-9 text-white flex items-center justify-center font-bold">
                {[filterType !== 'all' ? 1 : 0, filterManufacturer !== 'all' ? 1 : 0, filterWarranty !== 'all' ? 1 : 0].reduce((a, b) => a + b, 0)}
              </span>
            )}
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            className={`h-9 w-9 p-0 shrink-0 ${viewMode === 'list' ? 'bg-primary text-white hover:bg-primary/90' : ''}`}
            onClick={() => setViewMode('list')}
          >
            <List className={`h-4 w-4 ${viewMode === 'list' ? 'text-white' : ''}`} />
          </Button>
          <Button
            variant={viewMode === 'table' ? 'default' : 'outline'}
            size="sm"
            className={`h-9 w-9 p-0 shrink-0 ${viewMode === 'table' ? 'bg-primary text-white hover:bg-primary/90' : ''}`}
            onClick={() => setViewMode('table')} data-non-list-view="true"
          >
            <TableIcon className={`h-4 w-4 ${viewMode === 'table' ? 'text-white' : ''}`} />
          </Button>
        </div>

        {/* Mobile collapsible filter panel */}
        {showMobileFilters && (
          <div className="md:hidden mt-2 grid grid-cols-2 gap-2 pb-2">
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="h-9 bg-background">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent className="bg-popover border shadow-md z-50">
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="internal">Internal</SelectItem>
                <SelectItem value="external">External</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterManufacturer} onValueChange={setFilterManufacturer}>
              <SelectTrigger className="h-9 bg-background">
                <SelectValue placeholder="All Manufacturers" />
              </SelectTrigger>
              <SelectContent className="bg-popover border shadow-md z-50">
                <SelectItem value="all">All Manufacturers</SelectItem>
                {manufacturerOptions.map(m => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterWarranty} onValueChange={(v) => setFilterWarranty(v as 'all' | 'with' | 'without')}>
              <SelectTrigger className="h-9 bg-background">
                <SelectValue placeholder="All Warranty Status" />
              </SelectTrigger>
              <SelectContent className="bg-popover border shadow-md z-50">
                <SelectItem value="all">All Warranty Status</SelectItem>
                <SelectItem value="with">With Warranty</SelectItem>
                <SelectItem value="without">No Warranty</SelectItem>
              </SelectContent>
            </Select>
            {(filterType !== 'all' || filterManufacturer !== 'all' || filterWarranty !== 'all') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setFilterType('all'); setFilterManufacturer('all'); setFilterWarranty('all'); }}
                className="h-9 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}
          </div>
        )}

        {/* Desktop toolbar — unchanged */}
        <div className="hidden md:flex flex-col gap-3 sm:flex-row sm:gap-4 sm:items-center sm:justify-between">
          <div className="flex gap-2 sm:gap-3 flex-1 w-full items-center">
            <div className="flex-1">
              <CollapsibleSearch
                placeholder={t('list.search_placeholder')}
                value={searchTerm}
                onChange={setSearchTerm}
                className="w-full"
              />
            </div>
            <div className="relative">
              <Button variant="outline" size="sm" className="gap-1 sm:gap-2 px-2 sm:px-3" onClick={() => setShowFilterBar(s => !s)}>
                <Filter className="h-4 w-4" />
                <span className="hidden sm:inline">{t('list.filters')}</span>
                {(filterType !== 'all' || filterManufacturer !== 'all' || filterWarranty !== 'all') && (
                  <Badge variant="secondary" className="ml-2 h-4 px-1 text-xs">
                    {[
                      filterType !== 'all' ? 1 : 0,
                      filterManufacturer !== 'all' ? 1 : 0,
                      filterWarranty !== 'all' ? 1 : 0
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
          </div>
        </div>
      </section>

      {showFilterBar && (
        <div className="hidden md:block p-3 sm:p-4 border-b border-border bg-card">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1.5 min-w-[140px]">
              <label className="text-xs font-medium text-muted-foreground">Type</label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="h-9 bg-background">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent className="bg-popover border shadow-md z-50">
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="internal">Internal</SelectItem>
                  <SelectItem value="external">External</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5 min-w-[140px]">
              <label className="text-xs font-medium text-muted-foreground">Manufacturer</label>
              <Select value={filterManufacturer} onValueChange={setFilterManufacturer}>
                <SelectTrigger className="h-9 bg-background">
                  <SelectValue placeholder="All Manufacturers" />
                </SelectTrigger>
                <SelectContent className="bg-popover border shadow-md z-50">
                  <SelectItem value="all">All Manufacturers</SelectItem>
                  {manufacturerOptions.map(m => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5 min-w-[140px]">
              <label className="text-xs font-medium text-muted-foreground">Warranty</label>
              <Select value={filterWarranty} onValueChange={(v) => setFilterWarranty(v as 'all' | 'with' | 'without')}>
                <SelectTrigger className="h-9 bg-background">
                  <SelectValue placeholder="All Warranty Status" />
                </SelectTrigger>
                <SelectContent className="bg-popover border shadow-md z-50">
                  <SelectItem value="all">All Warranty Status</SelectItem>
                  <SelectItem value="with">With Warranty</SelectItem>
                  <SelectItem value="without">No Warranty</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(filterType !== 'all' || filterManufacturer !== 'all' || filterWarranty !== 'all') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setFilterType('all'); setFilterManufacturer('all'); setFilterWarranty('all'); }}
                className="h-9 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4 mr-1" />
                Clear
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

      {/* Pagination moved inside white card below (matches Sales style) */}

      {/* Results */}
      <div className="flex-1">
        {!isLoading && filteredInstallations.length > 0 && viewMode === 'table' ? (
          <div className="p-3 sm:p-4">

            <Card className="shadow-card">
              <CardContent className="p-0">
                {filteredInstallations.length > 0 && (
                  <SimplePaginationBar
                    startIndex={pagination.info.startIndex}
                    endIndex={pagination.info.endIndex}
                    totalItems={filteredInstallations.length}
                    currentPage={pagination.state.currentPage}
                    totalPages={pagination.info.totalPages}
                    hasPreviousPage={pagination.info.hasPreviousPage}
                    hasNextPage={pagination.info.hasNextPage}
                    onPreviousPage={pagination.actions.previousPage}
                    onNextPage={pagination.actions.nextPage}
                  />
                )}

<TableLayout
                  items={pagination.data}
                  rowKey={(installation: any) => installation.id}
                  onRowClick={handleInstallationClick}
                  tableClassName="w-full min-w-[900px]"
                  enableSelection={true}
                  selectedIds={selectedIds as unknown as Set<string | number>}
                  onSelectionChange={(ids) => setSelectedIds(ids as Set<number>)}
                  columns={[
                    {
                      key: 'installation',
                      title: t('list.table_installation'),
                      render: (installation: any) => (
                        <div className="min-w-0">
                          <p className="text-sm text-foreground truncate">{installation.name}</p>
                        </div>
                      )
                    },
                    ...(isViewAllMode() ? [{
                      key: 'company',
                      title: t('list.table_company', 'Company'),
                      render: (installation: any) => <CompanyBadge tenantId={installation.tenantId} forceShow />,
                    }] : []),
                    {
                      key: 'type',
                      title: t('list.table_type'),
                      render: (installation: any) => {
                        const customer = installation.contactId ? contactsMap.get(installation.contactId) : null;
                        return (
                          <Badge className={getTypeColor(!customer ? 'internal' : installation.type)}>
                            {!customer ? t('internal') : (installation.type === 'internal' ? t('internal') : t('external'))}
                          </Badge>
                        );
                      }
                    },
                    {
                      key: 'manufacturer',
                      title: t('manufacturer'),
                      render: (installation: any) => (
                        <p className="text-sm text-foreground">{installation.manufacturer}</p>
                      )
                    },
                    {
                      key: 'customer',
                      title: t('list.table_customer'),
                      render: (installation: any) => {
                        const customer = installation.contactId ? contactsMap.get(installation.contactId) : null;
                        return installation.contactId && installation.contactId !== 0 && customer ? (
                          <div className="min-w-0" onClick={(e) => e.stopPropagation()}>
                            <Link
                              to={`/dashboard/contacts/${customer.id}`}
                              className="flex items-center gap-1 text-primary hover:underline font-medium truncate"
                            >
                              {customer.name}
                              <ExternalLink className="h-3 w-3 flex-shrink-0" />
                            </Link>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        );
                      }
                    },
                    {
                      key: 'warranty',
                      title: t('list.table_warranty'),
                      width: 'w-28',
                      render: (installation: any) => {
                        const warrantyStatus = getWarrantyStatus(installation.warranty);
                        return (
                          <Badge className={`${warrantyStatus.color} whitespace-nowrap`}>
                            {warrantyStatus.text}
                          </Badge>
                        );
                      }
                    },
                    {
                      key: 'actions',
                      title: t('list.actions'),
                      render: (installation: any) => (
                        <div onClick={(e) => e.stopPropagation()}>
                          <TableRowActions actions={[
                            { icon: Eye, label: t('list.view_details'), onClick: (e) => { e.stopPropagation(); navigate(`/dashboard/field/installations/${installation.id}`); } },
                            { icon: Edit, label: t('list.edit'), onClick: (e) => { e.stopPropagation(); navigate(`/dashboard/field/installations/${installation.id}/edit`); }, show: hasUpdateAccess },
                            { icon: Trash2, label: t('list.delete'), onClick: (e) => { e.stopPropagation(); openDeleteDialog(installation); }, variant: 'destructive', show: hasDeleteAccess }
                          ]} />
                        </div>
                      )
                    }
                  ]}
                />
                {filteredInstallations.length > 0 && (
                  <SimplePaginationBar
                    startIndex={pagination.info.startIndex}
                    endIndex={pagination.info.endIndex}
                    totalItems={filteredInstallations.length}
                    currentPage={pagination.state.currentPage}
                    totalPages={pagination.info.totalPages}
                    hasPreviousPage={pagination.info.hasPreviousPage}
                    hasNextPage={pagination.info.hasNextPage}
                    onPreviousPage={pagination.actions.previousPage}
                    onNextPage={pagination.actions.nextPage}
                    className="border-t"
                  />
                )}

              </CardContent>
            </Card>
          </div>
        ) : !isLoading && filteredInstallations.length > 0 ? (
          <div className="p-3 sm:p-4">
            <Card className="shadow-card">
              <CardContent className="p-0 list-editorial">
                <SimplePaginationBar
                  startIndex={pagination.info.startIndex}
                  endIndex={pagination.info.endIndex}
                  totalItems={filteredInstallations.length}
                  currentPage={pagination.state.currentPage}
                  totalPages={pagination.info.totalPages}
                  hasPreviousPage={pagination.info.hasPreviousPage}
                  hasNextPage={pagination.info.hasNextPage}
                  onPreviousPage={pagination.actions.previousPage}
                  onNextPage={pagination.actions.nextPage}
                />

                {pagination.data.map((installation) => {
                  const warrantyStatus = getWarrantyStatus(installation.warranty);
                  const customer = installation.contactId ? contactsMap.get(installation.contactId) : null;
                  return (
                    <div
                      key={installation.id}
                      className="list-row-editorial"
                      onClick={() => handleInstallationClick(installation)}
                    >
                      {/* Header: icon + name + warranty status */}
                      <div className="flex items-start gap-3 mb-2.5">
                        <div className="list-row-avatar mt-0.5">
                          <Building2 className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="list-row-title flex-1">{installation.name}</p>
                            <Badge className={`${warrantyStatus.color} text-px-10 px-2 py-0.5 shrink-0`}>{warrantyStatus.text}</Badge>
                          </div>
                          <p className="list-row-subtitle">
                            {[installation.manufacturer, installation.model].filter(Boolean).join(' · ') || '—'}
                          </p>
                        </div>
                      </div>

                      {/* Details */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pl-[52px] mb-3">
                        {installation.siteAddress && (
                          <div className="list-row-meta-item">
                            <MapPin className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate max-w-[180px]">{installation.siteAddress}</span>
                          </div>
                        )}
                        {installation.installationDate && (
                          <div className="list-row-meta-item">
                            <Calendar className="h-3.5 w-3.5 shrink-0" />
                            <span>{new Date(installation.installationDate).toLocaleDateString()}</span>
                          </div>
                        )}
                        {customer && (
                          <div className="list-row-meta-item" onClick={(e) => e.stopPropagation()}>
                            <Building className="h-3.5 w-3.5 shrink-0" />
                            <Link
                              to={`/dashboard/contacts/${customer.id}`}
                              className="text-primary hover:underline truncate max-w-[140px]"
                            >
                              {customer.name}
                            </Link>
                          </div>
                        )}
                      </div>

                      {/* Footer: type badge + actions */}
                      <div className="flex items-center justify-between pl-[52px]" onClick={(e) => e.stopPropagation()}>
                        <Badge className={`${getTypeColor(!customer ? 'internal' : installation.type)} text-px-10 px-2 py-0.5`}>
                          {!customer ? t('internal') : (installation.type === 'internal' ? t('internal') : t('external'))}
                        </Badge>
                        <div className="ml-auto">
                          <TableRowActions actions={[
                            { icon: Eye, label: t('list.view_details'), onClick: (e) => { e.stopPropagation(); navigate(`/dashboard/field/installations/${installation.id}`); } },
                            { icon: Edit, label: t('list.edit'), onClick: (e) => { e.stopPropagation(); navigate(`/dashboard/field/installations/${installation.id}/edit`); }, show: hasUpdateAccess },
                            { icon: Trash2, label: t('list.delete'), onClick: (e) => { e.stopPropagation(); openDeleteDialog(installation); }, variant: 'destructive', show: hasDeleteAccess }
                          ]} />
                        </div>
                      </div>
                    </div>
                  );
                })}
                {filteredInstallations.length > 0 && (
                  <SimplePaginationBar
                    startIndex={pagination.info.startIndex}
                    endIndex={pagination.info.endIndex}
                    totalItems={filteredInstallations.length}
                    currentPage={pagination.state.currentPage}
                    totalPages={pagination.info.totalPages}
                    hasPreviousPage={pagination.info.hasPreviousPage}
                    hasNextPage={pagination.info.hasNextPage}
                    onPreviousPage={pagination.actions.previousPage}
                    onNextPage={pagination.actions.nextPage}
                    className="border-t"
                  />
                )}

              </CardContent>
            </Card>
          </div>
        ) : null}
        
        {isLoading && (
          <div className="p-6 space-y-4 animate-pulse">
            <div className="h-10 w-full bg-muted/60 rounded" />
            <div className="space-y-2">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-14 bg-muted/60 rounded w-full" />
              ))}
            </div>
          </div>
        )}

        {!isLoading && filteredInstallations.length === 0 && (
          <div className="p-3 sm:p-4 lg:p-6">
            <div className="border rounded-lg bg-card">
              <div className="py-16 px-8 text-center">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">{t('list.no_installations')}</h3>
                <p className="text-muted-foreground">
                  {t('list.no_installations_description')}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Export Modal */}
      <ExportModal 
        open={showExportModal}
        onOpenChange={setShowExportModal}
        data={filteredInstallations}
        moduleName="Installations"
        exportConfig={exportConfig}
      />

      {/* Delete Confirmation Modal */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('deleteConfirm.title')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('deleteConfirm.description')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {t('deleteConfirm.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('deleteConfirm.confirm')}
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

      {/* Import Modal */}
      <GenericImportModal
        open={showImportModal}
        onOpenChange={setShowImportModal}
        config={installationImportConfig}
        onImport={(items) => installationsApi.bulkImport({ installations: items })}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['installations'] });
        }}
        translationNamespace="installations"
      />
    </div>
  );
}
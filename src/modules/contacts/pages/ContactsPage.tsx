import { useState, useEffect, useMemo } from 'react';
import { PageSizeSelector } from '@/components/shared/PageSizeSelector';
import { TableSkeleton } from '@/components/ui/page-skeleton';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { CollapsibleSearch } from '@/components/ui/collapsible-search';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Edit2, Trash2, Star, StarOff, Upload, ChevronLeft, ChevronRight, Loader2, Building2, User, Mail, Phone, Users, Filter, List, Table as TableIcon, Lock, Map, Play } from 'lucide-react';
import { MapOverlay } from '@/components/shared/MapOverlay';
import { mapContactsToMapItems } from '@/components/shared/mappers';
import { useContacts } from '../hooks/useContacts';
import { ContactForm } from '../components/ContactForm';
import { GenericImportModal, type ImportConfig } from '@/shared/import';
import { contactsApi } from '@/services/contactsApi';
import type { Contact, ContactSearchParams } from '@/types/contacts';
import { usePermissions, PermissionGate } from '@/hooks/usePermissions';
import { useActionLogger } from '@/hooks/useActionLogger';
import { isViewAllMode } from '@/utils/tenant';
import { CompanyBadge } from '@/components/CompanyBadge';
import { CreateActionButton } from '@/components/CreateActionButton';
import { ContactsAutopilotDemo } from '../components/onboarding/ContactsAutopilotDemo';

export default function ContactsPage() {
  const { t } = useTranslation('contacts');
  const { hasPermission, canCreate: canCreatePerm, canUpdate: canUpdatePerm, canDelete: canDeletePerm, isMainAdmin: isMainAdminReal, isLoading: permissionsLoading } = usePermissions();
  const viewAll = isViewAllMode();
  const isMainAdmin = isMainAdminReal;
  const canCreate = (mod: Parameters<typeof canCreatePerm>[0]) => canCreatePerm(mod);
  const canUpdate = (mod: Parameters<typeof canUpdatePerm>[0]) => canUpdatePerm(mod);
  const canDelete = (mod: Parameters<typeof canDeletePerm>[0]) => canDeletePerm(mod);
  const { logSearch, logFilter, logButtonClick, logImport } = useActionLogger('Contacts');
  const [urlSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const typeFromUrl = urlSearchParams.get('type');

  // Parse type from URL - handle 'person' as 'individual'
  const getTypeFromUrl = (urlType: string | null): string | undefined => {
    if (urlType === 'company') return 'company';
    if (urlType === 'person' || urlType === 'individual') return 'individual';
    return undefined;
  };
  const [searchParams, setSearchParams] = useState<ContactSearchParams>({
    pageNumber: 1,
    pageSize: 50,
    sortBy: 'CreatedAt',
    sortDirection: 'desc',
    type: getTypeFromUrl(typeFromUrl)
  });

  // Update type filter and selectedStat when URL query param changes
  useEffect(() => {
    const newType = getTypeFromUrl(typeFromUrl);
    setSearchParams(prev => ({
      ...prev,
      type: newType,
      pageNumber: 1
    }));
  }, [typeFromUrl]);

  const {
    contacts,
    totalCount,
    pageNumber,
    hasNextPage,
    hasPreviousPage,
    isLoading,
    updateContact,
    deleteContact,
    bulkImport,
    refetch
  } = useContacts(searchParams);
  
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [deletingContact, setDeletingContact] = useState<Contact | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [demoOpen, setDemoOpen] = useState(false);

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [bulkDeleteProgress, setBulkDeleteProgress] = useState(0);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // Check if all items are selected
  const allSelected = useMemo(() => {
    return contacts.length > 0 && contacts.every(contact => selectedIds.has(contact.id));
  }, [contacts, selectedIds]);

  // Check if some items are selected (for indeterminate state)
  const someSelected = useMemo(() => {
    return selectedIds.size > 0 && !allSelected;
  }, [selectedIds, allSelected]);

  // Toggle all items selection
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(contacts.map(contact => contact.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  // Toggle single item selection
  const handleSelectItem = (contactId: number, checked: boolean) => {
    const newSelected = new Set(selectedIds);
    if (checked) {
      newSelected.add(contactId);
    } else {
      newSelected.delete(contactId);
    }
    setSelectedIds(newSelected);
  };

  // Bulk delete - calls delete API for each selected item
  const handleBulkDelete = async () => {
    const idsToDelete = Array.from(selectedIds);
    setIsBulkDeleting(true);
    setBulkDeleteProgress(0);

    for (let i = 0; i < idsToDelete.length; i++) {
      await deleteContact(idsToDelete[i]);
      setBulkDeleteProgress(Math.round(((i + 1) / idsToDelete.length) * 100));
    }

    setIsBulkDeleting(false);
    setShowBulkDeleteDialog(false);
    setSelectedIds(new Set());
    setBulkDeleteProgress(0);
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setSearchParams({
      ...searchParams,
      searchTerm: value,
      pageNumber: 1
    });
    if (value) {
      logSearch(value, contacts?.length || 0);
    }
  };

  const handleStatusFilter = (status: string) => {
    setSearchParams({
      ...searchParams,
      status: status === 'all' ? undefined : status as any,
      pageNumber: 1
    });
    logFilter('status', status);
  };

  const handleTypeFilter = (type: string) => {
    setSearchParams({
      ...searchParams,
      type: type === 'all' ? undefined : type as any,
      pageNumber: 1
    });
    logFilter('type', type);
  };

  const handleFavoriteFilter = (favorite: string) => {
    setSearchParams({
      ...searchParams,
      favorite: favorite === 'all' ? undefined : favorite === 'true',
      pageNumber: 1
    });
    logFilter('favorite', favorite);
  };

  const handleUpdate = async (data: any) => {
    if (!editingContact) return;
    setIsSubmitting(true);
    try {
      await updateContact(editingContact.id, data);
      setEditingContact(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingContact) return;
    try {
      await deleteContact(deletingContact.id);
      setDeletingContact(null);
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  // Contact import configuration using shared GenericImportModal
  const contactImportConfig: ImportConfig<any> = {
    entityName: 'Contacts',
    templateFilename: 'contacts-template.xlsx',
    templateSheetName: 'Contacts Template',
    requiredFields: ['name'],
    duplicateCheckFields: ['name', 'email'],
    fields: [
      {
        key: 'name',
        label: t('bulkImport.fields.name', 'Name'),
        required: true,
        validate: (value: string) => {
          if (!value || !value.trim()) return t('bulkImport.validation.nameRequired', 'Name is required');
          if (value.length > 255) return t('bulkImport.validation.nameTooLong', 'Name must be less than 255 characters');
          return null;
        }
      },
      {
        key: 'email',
        label: t('bulkImport.fields.email', 'Email'),
        required: false,
        validate: (value: string) => {
          if (!value) return null;
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return t('bulkImport.validation.invalidEmail', 'Invalid email format');
          return null;
        }
      },
      {
        key: 'phone',
        label: t('bulkImport.fields.phone', 'Phone'),
        required: false,
      },
      {
        key: 'company',
        label: t('bulkImport.fields.company', 'Company'),
        required: false,
      },
      {
        key: 'position',
        label: t('bulkImport.fields.position', 'Position'),
        required: false,
      },
      {
        key: 'type',
        label: t('bulkImport.fields.type', 'Type'),
        required: false,
        validate: (value: string) => {
          // Permissive - accept all, normalize in transformRow
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
        key: 'address',
        label: t('bulkImport.fields.address', 'Address'),
        required: false,
      },
      {
        key: 'city',
        label: t('bulkImport.fields.city', 'City'),
        required: false,
      },
      {
        key: 'country',
        label: t('bulkImport.fields.country', 'Country'),
        required: false,
      },
      {
        key: 'postalCode',
        label: t('bulkImport.fields.postalCode', 'Postal Code'),
        required: false,
      },
      {
        key: 'cin',
        label: t('bulkImport.fields.cin', 'CIN'),
        required: false,
      },
      {
        key: 'matriculeFiscale',
        label: t('bulkImport.fields.matriculeFiscale', 'Matricule Fiscale'),
        required: false,
      },
    ],
    transformRow: (data) => {
      // Normalize type: accept many variations
      const rawType = (data.type || '').toLowerCase().trim();
      const typeMap: Record<string, string> = {
        'individual': 'individual', 'individu': 'individual', 'particulier': 'individual', 'personne': 'individual', 'person': 'individual',
        'company': 'company', 'entreprise': 'company', 'société': 'company', 'societe': 'company', 'corp': 'company', 'organization': 'company', 'organisation': 'company',
        'partner': 'partner', 'partenaire': 'partner',
      };
      const normalizedType = typeMap[rawType] || (rawType ? 'individual' : 'individual');

      // Normalize status
      const rawStatus = (data.status || '').toLowerCase().trim();
      const statusMap: Record<string, string> = {
        'active': 'active', 'actif': 'active',
        'inactive': 'inactive', 'inactif': 'inactive',
        'lead': 'lead', 'prospect': 'lead',
        'customer': 'customer', 'client': 'customer',
        'partner': 'partner', 'partenaire': 'partner',
      };
      const normalizedStatus = statusMap[rawStatus] || (rawStatus ? 'active' : 'active');

      return {
        firstName: data.name?.split(' ')[0] || '',
        lastName: data.name?.split(' ').slice(1).join(' ') || '',
        name: data.name || '',
        email: data.email || '',
        phone: data.phone,
        company: data.company,
        position: data.position,
        type: normalizedType,
        status: normalizedStatus,
        address: data.address,
        city: data.city,
        country: data.country,
        postalCode: data.postalCode,
        cin: data.cin,
        matriculeFiscale: data.matriculeFiscale,
      };
    },
    validateRow: (data) => {
      const errors: string[] = [];
      const warnings: string[] = [];

      if (data.type === 'company' && !data.company) {
        warnings.push(t('bulkImport.validation.companyMissing', 'Company type contacts should have a company name'));
      }

      return { errors, warnings };
    },
    exampleData: [
      { name: 'John Doe', email: 'john@example.com', phone: '+216 12 345 678', company: 'Acme Corp', position: 'CEO', type: 'individual', status: 'active', address: '123 Main St', city: 'Tunis', country: 'Tunisia' },
      { name: 'Tech Solutions', email: 'info@techsol.com', phone: '+216 98 765 432', company: 'Tech Solutions', type: 'company', status: 'active', city: 'Sfax', country: 'Tunisia', matriculeFiscale: '1234567ABC' },
    ],
  };

  const toggleFavorite = async (contact: Contact) => {
    await updateContact(contact.id, {
      favorite: !contact.favorite
    });
    logButtonClick(contact.favorite ? 'Remove Favorite' : 'Add Favorite', { entityId: contact.id, entityType: 'Contact' });
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: 'default',
      inactive: 'secondary',
      lead: 'outline',
      customer: 'default',
      partner: 'secondary'
    };
    return colors[status] || 'default';
  };

  const [showFilters, setShowFilters] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const activeFilterCount = [searchParams.status, searchParams.favorite].filter(v => v !== undefined).length;

  // Derive selectedStat from current type filter
  const selectedStat: 'all' | 'individual' | 'company' = 
    searchParams.type === 'individual' ? 'individual' :
    searchParams.type === 'company' ? 'company' : 'all';

  // Handle stat card click - filter by type
  const handleStatClick = (type: 'all' | 'individual' | 'company') => {
    setSearchParams({
      ...searchParams,
      type: type === 'all' ? undefined : type,
      pageNumber: 1
    });
  };

  return <div className="flex flex-col">
      {/* Header - matching inventory style */}
      <div className="flex items-center justify-between gap-2 p-3 sm:p-4 border-b border-border bg-card/50 backdrop-blur">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
            <Users className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base sm:text-xl font-semibold text-foreground truncate">{t('contacts.title')}</h1>
            <p className="text-[10px] sm:text-[11px] text-muted-foreground truncate">{t('contacts.subtitle')}</p>
          </div>
        </div>
        <div className="flex gap-1.5 sm:gap-2 items-center flex-shrink-0">
          <Button variant="outline" size="sm" onClick={() => setDemoOpen(true)} className="hidden sm:inline-flex gap-1.5">
            <Play className="h-3.5 w-3.5" /> {t('contacts.watchDemo', 'Watch Demo')}
          </Button>
          {(isMainAdmin || canCreate('contacts')) && (
            <>
              <Button variant="outline" size="sm" onClick={() => setShowImportModal(true)}>
                <Upload className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">{t('contacts.import')}</span>
              </Button>
              <CreateActionButton className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-medium hover-lift" onClick={() => navigate('/dashboard/contacts/add')}>
                <Plus className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">{t('contacts.add')}</span>
              </CreateActionButton>
            </>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="p-3 sm:p-4 border-b border-border">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {/* All Contacts */}
          <Card 
            className={`shadow-card hover-lift gradient-card group cursor-pointer transition-all hover:shadow-lg ${
              selectedStat === 'all' 
                ? 'border-2 border-primary bg-primary/5' 
                : 'border-0'
            }`}
            onClick={() => handleStatClick('all')}
          >
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={`p-2 rounded-lg transition-all flex-shrink-0 ${
                    selectedStat === 'all' 
                      ? 'bg-primary/20' 
                      : 'bg-chart-1/10 group-hover:bg-chart-1/20'
                  }`}>
                    <Users className={`h-4 w-4 transition-all ${
                      selectedStat === 'all' 
                        ? 'text-primary' 
                        : 'text-chart-1'
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground font-medium truncate">{t('contacts.stats.total')}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-foreground">{totalCount === 0 ? '-' : totalCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Persons */}
          <Card 
            className={`shadow-card hover-lift gradient-card group cursor-pointer transition-all hover:shadow-lg ${
              selectedStat === 'individual' 
                ? 'border-2 border-primary bg-primary/5' 
                : 'border-0'
            }`}
            onClick={() => handleStatClick('individual')}
          >
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={`p-2 rounded-lg transition-all flex-shrink-0 ${
                    selectedStat === 'individual' 
                      ? 'bg-primary/20' 
                      : 'bg-chart-2/10 group-hover:bg-chart-2/20'
                  }`}>
                    <User className={`h-4 w-4 transition-all ${
                      selectedStat === 'individual' 
                        ? 'text-primary' 
                        : 'text-chart-2'
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground font-medium truncate">{t('contacts.stats.persons')}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-foreground">
                    {selectedStat === 'individual' ? totalCount : '-'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Companies */}
          <Card 
            className={`shadow-card hover-lift gradient-card group cursor-pointer transition-all hover:shadow-lg ${
              selectedStat === 'company' 
                ? 'border-2 border-primary bg-primary/5' 
                : 'border-0'
            }`}
            onClick={() => handleStatClick('company')}
          >
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={`p-2 rounded-lg transition-all flex-shrink-0 ${
                    selectedStat === 'company' 
                      ? 'bg-primary/20' 
                      : 'bg-chart-3/10 group-hover:bg-chart-3/20'
                  }`}>
                    <Building2 className={`h-4 w-4 transition-all ${
                      selectedStat === 'company' 
                        ? 'text-primary' 
                        : 'text-chart-3'
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground font-medium truncate">{t('contacts.stats.companies')}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-foreground">
                    {selectedStat === 'company' ? totalCount : '-'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Search and Filters - matching inventory style */}
      <div className="p-3 sm:p-4 border-b border-border bg-card">
        <div className="flex flex-col gap-3 sm:flex-row sm:gap-4 sm:items-center sm:justify-between">
          <div className="flex gap-2 sm:gap-3 flex-1 w-full">
            <CollapsibleSearch 
              placeholder={t('contacts.search_placeholder')} 
              value={searchTerm}
              onChange={handleSearch}
              className="flex-1"
            />
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-1 sm:gap-2 px-2 sm:px-3" onClick={() => setShowFilters(v => !v)}>
                <Filter className="h-4 w-4" />
                <span className="hidden sm:inline">{t('contacts.filters_label')}</span>
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="ml-2 h-4 px-1 text-xs">{activeFilterCount}</Badge>
                )}
              </Button>
              <Button 
                variant={showMap ? 'default' : 'outline'} 
                size="sm" 
                onClick={() => setShowMap(!showMap)} 
                className={`flex-1 sm:flex-none ${showMap ? 'bg-primary text-primary-foreground hover:bg-primary/90' : ''}`}
              >
                <Map className={`h-4 w-4 ${showMap ? 'text-primary-foreground' : ''}`} />
              </Button>
            </div>
          </div>
          
        </div>

        {/* Expandable Filters */}
        {showFilters && (
          <div className="mt-3 pt-3 border-t border-border">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted-foreground">{t('contacts.filters.status_label')}</label>
                <Select value={searchParams.status || 'all'} onValueChange={handleStatusFilter}>
                  <SelectTrigger className="h-9 bg-background">
                    <SelectValue placeholder={t('contacts.filters.all_statuses')} />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border shadow-md z-50">
                    <SelectItem value="all">{t('contacts.filters.all_statuses')}</SelectItem>
                    <SelectItem value="active">{t('contacts.filters.active')}</SelectItem>
                    <SelectItem value="inactive">{t('detail.status.inactive')}</SelectItem>
                    <SelectItem value="lead">{t('contacts.filters.lead')}</SelectItem>
                    <SelectItem value="customer">{t('detail.status.customer')}</SelectItem>
                    <SelectItem value="partner">{t('detail.status.partner')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted-foreground">{t('contacts.filters.type_label')}</label>
                <Select value={searchParams.type || 'all'} onValueChange={handleTypeFilter}>
                  <SelectTrigger className="h-9 bg-background">
                    <SelectValue placeholder={t('contacts.filters.all_types')} />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border shadow-md z-50">
                    <SelectItem value="all">{t('contacts.filters.all_types')}</SelectItem>
                    <SelectItem value="person">{t('detail.type.person')}</SelectItem>
                    <SelectItem value="company">{t('detail.type.company')}</SelectItem>
                    <SelectItem value="supplier">{t('detail.type.supplier')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted-foreground">{t('contacts.filters.favorites_label')}</label>
                <Select value={searchParams.favorite === undefined ? 'all' : String(searchParams.favorite)} onValueChange={handleFavoriteFilter}>
                  <SelectTrigger className="h-9 bg-background">
                    <SelectValue placeholder={t('contacts.filters.all_contacts')} />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border shadow-md z-50">
                    <SelectItem value="all">{t('contacts.filters.all_contacts')}</SelectItem>
                    <SelectItem value="true">{t('contacts.filters.favorites_only')}</SelectItem>
                    <SelectItem value="false">{t('contacts.filters.non_favorites')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}
      </div>

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
                {t('contacts.table_headers.selected_count', { count: selectedIds.size })}
              </span>
              <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())} className="text-muted-foreground">
                <span className="hidden sm:inline">{t('contacts.table_headers.deselect_all')}</span>
              </Button>
            </div>
            {(isMainAdmin || canDelete('contacts')) && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowBulkDeleteDialog(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">{t('contacts.table_headers.delete_selected')}</span>
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Pagination - Top */}
      {totalCount > 0 && (
        <div className="px-3 sm:px-4 lg:px-6">
          <PageSizeSelector
            currentPage={pageNumber}
            totalPages={Math.ceil(totalCount / searchParams.pageSize!)}
            totalItems={totalCount}
            pageSize={searchParams.pageSize!}
            startIndex={(pageNumber - 1) * searchParams.pageSize!}
            endIndex={Math.min(pageNumber * searchParams.pageSize!, totalCount)}
            onPageChange={(p) => setSearchParams({ ...searchParams, pageNumber: p })}
            onPageSizeChange={(size) => setSearchParams({ ...searchParams, pageSize: size, pageNumber: 1 })}
            hasPreviousPage={hasPreviousPage}
            hasNextPage={hasNextPage}
          />
        </div>
      )}

      {/* Table */}
      <div className="p-3 sm:p-4 lg:p-6">
        <Card className="shadow-card border-0 bg-card">
          {/* Map Section */}
          {showMap && (
            <MapOverlay
              items={mapContactsToMapItems(contacts)}
              onViewItem={(item) => navigate(`/dashboard/contacts/${item.id}`)}
              onEditItem={(item) => {
                const contact = contacts.find(c => String(c.id) === item.id);
                if (contact) setEditingContact(contact);
              }}
              onClose={() => setShowMap(false)}
              isVisible={showMap}
            />
          )}
          
          <CardContent className={showMap ? "pt-4 p-0" : "p-0"}>
        {isLoading ? <TableSkeleton rows={6} cols={5} /> : contacts.length === 0 ? <div className="text-center p-12">
            <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">{t('contacts.no_contacts')}</h3>
            <p className="text-muted-foreground">{t('contacts.no_contacts_description')}</p>
          </div> : <>
            {/* Mobile card list */}
            <div className="md:hidden divide-y divide-border/50">
              {contacts.map(contact => {
                const isSelected = selectedIds.has(contact.id);
                const initials = getInitials(contact.name);
                return (
                  <div
                    key={contact.id}
                    className={`p-4 hover:bg-muted/30 transition-colors cursor-pointer active:bg-muted/50 ${isSelected ? 'bg-primary/5' : ''}`}
                    onClick={() => navigate(`/dashboard/contacts/${contact.id}`)}
                  >
                    {/* Header: avatar + name + status */}
                    <div className="flex items-start gap-3 mb-2.5">
                      <div onClick={e => { e.stopPropagation(); handleSelectItem(contact.id, !isSelected); }}>
                        {isSelected ? (
                          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-white text-xs font-bold">{initials}</span>
                          </div>
                        ) : (
                          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-primary text-xs font-semibold">{initials}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-foreground text-sm leading-snug line-clamp-1 flex items-center gap-1.5">
                              {contact.name}
                              {contact.favorite && <Star className="h-3 w-3 fill-warning text-warning flex-shrink-0" />}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5 capitalize">
                              {contact.type === 'individual' ? t('detail.type.individual')
                                : contact.type === 'company' ? t('detail.type.company')
                                : contact.type === 'partner' ? t('detail.type.partner')
                                : contact.type === 'supplier' ? t('detail.type.supplier')
                                : t('detail.type.individual')}
                            </p>
                          </div>
                          <Badge variant={getStatusColor(contact.status || 'active') as any} className="text-[10px] px-2 py-0.5 shrink-0 capitalize">
                            {t(`detail.status.${String(contact.status || 'active').toLowerCase()}`)}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Contact details */}
                    <div className="flex flex-col gap-1.5 pl-12 mb-3">
                      {contact.email && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Mail className="h-3 w-3 shrink-0 text-muted-foreground/60" />
                          <span className="truncate">{contact.email}</span>
                        </div>
                      )}
                      {contact.phone && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Phone className="h-3 w-3 shrink-0 text-muted-foreground/60" />
                          <span>{contact.phone}</span>
                        </div>
                      )}
                    </div>

                    {/* Footer: actions */}
                    <div className="flex items-center justify-end pl-12 gap-1" onClick={e => e.stopPropagation()}>
                      {(isMainAdmin || canUpdate('contacts')) ? (
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingContact(contact)}>
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                      ) : null}
                      {(isMainAdmin || canDelete('contacts')) ? (
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeletingContact(contact)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={allSelected}
                        onCheckedChange={handleSelectAll}
                        aria-label={t('contacts.table_headers.select_all')}
                        className={someSelected ? "data-[state=checked]:bg-primary" : ""}
                      />
                    </TableHead>
                    <TableHead>{t('contacts.table_headers.contact')}</TableHead>
                    {isViewAllMode() && <TableHead>Company</TableHead>}
                    <TableHead>{t('contacts.table_headers.email')}</TableHead>
                    <TableHead>{t('contacts.table_headers.phone')}</TableHead>
                    <TableHead>{t('contacts.table_headers.type')}</TableHead>
                    <TableHead>{t('contacts.table_headers.status')}</TableHead>
                    <TableHead className="text-right">{t('contacts.table_headers.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contacts.map(contact => {
                    const isSelected = selectedIds.has(contact.id);
                    return (
                      <TableRow
                        key={contact.id}
                        className={`cursor-pointer hover:bg-muted/50 ${contact.favorite ? 'bg-warning/5' : ''} ${isSelected ? 'bg-muted/30' : ''}`}
                        onClick={() => navigate(`/dashboard/contacts/${contact.id}`)}
                      >
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) => handleSelectItem(contact.id, !!checked)}
                            aria-label={t('contacts.table_headers.select_item', { name: contact.name })}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div>
                              <div className="text-sm flex items-center gap-2">
                                {contact.name}
                                {contact.favorite && <Star className="h-4 w-4 fill-warning text-warning" />}
                              </div>
                              {contact.position && <div className="text-sm text-muted-foreground">{contact.position}</div>}
                            </div>
                          </div>
                        </TableCell>
                        {isViewAllMode() && (
                          <TableCell><CompanyBadge tenantId={(contact as any).tenantId} forceShow /></TableCell>
                        )}
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-primary" />
                            <span className="text-sm">{contact.email}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-primary" />
                            <span className="text-sm">{contact.phone || '-'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {contact.type === 'individual'
                              ? t('detail.type.individual')
                              : contact.type === 'company'
                                ? t('detail.type.company')
                                : contact.type === 'partner'
                                  ? t('detail.type.partner')
                                  : contact.type === 'supplier'
                                    ? t('detail.type.supplier')
                                    : t('detail.type.individual')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusColor(contact.status || 'active') as any} className="capitalize">
                            {t(`detail.status.${String(contact.status || 'active').toLowerCase()}`)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-2">
                            {(isMainAdmin || canUpdate('contacts')) ? (
                              <Button variant="ghost" size="sm" onClick={() => setEditingContact(contact)}>
                                <Edit2 className="h-4 w-4" />
                              </Button>
                            ) : (
                              <Button variant="ghost" size="sm" disabled className="opacity-50">
                                <Lock className="h-4 w-4" />
                              </Button>
                            )}
                            {(isMainAdmin || canDelete('contacts')) ? (
                              <Button variant="ghost" size="sm" onClick={() => setDeletingContact(contact)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            ) : null}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </>}
          </CardContent>
        </Card>
      </div>

      {/* Pagination */}
      {totalCount > 0 && (
        <div className="px-6 pb-4">
          <PageSizeSelector
            currentPage={pageNumber}
            totalPages={Math.ceil(totalCount / searchParams.pageSize!)}
            totalItems={totalCount}
            pageSize={searchParams.pageSize!}
            startIndex={(pageNumber - 1) * searchParams.pageSize!}
            endIndex={Math.min(pageNumber * searchParams.pageSize!, totalCount)}
            onPageChange={(p) => setSearchParams({ ...searchParams, pageNumber: p })}
            onPageSizeChange={(size) => setSearchParams({ ...searchParams, pageSize: size, pageNumber: 1 })}
            hasPreviousPage={hasPreviousPage}
            hasNextPage={hasNextPage}
          />
        </div>
      )}

      {/* Dialogs */}
      

      {/* Autopilot product demo */}
      <ContactsAutopilotDemo open={demoOpen} onClose={() => setDemoOpen(false)} />

      <ContactForm open={!!editingContact} onOpenChange={open => !open && setEditingContact(null)} onSubmit={handleUpdate} contact={editingContact} isLoading={isSubmitting} />

      <GenericImportModal
        open={showImportModal}
        onOpenChange={setShowImportModal}
        config={contactImportConfig}
        onImport={(items) => contactsApi.bulkImport({ contacts: items })}
        onSuccess={() => {
          refetch();
          logImport(true, 0);
        }}
        translationNamespace="contacts"
      />

      {/* Single Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingContact} onOpenChange={() => setDeletingContact(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('contacts.confirm.delete_title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('contacts.confirm.delete_description', { name: deletingContact?.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('contacts.confirm.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              {t('contacts.confirm.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={showBulkDeleteDialog} onOpenChange={(open) => !isBulkDeleting && setShowBulkDeleteDialog(open)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('contacts.confirm.bulk_delete_title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('contacts.confirm.bulk_delete_description', { count: selectedIds.size })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {isBulkDeleting && (
            <div className="py-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">{t('contacts.confirm.deleting_progress')}</span>
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
            <AlertDialogCancel disabled={isBulkDeleting}>{t('contacts.confirm.cancel')}</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleBulkDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isBulkDeleting}
            >
              {isBulkDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {isBulkDeleting ? t('contacts.confirm.deleting') : t('contacts.table_headers.delete_selected')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>;
}

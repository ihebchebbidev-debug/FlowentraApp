import { useState, useEffect, useMemo } from "react";
import { useEnforceListOnMobile } from "@/hooks/getInitialViewMode";
import { usePaginatedData } from "@/shared/hooks/usePagination";
import { formatStatValue } from "@/lib/formatters";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, Plus, Search, Filter, Building2, List, Table as TableIcon, Star, Mail, Phone, Calendar, MoreVertical, Eye, Edit, Trash2, Upload, ChevronDown, Lock, X, Send } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CollapsibleSearch } from "@/components/ui/collapsible-search";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import TableLayout from '@/components/shared/TableLayout';
import { SimplePaginationBar } from '@/components/shared/SimplePaginationBar';
import { useContactsData } from '../hooks/useContactsData';
import { contactsApi } from '@/services/contactsApi';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { usePreferences } from "@/hooks/usePreferences";
import { usePermissions } from "@/hooks/usePermissions";
import { MassEmailDialog } from './MassEmailDialog';
import { isViewAllMode } from '@/utils/tenant';
import { CompanyBadge } from '@/components/CompanyBadge';
import { CreateActionButton } from '@/components/CreateActionButton';

export function ContactsList() {
  const { t } = useTranslation('contacts');
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { preferences } = usePreferences();
  const { canCreate: canCreatePerm, canUpdate: canUpdatePerm, canDelete: canDeletePerm, isMainAdmin } = usePermissions();
  const viewAll = isViewAllMode();
  const effectiveMainAdmin = isMainAdmin;
  const canCreate = (mod: Parameters<typeof canCreatePerm>[0]) => canCreatePerm(mod);
  const canUpdate = (mod: Parameters<typeof canUpdatePerm>[0]) => canUpdatePerm(mod);
  const canDelete = (mod: Parameters<typeof canDeletePerm>[0]) => canDeletePerm(mod);
  
  // Initialize viewMode from user preferences
  const getInitialViewMode = (): 'list' | 'table' => {
    // Mobile always defaults to list view
    if (typeof window !== 'undefined' && window.innerWidth < 768) return 'list';
    try {
      const localPrefs = localStorage.getItem('user-preferences');
      if (localPrefs) {
        const prefs = JSON.parse(localPrefs);
        if (prefs.dataView === 'list') return 'list';
        if (prefs.dataView === 'table' || prefs.dataView === 'grid') return 'table';
      }
    } catch (e) {}
    return 'table';
  };
  
  const [viewMode, setViewMode] = useState<'list' | 'table'>(getInitialViewMode);
  useEnforceListOnMobile(viewMode, setViewMode, ['list', 'table'] as const);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | string>('all');
  const [filterType, setFilterType] = useState<'all' | string>('all');
  const [selectedStat, setSelectedStat] = useState<string>('all');
  const [showFilterBar, setShowFilterBar] = useState(false);
  const [filterCompany, setFilterCompany] = useState<'all' | string>('all');
  const [filterTimeframe, setFilterTimeframe] = useState('all');
  const [deleteContactId, setDeleteContactId] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [massEmailOpen, setMassEmailOpen] = useState(false);

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  // Update viewMode when preferences change
  useEffect(() => {
    if (preferences?.dataView) {
      const newMode = preferences.dataView === 'list' ? 'list' : 'table';
      setViewMode(newMode);
    }
  }, [preferences?.dataView]);

  // Read URL query parameters and set initial filter
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const typeParam = params.get('type');
    if (typeParam && (typeParam === 'company' || typeParam === 'person')) {
      setFilterType(typeParam);
      setSelectedStat(typeParam);
    }
  }, [location.search]);

  // Build search parameters for API - memoized to prevent infinite loops
  const searchParams = useMemo(() => ({
    searchTerm: searchTerm || undefined,
    status: filterStatus !== 'all' ? filterStatus : undefined,
    type: filterType !== 'all' ? filterType : undefined,
    pageSize: 100, // Load more for local filtering
  }), [searchTerm, filterStatus, filterType]);

  // Fetch contacts from API
  const { data: contacts, error, isLoading: loading, refresh } = useContactsData(searchParams);

  const handleContactClick = (contact: any) => {
    navigate(`/dashboard/contacts/${contact.id}`);
  };
  
  const handleAddContact = () => {
    navigate('/dashboard/contacts/add');
  };
  
  const handleImportContacts = () => {
    navigate('/dashboard/contacts/import');
  };

  const handleEditContact = (contactId: number) => {
    navigate(`/dashboard/contacts/edit/${contactId}`);
  };

  const handleDeleteContact = async (contactId: number) => {
    try {
      await contactsApi.deleteContact(contactId);
      toast({
        title: t('contacts.toast.deleted_title'),
        description: t('contacts.toast.deleted_description'),
      });
      refresh(); // Refresh the contacts list
    } catch (error) {
      toast({
        title: t('contacts.toast.delete_failed_title'),
        description: t('contacts.toast.delete_failed_description'),
        variant: "destructive"
      });
    }
    setDeleteContactId(null);
  };

  // Filter contacts locally for additional filtering
  const companies = contacts ? Array.from(new Set(contacts.map((c: any) => c.company).filter(Boolean))).sort() : [];
  
  const filteredContacts = contacts ? contacts.filter(contact => {
    const matchesCompany = filterCompany === 'all' || contact.company === filterCompany;
    return matchesCompany;
  }) : [];

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredContacts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredContacts.map((c: any) => c.id)));
    }
  };

  const massEmailRecipients = filteredContacts
    .filter((c: any) => selectedIds.has(c.id) && c.email)
    .map((c: any) => ({ id: c.id, name: c.name, email: c.email }));

  const pagination = usePaginatedData(filteredContacts, 20);
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Customer':
        return 'status-success';
      case 'Lead':
        return 'status-warning';
      case 'Prospect':
        return 'status-info';
      default:
        return 'status-info';
    }
  };
  const stats = [{
    label: t('contacts.stats.total'),
    value: contacts?.length || 0,
    icon: Users,
    color: "chart-1",
    filter: 'all'
  }, {
    label: t('contacts.stats.active_leads'),
    value: contacts?.filter(c => c.status === 'active').length || 0,
    icon: Users,
    color: "chart-2",
    filter: 'active'
  }, {
    label: t('contacts.stats.persons'),
    value: contacts?.filter(c => c.type === 'person' || c.type === 'individual' || !c.type).length || 0,
    icon: Users,
    color: "chart-3",
    filter: 'person'
  }, {
    label: t('contacts.stats.companies'),
    value: contacts?.filter(c => c.type === 'company' || c.type === 'organization').length || 0,
    icon: Building2,
    color: "chart-4",
    filter: 'company'
  }];

  // Show loading state
  if (loading) {
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

  // Show error state
  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-destructive mb-4">{t('contacts.failed_to_load')}</p>
          <Button onClick={() => refresh()}>{t('contacts.try_again')}</Button>
        </div>
      </div>
    );
  }

  const handleStatClick = (stat: any) => {
    setSelectedStat(stat.filter);
    if (stat.filter === 'all') {
      setFilterStatus('all');
      setFilterType('all');
    } else if (stat.filter === 'company' || stat.filter === 'person') {
      setFilterType(stat.filter);
      setFilterStatus('all');
    } else {
      setFilterStatus(stat.filter);
      setFilterType('all');
    }
  };
  
  return <div className="flex flex-col">
      {/* Header (workflow style) - Hidden on mobile */}
        <div className="hidden md:flex items-center justify-between p-4 border-b border-border bg-card/50 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Users className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground">{t('contacts.title')}</h1>
            <p className="text-px-11 text-muted-foreground">{t('contacts.subtitle')}</p>
          </div>
        </div>
        {(effectiveMainAdmin || canCreate('contacts')) && (
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleImportContacts}>
              <Upload className="mr-2 h-4 w-4" />
              {t('contacts.import')}
            </Button>
            <CreateActionButton className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-medium hover-lift" onClick={handleAddContact}>
              <Plus className="mr-2 h-4 w-4" />
              {t('contacts.add')}
            </CreateActionButton>
          </div>
        )}
      </div>

      {/* Mobile Action Bar */}
      {(effectiveMainAdmin || canCreate('contacts')) && (
        <div className="md:hidden flex items-center justify-end p-4 border-b border-border bg-card/50 backdrop-blur">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleImportContacts}>
              <Upload className="mr-2 h-4 w-4" />
              {t('contacts.import')}
            </Button>
            <CreateActionButton size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-medium hover-lift" onClick={handleAddContact}>
              <Plus className="mr-2 h-4 w-4" />
              {t('contacts.add')}
            </CreateActionButton>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="p-3 sm:p-4 border-b border-border">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {stats.map((stat, index) => {
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
      <div className="p-3 sm:p-4 border-b border-border bg-card">
        <div className="flex flex-col gap-3 sm:flex-row sm:gap-4 sm:items-center sm:justify-between">
        <div className="flex gap-2 sm:gap-3 flex-1 w-full items-center">
          <div className="flex-1">
            <CollapsibleSearch 
              placeholder={t('contacts.search_placeholder')}
              value={searchTerm} 
              onChange={setSearchTerm}
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
              <span className="hidden sm:inline">{t('contacts.filters_label')}</span>
              {(filterStatus !== 'all' || filterType !== 'all' || filterCompany !== 'all') && <Badge variant="secondary" className="ml-2 h-4 px-1 text-xs">
                  {[filterStatus !== 'all' ? 1 : 0, filterType !== 'all' ? 1 : 0, filterCompany !== 'all' ? 1 : 0].reduce((a, b) => a + b, 0)}
                </Badge>}
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
      </div>

      {/* Slide-down Filter Bar */}
      {showFilterBar && (
        <div className="p-3 sm:p-4 border-b border-border bg-card">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1.5 min-w-[140px]">
              <label className="text-xs font-medium text-muted-foreground">{t('contacts.filters.all_statuses')}</label>
              <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v)}>
                <SelectTrigger className="h-9 bg-background">
                  <SelectValue placeholder={t('contacts.filters.all_statuses')} />
                </SelectTrigger>
                <SelectContent className="bg-popover border shadow-md z-50">
                  <SelectItem value="all">{t('contacts.filters.all_statuses')}</SelectItem>
                  <SelectItem value="active">{t('contacts.filters.active')}</SelectItem>
                  <SelectItem value="lead">{t('contacts.filters.lead')}</SelectItem>
                  <SelectItem value="prospect">{t('contacts.filters.prospect')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5 min-w-[140px]">
              <label className="text-xs font-medium text-muted-foreground">{t('contacts.filters.all_types')}</label>
              <Select value={filterType} onValueChange={(v) => setFilterType(v)}>
                <SelectTrigger className="h-9 bg-background">
                  <SelectValue placeholder={t('contacts.filters.all_types')} />
                </SelectTrigger>
                <SelectContent className="bg-popover border shadow-md z-50">
                  <SelectItem value="all">{t('contacts.filters.all_types')}</SelectItem>
                  <SelectItem value="person">{t('contacts.filters.person')}</SelectItem>
                  <SelectItem value="company">{t('contacts.filters.company')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5 min-w-[140px]">
              <label className="text-xs font-medium text-muted-foreground">{t('contacts.filters.all_companies')}</label>
              <Select value={filterCompany} onValueChange={setFilterCompany}>
                <SelectTrigger className="h-9 bg-background">
                  <SelectValue placeholder={t('contacts.filters.all_companies')} />
                </SelectTrigger>
                <SelectContent className="bg-popover border shadow-md z-50">
                  <SelectItem value="all">{t('contacts.filters.all_companies')}</SelectItem>
                  {companies.map((c: string) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5 min-w-[140px]">
              <label className="text-xs font-medium text-muted-foreground">{t('contacts.filters.any_time')}</label>
              <Select value={filterTimeframe} onValueChange={(v) => setFilterTimeframe(v)}>
                <SelectTrigger className="h-9 bg-background">
                  <SelectValue placeholder={t('contacts.filters.any_time')} />
                </SelectTrigger>
                <SelectContent className="bg-popover border shadow-md z-50">
                  <SelectItem value="all">{t('contacts.filters.any_time')}</SelectItem>
                  <SelectItem value="7d">{t('contacts.filters.last_7_days')}</SelectItem>
                  <SelectItem value="30d">{t('contacts.filters.last_30_days')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(filterStatus !== 'all' || filterType !== 'all' || filterCompany !== 'all' || filterTimeframe !== 'all') && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => { setFilterStatus('all'); setFilterType('all'); setFilterCompany('all'); setFilterTimeframe('all'); }}
                className="h-9 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4 mr-1" />
                {t('contacts.clear')}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Selection Action Bar */}
      {selectedIds.size > 0 && (
        <div className="p-3 sm:p-4 border-b border-primary/20 bg-primary/5 animate-in slide-in-from-top-1 duration-200">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Checkbox
                checked={selectedIds.size === filteredContacts.length && filteredContacts.length > 0}
                onCheckedChange={toggleSelectAll}
              />
              <span className="text-sm font-medium">
                {selectedIds.size} {selectedIds.size === 1 ? 'contact' : 'contacts'} selected
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                className="gap-2"
                onClick={() => setMassEmailOpen(true)}
                disabled={massEmailRecipients.length === 0}
              >
                <Send className="h-4 w-4" />
                <span className="hidden sm:inline">Send Mass Email</span>
                <span className="sm:hidden">Email</span>
                <Badge variant="secondary" className="text-px-10 ml-1">{massEmailRecipients.length}</Badge>
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {filteredContacts.length === 0 ? (
        <div className="p-12 text-center">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">{t('contacts.no_contacts')}</h3>
          <p className="text-muted-foreground mb-4">
            {t('contacts.no_contacts_description')}
          </p>
          <CreateActionButton onClick={handleAddContact}>
            <Plus className="h-4 w-4 mr-2" />
            {t('contacts.add')}
          </CreateActionButton>
        </div>
      ) : viewMode === 'list' ? <div className="p-3 sm:p-4 lg:p-6">
        <Card className="shadow-card border-0 bg-card text-rem-85">
          
          <CardContent className="p-0">
            <SimplePaginationBar
              startIndex={pagination.info.startIndex}
              endIndex={pagination.info.endIndex}
              totalItems={filteredContacts.length}
              currentPage={pagination.state.currentPage}
              totalPages={pagination.info.totalPages}
              hasPreviousPage={pagination.info.hasPreviousPage}
              hasNextPage={pagination.info.hasNextPage}
              onPreviousPage={pagination.actions.previousPage}
              onNextPage={pagination.actions.nextPage}
            />
            <div className="divide-y divide-border">
              {pagination.data.map(contact => <div key={contact.id} className="p-3 sm:p-4 lg:p-6 hover:bg-muted/50 transition-colors group cursor-pointer flex items-start gap-3" onClick={() => handleContactClick(contact)}>
                  <div className="pt-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedIds.has(contact.id)}
                      onCheckedChange={() => toggleSelect(contact.id)}
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                    <div className="flex items-start sm:items-center gap-3 sm:gap-4 flex-1 min-w-0">
                      <Avatar className="h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0">
                        <AvatarFallback className="text-xs sm:text-sm bg-primary/10 text-primary">
                          {contact.type === 'company' ? <Building2 className="h-4 w-4 sm:h-6 sm:w-6" /> : getInitials(contact.name)}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                          <div className="flex items-center gap-2">
                            <h3 className="list-row-title break-words line-clamp-2">{contact.name}</h3>
                            {contact.favorite && <Star className="h-3 w-3 sm:h-4 sm:w-4 text-warning fill-warning flex-shrink-0" />}
                          </div>
                          <Badge className={`${getStatusColor(contact.status)} text-xs`}>{contact.status}</Badge>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-px-10 text-muted-foreground mb-2">
                          <span className="break-words line-clamp-1">{contact.position} at {contact.company}</span>
                          {contact.type === 'company' && contact.tags?.length && (
                            <span className="text-px-10">
                              {contact.tags.length} tags
                            </span>
                          )}
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-px-10 text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{contact.email}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{contact.phone}</span>
                          </div>
                          <div className="hidden sm:flex items-center gap-1">
                            <Calendar className="h-3 w-3 flex-shrink-0" />
                            <span>Last: {contact.lastContactDate ? new Date(contact.lastContactDate).toLocaleDateString() : 'Never'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between sm:justify-end gap-2 mt-2 sm:mt-0">
                      <div className="flex gap-1 flex-wrap flex-1 sm:flex-none">
                        {contact.tags?.slice(0, 1).map((tag: any, index: number) => (
                          <Badge key={index} variant="outline" className="text-xs px-1.5 py-0.5">
                            {typeof tag === 'string' ? tag : tag.name}
                          </Badge>
                        ))}
                        {(contact.tags?.length || 0) > 1 && (
                          <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                            +{contact.tags.length - 1}
                          </Badge>
                        )}
                      </div>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={e => e.stopPropagation()}>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem className="gap-2" onClick={() => handleContactClick(contact)}>
                            <Eye className="h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          {(effectiveMainAdmin || canUpdate('contacts')) && (
                            <DropdownMenuItem className="gap-2" onClick={() => handleEditContact(contact.id)}>
                              <Edit className="h-4 w-4" />
                              Edit Contact
                            </DropdownMenuItem>
                          )}
                          {(effectiveMainAdmin || canDelete('contacts')) && (
                            <DropdownMenuItem className="gap-2 text-destructive" onClick={() => setDeleteContactId(contact.id)}>
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>)}
            </div>
            {filteredContacts.length > 5 && (
              <div className="p-4 border-t border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-muted-foreground">
                      Showing {pagination.info.startIndex + 1} to {pagination.info.endIndex} of {filteredContacts.length} results
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
    </div> : <div className="p-3 sm:p-4 lg:p-6">
      <Card className="shadow-card border-0 bg-card text-rem-95">
          
            <CardContent className="p-0">
              <div className="overflow-x-auto w-full scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent"
                   style={{ WebkitOverflowScrolling: 'touch' }}>
                {/* TableLayout - keeps structure identical to OffersList */}
                {/* columns preserve widths and renderers from previous implementation */}
                {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
                {/* @ts-ignore */}
                <TableLayout
                  items={pagination.data}
                  rowKey={(c: any) => c.id}
                  onRowClick={handleContactClick}
                  enablePagination={true}
                  itemsPerPage={20}
                  currentPage={pagination.state.currentPage}
                  onPageChange={pagination.actions.goToPage}
                  totalItems={filteredContacts.length}
                  columns={[
                    {
                      key: 'select',
                      title: '',
                      width: 'w-[40px]',
                      render: (contact: any) => (
                        <div onClick={e => e.stopPropagation()}>
                          <Checkbox
                            checked={selectedIds.has(contact.id)}
                            onCheckedChange={() => toggleSelect(contact.id)}
                          />
                        </div>
                      )
                    },
                    ...(isViewAllMode() ? [{
                      key: 'company_tenant',
                      title: 'Company',
                      width: 'w-[140px]',
                      render: (contact: any) => <CompanyBadge tenantId={contact.tenantId} forceShow />,
                    }] : []),
                    {
                      key: 'contact',
                      title: 'Contact',
                      width: 'w-[200px]',
                      render: (contact: any) => (
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 flex-shrink-0">
                            <AvatarFallback className="text-sm bg-primary/10 text-primary">
                              {contact.type === 'company' ? <Building2 className="h-5 w-5" /> : getInitials(contact.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-foreground break-words line-clamp-2">{contact.name}</p>
                              {contact.favorite && <Star className="h-4 w-4 text-warning fill-warning flex-shrink-0" />}
                            </div>
                            <p className="text-sm text-muted-foreground">{contact.type}</p>
                          </div>
                        </div>
                      )
                    },
                    {
                      key: 'email',
                      title: 'Email',
                      render: (contact: any) => (
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-3 w-3 text-muted-foreground" />
                          <span className="truncate">{contact.email || '-'}</span>
                        </div>
                      )
                    },
                    {
                      key: 'phone',
                      title: 'Phone',
                      render: (contact: any) => (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          <span className="truncate">{contact.phone || '-'}</span>
                        </div>
                      )
                    },
                    {
                      key: 'status',
                      title: 'Status',
                      render: (contact: any) => <Badge className={`${getStatusColor(contact.status)} text-xs`}>{contact.status}</Badge>
                    },
                    {
                      key: 'tags',
                      title: 'Tags',
                      render: (contact: any) => (
                        <div className="flex gap-1 flex-wrap">
                          {contact.tags.slice(0, 2).map((tag: any, index: number) => (
                            <Badge key={index} variant="outline" className="text-xs px-1.5 py-0.5">
                              {typeof tag === 'string' ? tag : tag.name}
                            </Badge>
                          ))}
                          {contact.tags.length > 2 && <Badge variant="outline" className="text-xs px-1.5 py-0.5">+{contact.tags.length - 2}</Badge>}
                        </div>
                      )
                    },
                    {
                      key: 'userGroups',
                      title: 'User groups',
                      render: (contact: any) => {
                        const groups = contact.userGroups ?? [];
                        if (groups.length === 0) {
                          return <span className="text-xs text-muted-foreground">—</span>;
                        }
                        return (
                          <div className="flex gap-1 flex-wrap">
                            {groups.slice(0, 2).map((g: any) => (
                              <Badge key={g.id} variant="secondary" className="text-xs px-1.5 py-0.5">
                                {g.name}
                              </Badge>
                            ))}
                            {groups.length > 2 && (
                              <Badge variant="secondary" className="text-xs px-1.5 py-0.5" title={groups.map((g: any) => g.name).join(', ')}>
                                +{groups.length - 2}
                              </Badge>
                            )}
                          </div>
                        );
                      }
                    },
                    {

                      key: 'lastContact',
                      title: 'Last Contact',
                      render: (contact: any) => (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>{contact.lastContact}</span>
                        </div>
                      )
                    },
                    {
                      key: 'actions',
                      title: '',
                      width: 'w-[50px]',
                      render: (contact: any) => (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={(e:any) => e.stopPropagation()}>
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem className="gap-2" onClick={(e:any) => { e.stopPropagation(); handleContactClick(contact); }}>
                              <Eye className="h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2" onClick={(e:any) => e.stopPropagation()}>
                              <Edit className="h-4 w-4" />
                              Edit Contact
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2 text-destructive" onClick={(e:any) => e.stopPropagation()}>
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )
                    }
                  ]}
                />
                </div>
            </CardContent>
          </Card>
        </div>}
        
        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteContactId !== null} onOpenChange={() => setDeleteContactId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Contact</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this contact? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => deleteContactId && handleDeleteContact(deleteContactId)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Mass Email Dialog */}
        <MassEmailDialog
          open={massEmailOpen}
          onOpenChange={setMassEmailOpen}
          recipients={massEmailRecipients}
        />
    </div>;
}
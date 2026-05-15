import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { WebsiteSite } from '../types';
import { getStorageProvider, initApiProviders } from '../services/storageProvider';
import { SITE_TEMPLATES } from '../utils/siteTemplates';
import { SiteGridCard, SiteListItem, SiteTableView } from './SiteCards';
import { TemplateGalleryPage } from './TemplateGalleryPage';
import { Button } from '@/components/ui/button';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CollapsibleSearch } from '@/components/ui/collapsible-search';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Plus, Globe, Filter, X,
  List, Table, FileText, Eye, LayoutGrid, Search, Loader2,
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';


interface SiteManagerProps {
  onEditSite: (site: WebsiteSite) => void;
}

type ViewMode = 'grid' | 'list' | 'table';
type FilterStatus = 'all' | 'published' | 'draft';
type SortBy = 'updated' | 'name' | 'pages' | 'created';

export function SiteManager({ onEditSite }: SiteManagerProps) {
  const { t } = useTranslation();
  const [sites, setSites] = useState<WebsiteSite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [sortBy, setSortBy] = useState<SortBy>('updated');
  const [showFilters, setShowFilters] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<WebsiteSite | null>(null);
  const [selectedStat, setSelectedStat] = useState<string>('all');

  const loadSitesFromProvider = useCallback(async () => {
    setIsLoading(true);
    try {
      // Ensure API providers are initialized before loading
      await initApiProviders();
      const provider = getStorageProvider();
      const result = await provider.listSites({ sortBy: 'updatedAt', sortOrder: 'desc' });
      if (result.success && result.data) {
        setSites(result.data);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSitesFromProvider();
  }, [loadSitesFromProvider]);

  const creatingRef = React.useRef(false);

  const handleCreateFromGallery = async (templateId: string, siteName: string) => {
    if (creatingRef.current) return;
    creatingRef.current = true;
    try {
      const tmpl = SITE_TEMPLATES.find(t => t.id === templateId);
      const provider = getStorageProvider();
      
      const pages = tmpl?.pages();
      
      const result = await provider.createSite({
        name: siteName,
        theme: tmpl?.theme,
        pages,
        defaultLanguage: 'en',
        languages: tmpl?.languages,
      });
      await loadSitesFromProvider();
      setShowCreate(false);
      if (result.success && result.data) {
        toast.success(
          tmpl
            ? t('wb:manager.siteCreatedFromTemplate', { name: siteName, template: tmpl.name })
            : t('wb:manager.siteCreated', { name: siteName })
        );
        onEditSite(result.data);
      } else {
        toast.error(result.error || t('wb:common.failedToCreate'));
      }
    } finally {
      creatingRef.current = false;
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const provider = getStorageProvider();
      const result = await provider.deleteSite(deleteTarget.id);
      if (!result.success) {
        toast.error(result.error || t('wb:common.failedToDelete'));
        setDeleteTarget(null);
        return;
      }
      await loadSitesFromProvider();
      setDeleteTarget(null);
      toast.success(t('wb:common.siteDeleted'));
    } catch (err: any) {
      toast.error(err?.message || t('wb:common.failedToDelete'));
      setDeleteTarget(null);
    }
  };

  // Stats
  const stats = useMemo(() => {
    const published = sites.filter(s => s.published).length;
    const drafts = sites.filter(s => !s.published).length;
    const totalPages = sites.reduce((sum, s) => sum + s.pages.length, 0);
    return [
      { label: t('wb:manager.totalSites'), value: sites.length, icon: Globe, color: 'text-primary', bgColor: 'bg-primary/10', filter: 'all' },
      { label: t('wb:common.published'), value: published, icon: Eye, color: 'text-green-600', bgColor: 'bg-green-100', filter: 'published' },
      { label: t('wb:common.draft'), value: drafts, icon: FileText, color: 'text-amber-600', bgColor: 'bg-amber-100', filter: 'draft' },
      { label: t('wb:manager.totalPages'), value: totalPages, icon: LayoutGrid, color: 'text-blue-600', bgColor: 'bg-blue-100', filter: 'pages' },
    ];
  }, [sites, t]);

  // Filter & sort
  const filteredSites = useMemo(() => {
    let result = [...sites];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(s =>
        s.name.toLowerCase().includes(term) ||
        s.slug.toLowerCase().includes(term) ||
        s.description?.toLowerCase().includes(term)
      );
    }

    const statusFilter = selectedStat === 'published' ? 'published' : selectedStat === 'draft' ? 'draft' : filterStatus;
    if (statusFilter === 'published') result = result.filter(s => s.published);
    if (statusFilter === 'draft') result = result.filter(s => !s.published);

    result.sort((a, b) => {
      switch (sortBy) {
        case 'name': return a.name.localeCompare(b.name);
        case 'pages': return b.pages.length - a.pages.length;
        case 'created': return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        default: return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
    });

    return result;
  }, [sites, searchTerm, filterStatus, sortBy, selectedStat]);

  const activeFilterCount = (filterStatus !== 'all' ? 1 : 0) + (sortBy !== 'updated' ? 1 : 0);

  const handleStatClick = (filter: string) => {
    setSelectedStat(prev => prev === filter ? 'all' : filter);
    if (filter === 'published') setFilterStatus('published');
    else if (filter === 'draft') setFilterStatus('draft');
    else setFilterStatus('all');
  };

  const handleClearFilters = () => {
    setFilterStatus('all');
    setSortBy('updated');
    setSelectedStat('all');
    setSearchTerm('');
  };

  if (showCreate) {
    return (
      <TemplateGalleryPage
        onSelect={handleCreateFromGallery}
        onBack={() => setShowCreate(false)}
      />
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-card/50 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Globe className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground">{t('wb:common.websiteBuilder')}</h1>
            <p className="text-[11px] text-muted-foreground">{t('wb:common.subtitle')}</p>
          </div>
        </div>
        <Button className="bg-primary text-white hover:bg-primary/90 shadow-md" onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">{t('wb:common.newSite')}</span>
        </Button>
      </div>

      {/* Stats */}
      <div className="p-3 sm:p-4 border-b border-border">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {isLoading ? (
            <>
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="shadow-sm border">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <Skeleton className="h-8 w-8 rounded-lg" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                      <Skeleton className="h-5 w-6" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </>
          ) : (
            stats.map((stat, i) => {
              const isSelected = selectedStat === stat.filter;
              return (
                <Card
                  key={i}
                  className={`shadow-sm hover:shadow-md cursor-pointer transition-all ${
                    isSelected ? 'border-2 border-primary bg-primary/5' : 'border'
                  }`}
                  onClick={() => handleStatClick(stat.filter)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={`p-2 rounded-lg ${isSelected ? 'bg-primary/20' : stat.bgColor}`}>
                          <stat.icon className={`h-4 w-4 ${isSelected ? 'text-primary' : stat.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground font-medium truncate">{stat.label}</p>
                        </div>
                      </div>
                      <p className="text-sm font-bold text-foreground">{stat.value}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="p-3 sm:p-4 border-b border-border bg-card">
        <div className="flex flex-col gap-3 sm:flex-row sm:gap-4 sm:items-center sm:justify-between">
          <div className="flex gap-2 sm:gap-3 flex-1 w-full">
            <CollapsibleSearch
              placeholder={t('wb:manager.searchPlaceholder')}
              value={searchTerm}
              onChange={setSearchTerm}
              className="flex-1"
            />
            <Button
              variant={showFilters ? 'default' : 'outline'}
              size="sm"
              className="gap-1 sm:gap-2 px-2 sm:px-3"
              onClick={() => setShowFilters(v => !v)}
            >
              <Filter className="h-4 w-4" />
              <span className="hidden sm:inline">{t('wb:common.filters')}</span>
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs rounded-full">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className={`flex-1 sm:flex-none ${viewMode === 'grid' ? 'bg-primary text-primary-foreground hover:bg-primary/90' : ''}`}
            >
              <LayoutGrid className={`h-4 w-4 ${viewMode === 'grid' ? 'text-primary-foreground' : ''}`} />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
              className={`flex-1 sm:flex-none ${viewMode === 'list' ? 'bg-primary text-primary-foreground hover:bg-primary/90' : ''}`}
            >
              <List className={`h-4 w-4 ${viewMode === 'list' ? 'text-primary-foreground' : ''}`} />
            </Button>
            <Button
              variant={viewMode === 'table' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('table')}
              className={`flex-1 sm:flex-none ${viewMode === 'table' ? 'bg-primary text-primary-foreground hover:bg-primary/90' : ''}`}
            >
              <Table className={`h-4 w-4 ${viewMode === 'table' ? 'text-primary-foreground' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="mt-3 pt-3 border-t border-border">
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex flex-col gap-1.5 min-w-[140px]">
                <label className="text-xs font-medium text-muted-foreground">{t('wb:manager.statusLabel')}</label>
                <Select value={filterStatus} onValueChange={(v) => { setFilterStatus(v as FilterStatus); setSelectedStat(v); }}>
                  <SelectTrigger className="h-9 bg-background">
                    <SelectValue placeholder={t('wb:manager.all')} />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border shadow-md z-50">
                    <SelectItem value="all">{t('wb:manager.all')}</SelectItem>
                    <SelectItem value="published">{t('wb:common.published')}</SelectItem>
                    <SelectItem value="draft">{t('wb:common.draft')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5 min-w-[140px]">
                <label className="text-xs font-medium text-muted-foreground">{t('wb:manager.sortByLabel')}</label>
                <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortBy)}>
                  <SelectTrigger className="h-9 bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border shadow-md z-50">
                    <SelectItem value="updated">{t('wb:manager.lastUpdated')}</SelectItem>
                    <SelectItem value="name">{t('wb:manager.name')}</SelectItem>
                    <SelectItem value="pages">{t('wb:manager.pageCount')}</SelectItem>
                    <SelectItem value="created">{t('wb:manager.dateCreated')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {activeFilterCount > 0 && (
                <Button variant="ghost" size="sm" onClick={handleClearFilters} className="h-9 text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4 mr-1" />
                  {t('wb:common.clearFilters')}
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto p-3 sm:p-4 bg-background">
        {isLoading ? (
          viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="h-32 w-full" />
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-5 w-16 rounded-full" />
                    </div>
                    <Skeleton className="h-4 w-full" />
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : viewMode === 'list' ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Card key={i} className="p-4">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-40" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <Skeleton className="h-8 w-20" />
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-4 pb-3 border-b">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-28" />
                </div>
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center gap-4 py-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                ))}
              </div>
            </Card>
          )
        ) : sites.length === 0 ? (
          <Card className="shadow-card border-0">
            <CardContent className="text-center py-12">
              <Globe className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">{t('wb:manager.noWebsitesYet')}</h3>
              <p className="text-muted-foreground">{t('wb:manager.noWebsitesDesc')}</p>
            </CardContent>
          </Card>
        ) : filteredSites.length === 0 ? (
          <div className="text-center py-16">
            <Search className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
            <h3 className="text-base font-medium mb-1">{t('wb:manager.noMatchingSites')}</h3>
            <p className="text-sm text-muted-foreground mb-4">{t('wb:manager.noMatchingDesc')}</p>
            <Button variant="outline" size="sm" onClick={handleClearFilters}>{t('wb:common.clearFilters')}</Button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSites.map(site => (
              <SiteGridCard key={site.id} site={site} onEdit={onEditSite} onDelete={setDeleteTarget} />
            ))}
          </div>
        ) : viewMode === 'list' ? (
          <div className="space-y-2">
            {filteredSites.map(site => (
              <SiteListItem key={site.id} site={site} onEdit={onEditSite} onDelete={setDeleteTarget} />
            ))}
          </div>
        ) : (
          <SiteTableView sites={filteredSites} onEdit={onEditSite} onDelete={setDeleteTarget} />
        )}
      </div>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('wb:manager.deleteSiteTitle')} "{deleteTarget?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              {t('wb:manager.deleteSiteDesc', { name: deleteTarget?.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('wb:common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t('wb:common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Sub-components extracted to SiteCards.tsx

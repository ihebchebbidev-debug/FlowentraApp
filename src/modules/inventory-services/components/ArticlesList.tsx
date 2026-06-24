import { useState, useEffect } from "react";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { Plus, Search, Filter, Package, AlertTriangle, CheckCircle, List, Grid, DollarSign, Clock, Warehouse, MoreVertical, Eye, Edit, Trash2, ChevronDown, Loader2, Lock, ShieldAlert, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatStatValue } from "@/lib/formatters";
import { CollapsibleSearch } from "@/components/ui/collapsible-search";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslation } from "react-i18next";
import { articlesApi } from "@/services/api/articlesApi";
import { articleCategoriesApi, locationsApi } from "@/services/api/lookupsApi";
import { usePermissions } from "@/hooks/usePermissions";
import { TableRowActions } from '@/shared/components/TableRowActions';
import { isViewAllMode } from '@/utils/tenant';
import { CompanyBadge } from '@/components/CompanyBadge';

import articleStatuses from '@/data/mock/article-statuses.json';
import { CreateActionButton } from '@/components/CreateActionButton';
import { getInitialViewMode } from '@/hooks/getInitialViewMode';

const getStatusColor = (status: string) => {
  switch (status) {
    case "available":
      return "status-success";
    case "low_stock":
      return "status-warning";
    case "out_of_stock":
      return "status-error";
    default:
      return "status-info";
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case "available":
      return CheckCircle;
    case "low_stock":
    case "out_of_stock":
      return AlertTriangle;
    default:
      return Package;
  }
};

export function ArticlesList() {
  const { t } = useTranslation('articles');
  const navigate = useNavigate();
  const { canCreate, canRead, canUpdate, canDelete, isLoading: permissionsLoading, isMainAdmin } = usePermissions();
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilterBar, setShowFilterBar] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | string>('all');
  const [filterCategory, setFilterCategory] = useState<'all' | string>('all');
  const [filterLocation, setFilterLocation] = useState<'all' | string>('all');
  const [filterSupplier, setFilterSupplier] = useState<'all' | string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => getInitialViewMode(['grid', 'list'] as const, 'grid'));
  
  // Permission checks (disabled in view-all mode)
  const viewAll = isViewAllMode();
  const hasReadAccess = isMainAdmin || canRead('articles');
  const hasCreateAccess = isMainAdmin || canCreate('articles');
  const hasUpdateAccess = isMainAdmin || canUpdate('articles');
  const hasDeleteAccess = isMainAdmin || canDelete('articles');
  
  // Real data from API
  const [articles, setArticles] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load articles and lookups from API
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [articlesRes, categoriesRes, locationsRes] = await Promise.all([
          articlesApi.getAll(),
          articleCategoriesApi.getAll(),
          locationsApi.getAll()
        ]);
        
        // Map articles with category and location names from lookups
        const categoryMap = new Map((categoriesRes.items || []).map((c: any) => [String(c.id), c.name]));
        const locationMap = new Map((locationsRes.items || []).map((l: any) => [String(l.id), l.name]));
        
        // Handle different response shapes from API
        const articlesArray = Array.isArray(articlesRes) 
          ? articlesRes 
          : (articlesRes as any).data || (articlesRes as any).items || [];
        
        const mappedArticles = articlesArray.map((article: any) => ({
          ...article,
          category: categoryMap.get(String(article.categoryId)) || article.category || 'Uncategorized',
          location: locationMap.get(String(article.locationId)) || article.location || 'No location'
        }));
        
        setArticles(mappedArticles);
        setCategories(categoriesRes.items || []);
        setLocations(locationsRes.items || []);
      } catch (error) {
        console.error('Failed to load articles:', error);
        setArticles([]);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const handleArticleClick = (article: any) => {
    navigate(`/dashboard/articles/${article.id}`);
  };

  const handleAddArticle = () => {
    navigate('/dashboard/articles/add');
  };

  const filteredArticles = articles.filter(article => {
    const matchesSearch = (article.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (article.sku || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (article.category || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || article.status === filterStatus;
    const matchesCategory = filterCategory === 'all' || article.category === filterCategory;
    const matchesLocation = filterLocation === 'all' || article.location === filterLocation;
    const matchesSupplier = filterSupplier === 'all' || article.supplier === filterSupplier;
    return matchesSearch && matchesStatus && matchesCategory && matchesLocation && matchesSupplier;
  });

  const categoryNames = Array.from(new Set(articles.map(a => a.category))).filter(Boolean);
  const locationNames = Array.from(new Set(articles.map(a => a.location))).filter(Boolean);
  const suppliers = Array.from(new Set(articles.map(a => a.supplier))).filter(Boolean);

  const stats = [
    { 
      label: t('stats.total_articles'), 
      value: articles.length, 
      change: "+12%", 
      icon: Package, 
      color: "chart-1" 
    },
    { 
      label: t('stats.available'), 
      value: articles.filter(a => a.status === "available").length, 
      change: "+8%", 
      icon: CheckCircle, 
      color: "chart-2" 
    },
    { 
      label: t('stats.low_stock'), 
      value: articles.filter(a => a.status === "low_stock").length, 
      change: "+3%", 
      icon: AlertTriangle, 
      color: "chart-3" 
    },
    { 
      label: t('stats.total_value'), 
      value: `${articles.reduce((sum, a) => sum + ((a.stock || 0) * (a.sellPrice || 0)), 0).toLocaleString()} TND`, 
      change: "+15%", 
      icon: DollarSign, 
      color: "chart-4" 
    },
  ];

  // Access denied view
  if (!permissionsLoading && !hasReadAccess) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center p-8">
        <div className="p-4 rounded-full bg-destructive/10 mb-4">
          <ShieldAlert className="h-12 w-12 text-destructive" />
        </div>
        <h2 className="text-xl font-semibold text-foreground mb-2">Access Denied</h2>
        <p className="text-muted-foreground max-w-md">
          You don't have permission to view articles. Please contact your administrator.
        </p>
      </div>
    );
  }

  const Header = () => (
    <>
      {/* Desktop Header */}
      <div className="hidden md:flex items-center justify-between p-4 border-b border-border bg-card/50 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Package className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground">{t('title')}</h1>
            <p className="text-[11px] text-muted-foreground">{t('subtitle')}</p>
          </div>
        </div>
        <div>
            {hasCreateAccess && (
            <CreateActionButton 
              className="gradient-primary text-primary-foreground shadow-medium hover-lift w-full sm:w-auto"
              onClick={handleAddArticle}
            >
              <Plus className="mr-2 h-4 w-4" />
              {t('add_article')}
            </CreateActionButton>
          )}
        </div>
      </div>

      {/* Mobile Action Bar */}
      {hasCreateAccess && (
        <div className="md:hidden flex items-center justify-end p-4 border-b border-border bg-card/50 backdrop-blur">
          <CreateActionButton 
            size="sm"
            className="gradient-primary text-primary-foreground shadow-medium hover-lift"
            onClick={handleAddArticle}
          >
            <Plus className="mr-2 h-4 w-4" />
            {t('add_article')}
          </CreateActionButton>
        </div>
      )}
    </>
  );

  return (
    <div className="flex flex-col">
      <Header />

      {/* Stats Cards */}
      <div className="p-3 sm:p-4 border-b border-border">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {stats.map((stat, index) => (
            <Card key={index} className="shadow-card border-0 hover-lift gradient-card group">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2 sm:p-2.5 rounded-lg bg-${stat.color}/10 group-hover:bg-${stat.color}/20 transition-all`}>
                    <stat.icon className={`h-4 w-4 sm:h-5 sm:w-5 text-${stat.color}`} />
                  </div>
                  <Badge className="status-success text-xs px-1.5 py-0.5">{stat.change}</Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-semibold mb-1">{stat.label}</p>
                  <p className="text-sm font-bold text-foreground">{formatStatValue(stat.value)}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Search and Controls */}
      <div className="p-3 sm:p-4 border-b border-border bg-card">
        <div className="flex flex-col gap-3 sm:flex-row sm:gap-4 sm:items-center sm:justify-between">
          <div className="flex gap-2 sm:gap-3 flex-1 w-full items-center">
            <div className="flex-1">
              <CollapsibleSearch 
                placeholder={t('search_placeholder')}
                value={searchTerm}
                onChange={setSearchTerm}
                className="w-full"
              />
            </div>
            <Button variant="outline" size="sm" className="gap-1 sm:gap-2 px-2 sm:px-3" onClick={() => setShowFilterBar(s => !s)}>
              <Filter className="h-4 w-4" />
              <span className="hidden sm:inline">{t('filters.filters')}</span>
            </Button>
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="gap-1 sm:gap-2 flex-1 sm:flex-none"
            >
              <List className="h-4 w-4" />
              <span>{t('filters.list')}</span>
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="gap-1 sm:gap-2 flex-1 sm:flex-none"
            >
              <Grid className="h-4 w-4" />
              <span>{t('filters.grid')}</span>
            </Button>
          </div>
        </div>
        </div>

        {showFilterBar && (
          <div className="p-3 sm:p-4 border-b border-border bg-card">
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex flex-col gap-1.5 min-w-[140px]">
                <label className="text-xs font-medium text-muted-foreground">{t('filters.all_statuses')}</label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="h-9 bg-background">
                    <SelectValue placeholder={t('filters.all_statuses')} />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border shadow-md z-50">
                    <SelectItem value="all">{t('filters.all_statuses')}</SelectItem>
                    {articleStatuses.map((s: any) => (
                      <SelectItem key={s.id} value={s.id}>{t(`statuses.${s.id}`, { defaultValue: s.name })}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5 min-w-[140px]">
                <label className="text-xs font-medium text-muted-foreground">{t('filters.all_categories')}</label>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="h-9 bg-background">
                    <SelectValue placeholder={t('filters.all_categories')} />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border shadow-md z-50">
                    <SelectItem value="all">{t('filters.all_categories')}</SelectItem>
                    {categoryNames.map((c, i) => <SelectItem key={i} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5 min-w-[140px]">
                <label className="text-xs font-medium text-muted-foreground">{t('filters.all_locations', { defaultValue: 'Location' })}</label>
                <Select value={filterLocation} onValueChange={setFilterLocation}>
                  <SelectTrigger className="h-9 bg-background">
                    <SelectValue placeholder={t('filters.all_locations', { defaultValue: 'All Locations' })} />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border shadow-md z-50">
                    <SelectItem value="all">{t('filters.all_locations', { defaultValue: 'All Locations' })}</SelectItem>
                    {locationNames.map((l, i) => <SelectItem key={i} value={l}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5 min-w-[140px]">
                <label className="text-xs font-medium text-muted-foreground">{t('filters.all_suppliers', { defaultValue: 'Supplier' })}</label>
                <Select value={filterSupplier} onValueChange={setFilterSupplier}>
                  <SelectTrigger className="h-9 bg-background">
                    <SelectValue placeholder={t('filters.all_suppliers', { defaultValue: 'All Suppliers' })} />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border shadow-md z-50">
                    <SelectItem value="all">{t('filters.all_suppliers', { defaultValue: 'All Suppliers' })}</SelectItem>
                    {suppliers.map((s, i) => <SelectItem key={i} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {(filterStatus !== 'all' || filterCategory !== 'all' || filterLocation !== 'all' || filterSupplier !== 'all') && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => { setFilterStatus('all'); setFilterCategory('all'); setFilterLocation('all'); setFilterSupplier('all'); }}
                  className="h-9 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4 mr-1" />
                  {t('filters.clear', { defaultValue: 'Clear' })}
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Articles List */}
      <div>
        {isLoading ? (
          <PageSkeleton />
        ) : viewMode === 'list' ? (
          <div className="p-3 sm:p-4 lg:p-6">
            <Card className="shadow-card border-0 bg-card">
              
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {filteredArticles.map((article) => {
                    const StatusIcon = getStatusIcon(article.status);
                    return (
                      <div 
                        key={article.id} 
                        className="p-3 sm:p-4 lg:p-6 hover:bg-muted/50 transition-colors group cursor-pointer"
                        onClick={() => handleArticleClick(article)}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                          <div className="flex items-start sm:items-center gap-3 sm:gap-4 flex-1 min-w-0">
                            <Avatar className="h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0">
                              <AvatarFallback className="text-xs sm:text-sm bg-primary/10 text-primary">
                                <Package className="h-4 w-4 sm:h-6 sm:w-6" />
                              </AvatarFallback>
                            </Avatar>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                                <div className="flex items-center gap-2">
                                  <h3 className="font-semibold text-foreground text-sm sm:text-base break-words line-clamp-2">{article.name}</h3>
                                </div>
                                <Badge className={`${getStatusColor(article.status)} text-xs`}>
                                  <StatusIcon className="h-3 w-3 mr-1" />
                                  {article.status.replace("_", " ")}
                                </Badge>
                              </div>
                              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs sm:text-sm text-muted-foreground mb-2">
                                <span className="truncate">SKU: {article.sku} • {article.category}</span>
                                <span className="text-xs">Stock: {article.stock} units</span>
                              </div>
                              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Warehouse className="h-3 w-3 flex-shrink-0" />
                                  <span className="truncate">{article.location}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <DollarSign className="h-3 w-3 flex-shrink-0" />
                                  <span className="truncate">{article.sellPrice} TND</span>
                                </div>
                                <div className="hidden sm:flex items-center gap-1">
                                  <Clock className="h-3 w-3 flex-shrink-0" />
                                  <span>Last: {article.lastUsed}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between sm:justify-end gap-2 mt-2 sm:mt-0">
                            <div className="flex gap-1 flex-wrap flex-1 sm:flex-none">
                              <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                                {article.lastUsedBy}
                              </Badge>
                            </div>
                            
                            <div onClick={(e) => e.stopPropagation()}>
                              <TableRowActions actions={[
                                { icon: Eye, label: 'View Details', onClick: (e) => { e.stopPropagation(); handleArticleClick(article); } },
                                { icon: Edit, label: 'Edit Article', onClick: (e) => { e.stopPropagation(); navigate(`/dashboard/articles/${article.id}/edit`); }, show: hasUpdateAccess },
                                { icon: Trash2, label: 'Delete', onClick: (e) => { e.stopPropagation(); }, variant: 'destructive', show: hasDeleteAccess }
                              ]} />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="p-3 sm:p-4 lg:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {filteredArticles.map((article) => {
                const StatusIcon = getStatusIcon(article.status);
                return (
                  <Card 
                    key={article.id} 
                    className="shadow-card border-0 hover-lift transition-all duration-200 bg-card group cursor-pointer"
                    onClick={() => handleArticleClick(article)}
                  >
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex items-start justify-between mb-3 sm:mb-4">
                        <Avatar className="h-10 w-10 sm:h-12 sm:w-12">
                          <AvatarFallback className="text-xs sm:text-sm bg-primary/10 text-primary">
                            <Package className="h-4 w-4 sm:h-6 sm:w-6" />
                          </AvatarFallback>
                        </Avatar>
                        <div onClick={(e) => e.stopPropagation()}>
                          <TableRowActions actions={[
                            { icon: Eye, label: 'View Details', onClick: (e) => { e.stopPropagation(); handleArticleClick(article); } },
                            { icon: Edit, label: 'Edit Article', onClick: (e) => { e.stopPropagation(); navigate(`/dashboard/articles/${article.id}/edit`); }, show: hasUpdateAccess },
                            { icon: Trash2, label: 'Delete', onClick: (e) => { e.stopPropagation(); }, variant: 'destructive', show: hasDeleteAccess }
                          ]} />
                        </div>
                      </div>
                      
                      <div className="mb-3 sm:mb-4">
                        <h3 className="font-semibold text-foreground text-sm sm:text-base mb-1 break-words line-clamp-2">{article.name}</h3>
                        <p className="text-xs sm:text-sm text-muted-foreground mb-2 break-words line-clamp-1">SKU: {article.sku} • {article.category}</p>
                        <Badge className={`${getStatusColor(article.status)} text-xs`}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {article.status.replace("_", " ")}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2 text-xs sm:text-sm text-muted-foreground">
                        <div className="flex justify-between">
                          <span>Stock:</span>
                          <span className="font-medium">{article.stock} units</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Price:</span>
                          <span className="font-medium">{article.sellPrice} TND</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Location:</span>
                          <span className="font-medium truncate">{article.location}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {!isLoading && filteredArticles.length === 0 && (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No articles found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm ? "Try adjusting your search criteria" : "Get started by adding your first article"}
            </p>
            {hasCreateAccess && (
              <CreateActionButton onClick={handleAddArticle}>
                <Plus className="h-4 w-4 mr-2" />
                Add Article
              </CreateActionButton>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
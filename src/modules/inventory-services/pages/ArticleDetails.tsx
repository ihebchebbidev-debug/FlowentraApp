import React, { useEffect, useState } from "react";
import { DetailPageSkeleton } from "@/components/ui/page-skeleton";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, Edit, Package, Wrench, MapPin, Clock, User, Calendar, Copy, 
  AlertTriangle, Loader2, Tag
} from "lucide-react";
import { toast } from "sonner";
import { getStatusColor, getStatusIcon, getTypeIcon, getStatusLabel } from "../components/utils";
import { articlesApi } from "@/services/api/articlesApi";
import { articleCategoriesApi, locationsApi, articleGroupsApi, LookupItem } from "@/services/api/lookupsApi";
import { useArticleNotes } from "../hooks/useArticleNotes";
import { ArticleNotesTab } from "../components/detail/ArticleNotesTab";
import { useUserNameResolver } from "@/hooks/useUserNameResolver";

export function ArticleDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation('inventory-services');
  const [categories, setCategories] = useState<LookupItem[]>([]);
  const [locations, setLocations] = useState<LookupItem[]>([]);
  const [groups, setGroups] = useState<LookupItem[]>([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [deletingNoteId, setDeletingNoteId] = useState<number | null>(null);
  const [createdByName, setCreatedByName] = useState<string>('-');
  const [modifiedByName, setModifiedByName] = useState<string>('-');
  
  // User name resolver for audit trail
  const { resolveUserName } = useUserNameResolver();
  
  // Fetch categories and locations for name lookup
  useEffect(() => {
    const loadLookups = async () => {
      try {
        const [catResponse, locResponse, groupResponse] = await Promise.all([
          articleCategoriesApi.getAll(),
          locationsApi.getAll(),
          articleGroupsApi.getAll()
        ]);
        setCategories(catResponse.items || []);
        setLocations(locResponse.items || []);
        setGroups(groupResponse.items || []);
      } catch (error) {
        console.error('Failed to load lookups:', error);
      }
    };
    loadLookups();
  }, []);

  // Fetch article notes from API
  const articleIdNum = id ? parseInt(id) : null;
  const {
    notes,
    isLoading: notesLoading,
    isCreating,
    isDeleting,
    createNote,
    deleteNote,
  } = useArticleNotes(articleIdNum);
  
  // Fetch article from API
  const { data: rawArticle, isLoading, error, refetch } = useQuery({
    queryKey: ['article', id],
    queryFn: async () => {
      if (!id) throw new Error('No article ID');
      return await articlesApi.getById(id);
    },
    enabled: !!id,
    retry: 2,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
  });

  // Resolve user names for audit trail when article is loaded
  useEffect(() => {
    const resolveNames = async () => {
      if (!rawArticle) return;
      
      const apiArticle = rawArticle as any;
      const createdBy = apiArticle.createdBy;
      const modifiedBy = apiArticle.modifiedBy;
      
      if (createdBy) {
        const name = await resolveUserName(createdBy);
        setCreatedByName(name);
      }
      
      if (modifiedBy) {
        const name = await resolveUserName(modifiedBy);
        setModifiedByName(name);
      }
    };
    
    resolveNames();
  }, [rawArticle, resolveUserName]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(t('detail.copied_to_clipboard', { item: label }));
  };

  const handleDeleteNote = async (noteId: number) => {
    setDeletingNoteId(noteId);
    try {
      await deleteNote(noteId);
    } finally {
      setDeletingNoteId(null);
    }
  };
  
  // Helper to get category name by ID
  const getCategoryName = (categoryId: number | string | null | undefined): string => {
    if (!categoryId) return t('uncategorized');
    const numId = typeof categoryId === 'string' ? parseInt(categoryId) : categoryId;
    const category = categories.find(c => Number(c.id) === numId);
    return category?.name || t('category_fallback', { id: categoryId });
  };
  
  // Helper to get location name by ID
  const getLocationName = (locationId: number | string | null | undefined): string => {
    if (!locationId) return t('no_location');
    const numId = typeof locationId === 'string' ? parseInt(locationId) : locationId;
    const location = locations.find(l => Number(l.id) === numId);
    return location?.name || t('location_fallback', { id: locationId });
  };

  // Helper to get group name by ID
  const getGroupName = (groupId: number | string | null | undefined): string => {
    if (!groupId) return t('no_group');
    const numId = typeof groupId === 'string' ? parseInt(groupId) : groupId;
    const group = groups.find(g => Number(g.id) === numId);
    return group?.name || t('group_fallback', { id: groupId });
  };

  if (isLoading) {
    return <DetailPageSkeleton className="h-screen" />;
  }
  
  if (error || !rawArticle) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">{t('item_not_found')}</p>
            <div className="flex justify-center gap-2 mt-4">
              <Button variant="outline" onClick={() => refetch()}>
                {t('retry')}
              </Button>
              <Button onClick={() => navigate('/dashboard/inventory-services')}>
                {t('back_to_inventory')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Map API response to display format
  const apiArticle = rawArticle as any;
  const stock = apiArticle.stockQuantity ?? apiArticle.stock ?? 0;
  const minStock = apiArticle.minStockLevel ?? apiArticle.minStock ?? 0;
  
  const article = {
    id: String(apiArticle.id),
    type: apiArticle.type || 'material',
    name: apiArticle.name || '',
    sku: apiArticle.articleNumber || apiArticle.sku || '',
    categoryId: apiArticle.categoryId,
    category: getCategoryName(apiArticle.categoryId),
    groupId: apiArticle.groupId,
    group: getGroupName(apiArticle.groupId),
    stock: stock,
    minStock: minStock,
    costPrice: apiArticle.purchasePrice ?? apiArticle.costPrice ?? 0,
    sellPrice: apiArticle.salesPrice ?? apiArticle.sellPrice ?? apiArticle.basePrice ?? 0,
    supplier: apiArticle.supplier || '',
    locationId: apiArticle.locationId,
    location: getLocationName(apiArticle.locationId),
    subLocation: apiArticle.subLocation || '',
    basePrice: apiArticle.basePrice ?? apiArticle.salesPrice ?? 0,
    duration: apiArticle.duration,
    skillsRequired: apiArticle.skillsRequired || [],
    materialsNeeded: apiArticle.materialsNeeded || [],
    preferredUsers: apiArticle.preferredUsers || [],
    lastUsed: apiArticle.modifiedDate || apiArticle.createdDate,
    lastUsedBy: apiArticle.modifiedBy || 'system',
    tags: apiArticle.tags || [],
    notes: apiArticle.notes || '',
    status: stock <= 0 ? 'out_of_stock' : stock <= minStock ? 'low_stock' : 'available',
    description: apiArticle.description || '',
    createdAt: apiArticle.createdDate ? new Date(apiArticle.createdDate) : new Date(),
    updatedAt: apiArticle.modifiedDate ? new Date(apiArticle.modifiedDate) : new Date(),
    createdBy: apiArticle.createdBy || 'system',
    modifiedBy: apiArticle.modifiedBy || 'system',
    unit: apiArticle.unit || 'piece',
  };

  const StatusIcon = getStatusIcon(article.status);
  const TypeIcon = getTypeIcon(article.type);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b">
        <div className="p-4 sm:p-6 max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/inventory-services')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t('back')}
              </Button>
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    <TypeIcon className="h-6 w-6" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-2xl font-bold">{article.name}</h1>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="capitalize">
                      {t(article.type === 'service' ? 'service' : 'material')}
                    </Badge>
                    {/* Only show stock-related status for materials, not services */}
                    {article.type !== 'service' && (
                      <Badge className={getStatusColor(article.status)}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {getStatusLabel(article.status, t)}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              {article.sku && (
                <Button variant="outline" size="sm" onClick={() => copyToClipboard(article.sku!, 'SKU')}>
                  <Copy className="h-4 w-4 mr-2" />
                  {t('detail.copy_sku')}
                </Button>
              )}
              <Button onClick={() => navigate(`/dashboard/inventory-services/article/${id}/edit`)}>
                <Edit className="h-4 w-4 mr-2" />
                {t('edit')}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content with Tabs */}
      <div className="p-3 sm:p-6 max-w-7xl mx-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Responsive Tabs */}
          <div className="border-b border-border mb-6">
            <TabsList className="inline-flex h-auto p-1 bg-muted rounded-lg w-full overflow-x-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent md:grid md:grid-cols-2 md:w-auto">
              <TabsTrigger value="overview" className="whitespace-nowrap px-3 py-2 text-sm">
                {t('detail.tabs.overview')}
              </TabsTrigger>
              <TabsTrigger value="notes" className="whitespace-nowrap px-3 py-2 text-sm">
                {t('detail.tabs.notes')}
                {notes.length > 0 && (
                  <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">
                    {notes.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-0 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Details */}
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>{t('detail.article_information')}</CardTitle>
                    <CardDescription>{t('detail.article_information_description')}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {article.sku && (
                      <div className="flex items-center justify-between">
                        <div>
                          <dt className="text-sm font-medium text-muted-foreground">{t('sku')}</dt>
                          <dd className="text-sm font-mono">{article.sku}</dd>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => copyToClipboard(article.sku!, 'SKU')}>
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground">{t('category')}</dt>
                      <dd className="text-sm">{article.category}</dd>
                    </div>
                    {article.group && (
                      <div>
                        <dt className="text-sm font-medium text-muted-foreground">{t('group')}</dt>
                        <dd className="text-sm">{article.group}</dd>
                      </div>
                    )}
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground">{t('description')}</dt>
                      <dd className="text-sm leading-relaxed">{article.description || '-'}</dd>
                    </div>
                    {article.tags && article.tags.length > 0 && (
                      <div>
                        <dt className="text-sm font-medium text-muted-foreground">{t('tags')}</dt>
                        <dd className="flex gap-1 flex-wrap mt-1">
                          {article.tags.map((tag: string, index: number) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </dd>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Type-specific Details */}
                {article.type === 'material' ? (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Package className="h-5 w-5 text-primary" />
                        {t('detail.stock_levels')}
                      </CardTitle>
                      <CardDescription>{t('detail.stock_levels_description')}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <dt className="text-sm font-medium text-muted-foreground">{t('current_stock')}</dt>
                          <dd className={`text-lg font-semibold ${article.stock <= article.minStock ? 'text-destructive' : 'text-foreground'}`}>
                            {article.stock} {t(`units.${String(article.unit).toLowerCase()}`, { defaultValue: article.unit })}
                          </dd>
                        </div>
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <dt className="text-sm font-medium text-muted-foreground">{t('minimum_stock')}</dt>
                          <dd className="text-lg font-semibold">{article.minStock} {t(`units.${String(article.unit).toLowerCase()}`, { defaultValue: article.unit })}</dd>
                        </div>
                      </div>
                      <Separator />
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <dt className="text-sm font-medium text-muted-foreground">{t('detail.cost_price')}</dt>
                          <dd className="text-sm">{article.costPrice} TND</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-muted-foreground">{t('detail.sell_price')}</dt>
                          <dd className="text-lg font-semibold text-primary">{article.sellPrice} TND</dd>
                        </div>
                      </div>
                      <Separator />
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="text-sm">
                            <span className="font-medium">{t('location')}:</span> {article.location}
                            {article.subLocation && ` - ${article.subLocation}`}
                          </span>
                        </div>
                        {article.supplier && (
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <span className="text-sm">
                              <span className="font-medium">{t('supplier')}:</span> {article.supplier}
                            </span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Wrench className="h-5 w-5 text-primary" />
                        {t('detail.service_details')}
                      </CardTitle>
                      <CardDescription>{t('detail.service_details_description')}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <dt className="text-sm font-medium text-muted-foreground">{t('base_price')}</dt>
                          <dd className="text-lg font-semibold text-primary">{article.basePrice} TND</dd>
                        </div>
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <dt className="text-sm font-medium text-muted-foreground">{t('duration')}</dt>
                          <dd className="text-sm flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {article.duration || '-'} {t('hours')}
                          </dd>
                        </div>
                      </div>
                      {article.skillsRequired && article.skillsRequired.length > 0 && (
                        <div>
                          <dt className="text-sm font-medium text-muted-foreground mb-2">{t('skills_required')}</dt>
                          <dd className="flex gap-1 flex-wrap">
                            {article.skillsRequired.map((skill: string, index: number) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {skill}
                              </Badge>
                            ))}
                          </dd>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Audit Trail */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-primary" />
                      {t('detail.audit_info')}
                    </CardTitle>
                    <CardDescription>{t('detail.audit_info_description')}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <dt className="text-sm font-medium text-muted-foreground">{t('detail.created_date')}</dt>
                      <dd className="text-sm font-medium">{article.createdAt.toLocaleDateString()}</dd>
                      <dd className="text-xs text-muted-foreground">{t('detail.created_by')}: {createdByName}</dd>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <dt className="text-sm font-medium text-muted-foreground">{t('detail.modified_date')}</dt>
                      <dd className="text-sm font-medium">{article.updatedAt.toLocaleDateString()}</dd>
                      <dd className="text-xs text-muted-foreground">{t('detail.modified_by')}: {modifiedByName}</dd>
                    </div>
                  </CardContent>
                </Card>

              </div>
            </div>
          </TabsContent>

          {/* Notes Tab */}
          <TabsContent value="notes" className="mt-0">
            <ArticleNotesTab
              notes={notes}
              isLoading={notesLoading}
              isCreating={isCreating}
              isDeleting={isDeleting}
              deletingNoteId={deletingNoteId}
              onAddNote={createNote}
              onDeleteNote={handleDeleteNote}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

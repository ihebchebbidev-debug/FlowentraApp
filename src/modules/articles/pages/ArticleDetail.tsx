import { useState } from "react";
import { Warehouse, Activity, Package, Loader2, Edit, Users } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLayoutModeContext } from "@/hooks/useLayoutMode";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TransferModal } from "../components/TransferModal";
import { ArticleDetailHeader } from "../components/detail/ArticleDetailHeader";
import { ArticleStatusCards } from "../components/detail/ArticleStatusCards";
import { ArticleOverviewTab } from "../components/detail/ArticleOverviewTab";
import { ArticleInventoryTab } from "../components/detail/ArticleInventoryTab";
import { ArticleHistoryTab } from "../components/detail/ArticleHistoryTab";
import { ArticleSuppliersTab } from "../components/detail/ArticleSuppliersTab";
import { ArticleForm } from "../components/ArticleForm";
import { articlesApi } from "@/services/api/articlesApi";
import { getStatusColor, getStatusIcon } from "../components/utils";
import type { CreateArticleRequest } from "@/types/articles";

// Empty logs - will be fetched from API when transactions endpoint is available
const emptyLogs: any[] = [];

const ArticleDetail = () => {
  const { t } = useTranslation('articles');
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isMobile } = useLayoutModeContext();
  const [activeTab, setActiveTab] = useState("overview");
  const [stockAdjustment, setStockAdjustment] = useState("");
  const [adjustmentReason, setAdjustmentReason] = useState("");
  const [adjustmentType, setAdjustmentType] = useState<"add" | "remove">("add");
  const [transferModal, setTransferModal] = useState<{isOpen: boolean, article?: any}>({isOpen: false});
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Fetch article from API with retry and no cache
  const { data: article, isLoading, error, refetch } = useQuery({
    queryKey: ['article', id],
    queryFn: async () => {
      if (!id) throw new Error('No article ID');
      console.log('ArticleDetail: Fetching article with ID:', id);
      const result = await articlesApi.getById(id);
      console.log('ArticleDetail: Article fetched:', result);
      return result;
    },
    enabled: !!id,
    retry: 2,
    staleTime: 0,
    gcTime: 0, // Don't cache errors
    refetchOnMount: 'always',
  });

  const handleEditSubmit = async (data: CreateArticleRequest) => {
    if (!id) return;
    
    setIsUpdating(true);
    try {
      await articlesApi.update(id, data);
      toast({
        title: t("messages.update_success", "Article updated"),
        description: t("messages.article_updated", "The article has been updated successfully."),
      });
      setEditModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['article', id] });
      queryClient.invalidateQueries({ queryKey: ['articles'] });
    } catch (error) {
      console.error('Failed to update article:', error);
      toast({
        title: t("messages.error", "Error"),
        description: t("messages.update_failed", "Failed to update article."),
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6 animate-pulse">
        <div className="h-7 w-48 bg-muted rounded" />
        <div className="h-4 w-full bg-muted/60 rounded" />
        <div className="h-4 w-3/4 bg-muted/60 rounded" />
        <div className="h-64 w-full bg-muted/40 rounded-lg" />
      </div>
    );
  }

  if (error || !article) {
    console.error('Article error:', error);
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">{t("detail.not_found")}</p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            {t("common.retry", "Retry")}
          </Button>
          <Button onClick={() => navigate('/dashboard/inventory-services')}>
            {t("detail.back_to_articles")}
          </Button>
        </div>
      </div>
    );
  }

  // Map API response to expected format (matching actual backend response fields)
  const apiArticle = article as any;
  const stock = apiArticle.stockQuantity ?? apiArticle.stock ?? 0;
  const minStock = apiArticle.minStockLevel ?? apiArticle.minStock ?? 0;
  
  const mappedArticle = {
    id: String(apiArticle.id),
    name: apiArticle.name || '',
    sku: apiArticle.articleNumber || apiArticle.sku || '',
    description: apiArticle.description || '',
    category: apiArticle.category || apiArticle.categoryId || '',
    stock: stock,
    minStock: minStock,
    maxStock: 100,
    price: apiArticle.purchasePrice ?? apiArticle.costPrice ?? 0,
    sellPrice: apiArticle.salesPrice ?? apiArticle.sellPrice ?? apiArticle.basePrice ?? 0,
    status: stock <= 0 ? 'out_of_stock' : stock <= minStock ? 'low_stock' : 'available',
    location: apiArticle.location || apiArticle.locationId || '',
    supplier: apiArticle.supplier || '',
    notes: apiArticle.notes || '',
    createdAt: apiArticle.createdDate || apiArticle.createdAt || '',
    updatedAt: apiArticle.modifiedDate || apiArticle.updatedAt || '',
    reorderPoint: minStock || 10,
    weight: apiArticle.weight || '',
    dimensions: apiArticle.dimensions || '',
    unit: apiArticle.unit || 'piece',
    isActive: apiArticle.isActive ?? true,
    type: apiArticle.type || 'material',
  };

  // Map to Article type for the form
  const articleForForm = {
    id: apiArticle.id,
    name: apiArticle.name || '',
    sku: apiArticle.articleNumber || apiArticle.sku || '',
    description: apiArticle.description || '',
    category: apiArticle.category || '',
    type: apiArticle.type || 'material',
    status: apiArticle.isActive ? 'active' : 'inactive',
    stock: stock,
    minStock: minStock,
    costPrice: apiArticle.purchasePrice ?? apiArticle.costPrice ?? 0,
    sellPrice: apiArticle.salesPrice ?? 0,
    basePrice: apiArticle.salesPrice ?? apiArticle.basePrice ?? 0,
    supplier: apiArticle.supplier || '',
    location: apiArticle.location || '',
    subLocation: apiArticle.subLocation || '',
    notes: apiArticle.notes || '',
    duration: apiArticle.duration,
    skillsRequired: [],
    materialsNeeded: [],
    preferredUsers: [],
    tags: [],
  };

  const StatusIcon = getStatusIcon(mappedArticle.status);

  const handleStockAdjustment = () => {
    const adjustment = parseInt(stockAdjustment);
    if (!adjustment || adjustment <= 0) {
      toast({
        title: t("detail.invalid_quantity"),
        description: t("detail.invalid_quantity_message"),
        variant: "destructive",
      });
      return;
    }

    if (!adjustmentReason.trim()) {
      toast({
        title: t("detail.reason_required"),
        description: t("detail.reason_required_message"),
        variant: "destructive",
      });
      return;
    }

    toast({
      title: t("detail.stock_updated"),
      description: t(
        adjustmentType === 'add' 
          ? "detail.stock_updated_message_add" 
          : "detail.stock_updated_message_remove", 
        { quantity: adjustment }
      ),
    });

    setStockAdjustment("");
    setAdjustmentReason("");
  };

  const handleTransferArticle = () => {
    setTransferModal({isOpen: true, article: {
      id: mappedArticle.id,
      name: mappedArticle.name,
      sku: mappedArticle.sku,
      stock: mappedArticle.stock,
      location: mappedArticle.location
    }});
  };

  const stockPercentage = (mappedArticle.stock / mappedArticle.maxStock) * 100;
  const isLowStock = mappedArticle.stock <= mappedArticle.minStock;
  const margin = mappedArticle.sellPrice - mappedArticle.price;
  const marginPercentage = ((margin / mappedArticle.price) * 100 || 0).toFixed(1);

  return (
    <div className="h-screen flex flex-col">
      <ArticleDetailHeader
        article={mappedArticle}
        adjustmentType={adjustmentType}
        setAdjustmentType={setAdjustmentType}
        stockAdjustment={stockAdjustment}
        setStockAdjustment={setStockAdjustment}
        adjustmentReason={adjustmentReason}
        setAdjustmentReason={setAdjustmentReason}
        onAdjust={handleStockAdjustment}
        onTransfer={handleTransferArticle}
        onEdit={() => setEditModalOpen(true)}
      />

      <ArticleStatusCards article={mappedArticle} StatusIcon={StatusIcon} getStatusColor={getStatusColor} isLowStock={isLowStock} />

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col bg-white p-4 rounded-md min-h-screen">
          <div className="border-b border-border px-3 sm:px-6 py-2 sm:py-0">
            {isMobile ? (
              /* Mobile: styled dropdown select */
              (() => {
                const TABS = [
                  { value: 'overview',   icon: Package,   label: t("detail.overview") },
                  { value: 'inventory',  icon: Warehouse,  label: t("detail.inventory") },
                  { value: 'activity',   icon: Activity,   label: t("detail.activity") },
                  { value: 'suppliers',  icon: Users,      label: t("detail.suppliers_tab", "Suppliers") },
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
              /* Desktop: underline tabs */
              <TabsList variant="underline">
                <TabsTrigger value="overview" className="gap-2">
                  <Package className="h-4 w-4" />{t("detail.overview")}
                </TabsTrigger>
                <TabsTrigger value="inventory" className="gap-2">
                  <Warehouse className="h-4 w-4" />{t("detail.inventory")}
                </TabsTrigger>
                <TabsTrigger value="activity" className="gap-2">
                  <Activity className="h-4 w-4" />{t("detail.activity")}
                </TabsTrigger>
                <TabsTrigger value="suppliers" className="gap-2">
                  <Users className="h-4 w-4" />{t("detail.suppliers_tab", "Suppliers")}
                </TabsTrigger>
              </TabsList>

            )}
          </div>

          <TabsContent value="overview" className="flex-1 p-3 sm:p-6 space-y-4 sm:space-y-6">
            <ArticleOverviewTab article={mappedArticle} margin={margin} marginPercentage={marginPercentage} />
          </TabsContent>

          <TabsContent value="inventory" className="flex-1 p-3 sm:p-6 space-y-4 sm:space-y-6">
            <ArticleInventoryTab article={mappedArticle} stockPercentage={stockPercentage} isLowStock={isLowStock} />
          </TabsContent>

          <TabsContent value="activity" className="flex-1 p-3 sm:p-6">
            <ArticleHistoryTab logs={emptyLogs} />
          </TabsContent>

          <TabsContent value="suppliers" className="flex-1 p-3 sm:p-6">
            <ArticleSuppliersTab articleId={mappedArticle.id} articleName={mappedArticle.name} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Transfer Modal */}
      <TransferModal
        isOpen={transferModal.isOpen}
        onClose={() => setTransferModal({isOpen: false})}
        article={transferModal.article}
      />

      {/* Edit Article Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              {t("form.edit_article", "Edit Article")}
            </DialogTitle>
          </DialogHeader>
          <ArticleForm
            article={articleForForm as any}
            onSubmit={handleEditSubmit}
            onCancel={() => setEditModalOpen(false)}
            isSubmitting={isUpdating}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ArticleDetail;

import { useState } from "react";
import { DetailPageSkeleton } from "@/components/ui/page-skeleton";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { 
  ArrowLeft, 
  Edit, 
  Package, 
  AlertTriangle, 
  CheckCircle, 
  Plus, 
  Minus, 
  Loader2,
  LayoutDashboard,
  ClipboardList,
  FileText,
  ShoppingCart,
  StickyNote
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { articlesApi } from "@/services/api/articlesApi";
import { usersApi } from "@/services/api/usersApi";
import { useArticleNotes } from "../hooks/useArticleNotes";
import { useArticleRelatedRecords } from "../hooks/useArticleRelatedRecords";
import { ArticleOverviewTab } from "../components/detail/ArticleOverviewTab";
import { ArticleNotesTab } from "../components/detail/ArticleNotesTab";
import { ArticleRelatedTab } from "../components/detail/ArticleRelatedTab";
import { getUnitLabel } from "@/constants/units";

const getStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case "available":
    case "active":
    case "in_stock":
      return "bg-success/10 text-success";
    case "low_stock":
      return "bg-warning/10 text-warning";
    case "out_of_stock":
    case "inactive":
      return "bg-destructive/10 text-destructive";
    default:
      return "bg-muted text-muted-foreground";
  }
};

const getStatusIcon = (status: string) => {
  switch (status?.toLowerCase()) {
    case "available":
    case "active":
    case "in_stock":
      return CheckCircle;
    case "low_stock":
    case "out_of_stock":
      return AlertTriangle;
    default:
      return Package;
  }
};

const ArticleDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation('inventory-services');
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [stockAdjustment, setStockAdjustment] = useState("");
  const [adjustmentReason, setAdjustmentReason] = useState("");
  const [adjustmentType, setAdjustmentType] = useState<"add" | "remove">("add");
  const [deletingNoteId, setDeletingNoteId] = useState<number | null>(null);

  const articleId = id ? parseInt(id, 10) : null;

  // Fetch article from API
  const { data: articleData, isLoading, error } = useQuery({
    queryKey: ['article', id],
    queryFn: () => articlesApi.getById(id!),
    enabled: !!id,
  });
  
  // Cast to any to handle additional API fields
  const article = articleData as any;

  // Fetch users for name resolution
  const { data: usersData } = useQuery({
    queryKey: ['users-for-audit'],
    queryFn: () => usersApi.getAll(),
    staleTime: 5 * 60 * 1000,
  });

  // Fetch notes
  const {
    notes,
    isLoading: notesLoading,
    createNote,
    deleteNote,
    isCreating: isCreatingNote,
    isDeleting: isDeletingNote,
  } = useArticleNotes(articleId);

  // Fetch related records
  const {
    serviceOrders,
    offers,
    sales,
    isLoading: relatedLoading,
  } = useArticleRelatedRecords(articleId);

  // Get MainAdminUser from localStorage
  const getMainAdminUser = () => {
    try {
      const userData = localStorage.getItem('user_data');
      if (userData) return JSON.parse(userData);
    } catch {
      return null;
    }
    return null;
  };

  // Helper to get user name by ID
  const getUserName = (userId: string | number | undefined) => {
    if (!userId) return t('detail.unknown');
    
    const userIdStr = String(userId);
    const users = usersData?.users || [];
    const mainAdmin = getMainAdminUser();
    const numericId = parseInt(userIdStr, 10);
    
    // Check if it's the MainAdminUser (ID 1)
    if (numericId === 1 && mainAdmin) {
      const name = mainAdmin.fullName || `${mainAdmin.firstName || ''} ${mainAdmin.lastName || ''}`.trim();
      return name || mainAdmin.email || 'Admin';
    }
    
    // Check in regular users
    const user = users.find((u: any) => u.id?.toString() === userIdStr);
    if (user) {
      const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ');
      return fullName || user.email || `User ${userId}`;
    }
    
    // Check if it's an email
    if (userIdStr.includes('@')) {
      if (mainAdmin && mainAdmin.email === userIdStr) {
        const name = mainAdmin.fullName || `${mainAdmin.firstName || ''} ${mainAdmin.lastName || ''}`.trim();
        return name || userIdStr;
      }
      const userByEmail = users.find((u: any) => u.email === userIdStr);
      if (userByEmail) {
        const fullName = [userByEmail.firstName, userByEmail.lastName].filter(Boolean).join(' ');
        return fullName || userIdStr;
      }
      return userIdStr;
    }
    
    return `User ${userId}`;
  };

  const handleDeleteNote = async (noteId: number) => {
    setDeletingNoteId(noteId);
    try {
      await deleteNote(noteId);
    } finally {
      setDeletingNoteId(null);
    }
  };

  const handleStockAdjustment = () => {
    const adjustment = parseFloat(stockAdjustment);
    if (!adjustment || adjustment <= 0) {
      toast({
        title: t('detail.invalid_quantity'),
        description: t('detail.enter_valid_quantity'),
        variant: "destructive",
      });
      return;
    }

    if (!adjustmentReason.trim()) {
      toast({
        title: t('detail.reason_required'),
        description: t('detail.provide_reason'),
        variant: "destructive",
      });
      return;
    }

    toast({
      title: t('detail.stock_updated'),
      description: t('detail.stock_update_success', { type: adjustmentType === 'add' ? t('detail.added') : t('detail.removed'), count: adjustment }),
    });

    setStockAdjustment("");
    setAdjustmentReason("");
  };

  if (isLoading) {
    return <DetailPageSkeleton />;
  }

  if (error || !article) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">{t('item_not_found')}</h3>
          <p className="text-muted-foreground mb-4">{t('item_not_found_description')}</p>
          <Button onClick={() => navigate('/dashboard/inventory-services')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('back_to_inventory')}
          </Button>
        </div>
      </div>
    );
  }

  // Compute values with fallbacks
  const stock = article.stockQuantity ?? article.stock ?? 0;
  const minStock = article.minStockLevel ?? article.minStock ?? 10;
  const status = article.isActive === false ? 'inactive' : (stock <= 0 ? 'out_of_stock' : stock <= minStock ? 'low_stock' : 'available');

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 py-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate('/dashboard/inventory-services')}
              className="shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>

            {/* Article Info Card */}
            <Card className="flex-1 shadow-sm border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  {/* Left: Icon + Name */}
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="p-3 rounded-lg bg-primary/10 shrink-0">
                      <Package className="h-6 w-6 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <h1 className="text-xl font-semibold truncate">{article.name}</h1>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="truncate">{t('sku')}: {article.articleNumber || article.sku || '-'}</span>
                        {article.category && (
                          <>
                            <span>•</span>
                            <span className="truncate font-medium">{article.category}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Center: Status Badge */}
                  <div className="hidden md:flex items-center gap-2">
                    <Badge variant="outline" className={getStatusColor(status)}>
                      {t(status)}
                    </Badge>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Package className="h-4 w-4 mr-2" />
                          {t('detail.adjust_stock')}
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>{t('detail.adjust_stock_level')}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 pt-4">
                          <div className="space-y-2">
                            <Label>{t('current_stock')}: {stock} {getUnitLabel(article?.unit || 'piece', t)}</Label>
                            <div className="flex gap-2">
                              <Button
                                variant={adjustmentType === 'add' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setAdjustmentType('add')}
                                className="flex-1"
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                {t('detail.add')}
                              </Button>
                              <Button
                                variant={adjustmentType === 'remove' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setAdjustmentType('remove')}
                                className="flex-1"
                              >
                                <Minus className="h-4 w-4 mr-1" />
                                {t('detail.remove')}
                              </Button>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="quantity">{t('quantity')}</Label>
                            <Input
                              id="quantity"
                              type="number"
                              step="0.1"
                              placeholder={t('detail.enter_quantity')}
                              value={stockAdjustment}
                              onChange={(e) => setStockAdjustment(e.target.value)}
                              min="0.1"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="reason">{t('detail.reason')}</Label>
                            <Textarea
                              id="reason"
                              placeholder={t('detail.reason_placeholder')}
                              value={adjustmentReason}
                              onChange={(e) => setAdjustmentReason(e.target.value)}
                              rows={3}
                            />
                          </div>
                          
                          <Button onClick={handleStockAdjustment} className="w-full">
                            {adjustmentType === 'add' ? t('detail.add') : t('detail.remove')} {t('stock')}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Button 
                      size="sm"
                      onClick={() => navigate(`/dashboard/inventory-services/article/${id}/edit`)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      {t('edit')}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Main Content with Tabs */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-3 md:grid-cols-5 gap-1 h-auto p-1">
            <TabsTrigger value="overview" className="text-xs md:text-sm gap-1.5">
              <LayoutDashboard className="h-4 w-4 hidden sm:block" />
              {t('detail.tabs.overview')}
            </TabsTrigger>
            <TabsTrigger value="serviceOrders" className="text-xs md:text-sm gap-1.5">
              <ClipboardList className="h-4 w-4 hidden sm:block" />
              <span className="hidden md:inline">{t('detail.tabs.service_orders')}</span>
              <span className="md:hidden">S.O.</span>
            </TabsTrigger>
            <TabsTrigger value="offers" className="text-xs md:text-sm gap-1.5">
              <FileText className="h-4 w-4 hidden sm:block" />
              {t('detail.tabs.offers')}
            </TabsTrigger>
            <TabsTrigger value="sales" className="text-xs md:text-sm gap-1.5">
              <ShoppingCart className="h-4 w-4 hidden sm:block" />
              {t('detail.tabs.sales')}
            </TabsTrigger>
            <TabsTrigger value="notes" className="text-xs md:text-sm gap-1.5">
              <StickyNote className="h-4 w-4 hidden sm:block" />
              {t('detail.tabs.notes')}
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <ArticleOverviewTab 
              article={article} 
              getUserName={getUserName}
            />
          </TabsContent>

          {/* Service Orders Tab */}
          <TabsContent value="serviceOrders">
            <ArticleRelatedTab
              type="serviceOrders"
              records={serviceOrders}
              isLoading={relatedLoading}
            />
          </TabsContent>

          {/* Offers Tab */}
          <TabsContent value="offers">
            <ArticleRelatedTab
              type="offers"
              records={offers}
              isLoading={relatedLoading}
            />
          </TabsContent>

          {/* Sales Tab */}
          <TabsContent value="sales">
            <ArticleRelatedTab
              type="sales"
              records={sales}
              isLoading={relatedLoading}
            />
          </TabsContent>

          {/* Notes Tab */}
          <TabsContent value="notes">
            <ArticleNotesTab
              notes={notes}
              isLoading={notesLoading}
              isCreating={isCreatingNote}
              isDeleting={isDeletingNote}
              deletingNoteId={deletingNoteId}
              onAddNote={createNote}
              onDeleteNote={handleDeleteNote}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ArticleDetail;

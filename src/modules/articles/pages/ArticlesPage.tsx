import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageSizeSelector } from '@/components/shared/PageSizeSelector';
import { Plus, Search, Package, Wrench, AlertTriangle, History, Upload, ShoppingCart, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from 'react-i18next';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { ArticleForm } from '../components/ArticleForm';
import { InventoryTransactionDialog } from '../components/InventoryTransactionDialog';
import { useArticles, useArticleTransactions } from '../hooks/useArticles';
import { usePermissions } from '@/hooks/usePermissions';
import { useActionLogger } from '@/hooks/useActionLogger';
import type { Article, ArticleType, ArticleStatus, CreateArticleRequest } from '@/types/articles';
import { GenericImportModal, ImportConfig } from '@/shared/import';
import { articlesBulkImportApi } from '@/services/api/articlesApi';
import { ArticlesAutopilotDemo } from '../components/onboarding/ArticlesAutopilotDemo';

export default function ArticlesPage() {
  const { t } = useTranslation('articles');
  const navigate = useNavigate();
  const { isMainAdmin, hasPermission } = usePermissions();
  const { logSearch, logFilter, logFormSubmit } = useActionLogger('Articles');
  
  // Permission checks
  const canCreate = isMainAdmin || hasPermission('articles', 'create');
  const canUpdate = isMainAdmin || hasPermission('articles', 'update');
  const canDelete = isMainAdmin || hasPermission('articles', 'delete');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<ArticleType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<ArticleStatus | 'all'>('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [deleteArticleId, setDeleteArticleId] = useState<string | null>(null);
  const [transactionArticle, setTransactionArticle] = useState<Article | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);

  // Article import configuration
  const articleImportConfig: ImportConfig<any> = {
    entityName: 'Articles',
    templateFilename: 'articles-template.xlsx',
    templateSheetName: 'Articles Template',
    requiredFields: ['name'],
    duplicateCheckFields: ['name', 'sku'],
    fields: [
      { 
        key: 'name', 
        label: t('bulkImport.fields.name', 'Article Name'), 
        required: true,
        validate: (value: string) => {
          if (!value || !value.trim()) {
            return t('bulkImport.validation.nameRequired', 'Article name is required');
          }
          if (value.length > 200) {
            return t('bulkImport.validation.nameTooLong', 'Name must be less than 200 characters');
          }
          return null;
        }
      },
      { 
        key: 'sku', 
        label: t('bulkImport.fields.sku', 'SKU'), 
        required: false,
        validate: (value: string) => {
          if (!value) return null;
          if (value.length > 50) {
            return t('bulkImport.validation.skuTooLong', 'SKU must be less than 50 characters');
          }
          return null;
        }
      },
      { 
        key: 'description', 
        label: t('bulkImport.fields.description', 'Description'), 
        required: false 
      },
      { 
        key: 'type', 
        label: t('bulkImport.fields.type', 'Type'), 
        required: false,
        validate: (value: string) => {
          // No validation error - we normalize all values in transformRow
          // Accept: material, matériel, materiel, service, Material, Service, etc.
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
        key: 'status', 
        label: t('bulkImport.fields.status', 'Status'), 
        required: false,
        validate: (value: string) => {
          // No validation error - we normalize all values in transformRow
          // Accept any status value, defaults to 'active' if unrecognized
          return null;
        }
      },
      { 
        key: 'stock', 
        label: t('bulkImport.fields.stock', 'Stock'), 
        required: false, 
        type: 'number',
        validate: (value: any) => {
          if (value === undefined || value === '') return null;
          const str = String(value).replace(/\s/g, '').replace(',', '.');
          const num = Number(str);
          if (isNaN(num)) {
            return t('bulkImport.validation.invalidStock', 'Stock must be a number') + ` ("${value}")`;
          }
          return null;
        }
      },
      { 
        key: 'minStock', 
        label: t('bulkImport.fields.minStock', 'Min Stock'), 
        required: false, 
        type: 'number',
        validate: (value: any) => {
          if (value === undefined || value === '') return null;
          const str = String(value).replace(/\s/g, '').replace(',', '.');
          const num = Number(str);
          if (isNaN(num)) {
            return t('bulkImport.validation.invalidMinStock', 'Min stock must be a number') + ` ("${value}")`;
          }
          return null;
        }
      },
      { 
        key: 'costPrice', 
        label: t('bulkImport.fields.costPrice', 'Cost Price'), 
        required: false, 
        type: 'number',
        validate: (value: any) => {
          if (value === undefined || value === '') return null;
          const str = String(value).replace(/\s/g, '').replace(',', '.');
          const num = Number(str);
          if (isNaN(num)) {
            return t('bulkImport.validation.invalidPrice', 'Price must be a number') + ` ("${value}")`;
          }
          return null;
        }
      },
      { 
        key: 'sellPrice', 
        label: t('bulkImport.fields.sellPrice', 'Sell Price'), 
        required: false, 
        type: 'number',
        validate: (value: any) => {
          if (value === undefined || value === '') return null;
          const str = String(value).replace(/\s/g, '').replace(',', '.');
          const num = Number(str);
          if (isNaN(num)) {
            return t('bulkImport.validation.invalidPrice', 'Price must be a number') + ` ("${value}")`;
          }
          return null;
        }
      },
      { 
        key: 'basePrice', 
        label: t('bulkImport.fields.basePrice', 'Base Price'), 
        required: false, 
        type: 'number',
        validate: (value: any) => {
          if (value === undefined || value === '') return null;
          const str = String(value).replace(/\s/g, '').replace(',', '.');
          const num = Number(str);
          if (isNaN(num)) {
            return t('bulkImport.validation.invalidPrice', 'Price must be a number') + ` ("${value}")`;
          }
          return null;
        }
      },
      { 
        key: 'duration', 
        label: t('bulkImport.fields.duration', 'Duration'), 
        required: false, 
        type: 'number',
        validate: (value: any) => {
          if (value === undefined || value === '') return null;
          const str = String(value).replace(/\s/g, '').replace(',', '.');
          const num = Number(str);
          if (isNaN(num)) {
            return t('bulkImport.validation.invalidDuration', 'Duration must be a number') + ` ("${value}")`;
          }
          return null;
        }
      },
      { 
        key: 'supplier', 
        label: t('bulkImport.fields.supplier', 'Supplier'), 
        required: false,
        validate: (value: string) => {
          if (!value) return null;
          if (value.length > 200) {
            return t('bulkImport.validation.supplierTooLong', 'Supplier must be less than 200 characters');
          }
          return null;
        }
      },
      { 
        key: 'location', 
        label: t('bulkImport.fields.location', 'Location'), 
        required: false,
        validate: (value: string) => {
          if (!value) return null;
          if (value.length > 200) {
            return t('bulkImport.validation.locationTooLong', 'Location must be less than 200 characters');
          }
          return null;
        }
      },
    ],
    transformRow: (data) => {
      // Normalize type: accept many variations → 'material' or 'service'
      const rawType = (data.type || '').toLowerCase().trim();
      const serviceAliases = ['service', 'services', 'srv', 'prestation', 'prestations'];
      const materialAliases = ['material', 'materials', 'matériel', 'materiel', 'matériaux', 'materiaux', 'produit', 'produits', 'product', 'products', 'mat', 'article'];
      const normalizedType = serviceAliases.some(a => rawType === a || rawType.includes(a)) 
        ? 'service' 
        : materialAliases.some(a => rawType === a || rawType.includes(a)) 
          ? 'material' 
          : (rawType ? 'material' : 'material'); // Default to material

      // Normalize status: accept many variations
      const rawStatus = (data.status || '').toLowerCase().trim();
      const statusMap: Record<string, string> = {
        'available': 'available', 'disponible': 'available',
        'active': 'active', 'actif': 'active', 'actifs': 'active', 'en cours': 'active',
        'low_stock': 'low_stock', 'stock bas': 'low_stock', 'low stock': 'low_stock', 'stock faible': 'low_stock',
        'out_of_stock': 'out_of_stock', 'rupture': 'out_of_stock', 'out of stock': 'out_of_stock', 'épuisé': 'out_of_stock',
        'discontinued': 'discontinued', 'abandonné': 'discontinued', 'arrêté': 'discontinued',
        'inactive': 'inactive', 'inactif': 'inactive', 'désactivé': 'inactive',
      };
      const normalizedStatus = statusMap[rawStatus] || (rawStatus ? 'active' : 'active');

      // Parse number safely: handle comma decimals (French format)
      const parseNum = (val: any): number | undefined => {
        if (val === undefined || val === null || val === '') return undefined;
        const str = String(val).replace(/\s/g, '').replace(',', '.');
        const num = Number(str);
        return isNaN(num) ? undefined : Math.max(0, num);
      };

      return {
        name: data.name || '',
        sku: data.sku,
        description: data.description,
        type: normalizedType as 'material' | 'service',
        category: data.category,
        status: normalizedStatus,
        stock: parseNum(data.stock) ?? 0,
        minStock: parseNum(data.minStock),
        costPrice: parseNum(data.costPrice),
        sellPrice: parseNum(data.sellPrice),
        basePrice: parseNum(data.basePrice),
        duration: parseNum(data.duration),
        supplier: data.supplier,
        location: data.location,
      };
    },
    validateRow: (data) => {
      const errors: string[] = [];
      const warnings: string[] = [];
      
      // Cross-field validation: services should have basePrice, materials should have sellPrice
      if (data.type === 'service') {
        if (!data.basePrice && data.basePrice !== 0) {
          warnings.push(t('bulkImport.validation.serviceMissingBasePrice', 'Services typically require a base price'));
        }
        if (data.stock && data.stock > 0) {
          warnings.push(t('bulkImport.validation.serviceWithStock', 'Services typically do not have stock'));
        }
      }
      
      if (data.type === 'material') {
        if (!data.sellPrice && data.sellPrice !== 0) {
          warnings.push(t('bulkImport.validation.materialMissingSellPrice', 'Materials typically require a sell price'));
        }
      }
      
      // minStock should not be greater than stock
      if (data.minStock && data.stock !== undefined && data.minStock > data.stock) {
        warnings.push(t('bulkImport.validation.minStockGreaterThanStock', 'Min stock is greater than current stock'));
      }
      
      return { errors, warnings };
    },
  };

  // Log search when term changes
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    if (value) {
      logSearch(value, articles?.length || 0);
    }
  };

  // Log filter changes
  const handleTypeFilterChange = (value: ArticleType | 'all') => {
    setTypeFilter(value);
    logFilter('type', value);
  };

  const handleStatusFilterChange = (value: ArticleStatus | 'all') => {
    setStatusFilter(value);
    logFilter('status', value);
  };

  const {
    articles: rawArticles,
    pagination,
    isLoading,
    createArticle,
    updateArticle,
    deleteArticle,
    isCreating,
    isUpdating,
    isDeleting,
  } = useArticles({
    search: searchTerm,
    type: typeFilter !== 'all' ? typeFilter : undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    page,
    limit: pageSize,
  });

  // Defensive client-side filter (in case backend ignores type/status params)
  const articles = (rawArticles || []).filter((a: any) => {
    if (typeFilter !== 'all' && a.type !== typeFilter) return false;
    if (statusFilter !== 'all' && a.status !== statusFilter) return false;
    return true;
  });

  // Separate query for global KPI totals (unfiltered, unpaginated-ish)
  const { articles: allArticlesForStats } = useArticles({ limit: 999, page: 1 });

  const handleCreateArticle = (data: CreateArticleRequest) => {
    createArticle(data, {
      onSuccess: () => {
        setShowCreateDialog(false);
      },
    });
  };

  const handleUpdateArticle = (data: CreateArticleRequest) => {
    if (editingArticle) {
      updateArticle(
        { id: editingArticle.id, data },
        {
          onSuccess: () => {
            setEditingArticle(null);
          },
        }
      );
    }
  };

  const handleDelete = () => {
    if (deleteArticleId) {
      deleteArticle(deleteArticleId, {
        onSuccess: () => {
          setDeleteArticleId(null);
        },
      });
    }
  };

  const getStatusBadge = (status: ArticleStatus) => {
    const variants: Record<ArticleStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      available: 'default',
      active: 'default',
      low_stock: 'secondary',
      out_of_stock: 'destructive',
      discontinued: 'outline',
      inactive: 'outline',
    };

    const safeStatus = (status ?? 'available') as ArticleStatus;
    const variant = variants[safeStatus] ?? 'outline';

    return (
      <Badge variant={variant}>
        {String(safeStatus).replace('_', ' ')}
      </Badge>
    );
  };

  const isLowStock = (article: Article) => {
    if (article.type === 'material' && article.stock !== undefined && article.minStock !== undefined) {
      return article.stock <= article.minStock;
    }
    return false;
  };

  // KPI counts use the global (unfiltered) list so they stay stable across pages/filters
  const statsSource = allArticlesForStats?.length ? allArticlesForStats : (rawArticles || []);
  const materials = statsSource.filter((a: any) => a.type === 'material');
  const services = statsSource.filter((a: any) => a.type === 'service');
  const lowStockItems = materials.filter(isLowStock);
  const totalItems = pagination?.total ?? statsSource.length;

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 lg:p-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-3xl font-bold truncate">{t('title')}</h1>
          <p className="text-muted-foreground text-sm truncate">{t('subtitle')}</p>
        </div>
        <div className="flex gap-1.5 sm:gap-2 flex-shrink-0">
          <Button variant="outline" size="sm" onClick={() => setDemoOpen(true)} className="hidden sm:inline-flex gap-1.5">
            <Play className="h-3.5 w-3.5" /> {t('watchDemo', 'Watch Demo')}
          </Button>
          {canCreate && (
            <>
              <Button variant="outline" size="sm" onClick={() => setShowImportModal(true)}>
                <Upload className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">{t('bulkImport.title', 'Import')}</span>
              </Button>
              <Button size="sm" onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">{t('add_article')}</span>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            <div className="text-sm text-muted-foreground">{t('cards.materials')}</div>
          </div>
          <div className="text-2xl font-bold mt-2">{materials.length}</div>
        </div>

        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center gap-2">
            <Wrench className="h-5 w-5 text-primary" />
            <div className="text-sm text-muted-foreground">{t('cards.services')}</div>
          </div>
          <div className="text-2xl font-bold mt-2">{services.length}</div>
        </div>

        <button
          type="button"
          onClick={() => setStatusFilter('low_stock')}
          className="bg-card border rounded-lg p-4 text-left hover:border-destructive/40 hover:shadow-sm transition-colors cursor-pointer"
          aria-label={t('cards.low_stock')}
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <div className="text-sm text-muted-foreground">{t('cards.low_stock')}</div>
          </div>
          <div className="text-2xl font-bold mt-2">{lowStockItems.length}</div>
        </button>

        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            <div className="text-sm text-muted-foreground">{t('cards.total_items')}</div>
          </div>
          <div className="text-2xl font-bold mt-2">{totalItems}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('search_placeholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={typeFilter} onValueChange={(value: any) => setTypeFilter(value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={t('filters.all_categories')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('filters.all_categories')}</SelectItem>
            <SelectItem value="material">{t('cards.materials')}</SelectItem>
            <SelectItem value="service">{t('cards.services')}</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={t('filters.all_statuses')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('filters.all_statuses')}</SelectItem>
            <SelectItem value="available">{t('statuses.available')}</SelectItem>
            <SelectItem value="active">{t('statuses.available')}</SelectItem>
            <SelectItem value="low_stock">{t('statuses.low_stock')}</SelectItem>
            <SelectItem value="out_of_stock">{t('statuses.out_of_stock')}</SelectItem>
            <SelectItem value="discontinued">{t('statuses.out_of_stock')}</SelectItem>
            <SelectItem value="inactive">{t('statuses.out_of_stock')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Bulk Action Bar */}
      {/* Note: Articles page doesn't have bulk selection yet - can be added if needed */}

      {/* Pagination - Top */}
      {pagination && (pagination.total || articles.length) > 0 && (
        <PageSizeSelector
          currentPage={page}
          totalPages={pagination.pages || 1}
          totalItems={pagination.total || articles.length}
          pageSize={pageSize}
          startIndex={(page - 1) * pageSize}
          endIndex={Math.min(page * pageSize, pagination.total || articles.length)}
          onPageChange={setPage}
          onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
          hasPreviousPage={page > 1}
          hasNextPage={page < (pagination.pages || 1)}
        />
      )}

      {/* Articles Table */}
      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
              <TableRow>
              <TableHead>{t('table.type')}</TableHead>
              <TableHead>{t('table.name')}</TableHead>
              <TableHead>{t('table.sku_category')}</TableHead>
              <TableHead>{t('table.status')}</TableHead>
              <TableHead>{t('table.stock')}</TableHead>
              <TableHead>{t('table.price')}</TableHead>
              <TableHead>{t('table.location')}</TableHead>
              <TableHead className="text-right">{t('table.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
                <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  {t('table.loading')}
                </TableCell>
              </TableRow>
            ) : articles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-0">
                  <div className="flex flex-col items-center justify-center py-16">
                    <Package className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">{t('no_articles_found')}</h3>
                    <p className="text-muted-foreground mb-4">{t('no_articles_description_empty')}</p>
                    {canCreate && (
                      <Button onClick={() => setShowCreateDialog(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        {t('add_article')}
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              articles.map((article) => (
                <TableRow key={article.id}>
                  <TableCell>
                    {article.type === 'material' ? (
                      <Package className="h-4 w-4" />
                    ) : (
                      <Wrench className="h-4 w-4" />
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{article.name}</TableCell>
                  <TableCell>
                    {article.type === 'material' ? article.sku || '-' : article.category}
                  </TableCell>
                  <TableCell>{getStatusBadge(article.status)}</TableCell>
                  <TableCell>
                    {article.type === 'material' ? (
                      <div className="flex items-center gap-2">
                        <span>{article.stock || 0}</span>
                        {isLowStock(article) && (
                          <AlertTriangle className="h-3 w-3 text-destructive" />
                        )}
                      </div>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    {article.type === 'material'
                      ? `$${article.sellPrice?.toFixed(2) || '0.00'}`
                      : `$${article.basePrice?.toFixed(2) || '0.00'}`}
                  </TableCell>
                  <TableCell>{article.location || '-'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {article.type === 'material' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setTransactionArticle(article)}
                        >
                          {t('actions.transfer')}
                        </Button>
                      )}
                      {/* Quick action: when stock is at/under min OR zero, jump
                          straight into Create Purchase Order, prefilled with
                          this article's preferred supplier + line. */}
                      {article.type === 'material' && (article.status === 'low_stock' || article.status === 'out_of_stock') && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => navigate(`/dashboard/purchases/orders/add?articleId=${encodeURIComponent(article.id)}`)}
                          title={t('actions.create_purchase_order', 'Create Purchase Order')}
                        >
                          <ShoppingCart className="h-3.5 w-3.5 mr-1" />
                          {t('actions.create_purchase_order', 'Create PO')}
                        </Button>
                      )}
                      {canUpdate && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingArticle(article)}
                        >
                          {t('actions.edit_article')}
                        </Button>
                      )}
                      {canDelete && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setDeleteArticleId(article.id)}
                        >
                          {t('actions.delete')}
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination && (
        <PageSizeSelector
          currentPage={page}
          totalPages={pagination.pages || 1}
          totalItems={pagination.total || articles.length}
          pageSize={pageSize}
          startIndex={(page - 1) * pageSize}
          endIndex={Math.min(page * pageSize, pagination.total || articles.length)}
          onPageChange={setPage}
          onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
          hasPreviousPage={page > 1}
          hasNextPage={page < (pagination.pages || 1)}
        />
      )}

      {/* Create Article Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('add.title')}</DialogTitle>
          </DialogHeader>
          <ArticleForm
            onSubmit={handleCreateArticle}
            onCancel={() => setShowCreateDialog(false)}
            isSubmitting={isCreating}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Article Dialog */}
      <Dialog open={!!editingArticle} onOpenChange={() => setEditingArticle(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('edit.title')}</DialogTitle>
          </DialogHeader>
          {editingArticle && (
            <ArticleForm
              article={editingArticle}
              onSubmit={handleUpdateArticle}
              onCancel={() => setEditingArticle(null)}
              isSubmitting={isUpdating}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteArticleId} onOpenChange={() => setDeleteArticleId(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>{t('confirm.are_you_sure')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('confirm.delete_description')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('add.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? t('confirm.deleting') : t('actions.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Inventory Transaction Dialog */}
      {transactionArticle && (
        <InventoryTransactionDialog
          open={!!transactionArticle}
          onOpenChange={(open) => !open && setTransactionArticle(null)}
          articleId={transactionArticle.id}
          articleName={transactionArticle.name}
          onSubmit={(data) => {
            // Handle transaction creation
            setTransactionArticle(null);
          }}
        />
      )}

      {/* Import Modal */}
      <GenericImportModal
        open={showImportModal}
        onOpenChange={setShowImportModal}
        config={articleImportConfig}
        onImport={(items) => articlesBulkImportApi.bulkImport({ articles: items })}
        translationNamespace="articles"
      />

      {/* Autopilot product demo */}
      <ArticlesAutopilotDemo open={demoOpen} onClose={() => setDemoOpen(false)} />
    </div>
  );
}

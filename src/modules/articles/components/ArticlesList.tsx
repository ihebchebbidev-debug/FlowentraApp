import { Plus, Package } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { CreateActionButton } from '@/components/CreateActionButton';
//
import { ArticlesHeader } from "./ArticlesHeader";
import { ArticlesStats, type Stat } from "./ArticlesStats";
import { ArticlesSearchControls } from "./ArticlesSearchControls";
import { ArticlesListView } from "./ArticlesListView";
import { ArticlesGridView } from "./ArticlesGridView";
import { TransferModal } from "./TransferModal";
import { ExportModal, ExportConfig } from "@/components/shared/ExportModal";
import { GenericImportModal, type ImportConfig } from "@/shared/import";
import { articlesBulkImportApi } from "@/services/api/articlesApi";

import { useArticlesList } from "../hooks/useArticlesList";

// presentational helpers are moved to components/utils.ts

export function ArticlesList() {
  const { t } = useTranslation('articles');
  const navigate = useNavigate();
  const {
    searchTerm, setSearchTerm,
    viewMode, setViewMode,
    filterStatus, setFilterStatus,
    filterCategory, setFilterCategory,
    filteredArticles,
    stats,
  } = useArticlesList();
  const [transferModal, setTransferModal] = useState<{isOpen: boolean, article?: any}>({isOpen: false});
  const [showExportModal, setShowExportModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  const handleArticleClick = (article: any) => {
    navigate(`/dashboard/articles/${article.id}`);
  };

  const handleAddArticle = () => {
    navigate('/dashboard/articles/add');
  };

  const handleEditArticle = (article: any) => {
    navigate(`/dashboard/articles/edit/${article.id}`);
  };

  const handleTransferArticle = (article: any) => {
    setTransferModal({isOpen: true, article});
  };

  const handleExport = () => {
    setShowExportModal(true);
  };

  const handleImport = () => {
    setShowImportModal(true);
  };

  const importConfig: ImportConfig<any> = {
    entityName: 'Articles',
    fields: [
      { key: 'name', label: 'Article Name', required: true },
      { key: 'sku', label: 'Reference/SKU', required: false },
      { key: 'description', label: 'Description', required: false },
      { key: 'type', label: 'Type (material/service)', required: false },
      { key: 'category', label: 'Category', required: false },
      { key: 'status', label: 'Status', required: false },
      { key: 'stock', label: 'Current Stock', required: false },
      { key: 'minStock', label: 'Minimum Stock', required: false },
      { key: 'costPrice', label: 'Cost Price', required: false },
      { key: 'sellPrice', label: 'Sell Price', required: false },
      { key: 'basePrice', label: 'Base Price', required: false },
      { key: 'duration', label: 'Duration (minutes)', required: false },
      { key: 'supplier', label: 'Supplier', required: false },
      { key: 'location', label: 'Location', required: false },
    ],
    requiredFields: ['name'],
    duplicateCheckFields: ['sku', 'name'],
    templateFilename: 'articles-import-template',
    templateSheetName: 'Articles',
    transformRow: (data) => data,
    validateRow: (data) => {
      const errors: string[] = [];
      const warnings: string[] = [];
      if (!data.name) errors.push('Name is required');
      return { errors, warnings };
    }
  };

  const handleImportData = async (data: any[]) => {
    const normalizeType = (val: string) => {
      const raw = (val || '').toLowerCase().trim();
      const serviceAliases = ['service', 'services', 'srv', 'prestation', 'prestations'];
      return serviceAliases.some(a => raw === a || raw.includes(a)) ? 'service' : 'material';
    };

    const parseNum = (val: any): number => {
      if (val === undefined || val === null || val === '') return 0;
      const str = String(val).replace(/\s/g, '').replace(',', '.');
      const num = Number(str);
      return isNaN(num) ? 0 : Math.max(0, num);
    };

    const articles = data.map((item: any) => ({
      name: item.name,
      sku: item.sku,
      description: item.description,
      type: normalizeType(item.type),
      category: item.category,
      stock: parseNum(item.stock),
      minStock: parseNum(item.minStock),
      costPrice: parseNum(item.costPrice),
      sellPrice: parseNum(item.sellPrice) || parseNum(item.basePrice),
      duration: item.duration ? parseNum(item.duration) : null,
      supplier: item.supplier,
      location: item.location,
    }));
    
    return articlesBulkImportApi.bulkImport({ articles: articles as any, skipDuplicates: true });
  };

  const exportConfig: ExportConfig = {
    filename: 'articles-export',
    allDataTransform: (article: any) => ({
      'ID': article.id,
      'Name': article.name,
      'Reference': article.sku,
      'Category': article.category,
      'Status': article.status,
      'Stock': article.stock,
      'Min Stock': article.minStock,
      'Cost Price': article.price,
      'Sell Price': article.sellPrice,
      'Supplier': article.supplier,
      'Location': article.location,
      'Description': article.description,
      'Last Used': article.lastUsed ? new Date(article.lastUsed).toLocaleDateString() : 'N/A',
      'Last Used By': article.lastUsedBy || 'N/A',
      'Created At': new Date().toLocaleDateString(),
      'Updated At': new Date().toLocaleDateString(),
    }),
    availableColumns: [
      { key: 'id', label: 'ID', category: 'Basic' },
      { key: 'name', label: 'Name', category: 'Basic' },
      { key: 'sku', label: 'Reference', category: 'Basic' },
      { key: 'category', label: 'Category', category: 'Basic' },
      { key: 'status', label: 'Status', category: 'Basic' },
      { key: 'stock', label: 'Current Stock', category: 'Inventory' },
      { key: 'minStock', label: 'Minimum Stock', category: 'Inventory' },
      { key: 'location', label: 'Location', category: 'Inventory' },
      { key: 'price', label: 'Cost Price', category: 'Financial' },
      { key: 'sellPrice', label: 'Sell Price', category: 'Financial' },
      { key: 'supplier', label: 'Supplier', category: 'Supply Chain' },
      { key: 'description', label: 'Description', category: 'Details' },
      { key: 'lastUsed', label: 'Last Used Date', category: 'Usage', transform: (date: string) => date ? new Date(date).toLocaleDateString() : 'N/A' },
      { key: 'lastUsedBy', label: 'Last Used By', category: 'Usage' },
    ]
  };

  const typedStats = stats as Stat[];

  return (
    <div className="flex flex-col">
      <ArticlesHeader onAdd={handleAddArticle} />

  <ArticlesStats stats={typedStats} />

      <ArticlesSearchControls
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        filterCategory={filterCategory}
        setFilterCategory={setFilterCategory}
        viewMode={viewMode}
        setViewMode={setViewMode}
        onExport={handleExport}
        onImport={handleImport}
      />

      {/* Articles List */}
      <div>
        {viewMode === 'list' ? (
          <ArticlesListView
            items={filteredArticles}
            onView={handleArticleClick}
            onEdit={handleEditArticle}
            onTransfer={handleTransferArticle}
          />
        ) : (
          <ArticlesGridView
            items={filteredArticles}
            onView={handleArticleClick}
            onEdit={handleEditArticle}
            onTransfer={handleTransferArticle}
          />
        )}

  {filteredArticles.length === 0 && (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">{t("no_articles_found")}</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm ? t("no_articles_description") : t("no_articles_description_empty")}
            </p>
            <CreateActionButton onClick={handleAddArticle}>
              <Plus className="h-4 w-4 mr-2" />
              {t("add_article")}
            </CreateActionButton>
          </div>
        )}
      </div>

      {/* Transfer Modal */}
  <TransferModal
        isOpen={transferModal.isOpen}
        onClose={() => setTransferModal({isOpen: false})}
        article={transferModal.article}
      />

      {/* Export Modal */}
      <ExportModal 
        open={showExportModal}
        onOpenChange={setShowExportModal}
        data={filteredArticles}
        moduleName={t("title")}
        exportConfig={exportConfig}
      />

      {/* Import Modal */}
      <GenericImportModal<any>
        open={showImportModal}
        onOpenChange={setShowImportModal}
        config={importConfig}
        translationNamespace="articles"
        onImport={handleImportData}
      />
    </div>
  );
}
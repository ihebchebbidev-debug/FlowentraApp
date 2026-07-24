import { Package, Plus, Boxes, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

export function InventoryHeader({ onAddArticle, onImport }: { onAddArticle: () => void; onImport?: () => void }) {
  const { t } = useTranslation('inventory-services');
  const navigate = useNavigate();

  const handleStockManagement = () => {
    navigate('/dashboard/stock-management');
  };

  return (
    <div className="flex items-center justify-between gap-2 p-3 sm:p-4 border-b border-border bg-card/50 backdrop-blur">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
        <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
          <Package className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
        </div>
        <div className="min-w-0">
          <h1 className="text-base sm:text-xl font-semibold text-foreground truncate">{t('title')}</h1>
          <p className="text-px-10 sm:text-px-11 text-muted-foreground truncate">{t('subtitle')}</p>
        </div>
      </div>
      <div className="flex gap-1.5 sm:gap-2 flex-shrink-0">
        <Button
          variant="outline"
          size="sm"
          className="shadow-soft hover-lift"
          onClick={handleStockManagement}
        >
          <Boxes className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">{t('stock')}</span>
        </Button>
        {onImport && (
          <Button
            variant="outline"
            size="sm"
            className="shadow-soft hover-lift"
            onClick={onImport}
          >
            <Upload className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">{t('import')}</span>
          </Button>
        )}
        <Button size="sm" className="bg-primary text-white hover:bg-primary/90 shadow-medium hover-lift" onClick={onAddArticle}>
          <Plus className="h-4 w-4 text-white sm:mr-2" />
          <span className="hidden sm:inline">{t('add_article')}</span>
        </Button>
      </div>
    </div>
  );
}

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
    <div className="flex items-center justify-between p-4 border-b border-border bg-card/50 backdrop-blur">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Package className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-foreground">{t('title')}</h1>
          <p className="text-[11px] text-muted-foreground">{t('subtitle')}</p>
        </div>
      </div>
      <div className="flex gap-2">
        <Button 
          variant="outline" 
          className="shadow-soft hover-lift"
          onClick={handleStockManagement}
        >
          <Boxes className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">{t('stock')}</span>
        </Button>
        {onImport && (
          <Button 
            variant="outline" 
            className="shadow-soft hover-lift"
            onClick={onImport}
          >
            <Upload className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">{t('import')}</span>
          </Button>
        )}
        <Button className="bg-primary text-white hover:bg-primary/90 shadow-medium hover-lift sm:w-auto" onClick={onAddArticle}>
          <Plus className="h-4 w-4 text-white sm:mr-2" />
          <span className="hidden sm:inline">{t('add_article')}</span>
        </Button>
      </div>
    </div>
  );
}

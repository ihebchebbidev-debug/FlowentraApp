import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Plus, Download } from "lucide-react";
import { CreateActionButton } from "@/components/CreateActionButton";

interface Props {
  total: number;
  onExport?: () => void;
}

export function PurchaseOrdersHeader({ total, onExport }: Props) {
  const { t } = useTranslation("purchases");
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-between p-4 border-b border-border bg-card/50 backdrop-blur">
      <div className="flex items-center gap-3 min-w-0">
        <div className="p-2 rounded-lg bg-primary/10 shrink-0">
          <ShoppingCart className="h-5 w-5 md:h-6 md:w-6 text-primary" />
        </div>
        <div className="min-w-0">
          <h1 className="text-lg md:text-xl font-semibold text-foreground truncate">
            {t("orders.title", "Purchase Orders")}
          </h1>
          <p className="text-[11px] text-muted-foreground">
            {t("orders.subtitle", "{{count}} orders", { count: total })}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        {onExport && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={onExport}
            title={t("actions.export", "Export")}
          >
            <Download className="h-4 w-4" />
          </Button>
        )}
        <CreateActionButton
          size="sm"
          onClick={() => navigate("/dashboard/purchases/orders/add")}
        >
          <Plus className="h-4 w-4 mr-1" />
          <span className="hidden sm:inline">
            {t("orders.newOrder", "New Order")}
          </span>
        </CreateActionButton>
      </div>
    </div>
  );
}

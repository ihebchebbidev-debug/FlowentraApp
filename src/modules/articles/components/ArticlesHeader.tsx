import { Plus, Package } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

export function ArticlesHeader({ onAdd }: { onAdd: () => void }) {
  const { t } = useTranslation('articles');
  return (
    <>
      {/* Desktop Header */}
      <div className="hidden md:flex items-center justify-between p-4 border-b border-border bg-card/50 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Package className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground">{t("title")}</h1>
            <p className="text-[11px] text-muted-foreground">{t("subtitle")}</p>
          </div>
        </div>
        <div>
          <Button 
            className="gradient-primary text-primary-foreground shadow-medium hover-lift w-full sm:w-auto"
            onClick={onAdd}
          >
            <Plus className="mr-2 h-4 w-4" />
            {t("add_article")}
          </Button>
        </div>
      </div>

      {/* Mobile Action Bar */}
      <div className="md:hidden flex items-center justify-end p-4 border-b border-border bg-card/50 backdrop-blur">
        <Button 
          size="sm"
          className="gradient-primary text-primary-foreground shadow-medium hover-lift"
          onClick={onAdd}
        >
          <Plus className="mr-2 h-4 w-4" />
          {t("add_article")}
        </Button>
      </div>
    </>
  );
}

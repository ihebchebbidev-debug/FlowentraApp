import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { GitBranch, Plus } from "lucide-react";
import type { ReactNode } from "react";

export function DealsHeader({ children }: { children?: ReactNode }) {
  const { t } = useTranslation('deals');
  return (
    <div className="flex items-center justify-between p-4 border-b border-border bg-card/50 backdrop-blur">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <GitBranch className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-foreground">{t('header.title')}</h1>
          <p className="text-[11px] text-muted-foreground">{t('header.subtitle')}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {children}
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-medium hover-lift">
          <Plus className="mr-2 h-4 w-4" />
          {t('header.add')}
        </Button>
      </div>
    </div>
  );
}

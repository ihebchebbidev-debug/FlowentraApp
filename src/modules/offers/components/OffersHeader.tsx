import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { FileText, Plus } from "lucide-react";

interface OffersHeaderProps {
  onAddOffer: () => void;
}

export function OffersHeader({ onAddOffer }: OffersHeaderProps) {
  const { t } = useTranslation('offers');
  
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground flex items-center gap-4">
          <div className="p-3 rounded-xl bg-chart-1/10 shadow-soft">
            <FileText className="h-10 w-10 text-chart-1" />
          </div>
          {t('offers')}
        </h1>
        <p className="text-muted-foreground mt-3 text-xl">
          {t('description')}
        </p>
      </div>
      <Button 
        className="gradient-primary text-white shadow-medium hover-lift px-6 py-3 text-base"
        onClick={onAddOffer}
      >
        <Plus className="mr-2 h-5 w-5" />
  {t('add_offer')}
      </Button>
    </div>
  );
}
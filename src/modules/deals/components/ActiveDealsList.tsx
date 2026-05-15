import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, DollarSign, User } from "lucide-react";
import { useTranslation } from "react-i18next";

export type Deal = {
  id: number;
  title: string;
  value: string;
  stage: string;
  closeDate: string;
  contact: string;
  company: string;
};

export function ActiveDealsList({ deals }: { deals: Deal[] }) {
  const { t } = useTranslation('deals');
  return (
    <Card className="shadow-card border-0 gradient-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-foreground">{t('active.title')}</CardTitle>
        <CardDescription>{t('active.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {deals.map((deal) => (
            <div key={deal.id} className="flex items-center justify-between p-3 rounded-lg border border-border/30 hover:bg-muted/30 cursor-pointer transition-colors duration-100 group">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-chart-2/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <DollarSign className="h-4 w-4 text-chart-2" />
                </div>
                <div>
                  <h3 className="text-[13px] text-foreground">{deal.title}</h3>
                  <p className="text-[11px] text-muted-foreground">{deal.company}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <User className="h-3 w-3" />
                      {deal.contact}
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {deal.closeDate}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <p className="text-[13px] text-foreground">{deal.value}</p>
                <Badge className={deal.stage === 'Negotiation' ? 'status-warning' : 'status-info'}>
                  {t(`stages.${deal.stage}`)}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

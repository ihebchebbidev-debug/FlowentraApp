import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign } from "lucide-react";
import { useTranslation } from "react-i18next";

export function RevenueStats() {
  const { t } = useTranslation('deals');
  const stats = [
    { label: t('revenue.total'), value: '234,500 TND', badge: t('revenue.total'), badgeClass: 'status-success', color: 'chart-3' },
    { label: t('revenue.thisMonth'), value: '45,678 TND', badge: '+23%', badgeClass: 'status-success', color: 'chart-1' },
    { label: t('revenue.avgDeal'), value: '15,234 TND', badge: '+8%', badgeClass: 'status-info', color: 'chart-2' },
    { label: t('revenue.winRate'), value: '72%', badge: '+5%', badgeClass: 'status-success', color: 'chart-4' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {stats.map((stat, i) => (
        <Card key={i} className="shadow-card border-0 hover-lift gradient-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 rounded-lg bg-${stat.color}/10`}>
                <DollarSign className={`h-4 w-4 text-${stat.color}`} />
              </div>
              <Badge className={stat.badgeClass}>{stat.badge}</Badge>
            </div>
            <p className="text-xs text-muted-foreground font-medium mb-1">{stat.label}</p>
            <p className="text-lg font-bold text-foreground">{stat.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";
import { formatStatValue } from "@/lib/formatters";

export type Stat = {
  label: string;
  value: number | string;
  change: string;
  icon: any;
  color: string; // tailwind color key like chart-1
};

export function ArticlesStats({ stats }: { stats: Stat[] }) {
  const { t } = useTranslation('articles');
  return (
    <div className="p-3 sm:p-4 border-b border-border">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {stats.map((stat, index) => (
          <Card key={index} className="shadow-card border-0 hover-lift gradient-card group">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 sm:p-2.5 rounded-lg bg-${stat.color}/10 group-hover:bg-${stat.color}/20 transition-all`}>
                  <stat.icon className={`h-4 w-4 sm:h-5 sm:w-5 text-${stat.color}`} />
                </div>
                <Badge className="status-success text-xs px-1.5 py-0.5">{stat.change}</Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-semibold mb-1">{t(stat.label)}</p>
                <p className="text-sm font-bold text-foreground">{formatStatValue(stat.value)}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

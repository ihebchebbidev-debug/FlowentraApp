import { Card, CardContent } from "@/components/ui/card";
import { formatStatValue } from "@/lib/formatters";

export type InventoryStat = {
  label: string;
  value: number | string;
  icon: any;
  color: string; // tailwind token like chart-1
  filter: 'all' | 'inventory' | 'service' | 'low_stock' | string;
};

export function InventoryStats({ stats, selected, onSelect }: { stats: InventoryStat[]; selected: string; onSelect: (filter: any) => void; }) {
  return (
    <div className="p-3 sm:p-4 border-b border-border">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {stats.map((stat, index) => {
          const isSelected = selected === stat.filter;
          return (
            <Card 
              key={index} 
              className={`shadow-card hover-lift gradient-card group cursor-pointer transition-all hover:shadow-lg ${
                isSelected 
                  ? 'border-2 border-primary bg-primary/5' 
                  : 'border-0'
              }`}
              onClick={() => onSelect(stat.filter)}
            >
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`p-2 rounded-lg transition-all flex-shrink-0 ${
                      isSelected 
                        ? 'bg-primary/20' 
                        : `bg-${stat.color}/10 group-hover:bg-${stat.color}/20`
                    }`}>
                      <stat.icon className={`h-4 w-4 transition-all ${
                        isSelected 
                          ? 'text-primary' 
                          : `text-${stat.color}`
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground font-medium truncate">{stat.label}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-foreground">{formatStatValue(stat.value)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

import { Card, CardContent } from "@/components/ui/card";
import { formatStatValue, formatCurrencyValue } from "@/lib/formatters";
import { 
  FileText,
  ShoppingCart,
  Wrench,
  Bell,
  Target,
  CheckCircle,
  DollarSign
} from "lucide-react";

interface WorkflowStatsProps {
  totalOffers: number;
  activeOffers: number;
  acceptedOffers: number;
  totalSales: number;
  activeSales: number;
  serviceOrders: number;
  unreadNotifications: number;
  totalValue: number;
  selectedStat: string;
  onStatClick: (filter: string) => void;
}

export function WorkflowStats({
  totalOffers,
  activeOffers,
  acceptedOffers,
  totalSales,
  activeSales,
  serviceOrders,
  unreadNotifications,
  totalValue,
  selectedStat,
  onStatClick
}: WorkflowStatsProps) {
  const stats = [
    {
      label: "Devis actifs",
      value: formatStatValue(activeOffers),
      icon: FileText,
      color: "chart-1",
      filter: 'offers'
    },
    {
      label: "Ventes en cours",
      value: formatStatValue(activeSales),
      icon: ShoppingCart,
      color: "chart-2", 
      filter: 'sales'
    },
    {
      label: "Services planifiés",
      value: formatStatValue(serviceOrders),
      icon: Wrench,
      color: "chart-3",
      filter: 'services'
    },
    {
      label: "Valeur totale",
      value: formatCurrencyValue(totalValue, '€'),
      icon: DollarSign,
      color: "chart-4",
      filter: 'value'
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {stats.map((stat, index) => {
        const isSelected = selectedStat === stat.filter;
        return (
          <Card 
            key={index} 
            className={`shadow-card hover-lift gradient-card group cursor-pointer transition-all hover:shadow-lg ${
              isSelected 
                ? 'border-2 border-primary bg-primary/5' 
                : 'border-0'
            }`}
            onClick={() => onStatClick(stat.filter)}
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
                  <p className="text-sm font-bold text-foreground">{stat.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
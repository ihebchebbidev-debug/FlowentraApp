import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { ShoppingCart, Clock, CheckCircle2, DollarSign } from "lucide-react";
import { formatStatValue } from "@/lib/formatters";
import { useCurrency } from "@/shared/hooks/useCurrency";
import { cn } from "@/lib/utils";

interface Stats {
  total: number;
  open: number;
  received: number;
  totalValue: number;
}

interface Props {
  stats: Stats;
  selected: string;
  onSelect: (key: string) => void;
}

export function PurchaseOrdersStats({ stats, selected, onSelect }: Props) {
  const { t, i18n } = useTranslation("purchases");
  const { current: currency } = useCurrency();

  const fmt = (n: number) =>
    n.toLocaleString(i18n.language || undefined, { minimumFractionDigits: 2 });

  const cards: Array<{
    key: string;
    label: string;
    value: string | number;
    icon: typeof ShoppingCart;
    color: string;
    bg: string;
    readonly?: boolean;
  }> = [
    {
      key: "all",
      label: t("orders.stats.total", "Total Orders"),
      value: formatStatValue(stats.total),
      icon: ShoppingCart,
      color: "text-chart-1",
      bg: "bg-chart-1/10",
    },
    {
      key: "open",
      label: t("orders.stats.open", "Open"),
      value: formatStatValue(stats.open),
      icon: Clock,
      color: "text-chart-2",
      bg: "bg-chart-2/10",
    },
    {
      key: "received",
      label: t("orders.stats.received", "Received"),
      value: formatStatValue(stats.received),
      icon: CheckCircle2,
      color: "text-chart-3",
      bg: "bg-chart-3/10",
    },
    {
      key: "value",
      label: t("orders.stats.value", "Total Value"),
      value: `${fmt(stats.totalValue)} ${currency.code}`,
      icon: DollarSign,
      color: "text-chart-4",
      bg: "bg-chart-4/10",
      readonly: true,
    },
  ];

  return (
    <div className="p-3 sm:p-4 border-b border-border">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {cards.map((s) => {
          const isSelected = selected === s.key;
          const interactive = !s.readonly;
          return (
            <Card
              key={s.key}
              className={cn(
                "shadow-sm border transition-all",
                interactive &&
                  "cursor-pointer hover:shadow-md hover:-translate-y-0.5",
                isSelected ? "border-primary bg-primary/5" : "border-border",
              )}
              onClick={() =>
                interactive && onSelect(selected === s.key ? "all" : s.key)
              }
            >
              <CardContent className="p-3">
                <div className="flex items-center gap-3">
                  <div className={cn("p-2 rounded-lg shrink-0", s.bg)}>
                    <s.icon className={cn("h-4 w-4", s.color)} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-px-11 text-muted-foreground truncate">
                      {s.label}
                    </div>
                    <div className="text-base sm:text-lg font-semibold text-foreground truncate">
                      {s.value}
                    </div>
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

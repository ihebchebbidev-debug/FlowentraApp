import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Send, Check, X } from "lucide-react";
import { formatStatValue } from "@/lib/formatters";
import { OfferStats } from "../types";

interface OffersStatsProps {
  stats: OfferStats;
  selectedStat?: string | null;
  onStatClick?: (filter: string) => void;
}

export function OffersStats({ stats, selectedStat, onStatClick }: OffersStatsProps) {
  const { t } = useTranslation('offers');

  const statsCards = [
    {
      title: t('draft', 'Created'),
      value: formatStatValue(stats.draftOffers ?? 0),
      icon: FileText,
      color: "chart-1",
      filter: "draft",
    },
    {
      title: t('sent', 'Sent'),
      value: formatStatValue(stats.activeOffers),
      icon: Send,
      color: "chart-2",
      filter: "sent",
    },
    {
      title: t('accepted_offers', 'Accepted'),
      value: formatStatValue(stats.acceptedOffers),
      icon: Check,
      color: "chart-3",
      filter: "accepted",
    },
    {
      title: t('declined_offers', 'Declined'),
      value: formatStatValue(stats.declinedOffers),
      icon: X,
      color: "chart-4",
      filter: "declined",
    }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 sm:gap-4">
      {statsCards.map((stat, index) => {
        const isSelected = selectedStat === stat.filter;
        return (
          <Card
            key={index}
            className={`shadow-card hover-lift gradient-card group cursor-pointer transition-all hover:shadow-lg ${isSelected
                ? 'border-2 border-primary bg-primary/5'
                : 'border-0'
              }`}
            onClick={() => onStatClick?.(stat.filter)}
          >
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={`p-2 rounded-lg transition-all flex-shrink-0 ${isSelected
                      ? 'bg-primary/20'
                      : `bg-${stat.color}/10 group-hover:bg-${stat.color}/20`
                    }`}>
                    <stat.icon className={`h-4 w-4 transition-all ${isSelected
                        ? 'text-primary'
                        : `text-${stat.color}`
                      }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground font-medium truncate">{stat.title}</p>
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

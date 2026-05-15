import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Clock, DollarSign, TrendingUp, Users } from 'lucide-react';
import { TimeExpenseEntry } from '../types';

interface SummaryCardsProps {
  entries: TimeExpenseEntry[];
  className?: string;
}

export function SummaryCards({ entries, className }: SummaryCardsProps) {
  const { t } = useTranslation();

  const stats = React.useMemo(() => {
    const totalTime = entries.reduce((sum, entry) => sum + entry.timeBooked, 0);
    const totalExpenses = entries.reduce((sum, entry) => sum + entry.expenses, 0);
    const totalEarnings = entries.reduce((sum, entry) => sum + (entry.timeBooked / 60 * entry.hourlyRate), 0);
    const uniqueTechnicians = new Set(entries.map(entry => entry.userId)).size;

    return {
      totalTime,
      totalExpenses,
      totalEarnings,
      uniqueTechnicians
    };
  }, [entries]);

  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins} ${t('time-expenses:time_format.minutes')}`;
    if (mins === 0) return `${hours} ${t('time-expenses:time_format.hours')}`;
    return `${hours}${t('time-expenses:time_format.hour_short')} ${mins}${t('time-expenses:time_format.minute_short')}`;
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('fr-CA', {
      style: 'currency',
      currency: 'CAD'
    }).format(amount);
  };

  const cards = [
    {
      title: t('time-expenses:summary_cards.time_booked'),
      value: formatTime(stats.totalTime),
      icon: Clock,
      color: 'text-success',
      bgColor: 'bg-success/10'
    },
    {
      title: t('time-expenses:summary_cards.expenses_total'),
      value: formatCurrency(stats.totalExpenses),
      icon: DollarSign,
      color: 'text-warning',
      bgColor: 'bg-warning/10'
    },
    {
      title: t('time-expenses:summary_cards.earnings_total'),
      value: formatCurrency(stats.totalEarnings),
      icon: TrendingUp,
      color: 'text-info',
      bgColor: 'bg-info/10'
    },
    {
      title: t('time-expenses:summary_cards.technicians_active'),
      value: stats.uniqueTechnicians.toString(),
      icon: Users,
      color: 'text-accent',
      bgColor: 'bg-accent/10'
    }
  ];

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card key={index} className="p-6 hover-lift shadow-card">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  {card.title}
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {card.value}
                </p>
              </div>
              <div className={`p-3 rounded-lg ${card.bgColor}`}>
                <Icon className={`h-6 w-6 ${card.color}`} />
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
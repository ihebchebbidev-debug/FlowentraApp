import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';

interface Props {
  active: number;
  total: number;
}

export function PluginCounter({ active, total }: Props) {
  const { t } = useTranslation('settings');
  const pct = total > 0 ? Math.round((active / total) * 100) : 0;
  return (
    <Card className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="text-sm text-muted-foreground uppercase tracking-wide">
            {t('plugins.title')}
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-4xl font-bold text-foreground">{active}</span>
            <span className="text-xl text-muted-foreground">{t('plugins.of')} {total}</span>
          </div>
          <div className="mt-1 text-sm text-muted-foreground">
            {t('plugins.active')}
          </div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-semibold text-primary">{pct}%</div>
        </div>
      </div>
      <div className="mt-4 h-2 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </Card>
  );
}

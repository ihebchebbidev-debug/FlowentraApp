import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import type { PluginCategory } from '@/modules/shared/plugins';

const CATEGORIES: Array<PluginCategory | 'all'> = [
  'all', 'crm', 'field', 'hr', 'finance', 'system', 'comms', 'analytics'
];

interface Props {
  value: PluginCategory | 'all';
  onChange: (cat: PluginCategory | 'all') => void;
  counts: Record<string, number>;
}

export function CategoryFilter({ value, onChange, counts }: Props) {
  const { t } = useTranslation('settings');
  return (
    <div className="flex flex-wrap gap-2">
      {CATEGORIES.map((cat) => {
        const isActive = value === cat;
        const count = counts[cat] ?? 0;
        return (
          <Button
            key={cat}
            type="button"
            size="sm"
            variant={isActive ? 'default' : 'outline'}
            onClick={() => onChange(cat)}
            className="gap-2"
          >
            <span>{t(`plugins.categories.${cat}`)}</span>
            <span className={`text-xs rounded-full px-2 py-0.5 ${isActive ? 'bg-primary-foreground/20' : 'bg-muted'}`}>
              {count}
            </span>
          </Button>
        );
      })}
    </div>
  );
}

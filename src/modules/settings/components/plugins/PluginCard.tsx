import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { Lock } from 'lucide-react';
import type { PluginRuntimeState } from '@/modules/shared/plugins';
import { getLucideIcon } from './lucideIconResolver';

interface Props {
  state: PluginRuntimeState;
  onToggle: (code: string, enabled: boolean) => void;
  isToggling?: boolean;
}

export function PluginCard({ state, onToggle, isToggling }: Props) {
  const { manifest, isEnabled, hasBrokenDependency, enabledDependents } = state;
  const { t } = useTranslation(['settings', manifest.moduleKey]);
  const Icon = getLucideIcon(manifest.icon);

  const name = t(`${manifest.moduleKey}:plugin.name`, { defaultValue: manifest.moduleKey });
  const description = t(`${manifest.moduleKey}:plugin.description`, { defaultValue: '' });
  const categoryLabel = t(`plugins.categories.${manifest.category}`);

  return (
    <Card
      className={`relative transition-all ${
        isEnabled ? 'border-border' : 'border-dashed border-muted-foreground/30 opacity-75'
      }`}
    >
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 pb-3">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div
            className={`shrink-0 h-10 w-10 rounded-lg flex items-center justify-center ${
              isEnabled ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
            }`}
          >
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-base truncate">{name}</h3>
              {manifest.isCore && (
                <Badge variant="secondary" className="text-[10px] gap-1">
                  <Lock className="h-3 w-3" /> {t('plugins.coreLocked')}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-[10px] font-mono">
                {manifest.code}
              </Badge>
              <Badge variant="secondary" className="text-[10px]">
                {categoryLabel}
              </Badge>
            </div>
          </div>
        </div>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Switch
                  checked={isEnabled}
                  disabled={manifest.isCore || isToggling}
                  onCheckedChange={(checked) => onToggle(manifest.code, checked)}
                  aria-label={isEnabled ? t('plugins.toggleOff') : t('plugins.toggleOn')}
                />
              </span>
            </TooltipTrigger>
            {manifest.isCore && (
              <TooltipContent side="left">
                <p className="text-xs">{t('plugins.coreLockedDesc')}</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </CardHeader>

      <CardContent className="space-y-2 pt-0">
        {description && (
          <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
        )}

        {manifest.dependencies.length > 0 && (
          <div className="text-xs text-muted-foreground">
            <span className="font-medium">{t('plugins.dependencies')}: </span>
            <span className="font-mono">{manifest.dependencies.join(', ')}</span>
          </div>
        )}

        {hasBrokenDependency && (
          <div className="text-xs text-destructive">
            ⚠ {t('plugins.dependencyWarning')}
          </div>
        )}

        {!isEnabled && enabledDependents.length > 0 && (
          <div className="text-xs text-amber-600 dark:text-amber-400">
            ⚠ {enabledDependents.length} {t('plugins.dependencyWarning')}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

import { useTranslation } from 'react-i18next';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle } from 'lucide-react';
import type { PluginManifest } from '@/modules/shared/plugins';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plugin: PluginManifest | null;
  dependents: PluginManifest[];
  onConfirm: () => void;
  onCascade: () => void;
}

export function DependencyModal({
  open, onOpenChange, plugin, dependents, onConfirm, onCascade,
}: Props) {
  const { t } = useTranslation('settings');
  if (!plugin) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            {t('plugins.dependencyWarning')}
          </DialogTitle>
          <DialogDescription>
            {t('plugins.dependencyConfirm', { name: plugin.code })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 max-h-60 overflow-y-auto">
          {dependents.map((d) => (
            <div key={d.code} className="flex items-center gap-2 text-sm border rounded-md px-3 py-2">
              <Badge variant="outline" className="font-mono text-px-10">{d.code}</Badge>
              <span className="text-muted-foreground">{d.moduleKey}</span>
            </div>
          ))}
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {t('plugins.cancel')}
          </Button>
          <Button variant="destructive" onClick={onCascade}>
            {t('plugins.disableAll')}
          </Button>
          <Button onClick={onConfirm}>
            {t('plugins.confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

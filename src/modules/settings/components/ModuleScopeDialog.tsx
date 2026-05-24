/**
 * ModuleScopeDialog
 * Admin-only dialog (opened from Companies tab) to configure, per module,
 * whether data is SHARED across all companies or ISOLATED per company.
 */
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Search, Layers, Building2, Save, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { usePlugins } from '@/modules/shared/plugins';
import {
  getModuleScopeMap,
  setModuleScopeMap,
  DEFAULT_MODULE_SCOPE,
  type ModuleScope,
} from '@/utils/moduleScope';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function ModuleScopeDialog({ open, onOpenChange }: Props) {
  const { t } = useTranslation('settings');
  const { toast } = useToast();
  const { runtimeState } = usePlugins();

  const [search, setSearch] = useState('');
  const [draft, setDraft] = useState<Record<string, ModuleScope>>({});
  const [saving, setSaving] = useState(false);

  // Hydrate draft whenever dialog opens
  useEffect(() => {
    if (open) {
      setDraft(getModuleScopeMap());
      setSearch('');
    }
  }, [open]);

  const enabledModules = useMemo(
    () => runtimeState.filter((s) => s.isEnabled).map((s) => s.manifest),
    [runtimeState]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return enabledModules;
    return enabledModules.filter((m) => {
      const name = t(`${m.moduleKey}:plugin.name`, { defaultValue: m.moduleKey }).toLowerCase();
      return name.includes(q) || m.code.toLowerCase().includes(q);
    });
  }, [enabledModules, search, t]);

  const sharedCount = useMemo(
    () => enabledModules.filter((m) => (draft[m.code] ?? DEFAULT_MODULE_SCOPE) === 'shared').length,
    [enabledModules, draft]
  );

  const setAll = (scope: ModuleScope) => {
    const next: Record<string, ModuleScope> = { ...draft };
    enabledModules.forEach((m) => { next[m.code] = scope; });
    setDraft(next);
  };

  const handleToggle = (code: string, shared: boolean) => {
    setDraft((prev) => ({ ...prev, [code]: shared ? 'shared' : 'isolated' }));
  };

  const handleSave = () => {
    setSaving(true);
    try {
      setModuleScopeMap(draft);
      toast({
        title: t('moduleScope.savedTitle', 'Module scope updated'),
        description: t('moduleScope.savedDesc', 'Per-module data sharing settings have been saved.'),
      });
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" />
            {t('moduleScope.title', 'Module Data Scope')}
          </DialogTitle>
          <DialogDescription>
            {t(
              'moduleScope.description',
              'Choose, per module, whether data is shared across all companies or kept isolated per company.'
            )}
          </DialogDescription>
        </DialogHeader>

        {/* Toolbar */}
        <div className="flex items-center gap-2 pt-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('moduleScope.searchPlaceholder', 'Search modules…')}
              className="pl-9 h-9"
            />
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => setAll('isolated')}>
            {t('moduleScope.allIsolated', 'All isolated')}
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => setAll('shared')}>
            {t('moduleScope.allShared', 'All shared')}
          </Button>
        </div>

        <div className="text-xs text-muted-foreground px-1">
          {t('moduleScope.summary', '{{shared}} of {{total}} modules shared across all companies', {
            shared: sharedCount,
            total: enabledModules.length,
          })}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto -mx-1 px-1 space-y-2">
          {filtered.length === 0 ? (
            <div className="text-center py-10 text-sm text-muted-foreground">
              {t('moduleScope.empty', 'No modules match your search.')}
            </div>
          ) : (
            filtered.map((m) => {
              const scope = draft[m.code] ?? DEFAULT_MODULE_SCOPE;
              const isShared = scope === 'shared';
              const name = t(`${m.moduleKey}:plugin.name`, { defaultValue: m.moduleKey });
              return (
                <div
                  key={m.code}
                  className="flex items-center justify-between gap-3 p-3 rounded-lg border border-border/50 bg-muted/20 hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-2 rounded-lg shrink-0 ${isShared ? 'bg-primary/15' : 'bg-muted'}`}>
                      {isShared
                        ? <Layers className="h-4 w-4 text-primary" />
                        : <Building2 className="h-4 w-4 text-muted-foreground" />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground truncate">{name}</p>
                        <Badge
                          variant={isShared ? 'default' : 'secondary'}
                          className="text-[10px] h-4 px-1.5"
                        >
                          {isShared
                            ? t('moduleScope.shared', 'Shared')
                            : t('moduleScope.isolated', 'Isolated')}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground font-mono truncate">{m.code}</p>
                    </div>
                  </div>
                  <Switch
                    checked={isShared}
                    onCheckedChange={(v) => handleToggle(m.code, v)}
                    aria-label={t('moduleScope.toggleAria', 'Toggle shared scope')}
                  />
                </div>
              );
            })
          )}
        </div>

        <DialogFooter className="pt-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button type="button" onClick={handleSave} disabled={saving} className="gradient-primary">
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            {t('common.save', 'Save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

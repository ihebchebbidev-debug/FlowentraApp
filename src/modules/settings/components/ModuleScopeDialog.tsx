/**
 * ModuleScopeDialog — backend-backed per-module data scope editor.
 *
 * Source of truth: GET/PUT /api/module-scope (see Backend/Modules/Settings/Controllers/ModuleScopeController).
 * Keys are logical module keys (manifest.moduleKey, e.g. "contacts", "articles"),
 * matching the [ModuleScope("...")] attribute on backend entities and the
 * seeded rows in ModuleScopeSettings. The plugin code (PL0001CONTACTS, …) is
 * NOT used here — it would not match the backend.
 *
 * Scope vocabulary: 'shared' | 'per_company'.
 *   shared      → backend forces TenantId = 0 (one dataset for every company)
 *   per_company → backend uses current company TenantId (default)
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
import { API_URL } from '@/config/api';
import { getCurrentTenant, TENANT_HEADER } from '@/utils/tenant';

type Scope = 'shared' | 'per_company';
const DEFAULT_SCOPE: Scope = 'per_company';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

function authHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const h: Record<string, string> = { Accept: 'application/json', ...extra };
  const token =
    localStorage.getItem('access_token') ||
    sessionStorage.getItem('access_token') ||
    localStorage.getItem('auth_token') ||
    sessionStorage.getItem('auth_token') ||
    null;
  if (token) h.Authorization = `Bearer ${token}`;
  const tenant = getCurrentTenant();
  if (tenant) h[TENANT_HEADER] = tenant;
  return h;
}

export function ModuleScopeDialog({ open, onOpenChange }: Props) {
  const { t } = useTranslation('settings');
  const { toast } = useToast();
  const { runtimeState } = usePlugins();

  const [search, setSearch] = useState('');
  const [draft, setDraft] = useState<Record<string, Scope>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const enabledModules = useMemo(
    () => runtimeState.filter((s) => s.isEnabled).map((s) => s.manifest),
    [runtimeState]
  );

  // Hydrate from backend whenever the dialog opens
  useEffect(() => {
    if (!open) return;
    setSearch('');
    setLoading(true);
    fetch(`${API_URL}/api/module-scope`, { headers: authHeaders() })
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const rows: { moduleKey: string; scope: Scope }[] = await res.json();
        const map: Record<string, Scope> = {};
        rows.forEach((r) => { map[r.moduleKey] = r.scope; });
        setDraft(map);
      })
      .catch((err) => {
        toast({
          title: t('moduleScope.loadFailedTitle', 'Could not load module scope'),
          description: String(err?.message ?? err),
          variant: 'destructive',
        });
        setDraft({});
      })
      .finally(() => setLoading(false));
  }, [open, t, toast]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return enabledModules;
    return enabledModules.filter((m) => {
      const name = t(`${m.moduleKey}:plugin.name`, { defaultValue: m.moduleKey }).toLowerCase();
      return name.includes(q) || m.moduleKey.toLowerCase().includes(q);
    });
  }, [enabledModules, search, t]);

  const sharedCount = useMemo(
    () => enabledModules.filter((m) => (draft[m.moduleKey] ?? DEFAULT_SCOPE) === 'shared').length,
    [enabledModules, draft]
  );

  const setAll = (scope: Scope) => {
    const next: Record<string, Scope> = { ...draft };
    enabledModules.forEach((m) => { next[m.moduleKey] = scope; });
    setDraft(next);
  };

  const handleToggle = (moduleKey: string, shared: boolean) => {
    setDraft((prev) => ({ ...prev, [moduleKey]: shared ? 'shared' : 'per_company' }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Only push entries for modules currently visible to the admin.
      const payload = enabledModules.map((m) => ({
        moduleKey: m.moduleKey,
        scope: draft[m.moduleKey] ?? DEFAULT_SCOPE,
      }));
      const res = await fetch(`${API_URL}/api/module-scope`, {
        method: 'PUT',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`HTTP ${res.status} ${text}`);
      }
      toast({
        title: t('moduleScope.savedTitle', 'Module scope updated'),
        description: t('moduleScope.savedDesc', 'Per-module data sharing settings have been saved.'),
      });
      onOpenChange(false);
    } catch (err: unknown) {
      toast({
        title: t('moduleScope.saveFailedTitle', 'Could not save module scope'),
        description: err instanceof Error ? err.message : String(err),
        variant: 'destructive',
      });
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
              disabled={loading}
            />
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => setAll('per_company')} disabled={loading}>
            {t('moduleScope.allIsolated', 'All isolated')}
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => setAll('shared')} disabled={loading}>
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
          {loading ? (
            <div className="flex items-center justify-center py-10 text-sm text-muted-foreground gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t('common.loading', 'Loading…')}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-10 text-sm text-muted-foreground">
              {t('moduleScope.empty', 'No modules match your search.')}
            </div>
          ) : (
            filtered.map((m) => {
              const scope = draft[m.moduleKey] ?? DEFAULT_SCOPE;
              const isShared = scope === 'shared';
              const name = t(`${m.moduleKey}:plugin.name`, { defaultValue: m.moduleKey });
              return (
                <div
                  key={m.moduleKey}
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
                      <p className="text-xs text-muted-foreground font-mono truncate">{m.moduleKey}</p>
                    </div>
                  </div>
                  <Switch
                    checked={isShared}
                    onCheckedChange={(v) => handleToggle(m.moduleKey, v)}
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
          <Button type="button" onClick={handleSave} disabled={saving || loading} className="gradient-primary">
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            {t('common.save', 'Save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Hash, Eye, Save, AlertTriangle, CheckCircle2, FileText, ShoppingCart, Wrench, Truck, Copy, Info } from 'lucide-react';
import { numberingApi, type NumberingSettingsDto, type NumberingEntity, type UpdateNumberingRequest } from '@/services/numberingApi';

const DEFAULT_CONFIGS: Record<NumberingEntity, { template: string; strategy: string; resetFrequency: string; startValue: number; padding: number }> = {
  Offer: { template: 'OFR-{YEAR}-{SEQ:6}', strategy: 'atomic_counter', resetFrequency: 'yearly', startValue: 1, padding: 6 },
  Sale: { template: 'SALE-{DATE:yyyyMMdd}-{GUID:5}', strategy: 'guid', resetFrequency: 'never', startValue: 1, padding: 5 },
  ServiceOrder: { template: 'SO-{DATE:yyyyMMdd}-{GUID:6}', strategy: 'guid', resetFrequency: 'never', startValue: 1, padding: 6 },
  Dispatch: { template: 'DISP-{TS:yyyyMMddHHmmss}', strategy: 'timestamp_random', resetFrequency: 'never', startValue: 1, padding: 6 },
};

const ENTITIES: { key: NumberingEntity; label: string; icon: React.ElementType; defaultExample: string }[] = [
  { key: 'Offer', label: 'Offres', icon: FileText, defaultExample: 'OFR-2026-000001' },
  { key: 'Sale', label: 'Ventes', icon: ShoppingCart, defaultExample: 'SALE-20260223-A1B2C' },
  { key: 'ServiceOrder', label: 'Ordres de Service', icon: Wrench, defaultExample: 'SO-20260223-A1B2C3' },
  { key: 'Dispatch', label: 'Dispatches', icon: Truck, defaultExample: 'DISP-20260223143022' },
];

const STRATEGIES = [
  { value: 'atomic_counter', label: 'Atomic Counter (DB)', description: 'Safe for multi-instance' },
  { value: 'db_sequence', label: 'DB Sequence', description: 'Native PostgreSQL sequence' },
  { value: 'timestamp_random', label: 'Timestamp + Random', description: 'No sequence needed' },
  { value: 'guid', label: 'GUID / Random', description: 'Unique random values' },
];

const RESET_OPTIONS = [
  { value: 'never', label: 'Never' },
  { value: 'yearly', label: 'Yearly' },
  { value: 'monthly', label: 'Monthly' },
];

const TOKEN_HELP = [
  { token: '{YYYY}', alias: '{YEAR}', desc: 'Année 4 chiffres', example: '2026', category: 'date' as const },
  { token: '{YY}', desc: 'Année 2 chiffres', example: '26', category: 'date' as const },
  { token: '{DATE:yyyyMMdd}', desc: 'Date formatée', example: '20260223', category: 'date' as const, editable: true, hint: 'Changez le format: yyyy=année, MM=mois, dd=jour' },
  { token: '{SEQ}', desc: 'Séquence auto', example: '1, 2, 3...', category: 'sequence' as const },
  { token: '{SEQ:6}', desc: 'Séquence avec zéros', example: '000001', category: 'sequence' as const, editable: true, hint: 'Le chiffre = nombre de digits (ex: 4 → 0001)' },
  { token: '{GUID:5}', desc: 'Code aléatoire', example: 'A1B2C', category: 'random' as const, editable: true, hint: 'Le chiffre = longueur (ex: 8 → A1B2C3D4)' },
  { token: '{TS:yyyyMMddHHmmss}', desc: 'Horodatage', example: '20260223143022', category: 'date' as const, editable: true, hint: 'HH=heure, mm=minutes, ss=secondes' },
  { token: '{ENTITY}', desc: 'Nom entité', example: 'Offer', category: 'other' as const },
];

const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
  date: { label: '📅 Date & Temps', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' },
  sequence: { label: '🔢 Séquence', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
  random: { label: '🎲 Aléatoire', color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400' },
  other: { label: '📋 Autre', color: 'bg-muted text-muted-foreground' },
};

interface EntityEditorState {
  isEnabled: boolean;
  template: string;
  strategy: string;
  resetFrequency: string;
  startValue: number;
  padding: number;
  preview: string[];
  warnings: string[];
  isDirty: boolean;
}

function initState(dto: NumberingSettingsDto): EntityEditorState {
  return {
    isEnabled: dto.isEnabled,
    template: dto.template,
    strategy: dto.strategy,
    resetFrequency: dto.resetFrequency,
    startValue: dto.startValue,
    padding: dto.padding,
    preview: [],
    warnings: [],
    isDirty: false,
  };
}

export function NumberingSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editors, setEditors] = useState<Record<string, EntityEditorState>>({});
  const [expandedEntity, setExpandedEntity] = useState<string | null>(null);

  const { data: settings, isLoading } = useQuery({
    queryKey: ['numbering-settings'],
    queryFn: async () => {
      try {
        const result = await numberingApi.getAll();
        if (result && result.length > 0) return result;
      } catch {
        // API not deployed yet — fall through to defaults
      }
      // Return defaults matching backend GetDefaultDto
      return ENTITIES.map(e => ({
        id: 0,
        entityName: e.key,
        isEnabled: false,
        template: DEFAULT_CONFIGS[e.key].template,
        strategy: DEFAULT_CONFIGS[e.key].strategy as any,
        resetFrequency: DEFAULT_CONFIGS[e.key].resetFrequency as any,
        startValue: DEFAULT_CONFIGS[e.key].startValue,
        padding: DEFAULT_CONFIGS[e.key].padding,
        updatedAt: '',
      }));
    },
  });

  // Initialize editors from settings AND auto-generate previews
  useEffect(() => {
    if (settings && Object.keys(editors).length === 0) {
      const init: Record<string, EntityEditorState> = {};
      settings.forEach(s => {
        const state = initState(s);
        state.preview = generateClientPreview(state, s.entityName);
        init[s.entityName] = state;
      });
      setEditors(init);
    }
  }, [settings]);

  const updateField = useCallback((entity: string, field: string, value: any) => {
    setEditors(prev => {
      const updated = { ...prev[entity], [field]: value, isDirty: true };
      // Auto-regenerate preview when template or settings change
      if (['template', 'strategy', 'resetFrequency', 'startValue', 'padding'].includes(field)) {
        updated.preview = generateClientPreview(updated, entity);
      }
      return { ...prev, [entity]: updated };
    });
  }, []);

  const handlePreview = useCallback(async (entity: string) => {
    const state = editors[entity];
    if (!state) return;
    try {
      const result = await numberingApi.preview({
        entity,
        template: state.template,
        strategy: state.strategy,
        resetFrequency: state.resetFrequency,
        startValue: state.startValue,
        padding: state.padding,
        count: 5,
      });
      setEditors(prev => ({
        ...prev,
        [entity]: { ...prev[entity], preview: result.preview, warnings: result.warnings },
      }));
    } catch {
      // Use client-side preview as fallback
      const preview = generateClientPreview(state, entity);
      setEditors(prev => ({
        ...prev,
        [entity]: { ...prev[entity], preview, warnings: [] },
      }));
    }
  }, [editors]);

  const saveMutation = useMutation({
    mutationFn: async ({ entity, request }: { entity: NumberingEntity; request: UpdateNumberingRequest }) => {
      return numberingApi.save(entity, request);
    },
    onSuccess: (_, { entity }) => {
      toast({ title: 'Saved', description: `Numbering settings for ${entity} updated.` });
      setEditors(prev => ({
        ...prev,
        [entity]: { ...prev[entity], isDirty: false },
      }));
      queryClient.invalidateQueries({ queryKey: ['numbering-settings'] });
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: err.message || 'Failed to save', variant: 'destructive' });
    },
  });

  const handleSave = (entityKey: NumberingEntity) => {
    const state = editors[entityKey];
    if (!state) return;
    saveMutation.mutate({
      entity: entityKey,
      request: {
        isEnabled: state.isEnabled,
        template: state.template,
        strategy: state.strategy,
        resetFrequency: state.resetFrequency,
        startValue: state.startValue,
        padding: state.padding,
      },
    });
  };

  if (isLoading) {
    return (
      <Card className="shadow-card border-0 bg-card">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-16 bg-muted/30 rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-card border-0 bg-card">
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
          <Hash className="h-4 w-4 text-primary" />
          Modèles de Numérotation
        </CardTitle>
        <CardDescription className="text-xs">
          Configurez les formats de numérotation pour les Offres, Ventes, Ordres de Service et Dispatches
        </CardDescription>
      </CardHeader>

      <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0 space-y-3">
        {/* Token reference table */}
        <div className="rounded-lg border border-border/50 bg-muted/10 overflow-hidden">
          <div className="px-4 py-2.5 bg-muted/30 border-b border-border/50 flex items-center justify-between">
            <p className="text-xs font-medium text-foreground flex items-center gap-2">
              <Info className="h-3.5 w-3.5 text-muted-foreground" />
              Référence des jetons
            </p>
            <p className="text-[10px] text-muted-foreground">Cliquez sur un jeton pour le copier</p>
          </div>

          <div className="divide-y divide-border/30">
            {/* Table header */}
            <div className="grid grid-cols-[140px_1fr_120px] sm:grid-cols-[160px_1fr_140px] px-4 py-1.5 bg-muted/20">
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Jeton</span>
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Description</span>
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Exemple</span>
            </div>

            {TOKEN_HELP.map((t, idx) => {
              const isFirstInCategory = idx === 0 || TOKEN_HELP[idx - 1].category !== t.category;
              return (
                <div key={t.token}>
                  {isFirstInCategory && (
                    <div className="px-4 py-1.5 bg-muted/15">
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                        {CATEGORY_LABELS[t.category]?.label}
                      </span>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(t.token);
                      toast({ title: 'Copié', description: `${t.token} dans le presse-papier` });
                    }}
                    className="w-full grid grid-cols-[140px_1fr_120px] sm:grid-cols-[160px_1fr_140px] px-4 py-2 hover:bg-primary/5 transition-colors text-left group"
                  >
                    <code className="text-[11px] font-mono text-primary flex items-center gap-1.5">
                      {t.token}
                      <Copy className="h-2.5 w-2.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </code>
                    <span className="text-[11px] text-foreground/80">
                      {t.desc}
                      {t.hint && (
                        <span className="text-muted-foreground ml-1 hidden sm:inline">— {t.hint}</span>
                      )}
                    </span>
                    <span className="text-[11px] font-mono text-muted-foreground">{t.example}</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <Separator />

        {/* Entity cards */}
        {ENTITIES.map(entity => {
          const state = editors[entity.key];
          if (!state) return null;
          const isExpanded = expandedEntity === entity.key;
          const Icon = entity.icon;

          return (
            <div
              key={entity.key}
              className="rounded-lg border border-border/50 bg-background transition-all"
            >
              {/* Header row */}
              <button
                className="w-full flex items-center justify-between p-3 hover:bg-muted/30 transition-colors"
                onClick={() => setExpandedEntity(isExpanded ? null : entity.key)}
              >
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-lg bg-primary/10">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-foreground">{entity.label}</p>
                    <p className="text-[11px] text-muted-foreground font-mono">{state.template || entity.defaultExample}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {state.isDirty && <Badge variant="outline" className="text-[10px] border-amber-500/50 text-amber-600">Non sauvegardé</Badge>}
                  <Badge variant={state.isEnabled ? 'default' : 'secondary'} className="text-[10px]">
                    {state.isEnabled ? 'Personnalisé' : 'Par défaut'}
                  </Badge>
                </div>
              </button>

              {/* Expanded editor */}
              {isExpanded && (
                <div className="border-t border-border/50 p-4 space-y-4">
                  {/* Enable toggle */}
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm">Activer la numérotation personnalisée</Label>
                      <p className="text-[11px] text-muted-foreground">Remplace la génération par défaut du système</p>
                    </div>
                    <Switch
                      checked={state.isEnabled}
                      onCheckedChange={v => updateField(entity.key, 'isEnabled', v)}
                    />
                  </div>

                  <Separator />

                  {/* Template input */}
                  <div className="space-y-1.5">
                    <Label className="text-sm">Modèle</Label>
                    <Input
                      value={state.template}
                      onChange={e => updateField(entity.key, 'template', e.target.value)}
                      placeholder={`ex: ${entity.defaultExample}`}
                      className="font-mono text-sm"
                    />
                  </div>

                  {/* Strategy + Reset + Padding row */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Stratégie</Label>
                      <Select value={state.strategy} onValueChange={v => updateField(entity.key, 'strategy', v)}>
                        <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {STRATEGIES.map(s => (
                            <SelectItem key={s.value} value={s.value} className="text-xs">
                              {s.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Fréquence de réinitialisation</Label>
                      <Select value={state.resetFrequency} onValueChange={v => updateField(entity.key, 'resetFrequency', v)}>
                        <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {RESET_OPTIONS.map(r => (
                            <SelectItem key={r.value} value={r.value} className="text-xs">{r.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Valeur initiale</Label>
                        <Input
                          type="number"
                          min={1}
                          value={state.startValue}
                          onChange={e => updateField(entity.key, 'startValue', parseInt(e.target.value) || 1)}
                          className="text-xs"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Remplissage</Label>
                        <Input
                          type="number"
                          min={1}
                          max={12}
                          value={state.padding}
                          onChange={e => updateField(entity.key, 'padding', parseInt(e.target.value) || 6)}
                          className="text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Preview section */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePreview(entity.key)}
                        className="gap-1.5"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Aperçu (5 suivants)
                      </Button>
                    </div>

                    {state.preview.length > 0 && (
                      <div className="rounded-md border border-border/50 bg-muted/20 p-3">
                        <p className="text-xs font-medium text-foreground mb-1.5 flex items-center gap-1.5">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                          Valeurs générées
                        </p>
                        <div className="space-y-1">
                          {state.preview.map((v, i) => (
                            <div key={i} className="text-xs font-mono text-foreground/80 pl-5">
                              {i + 1}. {v}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {state.warnings.length > 0 && (
                      <div className="rounded-md border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 p-3">
                        <p className="text-xs font-medium text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          Warnings
                        </p>
                        {state.warnings.map((w, i) => (
                          <p key={i} className="text-[11px] text-amber-600 dark:text-amber-500 mt-1">{w}</p>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Save button */}
                  <div className="flex justify-end pt-2">
                    <Button
                      onClick={() => handleSave(entity.key)}
                      disabled={!state.isDirty || saveMutation.isPending}
                      size="sm"
                      className="gap-1.5"
                    >
                      <Save className="h-3.5 w-3.5" />
                      {saveMutation.isPending ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

// ── Client-side preview fallback ─────────────────────────

function generateClientPreview(state: EntityEditorState, entity: string): string[] {
  const now = new Date();
  const results: string[] = [];

  for (let i = 0; i < 5; i++) {
    let result = state.template;
    const seqValue = state.startValue + i;

    result = result.replace(/\{(YYYY|YEAR)\}/g, now.getFullYear().toString());
    result = result.replace(/\{YY\}/g, now.getFullYear().toString().slice(-2));
    result = result.replace(/\{DATE:([^}]+)\}/g, (_, fmt) => formatDate(now, fmt));
    result = result.replace(/\{SEQ(?::(\d+))?\}/g, (_, pad) => {
      const p = pad ? parseInt(pad) : state.padding;
      return seqValue.toString().padStart(p, '0');
    });
    result = result.replace(/\{GUID(?::(\d+))?\}/g, (_, len) => {
      const l = len ? parseInt(len) : 8;
      return randomHex(l).toUpperCase();
    });
    result = result.replace(/\{TS:([^}]+)\}/g, (_, fmt) => formatDate(now, fmt));
    result = result.replace(/\{ENTITY\}/g, entity);
    result = result.replace(/\{ID\}/g, '0');

    results.push(result);
  }

  return results;
}

function formatDate(d: Date, fmt: string): string {
  return fmt
    .replace('yyyy', d.getFullYear().toString())
    .replace('MM', (d.getMonth() + 1).toString().padStart(2, '0'))
    .replace('dd', d.getDate().toString().padStart(2, '0'))
    .replace('HH', d.getHours().toString().padStart(2, '0'))
    .replace('mm', d.getMinutes().toString().padStart(2, '0'))
    .replace('ss', d.getSeconds().toString().padStart(2, '0'));
}

function randomHex(len: number): string {
  const chars = '0123456789abcdef';
  let result = '';
  for (let i = 0; i < len; i++) result += chars[Math.floor(Math.random() * chars.length)];
  return result;
}

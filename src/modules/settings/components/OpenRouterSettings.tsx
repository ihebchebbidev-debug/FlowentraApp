import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Plus, Trash2, Eye, EyeOff, Shield, Zap, CheckCircle2, Loader2, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import {
  getOpenRouterKeys,
  addOpenRouterKey,
  removeOpenRouterKey,
  type OpenRouterApiKey,
} from '@/services/openRouterModelsService';

export function OpenRouterSettings() {
  const { t } = useTranslation('settings');
  const [keys, setKeys] = useState<OpenRouterApiKey[]>([]);
  const [newKey, setNewKey] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [visibleKeys, setVisibleKeys] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    setLoading(true);
    getOpenRouterKeys().then(setKeys).finally(() => setLoading(false));
  }, []);

  const handleAdd = async () => {
    if (!newKey.trim()) return;
    setAdding(true);
    try {
      const entry = await addOpenRouterKey(newKey.trim(), newLabel.trim());
      if (entry) {
        setKeys(prev => [...prev, entry]);
        setNewKey('');
        setNewLabel('');
        toast.success(t('openRouter.keyAdded'), { description: t('openRouter.keyAddedDesc', { label: entry.label }) });
      }
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (id: number) => {
    const ok = await removeOpenRouterKey(id);
    if (ok) {
      setKeys(prev => prev.filter(k => k.id !== id));
      setVisibleKeys(prev => { const next = new Set(prev); next.delete(id); return next; });
      toast.success(t('openRouter.keyRemoved'));
    }
  };

  const toggleVisibility = (id: number) => {
    setVisibleKeys(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const maskKey = (key: string) => key.slice(0, 8) + '•'.repeat(Math.max(0, key.length - 12)) + key.slice(-4);

  return (
    <Card className="shadow-card border-0 bg-card">
      <CardHeader className="p-4 sm:p-6 pb-3">
        <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" />
          {t('openRouter.title')}
        </CardTitle>
        <CardDescription className="text-xs">
          {t('openRouter.description')}
        </CardDescription>
      </CardHeader>

      <CardContent className="p-4 sm:p-6 pt-0 space-y-4">
        {loading ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground py-4">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> {t('openRouter.loading', 'Loading...')}
          </div>
        ) : keys.length > 0 ? (
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground">{t('openRouter.activeKeys', { count: keys.length })}</Label>
            {keys.map((k, i) => (
              <div key={k.id} className="flex items-center gap-2 p-2.5 rounded-lg border border-border/40 bg-muted/10">
                <div className="flex items-center gap-1.5 shrink-0">
                  <Badge variant="outline" className="text-[10px] h-5 px-1.5 bg-primary/5 text-primary border-primary/20">
                    {i === 0 ? t('openRouter.primary') : t('openRouter.fallback', { index: i })}
                  </Badge>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{k.label}</p>
                  <p className="text-[11px] text-muted-foreground font-mono truncate">
                    {visibleKeys.has(k.id) ? k.apiKey : maskKey(k.apiKey)}
                  </p>
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => toggleVisibility(k.id)}>
                  {visibleKeys.has(k.id) ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-destructive hover:text-destructive" onClick={() => handleRemove(k.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        ) : null}

        <Separator />

        <div className="space-y-3">
          <Label className="text-xs font-medium text-muted-foreground">{t('openRouter.addApiKey')}</Label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <Input
              placeholder={t('openRouter.labelPlaceholder')}
              value={newLabel}
              onChange={e => setNewLabel(e.target.value)}
              className="h-8 text-xs sm:col-span-1"
            />
            <Input
              placeholder={t('openRouter.keyPlaceholder')}
              value={newKey}
              onChange={e => setNewKey(e.target.value)}
              type="password"
              className="h-8 text-xs font-mono sm:col-span-2"
            />
          </div>
          <Button size="sm" className="text-xs gap-1.5" onClick={handleAdd} disabled={!newKey.trim() || adding}>
            {adding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
            {t('openRouter.addKey')}
          </Button>
        </div>

        <Collapsible className="p-3 bg-muted/20 rounded-lg">
          <CollapsibleTrigger className="flex items-center justify-between w-full text-xs font-medium text-foreground cursor-pointer hover:text-primary transition-colors">
            <span className="flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-muted-foreground" />
              {t('openRouter.howItWorks')}
            </span>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 [[data-state=open]_&]:rotate-180" />
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2">
            <ul className="text-[11px] text-muted-foreground space-y-0.5 list-disc pl-4">
              <li>{t('openRouter.hint1')}</li>
              <li>{t('openRouter.hint2')}</li>
              <li>{t('openRouter.hint3')}</li>
              <li>{t('openRouter.hint4')} <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="text-primary underline">openrouter.ai/keys</a></li>
            </ul>
          </CollapsibleContent>
        </Collapsible>

        {keys.length > 0 && (
          <div className="flex items-center gap-1.5 text-[11px] text-success">
            <CheckCircle2 className="h-3.5 w-3.5" />
            {t('openRouter.configured', { count: keys.length })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

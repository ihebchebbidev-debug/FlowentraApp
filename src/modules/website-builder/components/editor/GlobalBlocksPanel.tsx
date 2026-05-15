import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { BuilderComponent } from '../../types';
import { globalBlocksApi, ApiGlobalBlock } from '../../services/apiSupportServices';
import {
  loadGlobalBlocks, createGlobalBlock as createLocalBlock, deleteGlobalBlock as deleteLocalBlock, GlobalBlock
} from '../../utils/globalBlocks';
import { globalBlockNameSchema, globalBlockDescriptionSchema, validateField } from '../../utils/validation';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Layers, Plus, Trash2, Copy, Globe2, Search, Loader2, AlertCircle } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

interface GlobalBlocksPanelProps {
  onInsertBlock: (component: BuilderComponent) => void;
  selectedComponent?: BuilderComponent | null;
  siteId: string;
}

interface FormErrors {
  name?: string;
  description?: string;
}

export function GlobalBlocksPanel({ onInsertBlock, selectedComponent, siteId }: GlobalBlocksPanelProps) {
  const { t } = useTranslation();
  const [blocks, setBlocks] = useState<ApiGlobalBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [blockName, setBlockName] = useState('');
  const [blockDesc, setBlockDesc] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [useLocalFallback, setUseLocalFallback] = useState(false);
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const mapLocalToApi = (b: GlobalBlock): ApiGlobalBlock => ({
    id: b.id, name: b.name, description: b.description, component: b.component,
    createdAt: b.createdAt, updatedAt: b.updatedAt, usageCount: b.usedIn.length,
  });

  const fetchBlocks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await globalBlocksApi.list();
      if (res.success && res.data) { setBlocks(res.data); }
      else { setUseLocalFallback(true); setBlocks(loadGlobalBlocks().map(mapLocalToApi)); }
    } catch { setUseLocalFallback(true); setBlocks(loadGlobalBlocks().map(mapLocalToApi)); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchBlocks(); }, [fetchBlocks]);

  const validateForm = (): boolean => {
    const errors: FormErrors = {};
    const nameResult = validateField(globalBlockNameSchema, blockName);
    if (nameResult.success === false) errors.name = nameResult.error;
    if (blockDesc) {
      const descResult = validateField(globalBlockDescriptionSchema, blockDesc);
      if (descResult.success === false) errors.description = descResult.error;
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!selectedComponent || !validateForm()) return;
    setSaving(true);
    try {
      if (useLocalFallback) { createLocalBlock(blockName.trim(), selectedComponent, blockDesc.trim() || undefined); }
      else {
        const res = await globalBlocksApi.create(blockName.trim(), selectedComponent, blockDesc.trim() || undefined);
        if (!res.success) { toast.error(res.error || t('wb:globalBlocks.failedToSave')); setSaving(false); return; }
      }
      await fetchBlocks();
      setBlockName(''); setBlockDesc(''); setFormErrors({}); setShowSaveDialog(false);
      toast.success(t('wb:globalBlocks.savedSuccess', { name: blockName }));
    } catch (err: any) { toast.error(err.message || t('wb:globalBlocks.failedToSave')); }
    finally { setSaving(false); }
  };

  const handleInsert = async (block: ApiGlobalBlock) => {
    const copy: BuilderComponent = {
      ...block.component,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      label: block.name,
      props: { ...block.component.props, _globalBlockId: block.id },
    };
    onInsertBlock(copy);
    globalBlocksApi.trackUsage(block.id, siteId).catch(() => {});
    toast.success(t('wb:globalBlocks.addedToPage', { name: block.name }));
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      if (useLocalFallback) { deleteLocalBlock(id); }
      else {
        const res = await globalBlocksApi.delete(id);
        if (!res.success) { toast.error(res.error || t('wb:globalBlocks.failedToDelete')); setDeletingId(null); return; }
      }
      setBlocks(prev => prev.filter(b => b.id !== id));
      toast.success(t('wb:globalBlocks.blockDeleted'));
    } catch (err: any) { toast.error(err.message || t('wb:globalBlocks.failedToDelete')); }
    finally { setDeletingId(null); }
  };

  const filtered = searchTerm ? blocks.filter(b => b.name.toLowerCase().includes(searchTerm.toLowerCase())) : blocks;

  return (
    <ScrollArea className="h-full">
      <div className="p-3 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70 flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5" />{t('wb:globalBlocks.globalBlocks')}
          </h3>
          <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-semibold">{blocks.length}</span>
        </div>

        {selectedComponent && (
          <Button variant="outline" size="sm" className="w-full h-8 text-xs border-dashed" onClick={() => { setBlockName(selectedComponent.label); setShowSaveDialog(true); }}>
            <Plus className="h-3 w-3 mr-1.5" />{t('wb:globalBlocks.saveAsGlobal', { name: selectedComponent.label })}
          </Button>
        )}

        {blocks.length > 3 && (
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
            <Input placeholder={t('wb:globalBlocks.searchBlocks')} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="h-8 text-xs pl-8 bg-muted/30 border-border/40 rounded-lg" />
          </div>
        )}

        {loading ? (
          <div className="text-center py-8">
            <Loader2 className="h-6 w-6 mx-auto animate-spin text-muted-foreground/40 mb-2" />
            <p className="text-xs text-muted-foreground">{t('wb:globalBlocks.loadingBlocks')}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-8">
            <Layers className="h-7 w-7 mx-auto text-muted-foreground/30 mb-2" />
            <p className="text-xs text-muted-foreground">{blocks.length === 0 ? t('wb:globalBlocks.noGlobalBlocks') : t('wb:globalBlocks.noMatches')}</p>
            <p className="text-[10px] text-muted-foreground/60 mt-1">{t('wb:globalBlocks.reuseTip')}</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {filtered.map(block => (
              <div key={block.id} className="group p-2.5 rounded-xl border border-border/30 bg-white dark:bg-card hover:border-primary/30 hover:shadow-sm transition-all">
                <div className="flex items-start gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><Globe2 className="h-4 w-4 text-primary" /></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate">{block.name}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{block.component.type}</p>
                    {block.description && <p className="text-[10px] text-muted-foreground/60 mt-0.5 truncate">{block.description}</p>}
                    {block.usageCount > 0 && <p className="text-[9px] text-muted-foreground/50 mt-1">{t('wb:globalBlocks.usedCount', { count: block.usageCount })}</p>}
                  </div>
                </div>
                <div className="flex gap-1 mt-2">
                  <Button variant="outline" size="sm" className="h-6 text-[10px] flex-1" onClick={() => handleInsert(block)}>
                    <Copy className="h-3 w-3 mr-1" /> {t('wb:common.insert')}
                  </Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive opacity-0 group-hover:opacity-100 transition-opacity" disabled={deletingId === block.id} onClick={() => handleDelete(block.id)}>
                    {deletingId === block.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={showSaveDialog} onOpenChange={(open) => { setShowSaveDialog(open); if (!open) setFormErrors({}); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="text-base">{t('wb:globalBlocks.saveAsGlobalBlock')}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">{t('wb:globalBlocks.blockName')}</Label>
              <Input placeholder={t('wb:globalBlocks.blockNamePlaceholder')} value={blockName} onChange={(e) => { setBlockName(e.target.value); if (formErrors.name) setFormErrors(prev => ({ ...prev, name: undefined })); }} className={formErrors.name ? 'border-destructive' : ''} autoFocus maxLength={100} />
              {formErrors.name && <p className="text-[10px] text-destructive flex items-center gap-1"><AlertCircle className="h-3 w-3" />{formErrors.name}</p>}
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{t('wb:globalBlocks.descriptionOptional')}</Label>
              <Input placeholder={t('wb:globalBlocks.descriptionPlaceholder')} value={blockDesc} onChange={(e) => { setBlockDesc(e.target.value); if (formErrors.description) setFormErrors(prev => ({ ...prev, description: undefined })); }} className={formErrors.description ? 'border-destructive' : ''} maxLength={300} />
              {formErrors.description && <p className="text-[10px] text-destructive flex items-center gap-1"><AlertCircle className="h-3 w-3" />{formErrors.description}</p>}
            </div>
            <p className="text-[10px] text-muted-foreground">{t('wb:globalBlocks.globalBlocksTip')}</p>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowSaveDialog(false)}>{t('wb:common.cancel')}</Button>
            <Button size="sm" onClick={handleSave} disabled={!blockName.trim() || saving}>
              {saving && <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />}{t('wb:globalBlocks.saveBlock')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ScrollArea>
  );
}

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { SiteTheme } from '../../types';
import { brandProfilesApi, ApiBrandProfile } from '../../services/apiSupportServices';
import {
  loadBrandProfiles, createBrandProfile as createLocalProfile, deleteBrandProfile as deleteLocalProfile
} from '../../utils/globalBlocks';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Paintbrush, Plus, Trash2, Check, Palette, Loader2 } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

interface BrandProfilesPanelProps {
  currentTheme: SiteTheme;
  onApplyTheme: (theme: SiteTheme) => void;
}

export function BrandProfilesPanel({ currentTheme, onApplyTheme }: BrandProfilesPanelProps) {
  const { t } = useTranslation();
  const [profiles, setProfiles] = useState<ApiBrandProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [useLocalFallback, setUseLocalFallback] = useState(false);

  const mapLocal = (b: any): ApiBrandProfile => ({
    id: b.id, name: b.name, description: b.description, theme: b.theme,
    isBuiltIn: b.id.startsWith('bp-'), createdAt: b.createdAt, updatedAt: b.updatedAt,
  });

  const fetchProfiles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await brandProfilesApi.list();
      if (res.success && res.data) { setProfiles(res.data); }
      else { setUseLocalFallback(true); setProfiles(loadBrandProfiles().map(mapLocal)); }
    } catch { setUseLocalFallback(true); setProfiles(loadBrandProfiles().map(mapLocal)); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchProfiles(); }, [fetchProfiles]);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    try {
      if (useLocalFallback) { createLocalProfile(newName.trim(), currentTheme, newDesc.trim() || undefined); }
      else {
        const res = await brandProfilesApi.create(newName.trim(), currentTheme, newDesc.trim() || undefined);
        if (!res.success) { toast.error(res.error || t('wb:brands.failedToCreate')); setSaving(false); return; }
      }
      await fetchProfiles();
      setNewName(''); setNewDesc(''); setShowCreate(false);
      toast.success(t('wb:brands.profileCreated', { name: newName }));
    } catch (err: any) { toast.error(err.message || t('wb:brands.failedToCreate')); }
    finally { setSaving(false); }
  };

  const handleApply = (profile: ApiBrandProfile) => {
    onApplyTheme(profile.theme);
    toast.success(t('wb:brands.profileApplied', { name: profile.name }));
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      if (useLocalFallback) { deleteLocalProfile(id); }
      else {
        const res = await brandProfilesApi.delete(id);
        if (!res.success) { toast.error(res.error || t('wb:brands.failedToDelete')); setDeletingId(null); return; }
      }
      setProfiles(prev => prev.filter(p => p.id !== id));
      toast.success(t('wb:brands.profileDeleted'));
    } catch (err: any) { toast.error(err.message || t('wb:brands.failedToDelete')); }
    finally { setDeletingId(null); }
  };

  const isActiveTheme = (theme: SiteTheme) =>
    theme.primaryColor === currentTheme.primaryColor &&
    theme.backgroundColor === currentTheme.backgroundColor &&
    theme.textColor === currentTheme.textColor;

  return (
    <ScrollArea className="h-full">
      <div className="p-3 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70 flex items-center gap-1.5">
            <Palette className="h-3.5 w-3.5" />{t('wb:brands.brandProfiles')}
          </h3>
          <Button variant="outline" size="icon" className="h-5 w-5 rounded-md" onClick={() => { setNewName(''); setShowCreate(true); }}>
            <Plus className="h-3 w-3" />
          </Button>
        </div>

        <p className="text-[10px] text-muted-foreground/60 leading-relaxed">{t('wb:brands.brandDesc')}</p>

        {loading ? (
          <div className="text-center py-8">
            <Loader2 className="h-6 w-6 mx-auto animate-spin text-muted-foreground/40 mb-2" />
            <p className="text-xs text-muted-foreground">{t('wb:brands.loadingProfiles')}</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {profiles.map(profile => {
              const isActive = isActiveTheme(profile.theme);
              return (
                <div key={profile.id} className={`group p-3 rounded-xl border transition-all cursor-pointer ${isActive ? 'border-primary bg-primary/5 shadow-sm' : 'border-border/30 bg-white dark:bg-card hover:border-primary/20 hover:shadow-sm'}`} onClick={() => handleApply(profile)}>
                  <div className="flex items-center gap-3">
                    <div className="flex -space-x-1 shrink-0">
                      {[profile.theme.primaryColor, profile.theme.accentColor, profile.theme.backgroundColor, profile.theme.textColor].map((color, i) => (
                        <div key={i} className="w-5 h-5 rounded-full border-2 border-white dark:border-gray-800 shadow-sm" style={{ backgroundColor: color }} />
                      ))}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-semibold truncate">{profile.name}</p>
                        {isActive && <Check className="h-3 w-3 text-primary shrink-0" />}
                      </div>
                      {profile.description && <p className="text-[10px] text-muted-foreground truncate">{profile.description}</p>}
                    </div>
                    {!profile.isBuiltIn && (
                      <Button variant="ghost" size="icon" className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" disabled={deletingId === profile.id} onClick={(e) => { e.stopPropagation(); handleDelete(profile.id); }}>
                        {deletingId === profile.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3 text-destructive" />}
                      </Button>
                    )}
                  </div>
                  <div className="mt-2 h-6 rounded-md overflow-hidden flex text-[8px] font-bold">
                    <div className="flex-1 flex items-center justify-center" style={{ backgroundColor: profile.theme.backgroundColor, color: profile.theme.textColor }}>Aa</div>
                    <div className="flex-1 flex items-center justify-center text-white" style={{ backgroundColor: profile.theme.primaryColor }}>Btn</div>
                    <div className="flex-1 flex items-center justify-center text-white" style={{ backgroundColor: profile.theme.accentColor }}>Acc</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <Button variant="outline" size="sm" className="w-full h-8 text-xs border-dashed" onClick={() => { setNewName(''); setShowCreate(true); }}>
          <Paintbrush className="h-3 w-3 mr-1.5" />{t('wb:brands.saveCurrentTheme')}
        </Button>
      </div>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="text-base">{t('wb:brands.createBrandProfile')}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder={t('wb:brands.brandNamePlaceholder')} value={newName} onChange={(e) => setNewName(e.target.value)} autoFocus />
            <Input placeholder={t('wb:brands.descriptionPlaceholder')} value={newDesc} onChange={(e) => setNewDesc(e.target.value)} />
            <p className="text-[10px] text-muted-foreground">{t('wb:brands.createBrandDesc')}</p>
            <div className="flex -space-x-1">
              {[currentTheme.primaryColor, currentTheme.accentColor, currentTheme.backgroundColor, currentTheme.textColor].map((color, i) => (
                <div key={i} className="w-8 h-8 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: color }} />
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowCreate(false)}>{t('wb:common.cancel')}</Button>
            <Button size="sm" onClick={handleCreate} disabled={!newName.trim() || saving}>
              {saving && <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />}{t('wb:brands.createBrand')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ScrollArea>
  );
}

/**
 * Page Versions Panel — save snapshots, list history, restore previous versions.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { pageVersionsApi, ApiPageVersion } from '../../services/apiSupportServices';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  History, Save, RotateCcw, ChevronDown, ChevronRight, Loader2,
  Clock, FileText, AlertCircle,
} from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

interface PageVersionsPanelProps {
  pageId: string;
  pageTitle: string;
  onRestore: () => void;
}

export function PageVersionsPanel({ pageId, pageTitle, onRestore }: PageVersionsPanelProps) {
  const { t } = useTranslation();
  const [versions, setVersions] = useState<ApiPageVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [changeMessage, setChangeMessage] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showRestoreDialog, setShowRestoreDialog] = useState<ApiPageVersion | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchVersions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await pageVersionsApi.list(pageId);
      if (res.success && res.data) { setVersions(res.data); }
      else { toast.error(res.error || t('wb:versions.failedToLoad')); }
    } catch (err: any) { toast.error(err.message || t('wb:versions.failedToLoad')); }
    finally { setLoading(false); }
  }, [pageId, t]);

  useEffect(() => { fetchVersions(); }, [fetchVersions]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await pageVersionsApi.save(pageId, changeMessage.trim() || undefined);
      if (res.success) { await fetchVersions(); setChangeMessage(''); setShowSaveDialog(false); toast.success(t('wb:versions.versionSaved')); }
      else { toast.error(res.error || t('wb:versions.failedToSave')); }
    } catch (err: any) { toast.error(err.message || t('wb:versions.failedToSave')); }
    finally { setSaving(false); }
  };

  const handleRestore = async (version: ApiPageVersion) => {
    setRestoringId(version.id);
    try {
      const res = await pageVersionsApi.restore(pageId, version.id);
      if (res.success) { setShowRestoreDialog(null); toast.success(t('wb:versions.restoredToVersion', { version: version.versionNumber })); onRestore(); }
      else { toast.error(res.error || t('wb:versions.failedToRestore')); }
    } catch (err: any) { toast.error(err.message || t('wb:versions.failedToRestore')); }
    finally { setRestoringId(null); }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 1) return t('wb:versions.justNow');
    if (mins < 60) return t('wb:versions.minsAgo', { count: mins });
    if (hours < 24) return t('wb:versions.hoursAgo', { count: hours });
    if (days < 7) return t('wb:versions.daysAgo', { count: days });
    return d.toLocaleDateString();
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
            <History className="h-4 w-4" />{t('wb:versions.pageVersions')}
          </h3>
          <Button variant="default" size="sm" className="h-7 text-xs gap-1.5" onClick={() => setShowSaveDialog(true)}>
            <Save className="h-3 w-3" />{t('wb:versions.saveSnapshot')}
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground/60">
          {t('wb:versions.versionCount', { title: pageTitle, count: versions.length })}
        </p>
      </div>

      <ScrollArea className="flex-1">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin mb-3 opacity-40" />
            <p className="text-xs">{t('wb:versions.loadingHistory')}</p>
          </div>
        ) : versions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <History className="h-8 w-8 mb-3 opacity-30" />
            <p className="text-xs">{t('wb:versions.noVersions')}</p>
            <p className="text-[10px] opacity-60 mt-1">{t('wb:versions.noVersionsHint')}</p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {versions.map((version, idx) => {
              const isExpanded = expandedId === version.id;
              const isLatest = idx === 0;
              return (
                <div key={version.id} className={`border rounded-lg overflow-hidden group transition-colors ${isLatest ? 'border-primary/20 bg-primary/3' : 'hover:border-primary/10'}`}>
                  <button onClick={() => setExpandedId(isExpanded ? null : version.id)} className="w-full text-left p-2.5 flex items-start gap-2">
                    {isExpanded ? <ChevronDown className="h-3 w-3 mt-0.5 shrink-0 text-muted-foreground" /> : <ChevronRight className="h-3 w-3 mt-0.5 shrink-0 text-muted-foreground" />}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-semibold text-foreground">v{version.versionNumber}</span>
                        {isLatest && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{t('wb:versions.latest')}</span>}
                      </div>
                      {version.changeMessage && <p className="text-[10px] text-muted-foreground truncate mt-0.5">{version.changeMessage}</p>}
                      <div className="flex items-center gap-2 mt-0.5">
                        <Clock className="h-2.5 w-2.5 text-muted-foreground/50" />
                        <span className="text-[9px] text-muted-foreground/50">{formatDate(version.createdAt)}</span>
                        {version.createdBy && (<><span className="text-[9px] text-muted-foreground/30">·</span><span className="text-[9px] text-muted-foreground/50">{version.createdBy}</span></>)}
                      </div>
                    </div>
                  </button>
                  {isExpanded && (
                    <div className="px-3 pb-3 pt-0 border-t bg-muted/10">
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                          <FileText className="h-3 w-3" />{t('wb:versions.componentCount', { count: version.components.length })}
                        </div>
                        {!isLatest && (
                          <Button variant="outline" size="sm" className="h-6 text-[10px] gap-1" onClick={(e) => { e.stopPropagation(); setShowRestoreDialog(version); }}>
                            <RotateCcw className="h-3 w-3" />{t('wb:versions.restore')}
                          </Button>
                        )}
                      </div>
                      <div className="mt-2 space-y-0.5">
                        {version.components.slice(0, 5).map((comp, i) => (
                          <div key={i} className="text-[9px] text-muted-foreground/60 flex items-center gap-1.5">
                            <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                            <span className="truncate">{comp.label || comp.type}</span>
                          </div>
                        ))}
                        {version.components.length > 5 && <p className="text-[9px] text-muted-foreground/40 pl-2.5">{t('wb:versions.moreComponents', { count: version.components.length - 5 })}</p>}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>

      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base flex items-center gap-2"><Save className="h-4 w-4" /> {t('wb:versions.saveVersionSnapshot')}</DialogTitle>
            <DialogDescription className="text-xs">{t('wb:versions.createCheckpoint')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder={t('wb:versions.whatChanged')} value={changeMessage} onChange={(e) => setChangeMessage(e.target.value)} autoFocus />
            <p className="text-[10px] text-muted-foreground">{t('wb:versions.saveStateDesc', { title: pageTitle })}</p>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowSaveDialog(false)}>{t('wb:common.cancel')}</Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />}{t('wb:versions.saveSnapshot')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!showRestoreDialog} onOpenChange={() => setShowRestoreDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base flex items-center gap-2"><AlertCircle className="h-4 w-4 text-amber-500" /> {t('wb:versions.restoreVersion')}</DialogTitle>
            <DialogDescription className="text-xs">{t('wb:versions.restoreVersionDesc', { version: showRestoreDialog?.versionNumber })}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {showRestoreDialog?.changeMessage && <div className="p-2 rounded-lg bg-muted/30 text-xs text-muted-foreground">"{showRestoreDialog.changeMessage}"</div>}
            <p className="text-[10px] text-muted-foreground">{t('wb:versions.restoreTip')}</p>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowRestoreDialog(null)}>{t('wb:common.cancel')}</Button>
            <Button size="sm" variant="destructive" onClick={() => showRestoreDialog && handleRestore(showRestoreDialog)} disabled={restoringId === showRestoreDialog?.id}>
              {restoringId === showRestoreDialog?.id && <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />}{t('wb:versions.restoreButton', { version: showRestoreDialog?.versionNumber })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

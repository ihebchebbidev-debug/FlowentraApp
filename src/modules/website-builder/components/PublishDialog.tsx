import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { WebsiteSite } from '../types';
import { getStorageProvider } from '../services/storageProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Copy, Check, ExternalLink, Globe, Loader2, FileCode } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { ExportOptionsDialog, type ExportSettings, type ExportFormat } from './ExportOptionsDialog';
import { ExportPreviewDialog } from './ExportPreviewDialog';

interface PublishDialogProps {
  site: WebsiteSite;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSiteUpdate: (site: WebsiteSite) => void;
}

export function PublishDialog({ site, open, onOpenChange, onSiteUpdate }: PublishDialogProps) {
  const { t } = useTranslation();
  const [isCopied, setIsCopied] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [exportOptionsOpen, setExportOptionsOpen] = useState(false);
  const [exportInitialFormat, setExportInitialFormat] = useState<ExportFormat>('html');
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [previewSettings, setPreviewSettings] = useState<ExportSettings | null>(null);

  const publicUrl = `${window.location.origin}/public/sites/${site.slug}`;
  const totalComponents = site.pages.reduce((sum, p) => sum + (Array.isArray(p.components) ? p.components.length : 0), 0);

  const handleTogglePublish = async () => {
    setIsProcessing(true);
    try {
      const provider = getStorageProvider();
      let updatedSite: WebsiteSite;
      if (!site.published) {
        const result = await provider.publishSite(site.id);
        if (result.success && result.data) {
          updatedSite = { ...site, published: true, publishedAt: result.data.publishedAt, publishedUrl: result.data.url };
          toast.success(t('wb:publish.sitePublished'));
        } else { toast.error(result.error || t('wb:publish.failedToPublish')); setIsProcessing(false); return; }
      } else {
        const result = await provider.unpublishSite(site.id);
        if (result.success) {
          updatedSite = { ...site, published: false, publishedUrl: undefined };
          toast.success(t('wb:publish.siteUnpublished'));
        } else { toast.error(result.error || t('wb:publish.failedToUnpublish')); setIsProcessing(false); return; }
      }
      onSiteUpdate(updatedSite);
    } catch (err: any) { toast.error(err.message || t('wb:publish.failedToPublish')); }
    finally { setIsProcessing(false); }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setIsCopied(true);
      toast.success(t('wb:common.urlCopied'));
      setTimeout(() => setIsCopied(false), 2000);
    } catch { toast.error(t('wb:common.failedToCopy')); }
  };

  const openExportOptions = (format: ExportFormat) => {
    setExportInitialFormat(format);
    setExportOptionsOpen(true);
  };

  /** Both "Export" and "Preview" route through the same preview-first modal. */
  const openPreviewWithSettings = useCallback((settings: ExportSettings) => {
    setPreviewSettings(settings);
    setPreviewDialogOpen(true);
    setExportOptionsOpen(false);
  }, []);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />{t('wb:publish.publishWebsite')}
            </DialogTitle>
            <DialogDescription>{t('wb:publish.publishDesc')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-5 py-2">
            <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
              <div>
                <p className="text-sm font-medium">{site.published ? t('wb:publish.websiteIsLive') : t('wb:publish.websiteIsDraft')}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {site.published
                    ? t('wb:publish.publishedOn', { date: site.publishedAt ? new Date(site.publishedAt).toLocaleDateString() : '' })
                    : t('wb:publish.toggleToPublish')}
                </p>
              </div>
              <Switch checked={site.published} onCheckedChange={handleTogglePublish} disabled={isProcessing} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">{t('wb:publish.publicUrl')}</Label>
              <div className="flex gap-2">
                <Input value={publicUrl} readOnly className="font-mono text-xs bg-muted" />
                <Button variant="outline" size="icon" onClick={handleCopy} className="shrink-0">
                  {isCopied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                </Button>
                {site.published && (
                  <Button variant="outline" size="icon" asChild className="shrink-0">
                    <a href={publicUrl} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-4 w-4" /></a>
                  </Button>
                )}
              </div>
              {!site.published && <p className="text-[10px] text-muted-foreground/80">{t('wb:publish.publishFirst')}</p>}
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">{t('wb:common.pages')} ({site.pages.length})</Label>
              <div className="space-y-1">
                {site.pages.map(page => (
                  <div key={page.id} className="flex items-center justify-between text-xs p-2 rounded-md bg-muted/50">
                    <span className="font-medium">{page.title}</span>
                    <span className="text-muted-foreground font-mono">/{page.slug || '(home)'}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="pt-2 border-t space-y-2">
              <Label className="text-xs text-muted-foreground">{t('wb:publish.export')}</Label>
              <Button onClick={() => openExportOptions('react')} variant="outline" className="w-full text-xs" size="sm">
                <FileCode className="h-3.5 w-3.5 mr-1.5" />{t('wb:publish.exportReactProject')}
              </Button>
              <p className="text-[10px] text-muted-foreground text-center">{t('wb:publish.exportDesc')}</p>
            </div>
            {isProcessing && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /><span>{t('wb:common.processing')}</span>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <ExportOptionsDialog
        open={exportOptionsOpen}
        onOpenChange={setExportOptionsOpen}
        onExport={openPreviewWithSettings}
        onPreview={openPreviewWithSettings}
        isPreviewLoading={false}
        pageCount={site.pages.length}
        componentCount={totalComponents}
        initialFormat={exportInitialFormat}
      />

      <ExportPreviewDialog
        site={site}
        settings={previewSettings}
        open={previewDialogOpen}
        onOpenChange={(o) => {
          setPreviewDialogOpen(o);
          if (!o) setPreviewSettings(null);
        }}
      />
    </>
  );
}

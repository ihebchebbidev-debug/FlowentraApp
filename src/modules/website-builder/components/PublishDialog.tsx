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
import { generateReactProjectWithStats } from '../utils/export/reactExporter';
import { generateSiteHtmlWithStats } from '../utils/export/htmlExporter';
import { downloadAsZip } from '../utils/export/zipHelper';
import type { ExportProgress } from '../utils/export/types';
import { ExportOptionsDialog, type ExportSettings, type ExportFormat } from './ExportOptionsDialog';
import { ExportProgressDialog } from './ExportProgressDialog';

function getMimeType(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase() || '';
  const map: Record<string, string> = {
    html: 'text/html', css: 'text/css', js: 'application/javascript',
    json: 'application/json', svg: 'image/svg+xml', png: 'image/png',
    jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif',
    webp: 'image/webp', ico: 'image/x-icon', txt: 'text/plain',
  };
  return map[ext] || 'application/octet-stream';
}

function replaceAll(str: string, search: string, replacement: string): string {
  return str.split(search).join(replacement);
}

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
  const [isExporting, setIsExporting] = useState(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [exportProgress, setExportProgress] = useState<ExportProgress | null>(null);
  const [exportOptionsOpen, setExportOptionsOpen] = useState(false);
  const [exportInitialFormat, setExportInitialFormat] = useState<ExportFormat>('html');
  const [progressDialogOpen, setProgressDialogOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<'html' | 'react'>('html');

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

  const openExportOptions = (format: ExportFormat) => { setExportInitialFormat(format); setExportOptionsOpen(true); };

  const handleExportWithSettings = useCallback(async (settings: ExportSettings) => {
    setIsExporting(true); setExportFormat('react'); setProgressDialogOpen(true); setExportProgress(null);
    try {
      const result = await generateReactProjectWithStats(site, (progress) => { setExportProgress(progress); }, { imageOptimization: settings.imageOptimization, platform: settings.platform });
      setExportProgress({ phase: 'complete', current: result.files.length, total: result.files.length, message: `Export complete! ${result.files.length} files, ${result.stats.imageCount} images extracted.`, fileCount: result.files.length, imageCount: result.stats.imageCount });
      await new Promise(resolve => setTimeout(resolve, 500));
      await downloadAsZip(result.files, `${site.slug || 'website'}-react.zip`);
      toast.success(t('wb:publish.reactProjectDownloaded'));
      setProgressDialogOpen(false);
    } catch (err: any) { setProgressDialogOpen(false); toast.error(t('wb:publish.exportFailed') + ': ' + (err.message || 'Unknown error')); }
    finally { setIsExporting(false); setExportProgress(null); }
  }, [site, t]);

  const handlePreview = useCallback(async (settings: ExportSettings) => {
    setIsPreviewLoading(true);
    try {
      const result = await generateSiteHtmlWithStats(site, undefined, { imageOptimization: settings.imageOptimization, platform: settings.platform });
      const indexFile = result.files.find(f => f.path === 'index.html');
      if (!indexFile || typeof indexFile.content !== 'string') { toast.error(t('wb:publish.noIndexPage')); return; }
      const assetMap = new Map<string, string>();
      for (const file of result.files) {
        if (file.path === 'index.html') continue;
        if (typeof file.content === 'string') { const blob = new Blob([file.content], { type: getMimeType(file.path) }); assetMap.set(file.path, URL.createObjectURL(blob)); }
        else if (file.content instanceof Uint8Array) { const blob = new Blob([file.content.buffer as ArrayBuffer], { type: getMimeType(file.path) }); assetMap.set(file.path, URL.createObjectURL(blob)); }
      }
      let html = indexFile.content;
      for (const [path, blobUrl] of assetMap) { html = replaceAll(html, `"${path}"`, `"${blobUrl}"`); html = replaceAll(html, `'${path}'`, `'${blobUrl}'`); html = replaceAll(html, `url(${path})`, `url(${blobUrl})`); }
      const cssFile = result.files.find(f => f.path === 'styles.css');
      if (cssFile && typeof cssFile.content === 'string') { let cssContent = cssFile.content; for (const [path, blobUrl] of assetMap) { cssContent = replaceAll(cssContent, path, blobUrl); } html = html.replace(/<link[^>]*href="[^"]*styles\.css"[^>]*\/?>/i, `<style>${cssContent}</style>`); }
      const jsFile = result.files.find(f => f.path === 'scripts.js');
      if (jsFile && typeof jsFile.content === 'string') { html = html.replace(/<script[^>]*src="[^"]*scripts\.js"[^>]*><\/script>/i, `<script>${jsFile.content}</script>`); }
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      toast.success(t('wb:publish.previewOpened'));
    } catch (err: any) { toast.error(t('wb:publish.previewFailed') + ': ' + (err.message || 'Unknown error')); }
    finally { setIsPreviewLoading(false); }
  }, [site, t]);

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
              <Button onClick={() => openExportOptions('react')} disabled={isExporting} variant="outline" className="w-full text-xs" size="sm">
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
      <ExportOptionsDialog open={exportOptionsOpen} onOpenChange={setExportOptionsOpen} onExport={handleExportWithSettings} onPreview={handlePreview} isPreviewLoading={isPreviewLoading} pageCount={site.pages.length} componentCount={totalComponents} initialFormat={exportInitialFormat} />
      <ExportProgressDialog open={progressDialogOpen} onOpenChange={setProgressDialogOpen} progress={exportProgress} format={exportFormat} />
    </>
  );
}

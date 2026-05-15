/**
 * Share Site Dialog
 * 
 * Allows users to share their published sites via URL, embed code, or social media.
 * Includes export options for Static HTML and React project downloads with progress tracking.
 */
import React, { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Copy, 
  Check, 
  Link, 
  Code, 
  Share2, 
  ExternalLink,
  Download,
  QrCode,
  Mail,
  MessageCircle,
  Globe,
  FileCode,
  Loader2,
  Rocket,
  Image as ImageIcon,
  Settings2,
} from 'lucide-react';
import { toast } from 'sonner';
import type { WebsiteSite } from '../types';
import type { ExportProgress } from '../utils/export/types';
import type { HtmlExportOptions } from '../utils/export/htmlExporter';
import { 
  generateShareUrls, 
  generateSocialShareLinks, 
  copyToClipboard,
  downloadSiteAsJson,
} from '../utils/sharing';
import { generateSiteHtmlWithStats } from '../utils/export/htmlExporter';
import { generateReactProject } from '../utils/export/reactExporter';
import { downloadAsZip } from '../utils/export/zipHelper';
import { formatBytes } from '../utils/export/imageOptimizer';
import { DeployGuide } from './DeployGuide';
import { ExportProgressDialog } from './ExportProgressDialog';
import { ExportOptionsDialog, type ExportSettings } from './ExportOptionsDialog';

interface ShareSiteDialogProps {
  site: WebsiteSite;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function guessMime(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase() || '';
  const m: Record<string, string> = {
    html: 'text/html', css: 'text/css', js: 'application/javascript',
    json: 'application/json', svg: 'image/svg+xml', png: 'image/png',
    jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif',
    webp: 'image/webp', ico: 'image/x-icon',
  };
  return m[ext] || 'application/octet-stream';
}

export function ShareSiteDialog({ site, open, onOpenChange }: ShareSiteDialogProps) {
  const { t } = useTranslation();
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [htmlExporting, setHtmlExporting] = useState(false);
  const [reactExporting, setReactExporting] = useState(false);
  const [deployGuideOpen, setDeployGuideOpen] = useState(false);
  const [deployFormat, setDeployFormat] = useState<'html' | 'react'>('html');
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  
  // Export options dialog
  const [exportOptionsOpen, setExportOptionsOpen] = useState(false);
  
  // Progress tracking state
  const [progressDialogOpen, setProgressDialogOpen] = useState(false);
  const [exportProgress, setExportProgress] = useState<ExportProgress | null>(null);
  const [exportFormat, setExportFormat] = useState<'html' | 'react'>('html');
  const [exportStats, setExportStats] = useState<{ imageCount: number; totalFiles: number }>({ imageCount: 0, totalFiles: 0 });

  const urls = useMemo(() => generateShareUrls(site), [site]);
  const socialLinks = useMemo(
    () => generateSocialShareLinks(urls.publicUrl, site.name, site.description),
    [urls.publicUrl, site.name, site.description]
  );

  const totalComponents = useMemo(
    () => site.pages.reduce((sum, p) => sum + p.components.length, 0),
    [site.pages]
  );

  const handleCopy = async (text: string, field: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopiedField(field);
      toast.success(t('wb:share.copiedToClipboard'));
      setTimeout(() => setCopiedField(null), 2000);
    } else {
      toast.error(t('wb:share.failedToCopy'));
    }
  };

  const handleExport = () => {
    downloadSiteAsJson(site);
    toast.success(t('wb:share.siteExported'));
  };

  const handleProgressUpdate = useCallback((progress: ExportProgress) => {
    setExportProgress(progress);
    if (progress.imageCount !== undefined) {
      setExportStats(prev => ({ ...prev, imageCount: progress.imageCount! }));
    }
    if (progress.fileCount !== undefined) {
      setExportStats(prev => ({ ...prev, totalFiles: progress.fileCount! }));
    }
  }, []);

  const handleHtmlExportWithOptions = async (settings: ExportSettings) => {
    // ExportSettings now includes format, but this handler is only for HTML
    const { platform, imageOptimization } = settings;
    setHtmlExporting(true);
    setExportFormat('html');
    setExportProgress(null);
    setExportStats({ imageCount: 0, totalFiles: 0 });
    setProgressDialogOpen(true);
    
    try {
      // Use setTimeout to allow the dialog to render before heavy processing
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const exportOptions: HtmlExportOptions = {
        platform,
        imageOptimization,
      };
      
      const result = await generateSiteHtmlWithStats(site, handleProgressUpdate, exportOptions);
      
      // Update final stats
      setExportStats({
        imageCount: result.stats.imageCount,
        totalFiles: result.stats.totalFiles,
      });
      
      // Calculate image savings message
      const savingsMessage = result.stats.originalImageSize > result.stats.optimizedImageSize
        ? ` Images optimized: ${formatBytes(result.stats.originalImageSize)} → ${formatBytes(result.stats.optimizedImageSize)}`
        : '';
      
      // Mark as complete
      setExportProgress({
        phase: 'complete',
        current: result.files.length,
        total: result.files.length,
        message: `Export complete! ${result.stats.pageCount} pages, ${result.stats.imageCount} images.${savingsMessage}`,
        fileCount: result.stats.totalFiles,
        imageCount: result.stats.imageCount,
      });
      
      // Small delay to show completion state
      await new Promise(resolve => setTimeout(resolve, 500));
      
      downloadAsZip(result.files, `${site.slug || 'website'}-${platform}-html.zip`);
      toast.success(`${t('wb:share.htmlDownloaded')} ${result.stats.imageCount > 0 ? t('wb:share.imagesExtracted', { count: result.stats.imageCount }) : ''}`);
      
      setProgressDialogOpen(false);
    } catch (err) {
      setProgressDialogOpen(false);
      toast.error(t('wb:share.exportFailed') + ': ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setHtmlExporting(false);
    }
  };

  const handlePreview = useCallback(async (settings: ExportSettings) => {
    setIsPreviewLoading(true);
    try {
      const result = await generateSiteHtmlWithStats(site, undefined, {
        imageOptimization: settings.imageOptimization,
        platform: settings.platform,
      });

      const indexFile = result.files.find(f => f.path === 'index.html');
      if (!indexFile || typeof indexFile.content !== 'string') {
        toast.error(t('wb:share.noIndexPage'));
        return;
      }

      const assetMap = new Map<string, string>();
      for (const file of result.files) {
        if (file.path === 'index.html') continue;
        if (typeof file.content === 'string') {
          const blob = new Blob([file.content], { type: guessMime(file.path) });
          assetMap.set(file.path, URL.createObjectURL(blob));
        } else if (file.content instanceof Uint8Array) {
          const blob = new Blob([file.content.buffer as ArrayBuffer], { type: guessMime(file.path) });
          assetMap.set(file.path, URL.createObjectURL(blob));
        }
      }

      let html = indexFile.content;
      for (const [path, blobUrl] of assetMap) {
        html = html.split(`"${path}"`).join(`"${blobUrl}"`);
        html = html.split(`'${path}'`).join(`'${blobUrl}'`);
        html = html.split(`url(${path})`).join(`url(${blobUrl})`);
      }

      const cssFile = result.files.find(f => f.path === 'styles.css');
      if (cssFile && typeof cssFile.content === 'string') {
        let css = cssFile.content;
        for (const [path, blobUrl] of assetMap) {
          css = css.split(path).join(blobUrl);
        }
        html = html.replace(/<link[^>]*href="[^"]*styles\.css"[^>]*\/?>/i, `<style>${css}</style>`);
      }

      const jsFile = result.files.find(f => f.path === 'scripts.js');
      if (jsFile && typeof jsFile.content === 'string') {
        html = html.replace(/<script[^>]*src="[^"]*scripts\.js"[^>]*><\/script>/i, `<script>${jsFile.content}</script>`);
      }

      const blob = new Blob([html], { type: 'text/html' });
      window.open(URL.createObjectURL(blob), '_blank');
      toast.success(t('wb:share.previewOpened'));
    } catch (err: any) {
      toast.error(t('wb:share.previewFailed') + ': ' + (err.message || 'Unknown error'));
    } finally {
      setIsPreviewLoading(false);
    }
  }, [site]);

  const handleOpenExportOptions = () => {
    setExportOptionsOpen(true);
  };

  const handleReactExport = async () => {
    setReactExporting(true);
    setExportFormat('react');
    setExportProgress(null);
    setExportStats({ imageCount: 0, totalFiles: 0 });
    setProgressDialogOpen(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Update progress for React export
      setExportProgress({
        phase: 'generating',
        current: 0,
        total: site.pages.length,
        message: t('wb:share.generatingReact'),
      });
      
      const files = await generateReactProject(site, (p) => setExportProgress(p));
      
      const imageCount = files.filter(f => f.path.includes('/public/assets/')).length;
      setExportStats({ imageCount, totalFiles: files.length });
      
      setExportProgress({
        phase: 'complete',
        current: files.length,
        total: files.length,
        message: `Export complete! ${files.length} files generated${imageCount > 0 ? `, ${imageCount} images extracted` : ''}.`,
        fileCount: files.length,
        imageCount,
      });
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      downloadAsZip(files, `${site.slug || 'website'}-react.zip`);
      toast.success(t('wb:share.reactDownloaded'));
      
      setProgressDialogOpen(false);
    } catch (err) {
      setProgressDialogOpen(false);
      toast.error(t('wb:share.exportFailed') + ': ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setReactExporting(false);
    }
  };

  const openDeployGuide = (format: 'html' | 'react') => {
    setDeployFormat(format);
    setDeployGuideOpen(true);
  };

  const CopyButton = ({ field, text }: { field: string; text: string }) => (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8 shrink-0"
      onClick={() => handleCopy(text, field)}
    >
      {copiedField === field ? (
        <Check className="h-4 w-4 text-green-500" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
    </Button>
  );

  const SocialButton = ({ 
    href, 
    icon: Icon, 
    label, 
    color 
  }: { 
    href: string; 
    icon: typeof Mail; 
    label: string;
    color: string;
  }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-white text-sm font-medium transition-all hover:opacity-90 hover:scale-105`}
      style={{ backgroundColor: color }}
    >
      <Icon className="h-4 w-4" />
      {label}
    </a>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            {t('wb:share.shareTitle', { name: site.name })}
          </DialogTitle>
          <DialogDescription>
            {site.published ? (
              <Badge variant="default" className="bg-green-500 text-white">{t('wb:common.published')}</Badge>
            ) : (
              <Badge variant="secondary">{t('wb:share.draftPublishHint')}</Badge>
            )}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="link" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="link" className="text-xs">
              <Link className="h-3.5 w-3.5 mr-1" />
              {t('wb:share.link')}
            </TabsTrigger>
            <TabsTrigger value="embed" className="text-xs">
              <Code className="h-3.5 w-3.5 mr-1" />
              {t('wb:share.embed')}
            </TabsTrigger>
            <TabsTrigger value="social" className="text-xs">
              <Share2 className="h-3.5 w-3.5 mr-1" />
              {t('wb:share.social')}
            </TabsTrigger>
            <TabsTrigger value="export" className="text-xs">
              <Download className="h-3.5 w-3.5 mr-1" />
              {t('wb:share.export')}
            </TabsTrigger>
          </TabsList>

          {/* Link Tab */}
          <TabsContent value="link" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">{t('wb:share.publicUrl')}</Label>
              <div className="flex gap-2">
                <Input 
                  value={urls.publicUrl} 
                  readOnly 
                  className="text-sm"
                />
                <CopyButton field="publicUrl" text={urls.publicUrl} />
                {site.published && (
                  <Button variant="outline" size="icon" className="h-9 w-9 shrink-0" asChild>
                    <a href={urls.publicUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">{t('wb:share.qrCode')}</Label>
              <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                <img 
                  src={urls.qrCodeUrl} 
                  alt="QR Code" 
                  className="w-24 h-24 rounded-lg border bg-white"
                />
                <div className="flex-1 space-y-2">
                  <p className="text-sm text-muted-foreground">
                    {t('wb:share.qrCodeDesc')}
                  </p>
                  <Button variant="outline" size="sm" asChild>
                    <a href={urls.qrCodeUrl} download={`${site.slug}-qr.png`}>
                      <QrCode className="h-4 w-4 mr-2" />
                      {t('wb:share.downloadQr')}
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Embed Tab */}
          <TabsContent value="embed" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">{t('wb:share.basicEmbedCode')}</Label>
              <div className="flex gap-2">
                <Textarea 
                  value={urls.embedCode} 
                  readOnly 
                  className="text-xs font-mono h-20 resize-none"
                />
                <CopyButton field="embedCode" text={urls.embedCode} />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">{t('wb:share.responsiveEmbed')}</Label>
              <div className="flex gap-2">
                <Textarea 
                  value={urls.embedCodeResponsive} 
                  readOnly 
                  className="text-xs font-mono h-24 resize-none"
                />
                <CopyButton field="embedCodeResponsive" text={urls.embedCodeResponsive} />
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              {t('wb:share.embedHint')}
            </p>
          </TabsContent>

          {/* Social Tab */}
          <TabsContent value="social" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-2">
              <SocialButton 
                href={socialLinks.facebook} 
                icon={Share2} 
                label="Facebook" 
                color="#1877F2"
              />
              <SocialButton 
                href={socialLinks.twitter} 
                icon={Share2} 
                label="Twitter" 
                color="#1DA1F2"
              />
              <SocialButton 
                href={socialLinks.linkedin} 
                icon={Share2} 
                label="LinkedIn" 
                color="#0A66C2"
              />
              <SocialButton 
                href={socialLinks.whatsapp} 
                icon={MessageCircle} 
                label="WhatsApp" 
                color="#25D366"
              />
              <SocialButton 
                href={socialLinks.telegram} 
                icon={Share2} 
                label="Telegram" 
                color="#0088CC"
              />
              <SocialButton 
                href={socialLinks.email} 
                icon={Mail} 
                label="Email" 
                color="#6B7280"
              />
            </div>

            <p className="text-xs text-muted-foreground text-center">
              {t('wb:share.shareOnSocial')}
            </p>
          </TabsContent>

          {/* Export Tab */}
          <TabsContent value="export" className="space-y-3 mt-4">
            {/* React Project Export */}
            <div className="p-4 bg-muted/50 rounded-lg space-y-3">
              <div className="flex items-start gap-3">
                <FileCode className="h-7 w-7 text-primary shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-medium text-sm">{t('wb:share.reactProject')}</h4>
                  <p className="text-xs text-muted-foreground">
                    {t('wb:share.reactProjectDesc')}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleReactExport} disabled={reactExporting} className="flex-1" size="sm">
                  {reactExporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                  {reactExporting ? t('wb:share.exporting') : t('wb:share.downloadZip')}
                </Button>
                <Button variant="outline" size="sm" onClick={() => openDeployGuide('react')}>
                  <Rocket className="h-4 w-4 mr-1" /> {t('wb:share.deploy')}
                </Button>
              </div>
            </div>

            {/* JSON Backup */}
            <div className="p-3 bg-muted/30 rounded-lg space-y-2">
              <div className="flex items-center gap-2">
                <Download className="h-5 w-5 text-muted-foreground shrink-0" />
                <div className="flex-1">
                  <h4 className="font-medium text-xs">{t('wb:share.jsonBackup')}</h4>
                  <p className="text-[11px] text-muted-foreground">{t('wb:share.jsonBackupDesc')}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={handleExport}>
                  <Download className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DeployGuide open={deployGuideOpen} onOpenChange={setDeployGuideOpen} format={deployFormat} />
        
        {/* Export Options Dialog */}
        <ExportOptionsDialog
          open={exportOptionsOpen}
          onOpenChange={setExportOptionsOpen}
          onExport={handleHtmlExportWithOptions}
          onPreview={handlePreview}
          isPreviewLoading={isPreviewLoading}
          pageCount={site.pages.length}
          componentCount={totalComponents}
        />
        
        {/* Export Progress Dialog */}
        <ExportProgressDialog
          open={progressDialogOpen}
          onOpenChange={setProgressDialogOpen}
          progress={exportProgress}
          format={exportFormat}
          imageCount={exportStats.imageCount}
          totalFiles={exportStats.totalFiles}
        />
      </DialogContent>
    </Dialog>
  );
}

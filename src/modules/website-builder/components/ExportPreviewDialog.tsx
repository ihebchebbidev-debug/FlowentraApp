/**
 * Export Preview Dialog — shows the generated HTML/React output before
 * the user downloads or publishes.
 *
 * Two tabs:
 *  - Live Preview: in-iframe render of the generated `index.html`
 *    (all assets are stitched in via blob URLs so the iframe renders
 *    standalone, with no external server).
 *  - Files: a tree view of every generated file with a code preview.
 *
 * Used by PublishDialog for both "Preview" and "Export" paths.
 */
import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Download, Eye, FileCode, FileText, FileImage, Folder, Loader2,
  ExternalLink, Smartphone, Tablet, Monitor, Copy, Check, AlertCircle,
} from 'lucide-react';
import type { WebsiteSite } from '../types';
import { generateSiteHtmlWithStats } from '../utils/export/htmlExporter';
import { generateReactProjectWithStats } from '../utils/export/reactExporter';
import { downloadAsZip } from '../utils/export/zipHelper';
import type { ExportedFile, ExportProgress } from '../utils/export/types';
import type { ExportSettings } from './ExportOptionsDialog';

interface ExportPreviewDialogProps {
  site: WebsiteSite;
  settings: ExportSettings | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DEVICE_WIDTHS: Record<'mobile' | 'tablet' | 'desktop', number> = {
  mobile: 390,
  tablet: 768,
  desktop: 1280,
};

function getMimeType(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase() || '';
  const map: Record<string, string> = {
    html: 'text/html', css: 'text/css', js: 'application/javascript',
    json: 'application/json', svg: 'image/svg+xml', png: 'image/png',
    jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif',
    webp: 'image/webp', ico: 'image/x-icon', txt: 'text/plain',
    md: 'text/markdown', ts: 'application/typescript',
    tsx: 'application/typescript', jsx: 'application/javascript',
  };
  return map[ext] || 'application/octet-stream';
}

function isBinaryPath(path: string): boolean {
  const ext = path.split('.').pop()?.toLowerCase() || '';
  return ['png', 'jpg', 'jpeg', 'gif', 'webp', 'ico', 'woff', 'woff2', 'ttf', 'otf'].includes(ext);
}

function fileIcon(path: string) {
  const ext = path.split('.').pop()?.toLowerCase() || '';
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'ico'].includes(ext)) return <FileImage className="h-3.5 w-3.5 text-violet-500" />;
  if (['ts', 'tsx', 'jsx', 'js'].includes(ext)) return <FileCode className="h-3.5 w-3.5 text-amber-500" />;
  if (ext === 'html') return <FileCode className="h-3.5 w-3.5 text-orange-500" />;
  if (ext === 'css') return <FileCode className="h-3.5 w-3.5 text-blue-500" />;
  if (ext === 'json') return <FileCode className="h-3.5 w-3.5 text-emerald-500" />;
  return <FileText className="h-3.5 w-3.5 text-muted-foreground" />;
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

function fileSize(f: ExportedFile): number {
  if (typeof f.content === 'string') return new Blob([f.content]).size;
  return f.content.byteLength;
}

function replaceAll(str: string, search: string, replacement: string): string {
  return str.split(search).join(replacement);
}

/** Stitch an HTML export into one self-contained document for the iframe. */
function stitchHtmlForIframe(files: ExportedFile[]): { html: string | null; createdUrls: string[] } {
  const createdUrls: string[] = [];
  const indexFile = files.find(f => f.path === 'index.html');
  if (!indexFile || typeof indexFile.content !== 'string') return { html: null, createdUrls };

  const assetMap = new Map<string, string>();
  for (const file of files) {
    if (file.path === 'index.html') continue;
    let blob: Blob;
    if (typeof file.content === 'string') {
      blob = new Blob([file.content], { type: getMimeType(file.path) });
    } else {
      blob = new Blob([file.content.buffer as ArrayBuffer], { type: getMimeType(file.path) });
    }
    const u = URL.createObjectURL(blob);
    createdUrls.push(u);
    assetMap.set(file.path, u);
  }

  let html = indexFile.content;
  for (const [path, blobUrl] of assetMap) {
    html = replaceAll(html, `"${path}"`, `"${blobUrl}"`);
    html = replaceAll(html, `'${path}'`, `'${blobUrl}'`);
    html = replaceAll(html, `url(${path})`, `url(${blobUrl})`);
  }

  const cssFile = files.find(f => f.path === 'styles.css');
  if (cssFile && typeof cssFile.content === 'string') {
    let cssContent = cssFile.content;
    for (const [path, blobUrl] of assetMap) {
      cssContent = replaceAll(cssContent, path, blobUrl);
    }
    html = html.replace(
      /<link[^>]*href="[^"]*styles\.css"[^>]*\/?>/i,
      `<style>${cssContent}</style>`,
    );
  }

  const jsFile = files.find(f => f.path === 'scripts.js');
  if (jsFile && typeof jsFile.content === 'string') {
    html = html.replace(
      /<script[^>]*src="[^"]*scripts\.js"[^>]*><\/script>/i,
      `<script>${jsFile.content}</script>`,
    );
  }

  return { html, createdUrls };
}

export function ExportPreviewDialog({ site, settings, open, onOpenChange }: ExportPreviewDialogProps) {
  const { t } = useTranslation('wb');

  const [isBuilding, setIsBuilding] = useState(false);
  const [progress, setProgress] = useState<ExportProgress | null>(null);
  const [files, setFiles] = useState<ExportedFile[]>([]);
  const [stats, setStats] = useState<{ imageCount: number; fileCount: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [device, setDevice] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [iframeUrl, setIframeUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const createdUrlsRef = useRef<string[]>([]);

  const isReact = settings?.format === 'react';

  const cleanupUrls = useCallback(() => {
    createdUrlsRef.current.forEach(u => { try { URL.revokeObjectURL(u); } catch { /* noop */ } });
    createdUrlsRef.current = [];
  }, []);

  // Build the export whenever the dialog opens with fresh settings.
  useEffect(() => {
    if (!open || !settings) return;
    let cancelled = false;

    setIsBuilding(true);
    setError(null);
    setFiles([]);
    setStats(null);
    setIframeUrl(null);
    setSelectedPath(null);
    cleanupUrls();

    const run = async () => {
      try {
        const builder = settings.format === 'react'
          ? generateReactProjectWithStats
          : generateSiteHtmlWithStats;

        const result = await builder(
          site,
          (p) => { if (!cancelled) setProgress(p); },
          { imageOptimization: settings.imageOptimization, platform: settings.platform },
        );

        if (cancelled) return;

        setFiles(result.files);
        setStats({ imageCount: result.stats.imageCount, fileCount: result.files.length });

        // Build iframe preview from HTML output. For React exports, we still
        // generate a parallel HTML build so users see a true preview.
        let htmlFiles: ExportedFile[] = result.files;
        if (settings.format === 'react') {
          const htmlResult = await generateSiteHtmlWithStats(
            site,
            undefined,
            { imageOptimization: settings.imageOptimization, platform: settings.platform },
          );
          htmlFiles = htmlResult.files;
        }

        const { html, createdUrls } = stitchHtmlForIframe(htmlFiles);
        createdUrlsRef.current.push(...createdUrls);
        if (html) {
          const blob = new Blob([html], { type: 'text/html' });
          const url = URL.createObjectURL(blob);
          createdUrlsRef.current.push(url);
          if (!cancelled) setIframeUrl(url);
        }

        // Pre-select a sensible default file
        const preferred = result.files.find(f => f.path === 'index.html')
          ?? result.files.find(f => f.path.endsWith('App.tsx'))
          ?? result.files.find(f => !isBinaryPath(f.path));
        if (preferred) setSelectedPath(preferred.path);
      } catch (err: any) {
        if (!cancelled) setError(err?.message || 'Failed to generate export');
      } finally {
        if (!cancelled) {
          setIsBuilding(false);
          setProgress(null);
        }
      }
    };

    run();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, settings, site]);

  // Revoke blob URLs on close / unmount
  useEffect(() => {
    if (!open) {
      cleanupUrls();
      setIframeUrl(null);
    }
    return cleanupUrls;
  }, [open, cleanupUrls]);

  const selectedFile = useMemo(
    () => (selectedPath ? files.find(f => f.path === selectedPath) ?? null : null),
    [selectedPath, files],
  );

  const totalSize = useMemo(() => files.reduce((s, f) => s + fileSize(f), 0), [files]);

  // Group files by folder for the tree
  const fileTree = useMemo(() => {
    const groups: Record<string, ExportedFile[]> = {};
    for (const f of files) {
      const parts = f.path.split('/');
      const folder = parts.length > 1 ? parts.slice(0, -1).join('/') : '';
      if (!groups[folder]) groups[folder] = [];
      groups[folder].push(f);
    }
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [files]);

  const handleDownload = async () => {
    if (!files.length || !settings) return;
    setIsDownloading(true);
    try {
      await downloadAsZip(files, `${site.slug || 'website'}-${isReact ? 'react' : 'html'}.zip`);
      toast.success(isReact
        ? t('wb:publish.reactProjectDownloaded', { defaultValue: 'React project downloaded' })
        : t('wb:publish.htmlProjectDownloaded', { defaultValue: 'HTML site downloaded' }));
      onOpenChange(false);
    } catch (err: any) {
      toast.error((err?.message || 'Download failed'));
    } finally {
      setIsDownloading(false);
    }
  };

  const handleOpenInTab = () => {
    if (!iframeUrl) return;
    window.open(iframeUrl, '_blank', 'noopener,noreferrer');
  };

  const handleCopyCode = async () => {
    if (!selectedFile || typeof selectedFile.content !== 'string') return;
    try {
      await navigator.clipboard.writeText(selectedFile.content);
      setCopied(true);
      toast.success('Copied to clipboard');
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error('Failed to copy');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl max-h-[92dvh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-3 border-b">
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-primary" />
            {t('wb:publish.exportPreview', { defaultValue: 'Export preview' })}
            <Badge variant="secondary" className="text-[10px] ml-1">
              {isReact ? 'React' : 'HTML'}
            </Badge>
          </DialogTitle>
          <DialogDescription className="flex items-center gap-3 flex-wrap text-xs">
            <span>{t('wb:publish.exportPreviewDesc', { defaultValue: 'Review the generated output before downloading.' })}</span>
            {stats && (
              <>
                <span className="text-muted-foreground">·</span>
                <span className="font-mono">{stats.fileCount} files</span>
                <span className="text-muted-foreground">·</span>
                <span className="font-mono">{stats.imageCount} images</span>
                <span className="text-muted-foreground">·</span>
                <span className="font-mono">{formatBytes(totalSize)}</span>
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        {isBuilding ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 p-12 min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <div className="text-center">
              <p className="text-sm font-medium">
                {progress?.message || t('wb:publish.generating', { defaultValue: 'Generating export…' })}
              </p>
              {progress && progress.total > 0 && (
                <p className="text-xs text-muted-foreground mt-1 font-mono">
                  {progress.current} / {progress.total}
                </p>
              )}
            </div>
          </div>
        ) : error ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 p-12 min-h-[400px]">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <div className="text-center max-w-md">
              <p className="text-sm font-medium text-destructive">{t('wb:publish.exportFailed', { defaultValue: 'Export failed' })}</p>
              <p className="text-xs text-muted-foreground mt-1 break-words">{error}</p>
            </div>
          </div>
        ) : (
          <Tabs defaultValue="preview" className="flex-1 flex flex-col overflow-hidden">
            <div className="px-6 pt-3">
              <TabsList className="grid w-full max-w-md grid-cols-2">
                <TabsTrigger value="preview" className="text-xs">
                  <Eye className="h-3.5 w-3.5 mr-1.5" /> Live preview
                </TabsTrigger>
                <TabsTrigger value="files" className="text-xs">
                  <FileCode className="h-3.5 w-3.5 mr-1.5" /> Files ({files.length})
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="preview" className="flex-1 overflow-hidden p-6 pt-3 m-0 data-[state=inactive]:hidden">
              <div className="h-full flex flex-col gap-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="inline-flex rounded-md border bg-background p-0.5">
                    {(['mobile', 'tablet', 'desktop'] as const).map(d => {
                      const Icon = d === 'mobile' ? Smartphone : d === 'tablet' ? Tablet : Monitor;
                      return (
                        <Button
                          key={d}
                          size="sm"
                          variant={device === d ? 'default' : 'ghost'}
                          className="h-7 px-2.5 text-xs"
                          onClick={() => setDevice(d)}
                          aria-label={`Preview ${d}`}
                        >
                          <Icon className="h-3.5 w-3.5 mr-1.5" />
                          {d.charAt(0).toUpperCase() + d.slice(1)}
                        </Button>
                      );
                    })}
                  </div>
                  <Button size="sm" variant="outline" onClick={handleOpenInTab} disabled={!iframeUrl} className="text-xs">
                    <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> Open in new tab
                  </Button>
                </div>

                <div className="flex-1 min-h-0 rounded-lg border bg-muted/30 flex items-center justify-center overflow-auto p-4">
                  {iframeUrl ? (
                    <div
                      className="bg-background shadow-md rounded-md overflow-hidden transition-[width] duration-200"
                      style={{ width: Math.min(DEVICE_WIDTHS[device], 1280), height: '100%', maxHeight: 720 }}
                    >
                      <iframe
                        src={iframeUrl}
                        title="Export preview"
                        sandbox="allow-scripts allow-same-origin allow-forms"
                        className="w-full h-full border-0"
                      />
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No preview available</p>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="files" className="flex-1 overflow-hidden p-0 m-0 data-[state=inactive]:hidden">
              <div className="h-full grid grid-cols-[260px_1fr] divide-x">
                {/* Tree */}
                <ScrollArea className="h-full">
                  <div className="p-2 space-y-3">
                    {fileTree.map(([folder, items]) => (
                      <div key={folder || 'root'}>
                        <div className="flex items-center gap-1.5 px-2 py-1 text-[11px] uppercase tracking-wide text-muted-foreground font-medium">
                          <Folder className="h-3 w-3" />
                          {folder || 'root'}
                        </div>
                        <div className="space-y-0.5">
                          {items
                            .slice()
                            .sort((a, b) => a.path.localeCompare(b.path))
                            .map(f => {
                              const name = f.path.split('/').pop() || f.path;
                              const isActive = selectedPath === f.path;
                              return (
                                <button
                                  key={f.path}
                                  type="button"
                                  onClick={() => setSelectedPath(f.path)}
                                  className={`w-full flex items-center gap-2 px-2 py-1 rounded text-xs text-left transition-colors ${
                                    isActive
                                      ? 'bg-primary/10 text-primary'
                                      : 'hover:bg-muted text-foreground'
                                  }`}
                                >
                                  {fileIcon(f.path)}
                                  <span className="truncate flex-1">{name}</span>
                                  <span className="text-[10px] text-muted-foreground tabular-nums">
                                    {formatBytes(fileSize(f))}
                                  </span>
                                </button>
                              );
                            })}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                {/* Code preview */}
                <div className="flex flex-col overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/40">
                    <div className="flex items-center gap-2 min-w-0">
                      {selectedFile && fileIcon(selectedFile.path)}
                      <span className="text-xs font-mono truncate">
                        {selectedFile?.path || 'Select a file'}
                      </span>
                      {selectedFile && (
                        <Badge variant="outline" className="text-[10px] shrink-0">
                          {formatBytes(fileSize(selectedFile))}
                        </Badge>
                      )}
                    </div>
                    {selectedFile && typeof selectedFile.content === 'string' && (
                      <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={handleCopyCode}>
                        {copied ? <Check className="h-3.5 w-3.5 mr-1 text-emerald-500" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
                        {copied ? 'Copied' : 'Copy'}
                      </Button>
                    )}
                  </div>
                  <ScrollArea className="flex-1">
                    {selectedFile ? (
                      isBinaryPath(selectedFile.path) ? (
                        <div className="p-6 text-xs text-muted-foreground flex flex-col items-center justify-center gap-2 min-h-[300px]">
                          <FileImage className="h-8 w-8 opacity-50" />
                          <p>Binary file — preview unavailable</p>
                          <p className="font-mono">{formatBytes(fileSize(selectedFile))}</p>
                        </div>
                      ) : (
                        <pre className="text-[11px] font-mono p-4 whitespace-pre-wrap break-words leading-relaxed">
                          {typeof selectedFile.content === 'string'
                            ? selectedFile.content.slice(0, 100_000)
                            : ''}
                          {typeof selectedFile.content === 'string' && selectedFile.content.length > 100_000 && (
                            <span className="block mt-4 text-muted-foreground italic">
                              … truncated ({formatBytes(selectedFile.content.length - 100_000)} more)
                            </span>
                          )}
                        </pre>
                      )
                    ) : (
                      <div className="p-6 text-xs text-muted-foreground">
                        Select a file from the tree to preview its contents.
                      </div>
                    )}
                  </ScrollArea>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}

        <DialogFooter className="px-6 py-4 border-t gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isDownloading}>
            {t('wb:exportOptions.cancel', { defaultValue: 'Cancel' })}
          </Button>
          <Button
            onClick={handleDownload}
            disabled={isBuilding || isDownloading || !!error || !files.length}
          >
            {isDownloading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            {isReact
              ? t('wb:publish.downloadReact', { defaultValue: 'Download React project' })
              : t('wb:publish.downloadHtml', { defaultValue: 'Download HTML site' })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

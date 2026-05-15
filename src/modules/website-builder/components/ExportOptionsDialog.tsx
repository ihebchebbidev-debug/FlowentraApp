/**
 * Export Options Dialog
 */
import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Download, Globe, Github, Zap, Triangle, Cloud,
  Image as ImageIcon, Settings2, Sparkles, Gauge, FileImage,
  ExternalLink, FileCode, Eye, Loader2,
} from 'lucide-react';
import { 
  HOSTING_PRESETS, type HostingPlatform, type HostingPreset, getHostingPreset,
} from '../utils/export/hostingPresets';
import { 
  type ImageOptimizationOptions, DEFAULT_OPTIMIZATION_OPTIONS, formatBytes,
} from '../utils/export/imageOptimizer';

export type ExportFormat = 'html' | 'react';

interface ExportOptionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExport: (options: ExportSettings) => void;
  onPreview?: (options: ExportSettings) => void;
  isPreviewLoading?: boolean;
  pageCount: number;
  componentCount: number;
  initialFormat?: ExportFormat;
}

export interface ExportSettings {
  format: ExportFormat;
  platform: HostingPlatform;
  imageOptimization: ImageOptimizationOptions;
}

const PLATFORM_ICONS: Record<string, React.ReactNode> = {
  Globe: <Globe className="h-5 w-5" />,
  Github: <Github className="h-5 w-5" />,
  Zap: <Zap className="h-5 w-5" />,
  Triangle: <Triangle className="h-5 w-5" />,
  Cloud: <Cloud className="h-5 w-5" />,
};

export function ExportOptionsDialog({
  open, onOpenChange, onExport, onPreview,
  isPreviewLoading = false, pageCount, componentCount, initialFormat = 'react',
}: ExportOptionsDialogProps) {
  const { t } = useTranslation('wb');
  const [selectedFormat] = useState<ExportFormat>('react');
  const [selectedPlatform, setSelectedPlatform] = useState<HostingPlatform>('generic');
  const [optimizationEnabled, setOptimizationEnabled] = useState(true);
  const [convertToWebP, setConvertToWebP] = useState(false);
  const [quality, setQuality] = useState(85);
  const [maxWidth, setMaxWidth] = useState(1920);

  const selectedPreset = useMemo(() => getHostingPreset(selectedPlatform), [selectedPlatform]);

  const handlePlatformSelect = (preset: HostingPreset) => {
    setSelectedPlatform(preset.id);
    const optDefaults = preset.imageOptimization;
    if (optDefaults.enabled !== undefined) setOptimizationEnabled(optDefaults.enabled);
    if (optDefaults.convertToWebP !== undefined) setConvertToWebP(optDefaults.convertToWebP);
    if (optDefaults.quality !== undefined) setQuality(Math.round(optDefaults.quality * 100));
    if (optDefaults.maxWidth !== undefined) setMaxWidth(optDefaults.maxWidth);
  };

  const buildSettings = (): ExportSettings => {
    const imageOptimization: ImageOptimizationOptions = {
      ...DEFAULT_OPTIMIZATION_OPTIONS,
      enabled: optimizationEnabled, convertToWebP,
      quality: quality / 100, maxWidth,
      maxHeight: Math.round(maxWidth * (9 / 16)),
    };
    return { format: selectedFormat, platform: selectedPlatform, imageOptimization };
  };

  const handleExport = () => { onExport(buildSettings()); onOpenChange(false); };
  const handlePreview = () => { onPreview?.(buildSettings()); };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-primary" />
            {t('exportOptions.exportOptions')}
          </DialogTitle>
          <DialogDescription>
            {t('exportOptions.configureExport', { pages: pageCount, components: componentCount })}
          </DialogDescription>
        </DialogHeader>

        {/* Format Info */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">{t('exportOptions.exportFormat')}</Label>
          <div className="flex items-center gap-2.5 p-3 rounded-lg border border-primary bg-primary/5 ring-1 ring-primary/20">
            <FileCode className="h-4 w-4 text-primary shrink-0" />
            <div>
              <p className="text-sm font-medium">{t('exportOptions.reactProject')}</p>
              <p className="text-[10px] text-muted-foreground">{t('exportOptions.reactProjectDesc')}</p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="platform" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="platform" className="text-xs">
              <Globe className="h-3.5 w-3.5 mr-1.5" />
              {selectedFormat === 'html' ? t('exportOptions.hostingPlatform') : t('exportOptions.platform')}
            </TabsTrigger>
            <TabsTrigger value="images" className="text-xs">
              <ImageIcon className="h-3.5 w-3.5 mr-1.5" />
              {t('exportOptions.imageOptimization')}
            </TabsTrigger>
          </TabsList>

          {/* Platform Selection Tab */}
          <TabsContent value="platform" className="mt-4 space-y-3">
            <p className="text-sm text-muted-foreground">
              {selectedFormat === 'html' ? t('exportOptions.platformDescHtml') : t('exportOptions.platformDesc')}
            </p>
            <div className="grid gap-2">
              {HOSTING_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handlePlatformSelect(preset)}
                  className={`flex items-start gap-3 p-3 rounded-lg border text-left transition-all ${
                    selectedPlatform === preset.id
                      ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                      : 'border-border hover:border-primary/50 hover:bg-muted/50'
                  }`}
                >
                  <div className="p-2 rounded-lg shrink-0" style={{ backgroundColor: `${preset.color}15` }}>
                    <span style={{ color: preset.color }}>{PLATFORM_ICONS[preset.icon]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-sm">{preset.name}</h4>
                      {selectedPlatform === preset.id && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{t('exportOptions.selected')}</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{preset.description}</p>
                    {selectedFormat === 'html' && preset.configFiles.length > 0 && (
                      <p className="text-[10px] text-primary mt-1">
                        {t('exportOptions.configFilesIncluded', { count: preset.configFiles.length })}
                      </p>
                    )}
                  </div>
                  {preset.docsUrl && (
                    <a href={preset.docsUrl} target="_blank" rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()} className="text-muted-foreground hover:text-primary p-1">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </button>
              ))}
            </div>

            {selectedPreset.deploySteps.length > 0 && (
              <div className="mt-4 p-3 rounded-lg bg-muted/50 space-y-2">
                <h5 className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  {t('exportOptions.quickDeploySteps')}
                </h5>
                <ol className="text-xs text-muted-foreground space-y-1 pl-4 list-decimal">
                  {selectedPreset.deploySteps.slice(0, 3).map((step, i) => (
                    <li key={i}>{step}</li>
                  ))}
                  {selectedPreset.deploySteps.length > 3 && (
                    <li className="text-primary">{t('exportOptions.moreSteps', { count: selectedPreset.deploySteps.length - 3 })}</li>
                  )}
                </ol>
              </div>
            )}
          </TabsContent>

          {/* Image Optimization Tab */}
          <TabsContent value="images" className="mt-4 space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10"><Gauge className="h-4 w-4 text-primary" /></div>
                <div>
                  <Label className="text-sm font-medium">{t('exportOptions.enableOptimization')}</Label>
                  <p className="text-xs text-muted-foreground">{t('exportOptions.enableOptimizationDesc')}</p>
                </div>
              </div>
              <Switch checked={optimizationEnabled} onCheckedChange={setOptimizationEnabled} />
            </div>

            {optimizationEnabled && (
              <>
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-accent"><FileImage className="h-4 w-4 text-accent-foreground" /></div>
                    <div>
                      <Label className="text-sm font-medium">{t('exportOptions.convertToWebP')}</Label>
                      <p className="text-xs text-muted-foreground">{t('exportOptions.convertToWebPDesc')}</p>
                    </div>
                  </div>
                  <Switch checked={convertToWebP} onCheckedChange={setConvertToWebP} />
                </div>

                <div className="space-y-3 p-3 rounded-lg border">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">{t('exportOptions.quality')}</Label>
                    <span className="text-sm font-mono text-muted-foreground">{quality}%</span>
                  </div>
                  <Slider value={[quality]} onValueChange={([v]) => setQuality(v)} min={50} max={100} step={5} className="w-full" />
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>{t('exportOptions.smallerFiles')}</span>
                    <span>{t('exportOptions.higherQuality')}</span>
                  </div>
                </div>

                <div className="space-y-3 p-3 rounded-lg border">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">{t('exportOptions.maxWidth')}</Label>
                    <span className="text-sm font-mono text-muted-foreground">{maxWidth}px</span>
                  </div>
                  <Slider value={[maxWidth]} onValueChange={([v]) => setMaxWidth(v)} min={640} max={2560} step={320} className="w-full" />
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>640px ({t('exportOptions.mobile')})</span>
                    <span>2560px ({t('exportOptions.fourK')})</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">{t('exportOptions.quickPresets')}</Label>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1 text-xs"
                      onClick={() => { setQuality(85); setMaxWidth(1920); setConvertToWebP(false); }}>
                      {t('exportOptions.balanced')}
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1 text-xs"
                      onClick={() => { setQuality(75); setMaxWidth(1280); setConvertToWebP(true); }}>
                      {t('exportOptions.performance')}
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1 text-xs"
                      onClick={() => { setQuality(92); setMaxWidth(2560); setConvertToWebP(false); }}>
                      {t('exportOptions.qualityPreset')}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-6 gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('exportOptions.cancel')}</Button>
          {onPreview && (
            <Button variant="secondary" onClick={handlePreview} disabled={isPreviewLoading}>
              {isPreviewLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Eye className="h-4 w-4 mr-2" />}
              {t('exportOptions.preview')}
            </Button>
          )}
          <Button onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            {t('exportOptions.exportReactProject')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

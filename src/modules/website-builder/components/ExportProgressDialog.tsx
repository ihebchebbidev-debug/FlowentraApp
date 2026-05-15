/**
 * Export Progress Dialog
 * 
 * Shows real-time progress when exporting a website to HTML or React.
 * Displays a progress bar, percentage, and current phase message.
 */
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { 
  Loader2, 
  FileCode, 
  Image, 
  Package, 
  Check,
  Globe,
} from 'lucide-react';
import type { ExportProgress } from '../utils/export/types';

interface ExportProgressDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  progress: ExportProgress | null;
  format: 'html' | 'react';
  imageCount?: number;
  totalFiles?: number;
}

export function ExportProgressDialog({
  open,
  onOpenChange,
  progress,
  format,
  imageCount = 0,
  totalFiles = 0,
}: ExportProgressDialogProps) {
  const percentage = progress 
    ? Math.round((progress.current / Math.max(progress.total, 1)) * 100)
    : 0;

  const isComplete = progress?.phase === 'complete';
  const isPackaging = progress?.phase === 'packaging';

  const getPhaseIcon = () => {
    if (isComplete) {
      return <Check className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />;
    }
    if (isPackaging) {
      return <Package className="h-5 w-5 text-primary animate-pulse" />;
    }
    if (progress?.message?.includes('image') || progress?.message?.includes('Extracting')) {
      return <Image className="h-5 w-5 text-primary" />;
    }
    return <Loader2 className="h-5 w-5 text-primary animate-spin" />;
  };

  const getPhaseLabel = () => {
    if (!progress) return 'Preparing...';
    
    switch (progress.phase) {
      case 'generating':
        if (progress.message?.includes('image') || progress.message?.includes('Extracting')) {
          return 'Extracting Images';
        }
        return 'Generating Pages';
      case 'packaging':
        return 'Creating ZIP';
      case 'complete':
        return 'Complete!';
      default:
        return 'Processing...';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {format === 'html' ? (
              <Globe className="h-5 w-5 text-primary" />
            ) : (
              <FileCode className="h-5 w-5 text-primary" />
            )}
            Exporting {format === 'html' ? 'Static HTML' : 'React Project'}
          </DialogTitle>
          <DialogDescription>
            Please wait while we prepare your files for download.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                {getPhaseIcon()}
                <span className="font-medium">{getPhaseLabel()}</span>
              </div>
              <span className="text-muted-foreground font-mono text-sm">
                {percentage}%
              </span>
            </div>
            <Progress value={percentage} className="h-2" />
          </div>

          {/* Current Status */}
          {progress && (
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              {/* Current message */}
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  {isComplete ? (
                    <div className="h-2 w-2 rounded-full bg-emerald-600 dark:bg-emerald-400" />
                  ) : (
                    <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground flex-1">
                  {progress.message}
                </p>
              </div>

              {/* Progress details */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/50">
                <div className="text-center">
                  <p className="text-lg font-semibold text-foreground">
                    {progress.current}
                  </p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                    Processed
                  </p>
                </div>
                <div className="text-center border-x border-border/50">
                  <p className="text-lg font-semibold text-foreground">
                    {progress.total}
                  </p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                    Total
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold text-foreground">
                    {imageCount > 0 ? imageCount : (totalFiles || '-')}
                  </p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                    {imageCount > 0 ? 'Images' : 'Files'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Completion message */}
          {isComplete && (
            <div className="flex items-center gap-2 p-3 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 rounded-lg text-sm">
              <Check className="h-4 w-4 shrink-0" />
              <span>Export complete! Your download should start automatically.</span>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

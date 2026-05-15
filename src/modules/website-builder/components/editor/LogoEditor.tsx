/**
 * LogoEditor — unified editor for logo text + logo image.
 * Users can enter a text logo, upload/paste a logo image, or use both.
 * The navbar/footer blocks already support both; this editor surfaces that capability.
 */
import React, { useRef, useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Upload, X, Type, Image as ImageIcon } from 'lucide-react';
import { readFileAsDataUrl, getImageLabel, isImageSrc } from '../../utils/imageUtils';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type LogoMode = 'text' | 'image' | 'both';

interface LogoEditorProps {
  /** Text logo value (company name) */
  logoText: string;
  /** Image logo value (URL or base64) */
  logoImage: string;
  /** Called when the text logo changes */
  onTextChange: (value: string) => void;
  /** Called when the image logo changes */
  onImageChange: (value: string) => void;
}

/** Check if a string looks like an image file path */
function looksLikeImagePath(value: string): boolean {
  if (!value) return false;
  return isImageSrc(value) && /\.(png|jpe?g|gif|webp|svg|avif)(\?|$)/i.test(value);
}

function detectMode(text: string, image: string): LogoMode {
  const hasText = !!text.trim() && !looksLikeImagePath(text);
  const hasImage = (!!image && isImageSrc(image)) || looksLikeImagePath(text);
  if (hasText && hasImage) return 'both';
  if (hasImage) return 'image';
  return 'text';
}

export function LogoEditor({ logoText, logoImage, onTextChange, onImageChange }: LogoEditorProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<LogoMode>(() => detectMode(logoText, logoImage));

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await readFileAsDataUrl(file);
      onImageChange(dataUrl);
      if (mode === 'text') setMode('both');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to upload logo');
    }
    e.target.value = '';
  };

  // If logoText is actually an image path, treat it as the image source
  const effectiveImage = logoImage || (looksLikeImagePath(logoText) ? logoText : '');
  const hasImage = !!effectiveImage && isImageSrc(effectiveImage);

  const tabs: { key: LogoMode; icon: React.ReactNode; label: string }[] = [
    { key: 'text', icon: <Type className="h-3 w-3" />, label: 'Text' },
    { key: 'image', icon: <ImageIcon className="h-3 w-3" />, label: 'Image' },
    { key: 'both', icon: <><Type className="h-3 w-3" /><span>+</span><ImageIcon className="h-3 w-3" /></>, label: 'Both' },
  ];

  return (
    <div className="space-y-2">
      <Label className="text-[11px] font-medium text-foreground/70">Logo</Label>

      {/* Mode toggle */}
      <div className="flex gap-0.5 p-0.5 rounded-lg bg-muted/30 border border-border/30">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setMode(tab.key)}
            className={cn(
              'flex-1 flex items-center justify-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium transition-all',
              mode === tab.key
                ? 'bg-background text-foreground shadow-sm border border-border/40'
                : 'text-muted-foreground hover:text-foreground/70 hover:bg-muted/20'
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Text input */}
      {(mode === 'text' || mode === 'both') && (
        <div className="space-y-1">
          <Label className="text-[10px] text-foreground/50">Logo Text</Label>
          <Input
            value={logoText}
            onChange={(e) => onTextChange(e.target.value)}
            placeholder="Company name..."
            className="h-7 text-[11px] border-border/30 bg-background"
          />
        </div>
      )}

      {/* Image uploader */}
      {(mode === 'image' || mode === 'both') && (
        <div className="space-y-1">
          <Label className="text-[10px] text-foreground/50">Logo Image</Label>
          {hasImage ? (
            <div className="flex items-center gap-2 p-2 rounded-lg border border-border/40 bg-muted/10">
              <img
                src={effectiveImage}
                alt="Logo preview"
                className="h-10 w-auto max-w-[80px] object-contain rounded"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-foreground/60 truncate">
                  {getImageLabel(effectiveImage)}
                </p>
                <button
                  onClick={() => inputRef.current?.click()}
                  className="text-[10px] text-primary hover:underline font-medium mt-0.5"
                >
                  Change
                </button>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive"
                onClick={() => {
                  onImageChange('');
                  // If logoText was acting as the image, clear it too
                  if (looksLikeImagePath(logoText)) onTextChange('');
                  if (mode === 'image') setMode('text');
                  else if (mode === 'both') setMode('text');
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <div className="space-y-1.5">
              <button
                onClick={() => inputRef.current?.click()}
                className="w-full h-14 flex flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-border/40 bg-muted/10 hover:bg-muted/20 hover:border-primary/30 transition-all cursor-pointer"
              >
                <Upload className="h-4 w-4 text-muted-foreground/40" />
                <span className="text-[10px] text-muted-foreground/50 font-medium">Upload logo image</span>
              </button>
              <Input
                placeholder="Or paste image URL..."
                className="h-7 text-[10px] border-border/30 bg-background"
                onBlur={(e) => {
                  const url = e.target.value.trim();
                  if (url && isImageSrc(url)) {
                    onImageChange(url);
                    e.target.value = '';
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const url = (e.target as HTMLInputElement).value.trim();
                    if (url && isImageSrc(url)) {
                      onImageChange(url);
                      (e.target as HTMLInputElement).value = '';
                    }
                  }
                }}
              />
            </div>
          )}
        </div>
      )}

      {/* Hint */}
      <p className="text-[9px] text-muted-foreground/40 leading-snug">
        {mode === 'text' && 'Displays as styled text in the header/footer.'}
        {mode === 'image' && 'Image logo replaces text in the header/footer.'}
        {mode === 'both' && 'Shows logo image with text alongside it.'}
      </p>

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml,image/avif"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  );
}

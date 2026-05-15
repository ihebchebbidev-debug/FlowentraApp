/**
 * ImageUploader — upload an image file or paste a URL.
 * Uses imageService (API provider) when available, falls back to base64 data URLs.
 * Shows a thumbnail preview instead of raw base64/blob strings.
 */
import React, { useRef, useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { readFileAsDataUrl, getImageLabel, isImageSrc } from '../../utils/imageUtils';
import { imageService } from '../../services/imageService';
import { toast } from 'sonner';

interface ImageUploaderProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

export function ImageUploader({ label, value, onChange }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      // Try uploading via imageService (API provider when connected)
      const result = await imageService.upload(file, { optimize: true });
      if (result.success && result.data) {
        onChange(result.data.url);
        setUploading(false);
        e.target.value = '';
        return;
      }
    } catch {
      // API provider failed — fall through to base64 fallback
    }

    // Fallback: convert to base64 data URL
    try {
      const dataUrl = await readFileAsDataUrl(file);
      onChange(dataUrl);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to upload image');
    } finally {
      setUploading(false);
    }
    e.target.value = '';
  };

  const handleUrlSubmit = async (url: string) => {
    if (!url || !isImageSrc(url)) return;

    // If it's already an external URL (not data:), use it directly
    if (url.startsWith('http://') || url.startsWith('https://')) {
      onChange(url);
      return;
    }

    // For data URLs, try uploading via imageService
    setUploading(true);
    try {
      const result = await imageService.uploadFromUrl(url);
      if (result.success && result.data) {
        onChange(result.data.url);
        setUploading(false);
        return;
      }
    } catch {
      // Fallback to raw URL
    }

    onChange(url);
    setUploading(false);
  };

  const hasImage = !!value && isImageSrc(value);

  return (
    <div className="space-y-1.5">
      <Label className="text-[11px] font-medium text-foreground/70">{label}</Label>

      {hasImage ? (
        <div className="relative group">
          <div className="flex items-center gap-2 p-2 rounded-lg border border-border/40 bg-muted/10">
            <img
              src={value}
              alt="Preview"
              className="h-12 w-16 object-cover rounded border border-border/20 bg-muted/20 shrink-0"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-foreground/60 truncate">
                {getImageLabel(value)}
              </p>
              <button
                onClick={() => inputRef.current?.click()}
                className="text-[10px] text-primary hover:underline font-medium mt-0.5"
                disabled={uploading}
              >
                {uploading ? 'Uploading…' : 'Change image'}
              </button>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive"
              onClick={() => onChange('')}
              disabled={uploading}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-1.5">
          <button
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="w-full h-20 flex flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-border/40 bg-muted/10 hover:bg-muted/20 hover:border-primary/30 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? (
              <>
                <Loader2 className="h-5 w-5 text-primary animate-spin" />
                <span className="text-[10px] text-muted-foreground font-medium">Uploading…</span>
              </>
            ) : (
              <>
                <ImageIcon className="h-5 w-5 text-muted-foreground/30" />
                <span className="text-[10px] text-muted-foreground/50 font-medium">
                  Click to upload image
                </span>
              </>
            )}
          </button>
          <Input
            placeholder="Or paste image URL..."
            className="h-7 text-[10px] border-border/30 bg-background"
            disabled={uploading}
            onBlur={(e) => {
              const url = e.target.value.trim();
              if (url && isImageSrc(url)) {
                handleUrlSubmit(url);
                e.target.value = '';
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const url = (e.target as HTMLInputElement).value.trim();
                if (url && isImageSrc(url)) {
                  handleUrlSubmit(url);
                  (e.target as HTMLInputElement).value = '';
                }
              }
            }}
          />
        </div>
      )}

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

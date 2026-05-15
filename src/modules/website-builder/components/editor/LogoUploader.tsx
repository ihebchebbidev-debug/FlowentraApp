/**
 * LogoUploader — lets users upload a logo image or paste a URL.
 * Uses base64 data URIs so logos persist in localStorage.
 */
import React, { useRef } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Upload, X } from 'lucide-react';
import { readFileAsDataUrl, getImageLabel, isImageSrc } from '../../utils/imageUtils';
import { toast } from 'sonner';

interface LogoUploaderProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

export function LogoUploader({ label, value, onChange }: LogoUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await readFileAsDataUrl(file);
      onChange(dataUrl);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to upload logo');
    }
    e.target.value = '';
  };

  const hasValidImage = !!value && isImageSrc(value);

  return (
    <div className="space-y-1.5">
      <Label className="text-[11px] font-medium text-foreground/70">{label}</Label>

      {hasValidImage ? (
        <div className="relative group">
          <div className="flex items-center gap-2 p-2 rounded-lg border border-border/40 bg-muted/10">
            <img
              src={value}
              alt="Logo preview"
              className="h-10 w-auto max-w-[80px] object-contain rounded"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-foreground/60 truncate">
                {getImageLabel(value)}
              </p>
              <button
                onClick={() => inputRef.current?.click()}
                className="text-[10px] text-primary hover:underline font-medium mt-0.5"
              >
                Change logo
              </button>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive"
              onClick={() => onChange('')}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-1.5">
          <button
            onClick={() => inputRef.current?.click()}
            className="w-full h-16 flex flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-border/40 bg-muted/10 hover:bg-muted/20 hover:border-primary/30 transition-all cursor-pointer"
          >
            <Upload className="h-4 w-4 text-muted-foreground/40" />
            <span className="text-[10px] text-muted-foreground/50 font-medium">Upload logo</span>
          </button>
          <Input
            placeholder="Or paste image URL..."
            className="h-7 text-[10px] border-border/30 bg-background"
            onBlur={(e) => {
              const url = e.target.value.trim();
              if (url && isImageSrc(url)) {
                onChange(url);
                e.target.value = '';
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const url = (e.target as HTMLInputElement).value.trim();
                if (url && isImageSrc(url)) {
                  onChange(url);
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

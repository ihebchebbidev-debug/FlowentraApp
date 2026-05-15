import React, { useCallback } from 'react';
import { SiteTheme } from '../../../types';
import { ImageIcon, Upload } from 'lucide-react';
import { useImageDrop } from '../../../hooks/useImageDrop';
import { readFileAsDataUrl } from '../../../utils/imageUtils';
import { toast } from 'sonner';

interface ImageTextBlockProps {
  title: string;
  description: string;
  imageUrl?: string;
  imagePosition?: 'left' | 'right';
  overlay?: boolean;
  bgColor?: string;
  theme: SiteTheme;
  isEditing?: boolean;
  onUpdate?: (props: Record<string, any>) => void;
  style?: React.CSSProperties;
}

export function ImageTextBlock({ title, description, imageUrl, imagePosition = 'left', overlay, bgColor, theme, isEditing, onUpdate, style }: ImageTextBlockProps) {
  const handleImageDrop = useCallback((imageUrl: string) => {
    onUpdate?.({ imageUrl });
  }, [onUpdate]);

  const { isDragOver, dropProps } = useImageDrop(handleImageDrop);

  const handleFileInput = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const dataUrl = await readFileAsDataUrl(file);
        onUpdate?.({ imageUrl: dataUrl });
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to upload image');
      }
    };
    input.click();
  };

  const imgContent = (
    <div
      className="aspect-video rounded-xl overflow-hidden bg-muted relative"
      style={{ borderRadius: theme.borderRadius }}
      {...(isEditing ? dropProps : {})}
    >
      {isDragOver && isEditing && (
        <div className="absolute inset-0 z-20 bg-primary/20 border-2 border-dashed border-primary rounded-xl flex items-center justify-center backdrop-blur-sm">
          <div className="bg-background/90 rounded-lg p-4 flex flex-col items-center gap-1.5 shadow-md">
            <ImageIcon className="h-6 w-6 text-primary" />
            <p className="text-xs font-medium">Drop image</p>
          </div>
        </div>
      )}
      {imageUrl ? (
        <>
          <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
          {isEditing && (
            <button
              onClick={handleFileInput}
              className="absolute bottom-2 right-2 z-10 flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium bg-black/60 text-white hover:bg-black/80 transition-colors"
            >
              <Upload className="h-3 w-3" /> Change
            </button>
          )}
        </>
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          {isEditing ? (
            <div className="text-center space-y-2">
              <ImageIcon className="h-8 w-8 mx-auto text-muted-foreground/40" />
              <p className="text-xs text-muted-foreground">Drag & drop image or</p>
              <button
                onClick={handleFileInput}
                className="text-xs font-medium text-primary hover:underline"
              >
                Browse files
              </button>
            </div>
          ) : (
            <span className="text-muted-foreground text-sm">No image</span>
          )}
        </div>
      )}
    </div>
  );

  const textContent = (
    <div className="flex flex-col justify-center">
      {isEditing ? (
        <>
          <h2
            contentEditable suppressContentEditableWarning
            onBlur={(e) => onUpdate?.({ title: e.currentTarget.textContent || '' })}
            className="text-3xl font-bold mb-4 outline-none focus:ring-1 focus:ring-primary/30 rounded px-1"
            style={{ color: theme.textColor, fontFamily: theme.headingFont }}
          >{title}</h2>
           <p
            contentEditable suppressContentEditableWarning
            onBlur={(e) => onUpdate?.({ description: e.currentTarget.innerHTML })}
            className="text-base leading-relaxed opacity-80 outline-none focus:ring-1 focus:ring-primary/30 rounded px-1"
            style={{ color: theme.secondaryColor, fontFamily: theme.bodyFont }}
            dangerouslySetInnerHTML={{ __html: description }}
          />
        </>
      ) : (
        <>
          <h2 className="text-3xl font-bold mb-4" style={{ color: theme.textColor, fontFamily: theme.headingFont }}>{title}</h2>
          <p className="text-base leading-relaxed opacity-80" style={{ color: theme.secondaryColor, fontFamily: theme.bodyFont }} dangerouslySetInnerHTML={{ __html: description }} />
        </>
      )}
    </div>
  );

  return (
    <section className="py-10 sm:py-16 px-4 sm:px-6" style={{ fontFamily: theme.bodyFont, backgroundColor: bgColor || 'transparent', ...style }}>
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
        {imagePosition === 'left' ? (
          <>{imgContent}{textContent}</>
        ) : (
          <>{textContent}{imgContent}</>
        )}
      </div>
    </section>
  );
}

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { FileText, ImageIcon, Loader2, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { PROOF_ACCEPT, PROOF_MAX_BYTES } from './paymentProofUpload';

interface ProofFileDropzoneProps {
  /** Files staged for upload (controlled). */
  files: File[];
  onFilesChange: (files: File[]) => void;
  /** When set, files are handed over immediately (used by the manage-proofs dialog). */
  autoUpload?: boolean;
  uploading?: boolean;
  disabled?: boolean;
  className?: string;
}

const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/** Thumbnail for images, icon otherwise. Object URLs are revoked on unmount. */
function FileThumb({ file }: { file: File }) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file.type.startsWith('image/')) return;
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  if (url) {
    return (
      <img
        src={url}
        alt={file.name}
        className="h-10 w-10 rounded object-cover border border-border shrink-0"
      />
    );
  }
  const isImage = file.type.startsWith('image/');
  const Icon = isImage ? ImageIcon : FileText;
  return (
    <div className="h-10 w-10 rounded bg-muted flex items-center justify-center shrink-0">
      <Icon className="h-4 w-4 text-muted-foreground" />
    </div>
  );
}

/**
 * Drag & drop / click-to-browse zone for proof-of-payment attachments.
 * Enforces the shared 20MB limit and accepted types before anything is staged.
 */
export function ProofFileDropzone({
  files,
  onFilesChange,
  autoUpload = false,
  uploading = false,
  disabled = false,
  className,
}: ProofFileDropzoneProps) {
  const { t } = useTranslation('payments');
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const addFiles = useCallback(
    (picked: File[]) => {
      if (!picked.length) return;
      const valid = picked.filter((f) => f.size <= PROOF_MAX_BYTES);
      if (valid.length !== picked.length) {
        toast.error(t('fileTooLarge', 'File is too large (max 20MB)'));
      }
      if (!valid.length) return;
      onFilesChange(autoUpload ? valid : [...files, ...valid]);
    },
    [autoUpload, files, onFilesChange, t]
  );

  const interactive = !disabled && !uploading;

  return (
    <div className={cn('space-y-2', className)}>
      {/* Drop zone */}
      <div
        role="button"
        tabIndex={interactive ? 0 : -1}
        aria-disabled={!interactive}
        onClick={() => interactive && inputRef.current?.click()}
        onKeyDown={(e) => {
          if (!interactive) return;
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => { e.preventDefault(); if (interactive) setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragActive(false);
          if (!interactive) return;
          addFiles(Array.from(e.dataTransfer.files ?? []));
        }}
        className={cn(
          'rounded-lg border-2 border-dashed px-4 py-5 text-center transition-colors outline-none',
          interactive ? 'cursor-pointer hover:border-primary/60 hover:bg-muted/40' : 'opacity-60 cursor-not-allowed',
          dragActive ? 'border-primary bg-primary/5' : 'border-border'
        )}
      >
        <div className="flex flex-col items-center gap-1.5">
          {uploading ? (
            <Loader2 className="h-5 w-5 text-primary animate-spin" />
          ) : (
            <Upload className={cn('h-5 w-5', dragActive ? 'text-primary' : 'text-muted-foreground')} />
          )}
          <p className="text-xs font-medium">
            {uploading
              ? t('uploading', 'Uploading...')
              : t('proofDropzoneTitle', 'Drop files here or click to browse')}
          </p>
          <p className="text-[11px] text-muted-foreground">
            {t('proofDropzoneHint', 'PDF or images, up to 20MB each. Saved to this record\'s documents.')}
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={PROOF_ACCEPT}
          className="hidden"
          disabled={!interactive}
          onChange={(e) => {
            addFiles(Array.from(e.target.files ?? []));
            e.target.value = '';
          }}
        />
      </div>

      {/* Staged files */}
      {!autoUpload && files.length > 0 && (
        <div className="space-y-1.5">
          {files.map((file, idx) => (
            <div
              key={`${file.name}-${idx}`}
              className="flex items-center gap-2.5 rounded-md border border-border bg-card px-2.5 py-2"
            >
              <FileThumb file={file} />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium truncate" title={file.name}>{file.name}</p>
                <p className="text-[11px] text-muted-foreground">{formatSize(file.size)}</p>
              </div>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-6 w-6 text-muted-foreground hover:text-destructive shrink-0"
                disabled={uploading}
                onClick={() => onFilesChange(files.filter((_, i) => i !== idx))}
                aria-label={t('remove', 'Remove')}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
          <p className="text-[11px] text-muted-foreground">
            {t('proofFilesSelected', '{{count}} file(s) selected', { count: files.length })}
          </p>
        </div>
      )}
    </div>
  );
}

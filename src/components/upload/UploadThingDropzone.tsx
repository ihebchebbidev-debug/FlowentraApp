// UploadThing Dropzone Component 
// Supports both official @uploadthing/react hooks (with backend handler) 
// and direct client uploads (fallback when no backend handler)
import React, { useState, useCallback } from 'react';
import { Upload, X, CheckCircle, AlertCircle, Loader2, FileIcon, ImageIcon } from 'lucide-react';
import { useDropzone } from '@uploadthing/react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { uploadThingClientService } from '@/services/uploadThingClientService';

export interface UploadedFile {
  url: string;
  key: string;
  name: string;
  size: number;
  type: string;
}

interface UploadThingDropzoneProps {
  onUploadComplete?: (files: UploadedFile[]) => void;
  onUploadError?: (error: Error) => void;
  maxFiles?: number;
  maxSizeMB?: number;
  acceptedTypes?: string[];
  className?: string;
  disabled?: boolean;
  endpoint?: 'imageUploader' | 'documentUploader';
}

interface FileWithStatus {
  file: File;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  result?: UploadedFile;
  error?: string;
  preview?: string;
}

export function UploadThingDropzone({
  onUploadComplete,
  onUploadError,
  maxFiles = 5,
  maxSizeMB = 10,
  acceptedTypes,
  className,
  disabled = false,
}: UploadThingDropzoneProps) {
  const [files, setFiles] = useState<FileWithStatus[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const validateFile = useCallback((file: File): string | null => {
    if (file.size > maxSizeMB * 1024 * 1024) {
      return `File size exceeds ${maxSizeMB}MB limit`;
    }
    if (acceptedTypes && acceptedTypes.length > 0) {
      const fileType = file.type || '';
      const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
      const isAccepted = acceptedTypes.some(type => {
        if (type.startsWith('.')) return `.${fileExt}` === type.toLowerCase();
        if (type.endsWith('/*')) return fileType.startsWith(type.replace('/*', '/'));
        return fileType === type;
      });
      if (!isAccepted) return `File type not accepted. Allowed: ${acceptedTypes.join(', ')}`;
    }
    return null;
  }, [maxSizeMB, acceptedTypes]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const remainingSlots = maxFiles - files.length;
    const filesToAdd = acceptedFiles.slice(0, remainingSlots);
    
    const newFileStatuses: FileWithStatus[] = filesToAdd.map(file => {
      const error = validateFile(file);
      let preview: string | undefined;
      if (file.type.startsWith('image/')) {
        preview = URL.createObjectURL(file);
      }
      return {
        file,
        status: error ? 'error' : 'pending',
        progress: 0,
        error: error || undefined,
        preview,
      };
    });
    
    setFiles(prev => [...prev, ...newFileStatuses]);
  }, [files.length, maxFiles, validateFile]);

  // Use the official useDropzone hook from @uploadthing/react
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    disabled: disabled || files.length >= maxFiles,
    accept: acceptedTypes 
      ? acceptedTypes.reduce((acc, type) => ({ ...acc, [type]: [] }), {})
      : undefined,
  });

  const removeFile = useCallback((index: number) => {
    setFiles(prev => {
      const file = prev[index];
      if (file?.preview) URL.revokeObjectURL(file.preview);
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  // Upload using direct client service (doesn't require backend route handler)
  const handleUploadFiles = useCallback(async () => {
    const pendingFiles = files.filter(f => f.status === 'pending');
    if (pendingFiles.length === 0) return;

    setIsUploading(true);
    const uploadedResults: UploadedFile[] = [];

    for (let i = 0; i < files.length; i++) {
      const fileStatus = files[i];
      if (fileStatus.status !== 'pending') continue;

      setFiles(prev => prev.map((f, idx) => 
        idx === i ? { ...f, status: 'uploading' as const, progress: 10 } : f
      ));

      try {
        const result = await uploadThingClientService.uploadFile(
          fileStatus.file,
          (progress) => {
            setFiles(prev => prev.map((f, idx) => 
              idx === i ? { ...f, progress } : f
            ));
          }
        );

        if (!result.success) {
          throw new Error(result.error || 'Upload failed');
        }

        const uploadedFile: UploadedFile = {
          url: result.fileUrl,
          key: result.fileKey,
          name: result.fileName,
          size: result.fileSize,
          type: result.contentType,
        };

        uploadedResults.push(uploadedFile);
        setFiles(prev => prev.map((f, idx) => 
          idx === i ? { ...f, status: 'success' as const, progress: 100, result: uploadedFile } : f
        ));
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Upload failed';
        setFiles(prev => prev.map((f, idx) => 
          idx === i ? { ...f, status: 'error' as const, progress: 0, error: errorMessage } : f
        ));
        onUploadError?.(error instanceof Error ? error : new Error(errorMessage));
      }
    }

    setIsUploading(false);

    if (uploadedResults.length > 0) {
      onUploadComplete?.(uploadedResults);
    }
  }, [files, onUploadComplete, onUploadError]);

  const clearCompleted = useCallback(() => {
    setFiles(prev => {
      prev.forEach(f => {
        if (f.status === 'success' && f.preview) URL.revokeObjectURL(f.preview);
      });
      return prev.filter(f => f.status !== 'success');
    });
  }, []);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const pendingCount = files.filter(f => f.status === 'pending').length;
  const successCount = files.filter(f => f.status === 'success').length;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Dropzone Area using official getRootProps/getInputProps */}
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
          isDragActive && !disabled && "border-primary bg-primary/5",
          !isDragActive && "border-border hover:border-primary/50",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-2">
          <Upload className="h-10 w-10 text-muted-foreground" />
          <div className="text-sm text-muted-foreground">
            <span className="font-medium text-primary">Click to upload</span> or drag and drop
          </div>
          <div className="text-xs text-muted-foreground">
            Max {maxSizeMB}MB per file • {maxFiles - files.length} files remaining
          </div>
        </div>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((fileStatus, index) => (
            <Card key={index} className="p-3">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  {fileStatus.preview ? (
                    <img 
                      src={fileStatus.preview} 
                      alt={fileStatus.file.name}
                      className="h-10 w-10 rounded object-cover"
                    />
                  ) : fileStatus.status === 'success' && fileStatus.result?.url ? (
                    fileStatus.file.type.startsWith('image/') ? (
                      <img 
                        src={fileStatus.result.url} 
                        alt={fileStatus.file.name}
                        className="h-10 w-10 rounded object-cover"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded bg-success/10 flex items-center justify-center">
                        <CheckCircle className="h-5 w-5 text-success" />
                      </div>
                    )
                  ) : fileStatus.status === 'uploading' ? (
                    <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center">
                      <Loader2 className="h-5 w-5 text-primary animate-spin" />
                    </div>
                  ) : fileStatus.status === 'error' ? (
                    <div className="h-10 w-10 rounded bg-destructive/10 flex items-center justify-center">
                      <AlertCircle className="h-5 w-5 text-destructive" />
                    </div>
                  ) : fileStatus.file.type.startsWith('image/') ? (
                    <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                      <ImageIcon className="h-5 w-5 text-muted-foreground" />
                    </div>
                  ) : (
                    <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                      <FileIcon className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium truncate">{fileStatus.file.name}</span>
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      {formatFileSize(fileStatus.file.size)}
                    </span>
                  </div>
                  
                  {fileStatus.status === 'uploading' && (
                    <Progress value={fileStatus.progress} className="h-1 mt-2" />
                  )}
                  
                  {fileStatus.status === 'error' && fileStatus.error && (
                    <div className="text-xs text-destructive mt-1">{fileStatus.error}</div>
                  )}
                  
                  {fileStatus.status === 'success' && fileStatus.result && (
                    <a 
                      href={fileStatus.result.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline mt-1 block truncate"
                    >
                      {fileStatus.result.url}
                    </a>
                  )}
                </div>

                {fileStatus.status !== 'uploading' && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 flex-shrink-0"
                    onClick={() => removeFile(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Action Buttons */}
      {files.length > 0 && (
        <div className="flex gap-2 justify-end">
          {successCount > 0 && (
            <Button variant="outline" size="sm" onClick={clearCompleted}>
              Clear Completed ({successCount})
            </Button>
          )}
          {pendingCount > 0 && (
            <Button 
              size="sm" 
              onClick={handleUploadFiles} 
              disabled={isUploading || disabled}
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                `Upload ${pendingCount} File${pendingCount > 1 ? 's' : ''}`
              )}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export default UploadThingDropzone;

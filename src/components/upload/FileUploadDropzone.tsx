import React, { useState, useCallback } from 'react';
import { Upload, X, FileIcon, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { uploadThingService, UploadResponse } from '@/services/uploadThingService';
import { toast } from 'sonner';

interface FileUploadDropzoneProps {
  onUploadComplete?: (files: UploadResponse[]) => void;
  onUploadError?: (error: Error) => void;
  maxFiles?: number;
  maxSizeMB?: number;
  acceptedTypes?: string[];
  className?: string;
  disabled?: boolean;
}

interface FileWithStatus {
  file: File;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  result?: UploadResponse;
  error?: string;
}

export function FileUploadDropzone({
  onUploadComplete,
  onUploadError,
  maxFiles = 5,
  maxSizeMB = 16,
  acceptedTypes,
  className,
  disabled = false,
}: FileUploadDropzoneProps) {
  const [files, setFiles] = useState<FileWithStatus[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const validateFile = useCallback((file: File): string | null => {
    if (file.size > maxSizeMB * 1024 * 1024) {
      return `File size exceeds ${maxSizeMB}MB limit`;
    }
    if (acceptedTypes && acceptedTypes.length > 0) {
      const isAccepted = acceptedTypes.some(type => {
        if (type.startsWith('.')) {
          return file.name.toLowerCase().endsWith(type.toLowerCase());
        }
        if (type.endsWith('/*')) {
          return file.type.startsWith(type.replace('/*', '/'));
        }
        return file.type === type;
      });
      if (!isAccepted) {
        return `File type not accepted. Allowed: ${acceptedTypes.join(', ')}`;
      }
    }
    return null;
  }, [maxSizeMB, acceptedTypes]);

  const handleFiles = useCallback((newFiles: FileList | File[]) => {
    const fileArray = Array.from(newFiles);
    
    if (files.length + fileArray.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} files allowed`);
      return;
    }

    const validFiles: FileWithStatus[] = [];
    
    fileArray.forEach(file => {
      const error = validateFile(file);
      if (error) {
        toast.error(`${file.name}: ${error}`);
      } else {
        validFiles.push({
          file,
          status: 'pending',
          progress: 0,
        });
      }
    });

    setFiles(prev => [...prev, ...validFiles]);
  }, [files.length, maxFiles, validateFile]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    handleFiles(e.dataTransfer.files);
  }, [disabled, handleFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  }, [handleFiles]);

  const removeFile = useCallback((index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const uploadFiles = useCallback(async () => {
    const pendingFiles = files.filter(f => f.status === 'pending');
    if (pendingFiles.length === 0) return;

    setIsUploading(true);
    const results: UploadResponse[] = [];

    for (let i = 0; i < files.length; i++) {
      if (files[i].status !== 'pending') continue;

      setFiles(prev => prev.map((f, idx) => 
        idx === i ? { ...f, status: 'uploading', progress: 0 } : f
      ));

      let progressInterval: ReturnType<typeof setInterval> | undefined;
      try {
        // Simulate progress
        progressInterval = setInterval(() => {
          setFiles(prev => prev.map((f, idx) => 
            idx === i && f.status === 'uploading' 
              ? { ...f, progress: Math.min(f.progress + 10, 90) } 
              : f
          ));
        }, 200);

        const result = await uploadThingService.uploadFile(files[i].file);
        
        clearInterval(progressInterval);

        setFiles(prev => prev.map((f, idx) => 
          idx === i ? { ...f, status: 'success', progress: 100, result } : f
        ));

        results.push(result);
      } catch (error) {
        clearInterval(progressInterval);
        
        setFiles(prev => prev.map((f, idx) => 
          idx === i ? { 
            ...f, 
            status: 'error', 
            progress: 0, 
            error: error instanceof Error ? error.message : 'Upload failed' 
          } : f
        ));

        if (onUploadError && error instanceof Error) {
          onUploadError(error);
        }
      }
    }

    setIsUploading(false);

    if (results.length > 0 && onUploadComplete) {
      onUploadComplete(results);
    }
  }, [files, onUploadComplete, onUploadError]);

  const clearCompleted = useCallback(() => {
    setFiles(prev => prev.filter(f => f.status !== 'success'));
  }, []);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const pendingCount = files.filter(f => f.status === 'pending').length;
  const successCount = files.filter(f => f.status === 'success').length;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Dropzone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          'border-2 border-dashed rounded-lg p-8 text-center transition-colors',
          isDragging && 'border-primary bg-primary/5',
          disabled && 'opacity-50 cursor-not-allowed',
          !disabled && 'cursor-pointer hover:border-primary/50'
        )}
        onClick={() => !disabled && document.getElementById('file-upload-input')?.click()}
      >
        <input
          id="file-upload-input"
          type="file"
          multiple
          className="hidden"
          onChange={handleFileInput}
          disabled={disabled}
          accept={acceptedTypes?.join(',')}
        />
        
        <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-sm text-muted-foreground mb-2">
          <span className="font-semibold text-foreground">Click to upload</span> or drag and drop
        </p>
        <p className="text-xs text-muted-foreground">
          Max {maxSizeMB}MB per file • Max {maxFiles} files
        </p>
        {acceptedTypes && (
          <p className="text-xs text-muted-foreground mt-1">
            Accepted: {acceptedTypes.join(', ')}
          </p>
        )}
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((fileItem, index) => (
            <div
              key={`${fileItem.file.name}-${index}`}
              className="flex items-center gap-3 p-3 border rounded-lg bg-card"
            >
              <FileIcon className="h-8 w-8 text-muted-foreground flex-shrink-0" />
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{fileItem.file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(fileItem.file.size)}
                </p>
                
                {fileItem.status === 'uploading' && (
                  <Progress value={fileItem.progress} className="h-1 mt-2" />
                )}
                
                {fileItem.status === 'error' && (
                  <p className="text-xs text-destructive mt-1">{fileItem.error}</p>
                )}
                
                {fileItem.status === 'success' && fileItem.result && (
                  <p className="text-xs text-muted-foreground mt-1 truncate">
                    {fileItem.result.fileUrl}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                {fileItem.status === 'pending' && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(index);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
                
                {fileItem.status === 'uploading' && (
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                )}
                
                {fileItem.status === 'success' && (
                  <CheckCircle className="h-5 w-5 text-success" />
                )}
                
                {fileItem.status === 'error' && (
                  <AlertCircle className="h-5 w-5 text-destructive" />
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      {files.length > 0 && (
        <div className="flex gap-2 justify-end">
          {successCount > 0 && (
            <Button variant="outline" size="sm" onClick={clearCompleted}>
              Clear Completed
            </Button>
          )}
          
          {pendingCount > 0 && (
            <Button 
              size="sm" 
              onClick={uploadFiles}
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>Upload {pendingCount} file{pendingCount > 1 ? 's' : ''}</>
              )}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export default FileUploadDropzone;

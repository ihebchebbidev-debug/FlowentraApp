import React, { useState, useCallback, useRef } from 'react';
import { Upload, X, FileIcon, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TestFileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFileSelected: (file: File) => void;
  testName: string;
  acceptedTypes?: string;
}

export function TestFileUploadModal({
  isOpen,
  onClose,
  onFileSelected,
  testName,
  acceptedTypes = '*/*',
}: TestFileUploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      setSelectedFile(file);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  }, []);

  const handleConfirm = () => {
    if (selectedFile) {
      onFileSelected(selectedFile);
      setSelectedFile(null);
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
    onClose();
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            Upload Test File
          </DialogTitle>
          <DialogDescription>
            Select a file to upload for test: <span className="font-medium text-foreground">{testName}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Drop Zone */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all',
              isDragging && 'border-primary bg-primary/5 scale-[1.02]',
              !isDragging && 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50'
            )}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileInput}
              accept={acceptedTypes}
            />
            
            <Upload className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">Click to select</span> or drag and drop
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Max 16MB per file
            </p>
          </div>

          {/* Selected File Preview */}
          {selectedFile && (
            <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/50">
              <FileIcon className="h-8 w-8 text-primary flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(selectedFile.size)} • {selectedFile.type || 'Unknown type'}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 flex-shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedFile(null);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!selectedFile}>
            <Upload className="h-4 w-4 mr-2" />
            Upload & Continue Test
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Global state for file upload modal
type FileUploadCallback = (file: File) => void;
type FileUploadCancelCallback = () => void;

interface PendingUpload {
  testName: string;
  acceptedTypes?: string;
  resolve: FileUploadCallback;
  reject: FileUploadCancelCallback;
}

let pendingUpload: PendingUpload | null = null;
let modalOpenCallback: ((pending: PendingUpload | null) => void) | null = null;

export const registerModalCallback = (callback: (pending: PendingUpload | null) => void) => {
  modalOpenCallback = callback;
};

export const requestFileUpload = (testName: string, acceptedTypes?: string): Promise<File> => {
  return new Promise((resolve, reject) => {
    pendingUpload = {
      testName,
      acceptedTypes,
      resolve: (file: File) => {
        pendingUpload = null;
        modalOpenCallback?.(null);
        resolve(file);
      },
      reject: () => {
        pendingUpload = null;
        modalOpenCallback?.(null);
        reject(new Error('File upload cancelled by user'));
      },
    };
    modalOpenCallback?.(pendingUpload);
  });
};

export const getPendingUpload = () => pendingUpload;

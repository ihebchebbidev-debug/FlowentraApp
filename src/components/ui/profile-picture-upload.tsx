import { useState, useRef } from 'react';
import { getAuthHeadersNoContentType , getMutationHeaders, getMutationHeadersNoContentType} from '@/utils/apiHeaders';
import { Button } from '@/components/ui/button';
import { Upload, X, Loader2, Camera } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

import { API_URL } from '@/config/api';

/** Resolve a profile picture URL (relative path, doc: ref, or absolute) */
export function resolveProfilePictureUrl(url?: string | null): string {
  if (!url) return '';
  if (url.startsWith('data:') || url.startsWith('blob:') || url.startsWith('http')) return url;
  if (url.startsWith('doc:')) {
    const docId = url.replace('doc:', '');
    return `${API_URL}/api/Documents/download/${docId}`;
  }
  return `${API_URL}/${url.replace(/^\//, '')}`;
}

interface ProfilePictureUploadProps {
  currentUrl?: string | null;
  onUploaded: (url: string) => void;
  onRemoved?: () => void;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  label?: string;
}

export function ProfilePictureUpload({
  currentUrl,
  onUploaded,
  onRemoved,
  size = 'md',
  disabled = false,
  label = 'Profile Picture',
}: ProfilePictureUploadProps) {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sizeClasses = {
    sm: 'h-16 w-16',
    md: 'h-24 w-24',
    lg: 'h-32 w-32',
  };

  const resolvedUrl = resolveProfilePictureUrl(currentUrl);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: 'Invalid file type', description: 'Please upload an image file.', variant: 'destructive' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Maximum file size is 5MB.', variant: 'destructive' });
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('files', file);
      formData.append('moduleType', 'profile');
      formData.append('category', 'profile-picture');
      formData.append('description', 'Profile Picture');

      const response = await fetch(`${API_URL}/api/Documents/upload`, {
        method: 'POST',
        headers: getMutationHeadersNoContentType(),
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      const result = await response.json();
      const docs = result.documents || result.data || (Array.isArray(result) ? result : [result]);
      const uploadedDoc = docs[0];

      // Build direct URL from the file path returned by backend
      const filePath = uploadedDoc?.filePath || uploadedDoc?.FilePath || uploadedDoc?.path || uploadedDoc?.Path;
      const docId = uploadedDoc?.id || uploadedDoc?.Id;

      let pictureUrl = '';
      if (filePath) {
        // Use the relative file path directly — frontend resolves via API_URL + path
        pictureUrl = filePath.replace(/^\//, '');
      } else if (docId) {
        // Fallback to download endpoint
        pictureUrl = `api/Documents/download/${docId}`;
      }

      if (!pictureUrl) throw new Error('No file path returned');

      console.log('[ProfilePictureUpload] File uploaded, now saving URL to profile:', pictureUrl);
      
      // IMPORTANT: await the callback so errors propagate properly
      await onUploaded(pictureUrl);

      toast({ title: 'Photo uploaded', description: 'Profile picture updated successfully.' });
    } catch (error) {
      console.error('[ProfilePictureUpload] Upload failed:', error);
      toast({ title: 'Upload failed', description: 'Failed to upload profile picture.', variant: 'destructive' });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">{label}</label>
      <div className="flex items-center gap-4">
        {/* Avatar Preview */}
        <div className={`relative ${sizeClasses[size]} rounded-full border-2 border-dashed border-border bg-muted/30 flex items-center justify-center overflow-hidden group`}>
          {resolvedUrl ? (
            <>
              <img
                src={resolvedUrl}
                alt="Profile"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              {!disabled && onRemoved && (
                <button
                  onClick={onRemoved}
                  className="absolute top-0 right-0 p-1 rounded-full bg-destructive/90 text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Remove photo"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
              {!disabled && (
                <div
                  className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Camera className="h-5 w-5 text-white" />
                </div>
              )}
            </>
          ) : (
            <div
              className={`w-full h-full flex items-center justify-center text-muted-foreground/40 ${!disabled ? 'cursor-pointer hover:text-muted-foreground/60' : ''}`}
              onClick={() => !disabled && fileInputRef.current?.click()}
            >
              {isUploading ? (
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              ) : (
                <Camera className="h-6 w-6" />
              )}
            </div>
          )}
        </div>

        {/* Upload Controls */}
        <div className="flex flex-col gap-1.5">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleUpload}
            className="hidden"
            disabled={disabled || isUploading}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || isUploading}
            className="w-fit text-xs"
          >
            {isUploading ? (
              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
            ) : (
              <Upload className="h-3.5 w-3.5 mr-1.5" />
            )}
            {isUploading ? 'Uploading...' : resolvedUrl ? 'Change Photo' : 'Upload Photo'}
          </Button>
          <p className="text-[10px] text-muted-foreground">PNG, JPG — max 5MB</p>
        </div>
      </div>
    </div>
  );
}

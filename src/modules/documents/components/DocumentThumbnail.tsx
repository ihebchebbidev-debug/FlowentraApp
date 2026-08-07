import { useState, useEffect, memo } from 'react';
import { Image as ImageIcon, FileText } from 'lucide-react';

import { API_URL } from '@/config/api';
import { getAuthHeaders } from '@/utils/apiHeaders';

const IMAGE_TYPES = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
const failedThumbnailIds = new Set<string>();

interface DocumentThumbnailProps {
  docId: string;
  fileType: string;
  fileName: string;
  /** Tailwind classes for the outer wrapper */
  className?: string;
  /** Size variant */
  size?: 'sm' | 'md';
}

/**
 * Renders an authenticated image thumbnail for image files,
 * or a file-type icon for non-image files.
 */
export const DocumentThumbnail = memo(function DocumentThumbnail({
  docId,
  fileType,
  fileName,
  className = '',
  size = 'md',
}: DocumentThumbnailProps) {
  const isImage = IMAGE_TYPES.includes(fileType.toLowerCase());
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(() => failedThumbnailIds.has(docId));

  useEffect(() => {
    if (!isImage || failedThumbnailIds.has(docId)) return;

    let revoked = false;

    fetch(`${API_URL}/api/Documents/download/${docId}`, {
      headers: getAuthHeaders(),
    })
      .then((res) => {
        if (!res.ok) throw new Error('load failed');
        return res.blob();
      })
      .then((blob) => {
        if (revoked) return;
        setBlobUrl(URL.createObjectURL(blob));
      })
      .catch(() => {
        if (!revoked) {
          failedThumbnailIds.add(docId);
          setFailed(true);
        }
      });

    return () => {
      revoked = true;
    };
  }, [docId, isImage]);

  // Clean up blob URL on unmount
  useEffect(() => {
    return () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [blobUrl]);

  const sizeClasses = size === 'sm' ? 'h-8 w-8' : 'h-10 w-10';
  const iconSize = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';

  // Non-image → icon fallback
  if (!isImage || failed) {
    const Icon = isImage ? ImageIcon : (fileType === 'pdf' ? FileText : FileText);
    return (
      <div className={`${sizeClasses} rounded-lg bg-muted flex items-center justify-center flex-shrink-0 ${className}`}>
        <Icon className={`${iconSize} text-muted-foreground`} />
      </div>
    );
  }

  // Image loading or loaded
  return (
    <div className={`${sizeClasses} rounded-lg overflow-hidden bg-muted flex-shrink-0 ${className}`}>
      {blobUrl ? (
        <img
          src={blobUrl}
          alt={fileName}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="h-full w-full flex items-center justify-center">
          <div className="h-3 w-3 rounded-full border-2 border-muted-foreground/30 border-t-primary animate-spin" />
        </div>
      )}
    </div>
  );
});

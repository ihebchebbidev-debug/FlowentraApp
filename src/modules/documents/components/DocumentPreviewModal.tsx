import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Download, 
  Calendar,
  User,
  FileText,
  Image as ImageIcon,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { Document } from '../types';
import { DocumentsService } from '../services/documents.service';

interface DocumentPreviewModalProps {
  document: Document;
  isOpen: boolean;
  onClose: () => void;
  onDownload?: (doc: Document) => void;
}

export function DocumentPreviewModal({ document, isOpen, onClose, onDownload }: DocumentPreviewModalProps) {
  const { t } = useTranslation();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const previewType = DocumentsService.getPreviewType(document);
  const canPreview = previewType !== 'unsupported';

  // Load preview content when modal opens
  useEffect(() => {
    if (!isOpen || !canPreview) {
      setPreviewUrl(null);
      setTextContent(null);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    const loadPreview = async () => {
      try {
        if (previewType === 'text') {
          const text = await DocumentsService.fetchDocumentText(document);
          if (!cancelled) {
            setTextContent(text);
            setLoading(false);
          }
        } else {
          // For images and PDFs, get blob URL
          const blobUrl = await DocumentsService.getPreviewBlobUrl(document);
          if (!cancelled) {
            setPreviewUrl(blobUrl);
            setLoading(false);
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError('Failed to load preview');
          setLoading(false);
        }
      }
    };

    loadPreview();

    return () => {
      cancelled = true;
      // Revoke blob URL on cleanup
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [isOpen, document.id, previewType, canPreview]);

  // Cleanup blob URL when component unmounts or modal closes
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString();
  };

  const handleDownload = () => {
    if (onDownload) {
      onDownload(document);
    } else {
      DocumentsService.downloadDocument(document);
    }
  };

  const handleOpenNewTab = () => {
    if (previewUrl) {
      window.open(previewUrl, '_blank');
    }
  };

  const isImage = previewType === 'image';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isImage ? <ImageIcon className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
            {document.originalName}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden">
          {/* Preview Section */}
          <div className="lg:col-span-2 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">{t('documents.preview')}</h3>
              <div className="flex items-center gap-2">
                {previewUrl && (
                  <Button variant="ghost" size="sm" onClick={handleOpenNewTab} title={t('documents.openInNewTab')}>
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={handleDownload}>
                  <Download className="h-4 w-4 mr-2" />
                  {t('documents.download')}
                </Button>
              </div>
            </div>

            <div className="flex-1 border rounded-lg overflow-hidden bg-muted/30">
              {/* Loading State */}
              {loading && (
                <div className="flex flex-col h-full p-6 space-y-4 animate-pulse">
                  <div className="h-6 w-48 bg-muted rounded" />
                  <div className="flex-1 bg-muted/40 rounded-lg" />
                </div>
              )}

              {/* Error State */}
              {error && !loading && (
                <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                  <FileText className="h-16 w-16 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">{error}</p>
                  <Button onClick={handleDownload}>
                    <Download className="h-4 w-4 mr-2" />
                    {t('documents.download')}
                  </Button>
                </div>
              )}

              {/* Image Preview */}
              {!loading && !error && previewType === 'image' && previewUrl && (
                <div className="flex items-center justify-center h-full p-4">
                  <img
                    src={previewUrl}
                    alt={document.originalName}
                    className="max-w-full max-h-full object-contain rounded"
                    onError={() => setError('Failed to load image')}
                  />
                </div>
              )}

              {/* PDF Preview */}
              {!loading && !error && previewType === 'pdf' && previewUrl && (
                <iframe
                  src={`${previewUrl}#toolbar=1`}
                  className="w-full h-full"
                  title={document.originalName}
                />
              )}

              {/* Text Preview */}
              {!loading && !error && previewType === 'text' && textContent !== null && (
                <div className="h-full p-4 overflow-auto">
                  <pre className="whitespace-pre-wrap break-words text-sm font-mono bg-muted/50 p-4 rounded-lg">
                    {textContent}
                  </pre>
                </div>
              )}

              {/* Unsupported File Type */}
              {!loading && !error && previewType === 'unsupported' && (
                <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                  <FileText className="h-16 w-16 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">{t('documents.previewNotAvailable')}</h3>
                  <p className="text-muted-foreground mb-2">{t('documents.previewNotSupported')}</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    {t('documents.supportedFormats')}: PDF, Images (JPG, PNG, GIF, WebP), Text files
                  </p>
                  <Button className="mt-2" onClick={handleDownload}>
                    <Download className="h-4 w-4 mr-2" />
                    {t('documents.download')}
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Info Section */}
          <div className="flex flex-col gap-4 overflow-y-auto">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">{t('documents.fileInfo')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-muted-foreground">{t('documents.fileName')}</span>
                  <p className="text-sm">{document.fileName}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">{t('documents.fileType')}</span>
                  <p className="text-sm uppercase">{document.fileType}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">{t('documents.fileSize')}</span>
                  <p className="text-sm">{DocumentsService.formatFileSize(document.fileSize)}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">{t('documents.module')}</span>
                  <div className="mt-1">
                    <Badge className="text-xs">
                      {t(`documents.${document.moduleType}`)}
                    </Badge>
                  </div>
                </div>
                {document.moduleName && (
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">{t('documents.associatedRecord')}</span>
                    <p className="text-sm">{document.moduleName}</p>
                  </div>
                )}
                <div>
                  <span className="text-sm font-medium text-muted-foreground">{t('documents.uploadedBy')}</span>
                  <p className="text-sm flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {document.uploadedByName}
                  </p>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">{t('documents.uploadDate')}</span>
                  <p className="text-sm flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(document.uploadedAt)}
                  </p>
                </div>
                {document.description && (
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">{t('documents.description')}</span>
                    <p className="text-sm">{document.description}</p>
                  </div>
                )}
                {document.tags.length > 0 && (
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">{t('documents.tags')}</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {document.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

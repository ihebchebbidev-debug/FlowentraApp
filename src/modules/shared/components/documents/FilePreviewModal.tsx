import { useState, useEffect } from 'react';
import { getAuthHeaders } from '@/utils/apiHeaders';
import { ContentSkeleton } from '@/components/ui/page-skeleton';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, X, Loader2, ExternalLink, FileText } from 'lucide-react';
import { Document } from '@/modules/documents/types';
import { DocumentsService } from '@/modules/documents/services/documents.service';

const translations = {
  en: {
    preview: 'Preview',
    download: 'Download',
    openNewTab: 'Open in new tab',
    close: 'Close',
    loading: 'Loading preview...',
    noPreview: 'Preview not available for this file type',
    textLoadError: 'Failed to load file content',
  },
  fr: {
    preview: 'Aperçu',
    download: 'Télécharger',
    openNewTab: 'Ouvrir dans un nouvel onglet',
    close: 'Fermer',
    loading: 'Chargement de l\'aperçu...',
    noPreview: 'Aperçu non disponible pour ce type de fichier',
    textLoadError: 'Échec du chargement du contenu',
  },
};

interface FilePreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: Document | null;
}

type PreviewType = 'pdf' | 'image' | 'text' | 'unsupported';

function getPreviewType(fileType: string): PreviewType {
  const imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'];
  const textTypes = ['txt', 'csv', 'json', 'xml', 'md', 'log', 'html', 'css', 'js', 'ts', 'tsx', 'jsx'];

  if (fileType === 'pdf') return 'pdf';
  if (imageTypes.includes(fileType)) return 'image';
  if (textTypes.includes(fileType)) return 'text';
  return 'unsupported';
}

export function FilePreviewModal({ open, onOpenChange, document: doc }: FilePreviewModalProps) {
  const { i18n } = useTranslation();
  const language = (i18n.language.startsWith('fr') ? 'fr' : 'en') as 'en' | 'fr';
  const t = translations[language];

  const [textContent, setTextContent] = useState<string | null>(null);
  const [textLoading, setTextLoading] = useState(false);
  const [textError, setTextError] = useState(false);

  const previewType = doc ? getPreviewType(doc.fileType) : 'unsupported';
  const previewUrl = doc ? DocumentsService.getPreviewUrl(doc) : null;

  // Fetch text content for text files
  useEffect(() => {
    if (!open || !doc || previewType !== 'text' || !previewUrl) {
      setTextContent(null);
      setTextError(false);
      return;
    }

    let cancelled = false;
    setTextLoading(true);
    setTextError(false);

    fetch(previewUrl, {
      headers: getAuthHeaders(),
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed');
        return res.text();
      })
      .then(text => {
        if (!cancelled) {
          setTextContent(text);
          setTextLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setTextError(true);
          setTextLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [open, doc?.id, previewType, previewUrl]);

  if (!doc) return null;

  const handleDownload = async () => {
    try {
      await DocumentsService.downloadDocument(doc);
    } catch {
      // handled silently
    }
  };

  const handleOpenNewTab = () => {
    if (previewUrl) {
      window.open(previewUrl, '_blank');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[95vw] h-[85vh] flex flex-col p-0 gap-0">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="truncate pr-4">
              {doc.originalName || doc.fileName}
            </DialogTitle>
            <div className="flex items-center gap-2 flex-shrink-0">
              {previewUrl && (
                <Button variant="ghost" size="sm" onClick={handleOpenNewTab} title={t.openNewTab}>
                  <ExternalLink className="h-4 w-4" />
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={handleDownload} title={t.download}>
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            {doc.fileType.toUpperCase()} • {DocumentsService.formatFileSize(doc.fileSize)}
          </p>
        </DialogHeader>

        {/* Content */}
        <div className="flex-1 overflow-auto min-h-0">
          {previewType === 'pdf' && previewUrl && (
            <iframe
              src={`${previewUrl}#toolbar=1`}
              className="w-full h-full border-0"
              title={doc.originalName || doc.fileName}
            />
          )}

          {previewType === 'image' && previewUrl && (
            <div className="flex items-center justify-center h-full p-4 bg-muted/30">
              <img
                src={previewUrl}
                alt={doc.originalName || doc.fileName}
                className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          )}

          {previewType === 'text' && (
            <div className="h-full p-4">
              {textLoading && (
                <div className="flex items-center justify-center h-full">
                  <ContentSkeleton rows={6} />
                </div>
              )}
              {textError && (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <FileText className="h-8 w-8 mr-2 opacity-50" />
                  <p>{t.textLoadError}</p>
                </div>
              )}
              {textContent !== null && !textLoading && !textError && (
                <pre className="whitespace-pre-wrap break-words text-sm font-mono bg-muted/50 p-4 rounded-lg h-full overflow-auto">
                  {textContent}
                </pre>
              )}
            </div>
          )}

          {previewType === 'unsupported' && (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-4">
              <FileText className="h-16 w-16 opacity-30" />
              <p>{t.noPreview}</p>
              <Button onClick={handleDownload} variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                {t.download}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

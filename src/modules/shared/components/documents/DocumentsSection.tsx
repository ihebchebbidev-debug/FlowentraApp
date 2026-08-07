import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Plus, 
  Upload, 
  File, 
  Image, 
  Download, 
  Eye, 
  Trash2
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const translations = {
  en: {
    title: 'Documents',
    addDocument: 'Add Document',
    noDocuments: 'No documents attached',
    noDocumentsHint: 'Click "Add Document" to upload files',
    deleteConfirmTitle: 'Delete Document',
    deleteConfirmDescription: 'Are you sure you want to delete this document? This action cannot be undone.',
    cancel: 'Cancel',
    delete: 'Delete',
    view: 'View',
    download: 'Download',
    uploadedBy: 'by',
    dragDropHint: 'Drag & drop files here or click to browse',
    chooseFiles: 'Choose Files',
  },
  fr: {
    title: 'Documents',
    addDocument: 'Ajouter un Document',
    noDocuments: 'Aucun document attaché',
    noDocumentsHint: 'Cliquez sur "Ajouter un Document" pour télécharger des fichiers',
    deleteConfirmTitle: 'Supprimer le Document',
    deleteConfirmDescription: 'Êtes-vous sûr de vouloir supprimer ce document? Cette action est irréversible.',
    cancel: 'Annuler',
    delete: 'Supprimer',
    view: 'Voir',
    download: 'Télécharger',
    uploadedBy: 'par',
    dragDropHint: 'Glissez-déposez les fichiers ici ou cliquez pour parcourir',
    chooseFiles: 'Choisir des Fichiers',
  },
};

interface Attachment {
  id: string;
  name: string;
  type: 'pdf' | 'image' | 'document' | 'other';
  size: string;
  uploadedAt: Date;
  uploadedBy: string;
  category?: string;
}

interface DocumentsSectionProps {
  attachments?: Attachment[];
  onAttachmentsChange?: (attachments: Attachment[]) => void;
}

export function DocumentsSection({ 
  attachments: externalAttachments,
  onAttachmentsChange,
}: DocumentsSectionProps) {
  const { i18n } = useTranslation();
  const language = (i18n.language.startsWith('fr') ? 'fr' : 'en') as 'en' | 'fr';
  const t = translations[language];
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Local attachments state (if not controlled externally)
  const [localAttachments, setLocalAttachments] = useState<Attachment[]>([]);
  const attachments = externalAttachments ?? localAttachments;
  const setAttachments = onAttachmentsChange ?? setLocalAttachments;

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingAttachment, setDeletingAttachment] = useState<Attachment | null>(null);

  // File upload handling
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newAttachments: Attachment[] = Array.from(files).map(file => ({
        id: `att-${Date.now()}-${Math.random()}`,
        name: file.name,
        type: file.type.includes('image') ? 'image' : 
              file.type.includes('pdf') ? 'pdf' : 'document',
        size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
        uploadedAt: new Date(),
        uploadedBy: 'Current User',
      }));
      setAttachments([...attachments, ...newAttachments]);
      toast.success(language === 'fr' ? 'Fichier(s) téléchargé(s)' : 'File(s) uploaded');
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDeleteClick = (att: Attachment) => {
    setDeletingAttachment(att);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    if (deletingAttachment) {
      setAttachments(attachments.filter(a => a.id !== deletingAttachment.id));
      setDeletingAttachment(null);
    }
    setShowDeleteConfirm(false);
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return <FileText className="h-5 w-5 text-destructive" />;
      case 'image':
        return <Image className="h-5 w-5 text-primary" />;
      default:
        return <File className="h-5 w-5 text-muted-foreground" />;
    }
  };

  return (
    <Card className="hover:shadow-lg transition-all duration-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {t.title}
            {attachments.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {attachments.length}
              </Badge>
            )}
          </CardTitle>
          
          <Button size="sm" className="gap-2" onClick={() => fileInputRef.current?.click()}>
            <Plus className="h-4 w-4" />
            {t.addDocument}
          </Button>
          
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {attachments.length === 0 ? (
          <div 
            className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>{t.noDocuments}</p>
            <p className="text-sm">{t.dragDropHint}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {attachments.map((att) => (
              <div
                key={`file-${att.id}`}
                className="flex items-center gap-4 p-3 rounded-lg border bg-card hover:shadow-md transition-all group"
              >
                <div className="flex-shrink-0 p-2 rounded-lg bg-muted">
                  {getFileIcon(att.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium truncate">{att.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    {att.size} • {t.uploadedBy} {att.uploadedBy} • {format(att.uploadedAt, 'MMM d, yyyy')}
                  </p>
                </div>
                
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    onClick={() => handleDeleteClick(att)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.deleteConfirmTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.deleteConfirmDescription}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

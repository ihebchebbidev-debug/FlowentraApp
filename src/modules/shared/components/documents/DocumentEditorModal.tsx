import { useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DocumentsService } from '@/modules/documents/services/documents.service';
import { Upload, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  moduleType: string;
  moduleId?: string;
  moduleName?: string;
  showFileUpload?: boolean;
  onCreated?: (docs: any[]) => void;
}

export function DocumentEditorModal({
  open,
  onOpenChange,
  moduleType,
  moduleId,
  moduleName,
  showFileUpload = true,
  onCreated,
}: Props) {
  const { i18n } = useTranslation();
  const language = (i18n.language && i18n.language.startsWith('fr')) ? 'fr' : 'en';
  const t = {
    en: {
      addDocumentTitle: 'Add Document',
      title: 'Title',
      category: 'Category',
      attachFile: 'Attach File (optional)',
      orAddLink: 'Or add external link',
      linkHint: "If a link is provided, file upload is optional; opening the document will redirect to the link.",
      cancel: 'Cancel',
      save: 'Save',
      saving: 'Saving...',
      needLinkOrFile: 'Please provide a link or attach a file',
      invalidUrl: 'Please enter a valid URL',
      fileTooLarge: 'File is too large (max 50 MB)',
      fileTypeNotAllowed: 'File type not allowed',
      fileUploaded: 'File uploaded',
      linkAdded: 'Link added',
      createFailed: 'Failed to create document',
    },
    fr: {
      addDocumentTitle: 'Ajouter un Document',
      title: 'Titre',
      category: 'Catégorie',
      attachFile: 'Joindre un fichier (optionnel)',
      orAddLink: 'Ou ajouter un lien externe',
      linkHint: "Si un lien est fourni, le téléchargement de fichier est optionnel ; l'ouverture du document redirigera vers le lien.",
      cancel: 'Annuler',
      save: 'Enregistrer',
      saving: 'Enregistrement...',
      needLinkOrFile: 'Veuillez fournir un lien ou joindre un fichier',
      invalidUrl: 'Veuillez entrer une URL valide',
      fileTooLarge: 'Fichier trop volumineux (max 50 Mo)',
      fileTypeNotAllowed: 'Type de fichier non autorisé',
      fileUploaded: 'Fichier téléchargé',
      linkAdded: 'Lien ajouté',
      createFailed: 'Échec de la création du document',
    }
  }[language];
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<'crm' | 'field'>('crm');
  const [link, setLink] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setTitle('');
    setCategory('crm');
    setLink('');
    setFile(null);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!moduleType) return;
    setError(null);
      // Basic validation
      if (!link && !file) {
        setError(t.needLinkOrFile);
        return;
      }
      if (link) {
        try {
          // validate URL
          // eslint-disable-next-line no-new
          new URL(link);
        } catch {
          setError(t.invalidUrl);
          return;
        }
      }
      if (file) {
        const maxBytes = 50 * 1024 * 1024; // 50 MB
        if (file.size > maxBytes) {
          setError(t.fileTooLarge);
          return;
        }
        const allowed = ['pdf','jpg','jpeg','png','gif','doc','docx','xls','xlsx','txt','csv','ppt','pptx'];
        const ext = (file.name.split('.').pop() || '').toLowerCase();
        if (!allowed.includes(ext)) {
          setError(t.fileTypeNotAllowed);
          return;
        }
      }

    setSubmitting(true);
    try {
      if (file) {
        // Use existing upload API for files
        const docs = await DocumentsService.uploadDocuments({
          files: [file],
          moduleType,
          moduleId,
          moduleName,
          category,
        }, (info) => {
          // progress handled in parent via upload callbacks when available
        });
        toast.success(t.fileUploaded);
        if (onCreated) onCreated(docs);
      } else if (link) {
        const payload = {
          moduleType,
          moduleId,
          moduleName,
          title,
          category,
          externalUrl: link,
          isPublic: false,
        };
        const doc = await DocumentsService.createDocument(payload);
        toast.success(t.linkAdded);
        if (onCreated) onCreated([doc]);
      }

      reset();
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      toast.error(t.createFailed);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg w-[95vw]">
        <DialogHeader>
          <DialogTitle>{t.addDocumentTitle}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 p-2">
          <div>
            <Label>{t.title}</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t.title} />
          </div>

          <div>
            <Label>{t.category}</Label>
            <select value={category} onChange={(e) => setCategory(e.target.value as any)} className="w-full rounded-md border px-2 py-1">
              <option value="crm">CRM</option>
              <option value="field">Field</option>
            </select>
          </div>

          {showFileUpload && (
            <div>
              <Label>{t.attachFile}</Label>
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }}
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDragging(false);
                  const f = e.dataTransfer.files?.[0];
                  if (f) setFile(f);
                }}
                className={`w-full rounded-md border px-3 py-3 flex items-center justify-between gap-3 cursor-pointer ${isDragging ? 'border-primary bg-primary/5' : 'border-input'}`}
              >
                <div className="flex items-center gap-3">
                  <Upload className="h-5 w-5 text-muted-foreground" />
                  <div className="text-sm">
                    {file ? file.name : t.attachFile}
                    <div className="text-xs text-muted-foreground">{t.linkHint}</div>
                  </div>
                </div>
                {file && (
                  <button type="button" onClick={(e) => { e.stopPropagation(); setFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }} className="text-destructive">✕</button>
                )}
                <input ref={fileInputRef} type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
              </div>
            </div>
          )}

          <div>
            <Label>{t.orAddLink}</Label>
            <Input placeholder="https://..." value={link} onChange={(e) => setLink(e.target.value)} />
            <p className="text-xs text-muted-foreground mt-1">{t.linkHint}</p>
            {error && <p className="text-sm text-destructive mt-1">{error}</p>}
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => { reset(); onOpenChange(false); }}>{t.cancel}</Button>
            <Button type="submit" disabled={submitting}>{submitting ? t.saving : t.save}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default DocumentEditorModal;

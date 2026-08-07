import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Eye, Download, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { EntityFormDocument, FORM_DOCUMENT_STATUS_COLORS } from '../../types/formDocument';
import { cn } from '@/lib/utils';

const translations = {
  en: {
    status: { draft: 'Created', completed: 'Completed' },
    edit: 'Edit',
    view_pdf: 'View PDF',
    download: 'Download',
    delete: 'Delete',
  },
  fr: {
    status: { draft: 'Brouillon', completed: 'Complété' },
    edit: 'Modifier',
    view_pdf: 'Voir PDF',
    download: 'Télécharger',
    delete: 'Supprimer',
  },
};

interface FormDocumentCardProps {
  document: EntityFormDocument;
  language: 'en' | 'fr';
  onEdit: (document: EntityFormDocument) => void;
  onViewPDF: (document: EntityFormDocument) => void;
  onDownload: (document: EntityFormDocument) => void;
  onDelete: (document: EntityFormDocument) => void;
}

export function FormDocumentCard({
  document,
  language,
  onEdit,
  onViewPDF,
  onDownload,
  onDelete,
}: FormDocumentCardProps) {
  const t = translations[language];
  const formName = language === 'en' ? document.form_name_en : document.form_name_fr;
  const displayTitle = document.title || formName;
  const isCompleted = document.status === 'completed';

  return (
    <Card className="hover:shadow-md transition-all duration-200 group">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0">
            <div className={cn(
              "h-10 w-10 rounded-lg flex items-center justify-center",
              isCompleted ? "bg-primary/10" : "bg-warning/10"
            )}>
              <FileText className={cn(
                "h-5 w-5",
                isCompleted ? "text-primary" : "text-warning"
              )} />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-medium text-foreground truncate">
                {displayTitle}
              </h4>
              <Badge className={cn(
                "text-xs border",
                FORM_DOCUMENT_STATUS_COLORS[document.status]
              )}>
                {t.status[document.status]}
              </Badge>
            </div>

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>{formName}</span>
              <span>•</span>
              <span>v{document.form_version}</span>
              <span>•</span>
              <span>{format(new Date(document.created_at), 'MMM d, yyyy HH:mm')}</span>
            </div>
          </div>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {!isCompleted && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => onEdit(document)}
                title={t.edit}
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => onViewPDF(document)}
              title={t.view_pdf}
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => onDownload(document)}
              title={t.download}
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
              onClick={() => onDelete(document)}
              title={t.delete}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

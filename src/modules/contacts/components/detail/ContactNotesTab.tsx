import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { 
  StickyNote, 
  Plus, 
  Trash2, 
  Clock, 
  Loader2 
} from "lucide-react";
import { format } from "date-fns";

interface Note {
  id: number;
  note: string;
  createdDate?: string;
  createdBy?: string;
  createdByName?: string;
}

interface ContactNotesTabProps {
  notes: Note[];
  isLoading: boolean;
  isCreating: boolean;
  isDeleting: boolean;
  deletingNoteId: number | null;
  onAddNote: () => void;
  onDeleteNote: (noteId: number) => void;
}

export function ContactNotesTab({
  notes,
  isLoading,
  isCreating,
  isDeleting,
  deletingNoteId,
  onAddNote,
  onDeleteNote,
}: ContactNotesTabProps) {
  const { t } = useTranslation('contacts');

  if (isLoading) {
    return (
      <div className="space-y-3 py-4 animate-pulse">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="p-4 rounded-lg bg-muted/60 space-y-2">
            <div className="h-4 w-1/3 bg-muted rounded" />
            <div className="h-3 w-full bg-muted/40 rounded" />
            <div className="h-3 w-2/3 bg-muted/40 rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <StickyNote className="h-5 w-5 text-primary" />
          {t('detail.notes.title')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {notes.length > 0 ? (
          <div className="space-y-3">
            {notes.map((note) => (
              <div 
                key={note.id} 
                className="group p-4 rounded-lg bg-muted/50 border relative hover:bg-muted/70 transition-colors"
              >
                <p className="text-sm pr-8 whitespace-pre-wrap">{note.note}</p>
                <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>
                    {note.createdDate 
                      ? format(new Date(note.createdDate), 'PPP HH:mm') 
                      : '-'}
                  </span>
                  {note.createdByName && (
                    <>
                      <span>•</span>
                      <span>{note.createdByName}</span>
                    </>
                  )}
                </div>
                <button
                  onClick={() => onDeleteNote(note.id)}
                  disabled={isDeleting && deletingNoteId === note.id}
                  className="absolute top-3 right-3 p-1.5 rounded-md opacity-0 group-hover:opacity-100 hover:bg-destructive/10 text-destructive transition-all disabled:opacity-50"
                >
                  {isDeleting && deletingNoteId === note.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <StickyNote className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium">{t('detail.notes.no_notes')}</h3>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

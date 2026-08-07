import { useState } from "react";
import { ListSkeleton } from "@/components/ui/page-skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useTranslation } from "react-i18next";
import { StickyNote, Trash2, Clock, Loader2, Plus, X } from "lucide-react";
import { format } from "date-fns";

interface Note {
  id: number;
  note: string;
  createdDate?: string;
  createdBy?: string;
  createdByName?: string;
}

interface ArticleNotesTabProps {
  notes: Note[];
  isLoading: boolean;
  isCreating: boolean;
  isDeleting: boolean;
  deletingNoteId: number | null;
  onAddNote: (note: string) => Promise<unknown>;
  onDeleteNote: (noteId: number) => void;
}

export function ArticleNotesTab({
  notes,
  isLoading,
  isCreating,
  isDeleting,
  deletingNoteId,
  onAddNote,
  onDeleteNote,
}: ArticleNotesTabProps) {
  const { t } = useTranslation('inventory-services');
  const [isAdding, setIsAdding] = useState(false);
  const [newNote, setNewNote] = useState("");

  const handleSubmit = async () => {
    if (!newNote.trim()) return;
    try {
      await onAddNote(newNote.trim());
      setNewNote("");
      setIsAdding(false);
    } catch (error) {
      // Error is handled by the hook
    }
  };

  if (isLoading) {
    return <ListSkeleton rows={4} />;
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <StickyNote className="h-4 w-4 text-primary" />
            {t('detail.tabs.notes')}
          </CardTitle>
          {!isAdding && (
            <Button size="sm" onClick={() => setIsAdding(true)}>
              <Plus className="h-4 w-4 mr-2" />
              {t('detail.notes.add')}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add Note Form */}
        {isAdding && (
          <div className="p-4 rounded-lg border bg-muted/30 space-y-3">
            <Textarea
              placeholder={t('detail.notes.placeholder')}
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              rows={3}
              disabled={isCreating}
              autoFocus
            />
            <div className="flex items-center gap-2 justify-end">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => { setIsAdding(false); setNewNote(""); }}
                disabled={isCreating}
              >
                <X className="h-4 w-4 mr-1" />
                {t('cancel')}
              </Button>
              <Button 
                size="sm" 
                onClick={handleSubmit}
                disabled={!newNote.trim() || isCreating}
              >
                {isCreating ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                {t('save')}
              </Button>
            </div>
          </div>
        )}

        {/* Notes List */}
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
        ) : !isAdding ? (
          <div className="text-center py-12">
            <StickyNote className="h-8 w-8 mx-auto text-muted-foreground/50 mb-3" />
            <h3 className="text-sm font-medium mb-2">{t('detail.notes.no_notes')}</h3>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

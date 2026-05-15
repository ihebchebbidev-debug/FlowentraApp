import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { 
  Send,
  Trash2,
  MessageSquare,
  Loader2
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { projectsApi, ProjectNoteDto } from "@/services/api/projectsApi";
import { Project } from "../../types";

interface ProjectNotesTabProps {
  project: Project | null;
}

export function ProjectNotesTab({ project }: ProjectNotesTabProps) {
  const { t } = useTranslation("tasks");
  const [notes, setNotes] = useState<ProjectNoteDto[]>([]);
  const [noteContent, setNoteContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingNotes, setIsLoadingNotes] = useState(false);
  const [selectedNoteToDelete, setSelectedNoteToDelete] = useState<number | null>(null);

  if (!project) return null;

  // Get current user from localStorage
  const getCurrentUser = () => {
    try {
      const userData = localStorage.getItem("user_data");
      if (userData) {
        const user = JSON.parse(userData);
        return {
          id: String(user.id),
          name: `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email,
        };
      }
    } catch (e) {
      console.warn("Failed to get current user");
    }
    return { id: "unknown", name: "You" };
  };

  // Load notes from API
  const loadNotes = async () => {
    setIsLoadingNotes(true);
    try {
      const projectId = typeof project.id === 'string' ? parseInt(project.id) : project.id;
      const response = await projectsApi.getProjectNotes(projectId);
      setNotes(response);
    } catch (error) {
      console.error("Failed to load notes:", error);
      toast.error(t("projects.detail.notes.loadError", "Failed to load notes"));
    } finally {
      setIsLoadingNotes(false);
    }
  };

  useEffect(() => {
    loadNotes();
  }, [project.id]);

  const handlePostNote = async () => {
    if (!noteContent.trim()) {
      toast.error(t("projects.detail.notes.emptyError", "Note cannot be empty"));
      return;
    }

    try {
      setIsLoading(true);
      const projectId = typeof project.id === 'string' ? parseInt(project.id) : project.id;
      await projectsApi.createProjectNote(projectId, noteContent);

      // Reload notes to refresh the list
      await loadNotes();
      setNoteContent("");
      toast.success(t("projects.detail.notes.postSuccess", "Note posted successfully"));
    } catch (error) {
      console.error("Failed to post note:", error);
      toast.error(t("projects.detail.notes.postError", "Failed to post note"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteNote = async () => {
    if (selectedNoteToDelete === null) return;

    try {
      setIsLoading(true);
      await projectsApi.deleteProjectNote(selectedNoteToDelete);

      setNotes(notes.filter((note) => note.id !== selectedNoteToDelete));
      setSelectedNoteToDelete(null);
      toast.success(t("projects.detail.notes.deleteSuccess", "Note deleted successfully"));
    } catch (error) {
      console.error("Failed to delete note:", error);
      toast.error(t("projects.detail.notes.deleteError", "Failed to delete note"));
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const currentUser = getCurrentUser();

  return (
    <div className="space-y-6">
      {/* Add Note Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            {t("projects.detail.notes.addNote")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <textarea
              placeholder={t("projects.detail.notes.placeholder")}
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              className="w-full h-24 p-3 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setNoteContent("")}
                disabled={!noteContent.trim() || isLoading}
              >
                {t("common:cancel", "Cancel")}
              </Button>
              <Button
                onClick={handlePostNote}
                disabled={!noteContent.trim() || isLoading}
                className="gap-2"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {t("projects.detail.notes.post")}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes List */}
      <Card>
        <CardHeader>
          <CardTitle>{t("projects.detail.notes.title")} ({notes.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingNotes ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : notes.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm font-medium text-foreground mb-1">
                {t("projects.detail.notes.noNotes")}
              </p>
              <p className="text-sm text-muted-foreground">
                {t("projects.detail.notes.noNotesHint")}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {notes.map((note) => (
                <div
                  key={note.id}
                  className="p-4 border border-border/50 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <Avatar className="h-8 w-8 mt-0.5">
                        <AvatarFallback className="text-xs font-semibold">
                          {getInitials(note.createdBy)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{note.createdBy}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(note.createdDate), "PPP p")}
                        </p>
                      </div>
                    </div>
                    {note.createdBy === currentUser.name && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedNoteToDelete(note.id)}
                        className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <p className="text-sm text-foreground/80 whitespace-pre-wrap">{note.content}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={selectedNoteToDelete !== null} onOpenChange={() => setSelectedNoteToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("projects.detail.notes.deleteConfirm")}</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common:cancel", "Cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteNote}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("common:delete", "Delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}


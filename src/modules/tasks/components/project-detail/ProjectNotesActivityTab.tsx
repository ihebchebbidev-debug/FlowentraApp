import { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import {
  Send,
  Trash2,
  MessageSquare,
  Loader2,
  Activity,
  CheckCircle,
  FileText,
  Users,
  Settings as SettingsIcon,
  FileUp,
  Plus,
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
import { projectsApi, ProjectNoteDto, ProjectActivityDto } from "@/services/api/projectsApi";
import { Project } from "../../types";

interface ProjectNotesActivityTabProps {
  project: Project | null;
}

type TimelineEntry =
  | { type: "note"; id: number; createdDate: string; createdBy: string; content: string; note: ProjectNoteDto }
  | {
      type: "activity";
      id: number;
      createdDate: string;
      createdBy: string;
      actionType: string;
      description: string;
      details?: string;
      activity: ProjectActivityDto;
    };

export function ProjectNotesActivityTab({ project }: ProjectNotesActivityTabProps) {
  const { t } = useTranslation("tasks");
  const [notes, setNotes] = useState<ProjectNoteDto[]>([]);
  const [logs, setLogs] = useState<ProjectActivityDto[]>([]);
  const [noteContent, setNoteContent] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedNoteToDelete, setSelectedNoteToDelete] = useState<number | null>(null);

  const getProjectId = useCallback(() => {
    if (!project) return null;
    return typeof project.id === "string" ? parseInt(project.id, 10) : project.id;
  }, [project]);

  const loadAll = useCallback(async () => {
    const projectId = getProjectId();
    if (!projectId) return;
    setIsLoading(true);
    try {
      const [notesRes, logsRes] = await Promise.all([
        projectsApi.getProjectNotes(projectId),
        projectsApi.getProjectActivity(projectId),
      ]);
      setNotes(notesRes);
      setLogs(logsRes);
    } catch (error) {
      console.error("Failed to load notes and activity:", error);
      toast.error(t("projects.detail.notes.loadError", "Failed to load notes and activity"));
    } finally {
      setIsLoading(false);
    }
  }, [getProjectId, t]);

  useEffect(() => {
    if (!project) return;
    loadAll();
  }, [project, loadAll]);

  const mergedEntries = useMemo<TimelineEntry[]>(() => {
    const noteEntries: TimelineEntry[] = notes.map((note) => ({
      type: "note",
      id: note.id,
      createdDate: note.createdDate,
      createdBy: note.createdBy,
      content: note.content,
      note,
    }));
    const activityEntries: TimelineEntry[] = logs.map((log) => ({
      type: "activity",
      id: log.id,
      createdDate: log.createdDate,
      createdBy: log.createdBy,
      actionType: log.actionType,
      description: log.description,
      details: log.details,
      activity: log,
    }));
    const combined = [...noteEntries, ...activityEntries];
    combined.sort((a, b) => {
      const dateA = new Date(a.createdDate).getTime() || 0;
      const dateB = new Date(b.createdDate).getTime() || 0;
      return dateB - dateA;
    });
    return combined;
  }, [notes, logs]);

  if (!project) return null;

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
    } catch {
      console.warn("Failed to get current user");
    }
    return { id: "unknown", name: "You" };
  };

  const currentUser = getCurrentUser();

  const handlePostNote = async () => {
    if (!noteContent.trim()) {
      toast.error(t("projects.detail.notes.emptyError", "Note cannot be empty"));
      return;
    }
    const projectId = getProjectId();
    if (!projectId) return;

    try {
      setIsPosting(true);
      await projectsApi.createProjectNote(projectId, noteContent);
      await loadAll();
      setNoteContent("");
      toast.success(t("projects.detail.notes.postSuccess", "Note posted successfully"));
    } catch (error) {
      console.error("Failed to post note:", error);
      toast.error(t("projects.detail.notes.postError", "Failed to post note"));
    } finally {
      setIsPosting(false);
    }
  };

  const handleDeleteNote = async () => {
    if (selectedNoteToDelete === null) return;
    try {
      await projectsApi.deleteProjectNote(selectedNoteToDelete);
      setNotes((prev) => prev.filter((n) => n.id !== selectedNoteToDelete));
      setSelectedNoteToDelete(null);
      toast.success(t("projects.detail.notes.deleteSuccess", "Note deleted successfully"));
    } catch (error) {
      console.error("Failed to delete note:", error);
      toast.error(t("projects.detail.notes.deleteError", "Failed to delete note"));
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

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case "created":
        return <Plus className="h-5 w-5 text-blue-500" />;
      case "updated":
        return <SettingsIcon className="h-5 w-5 text-blue-500" />;
      case "task_added":
        return <FileText className="h-5 w-5 text-primary" />;
      case "task_completed":
        return <CheckCircle className="h-5 w-5 text-success" />;
      case "member_added":
        return <Users className="h-5 w-5 text-purple-500" />;
      case "member_removed":
        return <Users className="h-5 w-5 text-warning" />;
      case "status_changed":
        return <SettingsIcon className="h-5 w-5 text-blue-500" />;
      case "document_uploaded":
        return <FileUp className="h-5 w-5 text-green-500" />;
      case "note_added":
        return <MessageSquare className="h-5 w-5 text-secondary" />;
      default:
        return <Activity className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getActionLabel = (actionType: string) => {
    switch (actionType) {
      case "created":
        return t("projects.detail.activity.actions.created");
      case "updated":
        return t("projects.detail.activity.actions.updated");
      case "task_added":
        return t("projects.detail.activity.actions.taskAdded");
      case "task_completed":
        return t("projects.detail.activity.actions.taskCompleted");
      case "member_added":
        return t("projects.detail.activity.actions.memberAdded");
      case "member_removed":
        return t("projects.detail.activity.actions.memberRemoved");
      case "status_changed":
        return t("projects.detail.activity.actions.statusChanged");
      case "document_uploaded":
        return t("projects.detail.activity.actions.documentUploaded");
      case "note_added":
        return t("projects.detail.activity.actions.noteAdded");
      default:
        return actionType;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            {t("projects.detail.notesActivity.title", "Project Notes & Activity")}
            <span className="text-sm font-normal text-muted-foreground ml-2">
              ({mergedEntries.length})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Add note input */}
          <div className="space-y-3">
            <textarea
              placeholder={t("projects.detail.notes.placeholder", "Write a note about this project...")}
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              className="w-full h-24 p-3 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setNoteContent("")}
                disabled={!noteContent.trim() || isPosting}
              >
                {t("common:cancel", "Cancel")}
              </Button>
              <Button
                onClick={handlePostNote}
                disabled={!noteContent.trim() || isPosting}
                className="gap-2"
              >
                {isPosting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {t("projects.detail.notes.post", "Post Note")}
              </Button>
            </div>
          </div>

          {/* Timeline */}
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : mergedEntries.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm font-medium text-foreground mb-1">
                {t("projects.detail.notesActivity.noEntries", "No notes or activity yet")}
              </p>
              <p className="text-sm text-muted-foreground">
                {t("projects.detail.notesActivity.noEntriesHint", "Add a note or work on the project to see activity here")}
              </p>
            </div>
          ) : (
            <div className="relative space-y-4">
              {mergedEntries.map((entry, index) => (
                <div key={`${entry.type}-${entry.id}`} className="flex gap-4 pb-4">
                  {/* Timeline line */}
                  {index < mergedEntries.length - 1 && (
                    <div className="absolute left-[17px] top-12 w-0.5 h-12 bg-border/50" />
                  )}

                  {/* Icon / Avatar */}
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-muted flex items-center justify-center relative z-10">
                    {entry.type === "note" ? (
                      <MessageSquare className="h-5 w-5 text-secondary" />
                    ) : (
                      getActionIcon(entry.actionType)
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 pt-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {entry.type === "note" ? (
                        <>
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-[10px] font-semibold">
                              {getInitials(entry.createdBy)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium text-foreground">{entry.createdBy}</span>
                          <span className="text-sm text-muted-foreground">
                            {t("projects.detail.notesActivity.postedNote", "posted a note")}
                          </span>
                          {entry.createdBy === currentUser.name && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedNoteToDelete(entry.id)}
                              className="h-7 w-7 p-0 hover:bg-destructive/10 hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </>
                      ) : (
                        <>
                          <span className="text-sm font-medium text-foreground">{entry.createdBy}</span>
                          <span className="text-sm text-muted-foreground">{getActionLabel(entry.actionType)}</span>
                        </>
                      )}
                    </div>

                    {entry.type === "note" ? (
                      <p className="text-sm text-foreground/80 whitespace-pre-wrap mt-1">{entry.content}</p>
                    ) : (
                      <>
                        {entry.description && (
                          <p className="text-sm text-muted-foreground mt-1">{entry.description}</p>
                        )}
                        {entry.details && (
                          <p className="text-xs text-muted-foreground mt-1">{entry.details}</p>
                        )}
                      </>
                    )}

                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(entry.createdDate), "PPP p")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete confirmation */}
      <AlertDialog open={selectedNoteToDelete !== null} onOpenChange={() => setSelectedNoteToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("projects.detail.notes.deleteConfirm", "Delete this note?")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("projects.detail.notes.deleteDescription", "This action cannot be undone.")}
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

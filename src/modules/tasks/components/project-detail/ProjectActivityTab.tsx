import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { 
  Activity,
  CheckCircle,
  FileText,
  Users,
  Settings as SettingsIcon,
  MessageSquare,
  FileUp,
  Plus,
  Loader2
} from "lucide-react";
import { projectsApi, ProjectActivityDto } from "@/services/api/projectsApi";
import { Project } from "../../types";

interface ProjectActivityTabProps {
  project: Project | null;
}

export function ProjectActivityTab({ project }: ProjectActivityTabProps) {
  const { t } = useTranslation("tasks");
  const [logs, setLogs] = useState<ProjectActivityDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  if (!project) return null;

  // Load activity logs from API
  useEffect(() => {
    const loadLogs = async () => {
      setIsLoading(true);
      try {
        const projectId = typeof project.id === 'string' ? parseInt(project.id) : project.id;
        const response = await projectsApi.getProjectActivity(projectId);
        setLogs(response);
      } catch (error) {
        console.error("Failed to load activity logs:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadLogs();
  }, [project.id]);

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
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            {t("projects.detail.activity.title")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12">
              <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm font-medium text-foreground mb-1">
                {t("projects.detail.activity.noActivity")}
              </p>
              <p className="text-sm text-muted-foreground">
                {t("projects.detail.activity.noActivityHint")}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Timeline */}
              <div className="relative">
                {logs.map((log, index) => (
                  <div key={log.id} className="flex gap-4 pb-4">
                    {/* Timeline Line */}
                    {index < logs.length - 1 && (
                      <div className="absolute left-[17px] top-12 w-0.5 h-12 bg-border/50" />
                    )}

                    {/* Icon */}
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-muted flex items-center justify-center relative z-10">
                      {getActionIcon(log.actionType)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 pt-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-foreground">{log.createdBy}</span>
                        <span className="text-sm text-muted-foreground">{getActionLabel(log.actionType)}</span>
                      </div>
                      {log.description && (
                        <p className="text-sm text-muted-foreground mt-1">{log.description}</p>
                      )}
                      {log.details && (
                        <p className="text-xs text-muted-foreground mt-1">{log.details}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(log.createdDate), "PPP p")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

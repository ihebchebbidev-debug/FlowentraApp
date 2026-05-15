import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  TrendingUp,
  User,
  Calendar,
  FileText 
} from "lucide-react";
import { Project } from "../../types";
import { cn } from "@/lib/utils";

interface Technician {
  id: string;
  name: string;
  email?: string;
}

interface ProjectOverviewTabProps {
  project: Project | null;
  projectStats: {
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    overdueTasks: number;
    totalEstimatedHours: number;
    totalActualHours: number;
    completionPercentage: number;
  };
  technicians: Technician[];
  projectLinks?: {
    offers?: Array<{ entityId: number; number: string; title: string; status?: string }>;
    sales?: Array<{ entityId: number; number: string; title: string; status?: string }>;
    serviceOrders?: Array<{ entityId: number; number: string; title: string; status?: string }>;
    dispatches?: Array<{ entityId: number; number: string; title: string; status?: string }>;
  } | null;
}

export function ProjectOverviewTab({
  project,
  projectStats,
  technicians,
  projectLinks,
}: ProjectOverviewTabProps) {
  const { t } = useTranslation("tasks");
  const navigate = useNavigate();

  if (!project) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-success text-success-foreground";
      case "completed":
        return "bg-primary text-primary-foreground";
      case "on-hold":
        return "bg-warning text-warning-foreground";
      case "cancelled":
        return "bg-destructive text-destructive-foreground";
      default:
        return "bg-secondary text-secondary-foreground";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "service":
        return "bg-primary/10 text-primary";
      case "sales":
        return "bg-success/10 text-success";
      case "internal":
        return "bg-secondary text-secondary-foreground";
      case "custom":
        return "bg-warning/10 text-warning";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case "urgent":
        return "bg-destructive/10 text-destructive";
      case "high":
        return "bg-warning/10 text-warning";
      case "medium":
        return "bg-blue-500/10 text-blue-500";
      case "low":
        return "bg-success/10 text-success";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const ownerName = technicians.find((t) => t.id === project.ownerId)?.name || project.ownerName || "Unknown";
  const completionPercentage = projectStats.completionPercentage || 0;

  return (
    <div className="grid gap-6">
      {/* Project Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {t("projects.detail.overview.projectInfo")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Status and Type */}
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">
                {t("projects.detail.overview.status")}
              </p>
              <Badge className={getStatusColor(project.status)}>{project.status}</Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">
                {t("projects.detail.overview.type")}
              </p>
              <Badge className={getTypeColor(project.type)} variant="outline">
                {project.type}
              </Badge>
            </div>

            {/* Priority */}
            {project.priority && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  {t("projects.detail.overview.priority")}
                </p>
                <Badge className={getPriorityColor(project.priority)} variant="outline">
                  {project.priority}
                </Badge>
              </div>
            )}

            {/* Owner */}
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">
                {t("projects.detail.overview.owner")}
              </p>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{ownerName}</span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-2">
              {t("projects.detail.overview.description")}
            </p>
            <p className="text-sm text-foreground">
              {project.description || t("projects.detail.overview.noDescription")}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Project Dates Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {t("projects.detail.overview.projectDates")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase mb-1">
                {t("projects.detail.overview.startDate")}
              </p>
              <p className="text-sm font-medium">
                {project.startDate
                  ? format(new Date(project.startDate), "PPP")
                  : t("projects.detail.overview.notSet")}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase mb-1">
                {t("projects.detail.overview.endDate")}
              </p>
              <p className="text-sm font-medium">
                {project.endDate
                  ? format(new Date(project.endDate), "PPP")
                  : t("projects.detail.overview.notSet")}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase mb-1">
                {t("projects.detail.overview.createdDate")}
              </p>
              <p className="text-sm font-medium">
                {project.createdAt ? format(new Date(project.createdAt), "PPP") : "-"}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase mb-1">
                {t("projects.detail.overview.lastUpdated")}
              </p>
              <p className="text-sm font-medium">
                {project.updatedAt ? format(new Date(project.updatedAt), "PPP") : "-"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Related Contact Card */}
      {project.contactId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {t("projects.detail.overview.relatedContact")}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{project.contactName || "Unknown Contact"}</p>
              <p className="text-xs text-muted-foreground">{project.contactId}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/dashboard/contacts/${project.contactId}`)}
            >
              {t("projects.detail.overview.viewContact")}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Tasks */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("projects.detail.overview.totalTasks")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projectStats.totalTasks}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {t("projects.detail.overview.quickStats")}
            </p>
          </CardContent>
        </Card>

        {/* Completed Tasks */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <CheckCircle className="h-4 w-4 text-success" />
              {t("projects.detail.overview.completed")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{projectStats.completedTasks}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {projectStats.totalTasks > 0
                ? Math.round((projectStats.completedTasks / projectStats.totalTasks) * 100)
                : 0}
              %
            </p>
          </CardContent>
        </Card>

        {/* In Progress */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              {t("projects.detail.overview.inProgress")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">{projectStats.inProgressTasks}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {projectStats.totalTasks > 0
                ? Math.round((projectStats.inProgressTasks / projectStats.totalTasks) * 100)
                : 0}
              %
            </p>
          </CardContent>
        </Card>

        {/* Overdue */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <AlertCircle className="h-4 w-4 text-destructive" />
              {t("projects.detail.overview.overdue")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{projectStats.overdueTasks}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {projectStats.totalTasks > 0
                ? Math.round((projectStats.overdueTasks / projectStats.totalTasks) * 100)
                : 0}
              %
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Linked records</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>Offers: {projectLinks?.offers?.length ?? 0}</div>
          <div>Sales: {projectLinks?.sales?.length ?? 0}</div>
          <div>Service Orders: {projectLinks?.serviceOrders?.length ?? 0}</div>
          <div>Dispatches: {projectLinks?.dispatches?.length ?? 0}</div>
        </CardContent>
      </Card>

      {/* Progress Bar */}
      {projectStats.totalTasks > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              {t("projects.detail.overview.completion")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {t("projects.detail.overview.progress")}
              </span>
              <span className="text-sm font-bold text-primary">{completionPercentage}%</span>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-300"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hours Tracked */}
      {(projectStats.totalEstimatedHours > 0 || projectStats.totalActualHours > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              {t("projects.detail.overview.hoursTracked")}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase mb-2">
                {t("projects.detail.overview.estimatedHours")}
              </p>
              <p className="text-2xl font-bold">{projectStats.totalEstimatedHours.toFixed(1)} h</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase mb-2">
                {t("projects.detail.overview.actualHours")}
              </p>
              <p className="text-2xl font-bold">{projectStats.totalActualHours.toFixed(1)} h</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

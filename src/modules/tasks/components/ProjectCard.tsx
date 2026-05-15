import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  FolderOpen, 
  Users, 
  MoreVertical, 
  Play, 
  Pause, 
  CheckCircle,
  Clock,
  AlertTriangle
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Project, ProjectStats } from "../types";

interface ProjectCardProps {
  project: Project;
  stats: ProjectStats;
  onOpenProject: (project: Project) => void;
  onEditProject: (project: Project) => void;
  onDeleteProject: (projectId: string) => void;
  onToggleStatus: (projectId: string, status: Project['status']) => void;
}

const getStatusColor = (status: Project['status']) => {
  switch (status) {
    case 'active': return 'status-success';
    case 'completed': return 'status-info';
    case 'on-hold': return 'status-warning';
    case 'cancelled': return 'status-error';
    default: return 'status-info';
  }
};

const getStatusIcon = (status: Project['status']) => {
  switch (status) {
    case 'active': return Play;
    case 'completed': return CheckCircle;
    case 'on-hold': return Pause;
    case 'cancelled': return AlertTriangle;
    default: return Clock;
  }
};

const getTypeColor = (type: Project['type']) => {
  switch (type) {
    case 'service': return 'bg-primary/10 text-primary';
    case 'sales': return 'bg-success/10 text-success';
    case 'internal': return 'bg-accent/10 text-accent';
    case 'custom': return 'bg-chart-4/10 text-chart-4';
    default: return 'bg-muted/10 text-muted-foreground';
  }
};

export function ProjectCard({
  project,
  stats,
  onOpenProject,
  onEditProject,
  onDeleteProject,
  onToggleStatus
}: ProjectCardProps) {
  const { t } = useTranslation('tasks');
  const StatusIcon = getStatusIcon(project.status);
  const isOverdue = project.endDate && new Date() > new Date(project.endDate) && project.status !== 'completed';

  return (
    <Card className="shadow-card border-0 hover-lift transition-all duration-200 group cursor-pointer">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <FolderOpen className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground break-words line-clamp-2">{project.name}</h3>
              <p className="text-sm text-muted-foreground break-words line-clamp-2">{project.description}</p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onOpenProject(project)}>
                <FolderOpen className="h-4 w-4 mr-2" />
                {t('projects.list.card.openProject')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEditProject(project)}>
                {t('projects.list.editProject')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {project.status === 'active' && (
                <DropdownMenuItem onClick={() => onToggleStatus(project.id, 'on-hold')}>
                  <Pause className="h-4 w-4 mr-2" />
                  {t('projects.list.pauseProject')}
                </DropdownMenuItem>
              )}
              {project.status === 'on-hold' && (
                <DropdownMenuItem onClick={() => onToggleStatus(project.id, 'active')}>
                  <Play className="h-4 w-4 mr-2" />
                  {t('projects.list.resumeProject')}
                </DropdownMenuItem>
              )}
              {project.status !== 'completed' && (
                <DropdownMenuItem onClick={() => onToggleStatus(project.id, 'completed')}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {t('projects.list.markComplete')}
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-destructive"
                onClick={() => onDeleteProject(project.id)}
              >
                {t('projects.list.deleteProject')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      <CardContent 
        className="space-y-4"
        onClick={() => onOpenProject(project)}
      >
        <div className="flex items-center gap-2 flex-wrap">
          <Badge className={getStatusColor(project.status)}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {t(`projects.list.status.${project.status}`, { defaultValue: project.status })}
          </Badge>
          <Badge variant="outline" className={getTypeColor(project.type)}>
            {t(`projects.list.type.${project.type}`, { defaultValue: project.type })}
          </Badge>
          {isOverdue && (
            <Badge className="status-error">
              <AlertTriangle className="h-3 w-3 mr-1" />
              {t('projects.list.card.overdue')}
            </Badge>
          )}
        </div>

        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-muted-foreground">{t('projects.list.progress')}</span>
              <span className="font-medium">{stats.completionPercentage}%</span>
            </div>
            <Progress value={stats.completionPercentage} className="h-2" />
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t('projects.list.card.tasks')}</span>
                <span className="font-medium">{stats.completedTasks}/{stats.totalTasks}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t('projects.list.card.team')}</span>
                <span className="font-medium">{stats.activeMembers}</span>
              </div>
            </div>
            <div className="space-y-1">
              {stats.overdueTasks > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-destructive">{t('projects.list.card.overdue')}:</span>
                  <span className="font-medium text-destructive">{stats.overdueTasks}</span>
                </div>
              )}
              {project.endDate && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t('projects.list.card.due')}</span>
                  <span className="font-medium">{new Date(project.endDate).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <div className="flex -space-x-2">
              {project.teamMembers.slice(0, 3).map((member, _index) => (
                <div
                  key={member}
                  className="w-6 h-6 rounded-full bg-primary/10 border-2 border-background flex items-center justify-center"
                >
                  <span className="text-xs font-medium text-primary">
                    {member.charAt(0).toUpperCase()}
                  </span>
                </div>
              ))}
              {project.teamMembers.length > 3 && (
                <div className="w-6 h-6 rounded-full bg-muted border-2 border-background flex items-center justify-center">
                  <span className="text-xs font-medium text-muted-foreground">
                    +{project.teamMembers.length - 3}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

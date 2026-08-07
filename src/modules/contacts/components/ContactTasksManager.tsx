import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  CheckSquare,
  PlusCircle,
  Calendar,
  Clock,
  FolderOpen,
  User,
  AlertCircle,
  CheckCircle,
  Loader2
} from "lucide-react";
import { TasksService } from "@/modules/tasks/services/tasks.service";
import type { Task } from "@/modules/tasks/types";

interface ContactTasksManagerProps {
  contactId: string;
  contactName: string;
}

export function ContactTasksManager({ contactId, contactName }: ContactTasksManagerProps) {
  const [activeTasksTab, setActiveTasksTab] = useState("all");
  const [contactTasks, setContactTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const numId = parseInt(contactId, 10);
    if (isNaN(numId)) { setContactTasks([]); setLoading(false); return; }
    setLoading(true);
    TasksService.getTasksByContact(numId)
      .then(list => { if (active) setContactTasks(list); })
      .catch(() => { if (active) setContactTasks([]); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [contactId]);

  // Project-related vs standalone tasks
  const projectTasks = contactTasks.filter(task => task.projectId);
  const standaloneTasks = contactTasks.filter(task => !task.projectId);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-destructive text-destructive-foreground';
      case 'medium': return 'bg-warning text-warning-foreground';
      case 'low': return 'bg-secondary text-secondary-foreground';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'done':
      case 'completed': return 'bg-success text-success-foreground';
      case 'in progress':
      case 'development': return 'bg-primary text-primary-foreground';
      case 'planning': return 'bg-warning text-warning-foreground';
      case 'backlog': return 'bg-secondary text-secondary-foreground';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'done':
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'in progress':
      case 'development': return <Clock className="h-4 w-4" />;
      case 'planning': return <AlertCircle className="h-4 w-4" />;
      default: return <FolderOpen className="h-4 w-4" />;
    }
  };

  const initials = (name?: string) =>
    (name || '').split(' ').map(n => n[0]).filter(Boolean).join('').slice(0, 2) || '?';

  const renderTaskCard = (task: Task, showProject = false) => (
    <Card key={task.id} className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-base font-semibold text-foreground truncate">
                {task.title}
              </h3>
              <Badge className={getStatusColor(task.status)} variant="secondary">
                {getStatusIcon(task.status)}
                <span className="ml-1">{task.status}</span>
              </Badge>
              <Badge className={getPriorityColor(task.priority)} variant="outline">
                {task.priority}
              </Badge>
            </div>
            
            {task.description && (
              <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                {task.description}
              </p>
            )}
            
            <div className="flex items-center gap-6 text-sm text-muted-foreground mb-2">
              {task.dueDate && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                </div>
              )}
              
              {task.estimatedHours && (
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{task.estimatedHours}h estimated</span>
                </div>
              )}
            </div>

            {showProject && task.projectId && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                <FolderOpen className="h-3 w-3" />
                <span>Project: {task.projectName || "Unknown Project"}</span>
              </div>
            )}

            <div className="flex flex-wrap gap-1">
              {(task.tags || []).map((tag, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
          
          <div className="flex items-center gap-2 ml-4">
            {(task.assigneeId || task.assigneeName) && (
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="text-xs">
                    {initials(task.assigneeName)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs text-muted-foreground">
                  {task.assigneeName || 'Unassigned'}
                </span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderTasksSection = (tasks: Task[], title: string, icon: React.ReactNode, showProject = false) => {
    if (tasks.length === 0) {
      return (
        <Card className="shadow-card border-0">
          <CardContent className="flex flex-col items-center justify-center py-8">
            {icon}
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No {title} Yet
            </h3>
            <p className="text-muted-foreground text-center mb-4 max-w-md">
              {title === "Tasks" ? "Create tasks to track work for this contact." : 
               title === "Project Tasks" ? "Project tasks will appear here when you create projects." : 
               "Create standalone tasks that aren't tied to specific projects."}
            </p>
            <Button className="gap-2">
              <PlusCircle className="h-4 w-4" />
              <span className="text-white">Add Task</span>
            </Button>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            {icon}
            {title} ({tasks.length})
          </h3>
          <Button size="sm" className="gap-2">
            <PlusCircle className="h-4 w-4" />
            <span className="text-white">Add Task</span>
          </Button>
        </div>
        <div className="space-y-3">
          {tasks.map(task => renderTaskCard(task, showProject))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-8 w-8 text-muted-foreground mb-3 animate-spin" />
        <p className="text-sm text-muted-foreground">Loading tasks…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Tasks</h2>
          <p className="text-muted-foreground">
            Manage tasks for {contactName}
          </p>
        </div>
        <Button className="gap-2">
          <PlusCircle className="h-4 w-4" />
          <span className="text-white">New Task</span>
        </Button>
      </div>

      <Tabs value={activeTasksTab} onValueChange={setActiveTasksTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">All Tasks ({contactTasks.length})</TabsTrigger>
          <TabsTrigger value="project">Project Tasks ({projectTasks.length})</TabsTrigger>
          <TabsTrigger value="standalone">Standalone Tasks ({standaloneTasks.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          {contactTasks.length === 0 ? (
            renderTasksSection([], "Tasks", <CheckSquare className="h-12 w-12 text-muted-foreground mb-4" />)
          ) : (
            renderTasksSection(contactTasks, "All Tasks", <CheckSquare className="h-5 w-5 text-primary" />, true)
          )}
        </TabsContent>

        <TabsContent value="project" className="mt-6">
          {renderTasksSection(
            projectTasks, 
            "Project Tasks", 
            <FolderOpen className={projectTasks.length === 0 ? "h-12 w-12 text-muted-foreground mb-4" : "h-5 w-5 text-primary"} />,
            true
          )}
        </TabsContent>

        <TabsContent value="standalone" className="mt-6">
          {renderTasksSection(
            standaloneTasks, 
            "Standalone Tasks", 
            <User className={standaloneTasks.length === 0 ? "h-12 w-12 text-muted-foreground mb-4" : "h-5 w-5 text-primary"} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
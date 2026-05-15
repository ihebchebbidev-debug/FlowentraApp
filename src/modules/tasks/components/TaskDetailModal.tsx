import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Calendar, Clock, User, Edit, Trash2, FileText, Save, X, Loader2, UserPlus, UserMinus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { TaskComments } from "./TaskComments";
import { TasksService } from "../services/tasks.service";
import { notificationsApi } from "@/services/api/notificationsApi";

interface Technician {
  id: string;
  name: string;
  email?: string;
}

interface Task {
  id: string;
  title: string;
  description: string;
  taskType?: string;
  status: string;
  relatedEntityType?: string;
  relatedEntityId?: string | number;
  assignee: string;
  assigneeId?: string;
  dueDate: string;
  createdAt: Date;
  lastMoved?: Date;
}

interface TaskDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task | null;
  onTaskUpdated?: (task: Task) => void;
  onTaskDeleted?: (taskId: string) => void;
  technicians?: Technician[];
}

export function TaskDetailModal({ open, onOpenChange, task, onTaskUpdated, onTaskDeleted, technicians = [] }: TaskDetailModalProps) {
  const { t } = useTranslation('tasks');
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAssignDropdown, setShowAssignDropdown] = useState(false);

  // Get numeric task ID for checklist
  const numericTaskId = task ? (parseInt(task.id, 10) || parseInt(task.id.replace(/\D/g, ''), 10) || undefined) : undefined;

  // Edit form state
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editTaskType, setEditTaskType] = useState<string>("follow-up");
  const [editStatus, setEditStatus] = useState<string>("open");
  const [editRelatedEntityType, setEditRelatedEntityType] = useState<string>("");
  const [editRelatedEntityId, setEditRelatedEntityId] = useState<string>("");

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setIsEditing(false);
      setShowAssignDropdown(false);
    }
  }, [open]);

  if (!task) return null;

  const handleAssignTask = async (technicianId: string, technicianName: string) => {
    setIsAssigning(true);
    try {
      // Parse task ID - handle both numeric strings and prefixed formats
      const taskIdNum = parseInt(task.id, 10) || parseInt(task.id.replace(/\D/g, ''), 10);
      const techIdNum = parseInt(technicianId, 10) || parseInt(technicianId.replace(/\D/g, ''), 10);
      
      console.log('[TaskDetailModal] Assigning task:', { 
        taskId: task.id, 
        taskIdNum, 
        technicianId, 
        techIdNum, 
        technicianName 
      });
      
      if (!isNaN(taskIdNum) && !isNaN(techIdNum)) {
        await TasksService.assignTask(taskIdNum, techIdNum, technicianName);
        console.log('[TaskDetailModal] Task assigned successfully');
        
        // Note: Backend automatically creates the notification when task is assigned
      } else {
        console.error('[TaskDetailModal] Invalid IDs - taskIdNum:', taskIdNum, 'techIdNum:', techIdNum);
      }

      const updatedTask: Task = {
        ...task,
        assignee: technicianName,
        assigneeId: technicianId,
      };

      toast({
        title: t('toast.success'),
        description: t('toast.taskAssigned', { name: technicianName }),
      });

      setShowAssignDropdown(false);
      onTaskUpdated?.(updatedTask);
    } catch (error) {
      console.error('Failed to assign task:', error);
      toast({
        title: t('toast.error'),
        description: t('toast.failedAssign'),
        variant: "destructive",
      });
    } finally {
      setIsAssigning(false);
    }
  };

  const handleUnassignTask = async () => {
    setIsAssigning(true);
    try {
      // Parse task ID - handle both numeric strings and prefixed formats
      const taskIdNum = parseInt(task.id, 10) || parseInt(task.id.replace(/\D/g, ''), 10);
      
      if (!isNaN(taskIdNum)) {
        await TasksService.unassignTask(taskIdNum);
      }

      const updatedTask: Task = {
        ...task,
        assignee: '',
        assigneeId: undefined,
      };

      toast({
        title: t('toast.success'),
        description: t('toast.taskUnassigned'),
      });

      onTaskUpdated?.(updatedTask);
    } catch (error) {
      console.error('Failed to unassign task:', error);
      toast({
        title: t('toast.error'),
        description: t('toast.failedUnassign'),
        variant: "destructive",
      });
    } finally {
      setIsAssigning(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-destructive text-destructive-foreground';
      case 'medium':
        return 'bg-warning text-warning-foreground';
      case 'low':
        return 'bg-success text-success-foreground';
      default:
        return 'bg-secondary text-secondary-foreground';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return '🔥';
      case 'medium':
        return '⚡';
      case 'low':
        return '📌';
      default:
        return '📝';
    }
  };

  const getStatusColor = (columnId: string) => {
    switch (columnId) {
      case 'todo':
        return 'bg-muted text-muted-foreground';
      case 'progress':
        return 'bg-primary/10 text-primary dark:bg-primary/20';
      case 'review':
        return 'bg-warning/10 text-warning dark:bg-warning/20';
      case 'done':
        return 'bg-success/10 text-success dark:bg-success/20';
      default:
        return 'bg-secondary text-secondary-foreground';
    }
  };

  const getStatusLabel = (columnId: string) => {
    switch (columnId) {
      case 'todo':
        return t('taskDetail.statusLabels.todo');
      case 'progress':
        return t('taskDetail.statusLabels.progress');
      case 'review':
        return t('taskDetail.statusLabels.review');
      case 'done':
        return t('taskDetail.statusLabels.done');
      default:
        return columnId;
    }
  };

  const getInitials = (name: string) => {
    if (!name) return 'UN';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const formatDate = (date: Date | undefined) => {
    if (!date || isNaN(date.getTime())) return t('taskDetail.noDueDate');
    try {
      return new Intl.DateTimeFormat(undefined, { 
        dateStyle: 'medium',
        timeStyle: 'short'
      }).format(date);
    } catch {
      return t('taskDetail.noDueDate');
    }
  };

  const handleEdit = () => {
    setEditTitle(task.title);
    setEditDescription(task.description || "");
    setEditTaskType(task.taskType || "follow-up");
    setEditStatus(task.status || "open");
    setEditRelatedEntityType(task.relatedEntityType || "");
    setEditRelatedEntityId(task.relatedEntityId ? String(task.relatedEntityId) : "");
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditTitle(task.title);
    setEditDescription(task.description || "");
    setEditTaskType(task.taskType || "follow-up");
    setEditStatus(task.status || "open");
    setEditRelatedEntityType(task.relatedEntityType || "");
    setEditRelatedEntityId(task.relatedEntityId ? String(task.relatedEntityId) : "");
  };

  const handleSave = async () => {
    if (!editTitle.trim()) {
      toast({
        title: t('toast.validationError'),
        description: t('toast.titleRequired'),
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      // Parse task ID - handle both numeric strings and prefixed formats
      const taskIdNum = parseInt(task.id, 10) || parseInt(task.id.replace(/\D/g, ''), 10);
      
      if (!isNaN(taskIdNum)) {
        await TasksService.updateProjectTask(taskIdNum, {
          title: editTitle.trim(),
          description: editDescription.trim(),
          taskType: editTaskType,
          status: editStatus,
          relatedEntityType: editRelatedEntityType || undefined,
          relatedEntityId: editRelatedEntityId ? Number(editRelatedEntityId) : undefined,
        });
      }

      const updatedTask: Task = {
        ...task,
        title: editTitle.trim(),
        description: editDescription.trim(),
        taskType: editTaskType,
        status: editStatus,
        relatedEntityType: editRelatedEntityType || undefined,
        relatedEntityId: editRelatedEntityId ? editRelatedEntityId : undefined,
      };

      toast({
        title: t('toast.success'),
        description: t('toast.taskUpdated'),
      });

      setIsEditing(false);
      onTaskUpdated?.(updatedTask);
    } catch (error) {
      console.error('Failed to update task:', error);
      toast({
        title: t('toast.error'),
        description: t('toast.failedUpdate'),
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      // Parse task ID - handle both numeric strings and prefixed formats
      const taskIdNum = parseInt(task.id, 10) || parseInt(task.id.replace(/\D/g, ''), 10);
      
      if (!isNaN(taskIdNum)) {
        const deleted = await TasksService.deleteProjectTask(taskIdNum);
        if (!deleted) {
          throw new Error('Delete failed');
        }
      }

      toast({
        title: t('toast.success'),
        description: t('toast.taskDeleted'),
      });

      setShowDeleteConfirm(false);
      onOpenChange(false);
      onTaskDeleted?.(task.id);
    } catch (error) {
      console.error('Failed to delete task:', error);
      toast({
        title: t('toast.error'),
        description: t('toast.failedDelete'),
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto p-0">
          <DialogHeader className="px-6 pt-6 pb-4 space-y-4">
            <DialogDescription className="sr-only">
              {t('taskDetail.title')}
            </DialogDescription>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                {isEditing ? (
                  <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder={t('taskDetail.taskTitle')}
                    className="text-xl font-semibold"
                  />
                ) : (
                  <DialogTitle className="text-xl font-semibold leading-tight text-foreground">
                    {task.title}
                  </DialogTitle>
                )}
              </div>
              <div className="flex gap-2">
                {isEditing ? (
                  <>
                    <Button variant="outline" size="sm" onClick={handleCancelEdit} disabled={isSaving}>
                      <X className="h-4 w-4" />
                    </Button>
                    <Button size="sm" onClick={handleSave} disabled={isSaving}>
                      {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" size="sm" onClick={handleEdit}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setShowDeleteConfirm(true)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          </DialogHeader>

          <div className="px-6 pb-6 space-y-6">

            {/* Description Section */}
            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                {t('taskDetail.description')}
              </h3>
              {isEditing ? (
                <Textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder={t('taskDetail.addDescription')}
                  className="min-h-[100px]"
                />
              ) : (
                <p className="text-sm text-muted-foreground leading-relaxed bg-muted/50 rounded-lg p-4">
                  {task.description || t('taskDetail.noDescription')}
                </p>
              )}
            </section>

            <Separator />

            {/* Details Grid */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Assignee Card */}
              <div className="space-y-3 p-4 bg-muted/30 rounded-lg border border-border/50">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                  <User className="h-3.5 w-3.5" />
                  {t('taskDetail.assignee')}
                </h4>
                <div className="flex items-center gap-3">
                  {showAssignDropdown ? (
                    <Select
                      onValueChange={(value) => {
                        const tech = technicians.find(t => t.id === value);
                        if (tech) {
                          handleAssignTask(tech.id, tech.name);
                        }
                      }}
                      disabled={isAssigning}
                    >
                      <SelectTrigger className="w-full h-9">
                        <SelectValue placeholder={t('taskDetail.select')} />
                      </SelectTrigger>
                      <SelectContent>
                        {technicians.map((tech) => (
                          <SelectItem key={tech.id} value={tech.id}>
                            {tech.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <>
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="text-sm bg-primary/10 text-primary font-medium">
                          {getInitials(task.assignee)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium text-foreground flex-1">
                        {task.assignee || t('taskDetail.unassigned')}
                      </span>
                    </>
                  )}
                  {showAssignDropdown ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => setShowAssignDropdown(false)}
                      title={t('common.cancel')}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  ) : (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setShowAssignDropdown(true)}
                        disabled={isAssigning || technicians.length === 0}
                        title={t('taskDetail.assignToTechnician')}
                      >
                        {isAssigning ? <Loader2 className="h-3 w-3 animate-spin" /> : <UserPlus className="h-3 w-3" />}
                      </Button>
                      {task.assignee && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={handleUnassignTask}
                          disabled={isAssigning}
                          title={t('taskDetail.unassignTask')}
                        >
                          <UserMinus className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Due Date Card */}
              <div className="space-y-3 p-4 bg-muted/30 rounded-lg border border-border/50">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5" />
                  {t('taskDetail.dueDate')}
                </h4>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">
                    {task.dueDate || t('taskDetail.noDueDate')}
                  </span>
                </div>
              </div>
            </section>

            <Separator />

            {/* Additional Details Section for Activity */}
            <div className="space-y-4">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {t('taskDetail.details', 'Details')}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">{t('taskDetail.type', 'Task Type')}</p>
                  {isEditing ? (
                    <Select value={editTaskType} onValueChange={setEditTaskType}>
                      <SelectTrigger className="w-full h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="call">{t('taskType.call', 'Call')}</SelectItem>
                        <SelectItem value="visit">{t('taskType.visit', 'Visit')}</SelectItem>
                        <SelectItem value="meeting">{t('taskType.meeting', 'Meeting')}</SelectItem>
                        <SelectItem value="follow-up">{t('taskType.followUp', 'Follow-up')}</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-sm font-medium">{task.taskType || 'Follow-up'}</p>
                  )}
                </div>
                
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">{t('taskDetail.relatedEntity', 'Related Entity')}</p>
                  {isEditing ? (
                    <div className="flex gap-2">
                       <Input 
                         placeholder="Entity Type" 
                         value={editRelatedEntityType} 
                         onChange={(e) => setEditRelatedEntityType(e.target.value)}
                         className="w-1/2 h-9"
                       />
                       <Input 
                         placeholder="Entity ID" 
                         value={editRelatedEntityId} 
                         onChange={(e) => setEditRelatedEntityId(e.target.value)}
                         className="w-1/2 h-9"
                       />
                    </div>
                  ) : (
                    <p className="text-sm font-medium">
                      {task.relatedEntityType 
                        ? `${task.relatedEntityType} ${task.relatedEntityId ? `#${task.relatedEntityId}` : ''}`
                        : <span className="text-muted-foreground italic">{t('taskDetail.none', 'None')}</span>
                      }
                    </p>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            {/* Comments Section */}
            <TaskComments taskId={task.id} />

            {/* Actions */}
            {!isEditing && (
              <div className="flex gap-2 pt-2 border-t border-border/50">
                <Button variant="outline" onClick={handleEdit} className="flex-1">
                  <Edit className="h-4 w-4 mr-2" />
                  {t('taskDetail.editTask')}
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('taskDetail.deleteConfirm.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('taskDetail.deleteConfirm.description')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>{t('taskDetail.deleteConfirm.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {t('taskDetail.deleteConfirm.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
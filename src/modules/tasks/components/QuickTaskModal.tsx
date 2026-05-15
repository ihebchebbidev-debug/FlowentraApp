import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLookups } from '@/shared/contexts/LookupsContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, CheckSquare, User, Settings2 } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Task, Technician, Column, Project } from "../types";

// Default task types
const taskTypes = [
  { id: 'follow-up', name: 'Follow-up', icon: '📞' },
  { id: 'call', name: 'Call', icon: '☎️' },
  { id: 'meeting', name: 'Meeting', icon: '👥' },
  { id: 'visit', name: 'Visit', icon: '🚗' },
];

// Get current user from localStorage
const getCurrentUser = () => {
  try {
    const userData = localStorage.getItem('user_data');
    if (userData) {
      const user = JSON.parse(userData);
      return {
        id: String(user.id || user.userId),
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
      };
    }
  } catch {
    return null;
  }
  return null;
};

interface TeamMember {
  id: string;
  name: string;
}

interface QuickTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void;
  technicians: Technician[];
  columns: Column[];
  projects?: Project[];
  projectId?: string;
  teamMembers?: TeamMember[];
}

export function QuickTaskModal({
  isOpen,
  onClose,
  onCreateTask,
  technicians,
  columns,
  projects = [],
  projectId,
  teamMembers = []
}: QuickTaskModalProps) {
  const { t } = useTranslation('tasks');
  const { toast } = useToast();
  const location = useLocation();
  const { priorities: lookupPriorities } = useLookups();
  const currentUser = getCurrentUser();
  
  // Build returnUrl for lookups navigation
  const currentPath = location.pathname;
  
  // Get the first column (usually "To Do") as default
  const defaultColumnId = columns[0]?.id || 'todo';

  // Form state for the quick task modal
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    taskType: 'follow-up',
    assigneeId: 'myself', // Default to assigning to current user
    columnId: defaultColumnId,
    projectId: projectId || 'none',
    dueDate: '',
  });

  // Update columnId when columns change (to ensure first column is selected)
  useEffect(() => {
    if (columns.length > 0 && formData.columnId !== columns[0]?.id) {
      setFormData(prev => ({ ...prev, columnId: columns[0]?.id || 'todo' }));
    }
  }, [columns, formData.columnId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast({
        title: t('toast.error'),
        description: t('toast.titleRequired'),
        variant: "destructive",
      });
      return;
    }

    // Resolve assignee - handle "myself" option
    let assigneeId: string | undefined;
    let assigneeName: string | undefined;
    
    if (formData.assigneeId === 'myself' && currentUser) {
      assigneeId = currentUser.id;
      assigneeName = currentUser.name;
    } else if (formData.assigneeId !== 'unassigned') {
      const assignee = technicians.find(t => t.id === formData.assigneeId);
      assigneeId = formData.assigneeId;
      assigneeName = assignee?.name;
    }

    const _selectedProject = formData.projectId !== 'none' ? projects.find(p => p.id === formData.projectId) : undefined;
    
    const newTask: Omit<Task, 'id' | 'createdAt' | 'updatedAt'> = {
      title: formData.title.trim(),
      description: formData.description.trim() || undefined,
      taskType: formData.taskType,
      status: formData.columnId, // Will be updated to match column
      relatedEntityType: formData.projectId !== 'none' ? 'project' : undefined,
      relatedEntityId: formData.projectId !== 'none' ? formData.projectId : undefined,
      assigneeId: assigneeId,
      assigneeName: assigneeName,
      dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined,
    };

    onCreateTask(newTask as any);
    
    // Reset form with defaults
    setFormData({
      title: '',
      description: '',
      taskType: 'follow-up',
      assigneeId: 'myself',
      columnId: columns[0]?.id || 'todo',
      projectId: projectId || 'none',
      dueDate: '',
    });
    
    toast({
      title: t('toast.success'),
      description: t('toast.taskCreated'),
    });
    
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5" />
            {t('quickTask.title')}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">{t('quickTask.taskTitle')}</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder={t('quickTask.taskTitlePlaceholder')}
              required
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{t('quickTask.description')}</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder={t('quickTask.descriptionPlaceholder')}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="taskType">{t('quickTask.taskType', 'Task Type')}</Label>
              </div>
              <Select 
                value={formData.taskType} 
                onValueChange={(value: string) => setFormData({ ...formData, taskType: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('quickTask.selectTaskType', 'Select task type')} />
                </SelectTrigger>
                <SelectContent>
                  {taskTypes.map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      <div className="flex items-center gap-2">
                        <span>{p.icon}</span>
                        {p.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="project">{t('quickTask.project')}</Label>
              <Select 
                value={formData.projectId} 
                onValueChange={(value: string) => setFormData({ ...formData, projectId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('quickTask.selectProject')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t('quickTask.noProject')}</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          project.status === 'active' ? 'bg-green-500' :
                          project.status === 'completed' ? 'bg-blue-500' :
                          project.status === 'on-hold' ? 'bg-yellow-500' :
                          'bg-gray-500'
                        }`} />
                        {project.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="assignee">{t('quickTask.assignTo')}</Label>
              <Select 
                value={formData.assigneeId} 
                onValueChange={(value: string) => setFormData({ ...formData, assigneeId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('quickTask.assignPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {currentUser && (
                    <SelectItem value="myself">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-primary" />
                        <span className="font-medium">{t('quickTask.myself')}</span>
                        <span className="text-muted-foreground text-xs">({currentUser.name})</span>
                      </div>
                    </SelectItem>
                  )}
                  <SelectItem value="unassigned">{t('quickTask.unassigned')}</SelectItem>
                  {/* Show project team members if available, otherwise show technicians */}
                  {(teamMembers.length > 0 ? teamMembers : technicians).map((member) => {
                    // Skip current user since they have "Myself" option
                    if (currentUser && member.id === currentUser.id) return null;
                    return (
                      <SelectItem key={member.id} value={member.id}>
                        {member.name}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="column">{t('quickTask.column')}</Label>
              <Select 
                value={formData.columnId} 
                onValueChange={(value: string) => setFormData({ ...formData, columnId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('quickTask.selectColumn')} />
                </SelectTrigger>
                <SelectContent>
                  {columns.map((column) => (
                    <SelectItem key={column.id} value={column.id}>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded ${column.color}`} />
                        {column.title}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dueDate">{t('quickTask.dueDate')}</Label>
            <Input
              id="dueDate"
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              {t('quickTask.cancel')}
            </Button>
            <Button type="submit">
              <Plus className="h-4 w-4 mr-2" />
              {t('quickTask.createTask')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
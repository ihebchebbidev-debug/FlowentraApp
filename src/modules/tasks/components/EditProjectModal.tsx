import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import projectStatuses from '@/data/mock/project-statuses.json';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  CalendarIcon, 
  Users, 
  Plus, 
  X,
  FolderOpen,
  CheckSquare,
  DollarSign,
  Settings,
  Edit
} from "lucide-react";
import { format } from "date-fns";
import { Project, Technician } from "../types";
import { useTranslation } from 'react-i18next';

interface EditProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdateProject: (projectId: string, updates: Partial<Project>) => void;
  project: Project | null;
  technicians: Technician[];
}

const projectTypes = [
  { value: 'service', label: 'Service Project', icon: Settings },
  { value: 'sales', label: 'Sales Project', icon: DollarSign },
  { value: 'internal', label: 'Internal Project', icon: FolderOpen },
  { value: 'custom', label: 'Custom Project', icon: CheckSquare },
];

export function EditProjectModal({
  isOpen,
  onClose,
  onUpdateProject,
  project,
  technicians
}: EditProjectModalProps) {
  const { toast } = useToast();
  const { t } = useTranslation('tasks');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'internal' as Project['type'],
    status: 'active' as Project['status'],
    startDate: undefined as Date | undefined,
    endDate: undefined as Date | undefined,
  });
  const [selectedTechnicians, setSelectedTechnicians] = useState<string[]>([]);
  const [columns, setColumns] = useState(project?.columns || []);
  const [newColumnName, setNewColumnName] = useState('');

  // Update form data when project changes
  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name,
        description: project.description || '',
        type: project.type,
        status: project.status,
        startDate: project.startDate,
        endDate: project.endDate,
      });
      setSelectedTechnicians(project.teamMembers);
      setColumns(project.columns);
    }
  }, [project]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!project) return;
    
    if (!formData.name.trim()) {
      toast({
        title: t('projects.form.errorTitle'),
        description: t('projects.form.nameRequired'),
        variant: "destructive",
      });
      return;
    }

    const updates: Partial<Project> = {
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      type: formData.type,
      status: formData.status,
      startDate: formData.startDate,
      endDate: formData.endDate,
      teamMembers: selectedTechnicians,
      columns: columns,
      updatedAt: new Date(),
      completedAt: formData.status === 'completed' ? new Date() : undefined,
    };

    onUpdateProject(project.id, updates);
    
    // Close modal - parent component handles success/error toast
    onClose();
  };

  const addTechnician = (technicianId: string) => {
    if (!selectedTechnicians.includes(technicianId)) {
      setSelectedTechnicians([...selectedTechnicians, technicianId]);
    }
  };

  const removeTechnician = (technicianId: string) => {
    setSelectedTechnicians(selectedTechnicians.filter(id => id !== technicianId));
  };

  const addColumn = () => {
    if (newColumnName.trim()) {
      const colors = ['bg-slate-500', 'bg-primary', 'bg-accent', 'bg-success', 'bg-warning', 'bg-chart-4'];
      const newColumn = {
        id: `col-${Date.now()}`,
        title: newColumnName.trim(),
        color: colors[columns.length % colors.length],
        position: columns.length,
        projectId: project?.id,
        isDefault: false,
        createdAt: new Date(),
      };
      setColumns([...columns, newColumn]);
      setNewColumnName('');
    }
  };

  const removeColumn = (index: number) => {
    if (columns.length > 1) {
      setColumns(columns.filter((_, i) => i !== index));
    }
  };

  const updateColumnName = (index: number, name: string) => {
    const updatedColumns = [...columns];
    updatedColumns[index] = { ...updatedColumns[index], title: name };
    setColumns(updatedColumns);
  };

  if (!project) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            {t('projects.form.editTitle', { name: project.name })}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t('projects.form.labels.projectName')}</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={t('projects.form.placeholders.enterProjectName')}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">{t('projects.form.labels.description')}</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder={t('projects.form.placeholders.describeProject')}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">{t('projects.form.labels.projectType')}</Label>
                  <Select 
                    value={formData.type} 
                    onValueChange={(value: Project['type']) => setFormData({ ...formData, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('projects.form.labels.selectProjectType')} />
                    </SelectTrigger>
                    <SelectContent>
                      {projectTypes.map((type) => {
                        const Icon = type.icon;
                        return (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4" />
                              {t(`projects.form.projectTypes.${type.value}`)}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">{t('projects.form.labels.projectStatus')}</Label>
                  <Select 
                    value={formData.status} 
                    onValueChange={(value: Project['status']) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('projects.form.labels.selectProjectType')} />
                    </SelectTrigger>
                    <SelectContent>
                      {projectStatuses.map(s => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('projects.form.labels.startDate')}</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.startDate ? format(formData.startDate, "PPP") : t('projects.form.buttons.pickDate')}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.startDate}
                        onSelect={(date) => setFormData({ ...formData, startDate: date })}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>{t('projects.form.labels.endDate')}</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.endDate ? format(formData.endDate, "PPP") : t('projects.form.buttons.pickDate')}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.endDate}
                        onSelect={(date) => setFormData({ ...formData, endDate: date })}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>

            {/* Team & Columns */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{t('projects.form.labels.teamMembers')}</Label>
                <Select onValueChange={addTechnician}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('projects.form.buttons.addTeamMember')} />
                  </SelectTrigger>
                  <SelectContent>
                    {technicians
                      .filter(tech => !selectedTechnicians.includes(tech.id))
                      .map((tech) => (
                        <SelectItem key={tech.id} value={tech.id}>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            {tech.name} - {tech.role}
                          </div>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                
                {selectedTechnicians.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedTechnicians.map((techId) => {
                      const tech = technicians.find(t => t.id === techId);
                      return tech ? (
                        <Badge key={tech.id} variant="secondary" className="gap-1">
                          {tech.name}
                          <X
                            className="h-3 w-3 cursor-pointer"
                            onClick={() => removeTechnician(tech.id)}
                          />
                        </Badge>
                      ) : null;
                    })}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>{t('projects.form.labels.customColumns')}</Label>
                <div className="space-y-2">
                  {columns.map((column, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded ${column.color}`} />
                      <Input
                        value={column.title}
                        onChange={(e) => updateColumnName(index, e.target.value)}
                        className="flex-1"
                      />
                      {columns.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeColumn(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  
                  <div className="flex gap-2">
                    <Input
                      value={newColumnName}
                      onChange={(e) => setNewColumnName(e.target.value)}
                      placeholder={t('projects.form.labels.addNewColumn')}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addColumn())}
                    />
                    <Button type="button" onClick={addColumn}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              {t('projects.form.buttons.cancel')}
            </Button>
            <Button type="submit">
              {t('projects.form.buttons.updateProject')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
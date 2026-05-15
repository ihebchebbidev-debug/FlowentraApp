import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import projectTypes from '@/data/mock/project-types.json';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Project } from "@/modules/tasks/types";

interface CreateContactProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateProject: (projectData: Partial<Project>) => void;
  contactId: string;
  contactName: string;
}

export function CreateContactProjectModal({
  isOpen,
  onClose,
  onCreateProject,
  contactId,
  contactName
}: CreateContactProjectModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'service' as const,
    startDate: undefined as Date | undefined,
    endDate: undefined as Date | undefined,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) return;

    const projectData: Partial<Project> = {
      name: formData.name,
      description: formData.description,
      type: formData.type,
      status: 'active',
      contactId,
      contactName,
      startDate: formData.startDate,
      endDate: formData.endDate,
      ownerId: 'current-user',
      ownerName: 'Current User',
      teamMembers: [],
      columns: [
        {
          id: `col-${Date.now()}-1`,
          title: 'To Do',
          color: 'bg-slate-500',
          position: 0,
          isDefault: true,
          createdAt: new Date(),
        },
        {
          id: `col-${Date.now()}-2`,
          title: 'In Progress',
          color: 'bg-primary',
          position: 1,
          isDefault: true,
          createdAt: new Date(),
        },
        {
          id: `col-${Date.now()}-3`,
          title: 'Review',
          color: 'bg-warning',
          position: 2,
          isDefault: true,
          createdAt: new Date(),
        },
        {
          id: `col-${Date.now()}-4`,
          title: 'Done',
          color: 'bg-success',
          position: 3,
          isDefault: true,
          createdAt: new Date(),
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    onCreateProject(projectData);
    
    // Reset form
    setFormData({
      name: '',
      description: '',
      type: 'service',
      startDate: undefined,
      endDate: undefined,
    });
    
    onClose();
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Create a new project for {contactName}
          </p>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Project Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Enter project name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Describe the project goals and scope"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Project Type</Label>
            <Select value={formData.type} onValueChange={(value) => handleChange('type', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {projectTypes.map((pt: any) => (
                  <SelectItem key={pt.id} value={pt.id}>{pt.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.startDate ? format(formData.startDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.startDate}
                    onSelect={(date) => handleChange('startDate', date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.endDate ? format(formData.endDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.endDate}
                    onSelect={(date) => handleChange('endDate', date)}
                    initialFocus
                    disabled={(date) => formData.startDate ? date < formData.startDate : false}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!formData.name.trim()}>
              Create Project
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
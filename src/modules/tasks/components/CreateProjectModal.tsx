import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  Loader2,
  FolderKanban,
  Settings2
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { format } from "date-fns";
import { Project } from "../types";
import { usersApi } from "@/services/usersApi";
import type { User } from "@/types/users";
import { useProjectTypes } from "@/modules/lookups/hooks/useLookups";

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => void;
  parentProject?: Project;
}

// Default icons for project types
const projectTypeIcons: Record<string, any> = {
  service: Settings,
  sales: DollarSign,
  internal: FolderOpen,
  custom: CheckSquare,
};

// Get icon for a project type (fallback to FolderKanban)
const getProjectTypeIcon = (typeValue: string) => {
  return projectTypeIcons[typeValue] || FolderKanban;
};

export function CreateProjectModal({
  isOpen,
  onClose,
  onCreateProject,
  parentProject
}: CreateProjectModalProps) {
  const { t } = useTranslation('tasks');
  const { toast } = useToast();
  const location = useLocation();
  
  // Build returnUrl for lookups navigation
  const currentPath = location.pathname;
  
  // Fetch project types from API
  const { items: projectTypesData, isLoading: isLoadingProjectTypes } = useProjectTypes();
  
  // Map API data to select options with translations
  const projectTypes = useMemo(() => {
    if (projectTypesData.length > 0) {
      return projectTypesData.map(item => ({
        value: item.value || item.name.toLowerCase().replace(/\s+/g, '_'),
        label: item.name,
        isDefault: item.isDefault || false,
      }));
    }
    // Fallback to static types if API returns empty
    return [
      { value: 'service', label: t('projects.createModal.projectTypes.service'), isDefault: false },
      { value: 'sales', label: t('projects.createModal.projectTypes.sales'), isDefault: false },
      { value: 'internal', label: t('projects.createModal.projectTypes.internal'), isDefault: true },
      { value: 'custom', label: t('projects.createModal.projectTypes.custom'), isDefault: false },
    ];
  }, [projectTypesData, t]);

  // Get initial project type: default from lookup, or first if only one, or fallback to 'internal'
  const getInitialProjectType = useMemo((): Project['type'] => {
    if (projectTypes.length === 1) {
      return projectTypes[0].value as Project['type'];
    }
    const defaultType = projectTypes.find(pt => pt.isDefault);
    if (defaultType) {
      return defaultType.value as Project['type'];
    }
    return 'internal';
  }, [projectTypes]);
  
  const defaultColumns = [
    { title: t('projects.createModal.defaultColumns.todo'), color: 'bg-slate-500' },
    { title: t('projects.createModal.defaultColumns.inProgress'), color: 'bg-primary' },
    { title: t('projects.createModal.defaultColumns.review'), color: 'bg-warning' },
    { title: t('projects.createModal.defaultColumns.done'), color: 'bg-success' },
  ];

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: '' as Project['type'], // Will be set by useEffect based on projectTypes
    startDate: undefined as Date | undefined,
    endDate: undefined as Date | undefined,
  });

  // Auto-set project type when projectTypes load (default or single option)
  useEffect(() => {
    if (!isLoadingProjectTypes && projectTypes.length > 0 && !formData.type) {
      setFormData(prev => ({ ...prev, type: getInitialProjectType }));
    }
  }, [isLoadingProjectTypes, projectTypes, getInitialProjectType, formData.type]);
  const [selectedMembers, setSelectedMembers] = useState<{ id: number; name: string }[]>([]);
  const [columns, setColumns] = useState(defaultColumns);
  const [newColumnName, setNewColumnName] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [memberSelectKey, setMemberSelectKey] = useState(0);

  // Fetch users from API when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

  // Get MainAdminUser from localStorage
  const getMainAdminUser = (): User | null => {
    try {
      const userData = localStorage.getItem('user_data');
      if (userData) {
        const parsed = JSON.parse(userData);
        // MainAdminUser always has ID=1
        if (parsed.id === 1 || parsed.userId === 1) {
          return {
            id: 1,
            firstName: parsed.firstName || parsed.fullName?.split(' ')[0] || 'Admin',
            lastName: parsed.lastName || parsed.fullName?.split(' ').slice(1).join(' ') || '',
            email: parsed.email || '',
            role: 'Admin',
            isActive: true,
          } as User;
        }
      }
    } catch (e) {
      console.warn('Failed to parse MainAdminUser from localStorage:', e);
    }
    return null;
  };

  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const response = await usersApi.getAll();
      let allUsers = response.users || [];
      
      // Include MainAdminUser if not already in the list
      const mainAdmin = getMainAdminUser();
      if (mainAdmin && !allUsers.some(u => u.id === 1)) {
        allUsers = [mainAdmin, ...allUsers];
      }
      
      setUsers(allUsers);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      
      // Even if API fails, try to include MainAdminUser
      const mainAdmin = getMainAdminUser();
      if (mainAdmin) {
        setUsers([mainAdmin]);
      }
      
      toast({
        title: t('projects.form.errorTitle'),
        description: t('projects.createModal.warnings.couldNotLoadTeam'),
        variant: "destructive",
      });
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: t('projects.form.errorTitle'),
        description: t('projects.createModal.errors.nameRequired'),
        variant: "destructive",
      });
      return;
    }

    const projectColumns = columns.map((col, index) => ({
      id: `col-${Date.now()}-${index}`,
      title: col.title,
      color: col.color,
      position: index,
      projectId: null,
      isDefault: false,
      createdAt: new Date(),
    }));

    const newProject: Omit<Project, 'id' | 'createdAt' | 'updatedAt'> = {
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      type: formData.type,
      status: 'active',
      startDate: formData.startDate,
      endDate: formData.endDate,
      ownerId: 'current-user',
      ownerName: 'Current User',
      teamMembers: selectedMembers.map(m => String(m.id)),
      parentProjectId: parentProject?.id,
      columns: projectColumns,
      completedAt: undefined,
    };

    onCreateProject(newProject);
    
    // Reset form
    setFormData({
      name: '',
      description: '',
      type: getInitialProjectType,
      startDate: undefined,
      endDate: undefined,
    });
    setSelectedMembers([]);
    setColumns(defaultColumns);
    
    onClose();
  };

  const addMember = (userId: string) => {
    const user = users.find(u => String(u.id) === userId);
    if (user && !selectedMembers.some(m => m.id === user.id)) {
      setSelectedMembers([...selectedMembers, { 
        id: user.id, 
        name: `${user.firstName} ${user.lastName}`.trim() 
      }]);
    }
    // Reset the select to show placeholder again
    setMemberSelectKey(prev => prev + 1);
  };

  const removeMember = (userId: number) => {
    setSelectedMembers(selectedMembers.filter(m => m.id !== userId));
  };

  const addColumn = () => {
    if (newColumnName.trim()) {
      const colors = ['bg-slate-500', 'bg-primary', 'bg-accent', 'bg-success', 'bg-warning', 'bg-chart-4'];
      const newColumn = {
        title: newColumnName.trim(),
        color: colors[columns.length % colors.length],
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

  // Filter out already selected users
  const availableUsers = users.filter(u => !selectedMembers.some(m => m.id === u.id));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            {parentProject ? t('projects.createModal.titleSubProject') : t('projects.createModal.title')}
            {parentProject && (
              <Badge variant="outline" className="ml-2">
                {t('projects.createModal.under')} {parentProject.name}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t('projects.createModal.projectName')}</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={t('projects.createModal.projectNamePlaceholder')}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">{t('projects.createModal.description')}</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder={t('projects.createModal.descriptionPlaceholder')}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="type">{t('projects.createModal.projectType')}</Label>
                  <Link 
                    to={`/dashboard/lookups?tab=projectTypes&returnUrl=${encodeURIComponent(currentPath)}`}
                    className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors"
                  >
                    <Settings2 className="h-3 w-3" />
                    {t('common.manage', 'Manage')}
                  </Link>
                </div>
                <Select 
                  value={formData.type} 
                  onValueChange={(value: Project['type']) => setFormData({ ...formData, type: value })}
                  disabled={isLoadingProjectTypes}
                >
                  <SelectTrigger>
                    {isLoadingProjectTypes ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>{t('projects.createModal.loadingTypes', 'Loading...')}</span>
                      </div>
                    ) : (
                      <SelectValue placeholder={t('projects.createModal.selectProjectType')} />
                    )}
                  </SelectTrigger>
                  <SelectContent className="bg-popover border border-border">
                    {projectTypes.map((type) => {
                      const Icon = getProjectTypeIcon(type.value);
                      return (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            {type.label}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('projects.createModal.startDate')}</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.startDate ? format(formData.startDate, "PPP") : t('projects.createModal.pickDate')}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.startDate}
                        onSelect={(date) => setFormData({ ...formData, startDate: date })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>{t('projects.createModal.endDate')}</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.endDate ? format(formData.endDate, "PPP") : t('projects.createModal.pickDate')}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.endDate}
                        onSelect={(date) => setFormData({ ...formData, endDate: date })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>

            {/* Team & Columns */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{t('projects.createModal.teamMembers')}</Label>
                <Select key={memberSelectKey} onValueChange={addMember} value="">
                  <SelectTrigger>
                    {isLoadingUsers ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {t('projects.createModal.loadingUsers')}
                      </div>
                    ) : (
                      <SelectValue placeholder={t('projects.createModal.selectTeamMember')} />
                    )}
                  </SelectTrigger>
                  <SelectContent className="bg-popover border border-border">
                    {availableUsers.length === 0 ? (
                      <div className="p-2 text-sm text-muted-foreground text-center">
                        {isLoadingUsers ? t('projects.createModal.loadingUsers') : t('projects.createModal.noUsersAvailable')}
                      </div>
                    ) : (
                      availableUsers.map((user) => (
                        <SelectItem key={user.id} value={String(user.id)}>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            {user.firstName} {user.lastName}
                            {user.role && <span className="text-muted-foreground">- {user.role}</span>}
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                
                {selectedMembers.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedMembers.map((member) => (
                      <Badge key={member.id} variant="secondary" className="gap-1">
                        {member.name}
                        <X
                          className="h-3 w-3 cursor-pointer"
                          onClick={() => removeMember(member.id)}
                        />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>{t('projects.createModal.columns')}</Label>
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
                      placeholder={t('projects.createModal.addNewColumn')}
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
              {t('projects.createModal.cancel')}
            </Button>
            <Button type="submit">
              {parentProject ? t('projects.createModal.createSubProject') : t('projects.createModal.createProject')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

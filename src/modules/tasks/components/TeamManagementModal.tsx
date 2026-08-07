import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Users, 
  Plus, 
  X,
  Search,
  UserPlus,
  Settings
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Project, Technician } from "../types";

interface TeamManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
  allTechnicians: Technician[];
  onUpdateTeam: (projectId: string, teamMembers: string[]) => void;
}

export function TeamManagementModal({
  isOpen,
  onClose,
  project,
  allTechnicians,
  onUpdateTeam
}: TeamManagementModalProps) {
  const { t } = useTranslation('tasks');
  const { toast } = useToast();
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Update selected members when project changes
  useEffect(() => {
    if (project) {
      setSelectedMembers(project.teamMembers);
    }
  }, [project]);

  const filteredTechnicians = allTechnicians.filter(tech =>
    tech.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tech.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const availableTechnicians = filteredTechnicians.filter(
    tech => !selectedMembers.includes(tech.id)
  );

  const teamMembers = selectedMembers.map(id => 
    allTechnicians.find(tech => tech.id === id)
  ).filter(Boolean) as Technician[];

  const handleAddMember = (technicianId: string) => {
    if (!selectedMembers.includes(technicianId)) {
      setSelectedMembers([...selectedMembers, technicianId]);
    }
  };

  const handleRemoveMember = (technicianId: string) => {
    setSelectedMembers(selectedMembers.filter(id => id !== technicianId));
  };

  const handleSave = () => {
    if (!project) return;
    
    onUpdateTeam(project.id, selectedMembers);
    
    toast({
      title: t('toast.success'),
      description: t('toast.teamUpdated', { count: selectedMembers.length }),
    });
    
    onClose();
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  if (!project) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {t('teamManagement.title', { name: project.name })}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Team Members */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">{t('teamManagement.teamMembers')} ({teamMembers.length})</Label>
              <Badge variant="outline">
                {project.ownerName} ({t('teamManagement.owner')})
              </Badge>
            </div>
            
            {teamMembers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>{t('teamManagement.noMembers')}</p>
                <p className="text-sm">{t('teamManagement.noMembersHint')}</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {teamMembers.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-3 border border-border rounded-lg bg-muted/30">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                          {getInitials(member.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{member.name}</div>
                        <div className="text-sm text-muted-foreground">{member.role}</div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveMember(member.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add New Members */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">{t('teamManagement.addMembers')}</Label>
            
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('teamManagement.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Quick Add Dropdown */}
            {availableTechnicians.length > 0 && (
              <Select onValueChange={handleAddMember}>
                <SelectTrigger>
                  <SelectValue placeholder={t('teamManagement.quickAdd')} />
                </SelectTrigger>
                <SelectContent>
                  {availableTechnicians.slice(0, 5).map((tech) => (
                    <SelectItem key={tech.id} value={tech.id}>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs">
                            {getInitials(tech.name)}
                          </AvatarFallback>
                        </Avatar>
                        {tech.name} - {tech.role}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Available Technicians List */}
            {availableTechnicians.length > 0 ? (
              <div className="max-h-60 overflow-y-auto">
                <div className="grid gap-2">
                  {availableTechnicians.map((tech) => (
                    <div key={tech.id} className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">
                            {getInitials(tech.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-sm">{tech.name}</div>
                          <div className="text-xs text-muted-foreground">{tech.role}</div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddMember(tech.id)}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        {t('teamManagement.add')}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <UserPlus className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">
                  {searchTerm ? t('teamManagement.noTechsFound') : t('teamManagement.allOnTeam')}
                </p>
              </div>
            )}
          </div>

          {/* Info Box */}
          <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
            <div className="flex items-start gap-2">
              <Settings className="h-5 w-5 text-primary mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-primary mb-1">{t('teamManagement.autoUpdate')}</p>
                <p className="text-muted-foreground">
                  {t('teamManagement.autoUpdateHint')}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              {t('teamManagement.cancel')}
            </Button>
            <Button onClick={handleSave}>
              {t('teamManagement.updateTeam', { count: selectedMembers.length })}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from 'react-i18next';
import { skillsApi, Skill } from "@/services/skillsApi";
import { Role } from "@/services/rolesApi";
import { Loader2, Zap, X } from "lucide-react";

interface SkillAssignmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: Role | null;
  onSkillAssigned: () => void;
}

export function SkillAssignmentModal({ open, onOpenChange, role, onSkillAssigned }: SkillAssignmentModalProps) {
  const { toast } = useToast();
  const { t } = useTranslation('settings');
  const [loading, setLoading] = useState(false);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [roleSkills, setRoleSkills] = useState<Skill[]>([]);
  const [selectedSkillId, setSelectedSkillId] = useState<string>("");
  const [skillsLoading, setSkillsLoading] = useState(false);

  useEffect(() => {
    if (open && role) {
      fetchSkills();
      fetchRoleSkills();
    }
  }, [open, role]);

  const fetchSkills = async () => {
    try {
      setSkillsLoading(true);
      const response = await skillsApi.getAll();
      setSkills(response.filter((skill: any) => skill.isActive));
    } catch (error) {
      toast({
        title: t('skillAssignment.errorTitle', { defaultValue: 'Error' }),
        description: t('skillAssignment.fetchFailed', { defaultValue: 'Failed to fetch skills' }),
        variant: "destructive"
      });
    } finally {
      setSkillsLoading(false);
    }
  };

  const fetchRoleSkills = async () => {
    if (!role) return;
    try {
      const data = await skillsApi.getRoleSkills(role.id);
      setRoleSkills(data);
    } catch (error) {
      console.error("Failed to fetch role skills:", error);
      setRoleSkills([]);
    }
  };

  const handleAssignSkill = async () => {
    if (!selectedSkillId || !role) return;

    try {
      setLoading(true);
      await skillsApi.assignToRole(role.id, parseInt(selectedSkillId), {});
      toast({
        title: t('skillAssignment.successTitle', { defaultValue: 'Success' }),
        description: t('skillAssignment.assigned', { defaultValue: 'Skill assigned successfully' })
      });
      
      setSelectedSkillId("");
      fetchRoleSkills();
      onSkillAssigned();
    } catch (error: any) {
      toast({
        title: t('skillAssignment.errorTitle', { defaultValue: 'Error' }),
        description: error?.response?.data?.message || t('skillAssignment.assignFailed', { defaultValue: 'Failed to assign skill' }),
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveSkill = async (skillId: number) => {
    if (!role) return;

    try {
      await skillsApi.removeFromRole(role.id, skillId);
      toast({
        title: t('skillAssignment.successTitle', { defaultValue: 'Success' }),
        description: t('skillAssignment.removed', { defaultValue: 'Skill removed successfully' })
      });
      
      fetchRoleSkills();
      onSkillAssigned();
    } catch (error: any) {
      toast({
        title: t('skillAssignment.errorTitle', { defaultValue: 'Error' }),
        description: error?.response?.data?.message || t('skillAssignment.removeFailed', { defaultValue: 'Failed to remove skill' }),
        variant: "destructive"
      });
    }
  };

  const availableSkills = skills.filter(skill => 
    !roleSkills.some(roleSkill => roleSkill.id === skill.id)
  );

  const getLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'beginner': return 'bg-success/10 text-success';
      case 'intermediate': return 'bg-primary/10 text-primary';
      case 'advanced': return 'bg-warning/10 text-warning';
      case 'expert': return 'bg-destructive/10 text-destructive';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold flex items-center gap-2">
            <Zap className="h-5 w-5 text-chart-3" />
            {t('skillAssignment.title', { roleName: role?.name, defaultValue: `Manage Skills for "${role?.name}"` })}
          </DialogTitle>
          <DialogDescription>
            {t('skillAssignment.desc', { defaultValue: 'Assign and manage skills required for this role' })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Skills */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Current Skills</Label>
            {roleSkills.length > 0 ? (
              <div className="grid gap-3">
                {roleSkills.map((skill) => (
                  <div key={skill.id} className="group relative overflow-hidden rounded-lg border bg-card p-4 transition-all hover:shadow-sm">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                          <Zap className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-sm leading-none">{skill.name}</h4>
                            <Badge className={`text-xs font-medium ${getLevelColor(skill.level)}`}>
                              {skill.level}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground font-medium">{skill.category}</p>
                          {skill.description && (
                            <p className="text-xs text-muted-foreground leading-relaxed">{skill.description}</p>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveSkill(skill.id)}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground text-sm bg-muted/10 rounded-lg">
                No skills assigned to this role yet
              </div>
            )}
          </div>

          {/* Assign New Skill */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Assign New Skill</Label>
            <div className="flex gap-2">
              <Select 
                value={selectedSkillId} 
                onValueChange={setSelectedSkillId}
                disabled={skillsLoading || availableSkills.length === 0}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder={
                    skillsLoading ? "Loading skills..." : 
                    availableSkills.length === 0 ? "No available skills" :
                    "Select a skill"
                  } />
                </SelectTrigger>
                <SelectContent>
                  {availableSkills.map((skill) => (
                    <SelectItem key={skill.id} value={skill.id.toString()}>
                      {skill.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                onClick={handleAssignSkill}
                disabled={!selectedSkillId || loading}
                className="gradient-primary"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Assign
              </Button>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
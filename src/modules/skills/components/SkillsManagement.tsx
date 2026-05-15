
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Wrench, Plus, Search, MoreHorizontal, Edit, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AddEditSkillModal } from "./AddEditSkillModal";
import { DeleteConfirmationModal } from "@/shared/components";
import { useToast } from "@/hooks/use-toast";
import { skillsApi, Skill } from "@/services/skillsApi";

// Level badge styling
const levelStyles: Record<string, string> = {
  beginner: "bg-blue-100 text-blue-800",
  intermediate: "bg-green-100 text-green-800", 
  advanced: "bg-orange-100 text-orange-800",
  expert: "bg-red-100 text-red-800"
};

// Category color mapping
const categoryColors: Record<string, string> = {
  "Infrastructure": "bg-chart-1/10 text-chart-1",
  "Networking": "bg-chart-2/10 text-chart-2",
  "Security": "bg-chart-3/10 text-chart-3",
  "Hardware": "bg-chart-4/10 text-chart-4",
  "Development": "bg-chart-5/10 text-chart-5",
  "Data Management": "bg-primary/10 text-primary",
  "General": "bg-muted/50 text-muted-foreground"
};

export function SkillsManagement() {
  const { t } = useTranslation('skills');
  const [skills, setSkills] = useState<Skill[]>([]);
  const [filteredSkills, setFilteredSkills] = useState<Skill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [skillToDelete, setSkillToDelete] = useState<Skill | null>(null);
  const { toast } = useToast();

  const fetchSkills = async () => {
    try {
      setIsLoading(true);
      const response = await skillsApi.getAll();
      setSkills(response || []);
      setFilteredSkills(response || []);
    } catch (error: any) {
      toast({
        title: t('common.toast.error'),
        description: t('common.toast.fetch_failed'),
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSkills();
  }, []);

  // Filter skills based on search term
  useEffect(() => {
    if (!searchTerm) {
      setFilteredSkills(skills);
    } else {
      const filtered = skills.filter(skill =>
        skill.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        skill.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        skill.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredSkills(filtered);
    }
  }, [searchTerm, skills]);

  const handleAddSkill = () => {
    setEditingSkill(null);
    setIsModalOpen(true);
  };

  const handleEditSkill = (skill: Skill) => {
    setEditingSkill(skill);
    setIsModalOpen(true);
  };

  const handleSaveSkill = async () => {
    setIsModalOpen(false);
    await fetchSkills();
    toast({
      title: t('common.toast.success'),
      description: editingSkill ? t('common.toast.updated') : t('common.toast.created'),
    });
  };

  const handleDeleteSkill = (skill: Skill) => {
    setSkillToDelete(skill);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteSkill = async () => {
    if (!skillToDelete) return;
    
    try {
      await skillsApi.delete(skillToDelete.id);
      toast({
        title: t('common.toast.success'),
        description: t('common.toast.deleted', { name: skillToDelete.name }),
      });
      await fetchSkills();
    } catch (error: any) {
      toast({
        title: t('common.toast.error'),
        description: t('common.toast.delete_failed'),
        variant: "destructive"
      });
    } finally {
      setSkillToDelete(null);
      setIsDeleteModalOpen(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Loading skills...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <Card className="shadow-card border-0 bg-card">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-lg sm:text-xl font-semibold text-foreground flex items-center gap-2">
            <div className="p-2 rounded-lg bg-chart-3/10">
              <Wrench className="h-4 w-4 sm:h-5 sm:w-5 text-chart-3" />
            </div>
            Skills Management
          </CardTitle>
          <CardDescription>Manage available skills and their categories</CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 space-y-4">
          {/* Search and Add Skill */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search skills..." 
                className="pl-10 h-9 sm:h-10" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button 
              onClick={handleAddSkill}
              className="gradient-primary text-primary-foreground shadow-medium hover-lift flex items-center gap-2 w-full sm:w-auto"
            >
              <Plus className="h-4 w-4" />
              Add Skill
            </Button>
          </div>

          {/* Skills List */}
          <div className="space-y-3">
            {filteredSkills.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm ? "No skills found matching your search." : "No skills available."}
              </div>
            ) : (
              filteredSkills.map((skill) => (
                <div key={skill.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 border border-border/50 rounded-lg bg-muted/10 hover:bg-muted/20 transition-colors gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="w-10 h-10 bg-chart-3/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <Wrench className="h-4 w-4 text-chart-3" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-foreground text-sm sm:text-base">{skill.name}</p>
                        {!skill.isActive && (
                          <Badge variant="secondary" className="text-xs">Inactive</Badge>
                        )}
                      </div>
                      {skill.description && (
                        <p className="text-sm text-muted-foreground mb-2">{skill.description}</p>
                      )}
                      <div className="flex flex-wrap gap-2">
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${categoryColors[skill.category] || categoryColors.General}`}
                        >
                          {skill.category}
                        </Badge>
                        {skill.level && (
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${levelStyles[skill.level] || 'bg-muted text-muted-foreground'}`}
                          >
                            {skill.level}
                          </Badge>
                        )}
                        {skill.userCount > 0 && (
                          <Badge variant="outline" className="text-xs">
                            {skill.userCount} user{skill.userCount !== 1 ? 's' : ''}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          className="gap-2"
                          onClick={() => handleEditSkill(skill)}
                        >
                          <Edit className="h-4 w-4" />
                          Edit Skill
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="gap-2 text-destructive"
                          onClick={() => handleDeleteSkill(skill)}
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete Skill
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <AddEditSkillModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        skill={editingSkill}
        onSave={handleSaveSkill}
      />
      
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDeleteSkill}
        itemName={skillToDelete?.name}
        itemType="skill"
      />
    </div>
  );
}

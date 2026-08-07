
import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Wrench, Plus, Search, MoreHorizontal, Edit, Trash2, AlertCircle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AddEditSkillModal } from "./AddEditSkillModal";
import { DeleteConfirmationModal } from "@/shared/components";
import { useToast } from "@/hooks/use-toast";
import { skillsApi, Skill } from "@/services/api/skillsApi";
import { extractApiErrorMessage } from "@/utils/extractApiErrorMessage";
import { emitDataEvent, onDataEvent } from "@/lib/dataEvents";

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
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [skillToDelete, setSkillToDelete] = useState<Skill | null>(null);
  const { toast } = useToast();

  const fetchSkills = useCallback(async (signal?: AbortSignal) => {
    try {
      setIsLoading(true);
      setLoadError(null);
      const response = await skillsApi.getAll();
      if (signal?.aborted) return;
      setSkills(response || []);
      setFilteredSkills(response || []);
    } catch (error) {
      if (signal?.aborted) return;
      const msg = extractApiErrorMessage(error, t('common.toast.fetch_failed'));
      setLoadError(msg);
      toast({
        title: t('common.toast.error'),
        description: msg,
        variant: "destructive"
      });
    } finally {
      if (!signal?.aborted) setIsLoading(false);
    }
  }, [t, toast]);

  useEffect(() => {
    const controller = new AbortController();
    fetchSkills(controller.signal);
    const off = onDataEvent('skills:changed', () => fetchSkills(controller.signal));
    return () => {
      controller.abort();
      off();
    };
  }, [fetchSkills]);

  // Filter skills based on search term
  useEffect(() => {
    if (!searchTerm) {
      setFilteredSkills(skills);
    } else {
      const q = searchTerm.toLowerCase();
      setFilteredSkills(skills.filter(skill =>
        skill.name.toLowerCase().includes(q) ||
        skill.category.toLowerCase().includes(q) ||
        (skill.description?.toLowerCase().includes(q) ?? false)
      ));
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
    emitDataEvent('skills:changed');
    // Renaming a skill affects role skill labels
    emitDataEvent('roles:changed');
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
    if (!skillToDelete || isDeleting) return;
    setIsDeleting(true);
    try {
      await skillsApi.delete(skillToDelete.id);
      toast({
        title: t('common.toast.success'),
        description: t('common.toast.deleted', { name: skillToDelete.name }),
      });
      emitDataEvent('skills:changed');
      emitDataEvent('roles:changed');
      emitDataEvent('users:changed');
      await fetchSkills();
    } catch (error) {
      toast({
        title: t('common.toast.error'),
        description: extractApiErrorMessage(error, t('common.toast.delete_failed')),
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
      setSkillToDelete(null);
      setIsDeleteModalOpen(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">{t('common.loading')}</div>
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
            {t('common.managementTitle')}
          </CardTitle>
          <CardDescription>{t('common.managementDescription')}</CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 space-y-4">
          {/* Search and Add Skill */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('common.searchPlaceholder')}
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
              {t('common.addSkill')}
            </Button>
          </div>

          {/* Skills List */}
          <div className="space-y-3">
            {filteredSkills.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm ? t('common.noResultsSearch') : t('common.noSkills')}
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
                        <p className="list-row-title">{skill.name}</p>
                        {!skill.isActive && (
                          <Badge variant="secondary" className="text-xs">{t('common.inactive')}</Badge>
                        )}
                      </div>
                      {skill.description && (
                        <p className="list-row-subtitle mb-2">{skill.description}</p>
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
                            {skill.userCount === 1
                              ? t('common.userCount', { count: skill.userCount })
                              : t('common.userCountPlural', { count: skill.userCount })}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      title={t('common.editSkill')}
                      aria-label={t('common.editSkill')}
                      onClick={() => handleEditSkill(skill)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      title={t('common.deleteSkill')}
                      aria-label={t('common.deleteSkill')}
                      onClick={() => handleDeleteSkill(skill)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
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

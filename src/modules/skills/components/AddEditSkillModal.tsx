import { useState, useEffect } from "react";
import { useTranslation } from 'react-i18next';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { skillsApi, Skill, CreateSkillRequest, UpdateSkillRequest } from "@/services/skillsApi";

interface AddEditSkillModalProps {
  isOpen: boolean;
  onClose: () => void;
  skill?: Skill | null;
  onSave: () => void;  // Changed to just trigger refresh
}

const skillCategories = [
  "Infrastructure", 
  "Networking", 
  "Security", 
  "Hardware", 
  "Development", 
  "Data Management",
  "General"
];

const skillLevels = [
  "beginner",
  "intermediate", 
  "advanced",
  "expert"
];

export function AddEditSkillModal({
  isOpen,
  onClose,
  skill,
  onSave,
}: AddEditSkillModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [level, setLevel] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation('skills');

  // Reset form when modal opens/closes or skill changes
  useEffect(() => {
    if (isOpen) {
      setName(skill?.name || "");
      setDescription(skill?.description || "");
      setCategory(skill?.category || "");
      setLevel(skill?.level || "");
      setIsActive(skill?.isActive ?? true);
    } else {
      // Reset form when closing
      setName("");
      setDescription("");
      setCategory("");
      setLevel("");
      setIsActive(true);
    }
  }, [isOpen, skill]);

  const handleSave = async () => {
    if (!name.trim()) {
      toast({
        title: t('common.error'),
        description: t('common.error_name_required'),
        variant: "destructive"
      });
      return;
    }

    if (!category) {
      toast({
        title: t('common.error'), 
        description: t('common.error_category_required'),
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      if (skill) {
        // Update existing skill
        const updateData: UpdateSkillRequest = {
          name: name.trim(),
          description: description.trim() || undefined,
          category,
          level: level || undefined,
          isActive
        };
        await skillsApi.update(skill.id, updateData);
      } else {
        // Create new skill
        const createData: CreateSkillRequest = {
          name: name.trim(),
          description: description.trim() || undefined,
          category,
          level: level || undefined
        };
        await skillsApi.create(createData);
      }
      
      onSave();
      onClose();
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: t('common.update_failed', { action: skill ? t('common.editSkill') : t('common.addSkill') }),
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {skill ? t('common.editTitle') : t('common.addTitle')}
          </DialogTitle>
          <DialogDescription>
            {skill ? t('common.editDesc') : t('common.addDesc')}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">{t('common.name')} *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('common.namePlaceholder')}
              className="w-full"
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="category">{t('common.categoryLabel')} *</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder={t('common.select_category_placeholder') || t('common.categoryLabel')} />
              </SelectTrigger>
              <SelectContent>
                {skillCategories.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="level">{t('common.levelLabel')}</Label>
            <Select value={level} onValueChange={setLevel}>
              <SelectTrigger>
                <SelectValue placeholder={t('common.select_level_placeholder') || ''} />
              </SelectTrigger>
              <SelectContent>
                {skillLevels.map((lvl) => (
                  <SelectItem key={lvl} value={lvl}>
                    {lvl.charAt(0).toUpperCase() + lvl.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="description">{t('common.descriptionLabel')}</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('common.description_placeholder') || 'Brief description of the skill (optional)'}
              className="w-full min-h-[80px]"
              rows={3}
            />
          </div>

          {skill && (
            <div className="flex items-center space-x-2">
              <Switch
                id="active"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
              <Label htmlFor="active">{t('common.activeLabel')}</Label>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            {t('common.cancel')}
          </Button>
          <Button 
            onClick={handleSave}
            disabled={!name.trim() || !category || isLoading}
            className="gradient-primary text-primary-foreground"
          >
            {isLoading ? t('common.saving') : `${skill ? t('common.editSkill') : t('common.addSkill')}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
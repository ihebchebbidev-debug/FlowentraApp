import { useState } from "react";
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Check, Wrench, CalendarClock, ShoppingCart, Package, Users, BriefcaseBusiness, Shield, FilePlus2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { rolesApi } from "@/services/api/rolesApi";
import { permissionsApi } from "@/services/api/permissionsApi";
import { CreateRoleRequest } from "@/types/users";
import { broadcastPermissionChange } from "@/utils/permissionBroadcast";
import {
  ROLE_TEMPLATES,
  RoleTemplate,
  countTemplateModules,
  templateToPermissionPayload,
} from "@/config/roleTemplates";

interface CreateRoleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRoleCreated: () => void;
}

const TEMPLATE_ICONS: Record<string, React.ReactNode> = {
  technician: <Wrench className="h-4 w-4" />,
  planner: <CalendarClock className="h-4 w-4" />,
  salesperson: <ShoppingCart className="h-4 w-4" />,
  purchaser: <Package className="h-4 w-4" />,
  hr_manager: <Users className="h-4 w-4" />,
  manager: <BriefcaseBusiness className="h-4 w-4" />,
  admin: <Shield className="h-4 w-4" />,
};

export function CreateRoleModal({ open, onOpenChange, onRoleCreated }: CreateRoleModalProps) {
  const { t } = useTranslation('settings');

  // Template copy is translated; the config values are the English fallback.
  const templateName = (tpl: RoleTemplate) => t(`roles.templates.${tpl.id}.name`, tpl.name);
  const templateDescription = (tpl: RoleTemplate) =>
    t(`roles.templates.${tpl.id}.description`, tpl.description);
  const templateHighlights = (tpl: RoleTemplate): string[] => {
    const value = t(`roles.templates.${tpl.id}.highlights`, {
      returnObjects: true,
      defaultValue: tpl.highlights,
    }) as unknown;
    return Array.isArray(value) ? (value as string[]) : tpl.highlights;
  };
  const [formData, setFormData] = useState<CreateRoleRequest>({
    name: "",
    description: ""
  });
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const selectedTemplate: RoleTemplate | undefined = ROLE_TEMPLATES.find(
    tpl => tpl.id === selectedTemplateId
  );

  const selectTemplate = (tpl: RoleTemplate | null) => {
    if (!tpl) {
      setSelectedTemplateId(null);
      return;
    }
    setSelectedTemplateId(tpl.id);
    setFormData(prev => ({
      name: prev.name.trim() ? prev.name : templateName(tpl),
      description: prev.description?.trim() ? prev.description : templateDescription(tpl),
    }));
  };

  const resetForm = () => {
    setFormData({ name: "", description: "" });
    setSelectedTemplateId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast({
        title: t('roles.create.createFailedTitle'),
        description: t('roles.create.nameRequired'),
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      // Create the role
      const createdRole = await rolesApi.create({
        name: formData.name.trim(),
        description: formData.description?.trim() || undefined
      });

      // Apply permissions: template preset, or all permissions when starting blank
      try {
        if (selectedTemplate) {
          await permissionsApi.updateRolePermissions({
            roleId: createdRole.id,
            permissions: templateToPermissionPayload(selectedTemplate),
          });
        } else {
          await permissionsApi.grantAllPermissions(createdRole.id);
        }
        // Broadcast permission change to update all logged-in users
        broadcastPermissionChange();
      } catch (permError) {
        console.warn('Failed to apply role permissions:', permError);
        // Don't fail the whole operation if permissions grant fails
      }

      toast({
        title: t('roles.create.createSuccessTitle'),
        description: selectedTemplate
          ? t('roles.create.createdFromTemplate', { role: createdRole.name, template: templateName(selectedTemplate) })
          : t('roles.create.createSuccess')
      });

      resetForm();
      onRoleCreated();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: t('roles.create.createFailedTitle'),
        description: error?.response?.data?.message || t('roles.create.createFailed'),
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[860px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{t('roles.create.title')}</DialogTitle>
          <DialogDescription>
            {t('roles.create.templateHint')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 gap-4">
          <ScrollArea className="flex-1 min-h-0 pr-3">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{t('roles.create.templatePickerLabel')}</Label>
                <div className="grid gap-3 sm:grid-cols-2">
                  {ROLE_TEMPLATES.map(tpl => {
                    const active = tpl.id === selectedTemplateId;
                    return (
                      <button
                        key={tpl.id}
                        type="button"
                        onClick={() => selectTemplate(tpl)}
                        className={`text-left rounded-lg border p-3 transition-all ${
                          active
                            ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                            : 'border-border bg-background hover:bg-muted/50'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg shrink-0 ${active ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                            {TEMPLATE_ICONS[tpl.id]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">{templateName(tpl)}</span>
                              <Badge variant="outline" className="text-[10px]">
                                {t('roles.create.modulesBadge', { count: countTemplateModules(tpl) })}
                              </Badge>
                              {active && <Check className="h-4 w-4 text-primary ml-auto" />}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">{templateDescription(tpl)}</p>
                          </div>
                        </div>
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    onClick={() => selectTemplate(null)}
                    className={`text-left rounded-lg border p-3 transition-all ${
                      selectedTemplateId === null
                        ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                        : 'border-border bg-background hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg shrink-0 ${selectedTemplateId === null ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                        <FilePlus2 className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{t('roles.create.scratchTitle')}</span>
                          {selectedTemplateId === null && <Check className="h-4 w-4 text-primary ml-auto" />}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {t('roles.create.scratchDesc')}
                        </p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {selectedTemplate && (
                <div className="rounded-lg border bg-muted/30 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                    {t('roles.create.whatCanDo', { role: templateName(selectedTemplate) })}
                  </p>
                  <ul className="space-y-1">
                    {templateHighlights(selectedTemplate).map(h => (
                      <li key={h} className="flex items-start gap-2 text-xs text-muted-foreground">
                        <Check className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="name">{t('roles.create.nameLabel')}</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder={t('roles.create.namePlaceholder')}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">{t('roles.create.descriptionLabel')}</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder={t('roles.create.descriptionPlaceholder')}
                  className="min-h-[70px]"
                />
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="shrink-0">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
            >
              {t('roles.create.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="gradient-primary text-primary-foreground"
            >
              {isLoading
                ? t('roles.create.creating')
                : selectedTemplate
                  ? `Create ${selectedTemplate.name}`
                  : t('roles.create.create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

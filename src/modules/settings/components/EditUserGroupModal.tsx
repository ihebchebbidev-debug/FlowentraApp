import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { userGroupsApi, UserGroup } from "@/services/api/userGroupsApi";
import { extractApiErrorMessage } from "@/utils/extractApiErrorMessage";
import {
  buildUserGroupSchemas,
  zodErrorsToFieldMap,
  USER_GROUP_NAME_MAX,
  USER_GROUP_DESC_MAX,
  type UserGroupFieldErrors,
} from "./userGroupsValidation";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group: UserGroup | null;
  onUpdated: () => void;
}

export function EditUserGroupModal({ open, onOpenChange, group, onUpdated }: Props) {
  const { t } = useTranslation("settings");
  const [formData, setFormData] = useState({ name: "", description: "", isActive: true });
  const [errors, setErrors] = useState<UserGroupFieldErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (group) {
      setFormData({
        name: group.name,
        description: group.description || "",
        isActive: group.isActive,
      });
      setErrors({});
    }
  }, [group]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!group || isLoading) return;

    const { updateSchema } = buildUserGroupSchemas(t);
    const parsed = updateSchema.safeParse(formData);
    if (!parsed.success) {
      const fieldErrors = zodErrorsToFieldMap(parsed.error);
      setErrors(fieldErrors);
      toast({
        title: t("userGroups.edit.updateFailedTitle"),
        description: Object.values(fieldErrors)[0] ?? t("userGroups.validation.invalidForm"),
        variant: "destructive",
      });
      return;
    }

    setErrors({});
    setIsLoading(true);
    try {
      await userGroupsApi.update(group.id, {
        name: parsed.data.name,
        description: parsed.data.description,
        isActive: parsed.data.isActive,
      });
      toast({
        title: t("userGroups.edit.updateSuccessTitle"),
        description: t("userGroups.edit.updateSuccess"),
      });
      onUpdated();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: t("userGroups.edit.updateFailedTitle"),
        description: extractApiErrorMessage(error, t("userGroups.edit.updateFailed")),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!group) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t("userGroups.edit.title")}</DialogTitle>
          <DialogDescription>{t("userGroups.edit.desc")}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="ug-edit-name">{t("userGroups.edit.nameLabel")}</Label>
            <Input
              id="ug-edit-name"
              value={formData.name}
              maxLength={USER_GROUP_NAME_MAX}
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? "ug-edit-name-error" : undefined}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, name: e.target.value }));
                if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
              }}
              placeholder={t("userGroups.create.namePlaceholder")}
            />
            {errors.name && (
              <p id="ug-edit-name-error" role="alert" className="text-sm text-destructive">
                {errors.name}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="ug-edit-desc">{t("userGroups.edit.descriptionLabel")}</Label>
            <Textarea
              id="ug-edit-desc"
              value={formData.description}
              maxLength={USER_GROUP_DESC_MAX}
              aria-invalid={!!errors.description}
              aria-describedby={errors.description ? "ug-edit-desc-error" : undefined}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, description: e.target.value }));
                if (errors.description) setErrors((prev) => ({ ...prev, description: undefined }));
              }}
              placeholder={t("userGroups.create.descriptionPlaceholder")}
              className="min-h-[80px]"
            />
            <div className="flex justify-between">
              {errors.description ? (
                <p id="ug-edit-desc-error" role="alert" className="text-sm text-destructive">
                  {errors.description}
                </p>
              ) : (
                <span />
              )}
              <span className="text-xs text-muted-foreground">
                {formData.description.length}/{USER_GROUP_DESC_MAX}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="ug-edit-active">{t("userGroups.status.active")}</Label>
            <Switch
              id="ug-edit-active"
              checked={formData.isActive}
              onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, isActive: checked }))}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              {t("confirm.cancel")}
            </Button>
            <Button type="submit" disabled={isLoading} className="gradient-primary text-primary-foreground">
              {isLoading ? t("userGroups.edit.saving") : t("userGroups.edit.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

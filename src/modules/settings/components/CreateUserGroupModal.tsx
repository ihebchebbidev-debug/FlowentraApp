import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { userGroupsApi } from "@/services/api/userGroupsApi";
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
  onCreated: () => void;
}

export function CreateUserGroupModal({ open, onOpenChange, onCreated }: Props) {
  const { t } = useTranslation("settings");
  const [formData, setFormData] = useState({ name: "", description: "" });
  const [errors, setErrors] = useState<UserGroupFieldErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const reset = () => {
    setFormData({ name: "", description: "" });
    setErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    const { createSchema } = buildUserGroupSchemas(t);
    const parsed = createSchema.safeParse(formData);
    if (!parsed.success) {
      const fieldErrors = zodErrorsToFieldMap(parsed.error);
      setErrors(fieldErrors);
      toast({
        title: t("userGroups.create.createFailedTitle"),
        description: Object.values(fieldErrors)[0] ?? t("userGroups.validation.invalidForm"),
        variant: "destructive",
      });
      return;
    }

    setErrors({});
    setIsLoading(true);
    try {
      await userGroupsApi.create({
        name: parsed.data.name,
        description: parsed.data.description,
      });
      toast({
        title: t("userGroups.create.createSuccessTitle"),
        description: t("userGroups.create.createSuccess"),
      });
      reset();
      onCreated();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: t("userGroups.create.createFailedTitle"),
        description: extractApiErrorMessage(error, t("userGroups.create.createFailed")),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        onOpenChange(o);
      }}
    >
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t("userGroups.create.title")}</DialogTitle>
          <DialogDescription>{t("userGroups.create.desc")}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="ug-name">{t("userGroups.create.nameLabel")}</Label>
            <Input
              id="ug-name"
              value={formData.name}
              maxLength={USER_GROUP_NAME_MAX}
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? "ug-name-error" : undefined}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, name: e.target.value }));
                if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
              }}
              placeholder={t("userGroups.create.namePlaceholder")}
            />
            {errors.name && (
              <p id="ug-name-error" role="alert" className="text-sm text-destructive">
                {errors.name}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="ug-desc">{t("userGroups.create.descriptionLabel")}</Label>
            <Textarea
              id="ug-desc"
              value={formData.description}
              maxLength={USER_GROUP_DESC_MAX}
              aria-invalid={!!errors.description}
              aria-describedby={errors.description ? "ug-desc-error" : undefined}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, description: e.target.value }));
                if (errors.description) setErrors((prev) => ({ ...prev, description: undefined }));
              }}
              placeholder={t("userGroups.create.descriptionPlaceholder")}
              className="min-h-[80px]"
            />
            <div className="flex justify-between">
              {errors.description ? (
                <p id="ug-desc-error" role="alert" className="text-sm text-destructive">
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

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancel} disabled={isLoading}>
              {t("userGroups.create.cancel")}
            </Button>
            <Button type="submit" disabled={isLoading} className="gradient-primary text-primary-foreground">
              {isLoading ? t("userGroups.create.creating") : t("userGroups.create.create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

import { useState } from "react";
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { rolesApi } from "@/services/rolesApi";
import { permissionsApi } from "@/services/api/permissionsApi";
import { CreateRoleRequest } from "@/types/users";
import { broadcastPermissionChange } from "@/utils/permissionBroadcast";

interface CreateRoleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRoleCreated: () => void;
}

export function CreateRoleModal({ open, onOpenChange, onRoleCreated }: CreateRoleModalProps) {
  const { t } = useTranslation('settings');
  const [formData, setFormData] = useState<CreateRoleRequest>({
    name: "",
    description: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

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
      
      // Grant all permissions to the new role by default
      try {
        await permissionsApi.grantAllPermissions(createdRole.id);
        // Broadcast permission change to update all logged-in users
        broadcastPermissionChange();
      } catch (permError) {
        console.warn('Failed to grant default permissions:', permError);
        // Don't fail the whole operation if permissions grant fails
      }
      
      toast({
        title: t('roles.create.createSuccessTitle'),
        description: t('roles.create.createSuccess')
      });
      
      setFormData({ name: "", description: "" });
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
    setFormData({ name: "", description: "" });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
          <DialogTitle>{t('roles.create.title')}</DialogTitle>
          <DialogDescription>
            {t('roles.create.desc')}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
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
              className="min-h-[80px]"
            />
          </div>
          
            <DialogFooter>
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
              {isLoading ? t('roles.create.creating') : t('roles.create.create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
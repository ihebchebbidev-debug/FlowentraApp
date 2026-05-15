import { useState, useEffect } from "react";
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { rolesApi } from "@/services/rolesApi";
import { Role, UpdateRoleRequest } from "@/types/users";
import { RolePermissionsEditor } from "./RolePermissionsEditor";
import { Settings, Shield } from "lucide-react";

interface EditRoleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: Role | null;
  onRoleUpdated: () => void;
}

export function EditRoleModal({ open, onOpenChange, role, onRoleUpdated }: EditRoleModalProps) {
  const { t } = useTranslation('settings');
  const [formData, setFormData] = useState<UpdateRoleRequest>({
    name: "",
    description: "",
    isActive: true
  });
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  const { toast } = useToast();

  useEffect(() => {
    if (role) {
      setFormData({
        name: role.name,
        description: role.description || "",
        isActive: role.isActive
      });
      setActiveTab("general");
    }
  }, [role]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: t('roles.edit.updateFailedTitle') || t('roles.edit.updateFailed') || t('roles.edit.nameRequired'),
        description: t('roles.edit.nameRequired'),
        variant: "destructive"
      });
      return;
    }

    if (!role) return;

    setIsLoading(true);
    try {
      await rolesApi.update(role.id, {
        name: formData.name.trim(),
        description: formData.description?.trim() || undefined,
        isActive: formData.isActive
      });
      
      toast({
        title: t('roles.edit.updateSuccess') || 'Success',
        description: t('roles.edit.updateSuccess')
      });
      
      onRoleUpdated();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: t('roles.edit.updateFailed') || 'Error',
        description: error?.response?.data?.message || t('roles.edit.updateFailed'),
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (role) {
      setFormData({
        name: role.name,
        description: role.description || "",
        isActive: role.isActive
      });
    }
    onOpenChange(false);
  };

  if (!role) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] md:max-w-[900px] h-[85vh] max-h-[850px] overflow-hidden flex flex-col p-0">
        <DialogHeader className="p-6 pb-4 shrink-0">
          <DialogTitle>{t('roles.edit.title')}</DialogTitle>
          <DialogDescription>
            {t('roles.edit.desc')}
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden min-h-0">
          <div className="px-6 shrink-0">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="general" className="gap-2">
                <Settings className="h-4 w-4" />
                General
              </TabsTrigger>
              <TabsTrigger value="permissions" className="gap-2">
                <Shield className="h-4 w-4" />
                Permissions
              </TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="general" className="flex-1 overflow-auto p-6 pt-4 m-0">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t('roles.edit.nameLabel')}</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder={t('roles.edit.namePlaceholder')}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">{t('roles.edit.descriptionLabel')}</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder={t('roles.edit.descriptionPlaceholder')}
                  className="min-h-[80px]"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="isActive">{t('roles.status.active')}</Label>
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                />
              </div>
              
              <DialogFooter className="pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isLoading}
                >
                  {t('confirm.cancel') || 'Cancel'}
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="gradient-primary text-primary-foreground"
                >
                  {isLoading ? t('roles.edit.updating') : t('roles.edit.update')}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>
          
          <TabsContent value="permissions" className="flex-1 overflow-hidden m-0 min-h-0">
            <RolePermissionsEditor role={role} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

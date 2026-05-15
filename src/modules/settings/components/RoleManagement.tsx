
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Shield, Plus, Edit, Trash2, Users, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from 'react-i18next';
import { useNavigate } from "react-router-dom";
import { rolesApi, Role } from "@/services/rolesApi";
import { CreateRoleModal } from "./CreateRoleModal";
import { EditRoleModal } from "./EditRoleModal";
import { SkillAssignmentModal } from "./SkillAssignmentModal";

export function RoleManagement() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSkillModal, setShowSkillModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { t } = useTranslation('settings');

  const fetchRoles = async () => {
    try {
      setIsLoading(true);
      const response = await rolesApi.getAll();
      setRoles(response || []);
    } catch (error) {
      toast({
        title: t('application.errorTitle') || 'Error',
        description: t('roles.edit.updateFailed') || 'Failed to fetch roles',
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const handleEditRole = (role: Role) => {
    setSelectedRole(role);
    setShowEditModal(true);
  };

  const handleManageSkills = (role: Role) => {
    setSelectedRole(role);
    setShowSkillModal(true);
  };

  const handleDeleteRole = async (roleId: number, roleName: string) => {
    try {
      await rolesApi.delete(roleId);
      toast({
        title: "Success",
        description: `Role "${roleName}" deleted successfully`
      });
      fetchRoles();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.response?.data?.message || "Failed to delete role",
        variant: "destructive"
      });
    }
  };

  const handleRoleCreated = () => {
    fetchRoles();
  };

  const handleRoleUpdated = () => {
    fetchRoles();
  };

  const handleSkillAssigned = () => {
    fetchRoles();
  };

  if (isLoading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <Card className="shadow-card border-0 bg-card">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-center h-32">
              <div className="text-muted-foreground">Loading roles...</div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <Card className="shadow-card border-0 bg-card">
        <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-lg sm:text-xl font-semibold text-foreground flex items-center gap-2">
            <div className="p-2 rounded-lg bg-chart-1/10">
              <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-chart-1" />
            </div>
            {t('roles.managementTitle')}
          </CardTitle>
          <CardDescription>{t('roles.managementDesc')}</CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between gap-3">
            <Button 
              variant="outline"
              onClick={() => navigate('/dashboard/users')}
              className="flex items-center gap-2"
            >
              <Users className="h-4 w-4" />
              {t('roles.manageUsers')}
            </Button>
            <Button 
              className="gradient-primary text-primary-foreground shadow-medium hover-lift flex items-center gap-2"
              onClick={() => setShowCreateModal(true)}
            >
              <Plus className="h-4 w-4" />
              {t('roles.create.create')}
            </Button>
          </div>

          <div className="space-y-3">
            {roles.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {t('roles.table.noRolesPrompt')}
              </div>
            ) : (
              roles.map((role) => (
                <div key={role.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 border border-border/50 rounded-lg bg-muted/10 hover:bg-muted/20 transition-colors gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="w-10 h-10 bg-chart-1/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <Shield className="h-4 w-4 text-chart-1" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-foreground text-sm sm:text-base capitalize">{role.name}</p>
                        {!role.isActive && (
                          <span className="px-2 py-1 text-xs bg-destructive/10 text-destructive rounded-full">
                            {t('roles.status.inactive')}
                          </span>
                        )}
                      </div>
                      {role.description && (
                        <p className="text-sm text-muted-foreground mb-1">{role.description}</p>
                      )}
                      <p className="text-sm text-muted-foreground">{t('roles.assignedUsers', { count: role.userCount })}</p>
                    </div>
                  </div>
                   <div className="flex items-center justify-end gap-2">
                     <Button 
                       variant="ghost" 
                       size="sm" 
                       className="h-8 w-8 p-0"
                       onClick={() => handleManageSkills(role)}
                       title={t('roles.manageSkills')}
                     >
                       <Zap className="h-4 w-4" />
                     </Button>
                     <Button 
                       variant="ghost" 
                       size="sm" 
                       className="h-8 w-8 p-0"
                       onClick={() => handleEditRole(role)}
                     >
                       <Edit className="h-4 w-4" />
                     </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{t('roles.deleteConfirmTitle')}</AlertDialogTitle>
                            <AlertDialogDescription>
                              {t('roles.deleteConfirmDesc', { roleName: role.name })}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{t('confirm.cancel') || 'Cancel'}</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteRole(role.id, role.name)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              {t('roles.deleteAction')}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <CreateRoleModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onRoleCreated={handleRoleCreated}
      />

      <EditRoleModal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        role={selectedRole}
        onRoleUpdated={handleRoleUpdated}
      />

      <SkillAssignmentModal
        open={showSkillModal}
        onOpenChange={setShowSkillModal}
        role={selectedRole}
        onSkillAssigned={handleSkillAssigned}
      />
    </div>
  );
}

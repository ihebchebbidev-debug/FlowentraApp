import { useState, useEffect, useCallback, memo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Shield, Plus, Edit, Trash2, Users, Zap, AlertCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { rolesApi, Role } from "@/services/api/rolesApi";
import { CreateRoleModal } from "./CreateRoleModal";
import { EditRoleModal } from "./EditRoleModal";
import { SkillAssignmentModal } from "./SkillAssignmentModal";
import { extractApiErrorMessage } from "@/utils/extractApiErrorMessage";
import { emitDataEvent, onDataEvent } from "@/lib/dataEvents";

interface RoleRowProps {
  role: Role;
  isDeleting: boolean;
  onEdit: (role: Role) => void;
  onManageSkills: (role: Role) => void;
  onDelete: (role: Role) => void;
  t: (key: string, opts?: Record<string, unknown>) => string;
}

// Memoized row so unrelated parent state changes (e.g. modal toggles)
// don't re-render every role in the list.
const RoleRow = memo(function RoleRow({
  role,
  isDeleting,
  onEdit,
  onManageSkills,
  onDelete,
  t,
}: RoleRowProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 border border-border/50 rounded-lg bg-muted/10 hover:bg-muted/20 transition-colors gap-3">
      <div className="flex items-start gap-3 flex-1">
        <div className="w-10 h-10 bg-chart-1/10 rounded-full flex items-center justify-center flex-shrink-0">
          <Shield className="h-4 w-4 text-chart-1" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <p className="list-row-title capitalize">{role.name}</p>
            {!role.isActive && (
              <span className="px-2 py-1 text-xs bg-destructive/10 text-destructive rounded-full">
                {t("roles.status.inactive")}
              </span>
            )}
          </div>
          {role.description && (
            <p className="list-row-subtitle mb-1">{role.description}</p>
          )}
          <p className="text-px-10 text-muted-foreground">
            {t("roles.assignedUsers", { count: role.userCount })}
          </p>
        </div>
      </div>
      <div className="flex items-center justify-end gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => onManageSkills(role)}
          title={t("roles.manageSkills")}
        >
          <Zap className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => onEdit(role)}
        >
          <Edit className="h-4 w-4" />
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
              disabled={isDeleting}
            >
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("roles.deleteConfirmTitle")}</AlertDialogTitle>
              <AlertDialogDescription>
                {t("roles.deleteConfirmDesc", { roleName: role.name })}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>
                {t("confirm.cancel") || "Cancel"}
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => onDelete(role)}
                disabled={isDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t("roles.deleteAction")}
                  </span>
                ) : (
                  t("roles.deleteAction")
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
});

export function RoleManagement() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSkillModal, setShowSkillModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { t } = useTranslation("settings");

  const fetchRoles = useCallback(async (signal?: AbortSignal) => {
    try {
      setIsLoading(true);
      setLoadError(null);
      const response = await rolesApi.getAll();
      if (signal?.aborted) return;
      setRoles(response || []);
    } catch (error) {
      if (signal?.aborted) return;
      const msg = extractApiErrorMessage(
        error,
        t("roles.edit.updateFailed") || "Failed to fetch roles",
      );
      setLoadError(msg);
      toast({
        title: t("application.errorTitle") || "Error",
        description: msg,
        variant: "destructive",
      });
    } finally {
      if (!signal?.aborted) setIsLoading(false);
    }
  }, [t, toast]);

  useEffect(() => {
    const controller = new AbortController();
    fetchRoles(controller.signal);
    // Refetch when other modules signal a related change
    const off = onDataEvent("roles:changed", () => {
      fetchRoles(controller.signal);
    });
    return () => {
      controller.abort();
      off();
    };
  }, [fetchRoles]);

  const handleEditRole = useCallback((role: Role) => {
    setSelectedRole(role);
    setShowEditModal(true);
  }, []);

  const handleManageSkills = useCallback((role: Role) => {
    setSelectedRole(role);
    setShowSkillModal(true);
  }, []);

  const handleDeleteRole = useCallback(
    async (role: Role) => {
      if (deletingId != null) return;
      setDeletingId(role.id);
      try {
        await rolesApi.delete(role.id);
        toast({
          title: "Success",
          description: `Role "${role.name}" deleted successfully`,
        });
        // Deleting a role affects any user list showing role badges
        emitDataEvent("roles:changed");
        emitDataEvent("users:changed");
        await fetchRoles();
      } catch (error) {
        toast({
          title: "Error",
          description: extractApiErrorMessage(error, "Failed to delete role"),
          variant: "destructive",
        });
      } finally {
        setDeletingId(null);
      }
    },
    [deletingId, fetchRoles, toast],
  );

  const handleRoleCreated = useCallback(() => {
    emitDataEvent("roles:changed");
    fetchRoles();
  }, [fetchRoles]);

  const handleRoleUpdated = useCallback(() => {
    emitDataEvent("roles:changed");
    emitDataEvent("users:changed");
    fetchRoles();
  }, [fetchRoles]);

  const handleSkillAssigned = useCallback(() => {
    emitDataEvent("skills:changed");
    fetchRoles();
  }, [fetchRoles]);

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
            {t("roles.managementTitle")}
          </CardTitle>
          <CardDescription>{t("roles.managementDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between gap-3">
            <Button
              variant="outline"
              onClick={() => navigate("/dashboard/users")}
              className="flex items-center gap-2"
            >
              <Users className="h-4 w-4" />
              {t("roles.manageUsers")}
            </Button>
            <Button
              className="gradient-primary text-primary-foreground shadow-medium hover-lift flex items-center gap-2"
              onClick={() => setShowCreateModal(true)}
            >
              <Plus className="h-4 w-4" />
              {t("roles.create.create")}
            </Button>
          </div>

          {loadError && (
            <div
              role="alert"
              className="flex items-start gap-3 p-3 rounded-lg border border-destructive/40 bg-destructive/10 text-destructive"
            >
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">
                  {t("application.errorTitle") || "Error"}
                </p>
                <p className="text-sm opacity-90 break-words">{loadError}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="border-destructive/40 text-destructive hover:bg-destructive/20"
                onClick={() => fetchRoles()}
              >
                {t("retry") || "Retry"}
              </Button>
            </div>
          )}

          <div className="space-y-3">
            {roles.length === 0 && !loadError ? (
              <div className="text-center py-8 text-muted-foreground">
                {t("roles.table.noRolesPrompt")}
              </div>
            ) : (
              roles.map((role) => (
                <RoleRow
                  key={role.id}
                  role={role}
                  isDeleting={deletingId === role.id}
                  onEdit={handleEditRole}
                  onManageSkills={handleManageSkills}
                  onDelete={handleDeleteRole}
                  t={t}
                />
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

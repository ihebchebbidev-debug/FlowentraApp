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
import { UsersRound, Plus, Edit, Trash2, UserPlus, AlertCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { userGroupsApi, UserGroup } from "@/services/api/userGroupsApi";
import { CreateUserGroupModal } from "./CreateUserGroupModal";
import { EditUserGroupModal } from "./EditUserGroupModal";
import { GroupMembersModal } from "./GroupMembersModal";
import { extractApiErrorMessage } from "@/utils/extractApiErrorMessage";
import { emitDataEvent, onDataEvent } from "@/lib/dataEvents";

interface GroupRowProps {
  group: UserGroup;
  isDeleting: boolean;
  onEdit: (g: UserGroup) => void;
  onManageMembers: (g: UserGroup) => void;
  onDelete: (g: UserGroup) => void;
  t: (key: string, opts?: Record<string, unknown>) => string;
}

const GroupRow = memo(function GroupRow({
  group, isDeleting, onEdit, onManageMembers, onDelete, t,
}: GroupRowProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 border border-border/50 rounded-lg bg-muted/10 hover:bg-muted/20 transition-colors gap-3">
      <div className="flex items-start gap-3 flex-1">
        <div className="w-10 h-10 bg-chart-2/10 rounded-full flex items-center justify-center flex-shrink-0">
          <UsersRound className="h-4 w-4 text-chart-2" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-medium text-foreground text-sm sm:text-base capitalize">{group.name}</p>
            {!group.isActive && (
              <span className="px-2 py-1 text-xs bg-destructive/10 text-destructive rounded-full">
                {t("userGroups.status.inactive")}
              </span>
            )}
          </div>
          {group.description && (
            <p className="text-sm text-muted-foreground mb-1">{group.description}</p>
          )}
          <p className="text-sm text-muted-foreground">
            {t("userGroups.membersCount", { count: group.memberCount })}
          </p>
        </div>
      </div>
      <div className="flex items-center justify-end gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => onManageMembers(group)}
          title={t("userGroups.manageMembers")}
        >
          <UserPlus className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => onEdit(group)}>
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
              <AlertDialogTitle>{t("userGroups.delete.confirmTitle")}</AlertDialogTitle>
              <AlertDialogDescription>
                {t("userGroups.delete.confirmDesc", { name: group.name })}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>
                {t("confirm.cancel")}
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => onDelete(group)}
                disabled={isDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t("userGroups.delete.deleteAction")}
                  </span>
                ) : (
                  t("userGroups.delete.deleteAction")
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
});

export function UserGroupManagement() {
  const [groups, setGroups] = useState<UserGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [selected, setSelected] = useState<UserGroup | null>(null);
  const { toast } = useToast();
  const { t } = useTranslation("settings");

  const fetchGroups = useCallback(async (signal?: AbortSignal) => {
    try {
      setIsLoading(true);
      setLoadError(null);
      const data = await userGroupsApi.getAll();
      if (signal?.aborted) return;
      setGroups(data || []);
    } catch (error) {
      if (signal?.aborted) return;
      const msg = extractApiErrorMessage(error, "Failed to fetch user groups");
      setLoadError(msg);
      toast({
        title: t("application.errorTitle"),
        description: msg,
        variant: "destructive",
      });
    } finally {
      if (!signal?.aborted) setIsLoading(false);
    }
  }, [t, toast]);

  useEffect(() => {
    const controller = new AbortController();
    fetchGroups(controller.signal);
    const off = onDataEvent("userGroups:changed", () => {
      fetchGroups(controller.signal);
    });
    return () => {
      controller.abort();
      off();
    };
  }, [fetchGroups]);

  const handleEdit = useCallback((g: UserGroup) => { setSelected(g); setShowEdit(true); }, []);
  const handleManageMembers = useCallback((g: UserGroup) => { setSelected(g); setShowMembers(true); }, []);

  const handleDelete = useCallback(async (g: UserGroup) => {
    if (deletingId != null) return;
    setDeletingId(g.id);
    try {
      await userGroupsApi.delete(g.id);
      toast({
        title: t("userGroups.delete.deleteSuccessTitle"),
        description: t("userGroups.delete.deleteSuccess", { name: g.name }),
      });
      emitDataEvent("userGroups:changed");
      await fetchGroups();
    } catch (error) {
      toast({
        title: t("application.errorTitle"),
        description: extractApiErrorMessage(error, t("userGroups.delete.deleteFailed")),
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  }, [deletingId, fetchGroups, toast, t]);

  const handleCreated = useCallback(() => { emitDataEvent("userGroups:changed"); fetchGroups(); }, [fetchGroups]);
  const handleUpdated = useCallback(() => { emitDataEvent("userGroups:changed"); fetchGroups(); }, [fetchGroups]);
  const handleMembersChanged = useCallback(() => { emitDataEvent("userGroups:changed"); fetchGroups(); }, [fetchGroups]);

  if (isLoading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <Card className="shadow-card border-0 bg-card">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-center h-32">
              <div className="text-muted-foreground">{t("userGroups.loading")}</div>
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
            <div className="p-2 rounded-lg bg-chart-2/10">
              <UsersRound className="h-4 w-4 sm:h-5 sm:w-5 text-chart-2" />
            </div>
            {t("userGroups.managementTitle")}
          </CardTitle>
          <CardDescription>{t("userGroups.managementDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row justify-end gap-3">
            <Button
              className="gradient-primary text-primary-foreground shadow-medium hover-lift flex items-center gap-2"
              onClick={() => setShowCreate(true)}
            >
              <Plus className="h-4 w-4" />
              {t("userGroups.create.create")}
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
                  {t("application.errorTitle")}
                </p>
                <p className="text-sm opacity-90 break-words">{loadError}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="border-destructive/40 text-destructive hover:bg-destructive/20"
                onClick={() => fetchGroups()}
              >
                {t("retry")}
              </Button>
            </div>
          )}

          <div className="space-y-3">
            {groups.length === 0 && !loadError ? (
              <div className="text-center py-8 text-muted-foreground">
                {t("userGroups.table.noGroupsPrompt")}
              </div>
            ) : (
              groups.map((g) => (
                <GroupRow
                  key={g.id}
                  group={g}
                  isDeleting={deletingId === g.id}
                  onEdit={handleEdit}
                  onManageMembers={handleManageMembers}
                  onDelete={handleDelete}
                  t={t}
                />
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <CreateUserGroupModal
        open={showCreate}
        onOpenChange={setShowCreate}
        onCreated={handleCreated}
      />

      <EditUserGroupModal
        open={showEdit}
        onOpenChange={setShowEdit}
        group={selected}
        onUpdated={handleUpdated}
      />

      <GroupMembersModal
        open={showMembers}
        onOpenChange={setShowMembers}
        group={selected}
        onChanged={handleMembersChanged}
      />
    </div>
  );
}

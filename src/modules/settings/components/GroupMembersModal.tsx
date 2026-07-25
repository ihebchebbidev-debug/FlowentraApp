import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { userGroupsApi, UserGroup, UserGroupMember } from "@/services/api/userGroupsApi";
import { usersApi } from "@/services/api/usersApi";
import type { User } from "@/types/users";
import { Loader2, UsersRound, X } from "lucide-react";
import { extractApiErrorMessage } from "@/utils/extractApiErrorMessage";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group: UserGroup | null;
  onChanged: () => void;
}

export function GroupMembersModal({ open, onOpenChange, group, onChanged }: Props) {
  const { t } = useTranslation("settings");
  const { toast } = useToast();
  const [members, setMembers] = useState<UserGroupMember[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    if (!group) return;
    setLoading(true);
    try {
      const [m, u] = await Promise.all([
        userGroupsApi.getMembers(group.id),
        usersApi.getAll().catch(() => [] as User[]),
      ]);
      setMembers(m);
      const list = Array.isArray(u) ? u : (u as any)?.users ?? [];
      setUsers(list);
    } catch (error) {
      toast({
        title: t("application.errorTitle"),
        description: extractApiErrorMessage(error, t("userGroups.members.loadFailed")),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [group, t, toast]);

  useEffect(() => {
    if (open && group) {
      setSelectedUserId("");
      load();
    }
  }, [open, group, load]);

  const memberIds = new Set(members.map((m) => m.userId));
  const availableUsers = users.filter((u) => u.isActive && !memberIds.has(u.id));

  const handleAdd = async () => {
    if (!group) return;
    const parsedId = parseInt(selectedUserId, 10);
    if (!selectedUserId || Number.isNaN(parsedId) || parsedId <= 0) {
      toast({
        title: t("application.errorTitle"),
        description: t("userGroups.validation.selectUserRequired"),
        variant: "destructive",
      });
      return;
    }
    if (memberIds.has(parsedId)) {
      toast({
        title: t("application.errorTitle"),
        description: t("userGroups.validation.userAlreadyMember"),
        variant: "destructive",
      });
      return;
    }
    setAdding(true);
    try {
      await userGroupsApi.assignUsers(group.id, [parsedId]);
      toast({
        title: t("userGroups.members.addSuccessTitle"),
        description: t("userGroups.members.addSuccess"),
      });
      setSelectedUserId("");
      await load();
      onChanged();
    } catch (error) {
      toast({
        title: t("application.errorTitle"),
        description: extractApiErrorMessage(error, t("userGroups.members.addFailed")),
        variant: "destructive",
      });
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (userId: number) => {
    if (!group) return;
    try {
      await userGroupsApi.removeMember(group.id, userId);
      toast({
        title: t("userGroups.members.removeSuccessTitle"),
        description: t("userGroups.members.removeSuccess"),
      });
      await load();
      onChanged();
    } catch (error) {
      toast({
        title: t("application.errorTitle"),
        description: extractApiErrorMessage(error, t("userGroups.members.removeFailed")),
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold flex items-center gap-2">
            <UsersRound className="h-5 w-5 text-chart-2" />
            {t("userGroups.members.title")}
          </DialogTitle>
          <DialogDescription>
            {t("userGroups.members.desc", { name: group?.name ?? "" })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current members */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">
              {t("userGroups.members.current")} ({members.length})
            </Label>
            {loading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : members.length > 0 ? (
              <div className="space-y-2 max-h-64 overflow-auto">
                {members.map((m) => (
                  <div key={m.userId} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">
                        {m.firstName} {m.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{m.email}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemove(m.userId)}
                      className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                      title={t("userGroups.members.remove")}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground text-sm bg-muted/10 rounded-lg">
                {t("userGroups.members.empty")}
              </div>
            )}
          </div>

          {/* Add member */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">{t("userGroups.members.addLabel")}</Label>
            <div className="flex gap-2">
              <Select
                value={selectedUserId}
                onValueChange={setSelectedUserId}
                disabled={loading || availableUsers.length === 0}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue
                    placeholder={
                      loading
                        ? t("userGroups.members.loadingUsers")
                        : availableUsers.length === 0
                        ? t("userGroups.members.noAvailableUsers")
                        : t("userGroups.members.selectUser")
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {availableUsers.map((u) => (
                    <SelectItem key={u.id} value={u.id.toString()}>
                      <div className="flex flex-col">
                        <span>{u.firstName} {u.lastName}</span>
                        <span className="text-xs text-muted-foreground">{u.email}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={handleAdd}
                disabled={!selectedUserId || adding}
                className="gradient-primary text-primary-foreground"
              >
                {adding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t("userGroups.members.add")}
              </Button>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("confirm.close")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

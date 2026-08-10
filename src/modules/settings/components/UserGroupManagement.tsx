import { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CollapsibleSearch } from "@/components/ui/collapsible-search";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  UsersRound,
  Plus,
  Edit,
  Trash2,
  UserPlus,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { userGroupsApi, UserGroup } from "@/services/api/userGroupsApi";
import { CreateUserGroupModal } from "./CreateUserGroupModal";
import { EditUserGroupModal } from "./EditUserGroupModal";
import { GroupMembersModal } from "./GroupMembersModal";
import { extractApiErrorMessage } from "@/utils/extractApiErrorMessage";
import { emitDataEvent, onDataEvent } from "@/lib/dataEvents";
import { useTableSort } from "@/hooks/useTableSort";
import { SortableHeader } from "@/components/shared/SortableHeader";

export function UserGroupManagement() {
  const { t } = useTranslation("settings");
  const { toast } = useToast();
  const [groups, setGroups] = useState<UserGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [selected, setSelected] = useState<UserGroup | null>(null);
  const [groupToDelete, setGroupToDelete] = useState<UserGroup | null>(null);

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
    const off = onDataEvent("userGroups:changed", () => fetchGroups(controller.signal));
    return () => {
      controller.abort();
      off();
    };
  }, [fetchGroups]);

  const handleDelete = useCallback(async (g: UserGroup) => {
    if (deletingId != null) return;
    setDeletingId(g.id);
    try {
      await userGroupsApi.delete(g.id);
      toast({
        title: t("userGroups.delete.deleteSuccessTitle"),
        description: t("userGroups.delete.deleteSuccess", { name: g.name }),
      });
      setGroupToDelete(null);
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

  const filteredGroups = useMemo(() => {
    const q = searchTerm.toLowerCase();
    if (!q) return groups;
    return groups.filter((g) =>
      g.name.toLowerCase().includes(q) ||
      (g.description?.toLowerCase().includes(q) ?? false)
    );
  }, [groups, searchTerm]);

  const { sortKey, sortDirection, toggleSort, sortItems } = useTableSort<UserGroup>({
    name: (g) => g.name,
    description: (g) => g.description,
    members: (g) => g.memberCount,
    status: (g) => g.isActive ? 1 : 0,
    created: (g) => g.createdAt,
  });
  const sortedGroups = useMemo(() => sortItems(filteredGroups), [filteredGroups, sortItems]);

  return (
    <Card className="shadow-card border-0 bg-card">
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
          <UsersRound className="h-4 w-4 text-primary" />
          {t("userGroups.managementTitle")}
        </CardTitle>
        <CardDescription className="text-xs">{t("userGroups.managementDesc")}</CardDescription>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
        <div className="flex items-center justify-between gap-3 mb-4">
          <CollapsibleSearch
            placeholder={t("userGroups.searchGroups", { defaultValue: "Search groups..." })}
            value={searchTerm}
            onChange={setSearchTerm}
          />
          <Button
            onClick={() => setShowCreate(true)}
            size="sm"
            className="gradient-primary"
          >
            <Plus className="h-4 w-4 mr-2" />
            {t("userGroups.create.create")}
          </Button>
        </div>

        {loadError && (
          <div
            role="alert"
            className="flex items-start gap-3 p-3 mb-4 rounded-lg border border-destructive/40 bg-destructive/10 text-destructive"
          >
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{t("application.errorTitle")}</p>
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

        <div className="rounded-lg border border-border/50 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/20 border-b border-border/30 hover:bg-muted/20">
                <SortableHeader columnKey="name" sortKey={sortKey} sortDirection={sortDirection} onSort={toggleSort} className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t("userGroups.table.name", { defaultValue: "Name" })}</SortableHeader>
                <SortableHeader columnKey="description" sortKey={sortKey} sortDirection={sortDirection} onSort={toggleSort} className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t("userGroups.table.description", { defaultValue: "Description" })}</SortableHeader>
                <SortableHeader columnKey="members" sortKey={sortKey} sortDirection={sortDirection} onSort={toggleSort} className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t("userGroups.table.members", { defaultValue: "Members" })}</SortableHeader>
                <SortableHeader columnKey="status" sortKey={sortKey} sortDirection={sortDirection} onSort={toggleSort} className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t("userGroups.table.status", { defaultValue: "Status" })}</SortableHeader>
                <SortableHeader columnKey="created" sortKey={sortKey} sortDirection={sortDirection} onSort={toggleSort} className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t("userGroups.table.created", { defaultValue: "Created" })}</SortableHeader>
                <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wide text-right">{t("userGroups.table.actions", { defaultValue: "Actions" })}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {t("userGroups.loading")}
                    </span>
                  </TableCell>
                </TableRow>
              ) : filteredGroups.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    {searchTerm
                      ? t("userGroups.noGroupsMatchingSearch", { defaultValue: "No groups match your search." })
                      : t("userGroups.table.noGroupsPrompt")}
                  </TableCell>
                </TableRow>
              ) : (
                sortedGroups.map((group) => (
                  <TableRow key={group.id}>
                    <TableCell className="font-medium capitalize">{group.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                      {group.description || t("userGroups.table.noDescription", { defaultValue: "—" })}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {t("userGroups.membersCount", { count: group.memberCount })}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={group.isActive ? "default" : "destructive"}>
                        {group.isActive
                          ? t("userGroups.status.active", { defaultValue: "Active" })
                          : t("userGroups.status.inactive")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {group.createdAt ? format(new Date(group.createdAt), "MMM d, yyyy") : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <TooltipProvider delayDuration={200}>
                        <div className="flex items-center justify-end gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setSelected(group); setShowEdit(true); }} aria-label={t("userGroups.edit", { defaultValue: "Edit group" })}>
                                <Edit className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>{t("userGroups.edit", { defaultValue: "Edit group" })}</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setSelected(group); setShowMembers(true); }} aria-label={t("userGroups.manageMembers")}>
                                <UserPlus className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>{t("userGroups.manageMembers")}</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => setGroupToDelete(group)} aria-label={t("userGroups.delete.deleteAction")}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>{t("userGroups.delete.deleteAction")}</TooltipContent>
                          </Tooltip>
                        </div>
                      </TooltipProvider>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      <CreateUserGroupModal
        open={showCreate}
        onOpenChange={setShowCreate}
        onCreated={() => { emitDataEvent("userGroups:changed"); fetchGroups(); }}
      />

      <EditUserGroupModal
        open={showEdit}
        onOpenChange={setShowEdit}
        group={selected}
        onUpdated={() => { emitDataEvent("userGroups:changed"); fetchGroups(); }}
      />

      <GroupMembersModal
        open={showMembers}
        onOpenChange={setShowMembers}
        group={selected}
        onChanged={() => { emitDataEvent("userGroups:changed"); fetchGroups(); }}
      />

      <AlertDialog
        open={!!groupToDelete}
        onOpenChange={(open) => {
          if (!open && deletingId == null) setGroupToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("userGroups.delete.confirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("userGroups.delete.confirmDesc", { name: groupToDelete?.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingId != null}>
              {t("confirm.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                if (groupToDelete) handleDelete(groupToDelete);
              }}
              disabled={deletingId != null}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletingId != null ? (
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
    </Card>
  );
}

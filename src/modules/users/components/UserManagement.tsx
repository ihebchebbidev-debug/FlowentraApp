
import { useState, useEffect, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Users, Plus, Search, MoreHorizontal, Shield, Trash2, Edit, AlertCircle, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { usersApi, User as UserType } from "@/services/api/usersApi";
import { AddUserModal } from "./AddUserModal";
import { EditUserModal } from "./EditUserModal";
import { RoleAssignmentModal } from "./RoleAssignmentModal";
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
import { extractApiErrorMessage } from "@/utils/extractApiErrorMessage";
import { emitDataEvent, onDataEvent } from "@/lib/dataEvents";

export function UserManagement() {
  const { t } = useTranslation('settings');
  const { toast } = useToast();
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [userToDelete, setUserToDelete] = useState<UserType | null>(null);

  const loadUsers = useCallback(async (signal?: AbortSignal) => {
    try {
      setLoading(true);
      setLoadError(null);
      const response = await usersApi.getAll();
      if (signal?.aborted) return;
      setUsers(response.users || []);
    } catch (error) {
      if (signal?.aborted) return;
      const msg = extractApiErrorMessage(error, t('users.failedToLoad'));
      setLoadError(msg);
      toast({
        title: t('users.deleteErrorTitle'),
        description: msg,
        variant: "destructive",
      });
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [t, toast]);

  useEffect(() => {
    const controller = new AbortController();
    loadUsers(controller.signal);
    // Refresh when roles/skills/users change in other modules (e.g., role deleted → badges stale)
    const offUsers = onDataEvent('users:changed', () => loadUsers(controller.signal));
    const offRoles = onDataEvent('roles:changed', () => loadUsers(controller.signal));
    return () => {
      controller.abort();
      offUsers();
      offRoles();
    };
  }, [loadUsers]);

  const handleDeleteUser = useCallback(async (user: UserType) => {
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      await usersApi.delete(user.id);
      toast({
        title: t('users.deleteSuccessTitle'),
        description: t('users.deleteSuccess'),
      });
      setUserToDelete(null);
      emitDataEvent('users:changed');
      // Removing a user also affects role userCount displayed elsewhere
      emitDataEvent('roles:changed');
      await loadUsers();
    } catch (error) {
      toast({
        title: t('users.deleteErrorTitle'),
        description: extractApiErrorMessage(error, t('users.deleteFailed')),
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  }, [isDeleting, loadUsers, t, toast]);

  const handleChangeRole = useCallback((user: UserType) => {
    setSelectedUser(user);
    setShowRoleModal(true);
  }, []);

  const handleRoleAssigned = useCallback(() => {
    emitDataEvent('users:changed');
    emitDataEvent('roles:changed');
    loadUsers();
  }, [loadUsers]);

  // Memoize filtered/derived data so we don't re-filter+sort the whole
  // user list on every parent render (e.g., modal open/close, dropdown toggle).
  const filteredUsers = useMemo(() => {
    const q = searchTerm.toLowerCase();
    if (!q) return users;
    return users.filter(user =>
      user.firstName.toLowerCase().includes(q) ||
      user.lastName.toLowerCase().includes(q) ||
      user.email.toLowerCase().includes(q) ||
      (user.role?.toLowerCase().includes(q) ?? false)
    );
  }, [users, searchTerm]);

  const recentLogins = useMemo(() => {
    return [...filteredUsers]
      .filter(user => user.lastLoginAt)
      .sort((a, b) => new Date(b.lastLoginAt!).getTime() - new Date(a.lastLoginAt!).getTime())
      .slice(0, 6);
  }, [filteredUsers]);

  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <Card className="shadow-card border-0 bg-card">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-center h-32">
              <div className="animate-pulse text-muted-foreground">{t('users.loading')}</div>
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
              <Users className="h-4 w-4 sm:h-5 sm:w-5 text-chart-2" />
            </div>
            {t('users.managementTitle')}
          </CardTitle>
          <CardDescription>{t('users.managementDesc')}</CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 space-y-4">
          {/* Search and Add User */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('users.searchUsers')}
              className="pl-10 h-9 sm:h-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button
            className="gradient-primary text-white shadow-medium hover-lift flex items-center gap-2 w-full sm:w-auto"
            onClick={() => setShowAddModal(true)}
          >
            <Plus className="h-4 w-4" />
            {t('users.addUser')}
          </Button>
          </div>

          {loadError && (
            <div
              role="alert"
              className="flex items-start gap-3 p-3 rounded-lg border border-destructive/40 bg-destructive/10 text-destructive"
            >
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{t('users.deleteErrorTitle')}</p>
                <p className="text-sm opacity-90 break-words">{loadError}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="border-destructive/40 text-destructive hover:bg-destructive/20"
                onClick={() => loadUsers()}
              >
                {t('retry') || 'Retry'}
              </Button>
            </div>
          )}

          {/* Users List */}
          <div className="space-y-3">
            {filteredUsers.map((user) => (
              <div key={user.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 border border-border/50 rounded-lg bg-muted/10 hover:bg-muted/20 transition-colors gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-primary font-medium text-sm">{user.firstName.charAt(0)}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground text-sm sm:text-base">{user.firstName} {user.lastName}</p>
                    <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {t('users.table.created')}: {new Date(user.createdDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs capitalize">{user.role || t('users.noRole')}</Badge>
                    <Badge className={user.isActive ? "status-success" : "status-warning"}>
                      {user.isActive ? t('users.status.active') : t('users.status.inactive')}
                    </Badge>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        className="gap-2"
                        onClick={() => { setSelectedUser(user); setShowEditModal(true); }}
                      >
                        <Edit className="h-4 w-4" />
                        {t('users.editUser')}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="gap-2"
                        onClick={() => handleChangeRole(user)}
                      >
                        <Shield className="h-4 w-4" />
                        {t('users.changeRole')}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="gap-2 text-destructive"
                        onClick={() => setUserToDelete(user)}
                      >
                        <Trash2 className="h-4 w-4" />
                        {t('users.removeUser')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
            {filteredUsers.length === 0 && !loadError && (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm ? t('users.noUsersMatchingSearch') : t('users.noUsersFound')}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-card border-0 bg-card">
        <CardContent className="p-0 sm:p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('connectionLogs.table.user')}</TableHead>
                  <TableHead>{t('connectionLogs.table.role')}</TableHead>
                  <TableHead>{t('connectionLogs.table.time')}</TableHead>
                  <TableHead>{t('connectionLogs.table.ip')}</TableHead>
                  <TableHead>{t('connectionLogs.table.status')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentLogins.map((u) => (
                  <TableRow key={`login-${u.id}`} className="hover:bg-muted/20">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-primary text-xs font-medium">{u.firstName.charAt(0)}</span>
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-foreground">{u.firstName} {u.lastName}</div>
                          <div className="text-xs text-muted-foreground truncate">{u.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs capitalize">{u.role || t('connectionLogs.noRole')}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : t('connectionLogs.never')}
                    </TableCell>
                    <TableCell className="text-sm">N/A</TableCell>
                    <TableCell>
                      <Badge className={u.isActive ? 'status-success' : 'status-warning'}>
                        {u.isActive ? t('connectionLogs.status.active') : t('connectionLogs.status.inactive')}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {recentLogins.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      {t('connectionLogs.noRecentLogins')}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add User Modal */}
      <AddUserModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
        onUserAdded={() => { emitDataEvent('users:changed'); loadUsers(); }}
      />

      {/* Edit User Modal */}
      <EditUserModal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        user={selectedUser}
        onUserUpdated={() => { emitDataEvent('users:changed'); loadUsers(); }}
      />

      {/* Role Assignment Modal */}
      <RoleAssignmentModal
        open={showRoleModal}
        onOpenChange={setShowRoleModal}
        user={selectedUser}
        onRoleAssigned={handleRoleAssigned}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!userToDelete}
        onOpenChange={(open) => {
          if (!open && !isDeleting) setUserToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('users.deleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('users.deleteDesc', {
                firstName: userToDelete?.firstName,
                lastName: userToDelete?.lastName,
                email: userToDelete?.email,
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                // Prevent the dialog from closing before the request resolves
                e.preventDefault();
                if (userToDelete) handleDeleteUser(userToDelete);
              }}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t('delete')}
                </span>
              ) : (
                t('delete')
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

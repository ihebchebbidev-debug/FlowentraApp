
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Users, Plus, Search, MoreHorizontal, User, Shield, Trash2, Edit } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { usersApi, User as UserType } from "@/services/usersApi";
import { AddUserModal } from "./AddUserModal";
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

export function UserManagement() {
  const { t } = useTranslation('settings');
  const { toast } = useToast();
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [userToDelete, setUserToDelete] = useState<UserType | null>(null);

  // Load users on component mount
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await usersApi.getAll();
      setUsers(response.users || []);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (user: UserType) => {
    try {
      await usersApi.delete(user.id);
      toast({
        title: "Success",
        description: "User deleted successfully",
      });
      setUserToDelete(null);
      loadUsers(); // Refresh the list
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete user",
        variant: "destructive",
      });
    }
  };

  const handleChangeRole = (user: UserType) => {
    setSelectedUser(user);
    setShowRoleModal(true);
  };

  const handleRoleAssigned = () => {
    loadUsers(); // Refresh the list
  };

  // Filter users based on search term
  const filteredUsers = users.filter(user =>
    user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get recent logins (last 6 users sorted by login date)
  const recentLogins = [...filteredUsers]
    .filter(user => user.lastLoginAt)
    .sort((a, b) => new Date(b.lastLoginAt!).getTime() - new Date(a.lastLoginAt!).getTime())
    .slice(0, 6);

  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <Card className="shadow-card border-0 bg-card">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-center h-32">
              <div className="animate-pulse text-muted-foreground">Loading users...</div>
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
            User Management
          </CardTitle>
          <CardDescription>Manage users, their roles, and permissions</CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 space-y-4">
          {/* Search and Add User */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search users..." 
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
            Add User
          </Button>
          </div>

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
                      Created: {new Date(user.createdDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs capitalize">{user.role || 'No Role'}</Badge>
                    <Badge className={user.isActive ? "status-success" : "status-warning"}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem className="gap-2">
                        <Edit className="h-4 w-4" />
                        Edit User
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="gap-2"
                        onClick={() => handleChangeRole(user)}
                      >
                        <Shield className="h-4 w-4" />
                        Change Role
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="gap-2 text-destructive"
                        onClick={() => setUserToDelete(user)}
                      >
                        <Trash2 className="h-4 w-4" />
                        Remove User
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
            {filteredUsers.length === 0 && (
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
        onUserAdded={loadUsers}
      />

      {/* Role Assignment Modal */}
      <RoleAssignmentModal
        open={showRoleModal}
        onOpenChange={setShowRoleModal}
        user={selectedUser}
        onRoleAssigned={handleRoleAssigned}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {userToDelete?.firstName} {userToDelete?.lastName} 
              ({userToDelete?.email}). This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => userToDelete && handleDeleteUser(userToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

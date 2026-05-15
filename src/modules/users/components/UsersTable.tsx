import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Shield, MoreVertical } from "lucide-react";
import { User } from "@/types/users";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";
import { UserAvatar } from "@/components/ui/user-avatar";

interface MainAdminInfo {
  firstName: string;
  lastName: string;
  email: string;
  profilePictureUrl?: string;
  createdAt?: string;
}

interface UsersTableProps {
  users: User[];
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
  onManageRoles: (user: User) => void;
  canUpdate?: boolean;
  canDelete?: boolean;
  mainAdmin?: MainAdminInfo | null;
}

export function UsersTable({ users, onEdit, onDelete, onManageRoles, canUpdate = true, canDelete = true, mainAdmin }: UsersTableProps) {
  const { t } = useTranslation('settings');

  return (
    <div className="rounded-lg border border-border/50 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/20 border-b border-border/30 hover:bg-muted/20">
            <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t('users.table.name')}</TableHead>
            <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t('users.table.email')}</TableHead>
            
            <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t('users.table.role')}</TableHead>
            <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t('users.table.status')}</TableHead>
            <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t('users.table.created')}</TableHead>
            <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wide text-right">{t('users.table.actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {/* Main Admin User - always first, not editable/deletable */}
          {mainAdmin && (
            <TableRow className="bg-muted/10">
              <TableCell>
                <div className="flex items-center gap-2.5">
                  <UserAvatar
                    src={mainAdmin.profilePictureUrl}
                    name={`${mainAdmin.firstName} ${mainAdmin.lastName}`}
                    seed={0}
                    size="sm"
                  />
                  <span className="font-medium">{mainAdmin.firstName} {mainAdmin.lastName}</span>
                </div>
              </TableCell>
              <TableCell>{mainAdmin.email}</TableCell>
              <TableCell>
                <Badge className="capitalize text-xs px-2 py-0.5 font-medium bg-primary/15 text-primary border border-primary/30">
                  {t('users.table.mainAdminRole')}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant="default">
                  {t('users.status.active')}
                </Badge>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {mainAdmin.createdAt && !isNaN(new Date(mainAdmin.createdAt).getTime())
                  ? format(new Date(mainAdmin.createdAt), "MMM d, yyyy")
                  : '-'}
              </TableCell>
              <TableCell className="text-right">
                <span className="text-xs text-muted-foreground italic">—</span>
              </TableCell>
            </TableRow>
          )}

          {/* Regular users */}
          {users.length === 0 && !mainAdmin ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                {t('users.table.noUsers')}
              </TableCell>
            </TableRow>
          ) : (
            users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="flex items-center gap-2.5">
                    <UserAvatar
                      src={user.profilePictureUrl}
                      name={`${user.firstName} ${user.lastName}`}
                      seed={user.id}
                      size="sm"
                    />
                    <span>{user.firstName} {user.lastName}</span>
                  </div>
                </TableCell>
                <TableCell>{user.email}</TableCell>
                
                <TableCell>
                  {user.roles && user.roles.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {user.roles.map((role, index) => (
                        <Badge 
                          key={role.id} 
                          className="capitalize text-xs px-2 py-0.5 font-medium"
                          style={{
                            backgroundColor: `hsl(${(index * 60 + 200) % 360}, 70%, 90%)`,
                            color: `hsl(${(index * 60 + 200) % 360}, 70%, 30%)`,
                            border: `1px solid hsl(${(index * 60 + 200) % 360}, 70%, 70%)`
                          }}
                        >
                          {role.name}
                        </Badge>
                      ))}
                    </div>
                  ) : user.role ? (
                    <Badge className="capitalize text-xs px-2 py-0.5 font-medium bg-primary/10 text-primary border border-primary/30">
                      {user.role}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground text-sm italic">{t('users.table.noRole')}</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={user.isActive ? "default" : "destructive"}>
                    {user.isActive ? t('users.status.active') : t('users.status.inactive')}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {user.createdDate && !isNaN(new Date(user.createdDate).getTime()) 
                    ? format(new Date(user.createdDate), "MMM d, yyyy")
                    : '-'}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {canUpdate && (
                        <DropdownMenuItem onClick={() => onEdit(user)}>
                          <Edit className="h-4 w-4 mr-2" />
                          {t('users.table.edit')}
                        </DropdownMenuItem>
                      )}
                      {canUpdate && (
                        <DropdownMenuItem onClick={() => onManageRoles(user)}>
                          <Shield className="h-4 w-4 mr-2" />
                          {t('users.table.manageRoles')}
                        </DropdownMenuItem>
                      )}
                      {canDelete && (
                        <DropdownMenuItem 
                          onClick={() => onDelete(user)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          {t('users.table.delete')}
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

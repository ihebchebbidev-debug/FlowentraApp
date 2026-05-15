import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, MoreVertical } from "lucide-react";
import { Role } from "@/types/users";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { useTranslation } from 'react-i18next';

interface RolesTableProps {
  roles: Role[];
  onEdit: (role: Role) => void;
  onDelete: (role: Role) => void;
  canUpdate?: boolean;
  canDelete?: boolean;
}

export function RolesTable({ roles, onEdit, onDelete, canUpdate = true, canDelete = true }: RolesTableProps) {
  const { t } = useTranslation('settings');
  return (
    <div className="rounded-lg border border-border/50 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/20 border-b border-border/30 hover:bg-muted/20">
            <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t('roles.table.name')}</TableHead>
            <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t('roles.table.description')}</TableHead>
            <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t('roles.table.users')}</TableHead>
            <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t('roles.table.status')}</TableHead>
            <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t('roles.table.created')}</TableHead>
            <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wide text-right">{t('roles.table.actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {roles.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                {t('roles.table.noRoles')}
              </TableCell>
            </TableRow>
          ) : (
            roles.map((role) => (
              <TableRow key={role.id}>
                <TableCell className="font-medium capitalize">{role.name}</TableCell>
                <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                  {role.description || t('roles.table.noDescription')}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{t('roles.assignedUsers', { count: role.userCount })}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={role.isActive ? "default" : "destructive"}>
                    {role.isActive ? t('roles.status.active') : t('roles.status.inactive')}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {format(new Date(role.createdAt), "MMM d, yyyy")}
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
                        <DropdownMenuItem onClick={() => onEdit(role)}>
                          <Edit className="h-4 w-4 mr-2" />
                          {t('edit') || 'Edit'}
                        </DropdownMenuItem>
                      )}
                      {canDelete && (
                        <DropdownMenuItem 
                          onClick={() => onDelete(role)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          {t('delete') || 'Delete'}
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

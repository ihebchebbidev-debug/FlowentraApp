import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2 } from "lucide-react";
import { Role } from "@/types/users";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { format } from "date-fns";
import { useTranslation } from 'react-i18next';
import { useMemo } from 'react';
import { useTableSort } from '@/hooks/useTableSort';
import { SortableHeader } from '@/components/shared/SortableHeader';

interface RolesTableProps {
  roles: Role[];
  onEdit: (role: Role) => void;
  onDelete: (role: Role) => void;
  canUpdate?: boolean;
  canDelete?: boolean;
}

export function RolesTable({ roles, onEdit, onDelete, canUpdate = true, canDelete = true }: RolesTableProps) {
  const { t } = useTranslation('settings');
  const { sortKey, sortDirection, toggleSort, sortItems } = useTableSort<Role>({
    name: (r) => r.name,
    description: (r) => r.description,
    users: (r) => r.userCount,
    status: (r) => r.isActive ? 1 : 0,
    created: (r) => r.createdAt,
  });
  const sortedRoles = useMemo(() => sortItems(roles), [roles, sortItems]);
  return (
    <div className="rounded-lg border border-border/50 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/20 border-b border-border/30 hover:bg-muted/20">
            <SortableHeader columnKey="name" sortKey={sortKey} sortDirection={sortDirection} onSort={toggleSort} className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t('roles.table.name')}</SortableHeader>
            <SortableHeader columnKey="description" sortKey={sortKey} sortDirection={sortDirection} onSort={toggleSort} className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t('roles.table.description')}</SortableHeader>
            <SortableHeader columnKey="users" sortKey={sortKey} sortDirection={sortDirection} onSort={toggleSort} className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t('roles.table.users')}</SortableHeader>
            <SortableHeader columnKey="status" sortKey={sortKey} sortDirection={sortDirection} onSort={toggleSort} className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t('roles.table.status')}</SortableHeader>
            <SortableHeader columnKey="created" sortKey={sortKey} sortDirection={sortDirection} onSort={toggleSort} className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t('roles.table.created')}</SortableHeader>
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
            sortedRoles.map((role) => (
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
                  <TooltipProvider delayDuration={200}>
                    <div className="flex items-center justify-end gap-1">
                      {canUpdate && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(role)} aria-label={t('edit') || 'Edit'}>
                              <Edit className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>{t('edit') || 'Edit'}</TooltipContent>
                        </Tooltip>
                      )}
                      {canDelete && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => onDelete(role)} aria-label={t('delete') || 'Delete'}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>{t('delete') || 'Delete'}</TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </TooltipProvider>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

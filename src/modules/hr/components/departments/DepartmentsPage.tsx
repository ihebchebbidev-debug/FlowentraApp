import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { HRPageHeader } from '../HRPageHeader';
import { useDepartments } from '../../hooks/useDepartments';
import { useEmployees } from '../../hooks/useEmployees';
import { Building2, Plus, Pencil, Trash2, Users } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { HrPermissionButton } from '../common/HrPermissionButton';
import { useHrPermissionGuard } from '../../hooks/useHrPermissionGuard';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

export function DepartmentsPage() {
  const { t } = useTranslation('hr');
  const { toast } = useToast();
  const { departmentsQuery, createDepartment, updateDepartment, deleteDepartment } = useDepartments();
  const { employeesQuery } = useEmployees();
  const guardHr = useHrPermissionGuard();

  const [createOpen, setCreateOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formDescription, setFormDescription] = useState('');

  const departments = departmentsQuery.data ?? [];
  const employees = employeesQuery.data ?? [];

  const departmentNamesFromEmployees = useMemo(() => {
    const set = new Set<string>();
    for (const e of employees) {
      const dept = (e?.salaryConfig?.department ?? '').trim();
      if (dept) set.add(dept);
    }
    return Array.from(set);
  }, [employees]);

  const mergedDepartments = useMemo(() => {
    const byName = new Map<string, { id: number; name: string; code?: string; description?: string; employeeCount: number }>();
    for (const d of departments) {
      byName.set(d.name, {
        id: d.id,
        name: d.name,
        code: d.code,
        description: d.description,
        employeeCount: 0,
      });
    }
    for (const name of departmentNamesFromEmployees) {
      if (!byName.has(name)) {
        byName.set(name, { id: -1, name, employeeCount: 0 });
      }
    }
    const unassignedKey = 'Unassigned';
    if (!byName.has(unassignedKey)) byName.set(unassignedKey, { id: -2, name: unassignedKey, employeeCount: 0 });
    for (const e of employees) {
      const dept = (e?.salaryConfig?.department ?? '').trim();
      const key = !dept || dept === '—' ? unassignedKey : dept;
      if (!byName.has(key)) byName.set(key, { id: -1, name: key, employeeCount: 0 });
      byName.get(key)!.employeeCount++;
    }
    return Array.from(byName.values()).sort((a, b) => (a.name === unassignedKey ? 1 : b.name === unassignedKey ? -1 : a.name.localeCompare(b.name)));
  }, [departments, departmentNamesFromEmployees, employees]);

  const handleCreate = async () => {
    if (!guardHr('create')) return;
    if (!formName.trim()) {
      toast({ title: t('departments.nameRequired'), variant: 'destructive' });
      return;
    }
    try {
      await createDepartment.mutateAsync({ name: formName.trim(), code: formCode.trim() || undefined, description: formDescription.trim() || undefined });
      toast({ title: t('departments.created') });
      setCreateOpen(false);
      setFormName('');
      setFormCode('');
      setFormDescription('');
    } catch {
      toast({ title: t('departments.createError'), variant: 'destructive' });
    }
  };

  const handleEdit = async () => {
    if (!guardHr('update')) return;
    if (editId == null || !formName.trim()) return;
    try {
      await updateDepartment.mutateAsync({ id: editId, payload: { name: formName.trim(), code: formCode.trim() || undefined, description: formDescription.trim() || undefined } });
      toast({ title: t('departments.updated') });
      setEditId(null);
      setFormName('');
      setFormCode('');
      setFormDescription('');
    } catch {
      toast({ title: t('departments.updateError'), variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!guardHr('delete')) return;
    if (deleteId == null) return;
    try {
      await deleteDepartment.mutateAsync(deleteId);
      toast({ title: t('departments.deleted') });
      setDeleteId(null);
    } catch {
      toast({ title: t('departments.deleteError'), variant: 'destructive' });
    }
  };

  const openEdit = (d: { id: number; name: string; code?: string; description?: string }) => {
    if (d.id < 0) return;
    setEditId(d.id);
    setFormName(d.name);
    setFormCode(d.code ?? '');
    setFormDescription(d.description ?? '');
  };

  return (
    <div className="flex flex-col">
      <HRPageHeader
        title={t('departments.title')}
        subtitle={t('departments.subtitle')}
        icon={Building2}
        accentColor="chart-1"
        backTo={{ to: '/dashboard/hr', label: t('dashboard') }}
        actions={
          <div className="flex gap-2">
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <HrPermissionButton action="create" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  {t('departments.add')}
                </HrPermissionButton>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t('departments.add')}</DialogTitle>
                  <DialogDescription>{t('departments.addHint')}</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label>{t('departments.name')}</Label>
                    <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder={t('departments.namePlaceholder')} />
                  </div>
                  <div className="grid gap-2">
                    <Label>{t('departments.code')}</Label>
                    <Input value={formCode} onChange={(e) => setFormCode(e.target.value)} placeholder={t('departments.codePlaceholder')} />
                  </div>
                  <div className="grid gap-2">
                    <Label>{t('departments.description')}</Label>
                    <Input value={formDescription} onChange={(e) => setFormDescription(e.target.value)} placeholder={t('departments.descriptionPlaceholder')} />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setCreateOpen(false)}>
                    {t('cancel')}
                  </Button>
                  <HrPermissionButton action="create" onClick={handleCreate} disabled={createDepartment.isPending}>
                    {t('save')}
                  </HrPermissionButton>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      <div className="p-3 sm:p-4 lg:p-6">
        <Card className="shadow-card border-0 bg-card">
          <CardHeader>
            <CardTitle className="text-base">{t('departments.listTitle')}</CardTitle>
            <p className="text-sm text-muted-foreground">{t('departments.listHint')}</p>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table className="min-w-[400px]">
              <TableHeader>
                <TableRow>
                  <TableHead>{t('departments.name')}</TableHead>
                  <TableHead>{t('departments.code')}</TableHead>
                  <TableHead className="text-right">{t('departments.employees')}</TableHead>
                  <TableHead className="w-[100px]">{t('common.filters')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {departmentsQuery.isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-muted-foreground text-center py-8">
                      {t('loading')}
                    </TableCell>
                  </TableRow>
                ) : mergedDepartments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-muted-foreground text-center py-8">
                      {t('departments.empty')}
                    </TableCell>
                  </TableRow>
                ) : (
                  mergedDepartments.map((d) => (
                    <TableRow key={d.name}>
                      <TableCell className="font-medium">{d.name}</TableCell>
                      <TableCell>{d.code ?? '—'}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="secondary" className="gap-1">
                          <Users className="h-3 w-3" />
                          {d.employeeCount}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {d.id >= 0 && (
                          <div className="flex gap-1">
                            <HrPermissionButton action="update" variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(d)}>
                              <Pencil className="h-4 w-4" />
                            </HrPermissionButton>
                            <HrPermissionButton action="delete" variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(d.id)}>
                              <Trash2 className="h-4 w-4" />
                            </HrPermissionButton>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Edit dialog */}
      <Dialog open={editId != null} onOpenChange={(open) => !open && setEditId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('departments.edit')}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>{t('departments.name')}</Label>
              <Input value={formName} onChange={(e) => setFormName(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>{t('departments.code')}</Label>
              <Input value={formCode} onChange={(e) => setFormCode(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>{t('departments.description')}</Label>
              <Input value={formDescription} onChange={(e) => setFormDescription(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditId(null)}>
              {t('cancel')}
            </Button>
            <HrPermissionButton action="update" onClick={handleEdit} disabled={updateDepartment.isPending}>
              {t('save')}
            </HrPermissionButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={deleteId != null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('departments.deleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('departments.deleteHint')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t('departments.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

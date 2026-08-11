import { useMemo, useState } from 'react';
import { useTableSort } from '@/hooks/useTableSort';
import { SortableHeader } from '@/components/shared/SortableHeader';
import { SortMenu } from '@/components/shared/SortMenu';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Edit, Trash2, Copy, Eye, CheckCircle, Archive, RotateCcw, FileText, Share2, Globe, GlobeLock } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
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
import { DynamicForm, FormStatus, STATUS_COLORS } from '../types';
import { useDeleteDynamicForm, useDuplicateDynamicForm, useChangeFormStatus, useTogglePublicSharing } from '../hooks/useDynamicForms';
import { usePermissions } from '@/hooks/usePermissions.tsx';
import { useActionLogger } from '@/hooks/useActionLogger';
import { format } from 'date-fns';

interface FormsTableProps {
  forms: DynamicForm[];
  isLoading?: boolean;
}

export function FormsTable({ forms, isLoading }: FormsTableProps) {
  const { t, i18n } = useTranslation('dynamic-forms');
  const navigate = useNavigate();
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const { isMainAdmin, hasPermission } = usePermissions();
  const { logButtonClick } = useActionLogger('DynamicForms');
  const { toast } = useToast();
  
  const deleteMutation = useDeleteDynamicForm();
  const duplicateMutation = useDuplicateDynamicForm();
  const statusMutation = useChangeFormStatus();
  const publicMutation = useTogglePublicSharing();
  
  // Permission checks
  const canView = isMainAdmin || hasPermission('dynamic_forms', 'read');
  const canEdit = isMainAdmin || hasPermission('dynamic_forms', 'update');
  const canDelete = isMainAdmin || hasPermission('dynamic_forms', 'delete');
  const canCreate = isMainAdmin || hasPermission('dynamic_forms', 'create'); // For duplicate
  
  const isEnglish = i18n.language === 'en';
  const { sortKey, sortDirection, toggleSort, sortItems } = useTableSort<DynamicForm>({
    name: (f) => isEnglish ? f.name_en : f.name_fr,
    status: (f) => f.status,
    fields: (f) => f.fields.length,
    updated: (f) => f.updated_at || f.created_at,
  });
  const sortedForms = useMemo(() => sortItems(forms), [forms, sortItems]);
  
  const handleEdit = (id: number) => {
    if (!canEdit) return;
    logButtonClick('Edit Form', { entityType: 'DynamicForm', entityId: id });
    navigate(`/dashboard/settings/dynamic-forms/${id}/edit`);
  };
  
  const handlePreview = (id: number) => {
    logButtonClick('Preview Form', { entityType: 'DynamicForm', entityId: id });
    navigate(`/dashboard/settings/dynamic-forms/${id}/preview`);
  };
  
  const handleViewResponses = (id: number) => {
    logButtonClick('View Responses', { entityType: 'DynamicForm', entityId: id });
    navigate(`/dashboard/settings/dynamic-forms/${id}/responses`);
  };
  
  const handleDelete = async () => {
    if (deleteId && canDelete) {
      await deleteMutation.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };
  
  const handleDuplicate = async (id: number) => {
    if (!canCreate) return;
    await duplicateMutation.mutateAsync(id);
  };
  
  const handleStatusChange = async (id: number, status: FormStatus) => {
    if (!canEdit) return;
    await statusMutation.mutateAsync({ id, status });
  };
  
  // Generate a URL-friendly slug from the form name
  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
      .substring(0, 100); // Limit length
  };

  const handleTogglePublic = async (form: DynamicForm) => {
    if (!canEdit) return;
    if (form.status !== 'released') {
      toast({
        title: t('sharing.requires_release'),
        variant: 'destructive',
      });
      return;
    }
    
    // When making public, generate a slug from the form name
    const newIsPublic = !form.is_public;
    const publicSlug = newIsPublic ? (form.public_slug || generateSlug(form.name_en)) : undefined;
    
    await publicMutation.mutateAsync({ 
      id: form.id, 
      isPublic: newIsPublic,
      publicSlug 
    });
  };
  
  const handleShare = (form: DynamicForm) => {
    if (!form.is_public || !form.public_slug) return;
    // Include current language and theme in the shared link
    const currentLang = i18n.language === 'fr' ? 'fr' : 'en';
    const currentTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    const publicUrl = `${window.location.origin}/public/forms/${form.public_slug}?lang=${currentLang}&theme=${currentTheme}`;
    navigator.clipboard.writeText(publicUrl);
    toast({
      title: t('sharing.link_copied'),
      description: publicUrl,
    });
    logButtonClick('Share Form', { entityType: 'DynamicForm', entityId: form.id });
  };
  
  const getShareTooltip = (form: DynamicForm) => {
    if (form.status !== 'released') {
      return t('sharing.not_released');
    }
    if (!form.is_public) {
      return t('sharing.not_public');
    }
    return t('table.share');
  };
  
  const getStatusBadge = (form: DynamicForm) => {
    // Show public badge if form is public and released
    if (form.is_public && form.status === 'released') {
      return (
        <div className="flex items-center gap-1.5">
          <Badge className={STATUS_COLORS[form.status]}>
            {t(`status.${form.status}`)}
          </Badge>
          <Badge className="bg-primary/10 text-primary">
            {t('status.public')}
          </Badge>
        </div>
      );
    }
    return (
      <Badge className={STATUS_COLORS[form.status]}>
        {t(`status.${form.status}`)}
      </Badge>
    );
  };

  const iconBtn = (
    key: string,
    label: string,
    Icon: React.ComponentType<{ className?: string }>,
    onClick: () => void,
    destructive = false,
  ) => (
    <TooltipProvider key={key} delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={`h-8 w-8 ${destructive ? 'text-destructive hover:text-destructive hover:bg-destructive/10' : ''}`}
            onClick={(e) => { e.stopPropagation(); onClick(); }}
            aria-label={label}
          >
            <Icon className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>{label}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  const renderRowActions = (form: DynamicForm) => {
    const items: React.ReactNode[] = [];
    if (canView) items.push(iconBtn(`prev-${form.id}`, t('actions.preview'), Eye, () => handlePreview(form.id)));
    if (canEdit) items.push(iconBtn(`edit-${form.id}`, t('actions.edit'), Edit, () => handleEdit(form.id)));
    if (canCreate) items.push(iconBtn(`dup-${form.id}`, t('actions.duplicate'), Copy, () => handleDuplicate(form.id)));
    if (canView) items.push(iconBtn(`resp-${form.id}`, t('actions.view_responses'), FileText, () => handleViewResponses(form.id)));
    if (canEdit) {
      if (form.status === 'draft') items.push(iconBtn(`rel-${form.id}`, t('actions.release'), CheckCircle, () => handleStatusChange(form.id, 'released')));
      if (form.status === 'released') {
        items.push(iconBtn(
          `pub-${form.id}`,
          form.is_public ? t('actions.make_private') : t('actions.make_public'),
          form.is_public ? GlobeLock : Globe,
          () => handleTogglePublic(form),
        ));
        items.push(iconBtn(`arc-${form.id}`, t('actions.archive'), Archive, () => handleStatusChange(form.id, 'archived')));
      }
      if (form.status === 'archived') {
        items.push(iconBtn(`res-${form.id}`, t('actions.restore'), RotateCcw, () => handleStatusChange(form.id, 'draft')));
        // Restoring straight back to Released keeps a previously shared form usable
        // instead of forcing a draft round-trip that orphans distributed links.
        items.push(iconBtn(`resrel-${form.id}`, t('actions.restore_released'), CheckCircle, () => handleStatusChange(form.id, 'released')));
      }
    }
    if (canDelete) items.push(iconBtn(`del-${form.id}`, t('actions.delete'), Trash2, () => setDeleteId(form.id), true));
    return items;
  };


  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-pulse text-muted-foreground">{t('table.loading')}</div>
      </div>
    );
  }
  
  if (forms.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-1">{t('table.no_forms')}</h3>
        <p className="text-sm text-muted-foreground">{t('table.no_forms_desc')}</p>
      </div>
    );
  }
  
  return (
    <>
      {/* Mobile Cards */}
      <div className="md:hidden flex justify-end px-4 pt-3">
        <SortMenu
          options={[
            { key: 'name', label: t('table.name') },
            { key: 'status', label: t('table.status') },
            { key: 'fields', label: t('table.fields') },
            { key: 'updated', label: t('table.updated') },
          ]}
          sortKey={sortKey}
          sortDirection={sortDirection}
          onSort={toggleSort}
        />
      </div>
      <div className="md:hidden divide-y divide-border/50">
        {sortedForms.map((form) => {
          const name = isEnglish ? form.name_en : form.name_fr;
          const description = isEnglish ? form.description_en : form.description_fr;
          const updatedDate = form.updated_at
            ? format(new Date(form.updated_at), 'MMM d, yyyy')
            : format(new Date(form.created_at), 'MMM d, yyyy');
          return (
            <div
              key={form.id}
              className="p-4 hover:bg-muted/30 transition-colors cursor-pointer active:bg-muted/50"
              onClick={() => handlePreview(form.id)}
            >
              {/* Header row: icon + title + status badge */}
              <div className="flex items-start gap-3 mb-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <FileText className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="list-row-title leading-snug line-clamp-2 flex-1">{name}</p>
                    {getStatusBadge(form)}
                  </div>
                  {description && (
                    <p className="list-row-subtitle mt-1 line-clamp-2">{description}</p>
                  )}
                </div>
              </div>

              {/* Stats row */}
              <div className="flex items-center gap-4 mb-3 pl-12">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">{form.fields.length}</span>
                  <span>{t('table.fields')}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span>{updatedDate}</span>
                </div>
              </div>

              {/* Footer: share + actions */}
              <div className="flex items-center justify-between pl-12" onClick={e => e.stopPropagation()}>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`h-8 gap-1.5 text-xs ${form.is_public && form.status === 'released' ? 'text-primary' : 'text-muted-foreground/40'}`}
                        onClick={() => handleShare(form)}
                        disabled={!form.is_public || form.status !== 'released'}
                      >
                        <Share2 className="h-3.5 w-3.5" />
                        {t('table.share')}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>{getShareTooltip(form)}</p></TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <div className="flex items-center gap-0.5">
                  {renderRowActions(form)}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <SortableHeader columnKey="name" sortKey={sortKey} sortDirection={sortDirection} onSort={toggleSort} className="w-[300px]">{t('table.name')}</SortableHeader>
              <SortableHeader columnKey="status" sortKey={sortKey} sortDirection={sortDirection} onSort={toggleSort}>{t('table.status')}</SortableHeader>
              <SortableHeader columnKey="fields" sortKey={sortKey} sortDirection={sortDirection} onSort={toggleSort} align="center">{t('table.fields')}</SortableHeader>
              <SortableHeader columnKey="updated" sortKey={sortKey} sortDirection={sortDirection} onSort={toggleSort}>{t('table.updated')}</SortableHeader>
              <TableHead className="w-[60px] text-center">{t('table.share')}</TableHead>
              <TableHead className="w-[70px]">{t('table.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedForms.map((form) => (
              <TableRow key={form.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handlePreview(form.id)}>
                <TableCell>
                  <div>
                    <div className="font-medium">
                      {isEnglish ? form.name_en : form.name_fr}
                    </div>
                    {(isEnglish ? form.description_en : form.description_fr) && (
                      <div className="text-sm text-muted-foreground truncate max-w-[280px]">
                        {isEnglish ? form.description_en : form.description_fr}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  {getStatusBadge(form)}
                </TableCell>
                <TableCell className="text-center">
                  {form.fields.length}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {form.updated_at 
                    ? format(new Date(form.updated_at), 'MMM d, yyyy')
                    : format(new Date(form.created_at), 'MMM d, yyyy')
                  }
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()} className="text-center">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={`h-8 w-8 ${form.is_public && form.status === 'released' ? 'text-primary hover:text-primary/80' : 'text-muted-foreground cursor-not-allowed'}`}
                          onClick={() => handleShare(form)}
                          disabled={!form.is_public || form.status !== 'released'}
                        >
                          <Share2 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{getShareTooltip(form)}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-0.5">
                    {renderRowActions(form)}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('delete.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('delete.message')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t('actions.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MoreHorizontal, Edit, Trash2, Copy, Eye, CheckCircle, Archive, RotateCcw, FileText, Share2, Globe, GlobeLock } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[300px]">{t('table.name')}</TableHead>
              <TableHead>{t('table.status')}</TableHead>
              <TableHead className="text-center">{t('table.fields')}</TableHead>
              <TableHead>{t('table.updated')}</TableHead>
              <TableHead className="w-[60px] text-center">{t('table.share')}</TableHead>
              <TableHead className="w-[70px]">{t('table.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {forms.map((form) => (
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
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {/* Preview - always available if can view */}
                      {canView && (
                        <DropdownMenuItem onClick={() => handlePreview(form.id)}>
                          <Eye className="h-4 w-4 mr-2" />
                          {t('actions.preview')}
                        </DropdownMenuItem>
                      )}
                      
                      {/* Edit - requires update permission */}
                      {canEdit && (
                        <DropdownMenuItem onClick={() => handleEdit(form.id)}>
                          <Edit className="h-4 w-4 mr-2" />
                          {t('actions.edit')}
                        </DropdownMenuItem>
                      )}
                      
                      {/* Duplicate - requires create permission */}
                      {canCreate && (
                        <DropdownMenuItem onClick={() => handleDuplicate(form.id)}>
                          <Copy className="h-4 w-4 mr-2" />
                          {t('actions.duplicate')}
                        </DropdownMenuItem>
                      )}
                      
                      {/* View Responses - requires read permission */}
                      {canView && (
                        <DropdownMenuItem onClick={() => handleViewResponses(form.id)}>
                          <FileText className="h-4 w-4 mr-2" />
                          {t('actions.view_responses')}
                        </DropdownMenuItem>
                      )}
                      
                      {/* Status changes - requires update permission */}
                      {canEdit && (
                        <>
                          <DropdownMenuSeparator />
                          
                          {form.status === 'draft' && (
                            <DropdownMenuItem onClick={() => handleStatusChange(form.id, 'released')}>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              {t('actions.release')}
                            </DropdownMenuItem>
                          )}
                          {form.status === 'released' && (
                            <>
                              <DropdownMenuItem onClick={() => handleTogglePublic(form)}>
                                {form.is_public ? (
                                  <>
                                    <GlobeLock className="h-4 w-4 mr-2" />
                                    {t('actions.make_private')}
                                  </>
                                ) : (
                                  <>
                                    <Globe className="h-4 w-4 mr-2" />
                                    {t('actions.make_public')}
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleStatusChange(form.id, 'archived')}>
                                <Archive className="h-4 w-4 mr-2" />
                                {t('actions.archive')}
                              </DropdownMenuItem>
                            </>
                          )}
                          {form.status === 'archived' && (
                            <DropdownMenuItem onClick={() => handleStatusChange(form.id, 'draft')}>
                              <RotateCcw className="h-4 w-4 mr-2" />
                              {t('actions.restore')}
                            </DropdownMenuItem>
                          )}
                        </>
                      )}
                      
                      {/* Delete - requires delete permission */}
                      {canDelete && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => setDeleteId(form.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            {t('actions.delete')}
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
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

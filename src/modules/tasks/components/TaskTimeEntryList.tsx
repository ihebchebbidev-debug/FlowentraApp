import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit, Trash2, Clock, DollarSign, User, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { taskTimeEntryApi } from '@/services/api/taskTimeEntryApi';
import type { TaskTimeEntry } from '@/modules/tasks/types/timeTracking';
import { formatDuration } from '@/modules/tasks/types/timeTracking';

interface TaskTimeEntryListProps {
  entries: TaskTimeEntry[];
  onEdit: (entry: TaskTimeEntry) => void;
  onDelete: () => void;
  onRefresh: () => void;
}

export function TaskTimeEntryList({
  entries,
  onEdit,
  onDelete,
  onRefresh,
}: TaskTimeEntryListProps) {
  const { t, i18n } = useTranslation('tasks');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!deletingId) return;

    setIsDeleting(true);
    try {
      await taskTimeEntryApi.deleteTimeEntry(parseInt(deletingId, 10));
      toast.success(t('timeTracking.toast.entryDeleted'));
      setDeletingId(null);
      onDelete();
    } catch (error) {
      console.error('Failed to delete time entry:', error);
      toast.error(t('timeTracking.toast.deleteError'));
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat(i18n.language === 'fr' ? 'fr-FR' : 'en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  const getApprovalStatusColor = (status: string): string => {
    switch (status) {
      case 'approved':
        return 'bg-success/10 text-success border-success/20';
      case 'rejected':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      default:
        return 'bg-warning/10 text-warning border-warning/20';
    }
  };

  const getWorkTypeColor = (type: string): string => {
    switch (type) {
      case 'work':
        return 'bg-primary/10 text-primary';
      case 'break':
        return 'bg-muted text-muted-foreground';
      case 'meeting':
        return 'bg-accent text-accent-foreground';
      case 'review':
        return 'bg-warning/10 text-warning';
      case 'travel':
        return 'bg-secondary text-secondary-foreground';
      default:
        return 'bg-secondary text-secondary-foreground';
    }
  };

  return (
    <>
      <div className="space-y-2">
        {entries.map((entry) => (
          <div
            key={entry.id}
            className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border border-border/50 hover:border-border transition-colors"
          >
            {/* Time Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className={getWorkTypeColor(entry.workType)}>
                  {t(`timeTracking.workTypes.${entry.workType}`)}
                </Badge>
                <Badge variant="outline" className={getApprovalStatusColor(entry.approvalStatus)}>
                  {t(`timeTracking.approvalStatus.${entry.approvalStatus}`)}
                </Badge>
                {entry.isBillable && (
                  <Badge variant="outline" className="bg-success/10 text-success">
                    <DollarSign className="h-3 w-3 mr-1" />
                    {t('timeTracking.billable')}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-4 mt-1.5 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDate(entry.startTime)}
                  {entry.endTime && ` - ${formatDate(entry.endTime)}`}
                </span>
                {entry.userName && (
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {entry.userName}
                  </span>
                )}
              </div>
              {entry.description && (
                <p className="text-sm text-foreground mt-1 truncate">
                  {entry.description}
                </p>
              )}
            </div>

            {/* Duration */}
            <div className="text-right shrink-0">
              <p className="text-lg font-semibold">{formatDuration(entry.duration)}</p>
              {entry.totalCost && entry.totalCost > 0 && (
                <p className="text-xs text-muted-foreground">
                  {entry.totalCost.toLocaleString(i18n.language === 'fr' ? 'fr-TN' : 'en-US', {
                    style: 'currency',
                    currency: 'TND',
                  })}
                </p>
              )}
            </div>

            {/* Actions */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(entry)}>
                  <Edit className="h-4 w-4 mr-2" />
                  {t('common.edit')}
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => setDeletingId(entry.id)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {t('common.delete')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('timeTracking.deleteConfirm.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('timeTracking.deleteConfirm.description')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

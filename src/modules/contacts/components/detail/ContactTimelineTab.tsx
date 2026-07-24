import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Activity,
  FileText,
  ShoppingCart,
  ClipboardList,
  Truck,
  Wrench,
  StickyNote,
  Pencil,
  Trash2,
  CircleDot,
  ArrowRight,
  Plus,
  Loader2,
  Clock,
  UserCog,
  type LucideIcon,
} from 'lucide-react';
import { formatDistanceToNow, parseISO, format } from 'date-fns';
import { fr as frLocale, enUS as enLocale } from 'date-fns/locale';
import { useContactActivity, ContactActivityDto } from '../../hooks/useContactActivity';

interface Note {
  id: number;
  note: string;
  createdDate?: string;
  createdBy?: string;
  createdByName?: string;
}

interface Props {
  contactId: number;
  notes: Note[];
  notesLoading: boolean;
  isCreatingNote: boolean;
  isDeletingNote: boolean;
  deletingNoteId: number | null;
  onAddNote: () => void;
  onEditNote: (note: Note) => void;
  onDeleteNote: (noteId: number) => void;
}

const TYPE_META: Record<string, { icon: LucideIcon; color: string }> = {
  offer_created:                { icon: FileText,      color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/40' },
  offer_status_changed:         { icon: FileText,      color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/40' },
  sale_created:                 { icon: ShoppingCart,  color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40' },
  sale_status_changed:          { icon: ShoppingCart,  color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40' },
  service_order_created:        { icon: ClipboardList, color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40' },
  service_order_status_changed: { icon: ClipboardList, color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40' },
  dispatch_created:             { icon: Truck,         color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/40' },
  dispatch_status_changed:      { icon: Truck,         color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/40' },
  installation_created:         { icon: Wrench,        color: 'text-cyan-600 bg-cyan-50 dark:bg-cyan-950/40' },
  installation_completed:       { icon: Wrench,        color: 'text-cyan-600 bg-cyan-50 dark:bg-cyan-950/40' },
  contact_updated:              { icon: UserCog,       color: 'text-slate-600 bg-slate-100 dark:bg-slate-800/60' },
};

function pathFor(entityType?: string | null, entityId?: number | null): string | null {
  if (!entityType || !entityId) return null;
  switch (entityType) {
    case 'Offer':        return `/dashboard/offers/${entityId}`;
    case 'Sale':         return `/dashboard/sales/${entityId}`;
    case 'ServiceOrder': return `/dashboard/field/service-orders/${entityId}`;
    case 'Dispatch':     return `/dashboard/field/dispatches/${entityId}`;
    case 'Installation': return `/dashboard/field/installations/${entityId}`;
    default:             return null;
  }
}

function parseMetadata(meta?: string | null): Record<string, any> | null {
  if (!meta) return null;
  try { return JSON.parse(meta); } catch { return null; }
}

function useStatusLabel() {
  const { t } = useTranslation();
  return (status?: string | null) => {
    if (!status) return '';
    const candidates = [
      `offers:status.${status}`,
      `sales:status.${status}`,
      `field:serviceOrders.status.${status}`,
      `field:dispatches.status.${status}`,
      `field:installations.status.${status}`,
    ];
    for (const key of candidates) {
      const v = t(key, { defaultValue: '' });
      if (v && v !== key) return v;
    }
    return status.replace(/_/g, ' ');
  };
}

type TimelineItem =
  | { kind: 'note'; id: number; at: Date; note: Note }
  | { kind: 'activity'; id: number; at: Date; activity: ContactActivityDto };

function ActivityBody({
  activity,
  onOpen,
  statusLabel,
  t,
}: {
  activity: ContactActivityDto;
  onOpen: (p: string) => void;
  statusLabel: (s?: string | null) => string;
  t: (k: string, o?: any) => string;
}) {
  const md = parseMetadata(activity.metadata);
  const label = t(`activity.types.${activity.type}`, { defaultValue: activity.type.replace(/_/g, ' ') });
  const number = md?.number as string | undefined;
  const title = md?.title as string | undefined;
  const oldStatus = md?.oldStatus as string | undefined;
  const newStatus = md?.status as string | undefined;
  const isStatusChange = activity.type.endsWith('_status_changed');
  const isContactUpdate = activity.type === 'contact_updated';
  const changes: Array<{ field: string; oldValue?: string | null; newValue?: string | null }> =
    Array.isArray(md?.changes) ? md!.changes : [];
  const path = pathFor(activity.relatedEntityType, activity.relatedEntityId ?? undefined);

  return (
    <>
      <div className="flex items-center gap-2 flex-wrap">
        <span className="font-medium text-sm">{label}</span>
        {number && (path ? (
          <button
            type="button"
            onClick={() => onOpen(path)}
            className="text-px-11 px-1.5 py-0.5 rounded border border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 hover:underline transition font-mono"
            title={t('activity.view', 'View')}
          >
            {number}
          </button>
        ) : (
          <Badge variant="outline" className="text-px-10 px-1.5 py-0 font-mono">{number}</Badge>
        ))}
        {isStatusChange && (oldStatus || newStatus) && (
          <span className="inline-flex items-center gap-1 text-px-11">
            {oldStatus && (
              <Badge variant="outline" className="px-1.5 py-0 capitalize text-muted-foreground">
                {statusLabel(oldStatus)}
              </Badge>
            )}
            <ArrowRight className="h-3 w-3 text-muted-foreground" />
            {newStatus && (
              <Badge variant="secondary" className="px-1.5 py-0 capitalize">
                {statusLabel(newStatus)}
              </Badge>
            )}
          </span>
        )}
        {!isStatusChange && newStatus && (
          <Badge variant="secondary" className="text-px-10 px-1.5 py-0 capitalize">
            {statusLabel(newStatus)}
          </Badge>
        )}
      </div>
      {isStatusChange && (oldStatus || newStatus) && (
        <p className="text-xs text-muted-foreground mt-0.5">
          {t('activity.statusChangeDetail', {
            defaultValue: 'Status changed from {{from}} to {{to}}',
            from: statusLabel(oldStatus) || '—',
            to: statusLabel(newStatus) || '—',
          })}
        </p>
      )}
      {isContactUpdate && changes.length > 0 && (
        <ul className="mt-1 space-y-0.5">
          {changes.map((c, idx) => {
            const fieldLabel = t(`activity.fields.${c.field}`, { defaultValue: c.field });
            const oldV = c.oldValue == null || c.oldValue === '' ? '—' : c.oldValue;
            const newV = c.newValue == null || c.newValue === '' ? '—' : c.newValue;
            return (
              <li key={idx} className="text-xs text-muted-foreground flex items-center gap-1 flex-wrap">
                <span className="font-medium text-foreground/80">{fieldLabel}:</span>
                <span className="line-through opacity-70 break-all">{oldV}</span>
                <ArrowRight className="h-3 w-3 shrink-0" />
                <span className="text-foreground break-all">{newV}</span>
              </li>
            );
          })}
        </ul>
      )}
      {!isStatusChange && !isContactUpdate && (title || activity.description) && (
        <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2 break-words">
          {title || activity.description}
        </p>
      )}
      {path && (
        <button
          type="button"
          onClick={() => onOpen(path)}
          className="text-xs text-primary hover:underline mt-1"
        >
          {t('activity.view', 'View')}
        </button>
      )}
    </>
  );
}

export function ContactTimelineTab({
  contactId,
  notes,
  notesLoading,
  isCreatingNote,
  isDeletingNote,
  deletingNoteId,
  onAddNote,
  onEditNote,
  onDeleteNote,
}: Props) {
  const { t, i18n } = useTranslation('contacts');
  const navigate = useNavigate();
  const { activities, isLoading: activitiesLoading } = useContactActivity(contactId);
  const locale = i18n.language?.startsWith('fr') ? frLocale : enLocale;
  const statusLabel = useStatusLabel();

  const items = useMemo<TimelineItem[]>(() => {
    const noteItems: TimelineItem[] = notes.map((n) => ({
      kind: 'note',
      id: n.id,
      at: n.createdDate ? new Date(n.createdDate) : new Date(0),
      note: n,
    }));
    // Skip note_* activity entries — the actual editable note above is the source of truth.
    const actItems: TimelineItem[] = activities
      .filter((a) => !a.type.startsWith('note_'))
      .map((a) => ({
        kind: 'activity',
        id: a.id,
        at: a.createdAt ? parseISO(a.createdAt) : new Date(0),
        activity: a,
      }));
    return [...noteItems, ...actItems].sort((a, b) => b.at.getTime() - a.at.getTime());
  }, [notes, activities]);

  const isLoading = notesLoading || activitiesLoading;
  const relative = (d: Date) => {
    try { return formatDistanceToNow(d, { addSuffix: true, locale }); } catch { return ''; }
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3 flex-row items-center justify-between space-y-0">
        <CardTitle className="text-lg flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          {t('timeline.title', 'Timeline')}
        </CardTitle>
        <Button size="sm" onClick={onAddNote} disabled={isCreatingNote}>
          {isCreatingNote ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Plus className="h-4 w-4 mr-2" />
          )}
          {t('timeline.addNote', 'Add note')}
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="h-9 w-9 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12">
            <Activity className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">{t('timeline.empty', 'No activity or notes yet')}</p>
          </div>
        ) : (
          <div className="divide-y">
            {items.map((item) => {
              if (item.kind === 'note') {
                const n = item.note;
                return (
                  <div key={`n-${n.id}`} className="group flex gap-3 py-3">
                    <div className="shrink-0 rounded-full p-2 h-9 w-9 flex items-center justify-center text-slate-600 bg-slate-100 dark:bg-slate-800/60">
                      <StickyNote className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0 relative">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{t('timeline.note', 'Note')}</span>
                      </div>
                      <p className="text-sm mt-1 whitespace-pre-wrap break-words pr-16">{n.note}</p>
                      <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2 flex-wrap">
                        <Clock className="h-3 w-3" />
                        <span>{n.createdDate ? format(new Date(n.createdDate), 'PPP HH:mm') : '-'}</span>
                        <span>• {relative(item.at)}</span>
                        {n.createdByName && <span>• {n.createdByName}</span>}
                      </div>
                      <div className="absolute top-0 right-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => onEditNote(n)}
                          className="p-1.5 rounded-md hover:bg-primary/10 text-primary transition-colors"
                          aria-label="Edit note"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => onDeleteNote(n.id)}
                          disabled={isDeletingNote && deletingNoteId === n.id}
                          className="p-1.5 rounded-md hover:bg-destructive/10 text-destructive transition-colors disabled:opacity-50"
                          aria-label="Delete note"
                        >
                          {isDeletingNote && deletingNoteId === n.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              }
              const a = item.activity;
              const meta = TYPE_META[a.type] ?? { icon: CircleDot, color: 'text-muted-foreground bg-muted' };
              const Icon = meta.icon;
              return (
                <div key={`a-${a.id}`} className="flex gap-3 py-3">
                  <div className={`shrink-0 rounded-full p-2 h-9 w-9 flex items-center justify-center ${meta.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <ActivityBody activity={a} onOpen={(p) => navigate(p)} statusLabel={statusLabel} t={t} />
                    <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                      <span>{relative(item.at)}</span>
                      {a.createdBy && <span>• {a.createdBy}</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

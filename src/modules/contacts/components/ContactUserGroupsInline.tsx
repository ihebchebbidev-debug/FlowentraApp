import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { invalidateContactVisibility } from '@/services/contactVisibility';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, X } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { contactsApi } from '@/services/api/contactsApi';
import { useUserGroupsList } from './UserGroupsPicker';

type Group = { id: number; name: string };

// Per-contact cache + inflight dedup so N rows sharing the same contact fetch once.
const cache = new Map<number, Group[]>();
const inflight = new Map<number, Promise<Group[]>>();

async function loadGroups(contactId: number): Promise<Group[]> {
  if (cache.has(contactId)) return cache.get(contactId)!;
  if (inflight.has(contactId)) return inflight.get(contactId)!;
  const p = (async () => {
    try {
      const c: any = await contactsApi.getById(contactId);
      const g: Group[] = Array.isArray(c?.userGroups) ? c.userGroups : [];
      cache.set(contactId, g);
      return g;
    } catch {
      cache.set(contactId, []);
      return [];
    } finally {
      inflight.delete(contactId);
    }
  })();
  inflight.set(contactId, p);
  return p;
}

export function invalidateContactUserGroupsCache(contactId?: number) {
  if (contactId == null) { cache.clear(); return; }
  cache.delete(contactId);
}

function setCache(contactId: number, groups: Group[]) {
  cache.set(contactId, groups);
  // Notify all mounted instances so every module reflects the change.
  window.dispatchEvent(
    new CustomEvent('contact-user-groups-changed', { detail: { contactId, groups } }),
  );
}

export interface ContactUserGroupsInlineProps {
  /** Preferred: pass the already-loaded groups (from the contact object). */
  groups?: Group[] | null;
  /** Fallback: lazily fetch the contact and read its groups. */
  contactId?: number | string | null;
  /** "compact" = badges only, no label. "labeled" = "User groups: ..." row. */
  variant?: 'compact' | 'labeled';
  /** Max badges to render before overflow "+N". */
  max?: number;
  className?: string;
  /** Show inline edit affordance to update the contact's groups. */
  editable?: boolean;
  /** Called after a successful save, with the new groups. */
  onChange?: (groups: Group[]) => void;
}

/**
 * Displays a contact's assigned user groups as badges, or a translated
 * "Not specified" fallback when the contact has none. Used across offers,
 * sales, service orders, deals and dispatches to surface CRM group context
 * from the linked contact. Optional in every consumer — if no groups exist
 * the fallback is shown, never a broken UI.
 */
export function ContactUserGroupsInline({
  groups,
  contactId,
  variant = 'compact',
  max = 3,
  className = '',
  editable = false,
  onChange,
}: ContactUserGroupsInlineProps) {
  const { t } = useTranslation('contacts');
  const [resolved, setResolved] = useState<Group[] | null>(groups ?? null);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const { data: allGroups = [] } = useUserGroupsList();

  const idNum = useMemo(() => {
    if (contactId == null || contactId === '') return null;
    const n = typeof contactId === 'string' ? parseInt(contactId, 10) : contactId;
    return Number.isFinite(n) && n > 0 ? (n as number) : null;
  }, [contactId]);

  useEffect(() => {
    if (groups && !idNum) { setResolved(groups); return; }
    // If we have a contactId, prefer cache/live fetch so external updates propagate.
    if (idNum != null) {
      if (cache.has(idNum)) { setResolved(cache.get(idNum)!); return; }
      let cancelled = false;
      loadGroups(idNum).then((g) => { if (!cancelled) setResolved(g); });
      return () => { cancelled = true; };
    }
    if (groups) setResolved(groups);
  }, [groups, idNum]);

  // Cross-component sync: when any instance saves, refresh siblings.
  useEffect(() => {
    if (idNum == null) return;
    let cancelled = false;
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ contactId: number; groups: Group[] }>).detail;
      if (!detail || detail.contactId !== idNum || cancelled) return;
      setResolved(detail.groups);
    };
    window.addEventListener('contact-user-groups-changed', handler as EventListener);
    return () => {
      cancelled = true;
      window.removeEventListener('contact-user-groups-changed', handler as EventListener);
    };
  }, [idNum]);

  const list = resolved ?? [];
  const isEmpty = list.length === 0;
  const shown = list.slice(0, max);
  const overflow = list.length - shown.length;
  const canEdit = editable && idNum != null;

  const assignedIds = useMemo(() => new Set(list.map((g) => g.id)), [list]);
  const availableOptions = useMemo(
    () => allGroups.filter((g) => !assignedIds.has(g.id)),
    [allGroups, assignedIds],
  );

  const addGroup = async (group: { id: number; name: string }) => {
    if (idNum == null || assignedIds.has(group.id)) return;
    const previous = list;
    const optimistic = [...previous, { id: group.id, name: group.name }];
    setCache(idNum, optimistic);
    setResolved(optimistic);
    onChange?.(optimistic);
    setQuery('');
    setOpen(false);
    setSaving(true);
    try {
      await contactsApi.assignUserGroup(idNum, group.id);
      invalidateContactUserGroupsCache(idNum);
      invalidateContactVisibility();
      const fresh = await loadGroups(idNum);
      setCache(idNum, fresh);
      setResolved(fresh);
      onChange?.(fresh);
      toast.success(t('userGroups.toasts.assigned'));
    } catch {
      setCache(idNum, previous);
      setResolved(previous);
      onChange?.(previous);
      toast.error(t('userGroups.toasts.error'));
    } finally {
      setSaving(false);
    }
  };

  const removeGroup = async (groupId: number) => {
    if (idNum == null) return;
    const previous = list;
    const optimistic = previous.filter((g) => g.id !== groupId);
    setCache(idNum, optimistic);
    setResolved(optimistic);
    onChange?.(optimistic);
    setSaving(true);
    try {
      await contactsApi.removeUserGroup(idNum, groupId);
      invalidateContactUserGroupsCache(idNum);
      invalidateContactVisibility();
      const fresh = await loadGroups(idNum);
      setCache(idNum, fresh);
      setResolved(fresh);
      onChange?.(fresh);
      toast.success(t('userGroups.toasts.removed'));
    } catch {
      setCache(idNum, previous);
      setResolved(previous);
      onChange?.(previous);
      toast.error(t('userGroups.toasts.error'));
    } finally {
      setSaving(false);
    }
  };

  const badges = (
    <div className="flex gap-1 flex-wrap items-center">
      {shown.map((g) => (
        <Badge
          key={g.id}
          variant="secondary"
          className="text-xs px-1.5 py-0.5 gap-1 h-6 font-normal"
        >
          <span>{g.name}</span>
          {canEdit && (
            <button
              type="button"
              onClick={() => removeGroup(g.id)}
              disabled={saving}
              aria-label={t('userGroups.remove')}
              className="rounded-sm p-0.5 hover:bg-background/60 disabled:opacity-50"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </Badge>
      ))}
      {overflow > 0 && (
        <Badge
          variant="secondary"
          className="text-xs px-1.5 py-0.5"
          title={list.map((g) => g.name).join(', ')}
        >
          +{overflow}
        </Badge>
      )}
      {isEmpty && !canEdit && (
        <span className="text-xs text-muted-foreground italic">
          {t('userGroups.not_specified')}
        </span>
      )}
      {canEdit && (
        <Popover
          open={open}
          onOpenChange={(o) => {
            setOpen(o);
            if (!o) setQuery('');
          }}
        >
          <PopoverTrigger asChild>
            <button
              type="button"
              disabled={saving}
              className="inline-flex items-center gap-1 h-6 px-2 rounded-md border border-dashed border-border/70 text-xs text-muted-foreground hover:text-foreground hover:border-foreground/40 hover:bg-muted/50 transition-colors disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Search className="h-3 w-3" />
              )}
              <span>{isEmpty ? t('userGroups.add') : '+'}</span>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-0" align="start">
            <Command>
              <CommandInput
                placeholder={t('userGroups.search_placeholder')}
                value={query}
                onValueChange={setQuery}
                className="h-9"
              />
              <CommandList>
                <CommandEmpty>
                  <span className="text-xs text-muted-foreground">
                    {allGroups.length === 0
                      ? t('userGroups.none_available')
                      : t('userGroups.empty_assigned')}
                  </span>
                </CommandEmpty>
                {availableOptions.length > 0 && (
                  <CommandGroup>
                    {availableOptions.map((g) => (
                      <CommandItem
                        key={g.id}
                        value={g.name}
                        onSelect={() => addGroup({ id: g.id, name: g.name })}
                        className="text-xs"
                      >
                        {g.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );

  if (variant === 'labeled') {
    return (
      <div className={`flex items-center gap-2 flex-wrap ${className}`}>
        <span className="text-xs text-muted-foreground">
          {t('userGroups.inline_label')}:
        </span>
        {badges}
      </div>
    );
  }
  return <div className={`flex items-center gap-2 flex-wrap ${className}`}>{badges}</div>;
}

export default ContactUserGroupsInline;
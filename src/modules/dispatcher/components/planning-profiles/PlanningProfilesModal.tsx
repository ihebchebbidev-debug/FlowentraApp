import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { CalendarDays, Plus, Copy, Trash2, Star, Share2, Check, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import {
  useActivePlanningProfile,
  usePlanningProfileMutations,
  usePlanningProfiles,
} from '../../hooks/usePlanningProfile';
import {
  DEFAULT_PLANNING_SETTINGS,
  type PlanningProfile,
  type PlanningProfileSettings,
} from '../../types/planningProfile';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PlanningProfilesModal({ open, onOpenChange }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: profiles = [], isLoading } = usePlanningProfiles();
  const { profile: activeProfile } = useActivePlanningProfile();
  const { create, update, remove, setActive, duplicate } = usePlanningProfileMutations();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<PlanningProfile | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const selected = useMemo(
    () => profiles.find(p => p.id === selectedId) ?? activeProfile ?? profiles[0] ?? null,
    [profiles, selectedId, activeProfile]
  );

  useEffect(() => {
    if (selected) setDraft(JSON.parse(JSON.stringify(selected)));
  }, [selected]);

  useEffect(() => {
    if (!selectedId && activeProfile) setSelectedId(activeProfile.id);
  }, [activeProfile, selectedId]);

  const mine = profiles.filter(p => !p.isShared);
  const shared = profiles.filter(p => p.isShared);

  const handleCreate = async () => {
    const created = await create.mutateAsync({
      name: t('dispatcher.profiles.new_profile_name', { defaultValue: 'New profile' }),
      visibleUserIds: [],
      settings: { ...DEFAULT_PLANNING_SETTINGS },
      isShared: false,
    });
    setSelectedId(created.id);
    toast.success(t('dispatcher.profiles.created', { defaultValue: 'Profile created' }));
  };

  const persistDraft = async () => {
    if (!draft) return;
    await update.mutateAsync({
      id: draft.id,
      dto: {
        name: draft.name,
        description: draft.description,
        color: draft.color,
        icon: draft.icon,
        isShared: draft.isShared,
        visibleUserIds: draft.visibleUserIds,
        requiredSkillIds: draft.requiredSkillIds,
        settings: draft.settings,
      },
    });
  };

  const handleSave = async () => {
    await persistDraft();
    toast.success(t('dispatcher.profiles.saved', { defaultValue: 'Profile saved' }));
  };

  const handleSaveAndApply = async () => {
    if (!draft) return;
    await persistDraft();
    if (activeProfile?.id !== draft.id) {
      await setActive.mutateAsync(draft.id);
    }
    toast.success(t('dispatcher.profiles.applied', { defaultValue: 'Profile saved & applied to board' }));
  };

  const handleSetActive = async () => {
    if (!draft) return;
    await setActive.mutateAsync(draft.id);
    toast.success(t('dispatcher.profiles.activated', { defaultValue: 'Profile activated' }));
  };

  const handleDuplicate = async () => {
    if (!draft) return;
    const dup = await duplicate.mutateAsync({
      id: draft.id,
      name: `${draft.name} (${t('dispatcher.profiles.copy_suffix', { defaultValue: 'copy' })})`,
    });
    setSelectedId(dup.id);
  };

  const handleDelete = async () => {
    if (!draft) return;
    await remove.mutateAsync(draft.id);
    setConfirmDelete(false);
    setSelectedId(null);
    toast.success(t('dispatcher.profiles.deleted', { defaultValue: 'Profile deleted' }));
  };

  const updateSetting = <K extends keyof PlanningProfileSettings>(key: K, value: PlanningProfileSettings[K]) => {
    if (!draft) return;
    setDraft({ ...draft, settings: { ...draft.settings, [key]: value } });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl h-[85vh] flex flex-col p-0 gap-0">
          <DialogHeader className="px-6 py-4 border-b">
            <DialogTitle className="flex items-center justify-between gap-3 flex-wrap">
              <span className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-primary" />
                {t('dispatcher.profiles.title', { defaultValue: 'Planning profiles' })}
              </span>
              <span className="flex items-center gap-2 text-xs font-normal">
                <span className="text-muted-foreground">
                  {t('dispatcher.profiles.currently_active', { defaultValue: 'Currently active' })}:
                </span>
                {activeProfile ? (
                  <Badge variant="default" className="gap-1.5 py-1">
                    <Star className="h-3 w-3" fill="currentColor" />
                    {activeProfile.name}
                  </Badge>
                ) : (
                  <Badge variant="outline">
                    {t('dispatcher.profiles.no_active_profile', { defaultValue: 'No active profile' })}
                  </Badge>
                )}
              </span>
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-1 min-h-0">
            {/* Left rail */}
            <aside className="w-64 border-r flex flex-col bg-muted/30">
              <div className="p-3 border-b">
                <Button size="sm" className="w-full gap-2" onClick={handleCreate}>
                  <Plus className="h-4 w-4" />
                  {t('dispatcher.profiles.new_profile', { defaultValue: 'New profile' })}
                </Button>
              </div>
              <ScrollArea className="flex-1">
                {isLoading && <div className="p-4 text-sm text-muted-foreground">{t('common.loading', { defaultValue: 'Loading…' })}</div>}
                <ProfileSection
                  label={t('dispatcher.profiles.my_profiles', { defaultValue: 'My profiles' })}
                  profiles={mine}
                  activeId={activeProfile?.id}
                  selectedId={draft?.id}
                  onSelect={setSelectedId}
                />
                <ProfileSection
                  label={t('dispatcher.profiles.shared_profiles', { defaultValue: 'Shared profiles' })}
                  profiles={shared}
                  activeId={activeProfile?.id}
                  selectedId={draft?.id}
                  onSelect={setSelectedId}
                />
              </ScrollArea>
              <div className="p-3 border-t">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs"
                  onClick={() => { onOpenChange(false); navigate('/dashboard/field/dispatcher/manage-scheduler'); }}
                >
                  {t('dispatcher.profiles.edit_working_hours', { defaultValue: 'Edit working hours & leave' })}
                </Button>
              </div>
            </aside>

            {/* Right pane */}
            <section className="flex-1 flex flex-col min-w-0">
              {!draft ? (
                <div className="flex-1 flex items-center justify-center text-muted-foreground">
                  {t('dispatcher.profiles.empty_state', { defaultValue: 'Select or create a profile to begin' })}
                </div>
              ) : (
                <>
                  <div className="px-6 py-3 border-b flex items-center gap-3">
                    <Input
                      value={draft.name}
                      onChange={e => setDraft({ ...draft, name: e.target.value })}
                      className="text-base font-semibold max-w-sm"
                      placeholder={t('dispatcher.profiles.name_placeholder', { defaultValue: 'Profile name' })}
                    />
                    {activeProfile?.id === draft.id && (
                      <Badge variant="default" className="gap-1"><Star className="h-3 w-3" />{t('dispatcher.profiles.active', { defaultValue: 'Active' })}</Badge>
                    )}
                    {draft.isShared && (
                      <Badge variant="secondary" className="gap-1"><Share2 className="h-3 w-3" />{t('dispatcher.profiles.shared', { defaultValue: 'Shared' })}</Badge>
                    )}
                  </div>

                  <Tabs defaultValue="general" className="flex-1 flex flex-col min-h-0">
                    <TabsList className="mx-6 mt-3 self-start">
                      <TabsTrigger value="general">{t('dispatcher.profiles.tab_general', { defaultValue: 'General' })}</TabsTrigger>
                      <TabsTrigger value="users">{t('dispatcher.profiles.tab_users', { defaultValue: 'Visible users' })}</TabsTrigger>
                      <TabsTrigger value="display">{t('dispatcher.profiles.tab_display', { defaultValue: 'Display' })}</TabsTrigger>
                      <TabsTrigger value="permissions">{t('dispatcher.profiles.tab_permissions', { defaultValue: 'Permissions' })}</TabsTrigger>
                    </TabsList>

                    <ScrollArea className="flex-1">
                      <div className="p-6">
                        <TabsContent value="general" className="space-y-4 mt-0">
                          <div>
                            <Label>{t('dispatcher.profiles.field_name', { defaultValue: 'Name' })}</Label>
                            <Input
                              value={draft.name}
                              onChange={e => setDraft({ ...draft, name: e.target.value })}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label>{t('dispatcher.profiles.field_description', { defaultValue: 'Description' })}</Label>
                            <Textarea
                              value={draft.description ?? ''}
                              onChange={e => setDraft({ ...draft, description: e.target.value })}
                              className="mt-1"
                              rows={3}
                            />
                          </div>
                          <ToggleRow
                            label={t('dispatcher.profiles.field_shared', { defaultValue: 'Share with team' })}
                            hint={t('dispatcher.profiles.field_shared_hint', { defaultValue: 'Make this profile visible to all users in the tenant (admin only).' })}
                            checked={draft.isShared}
                            onChange={v => setDraft({ ...draft, isShared: v })}
                          />
                        </TabsContent>

                        <TabsContent value="users" className="space-y-4 mt-0">
                          <VisibleUsersTab
                            visibleUserIds={draft.visibleUserIds}
                            onChange={ids => setDraft({ ...draft, visibleUserIds: ids })}
                          />
                          <ToggleRow
                            label={t('dispatcher.profiles.hide_no_hours', { defaultValue: 'Hide users with no working hours' })}
                            checked={draft.settings.hideUsersWithoutWorkingHours}
                            onChange={v => updateSetting('hideUsersWithoutWorkingHours', v)}
                          />
                          <ToggleRow
                            label={t('dispatcher.profiles.hide_on_leave', { defaultValue: 'Hide users on leave today' })}
                            checked={draft.settings.hideUsersOnLeaveToday}
                            onChange={v => updateSetting('hideUsersOnLeaveToday', v)}
                          />
                        </TabsContent>

                        <TabsContent value="display" className="space-y-4 mt-0">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>{t('dispatcher.profiles.field_mode', { defaultValue: 'Board mode' })}</Label>
                              <Select value={draft.settings.mode} onValueChange={v => updateSetting('mode', v as PlanningProfileSettings['mode'])}>
                                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="service_orders">{t('dispatcher.profiles.mode_service_orders', { defaultValue: 'Service orders' })}</SelectItem>
                                  <SelectItem value="installations">{t('dispatcher.profiles.mode_installations', { defaultValue: 'Installations' })}</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label>{t('dispatcher.profiles.field_default_view', { defaultValue: 'Default view' })}</Label>
                              <Select value={draft.settings.defaultView} onValueChange={v => updateSetting('defaultView', v as PlanningProfileSettings['defaultView'])}>
                                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="day">{t('dispatcher.day_view', { defaultValue: 'Day' })}</SelectItem>
                                  <SelectItem value="week">{t('dispatcher.week_view', { defaultValue: 'Week' })}</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="col-span-2">
                              <Label>{t('dispatcher.profiles.field_color_by', { defaultValue: 'Color jobs by' })}</Label>
                              <Select value={draft.settings.colorBy} onValueChange={v => updateSetting('colorBy', v as PlanningProfileSettings['colorBy'])}>
                                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="status">{t('dispatcher.profiles.color_status', { defaultValue: 'Status' })}</SelectItem>
                                  <SelectItem value="priority">{t('dispatcher.profiles.color_priority', { defaultValue: 'Priority' })}</SelectItem>
                                  <SelectItem value="service_order">{t('dispatcher.profiles.color_service_order', { defaultValue: 'Service order' })}</SelectItem>
                                  <SelectItem value="technician">{t('dispatcher.profiles.color_technician', { defaultValue: 'Technician' })}</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div className="border-t pt-4 space-y-3">
                            <ToggleRow label={t('dispatcher.profiles.include_weekends', { defaultValue: 'Include weekends' })} checked={draft.settings.includeWeekends} onChange={v => updateSetting('includeWeekends', v)} />
                            <ToggleRow label={t('dispatcher.profiles.show_closed_dispatches', { defaultValue: 'Display closed dispatches' })} checked={draft.settings.displayClosedDispatches} onChange={v => updateSetting('displayClosedDispatches', v)} />
                            <ToggleRow label={t('dispatcher.profiles.show_rejected_dispatches', { defaultValue: 'Display rejected dispatches' })} checked={draft.settings.displayRejectedDispatches} onChange={v => updateSetting('displayRejectedDispatches', v)} />
                            <ToggleRow label={t('dispatcher.profiles.show_cancelled_dispatches', { defaultValue: 'Display cancelled dispatches' })} checked={draft.settings.displayCancelledDispatches} onChange={v => updateSetting('displayCancelledDispatches', v)} />
                            <ToggleRow label={t('dispatcher.profiles.load_closed_so', { defaultValue: 'Load closed service orders' })} checked={draft.settings.loadClosedServiceOrders} onChange={v => updateSetting('loadClosedServiceOrders', v)} />
                            <ToggleRow label={t('dispatcher.profiles.load_planned_so', { defaultValue: 'Load planned service orders' })} checked={draft.settings.loadPlannedServiceOrders} onChange={v => updateSetting('loadPlannedServiceOrders', v)} />
                            <ToggleRow label={t('dispatcher.profiles.show_duration', { defaultValue: 'Show job duration labels' })} checked={draft.settings.showDurationLabels} onChange={v => updateSetting('showDurationLabels', v)} />
                            <ToggleRow label={t('dispatcher.profiles.compact_rows', { defaultValue: 'Compact row height' })} checked={draft.settings.compactRows} onChange={v => updateSetting('compactRows', v)} />
                            <ToggleRow label={t('dispatcher.profiles.auto_collapse', { defaultValue: 'Auto-collapse completed dispatches' })} checked={draft.settings.autoCollapseCompleted} onChange={v => updateSetting('autoCollapseCompleted', v)} />
                          </div>
                        </TabsContent>

                        <TabsContent value="permissions" className="space-y-3 mt-0">
                          <ToggleRow label={t('dispatcher.profiles.allow_scheduling', { defaultValue: 'Allow scheduling of jobs' })} checked={draft.settings.allowSchedulingJobs} onChange={v => updateSetting('allowSchedulingJobs', v)} />
                          <ToggleRow label={t('dispatcher.profiles.allow_past', { defaultValue: 'Allow scheduling in the past' })} checked={draft.settings.allowSchedulingInPast} onChange={v => updateSetting('allowSchedulingInPast', v)} />
                          <ToggleRow label={t('dispatcher.profiles.allow_change', { defaultValue: 'Allow changing dispatches' })} checked={draft.settings.allowChangingDispatches} onChange={v => updateSetting('allowChangingDispatches', v)} />
                          <ToggleRow label={t('dispatcher.profiles.allow_unassign', { defaultValue: 'Allow unassigning dispatches' })} checked={draft.settings.allowUnassigningDispatches} onChange={v => updateSetting('allowUnassigningDispatches', v)} />
                          <ToggleRow label={t('dispatcher.profiles.confirm_overlap', { defaultValue: 'Confirm before overlap' })} checked={draft.settings.confirmOnOverlap} onChange={v => updateSetting('confirmOnOverlap', v)} />
                          <p className="text-xs text-muted-foreground pt-2">
                            {t('dispatcher.profiles.permissions_hint', { defaultValue: 'These toggles only relax behavior; final permission checks remain enforced by the server.' })}
                          </p>
                        </TabsContent>
                      </div>
                    </ScrollArea>
                  </Tabs>
                </>
              )}
            </section>
          </div>

          <DialogFooter className="px-6 py-3 border-t flex-row sm:justify-between gap-2">
            <div className="flex gap-2">
              {draft && activeProfile?.id !== draft.id && (
                <Button variant="outline" size="sm" onClick={handleSetActive} disabled={setActive.isPending}>
                  <Star className="h-4 w-4 mr-1" />
                  {t('dispatcher.profiles.set_active', { defaultValue: 'Set as active' })}
                </Button>
              )}
              {draft && (
                <Button variant="outline" size="sm" onClick={handleDuplicate}>
                  <Copy className="h-4 w-4 mr-1" />
                  {t('dispatcher.profiles.duplicate', { defaultValue: 'Duplicate' })}
                </Button>
              )}
              {draft && (
                <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setConfirmDelete(true)}>
                  <Trash2 className="h-4 w-4 mr-1" />
                  {t('common.delete', { defaultValue: 'Delete' })}
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => onOpenChange(false)}>
                {t('common.cancel', { defaultValue: 'Cancel' })}
              </Button>
              <Button variant="outline" onClick={handleSave} disabled={!draft || update.isPending}>
                {update.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Check className="h-4 w-4 mr-1" />}
                {t('common.save', { defaultValue: 'Save' })}
              </Button>
              <Button onClick={handleSaveAndApply} disabled={!draft || update.isPending || setActive.isPending}>
                {(update.isPending || setActive.isPending) ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Star className="h-4 w-4 mr-1" />}
                {t('dispatcher.profiles.save_and_apply', { defaultValue: 'Save & Apply' })}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('dispatcher.profiles.delete_title', { defaultValue: 'Delete profile?' })}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('dispatcher.profiles.delete_desc', { defaultValue: 'This cannot be undone. The profile will be removed for everyone using it.' })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel', { defaultValue: 'Cancel' })}</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground" onClick={handleDelete}>
              {t('common.delete', { defaultValue: 'Delete' })}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function ProfileSection({
  label, profiles, activeId, selectedId, onSelect,
}: {
  label: string;
  profiles: PlanningProfile[];
  activeId?: string;
  selectedId?: string;
  onSelect: (id: string) => void;
}) {
  if (profiles.length === 0) return null;
  return (
    <div className="py-2">
      <div className="px-3 pb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
      {profiles.map(p => (
        <button
          key={p.id}
          onClick={() => onSelect(p.id)}
          className={`w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-accent/50 transition-colors ${selectedId === p.id ? 'bg-accent' : ''}`}
        >
          <CalendarDays className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
          <span className="flex-1 text-sm truncate">{p.name}</span>
          {activeId === p.id && <Star className="h-3.5 w-3.5 text-primary flex-shrink-0" fill="currentColor" />}
        </button>
      ))}
    </div>
  );
}

function ToggleRow({ label, hint, checked, onChange }: { label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5">
      <div className="flex-1">
        <Label className="font-normal cursor-pointer" onClick={() => onChange(!checked)}>{label}</Label>
        {hint && <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function VisibleUsersTab({ visibleUserIds, onChange }: { visibleUserIds: string[]; onChange: (ids: string[]) => void }) {
  const { t } = useTranslation();
  // Lazy import to avoid pulling users API on initial render
  const [users, setUsers] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const mod = await import('@/services/api/usersApi');
        const res = await mod.usersApi.getAll();
        if (cancelled) return;
        setUsers(res.users.map((u: { id: string | number; firstName?: string; lastName?: string; email?: string }) => ({
          id: String(u.id),
          name: [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email || `User ${u.id}`,
        })));
      } catch {
        if (!cancelled) setUsers([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const filtered = users.filter(u => u.name.toLowerCase().includes(search.toLowerCase()));
  const allSelected = users.length > 0 && visibleUserIds.length === users.length;

  const toggle = (id: string) => {
    onChange(visibleUserIds.includes(id) ? visibleUserIds.filter(x => x !== id) : [...visibleUserIds, id]);
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input placeholder={t('common.search', { defaultValue: 'Search…' })} value={search} onChange={e => setSearch(e.target.value)} />
        <Button variant="outline" size="sm" onClick={() => onChange(allSelected ? [] : users.map(u => u.id))}>
          {allSelected ? t('dispatcher.profiles.clear_all', { defaultValue: 'Clear all' }) : t('dispatcher.profiles.select_all', { defaultValue: 'Select all' })}
        </Button>
      </div>
      <div className="text-xs text-muted-foreground">
        {t('dispatcher.profiles.users_selected', { count: visibleUserIds.length, defaultValue: '{{count}} selected' })}
      </div>
      <div className="border rounded-md max-h-72 overflow-auto">
        {loading ? (
          <div className="p-4 text-sm text-muted-foreground">{t('common.loading', { defaultValue: 'Loading…' })}</div>
        ) : filtered.length === 0 ? (
          <div className="p-4 text-sm text-muted-foreground">{t('dispatcher.profiles.no_users', { defaultValue: 'No users found' })}</div>
        ) : filtered.map(u => (
          <label key={u.id} className="flex items-center gap-2 px-3 py-2 hover:bg-accent/50 cursor-pointer border-b last:border-b-0">
            <input type="checkbox" checked={visibleUserIds.includes(u.id)} onChange={() => toggle(u.id)} className="h-4 w-4" />
            <span className="text-sm">{u.name}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

import { useState, useCallback, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTheme } from '@/hooks/useTheme';
import { DashboardGrid } from './DashboardGrid';
import { WidgetPalette } from './WidgetPalette';
import { WidgetConfigPanel } from './WidgetConfigPanel';
import { DateRangeFilter } from './DateRangeFilter';
import { ShareDashboardDialog } from './ShareDashboardDialog';
import { GridSettingsPopover, DEFAULT_GRID_SETTINGS, type GridSettings } from './GridSettingsPopover';
import { DashboardAiAssistant } from './DashboardAiAssistant';
import { DashboardFilterProvider } from '../context/DashboardFilterContext';
import type { Dashboard, DashboardWidget } from '../types';
import { useDashboards } from '../hooks/useDashboards';
import { useDashboardData } from '@/modules/dashboard/hooks/useDashboardData';
import { TEMPLATE_MAP } from '../templates/defaultTemplates';
import { DashboardPageSkeleton } from './widgets/WidgetSkeleton';
import { streamDashboardAI, AI_QUICK_PROMPTS, type StreamCallbacks } from '../services/dashboardAiService';
import { useAiAssistantAvailable } from '@/hooks/useAiAssistantAvailable';
import { AI_ERROR_OFFLINE } from '@/services/ai/aiNetworkGate';
import {
  Pencil, Save, X, Plus, Copy, Trash2, Share2,
  ChevronDown, Loader2 as Loader2Icon, Sun, Moon,
  Send, LayoutDashboard, ArrowRight, Loader2,
} from 'lucide-react';
import { AiLogoIcon } from '@/components/ai-assistant/AiLogoIcon';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
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
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export function DashboardManager() {
  const dd = useDashboardData();

  return (
    <DashboardFilterProvider onRefresh={dd.silentRefresh}>
      <DashboardManagerInner silentRefresh={dd.silentRefresh} />
    </DashboardFilterProvider>
  );
}

function DashboardManagerInner({ silentRefresh }: { silentRefresh: () => void }) {
  const { t } = useTranslation('dashboard');
  const aiAssistantAvailable = useAiAssistantAvailable();
  const { theme, setTheme } = useTheme();
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const [searchParams, setSearchParams] = useSearchParams();
  const { dashboards, isLoading, create, update, remove, duplicate, isCreating, isUpdating } = useDashboards();

  const [activeDashboardId, setActiveDashboardId] = useState<number | null>(() => {
    const idParam = searchParams.get('id');
    return idParam ? parseInt(idParam) : null;
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editWidgets, setEditWidgets] = useState<DashboardWidget[]>([]);

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newName, setNewName] = useState('');
  const [newTemplate, setNewTemplate] = useState<string>('crm');

  const [deleteTarget, setDeleteTarget] = useState<Dashboard | null>(null);
  const [renameTarget, setRenameTarget] = useState<Dashboard | null>(null);
  const [renameName, setRenameName] = useState('');
  const [configWidgetId, setConfigWidgetId] = useState<string | null>(null);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [gridSettings, setGridSettings] = useState<GridSettings>(DEFAULT_GRID_SETTINGS);
  const handleGridSettingsChange = useCallback((s: GridSettings) => {
    setGridSettings(s);
  }, []);

  // ─── Inline AI state (must be before early returns) ───
  const [inlinePrompt, setInlinePrompt] = useState('');
  const [isInlineGenerating, setIsInlineGenerating] = useState(false);
  const [inlineError, setInlineError] = useState('');
  const inlineInputRef = useRef<HTMLInputElement>(null);

  const activeDashboard = dashboards.find(d => d.id === activeDashboardId);

  // Auto-select dashboard from URL param or default to first
  useEffect(() => {
    const idParam = searchParams.get('id');
    if (idParam && dashboards.length > 0) {
      const parsed = parseInt(idParam);
      const found = dashboards.find(d => d.id === parsed);
      if (found) {
        setActiveDashboardId(found.id);
        return;
      }
    }
    if (!activeDashboardId && dashboards.length > 0) {
      setActiveDashboardId(dashboards[0].id);
    }
  }, [dashboards, activeDashboardId, searchParams]);

  // Sync grid settings when active dashboard changes
  useEffect(() => {
    if (activeDashboard?.gridSettings) {
      setGridSettings({ ...DEFAULT_GRID_SETTINGS, ...activeDashboard.gridSettings });
    } else {
      setGridSettings(DEFAULT_GRID_SETTINGS);
    }
  }, [activeDashboardId, activeDashboard]);

  useEffect(() => {
    if (!aiAssistantAvailable && showAiPanel) setShowAiPanel(false);
  }, [aiAssistantAvailable, showAiPanel]);

  const currentWidgets = isEditing ? editWidgets : (activeDashboard?.widgets ?? []);

  const handleCreate = useCallback(async () => {
    const template = TEMPLATE_MAP[newTemplate];
    const widgets = template ? (typeof template.widgets === 'function' ? template.widgets() : template.widgets) : [];
    const name = newName || (template ? t(template.nameKey) : t('dashboardBuilder.newDashboard'));
    const dashboard = await create({ name, templateKey: newTemplate, widgets });
    setActiveDashboardId(dashboard.id);
    setShowCreateDialog(false);
    setNewName('');
    setNewTemplate('crm');
  }, [newName, newTemplate, create, t]);

  const handleStartEdit = () => {
    if (!activeDashboard) return;
    setEditWidgets([...activeDashboard.widgets]);
    setIsEditing(true);
  };

  const handleSave = useCallback(async () => {
    if (!activeDashboard) return;
    await update({ id: activeDashboard.id, dto: { widgets: editWidgets, gridSettings } });
    setIsEditing(false);
  }, [activeDashboard, editWidgets, gridSettings, update]);

  const handleCancel = () => { setIsEditing(false); setEditWidgets([]); };
  const handleAddWidget = (widget: DashboardWidget) => {
    const cols = 12;
    const occupied = editWidgets.map(w => ({
      x: w.layout.x, y: w.layout.y, w: w.layout.w, h: w.layout.h,
    }));
    
    let bestX = 0;
    let bestY = 0;
    if (occupied.length > 0) {
      const maxY = Math.max(...occupied.map(o => o.y + o.h));
      let placed = false;
      for (let y = 0; y <= maxY && !placed; y++) {
        for (let x = 0; x <= cols - widget.layout.w; x++) {
          const fits = !occupied.some(o =>
            x < o.x + o.w && x + widget.layout.w > o.x &&
            y < o.y + o.h && y + widget.layout.h > o.y
          );
          if (fits) {
            bestX = x;
            bestY = y;
            placed = true;
            break;
          }
        }
      }
      if (!placed) {
        bestX = 0;
        bestY = maxY;
      }
    }
    
    setEditWidgets(prev => [...prev, {
      ...widget,
      layout: { ...widget.layout, x: bestX, y: bestY },
    }]);
  };
  const handleRemoveWidget = (id: string) => { setEditWidgets(prev => prev.filter(w => w.id !== id)); };
  const handleLayoutChange = (updated: DashboardWidget[]) => { setEditWidgets(updated); };
  const handleEditWidget = (id: string) => { setConfigWidgetId(id); };
  const handleSaveWidgetConfig = (updated: DashboardWidget) => {
    setEditWidgets(prev => prev.map(w => w.id === updated.id ? updated : w));
    setConfigWidgetId(null);
  };

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    await remove(deleteTarget.id);
    if (activeDashboardId === deleteTarget.id) setActiveDashboardId(null);
    setDeleteTarget(null);
  }, [deleteTarget, remove, activeDashboardId]);

  const handleDuplicate = useCallback(async (d: Dashboard) => {
    const newDash = await duplicate({ id: d.id, name: `${d.name} (${t('dashboardBuilder.copy')})` });
    setActiveDashboardId(newDash.id);
  }, [duplicate, t]);

  const handleRename = useCallback(async () => {
    if (!renameTarget || !renameName.trim()) return;
    await update({ id: renameTarget.id, dto: { name: renameName.trim() } });
    setRenameTarget(null);
    setRenameName('');
  }, [renameTarget, renameName, update]);

  const handleInlineAiGenerate = useCallback(async (prompt?: string) => {
    const text = prompt || inlinePrompt.trim();
    if (!text || isInlineGenerating) return;
    if (!aiAssistantAvailable) {
      setInlineError(t('dashboardBuilder.ai.offlineUnavailable'));
      return;
    }
    setInlinePrompt('');
    setIsInlineGenerating(true);
    setInlineError('');

    let fullContent = '';
    const callbacks: StreamCallbacks = {
      onToken: (token) => { fullContent += token; },
      onComplete: async (widgets) => {
        if (widgets && widgets.length > 0) {
          const dashboard = await create({ name: text.slice(0, 50), templateKey: 'custom', widgets });
          setActiveDashboardId(dashboard.id);
        } else {
          setInlineError(t('dashboardBuilder.ai.generationFailed'));
        }
        setIsInlineGenerating(false);
      },
      onError: (error) => {
        setInlineError(
          error === AI_ERROR_OFFLINE ? t('dashboardBuilder.ai.offlineUnavailable') : error
        );
        setIsInlineGenerating(false);
      },
    };

    await streamDashboardAI(text, callbacks);
  }, [inlinePrompt, isInlineGenerating, create, t, aiAssistantAvailable]);

  const handleAiApply = useCallback(async (widgets: DashboardWidget[], name?: string) => {
    const dashName = name || `AI Dashboard ${new Date().toLocaleDateString()}`;
    const dashboard = await create({ name: dashName, templateKey: 'custom', widgets });
    setActiveDashboardId(dashboard.id);
  }, [create]);

  if (isLoading) {
    return <DashboardPageSkeleton />;
  }

  // ─── Empty State ───
  if (dashboards.length === 0 && !isEditing) {
    return (
      <div className="h-[calc(100vh-80px)] flex flex-col">
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-border bg-card">
          <h1 className="text-sm font-semibold text-foreground">{t('dashboardBuilder.title')}</h1>
          <Button size="sm" onClick={() => setShowCreateDialog(true)} className="h-8 gap-1.5 text-xs">
            <Plus className="h-3.5 w-3.5" />
            {t('dashboardBuilder.createNew')}
          </Button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-4">
          <div className="w-full max-w-xl space-y-8">
            {/* Header */}
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10 mb-4">
                <LayoutDashboard className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-1.5">{t('dashboardBuilder.welcomeTitle')}</h2>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">{t('dashboardBuilder.welcomeDesc')}</p>
            </div>

            {/* AI Prompt Section — hidden when offline / explicit offline mode */}
            {aiAssistantAvailable ? (
            <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-sm">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
                  <AiLogoIcon size={16} variant="light" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">{t('dashboardBuilder.ai.welcomePromptTitle')}</h3>
                  <p className="text-[11px] text-muted-foreground">{t('dashboardBuilder.ai.welcomePromptDesc')}</p>
                </div>
              </div>

              {/* Prompt input */}
              <div className="relative">
                <Input
                  ref={inlineInputRef}
                  value={inlinePrompt}
                  onChange={e => setInlinePrompt(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleInlineAiGenerate(); } }}
                  placeholder={t('dashboardBuilder.ai.welcomePromptPlaceholder')}
                  disabled={isInlineGenerating}
                  className="h-11 pr-12 text-sm bg-background border-border/60 rounded-lg"
                />
                <Button
                  size="icon"
                  onClick={() => handleInlineAiGenerate()}
                  disabled={!inlinePrompt.trim() || isInlineGenerating}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 h-8 w-8 rounded-md"
                >
                  {isInlineGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>

              {/* Generating state */}
              {isInlineGenerating && (
                <div className="space-y-3">
                  {/* Status */}
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-md bg-primary/8 flex items-center justify-center shrink-0">
                      <AiLogoIcon size={13} variant="auto" />
                    </div>
                    <p className="text-[11px] font-medium text-muted-foreground">{t('dashboardBuilder.ai.generating')}</p>
                    <div className="flex gap-0.5 ml-auto">
                      {[0, 1, 2, 3].map(i => (
                        <div key={i} className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-pulse" style={{ animationDelay: `${i * 300}ms` }} />
                      ))}
                    </div>
                  </div>
                  {/* Dashboard skeleton */}
                  <div className="rounded-lg border border-border/30 bg-muted/15 p-2.5 space-y-1.5">
                    <div className="grid grid-cols-4 gap-1.5">
                      {[0, 1, 2, 3].map(i => (
                        <div key={i} className="relative overflow-hidden h-10 rounded-md bg-background border border-border/20 p-1.5">
                          <div className="h-1 w-6 rounded-full bg-muted-foreground/8 mb-1" />
                          <div className="h-2 w-8 rounded bg-muted-foreground/10" />
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-foreground/[0.03] to-transparent bg-[length:200%_100%] animate-shimmer rounded-md" />
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      <div className="col-span-2 relative overflow-hidden h-14 rounded-md bg-background border border-border/20">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-foreground/[0.03] to-transparent bg-[length:200%_100%] animate-shimmer rounded-md" />
                      </div>
                      <div className="relative overflow-hidden h-14 rounded-md bg-background border border-border/20">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-foreground/[0.03] to-transparent bg-[length:200%_100%] animate-shimmer rounded-md" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Error state */}
              {inlineError && (
                <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-destructive/5 border border-destructive/10">
                  <X className="h-4 w-4 text-destructive" />
                  <span className="text-xs text-destructive">{inlineError}</span>
                </div>
              )}

              {/* Quick suggestion chips */}
              <div className="flex flex-wrap gap-2">
                {AI_QUICK_PROMPTS.map((qp, i) => (
                  <button
                    key={i}
                    onClick={() => handleInlineAiGenerate(qp.prompt)}
                    disabled={isInlineGenerating}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium border border-border/60 bg-background text-muted-foreground hover:text-foreground hover:border-primary/30 hover:bg-primary/5 transition-all disabled:opacity-50 disabled:pointer-events-none"
                  >
                    <AiLogoIcon size={12} />
                    {t(qp.labelKey)}
                  </button>
                ))}
              </div>
            </div>
            ) : (
            <div className="rounded-xl border border-dashed border-border bg-muted/20 p-6 text-center">
              <p className="text-sm text-muted-foreground">{t('dashboardBuilder.ai.offlineUnavailable')}</p>
            </div>
            )}

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-border" />
              <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">{t('dashboardBuilder.ai.orChooseTemplate')}</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Templates grid */}
            <div className="grid grid-cols-2 gap-2.5">
              {(['crm', 'field', 'executive', 'custom'] as const).map((tpl) => (
                <button
                  key={tpl}
                  onClick={() => { setNewTemplate(tpl); setShowCreateDialog(true); }}
                  className="flex flex-col items-start gap-1.5 px-4 py-3.5 rounded-lg border border-border bg-card hover:bg-accent/50 hover:border-primary/20 transition-all text-left group"
                >
                  <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                    {tpl === 'custom' ? t('dashboardBuilder.templates.blank') : t(`dashboardBuilder.templates.${tpl}`)}
                  </p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    {t(`dashboardBuilder.templateDesc${tpl === 'custom' ? 'Blank' : tpl.charAt(0).toUpperCase() + tpl.slice(1)}`)}
                  </p>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-primary/60 group-hover:translate-x-0.5 transition-all mt-0.5" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {renderCreateDialog()}
        <DashboardAiAssistant open={showAiPanel && aiAssistantAvailable} onClose={() => setShowAiPanel(false)} onApplyWidgets={handleAiApply} />
      </div>
    );
  }

  function renderCreateDialog() {
    return (
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('dashboardBuilder.createDashboard')}</DialogTitle>
            <DialogDescription>{t('dashboardBuilder.createDesc')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">{t('dashboardBuilder.dashboardName')}</Label>
              <Input
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder={t('dashboardBuilder.namePlaceholder')}
                autoFocus
                className="h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">{t('dashboardBuilder.template')}</Label>
              <div className="space-y-1.5">
                {(['crm', 'field', 'executive', 'custom'] as const).map(tpl => (
                  <button
                    key={tpl}
                    type="button"
                    onClick={() => setNewTemplate(tpl)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md border text-left text-sm transition-colors ${
                      newTemplate === tpl
                        ? 'border-primary bg-primary/5 text-foreground'
                        : 'border-border hover:bg-muted/50 text-muted-foreground'
                    }`}
                  >
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${newTemplate === tpl ? 'bg-primary' : 'bg-border'}`} />
                    <span className="font-medium">
                      {tpl === 'custom' ? t('dashboardBuilder.templates.blank') : t(`dashboardBuilder.templates.${tpl}`)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowCreateDialog(false)}>
              {t('dashboardBuilder.cancel')}
            </Button>
            <Button size="sm" onClick={handleCreate} disabled={isCreating} className="gap-1.5">
              {isCreating && <Loader2Icon className="h-3.5 w-3.5 animate-spin" />}
              {t('dashboardBuilder.createDashboard')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col overflow-hidden">
      {/* ─── Top bar ─── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 px-4 sm:px-5 py-2.5 border-b border-border bg-card flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0 flex-wrap">
          {/* Dashboard switcher */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md hover:bg-muted/60 transition-colors min-w-0 max-w-[240px]">
                <span className="text-sm font-semibold text-foreground truncate">
                  {activeDashboard?.name || t('dashboardBuilder.selectDashboard')}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-60">
              {dashboards.map(d => (
                <DropdownMenuItem
                  key={d.id}
                  onClick={() => { setActiveDashboardId(d.id); setIsEditing(false); }}
                  className={d.id === activeDashboardId ? 'bg-accent' : ''}
                >
                  <span className="truncate flex-1 text-sm">{d.name}</span>
                  {d.isShared && <Share2 className="h-3 w-3 text-muted-foreground" />}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-3.5 w-3.5 mr-2" />
                {t('dashboardBuilder.createNew')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Actions */}
          {activeDashboard && !isEditing && (
            <>
              <Separator orientation="vertical" className="h-5 mx-1" />
              <div className="flex items-center gap-0.5">
                <Button variant="ghost" size="sm" onClick={handleStartEdit} className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground">
                  <Pencil className="h-3 w-3 mr-1" />
                  {t('dashboardBuilder.edit')}
                </Button>
              </div>
            </>
          )}
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-1.5">
          {!isEditing && activeDashboard && (
            <div className="flex items-center gap-0.5">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={() => setShowShareDialog(true)}>
                    <Share2 className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">{t('dashboardBuilder.share.title')}</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => setDeleteTarget(activeDashboard)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">{t('dashboardBuilder.delete')}</TooltipContent>
              </Tooltip>
            </div>
          )}

          {/* Edit mode toolbar */}
          {isEditing && (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => { setRenameTarget(activeDashboard!); setRenameName(activeDashboard!.name); }} className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground">
                {t('dashboardBuilder.rename')}
              </Button>
              <WidgetPalette onAdd={handleAddWidget} />
              <DateRangeFilter onManualRefresh={silentRefresh} />
              <GridSettingsPopover settings={gridSettings} onChange={handleGridSettingsChange} />
              <Separator orientation="vertical" className="h-5" />
              <Button variant="ghost" size="sm" onClick={handleCancel} className="h-7 px-2.5 text-xs">
                {t('dashboardBuilder.cancel')}
              </Button>
              <Button size="sm" onClick={handleSave} disabled={isUpdating} className="h-7 px-3 text-xs gap-1">
                {isUpdating ? <Loader2Icon className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                {t('dashboardBuilder.save')}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Edit hint bar */}
      {isEditing && (
        <div className="px-4 sm:px-5 py-1.5 bg-muted/40 border-b border-border text-xs text-muted-foreground flex-shrink-0">
          {t('dashboardBuilder.editHint')}
        </div>
      )}

      {/* ─── Grid area ─── */}
      <div className="flex-1 overflow-auto min-h-0 p-3 sm:p-4 bg-muted/20">
        {activeDashboard || isEditing ? (
          <DashboardGrid
            widgets={currentWidgets}
            isEditing={isEditing}
            gridSettings={gridSettings}
            onLayoutChange={handleLayoutChange}
            onRemoveWidget={handleRemoveWidget}
            onEditWidget={handleEditWidget}
          />
        ) : (
          <div className="h-full flex flex-col items-center justify-center gap-3 text-muted-foreground">
            <p className="text-sm">{t('dashboardBuilder.noDashboards')}</p>
            <Button variant="outline" size="sm" onClick={() => setShowCreateDialog(true)} className="gap-1.5 text-xs">
              <Plus className="h-3.5 w-3.5" />
              {t('dashboardBuilder.createFirst')}
            </Button>
          </div>
        )}
      </div>

      {/* Dialogs */}
      {renderCreateDialog()}

      {/* Rename */}
      <Dialog open={!!renameTarget} onOpenChange={() => setRenameTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('dashboardBuilder.renameDashboard')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">{t('dashboardBuilder.dashboardName')}</Label>
            <Input value={renameName} onChange={e => setRenameName(e.target.value)} autoFocus className="h-9"
              onKeyDown={e => e.key === 'Enter' && handleRename()} />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setRenameTarget(null)}>{t('dashboardBuilder.cancel')}</Button>
            <Button size="sm" onClick={handleRename} disabled={isUpdating}>
              {isUpdating && <Loader2Icon className="h-3 w-3 animate-spin mr-1" />}
              {t('dashboardBuilder.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('dashboardBuilder.deleteConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('dashboardBuilder.deleteConfirmDesc', { name: deleteTarget?.name })}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('dashboardBuilder.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t('dashboardBuilder.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Widget Config Panel */}
      <WidgetConfigPanel
        widget={editWidgets.find(w => w.id === configWidgetId) || null}
        open={!!configWidgetId}
        onClose={() => setConfigWidgetId(null)}
        onSave={handleSaveWidgetConfig}
      />

      {/* Share Dialog */}
      <ShareDashboardDialog
        dashboardId={activeDashboard?.id ?? null}
        dashboardName={activeDashboard?.name ?? ''}
        open={showShareDialog}
        onOpenChange={setShowShareDialog}
      />

      {/* AI Dashboard Assistant - integrated side panel */}
      <DashboardAiAssistant open={showAiPanel && aiAssistantAvailable} onClose={() => setShowAiPanel(false)} onApplyWidgets={handleAiApply} />
    </div>
  );
}

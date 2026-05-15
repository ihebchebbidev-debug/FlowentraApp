import React from 'react';
import { useTranslation } from 'react-i18next';
import { DeviceView } from '../../types';
import { Button } from '@/components/ui/button';
import {
  Monitor, Tablet, Smartphone, Undo2, Redo2, Eye,
  PanelLeftClose, PanelLeftOpen,
  PanelRightOpen,
  Palette, Search, Globe, ShieldCheck, Layers, Paintbrush,
  MoreHorizontal, Upload, Inbox, Languages, History,
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

type RightPanel = 'properties' | 'theme' | 'seo' | 'validation' | 'blocks' | 'brands' | 'languages' | 'submissions' | 'versions';

interface EditorToolbarProps {
  device: DeviceView;
  onDeviceChange: (device: DeviceView) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onPreview: () => void;
  onPublish: () => void;
  isPublished: boolean;
  pageName: string;
  siteName: string;
  isComparisonMode: boolean;
  onToggleComparison: () => void;
  isSidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  rightPanel: RightPanel;
  onRightPanelChange: (panel: RightPanel) => void;
  isMobile?: boolean;
  onToggleRightPanel?: () => void;
  isRtlPreview?: boolean;
  onToggleRtlPreview?: () => void;
}

function ToolbarIconButton({
  icon: Icon,
  label,
  active,
  onClick,
  disabled,
}: {
  icon: React.FC<any>;
  label: string;
  active?: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant={active ? 'default' : 'ghost'}
          size="icon"
          className={`h-8 w-8 ${active ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          onClick={onClick}
          disabled={disabled}
        >
          <Icon className="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-xs">{label}</TooltipContent>
    </Tooltip>
  );
}

export function EditorToolbar({
  device,
  onDeviceChange,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onPreview,
  onPublish,
  isPublished,
  pageName,
  siteName,
  isComparisonMode,
  onToggleComparison,
  isSidebarCollapsed,
  onToggleSidebar,
  rightPanel,
  onRightPanelChange,
  isMobile = false,
  onToggleRightPanel,
  isRtlPreview = false,
  onToggleRtlPreview,
}: EditorToolbarProps) {
  const { t } = useTranslation();

  const devices: { key: DeviceView; icon: React.FC<any>; label: string }[] = [
    { key: 'desktop', icon: Monitor, label: t('wb:editor.desktop') },
    { key: 'tablet', icon: Tablet, label: t('wb:editor.tablet') },
    { key: 'mobile', icon: Smartphone, label: t('wb:editor.mobile') },
  ];

  // ── Mobile Toolbar ──
  if (isMobile) {
    return (
      <div className="h-11 border-b border-border/60 bg-card flex items-center justify-between px-2 gap-1">
        <div className="flex items-center gap-1 min-w-0">
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={onToggleSidebar}>
            {isSidebarCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </Button>
          <span className="text-xs font-semibold truncate max-w-[100px]">{siteName}</span>
        </div>
        <div className="flex items-center gap-0.5">
          <Button variant="ghost" size="icon" className="h-7 w-7" disabled={!canUndo} onClick={onUndo}>
            <Undo2 className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" disabled={!canRedo} onClick={onRedo}>
            <Redo2 className="h-3.5 w-3.5" />
          </Button>
        </div>
        <div className="flex items-center gap-0.5">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onToggleRightPanel}>
            <PanelRightOpen className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={onPreview}>
                <Eye className="h-4 w-4 mr-2" /> {t('wb:common.preview')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onPublish}>
                <Upload className="h-4 w-4 mr-2" /> {isPublished ? t('wb:common.published') : t('wb:common.publish')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onRightPanelChange('theme')}>
                <Palette className="h-4 w-4 mr-2" /> {t('wb:editor.theme')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onRightPanelChange('seo')}>
                <Search className="h-4 w-4 mr-2" /> {t('wb:editor.seo')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onRightPanelChange('languages')}>
                <Globe className="h-4 w-4 mr-2" /> {t('wb:editor.languages')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onRightPanelChange('validation')}>
                <ShieldCheck className="h-4 w-4 mr-2" /> {t('wb:editor.validation')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onRightPanelChange('blocks')}>
                <Layers className="h-4 w-4 mr-2" /> {t('wb:editor.globalBlocks')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onRightPanelChange('brands')}>
                <Paintbrush className="h-4 w-4 mr-2" /> {t('wb:editor.brandProfiles')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    );
  }

  // ── Desktop Toolbar ──
  return (
    <TooltipProvider delayDuration={150}>
      <div className="h-12 border-b border-border/60 bg-card flex items-center px-3 gap-2">
        <div className="flex items-center gap-1.5 min-w-0 shrink-0">
          <ToolbarIconButton
            icon={isSidebarCollapsed ? PanelLeftOpen : PanelLeftClose}
            label={isSidebarCollapsed ? t('wb:editor.showSidebar') : t('wb:editor.hideSidebar')}
            onClick={onToggleSidebar}
          />
          <div className="flex items-center gap-1 text-sm min-w-0 ml-1">
            <span className="font-semibold truncate max-w-[120px]">{siteName}</span>
            <span className="text-muted-foreground/40">/</span>
            <span className="text-muted-foreground truncate max-w-[100px] text-xs">{pageName}</span>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center gap-1">
          <div className="inline-flex items-center bg-muted/50 rounded-lg p-0.5 border border-border/40">
            {devices.map(d => {
              const Icon = d.icon;
              const isActive = device === d.key && !isComparisonMode;
              return (
                <button
                  key={d.key}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  onClick={() => { onDeviceChange(d.key); if (isComparisonMode) onToggleComparison(); }}
                  disabled={isComparisonMode}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span className="hidden lg:inline">{d.label}</span>
                </button>
              );
            })}
            
            <div className="w-px h-5 bg-border/60 mx-1" />
            <button
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                isRtlPreview
                  ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              onClick={onToggleRtlPreview}
              title={t('wb:editor.rtlPreview')}
            >
              <Languages className="h-3.5 w-3.5" />
              <span className="hidden lg:inline">{t('wb:editor.rtl')}</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-0.5 shrink-0">
          <ToolbarIconButton icon={Undo2} label={t('wb:editor.undo')} onClick={onUndo} disabled={!canUndo} />
          <ToolbarIconButton icon={Redo2} label={t('wb:editor.redo')} onClick={onRedo} disabled={!canRedo} />

          <Separator orientation="vertical" className="h-5 mx-1" />

          <ToolbarIconButton
            icon={Palette}
            label={t('wb:editor.theme')}
            active={rightPanel === 'theme'}
            onClick={() => onRightPanelChange(rightPanel === 'theme' ? 'properties' : 'theme')}
          />
          <ToolbarIconButton
            icon={Search}
            label={t('wb:editor.seo')}
            active={rightPanel === 'seo'}
            onClick={() => onRightPanelChange(rightPanel === 'seo' ? 'properties' : 'seo')}
          />
          <ToolbarIconButton
            icon={Globe}
            label={t('wb:editor.languages')}
            active={rightPanel === 'languages'}
            onClick={() => onRightPanelChange(rightPanel === 'languages' ? 'properties' : 'languages')}
          />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => onRightPanelChange('submissions')}>
                <Inbox className="h-4 w-4 mr-2" /> {t('wb:editor.submissions')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onRightPanelChange('versions')}>
                <History className="h-4 w-4 mr-2" /> {t('wb:editor.pageVersions')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onRightPanelChange('validation')}>
                <ShieldCheck className="h-4 w-4 mr-2" /> {t('wb:editor.validation')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onRightPanelChange('blocks')}>
                <Layers className="h-4 w-4 mr-2" /> {t('wb:editor.globalBlocks')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onRightPanelChange('brands')}>
                <Paintbrush className="h-4 w-4 mr-2" /> {t('wb:editor.brandProfiles')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Separator orientation="vertical" className="h-5 mx-1" />

          <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={onPreview}>
            <Eye className="h-3.5 w-3.5" />
            {t('wb:common.preview')}
          </Button>
          <Button
            size="sm"
            className={`h-8 text-xs gap-1.5 ${isPublished ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}`}
            onClick={onPublish}
          >
            <Upload className="h-3.5 w-3.5" />
            {isPublished ? t('wb:common.published') : t('wb:common.publish')}
          </Button>
        </div>
      </div>
    </TooltipProvider>
  );
}

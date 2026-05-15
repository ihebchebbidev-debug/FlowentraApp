/**
 * Pages tab content — extracted from SiteEditor left panel.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { WebsiteSite } from '../../types';
import { Button } from '@/components/ui/button';
import { FileText, Plus, Trash2, Globe, Home, Copy } from 'lucide-react';

interface PagesTabProps {
  site: WebsiteSite;
  currentPageId: string;
  activeLanguage: string | null;
  activeLangLabel: string | null;
  rightPanel: string;
  isMobile: boolean;
  onSelectPage: (id: string) => void;
  onDuplicatePage: (id: string) => void;
  onDeletePage: (id: string) => void;
  onShowPageDialog: () => void;
  onClearLanguage: () => void;
  onOpenLanguages: () => void;
  onCloseMobile?: () => void;
}

export function PagesTab({
  site,
  currentPageId,
  activeLanguage,
  activeLangLabel,
  rightPanel,
  isMobile,
  onSelectPage,
  onDuplicatePage,
  onDeletePage,
  onShowPageDialog,
  onClearLanguage,
  onOpenLanguages,
  onCloseMobile,
}: PagesTabProps) {
  const { t } = useTranslation();

  return (
    <div className="p-3 space-y-2">
      {/* Active language badge */}
      {activeLangLabel && (
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-primary/8 border border-primary/15">
          <Globe className="h-3 w-3 text-primary" />
          <span className="text-[10px] font-semibold text-primary flex-1">
            {t('wb:editor.editingLanguage', { language: activeLangLabel })}
          </span>
          <button
            className="text-[10px] text-primary/70 hover:text-primary underline"
            onClick={onClearLanguage}
          >
            {t('wb:editor.default')}
          </button>
        </div>
      )}

      {/* Page list */}
      <div className="space-y-0.5">
        {site.pages.map(pg => (
          <div
            key={pg.id}
            className={`flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs cursor-pointer group transition-all ${
              pg.id === currentPageId
                ? 'bg-primary/8 text-primary font-semibold ring-1 ring-primary/15'
                : 'hover:bg-muted/50 text-foreground'
            }`}
            onClick={() => {
              onSelectPage(pg.id);
              if (isMobile) onCloseMobile?.();
            }}
          >
            {pg.isHomePage ? (
              <Home className="h-3.5 w-3.5 shrink-0 opacity-60" />
            ) : (
              <FileText className="h-3.5 w-3.5 shrink-0 opacity-60" />
            )}
            <span className="flex-1 truncate">{pg.title}</span>
            {(site.languages?.length ?? 0) > 0 && (
              <span className="text-[9px] text-muted-foreground/40 tabular-nums">
                {Object.keys(pg.translations || {}).length}/{site.languages?.length || 0}
              </span>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => { e.stopPropagation(); onDuplicatePage(pg.id); }}
              title={t('wb:editor.duplicatePage')}
            >
              <Copy className="h-3 w-3 text-muted-foreground" />
            </Button>
            {!pg.isHomePage && (
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => { e.stopPropagation(); onDeletePage(pg.id); }}
                title={t('wb:editor.deletePage')}
              >
                <Trash2 className="h-3 w-3 text-destructive" />
              </Button>
            )}
          </div>
        ))}
      </div>

      {/* Add page */}
      <Button
        variant="outline"
        size="sm"
        className="w-full h-8 text-xs border-dashed gap-1.5"
        onClick={onShowPageDialog}
      >
        <Plus className="h-3 w-3" /> {t('wb:editor.addPage')}
      </Button>

      {/* Quick language access */}
      <Button
        variant={rightPanel === 'languages' ? 'default' : 'outline'}
        size="sm"
        className="w-full h-8 text-xs gap-1.5"
        onClick={onOpenLanguages}
      >
        <Globe className="h-3 w-3" /> {t('wb:editor.manageLanguages')}
      </Button>
    </div>
  );
}

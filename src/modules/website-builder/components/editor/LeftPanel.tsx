/**
 * Left panel content — tabs for Blocks and Pages.
 */
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { WebsiteSite } from '../../types';
import { ComponentPalette } from './ComponentPalette';
import { PagesTab } from './PagesTab';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ArrowLeft, FileText, Layers, X, ArrowDown } from 'lucide-react';

interface LeftPanelProps {
  site: WebsiteSite;
  currentPageId: string;
  activeLanguage: string | null;
  activeLangLabel: string | null;
  rightPanel: string;
  isMobile: boolean;
  insertAtIndex?: number | null;
  onBack: () => void;
  onAddComponent: (type: string) => void;
  onSelectPage: (id: string) => void;
  onDuplicatePage: (id: string) => void;
  onDeletePage: (id: string) => void;
  onShowPageDialog: () => void;
  onClearLanguage: () => void;
  onOpenLanguages: () => void;
  onCloseMobile?: () => void;
  onCancelInsert?: () => void;
}

export function LeftPanel({
  site,
  currentPageId,
  activeLanguage,
  activeLangLabel,
  rightPanel,
  isMobile,
  insertAtIndex,
  onBack,
  onAddComponent,
  onSelectPage,
  onDuplicatePage,
  onDeletePage,
  onShowPageDialog,
  onClearLanguage,
  onOpenLanguages,
  onCloseMobile,
  onCancelInsert,
}: LeftPanelProps) {
  const { t } = useTranslation();
  const [leftTab, setLeftTab] = useState<'pages' | 'components'>('components');
  const isInserting = insertAtIndex !== null && insertAtIndex !== undefined;

  return (
    <div className="h-full flex flex-col">
      {/* Back button */}
      <div className="px-2 pt-2 pb-1">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start h-7 text-xs text-muted-foreground hover:text-foreground gap-1.5"
          onClick={() => { onBack(); onCloseMobile?.(); }}
        >
          <ArrowLeft className="h-3 w-3" />
          {t('wb:common.backToSites')}
        </Button>
      </div>

      {/* Insertion context banner */}
      {isInserting && (
        <div className="mx-2 mb-1 px-3 py-2 rounded-lg bg-primary/10 border border-primary/20 flex items-center gap-2">
          <ArrowDown className="h-3.5 w-3.5 text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-medium text-primary">
              {t('wb:editor.insertAtPosition', { position: insertAtIndex! + 1 })}
            </p>
            <p className="text-[9px] text-primary/70">{t('wb:editor.clickBlockToInsert')}</p>
          </div>
          <button
            onClick={onCancelInsert}
            className="p-0.5 rounded hover:bg-primary/10 text-primary/60 hover:text-primary transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={leftTab} onValueChange={(v) => setLeftTab(v as 'pages' | 'components')} className="flex-1 flex flex-col min-h-0">
        <div className="px-2">
          <TabsList className="w-full h-8 bg-muted/40 p-0.5">
            <TabsTrigger value="components" className="flex-1 h-7 text-[11px] font-medium gap-1 data-[state=active]:shadow-sm">
              <Layers className="h-3 w-3" />
              {t('wb:common.blocks')}
            </TabsTrigger>
            <TabsTrigger value="pages" className="flex-1 h-7 text-[11px] font-medium gap-1 data-[state=active]:shadow-sm">
              <FileText className="h-3 w-3" />
              {t('wb:common.pages')}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="components" className="flex-1 min-h-0 mt-0">
          <ComponentPalette onAdd={(type) => { onAddComponent(type); onCloseMobile?.(); }} />
        </TabsContent>
        <TabsContent value="pages" className="flex-1 min-h-0 mt-0 overflow-auto">
          <PagesTab
            site={site}
            currentPageId={currentPageId}
            activeLanguage={activeLanguage}
            activeLangLabel={activeLangLabel}
            rightPanel={rightPanel}
            isMobile={isMobile}
            onSelectPage={onSelectPage}
            onDuplicatePage={onDuplicatePage}
            onDeletePage={onDeletePage}
            onShowPageDialog={onShowPageDialog}
            onClearLanguage={onClearLanguage}
            onOpenLanguages={onOpenLanguages}
            onCloseMobile={onCloseMobile}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

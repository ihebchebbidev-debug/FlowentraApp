import React, { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { WebsiteSite } from '../types';
import { getStorageProvider } from '../services/storageProvider';
import { PublishDialog } from './PublishDialog';
import { AddPageDialog } from './AddPageDialog';
import { useEditorState } from '../hooks/useEditorState';
import { useSiteActions } from '../hooks/useSiteActions';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { EditorToolbar } from './editor/EditorToolbar';
import { EditorCanvas } from './editor/EditorCanvas';
import { LeftPanel } from './editor/LeftPanel';
import { RightPanelContent, RightPanel } from './editor/RightPanelContent';
import { DeviceComparison } from './editor/DeviceComparison';
import { ComponentRenderer } from './renderer/ComponentRenderer';
import { Button } from '@/components/ui/button';
import { ClipboardPaste } from 'lucide-react';
import { createLogger } from '@/utils/logger';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

interface SiteEditorProps {
  site: WebsiteSite;
  onBack: () => void;
  onSiteUpdate: (site: WebsiteSite) => void;
}

export function SiteEditor({ site, onBack, onSiteUpdate }: SiteEditorProps) {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [currentPageId, setCurrentPageId] = useState(site.pages[0]?.id || '');
  const [showPageDialog, setShowPageDialog] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [rightPanel, setRightPanel] = useState<RightPanel>('properties');
  const [isComparisonMode, setIsComparisonMode] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showPublish, setShowPublish] = useState(false);
  const [activeLanguage, setActiveLanguage] = useState<string | null>(null);
  const [isRtlPreview, setIsRtlPreview] = useState(false);
  const [insertAtIndex, setInsertAtIndex] = useState<number | null>(null);

  const [mobileLeftOpen, setMobileLeftOpen] = useState(false);
  const [mobileRightOpen, setMobileRightOpen] = useState(false);

  const siteActions = useSiteActions({
    site,
    currentPageId,
    activeLanguage,
    onSiteUpdate,
    setCurrentPageId,
  });

  const { currentPage } = siteActions;

  const activeComponents = useMemo(() => {
    if (!currentPage) return [];
    if (activeLanguage && currentPage.translations?.[activeLanguage]) {
      return currentPage.translations[activeLanguage].components;
    }
    return currentPage.components;
  }, [currentPage, activeLanguage]);

  const editor = useEditorState({
    initialComponents: activeComponents,
    onSave: siteActions.handleSaveComponents,
    resetKey: `${currentPageId}__${activeLanguage || 'default'}`,
  });

  useKeyboardShortcuts(editor);

  const handleToggleSidebar = useCallback(() => {
    if (isMobile) {
      setMobileLeftOpen(prev => !prev);
    } else {
      setIsSidebarCollapsed(prev => !prev);
    }
  }, [isMobile]);

  const handleRightPanelChange = useCallback((panel: RightPanel) => {
    setRightPanel(panel);
    if (isMobile) setMobileRightOpen(true);
  }, [isMobile]);

  const activeLangLabel = activeLanguage
    ? site.languages?.find(l => l.code === activeLanguage)?.label || activeLanguage.toUpperCase()
    : null;

  const handleUpdateComponentProps = useCallback((id: string, newProps: Record<string, any>) => {
    editor.updateComponentProps(id, newProps);
    if ('currentLanguage' in newProps) {
      const langCode = newProps.currentLanguage;
      const defaultLang = site.defaultLanguage || 'en';
      setActiveLanguage(langCode === defaultLang ? null : langCode);
    }
  }, [editor.updateComponentProps, site.defaultLanguage]);

  const handleCanvasSelect = useCallback((id: string) => {
    editor.setSelectedId(id);
    if (id) {
      setRightPanel('properties');
      if (isMobile) setMobileRightOpen(true);
    }
  }, [editor.setSelectedId, isMobile]);

  const rightPanelProps = useMemo(() => ({
    rightPanel,
    site,
    currentPage,
    activeLanguage,
    components: editor.components,
    selectedComponent: editor.selectedComponent,
    onThemeChange: siteActions.handleThemeChange,
    onSeoChange: siteActions.handleSeoChange,
    onSlugChange: siteActions.handleSlugChange,
    onPageTitleChange: siteActions.handlePageTitleChange,
    onSelectComponent: (id: string) => editor.setSelectedId(id),
    onInsertBlock: editor.insertComponent,
    onUpdateProps: handleUpdateComponentProps,
    onUpdateStyles: editor.updateComponentStyles,
    onUpdateAnimation: editor.updateComponentAnimation,
    onRemove: editor.removeComponent,
    onDuplicate: editor.duplicateComponent,
    onCopy: editor.copyComponent,
    onMove: editor.moveComponent,
    onDeselect: () => editor.setSelectedId(null),
    onActiveLanguageChange: setActiveLanguage,
    onSiteUpdateFromLanguageManager: siteActions.handleSiteUpdateFromLanguageManager,
    onRestoreVersion: async () => {
      try {
        const provider = getStorageProvider();
        const result = await provider.getSite(site.id);
        if (result.data) {
          onSiteUpdate(result.data);
        }
      } catch (err) {
        createLogger('WB:Editor').error('Failed to refresh after version restore:', err);
      }
    },
    isMobile,
    setRightPanel,
  }), [
    rightPanel, site, currentPage, activeLanguage,
    editor.components, editor.selectedComponent,
    editor.setSelectedId, editor.insertComponent, handleUpdateComponentProps,
    editor.updateComponentStyles, editor.updateComponentAnimation,
    editor.removeComponent, editor.duplicateComponent, editor.copyComponent,
    editor.moveComponent, siteActions, isMobile,
  ]);

  const handleAddComponent = useCallback((type: string) => {
    if (insertAtIndex !== null) {
      editor.insertComponentAt(type, insertAtIndex);
      setInsertAtIndex(null);
    } else {
      editor.addComponent(type);
    }
  }, [editor.addComponent, editor.insertComponentAt, insertAtIndex]);

  const leftPanelProps = useMemo(() => ({
    site,
    currentPageId,
    activeLanguage,
    activeLangLabel,
    rightPanel,
    isMobile,
    insertAtIndex,
    onBack,
    onAddComponent: handleAddComponent,
    onSelectPage: setCurrentPageId,
    onDuplicatePage: siteActions.handleDuplicatePage,
    onDeletePage: siteActions.handleDeletePage,
    onShowPageDialog: () => setShowPageDialog(true),
    onClearLanguage: () => setActiveLanguage(null),
    onOpenLanguages: () => handleRightPanelChange('languages'),
    onCancelInsert: () => setInsertAtIndex(null),
  }), [
    site, currentPageId, activeLanguage, activeLangLabel, rightPanel,
    isMobile, insertAtIndex, onBack, handleAddComponent, siteActions, handleRightPanelChange,
  ]);

  // Preview mode
  if (showPreview && currentPage) {
    const handlePreviewUpdate = (id: string, newProps: Record<string, any>) => {
      if ('currentLanguage' in newProps) {
        const langCode = newProps.currentLanguage;
        const defaultLang = site.defaultLanguage || 'en';
        setActiveLanguage(langCode === defaultLang ? null : langCode);
      }
    };

    return (
      <div className="h-full flex flex-col">
        <div className="h-12 border-b border-border/60 bg-card flex items-center justify-between px-4">
          <span className="text-sm font-semibold">{t('wb:common.preview')}: {currentPage.title}{activeLangLabel ? ` (${activeLangLabel})` : ''}</span>
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setShowPreview(false)}>
            {t('wb:editor.closePreview')}
          </Button>
        </div>
        <div className="flex-1 overflow-auto bg-background">
          {editor.components.map(comp => (
            <ComponentRenderer key={comp.id} component={comp} device={editor.device} theme={site.theme} activeLanguage={activeLanguage} onUpdate={handlePreviewUpdate} />
          ))}
        </div>
      </div>
    );
  }

  const rightPanelTitleMap: Record<string, string> = {
    seo: t('wb:editor.seoSettings'),
    blocks: t('wb:editor.globalBlocks'),
    brands: t('wb:editor.brandProfiles'),
    languages: t('wb:editor.languages'),
    versions: t('wb:editor.pageVersions'),
    properties: t('wb:editor.properties'),
    theme: t('wb:editor.theme'),
    validation: t('wb:editor.validation'),
    submissions: t('wb:editor.submissions'),
  };
  const rightPanelTitle = rightPanelTitleMap[rightPanel] || rightPanel.charAt(0).toUpperCase() + rightPanel.slice(1);

  return (
    <div className="h-full flex flex-col bg-background">
      <EditorToolbar
        device={editor.device}
        onDeviceChange={editor.setDevice}
        canUndo={editor.canUndo}
        canRedo={editor.canRedo}
        onUndo={editor.undo}
        onRedo={editor.redo}
        onPreview={() => setShowPreview(true)}
        onPublish={() => setShowPublish(true)}
        isPublished={site.published}
        pageName={currentPage?.title || ''}
        siteName={site.name}
        isComparisonMode={isComparisonMode}
        onToggleComparison={() => setIsComparisonMode(prev => !prev)}
        isSidebarCollapsed={isMobile ? !mobileLeftOpen : isSidebarCollapsed}
        onToggleSidebar={handleToggleSidebar}
        rightPanel={rightPanel}
        onRightPanelChange={handleRightPanelChange}
        isMobile={isMobile}
        onToggleRightPanel={() => setMobileRightOpen(prev => !prev)}
        isRtlPreview={isRtlPreview}
        onToggleRtlPreview={() => setIsRtlPreview(prev => !prev)}
      />

      <div className="flex-1 flex overflow-hidden">
        {!isMobile && (
          <div
            className={`border-r border-border/60 bg-card flex flex-col shrink-0 transition-all duration-300 ease-in-out overflow-hidden ${
              isSidebarCollapsed ? 'w-0 border-r-0' : 'w-64'
            }`}
          >
            <div className="w-64 h-full flex flex-col">
              <LeftPanel {...leftPanelProps} />
            </div>
          </div>
        )}

        {isComparisonMode ? (
          <DeviceComparison components={editor.components} theme={site.theme} />
        ) : (
          <div className="flex-1 relative overflow-hidden flex flex-col">
            <EditorCanvas
              components={editor.components}
              device={isMobile ? 'mobile' : editor.device}
              theme={{ ...site.theme, direction: isRtlPreview ? 'rtl' : site.theme.direction }}
              selectedId={editor.selectedId}
              activeLanguage={activeLanguage}
              onSelect={handleCanvasSelect}
              onUpdate={handleUpdateComponentProps}
              onReorder={editor.reorderComponents}
              onInsertAt={(index: number) => {
                setInsertAtIndex(index);
                if (isMobile) setMobileLeftOpen(true);
              }}
              onDropBlockAt={(blockType: string, index: number) => {
                editor.insertComponentAt(blockType, index);
              }}
              isRtlPreview={isRtlPreview}
            />
            {editor.hasClipboard && (
              <Button
                variant="outline"
                size="sm"
                className="absolute bottom-4 right-4 h-8 text-xs gap-1.5 bg-background/90 backdrop-blur-sm shadow-lg border-primary/20 hover:bg-primary/5 z-20"
                onClick={() => editor.pasteComponent()}
              >
                <ClipboardPaste className="h-3.5 w-3.5" /> {t('wb:common.pasteBlock')}
              </Button>
            )}
          </div>
        )}

        {!isMobile && (rightPanel !== 'properties' || editor.selectedComponent) && (
          <div className="w-72 border-l border-border/60 bg-card shrink-0 overflow-y-auto">
            <RightPanelContent {...rightPanelProps} />
          </div>
        )}
      </div>

      {isMobile && (
        <Sheet open={mobileLeftOpen} onOpenChange={setMobileLeftOpen}>
          <SheetContent side="left" className="w-72 p-0 flex flex-col">
            <SheetHeader className="px-4 py-3 border-b border-border/60">
              <SheetTitle className="text-sm font-semibold">{t('wb:editor.editorPanel')}</SheetTitle>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto flex flex-col">
              <LeftPanel {...leftPanelProps} onCloseMobile={() => setMobileLeftOpen(false)} />
            </div>
          </SheetContent>
        </Sheet>
      )}

      {isMobile && (
        <Sheet open={mobileRightOpen} onOpenChange={setMobileRightOpen}>
          <SheetContent side="right" className="w-80 p-0 flex flex-col">
            <SheetHeader className="px-4 py-3 border-b border-border/60">
              <SheetTitle className="text-sm font-semibold capitalize">
                {rightPanelTitle}
              </SheetTitle>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto">
              <RightPanelContent
                {...rightPanelProps}
                onCloseMobileRight={() => setMobileRightOpen(false)}
              />
            </div>
          </SheetContent>
        </Sheet>
      )}

      <AddPageDialog
        open={showPageDialog}
        onOpenChange={setShowPageDialog}
        onAddPage={siteActions.handleAddPage}
        existingPageCount={site.pages.length}
      />

      <PublishDialog
        site={site}
        open={showPublish}
        onOpenChange={setShowPublish}
        onSiteUpdate={onSiteUpdate}
      />
    </div>
  );
}

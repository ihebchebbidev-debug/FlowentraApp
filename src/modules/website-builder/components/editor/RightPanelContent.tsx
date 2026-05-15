/**
 * Right panel content — switches between all right-panel views.
 */
import React from 'react';
import { WebsiteSite, SitePage, BuilderComponent, SiteTheme, PageSEO, AnimationSettings } from '../../types';
import { ThemeEditor } from './ThemeEditor';
import { SeoPanel } from './SeoPanel';
import { ValidationPanel } from './ValidationPanel';
import { GlobalBlocksPanel } from './GlobalBlocksPanel';
import { FormSubmissionsPanel } from './FormSubmissionsPanel';
import { BrandProfilesPanel } from './BrandProfilesPanel';
import { LanguageManager } from './LanguageManager';
import { PropertiesPanel } from './PropertiesPanel';
import { PageVersionsPanel } from './PageVersionsPanel';

export type RightPanel = 'properties' | 'theme' | 'seo' | 'validation' | 'blocks' | 'brands' | 'languages' | 'submissions' | 'versions';

interface RightPanelContentProps {
  rightPanel: RightPanel;
  site: WebsiteSite;
  currentPage: SitePage | undefined;
  activeLanguage: string | null;
  // Editor state
  components: BuilderComponent[];
  selectedComponent: BuilderComponent | null;
  // Callbacks
  onThemeChange: (theme: SiteTheme) => void;
  onSeoChange: (seo: PageSEO) => void;
  onSlugChange: (slug: string) => void;
  onPageTitleChange: (title: string) => void;
  onSelectComponent: (id: string) => void;
  onInsertBlock: (comp: BuilderComponent) => void;
  onUpdateProps: (id: string, props: Record<string, any>) => void;
  onUpdateStyles: (id: string, styles: Record<string, any>) => void;
  onUpdateAnimation: (id: string, animation: AnimationSettings) => void;
  onRemove: (id: string) => void;
  onDuplicate: (id: string) => void;
  onCopy: (id: string) => void;
  onMove: (id: string, direction: 'up' | 'down') => void;
  onDeselect: () => void;
  onActiveLanguageChange: (lang: string | null) => void;
  onSiteUpdateFromLanguageManager: (site: WebsiteSite) => void;
  onRestoreVersion: () => void;
  // Mobile callbacks
  isMobile: boolean;
  setRightPanel: (panel: RightPanel) => void;
  onCloseMobileRight?: () => void;
}

export function RightPanelContent({
  rightPanel,
  site,
  currentPage,
  activeLanguage,
  components,
  selectedComponent,
  onThemeChange,
  onSeoChange,
  onSlugChange,
  onPageTitleChange,
  onSelectComponent,
  onInsertBlock,
  onUpdateProps,
  onUpdateStyles,
  onUpdateAnimation,
  onRemove,
  onDuplicate,
  onCopy,
  onMove,
  onDeselect,
  onActiveLanguageChange,
  onSiteUpdateFromLanguageManager,
  onRestoreVersion,
  isMobile,
  setRightPanel,
  onCloseMobileRight,
}: RightPanelContentProps) {
  if (rightPanel === 'theme') {
    return <ThemeEditor theme={site.theme} onChange={onThemeChange} />;
  }

  if (rightPanel === 'seo' && currentPage) {
    return (
      <SeoPanel
        seo={currentPage.seo}
        slug={currentPage.slug}
        pageTitle={currentPage.title}
        onChange={onSeoChange}
        onSlugChange={onSlugChange}
        onPageTitleChange={onPageTitleChange}
      />
    );
  }

  if (rightPanel === 'validation') {
    return (
      <ValidationPanel
        components={components}
        onSelectComponent={(id) => {
          onSelectComponent(id);
          setRightPanel('properties');
          onCloseMobileRight?.();
        }}
      />
    );
  }

  if (rightPanel === 'blocks') {
    return (
      <GlobalBlocksPanel
        onInsertBlock={(comp) => {
          onInsertBlock(comp);
          onCloseMobileRight?.();
        }}
        selectedComponent={selectedComponent}
        siteId={site.id}
      />
    );
  }

  if (rightPanel === 'brands') {
    return (
      <BrandProfilesPanel
        currentTheme={site.theme}
        onApplyTheme={onThemeChange}
      />
    );
  }

  if (rightPanel === 'languages') {
    return (
      <LanguageManager
        site={site}
        currentPage={currentPage}
        activeLanguage={activeLanguage}
        onActiveLanguageChange={onActiveLanguageChange}
        onSiteUpdate={onSiteUpdateFromLanguageManager}
      />
    );
  }

  if (rightPanel === 'submissions') {
    return <FormSubmissionsPanel siteId={site.id} />;
  }

  if (rightPanel === 'versions' && currentPage) {
    return (
      <PageVersionsPanel
        pageId={currentPage.id}
        pageTitle={currentPage.title}
        onRestore={onRestoreVersion}
      />
    );
  }

  if (rightPanel === 'properties' && selectedComponent) {
    return (
      <PropertiesPanel
        component={selectedComponent}
        onUpdate={onUpdateProps}
        onUpdateStyles={onUpdateStyles}
        onUpdateAnimation={onUpdateAnimation}
        onRemove={onRemove}
        onDuplicate={onDuplicate}
        onCopy={onCopy}
        onMove={onMove}
        onDeselect={onDeselect}
      />
    );
  }

  return null;
}

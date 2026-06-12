import React, { useState, useEffect, useRef } from 'react';
import { WebsiteSite } from './types';
import { SiteManager } from './components/SiteManager';
import { SiteEditor } from './components/SiteEditor';
import { useSidebar } from '@/components/ui/sidebar';
import { initApiProviders } from './services/storageProvider';
import { PluginGate } from "@/modules/shared/plugins";

export function WebsiteBuilderModule() {
  const [editingSite, setEditingSite] = useState<WebsiteSite | null>(null);
  const [providersReady, setProvidersReady] = useState(false);

  // Collapse main app sidebar when entering the editor, restore on exit
  let sidebar: ReturnType<typeof useSidebar> | null = null;
  try { sidebar = useSidebar(); } catch { /* not inside SidebarProvider (e.g. topbar layout) */ }

  const prevOpenRef = useRef<boolean | null>(null);

  // Initialize API providers before any data fetch — avoids the SiteManager
  // briefly reading the synchronous localStorage fallback provider.
  useEffect(() => {
    let active = true;
    initApiProviders().finally(() => { if (active) setProvidersReady(true); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!sidebar) return;
    if (editingSite) {
      // Save current state and collapse
      prevOpenRef.current = sidebar.open;
      sidebar.setOpen(false);
    } else if (prevOpenRef.current !== null) {
      // Restore previous state
      sidebar.setOpen(prevOpenRef.current);
      prevOpenRef.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!editingSite]);

  // Re-open sidebar when component unmounts (user navigates away)
  useEffect(() => {
    return () => {
      if (sidebar && prevOpenRef.current !== null) {
        sidebar.setOpen(true);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleEditSite = (site: WebsiteSite) => {
    setEditingSite(site);
  };

  const handleBack = () => {
    setEditingSite(null);
  };

  const handleSiteUpdate = (updatedSite: WebsiteSite) => {
    setEditingSite(updatedSite);
  };

  return (
    <PluginGate code="PL0038WEBSITEBLDR">
      {editingSite ? (
        <div className="h-[calc(100dvh-4rem)]">
          <SiteEditor
            site={editingSite}
            onBack={handleBack}
            onSiteUpdate={handleSiteUpdate}
          />
        </div>
      ) : !providersReady ? (
        <div className="flex items-center justify-center h-[calc(100dvh-4rem)]">
          <div className="h-8 w-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
        </div>
      ) : (
        <SiteManager onEditSite={handleEditSite} />
      )}
    </PluginGate>
  );
}

export default WebsiteBuilderModule;

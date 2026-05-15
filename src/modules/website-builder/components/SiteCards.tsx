/**
 * Site card components used by SiteManager for grid, list, and table views.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { WebsiteSite } from '../types';
import { Button } from '@/components/ui/button';
import { Globe, Edit, ExternalLink, Clock, Trash2 } from 'lucide-react';
import { SiteMiniPreview } from './SiteMiniPreview';

interface SiteCardProps {
  site: WebsiteSite;
  onEdit: (site: WebsiteSite) => void;
  onDelete: (site: WebsiteSite) => void;
}

export function SiteGridCard({ site, onEdit, onDelete }: SiteCardProps) {
  const { t } = useTranslation();
  const homePage = site.pages.find(p => p.isHomePage) || site.pages[0];
  const hasComponents = homePage && homePage.components.length > 0;

  return (
    <div
      className="group border rounded-xl bg-card p-5 hover:shadow-md transition-all cursor-pointer"
      onClick={() => onEdit(site)}
    >
      <div
        className="aspect-video rounded-lg bg-muted mb-4 overflow-hidden relative"
        style={hasComponents ? { backgroundColor: site.theme.backgroundColor } : undefined}
      >
        {hasComponents ? (
          <SiteMiniPreview site={site} />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Globe className="h-8 w-8 text-muted-foreground/30" />
          </div>
        )}
        <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Edit className="h-5 w-5 text-primary" />
        </div>
      </div>
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <h3 className="font-semibold text-sm truncate">{site.name}</h3>
          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
            <Clock className="h-3 w-3" />
            {new Date(site.updatedAt).toLocaleDateString()}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {site.pages.length} {site.pages.length !== 1 ? t('wb:common.pages_plural') : t('wb:common.page')}
          </p>
        </div>
        <div className="flex gap-1">
          {site.published && (
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => e.stopPropagation()}>
              <ExternalLink className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button
            variant="ghost" size="icon"
            className="h-7 w-7 text-destructive opacity-0 group-hover:opacity-100"
            onClick={(e) => { e.stopPropagation(); onDelete(site); }}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
          site.published ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
        }`}>
          {site.published ? t('wb:common.published') : t('wb:common.draft')}
        </span>
        <div className="flex gap-0.5 ml-auto">
          {[site.theme.primaryColor, site.theme.accentColor, site.theme.secondaryColor].map((c, i) => (
            <div key={i} className="w-2.5 h-2.5 rounded-full border border-border/50" style={{ backgroundColor: c }} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function SiteListItem({ site, onEdit, onDelete }: SiteCardProps) {
  const { t } = useTranslation();
  return (
    <div
      className="group flex items-center gap-4 p-3 border rounded-lg bg-card hover:shadow-sm transition-all cursor-pointer"
      onClick={() => onEdit(site)}
    >
      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
        <Globe className="h-5 w-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-sm truncate">{site.name}</h3>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 ${
            site.published ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
          }`}>
            {site.published ? t('wb:common.published') : t('wb:common.draft')}
          </span>
        </div>
        <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
          <span>{site.pages.length} {site.pages.length !== 1 ? t('wb:common.pages_plural') : t('wb:common.page')}</span>
          <span>·</span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {new Date(site.updatedAt).toLocaleDateString()}
          </span>
        </div>
      </div>
      <div className="flex gap-1 shrink-0">
        <Button variant="outline" size="sm" className="h-8 text-xs opacity-0 group-hover:opacity-100"
          onClick={(e) => { e.stopPropagation(); onEdit(site); }}>
          <Edit className="h-3 w-3 mr-1" /> {t('wb:common.edit')}
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100"
          onClick={(e) => { e.stopPropagation(); onDelete(site); }}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

export function SiteTableView({ sites, onEdit, onDelete }: { sites: WebsiteSite[]; onEdit: (s: WebsiteSite) => void; onDelete: (s: WebsiteSite) => void }) {
  const { t } = useTranslation();
  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="text-left text-xs font-medium text-muted-foreground p-3">{t('wb:manager.name')}</th>
            <th className="text-left text-xs font-medium text-muted-foreground p-3 hidden sm:table-cell">{t('wb:manager.statusLabel')}</th>
            <th className="text-left text-xs font-medium text-muted-foreground p-3 hidden md:table-cell">{t('wb:common.pages')}</th>
            <th className="text-left text-xs font-medium text-muted-foreground p-3 hidden lg:table-cell">{t('wb:manager.dateCreated')}</th>
            <th className="text-left text-xs font-medium text-muted-foreground p-3">{t('wb:manager.lastUpdated')}</th>
            <th className="text-right text-xs font-medium text-muted-foreground p-3"></th>
          </tr>
        </thead>
        <tbody>
          {sites.map(site => (
            <tr key={site.id} className="border-b hover:bg-muted/30 cursor-pointer transition-colors" onClick={() => onEdit(site)}>
              <td className="p-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-7 rounded border border-border/50 shrink-0 overflow-hidden relative"
                    style={{ backgroundColor: site.theme.backgroundColor }}
                  >
                    <div className="absolute inset-x-0 top-0 h-1.5" style={{ backgroundColor: site.theme.primaryColor }} />
                    <div className="absolute bottom-1 left-1 right-1 flex gap-0.5">
                      {[site.theme.primaryColor, site.theme.accentColor, site.theme.secondaryColor].map((c, i) => (
                        <div key={i} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c }} />
                      ))}
                    </div>
                  </div>
                  <span className="text-sm font-medium truncate">{site.name}</span>
                </div>
              </td>
              <td className="p-3 hidden sm:table-cell">
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                  site.published ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  {site.published ? t('wb:common.published') : t('wb:common.draft')}
                </span>
              </td>
              <td className="p-3 text-sm text-muted-foreground hidden md:table-cell">{site.pages.length}</td>
              <td className="p-3 text-sm text-muted-foreground hidden lg:table-cell">{new Date(site.createdAt).toLocaleDateString()}</td>
              <td className="p-3 text-sm text-muted-foreground">{new Date(site.updatedAt).toLocaleDateString()}</td>
              <td className="p-3 text-right">
                <div className="flex items-center justify-end gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7"
                    onClick={(e) => { e.stopPropagation(); onEdit(site); }}>
                    <Edit className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"
                    onClick={(e) => { e.stopPropagation(); onDelete(site); }}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

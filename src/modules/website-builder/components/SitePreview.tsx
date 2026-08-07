/**
 * SitePreview — full-screen, isolated preview of a WebsiteSite.
 *
 * Renders inside an iframe (via PreviewFrame) so no editor CSS bleeds in.
 * The toolbar (page picker, language picker, device switcher, open-in-new-tab,
 * close) lives *outside* the iframe so it never mutates the previewed layout.
 *
 * This is the "true" preview — it applies the same head tags, language
 * direction, theme background, and google fonts as the published site.
 */
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Monitor, Smartphone, Tablet, X, ExternalLink, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { WebsiteSite, DeviceView, DEFAULT_THEME } from '../types';
import { ComponentRenderer } from './renderer/ComponentRenderer';
import { PreviewFrame } from './PreviewFrame';
import { useSiteHead } from '../hooks/useSiteHead';

interface SitePreviewProps {
  site: WebsiteSite;
  initialPageId?: string;
  initialLanguage?: string | null;
  initialDevice?: DeviceView;
  onClose: () => void;
}

const DEVICE_WIDTHS: Record<DeviceView, number> = {
  desktop: 1280,
  tablet: 820,
  mobile: 390,
};

/** Renders the page inside the iframe: applies head tags + theme background. */
function PreviewBody({
  site,
  pageId,
  language,
  device,
  iframeDoc,
}: {
  site: WebsiteSite;
  pageId: string;
  language: string | null;
  device: DeviceView;
  iframeDoc: Document | null;
}) {
  const page = site.pages.find((p) => p.id === pageId) || site.pages[0];
  const theme = site.theme || DEFAULT_THEME;

  const activeComponents = useMemo(() => {
    if (!page) return [];
    if (language && page.translations?.[language]) {
      return page.translations[language].components;
    }
    return page.components;
  }, [page, language]);

  const activeSeo = useMemo(() => {
    if (!page) return null;
    if (language && page.translations?.[language]) {
      return page.translations[language].seo;
    }
    return page.seo;
  }, [page, language]);

  const dir = useMemo(() => {
    if (!site.languages || !language) return theme.direction || 'ltr';
    return site.languages.find((l) => l.code === language)?.direction || theme.direction || 'ltr';
  }, [site.languages, language, theme.direction]);

  useSiteHead({
    site,
    page: page || null,
    seo: activeSeo,
    theme,
    language: language || site.defaultLanguage || 'en',
    direction: dir,
    targetDocument: iframeDoc,
    noindex: true, // this is a preview, never index it
  });

  if (!page) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: theme.secondaryColor }}>
        No page selected.
      </div>
    );
  }

  return (
    <div
      style={{
        backgroundColor: theme.backgroundColor,
        color: theme.textColor,
        fontFamily: theme.bodyFont,
        minHeight: '100vh',
      }}
    >
      {activeComponents.map((comp) => (
        <ComponentRenderer
          key={comp.id}
          component={comp}
          device={device}
          theme={theme}
          activeLanguage={language}
        />
      ))}
    </div>
  );
}

export function SitePreview({
  site,
  initialPageId,
  initialLanguage = null,
  initialDevice = 'desktop',
  onClose,
}: SitePreviewProps) {
  const { t } = useTranslation();
  const [pageId, setPageId] = useState(
    () => initialPageId
      || site.pages.find((p) => p.isHomePage)?.id
      || site.pages[0]?.id
      || ''
  );
  const [language, setLanguage] = useState<string | null>(initialLanguage);
  const [device, setDevice] = useState<DeviceView>(initialDevice);
  const [iframeDoc, setIframeDoc] = useState<Document | null>(null);

  const theme = site.theme || DEFAULT_THEME;
  const currentPage = site.pages.find((p) => p.id === pageId);

  const publicUrl = currentPage
    ? `/public/sites/${site.slug}/${currentPage.slug || ''}`
    : `/public/sites/${site.slug}`;

  const frameWidth = DEVICE_WIDTHS[device];

  return (
    <div className="h-full flex flex-col bg-muted/40">
      {/* Toolbar (outside iframe — never affects layout) */}
      <div className="h-14 border-b border-border/60 bg-card flex items-center justify-between px-3 gap-3 flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-semibold truncate">
            {t('wb:common.preview', 'Preview')}: {site.name}
          </span>
        </div>

        {/* Page + language pickers */}
        <div className="flex items-center gap-2">
          <Select value={pageId} onValueChange={setPageId}>
            <SelectTrigger className="h-8 w-44 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {site.pages.map((p) => (
                <SelectItem key={p.id} value={p.id} className="text-xs">
                  {p.isHomePage ? '🏠 ' : ''}{p.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {site.languages && site.languages.length > 0 && (
            <Select
              value={language || (site.defaultLanguage || 'default')}
              onValueChange={(v) => setLanguage(v === (site.defaultLanguage || 'default') ? null : v)}
            >
              <SelectTrigger className="h-8 w-32 text-xs">
                <Globe className="h-3 w-3 mr-1 opacity-60" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={site.defaultLanguage || 'default'} className="text-xs">
                  {site.defaultLanguage?.toUpperCase() || 'Default'}
                </SelectItem>
                {site.languages.map((l) => (
                  <SelectItem key={l.code} value={l.code} className="text-xs">
                    {l.label} ({l.code.toUpperCase()})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Device switcher */}
          <div className="inline-flex rounded-md border border-border/60 bg-background p-0.5">
            {(['desktop', 'tablet', 'mobile'] as DeviceView[]).map((d) => {
              const Icon = d === 'desktop' ? Monitor : d === 'tablet' ? Tablet : Smartphone;
              return (
                <button
                  key={d}
                  onClick={() => setDevice(d)}
                  className={`inline-flex items-center justify-center h-7 w-7 rounded transition-colors ${
                    device === d
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted'
                  }`}
                  title={d}
                  aria-label={`Preview as ${d}`}
                >
                  <Icon className="h-3.5 w-3.5" />
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {site.published && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1.5"
              onClick={() => window.open(publicUrl, '_blank', 'noopener,noreferrer')}
            >
              <ExternalLink className="h-3.5 w-3.5" />
              {t('wb:common.openLive', 'Open live')}
            </Button>
          )}
          <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={onClose}>
            <X className="h-3.5 w-3.5" />
            {t('wb:editor.closePreview', 'Close preview')}
          </Button>
        </div>
      </div>

      {/* Device frame */}
      <div className="flex-1 overflow-auto p-6 flex items-start justify-center">
        <div
          className="rounded-xl shadow-2xl border border-border/40 overflow-hidden bg-white transition-all duration-300 mx-auto"
          style={{
            width: device === 'desktop' ? '100%' : frameWidth,
            maxWidth: device === 'desktop' ? 1440 : frameWidth,
            height: 'calc(100vh - 8rem)',
            backgroundColor: theme.backgroundColor,
          }}
        >
          <PreviewFrame
            title={`Preview: ${site.name}`}
            backgroundColor={theme.backgroundColor}
            onDocument={setIframeDoc}
          >
            <PreviewBody
              site={site}
              pageId={pageId}
              language={language}
              device={device}
              iframeDoc={iframeDoc}
            />
          </PreviewFrame>
        </div>
      </div>
    </div>
  );
}

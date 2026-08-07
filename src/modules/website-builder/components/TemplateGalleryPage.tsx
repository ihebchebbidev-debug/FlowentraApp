import React, { useState, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ArrowLeft, Globe, Search, Layers, Eye, Check, X,
  FileText, Palette, MonitorPlay, AlertCircle, Loader2, Plus,
} from 'lucide-react';
import { TemplateLivePreview } from './TemplateLivePreview';
import { TemplateThumbnail } from './TemplateThumbnail';
import { SITE_TEMPLATES, getTemplateCategories, SiteTemplate } from '../utils/siteTemplates';
import { siteNameSchema, validateField } from '../utils/validation';
import { cn } from '@/lib/utils';

interface TemplateGalleryPageProps {
  onSelect: (templateId: string, siteName: string) => void;
  onBack: () => void;
}

export function TemplateGalleryPage({ onSelect, onBack }: TemplateGalleryPageProps) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [previewTemplate, setPreviewTemplate] = useState<SiteTemplate | null>(null);
  const [siteName, setSiteName] = useState('');
  const [siteNameError, setSiteNameError] = useState<string | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [showLivePreview, setShowLivePreview] = useState(false);

  const categories = useMemo(() => ['all', ...getTemplateCategories()], []);

  const filteredTemplates = useMemo(() => {
    let result = SITE_TEMPLATES;
    if (selectedCategory !== 'all') {
      result = result.filter(t => t.category === selectedCategory);
    }
    if (search) {
      const term = search.toLowerCase();
      result = result.filter(t =>
        t.name.toLowerCase().includes(term) ||
        t.description.toLowerCase().includes(term) ||
        t.category.toLowerCase().includes(term)
      );
    }
    return result;
  }, [search, selectedCategory]);

  const validateSiteName = useCallback((value: string): boolean => {
    const result = validateField(siteNameSchema, value);
    if (result.success === false) {
      setSiteNameError(result.error);
      return false;
    }
    setSiteNameError(null);
    return true;
  }, []);

  const handleSiteNameChange = (value: string) => {
    setSiteName(value);
    if (siteNameError) {
      validateSiteName(value);
    }
  };

  const handleSelectTemplate = (tmpl: SiteTemplate) => {
    setSelectedTemplateId(tmpl.id);
    setSiteName(tmpl.name);
    setSiteNameError(null);
    setPreviewTemplate(tmpl);
  };

  const [creating, setCreating] = useState(false);

  const handleCreate = () => {
    if (creating) return;
    if (!validateSiteName(siteName)) return;
    setCreating(true);
    onSelect(selectedTemplateId || 'blank', siteName.trim());
  };

  const handleCreateBlank = () => {
    if (creating) return;
    const name = siteName.trim() || 'My Website';
    if (!validateSiteName(name)) return;
    setCreating(true);
    onSelect('blank', name);
  };

  /** Create directly from a card without opening the preview screen. */
  const handleUseTemplate = (tmpl: SiteTemplate) => {
    if (creating) return;
    const name = siteName.trim() || tmpl.name;
    if (!validateSiteName(name)) return;
    setSelectedTemplateId(tmpl.id);
    setCreating(true);
    onSelect(tmpl.id, name);
  };

  const getCategoryIcon = (cat: string) => {
    const icons: Record<string, string> = {
      'Automotive': '🔧', 'Food & Drink': '🍽️', 'Creative': '🎨', 'Healthcare': '🏥',
      'Real Estate': '🏠', 'Fitness': '💪', 'Beauty': '💅', 'Professional': '⚖️',
      'E-Commerce': '🛍️', 'Technology': '🚀', 'Education': '🎓', 'Home Services': '🧹',
      'Events': '💒', 'Nonprofit': '🤝', 'Pet Care': '🐾', 'Travel': '✈️',
      'Community': '⛪',
    };
    return icons[cat] || '📄';
  };

  // Preview modal
  if (previewTemplate) {
    const pages = previewTemplate.pages();

    // Full-screen live preview mode
    if (showLivePreview) {
      return (
        <div className="h-full flex flex-col bg-background">
          <div className="flex items-center justify-between p-3 border-b border-border bg-card">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => setShowLivePreview(false)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Details
              </Button>
              <Badge variant="secondary" className="text-xs">
                <MonitorPlay className="h-3 w-3 mr-1" />
                Live Preview
              </Badge>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Input
                  placeholder="Site name..."
                  value={siteName}
                  onChange={(e) => handleSiteNameChange(e.target.value)}
                  onBlur={() => siteName && validateSiteName(siteName)}
                  className={`w-48 sm:w-64 ${siteNameError ? 'border-destructive' : ''}`}
                  maxLength={100}
                />
                {siteNameError && (
                  <p className="absolute -bottom-5 left-0 text-px-10 text-destructive whitespace-nowrap">
                    {siteNameError}
                  </p>
                )}
              </div>
              <Button onClick={handleCreate} disabled={creating || !siteName.trim() || !!siteNameError} className="bg-primary text-primary-foreground">
                {creating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
                {creating ? 'Creating…' : 'Create Site'}
              </Button>
            </div>

          </div>
          <div className="flex-1 overflow-hidden">
            <TemplateLivePreview pages={pages} theme={previewTemplate.theme} />
          </div>
        </div>
      );
    }

    return (
      <div className="h-full flex flex-col bg-background">
        {/* Preview Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-card">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setPreviewTemplate(null)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Templates
            </Button>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowLivePreview(true)}
              className="text-xs"
            >
              <MonitorPlay className="h-4 w-4 mr-2" />
              Live Preview
            </Button>
            <div className="relative">
              <Input
                placeholder="Site name..."
                value={siteName}
                onChange={(e) => handleSiteNameChange(e.target.value)}
                onBlur={() => siteName && validateSiteName(siteName)}
                className={`w-48 sm:w-64 ${siteNameError ? 'border-destructive' : ''}`}
                maxLength={100}
              />
              {siteNameError && (
                <p className="absolute -bottom-5 left-0 text-px-10 text-destructive whitespace-nowrap">
                  {siteNameError}
                </p>
              )}
            </div>
            <Button onClick={handleCreate} disabled={creating || !siteName.trim() || !!siteNameError} className="bg-primary text-primary-foreground">
              {creating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
              {creating ? 'Creating…' : 'Create Site'}
            </Button>

          </div>
        </div>

        {/* Template Details + Inline Preview */}
        <div className="flex-1 overflow-auto">
          {/* Hero section */}
          <div className="p-6 sm:p-8 border-b border-border bg-card">
            <div className="max-w-5xl mx-auto">
              <div className="flex flex-col sm:flex-row sm:items-start gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-4xl">{previewTemplate.icon}</span>
                    <div>
                      <h1 className="text-2xl font-bold text-foreground">{previewTemplate.name}</h1>
                      <Badge variant="secondary" className="mt-1">{previewTemplate.category}</Badge>
                    </div>
                  </div>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    {previewTemplate.description}
                  </p>
                  <div className="flex flex-wrap gap-4 text-sm mb-4">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Layers className="h-4 w-4" />
                      <span>{previewTemplate.pageCount} pages</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Palette className="h-4 w-4" />
                      <span>{previewTemplate.theme.headingFont.split(',')[0]}</span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setShowLivePreview(true)}
                    className="gap-2"
                  >
                    <MonitorPlay className="h-4 w-4" />
                    Open Live Preview
                  </Button>
                </div>

                {/* Theme preview */}
                <div className="sm:w-64 space-y-3">
                  <h3 className="text-sm font-medium text-muted-foreground">Color Palette</h3>
                  <div className="flex gap-2">
                    {[
                      { label: 'Primary', color: previewTemplate.theme.primaryColor },
                      { label: 'Secondary', color: previewTemplate.theme.secondaryColor },
                      { label: 'Accent', color: previewTemplate.theme.accentColor },
                      { label: 'Background', color: previewTemplate.theme.backgroundColor },
                      { label: 'Text', color: previewTemplate.theme.textColor },
                    ].map((c, i) => (
                      <div key={i} className="text-center">
                        <div
                          className="w-10 h-10 rounded-lg border border-border shadow-sm"
                          style={{ backgroundColor: c.color }}
                          title={c.label}
                        />
                        <p className="text-px-9 text-muted-foreground mt-1">{c.label}</p>
                      </div>
                    ))}
                  </div>

                  <h3 className="text-sm font-medium text-muted-foreground pt-2">Features</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {previewTemplate.features.map((f, i) => (
                      <Badge key={i} variant="outline" className="text-px-10">{f}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Inline Live Preview */}
          <div className="p-6 sm:p-8 border-b border-border">
            <div className="max-w-5xl mx-auto">
              <div className="flex items-center gap-2 mb-4">
                <MonitorPlay className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-lg font-semibold text-foreground">Live Preview</h2>
                <span className="text-px-10 text-muted-foreground">(scroll to explore)</span>
              </div>
              <div className="border border-border rounded-xl overflow-hidden bg-muted/10" style={{ height: 480 }}>
                <TemplateLivePreview pages={pages} theme={previewTemplate.theme} />
              </div>
            </div>
          </div>

          {/* Page list */}
          <div className="p-6 sm:p-8">
            <div className="max-w-5xl mx-auto">
              <h2 className="text-lg font-semibold text-foreground mb-4">
                Pages ({pages.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pages.map((pg, idx) => (
                  <Card key={pg.id} className="overflow-hidden hover:shadow-md transition-shadow">
                    <div
                      className="h-32 relative overflow-hidden"
                      style={{ backgroundColor: previewTemplate.theme.backgroundColor }}
                    >
                      <div className="absolute inset-0 p-3 flex flex-col">
                        <div
                          className="h-5 rounded-sm mb-2 flex items-center px-2"
                          style={{ backgroundColor: previewTemplate.theme.primaryColor + '20' }}
                        >
                          <div className="w-10 h-1.5 rounded" style={{ backgroundColor: previewTemplate.theme.primaryColor }} />
                        </div>
                        <div className="flex-1 flex flex-col items-center justify-center gap-1">
                          <div className="w-3/4 h-2 rounded" style={{ backgroundColor: previewTemplate.theme.textColor + '50' }} />
                          <div className="w-1/2 h-1.5 rounded" style={{ backgroundColor: previewTemplate.theme.textColor + '25' }} />
                        </div>
                      </div>
                      {pg.isHomePage && (
                        <Badge className="absolute top-2 right-2 text-px-9 bg-primary/90">Home</Badge>
                      )}
                    </div>
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-sm">{pg.title}</h4>
                          <p className="text-px-10 text-muted-foreground">
                            {pg.components.length} components · /{pg.slug || ''}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-px-9">
                          <FileText className="h-3 w-3 mr-1" />
                          Page {idx + 1}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main Gallery View
  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="relative border-b border-border bg-gradient-to-r from-primary/5 via-card/60 to-card/40 backdrop-blur">
        <div className="flex items-center justify-between gap-4 p-4">
          <div className="flex items-center gap-3 min-w-0">
            <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0 rounded-full" onClick={onBack} aria-label="Back">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="h-9 w-9 shrink-0 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-sm shadow-primary/20">
              <Layers className="h-4 w-4 text-primary-foreground" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-semibold text-foreground leading-tight truncate">Choose a Template</h1>
              <p className="text-px-11 text-muted-foreground">
                <span className="text-foreground/70 font-medium">{SITE_TEMPLATES.length}</span> professional templates · {categories.length - 1} categories
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="relative">
              <Input
                placeholder="Name your site…"
                value={siteName}
                onChange={(e) => handleSiteNameChange(e.target.value)}
                onBlur={() => siteName && validateSiteName(siteName)}
                className={cn('w-40 sm:w-56 h-9 bg-background/80', siteNameError && 'border-destructive')}
                maxLength={100}
              />
              {siteNameError && (
                <p className="absolute -bottom-5 left-0 text-px-10 text-destructive whitespace-nowrap">
                  {siteNameError}
                </p>
              )}
            </div>

            <Button
              variant="outline"
              onClick={handleCreateBlank}
              disabled={creating}
              className="hidden sm:flex h-9 bg-background/80"
            >
              {creating && selectedTemplateId === null
                ? <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                : <Globe className="h-4 w-4 mr-2" />}
              Blank Site
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Category Sidebar */}
        <div className="hidden md:flex w-56 flex-col border-r border-border bg-card p-3">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-8 h-9"
            />
            {search && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => setSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <ScrollArea className="flex-1">
            <div className="space-y-0.5">
              {categories.map(cat => {
                const isActive = selectedCategory === cat;
                const count = cat === 'all' ? SITE_TEMPLATES.length : SITE_TEMPLATES.filter(t => t.category === cat).length;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={cn(
                      'group/cat relative w-full text-left pl-3 pr-2 py-2 rounded-lg text-sm transition-all flex items-center gap-2',
                      isActive
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                    )}
                  >
                    <span
                      className={cn(
                        'absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-full bg-primary transition-all',
                        isActive ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    {cat === 'all'
                      ? <Layers className="h-4 w-4 shrink-0" />
                      : <span className="text-px-15 leading-none">{getCategoryIcon(cat)}</span>}
                    <span className="truncate">{cat === 'all' ? 'All Templates' : cat}</span>
                    <Badge
                      variant={isActive ? 'default' : 'secondary'}
                      className={cn('ml-auto text-px-10 h-5 px-1.5 transition-colors', isActive && 'bg-primary/20 text-primary hover:bg-primary/20')}
                    >
                      {count}
                    </Badge>
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </div>

        {/* Mobile category pills */}
        <div className="md:hidden flex-none">
          <div className="flex overflow-x-auto gap-2 p-3 border-b border-border bg-card">
            <div className="relative flex-1 min-w-[120px] max-w-[200px]">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-7 pr-7 h-8 text-xs"
              />
              {search && (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => setSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
            {categories.map(cat => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? 'default' : 'outline'}
                size="sm"
                className="whitespace-nowrap text-xs h-8 px-3 flex-none"
                onClick={() => setSelectedCategory(cat)}
              >
                {cat === 'all' ? 'All' : `${getCategoryIcon(cat)} ${cat}`}
              </Button>
            ))}
          </div>
        </div>

        {/* Template Grid */}
        <div className="flex-1 overflow-auto p-4 sm:p-6">
          {/* Results bar */}
          <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
            <p className="text-xs text-muted-foreground">
              <span className="text-foreground font-medium">{filteredTemplates.length}</span>{' '}
              {filteredTemplates.length === 1 ? 'template' : 'templates'}
              {selectedCategory !== 'all' && <> in <span className="text-foreground font-medium">{selectedCategory}</span></>}
              {search && <> matching “<span className="text-foreground font-medium">{search}</span>”</>}
            </p>
            {(search || selectedCategory !== 'all') && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-muted-foreground"
                onClick={() => { setSearch(''); setSelectedCategory('all'); }}
              >
                <X className="h-3.5 w-3.5 mr-1" />
                Clear filters
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {/* Blank site card — hidden while searching so results stay focused */}
            {!search && (
            <Card
              role="button"
              tabIndex={0}
              aria-label="Start from a blank site"
              className={cn(
                'group relative overflow-hidden cursor-pointer rounded-xl border-2 border-dashed border-border/60 bg-muted/10',
                'transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:bg-primary/[0.03] hover:shadow-xl hover:shadow-primary/5',
                'focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none',
                selectedTemplateId === null && 'border-primary border-solid ring-2 ring-primary/30 bg-primary/[0.04]'
              )}
              onClick={() => {
                setSelectedTemplateId(null);
                setSiteName(siteName || 'My Website');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleCreateBlank(); }
              }}
            >
              <div className="h-48 flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-2xl bg-background flex items-center justify-center mb-3 shadow-sm border border-border/50 group-hover:bg-primary/10 group-hover:border-primary/20 group-hover:scale-105 transition-all duration-300">
                  <Globe className="h-7 w-7 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <span className="text-sm font-semibold text-foreground">Start from Scratch</span>
                <span className="text-px-11 text-muted-foreground mt-0.5">Empty canvas — build anything</span>
              </div>
              <CardContent className="p-3.5 border-t border-border/40">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm">Blank Site</h3>
                  <Badge variant="outline" className="text-px-9">1 page</Badge>
                </div>
              </CardContent>
            </Card>
            )}

            {filteredTemplates.map(tmpl => (
              <Card
                key={tmpl.id}
                role="button"
                tabIndex={0}
                aria-label={`${tmpl.name} template`}
                className={cn(
                  'group relative overflow-hidden cursor-pointer rounded-xl border-border/60 bg-card',
                  'transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/5 hover:border-primary/30',
                  'focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none',
                  selectedTemplateId === tmpl.id && 'ring-2 ring-primary shadow-lg shadow-primary/10'
                )}
                onClick={() => handleSelectTemplate(tmpl)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleSelectTemplate(tmpl);
                  }
                }}
              >
                {/* Template Preview - Live Rendered */}
                <div
                  className="h-48 relative overflow-hidden border-b border-border/50"
                  style={{ backgroundColor: tmpl.theme.backgroundColor }}
                >
                  <TemplateThumbnail template={tmpl} className="w-full h-full transition-transform duration-500 group-hover:scale-[1.03]" />

                  {/* NEW badge */}
                  {tmpl.isNew && (
                    <div className="absolute top-2.5 left-2.5 z-10 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-primary to-primary/80 px-2 py-0.5 text-px-9 font-bold uppercase tracking-wider text-primary-foreground shadow-md ring-1 ring-primary/30">
                      ✨ New
                    </div>
                  )}

                  {/* Selected check */}
                  {selectedTemplateId === tmpl.id && (
                    <div className="absolute top-2.5 right-2.5 z-10 h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md ring-2 ring-background">
                      <Check className="h-3.5 w-3.5" />
                    </div>
                  )}

                  {/* Hover overlay with gradient for button legibility */}
                  <div className="absolute inset-0 flex items-center justify-center gap-2 bg-gradient-to-t from-foreground/40 via-foreground/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="h-8 text-xs shadow-lg backdrop-blur-sm translate-y-1.5 group-hover:translate-y-0 transition-transform duration-300"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewTemplate(tmpl);
                        setSiteName(tmpl.name);
                        setSelectedTemplateId(tmpl.id);
                      }}
                    >
                      <Eye className="h-3.5 w-3.5 mr-1.5" />
                      Preview
                    </Button>
                    <Button
                      size="sm"
                      disabled={creating}
                      className="h-8 text-xs shadow-lg bg-primary text-primary-foreground translate-y-1.5 group-hover:translate-y-0 transition-transform duration-300"
                      onClick={(e) => { e.stopPropagation(); handleUseTemplate(tmpl); }}
                    >
                      {creating && selectedTemplateId === tmpl.id
                        ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                        : <Plus className="h-3.5 w-3.5 mr-1.5" />}
                      Use
                    </Button>
                  </div>
                </div>

                <CardContent className="p-3.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-base leading-none shrink-0">{tmpl.icon}</span>
                    <h3 className="font-semibold text-sm truncate">{tmpl.name}</h3>
                  </div>
                  <p className="text-px-11 text-muted-foreground mt-1 line-clamp-2 leading-relaxed min-h-[30px]">{tmpl.description}</p>

                  <div className="flex items-center justify-between gap-2 mt-2.5 pt-2.5 border-t border-border/40">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="inline-flex items-center gap-1 text-px-10 font-medium text-foreground/70 bg-muted/60 rounded-full px-2 py-0.5 truncate">
                        <span className="leading-none">{getCategoryIcon(tmpl.category)}</span>
                        <span className="truncate">{tmpl.category}</span>
                      </span>
                      <span className="inline-flex items-center gap-1 text-px-10 text-muted-foreground shrink-0">
                        <FileText className="h-3 w-3" />
                        {tmpl.pageCount}
                      </span>
                    </div>
                    <div className="flex -space-x-1 shrink-0">
                      {[tmpl.theme.primaryColor, tmpl.theme.accentColor, tmpl.theme.secondaryColor].map((c, i) => (
                        <div key={i} className="w-3.5 h-3.5 rounded-full border-2 border-card shadow-sm" style={{ backgroundColor: c }} />
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredTemplates.length === 0 && (
            <div className="flex flex-col items-center justify-center text-center py-20">
              <div className="h-16 w-16 rounded-2xl bg-muted/40 border border-border/40 flex items-center justify-center mb-4">
                <Search className="h-7 w-7 text-muted-foreground/40" />
              </div>
              <h3 className="text-base font-semibold mb-1">No matching templates</h3>
              <p className="text-sm text-muted-foreground mb-5 max-w-xs">
                {search ? <>Nothing matches “<span className="text-foreground/70 font-medium">{search}</span>”. Try another search or browse a category.</> : 'Try a different category or start from a blank site.'}
              </p>
              <Button variant="outline" size="sm" onClick={() => { setSearch(''); setSelectedCategory('all'); }}>
                <X className="h-4 w-4 mr-1" />
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

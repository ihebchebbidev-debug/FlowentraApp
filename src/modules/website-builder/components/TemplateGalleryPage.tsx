import React, { useState, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ArrowLeft, Globe, Search, Layers, Eye, Check, X,
  FileText, Palette, MonitorPlay, AlertCircle,
} from 'lucide-react';
import { TemplateLivePreview } from './TemplateLivePreview';
import { TemplateThumbnail } from './TemplateThumbnail';
import { SITE_TEMPLATES, getTemplateCategories, SiteTemplate } from '../utils/siteTemplates';
import { siteNameSchema, validateField } from '../utils/validation';

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
                  <p className="absolute -bottom-5 left-0 text-[10px] text-destructive whitespace-nowrap">
                    {siteNameError}
                  </p>
                )}
              </div>
              <Button onClick={handleCreate} disabled={creating || !siteName.trim() || !!siteNameError} className="bg-primary text-primary-foreground">
                <Check className="h-4 w-4 mr-2" />
                Create Site
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
                <p className="absolute -bottom-5 left-0 text-[10px] text-destructive whitespace-nowrap">
                  {siteNameError}
                </p>
              )}
            </div>
            <Button onClick={handleCreate} disabled={creating || !siteName.trim() || !!siteNameError} className="bg-primary text-primary-foreground">
              <Check className="h-4 w-4 mr-2" />
              Create Site
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
                        <p className="text-[9px] text-muted-foreground mt-1">{c.label}</p>
                      </div>
                    ))}
                  </div>

                  <h3 className="text-sm font-medium text-muted-foreground pt-2">Features</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {previewTemplate.features.map((f, i) => (
                      <Badge key={i} variant="outline" className="text-[10px]">{f}</Badge>
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
                <span className="text-[10px] text-muted-foreground">(scroll to explore)</span>
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
                        <Badge className="absolute top-2 right-2 text-[9px] bg-primary/90">Home</Badge>
                      )}
                    </div>
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-sm">{pg.title}</h4>
                          <p className="text-[10px] text-muted-foreground">
                            {pg.components.length} components · /{pg.slug || ''}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-[9px]">
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
      <div className="flex items-center justify-between p-4 border-b border-border bg-card/50 backdrop-blur">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-xl font-semibold text-foreground">Choose a Template</h1>
            <p className="text-[11px] text-muted-foreground">{SITE_TEMPLATES.length} professional templates across {categories.length - 1} categories</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Input
              placeholder="Site name..."
              value={siteName}
              onChange={(e) => handleSiteNameChange(e.target.value)}
              onBlur={() => siteName && validateSiteName(siteName)}
              className={`w-40 sm:w-56 ${siteNameError ? 'border-destructive' : ''}`}
              maxLength={100}
            />
            {siteNameError && (
              <p className="absolute -bottom-5 left-0 text-[10px] text-destructive whitespace-nowrap">
                {siteNameError}
              </p>
            )}
          </div>

          <Button
            variant="outline"
            onClick={handleCreateBlank}
            className="hidden sm:flex"
          >
            <Globe className="h-4 w-4 mr-2" />
            Blank Site
          </Button>
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Category Sidebar */}
        <div className="hidden md:flex w-56 flex-col border-r border-border bg-card p-3">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          <ScrollArea className="flex-1">
            <div className="space-y-0.5">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 ${
                    selectedCategory === cat
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                  }`}
                >
                  {cat === 'all' ? (
                    <>
                      <Layers className="h-4 w-4" />
                      <span>All Templates</span>
                      <Badge variant="secondary" className="ml-auto text-[10px] h-5 px-1.5">
                        {SITE_TEMPLATES.length}
                      </Badge>
                    </>
                  ) : (
                    <>
                      <span>{getCategoryIcon(cat)}</span>
                      <span className="truncate">{cat}</span>
                      <Badge variant="secondary" className="ml-auto text-[10px] h-5 px-1.5">
                        {SITE_TEMPLATES.filter(t => t.category === cat).length}
                      </Badge>
                    </>
                  )}
                </button>
              ))}
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
                className="pl-7 h-8 text-xs"
              />
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
          {/* Blank site card */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <Card
              className={`overflow-hidden cursor-pointer transition-all hover:shadow-lg group ${
                selectedTemplateId === null ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => {
                setSelectedTemplateId(null);
                setSiteName(siteName || 'My Website');
              }}
            >
              <div className="h-44 bg-muted/30 flex flex-col items-center justify-center border-b border-border">
                <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-3 group-hover:bg-primary/10 transition-colors">
                  <Globe className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <span className="text-sm font-medium text-foreground">Start from Scratch</span>
              </div>
              <CardContent className="p-3">
                <h3 className="font-semibold text-sm">Blank Site</h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">Empty canvas — build anything you want</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline" className="text-[9px]">1 page</Badge>
                </div>
              </CardContent>
            </Card>

            {filteredTemplates.map(tmpl => (
              <Card
                key={tmpl.id}
                className={`overflow-hidden cursor-pointer transition-all hover:shadow-lg group ${
                  selectedTemplateId === tmpl.id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => handleSelectTemplate(tmpl)}
              >
                {/* Template Preview - Live Rendered */}
                <div
                  className="h-44 relative overflow-hidden border-b border-border"
                  style={{ backgroundColor: tmpl.theme.backgroundColor }}
                >
                  <TemplateThumbnail template={tmpl} className="w-full h-full" />
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/5 transition-colors flex items-center justify-center">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity shadow-lg text-xs"
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
                  </div>
                </div>

                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span>{tmpl.icon}</span>
                        <h3 className="font-semibold text-sm truncate">{tmpl.name}</h3>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{tmpl.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <Badge variant="secondary" className="text-[9px]">{tmpl.category}</Badge>
                    <Badge variant="outline" className="text-[9px]">{tmpl.pageCount} pages</Badge>
                    <div className="flex gap-0.5 ml-auto">
                      {[tmpl.theme.primaryColor, tmpl.theme.accentColor, tmpl.theme.secondaryColor].map((c, i) => (
                        <div key={i} className="w-3 h-3 rounded-full border border-background shadow-sm" style={{ backgroundColor: c }} />
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredTemplates.length === 0 && (
            <div className="text-center py-16">
              <Search className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
              <h3 className="text-base font-medium mb-1">No matching templates</h3>
              <p className="text-sm text-muted-foreground mb-4">Try a different search or category</p>
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

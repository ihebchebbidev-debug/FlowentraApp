/**
 * LanguageManager — Manage site languages + translate pages.
 * Sits in the right panel of the SiteEditor.
 */
import React, { useState } from 'react';
import { WebsiteSite, SiteLanguage, SitePage, AVAILABLE_LANGUAGES, PageTranslation } from '../../types';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Globe, Copy, Check, Languages, Star } from 'lucide-react';
import { toast } from 'sonner';

interface LanguageManagerProps {
  site: WebsiteSite;
  currentPage: SitePage | undefined;
  activeLanguage: string | null; // null = default language
  onActiveLanguageChange: (lang: string | null) => void;
  onSiteUpdate: (site: WebsiteSite) => void;
}

export function LanguageManager({
  site,
  currentPage,
  activeLanguage,
  onActiveLanguageChange,
  onSiteUpdate,
}: LanguageManagerProps) {
  const [addingLang, setAddingLang] = useState(false);
  const [selectedNewLang, setSelectedNewLang] = useState('');

  const siteLanguages = site.languages || [];
  const defaultLang = site.defaultLanguage || 'en';

  // Languages not yet added
  const availableToAdd = AVAILABLE_LANGUAGES.filter(
    (l) => l.code !== defaultLang && !siteLanguages.find((sl) => sl.code === l.code)
  );

  const handleAddLanguage = () => {
    if (!selectedNewLang) return;
    const langDef = AVAILABLE_LANGUAGES.find((l) => l.code === selectedNewLang);
    if (!langDef) return;

    const updatedSite: WebsiteSite = {
      ...site,
      languages: [...siteLanguages, langDef],
    };
    onSiteUpdate(updatedSite);
    setAddingLang(false);
    setSelectedNewLang('');
    toast.success(`Added ${langDef.label} language`);
  };

  const handleRemoveLanguage = (code: string) => {
    const isDefault = code === defaultLang;
    const updatedLanguages = siteLanguages.filter((l) => l.code !== code);

    // Clean up translations from all pages
    const updatedPages = site.pages.map((page) => {
      if (page.translations?.[code]) {
        const { [code]: _, ...rest } = page.translations;
        return { ...page, translations: Object.keys(rest).length > 0 ? rest : undefined };
      }
      return page;
    });

    let newDefaultLang = defaultLang;

    if (isDefault) {
      // Promote the first remaining translation language, or fall back to 'en'
      if (updatedLanguages.length > 0) {
        newDefaultLang = updatedLanguages[0].code;
        toast.success(`Default language changed to ${updatedLanguages[0].label}`);
      } else {
        newDefaultLang = 'en';
      }
    }

    onSiteUpdate({
      ...site,
      defaultLanguage: newDefaultLang,
      languages: isDefault
        ? updatedLanguages.filter((l) => l.code !== newDefaultLang)
        : updatedLanguages,
      pages: updatedPages,
    });

    if (activeLanguage === code) {
      onActiveLanguageChange(null);
    }
    toast.success('Language removed');
  };

  const handleSetDefaultLanguage = (code: string) => {
    // The old default becomes a translation, the new code becomes default
    const oldDefaultDef = AVAILABLE_LANGUAGES.find((l) => l.code === defaultLang) || {
      code: defaultLang,
      label: defaultLang.toUpperCase(),
      direction: 'ltr' as const,
    };

    // Remove new default from translations list, add old default to it
    const updatedLanguages = [
      ...siteLanguages.filter((l) => l.code !== code),
      oldDefaultDef,
    ];

    onSiteUpdate({ ...site, defaultLanguage: code, languages: updatedLanguages });
    onActiveLanguageChange(null);
    toast.success(`Default language set to ${AVAILABLE_LANGUAGES.find((l) => l.code === code)?.label || code}`);
  };

  const handleCopyToTranslation = (langCode: string) => {
    if (!currentPage) return;
    const translation: PageTranslation = {
      components: JSON.parse(JSON.stringify(currentPage.components)),
      seo: { ...currentPage.seo },
    };
    const updatedPages = site.pages.map((p) => {
      if (p.id !== currentPage.id) return p;
      return {
        ...p,
        translations: {
          ...(p.translations || {}),
          [langCode]: translation,
        },
      };
    });
    onSiteUpdate({ ...site, pages: updatedPages });
    onActiveLanguageChange(langCode);
    toast.success(`Copied content to ${langCode} for translation`);
  };

  const defaultLangDef = AVAILABLE_LANGUAGES.find((l) => l.code === defaultLang) || {
    code: defaultLang,
    label: defaultLang.toUpperCase(),
    direction: 'ltr' as const,
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-3 space-y-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1 flex items-center gap-1.5">
          <Languages className="h-3.5 w-3.5" />
          Languages
        </h3>

        {/* Default language */}
        <div className="space-y-2">
          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground/60">
            Default Language
          </Label>
          <div
            className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border-2 cursor-pointer transition-colors ${
              activeLanguage === null
                ? 'border-primary/50 bg-primary/5'
                : 'border-border/50 hover:border-primary/30'
            }`}
            onClick={() => onActiveLanguageChange(null)}
          >
            <Globe className="h-4 w-4 text-primary shrink-0" />
            <div className="flex-1">
              <p className="text-xs font-semibold">{defaultLangDef.label}</p>
              <p className="text-[10px] text-muted-foreground">
                {defaultLangDef.code.toUpperCase()} · {defaultLangDef.direction.toUpperCase()}
              </p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {activeLanguage === null && <Check className="h-3.5 w-3.5 text-primary" />}
              {siteLanguages.length > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-destructive"
                  title="Remove default language (next language will become default)"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveLanguage(defaultLang);
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Translations */}
        <div className="space-y-2">
          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground/60">
            Translations ({siteLanguages.length})
          </Label>
          {siteLanguages.map((lang) => {
            const hasTranslation = currentPage?.translations?.[lang.code] != null;
            const isActive = activeLanguage === lang.code;

            return (
              <div
                key={lang.code}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border-2 cursor-pointer transition-colors ${
                  isActive
                    ? 'border-primary/50 bg-primary/5'
                    : 'border-border/50 hover:border-primary/30'
                }`}
                onClick={() => {
                  if (hasTranslation) {
                    onActiveLanguageChange(lang.code);
                  }
                }}
              >
                <Globe className="h-4 w-4 shrink-0 opacity-60" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold">{lang.label}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {lang.code.toUpperCase()} · {lang.direction.toUpperCase()}
                    {hasTranslation ? ' · ✓ Translated' : ' · Not translated'}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {!hasTranslation && (
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-6 w-6"
                      title="Copy default content for translation"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyToTranslation(lang.code);
                      }}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-amber-500"
                    title="Set as default language"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSetDefaultLanguage(lang.code);
                    }}
                  >
                    <Star className="h-3 w-3" />
                  </Button>
                  {isActive && <Check className="h-3.5 w-3.5 text-primary" />}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveLanguage(lang.code);
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            );
          })}

          {/* Add language */}
          {addingLang ? (
            <div className="space-y-2 p-2 rounded-lg border bg-muted/20">
              <Select value={selectedNewLang} onValueChange={setSelectedNewLang}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  {availableToAdd.map((l) => (
                    <SelectItem key={l.code} value={l.code} className="text-xs">
                      {l.label} ({l.code.toUpperCase()})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex gap-1">
                <Button size="sm" className="h-7 text-xs flex-1" onClick={handleAddLanguage} disabled={!selectedNewLang}>
                  Add
                </Button>
                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setAddingLang(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="w-full h-8 text-xs"
              onClick={() => setAddingLang(true)}
              disabled={availableToAdd.length === 0}
            >
              <Plus className="h-3 w-3 mr-1" /> Add Language
            </Button>
          )}
        </div>

        {/* Active editing indicator */}
        {activeLanguage && (
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
            <p className="text-xs font-semibold text-primary mb-1">
              Editing: {siteLanguages.find((l) => l.code === activeLanguage)?.label || activeLanguage}
            </p>
            <p className="text-[10px] text-muted-foreground">
              Changes will be saved to this language's translation. Switch back to the default language to edit the original content.
            </p>
          </div>
        )}

        {/* Info */}
        <div className="p-3 rounded-lg bg-muted/30 border border-border/30">
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            <strong>How it works:</strong> Add languages, then click the copy icon (📋) to duplicate the default page content into a translation.
            Switch between languages to edit each version independently.
            A Language Switcher component will let visitors choose their language.
          </p>
        </div>
      </div>
    </ScrollArea>
  );
}

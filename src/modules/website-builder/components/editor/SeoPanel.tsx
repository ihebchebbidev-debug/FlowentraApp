import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { PageSEO } from '../../types';
import { 
  seoTitleSchema, seoDescriptionSchema, pageTitleSchema, pageSlugSchema, urlSchema,
  validateField
} from '../../utils/validation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Globe, Search, Share2, AlertCircle } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

// --- Props and Types ---
interface SeoPanelProps {
  seo: PageSEO;
  slug: string;
  pageTitle: string;
  onChange: (seo: PageSEO) => void;
  onSlugChange: (slug: string) => void;
  onPageTitleChange: (title: string) => void;
}

interface FieldErrors {
  pageTitle?: string;
  slug?: string;
  seoTitle?: string;
  seoDescription?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
}

export function SeoPanel({ seo, slug, pageTitle, onChange, onSlugChange, onPageTitleChange }: SeoPanelProps) {
  const { t } = useTranslation('wb');
  const [errors, setErrors] = useState<FieldErrors>({});

  const setFieldError = useCallback((field: keyof FieldErrors, error: string | undefined) => {
    setErrors(prev => ({ ...prev, [field]: error }));
  }, []);

  const handleChange = (key: keyof PageSEO, value: string) => {
    onChange({ ...seo, [key]: value });
  };

  const validateAndUpdatePageTitle = (value: string) => {
    const result = validateField(pageTitleSchema, value);
    if (result.success === false) { setFieldError('pageTitle', result.error); } else { setFieldError('pageTitle', undefined); onPageTitleChange(value); }
  };

  const validateAndUpdateSlug = (value: string) => {
    const sanitized = value.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    const result = validateField(pageSlugSchema, sanitized);
    if (result.success === false) { setFieldError('slug', result.error); } else { setFieldError('slug', undefined); }
    onSlugChange(sanitized);
  };

  const validateSeoTitle = (value: string) => {
    const result = validateField(seoTitleSchema, value);
    if (result.success === false) { setFieldError('seoTitle', result.error); } else { setFieldError('seoTitle', undefined); }
    handleChange('title', value);
  };

  const validateSeoDescription = (value: string) => {
    const result = validateField(seoDescriptionSchema, value);
    if (result.success === false) { setFieldError('seoDescription', result.error); } else { setFieldError('seoDescription', undefined); }
    handleChange('description', value);
  };

  const validateOgImage = (value: string) => {
    if (value === '') {
      setFieldError('ogImage', undefined);
      handleChange('ogImage', value);
      return;
    }
    const result = validateField(urlSchema, value);
    if (result.success === false) { setFieldError('ogImage', result.error); } else { setFieldError('ogImage', undefined); }
    handleChange('ogImage', value);
  };

  const displayUrl = `example.com/${slug || 'page-url'}`;
  const previewTitle = seo.title || pageTitle || t('seo.pageTitlePlaceholder');
  

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-6">
        {/* Header */}
        <div>
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Search className="h-4 w-4" />
            {t('seo.seoSettings')}
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            {t('seo.optimizeDesc')}
          </p>
        </div>

        {/* Page Identity */}
        <div className="space-y-3">
          <div>
            <Label className="text-xs">{t('seo.pageTitle')}</Label>
            <Input
              value={pageTitle}
              onChange={(e) => validateAndUpdatePageTitle(e.target.value)}
              placeholder={t('seo.pageTitlePlaceholder')}
              className="mt-1 h-8 text-xs"
            />
            {errors.pageTitle && (
              <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> {errors.pageTitle}
              </p>
            )}
          </div>

          <div>
            <Label className="text-xs">{t('seo.urlSlug')}</Label>
            <Input
              value={slug}
              onChange={(e) => validateAndUpdateSlug(e.target.value)}
              placeholder={t('seo.urlSlugPlaceholder')}
              className="mt-1 h-8 text-xs font-mono"
            />
            {errors.slug && (
              <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> {errors.slug}
              </p>
            )}
          </div>
        </div>

        <Separator />

        {/* Meta Tags */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold flex items-center gap-2">
            <Globe className="h-3 w-3" />
            {t('seo.metaTags')}
          </h4>

          <div>
            <Label className="text-xs">{t('seo.seoTitle')}</Label>
            <Input
              value={seo.title || ''}
              onChange={(e) => validateSeoTitle(e.target.value)}
              placeholder={t('seo.seoTitlePlaceholder')}
              className="mt-1 h-8 text-xs"
            />
            <div className="flex justify-between mt-1">
              {errors.seoTitle ? (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> {errors.seoTitle}
                </p>
              ) : <span />}
              <span className="text-xs text-muted-foreground">{(seo.title || '').length}/60</span>
            </div>
          </div>

          <div>
            <Label className="text-xs">{t('seo.metaDescription')}</Label>
            <Textarea
              value={seo.description || ''}
              onChange={(e) => validateSeoDescription(e.target.value)}
              placeholder={t('seo.metaDescPlaceholder')}
              className="mt-1 text-xs min-h-[60px]"
            />
            <div className="flex justify-between mt-1">
              {errors.seoDescription ? (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> {errors.seoDescription}
                </p>
              ) : <span />}
              <span className="text-xs text-muted-foreground">{(seo.description || '').length}/160</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Search Preview */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold">{t('seo.searchPreview')}</h4>
          <div className="border rounded-lg p-3 bg-background">
            <p className="text-sm text-blue-600 font-medium truncate">{previewTitle}</p>
            <p className="text-xs text-green-700 truncate">{displayUrl}</p>
            <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
              {seo.description || t('seo.noMetaDesc')}
            </p>
          </div>
        </div>

        <Separator />

        {/* Open Graph */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold flex items-center gap-2">
            <Share2 className="h-3 w-3" />
            {t('seo.openGraph')}
          </h4>

          <div>
            <Label className="text-xs">{t('seo.ogTitle')}</Label>
            <Input
              value={seo.ogTitle || ''}
              onChange={(e) => handleChange('ogTitle', e.target.value)}
              placeholder={t('seo.ogTitlePlaceholder')}
              className="mt-1 h-8 text-xs"
            />
          </div>

          <div>
            <Label className="text-xs">{t('seo.ogDescription')}</Label>
            <Textarea
              value={seo.ogDescription || ''}
              onChange={(e) => handleChange('ogDescription', e.target.value)}
              placeholder={t('seo.ogDescPlaceholder')}
              className="mt-1 text-xs min-h-[60px]"
            />
          </div>

          <div>
            <Label className="text-xs">{t('seo.ogImageUrl')}</Label>
            <Input
              value={seo.ogImage || ''}
              onChange={(e) => validateOgImage(e.target.value)}
              placeholder={t('seo.ogImagePlaceholder')}
              className="mt-1 h-8 text-xs"
            />
            {errors.ogImage && (
              <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> {errors.ogImage}
              </p>
            )}
            {seo.ogImage && !errors.ogImage && (
              <div className="mt-2 border rounded overflow-hidden">
                <img src={seo.ogImage} alt="OG Preview" className="w-full h-32 object-cover" />
              </div>
            )}
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}

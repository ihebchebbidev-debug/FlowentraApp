/**
 * Dialog for adding a new page to a site, with page template selection.
 */
import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { SitePage } from '../types';
import { generateId } from '../utils/storage';
import { PAGE_TEMPLATES } from '../utils/templates';
import { pageTitleSchema, validateField, createValidSlug } from '../utils/validation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

interface AddPageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddPage: (page: SitePage) => void;
  existingPageCount: number;
}

export function AddPageDialog({ open, onOpenChange, onAddPage, existingPageCount }: AddPageDialogProps) {
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const [templateId, setTemplateId] = useState('blank');
  const [titleError, setTitleError] = useState<string | null>(null);

  const validateTitle = useCallback((value: string): boolean => {
    const result = validateField(pageTitleSchema, value);
    if (result.success === false) {
      setTitleError(result.error);
      return false;
    }
    setTitleError(null);
    return true;
  }, []);

  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (titleError) {
      validateTitle(value);
    }
  };

  const handleAdd = () => {
    if (!validateTitle(title)) return;
    
    const template = PAGE_TEMPLATES.find(t => t.id === templateId);
    const components = template ? template.components() : [];

    const page: SitePage = {
      id: generateId(),
      title: title.trim(),
      slug: createValidSlug(title),
      components,
      seo: { title: title.trim() },
      order: existingPageCount,
    };

    onAddPage(page);
    setTitle('');
    setTemplateId('blank');
    setTitleError(null);
    onOpenChange(false);
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      setTitle('');
      setTemplateId('blank');
      setTitleError(null);
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('wb:addPage.addNewPage')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="page-title" className="text-xs">{t('wb:addPage.pageTitleLabel')}</Label>
            <Input
              id="page-title"
              placeholder={t('wb:addPage.pageTitlePlaceholder')}
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              onBlur={() => title && validateTitle(title)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              className={titleError ? 'border-destructive' : ''}
            />
            {titleError ? (
              <p className="text-xs text-destructive">{titleError}</p>
            ) : title ? (
              <p className="text-xs text-muted-foreground">
                {t('wb:addPage.urlSlugPrefix')} /{createValidSlug(title)}
              </p>
            ) : null}
          </div>

          <div>
            <Label className="text-xs mb-2 block">{t('wb:addPage.chooseTemplate')}</Label>
            <div className="grid grid-cols-2 gap-2">
              {PAGE_TEMPLATES.map(template => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => setTemplateId(template.id)}
                  className={`text-left p-3 rounded-lg border-2 transition-colors ${
                    templateId === template.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-muted-foreground/30'
                  }`}
                >
                  <p className="text-sm font-medium">{template.name}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{template.description}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)}>{t('wb:common.cancel')}</Button>
          <Button onClick={handleAdd} disabled={!title.trim() || !!titleError}>{t('wb:addPage.createPage')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

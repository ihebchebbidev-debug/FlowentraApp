/**
 * Action Configuration Editor
 * Allows users to configure what happens when clicking buttons, links, etc.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ExternalLink, FileDown, Hash, Home, Mail, Phone, MousePointer, Code } from 'lucide-react';
import type { ComponentAction, ActionType, SitePage } from '../../types';

interface ActionConfigEditorProps {
  action: ComponentAction;
  onChange: (action: ComponentAction) => void;
  pages?: SitePage[];
  sections?: Array<{ id: string; label: string }>;
  className?: string;
}

export function ActionConfigEditor({ 
  action, 
  onChange, 
  pages = [], 
  sections = [],
  className = '' 
}: ActionConfigEditorProps) {
  const { t } = useTranslation('wb');

  const ACTION_TYPES: Array<{ value: ActionType; labelKey: string; icon: typeof Home }> = [
    { value: 'none', labelKey: 'editor.actionNone', icon: MousePointer },
    { value: 'page', labelKey: 'editor.actionPage', icon: Home },
    { value: 'url', labelKey: 'editor.actionUrl', icon: ExternalLink },
    { value: 'section', labelKey: 'editor.actionSection', icon: Hash },
    { value: 'email', labelKey: 'editor.actionEmail', icon: Mail },
    { value: 'phone', labelKey: 'editor.actionPhone', icon: Phone },
    { value: 'download', labelKey: 'editor.actionDownload', icon: FileDown },
    { value: 'custom', labelKey: 'editor.actionCustom', icon: Code },
  ];

  const handleTypeChange = (type: ActionType) => {
    onChange({ type });
  };

  const updateAction = (updates: Partial<ComponentAction>) => {
    onChange({ ...action, ...updates });
  };

  const currentType = ACTION_TYPES.find(a => a.value === action.type) || ACTION_TYPES[0];

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Action Type Selector */}
      <div>
        <Label className="text-xs text-muted-foreground mb-1.5 block">{t('editor.action')}</Label>
        <Select value={action.type} onValueChange={(v) => handleTypeChange(v as ActionType)}>
          <SelectTrigger className="h-9">
            <SelectValue>
              <div className="flex items-center gap-2">
                <currentType.icon className="h-3.5 w-3.5 text-muted-foreground" />
                <span>{t(currentType.labelKey)}</span>
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {ACTION_TYPES.map(({ value, labelKey, icon: Icon }) => (
              <SelectItem key={value} value={value}>
                <div className="flex items-center gap-2">
                  <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{t(labelKey)}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Page Selector */}
      {action.type === 'page' && (
        <div>
          <Label className="text-xs text-muted-foreground mb-1.5 block">{t('editor.targetPage')}</Label>
          <Select 
            value={action.pageId || ''} 
            onValueChange={(v) => updateAction({ pageId: v })}
          >
            <SelectTrigger className="h-9">
              <SelectValue placeholder={t('editor.selectPage')} />
            </SelectTrigger>
            <SelectContent>
              {pages.map((page) => (
                <SelectItem key={page.id} value={page.id}>
                  {page.title} {page.isHomePage && `(${t('editor.home')})`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* URL Input */}
      {action.type === 'url' && (
        <>
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">{t('editor.url')}</Label>
            <Input
              value={action.url || ''}
              onChange={(e) => updateAction({ url: e.target.value })}
              placeholder="https://example.com"
              className="h-9"
            />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">{t('editor.openInNewTab')}</Label>
            <Switch
              checked={action.openInNewTab ?? true}
              onCheckedChange={(checked) => updateAction({ openInNewTab: checked })}
            />
          </div>
        </>
      )}

      {/* Section Selector */}
      {action.type === 'section' && (
        <div>
          <Label className="text-xs text-muted-foreground mb-1.5 block">{t('editor.section')}</Label>
          {sections.length > 0 ? (
            <Select 
              value={action.sectionId || ''} 
              onValueChange={(v) => updateAction({ sectionId: v })}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder={t('editor.selectSection')} />
              </SelectTrigger>
              <SelectContent>
                {sections.map((section) => (
                  <SelectItem key={section.id} value={section.id}>
                    {section.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              value={action.sectionId || ''}
              onChange={(e) => updateAction({ sectionId: e.target.value })}
              placeholder="section-id"
              className="h-9"
            />
          )}
        </div>
      )}

      {/* Email Input */}
      {action.type === 'email' && (
        <div>
          <Label className="text-xs text-muted-foreground mb-1.5 block">{t('editor.emailAddress')}</Label>
          <Input
            type="email"
            value={action.email || ''}
            onChange={(e) => updateAction({ email: e.target.value })}
            placeholder="contact@example.com"
            className="h-9"
          />
        </div>
      )}

      {/* Phone Input */}
      {action.type === 'phone' && (
        <div>
          <Label className="text-xs text-muted-foreground mb-1.5 block">{t('editor.phoneNumber')}</Label>
          <Input
            type="tel"
            value={action.phone || ''}
            onChange={(e) => updateAction({ phone: e.target.value })}
            placeholder="+1 234 567 8900"
            className="h-9"
          />
        </div>
      )}

      {/* Download File Input */}
      {action.type === 'download' && (
        <div>
          <Label className="text-xs text-muted-foreground mb-1.5 block">{t('editor.fileUrl')}</Label>
          <Input
            value={action.fileUrl || ''}
            onChange={(e) => updateAction({ fileUrl: e.target.value })}
            placeholder="https://example.com/file.pdf"
            className="h-9"
          />
        </div>
      )}

      {/* Custom Handler Input */}
      {action.type === 'custom' && (
        <div>
          <Label className="text-xs text-muted-foreground mb-1.5 block">{t('editor.handlerName')}</Label>
          <Input
            value={action.customHandler || ''}
            onChange={(e) => updateAction({ customHandler: e.target.value })}
            placeholder="myCustomHandler"
            className="h-9"
          />
          <p className="text-[10px] text-muted-foreground mt-1">
            {t('editor.customEventHint')}
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Compact inline action editor for use in lists/tables
 */
export function ActionConfigInline({ 
  action, 
  onChange, 
  pages = [] 
}: Omit<ActionConfigEditorProps, 'className'>) {
  const { t } = useTranslation('wb');

  const ACTION_TYPES: Array<{ value: ActionType; labelKey: string }> = [
    { value: 'none', labelKey: 'editor.actionNone' },
    { value: 'page', labelKey: 'editor.actionPage' },
    { value: 'url', labelKey: 'editor.actionUrl' },
    { value: 'section', labelKey: 'editor.actionSection' },
    { value: 'email', labelKey: 'editor.actionEmail' },
  ];

  const handleTypeChange = (type: ActionType) => {
    onChange({ type });
  };

  return (
    <div className="flex items-center gap-2">
      <Select value={action.type} onValueChange={(v) => handleTypeChange(v as ActionType)}>
        <SelectTrigger className="h-7 w-28 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {ACTION_TYPES.map(({ value, labelKey }) => (
            <SelectItem key={value} value={value} className="text-xs">
              {t(labelKey)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {action.type === 'page' && pages.length > 0 && (
        <Select 
          value={action.pageId || ''} 
          onValueChange={(v) => onChange({ ...action, pageId: v })}
        >
          <SelectTrigger className="h-7 flex-1 text-xs">
            <SelectValue placeholder={t('editor.selectPage')} />
          </SelectTrigger>
          <SelectContent>
            {pages.map((page) => (
              <SelectItem key={page.id} value={page.id} className="text-xs">
                {page.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {action.type === 'url' && (
        <Input
          value={action.url || ''}
          onChange={(e) => onChange({ ...action, url: e.target.value })}
          placeholder="https://..."
          className="h-7 flex-1 text-xs"
        />
      )}

      {action.type === 'section' && (
        <Input
          value={action.sectionId || ''}
          onChange={(e) => onChange({ ...action, sectionId: e.target.value })}
          placeholder="#section"
          className="h-7 flex-1 text-xs"
        />
      )}
    </div>
  );
}

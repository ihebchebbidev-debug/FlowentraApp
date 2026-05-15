/**
 * LanguageSwitcherEditor — Configuration panel for navbar language switcher.
 * Features drag-and-drop reordering and custom language input.
 */
import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, GripVertical, Globe, ChevronDown, ChevronUp } from 'lucide-react';
import { SiteLanguage } from '../../types';
import { EditorSection } from './property-editors';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const FLAG_EMOJIS: Record<string, string> = {
  en: '🇬🇧', fr: '🇫🇷', es: '🇪🇸', de: '🇩🇪', it: '🇮🇹', pt: '🇵🇹',
  nl: '🇳🇱', ru: '🇷🇺', zh: '🇨🇳', ja: '🇯🇵', ko: '🇰🇷', ar: '🇹🇳',
  he: '🇮🇱', tr: '🇹🇷', hi: '🇮🇳', th: '🇹🇭', vi: '🇻🇳', pl: '🇵🇱',
  sv: '🇸🇪', da: '🇩🇰', fi: '🇫🇮', no: '🇳🇴', cs: '🇨🇿', el: '🇬🇷',
  hu: '🇭🇺', ro: '🇷🇴', uk: '🇺🇦', id: '🇮🇩', ms: '🇲🇾', bn: '🇧🇩',
};

const COMMON_LANGUAGES: SiteLanguage[] = [
  { code: 'en', label: 'English', direction: 'ltr' },
  { code: 'fr', label: 'Français', direction: 'ltr' },
  { code: 'es', label: 'Español', direction: 'ltr' },
  { code: 'de', label: 'Deutsch', direction: 'ltr' },
  { code: 'it', label: 'Italiano', direction: 'ltr' },
  { code: 'pt', label: 'Português', direction: 'ltr' },
  { code: 'nl', label: 'Nederlands', direction: 'ltr' },
  { code: 'zh', label: '中文', direction: 'ltr' },
  { code: 'ja', label: '日本語', direction: 'ltr' },
  { code: 'ko', label: '한국어', direction: 'ltr' },
  { code: 'ar', label: 'العربية', direction: 'rtl' },
  { code: 'ru', label: 'Русский', direction: 'ltr' },
  { code: 'tr', label: 'Türkçe', direction: 'ltr' },
  { code: 'hi', label: 'हिन्दी', direction: 'ltr' },
  { code: 'he', label: 'עברית', direction: 'rtl' },
  { code: 'th', label: 'ไทย', direction: 'ltr' },
  { code: 'vi', label: 'Tiếng Việt', direction: 'ltr' },
  { code: 'pl', label: 'Polski', direction: 'ltr' },
  { code: 'sv', label: 'Svenska', direction: 'ltr' },
  { code: 'da', label: 'Dansk', direction: 'ltr' },
  { code: 'fi', label: 'Suomi', direction: 'ltr' },
  { code: 'no', label: 'Norsk', direction: 'ltr' },
];

const VARIANT_OPTIONS = [
  { value: 'icon', label: 'Icon Only', icon: '🌐' },
  { value: 'flags', label: 'Flags', icon: '🇬🇧' },
  { value: 'dropdown', label: 'Dropdown', icon: '▼' },
  { value: 'pills', label: 'Pills', icon: '💊' },
  { value: 'text', label: 'Text Only', icon: 'A' },
];

interface SortableLanguageItemProps {
  lang: SiteLanguage;
  isDefault: boolean;
  canDelete: boolean;
  onSetDefault: () => void;
  onRemove: () => void;
}

function SortableLanguageItem({ lang, isDefault, canDelete, onSetDefault, onRemove }: SortableLanguageItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lang.code });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 100 : 'auto',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 p-2 rounded-lg border transition-all ${
        isDefault
          ? 'border-primary/50 bg-primary/5'
          : 'border-border/30 bg-muted/10'
      } ${isDragging ? 'shadow-lg' : ''}`}
    >
      <button
        className="touch-none cursor-grab active:cursor-grabbing p-0.5 rounded hover:bg-muted/30"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-3 w-3 text-muted-foreground/50" />
      </button>
      <span className="text-base">{FLAG_EMOJIS[lang.code] || '🌐'}</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate">{lang.label}</p>
        <p className="text-[10px] text-muted-foreground">
          {lang.code.toUpperCase()} • {lang.direction.toUpperCase()}
        </p>
      </div>
      {isDefault ? (
        <span className="text-[9px] font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded">
          Default
        </span>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          className="h-5 text-[9px] px-1.5"
          onClick={onSetDefault}
        >
          Set Default
        </Button>
      )}
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 text-muted-foreground hover:text-destructive"
        onClick={onRemove}
        disabled={!canDelete}
      >
        <Trash2 className="h-3 w-3" />
      </Button>
    </div>
  );
}

interface LanguageSwitcherEditorProps {
  showLanguageSwitcher: boolean;
  languageSwitcherVariant: string;
  languages: SiteLanguage[];
  currentLanguage: string;
  onUpdate: (props: Record<string, any>) => void;
}

export function LanguageSwitcherEditor({
  showLanguageSwitcher = false,
  languageSwitcherVariant = 'icon',
  languages = [],
  currentLanguage = 'en',
  onUpdate,
}: LanguageSwitcherEditorProps) {
  const [showAddLanguage, setShowAddLanguage] = useState(false);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customCode, setCustomCode] = useState('');
  const [customLabel, setCustomLabel] = useState('');
  const [customDirection, setCustomDirection] = useState<'ltr' | 'rtl'>('ltr');
  const [customError, setCustomError] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleToggle = (enabled: boolean) => {
    onUpdate({ showLanguageSwitcher: enabled });
    // Initialize default languages if enabling and none exist
    if (enabled && (!languages || languages.length === 0)) {
      onUpdate({
        showLanguageSwitcher: enabled,
        languages: [
          { code: 'en', label: 'English', direction: 'ltr' },
          { code: 'fr', label: 'Français', direction: 'ltr' },
        ],
        currentLanguage: 'en',
      });
    }
  };

  const handleVariantChange = (variant: string) => {
    onUpdate({ languageSwitcherVariant: variant });
  };

  const handleAddLanguage = (lang: SiteLanguage) => {
    const exists = languages.some(l => l.code.toLowerCase() === lang.code.toLowerCase());
    if (!exists) {
      onUpdate({ languages: [...languages, lang] });
    }
    setShowAddLanguage(false);
  };

  const handleAddCustomLanguage = () => {
    setCustomError('');
    
    // Validate code
    const code = customCode.trim().toLowerCase();
    if (!code) {
      setCustomError('Language code is required');
      return;
    }
    if (code.length < 2 || code.length > 5) {
      setCustomError('Code must be 2-5 characters');
      return;
    }
    if (!/^[a-z-]+$/.test(code)) {
      setCustomError('Code must only contain letters and hyphens');
      return;
    }
    
    // Validate label
    const label = customLabel.trim();
    if (!label) {
      setCustomError('Language name is required');
      return;
    }
    if (label.length > 50) {
      setCustomError('Name must be less than 50 characters');
      return;
    }
    
    // Check for duplicates
    if (languages.some(l => l.code.toLowerCase() === code)) {
      setCustomError('This language code already exists');
      return;
    }

    const newLang: SiteLanguage = {
      code,
      label,
      direction: customDirection,
    };

    onUpdate({ languages: [...languages, newLang] });
    
    // Reset form
    setCustomCode('');
    setCustomLabel('');
    setCustomDirection('ltr');
    setShowCustomForm(false);
    setShowAddLanguage(false);
  };

  const handleRemoveLanguage = (code: string) => {
    const updated = languages.filter(l => l.code !== code);
    onUpdate({ languages: updated });
    // If removed the current language, switch to first available
    if (currentLanguage === code && updated.length > 0) {
      onUpdate({ languages: updated, currentLanguage: updated[0].code });
    }
  };

  const handleSetDefault = (code: string) => {
    onUpdate({ currentLanguage: code });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = languages.findIndex(l => l.code === active.id);
      const newIndex = languages.findIndex(l => l.code === over.id);
      
      const reordered = arrayMove(languages, oldIndex, newIndex);
      onUpdate({ languages: reordered });
    }
  };

  const availableToAdd = COMMON_LANGUAGES.filter(
    lang => !languages.some(l => l.code.toLowerCase() === lang.code.toLowerCase())
  );

  return (
    <EditorSection title="Language Switcher" defaultOpen={showLanguageSwitcher}>
      {/* Enable Toggle */}
      <div className="flex items-center justify-between py-1">
        <div className="flex items-center gap-2">
          <Globe className="h-3.5 w-3.5 text-muted-foreground" />
          <Label className="text-[11px] font-medium text-foreground/70">Show Language Switcher</Label>
        </div>
        <Switch 
          checked={showLanguageSwitcher} 
          onCheckedChange={handleToggle}
        />
      </div>

      {showLanguageSwitcher && (
        <div className="space-y-3 mt-3 pt-3 border-t border-border/30">
          {/* Variant Selector */}
          <div className="space-y-1.5">
            <Label className="text-[11px] font-medium text-foreground/70">Style</Label>
            <div className="grid grid-cols-5 gap-1">
              {VARIANT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  className={`flex flex-col items-center justify-center p-2 rounded-lg border text-[10px] transition-all ${
                    languageSwitcherVariant === opt.value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border/40 hover:border-border hover:bg-muted/30'
                  }`}
                  onClick={() => handleVariantChange(opt.value)}
                  title={opt.label}
                >
                  <span className="text-sm mb-0.5">{opt.icon}</span>
                  <span className="truncate w-full text-center">{opt.label.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Languages List */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-[11px] font-medium text-foreground/70">
                Languages ({languages.length})
              </Label>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-[10px] px-2 text-primary"
                onClick={() => {
                  setShowAddLanguage(!showAddLanguage);
                  setShowCustomForm(false);
                }}
              >
                {showAddLanguage ? (
                  <>
                    <ChevronUp className="h-3 w-3 mr-1" />
                    Close
                  </>
                ) : (
                  <>
                    <Plus className="h-3 w-3 mr-1" />
                    Add
                  </>
                )}
              </Button>
            </div>

            {/* Add Language Panel */}
            {showAddLanguage && (
              <div className="p-2 rounded-lg border border-border/40 bg-muted/20 space-y-2">
                {/* Common Languages Dropdown */}
                {!showCustomForm && (
                  <>
                    <Label className="text-[10px] text-muted-foreground">Select from common languages:</Label>
                    <Select onValueChange={(code) => {
                      const lang = COMMON_LANGUAGES.find(l => l.code === code);
                      if (lang) handleAddLanguage(lang);
                    }}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Choose language..." />
                      </SelectTrigger>
                      <SelectContent className="z-[200] bg-popover border shadow-lg max-h-[250px]">
                        {availableToAdd.map((lang) => (
                          <SelectItem key={lang.code} value={lang.code} className="text-xs">
                            <span className="flex items-center gap-2">
                              <span>{FLAG_EMOJIS[lang.code] || '🌐'}</span>
                              <span>{lang.label}</span>
                              <span className="text-muted-foreground">({lang.code.toUpperCase()})</span>
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <div className="flex items-center gap-2 pt-1">
                      <div className="flex-1 h-px bg-border/40" />
                      <span className="text-[9px] text-muted-foreground">or</span>
                      <div className="flex-1 h-px bg-border/40" />
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full h-7 text-[10px]"
                      onClick={() => setShowCustomForm(true)}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add Custom Language
                    </Button>
                  </>
                )}

                {/* Custom Language Form */}
                {showCustomForm && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-[10px] font-medium">Add Custom Language</Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 text-[9px] px-1"
                        onClick={() => {
                          setShowCustomForm(false);
                          setCustomError('');
                        }}
                      >
                        ← Back
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-[9px] text-muted-foreground">Code *</Label>
                        <Input
                          value={customCode}
                          onChange={(e) => setCustomCode(e.target.value.toLowerCase())}
                          placeholder="e.g., pt-br"
                          className="h-7 text-xs"
                          maxLength={5}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[9px] text-muted-foreground">Direction</Label>
                        <Select value={customDirection} onValueChange={(v) => setCustomDirection(v as 'ltr' | 'rtl')}>
                          <SelectTrigger className="h-7 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="z-[200]">
                            <SelectItem value="ltr" className="text-xs">LTR (Left to Right)</SelectItem>
                            <SelectItem value="rtl" className="text-xs">RTL (Right to Left)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[9px] text-muted-foreground">Language Name *</Label>
                      <Input
                        value={customLabel}
                        onChange={(e) => setCustomLabel(e.target.value)}
                        placeholder="e.g., Português (Brasil)"
                        className="h-7 text-xs"
                        maxLength={50}
                      />
                    </div>

                    {customError && (
                      <p className="text-[10px] text-destructive">{customError}</p>
                    )}

                    <Button
                      size="sm"
                      className="w-full h-7 text-[10px]"
                      onClick={handleAddCustomLanguage}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add Language
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Sortable Language Items */}
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={languages.map(l => l.code)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-1">
                  {languages.map((lang) => (
                    <SortableLanguageItem
                      key={lang.code}
                      lang={lang}
                      isDefault={currentLanguage === lang.code}
                      canDelete={languages.length > 1}
                      onSetDefault={() => handleSetDefault(lang.code)}
                      onRemove={() => handleRemoveLanguage(lang.code)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>

            {languages.length === 0 && (
              <p className="text-[10px] text-muted-foreground text-center py-3">
                No languages configured. Add at least one language.
              </p>
            )}
          </div>

          {/* Drag hint */}
          {languages.length > 1 && (
            <p className="text-[10px] text-muted-foreground/60 text-center pt-2 border-t border-border/20">
              💡 Drag to reorder languages. First language is shown by default in some styles.
            </p>
          )}
        </div>
      )}
    </EditorSection>
  );
}

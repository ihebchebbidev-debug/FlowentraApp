/**
 * Language Switcher Components
 * Multiple variants for flexible placement in headers, buttons, etc.
 */
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

// Language configuration with flags and labels
export const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇬🇧', shortLabel: 'EN' },
  { code: 'fr', label: 'Français', flag: '🇫🇷', shortLabel: 'FR' },
] as const;

type LanguageCode = typeof LANGUAGES[number]['code'];

interface LanguageSwitcherBaseProps {
  className?: string;
  onLanguageChange?: (code: string) => void;
}

/**
 * Compact icon-only language switcher with dropdown
 */
export function LanguageSwitcherIcon({ className, onLanguageChange }: LanguageSwitcherBaseProps) {
  const { i18n } = useTranslation();
  const currentLang = LANGUAGES.find(l => l.code === i18n.language) || LANGUAGES[0];

  const handleChange = (code: string) => {
    i18n.changeLanguage(code);
    onLanguageChange?.(code);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className={cn("h-9 w-9", className)}>
          <Globe className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[140px]">
        {LANGUAGES.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => handleChange(lang.code)}
            className="flex items-center gap-2 cursor-pointer"
          >
            <span className="text-base">{lang.flag}</span>
            <span className="flex-1">{lang.label}</span>
            {currentLang.code === lang.code && (
              <Check className="h-4 w-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Flag-based language switcher with current flag visible
 */
export function LanguageSwitcherFlag({ className, onLanguageChange }: LanguageSwitcherBaseProps) {
  const { i18n } = useTranslation();
  const currentLang = LANGUAGES.find(l => l.code === i18n.language) || LANGUAGES[0];

  const handleChange = (code: string) => {
    i18n.changeLanguage(code);
    onLanguageChange?.(code);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className={cn("gap-1.5 px-2", className)}>
          <span className="text-lg leading-none">{currentLang.flag}</span>
          <ChevronDown className="h-3 w-3 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[160px]">
        {LANGUAGES.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => handleChange(lang.code)}
            className="flex items-center gap-2.5 cursor-pointer"
          >
            <span className="text-lg">{lang.flag}</span>
            <span className="flex-1">{lang.label}</span>
            {currentLang.code === lang.code && (
              <Check className="h-4 w-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Button with flag + text language switcher
 */
export function LanguageSwitcherButton({ 
  className, 
  onLanguageChange,
  showFullLabel = false,
}: LanguageSwitcherBaseProps & { showFullLabel?: boolean }) {
  const { i18n } = useTranslation();
  const currentLang = LANGUAGES.find(l => l.code === i18n.language) || LANGUAGES[0];

  const handleChange = (code: string) => {
    i18n.changeLanguage(code);
    onLanguageChange?.(code);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className={cn("gap-2", className)}>
          <span className="text-base leading-none">{currentLang.flag}</span>
          <span className="font-medium">
            {showFullLabel ? currentLang.label : currentLang.shortLabel}
          </span>
          <ChevronDown className="h-3.5 w-3.5 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[180px]">
        {LANGUAGES.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => handleChange(lang.code)}
            className="flex items-center gap-2.5 cursor-pointer py-2"
          >
            <span className="text-lg">{lang.flag}</span>
            <div className="flex-1">
              <div className="font-medium">{lang.label}</div>
              <div className="text-xs text-muted-foreground">{lang.shortLabel}</div>
            </div>
            {currentLang.code === lang.code && (
              <Check className="h-4 w-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Inline pill-style language switcher (horizontal tabs)
 */
export function LanguageSwitcherPills({ 
  className, 
  onLanguageChange,
  languages = ['en', 'fr'],
}: LanguageSwitcherBaseProps & { languages?: string[] }) {
  const { i18n } = useTranslation();
  const filteredLangs = LANGUAGES.filter(l => languages.includes(l.code));

  const handleChange = (code: string) => {
    i18n.changeLanguage(code);
    onLanguageChange?.(code);
  };

  return (
    <div className={cn("inline-flex items-center gap-1 p-1 bg-muted/50 rounded-lg", className)}>
      {filteredLangs.map((lang) => (
        <button
          key={lang.code}
          onClick={() => handleChange(lang.code)}
          className={cn(
            "px-3 py-1.5 text-sm font-medium rounded-md transition-all",
            i18n.language === lang.code
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-background/50"
          )}
        >
          <span className="mr-1.5">{lang.flag}</span>
          {lang.shortLabel}
        </button>
      ))}
    </div>
  );
}

/**
 * Vertical list language switcher for sidebars/menus
 */
export function LanguageSwitcherList({ 
  className, 
  onLanguageChange,
  languages,
}: LanguageSwitcherBaseProps & { languages?: string[] }) {
  const { i18n } = useTranslation();
  const filteredLangs = languages 
    ? LANGUAGES.filter(l => languages.includes(l.code))
    : LANGUAGES;

  const handleChange = (code: string) => {
    i18n.changeLanguage(code);
    onLanguageChange?.(code);
  };

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      {filteredLangs.map((lang) => (
        <button
          key={lang.code}
          onClick={() => handleChange(lang.code)}
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors text-left",
            i18n.language === lang.code
              ? "bg-primary/10 text-primary font-medium"
              : "text-muted-foreground hover:bg-accent hover:text-foreground"
          )}
        >
          <span className="text-lg">{lang.flag}</span>
          <span className="flex-1">{lang.label}</span>
          {i18n.language === lang.code && (
            <Check className="h-4 w-4" />
          )}
        </button>
      ))}
    </div>
  );
}

/**
 * Compact text-only switcher for minimal UIs
 */
export function LanguageSwitcherText({ className, onLanguageChange }: LanguageSwitcherBaseProps) {
  const { i18n } = useTranslation();
  const currentLang = LANGUAGES.find(l => l.code === i18n.language) || LANGUAGES[0];

  const handleChange = (code: string) => {
    i18n.changeLanguage(code);
    onLanguageChange?.(code);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className={cn(
          "inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors",
          className
        )}>
          <Globe className="h-3.5 w-3.5" />
          <span>{currentLang.shortLabel}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[140px]">
        {LANGUAGES.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => handleChange(lang.code)}
            className="flex items-center gap-2 cursor-pointer"
          >
            <span>{lang.flag}</span>
            <span className="flex-1">{lang.label}</span>
            {currentLang.code === lang.code && (
              <Check className="h-4 w-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Default export with all variants
export default {
  Icon: LanguageSwitcherIcon,
  Flag: LanguageSwitcherFlag,
  Button: LanguageSwitcherButton,
  Pills: LanguageSwitcherPills,
  List: LanguageSwitcherList,
  Text: LanguageSwitcherText,
};

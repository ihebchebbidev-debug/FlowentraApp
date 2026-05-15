import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OnboardingData } from "../pages/Onboarding";
import { useTheme } from "@/hooks/useTheme";
import { Palette, Globe2, Sun, Moon, Monitor, ArrowLeft, ArrowRight, Sidebar, Layout, Table, List, Loader2, Check, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useLoading } from "@/shared/contexts/LoadingContext";

interface PreferencesStepProps {
  data: OnboardingData;
  onNext: (data: Partial<OnboardingData>) => void;
  onBack: () => void;
  isFirst: boolean;
}

// Color mapping for CSS variables - used to apply color theme in real-time
const colorMappings: Record<string, { primary: string; primaryHover: string; accent: string }> = {
  blue: {
    primary: '237 84% 67%',
    primaryHover: '237 84% 57%',
    accent: '214 100% 67%'
  },
  red: {
    primary: '0 84% 60%',
    primaryHover: '0 84% 50%',
    accent: '0 84% 70%'
  },
  green: {
    primary: '142 76% 36%',
    primaryHover: '142 76% 26%',
    accent: '142 76% 46%'
  },
  purple: {
    primary: '270 95% 75%',
    primaryHover: '270 95% 65%',
    accent: '270 95% 85%'
  },
  orange: {
    primary: '25 95% 53%',
    primaryHover: '25 95% 43%',
    accent: '25 95% 63%'
  },
  indigo: {
    primary: '239 84% 67%',
    primaryHover: '239 84% 57%',
    accent: '239 84% 77%'
  }
};

const languages = [
  { code: 'en', name: 'English', flag: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 30" className="w-7 h-5 rounded-sm shadow-sm">
      <clipPath id="gb"><path d="M0 0v30h60V0z"/></clipPath>
      <g clipPath="url(#gb)"><path d="M0 0v30h60V0z" fill="#012169"/><path d="M0 0l60 30m0-30L0 30" stroke="#fff" strokeWidth="6"/><path d="M0 0l60 30m0-30L0 30" clipPath="url(#gb)" stroke="#C8102E" strokeWidth="4"/><path d="M30 0v30M0 15h60" stroke="#fff" strokeWidth="10"/><path d="M30 0v30M0 15h60" stroke="#C8102E" strokeWidth="6"/></g>
    </svg>
  )},
  { code: 'fr', name: 'French', flag: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 3 2" className="w-7 h-5 rounded-sm shadow-sm">
      <rect width="1" height="2" fill="#002395"/><rect x="1" width="1" height="2" fill="#fff"/><rect x="2" width="1" height="2" fill="#ED2939"/>
    </svg>
  )},
];

const primaryColors = [
  { value: 'blue', name: 'Ocean Blue', color: 'bg-blue-500', ring: 'ring-blue-500' },
  { value: 'red', name: 'Ruby Red', color: 'bg-red-500', ring: 'ring-red-500' },
  { value: 'green', name: 'Forest Green', color: 'bg-green-500', ring: 'ring-green-500' },
  { value: 'purple', name: 'Royal Purple', color: 'bg-purple-500', ring: 'ring-purple-500' },
  { value: 'orange', name: 'Sunset Orange', color: 'bg-orange-500', ring: 'ring-orange-500' },
  { value: 'indigo', name: 'Deep Indigo', color: 'bg-indigo-500', ring: 'ring-indigo-500' }
];

const layoutModes = [
  { value: 'sidebar', labelKey: 'onboarding.steps.preferences.layout.sidebar', descKey: 'onboarding.steps.preferences.layout.sidebarDesc', icon: Sidebar },
  { value: 'topbar', labelKey: 'onboarding.steps.preferences.layout.topbar', descKey: 'onboarding.steps.preferences.layout.topbarDesc', icon: Layout }
] as const;

const dataViews = [
  { value: 'table', labelKey: 'onboarding.steps.preferences.dataView.table', descKey: 'onboarding.steps.preferences.dataView.tableDesc', icon: Table },
  { value: 'list', labelKey: 'onboarding.steps.preferences.dataView.list', descKey: 'onboarding.steps.preferences.dataView.listDesc', icon: List }
] as const;

const themes = [
  { value: 'light', label: 'Light', icon: Sun, description: 'Clean and bright interface' },
  { value: 'dark', label: 'Dark', icon: Moon, description: 'Easy on the eyes' },
  { value: 'system', label: 'System', icon: Monitor, description: 'Matches your device setting' }
] as const;

function SectionCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-border/60 bg-card/50 backdrop-blur-sm p-4 transition-all duration-300 hover:border-border ${className}`}>
      {children}
    </div>
  );
}

function SectionHeader({ icon: Icon, title, subtitle, iconBg = 'bg-primary/10 text-primary' }: { icon: React.ElementType; title: string; subtitle: string; iconBg?: string }) {
  return (
    <div className="flex items-center gap-2.5 mb-3">
      <div className={`p-1.5 rounded-lg ${iconBg} shrink-0`}>
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <h3 className="text-sm font-semibold text-foreground leading-tight">{title}</h3>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  );
}

export function PreferencesStep({
  data,
  onNext,
  onBack,
  isFirst: _isFirst
}: PreferencesStepProps) {
  const { t, i18n } = useTranslation();
  const { withLoading } = useLoading();
  const [formData, setFormData] = useState(data.preferences);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { setTheme } = useTheme();

  const applyColorTheme = useCallback((color: string) => {
    const mapping = colorMappings[color];
    if (!mapping) return;
    const root = document.documentElement;
    root.style.setProperty('--primary', mapping.primary);
    root.style.setProperty('--primary-hover', mapping.primaryHover);
    root.style.setProperty('--accent', mapping.accent);
  }, []);

  useEffect(() => {
    setTheme(formData.theme);
  }, [formData.theme, setTheme]);

  useEffect(() => {
    applyColorTheme(formData.primaryColor);
  }, [formData.primaryColor, applyColorTheme]);

  // Apply language changes in real-time
  useEffect(() => {
    if (formData.language && formData.language !== i18n.language) {
      i18n.changeLanguage(formData.language);
      localStorage.setItem('language', formData.language);
    }
  }, [formData.language, i18n]);

  const handleNext = async () => {
    setIsSubmitting(true);
    try {
      await withLoading(async () => {
        const userData = localStorage.getItem('user_data');
        if (!userData) throw new Error('No user data found');
        const user = JSON.parse(userData);
        const { preferencesService } = await import('@/services/preferencesService');
        const response = await preferencesService.createUserPreferencesWithUserId(user.id.toString(), formData);
        if (!response.success) {
          console.warn('Failed to save preferences to server, keeping local copy:', response.message);
          localStorage.setItem('user-preferences', JSON.stringify(formData));
        }
        onNext({ preferences: formData });
      }, 'Saving your preferences...');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full">
      {/* Top row: Theme, Language, and Color — 3 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        {/* Theme Selection */}
        <SectionCard>
          <SectionHeader
            icon={Sun}
            title={t('onboarding.steps.preferences.theme.title')}
            subtitle={t('onboarding.steps.preferences.theme.description')}
          />
          <RadioGroup
            value={formData.theme}
            onValueChange={(value: 'light' | 'dark' | 'system') => setFormData({ ...formData, theme: value })}
            className="space-y-1.5"
          >
            {themes.map(theme => {
              const IconComp = theme.icon;
              const isSelected = formData.theme === theme.value;
              return (
                <div key={theme.value} className="relative">
                  <RadioGroupItem value={theme.value} id={`theme-${theme.value}`} className="peer sr-only" />
                  <Label
                    htmlFor={`theme-${theme.value}`}
                    className={`flex items-center gap-2.5 p-2.5 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                      isSelected
                        ? 'border-primary bg-primary/5'
                        : 'border-transparent bg-muted/30 hover:bg-muted/50'
                    }`}
                  >
                    <div className={`p-1.5 rounded-md transition-colors ${isSelected ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'}`}>
                      <IconComp className="h-3.5 w-3.5" />
                    </div>
                    <span className="text-sm font-medium flex-1">{t(`onboarding.steps.preferences.theme.${theme.value}`)}</span>
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                      isSelected ? 'border-primary bg-primary' : 'border-muted-foreground/25'
                    }`}>
                      {isSelected && <Check className="h-2.5 w-2.5 text-primary-foreground" />}
                    </div>
                  </Label>
                </div>
              );
            })}
          </RadioGroup>
        </SectionCard>

        {/* Language Selection */}
        <SectionCard>
          <SectionHeader
            icon={Globe2}
            title={t('onboarding.steps.preferences.language.title')}
            subtitle={t('onboarding.steps.preferences.language.description')}
            iconBg="bg-accent/10 text-accent"
          />
          <div className="space-y-1.5">
            {languages.map(lang => {
              const isSelected = formData.language === lang.code;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => setFormData({ ...formData, language: lang.code })}
                  className={`w-full flex items-center gap-2.5 p-2.5 rounded-lg border-2 text-left transition-all duration-200 ${
                    isSelected
                      ? 'border-primary bg-primary/5'
                      : 'border-transparent bg-muted/30 hover:bg-muted/50'
                  }`}
                >
                  {lang.flag}
                  <span className="text-sm font-medium flex-1">{t(`onboarding.languages.${lang.code}`, lang.name)}</span>
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                    isSelected ? 'border-primary bg-primary' : 'border-muted-foreground/25'
                  }`}>
                    {isSelected && <Check className="h-2.5 w-2.5 text-primary-foreground" />}
                  </div>
                </button>
              );
            })}
          </div>
        </SectionCard>
        {/* Accent Color — in the 3rd column */}
        <SectionCard>
          <SectionHeader
            icon={Palette}
            title={t('onboarding.steps.preferences.color.title')}
            subtitle={t('onboarding.steps.preferences.color.description')}
          />
          <RadioGroup
            value={formData.primaryColor}
            onValueChange={(value: string) => setFormData({ ...formData, primaryColor: value })}
            className="grid grid-cols-3 gap-2"
          >
            {primaryColors.map(color => {
              const isSelected = formData.primaryColor === color.value;
              return (
                <div key={color.value} className="relative group">
                  <RadioGroupItem value={color.value} id={`color-${color.value}`} className="peer sr-only" />
                  <Label
                    htmlFor={`color-${color.value}`}
                    className="flex flex-col items-center gap-1.5 cursor-pointer py-1"
                  >
                    <div className={`relative w-9 h-9 rounded-full ${color.color} shadow-sm transition-all duration-300 ${
                      isSelected ? 'scale-110 ring-3 ring-offset-2 ring-offset-background ' + color.ring : 'hover:scale-105'
                    }`}>
                      {isSelected && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Check className="h-4 w-4 text-white drop-shadow-md" />
                        </div>
                      )}
                    </div>
                    <span className={`text-[10px] font-medium transition-colors ${isSelected ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {color.name.split(' ')[0]}
                    </span>
                  </Label>
                </div>
              );
            })}
          </RadioGroup>
        </SectionCard>
      </div>

      {/* Bottom row: Layout & Data View side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* Layout Mode */}
        <SectionCard>
          <SectionHeader
            icon={Layout}
            title={t('onboarding.steps.preferences.layout.title')}
            subtitle={t('onboarding.steps.preferences.layout.description')}
            iconBg="bg-accent/10 text-accent"
          />
          <RadioGroup
            value={formData.layoutMode}
            onValueChange={(value: 'sidebar' | 'topbar') => setFormData({ ...formData, layoutMode: value })}
            className="space-y-1.5"
          >
            {layoutModes.map(layout => {
              const isSelected = formData.layoutMode === layout.value;
              return (
                <div key={layout.value} className="relative">
                  <RadioGroupItem value={layout.value} id={`layout-${layout.value}`} className="peer sr-only" />
                  <Label
                    htmlFor={`layout-${layout.value}`}
                    className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                      isSelected
                        ? 'border-primary bg-primary/5'
                        : 'border-transparent bg-muted/30 hover:bg-muted/50'
                    }`}
                  >
                    {/* Mini layout preview */}
                    <div className={`w-12 h-8 rounded border-2 overflow-hidden flex shrink-0 ${isSelected ? 'border-primary/40' : 'border-muted-foreground/15'}`}>
                      {layout.value === 'sidebar' ? (
                        <>
                          <div className={`w-3 h-full ${isSelected ? 'bg-primary/20' : 'bg-muted'}`} />
                          <div className="flex-1 p-0.5">
                            <div className={`w-full h-0.5 rounded-full mb-0.5 ${isSelected ? 'bg-primary/30' : 'bg-muted-foreground/10'}`} />
                            <div className={`w-3/4 h-0.5 rounded-full ${isSelected ? 'bg-primary/20' : 'bg-muted-foreground/5'}`} />
                          </div>
                        </>
                      ) : (
                        <div className="w-full">
                          <div className={`w-full h-2 ${isSelected ? 'bg-primary/20' : 'bg-muted'}`} />
                          <div className="p-0.5">
                            <div className={`w-full h-0.5 rounded-full mb-0.5 ${isSelected ? 'bg-primary/30' : 'bg-muted-foreground/10'}`} />
                            <div className={`w-3/4 h-0.5 rounded-full ${isSelected ? 'bg-primary/20' : 'bg-muted-foreground/5'}`} />
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium block">{t(layout.labelKey)}</span>
                      <span className="text-xs text-muted-foreground">{t(layout.descKey)}</span>
                    </div>
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                      isSelected ? 'border-primary bg-primary' : 'border-muted-foreground/25'
                    }`}>
                      {isSelected && <Check className="h-2.5 w-2.5 text-primary-foreground" />}
                    </div>
                  </Label>
                </div>
              );
            })}
          </RadioGroup>
        </SectionCard>

        {/* Data View */}
        <SectionCard>
          <SectionHeader
            icon={Table}
            title={t('onboarding.steps.preferences.dataView.title')}
            subtitle={t('onboarding.steps.preferences.dataView.description')}
          />
          <RadioGroup
            value={formData.dataView}
            onValueChange={(value: 'table' | 'list') => setFormData({ ...formData, dataView: value })}
            className="space-y-1.5"
          >
            {dataViews.map(view => {
              const isSelected = formData.dataView === view.value;
              return (
                <div key={view.value} className="relative">
                  <RadioGroupItem value={view.value} id={`view-${view.value}`} className="peer sr-only" />
                  <Label
                    htmlFor={`view-${view.value}`}
                    className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                      isSelected
                        ? 'border-primary bg-primary/5'
                        : 'border-transparent bg-muted/30 hover:bg-muted/50'
                    }`}
                  >
                    {/* Mini data view preview */}
                    <div className={`w-12 h-8 rounded border-2 overflow-hidden shrink-0 p-1 ${isSelected ? 'border-primary/40' : 'border-muted-foreground/15'}`}>
                      {view.value === 'table' ? (
                        <div className="w-full h-full flex flex-col gap-0.5">
                          <div className={`w-full h-1 rounded-sm ${isSelected ? 'bg-primary/30' : 'bg-muted'}`} />
                          <div className={`w-full h-0.5 rounded-sm ${isSelected ? 'bg-primary/15' : 'bg-muted-foreground/5'}`} />
                          <div className={`w-full h-0.5 rounded-sm ${isSelected ? 'bg-primary/15' : 'bg-muted-foreground/5'}`} />
                        </div>
                      ) : (
                        <div className="w-full h-full flex flex-col gap-0.5">
                          <div className="flex items-center gap-0.5">
                            <div className={`w-1 h-1 rounded-full shrink-0 ${isSelected ? 'bg-primary/40' : 'bg-muted'}`} />
                            <div className={`flex-1 h-0.5 rounded-full ${isSelected ? 'bg-primary/20' : 'bg-muted-foreground/5'}`} />
                          </div>
                          <div className="flex items-center gap-0.5">
                            <div className={`w-1 h-1 rounded-full shrink-0 ${isSelected ? 'bg-primary/40' : 'bg-muted'}`} />
                            <div className={`flex-1 h-0.5 rounded-full ${isSelected ? 'bg-primary/20' : 'bg-muted-foreground/5'}`} />
                          </div>
                          <div className="flex items-center gap-0.5">
                            <div className={`w-1 h-1 rounded-full shrink-0 ${isSelected ? 'bg-primary/40' : 'bg-muted'}`} />
                            <div className={`flex-1 h-0.5 rounded-full ${isSelected ? 'bg-primary/20' : 'bg-muted-foreground/5'}`} />
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium block">{t(view.labelKey)}</span>
                      <span className="text-xs text-muted-foreground">{t(view.descKey)}</span>
                    </div>
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                      isSelected ? 'border-primary bg-primary' : 'border-muted-foreground/25'
                    }`}>
                      {isSelected && <Check className="h-2.5 w-2.5 text-primary-foreground" />}
                    </div>
                  </Label>
                </div>
              );
            })}
          </RadioGroup>
        </SectionCard>
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <Button variant="outline" onClick={onBack} className="h-9 px-6 text-sm border border-border hover:bg-muted/50 transition-colors rounded-lg">
          <ArrowLeft className="h-3.5 w-3.5 mr-2" />
          {t('onboarding.back')}
        </Button>
        <Button onClick={handleNext} disabled={isSubmitting} className="h-9 px-8 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors rounded-lg">
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              {t('onboarding.steps.preferences.button')}
              <ArrowRight className="h-3.5 w-3.5 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

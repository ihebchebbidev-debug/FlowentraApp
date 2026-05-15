import { useState, useEffect, useRef, useCallback } from "react";
import { PersonalInfoStep } from "../components/PersonalInfoStep";
import { PreferencesStep } from "../components/PreferencesStep";
import { WorkAreaStep } from "../components/WorkAreaStep";
import { CompanyInfoStep } from "../components/CompanyInfoStep";
import { EmailCalendarStep } from "../components/EmailCalendarStep";
import { ProfilePictureStep } from "../components/ProfilePictureStep";
import { SetupLoadingStep } from "../components/SetupLoadingStep";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import { useNavigate } from "react-router-dom";
import { authService } from '@/services/authService';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import useOnboardingTranslations from '../hooks/useOnboardingTranslations';
import { Check, User, Palette, Briefcase, Building2, Mail, Rocket, Camera } from "lucide-react";
import { useCompanyLogoWithDefault } from "@/hooks/useCompanyLogo";
import { motion, AnimatePresence } from "framer-motion";

export interface OnboardingData {
  personalInfo: {
    firstName: string;
    lastName: string;
    phone?: string;
    country: string;
  };
  preferences: {
    theme: 'light' | 'dark' | 'system';
    language: string;
    primaryColor: string;
    layoutMode: 'sidebar' | 'topbar';
    dataView: 'table' | 'list' | 'grid';
  };
  workArea: string;
  companyInfo?: {
    name?: string;
    logo?: File | string | null;
    website?: string;
  };
}

const Onboarding = () => {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const currentUser = authService.getCurrentUserFromStorage();
  const { t } = useTranslation();
  useOnboardingTranslations();
  const { logo: companyLogo, isDefault: isDefaultLogo } = useCompanyLogoWithDefault();
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const prevStepRef = useRef(0);
  const [data, setData] = useState<OnboardingData>({
    personalInfo: {
      firstName: '',
      lastName: '',
      phone: '',
      country: ''
    },
    preferences: {
      theme: 'light',
      language: 'en',
      primaryColor: 'blue',
      layoutMode: 'sidebar',
      dataView: 'table'
    },
    workArea: '',
    companyInfo: {
      name: '',
      logo: null,
      website: ''
    }
  });

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      navigate('/login', { replace: true });
      return;
    }
    const userData = authService.getCurrentUserFromStorage();
    const hasCompletedOnboarding = userData?.onboardingCompleted || localStorage.getItem('onboarding-completed');
    if (hasCompletedOnboarding) {
      navigate('/dashboard', { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    if (currentUser &&
        (!data.personalInfo.firstName ||
         !data.personalInfo.lastName ||
         !data.workArea)) {
      setData(prev => ({
        ...prev,
        personalInfo: {
          firstName: currentUser.firstName || prev.personalInfo.firstName,
          lastName: currentUser.lastName || prev.personalInfo.lastName,
          phone: currentUser.phoneNumber || prev.personalInfo.phone || '',
          country: currentUser.country || prev.personalInfo.country
        },
        workArea: currentUser.industry || prev.workArea
      }));
    }
  }, []);

  const steps = [
    {
      component: PersonalInfoStep,
      titleKey: 'onboarding.steps.personal.title',
      descKey: 'onboarding.steps.personal.description',
      icon: User,
    },
    {
      component: PreferencesStep,
      titleKey: 'onboarding.steps.preferences.title',
      descKey: 'onboarding.steps.preferences.description',
      icon: Palette,
    },
    {
      component: WorkAreaStep,
      titleKey: 'onboarding.steps.workArea.title',
      descKey: 'onboarding.steps.workArea.description',
      icon: Briefcase,
    },
    {
      component: CompanyInfoStep,
      titleKey: 'onboarding.steps.company.title',
      descKey: 'onboarding.steps.company.description',
      icon: Building2,
    },
    {
      component: EmailCalendarStep,
      titleKey: 'onboarding.steps.emailCalendar.title',
      descKey: 'onboarding.steps.emailCalendar.description',
      icon: Mail,
    },
    {
      component: ProfilePictureStep,
      titleKey: 'onboarding.steps.profilePicture.title',
      descKey: 'onboarding.steps.profilePicture.description',
      icon: Camera,
    },
    {
      component: SetupLoadingStep,
      titleKey: 'onboarding.steps.setup.title',
      descKey: 'onboarding.steps.setup.description',
      icon: Rocket,
    },
  ];

  // Display steps exclude the final loading step from the stepper
  const displaySteps = steps.slice(0, -1);
  const displayIndex = Math.min(currentStep, displaySteps.length - 1);
  const isSetupStep = currentStep === steps.length - 1;
  const progressPercentage = ((displayIndex + 1) / displaySteps.length) * 100;

  const handleNext = useCallback((stepData: Partial<OnboardingData>) => {
    setData(prev => ({ ...prev, ...stepData }));
    if (currentStep < steps.length - 1) {
      setDirection(1);
      prevStepRef.current = currentStep;
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    }
  }, [currentStep, steps.length]);

  const handleBack = useCallback(() => {
    if (currentStep > 0) {
      setDirection(-1);
      prevStepRef.current = currentStep;
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    }
  }, [currentStep]);

  const handleComplete = async () => {
    try {
      localStorage.setItem('user-onboarding-data', JSON.stringify(data));
      try {
        const storedPdf = localStorage.getItem('pdf-settings');
        const pdfSettings = storedPdf ? JSON.parse(storedPdf) : null;
        const updatedPdf = pdfSettings ? { ...pdfSettings } : null;
        const companyLogoVal = data.companyInfo?.logo;
        if (companyLogoVal && typeof companyLogoVal === 'string') {
          const base = updatedPdf || {
            company: { name: data.companyInfo?.name || '' },
            showElements: { logo: true }
          };
          base.company = { ...base.company, logo: companyLogoVal };
          base.showElements = { ...(base.showElements || {}), logo: true };
          localStorage.setItem('pdf-settings', JSON.stringify(base));
        }
      } catch (err) {
        console.error('Failed to persist pdf-settings during onboarding:', err);
      }

      await refreshUser();
      navigate('/dashboard', { replace: true });
    } catch (err) {
      console.error('Failed to complete onboarding:', err);
      navigate('/dashboard', { replace: true });
    }
  };

  const CurrentStepComponent = steps[currentStep].component;

  return (
    <div className="min-h-screen bg-background">
      <div className="flex min-h-screen">
        {/* Left sidebar - professional vertical stepper (desktop only) */}
        <aside className="hidden lg:flex w-[300px] flex-col border-r border-border/50 bg-muted/10 p-8">
          {/* Brand Logo */}
          <div className="mb-12">
            <img 
              src={companyLogo} 
              alt="Logo" 
              className={`h-10 ${isDefaultLogo ? 'dark:brightness-0 dark:invert' : ''}`}
            />
          </div>

          {/* Vertical step list */}
          <nav className="flex-1">
            <ol className="space-y-0.5">
              {displaySteps.map((step, index) => {
                const isDone = index < currentStep;
                const isCurrent = index === displayIndex && !isSetupStep;
                const StepIcon = step.icon;
                return (
                  <li key={index}>
                    <div
                      className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 ${
                        isCurrent
                          ? 'bg-primary/8 text-foreground'
                          : isDone
                          ? 'text-foreground'
                          : 'text-muted-foreground/40'
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-medium transition-all duration-300 ${
                          isDone
                            ? 'bg-primary text-primary-foreground'
                            : isCurrent
                            ? 'bg-primary text-primary-foreground shadow-md'
                            : 'bg-muted/60 border border-border/50 text-muted-foreground/50'
                        }`}
                      >
                        {isDone ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <StepIcon className="h-4 w-4" />
                        )}
                      </div>
                      <span className={`text-sm ${isCurrent ? 'font-semibold' : isDone ? 'font-medium' : 'font-normal'}`}>
                        {t(step.titleKey)}
                      </span>
                    </div>
                    {/* Connector line */}
                    {index < displaySteps.length - 1 && (
                      <div className="flex justify-start ml-[19px] py-0.5">
                        <div className={`w-px h-3 transition-colors duration-300 ${
                          index < currentStep ? 'bg-primary/40' : 'bg-border/40'
                        }`} />
                      </div>
                    )}
                  </li>
                );
              })}
            </ol>
          </nav>

          {/* Bottom section */}
          <div className="space-y-4 pt-6 border-t border-border/30">
            <LanguageSwitcher variant="minimal" />
            <p className="text-[11px] text-muted-foreground/50">
              {t('onboarding.step', { current: displayIndex + 1, total: displaySteps.length })}
            </p>
          </div>
        </aside>

        {/* Main content area */}
        <main className="flex-1 flex flex-col">
          {/* Top bar (mobile) */}
          <header className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-border/50 bg-card/50 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <img 
                src={companyLogo} 
                alt="Logo" 
                className={`h-7 ${isDefaultLogo ? 'dark:brightness-0 dark:invert' : ''}`}
              />
            </div>
            <div className="flex items-center gap-3">
              <LanguageSwitcher variant="minimal" />
              <span className="text-xs text-muted-foreground font-medium">
                {t('onboarding.step', { current: displayIndex + 1, total: displaySteps.length })}
              </span>
            </div>
          </header>

          {/* Mobile progress bar */}
          {!isSetupStep && (
            <div className="lg:hidden h-0.5 bg-muted/50">
              <motion.div
                className="h-full bg-primary"
                initial={false}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
          )}

          {/* Desktop progress bar at TOP */}
          {!isSetupStep && (
            <div className="hidden lg:block px-10 pt-6">
              <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    {t('onboarding.step', { current: displayIndex + 1, total: displaySteps.length })}
                  </span>
                  <span className="text-xs font-medium text-primary">
                    {Math.round(progressPercentage)}%
                  </span>
                </div>
                <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-primary rounded-full"
                    initial={false}
                    animate={{ width: `${progressPercentage}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Content */}
          <div className="flex-1 flex items-start lg:items-center justify-center overflow-y-auto">
            <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-10 py-6 lg:py-8">
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={currentStep}
                  custom={direction}
                  variants={{
                    enter: (d: number) => ({
                      opacity: 0,
                      x: d * 60,
                      filter: 'blur(4px)',
                    }),
                    center: {
                      opacity: 1,
                      x: 0,
                      filter: 'blur(0px)',
                    },
                    exit: (d: number) => ({
                      opacity: 0,
                      x: d * -60,
                      filter: 'blur(4px)',
                    }),
                  }}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{
                    duration: 0.4,
                    ease: [0.25, 0.46, 0.45, 0.94],
                  }}
                >
                  {!isSetupStep && (
                    <motion.div 
                      className="mb-5 lg:mb-6"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, delay: 0.1, ease: "easeOut" }}
                    >
                      <h2 className="text-2xl lg:text-3xl font-bold text-foreground tracking-tight">
                        {t(steps[currentStep].titleKey)}
                      </h2>
                      <p className="text-sm lg:text-base text-muted-foreground mt-2 max-w-lg">
                        {t(steps[currentStep].descKey)}
                      </p>
                    </motion.div>
                  )}

                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.15, ease: "easeOut" }}
                  >
                    {currentStep === steps.length - 1 ? (
                      <SetupLoadingStep data={data} onComplete={handleComplete} />
                    ) : currentStep === 0 ? (
                      <PersonalInfoStep data={data} onNext={handleNext} isFirst={true} />
                    ) : currentStep === 1 ? (
                      <PreferencesStep data={data} onNext={handleNext} onBack={handleBack} isFirst={false} />
                    ) : currentStep === 2 ? (
                      <WorkAreaStep data={data} onNext={handleNext} onBack={handleBack} isFirst={false} />
                    ) : currentStep === 3 ? (
                      <CompanyInfoStep data={data} onNext={handleNext} onBack={handleBack} isFirst={false} />
                    ) : currentStep === 4 ? (
                      <EmailCalendarStep data={data} onNext={handleNext} onBack={handleBack} isFirst={false} />
                    ) : currentStep === 5 ? (
                      <ProfilePictureStep data={data} onNext={handleNext} onBack={handleBack} isFirst={false} />
                    ) : null}
                  </motion.div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Onboarding;

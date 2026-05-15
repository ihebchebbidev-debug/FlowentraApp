import { useEffect, useRef, useState } from "react";
import { OnboardingData } from "../pages/Onboarding";
import { CheckCircle, Loader2, Sparkles, Rocket, AlertCircle } from "lucide-react";
import { useTranslation } from 'react-i18next';
import { authService } from '@/services/authService';
import { preferencesService } from '@/services/preferencesService';

interface SetupLoadingStepProps {
  data: OnboardingData;
  onComplete: () => void;
}

const setupStepKeys = [
  { id: 'profile', labelKey: 'onboarding.steps.setup.creatingProfile' },
  { id: 'preferences', labelKey: 'onboarding.steps.setup.settingPreferences' },
  { id: 'finalize', labelKey: 'onboarding.steps.setup.finalizing' }
];

export function SetupLoadingStep({ data, onComplete }: SetupLoadingStepProps) {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const startedRef = useRef(false);
  const mountedRef = useRef(true);

  // Step 1: Update user profile with collected data
  async function updateUserProfile() {
    console.log('[Onboarding] Step 1: Updating user profile');
    const currentUser = authService.getCurrentUserFromStorage();
    if (!currentUser?.id) throw new Error('User not found');

    const updatePayload = {
      firstName: data.personalInfo.firstName,
      lastName: data.personalInfo.lastName,
      phoneNumber: data.personalInfo.phone,
      country: data.personalInfo.country,
      industry: data.workArea,
      companyName: data.companyInfo?.name,
      companyWebsite: data.companyInfo?.website,
    };

    console.log('[Onboarding] Calling backend API to update profile', updatePayload);
    const response = await authService.updateUser(updatePayload);

    if (!response.success) {
      throw new Error(response.message || 'Failed to update profile');
    }

    console.log('[Onboarding] Profile updated successfully');
  }

  // Step 2: Create user preferences in database
  async function createUserPreferences() {
    console.log('[Onboarding] Step 2: Creating user preferences');
    const currentUser = authService.getCurrentUserFromStorage();
    if (!currentUser?.id) throw new Error('User not found');

    const preferencesPayload = {
      theme: data.preferences.theme,
      language: data.preferences.language,
      primaryColor: data.preferences.primaryColor,
      layoutMode: data.preferences.layoutMode,
      dataView: data.preferences.dataView,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      dateFormat: 'MM/DD/YYYY',
      timeFormat: '12h',
      currency: 'USD',
      numberFormat: 'comma',
      notifications: '{}',
      sidebarCollapsed: false,
      compactMode: false,
      showTooltips: true,
      animationsEnabled: true,
      soundEnabled: true,
      autoSave: true,
      workArea: data.workArea,
      dashboardLayout: '{}',
      quickAccessItems: '[]'
    };

    console.log('[Onboarding] Calling backend API to create preferences', preferencesPayload);
    const result = await preferencesService.createUserPreferencesWithUserId(
      currentUser.id.toString(),
      preferencesPayload
    );

    if (!result.success) {
      throw new Error(result.message || 'Failed to create preferences');
    }

    // Store preferences locally for offline access
    localStorage.setItem('user-preferences', JSON.stringify(preferencesPayload));
    
    // Also update user_data with preferences JSON for persistence across logins
    const userData = localStorage.getItem('user_data');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        user.preferences = JSON.stringify(preferencesPayload);
        localStorage.setItem('user_data', JSON.stringify(user));
      } catch (e) {
        console.warn('[Onboarding] Failed to update user_data with preferences');
      }
    }
    
    console.log('[Onboarding] Preferences created successfully');
  }

  // Step 3: Mark onboarding as completed
  async function markOnboardingComplete() {
    console.log('[Onboarding] Step 3: Marking onboarding as completed');
    
    const response = await authService.markOnboardingCompleted();

    if (!response.success) {
      throw new Error(response.message || 'Failed to mark onboarding as complete');
    }

    // Set local completion flag
    localStorage.setItem('onboarding-completed', 'true');
    console.log('[Onboarding] Onboarding marked as complete');
  }

  useEffect(() => {
    // Always mark as mounted first (fixes StrictMode double-render issue)
    mountedRef.current = true;
    
    if (startedRef.current) {
      console.log('[Onboarding] SetupLoadingStep already started; keeping mounted state');
      // Don't register cleanup - let the original instance handle it
      return;
    }
    startedRef.current = true;

    const processSteps = async () => {
      const steps = [
        { id: 'profile', action: updateUserProfile },
        { id: 'preferences', action: createUserPreferences },
        { id: 'finalize', action: markOnboardingComplete }
      ];

      for (let i = 0; i < steps.length; i++) {
        if (!mountedRef.current) {
          console.log('[Onboarding] Component unmounted, stopping steps');
          return;
        }
        
        const step = steps[i];
        setCurrentStep(i);

        try {
          console.log(`[Onboarding] Executing step: ${step.id}`);
          await step.action();
          console.log(`[Onboarding] Step completed: ${step.id}`);
          setCompletedSteps(prev => [...prev, step.id]);
          
          // Visual feedback delay
          await new Promise(resolve => setTimeout(resolve, 800));
        } catch (err: any) {
          console.error(`[Onboarding] Step failed: ${step.id}`, err);
          setError(err.message || 'Setup failed');
          
          // Wait a bit then continue anyway (graceful degradation)
          await new Promise(resolve => setTimeout(resolve, 1500));
          setCompletedSteps(prev => [...prev, step.id]);
        }
      }

      // All steps completed
      if (!mountedRef.current) return;
      console.log('[Onboarding] All steps completed, calling onComplete');
      setTimeout(() => {
        if (!mountedRef.current) return;
        onComplete();
      }, 1000);
    };

    processSteps();

    return () => {
      console.log('[Onboarding] Cleanup running, setting mountedRef to false');
      mountedRef.current = false;
    };
  }, [data, onComplete]);

  const isCompleted = completedSteps.length === setupStepKeys.length;
  const currentStepInfo = setupStepKeys[currentStep];

  return (
    <div className="max-w-2xl mx-auto text-center">
      <div className="space-y-8">
        {/* Animated Icon */}
        <div className="relative">
          <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center transition-all duration-1000 ${
            error
              ? 'bg-warning/10 text-warning'
              : isCompleted 
              ? 'bg-success/10 text-success' 
              : 'bg-primary/10 text-primary'
          }`}>
            {error ? (
              <AlertCircle className="h-12 w-12" />
            ) : isCompleted ? (
              <CheckCircle className="h-12 w-12 animate-bounce-once" />
            ) : (
              <Loader2 className="h-12 w-12 animate-spin" />
            )}
          </div>
          
          {!isCompleted && !error && (
            <div className="absolute inset-0 rounded-full border-4 border-primary/30 animate-ping" />
          )}
        </div>

        {/* Status Message */}
        <div className="space-y-2">
          <h3 className="text-2xl font-bold text-foreground">
            {error 
              ? t('onboarding.steps.setup.error', 'Setup Encountered an Issue')
              : isCompleted 
              ? t('onboarding.steps.setup.complete') 
              : currentStepInfo ? t(currentStepInfo.labelKey) : t('onboarding.steps.setup.loading')
            }
          </h3>
          <p className="text-muted-foreground">
            {error
              ? t('onboarding.steps.setup.errorDescription', 'Continuing with setup... Please wait.')
              : isCompleted 
              ? t('onboarding.steps.setup.welcome', 'Welcome to Flowentra!')
              : t('onboarding.steps.setup.description')
            }
          </p>
        </div>

        {/* Setup Steps List */}
        {!isCompleted && (
          <div className="space-y-3 max-w-md mx-auto">
            {setupStepKeys.map((step, index) => {
              const isStepCompleted = completedSteps.includes(step.id);
              const isStepActive = index === currentStep;
              
              return (
                <div 
                  key={step.id}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-300 ${
                    isStepCompleted 
                      ? 'bg-success/10 text-success' 
                      : isStepActive
                      ? 'bg-primary/10 text-primary'
                      : 'bg-muted/50 text-muted-foreground'
                  }`}
                >
                  <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                    isStepCompleted 
                      ? 'bg-success text-white' 
                      : isStepActive
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted-foreground/20'
                  }`}>
                    {isStepCompleted ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : isStepActive ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <span className="text-xs">{index + 1}</span>
                    )}
                  </div>
                  <span className="text-sm font-medium">{t(step.labelKey)}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Progress Bar */}
        <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${(completedSteps.length / setupStepKeys.length) * 100}%` }}
          />
        </div>

        <p className="text-sm text-muted-foreground">
          {t('onboarding.step', { current: completedSteps.length, total: setupStepKeys.length })}
        </p>

        {error && (
          <p className="text-sm text-warning bg-warning/10 p-3 rounded-lg">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
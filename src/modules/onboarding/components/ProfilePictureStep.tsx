import { useState } from "react";
import { Button } from "@/components/ui/button";
import { OnboardingData } from "../pages/Onboarding";
import { ArrowLeft, ArrowRight, Loader2, Camera, SkipForward } from "lucide-react";
import { useTranslation } from 'react-i18next';
import { ProfilePictureUpload } from "@/components/ui/profile-picture-upload";
import { getOAuthUserInfo } from "@/modules/auth/components/OAuthLogin";

interface ProfilePictureStepProps {
  data: OnboardingData;
  onNext: (data: Partial<OnboardingData>) => void;
  onBack: () => void;
  isFirst: boolean;
}

export function ProfilePictureStep({ data, onNext, onBack }: ProfilePictureStepProps) {
  const { t } = useTranslation();
  const oauthInfo = getOAuthUserInfo();
  // Pre-fill with OAuth profile picture if available (user can change it)
  const [profilePicUrl, setProfilePicUrl] = useState<string>(oauthInfo?.profilePictureUrl || '');
  const [hasUserUploaded, setHasUserUploaded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNext = async () => {
    if (!profilePicUrl) {
      // Skip - no picture uploaded and no OAuth fallback
      onNext({});
      return;
    }

    setIsSubmitting(true);
    try {
      // Only call the profile picture API if user uploaded a new one
      // or if we have an OAuth picture to set as default
      const { profilePictureApi } = await import('@/services/api/profilePictureApi');
      const result = await profilePictureApi.updateAdminProfilePicture(profilePicUrl);
      console.log('[Onboarding][ProfilePicture] Profile picture saved via dedicated API', 
        hasUserUploaded ? '(user uploaded)' : '(OAuth fallback)');
      
      // CRITICAL: Update localStorage user_data so AuthContext picks up the new URL
      // Without this, the header avatar won't show the picture after onboarding
      try {
        const userData = localStorage.getItem('user_data');
        if (userData) {
          const parsed = JSON.parse(userData);
          // Use the URL returned by the API if available, otherwise use what we sent
          const savedUrl = result?.user?.profilePictureUrl || profilePicUrl;
          parsed.profilePictureUrl = savedUrl;
          localStorage.setItem('user_data', JSON.stringify(parsed));
          console.log('[Onboarding][ProfilePicture] Updated localStorage user_data with profilePictureUrl');
        }
      } catch (storageErr) {
        console.warn('[Onboarding][ProfilePicture] Failed to update localStorage:', storageErr);
      }
    } catch (error) {
      console.error('[Onboarding][ProfilePicture] Failed to save profile picture:', error);
    } finally {
      setIsSubmitting(false);
      onNext({});
    }
  };

  const handleSkip = () => {
    // If there's an OAuth picture, save it as fallback even when skipping
    if (oauthInfo?.profilePictureUrl && !hasUserUploaded) {
      (async () => {
        try {
          const { profilePictureApi } = await import('@/services/api/profilePictureApi');
          await profilePictureApi.updateAdminProfilePicture(oauthInfo.profilePictureUrl!);
          // Update localStorage so header shows the OAuth picture
          try {
            const userData = localStorage.getItem('user_data');
            if (userData) {
              const parsed = JSON.parse(userData);
              parsed.profilePictureUrl = oauthInfo.profilePictureUrl;
              localStorage.setItem('user_data', JSON.stringify(parsed));
            }
          } catch { /* ignore */ }
          console.log('[Onboarding][ProfilePicture] OAuth profile picture saved as fallback on skip');
        } catch (error) {
          console.error('[Onboarding][ProfilePicture] Failed to save OAuth fallback:', error);
        }
      })();
    }
    onNext({});
  };

  return (
    <div className="max-w-md mx-auto text-center">
      <div className="space-y-8">
        {/* Large centered profile picture upload */}
        <div className="flex flex-col items-center gap-6">
          <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Camera className="h-10 w-10 text-primary" />
          </div>
          
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-foreground">
              {t('onboarding.steps.profilePicture.title', 'Add your profile picture')}
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              {t('onboarding.steps.profilePicture.description', 'This is how your team will recognize you. You can always change it later in settings.')}
            </p>
          </div>

          <ProfilePictureUpload
            currentUrl={profilePicUrl}
            onUploaded={(url) => { setProfilePicUrl(url); setHasUserUploaded(true); }}
            onRemoved={() => { setProfilePicUrl(''); setHasUserUploaded(false); }}
            size="lg"
            label=""
          />
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center pt-10">
        <Button
          variant="outline"
          onClick={onBack}
          className="h-9 px-6 text-sm border border-border hover:bg-muted/50 transition-colors rounded-lg"
        >
          <ArrowLeft className="h-3.5 w-3.5 mr-2" />
          {t('onboarding.back')}
        </Button>
        <div className="flex gap-2">
          {!profilePicUrl && (
            <Button
              variant="ghost"
              onClick={handleSkip}
              className="h-9 px-6 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-lg"
            >
              {t('onboarding.skip', 'Skip for now')}
              <SkipForward className="h-3.5 w-3.5 ml-2" />
            </Button>
          )}
          {profilePicUrl && (
            <Button
              onClick={handleNext}
              disabled={isSubmitting}
              className="h-9 px-8 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors rounded-lg"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  {t('onboarding.continue', 'Continue')}
                  <ArrowRight className="h-3.5 w-3.5 ml-2" />
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

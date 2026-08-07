import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OnboardingData } from "../pages/Onboarding";
import { User, Phone, Globe, ArrowRight, Loader2, Mail, Lock } from "lucide-react";
import { useTranslation } from "react-i18next";
import { getOAuthUserInfo } from "@/modules/auth/components/OAuthLogin";
import { authService } from "@/services/authService";

interface PersonalInfoStepProps {
  data: OnboardingData;
  onNext: (data: Partial<OnboardingData>) => void;
  isFirst: boolean;
}

const countries = [
  { code: 'TN', name: 'Tunisia' },
  { code: 'US', name: 'United States' },
  { code: 'CA', name: 'Canada' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'FR', name: 'France' },
  { code: 'DE', name: 'Germany' },
  { code: 'AU', name: 'Australia' },
  { code: 'JP', name: 'Japan' },
  { code: 'CN', name: 'China' },
  { code: 'IN', name: 'India' },
  { code: 'BR', name: 'Brazil' },
  { code: 'SA', name: 'Saudi Arabia' },
  { code: 'AE', name: 'United Arab Emirates' },
  { code: 'EG', name: 'Egypt' },
  { code: 'MA', name: 'Morocco' },
  { code: 'DZ', name: 'Algeria' },
  { code: 'LY', name: 'Libya' },
  { code: 'QA', name: 'Qatar' },
  { code: 'KW', name: 'Kuwait' },
  { code: 'OM', name: 'Oman' },
  { code: 'JO', name: 'Jordan' },
  { code: 'LB', name: 'Lebanon' },
  { code: 'IQ', name: 'Iraq' },
  { code: 'ES', name: 'Spain' },
  { code: 'IT', name: 'Italy' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'BE', name: 'Belgium' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'SE', name: 'Sweden' },
  { code: 'NO', name: 'Norway' },
  { code: 'TR', name: 'Turkey' },
  { code: 'KR', name: 'South Korea' },
  { code: 'SG', name: 'Singapore' },
  { code: 'MX', name: 'Mexico' },
  { code: 'AR', name: 'Argentina' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'NG', name: 'Nigeria' },
  { code: 'KE', name: 'Kenya' },
];

export function PersonalInfoStep({ data, onNext, isFirst }: PersonalInfoStepProps) {
  const { t } = useTranslation();
  const oauthInfo = getOAuthUserInfo();
  const currentUser = authService.getCurrentUserFromStorage();
  const isOAuthUser = !!oauthInfo;

  const [formData, setFormData] = useState({
    ...data.personalInfo,
    // Prefill from OAuth if available
    firstName: data.personalInfo.firstName || oauthInfo?.firstName || '',
    lastName: data.personalInfo.lastName || oauthInfo?.lastName || '',
    country: data.personalInfo.country || 'TN',
  });

  // Email display: OAuth email is locked, otherwise show stored user email
  const userEmail = oauthInfo?.email || currentUser?.email || '';
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.firstName?.trim()) {
      newErrors.firstName = t('onboarding.steps.personal.validation.firstNameRequired');
    }
    if (!formData.lastName?.trim()) {
      newErrors.lastName = t('onboarding.steps.personal.validation.lastNameRequired');
    }
    if (!formData.country) {
      newErrors.country = t('onboarding.steps.personal.validation.countryRequired');
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = async () => {
    if (!validateForm()) return;
    setIsSubmitting(true);
    
    try {
      const { authService } = await import('@/services/authService');

      if (authService.isAuthenticated()) {
        try {
          const updatePayload: any = {
            firstName: formData.firstName,
            lastName: formData.lastName,
            phoneNumber: formData.phone || '',
            country: formData.country,
          };
          // Do NOT send OAuth profile picture here — let ProfilePictureStep handle it
          // so the user can choose to upload their own or use the OAuth one
          console.log('[Onboarding][PersonalInfo] Updating authenticated user with payload', updatePayload);
          await authService.updateUser(updatePayload);
        } catch (error) {
          console.error('[Onboarding][PersonalInfo] Error updating profile:', error);
        }
        onNext({ personalInfo: formData });
        return;
      }

      // Handle non-authenticated flow (pending signup)
      const pendingSignup = localStorage.getItem('pending-signup');
      if (pendingSignup) {
        try {
          const signupData = JSON.parse(pendingSignup);
          const signupPayload = {
            email: signupData.email,
            password: signupData.password,
            firstName: formData.firstName,
            lastName: formData.lastName,
            phoneNumber: formData.phone || '',
            country: formData.country,
            industry: '-',
            companyName: '-',
            companyWebsite: '-',
            preferences: '-'
          };
          await authService.signup(signupPayload);
          localStorage.removeItem('pending-signup');
        } catch (error) {
          console.error('[Onboarding][PersonalInfo] Signup error:', error);
        }
      }

      onNext({ personalInfo: formData });
    } catch (error) {
      console.error('[Onboarding][PersonalInfo] Error:', error);
      onNext({ personalInfo: formData });
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="space-y-8">
        {/* Email (read-only for OAuth users, informational for all) */}
        {userEmail && (
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2 text-base font-semibold">
              <Mail className="h-4 w-4 text-primary" />
              {t('onboarding.steps.personal.fields.email', 'Email')}
              {isOAuthUser && (
                <span className="inline-flex items-center gap-1 text-xs font-normal text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-full">
                  <Lock className="h-3 w-3" />
                  {oauthInfo.provider === 'google' ? 'Google' : 'Microsoft'}
                </span>
              )}
            </Label>
            <Input
              id="email"
              type="email"
              value={userEmail}
              readOnly
              disabled={isOAuthUser}
              className={`h-12 text-base ${isOAuthUser ? 'bg-muted/40 text-muted-foreground cursor-not-allowed border-border/40' : 'border-2 hover:border-primary/50 focus:border-primary'}`}
            />
            {isOAuthUser && (
              <p className="text-xs text-muted-foreground">
                {t('onboarding.steps.personal.emailLockedOAuth', 'This email is linked to your {{provider}} account and cannot be changed.').replace('{{provider}}', oauthInfo.provider === 'google' ? 'Google' : 'Microsoft')}
              </p>
            )}
          </div>
        )}

        {/* Form Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* First Name */}
          <div className="space-y-2">
            <Label htmlFor="firstName" className="text-base font-semibold">
              {t('onboarding.steps.personal.fields.firstName')} *
            </Label>
            <Input
              id="firstName"
              placeholder={t('onboarding.steps.personal.fields.firstNamePlaceholder')}
              value={formData.firstName}
              onChange={(e) => updateField('firstName', e.target.value)}
              className={`h-12 text-base transition-smooth ${errors.firstName ? 'border-destructive' : 'border-2 hover:border-primary/50 focus:border-primary'}`}
            />
            {errors.firstName && (
              <p className="text-destructive text-sm mt-1">{errors.firstName}</p>
            )}
          </div>

          {/* Last Name */}
          <div className="space-y-2">
            <Label htmlFor="lastName" className="text-base font-semibold">
              {t('onboarding.steps.personal.fields.lastName')} *
            </Label>
            <Input
              id="lastName"
              placeholder={t('onboarding.steps.personal.fields.lastNamePlaceholder')}
              value={formData.lastName}
              onChange={(e) => updateField('lastName', e.target.value)}
              className={`h-12 text-base transition-smooth ${errors.lastName ? 'border-destructive' : 'border-2 hover:border-primary/50 focus:border-primary'}`}
            />
            {errors.lastName && (
              <p className="text-destructive text-sm mt-1">{errors.lastName}</p>
            )}
          </div>
        </div>

        {/* Phone Number */}
        <div className="space-y-2">
          <Label htmlFor="phone" className="flex items-center gap-2 text-base font-semibold">
            <Phone className="h-4 w-4 text-primary" />
            {t('onboarding.steps.personal.fields.phone')}
          </Label>
          <Input
            id="phone"
            type="tel"
            placeholder={t('onboarding.steps.personal.fields.phonePlaceholder')}
            value={formData.phone || ''}
            onChange={(e) => updateField('phone', e.target.value)}
            className="h-12 text-base border-2 hover:border-primary/50 focus:border-primary transition-smooth"
          />
        </div>

        {/* Country */}
        <div className="space-y-2">
          <Label htmlFor="country" className="flex items-center gap-2 text-base font-semibold">
            <Globe className="h-4 w-4 text-primary" />
            {t('onboarding.steps.personal.fields.country')} *
          </Label>
          <Select value={formData.country} onValueChange={(value) => updateField('country', value)}>
            <SelectTrigger className={`h-12 text-base transition-smooth ${errors.country ? 'border-destructive' : 'border-2 hover:border-primary/50 focus:border-primary'}`}>
              <SelectValue placeholder={t('onboarding.steps.personal.fields.countryPlaceholder')} />
            </SelectTrigger>
            <SelectContent>
              {countries.map((country) => (
                <SelectItem key={country.code} value={country.code} className="text-base py-3">
                  {t(`onboarding.countries.${country.code}`, country.name)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.country && (
            <p className="text-destructive text-sm mt-1">{errors.country}</p>
          )}
        </div>
      </div>

      {/* Next Button */}
      <div className="flex justify-end pt-8">
        <Button 
          onClick={handleNext}
          disabled={isSubmitting}
          className="h-9 px-8 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors rounded-lg"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              {t('onboarding.steps.personal.button')}
              <ArrowRight className="h-3.5 w-3.5 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

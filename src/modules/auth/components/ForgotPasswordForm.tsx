import { useState } from 'react';
import { useCompanyLogo } from '@/hooks/useCompanyLogo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from '@/hooks/use-toast';
import { authService } from '@/services/authService';

// Email validation regex (RFC 5322 simplified)
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const validateEmail = (email: string): boolean => {
  return EMAIL_REGEX.test(email);
};

interface ForgotPasswordFormProps {
  onBack: () => void;
}

type Step = 'email' | 'otp' | 'reset';

export function ForgotPasswordForm({ onBack }: ForgotPasswordFormProps) {
  const { t } = useTranslation('auth');
  const companyLogo = useCompanyLogo();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(null);

  const handleEmailSubmit = async () => {
    if (!email) {
      toast({
        title: t('error'),
        description: t('forgot_password.email_required'),
        variant: 'destructive',
      });
      return;
    }

    if (!validateEmail(email)) {
      toast({
        title: t('error'),
        description: t('forgot_password.invalid_email'),
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    console.log('[FORGOT_PASSWORD] Validating email:', email);
    
    try {
      // Step 1: Check if email exists
      const emailCheckResult = await authService.checkEmailExists(email);
      console.log('[FORGOT_PASSWORD] Email check result:', emailCheckResult);
      
      if (!emailCheckResult.exists) {
        console.warn('[FORGOT_PASSWORD] Email not found in system:', email);
        toast({
          title: t('error'),
          description: t('forgot_password.not_found'),
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }

      // Step 2: Send OTP
      console.log('[FORGOT_PASSWORD] Email verified, submitting OTP request:', email);
      const result = await authService.forgotPassword({ email });
      console.log('[FORGOT_PASSWORD] Response:', result);
      
      if (result.success) {
        toast({
          title: t('success'),
          description: t('forgot_password.otp_sent'),
        });
        setStep('otp');
      } else {
        console.error('[FORGOT_PASSWORD] API returned error:', result.message);
        toast({
          title: t('error'),
          description: result.message || t('forgot_password.send_otp_failed'),
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('[FORGOT_PASSWORD] Error:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      toast({
        title: t('error'),
        description: `Error: ${errorMsg}. Please check your connection and try again.`,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async () => {
    if (otp.length !== 6) {
      toast({
        title: t('error'),
        description: `Please enter all 6 digits (currently ${otp.length}/6)`,
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    console.log('[VERIFY_OTP] Submitting OTP for email:', email);
    
    try {
      const result = await authService.verifyOtp({ email, otpCode: otp });
      console.log('[VERIFY_OTP] Response:', { success: result.success, message: result.message });
      
      if (result.success && result.resetToken) {
        toast({
          title: t('success'),
          description: 'OTP verified successfully. You can now set your new password.',
        });
        setResetToken(result.resetToken);
        setStep('reset');
      } else {
        console.error('[VERIFY_OTP] Verification failed:', result.message);
        toast({
          title: t('error'),
          description: result.message || 'OTP verification failed. Please check the code and try again.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('[VERIFY_OTP] Network error:', error);
      toast({
        title: t('error'),
        description: t('forgot_password.network_error'),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!newPassword || !confirmPassword) {
      toast({
        title: t('error'),
        description: t('forgot_password.password_required'),
        variant: 'destructive',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: t('error'),
        description: t('forgot_password.password_mismatch'),
        variant: 'destructive',
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: t('error'),
        description: t('forgot_password.password_too_short'),
        variant: 'destructive',
      });
      return;
    }

    if (!resetToken) {
      toast({
        title: t('error'),
        description: t('forgot_password.invalid_reset_token'),
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    console.log('[RESET_PASSWORD] Submitting password reset with token');
    
    try {
      const result = await authService.resetPassword({
        resetToken,
        newPassword,
        confirmPassword,
      });
      console.log('[RESET_PASSWORD] Response:', { success: result.success, message: result.message });

      if (result.success) {
        toast({
          title: t('success'),
          description: t('forgot_password.reset_success'),
        });
        
        // Go back to login
        setTimeout(() => onBack(), 1500);
      } else {
        console.error('[RESET_PASSWORD] Reset failed:', result.message);
        toast({
          title: t('error'),
          description: result.message || t('forgot_password.reset_failed'),
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('[RESET_PASSWORD] Network error:', error);
      toast({
        title: t('error'),
        description: t('forgot_password.network_error'),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto">
      {/* Logo */}
      <div className="text-center mb-6">
        {companyLogo && (
          <div className="mb-4">
            <img 
              src={companyLogo} 
              alt="Company Logo" 
              className="h-18 mx-auto"
            />
          </div>
        )}
      </div>

      <Card className="border-0 shadow-2xl bg-card/95 backdrop-blur-xl">
        <CardHeader className="space-y-4 pb-4 px-6 sm:px-8 pt-6">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="p-1 h-8 w-8"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <CardTitle className="text-xl font-semibold">
              {t('forgot_password.title')}
            </CardTitle>
          </div>

          {step === 'email' && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {t('forgot_password.email_description')}
              </p>
              <div className="space-y-1.5">
                <label htmlFor="reset-email" className="text-sm font-semibold text-foreground/90">
                  {t('email')}
                </label>
                <Input
                  id="reset-email"
                  type="email"
                  placeholder={t('email_placeholder')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-10 bg-background border-2 border-border focus:border-primary focus:ring-2 focus:ring-primary/30 rounded-lg text-sm text-foreground placeholder:text-muted-foreground/50 transition-all duration-200 dark:bg-slate-900 dark:text-white dark:border-slate-700 dark:focus:border-primary dark:focus:ring-primary/20"
                />
              </div>
            </div>
          )}

          {step === 'otp' && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {t('forgot_password.otp_description', { email })}
              </p>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-foreground/90">
                  {t('forgot_password.verification_code')}
                </label>
                <div className="flex justify-center">
                  <InputOTP 
                    value={otp} 
                    onChange={(value) => setOtp(value)}
                    maxLength={6}
                  >
                    <InputOTPGroup className="border-2 border-border rounded-lg p-4 bg-background dark:bg-slate-900 shadow-sm">
                      <InputOTPSlot index={0} className="h-12 w-12 text-lg font-semibold border-2 border-border rounded-lg dark:bg-slate-800 dark:border-slate-700 dark:text-white" />
                      <InputOTPSlot index={1} className="h-12 w-12 text-lg font-semibold border-2 border-border rounded-lg dark:bg-slate-800 dark:border-slate-700 dark:text-white" />
                      <InputOTPSlot index={2} className="h-12 w-12 text-lg font-semibold border-2 border-border rounded-lg dark:bg-slate-800 dark:border-slate-700 dark:text-white" />
                      <InputOTPSlot index={3} className="h-12 w-12 text-lg font-semibold border-2 border-border rounded-lg dark:bg-slate-800 dark:border-slate-700 dark:text-white" />
                      <InputOTPSlot index={4} className="h-12 w-12 text-lg font-semibold border-2 border-border rounded-lg dark:bg-slate-800 dark:border-slate-700 dark:text-white" />
                      <InputOTPSlot index={5} className="h-12 w-12 text-lg font-semibold border-2 border-border rounded-lg dark:bg-slate-800 dark:border-slate-700 dark:text-white" />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
              </div>
            </div>
          )}

          {step === 'reset' && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {t('forgot_password.reset_description')}
              </p>
              <div className="space-y-1.5">
                <label htmlFor="new-password" className="text-sm font-semibold text-foreground/90">
                  {t('forgot_password.new_password')}
                </label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showNewPassword ? "text" : "password"}
                    placeholder={t('forgot_password.new_password_placeholder')}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    autoComplete="new-password"
                    className="h-10 bg-background border-2 border-border focus:border-primary focus:ring-2 focus:ring-primary/30 rounded-lg text-sm text-foreground placeholder:text-muted-foreground/50 pr-10 transition-all duration-200 dark:bg-slate-900 dark:text-white dark:border-slate-700 dark:focus:border-primary dark:focus:ring-primary/20 [&::-ms-reveal]:hidden [&::-ms-clear]:hidden [&::-webkit-contacts-auto-fill-button]:hidden [&::-webkit-credentials-auto-fill-button]:hidden"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-0.5 rounded-md hover:bg-muted/50"
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-3.5 w-3.5" />
                    ) : (
                      <Eye className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </div>
              
              <div className="space-y-1.5">
                <label htmlFor="confirm-password" className="text-sm font-semibold text-foreground/90">
                  {t('forgot_password.confirm_password')}
                </label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder={t('forgot_password.confirm_password_placeholder')}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    className="h-10 bg-background border-2 border-border focus:border-primary focus:ring-2 focus:ring-primary/30 rounded-lg text-sm text-foreground placeholder:text-muted-foreground/50 pr-10 transition-all duration-200 dark:bg-slate-900 dark:text-white dark:border-slate-700 dark:focus:border-primary dark:focus:ring-primary/20 [&::-ms-reveal]:hidden [&::-ms-clear]:hidden [&::-webkit-contacts-auto-fill-button]:hidden [&::-webkit-credentials-auto-fill-button]:hidden"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-0.5 rounded-md hover:bg-muted/50"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-3.5 w-3.5" />
                    ) : (
                      <Eye className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </CardHeader>
        
        <CardContent className="space-y-4 px-6 sm:px-8 pb-6">
          <Button
            onClick={() => {
              if (step === 'email') handleEmailSubmit();
              else if (step === 'otp') handleOtpSubmit();
              else handlePasswordReset();
            }}
            className="w-full h-10 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground font-semibold text-sm rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                <span>
                  {step === 'email' && t('forgot_password.sending')}
                  {step === 'otp' && t('forgot_password.verifying')}
                  {step === 'reset' && t('forgot_password.resetting')}
                </span>
              </div>
            ) : (
              <span>
                {step === 'email' && t('forgot_password.send_code')}
                {step === 'otp' && t('forgot_password.verify_code')}
                {step === 'reset' && t('forgot_password.reset_password')}
              </span>
            )}
          </Button>

          {step === 'otp' && (
            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                {t('forgot_password.didnt_receive_code')}
                <button
                  onClick={handleEmailSubmit}
                  className="ml-1.5 text-primary hover:text-primary/80 font-semibold transition-colors"
                  disabled={isLoading}
                >
                  {t('forgot_password.resend')}
                </button>
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
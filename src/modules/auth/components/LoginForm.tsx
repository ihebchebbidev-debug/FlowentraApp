import { LogIn, Eye, EyeOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useTranslation } from 'react-i18next';
import { toast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { useCompanyLogoWithDefault, setCompanyLogo } from '@/hooks/useCompanyLogo';
import { ForgotPasswordForm } from './ForgotPasswordForm';
import { OAuthLogin } from './OAuthLogin';
import { authService } from '@/services/authService';
import { useAdminPreferences } from '@/hooks/useAdminPreferences';
import { HumanCheck } from './HumanCheck';

interface LoginFormProps {
  onSignIn: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  onSignUp: (email: string, password: string, userData?: any) => Promise<void>;
  isLoading?: boolean;
}

export function LoginForm({ onSignIn, onSignUp, isLoading = false }: LoginFormProps) {
  const { t } = useTranslation();
  const { logo: companyLogo, isDefault: isDefaultLogo } = useCompanyLogoWithDefault();
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [oauthPrefilled, setOauthPrefilled] = useState(false); // Track if email was set via OAuth and signup completed
  const [oauthEmailTemp, setOauthEmailTemp] = useState(''); // Temporary OAuth email (not locked)
  const [humanVerified, setHumanVerified] = useState(false);
  
  // Admin exists state - determines if signup is allowed
  const [adminExists, setAdminExists] = useState<boolean | null>(null);
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(true);
  const [adminPreferences, setAdminPreferences] = useState<{
    theme?: string;
    language?: string;
    primaryColor?: string;
  } | null>(null);

  // Apply admin preferences to login page (theme, language, colors)
  useAdminPreferences(adminPreferences);

  // Check if admin exists on mount
  useEffect(() => {
    const checkAdminStatus = async () => {
      setIsCheckingAdmin(true);
      try {
        const result = await authService.checkAdminExists();
        setAdminExists(result.adminExists);
        
        // If admin exists, apply their preferences to the login page
        if (result.adminExists && result.adminPreferences) {
          setAdminPreferences(result.adminPreferences);
        }
        // Sync company logo from admin-exists response (before login)
        if (result.companyLogoUrl) {
          setCompanyLogo(result.companyLogoUrl);
        }
        
        // If no admin exists, default to signup mode
        if (!result.adminExists) {
          setIsSignUp(true);
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        // Default to allowing signup on error
        setAdminExists(false);
        setIsSignUp(true);
      } finally {
        setIsCheckingAdmin(false);
      }
    };

    checkAdminStatus();
  }, []);

  const handleSubmit = async () => {
    if (!humanVerified) {
      toast({
        title: t('auth.error'),
        description: t('auth.captcha.please_verify'),
        variant: 'destructive',
      });
      return;
    }
    if (isSignUp) {
      // Use either locked OAuth email or the current email field
      const finalEmail = oauthPrefilled ? email : (oauthEmailTemp || email);
      
      if (!finalEmail || !password || !confirmPassword) {
        toast({
          title: t('auth.error'),
          description: t('auth.please_fill_all_fields'),
          variant: 'destructive',
        });
        return;
      }
      if (password !== confirmPassword) {
        toast({
          title: t('auth.error'),
          description: t('auth.passwords_dont_match_signup'),
          variant: 'destructive',
        });
        return;
      }
      if (password.length < 6) {
        toast({
          title: t('auth.error'),
          description: t('auth.password_too_short_signup'),
          variant: 'destructive',
        });
        return;
      }
      
      // Call the onSignUp function to trigger the signup flow
      const userData = {
        firstName: 'User', 
        lastName: 'Name',
        country: 'US',
        industry: 'technology'
      };
      
      try {
        await onSignUp(finalEmail, password, userData);
        // Email is confirmed after signup is successful - no need to lock it
        // as the component will be unmounted during navigation
      } catch (error) {
        // onSignUp handles its own error messages via toast
        // Don't lock email on signup failure - allow retry with different email
      }
    } else {
      if (!email || !password) {
        toast({
          title: t('auth.error'),
          description: t('auth.please_fill_all_fields'),
          variant: 'destructive',
        });
        return;
      }
      
      await onSignIn(email, password, rememberMe);
    }
  };


  if (showForgotPassword) {
    return (
      <ForgotPasswordForm 
        onBack={() => setShowForgotPassword(false)} 
      />
    );
  }

  // Show loading state while checking admin status
  if (isCheckingAdmin) {
    return (
      <div className="w-full max-w-lg mx-auto">
        <div className="text-center mb-6">
          {companyLogo && (
            <div className="mb-4">
              <img 
                src={companyLogo} 
                alt="Company Logo" 
                className={`h-16 mx-auto ${isDefaultLogo ? 'dark:brightness-0 dark:invert' : ''}`}
              />
            </div>
          )}
        </div>
        <Card className="border-0 shadow-2xl bg-card/95 backdrop-blur-xl">
          <CardContent className="py-8 space-y-4 animate-pulse">
            <div className="h-10 w-full bg-muted rounded" />
            <div className="h-10 w-full bg-muted/60 rounded" />
            <div className="h-10 w-full bg-muted/60 rounded" />
            <div className="h-10 w-3/4 mx-auto bg-muted rounded" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg mx-auto">
      {/* Logo */}
      <div className="text-center mb-6">
        {companyLogo && (
          <div className="mb-4">
            <img 
              src={companyLogo} 
              alt="Company Logo" 
              className={`h-24 mx-auto ${isDefaultLogo ? 'dark:brightness-0 dark:invert' : ''}`}
            />
          </div>
        )}
      </div>

      {/* Auth Form */}
      <Card className="border-0 shadow-2xl bg-card/95 backdrop-blur-xl">
        <CardHeader className="space-y-4 pb-4 px-6 sm:px-8 pt-6">
          
          <div className="space-y-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="email" className="text-sm font-semibold text-foreground/90">
                  {t('auth.email')}
                </label>
                {oauthPrefilled && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                    🔒 {t('auth.oauth_email_locked')}
                    <button
                      type="button"
                      onClick={() => { setOauthPrefilled(false); setEmail(''); setOauthEmailTemp(''); }}
                      className="ml-0.5 text-muted-foreground hover:text-destructive transition-colors"
                      title={t('auth.oauth_clear_email', 'Clear')}
                    >
                      ✕
                    </button>
                  </span>
                )}
                {!oauthPrefilled && oauthEmailTemp && isSignUp && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded-full">
                    ℹ️ {t('auth.oauth_email_from_google', 'From Google')}
                  </span>
                )}
              </div>
              <Input
                id="email"
                type="email"
                placeholder={t('auth.email_placeholder')}
                value={oauthPrefilled ? email : (oauthEmailTemp || email)}
                onChange={(e) => { 
                  if (!oauthPrefilled) {
                    setEmail(e.target.value);
                    // If user changes the email from OAuth-prefilled, clear the temp marker
                    if (oauthEmailTemp && e.target.value !== oauthEmailTemp) {
                      setOauthEmailTemp('');
                    }
                  }
                }}
                readOnly={oauthPrefilled}
                className={`h-10 bg-background/80 border-border/60 focus:border-primary/60 focus:ring-2 focus:ring-primary/20 rounded-lg text-sm transition-all duration-200 ${oauthPrefilled ? 'opacity-70 cursor-not-allowed' : ''}`}
              />
            </div>
            
            <div className="space-y-1.5">
              <label htmlFor="password" className="text-sm font-semibold text-foreground/90">
                {t('auth.password')}  
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder={t('auth.password_placeholder')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className="h-10 bg-background/80 border-border/60 focus:border-primary/60 focus:ring-2 focus:ring-primary/20 rounded-lg text-sm pr-10 transition-all duration-200 [&::-ms-reveal]:hidden [&::-ms-clear]:hidden [&::-webkit-contacts-auto-fill-button]:hidden [&::-webkit-credentials-auto-fill-button]:hidden"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-0.5 rounded-md hover:bg-muted/50"
                >
                  {showPassword ? (
                    <EyeOff className="h-3.5 w-3.5" />
                  ) : (
                    <Eye className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            </div>

            {isSignUp && (
              <div className="space-y-1.5 animate-fade-in">
                <label htmlFor="confirmPassword" className="text-sm font-semibold text-foreground/90">
                  {t('auth.confirm_password')}  
                </label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder={t('auth.confirm_password_placeholder')}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    className="h-10 bg-background/80 border-border/60 focus:border-primary/60 focus:ring-2 focus:ring-primary/20 rounded-lg text-sm pr-10 transition-all duration-200 [&::-ms-reveal]:hidden [&::-ms-clear]:hidden [&::-webkit-contacts-auto-fill-button]:hidden [&::-webkit-credentials-auto-fill-button]:hidden"
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
            )}

            {!isSignUp && (
              <>
                <div className="flex justify-between items-center pt-1">
                  <div className="flex items-center space-x-2">
                    <input
                      id="remember"
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-3.5 h-3.5 text-primary border-border/60 rounded focus:ring-2 focus:ring-primary/20 cursor-pointer"
                    />
                    <label htmlFor="remember" className="text-xs text-foreground/80 cursor-pointer">
                      {t('auth.rememberMe')}
                    </label>
                  </div>
                  <a 
                    href="#" 
                    onClick={(e) => {
                      e.preventDefault();
                      setShowForgotPassword(true);
                    }}
                    className="text-xs text-primary hover:text-primary/80 font-medium transition-colors"
                  >
                    {t('auth.forgotPassword')}
                  </a>
                </div>
                
              </>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4 px-6 sm:px-8 pb-6">
          <HumanCheck verified={humanVerified} onVerifiedChange={setHumanVerified} />

          <Button
            onClick={handleSubmit}
            className="w-full h-10 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground font-semibold text-sm rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
            disabled={isLoading || !humanVerified}
          >
            {isLoading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                <span>{isSignUp ? t('auth.creating_account') : t('auth.signing_in')}</span>
              </div>
            ) : (
              <span>{isSignUp ? t('auth.createAccount') : t('auth.signIn')}</span>
            )}
          </Button>

          {/* Toggle Sign Up/Sign In - only show if allowed */}
          {/* If admin exists: show only login (no signup toggle) */}
          {/* If no admin exists: show only signup (no login toggle) */}
        </CardContent>
      </Card>
    </div>
  );
}
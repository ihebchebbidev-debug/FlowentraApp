import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getCurrentTenant } from '@/utils/tenant';


const UserLogin: React.FC = () => {
  const currentTenant = getCurrentTenant();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true); // Default to true
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  

  const { userLogin, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!email || !password) {
      setError(t('auth.please_fill_all_fields'));
      setIsLoading(false);
      return;
    }

    try {
      const result = await userLogin(email, password, rememberMe);
      
      if (result.success) {
        // useEffect will handle navigation
      } else {
        setError(result.message || t('auth.invalid_email_or_password'));
      }
    } catch (error) {
      console.error('Login error:', error);
      setError(t('auth.login_error'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-strong border-border/40">
        <CardHeader className="text-center pb-2">
            <CardTitle className="text-xl font-semibold">{t('auth.welcome')}</CardTitle>
            <CardDescription className="text-[13px]">
              {t('auth.signIn')}
            </CardDescription>
          </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">{t('auth.email')}</Label>
              <Input
                id="email"
                type="email"
                placeholder={t('auth.email_placeholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{t('auth.password')}</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder={t('auth.password_placeholder')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                id="rememberMe"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 text-primary border-border rounded focus:ring-2 focus:ring-primary/20 cursor-pointer"
              />
              <label htmlFor="rememberMe" className="text-sm text-muted-foreground cursor-pointer">
                {t('auth.rememberMe')}
              </label>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('auth.signing_in')}
                </>
              ) : (
                t('auth.signIn')
              )}
            </Button>
          </form>


          <div className="mt-4 text-center">
            <p className="text-sm text-muted-foreground">
              {t('auth.admin_prompt')}{' '}
              <Link to="/login" className="text-primary hover:underline">
                {t('auth.sign_in_here')}
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>

    </div>
  );
};

export default UserLogin;
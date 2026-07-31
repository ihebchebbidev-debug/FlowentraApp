import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

/**
 * QA fast-entry route: /qa-login
 * Signs in with the shared QA account so an automated agent can reach the
 * app in one URL, without filling the login form.
 */
export const QA_EMAIL = 'testadmin@gmail.com';
export const QA_PASSWORD = 'Azerty1234';

const QaLogin: React.FC = () => {
  const { login, userLogin } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    (async () => {
      try {
        let result = await login(QA_EMAIL, QA_PASSWORD, true);
        if (!result.success && !result.requires2FA) {
          result = await userLogin(QA_EMAIL, QA_PASSWORD, true);
        }

        if (result.requires2FA && result.challenge) {
          navigate('/two-factor', { state: result.challenge, replace: true });
          return;
        }

        if (result.success) {
          navigate('/dashboard', { replace: true });
        } else {
          setError(result.message || 'QA sign-in failed');
        }
      } catch (e: any) {
        setError(e?.message || 'QA sign-in failed');
      }
    })();
  }, [login, userLogin, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="text-center space-y-3">
        {error ? (
          <>
            <p className="text-destructive font-medium">{error}</p>
            <button
              className="text-sm text-primary underline"
              onClick={() => navigate('/login', { replace: true })}
            >
              Go to login
            </button>
          </>
        ) : (
          <>
            <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
            <p className="text-sm text-muted-foreground">Signing in as QA…</p>
          </>
        )}
      </div>
    </div>
  );
};

export default QaLogin;

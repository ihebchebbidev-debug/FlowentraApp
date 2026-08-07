import { useState, useEffect, useRef, useCallback } from 'react';
import { usersApi } from '@/services/api/usersApi';

interface EmailValidationResult {
  isChecking: boolean;
  emailError: string | null;
  validateEmail: (email: string) => void;
  clearError: () => void;
}

export function useEmailValidation(excludeUserId?: number): EmailValidationResult {
  const [isChecking, setIsChecking] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestSeqRef = useRef(0);
  const lastCheckedEmail = useRef<string>('');

  const clearError = useCallback(() => {
    setEmailError(null);
    lastCheckedEmail.current = '';
  }, []);

  const validateEmail = useCallback((email: string) => {
    const trimmedEmail = email.trim().toLowerCase();

    // Clear previous timeout
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }

    // Clear error if email is empty or too short
    if (!trimmedEmail || trimmedEmail.length < 3) {
      setEmailError(null);
      setIsChecking(false);
      return;
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setEmailError(null);
      setIsChecking(false);
      return;
    }

    // Skip if same as last checked
    if (lastCheckedEmail.current === trimmedEmail) {
      return;
    }

    // Debounce the API call — only show the spinner once the request actually fires,
    // not on every keystroke, so the submit button is never blocked mid-typing.
    const seq = ++requestSeqRef.current;
    debounceRef.current = setTimeout(async () => {
      setIsChecking(true);
      try {
        // Ensure excludeUserId is passed as a number
        const excludeId = excludeUserId ? Number(excludeUserId) : undefined;
        const result = await usersApi.checkEmailExists(trimmedEmail, excludeId) as { exists: boolean; source?: string; userId?: number };
        // Ignore stale responses (excludeUserId changed or newer request in flight)
        if (seq !== requestSeqRef.current) return;
        lastCheckedEmail.current = trimmedEmail;

        if (result.exists) {
          // Double-check: if the backend returns userId matching excluded user, ignore
          if (excludeId && result.userId != null && Number(result.userId) === excludeId) {
            setEmailError(null);
          } else {
            // Generic message — do not disclose whether the address belongs to
            // the main administrator vs a regular user (account enumeration).
            setEmailError('This email is already in use');
          }
        } else {
          setEmailError(null);
        }
      } catch (error) {
        if (seq !== requestSeqRef.current) return;
        console.warn('Failed to validate email:', error);
        setEmailError(null);
      } finally {
        if (seq === requestSeqRef.current) setIsChecking(false);
      }
    }, 500);
  }, [excludeUserId]);

  // Clear cached state AND any pending debounced request when excludeUserId changes
  // (switching between users). Bumping requestSeqRef invalidates any in-flight response.
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    requestSeqRef.current++;
    lastCheckedEmail.current = '';
    setEmailError(null);
    setIsChecking(false);
  }, [excludeUserId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return {
    isChecking,
    emailError,
    validateEmail,
    clearError,
  };
}
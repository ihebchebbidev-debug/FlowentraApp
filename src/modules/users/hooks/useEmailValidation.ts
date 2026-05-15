import { useState, useEffect, useRef, useCallback } from 'react';
import { usersApi } from '@/services/usersApi';

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

    setIsChecking(true);

    // Debounce the API call
    debounceRef.current = setTimeout(async () => {
      try {
        // Ensure excludeUserId is passed as a number
        const excludeId = excludeUserId ? Number(excludeUserId) : undefined;
        const result = await usersApi.checkEmailExists(trimmedEmail, excludeId) as { exists: boolean; source?: string; userId?: number };
        lastCheckedEmail.current = trimmedEmail;
        
        if (result.exists) {
          // Double-check: if the backend returns userId matching excluded user, ignore
          if (excludeId && result.userId != null && Number(result.userId) === excludeId) {
            setEmailError(null);
          } else if (result.source === 'admin') {
            setEmailError('This email is already in use by the main administrator');
          } else {
            setEmailError('This email is already in use by another user');
          }
        } else {
          setEmailError(null);
        }
      } catch (error) {
        console.warn('Failed to validate email:', error);
        setEmailError(null);
      } finally {
        setIsChecking(false);
      }
    }, 500);
  }, [excludeUserId]);

  // Clear cached state when excludeUserId changes (switching between users)
  useEffect(() => {
    lastCheckedEmail.current = '';
    setEmailError(null);
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
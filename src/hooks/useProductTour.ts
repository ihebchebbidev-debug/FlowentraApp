import { useState, useEffect, useCallback } from 'react';
import { useUserType } from './useUserType';

const TOUR_COMPLETED_KEY = 'product-tour-completed';
const TOUR_VERSION = '1'; // Increment to show tour again after major updates

export interface UseProductTourReturn {
  shouldShowTour: boolean;
  startTour: () => void;
  endTour: () => void;
  resetTour: () => void;
  isRunning: boolean;
}

export function useProductTour(): UseProductTourReturn {
  const [isRunning, setIsRunning] = useState(false);
  const { isMainAdminUser } = useUserType();

  // Check if tour was already completed (skipped or finished)
  const isTourCompleted = useCallback(() => {
    const completedVersion = localStorage.getItem(TOUR_COMPLETED_KEY);
    return completedVersion === TOUR_VERSION;
  }, []);

  // Auto-start tour on first login for MainAdminUsers (only if not completed)
  useEffect(() => {
    if (isMainAdminUser && !isTourCompleted()) {
      // Small delay to let the dashboard render first
      const timer = setTimeout(() => {
        setIsRunning(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isMainAdminUser, isTourCompleted]);

  const startTour = useCallback(() => {
    setIsRunning(true);
  }, []);

  const endTour = useCallback(() => {
    setIsRunning(false);
    // Save completion to prevent auto-start on next visit
    localStorage.setItem(TOUR_COMPLETED_KEY, TOUR_VERSION);
  }, []);

  const resetTour = useCallback(() => {
    localStorage.removeItem(TOUR_COMPLETED_KEY);
  }, []);

  return {
    shouldShowTour: isRunning,
    startTour,
    endTour,
    resetTour,
    isRunning,
  };
}

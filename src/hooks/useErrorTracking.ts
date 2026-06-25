import { useEffect, useRef } from 'react';
import { logger } from '@/hooks/useLogger';
import { isViewAllMode } from '@/utils/tenant';
import { getTargetTenantId } from '@/utils/targetTenant';
import { reportIncident, reportConsoleErrorIncident } from '@/services/incident/incidentService';
import { isChunkLoadMessage } from '@/services/incident/incidentFilters';
import type { IncidentType } from '@/services/incident/incidentTypes';

/**
 * Frontend error/warning log posts go to /api/SystemLogs which is a mutation.
 * In view-all mode the backend requires X-Target-Tenant; the passive console
 * tracker has no tenant context, so we suppress the post and rely on the local
 * console output. Once the backend exempts SystemLogs (TenantMiddleware safe
 * list), this guard becomes a harmless safety net.
 */
const shouldSuppressBackendLogging = (): boolean => {
  return isViewAllMode() && getTargetTenantId() === undefined;
};

interface ErrorTrackingOptions {
  enableConsoleCapture?: boolean;
  enableUnhandledRejections?: boolean;
  enableWindowErrors?: boolean;
  enableWarnings?: boolean;
}

// Standalone log functions (no hooks)
const logErrorToBackend = async (
  type: string,
  message: string,
  details?: Record<string, unknown>
) => {
  if (shouldSuppressBackendLogging()) return;
  try {
    await logger.error(
      `[${type}] ${message}`,
      'Frontend',
      'other',
      {
        entityType: 'FrontendError',
        details: JSON.stringify({
          ...details,
          url: window.location.href,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
        }),
      }
    );
  } catch (e) {
    // Silently fail to avoid infinite loops
  }

  const incidentTypeMap: Record<string, IncidentType> = {
    UnhandledRejection: 'unhandled_rejection',
    WindowError: 'window_error',
    ConsoleError: 'console_error',
  };
  const incidentType = incidentTypeMap[type];
  if (incidentType === 'console_error') {
    reportConsoleErrorIncident(
      message,
      typeof details?.stack === 'string' ? details.stack : undefined
    );
  } else if (incidentType) {
    const finalType = isChunkLoadMessage(message) ? 'chunk_load_error' : incidentType;
    void reportIncident({
      incidentType: finalType as IncidentType,
      message,
      stack: typeof details?.stack === 'string' ? details.stack : undefined,
      details: details ? JSON.stringify(details) : undefined,
    });
  }
};

const logWarningToBackend = async (
  type: string,
  message: string,
  details?: Record<string, unknown>
) => {
  if (shouldSuppressBackendLogging()) return;
  try {
    await logger.warning(
      `[${type}] ${message}`,
      'Frontend',
      'other',
      {
        entityType: 'FrontendWarning',
        details: JSON.stringify({
          ...details,
          url: window.location.href,
          timestamp: new Date().toISOString(),
        }),
      }
    );
  } catch (e) {
    // Silently fail
  }
};

export const useErrorTracking = (options: ErrorTrackingOptions = {}) => {
  const {
    enableConsoleCapture = true,
    enableUnhandledRejections = true,
    enableWindowErrors = true,
    enableWarnings = true,
  } = options;

  // Use refs to store original console methods
  const originalConsoleErrorRef = useRef<typeof console.error | null>(null);
  const originalConsoleWarnRef = useRef<typeof console.warn | null>(null);

  useEffect(() => {
    // Handle unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (!enableUnhandledRejections) return;
      
      const error = event.reason;
      const message = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;
      
      logErrorToBackend('UnhandledRejection', message, { stack });
    };

    // Handle window errors
    const handleWindowError = (event: ErrorEvent) => {
      if (!enableWindowErrors) return;
      
      logErrorToBackend('WindowError', event.message, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
      });
    };

    // Store original console methods
    originalConsoleErrorRef.current = console.error;
    originalConsoleWarnRef.current = console.warn;
    
    const handleConsoleError = (...args: unknown[]) => {
      originalConsoleErrorRef.current?.apply(console, args);
      
      if (!enableConsoleCapture) return;
      
      // Don't log our own logging calls to avoid infinite loops
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
      ).join(' ');
      
      if (message.includes('Failed to log error') || message.includes('SystemLogs') || message.includes('Logger:')) {
        return;
      }
      
      // Actionable console errors — smart threshold inside reportConsoleErrorIncident
      if (message.includes('Error') || message.includes('error') || message.includes('failed') || message.includes('Failed') || message.includes('Exception')) {
        logErrorToBackend('ConsoleError', message.slice(0, 500), {
          stack: args.find((a) => a instanceof Error)?.stack,
        });
      }
    };

    const handleConsoleWarn = (...args: unknown[]) => {
      originalConsoleWarnRef.current?.apply(console, args);
      
      if (!enableWarnings) return;
      
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
      ).join(' ');
      
      // Skip internal React warnings and logging-related messages
      if (message.includes('SystemLogs') || message.includes('Failed to log') || message.includes('Logger:')) {
        return;
      }
      
      // Log significant warnings
      if (message.includes('Warning') || message.includes('deprecated') || message.includes('Deprecation')) {
        logWarningToBackend('ConsoleWarning', message.slice(0, 500));
      }
    };

    // Set up listeners
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleWindowError);
    
    if (enableConsoleCapture) {
      console.error = handleConsoleError;
    }
    
    if (enableWarnings) {
      console.warn = handleConsoleWarn;
    }

    // Cleanup
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleWindowError);
      
      if (originalConsoleErrorRef.current) {
        console.error = originalConsoleErrorRef.current;
      }
      
      if (originalConsoleWarnRef.current) {
        console.warn = originalConsoleWarnRef.current;
      }
    };
  }, [enableConsoleCapture, enableUnhandledRejections, enableWindowErrors, enableWarnings]);

  return { logError: logErrorToBackend, logWarning: logWarningToBackend };
};

// Standalone function for logging errors outside of React components
export const trackError = async (
  type: string,
  message: string,
  details?: Record<string, unknown>
) => {
  try {
    await logger.error(
      `[${type}] ${message}`,
      'Frontend',
      'other',
      {
        entityType: 'FrontendError',
        details: JSON.stringify({
          ...details,
          url: typeof window !== 'undefined' ? window.location.href : 'unknown',
          timestamp: new Date().toISOString(),
        }),
      }
    );
  } catch (e) {
    console.error('Failed to track error:', e);
  }

  if (typeof window !== 'undefined') {
    void reportIncident({
      incidentType: type === 'UnhandledRejection' ? 'unhandled_rejection' : 'window_error',
      message,
      stack: typeof details?.stack === 'string' ? details.stack : undefined,
      details: details ? JSON.stringify(details) : undefined,
    });
  }
};

// Standalone function for logging warnings outside of React components
export const trackWarning = async (
  type: string,
  message: string,
  details?: Record<string, unknown>
) => {
  try {
    await logger.warning(
      `[${type}] ${message}`,
      'Frontend',
      'other',
      {
        entityType: 'FrontendWarning',
        details: JSON.stringify({
          ...details,
          url: typeof window !== 'undefined' ? window.location.href : 'unknown',
          timestamp: new Date().toISOString(),
        }),
      }
    );
  } catch (e) {
    // Silently fail
  }
};

// Standalone function for logging success events
export const trackSuccess = async (
  message: string,
  module: string,
  details?: Record<string, unknown>
) => {
  try {
    await logger.success(
      message,
      module,
      'other',
      {
        entityType: 'FrontendSuccess',
        details: details ? JSON.stringify(details) : undefined,
      }
    );
  } catch (e) {
    // Silently fail
  }
};

// Standalone function for logging info events
export const trackInfo = async (
  message: string,
  module: string,
  details?: Record<string, unknown>
) => {
  try {
    await logger.info(
      message,
      module,
      'other',
      {
        entityType: 'FrontendInfo',
        details: details ? JSON.stringify(details) : undefined,
      }
    );
  } catch (e) {
    // Silently fail
  }
};

export default useErrorTracking;

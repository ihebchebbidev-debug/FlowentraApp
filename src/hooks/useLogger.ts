// Easy-to-use logging hook for integrating logs throughout the app
import { useCallback } from 'react';
import { logsApi, CreateLogRequest, LogLevel, LogAction } from '@/services/api/logsApi';

interface LogContext {
  module: string;
  userId?: string;
  userName?: string;
}

interface LogOptions {
  entityType?: string;
  entityId?: string | number;
  details?: string;
  metadata?: Record<string, any>;
}

/**
 * Hook for easy logging throughout the application
 * 
 * Usage:
 * ```tsx
 * const { logInfo, logWarning, logError, logSuccess, logAction } = useLogger('Contacts');
 * 
 * // In your CRUD operations:
 * await contactsApi.create(data);
 * logSuccess('Contact created', 'create', { entityType: 'Contact', entityId: newContact.id });
 * 
 * // On errors:
 * try {
 *   await contactsApi.delete(id);
 * } catch (error) {
 *   logError(`Failed to delete contact: ${error.message}`, 'delete', { entityId: id });
 * }
 * ```
 */
export function useLogger(module: string) {
  // Get current user info from localStorage
  const getUserContext = useCallback((): Partial<LogContext> => {
    try {
      const userData = localStorage.getItem('user_data');
      if (userData) {
        const user = JSON.parse(userData);
        return {
          userId: user.id?.toString() || user.userId,
          userName: user.firstName && user.lastName 
            ? `${user.firstName} ${user.lastName}` 
            : user.email || user.username,
        };
      }
    } catch {
      // Ignore parsing errors
    }
    return {};
  }, []);

  const createLog = useCallback(async (
    level: LogLevel,
    message: string,
    action: LogAction,
    options?: LogOptions
  ) => {
    try {
      const userContext = getUserContext();
      
      const logRequest: CreateLogRequest = {
        level,
        message,
        module,
        action,
        userId: userContext.userId,
        userName: userContext.userName,
        entityType: options?.entityType,
        entityId: options?.entityId?.toString(),
        details: options?.details,
        ipAddress: undefined, // Will be set by backend
        userAgent: navigator.userAgent,
        metadata: options?.metadata,
      };

      // Fire and forget - don't block the main flow
      logsApi.create(logRequest).catch(err => {
        console.warn('Failed to create log entry:', err);
      });
    } catch (err) {
      console.warn('Error creating log:', err);
    }
  }, [module, getUserContext]);

  const logInfo = useCallback((message: string, action: LogAction = 'other', options?: LogOptions) => {
    createLog('info', message, action, options);
  }, [createLog]);

  const logWarning = useCallback((message: string, action: LogAction = 'other', options?: LogOptions) => {
    createLog('warning', message, action, options);
  }, [createLog]);

  const logError = useCallback((message: string, action: LogAction = 'other', options?: LogOptions) => {
    createLog('error', message, action, options);
  }, [createLog]);

  const logSuccess = useCallback((message: string, action: LogAction = 'other', options?: LogOptions) => {
    createLog('success', message, action, options);
  }, [createLog]);

  // Convenience method for CRUD operations
  const logCrud = useCallback((
    operation: 'create' | 'read' | 'update' | 'delete',
    entityType: string,
    entityId?: string | number,
    success: boolean = true,
    errorMessage?: string
  ) => {
    const level: LogLevel = success ? 'success' : 'error';
    const actionMap: Record<string, string> = {
      create: success ? 'created' : 'Failed to create',
      read: success ? 'viewed' : 'Failed to load',
      update: success ? 'updated' : 'Failed to update',
      delete: success ? 'deleted' : 'Failed to delete',
    };
    
    const message = success 
      ? `${entityType} ${actionMap[operation]}${entityId ? ` (ID: ${entityId})` : ''}`
      : `${actionMap[operation]} ${entityType}${entityId ? ` (ID: ${entityId})` : ''}${errorMessage ? `: ${errorMessage}` : ''}`;

    createLog(level, message, operation as LogAction, { entityType, entityId, details: errorMessage });
  }, [createLog]);

  return {
    logInfo,
    logWarning,
    logError,
    logSuccess,
    logCrud,
    createLog,
  };
}

/**
 * Standalone logging functions for use outside of React components
 * Use these in services, utilities, or API interceptors
 */
export const logger = {
  async log(
    level: LogLevel,
    message: string,
    module: string,
    action: LogAction = 'other',
    options?: LogOptions
  ) {
    try {
      let userId: string | undefined;
      let userName: string | undefined;
      
      try {
        const userData = localStorage.getItem('user_data');
        if (userData) {
          const user = JSON.parse(userData);
          userId = user.id?.toString() || user.userId;
          userName = user.firstName && user.lastName 
            ? `${user.firstName} ${user.lastName}` 
            : user.email || user.username;
        }
      } catch {
        // Ignore
      }

      const logRequest: CreateLogRequest = {
        level,
        message,
        module,
        action,
        userId,
        userName,
        entityType: options?.entityType,
        entityId: options?.entityId?.toString(),
        details: options?.details,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
        metadata: options?.metadata,
      };

      await logsApi.create(logRequest);
    } catch (err) {
      console.warn('Logger: Failed to create log entry:', err);
    }
  },

  info: (message: string, module: string, action?: LogAction, options?: LogOptions) =>
    logger.log('info', message, module, action || 'other', options),

  warning: (message: string, module: string, action?: LogAction, options?: LogOptions) =>
    logger.log('warning', message, module, action || 'other', options),

  error: (message: string, module: string, action?: LogAction, options?: LogOptions) =>
    logger.log('error', message, module, action || 'other', options),

  success: (message: string, module: string, action?: LogAction, options?: LogOptions) =>
    logger.log('success', message, module, action || 'other', options),
};

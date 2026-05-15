/**
 * Centralized API error handling with toast notifications.
 * 
 * Wraps API operations to show user-friendly error messages.
 */
import { toast } from 'sonner';

export interface ApiErrorContext {
  operation: string;
  entityType?: 'site' | 'page' | 'image' | 'media';
  entityName?: string;
  silent?: boolean;
}

const ERROR_MESSAGES: Record<string, string> = {
  'Network Error': 'Unable to connect to server. Please check your internet connection.',
  'Request failed with status code 401': 'Session expired. Please log in again.',
  'Request failed with status code 403': 'You don\'t have permission to perform this action.',
  'Request failed with status code 404': 'The requested resource was not found.',
  'Request failed with status code 500': 'Server error. Please try again later.',
  'One or more validation errors occurred': 'Please check the form data and try again.',
  'timeout': 'Request timed out. Please try again.',
};

/**
 * Get user-friendly error message from API error
 */
export function getErrorMessage(error: any, context: ApiErrorContext): string {
  const rawMessage = error?.message || error?.error || 'An unexpected error occurred';
  
  // Check if this is a validation error with field-specific messages
  if (rawMessage.includes(':') && (rawMessage.includes('Theme') || rawMessage.includes('Components') || rawMessage.includes('Json'))) {
    // Already formatted validation error - return with context
    const entityDesc = context.entityName 
      ? `"${context.entityName}"` 
      : context.entityType || 'resource';
    return `Failed to ${context.operation} ${entityDesc}. ${rawMessage}`;
  }
  
  // Check for known error patterns
  for (const [pattern, friendlyMessage] of Object.entries(ERROR_MESSAGES)) {
    if (rawMessage.includes(pattern)) {
      return friendlyMessage;
    }
  }
  
  // Generate context-aware message
  const entityDesc = context.entityName 
    ? `"${context.entityName}"` 
    : context.entityType || 'resource';
  
  return `Failed to ${context.operation} ${entityDesc}: ${rawMessage}`;
}

/**
 * Show error toast with appropriate styling
 */
export function showApiError(error: any, context: ApiErrorContext): void {
  if (context.silent) return;
  
  const message = getErrorMessage(error, context);
  
  // Determine severity based on error type
  const isNetworkError = error?.message?.includes('Network Error') || error?.code === 'ERR_NETWORK';
  const isAuthError = error?.status === 401 || error?.status === 403;
  
  if (isAuthError) {
    toast.error(message, {
      description: 'Please log in to continue.',
      action: {
        label: 'Log In',
        onClick: () => window.location.href = '/login',
      },
    });
  } else if (isNetworkError) {
    toast.error(message, {
      description: 'The server may be temporarily unavailable.',
    });
  } else {
    toast.error(message);
  }
}

/**
 * Show success toast for completed operations
 */
export function showApiSuccess(context: ApiErrorContext): void {
  if (context.silent) return;
  
  const entityDesc = context.entityName 
    ? `"${context.entityName}"` 
    : context.entityType || 'Resource';
  
  const pastTense: Record<string, string> = {
    create: 'created',
    update: 'updated',
    delete: 'deleted',
    publish: 'published',
    unpublish: 'unpublished',
    duplicate: 'duplicated',
    upload: 'uploaded',
    save: 'saved',
  };
  
  const action = pastTense[context.operation] || `${context.operation}ed`;
  toast.success(`${entityDesc} ${action} successfully`);
}

/**
 * Wrap an async operation with error handling and optional success toast
 */
export async function withApiErrorHandling<T>(
  operation: () => Promise<{ data: T | null; error: string | null; success: boolean }>,
  context: ApiErrorContext,
  options?: { showSuccessToast?: boolean }
): Promise<{ data: T | null; error: string | null; success: boolean }> {
  try {
    const result = await operation();
    
    if (!result.success && result.error) {
      showApiError({ message: result.error }, context);
    } else if (result.success && options?.showSuccessToast) {
      showApiSuccess(context);
    }
    
    return result;
  } catch (error: any) {
    showApiError(error, context);
    return { data: null, error: error.message || 'Operation failed', success: false };
  }
}

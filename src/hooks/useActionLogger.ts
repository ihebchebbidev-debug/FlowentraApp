import { useCallback } from 'react';
import { logger } from './useLogger';
import { LogAction } from '@/services/api/logsApi';

interface ActionLogOptions {
  entityType?: string;
  entityId?: string | number;
  details?: string;
}

/**
 * Hook for logging user actions throughout the app
 * Use this for important user interactions like button clicks, form submissions, etc.
 */
export function useActionLogger(module: string) {
  const logAction = useCallback((
    action: string,
    message: string,
    options?: ActionLogOptions
  ) => {
    logger.info(
      message,
      module,
      'other' as LogAction,
      {
        entityType: options?.entityType || 'Action',
        entityId: options?.entityId?.toString(),
        details: options?.details || action,
      }
    );
  }, [module]);

  const logButtonClick = useCallback((
    buttonName: string,
    options?: ActionLogOptions
  ) => {
    logAction('button_click', `Button clicked: ${buttonName}`, {
      ...options,
      details: options?.details || `User clicked "${buttonName}" button`,
    });
  }, [logAction]);

  const logFormSubmit = useCallback((
    formName: string,
    success: boolean,
    options?: ActionLogOptions
  ) => {
    if (success) {
      logger.success(
        `Form submitted: ${formName}`,
        module,
        'create',
        {
          entityType: options?.entityType || 'Form',
          entityId: options?.entityId?.toString(),
          details: options?.details || `Successfully submitted ${formName}`,
        }
      );
    } else {
      logger.warning(
        `Form validation failed: ${formName}`,
        module,
        'other',
        {
          entityType: options?.entityType || 'Form',
          details: options?.details || `Validation failed for ${formName}`,
        }
      );
    }
  }, [module]);

  const logSearch = useCallback((
    searchTerm: string,
    resultsCount: number,
    options?: ActionLogOptions
  ) => {
    logger.info(
      `Search performed: "${searchTerm}" (${resultsCount} results)`,
      module,
      'read',
      {
        entityType: 'Search',
        details: options?.details || `Query: "${searchTerm}", Results: ${resultsCount}`,
      }
    );
  }, [module]);

  const logFilter = useCallback((
    filterName: string,
    filterValue: string,
    options?: ActionLogOptions
  ) => {
    logger.info(
      `Filter applied: ${filterName} = ${filterValue}`,
      module,
      'read',
      {
        entityType: 'Filter',
        details: options?.details || `Applied filter ${filterName} with value "${filterValue}"`,
      }
    );
  }, [module]);

  const logExport = useCallback((
    exportType: string,
    itemCount: number,
    options?: ActionLogOptions
  ) => {
    logger.success(
      `Data exported: ${exportType} (${itemCount} items)`,
      module,
      'read',
      {
        entityType: 'Export',
        details: options?.details || `Exported ${itemCount} items as ${exportType}`,
      }
    );
  }, [module]);

  const logImport = useCallback((
    success: boolean,
    itemCount: number,
    options?: ActionLogOptions
  ) => {
    if (success) {
      logger.success(
        `Data imported: ${itemCount} items`,
        module,
        'create',
        {
          entityType: 'Import',
          details: options?.details || `Successfully imported ${itemCount} items`,
        }
      );
    } else {
      logger.error(
        `Import failed`,
        module,
        'create',
        {
          entityType: 'Import',
          details: options?.details || 'Import operation failed',
        }
      );
    }
  }, [module]);

  const logSettingsChange = useCallback((
    settingName: string,
    newValue: string,
    options?: ActionLogOptions
  ) => {
    logger.info(
      `Setting changed: ${settingName}`,
      module,
      'update',
      {
        entityType: 'Setting',
        entityId: options?.entityId?.toString() || settingName,
        details: options?.details || `Changed ${settingName} to "${newValue}"`,
      }
    );
  }, [module]);

  return {
    logAction,
    logButtonClick,
    logFormSubmit,
    logSearch,
    logFilter,
    logExport,
    logImport,
    logSettingsChange,
  };
}

export default useActionLogger;

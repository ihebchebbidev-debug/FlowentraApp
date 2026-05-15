// Hook to fetch dynamic options for form fields with cascading support
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { FormField, FieldOption, DynamicDataSource } from '../types';
import { dynamicDataService } from '../services/dynamicDataService';

interface DynamicFieldOptionsState {
  options: FieldOption[];
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook to manage dynamic field options for a single field
 */
export function useDynamicFieldOptions(field: FormField) {
  const [state, setState] = useState<DynamicFieldOptionsState>({
    options: field.options || [],
    isLoading: false,
    error: null,
  });

  // Use ref to track if component is mounted
  const isMountedRef = useRef(true);
  
  // Memoize data source to prevent unnecessary re-fetches
  const dataSourceKey = useMemo(() => {
    if (!field.use_dynamic_data || !field.data_source) return null;
    return JSON.stringify(field.data_source);
  }, [field.use_dynamic_data, field.data_source]);

  const fetchDynamicOptions = useCallback(async () => {
    if (!field.use_dynamic_data || !field.data_source) {
      // Use static options
      setState({
        options: field.options || [],
        isLoading: false,
        error: null,
      });
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const dynamicOptions = await dynamicDataService.fetchFieldOptions(field.data_source);
      if (isMountedRef.current) {
        setState({
          options: dynamicOptions,
          isLoading: false,
          error: null,
        });
      }
    } catch (error: any) {
      console.error('Failed to fetch dynamic options:', error);
      if (isMountedRef.current) {
        setState({
          options: field.options || [], // Fallback to static options
          isLoading: false,
          error: error.message || 'Failed to load options',
        });
      }
    }
  }, [dataSourceKey, field.options]);

  useEffect(() => {
    isMountedRef.current = true;
    fetchDynamicOptions();
    
    return () => {
      isMountedRef.current = false;
    };
  }, [fetchDynamicOptions]);

  return {
    ...state,
    refetch: fetchDynamicOptions,
    isDynamic: field.use_dynamic_data || false,
  };
}

/**
 * Hook to manage dynamic options for all fields in a form with cascading support
 */
export function useFormDynamicOptions(fields: FormField[], formValues: Record<string, any> = {}) {
  const [optionsMap, setOptionsMap] = useState<Record<string, FieldOption[]>>({});
  const [loadingFields, setLoadingFields] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pendingParent, setPendingParent] = useState<Record<string, string>>({});
  
  // Track fetch status to prevent duplicate requests
  const fetchedRef = useRef<Set<string>>(new Set());
  const isMountedRef = useRef(true);
  // Track parent values to detect changes
  const parentValuesRef = useRef<Record<string, any>>({});

  // Get fields that need dynamic data - memoized properly
  const dynamicFieldsKey = useMemo(() => {
    return fields
      .filter(f => 
        f.use_dynamic_data && 
        f.data_source && 
        ['select', 'radio', 'checkbox'].includes(f.type)
      )
      .map(f => `${f.id}:${JSON.stringify(f.data_source)}:${JSON.stringify(f.dependency)}`)
      .join('|');
  }, [fields]);

  const dynamicFields = useMemo(() => {
    return fields.filter(f => 
      f.use_dynamic_data && 
      f.data_source && 
      ['select', 'radio', 'checkbox'].includes(f.type)
    );
  }, [dynamicFieldsKey]);

  // Build a map of field dependencies
  const dependencyMap = useMemo(() => {
    const map: Record<string, { parentFieldId: string; parentField: FormField | undefined }> = {};
    dynamicFields.forEach(field => {
      if (field.dependency?.parent_field_id) {
        map[field.id] = {
          parentFieldId: field.dependency.parent_field_id,
          parentField: fields.find(f => f.id === field.dependency?.parent_field_id),
        };
      }
    });
    return map;
  }, [dynamicFields, fields]);

  // Initialize with static options
  useEffect(() => {
    const staticOptions: Record<string, FieldOption[]> = {};
    fields.forEach(field => {
      if (!field.use_dynamic_data && field.options) {
        staticOptions[field.id] = field.options;
      }
    });
    setOptionsMap(prev => ({ ...prev, ...staticOptions }));
  }, [fields]);

  // Fetch options for a field with optional parent value filter
  const fetchFieldOptions = useCallback(async (
    field: FormField, 
    parentValue?: any
  ) => {
    if (!field.data_source || !field.use_dynamic_data) return;
    
    setLoadingFields(prev => new Set([...prev, field.id]));
    
    try {
      // Build data source with parent filter if cascading
      let dataSource: DynamicDataSource = { ...field.data_source };
      
      if (field.dependency && parentValue !== undefined && parentValue !== null && parentValue !== '') {
        // Add filter based on parent value
        const existingFilters = dataSource.filters || [];
        dataSource = {
          ...dataSource,
          filters: [
            ...existingFilters,
            {
              field: field.dependency.filter_field,
              operator: 'equals',
              value: parentValue,
            },
          ],
        };
      }
      
      const options = await dynamicDataService.fetchFieldOptions(dataSource);
      
      if (isMountedRef.current) {
        setOptionsMap(prev => ({ ...prev, [field.id]: options }));
        setErrors(prev => {
          const next = { ...prev };
          delete next[field.id];
          return next;
        });
        setPendingParent(prev => {
          const next = { ...prev };
          delete next[field.id];
          return next;
        });
      }
    } catch (error: any) {
      console.error(`Failed to fetch dynamic options for ${field.id}:`, error);
      if (isMountedRef.current) {
        setErrors(prev => ({ ...prev, [field.id]: error.message || 'Failed to load options' }));
        // Fallback to static options
        if (field.options) {
          setOptionsMap(prev => ({ ...prev, [field.id]: field.options! }));
        }
      }
    } finally {
      if (isMountedRef.current) {
        setLoadingFields(prev => {
          const next = new Set(prev);
          next.delete(field.id);
          return next;
        });
      }
    }
  }, []);

  // Fetch dynamic options - initial load and when parent values change
  useEffect(() => {
    isMountedRef.current = true;
    
    const fetchAll = async () => {
      for (const field of dynamicFields) {
        if (!field.data_source) continue;
        
        // Check if this field has a dependency
        const dep = dependencyMap[field.id];
        
        if (dep) {
          // This field depends on another - check if parent has a value
          const parentValue = formValues[dep.parentFieldId];
          const prevParentValue = parentValuesRef.current[dep.parentFieldId];
          
          if (parentValue === undefined || parentValue === null || parentValue === '') {
            // Parent not selected - mark as pending
            const parentLabel = dep.parentField 
              ? (dep.parentField.label_en || dep.parentField.label_fr) 
              : dep.parentFieldId;
            setPendingParent(prev => ({ ...prev, [field.id]: parentLabel }));
            setOptionsMap(prev => ({ ...prev, [field.id]: [] }));
            continue;
          }
          
          // Parent has value - fetch with filter
          const fieldKey = `${field.id}:${JSON.stringify(field.data_source)}:parent=${parentValue}`;
          
          // Re-fetch if parent value changed
          if (prevParentValue !== parentValue || !fetchedRef.current.has(fieldKey)) {
            fetchedRef.current.add(fieldKey);
            await fetchFieldOptions(field, parentValue);
          }
        } else {
          // No dependency - fetch normally
          const fieldKey = `${field.id}:${JSON.stringify(field.data_source)}`;
          if (fetchedRef.current.has(fieldKey)) continue;
          fetchedRef.current.add(fieldKey);
          
          await fetchFieldOptions(field);
        }
      }
      
      // Update parent values ref
      Object.keys(dependencyMap).forEach(fieldId => {
        const parentFieldId = dependencyMap[fieldId].parentFieldId;
        parentValuesRef.current[parentFieldId] = formValues[parentFieldId];
      });
    };

    if (dynamicFields.length > 0) {
      fetchAll();
    }
    
    return () => {
      isMountedRef.current = false;
    };
  }, [dynamicFieldsKey, dynamicFields, dependencyMap, formValues, fetchFieldOptions]);

  // Watch for parent value changes and refetch dependent fields
  useEffect(() => {
    Object.entries(dependencyMap).forEach(([fieldId, { parentFieldId, parentField }]) => {
      const currentParentValue = formValues[parentFieldId];
      const prevParentValue = parentValuesRef.current[parentFieldId];
      
      if (currentParentValue !== prevParentValue) {
        const field = fields.find(f => f.id === fieldId);
        if (field) {
          // Clear cache for this field
          const fieldKeyPattern = `${field.id}:`;
          for (const key of fetchedRef.current) {
            if (key.startsWith(fieldKeyPattern)) {
              fetchedRef.current.delete(key);
            }
          }
          
          if (currentParentValue === undefined || currentParentValue === null || currentParentValue === '') {
            const parentLabel = parentField 
              ? (parentField.label_en || parentField.label_fr) 
              : parentFieldId;
            setPendingParent(prev => ({ ...prev, [fieldId]: parentLabel }));
            setOptionsMap(prev => ({ ...prev, [fieldId]: [] }));
          } else {
            fetchFieldOptions(field, currentParentValue);
          }
        }
        
        // Update ref
        parentValuesRef.current[parentFieldId] = currentParentValue;
      }
    });
  }, [formValues, dependencyMap, fields, fetchFieldOptions]);

  const getFieldOptions = useCallback((fieldId: string): FieldOption[] => {
    return optionsMap[fieldId] || [];
  }, [optionsMap]);

  const isFieldLoading = useCallback((fieldId: string): boolean => {
    return loadingFields.has(fieldId);
  }, [loadingFields]);

  const getFieldError = useCallback((fieldId: string): string | null => {
    return errors[fieldId] || null;
  }, [errors]);
  
  const getPendingParent = useCallback((fieldId: string): string | null => {
    return pendingParent[fieldId] || null;
  }, [pendingParent]);
  
  // Refresh a specific field's dynamic options
  const refreshField = useCallback(async (fieldId: string) => {
    const field = fields.find(f => f.id === fieldId);
    if (!field?.data_source || !field.use_dynamic_data) return;
    
    // Remove from fetched cache to allow re-fetch
    for (const key of fetchedRef.current) {
      if (key.startsWith(`${fieldId}:`)) {
        fetchedRef.current.delete(key);
      }
    }
    
    // Check if has dependency
    const dep = dependencyMap[fieldId];
    const parentValue = dep ? formValues[dep.parentFieldId] : undefined;
    
    await fetchFieldOptions(field, parentValue);
  }, [fields, dependencyMap, formValues, fetchFieldOptions]);

  return {
    optionsMap,
    getFieldOptions,
    isFieldLoading,
    getFieldError,
    getPendingParent,
    isLoading: loadingFields.size > 0,
    refreshField,
    errors,
  };
}

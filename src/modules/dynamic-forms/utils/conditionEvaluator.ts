import { FormField, ConditionOperator } from '../types';

/**
 * Evaluates whether a field's condition is met based on current form values
 * @param field - The field with the condition
 * @param formValues - Current form values (field_id -> value)
 * @returns true if the field should be visible
 */
export function evaluateFieldVisibility(
  field: FormField,
  formValues: Record<string, any>
): boolean {
  // If no condition, field is always visible
  if (!field.condition || !field.condition.field_id) {
    return true;
  }

  const { field_id, operator, value: conditionValue } = field.condition;
  const action = field.condition_action || 'show';
  
  const sourceValue = formValues[field_id];
  const conditionMet = evaluateCondition(sourceValue, operator, conditionValue);
  
  // If action is 'show', field is visible when condition is met
  // If action is 'hide', field is visible when condition is NOT met
  return action === 'show' ? conditionMet : !conditionMet;
}

/**
 * Evaluates a single condition
 */
function evaluateCondition(
  sourceValue: any,
  operator: ConditionOperator,
  conditionValue?: string | number | boolean
): boolean {
  // Handle checkbox arrays - check if value is in array
  if (Array.isArray(sourceValue)) {
    switch (operator) {
      case 'equals':
        return sourceValue.includes(String(conditionValue));
      case 'not_equals':
        return !sourceValue.includes(String(conditionValue));
      case 'contains':
        return sourceValue.some(v => 
          String(v).toLowerCase().includes(String(conditionValue ?? '').toLowerCase())
        );
      case 'not_contains':
        return !sourceValue.some(v => 
          String(v).toLowerCase().includes(String(conditionValue ?? '').toLowerCase())
        );
      case 'is_empty':
        return sourceValue.length === 0;
      case 'is_not_empty':
        return sourceValue.length > 0;
      default:
        return true;
    }
  }

  // Normalize undefined/null to empty string for comparisons
  const normalizedSource = sourceValue ?? '';
  const normalizedCondition = conditionValue ?? '';
  
  switch (operator) {
    case 'equals':
      // Handle boolean values (checkbox single)
      if (typeof normalizedSource === 'boolean') {
        if (normalizedCondition === 'true' || normalizedCondition === true) return normalizedSource === true;
        if (normalizedCondition === 'false' || normalizedCondition === false) return normalizedSource === false;
      }
      return String(normalizedSource).toLowerCase() === String(normalizedCondition).toLowerCase();
      
    case 'not_equals':
      if (typeof normalizedSource === 'boolean') {
        if (normalizedCondition === 'true' || normalizedCondition === true) return normalizedSource !== true;
        if (normalizedCondition === 'false' || normalizedCondition === false) return normalizedSource !== false;
      }
      return String(normalizedSource).toLowerCase() !== String(normalizedCondition).toLowerCase();
      
    case 'contains':
      return String(normalizedSource).toLowerCase().includes(String(normalizedCondition).toLowerCase());
      
    case 'not_contains':
      return !String(normalizedSource).toLowerCase().includes(String(normalizedCondition).toLowerCase());
      
    case 'greater_than':
      return Number(normalizedSource) > Number(normalizedCondition);
      
    case 'less_than':
      return Number(normalizedSource) < Number(normalizedCondition);
      
    case 'is_empty':
      return normalizedSource === '' || 
             normalizedSource === null || 
             normalizedSource === undefined ||
             normalizedSource === false;
      
    case 'is_not_empty':
      return normalizedSource !== '' && 
             normalizedSource !== null && 
             normalizedSource !== undefined &&
             normalizedSource !== false;
      
    default:
      return true;
  }
}

/**
 * Gets all visible fields based on current form values
 */
export function getVisibleFields(
  fields: FormField[],
  formValues: Record<string, any>
): FormField[] {
  return fields.filter(field => evaluateFieldVisibility(field, formValues));
}

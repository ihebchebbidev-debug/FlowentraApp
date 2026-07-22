import { FormField, ConditionOperator } from '../types';

/**
 * Evaluates a single condition against a source value.
 * Exported so other evaluators (thank-you rules, export filters) share
 * exactly the same semantics — historically this was duplicated with
 * subtle divergence (see thankYouEvaluator).
 */
export function evaluateCondition(
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
      case 'greater_than':
        return sourceValue.length > Number(conditionValue);
      case 'less_than':
        return sourceValue.length < Number(conditionValue);
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
 * Evaluates whether a field's condition is met based on current form values
 */
export function evaluateFieldVisibility(
  field: FormField,
  formValues: Record<string, any>
): boolean {
  if (!field.condition || !field.condition.field_id) {
    return true;
  }

  const { field_id, operator, value: conditionValue } = field.condition;
  const action = field.condition_action || 'show';

  const sourceValue = formValues[field_id];
  const conditionMet = evaluateCondition(sourceValue, operator, conditionValue);

  return action === 'show' ? conditionMet : !conditionMet;
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

/**
 * Returns only the values belonging to currently-visible input fields, dropping
 * stale values left behind by fields that are now hidden by conditional logic.
 * Use this when persisting/submitting so hidden answers aren't saved.
 */
export function getVisibleValues(
  fields: FormField[],
  formValues: Record<string, any>
): Record<string, any> {
  const visibleIds = new Set(
    getVisibleFields(fields, formValues).map(f => f.id)
  );
  const result: Record<string, any> = {};
  for (const key of Object.keys(formValues)) {
    if (visibleIds.has(key)) result[key] = formValues[key];
  }
  return result;
}

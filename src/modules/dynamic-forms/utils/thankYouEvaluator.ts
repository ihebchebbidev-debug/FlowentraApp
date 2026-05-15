import { ThankYouSettings, ThankYouRule, ConditionOperator } from '../types';

/**
 * Evaluates a single condition against form values
 */
function evaluateCondition(
  sourceValue: any,
  operator: ConditionOperator,
  conditionValue?: string | number | boolean
): boolean {
  const normalizedSource = sourceValue ?? '';
  const normalizedCondition = conditionValue ?? '';
  
  switch (operator) {
    case 'equals':
      return String(normalizedSource).toLowerCase() === String(normalizedCondition).toLowerCase();
    case 'not_equals':
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
             (Array.isArray(normalizedSource) && normalizedSource.length === 0);
    case 'is_not_empty':
      return normalizedSource !== '' && 
             normalizedSource !== null && 
             normalizedSource !== undefined &&
             !(Array.isArray(normalizedSource) && normalizedSource.length === 0);
    default:
      return false;
  }
}

/**
 * Result of thank you page evaluation
 */
export interface ThankYouResult {
  title_en: string;
  title_fr: string;
  message_en: string;
  message_fr: string;
  redirect_url?: string;
  redirect_delay?: number;
  matchedRule?: ThankYouRule;
}

/**
 * Evaluates thank you settings against form responses to determine
 * which message/redirect to show
 * 
 * @param settings - The form's thank you settings
 * @param formValues - The submitted form values
 * @returns The appropriate thank you message and redirect info
 */
export function evaluateThankYouPage(
  settings: ThankYouSettings | undefined,
  formValues: Record<string, any>
): ThankYouResult {
  // Default fallback
  const defaultResult: ThankYouResult = {
    title_en: settings?.default_message?.title_en || 'Thank You!',
    title_fr: settings?.default_message?.title_fr || 'Merci !',
    message_en: settings?.default_message?.message_en || 'Your response has been recorded.',
    message_fr: settings?.default_message?.message_fr || 'Votre réponse a été enregistrée.',
    redirect_url: settings?.default_message?.enable_redirect ? settings.default_message.redirect_url : undefined,
    redirect_delay: settings?.default_message?.redirect_delay || 3,
  };

  // If no rules, return default
  if (!settings?.rules || settings.rules.length === 0) {
    return defaultResult;
  }

  // Sort rules by priority (lower = higher priority)
  const sortedRules = [...settings.rules].sort((a, b) => (a.priority || 999) - (b.priority || 999));

  // Find first matching rule
  for (const rule of sortedRules) {
    if (!rule.condition || !rule.condition.field_id) {
      continue;
    }

    const sourceValue = formValues[rule.condition.field_id];
    const conditionMet = evaluateCondition(
      sourceValue,
      rule.condition.operator,
      rule.condition.value
    );

    if (conditionMet) {
      return {
        title_en: rule.title_en || rule.message_en.split('.')[0] || 'Thank You!',
        title_fr: rule.title_fr || rule.message_fr.split('.')[0] || 'Merci !',
        message_en: rule.message_en,
        message_fr: rule.message_fr,
        redirect_url: rule.redirect_url || undefined,
        redirect_delay: rule.redirect_delay || 3,
        matchedRule: rule,
      };
    }
  }

  // No rules matched, return default
  return defaultResult;
}

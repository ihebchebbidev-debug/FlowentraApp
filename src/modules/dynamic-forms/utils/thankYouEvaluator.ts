import { ThankYouSettings, ThankYouRule } from '../types';
import { evaluateCondition } from './conditionEvaluator';
import { sanitizeExternalUrl } from './formValidation';

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
 * Derive a short title from a longer message when the admin didn't provide one.
 * Uses the first sentence, capped to 80 characters. Falls back to a default
 * so we never render the full message as both title and body.
 */
function deriveTitle(message: string | undefined, fallback: string): string {
  if (!message) return fallback;
  const firstSentence = message.split(/[.!?]/)[0]?.trim();
  if (!firstSentence) return fallback;
  if (firstSentence.length === message.trim().length) {
    // No sentence terminator found — don't duplicate the whole message.
    return fallback;
  }
  return firstSentence.length > 80 ? firstSentence.slice(0, 77) + '…' : firstSentence;
}

/**
 * Evaluates thank you settings against form responses to determine
 * which message/redirect to show.
 */
export function evaluateThankYouPage(
  settings: ThankYouSettings | undefined,
  formValues: Record<string, any>
): ThankYouResult {
  const defaultRedirect = settings?.default_message?.enable_redirect
    ? sanitizeExternalUrl(settings.default_message.redirect_url) || undefined
    : undefined;

  const defaultResult: ThankYouResult = {
    title_en: settings?.default_message?.title_en || 'Thank You!',
    title_fr: settings?.default_message?.title_fr || 'Merci !',
    message_en: settings?.default_message?.message_en || 'Your response has been recorded.',
    message_fr: settings?.default_message?.message_fr || 'Votre réponse a été enregistrée.',
    redirect_url: defaultRedirect,
    redirect_delay: settings?.default_message?.redirect_delay || 3,
  };

  if (!settings?.rules || settings.rules.length === 0) {
    return defaultResult;
  }

  // Sort rules by priority (lower = higher priority)
  const sortedRules = [...settings.rules].sort(
    (a, b) => (a.priority || 999) - (b.priority || 999)
  );

  for (const rule of sortedRules) {
    if (!rule.condition || !rule.condition.field_id) continue;

    const sourceValue = formValues[rule.condition.field_id];
    const conditionMet = evaluateCondition(
      sourceValue,
      rule.condition.operator,
      rule.condition.value
    );

    if (conditionMet) {
      return {
        title_en: rule.title_en || deriveTitle(rule.message_en, 'Thank You!'),
        title_fr: rule.title_fr || deriveTitle(rule.message_fr, 'Merci !'),
        message_en: rule.message_en,
        message_fr: rule.message_fr,
        redirect_url: sanitizeExternalUrl(rule.redirect_url) || undefined,
        redirect_delay: rule.redirect_delay || 3,
        matchedRule: rule,
      };
    }
  }

  return defaultResult;
}

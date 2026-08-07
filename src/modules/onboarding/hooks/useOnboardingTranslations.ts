import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

// Import translation files
import enTranslations from '../locales/en.json';
import frTranslations from '../locales/fr.json';

export const useOnboardingTranslations = () => {
  const { i18n } = useTranslation();

  useEffect(() => {
    // Get current language from localStorage or current i18n language
    const currentLanguage = localStorage.getItem('language') || i18n.language;
    
    // Add onboarding translations to i18n
    i18n.addResourceBundle('en', 'translation', enTranslations, true, true);
    i18n.addResourceBundle('fr', 'translation', frTranslations, true, true);
    
    // Ensure we maintain the user's language preference
    if (currentLanguage !== i18n.language) {
      i18n.changeLanguage(currentLanguage);
    }
  }, [i18n]);

  return { i18n };
};

export default useOnboardingTranslations;
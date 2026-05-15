import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import enTranslations from '../locale/en.json';
import frTranslations from '../locale/fr.json';

export const useExternalTranslations = () => {
  const { i18n } = useTranslation();

  useEffect(() => {
    const currentLanguage = localStorage.getItem('language') || i18n.language;
    i18n.addResourceBundle('en', 'translation', enTranslations, true, true);
    i18n.addResourceBundle('fr', 'translation', frTranslations, true, true);
    if (currentLanguage !== i18n.language) {
      i18n.changeLanguage(currentLanguage);
    }
  }, [i18n]);

  return { i18n };
};

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en.json';
import ru from './locales/ru.json';
import uz from './locales/uz.json';

const LANGUAGE_COOKIE_NAME = 'mezon_language';

// Cookie helper functions
const getCookie = (name: string): string | null => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || null;
  }
  return null;
};

const setCookie = (name: string, value: string, days: number = 365) => {
  const date = new Date();
  date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
  const expires = `expires=${date.toUTCString()}`;
  document.cookie = `${name}=${value};${expires};path=/`;
};

// Get initial language from cookie or use default
const getInitialLanguage = (): string => {
  const savedLanguage = getCookie(LANGUAGE_COOKIE_NAME);
  if (savedLanguage && ['ru', 'en', 'uz'].includes(savedLanguage)) {
    return savedLanguage;
  }
  return 'ru'; // Default to Russian
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ru: { translation: ru },
      uz: { translation: uz },
    },
    lng: getInitialLanguage(),
    fallbackLng: 'ru',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['cookie', 'localStorage', 'navigator'],
      caches: ['cookie'],
      cookieMinutes: 525600, // 1 year
      cookieDomain: window.location.hostname,
    },
  });

// Save language to cookie whenever it changes
i18n.on('languageChanged', (lng) => {
  setCookie(LANGUAGE_COOKIE_NAME, lng);
});

export default i18n;
export { getCookie, setCookie, LANGUAGE_COOKIE_NAME };

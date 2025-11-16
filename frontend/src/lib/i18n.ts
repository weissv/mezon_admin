// src/lib/i18n.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import enCommon from '../locales/en/common.json';
import enChildren from '../locales/en/children.json';
import enEmployees from '../locales/en/employees.json';

import ruCommon from '../locales/ru/common.json';
import ruChildren from '../locales/ru/children.json';
import ruEmployees from '../locales/ru/employees.json';

import uzCommon from '../locales/uz/common.json';
import uzChildren from '../locales/uz/children.json';
import uzEmployees from '../locales/uz/employees.json';

import kzCommon from '../locales/kz/common.json';
import kzChildren from '../locales/kz/children.json';
import kzEmployees from '../locales/kz/employees.json';

const resources = {
  en: {
    common: enCommon,
    children: enChildren,
    employees: enEmployees,
  },
  ru: {
    common: ruCommon,
    children: ruChildren,
    employees: ruEmployees,
  },
  uz: {
    common: uzCommon,
    children: uzChildren,
    employees: uzEmployees,
  },
  kz: {
    common: kzCommon,
    children: kzChildren,
    employees: kzEmployees,
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'ru',
    defaultNS: 'common',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18n;

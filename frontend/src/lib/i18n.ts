// src/lib/i18n.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import enCommon from '../locales/en/common.json';
import enChildren from '../locales/en/children.json';
import enEmployees from '../locales/en/employees.json';
import enLogin from '../locales/en/login.json';
import enDashboard from '../locales/en/dashboard.json';
import enBranches from '../locales/en/branches.json';
import enPages from '../locales/en/pages.json';

import ruCommon from '../locales/ru/common.json';
import ruChildren from '../locales/ru/children.json';
import ruEmployees from '../locales/ru/employees.json';
import ruLogin from '../locales/ru/login.json';
import ruDashboard from '../locales/ru/dashboard.json';
import ruBranches from '../locales/ru/branches.json';
import ruPages from '../locales/ru/pages.json';

import uzCommon from '../locales/uz/common.json';
import uzChildren from '../locales/uz/children.json';
import uzEmployees from '../locales/uz/employees.json';
import uzLogin from '../locales/uz/login.json';
import uzDashboard from '../locales/uz/dashboard.json';
import uzBranches from '../locales/uz/branches.json';
import uzPages from '../locales/uz/pages.json';

const resources = {
  en: {
    common: enCommon,
    children: enChildren,
    employees: enEmployees,
    login: enLogin,
    dashboard: enDashboard,
    branches: enBranches,
    pages: enPages,
  },
  ru: {
    common: ruCommon,
    children: ruChildren,
    employees: ruEmployees,
    login: ruLogin,
    dashboard: ruDashboard,
    branches: ruBranches,
    pages: ruPages,
  },
  uz: {
    common: uzCommon,
    children: uzChildren,
    employees: uzEmployees,
    login: uzLogin,
    dashboard: uzDashboard,
    branches: uzBranches,
    pages: uzPages,
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

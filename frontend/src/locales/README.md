# Internationalization (i18n) Documentation

## Overview

This directory contains translation files for the Mezon Admin application. The application supports multiple languages using i18next and react-i18next.

## Supported Languages

- 🇷🇺 **Russian (ru)** - Primary language / Fallback
- 🇬🇧 **English (en)** - International language
- 🇺🇿 **Uzbek (uz)** - Local language requirement
- 🇰🇿 **Kazakh (kz)** - Regional language support

## Directory Structure

```
locales/
├── en/
│   ├── common.json      # Navigation, actions, common UI elements
│   ├── children.json    # Children management page
│   └── employees.json   # Employee management page
├── ru/
│   ├── common.json
│   ├── children.json
│   └── employees.json
├── uz/
│   ├── common.json
│   ├── children.json
│   └── employees.json
└── kz/
    ├── common.json
    ├── children.json
    └── employees.json
```

## Using Translations in Components

### Basic Usage

```tsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation('common'); // namespace
  
  return (
    <div>
      <h1>{t('navigation.dashboard')}</h1>
      <button>{t('actions.save')}</button>
    </div>
  );
}
```

### Using Multiple Namespaces

```tsx
import { useTranslation } from 'react-i18next';

function ChildrenPage() {
  const { t } = useTranslation(['children', 'common']);
  
  return (
    <div>
      <h1>{t('title')}</h1> {/* from children namespace */}
      <button>{t('common:actions.save')}</button> {/* from common namespace */}
    </div>
  );
}
```

### Using Interpolation

```tsx
// Translation: "absencesTitle": "Absences - {{firstName}} {{lastName}}"
const title = t('absencesTitle', { 
  firstName: 'John', 
  lastName: 'Doe' 
});
// Result: "Absences - John Doe"
```

## Language Selector

The application includes a language selector component (`LanguageSelector.tsx`) that allows users to switch between languages. It:

- Displays country flags for each language
- Saves the selected language to localStorage
- Automatically applies the selected language across the application

## Adding New Translations

### For Existing Pages

1. Add new keys to the appropriate JSON files in all language directories
2. Use the translation keys in your components with `t('key')`

### For New Pages

1. Create a new JSON file for each language (e.g., `dashboard.json`)
2. Add translations for all supported languages
3. Import the translations in `src/lib/i18n.ts`:

```typescript
import enDashboard from '../locales/en/dashboard.json';
import ruDashboard from '../locales/ru/dashboard.json';
// ... etc

const resources = {
  en: {
    common: enCommon,
    dashboard: enDashboard, // Add here
    // ...
  },
  // ... other languages
};
```

## Translation Key Conventions

- Use dot notation for nested keys: `navigation.dashboard`
- Group related translations together
- Use descriptive key names
- Common actions should be in `common.json`
- Page-specific translations should be in dedicated files

## Date and Number Formatting

Use the browser's Intl API for locale-aware formatting:

```tsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { i18n } = useTranslation();
  
  // Date formatting
  const formattedDate = new Intl.DateTimeFormat(i18n.language).format(new Date());
  
  // Number formatting
  const formattedNumber = new Intl.NumberFormat(i18n.language).format(1234567.89);
  
  // Currency formatting
  const formattedCurrency = new Intl.NumberFormat(i18n.language, {
    style: 'currency',
    currency: 'USD'
  }).format(1234.56);
}
```

## Testing Translations

1. Start the development server
2. Use the language selector to switch between languages
3. Verify all text updates correctly
4. Check for missing translations (will display the key if missing)
5. Test with long text to ensure UI doesn't break

## Best Practices

1. **Always provide translations for all languages** when adding new keys
2. **Keep translations consistent** across similar contexts
3. **Use placeholders** for dynamic content (e.g., names, numbers)
4. **Test with all languages** before committing
5. **Document context** for translators when meaning might be ambiguous
6. **Avoid hardcoded strings** in components - always use translation keys
7. **Group related keys** together for better organization

## Configuration

The i18n configuration is in `src/lib/i18n.ts`:

- **Default language**: Russian (ru)
- **Fallback language**: Russian (ru)
- **Detection order**: localStorage → browser language
- **Storage**: localStorage

## Troubleshooting

**Translation not showing:**
- Check if the key exists in all language files
- Verify the namespace is loaded in the component
- Check browser console for i18n errors

**Language not changing:**
- Clear localStorage
- Check if language code is correct (ru, en, uz, kz)
- Restart development server

**Missing translation warning:**
- Add the missing key to all language files
- Use the fallback language (Russian) as reference

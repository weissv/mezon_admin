# Internationalization (i18n) Implementation Guide

## Overview

The Mezon Admin application now supports three languages:
- **Russian (Русский)** - Default language
- **English** - International support
- **Uzbek (O'zbekcha)** - Local language support

Language preferences are automatically saved in cookies and persist across sessions.

## Implementation Details

### Technologies Used
- **i18next** - Core internationalization framework
- **react-i18next** - React bindings for i18next
- **i18next-browser-languagedetector** - Automatic language detection

### File Structure
```
frontend/src/i18n/
├── index.ts                 # i18n configuration and initialization
└── locales/
    ├── ru.json             # Russian translations
    ├── en.json             # English translations
    └── uz.json             # Uzbek translations
```

### Cookie Storage
- Cookie name: `mezon_language`
- Expiration: 365 days (1 year)
- Domain: Automatically set based on current hostname
- Path: `/` (site-wide)

## Usage

### Using Translations in Components

```tsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{t('nav.dashboard')}</h1>
      <button>{t('common.save')}</button>
    </div>
  );
}
```

### Language Selector Component

The `LanguageSelector` component is available in all layouts:
- **MainLayout** - Top navigation bar (right side)
- **AuthLayout** - Top right corner of login page

Users can click the language selector to switch between languages. The selection is immediately saved to cookies.

## Translation Structure

### Available Translation Keys

#### Common
- `common.loading`, `common.save`, `common.cancel`, `common.delete`, `common.edit`
- `common.add`, `common.create`, `common.search`, `common.filter`
- `common.export`, `common.import`, `common.yes`, `common.no`
- `common.confirm`, `common.close`, `common.back`, `common.next`
- `common.submit`, `common.reset`, `common.actions`, `common.status`

#### Navigation
- `nav.dashboard`, `nav.children`, `nav.employees`, `nav.clubs`
- `nav.attendance`, `nav.finance`, `nav.inventory`, `nav.menu`
- `nav.recipes`, `nav.procurement`, `nav.maintenance`, `nav.security`
- `nav.documents`, `nav.calendar`, `nav.feedback`, `nav.integration`
- `nav.actionLog`, `nav.notifications`, `nav.branches`

#### Authentication
- `auth.login`, `auth.logout`, `auth.username`, `auth.password`
- `auth.loginTitle`, `auth.loginSubtitle`, `auth.loginButton`
- `auth.loginSuccess`, `auth.loginError`, `auth.invalidCredentials`

#### Domain Sections
Each domain (children, employees, clubs, etc.) has its own translation keys:
- `[domain].title` - Page title
- `[domain].add[Entity]` - Add button text
- `[domain].edit[Entity]` - Edit button text
- `[domain].delete[Entity]` - Delete button text
- Field-specific translations (name, description, etc.)

### Example Translation Keys

```json
{
  "common": {
    "save": "Сохранить",
    "cancel": "Отмена"
  },
  "clubs": {
    "title": "Кружки и секции",
    "addClub": "Добавить кружок",
    "name": "Название",
    "description": "Описание"
  }
}
```

## Adding New Translations

### 1. Add to Translation Files

Add the same key to all three language files:

**ru.json**
```json
{
  "mySection": {
    "myKey": "Моё значение"
  }
}
```

**en.json**
```json
{
  "mySection": {
    "myKey": "My value"
  }
}
```

**uz.json**
```json
{
  "mySection": {
    "myKey": "Mening qiymatim"
  }
}
```

### 2. Use in Component

```tsx
const { t } = useTranslation();
return <div>{t('mySection.myKey')}</div>;
```

## Updated Components

The following components have been fully internationalized:

### Layouts
- ✅ `MainLayout` - Includes language selector in top bar
- ✅ `AuthLayout` - Includes language selector in top right

### Components
- ✅ `SideNav` - All navigation items and footer text
- ✅ `LanguageSelector` - Language switching component

### Pages
- ✅ `LoginPage` - Complete login form and landing page content
- ✅ `NotFoundPage` - 404 error page
- ✅ `BranchesPage` - Branches management
- ✅ `ClubsPage` - Clubs and sections management

## Testing

### Manual Testing
1. Open the application
2. Click on the language selector (globe icon)
3. Select a different language
4. Verify all text changes to the selected language
5. Refresh the page - language preference should persist
6. Check browser cookies - `mezon_language` should be set

### Testing Different Pages
- Navigate to different pages and verify translations
- Test forms, buttons, and error messages
- Verify that dynamic content (toast notifications) is translated

## Browser Cookie Inspection

To verify cookie storage:
1. Open browser DevTools (F12)
2. Go to Application/Storage tab
3. Check Cookies section
4. Look for `mezon_language` cookie
5. Verify it contains: `ru`, `en`, or `uz`

## Language Detection Order

The system detects language in this priority:
1. **Cookie** - Saved preference (highest priority)
2. **localStorage** - Fallback storage
3. **Browser** - Browser's language settings
4. **Default** - Russian (ru)

## Future Improvements

### Recommended Next Steps
1. **Translate Remaining Pages**
   - DashboardPage
   - ChildrenPage
   - EmployeesPage
   - AttendancePage
   - FinancePage
   - InventoryPage
   - MenuPage
   - RecipesPage
   - ProcurementPage
   - MaintenancePage
   - SecurityPage
   - DocumentsPage
   - CalendarPage
   - FeedbackPage
   - NotificationsPage
   - ActionLogPage
   - IntegrationPage

2. **Add Date/Time Localization**
   - Use `date-fns` with locale support
   - Format dates according to language

3. **Number Formatting**
   - Currency formatting (UZS, RUB, USD)
   - Number separators based on locale

4. **RTL Support** (if needed for future languages)
   - Add RTL layout support
   - Mirror UI for RTL languages

5. **Translation Management**
   - Consider using a translation management platform
   - Add translation validation in CI/CD

## Troubleshooting

### Language Not Changing
- Check browser console for errors
- Verify translation keys exist in all language files
- Clear browser cookies and try again

### Cookie Not Saving
- Check if cookies are enabled in browser
- Verify domain settings in i18n config
- Check for cookie-blocking extensions

### Missing Translations
- Check browser console for missing key warnings
- Verify the key exists in the translation file
- Ensure the key path is correct (e.g., `nav.dashboard` not `dashboard`)

## Development Notes

### TypeScript Support
For better TypeScript support, you can create type definitions:

```typescript
// types/i18n.d.ts
import 'react-i18next';
import ru from '../i18n/locales/ru.json';

declare module 'react-i18next' {
  interface CustomTypeOptions {
    resources: {
      translation: typeof ru;
    };
  }
}
```

### Hot Reload
During development, translation changes require a page refresh to take effect.

## Contact

For questions or issues with internationalization:
- Check the implementation in `/frontend/src/i18n/`
- Review updated components for usage examples
- Contact the development team

---

**Last Updated:** November 2025  
**Version:** 1.0.0
